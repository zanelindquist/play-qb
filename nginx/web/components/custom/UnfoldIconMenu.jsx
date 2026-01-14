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
import RotateChevron from "./RotateChevron";


export default function UnfoldIconMenu ({
    children,
    style
}) {
    const [unfolded, setUnfolded] = useState(false)

    return (
        <View style={[styles.container, style]}>
            {
                <RotateChevron
                    isVertical={false}
                    style={styles.dots}
                    onPress={() => setUnfolded(!unfolded)}
                />
            }
            {
                unfolded &&
                <View style={styles.children}>{children}</View>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        position: "relative",
    },
    children: {
        backgroundColor: theme.surface,
        borderRadius: 999,
        left: 50,
        flexDirection: "row",
        position: "absolute",
        zIndex: 1,
        elevation: 1,
    },
    dots: {
        backgroundColor: "transparent",
    }
})