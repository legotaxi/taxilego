import { useEffect } from "react";

/**
 * Activa o modo "App Nativa": bloqueia scroll global do body,
 * aplica safe-areas (notch/home-indicator), desactiva pull-to-refresh
 * e o realce de toque. O conteúdo da página (primeiro filho do body)
 * passa a ter altura de ecrã e o seu próprio scroll interno.
 *
 * Usar em rotas autenticadas (passageiro, motorista, admin).
 */
export function useNativeShell() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("native-shell");
    body.classList.add("native-shell");
    return () => {
      html.classList.remove("native-shell");
      body.classList.remove("native-shell");
    };
  }, []);
}
