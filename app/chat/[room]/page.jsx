// "use client";

// import { useEffect, useState, useRef } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { auth, db } from "@/config/firebase";
// import {
//   addDoc,
//   collection,
//   doc,
//   deleteDoc,
//   onSnapshot,
//   orderBy,
//   query,
//   serverTimestamp,
//   setDoc,
// } from "firebase/firestore";

// import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import MessageItem from "../../components/MessageItem";
// import ImageMessageItem from "../../components/ImageMessageItem";
// import Cookies from "universal-cookie";
// import ImageMessage from "@/models/imageMessage";
// //import { configDotenv } from "dotenv";
// const cookies = new Cookies();

// //configDotenv();

// export default function ChatPage() {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [onlineUsers, setOnlineUsers] = useState([]);
//   const [currentUser, setCurrentUser] = useState(null);
//   const fileInputRef = useRef(null);

//   const router = useRouter();
//   const params = useParams();
//   const roomName = params?.room || null;

//   // Auth check
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       const token = cookies.get("auth-token");
//       if (!user || !token) {
//         router.replace("/");
//       } else {
//         setCurrentUser(user);
//       }
//     });
//     return () => unsubscribe();
//   }, [router]);

//   // Real-time messages
//   const messagesRef = collection(db, `rooms/${roomName}/messages`);

//   useEffect(() => {
//     if (!roomName) return;

//     const q = query(messagesRef, orderBy("timestamp"));
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const msgs = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
//       setMessages(msgs);
//     });
//     return () => unsubscribe();
//   }, [roomName]);

//   // Track presence
//   useEffect(() => {
//     if (!roomName || !currentUser) return;

//     const userDocRef = doc(
//       db,
//       `rooms/${roomName}/onlineUsers`,
//       currentUser.uid
//     );
//     const updatePresence = () =>
//       setDoc(
//         userDocRef,
//         {
//           uid: currentUser.uid,
//           displayName: currentUser.displayName,
//           lastSeen: Date.now(),
//         },
//         { merge: true }
//       );

//     updatePresence();
//     const interval = setInterval(updatePresence, 10000);

//     const handleUnload = () => {
//       if (roomName && currentUser?.uid) {
//         navigator.sendBeacon(
//           `/api/remove-user?room=${roomName}&uid=${currentUser.uid}`
//         );
//       }
//     };

//     window.addEventListener("beforeunload", handleUnload);

//     return () => {
//       clearInterval(interval);
//       handleUnload();
//       window.removeEventListener("beforeunload", handleUnload);
//     };
//   }, [roomName, currentUser]);

//   // Real-time online users
//   useEffect(() => {
//     if (!roomName) return;

//     const onlineUsersRef = collection(db, `rooms/${roomName}/onlineUsers`);
//     const unsubscribe = onSnapshot(onlineUsersRef, (snapshot) => {
//       const now = Date.now();
//       const users = snapshot.docs
//         .map((doc) => doc.data())
//         .filter((user) => now - user.lastSeen < 20000);
//       setOnlineUsers(users);
//     });
//     return () => unsubscribe();
//   }, [roomName]);

//   // Early returns after all hooks
//   if (!roomName) return <p>Room not specified.</p>;
//   if (!currentUser) return <p>Loading...</p>;

//   // Send message
//   const sendMessage = async (e) => {
//     e.preventDefault();
//     if (!input.trim()) return;

//     await addDoc(messagesRef, {
//       text: input,
//       user: currentUser.displayName,
//       timestamp: serverTimestamp(),
//       type: "text",
//     });
//     setInput("");
//   };

//   // File upload handler
//   const handleUpload = () => {
//     //console.log("hiiii");
//     fileInputRef.current?.click();
//   };

//   const handleFileChange = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     try {
//       // Validate file size (max 10MB)
//       const maxSize = 10 * 1024 * 1024; // 10MB
//       if (file.size > maxSize) {
//         alert("File size exceeds 10MB limit.");
//         return;
//       }

//       // Validate file type
//       if (!file.type.startsWith("image/")) {
//         alert("Please select an image file (e.g., PNG, JPEG, GIF).");
//         return;
//       }

//       // Prepare FormData for Cloudinary upload
//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append(
//         "upload_preset",
//         process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
//       );
//       formData.append(
//         "cloud_name",
//         process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
//       );
//       formData.append("folder", `rooms/${roomName}`);

