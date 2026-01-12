import { useRouter } from 'expo-router';

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
  Pressable
} from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { Button, TextInput, HelperText, Text, useTheme, Divider, Icon, Card, Menu } from 'react-native-paper';

import theme from '../../assets/themes/theme.js';
import { getAccessToken, saveAccessToken } from "../../utils/encryption.js"
import { postAuthRoute, getProtectedRoute , handleExpiredAccessToken } from "../../utils/requests.jsx"
import { useAlert } from '../../utils/alerts.jsx';

import GlassyView from "../../components/custom/GlassyView.jsx"
import Video from 'react-native-video';
import { useGoogleAuth } from '../../utils/googleAuth.js';

const { width, height } = Dimensions.get("window")

export default function SignInScreen() {
    const {showAlert} = useAlert()
    const {promptAsync, disabled} = useGoogleAuth(false)

    // States
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const [HTVisibleStates, setHTVisibleStates] = useState({
        email: false, password: false
    })

    // Dependency Variables
    const router = useRouter();

    const isMobile = width < 680;

    useEffect(() => {
        // On loading we want to see if we have an access token so we can log in
        getAccessToken()
        .then((token) => {
            if(token){
                getProtectedRoute("/account")
                .then((response) => {
                    router.replac("/")
                    showAlert("Logged in as " + response.data.user.username + " 🎉")
                })
                .catch((error) => {

                })
            }
        })
        .catch((error) => {

        })
    }, [])

    // Handle invalid field inputs with helper text
    function handleInvalidField(error) {
        // The first word of the error is the field that is incorrect
        const field = error.split(" ")[0].toLowerCase()
        let newState = Object.create(HTVisibleStates)
        // Set the field as the error name so that we can just use the state visiblity to tell the user what the error is
        newState[field] = error

        // The field is now visible
        setHTVisibleStates(newState)
    }

    async function submit() {
        // Reset data field helper text in case they get it right this time ;)
        setHTVisibleStates({
            email: false, password: false
        })

        try {
            const response = await postAuthRoute("/login", {email, password})
            
            saveAccessToken(response.data.access_token)
            // Redirect user to the dashboard page
            router.replace("/")
        } catch (error) {
            console.log(error)
            if (error.response?.data?.error) handleInvalidField(error.response.data.error)
                else setHTVisibleStates((prevStates) => ({...prevStates, password: error.response?.data?.error || "An error occurred"}))
        }
    }

  return ( 
    <View style={styles.container}>
        <View style={styles.bg} >                
            <Video
                source={{uri: "/videos/Earth.mp4"}}
                style={[StyleSheet.absoluteFill]}
                muted
                repeat
                resizeMode="cover"
            />
        </View>
        <GlassyView style={styles.loginContainer}>
            <View>
                {
                    isMobile &&
                    <Image
                        source={require("../../assets/images/steig-black.png")}
                        style={styles.mobileImage}
                        resizeMode='contain'>
                    </Image>
                }
                <Text style={styles.textShadow} variant="headlineSmall">
                    Please sign in
                </Text>
            </View>
            <TextInput
                label="Email"
                value={email}
                mode='outlined'
                onChangeText={text => setEmail(text)}
                style={styles.textInput}
            />
            <HelperText type="error" visible={!!HTVisibleStates.email}>
                {HTVisibleStates.email}
            </HelperText>
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                mode="outlined"
                right={
                    <TextInput.Icon
                        icon={secureTextEntry ? "eye-off" : "eye"}
                        onPress={() => setSecureTextEntry(!secureTextEntry)}
                    />
                }
            />
            <HelperText type="error" visible={!!HTVisibleStates.password}>
                {HTVisibleStates.password}
            </HelperText>
            
            <Text style={[styles.linkText, styles.textShadow]}>
                Don't have an account yet?
                <Pressable
                    onPress={() => router.replace("/signup")}>
                    <HelperText
                        style={styles.linkButton}
                    >Sign up</HelperText>
                </Pressable>
            </Text>

            <Divider style={styles.dividerBottom}/>  

            <View style={styles.buttonRow}>
                <Button
                    mode="outlined"
                    contentStyle={styles.googleButton}
                    rippleColor={theme.primary}
                    onPress={() => promptAsync()}
                    disabled={disabled}
                >
                    <Image
                        source={require("../../assets/images/google_logo.png")}
                        style={styles.googleIcon}
                    />
                    <HelperText style={[styles.googleText, styles.textShadow]}>Sign in with Google</HelperText>
                </Button>
                <Button
                    mode="contained"
                    rippleColor={theme.primary}
                    onPress={submit}
                    style={styles.submitButton}
                >
                    Sign in
                </Button>
            </View>
        </GlassyView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: theme.background
    },
    bg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "black",
    },
    loginContainer: {
        alignItems: "center",
        justifyContent: "center",
        justifyContent: "center",
        gap: 10,
        padding: 20,
    },
    mobileImage: {
        display: "inline",
        maxWidth: 100,
        maxHeight: 100,
        margin: 100,
        alignSelf: "center"
    },
    textShadow: {
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    textInput: {
        width: "100%"
    },
    linkText: {
        display: "inline"
    },
    linkButton: {
        fontSize: 14,
        color: theme.primary
    },
    dividerBottom: {
        marginBottom: 10
    },
    googleButton: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    googleIcon: {
        height: 16,
        width: 16,
    },
    googleText: {
        fontSize: "0.8rem"
    },
    dividerBoth: {
        marginTop: 10,
        marginBottom: 10
    },
    buttonRow: {
        display: "flex",
        flexDirection: "column",
        gap: 20,
        width: "100%"
    },
    submitButton: {
        width: "100%"
    },
    rightContainer: {
        flex: 1
    }
});