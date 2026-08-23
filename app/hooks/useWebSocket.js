// hooks/useWebSocket.ts
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { debugLog } from '@/lib/logger';

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://flirtatiously-chalcolithic-bria.ngrok-free.dev';
const WS_SCHEME = BACKEND_URL.startsWith('https://') ? 'wss:' : 'ws:';
const WS_HOST = BACKEND_URL.replace(/^https?:\/\//, '');

export function useWebSocket(roomId, token, isSignedIn) {
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Map());
    const wsRef = useRef(null);
    const messageHandlers = useRef([]);

    const addMessage = useCallback((msg) => {
        messageHandlers.current.forEach((handler) => handler(msg));
    }, []);

    const connect = useCallback(() => {
        if (!isSignedIn || !roomId || !token) return;

        const protocol = WS_SCHEME;
        const url = `${protocol}//${WS_HOST}/ws/chat?chatId=${roomId}`;

        // The backend reads the JWT from the `Sec-WebSocket-Protocol`
        // header (`chat, <token>`) — deliberately not from the URL query,
        // where it would leak into access logs, proxies and history.
        //debugLog('Connecting WebSocket to:', url);
        const ws = new WebSocket(url, ['chat', token]);

        ws.binaryType = 'arraybuffer'; // ← Very important for binary!

        ws.onopen = () => {
            //debugLog('WebSocket connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            // We now need to handle both string (JSON) and binary messages
            if (typeof event.data === 'string') {
                try {
                    const data = JSON.parse(event.data);
                    if (
                        data.type === 'message' ||
                        data.type === 'edit' || data.type === "kick" || data.type === "invited" || data.type === "leave-chat"
                    ) {
                        debugLog("message: ", data);
                        const normalized = {
                            ...data,
                            _id: data._id || data.messageId || `temp-${Date.now()}`,
                        };
                        addMessage(normalized);

                    } else if (data.type === "delete") {
                        // Call all subscribers with a special delete payload
                        //messageHandlers.current.forEach(handler => handler({ type: 'delete', messageId: data.messageId }));
                    } else if (data.type === "typing") {
                        addMessage(data);
                    } else if (data.type === "presence") {
                        setOnlineUsers(prev => {
                            const next = new Map(prev);

                            if (data.status === "online") {
                                next.set(data.userId, {
                                    userId: data.userId,
                                    username: data.username,
                                });
                            }

                            if (data.status === "offline") {
                                next.delete(data.userId);
                            }

                            return next;
                        });
                        //setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));  
                    } else if (data.type === 'file-ack') {
                        debugLog('File ack status:', data.status);
                    } else if (data.type === 'file-progress') {
                        debugLog('File progress received:', data);
                    } else if (data.type === "room-update") {
                        const normalized = {
                            ...data,
                            _id: data._id || `temp-${Date.now()}`,
                            contentType: "system",
                        };
                        addMessage(normalized);
                    } else {
                        debugLog("Unknown message type:", data.type);
                    }
                    // handle other text-based types (system, typing, etc.)
                } catch (err) {
                    console.error('Failed to parse JSON message:', err);
                }
            } else {
                // Binary message → most likely a file or file chunk
                debugLog('Received binary data:', event.data.byteLength, 'bytes');
                // → You will handle this later in your message list / gallery logic
            }
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            setIsConnected(false);
        };

        ws.onclose = (event) => {
            debugLog("[WS] closed", {
                code: event.code,
                reason: event.reason || "(no reason)",
                wasClean: event.wasClean,
            });
            setIsConnected(false);
            if (event.code !== 1000) {
                debugLog("[WS] Scheduling reconnect in 3s");
                setTimeout(connect, 3000);
            }

        };

        wsRef.current = ws;
    }, [roomId, token, isSignedIn, addMessage]);

    // ── Text message ───────────────────────────────────────
    const sendTextMessage = useCallback((content, replyToId = null) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const payload = {
            type: 'message',
            content: content.trim(),
            contentType: 'text',
            replyTo: replyToId,
        };

        wsRef.current.send(JSON.stringify(payload));
    }, []);

    // ── File message (simple version - whole file at once) ──
    const sendFile = useCallback(async (file, replyToId = null, caption = null) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('Cannot send file - WS not open');
            return;
        }

        // Safety limits (very recommended!)
        const MAX_SIZE = 6 * 1024 * 1024; // 6MB - adjust later
        if (file.size > MAX_SIZE) {
            alert(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is ${MAX_SIZE / 1024 / 1024} MB.`);
            return;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();

            // 1. Send metadata first (JSON)
            const metadata = {
                type: 'file-start',
                name: file.name,
                size: file.size,
                mime: file.type || 'application/octet-stream',
                replyTo: replyToId,
                caption: caption,
                // You can add: tempId, previewUrl (dataURL), etc. for optimistic UI
            };

            wsRef.current.send(JSON.stringify(metadata));

            // 2. Then send raw binary
            wsRef.current.send(arrayBuffer);

            debugLog(`File queued: ${file.name} (${file.size} bytes)`);
        } catch (err) {
            console.error('Failed to prepare/send file:', err);
        }
    }, []);

    const deleteMessage = useCallback((messageId) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const payload = {
            type: "delete",
            messageId,
        };

        wsRef.current.send(JSON.stringify(payload));
    }, []);

    const editMessage = useCallback((messageId, newContent) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const payload = {
            type: "edit",
            messageId,
            newContent,
        };

        wsRef.current.send(JSON.stringify(payload));
    }, []);
    const sendTyping = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const payload = {
            type: "typing",
            //userId: currentUser.id,
            //username: currentUser.username,
        };

        wsRef.current.send(JSON.stringify(payload));
    }, []);


    const subscribeToMessages = useCallback((handler) => {
        messageHandlers.current.push(handler);
        return () => {
            messageHandlers.current = messageHandlers.current.filter(h => h !== handler);
        };
    }, []);

    useEffect(() => {
        debugLog("[WS] deps changed → deciding whether to connect", {
            isSignedIn,
            roomId,
            token: token ? "present" : "missing",
        });
        if (isSignedIn && roomId && token) {
            debugLog("[WS] Starting connect attempt");
            connect();

        }
        return () => {
            debugLog("[WS] Cleaning up → closing socket");
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, [connect, isSignedIn, roomId, token]);

    return {
        isConnected,
        sendMessage: sendTextMessage,   // ← renamed for clarity
        sendFile,                       // ← new!
        subscribeToMessages,
        deleteMessage,
        editMessage,
        sendTyping,
        onlineUsers
    };
}