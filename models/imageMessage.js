/**
 * Represents a file message (image or non-image) in Firestore
 */
class ImageMessage {
  /**
   * Creates an ImageMessage instance
   * @param {Object} params
   * @param {string} [params.id] - Firestore document ID (optional)
   * @param {string} params.user - Display name of the user who sent the message
   * @param {string} params.fileName - Original name of the uploaded file
   * @param {string} params.fileURL - Cloudinary secure_url for the file
   * @param {string} params.publicId - Cloudinary public_id for potential deletion
   * @param {Timestamp} params.timestamp - Firestore server timestamp
   * @param {string[]} [params.seenBy] - Array of user UIDs who have seen the message (optional)
   */
  constructor({ id, user, fileName, fileURL, publicId, timestamp, seenBy }) {
    this.id = id || null;
    this.user = user;
    this.fileName = fileName;
    this.fileURL = fileURL;
    this.publicId = publicId;
    this.type = "file";
    this.timestamp = timestamp;
    this.seenBy = seenBy || [];
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
      seenBy: this.seenBy,
    };
    if (this.id) {
      data.id = this.id;
    }
    return data;
  }
}

export default ImageMessage;
