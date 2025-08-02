// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzt9OqpLDtyi9Cx7I_ao43VPLyAy471Lg",
  authDomain: "chat-react-project-dade0.firebaseapp.com",
  databaseURL:
    "https://chat-react-project-dade0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-react-project-dade0",
  storageBucket: "chat-react-project-dade0.firebasestorage.app",
  messagingSenderId: "573952354573",
  appId: "1:573952354573:web:20fed579f652a485726844",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
