import { useState, useEffect } from "react";
import { MapPin, Navigation2, Clock, Banknote, Phone, CheckCircle2, X } from "lucide-react";
import type { RideNotification } from "@/hooks/use-ride-notifications";

interface RideNotificationCardProps {
  ride: RideNotification;
  onAccept: (rideId: string) => Promise<void>;
  onDismiss: (rideId: string) => void;
  isLoading?: boolean;
}

/**
 * RideNotificationCard - Card de notificação de corrida para motoristas
 * Mostra informações da corrida e botões de ação
 */
export function RideNotificationCard({
  ride,
  onAccept,
  onDismiss,
  isLoading = false,
}: RideNotificationCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 segundos para aceitar

  // Contar regressivamente
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onDismiss(ride.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [ride.id, onDismiss]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(ride.id);
    } catch (error) {
      console.error("Erro ao aceitar corrida:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      moto: "from-orange-500 to-orange-600",
      normal: "from-blue-500 to-blue-600",
      xl: "from-purple-500 to-purple-600",
      premium: "from-yellow-500 to-yellow-600",
      shared: "from-green-500 to-green-600",
      delivery: "from-red-500 to-red-600",
    };
    return colors[category] || "from-gray-500 to-gray-600";
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      moto: "MotoTáxi",
      normal: "Normal",
      xl: "XL",
      premium: "Premium",
      shared: "Partilhada",
      delivery: "Entrega",
    };
    return labels[category] || category;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header com categoria */}
        <div className={`bg-gradient-to-r ${getCategoryColor(ride.category)} p-4 text-white`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">{getCategoryLabel(ride.category)}</h2>
            <button
              onClick={() => onDismiss(ride.id)}
              className="p-1 hover:bg-white/20 rounded-full transition"
              disabled={isAccepting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm font-semibold opacity-90">Nova Corrida Disponível</p>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          {/* Localização */}
          <div className="space-y-3">
            {/* Recolha */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 pt-1">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Recolha</p>
                <p className="text-sm font-medium text-gray-800 line-clamp-2">
                  {ride.pickup_address}
                </p>
              </div>
            </div>

            {/* Linha divisória */}
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <Navigation2 className="h-5 w-5 text-gray-400 rotate-45" />
              </div>
              <div className="flex-1 h-0.5 bg-gray-300 mt-2.5" />
            </div>

            {/* Destino */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 pt-1">
                <MapPin className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Destino</p>
                <p className="text-sm font-medium text-gray-800 line-clamp-2">
                  {ride.dropoff_address}
                </p>
              </div>
            </div>
          </div>

          {/* Informações da corrida */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200">
            {/* Distância */}
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {ride.distance_km ? `${ride.distance_km.toFixed(1)}` : "?"}
              </div>
              <p className="text-xs text-gray-600">km</p>
            </div>

            {/* Tempo */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-lg font-bold text-orange-600">
                  {ride.duration_min || "?"}
                </span>
              </div>
              <p className="text-xs text-gray-600">min</p>
            </div>

            {/* Tarifa */}
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{ride.fare_kz}</div>
              <p className="text-xs text-gray-600">Kz</p>
            </div>
          </div>

          {/* Informações do passageiro (se disponível) */}
          {ride.passenger_name && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-gray-800">{ride.passenger_name}</p>
              {ride.passenger_phone && (
                <a
                  href={`tel:${ride.passenger_phone}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Phone className="h-4 w-4" />
                  {ride.passenger_phone}
                </a>
              )}
            </div>
          )}

          {/* Contador de tempo */}
          <div className="flex items-center justify-center gap-2 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <Clock className="h-4 w-4 text-yellow-600 animate-spin" />
            <span className="text-sm font-semibold text-yellow-700">
              {timeLeft}s para aceitar
            </span>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => onDismiss(ride.id)}
            disabled={isAccepting}
            className="px-4 py-3 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Recusar
          </button>
          <button
            onClick={handleAccept}
            disabled={isAccepting || isLoading}
            className="px-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAccepting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Aceitando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Aceitar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
