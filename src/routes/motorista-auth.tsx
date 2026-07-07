import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Phone, Lock, Loader2, User, CheckCircle } from "lucide-react";
import { useState } from "react";
import { usePhoneAuth } from "@/hooks/use-phone-auth";
import { toast } from "sonner";
import driverBg from "@/assets/driver-bg.mp4.asset.json";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/motorista-auth")({
  head: () => ({
    meta: [
      { title: "Motorista · Entrar ou Candidatar-se · Lego Taxi" },
      {
        name: "description",
        content: "Aceda ao app de motorista Lego Taxi ou candidate-se para conduzir em Angola.",
      },
      { property: "og:title", content: "Motorista · Lego Taxi" },
      {
        property: "og:description",
        content: "Comissões justas, pagamento semanal, suporte 24/7.",
      },
    ],
  }),
  component: MotoristaAuthPage,
});

function MotoristaAuthPage() {
  const navigate = useNavigate();
  const { signUpWithPhone, signInWithPhone, loading } = usePhoneAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const redirectAfterSignin = async (userId: string) => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const rs = (roles ?? []).map((r: { role: string }) => r.role);
      if (rs.includes("admin")) return navigate({ to: "/admin" });
      // App de motorista sempre vai para o painel de motorista
      navigate({ to: "/painel-motorista" });
    } catch {
      navigate({ to: "/painel-motorista" });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signUpWithPhone(phone, password, fullName, "driver");
    if (!result.success) {
      toast.error(result.error || "Erro ao criar conta");
      return;
    }
    toast.success(result.message || "Candidatura iniciada!");
    sessionStorage.setItem("newDriverId", result.user?.id || "");
    setTimeout(() => navigate({ to: "/motoristas-registo" }), 600);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signInWithPhone(phone, password);
    if (!result.success) {
      toast.error(result.error || "Erro ao fazer login");
      return;
    }
    toast.success(result.message || "Bem-vindo!");
    if (result.user) redirectAfterSignin(result.user.id);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  };

  if (signupSuccess && mode === "signup") {
    return (
      <main className="fixed inset-0 grid overflow-hidden lg:grid-cols-2">
        <section className="flex flex-col overflow-y-auto bg-background px-6 py-12 sm:px-12">
          <div className="mx-auto w-full max-w-sm flex-1 flex flex-col justify-center items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Candidatura Enviada!</h1>
            <p className="text-muted-foreground mb-6">Envie os seus documentos para aprovação.</p>
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              A redirecionar...
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 grid overflow-hidden lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-foreground text-background lg:flex lg:flex-col lg:justify-between lg:p-12">
        <video src={driverBg.url} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 via-foreground/60 to-foreground/90" />
        <Link to="/motorista" className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <span className="font-display text-xl font-black text-primary-foreground">L</span>
          </div>
          <span className="font-display text-xl font-bold">Lego Taxi · Motorista</span>
        </Link>
        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-5xl font-black leading-[1.05] text-balance drop-shadow-lg">
            Conduza com a <span className="text-primary">maior frota</span> de Angola.
          </h2>
          <p className="max-w-md text-background/80">
            Comissões justas, pagamento semanal e suporte dedicado a motoristas.
          </p>
        </div>
        <div className="relative z-10 text-xs text-background/60">© 2026 Lego Mobility, Lda · 🇦🇴</div>
      </aside>

      <section className="flex flex-col overflow-y-auto bg-background px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm flex-1 flex flex-col justify-center">
          <Link to="/motorista" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground">
              <span className="font-display text-lg font-black text-primary">L</span>
            </div>
            <span className="font-display font-bold">Lego Taxi · Motorista</span>
          </Link>

          <div className="mb-6 flex rounded-full bg-muted p-1 shrink-0">
            <button
              type="button"
              onClick={() => { setMode("signin"); setSignupSuccess(false); }}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${mode === "signin" ? "bg-card shadow-soft" : "text-muted-foreground"}`}
            >Entrar</button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setSignupSuccess(false); }}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-card shadow-soft" : "text-muted-foreground"}`}
            >Candidatar-se</button>
          </div>

          <div className="shrink-0">
            <span className="inline-block mb-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              App de Motorista
            </span>
            <h1 className="font-display text-3xl font-bold">
              {mode === "signin" ? "Bem-vindo de volta" : "Torne-se motorista"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Entre na sua conta de motorista."
                : "Registe-se e envie depois os seus documentos para aprovação."}
            </p>
          </div>

          <form className="mt-8 space-y-3 shrink-0" onSubmit={mode === "signin" ? handleSignIn : handleSignUp}>
            {mode === "signup" && (
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome completo</span>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-3 focus-within:border-foreground transition-all">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="João Manuel" className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Número de Telefone</span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-3 focus-within:border-foreground transition-all">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <input type="tel" required value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="923 456 789" className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Palavra-passe</span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-3 focus-within:border-foreground transition-all">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
              </div>
            </label>

            <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 font-display font-bold text-background transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === "signin" ? "Entrar" : "Candidatar-se"}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></>}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-muted-foreground shrink-0">
            <p>
              {mode === "signin" ? "Ainda não é motorista? " : "Já tem conta de motorista? "}
              <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setSignupSuccess(false); setPhone(""); setPassword(""); setFullName(""); }} className="font-semibold text-foreground hover:underline">
                {mode === "signin" ? "Candidatar-se" : "Entrar"}
              </button>
            </p>
            <p className="mt-3">
              É passageiro?{" "}
              <Link to="/passageiro" className="font-semibold text-primary hover:underline">Abrir app de passageiro</Link>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground shrink-0">
            Ao continuar, aceita os <a className="underline">Termos</a> e a <a className="underline">Política de Privacidade</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
