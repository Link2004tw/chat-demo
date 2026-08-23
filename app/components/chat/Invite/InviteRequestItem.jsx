import React from "react";
import { debugLog } from '@/lib/logger';

const InviteRequestItem = ({ request, onAccept, onReject }) => {
    debugLog(request);
    return (
        <div className="flex justify-between items-center dark:bg-gray-800 p-3 my-2 border border-gray-300 rounded-lg bg-gray-50">
            <span className="text-white font-medium">{request.user.username}</span>

            <div className="flex gap-2">
                {/* Accept Form */}
                <form action={onAccept}>
                    <input type="hidden" name="requestId" value={request._id} />
                    <input type="hidden" name="chatId" value={request.chat} />
                    <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded dark:bg-green-600 dark:hover:bg-green-700"
                    >
                        Accept
                    </button>
                </form>

                {/* Reject Form */}
                <form action={onReject}>
                    <input type="hidden" name="requestId" value={request._id} />
                    <input type="hidden" name="chatId" value={request.chatId} />
                    <button
                        type="submit"
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded"
                    >
                        Reject
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InviteRequestItem;
