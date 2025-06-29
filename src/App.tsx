
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
import TreatmentResources from "./pages/TreatmentResources";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";

// Create QueryClient outside of component to avoid hooks violations
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes - no sidebar */}
              <Route path="/" element={<Registration />} />
              <Route path="/privacy" element={<Privacy />} />
              
              {/* Protected routes - with sidebar */}
              <Route path="/dashboard" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    </main>
                  </div>
                </SidebarProvider>
              } />
              
              <Route path="/chat" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    </main>
                  </div>
                </SidebarProvider>
              } />
              
              <Route path="/track-anxiety" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <ProtectedRoute>
                        <TrackAnxiety />
                      </ProtectedRoute>
                    </main>
                  </div>
                </SidebarProvider>
              } />
              
              <Route path="/analytics" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <ProtectedRoute>
                        <Analytics />
                      </ProtectedRoute>
                    </main>
                  </div>
                </SidebarProvider>
              } />
              
              <Route path="/find-therapist" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <ProtectedRoute>
                        <FindTherapist />
                      </ProtectedRoute>
                    </main>
                  </div>
                </SidebarProvider>
              } />
              
              <Route path="/treatment-resources" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <ProtectedRoute>
                        <TreatmentResources />
                      </ProtectedRoute>
                    </main>
                  </div>
                </SidebarProvider>
              } />
              
              <Route path="/settings" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    </main>
                  </div>
                </SidebarProvider>
              } />
              
              <Route path="/help" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <ProtectedRoute>
                        <Help />
                      </ProtectedRoute>
                    </main>
                  </div>
                </SidebarProvider>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
