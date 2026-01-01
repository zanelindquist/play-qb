import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import theme from "../assets/themes/theme";

const { width } = Dimensions.get("window");
const BANNER_HEIGHT = 70;

const BannerContext = createContext(null);

export function useBanner() {
    const ctx = useContext(BannerContext);
    if (!ctx) {
        throw new Error("useBanner must be used inside BannerProvider");
    }
    return ctx;
}

export function BannerProvider({ children }) {
    const insets = useSafeAreaInsets();

    const translateY = useRef(
        new Animated.Value(-BANNER_HEIGHT - insets.top)
    ).current;

    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("");
    const [options, setOptions] = useState({});

    const showBanner = (msg, opts = {}) => {
        setMessage(msg);
        setOptions(opts);
        setVisible(true);
    };

    const hideBanner = () => {
        Animated.timing(translateY, {
            toValue: -BANNER_HEIGHT - insets.top,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setVisible(false));
    };

    useEffect(() => {
        if (!visible) return;

        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
        }).start();

        const timer = setTimeout(hideBanner, options.duration || 3000);

        return () => clearTimeout(timer);
    }, [visible]);

    return (
        <BannerContext.Provider value={{ showBanner }}>
            {children}

            {visible && (
                <Animated.View
                    pointerEvents="box-none"
                    style={[
                        styles.banner,
                        {
                            paddingTop: insets.top,
                            transform: [{ translateY }],
                            backgroundColor:
                                options.backgroundColor || theme.primary,
                        },
                    ]}
                >
                    <Text style={styles.text}>{message}</Text>

                    <TouchableOpacity onPress={hideBanner}>
                        <Text style={styles.close}>✕</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </BannerContext.Provider>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: "absolute",
        top: 0,
        width,
        height: BANNER_HEIGHT,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 999,
    },
    text: {
        color: "white",
        fontSize: 16,
        flex: 1,
        marginRight: 12,
    },
    close: {
        color: "white",
        fontSize: 20,
    },
});
