import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade · Lego Taxi" },
      {
        name: "description",
        content:
          "Como a Lego Taxi recolhe, utiliza e protege os dados pessoais de passageiros e motoristas em Angola.",
      },
      { property: "og:title", content: "Política de Privacidade · Lego Taxi" },
      {
        property: "og:description",
        content: "Saiba como tratamos os seus dados pessoais na aplicação Lego Taxi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-primary">
            ← Lego Taxi
          </Link>
          <h1 className="font-display text-4xl font-black tracking-tighter">
            Política de Privacidade
          </h1>
          <p className="text-sm text-muted-foreground">Última actualização: 15 de Agosto de 2026</p>
        </header>

        <section className="space-y-6 text-sm leading-relaxed text-foreground/90">
          <p>
            A Lego Mobility (“Lego Taxi”, “nós”) opera a aplicação e plataforma de mobilidade Lego
            Taxi em Angola. Esta política explica que dados recolhemos, porquê, e quais são os seus
            direitos.
          </p>

          <Block title="1. Dados que recolhemos">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Conta:</strong> nome, número de telefone, email e palavra-passe encriptada.
              </li>
              <li>
                <strong>Localização:</strong> localização precisa do dispositivo enquanto pede,
                realiza ou acompanha uma viagem (motoristas: também em modo “disponível”).
              </li>
              <li>
                <strong>Viagens:</strong> origem, destino, distância, duração, preço e estado.
              </li>
              <li>
                <strong>Pagamentos:</strong> método escolhido, valores e saldo da Carteira Lego.
                Não armazenamos dados completos de cartões.
              </li>
              <li>
                <strong>Comunicações:</strong> mensagens de chat e chamadas VoIP dentro da app (os
                números de telefone nunca são expostos entre as partes).
              </li>
              <li>
                <strong>Motoristas:</strong> documentos de habilitação, dados do veículo e estado de
                aprovação.
              </li>
              <li>
                <strong>Técnicos:</strong> modelo do dispositivo, identificadores de notificações
                push e registos de erros.
              </li>
            </ul>
          </Block>

          <Block title="2. Como utilizamos os dados">
            <ul className="list-disc space-y-1 pl-5">
              <li>Ligar passageiros a motoristas próximos e calcular o preço da viagem.</li>
              <li>Mostrar o rastreamento em tempo real e enviar notificações do estado da viagem.</li>
              <li>Processar pagamentos, reembolsos e cashback da Carteira Lego.</li>
              <li>Garantir segurança, prevenir fraude e responder a pedidos de apoio.</li>
              <li>Cumprir obrigações legais aplicáveis em Angola.</li>
            </ul>
          </Block>

          <Block title="3. Localização em segundo plano">
            A localização é utilizada apenas quando a app está em uso ou quando um motorista está em
            serviço, para permitir a correspondência de viagens e o acompanhamento em tempo real.
            Pode revogar a permissão nas definições do dispositivo — algumas funcionalidades deixarão
            de funcionar.
          </Block>

          <Block title="4. Partilha de dados">
            Partilhamos apenas o necessário: o primeiro nome e a localização do passageiro com o
            motorista atribuído (e vice-versa), dados com prestadores de pagamento e mapas, e
            informação exigida por autoridades legalmente competentes. Não vendemos dados pessoais.
          </Block>

          <Block title="5. Conservação">
            Mantemos os dados de conta enquanto a conta existir e os registos de viagem e pagamento
            pelo período exigido por lei. Após a eliminação da conta, os dados são apagados ou
            anonimizados.
          </Block>

          <Block title="6. Os seus direitos">
            Pode aceder, corrigir, exportar ou eliminar os seus dados. Para eliminar a conta e os
            dados associados, consulte a página{" "}
            <Link to="/eliminar-conta" className="font-semibold text-primary underline">
              Eliminar Conta
            </Link>
            .
          </Block>

          <Block title="7. Segurança">
            Utilizamos encriptação em trânsito, autenticação segura e controlo de acesso por
            políticas ao nível da base de dados para proteger a sua informação.
          </Block>

          <Block title="8. Crianças">
            O serviço não se destina a menores de 18 anos. Não recolhemos intencionalmente dados de
            crianças.
          </Block>

          <Block title="9. Contacto">
            Dúvidas sobre privacidade: <strong>privacidade@legotaxi.ao</strong> · Lego Mobility,
            Lubango / Luanda, Angola.
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
