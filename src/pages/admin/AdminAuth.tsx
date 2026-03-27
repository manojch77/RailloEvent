import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";

const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML", "CSM", "CSD"];
const ADMIN_SECRET_CODE = "raillocrreadmin";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, isDark, user, role, loading: authLoading } = useAuth();
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!authLoading && user && role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    try {
      await login(rollNumber, password);
      // Wait a bit for the user profile to load
      setTimeout(() => {
        // Check if user is student - redirect to student dashboard instead
        if (role === "student") {
          setError("Please use Student Login for student accounts");
          return;
        }
        
        // Also check if role is not set (new user)
        if (role !== "admin") {
          setError("Please sign up as an admin first");
          return;
        }
        
        navigate("/admin/dashboard", { replace: true });
      }, 500);
    } catch (err: any) {
      if (err?.code === "auth/user-not-found" || err?.code === "auth/invalid-credential") {
        setError("Invalid roll number or password");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-12">
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate("/role-select")} className="mb-8 flex items-center gap-2 text-muted-foreground self-start">
        <ArrowLeft className="h-4 w-4" /><span className="text-sm">Back</span>
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 mb-8">
        <img src={isDark ? logoDark : logoLight} alt="Raillo" className="h-14 w-14 mb-2" />
        <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
        <p className="text-sm text-muted-foreground">Enter your roll number & password</p>
      </motion.div>

      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleLogin} className="mx-auto w-full max-w-sm flex flex-col gap-5">
        <div className="space-y-2">
          <Label>Roll Number</Label>
          <Input placeholder="Enter your roll number" value={rollNumber} onChange={(e) => { setRollNumber(e.target.value); setError(""); }} />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <div className="relative">
            <Input type={showPw ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
        </div>
        {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</motion.p>}
        <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-glow" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Logging in...</> : "Login"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">Don't have an account? <Link to="/admin/signup" className="text-primary font-medium hover:underline">Sign Up</Link></p>
      </motion.form>
    </div>
  );
};

export default AdminLogin;

export const AdminSignup = () => {
  const navigate = useNavigate();
  const { isDark, signup } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [dept, setDept] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminSecretKey, setAdminSecretKey] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!name || !rollNumber || !dept || !mobile || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    // Validate admin secret key
    if (!adminSecretKey) {
      setError("Admin Secret Key is required");
      return;
    }
    
    if (adminSecretKey !== ADMIN_SECRET_CODE) {
      setError("Invalid Admin Secret Key");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await signup({
        name, rollNumber, dept, year: "", mobile, email, role: "admin",
      }, password);
      navigate("/admin/dashboard", { replace: true });
    } catch (err: any) {
      if (err?.code === "auth/email-already-in-use") {
        setError("This roll number is already registered");
      } else {
        setError("Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-12 pb-8">
      <motion.button 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={() => navigate("/role-select")} 
        className="mb-6 flex items-center gap-2 text-muted-foreground self-start"
      >
        <ArrowLeft className="h-4 w-4" /><span className="text-sm">Back</span>
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 mb-6">
        <img src={isDark ? logoDark : logoLight} alt="Raillo" className="h-10 w-10 mb-1" />
        <h1 className="text-2xl font-bold text-foreground">Admin Sign Up</h1>
        <p className="text-sm text-muted-foreground">Create admin account with secret key</p>
      </motion.div>

      <div className="mx-auto w-full max-w-sm">
        <motion.form 
          key="signup" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          onSubmit={handleSignup} 
          className="flex flex-col gap-4"
        >
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          
          <div className="space-y-1.5">
            <Label>Roll Number</Label>
            <Input placeholder="Enter roll number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
          </div>
          
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label>Mobile Number</Label>
            <Input placeholder="Enter mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>
          
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          
          <div className="space-y-1.5">
            <Label>Password</Label>
            <div className="relative">
              <Input 
                type={showPw ? "text" : "password"} 
                placeholder="Min 6 characters" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
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
          
          <div className="space-y-1.5">
            <Label>Confirm Password</Label>
            <Input 
              type="password" 
              placeholder="Re-enter password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
          </div>
          
          <div className="space-y-1.5">
            <Label>Admin Secret Key</Label>
            <Input 
              type="password" 
              placeholder="Enter admin secret key" 
              value={adminSecretKey} 
              onChange={(e) => setAdminSecretKey(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground">Required for admin registration</p>
          </div>
          
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-primary text-primary-foreground shadow-glow mt-2"
            disabled={loading}
          >
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</> : "Sign Up"}
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/admin/login" className="text-primary font-medium hover:underline">Login</Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
};

