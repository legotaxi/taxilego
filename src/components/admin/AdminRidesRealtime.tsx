import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Clock, DollarSign, User } from "lucide-react";

export default function AdminRidesRealtime() {
  const [rides, setRides] = useState<any[]>([]);

  const { isLoading } = useQuery({
    queryKey: ["admin-rides-realtime"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rides")
        .select("*")
        .in("status", ["requested", "accepted", "arriving", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(50);
      setRides(data || []);
      return data;
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-rides-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
        },
        () => {
          // Refetch on changes
          supabase
            .from("rides")
            .select("*")
            .in("status", ["requested", "accepted", "arriving", "in_progress"])
            .order("created_at", { ascending: false })
            .limit(50)
            .then(({ data }) => setRides(data || []));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statusColors: Record<string, string> = {
    requested: "bg-yellow-100 text-yellow-800",
    accepted: "bg-blue-100 text-blue-800",
    arriving: "bg-purple-100 text-purple-800",
    in_progress: "bg-green-100 text-green-800",
  };

  const statusLabels: Record<string, string> = {
    requested: "À Espera",
    accepted: "Aceite",
    arriving: "A Chegar",
    in_progress: "Em Curso",
  };

  if (isLoading && rides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Corridas em Tempo Real</h1>
        <p className="text-muted-foreground mt-1">
          {rides.length} corrida{rides.length !== 1 ? "s" : ""} ativa{rides.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Rides Table */}
      <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">ID</th>
                <th className="px-6 py-3 text-left font-semibold">Passageiro</th>
                <th className="px-6 py-3 text-left font-semibold">Motorista</th>
                <th className="px-6 py-3 text-left font-semibold">Origem</th>
                <th className="px-6 py-3 text-left font-semibold">Destino</th>
                <th className="px-6 py-3 text-left font-semibold">Tarifa</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Tempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rides.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    Nenhuma corrida ativa no momento
                  </td>
                </tr>
              ) : (
                rides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{ride.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{ride.passenger_id?.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ride.driver_id ? (
                        <span className="font-medium">{ride.driver_id.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate text-xs">{ride.pickup_address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-foreground shrink-0" />
                        <span className="truncate text-xs">{ride.dropoff_address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-semibold">
                        <DollarSign className="h-4 w-4" />
                        {Number(ride.fare_kz).toLocaleString("pt-PT")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[ride.status] || "bg-muted"}`}
                      >
                        {statusLabels[ride.status] || ride.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(ride.created_at).toLocaleTimeString("pt-PT")}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
