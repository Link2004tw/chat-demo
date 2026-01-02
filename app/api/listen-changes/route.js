// import { NextResponse } from "next/server";
// import { db } from "@/config/admin-firebase";
// import { getAuth } from "firebase-admin/auth";
// import {
//   ref,
//   query,
//   orderByChild,
//   limitToLast,
//   get,
//   onChildAdded,
// } from "firebase/database";
// import { decryptMessage } from "@/utils/crypto";

// export async function GET(req) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const roomName = searchParams.get("roomName");
//     const limit = parseInt(searchParams.get("limit") || "25", 10);

//     if (!roomName) {
//       return NextResponse.json({ error: "Missing roomName" }, { status: 400 });
//     }

//     // Auth check
//     const authHeader = req.headers.get("authorization");
//     if (!authHeader?.startsWith("Bearer ")) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//     const idToken = authHeader.split("Bearer ")[1];
//     await getAuth().verifyIdToken(idToken);

//     // SSE headers
//     const headers = {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache",
//       Connection: "keep-alive",
//     };

//     const stream = new ReadableStream({
//       async start(controller) {
//         const encoder = new TextEncoder();
//         let isClosed = false;

//         const safeEnqueue = (data) => {
//           if (!isClosed) {
//             try {
//               controller.enqueue(encoder.encode(data));
//             } catch (err) {
//               console.error("enqueue failed:", err);
//             }
//           }
//         };

//         const messagesRef = ref(db, `rooms/${roomName}/messages`);
//         const messagesQuery = query(
//           messagesRef,
//           orderByChild("timestamp"),
//           limitToLast(1)
//         );

//         const unsubscribe = onChildAdded(messagesQuery, async (snapshot) => {
//           const msg = { ...snapshot.val(), id: snapshot.key };
//           if (!msg.timestamp) return;

//           const decryptedMsg = await decryptMsgSafely(msg);
//           safeEnqueue(
//             `event: message\ndata: ${JSON.stringify(decryptedMsg)}\n\n`
//           );
//         });
//         safeEnqueue(`event: ready\ndata: "connected"\n\n`);
//         // 1. Send initial batch of non-text messages
//         controller._unsubscribe = unsubscribe;
//         const initialQuery = query(
//           messagesRef,
//           orderByChild("timestamp"),
//           limitToLast(limit)
//         );
//         const snapshot = await get(initialQuery);

//         const initialMessages = [];
//         snapshot.forEach((child) => {
//           const msg = { ...child.val(), id: child.key };
//           if (msg.timestamp && msg.type !== "text") {
//             initialMessages.push(msg);
//           }
//         });

//         const decryptedInitialMessages = await Promise.all(
//           initialMessages.map(async (msg) => decryptMsgSafely(msg))
//         );

//         controller.enqueue(
//           encoder.encode(
//             `event: initial\ndata: ${JSON.stringify(
//               decryptedInitialMessages
//             )}\n\n`
//           )
//         );

//         // 2. Listen for new messages
//         const liveQuery = query(
//           messagesRef,
//           orderByChild("timestamp"),
//           limitToLast(1)
//         );
//         onChildAdded(
//           liveQuery,
//           async (snapshot) => {
//             const msg = { ...snapshot.val(), id: snapshot.key };
//             if (!msg.timestamp) return; // skip invalid
//             const decryptedMsg = await decryptMsgSafely(msg);
//             controller.enqueue(
//               encoder.encode(
//                 `event: message\ndata: ${JSON.stringify(decryptedMsg)}\n\n`
//               )
//             );
//           },
//           (error) => {
//             controller.enqueue(
//               encoder.encode(
//                 `event: error\ndata: ${JSON.stringify({
//                   error: error.message,
//                 })}\n\n`
//               )
//             );
//           }
//         );
//       },
//       cancel() {
//         console.log("SSE closed for room:", roomName);
//       },
//     });

