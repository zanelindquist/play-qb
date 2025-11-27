import React from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Text } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import PlayerLine from "./PlayerLine";

export default function PlayerScores ({
    players, style
}) {

    return (
        <GlassyButton style={[styles.container, style]}>
        {
            players.map((p, i) => 
                <PlayerLine key={i} player={p}/>
            )
        }
        </GlassyButton>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "column"
    }
})