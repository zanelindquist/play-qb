import { useState } from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import theme from "../../assets/themes/theme";
import GameRule from "./GameRule";
import { capitalize, detectCurseWords } from "../../utils/text";
import ExpandableView from "../custom/ExpandableView";
import CustomCategories from "./CustomCategories";
import GlassyView from "../custom/GlassyView";

const GAMEMODES = [
    {
        name: "solos",
        description: "Take on opponents in quiz bowl solos. Only tossups.",
        icon: "account",
    },
    {
        name: "duos",
        description: "Partner up to take on other teams. Classic mode with bonuses.",
        icon: "account-multiple",
    },
    {
        name: "5v5",
        description: "Full quiz bowl game against other players online.",
        icon: "account-group",
    },
    {
        name: "custom",
        description: "Create a custom game and play with your friends.",
        icon: "hammer-wrench",
    },
];

const LEVELS = ["All", "Middle School", "High School", "Collegiate", "Open"]

const CATEGORIES = [
    "everything",
    "science",
    "history",
    "literature",
    "social science",
    "philosophy",
    "religion",
    "mythology",
    "geography",
    "custom",
];

const MUTATABLE_RULES = ["name", "public", "gamemode", "category", "rounds", "level", "speed", "bonuses", "allow_multiple_buzz", "allow_question_skips", "allow_question_pause"]



