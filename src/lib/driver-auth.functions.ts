import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Adds the authenticated caller's public-driver role without trusting a client-supplied user ID. */
export const ensureDriverIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    if (!userId) return { ok: false, error: "Sessão inválida" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role: "driver" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );

    if (error) {
      console.error("[ensureDriverIdentity] Could not assign driver role", error);
      return { ok: false, error: "Não foi possível preparar a conta de motorista. Tente novamente." };
    }

    return { ok: true };
  });