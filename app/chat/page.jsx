// app/chat/page.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import EnterRoomPage from "../components/EnterRoom/EnterRoomPage";
import EnterRoomHeader from "../components/EnterRoom/EnterRoomHeader";

export default function ChatPage() {
    const { isLoaded, isSignedIn, user } = useUser();

    if (!isLoaded) {
        return (
            <div className="min-h-screen grid place-items-center bg-gray-950 text-gray-200">
                Loading...
            </div>
        );
    }

    if (!isSignedIn) {
        redirect("/sign-in");
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
            <EnterRoomHeader /> {/* ← added here */}

            <main className="flex-1 overflow-hidden">
                {/* <EnterRoomPage currentUser={user} /> */}
            </main>
        </div>
    );
}