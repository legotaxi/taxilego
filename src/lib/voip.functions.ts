import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Envia notificação push ao destinatário para acordar o dispositivo e alertar sobre a chamada VoIP. */
export const sendCallInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        toUserId: z.string().uuid(),
        callerName: z.string().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { sendPushToUser } = await import("./push.server");
    await sendPushToUser(data.toUserId, {
      title: "Chamada recebida",
      body: `${data.callerName || "Alguém"} está a chamar-te`,
      tag: `voip-${userId}`,
      type: "voip_incoming",
      requireInteraction: true,
      url: "/minhas-corridas",
    });
    return { ok: true };
  });
