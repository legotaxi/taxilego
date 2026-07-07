import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        subject: z.string().min(3).max(200),
        message: z.string().min(5).max(2000),
        category: z.string().max(50).default("general"),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: t, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: userId,
        subject: data.subject,
        message: data.message,
        category: data.category,
        priority: data.priority,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: t.id };
  });

export const getMyTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, subject, message, category, priority, status, created_at, resolved_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) return { tickets: [], error: error.message };
    return { tickets: data ?? [], error: null };
  });

export const listAllTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return { authorized: false, tickets: [] };

    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, user_id, subject, message, category, priority, status, created_at, resolved_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return { authorized: true, tickets: [], error: error.message };

    const ids = Array.from(new Set((data ?? []).map((t) => t.user_id)));
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id, full_name, phone").in("id", ids)
      : { data: [] as Array<{ id: string; full_name: string | null; phone: string | null }> };
    const map = new Map((profs ?? []).map((p) => [p.id, p]));

    return {
      authorized: true,
      tickets: (data ?? []).map((t) => ({
        ...t,
        profile: map.get(t.user_id) ?? null,
      })),
    };
  });

export const updateTicketStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return { ok: false, error: "Sem permissão" };

    const patch: { status: typeof data.status; resolved_at?: string | null } = { status: data.status };
    if (data.status === "resolved" || data.status === "closed") {
      patch.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase.from("support_tickets").update(patch).eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
