"use client";

import { useRef, useState } from "react";
import Cookies from "universal-cookie";
import Auth from "./components/Auth";
import PrimaryButton from "./components/PrimaryButton";
import Card from "./components/Card";
import TextInput from "./components/TextInput";
import { auth } from "@/config/firebase";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getData, saveData } from "@/utils/database";

const cookies = new Cookies();

export default function HomePage() {
  const [isAuth, setIsAuth] = useState(cookies.get("auth-token"));
  const inputRef = useRef();
  const router = useRouter();
  //const roomName = "room1"; // Hardcoded for 1 room

  const handleEnterChat = async () => {
    const enteredRoomName = inputRef.current?.value?.trim();
    // if (enteredRoomName !== roomName) {
    //   alert("Only 'room1' is allowed.");
    //   return;
    // }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert("User not authenticated.");
      return;
    }

    try {
      // Get current users in the onlineUsers node
      const users =
        (await getData(`rooms/${enteredRoomName}/onlineUsers`)) || {};
      const userIds = Object.keys(users);
      const isAlreadyInRoom = userIds.includes(uid);

      // Check if room has reached the 2-user limit
      if (userIds.length >= 2 && !isAlreadyInRoom) {
        alert("This room already has two users.");
        return;
      }

      // Add user to onlineUsers node if not already present
      if (!isAlreadyInRoom) {
        await saveData(
          {
            uid,
            displayName: auth.currentUser?.displayName || "Anonymous",
            lastSeen: Date.now(),
          },
          `rooms/${enteredRoomName}/onlineUsers/${uid}`,
          "set"
        );
      }

      // Store the room name in a cookie for sign-out cleanup
      cookies.set("last-room", enteredRoomName, { path: "/" });

      router.push(`/chat/${enteredRoomName}`);
    } catch (error) {
      console.error("Error accessing or creating room:", error);
      alert("Failed to enter room.");
    }
  };

  const handleSignOut = async () => {
    const uid = auth.currentUser?.uid;
    const lastRoom = cookies.get("last-room");

    if (uid && lastRoom) {
      try {
        // Remove user from the onlineUsers node of the last room
        await saveData(null, `rooms/${lastRoom}/onlineUsers/${uid}`, "set");
      } catch (error) {
        console.error("Error removing user from room:", error);
      }
    }

    try {
      // Sign out from Firebase Auth
      await signOut(auth);
      // Clear cookies
      cookies.remove("auth-token", { path: "/" });
      cookies.remove("last-room", { path: "/" });
      setIsAuth(null);
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out.");
    }
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
            placeholder="Enter room name"
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
