import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, DollarSign, Wallet, ArrowDownLeft, ArrowUpRight, Gift } from "lucide-react";

type TxRow = {
  id: string;
  user_id: string;
  ride_id: string | null;
  type: string;
  amount_kz: number;
  description: string | null;
  method: string | null;
  created_at: string;
  profile?: { full_name: string | null; phone: string | null } | null;
};

export default function AdminFinance() {
  const { data: financials, isLoading } = useQuery({
    queryKey: ["admin-finance"],
    queryFn: async () => {
      const { data: rides } = await supabase
        .from("rides")
        .select("fare_kz, cashback_kz, status, category, paid_at")
        .eq("status", "completed");

      const totalRevenue = (rides || []).reduce((s, r) => s + Number(r.fare_kz || 0), 0);
      const totalCashback = (rides || []).reduce((s, r) => s + Number(r.cashback_kz || 0), 0);
      const paidRides = (rides || []).filter((r) => r.paid_at).length;
      const byCategory = (rides || []).reduce(
        (acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + Number(r.fare_kz || 0);
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        totalRevenue,
        totalCashback,
        paidRides,
        byCategory,
        totalRides: rides?.length || 0,
      };
    },
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async (): Promise<TxRow[]> => {
      const { data: txs, error } = await supabase
        .from("transactions")
        .select("id, user_id, ride_id, type, amount_kz, description, method, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error || !txs) return [];
      const userIds = Array.from(new Set(txs.map((t) => t.user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", userIds);
      const map = new Map(
        (profiles ?? []).map((p) => [p.id, { full_name: p.full_name, phone: p.phone }]),
      );
      return txs.map((t) => ({ ...t, profile: map.get(t.user_id) ?? null })) as TxRow[];
    },
    refetchInterval: 8000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const typeMeta: Record<string, { label: string; icon: typeof Gift; color: string }> = {
    ride_payment: { label: "Pagamento", icon: ArrowDownLeft, color: "text-red-600 bg-red-50" },
    ride_earning: { label: "Ganho", icon: ArrowUpRight, color: "text-emerald-600 bg-emerald-50" },
    bonus: { label: "Cashback 10%", icon: Gift, color: "text-purple-600 bg-purple-50" },
    topup: { label: "Recarga", icon: ArrowUpRight, color: "text-blue-600 bg-blue-50" },
    withdrawal: { label: "Levantamento", icon: ArrowDownLeft, color: "text-orange-600 bg-orange-50" },
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finanças</h1>
        <p className="text-muted-foreground mt-1">Receitas, cashback e todas as transações</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Receita Total</p>
              <p className="text-2xl font-bold mt-2">
                Kz {(financials?.totalRevenue || 0).toLocaleString("pt-PT")}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Cashback Pago</p>
              <p className="text-2xl font-bold mt-2">
                Kz {(financials?.totalCashback || 0).toLocaleString("pt-PT")}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-100 text-purple-600">
              <Gift className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Corridas Pagas</p>
              <p className="text-2xl font-bold mt-2">
                {financials?.paidRides || 0} / {financials?.totalRides || 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Ticket Médio</p>
              <p className="text-2xl font-bold mt-2">
                Kz{" "}
                {(
                  (financials?.totalRevenue || 0) / Math.max(financials?.totalRides || 1, 1)
                ).toLocaleString("pt-PT", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4">Receita por Categoria</h2>
        <div className="space-y-4">
          {Object.entries(financials?.byCategory || {}).map(([category, amount]) => (
            <div key={category}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium capitalize">{category}</span>
                <span className="font-bold">Kz {Number(amount).toLocaleString("pt-PT")}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${((Number(amount) / (financials?.totalRevenue || 1)) * 100).toFixed(0)}%`,
                  }}
                />
              </div>
            </div>
          ))}
          {Object.keys(financials?.byCategory || {}).length === 0 && (
            <p className="text-sm text-muted-foreground">Ainda sem corridas concluídas.</p>
          )}
        </div>
      </div>

      {/* All Transactions */}
      <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold">Todas as Transações</h2>
          <span className="text-xs text-muted-foreground">
            {txData?.length ?? 0} registos · actualiza a cada 8s
          </span>
        </div>
        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {txLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Loader2 className="inline h-4 w-4 animate-spin mr-2" /> A carregar transações…
            </div>
          ) : (txData ?? []).length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Sem transações ainda.
            </div>
          ) : (
            (txData ?? []).map((t) => {
              const meta = typeMeta[t.type] ?? {
                label: t.type,
                icon: Wallet,
                color: "text-muted-foreground bg-muted",
              };
              const Icon = meta.icon;
              const positive = Number(t.amount_kz) >= 0;
              return (
                <div key={t.id} className="px-6 py-3 flex items-center gap-4 hover:bg-muted/40">
                  <div className={`p-2 rounded-lg ${meta.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span>{meta.label}</span>
                      {t.method && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {t.method}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t.profile?.full_name ?? "—"}
                      {t.profile?.phone ? ` · ${t.profile.phone}` : ""}
                      {t.description ? ` · ${t.description}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${positive ? "text-emerald-600" : "text-red-600"}`}>
                      {positive ? "+" : ""}
                      Kz {Number(t.amount_kz).toLocaleString("pt-PT")}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(t.created_at).toLocaleString("pt-PT")}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
