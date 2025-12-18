import React from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Text } from "react-native-paper";
import theme from "../../assets/themes/theme";

export default function GlassyButton({
    children,
    style,
    onPress,
    mode,
    textStyle
}) {
    let combined = [
        mode == "filled" ? styles.filled : {},
        styles.glass,
        style
    ];

    let combinedText = [
        styles.text,
        mode == "filled" ? styles.textFilled : {},
    ]

    // native blur
    if (Platform.OS !== "web") {
        return (
        <BlurView intensity={intensity} tint={tint} style={combined}>
            <Text style={combinedText}>{children}</Text>
        </BlurView>
        );
    }

    // web fallback
    return (
        <Pressable onPress={onPress}>
            <View style={[combined, styles.webFallback]}>
                <Text style={combinedText}>{children}</Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    glass: {
        borderRadius: 20,
        overflow: "hidden",

        // 100% transparent — lets blur show real content behind it
        backgroundColor: "rgba(255,255,255,0.05)",

        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",

        // FLOATING EFFECT
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10, // Android floating
        padding: 12,

        flexDirection: 'row',
        justifyContent: "center",
        alignItems: "center"

    },
    webFallback: {
        backdropFilter: "blur(18px) saturate(180%)",
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    text: {
        fontSize: 15,
    },
    filled: {
        backgroundImage: theme.gradients.button,
    },
    textFilled: {
        color: theme.onBackground
    }
});
