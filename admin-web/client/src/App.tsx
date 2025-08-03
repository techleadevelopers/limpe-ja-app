import { Switch, Route, useLocation } from "wouter";
import queryClient from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Providers from "@/pages/providers";
import VerificationQueue from "@/pages/verification-queue";
import Settings from "@/pages/settings";
import Notifications from "@/pages/notifications";
import ProviderMap from "@/pages/provider-map";
import UserManagement from "@/pages/user-management";
import ServiceManagement from "@/pages/service-management";
import FinancialAnalytics from "@/pages/financial-analytics";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login"; // Importa a nova página de login
import { AuthProvider, useAuth } from "@/context/AuthContext"; // Importa o AuthProvider e useAuth
import { Skeleton } from "./components/ui/skeleton"; // Para o estado de carregamento

// Componente para rotas protegidas
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    // Exibe um spinner ou tela de carregamento enquanto verifica a autenticação
    return (
      <div className="flex min-h-screen items-center justify-center bg-admin-bg">
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation('/login'); // Redireciona para a página de login
    return null;
  }

  return <>{children}</>;
}

function AppRouter() {
  // O componente AppRouter agora só define as rotas e não interfere na navegação
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/notifications">
        <PrivateRoute>
          <Notifications />
        </PrivateRoute>
      </Route>
      <Route path="/dashboard">
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      </Route>
      <Route path="/providers">
        <PrivateRoute>
          <Providers />
        </PrivateRoute>
      </Route>
      <Route path="/verification-queue">
        <PrivateRoute>
          <VerificationQueue />
        </PrivateRoute>
      </Route>
      <Route path="/financial-analytics">
        <PrivateRoute>
          <FinancialAnalytics />
        </PrivateRoute>
      </Route>
      <Route path="/service-management">
        <PrivateRoute>
          <ServiceManagement />
        </PrivateRoute>
      </Route>
      <Route path="/user-management">
        <PrivateRoute>
          <UserManagement />
        </PrivateRoute>
      </Route>
      <Route path="/provider-map">
        <PrivateRoute>
          <ProviderMap />
        </PrivateRoute>
      </Route>
      <Route path="/settings">
        <PrivateRoute>
          <Settings />
        </PrivateRoute>
      </Route>
      {/* Adicionei a rota para a página raiz para direcionar para o dashboard se autenticado */}
      <Route path="/">
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      </Route>
      {/* Rota 404 para qualquer outra rota não encontrada */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider> {/* Envolve o AppRouter com AuthProvider */}
          <AppRouter />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
