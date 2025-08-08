// app/server/fetchAndDecryptMessages.ts
import { db } from "@/config/admin-firebase";
import { webcrypto } from "crypto";
import { get, ref } from "firebase/database";

const subtle = webcrypto.subtle;

export async function getRoomKey() {
  const base64Key = process.env.MESSAGE_ENCRYPTION_KEY;

  if (!base64Key) throw new Error("Encryption key is missing in env!");

  const rawKey = Buffer.from(base64Key, "base64");

  return await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(plainText) {
  const key = await getRoomKey();
  const encoder = new TextEncoder();

  // Generate a random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoder.encode(plainText)
  );

  // Combine IV and ciphertext, and encode as base64
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return Buffer.from(combined).toString("base64");
}

export async function decryptMessage(encryptedBase64) {
  const key = await getRoomKey();
  const encryptedBytes = Buffer.from(encryptedBase64, "base64");

  const iv = encryptedBytes.slice(0, 12); // first 12 bytes
  const ciphertext = encryptedBytes.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Fetches and decrypts messages for a given room
 * @param {string} roomName - The name of the room to fetch messages from
 * @returns {Promise<Array>} - Decrypted messages with { id, text, sender, timestamp }
 */
export async function fetchAndDecryptMessages(roomName) {
  const snapshot = await get(ref(db, `/rooms/${roomName}/messages`));
  const exists = snapshot.exists();
  const data = snapshot.val();
  if (!exists) return [];

  console.log(data);
  //console.log(data);
  const decryptedMessages = await Promise.all(
    Object.entries(data).map(async ([id, msgData]) => {
      try {
        if (msgData.type === "text") {
          const plaintext = await decryptMessage(msgData.text);

          return {
            id,
            text: plaintext,
            timestamp: msgData.timestamp,
            user: msgData.user,
            type: msgData.type,
            replyTo: msgData.replyTo,
          };
        } else {
          const fileName = await decryptMessage(msgData.fileName);
          const fileUrl = await decryptMessage(msgData.fileUrl);
          return {
            id,
            fileName: fileName,
            fileUrl: fileUrl,
            timestamp: msgData.timestamp,
            user: msgData.user,
            type: msgData.type,
            replyTo: msgData.replyTo,
          };
        }
      } catch (err) {
        console.error("Failed to decrypt message:", err);
        return null;
      }
    })
  );

  return decryptedMessages.filter(Boolean);
}
