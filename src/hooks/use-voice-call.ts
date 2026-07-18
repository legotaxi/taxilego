import { useState, useEffect, useRef, useCallback } from "react";
import Peer, { MediaConnection } from "peerjs";

/**
 * Hook para gerir chamadas de voz WebRTC usando PeerJS
 */
export function useVoiceCall(userId: string, remoteUserId: string | null) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar PeerJS
  useEffect(() => {
    if (!userId) return;

    const peer = new Peer(userId, {
      debug: 1,
    });

    peer.on("open", (id) => {
      console.log("PeerJS aberto com ID:", id);
    });

    peer.on("call", (incomingCall) => {
      console.log("Recebendo chamada de:", incomingCall.peer);
      callRef.current = incomingCall;
      setIsRinging(true);
    });

    peer.on("error", (err) => {
      console.error("Erro no PeerJS:", err);
      setError("Erro na conexão de voz. Tente novamente.");
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
    };
  }, [userId]);

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      const call = peerRef.current.call(remoteUserId, stream);
      callRef.current = call;
      setIsRinging(true);

      call.on("stream", (remoteStream) => {
        remoteStreamRef.current = remoteStream;
        setIsCallActive(true);
        setIsRinging(false);
      });

      call.on("close", () => {
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
    }
  }, [remoteUserId]);

  const acceptCall = useCallback(async () => {
    if (!callRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      callRef.current.answer(stream);
      setIsRinging(false);
      setIsCallActive(true);

      callRef.current.on("stream", (remoteStream) => {
        remoteStreamRef.current = remoteStream;
      });

      callRef.current.on("close", () => {
        endCall();
      });
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
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    getRemoteStream,
  };
}
