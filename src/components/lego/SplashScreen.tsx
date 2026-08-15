import { useEffect } from "react";
import logoAsset from "@/assets/legotaxi-logo.png.asset.json";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 1600);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-foreground">
      <img
        src={logoAsset.url}
        alt="Lego Taxi"
        className="h-28 w-28 animate-pulse object-contain"
      />
      <div className="mt-6 font-display text-2xl font-black tracking-tight text-primary">
        Lego Taxi
      </div>
      <div className="mt-2 text-xs uppercase tracking-[0.3em] text-background/60">
        Mobilidade em Angola
      </div>
    </div>
  );
}
