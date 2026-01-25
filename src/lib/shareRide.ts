import html2canvas from 'html2canvas';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import MapLibreGL from 'maplibre-gl';
import type { Ride } from '../types/database';
import type { Bike } from '../types/database';
import { logger } from './logger';
import { formatDuration, formatShortDate } from '../utils/format';

const MAP_STYLE_URL =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

async function renderMapLibreSnapshot(
  container: HTMLElement,
  backgroundColor: string,
  routeCoordinates: [number, number][],
  routeColor: string,
  startColor: string,
  endColor: string
): Promise<string | null> {
  if (routeCoordinates.length === 0) return null;

  const mapOptions: MapLibreGL.MapOptions & { preserveDrawingBuffer?: boolean } =
    {
      container,
      style: MAP_STYLE_URL,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      renderWorldCopies: false,
    };
  const map = new MapLibreGL.Map(mapOptions);
  map.on('error', (event) => {
    if (event?.error) {
      logger.warn('MapLibre snapshot error event:', event.error);
    }
  });

  const waitForLoad = () =>
    new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Map snapshot load timeout'));
      }, 20000);

      map.once('load', () => {
        clearTimeout(timeoutId);
        resolve();
      });
    });

  const waitForIdle = () =>
    new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Map snapshot idle timeout'));
      }, 20000);

      map.once('idle', () => {
        clearTimeout(timeoutId);
        resolve();
      });
    });

  const waitForRender = () =>
    new Promise<void>((resolve) => {
      let resolved = false;
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      }, 1500);

      const handleRender = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        map.off('render', handleRender);
        resolve();
      };

      map.on('render', handleRender);
    });

  const waitForTiles = () =>
    new Promise<void>((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve();
      }, 8000);

      const checkTiles = () => {
        if (map.areTilesLoaded()) {
          clearTimeout(timeoutId);
          resolve();
          return;
        }
        requestAnimationFrame(checkTiles);
      };

      checkTiles();
    });

  try {
    container.style.backgroundColor = backgroundColor;
    container.style.opacity = '0.01';
    await waitForLoad();
    map.resize();

    map.addSource('route-source', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: routeCoordinates },
      },
    });

    map.addLayer({
      id: 'route-layer',
      type: 'line',
      source: 'route-source',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': routeColor,
        'line-width': 4,
        'line-opacity': 0.9,
      },
    });

    if (routeCoordinates.length > 1) {
      const startPoint = routeCoordinates[0];
      const endPoint = routeCoordinates[routeCoordinates.length - 1];

      map.addSource('route-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { role: 'start', color: startColor },
              geometry: { type: 'Point', coordinates: startPoint },
            },
            {
              type: 'Feature',
              properties: { role: 'end', color: endColor },
              geometry: { type: 'Point', coordinates: endPoint },
            },
          ],
        },
      });

      map.addLayer({
        id: 'route-points-halo',
        type: 'circle',
        source: 'route-points',
        paint: {
          'circle-radius': 10,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.25,
        },
      });

      map.addLayer({
        id: 'route-points-core',
        type: 'circle',
        source: 'route-points',
        paint: {
          'circle-radius': 4.5,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#0A0A0A',
        },
      });

      const lngs = routeCoordinates.map(([lng]) => lng);
      const lats = routeCoordinates.map(([, lat]) => lat);
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
      map.fitBounds(bounds, { padding: 12, maxZoom: 19 });
    } else {
      map.setCenter(routeCoordinates[0]);
      map.setZoom(16);
    }

    map.resize();
    map.triggerRepaint();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    await waitForIdle().catch(async () => {
      await waitForRender();
    });
    await waitForTiles();

    const canvas = map.getCanvas();
    if (canvas.width === 0 || canvas.height === 0) {
      logger.warn('Map snapshot skipped - canvas size is zero');
      return null;
    }
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((output) => resolve(output), 'image/png');
      });
      if (!blob || blob.size === 0) {
        logger.warn('Map snapshot skipped - canvas blob empty');
        return null;
      }
      return dataUrl;
    } catch (error) {
      logger.error('Map snapshot failed to export canvas', error);
      return null;
    }
  } catch (error) {
    logger.error('Map snapshot failed:', error);
    return null;
  } finally {
    map.remove();
  }
}

export type ShareMode = 
  | 'no-map-no-image'
  | 'map-no-image'
  | 'no-map-image-dark'
  | 'map-image-dark'
  | 'no-map-image-transparent';

/**
 * Shared resources for optimized batch preview generation
 */
