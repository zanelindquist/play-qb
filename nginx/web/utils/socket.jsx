import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useSocket() {
    const socketRef = useRef(null);
    const [eventListners, setEventListners] = useState([])

    useEffect(() => {
        const socket = io("https://app.localhost", {
            path: "/socket.io",
            transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Connected to socket: " + socket.id + " on " + socket._opts.hostname + socket._opts.path);
        });

        socket.on("server_message", (data) => {
            console.log("Server message:", data);
        });

        socket.on("chat_message", (msg) => {
            console.log("Chat message:", msg);
        });

        socket.on("test", (data) => {
            console.log(data)
        })

        return () => {
            socket.disconnect();
        };
    }, []);

    // Register event listners
    useEffect(() => {
        for(let listner of eventListners) {
            if(socketRef.current) {
                socketRef.current.on(listner.event, listner.callback)
            } else {
                console.error(`useSocket(): unable to register event listner "${listner.event}": socket not found`)
            }
        }
    }, [eventListners])

    const send = (event, data) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    };

    const addEventListener = (event, callback) => {
        setEventListners((current) => [...current, {event, callback}])
    }

    return {
        socket: socketRef.current,
        send,
        addEventListener
    };
}
