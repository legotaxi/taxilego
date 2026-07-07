import { useState, useEffect, useCallback, useRef } from "react";

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface UseGeolocationState {
  loading: boolean;
  error: string | null;
  coordinates: GeolocationCoordinates | null;
}

/**
 * Hook para obter a localização geográfica do utilizador
 * Usa a Geolocation API do navegador com suporte completo
 */
export function useGeolocation(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  },
): UseGeolocationState & { requestLocation: () => void } {
  const [state, setState] = useState<UseGeolocationState>({
    loading: false,
    error: null,
    coordinates: null,
  });

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const requestLocation = useCallback(() => {
    // Verificar se o navegador suporta geolocalização
    if (!navigator?.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocalização não suportada neste navegador",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          error: null,
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          },
        });
      },
      (error) => {
        let errorMessage = "Erro ao obter localização";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permissão de localização negada. Ative a localização nas definições do navegador.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Posição indisponível. Tente novamente mais tarde.";
            break;
          case error.TIMEOUT:
            errorMessage = "Tempo limite excedido ao obter localização.";
            break;
        }
        setState({
          loading: false,
          error: errorMessage,
          coordinates: null,
        });
      },
      optionsRef.current,
    );
  }, []);

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    ...state,
    requestLocation,
  };
}

/**
 * Hook para rastrear a localização em tempo real
 * Atualiza continuamente a posição do utilizador
 */
export function useGeolocationWatch(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  },
): UseGeolocationState & { 
  stopTracking: () => void;
  isTracking: boolean;
  distanceTraveled: number;
} {
  const [state, setState] = useState<UseGeolocationState>({
    loading: true,
    error: null,
    coordinates: null,
  });

  const [isTracking, setIsTracking] = useState(false);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const previousCoordinatesRef = useRef<GeolocationCoordinates | null>(null);

  // Calcular distância entre dois pontos (Haversine formula)
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Raio da Terra em km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distância em km
    },
    [],
  );

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
      setDistanceTraveled(0);
      previousCoordinatesRef.current = null;
    }
  }, []);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!navigator?.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocalização não suportada neste navegador",
      }));
      return;
    }

    setIsTracking(true);
    let fellBack = false;

    const onSuccess = (position: GeolocationPosition) => {
      const newCoordinates: GeolocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };
      if (previousCoordinatesRef.current) {
        const distance = calculateDistance(
          previousCoordinatesRef.current.latitude,
          previousCoordinatesRef.current.longitude,
          newCoordinates.latitude,
          newCoordinates.longitude,
        );
        if (distance > 0.005) {
          setDistanceTraveled((prev) => prev + distance);
          previousCoordinatesRef.current = newCoordinates;
        }
      } else {
        previousCoordinatesRef.current = newCoordinates;
      }
      setState({ loading: false, error: null, coordinates: newCoordinates });
    };

    const onError = (error: GeolocationPositionError) => {
      // Em TIMEOUT, tenta uma vez sem alta precisão (mais rápido em desktop/Wi-Fi)
      if (error.code === error.TIMEOUT && !fellBack) {
        fellBack = true;
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000,
        });
        return;
      }
      let errorMessage = "Erro ao rastrear localização";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Permissão de localização negada. Ative a localização nas definições do navegador.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Posição indisponível. Tente novamente mais tarde.";
          break;
        case error.TIMEOUT:
          errorMessage = "Tempo limite excedido ao rastrear localização.";
          break;
      }
      setState({ loading: false, error: errorMessage, coordinates: null });
      setIsTracking(false);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      { ...optionsRef.current, timeout: Math.max(optionsRef.current.timeout ?? 0, 20000) },
    );

    return () => {
      stopTracking();
    };
  }, [stopTracking, calculateDistance]);

  return {
    ...state,
    stopTracking,
    isTracking,
    distanceTraveled,
  };
}

/**
 * Hook para obter a localização com retry automático
 * Tenta obter a localização várias vezes se falhar
 */
export function useGeolocationWithRetry(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  },
  maxRetries: number = 3,
): UseGeolocationState & { 
  requestLocation: () => void;
  retryCount: number;
} {
  const [state, setState] = useState<UseGeolocationState>({
    loading: false,
    error: null,
    coordinates: null,
  });

  const [retryCount, setRetryCount] = useState(0);
  const optionsRef = useRef(options);
  const retriesRef = useRef(0);
  optionsRef.current = options;

  const requestLocation = useCallback(() => {
    if (!navigator?.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocalização não suportada neste navegador",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    retriesRef.current = 0;

    const attemptGeolocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            loading: false,
            error: null,
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp,
            },
          });
          setRetryCount(0);
        },
        (error) => {
          retriesRef.current += 1;
          setRetryCount(retriesRef.current);

          if (retriesRef.current < maxRetries) {
            // Retry após 1 segundo
            setTimeout(attemptGeolocation, 1000);
          } else {
            let errorMessage = "Erro ao obter localização";
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "Permissão de localização negada. Ative a localização nas definições do navegador.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Posição indisponível. Tente novamente mais tarde.";
                break;
              case error.TIMEOUT:
                errorMessage = "Tempo limite excedido ao obter localização.";
                break;
            }
            setState({
              loading: false,
              error: errorMessage,
              coordinates: null,
            });
          }
        },
        optionsRef.current,
      );
    };

    attemptGeolocation();
  }, [maxRetries]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    ...state,
    requestLocation,
    retryCount,
  };
}

/**
 * Hook para obter a localização com precisão alta
 * Otimizado para aplicações que requerem alta precisão
 */
export function useHighAccuracyGeolocation(): UseGeolocationState & { 
  requestLocation: () => void;
  accuracy: string;
} {
  const geolocation = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  });

  const getAccuracyLevel = useCallback((): string => {
    if (!geolocation.coordinates) return "Desconhecida";
    const accuracy = geolocation.coordinates.accuracy;
    if (accuracy < 5) return "Muito Alta (< 5m)";
    if (accuracy < 10) return "Alta (< 10m)";
    if (accuracy < 50) return "Média (< 50m)";
    if (accuracy < 100) return "Baixa (< 100m)";
    return "Muito Baixa (> 100m)";
  }, [geolocation.coordinates]);

  return {
    ...geolocation,
    accuracy: getAccuracyLevel(),
  };
}
