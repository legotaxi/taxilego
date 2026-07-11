import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  TrendingUp,
  Users,
  Car,
  DollarSign,
  MapPin,
  Activity,
  Search,
  Bell,
  Settings,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Zap,
  HeadsetIcon,
  Gift,
  FileText,
} from "lucide-react";
import { getAdminStats } from "@/lib/admin.functions";
import { listDriverApplications, updateDriverStatus } from "@/lib/admin.functions";
import AdminPassengers from "@/components/admin/AdminPassengers";
import { useNativeShell } from "@/hooks/use-native-shell";
import { toast } from "sonner";


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin · Lego Taxi" },
      {
        name: "description",
        content:
          "Painel administrativo do Lego Taxi — gestão de motoristas, corridas, finanças e operações em Angola.",
      },
    ],
  }),
  component: AdminPage,
});

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

type DriverApp = {
  id: string;
  status: string;
  license_number: string | null;
  bi_number: string | null;
  rating: number | null;
  total_rides: number;
  created_at: string;
  approved_at: string | null;
  profile: { full_name: string | null; phone: string | null; avatar_url: string | null } | null;
  documents?: {
    bi: string | null;
    license: string | null;
    criminal_record: string | null;
    photo: string | null;
  };
};

const statusLabel: Record<string, string> = {
  requested: "Pendente",
  accepted: "Aceite",
  in_progress: "Em curso",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const driverStatusLabel: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  suspended: "Suspenso",
};

type AdminSection = "overview" | "rides" | "drivers" | "passengers" | "finance" | "support" | "promotions" | "reports";

function isPdf(url: string) {
  const clean = url.split("?")[0].toLowerCase();
  return clean.endsWith(".pdf");
}

function DocThumb({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center gap-1 w-20">
        <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border bg-muted/40 flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground">—</span>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
      </div>
    );
  }
  const pdf = isPdf(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={`Abrir ${label} em tamanho real`}
      className="group flex flex-col items-center gap-1 w-20"
    >
      <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted shadow-sm transition group-hover:ring-2 group-hover:ring-primary">
        {pdf ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-destructive/5 text-destructive">
            <FileText className="h-7 w-7" />
            <span className="mt-1 text-[10px] font-bold">PDF</span>
          </div>
        ) : (
          <img
            src={url}
            alt={label}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </div>
      <span className="text-[10px] font-semibold text-foreground group-hover:text-primary">{label}</span>
    </a>
  );
}

function DocLinks({ d }: { d: DriverApp }) {
  const docs = d.documents;
  const items: Array<[string, string | null]> = [
    ["BI", docs?.bi ?? null],
    ["Carta", docs?.license ?? null],
    ["Criminal", docs?.criminal_record ?? null],
    ["Foto", docs?.photo ?? null],
  ];
  const has = items.some(([, u]) => !!u);
  if (!has) return <span className="text-xs text-muted-foreground">Sem ficheiros enviados</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([label, url]) => (
        <DocThumb key={label} label={label} url={url} />
      ))}
    </div>
  );
}

const navItems: Array<{ id: AdminSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "Visão geral", icon: BarChart3 },
  { id: "rides", label: "Corridas em tempo real", icon: Car },
  { id: "drivers", label: "Motoristas", icon: Users },
  { id: "passengers", label: "Passageiros", icon: Activity },
  { id: "finance", label: "Finanças", icon: DollarSign },
  { id: "support", label: "Suporte", icon: HeadsetIcon },
  { id: "promotions", label: "Promoções", icon: Gift },
  { id: "reports", label: "Relatórios", icon: FileText },
];

