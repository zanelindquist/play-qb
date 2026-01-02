import { useState } from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { HelperText, Text } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import theme from "../../assets/themes/theme";
import { capitalize } from "../../utils/text";
import NumericInput from "../custom/NumericInput";

const CATEGORY_PERCENTAGES = {
    "science": 25,
    "history": 25,
    "literature": 2,
    "social science": 1,
    "philosophy": 5,
    "religion": 5,
    "mythology": 5,
    "geography": 5,
}

export default function CustomCategories ({
    players, style
}) {
    const [categoryPercentages, setCategoryPercentages] = useState(CATEGORY_PERCENTAGES)

    function handleCategoryToggle() {

    }

    return (
        <View style={[styles.container, style]}>
            {
                Object.entries(CATEGORY_PERCENTAGES).map(([key, value], index) => 
                    <View style={styles.category}>
                        <HelperText>{capitalize(key)}</HelperText>
                        <NumericInput
                            size={0.8}
                            style={styles.numeric}
                            defaultValue={value}
                            onChange={handleCategoryToggle}
                        />
                    </View>
                )
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.background,
        borderRadius: 5,
        padding: 5,
    },
    category: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    numeric: {
        borderLeftWidth: 1,
        borderColor: theme.surfaceContainerHigh
    }
})