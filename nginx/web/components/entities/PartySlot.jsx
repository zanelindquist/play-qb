import React, {useEffect, useState, useRef} from "react";
import { Platform, View, StyleSheet, Pressable, TextInput, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { HelperText, Icon, IconButton, Text,  } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";

import theme from "../../assets/themes/theme";
import GradientText from "../custom/GradientText";

// TODO: Hover for stat tooltip
const HOVER_MULTIPLIER = 1.1;
const ANIMATION_DURATION = 150;
const HOVER_DELAY = 100;

export default function PartySlot ({ style, player, isMe=false, onPress = () => {}}) {
    const [normalHeight, setNormalHeight] = useState(0)
    const animatedHeight = useRef(new Animated.Value(0)).current
    const [isHovering, setIsHovering] = useState(false)

    function capitalize(text) {
        if(!text) return "Undefined"
        return text.split("")[0].toUpperCase() + text.split("").slice(1).join("")
    }

    function handleHoverIn() {
        setTimeout(() => setIsHovering(true), HOVER_DELAY)
        
        // if (normalHeight > 0) {
        //     Animated.timing(animatedHeight, {
        //         toValue: normalHeight * HOVER_MULTIPLIER,
        //         duration: ANIMATION_DURATION,
        //         useNativeDriver: false,
        //     }).start()
        // }
    }

    function handleHoverOut() {
        setTimeout(() => setIsHovering(false), HOVER_DELAY)
        // if (normalHeight > 0) {
        //     Animated.timing(animatedHeight, {
        //         toValue: normalHeight,
        //         duration: ANIMATION_DURATION,
        //         useNativeDriver: false,
        //     }).start()
        // }
    }

    return (
        <Animated.View
            style={[
                styles.animated,
                style,
                // Apply animated height only if layout height has been measured
                animatedHeight && animatedHeight._value > 0 ? { height: animatedHeight } : null
            ]}
            onLayout={e => {
                const height = e.nativeEvent.layout.height
                setNormalHeight(height)
            }}
        >
        <GlassyView
            style={styles.container}
            gradient={
                isHovering && !isMe && {
                colors: theme.gradients.backgroundTint,
                start: { x: 1, y: 0 },
                end: { x: 1, y: 1 },
            }}
            onPress={onPress}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
        >
        {
            player ?
            <>
            <View style={styles.circle}>
                <Icon source={"account-outline"} size={"3rem"} color={theme.onPrimary}/>
            </View>
            <GradientText size={"1.2rem"} style={styles.name}>{player?.firstname[0]}. {player.lastname}</GradientText>
            </>
            :
            <IconButton icon={"plus"}/>
        }
            
        </GlassyView>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    animated: {
        marginTop: 10
    },
    container: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
        height: "100%",
        minHeight: 300,
        maxHeight: 350
    },
    circle: {
        padding: 5,
        borderRadius: "50%",
        backgroundColor: theme.primary
    },
    name: {
        letterSpacing: 0,
        textAlign: "center",
        textShadowColor: "black",
        textShadowOffset: 2,
        textShadowRadius: 1
    }
})