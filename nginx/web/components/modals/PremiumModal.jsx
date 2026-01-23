import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, HelperText, Title, IconButton, Searchbar, Icon } from 'react-native-paper';

import { useAlert } from '../../utils/alerts';

import theme from '../../assets/themes/theme';
import ustyles from '../../assets/styles/ustyles';
import GlassyButton from '../custom/GlassyButton';
import GlassyView from '../custom/GlassyView';
import Friend from '../entities/Friend';
import AddFriend from './AddFriendModal';


export default function PremiumModal({message, close}) {
    return (
        <GlassyView style={[styles.container, ustyles.flex.flexColumn]}>
            <View style={ustyles.flex.flexRowSpaceBetween}>
                <HelperText style={[ustyles.text.shadowText, ustyles.text.header]}>{message}</HelperText>
                <IconButton size={30} iconColor={theme.primary} icon={"plus"} style={ustyles.icon.icon}/>
            </View>
            <View style={ustyles.flex.flexRowSpaceBetween}>
                <HelperText style={[ustyles.text.shadowText, ustyles.text.text]}>Try your first month free, and then 4.99/mo after that.</HelperText>
                <Button mode="contained">Get Premium</Button>
            </View>
        </GlassyView>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 300
    },
});