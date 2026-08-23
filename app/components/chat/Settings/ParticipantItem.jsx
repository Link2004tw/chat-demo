import { debugLog } from '@/lib/logger';
export default function ParticipantItem({
    participant,
    kickAction,
    muteAction,
    unmuteAction,
    isMutePending,
    isUnmutePending,
    isAllowed,
    chatId
}) {
    debugLog(participant)
    const isMuted = participant.mutedUntil && new Date(participant.mutedUntil) > new Date();

    return (
        <div
            key={participant._id}
            className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors"
        >
            <div className="flex flex-col truncate">
                <span className="text-sm truncate">
                    {participant.user.username}
                    {isMuted && <span className="ml-1 text-xs" title="Muted">🔇</span>}
                </span>
                <span className="text-xs text-primary capitalize">{participant.role}</span>
            </div>

            {isAllowed && (
                <div className="flex items-center gap-2">
                    {isMuted ? (
                        <form action={unmuteAction}>
                            <input type="hidden" name="userId" value={participant.user.userId} />
                            <input type="hidden" name="chatId" value={chatId} />
                            <button type="submit" className="text-xs text-amber-600 hover:underline" disabled={isUnmutePending}>
                                Unmute
                            </button>
                        </form>
                    ) : (
                        <details className="relative">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:underline list-none">Mute…</summary>
                            <div className="absolute right-0 z-10 mt-1 bg-background border rounded shadow-lg p-1">
                                {["8h", "1w", "forever"].map((d) => (
                                    <form key={d} action={muteAction}>
                                        <input type="hidden" name="userId" value={participant.user.userId} />
                                        <input type="hidden" name="chatId" value={chatId} />
                                        <input type="hidden" name="duration" value={d} />
                                        <button type="submit" className="block w-full text-left text-xs px-2 py-1 hover:bg-muted rounded" disabled={isMutePending}>
                                            {d === "8h" ? "8 hours" : d === "1w" ? "1 week" : "Forever"}
                                        </button>
                                    </form>
                                ))}
                            </div>
                        </details>
                    )}
                    <form action={kickAction}>
                        <input type="hidden" name="userId" value={participant.user.userId} />
                        <input type="hidden" name="chatId" value={chatId} />
                        <button
                            type="submit"
                            className="text-xs text-destructive hover:underline"
                        >
                            Kick
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}