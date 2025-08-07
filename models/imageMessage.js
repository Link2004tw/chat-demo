/**
 * Represents a file message (image or non-image) for Firebase Realtime Database
 */
export default class ImageMessage {
  /**
   * Creates an ImageMessage instance
   * @param {Object} params
   * @param {string} [params.id] - Message ID (optional)
   * @param {string} params.user - Display name of the user who sent the message
   * @param {string} params.fileName - Name of the uploaded file
   * @param {string} params.fileURL - URL of the file in Cloudinary
   * @param {string} params.publicId - Cloudinary public ID for the file
   * @param {number} params.timestamp - Unix timestamp in milliseconds
   * @param {string} [params.replyTo] - ID of the message being replied to (optional)
   */
  constructor({ id, user, fileName, fileURL, publicId, timestamp, replyTo }) {
    this.id = id || null;
    this.user = user;
    this.fileName = fileName;
    this.fileURL = fileURL;
    this.publicId = publicId;
    this.type = "file";
    this.timestamp = timestamp || Date.now();
    this.replyTo = replyTo || null;
  }

  /**
   * Converts the instance to an RTDB-compatible object
   * @returns {Object} RTDB-compatible object
   */
  toRTDB() {
    const data = {
      user: this.user,
      fileName: this.fileName,
      fileURL: this.fileURL,
      publicId: this.publicId,
      type: this.type,
      timestamp: this.timestamp,
    };
    if (this.id) {
      data.id = this.id;
    }
    if (this.replyTo) {
      data.replyTo = this.replyTo;
    }
    return data;
  }
}