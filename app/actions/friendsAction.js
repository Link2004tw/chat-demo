"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BACKEND_URL } from '@/lib/backendProxy';
import { debugLog } from '@/lib/logger';


export async function SendFriendRequest(prev, formData) {
    const userId = formData.get('user');
    const status = formData.get('status');
    const requestId = formData.get('requestId') || null;
    const action = formData.get('action'); // Get the button action

    // Get Clerk session token (server-side)
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
        throw new Error('Unauthorized – no active session');
    }

    const body = {
        targetClerkId: userId,
    };

    try {
        // Use action from button instead of status
        if (action === 'Send Request') {
            const response = await fetch(`${BACKEND_URL}/api/user/friends`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                if (response.status === 400 && error.error?.includes('Already friends')) {
                    console.warn(`[friend-request] User attempted to send a friend request to ${userId} but they are already friends`);
                } else if (response.status === 409) {
                    console.warn(`[friend-request] User attempted to send a friend request to ${userId} but one is already pending`);
                } else if (response.status === 400 && error.error?.includes('yourself')) {
                    console.warn(`[friend-request] User attempted to send a friend request to themselves`);
                }
                throw new Error(error.message || 'Failed to send request');
            }

            const data = await response.json();
            debugLog(data);
            revalidatePath("/friends");
            return { success: true, message: data.message || 'Friend request sent!' };
        }
        else if (action === 'Cancel Request') {
            revalidatePath("/friends");
            return await deleteFriendRequestD(requestId);
        }
        else if (action === 'Accept') {
            revalidatePath("/friends");
            return await changeFriendRequest(requestId, 'accept');
        }
        else if (action === 'Decline') {
            revalidatePath("/friends");
            return await changeFriendRequest(requestId, 'decline');
        }
        else if (action === 'Remove Friend') {
            revalidatePath("/friends");
            // Add your remove friend logic here
            return await removeFriend(userId);
        }

    } catch (error) {
        console.error('Friend request error:', error);
        throw error;
    }
}
//mode must be accept or decline
export async function changeFriendRequest(requestId, mode) {

    // Get Clerk session token (server-side)
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
        throw new Error('Unauthorized – no active session');
    }
    if (mode === "send") {

    }
    if (mode !== 'accept' && mode !== 'decline') {
        throw new Error('Invalid mode');
    }
    try {
        const response = await fetch(`${BACKEND_URL}/api/user/friends/requests/${requestId}/${mode}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
            },

        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            if (response.status === 403) {
                console.warn(`[friend-request] User attempted to ${mode} request ${requestId} but is not authorized`);
            } else if (response.status === 400 && error.message?.includes('already processed')) {
                console.warn(`[friend-request] User attempted to ${mode} request ${requestId} but it was already processed`);
            } else if (response.status === 404) {
                console.warn(`[friend-request] User attempted to ${mode} request ${requestId} but it was not found`);
            }
            throw new Error(error.message || `Failed to ${mode} friend request`);
        }

        const data = await response.json();

        debugLog(data);

        return { success: true, message: data.message || `Friend request ${mode}d!` }; // Return if you want to handle client-side
    } catch (error) {
        console.error('Change friend request error:', error);
        // You can rethrow to show error in UI
        throw error;
    }
}

export async function acceptFriendRequest(prev, formData) {
    const requestId = formData.get('requestId');
    const mode = 'accept';
    return await changeFriendRequest(requestId, mode);
}
export async function declineFriendRequest(prev, formData) {
    const requestId = formData.get('requestId');
    const mode = 'decline';
    return await changeFriendRequest(requestId, mode);
}
export async function deleteFriendRequestD(requestId) {
    // Get Clerk session token (server-side)
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
        throw new Error('Unauthorized – no active session');
    }
    try {
        debugLog(requestId);
        const response = await fetch(`${BACKEND_URL}/api/user/friends/requests/${requestId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },

        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            if (response.status === 403) {
                console.warn(`[friend-request] User attempted to cancel request ${requestId} but is not the sender`);
            } else if (response.status === 400 && error.error?.includes('already processed')) {
                console.warn(`[friend-request] User attempted to cancel request ${requestId} but it was already processed`);
            } else if (response.status === 404) {
                console.warn(`[friend-request] User attempted to cancel request ${requestId} but it was not found`);
            }
            throw new Error(error.error || `Failed to delete friend request`);
        }

        const data = await response.json();

        debugLog(data);

        return { success: true, message: data.message || `Friend request deleted!` }; // Return if you want to handle client-side
    } catch (error) {
        console.error('Delete friend request error:', error);
        // You can rethrow to show error in UI
        throw error;
    }
}


export async function deleteFriendRequest(prev, formData) {
    // Get Clerk session token (server-side)
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
        throw new Error('Unauthorized – no active session');
    }
    try {
        const requestId = formData.get('requestId');
        debugLog(requestId);
        return await deleteFriendRequestD(requestId);
    } catch (error) {
        console.error('Delete friend request error:', error);
        // You can rethrow to show error in UI
        throw error;
    }
}


export async function removeFriend(friendId) {
    const { getToken } = await auth();
    const token = await getToken();
    try {
        if (!token) {
            throw new Error("Unauthorized – no active session");
        }
        if (!friendId) {
            throw new Error("Friend ID is required");
        }

        const res = await fetch(`/api/friends/${friendId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData?.error || "Failed to remove friend");
        }

        // Optimistically update the local UI/state
        return prev.filter((friend) => friend.userId !== friendId);
    } catch (err) {
        console.error("removeFriend error:", err);
        throw err;
    }
}
export async function removeFriendAction(prev, formData) {
    const friendId = formData.get("friendId");
    return await removeFriend(friendId);
}


