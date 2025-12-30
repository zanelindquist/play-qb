import React, {useEffect, useState, useRef} from "react";
import { Platform, View, StyleSheet, Pressable, TextInput, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { HelperText, Icon, Text,  } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";

import theme from "../../assets/themes/theme";
import GradientText from "../custom/GradientText";

// TODO: Hover for stat tooltip
const HOVER_MULTIPLIER = 1.1;
const ANIMATION_DURATION = 150;

export default function GameMode ({ style, gamemode, icon="account-multiple", selected=false, onPress = () => {}}) {
    const [normalWidth, setNormalWidth] = useState(0)
    const animatedWidth = useRef(new Animated.Value(0)).current

    function capitalize(text) {
        if(!text) return "Undefined"
        return text.split("")[0].toUpperCase() + text.split("").slice(1).join("")
    }

    function handleHoverIn() {
        if (normalWidth > 0) {
            Animated.timing(animatedWidth, {
                toValue: normalWidth * HOVER_MULTIPLIER,
                duration: ANIMATION_DURATION,
                useNativeDriver: false,
            }).start()
        }
    }

    function handleHoverOut() {
        if (normalWidth > 0) {
            Animated.timing(animatedWidth, {
                toValue: normalWidth,
                duration: ANIMATION_DURATION,
                useNativeDriver: false,
            }).start()
        }
    }

    return (
        <Animated.View
            style={[
                styles.animated,
                style,
                // Apply animated width only if layout width has been measured
                animatedWidth && animatedWidth._value > 0 ? { width: animatedWidth } : null
            ]}
            onLayout={e => {
                const width = e.nativeEvent.layout.width
                setNormalWidth(width)
            }}
        >
        <GlassyView
            style={styles.container}
            gradient={
                selected && {
                colors: theme.gradients?.[gamemode.name + "Array"] || theme.gradients.mysteryArray,
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            }}
            onPress={onPress}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
        >
            <Icon source={icon} size={20} color={theme.tertiary}/>
            <GradientText size={"1rem"} style={styles.name}>{capitalize(gamemode.name)}</GradientText>
        </GlassyView>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    animated: {
        marginTop: 10
    },
    container: {
        flexDirection: "row",
        gap: 20
    },
    name: {
        fontSize: "2rem",
        letterSpacing: 1,
    }
})