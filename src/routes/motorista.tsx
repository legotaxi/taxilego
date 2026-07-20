import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Car, Star, Wallet, TrendingUp, Clock, Users } from "lucide-react";
import driverBg from "@/assets/driver-bg.mp4.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useNativeShell } from "@/hooks/use-native-shell";


export const Route = createFileRoute("/motorista")({
  head: () => ({
    meta: [
      { title: "Lego Taxi Motorista · Conduza e ganhe em Angola" },
      {
        name: "description",
        content:
          "App do motorista Lego Taxi. Comissões justas, pagamento semanal, suporte 24/7 em Angola.",
      },
      { property: "og:title", content: "Lego Taxi Motorista" },
      { property: "og:description", content: "Comissões justas, pagamento semanal, suporte 24/7." },
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
      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();
      if (driver) throw redirect({ to: "/painel-motorista" });
    }
  },
  component: DriverLanding,
});

function DriverLanding() {
  useNativeShell();
  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden bg-black text-white">
      {/* Background Video with Gradient Overlays */}
      <video
        src={driverBg.url}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      
      {/* Premium Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,193,7,0.05)_0%,transparent_50%)]" />

      {/* Main Content */}
      <section className="relative z-10 flex flex-1 flex-col justify-between px-5 py-8 overflow-y-auto">
        {/* Header Section */}
        <div className="space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-primary shadow-premium">
              <span className="font-display text-2xl font-black text-primary-foreground">L</span>
            </div>
            <div>
              <h1 className="font-display text-3xl font-black leading-tight tracking-tight">
                Lego <span className="text-primary">Motorista</span>
              </h1>
              <p className="text-xs text-white/60 font-medium">Conduza. Ganhe. Cresça.</p>
            </div>
          </div>

          {/* Active Drivers Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2 backdrop-blur-md animate-slide-down" style={{ animationDelay: "0.1s" }}>
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">+3.500 motoristas activos</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="font-display text-5xl font-black leading-tight tracking-tight drop-shadow-lg">
              Ganhe até <span className="text-primary">Kz 450.000</span> por mês
            </h2>
            <p className="text-base text-white/70 leading-relaxed font-medium">
              Comissões justas, pagamento semanal, suporte em Português de Angola.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-3 my-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          {/* Commission Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-4 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:from-white/15 hover:to-white/8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div className="font-display text-2xl font-black text-primary">15%</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Comissão</div>
            </div>
          </div>

          {/* Approval Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-4 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:from-white/15 hover:to-white/8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="font-display text-2xl font-black">48h</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Aprovação</div>
            </div>
          </div>

          {/* Rating Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-4 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:from-white/15 hover:to-white/8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <Star className="h-5 w-5 text-primary fill-primary" />
              </div>
              <div className="font-display text-2xl font-black">4.9</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Rating</div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="space-y-3 my-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <h3 className="font-display text-sm font-black uppercase tracking-wider text-white/60">Por que escolher Lego Taxi?</h3>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-3 backdrop-blur-sm transition-all hover:bg-white/8 hover:border-primary/20">
              <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Ganhos Transparentes</p>
                <p className="text-xs text-white/60">Sem taxas ocultas, comissão justa de 15%</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-3 backdrop-blur-sm transition-all hover:bg-white/8 hover:border-primary/20">
              <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Pagamento Semanal</p>
                <p className="text-xs text-white/60">Receba seus ganhos toda semana</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-3 backdrop-blur-sm transition-all hover:bg-white/8 hover:border-primary/20">
              <Users className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Suporte 24/7</p>
                <p className="text-xs text-white/60">Em Português de Angola, sempre disponível</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 pt-2 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <Link
            to="/motorista-auth"
            className="group relative overflow-hidden rounded-2xl bg-gradient-primary px-6 py-4 font-display text-base font-bold text-primary-foreground transition-all duration-300 hover:shadow-premium active:scale-[0.98] flex items-center justify-center gap-2 shadow-elevated"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            <Car className="h-5 w-5 relative z-10" />
            <span className="relative z-10">Entrar / Candidatar-se</span>
            <ArrowRight className="h-5 w-5 relative z-10 transition-transform group-hover:translate-x-1" />
          </Link>
          
          <Link
            to="/motoristas-registo"
            className="group rounded-2xl border-2 border-white/20 bg-white/5 px-6 py-3.5 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-primary/40 active:scale-[0.98]"
          >
            Saber mais sobre o registo
          </Link>
        </div>
      </section>
    </main>
  );
}
