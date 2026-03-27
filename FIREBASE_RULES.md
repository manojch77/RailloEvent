# Firebase Database Rules - Updated

Replace your existing Firebase Database Rules with the following:

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

## Changes Made:
- Added `emailOTP` node to allow OTP storage and verification

## How to Update:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **raillo**
3. Go to **Realtime Database** → **Rules**
4. Replace the existing rules with the updated rules above
5. Click **Publish**
