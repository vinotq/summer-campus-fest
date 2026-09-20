#!/usr/bin/env bash
# Обнуление таблицы лидеров между фестами.
#
# ЗАПУСКАТЬ НА VPS:
#   /opt/captcha/deploy/reset-players.sh
#
# Удаляет прохождения и ответы, оставляя вопросы, загруженные к ним медиа
# и настройки викторины. Это то, что нужно при переносе стенда с одного
# феста на другой: контент переиспользуется, результаты прошлого — нет.
#
# Отдельного «списка игроков» в схеме нет: игрок — это строка в sessions,
# поэтому обнуляются именно sessions и всё, что на них ссылается.
set -euo pipefail

ROOT=${ROOT:-/opt/captcha}
cd "$ROOT"

if [ "${1:-}" != "--yes" ]; then
  echo "Будут удалены ВСЕ прохождения и ответы в $ROOT/data/db.sqlite."
  echo "Вопросы, загрузки и настройки останутся."
  printf "Продолжить? [y/N] "
  read -r ans </dev/tty
  [ "$ans" = "y" ] || { echo "отменено"; exit 1; }
fi

# Снимок до удаления: восстановить стёртую таблицу лидеров иначе неоткуда.
"$ROOT/deploy/backup-db.sh"

# </dev/null — у `exec -T` иначе вычитывается stdin вызывающего скрипта.
docker compose exec -T app </dev/null sqlite3 /data/db.sqlite <<'SQL'
pragma foreign_keys = on;
delete from answers;
delete from pending_answers;
delete from sessions;
SQL

left=$(docker compose exec -T app </dev/null \
  sqlite3 /data/db.sqlite "select count(*) from sessions;" | tr -d '\r')
questions=$(docker compose exec -T app </dev/null \
  sqlite3 /data/db.sqlite "select count(*) from questions;" | tr -d '\r')
echo "прохождений осталось: $left, вопросов сохранено: $questions"
