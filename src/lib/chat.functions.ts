import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getRideMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ ride_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: messages, error } = await supabase
      .from("ride_messages")
      .select("id, ride_id, sender_id, sender_role, text, read_at, created_at")
      .eq("ride_id", data.ride_id)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) return { messages: [], error: error.message };
    return { messages: messages ?? [], error: null };
  });

export const sendRideMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        ride_id: z.string().uuid(),
        text: z.string().min(1).max(1000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Determine sender role from ride
    const { data: ride } = await supabase
      .from("rides")
      .select("passenger_id, driver_id")
      .eq("id", data.ride_id)
      .maybeSingle();
    if (!ride) return { ok: false, error: "Corrida não encontrada" };
    const role =
      ride.passenger_id === userId
        ? "passenger"
        : ride.driver_id === userId
          ? "driver"
          : null;
    if (!role) return { ok: false, error: "Sem permissão" };

    const { data: msg, error } = await supabase
      .from("ride_messages")
      .insert({
        ride_id: data.ride_id,
        sender_id: userId,
        sender_role: role,
        text: data.text,
      })
      .select("id, ride_id, sender_id, sender_role, text, read_at, created_at")
      .single();
    if (error) return { ok: false, error: error.message };

    // Push para o outro lado da conversa
    try {
      const recipientId =
        role === "passenger" ? ride.driver_id : ride.passenger_id;
      if (recipientId) {
        const { data: sender } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .maybeSingle();
        const { sendPushToUser } = await import("./push.server");
        await sendPushToUser(recipientId, {
          title: `LegoTaxi · ${sender?.full_name ?? "Nova mensagem"}`,
          body: data.text.slice(0, 140),
          url: role === "passenger" ? "/painel-motorista" : "/pedir",
          tag: `chat-${data.ride_id}`,
        });
      }
    } catch (e) {
      console.error("sendRideMessage push error:", e);
    }

    return { ok: true, message: msg };
  });

export const markRideMessagesRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ ride_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("ride_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("ride_id", data.ride_id)
      .neq("sender_id", userId)
      .is("read_at", null);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
