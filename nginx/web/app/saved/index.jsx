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
import Question from "../../components/game/Question.jsx"
import theme from "@/assets/themes/theme.js";
import { useBanner } from "../../utils/banners.jsx";
import GameRule from "../../components/entities/GameRule.jsx";
import PaginationNavigator from "../../components/custom/PaginationNavigator.jsx";

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
 
export default function StatsPage() {
    // Hooks
    const {showBanner} = useBanner()

    // Variables
    const [questions, setQuestions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [offset, setOffset] = useState(0)
    const [limit, setLimit] = useState(2)
    const [nextOffset, setNextOffset] = useState(20)
    const [queryLength, setQueryLength] = useState(0)

    useEffect(() => {
        loadStats(1)
    }, [])


    function loadStats(offsetParam) {
        postProtectedRoute("/saved", {
            offset: offsetParam,
            limit: limit
            // category: "all"
        })
        .then((response) => {
            console.log(response.data)
            setQuestions(response.data.questions)
            setNextOffset(response.data.next_offset)
            setQueryLength(response.data.total_length)
            setIsLoading(false)
        })
        .catch((error) => {
            showBanner(error.message)
        })
    }

    function handleSavedTypeChange(event) {
        console.log(event)
        const type = event.value.title
    }

    function handlePaginate(offsetParam) {
        console.log(offsetParam)
        setOffset(offsetParam)
        loadStats(offsetParam)
    }

    return (
        <SidebarLayout >
            <View style={styles.container}>
                <GlassyView style={styles.pannel}>
                    <View style={styles.left}>
                        <GameRule 
                            label={"Saved Type"}
                            mode="dropdown"
                            options={[
                                {"title": "Wrong", icon: "close"},
                                {"title": "Correct", icon: "check"},
                                {"title": "Saved", icon: "bookmark"}
                            ]}
                            dataName={"save_type"}
                            onChange={handleSavedTypeChange}
                            style={styles.saveType}    
                        />
                    </View>
                    <View style={styles.right}>
                        <PaginationNavigator
                            startOffset={offset}
                            limit={limit}
                            endIndex={queryLength}
                            onOffsetChange={handlePaginate}
                        />
                    </View>
                </GlassyView>
                <View
                    style={styles.questions}
                >
                {
                    questions?.length > 0 &&
                    questions.map((q, i) => 
                        <Question
                            question={q}
                            key={i}
                            rightIcon={
                                <IconButton
                                    size={15}
                                    icon={q.save_type == "correct" ? "check" : (q.save_type == "missed" ? "close" : "bookmark")}
                                    style={[
                                        styles.icon,
                                        {backgroundColor: q.save_type == "correct" ? theme.static.correct : (q.save_type == "missed" ? theme.static.wrong : theme.static.prompt)}
                                    ]}    
                                />
                            }
                        />
                    )
                }
                </View>

            </View>
        </SidebarLayout>
    );
}


const styles = StyleSheet.create({
    container: {
        gap: 20,
        maxWidth: 1100,
        height: "80vh",
        padding: 20,
    },
    pannel: {
        margin: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    left: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    saveType: {
        marginVertical: 0,
        padding: 0
    },
    questionScroll: {

    },
    questions: {
        gap: 10,
    },
    question: {
        fontSize: 16,
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    icon: {
        margin: 0
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