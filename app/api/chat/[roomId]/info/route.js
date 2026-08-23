// GET /api/chat/:roomId/info → backend /api/chats/:roomId/info
import { proxyToBackend } from '@/lib/backendProxy';

export async function GET(request, { params }) {
    const { roomId } = await params;
    return proxyToBackend(request, `/api/chats/${roomId}/info`);
}
