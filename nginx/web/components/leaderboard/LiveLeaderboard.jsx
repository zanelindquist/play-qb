import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { HelperText, Icon, Text, Divider, ActivityIndicator } from "react-native-paper";
import GlassyView from "../custom/GlassyView";
import theme from "../../assets/themes/theme";
import ustyles from "../../assets/styles/ustyles";

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

export default function LiveLeaderboard({ leaderboardData, style }) {
    const [displayData, setDisplayData] = useState(null);

    useEffect(() => {
        if (leaderboardData) {
            setDisplayData(leaderboardData);
        }
    }, [leaderboardData]);

    const formatRR = (rr) => {
        return Math.round(rr).toLocaleString();
    };

    const renderLeaderboardRow = (user, isUserRow = false) => (
        <View
            key={`live-${user.rank}-${user.username}`}
            style={[styles.leaderboardRow, isUserRow && styles.userRow]}
        >
            <View style={styles.rankColumn}>
                <HelperText style={[ustyles.text.subtitle, { color: theme.onSurface }]}>
                    #{user.rank}
                </HelperText>
            </View>
            <View style={styles.usernameColumn}>
                <HelperText style={[ustyles.text.body, { color: theme.onSurface }]}>
                    {user.username}
                </HelperText>
            </View>
            <View style={styles.rrColumn}>
                <HelperText style={[ustyles.text.subtitle, { color: theme.static.correct }]}>
                    {formatRR(user.rr)}
                </HelperText>
            </View>
        </View>
    );

    if (!displayData) {
        return (
            <GlassyView style={[styles.container, style]}>
                <ActivityIndicator size="small" color={theme.primary} />
            </GlassyView>
        );
    }

    const userRank = displayData.user_rank;
    const percentile = displayData.percentile;
    const totalUsers = displayData.total_users || 0;
    const allUsers = (displayData.users || []).slice().sort((a, b) => a.rank - b.rank);

    // Determine neighbors based on user rank position
    let displayedUsers = [];
    if (userRank && allUsers.length > 0) {
        const userPos = userRank.rank;
        const totalRanked = totalUsers || allUsers.length;
        
        if (totalRanked <= 3) {
            displayedUsers = allUsers;
        } else if (userPos === 1) {
            displayedUsers = allUsers.filter((u) => u.rank <= 3);
        } else if (userPos === totalRanked) {
            displayedUsers = allUsers.filter((u) => u.rank >= totalRanked - 2);
        } else if (userPos === 2) {
            displayedUsers = allUsers.filter((u) => u.rank <= 3);
        } else {
            displayedUsers = allUsers.filter((u) => u.rank >= userPos - 1 && u.rank <= userPos + 1);
        }
    }
    displayedUsers = displayedUsers.sort((a, b) => a.rank - b.rank);

    return (
        <GlassyView style={[styles.container, style]}>
            <View style={styles.header}>
                <HelperText style={[ustyles.text.title, { color: theme.onSurface }]}>
                    Ranked
                </HelperText>
                {percentile !== null && percentile !== undefined && (
                    <HelperText style={[ustyles.text.body, { color: theme.onSurfaceVariant, fontSize: 12 }]}>
                        Top {Math.ceil(100 - percentile)}%
                    </HelperText>
                )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.content}>
                {/* Leaderboard Column */}
                <View style={styles.leaderboardColumn}>
                    {displayedUsers.map((user) => 
                        renderLeaderboardRow(user, userRank && user.rank === userRank.rank)
                    )}
                </View>
            </View>
        </GlassyView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 12,
        borderRadius: 12,
        minHeight: 200,
        maxHeight: 350,
    },
    header: {
        gap: 4,
    },
    divider: {
        marginVertical: 8,
    },
    content: {
        flex: 1,
        justifyContent: "center",
    },
    leaderboardRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRadius: 6,
        marginVertical: 3,
    },
    userRow: {
        backgroundColor: theme.elevation.level2,
    },
    rankColumn: {
        minWidth: 45,
    },
    usernameColumn: {
        flex: 1,
        paddingLeft: 6,
    },
    rrColumn: {
        minWidth: 70,
        justifyContent: "flex-end",
        alignItems: "flex-end",
        paddingRight: 6,
    },
});
