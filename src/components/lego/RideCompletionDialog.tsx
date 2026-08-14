import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Star, Wallet, X, User } from "lucide-react";
import { toast } from "sonner";
import { confirmRidePayment, rateDriver, getRideSummary } from "@/lib/ride-payment.functions";

interface RideCompletionDialogProps {
  rideId: string;
  fareKz: number;
  paymentMethod: string;
  role: "passenger" | "driver";
  driverName?: string;
  passengerName?: string;
  initiallyPaid?: boolean;
  initialCashbackKz?: number;
  initialRating?: number | null;
  onClose: () => void;
  onPaid?: (cashbackKz: number) => void;
}

const METHOD_LABEL: Record<string, string> = {
  cash: "Dinheiro",
  wallet: "Carteira Lego",
  mcx_express: "Multicaixa Express",
  reference: "Referência",
  card: "Cartão",
};

/**
 * Dialog mostrado a ambos passageiro e motorista quando a corrida termina.
 * - Motorista: vê o preço, confirma recebimento E VÊ A CLASSIFICAÇÃO do passageiro.
 * - Passageiro: vê o preço, paga, recebe cashback 10% e classifica o motorista.
 */
export function RideCompletionDialog({
  rideId,
  fareKz,
  paymentMethod,
  role,
  driverName,
  passengerName,
  initiallyPaid = false,
  initialCashbackKz = 0,
  initialRating = null,
  onClose,
  onPaid,
}: RideCompletionDialogProps) {
  const confirmPayment = useServerFn(confirmRidePayment);
  const rateFn = useServerFn(rateDriver);
  const getSummaryFn = useServerFn(getRideSummary);

  const [paid, setPaid] = useState(initiallyPaid);
  const [cashback, setCashback] = useState(initialCashbackKz);
  const [paying, setPaying] = useState(false);
  const [rating, setRating] = useState<number | null>(initialRating);
  const [hover, setHover] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Para o motorista: carregar a classificação do passageiro
  const [driverRating, setDriverRating] = useState<number | null>(null);
  const [loadingRating, setLoadingRating] = useState(false);

  // Carregar classificação do passageiro quando o motorista abre o dialog
  useEffect(() => {
    if (role === "driver" && initialRating === null) {
      setLoadingRating(true);
      getSummaryFn({ data: { ride_id: rideId } })
        .then((res) => {
          if (res.ride) {
            setDriverRating(res.ride.driver_rating ?? null);
          }
        })
        .finally(() => setLoadingRating(false));
    }
  }, [role, rideId, initialRating, getSummaryFn]);

  // Auto-confirm payment for driver-side as soon as dialog opens
  useEffect(() => {
    if (!paid && role === "driver") {
      handlePay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePay() {
    if (paid || paying) return;
    setPaying(true);
    try {
      const res = await confirmPayment({ data: { ride_id: rideId } });
      if (res.ok) {
        setPaid(true);
        const cb = res.cashback_kz ?? 0;
        setCashback(cb);
        onPaid?.(cb);
        if (role === "passenger" && cb > 0) {
          toast.success(
            `Pagamento registado · Cashback de Kz ${cb.toLocaleString("pt-PT")} na carteira`,
          );
        }
      } else {
        toast.error(res.error ?? "Erro ao registar pagamento");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro inesperado ao processar pagamento");
    } finally {
      setPaying(false);
    }
  }

  async function handleRate(stars: number) {
    if (submittingRating || rating === stars) return;
    setSubmittingRating(true);
    try {
      const res = await rateFn({ data: { ride_id: rideId, stars } });
      if (res.ok) {
        setRating(stars);
        toast.success("Obrigado pela sua classificação!");
      } else {
        toast.error(res.error ?? "Erro ao classificar");
      }
    } finally {
      setSubmittingRating(false);
    }
  }

  const fmt = (v: number) => `Kz ${Number(v).toLocaleString("pt-PT")}`;

  // Render de estrelas para leitura (não clicável)
  const StarDisplay = ({ value }: { value: number }) => (
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-6 w-6 ${s <= value ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="ml-2 text-lg font-black">{value.toFixed(1)}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full overflow-hidden rounded-t-3xl bg-background shadow-2xl sm:max-w-md sm:rounded-3xl border border-border">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-muted-foreground hover:bg-muted transition"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-b from-primary/10 to-transparent px-6 pt-8 pb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold">Corrida concluída</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {role === "driver"
              ? "Receba o pagamento e veja a avaliação do passageiro."
              : "Obrigado por viajar com a Lego Taxi."}
          </p>
        </div>

        {/* Fare */}
        <div className="px-6">
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {role === "driver" ? "Valor recebido" : "Total a pagar"}
            </p>
            <p className="mt-1 font-display text-4xl font-black tracking-tight text-primary">
              {fmt(fareKz)}
            </p>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-600">
              <div className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
              Preço Garantido LegoTaxi
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Pagamento por <span className="font-semibold">{METHOD_LABEL[paymentMethod] ?? paymentMethod}</span>
            </p>
          </div>
        </div>

        {/* ===== MOTORISTA: CLASSIFICAÇÃO DO PASSAGEIRO ===== */}
        {role === "driver" && (
          <div className="px-6 pt-4">
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Classificação do Passageiro
              </p>

              {loadingRating ? (
                <div className="mt-3 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">A carregar...</span>
                </div>
              ) : driverRating !== null && driverRating > 0 ? (
                <>
                  <div className="mt-3">
                    <StarDisplay value={driverRating} />
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>
                      {passengerName ?? "Passageiro"} classificou esta corrida com{" "}
                      <span className="font-bold text-primary">{driverRating}</span> estrela{driverRating !== 1 ? "s" : ""}
                    </span>
                  </div>
                </>
              ) : (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground/60">
                    Aguardando classificação do passageiro...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Passenger payment block */}
        {role === "passenger" && (
          <div className="px-6 pt-4">
            {!paid ? (
              <button
                onClick={handlePay}
                disabled={paying}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow active:scale-[0.98] transition disabled:opacity-60"
              >
                {paying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> A processar…
                  </>
                ) : (
                  <>Confirmar pagamento</>
                )}
              </button>
            ) : (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Cashback creditado
                  </span>
                </div>
                <p className="mt-1 font-display text-2xl font-black">+ {fmt(cashback)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  10% de volta · saldo utilizável dentro do app
                </p>
              </div>
            )}
          </div>
        )}

        {/* Driver receipt state */}
        {role === "driver" && (
          <div className="px-6 pt-4">
            <div className="rounded-2xl border border-border bg-muted/40 p-3 text-center text-xs">
              {paying && !paid ? (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> A registar recebimento…
                </span>
              ) : paid ? (
                <span className="font-semibold text-primary">
                  Pagamento registado · Kz {Number(fareKz * 0.9).toLocaleString("pt-AO")} creditados (90%)
                </span>
              ) : (
                <button onClick={handlePay} className="font-semibold text-primary underline">
                  Registar recebimento
                </button>
              )}
            </div>
          </div>
        )}

        {/* Rating (passenger only) */}
        {role === "passenger" && paid && (
          <div className="px-6 pt-4 pb-2">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Classifique {driverName ?? "o motorista"}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => {
                const filled = (hover ?? rating ?? 0) >= s;
                return (
                  <button
                    key={s}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => handleRate(s)}
                    disabled={submittingRating}
                    className="p-1 transition active:scale-90 disabled:opacity-50"
                    aria-label={`${s} estrelas`}
                  >
                    <Star
                      className={[
                        "h-8 w-8 transition",
                        filled ? "fill-primary text-primary" : "text-muted-foreground/40",
                      ].join(" ")}
                    />
                  </button>
                );
              })}
            </div>
            {rating !== null && (
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Obrigado! Avaliou com {rating} {rating === 1 ? "estrela" : "estrelas"}.
              </p>
            )}
          </div>
        )}

        <div className="px-6 pb-6 pt-4">
          <button
            onClick={onClose}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground hover:bg-muted transition"
          >
            {role === "passenger" && paid ? "Concluído" : "Fechar"}
          </button>
        </div>
      </div>
    </div>
  );
}
