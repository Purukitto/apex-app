# Apex: The Rider's Black Box

## Vision
A minimalist, high-precision utility for motorcyclists. Apex is a "Flight Recorder" for the road and a "Digital Garage" for the machine.

## Design Philosophy: "The Dark Cockpit"
- **OLED First:** Pure black backgrounds (#0A0A0A) to save battery and reduce glare.
- **High Contrast:** White and 'Apex Green' (#00FF41) for critical data.
- **Instrument Grade:** Use monospaced fonts for telemetry.
- **Glove-Friendly:** Large touch targets, long-press for destructive actions.

## Core Pillars
1. **The Garage:** Maintenance logs, bike profiles, service reminders.
2. **The Recorder:** GPS, Lean Angle, G-Force, and Altitude tracking.
3. **The Gearbox:** Mileage tracking for tires, helmets, and chains.

## Discord Integration

### Current Status
- ✅ **OAuth Connection**: Users can link their Discord account via secure OAuth2 flow
- ✅ **Token Management**: Secure storage and refresh of Discord access tokens
- ✅ **Mobile Support**: Deep link support for mobile OAuth flow
- ✅ **Web Support**: Popup-based OAuth flow with automatic window closing
- ⏳ **Rich Presence**: Not yet implemented (requires Discord approval for `activities.write` scope)

### Architecture

#### Secure OAuth Flow
The Discord integration uses a secure, state-based OAuth flow:

1. **State Management**: Cryptographically secure state tokens (UUID v4) stored in `discord_oauth_states` table
2. **Token Storage**: Discord tokens stored in `user_discord_connections` table with encryption
3. **Postgres Functions (RPC)**: Secure operations using `SECURITY DEFINER` functions:
   - `get_oauth_state(state_token_param TEXT)` - Validates OAuth state and retrieves user context
   - `save_discord_tokens(...)` - Securely stores Discord tokens with user validation
   - `cleanup_expired_oauth_states()` - Removes expired state tokens (can be scheduled via cron)

#### Security Features
- **No Service Role Key Required**: Uses RLS and Postgres functions instead
- **State Token Expiration**: OAuth states expire after 10 minutes
- **User Isolation**: All operations are scoped to the authenticated user via RLS
- **CSRF Protection**: State tokens prevent cross-site request forgery

#### Edge Functions
- **`discord-oauth`**: Handles OAuth flow initiation and callback processing
  - Generates secure OAuth URLs with state tokens
  - Processes Discord callbacks and exchanges authorization codes
  - Redirects to static HTML file (web) or deep link (mobile) for proper rendering

### Future Features
- **Rich Presence**: Share ride status on Discord (requires Discord approval)
- **Maintenance Reminders**: Discord notifications for upcoming service intervals
- **Ride Sharing**: Share ride summaries via Discord embeds
- **Community Features**: Integration with Discord servers/communities

### Technical Notes
- **Supabase Limitation**: Edge Functions rewrite `Content-Type: text/html` to `text/plain` for GET requests
  - **Solution**: Edge function redirects (302) to static HTML file hosted in app
  - Static HTML file (`public/discord-callback.html`) handles success/error display and popup closing
- **Mobile Deep Links**: Uses `apex://discord-connected` scheme for mobile app integration
- **Token Refresh**: Automatic token refresh handled by edge functions when tokens expire