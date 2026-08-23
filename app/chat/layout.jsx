// app/chat/layout.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatSidebar from '../components/chat/ChatSideBar';

export default function ChatLayout({
    children,
}) {
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;

        setIsChecking(false);

        // Only redirect if we are sure the user is NOT signed in
        if (!isSignedIn) {
            // Preserve the current path so we can return after login
            const redirectUrl = `/sign-in?redirect=${encodeURIComponent(pathname)}`;
            router.replace(redirectUrl);
        }
    }, [isLoaded, isSignedIn, pathname, router]);

    // Show loading while Clerk is checking auth state
    if (isChecking || !isLoaded) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-950 text-gray-400">
                Checking session...
            </div>
        );
    }

    // If not signed in → don't render anything (middleware already 401'd APIs)
    if (!isSignedIn) {
        return null;
    }

    return (
        <div className="h-screen flex overflow-hidden bg-gray-950">
            {/* Sidebar – fixed width */}
            <aside className="w-80 border-r border-gray-800 bg-gray-900 flex flex-col">
                <ChatSidebar />
            </aside>

            {/* Main content area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {children}
            </main>
        </div>
    );
}