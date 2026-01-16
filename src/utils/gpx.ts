import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { supabase } from '../lib/supabaseClient';
import { logger } from '../lib/logger';
import type { Ride } from '../types/database';

/**
 * Export a ride to GPX format and share it
 * - On native platforms: Saves to filesystem and shares via Capacitor
 * - On web: Downloads the GPX file directly
 * 
 * @param rideId - The ID of the ride to export
 * @throws Error if ride not found or no route path
 */
export async function exportToGPX(rideId: string): Promise<void> {

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Fetch the ride with route path
  // First try to get the ride directly, then try RPC for GeoJSON if needed
  const { data: rideData, error: rideError } = await supabase
    .from('rides')
    .select('*')
    .eq('id', rideId)
    .eq('user_id', user.id)
    .single();

  if (rideError || !rideData) {
    logger.error('Error fetching ride:', rideError);
    throw new Error('Ride not found or you do not have permission to access it');
  }

  let ride: Ride = rideData as Ride;

  // Always try to get GeoJSON route_path using RPC function
  // The direct select might not return route_path in GeoJSON format (PostGIS geography)
  let routePathFound = false;
  
  try {
    logger.debug('Attempting to fetch route_path via RPC function', { rideId });
    const rpcResult = await Promise.race([
      supabase.rpc('get_rides_with_geojson', {
        p_user_id: user.id,
        p_bike_id: null,
        p_limit: 200, // Get more rides to ensure we find ours
        p_offset: 0,
      }),
      new Promise<{ error: { message: string } }>((resolve) => {
        setTimeout(() => resolve({ error: { message: 'RPC timeout' } }), 10000);
      }),
    ]) as Awaited<ReturnType<typeof supabase.rpc<'get_rides_with_geojson'>>> | { error: { message: string } };

    if ('data' in rpcResult && rpcResult.data && !rpcResult.error) {
      logger.debug('RPC function returned data', { rideCount: rpcResult.data.length });
      const foundRide = (rpcResult.data as Ride[]).find((r) => r.id === rideId);
      if (foundRide) {
        logger.debug('Found ride in RPC result', { 
          hasRoutePath: !!foundRide.route_path,
          routePathType: typeof foundRide.route_path 
        });
        if (foundRide.route_path) {
          // Process route_path if it's a string
          try {
            const routePath = typeof foundRide.route_path === 'string'
              ? JSON.parse(foundRide.route_path)
              : foundRide.route_path;
            ride = { ...ride, route_path: routePath as Ride['route_path'] };
            routePathFound = true;
            logger.debug('Successfully parsed route_path from RPC function', {
              coordinatesCount: ride.route_path?.coordinates?.length || 0
            });
          } catch (error) {
            logger.warn('Failed to parse route_path from RPC:', error);
          }
        } else {
          logger.warn('Found ride but route_path is null/undefined');
        }
      } else {
        logger.warn('Ride not found in RPC result', { 
          rideId, 
          returnedRideIds: (rpcResult.data as Ride[]).slice(0, 5).map(r => r.id),
          totalReturned: rpcResult.data.length
        });
      }
    } else {
      const errorMsg = 'error' in rpcResult ? rpcResult.error?.message : 'Unknown error';
      logger.debug('RPC function returned error or no data', { error: errorMsg });
    }
  } catch (error) {
    logger.warn('RPC function not available or timed out:', error);
  }
  
  // Fallback: Try to process route_path from direct query if RPC didn't work
  if (!routePathFound && ride.route_path) {
    logger.debug('Attempting to parse route_path from direct query');
    if (typeof ride.route_path === 'string') {
      try {
        ride = { ...ride, route_path: JSON.parse(ride.route_path) as Ride['route_path'] };
        routePathFound = true;
        logger.debug('Successfully parsed route_path from direct query');
      } catch (error) {
        logger.warn('Failed to parse route_path from direct query:', error);
      }
    } else if (ride.route_path && typeof ride.route_path === 'object') {
      // Already an object, might be valid
      routePathFound = true;
      logger.debug('route_path is already an object');
    }
  }

  // Check if ride has route path
  if (!ride.route_path) {
    logger.error('Ride has no route_path property', { rideId, hasRoutePath: !!ride.route_path });
    throw new Error('Ride has no route path data');
  }
  
  if (!ride.route_path.coordinates || !Array.isArray(ride.route_path.coordinates) || ride.route_path.coordinates.length === 0) {
    logger.error('Ride route_path has no valid coordinates', { 
      rideId, 
      routePathType: typeof ride.route_path,
      hasCoordinates: !!ride.route_path.coordinates,
      coordinatesLength: ride.route_path.coordinates?.length 
    });
    throw new Error('Ride has no route path coordinates');
  }
  
  logger.debug('Route path validated', { 
    coordinatesCount: ride.route_path.coordinates.length,
    firstCoord: ride.route_path.coordinates[0],
    lastCoord: ride.route_path.coordinates[ride.route_path.coordinates.length - 1]
  });

  // Generate GPX XML
  const gpxXml = generateGPX(ride);

  // Generate filename with date
  const rideDate = new Date(ride.start_time);
  const dateStr = rideDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `ride_${dateStr}.gpx`;

  if (Capacitor.isNativePlatform()) {
    // Native platform: Save to filesystem and share
    const base64Data = btoa(unescape(encodeURIComponent(gpxXml)));

    try {
      await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents, // Use Documents directory for user-accessible files
      });

      logger.debug('GPX file saved:', { filename, path: `Documents/${filename}` });

      // Get file URI
      const fileUri = await Filesystem.getUri({
        path: filename,
        directory: Directory.Documents,
      });

      // Share the file
      await Share.share({
        title: ride.ride_name || 'Apex Ride',
        text: `GPX export: ${ride.distance_km.toFixed(1)} km ride`,
        url: fileUri.uri,
        dialogTitle: 'Share GPX File',
      });

      logger.info('GPX file shared successfully');
    } catch (error) {
      logger.error('Error saving/sharing GPX file:', error);
      throw new Error('Failed to save or share GPX file');
    }
  } else {
    // Web platform: Download the file directly
    try {
      logger.debug('Creating GPX download for web', { filename, xmlLength: gpxXml.length });
      const blob = new Blob([gpxXml], { type: 'application/gpx+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      link.style.visibility = 'hidden';
      link.setAttribute('aria-hidden', 'true');
      
      // Append to body
      document.body.appendChild(link);
      
      // Trigger download - must be synchronous with user gesture
      link.click();
      
      logger.debug('Download link clicked', { href: link.href, download: link.download });
      
      // Clean up after a delay to ensure download starts
      setTimeout(() => {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
        logger.info('GPX file download initiated, cleanup complete');
      }, 200);
    } catch (error) {
      logger.error('Error downloading GPX file:', error);
      throw new Error('Failed to download GPX file');
    }
  }
}

/**
 * Generate GPX XML string from ride data
 * Follows GPX 1.1 schema
 * 
 * @param ride - The ride object with route_path
 * @returns GPX XML string
 */
function generateGPX(ride: Ride): string {
  const coordinates = ride.route_path!.coordinates;
  const startTime = new Date(ride.start_time);
  const endTime = ride.end_time ? new Date(ride.end_time) : null;

  // GPX header
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Apex App" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(ride.ride_name || 'Apex Ride')}</name>
    <time>${startTime.toISOString()}</time>
  </metadata>
  <trk>
    <name>${escapeXml(ride.ride_name || 'Apex Ride')}</name>
    <desc>Distance: ${ride.distance_km.toFixed(2)} km${endTime ? `, Duration: ${formatDuration(startTime, endTime)}` : ''}</desc>
    <trkseg>
`;

  // Add track points
  for (let i = 0; i < coordinates.length; i++) {
    const coord = coordinates[i];
    // GeoJSON format is [longitude, latitude]
    // GPX format uses lat and lon attributes
    const [lon, lat] = coord;
    
    // Format timestamp (use start time + estimated time based on point index)
    // Since we don't have individual timestamps for each point, we'll estimate
    const pointTime = estimatePointTime(startTime, endTime, i, coordinates.length);
    
    gpx += `      <trkpt lat="${lat}" lon="${lon}">
        <time>${pointTime.toISOString()}</time>
      </trkpt>
`;
  }

  // Close GPX
  gpx += `    </trkseg>
  </trk>
</gpx>`;

  return gpx;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format duration between two dates
 */
function formatDuration(start: Date, end: Date): string {
  const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Estimate timestamp for a track point
 * Distributes time evenly across all points
 */
function estimatePointTime(
  startTime: Date,
  endTime: Date | null,
  pointIndex: number,
  totalPoints: number
): Date {
  if (!endTime || totalPoints <= 1) {
    return startTime;
  }

  const totalDuration = endTime.getTime() - startTime.getTime();
  const pointTime = startTime.getTime() + (totalDuration * pointIndex) / (totalPoints - 1);
  
  return new Date(pointTime);
}
