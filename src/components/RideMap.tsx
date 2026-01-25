import { useEffect, useMemo } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  useMap,
} from "./ui/map";

interface RideMapProps {
  coordinates: [number, number][]; // Array of [lat, lng]
  className?: string;
  interactive?: boolean; // If false, map is static and won't capture scroll events
  height?: string; // Map height (default: '400px')
  hideControls?: boolean; // If true, hides all UI controls (zoom, attribution) for export
  onMapReady?: (map: MapLibreMap) => void; // Callback when map is ready
}

/**
 * Internal component to handle map bounds fitting and expose map instance
 */
function MapBoundsFitter({
  coordinates,
  onMapReady,
}: {
  coordinates: [number, number][]; // [lng, lat]
  onMapReady?: (map: MapLibreMap) => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || coordinates.length === 0) return;

    const bounds = coordinates.reduce(
      (acc, coord) => {
        const [lng, lat] = coord;
        return {
          minLat: Math.min(acc.minLat, lat),
          maxLat: Math.max(acc.maxLat, lat),
          minLng: Math.min(acc.minLng, lng),
          maxLng: Math.max(acc.maxLng, lng),
        };
      },
      {
        minLat: coordinates[0][1],
        maxLat: coordinates[0][1],
        minLng: coordinates[0][0],
        maxLng: coordinates[0][0],
      }
    );

    const latPadding = (bounds.maxLat - bounds.minLat) * 0.1 || 0.01;
    const lngPadding = (bounds.maxLng - bounds.minLng) * 0.1 || 0.01;

    map.fitBounds(
      [
        [bounds.minLng - lngPadding, bounds.minLat - latPadding],
        [bounds.maxLng + lngPadding, bounds.maxLat + latPadding],
      ],
      {
        padding: 20,
        maxZoom: 18,
      }
    );

    if (onMapReady) {
      map.once("idle", () => {
        map.resize();
        onMapReady(map);
      });
    }
  }, [map, isLoaded, coordinates, onMapReady]);

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
  className = "",
  interactive = false,
  height = "300px",
  hideControls = false,
  onMapReady,
}: RideMapProps) {
  const mapStyleUrl =
    "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
  const polylineColor = useMemo(() => {
    if (typeof window === "undefined") {
      return "var(--color-apex-green)";
    }
    const root = document.documentElement;
    const color = getComputedStyle(root)
      .getPropertyValue("--color-apex-green")
      .trim();
    return color || "var(--color-apex-green)";
  }, []);

  const lineCoordinates: [number, number][] = coordinates.map(([lat, lng]) => [
    lng,
    lat,
  ]);
  const startCoordinate = lineCoordinates[0];
  const endCoordinate = lineCoordinates[lineCoordinates.length - 1];

  const defaultCenter: [number, number] =
    lineCoordinates.length > 0 ? lineCoordinates[0] : [0, 0];

  if (coordinates.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-apex-black border border-apex-white/20 rounded-lg ${className}`}
        style={{ minHeight: "400px" }}
      >
        <p className="text-apex-white/60 font-mono">No route data available</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg overflow-hidden border border-apex-white/20 ${className}`}
      style={{
        isolation: "isolate",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Map
        center={defaultCenter}
        zoom={13}
        interactive={interactive}
        attributionControl={hideControls ? false : undefined}
        className={`bg-apex-black ${
          interactive ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{ height, width: "100%" }}
        theme="dark"
        styles={{ dark: mapStyleUrl, light: mapStyleUrl }}
      >
        <MapRoute
          coordinates={lineCoordinates}
          color={polylineColor}
          width={6}
          opacity={0.25}
          interactive={false}
        />
        <MapRoute
          coordinates={lineCoordinates}
          color={polylineColor}
          width={3.5}
          opacity={0.9}
          interactive={interactive}
        />
        {startCoordinate && endCoordinate && lineCoordinates.length > 1 && (
          <>
            <MapMarker longitude={startCoordinate[0]} latitude={startCoordinate[1]}>
              <MarkerContent>
                <div className="h-3 w-3 rounded-full border border-apex-black/70 bg-apex-red ring-4 ring-apex-red/25" />
              </MarkerContent>
            </MapMarker>
            <MapMarker longitude={endCoordinate[0]} latitude={endCoordinate[1]}>
              <MarkerContent>
                <div className="h-3 w-3 rounded-full border border-apex-black/70 bg-apex-green ring-4 ring-apex-green/25" />
              </MarkerContent>
            </MapMarker>
          </>
        )}
        <MapBoundsFitter coordinates={lineCoordinates} onMapReady={onMapReady} />
        {interactive && !hideControls && <MapControls showZoom />}
      </Map>
    </div>
  );
}
