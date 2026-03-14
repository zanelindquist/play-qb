import { useRouter } from "expo-router";
import * as WebBrowser from 'expo-web-browser';

import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { HelperText, IconButton } from "react-native-paper";
import Logo from "../components/custom/Logo";
import theme from "../assets/themes/theme";
import ustyles from "../assets/styles/ustyles";

// Call this at module level
WebBrowser.maybeCompleteAuthSession();

export default function Authenticated() {

    return (
        <View style={styles.container}>
            <HelperText style={ustyles.text.massive}>Authenticated</HelperText>
            <IconButton size={100} icon={"check"} style={styles.icon} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "black",
    },
    bg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "black",
    },
    icon: {
        backgroundColor: theme.static.correct,
    },
    text: {
        fontSize: 50,
        fontWeight: "bold",
    },
});
