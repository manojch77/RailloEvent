import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";

const StudentLogin = () => {
  const navigate = useNavigate();
  const { login, isDark, user, role, loading: authLoading } = useAuth();
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in as student
  useEffect(() => {
    if (!authLoading && user && role === "student") {
      navigate("/student/dashboard", { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(rollNumber, password);
      // Wait a bit for the user profile to load
      setTimeout(() => {
        const storedUser = localStorage.getItem("raillo-user-role");
        const userRole = storedUser || role;
        
        // Check if user is admin - redirect to admin dashboard instead
        if (role === "admin" || userRole === "admin") {
          setError("Please use Admin Login for admin accounts");
          return;
        }
        
        // Also check if role is not set (new user)
        if (role !== "student" && userRole !== "student") {
          setError("Please sign up as a student first");
          return;
        }
        
        navigate("/student/dashboard", { replace: true });
      }, 500);
    } catch (err: any) {
      if (err?.code === "auth/user-not-found" || err?.code === "auth/invalid-credential") {
        setError("Invalid roll number or password");
      } else if (err?.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-12">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => navigate("/role-select")}
        className="mb-8 flex items-center gap-2 text-muted-foreground self-start"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">Back</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2 mb-8"
      >
        <img src={isDark ? logoDark : logoLight} alt="Raillo" className="h-14 w-14 mb-2" />
        <h1 className="text-2xl font-bold text-foreground">Student Login</h1>
        <p className="text-sm text-muted-foreground">Enter your roll number & password</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleLogin}
        className="mx-auto w-full max-w-sm flex flex-col gap-5"
      >
        <div className="space-y-2">
          <Label htmlFor="rollNumber">Roll Number</Label>
          <Input
            id="rollNumber"
            placeholder="e.g. 22CSE001"
            value={rollNumber}
            onChange={(e) => { setRollNumber(e.target.value); setError(""); }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
          >
            {error}
          </motion.p>
        )}

        <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-glow" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Logging in...</> : "Login"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/student/signup" className="text-primary font-medium hover:underline">
            Sign Up
          </Link>
        </p>
      </motion.form>
    </div>
  );
};

export default StudentLogin;
