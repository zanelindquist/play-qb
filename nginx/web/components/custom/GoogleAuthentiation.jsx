// React native components
import { Platform, View, ScrollView, StyleSheet, Pressable, Image, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton, Button } from "react-native-paper";

// Hooks
import theme from "../../assets/themes/theme";
import ustyles from "../../assets/styles/ustyles";
import { useState, useRef, useEffect } from "react";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";
import { router } from "expo-router";

// Custom components
import ExpandableView from "../custom/ExpandableView";
import GlassyView from "../custom/GlassyView";
import GlassyButton from "../custom/GlassyButton";


export default function GoogleAuthentication ({
    text,
    onPress,
    disabled=false,
    style
}) {
    const {showAlert} = useAlert()
    // TODO: Fix google login

    function handleNoGoogleLogin() {
        showAlert("Sorry, but this feature is not working at this moment")
    }

    return (
        <Button
            mode="outlined"
            style={style}
            contentStyle={styles.googleButton}
            rippleColor={theme.primary}
            onPress={ handleNoGoogleLogin}
            disabled={disabled} 
        >
            <Image
                source={require("../../assets/images/google_logo.png")}
                style={styles.googleIcon}
            />
            <HelperText style={[styles.googleText, styles.textShadow]}>
                {text}
            </HelperText>
        </Button>
    )
}

const styles = StyleSheet.create({
    container: {

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
})