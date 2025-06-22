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
                {/* Public routes */}
                <Route path="/" element={<Registration />} />
                <Route path="/privacy" element={<Privacy />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <>
                      <AppSidebar />
                      <main className="flex-1">
                        <Dashboard />
                      </main>
                    </>
                  </ProtectedRoute>
                } />
                
                <Route path="/chat" element={
                  <ProtectedRoute>
                    <>
                      <AppSidebar />
                      <main className="flex-1">
                        <Chat />
                      </main>
                    </>
                  </ProtectedRoute>
                } />
                
                <Route path="/track-anxiety" element={
                  <ProtectedRoute>
                    <>
                      <AppSidebar />
                      <main className="flex-1">
                        <TrackAnxiety />
                      </main>
                    </>
                  </ProtectedRoute>
                } />
                
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <>
                      <AppSidebar />
                      <main className="flex-1">
                        <Analytics />
                      </main>
                    </>
                  </ProtectedRoute>
                } />
                
                <Route path="/find-therapist" element={
                  <ProtectedRoute>
                    <>
                      <AppSidebar />
                      <main className="flex-1">
                        <FindTherapist />
                      </main>
                    </>
                  </ProtectedRoute>
                } />
                
                <Route path="/resources" element={
                  <ProtectedRoute>
                    <>
                      <AppSidebar />
                      <main className="flex-1">
                        <div className="p-8"><h1 className="text-2xl">Resources - Coming Soon</h1></div>
                      </main>
                    </>
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <>
                      <AppSidebar />
                      <main className="flex-1">
                        <Settings />
                      </main>
                    </>
                  </ProtectedRoute>
                } />
                
                <Route path="/help" element={
                  <ProtectedRoute>
                    <>
                      <AppSidebar />
                      <main className="flex-1">
                        <Help />
                      </main>
                    </>
                  </ProtectedRoute>
                } />
                
                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
