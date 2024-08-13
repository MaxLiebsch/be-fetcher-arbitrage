const groups = [
  {
    name: "PS5 (306)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&platform=100",
  },
  {
    name: "XboxSeries (163)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&platform=101",
  },
  {
    name: "PS4 (228)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&platform=89",
  },
  {
    name: "XboxOne (90)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&platform=90",
  },
  {
    name: "Switch (408)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&platform=99",
  },
  {
    name: "PC (61)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&platform=68",
  },
  {
    name: "3DS (2)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&platform=79",
  },
  {
    name: "Accessories (238)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&platform=103",
  },
  {
    name: "Digital (4)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&platform=102",
  },
  {
    name: "Merchandise (3047)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&platform=92",
  },
  {
    name: "Multiplatform (57)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&platform=74",
  },
  {
    name: "Accessories (64)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=272",
  },
  {
    name: "Action (445)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=178",
  },
  {
    name: "Actionfiguren (63)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=314",
  },
  {
    name: "Adventure (76)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=180",
  },
  {
    name: "Beat'em up (19)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=177",
  },
  {
    name: "Blind Bag (14)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=323",
  },
  {
    name: "Brett & Kartenspiele (144)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=317",
  },
  {
    name: "Caps & Mützen (103)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=318",
  },
  {
    name: "Controller (179)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=305",
  },
  {
    name: "DLCs (1)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=310",
  },
  {
    name: "Elektronik (51)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=301",
  },
  {
    name: "Fan Articles (73)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=302",
  },
  {
    name: "Figuren (714)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=281",
  },
  {
    name: "Fun-Games (70)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=174",
  },
  {
    name: "Funko POP! (542)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=316",
  },
  {
    name: "Gesellschaftsspiele (6)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=293",
  },
  {
    name: "Hardware (333)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=170",
  },
  {
    name: "Headsets (13)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=306",
  },
  {
    name: "Horror (6)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=245",
  },
  {
    name: "Jump and Run (22)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=176",
  },
  {
    name: "Kalender (1)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=290",
  },
  {
    name: "Kissen & Bettwäsche (1)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=299",
  },
  {
    name: "Kleidung (5)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=266",
  },
  {
    name: "Lösungsbücher (210)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=292",
  },
  {
    name: "Mangas (173)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=309",
  },
  {
    name: "Mäuse (5)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=304",
  },
  {
    name: "n.a. (3)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=240",
  },
  {
    name: "Pins (9)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=313",
  },
  {
    name: "Plüsch (125)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=315",
  },
  {
    name: "Point Cards (2)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=169",
  },
  {
    name: "Poster (38)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=300",
  },
  {
    name: "Rennsimulation (51)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=181",
  },
  {
    name: "Replika (6)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=289",
  },
  {
    name: "Retro Gaming (25)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=324",
  },
  {
    name: "Rollenspiele (113)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=183",
  },
  {
    name: "Schlüsselanhänger (53)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=322",
  },
  {
    name: "Simulation (51)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=179",
  },
  {
    name: "Snacks (29)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=325",
  },
  {
    name: "Socken & Handschuhe (1)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=320",
  },
  {
    name: "Sonstiges (31)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=184",
  },
  {
    name: "Sportspiele (74)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=172",
  },
  {
    name: "Strategie (34)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=173",
  },
  {
    name: "Taschen & Rucksäcke (96)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=312",
  },
  {
    name: "Tassen & Gläser (127)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=298",
  },
  {
    name: "Tastaturen (5)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=303",
  },
  {
    name: "Trading Card Zubehör (34)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=308",
  },
  {
    name: "Trading Cards (173)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=307",
  },
  {
    name: "T-Shirts (34)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&rootGenre=319",
  },
  {
    name: "Jetzt günstiger (804)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&strokenPrice=Jetzt%20g%C3%BCnstiger",
  },
  {
    name: "Nur bei GameStop (14)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&exclusive=True",
  },
  {
    name: "Lieferung nach Hause (3325)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&shippingMethod=1",
  },
  {
    name: "Abholung im Store (4633)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&shippingMethod=2",
  },
  {
    name: "Bereits erschienen (4659)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&release=1",
  },
  {
    name: "Erschienen letzte 30 Tage (254)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&release=3",
  },
  {
    name: "Nicht erforderlich (3694)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&age=37",
  },
  {
    name: "Freigegeben ab 0 Jahren (186)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&age=33",
  },
  {
    name: "noch nicht geprüft (3)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&age=34",
  },
  {
    name: "Freigegeben ab 6 Jahren (141)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&age=32",
  },
  {
    name: "Freigegeben ab 12 Jahren (276)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&age=29",
  },
  {
    name: "Freigegeben ab 16 Jahren (191)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&age=30",
  },
  {
    name: "Freigegeben ab 18 Jahren (98)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&age=31",
  },
  {
    name: "Prüfung ausstehend (1)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&age=35",
  },
  {
    name: "Digital (1)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&productType=4",
  },
  {
    name: "Electronic (28)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&productType=6",
  },
  {
    name: "Hardware Accessories (444)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&productType=3",
  },
  {
    name: "Hardware Console (28)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&productType=1",
  },
  {
    name: "Loot (2855)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&productType=5",
  },
  {
    name: "Snacks/Sweets (10)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&productType=7",
  },
  {
    name: "Software Games (944)",
    link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&productType=2",
  },
];

