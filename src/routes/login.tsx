import { ArrowRight, Apple, Chrome, Mail, Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useNavigate, createFileRoute } from "@tanstack/react-router";
import driverBg from "@/assets/driver-bg.mp4.asset.json";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar · Lego Taxi" },
      { name: "description", content: "Aceda à sua conta Lego Taxi." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectByRole = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const rs = (roles ?? []).map((r: { role: string }) => r.role);
    if (rs.includes("admin")) return navigate({ to: "/admin-console" });
    if (rs.includes("driver")) return navigate({ to: "/painel-motorista" });
    const { data: drv } = await supabase
      .from("drivers")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (drv) return navigate({ to: "/painel-motorista" });
    navigate({ to: "/minhas-corridas" });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!email.trim()) {
      toast.error("Por favor, insira o seu email");
      return;
    }
    if (!password.trim()) {
      toast.error("Por favor, insira a sua palavra-passe");
      return;
    }
    if (mode === "signup" && !fullName.trim()) {
      toast.error("Por favor, insira o seu nome completo");
      return;
    }
    if (password.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique o seu email para confirmar.");
        setEmail("");
        setPassword("");
        setFullName("");
        setMode("signin");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        if (data.user) await redirectByRole(data.user.id);
        else navigate({ to: "/minhas-corridas" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro de autenticação";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const ADMIN_EMAILS = [
    "lubatechnology@gmail.com",
    "gomesshekinah@gmail.com",
  ];

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao conectar com Google";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao conectar com Apple";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
      {/* Full-screen looping motion background */}
      <video
        src={driverBg.url}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Gradient overlays for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo & Title */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-background shadow-2xl ring-2 ring-primary/40">
            <span className="font-display text-xl font-black text-primary">L</span>
          </div>
          <div>
            <h1 className="font-display text-3xl font-black leading-tight tracking-tighter text-white drop-shadow-lg">
              Lego <span className="text-primary">Taxi</span>
            </h1>
          </div>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                mode === "signin"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                mode === "signup"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              Registar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleEmail} className="space-y-3 mb-6">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="João Silva"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Email</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                <Mail className="h-5 w-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Palavra-passe</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                <Lock className="h-5 w-5 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  A processar...
                </>
              ) : (
                <>
                  {mode === "signin" ? "Entrar" : "Registar"}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/40 font-semibold">OU</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social Login */}
          <div className="space-y-2">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold transition-all hover:bg-white/10 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Chrome className="h-5 w-5" />
              Google
            </button>
            <button
              onClick={handleAppleLogin}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold transition-all hover:bg-white/10 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Apple className="h-5 w-5" />
              Apple
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-white/40 mt-6">
          Ao continuar, concorda com os nossos Termos de Serviço e Política de Privacidade
        </p>
      </div>
    </main>
  );
}
