import React from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Text } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";

export default function PlayerScores ({
    players, style
}) {

    return (
        <GlassyButton style={[styles.container, style]}>

        </GlassyButton>
    )
}

const styles = StyleSheet.create({

})