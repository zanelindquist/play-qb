import { useEffect, useState } from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import {
    Button,
    Checkbox,
    HelperText,
    IconButton,
    Menu,
    Switch,
    Text,
    TextInput,
} from "react-native-paper";
import Slider from '@react-native-community/slider';
import GlassyButton from "../custom/GlassyButton";
import theme from "../../assets/themes/theme";
import NumericInput from "../custom/NumericInput";

export default function GameRule({
    name,
    mode, // Drop down, text input, checkbox, slider, numeric
    style,
    disabled=false,
    defaultValue=undefined,
    minimum=0,
    maximum=10,
    options = [],
    valueError = null,
    onChange = null,
}) {
    const [checkbox, setCheckbox] = useState(false);
    const [text, setText] = useState(defaultValue || "");
    const [numeric, setNumeric] = useState(defaultValue || 1);
    const [slider, setSlider] = useState(defaultValue || 100);
    const [switchOn, setSwitchOn] = useState(defaultValue);
    const [dropdown, setDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(defaultValue || 0);

    const [error, setError] = useState(false);

    // Trigger our change object
    useEffect(() => {
        // Check for errors given by the user
        if(valueError) setError(valueError(text));
        const changeEvent = {
            checkbox,
            text,
            numeric,
            slider,
            switch: switchOn,
            selectedOption: options.length > 0 ? options[selectedIndex].title : "",
        }
        if(onChange) onChange(changeEvent)
    }, [checkbox, text, numeric, dropdown, selectedIndex, slider, switchOn]);

    let modeComponent = (
        <Checkbox
            status={checkbox ? "checked" : "unchecked"}
            onPress={() => setCheckbox(!checkbox)}
            disabled={disabled}
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
                            disabled={disabled}
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
                    textColor={theme.inverseSurface}
                    value={text}
                    mode="flat"
                    onChangeText={setText}
                    disabled={disabled}
                />
            );
            break;
        case "switch":
            modeComponent = (
                <View
                    style={styles.switchContainer}
                >
                    <Switch 
                        value={switchOn}
                        onValueChange={setSwitchOn}
                        style={styles.switch}
                        disabled={disabled}
                        trackColor={{
                            false: theme.onSurface,
                            true: disabled ? theme.surfaceVariant : theme.surfaceVariant,
                        }}
                    />
                </View>
            );
            break;
        case "slider":
            modeComponent = (
                <View style={styles.sliderContainer}>
                    <Slider
                        value={slider}
                        onValueChange={setSlider}
                        minimumValue={minimum}
                        maximumValue={maximum}
                        minimumTrackTintColor={theme.primary}
                        maximumTrackTintColor={theme.surfaceVariant}
                        thumbTintColor={theme.primary}
                        step={1}
                        style={styles.slider}
                        disabled={disabled}
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
                    disabled={disabled}
                />
            );
            break;
    }

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.name}>{name}</Text>
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
        marginVertical: 10,
        fontWeight: 700,
        fontSize: "0.8rem",
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    textInput: {
        width: "100%",
        backgroundColor: theme.surface,
        height: "3rem",
        borderRadius: 5
    },
    dropdown: {
        backgroundColor: theme.surface,
        padding: 10,
        borderRadius: 5,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dropdownText: {
        color: theme.onSurface,
        fontSize: "1rem",
    },
    iconButton: {
        margin: 0,
    },
    sliderContainer: {
        padding: 10,
        borderRadius: 5,
        backgroundColor: theme.surface,
        width: "9rem",
        height: "3rem",
        justifyContent: "center",
        alignItems: "center",
    },
    slider: {
        width: '100%',
    },
    switchContainer: {
        width: "3rem",
        height: "3rem",
        borderRadius: 5,
        backgroundColor: theme.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    switch: {

    },


    error: {
        color: theme.static.red,
    },
});
