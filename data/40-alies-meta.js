/* =====================================================================
   DE STAMBOOM VAN ALIES HOEKSTRA (de vrouw van Harrie)
   Eigen kwartierstaat met eigen nummering: kw 1 = Alies, vader 2n, moeder 2n+1.
   kw 12 hier is dus iemand anders dan kw 12 in de boom van Harrie. De app wisselt
   met setTree(); in de adresbalk begint alles van deze boom met "#a-".
   Bestanden: 40 (dit: lijnen, teksten, plaatsen), 41 (personen, gegenereerd), 42 (verhalen, feiten), 43 (open vragen, tegenstrijdigheden).
   ===================================================================== */
const ALIES = {
  root: "Alies", rootFull: "Alies Hoekstra", brand: "Hoekstra · Bakker", parents: "Franke en Aaltje",
  sibs: ["Hans", "Jikke", "Anja"], kids: ["Marit", "Tijmen", "Jorn"],
  LINES: {
    8: { name: "Hoekstra", sub: "Bosma · Krekt · Meibos", region: "Mildam, Katlijk, Oudeschoot", stem: [8, 16, 32, 64, 128],
      intro: "Boeren, arbeiders en een herbergier in en rond Mildam, Katlijk en Oudeschoot, bij Heerenveen. Wiebe Hanzes Hoekstra hield in Mildam een café, dat zijn weduwe Tjitske Bosma na zijn dood voortzette. Zijn vader Hans was in 1817 kerkvoogd van Katlijk. Aan moederskant waren de Douwenga's in de Knipe doopsgezind." },
    9: { name: "Hepkema", sub: "Bokma · Hoitema · Dijkstra", region: "Dijken, Langweer, Boornzwaag", stem: [9, 18, 36, 72, 144, 288],
      intro: "Veehouders en boeren uit de dorpen rond Langweer, Dijken, Boornzwaag en Doniaga, aan de Friese meren ten zuiden van Joure. In 1811 namen ze namen aan als Hepkema, Bokma, Hoitema en Dijkstra. Rond 1880 trok het gezin van Watze Hepkema naar Oranjewoud, waar ook de Hoekstra's woonden; in 1907 trouwde Afkes broer Siebren al met een halfzus van Wiebe Hoekstra." },
    10: { name: "Akkerman", sub: "Wijnsma · Koopmans · Wind", region: "Rohel, Rotsterhaule, Delfstrahuizen", stem: [10, 20, 40, 80, 160],
      intro: "Boeren uit het veengebied van Schoterland, aan de Tjeukemeer. Stamvader Johannes Jans noemde zich in 1771 al Ackerman, ruim voor de naamsaanneming van 1811. Twee van zijn kleinzonen kregen kinderen die in 1887 met elkaar trouwden, en via een derde lijn staat zijn zoon Jouke nog een keer in de stamboom." },
    11: { name: "Wietsma", sub: "Heida · Jongbloed · Kerkstra", region: "Oudeschoot, Nieuweschoot, Mildam", stem: [11, 22, 44, 88, 176],
      intro: "Arbeiders, boeren en veehouders in de dorpen rond Heerenveen. De Wytsma's kwamen uit IJlst. Tjeerd Roels Heida werd in 1811 ingeloot voor het leger, maar liet een plaatsvervanger gaan en werd boer met eigen grond in Mildam." },
    12: { name: "Bakker", sub: "Brouwer · Schaap · Romkema", region: "Broek, Ouwsterhaule, Goingarijp", stem: [12, 24, 48, 96, 192],
      intro: "Boeren en veehouders in het merengebied van Doniawerstal, rond Broek, Ouwsterhaule en Goingarijp, en later in Terkaple. De naam Bakker gaat terug op Sjoerd Binkes uit Balk, zoon van een broodbakker, die in 1811 de familienaam aannam. De familie Schaap boerde al rond 1720 in Goingarijp; een voorvader was in 1771 kerkvoogd bij de bouw van de nieuwe kerk. Kornelis Bakker en Antje de Vries, de grootouders van Aaltje, waren volle neef en nicht." },
    13: { name: "De Vries", sub: "Engelsma · Van der End", region: "Broek, Ouwster-Nijega, Terkaple", stem: [13, 26, 52, 104, 208],
      intro: "Boeren en veehouders in Broek en Ouwster-Nijega, in de natte hooi- en rietlanden van Doniawerstal. Durk Sjoerds de Vries was rond 1832 een grote grondbezitter en stierf als rentenier. Via de doopsgezinde familie Engelsma uit Akmarijp kwam de familie in Terkaple terecht. Antje de Vries trouwde in 1903 haar neef Kornelis Bakker; haar moeder was zelf een Bakker." },
    14: { name: "Van der Molen", sub: "Maat · Klijnstra · Akkerman", region: "Sintjohannesga, Rohel, Rotsterhaule", stem: [14, 28, 56, 112, 224],
      intro: "De Van der Molens kwamen uit Rottum en De Knipe en woonden vanaf 1807 in Sintjohannesga, Rohel en Rotsterhaule, midden in het laagveen van Schoterland. Veel voorouders in deze lijn leefden van het veen: veenbazen, turfmakers en arbeiders. Via Saakjen Akkerman sluit deze lijn aan op de familie Akkerman." },
    15: { name: "Gaastra", sub: "Brandsma · Veenstra · Van der Veer", region: "Oldeboorn, Akkrum, Beetsterzwaag", stem: [15, 30, 60, 120],
      intro: "De Gaastra's woonden in Oldeboorn aan de Boarn, met aangetrouwde families uit Akkrum, Beetsterzwaag en Haskerdijken. Arbeiders, boeren, een visser en een kuiper; verder terug een veerschipper, een politiedienaar en een zeekapitein die op zee verdronk." }
  },
  TXT: {
    heroTitle: "Boeren, veenbazen en veehouders rond <em>Heerenveen</em> en de Friese meren",
    heroLede: "De voorouders van Alies Hoekstra en haar broer en zussen, met bronnen terug tot {oldest}. Acht families uit Schoterland, Haskerland, Doniawerstal en Utingeradeel: van het veen rond de Tjeukemeer tot Oldeboorn aan de Boarn. Twee takken komen samen bij Jouke Akkerman en Niesje Wind, die via Franke én via Aaltje in de stamboom staan.",
    layerVerhalen: "De rode draden uit de akten van de families van Alies.",
    layerVerwanten: "De journalist Jacob Hepkema, en wat er verder nog te zoeken is.",
    statusNote: "De burgerlijke stand (1811–1950) staat bijna volledig op akten. Verder terug gaat het onderzoek via de kerkboeken.",
    famMapSub: "Van Oldeboorn en Terkaple tot het veen rond de Tjeukemeer.",
    verhalenLede: "Wat de akten samen vertellen over de families van Alies. Bij elk deel staat hoe zeker het is.",
    verwanten: "Aan de kant van Alies is één bekende verwant gevonden: de Friese journalist en krantenuitgever Jacob Hepkema, een kleinzoon van voorouders in de lijn Hepkema. Naar edelen en bestuurders is nog niet systematisch gezocht."
  },
  /* teksten voor de samengestelde boom "Harrie + Alies" (src/app.js, joinTrees) */
  SAMEN_TXT: {
    heroTitle: "Twee Friese families, <em>één</em> stamboom",
    heroLede: "De voorouders van Marit, Tijmen en Jorn, met bronnen terug tot {oldest}. In de waaier staan links de families van hun vader Harrie (De Groot en Boersma), rechts die van hun moeder Alies (Hoekstra en Bakker). Ze woonden vaak dicht bij elkaar: ruim 25 dorpen en steden komen in beide stambomen voor, van Heerenveen en Akkrum tot Oldeboorn en Oudeschoot.",
    layerVerhalen: "De verhalen uit beide stambomen.",
    layerVerwanten: "Bekende verwanten uit beide stambomen.",
    famMapSub: "Van de Stellingwerven en Gaasterland tot Oldeboorn en de Tjeukemeer.",
    verhalenLede: "De verhalen uit beide stambomen: eerst die van Harrie, dan die van Alies.",
    verwanten: "Bekende verwanten uit beide stambomen. Aan de kant van Harrie: de heilige Titus Brandsma en kanunnik Otto Spitzen. Aan de kant van Alies: de journalist Jacob Hepkema."
  },
  PEOPLE: [], STORIES: [], FACTS: [], OPEN_QUESTIONS: [], CONFLICTS: [], NOTABLES: [], SOURCE_GROUPS: [], MEDIA: [], HISTORY_TOUCH: [],
  CHANGES: { v: "versie 10", newKws: [], updKws: [], removed: [] }
};

