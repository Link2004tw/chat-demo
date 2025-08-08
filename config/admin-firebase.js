import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

// Check if already initialized
const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    })
  : getApp();

export const db = getDatabase(app);
