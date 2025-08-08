"use client";

import { useRef, useState, useEffect } from "react";
import Cookies from "universal-cookie";
import PrimaryButton from "./PrimaryButton";
import OutlinedButton from "./OutlinedButton";
import Card from "./Card";
import TextInput from "./TextInput";
import { signOut } from "firebase/auth";
import { getData, saveData } from "@/utils/database";
import { auth } from "@/config/firebase";

const cookies = new Cookies();

export default function EnterRoomPage({ currentUser, router, setIsAuth }) {
  const [recentRooms, setRecentRooms] = useState([]);
  const inputRef = useRef();

  useEffect(() => {
    const storedRooms = localStorage.getItem("recentRooms");
    if (storedRooms) {
      setRecentRooms(JSON.parse(storedRooms));
    }
  }, []);

  const checkRoomExists = async (roomName) => {
    const response = await fetch("/api/check-room-exists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName }),
    });

    const data = await response.json();
    return data.exists;
  };

  const updateRecentRooms = (roomName) => {
    setRecentRooms((prev) => {
      const updated = [roomName, ...prev.filter((r) => r !== roomName)].slice(
        0,
        3
      );
      localStorage.setItem("recentRooms", JSON.stringify(updated));
      return updated;
    });
  };

  const joinRoom = async (roomName) => {
    if (!roomName) {
      alert("Please enter a room name.");
      return;
    }

    if (!currentUser) {
      alert("User not authenticated. Please sign in again.");
      setIsAuth(false);
      return;
    }

    const uid = currentUser.uid;

    try {
      const exists = await checkRoomExists(roomName);

      if (!exists) {
        const confirmed = window.confirm(
          `Room "${roomName}" does not exist. Would you like to continue anyway?`
        );
        if (!confirmed) return;
      }

      const users = (await getData(`rooms/${roomName}/onlineUsers`)) || {};
      const userIds = Object.keys(users);
      const isAlreadyInRoom = userIds.includes(uid);

      if (userIds.length >= 4 && !isAlreadyInRoom) {
        alert("This room already has 4 users.");
        return;
      }

      if (!isAlreadyInRoom) {
        const userData = {
          uid,
          displayName: currentUser.displayName || "Anonymous",
          lastSeen: Date.now(),
        };
        await saveData(userData, `rooms/${roomName}/onlineUsers/${uid}`, "set");
      }

      cookies.set("last-room", roomName, { path: "/" });
      updateRecentRooms(roomName);
      router.push(`/chat/${roomName}`);
    } catch (error) {
      console.error(`Error joining room ${roomName}:`, error, { uid });

      if (error.code === "PERMISSION_DENIED") {
        alert("Permission denied. Please sign in again.");
        setIsAuth(false);
      } else {
        alert(`Failed to join room ${roomName}: ${error.message}`);
      }
    }
  };

  const handleEnterChat = async () => {
    const enteredRoomName = inputRef.current?.value?.trim();
    await joinRoom(enteredRoomName);
  };

  const handleRecentRoomClick = async (roomName) => {
    await joinRoom(roomName);
  };

  const handleSignOut = async () => {
    if (!currentUser) {
      cookies.remove("auth-token", { path: "/" });
      cookies.remove("last-room", { path: "/" });
      setIsAuth(false);
      return;
    }

    const uid = currentUser.uid;
    const lastRoom = cookies.get("last-room");

    if (lastRoom) {
      try {
        await saveData(null, `rooms/${lastRoom}/onlineUsers/${uid}`, "set");
      } catch (error) {
        console.error("Error removing user from room:", error);
      }
    }

    try {
      await signOut(auth);
      cookies.remove("auth-token", { path: "/" });
      cookies.remove("last-room", { path: "/" });
      setIsAuth(false);
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <Card title="Enter Room Name:" className="p-8 w-full max-w-md">
        <div className="flex flex-col gap-4 mt-4">
          <TextInput
            ref={inputRef}
            className="w-full"
            placeholder="Enter room name"
          />
          {recentRooms.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              {recentRooms.map((room) => (
                <OutlinedButton
                  key={room}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRecentRoomClick(room)}
                  className="w-full sm:w-auto"
                  aria-label={`Join room ${room}`}
                  title={room}
                />
              ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <PrimaryButton
              onClick={handleEnterChat}
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
            >
              Enter Chat
            </PrimaryButton>
            <PrimaryButton
              onClick={handleSignOut}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-none"
            >
              Sign Out
            </PrimaryButton>
          </div>
        </div>
      </Card>
    </div>
  );
}
