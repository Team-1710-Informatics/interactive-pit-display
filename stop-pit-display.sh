#!/bin/bash

# Team 1710 Pit Display Stop Script

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "========================================"
log "Stopping Team 1710 Pit Display..."
log "========================================"

# Stop Chromium
log "Stopping Chromium instances..."
pkill -f chromium-browser 2>/dev/null
pkill -f chromium 2>/dev/null
sleep 1

# Stop Node.js server on port 3000
log "Stopping Node.js server..."
fuser -k 3000/tcp 2>/dev/null
sleep 1

# Also try to kill by process name
pkill -f "node server.js" 2>/dev/null

log "========================================"
log "Pit Display Stopped"
log "========================================"
