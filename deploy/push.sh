#!/usr/bin/env bash
# Выкладка с ноутбука. Делает ровно то же, что делал бы workflow:
# rsync каталога на VPS, затем deploy/remote-deploy.sh по месту.
#
# ЗАПУСКАТЬ У СЕБЯ, из корня репозитория:
#   ./deploy/push.sh
#   VPS=root@153.80.184.234 ./deploy/push.sh
#
# Actions на приватных репозиториях выключены из-за биллинга, поэтому
# основной путь выкладки сейчас этот. Вывод сборки идёт в этот же терминал,
# команда держится до конца: молчаливая фоновая выкладка — то, из-за чего
# потом сутками ищут, почему на сайте старый код.
set -euo pipefail

VPS=${VPS:-root@153.80.184.234}
VPS_PORT=${VPS_PORT:-22}
APP_DIR=${APP_DIR:-/opt/captcha}

cd "$(dirname "$0")/.."

# Тег образа — хеш текущего коммита. По нему /api/health отвечает версией,
# и remote-deploy.sh сверяет, что сайт отдаёт именно эту сборку.
IMAGE_TAG=$(git rev-parse HEAD)

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ВНИМАНИЕ: в рабочем дереве есть незакоммиченные правки." >&2
  echo "          Уедут они (rsync шлёт файлы как есть), а тег образа будет" >&2
  echo "          от коммита ${IMAGE_TAG:0:12} — версии разойдутся." >&2
  printf "          Продолжить? [y/N] " >&2
  read -r ans </dev/tty
  [ "$ans" = "y" ] || { echo "отменено"; exit 1; }
fi

echo "==> rsync в $VPS:$APP_DIR"
# .env и data исключены намеренно: первый заводится на машине руками и в git
# не хранится, во втором живут база и загрузки к вопросам — --delete снёс бы
# их вместе с результатами игроков.
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'web/dist' \
  --exclude '.env' \
  --exclude 'data' \
  --exclude '*.zip' \
  -e "ssh -p $VPS_PORT -o StrictHostKeyChecking=accept-new" \
  ./ "$VPS:$APP_DIR/"

echo "==> выкладка на $VPS"
# Скрипт запускается ПО ПУТИ на VPS, а не подаётся в `bash -s` через stdin:
# внутри есть `docker compose exec -T`, а он вычитывает stdin до конца и
# проглатывает непрочитанный хвост скрипта. Деплой тогда выходит с кодом 0,
# не сделав ни сборки, ни подъёма контейнеров.
ssh -p "$VPS_PORT" -o StrictHostKeyChecking=accept-new "$VPS" \
  "IMAGE_TAG='$IMAGE_TAG' LOCAL_IMAGES=1 bash $APP_DIR/deploy/remote-deploy.sh" < /dev/null
