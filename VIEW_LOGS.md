# Viewing Logs in Apex App

## DevTools Panel Export (Recommended)

The easiest way to view and export logs is through the DevTools panel:

1. **Open DevTools**: Press the dev tools shortcut (usually configured in your app)
2. **Navigate to Console tab**: View all captured logs in real-time
3. **Filter logs**: Use the search box to filter logs (e.g., `-[vite]` to exclude Vite logs)
4. **Change log level**: Use the log level buttons to filter by severity
5. **Export logs**:
   - **Native (Android/iOS)**: Click the download button to share logs via system share dialog
   - **Web**: Click the download button to download logs as a `.txt` file

The exported log file includes:
- Session ID
- Export timestamp
- All log entries with timestamps and levels

## Android Logcat Commands (Advanced)

For low-level debugging, you can use Android logcat:

### View all motion-related logs:
```powershell
npm run log:android:motion
```

### View all Capacitor logs:
```powershell
npm run log:android
```

### Manual adb logcat (more detailed):
```powershell
# Clear logs and start fresh
adb logcat -c

# View logs filtered for motion/console
adb logcat chromium:V Capacitor:V Console:V *:E | Select-String -Pattern "Motion|lean|accel|DeviceMotion|sensor|Console" -CaseSensitive:$false
```

### View ALL console logs from the app:
```powershell
adb logcat | Select-String -Pattern "Capacitor/Console" -CaseSensitive:$false
```

## What to Look For

When you start a ride, you should see these logs in order:

1. **Motion effect triggered** - Shows if the useEffect is running
2. **Setting up motion listener** - Confirms setup started
3. **DeviceMotionEvent available** - Shows if the API is supported
4. **Calling Motion.addListener** - Confirms the call
5. **✅ Motion listener added successfully** - Listener is registered
6. **[Motion #1] Callback fired** - Sensor data is arriving
7. **[Motion #1] Sensor data** - Raw accelerometer values

## If You Don't See Logs

1. **No "Motion effect triggered"**: The useEffect isn't running (check isRecording, isPaused, isMobile)
2. **No "DeviceMotionEvent available"**: The WebView doesn't support motion sensors
3. **No "Motion listener added"**: The addListener call failed (check error logs)
4. **No "Callback fired"**: The listener is set up but not receiving data (sensor issue)

## Troubleshooting

- **DeviceMotionEvent not supported**: Your Android WebView might not support motion sensors. Try updating Chrome/WebView.
- **Permission denied**: On some Android versions, motion sensors require user interaction first.
- **No sensor data**: The device might not have an accelerometer, or it's disabled.
