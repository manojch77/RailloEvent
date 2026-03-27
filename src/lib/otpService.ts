import { db, auth } from "./firebase";
import { ref, set, get, remove } from "firebase/database";
import { signInWithPhoneNumber, RecaptchaVerifier, ApplicationVerifier, ConfirmationResult } from "firebase/auth";

// Store confirmation result for phone verification
let phoneConfirmationResult: ConfirmationResult | null = null;

// Generate a random 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Initialize reCAPTCHA verifier - must be visible in DOM
export const initRecaptcha = (): RecaptchaVerifier => {
  // Ensure the recaptcha-container is in the DOM and visible
  const container = document.getElementById("recaptcha-container");
  if (container) {
    container.style.display = "block";
  }
  
  return new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "normal",
    callback: (response) => {
      console.log("reCAPTCHA solved:", response);
    },
    "error-callback": () => {
      console.error("reCAPTCHA error");
    },
  });
};

// Reset reCAPTCHA to allow new OTP requests
export const resetRecaptcha = (recaptchaVerifier: RecaptchaVerifier) => {
  try {
    recaptchaVerifier.clear();
  } catch (e) {
    console.error("Error clearing reCAPTCHA:", e);
  }
};

// Send OTP to mobile phone using Firebase
export const sendPhoneOTP = async (phoneNumber: string, recaptchaVerifier: ApplicationVerifier): Promise<string> => {
  try {
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    phoneConfirmationResult = confirmation;
    return "success";
  } catch (error: any) {
    console.error("Error sending phone OTP:", error);
    throw new Error(getErrorMessage(error.code));
  }
};

// Verify phone OTP
export const verifyPhoneOTP = async (otp: string): Promise<string> => {
  if (!phoneConfirmationResult) {
    throw new Error("Please request OTP first");
  }
  try {
    const result = await phoneConfirmationResult.confirm(otp);
    return result.user.uid;
  } catch (error: any) {
    console.error("Error verifying phone OTP:", error);
    throw new Error("Invalid OTP");
  }
};

// Send OTP to email (custom implementation using Firebase Realtime Database)
export const sendEmailOTP = async (email: string): Promise<void> => {
  const otp = generateOTP();
  const otpRef = ref(db, `emailOTP/${email.replace(/[^a-zA-Z0-9]/g, "_")}`);
  
  // Store OTP with 5-minute expiry
  await set(otpRef, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    verified: false
  });

  // In production, you would send this OTP via email service
  // For now, we'll store it and the user would receive it via console/log
  // Send real email via server API
  try {
    const response = await fetch('/api/email/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to send email');
    }
    console.log('Email OTP sent to', email);
  } catch (error) {
    console.error('Email send failed:', error);
    // Fallback console log
    console.log(`Fallback OTP for ${email}: ${otp}`);
  }
};


// Verify email OTP
export const verifyEmailOTP = async (email: string, otp: string): Promise<boolean> => {
  const otpRef = ref(db, `emailOTP/${email.replace(/[^a-zA-Z0-9]/g, "_")}`);
  const snapshot = await get(otpRef);
  
  if (!snapshot.exists()) {
    throw new Error("No OTP request found for this email");
  }
  
  const data = snapshot.val();
  
  // Check if OTP is expired
  if (Date.now() > data.expiresAt) {
    await remove(otpRef);
    throw new Error("OTP has expired. Please request a new one");
  }
  
  // Check if OTP matches
  if (data.otp !== otp) {
    throw new Error("Invalid OTP");
  }
  
  // Mark as verified
  await set(otpRef, { ...data, verified: true });
  
  // Clean up after verification
  setTimeout(() => remove(otpRef), 60000);
  
  return true;
};

// Get error message from error code
const getErrorMessage = (code: string): string => {
  switch (code) {
    case "auth/invalid-phone-number":
      return "Invalid phone number";
    case "auth/too-many-requests":
      return "Too many requests. Please try again later";
    case "auth/quota-exceeded":
      return "SMS quota exceeded. Please try again later";
    default:
      return "Failed to send OTP. Please try again";
  }
};
