import React, {useState} from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Icon, HelperText } from "react-native-paper";
import ustyles from "../../assets/styles/ustyles.js";
import theme from "../../assets/themes/theme";

export default function ChatMessage ({ style, user, message, timestamp }) {
    const [isHidden, setIsHidden] = useState(false);

    const formatTimestamp = (ts) => {
        if (!ts) return "";
        const date = new Date(ts);
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.iconContainer}>
                <Icon
                    source={"account"}
                    size={20}
                />
            </View>
            <HelperText style={styles.name}>{user.username}</HelperText>
            <View style={styles.messageContainer}>
                <Text style={[styles.message, ustyles.text.textShadow]}>
                    {isHidden ? "Message hidden" : message}
                </Text>
            </View>
            <Pressable onPress={() => setIsHidden(!isHidden)} style={styles.hideButton}>
                <Icon
                    color={theme.secondary}
                    source={isHidden ? "eye" : "eye-off"}
                    size={16}
                />
            </Pressable>
            <HelperText style={styles.timestamp}>
                {formatTimestamp(timestamp)}
            </HelperText>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingLeft: 20,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        position: "relative",
        paddingBottom: 20,
        flexWrap: "wrap"
    },
    iconContainer: {
        padding: 5,
        borderRadius: "50%",
        backgroundColor: theme.elevation.level3,
        flexShrink: 0
    },
    name: {
        fontSize: "1rem",
        fontWeight: "bold",
        flexShrink: 0
    },
    messageContainer: {
        flex: 1,
        minWidth: 0
    },
    message: {
        fontSize: "1rem",
        color: "white"
    },
    hideButton: {
        padding: 5,
        flexShrink: 0
    },
    timestamp: {
        position: "absolute",
        bottom: 0,
        left: 60,
        fontSize: "0.8rem",
        color: "rgba(255, 255, 255, 0.5)"
    }
})