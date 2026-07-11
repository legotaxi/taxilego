import { useState, useEffect } from "react";
import {
  MapPin,
  Navigation2,
  Clock,
  Banknote,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Banknote as CashIcon,
  CreditCard,
  Wallet,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getWallet } from "@/lib/wallet.functions";

interface RideRequestPanelProps {
  pickupAddress: string;
  dropoffAddress: string;
  distance: number;
  duration: number;
  fare: number;
  category: string;
  onSubmit: (paymentMethod: string) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

const PAYMENT_METHODS = [
  { id: "cash", icon: CashIcon, label: "Cash", color: "from-green-500 to-green-600" },
  { id: "mcx_express", icon: Smartphone, label: "Multicaixa Express", color: "from-blue-500 to-blue-600" },
  { id: "card", icon: CreditCard, label: "Cartão", color: "from-purple-500 to-purple-600" },
  { id: "wallet", icon: CreditCard, label: "Carteira", color: "from-orange-500 to-orange-600" },
];

/**
 * RideRequestPanel - Painel premium de pedido de corrida para passageiros
 * Layout otimizado para mobile sem sobreposições, com transições nativas
 */
export function RideRequestPanel({
  pickupAddress,
  dropoffAddress,
  distance,
  duration,
  fare,
  category,
  onSubmit,
  isSubmitting = false,
  error = null,
}: RideRequestPanelProps) {
  const fetchWallet = useServerFn(getWallet);
  const [selectedPayment, setSelectedPayment] = useState("cash");
  const [isExpanded, setIsExpanded] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    fetchWallet().then(res => setWalletBalance(res.balance));
  }, [fetchWallet]);

  const getCategoryColor = (cat: string): string => {
    const colors: Record<string, string> = {
      moto: "from-orange-500 to-orange-600",
      normal: "from-blue-500 to-blue-600",
      xl: "from-purple-500 to-purple-600",
      premium: "from-yellow-500 to-yellow-600",
      shared: "from-green-500 to-green-600",
      delivery: "from-red-500 to-red-600",
    };
    return colors[cat] || "from-gray-500 to-gray-600";
  };

  const getCategoryLabel = (cat: string): string => {
    const labels: Record<string, string> = {
      moto: "MotoTáxi",
      normal: "Normal",
      xl: "XL",
      premium: "Premium",
      shared: "Partilhada",
      delivery: "Entrega",
    };
    return labels[cat] || cat;
  };

  const handleSubmit = async () => {
    await onSubmit(selectedPayment);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl rounded-t-3xl shadow-premium transition-all duration-300 animate-slide-up">
      {/* Handle bar - Premium indicator */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="h-1.5 w-12 bg-border rounded-full" />
      </div>

      {/* Conteúdo com scroll controlado */}
      <div className="px-4 pb-6 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
        {/* Header com categoria - Premium gradient */}
        <div className={`bg-gradient-to-r ${getCategoryColor(category)} rounded-2xl p-4 text-white mb-6 shadow-elevated`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold">{getCategoryLabel(category)}</h3>
              <p className="text-xs opacity-75 font-medium">Tarifa estimada</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">{fare}</div>
              <p className="text-xs opacity-90 font-semibold">Kz</p>
            </div>
          </div>
        </div>

        {/* Informações da corrida - Premium layout */}
        <div className="space-y-4 mb-6 p-4 bg-muted/40 rounded-2xl border border-border/50">
          {/* Recolha */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 pt-1">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recolha</p>
              <p className="text-sm font-medium text-foreground line-clamp-2">{pickupAddress}</p>
            </div>
          </div>

          {/* Linha divisória com ícone */}
          <div className="flex gap-3 py-2">
            <div className="flex-shrink-0 flex justify-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-blue-400 to-red-400" />
            </div>
            <div className="flex-1" />
          </div>

          {/* Destino */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 pt-1">
              <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destino</p>
              <p className="text-sm font-medium text-foreground line-clamp-2">{dropoffAddress}</p>
            </div>
          </div>
        </div>

        {/* Detalhes da corrida - Premium cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Distância */}
          <div className="p-3 bg-card rounded-2xl border border-border/50 text-center hover:shadow-soft transition-all">
            <div className="text-lg font-bold text-primary">{distance.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground font-medium">km</p>
          </div>

          {/* Tempo */}
          <div className="p-3 bg-card rounded-2xl border border-border/50 text-center hover:shadow-soft transition-all">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-lg font-bold text-orange-600">{duration}</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">min</p>
          </div>

          {/* Tarifa */}
          <div className="p-3 bg-card rounded-2xl border border-border/50 text-center hover:shadow-soft transition-all">
            <div className="text-lg font-bold text-green-600">{fare}</div>
            <p className="text-xs text-muted-foreground font-medium">Kz</p>
          </div>
        </div>

        {/* Cashback Info Banner */}
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Cashback Lego 🔥</p>
            <p className="text-sm font-medium text-emerald-700">Ganhe <span className="font-bold">Kz {Math.round(fare * 0.1)}</span> de volta nesta viagem!</p>
          </div>
        </div>

        {/* Método de pagamento - Premium selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-foreground text-sm">Método de Pagamento</h4>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-muted rounded-lg transition-all duration-200 tap-highlight-none"
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Pagamento selecionado */}
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedPayment === method.id;
              const isWallet = method.id === "wallet";
              const hasBalance = isWallet && walletBalance !== null && walletBalance >= fare;
              
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  disabled={isWallet && walletBalance !== null && walletBalance < fare}
                  className={`w-full p-3 rounded-2xl border-2 transition-all duration-200 flex items-center gap-3 tap-highlight-none ${
                    isSelected
                      ? `border-primary bg-primary/10 shadow-soft`
                      : `border-border bg-card hover:border-border/80 hover:shadow-soft`
                  } ${isWallet && walletBalance !== null && walletBalance < fare ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                >
                  <div className={`p-2 rounded-lg ${
                    isSelected ? "bg-primary/20" : "bg-muted"
                  }`}>
                    <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {method.label}
                    </span>
                    {isWallet && walletBalance !== null && (
                      <span className={`text-[10px] ${walletBalance < fare ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                        Saldo: Kz {walletBalance.toLocaleString("pt-PT")} 
                        {walletBalance < fare && " (Insuficiente)"}
                      </span>
                    )}
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mensagem de erro - Premium alert */}
        {error && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/30 rounded-2xl flex items-start gap-2 animate-slide-down">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Botão de submissão - Premium CTA */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-gradient-to-r from-primary to-primary/90 hover:shadow-premium active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4 tap-highlight-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Pedindo Corrida...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              <span>Pedir Corrida</span>
            </>
          )}
        </button>

        {/* Informações adicionais */}
        <div className="text-xs text-muted-foreground text-center pb-2">
          <p>Você será notificado quando um motorista aceitar sua corrida</p>
        </div>
      </div>
    </div>
  );
}
