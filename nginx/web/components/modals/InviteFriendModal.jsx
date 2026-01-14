import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, HelperText, Title, IconButton, Searchbar } from 'react-native-paper';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TimePickerModal } from 'react-native-paper-dates';

import { timeUntil, timeAgo, formatTime, fromTimeString } from '../../utils/time';
import { getProtectedRoute, putProtectedRoute, deleteProtectedRoute } from "../../utils/requests"

import { useAlert } from '../../utils/alerts';

import theme from '../../assets/themes/theme';
import GlassyButton from '../custom/GlassyButton';
import Friend from '../entities/Friend';
import AddFriend from './AddFriendModal';
import { useBanner } from '../../utils/banners';


export default function InviteFriendModal({socket, addEventListener, removeEventListener, openAddFriendModal, close}) {
    const [searchQuery, setSearchQuery] = useState("")
    const [results, setResults] = useState([])

    const [loading, setLoading] = useState(false)
    const [timeoutId, setTimeoutId] = useState(null)

    const [friends, setFriends] = useState([]) //{username: "f4de17"}

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
        addEventListener("friends_found", ({friends: newFriends}) => {
            console.log(newFriends)
            setFriends(newFriends)
        })

        return () => {
            removeEventListener("friends_found")
        }
    }, [])

    useEffect(() => {
        fetchFriends(searchQuery)
    }, [searchQuery])

    function fetchFriends(query) {
        socket.emit("search_friends", {query: query})
    }
    
    function handleInvite(hash) {
        socket.emit("invite_friend", {hash: hash})
    } 

    return (
        <View style={styles.container}>
            <View style={styles.dialogueTitle}>
                <Title style={styles.createDTitle}>Invite Friend</Title>
                <View style={styles.rightDialogue}>
                    <IconButton 
                        icon="refresh"
                        size={20}
                        iconColor={theme.onPrimaryContainer}
                        onPress={() => {
                            fetchFriends(searchQuery)
                        }}
                    />
                    <IconButton
                        icon="close"
                        size={20}
                        iconColor={theme.onPrimaryContainer}
                        onPress={close}
                    /> 
                </View>

            </View>
            <View style={styles.friends}>
            {
                friends.length > 0 ?
                friends.map((friend, i) => 
                    <Friend
                        friend={friend}
                        onPress={() => handleInvite(friend.hash)}    
                    />
                )
                :
                <View style={styles.noFriendsContainer}>
                    <HelperText style={styles.noFriendsText}>You have no friends who are currently online</HelperText>
                    <GlassyButton
                        style={styles.addFriendsButton}
                        onPress={openAddFriendModal}
                    >Add friend</GlassyButton>
                </View>
                
            }
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
    rightDialogue: {
        flexDirection: 'row',
    },
    friends: {
        gap: 10
    },
    noFriendsContainer: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    noFriendsText: {

    },
    addFriendsButton: {

    }

});