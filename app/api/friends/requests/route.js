// GET /api/friends/requests → backend /api/user/friends/requests
import { proxyToBackend } from '@/lib/backendProxy';

export async function GET(request) {
    return proxyToBackend(request, '/api/user/friends/requests');
}
