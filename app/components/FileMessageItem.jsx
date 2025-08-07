import { auth } from "@/config/firebase";

function formatTimestamp(timestamp) {
  if (typeof timestamp === "number" || typeof timestamp === "string") {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return null;
}

export default function FileMessageItem({ message, messages, onReply }) {
  const { user, fileName, fileURL, timestamp, replyTo, id } = message;
  const isCurrentUser = user === auth.currentUser?.displayName;
  const formattedTimestamp = timestamp ? formatTimestamp(timestamp) : null;
  const repliedMessage = replyTo
    ? messages?.find((msg) => msg.id === replyTo)
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
      className={`max-w-xs px-4 py-2 rounded-xl text-sm break-words relative group ${
        isCurrentUser
          ? "bg-blue-500 text-white self-end ml-auto"
          : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white"
      }`}
    >
      {!isCurrentUser && (
        <p className="font-bold text-xs text-blue-700 dark:text-blue-300 mb-1">
          {user}
        </p>
      )}
      {repliedMessage && (
        <button
          onClick={handleReplyClick}
          className="mb-2 p-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-xs opacity-75 w-full text-left hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
          aria-label={`View replied message from ${repliedMessage.user}`}
        >
          <p className="font-semibold">Replying to {repliedMessage.user}</p>
          <p className="truncate">
            {repliedMessage.text || repliedMessage.fileName || "Message"}
          </p>
        </button>
      )}
      {fileURL &&
      typeof fileURL === "string" &&
      fileName &&
      typeof fileName === "string" ? (
        <a
          href={fileURL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${
            isCurrentUser
              ? "text-blue-100 hover:underline"
              : "text-blue-600 dark:text-blue-400 hover:underline"
          }`}
          aria-label={`Download file ${fileName}`}
        >
          {fileName}
        </a>
      ) : (
        <p className="text-red-500">Unable to display file</p>
      )}
      {formattedTimestamp && (
        <p
          className={`text-xs opacity-75 mt-1 ${
            isCurrentUser ? "text-white" : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {formattedTimestamp}
        </p>
      )}
      <button
        onClick={() => onReply(id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-full p-1 hover:bg-gray-300 dark:hover:bg-gray-500 text-xs"
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
  );
}
