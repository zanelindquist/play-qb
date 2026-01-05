import { useState, useRef, useEffect } from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import theme from "../../assets/themes/theme";
import GlassyView from "../custom/GlassyView";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";

export default function ShowSettings ({
    style,
    onChange=null
}) {
    const [showSettings, setShowSettings] = useState(false)

    useEffect(() => {
        if(onChange) onChange(showSettings)
    }, [showSettings])

    return (
        <GlassyView style={styles.settingsButtonContainer}>
            <IconButton
                icon="cog"
                style={styles.settingsButton}
            />
            <IconButton
                icon={showSettings ? "chevron-up" : "chevron-down"}
                style={styles.settingsButton} 
                onPress={() => setShowSettings(!showSettings)}
                rippleColor={theme.onBackground}
            />
        </GlassyView>
    )
}

const styles = StyleSheet.create({
    settingsButtonContainer: {
        padding: 0,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.background,
        borderRadius: 999
    },
    settingsButton: {
        margin: 0,
        backgroundColor: "transparent"
    },
})