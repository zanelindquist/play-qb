// React native components
import { Platform, View, ScrollView, StyleSheet, Pressable, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton, Button } from "react-native-paper";

// Hooks
import theme from "../../assets/themes/theme";
import ustyles from "../../assets/styles/ustyles";
import { useState, useRef, useEffect } from "react";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";
import { router } from "expo-router";

// Custom components
import ExpandableView from "../custom/ExpandableView";
import GlassyView from "../custom/GlassyView";
import GlassyButton from "../custom/GlassyButton";

const RANK_INFO = [
    { rank_code: 0,  name: "Dirt I", rr: 0 },
    { rank_code: 1,  name: "Dirt II", rr: 100 },
    { rank_code: 2,  name: "Dirt III", rr: 200 },

    { rank_code: 3,  name: "Plastic I", rr: 700 },
    { rank_code: 4,  name: "Plastic II", rr: 800 },
    { rank_code: 5,  name: "Plastic III", rr: 900 },

    { rank_code: 6,  name: "Tin I", rr: 1000 },
    { rank_code: 7,  name: "Tin II", rr: 1100 },
    { rank_code: 8,  name: "Tin III", rr: 1200 },

    { rank_code: 9,  name: "Bronze I", rr: 1300 },
    { rank_code: 10, name: "Bronze II", rr: 1400 },
    { rank_code: 11, name: "Bronze III", rr: 1500 },

    { rank_code: 12, name: "Silver I", rr: 1600 },
    { rank_code: 13, name: "Silver II", rr: 1700 },
    { rank_code: 14, name: "Silver III", rr: 1800 },

    { rank_code: 15, name: "Gold I", rr: 1900 },
    { rank_code: 16, name: "Gold II", rr: 2000 },
    { rank_code: 17, name: "Gold III", rr: 2100 },

    { rank_code: 18, name: "Diamond I", rr: 2200 },
    { rank_code: 19, name: "Diamond II", rr: 2300 },
    { rank_code: 20, name: "Diamond III", rr: 2400 },

    { rank_code: 21, name: "Immortal I", rr: 2500 },
    { rank_code: 22, name: "Immortal II", rr: 2600 },
    { rank_code: 23, name: "Immortal III", rr: 2700 }
]

export default function RankedProgressBar ({
    rankInfo,
    style
}) {
    if (!rankInfo) return
    
    // Rank info
    const [rank, setRank] = useState(RANK_INFO[rankInfo.rank.rank_code])
    const [nextRank, setNextRank] = useState(RANK_INFO[rankInfo.rank.rank_code + 1 < RANK_INFO.length ? rankInfo.rank.rank_code + 1 : RANK_INFO.length - 1]) // Handle for being Imo III

    const [rrBetweenRanks, setRRBetweenRanks] =  useState(nextRank?.rr - rank?.rr)

    // Refs
    const barScale = useRef(new Animated.Value(0)).current
    const widthRef = useRef()

    useEffect(() => {
        const newRank = RANK_INFO[rankInfo.rank.rank_code]
        const newNextRank = RANK_INFO[rankInfo.rank.rank_code + 1 < RANK_INFO.length ? rankInfo.rank.rank_code + 1 : RANK_INFO.length - 1]

        if(rank.name !== newRank.name) {
            console.log("YOU RANKED UP!")
            setRank(newRank)
            setNextRank(newNextRank)
        }

        const targetScale = (rankInfo.rank.residual_rr) / rrBetweenRanks

        Animated.timing(barScale, {
            toValue: targetScale,
            duration: 400,
            useNativeDriver: true, // Can keep this true
        }).start()
    }, [rankInfo])

    return (
        <View style={[styles.container, style]}>
            <View style={styles.minRank}>
                <HelperText style={styles.rankText}>{rank.name}</HelperText>
            </View>
            <View
                style={styles.barContainer}
                onLayout={(e) => {
                    widthRef.current = e.nativeEvent.layout.width
                }}
            >
                <Animated.View style={[
                    styles.bar,
                    {
                        width: widthRef.current || '100%', // Set max width
                        transform: [
                            { scaleX: barScale },
                            // { translateX: barScale.interpolate({
                            //     inputRange: [0, 1],
                            //     outputRange: [-(widthRef.current || 0) / 2, 0]
                            // })}
                        ],
                        transformOrigin: 'left' // Not supported, handled by translateX above
                    }
                ]}>
                    <View style={[
                        styles.diffBar,
                        {
                            width: `${Math.abs(rankInfo.rank_change.rr_diff) / rrBetweenRanks * 100}%`,
                            right: rankInfo.rank_change.rr_diff < 0 ? `${rankInfo.rank_change.rr_diff / rrBetweenRanks * 100}%` : 0,
                            backgroundColor: rankInfo.rank_change.rr_diff > 0 ? theme.static.correct : theme.error
                        }
                    ]}></View>
                </Animated.View>

            </View>
            <View style={styles.maxRank}>
                <HelperText style={styles.rankText}>{nextRank.name}</HelperText>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center" // Changed from baseline to center
    },
    rankText: {

    },
    barContainer: {
        position: "relative",
        zIndex: 0,
        flexGrow: 1,
        height: 10, // Add explicit height
        backgroundColor: theme.elevation.level5,
        borderRadius: 999,
        overflow: 'hidden' // Add this to clip the bar within bounds
    },
    diffBar: {
        position: "absolute",
        right: 0,
        zIndex: 2,
        height: 10,
        borderRadius: 999
    },
    bar: {
        position: 'absolute', // Change to absolute
        left: 0, // Pin to left
        top: 0, // Pin to top
        zIndex: 1,
        height: 10,
        backgroundColor: theme.primary,
        borderRadius: 999
    }
})