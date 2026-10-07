/* =====================================================================
   VERHALEN
   Elk verhaal: id (kort, letters en streepjes), title, lede, art
   (illustratie: 'farm' | 'church' | 'name' | 'map' | 'branch' | 'roots' |
   'rings' | 'trades'), people (kw-nummers), parts [{ h, p: [alinea's], st }]
   Een alinea kan { t, k } zijn met k = 'afgeleid' | 'hypothese' | 'context'.
   ===================================================================== */
const STORIES = [
{ id: "naam", title: "Hoe de families aan hun namen kwamen", art: "name", line: 8,
  lede: "In 1811 schreven boeren, schippers en ambachtslieden in heel Friesland een achternaam op die er tot dan toe vaak niet was. Voor de familie De Groot gebeurde dat in Wolvega.",
  people: [128, 64, 32, 16, 8, 4, 72, 144, 96, 148, 120, 248, 226, 116, 208],
  parts: [
    { h: "Hylke, Thijs, Anne", p: [
      "De oudste bekende voorvader in de mannelijke lijn is Hylke Tysses: Hylke, zoon van Tys. Hij trouwde in 1742 in Oudehaske met Goytske Wybes en staat in het quotisatiekohier van 1749 als boer in Haskerhorne, 'matig in staat'.",
      "Hun zoon heette Thijs Hylkes: Thijs, zoon van Hylke. Zo schoof de naam elke generatie op. Een vaste achternaam had de familie niet."], st: "A" },
    { h: "1812: De Groot", p: [
      "In 1811 moest iedereen onder Frans bewind een vaste familienaam laten inschrijven. Thijs Hylkes, boer in Oldeholtwolde, liet zich op 13 februari 1812 in het register van Wolvega noteren als Thijs Hylkes de Groot, met zeven kinderen van 4 tot 20 jaar. De jongste, Anna van vier, is Anne Thijsses de Groot: de betovergrootvader van Kees.",
      { t: "Waarom De Groot? Dat staat niet in het register. De naam kan op een lichaamslengte slaan, op een eerdere bijnaam of op iets heel anders; het blijft gissen.", k: "context" },
      "Het besluit om een naam te laten inschrijven is van 1811, maar Thijs deed het pas op 13 februari 1812: die datum staat onder zijn inschrijving, met zijn eigen handtekening 'Tys Hylkes'. Een eerdere versie van deze site maakte daar ten onrechte 1811 van."], st: "A" },
    { h: "Zeven families, één jaar", p: [
      "Hetzelfde gebeurde aan alle kanten van de stamboom. Remke Yntes werd in Rauwerd Kingma, net als zijn vader Ynte Jans in Jorwerd en diens neef, de bakker Ynte Yntes in Poppingawier. De schipper Minne Meintes uit Irnsum liet zich noteren als Boesma, later Boersma. In Balk werd de grutter Johannes Jans Westendorp, in Mirns de landbouwer Lammert Johannes De Jong, in Irnsum de timmerbaas Gerrit Jentjes Meinsma. In Tjerkwerd kwam Van der Wey in het register voor de familie van Aagje Taekes uit Hieslum.",
      "Niet iedereen kreeg een nieuwe naam. De ketelboeter Pieter Mattheus 'hield de naam' Houben: hij had er al een. Johannes Westendorp heette al zo toen hij in 1789 trouwde, en de naam Scheltinga komt al in 1692 in Makkum voor.",
      "Popkjen Idzes gebruikte later de achternaam Jonkman, die haar vader en broers droegen. Neeltje Bokes, de vrouw van Westendorp, liet in 1811 een eigen inschrijving maken met de naam Blom. Waarom Blom, vertelt het register niet."], st: "A" },
    { h: "Een naam van moederskant", p: [
      "Douwe Yettes, zoon van Yette Dirks, droeg de achternaam Flapper van zijn moeder Marijke Flapper. Ook dat kwam voor.",
      "In de Groot-lijn volgen de voornamen daarna een herkenbaar ritme: Anne (1807), Hermanus of Herman Annes (1852), Kornelis (1890), Hermanus Anne (1922), Cornelis (Kees) en Hermanus Theodorus (Harrie). Op het bidprentje van Kornelis uit 1982 heet zijn vader nog Herman Annes: het oude patroniem leefde naast de achternaam voort."], st: "A" }
  ] },

{ id: "lijnen", title: "Twee lijnen, drie voorouderparen", art: "branch",
  lede: "Kees en Vronie zijn verre familie van elkaar. Niet één, maar drie voorouderparen staan aan beide kanten van de stamboom: Titus Bokkes en Abeltje Jans, Ids Wybes Jonkman en Jacobjen Douwes, en de molenmaker Widmer Sipkes en Baukje Jantjes Langendijk.",
  people: [208, 209, 104, 93, 92, 46, 23, 11, 5, 52, 26, 13, 6, 130, 131, 65, 64, 231, 230, 115, 57, 406, 407, 203, 101, 50, 25, 12, 190, 95, 47],
  parts: [
    { h: "Assuerus en Akke Sybrigje", p: [
      "Vronie stamt via Theo Boersma, Marianna Terwisscha van Scheltinga, Jacobus en Titus af van Assuerus Terwisscha van Scheltinga, op 15 april 1786 katholiek gedoopt in de parochie Oldeholtpade als zoon van Titus Bokkes en Ebeltje Jans.",
      "Kees stamt via Mien de Vries, Anna Maria Apollonia Belt, Agatha Groenestege en Titus Groenestege af van Akke Sybrigje Terwisscha van Scheltinga, op 3 juni 1793 in dezelfde parochie gedoopt als dochter van Titus Bokkes en Ebeltje Jans. Haar tante Wybrig Bokkes was getuige. Haar huwelijksakte van 1825 noemt dezelfde ouders."], st: "A" },
    { h: "Het raadsel van Apollonia", p: [
      "Eén akte leek dit tegen te spreken: de overlijdensakte van Assuerus uit 1857 noemt als zijn moeder 'Apollonia'. Het antwoord staat in het trouwregister van 1785. In het katholieke register van Oldeholtpade trouwt Titus Scheltinga met 'Apollonia Jans', met de aantekening dat ze getrouwd is met Abeltje Jans. In het hervormde register staat hetzelfde huwelijk als Tyte Bokkes Scheltinga uit Ter Idzard met Abeltje Jans. Apollonia was haar Latijnse kerknaam."], st: "A" },
    { h: "Popkjen en Hylkje, twee zussen uit Langezwaag", p: [
      "Het tweede gedeelde paar kwam in 2026 aan het licht. Popkjen Idzes, de vrouw van Thijs Hylkes de Groot, is de moeder van Anne Thijsses de Groot, de betovergrootvader van Kees. Haar zus Hylkje Idzes Jonkman trouwde met Meinte Bonthuis uit Westermeer; hun kleindochter Marijke Witteveen is de grootmoeder van Tjitte Huitema, de grootvader van Vronie.",
      "Hylkjes overlijdensakte van 1826 noemt haar ouders: Ids Wiebes Jonkman en Jacobjen Douwes, die in 1756 in Langezwaag trouwden. Dat Popkjen hun dochter is, is een sterke afleiding: haar broer Wybe Idzes Jonkman en haar zwager Pier Wypkes waren doopgetuigen bij haar kinderen, ze droeg later zelf de naam Jonkman, en haar kinderen Jakobje en Ids heten naar die ouders."], st: "B" },
    { h: "Akke en Jentje, kinderen van een molenmaker", p: [
      "Widmer Sipkes was in 1747 meester-timmerman en in 1750 molenmaker in Rien. Met Baukje Jantjes uit Oosterend kreeg hij tussen 1750 en 1771 elf kinderen, onder wie een tweeling, allemaal geboren in Rien en katholiek gedoopt in de statie Roodhuis.",
      "Zijn dochter Akke Widmers is een voormoeder van Vronie: via Baukje Talsma, Frans Poelsma, Baukje Poelsma en Meinte Boersma. Akkes overlijdensakte van 1835 noemt haar ouders.",
      "Zijn zoon Jan, in januari 1759 met een nooddoop gedoopt, is de timmerman Jentje Widmers Langedijk uit Wolvega, de vader van Tjitske Langedijk. Zo loopt de lijn naar Kees: via Apollonia Spitzen, Agatha Groenestege, Anna Belt en Mien de Vries.", "Langs Baukjes kant gaat het spoor nog verder: haar vader was vermoedelijk Jantje Tjeerds van Langendijk, in 1749 herbergier in Oosterwierum. Een hele groep broers en zussen Jantjes in Oosterwierum hield elkaars kinderen ten doop, en Baukjes zus Inske noemde haar eerste zoon Jantje (D, zeer sterk). Langs Widmers kant wijst alles op Sipke Widmers en Liesbeth Fopkes uit Rien; hun dochter Eukjen was getuige bij Widmers katholieke huwelijk (D, sterk).", "In 2026 kwamen er drie nieuwe aanwijzingen bij. In 1827 gaf Jentje een volmacht aan Jacobus Widmers in Sneek en Pieter Widmers in Rien; het bidprentje van Jacobus noemt Widmer Sipkes en Baukje Jantjes als zijn ouders. In de overlijdensakte van Jentjes zus Tjitske (1830) heet hun moeder Baukjen Jantjes Langendijk: daar komt Jentjes achternaam vandaan. En er was een oudere broer Jan (1757) die jong stierf, waardoor Jentjes leeftijd alleen bij de doop van 1759 past.", "Het bewijs kwam uit Sneek. Jacobus Widmers stierf daar in 1842, 81 jaar oud en kinderloos. Zijn memorie van successie noemt zijn erfgenamen: broer Pieter, de kinderen van 'wijlen Jantje, met familienaam Langedijk, overleden te Wolvega', onder wie Anna de Groot en Tjitske Spitzen, de kinderen van 'wijlen Akke, vrouw van Pieter Wybes Tolsma', en de dochter van broer Fopke. Jentje en Akke waren dus broer en zus, en het derde gedeelde paar is bewezen."], st: "A" },
    { h: "Wat dit betekent", p: [
      "Titus Bokkes en Abeltje Jans staan twee keer in de kwartierstaat van Harrie: als nummer 186–187 en als 208–209. Ids Wybes Jonkman en Jacobjen Douwes ook: als 130–131 en als 462–463, en hun voorouders tot Ids Entses (1698) dus ook dubbel. Widmer Sipkes en Baukje Jantjes staan er als 380–381 en als 406–407. Dat heet kwartierverlies. In de waaier hebben deze vakken een gouden rand.",
      { t: "Langs de Terwisscha-lijn zijn Kees en Vronie achter-achter-achterkleinkinderen van een broer en een zus; in het Engels fourth cousins. Langs de Jonkman-lijn liggen de gemeenschappelijke voorouders nog verder terug. Of ze dat zelf wisten, vertelt geen akte.", k: "afgeleid" },
      { t: "In een kleine katholieke gemeenschap, waar men vooral binnen het eigen geloof trouwde, is zulk kwartierverlies eerder regel dan uitzondering.", k: "context" }], st: "A" },
    { h: "Nog meer gedeelde voorouders?", p: [
      "Een vijfde paar is bewezen in 2026: Jan Dirks de Boer en Jetske Willems uit Langezwaag. Hun zoons Willem en Wytze Jans de Boer waren buren als boer in Ter Idzard; dat ze broers waren, staat in de memorie van hun moeder (1827). Willem is een voorvader van Herman de Groot, Wytze van Mien de Vries. Herman en Mien, de ouders van Kees, stamden dus allebei van dit paar af: hun betovergrootvaders waren broers.",
      { t: "Er is een vierde paar, met bewijs B. Andries Tjitses en Doetje Hoytes trouwden in 1728 in Winsum en lieten hun kinderen katholiek dopen in Dronrijp. Hun dochter Richtje (1732) is een voormoeder van Vronie, via de Jorna's; hun dochter Sibbeltje (1737) een voormoeder van Kees, via de Kingma's. De twee zussen woonden later allebei in Roordahuizum en waren getuige bij elkaars dopen. Zo hebben Kees en Vronie nog een gemeenschappelijk voorouderpaar.", k: "afgeleid" },
      { t: "Ook Tjeerd Hilles uit Jelsum staat vrijwel zeker twee keer in de stamboom van Vronie: als vader van Pieter Tjeerds Jorna en, uit zijn eerste huwelijk, van Jan Tjeerds Jorna uit Cornjum. Toen Jan rond 1792 jong stierf, werden zijn halfbroer Cornelis Ypes en Tjeerds schoonzoon Evert ten Berge de curatoren van zijn kinderen (weesakte 1793). Dat is geen bewijs op papier, maar wel een sterke aanwijzing (B).", k: "afgeleid" },
      "Remmelt Eizen ten Berge was een zoon van Eise Alberts en Trijntje Roelofs: dat staat in zijn overlijdensakte van 1837.", { t: "Was die Eise Alberts de Eligius die in 1726 werd gedoopt, een broer van Fretse Alberts? Zijn kinderen heetten Albert en Tjeertje, net als Fretses ouders, en in de familie kwamen ook de namen Roelof, Cornelia en Remmelt voor. Klopt het, dan staan Albert Eysche en Tjeertje Gervers, die in 1715 bij de pastoor thuis in Kuinre trouwden, twee keer aan de kant van Kees.", k: "hypothese" }], st: "D" }
  ] },

{ id: "brandsma", title: "Een heilige in de familie", art: "church",
  lede: "Op de boerderij Ugoklooster bij Bolsward werd in 1881 een jongen geboren die later Titus Brandsma heette: karmeliet, hoogleraar, verzetsman tegen de nazi-propaganda, omgekomen in Dachau en in 2022 heilig verklaard. Zijn grootmoeder was een Terwisscha van Scheltinga.",
  people: [104, 105, 52, 26, 13, 6],
  parts: [
    { h: "Apollonia trouwt op Ugoklooster", p: [
      "Op 3 november 1832 trouwde in Wonseradeel Apollonia Theodora Terwisscha van Scheltinga, twintig jaar, geboren in Ter Idzard, met Hendrik Mevis Brandsma, dertig jaar, die al op Ugoklooster woonde. Haar vader Assuerus was toen koopman in Oosterwierum. Assuerus is een voorvader van Vronie; Apollonia was een zus van Titus Terwisscha van Scheltinga (kw 52).",
      "Hendrik en Apollonia kregen minstens acht kinderen, met familienamen als Assuerus, Sybrigje, Frans en Jan, en in 1843 een zoon Titus."], st: "A" },
    { h: "Van Titus naar Titus", p: [
      "Die zoon Titus Brandsma werd boer op Ugoklooster en trouwde in 1870 met Tjitje Postma uit Bolsward. Op 23 februari 1881 werd hun zoon Anno Sjoerd geboren. Toen hij in 1898 bij de karmelieten intrad, nam hij de naam van zijn vader aan: Titus.",
      { t: "De naam Titus kwam in de familie Brandsma via Apollonia: haar broer en haar grootvader Titus Bokkes droegen hem. Die grootvader was in 1726 geboren in Allingawier, een paar kilometer van Ugoklooster en Bolsward: met Apollonia's huwelijk keerde de familie terug naar de streek waar ze vandaan kwam.", k: "afgeleid" }], st: "A" },
    { h: "Wie was hij?", p: [
      "Titus Brandsma werd hoogleraar filosofie en geschiedenis van de mystiek aan de Katholieke Universiteit in Nijmegen, en in 1932–1933 haar rector magnificus. Als geestelijk adviseur van de katholieke journalisten bracht hij in januari 1942 de oproep van de bisschoppen rond om geen NSB-propaganda in katholieke kranten op te nemen. Hij werd gearresteerd en stierf op 26 juli 1942 in Dachau. In 1985 werd hij zalig verklaard, op 15 mei 2022 heilig."], st: "B" },
    { h: "Hoe verwant?", p: [
      "Titus Brandsma sr. (1843) en Jacobus Terwisscha van Scheltinga (1846), de overgrootvader van Vronie, waren volle neven. De heilige Titus (1881) en Marianna Terwisscha van Scheltinga (1888), de grootmoeder van Vronie, waren dus achterneef en achternicht. Omdat Assuerus' zus Akke Sybrigje een voormoeder van Kees is, is Titus Brandsma ook aan die kant familie."], st: "A" }
  ] },

{ id: "terwisscha", title: "Van Makkum naar Ter Idzard", art: "map",
  lede: "Waar komt de naam Terwisscha van Scheltinga vandaan? Een doopboek uit Makkum en twee stemkohieren uit Arum geven het antwoord: de Scheltinga's kwamen uit de Zuidwesthoek, en de Terwisscha's van Ter Idzard waren hun achterneven.",
  people: [208, 416, 417, 832, 833, 1664, 1665, 1666, 1667, 3334, 6668, 6669, 104, 93],
  parts: [
    { h: "Een doop in Makkum, 1726", p: [
      "Op 21 oktober 1726 werd in de katholieke statie van Makkum Tiete gedoopt, geboren in het terpdorp Allingawier, zoon van Bocke Bockes en Grietie Wiebrans. Een jaar eerder was zijn zus Tiepk gedoopt; later volgden Sasse, Geertje en Wybrig.",
      "Dat Tiete de latere Titus Bokkes Terwisscha van Scheltinga is, blijkt uit zijn zussen: zij trouwden vanaf 1746 in Weststellingwerf, en Titus was getuige bij de doop van hun kinderen."], st: "B" },
    { h: "Scheltinga's in Makkum", p: [
      "Zijn vader Bocke Bockes heette 'Posthumus': geboren na de dood van zijn vader. Die vader was Bocco Seerps Scheltinga, die in 1692 in Makkum trouwde met Geertje Jacobi Spanga. Diens vader, Seerp Douwes Scheltinga uit Arum, trouwde in 1651 met Sybrich Sybrens Jorna uit Grouw.",
      "Het huwelijk van 1651 staat in de registers: eerst geproclameerd in Idaarderadeel, daarna gesloten bij het Gerecht Wonseradeel. De familienaam Jorna voor de bruid komt alleen uit een genealogie.",
      "Geertje Spanga was een dochter van Jacobus Spanga, die in 1679 in Makkum overleed, ongeveer 63 jaar oud. Hij is met een geboortejaar rond 1616 de oudste voorouder op deze site met een bron in een bewezen of sterk afgeleide lijn. Op dezelfde grafsteen liggen ook Lieukema's: de families waren al lang verbonden.",
      "De naam Sybrig, die in de familie steeds terugkeert, komt waarschijnlijk van Sybrich Jorna."], st: "B" },
    { h: "Naar het oosten", p: [
      "Rond 1746, het jaar waarin hun moeder in Makkum overleed, trokken de kinderen naar Weststellingwerf, ruim zestig kilometer naar het oosten. Sasse trouwde daar met Foppe Jochems Scheltinga, Geertje met de timmerman Tjetse Tiedes, Wybrig met Roelof Claasen Scheltinga.",
      "Titus zelf trouwde pas in 1785, op zijn 58e, met de 26-jarige Abeltje Jans. Hij kreeg nog vier kinderen en overleed in 1799."], st: "A" },
    { h: "Het raadsel Terwisscha", p: [
      "In Ter Idzard woonde een rijke familie Terwisscha, eigenerfde boeren van wie grafstenen bewaard zijn gebleven. In 1707 trouwde Asse Terwisscha daar met Sibrigh Tytes Lieukema uit Tzummarum. Hun dochter Acke Asses Terwisscha was meter bij kinderen van twee zussen van Titus, en Titus noemde zijn kinderen Assuerus en Acke Sybrig.",
      "De sleutel ligt in Arum. In 1680 trouwde Sas Seerps Scheltinga, een dochter van Seerp Douwes, met Tiete Liouckema uit Makkum. Hun dochter was Sibrigh Tytes Lieukema. In het stemkohier van Arum bezitten in 1728 Bocke Bockes en Sibrig Lieukema samen twee derde van een boerderij die in 1698 voor twee derde op naam stond van 'het weeskind van Bocke' en Sas Seerps. Dat weeskind was Bocke Bockes zelf, geboren na de dood van zijn vader. Sibrig was dus een volle nicht van Titus' vader, en Acke Terwisscha zijn achternicht.",
      "In augustus 1817 lieten de vier kinderen van Titus in Bolsward twee boerderijen veilen, ieder voor een vierde eigenaar: 'Liauckema State' bij Makkum, de oude boerderij van de Lieuwkema's, en 'Scheltinga State' onder Arum, de boerderij waarvan Sibrig in 1728 een derde bezat. Beide gingen tegen de vlakte.",
      { t: "Daarmee is vrijwel zeker hoe het zat. Naar Fries erfrecht ging bezit zonder kinderen terug naar de kant waar het vandaan kwam. Acke en haar zus Reinsje stierven kinderloos, en Titus en zijn zussen erfden hun goed: land in Makkum en Arum, en vermoedelijk ook in Ter Idzard, Sonnega, Fochteloo en Donkerbroek, waar hun moeder in 1728 voor haar kinderen boerderijen bezat. Dat verklaart waarom Titus zich Terwisscha ging noemen, en waarom zijn kinderen in 1819 ruim 47.000 gulden aan grond in Oost- en Weststellingwerf verdeelden. De akte die de erfenis zelf noemt, is nog niet gevonden.", k: "afgeleid" }], st: "B" },
    { h: "Land in de Stellingwerven, al in 1698", p: [
      "Het stemkohier van 1698 geeft een tweede, oudere verklaring voor de trek naar het oosten. Toen bezat een 'Geertie Spanga, papist' de helft van twee boerderijen in Ter Idzard en de helft van een boerderij in Blesdijke, en haar broer Tyte Spanga een kwart van een boerderij in het dorp Spanga, allemaal in Weststellingwerf. De familienaam Spanga komt vermoedelijk van dat dorp.",
      { t: "Als die Geertie de grootmoeder van Titus was, trokken hij en zijn zussen rond 1746 naar land dat al een halve eeuw in de familie was. Maar in 1728 stond haar helft van de twee boerderijen in Ter Idzard al op naam van anderen (Sloterdijk en Johannes Reins). Deze verklaring is daarom zwakker dan die via Acke Terwisscha.", k: "hypothese" },
      "In hetzelfde jaar bezat 'Gertie Spanga, uit naam van haar kinderen' een zesde van een boerderij in Warga, naast Grouw. Een ander zesde was van de minderjarige Sybrich Tietes Lieukema, met onder anderen Tyte Spanga als curator. Dat land kwam waarschijnlijk van Sybrich Sybrens uit Grouw: Spanga's, Lieukema's en Scheltinga's beheerden samen haar erfgoed."], st: "D" },
    { h: "Een grafsteen uit 1608", p: [
      "Onder de grafsteen van Jacobus Spanga in Makkum liggen ook oudere doden: Reyn Luickema, in 1608 overleden op zijn 55e; Jelke van Hoytema, 'R. van Lieukema syn wyf', in 1625; hun dochter Fopck in 1614 en hun zoon Gatse in 1647.",
      { t: "Volgens de aantekeningen van genealoog De Walle was Jacobs eerste vrouw Trijntje Tietes Lieuwkema, een kleindochter van Rein en Jeltje. Als Geertje Spanga haar dochter was, reikt de stamboom tot een man die rond 1553 werd geboren, toen Friesland nog onder Karel V viel. Die stap is een hypothese (D).", k: "hypothese" }], st: "D" },
    { h: "Wat nog moet", p: [
      "Titus' kinderen verdeelden in 1819 alleen onder elkaar: het ging om zijn vaderlijk erfdeel, dat hun oom Pier Jans als voogd beheerde en waarover hij in 1812 rekening aflegde. Die rekening (notaris Attema, akte 4) is niet gescand. Ze kan bevestigen wat de veilingen van 1817 al doen vermoeden: het land kwam van Acke Terwisscha."], st: "C" }
  ] },

{ id: "katholiek", title: "Katholiek in een protestants land", art: "schuilkerk",
  lede: "Vrijwel alle families in deze stamboom waren rooms-katholiek, in een Friesland dat vooral protestants was. Dat bepaalde waar ze trouwden, hoe ze hun kinderen noemden en wat ze aan de kerk gaven.",
  people: [128, 64, 208, 209, 72, 144, 46, 47, 21, 16, 52],
  parts: [
    { h: "Twee registers voor één huwelijk", p: [
      "Tot 1795 was de katholieke eredienst officieel verboden. Een huwelijk was alleen wettig als het in de Hervormde kerk werd gesloten. Daarom staan oude huwelijken in deze familie vaak twee keer in de boeken.",
      "De voorouders waren al heel lang katholiek. In het stemkohier van Langezwaag van 1698 staat Ids Entses, een voorvader van zowel Kees als Vronie, als 'papist'.",
      "Hylke Tysses en Goytske Wybes trouwden in 1742 in de Hervormde kerk van Oudehaske, maar lieten hun kinderen katholiek dopen in Joure. Titus Bokkes en Abeltje Jans staan in 1785 zowel in het hervormde als in het katholieke trouwregister van Oldeholtpade. Thijs Hylkes en Popkjen Idzes trouwden in 1790 in de Hervormde kerk van Kortezwaag; volgens een genealogie werd het huwelijk dezelfde dag ingezegend in de katholieke statie van Heerenveen."], st: "A" },
    { h: "Kerknamen", p: [
      "Wie katholiek werd gedoopt of trouwde, kreeg in het register vaak een Latijnse naam. Abeltje werd Apollonia, Saapke Sabina, Akke Agatha. Daardoor lijken sommige mensen in kerk- en gemeenteakten twee verschillende personen.",
      "De Kingma's waren al in 1726 katholiek: Ynte Jans en zijn oudere broertje werden katholiek gedoopt in Irnsum, en al zijn eigen kinderen in de parochie Wijtgaard."], st: "A" },
    { h: "Bekeerlingen", p: [
      "Niet iedereen was altijd katholiek. Meinte Foekes uit Rauwerd was doopsgezind, een mennoniet. In het voorjaar van 1793 lieten zijn zoons Willem en Minne zich als volwassenen katholiek dopen; bij Minne schreef de pastoor 'bekeerling'. Tien jaar later trouwde Minne katholiek in Irnsum, en zijn kleinzoon Jacobus Boersma liet in 1939 een bidprentje na.",
      "Wytske Jans, de vrouw van de ketelboeter Hoeben, staat bij de doop van haar dochter in 1795 als 'acatholica': niet katholiek.",
      { t: "Ook de katholieke Kingma's beginnen bij een bekeerling. Op 5 februari 1728 werd in Irnsum een Joannes gedoopt, 'geboren in 1698 te Oldeboorn': een man van dertig, zoon van Gosse Durx. Peter was Jan Intes, de broer van Jeltje Intes. Zeven maanden later liet Jan Gosses zijn huwelijk met Jeltje katholiek inzegenen.", k: "afgeleid" }], st: "A" },
    { h: "Schuilkerk boven een paardenstal", p: [
      "De families woonden in de bekende katholieke kernen: de Stellingwerven rond Steggerda, Oldeholtpade en Ter Idzard, de Kop van Overijssel rond Blankenham en Steenwijkerwold, Gaasterland rond Bakhuizen en Mirns, en Zuidwest-Friesland rond Blauwhuis, Roodhuis en Scharnegoutum.",
      "In Steggerda kwam in 1759 een schuilkerk boven een paardenstal; in 1839 volgde een echte kerk, in 1921 de huidige Sint-Fredericuskerk van Wolter te Riele. In Bakhuizen kerkten de katholieken in een schuilkerk in Elfbergen en in de molen Mole Polle, tot de Sint-Odulphuskerk van 1913–1914.",
      { t: "Na het herstel van de bisschoppen in 1853 volgde een bouwgolf: Blauwhuis kreeg in 1868–1872 een kerk van P.J.H. Cuypers, Gelderingen in 1912–1913 en Oosterwierum in 1925–1926 een van Wolter te Riele.", k: "context" }], st: "B" },
    { h: "Een kruisbeeld en kloosterzusters", p: [
      "Op het katholieke kerkhof van Gelderingen bij Steenwijkerwold staat bij de ingang een kruisbeeld dat T. Groenestege en A.B. Spitzen in 1880 schonken: Titus Groenestege en Apollonia Barbara Spitzen. Er liggen ook graven van beide families. Dat staat in Monumenten in Nederland: Overijssel.",
      "Agatha ten Berge, zus van Anna Maria ten Berge, werd kloosterzuster met de kloosternaam Rembertus en overleed in 1907 in Groningen. Kornelia de Groot, zus van Kornelis, overleed in 1931 in Moergestel in Brabant; haar bidprentje staat in de reeks religieuzen.",
      { t: "Volgens een kwartierstaat die H. Oldenhof citeert, schonk Gerben Boersma in 1926 de grootste klok, Wiro, aan de nieuwe kerk van Oosterwierum. Een eigen bron daarvoor is nog niet gevonden; twee berichten uit het Nieuwsblad van Friesland van 1926 zijn nog niet gelezen.", k: "hypothese" }], st: "B" },
    { h: "Bidprentjes als bron", p: [
      "Katholieke families gaven bij een begrafenis bidprentjes mee. Het Archief RK Friesland in Bolsward bewaart er tienduizenden. Voor deze stamboom zijn ze goud waard: ze noemen geboortedata die in geen andere bron staan, kerknamen, geboorteplaatsen in Duitsland, en soms een fout die het archief zelf aantekent."], st: "A" }
  ] },

{ id: "beroepen", title: "Meer dan boeren", art: "trades",
  lede: "De meeste voorouders waren boer of boerin. Maar wie verder kijkt, vindt ook een bakker, een sluiswachter, een chirurgijn, een ketelboeter, een veenbaas, herbergiers en een gemeenteraadslid.",
  people: [144, 32, 210, 148, 149, 38, 36, 146, 147, 74, 75, 96, 124, 248, 498, 484, 485, 120, 60, 34, 35, 97, 145],
  parts: [
    { h: "Aan het water", p: [
      "Minne Meintes Boersma was in 1811 schipper in Irnsum. Anne Thijsses de Groot was in 1848 sluiswachter in Steggerda: hij bediende de sluis en bewaakte het waterpeil. Tite Terwisscha van Scheltinga, een broer van Assuerus, werd deurwaarder bij de belastingen.",
      "Hendrik Meyners was veenbaas in Luinjeberd: hij liet turf steken en vervoerde die. Na zijn dood werden schepen, huizen in Nijehaske en land in Terband en Tjalleberd verkocht."], st: "A" },
    { h: "Ambacht en winkel", p: [
      "Ynte Jans, de stamvader van de Kingma's, was in 1761 bakker in Oldeboorn. Pieter Mattheus Hoeben was ketelboeter, en zijn vrouw Wytske Jans had een winkel in Poppingawier. Hun zoon Jan Pieters Hoeben en zijn vrouw Japke de Boer waren winkeliers in Oosterwierum. Trijntje Meinderts had een winkel in Irnsum; haar man Gerrit Meinsma was er timmerbaas.",
      "In Balk waren vader en zoon Westendorp grutter: ze maakten gort, grutten en meel. De moeder van de een, Neeltje Blom, was een koopmansdochter en zelf winkelierster.",
      "Jan Koelman was chirurgijn in Workum: een heelmeester die wonden behandelde en botten zette. Zijn dochter trouwde met Assuerus Terwisscha van Scheltinga."], st: "A" },
    { h: "Herberg en raadszaal", p: [
      "Hessel Watzes en Kornelia Jakobs waren allebei herbergier, in Gaasterland. Gerrit Remkes Kingma heette in 1857 kastelein, herbergier, in de buurt van Oosterwierum.",
      "Lammert Johannes de Jong uit Mirns was landbouwer én lid van de gemeenteraad van Gaasterland. Zijn memorie van successie noemt hem letterlijk 'raadslid/landbouwer'."], st: "A" },
    { h: "Knecht, meid, zetboer", p: [
      "Niet iedereen bezat een boerderij. Kornelis Jans Moezen was in 1840 boerenknecht in Ter Idzard, zijn bruid Sybrigje de Boer boerenmeid; later werd hij zelf boer en kerkvoogd. Anthonij Beld was arbeider in Kuinre. Rein Lammerts de Jong was zetboer op Ymedam: hij pachtte de boerderij met het vee van een eigenaar.",
      "Aan de andere kant van de schaal leefden weduwen als renteniersche van hun bezit, zoals Sibbeltje Andries (1818) en Lijsbeth van Balen (1873)."], st: "A" }
  ] },

{ id: "trouwdagen", title: "Trouwen op één dag", art: "rings",
  lede: "Steeds opnieuw trouwden broers, zussen en zwagers in deze families op dezelfde dag, in hetzelfde gemeentehuis. Minstens vijf keer is het in de akten te zien.",
  people: [92, 93, 94, 95, 84, 85, 62, 63, 26, 27, 8, 9, 120],
  parts: [
    { h: "28 april 1825, Weststellingwerf", p: [
      "Met akte 16 trouwden Jannes Engberts Groenestege en Akke Sybrigje Terwisscha van Scheltinga, de grootouders van Agatha Groenestege.",
      { t: "Met akte 15, vlak ervoor, trouwden Johannes Chrysostomus Spitzen en Tjitske Jentjes Langedijk. Als hij dezelfde is als Gosse Spitzen, waren dat Agatha's andere grootouders: dan trouwden beide grootouderparen op dezelfde dag.", k: "hypothese" }], st: "A" },
    { h: "16 november 1831, Weststellingwerf", p: [
      "Eise Remmelts ten Berge trouwde met Annigjen Annes Vonk (akte 38), en haar broer Sybrand Annes Vonk met Roelofje Alberts ten Berge (akte 37). Twee families, twee bruiloften, één dag."], st: "A" },
    { h: "9 februari 1857, Gaasterland", p: [
      "Johannes Westendorp trouwde met Riemke Hylkema (akte 1). Direct daarna trouwde haar broer Dirk Hylkema met Geeske Lammerts de Jong (akte 2), de dochter van raadslid Lammert de Jong. Zevenentwintig jaar later trouwde Johannes' dochter Elisabeth met Geeske's neef Lammert de Jong."], st: "A" },
    { h: "1 mei 1872, Wymbritseradeel", p: [
      "Maria Terwisscha van Scheltinga trouwde met Theodorus Johannes de Vries uit Franeker (akte 11). Direct daarna trouwde haar broer Jacobus met Antje Galema (akte 12)."], st: "A" },
    { h: "3 mei 1919, Weststellingwerf", p: [
      "Kornelis de Groot trouwde met Elisabeth Kingma (akte 32), en zijn zus Anna met Johannes Petrus Scheltinga (akte 33). Op dezelfde dag trouwde ook Elisabeths zus Margaretha Anna Kingma met Rudolphus Stephanus ter Schure.",
      { t: "Of die derde bruiloft in hetzelfde gemeentehuis was, staat niet in de index. Opvallend: Kornelis' broer Anne was in 1915 al getrouwd met Pietronella Ida ter Schure.", k: "afgeleid" }], st: "A" },
    { h: "Waarom op één dag?", p: [
      { t: "Een gezamenlijke bruiloft scheelde kosten en reistijd, en mei was een gebruikelijke trouwmaand op het platteland. Dat dit de reden was, staat in geen enkele akte.", k: "context" }], st: "C" }
  ] },

{ id: "netwerk", title: "Tweelingen en dubbele banden", art: "web",
  lede: "In een katholieke minderheid trouwden families vaak meer dan eens met elkaar. Een tweeling Belt trouwde met twee kinderen Groenestege; twee zussen Langedijk trouwden misschien met een De Groot en een Spitzen.",
  people: [22, 23, 44, 46, 47, 94, 95, 32, 85, 40, 20, 38],
  parts: [
    { h: "De tweeling van Blankenham", p: [
      "Op 28 augustus 1863 werden in Blankenham Wilhelmus en Maria Belt geboren, een tweeling. Maria trouwde in 1883 met Johannes Chrysostomus Groenestege, zoon van Titus Groenestege en Apollonia Spitzen. Zeven jaar later trouwde Wilhelmus met diens zus Agatha. Hun kinderen hadden dus een tante die ook de vrouw van hun oom was."], st: "A" },
    { h: "Meer tweelingen", p: [
      "Titus Groenestege en Apollonia Spitzen kregen in 1862 zelf een tweeling, Agatha Maria en Hendricus Jozephus; beiden overleden in 1863. Bij de Meyners in Luinjeberd werd in 1846 Gerhard geboren, vermoedelijk samen met een levenloos zusje."], st: "A" },
    { h: "Zussen Langedijk", p: [
      "Hylke de Groot, een broer van Anne Thijsses de Groot, trouwde met Anna Jentjes Langedijk. In 1825 trouwde haar zus Tjitske met Johannes Chrysostomus Spitzen, die in het dagelijks leven Gosse heette: de grootvader van Agatha Groenestege. De geboorteakte van hun dochter Johanna (1843) bewijst dat Gosse en Johannes Chrysostomus dezelfde man zijn. Zo waren de De Groot-lijn en de lijn van Mien de Vries al in 1825 aangetrouwd.",
      "In het bevolkingsregister van Steenwijkerwold van 1840 staan het gezin Spitzen en de weduwe Akke van Scheltinga op dezelfde bladzijde: buren. Haar zoon Titus Groenestege trouwde in 1854 met Gosse's dochter Apollonia."], st: "A" },
    { h: "De Vonks", p: [
      "Annigjen Annes Vonk trouwde in 1831 met Eise ten Berge. Wybe de Groot, een broer van Anne Thijsses, trouwde in 1839 met Tjeertjen Annes Vonk, en Eise de Vries, een broer van Wytze, trouwde in 1881 met Theresia Vonk.",
      "Tjeertjen en Annigjen waren zussen: de memorie van successie van hun vader Anne Sybrands Vonk (1852) noemt Annegje als vrouw van Eise Remmelts ten Berge en Tjeerdje als weduwe van Wybe Thijsses de Groot. De families De Groot en Ten Berge waren dus al vóór 1840 aangetrouwd."], st: "A" }
  ] },

{ id: "zwervers", title: "Van boerderij naar boerderij", art: "cart",
  lede: "Een boerenleven was niet altijd honkvast. Sommige gezinnen in deze stamboom verhuisden om de paar jaar, soms over provinciegrenzen heen.",
  people: [12, 13, 6, 18, 19, 34, 32, 36, 62, 60, 10],
  parts: [
    { h: "De Boersma's: vijf dorpen, drie provincies", p: [
      "Meinte Boersma en Marianna Terwisscha van Scheltinga trouwden in 1914 in Menaldumadeel. Hun eerste kinderen werden geboren in Den Horn in Groningen (1915–1919), daarna in Wijtgaard bij Leeuwarden (1922) en in Oudega (1926), waar Theo werd geboren. In 1939 was Meinte veehouder in Harich in Gaasterland. Hij overleed in 1954 in Zorgvliet, net over de grens in Drenthe."], st: "A" },
    { h: "Over de provinciegrens", p: [
      "Kornelis Jans Moezen kwam uit Dalfsen in Overijssel en was in 1840 boerenknecht in Ter Idzard. Andersom trok Albert de Vries uit Steggerda naar Blankenham in Overijssel, en Johannes Westendorp op zijn oude dag van Gaasterland naar Raalte.",
      "Het gezin van Anne Thijsses de Groot stond rond 1850–1860 ingeschreven in Steenwijkerwold, terwijl de kinderen in Steggerda werden geboren: de grens tussen Friesland en Overijssel was voor deze boeren nauwelijks een grens."], st: "A" },
    { h: "De Kingma's rond Heerenveen", p: [
      "Jan Gerrits Kingma en Alida Meyners kregen hun kinderen in Haskerdijken (1878), Terband (1879–1881) en Nieuweschoot (1883–1896). Rond 1919 woonden ze in Wolvega, dicht bij waar hun dochter Elisabeth met Kornelis de Groot ging wonen."], st: "A" },
    { h: "Kopen, pachten, zetten", p: [
      "Gerrit Remkes Kingma, toen kastelein en koopman in Oosterwierum, kocht in 1855 drie percelen greidland in Roordahuizum, voor 7174,50 gulden, van Hoite Lubartus Lycklama à Nijeholt. Hermanus de Groot kocht in 1896 land in Oldetrijne, en zijn zoon Kornelis in 1919 een huis met hooiland van zijn zus. Rein Lammerts de Jong daarentegen was zetboer: hij pachtte boerderij en vee.",
      { t: "Wie pachtte, verhuisde gemakkelijker naar een boerderij die vrijkwam. Of de Boersma's pachters waren, is nog niet uitgezocht.", k: "context" }], st: "A" }
  ] },

{ id: "duitsers", title: "Veenbazen uit het Osnabrücker Land", art: "roots",
  lede: "Niet alle voorouders waren Friezen. Rond 1839 woonde in Luinjeberd bij Heerenveen een katholiek gezin uit Duitsland: Hendrik Meyners en Margaretha Niemann. Hij werd veenbaas.",
  people: [38, 39, 19, 9, 76, 77, 78, 79],
  parts: [
    { h: "Hendrik en Margrietha", p: [
      "In de Friese akten heten ze Hendrik Meyners en Magrita Niemans. Hun acht kinderen werden tussen 1839 en 1857 in Luinjeberd geboren. Alida trouwde in 1877 met Jan Gerrits Kingma; hun dochter Elisabeth Regina is de overgrootmoeder van Kees.",
      "Zijn overlijdensakte (1884) noemt zijn ouders: Jan Heinrich Meyners en Alida Oboer. Haar akte (1886) noemt Heinrich Theodor Philipp Niemans en Helena Margaretha Anters. Daarmee zijn vier voorouders in Duitsland met naam bekend."], st: "A" },
    { h: "Turf en schepen", p: [
      "Hendrik was veenbaas: hij liet turf steken en vervoeren. Zijn zoon Johannes Hendrik werd het ook. In 1885–1887 werden schepen, huizen in Nijehaske en land in Terband en Tjalleberd uit het familiebezit verkocht. De schepen waren turfbokken: op 2 april 1886 werden onder Luinjeberd en Terband de turfbokken en een zeilboot van de erven Meyners geveild, samen voor 620 gulden. Johannes Hendrik kocht er zelf een deel van terug."], st: "A" },
    { h: "Waar kwamen ze vandaan?", p: [
      "Het bidprentje van Margaretha zegt: geboren 1813 in Schwagstorf. Het bevolkingsregister zegt: 8 oktober 1812, 'Hannover'. Dat spreekt elkaar niet tegen: Schwagstorf bij Fürstenau, in het Osnabrücker Land, hoorde toen bij het koninkrijk Hannover.",
      "Voor Hendrik noemt het bevolkingsregister 12 augustus 1807 in 'Oldenstee, Pruissen'.",
      { t: "'Oldenstee' is mogelijk een verschrijving van Hollenstede, een deel van Fürstenau. Dat gebied werd in 1866 Pruisisch, wat 'Pruissen' zou verklaren. Hun schoonzoon Johann Heinrich Joseph Kemme, die in 1885 met Anna Engelina trouwde, kwam uit Plaggenschale, in dezelfde streek. Niet geverifieerd.", k: "hypothese" },
      { t: "Veel katholieken uit het Osnabrücker Land en het Emsland trokken in de 18e en 19e eeuw naar Nederland, als hannekemaaier, koopman of ondernemer.", k: "context" }], st: "B" },
    { h: "Volgende stap", p: [
      "De doopboeken van de parochie Sint-Bartholomeus in Schwagstorf staan online op Matricula, maar alleen vanaf 1853. De doop van Margaretha en het huwelijk van het paar (vóór 1839) liggen waarschijnlijk in het bisschoppelijk archief van Osnabrück of in het RK-trouwboek van Heerenveen."], st: "C" }
  ] },

{ id: "weduwen", title: "Jong gestorven, alleen verder", art: "farm",
  lede: "In de 19e eeuw stierven jonge vaders en moeders vaak plotseling. Wie achterbleef, moest de boerderij en de kinderen alleen draaiende houden.",
  people: [20, 21, 22, 23, 125, 124, 63, 62, 60, 61, 17, 16, 72, 73, 27],
  parts: [
    { h: "Jonge vaders", p: [
      "Wytze de Vries uit Steggerda overleed in augustus 1888, 36 jaar oud, vier en een halve maand na de geboorte van zijn jongste zoon. Zijn vrouw Anna Maria ten Berge was 27. Zes jaar later hertrouwde ze met Reinerus Gras.",
      "Wilhelmus Belt, veehouder in Blankenham, overleed in februari 1896, 32 jaar oud. Zijn vrouw Agatha Groenestege was 27 en zwanger; hun jongste kind werd in juli geboren.",
      "Rein Lammerts de Jong, zetboer op Ymedam, overleed in mei 1862 op zijn 39e. Twee maanden later werd zijn zoon Rein geboren. Zijn vrouw Marijke Asma bleef 37 jaar weduwe.",
      "Remke Kingma overleed in 1818 en liet zes minderjarige kinderen na; zijn vrouw Akke Meinsma bleef nog 42 jaar boerin in Rauwerd."], st: "A" },
    { h: "Jonge moeders", p: [
      "Aath van der Hoff overleed in april 1829 in Balk, 25 jaar oud, negentien dagen na de geboorte van haar zoon Johannes Westendorp. Haar man, de grutter Gerrit Westendorp, was elf maanden getrouwd.",
      "Die zoon Johannes werd zelf in 1864 weduwnaar: zijn vrouw Riemke Hylkema overleed op haar dertigste, drie maanden na de geboorte van hun vijfde kind.",
      "Johanna Moezen overleed in 1894 op 43-jarige leeftijd; haar zoon Kornelis was drie. Haar man Hermanus de Groot bleef 21 jaar weduwnaar."], st: "A" },
    { h: "Vrouwen aan het hoofd", p: [
      "Antje Galema staat in haar overlijdensakte van 1915 als veehoudster: na de dood van haar man in 1914 werd zij zelf met dat beroep genoemd. Japke de Boer was bij haar dood in 1860 winkelierster, drie jaar na haar man.",
      "Marijke Witteveen werd weduwe van Jarig Symonsma, hertrouwde in 1850 met Tjitte Huitema en kreeg in totaal acht kinderen.",
      "Hertrouwen was gewoon. Abeltje Jans werd in 1799 weduwe van Titus Bokkes en trouwde in 1801 met Frans Jurjens Bos. Wytske Brouwer hertrouwde in 1814, op haar 48e, en kocht als tachtigjarige nog grond. Sybrig Gatzes, weduwe van Taeke van der Wey, trouwde opnieuw met de boer Feike Jorna."], st: "A" }
  ] },

{ id: "rampen", title: "Water, koorts en veepest", art: "farm",
  lede: "Een overstroming, een koortsjaar en de veepest: rampen die de boerenfamilies in deze stamboom van dichtbij meemaakten. Wat er in de dorpen gebeurde, weten we uit de geschiedenis; wat het voor onze voorouders betekende, meestal niet.",
  people: [88, 176, 177, 90, 178, 106, 214, 210, 248, 236, 231, 151, 99, 196, 128, 160, 61, 122],
  parts: [
    { h: "De watersnood van februari 1825", p: [
      { t: "In de nacht van 4 op 5 februari 1825 brak de Zuiderzee op tientallen plaatsen door de dijken: de grootste natuurramp van de negentiende eeuw in Nederland. Friesland stond voor bijna twee derde onder zout water, vooral door dijkbreuken bij Lemmer en tussen Workum en Hindeloopen. In het dijkdorp Blankenham verdronken 28 van de 280 inwoners. Daarna kregen koeboeren bij Kampen zestig gulden om een nieuwe koe te kopen, en in Weststellingwerf kregen negentien veenbazen geld om hun arbeiders te betalen (bron: F.D. Zeiler, Tijdschrift voor Waterstaatsgeschiedenis 2007).", k: "context" },
      "De Belts woonden toen in Kuinre, aan de Zuiderzee naast Blankenham: Jan Anthonij Belt was er in 1823 getrouwd en zijn vader Anthonij Beld overleed er in 1834. Willem de Jong was in 1791 in Blankenham geboren en overleed er in 1858. In Workum woonden de boeren Jacob Annes Kooiker en Johannes Ypkes Ketelaar en de heelmeester Jan Koelman. Hans Willems Blauwhof was veehouder in Spanga, in het lage zuiden van Weststellingwerf; hij overleed eind december 1825.",
      { t: "Hoe het deze families in 1825 verging, staat in geen enkele akte die we kennen.", k: "afgeleid" }], st: "A" },
    { h: "Het koortsjaar 1826", p: [
      { t: "Na de overstroming bleef brak water op het land staan. Na een zachte winter en een uitzonderlijk hete zomer eiste in 1826 en 1827 de malaria, de 'tusschenpoozende koorts', veel levens. Massale sterfte trof volgens het Historisch Centrum Leeuwarden de omstreken van Heerenveen.", k: "context" },
      "In deze stamboom overleden in 1826 zeven voorouders, tegen twee à vier in de jaren ervoor en erna: de heelmeester Jan Koelman in Workum (9 juli), Boukje Wiersma in Tirns (23 augustus), de boer Pieter Jans Teppema (6 oktober), de grutter Johannes Westendorp in Balk (10 oktober), Hylkjen Jonkman in Westermeer (19 oktober), Pieter Tjeerds Jorna in Wommels (27 oktober) en Baukje de Boer in Irnsum (17 november).",
      { t: "De overlijdensakten noemen geen doodsoorzaak. Dat zij aan de koorts stierven, is dus niet bewezen; wel vallen zes van de zeven sterfgevallen tussen juli en november, de tijd van de koorts.", k: "afgeleid" }], st: "A" },
    { h: "De veepest", p: [
      { t: "Voor een Friese boer was de koe alles. Van oktober 1744 tot september 1745 stierven in Friesland door de veepest honderdduizenden runderen (de bronnen noemen 108.000 tot bijna 200.000), en in 1769 en 1770 nog eens ruim 98.000. In de herfst van 1866 kwam de runderpest nog tot in Harich en bij Hemelum. Volgens de Leeuwarder Courant van 4 december 1866 bleef het bij vier boerderijen, maar werden 102 runderen afgemaakt en begraven: de zieke dieren en alle dieren die ermee in aanraking konden zijn geweest (bronnen: M.H. de Graaff 1865; W.C.H. Staring 1867; Leeuwarder Courant 1866).", k: "context" },
      "In het belastingkohier van 1749, vier jaar na de ergste golf, staat bij Pier Tysses, boer in Joure en vermoedelijk een broer van Hylke Tysses: 'beesten verlooren'. Hylke zelf, boer in Haskerhorne, heette toen 'matig in staat'.",
      { t: "In 1866 was Marijke Asma weduwe en boerin in Gaasterland, en haar vader Johannes Asma landbouwer daar. Of de runderpest hun stal bereikte, is niet bekend.", k: "context" }], st: "B" }
  ] },

{ id: "uitwaaieren", title: "Uitgewaaierd: de ooms en tantes", art: "ship",
  lede: "De grootouders van Harrie en hun ouders kwamen uit grote gezinnen. Hun broers en zussen zwermden uit over Nederland, en een enkeling tot in Amerika en Canada.",
  people: [4, 5, 6, 7, 8, 9, 12, 14, 61, 122],
  parts: [
    { h: "Twaalf kinderen Huitema", p: [
      "Tjitte Huitema en Riemke de Jong kregen minstens twaalf kinderen. Ze overleden in Leeuwarden, Bolsward, Nijelamer, Tirns, Weidum, Wolvega, Heemstede, Veghel en Heeswijk. Johannes Piet Huitema overleed in 1993 in Calgary in Canada."], st: "A" },
    { h: "Ooms en tantes De Groot en Kingma", p: [
      "Van de zeven kinderen van Hermanus de Groot en Johanna Moezen werden er vier volwassen. Anna bleef in Oldeholtpade en werd 94. Kornelia werd vermoedelijk kloosterzuster en overleed in 1931 in Moergestel. Anne overleed in 1968 in Oldelamer.",
      "De acht broers en zussen van Elisabeth Kingma overleden in Riesse, Wolvega, Sneek, Oldeholtwolde, Heerenveen, Oldemarkt en Steenwijkerwold."], st: "A" },
    { h: "Boersma en De Vries", p: [
      "Meinte Boersma had negen broers en zussen; ze overleden in Follega, Sneek, Leeuwarden, Bolsward en Oosterwierum.",
      "Mien de Vries had elf broers en zussen. Haar zus Agatha Maria Apollonia overleed in 1946, 26 jaar oud."], st: "A" },
    { h: "Naar Amerika", p: [
      "Matthyas Johannes Asma (1828), broer van Marijke Asma, kreeg nog in 1862 een kind in Gaasterland, vertrok daarna naar Amerika en overleed in 1909 in Waukegan bij Chicago.",
      "Elisabeth Gras, halfzus van Albert de Vries, overleed in april 1945 in Belatan op Sumatra.",
      { t: "Volgens een genealogie overleed Geeske van der Hoff, de vrouw van Rimmer Hylkema, in 1902 in de Verenigde Staten. Dat is nog niet gecontroleerd.", k: "hypothese" }], st: "B" }
  ] }
];

