import { useState, useCallback, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Phone } from "lucide-react";
import { VoiceCallWidget } from "./VoiceCallWidget";
import { VoiceCallButton } from "./VoiceCallButton";
import { notifyIncomingCall } from "@/lib/voice-call.functions";
import { supabase } from "@/integrations/supabase/client";

interface RideWithVoiceCallProps {
  rideId: string;
  userId: string;
  remoteUserId: string | null;
  remoteUserName?: string;
  userRole: "driver" | "passenger";
}

/**
 * Componente de Corrida com Suporte a Chamadas de Voz
 * Integra o widget de chamada de voz com o fluxo de corrida
 */
export function RideWithVoiceCall({
  rideId,
  userId,
  remoteUserId,
  remoteUserName = "Utilizador",
  userRole,
}: RideWithVoiceCallProps) {
  const [activeVoiceCall, setActiveVoiceCall] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
  } | null>(null);
  const [callHistory, setCallHistory] = useState<any[]>([]);

  const notifyCall = useServerFn(notifyIncomingCall);

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
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Iniciar chamada de voz
  const handleStartVoiceCall = useCallback(
    async (targetUserId: string) => {
      if (!targetUserId) return;

      try {
        // Notificar o outro utilizador
        await notifyCall({
          data: {
            recipientId: targetUserId,
            callerId: userId,
            callerName: remoteUserName,
          },
        });

        // Enviar sinal de chamada recebida via Realtime
        const channel = supabase.channel(`voice_call_incoming:${targetUserId}`);
        await channel.send({
          type: "broadcast",
          event: "incoming_call",
          payload: {
            callerId: userId,
            callerName: remoteUserName,
            rideId,
          },
        });

        // Ativar widget de chamada
        setActiveVoiceCall(targetUserId);
      } catch (err) {
        console.error("Erro ao iniciar chamada:", err);
      }
    },
    [userId, remoteUserName, rideId, notifyCall],
  );

  // Aceitar chamada recebida
  const handleAcceptIncomingCall = useCallback(() => {
    if (incomingCall) {
      setActiveVoiceCall(incomingCall.callerId);
      setIncomingCall(null);
    }
  }, [incomingCall]);

  // Rejeitar chamada recebida
  const handleRejectIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Conteúdo da corrida */}
      <div className="flex flex-col gap-4 p-4">
        {/* Informações do utilizador remoto */}
        {remoteUserId && (
          <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm text-gray-600">
                {userRole === "driver" ? "Passageiro" : "Motorista"}
              </p>
              <p className="font-semibold text-gray-900">{remoteUserName}</p>
            </div>

            {/* Botão de Chamada de Voz */}
            <VoiceCallButton
              userId={userId}
              remoteUserId={remoteUserId}
              remoteUserName={remoteUserName}
              onCallStart={handleStartVoiceCall}
              className="px-4 py-2"
            />
          </div>
        )}

        {/* Histórico de Chamadas */}
        {callHistory.length > 0 && (
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">Histórico de Chamadas</h3>
            <div className="space-y-2">
              {callHistory.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-2"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {call.status === "completed"
                        ? `Chamada com ${call.caller.full_name}`
                        : `Chamada perdida de ${call.caller.full_name}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {call.duration_seconds > 0
                        ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
                        : "Sem duração"}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      call.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {call.status === "completed" ? "Completa" : "Perdida"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Widget de Chamada de Voz Ativa */}
      {activeVoiceCall && (
        <VoiceCallWidget
          userId={userId}
          remoteUserId={activeVoiceCall}
          remoteUserName={remoteUserName}
          isIncoming={incomingCall?.callerId === activeVoiceCall}
          onCallEnd={() => {
            setActiveVoiceCall(null);
            setIncomingCall(null);
          }}
        />
      )}

      {/* Tela de Chamada Recebida (Modal) */}
      {incomingCall && !activeVoiceCall && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-2xl bg-white p-6 shadow-2xl max-w-sm w-full">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                <div className="text-3xl font-bold text-blue-600">
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
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold py-3 transition-all active:scale-95"
              >
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
    </div>
  );
}
