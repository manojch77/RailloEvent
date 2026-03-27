import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Plus, Trash2, Upload, Check, AlertCircle, Phone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { ref, push, get } from "firebase/database";
import { notifyAdminOfRegistration } from "@/lib/notificationService";

interface RegistrationModalProps {
  eventId: string;
  eventTitle: string;
  type: "single" | "team";
  isPaid: boolean;
  amount?: number;
  paymentQr?: string;
  dept?: string;
  allowedDepts?: string[];
  upiId?: string;
  mobileNumber?: string;
  onClose: () => void;
}

interface TeamMember {
  name: string;
  rollNumber: string;
  dept: string;
  year: string;
}

const RegistrationModal = ({ eventId, eventTitle, type, isPaid, amount, paymentQr, dept, allowedDepts, upiId, mobileNumber, onClose }: RegistrationModalProps) => {
  const { user, role } = useAuth();
  const [step, setStep] = useState<"check" | "form" | "payment" | "done">("check");
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [utrNumber, setUtrNumber] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [screenshot, setScreenshot] = useState<string>("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Check if already registered
  useEffect(() => {
    if (!user?.uid) {
      setCheckingRegistration(false);
      return;
    }

    const checkRegistration = async () => {
      try {
        const registrationsRef = ref(db, "registrations");
        const snapshot = await get(registrationsRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const registrations = Object.values(data);
          
          // Check if this user already registered for this event
          const alreadyRegistered = registrations.some(
            (r: any) => r.eventId === eventId && r.studentUid === user.uid
          );
          
          if (alreadyRegistered) {
            setIsAlreadyRegistered(true);
          }
        }
      } catch (err) {
        console.error("Error checking registration:", err);
      } finally {
        setCheckingRegistration(false);
      }
    };

    checkRegistration();
  }, [eventId, user?.uid]);

  const addMember = () => setTeamMembers([...teamMembers, { name: "", rollNumber: "", dept: "", year: "" }]);
  const removeMember = (i: number) => setTeamMembers(teamMembers.filter((_, idx) => idx !== i));
  const updateMember = (i: number, field: keyof TeamMember, value: string) => {
    const updated = [...teamMembers];
    updated[i] = { ...updated[i], [field]: value };
    setTeamMembers(updated);
  };

  const totalAmount = amount ? (type === "team" ? amount * (1 + teamMembers.length) : amount) : 0;

  const handleProceed = async () => {
    setError("");
    if (type === "team" && teamMembers.length === 0) {
      setError("Please add at least one team member");
      return;
    }

    // Check if any team member is already registered for this event
    if (type === "team" && teamMembers.length > 0) {
      try {
        const registrationsRef = ref(db, "registrations");
        const snapshot = await get(registrationsRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const registrations = Object.values(data);
          
          // Check each team member's roll number
          for (const member of teamMembers) {
            if (!member.rollNumber) continue;
            
            const alreadyRegistered = registrations.some(
              (r: any) => r.eventId === eventId && r.rollNumber === member.rollNumber
            );
            
            if (alreadyRegistered) {
              setError(`Student ${member.rollNumber} is already registered for this event`);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Error checking team member registrations:", err);
      }
    }

    if (isPaid) setStep("payment");
    else handleConfirm();
  };

  const handleConfirm = async () => {
    if (!user?.uid) {
      setError("Please login to register");
      return;
    }

    try {
      await push(ref(db, "registrations"), {
        eventId,
        eventTitle,
        type,
        studentUid: user.uid,
        studentName: user.name,
        rollNumber: user.rollNumber,
        dept: user.dept,
        year: user.year,
        mobile: user.mobile,
        teamMembers: type === "team" ? teamMembers : [],
        isPaid,
        amount: totalAmount,
        utrNumber: isPaid ? utrNumber : "",
        registeredAt: Date.now(),
      });
      
      // Send notification to admin about new registration
      await notifyAdminOfRegistration(
        eventId,
        eventTitle,
        user.name || "Student",
        user.uid,
        user.rollNumber || ""
      );
      
      setStep("done");
    } catch (err) {
      console.error("Registration failed:", err);
      setError("Registration failed. Please try again.");
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setScreenshot(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // If not logged in
  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-card rounded-t-2xl sm:rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">Login Required</h2>
            <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Please login to register for this event.</p>
          </div>
          <Button onClick={onClose} className="w-full">Close</Button>
        </motion.div>
      </motion.div>
    );
  }

  // If checking registration status
  if (checkingRegistration) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-card rounded-t-2xl sm:rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">Checking Registration...</h2>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Check if student's department is allowed for this event
  const studentDept = user?.dept;
  const isDeptAllowed = !dept || dept === "All" || dept === "" || (allowedDepts && allowedDepts.length > 0 && allowedDepts.includes(studentDept || "")) || dept === studentDept;
  
  // If department not allowed, show error
  if (user && !isDeptAllowed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-card rounded-t-2xl sm:rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
            <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
          </div>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Department Not Allowed</h3>
            <p className="text-sm text-muted-foreground">
              This event is only open for {allowedDepts?.join(", ") || dept} department{allowedDepts && allowedDepts.length > 1 ? "s" : ""}. Your department ({studentDept}) is not eligible to register for this event.
            </p>
            <Button onClick={onClose} variant="outline" className="mt-4">Close</Button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // If already registered
  if (isAlreadyRegistered) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-card rounded-t-2xl sm:rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">Already Registered</h2>
            <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
          </div>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-warning/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-warning" />
            </div>
            <h3 className="text-lg font-bold text-foreground">You're Already Registered!</h3>
            <p className="text-sm text-muted-foreground">You have already registered for "{eventTitle}". Check your event history for details.</p>
            <Button onClick={onClose} variant="outline" className="mt-4">Close</Button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // Show registration form
  if (step === "check") {
    setStep("form");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-card rounded-t-2xl sm:rounded-2xl border border-border p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">
            {step === "done" ? "Registration Complete!" : step === "payment" ? "Payment" : `Register: ${eventTitle}`}
          </h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        {step === "form" && (
          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}
            
            <div className="glass rounded-lg p-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {type === "team" ? "Team Lead" : "Your"} Details (Auto-filled)
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Name: </span><span className="text-foreground">{user?.name || "—"}</span></div>
                <div><span className="text-muted-foreground">Roll No: </span><span className="text-foreground">{user?.rollNumber || "—"}</span></div>
                <div><span className="text-muted-foreground">Dept: </span><span className="text-foreground">{user?.dept || "—"}</span></div>
                <div><span className="text-muted-foreground">Year: </span><span className="text-foreground">{user?.year || "—"}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Mobile: </span><span className="text-foreground">{user?.mobile || "—"}</span></div>
              </div>
            </div>

            {type === "team" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Team Members</Label>
                  <Button variant="outline" size="sm" onClick={addMember}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                </div>
                {teamMembers.map((member, i) => (
                  <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Member {i + 1}</p>
                      <button onClick={() => removeMember(i)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Name" value={member.name} onChange={(e) => updateMember(i, "name", e.target.value)} className="h-8 text-sm" />
                      <Input placeholder="Roll No" value={member.rollNumber} onChange={(e) => updateMember(i, "rollNumber", e.target.value)} className="h-8 text-sm" />
                      <Input placeholder="Dept" value={member.dept} onChange={(e) => updateMember(i, "dept", e.target.value)} className="h-8 text-sm" />
                      <Input placeholder="Year" value={member.year} onChange={(e) => updateMember(i, "year", e.target.value)} className="h-8 text-sm" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {isPaid && (
              <div className="glass rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-lg font-bold text-foreground">₹{totalAmount}</span>
              </div>
            )}

            <Button onClick={handleProceed} className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
              {isPaid ? "Proceed to Payment" : "Confirm Registration"}
            </Button>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-4">
            <div className="glass rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground mb-1">₹{totalAmount}</p>
              <p className="text-sm text-muted-foreground">Complete payment to register</p>
            </div>

            {/* Payment Instructions */}
            {(paymentQr || mobileNumber) && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Payment Options:</p>
                
                {/* QR Code */}
                {paymentQr && (
                  <div className="glass rounded-lg p-4 flex flex-col items-center">
                    <p className="text-xs text-muted-foreground mb-2">Scan QR Code</p>
                    <img src={paymentQr} alt="Payment QR Code" className="h-40 w-40 object-contain rounded-lg" />
                  </div>
                )}

                {/* UPI ID and Mobile Number */}
                {(upiId || mobileNumber) && (
                  <div className="glass rounded-lg p-4 space-y-3">
                    <p className="text-xs text-muted-foreground">Pay using UPI:</p>
                    
                    {mobileNumber && (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Mobile Number</p>
                          <p className="text-sm font-medium text-foreground">{mobileNumber}</p>
                        </div>
                      </div>
                    )}
                    
                    {upiId && (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">UPI ID</p>
                          <p className="text-sm font-medium text-foreground">{upiId}</p>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      Open any UPI app (Google Pay, PhonePe, Paytm, etc.) and pay to this number or UPI ID
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>UTR Number</Label>
              <Input placeholder="Enter UTR number after payment" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Payment Screenshot (Optional)</Label>
              <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleScreenshotUpload} />
              {screenshot ? (
                <div className="relative glass rounded-lg p-2">
                  <img src={screenshot} alt="Screenshot" className="w-full h-32 object-cover rounded" />
                  <Button variant="ghost" size="sm" className="absolute top-1 right-1" onClick={() => setScreenshot("")}>Change</Button>
                </div>
              ) : (
                <div onClick={() => fileRef.current?.click()} className="glass rounded-lg border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm text-muted-foreground">Tap to upload screenshot</p>
                </div>
              )}
            </div>

            <Button onClick={handleConfirm} className="w-full bg-gradient-primary text-primary-foreground shadow-glow" disabled={!utrNumber}>
              Confirm Payment
            </Button>
          </div>
        )}

        {step === "done" && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/20 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">You're Registered!</h3>
            <p className="text-sm text-muted-foreground">Confirmation details will be sent to your email/mobile.</p>
            <Button onClick={onClose} variant="outline" className="mt-4">Close</Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RegistrationModal;
