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
import WikipediaModal from "../modals/WikipediaModal";

// With dynamic loading, if wikipedia is not defined, then we will fetch the info from the server when the modal is pressed
export default function WikipediaLink ({
    question,
    dynamicLoading=true,
    style
}) {
    if ((!question?.wikipedia && !dynamicLoading) || question?.wikipedia?.url.endsWith("wiki")) return;

    const {showAlert} = useAlert()

    function openModal() {
        showAlert(
            <WikipediaModal question={question} dynamicLoading={dynamicLoading}/>,
            ustyles.modals.floatingModal
        )
    }

    return (
        <IconButton
            icon={"wikipedia"}
            style={styles.wikipedia}
            size={16}
            onPress={openModal}
        />
    )
}

const styles = StyleSheet.create({
    wikipedia: {
        margin: 0,
    },
})