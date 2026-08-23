"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserSearch } from "./UserSearch";
import { inviteByUsername } from "@/app/actions/chatsAction";

export function InviteBySearch({
    chatId,
    existingUserIds = [],
    onSubmit
}) {
    const [inviteByUsernameState, inviteByUsernameAction, isPendingUsername] = useActionState(inviteByUsername, {
        message: "",
        success: false,
        error: null,
    });
    const prevStateRef = useRef(inviteByUsernameState);

    useEffect(() => {
        // Only show toast if the state actually changed
        if (inviteByUsernameState !== prevStateRef.current) {
            if (inviteByUsernameState.success) {
                toast.success(inviteByUsernameState.message);
                onSubmit();
            } else if (inviteByUsernameState.error) {
                toast.error(inviteByUsernameState.error);
            }
            prevStateRef.current = inviteByUsernameState;
        }
    }, [inviteByUsernameState]);

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
                Invite people
            </h3>

            <UserSearch
                excludeUserIds={existingUserIds}
                onSelect={inviteByUsernameAction}
                chatId={chatId}
                onSelectState={inviteByUsernameState}
            />

            {isPendingUsername && (
                <Button disabled variant="secondary" className="w-full">
                    Inviting...
                </Button>
            )}
        </div>
    );
}
