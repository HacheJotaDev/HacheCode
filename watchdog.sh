#!/bin/bash
while true; do
  cd /home/z/my-project/.next/standalone
  echo "[$(date)] Starting server..." >> /home/z/my-project/watchdog.log
  node server.js >> /home/z/my-project/server.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE" >> /home/z/my-project/watchdog.log
  sleep 2
done
