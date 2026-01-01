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
import InvitedModal from "../../components/modals/InvitedModal.jsx";
import GlassyButton from "../../components/custom/GlassyButton.jsx";
import { useBanner } from "../../utils/banners.jsx";

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
    const {showBanner} = useBanner()

    const { socket, send, addEventListener, removeEventListener, onReady } = useSocket("lobby", params.mode || "solos");

    const [gameMode, setGameMode] = useState(params.mode || "solos");
    const [myHash, setMyHash] = useState(undefined);
    const [partySlots, setPartySlots] = useState([])
    const [enteredLobby, setEnteredLobby] = useState(false)

    const [isReady, setIsReady] = useState(false)
    
    useEffect(() => {
        onReady(() => {
            addEventListener("prelobby_joined", ({ player, party_members, user }) => {
                console.log("PMS", party_members)
                setMyHash(user.hash);
                for(let i = 0; i < party_members.length; i++) {
                    joinParty(party_members[i])
                }
            });

            addEventListener("prelobby_not_found", ({ player }) => {
                showAlert("Lobby not found")
            })

            addEventListener("invited", ({from_user, party_hash}) => {
                showAlert(
                    <InvitedModal
                        acceptInvite={handleAcceptInvite}
                        partyHash={party_hash}
                        user={from_user}
                    />
                )
            })

            addEventListener("joined_party", ({members}) => {
                for(let i = 0; i < members.length; i++) {
                    joinParty(members[i])
                }
                showBanner("Member joined party")
            })

            addEventListener("party_member_readied", ({ready_info}) => {
                // Set who is ready or not
                setPartySlots((prev) => {
                    let updatedArray = Array(5)
                    for(let i = 0; i < prev.length; i++){
                        updatedArray[i] = undefined
                        if(!prev[i]) continue
                        let user = prev[i]
                        user.ready = ready_info[prev[i].hash]
                        updatedArray[i] = user
                    }
                    return updatedArray
                })
            })

            addEventListener("changed_gamemode", ({lobby_alias}) => {
                setGameMode(lobby_alias)
            })
            
            addEventListener("enter_game", () => {
               router.replace(`/${gameMode}`)
            })

            addEventListener("user_disconnected", ({user_hash})=> {
                leaveParty(user_hash)
            })

            // Now that the listners are registered, we are ready to join the lobby
            if(!enteredLobby) {
                send("enter_lobby", { lobbyAlias: gameMode });
                setEnteredLobby(true)
            }
        });

        // useEffect() cleanup
        return () => {
            // if(socket) socket.disconnect()
        };
    }, [gameMode, partySlots, socket]);


    const openInviteFriendModal = React.useCallback(() => {
        showAlert(
            <InviteFriendModal
                socket={socket}
                addEventListener={addEventListener}
                removeEventListener={removeEventListener}
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
                removeEventListener={removeEventListener}
            />,
            styles.dialogueModalStyle
        );
    })
    

    function handleGameModePress(mode) {
        send("change_gamemode", {lobby_alias: mode})
    }

    function handlePartySlotPressed() {
        openInviteFriendModal()
    }

    function handleAcceptInvite(hash) {
        send("accepted_invite", {party_hash: hash})
    }

    function handleReadyPressed() {
        send("party_member_ready", {ready: !isReady})
        setIsReady(!isReady)
    }

    function joinParty(user) {
        if(!user)
            return
        setPartySlots((prev) => {
            // Prevent dupliate users
            for (let i = 0; i < prev.length; i++) {
                if(!prev[i])
                    continue
                if(prev[i]?.hash == user.hash){
                    return prev
                }
            }
            if(prev[2]) {
                for (let i = 0; i < prev.length; i++)
                    if(!prev[i]) return [...prev.slice(0, i), user, ...prev.slice(i + 1, prev.length)]
            } else {
                return [prev[0], prev[1], user, prev[3], prev[4]]
            }
        })
    }

    function leaveParty(userHash) {
        setPartySlots((prev) => {
            let newMembers = Array(undefined, undefined, undefined, undefined, undefined)
            for (let i = 0; i < prev.length; i++) {
                newMembers[i] = undefined;
                if(!prev[i])
                    continue
                if(prev[i].hash !== userHash)
                    newMembers[i] = prev[i]
            }
            return newMembers
        })
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
                    <View style={styles.partySlots}>
                    {
                        partySlots.map((user, i) => 
                            <PartySlot
                                player={user}
                                style={styles.partySlot}
                                onPress={handlePartySlotPressed}
                                isMe={user?.hash == myHash}
                                ready={user?.ready}
                            />
                        )
                    }
                    </View>
                    <View style={styles.bottomOptions}>
                        <GlassyButton
                            style={styles.readyButton}
                            mode={isReady ? "filled" : "contained"}
                            onPress={handleReadyPressed}
                        >Ready</GlassyButton>
                    </View>
                    <View style={styles.partyChat}>

                    </View>
                </View>
            </View>
            <View style={styles.container}>
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
        flexGrow: 1,
        marginLeft: 30,
        flexDirection: "column",
        gap: 20
    },
    partySlots: {
        flexDirection: "row",
        gap: 10,
    },
    partySlot: {
        flexGrow: 1,
        flexShrink: 1,
        maxWidth: "19%"
    },
    bottomOptions: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    readyButton: {
        width: 200,
    },
    gamemodes: {
        width: 200,
    },
    gamemode: {
        width: "100%",
    },
});
