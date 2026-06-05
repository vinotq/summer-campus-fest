#!/usr/bin/env bash
# deploy.sh — копирует проект на VPS и запускает
# Использование: ./deploy.sh user@IP

set -euo pipefail

TARGET="${1:?Укажите user@host, например: ./deploy.sh root@1.2.3.4}"
REMOTE_DIR="/opt/campus-fest"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "▸ Создаём архив проекта..."
TMPFILE="$(mktemp /tmp/campus-fest-XXXXXX.tar.gz)"
tar -czf "$TMPFILE" \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='web/node_modules' \
  --exclude='server/node_modules' \
  --exclude='web/dist' \
  --exclude='data' \
  -C "$LOCAL_DIR" .

echo "▸ Загружаем код на сервер..."
scp "$TMPFILE" "$TARGET:/tmp/campus-fest-deploy.tar.gz"
rm -f "$TMPFILE"

echo "▸ Загружаем базу данных..."
ssh "$TARGET" "mkdir -p $REMOTE_DIR/data/uploads"
scp "$LOCAL_DIR/data/db.sqlite" "$TARGET:$REMOTE_DIR/data/db.sqlite"

echo "▸ Загружаем uploads..."
UPLOADS_TMP="$(mktemp /tmp/uploads-XXXXXX.tar.gz)"
tar -czf "$UPLOADS_TMP" -C "$LOCAL_DIR/data/uploads" .
scp "$UPLOADS_TMP" "$TARGET:/tmp/uploads-deploy.tar.gz"
rm -f "$UPLOADS_TMP"

echo "▸ Разворачиваем и запускаем на сервере..."
ssh "$TARGET" bash << EOF
  set -e

  mkdir -p $REMOTE_DIR
  cd $REMOTE_DIR

  tar -xzf /tmp/campus-fest-deploy.tar.gz
  rm -f /tmp/campus-fest-deploy.tar.gz

  mkdir -p data/uploads
  tar -xzf /tmp/uploads-deploy.tar.gz -C data/uploads/
  rm -f /tmp/uploads-deploy.tar.gz

  if [ ! -f .env ]; then
    echo "ОШИБКА: .env не найден — создайте его вручную из .env.example"
    exit 1
  fi

  docker compose down --remove-orphans 2>/dev/null || true
  docker compose build
  docker compose up -d

  # Устанавливаем nginx-конфиг для системного nginx
  cp $REMOTE_DIR/sirius-campus.nginx.conf /etc/nginx/sites-available/sirius-campus.ru
  ln -sf /etc/nginx/sites-available/sirius-campus.ru /etc/nginx/sites-enabled/sirius-campus.ru
  nginx -t && systemctl reload nginx

  echo ""
  docker compose ps
EOF

echo ""
echo "✓ Готово → http://sirius-campus.ru"
