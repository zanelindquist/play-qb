import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from "react";

import {postAuthRoute} from "../utils/requests"
import {saveAccessToken} from "../utils/encryption.js"

import oauth from "../assets/oauth/google_keys.json";
import { router } from "expo-router";
import { useAlert } from "./alerts";

// Add this at the top of your file
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth(isSignUp) {
    const {showAlert} = useAlert()
    
    const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: oauth.web.client_id,
            scopes: ['openid', 'profile', 'email'],
            redirectUri: AuthSession.makeRedirectUri({
                scheme: 'your-app-scheme', // e.g., 'myapp' or use native: 'myapp://'
            }),
            responseType: AuthSession.ResponseType.Code,
            usePKCE: false, // Important: disable PKCE
            extraParams: {
                access_type: 'offline',
            },
        },
        discovery
    );

    useEffect(() => {
    
        if (response?.type === "success") {

            const code = response.params?.code;
            const redirectUri = request?.redirectUri;
            
            console.log("Authorization code:", code);
            console.log("Redirect URI:", redirectUri);
            
            if(!code || !redirectUri) {
                console.error("Missing code or redirectUri");
                return;
            }
            
            if(isSignUp) {
                // Handle signup
            } else {
                postAuthRoute("/google_auth_login", {
                    code: code,
                    redirect_uri: redirectUri
                })
                .then((data) => {                    
                    const token = data?.access_token; 
                    if (!token) {
                        console.error("No access_token in response");
                        return;
                    }
                    saveAccessToken(token); 
                    router.push("/"); 
                })
                .catch((error) => {
                    const message = error?.response?.data?.error
                    if(message === "Email does not exist") {
                        router.push("/signup")
                        showAlert("Email not found. Please make an account.")
                        return
                    }
                    console.log("ERROR LOGGING IN", error); 
                    showAlert("There was an error logging in: " + message); 
                });
            }
        } else if (response?.type === "error") {
            console.error("Auth error:", response.error);
            showAlert("Authentication failed" + "Please try again");
        }
    }, [response]);

    return { promptAsync, disabled: !request };
}