/* Plaatsen die alleen in de boom van Alies voorkomen (zelfde vorm als data/02-places.js).
   infoA = achtergrondtekst op de plaatspagina in de boom van Alies. */
Object.assign(PLACES, {
  "Beetsterzwaag": P_(53.061, 6.078, "Opsterland", FR),
  "Broek": P_(52.983, 5.777, "Doniawerstal", FR),
  "Delfstrahuizen": P_(52.874, 5.824, "Haskerland", FR),
  "Dijken": P_(52.954, 5.711, "Doniawerstal", FR),
  "Echten": P_(52.873, 5.799, "Lemsterland", FR),
  "Goingarijp": P_(53.011, 5.772, "Doniawerstal", FR),
  "Lemmer": P_(52.845, 5.712, "Lemsterland", FR),
  "Mildam": P_(52.936, 6.002, "Schoterland", FR),
  "Nieuwehorne": P_(52.950, 6.056, "Schoterland", FR),
  "Nijemirdum": P_(52.866, 5.561, "Gaasterland", FR),
  "Oudehorne": P_(52.966, 6.092, "Schoterland", FR),
  "Gaastmeer": P_(52.962, 5.583, "Wymbritseradeel", FR),
  "Rotstergaast": P_(52.924, 5.937, "Schoterland", FR),
  "Langelille": P_(52.834, 5.869, "Schoterland", FR),
  "Oosterzee": P_(52.874, 5.858, "Lemsterland", FR),
  "Oldeouwer": P_(52.921, 5.799, "Doniawerstal", FR),
  "Oppenhuizen": P_(53.013, 5.695, "Wymbritseradeel", FR),
  "Oranjewoud": P_(52.946, 5.951, "Schoterland", FR),
  "Ouwster-Nijega": P_(52.930, 5.805, "Doniawerstal", FR),
  "Ouwsterhaule": P_(52.938, 5.813, "Doniawerstal", FR),
  "Rohel": P_(52.918, 5.832, "Schoterland", FR),
  "Rotsterhaule": P_(52.929, 5.852, "Schoterland", FR),
  "Rottum": P_(52.936, 5.890, "Schoterland", FR),
  "Ruigahuizen": P_(52.884, 5.565, "Gaasterland", FR),
  "Sintjohannesga": P_(52.932, 5.856, "Schoterland", FR),
  "Terhorne": P_(53.040, 5.781, "Utingeradeel", FR, { name: "Terhorne (Terherne)" }),
  "Terkaple": P_(53.018, 5.786, "Utingeradeel", FR),
  "IJlst": P_(53.011, 5.621, "IJlst", FR, { kind: "stad" }),
  "Katlijk": P_(52.947, 6.013, "Schoterland", FR),
  "Terwispel": P_(53.019, 6.048, "Opsterland", FR),
  "Tjalleberd": P_(52.998, 5.944, "Aengwirden", FR),
  "Ypecolsga": P_(52.931, 5.603, "Wymbritseradeel", FR),
  "Uitwellingerga": P_(53.003, 5.706, "Wymbritseradeel", FR),
  "Gorredijk": P_(53.003, 6.070, "Opsterland", FR),
  "Brongerga": P_(52.952, 5.978, "Schoterland", FR),
  "Zestienroeden": P_(52.974, 5.958, "Aengwirden", FR),
  "Eesterga": P_(52.865, 5.726, "Lemsterland", FR),
  "Jubbega": P_(53.005, 6.125, "Opsterland", FR, { name: "Jubbega-Schurega" }),
  "Lekkum": P_(53.225, 5.819, "Leeuwarderadeel", FR),
  "Hommerts": P_(52.979, 5.648, "Wymbritseradeel", FR),
  "Teroele": P_(52.936, 5.694, "Doniawerstal", FR),
  "Tjerkgaast": P_(52.904, 5.679, "Doniawerstal", FR),
  "Drachten": P_(53.109, 6.085, "Smallingerland", FR),
  "Nijeholtwolde": P_(52.895, 5.986, "Weststellingwerf", FR),
  "Nijeholtpade": P_(52.913, 6.078, "Weststellingwerf", FR),
  "Giethoorn": P_(52.739, 6.078, "Giethoorn", OV),
  "Nijeberkoop": P_(52.959, 6.191, "Ooststellingwerf", FR),
  "Doniawerstal": P_(52.957, 5.723, "Doniawerstal", FR, { kind: "gemeente", seat: "Langweer" }),
  "Utingeradeel": P_(53.049, 5.840, "Utingeradeel", FR, { kind: "gemeente", seat: "Akkrum" }),
  "Het Meer": P_(52.9645, 5.946, "Schoterland", FR, { infoA: "Een buurtschap in Schoterland, tussen Heerenveen en De Knipe, vlak boven het huidige Skoatterwâld. De stip staat waar het label op de topografische kaarten van 1865–1950 ligt. Hier overleed in 1842 Hylke Bintses Wijnsma, 85 jaar oud." }),
  "Lemsterland": P_(52.845, 5.712, "Lemsterland", FR, { kind: "gemeente", seat: "Lemmer" }),
  "Witmarsum": P_(53.098, 5.466, "Wonseradeel", FR)
});
/* buurtschappen zonder betrouwbare coördinaten: wel als naam, niet op de kaart */
Object.assign(OFFMAP, { "Zandgaast": "Zandgaast (buurtschap bij Langweer)", "Echtenerkooi": "Echtenerkooi (buurtschap bij Echten)", "Oudelamer": "Oudelamer (Weststellingwerf)", "Hemrik": "Hemrik (Opsterland)", "Indijken": "Indijken (bij Dijken, Doniawerstal)", "Scharren": "Scharren (Doniawerstal)", "Ameland": "Ameland (Waddeneiland)" });
