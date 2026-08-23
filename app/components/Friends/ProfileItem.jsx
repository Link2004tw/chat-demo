"use client";

import { SendFriendRequest } from "@/app/actions/friendsAction";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCheck, UserPlus, UserX, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo } from "react";
import { debugLog } from '@/lib/logger';

const getButtonConfig = (status) => {
    switch (status) {
        case "none":
            return {
                text: "Add Friend",
                action: "Send Request",
                icon: <UserPlus className="h-4 w-4 mr-2" />,
                variant: "default",
            };
        case "pending":
            return {
                text: "Cancel Request",
                action: "Cancel Request",
                icon: <UserX className="h-4 w-4 mr-2" />,
                variant: "outline",
            };
        case "respond":
            return {
                text: "Accept",
                action: "Accept",
                icon: <UserCheck className="h-4 w-4 mr-2" />,
                variant: "default",
                showDecline: true, // Flag to show decline button
            };
        case "friends":
            return {
                text: "Remove Friend",
                action: "Remove Friend",
                icon: <UserX className="h-4 w-4 mr-2" />,
                variant: "destructive",
            };
        default:
            return {
                text: "Add Friend",
                action: "Send Request",
                icon: null,
                variant: "default",
            };
    }
};

export default function ProfileItem({ user, onAction }) {
    const [state, formAction, isPending] = useActionState(SendFriendRequest, null);
    const router = useRouter();
    debugLog(user);

    // Memoize config based on current status (from props or from server action result)
    const currentStatus = (state?.status) ?? user.friendRequestStatus;

    const buttonConfig = useMemo(
        () => getButtonConfig(currentStatus),
        [currentStatus]
    );

    // Show success/error message only when action completes
    useEffect(() => {
        if (state?.success) {
            onAction();
            alert(state.message); // ← in real app use toast!
        }
    }, [state]);

    const handleContainerClick = (e) => {
        // If the click originated from inside the button → don't navigate
        if ((e.target).closest("button")) {
            e.stopPropagation();
        }
    };

    return (
        <Link href={`/users/${user.clerkId}`}>
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg" onClick={handleContainerClick}>
                <div className="flex items-center gap-3">
                    {/* Avatar – you can use real one later */}
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.imageUrl} alt={user.username} />
                        <AvatarFallback>
                            {user.username?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                </div>

                <form action={formAction} className="flex gap-2">
                    <input type="hidden" name="user" value={user.clerkId} />
                    <input type="hidden" name="status" value={user.friendRequestStatus} />
                    <input
                        type="hidden"
                        name="requestId"
                        value={user.friendRequestId ?? ""}
                    />

                    {/* Primary Action Button */}
                    <Button
                        type="submit"
                        name="action"
                        value={buttonConfig.action}
                        size="sm"
                        variant={buttonConfig.variant}
                        disabled={isPending}
                        className="min-w-[140px]"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                {buttonConfig.icon}
                                {buttonConfig.text}
                            </>
                        )}
                    </Button>

                    {/* Decline Button (only for "respond" status) */}
                    {buttonConfig.showDecline && (
                        <Button
                            type="submit"
                            name="action"
                            value="Decline"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Decline
                        </Button>
                    )}
                </form>
            </div>
        </Link>
    );
}