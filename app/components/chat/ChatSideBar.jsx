// components/chat/ChatSidebar.tsx
'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { createChat, createDm, createDmForm } from '@/app/actions/chatsAction';// from '@/actions/chat.actions';
import TextInput from '../UI/TextInput'; //from '@/components/TextInput'; // your component
import Link from 'next/link';
import PrimaryButton from '../UI/PrimaryButton';
import SearchItem from '@/components/search/SearchItem';
import IconButton from '../UI/IconButton';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { useChats } from '@/app/store/chat-context';
import { SearchIcon } from 'lucide-react';
import { debugLog } from '@/lib/logger';

export default function ChatSidebar() {
    const { user } = useUser();
    const { signOut } = useClerk();
    const router = useRouter();
    const { chats, chatLoaded, refreshChats, markChatAsRead, chatUpdates } = useChats();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [createDmState, createDmAction, isPendingDm] = useActionState(createDmForm, {
        message: "",
        success: false,
        error: "",
    });
    const navigateToFriendsPage = () => {
        router.push('/friends');
    };
    const navigateToBrowsePage = () => {
        router.push('/chat/browse');
    };
    useEffect(() => {
        if (!chatLoaded) {
            refreshChats();
        }

    }, [chatLoaded, refreshChats]);


    useEffect(() => {
        //debugLog("🔍 createDmState changed:", createDmState);

        if (createDmState.success) {
            //debugLog("✅ DM created successfully, refreshing chats...");
            refreshChats().then(() => {
                debugLog("✅ Chats refreshed, new count:", chats.length);
                router.push(`/chat/${createDmState.chatId}`);
            });

            setSearchQuery('');
            setSearchResults([]);
        }
        else if (createDmState.error) {
            console.error("❌ Error creating DM:", createDmState.error);
        }
    }, [createDmState.success]);

    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const users = await res.json();
                    setSearchResults(users);
                }
            } catch (err) {
                console.error(err);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const handleChatClick = (chatId) => {
        // Mark chat as read when user clicks on it
        markChatAsRead(chatId);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header / Search */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex gap-2 justify-between items-center mb-2">
                    <p className="text-lg font-semibold">Chat App</p>
                    <div className="flex gap-2">
                        <IconButton icon={UserPlusIcon} label="Back" onClick={navigateToFriendsPage} />
                        <IconButton icon={SearchIcon} label="Back" onClick={navigateToBrowsePage} />
                    </div>
                </div>
                <TextInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search or start new chat..."
                    className="w-full"
                />
                <PrimaryButton onClick={() => router.push('/chat/new')} className="w-full">
                    Create a Room
                </PrimaryButton>
                {/* {showModal && <MakeRoomModal action={createRoomAction} isLoading={isPending} onClose={() => setShowModal(false)} />} */}

                {/* Search results dropdown */}
                {searchResults.length > 0 && (
                    <div className="mt-2 bg-gray-800 border border-gray-700 rounded-lg max-h-64 overflow-y-auto shadow-xl">
                        {searchResults.map((u) => (
                            <SearchItem
                                key={u.userId}
                                user={u}
                                action={createDmAction}
                                isPending={isPendingDm}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-2">
                {!chatLoaded ? (
                    <div className="text-center text-gray-500 py-10">Loading chats...</div>
                ) : chats.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">No chats yet</div>
                ) : (
                    chats.map((chat) => {
                        const unreadCount = chat.unreadCount;
                        //const lastMessage = chatUpdates.get(chat._id)?.lastMessage || chat.lastMessage;
                        //debugLog("unreadCount:", unreadCount);
                        return (
                            <Link
                                key={chat._id}
                                href={`/chat/${chat._id}`}
                                onClick={() => handleChatClick(chat._id)}
                                className="block p-3 hover:bg-gray-800 rounded-lg transition mb-1"
                            >
                                <div className="flex items-center gap-3">
                                    {chat.access !== "direct" ? (
                                        <div className="relative w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-bold">
                                            {chat.name?.[0] || '#'}
                                            {unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative w-10 h-10">
                                            {/* Image container - separate from badge container */}
                                            <div className="w-full h-full rounded-full overflow-hidden bg-gray-700">
                                                {chat.otherUser?.imageUrl ? (
                                                    <img src={chat.otherUser.imageUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        {chat.otherUser?.name?.[0] || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Badge - outside the overflow-hidden container */}
                                            {unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold z-10">
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                            {chat.access !== "direct" ? chat.name || 'Group' : chat.otherUser?.name || 'DM'}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate">
                                            {chat.lastMessage?.content || 'No messages yet'}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                )}
            </div>

            {/* Footer - profile & sign out */}

            <div className="p-4 border-t border-gray-800 flex items-center justify-between">
                <Link
                    href="/profile"
                    className="flex items-center gap-3 hover:opacity-80 transition"
                    title="Go to profile"
                >
                    <div className="flex items-center gap-3">
                        {user?.imageUrl ? (
                            <img src={user.imageUrl} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                                {user?.firstName?.[0] || user?.username?.[0] || '?'}
                            </div>
                        )}
                        <div>
                            <div className="font-medium">{user?.firstName || user?.username}</div>
                            <div className="text-xs text-gray-500">Online</div>
                        </div>
                    </div>
                </Link>

                <button
                    onClick={() => signOut()}
                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                >
                    Sign out
                </button>
            </div>
        </div>
    );
}