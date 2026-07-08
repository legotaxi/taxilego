import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, LifeBuoy, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createSupportTicket, getMyTickets } from "@/lib/support.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte · Lego Taxi" },
      { name: "description", content: "Abra um pedido de suporte para a equipa Lego Taxi." },
    ],
  }),
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: SupportPage,
});

type Ticket = {
  id: string;
  subject: string;
  message: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  resolved_at: string | null;
};

const statusLabel: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em análise",
  resolved: "Resolvido",
  closed: "Fechado",
};

const statusColor: Record<string, string> = {
  open: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-gray-200 text-gray-700",
};

function SupportPage() {
  const createTicket = useServerFn(createSupportTicket);
  const fetchMine = useServerFn(getMyTickets);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [busy, setBusy] = useState(false);

  const load = () => fetchMine().then((r) => setTickets((r.tickets ?? []) as Ticket[]));

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Preencha o assunto e a mensagem");
      return;
    }
    setBusy(true);
    try {
      const res = await createTicket({
        data: { subject: subject.trim(), message: message.trim(), category, priority },
      });
      if (res.ok) {
        toast.success("Ticket enviado. A nossa equipa irá responder em breve.");
        setSubject("");
        setMessage("");
        load();
      } else {
        toast.error(res.error || "Erro ao enviar");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3">
        <Link to="/carteira" className="p-2 -ml-2"><ArrowLeft className="h-5 w-5" /></Link>
        <LifeBuoy className="h-5 w-5 text-primary" />
        <h1 className="font-display text-lg font-bold">Suporte</h1>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <section className="rounded-2xl bg-card border border-border p-5 shadow-sm">
          <h2 className="font-display text-base font-bold mb-3">Abrir novo pedido</h2>
          <div className="space-y-3">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto"
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-border px-3 py-2.5 text-sm bg-background"
              >
                <option value="general">Geral</option>
                <option value="payment">Pagamento</option>
                <option value="ride">Corrida</option>
                <option value="driver">Motorista</option>
                <option value="account">Conta</option>
              </select>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="rounded-xl border border-border px-3 py-2.5 text-sm bg-background"
              >
                <option value="low">Prioridade baixa</option>
                <option value="medium">Prioridade média</option>
                <option value="high">Prioridade alta</option>
              </select>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Descreva o seu problema com detalhe…"
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm resize-none"
            />
            <button
              disabled={busy}
              onClick={submit}
              className="w-full rounded-2xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar pedido
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="px-1 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Meus pedidos
          </h2>
          {loading ? (
            <div className="rounded-2xl bg-card border border-border p-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-8 text-center text-sm text-muted-foreground">
              Ainda não abriu nenhum pedido.
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <div key={t.id} className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{t.subject}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.message}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor[t.status]}`}>
                      {statusLabel[t.status]}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    {new Date(t.created_at).toLocaleString("pt-AO")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
