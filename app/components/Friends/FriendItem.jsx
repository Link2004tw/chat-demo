// components/friends/FriendItem.jsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

function FriendItem({ friend, onClick, onMessageClick }) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onClick && onClick(friend)}
            onKeyDown={(e) => e.key === "Enter" && onClick && onClick(friend)}
            className="group flex items-center gap-3 rounded-lg px-3 py-3
                 hover:bg-muted/60 transition-colors cursor-pointer"
        >
            {/* Avatar + status */}
            <div className="relative">
                <Avatar className="h-12 w-12">
                    <AvatarImage
                        src={friend.profileImageUrl || undefined}
                        alt={friend.username}
                    />
                    <AvatarFallback>
                        {friend.username
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <span
                    className={cn(
                        "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background",
                        friend.status === "online" && "bg-green-500",
                        friend.status === "away" && "bg-yellow-500",
                        friend.status === "offline" && "bg-gray-400"
                    )}
                />
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{friend.username}</p>
                <p className="text-sm text-muted-foreground truncate">
                    @{friend.username} • {friend.lastSeen}
                </p>
            </div>

            {/* Message button */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // 🔑 prevent parent click
                    onMessageClick && onMessageClick(friend);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity
                   p-2 rounded-full hover:bg-muted"
                aria-label={`Message ${friend.username}`}
            >
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </button>
        </div>
    );
}

export default FriendItem;
