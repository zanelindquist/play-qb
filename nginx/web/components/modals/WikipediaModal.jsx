import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
    Button,
    HelperText,
    Title,
    IconButton,
    Searchbar,
    Icon,
    TextInput,
    ActivityIndicator,
} from "react-native-paper";

import { useAlert } from "../../utils/alerts";
import { postProtectedRoute, getProtectedRoute } from "../../utils/requests";

import theme from "../../assets/themes/theme";
import ustyles from "../../assets/styles/ustyles";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";
import Friend from "../entities/Friend";
import AddFriend from "./AddFriendModal";
import { Link } from "expo-router";

export default function WikipediaModal({ question, dynamicLoading, close }) {
    if (!question) return;

    const [wikipedia, setWikipedia] = useState(question.wikipedia);

    useEffect(() => {
        if (!wikipedia && dynamicLoading) {
            getProtectedRoute(
                `/fetch_wiki?answer=${question.answers.main}&category=${question.category}&h=${question.hash}`,
            )
                .then((result) => {
                    setWikipedia(result.data)
                    console.log(result);
                })
                .catch((error) => {});
        }
    }, []);

    return (
        <GlassyView style={[styles.container, ustyles.flex.flexColumn]}>
            <View style={ustyles.flex.flexRowSpaceBetweenNoAlign}>
                <View style={ustyles.flex.flexRowSpaceBetween}>
                    <IconButton
                        icon={"wikipedia"}
                        style={styles.wikipedia}
                        size={20}
                    />
                    <HelperText
                        style={[ustyles.text.shadowText, ustyles.text.header]}
                    >
                        {wikipedia?.title || "Fetching Article..."}
                    </HelperText>
                </View>
                <View style={ustyles.flex.flexRow}>
                    {wikipedia ? (
                        <Link
                            href={wikipedia?.url}
                            target="_blank"
                            rel="noopener noreferrer" // Recommended for security/performance
                            selectionColor={"red"}
                        >
                            <IconButton
                                icon={"open-in-new"}
                                style={styles.open}
                                size={20}
                            />
                        </Link>
                    ) : (
                        <IconButton
                            icon={"open-in-new"}
                            style={styles.open}
                            size={20}
                        />
                    )}

                    <IconButton
                        size={20}
                        icon={"close"}
                        style={ustyles.icon.plain}
                        onPress={close}
                    />
                </View>
            </View>
            <View style={ustyles.flex.flexColumn}>
                {wikipedia ? (
                    <HelperText
                        style={[ustyles.text.shadowText, ustyles.text.text]}
                    >
                        {wikipedia.summary}...
                    </HelperText>
                ) : (
                    <ActivityIndicator />
                )}
            </View>
        </GlassyView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 30,
    },
    link: {
        color: "#0000ee",
    },
    open: {
        backgroundColor: "transparent",
    },
});
