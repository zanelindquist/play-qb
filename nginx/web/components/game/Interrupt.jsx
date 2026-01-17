import React, {useEffect, useState, useRef, use} from "react";
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
            <View style={[styles.iconContainer, {backgroundColor: theme.static[event.status]}]}>
                <Icon
                    source={"bell"}
                    size={20}
                />
            </View>
            <HelperText style={styles.name}>{event.player.username}</HelperText>
            <HelperText style={styles.text}>{event.content}</HelperText>
            {
                (event.answerStatus !== undefined) &&
                <HelperText style={[styles.answerStatus, {backgroundColor: theme.static[event.answerStatus.toLowerCase()]}]}>{event.answerStatus}</HelperText>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingLeft: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    iconContainer: {
        padding: 5,
        borderRadius: "50%"
    },
    name: {
        fontSize: "1rem",
    },
    text: {
        fontSize: "1rem"
    },
    answerStatus: {
        padding: 5,
        borderRadius: 3,
    }
})