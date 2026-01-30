import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../../assets/themes/theme";

export default function GradientFlair({ children, colors, style }) {
    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={colors || ["transparent", theme.onPrimary, theme.onPrimary, "transparent"]} // your gradient colors
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }} // horizontal
                style={styles.flair}
            />
            <LinearGradient
                colors={colors || ["transparent", theme.onPrimary, "transparent"]} // your gradient colors
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }} // horizontal
                style={[styles.flair, styles.flairAccent]}
            />
            <Text style={styles.text}>{children}</Text>
        </View>
    );
}

const ROTATE = 0

const styles = StyleSheet.create({
    container: {
        position: "relative",
        marginVertical: 8,
        alignSelf: "flex-start", // keeps it tight around text
        paddingHorizontal: 100,
        transform: [{rotateZ: `${ROTATE}deg`}]
    },
    flair: {
        position: "absolute",
        left: -8, // extend a little beyond text
        right: -8,
        top: "40%", // center vertically
        height: 20, // thickness of bar
        borderRadius: 3, // rounded ends
        transform: [{ translateY: -3 }],
        zIndex: -1, // behind text
    },
    flairAccent: {
        transform: [{rotateZ: `-${2* ROTATE}deg`}]
    },
    text: {
        fontSize: 30,
        fontWeight: "bold",
        paddingHorizontal: 4,
        color: theme.onBackground,
        textAlign: "center",
        transform: [{rotateZ: `-${ROTATE}deg`}]

    },
});
