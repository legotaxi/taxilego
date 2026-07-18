import { useState, useEffect, useMemo } from "react";
import {
  Bike,
  Car,
  Truck,
  Package,
  Menu,
  Search,
  Loader2,
  Navigation,
  ChevronUp,
  MapPin,
  Circle,
  Gift,
} from "lucide-react";
import { PassengerMapView } from "./PassengerMapView";
import { NotificationPrompt } from "./NotificationPrompt";
import { SOSButton } from "./SOSButton";
import { CashbackPromotionSheet } from "./CashbackPromotionSheet";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { requestRide, estimateFare } from "@/lib/rides.functions";
import { computeRoute } from "@/lib/maps-route.functions";
import { getNearbyDrivers } from "@/lib/nearby-drivers.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Category = "moto" | "normal" | "xl" | "premium" | "shared" | "delivery";

const services: {
  id: string;
  icon: typeof Bike;
  name: string;
  subtitle: string;
  seats: number;
  eta: string;
  category: Category;
}[] = [
  { id: "moto", icon: Bike, name: "Lego Moto", subtitle: "Rápido, s/ trânsito", seats: 1, eta: "2 min", category: "moto" },
  { id: "car", icon: Car, name: "Lego Baza", subtitle: "Económico, s/ AC", seats: 4, eta: "4 min", category: "normal" },
  { id: "xl", icon: Truck, name: "Lego Cool", subtitle: "+ Conforto, c/ AC", seats: 4, eta: "6 min", category: "xl" },
  { id: "delivery", icon: Package, name: "Lego Entrega", subtitle: "Encomendas", seats: 0, eta: "5 min", category: "delivery" },
];

