/* =====================================================================
   STAMBOOM DE GROOT · BOERSMA — algemene gegevens
   ---------------------------------------------------------------------
   Bestanden in deze map worden in volgorde (01, 02, ...) samengevoegd.
   01-meta.js        versie, familielijnen (Harrie), tijdperken, begrippen
   02-places.js      plaatsen met coördinaten en achtergrond
   10..14-people-*   personen van Harrie per generatie (PEOPLE.push)
   20-stories.js     verhalen en opvallende feiten (Harrie)
   25-media.js       beeld: kerken, kranten, foto-collecties, monumenten
   26-notables.js    bekende verwanten, raakvlakken met de geschiedenis, geld
   27-images.js      beelden (gegenereerd), 28-packs.js archief-packs (gegenereerd)
   30-research.js    open vragen, tegenstrijdigheden, bronnen, wijzigingen
   31-changes.js     nieuw/bijgewerkt t.o.v. de vorige versie (gegenereerd)
   40..43-alies-*    de stamboom van Alies Hoekstra
   Tijdperken, begrippen, plaatsen en het wijzigingslog gelden voor alle drie de stambomen.
   ===================================================================== */
const VERSION = "Versie 13 · 8 oktober 2026";
const OA = "https://www.openarchieven.nl/";
const RKF_SCAN = n => `https://archiefrkfriesland.nl/archiefdata/advertenties/${n}.jpg`;
const PEOPLE = [];

/* Statuslabels. A en B gaan over bewijs; voor weetjes bestaan ook 'afgeleid', 'hypothese' en 'context'. */
const STATUS = {
  A: { label: "Akte", long: "Gevonden in een akte: burgerlijke stand, doopboek of bevolkingsregister, of op een bidprentje." },
  B: { label: "Sterk", long: "Sterk onderbouwd: indirect bewijs, een index zonder scan, of een genealogie die bronnen noemt." },
  C: { label: "Onzeker", long: "Alleen uit online stambomen of genealogieën zonder bron. Nog niet gecontroleerd." },
  D: { label: "Hypothese", long: "Alleen afgeleid uit vernoeming, doopgetuigen, patroniem of naamsgelijkenis. De persoon kan in een akte staan, maar geen bron noemt hem of haar als ouder." }
};
const NOTE_KIND = {
  afgeleid: "Afgeleid uit de data, niet letterlijk zo in een bron.",
  hypothese: "Hypothese: mogelijk, maar nog niet bewezen.",
  context: "Algemene achtergrond, niet specifiek over deze persoon."
};

