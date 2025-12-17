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

const { width } = Dimensions.get('window');

// TEMPORARY
const ANSWER_MS = 5000;

const Play = () => {
    // Get the lobby alias
    const query = useGlobalSearchParams();
    const alias = query.alias || "";

    const {showAlert} = useAlert();
    const {socket, send, addEventListener, removeEventListener, onReady} = useSocket(alias);

    const [input, setInput] = useState("")
    const [typingEmitInterval, setTypingEmitInterval] = useState(null)
    const [myId, setMyId] = useState(null);

    // New question stuff
    const [allEvents, setAllEvents] = useState([]);
    const [buzzer, setBuzzer] = useState(null);
    const [questionState, setQuestionState] = useState("running");
    const questionStateRef = useRef(questionState)
    const [syncTimestamp, setSyncTimestamp] = useState(0)

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

        addEventListener("you_joined", ({Player}) => {
            setMyId(Player.id)
        })

        addEventListener("player_joined", ({Player, GameState}) => {
            Player.eventType = "player_joined"
            addEvent(Player)
        })

        addEventListener("question_interrupt", ({Player, AnswerContent, Timestamp}) => {
            setSyncTimestamp(Timestamp)
            setBuzzer({current: Player})
            setQuestionState("interrupted")
            // For non-question events, put them second in the list
            addEvent({
                eventType: "interrupt",
                // Set the interrupt status for the buzzer color
                status: questionStateRef.current == "waiting" ? "late" : "early",
                player: Player,
                content: AnswerContent
            })
        })

        addEventListener("player_typing", ({AnswerContent}) => {
            // Update the typing box with the AnswerContent by setting the content of the second in list interrupt event
            setInterruptData("content", AnswerContent)
        })

        addEventListener("question_resume", ({Player, FinalAnswer, Scores, IsCorrect, Timestamp}) => {
            setInterruptData("answerStatus", IsCorrect ? "Correct" : "Wrong")
            
            setBuzzer(null)
            setQuestionState("running")
            setSyncTimestamp(Timestamp)
        })

        addEventListener("next_question", ({Player, FinalAnswer, Scores, IsCorrect, Question, Timestamp}) => {
            // Update the typing box with the AnswerContent by setting the content of the second in list interrupt event
            setInterruptData("answerStatus", IsCorrect ? "Correct" : "Wrong")
            // Minimize the current quetsion
            minimizeCurrentQuestion()
            setBuzzer(null)
            setSyncTimestamp(Timestamp)
            addEvent(Question, true)
            setQuestionState("running")
        })

        addEventListener("reward_points", ({Scores}) => {
            
        })

        addEventListener("game_paused", ({Player}) => {
            
        })

        addEventListener("game_resumed", ({Player, Timestamp}) => {
            setSyncTimestamp(Timestamp)
        })

        // Mostly test listner
        addEventListener("chat_message", (data) => {
            console.log("message!")
        })

        // Now that the listners are registered, we are ready to join the lobby
        send("join_lobby", { lobbyAlias: alias });
        
        })

        return () => clearInterval(typingEmitInterval)
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
        send("buzz", {Timestamp: Date.now()})
    }

    function onTyping(text) {
        send("typing", {content: text})
    }

    function onSubmit() {
        clearInterval(typingEmitInterval)
        send("submit", {FinalAnser: input})
        setInput("")
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
        setInput(text)
        onTyping(text)
    }

    function handleInterruptOver(questionNotFinished) {
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
        // Update the typing box with the AnswerContent by setting the content of the second in list interrupt event
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


    return (
        <SidebarLayout style={styles.sidebar}>
            <View style={styles.container}>
                <View style={styles.gameContent}>
                    <AnswerInput
                        onChange={handleInputChange}
                        onSubmit={onSubmit}
                        disabled={!(buzzer && buzzer?.current?.id == myId)}
                    ></AnswerInput>

                    <ScrollView contentContainerStyle={styles.questions}>
                    {
                        allEvents.map((e, i) => {
                            switch(e?.eventType) {
                                case "question":
                                    return (
                                        <Question
                                            question={e}
                                            timestamp={syncTimestamp}
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
                                default:

                            }

                        })
                    }
                    </ScrollView>
                </View>
                <View style={styles.optionsContainer}>
                    <View style={styles.scorebox}>

                    </View>
                    <GlassyButton mode="filled" onPress={onBuzz}>Buzz</GlassyButton>
                    <GlassyButton mode="filled" onPress={onNextQuestion}>Next</GlassyButton>
                    <GlassyButton mode="filled" onPress={testSocket}>Send message</GlassyButton>
                    <PlayerScores players={[{name: "zane", score: 100}, {name: "bjorn", score: 67}]} />
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
        flexGrow: 1,

        width: "100%"
    },
    gameContent: {
        margin: 10,
        flexGrow: 1,
        width: "80%",
        flexDirection: "column"
    },
    questions: {
        marginTop: 10,
        gap: 10,
    },
    question: {
        height: 300
    },
    optionsContainer: {
        flexShrink: 1,
        position: "relative",
        right: 0,
        flexDirection: "column",
        gap: 10
    },
    scorebox: {
        width: 200
    }
})

export default Play;