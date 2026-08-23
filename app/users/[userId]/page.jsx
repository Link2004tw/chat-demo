"use client";

import { useActionState, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SendFriendRequest } from "@/app/actions/friendsAction";
import { blockUserAction, unblockUserAction } from "@/app/actions/chatsAction";
import { debugLog } from '@/lib/logger';

export default function FriendProfilePage() {
    const { userId } = useParams();
    const { user, isLoaded } = useUser();

    const [friend, setFriend] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [sendRequestState, sendRequestAction, isPending] = useActionState(SendFriendRequest, {
        message: "",
        success: false,
        error: false
    })
    const [blockState, blockAction, isBlockPending] = useActionState(blockUserAction, { success: null, error: null });
    const [unblockState, unblockAction, isUnblockPending] = useActionState(unblockUserAction, { success: null, error: null });
    const [blockedIds, setBlockedIds] = useState([]);
    const router = useRouter();

    const fetchFriend = async () => {
        try {
            debugLog("in the fetch friend", userId);
            const res = await fetch(
                `/api/users/${userId}`
            );

            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();
            debugLog("data", data);
            setFriend(data);
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (!isLoaded || !user) return;

        if (userId === user.id) {
            setLoading(false);
            return;
        }



        fetchFriend();
    }, [isLoaded, user, userId]);
    useEffect(() => {
        if (!sendRequestState.success) return;
        alert(sendRequestState.message);
        fetchFriend();
    }, [sendRequestState])

    const fetchBlocked = async () => {
        try {
            const res = await fetch(`/api/user/blocked`);
            if (res.ok) {
                const data = await res.json();
                setBlockedIds(data.map((u) => u.userId || u.clerkId));
            }
        } catch (err) {
            console.error("Failed to fetch blocked users:", err);
        }
    };

    useEffect(() => {
        fetchBlocked();
    }, []);

    useEffect(() => {
        if (blockState.success || unblockState.success) {
            fetchBlocked();
        }
    }, [blockState, unblockState]);

    // ────────────────────────────────────────────────
    // States
    // ────────────────────────────────────────────────
    if (!isLoaded || loading) {
        return <div className="p-8 text-center">Loading profile…</div>;
    }

    if (!user) {
        return <div className="p-8 text-center">Please sign in to view profiles</div>;
    }

    if (userId === user.id) {
        return <div className="p-8 text-center">This is your own profile 😄</div>;
    }

    if (error || !friend) {
        return <div className="p-8 text-center">Profile not found</div>;
    }

    const imageUrl = friend.imageUrl;
    const username = friend.username;

    return (
        <div className="container max-w-2xl mx-auto py-12">
            <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />

                <CardHeader className="relative pb-0">
                    <div className="absolute -top-16 left-6">
                        <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                            <AvatarImage src={imageUrl} alt={username} />
                            <AvatarFallback className="text-4xl bg-muted">
                                {username
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="pt-20">
                        <CardTitle className="text-3xl">{username}</CardTitle>
                        {username && (
                            <CardDescription className="text-lg">@{username}</CardDescription>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                    <Separator />

                    <div className="flex gap-4 flex-wrap">
                        <form action={sendRequestAction}>
                            <input type="hidden" name="requestId" value={friend.friendRequestId || ''} />
                            <input type="hidden" name="user" value={friend.clerkId} />
                            <input type="hidden" name="status" value={friend.friendRequestStatus} />

                            {/* Case 1: No relationship - Send Request */}
                            {(!friend.friendRequestStatus || friend.friendRequestStatus === "none") && (
                                <input
                                    className="inline-flex items-center justify-center rounded-lg text-white bg-primary 
             hover:bg-primary/90 px-4 py-2 text-sm font-medium transition-colors
             focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 
             disabled:opacity-50 disabled:cursor-not-allowed"
                                    type="submit"
                                    name="action"
                                    value="Send Request"
                                />
                            )}

                            {/* Case 2: Pending - Cancel Request */}
                            {friend.friendRequestStatus === "pending" && (
                                <input
                                    className="inline-flex items-center justify-center rounded-lg text-white bg-destructive 
             hover:bg-destructive/90 px-4 py-2 text-sm font-medium transition-colors
             focus:outline-none focus:ring-2 focus:ring-destructive/50 focus:ring-offset-2 
             disabled:opacity-50 disabled:cursor-not-allowed"
                                    type="submit"
                                    name="action"
                                    value="Cancel Request"
                                />
                            )}

                            {/* Case 3: Respond - Accept or Decline */}
                            {friend.friendRequestStatus === "respond" && (
                                <>
                                    <input
                                        className="inline-flex items-center justify-center rounded-lg text-white bg-destructive 
             hover:bg-destructive/90 px-4 py-2 text-sm font-medium transition-colors
             focus:outline-none focus:ring-2 focus:ring-destructive/50 focus:ring-offset-2 
             disabled:opacity-50 disabled:cursor-not-allowed"
                                        type="submit"
                                        name="action"
                                        value="Accept"
                                    />
                                    <input
                                        className="inline-flex items-center justify-center rounded-lg text-white bg-destructive 
             hover:bg-destructive/90 px-4 py-2 text-sm font-medium transition-colors
             focus:outline-none focus:ring-2 focus:ring-destructive/50 focus:ring-offset-2 
             disabled:opacity-50 disabled:cursor-not-allowed"
                                        type="submit"
                                        name="action"
                                        value="Decline"
                                    />
                                </>
                            )}

                            {/* Case 4: Friends - Remove Friend */}
                            {friend.friendRequestStatus === "friends" && (

                                <input
                                    className="inline-flex items-center justify-center rounded-lg text-white bg-destructive 
             hover:bg-destructive/90 px-4 py-2 text-sm font-medium transition-colors
             focus:outline-none focus:ring-2 focus:ring-destructive/50 focus:ring-offset-2 
             disabled:opacity-50 disabled:cursor-not-allowed"
                                    type="submit"
                                    name="action"
                                    value="Remove Friend"
                                />
                            )}
                        </form>
                        {friend.friendRequestStatus === "friends" &&
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1"
                                onClick={() => router.push(`/chat/${friend.dmId}`)}
                            >
                                Message
                            </Button>
                        }
                    </div>

                    <Separator />

                    <div>
                        {blockedIds.includes(friend.clerkId) ? (
                            <form action={unblockAction}>
                                <input type="hidden" name="userId" value={friend.clerkId} />
                                <Button type="submit" variant="outline" disabled={isUnblockPending}>
                                    {isUnblockPending ? "Unblocking..." : "Unblock"}
                                </Button>
                            </form>
                        ) : (
                            <form action={blockAction}>
                                <input type="hidden" name="userId" value={friend.clerkId} />
                                <Button type="submit" variant="destructive" disabled={isBlockPending}>
                                    {isBlockPending ? "Blocking..." : "Block"}
                                </Button>
                            </form>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
