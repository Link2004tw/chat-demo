// GET /api/chat/:roomId/requests → backend /api/chats/:roomId/requests
import { proxyToBackend } from '@/lib/backendProxy';

export async function GET(request, { params }) {
    const { roomId } = await params;
    return proxyToBackend(request, `/api/chats/${roomId}/requests`);
}
