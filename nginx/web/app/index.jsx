import { getProtectedRoute, postProtectedRoute , handleExpiredAccessToken } from "../utils/requests.jsx"

import React, { useEffect, useState } from 'react';
import {
    View,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Dimensions,
    ScrollView,
    Image
} from 'react-native';
import { Button, HelperText, Menu, Title, IconButton, Icon, ActivityIndicator, Avatar, Card } from 'react-native-paper';
import { useRouter, useGlobalSearchParams, useLocalSearchParams, usePathname } from 'expo-router';
import { useAlert } from "../utils/alerts.jsx";

import SidebarLayout from "../components/navigation/SidebarLayout.jsx";
import GlassyView from "@/components/custom/GlassyView.jsx";
import theme from "@/assets/themes/theme.js";
import GradientText from "../components/custom/GradientText.jsx"
import BentoGameMode from "../components/entities/BentoGameMode.jsx"
import GameDemoBox from "../components/custom/GameDemoBox.jsx"


const GAMEMODES = [
  {
    name: "Solos",
    description: "Take on opponents in quiz bowl solos. Only tossups.",
    icon: "account",
    href: "/lobby?mode=solos",
    color: "#7FA3C7" // brighter slate / sky blue
  },
  {
    name: "Duos",
    description: "Partner up to take on other teams. Classic mode with bonuses.",
    icon: "account-multiple",
    href: "/lobby?mode=duos",
    color: "#8FBF8A" // fresh sage green
  },
  {
    name: "5v5",
    description: "Full quiz bowl game against other players online.",
    icon: "account-group",
    href: "/lobby?mode=5v5",
    color: "#CFA16A" // warm sunlit clay
  },
  {
    name: "Custom",
    description: "Create a custom game and play with your friends.",
    icon: "hammer-wrench",
    href: "/lobby?mode=custom",
    color: "#9B7FB3" // brighter dusty plum
  },
  {
    name: "Mystery Mode",
    description: "Play Quiz Bowl in a featured gamemode.",
    icon: "head-question",
    href: "/lobby?mode=mystery",
    color: "#B7775E" // warm terracotta
  }
];

const DEMO = [
    {
        name: "1. Select a game",
        // description: "Take on opponents in quiz bowl solos. Only tossups.",
        image: require("../assets/images/demo/lobby_humans.png"),
        color: "#e64646ff" // brighter slate / sky blue
    },
    {
        name: "2. Invite friends",
        // description: "Take on opponents in quiz bowl solos. Only tossups.",
        image: require("../assets/images/demo/invite_friends_humans.png"),
        color: "#46e6b9ff" // brighter slate / sky blue
    },
    {
        name: "3. Play!",
        // description: "Take on opponents in quiz bowl solos. Only tossups.",
        image: require("../assets/images/demo/play_humans.png"),
        color: "#f2de46ff" // brighter slate / sky blue
    },
]


export default function HomeScreen() {
    return (
        <SidebarLayout>
            <View style={styles.container}>
                <View style={styles.about}>
                    <GradientText
                        size={50}
                        colors={GAMEMODES.map((g) => g.color)}
                        style={styles.title}
                    >Welcome to PlayQB!</GradientText>
                    {/* <View style={[styles.bottomBoxes, styles.bentoRow]}>
                    {
                        DEMO.map((d) => <GameDemoBox info={d}/>)
                    }
                    </View> */}
                </View>
                <View style={[styles.topBoxes, styles.bentoRow]}>
                    <BentoGameMode gamemode={GAMEMODES[3]}/>
                    <BentoGameMode gamemode={GAMEMODES[4]}/>
                </View>
                <View style={[styles.bottomBoxes, styles.bentoRow]}>
                    <BentoGameMode gamemode={GAMEMODES[0]}/>
                    <BentoGameMode gamemode={GAMEMODES[1]}/>
                    <BentoGameMode gamemode={GAMEMODES[2]}/>
                </View>
            </View>
        </SidebarLayout>
    );
}


const styles = StyleSheet.create({
    container: {
        flexDirection: "column",
        gap: 20,
        maxWidth: 1100,
        padding: 20
    },
    about: {
        gap: 20,
        alignItems: "center",
        width: "100%",
        marginBottom: 30,
    },
    bentoRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 20,
    },
    title: {
        fontSize: 30,
        fontWeight: 700,
        alignSelf: "center",
    },
})