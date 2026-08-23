// GET /api/chat/search?q=… → backend /api/chats/search
import { proxyToBackend } from '@/lib/backendProxy';

export async function GET(request) {
    const query = new URL(request.url).searchParams.get('q') ?? '';
    return proxyToBackend(request, `/api/chats/search?q=${query}`);
}
