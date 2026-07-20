import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { type MediaConnection } from "peerjs";
import { Phone, PhoneOff, Mic, MicOff, PhoneIncoming } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  userId: string;
  remoteUserId: string | null | undefined;
  remoteUserName?: string | null;
  className?: string;
}

// Deterministic PeerJS id derived from Supabase user id (alphanumeric-safe).
const peerIdFor = (uid: string) => `legotaxi-${uid.replace(/-/g, "")}`;

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function VoipCallControl({ userId, remoteUserId, remoteUserName, className }: Props) {
  const [state, setState] = useState<"idle" | "calling" | "ringing" | "in-call">("idle");
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Init PeerJS
  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    let disposed = false;

    const peer = new Peer(peerIdFor(userId), {
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });
    peerRef.current = peer;

    peer.on("call", (incoming) => {
      if (disposed) return;
      callRef.current = incoming;
      setState("ringing");
    });

    peer.on("error", (err) => {
      console.warn("[voip] peer error", err);
    });

    return () => {
      disposed = true;
      try { peer.destroy(); } catch { /* ignore */ }
      peerRef.current = null;
    };
  }, [userId]);

  // Duration timer
  useEffect(() => {
    if (state === "in-call") {
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [state]);

  const cleanup = useCallback(() => {
    try { callRef.current?.close(); } catch { /* ignore */ }
    callRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
    }
    setMuted(false);
  }, []);

  const attachRemote = useCallback((stream: MediaStream) => {
    if (!audioElRef.current) {
      const a = document.createElement("audio");
      a.autoplay = true;
      audioElRef.current = a;
    }
    audioElRef.current.srcObject = stream;
    audioElRef.current.play().catch(() => { /* ignore autoplay */ });
  }, []);

  const startCall = useCallback(async () => {
    if (!remoteUserId || !peerRef.current) {
      toast.error("Utilizador indisponível");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const call = peerRef.current.call(peerIdFor(remoteUserId), stream);
      if (!call) {
        toast.error("Não foi possível iniciar a chamada");
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      callRef.current = call;
      setState("calling");

      call.on("stream", (remote) => {
        attachRemote(remote);
        setState("in-call");
      });
      call.on("close", () => { cleanup(); setState("idle"); });
      call.on("error", () => { toast.error("Erro na chamada"); cleanup(); setState("idle"); });
    } catch (err) {
      console.error("[voip] mic error", err);
      toast.error("Permissão de microfone negada");
    }
  }, [remoteUserId, attachRemote, cleanup]);

  const acceptCall = useCallback(async () => {
    if (!callRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
    setState("idle");
  }, []);

  const endCall = useCallback(() => {
    cleanup();
    setState("idle");
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }, []);

  const name = remoteUserName || "Utilizador";

  return (
    <>
      <button
        type="button"
        onClick={startCall}
        disabled={!remoteUserId || state !== "idle"}
        title={remoteUserId ? `Chamar ${name} por internet` : "Aguardando ligação"}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50",
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
