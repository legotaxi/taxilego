import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Phone, Lock, Loader2, User, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { usePhoneAuth } from "@/hooks/use-phone-auth";
import { toast } from "sonner";
import driverBg from "@/assets/driver-bg.mp4.asset.json";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/phone-auth")({
  head: () => ({
    meta: [
      { title: "Entrar · Lego Taxi" },
      { name: "description", content: "Aceda à sua conta Lego Taxi com telefone e senha." },
    ],
  }),
  component: PhoneAuthPage,
});

function PhoneAuthPage() {
  const navigate = useNavigate();
  const { signUpWithPhone, signInWithPhone, loading } = usePhoneAuth();
  
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [userType, setUserType] = useState<"passenger" | "driver">("passenger");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const redirectByRole = async (userId: string) => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const rs = (roles ?? []).map((r: { role: string }) => r.role);
      if (rs.includes("admin")) return navigate({ to: "/admin" });
      if (rs.includes("driver")) return navigate({ to: "/painel-motorista" });
      const { data: drv } = await supabase
        .from("drivers")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      if (drv) return navigate({ to: "/painel-motorista" });
      navigate({ to: "/minhas-corridas" });
    } catch (err) {
      console.error("Erro ao redirecionar:", err);
      navigate({ to: "/minhas-corridas" });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await signUpWithPhone(phone, password, fullName, userType);
    
    if (!result.success) {
      toast.error(result.error || "Erro ao criar conta");
      return;
    }

    toast.success(result.message || "Conta criada com sucesso!");
    
    // For drivers, redirect to document upload; for passengers, show success and redirect
    if (userType === "driver") {
      // Store the user ID and redirect to driver registration form
      sessionStorage.setItem("newDriverId", result.user?.id || "");
      setTimeout(() => {
        navigate({ to: "/motoristas-registo" });
      }, 500);
    } else {
      setSignupSuccess(true);
      // Redirect after 2 seconds
      setTimeout(() => {
        if (result.user) {
          redirectByRole(result.user.id);
        }
      }, 2000);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await signInWithPhone(phone, password);
    
    if (!result.success) {
      toast.error(result.error || "Erro ao fazer login");
      return;
    }

    toast.success(result.message || "Bem-vindo!");
    
    if (result.user) {
      redirectByRole(result.user.id);
    }
  };

  const formatPhone = (value: string) => {
    // Remove non-digits and limit to 9 digits (Angola phone numbers)
    const digits = value.replace(/\D/g, "").slice(0, 9);
    
    // Format as XXX XXX XXX (without +244)
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  };

  if (signupSuccess && mode === "signup") {
    return (
      <main className="fixed inset-0 grid overflow-hidden lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-foreground text-background lg:flex lg:flex-col lg:justify-between lg:p-12">
          <video
            src={driverBg.url}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 via-foreground/60 to-foreground/90" />
          <Link to="/" className="relative z-10 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="font-display text-xl font-black text-primary-foreground">L</span>
            </div>
            <span className="font-display text-xl font-bold">Lego Taxi</span>
          </Link>
          <div className="relative z-10 space-y-6">
            <h2 className="font-display text-5xl font-black leading-[1.05] text-balance drop-shadow-lg">
              A mobilidade de Angola, <span className="text-primary">à sua porta</span>.
            </h2>
            <p className="max-w-md text-background/80">
              Corridas em Kwanzas, pagamentos Multicaixa Express, motoristas verificados e suporte 24/7.
            </p>
          </div>
          <div className="relative z-10 text-xs text-background/60">
            © 2026 Lego Mobility, Lda · 🇦🇴 Feito em Angola
          </div>
        </aside>

        <section className="flex flex-col overflow-y-auto bg-background px-6 py-12 sm:px-12 scrollbar-hide">
          <div className="mx-auto w-full max-w-sm flex-1 flex flex-col justify-center items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            
            <h1 className="font-display text-3xl font-bold mb-2">
              {userType === "driver" ? "Candidatura Enviada!" : "Conta Criada!"}
            </h1>
            
            <p className="text-muted-foreground mb-6">
              {userType === "driver"
                ? "Sua candidatura foi recebida. Aguarde a aprovação do administrador para ativar todas as funcionalidades de motorista."
                : "Bem-vindo ao Lego Taxi! Está a ser redirecionado..."}
            </p>

            <div className="w-full">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                A redirecionar...
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 grid overflow-hidden lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-foreground text-background lg:flex lg:flex-col lg:justify-between lg:p-12">
        <video
          src={driverBg.url}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 via-foreground/60 to-foreground/90" />
        <Link to="/" className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <span className="font-display text-xl font-black text-primary-foreground">L</span>
          </div>
          <span className="font-display text-xl font-bold">Lego Taxi</span>
        </Link>
        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-5xl font-black leading-[1.05] text-balance drop-shadow-lg">
            A mobilidade de Angola, <span className="text-primary">à sua porta</span>.
          </h2>
          <p className="max-w-md text-background/80">
            Corridas em Kwanzas, pagamentos Multicaixa Express, motoristas verificados e suporte 24/7.
          </p>
        </div>
        <div className="relative z-10 text-xs text-background/60">
          © 2026 Lego Mobility, Lda · 🇦🇴 Feito em Angola
        </div>
      </aside>

      <section className="flex flex-col overflow-y-auto bg-background px-6 py-12 sm:px-12 scrollbar-hide">
        <div className="mx-auto w-full max-w-sm flex-1 flex flex-col justify-center">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground">
              <span className="font-display text-lg font-black text-primary">L</span>
            </div>
            <span className="font-display font-bold">Lego Taxi</span>
          </Link>

          {/* Mode Toggle */}
          <div className="mb-6 flex rounded-full bg-muted p-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setSignupSuccess(false);
              }}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                mode === "signin" ? "bg-card shadow-soft" : "text-muted-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setSignupSuccess(false);
              }}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                mode === "signup" ? "bg-card shadow-soft" : "text-muted-foreground"
              }`}
            >
              Criar conta
            </button>
          </div>

          {/* User Type Toggle (only for signup) */}
          {mode === "signup" && (
            <div className="mb-6 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setUserType("passenger")}
                className={`flex-1 rounded-2xl py-3 text-sm font-semibold transition ${
                  userType === "passenger"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Passageiro
              </button>
              <button
                type="button"
                onClick={() => setUserType("driver")}
                className={`flex-1 rounded-2xl py-3 text-sm font-semibold transition ${
                  userType === "driver"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Motorista
              </button>
            </div>
          )}

          <div className="shrink-0">
            <h1 className="font-display text-3xl font-bold">
              {mode === "signin" ? "Bem-vindo de volta" : "Crie a sua conta"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Aceda à sua conta Lego Taxi com telefone e palavra-passe."
                : userType === "driver"
                ? "Registe-se como motorista. Depois envie os seus documentos para aprovação."
                : "Junte-se a milhares de angolanos."}
            </p>
          </div>

          <form className="mt-8 space-y-3 shrink-0" onSubmit={mode === "signin" ? handleSignIn : handleSignUp}>
            {mode === "signup" && (
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nome completo
                </span>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-3 focus-within:border-foreground transition-all">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="João Manuel"
                    className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Número de Telefone
              </span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-3 focus-within:border-foreground transition-all">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="923 456 789"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Palavra-passe
              </span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-3 focus-within:border-foreground transition-all">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 font-display font-bold text-background transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Entrar" : "Criar conta"}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-muted-foreground shrink-0">
            <p>
              {mode === "signin" ? "Não tem conta? " : "Já tem conta? "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setSignupSuccess(false);
                  setPhone("");
                  setPassword("");
                  setFullName("");
                }}
                className="font-semibold text-foreground hover:underline"
              >
                {mode === "signin" ? "Criar conta" : "Entrar"}
              </button>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground shrink-0">
            Ao continuar, aceita os <a className="underline">Termos</a> e a{" "}
            <a className="underline">Política de Privacidade</a> da Lego Taxi.
          </p>
        </div>
      </section>
    </main>
  );
}
