import React, {useEffect, useState, useRef} from "react";
import { Platform, View, StyleSheet, Pressable, TextInput } from "react-native";
import { BlurView } from "expo-blur";
import { Text, Icon, HelperText } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";

import theme from "../../assets/themes/theme";

// TODO: Hover for stat tooltip

export default function Interrupt ({ style, event }) {

    return (
        <View style={[styles.container, style]}>
            <Icon
                source={"bell"}
                color={theme.primary}
                size={20}
            />
            <HelperText style={styles.name}>{event.player.name}</HelperText>
            <HelperText style={styles.text}>{event.content}</HelperText>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        paddingLeft: 20,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    name: {
        fontSize: "1rem",
    },
    text: {
        
    }
})