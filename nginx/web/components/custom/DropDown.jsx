// React native components
import { Platform, View, ScrollView, StyleSheet, Pressable, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Text, HelperText, Icon, IconButton, Button, Menu } from "react-native-paper";

// Hooks
import theme from "../../assets/themes/theme";
import ustyles from "../../assets/styles/ustyles";
import { useState, useRef, useEffect } from "react";
import { useAlert } from "../../utils/alerts";
import { useBanner } from "../../utils/banners";
import { router } from "expo-router";

// Custom components
import ExpandableView from "../custom/ExpandableView";
import GlassyView from "../custom/GlassyView";
import GlassyButton from "../custom/GlassyButton";


export default function DropDown ({
    options,
    onSelect,
    style
}) {

    const [visible, setVisible] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
        onSelect?.(options[selectedIndex])
    }, [selectedIndex])
    
    return (
        <Menu
            visible={visible}
            onDismiss={() => setVisible(false)}
            anchor={
                <Pressable
                    onPress={() => setVisible(true)}
                    style={[styles.dropdown, style]}
                >
                    <HelperText style={styles.dropdownText}>
                        {options[selectedIndex]?.title}
                    </HelperText>
                    <IconButton
                        icon={visible ? "chevron-up" : "chevron-down"}
                        style={styles.iconButton}
                    />
                </Pressable>
            }
        >
            {options.map((o, i) => (
                <Menu.Item
                    title={o?.title}
                    onPress={() => {
                        setSelectedIndex(i);
                        setVisible(false);
                    }}
                    trailingIcon={o?.icon}
                />
            ))}
        </Menu>
    )
}

const styles = StyleSheet.create({
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
})