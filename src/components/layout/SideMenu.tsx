import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Settings, LogOut, Bell, Moon, Sun, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  role: "student" | "admin";
}

const SideMenu = ({ open, onClose, role }: SideMenuProps) => {
  const navigate = useNavigate();
  const { user, logout, isDark, toggleTheme, notificationsEnabled, toggleNotifications } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate("/role-select", { replace: true });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-card border-r border-border flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <img src={isDark ? logoDark : logoLight} alt="Raillo" className="h-8 w-8" />
                <span className="font-bold text-lg text-gradient"></span>
              </div>
              <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>

            {user && (
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{user.name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.rollNumber || user.dept || "User"}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 p-4 space-y-1 overflow-y-auto">
              <button
                onClick={() => { navigate(`/${role}/profile`); onClose(); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-muted transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">Profile</span>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span className="text-sm font-medium">Settings</span>
                <ChevronRight className={`h-4 w-4 ml-auto text-muted-foreground transition-transform ${showSettings ? "rotate-90" : ""}`} />
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 space-y-2 overflow-hidden"
                  >
                    <div className="flex items-center justify-between rounded-lg px-3 py-3 glass">
                      <div className="flex items-center gap-3">
                        {isDark ? <Moon className="h-4 w-4 text-foreground" /> : <Sun className="h-4 w-4 text-foreground" />}
                        <Label className="text-sm font-medium cursor-pointer">Dark Mode</Label>
                      </div>
                      <Switch checked={isDark} onCheckedChange={toggleTheme} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg px-3 py-3 glass">
                      <div className="flex items-center gap-3">
                        <Bell className="h-4 w-4 text-foreground" />
                        <Label className="text-sm font-medium cursor-pointer">Notifications</Label>
                      </div>
                      <Switch checked={notificationsEnabled} onCheckedChange={toggleNotifications} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-border p-4 space-y-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
              <p className="text-center text-xs text-muted-foreground">Raillo v1.0.0</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default SideMenu;
