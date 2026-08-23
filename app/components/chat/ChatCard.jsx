import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ChatCard({ room, onJoin }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{room.name}</CardTitle>
                <CardDescription>{room.access.charAt(0).toUpperCase() + room.access.slice(1)} • {room.participantCount} members</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Optional room details */}
            </CardContent>
            <CardFooter>
                {
                    room.access !== "private" && <form action={onJoin}>
                        <input type="hidden" name="chatId" value={room.chatId} />
                        <input type='hidden' name='chatType' value={room.access} />
                        <Button type="submit">{
                            room.access === "public" ? "Join Room" : "Request to Join"
                        }</Button>
                    </form>
                }

            </CardFooter>
        </Card>
    );
}
