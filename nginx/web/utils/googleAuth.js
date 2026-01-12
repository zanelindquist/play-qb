import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from "react";

import {postAuthRoute} from "../utils/requests"
import {saveAccessToken} from "../utils/encryption.js"

import oauth from "../assets/oauth/google_keys.json";
import { router } from "expo-router";
import { useAlert } from "./alerts";
import { useBanner } from "./banners.jsx";

// Add this at the top of your file
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth(isSignUp, onAccountCreation=null) {
    const {showAlert} = useAlert()
    const {showBanner} = useBanner()
    const [hasRequested, setHasRequested] = useState(false)
    
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
                path: "authenticated",
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
        if(hasRequested) return
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
                postAuthRoute("/google_auth_register", {
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

                    // Make sure that this was not just a log in because the account already existed
                    if(data.message == "User already exists"){
                        showBanner("Account already exists. Logged in.")
                        // Go straigt to the login page
                        // router.push("/")
                    }
                    
                    // Here we have to make the user set a username
                    if(onAccountCreation) onAccountCreation()
                    setHasRequested(true)
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