"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import { ref, onValue, query, orderByChild } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import ImageMessageItem from "@/app/components/ImageMessageItem";
import FileMessageItem from "@/app/components/FileMessageItem";
import OutlinedButton from "@/app/components/OutlinedButton";
import Cookies from "universal-cookie";
import { decryptMessage, getRoomKey } from "@/utils/crypto";

const cookies = new Cookies();

export default function MediaPage() {
  const [mediaMessages, setMediaMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const router = useRouter();
  const params = useParams();
  const roomName = params.room;

  useEffect(() => {
    getRoomKey(roomName)
      .then((key) => setEncryptionKey(key))
      .catch((error) => {
        console.error("Failed to get encryption key:", error);
        alert("Encryption key setup failed. Media cannot be decrypted.");
      });
  }, [roomName]);

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
            if (msg.isEncrypted) {
              try {
                msg.fileName = await decryptMessage(
                  msg.fileName,
                  encryptionKey
                );
                msg.fileURL = await decryptMessage(msg.fileURL, encryptionKey);
              } catch (error) {
                console.error("Decryption failed:", error);
                return null; // Skip invalid messages
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

  if (!currentUser || !encryptionKey)
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">Loading...</p>
    );

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
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
              {/\.(png|jpe?g|gif|webp)$/i.test(msg.fileName) ? (
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
