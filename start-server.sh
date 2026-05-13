#!/bin/bash
cd /home/z/my-project/.next/standalone
while true; do
  bun server.js 2>&1
  echo "[$(date)] Server exited, restarting in 1s..." >> /home/z/my-project/restart.log
  sleep 1
done
