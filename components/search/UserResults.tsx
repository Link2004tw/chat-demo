// components/search/UserResults.tsx
import { auth } from '@clerk/nextjs/server';
import UserResultCard from './UserResultCard';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function fetchUsers(query) {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
        throw new Error('No active session – please sign in');
    }

    const res = await fetch(
        `${BACKEND_URL}/api/user/search?q=${encodeURIComponent(query)}&limit=20`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        }
    );

    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

export default async function UserResults({ query }) {
    if (!query || query.trim().length < 2) {
        return (
            <p className="text-center text-gray-500 py-10">
                Enter at least 2 characters to search
            </p>
        );
    }

    let users;
    try {
        users = await fetchUsers(query);
    } catch (error) {
        console.error('User search error:', error);
        return (
            <p className="text-red-500 text-center py-10">
                Error loading results. Try again.
            </p>
        );
    }

    if (users.length === 0) {
        return (
            <p className="text-center text-gray-500 py-10">
                No users found for &quot;{query}&quot;
            </p>
        );
    }

    return (
        <div>
            <p className="mb-4 text-gray-600">
                Found {users.length} user{users.length !== 1 ? 's' : ''}
            </p>

            <div className="space-y-3">
                {users.map((user) => (
                    <UserResultCard key={user.clerkId} user={user} />
                ))}
            </div>
        </div>
    );
}