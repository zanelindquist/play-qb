import themeData from "./royal.json"
import universalThemeDate from "./universal.json"

const themeMode = "light"

let theme = themeData[themeMode].colors
let universal = universalThemeDate[themeMode].colors

theme.static = universal
theme.gradients = universalThemeDate[themeMode].gradients

export default theme