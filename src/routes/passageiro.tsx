import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, MapPin, Star, Shield } from "lucide-react";
import heroBg from "@/assets/hero-bg.mp4.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useNativeShell } from "@/hooks/use-native-shell";


export const Route = createFileRoute("/passageiro")({
  head: () => ({
    meta: [
      { title: "Lego Taxi Passageiro · Peça a sua boleia" },
      {
        name: "description",
        content:
          "App de passageiro Lego Taxi. Peça MotoTáxi, Carro, XL ou Entregas em Luanda. Pague em Kwanzas, Multicaixa Express ou Carteira.",
      },
      { property: "og:title", content: "Lego Taxi Passageiro" },
      { property: "og:description", content: "Peça uma corrida em segundos." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      const isAdmin = (roles || []).some((r: { role: string }) => r.role === "admin");
      if (isAdmin) throw redirect({ to: "/admin-console" });
      throw redirect({ to: "/minhas-corridas" });
    }
  },
  component: PassengerLanding,
});

function PassengerLanding() {
  useNativeShell();
  return (

    <main className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
      <video
        src={heroBg.url}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />

      <div className="relative z-10 flex flex-col items-center max-w-2xl gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-2xl ring-2 ring-primary/40">
            <span className="font-display text-2xl font-black text-primary">L</span>
          </div>
          <div>
            <h1 className="font-display text-5xl font-black leading-tight tracking-tighter text-white drop-shadow-lg sm:text-6xl">
              Lego <span className="text-primary">Passageiro</span>
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-sm font-medium text-white/80 leading-snug">
              Peça a sua boleia em segundos, em qualquer lugar de Angola.
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <Link
            to="/passageiro-auth"
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 font-display text-base font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] shadow-2xl"
          >
            <MapPin className="h-5 w-5" />
            Entrar / Criar conta
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="flex items-center gap-5 text-sm text-white">
          <div className="text-center">
            <div className="font-display font-black">+120k</div>
            <div className="text-[10px] uppercase tracking-widest text-white/60">Viagens</div>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 font-display font-black">
              <Star className="h-4 w-4 fill-primary text-primary" />
              4.9
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/60">Avaliação</div>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 font-display font-black">
              <Shield className="h-4 w-4 text-primary" />
              SOS
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/60">Segurança</div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 z-10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
        © 2026 Lego Mobility · 🇦🇴 Luanda, Angola
      </footer>
    </main>
  );
}
