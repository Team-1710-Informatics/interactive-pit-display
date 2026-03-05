#!/bin/bash

# Team 1710 Pit Display Startup Script
# For Raspberry Pi OS with dual monitors

# ==================== CONFIGURATION ====================
SERVER_PORT=3000
SERVER_URL="http://localhost:$SERVER_PORT"

# Primary display (large monitor - view screen)
VIEW_DISPLAY=":0"           # X display
VIEW_SCREEN="0"             # Screen number
VIEW_WIDTH=1920             # Window width
VIEW_HEIGHT=1080            # Window height
VIEW_POS_X=0                # X position
VIEW_POS_Y=0                # Y position

# Secondary display (small touchscreen - control screen)
# For Raspberry Pi with HDMI1, try :1 first, fall back to :0 with offset
CONTROL_DISPLAY=":1"        # X display (try :1 for separate screen)
CONTROL_SCREEN="0"          # Screen number
CONTROL_WIDTH=800           # Window width (portrait touchscreen)
CONTROL_HEIGHT=1024         # Window height
CONTROL_POS_X=1920          # X position (offset if using single display)
CONTROL_POS_Y=0             # Y position

# Wait times
SERVER_STARTUP_WAIT=3       # Seconds to wait for server
WINDOW_OPEN_WAIT=2          # Seconds to wait between windows

# ==================== FUNCTIONS ====================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

kill_existing_chromium() {
    log "Killing existing Chromium instances..."
    pkill -f chromium 2>/dev/null
    sleep 1
}

start_server() {
    log "Starting Node.js server on port $SERVER_PORT..."

    # Check if server is already running
    if lsof -Pi :$SERVER_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        log "Server already running on port $SERVER_PORT, stopping it..."
        fuser -k $SERVER_PORT/tcp 2>/dev/null
        sleep 1
    fi

    # Start server in background
    cd "$(dirname "$0")"
    nohup node server.js > pit-display.log 2>&1 &
    SERVER_PID=$!

    log "Server started with PID: $SERVER_PID"

    # Wait for server to be ready
    log "Waiting for server to start..."
    sleep $SERVER_STARTUP_WAIT

    # Check if server is responding
    if curl -s "$SERVER_URL/api/config" > /dev/null 2>&1; then
        log "Server is ready!"
    else
        log "WARNING: Server may not be responding properly"
    fi
}

open_view_screen() {
    log "Opening view screen on primary display..."

    export DISPLAY=$VIEW_DISPLAY

    chromium \
        --display=$VIEW_DISPLAY \
        --window-position=$VIEW_POS_X,$VIEW_POS_Y \
        --window-size=$VIEW_WIDTH,$VIEW_HEIGHT \
        --start-fullscreen \
        --no-sandbox \
        --disable-infobars \
        --disable-session-crashed-bubble \
        --disable-on-before-shutdown \
        --kiosk \
        "$SERVER_URL/view" &

    VIEW_PID=$!
    log "View screen opened with PID: $VIEW_PID"
}

open_control_screen() {
    log "Opening control screen on secondary display..."

    # First, try using separate display (:1)
    export DISPLAY=$CONTROL_DISPLAY

    # Test if display :1 is available
    if xdpyinfo -display $CONTROL_DISPLAY >/dev/null 2>&1; then
        log "Using display $CONTROL_DISPLAY (separate X screen)"
        CONTROL_POS_X=0
        CONTROL_POS_Y=0
    else
        # Fall back to :0 with offset
        log "Display $CONTROL_DISPLAY not available, using $VIEW_DISPLAY with offset"
        export DISPLAY=$VIEW_DISPLAY
        CONTROL_POS_X=1920
        CONTROL_POS_Y=0
    fi

    chromium \
        --display=$DISPLAY \
        --window-position=$CONTROL_POS_X,$CONTROL_POS_Y \
        --window-size=$CONTROL_WIDTH,$CONTROL_HEIGHT \
        --no-sandbox \
        --disable-infobars \
        --disable-session-crashed-bubble \
        --disable-on-before-shutdown \
        --kiosk \
        "$SERVER_URL/control" &

    CONTROL_PID=$!
    log "Control screen opened with PID: $CONTROL_PID"
}

# ==================== MAIN ====================

log "========================================"
log "Team 1710 Pit Display Starting..."
log "========================================"

# Kill any existing Chromium instances
kill_existing_chromium

# Start the server
start_server

# Open the view screen
open_view_screen
sleep $WINDOW_OPEN_WAIT

# Open the control screen
open_control_screen

log "========================================"
log "Pit Display Started Successfully!"
log "========================================"
log "View Screen:   $SERVER_URL/view"
log "Control Screen: $SERVER_URL/control"
log "Server Log: $(pwd)/pit-display.log"
log ""
log "Press Ctrl+C to stop (this only stops the script, not the processes)"
log "To stop everything, run: ./stop-pit-display.sh"
log "========================================"

# Keep script running (optional - remove if you want it to exit)
# wait
