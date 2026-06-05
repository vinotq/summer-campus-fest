# 10. Деплой

## Окружение
VPS Linux, 1 vCPU, 2 GB RAM, ~10 GB диска. Docker + Docker Compose.

## Структура

```
campus-fest-summer/
├── docker-compose.yml
├── Dockerfile.server
├── Dockerfile.web
├── nginx.conf
├── .env                  # на сервере, не в git
└── data/                 # volume
    ├── db.sqlite
    └── uploads/
```

## `.env.example`

```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

DATA_DIR=/data
DB_FILE=/data/db.sqlite
UPLOADS_DIR=/data/uploads
UPLOAD_MAX_BYTES=5242880

ADMIN_LOGIN=admin
ADMIN_PASSWORD_HASH=scrypt$...$...
COOKIE_SECRET=замените_на_32+_символов_случайной_строки
```

## `docker-compose.yml` (схема)

```yaml
version: "3.9"
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.server
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./data:/data
    expose:
      - "3000"
    mem_limit: 1g
    cpus: 0.9

  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    restart: unless-stopped
    volumes:
      - web_static:/usr/share/nginx/html
    # сборка кладёт билд в volume; nginx ниже его раздаёт

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"  # при наличии TLS
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - web_static:/var/www/web:ro
      - ./data/uploads:/var/www/uploads:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro   # если certbot
    depends_on:
      - app

volumes:
  web_static:
```

## `nginx.conf` (ключевое)

```nginx
worker_processes auto;
events { worker_connections 1024; }

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  sendfile on;
  client_max_body_size 6m;
  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;

  upstream app { server app:3000; }

  server {
    listen 80;
    server_name _;

    # фронт (SPA)
    root /var/www/web;
    index index.html;
    location / {
      try_files $uri /index.html;
    }

    # статика аплоадов — отдаёт nginx напрямую
    location /uploads/ {
      alias /var/www/uploads/;
      add_header Cache-Control "public, max-age=2592000, immutable";
      add_header X-Content-Type-Options "nosniff";
    }

    # API
    location /api/ {
      proxy_pass http://app;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io/ {
      proxy_pass http://app;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
      proxy_read_timeout 1h;
    }
  }
}
```

(TLS через certbot, отдельным сервером 443 — по необходимости.)

## `Dockerfile.server`

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
# better-sqlite3 нужен build-tools
RUN apk add --no-cache python3 make g++

COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server ./server
WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/index.js"]
```

## `Dockerfile.web`

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY web/package*.json ./web/
RUN cd web && npm ci
COPY web ./web
RUN cd web && npm run build

FROM alpine AS final
WORKDIR /out
COPY --from=build /app/web/dist ./
VOLUME ["/usr/share/nginx/html"]
# при старте копируем сборку в volume, который монтирует nginx
CMD ["sh", "-c", "cp -r /out/. /usr/share/nginx/html/ && tail -f /dev/null"]
```
(Минималистично; альтернатива — сразу nginx-образ с фронтом, но тогда теряем шаринг volume между app и nginx-конфигом.)

## Бэкапы

`crontab -e` на хосте:
```
0 * * * * cp /opt/campus/data/db.sqlite /opt/campus/data/backups/db-$(date +\%Y\%m\%d\%H).sqlite && find /opt/campus/data/backups -mtime +7 -delete
```

## Подготовка пароля админа

```bash
docker compose run --rm app node /app/server/scripts/hash-password.js 'новый_пароль'
# вставить результат в .env как ADMIN_PASSWORD_HASH
docker compose restart app
```

## Мониторинг
- `docker compose logs -f app` достаточно для MVP.
- На VPS — `htop` или `vmstat 5` во время фестиваля.
- При необходимости — uptime-kuma в отдельном контейнере.

## Health-check
`GET /api/health` → `{ ok: true, uptime: ..., db: 'ok' }`. Использовать в nginx (опционально) и для внешнего мониторинга.

## Лимиты в Fastify
- `bodyLimit: 6 * 1024 * 1024` (multipart-аплоады).
- Socket.IO `maxHttpBufferSize: 1e6` — нам хватит.
- На уровне ОС: `ulimit -n 4096` (если контейнер не даёт по умолчанию).
