import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "./encryption";
import { RedirectToSignIn } from "./redirects";
import { router } from "expo-router";
import { useAlert } from "./alerts";
import { useBanner } from "./banners";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL, ENV } from "./constants";
import {getProtectedRoute} from "./requests"
import theme from "@/assets/themes/theme";

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
    const socketRef = useRef(null);
    const listenersRef = useRef(new Map());
    const { showAlert } = useAlert();
    const {showBanner} = useBanner();
    const { accessToken, isAuthenticated } = useAuth();

    const isMountedRef = useRef(false)

    if(namespace !== "game" && namespace !== "lobby")
        throw Error("useSocket(): Invalid namespace")

    useEffect(() => {
        connect()

        return () => {
            isMountedRef.current = false;
        };
    }, [lobbyAlias, namespace, isAuthenticated]);

    const connect = () => {
        isMountedRef.current = true;

        // Do not connect if not authenticated
        if (!isAuthenticated || !accessToken) {
            return;
        }

        // If socket already exists for this namespace, reuse it
        if (socketInstances[namespace]) {
            socketRef.current = socketInstances[namespace];
            return;
        }

        const socket = io(`${BACKEND_URL}/${namespace}`, {
            path: "/socket.io",
            transports: ["websocket"],
            auth: { token: accessToken },
        });

        socketRef.current = socket;
        socketInstances[namespace] = socket;

        // --- Audit logging ---
        if(ENV === "development") {
            socket.onAny((event, ...args) => {
                console.log(`[SOCKET ${namespace}] Event:`, event, "Data:", args);
            });
        }

        socket.on("connect", () => {
            console.log(`Socket connected to ${namespace}:`, socket.id);

            readyCallbacksStore[namespace].forEach(cb => cb(socket));
            readyCallbacksStore[namespace] = [];
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected from ${namespace}:`, socket.id);
        });

        socket.on("reconnect", () => {
            if (namespace === "game") {
                socket.emit("join_lobby", { lobbyAlias });
            } else if (namespace === "lobby") {
                socket.emit("enter_lobby", { lobbyAlias });
            }
        });

        socket.on("failed_connection", (data) => {
            if (
                data.message === "Invalid token" ||
                data.message === "No token provided"
            ) {
                showBanner("Your session has expired. Please log in again.");
                disconnect();
                router.replace("/signin");
            } else if (data.message === "User does not exist") {
                disconnect();
                router.replace("/signup");
            }
        });
    };

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
        if(!socket) return
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
        connect,
        onReady
    };
}