import { saveData } from "@/utils/database";

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");
  const room = searchParams.get("room");

  if (!uid || !room) {
    return new Response(JSON.stringify({ error: "Missing params" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await saveData(null, `rooms/${room}/onlineUsers/${uid}`, "set");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}