interface SharedResources {
  contentContainer: HTMLElement;
  mapSnapshot: string | null;
  routeCoordinates: [number, number][];
  hasRoute: boolean;
  hasImageUrl: boolean;
  apexBlack: string;
  apexWhite: string;
  apexGreen: string;
  apexRed: string;
}

/**
 * Build shared resources (content container + map snapshot) for optimized batch generation
 */
async function buildSharedResources(
  ride: Ride,
  bike: Bike | undefined
): Promise<SharedResources> {
  // Get theme colors from CSS variables
  const root = document.documentElement;
  const apexBlack = getComputedStyle(root).getPropertyValue('--color-apex-black').trim() || 'var(--color-apex-black)';
  const apexWhite = getComputedStyle(root).getPropertyValue('--color-apex-white').trim() || 'var(--color-apex-white)';
  const apexGreen = getComputedStyle(root).getPropertyValue('--color-apex-green').trim() || 'var(--color-apex-green)';
  const apexRed = getComputedStyle(root).getPropertyValue('--color-apex-red').trim() || 'var(--color-apex-red)';

  // Check if route data is available
  const hasRoute = ride.route_path && 
                   ride.route_path.coordinates && 
                   Array.isArray(ride.route_path.coordinates) && 
                   ride.route_path.coordinates.length > 0;

  // Use [lng, lat] coordinates for MapLibre
  const routeCoordinates: [number, number][] =
    hasRoute && ride.route_path
      ? ride.route_path.coordinates.map(
          ([lng, lat]: [number, number]) => [lng, lat] as [number, number]
        )
      : [];

  // Check if ride has image URL
  const hasImageUrl = ride.image_url && ride.image_url.trim() !== '';

  // Build shared content container (header, stats, footer)
  const contentContainer = buildSharedContentContainer(
    ride,
    bike,
    !!hasRoute, // Ensure boolean
    apexBlack,
    apexWhite,
    apexGreen
  );

  // Ensure logo/image assets are loaded before rendering
  const ensureImagesLoaded = async (container: HTMLElement) => {
    const images = Array.from(container.querySelectorAll('img'));
    if (images.length === 0) return;
    await Promise.all(
      images.map((img) => new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
          return;
        }
        const onLoad = () => resolve();
        const onError = () => {
          // Remove failed images to avoid html2canvas errors
          img.remove();
          resolve();
        };
        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onError, { once: true });
      }))
    );
  };

  await ensureImagesLoaded(contentContainer);

  // Generate map snapshot once if route exists
  let mapSnapshot: string | null = null;
  if (hasRoute && routeCoordinates.length > 0) {
    try {
      const tempMapWrapper = document.createElement('div');
      tempMapWrapper.style.width = '960px';
      tempMapWrapper.style.height = '400px';
      tempMapWrapper.style.position = 'fixed';
      tempMapWrapper.style.left = '0';
      tempMapWrapper.style.top = '0';
      tempMapWrapper.style.transform = 'translateX(-2000px)';
      tempMapWrapper.style.opacity = '0.01';
      tempMapWrapper.style.pointerEvents = 'none';
      tempMapWrapper.style.backgroundColor = apexBlack;
      document.body.appendChild(tempMapWrapper);

      mapSnapshot = await renderMapLibreSnapshot(
        tempMapWrapper,
        apexBlack,
        routeCoordinates,
        apexGreen,
        apexRed,
        apexGreen
      );
      if (!mapSnapshot) {
        logger.warn('Map snapshot generation returned empty result');
      } else {
        logger.info('Map snapshot generated', {
          length: mapSnapshot.length,
          hasRoute: routeCoordinates.length,
        });
      }

      if (tempMapWrapper.parentNode) {
        document.body.removeChild(tempMapWrapper);
      }
    } catch (error) {
      logger.error('Error generating map snapshot:', error);
    }
  }

  return {
    contentContainer,
    mapSnapshot,
    routeCoordinates,
    hasRoute: !!hasRoute, // Ensure boolean
    hasImageUrl: !!hasImageUrl, // Ensure boolean
    apexBlack,
    apexWhite,
    apexGreen,
    apexRed,
  };
}

/**
 * Generate a shareable image for a ride (Strava-style)
 * Creates an image with ride stats and styling, including map if route data is available
 * @param sharedResources Optional shared resources for optimized batch generation
 */
