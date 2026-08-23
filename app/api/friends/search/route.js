// GET /api/friends/search?q=… → backend /api/user/friends/search
import { proxyToBackend } from '@/lib/backendProxy';

export async function GET(request) {
    const query = new URL(request.url).searchParams.get('q') ?? '';
    return proxyToBackend(request, `/api/user/friends/search?q=${query}`);
}
