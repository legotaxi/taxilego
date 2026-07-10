import { useEffect, useRef, useState, useCallback } from "react";
import { Navigation2, MapPin, Loader2, AlertCircle, Zap } from "lucide-react";
import { loadGoogleMaps, LUBANGO_CENTER, HUILA_BOUNDS } from "@/lib/google-maps-loader";

interface MapViewProps {
  pickupLocation?: [number, number];
  destinationLocation?: [number, number];
  driverLocation?: [number, number];
  /** Optional polyline path (lat,lng pairs). If absent, route is auto-drawn pickup→destination. */
  route?: [number, number][];
  /** Rota motorista → passageiro (com cor azul) */
  driverToPassengerRoute?: [number, number][];
  /** Rota origem → destino (com cor verde) */
  originToDestinationRoute?: [number, number][];
  /** Motoristas disponíveis mostrados no mapa (só coordenadas). */
  nearbyDrivers?: Array<[number, number]>;
  onLocationSelect?: (location: [number, number]) => void;
  showAccuracy?: boolean;
  showSpeed?: boolean;
  autoCenter?: boolean;
  zoom?: number;
  /** Marker style for the live user (driver=car, passenger=person). */
  userIconType?: "driver" | "passenger";
  /** Auto-draw route from pickup→destination using Directions service. */
  drawDirections?: boolean;
}

// Inline SVG markers (data URIs) so we don't depend on map IDs / Advanced Markers.
function svgIcon(svg: string): string {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

const PICKUP_ICON = svgIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
    <defs>
      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1e40af"/>
        <stop offset="100%" stop-color="#0c1e5c"/>
      </linearGradient>
      <filter id="ps" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#0b1f4d" flood-opacity="0.35"/>
      </filter>
    </defs>
    <path d="M20 1C10.6 1 3 8.6 3 18c0 12.7 17 32 17 32s17-19.3 17-32C37 8.6 29.4 1 20 1z" fill="url(#pg)" stroke="white" stroke-width="2" filter="url(#ps)"/>
    <circle cx="20" cy="18" r="6" fill="white"/>
    <circle cx="20" cy="18" r="2.6" fill="#1e40af"/>
  </svg>`,
);

const DESTINATION_ICON = svgIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
    <path d="M18 0C8 0 0 8 0 18c0 13 18 26 18 26s18-13 18-26C36 8 28 0 18 0z" fill="#dc2626"/>
    <path d="M12 12h12v12H12z" fill="white"/>
  </svg>`,
);

// Path SVG para o carro (virado para o Norte) para permitir rotação nativa do Google Maps
const CAR_PATH = "M22 2C10.95 2 2 10.95 2 22s8.95 20 20 20 20-8.95 20-20S33.05 2 22 2zm0 36c-8.82 0-16-7.18-16-16S13.18 6 22 6s16 7.18 16 16-7.18 16-16 16zm-5.5-14l1.5-5c.31-1.03 1.25-1.75 2.32-1.75h3.36c1.07 0 2.01.72 2.32 1.75l1.5 5v4c0 .55-.45 1-1 1h-1c-.55 0-1-.45-1-1v-1h-6v1c0 .55-.45 1-1 1h-1c-.55 0-1-.45-1-1v-4zm3-1.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm5 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z";
const CAR_ICON = svgIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="20" fill="white" stroke="#16a34a" stroke-width="3"/>
    <path d="M14 24l1.5-5a2 2 0 012-1.5h9a2 2 0 012 1.5l1.5 5v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H17v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-4z" fill="#16a34a"/>
    <circle cx="17" cy="26" r="1.5" fill="white"/>
    <circle cx="27" cy="26" r="1.5" fill="white"/>
  </svg>`,
);

const PERSON_ICON = svgIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <defs>
      <radialGradient id="ph" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25"/>
        <stop offset="70%" stop-color="#3b82f6" stop-opacity="0.06"/>
        <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="pgc" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1e40af"/>
        <stop offset="100%" stop-color="#0c1e5c"/>
      </linearGradient>
      <filter id="psh" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#0b1f4d" flood-opacity="0.35"/>
      </filter>
    </defs>
    <circle cx="24" cy="24" r="22" fill="url(#ph)"/>
    <circle cx="24" cy="24" r="13" fill="white" filter="url(#psh)"/>
    <circle cx="24" cy="24" r="13" fill="none" stroke="url(#pgc)" stroke-width="2.5"/>
    <circle cx="24" cy="20.5" r="3.4" fill="url(#pgc)"/>
    <path d="M16.5 31c0-3.4 3.4-5.8 7.5-5.8s7.5 2.4 7.5 5.8v.5h-15V31z" fill="url(#pgc)"/>
  </svg>`,
);

