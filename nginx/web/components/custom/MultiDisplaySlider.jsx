import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ActivityIndicator, HelperText } from 'react-native-paper';

import theme from '../../assets/themes/theme';

export default function MultiDisplaySlider ({ setScreen, screenNames, onScreenChange = () => {}, children }) {
    
    const [index, setIndex] = useState(screenNames.indexOf(setScreen) < 0 ? 0 : screenNames.indexOf(setScreen));
    const [sliderPosition] = useState(new Animated.Value(0)); // Animated value for slider position
    const [containerWidth, setContainerWidth] = useState(0); // Store the container width
    const [isLoading, setIsLoading] = useState(false); // Controls loading state
    const [currentScreen, setCurrentScreen] = useState(index); // Tracks the displayed screen after animation

    const handlePress = (i) => {
        onScreenChange({ name: screenNames[i], index: i });
        setIsLoading(true); // Show loading indicator
        setIndex(i);

        Animated.spring(sliderPosition, {
            toValue: i * containerWidth / screenNames.length,
            useNativeDriver: true,
        }).start(() => {
            // Wait for animation to finish before updating the screen
            setCurrentScreen(i);
            setIsLoading(false);
        });
    };

    return (
        <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
            {/* Header Navigation */}
            <View style={styles.headerContainer}>
                {screenNames.map((s, i) => (
                    <HelperText
                        key={s}
                        style={[styles.header, i === index ? styles.headerSelected : null]}
                        onPress={() => handlePress(i)}
                    >
                        {s}
                    </HelperText>
                ))}
                {/* Animated slider beneath selected option */}
                <Animated.View
                    style={[
                        styles.slider,
                        { transform: [{ translateX: sliderPosition }] },
                        { width: `${(100 / screenNames.length).toFixed(0)}%` }
                    ]}
                />
            </View>

            {/* Screen Content */}
            <View style={[children[currentScreen]?.props?.style || {}, styles.childContainer]}>
                {isLoading ? (
                    <ActivityIndicator style={styles.activityIndicator} size="large" color={theme.primary} />
                ) : (
                    // Not enough screens passed
                    children.length > currentScreen ?
                    React.cloneElement(children[currentScreen], {
                        style: [children[currentScreen]?.props?.style, styles.child]
                    }) : (
                        <></>
                    )
                )}
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    childContainer: {
        flexDirection: "row",
        justifyContent: "center",
    },
    child: {
        flexShrink: 1
    },
    headerContainer: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderColor: '#ccc', // Light-colored border for background
    },
    header: {
        flex: 1,
        textAlign: "center",
        fontSize: "1.25rem",
    },
    headerSelected: {
        color: theme.primary, // Highlighted text color
    },
    activityIndicator : {
        marginVertical: 100,
    },
    slider: {
        position: 'absolute',
        // width: "50%", // Set the width of the slider to match each header
        height: 3,
        backgroundColor: theme.primary, // Color of the slider
        bottom: -2, // Position it at the bottom
    },
    scene: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f6f6f6',
    },
});