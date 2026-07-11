import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Clock, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminDrivers() {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const { data: drivers, isLoading, refetch } = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("drivers")
        .select("*, profiles(*)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const handleApproveDriver = async (driverId: string) => {
    try {
      const { error } = await supabase
        .from("drivers")
        .update({ status: "approved" })
        .eq("id", driverId);

      if (error) throw error;
      toast.success("Motorista aprovado com sucesso");
      refetch();
    } catch (error) {
      console.error("Erro ao aprovar motorista:", error);
      toast.error("Erro ao aprovar motorista");
    }
  };

  const handleRejectDriver = async (driverId: string) => {
    try {
      const { error } = await supabase
        .from("drivers")
        .update({ status: "rejected" })
        .eq("id", driverId);

      if (error) throw error;
      toast.success("Motorista rejeitado");
      refetch();
    } catch (error) {
      console.error("Erro ao rejeitar motorista:", error);
      toast.error("Erro ao rejeitar motorista");
    }
  };

  const handleSuspendDriver = async (driverId: string) => {
    try {
      const { error } = await supabase
        .from("drivers")
        .update({ status: "suspended" })
        .eq("id", driverId);

      if (error) throw error;
      toast.success("Motorista suspenso");
      refetch();
    } catch (error) {
      console.error("Erro ao suspender motorista:", error);
      toast.error("Erro ao suspender motorista");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-yellow-100 text-yellow-800",
    rejected: "bg-yellow-100 text-yellow-800",
    suspended: "bg-yellow-100 text-yellow-800",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
    suspended: "Suspenso",
  };

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
        <h1 className="text-3xl font-bold tracking-tight">Motoristas</h1>
        <p className="text-muted-foreground mt-1">{drivers?.length || 0} motoristas no total</p>
      </div>

      {/* Drivers Table */}
      <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Nome</th>
                <th className="px-6 py-3 text-left font-semibold">Telefone</th>
                <th className="px-6 py-3 text-left font-semibold">Rating</th>
                <th className="px-6 py-3 text-left font-semibold">Corridas</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drivers?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Nenhum motorista registado
                  </td>
                </tr>
              ) : (
                drivers?.map((driver: any) => (
                  <tr key={driver.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{driver.profiles?.full_name || "—"}</td>
                    <td className="px-6 py-4 text-xs font-mono">{driver.phone || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{driver.rating?.toFixed(1) || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{driver.total_rides || 0}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[driver.status] || "bg-muted"}`}
                      >
                        {statusLabels[driver.status] || driver.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {driver.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApproveDriver(driver.id)}
                              className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                              title="Aprovar"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectDriver(driver.id)}
                              className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                              title="Rejeitar"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {driver.status === "approved" && (
                          <button
                            onClick={() => handleSuspendDriver(driver.id)}
                            className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                            title="Suspender"
                          >
                            <Clock className="h-4 w-4" />
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
    </div>
  );
}
