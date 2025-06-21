
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Registration from "./pages/Registration";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import TrackAnxiety from "./pages/TrackAnxiety";
import Analytics from "./pages/Analytics";
import FindTherapist from "./pages/FindTherapist";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <Routes>
                <Route path="/" element={<Registration />} />
                <Route path="*" element={
                  <ProtectedRoute>
                    <>
                      <AppSidebar />
                      <main className="flex-1">
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/chat" element={<Chat />} />
                          <Route path="/track-anxiety" element={<TrackAnxiety />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/find-therapist" element={<FindTherapist />} />
                          <Route path="/resources" element={<div className="p-8"><h1 className="text-2xl">Resources - Coming Soon</h1></div>} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/help" element={<Help />} />
                          <Route path="/privacy" element={<Privacy />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                    </>
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
