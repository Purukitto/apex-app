import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RideMapProps {
  coordinates: [number, number][]; // Array of [lat, lng]
  className?: string;
  interactive?: boolean; // If false, map is static and won't capture scroll events
  height?: string; // Map height (default: '400px')
  hideControls?: boolean; // If true, hides all UI controls (zoom, attribution) for export
  onMapReady?: (map: L.Map) => void; // Callback when map is ready
}

/**
 * Internal component to handle map bounds fitting and expose map instance
 */
function MapBoundsFitter({ 
  coordinates, 
  onMapReady 
}: { 
  coordinates: [number, number][];
  onMapReady?: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length === 0) return;

    // Calculate bounds from coordinates
    const bounds = coordinates.reduce(
      (acc, coord) => {
        const [lat, lng] = coord;
        return {
          minLat: Math.min(acc.minLat, lat),
          maxLat: Math.max(acc.maxLat, lat),
          minLng: Math.min(acc.minLng, lng),
          maxLng: Math.max(acc.maxLng, lng),
        };
      },
      {
        minLat: coordinates[0][0],
        maxLat: coordinates[0][0],
        minLng: coordinates[0][1],
        maxLng: coordinates[0][1],
      }
    );

    // Add padding to bounds
    const latPadding = (bounds.maxLat - bounds.minLat) * 0.1 || 0.01;
    const lngPadding = (bounds.maxLng - bounds.minLng) * 0.1 || 0.01;

    map.fitBounds(
      [
        [bounds.minLat - latPadding, bounds.minLng - lngPadding],
        [bounds.maxLat + latPadding, bounds.maxLng + lngPadding],
      ],
      {
        padding: [20, 20],
        maxZoom: 18,
      }
    );
    
    // Notify when map is ready
    if (onMapReady) {
      map.whenReady(() => {
        map.invalidateSize();
        onMapReady(map);
      });
    }
  }, [map, coordinates, onMapReady]);

  return null;
}

/**
 * RideMap - Displays a route trace on a dark-themed map
 * 
 * Features:
 * - Dark map tiles using CSS filter inversion
 * - Route polyline in apex-green theme color
 * - Auto-zoom to fit route bounds
 */
export default function RideMap({ 
  coordinates, 
  className = '', 
  interactive = false,
  height = '300px',
  hideControls = false,
  onMapReady
}: RideMapProps) {
  // Get theme color for polyline
  const getPolylineColor = (): string => {
    if (typeof window === 'undefined') {
      return 'var(--color-apex-green)';
    }
    const root = document.documentElement;
    const color = getComputedStyle(root)
      .getPropertyValue('--color-apex-green')
      .trim();
    return color || 'var(--color-apex-green)';
  };

  const polylineColor = getPolylineColor();

  // Convert coordinates to LatLngExpression format
  const polylinePositions: LatLngExpression[] = coordinates.map(
    ([lat, lng]) => [lat, lng] as LatLngExpression
  );

  // Default center (will be overridden by MapBoundsFitter)
  const defaultCenter: LatLngExpression =
    coordinates.length > 0
      ? [coordinates[0][0], coordinates[0][1]]
      : [0, 0];

  if (coordinates.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-apex-black border border-apex-white/20 rounded-lg ${className}`}
        style={{ minHeight: '400px' }}
      >
        <p className="text-apex-white/60 font-mono">No route data available</p>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-lg overflow-hidden border border-apex-white/20 ${className} ${!interactive ? 'map-non-interactive' : ''} ${hideControls ? 'map-export-mode' : ''}`}
      style={{ 
        isolation: 'isolate', 
        position: 'relative', 
        zIndex: 1
      }}
    >
      <style>
        {hideControls && `
          .map-export-mode .leaflet-control-container {
            display: none !important;
          }
          .map-export-mode .leaflet-control-zoom {
            display: none !important;
          }
          .map-export-mode .leaflet-control-attribution {
            display: none !important;
          }
          .map-export-mode .leaflet-top,
          .map-export-mode .leaflet-bottom,
          .map-export-mode .leaflet-left,
          .map-export-mode .leaflet-right {
            display: none !important;
          }
        `}
      </style>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        preferCanvas={true}
        className="w-full h-full"
        style={{ 
          height, 
          width: '100%', 
          backgroundColor: 'var(--color-apex-black, #0A0A0A)',
          position: 'relative',
          zIndex: 1,
          pointerEvents: interactive ? 'auto' : 'none'
        }}
      >
        <TileLayer
          attribution={hideControls ? '' : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-map-tiles"
          crossOrigin="anonymous"
        />
        <Polyline
          positions={polylinePositions}
          pathOptions={{
            color: polylineColor,
            weight: 4,
            opacity: 0.9,
          }}
        />
        <MapBoundsFitter coordinates={coordinates} onMapReady={onMapReady} />
      </MapContainer>
    </div>
  );
}
