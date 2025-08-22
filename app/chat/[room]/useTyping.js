"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { serverTimestamp } from "firebase/firestore";
import { saveData } from "@/app/lib/firebase/firestore";

export const useTypingDebounce = (callback, delay, deps) => {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, deps);
};

// 2. Optimized typing status management
export const useTypingStatus = (currentUser, roomName) => {
  const [isTyping, setIsTyping] = useState(false);
  const lastTypingRef = useRef(0);
  const typingTimeoutRef = useRef(null);
  const stopTypingTimeoutRef = useRef(null);

  const startTyping = useCallback(() => {
    if (!currentUser || isTyping) return;

    const now = Date.now();
    // Only send typing indicator if it's been more than 2 seconds since last one
    if (now - lastTypingRef.current < 2000) return;

    setIsTyping(true);
    lastTypingRef.current = now;

    saveData(
      {
        uid: currentUser.uid,
        displayName: currentUser.displayName || "Anonymous",
        timestamp: serverTimestamp(),
      },
      `rooms/${roomName}/typingUsers/${currentUser.uid}`,
      "set"
    );
  }, [currentUser, roomName, isTyping]);

  const stopTyping = useCallback(() => {
    if (!currentUser || !isTyping) return;

    setIsTyping(false);
    saveData(null, `rooms/${roomName}/typingUsers/${currentUser.uid}`, "set");
  }, [currentUser, roomName, isTyping]);

  // Debounced start typing (while user is actively typing)
  const debouncedStartTyping = useTypingDebounce(startTyping, 300, [
    startTyping,
  ]);

  // Debounced stop typing (when user stops typing)
  const debouncedStopTyping = useTypingDebounce(stopTyping, 3000, [stopTyping]);

  const handleTyping = useCallback(() => {
    debouncedStartTyping();
    debouncedStopTyping();
  }, [debouncedStartTyping, debouncedStopTyping]);

  const handleStopTyping = useCallback(() => {
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }
    stopTyping();
  }, [stopTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (stopTypingTimeoutRef.current)
        clearTimeout(stopTypingTimeoutRef.current);
      if (currentUser) {
        saveData(
          null,
          `rooms/${roomName}/typingUsers/${currentUser.uid}`,
          "set"
        );
      }
    };
  }, [currentUser, roomName]);

  return { handleTyping, handleStopTyping };
};
