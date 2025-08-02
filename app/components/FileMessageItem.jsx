import { auth } from "@/config/firebase";

export default function FileMessageItem({ message }) {
  const { user, timestamp, fileName, fileURL } = message;
  const isCurrentUser = auth.currentUser?.displayName === user;

  // Convert Firebase timestamp to readable format
  const formattedTimestamp = timestamp
    ? new Date(
        timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
      ).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";

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
      {formattedTimestamp && (
        <p
          className={`text-xs mt-1 opacity-75 ${
            isCurrentUser ? "text-white" : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {formattedTimestamp}
        </p>
      )}
    </div>
  );
}
