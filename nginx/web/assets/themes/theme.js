import themeData from "./earthy.json";
import universalThemeDate from "./universal.json";

import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

const themeMode = "dark"; // "light" | "dark"

// Pick base Paper theme
const basePaperTheme = themeMode === "dark" ? MD3DarkTheme : MD3LightTheme;

let customTheme = {};
let palettes = {};

// Handle Material Theme Builder vs custom format
if (themeData.schemes) {
    customTheme = themeData.schemes[themeMode];
    palettes = themeData.palettes;
} else {
    customTheme = themeData[themeMode]?.colors ?? {};
}

// Universal colors & gradients
const universal = universalThemeDate[themeMode].colors;
const gradients = universalThemeDate[themeMode].gradients;

const theme = {
    ...customTheme,

    // Needed for some paper components
    elevation: {
        level0: customTheme.surface,
        level1: customTheme.surfaceContainerLow,
        level2: customTheme.surfaceContainer,
        level3: customTheme.surfaceContainerHigh,
        level4: customTheme.surfaceContainerHighest,
        level5: customTheme.surfaceContainerHighest,
    },

    // Preserve your custom additions
    palettes,
    static: universal,
    gradients,
};

export default theme;
