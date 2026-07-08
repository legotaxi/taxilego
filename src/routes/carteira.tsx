import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Smartphone,
  Banknote,
  Loader2,
  X,
  LifeBuoy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getWallet, requestTopup, requestWithdrawal } from "@/lib/wallet.functions";
import { AppShell } from "@/components/lego/AppShell";
import { toast } from "sonner";

export const Route = createFileRoute("/carteira")({
  head: () => ({
    meta: [
      { title: "Carteira Lego · Pagamentos em Kwanzas" },
      {
        name: "description",
        content:
          "Gerencie a sua Carteira Lego, métodos de pagamento Multicaixa Express, Referência e ofertas exclusivas.",
      },
    ],
  }),
  component: WalletPage,
});

const methods = [
  { icon: Smartphone, label: "Multicaixa Express", sub: "Pagamento instantâneo" },
  { icon: Banknote, label: "Referência Multicaixa", sub: "Pague em qualquer ATM" },
];

type Tx = {
  id: string;
  type: string;
  amount: number;
  description: string;
  method: string | null;
  created_at: string;
};

function formatKz(n: number) {
  return new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 0 }).format(Math.abs(n));
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  const isYest = d.toDateString() === yest.toDateString();
  const time = d.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Hoje · ${time}`;
  if (isYest) return `Ontem · ${time}`;
  return d.toLocaleDateString("pt-AO", { day: "2-digit", month: "short" }) + " · " + time;
}

function WalletPage() {
  const navigate = useNavigate();
  const fetchWallet = useServerFn(getWallet);
  const topupFn = useServerFn(requestTopup);
  const withdrawFn = useServerFn(requestWithdrawal);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [showTopup, setShowTopup] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const load = async () => {
    const res = await fetchWallet();
    setBalance(res.balance);
    setTxs(res.transactions);
  };

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/login", search: { redirect: "/carteira" } as never });
        return;
      }
      const authUser = data.session.user;
      try {
        await load();
      } finally {
        if (active) setLoading(false);
      }

      // Realtime: saldo (profiles) + histórico (transactions) sem refresh
      const userId = authUser.id;
      channel = supabase
        .channel(`wallet-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
          () => { load(); },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
          (payload) => {
            const next = (payload.new as { wallet_balance_kz?: number | string | null })
              ?.wallet_balance_kz;
            if (next != null) setBalance(Number(next));
          },
        )
        .subscribe();
    })();
    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <AppShell role="passenger">
      <div className="flex h-full flex-col bg-muted/30">
        <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-background/80 px-5 py-4 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl font-bold tracking-tight">Carteira</h1>
            <Link to="/suporte" className="rounded-full bg-primary/10 p-2 text-primary active:scale-95" title="Suporte">
              <LifeBuoy className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 scrollbar-hide">
          <section className="relative overflow-hidden rounded-3xl bg-foreground p-8 text-background shadow-xl">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/50">
                Saldo Disponível
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                {loading ? (
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                ) : (
                  <>
                    <span className="font-display text-5xl font-black text-primary">
                      {formatKz(balance)}
                    </span>
                    <span className="text-lg font-bold text-primary/70">Kz</span>
                  </>
                )}
              </div>
            </div>
            <div className="relative mt-8 flex gap-3">
              <button
                onClick={() => setShowTopup(true)}
                className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.98]"
              >
                Recarregar
              </button>
              <button
                onClick={() => setShowWithdraw(true)}
                className="flex-1 rounded-2xl bg-background/10 py-3 text-sm font-bold text-background active:scale-[0.98]"
              >
                Transferir
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="px-1 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Métodos
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {methods.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setShowTopup(true)}
                  className="flex flex-col items-center justify-center rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/5 active:scale-95 transition-all"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                    <m.icon className="h-5 w-5" />
                  </div>
                  <span className="text-center text-[10px] font-bold leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Transações
              </h2>
            </div>
            <div className="rounded-3xl border border-border bg-card shadow-sm ring-1 ring-black/5 divide-y divide-border overflow-hidden">
              {loading ? (
                <div className="py-12 text-center">
                  <Loader2 className="inline h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : txs.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Sem transações recentes.
                </div>
              ) : (
                txs.map((t) => {
                  const isIn = t.amount > 0;
                  return (
                    <div key={t.id} className="flex items-center gap-4 p-4 active:bg-muted/50 transition-colors">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isIn ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                        {isIn ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-bold truncate">{t.description}</span>
                          <span className={`font-display text-sm font-black ${isIn ? "text-emerald-600" : "text-foreground"}`}>
                            {isIn ? "+" : "-"}{formatKz(t.amount)}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(t.created_at)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      {showTopup && (
        <TopupDialog
          onClose={() => setShowTopup(false)}
          onSubmit={async (amount, method, ref) => {
            const res = await topupFn({ data: { amount_kz: amount, method, reference_code: ref } });
            if (res.ok) {
              toast.success("Pedido de recarga enviado. Aguarde confirmação.");
              setShowTopup(false);
              load();
            } else {
              toast.error(res.error || "Erro");
            }
          }}
        />
      )}

      {showWithdraw && (
        <WithdrawDialog
          balance={balance}
          onClose={() => setShowWithdraw(false)}
          onSubmit={async (amount, iban, holder) => {
            const res = await withdrawFn({ data: { amount_kz: amount, bank_iban: iban, bank_holder: holder } });
            if (res.ok) {
              toast.success("Pedido de saque enviado. Saldo descontado.");
              setShowWithdraw(false);
              load();
            } else {
              toast.error(res.error || "Erro");
            }
          }}
        />
      )}
    </AppShell>
  );
}

function TopupDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (amount: number, method: "mcx_express" | "reference" | "cash_deposit", ref?: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"mcx_express" | "reference" | "cash_deposit">("mcx_express");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold">Recarregar Carteira</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <label className="block text-xs font-semibold mb-1">Valor (Kz)</label>
        <input
          type="number"
          min="100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-border px-3 py-2.5 mb-3"
          placeholder="Ex: 5000"
        />
        <label className="block text-xs font-semibold mb-1">Método</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as "mcx_express" | "reference" | "cash_deposit")}
          className="w-full rounded-xl border border-border px-3 py-2.5 mb-3 bg-background"
        >
          <option value="mcx_express">Multicaixa Express</option>
          <option value="reference">Referência Multicaixa</option>
          <option value="cash_deposit">Depósito bancário</option>
        </select>
        <label className="block text-xs font-semibold mb-1">Referência / comprovativo (opcional)</label>
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          className="w-full rounded-xl border border-border px-3 py-2.5 mb-4"
          placeholder="Nº de referência ou comprovativo"
        />
        <button
          disabled={busy || !amount}
          onClick={async () => {
            const n = Number(amount);
            if (!n || n < 100) { toast.error("Valor mínimo Kz 100"); return; }
            setBusy(true);
            try { await onSubmit(n, method, ref || undefined); } finally { setBusy(false); }
          }}
          className="w-full rounded-2xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Enviar pedido
        </button>
        <p className="mt-3 text-[11px] text-muted-foreground">
          O saldo será creditado após confirmação pelo nosso operador.
        </p>
      </div>
    </div>
  );
}

function WithdrawDialog({
  balance,
  onClose,
  onSubmit,
}: {
  balance: number;
  onClose: () => void;
  onSubmit: (amount: number, iban: string, holder: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [iban, setIban] = useState("");
  const [holder, setHolder] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold">Transferir para banco</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Saldo disponível: <strong>Kz {formatKz(balance)}</strong>
        </p>
        <label className="block text-xs font-semibold mb-1">Valor (Kz)</label>
        <input
          type="number"
          min="500"
          max={balance}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-border px-3 py-2.5 mb-3"
          placeholder="Mínimo Kz 500"
        />
        <label className="block text-xs font-semibold mb-1">IBAN</label>
        <input
          value={iban}
          onChange={(e) => setIban(e.target.value)}
          className="w-full rounded-xl border border-border px-3 py-2.5 mb-3 font-mono uppercase"
          placeholder="AO06 0000 0000 0000 0000 0000 0"
        />
        <label className="block text-xs font-semibold mb-1">Titular da conta</label>
        <input
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          className="w-full rounded-xl border border-border px-3 py-2.5 mb-4"
          placeholder="Nome completo"
        />
        <button
          disabled={busy || !amount || !iban || !holder}
          onClick={async () => {
            const n = Number(amount);
            if (!n || n < 500) { toast.error("Valor mínimo Kz 500"); return; }
            if (n > balance) { toast.error("Saldo insuficiente"); return; }
            setBusy(true);
            try { await onSubmit(n, iban.trim(), holder.trim()); } finally { setBusy(false); }
          }}
          className="w-full rounded-2xl bg-foreground py-3 font-bold text-background disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Solicitar saque
        </button>
        <p className="mt-3 text-[11px] text-muted-foreground">
          O valor é descontado imediatamente. Em caso de rejeição é devolvido.
        </p>
      </div>
    </div>
  );
}
