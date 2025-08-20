import { getAuth } from "firebase-admin/auth";
import { NextResponse } from "next/server";
import { decryptMessage, encryptMessage } from "@/utils/crypto";
import { push, serverTimestamp, ref } from "firebase/database";
import { db } from "@/config/admin-firebase";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const message = formData.get("message");
    const roomName = formData.get("roomName");
    if (!message || !roomName) {
      return NextResponse.json(
        { error: "Missing required fields: message, roomName, base64RoomKey" },
        { status: 400 }
      );
    }

    // Parse message JSON
    let messageData;
    try {
      messageData = JSON.parse(message);
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        { error: "Invalid message JSON" },
        { status: 400 }
      );
    }
    const authHeader = req.headers.get("authorization");
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
    const { text, user, replyTo, type, fileName, fileURL, publicId, caption } =
      messageData;
    if (!user || !type) {
      return NextResponse.json(
        { error: "Missing required message fields: user, userUid, type" },
        { status: 400 }
      );
    }

    let finalText = text;
    let finalFileName = fileName;
    let finalFileURL = fileURL;
    let finalPublicId = publicId;
    let finalCaption = caption || null;

    if (type === "file" && file) {
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: "File size exceeds 10MB limit" },
          { status: 400 }
        );
      }

      const isImage = file.type.startsWith("image/");
      const isZip = file.type === "application/x-zip-compressed";
      const uploadType = isImage ? "image" : isZip ? "raw" : "auto";

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append(
        "upload_preset",
        process.env.CLOUDINARY_UPLOAD_PRESET
      );
      uploadFormData.append("cloud_name", process.env.CLOUDINARY_CLOUD_NAME);
      uploadFormData.append("folder", `rooms/${roomName}`);
      //uploadFormData.append("public_id", publicId); // Explicitly set public_id
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${uploadType}/upload`,
        { method: "POST", body: uploadFormData }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Cloudinary upload failed");
      }

      const data = await response.json();
      finalFileName = await encryptMessage(file.name);
      finalFileURL = await encryptMessage(data.secure_url);
      finalCaption = await encryptMessage(finalCaption);
      console.log(finalCaption);
      finalPublicId = data.public_id;
    } else if (type === "text" && !text) {
      return NextResponse.json(
        { error: "Missing text for text message" },
        { status: 400 }
      );
    } else if (type === "text" && text) {
      finalText = await encryptMessage(finalText);
    }

    const messageToSave = {
      text: finalText || null,
      fileName: finalFileName || null,
      fileURL: finalFileURL || null,
      publicId: finalPublicId || null,
      user,
      timestamp: serverTimestamp(),
      replyTo: replyTo || null,
      type,
      caption: finalCaption,
    };
    const messageRef = await push(
      ref(db, `/rooms/${roomName}/messages`),
      messageToSave
    );
    const decryptedCaption =
      type === "file" && finalCaption
        ? await decryptMessage(finalCaption)
        : null;
    const savedMessage = {
      id: messageRef.key,
      text:
        type === "text" && finalText ? await decryptMessage(finalText) : null,
      fileName:
        type === "file" && finalFileName
          ? await decryptMessage(finalFileName)
          : null,
      fileURL:
        type === "file" && finalFileURL
          ? await decryptMessage(finalFileURL)
          : null,
      publicId: finalPublicId || null,
      user,
      timestamp: serverTimestamp(),
      replyTo: replyTo || null,
      type,
      caption: decryptedCaption,
    };

    return NextResponse.json(savedMessage, { status: 200 });
  } catch (err) {
    console.error("[Send Message Error]", err);
    if (
      err.message.includes("Invalid key") ||
      err.message.includes("encrypt") ||
      err.message.includes("decrypt")
    ) {
      return NextResponse.json(
        { error: "Invalid encryption key" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `Error: ${err.message}` },
      { status: 500 }
    );
  }
}
