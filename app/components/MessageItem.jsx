import { formatTimestamp } from "@/utils/timestamp";
import { ClipboardIcon } from "@heroicons/react/24/outline";

import { auth } from "@/config/firebase";
import Linkify from "linkify-react";

export default function MessageItem({ message }) {
  const { text, user, timestamp } = message;
  const isCurrentUser = user === auth.currentUser?.displayName;
  const formattedTimestamp = timestamp ? formatTimestamp(timestamp) : null;
  
  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message.text);
        alert("Message copied to clipboard!");
      } else {
        alert("Clipboard not supported in this browser.");
      }
    } catch (error) {
      console.error("Failed to copy message:", error);
      alert("Failed to copy message.");
    }
  };

  const renderTextWithLinks = (text) => (
    <Linkify
      options={{
        className: isCurrentUser
          ? "text-blue-100 hover:underline"
          : "text-blue-600 dark:text-blue-400 hover:underline",
        target: "_blank",
        rel: "noopener noreferrer",
      }}
    >
      {text}
    </Linkify>
  );

  return (
    <div
      className={`max-w-xs px-4 py-2 rounded-xl text-sm break-words ${
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
      <p>{renderTextWithLinks(text)}</p>
      {formattedTimestamp && (
        <p
          className={`text-xs opacity-75 mt-1 ${
            isCurrentUser ? "text-white" : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {formattedTimestamp}
        </p>
      )}
      <div>
        <button
          onClick={handleCopy}
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          aria-label="Copy message"
        >
          <ClipboardIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
