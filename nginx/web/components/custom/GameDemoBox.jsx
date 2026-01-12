import { useState, useRef, useEffect } from "react";
import { Platform, View, ScrollView, StyleSheet, Pressable, Image } from "react-native";
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

export default function GameDemoBox ({
    info,
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
            <View style={[styles.leftAccent, {backgroundColor: info.color}]}></View>

            <View style={styles.right}>
                <HelperText
                    style={[styles.title, {color: theme.onSurface}]}
                >{info.name}</HelperText>
                <Image 
                    source={info.image}
                    style={styles.image}
                    resizeMode='contain'
                />
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
        height: 250,
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
    right: {
        flexDirection: "column",
        padding: 10,
        paddingBottom: 30,
        flexShrink: 1,
        flexGrow: 1
    },
    logoTitle: {
        flexDirection: "row",
        alignItems: "center"
    },
    title: {
        fontSize: 20,
        fontWeight: 700,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    image: {
        display: "inline",
        alignSelf: "center",
        width: "100%",
        height: "100%",
    },
    subtitle: {
        color: theme.secondary,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    }
})