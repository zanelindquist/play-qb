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

export default function HomeScreen() {
    const router = useRouter();

    return (
        <SidebarLayout>
            <View style={styles.container}>
                <GlassyView style={[styles.topBoxes, styles.bentoRow]}>
                    <GlassyView
                        style={[styles.topLeftBox, styles.bentoBox]}
                        onPress={() => router.push("/lobby?mode=customs")}
                        gradient={{
                            colors: theme.gradients.customsArray,
                            start: { x: 0, y: 0 },
                            end: { x: 1, y: 1 },
                        }}
                    >
                        <Icon source={"atom"} size={80} color={theme.primary}/>
                        <GradientText size={50}>Customs</GradientText>
                        <HelperText style={styles.subtitle}>Create a custom game and play with your friends.</HelperText>
                    </GlassyView>
                    <GlassyView
                        style={[styles.topRightBox, styles.bentoBox]}
                        onPress={() => router.push("/lobby?mode=mystery")}
                        gradient={{
                            colors: theme.gradients.mysteryArray,
                            start: { x: 0, y: 0 },
                            end: { x: 1, y: 1 },
                        }}
                    >
                        <Icon source={"head-question"} size={80} color={theme.primary}/>
                        <GradientText size={50}>Mystery Mode</GradientText>
                        <HelperText style={styles.subtitle}>Play Quiz Bowl in a featured gamemode.</HelperText>
                    </GlassyView>
                </GlassyView>
                <GlassyView style={[styles.bottomBoxes, styles.bentoRow]}>
                    <GlassyView
                        style={[styles.solos, styles.bentoBox]}
                        onPress={() => router.push("/lobby?mode=solos")}
                        gradient={{
                            colors: theme.gradients.solosArray,
                            start: { x: 0, y: 0 },
                            end: { x: 1, y: 1 },
                        }}
                    >
                        <Icon source={"account"} size={80} color={theme.primary}/>
                        <GradientText size={50}>Solos</GradientText>
                        <HelperText style={styles.subtitle}>Take on opponents in quiz bowl solos. Only tossups.</HelperText>
                    </GlassyView>
                    <GlassyView
                        style={[styles.duos, styles.bentoBox]}
                        onPress={() => router.push("/lobby?mode=duos")}
                        gradient={{
                            colors: theme.gradients.duosArray,
                            start: { x: 0, y: 0 },
                            end: { x: 1, y: 1 },
                        }}
                    >
                        <Icon source={"account-multiple"} size={80} color={theme.primary}/>
                        <GradientText style={styles.title} size={50}>Duos</GradientText>
                        <HelperText style={styles.subtitle}>Partner up to take on other teams. Classic mode with bonuses.</HelperText>
                    </GlassyView>
                    <GlassyView
                        style={[styles.fives, styles.bentoBox]}
                        onPress={() => router.push("/lobby?mode=fives")}
                        gradient={{
                            colors: theme.gradients.fivesArray,
                            start: { x: 0, y: 0 },
                            end: { x: 1, y: 1 },
                        }}
                    >
                        <Icon source={"account-group"} size={80} color={theme.primary}/>
                        <GradientText style={styles.title} size={50}>5v5</GradientText>
                        <HelperText style={styles.subtitle}>Full quiz bowl game against other players online.</HelperText>
                    </GlassyView>
                </GlassyView>
            </View>
        </SidebarLayout>
    );
}


const styles = StyleSheet.create({
    container: {
        flexDirection: "column",
        gap: 10,
        maxWidth: 1100
    },
    bentoRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    bentoBox: {
        flexGrow: 1,
        flexShrink: 1,
        width: "33.3%",
        height: 200,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
    },
    title: {
        fontSize: 40,
        fontWeight: 700
    },
    subtitle: {
        color: theme.secondary,
        textAlign: "center"
    }
})