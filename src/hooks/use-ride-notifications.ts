import { useEffect, useRef, useCallback, useState } from "react";
import { supabase as supabaseClient } from "@/integrations/supabase/client";

export interface RideNotification {
  id: string;
  category: string;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_address: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  fare_kz: number;
  distance_km: number | null;
  duration_min: number | null;
  status: string;
  created_at: string;
  passenger_name?: string;
  passenger_phone?: string;
}

/**
 * Hook para gerenciar notificações de corridas em tempo real
 * Usa Supabase Realtime para atualizações instantâneas
 *
 * @param onNewRide Callback quando chega novo pedido
 * @param onRideUpdate Callback em qualquer update
 * @param options.allowedCategories Lista de categorias que este motorista pode aceitar (vehicle category match).
 *                                   Se vazio/undefined recebe todas (compatibilidade).
 */
export function useRideNotifications(
  onNewRide?: (ride: RideNotification) => void,
  onRideUpdate?: (ride: RideNotification) => void,
  options?: { allowedCategories?: string[] },
) {
  const [newRides, setNewRides] = useState<RideNotification[]>([]);
  const subscriptionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationCountRef = useRef(0);
  const allowedCategories = options?.allowedCategories;

  // Criar som de notificação
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      const duration = 0.5;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.error("Erro ao tocar som de notificação:", error);
    }
  }, []);

  const showBrowserNotification = useCallback((ride: RideNotification) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Nova Corrida Disponível! 🚗", {
          body: `${ride.category} - ${ride.pickup_address} → ${ride.dropoff_address}\n${ride.fare_kz} Kz`,
          icon: "/logo.png",
          tag: `ride-${ride.id}`,
          requireInteraction: true,
        });
      } catch (error) {
        console.error("Erro ao mostrar notificação:", error);
      }
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.error("Erro ao solicitar permissão de notificação:", error);
      }
    }
  }, []);

  const vibrateDevice = useCallback(() => {
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 200]);
      } catch (error) {
        console.error("Erro ao fazer vibração:", error);
      }
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();

    const subscription = supabaseClient
      .channel("rides-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rides",
          filter: "status=eq.requested",
        },
        (payload) => {
          const newRide = payload.new as RideNotification;

          // Filtro por categoria: só notificar motoristas cujo veículo encaixa
          if (
            allowedCategories &&
            allowedCategories.length > 0 &&
            !allowedCategories.includes(newRide.category)
          ) {
            return;
          }

          setNewRides((prev) => [newRide, ...prev]);
          notificationCountRef.current += 1;
          onNewRide?.(newRide);
          playNotificationSound();
          vibrateDevice();
          showBrowserNotification(newRide);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
        },
        (payload) => {
          const updatedRide = payload.new as RideNotification;
          onRideUpdate?.(updatedRide);
        },
      )
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      subscription.unsubscribe();
    };
  }, [onNewRide, onRideUpdate, playNotificationSound, vibrateDevice, showBrowserNotification, requestNotificationPermission, allowedCategories]);


  // Limpar notificação
  const clearNotification = useCallback((rideId: string) => {
    setNewRides((prev) => prev.filter((ride) => ride.id !== rideId));
  }, []);

  // Limpar todas as notificações
  const clearAllNotifications = useCallback(() => {
    setNewRides([]);
    notificationCountRef.current = 0;
  }, []);

  return {
    newRides,
    notificationCount: newRides.length,
    clearNotification,
    clearAllNotifications,
    playNotificationSound,
    vibrateDevice,
    showBrowserNotification,
    requestNotificationPermission,
  };
}

/**
 * Hook para gerenciar notificações de status de corrida
 */
export function useRideStatusNotifications(rideId: string) {
  const [rideStatus, setRideStatus] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!rideId) return;

    const subscription = supabaseClient
      .channel(`ride-${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `id=eq.${rideId}`,
        },
        (payload) => {
          const updatedRide = payload.new as any;
          setRideStatus(updatedRide.status);
        },
      )
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      subscription.unsubscribe();
    };
  }, [rideId]);

  return { rideStatus };
}
