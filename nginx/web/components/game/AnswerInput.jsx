import React, {useEffect, useState, useRef} from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Text, TextInput } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";

// TODO: Hover for stat tooltip

export default function AnswerInput ({ style, disabled, content, onChange = () => {}, onSubmit = () => {} }) {
    const inputRef = useRef(null);
    
    const handleChange = (text) => {
        onChange(text)
    }

    useEffect(() => {
        window.addEventListener("keypress", (e) => {
            if(e.key === "Enter"){
                onSubmit()
            }
        })
    }, [])

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
                style={styles.input}
                onChange={handleChange}
                disabled={disabled}
                autoFocus={false}
            />
        </GlassyView>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10
    },
    input: {
        backgroundColor: "transparent",
        outlineWidth: 0
    }
})