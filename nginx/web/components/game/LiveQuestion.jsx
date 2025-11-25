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
import theme from '../../assets/themes/theme';

const LiveQuestion = ({ question, speed = 400, interrupter, deadMS = 6000, onFinish }) => {
    const fullText = question.question || "";
    const [charIndex, setCharIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false)
    const [isDead, setIsDead] = useState(false)
    const [MsDead, setMsDead] = useState(deadMS)

    // Approximate characters per minute from WPM:
    // Average English word ≈ 5 characters
    const charsPerMinute = speed * 6;
    const delay = 60000 / charsPerMinute; // ms per char

    useEffect(() => {
        if (!fullText) return;

        setCharIndex(0); // reset on new question
        setIsFinished(false)
        setIsDead(false)
        setMsDead(deadMS)
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
                setMsDead(deadMS);
                clearInterval(interval);
            }
        }, delay);

        return () => clearInterval(interval);
    }, [question, speed, interrupter]);

    useEffect(() => {
        if (!isFinished) return;   // do not start until finished

        const delay = 10;

        const id = setInterval(() => {
            setMsDead((prev) => {
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

    return (
        <View style={styles.container}>
            {/* Spoken / typed text */}
            <View>
                <View style={styles.progressBarContainer}>
                    <View
                        style={
                            [styles.progressBar,
                            {width: (1 - charIndex / fullText.length) * 100 + "%"},
                            isFinished && {width: (MsDead / deadMS) * 100 + "%", backgroundColor: theme.static.red}
                        ]}
                    ></View>
                </View>
                <View style={styles.questionTopline}>
                    <HelperText>{question.tournament}</HelperText>
                </View>
                <HelperText style={styles.questionText}>
                    {fullText.slice(0, charIndex)}
                </HelperText>
                {
                    isDead && <HelperText style={styles.answer}>{question.answers}</HelperText>
                }
            </View>


            {/* Progress */}
            <HelperText>
                {
                    isFinished ?
                    (MsDead / 1000).toFixed(1)
                    :
                    ((1 - charIndex / fullText.length) * fullText.length * charsPerMinute / 60_000).toFixed(1)
                }s
            </HelperText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.background,
        borderRadius: 10,
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


export default LiveQuestion;