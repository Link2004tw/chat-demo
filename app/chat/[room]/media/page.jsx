"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import { ref, onValue, query, orderByChild, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import ImageMessageItem from "@/app/components/ImageMessageItem";
import FileMessageItem from "@/app/components/FileMessageItem";
import OutlinedButton from "@/app/components/OutlinedButton";
import PrimaryButton from "@/app/components/PrimaryButton";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export default function MediaPage() {
  const [mediaMessages, setMediaMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [isCheckingRoom, setIsCheckingRoom] = useState(true);
  const router = useRouter();
  const params = useParams();
  const roomName = params.room;

  // Check if room exists
  useEffect(() => {
    if (!currentUser || !roomName) return;

    const checkRoom = async () => {
      try {
        setIsCheckingRoom(true);
        const roomRef = ref(db, `rooms/${roomName}`);
        const snapshot = await get(roomRef);
        if (!snapshot.exists()) {
          // Room doesn't exist; redirect to ChatPage to create it
          router.push(`/rooms/${roomName}`);
        } else {
          // Room exists; prompt for key
          setShowKeyModal(true);
        }
      } catch (error) {
        console.error("Error checking room:", error);
        setKeyError("Failed to initialize room. Please try again.");
      } finally {
        setIsCheckingRoom(false);
      }
    };

    checkRoom();
  }, [currentUser, roomName, router]);

  const handleKeySubmit = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setKeyError("A valid key is required.");
      return;
    }
    try {
      const key = await getRoomKey(keyInput);
      setEncryptionKey(key);
      setShowKeyModal(false);
      setKeyError(null);
    } catch (error) {
      console.error("Failed to import key:", error);
      setKeyError(error.message);
    }
  };

  const handleReply = (messageId) => {
    router.push(`/rooms/${roomName}?replyTo=${messageId}`);
  };

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

  useEffect(() => {
    if (!currentUser || !roomName || !encryptionKey) return;

    const messagesRef = ref(db, `rooms/${roomName}/messages`);
    const messagesQuery = query(messagesRef, orderByChild("timestamp"));

    const unsubscribe = onValue(
      messagesQuery,
      async (snapshot) => {
        const messages = [];
        snapshot.forEach((childSnapshot) => {
          const msg = { ...childSnapshot.val(), id: childSnapshot.key };
          if (msg && msg.type === "file" && msg.timestamp) {
            messages.push(msg);
          }
        });

        const decryptedMessages = await Promise.all(
          messages.map(async (msg) => {
            if (msg.isEncrypted === true) {
              try {
                msg.fileName = await decryptMessage(
                  msg.fileName,
                  encryptionKey
                );
                msg.fileURL = await decryptMessage(msg.fileURL, encryptionKey);
              } catch (error) {
                console.error("Decryption failed:", error);
                return { ...msg, decryptionFailed: true };
              }
            }
            return msg;
          })
        );

        setMediaMessages(
          decryptedMessages
            .filter((msg) => msg !== null)
            .sort((a, b) => a.timestamp - b.timestamp)
        );
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching media messages:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, roomName, encryptionKey]);

  const handleBackToChat = () => {
    router.push(`/rooms/${roomName}`);
  };

  if (!currentUser || isCheckingRoom)
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">Loading...</p>
    );

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {showKeyModal && !encryptionKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Enter Room Key
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide the base64-encoded key for {roomName} to view
              media.
            </p>
            <form onSubmit={handleKeySubmit}>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none mb-4"
                placeholder="Base64-encoded key"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
              />
              {keyError && (
                <p className="text-red-500 text-sm mb-4">{keyError}</p>
              )}
              <PrimaryButton type="submit" variant="primary" size="md">
                View Media
              </PrimaryButton>
            </form>
          </div>
        </div>
      )}
      <div className="fixed top-0 left-0 right-0 z-20 p-4 bg-blue-600 text-white text-lg font-semibold flex justify-between items-center">
        <span>Media: {roomName}</span>
        <OutlinedButton
          variant="secondary"
          size="sm"
          onClick={handleBackToChat}
        >
          Back to Chat
        </OutlinedButton>
      </div>
      <div className="flex-1 overflow-y-auto p-4 mt-16">
        {isLoading && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Loading media...
          </p>
        )}
        {!isLoading && mediaMessages.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No media found in this room.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaMessages.map((msg) => (
            <div key={msg.id} data-message-id={msg.id}>
              {msg.decryptionFailed ? (
                <p className="text-red-500 text-sm">
                  Unable to decrypt media (incorrect key)
                </p>
              ) : /\.(png|jpe?g|gif|webp)$/i.test(msg.fileName) ? (
                <ImageMessageItem
                  message={msg}
                  messages={mediaMessages}
                  onReply={handleReply}
                />
              ) : (
                <FileMessageItem
                  message={msg}
                  messages={mediaMessages}
                  onReply={handleReply}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
