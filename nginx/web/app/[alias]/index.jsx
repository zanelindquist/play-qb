import { getProtectedRoute, postProtectedRoute , handleExpiredAccessToken } from "../../utils/requests.jsx"

import React, { useEffect, useState } from 'react';
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

const { width } = Dimensions.get('window');

// TEMPORARY
const MY_ID = 1;
const ANSWER_MS = 5000;

const Play = () => {
    // Get the lobby alias
    const query = useGlobalSearchParams();
    const alias = query.alias || "";

    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [pastQuestions, setPastQuestions] = useState([]);
    const [currentQuestionDead, setCurrentQuestionDead] = useState(false)
    const [teardownCQ, setTeardownCQ] = useState(false)
    const {showAlert} = useAlert();
    const {socket, send, addEventListener, removeEventListener, onReady} = useSocket(alias);

    const [interrupter, setInterupter] = useState(false)
    const [input, setInput] = useState("")
    const [typingEmitInterval, setTypingEmitInterval] = useState(null)

    // New question stuff
    const [allEvents, setAllEvents] = useState([]);
    const [buzzer, setBuzzer] = useState(null);
    const [questionState, setQuestionState] = useState("running");


    // Register keybinds
    useEffect(() => {
        // Handle key presses
        function handleKeyDown(e) {
            if(interrupter) return;

            switch(e.code) {
                case "Space":
                    // Buzz logic
                    onBuzz()
                    e.preventDefault()
                break;
                case "KeyJ":
                    onNextQuestion();
                break;
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [])

    // Register socket event listners
    useEffect(() => {
        onReady(() => {


        addEventListener("player_joined", ({Player, GameState}) => {
            Player.eventType = "player_joined"
            console.log("player", Player)
            addEvent(Player)
        })

        addEventListener("question_interrupt", ({Player, AnswerContent}) => {
            Player = {id: 1, name: "Zane Lindquist"}
            setBuzzer({current: Player})
            setQuestionState("interrupted")
            // For non-question events, put them second in the list
            addEvent({
                eventType: "interrupt",
                player: Player,
                content: AnswerContent
            })
        })

        addEventListener("player_typing", (data) => {
            console.log(data)
            const AnswerContent = data.AnswerContent
            // Update the typing box with the AnswerContent
            // Set the content of the second in list interrupt event
            console.log("Player typing: ", AnswerContent)
            setAllEvents((prev) => {
                // prev[1].player = Player;
                prev[1].content = AnswerContent;
                return prev
            })
            
        })

        addEventListener("question_resume", ({Player, FinalAnswer, Scores, IsCorrect}) => {
            setBuzzer(null)
        })

        addEventListener("next_question", ({Player, FinalAnswer, Scores, IsCorrect, Question}) => {
            console.log("NEXT QUESTION")
            addEvent(Question, true)
            setQuestionState("running")

        })

        addEventListener("reward_points", ({Scores}) => {
            
        })

        addEventListener("game_paused", ({Player}) => {
            
        })

        addEventListener("game_resumed", ({Player}) => {
            
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

    const testSocket = () => {
        send("test", { message: "Hello from RN!" });
    };

    async function nextQuestion(cq) {
        // Push the old question into history exactly once
        loadQuestion()
    }

    // Functions
    function onBuzz() {
        // Can't buzz when there is already an interruption
        console.log("Buzzer:", buzzer, questionState)
        if(buzzer || questionState == "dead") return;
        console.log("Sending buzz")
        send("buzz", {BuzzTimestamp: Date.now()})
    }

    function onTyping(text) {
        send("typing", {content: text})
    }

    function onSubmit() {
        clearInterval(typingEmitInterval)
        setQuestionState("resume")
        setBuzzer(null)
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
                if(prev[0]?.id === event.id) return prev;
                event.eventType = "question";
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



    return (
        <SidebarLayout style={styles.sidebar}>
            <View style={styles.container}>
                <View style={styles.gameContent}>
                    <AnswerInput
                        onChange={handleInputChange}
                        onSubmit={onSubmit}
                        disabled={!(buzzer && buzzer?.current?.id == MY_ID)}
                    ></AnswerInput>

                    <ScrollView contentContainerStyle={styles.questions}>
                    {
                        allEvents.map((e, i) => {
                            switch(e?.eventType) {
                                case "question":
                                    return (
                                        <Question
                                            question={e}
                                            onInterruptOver={i == 0 ? handleInterruptOver : null}
                                            onFinish={i == 0 ? handleQuestionFinish : null}
                                            onDeath={i == 0 ? handleQuestionDeath : null}
                                            state={i == 0 ? questionState : "dead" }
                                            setState={setQuestionState}
                                            minimized={i !== 0}
                                            style={styles.question}
                                            key={e.id}
                                        />
                                    )
                                case "interrupt":
                                    return (
                                        <Interrupt event={e} key={i}/>
                                    )
                                case "player_joined":
                                    return (
                                        <PlayerJoined event={e} key={i}/>
                                    )
                                default:

                            }

                        })
                    }
                    </ScrollView>


                    {/* <View style={styles.previousQuestions}>
                    {
                        pastQuestions.slice(1).map((q, i) => 
                            <Question question={q} key={i} minimize={true} style={styles.questions}/>
                        )
                    }
                    </View> */}
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
    liveQuestion: {
        height: 300
    },
    questions: {
        marginTop: 10,
        gap: 10,
    },
    previousQuestions: {
        flexDirection: "column",
        gap: 10
    },
    question: {
        width: "100%"
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