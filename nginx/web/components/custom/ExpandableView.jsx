import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";

export default function ExpandableView({ style, expanded, children, onAnimationFinish, duration=250, maxHeight=300, minHeight=60 }) {
    const height = useRef(new Animated.Value(60)).current;

    useEffect(() => {
        Animated.timing(height, {
            toValue: expanded ? maxHeight : minHeight, // target height
            duration: duration,
            useNativeDriver: false, // MUST be false for height
        }).start(({ finished }) => {
            if (finished) {
                if(onAnimationFinish) onAnimationFinish(expanded)
            }
        });
    }, [expanded, maxHeight]);

    return (
        <Animated.View style={[{ height, overflow: "hidden" }, style]}>
            {children}
        </Animated.View>
    );
}
