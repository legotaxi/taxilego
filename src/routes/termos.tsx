import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Utilização (EULA) · Lego Taxi" },
      {
        name: "description",
        content:
          "Termos de utilização e licença de utilizador final da aplicação Lego Taxi — regras de serviço, pagamentos e responsabilidades.",
      },
      { property: "og:title", content: "Termos de Utilização · Lego Taxi" },
      {
        property: "og:description",
        content: "Condições de utilização da plataforma de mobilidade Lego Taxi em Angola.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="min-h-dvh bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-primary">
            ← Lego Taxi
          </Link>
          <h1 className="font-display text-4xl font-black tracking-tighter">
            Termos de Utilização
          </h1>
          <p className="text-sm text-muted-foreground">
            Inclui a Licença de Utilizador Final (EULA) · 15 de Agosto de 2026
          </p>
        </header>

        <section className="space-y-6">
          <Block title="1. Aceitação">
            Ao criar conta ou utilizar o Lego Taxi aceita estes Termos e a{" "}
            <Link to="/privacidade" className="font-semibold text-primary underline">
              Política de Privacidade
            </Link>
            . Se não concordar, não utilize o serviço.
          </Block>

          <Block title="2. O serviço">
            O Lego Taxi é uma plataforma tecnológica que liga passageiros a motoristas
            independentes (MotoTáxi, Carro, XL e Entregas). Não somos uma empresa de transporte; o
            transporte é prestado pelo motorista.
          </Block>

          <Block title="3. Contas">
            Deve ter 18 anos ou mais, fornecer informação verdadeira e manter a confidencialidade das
            credenciais. É responsável pela actividade da sua conta.
          </Block>

          <Block title="4. Preços e pagamentos">
            O preço é calculado com base numa taxa base de 500 Kz, 150 Kz por quilómetro e 20 Kz por
            minuto, podendo variar consoante a categoria e promoções. Pagamentos em Kwanzas,
            numerário, Multicaixa Express ou Carteira Lego. O cashback de 10% é creditado na Carteira
            Lego e apenas utilizável em viagens futuras, sem direito a levantamento.
          </Block>

          <Block title="5. Regras de conduta">
            É proibido usar a plataforma para fins ilícitos, transportar mercadorias proibidas,
            assediar outros utilizadores, criar contas falsas ou manipular preços e promoções. O
            incumprimento pode levar à suspensão imediata da conta.
          </Block>

          <Block title="6. Motoristas">
            Os motoristas devem manter documentação, seguro e veículo válidos e em condições, e estão
            sujeitos a aprovação e revisão contínua pela Lego Mobility.
          </Block>

          <Block title="7. Cancelamentos">
            Cancelamentos após a aceitação da viagem podem gerar taxa. Cancelamentos repetidos ou
            abusivos podem limitar o acesso ao serviço.
          </Block>

          <Block title="8. Licença (EULA)">
            Concedemos-lhe uma licença pessoal, limitada, não exclusiva, intransmissível e revogável
            para utilizar a aplicação num dispositivo que possua ou controle. Não pode copiar,
            modificar, descompilar, revender ou fazer engenharia inversa da app. Todos os direitos de
            propriedade intelectual pertencem à Lego Mobility.
          </Block>

          <Block title="9. Responsabilidade">
            Na máxima medida permitida por lei, a Lego Mobility não é responsável por danos
            indirectos decorrentes do serviço de transporte prestado por terceiros. Nada nestes
            Termos exclui direitos que não possam ser legalmente excluídos.
          </Block>

          <Block title="10. Alterações e lei aplicável">
            Podemos actualizar estes Termos; a utilização continuada representa aceitação. Aplica-se
            a lei da República de Angola.
          </Block>

          <Block title="11. Contacto">
            <strong>suporte@legotaxi.ao</strong> · Lego Mobility, Lubango / Luanda, Angola.
          </Block>
        </section>

        <FooterLinks />
      </div>
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-2 font-display text-lg font-black tracking-tight">{title}</h2>
      <div className="text-sm leading-relaxed text-foreground/85">{children}</div>
    </div>
  );
}

function FooterLinks() {
  return (
    <nav className="flex flex-wrap gap-4 border-t border-border pt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
      <Link to="/privacidade" className="hover:text-primary">Privacidade</Link>
      <Link to="/termos" className="hover:text-primary">Termos</Link>
      <Link to="/ajuda" className="hover:text-primary">Apoio</Link>
      <Link to="/eliminar-conta" className="hover:text-primary">Eliminar conta</Link>
    </nav>
  );
}
