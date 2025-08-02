import { auth } from "@/config/firebase";

export default function MessageItem({ message }) {
  const isCurrentUser = message.user === auth.currentUser?.displayName;

  // Convert Firebase timestamp to readable format
  const formattedTimestamp = message.timestamp
    ? new Date(
        message.timestamp.seconds * 1000 +
        message.timestamp.nanoseconds / 1000000
      ).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
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

// import { format } from "date-fns";

// export default function MessageItem({ message }) {
//   const { text, user, timestamp, type, fileName, fileURL } = message;
//   const formattedTime = timestamp
//     ? format(new Date(timestamp.toDate()), "MMM d, yyyy h:mm a")
//     : "Sending...";

//   return (
//     <div className="flex flex-col p-3 rounded-lg bg-white dark:bg-gray-800 shadow">
//       <div className="flex justify-between items-baseline">
//         <span className="font-semibold text-gray-900 dark:text-white">
//           {user}
//         </span>
//         <span className="text-xs text-gray-500 dark:text-gray-400">
//           {formattedTime}
//         </span>
//       </div>
//       {type === "text" ? (
//         <p className="text-gray-800 dark:text-gray-200">{text}</p>
//       ) : (
//         <a
//           href={fileURL}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-blue-600 dark:text-blue-400 hover:underline"
//         >
//           {fileName}
//         </a>
//       )}
//     </div>
//   );
// }
