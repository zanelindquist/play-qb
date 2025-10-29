import themeData from "./royal.json"
import universalThemeDate from "./universal.json"

const themeMode = "dark"

let theme = themeData[themeMode].colors
const universal = universalThemeDate[themeMode].colors

theme.static = universal

export default theme