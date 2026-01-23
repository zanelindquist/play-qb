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
import { capitalize } from "../../utils/text.js";

const CATEGORIES = [
    "all",
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
    const [limit, setLimit] = useState(20)
    const [savedType, setSavedType] = useState("all")
    const [category, setCategory] = useState("all")
    const [nextOffset, setNextOffset] = useState(20)
    const [totalQueryLength, setTotalQueryLength] = useState(0)

    useEffect(() => {
        loadStats()
    }, [offset, limit, savedType, category])


    function loadStats() {
        postProtectedRoute("/saved", {
            offset: offset,
            limit: limit,
            saved_type: savedType,
            category: category
        })
        .then((response) => {
            console.log(response.data)
            setQuestions(response.data.questions)
            setNextOffset(response.data.next_offset)
            setTotalQueryLength(response.data.total_length)
            setIsLoading(false)
        })
        .catch((error) => {
            showBanner(error.message)
        })
    }

    function handleSavedTypeChange(event) {
        const type = event.value.title.toLowerCase()
        setSavedType(type)
    }

    function handleCategoryChange(event) {
        const category = event.value.title.toLowerCase()
        setCategory(category)
    }

    function handlePaginate(offsetParam) {
        setOffset(offsetParam)
    }

    return (
        <SidebarLayout>
            <View style={styles.container}>
                <GlassyView style={styles.pannel}>
                    <View style={styles.left}>
                        <GameRule
                            label={"Saved Type"}
                            mode="dropdown"
                            options={[
                                {"title": "All", icon: "circle"},
                                {"title": "Missed", icon: "close"},
                                {"title": "Correct", icon: "check"},
                                {"title": "Saved", icon: "bookmark"}
                            ]}
                            dataName={"saved_type"}
                            onChange={handleSavedTypeChange}
                            style={styles.saveType}    
                        />
                        <GameRule
                            label={"Category"}
                            mode="dropdown"
                            options={
                                CATEGORIES.map((c)=> {return {title: capitalize(c)}})
                            }
                            dataName={"saved_type"}
                            onChange={handleCategoryChange}
                            style={styles.saveType}    
                        />
                    </View>
                    <View style={styles.right}>
                        <HelperText style={styles.question}>{Math.ceil(totalQueryLength / limit)} page{Math.ceil(totalQueryLength / limit) > 1 && "s"}</HelperText>
                        <PaginationNavigator
                            startOffset={offset}
                            limit={limit}
                            endIndex={totalQueryLength}
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
                                    icon={q.saved_type == "correct" ? "check" : (q.saved_type == "missed" ? "close" : "bookmark")}
                                    style={[
                                        styles.icon,
                                        {backgroundColor: q.saved_type == "correct" ? theme.static.correct : (q.saved_type == "missed" ? theme.static.wrong : theme.static.prompt)}
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
        marginBottom: 40
    },
    pannel: {
        margin: 10,
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    left: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 20
    },
    right: {
        flexDirection: "row",
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
})