import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageSquare, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { listAllTickets, updateTicketStatus } from "@/lib/support.functions";
import { toast } from "sonner";

type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  resolved_at: string | null;
  profile: { full_name: string | null; phone: string | null } | null;
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-yellow-100 text-yellow-800",
  closed: "bg-gray-200 text-gray-700",
};

const priorityColors: Record<string, string> = {
  high: "text-yellow-600",
  medium: "text-yellow-600",
  low: "text-yellow-600",
};

const statusLabels: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em Progresso",
  resolved: "Resolvido",
  closed: "Fechado",
};

export default function AdminSupport() {
  const fetchTickets = useServerFn(listAllTickets);
  const setStatus = useServerFn(updateTicketStatus);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    fetchTickets().then((res) => {
      if (res.authorized) setTickets((res.tickets ?? []) as Ticket[]);
    });
  };

  useEffect(() => {
    fetchTickets()
      .then((res) => {
        if (res.authorized) setTickets((res.tickets ?? []) as Ticket[]);
      })
      .finally(() => setLoading(false));
  }, [fetchTickets]);

  const handleStatus = async (id: string, status: Ticket["status"]) => {
    setBusy(id);
    try {
      const res = await setStatus({ data: { id, status } });
      if (res.ok) {
        toast.success("Ticket actualizado");
        load();
      } else {
        toast.error(res.error || "Erro");
      }
    } finally {
      setBusy(null);
    }
  };

  const open = tickets.filter((t) => t.status === "open").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suporte</h1>
        <p className="text-muted-foreground mt-1">Tickets reais dos utilizadores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Tickets Abertos" value={open} icon={AlertCircle} color="bg-yellow-100 text-yellow-600" />
        <StatCard label="Em Progresso" value={inProgress} icon={Clock} color="bg-yellow-100 text-yellow-600" />
        <StatCard label="Resolvidos" value={resolved} icon={CheckCircle} color="bg-yellow-100 text-yellow-600" />
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Sem tickets de suporte
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Assunto</th>
                  <th className="px-4 py-3 text-left font-semibold">Utilizador</th>
                  <th className="px-4 py-3 text-left font-semibold">Prioridade</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Data</th>
                  <th className="px-4 py-3 text-right font-semibold">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 align-top">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-medium truncate">{t.subject}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {t.message}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{t.profile?.full_name ?? "—"}</div>
                      <div className="text-[10px] text-muted-foreground">{t.profile?.phone ?? ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold text-xs ${priorityColors[t.priority]}`}>
                        {t.priority === "high" ? "Alta" : t.priority === "medium" ? "Média" : "Baixa"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[t.status]}`}>
                        {statusLabels[t.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString("pt-AO")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={t.status}
                        disabled={busy === t.id}
                        onChange={(e) => handleStatus(t.id, e.target.value as Ticket["status"])}
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="open">Aberto</option>
                        <option value="in_progress">Em Progresso</option>
                        <option value="resolved">Resolvido</option>
                        <option value="closed">Fechado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof MessageSquare;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
