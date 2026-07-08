import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, Calendar, Wallet } from "lucide-react";

export default function AdminPassengers() {
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel("admin-passengers-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-passengers"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);
  const { data: passengers, isLoading } = useQuery({
    queryKey: ["admin-passengers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

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
        <h1 className="text-3xl font-bold tracking-tight">Passageiros</h1>
        <p className="text-muted-foreground mt-1">{passengers?.length || 0} passageiros no total</p>
      </div>

      {/* Passengers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {passengers?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Nenhum passageiro registado
          </div>
        ) : (
          passengers?.map((passenger: any) => (
            <div
              key={passenger.id}
              className="rounded-2xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground">
                  {(passenger.full_name || passenger.phone || "?").charAt(0).toUpperCase()}
                </div>
              </div>
              <h3 className="font-bold text-lg">{passenger.full_name || "Sem nome"}</h3>
              <div className="space-y-2 mt-4 text-sm">
                {passenger.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{passenger.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(passenger.created_at).toLocaleDateString("pt-PT")}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Saldo: <span className="font-bold">Kz {Number(passenger.wallet_balance_kz || 0).toLocaleString("pt-PT")}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
