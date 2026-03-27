import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/lib/firebase";
import { ref as dbRef, onValue, push, get, set } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { uploadToCloudinary, getOptimizedUrl } from "@/lib/cloudinary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Upload, Download, Send, QrCode, Bell, BarChart3, TrendingUp, Users, Calendar, DollarSign, Eye, FileText, CheckCircle, XCircle, Loader2, FileUp, AlertCircle, Cloud, Database } from "lucide-react";
import { toast } from "sonner";

// ─── Student Certificates ──────
export const StudentCertificates = () => {
  const { user } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);
  const [previewCert, setPreviewCert] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const certsRef = dbRef(db, "certificates");
    const unsub = onValue(certsRef, (snap) => {
      const data = snap.val();
      if (data) {
        // Students can only see their own certificates
        const list = Object.values(data).filter(
          (c: any) => c.rollNumber === user?.rollNumber
        );
        setCerts(list as any[]);
      } else {
        setCerts([]);
      }
    });
    return () => unsub();
  }, [user?.rollNumber]);

  const handlePreview = (cert: any) => {
    setPreviewCert(cert);
    setPreviewOpen(true);
  };

  const handleDownload = async (cert: any) => {
    if (!cert.url) return;
    setDownloading(cert.url);
    try {
      const response = await fetch(cert.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Extract extension from URL or default to .pdf
      const extension = cert.url.split('.').pop()?.split('?')[0] || 'pdf';
      const fileName = `${cert.eventTitle || 'certificate'}.${extension}`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download certificate");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AppLayout role="student">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground mb-4">🏆 My Certificates</h2>
        {certs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Download className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No certificates yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Certificates for events you participated in will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certs.map((cert: any, i) => (
              <div key={i} className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{cert.eventTitle}</p>
                  <p className="text-xs text-muted-foreground">{cert.uploadedAt ? new Date(cert.uploadedAt).toLocaleDateString() : ""}</p>
                </div>
                <div className="flex gap-2">
                  {cert.url && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handlePreview(cert)}>
                        <Eye className="h-4 w-4 mr-1" /> Preview
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(cert)} disabled={downloading === cert.url}>
                        <Download className="h-4 w-4 mr-1" /> {downloading === cert.url ? "Downloading..." : "Download"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{previewCert?.eventTitle}</DialogTitle>
              <DialogDescription>
                Certificate uploaded on {previewCert?.uploadedAt ? new Date(previewCert.uploadedAt).toLocaleDateString() : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4 bg-muted/30 rounded-lg">
              {previewCert?.url ? (
                previewCert.url.endsWith('.pdf') ? (
                  <iframe src={previewCert.url} className="w-full h-[60vh] rounded-lg border" title="Certificate Preview" />
                ) : (
                  <img src={previewCert.url} alt="Certificate" className="max-w-full max-h-[60vh] rounded-lg" />
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mb-2" />
                  <p>Certificate file not available</p>
                </div>
              )}
            </div>
            <DialogFooter>
              {previewCert?.url && (
                <Button onClick={() => handleDownload(previewCert)} disabled={downloading === previewCert.url}>
                  <Download className="h-4 w-4 mr-2" /> {downloading === previewCert.url ? "Downloading..." : "Download Certificate"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AppLayout>
  );
};

// ─── Student Scanner ──────
export const StudentScanner = () => (
  <AppLayout role="student">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4">
        <QrCode className="h-10 w-10 text-primary-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">QR Scanner</h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">Scan the QR code provided at the event venue to mark your attendance.</p>
      <div className="glass rounded-2xl p-8 w-64 h-64 flex items-center justify-center border-2 border-dashed border-primary/30">
        <p className="text-muted-foreground text-sm">Camera will open here</p>
      </div>
      <p className="text-xs text-muted-foreground mt-4">Point your camera at the event QR code</p>
    </motion.div>
  </AppLayout>
);

// ─── Student Notifications ──────
export const StudentNotifications = () => {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    const nRef = dbRef(db, "notifications");
    const unsub = onValue(nRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.values(data).filter(
          (n: any) => !n.targetEvent || n.targetStudents?.includes(user?.rollNumber)
        );
        setNotifs(list as any[]);
      }
    });
    return () => unsub();
  }, [user?.rollNumber]);

  return (
    <AppLayout role="student">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground mb-4">🔔 Notifications</h2>
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No notifications</h3>
            <p className="text-sm text-muted-foreground max-w-xs">You'll receive notifications from event admins here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map((n: any, i) => (
              <div key={i} className="glass rounded-xl p-4">
                <p className="font-medium text-foreground text-sm">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">{n.sentAt ? new Date(n.sentAt).toLocaleString() : ""}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

// ─── Student History ──────
export const StudentHistory = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);

  useEffect(() => {
    const rRef = dbRef(db, "registrations");
    const unsub = onValue(rRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.values(data).filter((r: any) => r.studentUid === user?.uid);
        setRegistrations(list as any[]);
      }
    });
    return () => unsub();
  }, [user?.uid]);

  return (
    <AppLayout role="student">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground mb-4">📜 Event History</h2>
        {registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4"><span className="text-2xl">📜</span></div>
            <h3 className="font-semibold text-foreground mb-1">No history yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Your past event registrations will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {registrations.map((r: any, i) => (
              <div key={i} className="glass rounded-xl p-4">
                <p className="font-medium text-foreground text-sm">{r.eventTitle}</p>
                <p className="text-xs text-muted-foreground">Type: {r.type} • {r.isPaid ? `₹${r.amount}` : "Free"}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{r.registeredAt ? new Date(r.registeredAt).toLocaleString() : ""}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

// ─── Student Profile ──────
export const StudentProfile = () => {
  const { user, role } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editMobile, setEditMobile] = useState(user?.mobile || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const appRole = role === "admin" ? "admin" : "student";

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const updates: any = {
        name: editName,
        mobile: editMobile,
        email: editEmail,
      };
      await set(dbRef(db, `users/${user.uid}`), updates);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout role={appRole}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">👤 {role === "admin" ? "Admin" : "My"} Profile</h2>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
        
        <div className="flex flex-col items-center mb-6">
          <div className="h-20 w-20 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mb-3 shadow-glow">
            {user?.name ? user.name[0].toUpperCase() : "U"}
          </div>
          <h3 className="font-bold text-foreground text-lg">{user?.name || "—"}</h3>
          <p className="text-sm text-muted-foreground">{role === "admin" ? "Administrator" : "Student"}</p>
        </div>
        
        <div className="glass rounded-xl p-4 space-y-3">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Name</Label>
                <Input 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Mobile</Label>
                <Input 
                  value={editMobile} 
                  onChange={(e) => setEditMobile(e.target.value)}
                  placeholder="Mobile number"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Email</Label>
                <Input 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Email address"
                  type="email"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleSave} 
                  className="flex-1 bg-gradient-primary text-primary-foreground"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(user?.name || "");
                    setEditMobile(user?.mobile || "");
                    setEditEmail(user?.email || "");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium text-foreground">{user?.name || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Roll Number</span>
                <span className="text-sm font-medium text-foreground">{user?.rollNumber || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Department</span>
                <span className="text-sm font-medium text-foreground">{user?.dept || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Year</span>
                <span className="text-sm font-medium text-foreground">{user?.year || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Mobile</span>
                <span className="text-sm font-medium text-foreground">{user?.mobile || "—"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium text-foreground">{user?.email || "—"}</span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AppLayout>
  );
};

// ─── Admin Certificates Upload (Enhanced with Cloudinary + Bulk Upload) ──────
export const AdminCertificates = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ uploaded: number; failed: number; total: number } | null>(null);
  
  // Cloudinary toggle
  const [useCloudinary, setUseCloudinary] = useState(false);
  
  // Bulk upload states
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<FileList | null>(null);
  const [bulkRollNumbers, setBulkRollNumbers] = useState<string[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);
  const bulkRollRef = useRef<HTMLInputElement>(null);

  // Handle file selection with preview
  const handleFileSelect = (file: File | null) => {
    setCertFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCertPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCertPreview(null);
    }
  };

  useEffect(() => {
    const eRef = dbRef(db, "events");
    const unsub = onValue(eRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]: any) => ({ id, ...val }))
          .filter((e) => e.createdBy === user?.uid);
        setEvents(list);
      }
    });
    return () => unsub();
  }, [user?.uid]);

  // Handle bulk roll numbers file (txt/csv with one roll number per line)
  const handleBulkRollNumbers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const rollNumbers = text.split(/[\n,]/).map(r => r.trim()).filter(r => r.length > 0);
      setBulkRollNumbers(rollNumbers);
      toast.success(`${rollNumbers.length} roll numbers loaded`);
    } catch (err) {
      console.error("Error reading roll numbers file:", err);
      toast.error("Failed to read roll numbers file");
    }
  };

// Single certificate upload
  const handleUpload = async () => {
    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }
    if (!rollNumber) {
      toast.error("Please enter a roll number");
      return;
    }
    if (!certFile) {
      toast.error("Please select a certificate file");
      return;
    }

    setLoading(true);

    try {
      // Validate file
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(certFile.type)) {
        toast.error("Invalid file type. Please upload PDF, PNG, or JPG only.");
        setLoading(false);
        return;
      }

      // Max file size 10MB
      if (certFile.size > 10 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 10MB.");
        setLoading(false);
        return;
      }

      // Upload file based on selected storage option
      let url = "";
      
      if (useCloudinary) {
        // Upload to Cloudinary
        console.log("Starting upload to Cloudinary...");
        toast.info("Uploading to Cloudinary...");
        
        try {
          const result = await uploadToCloudinary(certFile, "raillo/certificates");
          url = result.secureUrl;
          console.log("Cloudinary upload successful:", url.substring(0, 50) + "...");
        } catch (cloudinaryError: any) {
          console.error("Cloudinary upload error:", cloudinaryError);
          toast.error(`Cloudinary upload failed: ${cloudinaryError.message}`);
          setLoading(false);
          return;
        }
      } else {
        // Upload to Firebase Storage
        const cleanFileName = certFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `cert_${selectedEvent}_${rollNumber}_${Date.now()}_${cleanFileName}`;
        
        console.log("Starting upload to Firebase:", `certificates/${fileName}`);
        toast.info("Uploading to Firebase...");
        
        const storageFileRef = storageRef(storage, `certificates/${fileName}`);
        const snapshot = await uploadBytes(storageFileRef, certFile);
        console.log("Upload successful, getting download URL...");
        
        url = await getDownloadURL(snapshot.ref);
        console.log("Download URL obtained:", url.substring(0, 50) + "...");
      }

      // Save to database
      await push(dbRef(db, "certificates"), {
        eventId: selectedEvent,
        eventTitle: events.find((e) => e.id === selectedEvent)?.title || "",
        rollNumber: rollNumber.toUpperCase().trim(),
        url,
        uploadedAt: Date.now(),
        uploadedBy: user?.uid,
      });

      toast.success("Certificate uploaded successfully!");
      setRollNumber("");
      setCertFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      console.error("Upload error details:", err);
      
      // Provide more specific error messages
      let errorMessage = "Failed to upload certificate. Please try again.";
      
      if (err.code) {
        switch (err.code) {
          case 'storage/unauthorized':
            errorMessage = "Storage access denied. Please check Firebase Storage rules.";
            break;
          case 'storage/canceled':
            errorMessage = "Upload was canceled.";
            break;
          case 'storage/unknown':
            errorMessage = "Unknown storage error. Please try again.";
            break;
          case 'storage/retry-limit-exceeded':
            errorMessage = "Network error. Please check your connection.";
            break;
          default:
            errorMessage = `Error: ${err.code}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

// Bulk certificate upload
  const handleBulkUpload = async () => {
    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }
    if (bulkRollNumbers.length === 0) {
      toast.error("Please upload a roll numbers file");
      return;
    }
    
    setBulkUploading(true);
    setUploadStats({ uploaded: 0, failed: 0, total: bulkRollNumbers.length });

    const eventTitle = events.find((e) => e.id === selectedEvent)?.title || "";
    let uploaded = 0;
    let failed = 0;

    try {
      // Get existing certificates to check for duplicates
      const existingSnap = await get(dbRef(db, "certificates"));
      const existingCerts = existingSnap.val() ? Object.values(existingSnap.val()) : [];
      
      toast.info(`Starting bulk upload for ${bulkRollNumbers.length} students...`);
      
      for (let i = 0; i < bulkRollNumbers.length; i++) {
        const roll = bulkRollNumbers[i];
        const file = bulkFiles?.[i];

        try {
          // Check if certificate already exists for this roll and event
          const existingForRoll = existingCerts.find((c: any) => 
            c.eventId === selectedEvent && c.rollNumber.toLowerCase() === roll.toLowerCase()
          );
          
          if (existingForRoll) {
            failed++;
            continue;
          }

          let url = "";
          if (file) {
            // Validate file
            const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
              failed++;
              continue;
            }
            
            const fileName = `${selectedEvent}_${roll}_${Date.now()}_${i}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const storageRefFile = storageRef(storage, `certificates/${fileName}`);
            await uploadBytes(storageRefFile, file);
            url = await getDownloadURL(storageRefFile);
          }

          await push(dbRef(db, "certificates"), {
            eventId: selectedEvent,
            eventTitle,
            rollNumber: roll.toUpperCase().trim(),
            url,
            uploadedAt: Date.now(),
            uploadedBy: user?.uid,
          });

          uploaded++;
        } catch (err) {
          console.error(`Failed to upload for ${roll}:`, err);
          failed++;
        }

        // Update stats
        setUploadStats({ uploaded, failed, total: bulkRollNumbers.length });
      }
      
      toast.success(`Bulk upload complete! ${uploaded} uploaded, ${failed} failed.`);
    } catch (err: any) {
      console.error("Bulk upload error:", err);
      toast.error(err?.message || "Bulk upload failed. Please try again.");
    } finally {
      setBulkUploading(false);
      setBulkFiles(null);
      setBulkRollNumbers([]);
      if (bulkFileRef.current) bulkFileRef.current.value = "";
      if (bulkRollRef.current) bulkRollRef.current.value = "";
    }
  };

  // Calculate upload percentage
  const uploadPercentage = uploadStats ? Math.round((uploadStats.uploaded / uploadStats.total) * 100) : 0;

  return (
    <AppLayout role="admin">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground mb-4">📤 Upload Certificates</h2>
        
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button 
            variant={!bulkMode ? "default" : "outline"} 
            onClick={() => setBulkMode(false)}
            className={!bulkMode ? "bg-primary" : ""}
          >
            <FileText className="h-4 w-4 mr-2" /> Single Upload
          </Button>
          <Button 
            variant={bulkMode ? "default" : "outline"} 
            onClick={() => setBulkMode(true)}
            className={bulkMode ? "bg-primary" : ""}
          >
            <FileUp className="h-4 w-4 mr-2" /> Bulk Upload
          </Button>
        </div>

        {/* Upload Stats */}
        {uploadStats && !bulkUploading && (
          <div className="glass rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Upload Complete</span>
              <span className="text-sm text-muted-foreground">{uploadPercentage}%</span>
            </div>
            <Progress value={uploadPercentage} className="mb-2" />
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle className="h-4 w-4" /> {uploadStats.uploaded} uploaded
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="h-4 w-4" /> {uploadStats.failed} failed
              </span>
            </div>
          </div>
        )}

        {bulkUploading && (
          <div className="glass rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">Uploading certificates...</span>
            </div>
            <Progress value={uploadPercentage} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {uploadStats?.uploaded || 0} of {uploadStats?.total || 0} uploaded ({uploadPercentage}%)
            </p>
          </div>
        )}

        {!bulkMode ? (
          // Single Upload Mode
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Select Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger><SelectValue placeholder="Choose event" /></SelectTrigger>
                <SelectContent>
                  {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Student Roll Number</Label>
              <Input placeholder="Enter roll number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
            </div>
            {/* Cloudinary Toggle */}
            <div className="flex items-center justify-between rounded-lg px-3 py-3 glass">
              <div className="flex items-center gap-3">
                <Cloud className="h-4 w-4 text-foreground" />
                <Label className="text-sm font-medium cursor-pointer">Use Cloudinary</Label>
              </div>
              <Switch checked={useCloudinary} onCheckedChange={setUseCloudinary} />
            </div>
            
            <div className="space-y-1.5">
              <Label>Certificate File</Label>
              <input type="file" ref={fileRef} accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setCertFile(file);
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setCertPreview(reader.result as string);
                  reader.readAsDataURL(file);
                } else {
                  setCertPreview(null);
                }
              }} />
              <div onClick={() => fileRef.current?.click()} className="glass rounded-lg border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-primary transition-colors">
                {certPreview ? (
                  <div className="space-y-2">
                    {certFile?.type.startsWith('image/') ? (
                      <img src={certPreview} alt="Preview" className="max-h-32 mx-auto rounded-lg object-contain" />
                    ) : (
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                    )}
                    <p className="text-sm text-primary font-medium">{certFile?.name}</p>
                    <p className="text-xs text-muted-foreground">Click to change</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Tap to upload certificate (PDF/PNG/JPG)</p>
                  </>
                )}
              </div>
            </div>
            <Button onClick={handleUpload} className="w-full bg-gradient-primary text-primary-foreground shadow-glow" disabled={!selectedEvent || !rollNumber || !certFile || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload to {useCloudinary ? "Cloudinary" : "Firebase"}
                </>
              )}
            </Button>
          </div>
        ) : (
          // Bulk Upload Mode
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Select Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger><SelectValue placeholder="Choose event" /></SelectTrigger>
                <SelectContent>
                  {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label>Roll Numbers File (TXT/CSV)</Label>
              <p className="text-xs text-muted-foreground mb-2">Upload a .txt or .csv file with one roll number per line or comma-separated</p>
              <input 
                type="file" 
                ref={bulkRollRef} 
                accept=".txt,.csv" 
                className="hidden" 
                onChange={handleBulkRollNumbers} 
              />
              <div onClick={() => bulkRollRef.current?.click()} className="glass rounded-lg border-2 border-dashed border-border p-4 text-center cursor-pointer hover:border-primary transition-colors">
                <FileText className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {bulkRollNumbers.length > 0 
                    ? `${bulkRollNumbers.length} roll numbers loaded` 
                    : "Tap to upload roll numbers file"}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Certificate Files (Optional - for multiple students)</Label>
              <p className="text-xs text-muted-foreground mb-2">Upload multiple certificate files. Files will be assigned in order to the roll numbers.</p>
              <input 
                type="file" 
                ref={bulkFileRef} 
                accept=".pdf,.png,.jpg,.jpeg" 
                multiple 
                className="hidden" 
                onChange={(e) => setBulkFiles(e.target.files)} 
              />
              <div onClick={() => bulkFileRef.current?.click()} className="glass rounded-lg border-2 border-dashed border-border p-4 text-center cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {bulkFiles && bulkFiles.length > 0 
                    ? `${bulkFiles.length} files selected` 
                    : "Tap to select certificate files (optional)"}
                </p>
              </div>
            </div>

            {bulkRollNumbers.length > 0 && (
              <div className="glass rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Summary:</p>
                <p className="text-sm text-muted-foreground">• {bulkRollNumbers.length} students to upload</p>
                <p className="text-sm text-muted-foreground">• {bulkFiles?.length || 0} certificate files attached</p>
              </div>
            )}

            <Button 
              onClick={handleBulkUpload} 
              className="w-full bg-gradient-primary text-primary-foreground shadow-glow" 
              disabled={!selectedEvent || bulkRollNumbers.length === 0 || bulkUploading}
            >
              {bulkUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : <><FileUp className="h-4 w-4 mr-2" /> Upload {bulkRollNumbers.length} Certificates</>}
            </Button>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

// ─── Admin Notifications ──────
export const AdminNotifications = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const eRef = dbRef(db, "events");
    const unsub = onValue(eRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]: any) => ({ id, ...val }))
          .filter((e) => e.createdBy === user?.uid);
        setEvents(list);
      }
    });
    return () => unsub();
  }, [user?.uid]);

  const handleSend = async () => {
    if (!selectedEvent || !title || !message) return;
    await push(dbRef(db, "notifications"), {
      targetEvent: selectedEvent,
      title,
      message,
      sentBy: user?.uid,
      sentAt: Date.now(),
    });
    setTitle(""); setMessage("");
  };

  return (
    <AppLayout role="admin">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground mb-4">📣 Send Notifications</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Select Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger><SelectValue placeholder="Choose event" /></SelectTrigger>
              <SelectContent>
                {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Title</Label><Input placeholder="Notification title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Message</Label><Input placeholder="Write your message" value={message} onChange={(e) => setMessage(e.target.value)} /></div>
          <Button onClick={handleSend} className="w-full bg-gradient-primary text-primary-foreground shadow-glow" disabled={!selectedEvent || !title || !message}>
            <Send className="h-4 w-4 mr-2" /> Send to Registered Students
          </Button>
        </div>
      </motion.div>
    </AppLayout>
  );
};

