import { auth } from "@/config/firebase";

export default function MessageItem({ message }) {
  const isCurrentUser = message.user === auth.currentUser?.displayName;

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
    </div>
  );
}
