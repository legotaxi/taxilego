import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/eliminar-conta")({
  head: () => ({
    meta: [
      { title: "Eliminar Conta · Lego Taxi" },
      {
        name: "description",
        content:
          "Como eliminar a sua conta Lego Taxi e todos os dados pessoais associados, dentro da app ou por email.",
      },
      { property: "og:title", content: "Eliminar Conta · Lego Taxi" },
      {
        property: "og:description",
        content: "Instruções para eliminar permanentemente a conta e os dados Lego Taxi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  return (
    <main className="min-h-dvh bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-primary">
            ← Lego Taxi
          </Link>
          <h1 className="font-display text-4xl font-black tracking-tighter">Eliminar Conta</h1>
          <p className="text-sm text-muted-foreground">
            Pedido de eliminação de conta e dados — Lego Taxi (Lego Mobility)
          </p>
        </header>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 font-display text-lg font-black tracking-tight">Dentro da aplicação</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground/85">
            <li>Abra a app Lego Taxi e inicie sessão.</li>
            <li>Vá a <strong>Perfil</strong> → <strong>Definições da conta</strong>.</li>
            <li>Toque em <strong>Eliminar conta</strong> e confirme.</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 font-display text-lg font-black tracking-tight">Por email</h2>
          <p className="text-sm text-foreground/85">
            Envie um pedido de <strong>“Eliminação de conta”</strong> a partir do email registado
            para{" "}
            <a href="mailto:suporte@legotaxi.ao" className="font-semibold text-primary underline">
              suporte@legotaxi.ao
            </a>
            , indicando o número de telefone da conta. Confirmamos a identidade e eliminamos a conta
            no prazo máximo de 30 dias.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 font-display text-lg font-black tracking-tight">Que dados são eliminados</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/85">
            <li>Perfil, nome, email, número de telefone e credenciais.</li>
            <li>Histórico de localizações, mensagens de chat e registos de chamadas.</li>
            <li>Documentos e dados de veículo (motoristas).</li>
            <li>Saldo de Carteira Lego e cashback (não reembolsável após eliminação).</li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            Registos de viagens e transacções financeiras são mantidos de forma anonimizada pelo
            período exigido pela lei fiscal angolana e depois apagados.
          </p>
        </div>

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
