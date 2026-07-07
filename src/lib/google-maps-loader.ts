/**
 * Singleton loader for the Google Maps JavaScript API.
 * Uses the Lovable-managed referrer-restricted browser key.
 */

// Cobertura restrita: cidade do Lubango e arredores imediatos (Huíla).
// Bounding box apertada ~15 km em torno do centro do Lubango.
export const HUILA_BOUNDS = {
  south: -15.05,
  west: 13.35,
  north: -14.80,
  east: 13.63,
};

// Centro do mapa — Lubango.
export const LUBANGO_CENTER = { lat: -14.9177, lng: 13.4925 };

type GoogleNS = typeof globalThis & { google?: any; __legoInitGoogleMaps?: () => void };

let loaderPromise: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps requer browser"));
  }
  const w = window as GoogleNS;
  if (w.google?.maps) return Promise.resolve(w.google);
  if (loaderPromise) return loaderPromise;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as
    | string
    | undefined;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as
    | string
    | undefined;

  if (!key) {
    return Promise.reject(new Error("Google Maps browser key não disponível"));
  }

  loaderPromise = new Promise((resolve, reject) => {
    w.__legoInitGoogleMaps = () => {
      if (w.google?.maps) resolve(w.google);
      else reject(new Error("Google Maps não carregou correctamente"));
    };
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key,
      v: "weekly",
      libraries: "places,marker",
      loading: "async",
      callback: "__legoInitGoogleMaps",
      language: "pt",
      region: "AO",
    });
    if (channel) params.set("channel", channel);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Falha a carregar Google Maps"));
    document.head.appendChild(script);
  });

  return loaderPromise;
}
