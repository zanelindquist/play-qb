import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { IconButton, useTheme } from "react-native-paper";

const PaginationNavigator = ({ onOffsetChange, startOffset, limit, delay=500, endIndex, style }) => {
    const theme = useTheme(); // Access the current theme for dynamic styling
    const [offset, setOffset] = useState(startOffset || 0)
    const [timeoutId, setTimeoutId] = useState(null)

    const handlePrevious = () => {
        clearTimeout(timeoutId)
        setTimeoutId(setTimeout(() => {
            if((offset - limit) < 0 ) return
            onOffsetChange(offset - limit, limit)
            setOffset(prevOffset => prevOffset - limit)
        }), delay);
    };

    const handleNext = () => {
        clearTimeout(timeoutId)
        setTimeoutId(setTimeout(() => {
            onOffsetChange(offset + limit, limit)
            setOffset(prevOffset => prevOffset + limit)
          }), delay);
    };

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }, style]}>
        {/* Left Chevron */}
        <IconButton
          icon="chevron-left"
          size={24}
          onPress={handlePrevious}
          iconColor={theme.colors.primary}
          disabled={offset === 0 ? true : false}
        />

        {/* Week Display */}
        <Text style={[styles.weekDisplay, { color: theme.colors.onSurface }]}>
          {`${offset + 1} - ${offset + limit > endIndex ? offset + endIndex % limit : offset + limit}`}
        </Text>

        {/* Right Chevron */}
        <IconButton
          icon="chevron-right"
          size={24}
          onPress={handleNext}
          iconColor={theme.colors.primary}
          disabled={offset + limit > endIndex ? true : false}
        />
      </View>
    );
};

const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 5,
      borderRadius: 10,
    },
    weekDisplay: {
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
    },
});

export default PaginationNavigator;