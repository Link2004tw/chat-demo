// GET /api/chat/proxy → backend /api/chats/all
import { proxyToBackend } from '@/lib/backendProxy';

export async function GET(request) {
    return proxyToBackend(request, '/api/chats/all');
}
