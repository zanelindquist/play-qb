import React, { useEffect, useState, useRef } from "react";
import {
    View,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Dimensions,
    ScrollView,
    Image,
    Text,
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
} from "react-native-paper";
import {
    useRouter,
    useGlobalSearchParams,
    useLocalSearchParams,
    usePathname,
} from "expo-router";
import theme from "../../assets/themes/theme";
import GlassyView from "../custom/GlassyView";
import ExpandableView from "../custom/ExpandableView";
import Answers from "./Answers";
import { capitalize } from "../../utils/text";
import ustyles from "../../assets/styles/ustyles";

const LEVELS = [
    "Pop Culture",
    "Middle School",
    "Easy High School",
    "Regular High School",
    "Hard High School",
    "National High School",
    "● / Easy College", 
    "●● / Medium College", 
    "●●● / Regionals College",
    "●●●● / Nationals College",
    "Open",
    "All"              
]

const collapsedHeight = 40;
const TICK_MS = 16; // 60 FPS

const Question = ({
    question,
    timestamp,
    state = "dead",
    onInterruptOver,
    onFinish,
    onDeath,
    onCharChange,
    speed = 400,
    style,
    rightIcon,
    onSave = null,
    saveIcon,
    MS_UNTIL_DEAD = 6000,
    // Speed in WPM
    ANSWER_MS = 5000,
    EXPANDED_HEIGHT=500,
}) => {
    // Text variables
    const fullText = question.question || "";
    const [charIndex, setCharIndex] = useState(0);
    const [interruptIndexes, setInterruptIndexes] = useState([]);

    // Animation
    const [isMinimized, setIsMinimized] = useState(false);
    const [expandedHeight, setExpandedHeight] = useState(EXPANDED_HEIGHT);

    const frameRef = useRef(null);
    const lastTimeRef = useRef(performance.now());
    const charAccumulatorRef = useRef(0);

    // Gamestate and buzz variables
    const stateRef = useRef(state);
    const [isFinished, setIsFinished] = useState(false);
    const [isDead, setIsDead] = useState(false);
    const [msLeft, setMsLeft] = useState(0);
    const [remainingWaitTime, setRemainingWaitTime] = useState(MS_UNTIL_DEAD)

    // Reading constants
    const charsPerMinute = speed * 5;
    const msPerChar = 60_000 / charsPerMinute; // ms per char

    // Status bar
    const [barWidth, setBarWidth] = useState(1);

    // Other
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        // Set the state ref for some parts of the program to use instantaneously in a useEffect
        stateRef.current = state;
        
        // If the state is set to running, we want to pre-emptively set the ms left for the buzz as ANSWER_MS too.
        if (state === "running" || state === "interupted") {
            setMsLeft(ANSWER_MS);
        } else if (state === "interrupted") {
            // Add an interrupt
            setInterruptIndexes((prev) => {
                // Make sure there are no duplicates
                if(charIndex === prev[prev.length - 1]) return prev;
                return [...prev, charIndex]
            })

            setMsLeft(ANSWER_MS);
        }
        else if (state === "waiting") {
            setMsLeft(remainingWaitTime);
        } else if (state === "dead") {
            setCharIndex(fullText.length)
        }
    }, [state]);

    useEffect(() => {
        const loop = (now) => {
            const delta = now - lastTimeRef.current;
            lastTimeRef.current = now;

            const currentState = stateRef.current;

            if (currentState === "interrupted") {
                setMsLeft((prev) => {
                    const next = Math.max(prev - delta, 0);
                    if (next === 0)
                        onInterruptOver?.(charIndex < fullText.length);
                    return next;
                });
            } else if (currentState === "waiting") {
                setMsLeft((prev) => {
                    const next = Math.max(prev - delta, 0);
                    if (next === 0) {
                        setIsDead(true);
                        onDeath?.();
                    }
                    // Update the remaining wait time because we want to save this amount for multiple buzzes
                    setRemainingWaitTime(next)
                    return next;
                });
            } else if (currentState === "running") {
                charAccumulatorRef.current += delta;
                while (charAccumulatorRef.current >= msPerChar) {
                    charAccumulatorRef.current -= msPerChar;

                    setCharIndex((prev) => {
                        const next = prev + 1;
                        onCharChange?.(next);
                        if (next >= fullText.length) {
                            setIsFinished(true);
                            onFinish?.();
                            return prev;
                        }
                        return next;
                    });
                }
            }

            frameRef.current = requestAnimationFrame(loop);
        };

        frameRef.current = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(frameRef.current);
    }, []);

    useEffect(() => {
        setIsMinimized(!question.expanded);
    }, [question]);

    function handleAnimationFinish(expanded) {
        if (!expanded) setIsMinimized(true);
    }

    function handleDeadPressed() {
        if (state !== "dead") return;
        setIsMinimized(!isMinimized);
        handleAnswerCollapsed();
    }

    function handleAnswerExpanded(answerHeight) {
        setExpandedHeight(expandedHeight + answerHeight);
    }

    function handleAnswerCollapsed() {
        setExpandedHeight(EXPANDED_HEIGHT);
    }

    function handleSave() {
        onSave(question.hash);
        setIsSaved(true);
    }

    // TODO: Fix expanding answer errors

    return (
        <ExpandableView
            expanded={question.expanded || (state == "dead" && !isMinimized)}
            style={[styles.expandable, style]}
            maxHeight={expandedHeight}
            onAnimationFinish={handleAnimationFinish}
        >
            {!isMinimized ? (
                <GlassyView
                    style={[styles.container, { height: expandedHeight }]}
                    onPress={handleDeadPressed}
                >
                    <View style={styles.top}>
                        <View style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBar,
                                    {
                                        width:
                                            (state === "running"
                                                ? 1 -
                                                  charIndex / fullText.length
                                                : state === "waiting"
                                                  ? msLeft / MS_UNTIL_DEAD
                                                  : state === "interrupted"
                                                    ? msLeft / ANSWER_MS
                                                    : 1) *
                                                100 +
                                            "%",
                                        backgroundColor:
                                            state === "running"
                                                ? theme.static.lightblue
                                                : state === "waiting"
                                                  ? theme.static.red
                                                  : state === "interrupted"
                                                    ? theme.primary
                                                    : "transparent",
                                    },
                                ]}
                            />
                        </View>
                        <View style={ustyles.flex.flexRowSpaceBetween}>
                            <HelperText>
                                {LEVELS[question.level]} {">"}{" "}
                                {question.tournament} {">"}{" "}
                                {capitalize(question.category)}
                            </HelperText>
                            {onSave && (
                                <IconButton
                                    icon={
                                        isSaved
                                            ? "check"
                                            : saveIcon || "bookmark"
                                    }
                                    style={{
                                        backgroundColor: isSaved
                                            ? theme.static.prompt
                                            : theme.surface,
                                    }}
                                    size={20}
                                    onPress={handleSave}
                                    disabled={isSaved}
                                />
                            )}
                        </View>
                        <View>
                            <HelperText style={styles.questionText}>
                                {interruptIndexes.map((char, i) => {
                                    const start = interruptIndexes[i - 1] || 0;
                                    const end = char;

                                    return (
                                        <Text key={i}>
                                            {fullText.slice(start, end)}
                                            <InterrupIcon />
                                        </Text>
                                    );
                                })}

                                {fullText.slice(
                                    interruptIndexes[
                                        interruptIndexes.length - 1
                                    ] || 0,
                                    charIndex,
                                )}
                            </HelperText>
                        </View>
                    </View>

                    <View style={styles.bottom}>
                        {
                            state !== "dead" &&
                            <HelperText>
                                {state === "running"
                                    ? (
                                        ((fullText.length - charIndex) *
                                            msPerChar) /
                                        1000
                                    ).toFixed(1)
                                    : (msLeft / 1000).toFixed(1)}
                                s
                            </HelperText>
                        }
                        {/* <HelperText>{question.answers.main}</HelperText> */}
                        {state == "dead" && (
                            <Answers
                                answers={question.answers}
                                style={styles.answerComponent}
                                onExpand={handleAnswerExpanded}
                                onCollapse={handleAnswerCollapsed}
                                rightIcon={rightIcon}
                            />
                        )}
                    </View>
                </GlassyView>
            ) : (
                <GlassyView
                    style={styles.collapsedBar}
                    onPress={handleDeadPressed}
                >
                    <HelperText
                        numberOfLines={1}
                        style={[ustyles.text.shadowText, styles.questionInfo]}
                    >
                        {LEVELS[question.level]} {">"} {question.tournament}{" "}
                        {">"} {capitalize(question.category)}
                    </HelperText>
                    <View style={styles.right}>
                        <HelperText
                            style={[styles.answer, ustyles.text.shadowText]}
                            numberOfLines={1}
                        >
                            {question.answers.main}
                        </HelperText>
                        {rightIcon}
                    </View>
                </GlassyView>
            )}
        </ExpandableView>
    );
};

const InterrupIcon = ({}) => {
    return (
        <View style={iiStyles.container}>
            <Icon source={"bell"} size={"0.8rem"} />
        </View>
    );
};

const iiStyles = StyleSheet.create({
    container: {
        padding: 2,
        marginHorizontal: 5,
        backgroundColor: theme.static.early,
        borderRadius: 3,
    },
});

const styles = StyleSheet.create({
    // Minimized
    collapsedBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginHorizontal: 1,
        borderRadius: 10,
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 10,
        flex: 2,
        minWidth: 0
    },
    questionInfo: {
        flex: 1
    },
    answerComponent: {
        // backgroundColor: "blue"
    },
    answer: {
        fontSize: 17,
        fontWeight: "bold",
        minWidth: 0
    },

    // Maximized
    expandable: {},
    container: {
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: 10,
    },
    questionText: {
        fontSize: 17,
        // TODO: Add an outline or something so that you can see the text over the background image better
        color: theme.onbackground,
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    progressBar: {
        backgroundColor: theme.static.lightblue,
        height: 10,
        borderRadius: 999,
    },
});

export default Question;
