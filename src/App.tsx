import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Onboarding from "./pages/Onboarding";
import Chat from "./pages/Chat";
import Journal from "./pages/Journal";
import Mood from "./pages/Mood";
import Topics from "./pages/Topics";
import Toolbox from "./pages/Toolbox";
import Summary from "./pages/Summary";
import Safety from "./pages/Safety";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Onboarding */}
          <Route path="/" element={<Onboarding />} />
          
          {/* Main app with bottom navigation */}
          <Route element={<AppLayout />}>
            <Route path="/chat" element={<Chat />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/mood" element={<Mood />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/toolbox" element={<Toolbox />} />
          </Route>
          
          {/* Standalone pages */}
          <Route path="/summary" element={<Summary />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
