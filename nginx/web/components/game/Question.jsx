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
import { Button, HelperText, Menu, Title, IconButton, Icon, ActivityIndicator, Avatar, Card } from 'react-native-paper';
import { useRouter, useGlobalSearchParams, useLocalSearchParams, usePathname } from 'expo-router';
import theme from '../../assets/themes/theme';
import GlassyView from '../custom/GlassyView';

const collapsedHeight = 40;

const Question = ({ question, style, interrupter, onFinish, deadMS = 6000, speed = 1400, minimize }) => {
    const fullText = question.question || "";
    const [charIndex, setCharIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false)
    const [isDead, setIsDead] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [untilDead, setUntilDead] = useState(deadMS)

    const animatedHeight = useRef(new Animated.Value(200)).current;

    // Approximate characters per minute from WPM:
    // Average English word ≈ 5 characters
    const charsPerMinute = speed * 6;
    const delay = 60000 / charsPerMinute; // ms per char

    useEffect(() => {
        if (!fullText) return;

        setCharIndex(0); // reset on new question
        setIsFinished(false)
        setIsDead(false)
        setUntilDead(deadMS)
        let currentIndex = 0;

        const interval = setInterval(() => {
            if (interrupter?.current) {
                clearInterval(interval);
                return;
            }

            currentIndex += 1;
            setCharIndex(currentIndex);

            if (currentIndex >= fullText.length) {
                setIsFinished(true)
                if (onFinish) onFinish();
                setUntilDead(deadMS);
                clearInterval(interval);
            }
        }, delay);

        return () => clearInterval(interval);
    }, [question, speed, interrupter]);

    useEffect(() => {
        if (!isFinished) return;   // do not start until finished

        const delay = 10;

        const id = setInterval(() => {
            setUntilDead((prev) => {
                if (prev <= 0 || interrupter?.current) {
                    setIsDead(true);
                    clearInterval(id);
                    return 0;
                }
                return prev - delay;
            });
        }, delay);

        return () => clearInterval(id);
    }, [isFinished]);

    useEffect(() => {
        if(minimize) {
            setIsMinimized(true)
            setIsDead(true)
            setIsFinished(true)
            Animated.timing(animatedHeight, {
                toValue: collapsedHeight,
                duration: 300,
                useNativeDriver: false, // cannot animate height with native driver
            }).start();
        }
    }, [minimize]);

    if(isMinimized) {
        return (
            <GlassyView style={styles.collapsedBar}>
                <HelperText numberOfLines={1}>{question.tournament}</HelperText>
                <HelperText style={styles.answer} numberOfLines={1}>{question.answers}</HelperText>
            </GlassyView>
        )
    }

    return (
        <GlassyView>
                    <Animated.View style={[styles.container, { height: animatedHeight }, style]}>
            
            {/* Show full question ONLY while not collapsed */}
            {!isMinimized && (
                <>
                    <View style={styles.progressBarContainer}>
                        <View style={[
                            styles.progressBar,
                            { width: (1 - charIndex / fullText.length) * 100 + "%" },
                            isFinished && {
                                width: (untilDead / deadMS) * 100 + "%",
                                backgroundColor: theme.static.red
                            }
                        ]} />
                    </View>

                    <View style={styles.questionTopline}>
                        <HelperText>{question.tournament}</HelperText>
                    </View>

                    <HelperText style={styles.questionText}>
                        {fullText.slice(0, charIndex)}
                    </HelperText>
                    <HelperText>
                        {isFinished
                            ? (untilDead / 1000).toFixed(1)
                            : ((1 - charIndex / fullText.length) *
                                fullText.length * charsPerMinute / 60000).toFixed(1)
                        }s
                    </HelperText>
                </>
            )}

            {
                !isMinimized && isDead &&
                <HelperText style={styles.answer}>{question.answers}</HelperText>
            }
        </Animated.View>
        </GlassyView>

    );

};

const styles = StyleSheet.create({
    container: {
        borderRadius: 10,
        // overflow: "hidden"
    },
    collapsedBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    questionTopline: {
        flexDirection: "row",
        alignContent: "space-between"

    },
    tournament: {

    },
    answer: {
        fontSize: 17,
        fontWeight: "bold"
    },
    questionText: {
        fontSize: 16,
        flexGrow: 1
    },
    progressBarContainer: {
        width: "100%"
    },
    progressBar: {
        backgroundColor: theme.static.lightblue,
        width: 500,
        height: 10,
        borderRadius: 999
    },

})


export default Question;