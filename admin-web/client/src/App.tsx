import React from "react";
import { Switch, Route, useLocation } from "wouter";
import queryClient from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CommandPalette from "@/components/layout/command-palette";
import Dashboard from "@/pages/dashboard/dashboard";
import Providers from "@/pages/providers/providers";
import VerificationQueue from "@/pages/users/verification-queue";
import Settings from "@/pages/settings/settings";
import Notifications from "@/pages/notifications/notifications";
import ProviderMap from "@/pages/providers/provider-map";
import UserManagement from "@/pages/users/user-management";
import ServiceManagement from "@/pages/services/service-management";
import FinancialAnalytics from "@/pages/analytics/financial-analytics";
import NotFound from "@/pages/not-found";
import DisputeManagement from "@/pages/disputes/dispute-management";
import PaymentManagement from "@/pages/payments/payment-management";
import SafetyAlerts from "@/pages/safety/safety-alerts";
import LoginPage from "@/pages/login";
import BookingOversight from "@/pages/bookings/booking-oversight";
import LiveTracking from "@/pages/live-tracking";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Skeleton } from "./components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-admin-bg">
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  // RBAC básico: somente ADMIN deve acessar o painel
  if (user?.role && user.role !== "ADMIN") {
    setLocation("/login");
    return (
      <div className="flex min-h-screen items-center justify-center bg-admin-bg px-4 text-center">
        <div className="space-y-2">
          <p className="text-lg font-semibold text-gray-800">Acesso não permitido</p>
          <p className="text-sm text-gray-600">Esta área é restrita para administradores.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppRouter() {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
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
          <Route path="/dispute-management">
            <PrivateRoute>
              <DisputeManagement />
            </PrivateRoute>
          </Route>
          <Route path="/payment-management">
            <PrivateRoute>
              <PaymentManagement />
            </PrivateRoute>
          </Route>
          <Route path="/safety-alerts">
            <PrivateRoute>
              <SafetyAlerts />
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
          <Route path="/booking-oversight">
            <PrivateRoute>
              <BookingOversight />
            </PrivateRoute>
          </Route>
          <Route path="/live-tracking">
            <PrivateRoute>
              <LiveTracking />
            </PrivateRoute>
          </Route>
          <Route path="/settings">
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          </Route>
          <Route path="/">
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <AppRouter />
          <CommandPalette />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
