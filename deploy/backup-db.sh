#!/usr/bin/env bash
# Снимок базы перед выкладкой. Вызывается из remote-deploy.sh и годится
# для crontab (см. SETUP.md, шаг 7).
#
# Почему не `cp data/db.sqlite`: база работает в режиме WAL, и часть уже
# подтверждённых записей в момент копирования лежит в отдельном файле -wal.
# Простая копия даёт базу без них — то есть тихо теряет последние ответы
# игроков. `.backup` снимает согласованный слепок, не останавливая игру.
set -euo pipefail

ROOT=${ROOT:-/opt/captcha}
DEST=${BACKUP_DIR:-/var/backups/captcha}
KEEP_DAYS=${KEEP_DAYS:-14}

cd "$ROOT"
mkdir -p "$DEST"

stamp=$(date +%Y%m%d_%H%M%S)
out="$DEST/captcha_$stamp.sqlite"

# Пишем во временный файл внутри тома данных: только он виден и контейнеру,
# и хосту. </dev/null — у `exec -T` иначе вычитывается stdin вызывающего
# скрипта, и остаток деплоя молча уезжает в никуда.
docker compose exec -T app </dev/null \
  sqlite3 /data/db.sqlite ".backup '/data/.backup.tmp'"

mv "$ROOT/data/.backup.tmp" "$out"
gzip -f "$out"
echo "бэкап: $out.gz ($(du -h "$out.gz" | cut -f1))"

# Загрузки не в бэкапе намеренно: это 14 МБ неизменяемых файлов, которые
# переживают выкладку в том же каталоге. Их копирует отдельный ритуал
# при переезде, а не каждый деплой.

find "$DEST" -name 'captcha_*.sqlite.gz' -mtime "+$KEEP_DAYS" -delete
