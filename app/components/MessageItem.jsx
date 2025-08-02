import { auth } from "@/config/firebase";

export default function MessageItem({ message }) {
  const isCurrentUser = message.user === auth.currentUser?.displayName;

  // Convert Firebase timestamp to readable format
  const formattedTimestamp = message.timestamp
    ? new Date(
        message.timestamp.seconds * 1000 +
          message.timestamp.nanoseconds / 1000000
      ).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  // Function to parse text and convert URLs to clickable links
  const renderTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)/gi;
    const parts = text.split(urlRegex).filter(Boolean);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const href = part.startsWith("http") ? part : `https://${part}`;
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${
              isCurrentUser
                ? "text-blue-100 hover:underline"
                : "text-blue-600 dark:text-blue-400 hover:underline"
            }`}
            aria-label={`Link to ${part}`}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Check if message is seen by others (exclude current user)
  const isSeen = isCurrentUser && message.seenBy && message.seenBy.length > 0;

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
          {message.user}
        </p>
      )}
      <p>{renderTextWithLinks(message.text)}</p>
      <div className="flex justify-between items-baseline mt-1">
        {formattedTimestamp && (
          <p
            className={`text-xs opacity-75 ${
              isCurrentUser ? "text-white" : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {formattedTimestamp}
          </p>
        )}
        {isSeen && (
          <span
            className={`text-xs opacity-75 ${
              isCurrentUser ? "text-white" : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Seen
          </span>
        )}
      </div>
    </div>
  );
}