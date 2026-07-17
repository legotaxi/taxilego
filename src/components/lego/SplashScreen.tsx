import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * SplashScreen — Animação de entrada fullscreen profissional e elegante
 * Apresenta o logótipo oficial do LegoTaxi com animações suaves e sofisticadas.
 * Fundo preto puro (#000000) para máxima elegância e contraste com o logótipo amarelo.
 */
export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<"initial" | "logo" | "exit">("initial");

  useEffect(() => {
    // Sequência de animação profissional
    const timer1 = setTimeout(() => setStage("logo"), 150);
    const timer2 = setTimeout(() => setStage("exit"), 2800);
    const timer3 = setTimeout(() => onComplete(), 3500);

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
        stage === "exit" ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      )}
    >
      {/* Ambient Glow Effect — subtil, em amarelo dourado para complementar o logo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/3 rounded-full blur-[200px] animate-pulse" />
      </div>

      {/* Logo Container — centrado e elegante */}
      <div className="relative flex flex-col items-center justify-center z-10">
        {/* Animated Accent Line — amarelo dourado, elegante */}
        <div
          className={cn(
            "h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent rounded-full transition-all duration-1200 ease-out mb-12",
            stage === "initial" ? "w-0 opacity-0" : "w-40 opacity-100"
          )}
        />

        {/* Logo Image — profissional e elegante */}
        <div className="flex flex-col items-center overflow-hidden">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663542205007/yewxuzQSnBMokOqu.jpg"
            alt="LegoTaxi - Mobilidade e Conforto"
            className={cn(
              "h-72 w-auto object-contain transition-all duration-1200 ease-out drop-shadow-2xl",
              stage === "initial" ? "translate-y-24 opacity-0 scale-90" : "translate-y-0 opacity-100 scale-100"
            )}
          />

          {/* Tagline — elegante e minimalista */}
          <p
            className={cn(
              "mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-yellow-500/60 transition-all duration-1200 delay-200 ease-out",
              stage === "initial" ? "translate-y-12 opacity-0" : "translate-y-0 opacity-100"
            )}
          >
            Mobilidade e Conforto
          </p>
        </div>

        {/* Elegant Progress Indicator — barra de progresso minimalista */}
        <div className="absolute -bottom-32 w-56 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 transition-all duration-[2400ms] ease-linear",
              stage === "initial" ? "w-0" : "w-full"
            )}
          />
        </div>
      </div>

      {/* Footer Branding — elegante e discreto */}
      <div
        className={cn(
          "absolute bottom-12 transition-all duration-1000 delay-600 ease-out",
          stage === "initial" ? "opacity-0 translate-y-6" : "opacity-100 translate-y-0"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="h-0.5 w-6 rounded-full bg-yellow-500/40" />
          <span className="text-[8px] font-bold uppercase tracking-widest text-white/25">
            LegoTaxi Angola
          </span>
          <div className="h-0.5 w-6 rounded-full bg-yellow-500/40" />
        </div>
      </div>
    </div>
  );
}
