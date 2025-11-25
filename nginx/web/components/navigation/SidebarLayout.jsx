import React, { useState, useEffect } from 'react';
import { View, Dimensions, StyleSheet, Image, ScrollView, Animated, Easing } from 'react-native';
import { Appbar, Drawer, IconButton, Title, Button, HelperText } from 'react-native-paper';
import { useWindowDimensions } from 'react-native';
import { getProtectedRoute, putProtectedRoute } from '../../utils/requests'
import { useAlert } from '../../utils/alerts';

import { removeAccessToken } from '../../utils/encryption';

import { useRouter, useSegments } from 'expo-router';

import CustomDrawerItem from './CustomDrawerItem';

import theme from '../../assets/themes/theme';
import Footer from './Footer';

const iconColor = theme.primary

let { width, height } = Dimensions.get("window")
let isWide = width >= 768; // Adjust breakpoint as needed

const contentPadding = 16

const SidebarLayout = ({ children, style }) => {
    const router = useRouter()
    const {showAlert} = useAlert()

    const segments = useSegments();


    // Get the current route name (last segment)
    const currentScreen = segments[0] || 'Home';
  
    // Capitalize the first letter of the route name
    const title = currentScreen.charAt(0).toUpperCase() + currentScreen.slice(1);

    const [isDrawerOpen, setDrawerOpen] = useState(isWide);
    const [drawerAnim] = useState(new Animated.Value(0)); // Initial position: hidden

    const [renderFooter, setRenderFooter] = useState(false)

    useEffect(() => {
        setTimeout(() => {
            setRenderFooter(true)
        }, 1000)
    }, [])

    const toggleDrawer = () => {
        setDrawerOpen(!isDrawerOpen);

        Animated.timing(drawerAnim, {
            toValue: isDrawerOpen ? 0 : 1, // Toggle between 0 and 1
            duration: 300, // Duration of the animation
            useNativeDriver: true, // Enable hardware acceleration for the animation
        }).start();
    };

    // Interpolate the drawer animation value for slide-in/out effect
    const drawerTranslateX = drawerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-300, 0], // Slide drawer from left (-300) to 0
    });

    function handleSignOut() {
        showAlert(({close}) => 
            <View>
                <Title style={styles.confirmTitle}>Are you sure you would like to logout?</Title>
                <View style={styles.confirmButtonContainer}> 
                    <Button mode='outlined' onPress={() => {
                        removeAccessToken()
                        close()
                        showAlert("Successfully logged out")
                        router.push("/signin")
                    }} style={styles.confirmButton}>Yes</Button>
                    <Button mode='contained' onPress={() => {close()}} style={styles.confirmButton}>No</Button>
                </View>
            </View>
        )

        // In the future we might want to ask the server something when we log out
    }

    return (
        <View style={styles.container}>
            {/* Appbar */}
            <Appbar.Header style={styles.topbar}>
                {!isWide && (
                <IconButton
                    icon="menu"
                    onPress={toggleDrawer}
                    iconColor={theme.onPrimary}
                />
                )}

                <Appbar.Content 
                    title={title} 
                    titleStyle={styles.title}
                />
                {/* Add the button on the right */}
                <IconButton
                    icon="bell-outline"
                    mode="contained" // Add mode for visual consistency
                    color={theme.primary}  // Replace with your primary color
                    onPress={() => router.push('/notifications')}
                    style={styles.iconButton}
                />
                <IconButton
                    icon="email-open-outline"
                    mode="contained" // Add mode for visual consistency
                    color={theme.primary}  // Replace with your primary color
                    onPress={() => router.push('/invites')}
                    style={styles.iconButton}
                />
                <IconButton
                    icon="logout"
                    mode="contained" // Add mode for visual consistency
                    color={theme.primary}  // Replace with your primary color
                    onPress={handleSignOut}
                    style={styles.iconButton}
                />
            </Appbar.Header>

            <View style={styles.body}>
                {/* Sidebar */}
                {isWide ? (
                    <View style={styles.drawer}>
                        <CustomDrawerItem label="Play" onPress={() => router.push("/play")} icon="play-outline" iconColor={iconColor} />
                        <CustomDrawerItem label="Friends" onPress={() => {}} icon="account-group" iconColor={iconColor} />


                    </View>
                ) : (
                isDrawerOpen && (
                    <Animated.View style={[styles.drawerOverlay, { transform: [{ translateX: drawerTranslateX }] }]}>
                        <CustomDrawerItem inline={true} label="Dashboard" onPress={() => router.push("/dashboard")} icon="speedometer" iconColor={iconColor} />
                        <CustomDrawerItem inline={true} label="Calendar" onPress={() => router.push("/calendar")} icon="calendar-month" iconColor={iconColor}/>
                        <CustomDrawerItem inline={true} label="Messages" onPress={() => router.push("/messages")} icon="message-text-outline" iconColor={iconColor}/>
                        <CustomDrawerItem inline={true} label="Account" onPress={() => router.push("/account")} icon="account-outline" iconColor={iconColor}/>
                        <CustomDrawerItem inline={true} label="Organizations" onPress={() => router.push("/organizations")} icon="domain" iconColor={iconColor}/>
                        <CustomDrawerItem inline={true} label="Pay" onPress={() => router.push("/pay")} icon="cash-multiple" iconColor={iconColor}/>

                        <CustomDrawerItem icon="close" onPress={toggleDrawer} style={styles.closeButton}></CustomDrawerItem>
                    </Animated.View>
                )
                )}

                <ScrollView
                    contentContainerStyle={[styles.scrollView]}
                >
                    <View style={styles.center}>
                        <View style={[styles.content, style]}>
                            {children}
                        </View>
                    </View>

                    <Footer leftPadding={contentPadding} />
                </ScrollView>
            </View>            
        </View>
    );
};

const drawerWidth = isWide ? "auto" : 250

const styles = StyleSheet.create({
    topbar: {
        backgroundColor: theme.primary,
        color: theme.onPrimary
    },
    title: {
        color: theme.onPrimary
    },
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    body: {
        flex: 1,
        flexDirection: 'row',
    },
    center: {
        flexDirection: "row",
        justifyContent: "center",
        height: "85%"
    },
    scrollView: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    drawer: {
        width: drawerWidth,
        backgroundColor: theme.onPrimary,
        elevation: 4,
        shadowColor: "#000",      // Shadow color for iOS
        shadowOffset: { width: 1, height: 0 }, // Shadow offset for iOS
        shadowOpacity: 0.3,       // Shadow opacity for iOS
        shadowRadius: 5,          // Shadow blur for iOS
    },
    drawerLabelStyle: {
        color: theme.background
    },
    drawerOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: drawerWidth,
        backgroundColor: theme.onPrimary,
        zIndex: 10,
        shadowColor: "#000",      // Shadow color for iOS
        shadowOffset: { width: 4, height: 4 }, // Shadow offset for iOS
        shadowOpacity: 0.4,       // Shadow opacity for iOS
        shadowRadius: 10,          // Shadow blur for iOS
    },
    content: {
        flex: 1,
        padding: contentPadding,
        maxWidth: 1250,
    },
    closeButton: {
        alignSelf: 'flex-end',
    },
    confirmButtonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: "center",
        gap: 10,
        margin: 10
    },
    confirmTitle: {
        alignSelf: "center"
    },
    confirmButton: {
        width: "30%"
    },
});

export default SidebarLayout;