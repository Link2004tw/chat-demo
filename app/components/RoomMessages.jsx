// app/components/RoomMessages.jsx
import { fetchAndDecryptMessages } from "@/utils/crypto"; //from "@/lib/fetchAndDecryptMessages";
import ChatPage from "@/app/chat/[room]/page";

export default async function RoomMessages({ roomName, base64RoomKey }) {
  const messages = await fetchAndDecryptMessages(roomName, base64RoomKey);

  return (
    <ChatPage
      initialMessages={messages}
      roomName={roomName}
      base64RoomKey={base64RoomKey}
    />
  );
}
