// The ship's company: two-and-thirty hands under you, each with a name, a
// rating, an age and a watch.
//
// A whaleship's crew was the most mixed afloat. New Bedford and Nantucket
// families, Azoreans and Cape Verdeans shipped on the outward passage, Black
// New Englanders, Wampanoag men from Gay Head and the Vineyard, and islanders
// taken up in the Pacific on earlier voyages. The names below are drawn from
// the ordinary given names and family names of those communities in the
// 1840s. They are plausible, not particular: no man here is meant to be any
// real person, and nothing is quoted from any crew list.
//
// You are the master, and are not one of them. A crew list of the period names
// the master separately from the hands he ships. The Morgan's crews averaged
// three-and-thirty souls all told -- see MORGAN.md.

const NAMES = [
  { weight: 5,   // New England whaling families
    given: ['Obed', 'Seth', 'Ezra', 'Nathan', 'Amos', 'Elias', 'Jabez', 'Reuben',
            'Silas', 'Zenas', 'Peleg', 'Owen', 'Josiah', 'Caleb', 'Enoch', 'Gideon',
            'Hiram', 'Lemuel', 'Barzillai', 'Shubael', 'Tristram', 'Abner'],
    family: ['Coffin', 'Starbuck', 'Macy', 'Folger', 'Swain', 'Chase', 'Hussey',
             'Gardner', 'Bunker', 'Worth', 'Pease', 'Luce', 'Mayhew', 'Daggett',
             'Norton', 'Tilton', 'Nickerson', 'Snow', 'Hallett', 'Doane', 'Crowell',
             'Barnard', 'Coleman', 'Wyer', 'Paddack'] },

  { weight: 3,   // Azores and Cape Verde, as the names were written down here
    given: ['Manuel', 'Antone', 'José', 'John', 'Frank', 'Joseph', 'Antonio', 'Domingo'],
    family: ['Silva', 'Rose', 'Correia', 'Fortes', 'Sylvia', 'Lopes', 'Gomes',
             'Perry', 'Duarte', 'Ramos', 'Vieira', 'Tavares', 'Andrade'] },

  { weight: 2,   // Black New England, chiefly New Bedford
    given: ['Samuel', 'Isaac', 'Lewis', 'Alfred', 'William', 'Henry', 'David', 'Charles'],
    family: ['Freeman', 'Johnson', 'Cuffe', 'Wainer', 'Phelps', 'Grimes', 'Hazzard',
             'Piper', 'Bailey', 'Randall', 'Rodman'] },

  { weight: 2,   // Wampanoag, from Gay Head and the Vineyard
    given: ['Thomas', 'Simon', 'Zaccheus', 'Aaron', 'Joel', 'Ephraim', 'Solomon'],
    family: ['Belain', 'Devine', 'Cooper', 'Weeks', 'Francis', 'Jeffers', 'Peters',
             'Salisbury', 'Wamsley'] },

  { weight: 1,   // shipped in the Pacific on an earlier voyage
    given: ['Kanoa', 'Keoni', 'Mahoe', 'Nahoa', 'Pikai', 'Kahele', 'Manu'],
    family: ['', '', '', ''] }        // often entered under one name only
];

const pick = (a) => a[Math.floor(Math.random() * a.length)];

function nameMaker() {
  const bag = [];
  for (const g of NAMES) for (let i = 0; i < g.weight; i++) bag.push(g);
  const used = new Set();

  return function name() {
    for (let tries = 0; tries < 40; tries++) {
      const g = pick(bag);
      const f = pick(g.family);
      const made = f ? `${pick(g.given)} ${f}` : pick(g.given);
      if (!used.has(made)) { used.add(made); return made; }
    }
    return `${pick(pick(bag).given)} ${used.size}`;
  };
}

