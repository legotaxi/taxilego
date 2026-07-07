import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { loadGoogleMaps, HUILA_BOUNDS, LUBANGO_CENTER } from "@/lib/google-maps-loader";

interface Suggestion {
  placeId: string;
  text: string;
  secondary?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: [number, number], address: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Autocomplete usando Places API (New) restrito à região de Huíla (Lubango e arredores).
 */
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Pesquisar local…",
  icon,
  className,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionTokenRef = useRef<any>(null);
  const placesLibRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGoogleMaps()
      .then(async (google) => {
        const places = await google.maps.importLibrary("places");
        placesLibRef.current = places;
        sessionTokenRef.current = new places.AutocompleteSessionToken();
      })
      .catch((e) => console.error("Places load error:", e));
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const fetchSuggestions = useCallback(async (input: string) => {
    const places = placesLibRef.current;
    if (!places || !input.trim() || input.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const { suggestions: results } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        sessionToken: sessionTokenRef.current,
        language: "pt",
        region: "ao",
        locationRestriction: {
          west: HUILA_BOUNDS.west,
          south: HUILA_BOUNDS.south,
          east: HUILA_BOUNDS.east,
          north: HUILA_BOUNDS.north,
        },
        origin: LUBANGO_CENTER,
      });
      const parsed: Suggestion[] = (results ?? [])
        .filter((s: any) => s.placePrediction)
        .map((s: any) => ({
          placeId: s.placePrediction.placeId,
          text:
            s.placePrediction.mainText?.toString?.() ??
            s.placePrediction.text?.toString?.() ??
            "",
          secondary: s.placePrediction.secondaryText?.toString?.() ?? "",
        }));
      setSuggestions(parsed);
      setOpen(true);
    } catch (e) {
      console.error("Autocomplete error:", e);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 250);
  };

  const handlePick = async (s: Suggestion) => {
    const places = placesLibRef.current;
    if (!places) return;
    setOpen(false);
    try {
      const place = new places.Place({ id: s.placeId });
      await place.fetchFields({ fields: ["location", "formattedAddress", "displayName"] });
      const loc = place.location;
      if (!loc) return;
      const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
      const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;
      const address = place.formattedAddress ?? s.text;
      onChange(address);
      onSelect([lat, lng], address);
      // Refresh session token after a selection (billing best practice)
      sessionTokenRef.current = new places.AutocompleteSessionToken();
    } catch (e) {
      console.error("Place details error:", e);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <div className="flex items-center gap-3">
        {icon ?? <Search className="h-4 w-4 text-muted-foreground shrink-0" />}
        <input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-semibold outline-none"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-72 overflow-auto rounded-xl border border-border bg-card shadow-xl z-50">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s.placeId}
              onClick={() => handlePick(s)}
              className="w-full text-left px-3 py-2.5 hover:bg-muted transition border-b border-border last:border-0 flex items-start gap-2"
            >
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{s.text}</div>
                {s.secondary && (
                  <div className="text-xs text-muted-foreground truncate">{s.secondary}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
