import Linkify from "linkify-react";
import { debugLog } from '@/lib/logger';

const renderReplyPreviewContent = (msg) => {   // ← add proper type later
    if (!msg) {
        return <span className="italic text-xs opacity-60">Message not found</span>;
    }

    const isImage = msg.contentType === "image" && msg.content;
    const isFile = msg.contentType === "file" && msg.content;
    const isText = msg.content && typeof msg.content === "string";
    //debugLog(isImage);
    // Common container styles for consistency
    const previewContainer = "flex items-center gap-2.5 text-sm max-w-full";

    if (isImage) {
        return (
            <div className={previewContainer}>
                <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <img
                        src={msg.content}
                        alt={msg.fileName || "Replied image"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>
                <span className="text-gray-700 dark:text-gray-300 truncate font-medium">
                    {msg.fileName || "Photo"}
                </span>
            </div>
        );
    }

    if (isFile) {
        return (
            <div className={previewContainer}>
                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <svg
                        className="w-6 h-6 text-gray-500 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                    </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300 truncate">
                    {msg.fileName || "File"}
                </span>
            </div>
        );
    }

    if (isText) {
        const previewText =
            msg.content.length > 140
                ? msg.content.slice(0, 137) + "…"
                : msg.content;

        return (
            <div className={previewContainer}>
                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <svg
                        className="w-6 h-6 text-gray-500 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                    </svg>
                </div>
                <p className="text-gray-700 dark:text-gray-300 line-clamp-2 break-words">
                    <Linkify
                        options={{
                            className: "text-blue-400 hover:underline",
                            target: "_blank",
                            rel: "noopener noreferrer",
                        }}
                    >
                        {previewText.trim() || "Message"}
                    </Linkify>
                </p>
            </div>
        );
    }

    // Fallback for unknown/empty types
    return (
        <div className={previewContainer}>
            <div className="flex-shrink-0 w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                <svg
                    className="w-6 h-6 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                </svg>
            </div>
            <span className="italic text-gray-500 dark:text-gray-400">
                Media / Empty
            </span>
        </div>
    );
};

export default renderReplyPreviewContent;