# Team 1710 Pit Display - Raspberry Pi Setup

## Quick Start

1. **Copy files to Raspberry Pi:**
   ```bash
   scp -r pitDisplay/ pi@raspberrypi:~/pitDisplay
   ```

2. **SSH into Raspberry Pi:**
   ```bash
   ssh pi@raspberrypi
   ```

3. **Navigate to project:**
   ```bash
   cd ~/pitDisplay
   ```

4. **Install dependencies (first time only):**
   ```bash
   npm install
   ```

5. **Make scripts executable:**
   ```bash
   chmod +x start-pit-display.sh
   chmod +x stop-pit-display.sh
   ```

6. **Start the pit display:**
   ```bash
   ./start-pit-display.sh
   ```

7. **Stop the pit display:**
   ```bash
   ./stop-pit-display.sh
   ```

## Display Configuration

The script assumes the following setup:

- **Primary Display** (:0): Large monitor for `/view` (1920x1080)
- **Secondary Display** (:1 or offset): Small touchscreen for `/control` (800x1024)

If your displays are different, edit the CONFIGURATION section in `start-pit-display.sh`:

```bash
# For view screen (large monitor)
VIEW_WIDTH=1920
VIEW_HEIGHT=1080

# For control screen (touchscreen)
CONTROL_WIDTH=800
CONTROL_HEIGHT=1024
```

## Auto-Start on Boot

To automatically start the pit display when the Raspberry Pi boots:

### Using systemd (recommended)

1. Create a service file:
   ```bash
   sudo nano /etc/systemd/system/pit-display.service
   ```

2. Add the following content:
   ```ini
   [Unit]
   Description=Team 1710 Pit Display
   After=network.target

   [Service]
   Type=simple
   User=pi
   WorkingDirectory=/home/pi/pitDisplay
   ExecStart=/home/pi/pitDisplay/start-pit-display.sh
   Restart=on-failure
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl enable pit-display.service
   sudo systemctl start pit-display.service
   ```

4. Check status:
   ```bash
   sudo systemctl status pit-display.service
   ```

### Using autostart (alternative)

1. Edit autostart file:
   ```bash
   sudo nano /etc/xdg/lxsession/LXDE-pi/autostart
   ```

2. Add at the end:
   ```
   @/home/pi/pitDisplay/start-pit-display.sh
   ```

## Troubleshooting

### Displays not detected correctly

If both windows open on the same screen:

1. Check connected displays:
   ```bash
   xrandr
   ```

2. Edit `start-pit-display.sh` and adjust `CONTROL_POS_X` to offset the control screen.

### Chromium won't start in kiosk mode

Try adding these flags to `start-pit-display.sh`:
```
--disable-gpu
--disable-software-rasterizer
```

### Touchscreen not working

Check if your touchscreen is detected:
```bash
xinput list
```

You may need to calibrate the touchscreen using:
```bash
sudo apt install xinput-calibrator
sudo xinput_calibrator
```

## Server Logs

View server logs:
```bash
tail -f pit-display.log
```

## Configuration

Edit `config/images.js` to:
- Change image categories
- Reorder images
- Adjust autoplay timing
- Change default category
