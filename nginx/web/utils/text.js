const CURSE_WORDS = [
    // Replaces stretched words
    "fuck",
    "shit",
    "bitch",
    "ashole",
    "dick",
    "cunt",
    "niger",
    "niga",
    "cum",
    "tit",
    "tity",
    "bob",
    "penis",
    "cock",
    "vigina",
    "pusy",
];

const PEOPLE = [
    "scientist","driver","preacher","engineer","teacher","student","doctor","nurse","surgeon","medic",
    "pilot","captain","sailor","navigator","explorer","adventurer","cartographer","astronaut","cosmonaut","physicist",
    "chemist","biologist","geologist","mathematician","statistician","programmer","developer","coder","hacker","analyst",
    "designer","architect","builder","carpenter","plumber","electrician","mechanic","technician","operator","machinist",
    "farmer","rancher","gardener","botanist","florist","beekeeper","forester","lumberjack","fisherman","angler",
    "hunter","tracker","scout","ranger","warden","zoologist","ecologist","herpetologist","ornithologist","entomologist",
    "scatologist","pathologist","radiologist","neurologist","psychiatrist","psychologist","therapist","counselor","mentor","coach",
    "athlete","runner","sprinter","jumper","climber","swimmer","diver","cyclist","skater","surfer",
    "boxer","wrestler","fighter","martialartist","sensei","trainer","referee","umpire","judge","official",
    "actor","actress","performer","comedian","clown","mime","juggler","magician","illusionist","ventriloquist",
    "musician","guitarist","pianist","violinist","drummer","singer","vocalist","rapper","composer","conductor",
    "artist","painter","sculptor","illustrator","animator","cartoonist","calligrapher","graffitist","designer","stylist",
    "writer","author","novelist","poet","essayist","journalist","reporter","editor","critic","blogger",
    "librarian","archivist","curator","historian","anthropologist","archaeologist","sociologist","philosopher","theologian","ethicist",
    "preacher","pastor","minister","monk","friar","cleric","chaplain","missionary","evangelist","prophet",
    "king","queen","prince","princess","duke","lord","baron","knight","squire","paladin",
    "warrior","soldier","infantryman","sniper","medic","commander","general","strategist","tactician","mercenary",
    "spy","agent","operative","detective","investigator","inspector","sleuth","marshal","sheriff","deputy",
    "lawyer","attorney","barrister","solicitor","paralegal","judge","clerk","notary","advocate","prosecutor",
    "merchant","trader","vendor","peddler","salesman","broker","investor","banker","financier","economist"
];
const VERBS = [
    "running","walking","jumping","climbing","falling","flying","swimming","diving","drifting","sliding",
    "thinking","dreaming","planning","scheming","plotting","calculating","measuring","testing","experimenting","analyzing",
    "building","breaking","fixing","repairing","crafting","forging","welding","assembling","constructing","designing",
    "coding","debugging","compiling","executing","hacking","encrypting","decrypting","processing","rendering","simulating",
    "teaching","learning","studying","training","practicing","coaching","mentoring","guiding","explaining","questioning",
    "fighting","battling","charging","retreating","blocking","dodging","parrying","attacking","defending","ambushing",
    "singing","dancing","playing","jamming","performing","acting","directing","improvising","rehearsing","composing",
    "traveling","wandering","exploring","roaming","trekking","marching","sneaking","escaping","chasing","tracking"
];
const NOUNS = [
    "apple","river","mountain","computer","city","dog","car","house","tree","book",
    "phone","music","chair","table","window","road","cloud","star","ocean","beach",
    "school","teacher","student","paper","pen","clock","door","wall","floor","ceiling",
    "sun","moon","planet","galaxy","universe","forest","field","garden","flower","grass",
    "bread","water","coffee","tea","milk","cheese","butter","salt","sugar","honey",
    "friend","family","parent","child","brother","sister","neighbor","stranger","enemy","hero",
    "idea","thought","dream","memory","story","history","future","past","moment","second",
    "game","sport","team","player","coach","ball","score","match","tournament","season",
    "movie","film","actor","actress","director","scene","script","camera","screen","theater",
    "song","album","artist","band","guitar","piano","drum","violin","melody","rhythm",
    "painting","sculpture","museum","gallery","art","design","pattern","color","shape","form",
    "science","physics","chemistry","biology","math","number","equation","formula","theory","experiment",
    "engine","machine","device","tool","robot","software","hardware","network","server","database",
    "website","application","program","code","function","variable","object","array","string","boolean",
    "job","career","office","company","business","market","economy","money","price","cost",
    "store","shop","restaurant","cafe","menu","kitchen","recipe","ingredient","dish","meal",
    "trip","journey","travel","flight","train","station","airport","hotel","room","luggage",
    "country","nation","state","city","village","street","avenue","bridge","tower","building",
    "law","rule","policy","government","leader","president","minister","election","vote","citizen",
    "emotion","feeling","happiness","sadness","anger","fear","love","hope","trust","peace"
];


function random(max=1, min=0) {
    return Math.floor(Math.random() * (max - min) + min)
}

function detectCurseWords(text) {
    const normalized = text
        .toLowerCase()
        .replace(/(.)\1+/g, "$1")
        .replace(/[@]/g, "a")
        .replace(/[!|]/g, "i")
        .replace(/[3]/g, "e")
        .replace(/[0]/g, "o")
        .replace(/[$]/g, "s")
        .replace(/[+]/g, "t")
        .replace(/[^a-z]/g, "");

    return CURSE_WORDS.some((word) => normalized.includes(word));
}

function allowLobbyName(text) {
    if(text === "" || text.length > 40 || detectCurseWords(text)) return false
    return !/\s/.test(text);
}

function generateRandomLobbyName() {
    const first = PEOPLE[random(PEOPLE.length)]
    const second = VERBS[random(VERBS.length)]
    const third = NOUNS[random(NOUNS.length)]
    return `${first}-${second}-${third}`
}

function capitalize(text) {
    if(!text) return "Undefined"
    return text.split("")[0].toUpperCase() + text.split("").slice(1).join("")
}

const allowUsername = allowLobbyName

export { detectCurseWords, generateRandomLobbyName, capitalize, allowLobbyName, allowUsername };
