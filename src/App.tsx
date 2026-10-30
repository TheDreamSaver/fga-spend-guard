import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Auth0Provider } from '@auth0/auth0-react';
import { auth0Config, AUTH0_CONFIGURED } from './lib/auth-config';
import LandingPage from "./pages/LandingPage";
import DemoApp from "./pages/DemoApp";
import AuthenticatedApp from "./pages/AuthenticatedApp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Pages = () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/demo" element={<DemoApp />} />
            <Route path="/app" element={AUTH0_CONFIGURED ? <AuthenticatedApp /> : <main className="p-8"><p>Sign-in is not configured for this demo.</p><a href="/demo">Use the persona demo</a></main>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
);

const App = () => AUTH0_CONFIGURED ? (
  <Auth0Provider domain={auth0Config.domain} clientId={auth0Config.clientId} authorizationParams={auth0Config.authorizationParams} useRefreshTokens={auth0Config.useRefreshTokens} cacheLocation={auth0Config.cacheLocation}>
    <Pages />
  </Auth0Provider>
) : <Pages />;

export default App;
