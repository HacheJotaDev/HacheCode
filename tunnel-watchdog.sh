#!/bin/bash
# Tunnel Watchdog - Ensures the Cloudflare tunnel stays alive
# If the tunnel dies or the URL changes, this script updates /tmp/tunnel-url
# Run via: pm2 start tunnel-watchdog.sh --name watchdog

LOG="/tmp/tunnel-watchdog.log"

echo "[$(date)] Watchdog started" >> "$LOG"

while true; do
  # Check if tunnel process is running
  if ! pm2 pid tunnel > /dev/null 2>&1; then
    echo "[$(date)] Tunnel not running, restarting..." >> "$LOG"
    pm2 restart tunnel 2>/dev/null
    sleep 20
  fi

  # Extract current tunnel URL from logs
  NEW_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /home/z/.pm2/logs/tunnel-error.log 2>/dev/null | tail -1)

  if [ -n "$NEW_URL" ]; then
    OLD_URL=$(cat /tmp/tunnel-url 2>/dev/null)
    if [ "$NEW_URL" != "$OLD_URL" ]; then
      echo "[$(date)] Tunnel URL changed: $OLD_URL -> $NEW_URL" >> "$LOG"
      echo "$NEW_URL" > /tmp/tunnel-url
    fi
  fi

  # Verify tunnel is working
  TUNNEL_URL=$(cat /tmp/tunnel-url 2>/dev/null)
  if [ -n "$TUNNEL_URL" ]; then
    STATUS=$(curl -s "$TUNNEL_URL/health" -m 5 2>/dev/null)
    if ! echo "$STATUS" | grep -q "ok"; then
      echo "[$(date)] Tunnel health check failed, restarting..." >> "$LOG"
      pm2 restart tunnel 2>/dev/null
      sleep 20
      # Extract new URL
      NEW_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /home/z/.pm2/logs/tunnel-error.log 2>/dev/null | tail -1)
      if [ -n "$NEW_URL" ]; then
        echo "$NEW_URL" > /tmp/tunnel-url
        echo "[$(date)] New tunnel URL: $NEW_URL" >> "$LOG"
      fi
    fi
  fi

  sleep 30
done
