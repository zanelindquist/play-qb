// Universal Styles

import { StyleSheet } from "react-native";
import theme from "../themes/theme";

export default {
    // Container styles/nesting
    flex: StyleSheet.create({
        flexRowSpaceBetween: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        flexColumn: {
            flexDirection: "column",
            gap: 20
        },
        flexColumnCenterItems: {
            flexDirection: "column",
            alignItems: "center",
            gap: 10
        },
    }),
    // Text styles, sizes
    text: StyleSheet.create({
        title: {
            fontSize: 30
        },
        header: {
            fontSize: 20,
        },
        text: {
            fontSize: 15
        },
        shadowText: {
            textShadowColor: "rgba(0,0,0,0.8)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
        }
    }),
    icon: StyleSheet.create({
        icon: {
            height: 30,
            width: 30,
            borderRadius: 999,
            backgroundColor: theme.onPrimary
        }
    }),
    modals: StyleSheet.create({
        floatingModal: {
            backgroundColor: "transparent",
            borderWidth: 0,
            padding: 0,
        }
    })
}