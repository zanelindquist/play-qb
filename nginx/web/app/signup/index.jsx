import { Link, useLocalSearchParams, useRouter } from 'expo-router';

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
  Pressable,
  useWindowDimensions
} from 'react-native';

import { DatePickerInput } from 'react-native-paper-dates';
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Button, TextInput, HelperText, Text, useTheme, Divider, Icon, Card, Menu } from 'react-native-paper';
import Video from 'react-native-video';

import theme from '../../assets/themes/theme.js';
import { hashPassword, saveAccessToken } from "../../utils/encryption.js"
import { postAuthRoute, postProtectedAuthRoute, validateEmail , handleExpiredAccessToken } from "../../utils/requests.jsx"
import GlassyView from '../../components/custom/GlassyView.jsx';
import { useGoogleAuth } from '../../utils/googleAuth.js';
import { useAlert } from '../../utils/alerts.jsx';
import { useBanner } from '../../utils/banners.jsx';
import { useSocket } from "../../utils/socket.jsx";
import EarthVideo from "../../public/videos/Earth.mp4"
import { useAuth } from '../../context/AuthContext.js';
import GoogleAuthentication from '../../components/custom/GoogleAuthentiation.jsx';
import ustyles from '../../assets/styles/ustyles.js';
import VerificationCode from '../../components/custom/VerificationCode.jsx';
import { detectCurseWords } from '../../utils/text.js';


