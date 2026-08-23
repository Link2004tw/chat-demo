// Shared server-side forwarder for API routes that proxy to the Fastify
// backend. Every route under app/api/** used to hand-roll this ~50-line
// pattern (with divergent hardcoded fallback hosts); now it's three lines.
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * Forwards an authenticated request to the Fastify backend:
 * - attaches the caller's Clerk JWT (`Authorization: Bearer`),
 * - optionally appends the incoming request's query params to `path`,
 * - forwards the backend's status code and JSON body verbatim,
 * - maps failures to 401 (no session) / 502 (backend unreachable).
 *
 * @param {Request} request   The incoming Next.js route request.
 * @param {string} path       Backend path, e.g. `/api/user/friends` — may
 *                            already include a query string.
 */
export async function proxyToBackend(request, path, { method = 'GET', forwardQuery = false } = {}) {
    const { getToken } = await auth();
    const token = await getToken();
    if (!token) {
        return NextResponse.json(
            { error: 'Unauthorized – no active session' },
            { status: 401 },
        );
    }

    try {
        let url = `${BACKEND_URL}${path}`;
        if (forwardQuery) {
            const { searchParams } = new URL(request.url);
            const qs = new URLSearchParams(searchParams).toString();
            if (qs) url += (path.includes('?') ? '&' : '?') + qs;
        }

        const backendRes = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        const data = await backendRes.json().catch(() => ({}));
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error('Proxy error:', err);
        return NextResponse.json(
            { error: 'Failed to reach backend server' },
            { status: 502 },
        );
    }
}
