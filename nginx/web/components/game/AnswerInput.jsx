import React, {useEffect, useState, useRef} from "react";
import { Platform, View, StyleSheet, Pressable, TextInput } from "react-native";
import { BlurView } from "expo-blur";
import { Text,  } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";

import theme from "../../assets/themes/theme";

// TODO: Hover for stat tooltip

export default function AnswerInput ({ style, disabled, onChange = () => {}, onSubmit = () => {} }) {
    const inputRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    const [value, setValue] = useState("")
    
    const handleChange = (e) => {
        onChange(e.nativeEvent.text)
        setValue(e.nativeEvent.text)
    }
    
    const handleSubmit = (e) => {
        setValue("")
        onSubmit(e.nativeEvent.text)
    }

    useEffect(() => {
        if (!disabled) {
        inputRef.current?.focus();
        }
    }, [disabled]);

    return (
        <GlassyView style={[styles.container, style]}>
            <TextInput
                ref={inputRef}
                mode="outlined"
                style={[
                    styles.input,
                    isFocused && styles.focused
                ]}
                onChange={handleChange}
                onSubmitEditing={handleSubmit}
                disabled={disabled}
                value={value}

                // value={value}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
        </GlassyView>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10
    },
    input: {
        outlineWidth: 0,
        padding: 10,
        color: theme.onBackground
    },
    focused: {
        
    }
})