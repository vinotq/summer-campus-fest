#!/usr/bin/env bash
# Запускать на сервере: bash server-deploy.sh
# Данные (data/) не трогает — они в .gitignore

set -euo pipefail

cd "$(dirname "$0")"

echo "▸ Получаем обновления..."
git pull

echo "▸ Пересобираем образы..."
docker compose build

echo "▸ Перезапускаем..."
docker compose up -d

echo "▸ Обновляем nginx..."
cp sirius-campus.nginx.conf /etc/nginx/sites-available/sirius-campus.ru
nginx -t && systemctl reload nginx

echo ""
docker compose ps
echo "✓ Готово → http://sirius-campus.ru"
