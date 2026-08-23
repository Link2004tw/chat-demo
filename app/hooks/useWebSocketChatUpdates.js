// hooks/useChatListWebSocket.ts
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { debugLog } from '@/lib/logger';

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://flirtatiously-chalcolithic-bria.ngrok-free.dev';
const WS_SCHEME = BACKEND_URL.startsWith('https://') ? 'wss:' : 'ws:';
const WS_HOST = BACKEND_URL.replace(/^https?:\/\//, '');

export function useChatListWebSocket(token, isSignedIn) {
    const [isConnected, setIsConnected] = useState(false);
    const [chatUpdates, setChatUpdates] = useState(new Map()); // chatId -> update data
    const wsRef = useRef(null);
    const updateHandlers = useRef([]);

    const notifyHandlers = useCallback((update) => {
        updateHandlers.current.forEach((handler) => handler(update));
    }, []);

    const connect = useCallback(() => {
        if (!isSignedIn || !token) return;

        const protocol = WS_SCHEME;
        const url = `${protocol}//${WS_HOST}/ws/chat-list`;

        // JWT rides in `Sec-WebSocket-Protocol` (`chat, <token>`), not the
        // URL — see plugins/ws-auth.ts on the backend.
        debugLog('Connecting to chat list WebSocket:', url);
        const ws = new WebSocket(url, ['chat', token]);

        ws.onopen = () => {
            debugLog('Chat list WebSocket connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                debugLog("data:", data);
                switch (data.type) {
                    case 'new-message':
                        debugLog("new-message:", data);
                        setChatUpdates(prev => {
                            const next = new Map(prev);
                            next.set(data.chatId, {
                                lastMessage: data.lastMessage,
                                unreadCount: data.unreadCount,
                                updatedAt: Date.now(),
                            });
                            debugLog(next);
                            return next;
                        });
                        notifyHandlers(data);
                        break;
                    case 'kicked':
                        // New: handle kicked user
                        debugLog('[Chat List WS] Kick event:', data);
                        // Optionally, remove the chat or mark it as system message
                        setChatUpdates(prev => {
                            const next = new Map(prev);
                            const existing = next.get(data.chatId) || {};
                            next.set(data.chatId, {
                                ...existing,
                                lastMessage: data.systemMessage.content,
                                updatedAt: Date.now(),
                            });
                            return next;
                        });
                        notifyHandlers(data);
                        break;
                    case 'invited':
                        debugLog("[Chat List WS] Invited event:", data);
                        setChatUpdates(prev => {
                            const next = new Map(prev);
                            const existing = next.get(data.chatId) || {};
                            next.set(data.chatId, {
                                ...existing,
                                lastMessage: data.systemMessage.content,
                                updatedAt: Date.now(),
                            });
                            return next;
                        });
                        notifyHandlers(data);
                        break;
                    case 'unread-update':
                        setChatUpdates(prev => {
                            const next = new Map(prev);
                            const existing = next.get(data.chatId) || {};
                            next.set(data.chatId, {
                                ...existing,
                                unreadCount: data.unreadCount,
                                updatedAt: Date.now(),
                            });
                            return next;
                        });
                        notifyHandlers(data);
                        break;

                    case 'chat-updated':
                    case 'chat-deleted':
                        notifyHandlers(data);
                        break;

                    case 'connected':
                        debugLog('Chat list:', data.message);
                        break;

                    default:
                        debugLog('Unknown chat list event:', data);
                }
            } catch (err) {
                console.error('Failed to parse chat list message:', err);
            }
        };

        ws.onerror = (err) => {
            console.error('Chat list WebSocket error:', err);
            setIsConnected(false);
        };

        ws.onclose = (event) => {
            debugLog('[Chat List WS] closed', {
                code: event.code,
                reason: event.reason || '(no reason)',
                wasClean: event.wasClean,
            });
            setIsConnected(false);
            if (event.code !== 1000) {
                debugLog('[Chat List WS] Reconnecting in 3s');
                setTimeout(connect, 3000);
            }
        };

        wsRef.current = ws;
    }, [token, isSignedIn, notifyHandlers]);

    const markChatAsRead = useCallback((chatId) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        wsRef.current.send(JSON.stringify({
            type: 'mark-read',
            chatId,
        }));
    }, []);

    const subscribeToChatUpdates = useCallback((handler) => {
        updateHandlers.current.push(handler);
        return () => {
            updateHandlers.current = updateHandlers.current.filter(h => h !== handler);
        };
    }, []);

    useEffect(() => {
        if (isSignedIn && token) {
            connect();
        }
        return () => {
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, [connect, isSignedIn, token]);

    return {
        isConnected,
        chatUpdates,
        markChatAsRead,
        subscribeToChatUpdates,
    };
}