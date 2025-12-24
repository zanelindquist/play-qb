import { getProtectedRoute, postProtectedRoute , handleExpiredAccessToken } from "../../utils/requests.jsx"

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
import { useAlert } from "../../utils/alerts.jsx";

import SidebarLayout from "../../components/navigation/SidebarLayout.jsx";
import GlassyView from "@/components/custom/GlassyView.jsx";
import theme from "@/assets/themes/theme.js";
import GradientText from "../../components/custom/GradientText.jsx"

export default function LobbyScreen() {
    const router = useRouter();
    const params = useLocalSearchParams()

    const [gameMode, setGameMode] = useState()

    console.log(params)

    return (
        <SidebarLayout>
            <View style={styles.container}>
                <View style={styles.left}>
                    
                </View>
                <View style={styles.right}>

                </View>
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