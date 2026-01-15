import React, {useEffect, useState, useRef, use} from "react";
import { Platform, View, StyleSheet, Pressable, TextInput } from "react-native";
import { BlurView } from "expo-blur";
import { Text, Icon, HelperText, IconButton } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";

import theme from "../../assets/themes/theme";
import ExpandableView from "../custom/ExpandableView";

// TODO: Hover for stat tooltip

export default function Answers ({ style, answers, onExpand, onCollapse, event }) {
    const [expanded, setExpanded] = useState(false)
    const mountHeight = useRef(0)

    const moreInformation = answers.accept || answers.prompt || answers.reject || answers.suggested_cateogry

    function onPress() {
        setExpanded(!expanded)
        if(expanded) {
            if(onExpand) onExpand(mountHeight.current)
        } else {
            if(onCollapse) onCollapse()
        }
    }

    return (
        <ExpandableView
            expanded={expanded}
            style={[styles.expandable, style]}
            maxHeight={mountHeight.current}
            duration={300}
        >
            <View
                style={[styles.expandedContainer, !expanded && {
                    position: "absolute",
                    opacity: 0,
                    pointerEvents: "none",
                    left: 0,
                    right: 0
                }]}
                onLayout={(e) => {
                    mountHeight.current = e.nativeEvent.layout.height;
                }}
            >
                <View style={styles.container}>
                    <HelperText style={styles.answerText}>{answers.main}</HelperText>
                    <IconButton icon={"chevron-up"} onPress={onPress}/>
                </View>
                <HelperText style={styles.answerInfo}>Answer information</HelperText>
                {answers.accept && <HelperText>Accept: {answers.accept.join(", ")}</HelperText>}
                {answers.prompt && <HelperText>Prompt: {answers.prompt.join(", ")}</HelperText>}
                {answers.reject && <HelperText>Reject: {answers.reject.join(", ")}</HelperText>}
                {answers.suggested_cateogry && <HelperText>Manually labeled category: {answers.suggested_cateogry.join(", ")}</HelperText>}
            </View>

            {!expanded &&
            <View style={styles.container}>
                <HelperText style={styles.answerText}>{answers.main}</HelperText>
                {moreInformation && <IconButton icon={"chevron-down"} onPress={onPress}/>}
            </View>}
        </ExpandableView>
    )
}

const styles = StyleSheet.create({
    expandable: {
        // backgroundColor: "blue",
        flexDirection: "column",
        justifyContent: "flex-end",
    },
    container: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10
    },
    expandedContainer: {

        // backgroundColor: "red"
    },
    answerText: {
        fontSize: 17,
        fontWeight: "bold",
    },
    answerInfo: {
        fontWeight: "bold",
        fontSize: "0.8rem"
    }
})