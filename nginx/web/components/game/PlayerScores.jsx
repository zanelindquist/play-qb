import React from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { HelperText, Text } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";
import PlayerLine from "./PlayerLine";
import theme from "../../assets/themes/theme";

export default function PlayerScores ({
    teams,
    gameMode="solos",
    style
}) {
    // We need to handle the different layouts of teams
    if (gameMode === "solos") return (
        <GlassyView style={[style, styles.container]}>
        {
            Object.entries(teams).map(([teamHash, team], teamIndex) => 
                <PlayerLine player={team} key={teamIndex}/>
            )
        }
        </GlassyView >
    )

    if (gameMode === "duos") return (
        <GlassyView style={[style, styles.verticalTeamsContainer]}>
        {
            Object.entries(teams).sort(([, aTeam], [, bTeam]) => bTeam.score - aTeam.score).map(([teamHash, team], teamIndex) => 
                <View style={styles.team}>
                    <View style={[styles.teamTitle, {backgroundColor: team.color}, teamIndex == 0 && {paddingTop: 10}]}>
                        <Text style={[styles.teamName]}>{team.name}</Text>
                        <View style={[styles.circle, {backgroundColor: theme.surface}]}>
                            <Text style={styles.score}>{team.score}</Text>
                        </View>
                    </View>
                    {
                        Object.entries(team.members).map(([playerHash, player], playerIndex) => 
                            <PlayerLine player={{name: player.player.firstname + " " + player.player.lastname, score: player.points, color: "transparent"}} style={styles.playerLine} key={playerIndex}/>
                        )
                    }
                </View>
            )
        }
        </GlassyView >
    )

    return (
        <HelperText>Unsuported mode given</HelperText>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "column",
        gap: 5,
    },
    verticalTeamsContainer: {
        flexDirection: "column",
        gap: 5,
        padding: 0,
    },
    team: {
        flexDirection: "column",
        gap: 5,
        paddingBottom: 10,
    },
    teamTitle: {
        padding: 5,
        marginBottom: 5,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    circle: {
        width: "3rem",
        height: "1.5rem",
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center"
    },
    score: {
        fontSize: "1.1rem"
    },
    teamName: {
        textAlign: "center",
        fontSize: "1.2rem",
        fontWeight: "bold",
    },
    playerLine: {
        paddingHorizontal: 5,
        paddingLeft: 10
    }
})