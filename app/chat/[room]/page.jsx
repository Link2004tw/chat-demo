// app/chat/[room]/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import ChatHeader from "@/app/components/chat/ChatHeader";
import MessagesList from "@/app/components/chat/ChatMessageList";
import ChatInput from "@/app/components/chat/ChatInput";
import { normalizeMessage } from "@/app/components/chat/HelperFunctions";
const LIMIT = 30;
import { useWebSocket } from "@/app/hooks/useWebSocket";
import RoomDetailsSheet from "@/app/components/chat/Settings/SettingsSheets";
import { useChats } from "@/app/store/chat-context";
import AdminOnlyFooter from "@/app/components/chat/AdminOnlyFooter";
import { debugLog } from '@/lib/logger';

export function useDebounce(callback, delay) {
  const timeout = useRef(null);

  return useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(callback, delay);
  }, [callback, delay]);
}

export default function ChatPage() {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth();
  const { room } = useParams();
  const roomId = room;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [beforeCursor, setBeforeCursor] = useState(null);
  const [name, setName] = useState("Chat Room");
  const [token, setToken] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const {
    isConnected,
    sendMessage,
    subscribeToMessages,
    sendFile,
    deleteMessage,
    editMessage,
    sendTyping,
    onlineUsers,
  } = useWebSocket(roomId, token, isSignedIn);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const { markChatAsRead } = useChats();
  const [isDm, setIsDm] = useState(false);
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const router = useRouter();
  const [canSendMessages, setCanSendMessages] = useState();
  const [participants, setParticipants] = useState([]);

  const handleDeleteMessage = (messageId) => {
    setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    deleteMessage(messageId);
    // Also send delete via WebSocket
  };
  function showTypingIndicator(userId, username) {
    setTypingUsers((prev) => {
      if (prev.some((u) => u.userId === userId)) return prev; // already shown
      return [...prev, { userId, username }];
    });

    // Remove after 2 seconds of inactivity
    setTimeout(() => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    }, 2000);
  }

  const fetchMessages = useCallback(
    async (loadMore = false) => {
      if (!isLoaded || !isSignedIn || !roomId) return;

      if (loadMore) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({ limit: LIMIT.toString() });

        if (loadMore && beforeCursor) {
          params.append("before", beforeCursor);
        }

        const res = await fetch(`/api/chat/${roomId}/messages?${params}`);

        if (!res.ok) {
          if (res.status === 404) {
            setName("Room not found");
            setHasMore(false);
            return;
          }
          throw new Error("Failed to load messages");
        }
        const d = await res.json();
        debugLog(d);
        const {
          messages: newMessages,
          name: roomName,
          more,
          nextCursor,
          isDm: isdm,
          canSendMessages,
        } = d;
        setName(roomName || "Chat Room");
        setHasMore(more);
        setBeforeCursor(nextCursor);
        setIsDm(isdm);
        setCanSendMessages(canSendMessages);

        const normalized = newMessages.map(normalizeMessage);

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const filteredNew = normalized.filter((m) => !existingIds.has(m._id));
          const combined = [...prev, ...filteredNew];

          return combined.sort(
            (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
          );
        });

        setHasMore(newMessages.length === LIMIT);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [roomId, isLoaded, isSignedIn, beforeCursor],
  );

  useEffect(() => {
    const r = params.get("replyTo");
    if (r) {
      const msg = messages.find((m) => m._id === r);
      if (msg) {
        setReplyingTo(msg);
      }
    }
  }, [params.get("replyTo"), messages]);

  // Reset state when room changes
  useEffect(() => {
    setMessages([]);
    setBeforeCursor(null);
    setHasMore(true);
    setLoading(true);
    if (roomId) markChatAsRead(roomId);
  }, [roomId, markChatAsRead]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      getToken().then(setToken);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (!subscribeToMessages) return;

    const unsubscribe = subscribeToMessages((incomingMsg) => {
      if (incomingMsg.type === "typing") {
        showTypingIndicator(incomingMsg.userId, incomingMsg.username);
        return;
      }
      if (incomingMsg.type === "room-update") {
        markChatAsRead(roomId);
        setMessages((prev) => {
          if (prev.some((m) => m._id === incomingMsg._id)) return prev;
          return [...prev, normalizeMessage(incomingMsg)].sort(
            (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
          );
        });
        debugLog("room update: ", incomingMsg);
        if (incomingMsg.name) {
          setName(incomingMsg.name);
        }
        return;
      }
      setMessages((prev) => {
        const normalized = normalizeMessage(incomingMsg);

        switch (normalized.type) {
          case "message":
            markChatAsRead(roomId);
            if (prev.some((m) => m._id === normalized._id)) return prev;
            return [...prev, normalized].sort(
              (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
            );

          case "edit":
            markChatAsRead(roomId);
            return prev.map((m) =>
              m._id === normalized.messageId
                ? { ...m, content: normalized.content, isEdited: true }
                : m,
            );
          case "kick":
            markChatAsRead(roomId);
            if (prev.some((m) => m._id === normalized._id)) return prev;
            debugLog(normalized);
            normalized.contentType = "system";
            return [...prev, normalized].sort(
              (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
            );
          case "leave-chat":
            markChatAsRead(roomId);
            if (prev.some((m) => m._id === normalized._id)) return prev;
            debugLog(normalized);
            normalized.contentType = "system";
            return [...prev, normalized].sort(
              (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
            );
          case "invited":
            markChatAsRead(roomId);
            if (prev.some((m) => m._id === normalized._id)) return prev;
            debugLog(normalized);
            normalized.contentType = "system";
            return [...prev, normalized].sort(
              (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
            );
          case "delete":
            markChatAsRead(roomId);
            return prev.filter((m) => m._id !== normalized.messageId);

          default:
            return prev;
        }
      });
    });

    return () => unsubscribe();
  }, [subscribeToMessages]);

  // Load initial messages
  useEffect(() => {
    if (isLoaded && isSignedIn && roomId) {
      fetchMessages(false);
    }
  }, [isLoaded, isSignedIn, roomId, token]);

  useEffect(() => {
    if (!roomId) return;
    fetch(`/api/chat/${roomId}/info`)
      .then((r) => r.json())
      .then((data) => setParticipants(data.participants || []))
      .catch(() => {});
  }, [roomId]);

  const goToMediaPage = () => {
    router.push(`/chat/${roomId}/media`);
  };
  const handleSearchResult = (messageId) => {
    debugLog(messageId);
    setHighlightedMessageId(messageId);
    // Clear highlight after 2 seconds
    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2500);
  };

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchMessages(true);
    }
  }, [fetchMessages, loadingMore, hasMore]);

  if (!isLoaded || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading chat...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center">
        Please sign in
      </div>
    );
  }

  const isMutedByUser = participants.some((p) => p.user._id === userId && p.mutedByUser);

  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900 overflow-y-auto ">
      <ChatHeader
        onlineUsers={onlineUsers}
        typingUsers={typingUsers}
        isDm={isDm}
        goToMediaPage={goToMediaPage}
        isConnected={isConnected}
        name={name}
        onBack={() => router.push("/")}
        goToRoomDetails={() => setOpen(true)}
        messages={messages}
        onSearchResult={handleSearchResult}
        roomId={roomId}
        isMutedByUser={isMutedByUser}
      />
      <RoomDetailsSheet
        open={open}
        onOpenChange={setOpen}
        roomId={roomId}
        onNameChange={setName}
        onParticipantsChange={() => {
          fetch(`/api/chat/${roomId}/info`)
            .then((r) => r.json())
            .then((data) => setParticipants(data.participants || []))
            .catch(() => {});
        }}
      />
      <MessagesList
        messages={messages}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        userId={userId}
        onLoadMore={handleLoadMore}
        onReply={setReplyingTo}
        onDelete={handleDeleteMessage}
        onEdit={editMessage}
        highlightedMessageId={highlightedMessageId}
        onHighlightClear={() => setHighlightedMessageId(null)}
      />

      {canSendMessages === "admins" ? (
        <AdminOnlyFooter />
      ) : (
        <ChatInput
          sendMessage={(content) => {
            sendMessage(content, replyingTo?._id);
          }}
          sendFile={sendFile}
          isConnected={isConnected}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          onTyping={sendTyping}
        />
      )}
    </div>
  );
}
