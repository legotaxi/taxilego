import { useEffect, useState } from "react";
import {
  MapPin,
  Navigation2,
  Clock,
  Banknote,
  Phone,
  MessageCircle,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Car,
} from "lucide-react";

interface RideStatus {
  id: string;
  status: "requested" | "accepted" | "arriving" | "in_progress" | "completed" | "cancelled";
  driver?: {
    name: string;
    phone: string;
    rating: number;
    vehicle: string;
    plate: string;
    avatar?: string;
  };
  pickupAddress: string;
  dropoffAddress: string;
  fare: number;
  distance: number;
  duration: number;
  eta?: number;
  currentLat?: number;
  currentLng?: number;
}

interface RideStatusTrackerProps {
  ride: RideStatus;
  onCancel?: () => void;
  onContact?: () => void;
}

const STATUS_STEPS = [
  { id: "requested", label: "Pedido", icon: "📍" },
  { id: "accepted", label: "Aceite", icon: "✓" },
  { id: "arriving", label: "A Chegar", icon: "🚗" },
  { id: "in_progress", label: "Em Curso", icon: "🛣️" },
  { id: "completed", label: "Concluída", icon: "✓" },
];

/**
 * RideStatusTracker - Componente para rastrear status de corrida em tempo real
 */
export function RideStatusTracker({ ride, onCancel, onContact }: RideStatusTrackerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      requested: "bg-yellow-100 text-yellow-800",
      accepted: "bg-yellow-100 text-yellow-800",
      arriving: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      requested: "À Espera de Motorista",
      accepted: "Motorista Aceite",
      arriving: "Motorista a Chegar",
      in_progress: "Corrida em Curso",
      completed: "Corrida Concluída",
      cancelled: "Corrida Cancelada",
    };
    return labels[status] || status;
  };

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.id === ride.status);

  return (
    <div className="fixed inset-0 flex items-end z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Panel */}
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-12 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 pb-4 space-y-4">
          {/* Status Header */}
          <div className={`p-4 rounded-xl text-white text-center ${
            ride.status === "completed"
              ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
              : ride.status === "cancelled"
                ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                : "bg-gradient-to-r from-yellow-500 to-yellow-600"
          }`}>
            <p className="text-sm font-semibold opacity-90">Status da Corrida</p>
            <p className="text-2xl font-bold">{getStatusLabel(ride.status)}</p>
            <p className="text-sm mt-1">Tempo decorrido: {formatTime(elapsedTime)}</p>
          </div>

          {/* Timeline de status */}
          <div className="space-y-2">
            {STATUS_STEPS.map((step, index) => {
              const isActive = index <= currentStepIndex;
              const isCurrent = step.id === ride.status;

              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isActive
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    } ${isCurrent ? "ring-2 ring-yellow-400" : ""}`}
                  >
                    {step.icon}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-gray-800" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Informações do motorista (se aceite) */}
          {ride.driver && ride.status !== "requested" && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Motorista</h3>
              <div className="flex items-center gap-3 mb-3">
                {ride.driver.avatar ? (
                  <img
                    src={ride.driver.avatar}
                    alt={ride.driver.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center text-white font-bold">
                    {ride.driver.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{ride.driver.name}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm text-gray-600">{ride.driver.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Veículo */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-white rounded-lg border border-gray-200">
                <Car className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">{ride.driver.vehicle}</span>
                <span className="text-sm font-bold text-gray-800 ml-auto">{ride.driver.plate}</span>
              </div>

              {/* Botões de ação */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onContact}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border-2 border-yellow-600 text-yellow-600 font-semibold hover:bg-yellow-50 transition"
                >
                  <Phone className="h-4 w-4" />
                  Ligar
                </button>
                <button
                  onClick={onContact}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-yellow-600 text-white font-semibold hover:bg-yellow-700 transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  Mensagem
                </button>
              </div>
            </div>
          )}

          {/* Informações da corrida */}
          <div className="space-y-3">
            {/* Recolha */}
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 uppercase">Recolha</p>
                <p className="text-sm text-gray-800">{ride.pickupAddress}</p>
              </div>
            </div>

            {/* Destino */}
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 uppercase">Destino</p>
                <p className="text-sm text-gray-800">{ride.dropoffAddress}</p>
              </div>
            </div>
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{ride.distance.toFixed(1)}</div>
              <p className="text-xs text-gray-600">km</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{ride.eta || ride.duration}</div>
              <p className="text-xs text-gray-600">min</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{ride.fare}</div>
              <p className="text-xs text-gray-600">Kz</p>
            </div>
          </div>

          {/* Botão de cancelamento */}
          {["requested", "accepted", "arriving"].includes(ride.status) && (
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-lg font-semibold text-yellow-600 bg-yellow-50 border-2 border-yellow-200 hover:bg-yellow-100 transition"
            >
              Cancelar Corrida
            </button>
          )}

          {/* Avaliação (se concluída) */}
          {ride.status === "completed" && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-50 p-4 rounded-xl border border-yellow-200">
              <h3 className="font-semibold text-gray-800 mb-2">Avalie a Corrida</h3>
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="text-3xl hover:scale-110 transition"
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <button className="w-full py-2 rounded-lg font-semibold text-white bg-yellow-600 hover:bg-yellow-700 transition">
                Enviar Avaliação
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
