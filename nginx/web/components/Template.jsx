import { useState } from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Text } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import theme from "../../assets/themes/theme";


export default function Template ({
    players, style
}) {

    return (
        <GlassyButton style={[styles.container, style]}>
        
        </GlassyButton>
    )
}

const styles = StyleSheet.create({

})