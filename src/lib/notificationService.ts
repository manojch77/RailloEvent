import { db } from "@/lib/firebase";
import { ref, push, onValue, off, set, get } from "firebase/database";

export interface Notification {
  id?: string;
  type: "registration" | "event_created" | "payment" | "certificate";
  title: string;
  message: string;
  fromUid?: string;
  fromName?: string;
  toUid?: string;
  toRole?: "student" | "admin" | "all";
  eventId?: string;
  eventTitle?: string;
  read: boolean;
  createdAt: number;
}

/**
 * Send a notification to a specific user or role
 */
export const sendNotification = async (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
  try {
    const notificationsRef = ref(db, "notifications");
    await push(notificationsRef, {
      ...notification,
      read: false,
      createdAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
};

/**
 * Send notification to admin about new registration
 */
export const notifyAdminOfRegistration = async (
  eventId: string,
  eventTitle: string,
  studentName: string,
  studentUid: string,
  rollNumber: string
) => {
  return sendNotification({
    type: "registration",
    title: "New Registration",
    message: `${studentName} (${rollNumber}) registered for ${eventTitle}`,
    fromUid: studentUid,
    fromName: studentName,
    toRole: "admin",
    eventId,
    eventTitle,
  });
};

/**
 * Notify students about new event
 */
export const notifyStudentsOfNewEvent = async (
  eventId: string,
  eventTitle: string,
  adminName: string,
  dept?: string
) => {
  return sendNotification({
    type: "event_created",
    title: "New Event",
    message: `New event "${eventTitle}" has been created by ${adminName}`,
    fromName: adminName,
    toRole: "all",
    eventId,
    eventTitle,
  });
};

/**
 * Notify registered students of an event with a custom message
 * This sends notifications to all students who registered for a specific event
 */
export const notifyRegisteredStudents = async (
  eventId: string,
  eventTitle: string,
  adminName: string,
  message: string,
  registeredStudentUids: string[]
) => {
  try {
    // Send notification to each registered student individually
    const notificationPromises = registeredStudentUids.map((studentUid) => {
      return sendNotification({
        type: "event_created",
        title: `Update: ${eventTitle}`,
        message: message,
        fromName: adminName,
        toUid: studentUid,
        eventId,
        eventTitle,
      });
    });

    await Promise.all(notificationPromises);
    return true;
  } catch (error) {
    console.error("Error sending notifications to registered students:", error);
    return false;
  }
};

/**
 * Notify all students with a custom message (broadcast)
 */
export const notifyAllStudents = async (
  adminName: string,
  title: string,
  message: string
) => {
  return sendNotification({
    type: "event_created",
    title: title,
    message: message,
    fromName: adminName,
    toRole: "all",
  });
};

/**
 * Subscribe to notifications for a specific user or role
 */
export const subscribeToNotifications = (
  userUid: string | undefined,
  role: "student" | "admin" | null,
  callback: (notifications: Notification[]) => void
) => {
  if (!userUid) {
    callback([]);
    return () => {};
  }

  const notificationsRef = ref(db, "notifications");
  
  const listener = onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const allNotifications = Object.entries(data).map(([id, val]: [string, any]) => ({
        id,
        ...val,
      }));

      // Filter notifications based on role
      let filteredNotifications: Notification[];
      
      if (role === "admin") {
        // Admin sees notifications sent to admin role or directly to them
        filteredNotifications = allNotifications.filter(
          (n) => n.toRole === "admin" || n.toUid === userUid
        );
      } else {
        // Students see notifications sent to all students or directly to them
        filteredNotifications = allNotifications.filter(
          (n) => n.toRole === "all" || n.toUid === userUid
        );
      }

      // Sort by createdAt descending
      filteredNotifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(filteredNotifications);
    } else {
      callback([]);
    }
  });

  return () => off(notificationsRef);
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = ref(db, `notifications/${notificationId}/read`);
    await set(notificationRef, true);
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (
  userUid: string,
  role: "student" | "admin"
) => {
  try {
    const snapshot = await get(ref(db, "notifications"));
    const data = snapshot.val();
    
    if (data) {
      const updates: Record<string, any> = {};
      
      Object.entries(data).forEach(([id, val]: [string, any]) => {
        if (role === "admin" && (val.toRole === "admin" || val.toUid === userUid) && !val.read) {
          updates[`${id}/read`] = true;
        } else if (role === "student" && (val.toRole === "all" || val.toUid === userUid) && !val.read) {
          updates[`${id}/read`] = true;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await set(ref(db, "notifications"), { ...data, ...updates } as any);
      }
    }
    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = (notifications: Notification[]): number => {
  return notifications.filter((n) => !n.read).length;
};
