// React native components
import { Platform, View, ScrollView, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton } from "react-native-paper";

// Hooks
import theme from "../../assets/themes/theme";
import { useState, useRef, useEffect } from "react";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";
import { router } from "expo-router";

// Custom components
import ExpandableView from "../custom/ExpandableView";
import GlassyView from "../custom/GlassyView";
import GlassyButton from "../custom/GlassyButton";


export default function Template ({
    style
}) {

    return (
        <GlassyView style={[styles.container, style]}>
        
        </GlassyView>
    )
}

const styles = StyleSheet.create({

})