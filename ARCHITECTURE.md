# Apex Architecture

## Data Flow
1. **Sensors (App Only):** Capacitor Geolocation & Motion API capture data.
2. **Local State:** Zustand (`useRideStore`) manages the "Active Ride" buffer.
3. **Storage:** Rides are persisted to Supabase via PostGIS `ST_GeomFromText` for LineStrings.
4. **Maintenance:** Standard CRUD via Supabase JS client.
5. **Discord OAuth:** Secure OAuth flow via Edge Functions and Postgres RPC functions.

## Key Screens
- **Dashboard:** Current bike status, last ride summary.
- **Recorder:** Real-time telemetry (Speed, Lean, Elevation).
- **Garage:** Multi-bike management & Maintenance logs.
- **Profile:** User settings and Discord integration.

## Database Schema

### Core Tables
- `bikes` - Motorcycle profiles
- `rides` - Ride records with GPS paths (PostGIS LineString)
- `maintenance_logs` - Service history

### Discord Integration Tables
- `user_discord_connections` - Stores Discord OAuth tokens per user
  - `user_id` (UUID, FK to auth.users.id)
  - `access_token` (TEXT, encrypted)
  - `refresh_token` (TEXT, encrypted)
  - `expires_at` (TIMESTAMPTZ)
- `discord_oauth_states` - Temporary OAuth state tokens
  - `state_token` (TEXT, unique)
  - `user_id` (UUID, FK to auth.users.id)
  - `redirect_uri` (TEXT, nullable)
  - `expires_at` (TIMESTAMPTZ)
  - `used` (BOOLEAN, default false)

### Postgres Functions (RPC)

#### `get_oauth_state(state_token_param TEXT)`
- **Purpose**: Validates and retrieves OAuth state token
- **Security**: `SECURITY DEFINER` - runs with elevated privileges
- **Returns**: `user_id`, `redirect_uri`, `expires_at`
- **Behavior**: Marks state as used and validates expiration

#### `save_discord_tokens(user_id_param UUID, access_token_param TEXT, refresh_token_param TEXT, expires_at_param TIMESTAMPTZ)`
- **Purpose**: Securely stores Discord OAuth tokens
- **Security**: `SECURITY DEFINER` - runs with elevated privileges
- **Behavior**: Upserts tokens for the specified user

#### `cleanup_expired_oauth_states()`
- **Purpose**: Removes expired OAuth state tokens
- **Security**: `SECURITY DEFINER` - runs with elevated privileges
- **Usage**: Can be scheduled via Supabase cron jobs

## Edge Functions

### `discord-oauth`
Handles Discord OAuth2 flow:
- **Initial Request**: Generates OAuth URL with secure state token
- **Callback Handler**: Processes Discord redirect, exchanges code for tokens
- **Platform Detection**: Redirects to static HTML (web) or deep link (mobile)

## Security Architecture

### Row Level Security (RLS)
- All tables enforce RLS policies
- Users can only access their own data
- `user_discord_connections`: Users can view/insert/update/delete their own connections
- `discord_oauth_states`: Users can insert their own states, but cannot read/update others

### OAuth Security
- State tokens are cryptographically secure (UUID v4)
- State tokens expire after 10 minutes
- Tokens stored encrypted in database
- No service_role key required - uses Postgres functions with `SECURITY DEFINER`