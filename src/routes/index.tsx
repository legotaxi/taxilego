import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Star, Users, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.mp4.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lego Taxi · Mobilidade premium em Angola" },
      {
        name: "description",
        content:
          "Lego Taxi é a plataforma de mobilidade nº1 de Angola. MotoTáxi, Carro, XL e Entregas em Luanda — pague em Kwanzas, Multicaixa Express ou Carteira.",
      },
      { property: "og:title", content: "Lego Taxi · Mobilidade premium em Angola" },
      {
        property: "og:description",
        content: "Peça uma corrida em segundos. Em qualquer lugar de Angola.",
      },
    ],
  }),
  beforeLoad: async () => {
    // Se o utilizador já está logado, redireciona para a página apropriada
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      // Verificar se é admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      const isAdmin = (roles || []).some((r: { role: string }) => r.role === "admin");
      if (isAdmin) {
        throw redirect({ to: "/admin-console" });
      }

      // Verificar se é motorista
      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (driver) {
        throw redirect({ to: "/painel-motorista" });
      }

      // Caso contrário, é passageiro
      throw redirect({ to: "/minhas-corridas" });
    }
  },
  component: Landing,
});

function Landing() {
  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
      {/* Full-screen looping motion background */}
      <video
        src={heroBg.url}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Gradient overlays for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />

      <div className="relative z-10 flex flex-col items-center max-w-2xl gap-6">
        {/* Logo & Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-2xl ring-2 ring-primary/40">
            <span className="font-display text-2xl font-black text-primary">L</span>
          </div>
          <div>
            <h1 className="font-display text-5xl font-black leading-tight tracking-tighter text-white drop-shadow-lg sm:text-6xl">
              Lego <span className="text-primary">Taxi</span>
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-sm font-medium text-white/80 leading-snug">
              A mobilidade premium de Angola, na palma da sua mão.
            </p>
          </div>
        </div>

        {/* Main CTA Buttons */}
        <div className="w-full max-w-sm space-y-3">
          <a
            href="/passageiro"
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 font-display text-base font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] shadow-2xl"
          >
            <Users className="h-5 w-5" />
            App de Passageiro
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </a>

          <a
            href="/motorista"
            className="group flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-white/40 bg-white/5 py-4 font-display text-base font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 active:scale-[0.98]"
          >
            <Zap className="h-5 w-5" />
            App de Motorista
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </a>
        </div>

        {/* Stats Bar */}
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
            <div className="font-display font-black">24/7</div>
            <div className="text-[10px] uppercase tracking-widest text-white/60">Suporte</div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 z-10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
        © 2026 Lego Mobility · 🇦🇴 Luanda, Angola
      </footer>
    </main>
  );
}
