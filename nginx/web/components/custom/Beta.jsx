// React native components
import { Platform, View, ScrollView, StyleSheet, Pressable, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton, Button } from "react-native-paper";

// Hooks
import theme from "../../assets/themes/theme";
import ustyles from "../../assets/styles/ustyles";
import { useState, useRef, useEffect } from "react";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";
import { router } from "expo-router";

// Custom components
import ExpandableView from "../custom/ExpandableView";
import GlassyView from "../custom/GlassyView";
import GlassyButton from "../custom/GlassyButton";


export default function Beta ({
    style
}) {

    return (
        <HelperText style={[styles.container, style]}>
            Beta
        </HelperText>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.onPrimary,
        borderRadius: 5,
        color: theme.primary,
        margin: 10
    },
})