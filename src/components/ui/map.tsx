/* eslint-disable react-refresh/only-export-components */
"use client";

import MapLibreGL, {
  type Map as MapLibreMap,
  type PopupOptions,
  type MarkerOptions,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Loader2, Locate, Maximize, Minus, Plus, X } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "../../lib/utils";
import { logger } from "../../lib/logger";
import { buttonHoverProps } from "../../lib/animations";

type Theme = "light" | "dark";
type MapStyleOption = string | MapLibreGL.StyleSpecification;

const defaultStyles = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

// Check document class for theme (works with next-themes, etc.)
function getDocumentTheme(): Theme | null {
  if (typeof document === "undefined") return null;
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.classList.contains("light")) return "light";
  return null;
}

// Get system preference
function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useResolvedTheme(themeProp?: Theme): Theme {
  const [detectedTheme, setDetectedTheme] = useState<Theme>(
    () => getDocumentTheme() ?? getSystemTheme()
  );

  useEffect(() => {
    if (themeProp) return;

    const observer = new MutationObserver(() => {
      const docTheme = getDocumentTheme();
      if (docTheme) {
        setDetectedTheme(docTheme);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (!getDocumentTheme()) {
        setDetectedTheme(e.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, [themeProp]);

  return themeProp ?? detectedTheme;
}

type MapContextValue = {
  map: MapLibreMap | null;
  isLoaded: boolean;
};

const MapContext = createContext<MapContextValue | null>(null);

function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a Map component");
  }
  return context;
}

type MapProps = {
  children?: ReactNode;
  theme?: Theme;
  styles?: {
    light?: MapStyleOption;
    dark?: MapStyleOption;
  };
  projection?: MapLibreGL.ProjectionSpecification;
  className?: string;
  loadingFallback?: ReactNode;
  style?: React.CSSProperties;
} & Omit<MapLibreGL.MapOptions, "container" | "style">;

type MapRef = MapLibreMap;

const DefaultLoader = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-apex-black/80">
    <Loader2 className="h-5 w-5 text-apex-white/70 animate-spin" />
  </div>
);

const Map = forwardRef<MapRef, MapProps>(function Map(
  {
    children,
    theme: themeProp,
    styles,
    projection,
    className,
    loadingFallback,
    style,
    ...props
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const currentStyleRef = useRef<MapStyleOption | null>(null);
  const styleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedTheme = useResolvedTheme(themeProp);

  const mapStyles = useMemo(
    () => ({
      dark: styles?.dark ?? defaultStyles.dark,
      light: styles?.light ?? defaultStyles.light,
    }),
    [styles]
  );

  useImperativeHandle(ref, () => mapInstance as MapLibreMap, [mapInstance]);

  const clearStyleTimeout = useCallback(() => {
    if (styleTimeoutRef.current) {
      clearTimeout(styleTimeoutRef.current);
      styleTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const initialStyle =
      resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;
    currentStyleRef.current = initialStyle;

    const mapOptions: MapLibreGL.MapOptions = {
      container: containerRef.current,
      style: initialStyle,
      renderWorldCopies: false,
      ...props,
    };
    if (props.attributionControl !== undefined) {
      mapOptions.attributionControl = props.attributionControl;
    }

    const map = new MapLibreGL.Map(mapOptions);

    const styleDataHandler = () => {
      clearStyleTimeout();
      styleTimeoutRef.current = setTimeout(() => {
        setIsStyleLoaded(true);
        if (projection) {
          map.setProjection(projection);
        }
      }, 100);
    };
    const loadHandler = () => setIsLoaded(true);

    map.on("load", loadHandler);
    map.on("styledata", styleDataHandler);
    setMapInstance(map);

    return () => {
      clearStyleTimeout();
      map.off("load", loadHandler);
      map.off("styledata", styleDataHandler);
      map.remove();
      setIsLoaded(false);
      setIsStyleLoaded(false);
      setMapInstance(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstance || !resolvedTheme) return;

    const newStyle =
      resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;

    if (currentStyleRef.current === newStyle) return;

    clearStyleTimeout();
    currentStyleRef.current = newStyle;
    setIsStyleLoaded(false);

    mapInstance.setStyle(newStyle, { diff: true });
  }, [mapInstance, resolvedTheme, mapStyles, clearStyleTimeout]);

  const contextValue = useMemo(
    () => ({
      map: mapInstance,
      isLoaded: isLoaded && isStyleLoaded,
    }),
    [mapInstance, isLoaded, isStyleLoaded]
  );

  return (
    <div className={cn("relative h-full w-full", className)} style={style}>
      {!isLoaded && (loadingFallback ?? <DefaultLoader />)}
      <div ref={containerRef} className="h-full w-full" />
      {mapInstance && (
        <MapContext.Provider value={contextValue}>
          {children}
        </MapContext.Provider>
      )}
    </div>
  );
});

type MapRouteProps = {
  id?: string;
  coordinates: [number, number][];
  color?: string;
  width?: number;
  opacity?: number;
  dashArray?: [number, number];
  interactive?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

function MapRoute({
  id: propId,
  coordinates,
  color = "#4285F4",
  width = 3,
  opacity = 0.8,
  dashArray,
  interactive = true,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: MapRouteProps) {
  const { map, isLoaded } = useMap();
  const autoId = useId();
  const id = propId ?? autoId;
  const sourceId = `route-source-${id}`;
  const layerId = `route-layer-${id}`;

  useEffect(() => {
    if (!isLoaded || !map) return;

    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] },
      },
    });

    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": color,
        "line-width": width,
        "line-opacity": opacity,
        ...(dashArray && { "line-dasharray": dashArray }),
      },
    });

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // ignore
      }
    };
  }, [isLoaded, map, sourceId, layerId, color, width, opacity, dashArray]);

  useEffect(() => {
    if (!isLoaded || !map || coordinates.length < 2) return;

    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates },
      });
    }
  }, [isLoaded, map, coordinates, sourceId]);

  useEffect(() => {
    if (!isLoaded || !map || !map.getLayer(layerId)) return;

    map.setPaintProperty(layerId, "line-color", color);
    map.setPaintProperty(layerId, "line-width", width);
    map.setPaintProperty(layerId, "line-opacity", opacity);
    if (dashArray) {
      map.setPaintProperty(layerId, "line-dasharray", dashArray);
    }
  }, [isLoaded, map, layerId, color, width, opacity, dashArray]);

  useEffect(() => {
    if (!isLoaded || !map || !interactive) return;

    const handleClick = () => onClick?.();
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
      onMouseEnter?.();
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      onMouseLeave?.();
    };

    map.on("click", layerId, handleClick);
    map.on("mouseenter", layerId, handleMouseEnter);
    map.on("mouseleave", layerId, handleMouseLeave);

    return () => {
      map.off("click", layerId, handleClick);
      map.off("mouseenter", layerId, handleMouseEnter);
      map.off("mouseleave", layerId, handleMouseLeave);
    };
  }, [isLoaded, map, layerId, interactive, onClick, onMouseEnter, onMouseLeave]);

  return null;
}

