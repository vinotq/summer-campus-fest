# Первичная настройка VPS — captcha.sirius-campus.ru

Делается один раз. Дальше выкладка — `deploy/push.sh` с ноутбука
(или workflow по пушу, когда починится биллинг GitHub Actions).

## Состояние VPS (снято 20.09.2026)

Машина общая, на ней уже живут четыре проекта. Это определяет решения ниже.

| Параметр | Значение | Следствие |
|---|---|---|
| CPU / RAM | 2 ядра, 3.9 ГБ (свободно ~2 ГБ, своп занят на 167 МБ) | образы собираются **на месте**: сборка Vite — секунды и десятки мегабайт, ради неё не нужен внешний раннер |
| Диск | 59 ГБ, занято 79% (свободно 13 ГБ) | `docker image prune` на каждом деплое |
| Соседи | `sirius-eviction`, `sirius-campus`, `concur`, «Старт», ЛКП | у всех наших сервисов выставлен `mem_limit` |
| nginx | **1.18.0** (Ubuntu 22.04) | директива `http2 on;` не поддерживается — только `listen 443 ssl http2;` |
| `listen 80 default_server` | занят `sirius-eviction` | в нашем vhost `default_server` не указывать |
| Зоны лимитов | `api_rl`, `login_rl`, `conn_lim`, `start_*` уже объявлены | наши названы `captcha_api_rl`, `captcha_login_rl`, `captcha_conn` |
| Порты | 8080 — eviction, 8082 — «Старт», 8083 — ЛКП | наш контейнерный nginx слушает `127.0.0.1:8084` |
| DNS | `captcha.sirius-campus.ru` → 153.80.184.234 уже есть | шаг 1 можно пропустить |
| Доступ | работа идёт от `root` | `sudo` работает без настройки |

Корень `sirius-campus.ru` принадлежит `sirius-eviction` и отдаёт 404 —
наш домен только `captcha.sirius-campus.ru`, отдельным vhost.

## 1. DNS

Уже настроен: `captcha.sirius-campus.ru` → 153.80.184.234. Проверка:

```bash
getent hosts captcha.sirius-campus.ru
```

## 2. Каталог

```bash
mkdir -p /opt/captcha/data/uploads
```

Деплой ходит под `root`, как и для соседних проектов, поэтому отдельный
пользователь и правила в `/etc/sudoers.d/` не нужны.

## 3. `.env`

Файл не в git и исключён из rsync — создаётся руками один раз.

```bash
cat > /opt/captcha/.env <<'ENVEOF'
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

DATA_DIR=/data
DB_FILE=/data/db.sqlite
UPLOADS_DIR=/data/uploads
UPLOAD_MAX_BYTES=5242880

ADMIN_LOGIN=admin
# node server/scripts/hash-password.js 'пароль'
# Формат scrypt:salt:key — через двоеточие, не через $:
# знак доллара docker compose съест как подстановку переменной.
ADMIN_PASSWORD_HASH=СМЕНИТЬ

# Минимум 32 символа: openssl rand -hex 32
COOKIE_SECRET=СМЕНИТЬ
ENVEOF

chmod 600 /opt/captcha/.env
```

Хэш пароля считается тем же образом, что потом его проверяет:

```bash
cd /opt/captcha
docker compose run --rm app node /app/server/scripts/hash-password.js 'пароль'
```

`remote-deploy.sh` падает до `up -d`, если `ADMIN_LOGIN`,
`ADMIN_PASSWORD_HASH` или `COOKIE_SECRET` пустые. С пустым `COOKIE_SECRET`
куки администратора подписывались бы пустым ключом.

## 4. Первый деплой

С ноутбука, из корня репозитория:

```bash
./deploy/push.sh
```

Скрипт делает rsync каталога на VPS и запускает там `remote-deploy.sh`.
На первом прогоне сертификата ещё нет, поэтому SSL-конфиг не подключается —
это ожидаемо, в логе будет «сертификат ещё не выпущен».

## 5. Сертификат

Редирект на HTTPS трогать не нужно: в `deploy/host-nginx.conf` блок
`location /.well-known/acme-challenge/` объявлен отдельно и как более
специфичный префикс выигрывает у `location /` с `return 301`. Проверка
certbot проходит по HTTP.

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d captcha.sirius-campus.ru
```

Пока сертификата нет, домен отвечает сертификатом соседнего сайта
(`default_server`), и браузер показывает `ERR_CERT_COMMON_NAME_INVALID`.
Это ожидаемо и лечится ровно этим шагом.

Отдельный сертификат, а не `--expand` существующего: так перевыпуск для
капчи не может уронить соседей. Автопродление на VPS уже настроено —
новый сертификат подхватится тем же таймером.

Затем повторить деплой: он сам положит `host-nginx-ssl.conf` на место,
увидев `fullchain.pem`.

## 6. Перенос данных с летнего стенда

Летний фест жил в `/opt/summer-campus-fest` и остановлен. Вопросы и медиа
переносятся, таблица игроков обнуляется — новому фесту нужна чистая
таблица лидеров.

```bash
systemctl stop docker || true   # не обязательно, стенд и так не работает
cp -a /opt/summer-campus-fest/data/uploads/. /opt/captcha/data/uploads/
cp -a /opt/summer-campus-fest/data/db.sqlite /opt/captcha/data/db.sqlite
```

Старый каталог не удаляем: он остаётся бэкапом.

Обнуление таблицы лидеров — после первого подъёма контейнеров:

```bash
/opt/captcha/deploy/reset-players.sh
```

Скрипт снимает бэкап, удаляет прохождения и ответы, оставляя вопросы,
загрузки и настройки. Отдельной таблицы игроков в схеме нет: игрок — это
строка в `sessions`, поэтому обнуляются именно они.

## 7. Бэкапы

`deploy/backup-db.sh` вызывается перед каждой выкладкой. Для регулярного
снимка — в crontab:

```bash
sudo crontab -e
# 0 3 * * * /opt/captcha/deploy/backup-db.sh >> /var/log/captcha-backup.log 2>&1
```

Снимки лежат в `/var/backups/captcha`, хранятся 14 дней. Загрузки в бэкап
не попадают: это неизменяемые файлы, переживающие выкладку на месте.

## 8. gzip и fail2ban

Оба уже настроены на VPS, **делать ничего не нужно**: `gzip.conf` общий для
всех vhost, fail2ban читает общий `/var/log/nginx/access.log` и накрывает наш
домен автоматически. Копировать сюда `jail.local` соседей **нельзя** — он
перезапишет их рабочие настройки.

## Проверка после установки

```bash
curl -I https://captcha.sirius-campus.ru/                 # 200, HSTS в заголовках
curl -fsS https://captcha.sirius-campus.ru/api/health     # {"ok":true,...,"version":"…"}
curl -fsS http://127.0.0.1:8084/api/health                # то же, мимо хостового nginx
docker compose -f /opt/captcha/docker-compose.yml ps      # app и web подняты
```
