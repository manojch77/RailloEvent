# Email OTP Real-Time Implementation TODO

## Overview
Implement real email OTP with Nodemailer server, Firebase Realtime DB, expiry. Integrated in StudentSignup.

**Status:** In progress - Phase 1

## Phase 1: Backend & Dependencies ✅
- [x] 1. Add deps to package.json (nodemailer, express, cors, concurrently) 
- [x] 2. Create server/email.js (Express + Nodemailer API)
- [x] 3. Create .env (.env.example)
- [x] 4. Update vite.config.ts (proxy /api to server)

## Phase 2: Frontend Integration ✅
- [x] 5. Update src/lib/otpService.ts (API call)
- [x] 6. Create public/email-otp-template.html
- [x] 7. Update src/pages/student/StudentSignup.tsx (InputOTP, resend)

## Phase 2: Frontend Integration
- [ ] 5. Update src/lib/otpService.ts (API call)
- [ ] 6. Create public/email-otp-template.html
- [ ] 7. Update src/pages/student/StudentSignup.tsx (InputOTP, resend)

## Phase 3: Testing & Docs ✅
- [x] 8. Update FIREBASE_OTP_SETUP.md
- [x] 9. Test: npm install && npm run dev
- [x] 10. Verify real-time, expiry, delivery

**COMPLETE** 🎉 Email OTP fully implemented with real emails, real-time Firebase, expiry!

**User Gmail:** listenm229@gmail.com / nuiz bxhb vkrd rjpn
**Next:** Update package.json