type MapControlsProps = {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showZoom?: boolean;
  showLocate?: boolean;
  showFullscreen?: boolean;
  className?: string;
  onLocate?: (coords: { longitude: number; latitude: number }) => void;
};

const positionClasses = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-10 right-2",
};

function ControlGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-apex-white/10 bg-apex-black/80 p-1">
      {children}
    </div>
  );
}

function ControlButton({
  onClick,
  label,
  children,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-md text-apex-white/70 transition-colors hover:text-apex-white disabled:opacity-50"
      {...(disabled ? {} : buttonHoverProps)}
    >
      {children}
    </motion.button>
  );
}

function MapControls({
  position = "bottom-right",
  showZoom = true,
  showLocate = false,
  showFullscreen = false,
  className,
  onLocate,
}: MapControlsProps) {
  const { map } = useMap();
  const [waitingForLocation, setWaitingForLocation] = useState(false);

  const handleZoomIn = useCallback(() => {
    map?.zoomTo(map.getZoom() + 1, { duration: 300 });
  }, [map]);

  const handleZoomOut = useCallback(() => {
    map?.zoomTo(map.getZoom() - 1, { duration: 300 });
  }, [map]);

  const handleLocate = useCallback(() => {
    setWaitingForLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
          };
          map?.flyTo({
            center: [coords.longitude, coords.latitude],
            zoom: 14,
            duration: 1500,
          });
          onLocate?.(coords);
          setWaitingForLocation(false);
        },
        (error) => {
          logger.warn("Location lookup failed", error);
          setWaitingForLocation(false);
        }
      );
    }
  }, [map, onLocate]);

  const handleFullscreen = useCallback(() => {
    const container = map?.getContainer();
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      container.requestFullscreen().catch(() => undefined);
    }
  }, [map]);

  return (
    <div
      className={cn(
        "absolute z-10",
        positionClasses[position],
        className
      )}
    >
      <ControlGroup>
        {showZoom && (
          <>
            <ControlButton onClick={handleZoomIn} label="Zoom in">
              <Plus size={16} />
            </ControlButton>
            <ControlButton onClick={handleZoomOut} label="Zoom out">
              <Minus size={16} />
            </ControlButton>
          </>
        )}
        {showLocate && (
          <ControlButton
            onClick={handleLocate}
            label="Locate"
            disabled={waitingForLocation}
          >
            {waitingForLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Locate size={16} />
            )}
          </ControlButton>
        )}
        {showFullscreen && (
          <ControlButton onClick={handleFullscreen} label="Fullscreen">
            <Maximize size={16} />
          </ControlButton>
        )}
      </ControlGroup>
    </div>
  );
}

