# 🚂 RailLo Event Hub

A modern **Event Management Web Application** built using React and Firebase that allows students to explore, register, and participate in college events seamlessly.

---

## 🌟 Features

### 🔐 Authentication & Security

* Email OTP Verification (Custom OTP System)
* Secure login & signup using Firebase Authentication
* Real-time verification system

### 🎉 Event Management

* Browse all college events
* Register for events instantly
* View event details (date, time, venue, description)
* Track registered events

### 🧑‍💼 Admin Panel

* Create, update, and delete events
* View registered participants
* Manage event data in real-time

### 🔔 Notifications

* Event updates and reminders
* Registration confirmation alerts

### ⚡ Real-Time Updates

* Firebase Firestore integration
* Instant data sync across users

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Tailwind CSS

### Backend / Database

* Firebase Authentication
* Firebase Firestore
* Firebase Functions

### Email Service

* Nodemailer / SendGrid (for OTP emails)

---

## 📁 Project Structure

```
railLo-event-hub/
│
├── public/
├── src/
│   ├── components/
│   │   ├── OTPForm.jsx
│   │   ├── EventCard.jsx
│   │   └── Navbar.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   └── EventDetails.jsx
│   │
│   ├── services/
│   │   ├── firebase.js
│   │   └── api.js
│   │
│   └── App.jsx
│
├── functions/ (Firebase Functions)
│   └── sendOTP.js
│
├── README.md
└── package.json
```

---

## 🔄 OTP Verification Flow

1. User enters email
2. System generates a 6-digit OTP
3. OTP is sent via email
4. OTP stored in Firestore with timestamp
5. User enters OTP
6. Backend verifies OTP
7. Access granted if valid & not expired (5 mins)

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```
git clone https://github.com/your-username/raillo-event-hub.git
cd raillo-event-hub
```

### 2️⃣ Install Dependencies

```
npm install
```

### 3️⃣ Firebase Setup

* Go to Firebase Console
* Create a project
* Enable Authentication (Email/Password)
* Enable Firestore Database

### 4️⃣ Add Firebase Config

Create `firebase.js` inside `/services`:

```js
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT",
  projectId: "YOUR_PROJECT_ID",
};

export const app = initializeApp(firebaseConfig);
```

---

### 5️⃣ Run Project

```
npm start
```

---

## 🔐 Firestore Schema

### OTP Collection

```
otp/
  email:
    otp: 123456
    createdAt: timestamp
```

### Events Collection

```
events/
  eventId:
    title
    description
    date
    participants[]
```

---

## 🚀 Deployment

### Frontend

* Vercel / Netlify

### Backend

* Firebase Functions

---

## 📸 Screenshots

(Add your UI screenshots here)

---

## 💡 Future Enhancements

* 📱 Mobile App (Flutter)
* 🎟️ QR Code Entry System
* 📊 Analytics Dashboard
* 🏆 Leaderboard & Certificates
* 🔔 Push Notifications

---

## 👨‍💻 Developer

**Manoj (RailLo Creator)**
Building smart solutions for college students 🚀

---
