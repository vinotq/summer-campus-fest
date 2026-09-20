#!/usr/bin/env bash
# Удалённая часть деплоя: выполняется на VPS. Файл доставляет туда rsync,
# а запускается он по пути:
#   ssh ... "IMAGE_TAG=… bash /opt/captcha/deploy/remote-deploy.sh" < /dev/null
#
# Отдельным файлом, а не heredoc внутри workflow: у heredoc с отступом
# терминатор не распознаётся (`<<EOF` требует EOF в начале строки, а внутри
# YAML-блока `run: |` этого не сделать), из-за чего часть скрипта молча
# уезжает в тело документа.
#
# Ожидает в окружении: IMAGE_TAG.
#
# Важно: скрипт запускается по пути на VPS, а не подаётся в `bash -s` через
# stdin. Внутри есть команды с `docker compose exec -T`, а они вычитывают
# stdin до конца — поданный туда скрипт они попросту съедают, и деплой молча
# обрывается на середине с кодом 0. Поэтому же у таких команд стоит
# `</dev/null`.
set -euo pipefail

ROOT=/opt/captcha
DOMAIN=captcha.sirius-campus.ru
PORT=8084
cd "$ROOT"

: "${IMAGE_TAG:?IMAGE_TAG не задан}"
export IMAGE_TAG

# Минуты GitHub Actions на приватных репозиториях недоступны (биллинг), поэтому
# образы собираются прямо здесь. Сборка лёгкая: Vite отдаёт бандл на 400 КБ
# за секунды, это не Next.js с его пиком в полтора гигабайта.
: "${LOCAL_IMAGES:=1}"

echo "==> проверка окружения"
# .env создаётся на машине руками и в git не хранится. Без него приложение
# поднимется с пустым паролем администратора — падать надо здесь, а не через
# два шага с невнятной ошибкой.
if [ ! -f "$ROOT/.env" ]; then
  echo "ОШИБКА: $ROOT/.env отсутствует. Создайте его по deploy/SETUP.md, шаг 3." >&2
  exit 1
fi
# COOKIE_SECRET в списке намеренно: с пустым значением куки подписываются
# пустым ключом, и сессию администратора можно подделать. Это должно падать
# до `up -d`, а не обнаруживаться потом.
for v in ADMIN_LOGIN ADMIN_PASSWORD_HASH COOKIE_SECRET; do
  if ! grep -qE "^\s*$v=.+" "$ROOT/.env"; then
    echo "ОШИБКА: в $ROOT/.env не задан $v" >&2
    exit 1
  fi
done

# Каталоги данных создаём до первого `up -d`. Иначе их сделает докер — от root
# и с неверными правами, а app пишет туда загрузки под своим пользователем.
mkdir -p "$ROOT/data/uploads"

echo "==> бэкап базы"
if docker compose ps --status running --services 2>/dev/null | grep -qx app; then
  "$ROOT/deploy/backup-db.sh"
else
  echo "app не запущено — первый деплой, бэкап пропущен"
fi

# Диск на VPS ограничен (занято 79%), поэтому старые слои чистим на каждом
# деплое, а не когда место кончится.
docker image prune -f --filter 'until=168h' || true

echo "==> сборка образов"
if [ "$LOCAL_IMAGES" = "1" ]; then
  docker compose build
else
  docker compose pull app web
fi

echo "==> обновление контейнеров"
docker compose up -d

# nginx резолвит адреса контейнеров один раз, при старте, и держит их в кеше.
# Пересозданный app получает новый адрес в докер-сети, а nginx продолжает
# стучаться по старому — это даёт 502 на всех страницах при полностью живых
# контейнерах. Перечитывание конфигурации заставляет резолвить заново.
docker compose exec -T web </dev/null nginx -s reload 2>/dev/null \
  || echo "nginx в контейнере перечитать не удалось — проверьте вручную"

echo "==> конфигурация хостового nginx"
sudo mkdir -p /etc/nginx/captcha-ssl /var/www/certbot
sudo cp "$ROOT/deploy/host-nginx.conf" /etc/nginx/sites-available/captcha
sudo ln -sf /etc/nginx/sites-available/captcha /etc/nginx/sites-enabled/captcha

