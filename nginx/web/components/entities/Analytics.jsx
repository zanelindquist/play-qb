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
import Stat from "./Stat";


export default function Analytics ({
    stats,
    style
}) {

    if (!stats) return

    // TODO: If we implement games, make PPG based off of that
    // For now, a game is estimated to be ~20 questions
    return (
        <GlassyView style={[styles.container, style]}>
            <Stat.Row
                title="Analytics"
            >
                <Stat
                    name="PPG"
                    description="Points Per game"
                    value={(stats.points / stats.questions_encountered * 20).toFixed(1)}
                />
                <Stat
                    name="Correct %"
                    description="The percentage of questions that are answered correctly"
                    value={(stats.correct / stats.buzzes  * 100).toFixed(1) + " %"}
                />
                <Stat
                    name="Buzz %"
                    description="The percentage of the time the player chooses to buzz"
                    value={(stats.buzzes / stats.questions_encountered  * 100).toFixed(1) + " %"}
                />
                <Stat
                    name="Paricipation %"
                    description="The percentage of buzzes encountered that are the player's"
                    value={(stats.buzzes / stats.buzzes_encountered  * 100).toFixed(1) + " %"}
                />
                <Stat
                    name="Hit %"
                    description="The percentage of questions ecountered that are answered correctly"
                    value={(stats.correct / stats.questions_encountered  * 100).toFixed(1) + " %"}
                />
                <Stat
                    name="PPCA"
                    description="Points per correct answer"
                    value={(stats.points / stats.correct).toFixed(1)}
                />
            </Stat.Row>
        </GlassyView>
    )
}

const styles = StyleSheet.create({
    container: {

    },
})