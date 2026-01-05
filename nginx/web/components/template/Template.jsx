import { useState, useRef, useEffect } from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import theme from "../../assets/themes/theme";
import GlassyView from "../custom/GlassyView";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";


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