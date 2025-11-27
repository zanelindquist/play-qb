import React from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Text } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";

// TODO: Hover for stat tooltip

export default function PlayerLine ({ player, style }) {

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.name}>{player.name}</Text>
            <Text style={styles.score}>{player.score}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginTop: 5,
    },
    name: {
        fontSize: 16,
        fontWeight: 600
    }
})