import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useMemo, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  Loader2,
  Menu,
  Candy,
  Navigation,
  ArrowLeft,
  Car,
  Banknote,
  ArrowRightLeft,
  CreditCard,
  Phone,
  Star,
  Wallet,
} from "lucide-react";
import { requestRide, getDriverInfo } from "@/lib/rides.functions";
import { reverseGeocode } from "@/lib/maps.functions";
import { computeRoute } from "@/lib/maps-route.functions";
import { getRideSummary, rateDriver } from "@/lib/ride-payment.functions";
import { getNearbyDrivers } from "@/lib/nearby-drivers.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { AppShell } from "@/components/lego/AppShell";
import { PassengerMapView } from "@/components/lego/PassengerMapView";
import { AddressAutocomplete } from "@/components/lego/AddressAutocomplete";
import { LUBANGO_CENTER } from "@/lib/google-maps-loader";
import sedanImg from "@/assets/vehicles/sedan.png";
import suvImg from "@/assets/vehicles/suv.png";
import motoImg from "@/assets/vehicles/moto.png";
import vanImg from "@/assets/vehicles/van.png";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pedir")({
  head: () => ({
    meta: [
      { title: "Pedir Corrida · Lego Taxi" },
      { name: "description", content: "Peça uma corrida em segundos em Lubango." },
    ],
  }),
  component: PedirPage,
});

type Category = "normal" | "xl" | "moto" | "delivery";
type PayMethod = "cash" | "reference" | "card" | "wallet";
type Step = "destination" | "offer" | "payment" | "searching" | "arriving" | "rating";

const PRICING: Record<Category, { base: number; perKm: number; perMin: number; min: number }> = {
  normal:   { base: 500, perKm: 150, perMin: 20, min: 600 },
  xl:       { base: 800, perKm: 220, perMin: 20, min: 1000 },
  moto:     { base: 300, perKm: 80,  perMin: 10, min: 400 },
  delivery: { base: 400, perKm: 120, perMin: 12, min: 500 },
};

const OFFERS: Array<{
  id: Category;
  name: string;
  tag: string;
  image: string;
  seats: string;
}> = [
  { id: "normal",   name: "LegoTaxi Baza", tag: "+ Económico, s/ AC",              image: sedanImg, seats: "4" },
  { id: "xl",       name: "LegoTaxi Cool", tag: "+ Conforto, c/ AC",               image: suvImg,   seats: "4" },
  { id: "moto",     name: "LegoEntrega",   tag: "Documentos e pequenas encomendas", image: motoImg,  seats: "1" },
  { id: "delivery", name: "LegoCarga",     tag: "Mercadorias e volumes maiores",   image: vanImg,   seats: "2" },
];

const PAY_OPTIONS: Array<{ id: PayMethod; label: string; icon: typeof Banknote }> = [
  { id: "cash",      label: "Dinheiro",      icon: Banknote },
  { id: "reference", label: "Transferência", icon: ArrowRightLeft },
  { id: "card",      label: "TPA",           icon: CreditCard },
  { id: "wallet",    label: "Carteira",      icon: Wallet },
];

function computeFare(cat: Category, km: number, min: number) {
  const p = PRICING[cat];
  return Math.max(p.min, Math.round(p.base + p.perKm * km + p.perMin * min));
}

function PedirPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const requestRideFn = useServerFn(requestRide);
  const reverseGeocodeFn = useServerFn(reverseGeocode);
  const computeRouteFn = useServerFn(computeRoute);
  const getRideSummaryFn = useServerFn(getRideSummary);
  const getDriverInfoFn = useServerFn(getDriverInfo);
  const rateDriverFn = useServerFn(rateDriver);

  const [pickupLocation, setPickupLocation] = useState<[number, number]>([
    LUBANGO_CENTER.lat,
    LUBANGO_CENTER.lng,
  ]);
  const [pickupAddress, setPickupAddress] = useState("A minha localização");
  const [dropoffLocation, setDropoffLocation] = useState<[number, number] | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [route, setRoute] = useState({ distanceKm: 0, durationMin: 0 });
  const [selectedCat, setSelectedCat] = useState<Category>("normal");
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [step, setStep] = useState<Step>("destination");
  const [rideId, setRideId] = useState<string | null>(null);
  const [rideStatus, setRideStatus] = useState<string>("requested");
  const [driverInfo, setDriverInfo] = useState<{
    name: string;
    phone?: string;
    rating?: number;
    vehicle?: string;
    plate?: string;
  } | null>(null);
  const [stars, setStars] = useState(0);
  const [nearbyDrivers, setNearbyDrivers] = useState<Array<[number, number]>>([]);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const getNearbyDriversFn = useServerFn(getNearbyDrivers);

  const pickupTouchedRef = useRef(false);
  const gpsAppliedRef = useRef(false);

  // sync back to destination if dropoff cleared
  useEffect(() => {
    if (!dropoffLocation && (step === "offer" || step === "payment")) setStep("destination");
    if (dropoffLocation && step === "destination") setStep("offer");
  }, [dropoffLocation, step]);

  // Poll available drivers while browsing (destination/offer/payment steps)
  useEffect(() => {
    if (!["destination", "offer", "payment"].includes(step)) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getNearbyDriversFn();
        if (!cancelled && res.drivers) setNearbyDrivers(res.drivers);
      } catch {}
    };
    load();
    // Aumentado para 4s para melhor percepção de tempo real dos carros no mapa
    const iv = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [step, getNearbyDriversFn]);

  // Poll ride status while active
  useEffect(() => {
    if (!rideId || step === "rating") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await getRideSummaryFn({ data: { ride_id: rideId } });
        if (cancelled || !res.ride) return;
        setRideStatus(res.ride.status);
        if (res.ride.driver_id) {
          const d = await getDriverInfoFn({ data: { driver_id: res.ride.driver_id } });
          if (cancelled) return;
          if (d.profile && !driverInfo) {
            setDriverInfo({
              name: d.profile.full_name ?? "Motorista",
              phone: d.profile.phone ?? undefined,
              rating: d.driver?.rating ?? undefined,
              vehicle: d.vehicle ? `${d.vehicle.brand} ${d.vehicle.model}` : undefined,
              plate: d.vehicle?.plate,
            });
          }
          if (d.driver?.current_lat != null && d.driver?.current_lng != null) {
            const newLoc: any = [d.driver.current_lat as number, d.driver.current_lng as number];
            newLoc.accuracy = d.driver.last_accuracy;
            newLoc.heading = d.driver.last_heading;
            newLoc.speed = d.driver.last_speed;
            setDriverLocation(newLoc);
          }
        }
        if (["accepted", "arriving", "in_progress"].includes(res.ride.status)) setStep("arriving");
        if (res.ride.status === "completed") setStep("rating");
        if (res.ride.status === "cancelled") {
          toast.error("Corrida cancelada");
          resetFlow();
        }
      } catch {}
    };
    tick();
    const iv = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [rideId, step, driverInfo, getRideSummaryFn, getDriverInfoFn]);

  const handleGpsLocation = async (loc: [number, number]) => {
    if (pickupTouchedRef.current || gpsAppliedRef.current) return;
    gpsAppliedRef.current = true;
    setPickupLocation(loc);
    try {
      const res = await reverseGeocodeFn({ data: { lat: loc[0], lng: loc[1] } });
      if (!pickupTouchedRef.current)
        setPickupAddress(res.address ?? "A minha localização");
    } catch {}
  };

  const firstName = useMemo(() => {
    const raw = user?.email?.split("@")[0] ?? "";
    return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "";
  }, [user?.email]);

  const computeAndSet = async (dropLoc: [number, number]) => {
    try {
      const res = await computeRouteFn({
        data: {
          origin: { lat: pickupLocation[0], lng: pickupLocation[1] },
          destination: { lat: dropLoc[0], lng: dropLoc[1] },
          travelMode: "DRIVE",
        },
      });
      if (res.distance_km) {
        setRoute({ distanceKm: res.distance_km, durationMin: res.duration_min ?? 0 });
      }
    } catch {}
  };

  const handleDropoffSelect = (loc: [number, number], addr?: string) => {
    setDropoffLocation(loc);
    setDropoffAddress(addr || `${loc[0].toFixed(4)}, ${loc[1].toFixed(4)}`);
    void computeAndSet(loc);
  };

  const handlePickupSelect = (loc: [number, number], addr?: string) => {
    pickupTouchedRef.current = true;
    setPickupLocation(loc);
    setPickupAddress(addr || `${loc[0].toFixed(4)}, ${loc[1].toFixed(4)}`);
    if (dropoffLocation) void computeAndSet(dropoffLocation);
  };

  const resetFlow = () => {
    setDropoffLocation(null);
    setDropoffAddress("");
    setRoute({ distanceKm: 0, durationMin: 0 });
    setRideId(null);
    setDriverInfo(null);
    setDriverLocation(null);
    setStars(0);
    setStep("destination");
  };

  const handleBack = () => {
    if (step === "payment") setStep("offer");
    else if (step === "offer") {
      setDropoffLocation(null);
      setDropoffAddress("");
      setRoute({ distanceKm: 0, durationMin: 0 });
      setStep("destination");
    } else navigate({ to: "/" });
  };

  const submitRide = async () => {
    if (!user) {
      toast.error("Inicia sessão para pedir uma corrida");
      navigate({ to: "/login" });
      return;
    }
    if (!dropoffLocation) return;
    setSubmitting(true);
    try {
      const res = await requestRideFn({
        data: {
          category: selectedCat,
          pickup_address: pickupAddress,
          pickup_lat: pickupLocation[0],
          pickup_lng: pickupLocation[1],
          dropoff_address: dropoffAddress,
          dropoff_lat: dropoffLocation[0],
          dropoff_lng: dropoffLocation[1],
          distance_km: route.distanceKm,
          duration_min: route.durationMin,
          payment_method: payMethod,
        },
      });
      if (res.error || !res.ride) {
        toast.error(res.error ?? "Erro ao pedir corrida");
        return;
      }
      setRideId(res.ride.id);
      setRideStatus("requested");
      setStep("searching");
    } catch (e) {
      toast.error("Erro inesperado");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const submitRating = async () => {
    if (!rideId || stars < 1) return;
    try {
      await rateDriverFn({ data: { ride_id: rideId, stars } });
      toast.success("Obrigado pela avaliação!");
      resetFlow();
      navigate({ to: "/minhas-corridas" });
    } catch {
      toast.error("Erro ao enviar avaliação");
    }
  };

  const currentFare = route.distanceKm
    ? computeFare(selectedCat, route.distanceKm, route.durationMin)
    : PRICING[selectedCat].min;

  const showTopBar = ["destination", "offer", "payment"].includes(step);

  return (
    <AppShell role="passenger">
      <div className="relative h-full w-full overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          <PassengerMapView
            pickupLocation={pickupLocation}
            destinationLocation={dropoffLocation ?? undefined}
            onPickupLocationSelect={handlePickupSelect}
            onDestinationLocationSelect={handleDropoffSelect}
            onLocationUpdate={handleGpsLocation}
            nearbyDrivers={
              step === "arriving" && driverLocation ? [driverLocation] : nearbyDrivers
            }
          />
        </div>

        {/* Top bar */}
        {showTopBar && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)]">
            <button
              onClick={handleBack}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-[0_8px_24px_rgba(0,0,0,0.15)] active:scale-95 transition-transform"
              aria-label="Voltar"
            >
              {step === "destination" ? (
                <Menu className="h-6 w-6" strokeWidth={3} />
              ) : (
                <ArrowLeft className="h-6 w-6" strokeWidth={3} />
              )}
            </button>
            <button
              onClick={() => {
                toast.info("Lego Cashback 🔥", {
                  description: "Ganhe 10% de volta em cada viagem concluída para usar na sua próxima corrida!",
                  duration: 5000,
                });
              }}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-[0_8px_24px_rgba(0,0,0,0.15)] active:scale-95 transition-transform"
              aria-label="Promoções"
            >
              <Candy className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Route badge on map (offer/payment) */}
        {(step === "offer" || step === "payment") && route.durationMin > 0 && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-stretch overflow-hidden rounded-lg shadow-lg">
            <div className="flex items-center justify-center bg-[#1e1e5a] px-4 py-2 font-bold text-white">
              {route.durationMin}Min
            </div>
            <div className="flex items-center justify-center bg-white px-4 py-2 text-sm font-semibold text-neutral-900">
              {pickupAddress.length > 24 ? pickupAddress.slice(0, 22) + "…" : pickupAddress}
            </div>
          </div>
        )}

        {/* Recenter FAB (only on map-visible steps) */}
        {showTopBar && (
          <button
            className="absolute right-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-[0_8px_24px_rgba(0,0,0,0.18)] active:scale-95 transition-transform"
            style={{
              bottom:
                step === "destination"
                  ? "calc(38% + 12px)"
                  : step === "offer"
                    ? "calc(52% + 12px)"
                    : "calc(46% + 12px)",
            }}
            aria-label="A minha localização"
          >
            <Navigation className="h-5 w-5" fill="currentColor" strokeWidth={0} />
          </button>
        )}

        {/* ===== STEP 1: DESTINATION ===== */}
        {step === "destination" && (
          <div className="absolute inset-x-0 bottom-0 z-30 flex max-h-[38%] flex-col rounded-t-[28px] bg-primary shadow-[0_-10px_40px_rgba(255,51,136,0.35)]">
            <div className="flex-1 overflow-y-auto px-7 pt-6 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-2xl leading-none">👋</span>
                <span className="font-bold text-[22px] leading-none text-white uppercase tracking-wide">
                  {(firstName || "Olá")}
                </span>
              </div>
              <h1 className="font-bold text-[28px] leading-[1.05] text-white mb-4 uppercase tracking-wide">
                Para onde vais?
              </h1>
              <div className="flex items-center gap-3 border-b border-white/40 pb-3">
                <Search className="h-5 w-5 shrink-0 text-white" strokeWidth={2.8} />
                <AddressAutocomplete
                  value={dropoffAddress}
                  onChange={setDropoffAddress}
                  onSelect={handleDropoffSelect}
                  placeholder="Escolhe o teu destino"
                  icon={<span />}
                  className="flex-1 [&_input]:!bg-transparent [&_input]:!border-0 [&_input]:!text-white [&_input]:!text-[17px] [&_input]:!font-semibold [&_input]:!p-0 [&_input]:!h-auto [&_input]:!shadow-none [&_input]:placeholder:!text-white/80 [&_input]:focus-visible:!ring-0"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 2: OFFER SELECTION ===== */}
        {step === "offer" && (
          <div className="absolute inset-x-0 bottom-0 z-30 flex max-h-[52%] flex-col rounded-t-[28px] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.15)]">
            <div className="flex h-4 items-center justify-center pt-2">
              <div className="h-1 w-14 rounded-full bg-neutral-300" />
            </div>
            <div className="px-6 pt-3 pb-1">
              <h2 className="font-bold text-[18px] uppercase tracking-wider text-primary">
                Selecione uma oferta
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-2">
              {OFFERS.map((o) => {
                const fare = route.distanceKm
                  ? computeFare(o.id, route.distanceKm, route.durationMin)
                  : PRICING[o.id].min;
                const active = selectedCat === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setSelectedCat(o.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
                      active ? "bg-primary/10" : "hover:bg-neutral-50",
                    )}
                  >
                    <div className={cn(
                      "flex h-14 w-16 shrink-0 items-center justify-center rounded-xl",
                      active ? "bg-primary/10" : "bg-neutral-100",
                    )}>
                      <img src={o.image} alt={o.name} loading="lazy" width={512} height={512} className="h-12 w-14 object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-neutral-900">{o.name}</span>
                        <span className="text-xs text-neutral-500">👤 {o.seats}</span>
                      </div>
                      <div className="text-xs text-neutral-600 mt-0.5">{o.tag}</div>
                    </div>
                    <div className="text-[17px] font-extrabold text-neutral-900 whitespace-nowrap">
                      {fare.toLocaleString("pt-PT")}
                      <span className="ml-0.5 text-xs font-semibold text-neutral-500">Kz</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-5 pt-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
              <button
                onClick={() => setStep("payment")}
                className="w-full rounded-2xl bg-primary py-4 font-bold text-[17px] text-white shadow-xl active:scale-[0.98] transition"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: PAYMENT METHOD ===== */}
        {step === "payment" && (
          <div className="absolute inset-x-0 bottom-0 z-30 flex max-h-[54%] flex-col rounded-t-[28px] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.15)]">
            <div className="flex h-4 items-center justify-center pt-2">
              <div className="h-1 w-14 rounded-full bg-neutral-300" />
            </div>

            {/* Selected offer summary */}
            <div className="flex items-center gap-3 px-5 pt-3 pb-4 border-b border-neutral-100">
              <div className="flex h-12 w-14 items-center justify-center rounded-xl bg-primary/10">
                {(() => {
                  const offer = OFFERS.find((o) => o.id === selectedCat)!;
                  return <img src={offer.image} alt={offer.name} loading="lazy" width={512} height={512} className="h-10 w-12 object-contain" />;
                })()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-neutral-900">
                    {OFFERS.find((o) => o.id === selectedCat)!.name}
                  </span>
                  <span className="text-xs text-neutral-500">
                    👤 {OFFERS.find((o) => o.id === selectedCat)!.seats}
                  </span>
                </div>
                <div className="text-xs text-neutral-600 mt-0.5">
                  {OFFERS.find((o) => o.id === selectedCat)!.tag}
                </div>
              </div>
            </div>

            <div className="px-5 pt-4">
              <h2 className="font-bold text-[16px] uppercase tracking-wider text-primary">
                Método de Pagamento?
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pt-2">
              {PAY_OPTIONS.map((p) => {
                const active = payMethod === p.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPayMethod(p.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-4 py-3 my-1 text-left transition",
                      active ? "bg-neutral-100" : "hover:bg-neutral-50",
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      active ? "bg-primary text-white" : "bg-neutral-100 text-primary",
                    )}>
                      <Icon className="h-5 w-5" strokeWidth={2.4} />
                    </div>
                    <span className="flex-1 text-[16px] font-bold text-neutral-900">{p.label}</span>
                    <span className="text-[18px] font-extrabold text-neutral-900">
                      {currentFare.toLocaleString("pt-PT")}
                      <span className="ml-0.5 text-xs font-semibold text-neutral-500">Kz</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="px-5 pt-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
              <button
                onClick={submitRide}
                disabled={submitting || authLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-[17px] text-white shadow-xl active:scale-[0.98] transition disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    A pedir…
                  </>
                ) : (
                  "Continuar"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 4: SEARCHING DRIVER ===== */}
        {step === "searching" && (
          <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center rounded-t-[28px] bg-white pt-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)]">
            <div className="relative flex h-24 w-24 items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white">
                <Car className="h-9 w-9" strokeWidth={2.4} />
              </div>
            </div>
            <h2 className="font-bold text-[20px] uppercase tracking-wide text-primary text-center">
              À procura de um motorista
            </h2>
            <p className="text-sm text-neutral-600 text-center mt-1">
              Estamos a encontrar o melhor motorista para si…
            </p>
            <button
              onClick={resetFlow}
              className="mt-5 w-full rounded-2xl border-2 border-neutral-200 py-3 font-bold text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* ===== STEP 5: DRIVER ARRIVING / IN PROGRESS ===== */}
        {step === "arriving" && (
          <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-[28px] bg-white pt-3 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.15)]">
            <div className="flex h-4 items-center justify-center">
              <div className="h-1 w-14 rounded-full bg-neutral-300" />
            </div>
            <div className="px-5 pt-3">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">
                {rideStatus === "in_progress"
                  ? "A caminho do destino"
                  : rideStatus === "arriving"
                    ? "Motorista a chegar"
                    : "Motorista a caminho"}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white text-xl font-bold">
                  {(driverInfo?.name ?? "M").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] font-bold text-neutral-900 truncate">
                    {driverInfo?.name ?? "A procurar…"}
                  </div>
                  {driverInfo?.rating != null && (
                    <div className="flex items-center gap-1 text-sm text-neutral-600">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      {driverInfo.rating.toFixed(1)}
                    </div>
                  )}
                </div>
                {driverInfo?.phone && (
                  <a
                    href={`tel:${driverInfo.phone}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg active:scale-95"
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                )}
              </div>
              {(driverInfo?.vehicle || driverInfo?.plate) && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-100 px-4 py-3">
                  <div className="flex items-center gap-2 text-neutral-800">
                    <Car className="h-4 w-4" />
                    <span className="text-sm font-medium">{driverInfo.vehicle ?? "Veículo"}</span>
                  </div>
                  {driverInfo.plate && (
                    <span className="text-sm font-extrabold text-neutral-900">{driverInfo.plate}</span>
                  )}
                </div>
              )}
              <div className="mt-4 space-y-2">
                <div className="flex gap-3 items-start">
                  <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase font-bold text-neutral-500">Recolha</div>
                    <div className="text-sm text-neutral-900 truncate">{pickupAddress}</div>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-neutral-900" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase font-bold text-neutral-500">Destino</div>
                    <div className="text-sm text-neutral-900 truncate">{dropoffAddress}</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-neutral-50 p-3">
                <div className="text-center">
                  <div className="text-base font-bold text-primary">{route.distanceKm.toFixed(1)}</div>
                  <div className="text-[10px] text-neutral-600 uppercase">km</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold text-neutral-900">{route.durationMin}</div>
                  <div className="text-[10px] text-neutral-600 uppercase">min</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold text-yellow-600">
                    {currentFare.toLocaleString("pt-PT")}
                  </div>
                  <div className="text-[10px] text-neutral-600 uppercase">Kz</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 6: RATING ===== */}
        {step === "rating" && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white px-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
              Fim da corrida
            </div>
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-white text-3xl font-bold">
              {(driverInfo?.name ?? "M").charAt(0).toUpperCase()}
            </div>
            <div className="text-[18px] font-bold text-neutral-900">
              {driverInfo?.name ?? "Motorista"}
            </div>
            <div className="mt-6 text-center text-[20px] font-bold uppercase tracking-wide text-neutral-900">
              Avalie a sua corrida
            </div>
            <div className="mt-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  className="p-1 active:scale-90 transition-transform"
                  aria-label={`${n} estrelas`}
                >
                  <Star
                    className={cn(
                      "h-11 w-11",
                      n <= stars
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-neutral-200 text-neutral-200",
                    )}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={submitRating}
              disabled={stars < 1}
              className="mt-8 w-full max-w-xs rounded-2xl bg-primary py-4 font-bold text-[17px] uppercase tracking-wide text-white shadow-xl active:scale-[0.98] transition disabled:opacity-50"
            >
              Confirmar
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
