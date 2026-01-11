import React from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Text, Icon, HelperText } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";

// TODO: Hover for stat tooltip

export default function PlayerLine ({ player, style }) {

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
            <View style={[styles.circle, {backgroundColor: player.color}]}>
                <Text style={styles.score}>{player.score}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 5,
        alignItems: "center",
        justifyContent: "space-between"
    },
    name: {
        flexShrink: 1,
        fontSize: "1rem",
        fontWeight: 600
    },
    circle: {
        width: "3rem",
        height: "1.5rem",
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center"
    },
    score: {
        fontSize: "1.1rem"
    }
})