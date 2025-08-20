// import { useState } from "react";
// import { auth } from "@/config/firebase";
// import Linkify from "linkify-react";
// import { ClipboardIcon } from "@heroicons/react/24/outline";

// function formatTimestamp(timestamp) {
//   if (typeof timestamp === "number" || typeof timestamp === "string") {
//     return new Date(timestamp).toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   }
//   return null;
// }

// export default function MessageItem({ message, messages, onReply }) {
//   const { user, id, text, timestamp, replyTo } = message;
//   const isCurrentUser = user === auth.currentUser?.displayName;
//   const formattedTimestamp = timestamp ? formatTimestamp(timestamp) : null;
//   const [toast, setToast] = useState(null);

//   const repliedMessage = replyTo
//     ? messages?.find((msg) => msg.id === replyTo)
//     : null;

//   const handleCopy = async () => {
//     if (!text || typeof text !== "string") {
//       setToast("Cannot copy: Invalid message content");
//       setTimeout(() => setToast(null), 2000);
//       return;
//     }
//     try {
//       await navigator.clipboard.writeText(text);
//       setToast("Message copied!");
//       setTimeout(() => setToast(null), 2000);
//     } catch (err) {
//       setToast("Failed to copy message");
//       setTimeout(() => setToast(null), 2000);
//     }
//   };

//   const handleReplyClick = () => {
//     if (repliedMessage) {
//       const messageElement = document.querySelector(
//         `[data-message-id="${replyTo}"]`
//       );
//       if (messageElement) {
//         messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
//       }
//     }
//   };

//   // const renderTextWithLinks = (text) => (
//   //   <Linkify
//   //     options={{
//   //       className: isCurrentUser
//   //         ? "text-blue-100 hover:underline"
//   //         : "text-blue-600 dark:text-blue-400 hover:underline",
//   //       target: "_blank",
//   //       rel: "noopener noreferrer",
//   //     }}
//   //   >
//   //     {text}
//   //   </Linkify>
//   // );

//   const renderTextWithLinks = (text) => {
//     if (!text || typeof text !== "string") {
//       return <p className="text-red-500">Unable to display message</p>;
//     }
//     // Split text by newlines and render each segment with Linkify
//     const lines = text.split("\n");
//     return lines.map((line, index) => (
//       <span key={index}>
//         <Linkify
//           options={{
//             className: isCurrentUser
//               ? "text-blue-100 hover:underline"
//               : "text-blue-600 dark:text-blue-400 hover:underline",
//             target: "_blank",
//             rel: "noopener noreferrer",
//           }}
//         >
//           {line}
//         </Linkify>
//         {index < lines.length - 1 && <br />} {/* Add <br> between lines */}
//       </span>
//     ));
//   };
//   return (
//     <div className="relative group">
//       <div
//         className={`max-w-xs px-4 py-2 rounded-xl text-sm break-words ${
//           isCurrentUser
//             ? "bg-blue-500 text-white self-end ml-auto"
//             : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white"
//         }`}
//       >
//         {!isCurrentUser && (
//           <p className="font-bold text-xs text-blue-700 dark:text-blue-300 mb-1">
//             {user}
//           </p>
//         )}
//         {repliedMessage && (
//           <button
//             onClick={handleReplyClick}
//             className="mb-2 p-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-xs opacity-75 w-full text-left hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
//             aria-label={`View replied message from ${repliedMessage.user}`}
//           >
//             <p className="font-semibold">Replying to {repliedMessage.user}</p>
//             <p className="truncate">
//               {repliedMessage.text || repliedMessage.fileName || "Message"}
//             </p>
//           </button>
//         )}
//         {text && typeof text === "string" ? (
//           <p>{renderTextWithLinks(text)}</p>
//         ) : (
//           <p className="text-red-500">Unable to display message</p>
//         )}
//         <div className="flex items-center justify-between mt-1">
//           {formattedTimestamp && (
//             <p
//               className={`text-xs opacity-75 ${
//                 isCurrentUser
//                   ? "text-white"
//                   : "text-gray-600 dark:text-gray-400"
//               }`}
//             >
//               {formattedTimestamp}
//             </p>
//           )}
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={handleCopy}
//               onTouchStart={handleCopy}
//               className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
//               aria-label="Copy message"
//             >
//               <ClipboardIcon className="h-4 w-4" />
//             </button>
//             <button
//               onClick={() => onReply(id)}
//               className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
//               title="Reply to this message"
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-4 w-4"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
//                 />
//               </svg>
//             </button>
//           </div>
//         </div>
//       </div>
//       {toast && (
//         <div
//           className={`absolute bottom-0 left-0 right-0 mx-auto w-48 p-2 text-sm text-center text-white bg-gray-800 dark:bg-gray-600 rounded-lg transition-opacity duration-500 ${
//             toast ? "opacity-100" : "opacity-0"
//           }`}
//         >
//           {toast}
//         </div>
//       )}
//     </div>
//   );
// }

