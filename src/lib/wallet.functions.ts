import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: txs }] = await Promise.all([
      supabase
        .from("profiles")
        .select("wallet_balance_kz, full_name")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("transactions")
        .select("id, type, amount_kz, description, method, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    // Filtra pagamentos cash — não afectam o saldo, só confundem
    const filtered = (txs ?? []).filter(
      (t) => !(t.type === "ride_payment" && t.method === "cash"),
    );

    return {
      balance: Number(profile?.wallet_balance_kz ?? 0),
      name: profile?.full_name ?? null,
      transactions: filtered.slice(0, 20).map((t) => ({
        id: t.id,
        type: t.type as string,
        amount: Number(t.amount_kz),
        description: t.description ?? "Transacção",
        method: t.method as string | null,
        created_at: t.created_at,
      })),
    };
  });

export const requestTopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        amount_kz: z.number().positive().max(10_000_000),
        method: z.enum(["mcx_express", "reference", "cash_deposit"]),
        reference_code: z.string().max(50).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("request_wallet_topup", {
      _amount_kz: data.amount_kz,
      _method: data.method,
      _reference_code: data.reference_code ?? undefined,
    });
    if (error) return { ok: false, error: error.message };
    return result as { ok: boolean; error?: string; id?: string };
  });

export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        amount_kz: z.number().positive().max(10_000_000),
        bank_iban: z.string().min(5).max(50),
        bank_holder: z.string().min(2).max(100),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("request_wallet_withdrawal", {
      _amount_kz: data.amount_kz,
      _bank_iban: data.bank_iban,
      _bank_holder: data.bank_holder,
    });
    if (error) return { ok: false, error: error.message };
    return result as { ok: boolean; error?: string; id?: string };
  });
