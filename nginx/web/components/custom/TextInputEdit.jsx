import { getProtectedRoute , handleExpiredAccessToken } from "../../utils/requests.jsx"

import React, { useEffect, useState } from 'react';
import {
    View,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Dimensions,
    Text,
    Image
} from 'react-native';
import { Avatar, Button, Divider, HelperText, TextInput, Title, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAlert } from "../../utils/alerts.jsx";
import theme from "../../assets/themes/theme.js";

// Input is handled by an outside useState from a parent function
export default function TextInputEdit({ label, disabled, input, onInput, inputProps = {}, subtitle, error, style, toggleArrows }) {
    function handleChange(text) {
        onInput(text);
    }

    function handleArrow(direction) {
        let num = parseFloat(input) || 0;
        const step = toggleArrows;
        if (direction === "up") num += step;
        if (direction === "down") num -= step;
        const newValue = num.toString();
        onInput(newValue);
    }

    return (
        <View style={[styles.container, style]}>
            <HelperText style={styles.label}>{label}</HelperText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                    mode="outlined"
                    style={[styles.input, { flex: 1 }]}
                    value={input}
                    disabled={disabled}
                    onChangeText={handleChange}
                    keyboardType={toggleArrows ? "numeric" : inputProps.keyboardType}
                    textColor={disabled ? theme.outline : ""}
                    {...inputProps}
                />
                {
                    toggleArrows &&
                    <View style={{ justifyContent: 'center', marginLeft: 4 }}>
                        <TouchableOpacity onPress={() => handleArrow("up")}>
                            <Icon name="chevron-up" size={20} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleArrow("down")}>
                            <Icon name="chevron-down" size={20} />
                        </TouchableOpacity>
                    </View>
                }
            </View>
            {
                error ?
                    <HelperText style={[styles.subtitle, styles.error]}>{error}</HelperText>
                    :
                    subtitle && <HelperText style={styles.subtitle}>{subtitle}</HelperText>
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 15
    },
    label: {
        fontSize: "1rem",
        color: theme.onBackground,
        fontWeight: 600,
        // marginVertical: 10,
    },
    input: {
        padding: 0,
        height: 35,
        margin: 0,
        borderColor: theme.primary,
        backgroundColor: theme.surface
    },
    disabled: {
        color: "white"
    },
    subtitle: {
        color: theme.onBackground,
        fontWeight: 400,
        marginVertical: 5,
    },
    error: {
        color: "red"
    }
})