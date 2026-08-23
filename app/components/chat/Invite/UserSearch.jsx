"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { debugLog } from '@/lib/logger';


export function UserSearch({
    onSelect,
    excludeUserIds = [],
    chatId,
    onSelectState
}) {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const prevStateRef = useRef(onSelectState);

    useEffect(() => {

        if (!query.trim()) {
            setUsers([]);
            return;
        }

        const controller = new AbortController();

        const search = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/friends/search?q=${encodeURIComponent(query)}`,
                    { signal: controller.signal }
                );
                const data = await res.json();

                setUsers(
                    data.filter(
                        (u) => !excludeUserIds.includes(u._id)
                    )
                );
                debugLog(data);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error(err);
                }
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(search, 300);


        return () => {
            controller.abort();
            clearTimeout(debounce);
        };
    }, [query, excludeUserIds]);


    useEffect(() => {
        // Only clear if state reference actually changed AND success is true
        if (onSelectState !== prevStateRef.current && onSelectState.success && query !== "") {
            setQuery("");
            setUsers([]);
            alert("user invited");
            prevStateRef.current = onSelectState;
        }
    }, [onSelectState]);

    return (
        <div className="relative">
            <Input
                placeholder="Search by username..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            {loading && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
            )}

            {users.length > 0 && (
                <div className="absolute z-50 mt-2 w-full rounded-lg border bg-background shadow">
                    <form action={onSelect}>
                        <input
                            type="hidden"
                            name="chatId"
                            value={chatId}
                        />
                        <ul>
                            {users.map((user) => (
                                <li key={user._id}>
                                    <Input type="submit" name="username" value={user.username} />
                                </li>
                            ))}
                        </ul>
                    </form>
                </div>
            )}
        </div>
    );
}
