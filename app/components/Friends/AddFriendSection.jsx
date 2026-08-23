"use client";
// components/friends/AddFriendSection.tsx
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, Clock } from 'lucide-react'; // or your icons
import ProfileItem from './ProfileItem';
import { useRouter } from 'next/navigation';
import { debugLog } from '@/lib/logger';

function AddFriendSection() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]); // define User type
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const runQuery = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/user-search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            debugLog(data);
            setResults(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(runQuery, 400); // debounce

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-semibold">Add a friend</h2>
                <p className="text-muted-foreground mt-1">
                    Search by username (e.g. @link123)
                </p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Type a username..."
                    className="pl-10"
                    value={query}
                    onChange={(e) => setQuery(e.target.value.trim())}
                />
            </div>

            <div className="space-y-3">
                {loading && <p className="text-center text-muted-foreground">Searching...</p>}

                {!loading && results.length === 0 && query.length > 1 && (
                    <p className="text-center text-muted-foreground">No users found</p>
                )}

                {results.map(user => (
                    <ProfileItem user={user} key={user.clerkId} onAction={() => runQuery()} />
                ))}
            </div>
        </div>
    );
}

export default AddFriendSection;