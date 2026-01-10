import { useState, useRef, useEffect } from "react";
import { Platform, View, StyleSheet, Pressable, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton, TextInput, Menu } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import theme from "../../assets/themes/theme";
import GlassyView from "../custom/GlassyView";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";
import ExpandableView from "../custom/ExpandableView";
import GameRule from "./GameRule";
import GameSettings from "./GameSettings";


export default function JoinCustomLobby ({
    style,
    expanded,
    defaultValue,
    lobbies=[],
    onChangeText=null,
    onSelect=null,
    cooldownMs = 0
}) {
    const [selectedLobby, setSelectedLobby] = useState(-1)
    const [hasConfirmedLobby, setHasConfirmedLobby] = useState(false)
    const cooldownRef = useRef(null)

    function handleSearchChange(e) {
        setSelectedLobby(-1)
        setHasConfirmedLobby(false)
        const value = e.value

        if (cooldownRef.current) {
            clearTimeout(cooldownRef.current)
        }

        if (onChangeText) {
            cooldownRef.current = setTimeout(() => {
                onChangeText(value)
            }, cooldownMs)
        }
    }

    function handleSelectPressed() {
        if(onSelect) {
            onSelect(lobbies[selectedLobby])
            setHasConfirmedLobby(true)
        }
    }

    return (
        <ExpandableView
            expanded={expanded}
            dynamicSizing={true}
            style={[styles.container, style]}
            minHeight={0}
        >
            <GlassyView style={styles.glassyContainer}>
                <HelperText style={styles.title}>Select Custom Lobby</HelperText>
                <View style={styles.searchContainer}>
                    <View style={styles.column}>
                        <GameRule
                            label="Search lobbies"
                            dataName="query"
                            mode="text"
                            defaultValue={defaultValue}
                            onChange={handleSearchChange}
                            style={[styles.searchBar]}
                        />
                        <ScrollView style={[styles.lobbiesContainer]}>
                            {
                                lobbies.length > 0 ?
                                lobbies.map((lobby, i) => 
                                    <Pressable
                                        style={[styles.lobbyContainer, i === 0 && {borderWidth: 0}, selectedLobby === i && styles.selectedLobby]}
                                        onPress={() => setSelectedLobby(i)}
                                    >
                                        <HelperText style={styles.lobbyAlias}>{lobby.name}</HelperText>
                                        <View style={styles.playersOnlineContainer}>
                                            <Icon source={"circle"} color={theme.static.correct}/>
                                            <HelperText style={styles.playersOnlineText}>{lobby.number_of_online_players}</HelperText>
                                        </View>
                                    </Pressable>
                                )
                                :
                                <HelperText>No lobbies found</HelperText>
                            }
                        </ScrollView>
                    </View>
                    <View style={[styles.column, styles.lobbyInfo]}>
                        {
                            selectedLobby >= 0 &&
                            <ScrollView
                                style={styles.gameSettingsScrollView}
                            >
                                <GameSettings
                                    title="Game Settings"
                                    defaultInfo={lobbies[selectedLobby]}
                                    expanded={true}
                                    columns={1}
                                    disabled={true}
                                    useGlassyView={false}
                                />
                            </ScrollView>

                        }

                    </View>
                </View>
                <GlassyButton
                    style={styles.joinButton}
                    mode={ selectedLobby >= 0 && hasConfirmedLobby ? "filled" : "contained"}
                    onPress={handleSelectPressed}

                >Select</GlassyButton>
            </GlassyView>
        </ExpandableView>
    )
}

const styles = StyleSheet.create({
    glassyContainer: {
        padding: 10,
        gap: 10
    },
    title: {
        fontSize: "1.2rem",
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    searchContainer: {
        flexDirection: "row",
        gap: 10,
        // alignItems: "center",
        justifyContent: "space-between"
    },
    column: {
        width: "49%"
    },
    lobbiesContainer: {
        backgroundColor: theme.background,
        height: 200,
        borderRadius: 5
    },
    lobbyContainer: {
        borderColor: theme.outline,
        borderTopWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 5
    },
    selectedLobby: {
        backgroundColor: theme.elevation.level2
    },
    lobbyAlias: {
        fontSize: "1rem"
    },
        playersOnlineContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    playersOnlineText: {
        fontSize: "0.8rem",
        fontWeight: "bold"
    },
    lobbyInfo: {

    },
    gameSettingsScrollView: {
        height: 300,
        paddingTop: 25
    },
    joinButton: {
        padding: 10,
    }
})