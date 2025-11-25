import { useRouter } from 'expo-router';

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Image
} from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { Button, TextInput, HelperText, Text, useTheme, Divider, Icon, Card, Menu } from 'react-native-paper';

import theme from "../_layout.jsx"
import { getAccessToken, saveAccessToken } from "../../utils/encryption.js"
import { signIn, getProtectedRoute , handleExpiredAccessToken } from "../../utils/requests.jsx"

import { useAlert } from '../../utils/alerts.jsx';


const { width, height } = Dimensions.get("window")

export default function SignInScreen() {
    const {showAlert} = useAlert()

    // States
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const [HTVisibleStates, setHTVisibleStates] = useState({
        email: false, password: false
    })

    // Dependency Variables
    const { colors } = useTheme()
    const router = useRouter();

    const isMobile = width < 680;

    useEffect(() => {
        // On loading we want to see if we have an access token so we can log in
        getAccessToken()
        .then((token) => {
            if(token){
                getProtectedRoute("/account")
                .then((response) => {
                    router.push("/dashboard")
                    showAlert("Logged in as " + response.data.user.firstname + " " + response.data.user.lastname + " 🎉")
                })
                .catch((error) => {
                    console.log(error)
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
            const response = await signIn(email, password)
            
            saveAccessToken(response.data.access_token)
            // Redirect user to the dashboard page
            router.push("/dashboard")
        } catch (error) {
            console.log(error)
            if (error.response?.data?.error) handleInvalidField(error.response.data.error)
                else setHTVisibleStates((prevStates) => ({...prevStates, password: error.response?.data?.error || "An error occurred"}))
        }
    }

  return ( 
    <ScrollView>
    <View style={{display: "flex", flexDirection: "row", height: "100vh", backgroundColor: colors.background}}>
        {/*Left background and image container*/}
        <View style={{flex: 1, backgroundColor: isMobile ? "" : colors.secondaryContainer}}>
            <View style={{padding: "20px", flex: 1, alignContent: "center", justifyContent: 'center'}}>
                {
                // If we are on mobile, we dont want the left hand display
                !isMobile &&
                <Image
                    source={require("../../assets/images/steig-black.png")}
                    style={{display: "inline", width: "50%", height: "50%", position: "relative", left: "25%"}}
                    resizeMode='contain'>
                    
                </Image>
                }
            </View>

        </View>
        {/*Login container container*/}
        <View style={{ flex: 2, alignItems: "center", justifyContent: "center", padding: "20px" }}>

            <View style={{ justifyContent: "center", rowGap: "10px" }}>
                <View >
                    {
                        isMobile &&
                        <Image
                            source={require("../../assets/images/steig-black.png")}
                            style={{display: "inline", maxWidth: "100px", maxHeight: "100px", margin: "20px", alignSelf: "center"}}
                            resizeMode='contain'>
                        </Image>
                    }
                    <Text variant="headlineSmall">
                        Please sign in
                    </Text>
                </View>
                <TextInput
                    label="Email"
                    value={email}
                    mode='outlined'
                    onChangeText={text => setEmail(text)}
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

                <View style={{alignSelf: "baseline"}}>
                    <Text style={{display: "inline"}}>
                        Don't have an account yet?
                        <Button
                            style={{margin: "0px"}}
                            onPress={() => router.push("/signup")}>
                            Sign up
                        </Button>
                    </Text>
                </View>

                <Divider style={{marginBottom: "10px"}}/>  

                <Button
                    mode="outlined"
                    rippleColor="#FF000020">
                    <View style={{display:"flex", flexDirection: "row", justifyContent: "baseline"}}>
                        <Icon source="google" style={{display: "inline"}}></Icon>
                        <Text style={{display: "inline"}}>Sign in with Google</Text>
                    </View>
                </Button>

                <Divider style={{marginTop: "10px", marginBottom: "10px"}}/>

                <View style={{display: "flex", flexDirection: "row", columnGap: "10px"}}>
                    <Button
                            mode="contained"
                            rippleColor="#FF000020"
                            onPress={() => submit()}
                            style={{flex: 1}}
                        >
                            Sign in
                    </Button>
                </View>

            </View>
        </View>
        {/*Right Container to center login */}
        <View style={{flex: 1}}>
        </View>
    </View>
    </ScrollView>
  );
}