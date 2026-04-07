import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { HelperText, Icon, Text, Divider } from "react-native-paper";
import GlassyView from "../custom/GlassyView";
import GlassyButton from "../custom/GlassyButton";
import theme from "../../assets/themes/theme";
import ustyles from "../../assets/styles/ustyles";
import { getProtectedRoute } from "../../utils/requests";

const RANK_COLORS = {
    "Dirt I": "#8A6837", "Dirt II": "#7A5B30", "Dirt III": "#6B4F2A",
    "Plastic I": "#8EA1B1", "Plastic II": "#7E909F", "Plastic III": "#6E7F8D",
    "Tin I": "#B3B3B3", "Tin II": "#A0A0A0", "Tin III": "#8E8E8E",
    "Bronze I": "#BF7A39", "Bronze II": "#A66A32", "Bronze III": "#8C5A2B",
    "Silver I": "#C9D2DB", "Silver II": "#B4BCC4", "Silver III": "#9FA6AD",
    "Gold I": "#F5CD30", "Gold II": "#E0B82C", "Gold III": "#C9A227",
    "Diamond I": "#5FE6F7", "Diamond II": "#4ED0E0", "Diamond III": "#3FB8C6",
    "Immortal I": "#CB8AFF", "Immortal II": "#B86BFF", "Immortal III": "#A64DFF"
};

export default function RankedLeaderboard({ category = "global", style, onLeaderboardLoaded, showUserRow = true }) {
    const [leaderboard, setLeaderboard] = useState(null);
    const [userRank, setUserRank] = useState(null);
    const [percentile, setPercentile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        fetchLeaderboard();
    }, [category]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getProtectedRoute(
                `/leaderboard?category=${category}&limit=20&include_user_rank=true`
            );

            const leaderboardData = result?.data || result;
            if (leaderboardData?.error) {
                throw new Error(leaderboardData.error);
            }

            setLeaderboard(leaderboardData);
            setUserRank(leaderboardData.user_rank);
            setPercentile(leaderboardData.percentile);
            onLeaderboardLoaded?.(leaderboardData);
            setRetryCount(0);
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
            setError("Failed to load leaderboard");
            
            // Auto-retry after 5 seconds if first attempt
            if (retryCount < 1) {
                setTimeout(() => setRetryCount(retryCount + 1), 5000);
            }
        } finally {
            setLoading(false);
        }
    };

    const formatRR = (rr) => {
        return Math.round(rr).toLocaleString();
    };

    const renderLeaderboardRow = (user, isUserRow = false) => (
        <View
            key={`${user.rank}-${user.username}`}
            style={[styles.leaderboardRow, isUserRow && styles.userRow]}
        >
            <View style={styles.rankColumn}>
                <HelperText style={[ustyles.text.title, { color: theme.onSurface }]}>
                    #{user.rank}
                </HelperText>
            </View>
            <View style={styles.usernameColumn}>
                <HelperText style={[ustyles.text.subtitle, { color: theme.onSurface }]}>
                    {user.username}
                </HelperText>
            </View>
            <View style={styles.rankBadgeColumn}>
                <View style={[
                    styles.rankBadge,
                    { backgroundColor: RANK_COLORS[user.visible_rank] || theme.primary }
                ]}>
                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>
                        {user.visible_rank?.split(" ")[0]}
                    </Text>
                </View>
            </View>
            <View style={styles.rrColumn}>
                <HelperText style={[ustyles.text.title, { color: theme.static.correct }]}>
                    {formatRR(user.rr)}
                </HelperText>
            </View>
        </View>
    );

    if (loading && !leaderboard) {
        return (
            <View style={[styles.container, style]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <HelperText style={{ marginTop: 16 }}>Loading leaderboard...</HelperText>
            </View>
        );
    }

    if (error && !leaderboard) {
        return (
            <GlassyView style={[styles.container, style]}>
                <Icon size={48} source="alert" color={theme.error} />
                <HelperText style={[ustyles.text.subtitle, { marginTop: 16 }]}>
                    {error}
                </HelperText>
                <GlassyButton
                    mode="filled"
                    onPress={fetchLeaderboard}
                    style={{ marginTop: 16 }}
                >
                    Retry
                </GlassyButton>
            </GlassyView>
        );
    }

    if (!leaderboard || !leaderboard.users) {
        return (
            <GlassyView style={[styles.container, style]}>
                <HelperText>No leaderboard data available</HelperText>
            </GlassyView>
        );
    }

    const users = leaderboard?.users || [];
    const hasGapToUser = userRank && userRank.rank > users.length;
    const formatCategory = (name) => name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    const categoryLabel = category === "global" ? "Global Leaderboard" : `${formatCategory(category)} Leaderboard`;

    return (
        <GlassyView style={[styles.container, style]}>
            <View style={styles.header}>
                <HelperText style={[ustyles.text.header, { color: theme.onSurface }]}>
                    {categoryLabel}
                </HelperText>
                {percentile !== null && percentile !== undefined && (
                    <HelperText style={[ustyles.text.body, { color: theme.onSurfaceVariant }]}>
                        Top {Math.ceil(100 - percentile)}%
                    </HelperText>
                )}
            </View>

            <Divider style={styles.divider} />

            <ScrollView
                style={styles.leaderboardScroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Top ranked users */}
                {users.map((user) => renderLeaderboardRow(user))}

                {/* Gap indicator */}
                {hasGapToUser && (
                    <View style={styles.gapContainer}>
                        <HelperText style={[ustyles.text.body, { color: theme.onSurfaceVariant }]}>
                            ...
                        </HelperText>
                    </View>
                )}

                {/* User's rank (if not in top 20) */}
                {showUserRow && userRank && (
                    <>
                        <Divider style={styles.divider} />
                        {renderLeaderboardRow(userRank, true)}
                        {percentile !== null && percentile !== undefined && (
                            <View style={styles.percentileContainer}>
                                <Icon size={20} source="medal" color={theme.static.correct} />
                                <HelperText style={[ustyles.text.body, { color: theme.onSurface, marginLeft: 8 }]}>
                                    You're in the top {Math.ceil(100 - percentile)}% of players
                                </HelperText>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Legend / Info */}
            <View style={styles.infoBox}>
                <Text style={[ustyles.text.caption, { color: theme.onSurfaceVariant }]}>
                    RR = Rating Rating (μ - 2σ)
                </Text>
            </View>
        </GlassyView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        minHeight: 400,
    },
    header: {
        paddingBottom: 12,
    },
    divider: {
        marginVertical: 12,
    },
    leaderboardScroll: {
        flex: 1,
    },
    leaderboardRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginVertical: 4,
    },
    userRow: {
        backgroundColor: theme.elevation.level2,
    },
    rankColumn: {
        minWidth: 50,
    },
    usernameColumn: {
        flex: 1,
        paddingLeft: 8,
    },
    rankBadgeColumn: {
        minWidth: 70,
        justifyContent: "center",
        alignItems: "center",
    },
    rankBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    rrColumn: {
        minWidth: 90,
        justifyContent: "flex-end",
        alignItems: "flex-end",
        paddingRight: 8,
    },
    gapContainer: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 16,
        opacity: 0.6,
    },
    percentileContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        marginTop: 8,
        backgroundColor: theme.elevation.level2,
        borderRadius: 8,
    },
    infoBox: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.elevation.level3,
    },
});
