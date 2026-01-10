import { getProtectedRoute, postProtectedRoute , handleExpiredAccessToken } from "../../utils/requests.jsx"

import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Dimensions,
    ScrollView,
    Image
} from 'react-native';
import Video from "react-native-video";
import { Button, HelperText, Menu, Title, IconButton, Icon, ActivityIndicator, Avatar, Card } from 'react-native-paper';
import { useRouter, useGlobalSearchParams, useLocalSearchParams, usePathname } from 'expo-router';
import { useAlert } from "../../utils/alerts.jsx";
import { useSocket } from "../../utils/socket.jsx";

import SidebarLayout from "../../components/navigation/SidebarLayout.jsx";
import GlassyButton from "../../components/custom/GlassyButton.jsx"
import PlayerScores from "../../components/game/PlayerScores.jsx";
import AnswerInput from "../../components/game/AnswerInput.jsx";
import Question from "../../components/game/Question.jsx";
import Interrupt from "../../components/game/Interrupt.jsx";
import PlayerJoined from "../../components/game/PlayerJoined.jsx";
import ExpandableView from "../../components/custom/ExpandableView.jsx";
import { useBanner } from "../../utils/banners.jsx";
import theme from "../../assets/themes/theme.js";
import GameSettings from "../../components/entities/GameSettings.jsx";
import ShowSettings from "../../components/custom/ShowSettings.jsx";
import PlayerDisconnected from "../../components/game/PlayerDisconnected.jsx";

const { width } = Dimensions.get('window');
const MOBILE_THRESHOLD = 600

// TEMPORARY
const ANSWER_MS = 5000;

const SHOW_EVENTS_INCREMENTS = 20

const RESERVED_GAMEMODES = ['solos', 'duos', 'trios', 'squads', '5v5']