export async function generateRideShareImage(
  ride: Ride,
  bike: Bike | undefined,
  mode: ShareMode = 'no-map-no-image',
  sharedResources?: SharedResources
): Promise<string> {
  // Use shared resources if provided, otherwise build them
  const resources = sharedResources || await buildSharedResources(ride, bike);
  const {
    contentContainer: sharedContent,
    mapSnapshot: sharedMapSnapshot,
    routeCoordinates,
    hasRoute,
    hasImageUrl,
    apexBlack,
    apexWhite,
  } = resources;

  // Determine what to show based on mode
  const showMap = (mode === 'map-no-image' || mode === 'map-image-dark') && hasRoute && routeCoordinates.length > 0;
  const showImage = mode === 'no-map-image-dark' || mode === 'map-image-dark' || mode === 'no-map-image-transparent';
  const imageDarkened = mode === 'no-map-image-dark' || mode === 'map-image-dark';
  const transparentBg = mode === 'no-map-image-transparent';

  // Create a wrapper container
  // html2canvas needs the element to be in the DOM and properly positioned
  const wrapper = document.createElement('div');
  wrapper.style.width = '1080px';
  wrapper.style.height = '1080px';
  wrapper.style.overflow = 'hidden';
  
  // Set background based on mode
  // For transparent mode, never set background image - it should be truly transparent
  if (showImage && hasImageUrl && !transparentBg) {
    // Validate and preload image to ensure it's accessible
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Preload image before setting as background
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          logger.warn('Image preload timeout, proceeding anyway');
          resolve();
        }, 5000);
        
        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        img.onerror = (error) => {
          clearTimeout(timeout);
          logger.error('Failed to preload background image', error);
          // Continue anyway - might still work
          resolve();
        };
        
        img.src = ride.image_url!;
      });
      
      wrapper.style.backgroundImage = `url(${ride.image_url})`;
      wrapper.style.backgroundSize = 'cover';
      wrapper.style.backgroundPosition = 'center';
      
      if (imageDarkened) {
        // Add dark overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.inset = '0';
        overlay.style.backgroundColor = 'rgba(10, 10, 10, 0.7)';
        overlay.style.zIndex = '1';
        wrapper.appendChild(overlay);
      }
    } catch (error) {
      logger.error('Error setting background image', error);
      // Fallback to solid color
      wrapper.style.background = apexBlack;
    }
  } else {
    // No image or transparent mode - set solid color or transparent
    wrapper.style.background = transparentBg ? 'transparent' : apexBlack;
    wrapper.style.backgroundColor = transparentBg ? 'transparent' : apexBlack;
  }

  // Clone shared content container (optimization: reuse instead of rebuilding)
  const container = sharedContent.cloneNode(true) as HTMLElement;
  // Update container background based on mode
  if (transparentBg || (showImage && hasImageUrl)) {
    container.style.backgroundColor = 'transparent';
  } else {
    container.style.backgroundColor = apexBlack;
  }
  
  wrapper.appendChild(container);

  // Insert map snapshot if needed (optimization: reuse pre-generated snapshot)
  let mapContainer: HTMLElement | null = null;
  let mapSnapshotApplied = false;
  
  if (showMap && sharedMapSnapshot) {
    // Find header in cloned container to insert map after it
    const header = container.querySelector('div:first-child') as HTMLElement | null;
    if (header) {
      const mapWrapper = document.createElement('div');
      mapWrapper.style.width = '100%';
      mapWrapper.style.height = '400px';
      mapWrapper.style.marginTop = '40px';
      mapWrapper.style.marginBottom = '40px';
      mapWrapper.style.borderRadius = '12px';
      mapWrapper.style.overflow = 'hidden';
      // Border with 20% opacity
      // Use apexWhite for border color (apexGreen not needed here)
      if (apexWhite.startsWith('#')) {
        const borderColor = apexWhite.replace('#', '');
        const r = parseInt(borderColor.substring(0, 2), 16);
        const g = parseInt(borderColor.substring(2, 4), 16);
        const b = parseInt(borderColor.substring(4, 6), 16);
        mapWrapper.style.border = `1px solid rgba(${r}, ${g}, ${b}, 0.2)`;
      } else {
        mapWrapper.style.border = '1px solid rgba(226, 226, 226, 0.2)';
      }
      mapWrapper.style.position = 'relative';
      mapWrapper.style.zIndex = '1';
      mapWrapper.id = 'share-map-container';
      mapWrapper.style.backgroundColor = apexBlack;
      mapWrapper.style.backgroundImage = `url("${sharedMapSnapshot}")`;
      mapWrapper.style.backgroundSize = 'cover';
      mapWrapper.style.backgroundPosition = 'center';
      mapWrapper.style.backgroundRepeat = 'no-repeat';
      mapWrapper.dataset.snapshotApplied = 'true';
      
      container.insertBefore(mapWrapper, header.nextSibling);
      mapContainer = mapWrapper;
      mapSnapshotApplied = true;
    }
  }

  // Append wrapper to body - html2canvas needs element in DOM and in viewport
  // Keep in viewport but position off-screen using left (html2canvas requirement)
  wrapper.style.position = 'fixed';
  wrapper.style.left = '0';
  wrapper.style.top = '0';
  wrapper.style.width = '1080px';
  wrapper.style.height = '1080px';
  wrapper.style.overflow = 'hidden';
  wrapper.style.visibility = 'visible';
  wrapper.style.opacity = '1';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.zIndex = '-1';
  // Move off-screen but keep in viewport bounds
  wrapper.style.marginLeft = '-1080px';
  
  document.body.appendChild(wrapper);

  try {
    // Force a reflow to ensure DOM is updated
    void wrapper.offsetHeight;
    
    // Wait for content to render (no need to wait for map if using snapshot)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Force reflow to ensure everything is painted
    void wrapper.offsetHeight;
    void container.offsetHeight;
    
    // Additional wait to ensure all content is fully rendered
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate canvas - target the wrapper
    // Convert all CSS variables and computed styles to explicit RGB values
    // This prevents html2canvas from encountering unsupported color functions like oklab
    // CRITICAL: Must convert ALL colors before html2canvas parses the DOM
    const convertColorsToRGB = (element: HTMLElement) => {
      try {
        const computed = window.getComputedStyle(element);
        
        // Convert background-color - ensure it's RGB, not oklab/color-mix
        const bgColor = computed.backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          // Force RGB format - if it contains oklab, getComputedStyle should have resolved it
          // But set it explicitly to ensure html2canvas sees RGB
          element.style.setProperty('background-color', bgColor, 'important');
        }
        
        // Convert color
        const textColor = computed.color;
        if (textColor && textColor !== 'rgba(0, 0, 0, 0)') {
          element.style.setProperty('color', textColor, 'important');
        }
        
        // Convert border-color
        if (computed.borderWidth !== '0px') {
          const borderColor = computed.borderColor;
          if (borderColor) {
            element.style.setProperty('border-color', borderColor, 'important');
          }
        }
        
        // Also convert outline-color, box-shadow colors, etc.
        const outlineColor = computed.outlineColor;
        if (outlineColor && computed.outlineWidth !== '0px') {
          element.style.setProperty('outline-color', outlineColor, 'important');
        }
      } catch {
        // Ignore errors - element might not be fully rendered
      }
    };
    
    // Convert colors on wrapper and ALL children BEFORE html2canvas runs
    // This is critical - html2canvas parses styles during initialization
    convertColorsToRGB(wrapper);
    const allElements = wrapper.querySelectorAll('*');
    allElements.forEach((el) => {
      try {
        const htmlEl = el as HTMLElement;
        convertColorsToRGB(htmlEl);
        
        // Remove CSS classes that might use Tailwind/oklab colors
        // SVG elements expose className differently, so treat them separately
        const isSvgElement = el instanceof SVGElement;
        const classNameStr = isSvgElement
          ? (el.getAttribute('class') || '')
          : String(htmlEl.className || '');
        
        if (classNameStr) {
        const hasColorClasses = classNameStr.includes('bg-') || 
                                  classNameStr.includes('text-') || 
                                  classNameStr.includes('border-');
          if (hasColorClasses && !isSvgElement) {
            // Remove Tailwind color classes - we've already set explicit RGB
            const classes = classNameStr.split(' ').filter((cls: string) => 
              cls && 
              !cls.startsWith('bg-') && 
              !cls.startsWith('text-') && 
            !cls.startsWith('border-')
            );
            htmlEl.className = classes.join(' ');
          }
          
          // Force inline styles to override any remaining CSS
          const computed = window.getComputedStyle(htmlEl);
          const bgColor = computed.backgroundColor;
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            htmlEl.style.setProperty('background-color', bgColor, 'important');
          }
          const textColor = computed.color;
          if (textColor) {
            htmlEl.style.setProperty('color', textColor, 'important');
          }
        }
      } catch {
        // Ignore per-element conversion errors to avoid breaking rendering
      }
    });
    
    // Force a reflow to ensure all style changes are applied
    void wrapper.offsetHeight;
    
    // Map snapshot is already applied as background image, no need for tile/control handling
    
    const canvas = await html2canvas(wrapper, {
      backgroundColor: transparentBg ? null : apexBlack,
      scale: 2,
      logging: false,
      useCORS: true,
      width: 1080,
      height: 1080,
      allowTaint: false,
      foreignObjectRendering: false, // Disable foreignObjectRendering for better map tile support
      removeContainer: false,
      windowWidth: 1080,
      windowHeight: 1080,
      imageTimeout: 15000, // Increase timeout for map tiles
      proxy: undefined, // Don't use proxy
      ignoreElements: (element) => {
        return element.classList.contains('maplibregl-control-container') ||
               element.classList.contains('maplibregl-ctrl-attrib') ||
               element.classList.contains('maplibregl-ctrl');
      },
      onclone: (clonedDoc, element) => {
        // CRITICAL: Remove all stylesheets from cloned document to prevent oklab parsing
        // html2canvas reads stylesheets directly, so we need to remove them
        const styleSheets = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
        styleSheets.forEach((sheet) => sheet.remove());
        
        // Also remove any style elements that might contain oklab
        const allStyleElements = clonedDoc.querySelectorAll('style');
        allStyleElements.forEach((style) => {
          const styleContent = style.textContent || '';
          if (styleContent.includes('oklab') || styleContent.includes('oklch') || styleContent.includes('color-mix')) {
            style.remove();
          }
        });
        
        // Ensure cloned element is visible and positioned at origin
        if (element) {
          const clonedElement = element as HTMLElement;
          clonedElement.style.visibility = 'visible';
          clonedElement.style.opacity = '1';
          clonedElement.style.position = 'fixed';
          clonedElement.style.left = '0';
          clonedElement.style.top = '0';
          clonedElement.style.marginLeft = '0'; // Reset margin in clone
          
          // For transparent mode, ensure NO background image is set
          if (transparentBg) {
            clonedElement.style.backgroundImage = 'none';
            clonedElement.style.backgroundColor = 'transparent';
          }
          
          // CRITICAL: Convert all colors in cloned document to explicit RGB
          // Since we removed stylesheets, we need to set all colors explicitly
          const convertClonedColors = (el: HTMLElement) => {
            try {
              // Get computed style from original element (not cloned, as stylesheets are removed)
              // Find corresponding original element
              const originalEl = Array.from(wrapper.querySelectorAll('*')).find(
                (orig) => {
                  // Try to match by position or ID
                  if (orig.id && el.id && orig.id === el.id) return true;
                  if (orig.getAttribute('data-share-id') && el.getAttribute('data-share-id') && 
                      orig.getAttribute('data-share-id') === el.getAttribute('data-share-id')) return true;
                  return false;
                }
              ) as HTMLElement;
              
              if (originalEl) {
                const computed = window.getComputedStyle(originalEl);
                
                // Apply RGB colors explicitly with !important
                const bgColor = computed.backgroundColor;
                if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                  el.style.setProperty('background-color', bgColor, 'important');
                }
                const textColor = computed.color;
                if (textColor && textColor !== 'rgba(0, 0, 0, 0)') {
                  el.style.setProperty('color', textColor, 'important');
                }
                const borderColor = computed.borderColor;
                if (borderColor && computed.borderWidth !== '0px') {
                  el.style.setProperty('border-color', borderColor, 'important');
                }
              }
            } catch {
              // Ignore errors
            }
          };
          
          // Convert colors on all elements in clone
          convertClonedColors(clonedElement);
          const allClonedElements = clonedElement.querySelectorAll('*');
          allClonedElements.forEach((el) => convertClonedColors(el as HTMLElement));
          
          // Ensure all text elements have explicit colors for transparent mode
          if (transparentBg) {
            const allTextElements = clonedElement.querySelectorAll('h1, h2, h3, p, div, span');
            allTextElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              // Only set color if not already set
              if (!htmlEl.style.color || htmlEl.style.color === '') {
                htmlEl.style.color = apexWhite;
              }
            });
          }
          
          // Make sure container is transparent when we have background image
          const clonedContainer = clonedElement.querySelector('div[style*="padding"]');
          if (clonedContainer && (showImage && hasImageUrl)) {
            (clonedContainer as HTMLElement).style.backgroundColor = 'transparent';
          }
        }
        
        // Hide controls in cloned document
        const clonedControls = clonedDoc.querySelectorAll('.maplibregl-control-container, .maplibregl-ctrl, .maplibregl-ctrl-attrib');
        clonedControls.forEach((control) => {
          (control as HTMLElement).style.display = 'none';
        });
        
        // Ensure map tiles are visible in clone
        // NOTE: Do NOT apply CSS filters - html2canvas doesn't support them!
        if (showMap) {
          const clonedMapContainer = clonedDoc.querySelector('#share-map-container');
          if (clonedMapContainer) {
            const mapContainerEl = clonedMapContainer as HTMLElement;
            mapContainerEl.style.visibility = 'visible';
            mapContainerEl.style.opacity = '1';
            mapContainerEl.style.position = 'relative';
            mapContainerEl.style.width = '100%';
            mapContainerEl.style.height = '100%';
            // Use explicit RGB - prevent oklab parsing
            mapContainerEl.style.setProperty('background-color', apexBlack, 'important');
            
            // Remove ALL CSS classes from map container and children to prevent oklab parsing
            mapContainerEl.className = '';
            const allMapChildren = clonedMapContainer.querySelectorAll('*');
            allMapChildren.forEach((child) => {
              const childEl = child as HTMLElement;
              // Remove classes that might use oklab
              childEl.className = '';
              // Ensure explicit RGB colors
              try {
                const computed = window.getComputedStyle(childEl);
                const bgColor = computed.backgroundColor;
                if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                  childEl.style.setProperty('background-color', bgColor, 'important');
                }
                const textColor = computed.color;
                if (textColor) {
                  childEl.style.setProperty('color', textColor, 'important');
                }
              } catch {
                // Ignore errors
              }
            });
            
            // Find all map tile images - make visible but NO filter
            const allImages = clonedMapContainer.querySelectorAll('img');
            allImages.forEach((img) => {
              const imgEl = img as HTMLImageElement;
              imgEl.style.visibility = 'visible';
              imgEl.style.opacity = '1';
              imgEl.style.display = 'block';
              // Remove any filter - html2canvas doesn't support CSS filters
              imgEl.style.filter = 'none';
              imgEl.className = ''; // Remove classes to prevent oklab parsing
              // Ensure CORS is set
              if (!imgEl.crossOrigin) {
                imgEl.crossOrigin = 'anonymous';
              }
            });
            
            // Also handle canvas elements - no filter
            const canvases = clonedMapContainer.querySelectorAll('canvas');
            canvases.forEach((canvas) => {
              const canvasEl = canvas as HTMLCanvasElement;
              canvasEl.style.visibility = 'visible';
              canvasEl.style.opacity = '1';
              canvasEl.style.filter = 'none';
              canvasEl.className = ''; // Remove classes to prevent oklab parsing
            });
            
          } else {
            logger.warn('Map container not found in cloned document');
          }
        }
      },
    });
    
    // Verify canvas has content by checking sample areas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Check multiple areas to ensure content exists
    // For transparent mode, check header area (where title is) and center (where stats are)
    const sampleSize = 200;
    const sampleAreas = transparentBg 
      ? [
          { x: 60, y: 60, w: 500, h: 150 }, // Header area (title)
          { x: Math.floor(canvas.width / 2) - sampleSize / 2, y: Math.floor(canvas.height / 2) - sampleSize / 2, w: sampleSize, h: sampleSize }, // Center (stats)
        ]
      : [
          { x: Math.floor(canvas.width / 2) - sampleSize / 2, y: Math.floor(canvas.height / 2) - sampleSize / 2, w: sampleSize, h: sampleSize }, // Center (stats)
        ];
    
    let totalNonTransparentPixels = 0;
    for (const area of sampleAreas) {
      const imageData = ctx.getImageData(
        Math.max(0, area.x),
        Math.max(0, area.y),
        Math.min(area.w, canvas.width - area.x),
        Math.min(area.h, canvas.height - area.y)
      );
      
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) {
          totalNonTransparentPixels++;
        }
      }
    }

    // For transparent background mode, we need at least some content (text should be visible)
    // For solid background, we should have many pixels
    const minPixels = transparentBg ? 500 : 1000;
    
    if (totalNonTransparentPixels < minPixels) {
      logger.error('Generated canvas appears to be empty or has insufficient content', {
        canvasSize: `${canvas.width}x${canvas.height}`,
        totalNonTransparentPixels,
        minPixels,
        transparentBg,
        wrapperInDOM: document.body.contains(wrapper),
        wrapperVisible: wrapper.style.visibility,
        wrapperOpacity: wrapper.style.opacity,
        hasContainer: !!container,
        containerChildren: container?.children.length || 0,
        sampleAreas: sampleAreas.length,
      });
      throw new Error('Failed to generate image: canvas is empty');
    }
    
    // Apply dark filter to map area as post-processing (html2canvas doesn't support CSS filters)
    // Skip if we already applied a snapshot (pre-filtered)
    const hasSnapshotBg = !!mapContainer?.style.backgroundImage && mapContainer.style.backgroundImage !== 'none';
    const snapshotApplied = mapSnapshotApplied || mapContainer?.dataset.snapshotApplied === 'true' || hasSnapshotBg;
    if (showMap && mapContainer && !snapshotApplied) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Get the map container bounds relative to wrapper
        const mapRect = mapContainer.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        
        // Calculate map area in canvas coordinates (accounting for scale: 2)
        const scale = 2;
        const mapX = Math.max(0, Math.floor((mapRect.left - wrapperRect.left) * scale));
        const mapY = Math.max(0, Math.floor((mapRect.top - wrapperRect.top) * scale));
        const mapWidth = Math.min(canvas.width - mapX, Math.floor(mapRect.width * scale));
        const mapHeight = Math.min(canvas.height - mapY, Math.floor(mapRect.height * scale));
        
        if (mapWidth > 0 && mapHeight > 0) {
          // Get image data from map area only
          const imageData = ctx.getImageData(mapX, mapY, mapWidth, mapHeight);
          const data = imageData.data;
          
          // Apply dark map filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)
          for (let i = 0; i < data.length; i += 4) {
            // Only process non-transparent pixels
            if (data[i + 3] > 0) {
              // Invert RGB (255 - value)
              const r = 255 - data[i];
              const g = 255 - data[i + 1];
              const b = 255 - data[i + 2];
              
              // Apply brightness(95%) and contrast(90%) adjustments
              data[i] = Math.min(255, Math.max(0, r * 0.95 * 0.9));
              data[i + 1] = Math.min(255, Math.max(0, g * 0.95 * 0.9));
              data[i + 2] = Math.min(255, Math.max(0, b * 0.95 * 0.9));
            }
          }
          
          // Put modified image data back
          ctx.putImageData(imageData, mapX, mapY);
        }
      }
    }

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    
    // Clean up
    if (wrapper.parentNode) {
      document.body.removeChild(wrapper);
    }
    
    return dataUrl;
  } catch (error) {
    // Better error logging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Error generating share image:', {
      message: errorMessage,
      stack: errorStack,
      mode,
      hasMap: showMap,
      hasImage: showImage,
      hasRoute: hasRoute,
    });
    // Clean up on error
    if (wrapper.parentNode) {
      document.body.removeChild(wrapper);
    }
    throw error;
  }
}

