// context/ChatContext.tsx
"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import { createContext, useContext, useEffect, useState } from "react";
import { useChatListWebSocket } from "../hooks/useWebSocketChatUpdates";
import { debugLog } from '@/lib/logger';

const ChatContext = createContext({
    chats: [],
    setChats: () => { },
    refreshChats: async () => { },
    chatLoaded: false,
    markChatAsRead: async (chatId) => { },
    chatUpdates: new Map(),
});

export function ChatProvider({ children }) {
    const [chats, setChats] = useState([]);
    const [chatLoaded, setChatLoaded] = useState(false);
    const { getToken } = useAuth();
    const { isSignedIn } = useUser();
    const [token, setToken] = useState(null);

    useEffect(() => {
        if (isSignedIn) {
            getToken().then((token) => {
                setToken(token);
            })
        }
    }, [isSignedIn, getToken])

    const { chatUpdates, markChatAsRead, subscribeToChatUpdates, isConnected } = useChatListWebSocket(token, isSignedIn);


    const refreshChats = async () => {

        const res = await fetch("/api/chat/proxy");
        const data = await res.json();
        setChats(data);
        setChatLoaded(true);
    };

    useEffect(() => {
        const unsubscribe = subscribeToChatUpdates((update) => {
            debugLog("update:", update);
            switch (update.type) {
                case "new-message":
                    setChats(prev => {
                        const updated = prev.map(chat => {
                            if (chat._id === update.chatId) {
                                return {
                                    ...chat,
                                    unreadCount: update.unreadCount,
                                    lastMessage: update.lastMessage,
                                    updatedAt: update.createdAt,
                                }
                            }
                            return chat;
                        });
                        //debugLog("update: ", update);
                        return updated.sort((a, b) => new Date(b.updatedAt || b.lastMessage?.createdAt || 0).getTime() - new Date(a.updatedAt || a.lastMessage?.createdAt || 0).getTime());
                    });
                    break;
                case 'unread-update':
                    setChats(prev => prev.map(chat => chat._id === update.chatId ? { ...chat, unreadCount: update.unreadCount } : chat));
                    break;
                case 'chat-deleted':
                    setChats(prev => prev.filter(chat => chat._id !== update.chatId));
                    break;
                case 'chat-updated':
                    setChats(prev => prev.map(chat => chat._id === update.chatId ? { ...chat, updateAt: new Date(update.updateAt).toISOString() } : chat));
                    break;
                case 'kicked':
                    setChats(prev => {
                        const updated = prev.map(chat => {
                            if (chat._id === update.chatId) {
                                debugLog("kicked: ", update);
                                return {
                                    ...chat,
                                    lastMessage: update.systemMessage,
                                    updatedAt: update.createdAt,
                                }
                            }
                            return chat;
                        });
                        return updated.sort((a, b) => new Date(b.updatedAt || b.lastMessage?.createdAt || 0).getTime() - new Date(a.updatedAt || a.lastMessage?.createdAt || 0).getTime());
                    });
                    break;
                case "invited":
                    setChats(prev => {
                        debugLog(update);
                        const updated = prev.map(chat => {
                            if (chat._id === update.chatId) {
                                debugLog("invited: ", update);
                                return {
                                    ...chat,
                                    lastMessage: update.systemMessage,
                                    updatedAt: update.createdAt,
                                }
                            }
                            return chat;
                        });
                        return updated.sort((a, b) => new Date(b.updatedAt || b.lastMessage?.createdAt || 0).getTime() - new Date(a.updatedAt || a.lastMessage?.createdAt || 0).getTime());
                    });
                    break;
            }

        });
        return () => unsubscribe();
    }, [subscribeToChatUpdates])

    return (
        <ChatContext.Provider value={{ chats, setChats, refreshChats, chatLoaded, markChatAsRead, chatUpdates }}>
            {children}
        </ChatContext.Provider>
    );
}

export const useChats = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChats must be used within ChatProvider");
    return context;
};
