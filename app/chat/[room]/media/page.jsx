"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import ImageMessageItem from "@/app/components/Message/ImageMessageItem";
import FileMessageItem from "@/app/components/Message/FileMessageItem";
import OutlinedButton from "@/app/components/UI/OutlinedButton";
import { debugLog } from '@/lib/logger';

// Optional: define a minimal message type (improve as you go)

export default function MediaPage() {
  const [mediaMessages, setMediaMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const params = useParams();
  const roomName = params.room;
  debugLog(roomName);

  // 2. Fetch media once we know user is (probably) logged in
  useEffect(() => {
    if (!roomName) return;

    let isCurrent = true;

    const fetchMedia = async () => {
      try {
        setIsLoading(true);


        const res = await fetch(`/api/chat/${roomName}/media`, {
          method: "GET",
        });

        if (!res.ok) {
          throw new Error(`Server responded ${res.status}`);
        }

        const data = await res.json();
        //debugLog(data);
        // Expecting array – adjust parsing if your API returns { messages: [...] }
        const messages = data;
        //debugLog(messages)
        const filteredAndSorted = messages
          .filter((msg) => msg && msg._id && msg.createdAt)
          .sort((a, b) => a.createdAt - b.createdAt);

        if (isCurrent) {
          setMediaMessages(filteredAndSorted);
        }
      } catch (err) {
        console.error("Failed to load media:", err);
        // Optional: add error UI / toast later
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    fetchMedia();

    return () => {
      isCurrent = false;
    };
  }, [roomName, router]);

  const handleReply = (m) => {
    if (roomName) {
      //debugLog(m._id);
      router.push(`/chat/${roomName}?replyTo=${m._id}`);
    }
  };

  const handleBack = () => {
    if (roomName) {
      router.push(`/chat/${roomName}`);
    }
  };


  if (!roomName) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500 dark:text-gray-400">
        Redirecting...
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between bg-blue-600 p-4 text-lg font-semibold text-white">
        <span>Media: {roomName}</span>
        <OutlinedButton variant="secondary" size="sm" onClick={handleBack}>
          Back to Chat
        </OutlinedButton>
      </div>

      {/* Content */}
      <div className="mt-16 flex-1 overflow-y-auto p-4">
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

        {!isLoading && mediaMessages.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {mediaMessages.map((msg) => (
              <div key={msg._id} data-message-id={msg._id}>
                {msg.decryptionFailed ? (
                  <p className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
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
        )}
      </div>
    </div>
  );
}