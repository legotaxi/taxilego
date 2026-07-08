import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart3,
  Zap,
  Users,
  UserCheck,
  DollarSign,
  Headphones,
  Gift,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminRidesRealtime from "@/components/admin/AdminRidesRealtime";
import AdminDrivers from "@/components/admin/AdminDrivers";
import AdminPassengers from "@/components/admin/AdminPassengers";
import AdminFinance from "@/components/admin/AdminFinance";
import AdminSupport from "@/components/admin/AdminSupport";
import AdminPromotions from "@/components/admin/AdminPromotions";
import AdminReports from "@/components/admin/AdminReports";

export const Route = createFileRoute("/admin-console")({
  head: () => ({
    meta: [
      { title: "Admin Console · Lego Taxi" },
      { name: "description", content: "Painel de administração Lego Taxi." },
    ],
  }),
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });

    // Verificar se é admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.session.user.id);

    const isAdmin = (roles || []).some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) throw redirect({ to: "/minhas-corridas" });
  },
  component: AdminConsole,
});

type Section = "overview" | "rides" | "drivers" | "passengers" | "finance" | "support" | "promotions" | "reports";

interface NavItem {
  id: Section;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

function AdminConsole() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: "overview", label: "Visão geral", icon: <BarChart3 className="h-5 w-5" /> },
    { id: "rides", label: "Corridas em tempo real", icon: <Zap className="h-5 w-5" /> },
    { id: "drivers", label: "Motoristas", icon: <Users className="h-5 w-5" /> },
    { id: "passengers", label: "Passageiros", icon: <UserCheck className="h-5 w-5" /> },
    { id: "finance", label: "Finanças", icon: <DollarSign className="h-5 w-5" /> },
    { id: "support", label: "Suporte", icon: <Headphones className="h-5 w-5" /> },
    { id: "promotions", label: "Promoções", icon: <Gift className="h-5 w-5" /> },
    { id: "reports", label: "Relatórios", icon: <FileText className="h-5 w-5" /> },
  ];

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

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <AdminOverview />;
      case "rides":
        return <AdminRidesRealtime />;
      case "drivers":
        return <AdminDrivers />;
      case "passengers":
        return <AdminPassengers />;
      case "finance":
        return <AdminFinance />;
      case "support":
        return <AdminSupport />;
      case "promotions":
        return <AdminPromotions />;
      case "reports":
        return <AdminReports />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-foreground text-background transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-background/20">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center font-display font-black text-lg">
              L
            </div>
            <div>
              <div className="font-display font-black text-sm">Lego Taxi</div>
              <div className="text-[10px] uppercase tracking-wider text-background/60">Admin</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-background/70 hover:bg-background/10 hover:text-background"
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="border-t border-background/20 px-3 py-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-background/70 hover:bg-background/10 hover:text-background transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium flex-1 text-left">Fazer logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="z-30 shrink-0 border-b border-border bg-background/80 px-6 py-4 backdrop-blur-lg flex items-center justify-between md:justify-end">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Admin Console</div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {renderSection()}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
