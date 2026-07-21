import { useEffect, useRef, useState } from "react";
import { X, Star, BadgeCheck, Zap } from "lucide-react";
import type { RideNotification } from "@/hooks/use-ride-notifications";

interface IncomingRideCallProps {
  ride: RideNotification;
  onAccept: (rideId: string) => Promise<void>;
  onDismiss: (rideId: string) => void;
  isLoading?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  moto: "MotoTáxi",
  normal: "Normal",
  xl: "XL",
  premium: "Premium",
  shared: "Partilhada",
  delivery: "Entrega",
};

/**
 * IncomingRideCall – Pedido de corrida estilo Uber:
 * cartão branco na base do ecrã sobre o mapa, com preço, ETA e botão Aceitar.
 */
export function IncomingRideCall({
  ride,
  onAccept,
  onDismiss,
  isLoading = false,
}: IncomingRideCallProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const ringRef = useRef<{ ctx: AudioContext; interval: number } | null>(null);

  // Countdown
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          onDismiss(ride.id);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [ride.id, onDismiss]);

  // Ringtone loop (dois tons curtos a cada 1.4s)
  useEffect(() => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const ring = () => {
        [0, 0.18].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.value = 880;
          const t0 = ctx.currentTime + offset;
          gain.gain.setValueAtTime(0.0001, t0);
          gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
          osc.start(t0);
          osc.stop(t0 + 0.2);
        });
      };
      ring();
      const interval = window.setInterval(ring, 1400);
      ringRef.current = { ctx, interval };

      if ("vibrate" in navigator) {
        try {
          navigator.vibrate([400, 200, 400, 200, 400]);
        } catch {}
      }
    } catch (e) {
      console.error("ringtone error", e);
    }
    return () => {
      if (ringRef.current) {
        clearInterval(ringRef.current.interval);
        ringRef.current.ctx.close().catch(() => {});
        ringRef.current = null;
      }
      if ("vibrate" in navigator) {
        try {
          navigator.vibrate(0);
        } catch {}
      }
    };
  }, []);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(ride.id);
    } finally {
      setIsAccepting(false);
    }
  };

  const categoryLabel = CATEGORY_LABELS[ride.category] ?? ride.category;
  const rating = "5.00";
  // ETA aproximado até ao ponto de recolha (fallback quando não há dado dedicado)
  const pickupEta = Math.max(1, Math.round((ride.duration_min ?? 5) / 4));
  const pickupKm =
    ride.distance_km != null ? Math.max(0.3, ride.distance_km / 4) : null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 animate-in fade-in duration-300">
      {/* Cartão inferior estilo Uber */}
      <div className="bg-white rounded-t-3xl shadow-2xl px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom)+0.5rem)] animate-in slide-in-from-bottom duration-300 mb-20">
        {/* Cabeçalho: badge categoria + Exclusivo + fechar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-bold text-white">
              {categoryLabel}
            </span>
            <span className="text-sm font-semibold text-neutral-500">Exclusivo</span>
          </div>
          <button
            onClick={() => onDismiss(ride.id)}
            disabled={isAccepting}
            aria-label="Recusar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preço */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-neutral-900">
            {ride.fare_kz.toLocaleString("pt-AO")} Kz
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900">
            <Zap className="h-3.5 w-3.5 fill-white text-white" />
          </span>
        </div>

        {/* Rating + verificado */}
        <div className="mt-2 flex items-center gap-3">
          <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-800">
            <Star className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900" />
            {rating}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-neutral-600">
            <BadgeCheck className="h-4 w-4 text-neutral-900" />
            Verificado
          </span>
        </div>

        {/* Recolha */}
        <div className="mt-5 flex gap-3">
          <div className="mt-1 flex flex-col items-center">
            <span className="h-2.5 w-2.5 rounded-sm bg-neutral-900" />
            <span className="my-1 h-6 w-px border-l border-dashed border-neutral-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-neutral-900">
              {pickupEta} min{pickupKm != null ? ` (${pickupKm.toFixed(1)} km)` : ""} de distância
            </p>
            <p className="truncate text-sm text-neutral-500">{ride.pickup_address}</p>
          </div>
        </div>

        {/* Destino */}
        <div className="flex gap-3">
          <div className="mt-1 flex flex-col items-center">
            <span className="h-2.5 w-2.5 bg-neutral-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-neutral-900">
              {ride.duration_min ?? "—"} min
              {ride.distance_km != null ? ` (${ride.distance_km.toFixed(1)} km)` : ""} de viagem
            </p>
            <p className="truncate text-sm text-neutral-500">{ride.dropoff_address}</p>
          </div>
        </div>

        {/* Botão aceitar com contador */}
        <button
          onClick={handleAccept}
          disabled={isAccepting || isLoading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#276EF1] py-4 text-base font-bold text-white transition hover:bg-[#1e5fd6] disabled:opacity-60"
        >
          {isAccepting ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              A aceitar…
            </>
          ) : (
            <>Aceitar · {timeLeft}s</>
          )}
        </button>
      </div>
    </div>
  );
}
