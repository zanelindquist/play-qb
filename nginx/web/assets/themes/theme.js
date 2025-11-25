import themeData from "./rise.json"
import universalThemeDate from "./universal.json"

const themeMode = "light"

let theme = themeData[themeMode].colors
const universal = universalThemeDate[themeMode].colors

theme.static = universal

export default theme