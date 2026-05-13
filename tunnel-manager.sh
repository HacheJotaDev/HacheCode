#!/bin/bash
# Tunnel Manager - Auto-restarts cloudflared when it dies
# Writes the current tunnel URL to /tmp/tunnel-url

echo "[Tunnel Manager] Starting..."

while true; do
  # Kill any existing cloudflared
  pkill -f "cloudflared tunnel" 2>/dev/null
  sleep 2
  
  # Start cloudflared
  cloudflared tunnel --url http://localhost:3000 --protocol http2 > /tmp/cloudflared.log 2>&1 &
  CF_PID=$!
  
  # Wait for the URL to appear
  for i in $(seq 1 30); do
    TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cloudflared.log 2>/dev/null | head -1)
    if [ -n "$TUNNEL_URL" ]; then
      break
    fi
    sleep 1
  done
  
  if [ -n "$TUNNEL_URL" ]; then
    echo "$TUNNEL_URL" > /tmp/tunnel-url
    echo "[Tunnel Manager] Tunnel active: $TUNNEL_URL"
    
    # Keep alive: ping every 15 seconds
    while kill -0 $CF_PID 2>/dev/null; do
      curl -s "$TUNNEL_URL/health" > /dev/null 2>&1
      sleep 15
    done
    
    echo "[Tunnel Manager] Tunnel died. Restarting..."
  else
    echo "[Tunnel Manager] Failed to get tunnel URL. Retrying..."
  fi
  
  sleep 5
done
