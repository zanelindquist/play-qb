import {
    getProtectedRoute,
    postProtectedRoute,
    handleExpiredAccessToken,
} from "../../utils/requests.jsx";

import React, { useEffect, useState } from "react";
import {
    View,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Dimensions,
    ScrollView,
    Image,
} from "react-native";
import {
    Button,
    HelperText,
    Menu,
    Title,
    IconButton,
    Icon,
    ActivityIndicator,
    Avatar,
    Card,
} from "react-native-paper";
import {
    useRouter,
    useGlobalSearchParams,
    useLocalSearchParams,
    usePathname,
} from "expo-router";
import { useAlert } from "../../utils/alerts.jsx";

import SidebarLayout from "../../components/navigation/SidebarLayout.jsx";
import GlassyView from "@/components/custom/GlassyView.jsx";
import theme from "@/assets/themes/theme.js";
import GradientText from "../../components/custom/GradientText.jsx";
import { useSocket } from "../../utils/socket.jsx";
import GameMode from "../../components/game/GameMode.jsx";
import PartySlot from "../../components/entities/PartySlot.jsx";
import InviteFriendModal from "../../components/modals/InviteFriendModal.jsx";
import AddFriendModal from "../../components/modals/AddFriendModal.jsx";

// TODO: Make this in a config or something, or get from server
const GAMEMODES = [
    {
        name: "solos",
        description: "Take on opponents in quiz bowl solos. Only tossups.",
        icon: "account",
    },
    {
        name: "duos",
        description:
            "Partner up to take on other teams. Classic mode with bonuses.",
        icon: "account-multiple",
    },
    {
        name: "fives",
        description: "Full quiz bowl game against other players online.",
        icon: "account-group",
    },
    {
        name: "custom",
        description: "Create a custom game and play with your friends.",
        icon: "hammer-wrench",
    },
];

export default function LobbyScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const {showAlert} = useAlert()

    const { socket, send, addEventListener, removeEventListener, onReady } = useSocket("lobby", params.mode || "solos");

    const [gameMode, setGameMode] = useState(params.mode || "solos");
    const [myId, setMyId] = useState(undefined);
    const [partySlots, setPartySlots] = useState([])
    
    useEffect(() => {
        onReady(() => {
            addEventListener("prelobby_joined", ({ Player, User }) => {
                console.log(User)
                setMyId(User.id);
                // Get the party from the server
                setPartySlots((prev) => {
                    if(prev[2]) {
                        for (let i = 0; i < prev.length; i++)
                            if(!prev[i]) return [...prev.slice(0, i), User, ...prev.slice(i + 1, prev.length)]
                    } else {
                        return [prev[0], prev[1], User, prev[3], prev[4]]
                    }
                })
            });

            addEventListener("prelobby_not_found", ({ Player }) => {
                showAlert("Lobby not found")
            })

            // Now that the listners are registered, we are ready to join the lobby
            send("enter_lobby", { lobbyAlias: gameMode });
        });

        // useEffect() cleanup
        return () => {};
    }, [gameMode]);


    const openInviteFriendModal = React.useCallback(() => {
        showAlert(
            <InviteFriendModal
                socket={socket}
                addEventListener={addEventListener}
                openAddFriendModal={openAddFriendModal}
            />, 
            styles.dialogueModalStyle
        );
    })

    const openAddFriendModal = React.useCallback(() => {
        showAlert(
            <AddFriendModal
                socket={socket}
                addEventListener={addEventListener}
            />,
            styles.dialogueModalStyle
        );
    })
    

    function handleGameModePress(mode) {
        if(mode !== gameMode) setPartySlots([])
        setGameMode(mode)
    }

    function handlePartySlotPressed() {
        openInviteFriendModal()
    }

    return (
        <SidebarLayout>
            <View style={styles.container}>
                <View style={styles.gamemodes}>
                    {GAMEMODES.map((g, i) => (
                        <GameMode
                            gamemode={g}
                            icon={g.icon}
                            style={styles.gamemode}
                            selected={gameMode == g.name}
                            onPress={() => handleGameModePress(g.name)}
                        />
                    ))}
                </View>
                <View style={styles.right}>
                    {
                        partySlots.map((player, i) => 
                            <PartySlot
                                player={player}
                                style={styles.partySlot}
                                onPress={handlePartySlotPressed}
                                isMe={player?.id == myId}
                            />
                        )
                    }
                </View>
            </View>
        </SidebarLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 10,
    },
    left: {

    },
    right: {
        marginLeft: 30,
        flexGrow: 1,
        flexDirection: "row",
        gap: 10,
    },
    partySlot: {
        flexGrow: 1,
        maxWidth: "23%"
    },
    gamemodes: {
        width: 200,
    },
    gamemode: {
        width: "100%",
    },
});
