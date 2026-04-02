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
    Pressable
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
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";


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
import ShowSettings from "../../components/custom/ShowSettings.jsx";
import GameSettings from "../../components/entities/GameSettings.jsx";
import JoinCustomLobby from "../../components/entities/JoinCustomLobby.jsx";
import LabeledToggle from "../../components/custom/LabeledToggle.jsx";
import FriendOptions from "../../components/entities/FriendOptions.jsx";
import DropDown from "../../components/custom/DropDown.jsx";
import ustyles from "../../assets/styles/ustyles.js";


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
        name: "5v5",
        description: "Full quiz bowl game against other players online.",
        icon: "account-group",
    },
    {
        name: "custom",
        description: "Create a custom game and play with your friends.",
        icon: "hammer-wrench",
    },
    {
        name: "ranked",
        description: "Test your skill against other players and climb up the global leaderboard.",
        icon: "medal",
    },
];

const MUTATABLE_RULES = ["name", "gamemode", "category", "rounds", "level", "speed", "bonuses", "public", "allow_multiple_buzz", "allow_question_skip", "allow_question_pause"]

let { width, height } = Dimensions.get("window");
let isMobile = width <= 768; // Adjust breakpoint as needed



export default function LobbyScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const {showAlert} = useAlert()
    const {showBanner} = useBanner()
    const gameModeFromParams =  GAMEMODES.map((g) => g.name).includes(params.mode) ? params.mode : "custom"

    const { socket, send, addEventListener, removeEventListener, removeAllEventListeners, onReady, disconnect } = useSocket("lobby", gameModeFromParams);

    // Set the game mode to what the search params indicate, with random ones being set to custom
    const [gameMode, setGameMode] = useState(gameModeFromParams);
    const [myHash, setMyHash] = useState(undefined);
    // My party member
    const [myPM, setMyPM] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [partySlots, setPartySlots] = useState([])
    const [enteredLobby, setEnteredLobby] = useState(false)

    const [isReady, setIsReady] = useState(false)
    const [isCreateCustom, setIsCreateCustom] = useState(false)
    const [searchedLobbies, setSearchedLobbies] = useState([])

    const [lobbyInfo, setLobbyInfo] = useState({})
    const [initialLobbyInfo, setInitialLobbyInfo] = useState({})
    const [playersOnline, setPlayersOnline] = useState(undefined)
    const [customSettings, setCustomSettings] = useState({})
    const [showSettings, setShowSettings] = useState(false)
    const [showCustomCategories, setShowCustomCategories] = useState(false)
    const [disableGameRules, setDisableGameRules] = useState(true)

    const [randomLobbyName] = useState(gameModeFromParams === "custom" ? params.mode : generateRandomLobbyName);

    const [friends, setFriends] = useState([])
    const [friendRequests, setFriendRequests] = useState([])

    // Mobile style
    const [mobileFriendsDisplayed, setMobileFriendsDisplayed] = useState(null)
    
    // See if we are a user. Otherwise, logout
    useFocusEffect(
        useCallback(() => {
            // Runs every time this screen comes into focus
            getProtectedRoute("/my_account");
        }, [])
    );

    useEffect(() => {
        onReady(() => {
            addEventListener("prelobby_joined", ({ player, party_members, user, lobby, friends, friend_requests }) => {
                setIsLoading(false)
                setMyHash(user.hash);
                setMyPM(party_members.find((m) => m.hash === user.hash))
                setPlayersOnline(lobby.number_of_online_players)
                setFriends(friends)
                setFriendRequests(friend_requests)

                for(let i = 0; i < party_members.length; i++) {
                    joinParty(party_members[i])
                }

                // Set the lobby settings
                setLobbyInfo(lobby)
                setInitialLobbyInfo(lobby)
                // Chop away the categories that can't be mutated
                let customSettingsFromLobby = {...lobby}
                for(let key of Object.keys(lobby)) {
                    if(!MUTATABLE_RULES.includes(key)) delete customSettingsFromLobby[key]
                }
                customSettingsFromLobby["name"] = randomLobbyName
                setCustomSettings(customSettingsFromLobby)
            });

            addEventListener("prelobby_not_found", ({ player }) => {
                showBanner("Lobby not found", {backgroundColor: theme.error})
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
                showBanner(`${user.username} joined the party`)
                // If we are the new member, we need to update our lobby info
                if(user.hash === myHash) {
                    setLobbyInfo({...lobby})
                }
            })

            addEventListener("member_left_party", ({user, members, lobby}) => {
                console.log(user)
                // Set my party member now that its changed
                setMyPM(members.find((m) => m.hash === myHash))
                // Redisplay the new data
                setPartySlots([])
                for(let i = 0; i < members.length; i++) {
                    joinParty(members[i])
                }
                // If this user is me
                if (user?.hash === myHash && members && lobby) {
                    // Update the lobby info
                    setLobbyInfo(lobby)

                    showBanner(`You left the party`, {backgroundColor: theme.error})
                    return
                }

                leaveParty(user?.hash)
                showBanner(`${user.username} left the party`, {backgroundColor: theme.error})
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
                setGameMode(GAMEMODES.map((g) => g.name.toLowerCase()).includes(lobby.name) ? lobby.name : "custom")
                setLobbyInfo(lobby)
                setPlayersOnline(lobby.number_of_online_players)
            })

            addEventListener("changed_custom_settings", ({settings}) => {
                // If I am the party leader, I changed these and we don't need to update the lobby info
                if(myPM?.is_leader) {
                    // If we are the leader, we want to set custom settings
                    setCustomSettings((prev) => {return {...prev, ...settings}})
                } else {
                    // Otherwise, we want to just show lobby info
                    setLobbyInfo((prev) => {return {...prev, ...settings}})
                }
            })
            
            addEventListener("all_ready", () => {
                // If we are the leader, and we are making a custom game, then we need to send the server the rules we made for the game
                // So that the server can make a new lobby for us

                // TODO: Maybe at this point put everyone into a loading screen until the enter_lobby event is received
                if(!myPM?.is_leader) return;
                // For making a new lobby
                if(gameMode === "custom" && isCreateCustom) {
                    console.log({...customSettings, creator_id: myPM.id})
                    send("clients_ready", {settings: {...customSettings, creator_id: myPM.id}})
                } else if (gameMode === "custom" && !isCreateCustom) {
                    send("clients_ready", {lobby_alias: customSettings.name})
                } else {
                    send("clients_ready", {})
                }
            })

            addEventListener("failed_lobby_creation", (error) => {
                console.log("FAILED LOBBY CREATION", error)
                showBanner("Failled to create lobby: " + error?.message, {backgroundColor: theme.error})
                setIsReady(false)
            })

            addEventListener("failed_lobby_join", (error) => {
                showBanner("Failed to join lobby: "+ error?.message, {backgroundColor: theme.error})
                setIsReady(false)
            })

            addEventListener("enter_lobby", ({lobby_alias}) => {
                router.replace(`/${lobby_alias}`)
            })

            addEventListener("user_disconnected", ({user_hash})=> {
                leaveParty(user_hash)
            })

            addEventListener("lobbies_found", ({lobbies}) => {
                setSearchedLobbies(lobbies)
            })

            addEventListener("added_friend", ({message, friends, friend_requests})=> {
                console.log(friend_requests)
                showBanner(message)
                if(friends !== undefined) setFriends(friends)
                if(friend_requests !== undefined) setFriendRequests(friend_requests)
            })

            addEventListener("removed_friend", ({message, friends}) => {
                if(friends !== undefined) {
                    setFriends(friends)
                    showBanner(message, {backgroundColor: theme.error})
                } else {
                    showBanner("Error unfriending", {backgroundColor: theme.error})
                }
            })

            addEventListener("friend_now_online", ({friend}) => {
                setFriends((prev) => prev.map((user) => user.hash == friend.hash ? friend : user))
            })

            addEventListener("friend_now_offline", ({friend}) => {
                setFriends((prev) => prev.map((user) => user.hash == friend.hash ? friend : user))
            })

            // Now that the listners are registered, we are ready to join the lobby
            if(!enteredLobby) {
                send("enter_lobby", { lobbyAlias: params.mode ? params.mode : gameMode });
                setEnteredLobby(true)
            }
        }, []);

        // useEffect() cleanup
        return () => {
            // We want to keep contact with the lobby socket
            removeAllEventListeners()
        };
        
    // TODO: Remove prop list and use refs instead
    // so we dont have to teardown everything all of the time
    // At least reduce the frequently changes ones, like customSettings.
    // Use refs instead
    }, [gameMode, partySlots, myHash, myPM, customSettings]);

    // When this page is torn down we want to disconnect from the socket
    // useEffect(() => {
    //     return ()=> {
    //         if(socket) disconnect()
    //     }
    // }, [])

    useEffect(() => {
        // console.log("CUSTOM INFO", customSettings)
        // console.log("IS CREATE", isCreateCustom)

    }, [customSettings, isCreateCustom])

    // Setting game rule editing
    useEffect(() => {
        setDisableGameRules(gameMode !== "custom" || !myPM?.is_leader)
        if(myPM?.is_leader) {
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

    function handleAcceptInvite(party_hash) {
        send("accepted_invite", {party_hash})
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

            // TODO: Handle more than 5 party members, or cap at 5
            // Add from the middle out on PC, but top down on mobile
            if(prev[ isMobile ? 0 : 2]) {
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

    function handleGameRuleChange(settings) {
        // If we don't have our lobby yet, we don't want the GameSettings mounts to change anything
        if(!lobbyInfo?.name) return
        // Set our lobby info since we are the party leader and we can't do it in the event listener because that will create a feedback loop
        setLobbyInfo((prev) => {
            let newInfo = prev
            return {
                ...newInfo,
                ...settings
            }
        })
        send("custom_settings_changed", {settings})
    }

    function handleCustomLobbySearch(search) {
        send("search_lobbies", {query: search})
    }

    function handleSelectCustom(lobby) {
        if(!lobby) return
        // Don't let them do this if they're not the party leader
        if(!myPM?.is_leader) {
            showBanner("You are not the party leader", {backgroundColor: theme.error})
        } else {
            setLobbyInfo(lobby)
            setCustomSettings(lobby)
            // Update this for everyone else
            send("custom_settings_changed", {settings: lobby})
            // Set the custom gamemode as this new lobby alias to register it with the party on the backend
            send("change_gamemode", {lobby_alias: lobby.name})
            showBanner("Lobby selected")
        }
    }


    // Components
    const readyInfo = (
        <View style={isMobile ? mstyles.partyOptions : styles.partyOptions}>
            <GlassyButton
                style={[styles.leaveButton, isMobile && mstyles.readyInfoButton]}
                onPress={handleLeaveParty}
            >Leave Party</GlassyButton>
            {
                !isMobile &&
                <ShowSettings 
                    onChange={setShowSettings}
                />
            }
            <GlassyButton
                style={[styles.readyButton, isMobile && mstyles.readyInfoButton]}
                mode={isReady ? "filled" : "contained"}
                onPress={handleReadyPressed}
            >Ready</GlassyButton>
        </View>
    )


    return (
        <SidebarLayout
            slideDown={mobileFriendsDisplayed &&
                <View style={ustyles.flex.flexColumnCenterItems}>
                    <IconButton
                        icon={"close"}
                        onPress={() => setMobileFriendsDisplayed(false)}
                        size={40}
                    />
                    <FriendOptions
                        friends={friends}
                        friendRequests={friendRequests}
                        socket={socket}
                        addEventListener={addEventListener}
                        removeEventListener={removeEventListener}
                        style={mstyles.friendsDialogue}
                    />
                </View>
            }
        >
            <View style={isMobile ? mstyles.container : styles.container}>
                {
                    isMobile &&
                    <View style={mstyles.topOptions}>
                        <DropDown
                            style={mstyles.dd}
                            options={GAMEMODES.map((g) => {return {title: g.name}})}
                            onSelect={(param) => handleGameModePress(param.title)}
                        />
                        <IconButton
                            icon={"account"}
                            style={mstyles.friendsButton}
                            onPress={() => setMobileFriendsDisplayed(true)}
                            size={40}
                        />
                    </View>
                }
                {!isMobile &&
                <View style={isMobile ? mstyles.top : styles.left}>
                {
                    GAMEMODES.map((g, i) => (
                        <GameMode
                            gamemode={g}
                            icon={g.icon}
                            style={styles.gamemode}
                            selected={gameMode == g.name}
                            onPress={() => handleGameModePress(g.name)}
                            playersOnline={g.name.toLowerCase() === gameMode ? playersOnline : "hi"}
                            key={i}    
                        />
                    ))
                }
                {
                    !isMobile &&
                    <FriendOptions
                        friends={friends}
                        friendRequests={friendRequests}
                        socket={socket}
                        addEventListener={addEventListener}
                        removeEventListener={removeEventListener}
                    />
                }
                </View>
                }
                <View style={isMobile ? mstyles.right : styles.right}>
                    {
                        isMobile && readyInfo
                    }
                    <View style={isMobile ? mstyles.partySlots : styles.partySlots}>
                    {
                        partySlots.length > 0 ?
                        partySlots.map((user, i) => 
                            <PartySlot
                                player={user}
                                style={isMobile ? mstyles.partySlot : styles.partySlot}
                                onPress={openInviteFriendModal}
                                isMe={user?.hash == myHash}
                                ready={user?.ready}
                                key={i}
                            />
                        ) :
                        <ActivityIndicator
                            style={styles.partyLoading}
                            size={50}
                        />
                    }
                    </View>
                    {
                        !isMobile && readyInfo
                    }
                    {
                        isMobile &&
                        <ShowSettings 
                            onChange={setShowSettings}
                        />
                    }
                    {
                        gameMode === "custom" &&
                        <LabeledToggle
                            onChange={(isFirst) => setIsCreateCustom(!isFirst)}
                            label1="Join Custom"
                            label2="Create Custom"
                        />
                    }
                    <ScrollView
                        contentContainerStyle={styles.customsContainer}
                    >
                        {
                            /* Selecting a custom lobby */
                            <JoinCustomLobby
                                expanded={gameMode === "custom" && !isCreateCustom}
                                cooldownMs={200}
                                defaultValue={ !GAMEMODES.map((g) => g.name.toLowerCase()).includes(params.mode) ? params.mode : null}
                                onChangeText={handleCustomLobbySearch}
                                onSelect={handleSelectCustom}
                                lobbies={searchedLobbies}
                            />
                        }
                        {/* Creating a custom lobby */}
                        <GameSettings
                            title={gameMode === "custom" && isCreateCustom ? "Create Custom Game" : "Game Settings"}
                            expanded={(gameMode === "custom" && isCreateCustom) || showSettings}
                            gameMode={gameMode}
                            disabled={gameMode !== "custom" || !isCreateCustom || !myPM?.is_leader}
                            defaultInfo={lobbyInfo}
                            columns={ isMobile ? 1 : 2}
                            onGameRuleChange={handleGameRuleChange}
                            dynamicSizing={false}
                            maxHeight={isMobile ? 1300 : 850}
                        />
                    </ScrollView>
                    <View style={styles.partyChat}>

                    </View>
                </View>
            </View>
        </SidebarLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 10,
        margin: 10,
    },
    left: {
        width: 200,
        gap: 10
    },
    right: {
        flexGrow: 1,
        marginLeft: 30,
        flexDirection: "column",
        gap: 20,

        // For tool tips on friends
        zIndex: -1,
        elevation: -1,
    },
    noPartySlots: {
        width: "100%"
    },
    partyLoading: {
        width: "100%",
        height: 300,
        justifyContent: "flex-start"
    },
    partySlots: {
        flexDirection: "row",
        gap: 10,
    },
    partySlot: {
        flexGrow: 1,
        flexShrink: 1,
        maxWidth: "19%",
        height: "100%",
        minHeight: 300,
        maxHeight: 350,
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
    gamemode: {
        width: "100%",
    },
    customsContainer: {
        gap: 10
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

const mstyles = StyleSheet.create({
    container: {
        // paddingTop: 100,
    },
    top: {
        flexDirection: "row",
        gap: 5
    },
    topOptions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "70vw",
    },
    dd: {
        borderWidth: 1,
        borderColor: theme.elevation.level5,
        flexGrow: 1,
    },
    friendsButton: {
        backgroundColor: theme.onPrimary
    },
    gamemode: {
        flex: 1
    },
    right: {
        margin: 0,
        marginTop: 20,
        gap: 20,
    },
    partySlots: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10
    },
    partySlot: {
        minWidth: 100,
        height: 200,
        alignSelf: "stretch",
        flex: 1
    },
    partyOptions: {
        flexDirection: "row",
        gap: 10,
        justifyContent: "space-between",
        // flexWrap: "wrap"
    },
    readyInfoButton: {
        flex: 1,
        maxWidth: 170
    },
    friendsDialogue: {
        maxWidth: 200
    }
})
