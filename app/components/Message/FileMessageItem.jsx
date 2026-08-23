import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFileArchive,
  FaFileCode,
  FaFileAlt,
  FaFile
} from 'react-icons/fa';
//import { FileTypeIcon } from './chat/HelperFunctions';

// ... rest of your imports


function formatTimestamp(timestamp) {
  if (typeof timestamp === "number" || typeof timestamp === "string") {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return null;
}
// ──────────────────────────────────────────────────────────────
function FileTypeIcon({ filename }) {
  if (!filename) return <FaFile className="h-10 w-10 text-gray-500" />;

  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // You can keep expanding this list based on your needs
  if (['pdf'].includes(ext)) return <FaFilePdf className="h-10 w-10 text-red-600" />;
  if (['doc', 'docx'].includes(ext)) return <FaFileWord className="h-10 w-10 text-blue-700" />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FaFileExcel className="h-10 w-10 text-green-700" />;
  if (['ppt', 'pptx'].includes(ext)) return <FaFilePowerpoint className="h-10 w-10 text-orange-600" />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return <FaFileImage className="h-10 w-10 text-purple-600" />;
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
    return <FaFileVideo className="h-10 w-10 text-pink-600" />;
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
    return <FaFileAudio className="h-10 w-10 text-cyan-600" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FaFileArchive className="h-10 w-10 text-yellow-600" />;
  }
  if (['js', 'ts', 'jsx', 'tsx', 'json', 'css', 'html', 'md', 'sql', 'py', 'java'].includes(ext)) {
    return <FaFileCode className="h-10 w-10 text-gray-700 dark:text-gray-300" />;
  }

  // fallback for unknown types
  return <FaFileAlt className="h-10 w-10 text-gray-500" />;
}
import { TrashIcon } from "lucide-react";
import { debugLog } from '@/lib/logger';

export default function FileMessageItem({ message, messages, onReply, userId, onDelete }) {
  const { author, fileName, content, createdAt, replyTo, caption } = message;
  const id = message.messageId || message._id;
  const isCurrentUser = author?.userId === userId;
  const formattedTimestamp = createdAt ? formatTimestamp(createdAt) : null;
  const repliedMessage = replyTo
    ? messages?.find((msg) => (msg.messageId || msg._id) === (replyTo.messageId || replyTo._id || replyTo))
    : null;

  const handleReplyClick = () => {
    if (repliedMessage) {
      const messageElement = document.querySelector(`[data-message-id="${replyTo}"]`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };
  //debugLog(message.fileName);

  return (
    <div
      className={`max-w-xs px-4 py-3 rounded-xl text-sm break-words relative group ${isCurrentUser
        ? "bg-blue-500 text-white self-end ml-auto"
        : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white"
        }`}
    >
      {!isCurrentUser && (
        <p className="font-bold text-xs text-blue-700 dark:text-blue-300 mb-1">
          {author?.username}
        </p>
      )}

      {repliedMessage && (
        <button
          onClick={handleReplyClick}
          className="mb-2 p-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-xs opacity-75 w-full text-left hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
          aria-label={`View replied message from ${repliedMessage.author?.username}`}
        >
          <p className="font-semibold">Replying to {repliedMessage.author?.username}</p>
          <p className="truncate">
            {repliedMessage.text || repliedMessage.fileName || "Message"}
          </p>
        </button>
      )}

      {content && typeof content === "string" && fileName && typeof fileName === "string" ? (
        <div className="flex items-start gap-3">
          {/* File icon */}
          <div className="shrink-0 pt-1">
            <FileTypeIcon filename={fileName} />
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <a
              href={content}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium hover:underline block ${isCurrentUser ? "text-blue-100" : "text-blue-700 dark:text-blue-300"
                }`}
              aria-label={`Download file ${fileName}`}
            >
              {fileName}
            </a>

            {caption && typeof caption === "string" && caption !== "null" && caption.trim() !== "" && (
              <p
                className={`text-sm italic mt-1 ${isCurrentUser ? "text-white/90" : "text-gray-800 dark:text-gray-200"
                  }`}
              >
                {caption}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-red-500">Unable to display file</p>
      )}

      {formattedTimestamp && (
        <p
          className={`text-xs opacity-75 mt-2 text-right ${isCurrentUser ? "text-white/80" : "text-gray-600 dark:text-gray-400"
            }`}
        >
          {formattedTimestamp}
        </p>
      )}

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isCurrentUser && onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-full p-1 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-xs"
            title="Delete message"
          >
            <TrashIcon className="w-4 h-4 text-red-500" />
          </button>
        )}
        <button
          onClick={() => onReply(message)}
          className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-full p-1 hover:bg-gray-300 dark:hover:bg-gray-500"
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
    </div>
  );
}