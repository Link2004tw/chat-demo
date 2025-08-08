import { db } from "@/config/admin-firebase";
import { get, ref } from "firebase/database";

export async function POST(req) {
  try {
    const { roomName } = await req.json();

    if (!roomName) {
      return new Response(
        JSON.stringify({ message: "Room name is required." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const snapshot = await get(ref(db, `rooms/${roomName}`));

    const exists = snapshot.exists();

    return new Response(JSON.stringify({ exists }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error checking room existence:", error);

    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
