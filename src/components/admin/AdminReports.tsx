import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Download, Loader2, TrendingUp } from "lucide-react";
import { getAdminStats } from "@/lib/admin.functions";

type Stats = {
  totalRides: number;
  completedRides: number;
  activeRides: number;
  totalDrivers: number;
  onlineDrivers: number;
  totalUsers: number;
  totalRevenueKz: number;
};

type RecentRide = {
  id: string;
  status: string;
  category: string;
  fare_kz: number;
  pickup_address: string;
  dropoff_address: string;
  created_at: string;
};

function toCsv(rides: RecentRide[]) {
  const header = "id,data,categoria,estado,recolha,destino,valor_kz\n";
  const rows = rides
    .map(
      (r) =>
        `${r.id},${r.created_at},${r.category},${r.status},"${r.pickup_address.replace(/"/g, '""')}","${r.dropoff_address.replace(/"/g, '""')}",${r.fare_kz}`,
    )
    .join("\n");
  return header + rows;
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const fetchStats = useServerFn(getAdminStats);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentRide[]>([]);

  useEffect(() => {
    fetchStats()
      .then((res) => {
        if (res.authorized && res.stats) {
          setStats(res.stats);
          setRecent((res.recentRides ?? []) as RecentRide[]);
        }
      })
      .finally(() => setLoading(false));
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return <div className="p-6 text-sm text-muted-foreground">Sem permissão para ver relatórios.</div>;
  }

  const completionRate = stats.totalRides
    ? ((stats.completedRides / stats.totalRides) * 100).toFixed(1)
    : "0";
  const avgFare = stats.completedRides
    ? Math.round(stats.totalRevenueKz / stats.completedRides)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Métricas reais da plataforma</p>
        </div>
        <button
          onClick={() => download(`corridas-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(recent))}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
        >
          <Download className="h-4 w-4" /> Exportar últimas {recent.length}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Métricas Principais</h2>
          <div className="space-y-3">
            <Row label="Taxa de Conclusão" value={`${completionRate}%`} />
            <Row label="Corridas Totais" value={stats.totalRides.toLocaleString("pt-AO")} />
            <Row label="Corridas Concluídas" value={stats.completedRides.toLocaleString("pt-AO")} />
            <Row label="Corridas Activas" value={stats.activeRides.toLocaleString("pt-AO")} />
            <Row label="Valor Médio" value={`Kz ${avgFare.toLocaleString("pt-AO")}`} />
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Operação</h2>
          <div className="space-y-3">
            <Row label="Receita Total" value={`Kz ${stats.totalRevenueKz.toLocaleString("pt-AO")}`} accent />
            <Row label="Motoristas Aprovados" value={stats.onlineDrivers.toLocaleString("pt-AO")} />
            <Row label="Motoristas Totais" value={stats.totalDrivers.toLocaleString("pt-AO")} />
            <Row label="Utilizadores" value={stats.totalUsers.toLocaleString("pt-AO")} />
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" /> Dados ao vivo da base de dados
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold">Últimas Corridas</h2>
          <span className="text-xs text-muted-foreground">{recent.length} registos</span>
        </div>
        <div className="divide-y divide-border">
          {recent.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">Sem corridas recentes</div>
          ) : (
            recent.map((r) => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between hover:bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.pickup_address} → {r.dropoff_address}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-AO")} · {r.category} · {r.status}
                    </div>
                  </div>
                </div>
                <div className="font-display font-bold text-sm shrink-0 ml-3">
                  Kz {Number(r.fare_kz).toLocaleString("pt-AO")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-bold ${accent ? "text-emerald-600" : ""}`}>{value}</span>
    </div>
  );
}
