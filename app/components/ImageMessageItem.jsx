import { format } from "date-fns";
import { auth } from "@/config/firebase";

export default function ImageMessageItem({ message }) {
  const { user, timestamp, fileName, fileURL } = message;
  const formattedTime = timestamp
    ? format(timestamp.toDate(), "MMM d, yyyy h:mm a")
    : "Sending...";

  // Check if the file is likely an image based on extension
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(fileName);

  // Determine if the message is from the current user
  const isCurrentUser = auth.currentUser?.displayName === user;

  // Set background class based on whether the message is from the current user
  const backgroundClass = isCurrentUser ? "bg-blue-500" : "bg-gray-300";

  return (
    <div className={`flex flex-col p-3 rounded-lg shadow ${backgroundClass}`}>
      <div className="flex justify-between items-baseline">
        <span className="font-semibold text-gray-900 dark:text-white">
          {user}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formattedTime}
        </span>
      </div>
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
              e.currentTarget.style.display = "none"; // Hide broken image
              e.currentTarget.nextSibling.style.display = "block"; // Show fallback
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
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {fileName} (Non-image file)
        </a>
      )}
    </div>
  );
}
