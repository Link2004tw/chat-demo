// components/search/SearchItem.tsx
'use client';

import { Loader2 } from 'lucide-react';

export default function SearchItem({ user, action, isPending }) {
    return (
        <div className="flex items-center gap-3 p-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50 transition">
            {user.imageUrl ? (
                // 32px remote avatar; next/image would need Cloudinary
                // remotePatterns configured for no benefit at this size.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={user.imageUrl}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover"
                />
            ) : (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 text-sm font-semibold">
                    {user.username?.[0]?.toUpperCase() || '?'}
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.name || user.username}</div>
                <div className="text-xs text-gray-400 truncate">@{user.username}</div>
            </div>

            <form action={action}>
                <input type="hidden" name="userId" value={user.userId} />
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin inline" />
                    ) : (
                        'Message'
                    )}
                </button>
            </form>
        </div>
    );
}