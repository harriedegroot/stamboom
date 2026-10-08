/* =====================================================================
   HELP MEE ZOEKEN: open vragen met de plek waar het antwoord vermoedelijk ligt.
   [{ boom: "h" | "a", kws: ["38" | "a-6"], vraag, beslist, archief, bron, link, online, hoe, pri: 1–3 }]
   online: "vrij online" | "online met inlog" | "scan op bestelling" | "alleen ter plaatse".
   ===================================================================== */
const ZOEKLIJST = [
 {
  "boom": "h",
  "kws": [
   "3334",
   "6668",
   "6669"
  ],
  "vraag": "Was Tiete Lieuckema, de grootvader van Geertje Spanga, een zoon van Rein Meies Lieuwkema en Jeltje Reins van Hoitema?",
  "beslist": "Trijntje Lieuckema, de moeder van Geertje Spanga, was een volle zus van Meye Tietes Lieuckema (curatele 1664), en dus een dochter van Tiete. Dat Tiete een zoon was van Rein Meies Lieuwkema en Jeltje van Hoitema, staat nu alleen in de aantekeningen van De Walle. Een akte zou de lijn tot rond 1550 zeker maken.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Nedergerecht Wonseradeel, weesboeken 1629–1632 (na de dood van Tiete in 1629: een weesakte over zijn kinderen Meye en Trijntje noemt vaak ooms en grootouders), en de quaclappen van het Hof van Friesland (Meye Reyns Lieuckema, 1581)",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Blader in de weesboeken van Wonseradeel van 1629 tot 1632 (per jaar gescand, zonder namenindex) naar een titelblad als 'Inventaris van Tiete Reyns goederen' of naar de namen Meye en Trijntje.",
  "pri": 1
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
  "hoe": "Het RK-dodenboek van Makkum noemt alleen naam en datum, geen leeftijd. Zoek daarom een voogdij of curatele over de drie kinderen na de dood van Durk (1799) of van Rinske (1807): een oom of grootmoeder als voogd zou zijn ouders aanwijzen.",
  "pri": 1
 },
 {
  "boom": "a",
  "kws": [
   "a-160",
   "a-320",
   "a-321"
  ],
  "vraag": "Wie waren de ouders van Johannes Jans Akkerman (ca. 1743), de oudste Akkerman in de stamboom?",
  "beslist": "Bevestigt of hij een zoon was van Jan Paulus Ackerman en Willempje Roelofs uit Giethoorn (nu een hypothese, D). Johannes staat drie keer in de stamboom, dus het antwoord telt drie keer.",
  "archief": "Collectie Overijssel (Zwolle); scans op FamilySearch",
  "bron": "DTB Giethoorn (hervormd): doopboek ca. 1735–1750, en het lidmatenboek (vertrek met attestatie naar Sintjohannesga, februari 1765)",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Giethoorn&j=&t=&q=dopen#results",
  "online": "online met inlog",
  "hoe": "Zoek in de doopboeken van Giethoorn naar kinderen van Jan Paulus (Ackerman) en Willempje Roelofs: Roelof, Paulus, Johannes, Harmen, Grietje, Geertje of IJda. Kijk ook in de eigen DTB-index van Collectie Overijssel.",
  "pri": 1
 },
 {
  "boom": "a",
  "kws": [
   "a-133",
   "a-266",
   "a-267",
   "a-360",
   "a-361"
  ],
  "vraag": "Wie was de moeder van Martje Jans, geboren in Mildam in juli 1753?",
  "beslist": "Haar overlijdensakte noemt Antje Harmens, maar de enige Jan Jeips in die dorpen was getrouwd met Akke Roels. Was het Akke, dan waren Martje en Roel Jans Heida broer en zus, en staat Jan Jeips twee keer in de stamboom.",
  "archief": "FamilySearch (scans van Tresoar)",
  "bron": "Doopboek hervormd Oudeschoot c.a. (Oudeschoot, Nieuweschoot, Mildam, Rottum en Katlijk), DTB 0607, juli–augustus 1753",
  "online": "online met inlog",
  "hoe": "Blader naar juli en augustus 1753 en kijk welke moeder er bij de doop van Martje staat.",
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
  "bron": "RK-doopboeken Oldeholtpade en Makkum, ca. 1763–1767: een doop van Rinske (Reinske), dochter van Foppe",
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
   "320",
   "321"
  ],
  "vraag": "Wie waren de ouders van Albert Eysche en Tjertjen Garwerts uit Peperga?",
  "beslist": "Zij staan twee keer in de stamboom (kwartierverlies). Hun ouders brengen beide lijnen tegelijk een generatie verder.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "RK-doopboek Steggerda (DTB 0781), huwelijk 1715; autorisatieboeken Weststellingwerf (inv. 055 en ouder): in 1733 was Remmelt Eijssen 'oom van vaderskant'",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Zoek het huwelijk van 1715 met de getuigen, en een weesakte of boedel van de ouders van Albert of Remmelt Eijssen (patroniem Eijsses, Eisses).",
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
   "404",
   "405",
   "808",
   "809"
  ],
  "vraag": "Wie was de moeder van Pieter Wybes Talsma (overleden Hidaard 1796)?",
  "beslist": "Of Sipkje Johannes zijn moeder was (nu een hypothese, D), of een eerdere vrouw van zijn vader Wybe Pieters Tolsma. Het trouwboek kan ook het huwelijk van zijn grootouders Pieter Wybes en Minke Athes laten zien.",
  "archief": "FamilySearch (scans van de RK-boeken van Roodhuis)",
  "bron": "RK-doopboek Roodhuis ca. 1750–1752 (doop van Pieter, zoon van Wybe Pieters); RK-trouwboek Roodhuis ca. 1719 (Pieter Wybes × Minke Athes)",
  "link": "https://www.genealogiewerkbalk.nl/fs/?p=Roodhuis&j=&t=&q=dopen#results",
  "online": "online met inlog",
  "hoe": "Zoek de doop van Pieter rond 1750–1752 en kijk welke moeder er staat; deze doop staat niet in de online index.",
  "pri": 2
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
  "hoe": "Blader door de dopen van 1685–1695 (Sipke, vader Widmer) en van 1718–1721 (Widmer, vader Sipke).",
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
   "a-147",
   "a-208",
   "a-209"
  ],
  "vraag": "Was Baukje Sjoerds uit Broek een dochter van Sjoerd Sybes en Fetje Klazes?",
  "beslist": "Nu een sterke afleiding (B): geen akte noemt haar ouders. Een boedel of voogdij maakt het zeker.",
  "archief": "Tresoar (Leeuwarden)",
  "bron": "Nedergerecht Doniawerstal, weesboeken 1777–1784 (na de dood van Fetje Klazes in 1777 en Sjoerd Sybes in 1784); de memorie of het overlijden van haar broer Klaas Sjoerds (1806–1811)",
  "online": "alleen ter plaatse",
  "hoe": "Zoek een voogdij of boedelscheiding na de dood van Fetje Klazes of Sjoerd Sybes: daarin staan hun kinderen bij naam.",
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
   "a-198",
   "a-396",
   "a-397"
  ],
  "vraag": "Wie waren de ouders en grootouders van Aaltje Sybes Boetje uit Terhorne?",
  "beslist": "Of zij een dochter was van Sybe Gerrits Boetje en zijn tweede vrouw Antje Wijbrens, en of Gerrit Sybes en Marijke Engeles zijn ouders waren (nu een hypothese, D). Deze familie staat twee keer in de stamboom.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Huwelijksbijlagen Utingeradeel, juli 1837 (huwelijk van Symon Sybes Boetje), met een afschrift van de akte van bekendheid; doopsgezinde registers Akkrum/Terhorne 1770–1782",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Open de bijlagen bij de huwelijksakte van Symon Sybes Boetje (juli 1837): een akte van bekendheid noemt vaak de overleden ouders en grootouders.",
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
  "bron": "RK-doopboek Het Klooster (dopen van kinderen van Jan Tjeerds); memorie of boedelscheiding van Tjeerd Hilles (ca. 1786); curatele over Joannes na de dood van Lijsbert (1756–1764), nedergerecht Leeuwarderadeel",
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
  "vraag": "Wie waren de ouders van Hylcke Jans (Oudehaske) en Aefke Beits (Haskerhorne), getrouwd in 1681?",
  "beslist": "Brengt de lijn van Jeltje Hylkes een generatie verder: haar grootvaders heetten Jan en Beint.",
  "archief": "Tresoar, via AlleFriezen",
  "bron": "Nedergerecht Haskerland: weesboeken en boedels van vóór 1681, en de floreenkohieren van Haskerland 1700–1720. Het autorisatieboek (inv. 031) begint pas in 1671; de akte van 1677 over Aefke noemt haar ouders niet.",
  "link": "https://www.allefriezen.nl/",
  "online": "vrij online",
  "hoe": "Zoek een boedel of weesakte van Beint, die in 1677 vermoedelijk al overleden was: zo'n akte noemt zijn kinderen bij naam. In 1677 vroeg Aefke, 'oudt in haer 17e jaer', zelf om curatoren.",
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
  "bron": "RK-doopboeken Wijtgaard en Warga vóór 1736; floreenkohier en nedergerecht Baarderadeel",
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
  "hoe": "Lees de scan van de boedel van 1772: die noemt waarschijnlijk de erfgenamen en voogden.",
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
  "beslist": "Bevestigt haar geboortedatum en -plaats; die komen nu uit het bevolkingsregister.",
  "archief": "Tresoar (Leeuwarden)",
  "bron": "Burgerlijke stand Haskerland, geboorten 1921 (openbaar, maar nog niet in de online index)",
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
 }
];
