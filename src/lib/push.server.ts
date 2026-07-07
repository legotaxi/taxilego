import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

interface PushContent {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  image?: string;
}

/**
 * Envia uma notificação push para todos os dispositivos de um utilizador.
 * Server-only: usa a chave privada VAPID e o service role.
 */
export async function sendPushToUser(userId: string, content: PushContent): Promise<void> {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    console.error("sendPushToUser: chaves VAPID em falta");
    return;
  }

  const { data: subs, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    console.error("sendPushToUser: erro a ler subscrições", error);
    return;
  }
  if (!subs || subs.length === 0) return;

  const vapid = { subject, publicKey, privateKey };
  const message = {
    data: JSON.stringify(content),
    options: { ttl: 60 },
  };

  await Promise.all(
    subs.map(async (s) => {
      const subscription: PushSubscription = {
        endpoint: s.endpoint,
        expirationTime: null,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };
      try {
        const payload = await buildPushPayload(message, subscription, vapid);
        const res = await fetch(s.endpoint, payload as unknown as RequestInit);
        // Subscrição expirada/inválida → remover
        if (res.status === 404 || res.status === 410) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", s.endpoint);
        }
      } catch (e) {
        console.error("sendPushToUser: falha ao enviar", e);
      }
    }),
  );
}
