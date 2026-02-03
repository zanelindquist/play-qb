import React, {useEffect, useState, useRef,} from "react";
import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { HelperText, Icon, IconButton, Text,  } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import GlassyView from "../custom/GlassyView";

import theme from "../../assets/themes/theme";
import GradientText from "../custom/GradientText";
import { capitalize } from "../../utils/text";
import ustyles from "../../assets/styles/ustyles";


export default function RankUser ({ style, user, size=100, showDecoration=true }) {
    if(!user) return

    return (
        <View

        >
            <View style={styles.profileDisplay}>
                <View style={[styles.iconCircle, { height: size, width: size,}]}>
                    <Icon size={100 * 0.75} source={"account"} style={styles.icon} color={theme.onPrimary}/>
                </View>

                <HelperText style={[ustyles.text.title]}>{user?.username}</HelperText>

            </View>
        </View>
    )

}

const styles = StyleSheet.create({
    profileDisplay: {
        padding: 20,
        gap: 20,
        alignItems: "center"
    },
    iconCircle: {
        backgroundColor: theme.primary,
        borderRadius: "50%",
        justifyContent: "center",
        alignItems: "center",
    },
    icon: {
    
    },
});
