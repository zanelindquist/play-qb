import { useEffect, useState } from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { IconButton, HelperText, TextInput } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import theme from "../../assets/themes/theme";


export default function NumericInput ({
    style,
    onChange=null,
    minimum=0,
    maximum=1000,
    defaultValue=1,
    size=1,
    allowTyping=false
}) {
    const [numeric, setNumeric] = useState(defaultValue);

    // If a value is being fed to this through default value
    useEffect(()=> {
        setNumeric(defaultValue)
    }, [defaultValue])

    function handleChange(amount) {
        if(typeof(amount) === "string") amount = parseInt(amount)
        if(isNaN(amount)) return
        setNumeric(amount)
        onChange(amount)
    }

    return (
        <View style={[styles.numeric, style]}>
            <IconButton
                icon={"minus"}
                size={size + "rem"}
                style={[styles.numericBox, styles.numericBoxLeft, {width: 3 * size + "rem", height: 3 * size + "rem"}]}
                onPress={() => handleChange(Math.max(minimum, numeric - 1))}    
            />
            <View style={[styles.numericDisplay, {width: 3 * size + "rem", height: 3 * size + "rem"}]}>
                {
                    allowTyping ?
                    <TextInput
                        style={[styles.numericTextInput, {width: 3 * size + "rem", height: 3 * size + "rem"}]}
                        contentStyle={[styles.numericTextInputText, {fontSize: size + "rem"}]}
                        outlineStyle={styles.numericTextOutlineStyle}
                        keyboardType="numeric"
                        value={defaultValue}
                        onChangeText={(text) => handleChange(text)}
                    />
                    :
                    <HelperText style={[styles.numericText, {fontSize: size + "rem"}]}>
                        {numeric}
                    </HelperText>
                }
                
            </View>
            <IconButton
                icon={"plus"}
                size={size + "rem"}
                style={[styles.numericBox, styles.numericBoxRight, {width: 3 * size + "rem", height: 3 * size + "rem"}]}
                onPress={() => handleChange(Math.min(maximum, numeric + 1))}    
            />
        </View>
    )
}

const styles = StyleSheet.create({
    numeric: {
        flexDirection: "row",
        gap: 0,
    },
    numericBox: {
        // width: "3rem",
        // height: "3rem",
        margin: 0,
        backgroundColor: theme.background,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 0,
    },
    numericBoxLeft: {
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
    },
    numericBoxRight: {
        borderTopRightRadius: 5,
        borderBottomRightRadius: 5,
    },
    numericDisplay: {
        // width: "3rem",
        // height: "3rem",
        backgroundColor: theme.background,
        borderRightWidth: 1,
        borderLeftWidth: 1,
        borderColor: theme.surfaceContainerHighest,
        justifyContent: "center",
        alignItems: "center",
    },
    numericText: {
        // fontSize: "1rem",
    },
    numericTextInput: {
        backgroundColor: "transparent",
        // textAlign: "center",
        padding: 0,
        margin: 0
    },
    numericTextInputText: {
        paddingHorizontal: 0,
        paddingVertical: 0,
    },
    numericTextOutlineStyle: {
        paddingHorizontal: 0,
        paddingVertical: 0,
    }
})