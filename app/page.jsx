"use client";

import { useRef, useState } from "react";
import Cookies from "universal-cookie";
import Auth from "./components/Auth";
import PrimaryButton from "./components/PrimaryButton";
import Card from "./components/Card";
import TextInput from "./components/TextInput";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  collection,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/config/firebase"; // Adjust path as needed
import { useRouter } from "next/navigation";

const cookies = new Cookies();

export default function HomePage() {
  const [isAuth, setIsAuth] = useState(cookies.get("auth-token"));
  const inputRef = useRef();

  const router = useRouter(); // Add this at the top with imports

  const handleEnterChat = async () => {
    const roomName = inputRef.current?.value?.trim();
    if (!roomName) return;

    const roomDocRef = doc(db, "rooms", roomName);
    const onlineUsersRef = collection(db, `rooms/${roomName}/onlineUsers`);
    const uid = auth.currentUser?.uid;

    if (!uid) {
      alert("User not authenticated.");
      return;
    }

    try {
      // Get current users in the onlineUsers subcollection
      const onlineUsersSnap = await getDocs(onlineUsersRef);
      const users = onlineUsersSnap.docs.map((doc) => doc.data());
      const userIds = users.map((user) => user.uid);
      const isAlreadyInRoom = users.some((user) => user.uid === uid);

      // Check if room has reached the 2-user limit
      if (userIds.length >= 2 && !isAlreadyInRoom) {
        
        alert("This room already has two users.");
        return;
      }

      // Check if room document exists
      const roomSnap = await getDoc(roomDocRef);
      if (!roomSnap.exists()) {
        // Create new room if it doesn't exist
        await setDoc(roomDocRef, {
          createdAt: new Date(),
        });
      }

      // Add user to onlineUsers subcollection if not already present
      if (!isAlreadyInRoom) {
        await setDoc(doc(db, `rooms/${roomName}/onlineUsers`, uid), {
          uid,
          displayName: auth.currentUser?.displayName || "Anonymous",
          lastSeen: Date.now(),
        });
      }

      router.push(`/chat?room=${roomName}`);
    } catch (error) {
      console.error("Error accessing or creating room:", error);
      alert("Failed to enter room.");
    }
  };

  const handleSignOut = async () => {
    const uid = auth.currentUser?.uid;

    if (room && uid) {
      const roomDocRef = doc(db, "rooms", room);
      await updateDoc(roomDocRef, {
        [`users.${uid}`]: deleteField(),
      });
    }

    cookies.remove("auth-token");
    setIsAuth(null);
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Auth setAuth={setIsAuth} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <Card title="Enter Room Name:" className="p-8 w-full max-w-md">
        <div className="flex flex-col gap-4 mt-4">
          <TextInput
            ref={inputRef}
            className="w-full"
            placeholder="Room name"
          />
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <PrimaryButton
              onClick={handleEnterChat}
              className="w-full sm:w-auto"
            >
              Enter Chat
            </PrimaryButton>
            <PrimaryButton
              onClick={handleSignOut}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              Sign Out
            </PrimaryButton>
          </div>
        </div>
      </Card>
    </div>
  );
}
