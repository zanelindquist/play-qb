import {
  MD3LightTheme as DefaultTheme,
  PaperProvider,
  Modal
} from 'react-native-paper';

import { AlertProvider } from "../utils/alerts";

// Make it work for mobile
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import theme from "../assets/themes/theme";

import { Platform } from 'react-native';
import { Slot } from 'expo-router';

if (Platform.OS === 'web') {
    require('../assets/css/scrollbar.css');
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
            <NavigationContainer theme={customTheme}>
                <Stack.Navigator initialRouteName="Home">
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="Details" component={DetailsScreen} />
                </Stack.Navigator>
            </NavigationContainer>
            </AlertProvider>
        </PaperProvider>
    </GestureHandlerRootView>
    );
}