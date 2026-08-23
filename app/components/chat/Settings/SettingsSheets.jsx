import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState, useEffect, useState } from "react";
import ParticipantsList from "./ParticipantsList";
import { kickUser, leaveRoom, changeRoomName, muteUser, unmuteUser } from "@/app/actions/chatsAction";
import { useRouter } from "next/navigation";
import { useChats } from "@/app/store/chat-context";
import { InviteBySearch } from "../Invite/InviteBySearch"; //from "./InviteBySearch";
import InviteRequestList from "../Invite/InviteRequestList";
import { PencilIcon, XIcon } from "lucide-react";

export default function RoomDetailsSheet({
    open,
    onOpenChange,
    roomId,
    onNameChange,
    onParticipantsChange,
}) {

    const [room, setRoom] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [leaveRoomState, leaveRoomAction, isPending] = useActionState(leaveRoom, {
        success: false,
        error: null,
    });

    const [kickState, kickAction, isKickPending] = useActionState(kickUser, {
        success: false,
        error: null,
    });

    const [muteState, muteAction, isMutePending] = useActionState(muteUser, {
        success: false,
        error: null,
    });

    const [unmuteState, unmuteAction, isUnmutePending] = useActionState(unmuteUser, {
        success: false,
        error: null,
    });

    const [changeNameState, changeNameAction, isChangeNamePending] = useActionState(changeRoomName, {
        success: false,
        error: null,
    });

    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [tempName, setTempName] = useState("");

    const router = useRouter();
    const { refreshChats } = useChats();

    const fetchRoom = async () => {
        try {
            const response = await fetch(`/api/chat/${roomId}/info`);
            const data = await response.json();
            setRoom(data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching room:", error);
            setIsLoading(false);
        }
    }
    useEffect(() => {
        if (kickState.success) {
            fetchRoom();
            onParticipantsChange?.();
        }
    }, [kickState])

    useEffect(() => {
        if (muteState.success || unmuteState.success) {
            fetchRoom();
            onParticipantsChange?.();
        }
    }, [muteState, unmuteState])

    useEffect(() => {

        fetchRoom();
    }, [roomId,]);

    useEffect(() => {
        if (leaveRoomState.success) {

            alert("leaving room");
            onOpenChange(false);

            router.push("/chat");
            refreshChats();
        }
    }, [leaveRoomState]);

    useEffect(() => {
        if (changeNameState.success) {
            setIsNameModalOpen(false);
            fetchRoom();
            if (onNameChange && changeNameState.data?.name) {
                onNameChange(changeNameState.data.name);
            }
        }
    }, [changeNameState]);

    if (isLoading) {
        return <div>Loading...</div>;
    }


    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[320px] sm:w-[380px]">
                <SheetHeader>
                    <div className="flex items-center justify-between pr-6">
                        <SheetTitle className="text-xl">{room.name}</SheetTitle>
                        {(room.myRelation === "admin" || room.myRelation === "owner") && (
                            <button
                                onClick={() => {
                                    setTempName(room.name);
                                    setIsNameModalOpen(true);
                                }}
                                className="p-1 hover:bg-accent rounded-md transition-colors"
                            >
                                <PencilIcon className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </button>
                        )}
                    </div>
                    <SheetDescription>
                        Room details & participants
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6 overflow-y-auto ml-2">
                    {/* Room Info */}
                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Room Info
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Created by</span>
                                <span className="text-sm font-medium text-foreground">{room.createdBy?.username}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Access</span>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    room.access === 'public' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    room.access === 'private' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    room.access === 'protected' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                }`}>
                                    {room.access}
                                </span>
                            </div>
                            {room.canSendMessages && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Can send messages</span>
                                    <span className="text-sm font-medium text-foreground capitalize">{room.canSendMessages}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Participants */}
                    <ParticipantsList
                        participants={room.participants}
                        kickAction={kickAction}
                        isKickPending={isKickPending}
                        muteAction={muteAction}
                        unmuteAction={unmuteAction}
                        isMutePending={isMutePending}
                        isUnmutePending={isUnmutePending}
                        myRelation={room.myRelation}
                        chatId={roomId} />
                    {
                        (room.access !== "direct" && (room.myRelation === "admin" || room.myRelation === "owner")) && (
                            <InviteBySearch chatId={roomId} existingUserIds={room.participants.map((p) => p.user._id)} onSubmit={fetchRoom} />
                        )
                    }
                    {
                        (room.access === "protected" && (room.myRelation === "admin" || room.myRelation === "owner")) && (
                            <InviteRequestList requests={room?.requests} />
                        )
                    }
                    {/* Actions */}
                    <div className="pt-4 border-t">
                        <form action={leaveRoomAction}>
                            <input type="hidden" name="chatId" value={room._id} />
                            <Button type="submit" disabled={isPending} variant="destructive" className="w-full">
                                {isPending ? "Leaving..." : "Leave Room"}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Change Room Name Modal */}
                {isNameModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-background rounded-lg shadow-lg p-6 w-[90%] max-w-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Change Room Name</h3>
                                <button
                                    onClick={() => setIsNameModalOpen(false)}
                                    className="p-1 hover:bg-accent rounded-md transition-colors"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <form action={changeNameAction}>
                                <input type="hidden" name="chatId" value={room._id} />
                                <Input
                                    name="name"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const form = e.target.form;
                                            form.requestSubmit();
                                        }
                                    }}
                                    placeholder="Enter new room name"
                                    className="mb-4"
                                    autoFocus
                                />
                                {changeNameState.error && (
                                    <p className="text-sm text-destructive mb-4">{changeNameState.error}</p>
                                )}
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsNameModalOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isChangeNamePending}>
                                        {isChangeNamePending ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
