// config.ts or backend.ts
const ENV = process.env.NODE_ENV === "production" ? "production" : "development";

const BACKEND_URL =
  ENV === "production"
    ? "https://morequizbowl.com"      // your live backend
    : "http://localhost";    // local/dev backend

console.log("Running in", ENV, "backend:", BACKEND_URL);

// Lobbies and Gamemodes
const CURATED_LOBBIES = [
    {
        name: "solos",
        alias: "Solos",
        description: "Take on opponents in quiz bowl solos. Only tossups.",
        icon: "account",
    },
    {
        name: "duos",
        alias: "Duos",
        description: "Partner up to take on other teams. Classic mode with bonuses.",
        icon: "account-multiple",
    },
    {
        name: "5v5",
        alias: "5v5",
        description: "Full quiz bowl game against other players online.",
        icon: "account-group",
    },
    {
        name: "custom",
        alias: "Create",
        description: "Create a custom game and play with your friends.",
        icon: "hammer-wrench",
    },
    {
        name: "ranked",
        alias: "Ranked",
        description: "Test your skill against other players and climb up the global leaderboard.",
        icon: "medal",
    },
    {
        name: "middleschool",
        alias: "Middle School",
        description: "Middle school difficulty lobby.",
        icon: "school",
    },
    {
        name: "highschool",
        alias: "High School",
        description: "High school difficulty lobby.",
        icon: "school",
    },
    {
        name: "college",
        alias: "College",
        description: "College difficulty lobby.",
        icon: "school",
    },
    {
        name: "open",
        alias: "Open",
        description: "Open difficulty lobby.",
        icon: "earth",
    },
    {
        name: "highschool-science",
        alias: "High School Science",
        description: "High school science questions.",
        icon: "flask",
    },
    {
        name: "highschool-history",
        alias: "High School History",
        description: "High school history questions.",
        icon: "book-open",
    },
    {
        name: "highschool-literature",
        alias: "High School Literature",
        description: "High school literature questions.",
        icon: "book",
    },
    {
        name: "highschool-philosophy",
        alias: "High School Philosophy",
        description: "High school philosophy questions.",
        icon: "brain",
    },
    {
        name: "college-science",
        alias: "College Science",
        description: "College science questions.",
        icon: "flask",
    },
    {
        name: "college-history",
        alias: "College History",
        description: "College history questions.",
        icon: "book-open",
    },
    {
        name: "college-literature",
        alias: "College Literature",
        description: "College literature questions.",
        icon: "book",
    },
    {
        name: "college-philosophy",
        alias: "College Philosophy",
        description: "College philosophy questions.",
        icon: "brain",
    },
];
const GAMEMODES = [
    {
        name: "solos",
        description: "Take on opponents in quiz bowl solos. Only tossups.",
        icon: "account",
    },
    {
        name: "duos",
        description: "Partner up to take on other teams. Classic mode with bonuses.",
        icon: "account-multiple",
    },
    {
        name: "5v5",
        description: "Full quiz bowl game against other players online.",
        icon: "account-group",
    },
];
const CATEGORIES = [
    { id: "global", title: "Global" },
    { id: "science", title: "Science" },
    { id: "history", title: "History" },
    { id: "literature", title: "Literature" },
    { id: "social science", title: "Social Science" },
    { id: "philosophy", title: "Philosophy" },
    { id: "religion", title: "Religion" },
    { id: "mythology", title: "Mythology" },
    { id: "geography", title: "Geography" },
    { id: "current events", title: "Current Events" }, 
    { id: "fine arts", title: "Fine Arts" },
];
const RANK_COLORS = {
    "Dirt I": "#8A6837", "Dirt II": "#7A5B30", "Dirt III": "#6B4F2A",
    "Plastic I": "#8EA1B1", "Plastic II": "#7E909F", "Plastic III": "#6E7F8D",
    "Tin I": "#B3B3B3", "Tin II": "#A0A0A0", "Tin III": "#8E8E8E",
    "Bronze I": "#BF7A39", "Bronze II": "#A66A32", "Bronze III": "#8C5A2B",
    "Silver I": "#C9D2DB", "Silver II": "#B4BCC4", "Silver III": "#9FA6AD",
    "Gold I": "#F5CD30", "Gold II": "#E0B82C", "Gold III": "#C9A227",
    "Diamond I": "#5FE6F7", "Diamond II": "#4ED0E0", "Diamond III": "#3FB8C6",
    "Immortal I": "#CB8AFF", "Immortal II": "#B86BFF", "Immortal III": "#A64DFF"
};

// Game
const STANDARD_ANSWER_MS = 7000
const STANDARD_MS_UNTIL_DEAD = 6000


export { BACKEND_URL, ENV, CURATED_LOBBIES, GAMEMODES, CATEGORIES, RANK_COLORS, STANDARD_ANSWER_MS, STANDARD_MS_UNTIL_DEAD };