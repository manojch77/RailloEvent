# How to Enable Email OTP in Firebase

## Step 1: Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **raillo**
3. In the left sidebar, click **Build** → **Authentication**
4. Click on **Sign-in method** tab
5. Find **Email/Password** in the providers list
6. Click on it and enable **Email/Password** (toggle to ON)
7. Click **Save**

## Step 2: Update Database Rules

1. In Firebase Console, go to **Realtime Database** → **Rules**
2. Replace the existing rules with:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "events": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "registrations": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "certificates": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "notifications": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "emailOTP": {
      "$email": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

3. Click **Publish**

## How Email OTP Works in Your App:

1. Student enters email in Step 2 of signup
2. Clicks "Send OTP" button
3. App generates a 6-digit OTP and stores it in Firebase at `emailOTP/{email}`
4. OTP is shown in **browser console** (for demo purposes)
5. Student enters the OTP and clicks "Verify"
6. App verifies the OTP from Firebase database
7. If verified, student can complete signup

## 🚀 Real Email OTP Now Working!

✅ **Full implementation complete:**

### How it Works (Real-Time):
1. Click **Send OTP** → Generates 6-digit code, stores in Firebase Realtime DB (`emailOTP/{email}` w/ 5min expiry)
2. **Real email** sent via Gmail/Nodemailer (check inbox/spam)
3. Enter OTP → **Real-time verification** from Firebase DB
4. Complete signup!

### Server Setup:
- **server/email.js**: Express + Nodemailer on port 3001
- **Proxy**: `/api/email/*` → server
- **Creds**: `.env` (Gmail + App Password)

### Run:
```
npm run dev
```
Starts Vite (8080) + Email Server (3001)

### Features:
- ✅ Real-time Firebase Realtime DB
- ✅ OTP Expiry (5min)
- ✅ Beautiful email template
- ✅ InputOTP UI component
- ✅ Resend support
- ✅ Fallback console log

**Test:** Go to Student Signup → Step 2 → Send OTP to your email!
