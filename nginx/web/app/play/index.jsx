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
import Question from "../../components/game/Question.jsx";
import GlassyButton from "../../components/custom/GlassyButton.jsx"
import PlayerScores from "../../components/game/PlayerScores.jsx";
import AnswerInput from "../../components/game/AnswerInput.jsx";

const { width } = Dimensions.get('window');

// TEMPORARY
const MY_ID = 1;
const ANSWER_MS = 5000;

const Play = () => {
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [pastQuestions, setPastQuestions] = useState([]);
    const [currentQuestionDead, setCurrentQuestionDead] = useState(false)
    const [teardownCQ, setTeardownCQ] = useState(false)
    const {showAlert} = useAlert();
    const {send, addEventListener} = useSocket();

    const [interrupter, setInterupter] = useState(false)
    const [input, setInput] = useState("")
    const [typingEmitInterval, setTypingEmitInterval] = useState(null)

    // Register keybinds
    useEffect(() => {
        loadQuestion()

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
                    nextQuestion(currentQuestion);
                break;
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [])

    // Register socket event listners
    useEffect(() => {
        addEventListener("player_joined", ({Player, GameState}) => {
            
        })

        addEventListener("question_interrupt", ({Player, AnswerContent}) => {
            console.log("interupt event!")
            setInterupter({current: {id: 1}})
            // If the player is me
            if(1 == MY_ID) {
                // Show the typing box
                
                // Show the buzz countdown in green

                
                // Emit typing events
                setTypingEmitInterval(setInterval(() => {
                    onTyping(input)
                }, 100))

                setTimeout(() => {
                    if(typingEmitInterval){
                        clearInterval(typingEmitInterval)    
                    }
                    
                    setInterupter(null)
                }, ANSWER_MS)
            } else {
                // Show the typing box, but it is disabled
            }
        })

        addEventListener("player_typing", ({Player, AnswerContent}) => {
            // If the player is me
            if(Player.id == MY_ID) {
                // Do nothing
            } else {
                // Update the typing box with the AnswerContent
            }
            
        })

        addEventListener("question_resume", ({Player, FinalAnswer, Scores, IsCorrect}) => {
            setInterupter(null)
        })

        addEventListener("next_question", ({Player, FinalAnswer, Scores, IsCorrect, Question}) => {
            setInterupter(null)
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
    }, [])

    const testSocket = () => {
        send("test", { message: "Hello from RN!" });
    };

    function loadQuestion() {
        getProtectedRoute("/random_question")
        .then((response)=> {
            const cq = response.data;
            setPastQuestions((qs) => {
                // Avoid duplicates
                if (qs[0]?.id === cq.id) return qs;
                return [cq, ...qs];
            });
            setCurrentQuestionDead(false)
            setCurrentQuestion(cq)
        })
        .catch((error)=> {
            console.error(error)
            showAlert("There was an error: " + error)
        })
    }

    async function nextQuestion(cq) {
        // Push the old question into history exactly once
        loadQuestion()
    }

    // Functions
    function onBuzz() {
        // Can't buzz when there is already an interruption
        console.log(interrupter)
        if(interrupter || currentQuestionDead) return;
        send("buzz", {BuzzTimestamp: Date.now()})
    }

    function onTyping() {

    }

    function onSubmit() {
        clearInterval(typingEmitInterval)
    }

    // I don't think I actually need this
    function onQuestionResume() {
        
    }

    function onGamePause() {

    }

    function onGameResume() {
        
    }

    function handleQuestionDeath() {
        setInterupter(null)
        setCurrentQuestionDead(true)
    }

    return (
        <SidebarLayout style={styles.sidebar}>
            <View style={styles.container}>
                <View style={styles.questionContainer}>
                    {
                        currentQuestion ?
                        <Question
                            question={currentQuestion}
                            style={styles.liveQuestion}
                            minimize={false}
                            interrupter={interrupter}
                            onDeath={handleQuestionDeath}
                        />
                        :<HelperText>Hit next to begin</HelperText>
                    }
                    <AnswerInput
                        onChange={(text) => setInput(text)}
                        onSubmit={onSubmit}
                        disabled={!(interrupter && interrupter?.current?.id == MY_ID)}
                    ></AnswerInput>
                    <View style={styles.previousQuestions}>
                    {
                        pastQuestions.slice(1).map((q, i) => 
                            <Question question={q} key={i} minimize={true} style={styles.questions}/>
                        )
                    }
                    </View>
                </View>
                <View style={styles.optionsContainer}>
                    <View style={styles.scorebox}>

                    </View>
                    <GlassyButton mode="filled" onPress={onBuzz}>Buzz</GlassyButton>
                    <GlassyButton mode="filled" onPress={() => nextQuestion(currentQuestion)}>Next</GlassyButton>
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
        // position: "relative",
        // width: 1100,
        width: "100%"
    },
    questionContainer: {
        flexGrow: 1,
        width: "80%",
        flexDirection: "column"
    },
    liveQuestion: {
        height: 300
    },
    previousQuestions: {
        marginTop: 10,
        flexDirection: "column",
        gap: 10
    },
    questions: {
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