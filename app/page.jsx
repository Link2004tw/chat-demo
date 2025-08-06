"use client";

import { useRef, useState, useEffect } from "react";
import Cookies from "universal-cookie";
import Auth from "./components/Auth";
import PrimaryButton from "./components/PrimaryButton";
import OutlinedButton from "./components/OutlinedButton";
import Card from "./components/Card";
import TextInput from "./components/TextInput";
import { auth } from "@/config/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getData, saveData } from "@/utils/database";

const cookies = new Cookies();

export default function HomePage() {
  const [isAuth, setIsAuth] = useState(null);
  const [recentRooms, setRecentRooms] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const inputRef = useRef();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const token = cookies.get("auth-token");
      console.log(user, token);
      if (user && token) {
        console.log("I registered the user");
        setIsAuth(true);
        setCurrentUser(user);
      } else {
        setIsAuth(false);
        setCurrentUser(null);
        cookies.remove("auth-token", { path: "/" });
        cookies.remove("last-room", { path: "/" });
      }
    });
    return () => unsubscribe();
  }, [cookies.get("auth-token")]);

  useEffect(() => {
    const storedRooms = localStorage.getItem("recentRooms");
    if (storedRooms) {
      setRecentRooms(JSON.parse(storedRooms));
    }
  }, []);

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

  const joinRoom = async (roomName, retry = 0) => {
    const maxRetries = 4;

    if (!roomName) {
      alert("Please enter a room name.");
      return;
    }
    console.log("the curr user is");
    console.log(currentUser);
    if (!currentUser) {
      alert("User not authenticated. Please sign in again.");
      setIsAuth(false);
      return;
    }

    const uid = currentUser.uid;

    try {
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
      console.error(`Error joining room ${roomName}:`, error, {
        uid,
        path: `rooms/${roomName}/onlineUsers/${uid}`,
        authState: {
          uid: auth.currentUser?.uid,
          email: auth.currentUser?.email,
        },
        retryAttempt: retry,
      });
      if (error.code === "PERMISSION_DENIED" && retry < maxRetries) {
        console.warn(`Retrying joinRoom for ${roomName}, attempt ${retry + 1}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return joinRoom(roomName, retry + 1);
      }
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
      setCurrentUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out.");
    }
  };

  if (isAuth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p>Loading...</p>
      </div>
    );
  }

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
