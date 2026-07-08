import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, FileCheck, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DriverRegistrationForm } from "@/components/lego/DriverRegistrationForm";

export const Route = createFileRoute("/motoristas-registo")({
  head: () => ({
    meta: [
      { title: "Submeter Documentos · Lego Taxi Motorista" },
      {
        name: "description",
        content:
          "Envie os seus documentos (BI, Carta de Condução, Registo Criminal e Foto) para análise da equipa Lego Taxi.",
      },
    ],
  }),
  ssr: false,
  beforeLoad: async () => {
    // Must be logged in to submit documents.
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/motorista-auth" });

    // If documents were already submitted, skip the form and go to the panel
    // (the DriverStatusGuard will show pending/approved/rejected states).
    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("id", data.session.user.id)
      .maybeSingle();
    if (driver) throw redirect({ to: "/painel-motorista" });
  },
  component: DriverRegistrationPage,
});

function DriverRegistrationPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link to="/motorista" className="flex items-center gap-2 hover:opacity-80 transition">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-display text-sm font-bold">Voltar</span>
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground">
            <span className="font-display text-lg font-black text-primary">L</span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 pt-8 pb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium mb-3">
          <Shield className="h-3.5 w-3.5 text-primary" />
          Passo final · Submissão de documentos
        </div>
        <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
          Envie os seus <span className="text-primary">documentos</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Para começar a conduzir, precisamos validar os seus dados. Depois de enviar, a sua
          candidatura ficará <strong>Em Análise</strong> e receberá uma notificação assim que for
          aprovada (até 48h).
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Bilhete de Identidade" },
            { label: "Carta de Condução" },
            { label: "Registo Criminal" },
            { label: "Foto de Perfil" },
          ].map((d) => (
            <div
              key={d.label}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs"
            >
              <FileCheck className="h-3.5 w-3.5 text-primary" />
              {d.label}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-16">
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-soft">
          <DriverRegistrationForm />
        </div>
      </section>
    </main>
  );
}
