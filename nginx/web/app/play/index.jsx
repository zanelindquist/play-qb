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

const { width } = Dimensions.get('window');

const Play = () => {
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [pastQuestions, setPastQuestions] = useState([]);
    const [teardownCQ, setTeardownCQ] = useState(false)
    const {showAlert} = useAlert();
    const {send, addEventListener} = useSocket();

    let questions = []

    useEffect(() => {
        loadQuestion()

        // Handle key presses
        function handleKeyDown(e) {
            switch(e.code) {
                case "Space":
                    // Buzz logic

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

    const testSocket = () => {
        console.log("testing socket")
        send("test", { message: "Hello from RN!" });
    };

    function loadQuestion() {
        getProtectedRoute("/random_question")
        .then((response)=> {
            console.log(response.data)
            const cq = response.data;
            setPastQuestions((qs) => {
                // Avoid duplicates
                if (qs[0]?.id === cq.id) return qs;
                return [cq, ...qs];
            });
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


    return (
        <SidebarLayout style={styles.sidebar}>
            <View style={styles.container}>
                <View style={styles.questionContainer}>
                    {
                        currentQuestion ?
                        <Question question={currentQuestion} style={styles.liveQuestion} minimize={false}/>
                        :<HelperText>Hit next to begin</HelperText>
                    }
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