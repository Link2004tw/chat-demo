// middleware.ts (at project root)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/'
]);

export default clerkMiddleware(async (auth, req) => {
    // Protect all routes except public ones
    if (!isPublicRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
        '/(api|trpc)(.*)',
    ],
};