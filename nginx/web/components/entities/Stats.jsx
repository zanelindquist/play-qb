// React native components
import { Platform, View, ScrollView, StyleSheet, Pressable, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton, ActivityIndicator } from "react-native-paper";

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
import Stat from "./Stat";


export default function Stats ({
    stats,
    style
}) {
    console.log(stats)

    const rows = {
        Answers: ["points", "correct", "buzzes", "incorrect"],
        Games: ["games", "rounds", "questions_encountered", "buzzes_encountered"]
    }

    return (
        <GlassyView style={[styles.container, style]}>
            {
                !stats &&
                <ActivityIndicator />
            }
            {
                stats &&
                Object.entries(rows).map(([title, row]) => 
                    <Stat.Row
                        title={title}
                        style={styles.row}
                    >
                        {
                            row.map((item) => 
                                <Stat
                                    name={item}
                                    value={stats[item]}
                                    style={styles.stat}
                                />
                            )
                        }
                    </Stat.Row>
                ) 
            }
        </GlassyView>
    )
}

const styles = StyleSheet.create({
    container: {
        gap: 10,
        overflow: "hidden"
    },
    row: {

    },
    stat: {
        // flexGrow: 1,
        // width: "24%"
    }
})