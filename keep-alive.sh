#!/bin/bash
# Hache Code Server Watchdog
# Keeps the Next.js server running by checking and restarting

LOG="/home/z/my-project/watchdog.log"
PORT=3000
MAX_RESTARTS=20
RESTART_COUNT=0

echo "[$(date)] Watchdog started" >> "$LOG"

while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
    # Check if port 3000 is listening
    if ss -tlnp | grep -q ":${PORT} "; then
        # Server is running, just wait
        sleep 10
        continue
    fi
    
    # Server is down, try to start it
    echo "[$(date)] Server down, starting... (attempt $((RESTART_COUNT+1)))" >> "$LOG"
    
    # Kill any leftover processes
    pkill -f "next-server" 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    sleep 1
    
    # Start the dev server
    cd /home/z/my-project
    nohup npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
    
    # Wait for it to come up
    for i in $(seq 1 30); do
        sleep 2
        if ss -tlnp | grep -q ":${PORT} "; then
            echo "[$(date)] Server started successfully" >> "$LOG"
            RESTART_COUNT=$((RESTART_COUNT+1))
            break
        fi
    done
    
    # Check if it actually started
    if ! ss -tlnp | grep -q ":${PORT} "; then
        echo "[$(date)] Failed to start server, retrying in 5s" >> "$LOG"
        sleep 5
    fi
done

echo "[$(date)] Watchdog exceeded max restarts, exiting" >> "$LOG"
