// Example: components/Header.tsx or in layout
'use client';

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function Header() {
    return (
        <header className="bg-gray-900 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                <Link href="/chat" className="text-xl font-bold text-indigo-400">
                    ChatApp
                </Link>

                <div className="flex items-center gap-4">
                    {/* Your other nav items */}
                    <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                            elements: {
                                avatarBox: "w-9 h-9",
                                userPreviewMainIdentifier: "text-gray-200",
                            }
                        }}
                    />
                </div>
            </div>
        </header>
    );
}