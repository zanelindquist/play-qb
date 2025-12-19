import React, { useEffect, useState, useRef } from "react";
import {
    View,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Dimensions,
    ScrollView,
    Image,
    Text
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

const collapsedHeight = 40;
const expandedHeight = 400;


const Question = ({
    question,
    timestamp,
    state="dead",
    setState,
    onInterruptOver,
    onFinish,
    onDeath,
    style,
    minimized = false,
    MS_UNTIL_DEAD = 6000,
    // Speed in WPM
    SPEED = 400,
    MS_FOR_ANSWER = 5000,
}) => {
    // Text variables
    const fullText = question.question || "";
    const [charIndex, setCharIndex] = useState(0);
    const [interruptIndexes, setInterruptIndexes] = useState([]);

    // Animation
    const [firstRenderForAnimation, setFirstRenderForAnimation] = useState(true)
    const [isMinimized, setIsMinimized] = useState(false)

    // Gamestate and buzz variables
    const [isFinished, setIsFinished] = useState(false);
    const [isDead, setIsDead] = useState(false);
    const [msLeft, setMsLeft] = useState(0)
    const [msLeftInWaiting, setMsLeftInWaiting] = useState(MS_UNTIL_DEAD)

    // Reading constants
    const charsPerMinute = SPEED * 6;
    const msPerChar = 60_000 / charsPerMinute; // ms per char

    // Status bar
    const [reRenderStatusBar, setReRenderStatusBar] = useState(0);

    // When the state changes
    useEffect(() => {
        if (state == "interrupted") {
            setInterruptIndexes((prev) => {
                // Make sure there are no duplicates
                if(charIndex === prev[prev.length - 1]) return prev;
                return [...prev, charIndex]
            })
            setMsLeft(MS_FOR_ANSWER)
            const interval = setInterval(() => {
                setMsLeft((prev) => {
                    if (prev <= 0) {
                        // If there is still more to read
                        if (onInterruptOver) onInterruptOver(charIndex < fullText.length)
                        clearInterval(interval);
                        return 0;
                    }

                    return prev - 10;
                })
            }, 10);

            // Clear interval after enough time has passed
            return () => clearInterval(interval);

        } 
        else if (state == "running") {
            let currentIndex = charIndex;

            // Calculate how many chars we need since the timestamp on the quesiton
            const diff = Date.now() - timestamp
            currentIndex += Math.ceil(diff / msPerChar)
            const interval = setInterval(() => {
                if (state == "running") {
                    currentIndex += 1;
                    setCharIndex(currentIndex);

                    if (currentIndex >= fullText.length) {
                        setIsFinished(true);
                        if (onFinish) onFinish();
                        clearInterval(interval);
                    }
                }
            }, msPerChar);
            return () => clearInterval(interval);
        }
        else if (state == "waiting") {
            setMsLeft(msLeftInWaiting)

            const interval = setInterval(() => {
                setMsLeftInWaiting((prev) => {
                    if (prev <= 0) {
                        if (onDeath) onDeath();
                        setIsDead(true);
                        clearInterval(interval);
                        return 0;
                    }

                    setMsLeft(prev - 10)

                    return prev - 10;
                });
            }, 10);

            return () => clearInterval(interval);
        }
        else if (state == "dead") {
            setCharIndex(fullText.length)
        }
        else if (state == "resume") {
            if(!setState) return;
            if(charIndex < fullText.length) setState("running")
            else if (msLeftInWaiting > 0) {
                console.log("QUESTION SETTING TO WAITING")
                setState("waiting")
            }
            else setState("dead")
        }
        else {
            throw Error("<Question>: unknown state passed")
        }
    }, [state]);

    // Rerender the status bar
    useEffect(() => {
        setReRenderStatusBar((prev) => prev + 1)
    }, [msLeft, charIndex])

    useEffect(() => {
        setIsMinimized(!question.expanded)
    }, [question])


    function handleAnimationFinish(expanded) {
        if(!expanded) setIsMinimized(true)
    }

    function handleDeadPressed() {
        if(state !== "dead") return;
        setIsMinimized(!isMinimized)
    }

    function capitalize(text) {
        if(!text) return "Undefined"
        return text.split("")[0].toUpperCase() + text.split("").slice(1).join("")
    }

    return (
        <ExpandableView
            expanded={ question.expanded || (state == "dead" && !isMinimized)}
            style={styles.expandable}
            maxHeight={expandedHeight}
            onAnimationFinish={handleAnimationFinish}
        >
        {
        !isMinimized ?
        <GlassyView
            style={styles.container}
            onPress={handleDeadPressed}
        >
            <View style={styles.top}>
                <View style={styles.progressBarContainer}>
                    <View
                        style={[
                            styles.progressBar,
                            state === "running"
                            ? {
                                width: `${(1 - charIndex / fullText.length) * 100}%`,
                                backgroundColor: theme.static.lightblue,
                            }
                            : state === "waiting"
                            ? {
                                width: `${(msLeft / MS_UNTIL_DEAD) * 100}%`,
                                backgroundColor: theme.static.red,
                            }
                            : state === "interrupted"
                            ? {
                                width: `${(msLeft / MS_FOR_ANSWER) * 100}%`,
                                backgroundColor: theme.primary,
                            }
                            : {
                                width: 0,
                                backgroundColor: "black",
                            }
                        ]}
                    />
                </View>

                <View style={styles.questionTopline}>
                    <HelperText>{question.tournament} {">"} {capitalize(question.category)}</HelperText>
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
                        interruptIndexes[interruptIndexes.length - 1] || 0,
                        charIndex
                        )}
                    </HelperText>
                </View>
            </View>

            <View style={styles.bottom}>
                <HelperText>
                    {
                        state == "running" ?
                        ((1 - charIndex / fullText.length) * fullText.length * charsPerMinute / 60_000).toFixed(1)                                
                        : (msLeft / 1000).toFixed(1)
                    }
                    s
                </HelperText>
                {
                    state == "dead" &&
                    (
                        <HelperText style={styles.answer}>
                            {question.answers}
                        </HelperText>
                    )
                } 
            </View>
        </GlassyView> :
        <GlassyView
            style={styles.collapsedBar}
            onPress={handleDeadPressed}
        >
            <HelperText numberOfLines={1}>{question.tournament}</HelperText>
            <HelperText style={styles.answer} numberOfLines={1}>
                {question.answers}
            </HelperText>
        </GlassyView>
        }
        </ExpandableView>
    );
};

const InterrupIcon = ({}) => {

    return (
        <View style={iiStyles.container}>
            <Icon
                source={"bell"}
                size={"0.8rem"}
            />
        </View>
    )
}

const iiStyles = StyleSheet.create({
    container: {
        padding: 2,
        marginHorizontal: 5,
        backgroundColor: theme.static.early,
        borderRadius: 3,
    }
})

const styles = StyleSheet.create({
    // Minimized
    collapsedBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginHorizontal: 1,
        borderRadius: 10
    },
    tournament: {

    },
    answer: {
        fontSize: 17,
        fontWeight: "bold",
    },

    // Maximized
    expandable: {
        flexGrow: 1,
        height: "max"
    },
    container: {
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: 10,
        height: expandedHeight
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
