import { getProtectedRoute, postProtectedRoute , handleExpiredAccessToken } from "@/utils/requests.jsx"

import React, { useEffect, useState } from 'react';
import {
    View,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Dimensions,
    ScrollView,
    Pressable,
    Image
} from 'react-native';
import { Button, HelperText, Menu, Title, IconButton, Icon, ActivityIndicator, Avatar, Card } from 'react-native-paper';
import { useRouter, useGlobalSearchParams, useLocalSearchParams, usePathname } from 'expo-router';
import { useAlert } from "@/utils/alerts.jsx";

import MultiDisplaySlider from "../../components/custom/MultiDisplaySlider.jsx";
import SidebarLayout from "../../components/navigation/SidebarLayout.jsx";
import GlassyView from "../../components/custom/GlassyView.jsx";
import Stats from "../../components/entities/Stats.jsx";
import theme from "@/assets/themes/theme.js";
import { useBanner } from "../../utils/banners.jsx";
import TextInputEdit from "../../components/custom/TextInputEdit.jsx";
import { truncates } from "bcryptjs";
import GameSettings from "../../components/entities/GameSettings.jsx";

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
 
export default function AccountPage() {
    // Hooks
    const {showBanner} = useBanner()

    // Variables
    const [account, setAccount] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedLobby, setSelectedLobby] = useState(0)

    useEffect(() => {
        loadAccount()
    }, [])

    function handleSelectPressed(i) {
        // If nothing changed, return
        if(selectedLobby === i) return;
        setSelectedLobby(i)

    }


    function loadAccount() {
        setIsLoading(true)
        getProtectedRoute("/my_account")
        .then((response) => {
            console.log(response.data)
            setAccount(response.data)
            setIsLoading(false)
        })
        .catch((error) => {
            showBanner(error.message)
        })
    }

    return (
        <SidebarLayout>
            <GlassyView>
                <MultiDisplaySlider
                    screenNames={["Profile", "My Lobbies"]}
                >
                {
                    isLoading ?
                    <HelperText>Loading data...</HelperText>
                    :
                    <View style={styles.profile}>
                        <View style={styles.left}>
                            <TextInputEdit
                                label="Name"
                                subtitle={"Public display name"}
                                input={account?.username}
                                onInput={(value) => handleEdit("name", value)}
                                // error={errorFields.name}
                            ></TextInputEdit>
                            <TextInputEdit
                                label="Email"
                                subtitle={"Email used for for login and account recovery"}
                                input={account?.email}
                                onInput={(value) => handleEdit("email", value)}
                                inputProps={{inputMode: "email"}}
                                disabled={truncates}
                                // error={errorFields.email}
                            ></TextInputEdit>
                        </View>
                        <View style={styles.profileDisplay}>
                            <View style={styles.iconCircle}>
                                <Icon size={125} source={"account"} style={styles.icon}/>
                            </View>
                            <HelperText style={styles.title}>{account?.username}</HelperText>

                        </View>
                    </View>                    
                }
                {
                    isLoading ?
                    <HelperText>Loading data...</HelperText>
                    :
                    <View style={styles.lobbies}>
                        <View style={styles.left}>
                            <HelperText style={styles.title}>Your lobbies</HelperText>
                            <View style={styles.lobbiesList}>
                            {
                                account.created_lobbies.map((lobby, i) => 
                                    <Pressable
                                        style={[styles.lobbyContainer, i === 0 && {borderWidth: 0}, selectedLobby === i && styles.selectedLobby]}
                                        onPress={() => handleSelectPressed(i)}
                                    >
                                        <HelperText style={styles.lobbyAlias}>{lobby.name}</HelperText>
                                        <View style={styles.playersOnlineContainer}>
                                            <Icon source={"circle"} color={theme.static.correct}/>
                                            <HelperText style={styles.playersOnlineText}>{lobby.number_of_online_players}</HelperText>
                                        </View>
                                    </Pressable>
                                )
                            }
                            </View>
                        </View>
                        <View style={styles.left}>
                            <GameSettings
                                defaultInfo={account.created_lobbies[selectedLobby]}
                                expanded={true}
                                disabled={true}
                                useGlassyView={false}
                                title={account.created_lobbies[selectedLobby]?.name || "Lobby"}
                            />
                        </View>

                    </View>
                }
                </MultiDisplaySlider>

            </GlassyView>
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
    profile: {
        flexDirection: "row",
        gap: 10,
        justifyContent: "space-between",
        width: "100%"
    },
    lobbies: {
        flexDirection: "row",
        width: "100%",
        gap: 10,
        padding: 10,
    },
    lobbiesList: {
        backgroundColor: theme.surface,
        borderRadius:10
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
    left:{
        justifySelf: "baseline"
    },
    profileDisplay: {
        padding: 20,
        gap: 20,
        alignItems: "center"
    },
    iconCircle: {
        height: 150,
        width: 150,
        backgroundColor: theme.primary,
        borderRadius: "50%",
        justifyContent: "center",
        alignItems: "center",
    },
    icon: {
    
    },
    text: {
        fontSize: 16,
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
})