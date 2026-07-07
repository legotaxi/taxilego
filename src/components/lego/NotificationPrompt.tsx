import { useEffect, useState } from "react";
import { Bell, BellRing, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { enablePush, pushPermission, pushSupported } from "@/lib/push-client";
import { savePushSubscription } from "@/lib/push.functions";

/**
 * Cartão que pede permissão para notificações push (info da corrida no ecrã bloqueado).
 * Só aparece quando o browser suporta e a permissão ainda não foi concedida.
 */
export function NotificationPrompt() {
  const savePush = useServerFn(savePushSubscription);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pushSupported()) return;
    const perm = pushPermission();
    const dismissed = localStorage.getItem("legotax_push_dismissed") === "1";
    if (perm === "default" && !dismissed) setVisible(true);
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    try {
      const sub = await enablePush();
      if (!sub) {
        toast.error("Não foi possível activar as notificações.");
        setBusy(false);
        return;
      }
      const res = await savePush({ data: sub });
      if (res.ok) {
        toast.success("Notificações activadas! Verás a tua corrida no ecrã bloqueado.");
        setVisible(false);
      } else {
        toast.error("Falha ao guardar a subscrição.");
      }
    } catch {
      toast.error("Erro ao activar notificações.");
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("legotax_push_dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
        <BellRing className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">Activar notificações</p>
        <p className="text-xs text-white/80">Recebe a chegada do motorista no ecrã bloqueado.</p>
      </div>
      <button
        onClick={handleEnable}
        disabled={busy}
        className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary active:scale-95 transition disabled:opacity-60"
      >
        {busy ? "..." : "Activar"}
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dispensar"
        className="shrink-0 text-white/70 active:scale-95 transition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Ícone de estado simples (opcional) para reutilização. */
export function NotificationBellIcon() {
  return <Bell className="h-5 w-5" />;
}
