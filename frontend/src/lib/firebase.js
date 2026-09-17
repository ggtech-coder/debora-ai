import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Fill these values in frontend/.env when you create your Firebase project.
// The app remains in local/demo mode while these placeholders are unchanged.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCjV7UQbdSVdVqcyXDODJ1SW34vYEwCwkc",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "crm-proje-9eade.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "crm-proje-9eade",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "crm-proje-9eade.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "523357575926",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:523357575926:web:f31311860303649a06ead7",
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => value && !String(value).startsWith("YOUR_")
);

const app = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

// Firestore collection names used by the application.
export const COLLECTIONS = {
  users: "users",
  tenants: "tenants",
  leads: "leads",
  clients: "clients",
  properties: "properties",
  deals: "deals",
  events: "events",
  transactions: "transactions",
  notifications: "notifications",
  agents: "agents",
  teams: "teams",
  funnels: "funnels",
  automations: "automations",
  automationLog: "automationLog",
  agentConversations: "agentConversations",
  agentConfig: "agentConfig",
};
