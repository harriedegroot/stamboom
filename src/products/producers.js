/* Producers: where a product can be ordered, with what the file must look like. The products refer to them by id.
   Texts in Dutch (interface); prices are "ca." and carry the date they were checked. Fields: id, label, url, bleed (mm),
   safe (mm), color ("sRGB" or a note), file ("pdf" | "png"), minPages, maxPages, price (general line), prices ({ productId: line }),
   priceSource (url), checked (yyyy-mm-dd), howToOrder: [steps], note.
   Prices were looked up on 2026-10-08, without shipping unless stated. Keep the steps short and in plain Dutch; no process information. */
(function (P) {
  const checked = "2026-10-08";

  P.addProducer({ id: "drukwerkdeal", label: "Drukwerkdeal", url: "https://www.drukwerkdeal.nl/", bleed: 3, safe: 3, file: "pdf",
    color: "Ons bestand is sRGB; Drukwerkdeal werkt in CMYK", checked,
    price: "Ansichtkaarten vanaf ca. € 13,36 voor 10 stuks (zonder btw)",
    prices: { "cards-places": "ca. € 13,36 voor 10 kaarten van één ontwerp (zonder btw)" },
    priceSource: "https://www.drukwerkdeal.nl/nl/producten/promotie/ansichtkaarten-wenskaarten",
    howToOrder: [
      "Maak hier het pdf-bestand, met 3 mm afloop.",
      "Kies bij Drukwerkdeal het product en dezelfde maat (bijvoorbeeld ansichtkaart A6 of poster A2).",
      "Upload het pdf-bestand bij het bestellen. Drukwerkdeal controleert het bestand en meldt het als er iets niet klopt."],
    note: "Elk ontwerp is bij Drukwerkdeal een eigen oplage. Voor een set van verschillende kaarten is Kaartje2go vaak handiger." });

  P.addProducer({ id: "gelato", label: "Gelato", url: "https://www.gelato.com/", bleed: 4, safe: 4, file: "pdf", color: "sRGB", checked,
    price: "Canvas vanaf ca. € 7,69 (kleinste maat)",
    prices: { "calendar-wall": "gemiddeld ca. $ 10 plus $ 5,50 verzending (oudere prijs)" },
    priceSource: "https://www.gelato.com/custom/lower-prices/canvas",
    howToOrder: [
      "Maak hier het pdf-bestand, met 4 mm afloop.",
      "Kies bij Gelato het product en de maat.",
      "Upload het pdf-bestand. Bij een kalender blijft aan de bindkant 12 mm vrij; dat doet het bestand al."],
    note: "Gelato drukt in of dicht bij het land waar het naartoe gaat." });

  P.addProducer({ id: "saal", label: "Saal Digital", url: "https://www.saal-digital.com/", bleed: 3, file: "pdf", color: "sRGB", maxPages: 160, checked,
    price: "Prijs volgens de webshop (niet openbaar te lezen)",
    priceSource: "https://www.saal-digital.com/",
    howToOrder: [
      "Maak hier het pdf-bestand op de maat van het product.",
      "Kies in de webshop van Saal het product (fotoboek of wandkalender) en het formaat.",
      "Klik op ontwerpen en kies ‘PDF Upload’. Upload het bestand."],
    note: "Een fotoboek heeft 26 tot 160 pagina’s; een wandkalender 14 (omslag, twaalf maanden en een jaaroverzicht). Bij een linnen omslag kan geen pdf worden geüpload." });

  P.addProducer({ id: "peecho", label: "Peecho", url: "https://www.peecho.com/", bleed: 0, file: "pdf", color: "sRGB", maxPages: 504, checked,
    price: "Softcover vanaf € 4,00, hardcover vanaf € 5,20",
    prices: { book: "hardcover van 64 pagina’s ca. € 9,04 plus € 5,90 verzending" },
    priceSource: "https://www.peecho.com/products",
    howToOrder: [
      "Maak hier het pdf-bestand zonder afloop: Peecho voegt die zelf toe.",
      "Upload één pdf met de voorkant, het binnenwerk en de achterkant, als losse pagina’s.",
      "Kies het formaat en het papier."],
    note: "Een hardcover kan 24 tot 504 pagina’s hebben, een softcover 20 tot 300. Het aantal pagina’s moet even zijn." });

  P.addProducer({ id: "blurb", label: "Blurb", url: "https://www.blurb.com/", bleed: 3.175, file: "pdf", color: "sRGB", maxPages: 480, checked,
    price: "Boek 15 × 23 cm vanaf ca. $ 3,99, plus een bedrag per pagina",
    priceSource: "https://www.blurb.com/pricing",
    howToOrder: [
      "Maak hier het pdf-bestand met de afloop van Blurb (3,175 mm, niet aan de bindkant).",
      "Kies bij Blurb ‘PDF to Book’ en hetzelfde formaat.",
      "Upload het binnenwerk en daarna de omslag als losse pdf; de breedte van de rug geeft Blurb op."],
    note: "Een boek heeft 24 tot 480 pagina’s, een fotoboek 20 tot 240." });

  P.addProducer({ id: "kaartje2go", label: "Kaartje2go", url: "https://www.kaartje2go.nl/", bleed: 3, file: "png", color: "sRGB", checked,
    price: "Kaart 10 × 15 cm vanaf € 1,59 per stuk",
    prices: { "cards-places": "een set van 16 verschillende kaarten ca. € 25" },
    priceSource: "https://www.kaartje2go.nl/kerstkaarten/foto-kerstkaarten",
    howToOrder: [
      "Maak hier per kaart een png van de voorkant.",
      "Kies bij Kaartje2go een kaart met eigen ontwerp.",
      "Upload de voorkant als beeld, voor elke kaart opnieuw."] });

  P.addProducer({ id: "kwartetcadeau", label: "KwartetCadeau", url: "https://www.kwartetcadeau.nl/meer-opties/eigen-ontwerp", bleed: 3, file: "pdf", color: "sRGB", checked,
    price: "Vanaf één spel; de prijs voor een eigen ontwerp staat niet op de pagina",
    priceSource: "https://www.kwartetcadeau.nl/meer-opties/eigen-ontwerp",
    howToOrder: [
      "Maak hier de kaarten als pdf.",
      "Kies bij KwartetCadeau ‘eigen ontwerp’ en upload het bestand.",
      "Volg hun maten voor de kaarten; ze leveren binnen 4 werkdagen."] });

  P.addProducer({ id: "ravensburger", label: "My Ravensburger", url: "https://www.myravensburger.com/nl-NL/", bleed: 0, file: "png", color: "sRGB", checked,
    price: "Puzzel van 1000 stukjes (70 × 50 cm): € 39,90 in een doos, € 42,90 in een blik",
    priceSource: "https://www.ravensburger.be/nl-BE/ravensburger/products/custom-photo-gifts/photo-puzzle/1000-pieces",
    howToOrder: [
      "Maak hier de png (5906 × 8268 pixels, scherp genoeg voor 300 dpi).",
      "Kies bij My Ravensburger een fotopuzzel van 1000 stukjes.",
      "Upload de png."] });

  P.addProducer({ id: "fotofabriek", label: "Fotofabriek", url: "https://www.fotofabriek.nl/", bleed: 3, file: "pdf", color: "sRGB", checked,
    price: "Verjaardagskalender A4 of 15 × 42 vanaf € 14,99; A3 of 30 × 30 vanaf € 19,99",
    priceSource: "https://www.fotofabriek.nl/producten/kalenders/verjaardagskalenders/a4-staand/",
    howToOrder: [
      "Maak hier het pdf-bestand op dezelfde maat.",
      "Kies bij Fotofabriek het product en het formaat.",
      "Upload het bestand met hun pdf-uploader. Die zegt meteen of de maat klopt."],
    note: "Of de pdf-uploader ook voor verjaardagskalenders werkt, staat niet op hun algemene pdf-pagina. Probeer het eerst." });

  P.addProducer({ id: "prodigi", label: "Prodigi", url: "https://www.prodigi.com/products/cards-and-stationery/calendars/calendars/", bleed: 3, file: "pdf", color: "sRGB", checked,
    price: "Kalender vanaf £ 5,93 (groothandelsprijs, zonder btw en verzending)",
    priceSource: "https://www.prodigi.com/products/cards-and-stationery/calendars/calendars/",
    howToOrder: [
      "Prodigi levert vooral via webwinkels en een koppeling. Voor één kalender zijn Saal en Fotofabriek eenvoudiger.",
      "Wil je toch via Prodigi: kies een kalender zonder vaste data (‘undated’) en lever het pdf-bestand volgens hun sjabloon."] });

  P.addProducer({ id: "jeeigenmok", label: "Je Eigen Mok", url: "https://www.jeeigenmok.nl/", bleed: 0, file: "png", color: "sRGB", checked,
    price: "Mok vanaf € 11,99, vanaf één stuk",
    priceSource: "https://www.jeeigenmok.nl/product/blauwe-mok-bedrukken/",
    howToOrder: [
      "Maak hier de png van de wikkel (2700 × 1050 pixels).",
      "Kies bij Je Eigen Mok een mok met eigen ontwerp.",
      "Upload de png."] });

  P.addProducer({ id: "tegeltje", label: "Tegeltje.nl", url: "https://tegeltje.nl/", bleed: 0, file: "png", color: "sRGB", checked,
    price: "Tegel 15 × 15 of 20 × 20 cm vanaf € 8,95",
    priceSource: "https://tegeltje.nl/maken/delfts-blauw-tegeltje-klassiek/",
    howToOrder: [
      "Maak hier de png op dezelfde maat.",
      "Kies bij Tegeltje.nl het Delfts blauw tegeltje en de maat.",
      "Upload het beeld."],
    note: "Liever een echt geschilderd tegeltje? Heinen Delfts Blauw en Tegeltjes.com schilderen naar een voorbeeld; de prijs is op aanvraag." });

})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
