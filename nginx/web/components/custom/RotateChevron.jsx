// React native components
import { Platform, View, ScrollView, StyleSheet, Pressable, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton } from "react-native-paper";

// Hooks
import theme from "../../assets/themes/theme";
import { useState, useRef, useEffect } from "react";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";
import { router } from "expo-router";

// Custom components
import ExpandableView from "../custom/ExpandableView";
import GlassyView from "../custom/GlassyView";
import GlassyButton from "../custom/GlassyButton";


export default function RotateChevron ({
    children,
    // If the arrows point up and down
    isVertical=true,
    onPress = () => {},
    style
}) {
    const rotationRef = useRef(new Animated.Value(0)).current;
    const rotationDeg = useRef(0);

    const rotate = () => {
        rotationDeg.current = (rotationDeg.current + 180) % 360;

        Animated.timing(rotationRef, {
                toValue: rotationDeg.current,
                duration: 250,
                useNativeDriver: true,
        }).start();
    };

    const rotateInterpolate = rotationRef.interpolate({
        inputRange: [0, 180],
        outputRange: ["0deg", "180deg"],
    });

    function handlePress(state) {
        onPress(state)
        rotate()
    }

    return (
        <IconButton
            icon={isVertical ? "chevron-down" : "chevron-right"}
            style={[styles.button, {transform: [{rotate: rotateInterpolate}]}]}
            onPress={handlePress}
        />
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: "transparent",
    }
})