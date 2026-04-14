import React, { useRef } from "react";
import {
    Platform,
    View,
    StyleSheet,
    Pressable,
    TextInput,
    Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { HelperText, Icon, Text } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";

import theme from "../../assets/themes/theme";
import ustyles from "../../assets/styles/ustyles"
import GradientText from "../custom/GradientText";
import { capitalize } from "../../utils/text";

// Hover animation
const ANIMATION_DURATION = 150;

export default function GameMode({
    style,
    gamemode,
    icon = "account-multiple",
    selected = false,
    onPress = () => {},
    playersOnline=false,
    minWidth = 200,
    maxWidth = 220,
}) {
    const animatedWidth = useRef(new Animated.Value(minWidth)).current;

    function handleHoverIn() {
        Animated.timing(animatedWidth, {
            toValue: maxWidth,
            duration: ANIMATION_DURATION,
            useNativeDriver: false,
        }).start();
    }

    function handleHoverOut() {
        Animated.timing(animatedWidth, {
            toValue: minWidth,
            duration: ANIMATION_DURATION,
            useNativeDriver: false,
        }).start();
    }

    return (
        <Animated.View
            style={[
                styles.animated,
                style,
                { width: animatedWidth },
            ]}
        >
            <GlassyView
                style={styles.container}
                gradient={
                    selected && {
                        colors: theme.gradients.selectedMode,
                        start: { x: 0, y: 0 },
                        end: { x: 1, y: 1 },
                    }
                }
                onPress={onPress}
                onHoverIn={handleHoverIn}
                onHoverOut={handleHoverOut}
            >
                <View style={styles.nameContainer}>
                    <Icon source={icon} size={20} color={theme.tertiary} />
                    <GradientText size={"1rem"} style={styles.name}>
                        {gamemode.alias}
                    </GradientText>
                </View>
                {
                    !isNaN(playersOnline) &&
                    <View style={styles.playersOnlineContainer}>
                        <Icon source={"circle"} color={theme.static.correct}/>
                        <HelperText style={styles.playersOnlineText}>{playersOnline}</HelperText>
                    </View>
                }
            </GlassyView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    animated: {
        
    },
    container: {
        flexDirection: "row",
        gap: 20,
        justifyContent: "space-between"
    },
    nameContainer: {
        flexDirection: "row",
        flexGrow: 1,
        gap: 10
    },
    name: {
        fontSize: "2rem",
        letterSpacing: 1,
    },
    playersOnlineContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    playersOnlineText: {
        fontSize: "0.8rem",
        fontWeight: "bold"
    },

    // Condenced styles
});

const mstyles = StyleSheet.create({
    container: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "auto"
    }
})