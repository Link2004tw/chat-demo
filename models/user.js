import { getData, saveData } from "@/utils/database";

export default class User {
  constructor(uid, name, email) {
    this.uid = uid;
    this.name = name;
    this.email = email;
  }

  /**
   * Creates a User instance from Firebase Authentication user
   * @param {Object} user - Firebase Auth user object
   * @returns {User} User instance
   */
  static fromFirebase(user) {
    return new User(user.uid, user.displayName, user.email);
  }

  /**
   * Creates a User instance from RTDB data
   * @param {Object} data - RTDB user data
   * @returns {User} User instance
   */
  static fromRTDBData(data) {
    return new User(data.uid, data.name, data.email);
  }

  /**
   * Converts the User instance to an RTDB-compatible object
   * @returns {Object} RTDB-compatible object
   */
  toJSON() {
    return {
      uid: this.uid,
      name: this.name,
      email: this.email,
    };
  }

  /**
   * Saves the user to RTDB
   * @returns {Promise<void>}
   */
  async saveToRTDB() {
    await saveData(this.toJSON(), `users/${this.uid}`, "set");
  }

  /**
   * Fetches a user from RTDB by UID
   * @param {string} uid - User ID
   * @returns {Promise<User|null>} User instance or null if not found
   */
  static async getUser(uid) {
    const data = await getData(`users/${uid}`);
    if (data) {
      return User.fromRTDBData(data);
    }
    return null;
  }
}