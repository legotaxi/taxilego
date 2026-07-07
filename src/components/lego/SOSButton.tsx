import { AlertTriangle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface SOSButtonProps {
  phoneNumber?: string;
  variant?: "floating" | "inline";
  className?: string;
}

async function getLocationText(): Promise<string> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve("");
    const timeout = setTimeout(() => resolve(""), 2500);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        const { latitude, longitude } = pos.coords;
        resolve(
          ` Localização: https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`,
        );
      },
      () => {
        clearTimeout(timeout);
        resolve("");
      },
      { enableHighAccuracy: true, timeout: 2000, maximumAge: 30000 },
    );
  });
}

export function SOSButton({
  phoneNumber = "111",
  variant = "inline",
  className = "",
}: SOSButtonProps) {
  const cleanNumber = phoneNumber.replace(/\D/g, "");

  const handleCall = () => {
    try {
      window.location.href = `tel:${cleanNumber}`;
      toast.success(`Chamando polícia (${cleanNumber})...`);
    } catch (error) {
      console.error("Erro ao fazer chamada SOS:", error);
      toast.error("Erro ao fazer chamada de emergência");
    }
  };

  const handleSMS = async () => {
    try {
      toast.message("A preparar SMS de emergência...");
      const loc = await getLocationText();
      const body = encodeURIComponent(
        `EMERGÊNCIA Lego Taxi - preciso de ajuda da polícia.${loc}`,
      );
      // sms: URI - tenta abrir app de SMS com mensagem pré-preenchida (envio em segundo plano não é possível no browser sem gateway)
      const sep = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "&" : "?";
      window.location.href = `sms:${cleanNumber}${sep}body=${body}`;
      toast.success("SMS de emergência pronto para enviar");
    } catch (error) {
      console.error("Erro ao enviar SMS SOS:", error);
      toast.error("Erro ao enviar SMS de emergência");
    }
  };

  if (variant === "floating") {
    return (
      <div className={`fixed bottom-24 right-4 z-40 flex flex-col gap-2 ${className}`}>
        <button
          onClick={handleSMS}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-2xl hover:bg-orange-700 active:scale-95 transition-all"
          title={`Enviar SMS de emergência (${cleanNumber})`}
          aria-label="Botão SMS de emergência"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
        <button
          onClick={handleCall}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl hover:bg-red-700 active:scale-95 transition-all animate-pulse"
          title={`Chamar polícia (${cleanNumber}) - Emergência`}
          aria-label="Botão de emergência SOS"
        >
          <AlertTriangle className="h-7 w-7" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleCall}
        className="flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white active:scale-95 transition-transform hover:bg-red-700"
        title={`Chamar polícia (${cleanNumber}) - Emergência`}
        aria-label="Botão de emergência SOS"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        SOS
      </button>
      <button
        onClick={handleSMS}
        className="flex items-center justify-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-xs font-bold text-white active:scale-95 transition-transform hover:bg-orange-700"
        title={`Enviar SMS de emergência (${cleanNumber})`}
        aria-label="Botão SMS de emergência"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        SMS
      </button>
    </div>
  );
}
