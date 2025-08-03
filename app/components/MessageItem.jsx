import { useState } from "react";
import { formatTimestamp } from "@/utils/timestamp";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { auth } from "@/config/firebase";
import Linkify from "linkify-react";

export default function MessageItem({ message }) {
  const { text, user, timestamp } = message;
  const isCurrentUser = user === auth.currentUser?.displayName;
  const formattedTimestamp = timestamp ? formatTimestamp(timestamp) : null;
  const [toast, setToast] = useState(null);

  const handleCopy = async () => {
    try {
      // Primary method: navigator.clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message.text);
        setToast("Message copied to clipboard!");
      } else {
        // Fallback for mobile/older browsers
        const textarea = document.createElement("textarea");
        textarea.value = message.text;
        textarea.style.position = "fixed"; // Avoid scrolling issues
        textarea.style.opacity = "0"; // Hide element
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          const successful = document.execCommand("copy");
          if (successful) {
            setToast("Message copied to clipboard!");
          } else {
            setToast("Failed to copy message.");
          }
        } catch (err) {
          setToast("Failed to copy message.");
        }
        document.body.removeChild(textarea);
      }
    } catch (error) {
      console.error("Failed to copy message:", error);
      setToast("Failed to copy message.");
    }
    // Clear toast after 2 seconds
    setTimeout(() => setToast(null), 2000);
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
    <div className="relative">
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
        <div className="flex items-center justify-between mt-1">
          {formattedTimestamp && (
            <p
              className={`text-xs opacity-75 ${
                isCurrentUser
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {formattedTimestamp}
            </p>
          )}
          <button
            onClick={handleCopy}
            onTouchStart={handleCopy} // Support touch events for mobile
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            aria-label="Copy message"
          >
            <ClipboardIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {toast && (
        <div
          className={`absolute bottom-0 left-0 right-0 mx-auto w-48 p-2 text-sm text-center text-white bg-gray-800 dark:bg-gray-600 rounded-lg transition-opacity duration-500 ${
            toast ? "opacity-100" : "opacity-0"
          }`}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
