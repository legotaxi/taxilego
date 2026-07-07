import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns anonymized locations (lat/lng only) of online approved drivers.
 * Used by the passenger map to show nearby drivers before requesting a ride.
 * No PII is returned — no driver id, name, phone, plate, etc.
 */
export const getNearbyDrivers = createServerFn({ method: "GET" })
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
      console.error("getNearbyDrivers error:", error);
      return { drivers: [] as Array<[number, number]>, error: error.message };
    }
    const drivers = (data ?? [])
      .filter((d) => d.current_lat != null && d.current_lng != null)
      .map((d) => [d.current_lat as number, d.current_lng as number] as [number, number]);
    return { drivers, error: null as string | null };
  });