const maxProductsGroups = 6000;

const categoryGroups = [];
let currentGroup = [];
let currentGroupSize = 0;
let cnt = 0;

groups.forEach((group, i) => {
  const groupSize = parseInt(
    group.name.match(/\((\d+)\)/g)[0].match(/\d+/g)[0]
  );
  group.name = group.name.replace(/\((\d+)\)/g, "").trim();
  group.size = groupSize;
  if (groupSize > 1) {
    if (groupSize > maxProductsGroups) {
      group.name === "Software Games" && console.log("1", group.name);
      currentGroup.push(group);
      categoryGroups.push([...currentGroup]);
      currentGroup = [];
    } else if (currentGroupSize + groupSize <= maxProductsGroups) {
      group.name === "Software Games" && console.log("2", group.name);
      currentGroupSize += groupSize;
      currentGroup.push(group);
      if (i === groups.length - 1) {
        categoryGroups.push([...currentGroup]);
      }
    } else {
      group.name === "Software Games" && console.log("3", group.name);
      categoryGroups.push([...currentGroup]);
      currentGroup = [];
      currentGroupSize = groupSize;
      currentGroup.push(group);
    }
  }
});

const stats = categoryGroups.reduce((acc, group) => {
  acc.push({
    groups: group.length,
    total: group.reduce((acc, group) => acc + group.size, 0),
    group,
  });
  return acc;
}, []);

const shopDomain = "gamestop.de";
console.log(
  `Total groups: ${groups.length}, Max products per group: ${maxProductsGroups}`,
  "categoryGroups:",
  categoryGroups.length,
  stats.reduce((acc, stat) => acc + stat.groups + 1, 0),
//   stats,
  JSON.stringify(stats.map((stat,i) => {
    return {
      type: "CRAWL_SHOP",
      maintenance: false,
      test: false,
      id: `crawl_shop_${shopDomain}_${i + 1}_of_${stats.length}`,
      shopDomain,
      limit: {
        mainCategory: stat.group.length,
        subCategory: 100,
        pages: 50,
      },
      categories: stat.group,
      recurrent: true,
      lastCrawler: [],
      executing: false,
      completed: false,
      createdAt: new Date().toISOString(),
      errored: false,
      startedAt: new Date().toISOString(),
      completedAt: "",
      productLimit: stat.total,
      weekday: i,
    };
  }),null,2)
);
