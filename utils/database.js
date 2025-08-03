import { ref, get, set, push, onValue } from "firebase/database";
import { db as rtdb } from "@/config/firebase";

/**
 * Fetches data from the specified RTDB path
 * @param {string} url - RTDB path (e.g., "users/uid1", "rooms/room1/messages")
 * @returns {Promise<any|null>} Data from the path or null if not found
 */
export async function getData(url) {
  try {
    const dataRef = ref(rtdb, url);
    const snapshot = await get(dataRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
}

/**
 * Saves data to the specified RTDB path
 * @param {any} data - Data to save
 * @param {string} url - RTDB path (e.g., "users/uid1", "rooms/room1/messages")
 * @param {string} [mode="set"] - Write mode: "set" (overwrite) or "push" (append)
 * @returns {Promise<void>}
 */
export async function saveData(data, url, mode = "set") {
  try {
    const dataRef = ref(rtdb, url);
    if (mode === "push") {
      await push(dataRef, data);
    } else {
      await set(dataRef, data);
    }
  } catch (error) {
    console.error(`Error saving data to ${url}:`, error);
    throw new Error(`Failed to save data: ${error.message}`);
  }
}
