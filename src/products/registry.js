/* Product registry: categories, formats, producers and products. Data only: the hub, the product pages and the engine read it,
   nothing else needs to know which products exist. Ids are English; labels and texts are Dutch (they are interface).
   A product: { id, label, category, status: "ready" | "beta" | "planned", intro, layout: "sheet" | "cards" | "calendar" | "book",
     renderer, privacy: "site" | "public" | "calendar" | "game", formats: [format id], bleed: [mm], safe: mm, output: ["pdf", "png", "svg"],
     minPt, minDpi, png: { dpi } | { w, h }, options: [{ id, token, type, label, … }], producers: [producer id] }
   Option types: number { min, max, default }, list { choices: [[value, label]] }, preset { choices: [[value, label, intro]] } (cards
   with a short explanation), boolean, start ({ kw, pair }: one person or a
   couple, shared by all products that start somewhere in the tree), person (kw), line (family line), year,
   text, image. default "advice" = the value from the renderer's advise(); "token" is the word in the address bar (Dutch, e.g. "vanaf").
   defaultFormat: the format chosen first (else the first in formats).
   steps: the configurator steps (see stepsOf); option.step: which | content | look | finish.
   Optional: page (a product with its own page, e.g. "boek" or "poster": the hub links there), pageToken (the words for this product
   on that page, e.g. "soort-kaart"), promise (one line on the hub card), short (a short name, e.g. in a list), preset (default options on that page),
   codec: { parse(token) → options, format(options) → token } when the product keeps its own address format (the book).
   variant: passed to the renderer when two products share one (calendar: "wall" | "birthday").
   Producers (producers.js) may carry minPages, maxPages and safe (mm) next to bleed. */
