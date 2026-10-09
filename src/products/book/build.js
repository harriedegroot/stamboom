/* The family book, pure: Products.book.forTree(data) → { parse, format, parts, members, options, build, estimate, … }.
   data = the book data of one tree (Products.site.bookData(k) in the browser): the sober tree data (living people only kw, n, roep,
   living) plus the book's own content (stories, history, open questions, archives) and a few facts the site derives for each person
   (portrait, chain strength, oldest proven year). No DOM, no globals: the same code can run on a server. Layout (Paged.js, the
   preview, printing) stays in the browser layer. The labels are the Dutch interface texts.
   S (the choices) has the shape of the site's book state: { start, paar, omslag, split, deelNr, detail, formaat, delen:Set, beeld,
   bron, hyp, afloop, lijn, zuiver, hires }. hooks are optional functions from the typography and cover code (voorwerk, nawerk, omslag,
   waaier, opening, naam, beelden, src, verste, zetwerk); without them the book has a plain form. */
(function (P) {
  /* parts of the book, each with a short explanation; "fam" is the core (per family the opening, the story and all ancestors) */
  const PARTS = [
    ["leven", "Hun leven", "Het leven van wie centraal staat: wie ze waren, waar ze woonden, hun beelden en verhalen (gedenkboek)"],
    ["fam", "De families", "Opening, stamlijn, verhaal en alle voorouders"],
    ["kaart", "Waar ze woonden", "De dorpen van de families op een kaart"],
    ["kruis", "Waar de families elkaar kruisten", "De dorpen waar beide kanten woonden (alleen in het boek van de kinderen)"],
    ["tijdlijn", "Hun levens in de tijd", "Elk leven als balk tussen de grote gebeurtenissen"],
    ["verst", "De verste voorouder", "Een pagina over de oudste per familie"],
    ["verh", "Andere verhalen", "Verhalen over meer families tegelijk"],
    ["tijd", "Hun tijd", "De geschiedenis rond de families"],
    ["kw", "Kwartierstaat", "Alle voorouders genummerd, als lijst"],
    ["open", "Open vragen", "Tegenstrijdigheden en wat nog open is"],
    ["bron", "Bronnen en beelden", "Archieven, genealogieën en beeldherkomst"],
    ["getal", "In getallen", "Leeftijden, namen, beroepen en plaatsen"],
    ["begr", "Begrippen", "Woorden uit de akten en de stamboom uitgelegd"]];
  /* trimmed page sizes; the bleed is added for the printer */
  const FORMATS = [["a4", "A4 staand", "a4", "210mm 297mm"], ["foto", "Fotoboek 21,5 × 27,5", "foto", "215mm 275mm"], ["vierkant", "Vierkant 30 × 30", "vierkant", "300mm 300mm"], ["trade", "Boek 20,3 × 25,4", "trade", "203mm 254mm"]];
  const BLEEDS = [["", "Zelf afdrukken"], ["3", "Saal Digital"], ["blurb", "Blurb"], ["0", "Peecho"]];
  const IMAGES = [["geen", "Geen"], ["weinig", "Weinig"], ["veel", "Veel"]];
  const SOURCES = [["noten", "Als noten per familie"], ["profiel", "Bij elk profiel"], ["site", "Alleen een verwijzing naar de site"]];
  const HYPOTHESES = [["mark", "Erbij, gemarkeerd als hypothese"], ["weg", "Weglaten"]];
  /* uitleg: {tot} = the number of generations with a full profile ("7 generaties"), filled in by the page */
  const PRESETS = {
    compact: { naam: "Compact", uitleg: "De families; volledige profielen over {tot}.", detail: 5, beeld: "weinig", bron: "site", hyp: "weg", delen: ["fam", "verst"] },
    standaard: { naam: "Standaard", uitleg: "Ook Hun tijd en de kwartierstaat; volledige profielen over {tot}.", detail: 7, beeld: "weinig", bron: "noten", hyp: "mark", delen: ["fam", "kaart", "kruis", "verst", "verh", "tijd", "kw", "begr"] },
    volledig: { naam: "Volledig", uitleg: "Alles, en iedere voorouder een volledig profiel; vaak in twee delen.", detail: 99, beeld: "veel", bron: "noten", hyp: "mark", delen: PARTS.map(d => d[0]) },
    /* book types (soort): they stay in the address and give the book its own title */
    verhalen: { soort: true, naam: "Verhalenboek", uitleg: "De verhalen, Hun tijd en de kaart, met veel beelden; de voorouders kort.", detail: 2, beeld: "veel", bron: "site", hyp: "mark", delen: ["fam", "verh", "tijd", "kaart"] },
    kwartierstaat: { soort: true, naam: "Kwartierstaatboekje", uitleg: "De kwartierstaat met de bronnen en de begrippen, klein van formaat.", detail: 2, beeld: "geen", bron: "site", hyp: "mark", formaat: "trade", delen: ["kw", "bron", "begr"] },
    onderzoek: { soort: true, naam: "Onderzoeksboek", uitleg: "Naslag: de kwartierstaat, open vragen en tegenstrijdigheden, de bronnen, de getallen en de begrippen.", detail: 2, beeld: "geen", bron: "noten", hyp: "mark", delen: ["kw", "open", "bron", "getal", "begr"] },
    foto: { soort: true, naam: "Fotoboek", uitleg: "Een fotoboek: per familie de gezichten en de plaatsen, met een bijschrift bij elk beeld, en de kaart.", detail: 2, beeld: "veel", bron: "site", hyp: "mark", formaat: "foto", delen: ["fam", "kaart"] } ,
    /* a memorial booklet about one person or couple (the start, or the focus of the site): their life in the middle, full profiles up
       to their grandparents, many images, the stories and their time; the title "Ter herinnering aan …" */
    gedenk: { soort: true, naam: "Gedenkboek", uitleg: "Over één persoon of één paar: hun leven in het midden, met veel beelden, hun voorouders en hun tijd.", detail: 3, beeld: "veel", bron: "noten", hyp: "mark", delen: ["leven", "fam", "tijd", "kaart", "begr"] } };
  const SPLITS = [["een", "Eén boek"], ["kanten", "Twee delen"], ["familie", "Een deel per familie"]];
  const MAX_PAGES = { "3": ["Saal Digital", 160], blurb: ["Blurb", 480], "0": ["Peecho", 504] };
  const COVERS = [["b", "Papier en waaier", "Licht papier met de hele waaier onder de titel; de namen zijn goed te lezen. Rustig, als een echt boek."],
    ["a", "Donker en goud", "Een donkere omslag met de volle waaier en een gouden titel. Klassiek en sterk in de boekenkast."],
    ["c", "Oude kaart", "Een oude kaart van de streek als achtergrond, met de waaier en de titel in een kader."]];
  const LINE_KEYS = [8, 9, 10, 11, 12, 13, 14, 15];
  const RANK = { A: 0, B: 1, C: 2, D: 3 };
  const empty = () => ({ soort: "", start: 1, paar: false, persoon: false, voor: [], omslag: "b", split: "een", deelNr: 1, detail: 7, formaat: "a4", delen: new Set(PRESETS.standaard.delen), beeld: "weinig", bron: "noten", hyp: "mark", afloop: "", lijn: 0, zuiver: false, hires: false });

  function forTree(data, hooks = {}) {
    const X = P.bookText(data), { esc, year, isApprox, gen, lineOf, noteObj, fmtDate, lifeYears, firstName, splitName, genPre, relBase, placeName, shortLine, statusLong, siteHost, ROMAN } = X;
    const H = (n, ...a) => typeof hooks[n] === "function" ? hooks[n](...a) : null;
    const LINES = data.lines || {}, STORIES = data.stories || [], ALIASES = data.aliases || {};
    const byKw = new Map((data.people || []).map(p => [p.kw, p])), person = kw => byKw.get(kw) || null;
    /* the people of the book: the dead ancestors (the living stay out, as on the site; their names only appear where a text names them) */
    const people = (data.people || []).filter(p => !p.living).sort((a, b) => a.kw - b.kw);
    const aliasList = Object.entries(ALIASES).map(([k, v]) => [+k, +v]);
    const portrait = kw => (data.portraits || {})[kw] || null;
    const provenYear = kw => (data.provenYear || {})[kw] || null;
    const root = data.rootFull || data.root || "", rootShort = data.rootShort || root;
    const siteUrl = tok => (data.site || "") + "/#" + (data.prefix || "") + tok;
    /* the real person behind a position under an alias (pedigree collapse) */
    function fanKw(kw) {
      let k = kw;
      for (let guard = 0; guard < 8 && !byKw.has(k); guard++) {
        let a = k, s = 0, hit = false;
        while (a > 1) { a = Math.floor(a / 2); s++; if (ALIASES[a] !== undefined) { k = ALIASES[a] * 2 ** s + k % 2 ** s; hit = true; break; } }
        if (!hit) break;
      }
      return k;
    }
    /* relation to the root of the whole tree (the site's relTerm) */
    const sideFamOf = kw => (data.sideFam || {})[kw >> (gen(kw) - 2)] || ""; /* in s: "De Groot · Boersma" or "Hoekstra · Bakker" (bkBookData.sideFam) */
    function relTerm(kw) {
      if (data.tree === "s") {
        if (kw === 1) return "de kinderen van " + Object.values(data.sides || {}).join(" en ");
        return relBase(gen(kw) - 1, kw, rootShort) + (gen(kw) > 2 ? (sideFamOf(kw) ? " (" + sideFamOf(kw) + ")" : "") : ""); /* the side by its families (19), the name only as a fallback */
      }
      return relBase(gen(kw) - 1, kw, rootShort);
    }
    const genNameRoot = g => (data.genNames || [])[g] || (g === 1 ? rootShort : genPre(g - 1) === undefined ? "voorouders" : genPre(g - 1) + "ouders");

    /* ---- the start of the book: one person (S.start) or a couple (S.paar: S.start and S.start + 1); start 1 = the whole tree ---- */
    const startOn = S => S.paar || S.start > 1;
    /* roots of the subtree, plus the targets of aliases inside it (pedigree collapse); via = target → the alias position under the start */
    function roots(S) {
      const r = S.paar ? [S.start, S.start + 1] : [S.start], via = new Map(), under = kw => r.some(w => gen(kw) >= gen(w) && kw >> (gen(kw) - gen(w)) === w);
      for (let i = 0; i < 8; i++) { const extra = aliasList.filter(([pos, to]) => under(pos) && !r.includes(to)); if (!extra.length) break; extra.forEach(([pos, to]) => { r.push(to); via.set(to, pos); }); }
      return { r, under, via };
    }
    /* the position of someone in this book: their own number, or for someone reached through an alias the number under the alias position */
    function posOf(S, kw) {
      const { r, via } = roots(S), direct = r.slice(0, S.paar ? 2 : 1);
      if (direct.some(w => gen(kw) >= gen(w) && kw >> (gen(kw) - gen(w)) === w)) return kw;
      for (const [t, a] of via) { const d = gen(kw) - gen(t); if (d >= 0 && kw >> d === t) return posOf(S, a * 2 ** d + (kw - t * 2 ** d)); }
      return kw;
    }
    function startLines(S) {
      const { r, under } = roots(S);
      return LINE_KEYS.filter(l => LINES[l] && (under(l) || r.some(w => gen(w) >= gen(l) && w >> (gen(w) - gen(l)) === l)));
    }
    const base = S => S.paar ? S.start >> 1 : S.start;
    const genOf = (S, kw) => gen(startOn(S) ? posOf(S, kw) : kw) - gen(base(S)) + 1;
    const firstOf = kw => firstName(person(kw));
    const surname = p => { const x = splitName(p.n).sur; return x ? x[0].toUpperCase() + x.slice(1) : ""; };
    const callFull = p => p ? [firstName(p), splitName(p.n).sur].filter(Boolean).join(" ") : "";
    const personName = S => { const a = person(S.start), b = S.paar ? person(S.start + 1) : null; if (!b) return callFull(a); if (!a) return callFull(b);
      const sa = splitName(a.n).sur, sb = splitName(b.n).sur; return sa && sa === sb ? `${firstName(a)} en ${firstName(b)} ${sa}` : `${callFull(a)} en ${callFull(b)}`; };
    const startName = S => { const a = person(S.start), b = S.paar ? person(S.start + 1) : null; return S.paar ? [a, b].filter(Boolean).map(p => p.n).join(" en ") : a ? a.n : ""; };
    const genName = (S, g) => !startOn(S) ? genNameRoot(g) : g === 1 ? (S.paar ? "hun kinderen" : firstOf(S.start)) : (genPre(g - 1) === undefined ? "voorouders" : genPre(g - 1) + "ouders");
    function rel(S, kw) {
      if (!startOn(S)) return relTerm(kw);
      const s = genOf(S, kw) - 1; if (s <= 0 || (S.paar && s === 1)) return "aan het begin van dit boek";
      return relBase(s, posOf(S, kw), rootShort) + (S.paar ? " van hun kinderen" : " van " + firstOf(S.start));
    }
    /* the weakest evidence in the chain from someone down to the root (A 0 … D 3) */
    function chain(kw) { let w = 0; for (let k = kw; k > 1; k >>= 1) { const p = person(k); if (!p) return 3; if (!p.living) w = Math.max(w, RANK[p.st] ?? 3); } return w; }
    /* everyone is in the book; the depth only decides a full or a short profile. "Leave out hypotheses" drops whoever rests on a D link. */
    function members(S) { const w = startOn(S) ? roots(S).under : null; return people.filter(p => (!w || w(p.kw)) && (S.hyp !== "weg" || chain(p.kw) < 3)); }
    /* a memorial book (gedenk) is about one person or one couple: the start, or the focus of the site; only the dead (a living start gives
       no chapter of its own: the site starts such a book at the nearest couple of whom nobody is living) */
    function subjects(S) {
      const f = data.focus, ks = startOn(S) ? (S.paar ? [S.start, S.start + 1] : [S.start]) : f && !f.pair && !(f.persons || []).length ? [1] : [2, 3];
      return ks.map(person).filter(p => p && !p.living);
    }
    const lifeStories = S => { const ks = new Set(subjects(S).map(p => p.kw)); return STORIES.filter(s => (s.people || []).some(k => ks.has(k))); };
    function partsOf(S) {
      const fams = startOn(S) ? startLines(S) : LINE_KEYS.filter(l => LINES[l]);
      if (S.lijn) return [{ nr: 1, aantal: 1, naam: "", lijnen: [S.lijn] }];
      if (S.split === "kanten") { const sf = data.sideFam || {}, k = data.tree === "s" ? [sf[2] || "Vaderskant", sf[3] || "Moederskant"] : ["Vaderskant", "Moederskant"]; /* the two sides by their families */
        const d = [{ naam: k[0], lijnen: fams.filter(l => l < 12) }, { naam: k[1], lijnen: fams.filter(l => l >= 12) }].filter(x => x.lijnen.length); /* with a start one side can be empty */
        if (d.length > 1) return d.map((x, i) => ({ nr: i + 1, aantal: d.length, ...x })); }
      if (S.split === "familie") return fams.map((l, n) => ({ nr: n + 1, aantal: fams.length, naam: "Familie " + LINES[l].name, lijnen: [l] }));
      return [{ nr: 1, aantal: 1, naam: "", lijnen: fams }];
    }

    /* ---- choices in the address: bare tokens, defaults left out ---- */
    function parse(t) {
      const S = empty(), toks = String(t).split("--").slice(1);
      toks.filter(x => /^preset-/.test(x)).forEach(x => applyPreset(S, x.slice(7))); /* the preset first, whatever the order */
      toks.filter(x => !/^preset-/.test(x)).forEach(x => {
        let m;
        if ((m = x.match(/^(?:detail|diepte)-(alle|ab|\d{1,2})$/))) S.detail = m[1] === "alle" || m[1] === "ab" ? 99 : Math.max(3, Math.min(30, +m[1])); /* "diepte" and "ab" from before */
        else if ((m = x.match(/^formaat-(\w+)$/)) && FORMATS.some(f => f[0] === m[1])) S.formaat = m[1];
        else if ((m = x.match(/^delen-([\w.]*)$/))) S.delen = new Set(m[1].split(".").filter(d => PARTS.some(b => b[0] === d)));
        else if ((m = x.match(/^beeld-(\w+)$/)) && IMAGES.some(b => b[0] === m[1])) S.beeld = m[1];
        else if ((m = x.match(/^bron-(\w+)$/)) && SOURCES.some(b => b[0] === m[1])) S.bron = m[1];
        else if ((m = x.match(/^hyp-(\w+)$/)) && HYPOTHESES.some(b => b[0] === m[1])) S.hyp = m[1];
        else if ((m = x.match(/^lijn-(\d+)$/)) && LINES[+m[1]]) S.lijn = +m[1];
        else if ((m = x.match(/^in-(kanten|familie)$/))) S.split = m[1];
        else if ((m = x.match(/^deel-(\d{1,2})$/))) S.deelNr = Math.max(1, +m[1]);
        else if ((m = x.match(/^druk(?:-(3|blurb|0))?$/))) S.afloop = m[1] || "3";
        else if ((m = x.match(/^omslag-([abc])$/))) S.omslag = m[1];
        else if ((m = x.match(/^vanaf-paar-(\d+)$/))) { const k = fanKw(+m[1] & ~1) & ~1; if (k >= 2 && (person(k) || person(k + 1))) { S.start = k; S.paar = true; } }
        else if ((m = x.match(/^(?:vanaf|start)-(\d+)$/))) { const k = fanKw(+m[1]); if (person(k)) { S.start = k; S.paar = false; } } /* "start-" from an earlier proposal */
        else if (x === "persoon") S.persoon = true; /* chosen as a person ("Iemand anders…"): the title names the person, not the family */
        else if ((m = x.match(/^voor-([a-z0-9_]{1,40})$/))) { S.voor.push(m[1].split("_").map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(" ")); S.persoon = true; } /* for whom (children of the couple), repeatable */
        else if (x === "zuiver") S.zuiver = true;
        else if (x === "hires") S.hires = true; /* sharp originals, only when building locally */
      });
      if (S.soort === "gedenk" && !subjects(S).length) { /* only the dead as subject: the nearest couple above the start of whom nobody is living */
        const two = k => [k, k + 1].map(x => person(fanKw(x))).filter(Boolean), ok = k => { const d = two(k); return d.length && d.every(q => !q.living); };
        const q = !startOn(S) ? [2] : S.paar ? [2 * S.start, 2 * (S.start + 1)] : [2 * S.start];
        while (q.length) { const k = q.shift(); if (k > 2 ** 20) break; if (ok(k)) { S.start = k; S.paar = true; break; } if (two(k).length) q.push(2 * k, 2 * (k + 1)); }
      }
      if (startOn(S)) { S.lijn = 0; if (startLines(S).length < 2) S.split = "een"; }
      return S;
    }
    function format(S) {
      const D = S.soort && PRESETS[S.soort] ? applyPreset(empty(), S.soort) : empty(), p = ["boek"], ds = [...S.delen].sort().join("."), dd = [...D.delen].sort().join(".");
      if (S.soort && PRESETS[S.soort]) p.push("preset-" + S.soort);
      if (S.detail !== D.detail) p.push("detail-" + (S.detail >= 99 ? "alle" : S.detail));
      if (S.formaat !== D.formaat) p.push("formaat-" + S.formaat);
      if (S.omslag !== D.omslag) p.push("omslag-" + S.omslag);
      if (S.paar) p.push("vanaf-paar-" + S.start); else if (S.start > 1) p.push("vanaf-" + S.start);
      if (ds !== dd) p.push("delen-" + PARTS.map(d => d[0]).filter(d => S.delen.has(d)).join("."));
      if (S.beeld !== D.beeld) p.push("beeld-" + S.beeld);
      if (S.bron !== D.bron) p.push("bron-" + S.bron);
      if (S.hyp !== D.hyp) p.push("hyp-" + S.hyp);
      if (S.persoon && !(S.voor || []).length) p.push("persoon");
      (S.voor || []).forEach(n => p.push("voor-" + String(n).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")));
      if (S.lijn) p.push("lijn-" + S.lijn);
      if (S.split !== "een" && !S.lijn) p.push("in-" + S.split);
      if (S.split !== "een" && !S.lijn && S.deelNr > 1) p.push("deel-" + S.deelNr);
      if (S.afloop) p.push("druk-" + S.afloop);
      if (S.zuiver) p.push("zuiver");
      if (S.hires) p.push("hires");
      return p.join("--");
    }

    /* ---- title and subtitle, from the choice (the whole tree, one family, a part, or a start), for the cover, the title page, the
       running heads, the colophon, document.title and the file name. kern = the person in the middle of the fan on the cover. ---- */
    function titles(S, deel, mensen) {
      const lijnen = S.lijn ? [S.lijn] : deel.lijnen;
      /* the oldest proven year, strictly (A/B, proven chain, the oldest exact date), as on the site and the cover */
      const ys = mensen.filter(k => lijnen.includes(lineOf(k))).map(provenYear).filter(y => y && y < 9999);
      const oudste = ys.length ? Math.min(...ys) : null, jaren = oudste ? `${oudste} – ${data.thisYear || new Date().getFullYear()}` : "";
      /* with a family or a part no name of the root in the subtitle (a brother or a niece must be able to make the book too) */
      /* generations: proven (the chain A/B, data.provenKws from the site), counted from the root of the choice, the root included;
         the same measure as the overview and In getallen. Without that data: the generations that have ancestors in this book */
      const inLijn = mensen.filter(k => lijnen.includes(lineOf(k))), bewezen = data.provenKws ? new Set(data.provenKws) : null;
      const gens = bewezen ? Math.max(0, ...inLijn.filter(k => bewezen.has(k)).map(k => genOf(S, k))) : new Set(inLijn.map(gen)).size;
      const streek = lijnen.length === 1 && LINES[lijnen[0]] ? LINES[lijnen[0]].region || "" : "";
      const info = [gens > 1 ? `${gens} generaties` : "", streek, jaren].filter(Boolean).join(" · ");
      let titel = `De voorouders van ${root}`, ondertitel = "", kern = 1;
      if (S.lijn && LINES[S.lijn]) { titel = `De familie ${LINES[S.lijn].name}`; ondertitel = info || "Een familiegeschiedenis"; kern = S.lijn; }
      else if (deel.aantal > 1) {
        if (S.split === "familie") { titel = `De familie ${LINES[deel.lijnen[0]].name}`; kern = deel.lijnen[0]; ondertitel = [`Deel ${deel.nr} van ${deel.aantal}`, info].filter(Boolean).join(" · "); }
        else { /* a side: person-neutral, with the families of the two grandparents (their father lines: kw 8 and 10, or 12 and 14) */
          kern = deel.nr === 1 ? 2 : 3;
          const fam = l => LINES[l] ? String(LINES[l].name).split(" · ")[0] : "", gp = [kern * 4, kern * 4 + 2].map(fam).filter(Boolean);
          titel = `${deel.naam}: ${data.tree === "s" ? "" : "de families "}${gp.join(" en ")}`;
          ondertitel = [`Deel ${deel.nr} van ${deel.aantal}`, lijnen.map(fam).filter(Boolean).join(" · "), jaren].filter(Boolean).join(" · "); }
      }
      else if (startOn(S) || !S.persoon) { /* a family (a card of "Voor wie": a couple, or the whole tree = the couple 2–3) is named after
           the surnames of that couple, with only years in the subtitle (Harrie: no person's name on the cover); a person chosen as a person
           ("Iemand anders…", S.persoon), or a start without family names, gets "De voorouders van …" */
        const fam = k => { if (gen(k) > 4) return ""; const l = LINES[k << (4 - gen(k))]; if (l) return String(l.name).split(" · ")[0].replace(/\s*\([^)]*\)/g, "").trim(); /* "Bakker (Sjoerd)" in a focus tree: the surname only */ const p = person(k); return p && !p.alias ? surname(p) : ""; };
        const paarK = S.paar ? S.start : !startOn(S) ? 2 : 0; /* the whole tree: the couple 2–3 */
        kern = startOn(S) ? base(S) : 1;
        if ((S.voor || []).length) { /* for one or more children of the couple: their names, the family in the subtitle */
          const sur = person(S.start) ? splitName(person(S.start).n).sur : "", wie = S.voor.length === 1 ? [S.voor[0], sur].filter(Boolean).join(" ") : S.voor.slice(0, -1).join(", ") + " en " + S.voor[S.voor.length - 1];
          titel = `De voorouders van ${wie}`; ondertitel = [paarK && fam(paarK) && fam(paarK + 1) ? `De familie ${fam(paarK)} · ${fam(paarK + 1)}` : "", info].filter(Boolean).join(" · "); }
        else if (paarK && !S.persoon && fam(paarK) && fam(paarK + 1)) { titel = `De familie ${fam(paarK)} · ${fam(paarK + 1)}`; ondertitel = info; }
        else if (startOn(S)) { titel = `De voorouders van ${personName(S)}`; ondertitel = info; }
        else ondertitel = info; /* the whole tree, chosen as a person: "De voorouders van Harrie de Groot" */
        /* a focus tree of the site (data.focus, FK2) for the whole tree: a person → "De voorouders van Kees de Groot"; "Voor …" → the
           children it is for; a couple keeps the family title above */
        const fo = data.focus;
        if (fo && !startOn(S) && !S.persoon && !(S.voor || []).length) {
          const ps = fo.persons || [], v = person(2), sur = v ? splitName(v.n).sur : "";
          if (ps.length) { titel = "De voorouders van " + (ps.length === 1 ? [ps[0], sur].filter(Boolean).join(" ") : ps.slice(0, -1).join(", ") + " en " + ps[ps.length - 1]);
            ondertitel = [fam(2) && fam(3) ? `De familie ${fam(2)} · ${fam(3)}` : "", info].filter(Boolean).join(" · "); }
          else if (!fo.pair && person(1)) { titel = "De voorouders van " + callFull(person(1)); ondertitel = info; }
        }
      }
      /* a book type gives its own title, built on the title of the choice (who, which family) */
      const lc = x => x ? x[0].toLowerCase() + x.slice(1) : x;
      if (S.soort === "verhalen") titel = "Verhalen van " + lc(titel);
      else if (S.soort === "kwartierstaat") titel = titel.startsWith("De voorouders van ") ? "Kwartierstaat van " + titel.slice(18) : "Kwartierstaat van " + lc(titel);
      else if (S.soort === "onderzoek") titel = "Het onderzoek naar " + lc(titel);
      else if (S.soort === "foto") { ondertitel = [titel, ondertitel].filter(Boolean).join(" · "); titel = "Gezichten en plaatsen"; }
      else if (S.soort === "gedenk") { /* the person or couple in the middle, by call names; the family and the years below */
        const k = startOn(S) ? S.start : data.focus && !data.focus.pair ? 1 : 2, paar = startOn(S) ? S.paar : !data.focus || !!data.focus.pair;
        const wie = (S.voor || []).length ? titel.replace(/^De voorouders van /, "") : personName(Object.assign({}, S, { start: k, paar }));
        ondertitel = [titel.startsWith("De familie") ? titel : "", ondertitel].filter(Boolean).join(" · "); titel = "Ter herinnering aan " + wie; }
      /* file name = the clean title; only characters a file name may not hold go (":" becomes " –") */
      const bestand = titel.replace(/\s*:\s*/g, " – ").replace(/[\/\\?*"<>|]+/g, " ").replace(/\s+/g, " ").trim();
      return { titel, ondertitel, jaren, oudste, kern, bestand: bestand + ".pdf" };
    }
    /* B: the choices of one book (or part) as the builders and the hooks read them */
    function options(S) {
      const dl = partsOf(S), deel = dl[Math.min(S.deelNr, dl.length) - 1];
      const mensen = members(S).filter(p => p.kw < 8 || deel.lijnen.includes(lineOf(p.kw))).map(p => p.kw);
      const keuzes = [
        S.lijn ? `Alleen de familie ${LINES[S.lijn].name}.` : deel.aantal > 1 ? `Deel ${deel.nr} van ${deel.aantal}: ${deel.naam}.` : "Alle families.",
        S.detail >= 99 ? "Elke voorouder met een volledig profiel." : `Een volledig profiel tot en met generatie ${ROMAN[S.detail]}, daarboven een kort profiel.`,
        S.hyp === "weg" ? "Voorouders die alleen op een hypothese (D) rusten, zijn weggelaten." : "Hypotheses (D) staan erin, en zijn als hypothese gemarkeerd.",
        { noten: "De bronnen staan als noten achter elke familie.", profiel: "De bronnen staan bij elk profiel.", site: "De bronnen staan op de site; het boek verwijst ernaar." }[S.bron],
        { geen: "Zonder beelden.", weinig: "Met de belangrijkste beelden.", veel: "Met veel beelden." }[S.beeld],
        "Onderdelen: " + PARTS.filter(d => S.delen.has(d[0])).map(d => d[1].toLowerCase()).join(", ") + "."];
      const C = PRESETS.compact, compact = S.detail === C.detail && S.beeld === C.beeld && S.bron === C.bron && S.hyp === C.hyp;
      if (startOn(S)) keuzes.unshift(`Het boek begint bij ${startName(S)}.`);
      if (S.soort && PRESETS[S.soort]) keuzes.unshift(`Boektype: ${PRESETS[S.soort].naam.toLowerCase()}.`);
      keuzes.push(`Omslag: ${(COVERS.find(o => o[0] === S.omslag) || COVERS[0])[1].toLowerCase()}.`);
      const tt = titles(S, deel, mensen);
      return { boom: data.tree, ...tt, soort: S.soort || "", start: { kw: S.start, paar: S.paar, aan: startOn(S), naam: startOn(S) ? startName(S) : root }, omslag: S.omslag, compact, detail: S.detail, diepte: S.detail, formaat: S.formaat, delen: new Set(S.delen), beeld: S.beeld, bron: S.bron, hyp: S.hyp, druk: !!S.afloop, afloop: S.afloop, hires: S.hires, lijn: S.lijn, deel, mensen, keuzes, S };
    }

    /* ---- the builders: one HTML string per chapter ---- */
    const story = (s, B) => {
      const para = n => { const o = noteObj(n); if (o.k === "hypothese" && B && B.hyp === "weg") return ""; return `<p${o.k ? ` class="bk-${o.k}"` : ""}>${esc(o.t)}${o.k ? ` <span class="bk-soort">${esc(o.k)}</span>` : ""}</p>`; };
      const parts = s.parts.filter(pt => !(B && B.hyp === "weg" && pt.st === "D"));
      return `<article class="bk-verhaal" data-verhaal="${esc(s.id)}" id="bk-verhaal-${esc(s.id)}" data-kop-l="${esc(s.title)}" data-kop-r="Verhaal">
    <h2 class="bk-h2">${esc(s.title)}</h2>${s.lede ? `<p class="bk-lede">${esc(s.lede)}</p>` : ""}
    ${parts.map((pt, i) => `<section class="bk-deel${i ? " bk-deel-volg" : ""}"${pt.st ? ` data-st="${pt.st}"` : ""}>${(() => { const al = pt.p.map(para).filter(Boolean).map((h, j) => !i && !j ? h.replace(/^<p(?: class="([^"]*)")?/, (m, c) => `<p class="${c ? c + " " : ""}bk-ini"`) : h);
      return `<div class="bk-deel-begin"><h3 class="bk-h3">${esc(pt.h)}${pt.st ? ` <span class="bk-st">${pt.st}</span>` : ""}</h3>${al[0] || ""}</div>${al.slice(1).join("")}`; })()}</section>`).join("")}
  </article>`;
    };
    const cropOf = im => /^\d{1,3}% \d{1,3}%$/.test(im.crop || "") ? im.crop : "50% 30%";
    function figure(im, maat, cls, B) {
      if (!im) return "";
      const hs = H("src", im, B), src = hs === null ? im.src : hs; /* hires: the original; "" = too small for print (cover and image code) */
      if (!src) return "";
      const cr = typeof im.credit === "string" ? im.credit : im.maker || "";
      return `<figure class="bk-beeld${cls ? " " + cls : ""}" data-img="${esc(im.id || "")}" data-maat="${maat}"><img src="${esc(src)}" alt=""${src !== im.src ? ` onerror="this.onerror=null;this.src='${esc(im.src)}'"` : ""}${im.crop ? ` style="object-position:${cropOf(im)}"` : ""}>${im.t || cr ? `<figcaption class="bk-bijschrift">${esc(im.t || "")}${cr ? ` <span class="bk-credit">${esc(cr)}</span>` : ""}</figcaption>` : ""}</figure>`;
    }
    const shortYears = p => { const t = lifeYears(p); return t === "jaartallen onbekend" ? "" : t; };
    const profPlaces = p => [...new Set([placeName(p.bp), placeName(p.dp)].filter(Boolean))].join(" · ");
    const sourceLabel = s => String(s[0] || "").replace(/\s*·\s*Tresoar, toegang.*$/, "").replace(/\s*\((?:graftombe|online-begraafplaatsen)\.nl[^)]*\)/, "");
    /* a short profile: name, years, place, the short sentence and the label; for whoever is above the chosen depth */
    function shortProfile(p, l, B) {
      const S = B.S, g = genOf(S, p.kw), at = `data-kw="${p.kw}" data-gen="${g}" data-gen-naam="${esc(genName(S, g))}" data-lijn="${l || ""}" id="bk-kw-${p.kw}"`;
      if (p.living) return `<article class="bk-kortprof bk-levend" ${at}><h3 class="bk-naam">${esc(p.n)}</h3></article>`;
      return `<article class="bk-kortprof" ${at} data-st="${p.st || ""}"><p class="bk-rel">${esc(rel(S, p.kw))} · kw ${p.kw}</p><h3 class="bk-naam">${esc(p.n)}</h3>
    <p class="bk-jaren">${esc(shortYears(p))} <span class="bk-st">${esc(p.st || "")}</span></p>${profPlaces(p) ? `<p class="bk-plaats">${esc(profPlaces(p))}</p>` : ""}${shortLine(p)}</article>`;
    }
    /* a full profile: of the living only the name; else portrait, life, short sentence, notes, family, evidence and (by choice) sources */
    function profile(p, l, B, first, head) { /* head: the generation heading, for the first profile; it stays with name and facts */
      const S = B.S, g = genOf(S, p.kw), gn = genName(S, g), at = `data-kw="${p.kw}" data-gen="${g}" data-gen-naam="${esc(gn)}" data-lijn="${l || ""}" id="bk-kw-${p.kw}"`;
      if (p.living) return `${head ? `<div class="bk-gen-begin">${head}` : ""}<article class="bk-prof bk-levend" ${at}><h3 class="bk-naam">${esc(p.n)}</h3></article>${head ? "</div>" : ""}`;
      const row = (t, v) => v ? `<div><dt>${t}</dt><dd>${v}</dd></div>` : "";
      const dp = (d, pl) => [fmtDate(d), placeName(pl) ? "in " + esc(placeName(pl)) : ""].filter(Boolean).join(" ");
      const port = B.beeld !== "geen" ? portrait(p.kw) : null;
      const extra = B.beeld === "veel" ? (H("beelden", B, { soort: "profiel", kw: p.kw, lijn: l }) || []).filter(im => !port || im.id !== port.id).slice(0, 1) : [];
      const notes = (p.notes || []).map(noteObj).filter(n => !(B.hyp === "weg" && n.k === "hypothese"));
      /* marriages: the fixed field (all marriages, with their own label); with more than one, the children per marriage */
      const kidName = k => esc(String(k).replace(/\s*·\s*kw\s*\d+/, ""));
      const ms = (p.marriages || []).length ? p.marriages : p.m && p.m.w ? [{ order: 1, partner: p.m.w, date: p.m.d, place: p.m.p }] : [];
      const perHuw = ms.length > 1 && ms.some(m => (m.kids || []).length), gebruikt = new Set(perHuw ? ms.flatMap(m => m.kids || []) : []);
      const huw = ms.map(m => [ms.length > 1 ? `${m.order || ""}. ` : "", [m.date ? fmtDate(m.date) : "", m.place ? "in " + esc(placeName(m.place)) : "", m.partner ? "met " + esc(m.partner) : ""].filter(Boolean).join(" "),
        m.st && m.st !== p.st ? ` <span class="bk-st">${esc(m.st)}</span>` : "", perHuw && m.kidsNote ? ` <span class="bk-kidsnote">(${esc(m.kidsNote)})</span>` : "", perHuw && (m.kids || []).length ? `; kinderen: ${m.kids.map(i => (p.kids || [])[i]).filter(Boolean).map(k => kidName(String(k).replace(/^uit (?:het |zijn |haar )?(?:eerste|tweede|derde|vierde) huwelijk[^:]*:\s*/i, ""))).join(", ")}` : ""].join("")).join("<br>");
      const kids = (p.kids || []).filter((k, i) => !gebruikt.has(i) && !/\bkinderen in totaal\b/.test(k));
      const src = (p.src || []).filter(s => s && s[0]);
      const sources = !src.length ? "" : B.bron === "profiel" ? `<ol class="bk-bronnen">${src.map(s => `<li>${esc(sourceLabel(s))}</li>`).join("")}</ol>`
        : B.bron === "noten" ? `<p class="bk-bronref"><span class="bk-lbl">Bronnen</span> ${src.length} in de <a class="bk-ref" href="#bk-noot-${p.kw}">noten</a></p>` : "";
      return `${head ? `<div class="bk-gen-begin">${head}` : ""}<article class="bk-prof" ${at} data-st="${p.st || ""}">
    ${port ? figure(port, "kwart", "bk-portret", B) : ""}
    <div class="bk-prof-kop"><header><p class="bk-rel">${esc(rel(S, p.kw))} · kw ${p.kw}</p><h3 class="bk-naam">${esc(p.n)}</h3><p class="bk-jaren">${esc(lifeYears(p))} <span class="bk-st" title="${esc(statusLong(p.st))}">${esc(p.st || "")}</span></p></header>
    ${shortLine(p)}
    <dl class="bk-feiten">${row("Geboren", dp(p.b, p.bp))}${row("Gedoopt", p.bapt ? esc(p.bapt) : "")}${row(ms.length > 1 ? "Huwelijken" : "Getrouwd", huw)}${row("Overleden", dp(p.d, p.dp))}${row("Begraven", p.bur ? esc(p.bur) : "")}${row("Beroep", p.occ ? esc(p.occ) : "")}${row("Geloof", p.rel ? esc(p.rel) : "")}</dl></div>
    ${notes.length ? `<div class="bk-noten">${notes.map((n, j) => `<p${n.k || (first && !j) ? ` class="${[n.k ? "bk-" + n.k : "", first && !j ? "bk-ini" : ""].filter(Boolean).join(" ")}"` : ""}>${esc(n.t)}${n.k ? ` <span class="bk-soort">${esc(n.k)}</span>` : ""}</p>`).join("")}</div>` : ""}
    ${extra.map(im => figure(im, "half", "bk-tijdbeeld", B)).join("")}
    ${kids.length ? `<p class="bk-gezin"><span class="bk-lbl">${perHuw ? "Andere kinderen" : "Kinderen"}</span> ${kids.map(kidName).join("; ")}</p>` : ""}
    ${(() => { const kn = [p.kidsNote, ...(perHuw ? [] : ms.map(m => m.kidsNote))].filter(Boolean); return kn.length ? `<p class="bk-gezin bk-kidsnote">${kn.map(esc).join(" ")}</p>` : ""; })()}
    ${p.stNote ? `<p class="bk-bewijs"><span class="bk-lbl">Bewijs</span> ${esc(p.stNote)}</p>` : ""}
    ${sources}
  </article>${head ? "</div>" : ""}`;
    }
    /* notes of a family: per ancestor the sources, short (a label, no long url); at the top a pointer to the site */
    function familyNotes(B, l, ps) {
      const S = B.S, met = ps.filter(p => !p.living && genOf(S, p.kw) <= B.detail && (p.src || []).some(s => s && s[0])); /* only the full profiles */
      if (B.bron === "site") return `<p class="bk-siteref">Bij elke voorouder staan de bronnen op de site, met de links naar de akten en scans: <span class="bk-url">${esc(siteUrl("lijn-" + l))}</span></p>`;
      if (B.bron !== "noten" || !met.length) return "";
      return `<section class="bk-eindnoten" data-lijn="${l}" data-kop-l="${esc(LINES[l].name)}" data-kop-r="Bronnen"><h2 class="bk-h2">Bronnen bij de familie ${esc(LINES[l].name)}</h2>
    <p class="bk-uitleg">Per voorouder de bronnen waarop het profiel rust. De links naar de akten en scans staan op de site: <span class="bk-url">${esc(siteUrl("lijn-" + l))}</span></p>
    <div class="bk-noten-kol">${met.map(p => `<div class="bk-noot" id="bk-noot-${p.kw}"><h4><a class="bk-ref" href="#bk-kw-${p.kw}">${esc(p.n)}</a> <span class="bk-kw">kw ${p.kw}</span></h4><ol>${p.src.filter(s => s && s[0]).map(s => `<li>${esc(sourceLabel(s))}</li>`).join("")}</ol></div>`).join("")}</div>
  </section>`;
    }
    /* the farthest ancestor of a family: the oldest with a proven chain (A or B), else the oldest there is */
    function farthest(ps) {
      const jaar = p => year(p.b) || (year(p.d) ? year(p.d) - 40 : null) || 9999;
      const cand = ps.filter(p => !p.living && jaar(p) < 9999), ab = cand.filter(p => chain(p.kw) <= 1);
      return (ab.length ? ab : cand).sort((a, b) => jaar(a) - jaar(b) || gen(b.kw) - gen(a.kw))[0] || null;
    }
    function farthestPage(B, l, p) {
      if (!p) return "";
      const own = H("verste", B, l, p); if (own) return own;
      const S = B.S, j = year(p.b) || year(p.d);
      return `<section class="bk-verste" data-lijn="${l}" data-kw="${p.kw}" data-kop-l="${esc(LINES[l].name)}" data-kop-r="De verste voorouder">
    <p class="bk-eyebrow">De verste voorouder · familie ${esc(LINES[l].name)}</p>
    <p class="bk-verste-jaar">${j ? (isApprox(p.b) ? "ca. " : "") + j : ""}</p>
    <h2 class="bk-h1">${esc(p.n)}</h2><p class="bk-sub">${esc(rel(S, p.kw))} · generatie ${ROMAN[genOf(S, p.kw)]} · ${esc(lifeYears(p))}</p>
    ${shortLine(p)}${p.stNote ? `<p class="bk-bewijs">${esc(p.stNote)}</p>` : ""}
    <p class="bk-uitleg">Verder terug gaat deze lijn nog niet met bewijs. <a class="bk-ref" href="#bk-kw-${p.kw}">Het profiel</a> staat bij generatie ${ROMAN[genOf(S, p.kw)]}.</p>
  </section>`;
    }
    /* a family: opening, stem line, story, the farthest ancestor, and the ancestors young to old per generation */
    function family(B, l) {
      const S = B.S, L = LINES[l]; if (!L) return "";
      const life = B.delen.has("leven") && S.soort === "gedenk" ? { kws: new Set(subjects(S).map(p => p.kw)), sts: new Set(lifeStories(S)) } : null; /* already in "Hun leven" */
      const ps = members(S).filter(p => lineOf(p.kw) === l && !(life && life.kws.has(p.kw))).sort((a, b) => gen(a.kw) - gen(b.kw) || a.kw - b.kw);
      const stem = (L.stem || []).map(person).filter(Boolean);
      const sts = STORIES.filter(s => s.line === l && !(life && life.sts.has(s)));
      const open = H("opening", B, l) || `<div class="bk-open" data-lijn="${l}"><p class="bk-eyebrow">Familie · lijn ${l}</p><h1 class="bk-h1">${esc(L.name)}</h1>${L.sub ? `<p class="bk-sub">met ${esc(L.sub)}</p>` : ""}${L.region ? `<p class="bk-regio">${esc(L.region)}</p>` : ""}</div>`;
      if (S.soort === "foto") { /* the photo book is about the pictures: the opening, one line about the family, then its faces and places;
           what has to be said about a person is in the caption (Products.bookPhoto) */
        const line = (String(L.intro || "").match(/^[^.!?]*[.!?]/) || [""])[0];
        return `<section class="bk-hfst bk-fam bk-fam-foto" data-bk="familie" data-lijn="${l}" style="--lc:var(--l${l})" id="bk-lijn-${l}" data-kop-l="${esc(L.name)}">
    ${open}${line ? `<p class="bk-lede">${esc(line)}</p>` : ""}${H("fotos", B, l) || ""}
  </section>`;
      }
      const gens = [...new Set(ps.map(p => genOf(S, p.kw)))];
      const ghead = g => `Generatie ${ROMAN[g]} · ${esc(genName(S, g))}`;
      return `<section class="bk-hfst bk-fam" data-bk="familie" data-lijn="${l}" style="--lc:var(--l${l})" id="bk-lijn-${l}" data-kop-l="${esc(L.name)}">
    ${open}
    <div class="bk-intro" data-kop-l="${esc(L.name)}" data-kop-r="Familie"><p class="bk-lede">${esc(L.intro || "")}</p>${H("naam", B, l) || ""}
      ${stem.length ? `<div class="bk-stamlijn"><h2 class="bk-h2">Stamlijn, van jong naar oud</h2><ol>${stem.map(p => `<li><a class="bk-ref" href="#bk-kw-${p.kw}"><span class="bk-g">${ROMAN[genOf(S, p.kw)]}</span> ${esc(p.n)}</a> <span class="bk-jaren">${esc(lifeYears(p))}</span></li>`).join("")}</ol></div>` : ""}</div>
    ${S.soort === "foto" ? H("fotos", B, l) || "" : ""}
    ${sts.map(s => story(s, B)).join("")}
    ${gens.map(g => { const kort = g > B.detail, gp = ps.filter(p => genOf(S, p.kw) === g);
      return `<div class="bk-gen${kort ? " bk-gen-kort" : ""}" data-gen="${g}" data-kop-l="${esc(L.name)}" data-kop-r="${ghead(g)}">${(() => { /* the heading stays with the start of the generation */
        const head = `<div class="bk-genkop"><p class="bk-eyebrow">${esc(L.name)}</p><h2 class="bk-h2">Generatie ${ROMAN[g]}</h2><p class="bk-gen-naam">${esc(genName(S, g))} · ${gp.length} ${gp.length === 1 ? "voorouder" : "voorouders"}</p></div>`;
        if (kort) { const k = gp.map(p => shortProfile(p, l, B)); return `<div class="bk-gen-begin">${head}${k.slice(0, 2).join("")}</div>${k.slice(2).join("")}`; }
        const e = gp.findIndex(q => !q.living); return gp.map((p, j) => profile(p, l, B, j === e, j ? "" : head)).join(""); })()}</div>`; }).join("")}
    ${B.delen.has("verst") ? farthestPage(B, l, farthest(ps)) : ""}
    ${familyNotes(B, l, ps)}
  </section>`;
    }
    /* the memorial book: the life in the middle. Per person the full profile, where they lived (res), what stands out (facts), their
       images (prayer cards, notices, graves); then the stories they are in. Children as the sources name them (living: the name). */
    function lifeChapter(B) {
      const S = B.S, subj = subjects(S); if (!subj.length) return "";
      const who = subj.map(callFull).join(" en "), facts = data.facts || [];
      const per = p => {
        const res = (p.res || []).filter(r => r && r.p).slice().sort((a, b) => (a.y || 0) - (b.y || 0));
        const fs = facts.filter(f => f.kw === p.kw && f.kind === "fact" && (f.st === "A" || f.st === "B" || (f.st === "C" && B.hyp !== "weg")));
        const port = portrait(p.kw), ims = B.beeld === "geen" ? [] : (H("beelden", B, { soort: "persoon", kw: p.kw }) || []).filter(im => !port || im.id !== port.id).slice(0, B.beeld === "veel" ? 4 : 2);
        return `<div class="bk-leven-pers" data-kw="${p.kw}">
      ${profile(p, lineOf(p.kw) || "", B, true, "").replace(/<p class="bk-rel">[^<]*<\/p>/, `<p class="bk-rel">kw ${p.kw}</p>`) /* the relation ("aan het begin van dit boek") says nothing here */}
      ${res.length > 1 ? `<h3 class="bk-h3">Waar ${esc(firstName(p))} woonde</h3><dl class="bk-tijdlijst">${res.map(r => `<div><dt>${r.y || ""}</dt><dd><b>${esc(placeName(r.p))}</b>${r.t ? " " + esc(r.t) : ""}</dd></div>`).join("")}</dl>` : ""}
      ${fs.length ? `<h3 class="bk-h3">Wat opvalt</h3>${fs.map(f => `<p><b>${esc(f.title || "")}</b>${f.year ? ` <span class="bk-jaar">${esc(f.year)}</span>` : ""} ${esc(f.text)} <span class="bk-st">${esc(f.st)}</span></p>`).join("")}` : ""}
      ${ims.map(im => figure(im, "half", "bk-tijdbeeld", B)).join("")}
    </div>`; };
      const sts = lifeStories(S);
      return `<section class="bk-hfst bk-leven" data-bk="leven" id="bk-leven" data-kop-l="${esc(who)}" data-kop-r="Hun leven">
    <div class="bk-open bk-leven-open"><p class="bk-eyebrow">Ter herinnering aan</p><h1 class="bk-h1">${esc(who)}</h1><p class="bk-sub">${subj.map(p => esc(shortYears(p))).filter(Boolean).join(" · ")}</p></div>
    ${subj.map(per).join("")}
    ${sts.length ? `<h2 class="bk-h2">Verhalen waarin ${subj.length > 1 ? "ze voorkomen" : esc(firstName(subj[0])) + " voorkomt"}</h2>${sts.map(s => story(s, B)).join("")}` : ""}
  </section>`;
    }
    /* separate chapters after the families */
    function otherStories(B) {
      const sts = STORIES.filter(s => !s.line); if (!sts.length) return "";
      return `<section class="bk-hfst" data-bk="verhalen" id="bk-verhalen" data-kop-l="Verhalen" data-kop-r="Verhalen"><h1 class="bk-h1">Verhalen</h1><p class="bk-lede">Verhalen die over meer families gaan.</p>${sts.map(s => story(s, B)).join("")}</section>`;
    }
    function history(B) {
      let ht = data.historyTouch || [], ctx = (data.context || []).slice().sort((a, b) => a.y - b.y), lede = "De grote geschiedenis om de families heen.";
      const subj = B.S.soort === "gedenk" ? subjects(B.S) : [];
      if (subj.length) { /* a memorial book: the years from the first birth to the last death of the people in the middle */
        const ys = subj.flatMap(p => [year(p.b), year(p.d)]).filter(Boolean), y0 = Math.min(...ys), y1 = Math.max(...ys);
        if (ys.length && y0 < y1) { const inn = (a, b) => (b || a) >= y0 && a <= y1; ctx = ctx.filter(c => inn(c.y, c.y2)); ht = ht.filter(h => inn(parseInt(h.y, 10)));
          lede = `Wat er gebeurde tussen ${y0} en ${y1}, de jaren van ${subj.map(callFull).join(" en ")}.`; } }
      return `<section class="bk-hfst" data-bk="tijd" id="bk-tijd" data-kop-l="Hun tijd" data-kop-r="Hun tijd"><h1 class="bk-h1">Hun tijd</h1><p class="bk-lede">${esc(lede)}</p>
    ${ht.length ? `<h2 class="bk-h2">Geraakt door de grote geschiedenis</h2><dl class="bk-tijdlijst">${ht.map(h => { const p = person(h.kw); return `<div><dt>${esc(h.y)}</dt><dd><b>${esc(h.t)}</b> ${esc(h.d)}${p && !p.living ? ` <a class="bk-ref" href="#bk-kw-${p.kw}">${esc(p.n)}</a>` : ""}</dd></div>`; }).join("")}</dl>` : ""}
    <h2 class="bk-h2">Wat er gebeurde</h2><dl class="bk-tijdlijst">${ctx.map(c => `<div><dt>${c.y}${c.y2 ? "–" + c.y2 : ""}</dt><dd><b>${esc(c.t)}</b> ${esc(c.d)}</dd></div>`).join("")}</dl>
  </section>`;
    }
    function pedigree(B) {
      const S = B.S, ps = members(S).filter(p => p.kw < 8 || B.deel.lijnen.includes(lineOf(p.kw))), gens = [...new Set(ps.map(p => genOf(S, p.kw)))];
      return `<section class="bk-hfst" data-bk="kwartierstaat" id="bk-kwartierstaat" data-kop-l="Kwartierstaat" data-kop-r="Kwartierstaat"><h1 class="bk-h1">Kwartierstaat</h1>
    <p class="bk-lede">Alle voorouders genummerd. De vader van nummer n heeft nummer 2n, de moeder 2n + 1. Achter elke naam het bewijs: A in een akte, B sterk onderbouwd, C uit een online stamboom, D een hypothese.</p>
    ${gens.map(g => `<h2 class="bk-h2">Generatie ${ROMAN[g]} <span class="bk-gen-naam">${esc(genName(S, g))}</span></h2><ol class="bk-kwlijst">${ps.filter(p => genOf(S, p.kw) === g).map(p => `<li value="${p.kw}"><a class="bk-ref" href="#bk-kw-${p.kw}">${esc(p.n)}</a>${p.living ? "" : ` <span class="bk-jaren">${esc(shortYears(p))}</span> <span class="bk-st">${esc(p.st || "")}</span>`}</li>`).join("")}</ol>`).join("")}
  </section>`;
    }
    function openQuestions(B) {
      const cf = data.conflicts || [], oq = (data.openQuestions || []).slice().sort((a, b) => a.pri - b.pri);
      return `<section class="bk-hfst" data-bk="open" id="bk-open" data-kop-l="Open vragen" data-kop-r="Open vragen"><h1 class="bk-h1">Wat nog open is</h1>
    <p class="bk-lede">Waar bronnen elkaar tegenspreken, en wat nog uitgezocht moet worden. Weet je meer? Vertel het Harrie of Alies, of kijk op <span class="bk-url">${esc(siteUrl("zoeken"))}</span>.</p>
    ${cf.length ? `<h2 class="bk-h2">Tegenstrijdigheden</h2><dl class="bk-tegen">${cf.map(c => { const p = person(c.kw); return `<div><dt>${esc(c.topic)}${p && !p.living ? ` <a class="bk-ref" href="#bk-kw-${p.kw}">kw ${p.kw}</a>` : ""}</dt><dd>${esc(c.now)}</dd></div>`; }).join("")}</dl>` : ""}
    ${oq.length ? `<h2 class="bk-h2">Open vragen</h2><ol class="bk-vragen">${oq.map(o => `<li>${esc(o.q)}${o.where ? ` <span class="bk-waar">${esc(o.where)}</span>` : ""}</li>`).join("")}</ol>` : ""}
  </section>`;
    }
    function sourcesChapter(B) {
      const ar = data.archives || [], sg = data.sourceGroups || [];
      return `<section class="bk-hfst" data-bk="bronnen" id="bk-bronnen" data-kop-l="Bronnen" data-kop-r="Bronnen"><h1 class="bk-h1">Bronnen</h1>
    <p class="bk-lede">Elk gegeven in dit boek komt uit een bron, met een label voor de sterkte van het bewijs. Alle links naar akten en scans staan op de site: <span class="bk-url">${esc(data.site || "")}</span></p>
    <h2 class="bk-h2">Archieven</h2><dl class="bk-tijdlijst">${[...new Map(ar.map(a => [a.n, a])).values()].map(a => `<div><dt>${esc(a.n)}</dt><dd>${esc(a.d)} <span class="bk-url">${esc(siteHost(a.u))}</span></dd></div>`).join("")}</dl>
    ${sg.length ? `<h2 class="bk-h2">Genealogieën en naslag</h2>${sg.map(g => `<h3 class="bk-h3">${esc(g[0])}</h3><ul class="bk-bronlijst">${g[1].map(s => `<li>${esc(s[0])}</li>`).join("")}</ul>`).join("")}` : ""}
  </section>`;
    }
    /* the whole book as an HTML body, in the order of boek_markup.md */
    /* opts.parts: the book as a list of chapters (complete HTML strings); opts.lazy: as functions that each build one chapter,
       so a browser can build and add them one by one without one long task */
    function build(B, opts) {
      const fams = B.deel.lijnen, first = B.deel.nr === 1, last = B.deel.nr === B.deel.aantal;
      /* the standard pdf is the whole book (front cover first, back cover last); for the printer only the inner pages, the cover is a separate sheet */
      const steps = [
        () => B.druk ? "" : H("omslag", B) || "",
        () => H("voorwerk", B) || `<section class="bk-hfst bk-titel" data-bk="titel"><h1 class="bk-h1">${esc(B.titel)}</h1><p class="bk-sub">${esc(data.brand || "")}</p><p class="bk-versie">${esc(data.version || "")}</p><ul class="bk-keuzes-tekst">${B.keuzes.map(k => `<li>${esc(k)}</li>`).join("")}</ul></section>`,
        () => H("inhoud", B) || "",
        () => B.delen.has("leven") && B.S.soort === "gedenk" && first ? lifeChapter(B) : "",
        () => B.lijn || !first ? "" : H("waaier", B) || "",
        () => B.delen.has("kaart") && first ? H("kaart", B) || "" : "",
        () => B.delen.has("kruis") && first ? H("kruis", B) || "" : "", /* only the joint tree and the whole book (the hook gives "" otherwise) */
        () => B.delen.has("tijdlijn") && first ? H("tijdlijn", B) || "" : "",
        ...(B.delen.has("fam") ? fams.map(l => () => family(B, l)) : []),
        () => B.delen.has("verh") && !B.lijn && last ? otherStories(B) : "",
        () => B.delen.has("tijd") && last ? history(B) : "",
        () => B.delen.has("kw") ? pedigree(B) : "",
        () => B.delen.has("open") && last ? openQuestions(B) : "",
        () => B.delen.has("bron") && last ? sourcesChapter(B) : "",
        () => H("nawerk", B) || "",
        () => B.druk ? "" : H("achterkant", B) || ""
      ];
      if (opts && opts.lazy) return steps.map(f => () => { const h = f(); return h ? finish(B, h) : ""; });
      if (opts && opts.parts) return steps.map(f => f()).filter(Boolean).map(h => finish(B, h));
      return finish(B, steps.map(f => f()).join("\n"));
    }
    function finish(B, html) {
      /* compact: the smaller chapters get bk-los and start on the next page instead of on the right */
      const loose = B.compact ? html.replace(/<section class="bk-hfst((?: [\w-]+)*)"(?=[^>]*data-bk="(?:tijd|kwartierstaat|open|bronnen|register)")/g, '<section class="bk-hfst$1 bk-los"') : html;
      /* not for a printer: no deliberately blank pages; every chapter, opening and spread starts on the next page (class bk-scherm) */
      const plain = B.druk ? loose : loose.replace(/class="((?:[^"]*\s)?(?:bk-hfst|bk-fam|bk-getallen|bk-inhoud|bk-inleiding|bk-register|bk-slot|bk-titelblad|bk-waaier|bkb-kaart)(?=[\s"])[^"]*)"/g, 'class="$1 bk-scherm"');
      const z = H("zetwerk", plain); return z === null ? plain : z; /* typographic quotes */
    }
    /* an estimate of the number of pages per part (A4) before the layout; afterwards Paged.js counts the real number. k = the
       calibration factor from the last real count in this tree. */
    const textLen = p => [p.stNote, p.bapt, ...(p.notes || []).map(n => noteObj(n).t), ...(p.kids || [])].join(" ").length + 300;
    const photoCache = new Map(); /* the photo book: the number of pictures of these families (Products.bookPhoto), once per choice */
    const photoItems = (S, fams) => { const key = format(S) + "|" + fams.join("."); if (!photoCache.has(key)) photoCache.set(key, (P.bookPhoto(data, S).families || []).filter(f => fams.includes(f.line)).reduce((n, f) => n + f.items.length, 0)); return photoCache.get(key); };
    function estimate(S, deel, k = 1) {
      const dl = partsOf(S), D = deel || dl[Math.min(S.deelNr, dl.length) - 1], first = D.nr === 1, last = D.nr === D.aantal;
      const ps = members(S), fams = D.lijnen;
      const tekst = s => s.parts.reduce((n, pt) => n + pt.h.length + pt.p.reduce((m, q) => m + noteObj(q).t.length, 0), (s.lede || "").length);
      const inFam = ps.filter(p => fams.includes(lineOf(p.kw)));
      const vol = inFam.filter(p => genOf(S, p.kw) <= S.detail), kort = inFam.filter(p => genOf(S, p.kw) > S.detail);
      const bronn = vol.reduce((n, p) => n + (p.src || []).length, 0);
      const gensN = fams.reduce((n, l) => n + new Set(inFam.filter(p => lineOf(p.kw) === l && genOf(S, p.kw) <= S.detail).map(p => genOf(S, p.kw))).size, 0);
      const fmtF = { a4: 1, foto: 1.08, vierkant: .78, trade: 1.25 }[S.formaat] || 1;
      const r = {
        fam: S.soort === "foto" && P.bookPhoto ? (n => fams.length * 1.5 + n / 2.4)(photoItems(S, fams)) : fams.length * 3 + gensN * .5 + vol.reduce((n, p) => n + (p.living ? .06 : .12 + textLen(p) / 2600 + (S.beeld !== "geen" && portrait(p.kw) ? .12 : 0) + (S.beeld === "veel" ? .3 : 0)), 0) + kort.length / 8
          + fams.reduce((n, l) => n + STORIES.filter(s => s.line === l).reduce((m, s) => m + tekst(s) / 3600 + .5, 0), 0) + (S.bron === "noten" ? bronn / 40 + fams.length * .5 : S.bron === "profiel" ? bronn / 60 : 0),
        verst: fams.length, verh: S.lijn || !last ? 0 : STORIES.filter(s => !s.line).reduce((m, s) => m + tekst(s) / 3600 + .5, 1),
        tijd: last ? 1 + ((data.historyTouch || []).length + (data.context || []).length) / 9 : 0, kw: 1 + (inFam.length + 6) / 42,
        open: last ? 1 + (data.conflicts || []).length / 11 + (data.openQuestions || []).length / 16 : 0, bron: last ? 1 + (data.archives || []).length / 18 + (data.sourceGroups || []).reduce((n, g) => n + g[1].length, 0) / 35 : 0,
        leven: first && S.soort === "gedenk" ? subjects(S).length * 3 + lifeStories(S).reduce((m, s) => m + tekst(s) / 3600 + .5, 0) : 0,
        getal: last && !S.lijn && !startOn(S) ? 2 : 0, begr: last ? 3 : 0, kaart: first ? 2 : 0, kruis: first && data.tree === "s" && !S.lijn && !startOn(S) ? 3 : 0, tijdlijn: first ? 2 : 0 }; /* In getallen counts the whole tree: only in the book of the whole tree */
      const fixed = 6 + (first && !S.lijn ? 4 : 0); /* cover, title, colophon, contents, index; in part 1 also the introduction and the fan */
      Object.keys(r).forEach(x => r[x] = r[x] ? Math.max(1, Math.round(r[x] * fmtF)) : 0);
      const total = fixed + Math.round(PARTS.filter(d => S.delen.has(d[0])).reduce((n, d) => n + r[d[0]], 0));
      const kk = Math.min(2.5, Math.max(.6, k || 1));
      Object.keys(r).forEach(x => r[x] = r[x] ? Math.max(1, Math.round(r[x] * kk)) : 0);
      return { delen: r, totaal: Math.ceil(total * kk / 2) * 2, ruw: total };
    }
    return { parse, format, empty, partsOf, members, startOn, roots, startLines, base, genOf, genName, rel, startName, chain, titles, options, build, estimate, fanKw, person,
      family, profile, shortProfile, story, figure, siteUrl, sourceLabel, shortYears, subjects, lifeChapter };
  }
  /* apply a preset (or book type) to choices S */
  const applyPreset = (S, k) => { const Q = PRESETS[k]; if (!Q) return S; Object.assign(S, { detail: Q.detail, beeld: Q.beeld, bron: Q.bron, hyp: Q.hyp, delen: new Set(Q.delen), soort: Q.soort ? k : "" }); if (Q.formaat) S.formaat = Q.formaat; return S; };
  P.book = { forTree, applyPreset, PARTS, FORMATS, BLEEDS, IMAGES, SOURCES, HYPOTHESES, PRESETS, SPLITS, MAX_PAGES, COVERS, empty };
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
