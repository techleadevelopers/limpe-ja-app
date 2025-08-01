import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/providers" component={Providers} />
      <Route path="/verification-queue" component={VerificationQueue} />
      <Route path="/financial-analytics" component={FinancialAnalytics} />
      <Route path="/service-management" component={ServiceManagement} />
      <Route path="/user-management" component={UserManagement} />
      <Route path="/provider-map" component={ProviderMap} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
