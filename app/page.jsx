"use client";

import { useState, useEffect, useRef } from "react";
import Cookies from "universal-cookie";
import Auth from "./components/Auth";
import EnterRoomPage from "./components/EnterRoomPage";
import { auth } from "@/config/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

const cookies = new Cookies();

export default function HomePage() {
  const [isAuth, setIsAuth] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const token = cookies.get("auth-token");
      if (user) {
        console.log("oli fi eh eh ");
        setIsAuth(true);
        setCurrentUser(user);
      } else {
        setIsAuth(false);
        setCurrentUser(null);
        cookies.remove("auth-token", { path: "/" });
        cookies.remove("last-room", { path: "/" });
      }
    });
    return () => unsubscribe();
  }, [cookies.get("auth-token")]);

  if (isAuth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Auth setAuth={setIsAuth} />
      </div>
    );
  }

  return (
    <EnterRoomPage
      currentUser={currentUser}
      router={router}
      setIsAuth={setIsAuth}
    />
  );
}
