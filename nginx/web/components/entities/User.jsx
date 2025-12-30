import React, {useEffect, useState, useRef,} from "react";
import { StyleSheet, View } from "react-native";
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

export default function User ({ style, user, onPress = () => {}}) {
    if(!user) return

    const [normalHeight, setNormalHeight] = useState(0)
    const [isHovering, setIsHovering] = useState(false)

    function capitalize(text) {
        if(!text) return "Undefined"
        return text.split("")[0].toUpperCase() + text.split("").slice(1).join("")
    }

    function handleHoverIn() {
        setTimeout(() => setIsHovering(true), HOVER_DELAY)
    }

    function handleHoverOut() {
        setTimeout(() => setIsHovering(false), HOVER_DELAY)
    }

    return (
        <View
            style={[
                styles.container,
                isHovering && {backgroundColor: "white"}
                ]}
            onPress={onPress}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
        >
            <View style={styles.left}>
                <View style={styles.circle}>
                    <Icon source={"account-outline"} size={"2rem"} color={theme.onPrimary}/>
                </View>
                <HelperText style={styles.name}>{user.firstname[0]}. {user.lastname}</HelperText>
            </View>
            <View>
                <View style={[styles.circle, {backgroundColor: theme.onPrimary}]}>
                    <IconButton
                        icon={"account-plus"}
                        size={"1.5rem"}
                        onPress={onPress}
                    />
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    animated: {
        marginTop: 10
    },
    container: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20
    },
    circle: {
        padding: 5,
        borderRadius: "50%",
        backgroundColor: theme.primary
    },
    name: {
        fontSize: "1rem",
        letterSpacing: 0,
        textAlign: "center",
        textShadowColor: "black",
        textShadowOffset: 2,
        textShadowRadius: 1
    }
})