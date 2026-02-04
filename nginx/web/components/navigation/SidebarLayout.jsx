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
    ActivityIndicator,
} from "react-native-paper";
import Video from "react-native-video";
import { useWindowDimensions } from "react-native";
import { getProtectedRoute, putProtectedRoute } from "../../utils/requests";
import { useAlert } from "../../utils/alerts";
import { useSocket } from "../../utils/socket";

import { removeAccessToken } from "../../utils/encryption";

import { useRouter, useSegments } from "expo-router";

import CustomDrawerItem from "./CustomDrawerItem";

import theme from "../../assets/themes/theme";
import Footer from "./Footer";
import GlassyView from "../custom/GlassyView";
import TopNavItem from "./TopNavItem";
import Logo from "../custom/Logo";
import { useBanner } from "@/utils/banners";
import ustyles from "@/assets/styles/ustyles";

const iconColor = theme.primary;

let { width, height } = Dimensions.get("window");
let isMobile = width <= 768; // Adjust breakpoint as needed

const contentPadding = 16;

const SidebarLayout = ({ children, style, isLoading }) => {
    // Routing
    const router = useRouter();
    const { showAlert } = useAlert();
    const { showBanner } = useBanner();
    const segments = useSegments();
    const { disconnect } = useSocket("lobby");

    // Page variables
    const currentScreen = segments[0] || "Home";
    const title =
        currentScreen.charAt(0).toUpperCase() + currentScreen.slice(1);

    // States
    const [isDrawerOpen, setDrawerOpen] = useState(!isMobile);
    const [drawerAnim] = useState(new Animated.Value(0)); // Initial position: hidden
    const [renderFooter, setRenderFooter] = useState(false);
    const [navBarHeight, setNavBarHeight] = useState(0);
    const [drawerHeight, setDrawerHeight] = useState(0);

    useEffect(() => {
        setTimeout(() => {
            setRenderFooter(true);
        }, 1000);
    }, []);

    const toggleDrawer = () => {
        const toValue = isDrawerOpen ? 0 : 1; // 0 = closed (up), 1 = open (down)
        
        Animated.timing(drawerAnim, {
            toValue,
            duration: 300,
            useNativeDriver: true,
        }).start();
        
        setDrawerOpen(!isDrawerOpen);
    };

    // Interpolate the drawer animation value for slide-in/out effect
    const drawerTranslateY = drawerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-drawerHeight, 0], // Slide drawer from left (-300) to 0
    });

    function handleLogout() {
        removeAccessToken().then(() => {
            disconnect();
            console.log("Logged out");
            router.replace("/signin");
            showBanner("You were logged out");
        });
    }

    const play = (
        <TopNavItem
            label="Play"
            onPress={() => router.replace("/lobby?mode=solos")}
            icon="play"
            iconColor={iconColor}
        />
    );
    const saved = (
        <TopNavItem
            label="Saved"
            onPress={() => router.replace("/saved")}
            icon="bookmark"
            iconColor={iconColor}
        />
    );
    const stats = (
        <TopNavItem
            label="Stats"
            onPress={() => router.push("/stats")}
            icon="poll"
            iconColor={iconColor}
        />
    );
    const account = (
        <TopNavItem
            label="Account"
            onPress={() => router.push("/account")}
            icon="account"
            iconColor={iconColor}
        />
    );
    const logout = (
        <TopNavItem
            label="Logout"
            onPress={handleLogout}
            icon="logout"
            iconColor={iconColor}
        />
    );

    const toggleDrawerIcon = (
        <IconButton
            style={styles.openDrawerButton}
            icon={"menu"}
            size={40}
            onPress={toggleDrawer}
            iconColor={theme.onPrimary}
        />
    )

    return (
        <View style={styles.root}>
            {/* Background Layer */}
            <View style={styles.bg}>
                <Video
                    source={{ uri: "/videos/Earth.mp4" }}
                    style={[StyleSheet.absoluteFill]}
                    muted
                    repeat
                    resizeMode="cover"
                />
            </View>

            {/* Top Navigation Bar */}
            {isMobile ? (
                <>
                    <Animated.View
                        style={[
                            styles.drawerContainer,
                            {
                                transform: [{translateY: drawerTranslateY}]
                            }
                        ]}
                        onLayout={(e) => {
                            setDrawerHeight(e.nativeEvent.layout.height)
                        }}
                    >
                        <GlassyView style={styles.glassyDrawer}>
                            {toggleDrawerIcon}
                            <View style={ustyles.flex.flexRowSpaceBetween}>
                                {play}
                                {saved}
                                {stats}
                                {account}
                                {logout}
                            </View>

                        </GlassyView>
                    </Animated.View>
                {
                    !isDrawerOpen &&
                    <View
                        style={styles.navCenterMobile}
                    >
                        {toggleDrawerIcon}
                    </View>
                }
                </>
            ) : (
                <View
                    style={styles.navCenter}
                    onLayout={(e) => {
                        setNavBarHeight(e.nativeEvent.layout.height);
                    }}
                >
                    <GlassyView style={styles.topNav}>
                        <View style={styles.middleNav}>
                            <Logo
                                text={true}
                                image={false}
                                style={styles.logo}
                            />
                        </View>

                        <View style={styles.middleNav}>
                            {play}
                            {saved}
                            {stats}
                        </View>
                        <View style={styles.rightNav}>
                            {account}
                            {logout}
                        </View>
                    </GlassyView>
                </View>
            )}

            {/* Scroll area */}
            <ScrollView
                style={[styles.scroll, { paddingTop: navBarHeight }]}
                contentContainerStyle={[styles.scrollContent, style]}
            >
                {isLoading ? <ActivityIndicator /> : children}
            </ScrollView>
        </View>
    );
};

const drawerWidth = isMobile ? 250 : "auto";

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
        zIndex: 10,
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
        flexDirection: "row",
    },
    logo: {
        marginHorizontal: 20,
    },

    scroll: {},
    scrollContent: {
        margin: 10,
        padding: 10,
        maxWidth: 1100,
        width: "100vw",
        alignSelf: "center",
    },
    navCenterMobile: {
        width: "100%",
        alignItems: "flex-end",
        backgroundColor: "transparent",
        padding: 10,
        position: "absolute",
        top: 10,
        zIndex: 10,
    },
    drawerContainer: {
        width: "100vw",
        position: "absolute",
        zIndex: 10
    },
    glassyDrawer: {
        borderRadius: 0,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        borderWidth: 0,
        flexDirection: "column",
        gap: 20,
        paddingBottom: 30
    },
    openDrawerButton: {
        backgroundColor: theme.primary,
        alignSelf: "flex-end"
    },
});

export default SidebarLayout;
