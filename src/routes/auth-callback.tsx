import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AUTH_INTENT_KEY, type AuthIntent } from "@/lib/apple-auth";
import { ensureDriverIdentity } from "@/lib/driver-auth.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth-callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "A concluir sessão · Lego Taxi" },
      {
        name: "description",
        content: "A concluir o início de sessão na Lego Taxi e a preparar a sua conta.",
      },
      { property: "og:title", content: "A concluir sessão · Lego Taxi" },
      { property: "og:description", content: "Início de sessão Lego Taxi em curso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const prepareDriver = useServerFn(ensureDriverIdentity);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<AuthIntent>("passenger");

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      try {
        const query = new URLSearchParams(window.location.search);
        const providerError = query.get("error") || new URLSearchParams(window.location.hash.slice(1)).get("error");
        if (providerError) {
          setError("A Apple não concluiu o acesso. Volte e tente novamente.");
          return;
        }

        const queryIntent = query.get("intent");
        let storedIntent: string | null = null;
        try {
          storedIntent = sessionStorage.getItem(AUTH_INTENT_KEY) || localStorage.getItem(AUTH_INTENT_KEY);
          sessionStorage.removeItem(AUTH_INTENT_KEY);
          localStorage.removeItem(AUTH_INTENT_KEY);
        } catch {
          // The explicit same-origin callback query remains available.
        }
        const requestedIntent = queryIntent || storedIntent;
        const authIntent: AuthIntent = requestedIntent === "driver" ? "driver" : "passenger";
        setIntent(authIntent);

        let userId: string | null = null;
        for (let i = 0; i < 80 && !cancelled; i++) {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (data.session?.user.id) {
            userId = data.session.user.id;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        if (cancelled) return;
        if (!userId) {
          setError("Não conseguimos concluir o acesso. Volte e tente novamente.");
          return;
        }

        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (rolesError) throw new Error("Não foi possível verificar o tipo da conta. Tente novamente.");
        const roleNames = (roles ?? []).map((role) => role.role);

        if (roleNames.includes("admin")) {
          return navigate({ to: "/admin" });
        }

        if (authIntent === "driver") {
          const prepared = await prepareDriver({});
          if (!prepared?.ok) {
            throw new Error(prepared?.error || "Não foi possível preparar a conta de motorista.");
          }
          const { data: driver, error: driverError } = await supabase
            .from("drivers")
            .select("id, status, bi_url, license_url, criminal_record_url, photo_url")
            .eq("id", userId)
            .maybeSingle();
          if (driverError) throw new Error("Não foi possível verificar o cadastro de motorista.");

          const documentsComplete = Boolean(
            driver?.bi_url && driver.license_url && driver.criminal_record_url && driver.photo_url,
          );
          if (!driver || (driver.status === "pending" && !documentsComplete)) {
            return navigate({ to: "/motoristas-registo" });
          }
          return navigate({ to: "/painel-motorista" });
        }

        return navigate({ to: "/minhas-corridas" });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Não conseguimos concluir o acesso. Tente novamente.");
        }
      }
    };

    finish();
    return () => {
      cancelled = true;
    };
  }, [navigate, prepareDriver]);

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      {error ? (
        <div className="space-y-4">
          <h1 className="font-display text-2xl font-black">Sessão não concluída</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            onClick={() => navigate({ to: intent === "driver" ? "/motorista-auth" : "/passageiro-auth" })}
            className="rounded-lg bg-foreground px-6 py-3 font-display font-bold text-background"
          >
            Voltar ao início de sessão
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">A concluir o início de sessão…</p>
        </div>
      )}
    </main>
  );
}
