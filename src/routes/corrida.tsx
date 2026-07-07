import { createFileRoute, redirect } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle, Shield, Share2, Star, Navigation2, MapPin } from "lucide-react";
import { PhoneFrame } from "@/components/lego/PhoneFrame";
import { MapView } from "@/components/lego/MapView";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/corrida")({
  head: () => ({
    meta: [
      { title: "Corrida ao vivo · Lego Taxi" },
      {
        name: "description",
        content:
          "Acompanhe a sua corrida Lego Taxi em tempo real — motorista, viatura, ETA e botão de emergência.",
      },
    ],
  }),
  // Esta página é apenas marketing/preview. Quem está autenticado vai direto à sua atividade real.
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/minhas-corridas" });
  },
  component: RidePage,
});

function RidePage() {
  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground">
              <span className="font-display text-lg font-black text-primary">L</span>
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Lego Taxi</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Voltar
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-2 lg:items-center">
        {/* Info side */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1.5 text-xs font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />A caminho · chega
            em 3 min
          </div>
          <h1 className="mt-5 font-display text-4xl font-black leading-tight sm:text-5xl text-balance">
            O seu motorista está{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">a caminho</span>.
          </h1>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Acompanhe a posição em tempo real, ligue ou envie mensagem, e partilhe a sua viagem com
            a família. Em caso de emergência, o botão SOS contacta directamente a nossa central em
            Luanda.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Navigation2 className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display text-2xl font-bold">3 min</div>
              <div className="text-xs text-muted-foreground">Tempo até recolha</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display text-2xl font-bold">1.4 km</div>
              <div className="text-xs text-muted-foreground">Distância</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                <Star className="h-5 w-5 fill-primary text-primary" />
              </div>
              <div className="mt-4 font-display text-2xl font-bold">4.92</div>
              <div className="text-xs text-muted-foreground">Avaliação do motorista</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
                <Shield className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display text-2xl font-bold">SOS</div>
              <div className="text-xs text-muted-foreground">Botão de emergência</div>
            </div>
          </div>
        </div>

        {/* Phone preview */}
        <div className="flex justify-center lg:justify-end">
          <PhoneFrame>
            <div className="flex h-full flex-col">
              <div className="h-10 shrink-0" />
              <div className="z-20 flex items-center justify-between px-5 pb-3">
                <Link
                  to="/"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft"
                >
                  ←
                </Link>
                <div className="flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-xs font-bold text-success-foreground shadow-soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" /> Ao vivo
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-soft">
                  <Shield className="h-5 w-5" />
                </button>
              </div>

              <div className="relative flex-1">
                <MapView />
              </div>

              <div className="z-30 -mt-8 rounded-t-3xl bg-card shadow-elevated animate-slide-up">
                <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

                <div className="px-5 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wider text-success">
                      Chega em 3 min
                    </div>
                    <div className="text-xs text-muted-foreground">LD-42-AB-23</div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-foreground text-primary flex items-center justify-center font-display text-lg font-black">
                      JM
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold">João Manuel</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-primary text-primary" /> 4.92 · Toyota Corolla
                        preto
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-black">Kz 1.450</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        MCX Express
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button className="flex items-center justify-center gap-1.5 rounded-2xl bg-muted py-3 text-xs font-semibold">
                      <Phone className="h-4 w-4" /> Ligar
                    </button>
                    <button className="flex items-center justify-center gap-1.5 rounded-2xl bg-muted py-3 text-xs font-semibold">
                      <MessageCircle className="h-4 w-4" /> Chat
                    </button>
                    <button className="flex items-center justify-center gap-1.5 rounded-2xl bg-muted py-3 text-xs font-semibold">
                      <Share2 className="h-4 w-4" /> Partilhar
                    </button>
                  </div>

                  <button className="mt-4 mb-5 w-full rounded-2xl border-2 border-destructive py-3 font-display text-sm font-bold text-destructive">
                    Cancelar corrida
                  </button>
                </div>
              </div>
            </div>
          </PhoneFrame>
        </div>
      </div>
    </main>
  );
}