export function PassengerApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const requestRideFn = useServerFn(requestRide);
  const estimateFareFn = useServerFn(estimateFare);
  const computeRouteFn = useServerFn(computeRoute);
  const getNearbyDriversFn = useServerFn(getNearbyDrivers);
  const [nearbyDrivers, setNearbyDrivers] = useState<Array<[number, number]>>([]);

  const [selected, setSelected] = useState("car");
  const [pickup, setPickup] = useState<{ coords: [number, number]; address: string } | null>(null);
  const [destination, setDestination] = useState<{ coords: [number, number]; address: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fares, setFares] = useState<Record<string, number>>({});
  const [route, setRoute] = useState<{ distanceKm: number; durationMin: number; computing: boolean }>({
    distanceKm: 0,
    durationMin: 0,
    computing: false,
  });
  const [promoOpen, setPromoOpen] = useState(false);

  const active = services.find((s) => s.id === selected)!;
  const { distanceKm, durationMin } = route;
  const hasRoute = pickup && destination && distanceKm > 0;

  const firstName = useMemo(() => {
    const fullName = ((user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? "").trim();
    const first = fullName.split(/\s+/)[0] ?? "";
    if (!first) return "";
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }, [user?.user_metadata]);

  // Motoristas online próximos — polling a cada 10s
  useEffect(() => {
    let cancelled = false;
    const fetchDrivers = async () => {
      try {
        const res = await getNearbyDriversFn({ data: { lat: LUBANGO_CENTER.lat, lng: LUBANGO_CENTER.lng, radius_m: 10000 } });
        if (!cancelled && res.drivers) setNearbyDrivers(res.drivers.map((d) => [d.lat, d.lng] as [number, number]));
      } catch (e) {
        console.error("nearby drivers error:", e);
      }
    };
    fetchDrivers();
    const id = setInterval(fetchDrivers, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [getNearbyDriversFn]);

  // Rota real
  useEffect(() => {
    if (!pickup || !destination) {
      setRoute({ distanceKm: 0, durationMin: 0, computing: false });
      return;
    }
    let cancelled = false;
    setRoute((r) => ({ ...r, computing: true }));
    (async () => {
      const res = await computeRouteFn({
        data: {
          origin: { lat: pickup.coords[0], lng: pickup.coords[1] },
          destination: { lat: destination.coords[0], lng: destination.coords[1] },
          travelMode: "DRIVE",
        },
      });
      if (cancelled) return;
      if (res.error || !res.distance_km) {
        toast.error("Não foi possível calcular a rota");
        setRoute({ distanceKm: 0, durationMin: 0, computing: false });
        return;
      }
      setRoute({ distanceKm: res.distance_km, durationMin: res.duration_min ?? 0, computing: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [pickup, destination, computeRouteFn]);

  // Preço real
  useEffect(() => {
    if (!distanceKm) {
      setFares({});
      return;
    }
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        services.map(async (s) => {
          const res = await estimateFareFn({
            data: { category: s.category, distance_km: distanceKm, duration_min: durationMin },
          });
          return [s.id, res.fare_kz] as const;
        }),
      );
      if (!cancelled) setFares(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [distanceKm, durationMin, estimateFareFn]);

  const handleRequestRide = async () => {
    if (!user) {
      toast.error("Inicia sessão para pedir uma corrida");
      navigate({ to: "/login" });
      return;
    }
    if (!pickup || !destination) {
      toast.error("Selecione origem e destino");
      return;
    }
    if (!distanceKm) {
      toast.error("Não foi possível calcular a distância");
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestRideFn({
        data: {
          category: active.category,
          pickup_address: pickup.address,
          pickup_lat: pickup.coords[0],
          pickup_lng: pickup.coords[1],
          dropoff_address: destination.address,
          dropoff_lat: destination.coords[0],
          dropoff_lng: destination.coords[1],
          distance_km: distanceKm,
          duration_min: durationMin,
          payment_method: "cash",
        },
      });
      if (res.error || !res.ride) {
        toast.error(res.error ?? "Erro ao pedir corrida");
        return;
      }
      toast.success("Corrida pedida! À procura de motorista…");
      navigate({ to: "/minhas-corridas" });
    } catch (e) {
      toast.error("Erro inesperado ao pedir corrida");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const activeFare = fares[active.id];

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white text-black">
      {/* MAPA FULL-BLEED */}
      <div className="absolute inset-0 z-0">
        <PassengerMapView
          onPickupLocationSelect={(coords, address) => setPickup({ coords, address: address || "" })}
          onDestinationLocationSelect={(coords, address) => setDestination({ coords, address: address || "" })}
          pickupLocation={pickup?.coords}
          destinationLocation={destination?.coords}
          nearbyDrivers={nearbyDrivers}
        />
      </div>

      {/* CONTROLOS FLUTUANTES TOPO */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)]">
        <button
          onClick={() => navigate({ to: "/minhas-corridas" })}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-[0_8px_24px_rgba(0,0,0,0.15)] active:scale-95 transition-transform"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => setPromoOpen(true)}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-[0_8px_24px_rgba(0,0,0,0.15)] active:scale-95 transition-transform relative"
          aria-label="Promoções"
        >
          <Gift className="h-5 w-5" strokeWidth={2} />
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-yellow-500">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-300" />
          </span>
        </button>
      </div>

      {/* FAB RECENTRAR (acima do sheet) */}
      <button
        className="absolute right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-[0_8px_24px_rgba(0,0,0,0.18)] active:scale-95 transition-transform"
        style={{ bottom: "calc(38% + 16px)" }}
        aria-label="A minha localização"
      >
        <Navigation className="h-6 w-6" fill="currentColor" strokeWidth={0} />
      </button>

      {/* BOTTOM SHEET */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-[28px] bg-primary text-primary-foreground",
          "shadow-[0_-10px_40px_rgba(255,51,136,0.35)] transition-[max-height] duration-300 ease-out",
          "max-h-[38%]",
        )}
      >
        <div className="flex-1 overflow-y-auto px-7 pt-6 pb-[max(env(safe-area-inset-bottom),1.25rem)] scrollbar-hide">
          {/* Saudação estilo Heetch */}
          <div className="mb-1 flex items-center gap-2">
            <span className="text-2xl leading-none">👋</span>
            <span
              className="font-display text-[26px] leading-none text-primary"
              style={{ WebkitTextStroke: "1.5px white" }}
            >
              {(firstName || "Olá").toUpperCase()}
            </span>
          </div>
          <h1 className="font-display text-[32px] leading-[0.95] text-white mb-5">
            PARA ONDE VAIS?
          </h1>

          <NotificationPrompt />



          {/* Campo de destino único, underline style */}
          <button
            onClick={() => navigate({ to: "/pedir" })}
            className="flex w-full items-center gap-3 border-b border-white/40 pb-3 text-left active:opacity-80 transition"
          >
            <Search className="h-5 w-5 shrink-0 text-white" strokeWidth={2.8} />
            <span className="flex-1 truncate text-[17px] font-semibold text-white/85">
              Escolhe o teu destino
            </span>
          </button>
        </div>

        {/* Home indicator */}
        <div className="pointer-events-none flex h-6 shrink-0 items-center justify-center">
          <div className="h-1 w-28 rounded-full bg-white/25" />
        </div>
      </div>

      <SOSButton variant="floating" />

      <CashbackPromotionSheet open={promoOpen} onOpenChange={setPromoOpen} />
    </div>
  );
}
