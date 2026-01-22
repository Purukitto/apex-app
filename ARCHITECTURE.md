# Apex Architecture

## Data Flow
1. **Sensors (App Only):** Capacitor Geolocation & Motion API capture data.
2. **Local State:** Zustand (`useRideStore`) manages the "Active Ride" buffer.
3. **Storage:** Rides are persisted to Supabase via PostGIS `ST_GeomFromText` for LineStrings.
4. **Maintenance:** Standard CRUD via Supabase JS client.
5. **Discord RPC (Android):** Gateway presence updates.

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

### Discord Integration
- Discord RPC tokens are stored locally on device.

## Discord RPC Notes
- Uses a locally stored Discord Gateway token.

## Security Architecture

### Row Level Security (RLS)
- All tables enforce RLS policies
- Users can only access their own data