type MarkerContextValue = {
  marker: MapLibreGL.Marker;
  map: MapLibreMap | null;
};

const MarkerContext = createContext<MarkerContextValue | null>(null);

function useMarkerContext() {
  const context = useContext(MarkerContext);
  if (!context) {
    throw new Error("Marker components must be used within MapMarker");
  }
  return context;
}

type MapMarkerProps = {
  longitude: number;
  latitude: number;
  children: ReactNode;
  onClick?: (e: MouseEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  onDragStart?: (lngLat: { lng: number; lat: number }) => void;
  onDrag?: (lngLat: { lng: number; lat: number }) => void;
  onDragEnd?: (lngLat: { lng: number; lat: number }) => void;
} & Omit<MarkerOptions, "element">;

function MapMarker({
  longitude,
  latitude,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDrag,
  onDragEnd,
  draggable = false,
  ...markerOptions
}: MapMarkerProps) {
  const { map } = useMap();
  const hasValidPosition =
    Number.isFinite(longitude) && Number.isFinite(latitude);
  const marker = useMemo(
    () =>
      new MapLibreGL.Marker({
        ...markerOptions,
        element: document.createElement("div"),
        draggable,
      }),
    [markerOptions, draggable]
  );
  const clickRef = useRef(onClick);
  const mouseEnterRef = useRef(onMouseEnter);
  const mouseLeaveRef = useRef(onMouseLeave);
  const dragStartRef = useRef(onDragStart);
  const dragRef = useRef(onDrag);
  const dragEndRef = useRef(onDragEnd);

  useEffect(() => {
    clickRef.current = onClick;
    mouseEnterRef.current = onMouseEnter;
    mouseLeaveRef.current = onMouseLeave;
    dragStartRef.current = onDragStart;
    dragRef.current = onDrag;
    dragEndRef.current = onDragEnd;
  }, [onClick, onMouseEnter, onMouseLeave, onDragStart, onDrag, onDragEnd]);

  useEffect(() => {
    if (!map || !marker || !hasValidPosition) return;
    marker.setLngLat([longitude, latitude]);
    marker.addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, marker, hasValidPosition, longitude, latitude]);

  useEffect(() => {
    if (!marker) return;
    if (!hasValidPosition) {
      marker.remove();
      return;
    }
    marker.setLngLat([longitude, latitude]);
  }, [marker, hasValidPosition, longitude, latitude]);

  useEffect(() => {
    if (!marker) return;
    marker.setDraggable(draggable);
  }, [marker, draggable]);

  useEffect(() => {
    if (!marker) return;
    const newOffset = markerOptions.offset ?? [0, 0];
    marker.setOffset(newOffset);
  }, [marker, markerOptions.offset]);

  useEffect(() => {
    if (!marker) return;
    marker.setRotation(markerOptions.rotation ?? 0);
    marker.setRotationAlignment(markerOptions.rotationAlignment ?? "auto");
    marker.setPitchAlignment(markerOptions.pitchAlignment ?? "auto");
  }, [
    marker,
    markerOptions.rotation,
    markerOptions.rotationAlignment,
    markerOptions.pitchAlignment,
  ]);

  useEffect(() => {
    if (!marker) return;

    const handleClick = (e: MouseEvent) => clickRef.current?.(e);
    const handleMouseEnter = (e: MouseEvent) => mouseEnterRef.current?.(e);
    const handleMouseLeave = (e: MouseEvent) => mouseLeaveRef.current?.(e);

    marker.getElement()?.addEventListener("click", handleClick);
    marker.getElement()?.addEventListener("mouseenter", handleMouseEnter);
    marker.getElement()?.addEventListener("mouseleave", handleMouseLeave);

    const handleDragStart = () => {
      const lngLat = marker.getLngLat();
      dragStartRef.current?.({ lng: lngLat.lng, lat: lngLat.lat });
    };
    const handleDrag = () => {
      const lngLat = marker.getLngLat();
      dragRef.current?.({ lng: lngLat.lng, lat: lngLat.lat });
    };
    const handleDragEnd = () => {
      const lngLat = marker.getLngLat();
      dragEndRef.current?.({ lng: lngLat.lng, lat: lngLat.lat });
    };

    marker.on("dragstart", handleDragStart);
    marker.on("drag", handleDrag);
    marker.on("dragend", handleDragEnd);

    return () => {
      marker.getElement()?.removeEventListener("click", handleClick);
      marker.getElement()?.removeEventListener("mouseenter", handleMouseEnter);
      marker.getElement()?.removeEventListener("mouseleave", handleMouseLeave);
      marker.off("dragstart", handleDragStart);
      marker.off("drag", handleDrag);
      marker.off("dragend", handleDragEnd);
    };
  }, [marker]);

  return (
    <MarkerContext.Provider value={{ marker, map }}>
      {children}
    </MarkerContext.Provider>
  );
}

type MarkerContentProps = {
  children?: ReactNode;
  className?: string;
};

function MarkerContent({ children, className }: MarkerContentProps) {
  const { marker } = useMarkerContext();

  return createPortal(
    <div className={cn("flex items-center justify-center", className)}>
      {children}
    </div>,
    marker.getElement()
  );
}

type MarkerPopupProps = {
  children: ReactNode;
  className?: string;
  closeButton?: boolean;
} & Omit<PopupOptions, "closeButton">;

function MarkerPopup({
  children,
  className,
  closeButton = false,
  ...popupOptions
}: MarkerPopupProps) {
  const { marker, map } = useMarkerContext();
  const container = useMemo(() => document.createElement("div"), []);
  const popup = useMemo(() => {
    const popupInstance = new MapLibreGL.Popup({
      offset: 16,
      closeButton: false,
    })
      .setMaxWidth("none")
      .setDOMContent(container);

    return popupInstance;
  }, [container]);

  useEffect(() => {
    if (!map) return;

    popup.setDOMContent(container);
    marker.setPopup(popup);

    return () => {
      marker.setPopup(null);
    };
  }, [map, marker, popup, container]);

  useEffect(() => {
    if (!popup.isOpen()) return;
    if (popupOptions.offset !== undefined) {
      popup.setOffset(popupOptions.offset ?? 16);
    }
    if (popupOptions.maxWidth) {
      popup.setMaxWidth(popupOptions.maxWidth ?? "none");
    }
  }, [popup, popupOptions.offset, popupOptions.maxWidth]);

  const handleClose = () => popup.remove();

  return createPortal(
    <div className={cn("relative", className)}>
      {closeButton && (
        <motion.button
          onClick={handleClose}
          className="absolute -right-2 -top-2 rounded-full border border-apex-white/10 bg-apex-black p-1 text-apex-white/70"
          {...buttonHoverProps}
        >
          <X size={14} />
        </motion.button>
      )}
      {children}
    </div>,
    container
  );
}

type MarkerTooltipProps = {
  children: ReactNode;
  className?: string;
} & Omit<PopupOptions, "closeButton">;

function MarkerTooltip({ children, className, ...popupOptions }: MarkerTooltipProps) {
  const { marker, map } = useMarkerContext();
  const container = useMemo(() => document.createElement("div"), []);
  const tooltip = useMemo(() => {
    const tooltipInstance = new MapLibreGL.Popup({
      offset: 16,
      closeOnClick: true,
      closeButton: false,
    }).setMaxWidth("none");

    return tooltipInstance;
  }, []);

  useEffect(() => {
    if (!map) return;

    tooltip.setDOMContent(container);

    const handleMouseEnter = () => {
      tooltip.setLngLat(marker.getLngLat()).addTo(map);
    };
    const handleMouseLeave = () => tooltip.remove();

    marker.getElement()?.addEventListener("mouseenter", handleMouseEnter);
    marker.getElement()?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      marker.getElement()?.removeEventListener("mouseenter", handleMouseEnter);
      marker.getElement()?.removeEventListener("mouseleave", handleMouseLeave);
      tooltip.remove();
    };
  }, [map, marker, tooltip, container]);

  useEffect(() => {
    if (!tooltip.isOpen()) return;
    if (popupOptions.offset !== undefined) {
      tooltip.setOffset(popupOptions.offset ?? 16);
    }
    if (popupOptions.maxWidth) {
      tooltip.setMaxWidth(popupOptions.maxWidth ?? "none");
    }
  }, [tooltip, popupOptions.offset, popupOptions.maxWidth]);

  return createPortal(
    <div className={cn("rounded-lg border border-apex-white/10 bg-apex-black/90 px-3 py-2 text-xs text-apex-white", className)}>
      {children}
    </div>,
    container
  );
}

