import { Phone, Loader2 } from "lucide-react";
import { useState } from "react";

interface VoiceCallButtonProps {
  userId: string;
  remoteUserId: string | null;
  remoteUserName?: string;
  onCallStart?: (remoteUserId: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Botão para iniciar chamada de voz
 */
export function VoiceCallButton({
  userId,
  remoteUserId,
  remoteUserName = "Utilizador",
  onCallStart,
  disabled = false,
  className = "",
}: VoiceCallButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartCall = async () => {
    if (!remoteUserId || disabled) return;

    try {
      setIsLoading(true);
      onCallStart?.(remoteUserId);
    } catch (err) {
      console.error("Erro ao iniciar chamada:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartCall}
      disabled={disabled || !remoteUserId || isLoading}
      className={`flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 font-semibold transition-all active:scale-95 ${className}`}
      title={`Chamar ${remoteUserName}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>A conectar...</span>
        </>
      ) : (
        <>
          <Phone className="h-5 w-5" />
          <span>Chamar</span>
        </>
      )}
    </button>
  );
}
