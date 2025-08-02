/**
 * Represents a non-image file message in Firestore
 */
class FileMessage {
  /**
   * Creates a FileMessage instance
   * @param {Object} params
   * @param {string} [params.id] - Firestore document ID (optional)
   * @param {string} params.user - Display name of the user who sent the message
   * @param {string} params.fileName - Original name of the uploaded file
   * @param {string} params.fileURL - Cloudinary secure_url for the file
   * @param {string} params.publicId - Cloudinary public_id for potential deletion
   * @param {Timestamp} params.timestamp - Firestore server timestamp
   */
  constructor({ id, user, fileName, fileURL, publicId, timestamp }) {
    this.id = id || null; // Firestore ID, null if not yet saved
    this.user = user;
    this.fileName = fileName;
    this.fileURL = fileURL;
    this.publicId = publicId;
    this.type = "file"; // Fixed type for file messages
    this.timestamp = timestamp;
  }

  /**
   * Converts the instance to a Firestore-compatible object
   * @returns {Object} Firestore-compatible object
   */
  toFirestore() {
    const data = {
      user: this.user,
      fileName: this.fileName,
      fileURL: this.fileURL,
      publicId: this.publicId,
      type: this.type,
      timestamp: this.timestamp,
    };
    // Omit id if null (when creating new documents)
    if (this.id) {
      data.id = this.id;
    }
    return data;
  }
}

export default FileMessage;