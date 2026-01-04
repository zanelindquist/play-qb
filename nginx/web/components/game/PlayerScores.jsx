import React from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { HelperText, Text } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";
import PlayerLine from "./PlayerLine";

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
    Object.entries(teams).map(([teamHash, team], teamIndex) => {
        Object.entries(team.members).map(([playerHash, player], playerIndex) => {
            console.log("HASH", playerHash)
        })
    })
    if (gameMode === "duos") return (
        <GlassyView style={[style, styles.verticalTeamsContainer]}>
        {
            Object.entries(teams).map(([teamHash, team], teamIndex) => 
                <View style={styles.team}>
                    <Text style={[styles.teamName, {backgroundColor: team.color}]}>{team.name}</Text>
                    {
                        Object.entries(team.members).map(([playerHash, player], playerIndex) => 
                            <PlayerLine player={{name: player.player.firstname + " " + player.player.lastname, score: player.score, color: team.color}} style={styles.playerLine} key={playerIndex}/>
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
    teamName: {
        paddingVertical: 5,
        marginBottom: 5,
        textAlign: "center",
        fontSize: "1.2rem",
        fontWeight: "bold",
    },
    playerLine: {
        paddingHorizontal: 5
    }
})