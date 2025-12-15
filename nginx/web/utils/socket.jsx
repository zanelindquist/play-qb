import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "./encryption";
import { RedirectToSignIn } from "./redirects"

export function useSocket() {
    const socketRef = useRef(null);
    const [eventListners, setEventListners] = useState([])
    const [accessToken, setAccessToken] = useState("")

    useEffect(() => {
        getAccessToken()
        .then((token) => {
            setAccessToken(token)
        })
        .catch((error) => {
            RedirectToSignIn()
        })
    })

    useEffect(() => {
        if(!accessToken) return;

        const socket = io("https://app.localhost", {
            path: "/socket.io",
            transports: ["websocket"],
            auth: {
                token: accessToken
            }
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Connected to socket: " + socket.id + " on " + socket._opts.hostname + socket._opts.path);
        });

        socket.on("server_message", (data) => {
            console.log("Server message:", data);
        });

        socket.on("test", (data) => {
            console.log(data)
        })

        return () => {
            socket.disconnect();
        };
    }, [accessToken]);

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
        // Don't register duplicate listners
        if(eventListners.find(e => e.event === event)) {
            // Fail silently because this happends often with rerenders
            return 1;
            //console.error("useSocket(): you may not register more than one event handler on the same event.")
        }
        setEventListners((current) => [...current, {event, callback}])
    }

    return {
        socket: socketRef.current,
        send,
        addEventListener
    };
}
