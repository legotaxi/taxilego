import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

/**
 * Reverse geocoding via Google Maps Geocoding API (gateway).
 * Browser key is not authorized for Geocoding, so this must go through the server.
 */
export const reverseGeocode = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ lat: z.number(), lng: z.number() }).parse(i))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return { address: null as string | null, error: "Maps não configurado" };
    }
    try {
      const res = await fetch(
        `${GATEWAY_URL}/maps/api/geocode/json?latlng=${data.lat},${data.lng}&language=pt`,
        {
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          },
        },
      );
      if (!res.ok) {
        return { address: null as string | null, error: `HTTP ${res.status}` };
      }
      const json = (await res.json()) as {
        results?: Array<{ formatted_address?: string }>;
      };
      const address = json.results?.[0]?.formatted_address ?? null;
      return { address, error: null as string | null };
    } catch (e) {
      return {
        address: null as string | null,
        error: e instanceof Error ? e.message : "Erro desconhecido",
      };
    }
  });
