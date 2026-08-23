// app/actions/createChat.js
'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BACKEND_URL } from '@/lib/backendProxy';
import { debugLog } from '@/lib/logger';

// Your Fastify backend URL


const verifyUser = async () => {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
        throw new Error('Unauthorized – no active session');
    }
    return token;
}
export async function createChatAction(name) {
    // Get Clerk session token (server-side)
    const token = await verifyUser();

    // Extract data from formData (or you can accept a plain object)
    // Example: expecting { name: "My Room", type: "public" }
    const body = {
        name,
        // Add other fields as needed: type, description, etc.
    };

    try {
        const response = await fetch(`${BACKEND_URL}/api/chats`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to create chat');
        }

        const data = await response.json();

        // Optional: redirect to the new chat room
        // data should include the new chat's _id or slug
        if (data._id) {
            redirect(`/chat/${data._id}`);
        }

        return data; // Return if you want to handle client-side
    } catch (error) {
        console.error('Create chat error:', error);
        // You can rethrow to show error in UI
        throw error;
    }
}

export async function createChat(prev, formData) {
    // 1. Get values from formData
    const name = formData.get("name")?.toString().trim();
    const access = (formData.get("access")) || "public";
    const participants = (formData.getAll("participants")) || [];
    const canSendMessages = formData.get("canSendMessages") === "on" ? "admins" : "everyone";

    if (!name) {
        return { success: false, error: "Room name is required" };
    }

    // 2. Verify Clerk session / token
    let token;
    try {
        token = await verifyUser();
    } catch (err) {
        return { success: false, error: "Unauthorized" };
    }

    let redirectPath = null;
    let chatId = null;

    try {
        // 3. Check if room already exists by name
        const checkRes = await fetch(`${BACKEND_URL}/api/chats/by-name/${name}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!checkRes.ok) {
            const errorText = await checkRes.json().catch(() => ({}));
            return { success: false, error: errorText.message || "Failed to check room existence" };
        }

        let existingChat = await checkRes.json();

        if (existingChat) {
            // Room exists → redirect to it
            redirectPath = `/chat/${existingChat._id}`;
        } else {
            debugLog(participants);
            // 4. Room does not exist → create it
            const createRes = await fetch(`${BACKEND_URL}/api/chats`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name,
                    access,
                    participantIds: participants,
                    canSendMessages,
                }),
            });

            if (!createRes.ok) {
                const err = await createRes.json().catch(() => ({}));
                throw new Error(err.message || "Failed to create room");
            }

            const newChat = await createRes.json();
            redirectPath = `/chat/${newChat._id}`;
            chatId = newChat._id;
        }

    } catch (err) {
        console.error("Error creating chat:", err);
        return { success: false, error: err.message || "Something went wrong" };
    }

    // if (redirectPath) {
    //     redirect(redirectPath);
    // }

    return { success: true, chatId };
}

export async function createDm(userId) {
    const token = await verifyUser();
    //debugLog(userId);
    const body = {
        userId,
    };

    try {
        const response = await fetch(`${BACKEND_URL}/api/chats/dm/start`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            if (response.status === 403) {
                console.warn(`[dm] User attempted to DM ${userId} but they are not friends (403 Forbidden)`);
            }
            throw new Error(error.message || 'Failed to create chat');
        }

        const data = await response.json();

        // Optional: redirect to the new chat room
        // data should include the new chat's _id or slug
        //debugLog("data:", data);
        // if (data.chatId) {
        //     redirect(`/chat/${data.chatId}`);
        // }

        return { success: true, chatId: data.chatId }; // Return if you want to handle client-side
    } catch (error) {
        console.error('Create chat error:', error);
        // You can rethrow to show error in UI
        throw error;
    }
}

export async function createDmForm(prev, formData) {
    const userId = formData.get('userId');
    return await createDm(userId);
}

export async function joinChat(prev, formData) {
    const token = await verifyUser();
    const chatId = formData.get('chatId');
    const chatType = formData.get('chatType');
    if (chatType === "private") {
        return { success: false, error: "Private chat" };
    }

    try {

        const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/${chatType === "public" ? "join" : "join-request"}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to join chat');
        }

        const data = await response.json();
        debugLog("data:", data);
        if (data.chatId && chatType === "public") {
            redirect(`/chat/${data.chatId}`);
        }

        return { success: true, chatId: data.chatId, chatType }; // Return if you want to handle client-side
    } catch (error) {
        console.error('Join chat error:', error);
        // You can rethrow to show error in UI
        throw error;
    }
}

export async function leaveRoom(prev, formData) {
    const token = await verifyUser();
    const chatId = formData.get('chatId');

    try {
        const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}/leave`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to leave chat');
        }

        const data = await response.json();
        debugLog("data:", data);
        if (data.chatId) {
            redirect(`/chat/${data.chatId}`);
        }

        return data; // Return if you want to handle client-side
    } catch (error) {
        console.error('Leave chat error:', error);
        // You can rethrow to show error in UI
        throw error;
    }
}