//       // Upload to Cloudinary
//       const response = await fetch(
//         `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
//         {
//           method: "POST",
//           body: formData,
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error?.message || "Cloudinary upload failed");
//       }

//       const data = await response.json();

//       // Create ImageMessage instance
//       const imageMessage = new ImageMessage({
//         user: currentUser.displayName,
//         fileName: file.name,
//         fileURL: data.secure_url,
//         publicId: data.public_id,
//         timestamp: serverTimestamp(),
//       });

//       // Save to Firestore
//       await addDoc(messagesRef, imageMessage.toFirestore());

//       // Reset file input
//       fileInputRef.current.value = "";
//     } catch (error) {
//       console.error("File upload failed:", error);
//       alert(`Failed to upload file: ${error.message}`);
//     }
//   };

//   // Sign out
//   const handleSignOut = async () => {
//     const userDocRef = doc(
//       db,
//       `rooms/${roomName}/onlineUsers`,
//       currentUser.uid
//     );
//     await deleteDoc(userDocRef);
//     await signOut(auth);
//     cookies.remove("auth-token");
//     router.push("/");
//   };

//   return (
//     <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
//       {/* Navbar */}
//       <div className="fixed top-0 left-0 right-0 z-10 p-4 bg-blue-600 text-white text-lg font-semibold flex justify-between items-center">
//         <span>Chat Room: {roomName}</span>
//         <button
//           onClick={handleSignOut}
//           className="px-5 py-2 rounded-md bg-red-500 hover:bg-red-600 text-sm font-bold"
//         >
//           Sign Out
//         </button>
//       </div>

//       {/* Online Users */}
//       <div className="mt-16 pt-4 px-4 text-sm text-gray-800 dark:text-gray-200">
//         <h2 className="font-semibold mb-1">
//           Online Users ({onlineUsers.length})
//         </h2>
//         <ul className="flex gap-2 flex-wrap">
//           {onlineUsers.map((user) => (
//             <li
//               key={user.uid}
//               className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-xs"
//             >
//               {user.displayName}
//             </li>
//           ))}
//         </ul>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-2 mb-20">
//         {messages.map((msg) =>
//           msg.type === "file" ? (
//             <ImageMessageItem key={msg.id} message={msg} />
//           ) : (
//             <MessageItem key={msg.id} message={msg} />
//           )
//         )}
//       </div>

//       {/* Input */}
//       <form
//         onSubmit={sendMessage}
//         className="fixed bottom-0 left-0 right-0 p-4 border-t bg-white dark:bg-gray-800 flex gap-2"
//       >
//         <input
//           type="text"
//           className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
//           placeholder="Type your message..."
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//         />
//         <input
//           type="file"
//           accept="image/*"
//           ref={fileInputRef}
//           className="hidden"
//           onChange={handleFileChange}
//         />
//         <button
//           type="button"
//           className="p-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors"
//           aria-label="Upload file"
//           onClick={handleUpload}
//         >
//           <ArrowUpTrayIcon className="h-6 w-6" />
//         </button>
//         <button
//           type="submit"
//           className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
//         >
//           Send
//         </button>
//       </form>
//     </div>
//   );
// }

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/config/firebase";
import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { onAuthStateChanged, signOut } from "firebase/auth";
import MessageItem from "../../components/MessageItem";
import ImageMessageItem from "../../components/ImageMessageItem";
import FileMessageItem from "../../components/FileMessageItem";
import Cookies from "universal-cookie";
import ImageMessage from "@/models/imageMessage"; //from "../../models/ImageMessage";

