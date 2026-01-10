import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "./encryption";
import { RedirectToSignIn } from "./redirects";
import { router } from "expo-router";
import { useAlert } from "./alerts";

// Singleton storage for socket instances
const socketInstances = {
    game: null,
    lobby: null
};

const readyCallbacksStore = {
    game: [],
    lobby: []
};

export function useSocket(namespace, lobbyAlias) {
    console.log(socketInstances)
    const socketRef = useRef(null);
    const listenersRef = useRef(new Map());
    const { showAlert } = useAlert();

    if(namespace !== "game" && namespace !== "lobby")
        throw Error("useSocket(): Invalid namespace")

    useEffect(() => {
        let isMounted = true;

        // If socket already exists for this namespace, use it
        if (socketInstances[namespace]) {
            socketRef.current = socketInstances[namespace];
            return;
        }

        getAccessToken()
            .then((token) => {
                if (!isMounted || socketInstances[namespace]) return;

                const socket = io(`https://app.localhost/${namespace}`, {
                    path: "/socket.io",
                    transports: ["websocket"],
                    auth: { token },
                });

                socketRef.current = socket;
                socketInstances[namespace] = socket;

                socket.on("connect", () => {
                    console.log("Socket connected:", socket.id);
                    readyCallbacksStore[namespace].forEach(callback => callback(socket));
                    readyCallbacksStore[namespace] = [];
                });

                socket.on("reconnect", () => {
                    if (namespace == "game")
                        socket.emit("join_lobby", {lobbyAlias: lobbyAlias})
                    else if (namespace == "lobby")
                        socket.emit("enter_lobby", {lobbyAlias: lobbyAlias})
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
    }, [lobbyAlias, namespace]);

    const onReady = (callback) => {
        const socket = socketInstances[namespace] || socketRef.current;
        if (socket?.connected) {
            callback(socket);
        } else if (!readyCallbacksStore[namespace].includes(callback)) {
            readyCallbacksStore[namespace].push(callback);
        }
    };

    const send = (event, data) => {
        const socket = socketInstances[namespace] || socketRef.current;
        socket?.emit(event, data);
    };

    const addEventListener = (event, callback) => {
        const socket = socketInstances[namespace] || socketRef.current;
        if (!socket) return;

        if (listenersRef.current.has(event)) return;

        socket.on(event, callback);
        listenersRef.current.set(event, callback);
    };

    const removeEventListener = (event) => {
        const socket = socketInstances[namespace] || socketRef.current;
        const cb = listenersRef.current.get(event);
        if (cb && socket) {
            socket.off(event, cb);
            listenersRef.current.delete(event);
        }
    };

    const removeAllEventListeners = () => {
        const socket = socketInstances[namespace] || socketRef.current;
        socket.removeAllListeners();
        for (let event of listenersRef.current.keys()) {
            const cb = listenersRef.current.get(event);
            if (cb && socket) {
                socket.off(event, cb);
                listenersRef.current.delete(event);
            }
        }
    }

    const disconnect = () => {
        const socket = socketInstances[namespace] || socketRef.current;
        
        if (socket) {
            socket.disconnect();
            socket.removeAllListeners(); // Clean up all socket.io listeners
            socketInstances[namespace] = null;
            socketRef.current = null;
            readyCallbacksStore[namespace] = [];
        }
    }

    return {
        socket: socketInstances[namespace] || socketRef.current,
        send,
        addEventListener,
        removeEventListener,
        removeAllEventListeners,
        disconnect,
        onReady
    };
}