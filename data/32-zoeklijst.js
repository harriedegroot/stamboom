/* =====================================================================
   HELP MEE ZOEKEN: open vragen met de plek waar het antwoord vermoedelijk ligt.
   [{ boom: "h" | "a", kws: ["38" | "a-6"], vraag, beslist, archief, bron, link, online, hoe, pri: 1–3 }]
   online: "vrij online" | "online met inlog" | "scan op bestelling" | "alleen ter plaatse".
   ===================================================================== */
const ZOEKLIJST = [
 {
  "boom": "h",
  "kws": [
   "6669"
  ],
  "vraag": "Was Jeltje Reins van Hoitema de moeder van Tiete en Gatse Lieuckema?",
  "beslist": "Tiete Lieuckema is met akten een zoon van Rein Lieuckema (B). Dat Jeltje van Hoitema (overleden 1625) zijn moeder was, en niet een eerdere vrouw van Rein, staat alleen in de aantekeningen van De Walle. Haar grafsteen noemt haar wel de vrouw van Rein van Lieukema.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Nedergerecht Wonseradeel: de weesboeken van 1608–1609 en 1625–1627 noemen geen boedel van Rein of Jeltje. Nog niet gezien: de quaclappen en de boedels in Oudega (Wymbritseradeel), waar de curator Rein Hoitema in 1630 woonde.",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Zoek in Wymbritseradeel (Oudega) naar de familie Van Hoitema rond 1600–1630: een boedel of scheiding die Jeltje als dochter van Rein Hoites van Hoitema († 1589) of als moeder van Tiete en Gatse noemt.",
  "pri": 2
 },
 {
  "boom": "h",
  "kws": [
   "38",
   "39",
   "76",
   "77",
   "78",
   "79"
  ],
  "vraag": "Wie waren de ouders van Hendrik Meyners en Margaretha Niemann, die uit Duitsland naar Luinjeberd kwamen?",
  "beslist": "Hun huwelijk van 12 februari 1839 in Schwagstorf noemt waarschijnlijk hun ouders: dan komt de Duitse tak een generatie verder.",
  "archief": "Matricula, parochie St. Bartholomäus in Schwagstorf (Fürstenau), bisdom Osnabrück",
  "bron": "Heiraten 1787–1853 (D2_201): het jaar 1839, achteraan in het boek. In hetzelfde boek de huwelijken van hun ouders (Meyners × 'Oboer', ca. 1790–1807; Niemann × Anters, ca. 1795–1812)",
  "link": "https://data.matricula-online.eu/de/deutschland/osnabrueck/schwagstorf-furstenau-st-bartholomaus/D2_201/",
  "online": "vrij online",
  "hoe": "Blader in de browser naar februari 1839; de boeken zijn scans zonder index. Zoek daarna de huwelijken van de ouders; voor de familie Anters ook in de boeken van Merzen St. Lambertus.",
  "pri": 1
 },
 {
  "boom": "h",
  "kws": [
   "134",
   "268",
   "269"
  ],
  "vraag": "Was Durk Tjetses (overleden in Makkum op 15 januari 1799) de Durk die in 1764 in Makkum werd gedoopt?",
  "beslist": "Dan zijn Tietse Durks en Tiertjen Tierts zeker zijn ouders; nu is dat een hypothese (D), en daarboven ligt de rest van de Makkumer families.",
  "archief": "Tresoar (nedergerecht Wonseradeel); FamilySearch (kerkboeken Makkum)",
  "bron": "Voogdij of curatele over de kinderen van Durk Tjetses en Rinske Foppes, na 15-01-1799 of na 07-11-1807 (nedergerecht Wonseradeel); doop RK Makkum 12-02-1764",
  "online": "alleen ter plaatse",
  "hoe": "Het RK-dodenboek van Makkum noemt alleen naam en datum, geen leeftijd. Zoek daarom een voogdij of curatele over de drie kinderen na de dood van Durk (1799) of van Rinske (1807): een oom of grootmoeder als voogd zou zijn ouders aanwijzen. De rekeningen van curatoren van Wonseradeel 1785–1810 (inv. 087) zijn al doorgekeken: daarin staat geen rekening voor de kinderen van Durk en Rinske.",
  "pri": 1
 },
 {
  "boom": "a",
  "kws": [
   "a-160",
   "a-320",
   "a-321"
  ],
  "vraag": "De doop van Johannes Jans Akkerman, 29 april 1742 in Giethoorn: staat die zo in het doopboek?",
  "beslist": "Volgens een gezinsreconstructie van de doopboeken van Giethoorn was hij een zoon van Jan Paulus Akkerman en Willempje Roelofs (nu B). De scan van de doop maakt het A. Johannes staat drie keer in de stamboom, dus het antwoord telt drie keer.",
  "archief": "Collectie Overijssel (Zwolle), toegang 0124 (DTB Overijssel); scans ook op FamilySearch",
  "bron": "Doopboek Giethoorn (hervormd), 29-04-1742: Johannes, vader Jan Paulus Akkerman, moeder Willempje Roelofs, getuige Jantje Paulus Akkerman",
  "link": "https://collectieoverijssel.nl/zoekhulp/doop-trouw-en-begraafboeken/",
  "online": "vrij online",
  "hoe": "Zoek in de doopboeken van Giethoorn de doop van 29 april 1742. Staan de vader Jan Paulus, de moeder Willempje Roelofs en de getuige Jantje Paulus Akkerman erbij?",
  "pri": 1
 },
 {
  "boom": "h",
  "kws": [
   "38",
   "39"
  ],
  "vraag": "Wanneer werden Hendrik Meyners (1807) en Margaretha Niemann (1812) gedoopt?",
  "beslist": "Bevestigt hun geboortedata en geboorteplaatsen (Hollenstede en Schwagstorf) en noemt hun ouders en doopgetuigen.",
  "archief": "Matricula, parochie St. Bartholomäus in Schwagstorf (Fürstenau), bisdom Osnabrück",
  "bron": "Taufen 1803–1811 (D1_101_2): scans 22–26 voor 1807 en 27–32 voor 1808; Taufen 1812–1823 (D1_102_1): de eerste scans, oktober 1812",
  "link": "https://data.matricula-online.eu/de/deutschland/osnabrueck/schwagstorf-furstenau-st-bartholomaus/D1_101_2/",
  "online": "vrij online",
  "hoe": "Zoek rond 12 augustus 1807 (Hendrik, uit Hollenstede; zijn bidprentje zegt 1808) en rond 8 oktober 1812 (Margaretha).",
  "pri": 2
 },
 {
  "boom": "h",
  "kws": [
   "135",
   "208",
   "416"
  ],
  "vraag": "Was Rinske Foppes (Makkum) een dochter van Foppe Jochems Scheltinga en Sasse Bokkes?",
  "beslist": "Dan was haar moeder een zus van Titus Bokkes Terwisscha van Scheltinga, en staat hun vader Bocke Bockes twee keer in de stamboom. Nu is het een hypothese.",
  "archief": "FamilySearch (scans van de RK-doopboeken)",
  "bron": "RK-doopboeken Oldeholtpade en Makkum, ca. 1763–1767: een doop van Rinske (Reinske), dochter van Foppe. De ouders van Foppe zijn gevonden: Jochem Foppes en Lisbet Jans uit Sonnega; zijn oudste zus heette Rijnsje (1715). In de boedel- en proclamatieboeken van Weststellingwerf (1783–1808) staat geen boedel van Foppe of Saske",
  "online": "online met inlog",
  "hoe": "Blader op de scans naar een doop van Rinske met vader Foppe; de online index noemt bij deze dopen alleen de vader.",
  "pri": 2
 },
 {
  "boom": "h",
  "kws": [
   "183",
   "346",
   "347"
  ],
  "vraag": "Wie waren de ouders van Anna Maria Jans Fleer (overleden op De Haare in 1811)?",
  "beslist": "Bevestigt dat zij een dochter was van Jan Alberts Fleer en Marrigjen Otten (nu B). Dan staan die twee zeker twee keer in de stamboom.",
  "archief": "Collectie Overijssel (Zwolle)",
  "bron": "Overlijdensakte Oldemarkt 15-10-1811, akte 23 (aangifte door haar broer Roelof Jans), toegang 0123.9670; en de akte van bekendheid bij het huwelijk van haar dochter Maria, Oldemarkt 1832, akte 7",
  "link": "https://www.openarchieven.nl/hco:E48283B1-9B19-4F98-9F4D-88EF7FB7A75F",
  "online": "scan op bestelling",
  "hoe": "De scans staan niet online. Bestel ze via de snelle scanservice van Collectie Overijssel en lees wat de aangever en de akte van bekendheid over haar ouders zeggen.",
  "pri": 2
 },
 {
  "boom": "h",
  "kws": [
   "4"
  ],
  "vraag": "Wat staat er in de geboorteakte van Herman de Groot (Wolvega, 17 mei 1922)?",
  "beslist": "Bevestigt met een akte dat Kornelis de Groot en Elisabeth Kingma zijn ouders waren; nu blijkt dat uit een overlijdensadvertentie.",
  "archief": "Tresoar (Leeuwarden); gemeentearchief Weststellingwerf",
  "bron": "Burgerlijke stand Weststellingwerf, geboorten 1922 (openbaar, maar niet online: de gescande geboorteregisters op AlleFriezen lopen tot 1918)",
  "online": "scan op bestelling",
  "hoe": "Vraag bij Tresoar een scan of afschrift van de geboorteakte aan.",
  "pri": 2
 },
 {
  "boom": "h",
  "kws": [
   "1284",
   "1285",
   "1286"
  ],
  "vraag": "Wie was de eerste vrouw van Fresse Garwerts van de Blesse, de moeder van Gerwert, en wie was Hendrik, de vader van Jantjen Hendriks?",
  "beslist": "Gerwert Fressen en Jantjen Hendriks (De Blesse) staan twee keer in de stamboom (kwartierverlies). Hun ouders brengen beide lijnen tegelijk verder terug.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Fresse trouwde in 1670 en 1676; Gerwert was in 1689 al weduwnaar, dus zijn moeder was vermoedelijk een vrouw van vóór 1670. Jantjen Hendriks en haar broer Meine kwamen uit Nijensleek (Drenthe, trouwboek Vledder).",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Zoek een huwelijk van Fresse Garwerts vóór 1670 (Weststellingwerf of Vledder), en de doop of het huwelijk van Jantjen en Meine Hendricks in Vledder of Diever, met de naam van hun vader voluit.",
  "pri": 2
 },
 {
  "boom": "h",
  "kws": [
   "148",
   "296",
   "297"
  ],
  "vraag": "Wanneer werd Pieter Hoeben in Overpelt (België) gedoopt, en wanneer trouwden zijn ouders?",
  "beslist": "Brengt de Belgische tak een generatie verder: de doop van Pieter en het huwelijk van Matheus Hoeben en Catharina Kuppens.",
  "archief": "Rijksarchief Hasselt; scans op FamilySearch",
  "bron": "Parochieregisters Overpelt (FamilySearch: 'België, katholieke kerkboeken')",
  "online": "online met inlog",
  "hoe": "Blader in het doopboek van Overpelt rond mei 1762 (dat past bij zijn leeftijd bij overlijden) en rond 12 mei 1767 (de datum in het bevolkingsregister). Zoek daarna het huwelijk van zijn ouders, enkele jaren eerder.",
  "pri": 2
 },
 {
  "boom": "h",
  "kws": [
   "34",
   "68",
   "69"
  ],
  "vraag": "Wanneer werd Kornelis Jans Moezen (ca. 1808) gedoopt, en wanneer trouwden zijn ouders Joannes Derks Moezen en Aleida Rieuwenhorst?",
  "beslist": "Bevestigt zijn doop en brengt de familie Moezen in Overijssel verder: het huwelijk van zijn ouders (ca. 1795–1800) noemt waarschijnlijk hun herkomst.",
  "archief": "Collectie Overijssel (Zwolle); scans op FamilySearch",
  "bron": "DTB Dalfsen, ook de RK-registers van Dalfsen of Heino, ca. 1795–1811",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Dalfsen&j=&t=&q=dopen#results",
  "online": "online met inlog",
  "hoe": "Zoek de doop van Kornelis rond 1808 en de dopen van zijn broers en zussen; deze boeken staan niet in de online indexen van Open Archieven.",
  "pri": 2
 },
 {
  "boom": "h",
  "kws": [
   "496",
   "992",
   "993"
  ],
  "vraag": "Was Jan Gerrits Westendorp een zoon van Gerrit Mertens (Grutter, later Westendorp) en Aaltjen Jans uit Steenwijk?",
  "beslist": "De ouders van Johannes Jans Westendorp staan nu in zijn overlijdensakte (Balk 1826). Zijn grootouders komen alleen uit de genealogie van windgenealogie.org (C); een doop van Jan met vader Gerrit zou ze zeker maken.",
  "archief": "Collectie Overijssel (Zwolle); scans op FamilySearch",
  "bron": "DTB Steenwijk, doopboeken ca. 1715–1730, en de volkstelling van Steenwijk 1748",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Steenwijk&j=&t=&q=dopen#results",
  "online": "online met inlog",
  "hoe": "Zoek de doop van Jan met vader Gerrit (Mertens) in Steenwijk, en lees in de volkstelling van 1748 wie er bij Gerrit in huis woonde.",
  "pri": 2
 },
 {
  "boom": "h",
  "kws": [
   "202",
   "405"
  ],
  "vraag": "Wie waren de ouders van Sipkje Johannes uit Hidaard (overleden 1753), de moeder van Pieter Wybes Talsma?",
  "beslist": "Brengt deze lijn een generatie verder. Haar zussen waren vermoedelijk Ytje Johannes (getrouwd 1752 met Jacob Mevis uit Bozum) en Pierke Joannes; een broer misschien Durk Johannes.",
  "archief": "FamilySearch (scans van de RK-boeken van Roodhuis); Tresoar, via AlleFriezen",
  "bron": "RK-doopboek Roodhuis ca. 1715–1730 (alleen op scan); de curatele van 1782 over Sipke, zoon van Ytje Johannes, waarin haar man Wybe Pieters curator was (nedergerecht Hennaarderadeel)",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Roodhuis&j=&t=&q=dopen#results",
  "online": "online met inlog",
  "hoe": "Zoek dopen van Sipkje (Cypriana), Ytje en Pierke met een vader Johannes rond 1715–1730. Een weesakte of boedel van Johannes in Hidaard kan de kinderen samen noemen.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "394",
   "788",
   "789"
  ],
  "vraag": "Wanneer werd Gerben Nannes geboren: rond 1710 of rond 1716?",
  "beslist": "Zijn dochter gaf in 1806 een leeftijd van 95 jaar, 5 maanden en 5 dagen op, het register van Hennaarderadeel 90 jaar. Een doop van Gerben, zoon van Nanne, beslist dat en maakt ook de koppeling aan zijn ouders Nanne Gerbens en Diuke Meinerts (nu B) A.",
  "archief": "FamilySearch (scans van de RK-boeken van Roodhuis)",
  "bron": "RK-doopboek Roodhuis 1708–1717 (alleen op scan; de online index heeft voor Roodhuis vóór 1722 geen doop met een vader Nanne)",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Roodhuis&j=&t=&q=dopen#results",
  "online": "online met inlog",
  "hoe": "Blader de dopen van 1708 tot 1717 door naar een Gerben (Gerbrandus) met vader Nanne (Nanno) en moeder Diuke (Dieuwke); begin bij oktober 1710.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "406",
   "812",
   "1624",
   "1625"
  ],
  "vraag": "Wie waren de ouders en grootouders van Widmer Sipkes (Lutkewierum)?",
  "beslist": "Zijn doop (ca. 1718–1721) en die van zijn vader Sipke Widmers (ca. 1685–1695) bewijzen of Widmer Claases en Metje Sipkes (getrouwd 1680, Rien) zijn grootouders waren; nu is dat een hypothese (D).",
  "archief": "FamilySearch (scans van de RK-boeken van Roodhuis)",
  "bron": "RK-doopboek Roodhuis 1680–1722",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Roodhuis&j=&t=&q=dopen#results",
  "online": "online met inlog",
  "hoe": "Blader door de dopen van 1685–1695 (Sipke, vader Widmer) en van 1718–1721 (Widmer, vader Sipke). Ook een curatele over Widmer Ebkes, het zoontje van Geertie Widmers dat in 1719 wees werd, kan de grootouders noemen: die staat niet in het autorisatieboek van Hennaarderadeel 1711–1722; de recesboeken 1676–1732 zijn nog niet gelezen.",
  "pri": 2
 },
 {
  "boom": "h",
  "kws": [
   "448",
   "896",
   "897"
  ],
  "vraag": "Wie waren de ouders van Huite Klazes uit Heeg?",
  "beslist": "Nu komt de band met Klaas Dirks en Teeckien Rinties (getrouwd Heeg 1702) alleen uit een online stamboom (C); een doop of weesakte maakt het B of A.",
  "archief": "FamilySearch (scans); Tresoar",
  "bron": "RK-doopboek Heeg/Blauwhuis ca. 1703–1712; weesboek Wymbritseradeel na de dood van Klaas Dirks (vóór 1749)",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Heeg&j=&t=&q=dopen#results",
  "online": "online met inlog",
  "hoe": "Zoek een doop van Huite (Hoyte) met vader Klaas tussen 1703 en 1712; deze jaren staan niet in de online index.",
  "pri": 2
 },
 {
  "boom": "a",
  "kws": [
   "a-157",
   "a-314",
   "a-315"
  ],
  "vraag": "Was Sybrig Sipkes uit Eesterga een dochter van Sipke Jans en Gertie Gerrits uit Sondel?",
  "beslist": "Nu een hypothese (D): de dopen van Sondel (1752 en 1755) noemen in de index geen moeder.",
  "archief": "FamilySearch (scans van Tresoar)",
  "bron": "Doopboek Sondel, DTB 0298, 1752 en 1755; ook de begrafenis van de Sijbrig van 1752, of een boedel of voogdij van Sipke Jans of Gertie Gerrits (nedergerecht Gaasterland of Hemelumer Oldeferd, na 1761)",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Sondel&j=&t=&q=dopen#results",
  "online": "online met inlog",
  "hoe": "Lees de twee dopen op de scan: staat Gertie Gerrits erbij als moeder? Leefde de Sijbrig van 1752 nog?",
  "pri": 2
 },
 {
  "boom": "a",
  "kws": [
   "a-128"
  ],
  "vraag": "Waar kwam Tjeerd Wybes vandaan, de oudste Hoekstra in de stamboom?",
  "beslist": "Brengt de naamlijn Hoekstra een generatie verder, en laat zien waar de naam Hoekstra in 1811 werd vastgelegd.",
  "archief": "FamilySearch (scans van Tresoar); AlleFriezen",
  "bron": "DTB Schoterland en Haskerland ca. 1735–1740 (doop van Tjeerd, vader Wybe) en de trouw van 1764; register van naamsaanneming Schoterland 1811",
  "online": "online met inlog",
  "hoe": "Zoek een doop van Tjeerd met vader Wybe rond 1735–1740. Kijk daarna in het register van naamsaanneming van 1811 wie de naam Hoekstra aannam.",
  "pri": 2
 },
 {
  "boom": "a",
  "kws": [
   "a-90",
   "a-91",
   "a-181",
   "a-182"
  ],
  "vraag": "Waren Tjeerd Roels Heida en zijn vrouw Lijsbet Sammes Nijenhuis volle neef en nicht?",
  "beslist": "Als Janke Tjeerds (de moeder van Tjeerd) een dochter was van Tjeerd Sammes, net als Samme Tjeerds (de vader van Lijsbet), dan staan hun grootouders twee keer in de stamboom.",
  "archief": "FamilySearch (scans van Tresoar)",
  "bron": "DTB Schoterland (Oranjewoud, Mildam), doopboek ca. 1750–1758: doop van Janke, vader Tjeerd Sammes",
  "online": "online met inlog",
  "hoe": "Zoek een doop van Janke met vader Tjeerd Sammes; in de online index staan alleen de dopen van Samme (1746) en Yntze (1755).",
  "pri": 2
 },
 {
  "boom": "a",
  "kws": [
   "a-99",
   "a-199",
   "a-198",
   "a-396",
   "a-397"
  ],
  "vraag": "Wie waren de moeder en de grootouders van Aaltje Sybes Boetje uit Terhorne?",
  "beslist": "Haar vader Sybe Gerrits Boetje staat vast (A): haar overlijdensakte van 1815 noemt hem. Die akte noemt de moeder 'Antje Gerrits', maar Sybe trouwde in 1773 met Antje Wijbrens (nu B). Ook of Gerrit Sybes en Marijke Engeles zijn ouders waren, is nog een hypothese (D). Deze familie staat twee keer in de stamboom.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Memorie van successie of boedel van Antje Wiebrens (overleden Terhorne 1812) of van Sybe Gerrits (overleden vóór 1812), met de erfgenamen; doopsgezinde registers Akkrum/Terhorne 1770–1782. In het register van het weesboek van Utingeradeel 1778–1810 staan ze niet.",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Zoek een boedel, scheiding of memorie na de dood van Antje Wiebrens of Sybe Gerrits: daarin staan de kinderen uit beide huwelijken als erfgenamen.",
  "pri": 2
 },
 {
  "boom": "a",
  "kws": [
   "a-225",
   "a-450"
  ],
  "vraag": "Was Hiske Hanzes een dochter van Hans Wytzes uit De Knipe?",
  "beslist": "Nu een hypothese (D): zij is de enige Hiske met een vader Hans die in 1778 nog leefde, maar haar leeftijd is nergens bekend.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Lidmatenboeken Nieuwehorne/Hoornsterzwaag (deel 601) en De Knipe (deel 605): een attestatie van De Knipe naar Nieuwehorne",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Lees de lidmatenregels op de scans; de index heeft geen regel voor Hiske. De scans online zijn klein; een grotere scan is bij Tresoar aan te vragen.",
  "pri": 2
 },
 {
  "boom": "a",
  "kws": [
   "a-252",
   "a-504",
   "a-505"
  ],
  "vraag": "Waar kwam Pieter Jentjes (geboren 1708) vandaan, en wanneer trouwde hij met Wimke Willems in Akkrum?",
  "beslist": "Brengt de hernhutterlijn uit Akkrum aan de kant van Pieter een generatie verder.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Register van de hernhutters (deel 737); hun trouw rond 1734 staat niet in de geïndexeerde trouwen van 1730–1738",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Lees de inschrijving van Pieter in het hernhuttersregister op de scan: daar kan zijn geboorteplaats staan.",
  "pri": 2
 },
 {
  "boom": "h",
  "kws": [
   "833",
   "1666"
  ],
  "vraag": "Wat staat er precies in de trouwakten van Jacob Spanga en van Geertje Spanga (1647, 1679 en 1692)?",
  "beslist": "Of de Geertien Spanga van 1679 (getrouwd met Francke Franckena) dezelfde vrouw is als Geertje Jacobi Spanga van 1692, en of de bruid van 1647 'Catharina Tietes Lieuckema' heet. Dat kan de naam en de familie van Catharina bevestigen.",
  "archief": "FamilySearch (scans van Tresoar)",
  "bron": "Trouwregister Gerecht Weststellingwerf (23-01-1647 en 26-11-1679); 'Wonseradeel, Trouwen 1648-1702 / Alle Gezindten' (07-05-1692)",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Wonseradeel&j=1500-1812&t=&q=Trouwen#results",
  "online": "online met inlog",
  "hoe": "Log gratis in en blader naar de datum. Let op: staat er 'weduwe' bij de bruid, wie gaf haar aan, en welke vader of familie wordt genoemd?",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "833",
   "1667"
  ],
  "vraag": "Wie bezat in 1640 de Spanga-boerderij en Liauckema State in Makkum?",
  "beslist": "Was in 1640 een Lieuwkema eigenaar van grond die later bij de Spanga's hoorde, dan laat dat zien langs welke tak de grond via Catharina Lieuckema aan de Spanga's kwam.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Stemkohier Wonseradeel 1728 (inv. 3624), Makkum: de kolom met de eigenaren van 1640, bij stem 10 (in 1698 van Tiete Spanga) en bij Liauckema State (Makkum C 159)",
  "link": "https://www.openarchieven.nl/frl:b415b383-5ab0-4415-a236-5b361db38956",
  "online": "vrij online",
  "hoe": "Open de scan van het kohier van 1728 en lees bij deze twee boerderijen de kolom 1640.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "429",
   "858",
   "859"
  ],
  "vraag": "Was Teetske Jarigs, de vrouw van Ypke Hielkes in Workum, een dochter van Jarig Lieuwes en Sytske Thijsses?",
  "beslist": "Nu is dat sterk (B), uit doopgetuigen en een begraafregister. Een akte die haar ouders noemt, maakt het zeker. Let op een naamgenoot: de Workumer burgemeester Jarig Lieuwes Okma.",
  "archief": "FamilySearch (scans van Tresoar)",
  "bron": "RK-trouwboek Workum ca. 1744 (Ypke Hielkes × Teetske Jarigs; Tresoar DTB inv. 0868); haar begrafenis in Workum, 02-12-1769 (leeftijd)",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Workum&j=1500-1812&t=&q=Trouwen#results",
  "online": "online met inlog",
  "hoe": "Zoek de trouw van Ypke en Teetske rond 1744 en haar begrafenis in 1769. Een leeftijd van ongeveer 46 jaar past bij de doop van Teettie in Bolsward (1723).",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "208"
  ],
  "vraag": "Van wie erfde Titus Bokkes Terwisscha van Scheltinga de boerderijen Liauckema State (Makkum) en Scheltinga State (Arum)?",
  "beslist": "Een akte die de erfenis van Acke Terwisscha en haar zus Reinsje noemt, maakt de afleiding (nu B) zeker.",
  "archief": "Tresoar (Leeuwarden)",
  "bron": "Notarieel archief (toegang 26), notaris Attema in Wolvega: rekening van voogd Pier Jans, 10-02-1812, akte 4 (inv. 137004), en de boedelscheiding van 1819 (inv. 137008); niet gescand",
  "online": "alleen ter plaatse",
  "hoe": "Vraag de akten aan in de studiezaal van Tresoar. Ook de reële registers van Wonseradeel en Weststellingwerf (1784–1799) kunnen de overgang laten zien.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "240",
   "480"
  ],
  "vraag": "Welke Hans uit Bakhuizen was Johannes Lammerts: die van 1746 of die van 1747?",
  "beslist": "Zijn vader is nu Lammert Harmens Steenbergen (B); de doop van 1746 noemt een vader 'Lammert Lammerts'. De scan laat zien welke doop de juiste is.",
  "archief": "FamilySearch (scans van Tresoar)",
  "bron": "RK-doopboek Bakhuizen 1746–1747 (Tresoar DTB inv. 0305)",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Bakhuizen&j=&t=&q=dopen#results",
  "online": "online met inlog",
  "hoe": "Lees beide dopen op de scan: de getuigen staan alleen op de scan, niet in de index.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "206",
   "412",
   "413"
  ],
  "vraag": "Staat er ergens letterlijk dat Jan Tjeerds Jorna een zoon was van Tjeerd Hilles en Lijsbert Jans?",
  "beslist": "Nu een sterke afleiding uit een weesakte van 1793 (B); een akte die het zegt, maakt het A.",
  "archief": "FamilySearch (scans); Tresoar",
  "bron": "RK-doopboek Het Klooster (dopen van kinderen van Jan Tjeerds); memorie of boedelscheiding van Tjeerd Hilles (ca. 1786); curatele over Joannes na de dood van Lijsbert (1756–1764), nedergerecht Leeuwarderadeel. Al doorgekeken, zonder resultaat: het autorisatieboek van Leeuwarderadeel 1756–1765 en de boedelinventarissen 1762–1769",
  "online": "online met inlog",
  "hoe": "Kijk bij de dopen van de kinderen van Jan Tjeerds wie de doopheffers waren: grootouders worden daar vaak genoemd.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "218",
   "436",
   "437",
   "872"
  ],
  "vraag": "Was Tjerkjen Foppes de moeder van Taeke Durks Taekema, en wie was de vader van Durk Taekes?",
  "beslist": "Bevestigt de moeder (nu B) en brengt de lijn Taekema een generatie verder.",
  "archief": "FamilySearch (scans); Tresoar",
  "bron": "Doopboeken Burgwerd, Hichtum en RK Bolsward ca. 1715–1755; stemkohier Burgwerd 1728; nedergerecht Wonseradeel",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Bolsward&j=&t=&q=dopen#results",
  "online": "online met inlog",
  "hoe": "Kijk bij de doop van Teke (Bolsward, 29-11-1751) welke moeder er op de scan staat, en zoek de doop van Durk (ca. 1715–1720) met vader Taeke.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "514",
   "515"
  ],
  "vraag": "Wie waren de ouders van Hylcke Jans (Oudehaske), en die van Beint Hanses en Auckjen Beints uit Haskerhorne?",
  "beslist": "De ouders van Aefke Beits zijn gevonden: Beint Hanses, huisman in Haskerhorne, en Auckjen Beints (inventaris van 13 juni 1677). Nu nog de vorige generatie, en de vader van Hylcke Jans (een Jan in Oudehaske).",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Nedergerecht Haskerland: het weesboek 1671–1678 (inv. 041) en het inventarisatieboek 1673–1681 (inv. 050) zijn via hun registers bekeken. Nog niet gezien: de weesboeken 1643–1667 (inv. 035–040), de sententieboeken 1651–1658 (inv. 026) en de proclamatieboeken 1661–1689 (inv. 053, 054), alle zonder index.",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Zoek in de oudere weesboeken een curatele of boedel met Beint Hanses of Auckjen Beints (hun huwelijk was rond 1655–1660), en een boedel van een Jan in Oudehaske met een zoon Hylcke. Hylke Jans Offringe (getrouwd 1654) is het niet: hij overleed vóór 1658.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "407",
   "814"
  ],
  "vraag": "Was Jantje Tjeerds Langendijk de vader van Baukje Jantjes, de vrouw van Widmer Sipkes?",
  "beslist": "Maakt de koppeling (nu B, via de naam Langendijk bij twee kleinzonen) zeker.",
  "archief": "FamilySearch (scans); Tresoar",
  "bron": "RK-doopboeken Wijtgaard en Warga vóór 1736; floreenkohier en nedergerecht Baarderadeel. Het register van het weesboek van Baarderadeel 1759–1779 (inv. 050) noemt hen niet",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Wijtgaard&j=&t=&q=dopen#results",
  "online": "online met inlog",
  "hoe": "Zoek een doop van Baukje, Elbrig, Inske of Tiert met vader Jantje Tjeerds.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "1666",
   "417"
  ],
  "vraag": "Was Jacob Spanga echt 'jonkheer', en was Grietje Bokkes echt 'waarzegster'?",
  "beslist": "Of er een adellijke of deftige familie Van Spanga was, en of 'waarzegster' een leesfout is voor 'aanzegster' (iemand die een overlijden rondbracht).",
  "archief": "FamilySearch (scans van Tresoar)",
  "bron": "'Wonseradeel, Trouwen 1648-1702 / Alle Gezindten' (20-01-1664) en 'Makkum, Overlijden 1724-1811 / Rooms Katholiek' (20-11-1746)",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Makkum&j=&t=&q=overlijden#results",
  "online": "online met inlog",
  "hoe": "Lees de twee regels op de scan; op AlleFriezen staan bij deze registers geen scans.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "234",
   "468",
   "469"
  ],
  "vraag": "Waarom bracht 'neef Douwe Sijmons' Maurens Philippus groot, en wie waren de ouders van Philippus Maurits en Dieuwke Wabes uit Winsum?",
  "beslist": "Brengt deze lijn uit Winsum een generatie verder.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Boedel van 1772: autorisatieboek Baarderadeel, inv. 033, folio 1 (scan online, nog niet gelezen); RK-dopen Dronrijp ca. 1710–1720",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Lees de scan van de boedel van 1772: die noemt waarschijnlijk de erfgenamen en voogden. Spoor: Mourens Philips, varensgezel in Franeker, trouwde in 1703 met Trijntje Heeres uit Peins. Philippus noemde zijn eerste kinderen Trintje (1742, getuige Yfke Heeres) en Mauritius (1744). Een doop van Philippus in Franeker (ca. 1704–1715) zou kunnen bewijzen dat zij zijn ouders waren.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "38",
   "39"
  ],
  "vraag": "Wanneer kwamen Hendrik Meyners en Margaretha Niemann naar Friesland?",
  "beslist": "Het jaar van vestiging en de vorige woonplaats van het Duitse echtpaar.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Bevolkingsregister Aengwirden 1850–1860 en 1860–1872, huis Luinjeberd 82",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Zoek op de scans het blad van Luinjeberd 82; in die jaren staan zij niet op naam in de index.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "8"
  ],
  "vraag": "Welke kloosternaam had Kornelia de Groot, de zus van Kornelis de Groot? Zij overleed in 1931 als kloosterzuster in Moergestel.",
  "beslist": "Haar kloosternaam en congregatie. Een online stamboom noemt zuster Nepomucena (C), maar dat is niet bewezen.",
  "archief": "Archief RK Friesland (Bolsward); Zusters van Liefde van Tilburg (erfgoed); Erfgoedcentrum Nederlands Kloosterleven (Sint Agatha)",
  "bron": "Bidprentje 55656 in de reeks Religieuzen (Archief RK Friesland); archief van de Zusters van Liefde van Tilburg, die in Moergestel het Sint-Stanislausklooster hadden",
  "online": "scan op bestelling",
  "hoe": "Vraag het bidprentje op bij het Archief RK Friesland, of vraag de congregatie naar een zuster De Groot die in 1931 in Moergestel overleed. In 1916 woonde zij nog in Groningen.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "24"
  ],
  "vraag": "Schonk Gerben Boersma, de broer van Jacobus Meintes Boersma, in 1926 de grootste klok (Wiro) van de nieuwe kerk in Oosterwierum?",
  "beslist": "Of dit familieverhaal klopt: de kranten van 1925 en 1926 noemen alleen een inzameling onder de parochianen.",
  "archief": "Tresoar; Katholiek Documentatiecentrum",
  "bron": "Parochiearchief Easterwierrum; de tekst op de klok in de toren",
  "online": "alleen ter plaatse",
  "hoe": "Wie in Easterwierrum kan komen, kan vragen of iemand de tekst op de grootste klok kan lezen: noemt die een schenker?",
  "pri": 3
 },
 {
  "boom": "a",
  "kws": [
   "a-224",
   "a-448",
   "a-449"
  ],
  "vraag": "Waar kwam Gosse Elkes vandaan, de vader van bakker Durk Gosses van der Molen?",
  "beslist": "Brengt de familie Van der Molen een generatie verder; ook de trouw van Gosse Elkes en Doutie Durks (vóór 1757) is nog niet gevonden.",
  "archief": "FamilySearch (scans); Tresoar",
  "bron": "Trouwboek De Knipe vóór 1757 en DTB De Knipe/Het Meer 1745–1755; lidmaten Schoterland",
  "online": "online met inlog",
  "hoe": "Zoek in het trouwboek van De Knipe naar Gosse Elkes en Doutie Durks; dit boek staat niet in de online index.",
  "pri": 3
 },
 {
  "boom": "a",
  "kws": [
   "a-505",
   "a-1010"
  ],
  "vraag": "Met wie was Willem Martens uit Akkrum getrouwd, en waren er twee mannen met die naam?",
  "beslist": "Geeft de moeder van Wimke Willems, en laat zien of de diaken en ouderling Willem Martens echt haar vader was (nu B). In 1724 werd nog een Wimke gedoopt met een vader Willem Martens.",
  "archief": "FamilySearch (scans); Tresoar",
  "bron": "Trouwboek Akkrum (of Utingeradeel/Terhorne) ca. 1700–1706",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Akkrum&j=1500-1812&t=&q=Trouwen#results",
  "online": "online met inlog",
  "hoe": "Zoek de trouw van Willem Martens rond 1705; het trouwboek van Akkrum uit die jaren staat niet in de online index.",
  "pri": 3
 },
 {
  "boom": "a",
  "kws": [
   "a-1174",
   "a-1175"
  ],
  "vraag": "Waar kwam Yts Gerkes vandaan, en wanneer trouwde zij met Tjebbe Jans in Joure?",
  "beslist": "Haar familie bracht land mee in Broek en Haskerhorne; haar testament of hun trouw (vóór 1698) kan haar ouders noemen.",
  "archief": "Tresoar (Leeuwarden)",
  "bron": "Nedergerecht Haskerland: protocollen en testamenten (testament van Yts Gerkes, ca. 1728–1744); doopsgezinde registers van Joure",
  "online": "alleen ter plaatse",
  "hoe": "Vraag naar het testament van Yts Gerkes. Tjebbe Jans was doopsgezind; daarom staat hun dochter Richtje in geen enkel doopboek.",
  "pri": 3
 },
 {
  "boom": "a",
  "kws": [
   "a-301",
   "a-603"
  ],
  "vraag": "Was Martentje Martens de moeder van Aafke Sjoerds?",
  "beslist": "Nu een hypothese (D); Aafke ontbreekt bij de inhaaldopen van haar broer en zus in 1744.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Lidmatenboek Oppenhuizen-Uitwellingerga (deel 881): belijdenis van Aafke Sjoerds, ca. 1760; of de trouw van Sjoerd Okkes (ca. 1735–1740)",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Lees de lidmatenregels rond 1760 op de scan: staat er bij Aafke een moeder of herkomst?",
  "pri": 3
 },
 {
  "boom": "a",
  "kws": [
   "a-392",
   "a-784",
   "a-785"
  ],
  "vraag": "Was Wouter Gerkes Scaep de vader van Ids Wouters Schaep uit Goingarijp?",
  "beslist": "Nu een sterke hypothese (D), op naam, de zeldzame bijnaam Scaep, dorp en tijd. Deze familie staat twee keer in de stamboom.",
  "archief": "Tresoar (Leeuwarden)",
  "bron": "Nedergerecht Doniawerstal of Utingeradeel na 1728: een boedel van Wouter Gerkes die zijn kinderen noemt",
  "online": "alleen ter plaatse",
  "hoe": "Zoek een boedel of voogdij na de dood van Wouter Gerkes; die noemt zijn kinderen bij naam.",
  "pri": 3
 },
 {
  "boom": "a",
  "kws": [
   "a-248",
   "a-249"
  ],
  "vraag": "Wanneer en met welk schip verdronk zeekapitein Ysbrand Thomas, die in 1755 in Heerenveen trouwde?",
  "beslist": "Het verhaal van een zeekapitein in de familie, en de herkomst van zijn vrouw Jeltje Klazes.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Overlijdensakte Jeltje Klazes (Oldeboorn, 09-12-1813); doop- en lidmatenboeken Heerenveen en Oldeboorn; zeemansregisters",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Begin bij de scan van de overlijdensakte van zijn weduwe (1813): de beeldlink wijst een verkeerde bladzijde aan, dus blader verder naar december.",
  "pri": 3
 },
 {
  "boom": "a",
  "kws": [
   "a-10"
  ],
  "vraag": "Welke plek in Schoterland is het 'Gaast' waar Franke Akkerman in 1894 werd geboren?",
  "beslist": "Waar de familie Akkerman toen woonde: niet Gaast aan het IJsselmeer, maar een plek in Schoterland (misschien Rotstergaast; dat is een hypothese).",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Geboorteakte Schoterland 1894 (scan) en het bevolkingsregister van Schoterland 1890–1900",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Lees op de scan van de geboorteakte de wijk of het dorp, en zoek het gezin daarna in het bevolkingsregister.",
  "pri": 3
 },
 {
  "boom": "a",
  "kws": [
   "a-5"
  ],
  "vraag": "Wat staat er in de geboorteakte van Jantje Akkerman (Delfstrahuizen, 11 januari 1921)?",
  "beslist": "Bevestigt haar geboortedatum en geboorteplaats. De datum komt nu uit het bevolkingsregister van Schoterland; een geboorteplaats staat daar niet bij.",
  "archief": "Tresoar (Leeuwarden)",
  "bron": "Burgerlijke stand Schoterland (toegang 30-31), geboorten 1921: Delfstrahuizen hoorde toen bij Schoterland. Openbaar, maar nog niet in de online index",
  "online": "scan op bestelling",
  "hoe": "Vraag bij Tresoar een scan of afschrift van de geboorteakte aan.",
  "pri": 3
 },
 {
  "boom": "a",
  "kws": [
   "a-114"
  ],
  "vraag": "Wanneer werd Lucas Symens Klijnstra (ca. 1774) gedoopt, en wanneer trouwde hij met Aaltje Harmens?",
  "beslist": "Brengt deze lijn uit Sintjohannesga een generatie verder.",
  "archief": "FamilySearch (scans van Tresoar)",
  "bron": "DTB Schoterland, hervormd Sintjohannesga: doop ca. 1774 en trouw ca. 1795–1797",
  "online": "online met inlog",
  "hoe": "Zoek een doop van Lucas met vader Symen rond 1774, en de trouw met Aaltje Harmens rond 1796.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "6668",
   "6669",
   "1666"
  ],
  "vraag": "Is er een afbeelding van de grafsteen van Rein Lieuwkema (1608), Jeltje van Hoitema (1625) en Jacob Spanga (1679) in Makkum?",
  "beslist": "De tekst van de steen kennen we alleen uit de aantekeningen van Hessel de Walle. Een foto of een scan van zijn handschrift laat zien wat er precies staat, en kan de namen en sterfjaren bevestigen.",
  "archief": "Tresoar (Leeuwarden); de kerk in Makkum",
  "bron": "Verzameling Hessel de Walle, inscripties en grafschriften (Tresoar, toegang 0001, akte 4276); en de steen zelf, als die nog in de kerk in Makkum ligt",
  "link": "https://www.openarchieven.nl/frl:e5703ef2-9434-4aa4-afb0-566e6e07c47f",
  "online": "scan op bestelling",
  "hoe": "Vraag bij Tresoar een scan aan van de bladzijde bij De Walle. Vraag de kerkvoogdij in Makkum (of ga zelf kijken) of de zerk nog in de kerk ligt, en maak een foto. Op Wikimedia Commons, in de beeldbank van Tresoar en bij HCL staat hij niet.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "337",
   "674",
   "675"
  ],
  "vraag": "Was Cornelisjen Coops, de weduwe van Roelof Eyses uit Ter Idzard, ook de moeder van Trijntje Roelofs (geboren ca. 1733)?",
  "beslist": "De boedelscheiding van 1757 noemt haar alleen de moeder van Jantjen, een zus van Trijntje; als moeder van Trijntje is zij nu een hypothese (D). Het huwelijk van Roelof en Cornelisjen vóór 1733, of een akte die Trijntje haar dochter noemt, maakt dat B of A.",
  "archief": "FamilySearch (scans RK Oldeholtpade); Tresoar",
  "bron": "Huwelijk van Roelof Eyses en Cornelisjen Coops (vóór 1733; niet in de online index); de dispensatie bij het RK-huwelijk van Eyse Alberts en Catharina Roelofs (Oldeholtpade, 4 mei 1754)",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Oldeholtpa&j=&t=&q=dopen#results",
  "online": "online met inlog",
  "hoe": "Kijk op de scan van het RK-huwelijk van 4 mei 1754 of er een dispensatie staat (die zou zeggen of Eyse en Catharina neef en nicht waren), en zoek in het Gerecht Weststellingwerf en de RK-boeken van Oldeholtpade vóór 1733 naar Roelof Eyses (Eisses, Eysen) en Cornelisjen (Kneelsjen) Coops. Let op: er was ook een jongere Roelof Eyses in Steggerda (getrouwd rond 1752 met Aaltje Harmens, hervormd). Roelof uit Ter Idzard overleed vermoedelijk in januari 1751 (register van overledenen Oldeholtpade).",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "180"
  ],
  "vraag": "Was Seuwert Frits (getrouwd 1784 met Jantje Alten) dezelfde als de Sieuwert Frits uit Ter Idzard die in 1768 met Trijntje Joannis Steffes trouwde?",
  "beslist": "In 1784/1785 staat in het register van het inventarisatieboek van Weststellingwerf een 'acte van uitwysing' van Souwert Frits op Ter Idzard. Noemt die akte kinderen of een eerdere vrouw, dan wordt de hypothese (D) B of A.",
  "archief": "Tresoar",
  "bron": "Nedergerecht Weststellingwerf, inventarisatieboek 1783–1807 (toegang 13-42, inv. 096), p. 37; de bladzijden 32–39 staan niet in de online scans",
  "link": "https://www.allefriezen.nl/",
  "online": "scan op bestelling",
  "hoe": "Vraag bij Tresoar een scan van p. 37 van inv. 096 (of kijk ter plaatse), en lees wie er in de akte van uitwijzing genoemd worden.",
  "pri": 3
 },
 {
  "boom": "a",
  "kws": [
   "a-594",
   "a-297"
  ],
  "vraag": "Was Johannes Clases uit IJlst de vader van Antje Johannes, de moeder van Freerk Douwes Bokma?",
  "beslist": "In de boedel van Douwe Freerks (1766) heet Johannes Clases 'grootvader' van Freerk en Johannes Douwes. Dat hij de vader van Antje is, volgt uit die akte en haar vadersnaam (B). Haar doop of zijn huwelijk maakt het A, en brengt een generatie verder.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Doopboeken van IJlst, Wymbritseradeel en Haskerland ca. 1715–1730; weesboek IJlst 1745–1811 (zonder register). Spoor: Johannes Klaas en Blyke Klaas lieten in Joure in 1725 een tweeling Antje en Wybe dopen.",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Zoek dopen van een Antje met vader Johannes Claes (Klaas, Clases, Klazes) tussen 1715 en 1730, en een trouw van Johannes Clases vóór 1730. Kijk of de Johannes Klaas uit Joure later in IJlst woonde. Let op: een jongere Johannes Klaases in Langweer (dopen 1769–1773) is een ander.",
  "pri": 3
 },
 {
  "boom": "h",
  "kws": [
   "432"
  ],
  "vraag": "Was Andrieske, de oudste dochter van IJsbrand Geles (gedoopt 1736), de Andersche IJsbrands die met Hendrik Johannes Brandsma trouwde? Dan stamt Titus Brandsma ook van IJsbrand Geles af.",
  "beslist": "De memorie van Gaele IJsbrands Galema (1819) noemt als zesde erfdeel een overleden zus, 'NN IJsbrands Galema', met Brandsma-kinderen. De overlijdensakte van Mevis Hendriks Brandsma (1827) noemt zijn moeder Andersche IJsbrands. Nu is het vermoedelijk (B); de index van de memorie zegt iets anders over de Brandsma's dan de akte van 1827.",
  "archief": "Tresoar",
  "bron": "Memorie van successie Gaele IJsbrands Galema, kantoor Bolsward, inv. 2003, nr. 587; boedelscheiding bij notaris Evert Schotanus, Workum, 04-03-1820",
  "link": "https://www.openarchieven.nl/frl:d0fcb09c-cd8c-4025-ba64-d928ef562b0a",
  "online": "scan op bestelling",
  "hoe": "Zoek de memorie (nr. 587) op de film van het kantoor Bolsward op AlleFriezen, of vraag bij Tresoar de boedelscheiding van 1820 op. Kijk hoe de zus heet en wie haar kinderen zijn.",
  "pri": 2
 }
];
