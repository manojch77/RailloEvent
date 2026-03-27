import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { InputOTP } from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Eye, EyeOff, Loader2, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";
import { sendEmailOTP, verifyEmailOTP, initRecaptcha } from "@/lib/otpService";
import { RecaptchaVerifier } from "firebase/auth";

const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML", "CSM", "CSD"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const StudentSignup = () => {
  const navigate = useNavigate();
  const { isDark, signup } = useAuth();
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [dept, setDept] = useState("");
  const [year, setYear] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Email OTP states
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSentEmail, setOtpSentEmail] = useState(false);
  const [error, setError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    recaptchaRef.current = initRecaptcha();
  }, []);

  const handleStage1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rollNumber || !dept || !year || !mobile || !password || !confirmPassword) {
      setError("Please fill in all fields");
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
    setError("");
    setStep(2);
  };

  const handleSendEmailOTP = async () => {
    if (!email || !email.includes("@")) {
      setError("Enter valid email");
      return;
    }
    setSendingOtp(true);
    setError("");
    try {
      await sendEmailOTP(email);
      setOtpSentEmail(true);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      setError("Enter valid 6-digit OTP");
      return;
    }
    setVerifyingOtp(true);
    setError("");
    try {
      await verifyEmailOTP(email, emailOtp);
      setEmailVerified(true);
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleComplete = async () => {
    if (!emailVerified) {
      setError("Please verify your email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signup({
        name, rollNumber, dept, year, mobile, email, role: "student",
      }, password);
      navigate("/student/dashboard", { replace: true });
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
      {/* Hidden reCAPTCHA container - fixed position to prevent layout issues */}
      <div id="recaptcha-container" className="fixed -top-[9999px] left-0" />

      <motion.button 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={() => step === 1 ? navigate("/role-select") : setStep(1)} 
        className="mb-6 flex items-center gap-2 text-muted-foreground self-start"
      >
        <ArrowLeft className="h-4 w-4" /><span className="text-sm">{step === 1 ? "Back" : "Previous step"}</span>
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 mb-6">
        <img src={isDark ? logoDark : logoLight} alt="Raillo" className="h-10 w-10 mb-1" />
        <h1 className="text-2xl font-bold text-foreground">Student Sign Up</h1>
        <div className="flex gap-2 mt-2">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1.5 w-12 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </motion.div>

      <div className="mx-auto w-full max-w-sm">
        {step === 1 && (
          <motion.form 
            key="step1" 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            onSubmit={handleStage1} 
            className="flex flex-col gap-4"
          >
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            
            <div className="space-y-1.5">
              <Label>Roll Number</Label>
              <Input placeholder="e.g. 22CSE001" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
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
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label>Mobile Number</Label>
              <Input 
                placeholder="Enter mobile number" 
                value={mobile} 
                onChange={(e) => setMobile(e.target.value)} 
              />
            </div>
            
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input 
                placeholder="Enter email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
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
            
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-primary text-primary-foreground shadow-glow mt-2"
            >
              Continue
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/student/login" className="text-primary font-medium hover:underline">Login</Link>
            </p>
          </motion.form>
        )}

        {step === 2 && (
          <motion.div 
            key="step2" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="flex flex-col gap-5"
          >
            <div className="glass rounded-xl p-4 space-y-3">
              <Label>Email Verification</Label>
              <p className="text-sm text-muted-foreground">
                Enter your email and verify with OTP to complete signup
              </p>
              
              {!emailVerified ? (
                <>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      disabled={otpSentEmail}
                      className="flex-1" 
                    />
                    {!emailVerified && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSendEmailOTP} 
                        disabled={sendingOtp}
                      >
                        {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : otpSentEmail ? "Resend (30s)" : <Send className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  
                  {otpSentEmail && !emailVerified && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">OTP sent to {email} - check your inbox/spam</p>
                      <div className="flex gap-2">
                        <InputOTP 
                          maxLength={6}
                          value={emailOtp}
                          onChange={(value) => setEmailOtp(value)}
                          containerClassName="flex-1"
                          className="h-10"
                        />
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={handleVerifyEmailOTP} 
                          disabled={verifyingOtp || emailOtp.length !== 6}
                        >
                          {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">Email verified</p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <Button 
              onClick={handleComplete} 
              className="w-full bg-gradient-primary text-primary-foreground shadow-glow" 
              disabled={!emailVerified || loading}
            >
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</> : "Complete Sign Up"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentSignup;

