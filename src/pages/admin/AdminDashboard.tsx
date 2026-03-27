import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import AdCarousel from "@/components/AdCarousel";
import EventCard from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, ImageIcon, Loader2, Trash2, Users, Cloud, QrCode, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { db, storage } from "@/lib/firebase";
import { ref as dbRef, push, onValue, set, remove } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { notifyStudentsOfNewEvent, notifyRegisteredStudents } from "@/lib/notificationService";

const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML", "CSM", "CSD"];

// Payment type options
type PaymentType = "qr" | "upi" | "none";

interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  studentUid: string;
  studentName: string;
  rollNumber: string;
  dept: string;
  year: string;
  mobile: string;
  type: string;
  isPaid: boolean;
  amount: number;
  teamMembers: any[];
  registeredAt: number;
}

const AdminDashboard = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showStudents, setShowStudents] = useState(false);
  const [eventRegistrations, setEventRegistrations] = useState<Registration[]>([]);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
const [redirected, setRedirected] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [sendingNotify, setSendingNotify] = useState(false);

  // Handle redirects using useEffect to avoid blank pages
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      if (!redirected) {
        setRedirected(true);
        navigate("/admin/login", { replace: true });
      }
      return;
    }

    if (role !== "admin") {
      if (!redirected) {
        setRedirected(true);
        navigate("/student/dashboard", { replace: true });
      }
      return;
    }
  }, [user, role, authLoading, navigate, redirected]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  if (!user || role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Fetch events
  useEffect(() => {
    if (!user?.uid || role !== "admin") return;
    
    setIsLoading(true);
    const eventsRef = dbRef(db, "events");
    const unsub = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]: any) => ({ id, ...val }))
          .filter((e) => e.createdBy === user?.uid);
        setEvents(list);
      } else {
        setEvents([]);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setIsLoading(false);
    });
    return () => unsub();
  }, [user?.uid, role]);

  // Fetch all registrations
  useEffect(() => {
    const regsRef = dbRef(db, "registrations");
    const unsub = onValue(regsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        setRegistrations(list);
      } else {
        setRegistrations([]);
      }
    });
    return () => unsub();
  }, []);

// View students for an event
  const handleViewStudents = async (event: any) => {
    setSelectedEvent(event);
    const eventRegs = registrations.filter((r) => r.eventId === event.id);
    setEventRegistrations(eventRegs);
    setShowStudents(true);
  };

  // Handle sending notification to registered students
  const handleNotifyStudents = async () => {
    if (!notifyMessage.trim() || !selectedEvent || !user) return;
    
    setSendingNotify(true);
    try {
      const studentUids = eventRegistrations.map((r) => r.studentUid);
      await notifyRegisteredStudents(
        selectedEvent.id,
        selectedEvent.title,
        user.name || "Admin",
        notifyMessage.trim(),
        studentUids
      );
      toast.success(`Notification sent to ${studentUids.length} student(s)!`);
      setShowNotifyDialog(false);
      setNotifyMessage("");
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast.error("Failed to send notifications");
    } finally {
      setSendingNotify(false);
    }
  };

  // Toggle event open/close status
  const handleToggleEventStatus = async (event: any) => {
    try {
      await set(dbRef(db, `events/${event.id}`), {
        ...event,
        isOpen: !event.isOpen,
        updatedAt: Date.now(),
      });
      toast.success(`Event is now ${!event.isOpen ? "Open" : "Closed"}!`);
    } catch (err) {
      console.error("Error toggling event status:", err);
      toast.error("Failed to update event status");
    }
  };

  // Edit event
  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await remove(dbRef(db, `events/${eventId}`));
      toast.success("Event deleted successfully!");
    } catch (err) {
      console.error("Error deleting event:", err);
      toast.error("Failed to delete event");
    }
    setDeleteConfirm(null);
  };

  // Get registration count for an event
  const getRegistrationCount = (eventId: string) => {
    return registrations.filter((r) => r.eventId === eventId).length;
  };

  return (
    <AppLayout role="admin">
      <AdCarousel />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="font-semibold text-foreground mb-1">No events created</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-4">
            Create your first event using the Create tab below.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Your Events ({events.length})</h3>
          {events.map((event) => (
            <EventCard 
              key={event.id} 
              {...event} 
              registrationCount={getRegistrationCount(event.id)}
              onEdit={() => handleEditEvent(event)}
              onDelete={() => setDeleteConfirm(event.id)}
              onViewStudents={() => handleViewStudents(event)}
              onToggleStatus={() => handleToggleEventStatus(event)}
            />
          ))}
        </div>
      )}

