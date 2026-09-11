import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AUTH_INTENT_KEY } from "@/components/lego/AppleSignInButton";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      // Wait briefly for the session to hydrate after the provider round-trip.
      let user = null as null | { id: string };
      for (let i = 0; i < 25 && !cancelled; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          user = data.session.user;
          break;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (cancelled) return;
      if (!user) {
        setError("Não conseguimos concluir o início de sessão. Tente novamente.");
        return;
      }

      const intent =
        sessionStorage.getItem(AUTH_INTENT_KEY) || localStorage.getItem(AUTH_INTENT_KEY) || "passenger";

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const rs = (roles ?? []).map((r: { role: string }) => r.role);

      if (rs.includes("admin")) return navigate({ to: "/admin" });

      if (intent === "driver") {
        if (!rs.includes("driver")) {
          await supabase.from("user_roles").upsert({ user_id: user.id, role: "driver" });
        }
        const { data: drv } = await supabase
          .from("drivers")
          .select("id, status")
          .eq("id", user.id)
          .maybeSingle();
        if (!drv) {
          await supabase.from("drivers").upsert({ id: user.id, status: "pending" }, { onConflict: "id" });
          return navigate({ to: "/motoristas-registo" });
        }
        return navigate({ to: "/painel-motorista" });
      }

      navigate({ to: "/minhas-corridas" });
    };

    finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      {error ? (
        <div className="space-y-4">
          <h1 className="font-display text-2xl font-black">Sessão não concluída</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate({ to: "/passageiro-auth" })}
            className="rounded-2xl bg-foreground px-6 py-3 font-display font-bold text-background"
          >
            Voltar ao início de sessão
          </button>
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
