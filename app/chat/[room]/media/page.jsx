"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import { ref, onValue, query, orderByChild, get } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
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
        const data = await fetchMedia();
        setMediaMessages(data);
      } catch (error) {
        console.error("Error checking room:", error);
        //setKeyError("Failed to initialize room. Please try again.");
      } finally {
        setIsCheckingRoom(false);
      }
    };

    checkRoom();
  }, [currentUser, roomName, router]);

  const handleReply = (messageId) => {
    router.push(`/chat/${roomName}?replyTo=${messageId}`);
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

  const fetchMedia = async () => {
    const idToken = await getAuth().currentUser.getIdToken();

    const response = await fetch("/api/get-messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`, // Attach token here
      },
      body: JSON.stringify({
        filter: "media",
        roomName,
      }),
    });
    if (!response.ok) {
      alert("Error fetching media");
      router.push(`/chat/${roomName}`);
    }
    const data = await response.json();
    console.log(data);
    return data;
  };

  useEffect(() => {
    if (!currentUser || !roomName) return;
    const fetchMediaHandler = async () => {
      const data = await fetchMedia();
      setMediaMessages(
        data
          .filter((msg) => msg !== null)
          .sort((a, b) => a.timestamp - b.timestamp)
      );
      setIsLoading(false);
    };

    fetchMediaHandler();
  }, [currentUser, roomName]);

  const handleBackToChat = () => {
    router.push(`/chat/${roomName}`);
  };

  if (!currentUser || isCheckingRoom)
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
