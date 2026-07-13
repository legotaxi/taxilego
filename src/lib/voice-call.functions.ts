import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Notificar utilizador sobre chamada de voz recebida
 */
export const notifyIncomingCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        recipientId: z.string().uuid(),
        callerId: z.string().uuid(),
        callerName: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    try {
      // Enviar notificação push ao utilizador
      const { sendPushToUser } = await import("./push.server");
      await sendPushToUser(data.recipientId, {
        title: "LegoTaxi · Chamada de voz",
        body: `${data.callerName} está a chamar...`,
        url: "/pedir",
        tag: `voice-call-${data.callerId}`,
      });

      return { ok: true, error: null };
    } catch (err) {
      console.error("Erro ao notificar chamada de voz:", err);
      return { ok: false, error: "Erro ao enviar notificação" };
    }
  });

/**
 * Registar histórico de chamada de voz
 */
export const logVoiceCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        rideId: z.string().uuid(),
        remoteUserId: z.string().uuid(),
        duration: z.number().min(0),
        status: z.enum(["completed", "missed", "rejected"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    try {
      const { error } = await supabase.from("voice_calls").insert({
        ride_id: data.rideId,
        caller_id: userId,
        recipient_id: data.remoteUserId,
        duration_seconds: data.duration,
        status: data.status,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Erro ao registar chamada de voz:", error);
        return { ok: false, error: error.message };
      }

      return { ok: true, error: null };
    } catch (err) {
      console.error("Erro ao registar chamada de voz:", err);
      return { ok: false, error: "Erro ao registar chamada" };
    }
  });

/**
 * Obter histórico de chamadas de voz
 */
export const getVoiceCallHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    try {
      const { data, error } = await supabase
        .from("voice_calls")
        .select(
          `
          id,
          ride_id,
          caller_id,
          recipient_id,
          duration_seconds,
          status,
          created_at,
          caller:profiles!caller_id(full_name),
          recipient:profiles!recipient_id(full_name)
        `,
        )
        .or(`caller_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Erro ao obter histórico de chamadas:", error);
        return { calls: [], error: error.message };
      }

      return { calls: data ?? [], error: null };
    } catch (err) {
      console.error("Erro ao obter histórico de chamadas:", err);
      return { calls: [], error: "Erro ao obter histórico" };
    }
  });