/**
 * Build shared content container (header, stats, footer) - reusable across all modes
 */
function buildSharedContentContainer(
  ride: Ride,
  bike: Bike | undefined,
  hasRoute: boolean,
  apexBlack: string,
  apexWhite: string,
  apexGreen: string
): HTMLElement {
  const bikeName = bike 
    ? `${bike.make}${bike.year ? ` (${bike.year})` : ''}`
    : 'Unknown Bike';
  const rideName = ride.ride_name || bikeName;
  const maxLean = Math.max(ride.max_lean_left, ride.max_lean_right);

  // Create content container
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.padding = '60px';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.color = apexWhite;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'space-between';
  container.style.zIndex = '2';
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

  // Stats section
  const statsContainer = document.createElement('div');
  statsContainer.style.display = 'grid';
  statsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
  statsContainer.style.gap = '40px';
  statsContainer.style.marginTop = hasRoute ? '0' : '60px';
  statsContainer.style.marginBottom = '60px';
  statsContainer.style.position = 'relative';
  statsContainer.style.zIndex = '2';

  const distanceStat = createStatCard('Distance', `${ride.distance_km.toFixed(1)} km`, apexWhite, apexGreen);
  statsContainer.appendChild(distanceStat);

  const durationStat = createStatCard(
    'Duration',
    formatDuration(ride.start_time, ride.end_time),
    apexWhite,
    apexGreen
  );
  statsContainer.appendChild(durationStat);

  if (maxLean > 0) {
    const leanStat = createStatCard('Max Lean', `${maxLean.toFixed(1)}°`, apexWhite, apexGreen);
    statsContainer.appendChild(leanStat);
  }

  const dateStat = createStatCard(
    'Date',
    formatShortDate(ride.start_time, { includeYear: true, useRelative: false }),
    apexWhite,
    apexGreen
  );
  statsContainer.appendChild(dateStat);

  container.appendChild(statsContainer);

  // Footer with Apex branding
  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.alignItems = 'center';
  footer.style.justifyContent = 'space-between';
  footer.style.marginTop = 'auto';
  footer.style.paddingTop = '40px';
  footer.style.borderTop = '1px solid rgba(226, 226, 226, 0.1)';
  footer.style.position = 'relative';
  footer.style.zIndex = '2';
  
  // Left side: Logo + APEX text
  const leftSection = document.createElement('div');
  leftSection.style.display = 'flex';
  leftSection.style.alignItems = 'center';
  
  // App logo (SVG as string for better html2canvas compatibility)
  const logoContainer = document.createElement('div');
  logoContainer.style.width = '48px';
  logoContainer.style.height = '48px';
  logoContainer.style.display = 'flex';
  logoContainer.style.alignItems = 'center';
  logoContainer.style.justifyContent = 'center';
  logoContainer.style.flexShrink = '0';
  
  // Use data URL image to avoid inline SVG parsing issues
  const logoImg = document.createElement('img');
  logoImg.dataset.shareLogo = 'true';
  logoImg.alt = 'Apex logo';
  logoImg.style.width = '100%';
  logoImg.style.height = '100%';
  logoImg.style.display = 'block';
  logoImg.style.objectFit = 'contain';
  logoImg.style.objectPosition = 'center';
  logoImg.crossOrigin = 'anonymous';

  logoContainer.style.backgroundColor = apexBlack;
  logoContainer.style.borderRadius = '12px';
  if (apexGreen.startsWith('#')) {
    const borderColor = apexGreen.replace('#', '');
    const r = parseInt(borderColor.substring(0, 2), 16);
    const g = parseInt(borderColor.substring(2, 4), 16);
    const b = parseInt(borderColor.substring(4, 6), 16);
    logoContainer.style.border = `1px solid rgba(${r}, ${g}, ${b}, 0.2)`;
  }

  const svgString = `<svg viewBox="0 0 120 120" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <rect width="120" height="120" rx="24" fill="${apexBlack}" />
    <path d="M23.4 93.8 C 35.2 93.8, 51.6 28.1, 96.6 28.1" stroke="${apexGreen}" stroke-width="8" stroke-miterlimit="10" stroke-linecap="square" fill="none" />
    <circle cx="96.6" cy="28.1" r="6" fill="${apexGreen}" />
  </svg>`;
  try {
    const svgBase64 = window.btoa(unescape(encodeURIComponent(svgString)));
    logoImg.src = `data:image/svg+xml;base64,${svgBase64}`;
  } catch (error) {
    logger.warn('Failed to encode logo SVG for share image', error);
    logoImg.src = '/apex-logo.svg';
  }

  logoContainer.appendChild(logoImg);
  leftSection.appendChild(logoContainer);
  
  const logoText = document.createElement('div');
  logoText.textContent = 'APEX';
  logoText.style.fontSize = '32px';
  logoText.style.fontWeight = '700';
  logoText.style.color = apexGreen;
  logoText.style.letterSpacing = '4px';
  logoText.style.fontFamily = 'monospace';
  logoText.style.marginLeft = '16px'; // Use margin instead of gap for compatibility
  logoText.style.lineHeight = '1';
  
  leftSection.appendChild(logoText);
  footer.appendChild(leftSection);
  
  // Right side: GitHub link
  const githubLink = document.createElement('div');
  githubLink.textContent = 'github.com/Purukitto/apex-app';
  githubLink.style.fontSize = '18px';
  githubLink.style.color = apexWhite;
  githubLink.style.opacity = '0.6';
  githubLink.style.fontFamily = 'monospace';
  githubLink.style.textDecoration = 'none';
  githubLink.style.cursor = 'default'; // Not clickable in image
  
  footer.appendChild(githubLink);
  container.appendChild(footer);

  return container;
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
/**
 * Generate all share image previews at once (optimized batch generation)
 * Builds shared resources once and reuses them across all modes
 */
export async function generateAllRideShareImages(
  ride: Ride,
  bike: Bike | undefined
): Promise<Record<ShareMode, string>> {
  // Build shared resources once
  const sharedResources = await buildSharedResources(ride, bike);
  
  // Generate all modes in parallel using shared resources
  const modes: ShareMode[] = [
    'no-map-no-image',
    'map-no-image',
    'no-map-image-dark',
    'map-image-dark',
    'no-map-image-transparent',
  ];
  
  const results = await Promise.all(
    modes.map(async (mode) => {
      try {
        const image = await generateRideShareImage(ride, bike, mode, sharedResources);
        return { mode, image };
      } catch (error) {
        logger.error(`Failed to generate preview for ${mode}:`, error);
        return { mode, image: '' };
      }
    })
  );
  
  // Convert to record
  const record: Record<ShareMode, string> = {} as Record<ShareMode, string>;
  results.forEach(({ mode, image }) => {
    record[mode] = image;
  });
  
  return record;
}

export async function shareRideImage(
  ride: Ride, 
  bike: Bike | undefined, 
  mode: ShareMode = 'no-map-no-image'
): Promise<'clipboard' | 'download' | 'share'> {
  try {
    // Generate the image
    const imageDataUrl = await generateRideShareImage(ride, bike, mode);
    
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
      } catch {
        // Clipboard failed or not supported, fall back to download
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
