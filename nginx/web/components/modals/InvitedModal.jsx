import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, HelperText, Title, IconButton, Searchbar } from 'react-native-paper';

import { useAlert } from '../../utils/alerts';

import theme from '../../assets/themes/theme';
import GlassyButton from '../custom/GlassyButton';
import Friend from '../entities/Friend';
import AddFriend from './AddFriendModal';


export default function InvitedModal({acceptInvite, user, partyHash, close}) {
    return (
        <View style={styles.container}>
            <View style={styles.dialogueTitle}>
                <Title style={styles.createDTitle}>Accept Invite from {user.username}</Title>
                <View style={styles.rightDialogue}>
                    <GlassyButton
                        onPress={() => {
                            acceptInvite(partyHash)
                            close()
                        }}
                        mode='contained'
                    >Accept</GlassyButton>
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
    rightDialogue: {
        flexDirection: "row"
    },
    createDTitle: {
        fontSize: 20,
        fontWeight: 'bold',
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