import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const confirmRidePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ ride_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("confirm_ride_payment", {
      _ride_id: data.ride_id,
    });
    if (error) return { ok: false, error: error.message };
    return result as {
      ok: boolean;
      error?: string;
      fare_kz?: number;
      cashback_kz?: number;
      already_paid?: boolean;
    };
  });

export const rateDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ ride_id: z.string().uuid(), stars: z.number().int().min(1).max(5) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("rate_driver", {
      _ride_id: data.ride_id,
      _stars: data.stars,
    });
    if (error) return { ok: false, error: error.message };
    return result as { ok: boolean; error?: string };
  });

export const getRideSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ ride_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: ride, error } = await supabase
      .from("rides")
      .select(
        "id, status, fare_kz, cashback_kz, paid_at, payment_method, passenger_id, driver_id, driver_rating, distance_km, duration_min, pickup_address, dropoff_address",
      )
      .eq("id", data.ride_id)
      .maybeSingle();
    if (error || !ride) return { ride: null, error: error?.message ?? "Não encontrada" };
    return { ride, error: null };
  });
