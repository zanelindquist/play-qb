import { useEffect, useState } from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import {
    Button,
    Checkbox,
    HelperText,
    IconButton,
    Menu,
    Text,
    TextInput,
    ToggleButton,
} from "react-native-paper";
import Slider from '@react-native-community/slider';
import GlassyButton from "../custom/GlassyButton";
import theme from "../../assets/themes/theme";
import NumericInput from "../custom/NumericInput";

export default function GameRule({
    name,
    mode, // Drop down, text input, checkbox, slider, numeric
    style,
    defaultValue,
    minimum=0,
    maximum=10,
    options = [],
    valueError = () => {
        return false;
    },
    onChange = null,
}) {
    const [checkbox, setCheckbox] = useState(false);
    const [text, setText] = useState(defaultValue || "");
    const [numeric, setNumeric] = useState(defaultValue || 1);
    const [slider, setSlider] = useState(defaultValue || 100)
    const [dropdown, setDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const [error, setError] = useState(false);

    // Check for errors given by the user
    useEffect(() => {
        setError(valueError(text));
        const changeEvent = {
            checkbox,
            text,
            numeric,
            selectedOption: options.length > 0 ? options[selectedIndex].title : "",
        }
        if(onChange) onChange(changeEvent)
    }, [checkbox, text, numeric, dropdown, selectedIndex]);

    let modeComponent = (
        <Checkbox
            status={checkbox ? "checked" : "unchecked"}
            onPress={() => setCheckbox(!checkbox)}
        />
    );

    switch (mode) {
        case "dropdown":
            modeComponent = (
                <Menu
                    visible={dropdown}
                    onDismiss={() => setDropdown(false)}
                    anchor={
                        <Pressable
                            onPress={() => setDropdown(true)}
                            style={styles.dropdown}
                        >
                            <HelperText style={styles.dropdownText}>
                                {options[selectedIndex].title}
                            </HelperText>
                            <IconButton
                                icon={dropdown ? "chevron-up" : "chevron-down"}
                                style={styles.iconButton}
                            />
                        </Pressable>
                    }
                >
                    {options.map((o, i) => (
                        <Menu.Item
                            title={o.title}
                            onPress={() => {
                                setSelectedIndex(i);
                                setDropdown(false);
                            }}
                        />
                    ))}
                </Menu>
            );
            break;
        case "text":
            modeComponent = (
                <TextInput
                    style={styles.textInput}
                    value={text}
                    mode="flat"
                    onChangeText={setText}
                />
            );
            break;
        case "toggle":
            break;
        case "slider":
            modeComponent = (
                <View style={styles.sliderContainer}>
                    <Slider
                        value={slider}
                        onValueChange={setSlider}
                        minimumValue={0}
                        maximumValue={1000}
                        minimumTrackTintColor={theme.primary}
                        maximumTrackTintColor={theme.surfaceVariant}
                        thumbTintColor={theme.primary}
                        step={1}
                        style={styles.slider}
                    />
                </View>
            );
            break;
        case "numeric":
            modeComponent = (
                <NumericInput
                    onChange={setNumeric}
                    defaultValue={defaultValue}
                    minimum={minimum}
                    maximum={maximum}
                />
            );
            break;
    }

    return (
        <View style={[styles.container, style]}>
            <HelperText style={styles.name}>{name}</HelperText>
            {modeComponent}
            {error && <HelperText style={styles.error}>{error}</HelperText>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    name: {
        fontWeight: 700,
        fontSize: "0.8rem",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    textInput: {
        width: "100%",
        backgroundColor: theme.background,
        height: "3rem",
        borderRadius: 5
    },
    dropdown: {
        backgroundColor: theme.background,
        padding: 10,
        borderRadius: 5,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dropdownText: {
        color: theme.onBackground,
        fontSize: "1rem",
    },
    iconButton: {
        margin: 0,
    },
    sliderContainer: {
        padding: 10,
        borderRadius: 5,
        backgroundColor: theme.background,
        width: "9rem",
        height: "3rem",
        justifyContent: "center",
        alignItems: "center",
    },
    slider: {


    },

    error: {
        color: theme.static.red,
    },
});
