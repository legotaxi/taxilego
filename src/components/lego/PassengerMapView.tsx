import { useState, useEffect, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MapView } from "./MapView";
import { useGeolocationWatch } from "../../hooks/use-geolocation";
import { reverseGeocode } from "@/lib/maps.functions";
import { LUBANGO_CENTER } from "@/lib/google-maps-loader";
import { Search, Loader2, X, AlertCircle, MapPin, Navigation2, Car } from "lucide-react";
import type { NearbyDriver } from "./MapView";

interface PassengerMapViewProps {
  onPickupLocationSelect?: (location: [number, number], address?: string) => void;
  onDestinationLocationSelect?: (location: [number, number], address?: string) => void;
  pickupLocation?: [number, number];
  destinationLocation?: [number, number];
  onLocationUpdate?: (location: [number, number]) => void;
  nearbyDrivers?: Array<[number, number]> | NearbyDriver[];
}

/**
 * PassengerMapView - Mapa para passageiros com seleção de localização e rastreamento em tempo real.
 * Melhoria: mostra carros disponíveis como ícones de carro coloridos, com contagem,
 * e traça o trajeto rosa/magenta do ponto de origem ao destino.
 */
export function PassengerMapView({
  onPickupLocationSelect,
  onDestinationLocationSelect,
  pickupLocation = [LUBANGO_CENTER.lat, LUBANGO_CENTER.lng],
  destinationLocation = [LUBANGO_CENTER.lat + 0.01, LUBANGO_CENTER.lng + 0.01],
  onLocationUpdate,
  nearbyDrivers,
}: PassengerMapViewProps) {
  const reverseGeocodeFn = useServerFn(reverseGeocode);
  const { coordinates, loading, error, isTracking, distanceTraveled, stopTracking } =
    useGeolocationWatch(
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
      true, // sempre activo para passageiro
    );

  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [selectionMode, setSelectionMode] = useState<"pickup" | "destination" | null>(null);
  const [addresses, setAddresses] = useState<{
    pickup?: string;
    destination?: string;
  }>({});
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [availableCarsCount, setAvailableCarsCount] = useState(0);

  const userLocation: [number, number] = coordinates
    ? [coordinates.latitude, coordinates.longitude]
    : pickupLocation;

  // Atualizar localização do utilizador
  useEffect(() => {
    if (coordinates) {
      onLocationUpdate?.([coordinates.latitude, coordinates.longitude]);
    }
  }, [coordinates, onLocationUpdate]);

  // Contar carros disponíveis
  useEffect(() => {
    if (nearbyDrivers && nearbyDrivers.length > 0) {
      setAvailableCarsCount(nearbyDrivers.length);
    } else {
      setAvailableCarsCount(0);
    }
  }, [nearbyDrivers]);

  // Reverse geocoding via Google Maps
  const getAddressFromCoordinates = useCallback(
    async (lat: number, lng: number): Promise<string> => {
      try {
        setGeocodingError(null);
        const res = await reverseGeocodeFn({ data: { lat, lng } });
        if (res.error || !res.address) {
          if (res.error) setGeocodingError(res.error);
          return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        return res.address;
      } catch (err) {
        console.error("Erro reverse geocoding:", err);
        setGeocodingError("Erro ao obter endereço.");
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    },
    [reverseGeocodeFn],
  );

  const handleLocationSelect = useCallback(
    async (location: [number, number]) => {
      setSelectedLocation(location);
      setIsGeocoding(true);

      try {
        const address = await getAddressFromCoordinates(location[0], location[1]);

        if (selectionMode === "pickup") {
          setAddresses((prev) => ({ ...prev, pickup: address }));
          onPickupLocationSelect?.(location, address);
          setSelectionMode(null);
        } else if (selectionMode === "destination") {
          setAddresses((prev) => ({ ...prev, destination: address }));
          onDestinationLocationSelect?.(location, address);
          setSelectionMode(null);
        }
      } finally {
        setIsGeocoding(false);
      }
    },
    [selectionMode, getAddressFromCoordinates, onPickupLocationSelect, onDestinationLocationSelect],
  );

  const handleCancelSelection = useCallback(() => {
    setSelectionMode(null);
    setSelectedLocation(null);
    setGeocodingError(null);
  }, []);

  const handleToggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking();
    }
  }, [isTracking, stopTracking]);

  // Verificar se há rota traçada (origem → destino)
  const hasRoute = !!(pickupLocation && destinationLocation);

  return (
    <div className="relative h-full w-full">
      <MapView
        pickupLocation={pickupLocation}
        destinationLocation={destinationLocation}
        driverLocation={userLocation}
        onLocationSelect={selectionMode ? handleLocationSelect : undefined}
        showAccuracy={true}
        showSpeed={true}
        autoCenter={true}
        userIconType="passenger"
        drawDirections={true}
        nearbyDrivers={nearbyDrivers}
      />

      {/* Available cars counter — canto superior esquerdo */}
      {availableCarsCount > 0 && !selectionMode && (
        <div className="absolute left-4 top-20 z-20">
          <div className="flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm px-3 py-2 shadow-lg border border-gray-100">
            <Car className="h-4 w-4 text-pink-500" />
            <span className="text-xs font-bold text-gray-800">
              {availableCarsCount} {availableCarsCount === 1 ? "carro" : "carros"} disponíveis
            </span>
          </div>
        </div>
      )}

      {/* Route info badge — quando há rota traçada */}
      {hasRoute && !selectionMode && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-60 z-20">
          <div className="flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm px-4 py-2 shadow-lg border border-gray-100">
            <MapPin className="h-3.5 w-3.5 text-pink-500" />
            <span className="text-xs font-semibold text-gray-700">Trajeto origem → destino</span>
          </div>
        </div>
      )}

      {/* Selection mode indicator */}
      {selectionMode && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-white rounded-2xl p-6 text-center shadow-2xl max-w-sm mx-4 pointer-events-auto">
            {isGeocoding ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-yellow-600" />
                <p className="font-semibold text-gray-800">Processando localização...</p>
                <p className="text-xs text-gray-600 mt-2">Por favor aguarde</p>
              </>
            ) : (
              <>
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="font-semibold text-gray-800 text-sm flex items-center gap-2 justify-center">
                    <MapPin className="h-4 w-4 text-yellow-600" />
                    Clique no mapa para selecionar{" "}
                    {selectionMode === "pickup" ? "ponto de recolha" : "destino"}
                  </p>
                </div>
                {geocodingError && (
                  <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                    {geocodingError}
                  </div>
                )}
                <button
                  onClick={handleCancelSelection}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2 font-medium"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg text-sm z-20 flex items-start gap-2 max-w-xs">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Erro de localização</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && !selectionMode && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 px-4 py-2 rounded-lg text-sm z-20 flex items-center gap-2 max-w-xs">
          <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
          <span className="text-gray-700">Obtendo localização...</span>
        </div>
      )}

      {/* Tracking status indicator */}
      {isTracking && !loading && (
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(max(env(safe-area-inset-top),1rem)+0.75rem)] z-20">
          <div className="flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md border border-yellow-200 px-3 py-1 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-yellow-400 opacity-70 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500" />
            </span>
            <span className="text-[11px] font-semibold tracking-wide text-yellow-700">Rastreamento activo</span>
          </div>
        </div>
      )}

      {/* Distance traveled */}
      {distanceTraveled > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 z-20">
          <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Percorrido</p>
          <p className="text-sm font-bold text-yellow-600">{distanceTraveled.toFixed(2)} km</p>
        </div>
      )}

      {/* Tracking control button */}
      {isTracking && (
        <button
          onClick={handleToggleTracking}
          className="absolute bottom-4 right-4 px-3 py-2 bg-yellow-600 text-white text-xs font-semibold rounded-lg hover:bg-yellow-700 transition shadow-lg z-20"
          title="Parar rastreamento"
        >
          Parar Rastreamento
        </button>
      )}
    </div>
  );
}
