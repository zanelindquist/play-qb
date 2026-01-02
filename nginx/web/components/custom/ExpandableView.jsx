import { useEffect, useRef, useState } from "react";
import { Animated, View, StyleSheet } from "react-native";

export default function ExpandableView({ style, expanded, children, onAnimationFinish, duration=250, maxHeight=300, minHeight=60, dynamicSizing=false }) {
    const height = useRef(new Animated.Value(minHeight)).current;
    const [measuredHeight, setMeasuredHeight] = useState(null);

    useEffect(() => {
        const targetHeight = dynamicSizing && measuredHeight 
            ? (expanded ? measuredHeight : minHeight)
            : (expanded ? maxHeight : minHeight);

        Animated.timing(height, {
            toValue: targetHeight,
            duration: duration,
            useNativeDriver: false, // MUST be false for height
        }).start(({ finished }) => {
            if (finished) {
                if(onAnimationFinish) onAnimationFinish(expanded)
            }
        });
    }, [expanded, maxHeight, measuredHeight]);

    const handleLayout = (event) => {
        if (dynamicSizing && measuredHeight === null) {
            const { height: contentHeight } = event.nativeEvent.layout;
            setMeasuredHeight(contentHeight);
        }
    };

    return (
        <Animated.View style={[{ height, overflow: "hidden" }, style]}>
            <View onLayout={handleLayout}>
                {children}
            </View>
        </Animated.View>
    );
}