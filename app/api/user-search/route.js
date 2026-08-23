// GET /api/user-search?q=… → backend /api/user/search
import { proxyToBackend } from '@/lib/backendProxy';

export async function GET(request) {
    const query = new URL(request.url).searchParams.get('q') ?? '';
    return proxyToBackend(request, `/api/user/search?q=${query}`);
}
