// utils/User.js
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase"; 

export default class User {
  constructor(uid, name, email) {
    this.uid = uid;
    this.name = name;
    this.email = email;
  }

  static fromFirebase(user) {
    return new User(user.uid, user.displayName, user.email);
  }

  static fromFirestoreData(data) {
    return new User(data.uid, data.name, data.email);
  }

  toJSON() {
    return {
      uid: this.uid,
      name: this.name,
      email: this.email,
    };
  }

  async saveToFirestore() {
    const userRef = doc(db, "users", this.uid);
    await setDoc(userRef, this.toJSON(), { merge: true });
  }

  static async getUser(uid) {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return User.fromFirestoreData(snap.data());
    } else {
      return null;
    }
  }
}