# SSL-конфиг подключаем только когда сертификат уже выпущен, иначе nginx -t
# упадёт на отсутствующем fullchain.pem — а вместе с ним сломается reload
# для ВСЕХ сайтов машины, включая «Старт», ЛКП и sirius-eviction.
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  sudo cp "$ROOT/deploy/host-nginx-ssl.conf" /etc/nginx/captcha-ssl/captcha.conf
  HAVE_TLS=1
else
  echo "сертификат ещё не выпущен — SSL-конфиг не подключён, см. deploy/SETUP.md, шаг 5"
  HAVE_TLS=0
fi

sudo nginx -t
sudo systemctl reload nginx

# Смотрим, виден ли наш vhost в дампе конфигурации. Это подсказка, а не
# приговор: `nginx -T` на этой машине включает несколько наборов файлов сразу,
# пробел в директиве может быть двойным, а сам дамп — уехать в stderr.
# Ошибаться из-за формы вывода деплой не должен: настоящая проверка ниже.
if sudo nginx -T 2>/dev/null | grep -qE "server_name[[:space:]]+${DOMAIN//./\\.}"; then
  echo "vhost $DOMAIN в конфигурации есть"
else
  echo "ВНИМАНИЕ: не нашёл vhost $DOMAIN в выводе nginx -T." >&2
  sudo nginx -T 2>/dev/null | grep -n 'captcha' | head -20 >&2 || true
  ls -la /etc/nginx/sites-enabled/ /etc/nginx/captcha-ssl/ 2>/dev/null >&2 || true
fi

# ── Проверка, что развернулось именно то, что выкладывали ────────────────────
#
# «Деплой зелёный» и «на сайте новая версия» — разные утверждения. Выкладка
# может пройти без единой ошибки, пока сайт отдаёт сборку месячной давности:
# контейнер не пересоздался, домен смотрит на другой стек, nginx проксирует
# на чужой порт. Ниже — две проверки, закрывающие всё это разом.

echo "==> проверка: контейнеры подняты из образов этого деплоя"
for svc in app web; do
  want=$(docker image inspect --format '{{.Id}}' "ghcr.io/vinotq/captcha-$svc:$IMAGE_TAG")
  got=$(docker inspect --format '{{.Image}}' "$(docker compose ps -q "$svc")")
  if [ "$want" != "$got" ]; then
    echo "ОШИБКА: контейнер $svc работает не на образе этого деплоя." >&2
    echo "        выложено: $want" >&2
    echo "        работает: $got" >&2
    echo "        Обычно это значит, что compose не пересоздал контейнер." >&2
    exit 1
  fi
done

echo "==> проверка: сайт отдаёт эту версию"
# Ходим по публичному адресу, а не в 127.0.0.1:$PORT: проверять надо тот путь,
# которым пользуются люди, вместе с хостовым nginx и его upstream. Так ловится
# случай, когда домен обслуживает совсем другой, давно забытый стек.
# Пока сертификата нет, публичный путь недоступен — тогда спрашиваем порт
# напрямую и громко говорим, что проверка слабее.
if [ "$HAVE_TLS" = "1" ]; then
  HEALTH_URL="https://$DOMAIN/api/health"
else
  HEALTH_URL="http://127.0.0.1:$PORT/api/health"
  echo "ВНИМАНИЕ: публичный путь НЕ проверяется, спрашиваем $HEALTH_URL." >&2
  echo "          Это до выпуска сертификата. Вернуть проверку сразу после." >&2
fi

short="${IMAGE_TAG:0:12}"
live=""
for _ in 1 2 3 4 5 6 7 8 9 10; do
  live=$(curl -fsS --max-time 10 "$HEALTH_URL" 2>/dev/null \
         | sed -n 's/.*"version" *: *"\([^"]*\)".*/\1/p') || true
  [ "$live" = "$short" ] && break
  sleep 3
done

if [ "$live" != "$short" ]; then
  echo "ОШИБКА: $HEALTH_URL отдаёт версию '${live:-нет ответа}'," >&2
  echo "        а выложена '$short'. Контейнеры обновились, а сайт — нет." >&2
  echo "        Смотреть: на какой upstream смотрит vhost captcha в host-nginx" >&2
  echo "        и не занял ли порт $PORT второй стек" >&2
  echo "        (docker ps --format '{{.Names}}\t{{.Ports}}')." >&2
  exit 1
fi
echo "сайт отдаёт версию $short"

docker compose ps
echo "deploy done"
