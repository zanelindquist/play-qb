import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "./encryption";
import { RedirectToSignIn } from "./redirects";
import { router } from "expo-router";
import { useAlert } from "./alerts";

export function useSocket(lobbyAlias) {
    const socketRef = useRef(null);
    const listenersRef = useRef(new Map());
    const readyCallbacks = useRef([]);
    const { showAlert } = useAlert();

    useEffect(() => {
        let isMounted = true;

        getAccessToken()
            .then((token) => {
                if (!isMounted || socketRef.current) return;

                const socket = io("https://app.localhost", {
                    path: "/socket.io",
                    transports: ["websocket"],
                    auth: { token },
                });

                socketRef.current = socket;

                socket.on("connect", () => {
                    console.log("Socket connected:", socket.id);
                    readyCallbacks.current.forEach(callback => callback(socket))
                    readyCallbacks.current = [];
                });

                socket.on("failed_connection", (data) => {
                    if (data.message === "Invalid token") {
                        showAlert("Your session has expired. Please log in again.");
                        router.replace("/signin");
                    }
                });
            })
            .catch(() => {
                RedirectToSignIn();
            });

        return () => {
            isMounted = false;
        };
    }, [lobbyAlias]);

    const onReady = (callback) => {
        if(socketRef.current?.connected) {
            callback(socketRef.current);
        } else {
            readyCallbacks.current.push(callback)
        }
    }

    const send = (event, data) => {
        socketRef.current?.emit(event, data);
    };

    const addEventListener = (event, callback) => {
        if (!socketRef.current) return;

        if (listenersRef.current.has(event)) return;

        socketRef.current.on(event, callback);
        listenersRef.current.set(event, callback);
    };

    const removeEventListener = (event) => {
        const cb = listenersRef.current.get(event);
        if (cb && socketRef.current) {
            socketRef.current.off(event, cb);
            listenersRef.current.delete(event);
        }
    };

    return {
        socket: socketRef.current,
        send,
        addEventListener,
        removeEventListener,
        onReady
    };
}