export async function inviteByUsername(prev, formData) {
    const token = await verifyUser();
    const chatId = formData.get('chatId');
    const username = formData.get('username');

    try {
        const res = await fetch(`${BACKEND_URL}/api/chats/${chatId}/invite`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username }),
        });

        const data = await res.json();

        if (!res.ok) {
            if (res.status === 403) {
                console.warn(`[invite] User attempted to invite @${username} to room ${chatId} but they are not friends (403 Forbidden)`);
            }
            return {
                success: false,
                error: data.message || "Failed to invite user",
                message: ""
            };
        }

        return {
            success: true,
            message: `Invited @${username}`,
            error: null
        };
    } catch (err) {
        console.error("Invite error:", err);
        return {
            success: false,
            error: err.message || "Something went wrong",
            message: ""
        };
    }
}

export async function changeInviteRequest(requestId, chatId, mode, token) {
    if (mode !== 'accept' && mode !== 'decline') {
        throw new Error('Invalid mode');
    }
    try {
        const res = await fetch(`${BACKEND_URL}/api/chats/${chatId}/requests/${requestId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ action: mode })
        });
        if (!res.ok) {
            throw new Error(res.message);
        }
        const data = await res.json();
        return {
            success: true,
            data
        }
    }
    catch (err) {
        console.error("changeInviteRequest error:", err);
        return {
            success: false,
            error: err.message || "Something went wrong",
            message: ""
        }
    }
}


export async function acceptInvite(prev, formData) {
    const token = await verifyUser();
    const requestId = formData.get('requestId');
    const chatId = formData.get('chatId');
    debugLog("chatId: ", chatId);

    return await changeInviteRequest(requestId, chatId, 'accept', token);



}

export async function declineInvite(prev, formData) {
    const token = await verifyUser();
    const requestId = formData.get('requestId');
    const chatId = formData.get('chatId');
    return await changeInviteRequest(requestId, chatId, 'decline', token);
}


export async function kickUser(prev, formData) {

    const token = await verifyUser();
    const chatId = formData.get('chatId');
    const userId = formData.get('userId');
    debugLog("In the function: ")
    debugLog(chatId, userId);
    try {
        const res = await fetch(`${BACKEND_URL}/api/chats/${chatId}/kick`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ targettedUserId: userId })
        });
        if (!res.ok) {
            debugLog(res);
            throw new Error(res.message);
        }
        const data = await res.json();
        return {
            success: true,
            data
        }
    }
    catch (err) {
        console.error("kickUser error:", err);
        return {
            success: false,
            error: err.message || "Something went wrong",
            message: ""
        }
    }
}



export async function changeRoomAccessType(prev, formData) {
    const token = await verifyUser();
    const chatId = formData.get('chatId');
    const access = formData.get('access');

    if (access !== 'public' && access !== 'private') {
        return { success: false, error: "Invalid access type" };
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/chats/${chatId}/access`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ access })
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Failed to change room access type");
        }

        const data = await res.json();
        return { success: true, data };
    } catch (err) {
        console.error("changeRoomAccessType error:", err);
        return {
            success: false,
            error: err.message || "Something went wrong"
        };
    }
}

