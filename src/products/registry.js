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
  P.addCategory = c => { need(c, ["id", "label"], "category"); P.categories[c.id] = Object.freeze({ order: Object.keys(P.categories).length, ...c }); };
  P.addFormat = f => { need(f, ["id", "label", "w", "h"], "format"); P.formats[f.id] = Object.freeze({ ...f }); };
  P.addProducer = p => { need(p, ["id", "label", "url"], "producer"); P.producers[p.id] = Object.freeze({ bleed: 3, color: "sRGB", file: "pdf", howToOrder: [], ...p }); };
  P.addProduct = d => {
    need(d, ["id", "label", "category", "layout", "renderer", "privacy"], "product");
    if (!P.categories[d.category]) throw new Error(`product ${d.id}: unknown category ${d.category}`);
    const p = { order: Object.keys(P.products).length, status: "planned", intro: "", formats: [], bleed: [0, 3], safe: 5, output: ["pdf"], minPt: 6, minDpi: 150, options: [], producers: [], ...d };
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
     producer to finish, the rest to content. A product may list its own steps [{ id, label, options, collapsed }] (the book). Empty steps go; finish starts collapsed. */
  const STEP_LABELS = { which: "Van wie", content: "Wat erop staat", look: "Vorm", finish: "Voor de drukker" };
  P.stepsOf = product => {
    if (product.steps) return product.steps;
    const st = { which: [], content: [], look: [], finish: [] };
    product.options.forEach(o => st[o.step || (o.type === "start" ? "which" : "content")].push(o.id));
    if (product.formats.length > 1) st.look.push("format");
    if (product.bleed.length > 1) st.finish.push("bleed");
    if (product.producers.length) st.finish.push("producer");
    return Object.keys(st).filter(k => st[k].length).map(id => ({ id, label: STEP_LABELS[id], options: st[id], collapsed: id === "finish" }));
  };
  /* the format of a product, as { w, h } in mm; a product may also carry its own { id, label, w, h } */
  P.formatOf = (product, id) => P.formats[id] || (product.customFormats || []).find(f => f.id === id) || null;

  /* ---- categories (the order is the order on the hub) ---- */
  [["books", "Boeken"], ["wall", "Aan de muur"], ["cards", "Kalenders en kaarten"], ["gifts", "Cadeaus"]]
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
  P.addProduct({ ...bookBase, id: "book-branches", short: "familieboekjes", status: "ready", label: "Familieboekjes", pageToken: "in-familie", promise: "Acht dunne boekjes, voor elke tak één.", intro: "Elke familie een eigen boekje." });
  P.addProduct({ ...bookBase, id: "book-stories", short: "verhalenboek", status: "ready", label: "Verhalenboek", pageToken: "preset-verhalen", promise: "Om te lezen: de verhalen, hun tijd en veel beelden.", intro: "De verhalen van de familie, met korte profielen." });
  P.addProduct({ ...bookBase, id: "book-pedigree", short: "kwartierstaat-boekje", status: "ready", label: "Kwartierstaat-boekje", pageToken: "preset-kwartierstaat", promise: "Klassiek en compact: de kwartierstaat met bronnen.", intro: "Elke voorouder met een nummer, en de bronnen." });
  P.addProduct({ ...bookBase, id: "book-research", short: "naslagwerk", status: "ready", label: "Het onderzoek", pageToken: "preset-onderzoek", promise: "Voor wie verder zoekt: bronnen, open vragen, tegenstrijdigheden.", intro: "Een naslagwerk bij de stamboom." });
  P.addProduct({ ...bookBase, id: "book-photo", short: "fotoboek", status: "ready", label: "Gezichten en plaatsen", pageToken: "preset-foto", promise: "Een fotoboek: portretten, dorpen en oude kaarten.", intro: "De voorouders in beeld." });
  P.addProduct({ ...bookBase, id: "book-kids", short: "invulboek", status: "planned", page: null, label: "Mijn voorouders (invulboek)", promise: "Voor kinderen: de waaier om in te vullen, en vragen voor opa en oma.", intro: "Een invulboek voor kinderen." });
  P.addProduct({ ...bookBase, id: "book-memorial", short: "gedenkboek", status: "planned", page: null, label: "Gedenkboek", promise: "Over één persoon of één paar, met hun leven in het midden.", intro: "Een gedenkboek." });
  P.addProduct({ ...poster, id: "poster-fan", short: "waaier", promise: "Alle voorouders in één cirkel, per familie een kleur.", page: "poster", pageToken: "", label: "Poster van de waaier", category: "wall", status: "ready", layout: "sheet", renderer: "fan", privacy: "public",
    intro: "Alle voorouders in één cirkel, per familie een kleur.", formats: posterFormats, bleed: [0, 3, 4], output: ["pdf", "png"],
    options: [{ id: "gen", type: "number", label: "Generaties", min: 3, max: 9, default: "advice" }, from], producers: ["drukwerkdeal", "gelato", "saal"] });
  P.addProduct({ ...poster, id: "poster-lineage", short: "stamreeks", promise: "Van vader op vader terug, tot de oudste.", page: "poster", pageToken: "soort-stamreeks", label: "Stamreeks als poster", category: "wall", status: "ready", layout: "sheet", renderer: "lineage", privacy: "public",
    intro: "Van vader op vader, van de oudste tot nu.", formats: [...posterFormats, "30x150", "50x148"], bleed: [0, 3, 4], options: [from], producers: ["drukwerkdeal", "gelato"] });
  P.addProduct({ ...poster, id: "poster-pedigree", short: "kwartierstaat", promise: "Een kolom per generatie, met namen, jaren en plaatsen.", page: "poster", pageToken: "soort-kwartierstaat", label: "Kwartierstaat als poster", category: "wall", status: "ready", layout: "sheet", renderer: "pedigree", privacy: "public",
    intro: "Een kolom per generatie, met namen, jaren en plaatsen.", formats: posterFormats, bleed: [0, 3, 4], landscape: true,
    options: [{ id: "gen", type: "number", label: "Generaties", min: 3, max: 8, default: "advice" }, from], producers: ["drukwerkdeal", "gelato"] });
  P.addProduct({ id: "calendar-wall", short: "wandkalender", promise: "Elke maand een oude kaart, en bij de dagen wie er geboren werd of stierf.", label: "Wandkalender", category: "cards", layout: "calendar", renderer: "calendar", privacy: "calendar",
    intro: "Per maand een dorp of familie, en op elke dag de geboorte- en sterfdagen van voorouders.", variant: "wall", formats: ["a4", "a3", "30x30"], bleed: [0, 3, 4],
    options: [{ id: "year", token: "jaar", type: "year", label: "Jaar", default: "advice" }, from], producers: ["saal", "gelato", "fotofabriek", "prodigi"] });
  P.addProduct({ id: "calendar-birthday", short: "verjaardagskalender", promise: "Een kalender zonder jaar, met de geboorte- en sterfdagen van de voorouders.", label: "Verjaardagskalender", category: "cards", layout: "calendar", renderer: "calendar", privacy: "calendar",
    intro: "Een eeuwige kalender zonder jaar: elke dag een voorouder.", variant: "birthday", formats: ["a4", "15x42", "30x30"], bleed: [0, 3], options: [from], producers: ["fotofabriek", "prodigi"] });
  P.addProduct({ ...poster, id: "poster-map", short: "kaart", status: "ready", promise: "Waar de families woonden, een stip per dorp.", page: "poster", pageToken: "soort-kaart", label: "Kaart als poster", category: "wall", layout: "sheet", renderer: "map", privacy: "public",
    intro: "Waar de families woonden, in hun kleuren.", formats: posterFormats, bleed: [0, 3, 4], output: ["pdf", "png"], options: [from], producers: ["drukwerkdeal", "gelato"] });
  P.addProduct({ id: "cards-places", short: "kaartenset", promise: "Ansichtkaarten van de dorpen, met wie er woonde.", label: "Kaartenset Dorpen en voorouders", category: "cards", layout: "cards", renderer: "card", privacy: "game",
    intro: "Voorkant het dorp, achterkant wie er woonden en één weetje.", formats: ["a6", "10x15"], bleed: [3], options: [from], producers: ["kaartje2go", "drukwerkdeal"] });
  P.addProduct({ id: "game-quartet", short: "kwartet", label: "Kwartetspel Onze voorouders", category: "gifts", layout: "cards", renderer: "card", privacy: "game",
    intro: "Acht families, vier generaties: acht kwartetten.", producers: ["kwartetcadeau"] });
  P.addProduct({ id: "canvas-fan", short: "canvas", promise: "De waaier of de kaart op doek.", label: "Waaier op canvas, aluminium of hout", category: "wall", status: "beta", layout: "sheet", renderer: "fan", privacy: "public",
    intro: "De waaier als schilderij: op canvas, aluminium (dibond), hout of acrylglas.", formats: ["40x50", "50x70", "60x90"], defaultFormat: "50x70",
    bleed: [0, 4], output: ["pdf", "png"], png: { dpi: 150 }, options: [{ id: "gen", type: "number", label: "Generaties", min: 3, max: 9, default: "advice" }, from],
    producers: ["saal", "gelato", "fotofabriek"] });
  P.addProduct({ id: "puzzle-fan", short: "puzzel", promise: "De waaier als puzzel van 1000 stukjes.", label: "Legpuzzel van de waaier", category: "gifts", status: "beta", layout: "sheet", renderer: "fan", privacy: "public",
    intro: "De waaier als puzzel van 1000 stukjes.", formats: ["50x70"], bleed: [0], output: ["png"],
    options: [{ id: "gen", type: "number", label: "Generaties", min: 3, max: 9, default: "advice" }, from], png: { w: 5906, h: 8268 }, producers: ["ravensburger"] });
  P.addProduct({ id: "mug-fact", short: "mok", promise: "Een voorouder en één weetje, elke ochtend.", label: "Mok met een weetje", category: "gifts", layout: "sheet", renderer: "text", privacy: "game",
    intro: "Een voorouder en één zin uit de stamboom, elke ochtend.", formats: ["mug-11oz"], output: ["png"], png: { w: 2700, h: 1050 },
    options: [{ id: "person", token: "wie", type: "person", label: "Wie", default: "advice" }], bleed: [0], producers: ["jeeigenmok"] });
  P.addProduct({ id: "tile-fact", short: "Delfts blauw tegeltje", promise: "Een naam, jaren en een beroep, in Delfts blauw.", label: "Delfts blauw tegeltje", category: "gifts", layout: "sheet", renderer: "text", privacy: "game",
    intro: "Een naam, een jaar en een plaats, in Delfts blauw.", formats: ["tile-15", "tile-20"], options: [{ id: "person", token: "wie", type: "person", label: "Wie", default: "advice" }], output: ["png"], png: { dpi: 300 }, bleed: [0], producers: ["tegeltje"] });
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
