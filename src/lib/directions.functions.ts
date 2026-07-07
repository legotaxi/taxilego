/**
 * Funções para calcular e gerenciar rotas em tempo real
 * Suporta múltiplas rotas (motorista→passageiro e origem→destino)
 */

import { loadGoogleMaps } from "./google-maps-loader";

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  location: [number, number];
  end_location?: [number, number];
  maneuver?: string;
}


export interface RouteInfo {
  origin: [number, number];
  destination: [number, number];
  distance: number; // em metros
  duration: number; // em segundos
  polyline: [number, number][]; // array de coordenadas [lat, lng]
  steps: RouteStep[];
}

export interface MultiRouteInfo {
  driverToPassenger?: RouteInfo;
  originToDestination?: RouteInfo;
}

/**
 * Calcula uma rota entre dois pontos usando Google Directions API
 */
export async function calculateRoute(
  origin: [number, number],
  destination: [number, number],
): Promise<RouteInfo | null> {
  try {
    const google = await loadGoogleMaps();
    const directionsService = new google.maps.DirectionsService();

    const result = await new Promise<any>((resolve, reject) => {
      directionsService.route(
        {
          origin: { lat: origin[0], lng: origin[1] },
          destination: { lat: destination[0], lng: destination[1] },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === google.maps.DirectionsStatus.OK) {
            resolve(result);
          } else {
            reject(new Error(`Directions API error: ${status}`));
          }
        },
      );
    });

    if (!result || !result.routes || result.routes.length === 0) {
      return null;
    }

    const route = result.routes[0];
    const leg = route.legs[0];

    // Decodificar polyline
    const polyline = decodePolyline(route.overview_polyline.points);

    const steps: RouteStep[] = leg.steps.map((step: any) => ({
      instruction: step.instructions,
      distance: step.distance.value,
      duration: step.duration.value,
      location: [step.start_location.lat(), step.start_location.lng()],
      end_location: [step.end_location.lat(), step.end_location.lng()],
      maneuver: step.maneuver,
    }));


    return {
      origin,
      destination,
      distance: leg.distance.value, // metros
      duration: leg.duration.value, // segundos
      polyline,
      steps,
    };
  } catch (error) {
    console.error("Erro ao calcular rota:", error);
    return null;
  }
}

/**
 * Calcula múltiplas rotas em paralelo
 */
export async function calculateMultipleRoutes(
  driverLocation: [number, number],
  pickupLocation: [number, number],
  destinationLocation: [number, number],
  isInProgress: boolean,
): Promise<MultiRouteInfo> {
  try {
    const routes: MultiRouteInfo = {};

    if (isInProgress) {
      // Quando em curso: motorista → destino
      const originToDest = await calculateRoute(driverLocation, destinationLocation);
      if (originToDest) {
        routes.originToDestination = originToDest;
      }
    } else {
      // Quando aceite/a chegar: motorista → passageiro
      const driverToPass = await calculateRoute(driverLocation, pickupLocation);
      if (driverToPass) {
        routes.driverToPassenger = driverToPass;
      }
    }

    return routes;
  } catch (error) {
    console.error("Erro ao calcular múltiplas rotas:", error);
    return {};
  }
}

/**
 * Decodifica polyline do Google Directions API
 * Algoritmo padrão de codificação do Google Maps
 */
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/**
 * Calcula distância entre dois pontos em km (Haversine)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formata distância em km com 2 casas decimais
 */
export function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

/**
 * Formata duração em minutos
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
}
