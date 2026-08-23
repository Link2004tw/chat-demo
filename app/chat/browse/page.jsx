"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import ChatCard from '@/app/components/chat/ChatCard';
import { useActionState } from 'react';
import { joinChat } from '@/app/actions/chatsAction';
import { debugLog } from '@/lib/logger';

export default function BrowseRoomsPage() {
    const [search, setSearch] = useState('');
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [joinChatState, joinChatAction, isPendingJoin] = useActionState(joinChat, {
        chatId: "",
        success: false,
        error: "",
    });
    const router = useRouter();

    useEffect(() => {
        if (!search) {
            setRooms([]);
            return;
        }

        const controller = new AbortController();
        const fetchRooms = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/chat/search?q=${encodeURIComponent(search)}`, {
                    signal: controller.signal
                });
                if (!res.ok) throw new Error('Failed to fetch rooms');
                const data = await res.json();
                debugLog(data);
                setRooms(data || []);
            } catch (err) {
                if (err.name !== 'AbortError') console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchRooms, 300);
        return () => {
            clearTimeout(debounce);
            controller.abort();
        };
    }, [search]);

    useEffect(() => {
        if (joinChatState.success) {
            if (joinChatState.chatType === "public") {
                alert("Joined chat successfully");
                router.push(`/chat/${joinChatState.chatId}`);
            }
            else {
                alert("Request Sent");
            }
        }
    }, [joinChatState]);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-semibold mb-4">Browse Rooms</h1>
            <Input
                placeholder="Search for a room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-6"
            />
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin w-8 h-8" />
                </div>
            ) : rooms.length === 0 ? (
                <p className="text-center text-gray-500 py-20">No rooms found</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map((room) => (
                        <ChatCard key={room.chatId} room={room} onJoin={joinChatAction} />
                    ))}
                </div>
            )}
        </div>
    );
}
