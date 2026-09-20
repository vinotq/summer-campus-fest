#!/usr/bin/env bash
# Повторные попытки выпустить сертификат для captcha.sirius-campus.ru.
#
# Зачем это вообще нужно. В реестре .ru делегирование sirius-campus.ru
# несёт протухший glue: ns1/ns2.adminvps.ru записаны с адресами
# 144.76.66.206 и 217.23.138.206, оба не отвечают. Настоящие адреса другие
# и работают. Резолверы Let's Encrypt стартуют с нуля на каждую проверку,
# бьются в мёртвые адреса и не успевают восстановиться в свой бюджет —
# отсюда «DNS problem: query timed out looking up A».
#
# Отказ плавающий: часть попыток может пройти. Поэтому пробуем по кругу,
# пока не получится либо пока не починят делегирование.
#
# Ставится из cron раз в 20 минут:
#   */20 * * * * /opt/captcha/deploy/retry-cert.sh >> /var/log/captcha-cert-retry.log 2>&1
#
# Раз в 20 минут, а не чаще: у Let's Encrypt лимит 5 неудачных проверок
# на домен в час. Три попытки в час оставляют запас на ручные прогоны.
#
# После успеха скрипт сам подключает TLS, перечитывает nginx и снимает
# себя из crontab — дальше сертификат ведёт штатный таймер certbot.
set -euo pipefail

DOMAIN=captcha.sirius-campus.ru
ROOT=/opt/captcha
LIVE=/etc/letsencrypt/live/$DOMAIN/fullchain.pem
STAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() { echo "[$STAMP] $*"; }

# Снять себя из crontab. Вызывается после успеха и при отключении.
unschedule() {
  crontab -l 2>/dev/null | grep -v 'retry-cert.sh' | crontab - || true
  log "задача снята из crontab"
}

# Подключить TLS и перечитать nginx. Идемпотентно: можно звать повторно.
enable_tls() {
  mkdir -p /etc/nginx/captcha-ssl
  cp "$ROOT/deploy/host-nginx-ssl.conf" /etc/nginx/captcha-ssl/captcha.conf
  if nginx -t 2>/dev/null; then
    systemctl reload nginx
    log "TLS подключён, nginx перечитан"
  else
    # Конфиг с битым включением уронил бы reload ВСЕМ сайтам машины,
    # поэтому при неудачной проверке откатываемся сразу.
    rm -f /etc/nginx/captcha-ssl/captcha.conf
    log "ОШИБКА: nginx -t не прошёл, SSL-конфиг убран"
    return 1
  fi
}

if [ -f "$LIVE" ]; then
  log "сертификат уже есть"
  enable_tls && unschedule
  exit 0
fi

log "попытка выпуска"
if certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" \
     --non-interactive --agree-tos --register-unsafely-without-email \
     --keep-until-expiring >/tmp/captcha-certbot.out 2>&1; then
  log "УСПЕХ: сертификат выпущен"
  enable_tls && unschedule
else
  # В лог только суть, без полотна из подсказок certbot.
  reason=$(grep -oE 'Detail: .*' /tmp/captcha-certbot.out | head -1)
  log "не вышло: ${reason:-см. /var/log/letsencrypt/letsencrypt.log}"
fi
