import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";

type UserRole = "student" | "admin" | null;

export interface UserProfile {
  name: string;
  rollNumber: string;
  dept: string;
  year: string;
  mobile: string;
  email: string;
  role: UserRole;
  uid?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  login: (rollNumber: string, password: string) => Promise<void>;
  signup: (profile: UserProfile, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isDark: boolean;
  toggleTheme: () => void;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// Map rollNumber to a fake email for Firebase Auth
const rollToEmail = (roll: string) => `${roll.toLowerCase().replace(/[^a-z0-9]/g, "")}@raillo.app`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("raillo-theme");
    if (saved === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
    const notifSaved = localStorage.getItem("raillo-notifications");
    if (notifSaved === "false") setNotificationsEnabled(false);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Load profile from DB
        try {
          const snap = await get(ref(db, `users/${fbUser.uid}`));
          if (snap.exists()) {
            setUser({ ...snap.val(), uid: fbUser.uid });
          }
        } catch (e) {
          console.error("Failed to load profile:", e);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("raillo-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("raillo-theme", "light");
      }
      return next;
    });
  };

  const toggleNotifications = () => {
    setNotificationsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("raillo-notifications", String(next));
      return next;
    });
  };

  const login = async (rollNumber: string, password: string) => {
    const email = rollToEmail(rollNumber);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (profile: UserProfile, password: string) => {
    const email = rollToEmail(profile.rollNumber);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    
    // Save profile to DB
    await set(ref(db, `users/${cred.user.uid}`), {
      name: profile.name,
      rollNumber: profile.rollNumber,
      dept: profile.dept,
      year: profile.year,
      mobile: profile.mobile,
      email: profile.email,
      role: profile.role,
    });
    setUser({ ...profile, uid: cred.user.uid });
  };

  const logoutFn = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        role: user?.role ?? null,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout: logoutFn,
        isDark,
        toggleTheme,
        notificationsEnabled,
        toggleNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
