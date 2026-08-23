// components/friends/OutgoingRequestItem.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import Link from "next/link";
import { debugLog } from '@/lib/logger';


export default function OutcomingRequestItem({
    request,
    cancelAction,
    disabled = false,
}) {
    debugLog(request)
    return (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
            <Link href={`/users/${request.to?.userId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar className="h-10 w-10">
                    <AvatarImage
                        src={request.to?.profileImageUrl ?? undefined}
                        alt={request.to?.username}
                    />
                    <AvatarFallback>
                        {request.to?.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div>
                    <p className="font-medium">{request.to?.username}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Sent {request.createdAt}
                    </p>
                </div>
            </Link>
            <form action={cancelAction}>
                <input type="hidden" name="requestId" value={request._id} />
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={disabled}
                >
                    Cancel
                </Button>
            </form>
        </div>
    );
}