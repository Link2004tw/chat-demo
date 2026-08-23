"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { createChat } from "@/app/actions/chatsAction";
import { useChats } from "@/app/store/chat-context";
import { debugLog } from '@/lib/logger';

const initialState = {
    success: false,
    error: null,
};

export default function CreateRoomPage() {
    const router = useRouter();
    const { user, isLoaded } = useUser();

    // Form Action State
    const [state, formAction, isPending] = useActionState(createChat, initialState);
    const [canSendMessages, setCanSendMessages] = useState("everyone");

    const [roomName, setRoomName] = useState("");
    const [access, setAccess] = useState("public");
    const [friends, setFriends] = useState([]);
    const [selectedFriends, setSelectedFriends] = useState(new Set());
    const { refreshChats } = useChats();
    // Fetch friends
    useEffect(() => {
        if (!isLoaded) return;

        async function fetchFriends() {
            try {
                const res = await fetch("/api/users/friends");
                if (!res.ok) throw new Error("Failed to fetch friends");
                const data = await res.json();
                setFriends(data);
            } catch (err) {
                console.error(err);
                toast.error("Could not load friends");
            }
        }

        fetchFriends();
    }, [isLoaded]);

    // Handle Server Action Errors/Success
    useEffect(() => {
        const refetch = async () => {
            toast.success("Chat created successfully");
            await refreshChats();
            //debugLog("chatId: ", state);
            router.push(`/chat/${state.chatId}`);
        }
        if (state.error) {
            toast.error(state.error);
        }
        if (state.success) {
            refetch();
        }
    }, [state]);

    const toggleFriend = (id) => {
        setSelectedFriends((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen grid place-items-center">Loading...</div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Create a Room</CardTitle>
                    <CardDescription>
                        Enter a room name, select access type, and invite friends.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col gap-6" action={formAction}>
                        {/* Hidden Inputs for Non-Native Form Elements */}
                        <input type="hidden" name="access" value={access} />
                        {Array.from(selectedFriends).map((friendId) => (
                            <input key={friendId} type="hidden" name="participants" value={friendId} />
                        ))}

                        {/* Room Name */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Room Name</label>
                            <Input
                                name="name"
                                placeholder="e.g., Study Group"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                disabled={isPending}
                                required
                            />
                        </div>

                        {/* Access Type */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Access Type</label>
                            <Select value={access} onValueChange={(val) => setAccess(val)} disabled={isPending}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select access type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="private">Private</SelectItem>
                                    <SelectItem value="protected">Protected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2 border rounded-md p-3">
                            <Checkbox
                                checked={canSendMessages === "admins"}
                                onCheckedChange={(checked) =>
                                    setCanSendMessages(checked ? "admins" : "everyone")
                                }
                                disabled={isPending}
                                name="canSendMessages"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                    Read-only room
                                </span>
                                <span className="text-xs text-gray-500">
                                    Only admins can send messages
                                </span>
                            </div>
                        </div>
                        {/* Invite Friends */}
                        {friends.length > 0 && (
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">Invite Friends</label>
                                <ScrollArea className="max-h-40 border rounded-md p-2">
                                    {friends.map((friend) => (
                                        <div key={friend._id} className="flex items-center gap-2 py-1">
                                            <Checkbox
                                                checked={selectedFriends.has(friend._id)}
                                                onCheckedChange={() => toggleFriend(friend._id)}
                                                disabled={isPending}
                                            />
                                            <span>{friend.firstName || friend.username}</span>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </div>
                        )}

                        {/* Submit */}
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Creating..." : "Create Room"}
                        </Button>

                        {/* Footer */}
                        <p className="text-center text-xs text-gray-400 mt-2">
                            Signed in as <strong>{user.username || user.firstName}</strong>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