const LINES = {
  8: { name: "De Groot", sub: "Moezen · Bosma", region: "Stellingwerven",
       intro: "De mannelijke lijn De Groot begint bij Hylke Tysses, boer in Haskerhorne, die in 1742 trouwde. Via Popkjen Idzes Jonkman reikt deze lijn terug tot Ids Entses, in 1698 katholiek mede-eigenaar van een boerderij in Langezwaag. Zijn zoon Thijs liet in februari 1812 in Wolvega de naam De Groot inschrijven. Daarna woonde de familie rond Oldeholtpade, Steggerda en Oldetrijne: boeren, en één sluiswachter. Via Johanna Moezen loopt een zijtak naar Dalfsen in Overijssel.",
       stem: [8, 16, 32, 64, 128] },
  9: { name: "Kingma", sub: "Meyners · Niemann", region: "Rauwerd, Aengwirden en Schoterland",
       intro: "Een katholieke familie die al vóór 1771 in Wijtgaard liet dopen. Stamvader Ynte Jans werd in 1729 in Oldeboorn geboren als zoon van Jan Gosses en Jeltje Intes, en was in 1761 bakker; zijn zoon Remke nam in 1811 in Rauwerd de naam Kingma aan. Aangetrouwd: winkeliers en een ketelboeter (Hoeben), een timmerbaas (Meinsma), en de Duitse veenbazen Meyners en Niemann uit het Osnabrücker Land.",
       stem: [9, 18, 36, 72, 144, 288] },
  10: { name: "De Vries", sub: "Ten Berge · Oosterkamp", region: "Steggerda",
       intro: "Katholieke boeren uit Ter Idzard en Steggerda, terug tot Eisse Fresses (ca. 1752). Wytze de Vries stierf in 1888 op zijn 36e; zijn zoon Albert werd boer in Blankenham, net over de grens in Overijssel. Aangetrouwd: de families Ten Berge, Vonk, Oosterkamp en Vos uit de zuidelijke Stellingwerven.",
       stem: [10, 20, 40, 80] },
  11: { name: "Belt", sub: "Groenestege · Spitzen", region: "Blankenham en Steenwijkerwold",
       intro: "De katholieke boerenfamilies van de Kop van Overijssel. De Belts kwamen uit Kuinre, waar Anthonij Beld in 1834 als arbeider stierf. De Spitzens uit Tuk leverden een kanunnik. Een tweeling Belt trouwde met twee kinderen Groenestege, en de Groenesteges schonken in 1880 het kruisbeeld op het kerkhof van Gelderingen. Via Akke Sybrigje Terwisscha van Scheltinga raakt deze lijn aan die van Vronie.",
       stem: [11, 22, 44, 88, 176, 352] },
  12: { name: "Boersma", sub: "Poelsma · Teppema", region: "Hennaarderadeel en Oosterwierum",
       intro: "Van een doopsgezinde familie in Rauwerd, die in 1793 katholiek werd, via een schipper in Irnsum (Minne Meintes, die in 1811 de naam Boesma liet noteren) naar boeren rond Oosterwierum en Hidaard. Meinte Boersma trok met zijn gezin door Groningen, Friesland en Drenthe. Aangetrouwd: Poelsma's uit Leeuwarden en Teppema's uit Loënga en Tirns.",
       stem: [12, 24, 48, 96, 192] },
  13: { name: "Terwisscha van Scheltinga", sub: "Galema · Kooiker", region: "Scharnegoutum en Dronrijp",
       intro: "Een familienaam die al vóór 1811 bestond: in 1692 trouwde in Makkum een Bocco Seerps Scheltinga. Zijn kleinzoon Titus Bokkes werd in 1726 bij Makkum geboren en trok rond 1746 met zijn zussen naar Weststellingwerf, waar hij zich ook Terwisscha noemde. Titus en Abeltje Jans woonden rond 1786–1796 in Ter Idzard; hun zoon Assuerus trouwde in Workum met de chirurgijnsdochter Sybrigje Koelman en trok naar Baarderadeel. Daarna Scharnegoutum, Tirns en Dronrijp. Hetzelfde voorouderpaar staat ook aan de kant van Kees, en een kleinzoon van Assuerus' dochter Apollonia was de heilige Titus Brandsma.",
       stem: [13, 26, 52, 104, 208, 416, 832, 1664] },
  14: { name: "Huitema", sub: "Flapper · Witteveen", region: "Wonseradeel en Wymbritseradeel",
       intro: "Boeren uit Zuidwest-Friesland: Abbega, Hieslum, Idzega, Greonterp, Tjalhuizum en Scharnegoutum. Aangetrouwd: Van der Wey uit Hieslum, Witteveen uit Snikzwaag, Flapper en Rollema uit Hartwerd en Exmorra, en Jorna uit Lollum en Midlum. Tjitte Huitema en Riemke de Jong kregen minstens twaalf kinderen.",
       stem: [14, 28, 56, 112, 224, 448] },
  15: { name: "De Jong", sub: "Westendorp · Hylkema", region: "Gaasterland",
       intro: "Gaasterlanders uit Mirns, Molkwerum, Balk en Warns: landbouwers, een zetboer, een gemeenteraadslid, twee grutters, een koopman en een herbergiersechtpaar. Johannes Westendorp vertrok op latere leeftijd naar Raalte; een Asma overleed in Amerika.",
       stem: [15, 30, 60, 120, 240] }
};

