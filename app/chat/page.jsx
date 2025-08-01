"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/config/firebase";
import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import MessageItem from "../components/MessageItem";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const roomName = searchParams.get("room");

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
  const messagesRef = collection(db, `rooms/${roomName}/messages`);
  useEffect(() => {
    if (!roomName) return;

    const q = query(messagesRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [roomName]);

  // Track presence (uncommented and fixed)
  useEffect(() => {
    if (!roomName || !currentUser) return;

    const userDocRef = doc(
      db,
      `rooms/${roomName}/onlineUsers`,
      currentUser.uid
    );
    const updatePresence = () =>
      setDoc(
        userDocRef,
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          lastSeen: Date.now(),
        },
        { merge: true }
      );

    updatePresence();
    const interval = setInterval(updatePresence, 10000);

    const handleUnload = () => {
      if (roomName && currentUser?.uid) {
        navigator.sendBeacon(
          `/api/remove-user?room=${roomName}&uid=${currentUser.uid}`
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      handleUnload();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [roomName, currentUser]);

  // Real-time online users
  useEffect(() => {
    if (!roomName) return;

    const onlineUsersRef = collection(db, `rooms/${roomName}/onlineUsers`);
    const unsubscribe = onSnapshot(onlineUsersRef, (snapshot) => {
      const now = Date.now();
      const users = snapshot.docs
        .map((doc) => doc.data())
        .filter((user) => now - user.lastSeen < 20000);
      setOnlineUsers(users);
    });
    return () => unsubscribe();
  }, [roomName]);

  // Early returns after all hooks
  if (!roomName) return <p>Room not specified.</p>;
  if (!currentUser) return <p>Loading...</p>;

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    await addDoc(messagesRef, {
      text: input,
      user: currentUser.displayName,
      timestamp: serverTimestamp(),
    });
    setInput("");
  };

  // Sign out
  const handleSignOut = async () => {
    const userDocRef = doc(
      db,
      `rooms/${roomName}/onlineUsers`,
      currentUser.uid
    );
    await deleteDoc(userDocRef);
    await signOut(auth);
    cookies.remove("auth-token");
    router.push("/");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-10 p-4 bg-blue-600 text-white text-lg font-semibold flex justify-between items-center">
        <span>Chat Room: {roomName}</span>
        <button
          onClick={handleSignOut}
          className="px-5 py-2 rounded-md bg-red-500 hover:bg-red-600 text-sm font-bold"
        >
          Sign Out
        </button>
      </div>

      {/* Online Users */}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 mb-20">
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input */}
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
