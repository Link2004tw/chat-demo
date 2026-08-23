// components/chat/MessagesList.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import MessageItem from '../Message/MessageItem'; //from '@/app/components/MessageItem';
import ImageMessageItem from '../Message/ImageMessageItem'; //from '@/app/components/Message/ImageMessageItem';
import FileMessageItem from '../Message/FileMessageItem'; //from '@/app/components/Message/FileMessageItem';
import SystemMessageItem from './SystemMessageItem';
import { debugLog } from '@/lib/logger';



export default function MessagesList({
    messages,
    loadingMore,
    hasMore,
    userId,
    onLoadMore,
    onReply,
    onDelete,
    onEdit,
    highlightedMessageId
}) {
    const containerRef = useRef(null);
    const topSentinelRef = useRef(null);
    const bottomRef = useRef(null);
    const lastMessageIdRef = useRef(null);
    const messageRefs = useRef({});
    const prevScrollHeightRef = useRef(0);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        if (highlightedMessageId && messageRefs.current[highlightedMessageId]) {
            messageRefs.current[highlightedMessageId].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [highlightedMessageId]);
    // 1. Scroll to bottom for new messages
    useEffect(() => {
        //debugLog(messages);
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            const lastId = lastMsg.messageId || lastMsg._id;

            if (lastId !== lastMessageIdRef.current) {
                // If it's the initial load, scroll instantly. Otherwise, smooth.
                bottomRef.current?.scrollIntoView({ behavior: isInitialLoad ? 'auto' : 'smooth' });
                lastMessageIdRef.current = lastId;
                if (isInitialLoad) setIsInitialLoad(false);
            }
        }
    }, [messages, isInitialLoad]);

    // 2. Scroll restoration when loading older messages
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (loadingMore) {
            // Capture height before messages are added
            prevScrollHeightRef.current = container.scrollHeight;
        } else if (prevScrollHeightRef.current > 0) {
            // When loading finishes, adjust scroll position
            const heightDiff = container.scrollHeight - prevScrollHeightRef.current;
            if (heightDiff > 0) {
                container.scrollTop = container.scrollTop + heightDiff;
            }
            prevScrollHeightRef.current = 0;
        }
    }, [loadingMore]);

    // 3. Intersection Observer for triggering "Load More"
    useEffect(() => {
        const container = containerRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting && hasMore && !loadingMore && !isInitialLoad) {
                    //debugLog("[ChatMessageList] Sentinel intersected, loading more...");
                    onLoadMore();
                }
            },
            {
                root: container,
                rootMargin: '100px 0px 0px 0px', // Trigger a bit early
                threshold: 0
            }
        );

        const currentSentinel = topSentinelRef.current;
        if (currentSentinel) {
            observer.observe(currentSentinel);
        }

        return () => {
            if (currentSentinel) {
                observer.unobserve(currentSentinel);
            }
        };
    }, [hasMore, loadingMore, onLoadMore, isInitialLoad]);

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto pt-5 pb-32 px-4 scroll-smooth-manual">
            <div ref={topSentinelRef} className="h-1" />
            {loadingMore && <div className="py-4 text-center text-gray-500">Loading older messages...</div>}

            {messages.length === 0 ? (
                <div className="py-16 text-center text-gray-500">No messages yet. Say something!</div>
            ) : (
                messages.map(msg => {
                    const key = msg.messageId || msg._id;
                    const filenameForCheck = msg.fileName || msg.filename || msg.name || "";
                    const isImage = msg.contentType === 'image' ||
                        /\.(png|jpe?g|gif|webp)$/i.test(filenameForCheck);
                    const isSystem = msg.contentType === "system";

                    return (
                        <div key={key} ref={(el) => {
                            if (el) messageRefs.current[key] = el;
                        }} className={`mb-4 ${highlightedMessageId === key ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
                            {msg.contentType === "text" ? (
                                <MessageItem
                                    onDelete={onDelete}
                                    message={msg}
                                    messages={messages}
                                    userId={userId}
                                    onReply={onReply}
                                    onEdit={onEdit}
                                />
                            ) : isImage ? (
                                <ImageMessageItem
                                    onDelete={onDelete}
                                    message={msg}
                                    messages={messages}
                                    userId={userId}
                                    onReply={onReply}
                                />
                            ) : isSystem ? (
                                <SystemMessageItem
                                    message={msg.content}
                                />
                            ) : (
                                <FileMessageItem
                                    onDelete={onDelete}
                                    message={msg}
                                    messages={messages}
                                    userId={userId}
                                    onReply={onReply}
                                />
                            )}
                        </div>
                    );
                })
            )}

            <div ref={bottomRef} />
        </div>
    );
}