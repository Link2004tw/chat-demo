"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { debugLog } from '@/lib/logger';

export default function FriendProfilePage() {
    const { id: userId } = useParams();
    const { user, isLoaded } = useUser();

    const [friend, setFriend] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!isLoaded || !user) return;

        if (userId === user.id) {
            setLoading(false);
            return;
        }

        const fetchFriend = async () => {
            try {
                debugLog("in the fetch friend", userId);
                const res = await fetch(
                    `/api/users/${userId}`
                );

                if (!res.ok) throw new Error("Failed to fetch");

                const data = await res.json();
                setFriend(data);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchFriend();
    }, [isLoaded, user, userId]);

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

                    <div className="flex gap-4">
                        <Button
                            size="lg"
                            className="flex-1"
                            onClick={() => debugLog("Add friend")}
                        >
                            Add Friend
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            className="flex-1"
                            onClick={() => debugLog("Message")}
                        >
                            Message
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
