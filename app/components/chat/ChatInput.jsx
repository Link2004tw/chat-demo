'use client'

import { useState, useRef } from 'react'
import {
    ArrowUturnLeftIcon,
    XMarkIcon,
    PaperClipIcon,
    PhotoIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline'
import { usePathname, useRouter } from 'next/navigation';
import { useDebounce } from '@/app/chat/[room]/page';
import { debugLog } from '@/lib/logger';

export default function ChatInput({
    sendMessage,       // for text messages
    sendFile,          // ← NEW: from useWebSocket hook
    isConnected,
    replyingTo,
    setReplyingTo,
    onTyping,
}) {
    const [message, setMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef(null);
    const router = useRouter();
    const pathname = usePathname();
    const typingDebounce = useDebounce(onTyping, 500);
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side size check (should match backend limit)
        if (file.size > 6 * 1024 * 1024) { // 6MB – adjust according to your WS limit
            alert('File is too large (max 6MB for direct send)')
            return
        }

        setSelectedFile(file)
    }

    const clearFile = () => {
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!isConnected) return
        if (!message.trim() && !selectedFile) return

        setIsSending(true)

        try {
            if (selectedFile) {
                await sendFile(selectedFile, replyingTo?.messageId ?? null, message.trim())

            }

            if (replyingTo) {
                router.replace(pathname);
            }
            if (message.trim() && !selectedFile) {
                //debugLog('Sending text message:', message.trim())
                sendMessage(message.trim(), replyingTo?.messageId ?? null);
            }
            setMessage('')
            setReplyingTo(null)
            setSelectedFile(null)
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err) {
            console.error('Error sending message/file:', err)
            alert('Failed to send. Please try again.')
        } finally {
            setIsSending(false)
        }
    }


    const canSend = (message.trim() || !!selectedFile) && isConnected && !isSending
    return (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 z-10">
            <div className="max-w-4xl mx-auto px-4 pb-4 pt-2">

                {/* Reply preview */}
                {replyingTo && (
                    <div className="mb-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500 flex items-start gap-3 text-sm">
                        <ArrowUturnLeftIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="text-gray-500 dark:text-gray-400">
                                Replying to <span className="font-medium">{replyingTo.author?.username}</span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 truncate">
                                {replyingTo?.contentType === "text" ? replyingTo.content : replyingTo.fileName || 'Media'}
                            </p>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 -mt-1"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Selected file preview */}
                {selectedFile && (
                    <div className="mb-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center gap-3 text-sm border border-gray-200 dark:border-gray-700">
                        {selectedFile.type.startsWith('image/') ? (
                            <PhotoIcon className="w-6 h-6 text-blue-500" />
                        ) : (
                            <DocumentTextIcon className="w-6 h-6 text-blue-500" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Sending...
                            </p>
                        </div>
                        <button
                            onClick={clearFile}
                            className="text-gray-500 hover:text-red-600 transition"
                            disabled={isSending}
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Main input area */}
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending || !!selectedFile}
                        className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                        title="Attach file or photo"
                    >
                        <PaperClipIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>

                    <textarea
                        value={message}
                        onChange={(e) => {
                            typingDebounce();
                            setMessage(e.target.value)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder={isSending ? "Sending..." : "Type a message..."}
                        disabled={isSending}
                        className="flex-1 rounded-2xl px-5 py-3 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition disabled:opacity-60 resize-none max-h-32"
                        autoFocus
                        rows={1}
                    />

                    <button
                        type="submit"
                        disabled={!canSend}
                        className={`
              px-6 py-3 rounded-full font-medium text-white transition-all
              ${canSend
                                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm'
                                : 'bg-gray-400 cursor-not-allowed opacity-60'
                            }
            `}
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    )
}