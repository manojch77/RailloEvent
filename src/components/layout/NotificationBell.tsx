import { useState, useEffect } from "react";
import { Bell, X, Check, Calendar, Users, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { 
  subscribeToNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadCount,
  type Notification 
} from "@/lib/notificationService";
import { toast } from "sonner";

interface NotificationBellProps {
  role: "student" | "admin";
}

const NotificationBell = ({ role }: NotificationBellProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications(
      user?.uid,
      role,
      (data) => {
        setNotifications(data);
        setIsLoading(false);
        
        // Show toast for new unread notifications
        const unreadCount = getUnreadCount(data);
        if (unreadCount > 0) {
          const latestNotification = data[0];
          if (latestNotification && !latestNotification.read) {
            // Only show toast if this is a new notification (not from initial load)
            // For now, we show toast for all unread - you can optimize this
          }
        }
      }
    );

    return () => unsubscribe();
  }, [user?.uid, role]);

  const unreadCount = getUnreadCount(notifications);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (user?.uid) {
      await markAllNotificationsAsRead(user.uid, role);
      toast.success("All notifications marked as read");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "registration":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "event_created":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "payment":
        return <CreditCard className="h-4 w-4 text-yellow-500" />;
      case "certificate":
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-foreground"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleMarkAllAsRead}
                >
                  Mark all read
                </Button>
              )}
            </div>

            <ScrollArea className="h-80">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                        !notification.read ? "bg-muted/30" : ""
                      }`}
                      onClick={() => {
                        if (!notification.read && notification.id) {
                          handleMarkAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
