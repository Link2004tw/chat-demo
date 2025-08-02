import { auth } from "@/config/firebase";

export default function ImageMessageItem({ message }) {
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

  // Check if the file is likely an image based on extension
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(fileName);

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
          {user}
        </p>
      )}
      {isImage ? (
        <a
          href={fileURL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block"
        >
          <img
            src={fileURL}
            alt={fileName}
            className="max-w-full h-auto rounded-md max-h-64 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "block";
            }}
          />
          <span
            className="hidden text-blue-600 dark:text-blue-400 hover:underline"
            style={{ display: "none" }}
          >
            {fileName} (Image failed to load)
          </span>
        </a>
      ) : (
        <a
          href={fileURL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${
            isCurrentUser
              ? "text-blue-100 hover:underline"
              : "text-blue-600 dark:text-blue-400 hover:underline"
          }`}
        >
          {fileName} (Non-image file)
        </a>
      )}
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