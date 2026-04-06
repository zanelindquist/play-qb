// config.ts or backend.ts
const ENV = process.env.NODE_ENV === "production" ? "production" : "development";

const BACKEND_URL =
  ENV === "production"
    ? "https://morequizbowl.com"      // your live backend
    : "http://localhost";    // local/dev backend

console.log("Running in", ENV, "backend:", BACKEND_URL);

const CURATED_LOBBIES = [
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
    {
        name: "custom",
        description: "Create a custom game and play with your friends.",
        icon: "hammer-wrench",
    },
    {
        name: "ranked",
        description: "Test your skill against other players and climb up the global leaderboard.",
        icon: "medal",
    },
    {
        name: "middleschool",
        description: "Middle school difficulty lobby.",
        icon: "school",
    },
    {
        name: "highschool",
        description: "High school difficulty lobby.",
        icon: "school",
    },
    {
        name: "college",
        description: "College difficulty lobby.",
        icon: "school",
    },
    {
        name: "open",
        description: "Open difficulty lobby.",
        icon: "earth",
    },
    {
        name: "highschool-science",
        description: "High school science questions.",
        icon: "flask",
    },
    {
        name: "highschool-history",
        description: "High school history questions.",
        icon: "book-open",
    },
    {
        name: "highschool-literature",
        description: "High school literature questions.",
        icon: "book",
    },
    {
        name: "highschool-philosophy",
        description: "High school philosophy questions.",
        icon: "brain",
    },
    {
        name: "college-science",
        description: "College science questions.",
        icon: "flask",
    },
    {
        name: "college-history",
        description: "College history questions.",
        icon: "book-open",
    },
    {
        name: "college-literature",
        description: "College literature questions.",
        icon: "book",
    },
    {
        name: "college-philosophy",
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

export { BACKEND_URL, ENV, CURATED_LOBBIES, GAMEMODES };