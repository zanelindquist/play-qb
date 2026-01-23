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
import Logo from "./Logo";
import PremiumModal from "../modals/PremiumModal";


export default function GetPremium ({
    message="It looks like you need premium to access these features",
    style
}) {
    const {showAlert} = useAlert()

    const openPremiumModal = React.useCallback(()=> {
        showAlert(
            <PremiumModal
                message={message}
            />
            ,
            ustyles.modals.floatingModal
        )
    })

    useEffect(() => {
        openPremiumModal()
    }, [])
}

const styles = StyleSheet.create({
    container: {

    },
})