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
import { Link, router } from "expo-router";

// Custom components
import ExpandableView from "../custom/ExpandableView";
import GlassyView from "../custom/GlassyView";
import GlassyButton from "../custom/GlassyButton";


export default function WikipediaLink ({
    wikipedia,
    style
}) {
    if (!wikipedia || wikipedia.url.endsWith("wiki")) return;

    return (
        <Link
            href={ wikipedia.url}
            target="_blank" 
            rel="noopener noreferrer" // Recommended for security/performance
            style={style}
        >
            <IconButton
                icon={"wikipedia"}
                style={styles.wikipedia}
                size={16}
            />
        </Link>
    )
}

const styles = StyleSheet.create({
    wikipedia: {
        margin: 0,
    },
})