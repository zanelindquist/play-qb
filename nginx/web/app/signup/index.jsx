import { Link, useRouter } from 'expo-router';

import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Image
} from 'react-native';

import { DatePickerInput } from 'react-native-paper-dates';
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Button, TextInput, HelperText, Text, useTheme, Divider, Icon, Card, Menu } from 'react-native-paper';

import theme from '../../assets/themes/theme.js';
import { hashPassword, saveAccessToken } from "../../utils/encryption.js"
import { signUp, validateEmail , handleExpiredAccessToken } from "../../utils/requests.jsx"

const { width } = Dimensions.get('window');


const SignUp = () => {
    const colors = useTheme()

    const [email, setEmail] = React.useState("");

    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const [phoneNumber, setPhoneNumber] = useState('');

    const [inputDate, setInputDate] = React.useState(undefined)

    const [firstname, setFirstname] = React.useState("")
    const [lastname, setLastname] = React.useState("")
    const [age, setAge] = React.useState(18)

    const [visible, setVisible] = useState(false);
    const [selectedGender, setSelectedGender] = useState('');

    // Helper text visibility
    const [HTVisibleStates, setHTVisibleStates] = useState({
        email: false, password: false, phone: false, firstname: false, lastname: false, birthday: false
    })


    // State to manage phases
    const [phase, setPhase] = useState(1);
    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);
    const handleSelect = (gender) => {
        setSelectedGender(gender);
        closeMenu();
    };

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

    const isMobile = width < 680;
    const router = useRouter()

    // Animated value to handle sliding
    const translateX = useRef(new Animated.Value(width/2)).current;

    // Slide animation function
    const goToNextPhase = async () => {
        // In case the user had input incorrect info and then edited it, lets set all of the helper text to invisible to start the procces fresh
        setHTVisibleStates({
            email: false, pasword: false, phone: false, firstname: false, lastname: false, birthday: false
        })
        // First, make sure the passwords match
        if(password !== confirmPassword) return handleInvalidField("Password does not match confirm password field")
        
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

        // First make sure there are no problems with the data inputs on this page before we go to the next
        try{
            const response = await validateEmail(email)

            Animated.timing(translateX, {
                toValue: -width/2, // Slide left by one screen width
                duration: 250,
                useNativeDriver: true,
            }).start(() => setPhase(2));
        } catch (error) {
            console.log(error)
            // If the email is invalid, set the helper text as the error below the field
            if(error?.response && error.response.data.error) {
                handleInvalidField(error.response.data.error)
            }
        }
    };

    const goToPreviousPhase = () => {
        Animated.timing(translateX, {
        toValue: width/2, // Slide back to the first phase
        duration: 500,
        useNativeDriver: true,
        }).start(() => setPhase(1));
    };

    const submit = async () => {
        // In case the user had input incorrect info and then edited it, lets set all of the helper text to invisible to start the procces fresh
        setHTVisibleStates({
            email: false, pasword: false, phone: false, firstname: false, lastname: false, birthday: false
        })

        const birthday = new Date(inputDate)
        
        try {
            const response = await signUp({
                email: email,
                password: password,
                firstname: firstname,
                lastname: lastname,
                phone_number: phoneNumber,
                birthday: `${birthday.getMonth() + 1}/${birthday.getDate()}/${birthday.getFullYear()}`
            })

            const accessToken = response.data.access_token
            saveAccessToken(accessToken)
            
            // Now, lets redirect them to the dashboard page
            router.push("/")
        } catch (error) {
            console.log(error)
            // Handle data input errors
            if(error.response.data.error) {
                handleInvalidField(error.response.data.error)
            }
        }
    }

    return (
        <View style={styles.container}>
            {/*Top logo and text*/}
            <Image
                source={require("../../assets/images/steig-black.png")}
                style={styles.logoImage}
                resizeMode='contain'
                >
            </Image>
            <HelperText style={styles.header}>Create Account</HelperText>
            
            {/* Lower container where all of the action happens*/}
            <Animated.View
                style={[
                    styles.animatedContainer,
                    { transform: [{ translateX }] },
                ]}
            >
                {/* Phase 1 */}
                <View style={styles.phaseContainer}>
                    <TextInput
                        style={styles.input}
                        label="Email"
                        value={email}
                        mode='outlined'
                        onChangeText={text => setEmail(text)}
                    />
                    <HelperText type="error" visible={!!HTVisibleStates.email}>
                        {HTVisibleStates.email}
                    </HelperText>
                    <TextInput
                        style={styles.input}
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
                    <TextInput
                        style={styles.input}
                        label="Confirm password"
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
                            rippleColor="#FF000020"
                            onPress={goToNextPhase}
                            style={styles.nextButton}
                        >
                            Next
                    </Button>
                    <View style={styles.linkContainer}>
                        <HelperText >Alreay have an account?</HelperText>
                        <Link href="https://app.localhost/signin" style={styles.link}>
                            Sign in
                        </Link>
                    </View>
                </View>

                {/* Phase 2 */}
                <View style={styles.phaseContainer}>
                    <TextInput
                        style={styles.input}
                        label="Phone number"
                        value={phoneNumber}
                        onChangeText={text => setPhoneNumber(text)}
                        mode='outlined'
                        keyboardType="numeric"
                    />
                    <HelperText type="error" visible={!!HTVisibleStates.phone}>
                        {HTVisibleStates.phone}
                    </HelperText>
                    <TextInput
                        style={styles.input}
                        label="Firstname"
                        value={firstname}
                        mode='outlined'
                        onChangeText={text => setFirstname(text)}
                    />
                    <HelperText type="error" visible={!!HTVisibleStates.firstname}>
                        {HTVisibleStates.firstname}
                    </HelperText>
                    <TextInput
                        style={styles.input}
                        label="Lastname"
                        value={lastname}
                        mode='outlined'
                        onChangeText={text => setLastname(text)}
                    />
                    <HelperText type="error" visible={!!HTVisibleStates.lastname}>
                        {HTVisibleStates.lastname}
                    </HelperText>
                    <SafeAreaProvider>
                        <DatePickerInput
                        mode='outlined'
                        locale="en"
                        label="Birthdate"
                        value={inputDate}
                        onChange={(d) => setInputDate(d)}
                        inputMode="start"
                        style={styles.input}
                        />
                    </SafeAreaProvider>
                    <HelperText type="error" visible={!!HTVisibleStates.birthday}>
                        {HTVisibleStates.birthday}
                    </HelperText>
                    <Menu
                        visible={visible}
                        onDismiss={closeMenu}
                        anchor={
                            <Button
                                mode="outlined"
                                onPress={openMenu}
                                style={styles.genderButton}
                                contentStyle={styles.buttonContent}
                                labelStyle={{ color: colors.colors.onSurface }}
                                
                            >
                                {selectedGender || 'Select Gender'}
                            </Button>
                        }
                    >
                        <Menu.Item onPress={() => handleSelect('Male')} title="Male" />
                        <Menu.Item onPress={() => handleSelect('Female')} title="Female" />
                        <Menu.Item
                        onPress={() => handleSelect('Prefer not to say')}
                        title="Prefer not to say"
                        />
                    </Menu>

                    <Divider style={styles.divider}/>
                    
                    <Button
                            mode="outlined"
                            rippleColor="#FF000020"
                            onPress={goToPreviousPhase}
                            style={styles.nextButton}
                        >
                            Back
                    </Button>
                    <Divider style={styles.divider}/>
                    <Button
                            mode="contained"
                            rippleColor="#FF000020"
                            onPress={submit}
                            style={styles.nextButton}
                        >
                            Create Account
                    </Button>
                </View>
            </Animated.View>
        </View>
  );
};

