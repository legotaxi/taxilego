import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Apoio ao Cliente · Lego Taxi" },
      {
        name: "description",
        content:
          "Centro de apoio Lego Taxi: contactos, perguntas frequentes e ajuda para passageiros e motoristas em Angola.",
      },
      { property: "og:title", content: "Apoio ao Cliente · Lego Taxi" },
      {
        property: "og:description",
        content: "Fale connosco por email, telefone ou WhatsApp. Apoio 24/7.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

const FAQ = [
  {
    q: "Como é calculado o preço da viagem?",
    a: "Taxa base de 500 Kz + 150 Kz por quilómetro + 20 Kz por minuto, calculados com GPS em tempo real.",
  },
  {
    q: "Como funciona o cashback?",
    a: "Em cada viagem recebe 10% do valor pago na sua Carteira Lego, utilizável em viagens futuras.",
  },
  {
    q: "Posso falar com o motorista sem revelar o meu número?",
    a: "Sim. A chamada é feita por internet (VoIP) dentro da app e os números nunca são expostos.",
  },
  {
    q: "Como me torno motorista Lego?",
    a: "Registe-se na app como motorista, envie os documentos e o veículo, e aguarde a aprovação da nossa equipa.",
  },
  {
    q: "Como elimino a minha conta?",
    a: "Siga as instruções na página Eliminar Conta.",
  },
];

function SupportPage() {
  return (
    <main className="min-h-dvh bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-primary">
            ← Lego Taxi
          </Link>
          <h1 className="font-display text-4xl font-black tracking-tighter">Apoio ao Cliente</h1>
          <p className="text-sm text-muted-foreground">Estamos disponíveis 24 horas por dia, 7 dias por semana.</p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <Contact icon={<Mail className="h-5 w-5" />} label="Email" value="suporte@legotaxi.ao" href="mailto:suporte@legotaxi.ao" />
          <Contact icon={<Phone className="h-5 w-5" />} label="Telefone" value="+244 900 000 000" href="tel:+244900000000" />
          <Contact icon={<MessageCircle className="h-5 w-5" />} label="WhatsApp" value="+244 900 000 000" href="https://wa.me/244900000000" />
          <Contact icon={<MapPin className="h-5 w-5" />} label="Morada" value="Lubango / Luanda, Angola" />
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-black tracking-tight">Perguntas frequentes</h2>
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-1 font-bold">{item.q}</h3>
              <p className="text-sm text-foreground/85">{item.a}</p>
            </div>
          ))}
        </section>

        <nav className="flex flex-wrap gap-4 border-t border-border pt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Link to="/privacidade" className="hover:text-primary">Privacidade</Link>
          <Link to="/termos" className="hover:text-primary">Termos</Link>
          <Link to="/ajuda" className="hover:text-primary">Apoio</Link>
          <Link to="/eliminar-conta" className="hover:text-primary">Eliminar conta</Link>
        </nav>
      </div>
    </main>
  );
}

function Contact({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="transition hover:opacity-80">
      {body}
    </a>
  ) : (
    body
  );
}
