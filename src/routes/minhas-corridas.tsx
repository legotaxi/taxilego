import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bike,
  Car,
  Truck,
  Crown,
  Users,
  Package,
  MapPin,
  Wallet,
  Phone,
  AlertCircle,
  Clock,
  Loader2,
  ArrowRight,
  ChevronRight,
  MapIcon,
  MessageCircle,
  Navigation2 as Nav2,
} from "lucide-react";
import { SOSButton } from "@/components/lego/SOSButton";
import { getMyRides, getMyProfile, cancelRide, getDriverInfo } from "@/lib/rides.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { AppShell } from "@/components/lego/AppShell";
import { RideChat } from "@/components/lego/RideChat";
import { RideCompletionDialog } from "@/components/lego/RideCompletionDialog";
import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/minhas-corridas")({
  head: () => ({
    meta: [
      { title: "Minhas corridas · Lego Taxi" },
      { name: "description", content: "Histórico das suas corridas Lego Taxi em Angola." },
    ],
  }),
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: MyRidesPage,
});

const categoryIcon = {
  moto: Bike,
  normal: Car,
  xl: Truck,
  premium: Crown,
  shared: Users,
  delivery: Package,
} as const;

const categoryLabel = {
  moto: "MotoTáxi",
  normal: "Táxi Normal",
  xl: "Táxi XL",
  premium: "Premium",
  shared: "Partilhada",
  delivery: "Entrega",
} as const;

const statusBadge: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  arriving: "bg-purple-100 text-purple-800",
  in_progress: "bg-green-100 text-green-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  requested: "À espera",
  accepted: "Motorista a caminho",
  arriving: "A chegar",
  in_progress: "Em curso",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const statusDescription: Record<string, string> = {
  requested: "Procurando motorista…",
  accepted: "Motorista aceite a corrida",
  arriving: "Motorista a chegar ao local de partida",
  in_progress: "Corrida em curso",
  completed: "Corrida concluída com sucesso",
  cancelled: "Corrida foi cancelada",
};

