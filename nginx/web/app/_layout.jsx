import { Stack } from "expo-router";
import {
    MD3LightTheme as DefaultTheme,
    PaperProvider,
    Modal,
} from "react-native-paper";

import { AlertProvider } from "../utils/alerts";

// Make it work for mobile
import { GestureHandlerRootView } from "react-native-gesture-handler";
import theme from "../assets/themes/theme";
import { Platform } from "react-native";
import { FadeIn, FadeOut } from "react-native-reanimated";

if (Platform.OS === "web") {
    require("../assets/css/scrollbar.css");
}

export default function RootLayout() {
    const customTheme = {
        ...DefaultTheme,
        colors: theme, // Copy it from the color codes scheme and then use it here
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={customTheme}>
                <AlertProvider>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            unmountOnBlur: true,
                            animation: "slide_from_right",
                            animationDuration: 1000
                        }}
                    />
                </AlertProvider>
            </PaperProvider>
        </GestureHandlerRootView>
    );
}
