import html2canvas from 'html2canvas';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import type { Ride } from '../types/database';
import type { Bike } from '../types/database';
import { logger } from './logger';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import React from 'react';
import RideMap from '../components/RideMap';

/**
 * Wait for map tiles to load
 */
function waitForMapTiles(mapContainer: HTMLElement, timeout = 5000): Promise<void> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkTiles = () => {
      // Check if Leaflet map container exists
      const leafletContainer = mapContainer.querySelector('.leaflet-container');
      if (!leafletContainer) {
        if (Date.now() - startTime > timeout) {
          // Resolve anyway - component might still render
          resolve();
          return;
        }
        setTimeout(checkTiles, 100);
        return;
      }

      // Check for any tile images (loaded or loading)
      const allTiles = leafletContainer.querySelectorAll('img.leaflet-tile');
      const loadedTiles = leafletContainer.querySelectorAll('img.leaflet-tile-loaded');
      
      // If we have tiles and at least some are loaded, or if we've waited long enough
      if (allTiles.length > 0 && (loadedTiles.length > 0 || Date.now() - startTime > 2000)) {
        // Give a bit more time for all tiles to fully render
        setTimeout(() => resolve(), 500);
      } else {
        if (Date.now() - startTime > timeout) {
          // Resolve anyway if timeout - map might still render
          resolve();
          return;
        }
        setTimeout(checkTiles, 100);
      }
    };

    checkTiles();
  });
}

/**
 * Generate a shareable image for a ride (Strava-style)
 * Creates an image with ride stats and styling, including map if route data is available
 */
