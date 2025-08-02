// import { auth } from "@/config/firebase";

// export default function MessageItem({ message }) {
//   const isCurrentUser = message.user === auth.currentUser?.displayName;

//   // Convert Firebase timestamp to readable format
//   const formattedTimestamp = message.timestamp
//     ? new Date(
//         message.timestamp.seconds * 1000 +
//         message.timestamp.nanoseconds / 1000000
//       ).toLocaleString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         year: 'numeric',
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true
//       })
//     : '';

//   return (
//     <div
//       className={`max-w-xs px-4 py-2 rounded-xl text-sm break-words ${
//         isCurrentUser
//           ? "bg-blue-500 text-white self-end ml-auto"
//           : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white"
//       }`}
//     >
//       {!isCurrentUser && (
//         <p className="font-bold text-xs text-blue-700 dark:text-blue-300 mb-1">
//           {message.user}
//         </p>
//       )}
//       <p>{message.text}</p>
//       {formattedTimestamp && (
//         <p className={`text-xs mt-1 opacity-75 ${
//           isCurrentUser ? 'text-white' : 'text-gray-600 dark:text-gray-400'
//         }`}>
//           {formattedTimestamp}
//         </p>
//       )}
//     </div>
//   );
// }

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
        // Ensure the URL has a protocol for <a> href
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
