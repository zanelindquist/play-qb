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
    Badge,
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
import ExpandableView from "../../components/custom/ExpandableView.jsx";
import GameRule from "../../components/entities/GameRule.jsx";
import { capitalize, detectCurseWords, generateRandomLobbyName } from "../../utils/text.js";
import CustomCategories from "../../components/entities/CustomCategories.jsx";

// TODO: Make this in a config or something, or get from server
const GAMEMODES = [
    {
        name: "solos",
        description: "Take on opponents in quiz bowl solos. Only tossups.",
        icon: "account",
    },
    {
        name: "duos",
        description: "Partner up to take on other teams. Classic mode with bonuses.",
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

const CATEGORIES = [
    "everything",
    "science",
    "history",
    "literature",
    "social science",
    "philosophy",
    "religion",
    "mythology",
    "geography",
    "custom",
];

const MUTATABLE_RULES = ["name", "gamemode", "category", "rounds", "level", "speed", "bonuses", "allow_multiple_buzz", "allow_question_skips", "allow_question_pause"]

export default function LobbyScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const {showAlert} = useAlert()
    const {showBanner} = useBanner()
    const gameModeFromParams =  GAMEMODES.map((g) => g.name).includes(params.mode) ? params.mode : "custom"

    const { socket, send, addEventListener, removeEventListener, removeAllEventListeners, onReady } = useSocket("lobby", gameModeFromParams);

    // Set the game mode to what the search params indicate, with random ones being set to custom
    const [gameMode, setGameMode] = useState(gameModeFromParams);
    const [myHash, setMyHash] = useState(undefined);
    // My party member
    const [myPM, setMyPM] = useState(null)
    const [partySlots, setPartySlots] = useState([])
    const [enteredLobby, setEnteredLobby] = useState(false)

    const [isReady, setIsReady] = useState(false)

    const [lobbyInfo, setLobbyInfo] = useState({})
    const [playersOnline, setPlayersOnline] = useState(undefined)
    const [customSettings, setCustomSettings] = useState({})
    const [showSettings, setShowSettings] = useState(false)
    const [showCustomCategories, setShowCustomCategories] = useState(false)
    const [disableGameRules, setDisableGameRules] = useState(true)

    const [randomLobbyName] = useState(gameModeFromParams === "custom" ? params.mode : () => generateRandomLobbyName());

    
    useEffect(() => {
        onReady(() => {
            addEventListener("prelobby_joined", ({ player, party_members, user, lobby, currentlyActive }) => {
                console.log("LOBBY", lobby)
                setMyHash(user.hash);
                setMyPM(party_members.find((m) => m.hash === user.hash))
                setPlayersOnline(lobby.number_of_online_players)
                for(let i = 0; i < party_members.length; i++) {
                    joinParty(party_members[i])
                }

                // Set the lobby settings
                setLobbyInfo(lobby)
                // Chop away the categories that can't be mutated
                let customSettingsFromLobby = {...lobby}
                for(let key of Object.keys(lobby)) {
                    if(!MUTATABLE_RULES.includes(key)) delete customSettingsFromLobby[key]
                }
                customSettingsFromLobby["name"] = randomLobbyName
                setCustomSettings((prev) => {return {...customSettingsFromLobby}})
            });

            addEventListener("prelobby_not_found", ({ player }) => {
                showBanner("Lobby not found")
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

            addEventListener("joined_party", ({members, user, lobby}) => {
                // Update party data
                // Set my party member now that its changed
                setMyPM(members.find((m) => m.hash === myHash))
                setPartySlots([])
                for(let i = 0; i < members.length; i++) {
                    joinParty(members[i])
                }
                showBanner(`${user.firstname} ${user.lastname} joined party`)
                // If we are the new member, we need to update our lobby info
                if(user.hash === myHash) {
                    setLobbyInfo({...lobby})
                }
            })

            addEventListener("member_left_party", ({user, members, lobby}) => {
                // Set my party member now that its changed
                setMyPM(members.find((m) => m.hash === myHash))
                // If this user is me
                if (user.hash === myHash && members && lobby) {
                    setPartySlots([])
                    // Redisplay the new party data (I will be the leader now)
                    for(let i = 0; i < members.length; i++) {
                        joinParty(members[i])
                    }
                    // Update the lobby info
                    setLobbyInfo(lobby)

                    showBanner(`You left the party`)
                    return
                }

                leaveParty(user.hash)
                showBanner(`${user.firstname} ${user.lastname} left the party`)
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

            addEventListener("changed_gamemode", ({lobby}) => {
                setGameMode(lobby.name)
                setLobbyInfo(lobby)
                setPlayersOnline(lobby.number_of_online_players)
            })

            addEventListener("changed_custom_settings", ({settings}) => {
                // If I am the party leader, I changed these and we don't need to update the lobby info
                if(myPM?.is_leader) return;
                console.log(settings)
                setLobbyInfo({...settings})
            })
            
            addEventListener("all_ready", () => {
                console.log(customSettings)
                // If we are the leader, and we are making a custom game, then we need to send the server the rules we made for the game
                // So that the server can make a new lobby for us

                // TODO: Maybe at this point put everyone into a loading screen until the enter_lobby event is received
                if(!myPM?.is_leader) return;
                if(gameMode === "custom") {
                    send("clients_ready", {settings: {...customSettings}})
                } else {
                    send("clients_ready")
                }
            })

            addEventListener("failed_lobby_creation", (error) => {
                showBanner("Failled to create lobby: " + error?.message)
            })

            addEventListener("failed_lobby_join", (error) => {
                showBanner("Failed to join lobby: "+ error?.message)
            })

            addEventListener("enter_lobby", ({lobby_alias}) => {
                router.replace(`/${lobby_alias}`)
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
            removeAllEventListeners()
        };
    }, [gameMode, partySlots, socket, myHash, myPM]);

    // Setting game rule editing
    useEffect(() => {
        setDisableGameRules(gameMode !== "custom" || !myPM?.is_leader)
        // Make sure that when the leader switches to custom, the correct name for the lobby shows
        if(gameMode === "custom") {
            setCustomSettings((prev) => {return {...prev, name: randomLobbyName}})
        }
    }, [gameMode, myPM]);

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

    function handleLeaveParty() {
        send("leave_party")
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

    function allowLobbyName(text) {
        if(text === "" || text.length > 40 || detectCurseWords(text)) return false
        return !/\s/.test(text);
    }

    function handleGameRuleChange(e) {
        if(e.dataName == "name") console.log("NAME TO ", e.value)

        // For displaying the game rules
        if(e.dataName === "category" && e.value.title.toLowerCase() === "custom") {
            setShowCustomCategories(true)
        } else {
            setShowCustomCategories(false)
        }

        if(e.value?.title) e.value = e.value.title.toLowerCase()

        // Update our custom categories
        setCustomSettings((prev) => {
            // Only set values that are already in the settings
            if(!MUTATABLE_RULES.includes(e.dataName)) return prev

            const newSettings = {
                ...prev,
                [e.dataName]: e.value
            }
            if(e.dataName == "name") console.log("NEW SETTINGS", newSettings)
            // Emit an event to show other users the updates
            send("custom_settings_changed", {settings: newSettings})
            return newSettings
        })
    }
    
    useEffect(() => {
        console.log("CS", customSettings?.name)
    }, [customSettings])

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
                            playersOnline={g.name.toLowerCase() === gameMode ? playersOnline : "hi"}
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
                    <View style={styles.partyOptions}>
                        <GlassyButton
                            style={styles.leaveButton}
                            onPress={handleLeaveParty}
                        >Leave Party</GlassyButton>
                        <GlassyView style={styles.settingsButtonContainer}>
                            <IconButton
                                icon="cog"
                                style={styles.settingsButton}
                            />
                            <IconButton
                                icon={showSettings ? "chevron-up" : "chevron-down"}
                                style={styles.settingsButton} 
                                onPress={() => setShowSettings(!showSettings)}
                                rippleColor={theme.onBackground}
                            />
                        </GlassyView>
                        <GlassyButton
                            style={styles.readyButton}
                            mode={isReady ? "filled" : "contained"}
                            onPress={handleReadyPressed}
                        >Ready</GlassyButton>
                    </View>
                    <ScrollView>
                    {
                        lobbyInfo?.name || gameMode === "custom" ?
                        <ExpandableView
                            expanded={gameMode === "custom" || showSettings}
                            minHeight={0}
                            // dynamicSizing={true}
                            maxHeight={800}
                        >
                            <GlassyView
                                style={styles.customRulesContainer}
                            >
                                <HelperText style={styles.title}>Create Custom Game</HelperText>
                                <View style={styles.customRules}>
                                    <View style={styles.rulesColumn}>
                                        <GameRule
                                            label="Name"
                                            dataName="name"
                                            mode="text"
                                            defaultValue={gameMode === "custom" && myPM?.is_leader ? customSettings?.name : lobbyInfo?.name}
                                            onChange={handleGameRuleChange}
                                            valueError={(text) => allowLobbyName(text) ? false : "Invalid lobby name"}
                                            disabled={disableGameRules}
                                        />
                                        <GameRule
                                            label="Gamemode"
                                            dataName="gamemode"
                                            mode="dropdown"
                                            options={
                                                GAMEMODES.map((g)=> {return {title: capitalize(g.name)}})
                                            }
                                            defaultValue={GAMEMODES.map((g) => g.name).indexOf(lobbyInfo?.gamemode) || 0}
                                            onChange={handleGameRuleChange}
                                            disabled={disableGameRules}
                                        />
                                        <GameRule
                                            label="Category"
                                            dataName="category"
                                            mode="dropdown"
                                            options={
                                                CATEGORIES.map((c) => {return {title: capitalize(c)}})
                                            }
                                            defaultValue={lobbyInfo?.category || 0}
                                            onChange={handleGameRuleChange}
                                            disabled={disableGameRules}
                                        />
                                        <ExpandableView
                                            expanded={showCustomCategories}
                                            minHeight={0}
                                            maxHeight={400}
                                        >
                                            <CustomCategories/>
                                        </ExpandableView>
                                        
                                    </View>
                                    <View style={styles.rulesColumn}>
                                        <GameRule
                                            label="Rounds"
                                            dataName="rounds"
                                            mode="numeric"
                                            minimum={10}
                                            maximum={100}
                                            defaultValue={lobbyInfo?.rounds}
                                            onChange={handleGameRuleChange}
                                            disabled={disableGameRules}
                                        />
                                        <GameRule
                                            label="Level"
                                            dataName="level"
                                            mode="numeric"
                                            minimum={0}
                                            maximum={3}
                                            defaultValue={lobbyInfo?.level}
                                            onChange={handleGameRuleChange}
                                            disabled={disableGameRules}
                                        />
                                        <GameRule
                                            label="Speed"
                                            dataName="speed"
                                            mode="slider"
                                            minimum={100}
                                            maximum={800}
                                            defaultValue={lobbyInfo?.speed}
                                            onChange={handleGameRuleChange}
                                            disabled={disableGameRules}
                                        />
                                        <GameRule
                                            label="Bonuses"
                                            dataName="bonuses"
                                            mode="toggle"
                                            defaultValue={lobbyInfo?.bonuses}
                                            onChange={handleGameRuleChange}
                                            disabled={disableGameRules}
                                        />
                                        <GameRule
                                            label="Allow multiple buzzes"
                                            dataName="allow_multiple_buzz"
                                            mode="toggle"
                                            defaultValue={lobbyInfo?.allow_multiple_buzz}
                                            onChange={handleGameRuleChange}
                                            disabled={disableGameRules}
                                        />
                                        <GameRule
                                            label="Allow question skips"
                                            dataName="allow_question_skip"
                                            mode="toggle"
                                            defaultValue={lobbyInfo?.allow_question_skip}
                                            onChange={handleGameRuleChange}
                                            disabled={disableGameRules}
                                        />
                                        <GameRule
                                            label="Allow pauses"
                                            dataName="allow_question_pause"
                                            mode="toggle"
                                            defaultValue={lobbyInfo?.allow_question_pause}
                                            onChange={handleGameRuleChange}
                                            disabled={disableGameRules}
                                        />
                                    </View>

                                </View>

                            </GlassyView>
                        </ExpandableView>
                        :
                        <GlassyView>
                            <HelperText>We could not load lobby information</HelperText>
                        </GlassyView>
                    }
                    </ScrollView>
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
        margin: 10
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
    partyOptions: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    readyButton: {
        width: 200,
    },
    leaveButton: {
        width: 200,
        backgroundImage: theme.gradients.buttonRed
    },
    settingsButtonContainer: {
        padding: 0,
        flexDirection: "row",
        backgroundColor: theme.background,
        borderRadius: 999
    },
    settingsButton: {
        margin: 0,
        backgroundColor: "transparent"
    },
    gamemodes: {
        width: 200,
    },
    gamemode: {
        width: "100%",
    },
    customRulesContainer: {
        height: "100%"
    },
    title: {
        fontSize: "1.2rem",
        fontWeight: "bold"
    },
    customRules: {
        margin: 10,
        flexDirection: "row",
        gap: 10,
        width: "100%"
    },
    rulesColumn: {
        flexGrow: 1,
        maxWidth: "49%"
    }
});
