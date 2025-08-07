import { Link, useLocation } from "wouter";
import { Sparkles, ChartLine, Users, ClipboardCheck, ChartPie, Settings, UsersRound, MapPin, Bell, Cog, LogOut, FileSearch, Handshake, DollarSign, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import logoImage from "../../assets/logo2.png";

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();

  // Busca dados do backend para badges e métricas.
  // As rotas para estas queries precisam ser implementadas no backend.
  const { data: pendingProvidersData } = useQuery({
    queryKey: ['verification-queue'],
    queryFn: () => fetch('/api/verification/pending-queue').then(res => res.json()), // Exemplo de busca da fila
  });

  const { data: pendingDisputesData } = useQuery({
    queryKey: ['pending-disputes'],
    queryFn: () => fetch('/api/disputes/pending-count').then(res => res.json()), // Endpoint hipotético, mas necessário
  });

  const { data: pendingSafetyAlertsData } = useQuery({
    queryKey: ['pending-safety-alerts'],
    queryFn: () => fetch('/api/safety/pending-count').then(res => res.json()), // Endpoint hipotético, mas necessário
  });

  const navItems = [
    {
      path: "/",
      icon: ChartLine,
      label: "Painel",
      isActive: location === "/",
    },
    {
      path: "/providers",
      icon: Users,
      label: "Gestão de Provedores",
      // Badge para a contagem de provedores pendentes de verificação.
      badge: pendingProvidersData?.length || 0,
      isActive: location === "/providers",
    },
    {
      path: "/verification-queue",
      icon: ClipboardCheck,
      label: "Fila de Verificação",
      // Badge para a contagem de provedores na fila de verificação.
      badge: pendingProvidersData?.length || 0,
      isActive: location === "/verification-queue",
    },
    {
      path: "/financial-analytics",
      icon: ChartPie,
      label: "Análise Financeira",
      isActive: location === "/financial-analytics",
    },
    {
      path: "/service-management",
      icon: Sparkles,
      label: "Gestão de Serviços",
      isActive: location === "/service-management",
    },
    {
      path: "/user-management",
      icon: UsersRound,
      label: "Gestão de Usuários",
      isActive: location === "/user-management",
    },
    {
      path: "/provider-map",
      icon: MapPin,
      label: "Mapa de Provedores",
      isActive: location === "/provider-map",
    },
    // NOVO: Módulos de gestão de disputas e pagamentos.
    {
      path: "/dispute-management",
      icon: Handshake,
      label: "Gestão de Disputas",
      // Badge para a contagem de disputas pendentes.
      badge: pendingDisputesData?.count || 0,
      isActive: location === "/dispute-management",
    },
    {
      path: "/payment-management",
      icon: DollarSign,
      label: "Gestão de Pagamentos",
      isActive: location === "/payment-management",
    },
    // NOVO: Módulo de segurança.
    {
      path: "/safety-alerts",
      icon: LifeBuoy,
      label: "Alertas de Segurança",
      badge: pendingSafetyAlertsData?.count || 0,
      isActive: location === "/safety-alerts",
    },
  ];

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-floating-lg border-r border-gray-100">
      {/* Logo Section */}
      <div className="flex items-center justify-center px-6 py-6 border-b border-gray-100">
        <img 
          src={logoImage} 
          alt="LimpeJá Logo" 
          style={{ width: '150px', height: 'auto', objectFit: 'contain' }}
          className="rounded-2xl" 
        />
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6 px-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
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
              {item.badge > 0 && (
                <span className={cn(
                  "ml-auto text-xs px-2 py-1 rounded-full",
                  item.badge > 5 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

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
              <Bell className={cn(
                "w-5 h-5 mr-3",
                location === "/notifications" ? "text-medium-blue" : "text-gray-400 group-hover:text-medium-blue"
              )} />
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
              <Cog className={cn(
                "w-5 h-5 mr-3",
                location === "/settings" ? "text-medium-blue" : "text-gray-400 group-hover:text-medium-blue"
              )} />
              Configurações
            </Link>
          </div>
        </div>
      </nav>

      {/* Admin Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
        <div className="flex items-center">
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100" 
            alt="Admin profile" 
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">admin@limpeja.com</p>
          </div>
          <button 
            onClick={handleLogout} 
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}