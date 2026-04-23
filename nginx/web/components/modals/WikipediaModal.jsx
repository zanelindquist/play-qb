import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, HelperText, Title, IconButton, Searchbar, Icon, TextInput } from 'react-native-paper';

import { useAlert } from '../../utils/alerts';
import { postProtectedRoute } from '../../utils/requests';

import theme from '../../assets/themes/theme';
import ustyles from '../../assets/styles/ustyles';
import GlassyButton from '../custom/GlassyButton';
import GlassyView from '../custom/GlassyView';
import Friend from '../entities/Friend';
import AddFriend from './AddFriendModal';
import { Link } from 'expo-router';


export default function WikipediaModal({wikipedia, close}) {

    return (
        <GlassyView style={[styles.container, ustyles.flex.flexColumn]}>
            <View style={ustyles.flex.flexRowSpaceBetweenNoAlign}>
                <View style={ustyles.flex.flexRowSpaceBetween}>
                    <IconButton
                        icon={"wikipedia"}
                        style={styles.wikipedia}
                        size={20}
                    />
                    <HelperText style={[ustyles.text.shadowText, ustyles.text.header]}>{wikipedia.title}</HelperText>
                </View>
                <View style={ustyles.flex.flexRow}>
                    <Link
                        href={ wikipedia.url}
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
                    <IconButton size={20} icon={"close"} style={ustyles.icon.plain} onPress={close}/>
                    
                </View>
            </View>
            <View style={ustyles.flex.flexColumn}>
                <HelperText style={[ustyles.text.shadowText, ustyles.text.text]}>{wikipedia.summary}...</HelperText>

            </View>
        </GlassyView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 30
    },
    link: {
        color: "#0000ee"
    },
    open: {
        backgroundColor: "transparent"
    }
});