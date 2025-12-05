import { useEffect } from "react";
import { io } from "socket.io-client";

function useSocket() {
  useEffect(() => {
    const socket = io("https://localhost", {
      path: "/socket.io",
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("server_message", (msg) => {
      console.log("Server:", msg);
    });

    return () => socket.disconnect();
  }, []);
}

export {useSocket}
