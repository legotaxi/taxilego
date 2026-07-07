import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import driverBg from "@/assets/driver-bg.mp4.asset.json";

export const Route = createFileRoute("/motoristas")({
  head: () => ({
    meta: [
      { title: "Conduza com Lego Taxi · Ganhe mais em Angola" },
      {
        name: "description",
        content:
          "Junte-se à maior frota de Angola. Comissões justas, pagamento semanal, suporte 24/7.",
      },
      { property: "og:title", content: "Conduza com Lego Taxi" },
      { property: "og:description", content: "Comissões justas, pagamento semanal, suporte 24/7." },
    ],
  }),
  component: DriversPage,
});

function DriversPage() {
  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden bg-black text-white">
      {/* Full-screen looping driver background */}
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

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <span className="font-display text-lg font-black text-primary-foreground">L</span>
          </div>
          <span className="font-display text-base font-bold tracking-tight">Lego Taxi</span>
        </Link>
        <Link to="/" className="text-xs font-medium text-white/70 hover:text-white">
          ← Voltar
        </Link>
      </header>

      {/* Content */}
      <section className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-8">
        <div className="mx-auto w-full max-w-md space-y-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-medium backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            +3.500 motoristas activos em Angola
          </div>

          <h1 className="font-display text-4xl font-black leading-[1.02] tracking-tight drop-shadow-lg sm:text-5xl">
            Ganhe até <span className="text-primary">Kz 450.000</span> por mês.
          </h1>

          <p className="max-w-md text-sm text-white/75 leading-snug">
            Junte-se ao Lego Taxi e transforme o seu carro ou mota em renda. Comissões justas,
            pagamento semanal, suporte em Português de Angola.
          </p>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Link
              to="/motoristas-registo"
              className="group flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 active:scale-[0.98] shadow-2xl"
            >
              Quero ser motorista
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/motorista-auth"
              className="rounded-full border-2 border-white/30 bg-white/5 px-6 py-3.5 text-center text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 active:scale-[0.98]"
            >
              Já sou motorista
            </Link>
          </div>

          <div className="flex items-center gap-6 pt-4">
            <div>
              <div className="font-display text-2xl font-bold">15%</div>
              <div className="text-[10px] uppercase tracking-wider text-white/60">
                Comissão única
              </div>
            </div>
            <div className="h-9 w-px bg-white/20" />
            <div>
              <div className="font-display text-2xl font-bold">48h</div>
              <div className="text-[10px] uppercase tracking-wider text-white/60">Aprovação</div>
            </div>
            <div className="h-9 w-px bg-white/20" />
            <div>
              <div className="font-display text-2xl font-bold">7 dias</div>
              <div className="text-[10px] uppercase tracking-wider text-white/60">Pagamento</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
