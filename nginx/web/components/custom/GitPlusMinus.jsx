// React native components
import { Platform, View, ScrollView, StyleSheet, Pressable, Animated } from "react-native";
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


export default function GitPlusMinus ({
    plus=0,
    minus=0,
    style
}) {

    const cubes = [0.2, 0.4, 0.6, 0.8]

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.plus}>+{plus}</Text>
            <Text style={styles.minus}>-{minus}</Text>
            <View style={styles.cubes}>
                {
                    cubes.map((threshold) => 
                        <View
                            style={[
                                styles.cube,
                                {
                                    backgroundColor: plus / (plus + minus) < threshold ? theme.static.wrong : theme.static.correct,
                                    borderWidth: 0,
                                }
                            ]}
                        ></View>
                    )
                }
                <View
                    style={[
                        styles.cube,
                        {backgroundColor: theme.elevation.level2}
                    ]}
                ></View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
    },
    plus: {
        paddingHorizontal: 5,
        color: theme.static.correct
    },
    minus: {
        color: theme.static.wrong
    },
    cubes: {
        flexDirection: "row",
        alignItems: "center",
        gap: 1,
        marginLeft: 10,
    },
    cube: {
        width: 10,
        height: 10,
        borderWidth: 1,
        borderColor: theme.surfaceBright
    }
})