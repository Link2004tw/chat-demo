// GET /api/users/:id → backend /api/user/:id
import { proxyToBackend } from '@/lib/backendProxy';

export async function GET(request, { params }) {
    const { id } = await params;
    return proxyToBackend(request, `/api/user/${id}`);
}
