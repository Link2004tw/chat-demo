// components/ChatHeader.tsx – simplified version
'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function EnterRoomHeader() {
    const { user } = useUser();

    return (
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Left */}
                <Link
                    href="/chat"
                    className="text-xl font-bold text-indigo-400 hover:text-indigo-300 transition"
                >
                    ChatApp
                </Link>

                {/* Right – only one avatar */}
                {user && (
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 hover:opacity-80 transition"
                        title="Go to profile"
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 border-2 border-indigo-500/40">
                            {user.imageUrl ? (
                                <img
                                    src={user.imageUrl}
                                    alt={user.firstName || 'Profile'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium text-lg">
                                    {user.firstName?.[0] || user.username?.[0] || '?'}
                                </div>
                            )}
                        </div>

                        <div className="hidden sm:flex flex-col">
                            <span className="text-sm font-medium text-gray-200">
                                {user.firstName || user.username || 'You'}
                            </span>
                            <span className="text-xs text-gray-500">
                                Profile
                            </span>
                        </div>
                    </Link>
                )}
            </div>
        </header>
    );
}