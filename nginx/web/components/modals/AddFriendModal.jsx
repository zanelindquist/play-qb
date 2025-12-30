import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, HelperText, Title, IconButton, Searchbar } from 'react-native-paper';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TimePickerModal } from 'react-native-paper-dates';

import { timeUntil, timeAgo, formatTime, fromTimeString } from '../../utils/time';
import { getProtectedRoute, putProtectedRoute, deleteProtectedRoute } from "../../utils/requests"

import { useAlert } from '../../utils/alerts';

import theme from '../../assets/themes/theme';


export default function AddFriendModal({handleAddFriend, socket, addEventListener, close}) {
    const {showAlert} = useAlert()

    const [searchQuery, setSearchQuery] = useState("")
    const [results, setResults] = useState([])

    const [invites, setInvites] = useState([])

    const [loading, setLoading] = useState(false)
    const [timeoutId, setTimeoutId] = useState(null)

    const [friends, setFriends] = useState(null)

    function handleTyping(value) {
        // Cancel timeout if it hasn't already gone off
        clearTimeout(timeoutId)
        setSearchQuery(value)
        setTimeoutId(setTimeout(() => {
            setLoading(true)
            searchTerm(value)
        }, 300))
    }

    useEffect(() => {
        addEventListener("users_found", (Friends) => {
            console.log(Friends)
        })
    })
    
    function handleAddFriend(friendId) {
        socket.emit("add_friend", {friend_id: friendId})
    }

    return (
        <View style={styles.container}>
            <View style={styles.dialogueTitle}>
                <Title style={styles.createDTitle}>Invite Friend</Title>
                <IconButton
                    icon="close"
                    size={20}
                    iconColor={theme.onPrimaryContainer}
                    onPress={() => {
                        close();
                    }}
                />
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    dialogueTitle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    createDTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    createDContent: {
        padding: 16,
    },
    employeeSearchResultItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    addEmployeeOptions: {
        flexDirection: 'row',
        gap: 8,
    }
});