import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

/**
 * Calcula rota real (distância + duração) via Google Routes API através do
 * gateway Lovable. Substitui o cálculo Haversine, dando distância de via
 * efectiva — usada para o preço.
 */
export const computeRoute = createServerFn({ method: "POST" })
  .inputValidator((i) =>
    z
      .object({
        origin: z.object({ lat: z.number(), lng: z.number() }),
        destination: z.object({ lat: z.number(), lng: z.number() }),
        travelMode: z.enum(["DRIVE", "TWO_WHEELER"]).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return { distance_km: null, duration_min: null, polyline: null, error: "Maps não configurado" };
    }
    try {
      const res = await fetch(`${GATEWAY_URL}/routes/directions/v2:computeRoutes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
          origin: { location: { latLng: data.origin } },
          destination: { location: { latLng: data.destination } },
          travelMode: data.travelMode ?? "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        return {
          distance_km: null,
          duration_min: null,
          polyline: null,
          error: `Routes ${res.status}: ${txt.slice(0, 200)}`,
        };
      }
      const json = (await res.json()) as {
        routes?: Array<{
          distanceMeters?: number;
          duration?: string;
          polyline?: { encodedPolyline?: string };
        }>;
      };
      const r = json.routes?.[0];
      if (!r?.distanceMeters) {
        return { distance_km: null, duration_min: null, polyline: null, error: "Sem rota" };
      }
      const distance_km = Math.round((r.distanceMeters / 1000) * 100) / 100;
      const seconds = r.duration ? parseInt(r.duration.replace("s", ""), 10) : 0;
      const duration_min = Math.max(1, Math.round(seconds / 60));
      return {
        distance_km,
        duration_min,
        polyline: r.polyline?.encodedPolyline ?? null,
        error: null as string | null,
      };
    } catch (e) {
      return {
        distance_km: null,
        duration_min: null,
        polyline: null,
        error: e instanceof Error ? e.message : "Erro desconhecido",
      };
    }
  });
