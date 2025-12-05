import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket() {
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = io("https://app.localhost", {
            path: "/socket.io",
            transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Connected to socket:", socket.id);
        });

        socket.on("server_message", (data) => {
            console.log("Server message:", data);
        });

        socket.on("chat_message", (msg) => {
            console.log("Chat message:", msg);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const send = (event, data) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    };

    return {
        socket: socketRef.current,
        send,
    };
}
