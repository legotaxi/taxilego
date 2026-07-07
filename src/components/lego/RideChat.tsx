import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Phone, ArrowLeft, Info, Loader2, MessageCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  getRideMessages,
  sendRideMessage,
  markRideMessagesRead,
} from "@/lib/chat.functions";

type Role = "passenger" | "driver";

interface ChatMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_role: Role;
  text: string;
  read_at: string | null;
  created_at: string;
}

interface RideChatProps {
  rideId: string;
  myUserId: string;
  myRole: Role;
  counterpartName: string;
  counterpartAvatarUrl?: string | null;
  onCall?: () => void;
  onClose: () => void;
}

/**
 * Chat em tempo real entre passageiro e motorista.
 * Usa tokens semânticos do design system e Supabase Realtime.
 */
export function RideChat({
  rideId,
  myUserId,
  myRole,
  counterpartName,
  counterpartAvatarUrl,
  onCall,
  onClose,
}: RideChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useServerFn(getRideMessages);
  const sendMessage = useServerFn(sendRideMessage);
  const markRead = useServerFn(markRideMessagesRead);

  // Initial load + mark read
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const res = await fetchMessages({ data: { ride_id: rideId } });
      if (active) setMessages((res.messages ?? []) as ChatMessage[]);
      setLoading(false);
      markRead({ data: { ride_id: rideId } }).catch(() => {});
    })();
    return () => {
      active = false;
    };
  }, [rideId, fetchMessages, markRead]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`ride_messages:${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ride_messages",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg],
          );
          if (newMsg.sender_id !== myUserId) {
            markRead({ data: { ride_id: rideId } }).catch(() => {});
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, myUserId, markRead]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    // optimistic
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      ride_id: rideId,
      sender_id: myUserId,
      sender_role: myRole,
      text: trimmed,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    try {
      const res = await sendMessage({ data: { ride_id: rideId, text: trimmed } });
      if (res.ok && res.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? (res.message as ChatMessage) : m)),
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  }, [text, sending, rideId, myUserId, myRole, sendMessage]);

  const initial = (counterpartName || "?").charAt(0).toUpperCase();

  const fmtTime = (iso: string) =>
    new Date(iso)
      .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      .toLowerCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-[#f2f2f2] shadow-2xl sm:h-[680px] sm:max-h-[90vh] sm:max-w-md sm:rounded-[28px]">
        {/* Header */}
        <header className="flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-700 active:scale-95 transition"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          {counterpartAvatarUrl ? (
            <img
              src={counterpartAvatarUrl}
              alt={counterpartName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-white text-sm font-bold">
              {initial}
            </div>
          )}
          <p className="flex-1 min-w-0 truncate text-[17px] font-semibold text-neutral-900">
            {counterpartName}
          </p>
          {onCall && (
            <button
              onClick={onCall}
              className="rounded-full p-1.5 text-neutral-800 active:scale-95 transition"
              aria-label="Ligar"
            >
              <Phone className="h-[22px] w-[22px]" />
            </button>
          )}
          <button
            className="rounded-full p-1.5 text-neutral-800 active:scale-95 transition"
            aria-label="Informações"
          >
            <Info className="h-[22px] w-[22px]" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {loading ? (
            <div className="flex h-full items-center justify-center text-neutral-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex justify-center py-1">
                <span className="rounded-md bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm">
                  Hoje
                </span>
              </div>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-16 text-center px-6">
                  <p className="text-sm font-medium text-neutral-700">Sem mensagens ainda</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Diga olá ou combine o ponto de encontro.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_id === myUserId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={[
                          "max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug",
                          mine
                            ? "bg-neutral-900 text-white rounded-br-sm"
                            : "bg-[#e4e4e4] text-neutral-900 rounded-bl-sm",
                        ].join(" ")}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p
                          className={[
                            "mt-1 text-right text-[10px]",
                            mine ? "text-white/60" : "text-neutral-500",
                          ].join(" ")}
                        >
                          {fmtTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-[#f2f2f2] px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3"
        >
          <div className="flex flex-1 items-center rounded-full bg-white px-5 py-3 shadow-sm">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder="Escreva a sua mensagem..."
              className="flex-1 resize-none bg-transparent text-[15px] leading-tight text-neutral-900 outline-none placeholder:text-neutral-400 max-h-32"
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white shadow active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Enviar"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Botão flutuante com contador de não-lidas */
export function RideChatButton({
  unreadCount = 0,
  onClick,
}: {
  unreadCount?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition hover:opacity-90"
      aria-label="Abrir chat"
    >
      <MessageCircle className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground border-2 border-background">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
