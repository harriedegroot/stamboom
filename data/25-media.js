/* =====================================================================
   BEELD: kerken, plekken, kranten, achtergrond en fotocollecties
   ---------------------------------------------------------------------
   Afbeeldingen van andere sites kunnen niet in deze pagina worden
   ingesloten; elk item linkt naar de plek waar de foto, scan of tekst
   staat. Bidprentjes worden automatisch uit de personen verzameld.
   Velden: id, kind ('kerk' | 'plek' | 'krant' | 'achtergrond'), t, p
   (plaats-sleutel), y, kws, d, links [label, url, opmerking], st,
   unread (krant: alleen als zoektreffer gezien, inhoud niet gelezen)
   ===================================================================== */
const MEDIA_KINDS = {
  bidprentje: { label: "Bidprentjes", d: "Gedachtenisprentjes uit de archieven, met scan waar die bekend is." },
  kerk: { label: "Kerken en kerkhoven", d: "Waar ze gedoopt werden, trouwden en begraven liggen." },
  plek: { label: "Plekken", d: "Dorpen, kloosters en havens met een eigen verhaal." },
  krant: { label: "Kranten", d: "Berichten uit Delpher die als zoektreffer opdoken. Nog niet gelezen: open ze om te zien of ze over de familie gaan." },
  achtergrond: { label: "Achtergrond", d: "Boeken, artikelen en archieven over de tijd waarin ze leefden." }
};
const NOT_OPENED = "niet zelf geopend";
const MEDIA = [
/* ---------- kerken ---------- */
{ id: "gelderingen", kind: "kerk", t: "Sint-Andreaskerk en katholiek kerkhof, Gelderingen", p: "Gelderingen", y: "1912–1913", kws: [46, 47, 23, 92, 93, 11, 21], st: "B",
  d: "Driebeukige basiliek van Wolter te Riele (1912–1913), op de plek van een kerk uit 1830. Het kerkhof dateert van rond 1870 en heeft een losse klokkenstoel. Bij de ingang staat het kruisbeeld dat T. Groenestege en A.B. Spitzen in 1880 schonken; er liggen 'fraaie graven' van beide families en er staat een baarhuisje uit 1904. De kerk is vermoedelijk geen rijksmonument.",
  links: [["Monumenten in Nederland: Overijssel (DBNL)", "https://www.dbnl.org/tekst/sten009monu03_01/sten009monu03_01_0095.php"], ["Graven op het kerkhof (Find a Grave)", "https://www.findagrave.com/cemetery/2696676/sint-andreaskerk-roman-catholic-cemetery"], ["Wikipedia: Sint-Andreaskerk (Steenwijkerwold)", "https://nl.wikipedia.org/wiki/Sint-Andreaskerk_(Steenwijkerwold)", NOT_OPENED], ["Reliwiki: Gelderingen 77", "https://reliwiki.nl/index.php/Steenwijkerwold,_Gelderingen_77_-_Andreas", NOT_OPENED], ["Atlas Obscura: Graveyard Groenesteeg", "https://www.atlasobscura.com/places/graveyard-groenesteeg", NOT_OPENED], ["Foto's: Wolter te Riele (Commons)", "https://commons.wikimedia.org/wiki/Category:Wolter_te_Riele"]] },
{ id: "steggerda", kind: "kerk", t: "Sint-Fredericuskerk en kerkhof, Steggerda", p: "Steggerda", y: "1759 · 1839 · 1921", kws: [20, 40, 41, 42, 84, 168, 169, 32, 16], st: "B",
  d: "Steggerda was een katholieke enclave. In 1759 kwam er een schuilkerk boven een paardenstal. De kerk van 1839 werd in 1921 vervangen door de huidige kerk van Wolter te Riele; preekstoel en doopvont van de oude kerk zijn hergebruikt. Op het kerkhof staat een stenen calvariegroep van H. Moors uit 1926. Rijksmonument 508652, met pastorie en kerkhof als complex.",
  links: [["Rijksmonument 508652 (kerk)", "https://monumentenregister.cultureelerfgoed.nl/monumenten/pdf/508652"], ["Complex met pastorie en kerkhof", "https://monumentenregister.cultureelerfgoed.nl/print/pdf/node/570019"], ["Wikipedia: Steggerda", "https://en.wikipedia.org/wiki/Steggerda"], ["Foto's: Fredericuskerk (Commons)", "https://commons.wikimedia.org/wiki/Category:Fredericuskerk,_Steggerda"]] },
{ id: "wolvega", kind: "kerk", t: "Sint-Franciscuskerk, Wolvega", p: "Wolvega", y: "1913 · 1938–1939", kws: [4, 5, 18, 19, 64, 65], st: "B",
  d: "De huidige kerk is van 1938–1939, door J.Th.J. en P.J.J.M. Cuypers; de toren hoort nog bij de kerk van Wolter te Riele uit 1913–1914. Op hetzelfde terrein staat een neogotische grafkapel uit 1914 voor de familie Lycklama à Nijeholt. Herman de Groot en Mien de Vries liggen op de RK begraafplaats van Wolvega.",
  links: [["Archimon: Wolvega, Franciscus", "https://archimon.nl/friesland/wolvegafranciscus.html"], ["Archimon: Weststellingwerf", "https://archimon.nl/friesland/weststellingwerf.html"], ["Foto's: Sint-Franciscuskerk (Commons)", "https://commons.wikimedia.org/wiki/Category:Sint-Franciscuskerk_(Wolvega)"]] },
{ id: "oosterwierum", kind: "kerk", t: "Sint-Wirokerk, Oosterwierum", p: "Oosterwierum", y: "1792 · 1925–1926", kws: [48, 49, 24, 53, 74, 75, 104, 105, 98], st: "B",
  d: "Neogotische kerk van Wolter te Riele (1925–1926), op de plek van een kerk uit 1792; nu een voormalige kerk. Assuerus Terwisscha van Scheltinga en Sybrigje Koelman liggen volgens een fotogalerij van grafstenen in Oosterwierum begraven. Over de klokken van 1926 is nog geen bron gevonden.",
  links: [["Friesland.nl: Easterwierrum", "https://www.friesland.nl/en/locations/1378773406/easterwierum-oosterwierum"], ["Wikipedia: Easterwierrum", "https://en.wikipedia.org/wiki/Easterwierrum"], ["Foto's: Sint-Wirokerk (Commons)", "https://commons.wikimedia.org/wiki/Category:Sint-Wirokerk,_Easterwierrum"], ["Grafstenen Terwisscha van Scheltinga (Graven en verhalen)", "http://www.gravenenverhalen.nl/?page_id=571"]] },
{ id: "blauwhuis", kind: "kerk", t: "Sint-Vituskerk en kerkhof, Blauwhuis", p: "Blauwhuis", y: "1868–1872", kws: [112, 113, 226, 227], st: "B",
  d: "Kerk van P.J.H. Cuypers, gebouwd 1868–1871 en ingewijd op 15 oktober 1872. Het rijksmonumentcomplex 515165 omvat kerk, pastorie, kerkhof met knekelhuisje en grafmonumenten. Aagje van der Wey uit Hieslum werd hier in 1796 gedoopt, in de voorganger van deze kerk.",
  links: [["Rijksmonumentcomplex 515165", "https://monumentenregister.cultureelerfgoed.nl/print/pdf/node/570653"], ["Foto's: Sint-Vituskerk (Commons)", "https://commons.wikimedia.org/wiki/Category:Saint_Vitus_Church_(Blauwhuis)"], ["Foto's: kerkhof Blauwhuis (Commons)", "https://commons.wikimedia.org/wiki/Category:Blauwhuis_cemetery"]] },
{ id: "bakhuizen", kind: "kerk", t: "Sint-Odulphuskerk, Bakhuizen", p: "Bakhuizen", y: "1913–1914", kws: [60, 61, 120, 121, 240, 122, 123], st: "B",
  d: "Parochiekerk voor Bakhuizen, Mirns en Molkwerum, gebouwd in 1913–1914. Daarvoor kerkten de katholieken in een schuilkerk in Elfbergen en in de molen Mole Polle.",
  links: [["Wikipedia: Bakhuizen", "https://en.wikipedia.org/wiki/Bakhuzen"], ["Foto's: Sint-Odulphuskerk (Commons)", "https://commons.wikimedia.org/wiki/Category:Sint_Odulphuskerk_(Bakhuizen)"]] },
{ id: "sneek", kind: "kerk", t: "Sint-Martinuskerk, Sneek", p: "Sneek", y: "1869–1872", kws: [14, 15, 30, 31, 105], st: "B",
  d: "Torenloze kerk van P.J.H. Cuypers, gebouwd 1869–1871 en in 1872 voltooid; de bijgebouwen zijn rijksmonument 34069. In Sneek overleden Tjitte Huitema, Riemke de Jong, Lammert de Jong en Elisabeth Westendorp.",
  links: [["Sneek.nl: Sint-Martinuskerk", "https://sneek.nl/en/routes/st-martinus-church-sneek"], ["Rijksmonument 34069", "https://monumentenregister.cultureelerfgoed.nl/monumenten/pdf/34069"], ["Foto's: Sint-Martinuskerk (Commons)", "https://commons.wikimedia.org/wiki/Category:Sint-Martinuskerk,_Sneek"], ["Foto's: RK begraafplaats Sneek (Commons)", "https://commons.wikimedia.org/wiki/Category:Rooms-katholieke_begraafplaats_Sint_Martinuskerk_(Sneek)"]] },
{ id: "dronrijp", kind: "kerk", t: "Maria Geboortekerk, Dronrijp", p: "Dronrijp", y: "1839", kws: [26, 27, 13, 54], st: "B",
  d: "Katholieke kerk uit 1839 in Waterstaatsstijl, van A. van der Moer; in 1939 kreeg ze een nieuwe gevel en toren. Rijksmonument 508677. In Dronrijp woonde de veehoudersfamilie Terwisscha van Scheltinga–Galema; hier werd Marianna in 1888 geboren.",
  links: [["Rijksmonument 508677", "https://monumentenregister.cultureelerfgoed.nl/monumenten/pdf/508677"], ["Foto's: Maria Geboortekerk (Commons)", "https://commons.wikimedia.org/wiki/Category:Maria_Geboortekerk_(Dronryp)"]] },
{ id: "zorgvlied", kind: "kerk", t: "Katholieke kerk en kerkhof, Zorgvlied", p: "Zorgvliet", y: "1924", kws: [12, 13], st: "B",
  d: "Vanaf 1879 haalde L.G. Verwer katholieke boeren naar Zorgvlied; in 1880 begon de eredienst in een huiskapel en in 1893 werd de parochie opgericht. De kerk van H. Bijl (1924) is rijksmonument 507280; de glas-in-loodramen tonen figuren uit de streek. Marianna Terwisscha van Scheltinga ligt hier begraven.",
  links: [["Rijksmonument 507280", "https://monumentenregister.cultureelerfgoed.nl/monumenten/pdf/507280"], ["Wikipedia: Zorgvlied", "https://en.wikipedia.org/wiki/Zorgvlied"], ["Foto's: Sint-Andreaskerk Zorgvlied (Commons)", "https://commons.wikimedia.org/wiki/Category:Sint-Andreaskerk_(Zorgvlied)"], ["Grafregistratie Terwisscha van Scheltinga (Graftombe)", "https://graftombe.nl/Names/search/surname/Terwisscha+van+Scheltinga/submit/true"]] },
{ id: "kortezwaag", kind: "kerk", t: "Hervormde kerk, Kortezwaag", p: "Kortezwaag", y: "1797", kws: [64, 65], st: "B",
  d: "Hier trouwden Thijs Hylkes en Popkjen Idzes in 1790 voor de wet. De huidige kerk is van 1797, dus zeven jaar later gebouwd, op de plek van een oudere kerk. Rijksmonument 31852.",
  links: [["Rijksmonument 31852", "https://monumentenregister.cultureelerfgoed.nl/monumenten/pdf/31852"], ["Monumenten in Nederland: Friesland (DBNL)", "https://dbnl.org/tekst/_voo016voor08_01/_voo016voor08_01_0030.php"]] },

/* ---------- plekken ---------- */
{ id: "bloemkamp", kind: "plek", t: "Oldeklooster: de verdwenen abdij Bloemkamp", p: "Oldeklooster", y: "ca. 1191–1579", kws: [50, 51, 25], st: "B",
  d: "Cisterciënzer abdij bij Hartwerd, rond 1191 gesticht, in 1572 verwoest en in 1579 opgeheven. Er staat niets meer, maar de naam leeft voort in Oldeklooster en in boerderijnamen als Monnikehuis en Bloemkamp. Op Oldeclooster 8 staat een infopunt met een maquette. Frans Poelsma boerde hier; zijn dochter Baukje werd er in 1857 geboren.",
  links: [["Wikipedia: Bloemkamp Abbey", "https://en.wikipedia.org/wiki/Bloemkamp_Abbey"], ["Wandelroute Hartwerd (friesland.nl)", "https://friesland.nl/en/routes/1785687802/kuiertocht-hartwerd"]] },
{ id: "hartwerd", kind: "plek", t: "Hartwerd", p: "Hartwerd", kws: [116, 58, 29], st: "B",
  d: "Tot 1322 kwam hier het landsbestuur van Westergo bijeen. Titus Brandsma werd op een boerderij vlakbij geboren. Douwe Yettes Flapper boerde hier; Ruurdastate, die online stambomen noemen, is niet in een bron teruggevonden.",
  links: [["Wikipedia: Hartwerd", "https://en.wikipedia.org/wiki/Hartwerd"], ["Foto's: Hartwerd (Commons)", "https://commons.wikimedia.org/wiki/Category:Hartwerd"]] },
{ id: "molkwerum", kind: "plek", t: "Molkwerum, het Friese doolhof", p: "Molkwerum", kws: [60, 30], st: "B",
  d: "Een dorp van eilandjes, vaarten en bruggetjes. Rein Lammerts de Jong was hier zetboer op Ymedam; zijn zoon Lammert werd er in 1856 geboren. Ymedam zelf is online niet teruggevonden.",
  links: [["Wikipedia: Molkwerum", "https://en.wikipedia.org/wiki/Molkwerum"], ["Foto's: Molkwerum (Commons)", "https://commons.wikimedia.org/wiki/Category:Molkwerum"]] },
{ id: "kuinre", kind: "plek", t: "Kuinre en Blankenham aan de oude Zuiderzee", p: "Kuinre", y: "1942", kws: [88, 176, 177, 44, 22], st: "B",
  d: "Kuinre was een havenstadje aan de Zuiderzee. Met de drooglegging van de Noordoostpolder in 1942 verloor het zijn haven, en vissers en winkeliers hun bestaan. De Belts woonden in Kuinre en Blankenham, vlak aan de oude kustlijn.",
  links: [["Oude haven van Kuinre (Visit Flevoland)", "https://www.visitflevoland.nl/en/locaties/429684542/old-harbour-of-kuinre"], ["Wikipedia: Kuinre", "https://en.wikipedia.org/wiki/Kuinre"], ["Foto's: Blankenham (Commons)", "https://commons.wikimedia.org/wiki/Category:Blankenham"]] },
{ id: "oudenbosch", kind: "plek", t: "Saint Louis, Oudenbosch", p: "Oudenbosch", y: "1840–1841", kws: [52, 26], st: "C",
  d: "Pastoor W. Hellemons stichtte in Oudenbosch in 1840 een broedercongregatie en in 1841 het internaat Saint Louis. Johannes Terwisscha van Scheltinga overleed op 18 januari 1856 in Oudenbosch, veertien jaar oud. Of hij er op school zat, staat niet in de akte.",
  links: [["Rijksmonumenten Saint Louis", "https://monumentenregister.cultureelerfgoed.nl/print/pdf/node/571356"], ["Broeders van Saint Louis (GCatholic)", "https://gcatholic.org/orders/317"], ["Overlijdensakte Johannes, Oudenbosch 1856", OA + "wba:d295887e-f8d9-11df-a690-cd95c1e286e2"]] },
{ id: "schwagstorf", kind: "plek", t: "Schwagstorf en Fürstenau, Osnabrücker Land", p: "Schwagstorf", kws: [38, 39, 19], st: "B",
  d: "Volgens haar bidprentje werd Margaretha Niemann hier in 1813 geboren. De doopboeken van de parochie Sint-Bartholomeus staan online, maar pas vanaf 1853.",
  links: [["Matricula: RK parochie Schwagstorf", "https://data.matricula-online.eu/de/deutschland/osnabrueck/schwagstorf-furstenau-st-bartholomaus/D1_103_3"], ["Foto's: Hannekemaaiers, Duitse seizoenarbeiders (Commons)", "https://commons.wikimedia.org/wiki/Category:Hannekemaaiers", "context, geen bewezen verband"]] },

/* ---------- kranten (nog niet gelezen) ---------- */
{ id: "osc1879", kind: "krant", unread: true, t: "Opregte Steenwijker Courant, 17 maart 1879", p: "Steenwijkerwold", y: "1879", kws: [46, 47], d: "Zoektreffer op Groenestege en Steenwijkerwold.", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=MMGASL01:000344093:mpeg21:p00001"]] },
{ id: "osc1881", kind: "krant", unread: true, t: "Opregte Steenwijker Courant, 13 juni 1881", p: "Steenwijkerwold", y: "1881", kws: [46, 47], d: "Zoektreffer op Groenestege en Steenwijkerwold.", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=MMGASL01:000348106:mpeg21:p00001"]] },
{ id: "osc1899", kind: "krant", unread: true, t: "Opregte Steenwijker Courant, 13 maart 1899", p: "Steenwijkerwold", y: "1899", kws: [46, 47], d: "Zoektreffer op Groenestege en Steenwijkerwold.", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=MMGASL01:000366037:mpeg21:p00002"]] },
{ id: "pius1901", kind: "krant", unread: true, t: "Pius-almanak 1901, p. 582", y: "1901", kws: [46], d: "Zoektreffer op Groenestege in een katholieke almanak.", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=MMKDC04:000793001:00582"]] },
{ id: "nvf1913", kind: "krant", unread: true, t: "Nieuwsblad van Friesland, 15 januari 1913", p: "Harich", y: "1913", kws: [12], d: "Zoektreffer op Meinte Boersma en Harich.", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=ddd:010762647:mpeg21:a0123"]] },
{ id: "osc1917", kind: "krant", unread: true, t: "Opregte Steenwijker Courant, 9 juni 1917", p: "Steenwijkerwold", y: "1917", kws: [23], d: "Zoektreffer op Groenestege en Steenwijkerwold.", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=MMGASL01:000386100:mpeg21:p00007"]] },
{ id: "osc1918", kind: "krant", unread: true, t: "Opregte Steenwijker Courant, 28 september 1918", p: "Steenwijkerwold", y: "1918", kws: [23], d: "Zoektreffer op Groenestege en Steenwijkerwold.", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=MMGASL01:000387019:mpeg21:p00007"]] },
{ id: "on1925", kind: "krant", t: "Ons Noorden, 30 november 1925", p: "Oosterwierum", y: "1925", kws: [24, 48], d: "'Uurwerk in de nieuwe Parochiekerk': de parochianen van het kleine Oosterwierum tekenden al ongeveer 600 gulden voor een torenuurwerk, dat de pastoor 'tegelijk met de klokken in den toren der nieuwe kerk' wilde laten aanbrengen.", st: "A", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=MMRHCG04:235306052:mpeg21:a00048"]] },
{ id: "hc1926", kind: "krant", t: "Het Centrum, 26 maart 1926", p: "Oosterwierum", y: "1926", kws: [24, 48], d: "'Kerkwijding': op woensdag werd de nieuwe parochiekerk van Oosterwierum ingewijd, toegewijd aan de heilige Wiro, door deken Vaas uit Leeuwarden. Architect Te Riele, aannemer Arends. 'Door de parochianen is verzameld het geld voor een nieuwe klok, die ook reeds geplaatst is.' De kerk bood plaats aan ruim 200 mensen en had elektrisch licht.", st: "A", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=ddd:010001900:mpeg21:a0060"]] },
{ id: "nvf1926b", kind: "krant", unread: true, t: "Nieuwsblad van Friesland, 30 april 1926", p: "Harich", y: "1926", kws: [12], d: "Zoektreffer op Meinte Boersma en Harich.", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=ddd:010759955:mpeg21:p010"]] },
{ id: "lc1911", kind: "krant", unread: true, t: "Leeuwarder Courant, 15 mei 1911", p: "Hartwerd", y: "1911", kws: [58, 29], d: "Zoektreffer op Flapper en Hartwerd.", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=ddd:010599138:mpeg21:p008"]] },
{ id: "lc1928", kind: "krant", unread: true, t: "Leeuwarder Courant, 15 november 1928", p: "Scharnegoutum", y: "1928", kws: [14, 15], d: "Zoektreffer op Huitema en Scharnegoutum.", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=ddd:010604463:mpeg21:p006"]] },
{ id: "osc1932", kind: "krant", unread: true, t: "Opregte Steenwijker Courant, 11 juni 1932", p: "Steenwijkerwold", y: "1932", kws: [23], d: "Zoektreffer op Groenestege en Steenwijkerwold.", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=MMGASL01:000402061:mpeg21:p00007"]] },
{ id: "fd1948", kind: "krant", unread: true, t: "Friesch Dagblad, 24 september 1948", p: "Hartwerd", y: "1948", kws: [29], d: "Zoektreffer op Flapper en Hartwerd.", links: [["Open in Delpher", "https://resolver.kb.nl/resolve?urn=MMTRES02:000024867:mpeg21:p002"]] },

/* ---------- achtergrond ---------- */
{ id: "naamsaanneming", kind: "achtergrond", t: "De registers van naamsaanneming (1811)", y: "1811", kws: [64, 72, 144, 96, 120, 248, 226, 148, 146], st: "B",
  d: "Napoleon verplichtte in 1811 en 1813 iedereen een vaste achternaam te laten registreren. In Friesland waren patroniemen nog gewoon, dus deze registers geven vaak de oudste vermelding van een familienaam. Ze staan met scans op AlleFriezen.",
  links: [["Uitleg (Dutch Genealogy)", "https://www.dutchgenealogy.nl/name-taking-records"], ["AlleFriezen", "https://allefriezen.nl/"]] },
{ id: "familienamen", kind: "achtergrond", t: "Friese familienamen op -ma, -stra en -inga", kws: [12, 14, 9], st: "B",
  d: "Volgens Leendert Brouwer (Meertens Instituut) vallen Friese namen op -a in drie groepen: -ma, -stra en -inga. -stra komt van 'sittera': bewoner van een plek. De herkomst van de namen in deze stamboom is daarmee niet afzonderlijk gecontroleerd.",
  links: [["Waarom eindigt een Friese achternaam op -a?", "https://webwoordenboek.nl/kenniscentrum/waarom-eindigt-een-friese-achternaam-met-een-a"], ["L. Brouwer, Hoe Fries is De Vries? (2018)", "https://pure.knaw.nl/portal/nl/publications/hoe-fries-is-de-vries-familienamen-in-friesland-en-omgeving/"], ["Nederlandse Familienamenbank: zoek zelf een naam", "https://www.cbgfamilienamen.nl/nfb/"]] },
{ id: "crisis", kind: "achtergrond", t: "De landbouwcrisis van 1878–1895", y: "1878–1895", kws: [24, 18, 20], st: "B",
  d: "Het standaardwerk: H. de Vries, Landbouw en bevolking tijdens de agrarische depressie in Friesland (1878–1895), proefschrift 1971.",
  links: [["Proefschrift H. de Vries (NAHI)", "https://nahi.ub.rug.nl/14040/"]] },
{ id: "canada", kind: "achtergrond", t: "Emigratie naar Canada na 1945", y: "1947–1949", kws: [7, 14], st: "B",
  d: "Tussen 1947 en 1949 vertrokken bijna 16.000 mensen uit Nederlandse boerengezinnen naar Canada, de meesten naar boerderijen in Ontario en Alberta. Johannes Piet Huitema overleed in 1993 in Calgary; wanneer hij vertrok, is niet uitgezocht.",
  links: [["Postwar Dutch immigration (Pier 21)", "https://pier21.ca/blog/jan-raska-phd/postwar-dutch-immigration-through-pier-21"]] }
];

/* Fotocollecties per plaats op Wikimedia Commons (categorietitels gecontroleerd via zoekresultaten) */
const COMMONS_BASE = "https://commons.wikimedia.org/wiki/Category:";
const COMMONS = {
  "Wolvega": "Wolvega", "Oldeholtpade": "Oldeholtpade", "Oldetrijne": "Oldetrijne", "Steggerda": "Steggerda", "Blankenham": "Blankenham",
  "Steenwijkerwold": "Steenwijkerwold", "Gelderingen": "Steenwijkerwold", "Scharnegoutum": "Scharnegoutum", "Dronrijp": "Dronryp", "Oosterwierum": "Easterwierrum",
  "Hidaard": "Hidaard", "Tjalhuizum": "Tjalhuizum", "Greonterp": "Greonterp", "Burgwerd": "Burgwerd", "Hartwerd": "Hartwerd", "Koudum": "Koudum",
  "Molkwerum": "Molkwerum", "Mirns": "Mirns", "Balk": "Balk_(Friesland)", "Wijckel": "Wijckel", "Luinjeberd": "Luinjeberd", "Nieuweschoot": "Nieuweschoot",
  "Rauwerd": "Raerd", "Harich": "Harich", "Peins": "Peins", "Irnsum": "Jirnsum", "Tirns": "Tirns", "Warga": "Wergea"
};
/* Zelf verder zoeken in kranten */
const PAPER_SEARCHES = [
  ["Groenestege in Steenwijkerwold", "https://www.delpher.nl/nl/kranten/results?query=Groenestege+Steenwijkerwold&coll=ddd"],
  ["Terwisscha van Scheltinga in Dronrijp", "https://www.delpher.nl/nl/kranten/results?query=%22Terwisscha+van+Scheltinga%22+Dronrijp&coll=ddd"],
  ["Boersma, Oosterwierum, klok", "https://www.delpher.nl/nl/kranten/results?query=Boersma+Oosterwierum+klok&coll=ddd"],
  ["Huitema in Scharnegoutum", "https://www.delpher.nl/nl/kranten/results?query=Huitema+Scharnegoutum&coll=ddd"],
  ["Meinte Boersma in Harich", "https://www.delpher.nl/nl/kranten/results?query=%22Meinte+Boersma%22+Harich&coll=ddd"],
  ["Lammert de Jong in Gaasterland", "https://www.delpher.nl/nl/kranten/results?query=%22Lammert+de+Jong%22+Gaasterland&coll=ddd"],
  ["Flapper in Hartwerd", "https://www.delpher.nl/nl/kranten/results?query=Flapper+Hartwerd&coll=ddd"],
  ["Kingma en Lycklama, 1855", "https://www.delpher.nl/nl/kranten/results?query=Lycklama+Kingma+1855&coll=ddd"]
];
