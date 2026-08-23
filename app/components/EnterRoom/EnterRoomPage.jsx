"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";

import PrimaryButton from "../UI/PrimaryButton";
import OutlinedButton from "../UI/OutlinedButton";
import Card from "../UI/Card";
import TextInput from "../UI/TextInput";
import { createChatAction, createDm } from "../../actions/chatsAction";

export default function EnterRoomPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Load recent chats from your backend
  const fetchRecentChats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat/proxy");
      if (res.ok) {
        const chats = await res.json();
        setRecentChats(chats);
        localStorage.setItem("recentChats", JSON.stringify(chats));
      }
    } catch (err) {
      const stored = localStorage.getItem("recentChats");
      if (stored) setRecentChats(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentChats();
  }, []);

  // Save to recent list (max 8)
  const updateRecentChats = (newChat) => {
    setRecentChats((prev) => {
      const updated = [newChat, ...prev.filter((c) => c._id !== newChat._id)].slice(0, 8);
      localStorage.setItem("recentChats", JSON.stringify(updated));
      return updated;
    });
  };

  // Main handler – decides group or DM
  const handleSubmit = async () => {
    const value = inputRef.current?.value?.trim();
    if (!value) return alert("Please enter a room name or username");

    if (!isLoaded || !user) return alert("Please wait...");

    setLoading(true);

    try {
      // CASE 1: DM (username without @)
      // You can change to require @ if you prefer
      const isDmRequest = !value.includes(" ") && value.length <= 30;

      if (isDmRequest) {
        // Step 1: Find the user by username
        const searchRes = await fetch(`/api/users/search?username=${encodeURIComponent(value)}`);
        if (!searchRes.ok) throw new Error("User not found");

        const users = await searchRes.json();
        const targetUser = users[0];
        if (!targetUser) throw new Error("User not found");

        // Step 2: Use your createDm function
        const result = await createDm(targetUser.clerkId);

        if (!result.success || !result.chatId) {
          throw new Error(result.error || "Failed to start DM");
        }

        // Fake chat object for recent list (we don't have full data, but it's enough)
        const dmChat = {
          _id: result.chatId,
          name: null,
          isGroup: false,
          otherUser: {
            name: targetUser.firstName || targetUser.username,
            imageUrl: targetUser.imageUrl,
          },
        };

        updateRecentChats(dmChat);
        router.push(`/chat/${result.chatId}`);
        return;
      }

      // CASE 2: Group chat (original behavior)
      const roomName = value;

      const res = await fetch(`/api/chat/${encodeURIComponent(roomName)}`);
      let targetChat;

      if (res.ok) {
        targetChat = await res.json();
      }

      if (!targetChat) {
        const createRes = await createChatAction(roomName);
        if (!createRes.ok) {
          const err = await createRes.json();
          throw new Error(err.message || "Failed to create chat");
        }
        targetChat = await createRes.json();
      }

      updateRecentChats(targetChat);
      router.push(`/chat/${targetChat._id}`);
    } catch (error) {
      console.error(error);
      alert(error.message || "Something went wrong");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRecentClick = (chat) => {
    router.push(`/chat/${chat._id}`);
  };

  const handleSignOut = async () => {
    await signOut();
    localStorage.removeItem("recentChats");
    router.push("/");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <Card title="Join or Start a Chat" className="p-8 w-full max-w-md">
        <div className="flex flex-col gap-6 mt-4">
          <TextInput
            ref={inputRef}
            placeholder="Room name (e.g. Gaming) or username for DM"
            disabled={loading}
            className="w-full"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />


          {/* Recent chats */}
          {recentChats.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Recent:</p>
              <div className="flex flex-wrap gap-2">
                {recentChats.map((chat) => (
                  <OutlinedButton
                    key={chat._id}
                    onClick={() => handleRecentClick(chat)}
                    disabled={loading}
                    className="text-sm"
                  >
                    {chat.isGroup
                      ? chat.name || "Unnamed Group"
                      : chat.otherUser?.name || "DM"}
                  </OutlinedButton>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <PrimaryButton onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "Loading..." : "Go"}
            </PrimaryButton>

            <PrimaryButton
              onClick={handleSignOut}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Sign Out
            </PrimaryButton>
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Signed in as <strong>{user?.username || user?.firstName}</strong>
          </p>
        </div>
      </Card>
    </div>
  );
}