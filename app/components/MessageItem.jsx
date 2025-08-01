import { auth } from "@/config/firebase";

export default function MessageItem({ message }) {
  const isCurrentUser = message.user === auth.currentUser?.displayName;
  
  // Format timestamp if it exists
  const formattedTimestamp = message.timestamp 
    ? new Date(message.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : '';

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
      <p>{message.text}</p>
      {formattedTimestamp && (
        <p className={`text-xs mt-1 opacity-75 ${
          isCurrentUser ? 'text-white' : 'text-gray-600 dark:text-gray-400'
        }`}>
          {formattedTimestamp}
        </p>
      )}
    </div>
  );
}