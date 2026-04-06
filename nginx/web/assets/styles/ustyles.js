// Universal Styles

import { StyleSheet } from "react-native";
import theme from "../themes/theme";

export default {
    // Container styles/nesting
    flex: StyleSheet.create({
        flexRow: {
            flexDirection: "row",
            gap: 10,
            flexWrap: "wrap"
        },
        flexRowSpaceBetween: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        flexRowSpaceBetweenNoAlign: {
            flexDirection: "row",
            justifyContent: "space-between",
        },
        flexColumn: {
            flexDirection: "column",
            gap: 20
        },
        flexColumnSpaceBetween: {
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%"
        },
        flexColumnSpaceBetweenCenter: {
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            height: "100%"
        },
        flexColumnCenterItems: {
            flexDirection: "column",
            alignItems: "center",
            gap: 10
        },
    }),
    // Text styles, sizes
    text: StyleSheet.create({
        massive: {
            fontSize: 40,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 50,
            textShadowColor: "rgba(0,0,0,0.5)",
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
        },
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
        },
        center: {
            textAlign: "center"
        },
        left: {
            textAlign: "left",
            width: "100%"
        }
    }),
    icon: StyleSheet.create({
        icon: {
            height: 30,
            width: 30,
            borderRadius: 999,
            backgroundColor: theme.onPrimary
        },
        plain: {
            backgroundColor: "transparent"
        }
    }),
    modals: StyleSheet.create({
        floatingModal: {
            backgroundColor: "transparent",
            borderColor: "transparent",
            borderWidth: 0,
            padding: 0,
            margin: 0
        }
    })
}