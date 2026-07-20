import { useState, useCallback, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Phone, PhoneOff } from "lucide-react";
import { VoiceCallWidgetEnhanced } from "./VoiceCallWidgetEnhanced";
import { notifyIncomingCall, logVoiceCall } from "@/lib/voice-call.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RideWithVoiceCallEnhancedProps {
  rideId: string;
  userId: string;
  remoteUserId: string | null;
  remoteUserName?: string;
  userRole: "driver" | "passenger";
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

/**
 * Componente de Corrida com Suporte a Chamadas de Voz Melhorado
 * Integra o widget de chamada de voz com o fluxo de corrida
 */
export function RideWithVoiceCallEnhanced({
  rideId,
  userId,
  remoteUserId,
  remoteUserName = "Utilizador",
  userRole,
  onCallStart,
  onCallEnd,
}: RideWithVoiceCallEnhancedProps) {
  const [activeVoiceCall, setActiveVoiceCall] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
  } | null>(null);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);

  const notifyCall = useServerFn(notifyIncomingCall);
  const logCall = useServerFn(logVoiceCall);

  // Ouvir chamadas de voz recebidas via Supabase Realtime
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`voice_call_incoming:${userId}`)
      .on("broadcast", { event: "incoming_call" }, ({ payload }) => {
        // Verificar se é uma chamada válida
        if (payload.callerId && payload.callerId !== userId) {
          setIncomingCall({
            callerId: payload.callerId,
            callerName: payload.callerName || "Utilizador",
          });
          // Reproduzir som de chamada
          playRingtone();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Reproduzir som de chamada
  const playRingtone = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Padrão de toque: 800Hz
      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);

      // Vibração do dispositivo
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch (err) {
      console.error("Erro ao reproduzir som de chamada:", err);
    }
  }, []);

  // Iniciar chamada de voz
  const handleStartVoiceCall = useCallback(
    async (targetUserId: string) => {
      if (!targetUserId) return;

      try {
        console.log("Iniciando chamada para:", targetUserId);
        setCallStartTime(Date.now());
        onCallStart?.();

        // Notificar o outro utilizador (Push)
        await notifyCall({
          data: {
            recipientId: targetUserId,
            callerId: userId,
            callerName: remoteUserName,
          },
        });

        // Enviar sinal de chamada recebida via Realtime
        const channel = supabase.channel(`voice_call_incoming:${targetUserId}`);
        await channel.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.send({
              type: "broadcast",
              event: "incoming_call",
              payload: {
                callerId: userId,
                callerName: remoteUserName,
                rideId,
              },
            });
            console.log("Sinal de chamada enviado via Realtime");
          }
        });

        // Ativar widget de chamada
        setActiveVoiceCall(targetUserId);
      } catch (err) {
        console.error("Erro ao iniciar chamada:", err);
        toast.error("Erro ao iniciar chamada. Tente novamente.");
      }
    },
    [userId, rideId, remoteUserName, notifyCall, onCallStart],
  );

  // Aceitar chamada recebida
  const handleAcceptIncomingCall = useCallback(() => {
    if (incomingCall) {
      setCallStartTime(Date.now());
      setActiveVoiceCall(incomingCall.callerId);
      setIncomingCall(null);
      onCallStart?.();
    }
  }, [incomingCall, onCallStart]);

  // Rejeitar chamada recebida
  const handleRejectIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  // Registar chamada quando termina
  const handleCallEnd = useCallback(async () => {
    if (callStartTime && activeVoiceCall) {
      const duration = Math.floor((Date.now() - callStartTime) / 1000);
      try {
        await logCall({
          data: {
            rideId,
            remoteUserId: activeVoiceCall,
            duration,
            status: "completed",
          },
        });
      } catch (err) {
        console.error("Erro ao registar chamada:", err);
      }
    }

    setActiveVoiceCall(null);
    setCallStartTime(null);
    onCallEnd?.();
  }, [callStartTime, activeVoiceCall, rideId, logCall, onCallEnd]);

  return (
    <div className="relative w-full h-full">
      {/* Botão de Chamada de Voz (flutuante ou integrado) */}
      {remoteUserId && !activeVoiceCall && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => handleStartVoiceCall(remoteUserId)}
            className="flex items-center gap-2 rounded-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 font-semibold transition-all active:scale-95 shadow-lg"
            title={`Chamar ${remoteUserName}`}
          >
            <Phone className="h-5 w-5" />
            <span>Chamar</span>
          </button>
        </div>
      )}

      {/* Tela de Chamada Recebida (Modal) */}
      {incomingCall && !activeVoiceCall && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-2xl bg-white p-6 shadow-2xl max-w-sm w-full">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <div className="text-3xl font-bold text-green-600">
                  {incomingCall.callerName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
              {incomingCall.callerName}
            </h2>
            <p className="mb-6 text-center text-gray-600">A chamar...</p>

            <div className="flex gap-3">
              <button
                onClick={handleRejectIncomingCall}
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold py-3 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <PhoneOff className="h-5 w-5" />
                Rejeitar
              </button>
              <button
                onClick={handleAcceptIncomingCall}
                className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold py-3 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Phone className="h-5 w-5" />
                Aceitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Widget de Chamada de Voz Ativa */}
      {activeVoiceCall && (
        <VoiceCallWidgetEnhanced
          userId={userId}
          remoteUserId={activeVoiceCall}
          remoteUserName={remoteUserName}
          isIncoming={incomingCall?.callerId === activeVoiceCall}
          onCallEnd={handleCallEnd}
          rideId={rideId}
        />
      )}
    </div>
  );
}
