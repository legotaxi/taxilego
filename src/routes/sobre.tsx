import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Heart, Globe2, Award } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre nós · Lego Taxi" },
      {
        name: "description",
        content:
          "Lego Taxi é uma plataforma 100% angolana de mobilidade, criada para conectar passageiros e motoristas com tecnologia local de classe mundial.",
      },
      { property: "og:title", content: "Sobre o Lego Taxi" },
      { property: "og:description", content: "100% angolana. Mobilidade premium para todos." },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: Heart,
    title: "Feito por angolanos",
    desc: "Equipa local, suporte em Português, soluções para a nossa realidade.",
  },
  {
    icon: Target,
    title: "Preços justos",
    desc: "Tarifas transparentes em Kwanzas. Sem surpresas, sem inflação.",
  },
  {
    icon: Globe2,
    title: "Cobertura nacional",
    desc: "Luanda, Benguela, Huambo, Lobito, Lubango — e a crescer.",
  },
  {
    icon: Award,
    title: "Qualidade premium",
    desc: "Motoristas verificados, viaturas inspeccionadas, padrão internacional.",
  },
];

function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground">
              <span className="font-display text-lg font-black text-primary">L</span>
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Lego Taxi</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Voltar
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-soft">
          🇦🇴 Orgulhosamente angolano
        </div>
        <h1 className="mt-6 font-display text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl text-balance">
          Mobilidade que{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">move Angola</span>.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground text-balance">
          Fundado em Luanda em 2025, o Lego Taxi nasceu para responder a uma realidade simples: os
          angolanos merecem mobilidade premium, justa e construída para a nossa terra.
        </p>
      </section>

      <section className="bg-foreground py-20 text-background">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                A nossa missão
              </div>
              <h2 className="mt-2 font-display text-4xl font-bold sm:text-5xl text-balance">
                Conectar Angola, uma corrida de cada vez.
              </h2>
              <p className="mt-5 text-lg text-background/70">
                Acreditamos que a mobilidade é a base do progresso. Por isso construímos tecnologia
                que funciona com a nossa rede, fala a nossa língua e respeita a nossa moeda.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-background/5 p-6 ring-1 ring-background/10">
                <div className="font-display text-4xl font-black text-primary">2025</div>
                <div className="mt-1 text-sm text-background/70">Ano de fundação</div>
              </div>
              <div className="rounded-2xl bg-background/5 p-6 ring-1 ring-background/10">
                <div className="font-display text-4xl font-black text-primary">5</div>
                <div className="mt-1 text-sm text-background/70">Províncias activas</div>
              </div>
              <div className="rounded-2xl bg-background/5 p-6 ring-1 ring-background/10">
                <div className="font-display text-4xl font-black text-primary">120k+</div>
                <div className="mt-1 text-sm text-background/70">Corridas concluídas</div>
              </div>
              <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
                <div className="font-display text-4xl font-black">100%</div>
                <div className="mt-1 text-sm">Capital angolano</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Os nossos valores
            </div>
            <h2 className="mt-2 font-display text-4xl font-bold sm:text-5xl">O que nos move.</h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elevated"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