(function (P) {
  P.categories = P.categories || {}; P.formats = P.formats || {}; P.producers = P.producers || {}; P.products = P.products || {};
  const need = (o, keys, what) => keys.forEach(k => { if (o[k] === undefined) throw new Error(`${what} ${o.id || "?"}: missing ${k}`); });
  P.addCategory = c => { need(c, ["id", "label"], "category"); P.categories[c.id] = Object.freeze({ order: Object.keys(P.categories).length, hint: (P.HINTS || {})["cat:" + c.id] || "", ...c }); };
  P.addFormat = f => { need(f, ["id", "label", "w", "h"], "format"); P.formats[f.id] = Object.freeze({ ...f }); };
  P.addProducer = p => { need(p, ["id", "label", "url"], "producer"); P.producers[p.id] = Object.freeze({ bleed: 3, color: "sRGB", file: "pdf", howToOrder: [], ...p }); };
  P.addProduct = d => {
    need(d, ["id", "label", "category", "layout", "renderer", "privacy"], "product");
    if (!P.categories[d.category]) throw new Error(`product ${d.id}: unknown category ${d.category}`);
    const p = { order: Object.keys(P.products).length, status: "planned", intro: "", hint: (P.HINTS || {})[d.id] || "", formats: [], bleed: [0, 3], safe: 5, output: ["pdf"], minPt: 6, minDpi: 150, options: [], producers: [], ...d };
    p.options = p.options.map(o => ({ token: o.id, ...o }));
    P.products[p.id] = Object.freeze(p);
  };
  /* a codec added later by the page that owns the address format (the book); only once, and only for a product without one */
  P.setCodec = (id, codec) => { const p = P.products[id]; if (!p) throw new Error("unknown product " + id); if (p.codec) throw new Error(`product ${id} already has a codec`);
    if (!codec || typeof codec.parse !== "function" || typeof codec.format !== "function") throw new Error("codec needs parse and format");
    P.products[id] = Object.freeze({ ...p, codec }); };
  /* products in hub order (category order, then registry order), optionally only one category or status */
  P.list = (o = {}) => Object.values(P.products).filter(p => (!o.category || p.category === o.category) && (!o.status || [].concat(o.status).includes(p.status)))
    .sort((a, b) => (P.categories[a.category].order - P.categories[b.category].order) || a.order - b.order);
  /* the steps of the configurator (shared by book, calendar, poster …): which (Van wie), content (Wat erop staat), look (Vorm),
     finish (Voor de drukker). An option may name its step (option.step); otherwise start goes to which, format to look, bleed and
     producer to finish, the rest to content. A product may list its own steps [{ id, label, question, options, collapsed }] (the
     poster and the book: the wizard which → kind → size → look → ready). Empty steps go; finish starts collapsed.
     STEP_WORDS: [step name, question] per step id; a product's step may give its own question ("Hoe groot wordt hij?"). */
  const STEP_LABELS = { which: "Van wie", content: "Wat erop staat", look: "Vorm", finish: "Voor de drukker" };
  P.STEP_WORDS = Object.freeze({ which: ["Voor wie", "Voor wie is het?"], kind: ["Soort", "Wat moet erop staan?"], size: ["Maat", "Hoe groot wordt het?"],
    look: ["Details", ""], ready: ["Klaar", "Klaar om te printen of te laten drukken"] });
  P.stepsOf = product => {
    if (product.steps) return product.steps.map(s => ({ label: (P.STEP_WORDS[s.id] || [STEP_LABELS[s.id] || s.id])[0], question: (P.STEP_WORDS[s.id] || [])[1] || "", options: [], ...s }));
    const st = { which: [], content: [], look: [], finish: [] };
    product.options.forEach(o => st[o.step || (o.type === "start" ? "which" : "content")].push(o.id));
    if (product.formats.length > 1) st.look.push("format");
    if (product.bleed.length > 1) st.finish.push("bleed");
    if (product.producers.length) st.finish.push("producer");
    return Object.keys(st).filter(k => st[k].length).map(id => ({ id, label: STEP_LABELS[id], options: st[id], collapsed: id === "finish" }));
  };
  /* the pages under "Maken" with a product that is ready, in hub order: [{ page, label, desc }] (the tab row and the menu use it).
     PAGE_WORDS: the tab label and the one-line description per page (interface, Dutch). */
  P.PAGE_WORDS = Object.freeze({ boek: ["Boeken", "Het familieboek, familieboekjes, een verhalenboek en meer"],
    poster: ["Aan de muur", "Posters van de waaier, de stamreeks, de kwartierstaat of de dorpenkaart, en de waaier op canvas, alu of hout"],
    kalender: ["Kalenders", "Een wandkalender of een verjaardagskalender"],
    kaarten: ["Kaarten en spellen", "Ansichtkaarten van de dorpen, een kwartet, een memory en een puzzel"],
    mok: ["Mok en tegel", "Een voorouder op een mok of een Delfts blauw tegeltje"] });
  P.pages = () => [...new Set(P.list({ status: "ready" }).map(p => p.tab || p.page).filter(Boolean))]
    .sort((a, b) => (Object.keys(P.PAGE_WORDS).indexOf(a) + 1 || 99) - (Object.keys(P.PAGE_WORDS).indexOf(b) + 1 || 99)).map(page => ({ page, label: (P.PAGE_WORDS[page] || [page])[0], desc: (P.PAGE_WORDS[page] || [, ""])[1] }));
  /* the format of a product, as { w, h } in mm; a product may also carry its own { id, label, w, h } */
  P.formatOf = (product, id) => P.formats[id] || (product.customFormats || []).find(f => f.id === id) || null;

  /* HINTS: one short line per category ("cat:<id>") and per product, for the Maken menu (interface, Dutch); read when they are added */
  P.HINTS = Object.freeze({
    "cat:books": "Om te lezen en te bewaren", "cat:wall": "Om op te hangen", "cat:calendars": "Elke dag een voorouder", "cat:cards": "Om te versturen en te spelen", "cat:gifts": "Een voorouder om te geven",
    book: "Alles in één boek", "book-branches": "Een dun boekje per familie", "book-stories": "De verhalen, met veel beelden", "book-pedigree": "Elke voorouder met een nummer",
    "book-research": "Bronnen en open vragen", "book-photo": "Portretten, dorpen en oude kaarten", "book-kids": "Een invulboek voor kinderen", "book-memorial": "Over één persoon of één paar",
    "poster-fan": "Alle voorouders in één cirkel", "poster-lineage": "Van vader op vader terug", "poster-pedigree": "Een kolom per generatie", "poster-map": "Een stip per dorp",
    "canvas-fan": "Klaar om op te hangen", "calendar-wall": "Elke maand een oude kaart", "calendar-birthday": "Zonder jaar, elk jaar opnieuw",
    "cards-places": "Het dorp voorop, de voorouders achterop", "mug-fact": "Een voorouder bij de koffie", "tile-fact": "Naam, jaren en beroep",
    "puzzle-fan": "De waaier in 1000 stukjes", "game-quartet": "Vier kaarten per familie",
    "game-memory": "Paren van de voorouders, om te spelen", "canvas-families": "Acht doeken, één per familie" });
  /* ---- categories (the order is the order on the hub) ---- */
  [["books", "Boeken"], ["wall", "Aan de muur"], ["calendars", "Kalenders"], ["cards", "Kaarten en spellen"], ["gifts", "Mok en tegel"]]
    .forEach(([id, label]) => P.addCategory({ id, label }));

  /* ---- formats in mm (width × height, portrait) ---- */
  [["a6", "A6", 105, 148], ["10x15", "10 × 15 cm", 100, 150], ["a5", "A5", 148, 210], ["a4", "A4", 210, 297], ["a3", "A3", 297, 420],
   ["a2", "A2", 420, 594], ["a1", "A1", 594, 841], ["30x40", "30 × 40 cm", 300, 400], ["40x50", "40 × 50 cm", 400, 500],
   ["50x70", "50 × 70 cm", 500, 700], ["book-photo", "Fotoboek 21,5 × 27,5", 215, 275], ["book-square", "Vierkant 30 × 30", 300, 300],
   ["book-trade", "Boek 20,3 × 25,4", 203, 254], ["15x42", "15 × 42 cm", 150, 420], ["30x30", "30 × 30 cm", 300, 300], ["tile-15", "Tegel 15 × 15 cm", 150, 150], ["mug-11oz", "Mok 11 oz (wikkel)", 228.6, 88.9], ["tile-20", "Tegel 20 × 20 cm", 200, 200], ["60x90", "60 × 90 cm", 600, 900], ["30x150", "30 × 150 cm", 300, 1500], ["50x148", "Boekenlegger 5 × 14,8 cm", 50, 148]]
    .forEach(([id, label, w, h]) => P.addFormat({ id, label, w, h }));

  /* ---- producers: see producers.js ---- */

  /* ---- products ---- */
  const posterFormats = ["a3", "a2", "a1", "40x50", "50x70"], poster = { formats: ["a3", "a2", "a1", "40x50", "50x70"], defaultFormat: "a2", bleed: [0, 3, 4] }, from = { id: "start", token: "vanaf", type: "start", label: "Van", default: { kw: 1, pair: false } };
  P.addProduct({ id: "book", short: "familieboek", promise: "Alles in één boek: de families, de verhalen, beelden en bronnen.", label: "Het familieboek", category: "books", status: "ready", layout: "book", renderer: "book", privacy: "site", page: "boek",
    intro: "De stamboom als boek om te laten drukken, met verhalen, beelden en bronnen.", formats: ["a4", "book-photo", "book-square", "book-trade"],
    bleed: [0, 3, 3.175], producers: ["saal", "blurb", "peecho"] });
  /* kinds of book: the same book engine with a preset ("pageToken") on #boek; each kind has its own title in the book */
  const bookBase = { category: "books", layout: "book", renderer: "book", privacy: "site", page: "boek", formats: ["a4", "book-photo", "book-square", "book-trade"], bleed: [0, 3, 3.175], producers: ["saal", "blurb", "peecho"] };
  P.addProduct({ ...bookBase, id: "book-branches", short: "familieboekjes", status: "ready", label: "Familieboekjes", pageToken: "in-familie", promise: "Een dun boekje voor elke familie.", intro: "Elke familie een eigen boekje." });
  P.addProduct({ ...bookBase, id: "book-stories", short: "verhalenboek", status: "ready", label: "Verhalenboek", pageToken: "preset-verhalen", promise: "Om te lezen: de verhalen, hun tijd en veel beelden.", intro: "De verhalen van de familie, met korte profielen." });
  P.addProduct({ ...bookBase, id: "book-pedigree", short: "kwartierstaatboekje", status: "ready", label: "Kwartierstaatboekje", pageToken: "preset-kwartierstaat", promise: "Klassiek en compact: de kwartierstaat met bronnen.", intro: "Elke voorouder met een nummer, en de bronnen." });
  P.addProduct({ ...bookBase, id: "book-research", short: "onderzoeksboek", status: "ready", label: "Onderzoeksboek", pageToken: "preset-onderzoek", promise: "Voor wie verder zoekt: bronnen, open vragen, tegenstrijdigheden.", intro: "Een naslagwerk bij de stamboom." });
  P.addProduct({ ...bookBase, id: "book-photo", short: "fotoboek", status: "ready", label: "Fotoboek", pageToken: "preset-foto", promise: "Gezichten en plaatsen: portretten, dorpen en oude kaarten.", intro: "De voorouders in beeld." });
  /* the fill-in book: a renderer (fillin.js, 16 pages), not the book core; its own page under the tab "Boeken" */
  P.addProduct({ id: "book-kids", short: "invulboek", status: "ready", page: "invulboek", tab: "boek", pageToken: "", category: "books", layout: "sheet", renderer: "fillin", privacy: "public",
    label: "Mijn voorouders", sizeText: "Een boekje om thuis te printen, of A5 en A4", promise: "Voor kinderen: de waaier om in te vullen, en vragen voor opa en oma.", intro: "Een invulboek voor kinderen.",
    formats: ["a4-boekje", "a5", "a4"], bleed: [0, 3], output: ["pdf"], options: [from], producers: [],
    /* "a4-boekje": the same 16 pages on 4 sheets of A4 (landscape, two pages a side, in booklet order): print double-sided, fold, staple */
    customFormats: [{ id: "a4-boekje", label: "Boekje om thuis te printen (A4)", w: 297, h: 210, bleed: [0] }],
    steps: [{ id: "size", question: "Hoe groot wordt het?", options: ["format"] }, { id: "ready", options: ["bleed", "producer"] }],
    note: "Kies ‘Boekje om thuis te printen’: dubbelzijdig afdrukken, omslaan langs de korte kant, dubbelvouwen en in het midden nieten. A5 en A4 zijn de bladzijden op volgorde, voor een drukker." });
  P.addProduct({ ...bookBase, id: "book-memorial", short: "gedenkboek", status: "ready", pageToken: "preset-gedenk", label: "Gedenkboek", promise: "Ter herinnering aan één voorouder of één paar: hun leven in het midden.", intro: "Een gedenkboek." });
  /* the poster wizard; "look" only where there is something to choose (the fan: generations; the map: place names) */
  /* "Voor wie" is not a step (Harrie: one family for the whole site, chosen in the header; the wizard shows it in one line) */
  const posterSteps = look => [{ id: "kind", options: ["kind"] },
    { id: "size", question: "Hoe groot wordt hij?", options: ["format"] }, ...(look ? [look] : []), { id: "ready", options: ["bleed", "producer"] }];
  P.addProduct({ ...poster, id: "poster-fan", short: "waaier", promise: "Alle voorouders in één cirkel, per familie een kleur.", page: "poster", pageToken: "", label: "Waaier als poster", category: "wall", status: "ready", layout: "sheet", renderer: "fan", privacy: "public",
    intro: "Alle voorouders in één cirkel, per familie een kleur.", formats: posterFormats, bleed: [0, 3, 4], output: ["pdf", "png"],
    options: [{ id: "gen", type: "number", label: "Generaties", min: 3, max: 9, default: "advice" }, from], producers: ["drukwerkdeal", "gelato", "saal"],
    steps: posterSteps({ id: "look", question: "Hoeveel generaties?", options: ["gen"] }) });
  P.addProduct({ ...poster, id: "poster-lineage", short: "stamreeks", promise: "Van vader op vader terug, tot de oudste.", page: "poster", pageToken: "soort-stamreeks", label: "Stamreeks als poster", category: "wall", status: "ready", layout: "sheet", renderer: "lineage", privacy: "public",
    intro: "Van vader op vader, van de oudste tot nu.", formats: [...posterFormats, "30x150", "50x148"], bleed: [0, 3, 4], options: [from], producers: ["drukwerkdeal", "gelato"], steps: posterSteps() });
  P.addProduct({ ...poster, id: "poster-pedigree", short: "kwartierstaat", promise: "Een kolom per generatie, met namen, jaren en plaatsen.", page: "poster", pageToken: "soort-kwartierstaat", label: "Kwartierstaat als poster", category: "wall", status: "ready", layout: "sheet", renderer: "pedigree", privacy: "public",
    intro: "Een kolom per generatie, met namen, jaren en plaatsen.", formats: posterFormats, bleed: [0, 3, 4], landscape: true,
    options: [{ id: "gen", type: "number", label: "Generaties", min: 3, max: 8, default: "advice", step: "ready" }, from], producers: ["drukwerkdeal", "gelato"], steps: posterSteps() });
  /* Harrie: a calendar shows stillborn children only when asked, as a memorial day (off by default; under "Meer keuzes") */
  const memorials = { id: "memorials", token: "gedenkdagen", type: "boolean", label: "Ook gedenkdagen", default: false, step: "ready" };
  const calendarSteps = look => [{ id: "kind", question: "Wat voor kalender?" },
    { id: "size", question: "Hoe groot wordt hij?", options: ["format"] }, ...(look ? [look] : []), { id: "ready", options: ["bleed", "producer"] }];
  P.addProduct({ id: "calendar-wall", short: "wandkalender", status: "ready", page: "kalender", pageToken: "", promise: "Elke maand een oude kaart, en bij de dagen wie er geboren werd of stierf.", label: "Wandkalender", category: "calendars", layout: "calendar", renderer: "calendar", privacy: "calendar",
    intro: "Per maand een dorp of familie, en op elke dag de geboorte- en sterfdagen van voorouders.", variant: "wall", formats: ["a4", "a3", "30x30"], bleed: [0, 3, 4],
    options: [{ id: "year", token: "jaar", type: "year", label: "Jaar", default: "advice" }, memorials, from], producers: ["saal", "gelato", "fotofabriek", "prodigi"],
    steps: calendarSteps({ id: "look", question: "Voor welk jaar?", options: ["year"] }) });
  P.addProduct({ id: "calendar-birthday", short: "verjaardagskalender", status: "ready", page: "kalender", pageToken: "soort-verjaardag", promise: "Zonder jaar, elk jaar opnieuw te gebruiken: de geboorte- en sterfdagen van de voorouders.", label: "Verjaardagskalender", category: "calendars", layout: "calendar", renderer: "calendar", privacy: "calendar",
    intro: "Een eeuwige kalender zonder jaar: elke dag een voorouder.", variant: "birthday", formats: ["a4", "15x42", "30x30"], bleed: [0, 3], options: [memorials, from], producers: ["fotofabriek", "prodigi"], steps: calendarSteps() });
  P.addProduct({ ...poster, id: "poster-map", short: "dorpenkaart", status: "ready", promise: "Waar de families woonden, een stip per dorp.", page: "poster", pageToken: "soort-kaart", label: "Dorpenkaart als poster", category: "wall", layout: "sheet", renderer: "map", privacy: "public",
    intro: "Waar de families woonden, in hun kleuren.", formats: posterFormats, bleed: [0, 3, 4], output: ["pdf", "png"],
    options: [{ id: "labels", token: "namen", type: "boolean", label: "Plaatsnamen", default: true }, from], producers: ["drukwerkdeal", "gelato"],
    steps: posterSteps({ id: "look", question: "Met plaatsnamen?", options: ["labels"] }) });
  P.addProduct({ id: "cards-places", short: "ansichtkaarten", status: "ready", page: "kaarten", pageToken: "", promise: "Voorkant het dorp, achterkant wie er woonden en één weetje.", label: "Ansichtkaarten van de dorpen", category: "cards", layout: "cards", renderer: "card", privacy: "game",
    intro: "Voorkant het dorp, achterkant wie er woonden en één weetje.", formats: ["a6", "10x15"], bleed: [3], options: [from], producers: ["kaartje2go", "drukwerkdeal"],
    steps: [{ id: "kind", question: "Wat wordt het?" }, { id: "size", question: "Hoe groot worden ze?", options: ["format"] }, { id: "ready", options: ["producer"] }] });
  P.addProduct({ id: "game-quartet", short: "kwartet", label: "Kwartetspel Onze voorouders", category: "cards", status: "ready", page: "kaarten", pageToken: "soort-kwartet", layout: "cards", renderer: "card", privacy: "game",
    intro: "Acht families, vier generaties: acht kwartetten.", promise: "Acht families, vier generaties: acht kwartetten.", producers: ["kwartetcadeau"], options: [from],
    steps: [{ id: "kind", question: "Wat wordt het?" }, { id: "ready", options: ["producer"] }],
    /* KwartetCadeau: every card a page of 76 × 99 mm, no bleed, a white border of at least 3 mm, round corners (5 mm); the back once, last */
    customFormats: [{ id: "kwartet", label: "Kwartetkaart 76 × 99 mm", w: 76, h: 99 }], formats: ["kwartet"], bleed: [0] });
  P.addProduct({ id: "game-memory", short: "memory", label: "Memory Onze voorouders", category: "cards", status: "ready", page: "kaarten", pageToken: "soort-memory", layout: "cards", renderer: "card", privacy: "game",
    intro: "Zoek bij elk gezicht of dorp de voorouder.", promise: "Paren van een beeld en een naam: wie hoort bij wie?", producers: [],
    options: [{ id: "pairs", token: "paren", type: "list", label: "Paren", choices: [["12", "12"], ["18", "18"], ["24", "24"]], default: "24" }, from],
    steps: [{ id: "kind", question: "Wat wordt het?" }, { id: "look", question: "Hoeveel paren?", options: ["pairs"] }, { id: "size", question: "Thuis of bij de drukker?", options: ["format"] }, { id: "ready", options: ["bleed", "producer"] }],
    /* "memory": every card a page of 60 × 60 mm with bleed, the back once, last; "a4": sheets to print at home, 12 cards per sheet with cut marks */
    customFormats: [{ id: "memory", label: "Memorykaart 60 × 60 mm", w: 60, h: 60 }], formats: ["a4", "memory"], bleed: [0, 3] });
  /* the steps of a product among others on one page (cards and games, mug and tile): first the kind; "Voor wie" is the family in the header */
  const giftSteps = (...xs) => [{ id: "kind", question: "Wat wordt het?" }, ...xs, { id: "ready", options: ["bleed", "producer"] }];
  const genStep = { id: "look", question: "Hoeveel generaties?", options: ["gen"] };
  const whoStep = { id: "who", label: "Wie", question: "Over wie gaat het?", options: ["person"] };
  P.addProduct({ id: "canvas-fan", short: "canvas", promise: "De waaier als schilderij, op doek, aluminium of hout.", label: "Waaier op canvas, aluminium of hout", category: "wall", status: "ready", page: "canvas", tab: "poster", pageToken: "", layout: "sheet", renderer: "fan", privacy: "public",
    intro: "De waaier als schilderij: op canvas, aluminium (dibond), hout of acrylglas.", formats: ["40x50", "50x70", "60x90"], defaultFormat: "50x70",
    bleed: [0, 4], output: ["pdf", "png"], png: { dpi: 150 }, options: [{ id: "gen", type: "number", label: "Generaties", min: 3, max: 9, default: "advice" }, from],
    producers: ["saal", "gelato", "fotofabriek"], steps: [{ id: "kind", question: "Wat komt op het doek?" }, { id: "size", question: "Hoe groot wordt hij?", options: ["format"] }, genStep, { id: "ready", options: ["bleed", "producer"] }],
    note: "Het bestand is voor elk materiaal hetzelfde: het materiaal kies je bij de drukker." });
  P.addProduct({ id: "canvas-families", short: "acht families", label: "Serie De acht families", category: "wall", status: "ready", page: "canvas", tab: "poster", pageToken: "soort-families", layout: "sheet", renderer: "families", privacy: "public",
    promise: "Elke familie een eigen doek: de naam, hun dorpen, een oude prent en de stamlijn.", intro: "Acht doeken op dezelfde maat, samen een wand; of één voor elke tak van de familie.",
    formats: ["30x40", "40x50", "50x70"], defaultFormat: "40x50", bleed: [0, 4], output: ["pdf", "png"], png: { dpi: 150 }, minDpi: 150, options: [from],
    producers: ["saal", "gelato", "fotofabriek"], steps: [{ id: "kind", question: "Wat komt op het doek?" }, { id: "size", question: "Hoe groot worden ze?", options: ["format"] }, { id: "ready", options: ["bleed", "producer"] }] });
  P.addProduct({ id: "puzzle-fan", short: "puzzel", promise: "De waaier als puzzel van 1000 stukjes.", label: "Legpuzzel van de waaier", category: "cards", status: "ready", page: "kaarten", pageToken: "soort-puzzel", layout: "sheet", renderer: "fan", privacy: "public",
    intro: "De waaier als puzzel van 1000 stukjes.", formats: ["50x70"], bleed: [0], output: ["png"],
    options: [{ id: "gen", type: "number", label: "Generaties", min: 3, max: 9, default: "advice" }, from], png: { w: 5906, h: 8268 }, producers: ["ravensburger"], steps: giftSteps(genStep) });
  P.addProduct({ id: "mug-fact", short: "mok", promise: "Een voorouder en één weetje, elke ochtend.", label: "Mok met een weetje", category: "gifts", status: "ready", page: "mok", pageToken: "", layout: "sheet", renderer: "text", privacy: "game",
    intro: "Een voorouder en één zin uit de stamboom, elke ochtend.", formats: ["mug-11oz"], output: ["png"], png: { w: 2700, h: 1050 },
    options: [{ id: "person", token: "wie", type: "person", label: "Wie", default: "advice" }], bleed: [0], producers: ["jeeigenmok"], steps: giftSteps(whoStep) });
  P.addProduct({ id: "tile-fact", short: "Delfts blauw tegeltje", promise: "Een naam, jaren en een beroep, in Delfts blauw.", label: "Delfts blauw tegeltje", category: "gifts", status: "ready", page: "mok", pageToken: "soort-tegel", layout: "sheet", renderer: "text", privacy: "game",
    intro: "Een naam, een jaar en een plaats, in Delfts blauw, geprint op een tegel.", formats: ["tile-15", "tile-20"], options: [{ id: "person", token: "wie", type: "person", label: "Wie", default: "advice" }], output: ["png"], png: { dpi: 300 }, bleed: [0], producers: ["tegeltje"], steps: giftSteps(whoStep, { id: "size", question: "Hoe groot wordt hij?", options: ["format"] }),
    note: "Dit tegeltje wordt geprint, niet geschilderd." });
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
