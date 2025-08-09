
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
import ResetPassword from "./pages/ResetPassword";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Index from "./pages/Index";

import Analytics from "./pages/Analytics";
import FindTherapist from "./pages/FindTherapist";
import TreatmentResources from "./pages/TreatmentResources";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import TermsOfService from "./pages/TermsOfService";
import Notifications from "./pages/Notifications";
import TherapistPortal from "./pages/TherapistPortal";
import TherapistInfo from "./pages/TherapistInfo";

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
              <Route path="/registration" element={<Registration />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/support" element={<Support />} />
              <Route path="/therapist-portal" element={<TherapistPortal />} />
              <Route path="/therapist-info" element={<TherapistInfo />} />
              
              {/* Assessment route - no sidebar for now */}
              <Route path="/assessment" element={<Assessment />} />
              
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
              
              
              <Route path="/analytics" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <Analytics />
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
                      <TreatmentResources />
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
              
              <Route path="/notifications" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <ProtectedRoute>
                        <Notifications />
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