export async function generateRideShareImage(
  ride: Ride,
  bike: Bike | undefined
): Promise<string> {
  // Format bike name as "Make (Year)" to match AllRides card format
  const bikeName = bike 
    ? `${bike.make}${bike.year ? ` (${bike.year})` : ''}`
    : 'Unknown Bike';
  const rideName = ride.ride_name || bikeName;
  const maxLean = Math.max(ride.max_lean_left, ride.max_lean_right);

  // Format duration
  const formatDuration = (startTime: string, endTime?: string): string => {
    if (!endTime) return 'In progress';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get theme colors from CSS variables
  const root = document.documentElement;
  const apexBlack = getComputedStyle(root).getPropertyValue('--color-apex-black').trim() || '#0A0A0A';
  const apexWhite = getComputedStyle(root).getPropertyValue('--color-apex-white').trim() || '#E2E2E2';
  const apexGreen = getComputedStyle(root).getPropertyValue('--color-apex-green').trim() || '#00FF41';

  // Check if route data is available
  const hasRoute = ride.route_path && 
                   ride.route_path.coordinates && 
                   Array.isArray(ride.route_path.coordinates) && 
                   ride.route_path.coordinates.length > 0;

  // Convert route coordinates from [lng, lat] to [lat, lng] for RideMap
  const routeCoordinates: [number, number][] = hasRoute && ride.route_path
    ? ride.route_path.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number])
    : [];

  // Create a temporary container for the image
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1080px';
  container.style.height = '1080px';
  container.style.background = apexBlack;
  container.style.padding = '60px';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.color = apexWhite;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'space-between';

  // Header section
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.flexDirection = 'column';
  header.style.gap = '12px';
  
  const title = document.createElement('h1');
  title.textContent = rideName;
  title.style.fontSize = '48px';
  title.style.fontWeight = '700';
  title.style.color = apexWhite;
  title.style.margin = '0';
  title.style.lineHeight = '1.2';
  
  const subtitle = document.createElement('p');
  subtitle.textContent = bikeName;
  subtitle.style.fontSize = '28px';
  subtitle.style.color = apexWhite;
  subtitle.style.opacity = '0.6';
  subtitle.style.margin = '0';
  
  header.appendChild(title);
  header.appendChild(subtitle);
  container.appendChild(header);

  // Map section (if route available) - Strava-style: map at top
  let mapContainer: HTMLElement | null = null;
  let mapRoot: Root | null = null;
  
  if (hasRoute && routeCoordinates.length > 0) {
    try {
      const mapWrapper = document.createElement('div');
      mapWrapper.style.width = '100%';
      mapWrapper.style.height = '400px';
      mapWrapper.style.marginTop = '40px';
      mapWrapper.style.marginBottom = '40px';
      mapWrapper.style.borderRadius = '12px';
      mapWrapper.style.overflow = 'hidden';
      // Border with 20% opacity using CSS color-mix or fallback
      if (apexWhite.startsWith('#')) {
        const borderColor = apexWhite.replace('#', '');
        const r = parseInt(borderColor.substring(0, 2), 16);
        const g = parseInt(borderColor.substring(2, 4), 16);
        const b = parseInt(borderColor.substring(4, 6), 16);
        mapWrapper.style.border = `1px solid rgba(${r}, ${g}, ${b}, 0.2)`;
      } else {
        // Fallback for non-hex colors
        mapWrapper.style.border = '1px solid rgba(226, 226, 226, 0.2)';
      }
      mapWrapper.style.position = 'relative';
      mapWrapper.style.zIndex = '1';
      mapWrapper.id = 'share-map-container';
      
      container.appendChild(mapWrapper);
      mapContainer = mapWrapper;

      // Render RideMap component
      mapRoot = createRoot(mapWrapper);
      mapRoot.render(
        React.createElement(RideMap, {
          coordinates: routeCoordinates,
          interactive: false,
          height: '400px',
          className: 'w-full',
        })
      );

      // Wait for map tiles to load
      await waitForMapTiles(mapWrapper, 5000).catch((error) => {
        logger.debug('Map tiles loading timeout or error:', error);
        // Continue anyway - map might still render
      });
    } catch (error) {
      logger.debug('Error rendering map for share image:', error);
      // Remove map container if there was an error
      if (mapContainer && mapContainer.parentNode) {
        mapContainer.parentNode.removeChild(mapContainer);
      }
      mapContainer = null;
    }
  }

  // Stats section
  const statsContainer = document.createElement('div');
  statsContainer.style.display = 'grid';
  statsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
  statsContainer.style.gap = '40px';
  statsContainer.style.marginTop = hasRoute ? '0' : '60px';
  statsContainer.style.marginBottom = '60px';

  // Distance stat
  const distanceStat = createStatCard('Distance', `${ride.distance_km.toFixed(1)} km`, apexWhite, apexGreen);
  statsContainer.appendChild(distanceStat);

  // Duration stat
  const durationStat = createStatCard('Duration', formatDuration(ride.start_time, ride.end_time), apexWhite, apexGreen);
  statsContainer.appendChild(durationStat);

  // Max lean stat
  if (maxLean > 0) {
    const leanStat = createStatCard('Max Lean', `${maxLean.toFixed(1)}°`, apexWhite, apexGreen);
    statsContainer.appendChild(leanStat);
  }

  // Date stat
  const dateStat = createStatCard('Date', formatDate(ride.start_time), apexWhite, apexGreen);
  statsContainer.appendChild(dateStat);

  container.appendChild(statsContainer);

  // Footer with Apex branding
  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.alignItems = 'center';
  footer.style.gap = '16px';
  footer.style.marginTop = 'auto';
  footer.style.paddingTop = '40px';
  footer.style.borderTop = '1px solid rgba(226, 226, 226, 0.1)';
  
  const logoText = document.createElement('div');
  logoText.textContent = 'APEX';
  logoText.style.fontSize = '32px';
  logoText.style.fontWeight = '700';
  logoText.style.color = apexGreen;
  logoText.style.letterSpacing = '4px';
  logoText.style.fontFamily = 'monospace';
  
  footer.appendChild(logoText);
  container.appendChild(footer);

  // Append to body temporarily
  document.body.appendChild(container);

  try {
    // Generate canvas
    const canvas = await html2canvas(container, {
      backgroundColor: apexBlack,
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
      width: 1080,
      height: 1080,
      allowTaint: false,
      foreignObjectRendering: true,
    });

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    
    // Clean up
    if (mapRoot) {
      mapRoot.unmount();
    }
    document.body.removeChild(container);
    
    return dataUrl;
  } catch (error) {
    // Clean up on error
    if (mapRoot) {
      mapRoot.unmount();
    }
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    throw error;
  }
}

