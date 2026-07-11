import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, MapPin, DollarSign, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [ridesRes, driversRes, passengersRes, revenueRes] = await Promise.all([
        supabase.from("rides").select("id, status", { count: "exact", head: false }).limit(1),
        supabase.from("drivers").select("id, status", { count: "exact", head: false }).limit(1),
        supabase.from("profiles").select("id", { count: "exact", head: false }).limit(1),
        supabase.from("rides").select("fare_kz").eq("status", "completed"),
      ]);

      const totalRides = ridesRes.count || 0;
      const activeRides =
        (await supabase
          .from("rides")
          .select("id", { count: "exact", head: false })
          .in("status", ["requested", "accepted", "arriving", "in_progress"])).count || 0;

      const totalDrivers = driversRes.count || 0;
      const approvedDrivers =
        (await supabase
          .from("drivers")
          .select("id", { count: "exact", head: false })
          .eq("status", "approved")).count || 0;

      const totalPassengers = passengersRes.count || 0;

      const totalRevenue = (revenueRes.data || []).reduce(
        (sum, ride) => sum + (Number(ride.fare_kz) || 0),
        0,
      );

      return {
        totalRides,
        activeRides,
        totalDrivers,
        approvedDrivers,
        totalPassengers,
        totalRevenue,
      };
    },
  });

  const kpis = [
    {
      label: "Total de Corridas",
      value: stats?.totalRides || 0,
      icon: MapPin,
      color: "bg-yellow-100 text-yellow-600",
      trend: "+12%",
    },
    {
      label: "Corridas Ativas",
      value: stats?.activeRides || 0,
      icon: TrendingUp,
      color: "bg-yellow-100 text-yellow-600",
      trend: "+8%",
    },
    {
      label: "Motoristas Aprovados",
      value: stats?.approvedDrivers || 0,
      icon: Users,
      color: "bg-yellow-100 text-yellow-600",
      trend: "+5%",
    },
    {
      label: "Total de Passageiros",
      value: stats?.totalPassengers || 0,
      icon: Users,
      color: "bg-yellow-100 text-yellow-600",
      trend: "+15%",
    },
    {
      label: "Receita Total",
      value: `Kz ${(stats?.totalRevenue || 0).toLocaleString("pt-PT")}`,
      icon: DollarSign,
      color: "bg-yellow-100 text-yellow-600",
      trend: "+22%",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground mt-1">Bem-vindo ao painel de administração Lego Taxi</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-2">{kpi.value}</p>
                  <p className="text-xs text-yellow-600 font-semibold mt-2">{kpi.trend}</p>
                </div>
                <div className={`p-3 rounded-lg ${kpi.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Corridas por Dia */}
        <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Corridas por Dia</h2>
          <div className="h-64 flex items-end justify-around gap-2 bg-muted/30 rounded-lg p-4">
            {[65, 78, 90, 81, 56, 55, 40, 72, 68, 85, 90, 88].map((value, idx) => (
              <div
                key={idx}
                className="flex-1 bg-primary rounded-t hover:opacity-80 transition-opacity"
                style={{ height: `${(value / 100) * 100}%` }}
                title={`Dia ${idx + 1}: ${value} corridas`}
              />
            ))}
          </div>
        </div>

        {/* Receita por Categoria */}
        <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Receita por Categoria</h2>
          <div className="space-y-3">
            {[
              { name: "MotoTáxi", value: 35, color: "bg-yellow-500" },
              { name: "Táxi Normal", value: 40, color: "bg-yellow-500" },
              { name: "Táxi XL", value: 15, color: "bg-yellow-500" },
              { name: "Premium", value: 10, color: "bg-yellow-500" },
            ].map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">{cat.value}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.color} rounded-full`}
                    style={{ width: `${cat.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4">Atividade Recente</h2>
        <div className="space-y-3">
          {[
            { action: "Nova corrida solicitada", time: "Há 2 minutos", status: "info" },
            { action: "Motorista aprovado", time: "Há 15 minutos", status: "success" },
            { action: "Corrida concluída", time: "Há 28 minutos", status: "success" },
            { action: "Suporte - Nova mensagem", time: "Há 45 minutos", status: "warning" },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-sm">{activity.action}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              <div
                className={`h-2 w-2 rounded-full ${
                  activity.status === "success"
                    ? "bg-yellow-500"
                    : activity.status === "warning"
                      ? "bg-yellow-500"
                      : "bg-yellow-500"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
