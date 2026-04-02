import { Platform } from "react-native";
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from "react";

import {postAuthRoute} from "../utils/requests"

import oauth from "../assets/oauth/google_keys.json";
import { router } from "expo-router";
import { useAlert } from "./alerts";
import { useBanner } from "./banners.jsx";
import { useAuth } from '../context/AuthContext.js';
import { ENV } from "./constants.js";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth(isSignUp, onAccountCreation=null) {
    const {showAlert} = useAlert()
    const {showBanner} = useBanner()
    const {pendingOAuthCode, consumeOAuthCode, login} = useAuth()
    const [hasRequested, setHasRequested] = useState(false)

    const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    const redirectUri =
    Platform.OS === "web"
        ? (ENV == "development" ? "http://localhost:8081/authenticated" : "https://morequizbowl.com/authenticated")
        : AuthSession.makeRedirectUri({
            scheme: "your-app-scheme",
            path: "authenticated",
        });

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: oauth.web.client_id,
            scopes: ['openid', 'profile', 'email'],
            redirectUri: redirectUri,
            responseType: AuthSession.ResponseType.Code,
            usePKCE: true,
            extraParams: {
                access_type: 'offline',
            },
        },
        discovery
    );

    useEffect(() => {
        if (!pendingOAuthCode) return;
        if (hasRequested) return;

        const { code, verifier } = consumeOAuthCode();

        if (!code) return;

        if (isSignUp) {
            postAuthRoute("/google_auth_register", {
                code,
                redirect_uri: redirectUri,
                code_verifier: request.codeVerifier,
            })
            .then((data) => {
                const token = data?.access_token;
                if (!token) { console.error("No access_token in response"); return; }
                login(token);
                if (data.message == "User already exists") {
                    showBanner("Account already exists. Logged in.");
                    router.replace("/");
                }
                if (onAccountCreation) onAccountCreation();
                setHasRequested(true);
            })
            .catch((error) => {
                const message = error?.response?.data?.error;
                if (message === "Email does not exist") {
                    router.replace("/signup");
                    showAlert("Email not found. Please make an account.");
                    return;
                }
                showAlert("There was an error logging in: " + message);
            });
        } else {
            postAuthRoute("/google_auth_login", {
                code,
                redirect_uri: redirectUri,
                code_verifier: verifier,
            })
            .then((data) => {
                const token = data?.access_token;
                if (!token) { console.error("No access_token in response"); return; }
                login(token);
                router.replace("/");
                showBanner("Logged in!");
            })
            .catch((error) => {
                const message = error?.response?.data?.error;
                if (message === "Email does not exist") {
                    router.replace("/signup");
                    showAlert("Email not found. Please make an account.");
                    return;
                }
                showAlert("There was an error logging in: " + message);
            });
        }
    }, [pendingOAuthCode]); // fires whenever layout sets a new code

    return { promptAsync, disabled: !request, request };
}