import { db } from "@/config/admin-firebase";
import { encryptMessage, getRoomKey } from "@/utils/crypto"; //from "@/lib/crypto"; // Your crypto file
import { push, ref, set } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const { message, roomId, userId } = await req.json();
  const text = message.text;
  if (!message || !roomId || !userId) {
    return NextResponse.json(
      { error: `Missing required fields` },
      { status: 400 }
    );
  }

  try {
    const key = await getRoomKey();
    const encryptedData = await encryptMessage(text, key);
    //console.log(message);
    //console.log(encryptedData);
    message.text = encryptedData;
    await push(ref(db, `/rooms/${roomId}/messages`), {
      ...message,
    });
    return NextResponse.json({ message: "message saved" }, { status: 200 });
  } catch (err) {
    console.error("[Send Message Error]", err);
    return NextResponse.json({ error: `error: ${err}` }, { status: 401 });
  }
}