{/* View Students Dialog */}
      <Dialog open={showStudents} onOpenChange={setShowStudents}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registered Students - {selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {eventRegistrations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No students registered yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {eventRegistrations.map((reg) => (
                <div key={reg.id} className="glass rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-foreground">{reg.studentName}</p>
                      <p className="text-sm text-muted-foreground">{reg.rollNumber} • {reg.dept} • {reg.year}</p>
                      <p className="text-xs text-muted-foreground">Mobile: {reg.mobile}</p>
                      {reg.type === "team" && reg.teamMembers?.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs font-medium text-muted-foreground">Team Members:</p>
                          {reg.teamMembers.map((m: any, i: number) => (
                            <p key={i} className="text-xs text-muted-foreground">{m.name} ({m.rollNumber})</p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{reg.isPaid ? `₹${reg.amount}` : "Free"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reg.registeredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {eventRegistrations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <Button 
                onClick={() => setShowNotifyDialog(true)} 
                className="w-full"
                variant="outline"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notify Registered Students ({eventRegistrations.length})
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notify Students Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notify Students - {selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send a notification to {eventRegistrations.length} registered student(s).
            </p>
            <div className="space-y-2">
              <Label>Message</Label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your message (e.g., Event starts tomorrow, Certificate uploaded, etc.)"
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNotifyDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleNotifyStudents} 
                disabled={!notifyMessage.trim() || sendingNotify}
              >
                {sendingNotify ? "Sending..." : "Send Notification"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this event? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDeleteEvent(deleteConfirm)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      {editingEvent && (
        <EditEventDialog 
          event={editingEvent} 
          onClose={() => setEditingEvent(null)} 
          onSave={() => setEditingEvent(null)}
        />
      )}
    </AppLayout>
  );
};

export default AdminDashboard;

// Edit Event Dialog Component
const EditEventDialog = ({ event, onClose, onSave }: { event: any; onClose: () => void; onSave: () => void }) => {
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [dept, setDept] = useState(event.dept);
  const [type, setType] = useState<"single" | "team">(event.type);
  const [isOpen, setIsOpen] = useState(event.isOpen);
  const [isPaid, setIsPaid] = useState(event.isPaid);
  const [amount, setAmount] = useState(String(event.amount || ""));
  const [allowedDepts, setAllowedDepts] = useState<string[]>(event.allowedDepts || DEPARTMENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleDept = (d: string) => {
    if (allowedDepts.includes(d)) setAllowedDepts(allowedDepts.filter((x) => x !== d));
    else setAllowedDepts([...allowedDepts, d]);
  };

  const handleSave = async () => {
    setError("");
    if (!title.trim() || !date || !time || !dept) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await set(dbRef(db, `events/${event.id}`), {
        ...event,
        title: title.trim(),
        date,
        time,
        dept,
        type,
        isOpen,
        isPaid,
        amount: isPaid ? Number(amount) : 0,
        allowedDepts,
        updatedAt: Date.now(),
      });
      toast.success("Event updated successfully!");
      onSave();
    } catch (err) {
      console.error("Error updating event:", err);
      setError("Failed to update event");
      toast.error("Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Event Title</Label>
            <Input 
              placeholder="Enter event title" 
              value={title} 
              onChange={(e) => { setTitle(e.target.value); setError(""); }} 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setError(""); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" value={time} onChange={(e) => { setTime(e.target.value); setError(""); }} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Organizing Department</Label>
            <Select value={dept} onValueChange={(v) => { setDept(v); setError(""); }}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Registration Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "single" | "team")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single (Individual)</SelectItem>
                <SelectItem value="team">Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Allowed Departments</Label>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map((d) => (
                <label key={d} className="flex items-center gap-1.5 glass rounded-lg px-3 py-1.5 cursor-pointer text-sm">
                  <Checkbox checked={allowedDepts.includes(d)} onCheckedChange={() => toggleDept(d)} />{d}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between glass rounded-lg p-3">
            <Label>Event Status</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{isOpen ? "Open" : "Closed"}</span>
              <Switch checked={isOpen} onCheckedChange={setIsOpen} />
            </div>
          </div>

          <div className="flex items-center justify-between glass rounded-lg p-3">
            <Label>Paid Event</Label>
            <Switch checked={isPaid} onCheckedChange={setIsPaid} />
          </div>

          {isPaid && (
            <div className="space-y-1.5">
              <Label>Amount per person (₹)</Label>
              <Input 
                type="number" 
                placeholder="Enter amount" 
                value={amount} 
                onChange={(e) => { setAmount(e.target.value); setError(""); }} 
              />
            </div>
          )}

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const CreateEvent = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [dept, setDept] = useState("");
  const [type, setType] = useState<"single" | "team">("single");
  const [isOpen, setIsOpen] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>("none");
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [allowedDepts, setAllowedDepts] = useState<string[]>(DEPARTMENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bgImage, setBgImage] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState("");
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState("");
  const bgRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    navigate("/admin/login");
    return null;
  }

  // Redirect if not admin
  if (role !== "admin") {
    navigate("/student/dashboard");
    return null;
  }

  const toggleDept = (d: string) => {
    if (allowedDepts.includes(d)) setAllowedDepts(allowedDepts.filter((x) => x !== d));
    else setAllowedDepts([...allowedDepts, d]);
  };

  const handleFileSelect = (file: File, type: "bg" | "qr") => {
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === "bg") { setBgImage(file); setBgPreview(e.target?.result as string); }
      else { setQrImage(file); setQrPreview(e.target?.result as string); }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!title.trim()) {
      setError("Please enter an event title");
      toast.error("Please enter an event title");
      return;
    }
    if (!date) {
      setError("Please select a date");
      toast.error("Please select a date");
      return;
    }
    if (!time) {
      setError("Please select a time");
      toast.error("Please select a time");
      return;
    }
    if (!dept) {
      setError("Please select a department");
      toast.error("Please select a department");
      return;
    }
    if (isPaid && !amount) {
      setError("Please enter the amount for paid events");
      toast.error("Please enter the amount for paid events");
      return;
    }

    if (!user?.uid) {
      setError("You must be logged in to create an event");
      toast.error("You must be logged in to create an event");
      return;
    }

    setLoading(true);

    try {
      let backgroundImage = "";
      let paymentQr = "";

// Upload background image if exists
      if (bgImage) {
        try {
          const cleanFileName = bgImage.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const result = await uploadToCloudinary(bgImage, "raillo/events");
          backgroundImage = result.secureUrl;
        } catch (uploadError: any) {
          console.error("Error uploading background image:", uploadError);
          let errorMsg = "Failed to upload background image";
          if (uploadError.code) errorMsg += `: ${uploadError.code}`;
          toast.error(errorMsg);
          setLoading(false);
          return;
        }
      }

      // Upload QR code if exists and is paid event
      if (qrImage && isPaid) {
        try {
          const cleanFileName = qrImage.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const result = await uploadToCloudinary(qrImage, "raillo/payment");
          paymentQr = result.secureUrl;
        } catch (uploadError: any) {
          console.error("Error uploading QR code:", uploadError);
          let errorMsg = "Failed to upload payment QR code";
          if (uploadError.code) errorMsg += `: ${uploadError.code}`;
          toast.error(errorMsg);
          setLoading(false);
          return;
        }
      }

      // Create event in database
      const newEventRef = push(dbRef(db, "events"));
      const eventId = newEventRef.key;
      
      await set(newEventRef, {
        title: title.trim(),
        date,
        time,
        dept,
        type,
        isOpen,
        isPaid,
        amount: isPaid ? Number(amount) : 0,
        allowedDepts,
        backgroundImage,
        paymentQr,
        upiId: isPaid && paymentType === "upi" ? upiId : "",
        mobileNumber: isPaid && paymentType === "upi" ? mobileNumber : "",
        createdBy: user.uid,
        createdAt: Date.now(),
      });

      // Notify all students about the new event
      await notifyStudentsOfNewEvent(
        eventId || "",
        title.trim(),
        user.name || "Admin",
        dept
      );

      toast.success("Event created successfully!");
      navigate("/admin/dashboard");
    } catch (err: any) {
      console.error("Failed to create event:", err);
      const errorMessage = err?.message || "Failed to create event. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout role="admin">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground mb-4">Create Event</h2>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-destructive/10 border border-destructive text-destructive rounded-lg px-4 py-3 mb-4"
          >
            {error}
          </motion.div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Event Title</Label>
            <Input 
              placeholder="Enter event title" 
              value={title} 
              onChange={(e) => { setTitle(e.target.value); setError(""); }} 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setError(""); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" value={time} onChange={(e) => { setTime(e.target.value); setError(""); }} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Organizing Department</Label>
            <Select value={dept} onValueChange={(v) => { setDept(v); setError(""); }}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Registration Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "single" | "team")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single (Individual)</SelectItem>
                <SelectItem value="team">Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Allowed Departments</Label>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map((d) => (
                <label key={d} className="flex items-center gap-1.5 glass rounded-lg px-3 py-1.5 cursor-pointer text-sm">
                  <Checkbox checked={allowedDepts.includes(d)} onCheckedChange={() => toggleDept(d)} />{d}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between glass rounded-lg p-3">
            <Label>Event Status</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{isOpen ? "Open" : "Closed"}</span>
              <Switch checked={isOpen} onCheckedChange={setIsOpen} />
            </div>
          </div>

          <div className="flex items-center justify-between glass rounded-lg p-3">
            <Label>Paid Event</Label>
            <Switch checked={isPaid} onCheckedChange={setIsPaid} />
          </div>

          {isPaid && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Amount per person (₹)</Label>
                <Input 
                  type="number" 
                  placeholder="Enter amount" 
                  value={amount} 
                  onChange={(e) => { setAmount(e.target.value); setError(""); }} 
                />
              </div>
              
              {/* Payment Type Selection */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="flex gap-3">
                  <label 
                    className={`flex-1 flex items-center justify-center gap-2 glass rounded-lg p-3 cursor-pointer transition-all ${
                      paymentType === "qr" ? "border-primary border-2" : ""
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="paymentType" 
                      value="qr" 
                      checked={paymentType === "qr"}
                      onChange={() => setPaymentType("qr")}
                      className="hidden"
                    />
                    <QrCode className="h-5 w-5" />
                    <span className="text-sm font-medium">QR Code</span>
                  </label>
                  <label 
                    className={`flex-1 flex items-center justify-center gap-2 glass rounded-lg p-3 cursor-pointer transition-all ${
                      paymentType === "upi" ? "border-primary border-2" : ""
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="paymentType" 
                      value="upi" 
                      checked={paymentType === "upi"}
                      onChange={() => setPaymentType("upi")}
                      className="hidden"
                    />
                    <Cloud className="h-5 w-5" />
                    <span className="text-sm font-medium">UPI / Mobile</span>
                  </label>
                </div>
              </div>

              {/* QR Code Upload */}
              {paymentType === "qr" && (
                <div className="space-y-1.5">
                  <Label>Payment QR Code</Label>
                  <input 
                    type="file" 
                    ref={qrRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], "qr"); }} 
                  />
                  {qrPreview ? (
                    <div className="relative glass rounded-lg p-3">
                      <img src={qrPreview} alt="QR" className="mx-auto h-40 w-40 object-contain rounded" />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute top-2 right-2" 
                        onClick={() => { setQrImage(null); setQrPreview(""); }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => qrRef.current?.click()} 
                      className="glass rounded-lg border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    >
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Upload Razorpay/UPI QR code</p>
                    </div>
                  )}
                </div>
              )}

              {/* UPI ID and Mobile Number */}
              {paymentType === "upi" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>UPI ID (Optional)</Label>
                    <Input 
                      placeholder="e.g., mobilenumber@upi" 
                      value={upiId} 
                      onChange={(e) => { setUpiId(e.target.value); setError(""); }} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mobile Number for Payment</Label>
                    <Input 
                      placeholder="Enter mobile number" 
                      value={mobileNumber} 
                      onChange={(e) => { setMobileNumber(e.target.value); setError(""); }}
                      maxLength={10}
                    />
                    <p className="text-xs text-muted-foreground">Students can pay using this number via any UPI app</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          <div className="space-y-1.5">
            <Label>Event Background Image</Label>
            <input 
              type="file" 
              ref={bgRef} 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], "bg"); }} 
            />
            {bgPreview ? (
              <div className="relative rounded-lg overflow-hidden">
                <img src={bgPreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 glass" 
                  onClick={() => { setBgImage(null); setBgPreview(""); }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div 
                onClick={() => bgRef.current?.click()} 
                className="glass rounded-lg border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Tap to upload event image</p>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary text-primary-foreground shadow-glow" 
            disabled={loading}
          >
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Create Event"}
          </Button>
        </form>
      </motion.div>
    </AppLayout>
  );
};
