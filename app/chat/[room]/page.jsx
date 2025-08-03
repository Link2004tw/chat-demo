"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import { ref, onChildAdded, onValue, query, orderByChild, limitToLast, endBefore, get, serverTimestamp } from "firebase/database";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { onAuthStateChanged } from "firebase/auth";
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const oldestTimestampRef = useRef(null);

  const router = useRouter();
  const params = useParams();
  const roomName = params.room;
  const messagesPerPage = 25;

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

  // Load initial messages and listen for new ones
  useEffect(() => {
    if (!currentUser) return;

    // Load cached messages
    const cachedMessages = localStorage.getItem(`messages_${roomName}`);
    if (cachedMessages) {
      const parsedMessages = JSON.parse(cachedMessages);
      setMessages(parsedMessages);
      if (parsedMessages.length > 0) {
        oldestTimestampRef.current = Math.min(...parsedMessages.map((m) => m.timestamp));
      }
    }

    const messagesRef = ref(db, `rooms/${roomName}/messages`);
    const messagesQuery = query(messagesRef, orderByChild("timestamp"), limitToLast(messagesPerPage));

    const unsubscribe = onChildAdded(messagesQuery, (snapshot) => {
      const msg = { ...snapshot.val(), id: snapshot.key };
      if (!msg || !msg.timestamp) {
        console.warn("Invalid message:", msg);
        return;
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const updatedMessages = [...prev, msg].sort((a, b) => a.timestamp - b.timestamp);
        localStorage.setItem(`messages_${roomName}`, JSON.stringify(updatedMessages));
        oldestTimestampRef.current = updatedMessages[0]?.timestamp || null;
        return updatedMessages;
      });
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Only scroll if user is near the bottom (within 100px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom && messages.length > 0) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Load more messages on scroll to top
  useEffect(() => {
    if (!currentUser || !hasMoreMessages) return;

    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = async () => {
      if (messagesContainer.scrollTop === 0 && !isLoadingMore) {
        setIsLoadingMore(true);
        try {
          const messagesRef = ref(db, `rooms/${roomName}/messages`);
          const olderMessagesQuery = query(
            messagesRef,
            orderByChild("timestamp"),
            endBefore(oldestTimestampRef.current),
            limitToLast(messagesPerPage)
          );
          const snapshot = await get(olderMessagesQuery);
          const olderMessages = [];
          snapshot.forEach((childSnapshot) => {
            const msg = { ...childSnapshot.val(), id: childSnapshot.key };
            if (msg && msg.timestamp) {
              olderMessages.push(msg);
            }
          });

          if (olderMessages.length === 0) {
            setHasMoreMessages(false);
            return;
          }

          setMessages((prev) => {
            const updatedMessages = [...olderMessages, ...prev].sort((a, b) => a.timestamp - b.timestamp);
            localStorage.setItem(`messages_${roomName}`, JSON.stringify(updatedMessages));
            oldestTimestampRef.current = updatedMessages[0]?.timestamp || null;
            return updatedMessages;
          });
        } catch (error) {
          console.error("Error loading more messages:", error);
          alert("Failed to load more messages.");
        } finally {
          setIsLoadingMore(false);
        }
      }
    };

    messagesContainer.addEventListener("scroll", handleScroll);
    return () => messagesContainer.removeEventListener("scroll", handleScroll);
  }, [currentUser, isLoadingMore, hasMoreMessages]);

  // Track presence
  useEffect(() => {
    if (!currentUser) return;

    const userRef = `rooms/${roomName}/onlineUsers/${currentUser.uid}`;
    const updatePresence = () =>
      saveData(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || "Anonymous",
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
      saveData(null, userRef, "set");
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [currentUser]);

  // Real-time online users
  useEffect(() => {
    const onlineUsersRef = ref(db, `rooms/${roomName}/onlineUsers`);
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      const users = snapshot.val() || {};
      const now = Date.now();
      const activeUsers = Object.values(users)
        .filter((user) => user && user.lastSeen && now - user.lastSeen < 20000)
        .map((user) => ({
          uid: user.uid,
          displayName: user.displayName,
          lastSeen: user.lastSeen,
        }));
      setOnlineUsers(activeUsers);
    }, (error) => {
      console.error("Error fetching online users:", error);
    });

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
      user: currentUser.displayName || "Anonymous",
      timestamp: serverTimestamp(),
    });

    try {
      await saveData(message.toRTDB(), `rooms/${roomName}/messages`, "push");
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
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

      if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
        throw new Error("Cloudinary configuration missing.");
      }

      const isImage = file.type.startsWith("image/");
      const uploadType = isImage ? "image" : "auto";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
      formData.append("cloud_name", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
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
        user: currentUser.displayName || "Anonymous",
        fileName: file.name,
        fileURL: data.secure_url,
        publicId: data.public_id,
        timestamp: serverTimestamp(),
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
    try {
      await saveData(null, userRef, "set");
      //await signOut(auth);
      //cookies.remove("auth-token", { path: "/" });
      //cookies.remove("last-room", { path: "/" });
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out.");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <div className="fixed top-0 left-0 right-0 z-10 p-4 bg-blue-600 text-white text-lg font-semibold flex justify-between items-center">
        <span>Chat Room: {roomName}</span>
        <button
          onClick={handleSignOut}
          className="px-5 py-2 rounded-md bg-red-500 hover:bg-red-600 text-sm font-bold"
        >
          Leave Room
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
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 mb-20"
      >
        {isLoadingMore && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Loading more messages...
          </div>
        )}
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
          className={`p-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
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