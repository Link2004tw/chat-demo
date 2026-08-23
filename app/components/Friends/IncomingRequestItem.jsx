// components/friends/IncomingRequestItem.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export function IncomingRequestItem({
    request,
    onAccept,
    onDecline,
    disabled = false,
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted/40 rounded-lg border">
            <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={request.from?.profileImageUrl ?? undefined} alt={request.to?.username} />
                    <AvatarFallback>{request.from?.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div>
                    <p className="font-medium">{request.from?.username}</p>
                    <p className="text-sm text-muted-foreground">@{request.from?.username}</p>
                    {request.message && (
                        <p className="text-sm mt-1 italic text-muted-foreground">
                            "{request.message}"
                        </p>
                    )}
                </div>
            </div>

            <div className="flex gap-2 self-end sm:self-center">
                <form action={onAccept}>
                    <input type="hidden" name="requestId" value={request._id} />
                    <Button
                        size="sm"
                        variant="default"
                        type="submit"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={disabled}
                    >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                    </Button>
                </form>
                <form action={onDecline}>
                    <input name="requestId" type="hidden" value={request._id} />
                    <Button
                        size="sm"
                        variant="outline"
                        type="submit"
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        disabled={disabled}
                    >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                    </Button>
                </form>
            </div>
        </div>
    );
}