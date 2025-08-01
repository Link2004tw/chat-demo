// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzt9OqpLDtyi9Cx7I_ao43VPLyAy471Lg",
  authDomain: "chat-react-project-dade0.firebaseapp.com",
  projectId: "chat-react-project-dade0",
  storageBucket: "chat-react-project-dade0.firebasestorage.app",
  messagingSenderId: "573952354573",
  appId: "1:573952354573:web:20fed579f652a485726844",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
