import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Award, Bell, History, Plus, Upload, BarChart3, ScanLine } from "lucide-react";
import { motion } from "framer-motion";
import TopNav from "./TopNav";

interface BottomTab {
  icon: ReactNode;
  label: string;
  path: string;
}

const studentTabs: BottomTab[] = [
  { icon: <Home className="h-5 w-5" />, label: "Home", path: "/student/dashboard" },
  { icon: <Award className="h-5 w-5" />, label: "Certs", path: "/student/certificates" },
  { icon: <ScanLine className="h-6 w-6" />, label: "Scan", path: "/student/scanner" },
  { icon: <Bell className="h-5 w-5" />, label: "Alerts", path: "/student/notifications" },
  { icon: <History className="h-5 w-5" />, label: "History", path: "/student/history" },
];

const adminTabs: BottomTab[] = [
  { icon: <Home className="h-5 w-5" />, label: "Home", path: "/admin/dashboard" },
  { icon: <Upload className="h-5 w-5" />, label: "Certs", path: "/admin/certificates" },
  { icon: <Plus className="h-6 w-6" />, label: "Create", path: "/admin/create-event" },
  { icon: <Bell className="h-5 w-5" />, label: "Notify", path: "/admin/notifications" },
  { icon: <BarChart3 className="h-5 w-5" />, label: "Analytics", path: "/admin/analytics" },
];

interface AppLayoutProps {
  children: ReactNode;
  role: "student" | "admin";
}

const AppLayout = ({ children, role }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = role === "student" ? studentTabs : adminTabs;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav role={role} />
      <main className="flex-1 pb-24 pt-16 px-4">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-around py-2">
          {tabs.map((tab, index) => {
            const isActive = location.pathname === tab.path;
            // Special styling for center buttons (Scan/Create) - PhonePe style
            const isCenter = tab.label === "Scan" || tab.label === "Create";
            
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 transition-colors ${
                  isCenter ? "z-10" : ""
                }`}
              >
                {isCenter ? (
                  <motion.div
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 25,
                      delay: index * 0.05 
                    }}
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.92 }}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-500/40 flex items-center justify-center text-white -mt-7 border-4 border-background ring-2 ring-indigo-500/20"
                  >
                    {tab.icon}
                  </motion.div>
                ) : (
                  <motion.span 
                    className={isActive ? "text-indigo-500" : "text-muted-foreground"}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab.icon}
                  </motion.span>
                )}
                <span className={`text-[10px] font-medium ${isActive ? "text-indigo-500" : "text-muted-foreground"}`}>
                  {tab.label}
                </span>
                {isActive && !isCenter && (
                  <motion.div
                    layoutId="bottomTab"
                    className="absolute -top-0.5 h-0.5 w-6 rounded-full bg-indigo-500"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
