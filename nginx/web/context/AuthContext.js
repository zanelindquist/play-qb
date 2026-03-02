import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export function AuthProvider({ children }) {
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

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                isAuthenticated: !!accessToken,
                login,
                logout,
                loading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);