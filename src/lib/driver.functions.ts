import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPendingRides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("rides")
      .select(
        "id, category, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, fare_kz, distance_km, duration_min, status, created_at",
      )
      .eq("status", "requested")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return { rides: [], error: error.message };
    return { rides: data ?? [], error: null };
  });

export const getMyRides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("rides")
      .select(
        "id, passenger_id, category, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, fare_kz, distance_km, duration_min, status, payment_method, paid_at, cashback_kz, created_at",
      )
      .eq("driver_id", userId)
      .in("status", ["accepted", "arriving", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) return { rides: [], error: error.message };
    return { rides: data ?? [], error: null };
  });

export const acceptRide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("rides")
      .update({
        driver_id: userId,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("status", "requested");
    if (error) return { ok: false, error: error.message };

    // Notificar o passageiro (ecrã bloqueado)
    try {
      const { data: ride } = await supabase
        .from("rides")
        .select("passenger_id")
        .eq("id", data.id)
        .maybeSingle();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("brand, model, plate, color")
        .eq("owner_id", userId)
        .maybeSingle();
      if (ride?.passenger_id) {
        const vehicleLine = vehicle
          ? `${[vehicle.color, vehicle.brand, vehicle.model].filter(Boolean).join(" ")} · ${vehicle.plate}`
          : "O seu motorista está a caminho";
        const { sendPushToUser } = await import("./push.server");
        await sendPushToUser(ride.passenger_id, {
          title: "LegoTaxi · Corrida aceite",
          body: `${profile?.full_name ?? "Motorista"} — ${vehicleLine}`,
          url: "/pedir",
          tag: `ride-${data.id}`,
        });
      }
    } catch (e) {
      console.error("acceptRide push error:", e);
    }

    return { ok: true, error: null };
  });

export const updateRideStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["arriving", "in_progress", "completed", "cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const now = new Date().toISOString();
    const patch: {
      status: typeof data.status;
      started_at?: string;
      completed_at?: string;
      cancelled_at?: string;
    } = { status: data.status };
    if (data.status === "in_progress") patch.started_at = now;
    if (data.status === "completed") patch.completed_at = now;
    if (data.status === "cancelled") patch.cancelled_at = now;
    // Ownership: só o motorista atribuído pode mudar estado da corrida
    const { error } = await supabase
      .from("rides")
      .update(patch)
      .eq("id", data.id)
      .eq("driver_id", userId);
    if (error) return { ok: false, error: error.message };

    // Notificar o passageiro quando o motorista está a chegar
    if (data.status === "arriving" || data.status === "in_progress") {
      try {
        const { data: ride } = await supabase
          .from("rides")
          .select("passenger_id")
          .eq("id", data.id)
          .maybeSingle();
        if (ride?.passenger_id) {
          const { sendPushToUser } = await import("./push.server");
          await sendPushToUser(ride.passenger_id, {
            title:
              data.status === "arriving"
                ? "LegoTaxi · Motorista a chegar"
                : "LegoTaxi · Viagem iniciada",
            body:
              data.status === "arriving"
                ? "O seu motorista está quase no ponto de recolha."
                : "Boa viagem! A caminho do destino.",
            url: "/pedir",
            tag: `ride-${data.id}`,
          });
        }
      } catch (e) {
        console.error("updateRideStatus push error:", e);
      }
    }

    return { ok: true, error: null };
  });

export const updateDriverLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("drivers")
      .update({
        current_lat: data.lat,
        current_lng: data.lng,
      })
      .eq("id", userId);

    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  });