const Play = () => {
    // Get the lobby alias
    const query = useGlobalSearchParams();
    const alias = query.alias || "";
    const router = useRouter()

    const {showAlert} = useAlert();
    const {showBanner} = useBanner()
    const {socket, send, addEventListener, removeEventListener, removeAllEventListeners, onReady, disconnect} = useSocket("game", alias);
    const [hasRegisteredOnReady, setHasRegisteredOnReady] = useState(false)

    const [typingEmitInterval, setTypingEmitInterval] = useState(null)
    const [myPlayer, setMyPlayer] = useState(null);

    // New question stuff
    const [allEvents, setAllEvents] = useState([]);
    const [buzzer, setBuzzer] = useState(null);
    const [questionState, setQuestionState] = useState("running");
    const questionStateRef = useRef(questionState)
    const [synctimestamp, setSynctimestamp] = useState(0)

    // Game state
    const [lobby, setLobby] = useState(null)
    const [showSettings, setShowSettings] = useState(false)
    
    // Memory manamgent
    const [showNumberOfEvents, setShowNumberOfEvents]= useState(SHOW_EVENTS_INCREMENTS)

    // Register keybinds
    useEffect(() => {
        // Handle key presses
        function handleKeyDown(e) {
            if(e.code === "Space") e.preventDefault()
            if(questionState == "interrupted") return;

            switch(e.code) {
                case "Space":
                    if(buzzer || questionState == "dead") return; 
                    // Buzz logic
                    onBuzz()
                break;
                case "KeyJ":
                    onNextQuestion();
                break;
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [buzzer, questionState])

    // Register socket event listners
    useEffect(() => {
        onReady(() => {
            addEventListener("you_joined", ({player, lobby}) => {
                setMyPlayer(player)
            })

            addEventListener("lobby_not_found", () => {
                showAlert("The lobby you are trying to enter does not exist")
                router.replace("/lobby?mode=solos")
            })

            addEventListener("join_lobby_failed", ({error}) => {
                showBanner("Failed to join lobby: " + error.message.toLowerCase())
            })

            addEventListener("player_joined", ({player, game_state, lobby}) => {
                console.log("JOINED", lobby)
                player.eventType = "player_joined"
                addEvent(player)
                // For updating the scores and stuff
                setLobby({...lobby})
            })

            addEventListener("question_interrupt", ({player, answer_content, timestamp}) => {
                setSynctimestamp(timestamp)
                setBuzzer({current: player})
                setQuestionState("interrupted")
                // For non-question events, put them second in the list
                addEvent({
                    eventType: "interrupt",
                    // Set the interrupt status for the buzzer color
                    status: questionStateRef.current == "waiting" ? "late" : "early",
                    player: player,
                    content: answer_content
                })
            })

            addEventListener("player_typing", ({answer_content}) => {
                // Update the typing box with the answer_content by setting the content of the second in list interrupt event
                setInterruptData("content", answer_content)
            })

            addEventListener("question_resume", ({player, final_answer, scores, is_correct, timestamp}) => {
                setInterruptData("answerStatus", is_correct == 1 ? "Correct" : (is_correct == 0 ? "Prompt" : "Wrong"))
                if(scores) {
                    setLobby((prev) => {
                        let changed = prev;
                        // TODO: Adjust for multiple games
                        changed.games[0].teams = scores
                        return changed
                    })
                }
                setBuzzer(null)
                setQuestionState("running")
                setSynctimestamp(timestamp)
            })

            addEventListener("next_question", ({player, final_answer, scores, is_correct, question, timestamp}) => {
                // Update the typing box with the answer_content by setting the content of the second in list interrupt event
                setInterruptData("answerStatus", is_correct == 1 ? "Correct" : (is_correct == 0 ? "Prompt" : "Wrong"))
                // Minimize the current quetsion
                minimizeCurrentQuestion()
                setBuzzer(null)
                setSynctimestamp(timestamp)
                addEvent(question, true)
                setQuestionState("running")
                if(scores) {
                    setLobby((prev) => {
                        let changed = prev;
                        // TODO: Adjust for multiple games
                        changed.games[0].teams = scores
                        return changed
                    })
                }
            })

            addEventListener("reward_points", ({scores}) => {
                
            })

            addEventListener("game_paused", ({player}) => {
                
            })

            addEventListener("game_resumed", ({player, timestamp}) => {
                setSynctimestamp(timestamp)
            })

            addEventListener("changed_game_settings", ({lobby}) => {
                // If we are the one who made these chagnes, return
                if(myPlayer?.user?.id === lobby?.creator_id) return
                setLobby({...lobby})
            })

            // Mostly test listner
            addEventListener("chat_message", (data) => {
                console.log("message!")
            })

            // I don't think this works lol
            addEventListener("you_disconnected", ({stats, total_stats}) => {
                showAlert("View your stats here: " + stats.correct)
            })

            addEventListener("player_disconnected", ({lobby, user}) => {
                user.eventType = "player_disconnected"
                addEvent(user)
                setLobby({...lobby})
            })

            // Now that the listners are registered, we are ready to join the lobby
            send("join_lobby", { lobbyAlias: alias });
        })

        return () => {
            clearInterval(typingEmitInterval)
            removeAllEventListeners()
            disconnect()
        }
    }, [])

    // Update the ref for it to be used in the listeners
    useEffect(() => {
        questionStateRef.current = questionState
    }, [questionState])

    const testSocket = () => {
        send("test", { message: "Hello from RN!" });
    };

    // Functions
    function onBuzz() {
        // Can't buzz when there is already an interruption
        if(buzzer || questionState == "dead") return;
        send("buzz", {timestamp: Date.now()})
    }

    function onTyping(text) {
        send("typing", {content: text})
    }

    function onSubmit(text) {
        clearInterval(typingEmitInterval)
        send("submit", {final_answer: text})
    }

    function onNextQuestion() {
        send("next_question")
    }

    // I don't think I actually need this
    function onQuestionResume() {
        
    }

    function onGamePause() {

    }

    function onGameResume() {
        
    }

    function handleInputChange(text) {
        onTyping(text)
    }

    function handleInterruptOver(text, questionNotFinished) {
        setBuzzer(null)
        if(questionNotFinished) {
            // TODO: keep track of waiting time
            setQuestionState("running")
        } else {
            setQuestionState("waiting")
        }
    }

    function handleQuestionFinish(){
        setQuestionState("waiting")
    }

    function handleQuestionDeath() {
        setBuzzer(null)
        setQuestionState("dead")
    }

    function addEvent(event, isQuestion) {
        // If it is a question, is is the active question so we put it on the top of the stack
        if(isQuestion) {
            setAllEvents((prev) => {
                // Prevent duplicates
                if(prev[0]?.id === event?.id) return prev;
                event.eventType = "question";
                event.expanded = true;
                return [event, ...prev]
            })
        }
        // If it not a question, we want to put it second in the stack
        else {
            setAllEvents((prev) => [
                prev[0],
                event,
                ...prev.slice(1)
            ])
        }
    }

    function setInterruptData(field, value) {
        // Update the typing box with the answer_content by setting the content of the second in list interrupt event
        setAllEvents(prev => {
            return prev.map((event, index) => {
                if (event?.eventType === "interrupt" && index === 1) {
                    let data = {...event}
                    data[field] = value;
                    return data;
                }
                return event;
            });
        });
    }

    function minimizeCurrentQuestion() {
        setAllEvents((prev) => {
            if(prev[0]?.eventType !== "question") return prev;

            return [
                {
                    ...prev[0],
                    expanded: false
                },
                ...prev.slice(1)
            ]
        })
    }

    function handleExit() {
        if(socket) socket.disconnect()
        router.replace(`/lobby?mode=${alias}`)
    }

    function handleGameRuleChange(rules) {
        // If there isn't myPlayer, we haven't actually loaded in yet, and this is from the mounting
        if(!myPlayer) return
        // console.log("RULES", rules)
        // We can only change the rules if we are the creator of this lobby
        if(myPlayer?.user?.id !== lobby?.creator_id) return
        console.log("RULES", rules)
        // Race condition on render, fix
        // send("change_game_settings", {settings: rules})
    }

    // useEffect(() => {
    //     console.log("PLAYER< LOBBY", myPlayer, lobby)
    // }, [myPlayer, lobby])


    return (
        <SidebarLayout style={styles.sidebar}>
            <View style={styles.container}>
                <View style={styles.gameContent}>
                    <AnswerInput
                        onChange={handleInputChange}
                        onSubmit={onSubmit}
                        disabled={!(buzzer && buzzer?.current?.id == myPlayer?.id)}
                    ></AnswerInput>

                    <ScrollView contentContainerStyle={styles.questions}>
                    {
                        allEvents.slice(0, showNumberOfEvents).map((e, i) => {
                            switch(e?.eventType) {
                                case "question":
                                    return (
                                        <Question
                                            question={e}
                                            timestamp={synctimestamp}
                                            onInterruptOver={i == 0 ? handleInterruptOver : null}
                                            onFinish={i == 0 ? handleQuestionFinish : null}
                                            onDeath={i == 0 ? handleQuestionDeath : null}
                                            state={i == 0 ? questionState : "dead" }
                                            setState={setQuestionState}
                                            style={styles.question}
                                            key={`q:${e.id}`}
                                        />
                                    )
                                case "interrupt":
                                    return (
                                        <Interrupt event={e} key={`i:${i}`}/>
                                    )
                                case "player_joined":
                                    return (
                                        <PlayerJoined event={e} key={`pj:${i}`}/>
                                    )
                                case "player_disconnected":
                                    return (
                                        <PlayerDisconnected event={e} key={`pd:${i}`}/>
                                    )
                                default:

                            }
                        })
                    }
                    {
                        showNumberOfEvents < allEvents.length &&
                        <View style={styles.showingContainer}>
                            <GlassyButton
                                mode="filled"
                                onPress={() => {
                                    setShowNumberOfEvents(showNumberOfEvents + SHOW_EVENTS_INCREMENTS)
                                }}
                            >Show more ({Math.min(showNumberOfEvents, allEvents.length)} / {allEvents.length} visible)</GlassyButton>
                            <GlassyButton
                                onPress={() => {
                                    setShowNumberOfEvents(SHOW_EVENTS_INCREMENTS)
                                }}
                            >Hide all</GlassyButton>
                        </View>
                    }
                    </ScrollView>
                </View>
                <View style={styles.optionsContainer}>
                    <GlassyButton style={styles.buzzButton} mode="filled" onPress={onBuzz}>Buzz (space)</GlassyButton>
                    <GlassyButton style={styles.nextButton} mode="filled" onPress={onNextQuestion}>Next (j)</GlassyButton>
                    <GlassyButton style={styles.exitButton} mode="filled" onPress={handleExit}>Exit</GlassyButton>
                    {
                        // TODO: In the future accomodate lobbies with many games. Probably handle multiple games being passed on the backend
                    }
                    {
                        lobby && <PlayerScores teams={lobby.games[0].teams} gameMode={lobby.gamemode.toLowerCase()} />
                    }
                    <ShowSettings
                        onChange={setShowSettings}
                    />
                    <GameSettings
                        expanded={showSettings}
                        columns={1}
                        defaultInfo={lobby}
                        // TODO: Determine who can edit lobbies while they are in them
                        disabled={myPlayer?.user?.id !== lobby?.creator_id}
                        nameDisabled={true}
                        title={"Game Rules"}
                        onGameRuleChange={handleGameRuleChange}
                    />
                </View>

            </View>

        </SidebarLayout>
    )
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        flexDirection: "row",
        gap: 10,
    },
    gameContent: {
        margin: 10,
        flexGrow: 1,
        flexShrink: 1,
        flexDirection: "column",
        width: "100%"
    },
    questions: {
        marginTop: 10,
        gap: 10,
    },
    question: {
        height: 300
    },
    showingContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 10
    },
    optionsContainer: {
        flexShrink: 1,
        position: "relative",
        right: 0,
        flexDirection: "column",
        gap: 10,
        minWidth: 250,
    },
    scorebox: {
        // width: 300
    },
    buzzButton: {
        // backgroundImage: theme.gradients.buttonWhite
    },
    exitButton: {
        backgroundImage: theme.gradients.buttonRed
    },
    nextButton: {
        backgroundImage: theme.gradients.buttonBlue
    }
})

export default Play;