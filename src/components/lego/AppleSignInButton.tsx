import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { AUTH_INTENT_KEY, type AuthIntent } from "@/lib/apple-auth";

type Props = {
  intent: AuthIntent;
  disabled?: boolean;
  className?: string;
};

/** Sign in with Apple — required by Apple Review (Guideline 2.1 / 4.8). */
export function AppleSignInButton({ intent, disabled = false, className = "" }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      try {
        sessionStorage.setItem(AUTH_INTENT_KEY, intent);
        localStorage.setItem(AUTH_INTENT_KEY, intent);
      } catch {
        // The callback URL carries the app intent if browser storage is unavailable.
      }
      const callback = new URL("/auth-callback", window.location.origin);
      callback.searchParams.set("intent", intent);
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: callback.toString(),
      });
      if (result.redirected) return;
      if (result.error) throw result.error;
      window.location.assign(callback.toString());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível entrar com a Apple";
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      aria-label="Continue with Apple"
      className={`h-12 min-h-12 w-full rounded-lg bg-foreground font-sans text-xl font-medium text-background hover:opacity-90 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        "Continue with Apple"
      )}
    </Button>
  );
}
