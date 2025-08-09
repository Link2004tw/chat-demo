"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/config/firebase";
import {
  ref,
  onValue,
  query,
  orderByChild,
  limitToLast,
  endBefore,
  get,
  serverTimestamp,
  onChildAdded,
} from "firebase/database";

import {
  ArrowUpTrayIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import MessageItem from "@/app/components/MessageItem";
import ImageMessageItem from "@/app/components/ImageMessageItem";
import FileMessageItem from "@/app/components/FileMessageItem";
import PrimaryButton from "@/app/components/PrimaryButton";
import OutlinedButton from "@/app/components/OutlinedButton";
import Message from "@/models/message";
import ImageMessage from "@/models/imageMessage";
import { saveData } from "@/utils/database";
import { EventSourcePolyfill } from "event-source-polyfill";

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const oldestTimestampRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  const eventSourceRef = useRef(null);

  const router = useRouter();
  const params = useParams();
  const roomName = params.room;
  const messagesPerPage = 25;
  const searchParams = useSearchParams();
  const [replyToId, setReplyToId] = useState(searchParams.get("replyTo"));

  const scrollToBottom = (behavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (container && messages.length > 0) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    }
  };

  const updateTypingStatus = debounce(() => {
    if (!currentUser || !input.trim()) return;
    saveData(
      {
        uid: currentUser.uid,
        displayName: currentUser.displayName || "Anonymous",
        timestamp: Date.now(),
      },
      `rooms/${roomName}/typingUsers/${currentUser.uid}`,
      "set"
    );
  }, 500);

  const handleReply = (messageId) => {
    setReplyToId(messageId);
    const inputElement = document.querySelector('input[type="text"]');
    if (inputElement) inputElement.focus();
  };

  const cancelReply = () => {
    setReplyToId(null);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function connectMessageStream(roomName) {
    const token = await auth.currentUser.getIdToken();

    const response = await fetch(
      `/api/messages/stream?room=${encodeURIComponent(roomName)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
      }
    );

    if (!response.ok) {
      console.error("SSE connection failed:", response.statusText);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const message = JSON.parse(line.slice(6));
            console.log("New message:", message);
            // Update your state here
          } catch (err) {
            console.error("Invalid SSE message:", err);
          }
        }
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        const idToken = await user.getIdToken();
        const response = await fetch("/api/get-messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`, // Attach token here
          },
          body: JSON.stringify({ roomName }),
        });
        //console.log(response);

        if (!response.ok) throw new Error("Failed to fetch messages");

        const data = await response.json();
        console.log(data);
        setMessages(data || []);
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router, roomName]);

  useEffect(() => {
    if (!currentUser) return;

    const cachedMessages = localStorage.getItem(`messages_${roomName}`);
    if (cachedMessages) {
      const parsedMessages = JSON.parse(cachedMessages);
      Promise.all(
        parsedMessages.map(async (msg) => {
          return msg;
        })
      ).then((msgs) => {
        setMessages(msgs);
        if (msgs.length > 0) {
          oldestTimestampRef.current = Math.min(
            ...msgs.map((m) => m.timestamp)
          );
        }
      });
    }
    const messagesRef = ref(db, `rooms/${roomName}/messages`);

    const unsubscribe = onChildAdded(
      messagesRef,
      async (snapshot) => {
        const msg = { ...snapshot.val(), id: snapshot.key };
        if (!msg || !msg.timestamp) {
          console.warn("Invalid message:", msg);
          return;
        }
        const idToken = await auth.currentUser.getIdToken();
        try {
          const response = await fetch("/api/get-message", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`, // Attach token here
            },
            body: JSON.stringify({
              message: msg,
            }),
          });
          if (msg.type === "text") {
            msg.text = (await response.json()).text;
          } else if (msg.type === "file") {
            const data = await response.json();
            msg.fileName = data.fileName;
            msg.fileURL = data.fileURL;
          }
        } catch (error) {
          console.log("fetching failed: ", error);
          return; // Skip this message
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const updatedMessages = [...prev, msg].sort(
            (a, b) => a.timestamp - b.timestamp
          );
          localStorage.setItem(
            `messages_${roomName}`,
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

    return () => {
      unsubscribe();
    };
  }, [currentUser, roomName]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (isInitialLoad && messages.length > 0) {
      scrollToBottom("auto");
      setIsInitialLoad(false);
    } else {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;
      if (isNearBottom && messages.length > 0) {
        scrollToBottom("smooth");
      }
    }
  }, [messages, isInitialLoad]);

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
            const updatedMessages = [...prev, ...prev].sort(
              (a, b) => a.timestamp - b.timestamp
            );
            localStorage.setItem(
              `messages_${roomName}`,
              JSON.stringify(updatedMessages)
            );
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
  }, [currentUser, isLoadingMore, hasMoreMessages, roomName]);

  useEffect(() => {
    if (!currentUser) return;

    const userRef = `rooms/${roomName}/onlineUsers/${currentUser.uid}`;
    const updatePresence = () =>
      saveData(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || "Anonymous",
          lastSeen: serverTimestamp(),
        },
        userRef,
        "set"
      );

    updatePresence();
    const interval = setInterval(updatePresence, 30000);

    const handleUnload = () => {
      if (currentUser?.uid) {
        navigator.sendBeacon(
          "/api/remove-user",
          JSON.stringify({ room: roomName, uid: currentUser.uid })
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      saveData(null, userRef, "set").catch((error) => {
        console.error("Error removing user on cleanup:", error);
      });
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [currentUser, roomName]);

  //online users
  useEffect(() => {
    const onlineUsersRef = ref(db, `rooms/${roomName}/onlineUsers`);
    const unsubscribe = onValue(
      onlineUsersRef,
      (snapshot) => {
        const users = snapshot.val() || {};
        const now = serverTimestamp();
        const activeUsers = Object.values(users)
          .filter(
            (user) => user && user.lastSeen && now - user.lastSeen < 20000
          )
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
  }, [roomName]);

  //typing
  useEffect(() => {
    if (!currentUser) return;

    const typingRef = ref(db, `rooms/${roomName}/typingUsers`);
    const unsubscribe = onValue(
      typingRef,
      (snapshot) => {
        const typingData = snapshot.val() || {};
        const now = Date.now();
        const activeTypers = Object.values(typingData)
          .filter(
            (user) => user && user.timestamp && now - user.timestamp < 5000
          )
          .map((user) => ({
            uid: user.uid,
            displayName: user.displayName,
          }))
          .filter((user) => user.uid !== currentUser.uid);
        setTypingUsers(activeTypers);
      },
      (error) => {
        console.error("Error fetching typing users:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser, roomName]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (e.target.value.trim()) {
      updateTypingStatus();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        saveData(
          null,
          `rooms/${roomName}/typingUsers/${currentUser.uid}`,
          "set"
        );
      }, 5000);
    } else {
      saveData(null, `rooms/${roomName}/typingUsers/${currentUser.uid}`, "set");
    }
  };

  useEffect(() => {
    return () => {
      if (currentUser) {
        saveData(
          null,
          `rooms/${roomName}/typingUsers/${currentUser.uid}`,
          "set"
        );
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    };
  }, [currentUser, roomName]);

  if (!currentUser) return <p>Loading...</p>;
  //this is for text only
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message = new Message({
      text: input,
      user: currentUser.displayName || "Anonymous",
      userUid: currentUser.uid,
      timestamp: serverTimestamp(),
      replyTo: replyToId,
      isEncrypted: true,
    });
    const formData = new FormData();
    formData.append("message", JSON.stringify(message.toRTDB()));
    formData.append("roomName", roomName);

    try {
      const token = await auth.currentUser.getIdToken();

      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      console.log(await response.json());

      //await saveData(message.toRTDB(), `rooms/${roomName}/messages`, "push");
      setInput("");
      setReplyToId(null);
      saveData(null, `rooms/${roomName}/typingUsers/${currentUser.uid}`, "set");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    }
  };

  const handleUpload = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

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

      const isImage = file.type.startsWith("image/");
      const uploadType = isImage ? "image" : "auto";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `rooms/${roomName}`);
      const encryptedFileName = "";
      const encryptedFileURL = "";
      const message = new ImageMessage({
        user: currentUser.displayName || "Anonymous",
        userUid: currentUser.uid,
        fileName: encryptedFileName,
        fileURL: encryptedFileURL,
        timestamp: serverTimestamp(),
        replyTo: replyToId,
        isEncrypted: true,
      });
      formData.append("message", JSON.stringify(message.toRTDB()));
      formData.append("roomName", roomName);
      const idToken = await getAuth().currentUser.getIdToken();
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`, // Attach token here
        },
        body: formData,
      });
      console.log(res);
      //await saveData(message.toRTDB(), `rooms/${roomName}/messages`, "push");

      setReplyToId(null);
      fileInputRef.current.value = "";
    } catch (error) {
      console.error("File upload failed:", error);
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSignOut = async () => {
    const userRef = `rooms/${roomName}/onlineUsers/${currentUser.uid}`;
    const typingRef = `rooms/${roomName}/typingUsers/${currentUser.uid}`;
    try {
      await Promise.all([
        saveData(null, userRef, "set"),
        saveData(null, typingRef, "set"),
      ]);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out.");
    }
  };

  const repliedMessage = replyToId
    ? messages.find((msg) => msg.id === replyToId)
    : null;

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <div className="fixed top-0 left-0 right-0 z-20 p-4 bg-blue-600 text-white text-lg font-semibold flex justify-between items-center">
        <span>Chat Room: {roomName}</span>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="p-2 text-white hover:bg-blue-700 rounded-full"
            aria-label="Open room options"
            aria-expanded={isDropdownOpen}
          >
            <EllipsisVerticalIcon className="h-6 w-6" />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-30">
              <button
                onClick={() => {
                  router.push(`/chat/${roomName}/media`);
                  setIsDropdownOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Media
              </button>
              <button
                onClick={() => {
                  handleSignOut();
                  setIsDropdownOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Leave Room
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="fixed top-16 left-0 right-0 z-10 p-4 bg-gray-100 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
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
        {typingUsers.length > 0 && (
          <div className="mt-2">
            <h2 className="font-semibold mb-1">Typing...</h2>
            <ul className="flex gap-2 flex-wrap">
              {typingUsers.map((user) => (
                <li
                  key={user.uid}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-xs"
                >
                  {user.displayName}
                </li>
              ))}
            </ul>
          </div>
        )}
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
            {msg.type === "text" ? (
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
        {repliedMessage && (
          <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-sm flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                Replying to {repliedMessage.user}
              </p>
              <p className="truncate text-gray-600 dark:text-gray-400">
                {repliedMessage.text || repliedMessage.fileName || "Message"}
              </p>
            </div>
            <button
              onClick={cancelReply}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              aria-label="Cancel reply"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
            placeholder="Type your message..."
            value={input}
            onChange={handleInputChange}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <OutlinedButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleUpload}
            disabled={isUploading}
            aria-label="Upload file"
          >
            {isUploading ? (
              <span>Uploading...</span>
            ) : (
              <ArrowUpTrayIcon className="h-5 w-5" />
            )}
          </OutlinedButton>
          <PrimaryButton
            type="submit"
            variant="primary"
            size="sm"
            disabled={!input.trim()}
          >
            Send
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
