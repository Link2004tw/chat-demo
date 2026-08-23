// GET /api/chat/:roomId/media → backend /api/chats/:roomId/media
import { proxyToBackend } from '@/lib/backendProxy';

export async function GET(request, { params }) {
    const { roomId } = await params;
    return proxyToBackend(request, `/api/chats/${roomId}/media`);
}