const cookies = new Cookies();

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const router = useRouter();
  const params = useParams();
  const roomName = params?.room || null;

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const token = cookies.get("auth-token");
      if (!user || !token) {
        router.replace("/");
      } else {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Real-time messages
  const messagesRef = collection(db, `rooms/${roomName}/messages`);
  useEffect(() => {
    if (!roomName) return;

    const q = query(messagesRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [roomName]);

  // Track presence
  useEffect(() => {
    if (!roomName || !currentUser) return;

    const userDocRef = doc(
      db,
      `rooms/${roomName}/onlineUsers`,
      currentUser.uid
    );
    const updatePresence = () =>
      setDoc(
        userDocRef,
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          lastSeen: Date.now(),
        },
        { merge: true }
      );

    updatePresence();
    const interval = setInterval(updatePresence, 10000);

    const handleUnload = () => {
      if (roomName && currentUser?.uid) {
        navigator.sendBeacon(
          `/api/remove-user?room=${roomName}&uid=${currentUser.uid}`
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      handleUnload();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [roomName, currentUser]);

  // Real-time online users
  useEffect(() => {
    if (!roomName) return;

    const onlineUsersRef = collection(db, `rooms/${roomName}/onlineUsers`);
    const unsubscribe = onSnapshot(onlineUsersRef, (snapshot) => {
      const now = Date.now();
      const users = snapshot.docs
        .map((doc) => doc.data())
        .filter((user) => now - user.lastSeen < 20000);
      setOnlineUsers(users);
    });
    return () => unsubscribe();
  }, [roomName]);

  // Early returns after all hooks
  if (!roomName) return <p>Room not specified.</p>;
  if (!currentUser) return <p>Loading...</p>;

  // Send text message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    await addDoc(messagesRef, {
      text: input,
      user: currentUser.displayName,
      timestamp: serverTimestamp(),
      type: "text",
    });
    setInput("");
  };

  // Trigger file input when upload button is clicked
  const handleUpload = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  // Handle file selection and upload to Cloudinary
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert("File size exceeds 10MB limit.");
        return;
      }

      // Check for environment variables
      if (
        !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
        !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      ) {
        throw new Error(
          "Cloudinary configuration missing. Please check environment variables."
        );
      }

      // Determine if file is an image
      const isImage = file.type.startsWith("image/");
      const uploadType = isImage ? "image" : "auto";

      // Prepare FormData for Cloudinary upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );
      formData.append(
        "cloud_name",
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      );
      formData.append("folder", `rooms/${roomName}`);

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${uploadType}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Cloudinary upload failed");
      }

      const data = await response.json();
      console.log("data: ");
      console.log(data);
      // Create ImageMessage instance (used for both image and non-image files)
      const message = new ImageMessage({
        user: currentUser.displayName,
        fileName: file.name,
        fileURL: data.secure_url,
        publicId: data.public_id,
        timestamp: serverTimestamp(),
      });

      // Save to Firestore
      await addDoc(messagesRef, message.toFirestore());

      // Reset file input
      fileInputRef.current.value = "";
    } catch (error) {
      console.error("File upload failed:", error);
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    const userDocRef = doc(
      db,
      `rooms/${roomName}/onlineUsers`,
      currentUser.uid
    );
    await deleteDoc(userDocRef);
    await signOut(auth);
    cookies.remove("auth-token");
    cookies.remove("last-room");
    router.push("/");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-10 p-4 bg-blue-600 text-white text-lg font-semibold flex justify-between items-center">
        <span>Chat Room: {roomName}</span>
        <button
          onClick={handleSignOut}
          className="px-5 py-2 rounded-md bg-red-500 hover:bg-red-600 text-sm font-bold"
        >
          Sign Out
        </button>
      </div>

      {/* Online Users */}
      <div className="mt-16 pt-4 px-4 text-sm text-gray-800 dark:text-gray-200">
        <h2 className="font-semibold mb-1">
          Online Users ({onlineUsers.length})
        </h2>
        <ul className="flex gap-2 flex-wrap">
          {onlineUsers.map((user) => (
            <li
              key={user.uid}
              className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-xs"
            >
              {user.displayName}
            </li>
          ))}
        </ul>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 mb-20">
        {messages.map((msg) => {
          if (msg.type === "text") {
            return <MessageItem key={msg.id} message={msg} />;
          } else if (msg.type === "file") {
            const isImage = /\.(png|jpe?g|gif|webp)$/i.test(msg.fileName);
            return isImage ? (
              <ImageMessageItem key={msg.id} message={msg} />
            ) : (
              <FileMessageItem key={msg.id} message={msg} />
            );
          }
          return null;
        })}
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="fixed bottom-0 left-0 right-0 p-4 border-t bg-white dark:bg-gray-800 flex gap-2"
      >
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className={`p-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors ${
            isUploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-label="Upload file"
        >
          {isUploading ? (
            <span className="text-sm">Uploading...</span>
          ) : (
            <ArrowUpTrayIcon className="h-6 w-6" />
          )}
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          Send
        </button>
      </form>
    </div>
  );
}