const NEARBY_DRIVER_ICON = svgIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="white" stroke="#ff3388" stroke-width="2"/>
    <path d="M10 18l1-4a1.5 1.5 0 011.5-1h7a1.5 1.5 0 011.5 1l1 4v3a.8.8 0 01-.8.8h-.9a.8.8 0 01-.8-.8v-.7H12.5v.7a.8.8 0 01-.8.8h-.9a.8.8 0 01-.8-.8v-3z" fill="#ff3388"/>
  </svg>`,
);

/**
 * MapView — mapa Google Maps com restrição à região de Huíla/Lubango.
 */
export function MapView({
  pickupLocation,
  destinationLocation,
  driverLocation,
  route,
  driverToPassengerRoute,
  originToDestinationRoute,
  nearbyDrivers,
  onLocationSelect,
  showAccuracy = false,
  showSpeed = false,
  autoCenter = true,
  zoom = 14,
  userIconType = "driver",
  drawDirections = false,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const googleRef = useRef<any>(null);
  const markersRef = useRef<{ pickup?: any; destination?: any; user?: any }>({});
  const polylineRef = useRef<any>(null);
  const driverToPassengerPolylineRef = useRef<any>(null);
  const originToDestinationPolylineRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const nearbyDriversMarkersRef = useRef<any[]>([]);
  const onLocationSelectRef = useRef(onLocationSelect);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Initialize
  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        googleRef.current = google;

        const center =
          driverLocation
            ? { lat: driverLocation[0], lng: driverLocation[1] }
            : pickupLocation
              ? { lat: pickupLocation[0], lng: pickupLocation[1] }
              : LUBANGO_CENTER;

        const map = new google.maps.Map(containerRef.current, {
          center,
          zoom,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          gestureHandling: "greedy",
          clickableIcons: false,
          restriction: {
            latLngBounds: HUILA_BOUNDS,
            strictBounds: false,
          },
        });

        map.addListener("click", (e: any) => {
          if (!e.latLng) return;
          onLocationSelectRef.current?.([e.latLng.lat(), e.latLng.lng()]);
        });

        mapRef.current = map;
        setReady(true);
      })
      .catch((err) => {
        console.error("Google Maps init error:", err);
        setError(err?.message ?? "Erro ao carregar o mapa");
      });

    return () => {
      cancelled = true;
      Object.values(markersRef.current).forEach((m: any) => m?.setMap?.(null));
      markersRef.current = {};
      polylineRef.current?.setMap?.(null);
      polylineRef.current = null;
      driverToPassengerPolylineRef.current?.setMap?.(null);
      driverToPassengerPolylineRef.current = null;
      originToDestinationPolylineRef.current?.setMap?.(null);
      originToDestinationPolylineRef.current = null;
      directionsRendererRef.current?.setMap?.(null);
      directionsRendererRef.current = null;
      accuracyCircleRef.current?.setMap?.(null);
      accuracyCircleRef.current = null;
      nearbyDriversMarkersRef.current.forEach((m) => m?.setMap?.(null));
      nearbyDriversMarkersRef.current = [];
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pickup marker
  useEffect(() => {
    const google = googleRef.current;
    const map = mapRef.current;
    if (!ready || !google || !map || !pickupLocation) return;
    const pos = { lat: pickupLocation[0], lng: pickupLocation[1] };
    if (markersRef.current.pickup) {
      markersRef.current.pickup.setPosition(pos);
    } else {
      markersRef.current.pickup = new google.maps.Marker({
        position: pos,
        map,
        icon: { url: PICKUP_ICON, scaledSize: new google.maps.Size(40, 52), anchor: new google.maps.Point(20, 52) },
        title: "Ponto de recolha",
      });
    }
  }, [pickupLocation, ready]);

  // Destination marker
  useEffect(() => {
    const google = googleRef.current;
    const map = mapRef.current;
    if (!ready || !google || !map || !destinationLocation) return;
    const pos = { lat: destinationLocation[0], lng: destinationLocation[1] };
    if (markersRef.current.destination) {
      markersRef.current.destination.setPosition(pos);
    } else {
      markersRef.current.destination = new google.maps.Marker({
        position: pos,
        map,
        icon: { url: DESTINATION_ICON, scaledSize: new google.maps.Size(36, 44), anchor: new google.maps.Point(18, 44) },
        title: "Destino",
      });
    }
  }, [destinationLocation, ready]);

  // Live user marker (driver or passenger)
  useEffect(() => {
    const google = googleRef.current;
    const map = mapRef.current;
    if (!ready || !google || !map || !driverLocation) return;
    const pos = { lat: driverLocation[0], lng: driverLocation[1] };
    const iconUrl = userIconType === "passenger" ? PERSON_ICON : CAR_ICON;
    const size = userIconType === "passenger" ? 48 : 44;
    const anchor = size / 2;
    
    // Se for motorista, podemos usar o heading para rotacionar o ícone
    // Nota: O ícone SVG original deve estar virado para o Norte (0 graus)
    const heading = (driverLocation as any).heading;
    
    let iconOptions: any;
    if (userIconType === "driver" && heading != null) {
      // Usar símbolo vetorial para permitir rotação
      iconOptions = {
        path: CAR_PATH,
        fillColor: "#16a34a",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
        scale: size / 44,
        anchor: new google.maps.Point(22, 22),
        rotation: heading,
      };
    } else {
      iconOptions = {
        url: iconUrl,
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(anchor, anchor),
      };
    }

    if (markersRef.current.user) {
      markersRef.current.user.setPosition(pos);
      markersRef.current.user.setIcon(iconOptions);
    } else {
      markersRef.current.user = new google.maps.Marker({
        position: pos,
        map,
        icon: iconOptions,
        title: userIconType === "passenger" ? "Você (passageiro)" : "Motorista",
        zIndex: 999,
      });
    }
    
    // Suave animação de movimento se o mapa já estiver pronto
    if (autoCenter) {
      if (map.getCenter().lat() !== pos.lat || map.getCenter().lng() !== pos.lng) {
        map.panTo(pos);
      }
    }
  }, [driverLocation, ready, userIconType, autoCenter]);

  // Accuracy circle
  useEffect(() => {
    const google = googleRef.current;
    const map = mapRef.current;
    if (!ready || !google || !map) return;
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null);
      accuracyCircleRef.current = null;
    }
    if (showAccuracy && driverLocation) {
      // Usar a precisão real se disponível, caso contrário default 50m
      const radius = (driverLocation as any).accuracy || 50;
      accuracyCircleRef.current = new google.maps.Circle({
        map,
        center: { lat: driverLocation[0], lng: driverLocation[1] },
        radius: radius,
        strokeColor: "#2563eb",
        strokeOpacity: 0.4,
        strokeWeight: 1,
        fillColor: "#2563eb",
        fillOpacity: 0.1,
        clickable: false,
      });
    }
  }, [showAccuracy, driverLocation, ready]);

  // Custom polyline route (when provided)
  useEffect(() => {
    const google = googleRef.current;
    const map = mapRef.current;
    if (!ready || !google || !map) return;
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (route && route.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        map,
        path: route.map(([lat, lng]) => ({ lat, lng })),
        strokeColor: "#0f172a",
        strokeOpacity: 0.85,
        strokeWeight: 5,
      });
      const bounds = new google.maps.LatLngBounds();
      route.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
      map.fitBounds(bounds, 60);
    }
  }, [route, ready]);

  // Rota motorista → passageiro (azul)
  useEffect(() => {
    const google = googleRef.current;
    const map = mapRef.current;
    if (!ready || !google || !map) return;
    if (driverToPassengerPolylineRef.current) {
      driverToPassengerPolylineRef.current.setMap(null);
      driverToPassengerPolylineRef.current = null;
    }
    if (driverToPassengerRoute && driverToPassengerRoute.length > 1) {
      driverToPassengerPolylineRef.current = new google.maps.Polyline({
        map,
        path: driverToPassengerRoute.map(([lat, lng]) => ({ lat, lng })),
        strokeColor: "#3b82f6",
        strokeOpacity: 0.85,
        strokeWeight: 5,
        geodesic: true,
      });
    }
  }, [driverToPassengerRoute, ready]);

  // Rota origem → destino (verde)
  useEffect(() => {
    const google = googleRef.current;
    const map = mapRef.current;
    if (!ready || !google || !map) return;
    if (originToDestinationPolylineRef.current) {
      originToDestinationPolylineRef.current.setMap(null);
      originToDestinationPolylineRef.current = null;
    }
    if (originToDestinationRoute && originToDestinationRoute.length > 1) {
      originToDestinationPolylineRef.current = new google.maps.Polyline({
        map,
        path: originToDestinationRoute.map(([lat, lng]) => ({ lat, lng })),
        strokeColor: "#10b981",
        strokeOpacity: 0.85,
        strokeWeight: 5,
        geodesic: true,
      });
    }
  }, [originToDestinationRoute, ready]);

  // Auto-draw directions: origin = driverLocation (live) when present, else pickupLocation.
  useEffect(() => {
    const google = googleRef.current;
    const map = mapRef.current;
    if (!ready || !google || !map || !drawDirections) return;
    
    // Se não tiver destino, limpa as direções
    if (!destinationLocation) {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] });
      }
      return;
    }

    // Prefere pickup escolhido; só usa a posição live se não houver pickup
    const origin = pickupLocation ?? driverLocation;
    if (!origin) return;

    const ds = new google.maps.DirectionsService();
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        preserveViewport: false, // Permitir que o mapa se ajuste à rota
        polylineOptions: { 
          strokeColor: "#10b981", // Verde estilo Uber/Lego para a rota principal
          strokeOpacity: 0.8, 
          strokeWeight: 6 
        },
      });
    }
    const renderer = directionsRendererRef.current;

    ds.route(
      {
        origin: { lat: origin[0], lng: origin[1] },
        destination: { lat: destinationLocation[0], lng: destinationLocation[1] },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status === "OK" && result) {
          renderer.setDirections(result);
          // Ajustar o zoom para mostrar toda a rota se não for autoCenter (que foca no user)
          if (!autoCenter) {
            const bounds = result.routes[0].bounds;
            map.fitBounds(bounds, 80);
          }
        }
      },
    );
  }, [pickupLocation, destinationLocation, driverLocation, drawDirections, ready, autoCenter]);

  // Nearby drivers markers (only lat/lng — no identity)
  useEffect(() => {
    const google = googleRef.current;
    const map = mapRef.current;
    if (!ready || !google || !map) return;
    nearbyDriversMarkersRef.current.forEach((m) => m.setMap(null));
    nearbyDriversMarkersRef.current = [];
    if (!nearbyDrivers || nearbyDrivers.length === 0) return;
    nearbyDrivers.forEach(([lat, lng]) => {
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        icon: {
          url: NEARBY_DRIVER_ICON,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        },
        zIndex: 500,
        clickable: false,
      });
      nearbyDriversMarkersRef.current.push(marker);
    });
  }, [nearbyDrivers, ready]);

  const handleCenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (driverLocation) map.panTo({ lat: driverLocation[0], lng: driverLocation[1] });
    else if (pickupLocation) map.panTo({ lat: pickupLocation[0], lng: pickupLocation[1] });
    map.setZoom(zoom);
  }, [driverLocation, pickupLocation, zoom]);

  if (error) {
    return (
      <div className="relative h-full w-full bg-slate-100 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-sm">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-800 font-semibold mb-2">Erro ao carregar o mapa</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">A carregar mapa…</p>
          </div>
        </div>
      )}

      <div ref={containerRef} className="h-full w-full" style={{ zIndex: 1 }} />

      <div className="absolute right-4 top-4 flex flex-col gap-2 z-10 sm:top-20">
        <button
          onClick={handleCenter}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105 hover:shadow-xl"
          aria-label="Centrar"
          title="Centrar"
        >
          <Navigation2 className="h-5 w-5 text-slate-700" />
        </button>
      </div>

      {(showSpeed || showAccuracy || driverToPassengerRoute || originToDestinationRoute) && (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10 max-w-xs">
          <div className="text-xs space-y-2">
            {showSpeed && (
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-gray-700">Velocidade em tempo real</span>
              </div>
            )}
            {showAccuracy && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-gray-700">Precisão GPS</span>
              </div>
            )}
            {driverToPassengerRoute && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
                <span className="text-gray-700">Rota: Motorista → Passageiro</span>
              </div>
            )}
            {originToDestinationRoute && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#10b981" }} />
                <span className="text-gray-700">Rota: Origem → Destino</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
