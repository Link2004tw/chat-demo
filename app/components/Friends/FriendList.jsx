// components/friends/FriendsList.tsx
"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import FriendItem from "./FriendItem";
import { useRouter } from "next/navigation";
import { debugLog } from '@/lib/logger';

// Temporary mock data (replace with real API fetch later)
// const mockFriends = [
//     {
//         id: "1",
//         username: "ahmed_dev",
//         displayName: "Ahmed Khaled",
//         avatarUrl: "https://i.pravatar.cc/150?u=ahmed",
//         status: "online",
//         lastSeen: "now",
//     },
//     {
//         id: "2",
//         username: "sara_ui",
//         displayName: "Sara Mostafa",
//         avatarUrl: "https://i.pravatar.cc/150?u=sara",
//         status: "offline",
//         lastSeen: "5m ago",
//     },
//     {
//         id: "3",
//         username: "omar_gamer",
//         displayName: "Omar Hassan",
//         avatarUrl: null,
//         status: "away",
//         lastSeen: "1h ago",
//     },
//     // Add more as needed...
// ];

function FriendsList() {
    // In real app: use useQuery or fetch here
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // change to true when fetching
    const router = useRouter();

    useEffect(() => {
        const fetchFriends = async () => {
            setIsLoading(true);
            const res = await fetch("api/friends");
            const data = await res.json();
            debugLog(data);
            setFriends(data);
            setIsLoading(false);
        }
        fetchFriends();
    }, []);
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <p className="text-lg font-medium">No friends yet</p>
                <p className="mt-1">Add some friends to get started!</p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {friends.map((friend) => (
                <FriendItem key={friend._id} friend={friend} onMessageClick={() => {
                    router.push(`/chat/${friend.dmChatId}`);
                }} onClick={() => router.push(`/users/${friend.userId}`)} />
            ))}
        </div>
    );
}


export default FriendsList;