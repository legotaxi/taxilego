import { useState, useEffect } from "react";
import {
  MapPin,
  Navigation2,
  Clock,
  Banknote,
  CheckCircle2,
  PlayCircle,
  XCircle,
  Phone,
  AlertCircle,
  RefreshCw,
  Navigation,
  TrendingUp,
  Zap,
  Users,
  DollarSign,
  Activity,
} from "lucide-react";

interface Ride {
  id: string;
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
  created_at: string;
  passenger_name?: string;
  passenger_phone?: string;
  passenger_rating?: number;
}

interface DriverPanelImprovedProps {
  pendingRides: Ride[];
  activeRides: Ride[];
  onAcceptRide: (rideId: string) => Promise<void>;
  onUpdateStatus: (rideId: string, status: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
  stats?: {
    totalEarnings: number;
    completedRides: number;
    rating: number;
    acceptanceRate: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  requested: "À espera",
  accepted: "Aceite",
  arriving: "A chegar",
  in_progress: "Em curso",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800 border-yellow-300",
  accepted: "bg-yellow-100 text-yellow-800 border-yellow-300",
  arriving: "bg-yellow-100 text-yellow-800 border-yellow-300",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-300",
  completed: "bg-yellow-100 text-yellow-800 border-yellow-300",
  cancelled: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

/**
 * DriverPanelImproved - Painel melhorado para motoristas com notificações
 * Layout otimizado para mobile, sem scroll excessivo
 */
export function DriverPanelImproved({
  pendingRides,
  activeRides,
  onAcceptRide,
  onUpdateStatus,
  onRefresh,
  isLoading = false,
  stats = {
    totalEarnings: 0,
    completedRides: 0,
    rating: 0,
    acceptanceRate: 0,
  },
}: DriverPanelImprovedProps) {
  const [acceptingRideId, setAcceptingRideId] = useState<string | null>(null);
  const [expandedRideId, setExpandedRideId] = useState<string | null>(null);

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      moto: "from-yellow-500 to-yellow-600",
      normal: "from-yellow-500 to-yellow-600",
      xl: "from-yellow-500 to-yellow-600",
      premium: "from-yellow-500 to-yellow-600",
      shared: "from-yellow-500 to-yellow-600",
      delivery: "from-yellow-500 to-yellow-600",
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

  const handleAcceptRide = async (rideId: string) => {
    setAcceptingRideId(rideId);
    try {
      await onAcceptRide(rideId);
    } finally {
      setAcceptingRideId(null);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto pb-20">
      {/* Header com estatísticas */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">Painel do Motorista</h1>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Mini estatísticas */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <DollarSign className="h-4 w-4 mx-auto mb-1" />
            <p className="text-xs font-bold">{stats.totalEarnings}</p>
            <p className="text-xs opacity-80">Kz</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <CheckCircle2 className="h-4 w-4 mx-auto mb-1" />
            <p className="text-xs font-bold">{stats.completedRides}</p>
            <p className="text-xs opacity-80">Corridas</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1" />
            <p className="text-xs font-bold">{stats.rating.toFixed(1)}</p>
            <p className="text-xs opacity-80">Rating</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <Activity className="h-4 w-4 mx-auto mb-1" />
            <p className="text-xs font-bold">{stats.acceptanceRate}%</p>
            <p className="text-xs opacity-80">Aceite</p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-4">
        {/* Corridas ativas */}
        {activeRides.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-yellow-600" />
              Corridas Activas ({activeRides.length})
            </h2>
            <div className="space-y-2">
              {activeRides.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-white rounded-xl shadow-sm border-l-4 border-yellow-500 overflow-hidden"
                >
                  <div className="p-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[ride.status]}`}
                        >
                          {STATUS_LABELS[ride.status]}
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-gradient-to-r ${getCategoryColor(ride.category)} text-white`}>
                          {getCategoryLabel(ride.category)}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-yellow-600">{ride.fare_kz} Kz</div>
                    </div>

                    {/* Localização */}
                    <div className="space-y-1 mb-2">
                      <div className="flex gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 line-clamp-1">{ride.pickup_address}</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 line-clamp-1">{ride.dropoff_address}</span>
                      </div>
                    </div>

                    {/* Detalhes */}
                    <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="font-bold text-yellow-600">{ride.distance_km?.toFixed(1) || "?"}</p>
                        <p className="text-gray-600">km</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="font-bold text-yellow-600">{ride.duration_min || "?"}</p>
                        <p className="text-gray-600">min</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="font-bold text-yellow-600">{ride.fare_kz}</p>
                        <p className="text-gray-600">Kz</p>
                      </div>
                    </div>

                    {/* Botões de ação */}
                    {ride.status === "accepted" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onUpdateStatus(ride.id, "arriving")}
                          className="px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm font-semibold hover:bg-yellow-700 transition"
                        >
                          A Chegar
                        </button>
                        <button
                          onClick={() => onUpdateStatus(ride.id, "cancelled")}
                          className="px-3 py-2 rounded-lg bg-yellow-100 text-yellow-600 text-sm font-semibold hover:bg-yellow-200 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                    {ride.status === "arriving" && (
                      <button
                        onClick={() => onUpdateStatus(ride.id, "in_progress")}
                        className="w-full px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm font-semibold hover:bg-yellow-700 transition"
                      >
                        Iniciar Corrida
                      </button>
                    )}
                    {ride.status === "in_progress" && (
                      <button
                        onClick={() => onUpdateStatus(ride.id, "completed")}
                        className="w-full px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm font-semibold hover:bg-yellow-700 transition"
                      >
                        Concluir Corrida
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Corridas pendentes */}
        {pendingRides.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 animate-pulse" />
              Corridas Disponíveis ({pendingRides.length})
            </h2>
            <div className="space-y-2">
              {pendingRides.map((ride) => (
                <div
                  key={ride.id}
                  className={`bg-white rounded-xl shadow-md border-2 border-yellow-300 overflow-hidden transition transform hover:scale-102 ${
                    expandedRideId === ride.id ? "ring-2 ring-yellow-400" : ""
                  }`}
                >
                  <div className="p-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
                          {STATUS_LABELS[ride.status]}
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-gradient-to-r ${getCategoryColor(ride.category)} text-white`}>
                          {getCategoryLabel(ride.category)}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-yellow-600">{ride.fare_kz} Kz</div>
                    </div>

                    {/* Localização */}
                    <div className="space-y-1 mb-2">
                      <div className="flex gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 line-clamp-1">{ride.pickup_address}</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <Navigation2 className="h-4 w-4 text-gray-400 rotate-45 flex-shrink-0 mt-0.5" />
                      </div>
                      <div className="flex gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 line-clamp-1">{ride.dropoff_address}</span>
                      </div>
                    </div>

                    {/* Detalhes */}
                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="font-bold text-yellow-600">{ride.distance_km?.toFixed(1) || "?"}</p>
                        <p className="text-gray-600">km</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="font-bold text-yellow-600">{ride.duration_min || "?"}</p>
                        <p className="text-gray-600">min</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="font-bold text-yellow-600">{ride.fare_kz}</p>
                        <p className="text-gray-600">Kz</p>
                      </div>
                    </div>

                    {/* Botão de aceitar */}
                    <button
                      onClick={() => handleAcceptRide(ride.id)}
                      disabled={acceptingRideId === ride.id}
                      className="w-full px-4 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {acceptingRideId === ride.id ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Aceitando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          Aceitar Corrida
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Nenhuma corrida disponível</p>
            <p className="text-sm text-gray-500">Novas corridas aparecerão aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}
