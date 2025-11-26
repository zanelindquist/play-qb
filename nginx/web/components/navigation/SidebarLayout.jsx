import React, { useState, useEffect } from "react";
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
} from "react-native-paper";
import { useWindowDimensions } from "react-native";
import { getProtectedRoute, putProtectedRoute } from "../../utils/requests";
import { useAlert } from "../../utils/alerts";

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

const SidebarLayout = ({ children, style }) => {
    const router = useRouter();
    const { showAlert } = useAlert();

    const segments = useSegments();

    // Get the current route name (last segment)
    const currentScreen = segments[0] || "Home";

    // Capitalize the first letter of the route name
    const title =
        currentScreen.charAt(0).toUpperCase() + currentScreen.slice(1);

    const [isDrawerOpen, setDrawerOpen] = useState(isWide);
    const [drawerAnim] = useState(new Animated.Value(0)); // Initial position: hidden

    const [renderFooter, setRenderFooter] = useState(false);

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

    function handleSignOut() {
        showAlert(({ close }) => (
            <View>
                <Title style={styles.confirmTitle}>
                    Are you sure you would like to logout?
                </Title>
                <View style={styles.confirmButtonContainer}>
                    <Button
                        mode="outlined"
                        onPress={() => {
                            removeAccessToken();
                            close();
                            showAlert("Successfully logged out");
                            router.push("/signin");
                        }}
                        style={styles.confirmButton}
                    >
                        Yes
                    </Button>
                    <Button
                        mode="contained"
                        onPress={() => {
                            close();
                        }}
                        style={styles.confirmButton}
                    >
                        No
                    </Button>
                </View>
            </View>
        ));

        // In the future we might want to ask the server something when we log out
    }

    return (
        <View style={styles.root}>
            {/* Background Layer */}
            <View style={styles.bg} />

            {/* Top Navigation Bar */}
            <View style={styles.navCenter}>
                <GlassyView style={styles.topNav}>
                    <View style={styles.leftNav}>
                        <Logo text={true}/>
                    </View>

                    <View style={styles.middleNav}>
                        <TopNavItem
                            label="Play"
                            onPress={() => router.push("/play")}
                            icon="play-outline"
                            iconColor={iconColor}
                        />
                        <TopNavItem
                            label="Friends"
                            onPress={() => {}}
                            icon="account-group"
                            iconColor={iconColor}
                        />
                    </View>

                    <View style={styles.rightNav} />
                </GlassyView>
            </View>

            {/* Scroll area */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.childrenWrapper}>{children}</View>
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
        backgroundColor: "#dfe3ee", // light neutral
        opacity: 0.35,

        // more depth for glass
        backgroundImage:
            "linear-gradient(135deg, rgba(167, 45, 45, 0.8), rgba(46, 51, 138, 0.5))",
    },

    navCenter: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center"
    },

    topNav: {
        maxWidth: 1200,
        width: "90%",
        margin: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        padding: 10,
    },

    scroll: {
        flex: 1,
        backgroundColor: "transparent", // ← REQUIRED
    },

    scrollContent: {
        paddingBottom: 40,
        backgroundColor: "transparent", // ← REQUIRED
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
    },
    childrenWrapper: {
        margin: 10,
        padding: 10,
        maxWidth: 1500,
        width: "100%"
    },

    middleNav: {
        flexDirection: "row",
    },


});

const ddd = StyleSheet.create({
    topbar: {
        backgroundColor: theme.primary,
        color: theme.onPrimary,
    },
    title: {
        color: theme.onPrimary,
    },
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    body: {
        flex: 1,
        flexDirection: "row",
    },
    center: {
        flexDirection: "row",
        justifyContent: "center",
        height: "85%",
    },
    scrollView: {
        flexGrow: 1,
        justifyContent: "space-between",
    },
    drawer: {
        width: drawerWidth,
        backgroundColor: theme.onPrimary,
        elevation: 4,
        shadowColor: "#000", // Shadow color for iOS
        shadowOffset: { width: 1, height: 0 }, // Shadow offset for iOS
        shadowOpacity: 0.3, // Shadow opacity for iOS
        shadowRadius: 5, // Shadow blur for iOS
    },
    drawerLabelStyle: {
        color: theme.background,
    },
    drawerOverlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width: drawerWidth,
        backgroundColor: theme.onPrimary,
        zIndex: 10,
        shadowColor: "#000", // Shadow color for iOS
        shadowOffset: { width: 4, height: 4 }, // Shadow offset for iOS
        shadowOpacity: 0.4, // Shadow opacity for iOS
        shadowRadius: 10, // Shadow blur for iOS
    },
    content: {
        flex: 1,
        padding: contentPadding,
        maxWidth: 1250,
    },
    closeButton: {
        alignSelf: "flex-end",
    },
    confirmButtonContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
        margin: 10,
    },
    confirmTitle: {
        alignSelf: "center",
    },
    confirmButton: {
        width: "30%",
    },
});

export default SidebarLayout;
