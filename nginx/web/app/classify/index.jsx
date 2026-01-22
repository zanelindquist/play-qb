import { getProtectedRoute, postProtectedRoute , handleExpiredAccessToken } from "@/utils/requests.jsx"

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
import { useAlert } from "@/utils/alerts.jsx";

import SidebarLayout from "../../components/navigation/SidebarLayout.jsx";
import GlassyView from "../../components/custom/GlassyView.jsx";
import theme from "@/assets/themes/theme.js";
import { useBanner } from "../../utils/banners.jsx";

const CATEGORIES = [
    "science",
    "history",
    "literature",
    "social science",
    "philosophy",
    "religion",
    "mythology",
    "geography",
    "current events",
    "fine arts"
]
 
export default function Classify() {
    // Hooks
    const {showBanner} = useBanner()

    // Variables
    const [question, setQuestion] = useState(null)
    const [questionMS, setQuestionMS] = useState(0)
    const [hasSet, setHasSet] = useState(false)
    const [count, setCount] = useState(0)

    useEffect(() => {
        loadQuestion()
    }, [])


    function loadQuestion() {
        getProtectedRoute("/classify_next")
        .then((response) => {
            setHasSet(false)
            setQuestion(response.data)
            setQuestionMS(Date.now())
        })
        .catch((error) => {
            showBanner(error.message)
        })
    }

    function submitQuestion(hash, category) {
        if(!hash) return
        postProtectedRoute("/classify_question", {hash, category})
        .then((result) => {
            setHasSet(true)
            setCount(result.data.count)
            console.log("Question set!")
            loadQuestion()
        })
        .catch((error) => {
            showBanner(error.message)
        })
    }

    return (
        <SidebarLayout>
            <View style={styles.container}>
                {
                    <View style={styles.categories}>
                        <HelperText>{count}</HelperText>
                        <Button onPress={loadQuestion} mode="contained">Skip</Button>
                    </View>
                }
                <GlassyView
                    gradient={
                        hasSet && {
                            colors: theme.gradients.readyTint,
                            start: { x: 1, y: 0 },
                            end: { x: 1, y: 1 },
                        }
                    }
                >
                    <HelperText style={styles.question}>{question?.question}</HelperText>
                    <HelperText style={styles.answer}>{question?.answers.main}</HelperText>
                    <View style={styles.categories}>
                    {
                        CATEGORIES.map((c) => 
                            <HelperText
                                style={styles.category}
                                onPress={() => submitQuestion(question.hash, c)}
                            >
                                {c}
                            </HelperText>
                        )
                    }
                    </View>
                </GlassyView>
                {
                    hasSet &&
                    <IconButton
                        icon={"check"}
                        size={40}
                        style={{backgroundColor: "green"}}
                    />
                }
            </View>
        </SidebarLayout>
    );
}


const styles = StyleSheet.create({
    container: {
        flexDirection: "column",
        gap: 20,
        maxWidth: 1100,
        padding: 20
    },
    question: {
        fontSize: 16,
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    answer: {
        fontSize: 20,
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    categories: {
        margin: 10,
        flexDirection: "row",
        gap: 10,
        justifyContent: "space-between",
        flexWrap: "wrap"
    },
    category: {
        fontSize: 20,
        width: "23%",
        color: theme.onSurface,
        backgroundColor: theme.surface,
        padding: 20,
        borderRadius: 5
    }
})