type DriverInfo = {
  driver: {
    id: string;
    rating: number | null;
    total_rides: number;
    current_lat?: number | null;
    current_lng?: number | null;
  } | null;
  profile: {
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  vehicle: {
    brand: string;
    model: string;
    plate: string;
    color: string | null;
    category: string;
  } | null;
  error: string | null;
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function Navigation2Icon() {
  return <Nav2 className="h-3.5 w-3.5" />;
}


function MyRidesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fetchRides = useServerFn(getMyRides);
  const fetchProfile = useServerFn(getMyProfile);
  const cancelRideFn = useServerFn(cancelRide);
  const fetchDriverInfo = useServerFn(getDriverInfo);

  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const ridesQuery = useQuery({ queryKey: ["my-rides"], queryFn: () => fetchRides() });

  const [driverInfoMap, setDriverInfoMap] = useState<Record<string, DriverInfo>>({});
  const [loadingDrivers, setLoadingDrivers] = useState<Set<string>>(new Set());
  const [chatRideId, setChatRideId] = useState<string | null>(null);
  const [completionRideId, setCompletionRideId] = useState<string | null>(null);
  const [dismissedCompletion, setDismissedCompletion] = useState<Set<string>>(new Set());

  const profile = profileQuery.data?.profile;
  const rides = ridesQuery.data?.rides;

  // Detecta transições de estado para notificar o passageiro (som + toast + vibração)
  const prevStatusesRef = useState<Record<string, string>>({})[0];
  useEffect(() => {
    if (!rides) return;
    for (const r of rides) {
      const prev = (prevStatusesRef as Record<string, string>)[r.id];
      if (prev && prev !== r.status) {
        if (r.status === "accepted") {
          toast.success("🚗 Motorista aceitou a sua corrida!");
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = 880; o.type = "sine";
            g.gain.setValueAtTime(0.3, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            o.start(); o.stop(ctx.currentTime + 0.4);
          } catch {}
          if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
        } else if (r.status === "arriving") {
          toast.info("📍 Motorista a chegar ao ponto de recolha");
          if ("vibrate" in navigator) navigator.vibrate(200);
        } else if (r.status === "in_progress") {
          toast.success("▶️ Corrida iniciada — boa viagem!");
        }
      }
      (prevStatusesRef as Record<string, string>)[r.id] = r.status;
    }
  }, [rides, prevStatusesRef]);

  // Realtime subscription para atualizações de corridas
  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = supabase
      .channel("my-rides-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
          filter: `passenger_id=eq.${user?.id}`,
        },
        () => {
          console.log("Ride updated, refetching...");
          ridesQuery.refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, ridesQuery.refetch, ridesQuery]);

  // Carregar info inicial do motorista (perfil/veículo) para corridas activas
  useEffect(() => {
    const activeRides = (rides || []).filter(
      (r) => ["accepted", "arriving", "in_progress"].includes(r.status) && r.driver_id,
    );
    if (activeRides.length === 0) return;

    (async () => {
      for (const ride of activeRides) {
        if (!ride.driver_id) continue;
        if (driverInfoMap[ride.driver_id]) continue;
        setLoadingDrivers((prev) => new Set([...prev, ride.driver_id!]));
        try {
          const info = await fetchDriverInfo({ data: { driver_id: ride.driver_id } });
          setDriverInfoMap((prev) => ({ ...prev, [ride.driver_id!]: info }));
        } finally {
          setLoadingDrivers((prev) => {
            const next = new Set(prev);
            next.delete(ride.driver_id!);
            return next;
          });
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rides, fetchDriverInfo]);

  // Realtime: posição do motorista — substitui o polling de 5s (latência ~instantânea)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const activeDriverIds = Array.from(
      new Set(
        (rides || [])
          .filter((r) => ["accepted", "arriving", "in_progress"].includes(r.status) && r.driver_id)
          .map((r) => r.driver_id as string),
      ),
    );
    if (activeDriverIds.length === 0) return;

    const channels = activeDriverIds.map((driverId) =>
      supabase
        .channel(`driver-loc-${driverId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "drivers",
            filter: `id=eq.${driverId}`,
          },
          (payload) => {
            const row = payload.new as {
              id: string;
              current_lat: number | null;
              current_lng: number | null;
              rating: number | null;
              total_rides: number | null;
            };
            setDriverInfoMap((prev) => {
              const existing = prev[driverId];
              if (!existing) return prev;
              return {
                ...prev,
                [driverId]: {
                  ...existing,
                  driver: {
                    id: driverId,
                    rating: row.rating ?? existing.driver?.rating ?? null,
                    total_rides: row.total_rides ?? existing.driver?.total_rides ?? 0,
                    current_lat: row.current_lat,
                    current_lng: row.current_lng,
                  },
                },
              };
            });
          },
        )
        .subscribe(),
    );

    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [rides]);

  // Auto-open completion dialog the first time a ride flips to completed & unpaid
  useEffect(() => {
    if (!rides || completionRideId) return;
    const pending = rides.find(
      (r) => r.status === "completed" && !r.paid_at && !dismissedCompletion.has(r.id),
    );
    if (pending) setCompletionRideId(pending.id);
  }, [rides, completionRideId, dismissedCompletion]);

  const handleCancelRide = async (rideId: string) => {
    if (!confirm("Tem a certeza que deseja cancelar esta corrida?")) return;

    try {
      const result = await cancelRideFn({ data: { id: rideId } });
      if (result.ok) {
        toast.success("Corrida cancelada com sucesso");
        ridesQuery.refetch();
      } else {
        toast.error(result.error || "Erro ao cancelar corrida");
      }
    } catch (error) {
      console.error("Erro ao cancelar corrida:", error);
      toast.error("Erro ao cancelar corrida");
    }
  };

  const handleCallDriver = (
    driverPhone: string | null | undefined,
    driverName: string | null | undefined,
  ) => {
    if (!driverPhone) {
      toast.error("Número de telefone do motorista não disponível");
      return;
    }

    const phoneNumber = driverPhone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=Olá ${driverName || "motorista"}, estou à sua espera!`;
    window.open(whatsappUrl, "_blank");
  };

  const activeRides = (rides || []).filter((r) =>
    ["requested", "accepted", "arriving", "in_progress"].includes(r.status),
  );
  const completedRides = (rides || []).filter((r) => ["completed", "cancelled"].includes(r.status));

  return (
    <AppShell role="passenger">
      <div className="flex h-full flex-col bg-background overflow-hidden">
        {/* Header Fixo */}
        <header className="z-10 shrink-0 border-b border-border/50 bg-background/80 px-5 py-4 backdrop-blur-xl shadow-soft">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl font-bold tracking-tight">Atividade</h1>
          </div>
        </header>

        {/* Conteúdo com Scroll Interno */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-5 py-4 space-y-4">
            {/* Corridas Ativas */}
            {activeRides.length > 0 && (
                  <section className="space-y-3 animate-fade-in">
                <h2 className="px-1 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
                  Em curso
                </h2>
                {activeRides.map((r) => {
                  const Icon = categoryIcon[r.category as keyof typeof categoryIcon] ?? Car;
                  const driverInfo = r.driver_id ? driverInfoMap[r.driver_id] : undefined;
                  const isLoadingDriver = r.driver_id ? loadingDrivers.has(r.driver_id) : false;

                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft hover:shadow-elevated transition-all duration-200 animate-slide-up"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display text-sm font-bold">
                              {categoryLabel[r.category as keyof typeof categoryLabel]}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge[r.status] ?? "bg-muted"}`}
                            >
                              {statusLabel[r.status] ?? r.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                            {statusDescription[r.status]}
                          </p>

                          {/* Driver Info Card - Premium */}
                          {["accepted", "arriving", "in_progress"].includes(r.status) && (
                            <div className="mt-3 rounded-2xl bg-muted/40 p-4 border border-border/50 shadow-soft">
                              {isLoadingDriver ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />A carregar…
                                </div>
                              ) : driverInfo?.profile ? (
                                <div className="flex items-start gap-3">
                                  {driverInfo.profile.avatar_url ? (
                                    <img
                                      src={driverInfo.profile.avatar_url}
                                      alt={driverInfo.profile.full_name || "Motorista"}
                                      className="h-12 w-12 rounded-full object-cover border border-border"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                      {(driverInfo.profile.full_name || "M").charAt(0)}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className="font-semibold text-sm truncate">
                                      {driverInfo.profile.full_name || "Motorista"}
                                    </div>
                                    {driverInfo.driver && (
                                      <div className="text-[11px] text-muted-foreground">
                                        ⭐ {driverInfo.driver.rating?.toFixed(1) || "—"}
                                      </div>
                                    )}
                                    {driverInfo.vehicle ? (
                                      <div className="flex items-center gap-2 text-[11px] pt-1">
                                        <Car className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-muted-foreground truncate">
                                          {driverInfo.vehicle.brand} {driverInfo.vehicle.model}
                                        </span>
                                        <span className="ml-auto rounded bg-foreground text-background px-1.5 py-0.5 font-mono font-bold tracking-wider">
                                          {driverInfo.vehicle.plate}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-muted-foreground italic">
                                        Veículo a ser atribuído
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  Dados do motorista não disponíveis
                                </div>
                              )}

                              {/* Rastreio em tempo real: distância motorista→passageiro */}
                              {driverInfo?.driver?.current_lat != null &&
                                driverInfo?.driver?.current_lng != null &&
                                r.pickup_lat != null &&
                                r.pickup_lng != null && (
                                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[11px] font-semibold text-primary border border-primary/20">
                                    <Navigation2Icon />
                                    <span>
                                      Motorista a{" "}
                                      {haversineKm(
                                        driverInfo.driver.current_lat,
                                        driverInfo.driver.current_lng,
                                        r.pickup_lat,
                                        r.pickup_lng,
                                      ).toFixed(2)}{" "}
                                      km · actualizado agora
                                    </span>
                                  </div>
                                )}
                            </div>
                          )}

                          <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                            <div className="flex items-start gap-2 text-[11px]">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1" />
                              <span className="text-muted-foreground">{r.pickup_address}</span>
                            </div>
                            <div className="flex items-start gap-2 text-[11px]">
                              <div className="h-1.5 w-1.5 bg-foreground shrink-0 mt-1" />
                              <span className="text-muted-foreground">{r.dropoff_address}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                        <div className="font-display font-black">
                          Kz {Number(r.fare_kz).toLocaleString("pt-PT")}
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          {r.status === "requested" && (
                            <button
                              onClick={() => handleCancelRide(r.id)}
                              className="rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold text-red-600 active:scale-95 transition-all duration-200 tap-highlight-none"
                            >
                              Cancelar
                            </button>
                          )}
                          {["accepted", "arriving", "in_progress"].includes(r.status) && (
                            <>
                              <button
                                onClick={() => setChatRideId(r.id)}
                                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary active:scale-95 transition-transform hover:bg-primary/15"
                                title="Chat com motorista"
                              >
                                <MessageCircle className="h-3.5 w-3.5" /> Chat
                              </button>
                              {driverInfo?.profile?.phone && (
                                <>
                                  <a
                                    href={`sms:${driverInfo.profile.phone}`}
                                    className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-foreground active:scale-95 transition-transform hover:bg-muted/80"
                                    title="Enviar SMS"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" /> SMS
                                  </a>
                                  <button
                                    onClick={() =>
                                      handleCallDriver(
                                        driverInfo.profile?.phone,
                                        driverInfo.profile?.full_name,
                                      )
                                    }
                                    className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground active:scale-95 transition-transform hover:opacity-90"
                                  >
                                    <Phone className="h-3.5 w-3.5" /> Chamar
                                  </button>
                                </>
                              )}
                              <SOSButton phoneNumber="111" />
                            </>
                          )}
                          {r.status === "completed" && !r.paid_at && (
                            <button
                              onClick={() => setCompletionRideId(r.id)}
                              className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground active:scale-95 transition-transform"
                            >
                              Pagar agora
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {/* Histórico */}
            <section className="space-y-3 pb-6">
              <h2 className="px-1 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Histórico
              </h2>
              <div className="rounded-2xl border border-border bg-card shadow-sm divide-y divide-border overflow-hidden">
                {ridesQuery.isLoading ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" /> A carregar…
                  </div>
                ) : completedRides.length === 0 ? (
                  <div className="py-12 text-center px-6">
                    <p className="text-sm font-medium text-muted-foreground">
                      Ainda não tens corridas concluídas.
                    </p>
                  </div>
                ) : (
                  completedRides.map((r) => {
                    const Icon = categoryIcon[r.category as keyof typeof categoryIcon] ?? Car;
                    return (
                      <div key={r.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold">
                              {categoryLabel[r.category as keyof typeof categoryLabel]}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(r.created_at).toLocaleDateString("pt-PT")}
                            </div>
                          </div>
                        </div>
                        <div className="font-display font-bold text-sm">
                          Kz {Number(r.fare_kz).toLocaleString("pt-PT")}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {chatRideId && user && (() => {
        const r = (rides ?? []).find((x) => x.id === chatRideId);
        const drv = r?.driver_id ? driverInfoMap[r.driver_id] : null;
        return (
          <RideChat
            rideId={chatRideId}
            myUserId={user.id}
            myRole="passenger"
            counterpartName={drv?.profile?.full_name || "Motorista"}
            counterpartAvatarUrl={drv?.profile?.avatar_url ?? null}
            onClose={() => setChatRideId(null)}
          />
        );
      })()}

      {completionRideId && (() => {
        const r = (rides ?? []).find((x) => x.id === completionRideId);
        if (!r) return null;
        const drv = r.driver_id ? driverInfoMap[r.driver_id] : null;
        return (
          <RideCompletionDialog
            rideId={r.id}
            fareKz={Number(r.fare_kz)}
            paymentMethod={r.payment_method ?? "cash"}
            role="passenger"
            driverName={drv?.profile?.full_name ?? undefined}
            initiallyPaid={!!r.paid_at}
            initialCashbackKz={Number(r.cashback_kz ?? 0)}
            initialRating={r.driver_rating ?? null}
            onClose={() => {
              setDismissedCompletion((s) => new Set([...s, completionRideId!]));
              setCompletionRideId(null);
              ridesQuery.refetch();
              profileQuery.refetch();
            }}
          />
        );
      })()}
    </AppShell>
  );
}
