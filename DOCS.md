# Apex: The Rider's Black Box

## Vision
A minimalist, high-precision utility for motorcyclists. Apex is a "Flight Recorder" for the road and a "Digital Garage" for the machine.

## Design Philosophy: "The Dark Cockpit"
- **OLED First:** OLED black backgrounds (#0A0A0A) to save battery and reduce glare.
- **High Contrast:** White and 'Apex Green' (#3DBF6F) for critical data.
- **Instrument Grade:** Use monospaced fonts for telemetry.
- **Glove-Friendly:** Large touch targets, long-press for destructive actions.

## Core Pillars
1. **The Garage:** Maintenance logs, bike profiles, service reminders.
2. **The Recorder:** GPS, Lean Angle, G-Force, and Altitude tracking.
3. **The Gearbox:** Mileage tracking for tires, helmets, and chains.

## Discord Integration

### Current Status
- ✅ **Discord RPC (Android)**: Uses a locally stored Discord Gateway token
- ✅ **Battery Friendly**: Updates only on ride start/end

### Architecture

#### Local Token Flow
- Token is stored locally on device (no server-side storage).
- RPC updates are sent from the Android foreground service.
- No Supabase tables or edge functions are required.

### Future Features
- **Maintenance Reminders**: Discord notifications for upcoming service intervals
- **Ride Sharing**: Share ride summaries via Discord embeds
- **Community Features**: Integration with Discord servers/communities