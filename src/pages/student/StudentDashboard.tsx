import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import EventCard from "@/components/events/EventCard";
import AdCarousel from "@/components/AdCarousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import RegistrationModal from "@/components/events/RegistrationModal";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { toast } from "sonner";
import { Bell, AlertCircle } from "lucide-react";
import { subscribeToNotifications, markNotificationAsRead, type Notification } from "@/lib/notificationService";

const DEPARTMENTS = ["All", "CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML"];

const StudentDashboard = () => {
  const { user, role } = useAuth();
  const [filter, setFilter] = useState("All");
  const [events, setEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [regModal, setRegModal] = useState<{
    open: boolean; eventId: string; eventTitle: string; type: "single" | "team"; isPaid: boolean; amount?: number; paymentQr?: string; dept?: string; allowedDepts?: string[]; upiId?: string; mobileNumber?: string;
  }>({ open: false, eventId: "", eventTitle: "", type: "single", isPaid: false });

  useEffect(() => {
    // Redirect if admin tries to access student dashboard
    if (role === "admin") {
      return;
    }
    
    const eventsRef = ref(db, "events");
    const unsub = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: any) => ({
          id,
          ...val,
        }));
        // Filter events that are open for registration
        const openEvents = list.filter((e: any) => e.isOpen !== false);
        setEvents(openEvents);
      } else {
        setEvents([]);
      }
    });
    return () => unsub();
  }, [role]);

  // Subscribe to notifications for alerts
  useEffect(() => {
    const unsubscribe = subscribeToNotifications(
      user?.uid,
      "student",
      (notifications) => {
        setAlerts(notifications);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  const unreadAlerts = alerts.filter((a) => !a.read);

  const filteredEvents = filter === "All"
    ? events
    : events.filter((e) => e.dept === filter || (e.allowedDepts && e.allowedDepts.includes(filter)));

  return (
    <AppLayout role="student">
      <AdCarousel />

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-between"
            onClick={() => setShowAlerts(!showAlerts)}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Alerts & Updates</span>
              {unreadAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadAlerts.length} new
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {showAlerts ? "Hide" : "Show"}
            </span>
          </Button>
          
          <AnimatePresence>
            {showAlerts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-2"
              >
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.read ? "border-border bg-background" : "border-primary/30 bg-primary/5"
                    }`}
                    onClick={() => {
                      if (alert.id && !alert.read) {
                        markNotificationAsRead(alert.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.eventTitle && <span className="font-medium">{alert.eventTitle}</span>}
                        </p>
                      </div>
                      {!alert.read && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
                {alerts.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground">
                    +{alerts.length - 5} more alerts
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Department filters */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {DEPARTMENTS.map((dept) => (
          <Badge
            key={dept}
            variant={filter === dept ? "default" : "secondary"}
            className={`cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-all ${
              filter === dept ? "bg-primary text-primary-foreground" : ""
            }`}
            onClick={() => setFilter(dept)}
          >
            {dept}
          </Badge>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">No events yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Events created by admins will appear here. Stay tuned!
            </p>
          </motion.div>
        ) : (
          filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              {...event}
              onRegister={() =>
                setRegModal({
                  open: true,
                  eventId: event.id,
                  eventTitle: event.title,
                  type: event.type,
                  isPaid: event.isPaid,
                  amount: event.amount ? Number(event.amount) : undefined,
                  paymentQr: event.paymentQr,
                  dept: event.dept,
                  allowedDepts: event.allowedDepts,
                  upiId: event.upiId,
                  mobileNumber: event.mobileNumber,
                })
              }
            />
          ))
        )}
      </div>

      <AnimatePresence>
        {regModal.open && (
          <RegistrationModal
            eventId={regModal.eventId}
            eventTitle={regModal.eventTitle}
            type={regModal.type}
            isPaid={regModal.isPaid}
            amount={regModal.amount}
            paymentQr={regModal.paymentQr}
            dept={regModal.dept}
            allowedDepts={regModal.allowedDepts}
            upiId={regModal.upiId}
            mobileNumber={regModal.mobileNumber}
            onClose={() => setRegModal({ ...regModal, open: false })}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default StudentDashboard;
