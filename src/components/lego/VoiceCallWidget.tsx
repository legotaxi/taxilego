import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, AlertCircle, Loader2 } from "lucide-react";
import { useVoiceCall } from "@/hooks/use-voice-call";

interface VoiceCallWidgetProps {
  userId: string;
  remoteUserId: string | null;
  remoteUserName?: string;
  isIncoming?: boolean;
  onCallEnd?: () => void;
}

/**
 * Widget de chamada de voz - Interface para chamadas de voz em tempo real
 */
export function VoiceCallWidget({
  userId,
  remoteUserId,
  remoteUserName = "Utilizador",
  isIncoming = false,
  onCallEnd,
}: VoiceCallWidgetProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showIncomingCall, setShowIncomingCall] = useState(isIncoming);

  const {
    isCallActive,
    isRinging,
    isMuted,
    isAudioOn,
    callDuration,
    error,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    getRemoteStream,
  } = useVoiceCall(userId, remoteUserId);

  // Reproduzir stream remoto
  useEffect(() => {
    if (audioRef.current && isCallActive) {
      const remoteStream = getRemoteStream();
      if (remoteStream) {
        audioRef.current.srcObject = remoteStream;
        audioRef.current.play().catch((err) => {
          console.error("Erro ao reproduzir áudio remoto:", err);
        });
      }
    }
  }, [isCallActive, getRemoteStream]);

  // Formatar duração da chamada
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Tela de chamada ativa
  if (isCallActive) {
    return (
      <div className=\"fixed inset-0 z-50 bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col items-center justify-center p-4\">
        {/* Áudio remoto */}
        <audio ref={audioRef} autoPlay playsInline />

        {/* Avatar do utilizador remoto */}
        <div className=\"mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 shadow-lg\">
          <div className=\"text-5xl font-bold text-white\">
            {remoteUserName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Nome e duração */}
        <h2 className=\"text-3xl font-bold text-white mb-2\">{remoteUserName}</h2>
        <p className=\"text-lg text-blue-100 font-semibold\">{formatDuration(callDuration)}</p>

        {/* Controles */}
        <div className=\"mt-12 flex gap-6\">
          {/* Botão de mudo */}
          <button
            onClick={toggleMute}
            className={`flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
              isMuted
                ? \"bg-red-500 hover:bg-red-600 text-white\"
                : \"bg-blue-500 hover:bg-blue-600 text-white\"
            }`}
            title={isMuted ? \"Desativar mudo\" : \"Ativar mudo\"}
          >
            {isMuted ? (
              <MicOff className=\"h-7 w-7\" />
            ) : (
              <Mic className=\"h-7 w-7\" />
            )}
          </button>

          {/* Botão de terminar chamada */}
          <button
            onClick={() => {
              endCall();
              onCallEnd?.();
            }}
            className=\"flex h-16 w-16 items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all active:scale-95\"
            title=\"Terminar chamada\"
          >
            <PhoneOff className=\"h-7 w-7\" />
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div className=\"absolute bottom-6 left-4 right-4 flex items-start gap-3 rounded-lg bg-red-500/90 p-4 text-white\">
            <AlertCircle className=\"h-5 w-5 flex-shrink-0 mt-0.5\" />
            <p className=\"text-sm font-medium\">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Tela de chamada recebida
  if (showIncomingCall && isRinging) {
    return (
      <div className=\"fixed inset-0 z-50 bg-gradient-to-b from-emerald-600 to-emerald-800 flex flex-col items-center justify-center p-4\">
        {/* Áudio remoto */}
        <audio ref={audioRef} autoPlay playsInline />

        {/* Animação de toque */}
        <div className=\"mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 shadow-lg\">
          <div className=\"animate-pulse text-5xl font-bold text-white\">
            {remoteUserName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Nome e mensagem */}
        <h2 className=\"text-3xl font-bold text-white mb-2\">{remoteUserName}</h2>
        <p className=\"text-lg text-emerald-100 font-semibold\">A chamar...</p>

        {/* Controles */}
        <div className=\"mt-12 flex gap-6\">
          {/* Botão de rejeitar */}
          <button
            onClick={() => {
              rejectCall();
              setShowIncomingCall(false);
            }}
            className=\"flex h-16 w-16 items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all active:scale-95\"
            title=\"Rejeitar chamada\"
          >
            <PhoneOff className=\"h-7 w-7\" />
          </button>

          {/* Botão de aceitar */}
          <button
            onClick={() => {
              acceptCall();
              setShowIncomingCall(false);
            }}
            className=\"flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-all active:scale-95\"
            title=\"Aceitar chamada\"
          >
            <Phone className=\"h-7 w-7\" />
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div className=\"absolute bottom-6 left-4 right-4 flex items-start gap-3 rounded-lg bg-red-500/90 p-4 text-white\">
            <AlertCircle className=\"h-5 w-5 flex-shrink-0 mt-0.5\" />
            <p className=\"text-sm font-medium\">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Tela de chamada em progresso (chamador)
  if (isRinging && !isCallActive) {
    return (
      <div className=\"fixed inset-0 z-50 bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col items-center justify-center p-4\">
        {/* Avatar do utilizador remoto */}
        <div className=\"mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 shadow-lg\">
          <div className=\"animate-pulse text-5xl font-bold text-white\">
            {remoteUserName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Nome e mensagem */}
        <h2 className=\"text-3xl font-bold text-white mb-2\">{remoteUserName}</h2>
        <p className=\"text-lg text-blue-100 font-semibold flex items-center gap-2\">
          <Loader2 className=\"h-5 w-5 animate-spin\" />
          Chamando...
        </p>

        {/* Botão de cancelar */}
        <div className=\"mt-12\">
          <button
            onClick={() => {
              endCall();
              onCallEnd?.();
            }}
            className=\"flex h-16 w-16 items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all active:scale-95\"
            title=\"Cancelar chamada\"
          >
            <PhoneOff className=\"h-7 w-7\" />
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div className=\"absolute bottom-6 left-4 right-4 flex items-start gap-3 rounded-lg bg-red-500/90 p-4 text-white\">
            <AlertCircle className=\"h-5 w-5 flex-shrink-0 mt-0.5\" />
            <p className=\"text-sm font-medium\">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
