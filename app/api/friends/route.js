// GET /api/friends → backend /api/user/friends
import { proxyToBackend } from '@/lib/backendProxy';

export async function GET(request) {
    return proxyToBackend(request, '/api/user/friends');
}
