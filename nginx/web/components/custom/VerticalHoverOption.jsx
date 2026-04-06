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
import ustyles from "../../assets/styles/ustyles"

const HOVER_DELAY = 0

export default function VerticalHoverOption ({
    title,
    description,
    color,
    icon,
    bottom,
    href,
    dark=false,
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
            style={[styles.container, style]}
            onPress={href ? () => router.replace(href) : () => {}}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            gradient={
                isHovering && {
                    colors: theme.gradients.backgroundTint,
                    start: { x: 1, y: 0 },
                    end: { x: 1, y: 1 },
                }
            }
            dark={dark}
        >
            <View style={ustyles.flex.flexColumnSpaceBetween}>
                <View style={ustyles.flex.flexColumnCenterItems}>
                    <Icon
                        source={icon}
                        size={50}
                        color={theme.primary}
                    />
                    <HelperText
                        style={[ustyles.text.massive, {color: theme.onSurface}]}
                    >{title}</HelperText>
                </View>
                <HelperText style={[ustyles.text.shadowText, ustyles.text.text]}>{description}</HelperText>
                {
                    bottom &&
                    <View>
                        {bottom}
                    </View>
                }
            </View>
        </GlassyView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: 300,
        minWidth: 170,
        padding: 20
    },
    icon: {
        paddingTop: 20
    },
    title: {
        fontSize: 40,
        fontWeight: 700,
        textAlign: "center",
        lineHeight: 50,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
})