/* Korte feiten voor de voorpagina */
const FACTS = [
  { kw: 320, y: "1715", t: "Getrouwd bij de pastoor thuis", x: "Albert Eysche en Tjeertje Gervers trouwden in 1715 'te mijnen huize' bij de katholieke pastoor in Kuinre. Hun zoon Fretse werd thuis gedoopt.", st: "B", story: "katholiek" },
  { kw: 792, y: "1672", t: "Een wees werd bakker", x: "Obbe Doeckes was acht toen zijn ouders in Sneek overleden. Hij werd bakker in Sneek en later boer in Bozum.", st: "B" },
  { kw: 256, y: "1728", t: "Pachter van de grietman", x: "Thys Annes pachtte in 1728 drie stemmen in Haskerhorne van de familie Vegelin van Claerbergen, de grietmannen van Haskerland.", st: "B", story: "naam" },
  { kw: 288, y: "1728", t: "Een bekeerling van dertig", x: "Jan Gosses, geboren in 1698 in Oldeboorn, liet zich in 1728 als volwassene katholiek dopen. Met hem beginnen de katholieke Kingma's.", st: "B", story: "katholiek" },
  { kw: 396, y: "1728", t: "Vier lijnen in één dorp", x: "Rond 1730 woonden in het katholieke Scharnegoutum de voorvaders Doecke Obbes, Jan Murks Teppema en Bote Willems. Een generatie later trouwden hun lijnen met elkaar.", st: "B" },
  { kw: 247, y: "1809", t: "Trouwen met dispensatie", x: "Siebrig Bruinsma mocht in 1809 alleen hertrouwen met kerkelijke dispensatie: zij en haar bruidegom waren verre familie.", st: "A" },
  { kw: 814, y: "1749", t: "Een herbergier in Oosterwierum", x: "Jantje Tjeerds van Langendijk was in 1749 hospes in Oosterwierum. Vermoedelijk komt via hem de naam Langedijk in de stamboom (D).", st: "D", story: "lijnen" },
  { kw: 104, y: "1881", t: "Een heilige in de familie", x: "Titus Brandsma, karmeliet, omgekomen in Dachau en in 2022 heilig verklaard, is een achterkleinzoon van voorvader Assuerus Terwisscha van Scheltinga.", st: "A", story: "brandsma" },
  { kw: 186, y: "1785", t: "Kees en Vronie delen voorouders", x: "Twee voorouderparen staan aan beide kanten van de stamboom: Titus Bokkes en Abeltje Jans, en Ids Wybes Jonkman en Jacobjen Douwes.", st: "A", story: "lijnen" },
  { kw: 520, y: "1698", t: "Al katholiek in 1698", x: "Ids Entses staat in 1698 in het stemkohier van Langezwaag als mede-eigenaar van een boerderij, met de aantekening 'papist'.", st: "B", story: "katholiek" },
  { kw: 96, y: "1793", t: "Van mennoniet naar katholiek", x: "Minne Meintes Boersma liet zich als volwassene katholiek dopen; zijn vader bleef doopsgezind.", st: "A", story: "katholiek" },
  { kw: 64, y: "1812", t: "De naam De Groot ontstaat", x: "Thijs Hylkes liet zich in Wolvega inschrijven als De Groot, met zeven kinderen. Daarvoor heette de familie naar de vader.", st: "A", story: "naam" },
  { kw: 73, y: "1832", t: "Een weduwe met 44 hectare", x: "In het kadaster staat 'Romke Yntes Kingma, boerin': vrijwel zeker Akke Meinsma, veertien jaar na de dood van haar man.", st: "B" },
  { kw: 8, y: "1919", t: "Drie bruiloften op 3 mei", x: "Kornelis de Groot, zijn zus Anna en Elisabeths zus Margaretha Anna trouwden allemaal op dezelfde dag.", st: "A", story: "trouwdagen" },
  { kw: 188, y: "1823", t: "Een kanunnik in Zwolle", x: "Otto Antonius Spitzen, volle neef van Apollonia Spitzen, werd hoogleraar, pastoor en kanunnik.", st: "A" },
  { kw: 32, y: "1848", t: "Een sluiswachter in Steggerda", x: "Anne Thijsses de Groot bediende de sluis in Steggerda. In dezelfde familie was er ook een brugwachter in Oldetrijne.", st: "A", story: "beroepen" },
  { kw: 39, y: "1813", t: "Geboren in Schwagstorf", x: "Margaretha Niemann kwam uit het Osnabrücker Land. Haar man Hendrik Meyners werd veenbaas in Luinjeberd.", st: "A", story: "duitsers" },
  { kw: 149, y: "1795", t: "Een gemengd huwelijk", x: "Wytske Jans trouwde in 1795 hervormd met de katholieke ketelboeter Pieter Hoeben en deed in 1807 belijdenis, terwijl al haar kinderen katholiek werden gedoopt.", st: "A" },
  { kw: 125, y: "1829", t: "Negentien dagen moeder", x: "Aath van der Hoff overleed op haar 25e, kort na de geboorte van haar zoon Johannes Westendorp.", st: "A", story: "weduwen" },
  { kw: 208, y: "1726", t: "Geboren bij Makkum", x: "Titus Bokkes, de voorvader die Kees en Vronie delen, werd in Allingawier geboren. Zijn opa trouwde in 1692 als Scheltinga in Makkum.", st: "B", story: "terwisscha" },
  { kw: 1664, y: "1651", t: "De oudste trouwdag", x: "Seerp Douwes Scheltinga uit Arum trouwde in 1651 met Sybrich Sybrens uit Grouw, vier generaties vóór Titus Bokkes. Het huwelijk staat in twee registers.", st: "A", story: "terwisscha" },
  { kw: 406, y: "1750", t: "Een derde gedeeld paar", x: "De molenmaker Widmer Sipkes en Baukje Jantjes Langendijk zijn voorouders van zowel Kees als Vronie: via hun kinderen Jentje en Akke. De nalatenschap van hun zoon Jacobus (1842) noemt Jentje en Akke als broer en zus.", st: "A", story: "lijnen" },
  { kw: 417, y: "1746", t: "Waarzegster of aanzegster?", x: "Zo staat Grietje Bokkes, de moeder van Titus Bokkes, in de index van het begraafregister van Makkum. Waarschijnlijker is 'aanzegster': iemand die een overlijden rondbracht. De scan moet het beslissen.", st: "D", story: "terwisscha" },
  { kw: 6668, y: "1608", t: "Een grafsteen van 1608", x: "Reyn Luickema, overleden in 1608 op zijn 55e, ligt in Makkum onder dezelfde steen als Jacobus Spanga. Via een hypothese (D) is hij de vroegst geboren voorvader op deze site.", st: "D", story: "terwisscha" },
  { kw: 449, y: "1726", t: "Gedoopt als Thecla", x: "Tjitske Tjittes werd in Workum gedoopt met de kerknaam Thecla. Haar jongste dochter kreeg die naam: Tecla. Zo bevestigt een doopnaam een hele generatie.", st: "B" },
  { kw: 240, y: "1759", t: "Wees op zijn twaalfde", x: "Johannes Lammerts verloor vermoedelijk vóór 1760 zijn vader, een 'sober boer' in Harich, en zijn moeder. Twee ooms werden zijn voogden.", st: "D" }
];
