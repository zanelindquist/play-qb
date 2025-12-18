import themeData from "./earthy.json"
import universalThemeDate from "./universal.json"

const themeMode = "dark"

let theme = {};

// For different theme formats
if (themeData.schemes) {
    theme = themeData.schemes[themeMode];
    theme.palettes = themeData.palettes;
} else {
    theme = themeData[themeMode]?.colors
}

// Add constant colors
let universal = universalThemeDate[themeMode].colors
theme.static = universal
theme.gradients = universalThemeDate[themeMode].gradients

export default theme