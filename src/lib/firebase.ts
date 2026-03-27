import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCdrm2U8av6DlU0iDmPb78id83ncVetgDw",
  authDomain: "raillo.firebaseapp.com",
  databaseURL: "https://raillo-default-rtdb.firebaseio.com",
  projectId: "raillo",
  storageBucket: "raillo.firebasestorage.app",
  messagingSenderId: "61165711686",
  appId: "1:61165711686:web:665207985d3a232278b547",
  measurementId: "G-Q30FZMVYPV",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
export default app;
