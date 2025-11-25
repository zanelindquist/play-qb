import React, { useState, useEffect } from 'react';
import { View, Dimensions, StyleSheet, Image, ScrollView, Animated, Easing } from 'react-native';
import { Appbar, Drawer, IconButton, Title, Button, HelperText } from 'react-native-paper';
import { useWindowDimensions } from 'react-native';
import { getProtectedRoute, putProtectedRoute } from '../../utils/requests'
import { useAlert } from '../../utils/alerts';

import theme from '../../assets/themes/theme';
import { Link } from 'expo-router';

let { width, height } = Dimensions.get("window")
let isWide = width >= 768; // Adjust breakpoint as needed

const Footer = ({ children, style, leftPadding }) => {
    const [containerWidth, setContainerWidth] = useState(0);

    return (
        <View
            onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setContainerWidth(width);
            }}
            style={styles.layout}
        >
            <View
                style={[styles.container, {left: -leftPadding, width: containerWidth + leftPadding}]}
            >
                <Image
                    source={require("../../assets/images/steig-black.png")}
                    style={styles.logo}
                    resizeMode='contain'>
                </Image>
                <HelperText>© 2025 PlayQB</HelperText>
                {/* TODO: update localhost to domain */}
                <Link href="http://localhost" style={styles.link}>Webpage</Link>
                <Link href="http://localhost/docs" style={styles.link}>Docs</Link>
                <Link href="http://localhost/terms" style={styles.link}>Terms</Link>
                <Link href="http://localhost/status" style={styles.link}>Status</Link>
            </View>
        </View>
    )
};

const styles = StyleSheet.create({
    layout: {
        width: "100%",
        paddingTop: 100
    },
    container: {
        backgroundColor: theme.inversePrimary,
        width: "100%",
        // marginTop: 100,
        bottom: 0,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center"
    },
    logo: {
        display: "inline",
        maxWidth: "50px",
        maxHeight: "50px",
        margin: "20px",
        alignSelf: "center"
    },
    footerText: {
        fontSize: 14,
        color: '#777',
    },
    link: {
        paddingHorizontal: 10
    },
});

export default Footer;