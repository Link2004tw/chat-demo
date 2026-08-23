// components/MessageItem.jsx
'use client';

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { ClipboardIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import renderReplyPreviewContent from "../chat/ReplyContent"; //from "./chat/ReplyContent";
import { wrapBareUrls } from "../../../lib/markdown";
import { PencilIcon, TrashIcon } from "lucide-react";

function formatTimestamp(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Custom renderers so markdown fits inside chat bubbles: compact headings,
// scrollable dark code blocks, and links that keep the client's blue-
// underline style (react-markdown escapes raw HTML, so nothing here injects
// markup from message content).
const markdownComponents = {
  a: ({ node, ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-300 underline hover:text-blue-200 break-words"
    />
  ),
  pre: ({ node, ...props }) => (
    <pre
      {...props}
      className="bg-black/25 dark:bg-black/40 rounded-lg p-2 overflow-x-auto text-sm my-1"
    />
  ),
  code: ({ node, className, ...props }) => {
    // Fenced blocks carry a language-* class; plain inline code has none.
    const isBlock = typeof className === "string" && className.includes("language-");
    return (
      <code
        {...props}
        className={`font-mono ${isBlock ? "block" : "bg-black/20 rounded px-1 py-0.5"}`}
      />
    );
  },
  h1: ({ node, ...props }) => <h1 {...props} className="text-lg font-bold my-1" />,
  h2: ({ node, ...props }) => <h2 {...props} className="text-base font-bold my-1" />,
  h3: ({ node, ...props }) => <h3 {...props} className="text-base font-semibold my-1" />,
  h4: ({ node, ...props }) => <h4 {...props} className="font-semibold my-1" />,
  h5: ({ node, ...props }) => <h5 {...props} className="font-semibold my-1" />,
  h6: ({ node, ...props }) => <h6 {...props} className="font-semibold my-1" />,
  p: ({ node, ...props }) => <p {...props} className="break-words" />,
  ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-5 my-1" />,
  ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-5 my-1" />,
  blockquote: ({ node, ...props }) => (
    <blockquote {...props} className="border-l-2 border-gray-400 pl-2 my-1" />
  ),
  hr: ({ node, ...props }) => <hr {...props} className="my-2 border-gray-400" />,
  table: ({ node, ...props }) => (
    <table {...props} className="text-sm my-1 border-collapse" />
  ),
  th: ({ node, ...props }) => (
    <th {...props} className="border border-gray-400 px-2 py-1 font-semibold" />
  ),
  td: ({ node, ...props }) => (
    <td {...props} className="border border-gray-400 px-2 py-1" />
  ),
};



export default function MessageItem({ message, messages = [], onReply, userId, onDelete, onEdit }) {
  const {
    _id: messageId,
    content,
    contentType = "text",
    fileName,
    author,
    createdAt,
    isEdited,
    replyTo, // this is the ID of the message being replied to
  } = message;

  const isCurrentUser = author?.userId === userId;
  const username = author?.username || "Unknown";
  const profileImageUrl = author?.profileImageUrl;
  const [editContent, setEditContent] = useState(content || "");
  const formattedTimestamp = formatTimestamp(createdAt);
  const [toast, setToast] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  // Find the message this one is replying to (for preview)
  const repliedMessage = replyTo
    ? messages.find((msg) => msg._id === replyTo._id || msg._id === replyTo)
    : null;

  const handleEditSave = () => {
    if (!editContent.trim()) return;
    onEdit(message._id, editContent); // call WS helper
    setIsEditing(false);
  };

  const handleCopy = async () => {
    const textToCopy = content || fileName || "Message";
    try {
      await navigator.clipboard.writeText(textToCopy);
      setToast("Copied!");
      setTimeout(() => setToast(null), 1800);
    } catch (err) {
      setToast("Copy failed");
      setTimeout(() => setToast(null), 1800);
    }
  };

  const handleReplyClick = () => {
    if (!replyTo) return;
    const targetId = typeof replyTo === "string" ? replyTo : replyTo._id;
    const element = document.querySelector(`[data-message-id="${targetId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight-flash");
      setTimeout(() => element.classList.remove("highlight-flash"), 1800);
    }
  };

  const renderContent = () => {
    if (contentType === "image" && content) {
      return (
        <img
          src={content}
          alt={fileName || "Sent image"}
          className="max-w-full rounded-lg mt-2"
          loading="lazy"
        />
      );
    }

    if (contentType === "file" && content) {
      return (
        <a
          href={content}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition mt-2"
        >
          <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="font-medium truncate max-w-xs">{fileName || "File"}</p>
            <p className="text-sm text-gray-500">Click to download</p>
          </div>
        </a>
      );
    }

    if (content && typeof content === "string") {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={markdownComponents}
        >
          {wrapBareUrls(content)}
        </ReactMarkdown>
      );
    }

    return <p className="italic text-gray-500">Empty message</p>;
  };

  // return (
  //   <div
  //     data-message-id={messageId}
  //     className={`group relative mb-4 flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
  //   >
  //     <div
  //       className={`max-w-prose px-4 py-3 rounded-2xl shadow-sm ${isCurrentUser
  //         ? "bg-blue-600 text-white"
  //         : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
  //         }`}
  //     >
  //       {/* Sender info (only for others) */}
  //       {!isCurrentUser && (

  //         <div className="flex items-center gap-2 mb-2">
  //           <Link href={`/users/${author?.userId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
  //             {profileImageUrl ? (
  //               <img src={profileImageUrl} alt={username} className="w-6 h-6 rounded-full" />
  //             ) : (
  //               <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold text-white">
  //                 {username[0]?.toUpperCase()}
  //               </div>
  //             )}
  //             <p className="font-semibold text-sm">{username}</p>
  //           </Link>
  //         </div>
  //       )}

  //       {/* Reply preview */}
  //       {repliedMessage && (
  //         <button
  //           onClick={handleReplyClick}
  //           className="
  //             mb-3 w-full text-left
  //             p-2.5 rounded-lg
  //             bg-black/10 dark:bg-white/5
  //             border-l-4 border-blue-500/60
  //             hover:bg-black/15 dark:hover:bg-white/10
  //             transition-all duration-150
  //           "
  //         >
  //           <div className="text-xs text-blue-300/90 font-medium flex items-center gap-1.5 mb-1.5">
  //             <span>↳</span>
  //             <span>Replying to {repliedMessage.author?.username || "someone"}</span>
  //           </div>

  //           {renderReplyPreviewContent(repliedMessage)}
  //         </button>
  //       )}

  //       {/* Main content */}
  //       <div>{renderContent()}</div>

  //       {/* Footer */}
  //       <div className="flex items-center justify-between mt-3 text-xs">
  //         <span className="opacity-70">
  //           {formattedTimestamp}
  //           {isEdited && <span className="ml-1 italic">(edited)</span>}
  //         </span>

  //         <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
  //           <button
  //             onClick={handleCopy}
  //             className="p-1.5 rounded hover:bg-white/20 transition"
  //             title="Copy message"
  //           >
  //             <ClipboardIcon className="w-4 h-4" />
  //           </button>

  //           <button
  //             onClick={() => onReply(message)}
  //             className="p-1.5 rounded hover:bg-white/20 transition"
  //             title="Reply"
  //           >
  //             <ArrowUturnLeftIcon className="w-4 h-4" />
  //           </button>
  //           {isCurrentUser && onDelete && (
  //             <button
  //               onClick={() => onDelete(message._id)}
  //               className="p-1.5 rounded hover:bg-red-600/70 transition"
  //               title="Delete message"
  //             >
  //               <TrashIcon className="w-4 h-4 text-red-500" />
  //             </button>
  //           )}
  //         </div>
  //       </div>
  //     </div>

  //     {/* Toast */}
  //     {toast && (
  //       <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/90 text-white text-sm rounded-lg shadow-lg whitespace-nowrap animate-fade-in-out">
  //         {toast}
  //       </div>
  //     )}
  //   </div>
  // );
  return (
    <div
      data-message-id={messageId}
      className={`group relative mb-4 flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-prose px-4 py-3 rounded-2xl shadow-sm ${isCurrentUser
          ? "bg-blue-600 text-white"
          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
          }`}
      >
        {/* Sender info (only for others) */}
        {!isCurrentUser && (
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/users/${author?.userId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={username} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold text-white">
                  {username[0]?.toUpperCase()}
                </div>
              )}
              <p className="font-semibold text-sm">{username}</p>
            </Link>
          </div>
        )}

        {/* Reply preview */}
        {repliedMessage && (
          <button
            onClick={handleReplyClick}
            className="
            mb-3 w-full text-left
            p-2.5 rounded-lg
            bg-black/10 dark:bg-white/5
            border-l-4 border-blue-500/60
            hover:bg-black/15 dark:hover:bg-white/10
            transition-all duration-150
          "
          >
            <div className="text-xs text-blue-300/90 font-medium flex items-center gap-1.5 mb-1.5">
              <span>↳</span>
              <span>Replying to {repliedMessage.author?.username || "someone"}</span>
            </div>

            {renderReplyPreviewContent(repliedMessage)}
          </button>
        )}

        {/* Main content */}
        <div>
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(content);
                  }}
                  className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editContent.trim() && onEdit) {
                      onEdit(messageId, editContent);
                    }
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 text-xs">
          <span className="opacity-70">
            {formattedTimestamp}
            {isEdited && <span className="ml-1 italic">(edited)</span>}
          </span>

          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-white/20 transition"
              title="Copy message"
            >
              <ClipboardIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => onReply(message)}
              className="p-1.5 rounded hover:bg-white/20 transition"
              title="Reply"
            >
              <ArrowUturnLeftIcon className="w-4 h-4" />
            </button>

            {isCurrentUser && (
              <>
                {onDelete && (
                  <button
                    onClick={() => onDelete(messageId)}
                    className="p-1.5 rounded hover:bg-red-600/70 transition"
                    title="Delete message"
                  >
                    <TrashIcon className="w-4 h-4 text-red-500" />
                  </button>
                )}

                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded hover:bg-white/20 transition"
                  title="Edit message"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/90 text-white text-sm rounded-lg shadow-lg whitespace-nowrap animate-fade-in-out">
          {toast}
        </div>
      )}
    </div>
  );


}