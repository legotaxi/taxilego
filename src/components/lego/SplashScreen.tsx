import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import legoLogo from "@/assets/legotaxi-logo.png.asset.json";

/**
 * SplashScreen - Animação de entrada estilo Uber para o Lego Taxi
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
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0b0b0d] transition-all duration-700 ease-in-out",
        stage === "exit" ? "opacity-0 scale-110 pointer-events-none" : "opacity-100 scale-100"
      )}
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Logo Container */}
      <div className="relative flex flex-col items-center">
        {/* Animated Line (Uber style) */}
        <div 
          className={cn(
            "h-1 bg-primary rounded-full transition-all duration-1000 ease-out mb-8",
            stage === "initial" ? "w-0 opacity-0" : "w-24 opacity-100"
          )} 
        />

        {/* Text Logo */}
        <div className="flex flex-col items-center overflow-hidden">
          <h1 
            className={cn(
              "font-display text-5xl font-black tracking-tighter text-white transition-all duration-1000 ease-out",
              stage === "initial" ? "translate-y-20 opacity-0" : "translate-y-0 opacity-100"
            )}
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            LEGO <span className="text-primary">TAXI</span>
          </h1>
          
          <p 
            className={cn(
              "mt-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 transition-all duration-1000 delay-300 ease-out",
              stage === "initial" ? "translate-y-10 opacity-0" : "translate-y-0 opacity-100"
            )}
          >
            Mobilidade Premium
          </p>
        </div>

        {/* Progress bar at the bottom */}
        <div className="absolute -bottom-24 w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full bg-primary transition-all duration-[2000ms] ease-linear",
              stage === "initial" ? "w-0" : "w-full"
            )} 
          />
        </div>
      </div>

      {/* Footer Branding */}
      <div 
        className={cn(
          "absolute bottom-12 transition-all duration-1000 delay-500 ease-out",
          stage === "initial" ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
            by Repair Lubatec
          </span>
          <div className="h-1 w-1 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
