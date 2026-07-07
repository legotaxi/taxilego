import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface DriverStatusGuardProps {
  children: React.ReactNode;
  requiredStatus?: "approved" | "pending" | "any";
}

export function DriverStatusGuard({ 
  children, 
  requiredStatus = "approved" 
}: DriverStatusGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [driverStatus, setDriverStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    const checkDriverStatus = async () => {
      try {
        const { data: driver } = await supabase
          .from("drivers")
          .select("status")
          .eq("id", user.id)
          .maybeSingle();

        if (!driver) {
          // Driver account exists but no documents submitted yet — go to registration form.
          navigate({ to: "/motoristas-registo" });
          return;
        }

        setDriverStatus(driver.status);

        // If status is not approved and we require approved, show pending screen
        if (requiredStatus === "approved" && driver.status !== "approved") {
          // Don't navigate, just show the pending screen
        }
      } catch (err) {
        console.error("Erro ao verificar status de motorista:", err);
        navigate({ to: "/motoristas-registo" });
      } finally {
        setLoading(false);
      }
    };

    checkDriverStatus();

    // Realtime: notifica motorista logo que admin altera o seu status
    const channel = supabase
      .channel(`driver-status-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "drivers", filter: `id=eq.${user.id}` },
        (payload) => {
          const next = (payload.new as { status?: string }).status;
          if (!next) return;
          setDriverStatus((prev) => {
            if (prev && prev !== next) {
              if (next === "approved") {
                toast.success("🎉 Candidatura aprovada! Já podes aceitar corridas.");
                if ("vibrate" in navigator) navigator.vibrate([300, 100, 300]);
              } else if (next === "rejected") {
                toast.error("Candidatura rejeitada. Contacta o suporte.");
              } else if (next === "suspended") {
                toast.error("Conta suspensa. Contacta o suporte.");
              }
            }
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, navigate, requiredStatus]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  // If driver is not approved and we require approved status
  if (requiredStatus === "approved" && driverStatus && driverStatus !== "approved") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {driverStatus === "pending" && (
            <>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mx-auto">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">Candidatura em Análise</h1>
              <p className="text-muted-foreground mb-6">
                Obrigado por se registar como motorista! Sua candidatura está sendo analisada pela nossa equipa de administração. Você receberá uma notificação assim que for aprovado.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <p className="text-sm text-amber-900">
                  ⏱️ Tempo estimado de análise: <strong>24-48 horas</strong>
                </p>
              </div>
            </>
          )}

          {driverStatus === "rejected" && (
            <>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">Candidatura Rejeitada</h1>
              <p className="text-muted-foreground mb-6">
                Infelizmente, sua candidatura não foi aprovada. Se tiver dúvidas, entre em contacto com o nosso suporte.
              </p>
            </>
          )}

          {driverStatus === "suspended" && (
            <>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">Conta Suspensa</h1>
              <p className="text-muted-foreground mb-6">
                Sua conta de motorista foi suspensa. Entre em contacto com o suporte para mais informações.
              </p>
            </>
          )}

          <button
            onClick={() => navigate({ to: "/motorista" })}
            className="w-full rounded-2xl bg-foreground py-3 font-display font-bold text-background transition hover:opacity-90 active:scale-[0.98]"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // If status is approved or we don't require approval
  return <>{children}</>;
}
