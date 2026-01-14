import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
    Button,
    HelperText,
    Title,
    IconButton,
    Searchbar,
    TextInput,
    ActivityIndicator,
} from "react-native-paper";

import { useAlert } from "../../utils/alerts";

import theme from "../../assets/themes/theme";
import User from "../entities/User";

export default function AddFriendModal({ socket, addEventListener, removeEventListener, close }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState([]);

    const [invites, setInvites] = useState([]);

    const [loading, setLoading] = useState(false);
    const [timeoutId, setTimeoutId] = useState(null);

    const [users, setUsers] = useState(null);

    function handleTyping(value) {
        // Cancel timeout if it hasn't already gone off
        clearTimeout(timeoutId);
        setSearchQuery(value);
        setTimeoutId(
            setTimeout(() => {
                setLoading(true);
                fetchUsers(value);
            }, 300)
        );
    }

    useEffect(() => {
        addEventListener("users_found", ({ users }) => {
            console.log(users);
            setUsers(users);
            setLoading(false);
        });

        return () => {
            removeEventListener("users_found")
        };
    }, []);

    function fetchUsers(query) {
        if (!query) return;
        socket.emit("search_users", { query: query });
    }

    function handleAddFriend(index) {
        const hash = users[index].hash;
        socket.emit("add_friend", { hash: hash });
    }

    return (
        <View style={styles.container}>
            <View style={styles.dialogueTitle}>
                <Title style={styles.createDTitle}>Add Friend</Title>
                <IconButton
                    icon="close"
                    size={20}
                    iconColor={theme.onPrimaryContainer}
                    onPress={() => {
                        close();
                    }}
                />
            </View>
            <TextInput style={styles.searchInput} onChangeText={handleTyping} />
            <View style={styles.searchResults}>
                {users &&
                    (loading ? (
                        <ActivityIndicator />
                    ) : users.length > 0 ? (
                        users.map((user, index) => (
                            <User
                                user={user}
                                onPress={() => handleAddFriend(index)}
                                key={index}
                            />
                        ))
                    ) : (
                        <HelperText>No results found</HelperText>
                    ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    dialogueTitle: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    createDTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    searchInput: {},
    searchResults: {
        marginTop: 20,
        flexDirection: "column",
        gap: 10,
    },
});
