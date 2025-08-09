import { NextResponse } from "next/server";
import { fetchAndDecryptMessages } from "@/utils/crypto"; // from "@/lib/fetchAndDecryptMessages";
import { getAuth } from "firebase-admin/auth";
import { configDotenv } from "dotenv";
configDotenv();
// Note: Firebase Admin is initialized in admin-firebase.js, and db is imported in fetchAndDecryptMessages

export async function POST(request) {
  try {
    const base64RoomKey = process.env.MESSAGE_ENCRYPTION_KEY;
    // Parse request body
    const { roomName, filter } = await request.json();

    // Validate inputs
    if (!roomName || !base64RoomKey) {
      return NextResponse.json({ error: "Missing roomName" }, { status: 400 });
    }

    // Verify user authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid token" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      await getAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Fetch and decrypt messages using existing function
    const messages = await fetchAndDecryptMessages(roomName, filter);
    //console.log("messages in api:", messages);
    // Return decrypted messages
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("Error in get-messages API:", error);
    if (
      error.message.includes("Invalid key") ||
      error.message.includes("decrypt")
    ) {
      return NextResponse.json(
        { error: "Invalid decryption key" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