import { useState } from "react";
import { auth } from "@/config/firebase";
import Linkify from "linkify-react";
import { ClipboardIcon } from "@heroicons/react/24/outline";

function formatTimestamp(timestamp) {
  if (typeof timestamp === "number" || typeof timestamp === "string") {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return null;
}

export default function MessageItem({ message, messages, onReply }) {
  const { user, id, text, timestamp, replyTo } = message;
  const isCurrentUser = user === auth.currentUser?.displayName;
  const formattedTimestamp = timestamp ? formatTimestamp(timestamp) : null;
  const [toast, setToast] = useState(null);

  const repliedMessage = replyTo
    ? messages?.find((msg) => msg.id === replyTo)
    : null;

  const handleCopy = async () => {
    if (!text || typeof text !== "string") {
      setToast("Cannot copy: Invalid message content");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setToast("Message copied!");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setToast("Failed to copy message");
      setTimeout(() => setToast(null), 2000);
    }
  };

  const handleReplyClick = () => {
    if (repliedMessage) {
      const messageElement = document.querySelector(
        `[data-message-id="${replyTo}"]`
      );
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const renderTextWithLinks = (text) => {
    if (!text || typeof text !== "string") {
      return <p className="text-red-500">Unable to display message</p>;
    }
    const lines = text.split("\n");
    return lines.map((line, index) => (
      <span key={index}>
        <Linkify
          options={{
            className: isCurrentUser
              ? "text-blue-100 hover:underline"
              : "text-blue-600 dark:text-blue-400 hover:underline",
            target: "_blank",
            rel: "noopener noreferrer",
          }}
        >
          {line}
        </Linkify>
        {index < lines.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="relative group">
      <div
        className={`max-w-xs px-4 py-2 rounded-xl text-sm break-words relative ${
          isCurrentUser
            ? "bg-blue-500 text-white self-end ml-auto"
            : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white"
        }`}
      >
        <div className="relative">
          {!isCurrentUser && (
            <p className="font-bold text-xs text-blue-700 dark:text-blue-300 mb-1">
              {user}
            </p>
          )}
          {repliedMessage && (
            <button
              onClick={handleReplyClick}
              className="mb-2 p-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-xs opacity-75 w-full text-left hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              aria-label={`View replied message from ${repliedMessage.user}`}
            >
              <p className="font-semibold">Replying to {repliedMessage.user}</p>
              <p className="truncate">
                {repliedMessage.text || repliedMessage.fileName || "Message"}
              </p>
            </button>
          )}
          {text && typeof text === "string" ? (
            <p>{renderTextWithLinks(text)}</p>
          ) : (
            <p className="text-red-500">Unable to display message</p>
          )}
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
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                onTouchStart={handleCopy}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                aria-label="Copy message"
              >
                <ClipboardIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={() => onReply(id)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-full p-1 hover:bg-gray-300 dark:hover:bg-gray-500 text-xs"
          title="Reply to this message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
            />
          </svg>
        </button>
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
