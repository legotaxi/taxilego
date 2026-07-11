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
  Star,
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
import { cn } from "@/lib/utils";

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
  accepted: "bg-yellow-100 text-yellow-800",
  arriving: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-yellow-100 text-yellow-800",
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

    // Polling de fallback mais agressivo para garantir tempo real mesmo se o WebSocket falhar
    const pollInterval = setInterval(() => {
      const hasActive = (rides || []).some(r => ["requested", "accepted", "arriving", "in_progress"].includes(r.status));
      if (hasActive) {
        ridesQuery.refetch();
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [user?.id, ridesQuery.refetch, ridesQuery, rides]);

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
      <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
        {/* Header Fixo Premium */}
        <header className="z-20 shrink-0 border-b border-border/10 bg-background/95 px-6 py-5 backdrop-blur-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-black tracking-tighter">Atividade</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Suas Corridas</p>
            </div>
          </div>
        </header>

        {/* Conteúdo com Scroll Interno Otimizado */}
        <div className="flex-1 overflow-y-auto scroll-smooth pb-32">
          <div className="px-6 py-6 space-y-6">
            {/* Corridas Ativas */}
            {activeRides.length > 0 && (
              <section className="space-y-4 animate-fade-in">
                <h2 className="px-1 font-display text-sm font-black uppercase tracking-widest text-muted-foreground/40">
                  Em curso
                </h2>
                {activeRides.map((r) => {
                  const Icon = categoryIcon[r.category as keyof typeof categoryIcon] ?? Car;
                  const driverInfo = r.driver_id ? driverInfoMap[r.driver_id] : undefined;
                  const isLoadingDriver = r.driver_id ? loadingDrivers.has(r.driver_id) : false;

                  return (
                    <div
                      key={r.id}
                      className="group relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl animate-slide-up"
                    >
                      {/* Status Header - Uber Style */}
                      <div className={cn(
                        "flex items-center justify-between px-6 py-3",
                        r.status === "requested" ? "bg-yellow-500/10" : 
                        r.status === "accepted" || r.status === "arriving" ? "bg-yellow-500/10" : 
                        "bg-yellow-500/10"
                      )}>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-2 w-2 rounded-full animate-pulse",
                            r.status === "requested" ? "bg-yellow-500" : 
                            r.status === "accepted" || r.status === "arriving" ? "bg-yellow-500" : 
                            "bg-yellow-500"
                          )} />
                          <span className="font-display text-[10px] font-black uppercase tracking-[0.15em] opacity-80">
                            {statusLabel[r.status] ?? r.status}
                          </span>
                        </div>
                        <div className="font-display text-[10px] font-bold text-muted-foreground/60">
                          #{r.id.slice(0, 5).toUpperCase()}
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-2xl font-black leading-none tracking-tighter">
                              {categoryLabel[r.category as keyof typeof categoryLabel]}
                            </h3>
                            <p className="mt-2 text-sm font-bold text-muted-foreground leading-snug">
                              {statusDescription[r.status]}
                            </p>
                          </div>
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-muted/50 text-foreground shadow-inner">
                            <Icon className="h-9 w-9" />
                          </div>
                        </div>

                        {/* Driver Info Card - Uber Premium Style */}
                        {["accepted", "arriving", "in_progress"].includes(r.status) && (
                          <div className="mt-6 rounded-3xl bg-neutral-900 p-5 text-white shadow-2xl">
                            {isLoadingDriver ? (
                              <div className="flex items-center justify-center py-2 gap-3 text-xs font-bold text-white/60">
                                <Loader2 className="h-4 w-4 animate-spin" /> Localizando motorista…
                              </div>
                            ) : driverInfo?.profile ? (
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  {driverInfo.profile.avatar_url ? (
                                    <img
                                      src={driverInfo.profile.avatar_url}
                                      alt={driverInfo.profile.full_name || "Motorista"}
                                      className="h-16 w-16 rounded-2xl object-cover border-2 border-white/10"
                                    />
                                  ) : (
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-white font-display text-2xl font-black">
                                      {driverInfo.profile.full_name?.charAt(0) || "M"}
                                    </div>
                                  )}
                                  <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-lg bg-white px-2 py-0.5 text-[10px] font-black text-black shadow-lg">
                                    <Star className="h-3 w-3 fill-black text-black" />
                                    {driverInfo.driver?.rating?.toFixed(1) || "5.0"}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-display text-lg font-bold truncate">
                                    {driverInfo.profile.full_name}
                                  </div>
                                  <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider truncate">
                                    {driverInfo.vehicle
                                      ? `${driverInfo.vehicle.color || ""} ${driverInfo.vehicle.brand} ${driverInfo.vehicle.model}`
                                      : "Veículo em aproximação"}
                                  </p>
                                  <div className="mt-2 inline-flex items-center rounded-md bg-primary px-2.5 py-1 text-[11px] font-black text-white tracking-tight">
                                    {driverInfo.vehicle?.plate || "EM TRÂNSITO"}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 py-1 text-xs font-bold text-white/50">
                                <AlertCircle className="h-4 w-4" />
                                Aguardando dados do servidor...
                              </div>
                            )}

                            {/* Rastreio em tempo real: distância motorista→passageiro */}
                            {driverInfo?.driver?.current_lat != null &&
                              driverInfo?.driver?.current_lng != null &&
                              ["accepted", "arriving"].includes(r.status) && (
                                <div className="mt-4 border-t border-white/10 pt-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400">
                                        <Navigation2Icon />
                                      </div>
                                      <span className="text-[11px] font-black uppercase tracking-widest text-yellow-400">
                                        Motorista a caminho
                                      </span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-lg font-black">
                                        {haversineKm(
                                          driverInfo.driver.current_lat,
                                          driverInfo.driver.current_lng,
                                          r.pickup_lat,
                                          r.pickup_lng,
                                        ).toFixed(1)}
                                      </span>
                                      <span className="text-[10px] font-black text-white/40">KM</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {/* Route Info */}
                        <div className="mt-8 relative">
                          <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-border/30" />
                          <div className="space-y-6 pl-9">
                            <div className="relative">
                              <div className="absolute -left-9 top-1.5 h-5 w-5 rounded-full border-[5px] border-background bg-yellow-500 shadow-sm" />
                              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50 leading-none mb-1.5">Recolha</p>
                              <p className="truncate text-sm font-bold text-foreground/90">{r.pickup_address}</p>
                            </div>
                            <div className="relative">
                              <div className="absolute -left-9 top-1.5 h-5 w-5 rounded-full border-[5px] border-background bg-foreground shadow-sm" />
                              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50 leading-none mb-1.5">Destino</p>
                              <p className="truncate text-sm font-bold text-foreground/90">{r.dropoff_address}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-border/40">
                          <div>
                            <div className="font-display text-3xl font-black tracking-tighter leading-none">
                              Kz {r.fare_kz.toLocaleString()}
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              <Wallet className="h-3 w-3" />
                              {r.payment_method === "cash" ? "Dinheiro" : "Multicaixa"}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {r.status === "requested" ? (
                              <button
                                onClick={() => handleCancelRide(r.id)}
                                className="rounded-2xl bg-yellow-500 px-6 py-3 text-xs font-black text-white shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
                              >
                                CANCELAR
                              </button>
                            ) : (
                              <div className="flex gap-3">
                                <button
                                  onClick={() => setChatRideId(r.id)}
                                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-foreground shadow-sm hover:bg-muted/80 active:scale-95 transition-all"
                                >
                                  <MessageCircle className="h-7 w-7" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleCallDriver(
                                      driverInfo?.profile?.phone,
                                      driverInfo?.profile?.full_name,
                                    )
                                  }
                                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
                                >
                                  <Phone className="h-7 w-7" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SOS Section - Professional Style */}
                        {["accepted", "arriving", "in_progress"].includes(r.status) && (
                          <div className="mt-5 pt-5 border-t border-border/20">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/80">Segurança LegoTaxi</span>
                              <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                            </div>
                            <SOSButton variant="inline" className="w-full gap-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {/* Histórico */}
            <section className="space-y-4">
              <h2 className="px-1 font-display text-sm font-black uppercase tracking-widest text-muted-foreground/40">
                Histórico
              </h2>
              {completedRides.length > 0 ? (
                <div className="space-y-4">
                  {completedRides.map((r) => {
                    const Icon = categoryIcon[r.category as keyof typeof categoryIcon] ?? Car;
                    return (
                      <div
                        key={r.id}
                        onClick={() => navigate({ to: `/corridas/${r.id}` })}
                        className="group flex items-center gap-4 rounded-3xl border border-border/40 bg-card/50 p-4 transition-all hover:bg-card hover:shadow-md active:scale-[0.98]"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-display text-sm font-bold truncate">
                              {r.dropoff_address.split(",")[0]}
                            </span>
                            <span className="font-display text-xs font-black">
                              Kz {r.fare_kz.toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60">
                            <Clock className="h-3 w-3" />
                            {new Date(r.created_at).toLocaleDateString("pt-AO", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span className={cn(
                              "uppercase tracking-widest",
                              r.status === "completed" ? "text-yellow-500" : "text-yellow-500"
                            )}>
                              {statusLabel[r.status]}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/30">
                    <Clock className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground/50">Sem viagens anteriores</p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* SOS Button Floating - Backup */}
        {activeRides.length === 0 && <SOSButton variant="floating" className="bottom-28" />}
      </div>

      {/* Modals */}
      {chatRideId && user && (() => {
        const ride = rides?.find((r) => r.id === chatRideId);
        const info = ride ? driverInfoMap[ride.id] : undefined;
        const counterpartName = info?.profile?.full_name || "Motorista";
        return (
          <RideChat
            rideId={chatRideId}
            myUserId={user.id}
            myRole="passenger"
            counterpartName={counterpartName}
            counterpartAvatarUrl={info?.profile?.avatar_url ?? null}
            onClose={() => setChatRideId(null)}
          />
        );
      })()}
      {completionRideId && (() => {
        const ride = rides?.find((r) => r.id === completionRideId);
        if (!ride) return null;
        return (
          <RideCompletionDialog
            rideId={completionRideId}
            fareKz={Number(ride.fare_kz ?? 0)}
            paymentMethod={ride.payment_method ?? "cash"}
            role="passenger"
            onClose={() => {
              setDismissedCompletion((prev) => new Set([...prev, completionRideId]));
              setCompletionRideId(null);
            }}
          />
        );
      })()}
    </AppShell>
  );
}

export default MyRidesPage;