type MarkerLabelProps = {
  children: ReactNode;
  className?: string;
  position?: "top" | "bottom";
};

function MarkerLabel({
  children,
  className,
  position = "top",
}: MarkerLabelProps) {
  const positionClasses = {
    top: "bottom-full mb-1",
    bottom: "top-full mt-1",
  };

  return (
    <div
      className={cn(
        "absolute left-1/2 -translate-x-1/2 rounded-md border border-apex-white/10 bg-apex-black/90 px-2 py-1 text-xs text-apex-white",
        positionClasses[position],
        className
      )}
    >
      {children}
    </div>
  );
}

type MapPopupProps = {
  longitude: number;
  latitude: number;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  closeButton?: boolean;
} & Omit<PopupOptions, "closeButton">;

function MapPopup({
  longitude,
  latitude,
  onClose,
  children,
  className,
  closeButton = false,
  ...popupOptions
}: MapPopupProps) {
  const { map } = useMap();
  const container = useMemo(() => document.createElement("div"), []);

  const popup = useMemo(() => {
    const popupInstance = new MapLibreGL.Popup({
      offset: 16,
      closeButton: false,
    })
      .setMaxWidth("none")
      .setLngLat([longitude, latitude]);

    return popupInstance;
  }, [longitude, latitude]);

  useEffect(() => {
    if (!map) return;

    const onCloseProp = () => onClose?.();
    popup.on("close", onCloseProp);

    popup.setDOMContent(container);
    popup.addTo(map);

    return () => {
      popup.off("close", onCloseProp);
      if (popup.isOpen()) {
        popup.remove();
      }
    };
  }, [map, popup, container, onClose]);

  useEffect(() => {
    if (!popup.isOpen()) return;
    if (
      popup.getLngLat().lng !== longitude ||
      popup.getLngLat().lat !== latitude
    ) {
      popup.setLngLat([longitude, latitude]);
    }
    if (popupOptions.offset !== undefined) {
      popup.setOffset(popupOptions.offset ?? 16);
    }
    if (popupOptions.maxWidth) {
      popup.setMaxWidth(popupOptions.maxWidth ?? "none");
    }
  }, [popup, longitude, latitude, popupOptions.offset, popupOptions.maxWidth]);

  const handleClose = () => {
    popup.remove();
    onClose?.();
  };

  return createPortal(
    <div className={cn("relative", className)}>
      {closeButton && (
        <motion.button
          onClick={handleClose}
          className="absolute -right-2 -top-2 rounded-full border border-apex-white/10 bg-apex-black p-1 text-apex-white/70"
          {...buttonHoverProps}
        >
          <X size={14} />
        </motion.button>
      )}
      {children}
    </div>,
    container
  );
}

export {
  Map,
  useMap,
  MapControls,
  MapRoute,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
  MarkerLabel,
  MapPopup,
};

export type { MapRef };