const inputWidth = "40vw"
const inputMaxWidth = 500
const inputMinWidth = 350

const styles = StyleSheet.create({
    container: {
        height: "100vh",
        alignItems: 'center',
        justifyContent: "center",
        backgroundColor: theme.background
    },
    animatedContainer: {
        flexDirection: 'row',
        width: '200vw', // Twice the screen width
    },
    logoImage: {
        position: "relative",
        bottom: 0,
        maxHeight: 150,
    },
    phaseContainer: {
        flex: 2,
        width: "50%",
        alignItems: "center",

        padding: "20px",
        marginBottom: "40px" 
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        margin: 20,
    },
    input: {
        minWidth: inputMinWidth,
        maxWidth: inputMaxWidth,
        width: inputWidth,
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    linkContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        margin: 20,
        fontSize: "1rem"
    },
    link: {
        color: theme.primary,
    },
    genderButton:{
        minWidth: inputMinWidth,
        maxWidth: inputMaxWidth,
        width: inputWidth,
        backgroundColor: theme.surface, // Same as TextInput background
        borderColor: theme.onBackground, // Matches the border of TextInput
        borderWidth: 1,
        borderRadius: 4,
        justifyContent: 'center',
        paddingVertical: 5, // Mimics TextInput paddi
    },
    buttonContent: {
        justifyContent: 'flex-start', // Align text to the left
        color: "black"
    },
    nextButton: {
        maxWidth: inputMaxWidth,
        minWidth: inputMinWidth,
        width: inputWidth,
    },
    divider: {
        marginTop: "10px",
        marginBottom: "10px",
    }
});

export default SignUp;