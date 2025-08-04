import { db } from "@/config/admin-firebase";

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const { room, uid } = await req.json().catch(() => ({
    room: searchParams.get("room"),
    uid: searchParams.get("uid"),
  }));

  if (!room || !uid) {
    return new Response(JSON.stringify({ error: "Missing room or uid" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const userRef = db.ref(`rooms/${room}/onlineUsers/${uid}`);
    await userRef.set(null);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error removing user from room:", error, { room, uid });
    return new Response(JSON.stringify({ error: "Failed to remove user", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}