//     return new NextResponse(stream, { headers });
//   } catch (error) {
//     console.error("[Listen Non-Text Messages Error]", error);
//     return NextResponse.json(
//       { error: `Failed to listen for messages: ${error.message}` },
//       { status: 500 }
//     );
//   }
// }

// async function decryptMsgSafely(msg) {
//   if (msg.isEncrypted === false) return msg;
//   try {
//     if (msg.type === "file") {
//       msg.fileName = await decryptMessage(msg.fileName);
//       msg.fileURL = await decryptMessage(msg.fileURL);
//     } else {
//       msg.text = await decryptMessage(msg.text);
//     }
//   } catch (err) {
//     console.error("Decryption failed:", err);
//     msg.decryptionFailed = true;
//     msg.text = "[Decryption Failed]";
//   }
//   return msg;
// }

import { NextResponse } from "next/server";
import { db } from "@/config/admin-firebase";
import { getAuth } from "firebase-admin/auth";
import {
  ref,
  query,
  orderByChild,
  limitToLast,
  get,
  onChildAdded,
  off,
} from "firebase/database";
import { decryptMessage } from "@/utils/crypto";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roomName = searchParams.get("roomName");
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    if (!roomName) {
      return NextResponse.json({ error: "Missing roomName" }, { status: 400 });
    }

    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    await getAuth().verifyIdToken(idToken);

    // SSE headers
    const headers = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isClosed = false;
        const safeEnqueue = (data) => {
          if (!isClosed) {
            try {
              controller.enqueue(encoder.encode(data));
            } catch (err) {
              console.error("enqueue failed:", err);
            }
          }
        };

        const messagesRef = ref(db, `rooms/${roomName}/messages`);

        // Send initial batch of non-text messages
        const initialQuery = query(
          messagesRef,
          orderByChild("timestamp"),
          limitToLast(limit)
        );
        const snapshot = await get(initialQuery);
        const initialMessages = [];
        snapshot.forEach((child) => {
          const msg = { ...child.val(), id: child.key };
          if (msg.timestamp && msg.type !== "text") {
            initialMessages.push(msg);
          }
        });
        const decryptedInitial = await Promise.all(
          initialMessages.map((m) => decryptMsgSafely(m))
        );
        safeEnqueue(
          `event: initial\ndata: ${JSON.stringify(decryptedInitial)}\n\n`
        );

        // Send "ready" event
        safeEnqueue(`event: ready\ndata: "connected"\n\n`);

        // Live updates listener
        const liveQuery = query(
          messagesRef,
          orderByChild("timestamp"),
          limitToLast(1)
        );
        const listener = onChildAdded(liveQuery, async (snap) => {
          const msg = { ...snap.val(), id: snap.key };
          if (!msg.timestamp) return;
          const decrypted = await decryptMsgSafely(msg);
          safeEnqueue(`event: message\ndata: ${JSON.stringify(decrypted)}\n\n`);
        });

        // Save cleanup reference
        controller._cleanup = () => {
          isClosed = true;
          off(liveQuery, "child_added", listener);
        };
      },
      cancel(reason) {
        console.log("SSE closed for room:", roomName, "reason:", reason);
        this._cleanup?.();
      },
    });

    return new NextResponse(stream, { headers });
  } catch (error) {
    console.error("[Listen Non-Text Messages Error]", error);
    return NextResponse.json(
      { error: `Failed to listen for messages: ${error.message}` },
      { status: 500 }
    );
  }
}

async function decryptMsgSafely(msg) {
  if (msg.isEncrypted === false) return msg;
  try {
    if (msg.type === "file") {
      msg.fileName = await decryptMessage(msg.fileName);
      msg.fileURL = await decryptMessage(msg.fileURL);
    } else {
      msg.text = await decryptMessage(msg.text);
    }
  } catch (err) {
    console.error("Decryption failed:", err);
    msg.decryptionFailed = true;
    msg.text = "[Decryption Failed]";
  }
  return msg;
}
