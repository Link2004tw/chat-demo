// components/chat/ChatHeader.tsx
"use client";

import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { MessageSearch } from './MessageSearch';
import { muteSelf, unmuteSelf } from "@/app/actions/chatsAction";
import { useActionState } from "react";

export default function ChatHeader({
    name,
    isConnected,
    onBack,
    goToMediaPage,
    goToRoomDetails,
    isDm = false,
    typingUsers,
    onlineUsers,
    messages,
    onSearchResult,
    roomId,
    isMutedByUser = false,
}) {
    const onlineUsersArray = Array.from(onlineUsers.values());
    const typingText =
        typingUsers.length === 0
            ? ""
            : typingUsers.length === 1
                ? `${typingUsers[0].username} is typing...`
                : `${typingUsers.map(u => u.username).join(", ")} are typing...`;

    const [muteSelfState, muteSelfAction, isMuteSelfPending] = useActionState(muteSelf, { success: null });
    const [unmuteSelfState, unmuteSelfAction, isUnmuteSelfPending] = useActionState(unmuteSelf, { success: null });

    return (
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-1 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between">
                {/* Left side: Back button + Room name */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-800 active:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="h-6 w-6 text-gray-200" />
                    </button>

                    <div className="flex flex-col">
                        <h1 className="text-lg font-semibold text-gray-200 truncate max-w-[180px] sm:max-w-none">
                            {isDm ? "" : "Room:"} {name}
                        </h1>
                        {typingText && (
                            <span className="text-xs text-green-400 animate-pulse">
                                {typingText}
                            </span>
                        )}
                        {!isDm && onlineUsersArray.length > 0 && (
                            <span className="text-xs text-green-400">
                                {onlineUsersArray.length} online
                            </span>
                        )}
                        {isDm && onlineUsersArray.length === 2 && (
                            <span className="text-xs text-green-400">Online</span>
                        )}
                    </div>
                </div>

                {/* Right side: Search + Mute + Media + Settings + Connection status */}
                <div className="flex items-center gap-2">
                    <MessageSearch
                        messages={messages}
                        onResultClick={onSearchResult}
                    />

                    {/* Mute self toggle */}
                    {!isDm && roomId && (
                        <form action={isMutedByUser ? unmuteSelfAction : muteSelfAction}>
                            <input type="hidden" name="chatId" value={roomId} />
                            <button
                                type="submit"
                                className="p-2 rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600"
                                title={isMutedByUser ? "Unmute notifications" : "Mute notifications"}
                                disabled={isMuteSelfPending || isUnmuteSelfPending}
                            >
                                {isMutedByUser ? "🔕" : "🔔"}
                            </button>
                        </form>
                    )}

                    {!isDm && (
                        <button
                            onClick={goToRoomDetails}
                            className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600"
                            aria-label="Room details"
                            title="Room details"
                        >
                            <Cog6ToothIcon className="h-5 w-5 text-gray-200" />
                            <span className="text-sm font-medium text-gray-200 hidden sm:inline">
                                Details
                            </span>
                        </button>
                    )}

                    <button
                        onClick={goToMediaPage}
                        className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600"
                        aria-label="View media & files"
                        title="Media & Files"
                    >
                        <PhotoIcon className="h-5 w-5 text-gray-200" />
                        <span className="text-sm font-medium text-gray-200 hidden sm:inline">Media</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <span
                            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'
                                } animate-pulse`}
                        />
                        <span className="text-sm font-medium text-gray-200 hidden sm:inline">
                            {isConnected ? 'Online' : 'Connecting...'}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}