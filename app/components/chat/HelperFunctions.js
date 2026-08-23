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

/**
 * Ensures a message object has all fields required by components.
 */


/**
 * Centralized normalization logic to handle field aliases from different sources (REST, WS, Models).
 */
export function normalizeMessage(m) {
    if (!m) return null;

    // 1. Identify ID
    const id = m._id || m.messageId || m.id || `temp-${Date.now()}`;

    // 2. Identify Content/URL (for files)
    const content = m.content || m.fileURL || m.text || "";

    // 3. Identify Filename (for files)
    const fileName = m.fileName || m.filename || m.name || null;

    // 4. Identify Timestamp
    const createdAt = m.createdAt || m.timestamp || new Date().toISOString();

    // 5. Identify Author
    const author = m.author || {
        userId: m.userId || (typeof m.user === 'object' ? m.user?.userId : m.senderId),
        username: m.username || (typeof m.user === 'object' ? m.user?.username : (typeof m.user === 'string' ? m.user : "Unknown")),
        profileImageUrl: m.profileImageUrl || (typeof m.user === 'object' ? m.user?.profileImageUrl : null)
    };

    // 6. Identify Content Type
    const contentType = m.contentType || (m.fileName || m.filename || m.name ? 'file' : 'text');

    return {
        ...m,
        _id: id,
        messageId: id,
        content,
        fileName,
        createdAt,
        author,
        contentType,
    };
}

export function FileTypeIcon({ filename }) {
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