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


export default function Stat ({
    name,
    value,
    description="hi",
    style
}) {
    
    return (
        <View style={[styles.container, style]}>
            <View style={styles.left}>
                <HelperText style={styles.value}>{value}</HelperText>
                <HelperText style={styles.name}>{name.split("_").map((n) => capitalize(n)).join(" ")}</HelperText>
            </View>
            <InfoButton
                description={description}
            />
        </View>
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
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        padding: 10,
        borderRadius: 5,
        minWidth: 200,
        zIndex: -1,
        elevation:-1,
    },
    left: {
        flexDirection: "column",
        gap: 10,
    },
    name: {
        fontSize: 16,
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 2, height: 2},
        textShadowRadius: 2,
    },
    value: {
        fontSize: 30,
        color: theme.primary,
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 3, height: 3},
        textShadowRadius: 2,
    },

    statRowContainer: {
        width: "100%",
        gap: 10,
        flexWrap: "wrap"
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 1, height: 1},
        textShadowRadius: 2,
    },
    row: {
        flexDirection: "row",
        gap: 10,
        justifyContent: "space-between"
    }
})