// What she ships, and in what numbers. Two-and-thirty hands under you, which
// with yourself makes the three-and-thirty a whaleship of her size averaged.
//
// Seven-and-twenty of them keep watches. The other five are
// idlers: they work through the day at their trades and keep no night watch
// at all, which is what the word meant -- not that they were idle, but that
// they did not stand a watch. They turn out with everyone else when all hands
// are called.
const BERTHS = [
  { berth: 'First mate',    rate: 'mate',            station: 'the deck',   n: 1 },
  { berth: 'Second mate',   rate: 'mate',            station: 'the deck',   n: 1 },
  { berth: 'Third mate',    rate: 'mate',            station: 'the deck',   n: 1 },
  { berth: 'Boatsteerer',   rate: 'boatsteerer',     station: 'topman',     n: 4 },
  { berth: 'Foremast hand', rate: 'able seaman',     station: 'topman',     n: 6 },
  { berth: 'Foremast hand', rate: 'ordinary seaman', station: 'afterguard', n: 7 },
  { berth: 'Foremast hand', rate: 'green hand',      station: 'waister',    n: 7 },

  { berth: 'Cooper',    rate: 'tradesman',  idler: 'the casks',        n: 1 },
  { berth: 'Carpenter', rate: 'tradesman',  idler: 'her woodwork',     n: 1 },
  { berth: 'Cook',      rate: 'tradesman',  idler: 'the coppers',      n: 1 },
  { berth: 'Steward',   rate: 'tradesman',  idler: 'the cabin',        n: 1 },
  { berth: 'Cabin boy', rate: 'green hand', idler: 'fetching and carrying', n: 1 }
];

const STRENGTH = ['weak', 'middling', 'middling', 'strong'];

// How old they were. On the Morgan's first voyage out of New Bedford in 1841
// she carried thirty hands and twelve of them were between fifteen and
// nineteen -- a whaleship was crewed largely by boys, and that is the single
// most surprising true thing about her. Her master that voyage was thirty-four.
// Documented; the spread within each rating is inferred.
const YEARS = {
  'Cabin boy': [13, 16],
  mate: [26, 42],
  boatsteerer: [21, 33],
  tradesman: [24, 48],
  'able seaman': [20, 32],
  'ordinary seaman': [17, 23],
  'green hand': [15, 19]
};

const aged = (berth, rate) => {
  const [lo, hi] = YEARS[berth] || YEARS[rate] || [20, 30];
  return lo + Math.floor(Math.random() * (hi - lo + 1));
};

export function makeCompany() {
  const name = nameMaker();
  const all = [];
  let id = 0;

  for (const b of BERTHS) {
    for (let i = 0; i < b.n; i++) {
      all.push({
        id: id++, name: name(), berth: b.berth, rate: b.rate,
        station: b.idler ? 'day work' : b.station,
        idler: b.idler || null,          // what he is at when nothing else calls
        job: null,                       // what you have set him to instead
        age: aged(b.berth, b.rate),
        strength: pick(STRENGTH), health: 'sound', watch: null
      });
    }
  }

  // The watch bill. The first mate takes the larboard watch and the second the
  // starboard, as the custom was; the third mate goes with the first. The rest
  // are dealt out turn and turn about so that each watch gets its share of the
  // good men and the green ones. The idlers keep no watch.
  const put = (man, watch) => { man.watch = watch; };
  put(all.find((m) => m.berth === 'First mate'), 'larboard');
  put(all.find((m) => m.berth === 'Third mate'), 'larboard');
  put(all.find((m) => m.berth === 'Second mate'), 'starboard');

  let turn = 0;
  for (const m of all) {
    if (m.watch || m.idler) continue;
    put(m, turn++ % 2 ? 'larboard' : 'starboard');
  }

  const of = (watch) => all.filter((m) => m.watch === watch);
  const idlers = all.filter((m) => m.idler);
  const sound = (m) => m.health === 'sound';

  return {
    all, idlers,
    watch: of,

    // How many she can muster: one watch, or every hand aboard.
    get watchStrength() {
      return Math.min(of('starboard').filter(sound).length, of('larboard').filter(sound).length);
    },
    get allHands() { return all.filter(sound).length; },

    // The officer who has the deck this watch.
    mateOf(watch) {
      return of(watch).find((m) => m.rate === 'mate') || null;
    },

    // The tradesman whose trade a piece of work wants. Nothing is fished
    // without the carpenter.
    tradesman(berth) {
      return all.find((m) => m.berth === berth && sound(m)) || null;
    },

    // Set a man to a piece of work, or let him go back to his own.
    setJob(man, job) { man.job = job; },
    clearJob(job) { for (const m of all) if (m.job === job) m.job = null; },

    rename(man, to) {
      const clean = String(to).replace(/\s+/g, ' ').trim().slice(0, 28);
      man.name = clean || man.name;
      return man.name;
    }
  };
}
