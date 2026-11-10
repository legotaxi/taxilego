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
      const { data: driver, error: driverLookupError } = await supabaseAdmin
        .from("drivers")
        .select("bi_url, license_url, criminal_record_url, photo_url")
        .eq("id", userId)
        .maybeSingle();
      if (driverLookupError) throw driverLookupError;

      const documentPaths = [driver?.bi_url, driver?.license_url, driver?.criminal_record_url, driver?.photo_url]
        .filter((path): path is string => typeof path === "string" && path.length > 0);
      if (documentPaths.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage.from("driver-docs").remove(documentPaths);
        if (storageError) throw storageError;
      }

      // Driver-linked rides use ON DELETE SET NULL, so remove them explicitly.
      const { error: ridesError } = await supabaseAdmin
        .from("rides")
        .delete()
        .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`);
      if (ridesError) throw ridesError;

      // The remaining account-owned rows cascade from auth.users on deletion.
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;

      return { ok: true };
    } catch (err: unknown) {
      console.error("[deleteMyAccount]", err);
      return { ok: false, error: "Não foi possível concluir a eliminação. Tente novamente." };
    }
  });
