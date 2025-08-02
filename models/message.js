/**
 * Represents a text message for Firebase Realtime Database
 */
export default class Message {
  /**
   * Creates a Message instance
   * @param {Object} params
   * @param {string} [params.id] - Message ID (optional)
   * @param {string} params.text - The message text
   * @param {string} params.user - Display name of the user who sent the message
   * @param {number} params.timestamp - Unix timestamp in milliseconds
   */
  constructor({ id, text, user, timestamp }) {
    this.id = id || null;
    this.text = text;
    this.user = user;
    this.timestamp = timestamp || Date.now();
    this.type = "text";
  }

  /**
   * Converts the instance to an RTDB-compatible object
   * @returns {Object} RTDB-compatible object
   */
  toRTDB() {
    const data = {
      text: this.text,
      user: this.user,
      timestamp: this.timestamp,
      type: this.type,
    };
    if (this.id) {
      data.id = this.id;
    }
    return data;
  }
}
