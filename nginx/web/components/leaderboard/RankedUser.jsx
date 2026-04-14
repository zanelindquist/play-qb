import React from "react";
import { View, StyleSheet } from "react-native";
import { HelperText, Text, Icon } from "react-native-paper";
import GlassyView from "../custom/GlassyView";
import theme from "../../assets/themes/theme";
import ustyles from "../../assets/styles/ustyles";

export default function RankedUser({ data, category = "global" }) {
    const userRank = data?.user_rank;
    const percentile = data?.percentile;
    const formatCategory = (name) => name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    const categoryLabel = category === "global" ? "Global" : formatCategory(category);

    if (!userRank) {
        return null;
    }

    return (
        <GlassyView style={styles.container}>
            <View style={styles.header}>
                <HelperText style={[ustyles.text.subtitle, { color: theme.onSurface }]}>Your {categoryLabel} Standing</HelperText>
            </View>

            <View style={styles.row}>
                <View style={styles.metric}>
                    <HelperText style={[ustyles.text.caption, { color: theme.onSurfaceVariant }]}>Rank</HelperText>
                    <Text style={[ustyles.text.header, { color: theme.onSurface }]}>#{userRank.rank}</Text>
                </View>
                <View style={styles.metric}>
                    <HelperText style={[ustyles.text.caption, { color: theme.onSurfaceVariant }]}>RR</HelperText>
                    <Text style={[ustyles.text.header, { color: theme.static.correct }]}>{Math.round(userRank.rr).toLocaleString()}</Text>
                </View>
                <View style={styles.metric}>
                    <HelperText style={[ustyles.text.caption, { color: theme.onSurfaceVariant }]}>Tier</HelperText>
                    <Text style={[ustyles.text.header, { color: theme.onSurface }]}>{userRank.visible_rank}</Text>
                </View>
            </View>

            {percentile !== null && percentile !== undefined && (
                <View style={styles.percentileRow}>
                    <Icon source="medal" size={18} color={theme.static.correct} />
                    <HelperText style={[ustyles.text.body, { color: theme.onSurface, marginLeft: 8 }]}>Top {Math.ceil(percentile)}%</HelperText>
                </View>
            )}
        </GlassyView>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
    },
    header: {
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    metric: {
        flex: 1,
        backgroundColor: theme.elevation.level1,
        borderRadius: 10,
        padding: 12,
        marginRight: 12,
    },
    percentileRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
    },
});
