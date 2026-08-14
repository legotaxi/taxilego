import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  Loader2,
  CheckCircle2,
  PlayCircle,
  XCircle,
  RefreshCw,
  Navigation2,
  MessageCircle,
} from "lucide-react";
import { SOSButton } from "@/components/lego/SOSButton";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
import {
  getPendingRides,
  getMyRides as getMyDriverRides,
  acceptRide,
  updateRideStatus,
} from "@/lib/driver.functions";

import { DriverMapView } from "@/components/lego/DriverMapView";
import { DriverStatusGuard } from "@/components/lego/DriverStatusGuard";
import { useAuth } from "@/hooks/use-auth";
import { useRideNotifications, type RideNotification } from "@/hooks/use-ride-notifications";
import { IncomingRideCall } from "@/components/lego/IncomingRideCall";
import { toast } from "sonner";
import { AppShell } from "@/components/lego/AppShell";
import { BottomSheet } from "@/components/lego/BottomSheet";
import { RideChat } from "@/components/lego/RideChat";
import { RideCompletionDialog } from "@/components/lego/RideCompletionDialog";
import { VoipCallControl } from "@/components/lego/VoipCallControl";
import { NotificationPrompt } from "@/components/lego/NotificationPrompt";

function DriverPanel() {
  return (
    <DriverStatusGuard requiredStatus="approved">
      <DriverPanelContent />
    </DriverStatusGuard>
  );
}

export const Route = createFileRoute("/painel-motorista")({
  head: () => ({
    meta: [
      { title: "Painel do Motorista · Lego Taxi" },
      {
        name: "description",
        content: "Aceita corridas, gere ganhos em Kwanzas e acompanha pedidos em tempo real.",
      },
    ],
  }),
  component: DriverPanel,
});

type Ride = {
  id: string;
  passenger_id?: string;
  category: string;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_address: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  fare_kz: number;
  distance_km: number | null;
  duration_min: number | null;
  status: string;
  payment_method?: string;
  paid_at?: string | null;
  cashback_kz?: number;
  created_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  moto: "MotoTáxi",
  normal: "Normal",
  xl: "XL",
  premium: "Premium",
  shared: "Partilhada",
  delivery: "Entrega",
};

