import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, Car, Truck, Package, Crown, Users, Check } from "lucide-react";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços e tarifas · Lego Taxi" },
      {
        name: "description",
        content:
          "Conheça todos os serviços Lego Taxi: MotoTáxi, Táxi Normal, XL, Premium, Partilhada e Entrega Express. Tarifas transparentes em Kwanzas.",
      },
      { property: "og:title", content: "Serviços e tarifas · Lego Taxi" },
      {
        property: "og:description",
        content: "MotoTáxi, Carro, XL, Premium e Entregas. Preços em Kwanzas.",
      },
    ],
  }),
  component: ServicesPage,
});

const services = [
  {
    icon: Bike,
    name: "MotoTáxi",
    tagline: "O mais rápido no trânsito",
    base: "300",
    perKm: "120",
    perMin: "25",
    capacity: "1 passageiro",
    features: ["Capacete incluído", "Ideal para pequenas entregas", "Disponível 24/7"],
  },
  {
    icon: Car,
    name: "Táxi Normal",
    tagline: "Conforto para o dia-a-dia",
    base: "500",
    perKm: "180",
    perMin: "40",
    capacity: "Até 4 passageiros",
    features: ["Ar condicionado", "Cobertura em toda Luanda", "Pagamento flexível"],
    popular: true,
  },
  {
    icon: Truck,
    name: "Táxi XL",
    tagline: "Para grupos e bagagem",
    base: "800",
    perKm: "260",
    perMin: "55",
    capacity: "Até 6 passageiros",
    features: ["SUV ou Minivan", "Espaço extra de bagagem", "Ideal para aeroporto"],
  },
  {
    icon: Crown,
    name: "Lego Premium",
    tagline: "A experiência executiva",
    base: "1.500",
    perKm: "420",
    perMin: "80",
    capacity: "Até 4 passageiros",
    features: ["Viaturas executivas pretas", "Motoristas seniores", "Água mineral grátis"],
  },
  {
    icon: Users,
    name: "Partilhada",
    tagline: "Mais barato, mais ecológico",
    base: "250",
    perKm: "90",
    perMin: "20",
    capacity: "1-2 passageiros",
    features: ["Partilhe a corrida", "Até 40% mais barato", "Rotas inteligentes"],
  },
  {
    icon: Package,
    name: "Entrega Express",
    tagline: "Encomendas em minutos",
    base: "400",
    perKm: "150",
    perMin: "30",
    capacity: "Até 20 kg",
    features: ["Recolha em 5 min", "Rastreamento ao vivo", "Comprovativo digital"],
  },
];

function ServicesPage() {
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

      <section className="mx-auto max-w-4xl px-5 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-soft">
          💰 Tarifas transparentes em Kwanzas
        </div>
        <h1 className="mt-6 font-display text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl text-balance">
          Um serviço para{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">cada momento</span>.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground text-balance">
          Do MotoTáxi rápido no Maianga ao Premium para o aeroporto. Preços justos, sem tarifa de
          pico abusiva.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.name}
              className={`relative flex flex-col rounded-3xl border-2 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elevated ${
                s.popular ? "border-primary bg-card" : "border-border bg-card"
              }`}
            >
              {s.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-soft">
                  Mais popular
                </span>
              )}
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${s.popular ? "bg-foreground text-primary" : "bg-primary text-primary-foreground"}`}
                >
                  <s.icon className="h-7 w-7" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.capacity}
                </span>
              </div>

              <h3 className="mt-5 font-display text-2xl font-bold">{s.name}</h3>
              <p className="text-sm text-muted-foreground">{s.tagline}</p>

              <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-muted p-3">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    Base
                  </div>
                  <div className="font-display text-sm font-bold">Kz {s.base}</div>
                </div>
                <div className="border-x border-border px-2">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    / km
                  </div>
                  <div className="font-display text-sm font-bold">Kz {s.perKm}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    / min
                  </div>
                  <div className="font-display text-sm font-bold">Kz {s.perMin}</div>
                </div>
              </div>

              <ul className="mt-5 space-y-2">
                {s.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/pedir"
                className={`mt-6 w-full rounded-full py-3 text-center font-display text-sm font-bold transition ${
                  s.popular
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-foreground text-background hover:opacity-90"
                }`}
              >
                Pedir {s.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Fine print */}
      <section className="mx-auto max-w-4xl px-5 pb-20">
        <div className="rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Como calculamos o preço</p>
          <p className="mt-2">
            Preço final = <strong>Tarifa base</strong> + (km percorridos × Kz/km) + (minutos ×
            Kz/min). Pode haver acréscimo dinâmico em horas de ponta (máx. +30%). Tarifas mínimas:
            Mota Kz 500, Carro Kz 800, XL Kz 1.200, Premium Kz 2.500. Valores em Kwanzas Angolanos
            (AOA).
          </p>
        </div>
      </section>
    </main>
  );
}
