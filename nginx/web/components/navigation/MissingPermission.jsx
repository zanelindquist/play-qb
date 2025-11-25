import React, { useState } from 'react';
import { View, Dimensions, StyleSheet, Image } from 'react-native';
import { Appbar, Drawer, HelperText, IconButton, Title } from 'react-native-paper';

import { useRouter, useSegments } from 'expo-router';

import theme from '../../assets/themes/theme';

const MissingPermission = ({ children }) => {
    const router = useRouter()

    return (
        <View style={styles.container}>
            <Title>Sorry, but it looks like you don't have adequate permissions</Title>
        </View>
    );
};

const styles = StyleSheet.create({
    topbar: {
        backgroundColor: theme.primary,
        color: theme.onPrimary
    },
});

export default MissingPermission;