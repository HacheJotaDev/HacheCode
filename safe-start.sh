#!/bin/bash
trap 'echo "[$(date)] Received SIGHUP" >> /home/z/my-project/signal.log' HUP
trap 'echo "[$(date)] Received SIGINT" >> /home/z/my-project/signal.log' INT
trap 'echo "[$(date)] Received SIGTERM" >> /home/z/my-project/signal.log' TERM
trap 'echo "[$(date)] Received SIGQUIT" >> /home/z/my-project/signal.log' QUIT
trap 'echo "[$(date)] Received SIGUSR1" >> /home/z/my-project/signal.log' USR1
trap 'echo "[$(date)] Received SIGUSR2" >> /home/z/my-project/signal.log' USR2

cd /home/z/my-project/.next/standalone
echo "[$(date)] Starting server..." >> /home/z/my-project/signal.log
node server.js 2>&1
EXIT_CODE=$?
echo "[$(date)] Server exited with code $EXIT_CODE" >> /home/z/my-project/signal.log
