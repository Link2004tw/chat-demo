// GET /api/chat/:roomId/messages?limit=&before=…
//   → backend /api/chats/:roomId/messages (all query params forwarded)
import { proxyToBackend } from '@/lib/backendProxy';

export async function GET(request, { params }) {
    const { roomId } = await params;
    return proxyToBackend(request, `/api/chats/${roomId}/messages`, {
        forwardQuery: true,
    });
}
