import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { type MediaConnection } from "peerjs";
import { Phone, PhoneOff, Mic, MicOff, PhoneIncoming } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendCallInvite, logVoiceCall } from "@/lib/voice-call.functions";

interface Props {
  userId: string;
  userName?: string | null;
  remoteUserId: string | null | undefined;
  remoteUserName?: string | null;
  rideId?: string;
  className?: string;
}

// Deterministic PeerJS id derived from Supabase user id (alphanumeric-safe).
const peerIdFor = (uid: string) => `legotaxi-${uid.replace(/-/g, "")}`;

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function VoipCallControl({ userId, userName, remoteUserId, remoteUserName, rideId, className }: Props) {
  const [state, setState] = useState<"idle" | "calling" | "ringing" | "in-call">("idle");
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [incomingCallerName, setIncomingCallerName] = useState<string | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const peerOpenRef = useRef(false);
  const callRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const dialCancelRef = useRef<(() => void) | null>(null);
  const sendCallInviteFn = useServerFn(sendCallInvite);


  // Init PeerJS
  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    let disposed = false;

    const peer = new Peer(peerIdFor(userId), {
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      },
    });
    peerRef.current = peer;

    peer.on("open", () => {
      peerOpenRef.current = true;
    });

    peer.on("call", (incoming) => {
      if (disposed) return;
      callRef.current = incoming;
      setState("ringing");
      // Ringtone
      try {
        const r = new Audio("data:audio/wav;base64,UklGRlwAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YTgAAAA=");
        r.loop = true;
        ringtoneRef.current = r;
        r.play().catch(() => { /* ignore autoplay */ });
      } catch { /* ignore */ }
    });

    peer.on("error", (err) => {
      const errType = (err as { type?: string }).type;
      // peer-unavailable is expected during dial retries — handled inline in startCall.
      if (errType === "peer-unavailable") return;
      if (errType === "unavailable-id") return;
      console.warn("[voip] peer error", err);
    });

    peer.on("disconnected", () => {
      peerOpenRef.current = false;
      // auto-reconnect
      try { peer.reconnect(); } catch { /* ignore */ }
    });

    return () => {
      disposed = true;
      peerOpenRef.current = false;
      try { peer.destroy(); } catch { /* ignore */ }
      peerRef.current = null;
    };
  }, [userId]);


  // Realtime signaling channel: recipient shows "ringing" immediately when caller broadcasts.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`voip:${userId}`, { config: { broadcast: { self: false } } });
    channel
      .on("broadcast", { event: "invite" }, ({ payload }) => {
        if (state !== "idle") return;
        setIncomingCallerName((payload as { name?: string })?.name || null);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, state]);

  // Duration timer
  useEffect(() => {
    if (state === "in-call") {
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    if (state !== "ringing" && ringtoneRef.current) {
      try { ringtoneRef.current.pause(); } catch { /* ignore */ }
      ringtoneRef.current = null;
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [state]);

  const cleanup = useCallback(() => {
    dialCancelRef.current?.();
    dialCancelRef.current = null;
    try { callRef.current?.close(); } catch { /* ignore */ }

    callRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
    }
    if (ringtoneRef.current) {
      try { ringtoneRef.current.pause(); } catch { /* ignore */ }
      ringtoneRef.current = null;
    }
    setMuted(false);
    setIncomingCallerName(null);
  }, []);
  const cleanupRef = useRef(cleanup);
  cleanupRef.current = cleanup;

  const attachRemote = useCallback((stream: MediaStream) => {
    if (!audioElRef.current) {
      const a = document.createElement("audio");
      a.autoplay = true;
      audioElRef.current = a;
    }
    audioElRef.current.srcObject = stream;
    audioElRef.current.play().catch(() => { /* ignore autoplay */ });
  }, []);

  const waitForPeerOpen = useCallback(async () => {
    if (peerOpenRef.current) return true;
    const peer = peerRef.current;
    if (!peer) return false;
    return await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(peerOpenRef.current), 4000);
      peer.once("open", () => { clearTimeout(timeout); resolve(true); });
    });
  }, []);

  const startCall = useCallback(async () => {
    if (!remoteUserId || !peerRef.current) {
      toast.error("Utilizador indisponível");
      return;
    }
    try {
      // Broadcast invite via Supabase Realtime (wakes UI even before PeerJS resolves)
      const inviteChannel = supabase.channel(`voip:${remoteUserId}`);
      inviteChannel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await inviteChannel.send({
            type: "broadcast",
            event: "invite",
            payload: { from: userId, name: userName || "Contacto" },
          });
          setTimeout(() => { supabase.removeChannel(inviteChannel); }, 2000);
        }
      });

      // Push notification (wakes device / background tab)
      sendCallInviteFn({ data: { toUserId: remoteUserId, callerName: userName || undefined } }).catch(() => { /* ignore */ });

      const ok = await waitForPeerOpen();
      if (!ok) {
        toast.error("Falha a estabelecer ligação. Tenta novamente.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      setState("calling");

      // Retry dial: recipient's peer may not be registered yet (app opening / just accepted push)
      const startedAt = Date.now();
      const MAX_MS = 30000;
      let connected = false;
      let cancelled = false;

      const attemptDial = () => {
        if (cancelled || connected) return;
        if (!peerRef.current || !localStreamRef.current) return;
        const call = peerRef.current.call(peerIdFor(remoteUserId), localStreamRef.current);
        if (!call) {
          if (Date.now() - startedAt < MAX_MS) setTimeout(attemptDial, 1500);
          return;
        }
        callRef.current = call;

        call.on("stream", (remote) => {
          connected = true;
          attachRemote(remote);
          setState("in-call");
        });
        call.on("close", () => {
          if (connected) { cleanupRef.current?.(); setState("idle"); }
        });
        call.on("error", (err) => {
          const errType = (err as { type?: string })?.type;
          if (errType === "peer-unavailable" && !connected && Date.now() - startedAt < MAX_MS) {
            // retry
            try { call.close(); } catch { /* ignore */ }
            setTimeout(attemptDial, 1500);
            return;
          }
          if (!connected) {
            toast.error("O outro utilizador não atendeu");
            cleanupRef.current?.();
            setState("idle");
          }
        });

        // Fallback timeout: if no stream after MAX_MS, give up
        setTimeout(() => {
          if (!connected && callRef.current === call) {
            try { call.close(); } catch { /* ignore */ }
          }
        }, MAX_MS);
      };

      // Store canceller so endCall can stop the retry loop
      dialCancelRef.current = () => { cancelled = true; };
      attemptDial();
    } catch (err) {
      console.error("[voip] mic error", err);
      toast.error("Permissão de microfone negada");
      setState("idle");
    }
  }, [remoteUserId, userId, userName, attachRemote, sendCallInviteFn, waitForPeerOpen]);


  const acceptCall = useCallback(async () => {
    if (!callRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      callRef.current.answer(stream);
      callRef.current.on("stream", (remote) => {
        attachRemote(remote);
        setState("in-call");
      });
      callRef.current.on("close", () => { cleanup(); setState("idle"); });
      callRef.current.on("error", () => { cleanup(); setState("idle"); });
    } catch (err) {
      console.error(err);
      toast.error("Permissão de microfone negada");
      try { callRef.current?.close(); } catch { /* ignore */ }
      setState("idle");
    }
  }, [attachRemote, cleanup]);

  const rejectCall = useCallback(() => {
    try { callRef.current?.close(); } catch { /* ignore */ }
    callRef.current = null;
    cleanup();
    setState("idle");
  }, [cleanup]);

  const endCall = useCallback(async () => {
    const finalDuration = duration;
    cleanup();
    setState("idle");
    
    // Log call if it was active
    if (finalDuration > 0 && rideId && remoteUserId) {
      try {
        await logVoiceCall({ 
          data: { 
            ride_id: rideId, 
            recipient_id: remoteUserId, 
            duration_seconds: finalDuration,
            status: 'completed'
          } 
        });
      } catch (e) {
        console.error("[voip] log error", e);
      }
    }
  }, [cleanup, duration, rideId, remoteUserId]);

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }, []);

  const name = state === "ringing" ? (incomingCallerName || "Chamada recebida") : (remoteUserName || "Utilizador");

  return (
    <>
      <button
        type="button"
        onClick={startCall}
        disabled={!remoteUserId || state !== "idle"}
        title={remoteUserId ? `Chamar ${remoteUserName || "contacto"} por internet` : "Aguardando ligação"}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-black shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50",
          className,
        )}
      >
        <Phone className="h-7 w-7" />
      </button>

      {(state === "calling" || state === "ringing" || state === "in-call") && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-neutral-950/95 backdrop-blur-md p-8 text-white animate-fade-in">
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-primary">
              {state === "ringing" ? "Chamada recebida" : state === "calling" ? "A chamar..." : "Em chamada"}
            </div>
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary text-black text-5xl font-black shadow-2xl">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="mt-4 text-2xl font-bold">{name}</div>
            <div className="text-sm text-white/60">
              {state === "in-call" ? formatDuration(duration) : "VoIP · Áudio pela internet"}
            </div>
          </div>

          <div className="flex items-center gap-6 mb-10">
            {state === "ringing" ? (
              <>
                <button
                  onClick={rejectCall}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl active:scale-95"
                  aria-label="Rejeitar"
                >
                  <PhoneOff className="h-7 w-7" />
                </button>
                <button
                  onClick={acceptCall}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-xl active:scale-95 animate-pulse"
                  aria-label="Aceitar"
                >
                  <PhoneIncoming className="h-7 w-7" />
                </button>
              </>
            ) : (
              <>
                {state === "in-call" && (
                  <button
                    onClick={toggleMute}
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl active:scale-95",
                      muted ? "bg-white/20" : "bg-white/10",
                    )}
                    aria-label="Mudo"
                  >
                    {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </button>
                )}
                <button
                  onClick={endCall}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl active:scale-95"
                  aria-label="Terminar"
                >
                  <PhoneOff className="h-7 w-7" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
