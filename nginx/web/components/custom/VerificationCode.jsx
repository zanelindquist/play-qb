// React native components
import { Platform, View, ScrollView, StyleSheet, Pressable, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton, Button, TextInput } from "react-native-paper";

// Hooks
import theme from "../../assets/themes/theme";
import ustyles from "../../assets/styles/ustyles";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";
import { router } from "expo-router";

// Custom components
import ExpandableView from "../custom/ExpandableView";
import GlassyView from "../custom/GlassyView";
import GlassyButton from "../custom/GlassyButton";


export default function VerificationCode({
    size=6,
    onCodeInput=null,
    style
}) {
    const six = [0,0,0,0,0,0]
    const [selectedBox, setSelectedBox] = useState(0)
    const [hoveredBox, setHoveredBox] = useState()
    const [code, setCode] = useState("")
    const textInputRef = useRef();

    useEffect(() => {

        return () => {
            textInputRef.current?.blur();
        };
    }, []);

    useEffect(() => {
        if(code.length === size) {
            if(onCodeInput) onCodeInput(code)
        }
    }, [code])

    function handleChange(text) {
        if (/^\d*$/.test(text) && text.length <= size) {
            setCode(text);
        }
    }


    return (
        <View style={[styles.container, style]}>
        {six.map((_, index) => 
            <Pressable
                style={[styles.box, index == hoveredBox && styles.hoverBox]}
                key={index}
                onPress={() => textInputRef.current.focus()}
            >
                <HelperText style={[styles.number, ustyles.text.shadowText]}>{code[index]}</HelperText>
            </Pressable>
        )}
            <TextInput
                value={code}
                ref={textInputRef}
                onChangeText={handleChange}
                style={{
                    position: "absolute",
                    opacity: 0,
                    width: 1,
                    height: 1,
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: 425,
        gap: 10,
        margin: 20
    },
    box: {
        flex: 1,
        height: 80,
        borderWidth: 3,
        borderColor: theme.elevation.level2,
        borderRadius: 10,
        backgroundColor: "rgba(0,0,0,0.1)",
        justifyContent: "center",
        alignItems: "center"
    },
    hoverBox: {
        backgroundColor: "rgba(0,0,0,0.0)"
    },
    selectedBox: {
        borderColor: theme.primary,
        backgroundColor: "rgba(0,0,0,0.0)"
    },
    number: {
        fontSize: 50,
        color: theme.primary
    }
})