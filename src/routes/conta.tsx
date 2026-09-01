import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  User as UserIcon,
  Phone,
  ShieldCheck,
  Trash2,
  Loader2,
  AlertTriangle,
  LogOut,
  CheckCircle2,
  FileText,
  LifeBuoy,

} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
import { AppShell } from "@/components/lego/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "A minha conta · Lego Taxi" },
      {
        name: "description",
        content:
          "Definições da conta Lego Taxi: dados de perfil, terminar sessão e eliminar permanentemente a conta.",
      },
      { property: "og:title", content: "A minha conta · Lego Taxi" },
      {
        property: "og:description",
        content: "Gerencie o seu perfil Lego Taxi e elimine a conta quando quiser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AccountPage,
});

type Profile = { full_name: string | null; phone: string | null };

function AccountPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const runDelete = useServerFn(deleteMyAccount);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).limit(1).maybeSingle(),
      ]);
      if (!active) return;
      setProfile((p as Profile) ?? null);
      setRole((r?.role as string) ?? "passenger");
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const isDriver = role === "driver";

  const handleDelete = async () => {
    setError(null);
    setDeleting(true);
    try {
      const result = await runDelete({});
      if (!result?.ok) {
        setError(result?.error || "Não foi possível eliminar a conta. Tente novamente.");
        toast.error(result?.error || "Erro ao eliminar conta");
        return;
      }
      setDone(true);
      toast.success("Conta eliminada permanentemente");
      await signOut();
      setTimeout(() => navigate({ to: "/login" }), 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado";
      setError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <AppShell role={isDriver ? "driver" : "passenger"}>
      <div className="h-full overflow-y-auto bg-background">
        <div className="mx-auto w-full max-w-lg px-5 pb-24 pt-8">
          <header className="mb-6">
            <h1 className="font-display text-3xl font-black tracking-tight">A minha conta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dados do perfil e definições da conta.
            </p>
          </header>

          {/* Perfil */}
          <section className="mb-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
                <UserIcon className="h-7 w-7 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold">
                  {profile?.full_name || "Utilizador Lego"}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {profile?.phone || "—"}
                </p>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              {isDriver ? "Conta de motorista" : "Conta de passageiro"}
            </div>
          </section>

          {/* Sessão */}
          <section className="mb-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-display text-base font-black tracking-tight">Sessão</h2>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border py-3 text-sm font-bold transition hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Terminar sessão
            </button>
          </section>

          {/* Legal e privacidade */}
          <section className="mb-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-display text-base font-black tracking-tight">
              Privacidade e legal
            </h2>
            <div className="space-y-2">
              <Link
                to="/privacidade"
                className="flex items-center gap-3 rounded-xl border border-border p-3.5 text-sm font-semibold"
              >
                <ShieldCheck className="h-4 w-4 text-primary" />
                Política de privacidade
              </Link>
              <Link
                to="/termos"
                className="flex items-center gap-3 rounded-xl border border-border p-3.5 text-sm font-semibold"
              >
                <FileText className="h-4 w-4 text-primary" />
                Termos de utilização
              </Link>
              <Link
                to="/suporte"
                className="flex items-center gap-3 rounded-xl border border-border p-3.5 text-sm font-semibold"
              >
                <LifeBuoy className="h-4 w-4 text-primary" />
                Apoio ao cliente
              </Link>
            </div>
          </section>


          {/* Eliminar conta */}
          <section
            id="eliminar-conta"
            className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-5"
          >
            <h2 className="mb-1 flex items-center gap-2 font-display text-base font-black tracking-tight text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Excluir minha conta
            </h2>
            <p className="mb-4 text-sm text-foreground/80">
              A eliminação é <strong>permanente e imediata</strong>. Perde o perfil, histórico de
              corridas, mensagens, documentos e o saldo da Carteira Lego. Esta ação não pode ser
              revertida.
            </p>

            {done ? (
              <div className="flex items-center gap-2 rounded-xl bg-card p-4 text-sm font-semibold text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Conta eliminada. A redireccionar para o login…
              </div>
            ) : !confirmOpen ? (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive py-3.5 text-sm font-bold uppercase tracking-wider text-destructive-foreground transition hover:opacity-90"
              >
                <Trash2 className="h-4 w-4" />
                Excluir minha conta
              </button>
            ) : (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Escreva ELIMINAR para confirmar
                  </span>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="ELIMINAR"
                    autoCapitalize="characters"
                    className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm font-bold tracking-widest outline-none focus:border-destructive"
                  />
                </label>

                {error && (
                  <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => {
                      setConfirmOpen(false);
                      setConfirmText("");
                      setError(null);
                    }}
                    className="flex-1 rounded-xl border-2 border-border py-3 text-sm font-bold transition hover:bg-muted disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={deleting || confirmText !== "ELIMINAR"}
                    onClick={handleDelete}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive py-3 text-sm font-bold uppercase tracking-wider text-destructive-foreground transition hover:opacity-90 disabled:opacity-40"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        A eliminar…
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Confirmar eliminação
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              Também pode consultar as{" "}
              <Link to="/eliminar-conta" className="font-semibold text-primary underline">
                instruções completas de eliminação
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
