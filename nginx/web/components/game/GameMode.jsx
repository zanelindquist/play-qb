import React, { useEffect, useState, useRef } from "react";
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
import GradientText from "../custom/GradientText";
import { capitalize } from "../../utils/text";

// TODO: Hover for stat tooltip
const HOVER_MULTIPLIER = 1.1;
const ANIMATION_DURATION = 150;

export default function GameMode({
    style,
    gamemode,
    icon = "account-multiple",
    selected = false,
    onPress = () => {},
    playersOnline=false,
}) {
    const [normalWidth, setNormalWidth] = useState(0);
    const animatedWidth = useRef(new Animated.Value(0)).current;

    function handleHoverIn() {
        if (normalWidth > 0) {
            Animated.timing(animatedWidth, {
                toValue: normalWidth * HOVER_MULTIPLIER,
                duration: ANIMATION_DURATION,
                useNativeDriver: false,
            }).start();
        }
    }

    function handleHoverOut() {
        if (normalWidth > 0) {
            Animated.timing(animatedWidth, {
                toValue: normalWidth,
                duration: ANIMATION_DURATION,
                useNativeDriver: false,
            }).start();
        }
    }

    return (
        <Animated.View
            style={[
                styles.animated,
                style,
                // Apply animated width only if layout width has been measured
                animatedWidth && animatedWidth._value > 0
                    ? { width: animatedWidth }
                    : null,
            ]}
            onLayout={(e) => {
                const width = e.nativeEvent.layout.width;
                setNormalWidth(width);
            }}
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
                        {capitalize(gamemode.name)}
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
        marginTop: 10,
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
    }
});
