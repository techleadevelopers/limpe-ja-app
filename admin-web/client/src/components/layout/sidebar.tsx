import { Link, useLocation } from "wouter";
import { Sparkles, ChartLine, Users, ClipboardCheck, ChartPie, Settings, UsersRound, MapPin, Bell, Cog, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext"; // Importa o contexto de autenticação
import logoImage from "../../assets/logo2.png"; // Importa a imagem da logo

export default function Sidebar() {
  const [location, setLocation] = useLocation(); // Agora também usa setLocation
  const { logout } = useAuth(); // Pega a função de logout do contexto
  
  const { data: metrics } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
  });

  const { data: verificationQueue } = useQuery({
    queryKey: ['/api/verification/pending-queue'], // AQUI: A rota foi corrigida para a nova rota de pendentes
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
      badge: (metrics as any)?.pendingVerifications || 0,
      isActive: location === "/providers",
    },
    {
      path: "/verification-queue",
      icon: ClipboardCheck,
      label: "Fila de Verificação",
      badge: (verificationQueue as any)?.length || 0,
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
      icon: Settings,
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
  ];

  const handleLogout = async () => {
    await logout();
    setLocation('/login'); // Redireciona para a página de login
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-floating-lg border-r border-gray-100">
      {/* Logo Section */}
      <div className="flex items-center justify-center px-6 py-6 border-b border-gray-100">
        {/* CORREÇÃO: Adicionando a imagem da logo e removendo a div extra */}
        <img 
          src={logoImage} 
          alt="LimpeJá Logo" 
          style={{ width: '150px', height: 'auto', objectFit: 'contain' }}
          className="rounded-2xl" 
        />
        {/* FIM do novo trecho */}
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
              {/* CORREÇÃO: Renderiza o badge apenas se for maior que 0 */}
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
          {/* BOTÃO DE LOGOUT AGORA COM A FUNÇÃO handleLogout */}
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
