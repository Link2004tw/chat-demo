// "use client";
function formatTimestamp(timestamp) {
  if (typeof timestamp === "number" || typeof timestamp === "string") {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return null;
}

import { TrashIcon } from "lucide-react";

export default function ImageMessageItem({ message, messages, onReply, userId, onDelete }) {
  const { author, fileName, content, createdAt, replyTo, caption } = message;
  const id = message.messageId || message._id;
  const isCurrentUser = author?.userId === userId;
  const formattedTimestamp = createdAt ? formatTimestamp(createdAt) : null;
  const repliedMessage = replyTo
    ? messages?.find((msg) => (msg.messageId || msg._id) === (replyTo.messageId || replyTo._id || replyTo))
    : null;

  const handleReplyClick = () => {
    if (repliedMessage) {
      const messageElement = document.querySelector(
        `[data-message-id="${replyTo}"]`
      );
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  return (
    <div
      className={`max-w-xs px-4 py-2 rounded-xl text-sm break-words relative group ${isCurrentUser
        ? "bg-blue-500 text-white self-end ml-auto"
        : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white"
        }`}
    >
      {!isCurrentUser && (
        <p className="font-bold text-xs text-blue-700 dark:text-blue-300 mb-1">
          {author?.username}
        </p>
      )}
      {repliedMessage && (
        <button
          onClick={handleReplyClick}
          className="mb-2 p-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-xs opacity-75 w-full text-left hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
          aria-label={`View replied message from ${repliedMessage.author?.username}`}
        >
          <p className="font-semibold">Replying to {repliedMessage.author?.username}</p>
          <p className="truncate">
            {repliedMessage.text || repliedMessage.fileName || "Message"}
          </p>
        </button>
      )}
      {content &&
        typeof content === "string" &&
        fileName &&
        typeof fileName === "string" ? (
        <div>
          <img
            src={content}
            alt={fileName}
            className="max-w-full h-auto rounded-lg my-2"
            loading="lazy"
          />
          {caption && typeof caption === "string" && caption !== "null" && (
            <p
              className={`text-sm italic mt-1 ${isCurrentUser
                ? "text-white"
                : "text-gray-800 dark:text-gray-200"
                }`}
            >
              {caption}
            </p>
          )}
        </div>
      ) : (
        <p className="text-red-500">Unable to display image</p>
      )}
      {formattedTimestamp && (
        <p
          className={`text-xs opacity-75 mt-1 ${isCurrentUser ? "text-white" : "text-gray-600 dark:text-gray-400"
            }`}
        >
          {formattedTimestamp}
        </p>
      )}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isCurrentUser && onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-full p-1 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-xs"
            title="Delete message"
          >
            <TrashIcon className="w-4 h-4 text-red-500" />
          </button>
        )}
        <button
          onClick={() => onReply(message)}
          className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-full p-1 hover:bg-gray-300 dark:hover:bg-gray-500 text-xs"
          title="Reply to this message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
