import ParticipantItem from "./ParticipantItem";

export default function ParticipantsList({
    participants = [],
    kickAction,
    isKickPending,
    muteAction,
    unmuteAction,
    isMutePending,
    isUnmutePending,
    myRelation,
    chatId
}) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-muted-foreground">
                Participants ({participants.length})
            </h3>

            <div className="mt-3 space-y-2">
                {participants.map((participant) => {
                    let isAllowed = false;
                    if (participant.role !== "owner" && participant.role !== "admin" && (myRelation === "admin" || myRelation === "owner")) {
                        isAllowed = true;
                    }
                    return <ParticipantItem
                        key={participant._id}
                        participant={participant}
                        kickAction={kickAction}
                        muteAction={muteAction}
                        unmuteAction={unmuteAction}
                        isMutePending={isMutePending}
                        isUnmutePending={isUnmutePending}
                        isAllowed={isAllowed}
                        chatId={chatId} />
                })}

                {participants.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No participants yet
                    </p>
                )}
            </div>
        </div>
    );
}
