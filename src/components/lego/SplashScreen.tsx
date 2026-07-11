import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import legoLogo from "@/assets/legotaxi-logo.png.asset.json";

/**
 * SplashScreen — Animação de entrada fullscreen com fundo preto puro
 * O fundo é #000000 (preto puro) para combinar exactamente com o fundo do logo,
 * eliminando qualquer disparidade visual entre o logo e o splash screen.
 */
export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<"initial" | "logo" | "exit">("initial");

  useEffect(() => {
    // Sequência de animação
    const timer1 = setTimeout(() => setStage("logo"), 100);
    const timer2 = setTimeout(() => setStage("exit"), 2500);
    const timer3 = setTimeout(() => onComplete(), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-all duration-700 ease-in-out",
        stage === "exit" ? "opacity-0 scale-110 pointer-events-none" : "opacity-100 scale-100"
      )}
    >
      {/* Background Glow Effect — subtil, em amarelo dourado para complementar o logo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-600/5 rounded-full blur-[150px] animate-pulse" />
      </div>

      {/* Logo Container — centrado e fullscreen */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Animated Line */}
        <div
          className={cn(
            "h-1 bg-yellow-500 rounded-full transition-all duration-1000 ease-out mb-8",
            stage === "initial" ? "w-0 opacity-0" : "w-32 opacity-100"
          )}
        />

        {/* Logo — maior para preencher o ecrã */}
        <div className="flex flex-col items-center overflow-hidden">
          <img
            src={legoLogo.url}
            alt="Lego Taxi"
            className={cn(
              "h-64 w-auto object-contain transition-all duration-1000 ease-out",
              stage === "initial" ? "translate-y-20 opacity-0 scale-95" : "translate-y-0 opacity-100 scale-100"
            )}
          />

          <p
            className={cn(
              "mt-6 text-[11px] font-bold uppercase tracking-[0.4em] text-white/40 transition-all duration-1000 delay-300 ease-out",
              stage === "initial" ? "translate-y-10 opacity-0" : "translate-y-0 opacity-100"
            )}
          >
            Mobilidade Premium
          </p>
        </div>

        {/* Progress bar — amarelo dourado para combinar com o logo */}
        <div className="absolute -bottom-28 w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full bg-yellow-500 transition-all duration-[2000ms] ease-linear",
              stage === "initial" ? "w-0" : "w-full"
            )}
          />
        </div>
      </div>

      {/* Footer Branding */}
      <div
        className={cn(
          "absolute bottom-16 transition-all duration-1000 delay-500 ease-out",
          stage === "initial" ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-yellow-500" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
            by Repair Lubatec
          </span>
          <div className="h-1 w-1 rounded-full bg-yellow-500" />
        </div>
      </div>
    </div>
  );
}
