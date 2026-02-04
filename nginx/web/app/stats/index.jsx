import { getProtectedRoute, postProtectedRoute , handleExpiredAccessToken } from "@/utils/requests.jsx"

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
import { useAlert } from "@/utils/alerts.jsx";

import SidebarLayout from "../../components/navigation/SidebarLayout.jsx";
import GlassyView from "../../components/custom/GlassyView.jsx";
import Stats from "../../components/entities/Stats.jsx";
import theme from "@/assets/themes/theme.js";
import { useBanner } from "../../utils/banners.jsx";
import Analytics from "../../components/entities/Analytics.jsx";
import ustyles from "../../assets/styles/ustyles.js";

const CATEGORIES = [
    "science",
    "history",
    "literature",
    "social science",
    "philosophy",
    "religion",
    "mythology",
    "geography",
    "current events",
    "fine arts"
]
 
export default function StatsPage() {
    // Hooks
    const {showBanner} = useBanner()

    // Variables
    const [stats, setStats] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])


    function loadStats() {
        getProtectedRoute("/my_stats")
        .then((response) => {
            console.log(response)
            setStats(response.data)
            setIsLoading(false)
        })
        .catch((error) => {
            showBanner(error.message, {backgroundColor: theme.error})
        })
    }

    return (
        <SidebarLayout
            style={ustyles.flex.flexColumn}
        >
            <Stats
                stats={stats}
            />
            <Analytics
                stats={stats}
            />
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
    question: {
        fontSize: 16,
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    answer: {
        fontSize: 20,
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    categories: {
        margin: 10,
        flexDirection: "row",
        gap: 10,
        justifyContent: "space-between",
        flexWrap: "wrap"
    },
    category: {
        fontSize: 20,
        width: "23%",
        color: theme.onSurface,
        backgroundColor: theme.surface,
        padding: 20,
        borderRadius: 5
    }
})