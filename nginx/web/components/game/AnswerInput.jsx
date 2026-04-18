import React, {useEffect, useState, useRef, forwardRef, useImperativeHandle} from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { IconButton, Text, TextInput  } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";

import theme from "../../assets/themes/theme";
import ustyles from "../../assets/styles/ustyles.js";

// TODO: Hover for stat tooltip

export default forwardRef(function AnswerInput ({ style, disabled, visible=true, lastAnswer, submitAfterMs, onChange = () => {}, onSubmit = () => {}, isChatMode = false }, ref) {
    const inputRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    const [value, setValue] = useState("")
    // Logical live values
    const valueRef = useRef(value);
    const hasSubmittedRef = useRef(false);
    const submissionTimeoutRef = useRef(null)
    // Mostly to tell mobile users if their answer is correct or not
    const [flashColor, setFlashColor] = useState(null)
    const [showCheck, setShowCheck] = useState(null)
    
    useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current?.focus();
        }
    }));

    useEffect(() => {
        valueRef.current = value;
    }, [value]);
    
    const handleChange = (text) => {
        onChange(text)
        setValue(text)
    }
    
    const handleSubmit = async (e) => {
        const accepted = await onSubmit(e.nativeEvent.text)
        if (accepted !== false) {
            setValue("")
            hasSubmittedRef.current = true
            inputRef.current?.blur();
            clearTimeout(submissionTimeoutRef.current)
            submissionTimeoutRef.current = null;
        }
    }

    useEffect(() => {
        if(isChatMode) {
            hasSubmittedRef.current = false
            setValue("")
        }
        else if (!disabled && !isChatMode) {
            inputRef.current?.focus();
            hasSubmittedRef.current = false
            if(!hasSubmittedRef.current) {
                submissionTimeoutRef.current = setTimeout(() => {
                    if(!hasSubmittedRef.current) {
                        onSubmit(valueRef.current)
                        hasSubmittedRef.current = true
                        setValue("")
                        inputRef.current.blur();
                    }
                }, submitAfterMs)
            }
        }
    }, [disabled, isChatMode]);

    useEffect(() => {
        setFlashColor(lastAnswer == "correct" ? theme.static.correct : (lastAnswer == "incorrect" ? theme.static.wrong : (lastAnswer == "prompt" ? theme.static.prompt : null)))
        setShowCheck(lastAnswer == "correct" ? "check" : (lastAnswer == "incorrect" ? "close" : (lastAnswer == "prompt" ? "sync" : null)))
        const timeout = setTimeout(() => {
            setFlashColor(null)
            setShowCheck(null)
        }, 1000)

        return () => clearTimeout(timeout)
    }, [lastAnswer])

    if(!visible) return

    return (
        <GlassyView
            style={[styles.container, style]}
            gradient={ false && {
                colors: [flashColor, flashColor],
                start: {x: 0, y: 1},
                end: {x: 0, y: 1},
            }}
        >
            <TextInput
                ref={inputRef}
                mode="outlined"
                placeholder={isChatMode ? "Send a message..." : "Your answer..."}
                placeholderTextColor={isChatMode ? "rgba(255, 255, 255, 0.7)" : undefined}
                style={[
                    styles.input,
                    isFocused && styles.focused,
                    isChatMode && styles.chatMode
                ]}
                outlineStyle={{borderWidth: 0}}
                onChangeText={handleChange}
                onSubmitEditing={handleSubmit}
                disabled={disabled}
                value={value}

                // value={value}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}

                right={
                    showCheck &&
                    <TextInput.Icon
                        icon={showCheck}
                        style={{backgroundColor: flashColor}}
                    />
                }
            />
        </GlassyView>
    )
})

const styles = StyleSheet.create({
    container: {
        marginTop: 10
    },
    input: {
        outlineWidth: 0,
        padding: 10,
        color: theme.onBackground,
        backgroundColor: "transparent",
        height: 40
    },
    focused: {
        
    },
    chatMode: {
        ...ustyles.text.textShadow,
        color: "white"
    }
})