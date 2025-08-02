export default class ImageMessage {
  constructor({ id, user, fileName, fileURL, publicId, timestamp }) {
    this.id = id || null; // Firestore ID, null if not yet saved
    this.user = user;
    this.fileName = fileName;
    this.fileURL = fileURL;
    this.publicId = publicId;
    this.type = "file"; // Fixed type for image messages
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
