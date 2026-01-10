import { useState, useRef, useEffect } from "react";
import { Platform, View, ScrollView, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton, Switch } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import theme from "../../assets/themes/theme";
import GlassyView from "../custom/GlassyView";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";
import ExpandableView from "../custom/ExpandableView";


export default function LabeledToggle ({
    style,
    onChange=null,
    label1="Create Custom",
    label2="Join Custom"
}) {
    const [isFirst, setIsFirst] = useState(true)

    function handleToggle() {
        if(onChange) onChange(!isFirst)
        setIsFirst(!isFirst)
    }

    return (
        <View style={styles.container}>
            <HelperText
                style={[styles.side, styles.left, isFirst && styles.selected]}
                mode={isFirst ? "filled" : "contained"}
                onPress={handleToggle}
            >{label1}</HelperText>
            <View style={[styles.switchContainer, isFirst && styles.right, !isFirst && styles.left]}>
                <Switch
                    value={!isFirst}
                    onValueChange={handleToggle}
                    style={styles.switch}
                />
            </View>

            <HelperText
                style={[styles.side, styles.right, !isFirst && styles.selected]}
                mode={!isFirst ? "filled" : "contained"}
                onPress={handleToggle}
            >{label2}</HelperText>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignSelf: "flex-start",
        alignItems: "center",
        backgroundColor: theme.surface,
        borderRadius: 999,
    },
    selected: {
        backgroundColor: theme.elevation.level4
    },
    switchContainer: {
        backgroundColor: theme.elevation.level4,
        padding: 10,
        height: "100%",
        justifyContent: "center",
        borderRadius: 999,
    },
    switch: {
        // height: "100%"
    },
    side: {
        // width: 200,
        fontSize: "1rem",
        color: theme.onSurface,
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderRadius: 999,
    },
    left: {
        borderBottomRightRadius: 0,
        borderTopRightRadius: 0,
        paddingRight: 10,
    },
    right: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        paddingLeft: 10,
    }
})