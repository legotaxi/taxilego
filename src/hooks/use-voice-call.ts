import { useState, useEffect, useCallback, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export interface VoiceCallState {
  isCallActive: boolean;
  isRinging: boolean;
  isMuted: boolean;
  isAudioOn: boolean;
  remoteUserId: string | null;
  callDuration: number;
  error: string | null;
}

interface IceCandidate {
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
}

interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "call-end";
  from: string;
  to: string;
  data?: any;
  timestamp: number;
}

/**
 * Hook para gerenciar chamadas de voz via WebRTC
 * Utiliza Supabase Realtime para sinalização
 */
export function useVoiceCall(userId: string, remoteUserId: string | null) {
  const [state, setState] = useState<VoiceCallState>({
    isCallActive: false,
    isRinging: false,
    isMuted: false,
    isAudioOn: true,
    remoteUserId: null,
    callDuration: 0,
    error: null,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const iceCandidatesQueueRef = useRef<IceCandidate[]>([]);

  // Configuração do ICE servers (STUN/TURN)
  const iceServers = [
    { urls: ["stun:stun.l.google.com:19302"] },
    { urls: ["stun:stun1.l.google.com:19302"] },
    { urls: ["stun:stun2.l.google.com:19302"] },
    { urls: ["stun:stun3.l.google.com:19302"] },
    { urls: ["stun:stun4.l.google.com:19302"] },
  ];

  // Inicializar conexão Supabase Realtime para sinalização
  useEffect(() => {
    if (!userId || !remoteUserId) return;

    const channelName = `voice_call_${[userId, remoteUserId].sort().join("_")}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    });

    channel
      .on("broadcast", { event: "signaling" }, ({ payload }: { payload: SignalingMessage }) => {
        handleSignalingMessage(payload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Supabase Realtime subscribed for voice call");
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [userId, remoteUserId]);

  // Obter stream de áudio local
  const getLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (localStreamRef.current) return localStreamRef.current;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      const errorMsg = "Erro ao aceder ao microfone";
      console.error(errorMsg, err);
      setState((prev) => ({ ...prev, error: errorMsg }));
      return null;
    }
  }, []);

  // Enviar mensagem de sinalização
  const sendSignalingMessage = useCallback(
    async (message: Omit<SignalingMessage, "from" | "timestamp">) => {
      if (!channelRef.current) return;

      try {
        await channelRef.current.send("broadcast", {
          event: "signaling",
          payload: {
            ...message,
            from: userId,
            timestamp: Date.now(),
          },
        });
      } catch (err) {
        console.error("Erro ao enviar mensagem de sinalização:", err);
      }
    },
    [userId],
  );

  // Processar mensagens de sinalização
  const handleSignalingMessage = useCallback(
    async (message: SignalingMessage) => {
      // Ignorar mensagens próprias
      if (message.from === userId) return;

      try {
        switch (message.type) {
          case "offer":
            await handleOffer(message.data);
            break;
          case "answer":
            await handleAnswer(message.data);
            break;
          case "ice-candidate":
            await handleIceCandidate(message.data);
            break;
          case "call-end":
            endCall();
            break;
        }
      } catch (err) {
        console.error("Erro ao processar mensagem de sinalização:", err);
      }
    },
    [userId],
  );

  // Criar e enviar oferta SDP
  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      try {
        if (!peerConnectionRef.current) {
          await createPeerConnection();
        }

        const pc = peerConnectionRef.current;
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await sendSignalingMessage({
          type: "answer",
          to: remoteUserId!,
          data: answer,
        });
      } catch (err) {
        console.error("Erro ao processar oferta:", err);
      }
    },
    [remoteUserId, sendSignalingMessage],
  );

  // Processar resposta SDP
  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Processar ICE candidates em fila
        while (iceCandidatesQueueRef.current.length > 0) {
          const candidate = iceCandidatesQueueRef.current.shift();
          if (candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Erro ao adicionar ICE candidate:", err);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao processar resposta:", err);
      }
    },
    [],
  );

  // Processar ICE candidates
  const handleIceCandidate = useCallback(
    async (candidate: IceCandidate) => {
      try {
        const pc = peerConnectionRef.current;
        if (!pc) {
          iceCandidatesQueueRef.current.push(candidate);
          return;
        }

        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          iceCandidatesQueueRef.current.push(candidate);
        }
      } catch (err) {
        console.error("Erro ao adicionar ICE candidate:", err);
      }
    },
    [],
  );

  // Criar conexão peer
  const createPeerConnection = useCallback(async () => {
    try {
      const pc = new RTCPeerConnection({
        iceServers,
      });

      // Adicionar stream local
      const localStream = await getLocalStream();
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // Lidar com tracks remotas
      pc.ontrack = (event) => {
        console.log("Track remoto recebido:", event.track.kind);
        if (remoteStreamRef.current) {
          remoteStreamRef.current.addTrack(event.track);
        } else {
          remoteStreamRef.current = event.streams[0];
        }
      };

      // Lidar com ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingMessage({
            type: "ice-candidate",
            to: remoteUserId!,
            data: {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid,
            },
          });
        }
      };

      // Lidar com mudanças de estado
      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected" ||
          pc.connectionState === "closed"
        ) {
          endCall();
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    } catch (err) {
      const errorMsg = "Erro ao criar conexão peer";
      console.error(errorMsg, err);
      setState((prev) => ({ ...prev, error: errorMsg }));
      return null;
    }
  }, [getLocalStream, remoteUserId, sendSignalingMessage]);

  // Iniciar chamada (como chamador)
  const startCall = useCallback(async () => {
    try {
      if (!remoteUserId) {
        setState((prev) => ({ ...prev, error: "ID do utilizador remoto não definido" }));
        return;
      }

      setState((prev) => ({ ...prev, isRinging: true, error: null }));

      const pc = await createPeerConnection();
      if (!pc) return;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await sendSignalingMessage({
        type: "offer",
        to: remoteUserId,
        data: offer,
      });
    } catch (err) {
      const errorMsg = "Erro ao iniciar chamada";
      console.error(errorMsg, err);
      setState((prev) => ({ ...prev, error: errorMsg, isRinging: false }));
    }
  }, [remoteUserId, createPeerConnection, sendSignalingMessage]);

  // Aceitar chamada
  const acceptCall = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isCallActive: true, isRinging: false, error: null }));
      startCallTimer();
    } catch (err) {
      const errorMsg = "Erro ao aceitar chamada";
      console.error(errorMsg, err);
      setState((prev) => ({ ...prev, error: errorMsg }));
    }
  }, []);

  // Rejeitar chamada
  const rejectCall = useCallback(async () => {
    try {
      if (remoteUserId) {
        await sendSignalingMessage({
          type: "call-end",
          to: remoteUserId,
        });
      }
      endCall();
    } catch (err) {
      console.error("Erro ao rejeitar chamada:", err);
    }
  }, [remoteUserId, sendSignalingMessage]);

  // Terminar chamada
  const endCall = useCallback(() => {
    // Parar timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    // Fechar peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Parar streams locais
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Limpar fila de ICE candidates
    iceCandidatesQueueRef.current = [];

    setState((prev) => ({
      ...prev,
      isCallActive: false,
      isRinging: false,
      callDuration: 0,
      remoteUserId: null,
    }));
  }, []);

  // Alternar mudo
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, []);

  // Alternar áudio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setState((prev) => ({ ...prev, isAudioOn: !prev.isAudioOn }));
    }
  }, []);

  // Iniciar timer de duração da chamada
  const startCallTimer = useCallback(() => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);

    callTimerRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        callDuration: prev.callDuration + 1,
      }));
    }, 1000);
  }, []);

  // Obter stream remoto
  const getRemoteStream = useCallback(() => {
    return remoteStreamRef.current;
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    ...state,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleAudio,
    getRemoteStream,
    localStream: localStreamRef.current,
  };
}
