import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyRides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("rides")
      .select(
        "id, category, status, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, fare_kz, distance_km, duration_min, payment_method, paid_at, cashback_kz, driver_rating, created_at, completed_at, driver_id, accepted_at, started_at",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("getMyRides error:", error);
      return { rides: [], error: error.message };
    }
    return { rides: data ?? [], error: null };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, phone, avatar_url, city, wallet_balance_kz")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("getMyProfile error:", error);
      return { profile: null, error: error.message };
    }
    return { profile: data, error: null };
  });

export const getDriverInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ driver_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id, current_lat, current_lng, last_accuracy, last_speed, last_heading, last_location_update, rating, total_rides, vehicle_id")
      .eq("id", data.driver_id)
      .maybeSingle();

    if (driverError) {
      console.error("getDriverInfo error:", driverError);
      return { driver: null, profile: null, vehicle: null, error: driverError.message };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, phone, avatar_url")
      .eq("id", data.driver_id)
      .maybeSingle();

    if (profileError) {
      console.error("getDriverProfile error:", profileError);
      return { driver, profile: null, vehicle: null, error: profileError.message };
    }

    // Vehicle: prefer drivers.vehicle_id, fallback to vehicles.owner_id = driver_id
    let vehicle: { brand: string; model: string; plate: string; color: string | null; category: string } | null = null;
    if (driver?.vehicle_id) {
      const { data: v } = await supabase
        .from("vehicles")
        .select("brand, model, plate, color, category")
        .eq("id", driver.vehicle_id)
        .maybeSingle();
      vehicle = v ?? null;
    }
    if (!vehicle) {
      const { data: v } = await supabase
        .from("vehicles")
        .select("brand, model, plate, color, category")
        .eq("owner_id", data.driver_id)
        .maybeSingle();
      vehicle = v ?? null;
    }

    return { driver, profile, vehicle, error: null };
  });


// Preços reais por categoria (Kz).
// base = bandeirada (preço base fixo por categoria)
// perKm = 150 Kz por quilómetro (comum a todas as categorias)
// perMin = 20 Kz por minuto de trânsito (comum a todas as categorias)
// min = preço base = bandeirada (o preço nunca é inferior à bandeirada)
const CATEGORY_PRICING = {
  moto:     { base: 300, perKm: 150, perMin: 20, min: 300 },
  normal:   { base: 500, perKm: 150, perMin: 20, min: 500 },
  xl:       { base: 1000, perKm: 150, perMin: 20, min: 1000 },
  premium:  { base: 1500, perKm: 150, perMin: 20, min: 1500 },
  shared:   { base: 250, perKm: 150, perMin: 20, min: 250 },
  delivery: { base: 400, perKm: 150, perMin: 20, min: 400 },
} as const;

function computeFare(category: keyof typeof CATEGORY_PRICING, distance_km: number, duration_min: number) {
  const p = CATEGORY_PRICING[category];
  // Fórmula: base + (150 × km) + (20 × min)
  // O preço varia sempre com distância e tempo — nunca é fixo
  const raw = p.base + p.perKm * distance_km + p.perMin * duration_min;
  return Math.round(raw);
}

export const estimateFare = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        category: z.enum(["moto", "normal", "xl", "premium", "shared", "delivery"]),
        distance_km: z.number().min(0).max(500),
        duration_min: z.number().min(0).max(600),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const fare = computeFare(data.category, data.distance_km, data.duration_min);
    return { fare_kz: fare, breakdown: CATEGORY_PRICING[data.category] };
  });

export const requestRide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        category: z.enum(["moto", "normal", "xl", "premium", "shared", "delivery"]),
        pickup_address: z.string().min(2).max(255),
        pickup_lat: z.number(),
        pickup_lng: z.number(),
        dropoff_address: z.string().min(2).max(255),
        dropoff_lat: z.number(),
        dropoff_lng: z.number(),
        distance_km: z.number().min(0).max(500),
        duration_min: z.number().min(0).max(600),
        payment_method: z.enum(["cash", "mcx_express", "reference", "card", "wallet"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const fare = computeFare(data.category, data.distance_km, data.duration_min);

    const { data: ride, error } = await supabase
      .from("rides")
      .insert({
        passenger_id: userId,
        category: data.category,
        pickup_address: data.pickup_address,
        pickup_lat: data.pickup_lat,
        pickup_lng: data.pickup_lng,
        dropoff_address: data.dropoff_address,
        dropoff_lat: data.dropoff_lat,
        dropoff_lng: data.dropoff_lng,
        distance_km: data.distance_km,
        duration_min: data.duration_min,
        fare_kz: fare,
        payment_method: data.payment_method,
        status: "requested",
      })
      .select("id")
      .single();

    if (error) {
      console.error("requestRide error:", error);
      return { ride: null, error: error.message };
    }

    // Broadcast push aos motoristas online
    try {
      const { data: onlineDrivers } = await supabase
        .from("drivers")
        .select("id")
        .eq("is_online", true)
        .eq("status", "approved");
      if (onlineDrivers && onlineDrivers.length > 0) {
        const { sendPushToUser } = await import("./push.server");
        await Promise.all(
          onlineDrivers.map((d) =>
            sendPushToUser(d.id, {
              title: "LegoTaxi · Nova corrida",
              body: `${data.pickup_address} → ${data.dropoff_address} · ${fare} Kz`,
              url: "/painel-motorista",
              tag: `new-ride-${ride?.id}`,
            }),
          ),
        );
      }
    } catch (e) {
      console.error("requestRide broadcast push error:", e);
    }

    return { ride, error: null };
  });

export const cancelRide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Ownership: só passageiro dono OU motorista atribuído podem cancelar
    const { data: ride, error: fetchErr } = await supabase
      .from("rides")
      .select("passenger_id, driver_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr || !ride) return { ok: false, error: "Corrida não encontrada" };
    if (ride.passenger_id !== userId && ride.driver_id !== userId) {
      return { ok: false, error: "Sem permissão para cancelar esta corrida" };
    }
    if (ride.status === "completed" || ride.status === "cancelled") {
      return { ok: false, error: "Corrida já foi finalizada" };
    }
    const { error } = await supabase
      .from("rides")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  });
