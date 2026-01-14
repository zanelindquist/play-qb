import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { HelperText, Icon, IconButton, Text } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";

import theme from "../../assets/themes/theme";
import GradientText from "../custom/GradientText";
import { capitalize } from "../../utils/text";

// TODO: Hover for stat tooltip
const HOVER_MULTIPLIER = 1.1;
const ANIMATION_DURATION = 150;
const HOVER_DELAY = 100;

export default function Friend({ style, friend, showIcon=true, onPress = () => {} }) {
    if (!friend) return;

    const [isInvited, setIsInvited] = useState(false);

    const [normalHeight, setNormalHeight] = useState(0);
    const [isHovering, setIsHovering] = useState(false);

    function handleHoverIn() {
        setTimeout(() => setIsHovering(true), HOVER_DELAY);
    }

    function handleHoverOut() {
        setTimeout(() => setIsHovering(false), HOVER_DELAY);
    }

    function handlePress() {
        setIsInvited(true);
        if (onPress) onPress();
    }

    return (
        <View
            style={[
                styles.container,
                isHovering && { backgroundColor: "white" },
            ]}
            onPress={handlePress}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
        >
            <View style={styles.left}>
                {
                    showIcon &&
                    <IconButton
                        icon={"account-outline"}
                        size={"2rem"}
                        iconColor={theme.onPrimary}
                        style={[
                            styles.iconButton,
                            { backgroundColor: theme.primary },
                        ]}
                    />
                }
                <HelperText style={[styles.name, !friend.is_online && styles.offline]}>{friend.username}</HelperText>
            </View>
            <View style={styles.right}>
                {
                    friend.is_online &&
                    <Icon source={"circle"} color={theme.static.correct}/>
                }

                <IconButton
                    icon={isInvited ? "check" : "email-arrow-right"}
                    size={"1.5rem"}
                    onPress={handlePress}
                    style={styles.iconButton}
                    disabled={!friend.is_online}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    animated: {
        marginTop: 10,
    },
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
    },
    circle: {
        padding: 5,
        borderRadius: "50%",
        backgroundColor: theme.primary,
    },
    iconButton: {
        backgroundColor: theme.onPrimary,
        width: 40,
        height: 40,
        borderRadius: "50%",
    },
    name: {
        fontSize: "1rem",
        color: theme.onSurface,
        letterSpacing: 0,
        textAlign: "center",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    offline: {
        color: theme.outline
    }
});