export default function GameSettings({
    style,
    title="Create Custom Game",
    expanded,
    onGameRuleChange=null,
    defaultInfo,
    disabled,
    columns=2,
    nameDisabled,
    useGlassyView=true,
    ...props
}) {
    if(!defaultInfo) {
        console.log("<GameSettings />: No default info. Falling back onto component defaults.")
    }
    const [showCustomCategories, setShowCustomCategories] = useState(false)
    const [customSettings, setCustomSettings] = useState({})

    function allowLobbyName(text) {
        if(text === "" || text.length > 40 || detectCurseWords(text)) return false
        return !/\s/.test(text);
    }

    function handleGameRuleChange(e) {
        // If this is disabled, we are just getting the onmount change events
        if(disabled) return
        // For displaying the game rules
        if(e.dataName === "category" && e.value.title.toLowerCase() === "custom") {
            setShowCustomCategories(true)
        } else {
            setShowCustomCategories(false)
        }

        // If the data name is level or category, then we need to translate the value into it numerical equivalent
        if(e.value?.title) e.value = e.value.title

        if(e.dataName === "level") {
            e.value = LEVELS.indexOf(e.value)
        }
        if(e.dataName === "category") {
            e.value = CATEGORIES.indexOf(e.value.toLowerCase())
        }

        // Update our custom categories
        setCustomSettings((prev) => {
            // Only set values that are already in the settings
            if(!MUTATABLE_RULES.includes(e.dataName)) return prev

            const newSettings = {
                ...prev,
                [e.dataName]: e.value
            }
            // Emit an event to show other users the updates
            if(onGameRuleChange) onGameRuleChange(newSettings)
            return newSettings
        })
    }

    let name = (
        <GameRule
            label="Name"
            dataName="name"
            mode="text"
            defaultValue={
                defaultInfo?.name
            }
            onChange={handleGameRuleChange}
            valueError={(text) =>
                allowLobbyName(text)
                    ? false
                    : "Invalid lobby name"
            }
            disabled={disabled || nameDisabled}
        />
    )
    let gamemode = (
        <GameRule
            label="Gamemode"
            dataName="gamemode"
            mode="dropdown"
            options={GAMEMODES.map((g) => {
                return { title: capitalize(g.name) };
            })}
            defaultValue={
                GAMEMODES.map((g) => g.name).indexOf(
                    defaultInfo?.gamemode
                ) < 0 
                ? 0 : 
                GAMEMODES.map((g) => g.name).indexOf(
                    defaultInfo?.gamemode
                )
            }
            onChange={handleGameRuleChange}
            disabled={disabled}
        />
    )
    let level = (
        <GameRule
            label="Level"
            dataName="level"
            mode="dropdown"
            options={LEVELS.map((l) => {
                return { title: l };
            })}
            defaultValue={defaultInfo?.level || 0}
            onChange={handleGameRuleChange}
            disabled={disabled}
        />
    )
    let category = (
        <>
            <GameRule
                label="Category"
                dataName="category"
                mode="dropdown"
                options={CATEGORIES.map((c) => {
                    return { title: capitalize(c) };
                })}
                defaultValue={defaultInfo?.category || 0}
                onChange={handleGameRuleChange}
                disabled={disabled}
            />
            <ExpandableView
                expanded={showCustomCategories}
                minHeight={0}
                maxHeight={400}
            >
                <CustomCategories />
            </ExpandableView>
        </>
    )

    let rounds = (
        <GameRule
            label="Rounds"
            dataName="rounds"
            mode="numeric"
            minimum={10}
            maximum={100}
            defaultValue={defaultInfo?.rounds}
            onChange={handleGameRuleChange}
            disabled={disabled}
        />
    )
    let speed = (
        <GameRule
            label="Speed"
            dataName="speed"
            mode="slider"
            minimum={100}
            maximum={800}
            defaultValue={defaultInfo?.speed}
            onChange={handleGameRuleChange}
            disabled={disabled}
        />
    )
    let pub = (
        <GameRule
            label="Public"
            dataName="public"
            mode="toggle"
            defaultValue={defaultInfo?.public}
            onChange={handleGameRuleChange}
            disabled={disabled}
        />
    )
    let bonuses = (
        <GameRule
            label="Bonuses"
            dataName="bonuses"
            mode="toggle"
            defaultValue={defaultInfo?.bonuses}
            onChange={handleGameRuleChange}
            disabled={disabled}
        />
    )
    let amb = (
        <GameRule
            label="Allow multiple buzzes"
            dataName="allow_multiple_buzz"
            mode="toggle"
            defaultValue={defaultInfo?.allow_multiple_buzz}
            onChange={handleGameRuleChange}
            disabled={disabled}
        />
    )
    let aqs = (
        <GameRule
            label="Allow question skips"
            dataName="allow_question_skip"
            mode="toggle"
            defaultValue={defaultInfo?.allow_question_skip}
            onChange={handleGameRuleChange}
            disabled={disabled}
        />
    )
    let aqp = (
        <GameRule
            label="Allow pauses"
            dataName="allow_question_pause"
            mode="toggle"
            defaultValue={defaultInfo?.allow_question_pause}
            onChange={handleGameRuleChange}
            disabled={disabled}
        />
    )

    const columnArrangement = {
        1: [[name, gamemode, level, category, rounds, speed, pub, bonuses, amb, aqs, aqp]],
        2: [[name, gamemode, level, category], [rounds, speed, pub, bonuses, amb, aqs, aqp]]
    }


    const content = (
        <>
            <HelperText style={styles.title}>{title}</HelperText>
            <View style={styles.customRules}>
                {
                    columnArrangement[columns].map((column) => 
                        <View style={[styles.rulesColumn, {maxWidth: 100 / columns - 1 + "%"}]}>
                            {
                                column.map((component) => component)
                            }
                        </View>
                    )
                }
            </View>
        </>
    )

    return (
        <ExpandableView
            expanded={expanded}
            minHeight={0}
            dynamicSizing={true}
            {...props}
        >
            {
                useGlassyView ?
                <GlassyView style={styles.customRulesContainer}>
                    {content}
                </GlassyView>
                :
                <View style={styles.customRulesContainer}>
                    {content}
                </View>
            }

        </ExpandableView>
    );
}

const styles = StyleSheet.create({
    customRulesContainer: {
        height: "100%",
        paddingRight: 20,
    },
    title: {
        fontSize: "1.2rem",
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    customRules: {
        margin: 10,
        flexDirection: "row",
        gap: 10,
        width: "100%",
    },
    rulesColumn: {
        flexGrow: 1,
        maxWidth: "49%",
    },
});