function AdminPage() {
  useNativeShell();

  const fetchStats = useServerFn(getAdminStats);
  const fetchDrivers = useServerFn(listDriverApplications);
  const setDriverStatus = useServerFn(updateDriverStatus);
  
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [live, setLive] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentRide[]>([]);
  const [drivers, setDrivers] = useState<DriverApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter drivers based on search query
  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return drivers;
    const query = searchQuery.toLowerCase();
    return drivers.filter(
      (d) =>
        d.profile?.full_name?.toLowerCase().includes(query) ||
        d.profile?.phone?.toLowerCase().includes(query) ||
        d.bi_number?.toLowerCase().includes(query) ||
        d.license_number?.toLowerCase().includes(query) ||
        d.status.toLowerCase().includes(query)
    );
  }, [drivers, searchQuery]);

  // Filter rides based on search query
  const filteredRides = useMemo(() => {
    if (!searchQuery.trim()) return recent;
    const query = searchQuery.toLowerCase();
    return recent.filter(
      (r) =>
        r.pickup_address.toLowerCase().includes(query) ||
        r.dropoff_address.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query) ||
        r.status.toLowerCase().includes(query)
    );
  }, [recent, searchQuery]);

  const loadDrivers = () => {
    fetchDrivers().then((res) => {
      if (res.authorized) setDrivers((res.drivers ?? []) as DriverApp[]);
    });
  };

  useEffect(() => {
    Promise.all([fetchStats(), fetchDrivers()])
      .then(([stats, drv]) => {
        setAuthorized(stats.authorized);
        if (stats.authorized && stats.stats) {
          setLive(stats.stats);
          setRecent((stats.recentRides ?? []) as RecentRide[]);
        }
        if (drv.authorized) setDrivers((drv.drivers ?? []) as DriverApp[]);
      })
      .catch(() => setAuthorized(false))
      .finally(() => setLoading(false));

    // Realtime: refresh admin data as new users/drivers/rides register
    let cancelled = false;
    let channel: any;
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      channel = supabase
        .channel("admin-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, () => {
          if (!cancelled) {
            fetchDrivers().then((r) => r.authorized && setDrivers((r.drivers ?? []) as DriverApp[]));
            fetchStats().then((s) => s.authorized && s.stats && setLive(s.stats));
          }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
          if (!cancelled) fetchStats().then((s) => s.authorized && s.stats && setLive(s.stats));
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, () => {
          if (!cancelled) fetchStats().then((s) => {
            if (s.authorized && s.stats) {
              setLive(s.stats);
              setRecent((s.recentRides ?? []) as RecentRide[]);
            }
          });
        })
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channel) {
        import("@/integrations/supabase/client").then(({ supabase }) => supabase.removeChannel(channel));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDecision = async (driverId: string, status: "approved" | "rejected" | "suspended") => {
    setPendingId(driverId);
    try {
      const res = await setDriverStatus({ data: { driverId, status } });
      if (res.ok) {
        toast.success(
          status === "approved"
            ? "✓ Motorista aprovado com sucesso"
            : status === "rejected"
              ? "✗ Candidatura rejeitada"
              : "⚠ Motorista suspenso",
        );
        loadDrivers();
      } else {
        toast.error(res.error ?? "Erro ao processar ação");
      }
    } finally {
      setPendingId(null);
    }
  };

  if (authorized === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <h2 className="font-display text-lg font-bold text-destructive">Acesso Negado</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            A sua conta não tem o papel <strong>admin</strong>. Peça a um administrador para o atribuir.
          </p>
          <Link to="/" className="text-sm font-semibold text-primary hover:underline">
            Voltar à página inicial →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-foreground text-background md:flex border-r border-background/10">
        <Link to="/" className="flex items-center gap-2 px-6 py-6 border-b border-background/10 hover:bg-background/5 transition">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <span className="font-display text-lg font-black text-primary-foreground">L</span>
          </div>
          <div>
            <div className="font-display font-bold leading-tight">Lego Taxi</div>
            <div className="text-[10px] uppercase tracking-wider text-background/50">
              Admin Console
            </div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveSection(id);
                setSearchQuery("");
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium transition ${
                activeSection === id
                  ? "bg-primary text-primary-foreground"
                  : "text-background/70 hover:bg-background/5 hover:text-background"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {activeSection === id && <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </nav>
        <div className="border-t border-background/10 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Admin</div>
              <div className="text-[11px] text-background/60 truncate">ops@legotaxi.ao</div>
            </div>
            <Settings className="h-4 w-4 text-background/60" />
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-muted px-4 py-2 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder={activeSection === "drivers" ? "Pesquisar motoristas..." : "Pesquisar corridas..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
          </button>
        </header>

        <main className="space-y-6 p-6">
          {/* Page Title */}
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-bold">
              {navItems.find((item) => item.id === activeSection)?.label}
            </h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "A carregar dados…"
                : !authorized
                  ? "Sem permissão de admin"
                  : "Dados ao vivo da base de dados"}
            </p>
          </div>

          {/* Overview Section */}
          {activeSection === "overview" && live && (
            <>
              {/* KPI Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Receita total",
                    value: `Kz ${live.totalRevenueKz.toLocaleString("pt-AO")}`,
                    icon: DollarSign,
                    color: "text-yellow-600",
                  },
                  { label: "Corridas activas", value: String(live.activeRides), icon: Zap, color: "text-yellow-600" },
                  { label: "Motoristas aprovados", value: String(live.onlineDrivers), icon: Users, color: "text-yellow-600" },
                  { label: "Passageiros", value: String(live.totalUsers), icon: Activity, color: "text-yellow-600" },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-2xl border border-border bg-background p-5 shadow-soft hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ${k.color}`}>
                        <k.icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-4 font-display text-2xl font-bold">{k.value}</div>
                    <div className="text-xs text-muted-foreground">{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Summary Cards */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-border bg-background p-6 shadow-soft lg:col-span-2">
                  <h2 className="font-display text-lg font-bold">Resumo de corridas</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <div className="font-display text-3xl font-bold">{live.totalRides}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-bold text-success">
                        {live.completedRides}
                      </div>
                      <div className="text-xs text-muted-foreground">Concluídas</div>
                    </div>
                    <div>
                      <div className="font-display text-3xl font-bold text-primary">{live.activeRides}</div>
                      <div className="text-xs text-muted-foreground">Activas</div>
                    </div>
                  </div>
                  <div className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-success">
                    <TrendingUp className="h-3.5 w-3.5" /> Receita acumulada Kz{" "}
                    {live.totalRevenueKz.toLocaleString("pt-AO")}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-6 shadow-soft">
                  <h2 className="font-display text-lg font-bold">Frota</h2>
                  <p className="text-xs text-muted-foreground">Motoristas registados</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> Total
                      </span>
                      <span className="font-semibold">{live.totalDrivers}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-success" /> Aprovados
                      </span>
                      <span className="font-semibold">{live.onlineDrivers}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Pendentes
                      </span>
                      <span className="font-semibold">
                        {Math.max(0, live.totalDrivers - live.onlineDrivers)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Rides Table */}
              <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-soft">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div>
                    <h2 className="font-display text-lg font-bold">Últimas corridas</h2>
                    <p className="text-xs text-muted-foreground">
                      {recent.length} registos mais recentes
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Categoria</th>
                        <th className="px-6 py-3">Rota</th>
                        <th className="px-6 py-3 text-right">Valor</th>
                        <th className="px-6 py-3">Estado</th>
                        <th className="px-6 py-3">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recent.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                            Sem corridas ainda.
                          </td>
                        </tr>
                      ) : (
                        recent.map((r) => (
                          <tr key={r.id} className="hover:bg-muted/50 transition">
                            <td className="px-6 py-3 font-mono text-xs">{r.id.slice(0, 8)}</td>
                            <td className="px-6 py-3 capitalize font-medium">{r.category}</td>
                            <td className="px-6 py-3 text-muted-foreground text-xs">
                              {r.pickup_address} → {r.dropoff_address}
                            </td>
                            <td className="px-6 py-3 text-right font-display font-bold">
                              Kz {Number(r.fare_kz).toLocaleString("pt-AO")}
                            </td>
                            <td className="px-6 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                  r.status === "completed"
                                    ? "bg-success/20 text-success"
                                    : r.status === "cancelled"
                                      ? "bg-destructive/15 text-destructive"
                                      : "bg-primary/15 text-foreground"
                                }`}
                              >
                                {statusLabel[r.status] ?? r.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-muted-foreground text-xs">
                              {new Date(r.created_at).toLocaleString("pt-PT")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Driver Applications Table */}
              <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-soft">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div>
                    <h2 className="font-display text-lg font-bold">Candidaturas de motoristas</h2>
                    <p className="text-xs text-muted-foreground">
                      {drivers.filter((d) => d.status === "pending").length} pendente(s) ·{" "}
                      {drivers.length} total
                    </p>
                  </div>
                  <button
                    onClick={loadDrivers}
                    className="text-xs font-semibold text-primary hover:underline transition"
                  >
                    Atualizar
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3">Nome</th>
                        <th className="px-6 py-3">Telefone</th>
                        <th className="px-6 py-3">BI</th>
                        <th className="px-6 py-3">Carta</th>
                        <th className="px-6 py-3">Estado</th>
                        <th className="px-6 py-3">Documentos</th>
                        <th className="px-6 py-3">Candidatura</th>
                        <th className="px-6 py-3 text-right">Acções</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {drivers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                            Sem candidaturas.
                          </td>
                        </tr>
                      ) : (
                        drivers.map((d) => (
                          <tr key={d.id} className="hover:bg-muted/50 transition">
                            <td className="px-6 py-3 font-medium">
                              {d.profile?.full_name ?? "—"}
                            </td>
                            <td className="px-6 py-3 text-muted-foreground">
                              {d.profile?.phone ?? "—"}
                            </td>
                            <td className="px-6 py-3 font-mono text-xs">{d.bi_number ?? "—"}</td>
                            <td className="px-6 py-3 font-mono text-xs">
                              {d.license_number ?? "—"}
                            </td>
                            <td className="px-6 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                  d.status === "approved"
                                    ? "bg-success/20 text-success"
                                    : d.status === "rejected"
                                      ? "bg-destructive/15 text-destructive"
                                      : d.status === "suspended"
                                        ? "bg-muted-foreground/15 text-muted-foreground"
                                        : "bg-primary/15 text-foreground"
                                }`}
                              >
                                {driverStatusLabel[d.status]}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <DocLinks d={d} />
                            </td>
                            <td className="px-6 py-3 text-muted-foreground text-xs">
                              {new Date(d.created_at).toLocaleDateString("pt-PT")}
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex justify-end gap-2">
                                {d.status !== "approved" && (
                                  <button
                                    disabled={pendingId === d.id}
                                    onClick={() => handleDecision(d.id, "approved")}
                                    className="rounded-lg bg-success px-3 py-1.5 text-[11px] font-semibold text-success-foreground hover:opacity-90 disabled:opacity-50 transition"
                                  >
                                    Aprovar
                                  </button>
                                )}
                                {d.status !== "rejected" && d.status !== "approved" && (
                                  <button
                                    disabled={pendingId === d.id}
                                    onClick={() => handleDecision(d.id, "rejected")}
                                    className="rounded-lg bg-destructive px-3 py-1.5 text-[11px] font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50 transition"
                                  >
                                    Rejeitar
                                  </button>
                                )}
                                {d.status === "approved" && (
                                  <button
                                    disabled={pendingId === d.id}
                                    onClick={() => handleDecision(d.id, "suspended")}
                                    className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-muted disabled:opacity-50 transition"
                                  >
                                    Suspender
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Rides Section */}
          {activeSection === "rides" && live && (
            <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-soft">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h2 className="font-display text-lg font-bold">Corridas em tempo real</h2>
                  <p className="text-xs text-muted-foreground">
                    {filteredRides.length} corrida(s) encontrada(s)
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Categoria</th>
                      <th className="px-6 py-3">Rota</th>
                      <th className="px-6 py-3 text-right">Valor</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRides.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                          Sem corridas encontradas.
                        </td>
                      </tr>
                    ) : (
                      filteredRides.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/50 transition">
                          <td className="px-6 py-3 font-mono text-xs">{r.id.slice(0, 8)}</td>
                          <td className="px-6 py-3 capitalize font-medium">{r.category}</td>
                          <td className="px-6 py-3 text-muted-foreground text-xs">
                            {r.pickup_address} → {r.dropoff_address}
                          </td>
                          <td className="px-6 py-3 text-right font-display font-bold">
                            Kz {Number(r.fare_kz).toLocaleString("pt-AO")}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                r.status === "completed"
                                  ? "bg-success/20 text-success"
                                  : r.status === "cancelled"
                                    ? "bg-destructive/15 text-destructive"
                                    : "bg-primary/15 text-foreground"
                              }`}
                            >
                              {statusLabel[r.status] ?? r.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-muted-foreground text-xs">
                            {new Date(r.created_at).toLocaleString("pt-PT")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Drivers Section */}
          {activeSection === "drivers" && (
            <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-soft">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h2 className="font-display text-lg font-bold">Gestão de motoristas</h2>
                  <p className="text-xs text-muted-foreground">
                    {filteredDrivers.length} motorista(s) encontrado(s)
                  </p>
                </div>
                <button
                  onClick={loadDrivers}
                  className="text-xs font-semibold text-primary hover:underline transition"
                >
                  Atualizar
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3">Nome</th>
                      <th className="px-6 py-3">Telefone</th>
                      <th className="px-6 py-3">BI</th>
                      <th className="px-6 py-3">Carta</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Corridas</th>
                      <th className="px-6 py-3">Avaliação</th>
                      <th className="px-6 py-3">Documentos</th>
                      <th className="px-6 py-3 text-right">Acções</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDrivers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                          Sem motoristas encontrados.
                        </td>
                      </tr>
                    ) : (
                      filteredDrivers.map((d) => (
                        <tr key={d.id} className="hover:bg-muted/50 transition">
                          <td className="px-6 py-3 font-medium">
                            {d.profile?.full_name ?? "—"}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {d.profile?.phone ?? "—"}
                          </td>
                          <td className="px-6 py-3 font-mono text-xs">{d.bi_number ?? "—"}</td>
                          <td className="px-6 py-3 font-mono text-xs">
                            {d.license_number ?? "—"}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                d.status === "approved"
                                  ? "bg-success/20 text-success"
                                  : d.status === "rejected"
                                    ? "bg-destructive/15 text-destructive"
                                    : d.status === "suspended"
                                      ? "bg-muted-foreground/15 text-muted-foreground"
                                      : "bg-primary/15 text-foreground"
                              }`}
                            >
                              {driverStatusLabel[d.status]}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-semibold">{d.total_rides}</td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-1">
                              ⭐ {(d.rating ?? 0).toFixed(1)}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <DocLinks d={d} />
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex justify-end gap-2">
                              {d.status !== "approved" && (
                                <button
                                  disabled={pendingId === d.id}
                                  onClick={() => handleDecision(d.id, "approved")}
                                  className="rounded-lg bg-success px-3 py-1.5 text-[11px] font-semibold text-success-foreground hover:opacity-90 disabled:opacity-50 transition"
                                >
                                  Aprovar
                                </button>
                              )}
                              {d.status !== "rejected" && d.status !== "approved" && (
                                <button
                                  disabled={pendingId === d.id}
                                  onClick={() => handleDecision(d.id, "rejected")}
                                  className="rounded-lg bg-destructive px-3 py-1.5 text-[11px] font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50 transition"
                                >
                                  Rejeitar
                                </button>
                              )}
                              {d.status === "approved" && (
                                <button
                                  disabled={pendingId === d.id}
                                  onClick={() => handleDecision(d.id, "suspended")}
                                  className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-muted disabled:opacity-50 transition"
                                >
                                  Suspender
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === "passengers" && <AdminPassengers />}

          {/* Placeholder Sections */}
          {["finance", "support", "promotions", "reports"].includes(activeSection) && (
            <div className="rounded-2xl border border-border bg-background p-12 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                {activeSection === "finance" && <DollarSign className="h-8 w-8 text-muted-foreground" />}
                {activeSection === "support" && <HeadsetIcon className="h-8 w-8 text-muted-foreground" />}
                {activeSection === "promotions" && <Gift className="h-8 w-8 text-muted-foreground" />}
                {activeSection === "reports" && <FileText className="h-8 w-8 text-muted-foreground" />}
              </div>
              <h3 className="font-display text-lg font-bold mb-2">
                {navItems.find((item) => item.id === activeSection)?.label}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Esta secção será implementada em breve. Volte mais tarde para mais funcionalidades.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
