// components/search/SearchInput.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function SearchInput({ initialQuery = '' }) {
    const router = useRouter();
    const [query, setQuery] = useState(initialQuery);
    const [isPending, startTransition] = useTransition();

    const handleSearch = (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        startTransition(() => {
            router.push(`/search/users?q=${encodeURIComponent(query.trim())}`);
        });
    };

    return (
        <form onSubmit={handleSearch} className="mb-8 max-w-xl mx-auto">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by username..."
                    className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    minLength={2}
                />
                <button
                    type="submit"
                    disabled={isPending || query.trim().length < 2}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {isPending ? 'Searching...' : 'Search'}
                </button>
            </div>
        </form>
    );
}