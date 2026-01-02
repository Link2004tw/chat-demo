// app/chat/[room]/page.jsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import {
  ref,
  onChildAdded,
  query,
  orderByChild,
  limitToLast,
  endBefore,
  get,
  set,
  serverTimestamp,
} from "firebase/database";
import {
  ArrowUpTrayIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { onAuthStateChanged } from "firebase/auth";
import MessageItem from "@/app/components/MessageItem";
import ImageMessageItem from "@/app/components/ImageMessageItem";
import FileMessageItem from "@/app/components/FileMessageItem";
import PrimaryButton from "@/app/components/PrimaryButton";
import OutlinedButton from "@/app/components/OutlinedButton";
import Cookies from "universal-cookie";
import Message from "@/models/message";
import ImageMessage from "@/models/imageMessage";
import { getData, saveData } from "@/utils/database";
import { decryptMessage } from "@/lib/fetchAndDecryptMessages"; // Import decryptMessage

const cookies = new Cookies();

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function ChatPage({
  initialMessages = [],
  roomName,
  base64RoomKey,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [isCheckingRoom, setIsCheckingRoom] = useState(true);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const oldestTimestampRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  const router = useRouter();
  const params = useParams();
  const roomNameFromParams = params.room;
  const messagesPerPage = 25;

  // Initialize encryption key
  useEffect(() => {
    if (!currentUser || !roomNameFromParams || !base64RoomKey) return;

    const checkRoom = async () => {
      try {
        setIsCheckingRoom(true);
        const roomRef = ref(db, `rooms/${roomNameFromParams}`);
        const snapshot = await getData(`rooms/${roomNameFromParams}`);
        if (!snapshot.exists()) {
          // Room doesn't exist; user is creator
          const key = await crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
          );
          const exportedKey = await crypto.subtle.exportKey("raw", key);
          const base64Key = btoa(
            String.fromCharCode(...new Uint8Array(exportedKey))
          );
          await saveData(
            {
              createdBy: currentUser.uid,
              createdAt: serverTimestamp(),
            },
            `rooms/${roomNameFromParams}`
          );
          setGeneratedKey(base64Key);
          setEncryptionKey(key);
          setShowCreatorModal(true);
        } else {
          // Room exists; use provided base64RoomKey
          const key = await getRoomKey(base64RoomKey);
          setEncryptionKey(key);
          setShowKeyModal(false);
          setKeyError(null);
        }
      } catch (error) {
        console.error("Error checking room:", error);
        setKeyError("Failed to initialize room. Please try again.");
      } finally {
        setIsCheckingRoom(false);
      }
    };

    checkRoom();
  }, [currentUser, roomNameFromParams, base64RoomKey]);

  // Update oldestTimestampRef based on initialMessages
  useEffect(() => {
    if (initialMessages.length > 0) {
      oldestTimestampRef.current = Math.min(
        ...initialMessages.map((m) => m.timestamp)
      );
    }
  }, [initialMessages]);

  // Real-time message subscription
  useEffect(() => {
    if (!currentUser || !encryptionKey || !roomNameFromParams) return;

    const messagesRef = ref(db, `rooms/${roomNameFromParams}/messages`);
    const messagesQuery = query(
      messagesRef,
      orderByChild("timestamp"),
      limitToLast(messagesPerPage)
    );

    const unsubscribe = onChildAdded(
      messagesQuery,
      async (snapshot) => {
        const msg = { ...snapshot.val(), id: snapshot.key };
        if (!msg || !msg.timestamp) {
          console.warn("Invalid message:", msg);
          return;
        }
        if (msg.isEncrypted === true) {
          try {
            if (msg.type === "text") {
              msg.text = await decryptMessage(msg.text, encryptionKey);
            } else if (msg.type === "file") {
              msg.fileName = await decryptMessage(msg.fileName, encryptionKey);
              msg.fileURL = await decryptMessage(msg.fileURL, encryptionKey);
            }
          } catch (error) {
            console.error("Decryption failed:", error);
            msg.decryptionFailed = true;
          }
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const updatedMessages = [...prev, msg].sort(
            (a, b) => a.timestamp - b.timestamp
          );
          localStorage.setItem(
            `messages_${roomNameFromParams}`,
            JSON.stringify(updatedMessages)
          );
          oldestTimestampRef.current = updatedMessages[0]?.timestamp || null;
          return updatedMessages;
        });
      },
      (error) => {
        console.error("Error fetching messages:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser, encryptionKey, roomNameFromParams]);

  // ... (rest of the existing useEffect hooks and functions remain unchanged)

  // Render logic
  if (!currentUser || isCheckingRoom)
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">Loading...</p>
    );

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Existing modals and UI remain unchanged */}
      <div className="fixed top-0 left-0 right-0 z-20 p-4 bg-blue-600 text-white text-lg font-semibold flex justify-between items-center">
        <span>Chat Room: {roomNameFromParams}</span>
        {/* ... existing dropdown code ... */}
      </div>
      <div className="fixed top-16 left-0 right-0 z-10 p-4 bg-gray-100 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
        {/* ... existing online users and typing users code ... */}
      </div>
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 mt-32 mb-20"
      >
        {isLoadingMore && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Loading more messages...
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} data-message-id={msg.id}>
            {msg.decryptionFailed ? (
              <p className="text-red-500 text-sm">
                Unable to decrypt message (incorrect key)
              </p>
            ) : msg.type === "text" ? (
              <MessageItem
                message={msg}
                messages={messages}
                onReply={handleReply}
              />
            ) : msg.type === "file" ? (
              /\.(png|jpe?g|gif|webp)$/i.test(msg.fileName) ? (
                <ImageMessageItem
                  message={msg}
                  messages={messages}
                  onReply={handleReply}
                />
              ) : (
                <FileMessageItem
                  message={msg}
                  messages={messages}
                  onReply={handleReply}
                />
              )
            ) : null}
          </div>
        ))}
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-white dark:bg-gray-800">
        {/* ... existing form and input code ... */}
      </div>
    </div>
  );
}

// Helper function to import key (copied from fetchAndDecryptMessages.ts)
async function getRoomKey(base64Key) {
  const keyBytes = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
}
