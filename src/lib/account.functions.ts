import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Permanently deletes the authenticated user's account and all associated
 * personal data. Runs server-side only; the service role key never reaches
 * the browser.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    if (!userId) return { ok: false, error: "Sessão inválida" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    try {
      // 1. Personal content and communications
      await supabaseAdmin.from("ride_messages").delete().eq("sender_id", userId);
      await supabaseAdmin.from("push_subscriptions").delete().eq("user_id", userId);
      await supabaseAdmin.from("support_tickets").delete().eq("user_id", userId);
      await supabaseAdmin.from("wallet_topup_requests").delete().eq("user_id", userId);
      await supabaseAdmin.from("wallet_withdrawal_requests").delete().eq("user_id", userId);
      await supabaseAdmin.from("transactions").delete().eq("user_id", userId);

      // 2. Rides (messages of those rides go first to satisfy FKs)
      const { data: rides } = await supabaseAdmin
        .from("rides")
        .select("id")
        .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`);
      const rideIds = (rides ?? []).map((r) => r.id);
      if (rideIds.length > 0) {
        await supabaseAdmin.from("ride_messages").delete().in("ride_id", rideIds);
        await supabaseAdmin.from("rides").delete().in("id", rideIds);
      }

      // 3. Driver-specific data
      await supabaseAdmin.from("vehicles").delete().eq("driver_id", userId);
      await supabaseAdmin.from("drivers").delete().eq("id", userId);

      // 4. Roles + profile
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.from("profiles").delete().eq("id", userId);

      // 5. Auth identity (irreversible)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) return { ok: false, error: error.message };

      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao eliminar conta";
      console.error("[deleteMyAccount]", err);
      return { ok: false, error: message };
    }
  });