const SignUp = () => {
    const params = useLocalSearchParams()
    const router = useRouter()
    const {showAlert} = useAlert()
    const {showBanner} = useBanner()
    const {login} = useAuth()
    const {promptAsync, disabled, request} = useGoogleAuth(true, handleAccountCreation)
    const { width } = useWindowDimensions();
    const isMobile = width <= 768;
    
    const [createWithGoogle, setCreateWithGoogle] = useState(false)

    const defaultHTStates = { email: false, password: false, phone: false, username: false, code: false }
    const [HTVisibleStates, setHTVisibleStates] = useState(defaultHTStates)

    const [email, setEmail] = useState("");
    const [emailDebounce, setEmailDebounce] = useState(null)
    const [secondaryVerificationEmail, setSecondaryVerificationEmail] = useState("")
    const [sentVerificationEmail, setSentVerificationEmail] = useState(false)
    const [verificationCode, setVerificationCode] = useState("")

    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const [username, setUsername] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("");

    const translateX = useRef(new Animated.Value(width)).current;

    useEffect(() => {
        if(params.verify === "true") {
            // Set initial position to phase 3
            translateX.setValue(-width);
        }
    }, [width])

    // Data entry useEffects
    // Validate password as we type
    useEffect(() => {
        setHTVisibleStates((prev) => {
            return {
                ...prev,
                password: false
            }
        })

        if(!password) return

        // In case the user had input incorrect info and then edited it, lets set all of the helper text to invisible to start the procces fresh
        setHTVisibleStates(defaultHTStates)
        // First, make sure the passwords match
        // Don't be fucking annoying and tell them their passwords don't match when they haven't event tried typing in the second one yet
        if(password !== confirmPassword && confirmPassword.length > 6) return handleInvalidField("Password does not match confirm password field")
        
        // First ensure password is valid and safe
        const results = {
            length: /.{8,20}/.test(password) ? false : "Password must be between 8 and 20 characters",               // Check length
            lowercase: /[a-z]/.test(password) ? false : "Password must have at least one lowercase letter",              // At least one lowercase
            uppercase: /[A-Z]/.test(password) ? false : "Password must have at least one uppercase letter",              // At least one uppercase
            digit: /\d/.test(password) ? false : "Password must contain at least one digit",                     // At least one digit
            special: /[@$!%*?&]/.test(password) ? false : "Password must have at least one special character",            // At least one special character                             // Overall validity
        };
        
        // Loop through each condition and handle the error for it, if there is one
        for (let [key, value] of Object.entries(results)) {
            // If the value is false, then we can continue
            if (!value) continue
            // If a string did get set as the value, we have an error, so handle it
            else return handleInvalidField(value)
        }
    }, [password, confirmPassword])
    // Validate email as we type
    useEffect(() => {
        setHTVisibleStates((prev) => {
            return {
                ...prev,
                email: false
            }
        })

        if(!email) return
        
        if(emailDebounce) clearTimeout(emailDebounce)
        setEmailDebounce(
            setTimeout(() => {
                validateEmail(email)
                .catch((error) => {
                    // If the email is invalid, set the helper text as the error below the field
                    if(error?.response && error.response.data.error) {
                        handleInvalidField(error.response.data.error)
                    }
                })
            }, 500)
        )
    }, [email])
    useEffect(() => {
        // Check for curse words
        if(!username) return

        setHTVisibleStates(prev => ({
            ...prev,
            username: detectCurseWords(username) ? "Username contains banned words" : false
        }));
    }, [username])

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

    // Slide animation function
    function goToPhase(phase) {
        // Check for errors
        if(true && params.verify !== "true") {
            if(password && email) {
                // Don't let the user continue if there are errors with the email
                if(Object.values(HTVisibleStates).some(v => v !== false)) return
            }
            // Don't let the user continue if there is no email and password
            else {
                setHTVisibleStates((prev) => {
                    return {
                        ...prev,
                        email: "Required*",
                        password: "Required*"
                    }
                })
                return
            }
            if(phase == 2) {
                if(username) {
                    if(Object.values(HTVisibleStates).some(v => v !== false)) return
                } else {
                    setHTVisibleStates((prev) => {
                        return {
                            ...prev,
                            username: "Required*",
                        }
                    })
                }
            }
        }

        // Calculate target position based on current screen width
        const targetX = -width * (phase - 2);

        Animated.timing(translateX, {
            toValue: targetX,
            duration: 250,
            useNativeDriver: true,
        }).start();
    };
    function goToPreviousPhase() {
        Animated.timing(translateX, {
            toValue: translateX._value + width, // Move right by one screen width
            duration: 500,
            useNativeDriver: true,
        }).start();
    };


    // Account creation functions

    async function registerAccount() {
        // Validate required fields first
        if (!username) {
            setHTVisibleStates(prev => ({
                ...prev,
                username: "Required*"
            }));
            return;
        }

        // Reset helper text
        setHTVisibleStates(defaultHTStates);

        try {
            // --- Normal registration flow ---
            await postAuthRoute("/register", {
                email,
                password,
                username
            });

            // Error handled by catch block

            goToPhase(3)
        } catch (error) {
            console.error(error);

            if (error?.response?.data?.error) {
                handleInvalidField(error.response.data.error);
            } else {
                showAlert("There was an error during registration.");
            }
        }
    };

    async function validateVerificationCode() {
        try {
            // --- Normal registration flow ---
            const response = await postAuthRoute("/verify_email", {
                email: email || secondaryVerificationEmail,
                code: verificationCode
            });

            // Only receive token once the account is verified
            
            const token = response?.access_token;

            if (!token) {
                console.error("No access_token in response");
                showAlert("Registration failed. Please try again.");
                return
            }

            await login(token);

            showAlert("Account was successfully verified. Welcome to More Quiz Bowl!")

            router.push("/")

        } catch (error) {
            console.error(error)
            if (error?.response?.data?.error) {
                showAlert(error.response.data.error)
            } else {
                showAlert("There was an error during registration.");
            }
        }
    }

    async function resendVerificationEmail() {
        // Validate required fields first
        if (!email && !secondaryVerificationEmail) {
            setHTVisibleStates(prev => ({
                ...prev,
                email: "Required*"
            }));
            return;
        }

        try {
            // --- Normal registration flow ---
            const response = await postAuthRoute("/resend_verification_email", {
                email: email || secondaryVerificationEmail
            });

            showAlert(response.message)

            setSentVerificationEmail(true)

        } catch (error) {
            console.error(error);

            if (error?.response?.data?.error) {
                handleInvalidField(error.response.data.error);
                showAlert(error.response.data.error)
            }
            else {
                showAlert("There was an error during registration.");
            }
        }
    }

    async function setUsernameGoogle() {
        // --- Google flow ---
        if (createWithGoogle) {
            const response = await postProtectedAuthRoute("/google_set_username", {
                username,
            });

            if(response.data.code > 300) {
                showBanner("There was an error setting your username");
                return
            }

            showBanner("Account created!");
            router.replace("/?tutorial=true");
        }
    }

    function handleAccountCreation () {
        goToPhase(2)
    }

    function handleCreateWithGoogle() {
        setCreateWithGoogle(true)
        localStorage.setItem('oauth_code_verifier', request.codeVerifier);
        promptAsync({windowFeatures: {popup: false}})
    }

    return (
        <View style={[styles.container, { overflowX: 'hidden' }]}>
            <View style={styles.bg} >
                <Video
                    source={{uri: "/videos/Earth.mp4"}}
                    style={[StyleSheet.absoluteFill]}
                    muted
                    repeat
                    resizeMode="cover"
                />
            </View>
            {/* Lower container where all of the action happens*/}
            <Animated.View
                style={[
                    styles.animatedContainer,
                    { transform: [{ translateX }], width: width * 3, overflowX: 'hidden' },
                ]}
            >
                {/* Phase 1: Login info */}
                <View style={[styles.page, { width }]}>
                        <GlassyView style={[styles.phaseContainer, isMobile && mstyles.phaseContainer, { width: isMobile ? width * 0.95 : Math.min(width * 0.8, 600) }]}>
                        <HelperText style={[styles.header, styles.textShadow]}>Create Account</HelperText>
                        <TextInput
                            style={styles.input}
                            label="Email*"
                            value={email}
                            mode='outlined'
                            onChangeText={text => setEmail(text)}
                        />
                        <HelperText style={styles.error} visible={!!HTVisibleStates.email}>
                            {HTVisibleStates.email}
                        </HelperText>
                        <TextInput
                            style={styles.input}
                            label="Password*"
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
                        <HelperText style={styles.error} visible={!!HTVisibleStates.password}>
                            {HTVisibleStates.password}
                        </HelperText>
                        <TextInput
                            style={styles.input}
                            label="Confirm password*"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={secureTextEntry}
                            mode="outlined"
                            right={
                                <TextInput.Icon
                                    icon={secureTextEntry ? "eye-off" : "eye"}
                                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                                />
                            }
                        />
                        <Button
                            mode="contained"
                            rippleColor={theme.primary}
                            onPress={() => goToPhase(2)}
                            style={[styles.nextButton, isMobile && mstyles.nextButton]}
                        >
                            Next
                        </Button>
                        <Text style={[styles.linkText, styles.textShadow]}>
                            Already have an account?
                            <Pressable
                                onPress={() => router.replace("/signin")}>
                                <HelperText
                                    style={styles.linkButton}
                                >Sign in</HelperText>
                            </Pressable>
                        </Text>
                        <Text style={[styles.linkText, styles.textShadow]}>
                            Need to verify an email?
                            <Pressable
                                onPress={() => router.replace("/signup?verify=true")}>
                                <HelperText
                                    style={styles.linkButton}
                                >Verify</HelperText>
                            </Pressable>
                        </Text>
                        <Divider />
                        <GoogleAuthentication
                            style={styles.nextButton}
                            text="Create an account with Google"
                        />
                    </GlassyView>
                </View>
                
                {/* Phase 2: Choose username */}
                <View style={[styles.page, { width }]}>
                        <GlassyView style={[styles.phaseContainer, isMobile && mstyles.phaseContainer, { width: isMobile ? width * 0.95 : Math.min(width * 0.8, 600) }]}>
                        <HelperText style={[styles.header, styles.textShadow]}>Select A Username</HelperText>
                        <TextInput
                            style={styles.input}
                            label="Username*"
                            value={username}
                            mode='outlined'
                            onChangeText={setUsername}
                        />
                        <HelperText style={styles.error} visible={!!HTVisibleStates.username}>
                            {HTVisibleStates.username}
                        </HelperText>
                        {/* <TextInput
                            style={styles.input}
                            label="Phone number"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            mode='outlined'
                            keyboardType="numeric"
                        />
                        <HelperText style={styles.error} visible={!!HTVisibleStates.phone}>
                            {HTVisibleStates.phone}
                        </HelperText> */}
                        <Divider style={styles.divider}/>
                        <Divider style={styles.divider}/>
                        <Button
                                mode="outlined"
                                rippleColor={theme.primary}
                                onPress={goToPreviousPhase}
                                style={styles.nextButton}
                            >
                                Back
                        </Button>
                        <Button
                            mode="contained"
                            rippleColor={theme.primary}
                            onPress={registerAccount}
                            style={[styles.nextButton, isMobile && mstyles.nextButton]}
                        >
                            Next
                        </Button>
                    </GlassyView>
                </View>

                {/* Phase 3: Verify email */}
                <View style={[styles.page, { width }]}>
                    <GlassyView
                        style={[styles.phaseContainer, isMobile && mstyles.phaseContainer, { width: isMobile ? width * 0.95 : Math.min(width * 0.8, 600) }]}
                        gradient={
                        {
                            colors: theme.gradients.questionTint,
                            start: { x: 1, y: 0 },
                            end: { x: 1, y: 1 },
                        }
                    }
                    >
                        <HelperText style={[styles.header, styles.textShadow]}>Verify your Email</HelperText>
                        <HelperText style={[ustyles.text.text, styles.textShadow]}>
                        {
                            !email ? "Please verify your account by entering your email and pressing the \"Send Verification Email\" button."
                            : `We sent an email to ${email}. Please enter the 6 digit verification code.`
                        }
                        </HelperText>
                        {
                            !email &&
                            <>
                            {
                                !sentVerificationEmail &&
                                <>
                                    <TextInput
                                        style={styles.input}
                                        label="Email*"
                                        value={secondaryVerificationEmail}
                                        mode='outlined'
                                        onChangeText={text => setSecondaryVerificationEmail(text)}
                                    />
                                    <HelperText style={styles.error} visible={!!HTVisibleStates.email}>
                                        {HTVisibleStates.email}
                                    </HelperText>
                                    <Button
                                        mode="contained"
                                        rippleColor={theme.primary}
                                        onPress={resendVerificationEmail}
                                        style={styles.nextButton}
                                    >
                                        Send Verification Email
                                    </Button>
                                </>
                            }
                            </>
                        }
                        {
                            (email || sentVerificationEmail) &&
                            <>
                                <VerificationCode
                                    onCodeInput={setVerificationCode}
                                />
                                <HelperText style={styles.error} visible={!!HTVisibleStates.code}>
                                    {HTVisibleStates.code}
                                </HelperText>                
                                <Divider style={styles.divider}/>
                                <Divider style={styles.divider}/>
                                <Button
                                    mode="contained"
                                    rippleColor={theme.primary}
                                    onPress={validateVerificationCode}
                                    style={styles.nextButton}
                                >
                                    Create Account
                                </Button>
                            </>
                        }
                        <Button
                            mode="outlined"
                            rippleColor={theme.primary}
                            onPress={goToPreviousPhase}
                            style={styles.nextButton}
                            disabled={params.verify !== "true"}
                        >
                            Back
                        </Button>
                    </GlassyView>
                </View>

            </Animated.View>
        </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.background,
        overflowX: 'hidden',
    },
    bg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "black",
    },
    animatedContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    page: {
        alignItems: "center",
        justifyContent: "center",
    },
    phaseContainer: {
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
        minWidth: 300,
        maxWidth: 600,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        margin: 20,
    },
    input: {
        width: "100%"
    },
    error: {
        fontSize: 14,
        alignSelf: "baseline",
        color: theme.error,
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    textShadow: {
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    linkText: {
        marginTop: 10
    },
    linkButton: {
        fontSize: 14,
        color: theme.primary
    },
    link: {
        color: theme.primary,
    },
    googleButtonContent: {
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
    buttonContent: {
        justifyContent: 'flex-start', // Align text to the left
        color: "black"
    },
    nextButton: {
        width: "100%"
    },
});

const mstyles = StyleSheet.create({
    phaseContainer: {
        marginHorizontal: 5,
        marginVertical: 10,
        paddingHorizontal: 15,
        paddingVertical: 15,
        gap: 8,
    },
    nextButton: {
        marginTop: 20,
    }
})

export default SignUp;