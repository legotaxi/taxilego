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

          {/* Mode Selector with Yellow Highlight */}
          <div className="mb-8 flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => { setMode("signin"); setSignupSuccess(false); }}
              className={`flex-1 rounded-2xl py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                mode === "signin" 
                  ? "bg-gradient-primary text-primary-foreground shadow-premium scale-105" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setSignupSuccess(false); }}
              className={`flex-1 rounded-2xl py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                mode === "signup" 
                  ? "bg-gradient-primary text-primary-foreground shadow-premium scale-105" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Candidatar-se
            </button>
          </div>

          {/* Header Section */}
          <div className="mb-8 shrink-0 space-y-3 animate-fade-in">
            <span className="inline-block rounded-full bg-primary/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              App de Motorista
            </span>
            <h1 className="font-display text-4xl font-black leading-tight">
              {mode === "signin" ? "Bem-vindo de volta" : "Torne-se motorista"}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              {mode === "signin"
                ? "Entre na sua conta de motorista e comece a ganhar."
                : "Registe-se e envie depois os seus documentos para aprovação."}
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4 shrink-0" onSubmit={mode === "signin" ? handleSignIn : handleSignUp}>
            {mode === "signup" && (
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Nome completo</span>
                <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3.5 focus-within:border-primary focus-within:bg-card/80 transition-all duration-300">
                  <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <input 
                    type="text" 
                    required 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="João Manuel" 
                    className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/60" 
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Número de Telefone</span>
              <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3.5 focus-within:border-primary focus-within:bg-card/80 transition-all duration-300">
                <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <input 
                  type="tel" 
                  required 
                  value={phone} 
                  onChange={(e) => setPhone(formatPhone(e.target.value))} 
                  placeholder="923 456 789" 
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/60" 
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Palavra-passe</span>
              <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3.5 focus-within:border-primary focus-within:bg-card/80 transition-all duration-300">
                <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <input 
                  type="password" 
                  required 
                  minLength={6} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/60" 
                />
              </div>
            </label>

            <button 
              type="submit" 
              disabled={loading} 
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-primary py-4 font-display font-bold text-primary-foreground transition-all duration-300 hover:shadow-premium active:scale-[0.98] disabled:opacity-50 mt-6 flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin relative z-10" />
              ) : (
                <>
                  <span className="relative z-10">{mode === "signin" ? "Entrar" : "Candidatar-se"}</span>
                  <ArrowRight className="h-5 w-5 relative z-10 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 space-y-4 text-center text-sm text-muted-foreground shrink-0">
            <p>
              {mode === "signin" ? "Ainda não é motorista? " : "Já tem conta de motorista? "}
              <button 
                type="button" 
                onClick={() => { 
                  setMode(mode === "signin" ? "signup" : "signin"); 
                  setSignupSuccess(false); 
                  setPhone(""); 
                  setPassword(""); 
                  setFullName(""); 
                }} 
                className="font-bold text-primary hover:underline transition-colors"
              >
                {mode === "signin" ? "Candidatar-se aqui" : "Entrar aqui"}
              </button>
            </p>
            <p>
              É passageiro?{" "}
              <Link to="/passageiro" className="font-bold text-primary hover:underline transition-colors">
                Abrir app de passageiro
              </Link>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground/70 shrink-0">
            Ao continuar, aceita os <a href="#" className="underline hover:text-muted-foreground transition-colors">Termos</a> e a <a href="#" className="underline hover:text-muted-foreground transition-colors">Política de Privacidade</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
