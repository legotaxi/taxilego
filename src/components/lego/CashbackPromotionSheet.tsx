import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Gift, Wallet, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CashbackPromotionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CashbackPromotionSheet({ open, onOpenChange }: CashbackPromotionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-[28px] border-0 bg-[#0a0f1e] p-0 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]",
          "max-h-[85vh] overflow-y-auto scrollbar-hide"
        )}
      >
        {/* Decorative top glow */}
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-[28px] bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 opacity-80" />

        <div className="px-6 pt-8 pb-10">
          {/* Hero badge */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_8px_32px_rgba(59,130,246,0.35)]">
            <Gift className="h-10 w-10 text-white" strokeWidth={1.5} />
          </div>

          <SheetHeader className="space-y-3 text-center">
            <SheetTitle className="font-display text-[28px] leading-tight text-white">
              CASHBACK LEGO
            </SheetTitle>
            <SheetDescription className="text-[15px] leading-relaxed text-white/60">
              Ganhe em todas as viagens
            </SheetDescription>
          </SheetHeader>

          {/* Big 10% highlight */}
          <div className="mt-8 flex items-center justify-center">
            <div className="relative">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-400/20 to-blue-600/10 ring-1 ring-blue-400/30 backdrop-blur-sm">
                <span className="font-display text-[48px] leading-none text-white">
                  10%
                </span>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                EM CADA VIAGEM
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-10 space-y-4">
            <Step
              icon={<Wallet className="h-5 w-5 text-blue-300" />}
              title="Pague a viagem"
              desc="Use o LegoTaxi normalmente e pague pelo valor da corrida."
            />
            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-white/20 rotate-90" />
            </div>
            <Step
              icon={<Gift className="h-5 w-5 text-emerald-400" />}
              title="Receba 10% de volta"
              desc="O valor é creditado automaticamente na sua Carteira Lego."
            />
            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-white/20 rotate-90" />
            </div>
            <Step
              icon={<CheckCircle2 className="h-5 w-5 text-blue-300" />}
              title="Use em viagens futuras"
              desc="O saldo acumulado desconta do valor da próxima corrida."
            />
          </div>

          {/* Info card */}
          <div className="mt-8 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <p className="text-[13px] leading-relaxed text-white/70 text-center">
              A cada viagem que fizer,{" "}
              <span className="font-semibold text-white">10% do valor pago</span>{" "}
              será creditado na sua{" "}
              <span className="font-semibold text-blue-300">Carteira Lego</span>. Pode
              usar esse saldo em viagens futuras e pagar sempre menos.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => onOpenChange(false)}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(59,130,246,0.35)] active:scale-[0.98] transition-transform"
          >
            Entendi
          </button>
        </div>

        {/* Home indicator */}
        <div className="pointer-events-none flex h-6 shrink-0 items-center justify-center">
          <div className="h-1 w-28 rounded-full bg-white/20" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Step({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
        {icon}
      </div>
      <div>
        <p className="text-[14px] font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-white/50">{desc}</p>
      </div>
    </div>
  );
}