/**
 * Create a stat card element
 */
function createStatCard(label: string, value: string, apexWhite: string, apexGreen: string): HTMLDivElement {
  const card = document.createElement('div');
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '8px';

  const labelEl = document.createElement('div');
  labelEl.textContent = label;
  labelEl.style.fontSize = '20px';
  labelEl.style.color = apexWhite;
  labelEl.style.opacity = '0.6';
  labelEl.style.fontWeight = '500';

  const valueEl = document.createElement('div');
  valueEl.textContent = value;
  valueEl.style.fontSize = '40px';
  valueEl.style.color = apexGreen;
  valueEl.style.fontWeight = '700';
  valueEl.style.fontFamily = 'monospace';

  card.appendChild(labelEl);
  card.appendChild(valueEl);

  return card;
}

/**
 * Copy image to clipboard (web only)
 */
async function copyImageToClipboard(blob: Blob): Promise<void> {
  if (!navigator.clipboard || !navigator.clipboard.write) {
    throw new Error('Clipboard API not available');
  }

  try {
    // Create ClipboardItem with the image blob
    const clipboardItem = new ClipboardItem({
      'image/png': blob,
    });
    await navigator.clipboard.write([clipboardItem]);
  } catch {
    // Some browsers may not support ClipboardItem constructor
    // or may require different MIME type handling
    throw new Error('Failed to copy image to clipboard');
  }
}

/**
 * Download image as file (web fallback)
 */
function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Share a ride image
 * - On native platforms: Uses Capacitor Share plugin
 * - On web: Tries to copy to clipboard first, falls back to download
 * @returns Object with method used: 'clipboard' | 'download' | 'share'
 */
export async function shareRideImage(ride: Ride, bike: Bike | undefined): Promise<'clipboard' | 'download' | 'share'> {
  try {
    // Generate the image
    const imageDataUrl = await generateRideShareImage(ride, bike);
    
    // Convert data URL to blob
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();

    if (Capacitor.isNativePlatform()) {
      // Native platform: Use Capacitor Share
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      // For Capacitor, we need to save the file first, then share it
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      // Generate filename
      const timestamp = new Date(ride.start_time).toISOString().replace(/[:.]/g, '-');
      const filename = `apex-ride-${timestamp}.png`;
      
      // Extract base64 data (remove data:image/png;base64, prefix)
      const base64DataOnly = base64Data.includes(',') 
        ? base64Data.split(',')[1] 
        : base64Data;
      
      // Save file to cache directory
      await Filesystem.writeFile({
        path: filename,
        data: base64DataOnly,
        directory: Directory.Cache,
      });
      
      // Get file URI
      const fileUri = await Filesystem.getUri({
        path: filename,
        directory: Directory.Cache,
      });
      
      // Share the file
      await Share.share({
        title: ride.ride_name || 'Apex Ride',
        text: `Check out my ride: ${ride.distance_km.toFixed(1)} km`,
        url: fileUri.uri,
        dialogTitle: 'Share Ride',
      });
      
      // Clean up file after sharing
      Filesystem.deleteFile({
        path: filename,
        directory: Directory.Cache,
      }).catch(() => {
        // Ignore cleanup errors
      });
      
      return 'share';
    } else {
      // Web platform: Try clipboard first, fall back to download
      const timestamp = new Date(ride.start_time).toISOString().replace(/[:.]/g, '-');
      const filename = `apex-ride-${timestamp}.png`;

      try {
        // Try to copy to clipboard first (best UX)
        await copyImageToClipboard(blob);
        // Success - clipboard copy worked
        return 'clipboard';
      } catch (clipboardError) {
        // Clipboard failed or not supported, fall back to download
        logger.debug('Clipboard copy not available, downloading image:', clipboardError);
        downloadImage(blob, filename);
        // Return download method
        return 'download';
      }
    }
  } catch (error) {
    logger.error('Error sharing ride:', error);
    throw error;
  }
}
