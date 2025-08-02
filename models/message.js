/**
 * Represents a text message in Firestore
 */
export default class Message {
  /**
   * Creates a Message instance
   * @param {Object} params
   * @param {string} [params.id] - Firestore document ID (optional)
   * @param {string} params.text - The message text
   * @param {string} params.user - Display name of the user who sent the message
   * @param {Timestamp} params.timestamp - Firestore server timestamp
   * @param {string[]} [params.seenBy] - Array of user UIDs who have seen the message (optional)
   */
  constructor({ id, text, user, timestamp, seenBy }) {
    this.id = id || null;
    this.text = text;
    this.user = user;
    this.timestamp = timestamp;
    this.type = "text";
    this.seenBy = seenBy || [];
  }

  /**
   * Converts the instance to a Firestore-compatible object
   * @returns {Object} Firestore-compatible object
   */
  toFirestore() {
    const data = {
      text: this.text,
      user: this.user,
      timestamp: this.timestamp,
      type: this.type,
      seenBy: this.seenBy,
    };
    if (this.id) {
      data.id = this.id;
    }
    return data;
  }
}
