#!/bin/bash

# Team 1710 Pit Display Startup Script
# For Raspberry Pi OS with dual monitors

cd "$(dirname "$(readlink -f "$0")")"

# ==================== CONFIGURATION ====================
SERVER_PORT=3000
SERVER_URL="http://localhost:$SERVER_PORT"

# Display 0: Small touchscreen (control screen)
CONTROL_DISPLAY=":0"       # X display
CONTROL_WIDTH=800          # Window width
CONTROL_HEIGHT=1280        # Window height
CONTROL_POS_X=0            # X position
CONTROL_POS_Y=0            # Y position

# Display 1: Large vertical display (view screen)
VIEW_DISPLAY=":1"          # X display
VIEW_WIDTH=1080            # Window width (vertical)
VIEW_HEIGHT=1920           # Window height (vertical)
VIEW_POS_X=800               # X position
VIEW_POS_Y=0               # Y position

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

wait_for_x() {
    log "Waiting for X display to be ready..."

    # Wait up to 60 seconds for X to be ready
    for i in {1..60}; do
        if xdpyinfo -display "$VIEW_DISPLAY" >/dev/null 2>&1; then
            log "Display $VIEW_DISPLAY is ready!"
            # Give X a moment to fully initialize
            sleep 2
            return 0
        fi
        sleep 1
    done

    log "WARNING: Display $VIEW_DISPLAY not ready after 60 seconds"
    return 1
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
    log "Opening view screen on display $VIEW_DISPLAY (${VIEW_WIDTH}x${VIEW_HEIGHT})..."

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
        --password-store=basic \
        --use-mock-keychain \
        "$SERVER_URL/view" &

    VIEW_PID=$!
    log "View screen opened with PID: $VIEW_PID"
}

open_control_screen() {
    log "Opening control screen on display $CONTROL_DISPLAY (${CONTROL_WIDTH}x${CONTROL_HEIGHT})..."

    export DISPLAY=$CONTROL_DISPLAY

    chromium \
        --display=$CONTROL_DISPLAY \
        --window-position=$CONTROL_POS_X,$CONTROL_POS_Y \
        --window-size=$CONTROL_WIDTH,$CONTROL_HEIGHT \
        --no-sandbox \
        --disable-infobars \
        --disable-session-crashed-bubble \
        --disable-on-before-shutdown \
        --kiosk \
        --password-store=basic \
        --use-mock-keychain \
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
