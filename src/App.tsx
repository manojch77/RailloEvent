import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import SplashScreen from "./pages/SplashScreen";
import RoleSelect from "./pages/RoleSelect";
import StudentLogin from "./pages/student/StudentLogin";
import StudentSignup from "./pages/student/StudentSignup";
import StudentDashboard from "./pages/student/StudentDashboard";
import AdminLogin, { AdminSignup } from "./pages/admin/AdminAuth";
import AdminDashboard, { CreateEvent } from "./pages/admin/AdminDashboard";
import {
  StudentCertificates,
  StudentScanner,
  StudentNotifications,
  StudentHistory,
  StudentProfile,
  AdminCertificates,
  AdminNotifications,
  AdminAnalytics,
} from "./pages/PlaceholderPages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/role-select" element={<RoleSelect />} />

            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/signup" element={<StudentSignup />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/certificates" element={<StudentCertificates />} />
            <Route path="/student/scanner" element={<StudentScanner />} />
            <Route path="/student/notifications" element={<StudentNotifications />} />
            <Route path="/student/history" element={<StudentHistory />} />
            <Route path="/student/profile" element={<StudentProfile />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/signup" element={<AdminSignup />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/create-event" element={<CreateEvent />} />
            <Route path="/admin/certificates" element={<AdminCertificates />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/profile" element={<StudentProfile />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