/* Tijdperken en gebeurtenissen voor tijdlijn en context */
const CONTEXT = [
  { y: 1580, y2: 1795, short: "Schuilkerken", t: "Katholiek geloof alleen in het verborgen", d: "In de Republiek was de katholieke eredienst verboden. Katholieken kerkten in schuilkerken of staties en trouwden voor de wet in de Hervormde kerk.", tl: false },
  { y: 1795, short: "1795", t: "Bataafse Revolutie", d: "Vrijheid van godsdienst. Katholieken mogen weer openlijk kerken bouwen." },
  { y: 1744, y2: 1745, short: "Veepest", t: "Veepest", d: "Van oktober 1744 tot september 1745 stierven in Friesland bijna 200.000 runderen; in 1769–1770 nog eens ruim 98.000. Voor een Friese boer was de koe alles: melk, boter, kaas en geld. Het quotisatiekohier van 1749 noemt soms nog de 'verloren beesten'." },
  { y: 1749, short: "1749", t: "Quotisatiekohier", d: "Een belastingtelling van alle Friese huishoudens. In de stamboom van Harrie staat Hylke Tysses erin als boer in Haskerhorne, 'matig in staat'; in die van Alies Ids Wouters als eigenerfde boer in Goingarijp." },
  { y: 1811, short: "1811", t: "Burgerlijke stand en vaste achternamen", d: "Gemeenten registreren geboorte, huwelijk en overlijden. In 1811 en 1812 laten Friese families een vaste achternaam inschrijven: in de stamboom van Harrie onder meer De Groot, Kingma, Boesma, Westendorp, De Jong, Meinsma en Van der Wey, in die van Alies onder meer Bakker, Schaap, Gaastra, Van der Molen, Klijnstra en Van der Veer." },
  { y: 1825, short: "1825", t: "Watersnood", d: "Op 4 februari 1825 braken langs de Zuiderzee de dijken door. 379 doden, van wie 305 in Overijssel; 60 procent van Friesland stond onder water. Kuinre en Blankenham (stamboom van Harrie) lagen aan die kust, en bij Lemmer (stamboom van Alies) brak de dijk door." },
  { y: 1826, y2: 1827, short: "Koortsjaren", t: "Koortsjaren", d: "Na de watersnood bleef brak water op het land staan. In 1826 en 1827 eiste de malaria ('tusschenpoozende koortsen') duizenden levens; rond Heerenveen viel massale sterfte. In de twee stambomen overlijden in 1826 veertien voorouders, dertien van hen tussen juli en november. Doodsoorzaken staan niet in de akten: het verband is context, geen bewijs." },
  { y: 1832, short: "1832", t: "Kadaster", d: "Het eerste landelijke kadaster legt van elk perceel de eigenaar vast. Daaruit blijkt wie grond bezat en wie pachtte." },
  { y: 1853, short: "1853", t: "Bisschoppen terug", d: "Herstel van de katholieke kerkorganisatie in Nederland. Overal verrijzen nieuwe katholieke kerken." },
  { y: 1878, y2: 1895, short: "Landbouwcrisis", t: "Landbouwcrisis", d: "Goedkoop graan uit Amerika drukt de prijzen. Veel Friese boeren schakelen over op melkvee; anderen vertrekken." },
  { y: 1886, short: "1886", t: "Eerste coöperatieve zuivelfabriek", d: "Het antwoord op de landbouwcrisis: in 1886 opende in Warga de eerste coöperatieve zuivelfabriek. In 1894 had Friesland er al 72, waarvan 34 coöperatief." },
  { y: 1888, short: "1888", t: "Domela Nieuwenhuis gekozen in Schoterland", d: "Het kiesdistrict Schoterland kiest Ferdinand Domela Nieuwenhuis als eerste socialist in de Tweede Kamer. Slechts een achtste van de volwassen mannen had kiesrecht. Friese veenarbeiders noemden hem 'ús ferlosser'." },
  { y: 1901, short: "1901", t: "Leerplicht", d: "Op 1 januari 1901 komt de leerplicht, voor kinderen van zes tot twaalf jaar. Boerenkinderen mochten in de oogsttijd nog thuisblijven. Bijzondere (ook katholieke) scholen krijgen pas met de Pacificatie van 1917 evenveel geld als de openbare school." },
  { y: 1918, short: "1918", t: "Spaanse griep", d: "De griepepidemie eist ook in Friesland veel slachtoffers." },
  { y: 1932, short: "1932", t: "Afsluitdijk", d: "De Zuiderzee wordt IJsselmeer. In september 1942 valt de Noordoostpolder droog, naast Blankenham en Kuinre. Veel jonge mannen die niet in Duitsland te werk gesteld wilden worden, doken er onder als polderwerker: voor ingewijden betekende N.O.P. 'Nederlands Onderduikers Paradijs'." },
  { y: 1940, y2: 1945, short: "WO II", t: "Tweede Wereldoorlog", d: "Bezetting van mei 1940 tot april 1945." },
  { y: 1947, y2: 1955, short: "Emigratie", t: "Emigratie naar Canada", d: "Na de oorlog vertrokken tienduizenden Nederlandse boerenzonen en -dochters naar Canada; alleen al in 1947–1949 bijna 16.000. Of Johannes Piet Huitema, een broer van Vronies moeder Akke, die in 1993 in Calgary overleed, in deze golf vertrok, is niet uitgezocht.", tl: false }
];

