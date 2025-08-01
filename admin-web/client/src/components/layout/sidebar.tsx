import { Link, useLocation } from "wouter";
import { Sparkles, ChartLine, Users, ClipboardCheck, ChartPie, Settings, UsersRound, MapPin, Bell, Cog, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export default function Sidebar() {
  const [location] = useLocation();
  
  const { data: metrics } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
  });

  const { data: verificationQueue } = useQuery({
    queryKey: ['/api/verification-queue'],
  });

  const navItems = [
    {
      path: "/",
      icon: ChartLine,
      label: "Dashboard",
      isActive: location === "/",
    },
    {
      path: "/providers",
      icon: Users,
      label: "Provider Management",
      badge: (metrics as any)?.pendingVerifications || 0,
      isActive: location === "/providers",
    },
    {
      path: "/verification-queue",
      icon: ClipboardCheck,
      label: "Verification Queue",
      badge: (verificationQueue as any)?.length || 0,
      isActive: location === "/verification-queue",
    },
    {
      path: "/financial-analytics",
      icon: ChartPie,
      label: "Financial Analytics",
      isActive: location === "/financial-analytics",
    },
    {
      path: "/service-management",
      icon: Settings,
      label: "Service Management",
      isActive: location === "/service-management",
    },
    {
      path: "/user-management",
      icon: UsersRound,
      label: "User Management",
      isActive: location === "/user-management",
    },
    {
      path: "/provider-map",
      icon: MapPin,
      label: "Provider Map",
      isActive: location === "/provider-map",
    },
  ];

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-floating-lg border-r border-gray-100">
      {/* Logo Section */}
      <div className="flex items-center px-6 py-6 border-b border-gray-100">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-light-blue to-medium-blue rounded-xl flex items-center justify-center shadow-floating">
            <Sparkles className="text-white" size={20} />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">LimpeJá</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
        </div>
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
                  ? "text-white bg-gradient-to-r from-light-blue to-medium-blue shadow-floating hover:shadow-floating-lg"
                  : "text-gray-700 hover:bg-gray-50 hover:shadow-floating"
              )}
            >
              <item.icon 
                className={cn(
                  "w-5 h-5 mr-3",
                  item.isActive ? "text-white" : "text-gray-400 group-hover:text-medium-blue"
                )} 
              />
              {item.label}
              {item.badge && item.badge > 0 && (
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
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-300 group"
            >
              <Bell className="w-5 h-5 mr-3 text-gray-400 group-hover:text-medium-blue" />
              Notifications
            </Link>
            <Link
              href="/settings"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-300 group"
            >
              <Cog className="w-5 h-5 mr-3 text-gray-400 group-hover:text-medium-blue" />
              Settings
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
          <button className="ml-auto text-gray-400 hover:text-gray-600">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
