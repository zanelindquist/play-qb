import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
} from "react-native";
import { HelperText, IconButton, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";

import SidebarLayout from "../../components/navigation/SidebarLayout.jsx";
import RankedLeaderboard from "../../components/leaderboard/RankedLeaderboard.jsx";
import RankedUser from "../../components/leaderboard/RankedUser.jsx";
import DropDown from "../../components/custom/DropDown.jsx";
import theme from "@/assets/themes/theme.js";
import ustyles from "../../assets/styles/ustyles.js";
import { useBanner } from "../../utils/banners.jsx";
import { useAlert } from "../../utils/alerts.jsx";
import { getProtectedRoute } from "../../utils/requests.jsx";
import { CATEGORIES } from "../../utils/constants.js";


export default function LeaderboardPage() {
    const router = useRouter();
    const { showBanner } = useBanner();
    const { showAlert } = useAlert();

    const [selectedCategory, setSelectedCategory] = useState("global");
    const [leaderboardData, setLeaderboardData] = useState(null);
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated
        verifyUser();
    }, []);

    const verifyUser = async () => {
        try {
            await getProtectedRoute("/my_account");
            setIsVerified(true);
            setIsLoading(false);
        } catch (error) {
            showBanner("Please log in to view the leaderboard", { backgroundColor: theme.error });
            router.replace("/signin");
        }
    };

    if (isLoading) {
        return (
            <SidebarLayout style={ustyles.flex.flexColumn}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <HelperText style={{ marginTop: 16 }}>Loading leaderboard...</HelperText>
                </View>
            </SidebarLayout>
        );
    }

    if (!isVerified) {
        return null;
    }

    return (
        <SidebarLayout style={[ustyles.flex.flexColumn, styles.layout]}>
            {/* Header */}
            <View style={styles.header}>
                <HelperText style={[ustyles.text.header, { color: theme.onSurface }]}>
                    Ranked Leaderboards
                </HelperText>
                <HelperText style={[ustyles.text.body, { color: theme.onSurfaceVariant }]}>
                    See where you rank globally and by category
                </HelperText>
            </View>

            {/* Category Dropdown */}
            <DropDown
                options={CATEGORIES}
                onSelect={(item) => setSelectedCategory(item?.id || "global")}
                style={styles.categoryDropdown}
            />

            {/* Current user summary */}
            <RankedUser
                data={leaderboardData}
                category={selectedCategory}
            />

            {/* Leaderboard Content */}
            <View style={styles.leaderboardContainer}>
                <RankedLeaderboard
                    category={selectedCategory}
                    style={styles.leaderboard}
                    showUserRow={false}
                    onLeaderboardLoaded={setLeaderboardData}
                />
            </View>
        </SidebarLayout>
    );
}

const styles = StyleSheet.create({
    layout: {
        padding: 16,
        gap: 16,
    },
    header: {
        gap: 8,
        paddingBottom: 8,
    },
    categoryScroll: {
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    categoryScrollContent: {
        gap: 12,
        paddingRight: 16,
    },
    categoryButton: {
        borderRadius: 24,
        paddingHorizontal: 16,
    },
    categoryButtonActive: {
        backgroundColor: theme.primary,
    },
    leaderboardContainer: {
        flex: 1,
        minHeight: 400,
    },
    leaderboard: {
        flex: 1,
    },
    categoryDropdown: {
        maxWidth: 420,
        marginBottom: 16,
    },
});