export async function changeRoomCanSendMessages(prev, formData) {
    const token = await verifyUser();
    const chatId = formData.get('chatId');
    const canSendMessages = formData.get('canSendMessages');

    if (canSendMessages !== 'everyone' && canSendMessages !== 'admins') {
        return { success: false, error: "Invalid canSendMessages value" };
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/chats/${chatId}/canSendMessages`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ canSendMessages })
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Failed to change room canSendMessages");
        }

        const data = await res.json();
        return { success: true, data };
    } catch (err) {
        console.error("changeRoomCanSendMessages error:", err);
        return {
            success: false,
            error: err.message || "Something went wrong"
        };
    }
}

export async function muteUser(prev, formData) {
    const token = await verifyUser();
    const chatId = formData.get('chatId');
    const userId = formData.get('userId');
    const duration = formData.get('duration');

    try {
        const res = await fetch(`${BACKEND_URL}/api/chats/${chatId}/members/${userId}/mute`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ duration }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Mute failed" }));
            return { success: false, error: err.error || "Mute failed" };
        }
        return { success: true, error: null };
    } catch (err) {
        console.error("muteUser error:", err);
        return { success: false, error: "Mute failed" };
    }
}

export async function unmuteUser(prev, formData) {
    const token = await verifyUser();
    const chatId = formData.get('chatId');
    const userId = formData.get('userId');

    try {
        const res = await fetch(`${BACKEND_URL}/api/chats/${chatId}/members/${userId}/mute`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unmute failed" }));
            return { success: false, error: err.error || "Unmute failed" };
        }
        return { success: true, error: null };
    } catch (err) {
        console.error("unmuteUser error:", err);
        return { success: false, error: "Unmute failed" };
    }
}

export async function muteSelf(prev, formData) {
    const token = await verifyUser();
    const chatId = formData.get('chatId');

    try {
        const res = await fetch(`${BACKEND_URL}/api/chats/${chatId}/mute-me`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!res.ok) return { success: false, error: "Mute failed" };
        return { success: true, error: null };
    } catch (err) {
        console.error("muteSelf error:", err);
        return { success: false, error: "Mute failed" };
    }
}

export async function unmuteSelf(prev, formData) {
    const token = await verifyUser();
    const chatId = formData.get('chatId');

    try {
        const res = await fetch(`${BACKEND_URL}/api/chats/${chatId}/mute-me`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!res.ok) return { success: false, error: "Unmute failed" };
        return { success: true, error: null };
    } catch (err) {
        console.error("unmuteSelf error:", err);
        return { success: false, error: "Unmute failed" };
    }
}

export async function blockUserAction(prev, formData) {
    const token = await verifyUser();
    const userId = formData.get('userId');

    try {
        const res = await fetch(`${BACKEND_URL}/api/user/blocked/${userId}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!res.ok) return { success: false, error: "Block failed" };
        return { success: true, error: null };
    } catch (err) {
        console.error("blockUserAction error:", err);
        return { success: false, error: "Block failed" };
    }
}

export async function unblockUserAction(prev, formData) {
    const token = await verifyUser();
    const userId = formData.get('userId');

    try {
        const res = await fetch(`${BACKEND_URL}/api/user/blocked/${userId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!res.ok) return { success: false, error: "Unblock failed" };
        return { success: true, error: null };
    } catch (err) {
        console.error("unblockUserAction error:", err);
        return { success: false, error: "Unblock failed" };
    }
}

export async function getBlockedUsers() {
    const token = await verifyUser();

    try {
        const res = await fetch(`${BACKEND_URL}/api/user/blocked`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error("getBlockedUsers error:", err);
        return [];
    }
}

export async function changeRoomName(prev, formData) {
    const token = await verifyUser();
    const chatId = formData.get('chatId');
    const name = formData.get('name')?.toString().trim();

    if (!name) {
        return { success: false, error: "Room name is required" };
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/chats/${chatId}/name`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name })
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Failed to change room name");
        }

        const data = await res.json();
        return { success: true, data };
    } catch (err) {
        console.error("changeRoomName error:", err);
        return {
            success: false,
            error: err.message || "Something went wrong"
        };
    }
}