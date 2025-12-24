import React from "react";
import { Text, Platform } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import theme from "@/assets/themes/theme";

export default function GradientText({
    children,
    colors = [theme.primary, theme.secondary], //theme.static.gradients.textArray
    start = { x: 0, y: 0 },
    end = { x: 1, y: 0 },
    style,
    size=20,
    weight=500
}){

  // Web fallback using CSS background-clip
    if (Platform.OS === "web") {
        return (
        <Text
            style={[
            style,
            {
                fontSize: size,
                fontWeight: weight,
                color: "transparent",
                backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
            },
            ]}
        >
            {children}
        </Text>
        );
    }

    // Native (iOS/Android)
    return (
        <MaskedView
        maskElement={
            <Text style={[style, { backgroundColor: "transparent", fontSize: size, fontWeight: weight, }]}>
            {children}
            </Text>
        }
        >
        <LinearGradient colors={colors} start={start} end={end} style={{ flex: 1 }}>
            <Text style={[style, { opacity: 0 }]}>{children}</Text>
        </LinearGradient>
        </MaskedView>
    );
}
