import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";

const RoleSelect = () => {
  const navigate = useNavigate();
  const { isDark } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col items-center gap-3">

        <img src={isDark ? logoDark : logoLight} alt="Raillo" className="h-16 w-16" />
        
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8 text-center text-muted-foreground">

        Select your role to continue
      </motion.p>

      <div className="flex w-full max-w-sm flex-col gap-4">
        <motion.button
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/student/login")}
          className="glass flex items-center gap-4 rounded-xl p-5 transition-all hover:shadow-glow">

          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground">Student</p>
            <p className="text-sm text-muted-foreground">Register & attend events</p>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/admin/login")}
          className="glass flex items-center gap-4 rounded-xl p-5 transition-all hover:shadow-glow">

          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground">Admin</p>
            <p className="text-sm text-muted-foreground">Create & manage events</p>
          </div>
        </motion.button>
      </div>
    </div>);

};

export default RoleSelect;