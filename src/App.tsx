
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import TrackAnxiety from "./pages/TrackAnxiety";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/track-anxiety" element={<TrackAnxiety />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/find-therapist" element={<div className="p-8"><h1 className="text-2xl">Find Therapist - Coming Soon</h1></div>} />
                <Route path="/resources" element={<div className="p-8"><h1 className="text-2xl">Resources - Coming Soon</h1></div>} />
                <Route path="/settings" element={<div className="p-8"><h1 className="text-2xl">Settings - Coming Soon</h1></div>} />
                <Route path="/debug" element={<div className="p-8"><h1 className="text-2xl">Debug - Coming Soon</h1></div>} />
                <Route path="/help" element={<div className="p-8"><h1 className="text-2xl">Help - Coming Soon</h1></div>} />
                <Route path="/privacy" element={<div className="p-8"><h1 className="text-2xl">Privacy - Coming Soon</h1></div>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
