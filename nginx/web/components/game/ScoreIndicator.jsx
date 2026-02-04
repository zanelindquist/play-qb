// ScoreIndicator.jsx
import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import { Animated, Text } from "react-native";
import theme from "../../assets/themes/theme";
import ustyles from "../../assets/styles/ustyles";

const ScoreIndicator = forwardRef(({ color = "limegreen" }, ref) => {
    const animValue = useRef(new Animated.Value(0)).current;
    const [points, setPoints] = useState(0);
    const [visible, setVisible] = useState(false);

    useImperativeHandle(ref, () => ({
        trigger: (newPoints) => {
            setPoints(newPoints);
            setVisible(true); // Show the text
            animValue.setValue(0);
            Animated.timing(animValue, {
                toValue: 1,
                duration: 700,
                useNativeDriver: true,
            }).start(() => setVisible(false)); // Hide after animation
        },
    }));

    const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -50],
    });

    const opacity = animValue.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [1, 1, 0],
    });

    const scale = animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.3, 1],
    });

    if (!visible) return null; // Don't render until triggered

    return (
        <Animated.Text
            style={[{
                position: "absolute",
                fontSize: 24,
                fontWeight: "bold",
                color,
                transform: [{ translateY }, { scale }],
                opacity,
            }, ustyles.text.shadowText]}
        >
            +{points}
        </Animated.Text>
    );
});

export default ScoreIndicator;
