import { useState, useEffect, useRef } from "react";
import {
    View,
    Dimensions,
    StyleSheet,
    Image,
    ScrollView,
    Animated,
    Easing,
} from "react-native";
import {
    Appbar,
    Drawer,
    IconButton,
    Title,
    Button,
    HelperText,
    ActivityIndicator
} from "react-native-paper";
import Video from 'react-native-video';
import { useWindowDimensions } from "react-native";
import { getProtectedRoute, putProtectedRoute } from "../../utils/requests";
import { useAlert } from "../../utils/alerts";
import {useSocket} from "../../utils/socket"

import { removeAccessToken } from "../../utils/encryption";

import { useRouter, useSegments } from "expo-router";

import CustomDrawerItem from "./CustomDrawerItem";

import theme from "../../assets/themes/theme";
import Footer from "./Footer";
import GlassyView from "../custom/GlassyView";
import TopNavItem from "./TopNavItem";
import Logo from "../custom/Logo";

const iconColor = theme.primary;

let { width, height } = Dimensions.get("window");
let isWide = width >= 768; // Adjust breakpoint as needed

const contentPadding = 16;

const SidebarLayout = ({ children, style, isLoading }) => {
    // Routing
    const router = useRouter();
    const { showAlert } = useAlert();
    const segments = useSegments();
    const {disconnect} = useSocket("lobby")


    // Page variables
    const currentScreen = segments[0] || "Home";
    const title = currentScreen.charAt(0).toUpperCase() + currentScreen.slice(1);

    // States
    const [isDrawerOpen, setDrawerOpen] = useState(isWide);
    const [drawerAnim] = useState(new Animated.Value(0)); // Initial position: hidden
    const [renderFooter, setRenderFooter] = useState(false);
    const [navBarHeight, setNavBarHeight] = useState(0);

    useEffect(() => {
        setTimeout(() => {
            setRenderFooter(true);
        }, 1000);
    }, []);

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

    function handleLogout() {
        removeAccessToken()
        .then(() => {
            disconnect()
            console.log("Logged out")
            router.replace("/signin")
        })
    }

    return (
        <View style={styles.root}>
            {/* Background Layer */}
            <View style={styles.bg} >                
                <Video
                    source={{uri: "/videos/Earth.mp4"}}
                    style={[StyleSheet.absoluteFill]}
                    muted
                    repeat
                    resizeMode="cover"
                />
            </View>

            {/* Top Navigation Bar */}
            <View
                style={styles.navCenter}
                onLayout={(e) => {
                    setNavBarHeight(e.nativeEvent.layout.height)
                }}
            >
                <GlassyView style={styles.topNav}>
                    <View style={styles.leftNav}>
                        <Logo text={true} image={false}/>
                    </View>

                    <View style={styles.middleNav}>
                        <TopNavItem
                            label="Play"
                            onPress={() => router.replace("/play")}
                            icon="play-outline"
                            iconColor={iconColor}
                        />
                        <TopNavItem
                            label="Invite"
                            onPress={() => {}}
                            icon="account-group"
                            iconColor={iconColor}
                        />
                    </View>

                    <View style={styles.rightNav} >
                        <TopNavItem
                            label="Account"
                            onPress={() => {}}
                            icon="account"
                            iconColor={iconColor}
                        />
                        <TopNavItem
                            label="Logout"
                            onPress={handleLogout}
                            icon="logout"
                            iconColor={iconColor}
                        />
                    </View>
                </GlassyView>
            </View>


            {/* Scroll area */}
            <ScrollView
                style={[styles.scroll, {paddingTop: navBarHeight}]}
                contentContainerStyle={styles.scrollContent}
            >
                {
                    isLoading ? 
                    <ActivityIndicator /> :
                    children
                }
            </ScrollView>
        </View>
    );
};

const drawerWidth = isWide ? "auto" : 250;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        position: "relative",
    },
    bg: {
        ...StyleSheet.absoluteFillObject,
        height: "100vh",
        width: "100vw",
        backgroundColor: "black", // light neutral
        // opacity: 0.5,

        // more depth for glass
        // backgroundImage: theme.gradients.background,
    },
    navCenter: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
        padding: 10,
        position: "absolute",
        top: 10,
        zIndex: 10
    },
    topNav: {
        maxWidth: 1200,
        width: "90%",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        padding: 10,
    },
    middleNav: {
        flexDirection: "row",
    },
    rightNav: {
        flexDirection: "row"
    },

    scroll: {

    },
    scrollContent: {
        margin: 10,
        padding: 10,
        maxWidth: 1100,
        width: "100vw",
        alignSelf: "center",
    },
});

export default SidebarLayout;
