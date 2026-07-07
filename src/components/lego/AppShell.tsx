import { MapPin, History, Wallet, LogOut, Car } from "lucide-react";
import { ReactNode } from "react";
import { useLocation, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useNativeShell } from "@/hooks/use-native-shell";
import { toast } from "sonner";


interface AppShellProps {
  children: ReactNode;
  showNav?: boolean;
  role?: "passenger" | "driver";
}

export function AppShell({ children, showNav = true, role = "passenger" }: AppShellProps) {
  useNativeShell();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();


  const passengerTabs = [
    { label: "Pedir", icon: MapPin, to: "/pedir" },
    { label: "Atividade", icon: History, to: "/minhas-corridas" },
    { label: "Carteira", icon: Wallet, to: "/carteira" },
  ];

  const driverTabs = [
    { label: "Painel", icon: Car, to: "/painel-motorista" },
    { label: "Ganhos", icon: Wallet, to: "/carteira" },
  ];

  const tabs = role === "driver" ? driverTabs : passengerTabs;

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Desconectado com sucesso");
      navigate({ to: "/login" });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao desconectar");
    }
  };

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-background">
      {/* Área de conteúdo — sem scroll global, cada ecrã controla o seu */}
      <main className="relative flex-1 overflow-hidden">{children}</main>


      {/* Bottom Navigation Bar - Premium Native Style */}
      {showNav && (
        <nav className="z-50 flex h-24 shrink-0 items-center justify-around border-t border-border/50 bg-background/80 px-2 pb-safe pt-3 backdrop-blur-2xl shadow-2xl">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.to;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`group relative flex flex-col items-center justify-center gap-1.5 px-4 py-2 transition-all duration-300 ease-out ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -top-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                )}
                
                <div
                  className={`rounded-2xl p-2.5 transition-all duration-300 ${
                    isActive 
                      ? "bg-primary/15 scale-110" 
                      : "group-hover:bg-muted/60 group-hover:scale-105"
                  }`}
                >
                  <Icon className={`h-6 w-6 transition-all duration-300 ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`} />
                </div>
                <span className={`text-[11px] font-semibold transition-colors duration-300 ${
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}>{tab.label}</span>
              </Link>
            );
          })}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="group relative flex flex-col items-center justify-center gap-1.5 px-4 py-2 transition-all duration-300 text-muted-foreground hover:text-destructive"
            title="Fazer logout"
          >
            <div className="rounded-2xl p-2.5 transition-all duration-300 group-hover:bg-destructive/10 group-hover:scale-105">
              <LogOut className="h-6 w-6 transition-all duration-300" />
            </div>
            <span className="text-[11px] font-semibold">Sair</span>
          </button>
        </nav>
      )}
    </div>
  );
}
