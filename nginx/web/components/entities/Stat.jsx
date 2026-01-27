// React native components
import { Platform, View, ScrollView, StyleSheet, Pressable, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton, ActivityIndicator } from "react-native-paper";

// Hooks
import theme from "../../assets/themes/theme";
import { useState, useRef, useEffect } from "react";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";
import { router } from "expo-router";
import {capitalize} from "../../utils/text"

// Custom components
import ExpandableView from "../custom/ExpandableView";
import GlassyView from "../custom/GlassyView";
import GlassyButton from "../custom/GlassyButton";
import InfoButton from "../custom/InfoButton";
import ustyle from "../../assets/styles/ustyles"


export default function Stat ({
    name,
    value,
    description="hi",
    style
}) {
    const {showAlert} = useAlert()

    function handlePress() {
        showAlert(
            <GlassyView
                style={[styles.container]}
            >
                <HelperText style={ustyle.text.text}>{description}</HelperText>
                <View style={styles.left}>
                    <HelperText style={styles.value}>{value}</HelperText>
                    <HelperText style={styles.name}>{name.split("_").map((n) => capitalize(n)).join(" ")}</HelperText>
                </View>
            </GlassyView>
            , ustyle.modals.floatingModal
        )
    }
    
    return (
        <Pressable
            style={[styles.container, style]}
            onPress={handlePress}
        >
            <View style={styles.left}>
                <HelperText style={styles.value}>{value}</HelperText>
                <HelperText style={styles.name}>{name.split("_").map((n) => capitalize(n)).join(" ")}</HelperText>
            </View>
        </Pressable>
    )
}

function StatRow ({
    title,
    children
}) {
    return (
        <View style={styles.statRowContainer}>
            <HelperText style={styles.title}>{title}</HelperText>
            <View style={styles.row}>
                {children}
            </View>
        </View>
    )
}

Stat.Row = StatRow

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.surface,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 8,
        padding: 16,
        borderRadius: 12,
        minWidth: 180,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        shadowColor: "rgba(0,0,0,0.15)",
        shadowOffset: { width: 0, height: 4},
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 5,
    },
    left: {
        flexDirection: "column",
        gap: 6,
        width: "100%",
    },
    name: {
        fontSize: 14,
        fontWeight: "600",
        textShadowColor: "rgba(0,0,0,0.6)",
        textShadowOffset: { width: 1, height: 1},
        textShadowRadius: 1,
        opacity: 0.85,
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 36,
        color: theme.primary,
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 2, height: 2},
        textShadowRadius: 3,
    },

    statRowContainer: {
        width: "100%",
        gap: 15,
        marginVertical: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 1, height: 1},
        textShadowRadius: 2,
        marginBottom: 5,
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: "row",
        gap: 12,
        justifyContent: "flex-start",
        flexWrap: "wrap",
        width: "100%",
    }
})