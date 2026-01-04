# Apex Architecture

## Data Flow
1. **Sensors (App Only):** Capacitor Geolocation & Motion API capture data.
2. **Local State:** Zustand (`useRideStore`) manages the "Active Ride" buffer.
3. **Storage:** Rides are persisted to Supabase via PostGIS `ST_GeomFromText` for LineStrings.
4. **Maintenance:** Standard CRUD via Supabase JS client.

## Key Screens
- **Dashboard:** Current bike status, last ride summary.
- **Recorder:** Real-time telemetry (Speed, Lean, Elevation).
- **Garage:** Multi-bike management & Maintenance logs.