const GLOSSARY = [
  ["Kwartierstaat", "Overzicht van alle voorouders van één persoon. Elke voorouder krijgt een kwartiernummer (kw): de vader van nummer n is 2n, de moeder 2n+1."],
  ["Kwartierverlies", "Als dezelfde voorouder via twee lijnen in de kwartierstaat voorkomt, omdat verre familie met elkaar trouwde."],
  ["Patroniem", "Vadersnaam als tweede naam: Thijs Hilkes is Thijs, zoon van Hilke. In Friesland tot ver in de 19e eeuw gebruikelijk, ook naast een achternaam."],
  ["Naamsaanneming", "In 1811–1812 moesten families een vaste achternaam laten registreren. In Friesland zijn deze registers bewaard bij Tresoar."],
  ["Bidprentje", "Gedachtenisprentje dat katholieke families bij een begrafenis uitdeelden, vaak met geboorte- en sterfdatum en soms de ouders."],
  ["Statie", "Katholieke parochie in de tijd dat de katholieke eredienst officieel niet was toegestaan."],
  ["Zetboer", "Boer die een boerderij met vee van een eigenaar pachtte."],
  ["Grutter", "Ambachtsman die gort, grutten en meel maakte en verkocht."],
  ["Veehouder", "Boer met vooral melkvee; in deze families het meest voorkomende beroep."],
  ["Renteniersche", "Vrouw die leefde van de opbrengst van bezit, zonder eigen beroep."],
  ["Bevolkingsregister", "Gemeentelijke registratie van huishoudens en verhuizingen, sinds 1850."],
  ["Akte", "Inschrijving in de burgerlijke stand. Geboorteakten worden na 100 jaar openbaar, huwelijksakten na 75 jaar en overlijdensakten na 50 jaar."],
  ["Kop-hals-romp", "Friese boerderijvorm: woonhuis (kop), smal tussenstuk (hals) en grote schuur (romp) achter elkaar."],
  ["Memorie van successie", "Aangifte voor de erfbelasting na een overlijden, vanaf 1818. Noemt de erfgenamen met hun woonplaats en beroep, en of er onroerend goed was."],
  ["Boedelscheiding", "Notariële verdeling van een nalatenschap tussen de erfgenamen."],
  ["Quotisatiekohier", "Friese belastingtelling van 1749 per huishouden, met een inschatting van de welstand."],
  ["DTB", "Doop-, trouw- en begraafboeken van de kerken, vóór de burgerlijke stand van 1811."],
  ["Ondertrouw", "Aantekening van een voorgenomen huwelijk, vaak bij het gerecht of de kerk, enkele weken voor de bruiloft."],
  ["Kerknaam", "Latijnse naam die katholieken bij doop of huwelijk kregen: Abeltje werd Apollonia, Saapke Sabina, Akke Agatha."],
  ["Kloosternaam", "Naam die een kloosterzuster of -broeder bij intrede kreeg, zoals Rembertus voor Agatha ten Berge (stamboom van Harrie)."],
  ["Sluiswachter", "Man die een sluis bediende en het waterpeil bewaakte. In de stamboom van Harrie was Anne Thijsses de Groot het in 1848 in Steggerda."],
  ["Kastelein", "Herbergier, uitbater van een herberg of café."],
  ["Veenbaas", "Ondernemer die turf liet steken, drogen en per schip vervoeren."],
  ["Ketelboeter", "Ambachtsman die koperen en ijzeren ketels en potten repareerde."],
  ["Chirurgijn", "Heelmeester: zette botten en behandelde wonden. Een ambacht, geen gestudeerd arts."],
  ["Timmerbaas", "Timmerman met een eigen bedrijf en knechten."],
  ["Kerkvoogd", "Bestuurder van de bezittingen en geldzaken van een kerk."],
  ["Stemkohier", "Lijst van boerderijen met stemrecht (1640, 1698, 1728), met eigenaar en gebruiker. Katholieke eigenaren staan er soms als 'papist'."],
  ["Bediend", "Aantekening in een katholiek register dat iemand de laatste sacramenten ontving, meestal kort voor het overlijden."],
  ["Doopsgezind", "Lid van een mennonitische gemeente. Doopsgezinden doopten pas volwassenen; in Friesland waren ze talrijk."],
  ["Eigenerfde", "Boer die eigenaar was van zijn eigen boerderij en grond, in tegenstelling tot een pachter."],
  ["Huisman", "Oud woord voor boer."],
  ["Kadaster 1832", "Eerste landelijke registratie van alle percelen met hun eigenaar. Pachters staan er niet in."],
  ["Nedergerecht", "Lagere rechtbank van een Friese grietenij, onder meer voor voogdij en boedels."],
  ["Gortmaker", "Zelfde als grutter: iemand die gort en grutten maakte.", ["Woordenboek der Nederlandsche Taal, GORT", "https://gtb.ivdnt.org/iWDB/search?actie=article&wdb=WNT&id=M021124"]],
  ["Melktapper", "Verkoper van melk in het klein, melkslijter; het woord werd vooral in Friesland gebruikt.", ["Woordenboek der Nederlandsche Taal, TAPPER", "https://gtb.ivdnt.org/iWDB/search?actie=article&wdb=WNT&id=M067757"]],
  ["Hospes", "Waard van een logement of herberg: herbergier.", ["Woordenboek der Nederlandsche Taal, HOSPES (betekenis 2)", "https://gtb.ivdnt.org/iWDB/search?actie=article&wdb=WNT&id=M026694"]],
  ["Turfmaker", "Arbeider in het veen die turf maakte.", ["Woordenboek der Nederlandsche Taal, TURF", "https://gtb.ivdnt.org/iWDB/search?actie=article&wdb=WNT&id=M071281"]],
  ["Watermolenaar", "Molenaar van een watermolen, die het water uit de polder maalde.", ["Woordenboek der Nederlandsche Taal, WATERMOLEN", "https://gtb.ivdnt.org/iWDB/search?actie=article&wdb=WNT&id=M084112"]],
  ["Kofschipper", "Schipper van een kof: een zeilschip voor binnenvaart en kustvaart, van het type van de tjalk.", ["Woordenboek der Nederlandsche Taal, KOF", "https://gtb.ivdnt.org/iWDB/search?actie=article&wdb=WNT&id=M034542"]],
  ["Vroedsman", "Lid van een vroedschap, een bestuurscollege; het woord werd vooral in Friesland gebruikt.", ["Woordenboek der Nederlandsche Taal, VROED", "https://gtb.ivdnt.org/iWDB/search?actie=article&wdb=WNT&id=M082914"]],
  ["Kwartiernummer (kw)", "Het nummer van een voorouder in de kwartierstaat. De persoon van wie de stamboom uitgaat heeft nummer 1; de vader van nummer n heeft nummer 2n, de moeder 2n + 1. Behalve nummer 1 hebben mannen dus even en vrouwen oneven nummers.", ["Wikipedia, Kwartierstaat", "https://nl.wikipedia.org/wiki/Kwartierstaat"]],
  ["Politiedienaar", "Politieman van lage rang.", ["Woordenboek der Nederlandsche Taal, POLITIE", "https://gtb.ivdnt.org/iWDB/search?actie=article&wdb=WNT&id=M055130"]]
];
