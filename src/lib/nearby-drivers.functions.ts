import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Default search radius in meters (~2 km for urban areas)
const DEFAULT_RADIUS_M = 2000;
// Maximum radius (cap to avoid huge queries)
const MAX_RADIUS_M = 10000;

/**
 * Haversine distance in meters between two coordinates.
 */
function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Approximate lat/lng bounds for a radius (faster than checking every driver).
 * At the equator, 1 degree ≈ 111,320 meters.
 */
function latLngBoundsForRadius(
  centerLat: number,
  centerLng: number,
  radiusM: number,
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const latDeg = radiusM / 111320;
  const lngDeg = radiusM / (111320 * Math.cos((centerLat * Math.PI) / 180));
  return {
    minLat: centerLat - latDeg,
    maxLat: centerLat + latDeg,
    minLng: centerLng - lngDeg,
    maxLng: centerLng + lngDeg,
  };
}

/**
 * Returns anonymized locations (lat/lng only + distance) of online approved drivers
 * within a geographic radius of the passenger.
 * Results are sorted by distance (nearest first).
 */
export const getNearbyDrivers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        lat: z.number().min(-90).max(90).optional(),
        lng: z.number().min(-180).max(180).optional(),
        radius_m: z.number().min(100).max(MAX_RADIUS_M).optional().default(DEFAULT_RADIUS_M),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Passenger location — required for geographic filtering
    if (!data.lat || !data.lng) {
      return {
        drivers: [] as Array<{ lat: number; lng: number; distance_m: number }>,
        error: "Localização do passageiro não fornecida",
      };
    }

    const bounds = latLngBoundsForRadius(data.lat, data.lng, data.radius_m);

    // First pass: bounding box filter in the database (fast)
    const { data: driversData, error } = await supabaseAdmin
      .from("drivers")
      .select("current_lat, current_lng, accuracy, speed")
      .eq("status", "approved")
      .eq("is_online", true)
      .gte("current_lat", bounds.minLat)
      .lte("current_lat", bounds.maxLat)
      .gte("current_lng", bounds.minLng)
      .lte("current_lng", bounds.maxLng)
      .not("current_lat", "is", null)
      .not("current_lng", "is", null)
      .limit(50);

    if (error) {
      console.error("getNearbyDrivers error:", error);
      return { drivers: [], error: error.message };
    }

    // Second pass: precise Haversine distance filtering and sorting
    const nearbyDrivers = (driversData ?? [])
      .filter((d) => d.current_lat != null && d.current_lng != null)
      .map((d) => {
        const distance = haversineMeters(
          data.lat!,
          data.lng!,
          d.current_lat as number,
          d.current_lng as number,
        );
        return {
          lat: d.current_lat as number,
          lng: d.current_lng as number,
          distance_m: Math.round(distance),
          accuracy: d.accuracy ?? null,
          speed: d.speed ?? null,
        };
      })
      .filter((d) => d.distance_m <= data.radius_m)
      .sort((a, b) => a.distance_m - b.distance_m);

    return { drivers: nearbyDrivers, error: null as string | null };
  });

/**
 * Legacy endpoint (no params) — for backward compatibility.
 * Falls back to the old behavior (all online drivers).
 */
export const getNearbyDriversLegacy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("drivers")
      .select("current_lat, current_lng")
      .eq("status", "approved")
      .eq("is_online", true)
      .not("current_lat", "is", null)
      .not("current_lng", "is", null)
      .limit(50);
    if (error) {
      console.error("getNearbyDriversLegacy error:", error);
      return { drivers: [] as Array<[number, number]>, error: error.message };
    }
    const drivers = (data ?? [])
      .filter((d) => d.current_lat != null && d.current_lng != null)
      .map((d) => [d.current_lat as number, d.current_lng as number] as [number, number]);
    return { drivers, error: null as string | null };
  });
