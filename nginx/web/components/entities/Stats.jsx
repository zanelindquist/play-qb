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

    const rows = {
        Answers: [
            {
                name: "points",
                description: "Total points earned from answering questions"
            },
            {
                name: "correct",
                description: "Number of questions answered correctly"
            },
            {
                name: "buzzes",
                description: "Total times the player buzzed in"
            },
            {
                name: "incorrect",
                description: "Number of questions answered incorrectly"
            }
        ],
        Games: [
            {
                name: "games",
                description: "Total number of games played"
            },
            {
                name: "rounds",
                description: "Total number of rounds participated in"
            },
            {
                name: "questions_encountered",
                description: "Total number of questions seen across all games"
            },
            {
                name: "buzzes_encountered",
                description: "Total number of buzzes from any player encountered"
            }
        ]
    };

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
                        key={title}
                        title={title}
                        style={styles.row}
                    >
                        {
                            row.map((item) => 
                                <Stat
                                    key={item}
                                    name={item.name}
                                    value={stats[item.name]}
                                    description={item.description}
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
        gap: 20,
        overflow: "hidden",
        padding: 20,
        borderRadius: 15
    },
    row: {
        flex: 1
    },
    stat: {
        flex: 1,
        minWidth: "22%"
    }
})