import { db } from "@/config/admin-firebase";
import { ref, set } from "firebase/database";

export async function POST(req) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const data = await req.json();
  console.log("data in create-room: ", data);
  const { roomName, createdBy } = data;

  if (!roomName) {
    return new Response(JSON.stringify({ message: "Room name is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await set(ref(db, `rooms/${roomName}`), {
      createdAt: Date.now(),
      createdBy,
      onlineUsers: {},
    });

    return new Response(
      JSON.stringify({ message: "Room created successfully." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating room:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
