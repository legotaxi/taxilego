import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Denunciar um utilizador (conteúdo abusivo, comportamento, fraude, segurança). */
export const reportUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        reported_id: z.string().uuid(),
        ride_id: z.string().uuid().nullable().optional(),
        reason: z.enum(["abuso", "assedio", "fraude", "seguranca", "spam", "outro"]),
        details: z.string().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.reported_id === userId) return { ok: false, error: "Não pode denunciar-se a si próprio" };

    const { error } = await supabase.from("user_reports").insert({
      reporter_id: userId,
      reported_id: data.reported_id,
      ride_id: data.ride_id ?? null,
      reason: data.reason,
      details: data.details ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

/** Bloquear um utilizador — deixa de haver contacto entre as duas contas. */
export const blockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ blocked_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.blocked_id === userId) return { ok: false, error: "Não pode bloquear-se a si próprio" };

    const { error } = await supabase
      .from("user_blocks")
      .upsert(
        { blocker_id: userId, blocked_id: data.blocked_id },
        { onConflict: "blocker_id,blocked_id" },
      );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const unblockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ blocked_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", userId)
      .eq("blocked_id", data.blocked_id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

/** Indica se existe bloqueio em qualquer direcção entre o utilizador actual e outro. */
export const getBlockStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ other_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows } = await supabase
      .from("user_blocks")
      .select("blocker_id, blocked_id")
      .eq("blocker_id", userId)
      .eq("blocked_id", data.other_id);
    return { blocked: (rows ?? []).length > 0 };
  });
