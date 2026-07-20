import { useState, useEffect, useRef, useCallback } from "react";
import Peer, { MediaConnection } from "peerjs";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook melhorado para gerir chamadas de voz WebRTC usando PeerJS
 * Inclui signaling via Supabase Realtime para melhor confiabilidade
 */
export function useVoiceCallEnhanced(userId: string, remoteUserId: string | null) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "ringing" | "connected">("idle");

  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const signalingChannelRef = useRef<any | null>(null);

  // Inicializar PeerJS com servidor TURN customizado (opcional)
  useEffect(() => {
    if (!userId) return;

    const peer = new Peer(userId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
          { urls: ["stun:stun1.l.google.com:19302"] },
        ],
      },
    });

    peer.on("open", (id) => {
      console.log("PeerJS aberto com ID:", id);
      setError(null);
    });

    peer.on("call", (incomingCall) => {
      console.log("Recebendo chamada de:", incomingCall.peer);
      callRef.current = incomingCall;
      setIsRinging(true);
      setCallStatus("ringing");
    });

    peer.on("error", (err) => {
      console.error("Erro no PeerJS:", err);
      setError("Erro na conexão de voz. Tente novamente.");
      setCallStatus("idle");
    });

    peer.on("disconnected", () => {
      console.warn("PeerJS desconectado");
      setError("Conexão perdida");
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
    };
  }, [userId]);

  // Configurar canal de signaling via Supabase Realtime
  useEffect(() => {
    if (!userId || !remoteUserId) return;

    const channel = supabase.channel(`voice_signaling:${userId}`);

    channel
      .on("broadcast", { event: "call_signal" }, ({ payload }) => {
        console.log("Sinal de chamada recebido:", payload);
        // O sinal é processado pelo PeerJS automaticamente
      })
      .subscribe();

    signalingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, remoteUserId]);

  // Gerir cronómetro da chamada
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  const startCall = useCallback(async () => {
    if (!remoteUserId || !peerRef.current) return;

    try {
      setCallStatus("calling");
      setError(null);

      // Solicitar acesso ao microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;

      // Iniciar chamada
      const call = peerRef.current.call(remoteUserId, stream);
      callRef.current = call;
      setIsRinging(true);

      // Enviar sinal via Supabase
      if (signalingChannelRef.current) {
        await signalingChannelRef.current.send({
          type: "broadcast",
          event: "call_signal",
          payload: {
            type: "call_initiated",
            callerId: userId,
            recipientId: remoteUserId,
          },
        });
      }

      call.on("stream", (remoteStream) => {
        console.log("Stream remoto recebido");
        remoteStreamRef.current = remoteStream;
        setIsCallActive(true);
        setIsRinging(false);
        setCallStatus("connected");
      });

      call.on("close", () => {
        console.log("Chamada fechada");
        endCall();
      });

      call.on("error", (err) => {
        console.error("Erro na chamada:", err);
        setError("A chamada falhou.");
        endCall();
      });
    } catch (err) {
      console.error("Erro ao aceder ao microfone:", err);
      setError("Permissão de microfone negada.");
      setCallStatus("idle");
    }
  }, [remoteUserId, userId]);

  const acceptCall = useCallback(async () => {
    if (!callRef.current) return;

    try {
      setError(null);

      // Solicitar acesso ao microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;

      // Aceitar chamada
      callRef.current.answer(stream);
      setIsRinging(false);
      setIsCallActive(true);
      setCallStatus("connected");

      callRef.current.on("stream", (remoteStream) => {
        console.log("Stream remoto recebido após aceitar");
        remoteStreamRef.current = remoteStream;
      });

      callRef.current.on("close", () => {
        console.log("Chamada fechada após aceitar");
        endCall();
      });

      // Enviar confirmação via Supabase
      if (signalingChannelRef.current) {
        await signalingChannelRef.current.send({
          type: "broadcast",
          event: "call_signal",
          payload: {
            type: "call_accepted",
            recipientId: callRef.current.peer,
          },
        });
      }
    } catch (err) {
      console.error("Erro ao aceitar chamada:", err);
      setError("Erro ao aceder ao microfone.");
      rejectCall();
    }
  }, []);

  const rejectCall = useCallback(() => {
    if (callRef.current) {
      callRef.current.close();
    }
    setIsRinging(false);
    setCallStatus("idle");
    callRef.current = null;
  }, []);

  const endCall = useCallback(() => {
    if (callRef.current) {
      callRef.current.close();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    setIsCallActive(false);
    setIsRinging(false);
    setCallDuration(0);
    setCallStatus("idle");
    callRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [isMuted]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  }, [isAudioOn]);

  const getRemoteStream = useCallback(() => {
    return remoteStreamRef.current;
  }, []);

  return {
    isCallActive,
    isRinging,
    isMuted,
    isAudioOn,
    callDuration,
    error,
    callStatus,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleAudio,
    getRemoteStream,
  };
}