const STATUS_LABELS: Record<string, string> = {
  requested: "À Procura de Motorista",
  accepted: "Motorista Encontrado",
  arriving: "Motorista a Chegar",
  in_progress: "Viagem em Curso",
  completed: "Viagem Concluída",
  cancelled: "Viagem Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  arriving: "bg-indigo-100 text-indigo-800",
  in_progress: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

function DriverPanelContent() {
  const { user } = useAuth();
  const fetchRides = useServerFn(getPendingRides);
  const fetchMine = useServerFn(getMyDriverRides);
  const acceptFn = useServerFn(acceptRide);
  const updateFn = useServerFn(updateRideStatus);

  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const [activeRides, setActiveRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<RideNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<RideNotification | null>(null);
  const [chatRide, setChatRide] = useState<Ride | null>(null);
  const [completionRide, setCompletionRide] = useState<Ride | null>(null);
  const [passengerNames, setPassengerNames] = useState<Record<string, string>>({});
  const [driverCategories, setDriverCategories] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(false);

  // Carregar a(s) categoria(s) e o status online do motorista
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [vRes, dRes] = await Promise.all([
        supabaseClient.from("vehicles").select("category").eq("owner_id", user.id).maybeSingle(),
        supabaseClient.from("drivers").select("is_online").eq("id", user.id).maybeSingle(),
      ]);
      if (vRes.data?.category) setDriverCategories([vRes.data.category]);
      if (dRes.data) setIsOnline(dRes.data.is_online);
    })();
  }, [user]);

  const { clearNotification } = useRideNotifications(
    (ride) => {
      setNotificationQueue((prev) => [ride, ...prev]);
      if (!currentNotification) {
        setCurrentNotification(ride);
      }
    },
    () => {
      load();
    },
    { allowedCategories: driverCategories, isOnline },
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendRes, mineRes] = await Promise.all([fetchRides(), fetchMine()]);
      setPendingRides(pendRes.rides as Ride[]);
      setActiveRides(mineRes.rides as Ride[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fetchRides, fetchMine]);

  const handleAcceptNotification = useCallback(
    async (rideId: string) => {
      if (!user) return;
      setBusy(rideId);
      try {
        const res = await acceptFn({ data: { id: rideId } });
        if (res.ok) {
          toast.success("Corrida aceite! Dirija-se ao passageiro.");
          clearNotification(rideId);
          setCurrentNotification(null);
          // Mostrar próxima notificação se houver
          setNotificationQueue((prev) => {
            const remaining = prev.filter((r) => r.id !== rideId);
            if (remaining.length > 0) {
              setCurrentNotification(remaining[0]);
            }
            return remaining;
          });
          await load();
        } else {
          toast.error(res.error ?? "Erro ao aceitar corrida");
        }
      } catch (e) {
        toast.error("Erro inesperado");
        console.error(e);
      } finally {
        setBusy(null);
      }
    },
    [user, acceptFn, load, clearNotification],
  );

  const handleDismissNotification = useCallback(
    (rideId: string) => {
      clearNotification(rideId);
      setNotificationQueue((prev) => {
        const remaining = prev.filter((r) => r.id !== rideId);
        if (remaining.length > 0) {
          setCurrentNotification(remaining[0]);
        } else {
          setCurrentNotification(null);
        }
        return remaining;
      });
    },
    [clearNotification],
  );

  const handleAccept = async (id: string) => {
    if (!user) return;
    setBusy(id);
    try {
      const res = await acceptFn({ data: { id } });
      if (res.ok) {
        toast.success("Corrida aceite! Dirija-se ao passageiro.");
        await load();
      } else {
        toast.error(res.error ?? "Erro ao aceitar corrida");
      }
    } catch (e) {
      toast.error("Erro inesperado");
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const handleArriving = async (id: string) => {
    setBusy(id);
    try {
      const res = await updateFn({ data: { id, status: "arriving" } });
      if (res.ok) {
        toast.success("Chegou ao local de partida!");
        await load();
      } else {
        toast.error(res.error ?? "Erro ao atualizar status");
      }
    } catch (e) {
      toast.error("Erro inesperado");
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const handleStartRide = async (id: string) => {
    if (!user) return;
    setBusy(id);
    try {
      const res = await updateFn({ data: { id, status: "in_progress" } });
      if (res.ok) {
        toast.success("Corrida iniciada!");
        await load();
      } else {
        toast.error(res.error ?? "Erro ao iniciar corrida");
      }
    } catch (e) {
      toast.error("Erro inesperado");
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const handleCompleteRide = async (id: string) => {
    if (!user) return;
    setBusy(id);
    try {
      const ride = activeRides.find((r) => r.id === id) ?? null;
      const res = await updateFn({ data: { id, status: "completed" } });
      if (res.ok) {
        toast.success("Corrida concluída! Obrigado.");
        if (ride) setCompletionRide({ ...ride, status: "completed" });
        await load();
      } else {
        toast.error(res.error ?? "Erro ao concluir corrida");
      }
    } catch (e) {
      toast.error("Erro inesperado");
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const handleCancelRide = async (id: string) => {
    if (!user) return;
    setBusy(id);
    try {
      const res = await updateFn({ data: { id, status: "cancelled" } });
      if (res.ok) {
        toast.success("Corrida cancelada.");
        await load();
      } else {
        toast.error(res.error ?? "Erro ao cancelar corrida");
      }
    } catch (e) {
      toast.error("Erro inesperado");
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const RideCard = ({ ride, isPending }: { ride: Ride; isPending: boolean }) => (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      {/* Header: categoria + status + métricas */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs font-semibold text-background">
          {CATEGORY_LABELS[ride.category] ?? ride.category}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[ride.status] || "bg-gray-100 text-gray-800"}`}
        >
          {STATUS_LABELS[ride.status] || ride.status}
        </span>
        {ride.distance_km != null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-blue-50 px-2 py-0.5 rounded-full">
            <MapPin className="h-3 w-3" />
            {ride.distance_km} km
          </span>
        )}
        {ride.duration_min != null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-blue-50 px-2 py-0.5 rounded-full">
            <Clock className="h-3 w-3" />
            {ride.duration_min} min
          </span>
        )}
      </div>

      {/* Recolha e Destino */}
      <div className="space-y-2 text-sm mb-3">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Recolha</div>
            <span className="font-medium text-sm leading-tight block truncate">{ride.pickup_address}</span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Navigation className="mt-0.5 h-4 w-4 text-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Destino</div>
            <span className="font-medium text-sm leading-tight block truncate">{ride.dropoff_address}</span>
          </div>
        </div>
      </div>

      {/* Preço e acções */}
      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-green-700/70 font-semibold">Ganho</span>
          <span className="text-xl font-black text-green-800">
            {ride.fare_kz.toLocaleString("pt-AO")} <span className="text-sm font-semibold">Kz</span>
          </span>
        </div>

        {isPending && (
          <button
            onClick={() => handleAccept(ride.id)}
            disabled={busy === ride.id}
            className="flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50 transition"
          >
            {busy === ride.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Aceitar
          </button>
        )}
      </div>

      {/* Botões de acção para corrida activa */}
      {!isPending && (
        <div className="mt-3 flex gap-2 pt-3 border-t border-border/40 flex-wrap">
          {ride.status === "accepted" && (
            <>
              <button
                onClick={() => handleArriving(ride.id)}
                disabled={busy === ride.id}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-amber-50 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition border border-amber-200"
              >
                {busy === ride.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Navigation2 className="h-3.5 w-3.5" />
                )}
                Cheguei
              </button>
              <button
                onClick={() => handleStartRide(ride.id)}
                disabled={busy === ride.id}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-blue-50 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition border border-blue-200"
              >
                {busy === ride.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PlayCircle className="h-3.5 w-3.5" />
                )}
                Iniciar
              </button>
              <button
                onClick={() => handleCancelRide(ride.id)}
                disabled={busy === ride.id}
                className="flex items-center justify-center gap-1.5 rounded-full bg-red-50 py-2 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition border border-red-200"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {ride.status === "arriving" && (
            <>
              <button
                onClick={() => handleStartRide(ride.id)}
                disabled={busy === ride.id}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-blue-50 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition border border-blue-200"
              >
                {busy === ride.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PlayCircle className="h-3.5 w-3.5" />
                )}
                Iniciar Corrida
              </button>
              <button
                onClick={() => handleCancelRide(ride.id)}
                disabled={busy === ride.id}
                className="flex items-center justify-center gap-1.5 rounded-full bg-red-50 py-2 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition border border-red-200"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {ride.status === "in_progress" && (
            <>
              <button
                onClick={() => handleCompleteRide(ride.id)}
                disabled={busy === ride.id}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-green-50 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50 transition border border-green-200"
              >
                {busy === ride.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Concluir Corrida
              </button>
            </>
          )}
          {["accepted", "arriving", "in_progress"].includes(ride.status) && (
            <>
              <button
                onClick={() => setChatRide(ride)}
                className="flex items-center justify-center gap-1.5 rounded-full border border-border bg-primary/10 py-2 px-3 text-xs font-semibold text-primary hover:bg-primary/15 transition"
                title="Conversar com o passageiro"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Chat
              </button>
              {user?.id && ride.passenger_id && (
                <div className="inline-flex">
                  <VoipCallControl
                    userId={user.id}
                    remoteUserId={ride.passenger_id}
                    remoteUserName={passengerNames[ride.passenger_id] ?? "Passageiro"}
                    rideId={ride.id}
                    className="h-9 w-9 rounded-full"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    if (user) {
      load();

      // Realtime subscription para rides (sem polling)
      if (typeof window !== "undefined") {
        const channel = supabaseClient
          .channel("public:rides")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "rides" },
            (payload) => {
              // Auto-dismiss notificação quando outro motorista aceita ou passageiro cancela
              const row = (payload.new ?? payload.old) as { id?: string; status?: string } | null;
              if (row?.id && row.status && row.status !== "requested") {
                setNotificationQueue((prev) => prev.filter((r) => r.id !== row.id));
                setCurrentNotification((cur) => {
                  if (cur && cur.id === row.id) {
                    // Mostra próxima da fila, se houver
                    const next = notificationQueue.find((r) => r.id !== row.id) ?? null;
                    return next;
                  }
                  return cur;
                });
              }
              load();
            },
          )
          .subscribe();

        return () => {
          supabaseClient.removeChannel(channel);
        };
      } else {
        const t = setInterval(load, 8000);
        return () => clearInterval(t);
      }
    }
  }, [user, load, notificationQueue]);


  // Load passenger names for chat
  useEffect(() => {
    const missing = activeRides
      .map((r) => r.passenger_id)
      .filter((id): id is string => !!id && !passengerNames[id]);
    if (missing.length === 0) return;
    (async () => {
      const { data } = await supabaseClient
        .from("profiles")
        .select("id, full_name")
        .in("id", missing);
      if (data) {
        setPassengerNames((prev) => {
          const next = { ...prev };
          for (const p of data) next[p.id] = p.full_name ?? "Passageiro";
          return next;
        });
      }
    })();
  }, [activeRides, passengerNames]);

  return (
    <AppShell role="driver">
      {/* Notificação de corrida em overlay */}
      {currentNotification && (
        <IncomingRideCall
          ride={currentNotification}
          onAccept={handleAcceptNotification}
          onDismiss={handleDismissNotification}
          isLoading={busy === currentNotification.id}
        />
      )}

      <div className="relative h-full w-full">
        {/* Full Map View — ocupa todo o espaço disponível */}
        <div className="absolute inset-0 z-0">
          {(() => {
            const active = activeRides[0];
            const target: [number, number] | undefined = active
              ? active.status === "in_progress"
                ? [active.dropoff_lat || -8.8241, active.dropoff_lng || 13.2381]
                : [active.pickup_lat || -8.8383, active.pickup_lng || 13.2344]
              : undefined;
            return (
              <DriverMapView
                pickupLocation={
                  active ? [active.pickup_lat || -8.8383, active.pickup_lng || 13.2344] : undefined
                }
                destinationLocation={target}
                pickupAddress={active?.pickup_address}
                destinationAddress={active?.dropoff_address}
                rideStatus={active?.status}
                initialOnlineStatus={isOnline}
                onOnlineStatusChange={setIsOnline}
              />
            );
          })()}
        </div>

        {/* Header flutuante — canto superior direito, compacto */}
        <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-md ring-1 ring-black/5 active:scale-95 transition"
            title="Atualizar"
          >
            <RefreshCw className={`h-4 w-4 text-gray-700 ${loading ? "animate-spin" : ""}`} />
          </button>
          <SOSButton variant="floating" />
        </div>

        {/* Bottom Sheet — corridas e acções */}
        <BottomSheet title={activeRides.length > 0 ? "Corrida Ativa" : `Corridas Disponíveis (${pendingRides.length})`}>
          <div className="space-y-3">
            <NotificationPrompt />
            {activeRides.length > 0 ? (
              activeRides.map((r) => <RideCard key={r.id} ride={r} isPending={false} />)
            ) : loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> A procurar pedidos…
              </div>
            ) : pendingRides.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Navigation className="h-6 w-6 text-muted-foreground opacity-50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aguardando novos pedidos na tua zona
                </p>
              </div>
            ) : (
              pendingRides.map((r) => <RideCard key={r.id} ride={r} isPending={true} />)
            )}
          </div>
        </BottomSheet>
      </div>

      {chatRide && user && (
        <RideChat
          rideId={chatRide.id}
          myUserId={user.id}
          myRole="driver"
          counterpartName={
            (chatRide.passenger_id && passengerNames[chatRide.passenger_id]) || "Passageiro"
          }
          remoteUserId={chatRide.passenger_id || null}
          onClose={() => setChatRide(null)}
        />
      )}

      {completionRide && (
        <RideCompletionDialog
          rideId={completionRide.id}
          fareKz={Number(completionRide.fare_kz)}
          paymentMethod={completionRide.payment_method ?? "cash"}
          role="driver"
          initiallyPaid={!!completionRide.paid_at}
          initialCashbackKz={Number(completionRide.cashback_kz ?? 0)}
          onClose={() => setCompletionRide(null)}
        />
      )}
    </AppShell>
  );
}
