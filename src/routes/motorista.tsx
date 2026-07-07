import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Car, Star, Wallet } from "lucide-react";
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
      <video
        src={driverBg.url}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/65 to-black/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_100%)]" />

      <section className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-8">
        <div className="mx-auto w-full max-w-md space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-2xl">
              <span className="font-display text-xl font-black text-primary-foreground">L</span>
            </div>
            <div>
              <h1 className="font-display text-3xl font-black leading-none tracking-tight">
                Lego <span className="text-primary">Motorista</span>
              </h1>
              <p className="text-xs text-white/70">Conduza. Ganhe. Cresça.</p>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-medium backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            +3.500 motoristas activos
          </div>

          <h2 className="font-display text-4xl font-black leading-[1.02] tracking-tight drop-shadow-lg sm:text-5xl">
            Ganhe até <span className="text-primary">Kz 450.000</span> por mês.
          </h2>

          <p className="max-w-md text-sm text-white/75 leading-snug">
            Comissões justas, pagamento semanal, suporte em Português de Angola.
          </p>

          <div className="flex flex-col gap-3 pt-1">
            <Link
              to="/motorista-auth"
              className="group flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-display text-base font-bold text-primary-foreground transition hover:opacity-90 active:scale-[0.98] shadow-2xl"
            >
              <Car className="h-5 w-5" />
              Entrar / Candidatar-se
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/motoristas-registo"
              className="rounded-2xl border-2 border-white/30 bg-white/5 px-6 py-3.5 text-center text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 active:scale-[0.98]"
            >
              Saber mais sobre o registo
            </Link>
          </div>

          <div className="flex items-center gap-6 pt-4">
            <div>
              <div className="flex items-center gap-1 font-display text-2xl font-bold">
                <Wallet className="h-5 w-5 text-primary" />
                15%
              </div>
              <div className="text-[10px] uppercase tracking-wider text-white/60">Comissão</div>
            </div>
            <div className="h-9 w-px bg-white/20" />
            <div>
              <div className="font-display text-2xl font-bold">48h</div>
              <div className="text-[10px] uppercase tracking-wider text-white/60">Aprovação</div>
            </div>
            <div className="h-9 w-px bg-white/20" />
            <div>
              <div className="flex items-center gap-1 font-display text-2xl font-bold">
                <Star className="h-5 w-5 fill-primary text-primary" />
                4.9
              </div>
              <div className="text-[10px] uppercase tracking-wider text-white/60">Rating</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
