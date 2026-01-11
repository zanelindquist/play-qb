import random
import string

COLORS = [
    "#3B82F6",  # Royal Blue
    "#DC2626",  # Crimson Red
    "#F4C430",  # Golden Yellow
    "#10B981",  # Emerald Green
    "#6366F1",  # Purple Indigo
    "#06B6D4",  # Teal Cyan
    "#EA580C",  # Burnt Orange
    "#DB2777",  # Magenta Pink
    "#64748B",  # Slate Gray
    "#92400E",  # Deep Brown
]

PEOPLE = [
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
VERBS = [
    "running","walking","jumping","climbing","falling","flying","swimming","diving","drifting","sliding",
    "thinking","dreaming","planning","scheming","plotting","calculating","measuring","testing","experimenting","analyzing",
    "building","breaking","fixing","repairing","crafting","forging","welding","assembling","constructing","designing",
    "coding","debugging","compiling","executing","hacking","encrypting","decrypting","processing","rendering","simulating",
    "teaching","learning","studying","training","practicing","coaching","mentoring","guiding","explaining","questioning",
    "fighting","battling","charging","retreating","blocking","dodging","parrying","attacking","defending","ambushing",
    "singing","dancing","playing","jamming","performing","acting","directing","improvising","rehearsing","composing",
    "traveling","wandering","exploring","roaming","trekking","marching","sneaking","escaping","chasing","tracking"
];
NOUNS = [
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

def generate_unique_hash(length=16):
    """Generate a unique hash consisting of uppercase and lowercase letters."""
    return ''.join(random.choices(string.ascii_letters, k=length))

def get_hex_color(index: int) -> str:
    if not index:
        return random.choices(COLORS, k=1)[0]
    else:
        return COLORS[index]
    
def generate_random_lobby_name():
    first = random.choices(PEOPLE, k=1)[0]
    second = random.choices(VERBS, k=1)[0]
    third = random.choices(NOUNS, k=1)[0]
    return f"{first}-{second}-{third}"
