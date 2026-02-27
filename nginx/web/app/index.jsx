import {
    getProtectedRoute,
    postProtectedRoute,
    handleExpiredAccessToken,
} from "../utils/requests.jsx";

import React, { useEffect, useState } from "react";
import {
    View,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Dimensions,
    ScrollView,
    Image,
} from "react-native";
import {
    Button,
    HelperText,
    Menu,
    Title,
    IconButton,
    Icon,
    ActivityIndicator,
    Avatar,
    Card,
} from "react-native-paper";
import {
    useRouter,
    useGlobalSearchParams,
    useLocalSearchParams,
    usePathname,
    router,
} from "expo-router";
import { useAlert } from "../utils/alerts.jsx";

import SidebarLayout from "../components/navigation/SidebarLayout.jsx";
import GlassyView from "@/components/custom/GlassyView.jsx";
import theme from "@/assets/themes/theme.js";
import GradientText from "../components/custom/GradientText.jsx";
import BentoGameMode from "../components/entities/BentoGameMode.jsx";
import VerticalHoverOption from "../components/custom/VerticalHoverOption.jsx";
import GameDemoBox from "../components/custom/GameDemoBox.jsx";
import ustyles from "@/assets/styles/ustyles.js";
import { useBanner } from "@/utils/banners.jsx";
import { useAuth } from "@/context/AuthContext.js";
import GlassyButton from "@/components/custom/GlassyButton.jsx";

const GAMEMODES = [
    {
        name: "Ranked",
        description:
            "Classic More QuizBowl. Answer questions to test your skill!",
        icon: "chart-box",
        href: "/lobby?mode=ranked",
        color: "#B7775E", // warm terracotta
    },
    {
        name: "Solos",
        description: "Take on opponents in quiz bowl solos. Only tossups.",
        icon: "account",
        href: "/lobby?mode=solos",
        color: "#7FA3C7", // brighter slate / sky blue
    },
    {
        name: "Duos",
        description:
            "Partner up to take on other teams. Classic mode with bonuses.",
        icon: "account-multiple",
        href: "/lobby?mode=duos",
        color: "#8FBF8A", // fresh sage green
    },
    {
        name: "5v5",
        description: "Full quiz bowl game against other players online.",
        icon: "account-group",
        href: "/lobby?mode=5v5",
        color: "#CFA16A", // warm sunlit clay
    },
    {
        name: "Custom",
        description: "Create a custom game and play with your friends.",
        icon: "hammer-wrench",
        href: "/lobby?mode=custom",
        color: "#9B7FB3", // brighter dusty plum
    },
];

let { width, height } = Dimensions.get("window");
let isMobile = width <= 768; // Adjust breakpoint as needed

export default function HomeScreen() {
    const { showBanner } = useBanner();
    const { isAuthentiated } = useAuth();

    return (
        <SidebarLayout>
            <View style={styles.container}>
                <GlassyView style={styles.about}>
                    <GradientText
                        size={50}
                        colors={[theme.primary, theme.onPrimary, theme.primary]} //GAMEMODES.map((g) => g.color)
                        style={styles.title}
                    >
                        Welcome to MoreQB!
                    </GradientText>
                    <HelperText
                        style={[
                            ustyles.text.header,
                            ustyles.text.shadowText,
                            !isMobile && ustyles.text.center,
                            { textAlign: "left" },
                        ]}
                    >
                        MoreQuizBowl is the ultimate platform for serious Quiz
                        Bowl players.
                        {"\n\n"}
                        Compete in ranked matches, climb the leaderboard, and
                        track your progress with detailed performance analytics.
                        Create private lobbies to battle your friends, discover
                        active public rooms, or practice missed questions to
                        sharpen your edge.
                        {"\n\n"}
                        Whether you're grinding solo or competing live,
                        MoreQuizBowl gives you the tools to improve smarter,
                        play harder, and win more.
                    </HelperText>
                    {!isAuthentiated && (
                        <View style={styles.ctaButtons}>
                            <GlassyButton
                                style={styles.button}
                                mode="outlined"
                                onPress={() => router.replace("/signin")}
                            >
                                Sign In
                            </GlassyButton>
                            <Button
                                style={styles.button}
                                mode="contained"
                                onPress={() => router.replace("/signup")}
                            >
                                Create an account
                            </Button>
                        </View>
                    )}
                    {/* <View style={[styles.bottomBoxes, styles.bentoRow]}>
                    {
                        DEMO.map((d) => <GameDemoBox info={d}/>)
                    }
                    </View> */}
                </GlassyView>
                <View style={ustyles.flex.flexRow}>
                    {GAMEMODES.map((g, i) => (
                        <VerticalHoverOption
                            title={g.name}
                            description={g.description}
                            color={g.color}
                            href={g.href}
                            icon={g.icon}
                            style={isMobile && mstyles.gamemode}
                            key={i}
                        />
                    ))}
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
        padding: 20,
    },
    about: {
        gap: 20,
        alignItems: "center",
        width: "100%",
        paddingVertical: 50,
    },
    ctaButtons: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "center",
        gap: 20,
        margin: 20
    },
    button: {
        flexGrow: 1,
        maxWidth: 300
    },
    bentoRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 20,
    },
    topBoxes: {
        width: "100%",
        flexDirection: "row",
    },
    title: {
        fontSize: 30,
        fontWeight: 700,
        alignSelf: "center",
    },
});

const mstyles = StyleSheet.create({
    gamemode: {
        height: "auto",
    },
});
