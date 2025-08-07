export async function generateKey() {
  return await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(message, key) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(message);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for AES-GCM
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoded
  );
  return {
    iv: btoa(String.fromCharCode(...iv)), // Base64 encode IV
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))), // Base64 encode ciphertext
  };
}

export async function decryptMessage(encryptedData, key) {
  const decoder = new TextDecoder();
  const iv = Uint8Array.from(atob(encryptedData.iv), (c) => c.charCodeAt(0));
  const encrypted = Uint8Array.from(atob(encryptedData.encrypted), (c) =>
    c.charCodeAt(0)
  );
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encrypted
  );
  return decoder.decode(decrypted);
}

export function getRoomKey(roomName) {
  // For demo, retrieve key from localStorage or generate a new one
  // In production, use secure key exchange or storage
  let key = localStorage.getItem(`encryption_key_${roomName}`);
  if (!key) {
    key = generateKey().then((k) => {
      const exportedKey = crypto.subtle.exportKey("raw", k).then((keyData) => {
        const keyStr = btoa(String.fromCharCode(...new Uint8Array(keyData)));
        localStorage.setItem(`encryption_key_${roomName}`, keyStr);
        return k;
      });
      return exportedKey;
    });
    return key;
  }
  return crypto.subtle.importKey(
    "raw",
    Uint8Array.from(atob(key), (c) => c.charCodeAt(0)),
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}
