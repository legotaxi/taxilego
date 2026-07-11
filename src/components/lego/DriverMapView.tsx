import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { MapView } from "./MapView";
import { useGeolocationWatch } from "../../hooks/use-geolocation";
import { useServerFn } from "@tanstack/react-start";
import { updateDriverLocation, toggleOnlineStatus } from "../../lib/driver.functions";
import { LUBANGO_CENTER } from "@/lib/google-maps-loader";
import { calculateRoute, formatDistance, formatDuration, type RouteStep } from "@/lib/directions.functions";
import { AlertCircle, Navigation2, MapPin, X, ExternalLink, Clock, Power } from "lucide-react";
import { toast } from "sonner";

interface DriverMapViewProps {
  pickupLocation?: [number, number];
  destinationLocation?: [number, number];
  pickupAddress?: string;
  destinationAddress?: string;
  route?: [number, number][];
  rideStatus?: string;
  onLocationUpdate?: (location: [number, number], accuracy: number, speed: number | null) => void;
  onOnlineStatusChange?: (isOnline: boolean) => void;
  initialOnlineStatus?: boolean;
}

export function DriverMapView({
  pickupLocation = [LUBANGO_CENTER.lat, LUBANGO_CENTER.lng],
  destinationLocation = [LUBANGO_CENTER.lat + 0.01, LUBANGO_CENTER.lng + 0.01],
  pickupAddress,
  destinationAddress,
  route,
  rideStatus,
  onLocationUpdate,
  onOnlineStatusChange,
  initialOnlineStatus = false,
}: DriverMapViewProps) {
  const updateLocationFn = useServerFn(updateDriverLocation);
  const toggleOnlineFn = useServerFn(toggleOnlineStatus);

  // Estado local de online — sincroniza com a prop inicial e com o pai
  const [isOnline, setIsOnline] = useState(initialOnlineStatus);

  // Sincronizar com prop do pai quando mudar
  useEffect(() => {
    setIsOnline(initialOnlineStatus);
  }, [initialOnlineStatus]);

  const { coordinates, error, loading, isTracking, distanceTraveled, stopTracking } =
    useGeolocationWatch(
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
      isOnline,
    );

  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDistance, setSessionDistance] = useState(0);
  const [driverToPassengerRoute, setDriverToPassengerRoute] = useState<[number, number][] | null>(null);
  const [originToDestinationRoute, setOriginToDestinationRoute] = useState<[number, number][] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showSteps, setShowSteps] = useState(false);

  const driverLocation: [number, number] = useMemo(() => {
    const coords: any = coordinates
      ? [coordinates.latitude, coordinates.longitude]
      : [LUBANGO_CENTER.lat, LUBANGO_CENTER.lng];
    if (coordinates) {
      coords.accuracy = coordinates.accuracy;
      coords.heading = coordinates.heading;
      coords.speed = coordinates.speed;
    }
    return coords;
  }, [coordinates]);

  // Sync location to backend — only when online
  useEffect(() => {
    if (coordinates && isOnline) {
      const now = Date.now();
      const updateInterval = (coordinates.speed && coordinates.speed > 1) ? 500 : 2000;

      if (now - lastUpdateTime >= updateInterval) {
        updateLocationFn({
          data: {
            lat: coordinates.latitude,
            lng: coordinates.longitude,
            accuracy: coordinates.accuracy,
            speed: coordinates.speed,
            heading: coordinates.heading,
          },
        })
          .then(() => {
            setLastUpdateTime(now);
            setUpdateError(null);
            onLocationUpdate?.(
              [coordinates.latitude, coordinates.longitude],
              coordinates.accuracy,
              coordinates.speed,
            );
          })
          .catch((err) => {
            console.error("Erro ao sincronizar localização:", err);
            setUpdateError("Erro ao sincronizar localização");
          });
      }
    }
  }, [coordinates, updateLocationFn, lastUpdateTime, isOnline, onLocationUpdate]);

  // Limpar localização no backend quando fica offline
  useEffect(() => {
    if (!isOnline) {
      setUpdateError(null);
      setRouteInfo(null);
      setDriverToPassengerRoute(null);
      setOriginToDestinationRoute(null);
      setRouteSteps([]);
      setCurrentStepIndex(0);
    }
  }, [isOnline]);

  const distMeters = useCallback((a: [number, number], b: [number, number]) => {
    const R = 6371000;
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLng = ((b[1] - a[1]) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a[0] * Math.PI) / 180) *
        Math.cos((b[0] * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }, []);

  const lastRouteCalcRef = useRef<{ at: number; pos: [number, number]; status: string } | null>(null);

  // Calcular rotas em tempo real — só quando online e com corrida activa
  useEffect(() => {
    if (!pickupLocation || !destinationLocation) return;
    if (!rideStatus || !["accepted", "arriving", "in_progress"].includes(rideStatus)) return;
    if (!isOnline) return;

    const target = rideStatus === "in_progress" ? destinationLocation : pickupLocation;
    const last = lastRouteCalcRef.current;
    const now = Date.now();
    if (last && last.status === rideStatus) {
      const moved = distMeters(last.pos, driverLocation);
      const elapsed = now - last.at;
      if (moved < 75 && elapsed < 15000) return;
    }
    lastRouteCalcRef.current = { at: now, pos: driverLocation, status: rideStatus };

    let cancelled = false;
    (async () => {
      try {
        const route = await calculateRoute(driverLocation, target);
        if (cancelled || !route) return;
        if (rideStatus === "in_progress") {
          setOriginToDestinationRoute(route.polyline);
          setDriverToPassengerRoute(null);
        } else {
          setDriverToPassengerRoute(route.polyline);
          setOriginToDestinationRoute(null);
        }
        setRouteInfo({
          distance: formatDistance(route.distance),
          duration: formatDuration(route.duration),
        });
        setRouteSteps(route.steps);
      } catch (err) {
        console.error("Erro ao calcular rotas:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [driverLocation, pickupLocation, destinationLocation, rideStatus, isOnline, distMeters]);

  useEffect(() => {
    if (!routeSteps.length || currentStepIndex >= routeSteps.length - 1) return;
    const step = routeSteps[currentStepIndex];
    const end = step.end_location;
    if (!end) return;
    const d = distMeters(driverLocation, end);
    if (d < 30) setCurrentStepIndex((i) => Math.min(i + 1, routeSteps.length - 1));
  }, [driverLocation, routeSteps, currentStepIndex, distMeters]);

  const handleToggleOnlineStatus = useCallback(async () => {
    const newStatus = !isOnline;

    try {
      const res = await toggleOnlineFn({ data: { is_online: newStatus } });
      if (res.ok) {
        setIsOnline(newStatus);
        onOnlineStatusChange?.(newStatus);

        if (newStatus) {
          setSessionStartTime(Date.now());
          setSessionDistance(0);
          toast.success("Estás agora ONLINE — Passageiros podem ver-te no mapa e enviar pedidos!");
        } else {
          stopTracking();
          setSessionStartTime(null);
          toast.info("Estás agora OFFLINE — Não receberás pedidos de viagem.");
        }
      } else {
        toast.error("Erro ao mudar status: " + res.error);
      }
    } catch (err) {
      console.error("Erro ao mudar status online:", err);
      toast.error("Erro ao mudar status online");
    }
  }, [isOnline, onOnlineStatusChange, stopTracking, toggleOnlineFn]);

  const getSessionDuration = useCallback((): string => {
    if (!sessionStartTime) return "00:00";
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }, [sessionStartTime]);

  useEffect(() => {
    if (isOnline && distanceTraveled > 0) {
      setSessionDistance(distanceTraveled);
    }
  }, [distanceTraveled, isOnline]);

  const getFormattedSpeed = useCallback((): string => {
    if (!coordinates?.speed) return "0 km/h";
    const speedKmh = coordinates.speed * 3.6;
    return `${speedKmh.toFixed(1)} km/h`;
  }, [coordinates?.speed]);

  const openNativeNavigation = () => {
    const dest = rideStatus === "in_progress" ? destinationLocation : pickupLocation;
    if (!dest) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest[0]},${dest[1]}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const currentStep = routeSteps[currentStepIndex];

  // Verificar se há corrida activa (aceite/a chegar/em curso)
  const navActive =
    isOnline && ["accepted", "arriving", "in_progress"].includes(rideStatus ?? "");
  const navAddress = rideStatus === "in_progress" ? destinationAddress : pickupAddress;
  const [addrLine1, ...addrRest] = (navAddress ?? "").split(",");
  const addrLine2 = addrRest.join(",").trim();

  return (
    <div className="relative h-full w-full bg-gray-50 font-sans">
      <MapView
        pickupLocation={pickupLocation}
        destinationLocation={destinationLocation}
        driverLocation={driverLocation}
        route={route}
        driverToPassengerRoute={driverToPassengerRoute || undefined}
        originToDestinationRoute={originToDestinationRoute || undefined}
        showAccuracy={isOnline}
        showSpeed={isOnline}
        autoCenter={isOnline}
        userIconType="driver"
        drawDirections={!route && !driverToPassengerRoute && !originToDestinationRoute && isOnline}
      />

      {/* ===== BARRA DE NAVEGAÇÃO (quando há corrida activa) ===== */}
      {navActive ? (
        <div className="absolute top-0 inset-x-0 z-30 pointer-events-none">
          <div className="bg-black text-white px-5 pt-5 pb-6 rounded-b-3xl shadow-2xl pointer-events-auto">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary">
                <Navigation2 className="h-6 w-6 text-primary-foreground fill-current" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white/70">
                  {currentStep ? formatDistance(currentStep.distance) : routeInfo?.distance ?? ""}
                </div>
                <div
                  className="truncate text-2xl font-extrabold leading-tight"
                  dangerouslySetInnerHTML={{
                    __html: currentStep?.instruction || "Siga a rota indicada",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Destination / pickup address bar */}
          {navAddress && (
            <div className="mx-3 mt-2 flex items-center gap-3 rounded-2xl bg-neutral-900 px-4 py-3 text-white shadow-xl pointer-events-auto">
              <MapPin className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{addrLine1}</div>
                {addrLine2 && (
                  <div className="truncate text-xs font-medium text-white/60">{addrLine2}</div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ===== BOTÃO ONLINE/OFFLINE — SEM SOBREPOSIÇÃO ===== */
        <div className="absolute inset-0 z-[60] pointer-events-none flex flex-col items-center">
          {/*
            O botão está em z-[60] para ficar acima de:
            - Header do painel (z-10)
            - MapView (z-1)
            - Route ETA (z-10)
            - BottomSheet (z-40)
            Mas abaixo do IncomingRideCall (z-[100]) e SOS (z-40)
            Posicionado no centro superior para não sobrepor nada
          */}
          <div className="mt-16 pointer-events-auto">
            <button
              onClick={handleToggleOnlineStatus}
              className={
                "flex items-center gap-3 rounded-full px-7 py-4 font-bold shadow-2xl transition-all " +
                "ring-2 ring-offset-2 " +
                (isOnline
                  ? "bg-black text-white ring-green-400 ring-offset-black"
                  : "bg-white text-gray-800 ring-gray-300 ring-offset-white")
              }
            >
              <span
                className={`h-3 w-3 rounded-full ${
                  isOnline ? "bg-green-400 animate-pulse" : "bg-gray-400"
                }`}
              />
              <Power className={`h-4 w-4 ${isOnline ? "text-green-400" : "text-gray-400"}`} />
              <span className="text-base tracking-tight">
                {isOnline ? "Online — Recebendo Pedidos" : "Clique para ficar Online"}
              </span>
            </button>
          </div>

          {/* Indicador offline — posição segura, sem sobreposição */}
          {!isOnline && (
            <div className="mt-4 pointer-events-auto">
              <div className="bg-white/95 backdrop-blur-sm text-gray-700 px-5 py-3 rounded-2xl shadow-xl text-center border border-gray-200">
                <p className="text-sm font-bold">Motorista Offline</p>
                <p className="text-xs text-gray-500 mt-0.5">Fique online para receber pedidos e aparecer no mapa</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== CONTROLOS FLUTUANTES À DIREITA (estilo Uber driver) ===== */}
      {navActive && (
        <div className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-3">
          <button
            onClick={openNativeNavigation}
            title="Abrir GPS externo"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-xl ring-1 ring-black/5 active:scale-95"
          >
            <ExternalLink className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowSteps((s) => !s)}
            title="Ver itinerário"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-xl ring-1 ring-black/5 active:scale-95"
          >
            <Navigation2 className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ===== ITINERÁRIO COMPLETO (toggle) ===== */}
      {navActive && showSteps && routeSteps.length > 0 && (
        <div className="absolute inset-x-3 top-44 z-30 max-h-[45%] overflow-y-auto rounded-3xl bg-white shadow-2xl pointer-events-auto">
          <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-3">
            <span className="text-sm font-bold text-gray-900">Itinerário</span>
            <button
              onClick={() => setShowSteps(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {routeSteps.map((step, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-4 border-b border-gray-50 p-4 ${
                idx === currentStepIndex ? "bg-primary/5" : ""
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                  idx === currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {idx + 1}
              </div>
              <div className="flex-1">
                <div
                  className="text-sm font-medium leading-snug text-gray-800"
                  dangerouslySetInnerHTML={{ __html: step.instruction }}
                />
                <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                  <span>{formatDistance(step.distance)}</span>
                  <span>·</span>
                  <span>{formatDuration(step.duration)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== ETA PIL (Uber-style) ===== */}
      {routeInfo && isOnline && ["in_progress", "accepted", "arriving"].includes(rideStatus ?? "") && (
        <div className="absolute inset-x-0 top-48 z-20 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-5 rounded-full bg-black px-5 py-2.5 text-white shadow-2xl">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-xs font-black tracking-wider">{routeInfo.distance}</span>
            </div>
            <div className="h-4 w-[1px] bg-white/20" />
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs font-black tracking-wider">{routeInfo.duration}</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== ERROS DE GEOLOCALIZAÇÃO ===== */}
      {(error || updateError) && (
        <div className="absolute top-4 left-4 right-4 z-[70] pointer-events-none">
          <div className="bg-white border-l-4 border-yellow-500 p-4 rounded-2xl shadow-2xl max-w-sm mx-auto pointer-events-auto flex items-start gap-4">
            <div className="bg-yellow-50 p-2 rounded-xl">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Problema de Conexão</p>
              <p className="text-[11px] font-medium text-gray-500 mt-0.5">{error || updateError}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
