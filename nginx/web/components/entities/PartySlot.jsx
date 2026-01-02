import React, {useEffect, useState, useRef} from "react";
import { Platform, View, StyleSheet, Pressable, TextInput, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { HelperText, Icon, IconButton, Text,  } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";

import theme from "../../assets/themes/theme";
import GradientText from "../custom/GradientText";
import { capitalize } from "../../utils/text";

// TODO: Hover for stat tooltip
const HOVER_MULTIPLIER = 1.1;
const ANIMATION_DURATION = 150;
const HOVER_DELAY = 100;

export default function PartySlot ({ style, player, isMe=false, ready, onPress = () => {}}) {
    const [normalHeight, setNormalHeight] = useState(0)
    const animatedHeight = useRef(new Animated.Value(0)).current
    const [isHovering, setIsHovering] = useState(false)


    function handleHoverIn() {
        setTimeout(() => setIsHovering(true), HOVER_DELAY)
    }

    function handleHoverOut() {
        setTimeout(() => setIsHovering(false), HOVER_DELAY)
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
                !ready ?
                isHovering && !isMe && {
                    colors: theme.gradients.backgroundTint,
                    start: { x: 1, y: 0 },
                    end: { x: 1, y: 1 },
                } :
                {
                    colors: theme.gradients.readyTint,
                    start: { x: 1, y: 0 },
                    end: { x: 1, y: 1 },
                }
            }
            onPress={onPress}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
        >
        {
            player ?
            <>
            {
                player?.is_leader && <Icon style={styles.partyLeaderCrown} source={"crown"} color="#FFD700" size={20}/>
            }
            <View style={styles.circle}>
                <Icon source={"account-outline"} size={"3rem"} color={theme.onPrimary}/>
            </View>
            <HelperText style={styles.name}>{player?.firstname} {player.lastname}</HelperText>
            </>
            :
            <IconButton icon={"plus"} style={styles.iconButton}/>
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
        backgroundColor: theme.primary,
    },
    partyLeaderCrown: {

    },
    name: {
        fontSize: "1.2rem",
        letterSpacing: 0,
        textAlign: "center",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    iconButton: {
        backgroundColor: "transparent",
    }
})