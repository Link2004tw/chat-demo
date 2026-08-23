// components/chat/MessageSearch.tsx
'use client';

import { useState, useEffect } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';

export function MessageSearch({ messages, onResultClick }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const query = searchQuery.toLowerCase();

        const results = messages.filter(msg => {
            // Search in text messages
            if (msg.contentType === 'text' && msg.content) {
                return msg.content.toLowerCase().includes(query);
            }

            // Search in media captions
            if (msg.caption) {
                return msg.caption.toLowerCase().includes(query);
            }

            return false;
        });

        setSearchResults(results);
    }, [searchQuery, messages]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
                title="Search messages"
            >
                <SearchIcon className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="absolute top-16 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-96 max-h-96 overflow-hidden z-50">
            <div className="p-3 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <SearchIcon className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search in this chat..."
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
                        autoFocus
                    />
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setSearchQuery('');
                            setSearchResults([]);
                        }}
                        className="p-1 hover:bg-gray-700 rounded"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {searchQuery && (
                <div className="overflow-y-auto max-h-80">
                    {searchResults.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            No messages found
                        </div>
                    ) : (
                        <>
                            <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700">
                                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                            </div>
                            {searchResults.map(msg => {
                                const key = msg.messageId || msg._id;
                                return (
                                    <div
                                        key={key}
                                        onClick={() => {
                                            onResultClick(key);
                                            setIsOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 transition"
                                    >
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                            <span className="font-medium">
                                                {msg.author?.username || 'Unknown'}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {new Date(msg.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="text-sm line-clamp-2">
                                            {msg.contentType === 'text'
                                                ? msg.content
                                                : msg.caption || `Sent a ${msg.contentType}`}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}