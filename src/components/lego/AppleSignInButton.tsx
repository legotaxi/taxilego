import { useState } from "react";
import { Apple, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";

export type AuthIntent = "passenger" | "driver";

export const AUTH_INTENT_KEY = "legoAuthIntent";

type Props = {
  intent: AuthIntent;
  variant?: "light" | "dark";
  className?: string;
};

/** Sign in with Apple — required by Apple Review (Guideline 2.1 / 4.8). */
export function AppleSignInButton({ intent, variant = "light", className = "" }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      sessionStorage.setItem(AUTH_INTENT_KEY, intent);
      localStorage.setItem(AUTH_INTENT_KEY, intent);
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: `${window.location.origin}/auth-callback`,
      });
      if (result.redirected) return;
      if (result.error) throw result.error;
      window.location.href = "/auth-callback";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível entrar com a Apple";
      toast.error(message);
      setLoading(false);
    }
  };

  const base =
    variant === "dark"
      ? "bg-white text-black hover:bg-white/90"
      : "bg-foreground text-background hover:opacity-90";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label="Continuar com Apple"
      className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-display font-bold transition active:scale-[0.98] disabled:opacity-50 ${base} ${className}`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <Apple className="h-5 w-5" />
          Continuar com Apple
        </>
      )}
    </button>
  );
}
