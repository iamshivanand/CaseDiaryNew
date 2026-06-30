import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Production Firebase Configuration
// (Client-side keys are non-sensitive and safe to include in code)
const firebaseConfig = {
  apiKey: "AIzaSyD9DcH9WFSJAcwElLXghd3vJk_hm65KPKk",
  authDomain: "casediary-shiv-2026.firebaseapp.com",
  projectId: "casediary-shiv-2026",
  storageBucket: "casediary-shiv-2026.firebasestorage.app",
  messagingSenderId: "856911824969",
  appId: "1:856911824969:web:3bf4c42789dfb8d1001798",
};

// Initialize Firebase App (Avoiding duplicate initializations)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
