export default function AdminOnlyFooter({
    message = "Only admins can send messages in this room.",
}) {
    return (
        <div className="w-full border-t bg-muted/40 px-4 py-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>🔒</span>
                <span>{message}</span>
            </div>
        </div>
    );
}