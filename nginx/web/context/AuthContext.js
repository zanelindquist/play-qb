import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [pendingOAuthCode, setPendingOAuthCode] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadToken = async () => {
            const token = await AsyncStorage.getItem("access_token");
            if (token) setAccessToken(token);
            setLoading(false);
        };
        loadToken();
    }, []);

    const login = async (token) => {
        await AsyncStorage.setItem("access_token", token);
        setAccessToken(token);
    };

    const logout = async () => {
        await AsyncStorage.removeItem("access_token");
        setAccessToken(null);
    };

    // Call this from _layout when code is intercepted
    const setOAuthCode = (code, verifier) => {
        console.log("SET AUTH CODE FIRED")
        setPendingOAuthCode({ code, verifier });
    };

    // Call this from signup to consume it
    const consumeOAuthCode = () => {
        const val = pendingOAuthCode;
        setPendingOAuthCode(null);
        return val;
    };

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                isAuthenticated: !!accessToken,
                login,
                logout,
                loading,
                pendingOAuthCode,
                setOAuthCode,
                consumeOAuthCode
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);