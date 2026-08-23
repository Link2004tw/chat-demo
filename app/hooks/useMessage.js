// hooks/useMessages.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

const LIMIT = 30;


export function useMessages(
    roomId,
    isLoaded,
    isSignedIn,
    token
) {


    // Use the WebSocket hook to get realtime updates

    // Fetch messages from REST API (initial load + pagination)


    // Subscribe to realtime messages via WebSocket


    return {
        messages,
        loading,
        loadingMore,
        hasMore,
        name,
        isConnected,
        sendMessage, // expose so ChatInput can use it directly
        fetchMessages,
    };
}