import React from "react";
import { Link, useLocation } from "wouter";
import {
  Sparkles,
  ChartLine,
  Users,
  ClipboardCheck,
  ChartPie,
  UsersRound,
  MapPin,
  Bell,
  Cog,
  LogOut,
  Handshake,
  DollarSign,
  LifeBuoy,
  CalendarClock,
  Radar,
  MessageSquare,
  Gift,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchVerificationQueue } from "@/lib/api";
import logoImage from "../../assets/logo2.png";

type NavItem = {
  path: string;
  icon: React.ComponentType<any>;
  label: string;
  badge?: number;
  isActive?: boolean;
};

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();

  // Badges: dependerão dos endpoints no backend
  const { data: pendingProvidersData } = useQuery({
    queryKey: ["verification-queue"],
    queryFn: () => fetchVerificationQueue(),
  });
  const { data: pendingDisputesData } = useQuery({
    queryKey: ["pending-disputes"],
    queryFn: () => fetch("/api/disputes/pending-count").then((res) => res.json()),
  });
  const { data: pendingSafetyAlertsData } = useQuery({
    queryKey: ["pending-safety-alerts"],
    queryFn: () => fetch("/api/safety/pending-count").then((res) => res.json()),
  });

  const primary: NavItem[] = [
    { path: "/", icon: ChartLine, label: "Painel", isActive: location === "/" },
    {
      path: "/providers",
      icon: Users,
      label: "Gestão de Provedores",
      badge: pendingProvidersData?.length || 0,
      isActive: location === "/providers",
    },
    {
      path: "/verification-queue",
      icon: ClipboardCheck,
      label: "Fila de Verificação",
      badge: pendingProvidersData?.length || 0,
      isActive: location === "/verification-queue",
    },
    { path: "/financial-analytics", icon: ChartPie, label: "Análise Financeira", isActive: location === "/financial-analytics" },
    { path: "/service-management", icon: Sparkles, label: "Gestão de Serviços", isActive: location === "/service-management" },
    { path: "/user-management", icon: UsersRound, label: "Gestão de Usuários", isActive: location === "/user-management" },
    { path: "/provider-map", icon: MapPin, label: "Mapa de Provedores", isActive: location === "/provider-map" },
  ];

  const ops: NavItem[] = [
    {
      path: "/booking-oversight",
      icon: CalendarClock,
      label: "Gestão de Agendamentos",
      isActive: location === "/booking-oversight",
    },
    { path: "/dispute-management", icon: Handshake, label: "Gestão de Disputas", badge: pendingDisputesData?.count || 0, isActive: location === "/dispute-management" },
    { path: "/live-tracking", icon: Radar, label: "Live Tracking", isActive: location === "/live-tracking" },
    { path: "/observability", icon: Activity, label: "Monitoramento de Sa�de", isActive: location === "/observability" },
    { path: "/payment-management", icon: DollarSign, label: "Gestão de Pagamentos", isActive: location === "/payment-management" },
    { path: "/safety-alerts", icon: LifeBuoy, label: "Alertas de Segurança", badge: pendingSafetyAlertsData?.count || 0, isActive: location === "/safety-alerts" },
    { path: "/support-center", icon: MessageSquare, label: "Central de Suporte", isActive: location === "/support-center" },
  ];

  const growth: NavItem[] = [
    { path: "/referral-management", icon: Gift, label: "Programa de Indicações", isActive: location === "/referral-management" },
  ];

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const renderGroup = (title: string, items: NavItem[]) => (
    <div className="mt-6">
      <p className="px-4 mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">{title}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            title={item.label}
            className={cn(
              "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group",
              item.isActive
                ? "text-medium-blue bg-gray-50 shadow-floating hover:shadow-floating-lg"
                : "text-gray-700 hover:bg-gray-50 hover:shadow-floating"
            )}
          >
            <item.icon
              className={cn(
                "w-5 h-5 mr-3",
                item.isActive ? "text-medium-blue" : "text-gray-400 group-hover:text-medium-blue"
              )}
            />
            {item.label}
            {typeof item.badge === "number" && item.badge > 0 && (
              <span
                className={cn(
                  "ml-auto text-xs px-2 py-1 rounded-full",
                  item.badge > 5 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-floating-lg border-r border-gray-100">
      {/* Logo */}
      <div className="flex items-center justify-center px-6 py-6 border-b border-gray-100">
        <img src={logoImage} alt="LimpeJá Logo" style={{ width: "150px", height: "auto" }} />
      </div>

      <nav className="p-4">
        {renderGroup("Principal", primary)}
        {renderGroup("Operações", ops)}
        {renderGroup("Crescimento", growth)}

        {/* Settings Section */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="space-y-2">
            <Link
              href="/notifications"
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group",
                location === "/notifications"
                  ? "text-medium-blue bg-gray-50 shadow-floating hover:shadow-floating-lg"
                  : "text-gray-700 hover:bg-gray-50 hover:shadow-floating"
              )}
            >
              <Bell
                className={cn(
                  "w-5 h-5 mr-3",
                  location === "/notifications" ? "text-medium-blue" : "text-gray-400 group-hover:text-medium-blue"
                )}
              />
              Notificações
            </Link>
            <Link
              href="/settings"
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group",
                location === "/settings"
                  ? "text-medium-blue bg-gray-50 shadow-floating hover:shadow-floating-lg"
                  : "text-gray-700 hover:bg-gray-50 hover:shadow-floating"
              )}
            >
              <Cog
                className={cn(
                  "w-5 h-5 mr-3",
                  location === "/settings" ? "text-medium-blue" : "text-gray-400 group-hover:text-medium-blue"
                )}
              />
              Configurações
            </Link>
          </div>
        </div>
      </nav>

      {/* Admin Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
        <div className="flex items-center">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100"
            alt="Admin profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">admin@limpeja.com</p>
          </div>
          <button onClick={handleLogout} className="ml-auto text-gray-400 hover:text-gray-600" aria-label="Sair">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

