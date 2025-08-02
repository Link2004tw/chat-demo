"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import { onChildAdded, onValue, ref } from "firebase/database";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { onAuthStateChanged, signOut } from "firebase/auth";
import MessageItem from "@/app/components/MessageItem";
import ImageMessageItem from "@/app/components/ImageMessageItem";
import FileMessageItem from "@/app/components/FileMessageItem";
import Cookies from "universal-cookie";
import Message from "@/models/message";
import ImageMessage from "@/models/imageMessage";
import { saveData } from "@/utils/database";

const cookies = new Cookies();

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const router = useRouter();
  const roomName = "room1"; // Hardcoded for 1 room

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const token = cookies.get("auth-token");
      if (!user || !token) {
        router.replace("/");
      } else {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Real-time messages
  useEffect(() => {
    if (!currentUser) return;

    const messagesRef = `rooms/${roomName}/messages`;
    const unsubscribe = onChildAdded(
      ref(db, messagesRef),
      (snapshot) => {
        const msg = { ...snapshot.val(), id: snapshot.key };
        setMessages((prev) => [...prev, msg]);
      },
      (error) => {
        console.error("Error fetching messages:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Track presence
  useEffect(() => {
    if (!currentUser) return;

    const userRef = `rooms/${roomName}/onlineUsers/${currentUser.uid}`;
    const updatePresence = () =>
      saveData(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          lastSeen: Date.now(),
        },
        userRef,
        "set"
      );

    updatePresence();
    const interval = setInterval(updatePresence, 30000); // Update every 30 seconds

    const handleUnload = () => {
      if (currentUser?.uid) {
        navigator.sendBeacon(
          `/api/remove-user?room=${roomName}&uid=${currentUser.uid}`
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      saveData(null, userRef, "set"); // Remove user on cleanup
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [currentUser]);

  // Real-time online users
  useEffect(() => {
    const onlineUsersRef = `rooms/${roomName}/onlineUsers`;
    const unsubscribe = onValue(
      ref(db, onlineUsersRef),
      (snapshot) => {
        const users = snapshot.val() || {};
        const now = Date.now();
        const activeUsers = Object.values(users)
          .filter((user) => now - user.lastSeen < 20000)
          .map((user) => ({
            uid: user.uid,
            displayName: user.displayName,
            lastSeen: user.lastSeen,
          }));
        setOnlineUsers(activeUsers);
      },
      (error) => {
        console.error("Error fetching online users:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Early returns
  if (!currentUser) return <p>Loading...</p>;

  // Send text message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message = new Message({
      text: input,
      user: currentUser.displayName,
      timestamp: Date.now(),
    });

    try {
      await saveData(message.toRTDB(), `rooms/${roomName}/messages`, "push");
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Trigger file input
  const handleUpload = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  // Handle file upload to Cloudinary
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("File size exceeds 10MB limit.");
        return;
      }

      if (
        !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
        !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      ) {
        throw new Error("Cloudinary configuration missing.");
      }

      const isImage = file.type.startsWith("image/");
      const uploadType = isImage ? "image" : "auto";
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );
      formData.append(
        "cloud_name",
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      );
      formData.append("folder", `rooms/${roomName}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${uploadType}/upload`,
        { method: "POST", body: formData }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Cloudinary upload failed");
      }

      const data = await response.json();
      const message = new ImageMessage({
        user: currentUser.displayName,
        fileName: file.name,
        fileURL: data.secure_url,
        publicId: data.public_id,
        timestamp: Date.now(),
      });

      await saveData(message.toRTDB(), `rooms/${roomName}/messages`, "push");

      fileInputRef.current.value = "";
    } catch (error) {
      console.error("File upload failed:", error);
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    const userRef = `rooms/${roomName}/onlineUsers/${currentUser.uid}`;
    await saveData(null, userRef, "set");
    await signOut(auth);
    cookies.remove("auth-token");
    cookies.remove("last-room");
    router.push("/");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <div className="fixed top-0 left-0 right-0 z-10 p-4 bg-blue-600 text-white text-lg font-semibold flex justify-between items-center">
        <span>Chat Room: {roomName}</span>
        <button
          onClick={handleSignOut}
          className="px-5 py-2 rounded-md bg-red-500 hover:bg-red-600 text-sm font-bold"
        >
          Sign Out
        </button>
      </div>
      <div className="mt-16 pt-4 px-4 text-sm text-gray-800 dark:text-gray-200">
        <h2 className="font-semibold mb-1">
          Online Users ({onlineUsers.length})
        </h2>
        <ul className="flex gap-2 flex-wrap">
          {onlineUsers.map((user) => (
            <li
              key={user.uid}
              className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-xs"
            >
              {user.displayName}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 mb-20">
        {messages.map((msg) => {
          if (msg.type === "text") {
            return <MessageItem key={msg.id} message={msg} />;
          } else if (msg.type === "file") {
            const isImage = /\.(png|jpe?g|gif|webp)$/i.test(msg.fileName);
            return isImage ? (
              <ImageMessageItem key={msg.id} message={msg} />
            ) : (
              <FileMessageItem key={msg.id} message={msg} />
            );
          }
          return null;
        })}
      </div>
      <form
        onSubmit={sendMessage}
        className="fixed bottom-0 left-0 right-0 p-4 border-t bg-white dark:bg-gray-800 flex gap-2"
      >
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className={`p-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors ${
            isUploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-label="Upload file"
        >
          {isUploading ? (
            <span className="text-sm">Uploading...</span>
          ) : (
            <ArrowUpTrayIcon className="h-6 w-6" />
          )}
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          Send
        </button>
      </form>
    </div>
  );
}