// ─── Admin Analytics (Enhanced with Charts) ──────
export const AdminAnalytics = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    const eRef = dbRef(db, "events");
    const rRef = dbRef(db, "registrations");
    const cRef = dbRef(db, "certificates");
    
    const unsub1 = onValue(eRef, (snap) => {
      const data = snap.val();
      if (data) {
        setEvents(Object.entries(data).map(([id, val]: any) => ({ id, ...val })).filter((e) => e.createdBy === user?.uid));
      }
    });
    const unsub2 = onValue(rRef, (snap) => {
      const data = snap.val();
      if (data) setRegistrations(Object.values(data) as any[]);
    });
    const unsub3 = onValue(cRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.values(data).filter((c: any) => 
          events.some((e: any) => e.id === c.eventId)
        );
        setCertificates(list as any[]);
      }
    });
    
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [user?.uid, events]);

  // Calculate statistics
  const myEvents = events.filter((e: any) => e.createdBy === user?.uid);
  const myRegistrations = registrations.filter((r: any) => 
    myEvents.some((e: any) => e.id === r.eventId)
  );
  
  const totalRegistrations = myRegistrations.length;
  const totalEvents = myEvents.length;
  const totalRevenue = myRegistrations
    .filter((r: any) => r.isPaid)
    .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);

  // Certificate upload stats
  const totalRegisteredStudents = new Set(myRegistrations.map((r: any) => r.rollNumber)).size;
  const certificatesUploaded = certificates.length;
  const certificatePercentage = totalRegisteredStudents > 0 
    ? Math.round((certificatesUploaded / totalRegisteredStudents) * 100) 
    : 0;

  // Department breakdown
  const deptBreakdown = myRegistrations.reduce((acc: Record<string, number>, r: any) => {
    acc[r.dept] = (acc[r.dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxDeptCount = Math.max(...Object.values(deptBreakdown) as number[], 1);

  // Event type breakdown
  const singleRegs = myRegistrations.filter((r: any) => r.type === "single").length;
  const teamRegs = myRegistrations.filter((r: any) => r.type === "team").length;

  return (
    <AppLayout role="admin">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground mb-4">📊 Event Analytics</h2>
        
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4"><BarChart3 className="h-6 w-6 text-muted-foreground" /></div>
            <h3 className="font-semibold text-foreground mb-1">No analytics yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Create events to see registration analytics.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="glass">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Total Events</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{totalEvents}</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Registrations</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{totalRegistrations}</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">Team Regs</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{teamRegs}</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">₹{totalRevenue}</p>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Download className="h-4 w-4" />
                    <span className="text-xs">Certificates</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{certificatePercentage}%</p>
                  <p className="text-xs text-muted-foreground">{certificatesUploaded}/{totalRegisteredStudents}</p>
                </CardContent>
              </Card>
            </div>

            {/* Certificate Progress */}
            <Card className="glass">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">Certificate Upload Progress</h3>
                  <span className="text-sm text-muted-foreground">{certificatePercentage}%</span>
                </div>
                <Progress value={certificatePercentage} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  {certificatesUploaded} of {totalRegisteredStudents} registered students have certificates uploaded
                </p>
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Department Bar Chart */}
              <Card className="glass">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-foreground mb-4">Registrations by Department</h3>
                  <div className="space-y-2">
                    {Object.entries(deptBreakdown)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([dept, count]) => (
                        <div key={dept} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{dept}</span>
                            <span className="text-muted-foreground">{count as number} students</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${((count as number) / maxDeptCount) * 100}%` }}
                              className="h-full bg-gradient-primary"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Event Type Pie Chart Representation */}
              <Card className="glass">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-foreground mb-4">Registration Type</h3>
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <div className="relative w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center">
                        <span className="text-xl font-bold text-foreground">{singleRegs}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Individual</p>
                    </div>
                    <div className="text-center">
                      <div className="relative w-24 h-24 rounded-full border-4 border-secondary flex items-center justify-center">
                        <span className="text-xl font-bold text-foreground">{teamRegs}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Team</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Individual Event Stats */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Event-wise Registrations</h3>
              {myEvents.map((event: any) => {
                const eventRegs = myRegistrations.filter((r: any) => r.eventId === event.id);
                const eventCerts = certificates.filter((c: any) => c.eventId === event.id);
                
                const deptCount: Record<string, number> = {};
                eventRegs.forEach((r: any) => {
                  deptCount[r.dept] = (deptCount[r.dept] || 0) + 1;
                });
                const maxCount = Math.max(...Object.values(deptCount) as number[], 1);
                
                const eventCertPercentage = eventRegs.length > 0 
                  ? Math.round((eventCerts.length / eventRegs.length) * 100) 
                  : 0;

                return (
                  <div key={event.id} className="glass rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{event.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={event.isOpen ? "default" : "secondary"} className={event.isOpen ? "bg-success" : ""}>
                          {event.isOpen ? "Open" : "Closed"}
                        </Badge>
                        <span className="text-sm font-bold text-primary">{eventRegs.length}</span>
                      </div>
                    </div>

                    {/* Certificate progress for this event */}
                    <div className="flex items-center gap-2">
                      <Progress value={eventCertPercentage} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground">{eventCertPercentage}% certificates</span>
                    </div>
                    
                    {eventRegs.length > 0 && (
                      <div className="space-y-2">
                        {/* Department breakdown bars */}
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(deptCount).slice(0, 4).map(([dept, count]) => (
                            <div key={dept} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-12 truncate">{dept}</span>
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary" 
                                  style={{ width: `${((count as number) / maxCount) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{count as number}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};
