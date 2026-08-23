"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { unblockUserAction } from "@/app/actions/chatsAction";

export default function BlockedUsersPage() {
    const [blocked, setBlocked] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [unblockState, unblockAction, isUnblockPending] = useActionState(unblockUserAction, { success: null });

    const fetchBlocked = async () => {
        try {
            const res = await fetch("/api/user/blocked");
            if (res.ok) {
                const data = await res.json();
                setBlocked(data);
            }
        } catch (err) {
            console.error("Failed to fetch blocked users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlocked();
    }, []);

    useEffect(() => {
        if (unblockState.success) {
            fetchBlocked();
        }
    }, [unblockState]);

    if (loading) {
        return <div className="p-8 text-center">Loading blocked users…</div>;
    }

    return (
        <div className="container max-w-2xl mx-auto py-12">
            <Card>
                <CardHeader>
                    <CardTitle>Blocked Users</CardTitle>
                    <CardDescription>Users you have blocked. Unblock them to allow interactions again.</CardDescription>
                </CardHeader>
                <CardContent>
                    {blocked.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No blocked users.</p>
                    ) : (
                        <div className="space-y-3">
                            {blocked.map((user) => (
                                <div key={user.userId || user.clerkId} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium">{user.username || user.userId || user.clerkId}</span>
                                    </div>
                                    <form action={unblockAction}>
                                        <input type="hidden" name="userId" value={user.userId || user.clerkId} />
                                        <Button type="submit" variant="outline" size="sm" disabled={isUnblockPending}>
                                            Unblock
                                        </Button>
                                    </form>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
