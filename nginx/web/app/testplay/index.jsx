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
import { Button, HelperText, Menu, Title, IconButton, Icon, ActivityIndicator, Avatar, Card } from 'react-native-paper';
import { useRouter, useGlobalSearchParams, useLocalSearchParams, usePathname } from 'expo-router';
import { useAlert } from "../../utils/alerts.jsx";
import SidebarLayout from "../../components/navigation/SidebarLayout.jsx";
import LiveQuestion from "../../components/game/LiveQuestion.jsx";

const { width } = Dimensions.get('window');

const TestPlay = () => {
    const [data, setData] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionList, setQuestionList] = useState([]);
    const {showAlert} = useAlert();

    useEffect(() => {
        getProtectedRoute("/testplay")
        .then((response)=> {
            setData(response.data)
        })
        .catch((error)=> {
            // showAlert("There was an error: ", error)
        })


        // Handle key presses
        function handleKeyDown(e) {
            console.log(e.code)
            switch(e.code) {
                case "Space":
                    
                    e.preventDefault()
                break;
                case "KeyJ":
                    nextQuestion();
                break;
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [])

    function nextQuestion() {
        setQuestionList((questions) => [...questions, currentQuestion])

        getProtectedRoute("/random_question")
        .then((response)=> {
            setCurrentQuestion(response.data)
        })
        .catch((error)=> {
            showAlert("There was an error: ", error)
        })
    }

    return (
        <SidebarLayout style={styles.sidebar}>
        <View style={styles.container}>
            <View style={styles.questionContainer}>
                {
                    currentQuestion ?
                    <LiveQuestion question={currentQuestion}/>
                    :
                    <HelperText>Hit next to begin</HelperText>
                }
                {/* <PastQuestions></PastQuestions> */}
            </View>
            <View style={styles.optionsContainer}>
                <View style={styles.scorebox}>

                </View>
                <Button mode="contained" onPress={nextQuestion}>Next</Button>
                
            </View>

        </View>

        </SidebarLayout>
    )
}

const styles = StyleSheet.create({
    sidebar: {
        display: "flex",
        alignItems: "baseline"
    },
    container: {
        display: "flex",
        flexDirection: "row",
        alignItems: "space-between",
        justifyContent: "space-between",
        flexGrow: 1,
        position: "relative",
        width: "100%",
        gap: 10
    },
    questionContainer: {
        flexGrow: 1,
        width: "80%"
    },
    optionsContainer: {
        flexShrink: 1,
        position: "relative",
        right: 0
    }
})

export default TestPlay;