import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useEffect } from "react";

import {postProtectedRoute} from "../utils/requests"
import {saveAccessToken} from "../utils/enryption.js"

import oauth from "../assets/oauth/google_keys.json";
import { router } from "expo-router";
import { useAlert } from "./alerts";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth(isSignUp) {
    const {showAlert} = useAlert()

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: oauth.web.client_id,
        // iosClientId: "YOUR_IOS_CLIENT_ID",
        // androidClientId: "YOUR_ANDROID_CLIENT_ID",
    });

    
    console.log(request?.redirectUri);

    useEffect(() => {
        if (response?.type === "success") {
            const { access_token, id_token } = response.authentication;
            console.log("Google token:", id_token);
            // send id_token to your backend to log in or create user
            if(isSignUp) {

            } else {
                postProtectedRoute("google_auth_login", {token: id_token})
                .then((data) => {
                    const token = data.access_token
                    saveAccessToken(token)
                    router.push("/")
                })
                .catch((error) => {
                    console.log("ERROR LOGGIN IN", error)
                    showAlert("There was an error loggin in", error.error)
                })
            }
        }
    }, [response]);

    return { promptAsync, disabled: !request };
}
