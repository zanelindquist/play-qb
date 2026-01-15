import { useState, useRef, useEffect } from "react";
import { Platform, View, ScrollView, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";
import ExpandableView from "../custom/ExpandableView";
import GradientText from "../custom/GradientText";
import { router } from "expo-router";

import theme from "../../assets/themes/theme";

const HOVER_DELAY = 50

export default function BentoGameMode ({
    gamemode,
    style
}) {
    const [isHovering, setIsHovering] = useState(false);

    function handleHoverIn() {
        setTimeout(() => setIsHovering(true), HOVER_DELAY);
    }

    function handleHoverOut() {
        setTimeout(() => setIsHovering(false), HOVER_DELAY);
    }

    return (
        <GlassyView
            style={[styles.bentoBox, style]}
            onPress={() => router.replace(gamemode.href)}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            gradient={
                isHovering && {
                              colors: theme.gradients.backgroundTint,
                              start: { x: 1, y: 0 },
                              end: { x: 1, y: 1 },
                          }
            }
        >
            <View style={[styles.leftAccent, {backgroundColor: gamemode.color}]}></View>
            <View style={styles.icon}>
                <Icon
                    source={gamemode.icon}
                    size={50}
                    color={gamemode.color}
                />
            </View>

            <View style={styles.right}>
                    <HelperText
                        style={[styles.title, {color: theme.onSurface}]}
                    >{gamemode.name}</HelperText>

                <HelperText style={styles.subtitle}>{gamemode.description}</HelperText>
            </View>
        </GlassyView>
    )
}

const styles = StyleSheet.create({
    bentoBox: {
        padding: 0,
        flexGrow: 1,
        flexShrink: 1,
        width: "33.3%",
        height: 150,
        flexDirection: "row",
        gap: 10,
        borderRadius: 10,
        // justifyContent: "center",
        // alignItems: "center"
    },
    leftAccent: {
        width: 15,
        height: "100%",
    },
    icon: {
        paddingTop: 20
    },
    right: {
        flexDirection: "column",
        gap: 10,
        paddingTop: 30,
        flexShrink: 1,
    },
    logoTitle: {
        flexDirection: "row",
        alignItems: "center"
    },
    title: {
        fontSize: 40,
        fontWeight: 700,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    subtitle: {
        color: theme.secondary,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    }
})