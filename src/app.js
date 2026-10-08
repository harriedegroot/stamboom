/* Twee kwartierstaten op één site: die van Harrie (data/0*–3*) en die van Alies (data/40-alies-*.js, object ALIES).
   De boom van Harrie wordt hier vastgelegd; binnen de app wisselt setTree() alle boomgebonden data (zie "model"). */
const TREE_H = { PEOPLE, LINES, STORIES, FACTS, OPEN_QUESTIONS, CONFLICTS, NOTABLES, SOURCE_GROUPS, CHANGES, MEDIA, MONEY, HISTORY_TOUCH };
(() => {
"use strict";
const NS = "http://www.w3.org/2000/svg";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const enc = encodeURIComponent;
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ROMAN = Array.from({ length: 64 }, (_, n) => [[50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]].reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, "")); /* "", I … LXIII: generatie 64 is kw ≥ 2^63, ruim genoeg */
const LINE_KEYS = [8, 9, 10, 11, 12, 13, 14, 15];
const MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

/* ---------- model ---------- */
/* Boomgebonden data. kw-nummers gelden binnen één boom: kw 12 van Alies is iemand anders dan kw 12 van Harrie.
   Daarom wisselt loadTree() deze namen in één keer; beelden en archief-packs van personen in Alies' boom
   gebruiken de sleutel "a-<kw>" (T.prefix + kw). */
let PEOPLE, LINES, STORIES, FACTS, OPEN_QUESTIONS, CONFLICTS, NOTABLES, SOURCE_GROUPS, CHANGES, MEDIA, MONEY;
const TREES = { h: Object.assign({ key: "h", prefix: "", root: "Harrie", rootFull: "Harrie de Groot", rootMale: true, brand: "De Groot · Boersma", parents: "Kees en Vronie", sibs: ["Anneke", "Andre"], kids: ["Marit", "Tijmen", "Jorn"], TXT: {} }, TREE_H) };
if (typeof ALIES !== "undefined") TREES.a = Object.assign({ key: "a", prefix: "a-", rootMale: false, STORIES: [], FACTS: [], OPEN_QUESTIONS: [], CONFLICTS: [], NOTABLES: [], SOURCE_GROUPS: [], MEDIA: [], MONEY: [], CHANGES: { v: "", newKws: [], updKws: [], removed: [] }, TXT: {} }, ALIES);
/* De samengestelde boom (prefix "s-"): kw 1 = hun kinderen Marit, Tijmen en Jorn samen, Harrie = kw 2, Alies = kw 3.
   Wordt bij het laden opgebouwd uit de twee bomen: kw n van Harrie wordt n + 2^floor(log2 n), kw n van Alies
   n + 2^(floor(log2 n)+1). Ook "kw N" in teksten wordt omgenummerd. Elk persoon houdt side ("h"/"a") en origKw. */
function joinTrees(h, a) {
  const up = (n, s) => n + 2 ** (Math.floor(Math.log2(n)) + s);
  const reKw = /\bkw\.?\s?(\d+)((?:\s*[\/–-]\s*\d+)*)/g;
  const deep = (v, s) => typeof v === "string" ? v.replace(reKw, (m, n, rest) => "kw " + up(+n, s) + rest.replace(/\d+/g, d => up(+d, s)))
    : Array.isArray(v) ? v.map(x => deep(x, s)) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x, s)])) : v;
  const fix = (x, o, s) => {
    if (typeof o.kw === "number") x.kw = up(o.kw, s);
    if (typeof o.alias === "number") x.alias = up(o.alias, s);
    if (Array.isArray(o.kws)) x.kws = o.kws.map(k => up(+k, s));
    if (Array.isArray(o.people)) x.people = o.people.map(k => up(k, s));
    if (Array.isArray(o.path)) x.path = o.path.map(st => typeof st[1] === "number" ? [st[0], up(st[1], s)] : st); /* bekende verwanten: [tekst, kw] */
    if (typeof o.line === "number") x.line = 8 + 4 * s + ((o.line - 8) >> 1);
    return x;
  };
  const sides = [[h, 0], [a, 1]];
  const cat = f => sides.flatMap(([t, s]) => (t[f] || []).filter(o => o.samen !== false).map(o => fix(deep(o, s), o, s))); /* samen:false = staat in beide bomen, maar hoort in de samengestelde boom maar één keer */
  const kids = (h.kids || []).join(", ").replace(/, ([^,]*)$/, " en $1") || "Harrie en Alies";
  const PEOPLE = [{ kw: 1, n: kids, roep: kids, living: true }];
  sides.forEach(([t, s]) => t.PEOPLE.forEach(o => PEOPLE.push(Object.assign(fix(deep(o, s), o, s), { side: t.key, origKw: o.kw }))));
  const LINES = {};
  sides.forEach(([t, s]) => [4, 5, 6, 7].forEach(g => {
    const l1 = t.LINES[2 * g], l2 = t.LINES[2 * g + 1], gp = t.PEOPLE.find(p => p.kw === g) || { n: "" };
    LINES[up(g, s)] = deep({ name: l1.name + " · " + l2.name, sub: [l1.sub, l2.sub].filter(Boolean).join(" · "),
      region: [...new Set([l1.region, l2.region].filter(Boolean))].join(" · "),
      intro: `De kant van ${gp.n}, ${g % 2 ? "grootmoeder" : "grootvader"} van ${t.root}: twee families, ${l1.name} en ${l2.name}. ${l1.intro || ""} ${l2.intro || ""}`.trim(),
      stem: [g, ...(l1.stem || [])] }, s);
    LINES[up(g, s)].stem = [g, ...(l1.stem || [])].map(k => up(k, s));
  }));
  const ch = f => sides.flatMap(([t, s]) => ((t.CHANGES || {})[f] || []).map(k => up(k, s)));
  return { key: "s", prefix: "s-", root: kids, rootFull: kids.replace(" & ", " en "), rootLines: h.kids, rootMale: null, brand: "De Groot · Hoekstra",
    parents: "", sibs: [], TXT: a.SAMEN_TXT || {}, PEOPLE, LINES,
    STORIES: sides.flatMap(([t, s]) => (t.STORIES || []).map(o => Object.assign(fix(deep(o, s), o, s), { side: t.key }))), FACTS: cat("FACTS"), OPEN_QUESTIONS: cat("OPEN_QUESTIONS"), CONFLICTS: cat("CONFLICTS"), NOTABLES: cat("NOTABLES"),
    MEDIA: cat("MEDIA"), MONEY: cat("MONEY"), HISTORY_TOUCH: cat("HISTORY_TOUCH"), SOURCE_GROUPS: [...(h.SOURCE_GROUPS || []), ...(a.SOURCE_GROUPS || [])],
    CHANGES: { v: (h.CHANGES || {}).v || "", newKws: ch("newKws"), updKws: ch("updKws"), removed: [] } };
}
if (TREES.a) TREES.s = joinTrees(TREES.h, TREES.a);
let T = TREES.h, RAW, BY, ALIAS_OF, ALIASES, all, ancestors;
const LIVING_KEEP = new Set(["kw", "n", "roep", "living", "alias", "side", "origKw", "kids"]);
function loadTree(k) {
  T = TREES[k] || TREES.h;
  ({ PEOPLE, LINES, STORIES, FACTS, OPEN_QUESTIONS, CONFLICTS, NOTABLES, SOURCE_GROUPS, CHANGES, MEDIA, MONEY } = T);
  /* levenden: alleen de naam. Wat er verder in de data staat, komt nergens in de site terecht. */
  const sober = p => p.living ? Object.fromEntries(Object.entries(p).filter(([k]) => LIVING_KEEP.has(k))) : p;
  RAW = new Map(PEOPLE.filter(p => !p.alias).map(p => [p.kw, sober(p)]));
  ALIAS_OF = {}; ALIASES = {};
  PEOPLE.filter(p => p.alias).forEach(a => { ALIAS_OF[a.kw] = a.alias; (ALIASES[a.alias] = ALIASES[a.alias] || []).push(a.kw); });
  BY = new Map(RAW);
  Object.keys(ALIAS_OF).forEach(k => { const t = RAW.get(ALIAS_OF[k]); if (t) BY.set(+k, Object.assign({}, t, { kw: +k, aliasOf: t.kw })); });
  all = [...RAW.values()].sort((a, b) => a.kw - b.kw);
  ancestors = all.filter(p => !p.living);
  GEN_NAME.splice(1, Infinity, T.root, ...GEN_BASE.slice(2));
}
const person = kw => BY.get(kw) || null;
const twinKws = kw => { const t = ALIAS_OF[kw] || kw; return [t, ...(ALIASES[t] || [])].filter(k => k !== kw); }; /* alle andere nummers van dezelfde persoon */
const implexStory = side => "verhaal-" + ((side || T.key) === "a" ? "dubbel" : "lijnen"); /* het verhaal over kwartierverlies in deze boom */
const halfOf = kw => kw >> (gen(kw) - (T.key === "s" ? 3 : 2)); /* vader- of moederkant van de hoofdpersoon (bij de kinderen: een van de vier grootouders) */
const gen = kw => Math.floor(Math.log2(kw)) + 1;
const lineOf = kw => kw < 4 ? null : kw < 8 ? ({ 4: 8, 5: 10, 6: 12, 7: 14 })[kw] : kw >> (gen(kw) - 4);
const lineColor = kw => { const l = lineOf(kw); return l ? `var(--l${l})` : "var(--faint)"; };
const isMale = kw => kw === 1 ? T.rootMale : kw % 2 === 0;
/* "zijn" of "haar" voor één persoon; kw 1 in de samengestelde boom (de kinderen) is "hun" */
const zijnHaar = (kw, hoofd) => { const w = kw === 1 && T.rootMale == null ? "hun" : isMale(kw) ? "zijn" : "haar"; return hoofd ? w[0].toUpperCase() + w.slice(1) : w; };
/* klein teken man of vrouw, alleen uit het kw (even = man); voor lijsten met losse voornamen. kw 1 is een groep: geen teken */
const SEX_PATH = { m: '<circle cx="10" cy="14" r="5.5"/><path d="M14 10l6-6M15 4h5v5"/>', v: '<circle cx="12" cy="9" r="5.5"/><path d="M12 14.5V21M9 18h6"/>' };
const sexIco = kw => { if (!(kw > 1)) return ""; const m = kw % 2 === 0, w = m ? "man" : "vrouw";
  return `<svg class="sexico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${w}"><title>${w}</title>${SEX_PATH[m ? "m" : "v"]}</svg>`; };
function relTerm(kw) {
  if (T.key === "s") { /* samengesteld: de kinderen van Harrie (kw 2) en Alies (kw 3) zijn kw 1 */
    if (kw === 1) return "de kinderen van Harrie en Alies";
    const side = TREES[kw >> (gen(kw) - 2) === 2 ? "h" : "a"];
    return relBase(gen(kw) - 1, kw) + (gen(kw) > 2 ? " · kant van " + side.root : "");
  }
  return relBase(gen(kw) - 1, kw);
}
function relBase(s, kw) {
  if (s === 0) return T.root + " zelf";
  const pre = genPre(s);
  if (pre === undefined) return isMale(kw) ? "voorvader" : "voormoeder";
  return pre + (isMale(kw) ? "vader" : "moeder");
}
/* De Nederlandse reeks: per vier generaties een voorvoegsel (–, oud, stam, stamoud, edel, edeloud, edelstam, edelstamoud),
   daarbinnen –, groot, overgroot, betovergroot. s = aantal stappen terug (1 = ouder); s = 32 is de edelstamoudbetovergrootouder,
   daarna "voorouder" (zie nl.wikipedia, Lijst van benamingen voor generaties). */
function genPre(s) {
  if (s < 1 || s > 32) return undefined;
  return ["", "oud", "stam", "stamoud", "edel", "edeloud", "edelstam", "edelstamoud"][(s - 1) >> 2] + ["", "groot", "overgroot", "betovergroot"][(s - 1) & 3];
}
const GEN_NAME = ["", "Harrie", ...Array.from({ length: ROMAN.length - 2 }, (_, i) => genPre(i + 1) === undefined ? "voorouders" : genPre(i + 1) + "ouders")];
const GEN_BASE = GEN_NAME.slice();
loadTree("h");
const yr = s => { if (!s) return null; const m = String(s).match(/(\d{4})/); return m ? +m[1] : null; };
const isApprox = s => /ca\.|~|\bof\b/.test(String(s || ""));
function fmt(s) {
  if (!s) return "";
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/), ym = String(s).match(/^(\d{4})-(\d{2})$/);
  return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : ym ? `${MONTHS[+ym[2] - 1]} ${ym[1]}` : String(s);
}
const placeName = k => !k ? "" : (PLACES[k] ? (PLACES[k].name || k) : (OFFMAP[k] || k));
const mapKey = k => PLACES[k] && PLACES[k].seat ? PLACES[k].seat : k;
const slug = k => "plaats-" + norm(k).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const SLUG = {}; Object.keys(PLACES).forEach(k => { if (!PLACES[k].seat) SLUG[slug(k)] = k; });
function splitName(n) {
  const w = String(n).replace(/\(.*?\)/g, "").trim().split(/\s+/);
  if (w.length === 1) return { given: w, sur: "" };
  let i = w.indexOf("Terwisscha");
  if (i < 0) i = w.findIndex((x, k) => k > 0 && /^(de|ten|van|der|den)$/.test(x));
  if (i < 0) i = w.length - 1;
  return { given: w.slice(0, i), sur: w.slice(i).join(" ") };
}
const shortSur = s => s.replace("Terwisscha van Scheltinga", "Terwisscha v. S.");
const firstName = p => p.roep || splitName(p.n).given[0] || p.n;
function lifeYears(p) {
  if (p.living) return "levend";
  const b = yr(p.b), d = yr(p.d);
  if (!b && !d) return "jaartallen onbekend";
  const bs = b ? (isApprox(p.b) ? "ca. " + b : b) : "?";
  const ds = d ? (/\bof\b/.test(p.d) ? p.d : isApprox(p.d) ? "ca. " + d : d) : "?";
  return `${bs} – ${ds}`;
}
function age(p) {
  const a = String(p.b || "").match(/^(\d{4})-(\d{2})-(\d{2})$/), b = String(p.d || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!a || !b) return null;
  let y = b[1] - a[1]; if (+b[2] < +a[2] || (+b[2] === +a[2] && +b[3] < +a[3])) y--; return y;
}
const fieldSt = (p, f) => p.unc && p.unc[f] ? p.unc[f] : null;
const stTag = (s, long) => s ? `<span class="tag st-${s}" title="${esc(STATUS[s].long)}">${s}${long ? " · " + STATUS[s].label.toLowerCase() : ""}</span>` : "";
const kindTag = k => k ? `<span class="tag k-${k}" title="${esc(NOTE_KIND[k])}">${k}</span>` : "";
const noteObj = n => typeof n === "string" ? { t: n } : n;
function lifeEvents(p) {
  const ev = [];
  if (p.b || p.bp) ev.push({ y: yr(p.b), p: p.bp, t: p.bapt ? "geboren · " + p.bapt : "geboren", st: fieldSt(p, "b") });
  if (p.m && (p.m.d || p.m.p)) ev.push({ y: yr(p.m.d), p: p.m.p, t: "getrouwd met " + p.m.w });
  (p.res || []).forEach(r => {
    const dup = ev.find(e => e.y === r.y && e.p === r.p && /^geboren/.test(e.t));
    if (dup) { if (r.t !== "geboren") dup.t = r.t.startsWith("geboren") ? r.t : dup.t + "; " + r.t; return; }
    ev.push({ y: r.y, p: r.p, t: r.t });
  });
  if (p.d || p.dp) { const dup = ev.find(e => e.y === yr(p.d) && e.p === p.dp && e !== ev[0]); if (dup) { dup.st = fieldSt(p, "d"); if (!/overleden/.test(dup.t)) dup.t = "overleden; " + dup.t; } else ev.push({ y: yr(p.d), p: p.dp, t: "overleden", st: fieldSt(p, "d") }); }
  const seen = new Set();
  return ev.filter(e => { const k = e.y + "|" + e.p + "|" + e.t; if (seen.has(k)) return false; seen.add(k); return true; })
           .sort((a, b) => (a.y ?? 9999) - (b.y ?? 9999));
}
function srcType(u, label) {
  if (!u) return "Literatuur";
  if (/rkf:|haa:|bnl:|nba:|archiefrkfriesland/.test(u)) return "Bidprentje";
  if (/swl:/.test(u) || /bevolkingsregister/i.test(label)) return "Bevolkingsregister";
  if (/(frl|hco|dar|gra):/.test(u) || /openarchieven\.nl\/[a-z]{2,4}:/.test(u)) return "Akte";
  if (/resolver\.kb\.nl|delpher|dekrantvantoen/.test(u)) return "Krant";
  if (/begraafplaats|graftombe|gravenenverhalen/.test(u)) return "Graf";
  if (/windgenealogie|matricula/.test(u)) return "Kerkboek (index)";
  if (/tresoar-images\.memorix\.nl/.test(u)) return "Akte"; /* een scan van een akte of register */
  if (/collections\.tresoar\.nl/.test(u) || /fotoarchief/i.test(label || "")) return "Beeld"; /* foto's en schilderijen uit een beeldbank */
  if (/dbnl|raerd|tresoar|allefriezen\.nl\/$/.test(u)) return "Literatuur";
  return "Genealogie";
}
/* één klein lijnicoon per bronsoort, altijd naast het woord (profiel, Alle bronnen, Cijfers) */
const SRC_ICON = {
  "Akte": '<path d="M5 2.5h7l3.5 3.5v11.5H5z"/><path d="M12 2.5V6h3.5M7.5 9.5h5M7.5 12.5h5M7.5 15h3"/>',
  "Bevolkingsregister": '<rect x="3" y="3.5" width="14" height="13" rx="1"/><path d="M3 7.5h14M3 11.5h14M8 7.5v9"/>',
  "Kerkboek (index)": '<path d="M4 3.5h9.5a2 2 0 0 1 2 2V17H6a2 2 0 0 1-2-2z"/><path d="M4 15a2 2 0 0 1 2-2h9.5M9.75 5.5v5M7.75 7.5h4"/>',
  "Bidprentje": '<rect x="5" y="2.5" width="10" height="15" rx="1"/><path d="M10 5.5v5M8 7.5h4M7.5 13.5h5"/>',
  "Graf": '<path d="M5.5 17V8a4.5 4.5 0 0 1 9 0v9"/><path d="M3.5 17h13M10 7v5M8 9h4"/>',
  "Krant": '<path d="M3 4.5h11V16a1.5 1.5 0 0 0 1.5 1.5h-11A1.5 1.5 0 0 1 3 16z"/><path d="M14 8h2.5v8a1.5 1.5 0 0 1-3 0M5.5 7.5h6M5.5 10.5h6M5.5 13.5h4"/>',
  "Literatuur": '<path d="M2.5 5c2.5-1 5-1 7.5 1 2.5-2 5-2 7.5-1v11c-2.5-1-5-1-7.5 1-2.5-2-5-2-7.5-1z"/><path d="M10 6v11"/>',
  "Beeld": '<rect x="2.5" y="3.5" width="15" height="13" rx="1"/><circle cx="7" cy="8" r="1.6"/><path d="M2.5 14l4.5-4 3.5 3 2.5-2 4.5 4"/>',
  "Scan": '<path d="M12 2.5H5v15h5"/><path d="M12 2.5l3.5 3.5V10"/><circle cx="13.5" cy="14" r="2.6"/><path d="M15.4 15.9l2.3 2.3"/>',
  "Genealogie": '<circle cx="10" cy="4.5" r="2"/><circle cx="5" cy="15.5" r="2"/><circle cx="15" cy="15.5" r="2"/><path d="M10 6.5V10M5 13.5V10h10v3.5"/>'
};
const srcIco = t => SRC_ICON[t] ? `<svg class="srcico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SRC_ICON[t]}</svg>` : "";
const SRC_ORDER = ["Akte", "Bevolkingsregister", "Kerkboek (index)", "Bidprentje", "Graf", "Krant", "Literatuur", "Beeld", "Genealogie"];
const SRC_MV = { Akte: "Akten", Bevolkingsregister: "Bevolkingsregisters", "Kerkboek (index)": "Kerkboeken (index)", Bidprentje: "Bidprentjes", Graf: "Graven", Krant: "Kranten", Literatuur: "Literatuur", Beeld: "Beelden", Genealogie: "Genealogieën" };

/* één lijnicoon per pagina, in de stijl van Beeld: in het telefoonmenu, de uitklapmenu's en de koppen van de voorpagina,
   altijd naast het woord */
const NAV_PATH = {
  overzicht: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>',
  stamboom: '<path d="M3 18a9 9 0 0 1 18 0"/><path d="M7 18a5 5 0 0 1 10 0"/><path d="M12 9v9M5.6 11.6L12 18M18.4 11.6L12 18"/>',
  boom: '<path d="M3 12h5M8 6.5v11M8 6.5h5M8 17.5h5M13 4v5M13 4h7M13 9h7M13 15v5M13 15h7M13 20h7"/>',
  families: '<circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><circle cx="12" cy="17" r="2.5"/><path d="M7 9.5V12h10V9.5M12 12v2.5"/>',
  lijst: '<path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1"/>',
  personen: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.6-1.8 5.4-1.8 6 0M14 10h4M14 13h4"/>',
  namen: '<path d="M4 18l3.5-10L11 18M5.3 14.5h4.4M14 8h6M14 13h6M14 18h4"/>',
  verwant: '<circle cx="12" cy="5" r="2.3"/><circle cx="5" cy="19" r="2.3"/><circle cx="19" cy="19" r="2.3"/><path d="M10.6 6.9C7.5 9.5 5.8 12.8 5.3 16.7M13.4 6.9c3.1 2.6 4.8 5.9 5.3 9.8M7.5 19h9"/>',
  verwanten: '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5"/>',
  verhalen: '<path d="M3 6c3-1.3 6-1.3 9 .8 3-2.1 6-2.1 9-.8v13c-3-1.3-6-1.3-9 .8-3-2.1-6-2.1-9-.8z"/><path d="M12 6.8v13"/>',
  opvallend: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  tijdlijn: '<path d="M3 12h18"/><circle cx="7" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><path d="M7 6v4M15 14v4M19.5 8v4"/>',
  tijd: '<path d="M6 3h12M6 21h12"/><path d="M7.5 3v2.5c0 2.5 4.5 4 4.5 6.5s-4.5 4-4.5 6.5V21M16.5 3v2.5c0 2.5-4.5 4-4.5 6.5s4.5 4 4.5 6.5V21"/>',
  cijfers: '<path d="M3 20h18"/><rect x="5" y="11" width="3" height="9"/><rect x="10.5" y="6" width="3" height="14"/><rect x="16" y="13" width="3" height="7"/>',
  kaart: '<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  verbanden: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  beeld: '<ellipse cx="12" cy="12" rx="8" ry="9.5"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5c1.2-2.6 3.2-3.8 5.5-3.8s4.3 1.2 5.5 3.8"/>',
  "beeld-plaatsen": '<path d="M12 2v4M10.5 3.5h3M8 21V10l4-4 4 4v11M3 21v-6l5-3M21 21v-6l-5-3M2 21h20"/><path d="M11 21v-4h2v4"/>',
  "beeld-archief": '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>',
  bronnen: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  zoek: '<circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/>',
  zoeken: '<circle cx="11" cy="11" r="7"/><path d="M16 16l5 5M9.2 9.2a2 2 0 1 1 2.8 1.9c-.6.3-1 .8-1 1.5v.3M11 15.2h.01"/>',
  "bronnen-tegenstrijdig": '<path d="M4 7h10M4 7l3-3M4 7l3 3M20 17H10M20 17l-3-3M20 17l-3 3"/>',
  "bronnen-lijst": '<path d="M8 3h8l4 4v13H8z"/><path d="M16 3v4h4M5 6v15h11M11 11h6M11 14h6M11 17h4"/>',
  "bronnen-over": '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  vandaag: '<rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  print: '<path d="M7 9V3.5h10V9"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M7 14h10v6.5H7z"/><path d="M17.5 12h.01"/>',
  meer: '<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/>'
};
const navIco = v => NAV_PATH[v] ? `<svg class="nico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NAV_PATH[v]}</svg>` : "";

/* ---------- illustraties (eigen lijntekeningen) ---------- */
const ART = {
  schuilkerk: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Schuilkerk achter een gewone gevel"><path d="M16 120H304"/><path d="M52 120V74L84 48L116 74V120" fill="currentColor" fill-opacity=".06"/><path d="M76 120V102H92V120M66 82H78V92H66ZM90 82H102V92H90Z"/><path d="M128 120V64H144V54H160V44H176V54H192V64H208V120Z" fill="currentColor" fill-opacity=".1"/><path d="M160 120V102Q168 94 176 102V120"/><path d="M156 68H180V92H156Z"/><path d="M168 72V88M161 78H175"/><path d="M220 120V78L252 54L284 78V120" fill="currentColor" fill-opacity=".06"/><path d="M244 120V102H260V120M232 86H244V96H232ZM260 86H272V96H260Z"/><path d="M30 30q6-5 12 0q6-5 12 0"/></svg>`,
  cart: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Boerenwagen tussen twee boerderijen"><path d="M8 124H312"/><path d="M18 124V92L42 72L66 92V124" fill="currentColor" fill-opacity=".08"/><path d="M36 124V108H48V124"/><path d="M254 124V92L278 72L302 92V124" fill="currentColor" fill-opacity=".08"/><path d="M272 124V108H284V124"/><path d="M72 112Q160 70 248 112" stroke-dasharray="3 6"/><path d="M128 86H190V102H128Z" fill="currentColor" fill-opacity=".1"/><path d="M132 86q8-14 17 0q8-14 17 0q8-14 17 0"/><circle cx="141" cy="110" r="9"/><circle cx="177" cy="110" r="9"/><path d="M190 94L214 88"/><path d="M226 66l14 6l-14 6"/></svg>`,
  ship: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Zeilschip op weg naar de overkant"><path d="M84 100H244L224 120H104Z" fill="currentColor" fill-opacity=".1"/><path d="M138 100V26M192 100V32"/><path d="M142 32L142 92L182 92Z" fill="currentColor" fill-opacity=".08"/><path d="M196 38L196 92L230 92Z" fill="currentColor" fill-opacity=".08"/><path d="M138 26l14 4l-14 4"/><path d="M12 128q15-8 30 0q15-8 30 0q15-8 30 0q15-8 30 0q15-8 30 0q15-8 30 0q15-8 30 0q15-8 30 0q15-8 30 0q15-8 30 0"/><path d="M262 60q14-14 34-10" stroke-dasharray="3 5"/><circle cx="300" cy="50" r="4" fill="currentColor"/></svg>`,
  web: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Netwerk van verbonden families"><path d="M110 30L70 76M110 30L160 76M210 30L160 76M210 30L250 76M70 76L115 116M160 76L115 116M160 76L205 116M250 76L205 116"/><path d="M166 80L121 120" stroke-dasharray="2 4"/><circle cx="110" cy="30" r="7" fill="currentColor" fill-opacity=".15"/><circle cx="210" cy="30" r="7" fill="currentColor" fill-opacity=".15"/><circle cx="70" cy="76" r="7" fill="currentColor" fill-opacity=".15"/><circle cx="160" cy="76" r="11" fill="currentColor" fill-opacity=".2"/><circle cx="250" cy="76" r="7" fill="currentColor" fill-opacity=".15"/><circle cx="115" cy="116" r="7" fill="currentColor" fill-opacity=".15"/><circle cx="205" cy="116" r="7" fill="currentColor" fill-opacity=".15"/></svg>`,
  farm: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Friese kop-hals-rompboerderij"><path d="M8 120H312" /><path d="M42 120V74H108V120" /><path d="M36 76L75 42L114 76Z" fill="currentColor" fill-opacity=".08"/><path d="M60 120V98H74V120M84 88H98V100H84ZM50 88H56V100H50Z"/><path d="M108 120V86H130V120M106 86L119 76L132 86"/><path d="M130 120V82H270V120"/><path d="M124 84L172 24H228L276 84Z" fill="currentColor" fill-opacity=".08"/><path d="M180 120V100Q200 84 220 100V120"/><path d="M146 96H160V106H146ZM240 96H254V106H240Z"/><circle cx="292" cy="84" r="14" fill="currentColor" fill-opacity=".08"/><path d="M292 98V120"/><path d="M20 30q6-5 12 0q6-5 12 0M52 20q5-4 10 0q5-4 10 0"/></svg>`,
  church: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Dorpskerk met kerkhof"><path d="M8 120H312"/><path d="M140 120V44H180V120"/><path d="M136 44L160 6L184 44Z" fill="currentColor" fill-opacity=".08"/><path d="M160 6V-4M155 0H165"/><path d="M180 120V72H282V120"/><path d="M176 74L229 48L286 74Z" fill="currentColor" fill-opacity=".08"/><path d="M152 120V100Q160 90 168 100V120"/><path d="M198 108V92Q204 84 210 92V108M226 108V92Q232 84 238 92V108M254 108V92Q260 84 266 92V108"/><circle cx="160" cy="64" r="7"/><path d="M40 120V100M34 106H46M70 120V104M65 109H75M100 120V102M95 107H105"/><path d="M28 120q12-10 24 0"/></svg>`,
  name: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Open register met ganzenveer"><path d="M40 112L160 124L280 112V28L160 40L40 28Z" fill="currentColor" fill-opacity=".06"/><path d="M160 40V124"/><path d="M58 48L142 56M58 62L142 70M58 76L130 83M58 90L142 98M178 56L262 48M178 70L262 62M178 84L250 77M178 98L262 90"/><path d="M262 8C238 30 222 52 214 78L220 80C232 56 250 34 270 16Z" fill="currentColor" fill-opacity=".08"/><text x="70" y="24" font-family="IBM Plex Mono, monospace" font-size="15" fill="currentColor" stroke="none">1812</text></svg>`,
  map: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Route langs dorpen"><path d="M12 30Q40 44 30 70T50 120" stroke-dasharray="1 0" fill="none"/><path d="M12 30Q40 44 30 70T50 120L8 120V30Z" fill="currentColor" fill-opacity=".08" stroke="none"/><path d="M80 98C120 70 140 110 180 80S240 50 280 64" stroke-dasharray="5 6"/><circle cx="80" cy="98" r="6" fill="currentColor" fill-opacity=".2"/><circle cx="150" cy="92" r="6" fill="currentColor" fill-opacity=".2"/><circle cx="214" cy="66" r="6" fill="currentColor" fill-opacity=".2"/><path d="M280 64C280 50 296 46 296 34A16 16 0 0 0 264 34C264 46 280 50 280 64Z" fill="currentColor" fill-opacity=".12"/><circle cx="280" cy="34" r="5"/><path d="M8 120H312"/></svg>`,
  branch: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Twee lijnen die samenkomen"><path d="M60 128C60 90 120 70 160 30M260 128C260 90 200 70 160 30"/><circle cx="160" cy="24" r="14" fill="currentColor" fill-opacity=".1"/><circle cx="160" cy="24" r="5" fill="currentColor"/><circle cx="60" cy="128" r="5" fill="currentColor"/><circle cx="260" cy="128" r="5" fill="currentColor"/><circle cx="86" cy="92" r="4"/><circle cx="234" cy="92" r="4"/><circle cx="120" cy="62" r="4"/><circle cx="200" cy="62" r="4"/></svg>`,
  rings: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Twee trouwringen en een register"><circle cx="132" cy="74" r="34" fill="currentColor" fill-opacity=".06"/><circle cx="132" cy="74" r="27"/><circle cx="182" cy="74" r="34" fill="currentColor" fill-opacity=".06"/><circle cx="182" cy="74" r="27"/><path d="M24 118H296"/><path d="M40 28H92M40 40H84M40 52H90M226 28H280M232 40H280M226 52H274" stroke-width="1.5"/><text x="214" y="137" font-family="IBM Plex Mono, monospace" font-size="11" fill="currentColor" stroke="none">akte 32 · 33</text></svg>`,
  trades: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Ketel, sluisdeur en uithangbord"><path d="M8 120H312"/><path d="M40 120V70H96V120"/><path d="M34 72L68 44L102 72Z" fill="currentColor" fill-opacity=".08"/><path d="M96 82H124M110 82V96" /><rect x="102" y="96" width="18" height="12" rx="2" fill="currentColor" fill-opacity=".12"/><path d="M150 120C150 92 162 84 178 84S206 92 206 120Z" fill="currentColor" fill-opacity=".08"/><path d="M162 84C162 72 194 72 194 84M206 98H218"/><path d="M178 70V62"/><path d="M240 120V54H252V120M290 120V54H278V120M252 66L278 92M252 92L278 66"/><path d="M232 108H300" stroke-dasharray="4 4"/></svg>`,
  roots: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Boom met wortels over een grens"><path d="M8 92H312"/><path d="M200 92V40M200 60L176 36M200 52L226 26M200 70L230 56"/><circle cx="200" cy="36" r="30" fill="currentColor" fill-opacity=".08"/><path d="M200 92C190 108 160 112 120 116C90 119 60 122 30 128M200 92C210 110 230 118 262 126"/><path d="M140 70V110" stroke-dasharray="3 5"/><text x="70" y="70" font-family="IBM Plex Mono, monospace" font-size="12" fill="currentColor" stroke="none">DE</text><text x="232" y="122" font-family="IBM Plex Mono, monospace" font-size="12" fill="currentColor" stroke="none">NL</text></svg>`,
  fan: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Waaier met twee keer dezelfde voorouders"><path d="M142.0 130.0A18 18 0 0 1 178.0 130.0M114.0 130.0A46 46 0 0 1 206.0 130.0M86.0 130.0A74 74 0 0 1 234.0 130.0M58.0 130.0A102 102 0 0 1 262.0 130.0M160.0 112.0L160.0 84.0M192.5 97.5L212.3 77.7M160.0 84.0L160.0 56.0M127.5 97.5L107.7 77.7M228.4 101.7L254.2 91.0M212.3 77.7L232.1 57.9M188.3 61.6L199.0 35.8M160.0 56.0L160.0 28.0M131.7 61.6L121.0 35.8M107.7 77.7L87.9 57.9M91.6 101.7L65.8 91.0M48 130H272"/><path d="M87.9 57.9A102 102 0 0 0 65.8 91.0L91.6 101.7A74 74 0 0 1 107.7 77.7ZM254.2 91.0A102 102 0 0 0 232.1 57.9L212.3 77.7A74 74 0 0 1 228.4 101.7Z" fill="currentColor" fill-opacity=".28"/><path d="M73.8 71.8Q160 6 246.2 71.8" stroke-dasharray="3 6"/><circle cx="160" cy="128" r="7" fill="currentColor" fill-opacity=".2"/></svg>`,
  ledger: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Oud lidmatenboek naast een open register"><path d="M44 128V26H98V128Z" fill="currentColor" fill-opacity=".08"/><path d="M54 26V128M44 40H98M44 114H98"/><path d="M64 58H88M64 66H84"/><path d="M118 120L204 128L290 120V36L204 44L118 36Z" fill="currentColor" fill-opacity=".06"/><path d="M204 44V128"/><path d="M134 62L190 67M134 74L190 79M134 86L176 90M134 98L190 103M218 67L274 62M218 79L274 74M218 91L262 87"/><path d="M222 104q10-10 18 0t18 0" /><text x="136" y="30" font-family="IBM Plex Mono, monospace" font-size="15" fill="currentColor" stroke="none">1772</text></svg>`
};
const ICON = {
  ask: `<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="19" cy="19" r="12"/><path d="M28 28L38 38"/><path d="M15.5 15.5a3.6 3.6 0 1 1 5 3.3c-1 .5-1.5 1.2-1.5 2.4v.8"/><circle cx="19" cy="25.5" r=".6" fill="currentColor"/></svg>`,
  rel: `<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="22" cy="9" r="4.5"/><circle cx="9" cy="34" r="4.5"/><circle cx="35" cy="34" r="4.5"/><path d="M19 13C13 18 10 23 9.5 29.5M25 13C31 18 34 23 34.5 29.5"/><path d="M14 34H30" stroke-dasharray="2 3"/></svg>`,
  fan: `<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 36A18 18 0 0 1 40 36"/><path d="M10 36A12 12 0 0 1 34 36"/><path d="M16 36A6 6 0 0 1 28 36"/><path d="M22 18V36M9.5 23.5L22 36M34.5 23.5L22 36"/></svg>`,
  fam: `<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="5"/><circle cx="32" cy="12" r="5"/><circle cx="22" cy="32" r="5"/><path d="M12 17V22H32V17M22 22V27"/></svg>`,
  card: `<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="8" width="32" height="28" rx="4"/><circle cx="16" cy="19" r="4"/><path d="M11 30C12 26 20 26 21 30M25 17H33M25 22H33M25 27H30"/></svg>`,
  book: `<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 10L22 13L38 10V34L22 37L6 34Z"/><path d="M22 13V37M10 17L18 18.5M10 22L18 23.5M26 18.5L34 17M26 23.5L34 22"/></svg>`,
  clock: `<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 30H38"/><circle cx="12" cy="30" r="3" fill="currentColor"/><circle cx="24" cy="30" r="3" fill="currentColor"/><circle cx="34" cy="30" r="3" fill="currentColor"/><path d="M24 26C24 18 30 14 30 9A6 6 0 0 0 18 9C18 14 24 18 24 26Z"/></svg>`,
  pin: `<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 38s-11-9.6-11-17a11 11 0 0 1 22 0c0 7.4-11 17-11 17z"/><circle cx="22" cy="21" r="4"/><path d="M6 38h32"/></svg>`,
  photo: `<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="9" width="24" height="30" rx="2"/><path d="M19 15V27M14 19.5H24"/><path d="M12 33H26"/><path d="M31 13L37 15L33 37L31 36.5"/></svg>`,
  chart: `<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 38H38"/><rect x="9" y="22" width="6" height="16"/><rect x="19" y="12" width="6" height="26"/><rect x="29" y="27" width="6" height="11"/><path d="M8 10l8 6 8-8 10 6"/></svg>`,
  star: `<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><circle cx="22" cy="17" r="10"/><path d="M22 10l2.2 4.6 5 .6-3.7 3.4 1 4.9L22 21l-4.5 2.5 1-4.9-3.7-3.4 5-.6z"/><path d="M15 25l-4 13 6-3 3 5 2-8M29 25l4 13-6-3-3 5-2-8"/></svg>`,
  archive: `<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="8" width="32" height="10" rx="2"/><path d="M8 18V36H36V18M18 24H26"/><circle cx="31" cy="31" r="5"/><path d="M35 35L39 39"/></svg>`
};

/* ---------- tooltip ---------- */
const tip = $("#tip");
function showTip(e, html) { tip.innerHTML = html; tip.hidden = false; moveTip(e); }
function moveTip(e) { tip.style.left = Math.min(e.clientX + 14, innerWidth - 290) + "px"; tip.style.top = (e.clientY + 16) + "px"; }
function hideTip() { tip.hidden = true; }
const tipFor = p => `${avatar(p.kw, "tipava")}<b>${esc(p.n)}</b><br><span style="opacity:.8">${esc(lifeYears(p))} · kw ${p.kw}${p.st && !p.living ? " · status " + p.st : ""}</span>`;
function bindTip(node, html) { node.addEventListener("mouseenter", e => showTip(e, html)); node.addEventListener("mousemove", moveTip); node.addEventListener("mouseleave", hideTip); }

/* ---------- svg helpers ---------- */
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function txt(parent, x, y, s, attrs = {}) { const t = el("text", Object.assign({ x, y, fill: "var(--ink)" }, attrs), parent); t.textContent = s; return t; }
const trunc = (s, n) => s.length > n ? s.slice(0, Math.max(1, n - 1)) + "…" : s;
function clickable(node, fn, label) {
  node.addEventListener("click", fn); node.setAttribute("tabindex", "0"); node.setAttribute("role", "button");
  if (label) node.setAttribute("aria-label", label);
  node.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(e); } });
}

/* ---------- routing ---------- */
const VIEWS = ["overzicht", "stamboom", "families", "personen", "verhalen", "tijdlijn", "kaart", "plaats", "beeld", "cijfers", "verwanten", "bronnen", "namen", "lijst", "zoeken",
  "bronnen-tegenstrijdig", "bronnen-lijst", "bronnen-over", "beeld-plaatsen", "beeld-archief"];
const NAV_OF = { plaats: "kaart", verwanten: "personen", namen: "personen", lijst: "personen", zoeken: "bronnen" };
/* de bronnenpagina was vroeger één lange pagina; oude namen van haar onderdelen leiden naar de pagina waar ze nu staan.
   Begrippen, wijzigingen en beeldverantwoording staan onder "Over deze site" (bronnen-begrippen enz. scrollen daarheen). */
const BRON_OUD = { begrippen: "bronnen-begrippen", wijzigingen: "bronnen-wijzigingen", beeldverantwoording: "bronnen-beeld", over: "bronnen-over",
  tegenstrijdigheden: "bronnen-tegenstrijdig", "open-vragen": "zoeken", archieven: "bronnen", "alle-bronnen": "bronnen-lijst",
  "bron-0": "bronnen", "bron-1": "zoeken", "bron-2": "bronnen-tegenstrijdig", "bron-3": "bronnen", "bron-4": "bronnen-lijst", "bron-5": "bronnen-lijst", "bron-7": "bronnen-wijzigingen", "bron-9": "bronnen-over" };
/* vangnet: ontbreekt een paginasectie in index.html, maak hem dan zelf aan */
VIEWS.forEach(x => { if (!$("#v-" + x)) { const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-" + x; sec.hidden = true; $("main").appendChild(sec); } });
const route = { view: "overzicht", sub: null };
const rendered = {};
function go(token, opts = {}) {
  if (!archTekstOk && /^beeld(-|$)/.test(token)) { archTekst().then(() => go(token, opts)); return; } /* Beeld heeft de tekst van de archiefbeelden nodig */
  let view = token, sub = null;
  if (/^lijn-\d+$/.test(token)) { view = "families"; sub = +token.slice(5); }
  else if (/^verhaal-/.test(token)) { view = "verhalen"; sub = token.slice(8); }
  else if (/^plaats-/.test(token)) { view = "plaats"; sub = SLUG[token] || null; if (!sub) view = "kaart"; }
  else if (/^stamboom-\d+$/.test(token)) { view = "stamboom"; sub = +token.slice(9); } /* midden van de waaier */
  else if (/^boom-\d+$/.test(token)) { view = "boom"; sub = +token.slice(5); } /* startpunt van de boom */
  else if (/^verwant(-|$)/.test(token)) { view = "verwant"; vwFromToken(token); } /* verwantschap: keuze uit de hash */
  else if (/^beeld-?-archief(--|$)/.test(token)) { /* archiefverkenner met filters; het oude beeld--archief… en onbekende waarden worden in de hash rechtgezet */
    view = "beeld-archief"; arvFromToken(token); const t2 = arvToken(); if (opts.keepHash && t2 !== token) opts = Object.assign({}, opts, { keepHash: false, replace: true }); token = t2; rendered[view] = false; }
  if (BRON_OUD[view]) { view = token = BRON_OUD[view]; opts = Object.assign({}, opts, { replace: true, keepHash: false }); }
  if (/^bronnen-(begrippen|wijzigingen|beeld)$/.test(token)) { view = "bronnen-over"; sub = token.slice(8); } /* een onderdeel van Over deze site */
  if (!VIEWS.includes(view)) view = "overzicht";
  if (!drawer.hidden && !opts.keepDrawer) closeProfile(true);
  if (!lb.hidden) closeLb(true);
  if (view !== "kaart") stopPlay();
  route.view = view; route.sub = sub;
  VIEWS.forEach(x => { const s = $("#v-" + x); if (s) s.hidden = x !== view; });
  $$("nav.tabs button").forEach(b => { if (b.dataset.view === (NAV_OF[view] || view)) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  showActiveTab();
  if (typeof menuSync === "function") menuSync(); /* hoofdmenu */
  const r = RENDER[view];
  if (["families", "verhalen", "plaats", "boom"].includes(view) || (view === "stamboom" && (sub || fanRoot > 1))) r(sub);
  else if (!rendered[view]) { rendered[view] = true; r(); }
  if (view === "bronnen-over") requestAnimationFrame(() => bronNaar(sub));
  if (!opts.keepHash) setHash(T.prefix + token, opts.replace ? "replace" : "push");
  if (!opts.keepScroll) window.scrollTo({ top: 0 });
  closeSearch();
}
/* browsergeschiedenis: elke paginawissel en elk geopend profiel is een stap, zodat vorige/volgende werken (ook via file://) */
function setHash(h, how, state) {
  const url = "#" + h;
  if (location.hash === url) return;
  try { history[how === "push" ? "pushState" : "replaceState"](state || null, "", url); } catch (e) {}
}
/* telefoon: het menu scrolt opzij; houd het actieve tabblad in beeld en laat met een vervaging zien dat er meer is */
function navFade() { const n = $("nav.tabs"); n.classList.toggle("fr", n.scrollLeft + n.clientWidth < n.scrollWidth - 4); n.classList.toggle("fl", n.scrollLeft > 4); }
function showActiveTab() {
  const n = $("nav.tabs"), b = $("nav.tabs button[aria-current=page]");
  if (b && n.scrollWidth > n.clientWidth) { const l = b.offsetLeft - n.offsetLeft, r = l + b.offsetWidth; if (l < n.scrollLeft + 24) n.scrollLeft = l - 24; else if (r > n.scrollLeft + n.clientWidth - 24) n.scrollLeft = r - n.clientWidth + 24; }
  navFade();
}
$("nav.tabs").addEventListener("scroll", navFade, { passive: true });
addEventListener("resize", navFade);
document.addEventListener("click", e => {
  if (e.target.closest("[data-archief]")) { go("beeld-archief"); return; }
  const ib = e.target.closest("[data-img]"); if (ib) { e.preventDefault(); const grp = ib.closest("[data-imggroup]"); const list = grp ? [...new Set($$("[data-img]", grp).filter(b => !b.closest(".broken")).map(b => b.dataset.img))] : [ib.dataset.img]; openLb(ib.dataset.img, list); return; }
  const g = e.target.closest("[data-go]"); if (g) { e.preventDefault(); if (!drawer.hidden) closeProfile(true); go(g.dataset.go); return; }
  const v = e.target.closest("[data-view]"); if (v) { go(v.dataset.view); return; }
  const o = e.target.closest("[data-open]"); if (o) { e.preventDefault(); openProfile(+o.dataset.open); return; }
  const md = e.target.closest("[data-media]"); if (md) { e.preventDefault(); goMedia(md.dataset.media); return; }
});

/* ---------- profile drawer ---------- */
const drawer = $("#drawer"), scrim = $("#scrim");
let lastFocus = null, curKw = null;
function pbtn(kw, label) {
  const p = person(kw);
  if (!p) return `<div class="pbtn none"><small>${label} · kw ${kw}</small><span>nog niet gevonden</span></div>`;
  return `<button class="pbtn" data-open="${kw}"><small>${label} · kw ${kw}${!p.living && p.st !== "A" ? " · " + p.st : ""}</small><span>${esc(p.n)}</span><small>${esc(lifeYears(p))}</small></button>`;
}
function searchLinks(p) {
  const sn = splitName(p.n), q = [sn.given[0], sn.sur].filter(Boolean).join(" "), dy = yr(p.d) || 0, by = yr(p.b) || 0;
  const L = [["Open Archieven", OA + "search.php?name=" + enc(q)], ["WieWasWie", "https://www.wiewaswie.nl/nl/zoeken/?q=" + enc(q)]];
  if (dy > 1840 || by > 1820) L.push(["Kranten (Delpher)", "https://www.delpher.nl/nl/kranten/results?query=" + enc('"' + q + '"') + "&coll=ddd"]);
  if (sn.sur && dy > 1880) L.push(["Graven (Graftombe)", "https://graftombe.nl/Names/search/surname/" + enc(sn.sur) + "/submit/true"]);
  if ((by && by <= 1812 && (!dy || dy >= 1832)) || (!by && dy >= 1832 && dy <= 1880)) L.push(["Kadaster 1832", OA + "search.php?lang=nl&name=" + enc(q) + "&sourcetype=Kadaster"]);
  if (sn.given[0]) L.push(["Voornaam " + sn.given[0] + " (Meertens)", "https://nvb.meertens.knaw.nl/naam/is/" + enc(sn.given[0])]);
  return L;
}
function storiesOf(kw) { const ks = [kw, ...twinKws(kw)]; return STORIES.filter(s => s.people.some(k => ks.includes(k))); }
function mediaOf(kw) { const ks = [kw, ...twinKws(kw)]; return MEDIA.filter(m => (m.kws || []).some(k => ks.includes(k))); }
/* ---------- beelden (Wikimedia Commons) ---------- */
const IMGS = typeof IMAGES !== "undefined" ? IMAGES : [];
const IMG_ID = {}, IMG_KEY = {};
IMGS.forEach(i => { IMG_ID[i.id] = i; (IMG_KEY[i.soort + ":" + i.key] = IMG_KEY[i.soort + ":" + i.key] || []).push(i); });
/* één historisch omslagbeeld per plaats (data/29-omslag.js, scripts/omslag.py): voor de plaatstegels; de plaatspagina houdt de moderne foto */
const OMS = typeof OMSLAG !== "undefined" ? OMSLAG : {};
Object.values(OMS).forEach(i => { i.arch = true; IMG_ID[i.id] = i; });
const placeHist = k => !k ? null : OMS[k] || (PLACES[k] && PLACES[k].seat ? OMS[PLACES[k].seat] : null) || null;
const tileImg = k => placeHist(k) || placeImg(k);
const imgOf = (s, k) => (IMG_KEY[s + ":" + k] || [])[0] || null;
// beelden bij een voorouder (grafsteen, rouwbericht, portret): key = eerste kw, kws = iedereen op het beeld
/* sleutel van een persoon in beelden en archief-packs: "<kw>" bij Harrie, "a-<kw>" bij Alies; in de samengestelde boom de oorspronkelijke sleutel */
const imgKey = kw => { if (T.key !== "s") return T.prefix + kw; const p = person(kw); return p && p.origKw ? (p.side === "a" ? "a-" : "") + p.origKw : "-"; };
/* beelden bij een verhaal: vh = [[verhaal-id, kop van het deel], ...]; ze staan onder dat deel (anders onderaan het verhaal) */
const storyImgs = id => IMGS.filter(i => (i.vh || []).some(v => v[0] === id)).sort((a, b) => (b.soort === "verhaal") - (a.soort === "verhaal"));
const storyFigs = ims => ims.length ? `<div class="vfigs${ims.length > 1 ? " two" : ""}" data-imggroup>${ims.map((im, j) => fig(im, { thumb: ims.length > 1 && !(j === 0 && ims.length % 2) })).join("")}</div>` : "";
const persImgs = kw => { const ik = imgKey(kw); return IMGS.filter(i => (i.soort === "persoon" && (String(i.key) === ik || (i.kws || []).map(String).includes(ik))) || (i.why && i.why[ik])); };
/* portretten: een persoonsbeeld met portret:true toont de persoon met sleutel key (niet iedereen in kws).
   Nooit van levenden, en niet van wie na 1910 is geboren zonder bekende sterfdatum (die kan nog leven). crop = focuspunt "x% y%". */
const PORTRAITS = IMGS.filter(i => i.soort === "persoon" && i.portret);
function portraitOf(kw) {
  const p = person(kw); if (!p || p.living || (!p.d && (yr(p.b) || 0) > 1910) || !PORTRAITS.length) return null;
  const ks = [kw, ...twinKws(kw)].map(imgKey);
  return PORTRAITS.find(i => ks.includes(String(i.key))) || null;
}
const cropOf = im => /^\d{1,3}% \d{1,3}%$/.test(im.crop || "") ? im.crop : "50% 30%";
const avatar = (kw, cls = "") => { const im = portraitOf(kw); return im ? `<span class="pava ${cls}"><img src="${im.thumb}" alt="" loading="lazy" decoding="async" style="object-position:${cropOf(im)}"></span>` : ""; };
const placeImg = k => !k ? null : imgOf("plaats", k) || (PLACES[k] && PLACES[k].seat ? imgOf("plaats", PLACES[k].seat) : null);
const gemMap = gem => { for (const g of String(gem || "").split("/")) { const i = imgOf("kaart", g.trim()); if (i) return i; } return null; };
const oldMaps = k => { const P = PLACES[k]; if (!P) return []; return [imgOf("stadsplan", k), gemMap(P.gem)].filter((x, i, a) => x && a.indexOf(x) === i); };
/* namen in het Nederlands: Engelse of ruwe vermeldingen uit Commons en Europeana leesbaar maken (de data blijven zoals ze zijn) */
const nlNaam = s => String(s || "").replace(/Cultural Heritage Agency of the Netherlands/g, "Rijksdienst voor het Cultureel Erfgoed");
const makerOf = im => nlNaam(im.maker).replace(/\s*\((talk|overleg)[^)]*\)/ig, "")
  .replace(/^No machine-readable author provided\..*$/i, "onbekende maker")
  .replace(/^(.+?) at (Dutch|English|West Frisian|Frisian|[a-z]{2,3}\.)\s*Wikipedia.*$/i, "$1")
  .replace(/^(.+?) at [a-z]{2,3}\.wikipedia.*$/i, "$1")
  .replace(/^(unknown|anonymous|onbekend)\b.*$/i, "onbekende maker").trim() || "onbekende maker";
const bronOf = im => nlNaam(im.bronNaam) || "Wikimedia Commons";
/* archief-packs (vanaf versie 11). De site kent alleen de kleine index PACKS (data/28-packs.js):
     PACKS = { place: { "<PLACES-sleutel>": [["<pack>", ...], <aantal>] }, kw: { "<kw>": [["<pack>", ...], <aantal>] } }
   De gegevens staan in img/packs/<pack>.js, als PACK_DATA("<pack>", [{ id, soort, key, kws, t, desc, maker, bronNaam, bron, datum, lic, licUrl, ref, orig, w, h, src, p?, why? }]
   met src = "img/archief/<id>.jpg" (het beeld zelf, pas geladen als het getoond wordt; oude vorm: data = "data:image/jpeg;base64,...")
   ref (leesbare archiefverwijzing) en orig (url van het origineel of de viewer) zijn optioneel; ook in 27-images.js.
   key = PLACES-sleutel (beeld van een plaats) of kw als tekst (beeld van een persoon); kws = alle voorouders op het beeld.
   Een pack wordt pas geladen als een plaatspagina of profiel erom vraagt. Zonder index of bestand (lokaal, file://) blijft alles leeg. */
const PACK_IDX = typeof PACKS !== "undefined" ? PACKS : { place: {}, kw: {} };
const PACK_CACHE = {};
/* zoeklijst van alle archiefbeelden (PACKS.items): Beeld › Uit de archieven en de zoekfunctie. Per boom: plaatsbeelden altijd,
   persoonsbeelden alleen als die persoon in de huidige boom staat (via imgKey, dus ook in de samengestelde boom). */
const ARCH_ALL = (PACK_IDX.items || []).map(a => ({ id: a[0], pack: a[1], soort: a[2], key: String(a[3]), kws: a[4] ? a[4].map(String) : null, t: a[5] || "", datum: a[6] || "", bron: a[7] || "", desc: a[8] || "", p: a[9] || null }));
const ARCH_TREE = {};
/* de tekst van de zoeklijst (titel, bron, beschrijving) staat apart in PACKS.tekst en laadt pas bij Beeld of de zoekfunctie;
   daarna worden de afgeleide lijsten opnieuw opgebouwd. Zonder PACKS.tekst (oude vorm) staat de tekst al in items. */
let archTekstP = PACK_IDX.tekst ? null : Promise.resolve(), archTekstOk = !PACK_IDX.tekst;
function archTekst() {
  if (archTekstP) return archTekstP;
  return archTekstP = new Promise(res => {
    window.PACK_TEKST = list => {
      (list || []).forEach((x, i) => { const a = ARCH_ALL[i]; if (a && x) { a.t = x[0] || ""; a.bron = x[1] || ""; a.desc = x[2] || ""; } });
      archTekstOk = true; Object.keys(ARCH_TREE).forEach(k => delete ARCH_TREE[k]); Object.keys(ARV_CACHE).forEach(k => delete ARV_CACHE[k]); ARCH_PLACE = null;
      res();
    };
    const sc = document.createElement("script"); sc.src = PACK_IDX.tekst; sc.async = true;
    sc.onerror = () => { archTekstOk = true; res(); }; sc.onload = () => { sc.remove(); res(); };
    document.head.appendChild(sc);
  });
}
function archList() {
  if (ARCH_TREE[T.key]) return ARCH_TREE[T.key];
  const who = {}; all.forEach(p => { const k = imgKey(p.kw); if (!who[k]) who[k] = p; });
  return ARCH_TREE[T.key] = ARCH_ALL.filter(a => a.kws ? a.kws.some(k => who[k]) || PLACES[a.p] : PLACES[a.key]).map(a => {
    const ps = (a.kws || []).map(k => who[k]).filter(Boolean);
    /* tw = voorouders die in die plaats woonden toen het beeld gemaakt werd: zoeken op hun naam vindt het beeld ook */
    const pk = a.kws ? a.p : a.key, ys = imgYears(a.datum), tw = pk && PLACES[pk] && ys && ys[1] - ys[0] <= 50 ? peopleAt(pk, ys) : [];
    return Object.assign({}, a, { kw: ps.length ? ps[0].kw : null, tw: tw.length, twl: [...new Set([...tw, ...ps].map(p => lineOf(p.kw)).filter(l => LINES[l]))], nt: norm([a.t, a.desc, a.bron, a.datum, pk ? placeName(pk) : "", ...ps.map(p => p.n + " " + (p.alt || "")), ...tw.map(p => p.n)].join(" ")) });
  });
}
function dataUrlBlob(u) {
  const i = u.indexOf(","), mime = (/^data:([^;,]+)/.exec(u) || [, "image/jpeg"])[1], bin = atob(u.slice(i + 1)), a = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k);
  return new Blob([a], { type: mime });
}
/* packs zijn scripts (img/packs/<naam>.js roept PACK_DATA(naam, lijst) aan): een <script>-tag werkt ook als de site
   vanaf schijf (file://) wordt geopend, fetch niet. */
const PACK_WAIT = {};
window.PACK_DATA = (name, list) => { const w = PACK_WAIT[name]; if (w) { delete PACK_WAIT[name]; w(list); } };
function loadPack(name) {
  if (!PACK_CACHE[name]) PACK_CACHE[name] = new Promise(res => {
    PACK_WAIT[name] = res;
    const sc = document.createElement("script");
    sc.src = "img/packs/" + encodeURIComponent(name) + ".js"; sc.async = true;
    sc.onerror = () => { delete PACK_WAIT[name]; res([]); };
    sc.onload = () => { if (PACK_WAIT[name]) { delete PACK_WAIT[name]; res([]); } sc.remove(); };
    document.head.appendChild(sc);
  }).then(list => (Array.isArray(list) ? list : []).filter(it => it && it.id && (it.src || it.data)).map(it => {
    if (IMG_ID[it.id]) return IMG_ID[it.id];
    /* src = los bestand in img/archief/ (sinds 8-10-2026: alleen geladen als het beeld getoond wordt); data = oude vorm (base64) */
    let src = it.src; if (!src) try { src = URL.createObjectURL(dataUrlBlob(it.data)); } catch (e) { return null; }
    const im = Object.assign({}, it, { src, thumb: src, arch: true }); delete im.data;
    IMG_ID[im.id] = im; return im;
  }).filter(Boolean));
  return PACK_CACHE[name];
}
/* vult host met een galerij zodra de packs binnen zijn; still() bewaakt dat de pagina intussen niet is gewisseld */
function archGallery(host, entry, keep, still, o = {}) {
  if (!host || !entry || !entry[0] || !entry[0].length) return;
  Promise.all(entry[0].map(loadPack)).then(lists => {
    if (!still() || !host.isConnected) return;
    const seen = new Set(), items = lists.flat().filter(im => keep(im) && !seen.has(im.id) && seen.add(im.id));
    if (!items.length) return;
    const show = n => `${o.head || ""}<div class="pgal arch" data-imggroup>${items.slice(0, n).map(im => fig(im, { thumb: true, cap: o.cap ? o.cap(im) : undefined })).join("")}</div>${items.length > n ? `<p style="margin:10px 0 0"><button class="btn" data-more-arch>Toon alle ${items.length.toLocaleString("nl-NL")}</button></p>` : ""}${o.foot || ""}`;
    if (o.sort) items.sort(o.sort);
    host.innerHTML = show(12); host.hidden = false;
    const more = $("[data-more-arch]", host); if (more) more.onclick = () => { host.innerHTML = show(items.length); };
  });
}

/* ---------- percelen 1832 ---------- */
/* "Hun grond in 1832" (data/22-percelen.js, scripts/percelen1832.py): per voorouder de percelen uit de oorspronkelijk
   aanwijzende tafel van het kadaster, op een uitsnede van het minuutplan. Sleutel = imgKey ("104", "a-48"). */
const PERC = typeof PERCELEN !== "undefined" ? PERCELEN : {};
const ha = m2 => (m2 / 10000).toLocaleString("nl-NL", { maximumFractionDigits: m2 < 10000 ? 2 : 1 });
Object.values(PERC).flat().forEach(k => {
  const tot = k.rows.reduce((a, r) => a + (r.m2 || 0), 0);
  Object.assign(k, { soort: "perceel", t: `${k.g}, sectie ${k.s}, op de kadasterkaart van 1832`, datum: "1832", bronnen: [].concat(k.bron), bron: [].concat(k.bron)[0],
    desc: `Volgens de oorspronkelijk aanwijzende tafel stonden in 1832 op naam van ${k.eig} ${k.rows.length === 1 ? "dit perceel" : `deze ${k.rows.length} percelen`} in ${k.g}${tot ? `, samen ${ha(tot)} ha` : ""}${k.legger ? ` (legger ${k.legger})` : ""}. Omlijnd op het minuutplan van 1832.` });
  IMG_ID[k.id] = k;
});
function percelenHtml(kw) {
  const p = person(kw); if (!p || p.living) return "";
  const ks = [kw, ...twinKws(kw)].map(imgKey), maps = [...new Set(ks.flatMap(k => PERC[k] || []))];
  if (!maps.length) return "";
  const uses = rs => { const c = {}; rs.forEach(r => { const u = (r.use || "").toLowerCase(); if (u) c[u] = (c[u] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([u, n]) => n > 1 ? `${u} (${n})` : u).join(", "); };
  return `<section class="perc"><h5>Hun grond in 1832</h5><p class="small" style="margin:0 0 10px">Bij de invoering van het kadaster in 1832 werd elk perceel opgemeten en met de eigenaar ingeschreven. Op de oude kaart zijn de percelen van ${esc(firstName(p))} rood omlijnd.</p>
    <div class="pgal perc" data-imggroup>${maps.map(k => fig(k, { thumb: true, cap: `${k.g}, sectie ${k.s}: ${k.rows.length === 1 ? "1 perceel" : k.rows.length + " percelen"}${k.rows.some(r => r.m2) ? `, ${ha(k.rows.reduce((a, r) => a + (r.m2 || 0), 0))} ha` : ""}` })).join("")}</div>
    ${maps.map(k => `<details class="perclist"><summary>${esc(k.g)}, sectie ${esc(k.s)}: ${esc(uses(k.rows))}</summary><table class="mini"><thead><tr><th>nr.</th><th>gebruik</th><th>oppervlakte</th><th>klasse</th></tr></thead><tbody>${k.rows.map(r => `<tr><td class="y">${esc(r.n)}</td><td>${esc(r.use)}</td><td class="y">${r.m2 ? r.m2.toLocaleString("nl-NL") + " m²" : ""}</td><td class="y">${esc(r.kl || "")}</td></tr>`).join("")}</tbody></table><p class="small" style="margin:6px 0 0">Op naam van ${esc(k.eig)}. Bron: ${k.bronnen.map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener">kadaster 1832${k.bronnen.length > 1 ? " (" + (i + 1) + ")" : ""}</a>`).join(", ")}; kaart: minuutplan 1832 via HisGIS.</p></details>`).join("")}</section>`;
}

/* ---------- beelden in hun tijd ---------- */
/* jaren van een beeld uit de ruwe datum ("1904", "poststempel 03-08-1921", "1923, ca.", "1901-1925", "1880s"); null = onbekend */
function imgYears(raw) {
  const s = String(raw || "").replace(/\s*date QS:[\s\S]*$/, ""), /* Wikidata-datums: "between 1777 and 1820 date QS:P,+1500-…" (het +1500 is alleen de precisie) */ ys = (s.match(/(?<!\d)(1[5-9]\d\d|20[0-2]\d)(?!\d)/g) || []).map(Number);
  return ys.length ? [Math.min(...ys), Math.max(...ys) + (/\d{4}s\b/.test(s) ? 9 : 0)] : null;
}
const yearLabel = ys => !ys ? "" : ys[0] === ys[1] ? String(ys[0]) : `${ys[0]}–${ys[1]}`;
const isMapImg = a => a.soort === "kaart" || a.soort === "kadaster";
/* afstand in jaren tussen een beeld en een periode [a, z] (0 = binnen de periode) */
const yearGap = (ys, a, z) => Math.max(0, a - ys[1], ys[0] - z);
/* per plaats de jaren dat iemand er was, bij benadering: van de eerste gebeurtenis daar tot de eerste gebeurtenis elders
   daarna, binnen het leven. Zonder geboorte- of sterfjaar: 70 jaar geschat. Nooit voor levenden, of wie na 1910 is geboren
   zonder bekende sterfdatum (zoals bij de portretten). */
const SPANS = {};
function placeSpans(p) {
  const c = SPANS[T.key] || (SPANS[T.key] = {}); if (c[p.kw]) return c[p.kw];
  const out = c[p.kw] = {};
  if (!p || p.living || (!p.d && (yr(p.b) || 0) > 1910)) return out;
  /* alleen echte plaatsen: een gebeurtenis "in Schoterland" (gemeente) zegt niet dat iemand in de hoofdplaats woonde */
  const ev = lifeEvents(p).filter(e => e.p && PLACES[e.p] && !isGemeente(e.p)), ys = ev.map(e => e.y).filter(y => y != null);
  let b = yr(p.b), d = yr(p.d);
  if (b == null) b = d != null ? d - 70 : ys.length ? Math.min(...ys) - 25 : null;
  if (b == null) return out;
  if (d == null) d = Math.max(b + 70, ...ys);
  ev.forEach((e, i) => {
    const k = e.p, y0 = Math.min(d, Math.max(b, e.y ?? b));
    const nx = ev.slice(i + 1).find(f => f.y != null && f.p !== k);
    const y1 = /^overleden/.test(e.t) ? y0 : Math.max(y0, nx ? nx.y : d);
    const s = out[k] || (out[k] = { k, a: y0, z: y1, i: Object.keys(out).length });
    s.a = Math.min(s.a, y0); s.z = Math.max(s.z, y1);
  });
  return out;
}
/* archiefbeelden van een plaats (ook gekoppelde, met p), met hun jaren */
let ARCH_PLACE = null;
function archOfPlace(k) {
  if (!ARCH_PLACE) {
    ARCH_PLACE = {};
    ARCH_ALL.forEach(a => { a.ys = imgYears(a.datum); const k = a.kws ? a.p : a.key; if (k) (ARCH_PLACE[k] || (ARCH_PLACE[k] = [])).push(a.kws ? Object.assign({}, a, { key: k }) : a); });
  }
  return ARCH_PLACE[k] || [];
}
/* wie uit de huidige boom was er in plaats k rond de jaren ys (zonder jaren: iedereen uit die plaats), dichtstbij eerst */
const AT_PLACE = {};
function peopleAt(k, ys, tol = 10) {
  /* per boom één keer: per plaats wie er (ooit) was, zodat niet voor elk beeld alle voorouders doorlopen worden */
  const ix = AT_PLACE[T.key] || (AT_PLACE[T.key] = (() => { const o = {}; ancestors.forEach(p => Object.keys(placeSpans(p)).forEach(pk => (o[pk] || (o[pk] = [])).push(p))); return o; })());
  return (ix[k] || []).map(p => { const s = placeSpans(p)[k]; return s && (!ys || yearGap(ys, s.a - tol, s.z + tol) === 0) ? [p, ys ? yearGap(ys, s.a, s.z) : 0, s] : null; })
    .filter(Boolean).sort((x, y) => x[1] - y[1] || x[2].a - y[2].a).map(x => x[0]);
}
/* archiefbeelden van de plaatsen uit één leven, uit de jaren dat de persoon er was (foto's ±10 jaar), plus per plaats de
   oude kaart die het dichtst bij die jaren ligt (kadaster 1832, topografische kaarten 1865/1900/1950; hooguit 40 jaar ernaast).
   Om de beurt per plaats, in de volgorde van het leven, zodat de eerste beelden alle plaatsen laten zien. */
function lifeArch(p) {
  const mine = [p.kw, ...twinKws(p.kw)].map(imgKey);
  const per = Object.values(placeSpans(p)).sort((x, y) => x.i - y.i).map(s => {
    const its = archOfPlace(s.k).filter(a => a.ys && (isMapImg(a) || a.ys[1] - a.ys[0] <= 50) && !(a.kws && a.kws.some(k => mine.includes(k)))); /* eigen koppelingen staan al onder "Uit de archieven" */
    let fotos = its.filter(a => !isMapImg(a) && yearGap(a.ys, s.a - 10, s.z + 10) === 0).sort((x, y) => yearGap(x.ys, s.a, s.z) - yearGap(y.ys, s.a, s.z) || x.ys[0] - y.ys[0]);
    /* afwisseling: van een reeks met dezelfde datum (een fotoreportage) eerst hooguit twee, de rest achteraan */
    const nd = {}; fotos = fotos.filter(a => (nd[a.datum] = (nd[a.datum] || 0) + 1) <= 2).concat(fotos.filter(a => nd[a.datum] > 2 && (nd[a.datum + "#"] = (nd[a.datum + "#"] || 0) + 1) > 2));
    const m = its.filter(isMapImg).map(a => [a, yearGap(a.ys, s.a, s.z)]).sort((x, y) => x[1] - y[1] || (y[0].soort === "kadaster") - (x[0].soort === "kadaster"))[0];
    return { s, list: fotos, map: m && m[1] <= 40 ? m[0] : null };
  });
  /* eerst de foto's, om de beurt per plaats; daarna de kaarten */
  const out = [], tag = (a, s) => Object.assign({}, a, { at: s });
  for (let r = 0; per.some(x => x.list[r]); r++) per.forEach(x => { if (x.list[r]) out.push(tag(x.list[r], x.s)); });
  per.forEach(x => { if (x.map) out.push(tag(x.map, x.s)); });
  /* wie vóór ±1780 leefde: de stadsplattegrond of de grietenijkaart van Schotanus (1664/1718) van die plaats */
  const seen = new Set(), add = (k, s) => [imgOf("stadsplan", k), gemMap((PLACES[k] || {}).gem)].filter(Boolean).forEach(im => {
    if (seen.has(im.id)) return; seen.add(im.id);
    out.push({ id: im.id, key: k, soort: "kaart", page: true, ys: imgYears(im.datum) || [1664, 1664], at: s });
  });
  per.forEach(({ s }) => { if (s.a <= 1780 && s.z >= 1600) add(s.k, s); });
  /* ook als alleen de gemeente (grietenij) bekend is, bv. "gedoopt in Schoterland" */
  let yb = yr(p.b), yd = yr(p.d); if (yb == null && yd != null) yb = yd - 70; if (yd == null && yb != null) yd = yb + 70;
  if (yb != null && yb <= 1780 && yd >= 1600 && !p.living) lifeEvents(p).forEach(e => { if (e.p && isGemeente(e.p)) add(e.p, null); });
  return out;
}
/* leesbare titel: bij Nationaal Archief/Anefo-foto's is de titel alleen een nummer ("Bestanddeelnr 903-7400");
   dan de beschrijving of serie uit de bronbeschrijving */
/* Rijksmuseum-metadata zoals Commons die overneemt: "Identificatie Titel(s): … Objecttype: prent Objectnummer: RP-P-… Vervaardiger: …
   Datering: …" → losse velden; rmTitel = de eerste titel zonder "(titel op object)", rmDesc = een korte, leesbare beschrijving */
const RM_VELD = ["Titel(s)", "Objecttype", "Objectnummer", "Catalogusreferentie", "Opmerking", "Opschriften / Merken", "Omschrijving", "Vervaardiging", "Vervaardiger", "Datering", "Fysieke kenmerken", "Materiaal", "Techniek", "Afmetingen", "Onderwerp", "Wat", "Waar", "Wie", "Wanneer", "Verwerving en rechten", "Verwerving", "Copyright", "Credit"];
function rmMeta(d) {
  d = String(d || ""); if (!/^Identificatie Titel\(s\):/.test(d)) return null;
  const rx = new RegExp("(" + RM_VELD.map(v => v.replace(/[()/]/g, "\\$&")).join("|") + "):\\s*", "g"), o = {}; let m, last = null, at = 0;
  while ((m = rx.exec(d))) { if (last) o[last] = (o[last] ? o[last] + " " : "") + d.slice(at, m.index).trim(); last = m[1]; at = rx.lastIndex; }
  if (last) o[last] = d.slice(at).trim();
  return o;
}
const rmTitel = o => o && o["Titel(s)"] ? o["Titel(s)"].split(/\.\s+|\s+\/\s+/)[0].replace(/\s*\(titel op object\)/, "").replace(/[.\s…]+$/, "") : "";
function rmDesc(o) {
  if (!o) return "";
  const wie = (o.Vervaardiger || "").replace(/…$/, "").split(/,\s*(?=[a-z]+:)/).map(x => x.replace(/^[a-z ]+:\s*/, "").trim()).filter(x => x && !/anoniem/i.test(x));
  const soort = (o.Objecttype || "").replace(/…$/, "").trim(), dat = (o.Datering || "").replace(/…$/, "").trim();
  const zin = [soort ? soort[0].toUpperCase() + soort.slice(1) : "", wie.length ? "door " + wie.join(" en ") : "", dat ? "(" + dat + ")" : ""].filter(Boolean).join(" ");
  const oms = (o.Omschrijving || "").replace(/…$/, "").trim();
  return [oms, zin ? zin + "." : "", o.Objectnummer ? "Rijksmuseum, " + o.Objectnummer.replace(/…$/, "").trim() + "." : ""].filter(Boolean).join(" ");
}
const descOf = im => { const o = rmMeta(im.desc); return o ? rmDesc(o) : im.desc || ""; };
function niceTitle(im) {
  const rm = rmTitel(rmMeta(im.desc)); if (rm) return rm;
  /* RCE-titels: "Voor- en zijgevel nr. L 3012 - Oldeholtwolde - 20488737 - RCE" → "Voor- en zijgevel"; objectnummers van het Rijksmuseum eraf */
  const t = String(im.t || "").replace(/,\s*(?:RP|SK|BK|NG|KOG)-[A-Z0-9][\w.-]*$/, "").replace(/(?:\s+nr\.\s*[A-Z]?\s*\d+)?\s+-\s+[^-]+\s+-\s+\d{6,}\s+-\s+RCE\s*$/, "").replace(/^(.+?)\s*-\s*\d{6,}\s*-\s*RCE\s*$/, "$1");
  if (!/bestanddeelnr|archiefnr/i.test(t)) return t;
  const d = String(im.desc || ""), m = /Beschrijving\s*:\s*(.+?)(?:\s+(?:Datum|Locatie|Trefwoorden|Fotograaf)\s*:|…|$)/.exec(d) || /Serie\s*:\s*(.+?)(?:\s+(?:Annotatie|Beschrijving|Datum)\s*:|…|$)/.exec(d);
  return m ? m[1].trim() : t;
}
/* het werk in hun tijd: oude beelden van het werk uit het beroep (occ), uit de jaren dat iemand werkte (vanaf 15 jaar, ±15)
   en uit de eigen plaatsen of hooguit 30 km daarvandaan; eigen plaatsen eerst, dan de dichtstbijzijnde */
const WORK = [
  [/\b(boer|boerin|landbouw|veehoud|huisman|bouwman|boerenknecht|boerenmeid|pachtboer|colon|zetboer|boerwerker)/, "boer", "het boerenwerk", /boerderij|\bhooi|melk|koeien|\bvee\b|ploeg|oogst|karn|kop-hals-romp|stelp|zuivel|\bschapen|\bpaard(en)? voor/],
  [/veenbaas|turfmaker|verven/, "veen", "het veenwerk", /\bturf(?!markt)|turfwinning|vervening|\bveenderij|\bveenwerk|baggel|baggeren|petgat|trekgat|legakker|turfschip|turfpraam/],
  [/schipper|schippers/, "schip", "de scheepvaart", /\bschip|schepen|schuit|tjalk|praam|skutsje|skûtsje|haven|beurtschip|\baak\b|zeilboot/],
  [/grutter/, "grutterij", "de grutterij", /grutter|\bgort|pelmolen/],
  [/herberg|kastelein|hospes|tapper/, "herberg", "herbergen en cafés", /herberg|\bcaf[eé]|logement|kastelein|uitspanning/],
  [/winkelier|koopman|koopvrouw/, "winkel", "winkels en handel", /winkel|kruidenier|marskramer|venter/],
  [/bakker/, "bakker", "bakkerijen", /bakker/],
  [/timmer|molenmaker/, "timmer", "het timmerwerk", /timmer|scheepswerf|\bwerf\b|molenmaker/],
  [/sluiswachter/, "sluis", "sluizen", /\bsluis/],
  [/wever/, "wever", "het weven", /wever|weverij|weefgetouw/]
];
const workOf = p => { const o = norm(p.occ || ""); return o ? WORK.find(w => w[0].test(o)) || null : null; };
function workArch(p, skip) {
  const w = workOf(p); if (!w) return null;
  const sp = placeSpans(p), own = Object.keys(sp); if (!own.length) return null;
  const b = Math.min(...own.map(k => sp[k].a)), z = Math.max(...own.map(k => sp[k].z)), a = Math.min(z, b + 15);
  const near = k => own.includes(k) ? 0 : Math.min(...own.map(o => kmBetween(o, k) ?? 999));
  const out = [];
  Object.keys(ARCH_PLACE || (archOfPlace(""), ARCH_PLACE)).forEach(k => {
    if (!PLACES[k]) return; const d = near(k); if (d > 30) return;
    archOfPlace(k).forEach(x => { if (!x.ys || isMapImg(x) || x.ys[1] - x.ys[0] > 30 || skip.has(x.id) || yearGap(x.ys, a - 15, z + 15) > 0) return;
      if (w[3].test(norm(x.t + " " + x.desc))) out.push(Object.assign({}, x, { d, g: yearGap(x.ys, a, z) })); });
  });
  out.sort((x, y) => (x.d > 0) - (y.d > 0) || x.g - y.g || x.d - y.d);
  return { w, list: out };
}
/* archieffoto's uit de tijd van een groep voorouders (een familielijn, de hele boom): eerst de beelden waar de meeste van
   hen toen woonden, om de beurt per plaats. Elk item krijgt who = de voorouders die er toen waren. */
function groupArch(ps) {
  const by = {};
  ps.forEach(p => lifeArch(p).forEach(a => { if (isMapImg(a)) return; const e = by[a.id] || (by[a.id] = Object.assign({}, a, { who: [] })); e.who.push(p); }));
  const pl = {};
  Object.values(by).sort((x, y) => y.who.length - x.who.length || x.ys[0] - y.ys[0]).forEach(a => (pl[a.key] || (pl[a.key] = [])).push(a));
  const lists = Object.values(pl).sort((x, y) => y[0].who.length - x[0].who.length), out = [];
  for (let r = 0; lists.some(l => l[r]); r++) lists.forEach(l => { if (l[r]) out.push(l[r]); });
  return out;
}
const whoNames = (ps, n = 3) => { const f = ps.slice(0, n).map(firstName); return ps.length > n ? f.join(", ") + ` en ${ps.length - n} anderen` : f.length > 1 ? f.slice(0, -1).join(", ") + " en " + f[f.length - 1] : f[0] || ""; };
/* titel zonder "Plaats: " vooraan (archieven zetten de plaatsnaam er vaak voor) */
const archTitle = (t, k) => { const n = placeName(k), s = String(t || ""); return s.toLowerCase().startsWith(n.toLowerCase() + ": ") ? s.slice(n.length + 2) : s; };
const archCap = (im, a) => a.page ? `${placeName(a.key)}: ${im.t}` : a.soort === "kadaster" ? `${placeName(a.key)}: kadasterkaart van ${yearLabel(a.ys)}` : a.soort === "kaart" && a.ys ? `${placeName(a.key)}: kaart van rond ${yearLabel(a.ys)}`
  : `${placeName(a.key)}${a.ys ? ", " + yearLabel(a.ys) : ""}: ${archTitle(niceTitle(im), a.key)}`;
/* galerij van een vooraf gekozen lijst archiefbeelden (items uit ARCH_ALL, in deze volgorde); laadt alleen de packs van
   wat getoond wordt. cap(im, a) = bijschrift; still() bewaakt dat de pagina intussen niet is gewisseld */
function archStrip(host, list, still, o = {}) {
  if (!host || !list.length) return;
  const n0 = o.n || 12;
  const show = n => Promise.all([...new Set(list.slice(0, n).map(a => a.pack).filter(Boolean))].map(loadPack)).then(() => {
    if (!still() || !host.isConnected) return;
    const its = list.slice(0, n).map(a => IMG_ID[a.id] ? [IMG_ID[a.id], a] : null).filter(Boolean);
    if (!its.length) return;
    host.innerHTML = `${o.head || ""}<div class="pgal arch${o.cls ? " " + o.cls : ""}" data-imggroup>${its.map(([im, a]) => fig(im, { thumb: true, cap: (o.cap || archCap)(im, a), credit: o.credit !== false })).join("")}</div>${list.length > n ? `<p style="margin:10px 0 0"><button class="btn" data-more-arch>${o.step ? `Meer tonen (${list.length - n} over)` : `Toon alle ${list.length.toLocaleString("nl-NL")}`}</button></p>` : ""}${o.foot || ""}`;
    host.hidden = false;
    const more = $("[data-more-arch]", host); if (more) more.onclick = () => { more.disabled = true; more.textContent = "Bezig met laden…"; show(o.step ? n + o.step : list.length); };
  });
  /* lazy: pas laden als de plek in beeld komt (scheelt megabytes op de openingspagina) */
  if (o.lazy && "IntersectionObserver" in window) {
    host.hidden = false;
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); show(n0); } }, { rootMargin: "600px 0px" });
    io.observe(host);
  } else show(n0);
}
/* lichtbak: waarom dit beeld bij een voorouder hoort (why = { "<sleutel>": "reden" }, uit de beeldkoppeling in het register) */
function lbWhy(im) {
  const rs = Object.entries(im.why || {}).map(([k, t]) => [all.find(q => !q.living && imgKey(q.kw) === k), t]).filter(x => x[0] && x[1]);
  /* dezelfde reden voor meer personen (bv. een echtpaar) één keer */
  const by = []; rs.forEach(([q, t]) => { const g = by.find(x => x.t === t); if (g) g.ps.push(q); else by.push({ t, ps: [q] }); });
  const names = ps => ps.map(q => `<button class="link" data-open="${q.kw}">${esc(q.n)}</button>`).reduce((a, b, i, arr) => a + (i === 0 ? "" : i === arr.length - 1 ? " en " : ", ") + b, "");
  return by.length ? `<div class="lbwhy">${by.map(g => `<p>${names(g.ps)}: ${esc(g.t)}</p>`).join("")}</div>` : "";
}
/* waarom en wie samen; op smalle schermen ingeklapt, zodat het beeld zichtbaar blijft */
function lbPeople(im) {
  const w = lbWhy(im), h = lbWho(im); if (!w && !h) return "";
  const n = Object.keys(im.why || {}).length;
  return innerWidth >= 700 ? w + h : `<details class="lbmore"><summary>${n ? `Waarom bij ${n === 1 ? "deze voorouder" : `deze ${n} voorouders`}` : "Wie woonden hier toen"}${n && h ? " · wie woonden er toen" : ""}</summary>${w}${h}</details>`;
}
/* lichtbak: wie uit de stamboom was er toen dit beeld gemaakt werd (alleen archiefbeelden van een plaats) */
function lbWho(im) {
  const k = im.kws ? im.p : im.key; /* een gekoppeld beeld (kws) houdt zijn plaats in p */
  if (!im.arch || !k || !PLACES[k] || PLACES[k].seat) return "";
  const ys = imgYears(im.datum), ps = peopleAt(k, ys), N = innerWidth < 560 ? 4 : 10;
  if (!ps.length) return "";
  const lab = ys ? `In ${esc(placeName(k))} rond de tijd van ${isMapImg(im) ? "deze kaart" : "dit beeld"}:` : `Voorouders uit ${esc(placeName(k))}:`;
  return `<div class="lbwho"><span class="small">${lab}</span>${ps.slice(0, N).map(p => `<button class="chip" data-open="${p.kw}">${esc(firstName(p))} ${esc(shortSur(splitName(p.n).sur))} <span class="mono">${esc(lifeYears(p))}</span></button>`).join("")}${ps.length > N ? `<button class="chip" data-go="${slug(k)}">en ${ps.length - N} anderen</button>` : ""}</div>`;
}
/* rechtenaanduiding leesbaar: archieven leveren vaak alleen een URL (rightsstatements.org, creativecommons.org) */
const RS = { "InC": "auteursrecht voorbehouden", "InC-EDU": "auteursrecht, onderwijsgebruik", "InC-NC": "auteursrecht, niet-commercieel", "InC-OW-EU": "auteursrecht, verweesd werk", "InC-RUU": "auteursrecht, rechthebbende onbekend", "NoC-NC": "geen auteursrecht, niet-commercieel", "NoC-OKLR": "geen auteursrecht, andere beperkingen", "NoC-CR": "geen auteursrecht, contractuele beperkingen", "NoC-US": "geen auteursrecht in de VS", "CNE": "auteursrecht niet onderzocht", "UND": "auteursrecht onbepaald", "NKC": "geen bekend auteursrecht" };
function licLabel(lic) {
  /* sommige archieven leveren een "url" met spaties en in hoofdletters ("HTTP:  CREATIVECOMMONS.ORG PUBLICDOMAIN MARK 1.0"): eerst gelijktrekken */
  let l = String(lic || "").trim(), m;
  if (/^https?:\s*\/*\s*creativecommons\.org\s+/i.test(l)) l = l.toLowerCase().replace(/^https?:\s*\/*\s*/, "https://").replace(/\s+/g, "/").replace(/\/mark\/1\.0$/, "/mark/1.0");
  if (/publicdomain\/mark|public domain mark/i.test(l)) return "publiek domein";
  if ((m = /rightsstatements\.org\/vocab\/([A-Za-z-]+)/.exec(l))) return RS[m[1]] || m[1];
  if ((m = /creativecommons\.org\/(licenses|publicdomain)\/([a-z-]+)\/?([\d.]+)?/i.exec(l))) return m[1] === "publicdomain" ? (m[2] === "zero" ? "CC0" : "publiek domein") : "CC " + m[2].toUpperCase() + (m[3] ? " " + m[3] : "");
  /* korte vormen uit Commons en Europeana: "Public domain", "BY-SA 3.0", "CC BY-SA 3.0 nl" */
  if (/^public domain(\s+mark(\s+1\.0)?)?$/i.test(l)) return "publiek domein";
  if ((m = /^(?:CC\s+)?(BY(?:-(?:SA|NC|ND|NC-SA|NC-ND))?)\s+([\d.]+)(?:\s+(nl|NL|int))?$/i.exec(l))) return `CC ${m[1].toUpperCase()} ${m[2]}${m[3] && m[3].toLowerCase() === "nl" ? " NL" : ""}`;
  return l;
}
function credit(im) {
  const bn = bronOf(im), raw = im.lic || (bn === "Wikimedia Commons" ? "licentie: zie Commons" : ""), lic = licLabel(raw);
  const url = httpUrl(im.licUrl) ? im.licUrl : httpUrl(raw) ? raw.trim() : "";
  const mk = makerOf(im);
  return [norm(mk) === norm(bn) ? "" : esc(mk), lic ? (url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(lic)}</a>` : esc(lic)) : "", httpUrl(im.bron) ? `<a href="${esc(im.bron)}" target="_blank" rel="noopener">${esc(bn)}</a>` : esc(bn)].filter(Boolean).join(" · ");
}
/* heel kleine beelden (langste zijde < 200 px, bv. een miniatuur van 48 px uit een online stamboom) niet wazig opblazen: hooguit dubbele grootte */
const TINY = 200, isTiny = im => !!(im && im.w && im.h && Math.max(im.w, im.h) < TINY), tinyCss = im => isTiny(im) ? `width:${im.w * 2}px;height:auto;max-width:100%;margin:auto;object-fit:contain` : "";
function fig(im, o = {}) {
  if (!im) return "";
  const tiny = tinyCss(im);
  return `<figure class="ph ${o.cls || ""}${tiny ? " tiny" : ""}"><button class="phb" data-img="${im.id}" aria-label="Vergroot: ${esc(im.t)}"><img src="${o.thumb ? im.thumb : im.src}" alt="${esc(o.alt || im.t)}" width="${im.w}" height="${im.h}" loading="lazy" decoding="async"${tiny ? ` style="${tiny}"` : ""}></button>${o.cap === false ? "" : `<figcaption><span class="t">${esc(o.cap || im.t)}</span>${o.credit === false ? "" : `<span class="credit">${credit(im)}</span>`}</figcaption>`}</figure>`;
}
/* archiefverwijzing (ref, leesbare tekst) en origineel (orig, url): optioneel, uit het beeldregister */
/* datum van een beeld leesbaar maken (de ruwe waarde uit Commons of het archief blijft in de data staan) */
const EN_MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
function beeldDatum(raw) {
  let d = String(raw || "").replace(/\s*date QS:.*$/i, "").replace(/…$/, "").trim();
  if (!d) return "";
  let m;
  if ((m = /^(\d{4})s$/.exec(d))) return "jaren " + m[1];
  if ((m = /^between (\d{3,4}) and (\d{3,4})$/i.exec(d))) return `tussen ${m[1]} en ${m[2]}`;
  if ((m = /^(\d{4})-(\d\d)-(\d\d)(?:[ T][\d:]+)?$/.exec(d))) return `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
  if ((m = /^(\d{4})-(\d\d)$/.exec(d))) return `${MONTHS[+m[2] - 1]} ${m[1]}`;
  if ((m = /^(\d\d?)-(\d\d?)-(\d{4})$/.exec(d))) return `${+m[1]} ${MONTHS[+m[2] - 1]} ${m[3]}`;
  if ((m = /^(?:taken on )?(\d\d?) ([a-z]+) (\d{4})(?:\s*\((.*)\))?$/i.exec(d)) && EN_MONTHS.includes(m[2].toLowerCase())) {
    const t = `${+m[1]} ${MONTHS[EN_MONTHS.indexOf(m[2].toLowerCase())]} ${m[3]}`;
    return /upload/i.test(m[4] || "") ? t + " (geüpload)" : t;
  }
  return d;
}
const httpUrl = u => /^https?:\/\//i.test(String(u || "").trim());
const refLine = im => [im.ref ? esc(nlNaam(im.ref)) : "", httpUrl(im.orig) ? `<a href="${esc(im.orig.trim())}" target="_blank" rel="noopener">origineel bekijken</a>` : ""].filter(Boolean).join(" · ");
/* naamsvermelding bij een rij tegels: inklapbaar (scheelt op de telefoon een halve pagina); de lichtbak toont hem ook per beeld */
const credits = ims => { const u = ims.filter((x, i, a) => x && a.indexOf(x) === i); return u.length ? `<details class="small mcredit"><summary>Bronnen en makers van ${u.length > 1 ? `deze ${u.length} beelden` : "dit beeld"}</summary>${u.map(credit).join("; ")}</details>` : ""; };
function placeTile(k, sub, title, sub2) {
  const im = tileImg(k), key = PLACES[k] && PLACES[k].seat ? PLACES[k].seat : k;
  return `<button class="ptile${im ? (im.soort === "omslag" ? " hist" : "") : " noimg"}" data-go="${slug(key)}">${im ? `<img src="${im.thumb}" alt="" loading="lazy" decoding="async">` : ""}<span class="cap"><b>${esc(title || placeName(key))}</b>${sub ? `<small>${esc(sub)}</small>` : ""}${sub2 ? `<small class="l2" title="${esc(sub2)}">${esc(sub2)}</small>` : ""}</span></button>`;
}
/* tweede regel bij een historische tegel: jaar van het beeld en wie er toen woonden */
const histLine = k => { const im = placeHist(k); if (!im) return ""; const ys = imgYears(im.datum), n = ys ? peopleAt(im.key, ys).length : 0; return ys ? `beeld ${ys[1] - ys[0] > 5 ? "ca. " + Math.round((ys[0] + ys[1]) / 20) * 10 : yearLabel(ys)}${n ? ` · toen ${n === 1 ? "1 voorouder" : n + " voorouders"}` : ""}` : ""; };
function topPlaces(ps, n) {
  const c = {}; ps.forEach(p => lifeEvents(p).forEach(e => { const k = e.p && PLACES[e.p] && !isGemeente(e.p) ? e.p : null; if (k) c[k] = (c[k] || 0) + 1; })); /* gemeente-gebeurtenissen niet bij de hoofdplaats tellen */
  return Object.entries(c).sort((a, b) => b[1] - a[1]).filter(x => tileImg(x[0])).slice(0, n);
}
const lb = $("#lb"); let lbList = [], lbI = 0, lbFocus = null;
function openLb(id, list) {
  lbList = list && list.length ? list : [id]; lbI = Math.max(0, lbList.indexOf(id));
  if (lb.hidden) lbFocus = document.activeElement;
  lb.hidden = false; showLb(); $("#lbClose").focus();
}
/* kw (in de huidige boom) van de persoon op een persoonsbeeld, via imgKey: werkt in alle drie de bomen */
/* kw (in de huidige boom) van de eerste voorouder op een archiefbeeld; kws zijn sleutels als "42" of "a-42" */
const archKw = im => { const ks = (im.kws || []).map(String); const p = ks.length ? all.find(q => ks.includes(imgKey(q.kw))) : null; return p ? p.kw : null; };
const persKw = im => { const p = all.find(q => imgKey(q.kw) === String(im.key)); return p ? p.kw : null; };
/* verkleinde archiefbeelden (besluit B2): een regel met de getoonde en de originele maat, een link naar het origineel, en als er een
   directe beeld-url is (oi) de knop "Toon origineel": pas bij een klik wordt het externe beeld geladen, in dezelfde lichtbak
   (nooit vanzelf: zo maakt een bezoeker pas contact met de bron als hij erom vraagt). Mislukt het, dan blijft de eigen versie staan.
   In de artifact-variant mag de pagina geen externe beelden laden: daar alleen de link. */
const EXTERN_BEELD = !/usercontent\./.test(location.hostname); /* de artifact-variant draait op een usercontent-domein met een strikte CSP */
const px = (w, h) => `${Number(w).toLocaleString("nl-NL")} × ${Number(h).toLocaleString("nl-NL")} px`;
const verkleind = im => im.ow && im.oh && im.w && Math.max(im.ow, im.oh) > Math.max(im.w, im.h) + 8;
function lbOrig(im) {
  if (!verkleind(im)) return "";
  const toon = im.oi && EXTERN_BEELD ? `<button class="link" id="lbToon" type="button">Toon origineel (${px(im.ow, im.oh)})</button>` : "";
  const link = im.ou ? `<a href="${esc(im.ou)}" target="_blank" rel="noopener">Origineel bij ${esc(bronNaamKort(im))} ↗</a>` : "";
  return `<p class="lbverkl" id="lbVerkl"><span>Verkleind: getoond ${px(im.w, im.h)}, origineel ${px(im.ow, im.oh)}.</span> ${[toon, link].filter(Boolean).join(" · ")}</p>`;
}
const bronNaamKort = im => (nlNaam(im.bronNaam || "").split(/[,(»:]/)[0] || "de bron").trim();
function lbToonOrigineel(im) {
  const img = $("#lbImg"), b = $("#lbToon"), r = $("#lbVerkl"); if (!img || !b) return;
  if (img.dataset.orig === im.id) { /* terug naar de eigen versie */
    img.src = im.src; img.width = im.w; img.height = im.h; delete img.dataset.orig; lb.classList.remove("lbvol");
    b.textContent = `Toon origineel (${px(im.ow, im.oh)})`; const v = $("#lbVol"); if (v) v.remove(); return;
  }
  b.disabled = true; b.textContent = "Origineel laden…"; lb.classList.add("lblaad");
  const pre = new Image(); pre.decoding = "async";
  pre.onload = () => {
    lb.classList.remove("lblaad"); if (lb.hidden || IMG_ID[lbList[lbI]] !== im) return;
    img.src = im.oi; img.width = pre.naturalWidth; img.height = pre.naturalHeight; img.dataset.orig = im.id;
    b.disabled = false; b.textContent = "Toon de verkleinde versie";
    if (!$("#lbVol")) b.insertAdjacentHTML("afterend", ` · <button class="link" id="lbVol" type="button" aria-pressed="false">Volle grootte</button>`);
    $("#lbVol").onclick = e => { const on = lb.classList.toggle("lbvol"); e.currentTarget.setAttribute("aria-pressed", on); e.currentTarget.textContent = on ? "Passend maken" : "Volle grootte"; };
  };
  pre.onerror = () => { lb.classList.remove("lblaad"); b.disabled = false; b.textContent = "Toon origineel"; if (r) { const oud = $(".lbfout", r); if (oud) oud.remove(); } if (r) r.insertAdjacentHTML("beforeend", ` <span class="lbfout">Het origineel kon niet worden geladen; de verkleinde versie blijft staan.</span>`); };
  pre.src = im.oi;
}
function showLb() {
  const im = IMG_ID[lbList[lbI]], img = $("#lbImg");
  lb.classList.remove("lbvol", "lblaad"); delete img.dataset.orig;
  if (!im) { const id = lbList[lbI], a = ARCH_ID[id]; if (a) loadPack(a.pack).then(() => { if (!lb.hidden && lbList[lbI] === id && IMG_ID[id]) showLb(); }); $("#lbCap").innerHTML = `<p class="small">Laden…</p>`; return; }
  lb.classList.remove("lbfail"); img.src = im.src; img.alt = im.t; img.width = im.w; img.height = im.h; img.style.width = isTiny(im) ? im.w * 2 + "px" : "";
  const go2 = (im.soort === "plaats" || im.soort === "stadsplan") && PLACES[im.key] && !PLACES[im.key].seat ?`<button class="btn" data-go="${slug(im.key)}">Over ${esc(placeName(im.key))}</button>`
    : im.soort === "media" ? `<button class="btn" data-media="${esc(im.key)}">Naar de beschrijving</button>`
    : im.soort === "persoon" && persKw(im) && curKw !== persKw(im) ? `<button class="btn" data-open="${persKw(im)}">Naar het profiel</button>`
    : im.soort === "persoon" && persKw(im) ? ""
    : im.soort === "persoon" && !im.arch ? `<button class="btn" data-go="verwanten">Naar bekende verwanten</button>`
    : im.arch && archKw(im) && curKw !== archKw(im) ? `<button class="btn" data-open="${archKw(im)}">Naar het profiel</button>`
    : im.arch && PLACES[im.key] && !PLACES[im.key].seat && route.sub !== im.key ? `<button class="btn" data-go="${slug(im.key)}">Over ${esc(placeName(im.key))}</button>` : "";
  const vs = (im.vh || []).map(v => STORIES.find(x => x.id === v[0])).filter(x => x && !(route.view === "verhalen" && route.sub === x.id));
  const go3 = vs.map(x => `<button class="btn" data-go="verhaal-${x.id}">Verhaal: ${esc(x.title)}</button>`).join("");
  const lbT = im.arch ? niceTitle(im) : im.t, same = d => [lbT, archTitle(lbT, im.p || im.key)].some(x => norm(x).replace(/[.\s]+$/, "") === norm(d).replace(/[.\s]+$/, ""));
  $("#lbCap").innerHTML = `<div class="lbt"><b>${esc(lbT)}</b>${lbList.length > 1 ? `<span class="mono small">${lbI + 1} / ${lbList.length}</span>` : ""}</div>${descOf(im) && !same(descOf(im)) ? `<p>${esc(descOf(im))}</p>` : ""}<p class="credit">${beeldDatum(im.datum) ? esc(beeldDatum(im.datum)) + " · " : ""}${credit(im)}${refLine(im) ? `<br>Bron: ${refLine(im)}` : ""}</p>${lbOrig(im)}${typeof lbAkte === "function" ? lbAkte(im) : "" /* akte-tekst */}${lbPeople(im)}${go2 || go3 ? `<div class="lbacts">${go2}${go3}</div>` : ""}`;
  /* lange titels: drie regels, tik of Enter klapt uit (anders wordt de foto op de telefoon te klein) */
  const tb = $("#lbCap .lbt b");
  if (tb && tb.scrollHeight > tb.clientHeight + 2) {
    tb.classList.add("more"); tb.tabIndex = 0; tb.setAttribute("role", "button"); tb.setAttribute("aria-expanded", "false"); tb.title = "Toon de hele titel";
    const tog = () => { const o = tb.classList.toggle("open"); tb.setAttribute("aria-expanded", o); tb.title = o ? "Titel inklappen" : "Toon de hele titel"; };
    tb.onclick = tog; tb.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tog(); } };
  }
  const tn = $("#lbToon"); if (tn) tn.onclick = () => lbToonOrigineel(im);
  $("#lbPrev").hidden = $("#lbNext").hidden = lbList.length < 2;
}
function stepLb(d) { if (lbList.length < 2) return; lbI = (lbI + d + lbList.length) % lbList.length; showLb(); }
function closeLb(silent) { lb.hidden = true; $("#lbImg").removeAttribute("src"); if (!silent && lbFocus && lbFocus.focus) lbFocus.focus(); }
$("#lbClose").onclick = () => closeLb();
$("#lbPrev").onclick = () => stepLb(-1);
$("#lbNext").onclick = () => stepLb(1);
lb.addEventListener("click", e => { if (e.target === lb || e.target.classList.contains("lbstage")) closeLb(); });
lb.addEventListener("keydown", e => trapFocus(lb, e)); /* gedeelde focusval: zie "focus vasthouden" */
let lbX = null;
lb.addEventListener("touchstart", e => { lbX = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
lb.addEventListener("touchend", e => { if (lbX === null) return; const dx = e.changedTouches[0].clientX - lbX; lbX = null; if (Math.abs(dx) > 50) stepLb(dx < 0 ? 1 : -1); }, { passive: true });
document.addEventListener("error", e => {
  const t = e.target; if (!t || t.tagName !== "IMG") return;
  if (t.id === "lbImg") { if (t.getAttribute("src")) lb.classList.add("lbfail"); return; }
  const f = t.closest(".ph"); if (f) { f.classList.add("broken"); return; }
  const pt = t.closest(".ptile"); if (pt) { pt.classList.add("noimg"); t.remove(); return; }
  const w = t.closest(".withimg"); if (w) w.classList.remove("withimg"); t.remove();
}, true);
/* een beeldkaart (kerk, plek, krant) op haar subtab van Beeld; achtergrondkaarten staan onder Verhalen */
function goMedia(id) {
  const m = MEDIA.find(x => x.id === id), v = !m ? "beeld" : m.kind === "achtergrond" ? "tijd" : BEELD_KIND[m.kind] || "beeld";
  closeProfile(true); if (!lb.hidden) closeLb(true);
  if (v !== "tijd" && (beeldState.q || route.view !== v)) { beeldState.q = beeldState.raw = ""; rendered[v] = false; } /* een zoekfilter mag de kaart niet verbergen */
  go(v); setTimeout(() => { const n = document.getElementById("m-" + id), z = n && n.closest(".bz.dicht"); if (z) { z.classList.remove("dicht"); const b = $(".bz-meer", z); if (b) b.remove(); } /* een dichtgeklapte sectie eerst openen */
    if (n) { n.scrollIntoView({ block: "center" }); n.classList.add("flash"); setTimeout(() => n.classList.remove("flash"), 1600); } }, 40); }
const kwLinks = t => esc(t).replace(/\bkw (\d+)\b/g, (m, n) => person(+n) ? `<button class="link" data-open="${n}">kw ${n}</button>` : m); /* "kw N" in kinderen en broers/zussen klikbaar */
const BEWIJS_KORT = { A: "staat in een akte", B: "sterk onderbouwd", C: "onzeker, alleen uit online stambomen", D: "hypothese" };
/* profiel: het ?-knopje naast het bewijslabel opent een korte uitleg; Esc of een klik ernaast sluit hem */
function profHelp(open, focusBtn) {
  const d = $("#dHelp"), b = $("#dHelpBtn"); if (!d || !b) return;
  d.hidden = !open; b.setAttribute("aria-expanded", String(open));
  if (!open && focusBtn) b.focus();
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#dHelp") && !$("#dHelp").hidden) { e.preventDefault(); e.stopPropagation(); profHelp(false, true); } }, true);
document.addEventListener("pointerdown", e => { const d = $("#dHelp"); if (d && !d.hidden && !e.target.closest("#dHelp, #dHelpBtn")) profHelp(false); });
/* profiel: "Zo hoort … bij …" als rustige lijst, één rij per generatie, van de hoofdpersoon naar deze persoon */
function kpathHtml(kw) {
  const p = person(kw), ks = []; for (let k = kw; k >= 1; k >>= 1) ks.unshift(k);
  const via = T.key === "s" ? `, via ${ks[1] === 2 ? "Harrie" : "Alies"}` : "";
  const lang = ks.length >= 10, hid = i => lang && i >= 2 && i < ks.length - 3;
  /* de lijn onder een rij is de stap naar de volgende generatie: gestreept bij C, gestippeld bij D */
  const rij = (k, i) => {
    const q = person(k), s = i < ks.length - 1 ? stapSt(ks[i + 1]) : null, w = s === "C" || s === "D" ? " kp-" + s : "";
    const rel = k === 1 ? (T.key === "s" ? "kinderen" : "zelf") : relBase(gen(k) - 1, k);
    const nm = k === 1 && T.key === "s" ? T.rootFull : q ? q.n : "";
    const yrs = q && !q.living && /\d/.test(lifeYears(q)) ? lifeYears(q) : "";
    const naam = k === kw ? `<b>${esc(nm)}</b>` : `<button class="link" data-open="${k}">${esc(nm)}</button>`;
    return `<li class="kp${w}${k === kw ? " kp-nu" : ""}"${hid(i) ? " hidden" : ""}${w ? ` title="De stap naar de volgende generatie: ${s}, ${BEWIJS_KORT[s]}"` : ""}><span class="kp-rel">${esc(rel)}</span><span class="kp-n">${naam}${yrs ? ` <small>${esc(yrs)}</small>` : ""}</span></li>`;
  };
  let li = ks.map(rij);
  if (lang) { const n = ks.length - 5, w = ks.slice(3, -2).map(stapSt).reduce((a, s) => s === "D" || (s === "C" && a !== "D") ? s : a, null);
    li.splice(ks.length - 3, 0, `<li class="kp kp-more${w ? " kp-" + w : ""}"><span class="kp-rel"></span><span class="kp-n"><button type="button" class="link kp-tog" aria-expanded="false">… ${n} generaties …</button></span></li>`); }
  return `<section><h5>Zo hoort ${esc(firstName(p))} bij ${esc(T.key === "s" ? T.rootFull : T.root)}${via}</h5><ol class="kpath">${li.join("")}</ol>${schakelRegel(kw)}</section>`;
}
function openProfile(kw, opts = {}) {
  const p = person(kw);
  if (!p) { if (!drawer.hidden) closeProfile(true); if (opts.fromHistory) setHash(T.prefix + currentToken(), "replace"); return; } /* onbekend nummer: lade dicht, adres van de pagina eronder */
  if (opts.fromHistory && curKw === kw && !drawer.hidden) return; /* popstate en hashchange kunnen allebei vuren */
  if (drawer.hidden) lastFocus = document.activeElement;
  curKw = kw;
  const ln = lineOf(kw);
  const altBits = [p.roep && p.roep !== p.n ? `roepnaam ${p.roep}` : "", p.alt || ""].filter(Boolean).join(" · ");
  const port = portraitOf(kw);
  $("#dHead").innerHTML = `
    <div class="nav2"><button id="dUp" aria-label="Naar het kind in de lijn" title="Naar het kind in de lijn" ${kw === 1 ? "disabled" : ""}>↓</button></div>
    <button class="close" aria-label="Sluiten" id="dClose">×</button>
    <div class="dtitle${port ? " withport" : ""}">${port ? `<button class="dport" data-img="${port.id}" aria-label="Vergroot het portret van ${esc(p.n)}" title="${esc(port.t)}"><img src="${port.thumb}" alt="Portret van ${esc(p.n)}" style="object-position:${cropOf(port)}"></button>` : ""}<div>
    <div class="eyebrow"><abbr title="Kwartiernummer ${kw}: het nummer in de stamboom. De vader van nummer n heeft 2n, de moeder 2n + 1." aria-label="Kwartiernummer ${kw}">kw ${kw}</abbr> · generatie ${ROMAN[gen(kw)]} · ${esc(relTerm(kw))}</div>
    <h2 id="dName">${esc(p.n)}</h2>
    ${altBits ? `<div class="alt">${esc(altBits)}</div>` : ""}</div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      ${ln ? `<button class="chip" style="--c:var(--l${ln})" data-go="lijn-${ln}"><i></i>${p.aliasOf ? "via de lijn" : "familie"} ${esc(LINES[ln].name)}</button>` : ""}
      ${p.living ? `<span class="tag" style="color:var(--muted)">levend</span>` : p.st ? `<span class="tag st-${p.st}" title="Bewijs ${p.st}: ${BEWIJS_KORT[p.st]}. ${esc(STATUS[p.st].long)}" aria-label="Bewijs ${p.st}: ${BEWIJS_KORT[p.st]}">${p.st} · ${STATUS[p.st].label.toLowerCase()}</span>` : ""}
      ${p.living ? "" : chgTag(kw)}
      ${p.link && kw > 1 && person(kw >> 1) ? (() => { const kn = firstName(person(kw >> 1)), rol = isMale(kw) ? "vader" : "moeder"; return `<span class="tag st-${p.link}" title="Dat ${esc(firstName(p))} de ${rol} is van ${esc(kn)}: ${BEWIJS_KORT[p.link]} (${p.link})" aria-label="${rol} van ${esc(kn)}: ${BEWIJS_KORT[p.link]}">${rol} van ${esc(kn)} · ${p.link}</span>`; })() : ""}
      ${p.living ? "" : `<button type="button" class="qhelp" id="dHelpBtn" aria-label="Zo lees je dit profiel" title="Zo lees je dit profiel" aria-expanded="false" aria-controls="dHelp">?</button>`}
    </div>
    ${p.living ? "" : `<div class="dhelp" id="dHelp" role="note" hidden><b>Zo lees je dit profiel.</b> <b>kw</b> is het nummer in de stamboom: de vader van nummer n heeft 2n, de moeder 2n + 1. De letter A tot D zegt hoe sterk het bewijs is, van A (akte) tot D (hypothese). Het tweede label zegt hoe zeker het is dat deze persoon de vader of moeder is van het kind in de lijn. <button type="button" class="link" data-go="bronnen">Meer uitleg</button></div>`}`;
  let h = `<div class="dacts"><button class="btn" id="dTree">Toon in de boom</button><button class="btn" data-go="${kw > 1 ? "stamboom-" + kw : "stamboom"}">Toon in de waaier</button>${vwProfielKnop(kw) ? `<button class="btn" data-go="verwant-${kw}" title="${esc(`Hoe is ${firstName(p)} familie van mij?`)}">Hoe ben ik familie?</button>` : "" /* verwantschap: de haak beslist of de knop er komt */}<button class="btn" id="dShare" type="button" title="Deel een link naar dit profiel">Delen</button><span class="small dshare-ok" id="dShareOk" role="status" aria-live="polite"></span></div>`;
  const tw = twinKws(kw);
  if (tw.length) h += `<p class="stnote implex"><b>${["", "", "Twee", "Drie", "Vier", "Vijf"][tw.length + 1] || tw.length + 1} keer in de stamboom.</b> Deze persoon staat ook als kw ${tw.length > 1 ? tw.slice(0, -1).join(", ") + " en " + tw[tw.length - 1] : tw[0]}, via de ${[...new Set(tw.map(t => LINES[lineOf(t)] && LINES[lineOf(t)].name).filter(Boolean))].map(esc).join("- en ")}-lijn. ${tw.some(t => halfOf(t) !== halfOf(kw)) ? esc(T.key === "s" ? TREES[p.side].parents : T.parents) + " hebben hier gemeenschappelijke voorouders." : "Beide lijnen lopen via " + esc((person(halfOf(kw)) || {}).roep || (person(halfOf(kw)) || {}).n || "") + "."} ${tw.map(t => `<button class="link" data-open="${t}">Bekijk als kw ${t}</button>`).join(" · ")} · <button class="link" data-go="${implexStory(p.side)}">Lees het verhaal</button></p>`;
  if (p.living) {
    h += `<p class="stnote">Van levende familieleden staan op deze site alleen de naam en de plaats in de stamboom.</p>`;
    if (kw === 1 && T.sibs && T.sibs.length) h += `<section><h5>Broers en zussen</h5><p style="margin:0">${esc(T.sibs.join(", "))}. Deze stamboom is ook die van hen.</p></section>`;
    if (kw === 1 && T.kids && T.kids.length) h += `<section><h5>Kinderen</h5><p style="margin:0">${esc(T.kids.join(", "))}. <button class="link" data-tree="s">Hun stamboom, met beide families</button></p></section>`;
  } else {
    h += kortZin(p);
    const rows = [];
    const row = (k, v, f) => { if (v) rows.push([k, v, f ? f.map(x => fieldSt(p, x)).filter(Boolean).sort().pop() : null]); };
    row("Geboren", [fmt(p.b), placeName(p.bp)].filter(Boolean).join(", "), ["b", "bp"]);
    row("Doop", p.bapt);
    if (p.d || p.dp) { const a = age(p); row("Overleden", [fmt(p.d), placeName(p.dp)].filter(Boolean).join(", ") + (a !== null ? ` (${a} jaar)` : ""), ["d", "dp"]); }
    row("Begraven", p.bur, ["bur"]);
    row("Beroep", p.occ);
    row("Geloof", p.rel);
    if (p.m) row("Huwelijk", [p.m.w, p.m.d ? fmt(p.m.d) : "", p.m.p ? placeName(p.m.p) : "", p.m.note || ""].filter(Boolean).join(" · "), ["m"]);
    if (rows.length) h += `<dl class="dl">${rows.map(r => `<dt>${r[0]}</dt><dd>${r[0] === "Beroep" ? occGloss(esc(r[1])) : esc(r[1])} ${r[2] && r[2] !== "A" ? stTag(r[2], true) : ""}</dd>`).join("")}</dl>`;
    if (p.stNote) h += `<p class="stnote"><b>Bewijs:</b> ${esc(p.stNote)}</p>`;
    else if (p.st !== "A") h += `<p class="stnote"><b>Bewijs:</b> ${esc(STATUS[p.st].long)}</p>`; /* bij A zegt het label in de kop al genoeg */
  }
  let archBeeld = [], archGal = () => "";
  if (!p.living) {
    const pi = [...new Set([kw, ...twinKws(kw)].flatMap(persImgs))];
    pi.sort((a, b) => (b.portret ? 1 : 0) - (a.portret ? 1 : 0));
    const why = im => [kw, ...twinKws(kw)].map(k => (im.why || {})[imgKey(k)]).find(Boolean);
    /* bovenaan alleen het portret; krantenknipsels, akten en ander archiefbeeld staan verderop, bij de akten */
    const por = pi.filter(i => i.portret); archBeeld = pi.filter(i => !i.portret);
    const gal = (titel, ims) => `<section><h5>${titel}</h5><div class="pgal" data-imggroup>${ims.map(im => fig(im, { thumb: true, cap: why(im) || undefined })).join("")}</div></section>`;
    if (por.length) h += gal(por.length > 1 ? "Portretten" : "Portret", por);
    archGal = ims => ims.length ? gal("Uit het archief", ims) : "";
  }
  /* familie bij elkaar: ouders, partner, kind in de lijn; daaronder alle kinderen en broers en zussen */
  h += `<section class="dfam"><h5>Familie</h5><div class="family">${pbtn(kw * 2, "vader")}${pbtn(kw * 2 + 1, "moeder")}${kw > 1 ? pbtn(kw % 2 ? kw - 1 : kw + 1, kw % 2 ? "echtgenoot" : "echtgenote") : ""}${kw > 1 ? pbtn(kw >> 1, T.key === "s" && kw < 4 ? "kinderen" : isMale(kw >> 1) ? "zoon" : "dochter") : ""}</div>${p.kids && p.kids.length ? `<h6>Kinderen</h6><ul>${p.kids.map(k => `<li>${kwLinks(k)}</li>`).join("")}</ul>` : ""}${p.sibs && p.sibs.length ? `<h6>Broers en zussen</h6><ul>${p.sibs.map(k => `<li>${kwLinks(k)}</li>`).join("")}</ul>` : ""}</section>`;
  if (kw > 3) h += kpathHtml(kw);
  const ev = p.living ? [] : lifeEvents(p).filter(e => e.p);
  if (ev.length) h += `<section><h5>Levensloop</h5><ul class="restl">${ev.map(e => `<li><span class="y">${e.y ?? "?"}</span><span>${PLACES[e.p] && !PLACES[e.p].seat ? `<button class="link" data-go="${slug(e.p)}">${esc(placeName(e.p))}</button>` : `<b style="font-weight:600">${esc(placeName(e.p))}</b>`} · ${esc(e.t)} ${e.st && e.st !== "A" ? stTag(e.st) : ""}</span></li>`).join("")}</ul>${ev.some(e => PLACES[e.p]) ? `<div class="pane lifemap" id="dLifeMap"></div><p style="margin:10px 0 0"><button class="link" id="dMap">Toon de levensloop op de grote kaart</button></p>` : ""}</section>`;
  if (p.notes && p.notes.length) h += `<section class="notes"><h5>Weetjes</h5>${p.notes.map(n => { const o = noteObj(n); return `<p class="${o.k ? "k" : ""}">${geldw(esc(o.t))} ${kindTag(o.k)}</p>`; }).join("")}</section>`;
  const sts = storiesOf(kw);
  if (sts.length) h += `<section><h5>In de verhalen</h5><div class="links">${sts.map(s => `<button class="chip" data-go="verhaal-${s.id}">${esc(s.title)}</button>`).join("")}</div></section>`;
  const nts = NOTABLES.filter(N => N.verdict !== "geen verband" && N.kws.some(k => [kw, ...twinKws(kw)].includes(k)));
  if (nts.length) h += `<section><h5>Bekende verwanten</h5><div class="links">${nts.map(N => `<button class="chip" data-go="verwanten">${esc(N.n)} · ${esc(VERDICT[N.verdict][1].toLowerCase())}</button>`).join("")}</div></section>`;
  const md = mediaOf(kw);
  if (md.length) h += `<section><h5>Beeld</h5><ul class="srclist">${md.map(m => `<li><span class="tag" style="color:var(--muted)">${esc(MEDIA_KINDS[m.kind].label.split(" ")[0].toLowerCase())}</span><button class="link" data-media="${m.id}">${esc(m.t)}</button>${m.unread ? ` <span class="tag" style="color:var(--gold)">nog niet gelezen</span>` : ""}</li>`).join("")}</ul></section>`;
  /* bronnen en scans in één lijst: een Friese akte krijgt een knopje "scan" (AlleFriezen); losse scans zonder eigen bron worden een regel "Scan" */
  const frlOf = u => (/frl:([0-9a-f-]{36})/.exec(u || "") || [])[1] || null;
  const srcG = new Set((p.src || []).map(x => frlOf(x[1])).filter(Boolean)), srcU = new Set((p.src || []).map(x => x[1]).filter(Boolean));
  const losse = (p.scan || []).filter(x => x[1] && !srcU.has(x[1]) && ![...srcG].some(g => x[1].includes(g)));
  h += archGal(archBeeld);
  h += aktenBlok(kw);
  if ((p.src && p.src.length) || losse.length) h += `<section><h5>Bronnen</h5><ul class="srclist">${(p.src || []).map(s => { const t = srcType(s[1], s[0]), g = frlOf(s[1]); return `<li><span class="tag srctag" style="color:var(--muted)">${srcIco(t)}${t}</span><span>${s[1] ? `<a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a>` : esc(s[0])}${g ? ` <a class="scanlink" href="https://allefriezen.nl/zoeken/deeds/${g}" target="_blank" rel="noopener" title="De scan bij AlleFriezen, in een nieuw tabblad">${srcIco("Scan")}scan</a>` : ""}</span></li>`; }).join("")}${losse.map(x => `<li><span class="tag srctag" style="color:var(--muted)">${srcIco("Scan")}Scan</span><a href="${esc(x[1])}" target="_blank" rel="noopener">${esc(x[0])}</a></li>`).join("")}</ul></section>`;
  if (!p.living) { /* hun wereld: plekken, grond, archiefbeelden en tijdbeelden (de lege vakken vullen zich na het openen) */
    const pk = []; lifeEvents(p).forEach(e => { if (!e.p || !PLACES[e.p]) return; if (tileImg(e.p) && !pk.some(x => x[2] === e.p)) pk.push([e.p, (e.y ? e.y + " · " : "") + e.t.split(/[;·]/)[0].trim(), e.p]); });
    if (pk.length) h += `<section><h5>Plaatsen uit dit leven</h5><div class="pstrip">${pk.slice(0, 4).map(x => placeTile(x[0], x[1], placeName(x[2]))).join("")}</div>${credits(pk.slice(0, 4).map(x => tileImg(x[0])))}</section>`;
    h += percelenHtml(kw) + `<section id="dArch" hidden></section><section id="dTijd" hidden></section><section id="dWerk" hidden></section>`;
  }
  if (p.open && p.open.length) h += `<section><h5>Nog uit te zoeken</h5><ul>${p.open.map(n => `<li>${esc(n)}</li>`).join("")}</ul></section>`;
  if (!p.living) h += `<section><h5>Zoek verder</h5><div class="links">${searchLinks(p).map(l => `<a class="chip" href="${esc(l[1])}" target="_blank" rel="noopener">${esc(l[0])}</a>`).join("")}</div></section>`;
  $("#dBody").innerHTML = h;
  drawer.hidden = false; scrim.hidden = false;
  $("#dBody").scrollTop = 0;
  $("#dClose").focus();
  $("#dClose").onclick = () => closeProfile();
  const up = $("#dUp"); if (up) up.onclick = () => openProfile(kw >> 1);
  const hb = $("#dHelpBtn"); if (hb) hb.onclick = () => profHelp($("#dHelp").hidden);
  const kt = $("#dBody .kp-tog"); if (kt) kt.onclick = () => { $$("#dBody .kpath li[hidden]").forEach(li => { li.hidden = false; }); kt.closest("li").remove(); };
  $("#dTree").onclick = () => { closeProfile(true); go(kw > 1 ? "boom-" + kw : "boom"); };
  /* delen: het systeemmenu van de telefoon als dat er is, anders de link kopiëren (de link is alleen het kw-nummer) */
  $("#dShare").onclick = async () => {
    const url = location.href.split("#")[0] + "#" + T.prefix + "kw" + kw, ok = $("#dShareOk");
    const meld = t => { ok.textContent = t; clearTimeout(ok._t); ok._t = setTimeout(() => { ok.textContent = ""; }, 2500); };
    if (navigator.share) { try { await navigator.share({ title: p.n, url }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    try { await navigator.clipboard.writeText(url); meld("Link gekopieerd"); }
    catch (e) { const t = document.createElement("textarea"); t.value = url; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select();
      let gelukt = false; try { gelukt = document.execCommand("copy"); } catch (x) {} t.remove(); meld(gelukt ? "Link gekopieerd" : "Kopiëren lukte niet: " + url); }
  };
  const lm = $("#dLifeMap"); if (lm) lm.appendChild(lifeMap(p));
  const ks = [kw, ...twinKws(kw)], pe = ks.map(k => PACK_IDX.kw[imgKey(k)]).filter(Boolean), iks = ks.map(imgKey);
  if (!p.living && pe.length) { const shown = new Set(ks.flatMap(persImgs).map(i => i.id)); /* niet dubbel: wat al onder "Uit het archief" staat */
  archGallery($("#dArch"), [[...new Set(pe.flatMap(e => e[0]))]], im => !shown.has(im.id) && (im.kws || [im.key]).some(k => iks.includes(String(k))), () => curKw === kw,
    { head: `<h5>Uit de archieven</h5>`, cap: im => { const w = iks.map(k => (im.why || {})[k]).find(Boolean); return w || im.t; },
      sort: (a, b) => !!(b.why) - !!(a.why) }); }
  if (!p.living) {
    const la = lifeArch(p), np = new Set(la.map(a => a.key)).size, fn = esc(firstName(p));
    const wa = workArch(p, new Set(la.map(a => a.id)));
    if (wa && wa.list.length) archStrip($("#dWerk"), wa.list, () => curKw === kw, { n: 4,
      cap: (im, a) => `${a.d ? placeName(a.key) + ` (${Math.round(a.d)} km)` : placeName(a.key)}${a.ys ? ", " + yearLabel(a.ys) : ""}: ${archTitle(niceTitle(im), a.key)}`,
      head: `<h5>Het werk in ${zijnHaar(kw)} tijd</h5><p class="small" style="margin:0 0 10px">${esc((p.occ || "").split(";")[0])}: oude beelden van ${wa.w[2]} uit de jaren dat ${fn} werkte, uit de eigen woonplaatsen of de omgeving (tot 30 km).</p>` });
    archStrip($("#dTijd"), la, () => curKw === kw, { n: innerWidth < 560 ? 4 : 8, head: `<h5>${zijnHaar(kw, true)} plaatsen in ${zijnHaar(kw)} tijd</h5><p class="small" style="margin:0 0 10px">Oude foto's, prenten en kaarten van ${np === 1 ? esc(placeName(la[0].key)) : np + " plaatsen uit dit leven"}, uit de jaren dat ${fn} er was.</p>` });
  }
  const dm = $("#dMap"); if (dm) dm.onclick = () => { closeProfile(true); mapFocusPerson = kw; mapState.place = null; go("kaart"); renderMap(); };
  if (!opts.fromHistory) setHash(T.prefix + "kw" + kw, "push", { profiel: 1, onder: currentToken() });
}
/* klein kaartje met de plaatsen uit één leven, genummerd in volgorde */
function lifeMap(p) {
  const pts = []; lifeEvents(p).forEach(e => { const k = e.p && PLACES[e.p] ? mapKey(e.p) : null; if (k && PLACES[k] && (!pts.length || pts[pts.length - 1].k !== k)) pts.push({ k, y: e.y, lab: placeName(e.p) }); });
  const uniq = [...new Set(pts.map(x => x.k))];
  const xy = uniq.map(k => proj(PLACES[k].la, PLACES[k].lo));
  const xs = xy.map(c => c[0]), ys = xy.map(c => c[1]);
  /* uitsnede rond de plaatsen, minstens 240 breed, in de verhouding van de kaart */
  let w = Math.max(240, Math.max(...xs) - Math.min(...xs) + 120), hgt = w * 0.55;
  if (Math.max(...ys) - Math.min(...ys) + 80 > hgt) { hgt = Math.max(...ys) - Math.min(...ys) + 80; w = hgt / 0.55; }
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const svg = el("svg", { viewBox: `${cx - w / 2} ${cy - hgt / 2} ${w} ${hgt}`, role: "img", "aria-label": "Plaatsen uit het leven van " + p.n, style: "display:block;width:100%;height:auto" });
  drawBase(svg, true, w < 500);
  const k = w / 400;
  const g = el("g", { fill: "none", stroke: lineColor(p.kw), "stroke-width": 2 * k, "stroke-dasharray": `${3 * k} ${4 * k}` }, svg);
  for (let i = 1; i < pts.length; i++) { const a = proj(PLACES[pts[i - 1].k].la, PLACES[pts[i - 1].k].lo), b = proj(PLACES[pts[i].k].la, PLACES[pts[i].k].lo); el("path", { d: `M${a[0]} ${a[1]}L${b[0]} ${b[1]}` }, g); }
  const placed = [];
  uniq.forEach((key, i) => {
    const [x, y] = xy[i], gg = el("g", { class: "place-dot" }, svg);
    el("circle", { cx: x, cy: y, r: 6 * k, fill: lineColor(p.kw), stroke: "var(--surface)", "stroke-width": 2 * k }, gg);
    /* naam rechts van de stip, of links als hij rechts buiten het kaartje valt of een andere naam raakt */
    const lab = (pts.find(q => q.k === key) || {}).lab || key, lw = lab.length * 12 * k * 0.56;
    const sides = [[x + 9 * k, false], [x - 9 * k - lw, true]].filter(([l]) => l >= cx - w / 2 + 2 * k && l + lw <= cx + w / 2 - 2 * k);
    const pick = sides.find(([l]) => labelFits(placed, l, y + 4 * k, lab, 12 * k)) || sides[0] || [x + 9 * k, false], left = pick[1];
    txt(gg, left ? x - 9 * k : x + 9 * k, y + 4 * k, lab, { "font-size": 12 * k, stroke: "var(--surface)", "stroke-width": 3 * k, "paint-order": "stroke", "text-anchor": left ? "end" : "start" });
    if (!PLACES[key].seat) clickable(gg, () => go(slug(key)), placeName(key));
  });
  return svg;
}
function closeProfile(silent) {
  drawer.hidden = true; scrim.hidden = true; curKw = null;
  if (!silent) {
    if (history.state && history.state.profiel && /^#(?:[as]-)?kw\d+$/.test(location.hash)) history.back(); /* terug naar de pagina eronder */
    else setHash(T.prefix + currentToken(), "replace");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
}
function currentToken() {
  if (route.view === "families" && route.sub) return "lijn-" + route.sub;
  if (route.view === "bronnen-over" && route.sub) return "bronnen-" + route.sub;
  if (route.view === "verhalen" && route.sub) return "verhaal-" + route.sub;
  if (route.view === "plaats" && route.sub) return slug(route.sub);
  if (route.view === "stamboom" && route.sub && fanRoot > 1) return "stamboom-" + fanRoot;
  if (route.view === "boom" && treeRoot > 1) return "boom-" + treeRoot;
  if (route.view === "verwant") return vwToken(); /* verwantschap */
  if (route.view === "beeld-archief") return arvToken(); /* archiefverkenner */
  return route.view;
}
scrim.addEventListener("click", () => closeProfile());

/* ---------- search ---------- */
const sdlg = $("#sdlg"), sInput = $("#sInput"), sRes = $("#sRes");
let sItems = [], sSel = 0;
const INDEX = [];
/* verwantschap uit het kw alleen (vader, betovergrootmoeder): zegt man of vrouw zonder extra gegevens; kw 1 is een groep */
const zoekRel = kw => kw > 1 ? relBase(gen(kw) - 1, kw) : "";
function buildIndex() {
  all.forEach(p => INDEX.push({ type: "Personen", title: p.n + (p.roep && p.roep !== p.n ? ` (${p.roep})` : ""), sub: [`kw ${p.kw}`, zoekRel(p.kw), lifeYears(p)].filter(Boolean).join(" · "), ava: avatar(p.kw, "sava"), text: [p.n, p.roep, p.alt, placeName(p.bp), placeName(p.dp), p.occ].join(" "), act: () => openProfile(p.kw) }));
  /* ook de andere boom: wie daar staat, opent in die boom */
  Object.values(TREES).filter(t => t !== T && t.key !== "s" && T.key !== "s").forEach(t => {
    INDEX.push({ type: "Pagina's", title: "Stamboom van " + t.root, sub: t.brand, text: "stamboom kwartierstaat " + t.rootFull + " " + t.brand, act: () => { setTree(t.key); go("overzicht"); } });
    t.PEOPLE.filter(p => !p.alias).forEach(p => INDEX.push({ type: "Personen · stamboom van " + t.root, title: p.n + (p.roep && p.roep !== p.n ? ` (${p.roep})` : ""), sub: [`kw ${p.kw}`, zoekRel(p.kw), p.living ? "levend" : [yr(p.b), yr(p.d)].map(y => y || "?").join(" – ")].filter(Boolean).join(" · "), text: [p.n, p.roep, p.alt, p.living ? "" : placeName(p.bp), p.living ? "" : placeName(p.dp)].join(" "), act: () => { setTree(t.key); go("overzicht", { keepHash: true }); openProfile(p.kw); } }));
  });
  [["Namenregister", "Alle achternamen en patroniemen op alfabet", "namen achternamen register patroniemen alfabet"], ["Kwartierstaat als lijst", "Genummerd, om te lezen of af te drukken", "kwartierstaat lijst afdrukken printen pdf nummers"]].forEach(([t, sub, x], i) => INDEX.push({ type: "Pagina's", title: t, sub, text: t + " " + x, act: () => go(i ? "lijst" : "namen") }));
  INDEX.push({ type: "Pagina's", title: "Hoe ben ik familie?", sub: "Verwantschap uitrekenen: neef, nicht, oudoom, graad van bloedverwantschap", text: "verwantschap verwant familie hoe ben ik familie neef nicht achterneef achternicht oom tante oudoom graad bloedverwantschap aangetrouwd", act: () => go("verwant") }); /* verwantschap */
  LINE_KEYS.forEach(l => INDEX.push({ type: "Families", title: "Familie " + LINES[l].name, sub: LINES[l].sub, text: LINES[l].name + " " + LINES[l].sub + " " + LINES[l].region, act: () => go("lijn-" + l) }));
  Object.keys(PLACES).filter(k => !PLACES[k].seat).forEach(k => INDEX.push({ type: "Plaatsen", title: placeName(k), sub: `${PLACES[k].gem} · ${PLACES[k].prov}`, text: k + " " + placeName(k) + " " + PLACES[k].gem, act: () => go(slug(k)) }));
  STORIES.forEach(s => INDEX.push({ type: "Verhalen", title: s.title, sub: s.lede, text: s.title + " " + s.lede + " " + s.parts.map(x => x.h + " " + x.p.map(q => noteObj(q).t).join(" ")).join(" "), act: () => go("verhaal-" + s.id) }));
  IMGS.filter(i => i.vh).forEach(im => im.vh.map(v => STORIES.find(x => x.id === v[0])).filter(Boolean).forEach(st => INDEX.push({ type: "Beeld", title: im.t, sub: "Bij het verhaal " + st.title, text: [im.t, im.desc, st.title].join(" "), act: () => go("verhaal-" + st.id) })));
  MEDIA.forEach(m => INDEX.push({ type: m.kind === "achtergrond" ? "Verhalen" : "Beeld", title: m.t, sub: MEDIA_KINDS[m.kind].label + (m.y ? " · " + m.y : ""), text: m.t + " " + (m.d || "") + " " + placeName(m.p), act: () => goMedia(m.id) }));
  NOTABLES.forEach(N => INDEX.push({ type: "Bekende verwanten", title: N.n, sub: VERDICT[N.verdict][1] + " · " + N.y, text: [N.n, N.alt, N.role, N.rel].join(" "), act: () => { go("verwanten"); setTimeout(() => { const t = document.getElementById("n-" + N.id); if (t) t.scrollIntoView({ block: "start" }); }, 30); } }));
  if (typeof opIndex === "function") opIndex(); /* opvallende feiten */
  INDEX.push({ type: "Pagina's", title: "Hun tijd", sub: "De grote geschiedenis om de families heen", text: "hun tijd achtergrond geschiedenis gebeurtenissen oorlog cholera watersnood crisis naamsaanneming emigratie", act: () => go("tijd") });
  GLOSSARY.forEach(g => INDEX.push({ type: "Begrippen", title: g[0], sub: g[1], text: g[0] + " " + g[1], act: () => toonBegrip(g[0]) }));
  INDEX.forEach(i => { i.nt = norm(i.text); i.ntitle = norm(i.title); });
}
let sFrom = null; /* wie de focus had vóór het zoekvenster; daar gaat hij na sluiten naartoe terug */
function openSearch() { sFrom = document.activeElement; sdlg.hidden = false; sInput.value = ""; runSearch(); setTimeout(() => sInput.focus(), 10); }
function closeSearch() { sdlg.hidden = true; if (sFrom && sFrom.focus && document.contains(sFrom)) sFrom.focus(); sFrom = null; }
/* één scrollbalk tegelijk: zolang de lade, de zoekdialoog of de lichtbak open is, staat de pagina eronder stil.
   Een observer op [hidden] vangt elke weg (knop, Escape, terugknop, links naar een andere pagina). */
const syncLock = () => document.documentElement.classList.toggle("lock", !drawer.hidden || !sdlg.hidden || !lb.hidden);
[drawer, sdlg, lb].forEach(n => new MutationObserver(syncLock).observe(n, { attributes: true, attributeFilter: ["hidden"] }));
syncLock();
/* alle zoekwoorden in één keer markeren (anders raakt een tweede woord de <mark> van het eerste); korte woorden als "de" alleen aan het begin van een woord */
function hl(s, toks) {
  const ts = toks.filter(t => t.length >= 2).sort((a, b) => b.length - a.length).map(t => (t.length <= 3 ? "(?<!\\p{L})" : "") + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!ts.length) return esc(s);
  const re = new RegExp(ts.join("|"), "giu"); let h = "", i = 0;
  for (const m of s.matchAll(re)) { h += esc(s.slice(i, m.index)) + "<mark>" + esc(m[0]) + "</mark>"; i = m.index + m[0].length; }
  return h + esc(s.slice(i));
}
function runSearch() {
  const q = norm(sInput.value).trim(), toks = q.split(/\s+/).filter(Boolean);
  if (toks.length && !archTekstOk) archTekst().then(() => { if (sInput.value.trim()) runSearch(); }); /* archiefbeelden komen erbij zodra hun tekst er is */
  let res;
  if (!toks.length) res = [...INDEX.filter(i => i.type === "Families"), ...INDEX.filter(i => i.type === "Verhalen")];
  else res = INDEX.map(i => { if (!toks.every(t => i.nt.includes(t))) return null; let s = 0; toks.forEach(t => { if (i.ntitle.startsWith(t)) s += 4; else if (i.ntitle.includes(t)) s += 2; }); return [s, i]; }).filter(Boolean).sort((a, b) => b[0] - a[0]).map(x => x[1]).slice(0, 40);
  if (toks.length) { const na = archList().filter(a => toks.every(t => a.nt.includes(t))).length;
    if (na) res.splice(Math.min(3, res.length), 0, { type: "Uit de archieven", title: `${na} ${na === 1 ? "archiefbeeld" : "archiefbeelden"} met “${sInput.value.trim()}”`, sub: "Oude foto's, prenten, kaarten en akten", act: () => go("beeld-archief--zoek-" + kaal(sInput.value)) }); }
  sItems = res; sSel = 0;
  if (!res.length) { sInput.removeAttribute("aria-activedescendant"); sRes.innerHTML = `<div class="none">Niets gevonden. Probeer een andere spelling, een voornaam of een plaatsnaam.</div>`; return; }
  const groups = {}; res.forEach((r, i) => (groups[r.type] = groups[r.type] || []).push([r, i]));
  const raw = sInput.value.trim().split(/\s+/).filter(Boolean);
  sInput.setAttribute("aria-activedescendant", "sopt-0");
  sRes.innerHTML = Object.keys(groups).map(g => `<h6>${g}</h6>` + groups[g].map(([r, i]) => `<button role="option" id="sopt-${i}" tabindex="-1" data-i="${i}" aria-selected="${i === 0}"${r.ava ? ` class="withava"` : ""}>${r.ava || ""}<b>${hl(r.title, raw)}</b><span>${esc(trunc(r.sub || "", 60))}</span></button>`).join("")).join("");
  $$("#sRes [data-i]").forEach(b => b.onclick = () => pick(+b.dataset.i));
}
function pick(i) { const it = sItems[i]; if (!it) return; closeSearch(); it.act(); }
sInput.addEventListener("input", runSearch);
sInput.addEventListener("keydown", e => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault(); sSel = Math.max(0, Math.min(sItems.length - 1, sSel + (e.key === "ArrowDown" ? 1 : -1)));
    $$("#sRes [data-i]").forEach(b => b.setAttribute("aria-selected", +b.dataset.i === sSel)); const c = $(`#sRes [data-i="${sSel}"]`); if (c) c.scrollIntoView({ block: "nearest" }); sInput.setAttribute("aria-activedescendant", "sopt-" + sSel);
  } else if (e.key === "Enter") { e.preventDefault(); pick(sSel); }
});
$("#openSearch").onclick = openSearch;
/* thema: "auto" volgt het apparaat (prefers-color-scheme), "licht" en "donker" kiest de lezer zelf; bewaard in localStorage.
   Het script in <head> zet data-theme al vóór de eerste weergave. Hier de knop met keuzemenu (menuitemradio), de
   theme-color en wisselingen van het apparaat of uit een ander tabblad. */
const THEMES = ["auto", "licht", "donker"], THEME_KEY = "stamboom-thema", darkMQ = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
function themeNow() { try { const t = localStorage.getItem(THEME_KEY); return THEMES.includes(t) ? t : "auto"; } catch (e) { return "auto"; } }
function themeDark(t) { return t === "donker" || (t === "auto" && !!(darkMQ && darkMQ.matches)); }
function applyTheme(t, save) {
  const r = document.documentElement;
  if (t === "auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", t === "licht" ? "light" : "dark");
  if (save) { try { if (t === "auto") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, t); } catch (e) { } }
  const nu = themeDark(t) ? "donker" : "licht", naam = { auto: `automatisch (nu ${nu})`, licht: "licht", donker: "donker" }[t];
  const b = $("#themeBtn"); if (b) { b.dataset.mode = t; b.setAttribute("aria-label", `Weergave: ${naam}`); b.title = `Weergave: ${naam}`; }
  $$("#themeMenu [data-t]").forEach(x => x.setAttribute("aria-checked", String(x.dataset.t === t)));
  const n = $("#thmNote"); if (n) n.textContent = `zoals je apparaat · nu ${nu}`;
  let m = document.querySelector('meta[name="theme-color"]');
  if (!m) { m = document.createElement("meta"); m.name = "theme-color"; document.head.appendChild(m); }
  m.content = getComputedStyle(r).getPropertyValue("--bg").trim() || (themeDark(t) ? "#0F1513" : "#EEF1EC");
}
let themeCur = themeNow(); /* ook in het geheugen: werkt zonder localStorage (privévenster) */
applyTheme(themeCur);
{
  const btn = $("#themeBtn"), menu = $("#themeMenu"), items = () => $$("#themeMenu [data-t]"), isOpen = () => !menu.hidden;
  const close = focusBtn => { if (!isOpen()) return; menu.hidden = true; btn.setAttribute("aria-expanded", "false"); if (focusBtn) btn.focus(); };
  const open = () => { menu.hidden = false; btn.setAttribute("aria-expanded", "true"); (items().find(x => x.dataset.t === themeCur) || items()[0]).focus(); };
  btn.onclick = () => isOpen() ? close(false) : open();
  btn.addEventListener("keydown", e => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); open(); } });
  menu.addEventListener("click", e => { const x = e.target.closest("[data-t]"); if (!x) return; themeCur = x.dataset.t; applyTheme(themeCur, true); close(true); });
  menu.addEventListener("keydown", e => {
    const list = items(), i = list.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); list[(i + (e.key === "ArrowDown" ? 1 : list.length - 1)) % list.length].focus(); }
    else if (e.key === "Home" || e.key === "End") { e.preventDefault(); list[e.key === "Home" ? 0 : list.length - 1].focus(); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === "Tab") close(false);
  });
  document.addEventListener("pointerdown", e => { if (isOpen() && !e.target.closest("#thm")) close(false); });
  window.addEventListener("hashchange", () => close(false));
}
if (darkMQ) { const f = () => { if (themeCur === "auto") applyTheme("auto"); }; darkMQ.addEventListener ? darkMQ.addEventListener("change", f) : darkMQ.addListener(f); }
window.addEventListener("storage", e => { if (e.key === THEME_KEY) applyTheme(themeCur = themeNow()); }); /* andere tabbladen volgen mee */
$("#sScrim").onclick = closeSearch;
document.addEventListener("keydown", e => {
  if (!lb.hidden) { if (e.key === "Escape") closeLb(); else if (e.key === "ArrowLeft") stepLb(-1); else if (e.key === "ArrowRight") stepLb(1); return; }
  if (e.key === "Escape") { if (!sdlg.hidden) closeSearch(); else if (!drawer.hidden) closeProfile(); return; }
  const typing = /input|textarea|select/i.test((document.activeElement || {}).tagName || "");
  if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); openSearch(); }
});

/* ---------- fan chart ---------- */
/* root: de kw in het midden (1 = de hoofdpersoon). Elk vak is root·2^(g-1)+i; fanKw() zoekt via kwartierverlies (alias) de
   persoon op als dat nummer zelf niet in de data staat. more: boogjes buiten de rand waar de lijn verder gaat. */
/* labelScale: grotere letters (waaier op het overzicht); minPx: een naamlaag alleen tonen als de letters op het scherm minstens
   zo groot worden (gemeten aan de breedte van host), zodat er geen onleesbare grijze tekst staat */
function drawFan(host, { maxGen = 9, labelGen = 7, interactive = true, highlightLine = null, root = 1, more = false, labelScale = 1, minPx = 0 } = {}) {
  const R = [0, 58, 126, 192, 268, 344, 412, 460, 498, 530];
  if (root > 1) { let depth = 1; for (let gn = 2; gn <= maxGen; gn++) { const n = 2 ** (gn - 1); for (let i = 0; i < n; i++) if (person(fanKw(root * n + i))) { depth = gn; break; } } maxGen = Math.min(maxGen, Math.max(3, depth + 1)); } /* één lege ring: daar is nog niets gevonden */
  const V = R[maxGen] + (more ? 40 : 10), rp = person(fanKw(root)), rootAlias = fanKw(root) !== root || !!ALIAS_OF[root]; /* de volledige waaier (more) krijgt marge rondom de boogjes */
  const zacht = labelScale > 1 || more; /* overzicht en volledige waaier: zichtbare vakgrenzen bij levenden, ook in donker */
  const scale = host && host.clientWidth ? host.clientWidth / (2 * V) : 1; /* hoe groot een eenheid op het scherm wordt */
  const leesbaar = f => !minPx || f * scale >= 9; /* bijtekst (achternaam, "met …", "vaders kant") alleen als die op het scherm minstens 9 px wordt */
  const svg = el("svg", { viewBox: `${-V} ${-V} ${2 * V} ${2 * V}`, role: "group", "aria-label": "Waaier met de voorouders van " + (root > 1 && rp ? rp.n : T.root) + " per generatie" });
  const g = el("g", {}, svg), lg = el("g", { "pointer-events": "none" }, svg); /* namen in een eigen laag boven alle vakken */
  const pt = (r, a) => { const t = a * Math.PI / 180; return [r * Math.cos(t), r * Math.sin(t)]; };
  for (let gn = 2; gn <= maxGen; gn++) {
    const n = 2 ** (gn - 1), r0 = R[gn - 1], r1 = R[gn];
    for (let i = 0; i < n; i++) {
      const kw = root * n + i, ck = fanKw(kw), a0 = 90 + i * 360 / n, a1 = a0 + 360 / n;
      const [x1, y1] = pt(r1, a0), [x2, y2] = pt(r1, a1), [x3, y3] = pt(r0, a1), [x4, y4] = pt(r0, a0);
      const d = `M${x1} ${y1}A${r1} ${r1} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r0} ${r0} 0 0 0 ${x4} ${y4}Z`;
      const p = person(ck), dim = highlightLine && lineOf(kw) !== highlightLine && gen(kw) >= 4;
      const twins = twinKws(ck), twin = !rootAlias && (twins.length || ck !== kw); /* staat het midden zelf in een dubbele tak, dan is alles dubbel: geen goud */
      let attrs;
      if (!p) attrs = { d, fill: "none", stroke: "var(--rule)", "stroke-dasharray": "3 3", "stroke-width": 1, "stroke-opacity": more && gn >= 7 ? 0.5 : null }; /* lege buitenste vakken lichter */
      else if (p.living) attrs = zacht /* zichtbare vakgrenzen (ook in donker) en vanaf generatie 3 de familiekleur zacht */
        ? { d, fill: gn >= 3 ? lineColor(kw) : "var(--sunk)", "fill-opacity": gn >= 3 ? 0.14 : 1, stroke: "var(--fan-gap)", "stroke-width": 2.5 }
        : { d, fill: "var(--sunk)", stroke: "var(--surface)", "stroke-width": 2 };
      else attrs = { d, fill: lineColor(kw), "fill-opacity": dim ? 0.06 : p.st === "D" ? 0.05 : p.st === "C" ? 0.12 : p.st === "B" ? 0.2 : 0.3, stroke: p.st === "C" || p.st === "D" ? lineColor(kw) : "var(--surface)", "stroke-width": p.st === "C" || p.st === "D" ? 1 : 2, "stroke-dasharray": p.st === "D" ? "1 3" : p.st === "C" ? "3 2" : null };
      if (p && twin) Object.assign(attrs, { stroke: "var(--gold)", "stroke-width": labelScale > 1 || gn >= 7 ? 1.5 : 2.5, "stroke-dasharray": null }); /* dunner waar de vakken klein zijn (overzicht, buitenste ringen) */
      const path = el("path", attrs, g);
      if (p && interactive) { path.setAttribute("class", "seg-path"); clickable(path, () => openProfile(ck), p.n); bindTip(path, tipFor(p) + (twins.length ? `<br><span style="opacity:.8">staat ook als kw ${twins.join(", ")}</span>` : "") + (ck !== kw ? `<br><span style="opacity:.8">op deze plek kw ${kw}</span>` : "")); }
      if (p && more && interactive && gn === 9 && (person(fanKw(2 * kw)) || person(fanKw(2 * kw + 1)))) {
        const rr = R[9] + 5, e = Math.min(1.2, 90 / n), [m1, n1] = pt(rr, a0 + e), [m2, n2] = pt(rr, a1 - e);
        const mk = el("path", { d: `M${m1} ${n1}A${rr} ${rr} 0 0 1 ${m2} ${n2}`, class: "fan-more", stroke: lineColor(kw) }, g);
        clickable(mk, () => { hideTip(); go("stamboom-" + kw, { keepScroll: true }); }, "Voorouders van " + p.n + " in het midden zetten");
        bindTip(mk, `<b>${esc(p.n)}</b><br><span style="opacity:.8">de lijn gaat verder · klik om deze tak in het midden te zetten</span>`);
      }
      if (p && gn <= Math.min(labelGen, 8) && (!minPx || fanFs(gn) * labelScale * scale >= minPx)) {
        const am = (a0 + a1) / 2, rm = (r0 + r1) / 2, [cx, cy] = pt(rm, am);
        const l1 = firstName(p), l2 = shortSur(splitName(p.n).sur);
        const lab = el("g", { "pointer-events": "none", opacity: dim ? 0.35 : 1 }, lg);
        if (gn <= 3) {
          const fs = fanFs(gn) * labelScale;
          if (gn === 2 && labelScale > 1) { /* grote letters: vanaf de rand van het midden naar buiten, zodat de naam de cirkel niet raakt */
            const left = cx < 0; txt(lab, left ? -(R[1] + 8) : R[1] + 8, cy + fs / 3, l1, { "text-anchor": left ? "end" : "start", "font-size": fs, "font-weight": 600 });
          } else
          txt(lab, cx, cy - 2, l1, { "text-anchor": "middle", "font-size": fs, "font-weight": 600 });
          if (labelScale === 1) txt(lab, cx, cy + fs, trunc(l2, 14), { "text-anchor": "middle", "font-size": fs - 3, fill: "var(--muted)" }); /* op het overzicht alleen voornamen (grotere letters, anders botst de achternaam met het midden) */
        } else if (labelScale > 1 && gn === 4) { /* overzicht: generatie 4 langs de boog, daar is ruimte voor de hele voornaam */
          const fs = fanFs(gn) * labelScale, an = ((am % 360) + 360) % 360, rot = an > 0 && an < 180 ? an - 90 : an + 90;
          const t = el("g", { transform: `translate(${cx} ${cy}) rotate(${rot})` }, lab);
          txt(t, 0, fs / 3, trunc(l1, Math.floor(2 * Math.PI * rm / n * 0.85 / (fs * 0.56))), { "text-anchor": "middle", "font-size": fs, "font-weight": 600 });
        } else {
          const fs = fanFs(gn) * labelScale, max = Math.floor((r1 - r0) * 0.92 / (fs * 0.56));
          const flip = am > 90 && am < 270, t = el("g", { transform: `translate(${cx} ${cy}) rotate(${flip ? am + 180 : am})` }, lab);
          const past = (w, f) => (w.length <= Math.floor((r1 - r0) * 0.92 / (f * 0.56)) ? f : Math.max(f * 0.82, (r1 - r0) * 0.92 / (w.length * 0.56))); /* eerst iets kleiner, pas daarna afkappen */
          const pm = (w, f) => Math.floor((r1 - r0) * 0.92 / (f * 0.56));
          if (gn <= 6 && labelScale === 1) { /* op het overzicht (labelScale > 1) vanaf generatie 4 alleen de voornaam: anders wordt alles afgekapt */
            const f1 = past(l1, fs), f2 = past(l2, fs - 1);
            txt(t, 0, -2, trunc(l1, pm(l1, f1)), { "text-anchor": "middle", "font-size": f1, "font-weight": 600 });
            txt(t, 0, fs, trunc(l2, pm(l2, f2)), { "text-anchor": "middle", "font-size": f2, fill: "var(--muted)" });
          } else { const f1 = labelScale === 1 ? past(l1, fs) : fs; txt(t, 0, fs / 3, trunc(l1, labelScale === 1 ? pm(l1, f1) : max), { "text-anchor": "middle", "font-size": f1, "font-weight": 600 }); }
        }
      }
    }
  }
  const c = el("circle", { r: R[1], fill: "var(--accent)" }, g);
  const ct = el("g", { "pointer-events": "none" }, g);
  if (root > 1 && rp) { /* een voorouder in het midden: voornaam, achternaam en (bij overledenen) de jaren */
    const ls = [firstName(rp), trunc(shortSur(splitName(rp.n).sur), 16), rp.living ? "" : lifeYears(rp)].filter(Boolean);
    ls.forEach((s, i) => txt(ct, 0, 5 + (i - (ls.length - 1) / 2) * 15, s, { "text-anchor": "middle", "font-size": i === 2 ? 10.5 : Math.min(13.5, 104 / (s.length * 0.56)), "font-weight": i === 2 ? 400 : 600, fill: "var(--accent-ink)" }));
  } else if (T.rootLines) { const f = Math.min(...T.rootLines.map(s => Math.min(13.5 * labelScale, 104 / (s.length * 0.56)))); /* te klein op het scherm: dan alleen de gekleurde stip */
    if (!minPx || f * scale >= minPx) T.rootLines.forEach((s, i, a) => txt(ct, 0, 5 + (i - (a.length - 1) / 2) * f * 1.1, s, { "text-anchor": "middle", "font-size": f, "font-weight": 600, fill: "var(--accent-ink)" }));
  } else { const f = Math.min(17 * labelScale, 108 / (T.root.length * 0.56)); if (!minPx || f * scale >= minPx) txt(ct, 0, -2, T.root, { "text-anchor": "middle", "font-size": f, "font-weight": 600, fill: "var(--accent-ink)" }); }
  const sub = root === 1 && T.sibs && T.sibs.length ? "met " + T.sibs.slice(0, -1).join(", ") + (T.sibs.length > 1 ? " en " : "") + T.sibs[T.sibs.length - 1] : "";
  const subFs = Math.min(9.5, 104 / (sub.length * 0.55));
  if (sub && leesbaar(subFs)) txt(ct, 0, 16, sub, { "text-anchor": "middle", "font-size": subFs, fill: "var(--accent-ink)" });
  if (interactive) { c.style.cursor = "pointer"; c.addEventListener("click", () => openProfile(root > 1 ? fanKw(root) : 1)); }
  const kantFs = 14 * labelScale;
  if (labelGen >= 4 && labelScale === 1 && leesbaar(kantFs)) { /* niet in de kleine waaier op het overzicht */
    const who = root > 1 && rp ? " van " + firstName(rp) : "";
    /* volledige waaier: de labels bij de schouders van de waaier (45°), niet in de hoeken van het kader */
    const kx = more ? 0.72 * (R[maxGen] + 14) : V - 20, ky = more ? -0.72 * (R[maxGen] + 14) - 6 : -V + 16 + kantFs;
    txt(g, -kx, ky, root > 1 ? "vader" + who : "vaders kant", { "font-size": kantFs, fill: "var(--muted)", "font-family": "var(--mono)", "text-anchor": more ? "end" : "start" });
    txt(g, kx, ky, root > 1 ? "moeder" + who : "moeders kant", { "font-size": kantFs, fill: "var(--muted)", "text-anchor": more ? "start" : "end", "font-family": "var(--mono)" });
  }
  host.innerHTML = ""; host.appendChild(svg);
}
/* ---------- waaier op het overzicht ---------- */
/* Op het overzicht is de waaier veel kleiner dan op de stamboompagina (op 1366 px ±490 px tegen ±850 px). Daarom grotere
   letters en alleen de naamlagen die op het scherm minstens 8 px worden; daaronder een leeswijzer, twee knoppen en de
   familiekleuren. De vakken zijn met de muis klikbaar maar niet met Tab (geen honderden tabstops op de voorpagina). */
let heroFanW = 0, heroFanRO = null;
function heroFan() {
  const host = $("#heroFan"), note = $("#heroFanNote"); if (!host) return;
  const draw = () => {
    heroFanW = host.clientWidth;
    drawFan(host, { maxGen: 9, labelGen: 4, labelScale: 1.6, minPx: 8 });
    $$("[tabindex]", host).forEach(n => n.setAttribute("tabindex", "-1")); host.setAttribute("aria-hidden", "true");
  };
  draw();
  if (note) {
    /* rustig onder de waaier: één regel uitleg met een link naar de hele waaier; de familiekleuren alleen op brede schermen
       (op de telefoon staan de acht families vlak eronder als eigen blok) */
    const goud = host.querySelector('path[stroke="var(--gold)"]') ? " · goud: dezelfde voorouder twee keer" : "";
    /* de uitleg van de kleuren staat op de pagina van de hele waaier ("Zo lees je de vakken"); hier alleen als title */
    host.title = "Kleur: familie; hoe voller het vak, hoe sterker het bewijs" + (goud ? "; goud: dezelfde voorouder twee keer" : "") + ".";
    const ln = LINE_KEYS.filter(l => LINES[l]);
    note.innerHTML = `<div class="fan-legend${T.key === "s" ? " twee" : ""}" aria-label="De families">${ln.map(l => `<button type="button" class="fl-it" style="--c:var(--l${l})" data-go="stamboom-${l}" data-fl="${l}" title="Familie ${esc(LINES[l].name)} in het midden van de waaier"><i></i>${esc(LINES[l].name)}</button>`).join("")}</div>
      <p class="ov-more"><button type="button" class="ov-link" id="heroFanOpen">Open de hele waaier →</button><span aria-hidden="true" style="color:var(--faint)"> · </span><a class="ov-link" href="#${T.prefix}boom" data-go="boom">Open de boom →</a></p>`;
    $("#heroFanOpen").onclick = () => { fanRoot = 1; go("stamboom"); };
    /* aanwijzen of focus op een familie: die lijn licht op in de waaier, de rest dimt (met een muis, of met het toetsenbord) */
    const licht = l => { drawFan(host, { maxGen: 9, labelGen: 4, labelScale: 1.6, minPx: 8, highlightLine: l }); $$("[tabindex]", host).forEach(n => n.setAttribute("tabindex", "-1")); };
    $$("[data-fl]", note).forEach(b => {
      const aan = () => licht(+b.dataset.fl), uit = () => licht(null);
      if (matchMedia("(hover:hover) and (pointer:fine)").matches) { b.addEventListener("mouseenter", aan); b.addEventListener("mouseleave", uit); }
      b.addEventListener("focus", aan); b.addEventListener("blur", uit);
    });
  }
  /* opnieuw tekenen als de breedte flink verandert (draaien van de telefoon, venster groter of kleiner) */
  if (heroFanRO) heroFanRO.disconnect();
  if ("ResizeObserver" in window) { heroFanRO = new ResizeObserver(() => { if (host.isConnected && Math.abs(host.clientWidth - heroFanW) > heroFanW * 0.15) draw(); }); heroFanRO.observe(host); }
}
/* lettergrootte van de namen per generatie (in eenheden van de waaier) */
const fanFs = gn => [0, 0, 16, 14, 12, 10.5, 9.5, 8, 7][gn] || 7;
/* het nummer waaronder de persoon op deze plek in de data staat: loopt omhoog tot een alias (kwartierverlies) en rekent
   de tak om naar het nummer van die persoon (alias X → Y: X·2^s + j wordt Y·2^s + j) */
function fanKw(kw) {
  let k = kw;
  for (let guard = 0; guard < 8 && !BY.has(k); guard++) {
    let a = k, s = 0, hit = false;
    while (a > 1) { a = Math.floor(a / 2); s++; if (ALIAS_OF[a] !== undefined) { k = ALIAS_OF[a] * 2 ** s + k % 2 ** s; hit = true; break; } }
    if (!hit) break;
  }
  return k;
}
/* het midden van de waaier op de stamboompagina (#stamboom-<kw>): iedereen in de stamboom; zonder bekende ouders blijft de ring erboven leeg */
let fanRoot = 1;
const fanRootOk = kw => Number.isInteger(kw) && kw > 1 && !!person(fanKw(kw));
function fanCrumbs() {
  let box = $("#fanCrumbs");
  if (!box) { box = document.createElement("div"); box.id = "fanCrumbs"; box.className = "fan-crumbs"; $("#fanPane").prepend(box); }
  box.hidden = fanRoot === 1;
  if (fanRoot === 1) { box.innerHTML = ""; return; }
  const chain = []; for (let k = fanRoot; k >= 1; k = Math.floor(k / 2)) chain.unshift(k);
  const name = k => k === 1 ? (T.key === "s" ? T.rootFull || T.root : T.root) : firstName(person(fanKw(k)));
  const items = chain.length > 6 ? [chain[0], null, ...chain.slice(-4)] : chain;
  box.innerHTML = `<span class="lbl">Midden van de waaier:</span> ${items.map(k => k === null ? `<span class="sep" aria-hidden="true">…</span>`
    : k === fanRoot ? `<b>${esc(name(k))}</b>` : `<button class="link" data-fanroot="${k}">${esc(name(k))}</button><span class="sep" aria-hidden="true">›</span>`).join(" ")}
    ${fanKw(fanRoot) !== fanRoot || ALIAS_OF[fanRoot] ? `<span class="small">· ${esc(firstName(person(fanKw(fanRoot))))} staat ook als kw ${fanKw(fanRoot) !== fanRoot ? fanKw(fanRoot) : ALIAS_OF[fanRoot]} in de stamboom (<button class="link" data-go="${implexStory()}">kwartierverlies</button>)</span>` : ""}
    <button class="chip" data-fanroot="1">Terug naar ${esc(T.key === "s" ? T.rootFull || T.root : T.root)}</button>`;
  box.querySelectorAll("[data-fanroot]").forEach(b => b.onclick = () => go(+b.dataset.fanroot > 1 ? "stamboom-" + b.dataset.fanroot : "stamboom", { keepScroll: true }));
}
/* snelknoppen boven de waaier: het midden, de ouders, de grootouders en de acht families (overgrootouders, kw 8–15, met de
   familiekleur). Echte links (#stamboom-<kw>) met het toetsenbord; de huidige knop heeft aria-current. Een dieper midden laat
   geen knop oplichten; dat toont het kruimelpad eronder. */
function fanJump() {
  let box = $("#fanJump");
  if (!box) { box = document.createElement("nav"); box.id = "fanJump"; box.className = "fan-kies"; box.setAttribute("aria-label", "Midden van de waaier kiezen"); $("#fan").insertAdjacentElement("afterend", box); }
  const nm = k => { const p = person(fanKw(k)); return p ? firstName(p) : ""; };
  const lnk = (k, label, extra) => `<a class="fk-it" href="#${T.prefix}${k > 1 ? "stamboom-" + k : "stamboom"}" data-fanjump="${k}"${fanRoot === k ? ` aria-current="true"` : ""}${extra || ""}>${label}</a>`;
  const kol = (t, ks, f) => `<div class="fk-col"><span class="fk-l">${t}</span><ul>${ks.map(k => `<li>${k === 1 || person(fanKw(k)) ? f(k) : `<span class="fk-leeg">nog niet gevonden</span>`}</li>`).join("")}</ul></div>`;
  box.innerHTML = `<h5>Kies het midden van de waaier</h5><div class="fk-grid">`
    + kol("Midden", [1], () => lnk(1, esc(T.key === "s" ? T.rootFull || T.root : T.root)))
    + kol("Ouders", [2, 3], k => lnk(k, esc(nm(k)), ` style="--c:${k === 2 ? "var(--l8)" : "var(--l12)"}"`))
    + kol("Grootouders", [4, 5, 6, 7], k => lnk(k, esc(nm(k)), ` style="--c:${lineColor(k)}"`))
    + kol("Families", LINE_KEYS.filter(l => LINES[l]), l => `<span class="fk-fam">${lnk(l, `<i></i>${esc(LINES[l].name)}`, ` style="--c:var(--l${l})" title="${esc((person(fanKw(l)) || {}).n || "")} in het midden"`)}<a class="fk-pg" href="#${T.prefix}lijn-${l}" data-go="lijn-${l}" title="Familiepagina ${esc(LINES[l].name)}" aria-label="Familiepagina ${esc(LINES[l].name)}">→</a></span>`)
    + `</div>`;
  box.querySelectorAll("[data-fanjump]").forEach(a => a.onclick = e => { e.preventDefault(); const k = +a.dataset.fanjump; go(k > 1 ? "stamboom-" + k : "stamboom", { keepScroll: true }); const n = $(`#fanJump [data-fanjump="${k}"]`); if (n) n.focus(); });
}
/* aantal generaties boven het midden (I = het midden) tot de laatste met iemand erin */
function fanRelGens(root) {
  let last = 1;
  for (let g = 2; g <= 24; g++) { const n = 2 ** (g - 1); let any = false; for (let i = 0; i < n && !any; i++) any = !!person(fanKw(root * n + i)); if (!any) break; last = g; }
  return last;
}
/* de inleiding boven de waaier volgt het midden (treeChrome zet de zin voor kw 1) */
/* één korte regel over wat je ziet; de kanten staan als label bij de waaier, de weg terug in het pad erboven */
function fanLede() {
  const sl = $("#v-stamboom .lede"); if (!sl) return;
  const h1 = $("#v-stamboom h1"); if (h1) h1.textContent = "De waaier";
  wisselLink($("#v-stamboom"), "boom", fanRoot);
  if (fanRoot === 1) { sl.textContent = `${T.rootFull || T.root} in het midden; elke ring is een generatie verder terug.`; return; }
  const p = person(fanKw(fanRoot));
  const wie = gen(fanRoot) === 2 ? (isMale(fanRoot) ? "de vader" : "de moeder") : "een voorouder";
  sl.textContent = `De voorouders van ${p.n}, ${wie} van ${T.rootFull || T.root} (kw ${fanRoot}).`;
}
const fanHint = () => ""; /* de uitleg van de boogjes staat één keer in "Zo lees je de vakken" */

/* ---------- pedigree tree ---------- */
let treeRoot = 1, mode = "fan";
/* Waaier (#stamboom) en Boom (#boom) zijn twee pagina's met elk een eigen adres; setMode("tree") gaat naar de boom met hetzelfde
   midden, setMode("fan") is op de waaierpagina een no-op (oude aanroepen blijven zo werken). */
function setMode(m) {
  if (m === "tree") { go(treeRoot > 1 ? "boom-" + treeRoot : "boom"); return; }
  mode = "fan"; $("#fanPane").hidden = false;
}
/* de boom in drie weergaven, te kiezen rechts in de kruimelregel (voorkeur in localStorage; onder een vak van 820 px altijd de lijst):
   - liggend: tekening van links (het midden) naar rechts, 4 generaties (5 als je dat kiest en het vak minstens 1080 px is);
   - staand: het midden boven en de oudere generaties naar beneden (4 generaties);
   - uitklapbaar: een ingesprongen lijst waarin je per tak de ouders in- en uitklapt (tot 10 generaties).
   De tekeningen staan op schaal 1 (de breedte van het vak), met kolomkoppen, vaders- en moederskant en een regel met de families.
   Kaarten met rechte hoeken en de familiestreep strak langs de rand; kwartierverlies in goud; C/D gestreept/gestippeld; onder
   een ontbrekende persoon alleen één leeg vak. Verder terug en terug via go("boom-<kw>"), zodat het midden in de hash staat.
   Afdrukken: in beforeprint een vaste opzet (A4 liggend, 4 generaties) met een kop- en voetregel. */
let treeOpzet = "", treeRO = null, treeOpen = null, treeOpenRoot = 0, treeDiep = 4, treeDruk = false;
const treeVoorkeur = (k, mag, std) => { try { const v = localStorage.getItem(k); return mag.includes(v) ? v : std; } catch (e) { return std; } };
let treeView = treeVoorkeur("stamboom-boomweergave", ["liggend", "staand", "lijst"], "liggend");
let treeGen = +treeVoorkeur("stamboom-boomgeneraties", ["4", "5"], "4");
let treeRicht = treeVoorkeur("stamboom-boomrichting", ["onder", "boven"], "onder"); /* staand: de oudste generatie onder (standaard) of boven */
const treeGo = kw => { if (VIEWS.includes("boom")) go(kw > 1 ? "boom-" + kw : "boom", { keepScroll: true }); else { treeRoot = kw; drawTree(); } };
const treeNaam = p => p.kw === 1 && T.key === "s" ? T.root : (firstName(p) + " " + shortSur(splitName(p.n).sur)).trim() || p.n; /* roepnaam + achternaam; de volledige naam als tooltip */
/* zoals in de waaier: fanKw volgt een alias (kwartierverlies) naar het nummer waaronder de persoon in de data staat */
const treeP = kw => person(fanKw(kw));
const treeTwin = kw => { const ck = fanKw(kw), rootAlias = fanKw(treeRoot) !== treeRoot || !!ALIAS_OF[treeRoot]; if (rootAlias) return null; const t = twinKws(ck); return t.length || ck !== kw ? (t.length ? t : [ck]) : null; };
const treeOuders = kw => !!(treeP(kw * 2) || treeP(kw * 2 + 1));
const treeRel = (d, kw) => d ? relBase(d, kw) : ""; /* hetzelfde woord als in het profiel, vanuit het midden van de boom */
const TREE_KOP = ["", "Ouders", "Grootouders", "Overgrootouders", "Betovergrootouders"];
const treeKant = (kw, d) => d < 2 ? "" : (kw >> (d - 1)) === treeRoot * 2 ? "vaderskant" : "moederskant";
const treeStTag = p => !p.living && p.st !== "A" ? p.st : "";
const treeOpzetVan = w => treeDruk ? "druk" : w < 820 || treeView === "lijst" ? "lijst" : treeView === "liggend" ? "liggend" + (treeGen === 5 && w >= 1080 ? 5 : 4) : treeView;
/* de families onder het midden: een klik zet die familie in het midden, aanwijzen licht haar kaarten op */
const treeLijnen = () => gen(treeRoot) >= 4 ? [] : LINE_KEYS.filter(l => LINES[l] && (l >> (gen(l) - gen(treeRoot))) === treeRoot);
function drawTree() {
  const host = $("#tree"); if (!host) return;
  const w = host.clientWidth || 1000, opzet = treeOpzetVan(w);
  treeOpzet = opzet;
  if (opzet === "druk") { if (treeView === "staand") treeStaand(host, 1000); else treeSvg(host, 4, 1000); } /* afdrukken volgt de gekozen weergave; de lijst als liggende tekening */
  else if (opzet === "lijst") treeLijst(host); else if (opzet === "staand") treeStaand(host); else treeSvg(host, +opzet.slice(-1));
  /* kruimels: vanaf wie (lang: de eerste, "…" en de laatste vier), een stap terug, en de keuzes */
  const chain = []; for (let k = treeRoot; k >= 1; k = k >> 1) chain.unshift(k);
  const toon = chain.length > 6 ? [chain[0], 0, ...chain.slice(-4)] : chain;
  const keuze = w < 820 ? "" : `<span class="tree-views" role="group" aria-label="Weergave van de boom">${[["liggend", "Liggend"], ["staand", "Staand"], ["lijst", "Uitklapbaar"]].map(([k, l]) => `<button class="chip" data-tv="${k}" aria-pressed="${treeView === k}">${l}</button>`).join("")}</span>`;
  const gens = opzet.startsWith("liggend") && w >= 1080 ? `<span class="tree-views" role="group" aria-label="Aantal generaties">${[4, 5].map(g => `<button class="chip" data-tg2="${g}" aria-pressed="${treeGen === g}">${g} generaties</button>`).join("")}</span>` : "";
  const richt = opzet === "staand" ? `<span class="tree-views" role="group" aria-label="Richting">${[["onder", "↓ Oudste onder"], ["boven", "↑ Oudste boven"]].map(([k, l]) => `<button class="chip" data-tr="${k}" aria-pressed="${treeRicht === k}">${l}</button>`).join("")}</span>` : "";
  const diep = opzet === "lijst" ? `<label class="tree-diep small">Uitklappen tot <select id="treeDiep">${[["", "eigen keuze"], ["4", "4 generaties"], ["5", "5 generaties"], ["6", "6 generaties"], ["7", "7 generaties"], ["8", "8 generaties"]].map(([v, l]) => `<option value="${v}"${+v === treeDiep && treeOpenRoot === treeRoot ? " selected" : ""}>${l}</option>`).join("")}</select></label>` : "";
  const lijnen = treeLijnen(), fam = lijnen.length > 1 && opzet !== "lijst" ? `<div class="fan-legend tree-fam${lijnen.length <= 4 ? " twee" : ""}" aria-label="De families">${lijnen.map(l => `<button type="button" class="fl-it" style="--c:var(--l${l})" data-root="${l}" data-fl="${l}" title="Familie ${esc(LINES[l].name)} in het midden"><i></i>${esc(LINES[l].name)}</button>`).join("")}</div>` : "";
  $("#crumbs").innerHTML = `<span class="tree-pad">${treeRoot > 1 ? `<button class="btn tree-back" data-root="${treeRoot >> 1}">‹ een generatie terug</button>` : ""}<span>Vanaf:</span> ` + toon.map((k, i) => {
    if (!k) return `<span aria-hidden="true">…</span> <span>›</span>`;
    const p = treeP(k), name = k === 1 ? T.root : p ? treeNaam(p) : "kw " + k;
    return i === toon.length - 1 ? `<b style="color:var(--ink)">${esc(name)}</b>` : `<button data-root="${k}">${esc(name)}</button> <span>›</span>`;
  }).join(" ") + `</span>${diep}${gens}${richt}${keuze}<button class="chip tree-print" type="button">${navIco("print")}Afdrukken</button>${fam}`;
  $$("#crumbs [data-root]").forEach(b => b.onclick = () => treeGo(+b.dataset.root));
  $$("#crumbs [data-tv]").forEach(b => b.onclick = () => { treeView = b.dataset.tv; try { localStorage.setItem("stamboom-boomweergave", treeView); } catch (e) {} drawTree(); const n = $(`#crumbs [data-tv="${treeView}"]`); if (n) n.focus(); });
  $$("#crumbs [data-tg2]").forEach(b => b.onclick = () => { treeGen = +b.dataset.tg2; try { localStorage.setItem("stamboom-boomgeneraties", treeGen); } catch (e) {} drawTree(); const n = $(`#crumbs [data-tg2="${treeGen}"]`); if (n) n.focus(); });
  $$("#crumbs [data-tr]").forEach(b => b.onclick = () => { treeRicht = b.dataset.tr; try { localStorage.setItem("stamboom-boomrichting", treeRicht); } catch (e) {} drawTree(); const n = $(`#crumbs [data-tr="${treeRicht}"]`); if (n) n.focus(); });
  $("#crumbs .tree-print").onclick = () => window.print();
  $$("#crumbs [data-fl]").forEach(b => { const licht = on => { const svg = $("svg", host); if (!svg) return; svg.classList.toggle("dim", on); $$("[data-l]", svg).forEach(n => n.classList.toggle("aan", on && n.dataset.l === b.dataset.fl)); };
    b.onmouseenter = b.onfocus = () => licht(true); b.onmouseleave = b.onblur = () => licht(false); });
  const sd = $("#treeDiep"); if (sd) sd.onchange = () => { const n = +sd.value; if (n) { treeOpenTot(n); treeLijst(host); } };
  if (!treeRO && "ResizeObserver" in window) { /* opnieuw tekenen als de breedte verandert (tekeningen staan op schaal 1) */
    let bw0 = w; treeRO = new ResizeObserver(() => { const h = $("#tree"); if (!h || !h.clientWidth || treeDruk) return; const ww = h.clientWidth; if (treeOpzetVan(ww) !== treeOpzet || (treeOpzet !== "lijst" && Math.abs(ww - bw0) > 8)) { bw0 = ww; drawTree(); } });
    treeRO.observe(host);
  }
}
/* één kaart in een tekening (liggend en staand gebruiken dezelfde opmaak); d = generaties vanaf het midden */
function treeKaart(svg, kw, x, y, bw, bh, o = {}) {
  const p = treeP(kw), d = o.d || 0, g = el("g", { class: p ? "node" : "", "data-l": lineOf(kw) || "" }, svg);
  if (!p) {
    el("rect", { x, y, width: bw, height: bh, fill: "none", stroke: "var(--rule)", "stroke-dasharray": "4 3" }, g);
    txt(g, x + 12, y + Math.min(22, bh / 2 + 4), "nog niet gevonden", { "font-size": o.small ? 11.5 : 13, fill: "var(--faint)" });
    return;
  }
  const twin = treeTwin(kw), tag = treeStTag(p), rel = d ? treeRel(d, kw) : "startpunt", kant = treeKant(kw, d);
  el("title", {}, g).textContent = p.n + (p.living ? "" : " " + lifeYears(p)) + (twin ? ` · staat ook als kw ${twin.join(", ")}` : "");
  el("rect", { class: "box", x, y, width: bw, height: bh, fill: "var(--surface)", stroke: twin ? "var(--gold)" : "var(--rule)", "stroke-width": twin ? 2 : 1.2,
    "stroke-dasharray": twin ? null : !p.living && p.st === "D" ? "1 3" : !p.living && p.st === "C" ? "4 3" : null }, g);
  el("rect", { x, y, width: 4, height: bh, fill: lineColor(kw) }, g); /* familiestreep, strak en recht */
  const port = o.foto && portraitOf(fanKw(kw)), tx = port ? 56 : 14;
  if (port) {
    const cid = "pc" + kw, cl = el("clipPath", { id: cid }, el("defs", {}, g));
    el("rect", { x: x + 13, y: y + bh / 2 - 19, width: 38, height: 38 }, cl);
    el("rect", { x: x + 12, y: y + bh / 2 - 20, width: 40, height: 40, fill: "var(--sunk)", stroke: lineColor(kw), "stroke-width": 1 }, g);
    el("image", { href: port.thumb, x: x + 13, y: y + bh / 2 - 19, width: 38, height: 38, preserveAspectRatio: parseFloat(cropOf(port).split(" ")[1]) < 40 ? "xMidYMin slice" : "xMidYMid slice", "clip-path": `url(#${cid})` }, g);
  }
  const room = bw - tx - (tag ? 22 : 10), fsN = o.small ? 12.5 : 13.5, tx2 = o.tweeRegels ? 12 : tx;
  /* bovenaan klein het verwantschapswoord (vanuit het midden); een lang woord wordt kleiner, niet afgebroken */
  if (p.living) y += Math.max(0, Math.floor((bh - (o.tweeRegels ? 50 : 36)) / 2) - 2); /* levenden: alleen woord en naam, verticaal in het midden */
  { const ruimte = bw - tx2 - (tag ? 24 : 8), fr = Math.max(7.5, Math.min(9.5, ruimte / (rel.length * 0.64)));
    txt(g, x + tx2, y + 13, rel.toUpperCase(), { "font-size": fr, "font-family": "var(--mono)", "letter-spacing": ".04em", fill: "var(--muted)", textLength: rel.length * fr * 0.64 > ruimte ? ruimte : null, lengthAdjust: "spacingAndGlyphs" }); }
  const r0 = 14; /* de andere regels staan onder het woord */
  if (o.tweeRegels) { /* staand: voornaam en achternaam op twee regels */
    txt(g, x + 12, y + 16 + r0, trunc(firstName(p), Math.floor((bw - 16) / (fsN * 0.55))), { "font-size": fsN, "font-weight": 600 });
    txt(g, x + 12, y + 31 + r0, trunc(shortSur(splitName(p.n).sur), Math.floor((bw - 16) / (12 * 0.55))), { "font-size": 12, "font-weight": 600 });
    if (!p.living) txt(g, x + 12, y + 45 + r0, lifeYears(p), { "font-size": 11, "font-family": "var(--mono)", fill: "var(--muted)" });
  } else if (o.small) {
    txt(g, x + tx, y + 15 + r0, trunc(treeNaam(p), Math.floor(room / (fsN * 0.55))), { "font-size": fsN, "font-weight": 600 });
    if (!p.living) txt(g, x + tx, y + 29 + r0, lifeYears(p), { "font-size": 11, "font-family": "var(--mono)", fill: "var(--muted)" });
  } else {
    txt(g, x + tx, y + 18 + r0, trunc(treeNaam(p), Math.floor(room / (fsN * 0.55))), { "font-size": fsN, "font-weight": 600 });
    if (!p.living) txt(g, x + tx, y + 33 + r0, trunc([lifeYears(p), ([placeName(p.bp), p.occ].filter(Boolean)[0] || "").split(";")[0]].filter(Boolean).join(" · "), Math.floor((bw - tx - 8) / (11.5 * 0.55))), { "font-size": 11.5, fill: "var(--muted)" });
  }
  if (tag) txt(g, x + bw - 8, y + 13, tag, { "font-size": 10.5, fill: `var(--${{ B: "warn", C: "weak", D: "hyp" }[tag] || "faint"})`, "text-anchor": "end", "font-family": "var(--mono)" }); /* A staat er niet bij: dat is de regel */
  const label = `${rel[0].toUpperCase() + rel.slice(1)}${kant ? ", " + kant : ""}: ${p.n}${p.living ? "" : `, ${lifeYears(p)}, bewijs ${p.st}`}${twin ? `, staat ook als kw ${twin.join(", ")}` : ""}`;
  clickable(g, () => openProfile(fanKw(kw)), label);
}
/* knop "›": dit vak in het midden zetten (verder terug langs deze tak); een strook zo hoog als de kaart, of boven de kaart (staand) */
function treeVerder(svg, kw, x, y, w, h, staand) {
  const p = treeP(kw); if (!p || !treeOuders(kw)) return;
  const b = el("g", { class: "node tree-verder" }, svg);
  el("rect", { x: x + .5, y: y + .5, width: w - 1, height: h - 1, fill: "var(--sunk)", stroke: "var(--accent)", "stroke-width": 1 }, b);
  txt(b, x + w / 2, y + h / 2 + 6, "›", { "text-anchor": "middle", "font-size": 19, fill: "var(--accent)", "font-weight": 600, transform: staand ? `rotate(${staand} ${x + w / 2} ${y + h / 2})` : null });
  clickable(b, e => { e.stopPropagation(); treeGo(kw); }, "Verder terug vanaf " + p.n);
}
const treeKopTxt = (svg, x, y, t, o = {}) => txt(svg, x, y, t.toUpperCase(), Object.assign({ "font-size": 10.5, "font-family": "var(--mono)", fill: "var(--faint)", "letter-spacing": ".06em", "aria-hidden": "true" }, o));
function treeSvg(host, G, vastW) {
  const W = vastW || Math.max(820, Math.floor(host.clientWidth)), gutL = 24, colW = (W - gutL - 4) / G, bw = colW - 30, leaves = 2 ** (G - 1);
  const slot = G === 5 ? 56 : 70, bh = G === 5 ? 48 : 58, top = 30, H = top + 10 + slot * leaves;
  const colX = Array.from({ length: G }, (_, c) => gutL + c * colW), centers = [];
  centers[G - 1] = Array.from({ length: leaves }, (_, j) => top + slot / 2 + j * slot);
  for (let c = G - 2; c >= 0; c--) centers[c] = Array.from({ length: 2 ** c }, (_, j) => (centers[c + 1][2 * j] + centers[c + 1][2 * j + 1]) / 2);
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: vastW ? null : W, role: "group", "aria-label": `Stamboom in ${G} generaties, liggend. Ook als lijst: kies Uitklapbaar.` });
  /* kolomkoppen en de twee kanten */
  for (let c = 1; c < G; c++) treeKopTxt(svg, colX[c], 16, TREE_KOP[c] || `${c} generaties terug`);
  const mid = (top + H - 10) / 2;
  [["vaderskant", (top + mid) / 2], ["moederskant", (mid + H - 10) / 2]].forEach(([t, y]) => treeKopTxt(svg, 12, y, t, { "text-anchor": "middle", transform: `rotate(-90 12 ${y})` }));
  const lines = el("g", { fill: "none", stroke: "var(--rule)", "stroke-width": 1.5 }, svg);
  const kwAt = (c, j) => treeRoot * 2 ** c + j, zicht = (c, j) => c === 0 || !!treeP(kwAt(c, j) >> 1); /* onder een ontbrekende persoon niets meer */
  for (let c = 0; c < G - 1; c++) for (let j = 0; j < 2 ** c; j++) {
    if (!treeP(kwAt(c, j))) continue;
    const x1 = colX[c] + bw, y = centers[c][j], x2 = colX[c + 1], mx = (x1 + x2) / 2;
    [2 * j, 2 * j + 1].forEach(k => { const a = schakelDash(kwAt(c + 1, k)); lines.insertBefore(el("path", { d: `M${x1} ${y}H${mx}V${centers[c + 1][k]}H${x2}`, ...a }), a.stroke ? lines.firstChild : null); }); /* stippellijnen onder de gewone */
  }
  for (let c = 0; c < G; c++) for (let j = 0; j < 2 ** c; j++) {
    if (!zicht(c, j)) continue;
    const kw = kwAt(c, j), y = centers[c][j] - bh / 2;
    treeKaart(svg, kw, colX[c], y, bw, bh, { small: G === 5, foto: G !== 5 && bw >= 190, d: c });
    if (c === G - 1 && !vastW) treeVerder(svg, kw, colX[c] + bw + 3, y, 26, bh);
  }
  host.innerHTML = ""; host.appendChild(svg);
  if (vastW) treeDrukRegels(host, G);
}
/* afdrukken: kop- en voetregel */
function treeDrukRegels(host, G) {
  const p = treeP(treeRoot);
  host.insertAdjacentHTML("afterbegin", `<p class="tree-druk">Stamboom van ${esc(T.rootFull || T.root)} · vanaf ${esc(treeRoot === 1 ? T.root : p ? p.n : "kw " + treeRoot)} · ${G} generaties</p>`);
  host.insertAdjacentHTML("beforeend", `<p class="tree-druk small">${esc(VERSION)} · ${esc(location.href.replace(/^file:\/\/.*?([^/]+\.html)/, "$1"))} · Gestreepte lijn: onzekere koppeling (C) · gestippeld: hypothese (D) · goud: dezelfde voorouder via twee lijnen · B–D: hoe sterk het bewijs is</p>`);
}
/* staand: standaard het midden boven en de oudere generaties naar beneden (de lees- en scrolrichting, zoals de lijst), of
   omgedraaid (treeRicht "boven": de oudste generatie boven, zoals een stamboomplaat). Elk ouderpaar gecentreerd bij hun kind,
   vader links; "›" aan de kant van de oudste generatie */
function treeStaand(host, vastW) {
  const onder = treeRicht !== "boven", G = 4, leaves = 2 ** (G - 1), W = vastW || Math.max(820, Math.floor(host.clientWidth)), gutL = 22, colW = (W - gutL - 8) / leaves, bw = colW - 12, bh = 72, gap = 46;
  const top = vastW ? 16 : onder ? 8 : 38, H = top + G * (bh + gap) - gap + (vastW ? 16 : onder ? 40 : 10); /* ruimte voor "›", of bij afdrukken voor de rijlabels */
  const rowY = r => top + (onder ? r : G - 1 - r) * (bh + gap); /* rij r = generatie r vanaf het midden */
  const cx = [];
  cx[G - 1] = Array.from({ length: leaves }, (_, j) => gutL + colW / 2 + j * colW);
  for (let r = G - 2; r >= 0; r--) cx[r] = Array.from({ length: 2 ** r }, (_, j) => (cx[r + 1][2 * j] + cx[r + 1][2 * j + 1]) / 2);
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: vastW ? null : W, role: "group", "aria-label": `Stamboom in ${G} generaties, staand: ${onder ? "het midden boven, de oudste generatie onder" : "de oudste generatie boven, het midden onder"}. Ook als lijst: kies Uitklapbaar.` });
  for (let r = 1; r < G; r++) { const y = rowY(r) + bh / 2; treeKopTxt(svg, 11, y, TREE_KOP[r], { "text-anchor": "middle", transform: `rotate(-90 11 ${y})` }); }
  const lines = el("g", { fill: "none", stroke: "var(--rule)", "stroke-width": 1.5 }, svg);
  const kwAt = (r, j) => treeRoot * 2 ** r + j;
  for (let r = 0; r < G - 1; r++) for (let j = 0; j < 2 ** r; j++) {
    if (!treeP(kwAt(r, j))) continue;
    const yc = onder ? rowY(r) + bh : rowY(r), yp = onder ? rowY(r + 1) : rowY(r + 1) + bh, my = (yc + yp) / 2;
    [2 * j, 2 * j + 1].forEach(k => { const a = schakelDash(kwAt(r + 1, k)); lines.insertBefore(el("path", { d: `M${cx[r][j]} ${yc}V${my}H${cx[r + 1][k]}V${yp}`, ...a }), a.stroke ? lines.firstChild : null); });
  }
  for (let r = 0; r < G; r++) for (let j = 0; j < 2 ** r; j++) {
    const kw = kwAt(r, j); if (r > 0 && !treeP(kw >> 1)) continue;
    const w = r === 0 ? Math.min(260, bw * 1.8) : bw;
    treeKaart(svg, kw, cx[r][j] - w / 2, rowY(r), w, bh, { small: true, tweeRegels: r > 0, d: r });
    if (r === G - 1 && !vastW) { const bw2 = Math.min(bw, 48); treeVerder(svg, kw, cx[r][j] - bw2 / 2, onder ? rowY(r) + bh + 4 : rowY(r) - 30, bw2, 26, onder ? 90 : -90); }
  }
  host.innerHTML = ""; host.appendChild(svg);
  if (vastW) treeDrukRegels(host, G);
}
/* afdrukken: een vaste opzet (liggend, 4 generaties) op A4 liggend; daarna weer de gewone weergave */
addEventListener("beforeprint", () => {
  if (route.view !== "boom" || !$("#tree")) return;
  treeDruk = true; document.documentElement.classList.add("boom-druk");
  if (!$("#boomPagina")) document.head.insertAdjacentHTML("beforeend", `<style id="boomPagina">@page{size:A4 landscape;margin:12mm}</style>`);
  drawTree();
});
addEventListener("afterprint", () => {
  if (!treeDruk) return;
  treeDruk = false; document.documentElement.classList.remove("boom-druk");
  const s = $("#boomPagina"); if (s) s.remove();
  drawTree();
});
/* uitklapbaar: elke tak met bekende ouders heeft een knop + / − (aria-expanded); standaard 4 generaties open */
function treeOpenTot(n) {
  treeOpen = new Set(); treeOpenRoot = treeRoot; treeDiep = n; /* de keuzelijst toont de gekozen diepte; los in- of uitklappen zet hem op "eigen keuze" */
  const add = (kw, d) => { if (d >= n - 1 || !treeP(kw) || d > 9) return; treeOpen.add(kw); add(kw * 2, d + 1); add(kw * 2 + 1, d + 1); };
  add(treeRoot, 0);
}
function treeLijst(host, focusKw) {
  if (!treeOpen || treeOpenRoot !== treeRoot) treeOpenTot(4);
  const kaart = (kw, d) => {
    const p = treeP(kw), rel = d ? treeRel(d, kw) : "";
    if (!p) return `<div class="tl-r"><span class="tl-tg leeg" aria-hidden="true"></span><div class="tl-k leeg"><small>${esc(rel)}</small><span>nog niet gevonden</span></div></div>`;
    const twin = treeTwin(kw), st = !p.living && (p.st === "C" || p.st === "D") ? " st-" + p.st : "", open = treeOpen.has(kw), kan = treeOuders(kw) && d < 10;
    const tg = kan ? `<button class="tl-tg" data-tg="${kw}" aria-expanded="${open}" aria-label="Ouders van ${esc(p.n)} ${open ? "verbergen" : "tonen"}">${open ? "−" : "+"}</button>` : `<span class="tl-tg leeg" aria-hidden="true"></span>`;
    const verder = kan && !open && d > 0 ? `<button class="tl-verder" data-root="${kw}" aria-label="Verder terug vanaf ${esc(p.n)}">verder ›</button>` : ""; /* dit vak in het midden zetten */
    return `<div class="tl-r">${tg}<button class="tl-k${twin ? " twin" : ""}${st}" data-open="${fanKw(kw)}" style="--c:${lineColor(kw)}"${twin ? ` title="Staat ook als kw ${twin.join(", ")}"` : ""}>${rel ? `<small>${esc(rel)}${treeStTag(p) ? " · " + treeStTag(p) : ""}</small>` : ""}<b>${esc(p.n)}</b>${p.living ? "" : `<span>${esc([lifeYears(p), placeName(p.bp)].filter(Boolean).join(" · "))}</span>`}</button>${verder}</div>`;
  };
  const tak = (kw, d) => `<li>${kaart(kw, d)}${treeOpen.has(kw) && treeP(kw) ? `<ol>${tak(kw * 2, d + 1)}${tak(kw * 2 + 1, d + 1)}</ol>` : ""}</li>`;
  host.innerHTML = `<ol class="tree-lijst">${tak(treeRoot, 0)}</ol>`;
  $$(".tl-tg[data-tg]", host).forEach(b => b.onclick = () => { const kw = +b.dataset.tg; if (treeOpen.has(kw)) treeOpen.delete(kw); else treeOpen.add(kw); treeDiep = 0; const sd = $("#treeDiep"); if (sd) sd.value = ""; treeLijst(host, kw); });
  $$(".tl-verder", host).forEach(b => b.onclick = () => treeGo(+b.dataset.root));
  if (focusKw) { const b = $(`.tl-tg[data-tg="${focusKw}"]`, host); if (b) b.focus(); }
}

/* ---------- overzicht ---------- */
function statusBars() {
  const cnt = { A: 0, B: 0, C: 0, D: 0 }; ancestors.forEach(p => cnt[p.st]++);
  const tot = ancestors.length;
  return ["A", "B", "C", "D"].filter(s => cnt[s]).map(s => `
    <div style="display:grid;grid-template-columns:112px minmax(0,1fr) 5.6em;gap:10px;align-items:center;margin:8px 0">
      ${stTag(s, true)}
      <span style="height:10px;background:var(--sunk);border-radius:5px;overflow:hidden"><span class="st-${s}" style="display:block;height:100%;width:${(cnt[s] / tot * 100).toFixed(1)}%;background:currentColor"></span></span>
      <span class="mono small" style="text-align:right;color:var(--ink)">${pctN(cnt[s], tot)}</span></div>`).join("");
}
/* standaardtekst onder de statusverdeling, uit de cijfers zelf */
function statusNoteAuto() {
  const S = STATS || (STATS = computeStats());
  const a = S.gens.length && S.aTo ? `Generatie ${ROMAN[S.gens[0].g]} tot en met ${ROMAN[S.aTo]} staat volledig op akten. ` : "";
  const weak = S.gens.find(x => x.c.A * 2 < x.filled - x.c.L);
  return a + (weak ? `Vanaf generatie ${ROMAN[weak.g]} rust het meeste op genealogieën van anderen (B tot D) in plaats van op akten.` : "");
}
/* kaart van een verhaal (data/21-story-cards.js): omslag: een historisch beeld uit het register, anders de tekening */
const STAGS = typeof STORY_TAGS !== "undefined" ? STORY_TAGS : {};
const storyCov = st => { const c = (typeof STORY_CARDS !== "undefined" && STORY_CARDS[st.id]) || {}; return { c, im: c.img ? IMGS.find(x => x.id === c.img) || null : null, art: ART[c.art || st.art] || ART.farm }; };
const covStyle = c => [c.pos ? `object-position:${c.pos}` : "", c.zoom ? `transform:scale(${c.zoom});transform-origin:${c.pos || "50% 50%"}` : "", c.tone ? `filter:var(--card-tone) ${c.tone}` : ""].filter(Boolean).join(";");
const sideTag = side => side ? `<span class="vside vside-${side}"><svg viewBox="0 0 15 15" aria-hidden="true"><circle cx="7.5" cy="7.5" r="6"/><path d="${side === "h" ? "M7.5 1.5a6 6 0 0 0 0 12z" : "M7.5 1.5a6 6 0 0 1 0 12z"}"/></svg>${side === "h" ? "Harrie" : "Alies"}</span>` : "";
const storyTags = st => (storyCov(st).c.tags || []).filter(t => STAGS[t]);
/* feiten bij een verhaal, uit de data: periode (geboorte- en sterfjaren van de overleden mensen erin), aantal mensen, aantal beelden */
function storyFacts(st) {
  const ps = st.people.map(person).filter(p => p && !p.living), ys = ps.flatMap(p => [yr(p.b), yr(p.d)]).filter(Boolean), n = storyImgs(st.id).length;
  return [ys.length ? `${Math.min(...ys)}–${Math.max(...ys)}` : "", `${ps.length} ${ps.length === 1 ? "persoon" : "mensen"}`, n ? `${n} ${n === 1 ? "beeld" : "beelden"}` : ""].filter(Boolean).join(" · ");
}
function storyCard(s) { const { c, im, art } = storyCov(s), tg = storyTags(s); return `<button class="storycard${im ? " hasimg" : ""}" data-go="verhaal-${s.id}"><div class="art">${im ? `<img src="${c.zoom ? im.src : im.thumb}" alt="" width="${im.w}" height="${im.h}" loading="lazy" decoding="async"${covStyle(c) ? ` style="${covStyle(c)}"` : ""}>` : art}</div><div class="tx"><span class="vmeta">${sideTag(s.side)}${tg.length ? `<span class="vtags">${tg.map(t => esc(STAGS[t])).join(" · ")}</span>` : `<span class="vtags">Verhaal</span>`}</span><h3>${esc(s.title)}</h3><p>${esc(s.lede)}</p><span class="vfacts">${esc(storyFacts(s))}</span></div></button>`; }
function factCard(f) { const p = person(f.kw), kan = p && !p.living; /* de hele kaart opent het profiel; het verhaal blijft apart klikbaar */
  return `<article class="fact${kan ? " kaart-link" : ""}"><span class="yr"><span>${esc(f.y)}</span>${stTag(f.st)}</span><h3>${esc(f.t)}</h3><p>${esc(f.x)}</p><div class="acts">${kan ? `<button class="link hoofd" data-open="${f.kw}">${esc(p.n)}</button>` : ""}${f.story ? `<button class="link" data-go="verhaal-${f.story}">Lees het verhaal</button>` : ""}</div></article>`; }
/* Keuzes voor het overzicht. Elke dag een andere greep (dagnummer), zodat de voorpagina wisselt;
   in de samengestelde boom om en om van de kant van Harrie en van Alies. */
const dayIdx = () => { const n = new Date(); return Math.floor((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - Date.UTC(n.getFullYear(), 0, 1)) / 864e5); };
const sideOfKw = kw => T.key !== "s" ? T.key : kw >> (gen(kw) - 2) === 2 ? "h" : "a";
const rotate = (xs, k) => xs.length ? xs.slice(k % xs.length).concat(xs.slice(0, k % xs.length)) : xs;
const zip = (a, b) => { const r = []; for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i]) r.push(a[i]); if (b[i]) r.push(b[i]); } return r; };
/* feiten: eerst A (akte), dan B, C, D; binnen een status wisselt de volgorde per dag */
function pickFacts() {
  const d = dayIdx();
  return ["A", "B", "C", "D"].flatMap(st => {
    const g = FACTS.filter(f => f.st === st);
    return T.key === "s" ? zip(rotate(g.filter(f => sideOfKw(f.kw) === "h"), d), rotate(g.filter(f => sideOfKw(f.kw) === "a"), d)) : rotate(g, d);
  }).concat(FACTS.filter(f => !["A", "B", "C", "D"].includes(f.st)));
}
/* drie verhalen met elk een ander onderwerp; in de samengestelde boom van beide kanten */
function pickStories(n) {
  const d = dayIdx(), pool = T.key === "s" ? zip(rotate(STORIES.filter(s => s.side === "h"), d), rotate(STORIES.filter(s => s.side === "a"), d)) : rotate(STORIES, d);
  const out = [], used = new Set();
  for (const s of pool) { if (out.length >= n) break; const t = storyTags(s)[0]; if (t && used.has(t)) continue; used.add(t); out.push(s); }
  for (const s of pool) { if (out.length >= n) break; if (!out.includes(s)) out.push(s); }
  return out;
}
/* op de voorpagina geen zinnen met aantallen uit een oude versie: die spreken de live cijfers erboven tegen (jaartallen mogen) */
const noCount = t => !/\b(?!(?:1[5-9]|20)\d\d\b)\d[\d.]*\b/.test(t) && !/\b(?:tien|elf|twaalf|dertien|veertien|vijftien|zestien) generaties\b/i.test(t);
/* "alle …"-link onder een blok op het overzicht: overal dezelfde vorm, links uitgelijnd, met een pijl */
const ovMore = (attrs, txt) => `<p class="ov-more"><button type="button" class="ov-link" ${attrs}>${txt} →</button></p>`;
const firstSentence = t => { const m = /^(.{40,220}?[.!?])(\s|$)/.exec(t); return m ? m[1] : t.length > 220 ? t.slice(0, 200).replace(/\s+\S*$/, "") + " …" : t; };
function renderOverzicht() {
  const S = STATS || (STATS = computeStats());
  const H = honestStats(), oldest = H.yearProven < 9999 ? H.yearProven : S.oldestYearAB; /* "met bronnen terug tot": ook een jaartal zonder exacte datum, mits de keten A of B is */
  const cl = CHANGELOG[0];
  $("#v-overzicht").innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow">Stamboom van ${esc(T.rootFull)} · <span class="nw">${esc(VERSION).split(" · ").join('</span> · <span class="nw">')}</span></div>
        <h1>${T.TXT.heroTitle || "Boeren, veehouders en grutters uit <em>Friesland</em> en de Kop van Overijssel"}</h1>
        <p class="lede">${T.TXT.heroLede ? esc(T.TXT.heroLede.replace("{oldest}", oldest)) : `De voorouders van Harrie de Groot en zijn broers en zussen, met bronnen terug tot ${oldest}. Acht families, bijna allemaal katholiek, die grotendeels binnen een straal van enkele tientallen kilometers bleven wonen. In de familie: een heilige, een kanunnik en een doopsgezinde tak.`}</p>
        <div class="stats">${[[H.n, "voorouders", H.weak ? `waarvan ${H.weak} onzeker gekoppeld (C of D)` : "allemaal bewezen gekoppeld"], [H.genProven, "generaties bewezen", H.genAll > H.genProven ? `met aanwijzingen tot ${H.genAll}` : ""], [S.nPlaces, "plaatsen", ""], [H.oldProven || "–", "oudste bewezen jaar", H.oldAll !== null && H.oldAll <= H.oldProven - 10 ? `met aanwijzingen: ${H.oldAll}` : ""]].map(s => `<div class="stat"><b>${s[0]}</b><span>${s[1]}</span>${s[2] ? `<small>${s[2]}</small>` : ""}</div>`).join("")}</div>
        <div class="cta"><button class="btn primary" data-go="stamboom">Bekijk de stamboom</button>${T.key === "s" && typeof renderVerbanden === "function" ? `<button class="btn" data-go="verbanden">Waar de families elkaar kruisten</button>` : ""}${RENDER.zoeken && typeof zoekItems === "function" && zoekItems().length ? `<button type="button" class="ov-link cta-zoek" data-go="zoeken">${zoekItems().length} open vragen: help mee zoeken →</button>` : ""}</div>
      </div>
    ${(() => { const st = STORIES.length ? pickStories(1)[0] : null; return `<div class="ingangen">
      <button class="ingang" id="heroSearch">${navIco("zoek")}<span><b>Zoek je opa, oma of overgrootouder</b><small>Typ een naam, een dorp of een jaartal</small></span></button>
      ${RENDER.verwant ? `<button class="ingang" data-go="verwant">${navIco("verwant")}<span><b>Hoe zijn we familie?</b><small>Kies twee mensen en zie langs welke voorouders</small></span></button>` : ""}
      ${st ? `<button class="ingang" data-go="verhaal-${st.id}">${navIco("verhalen")}<span><b>Lees een verhaal</b><small>Vandaag: ${esc(st.title)}</small></span></button>` : ""}
    </div>`; })()}
      <div class="hero-fan"><div id="heroFan"></div><div class="fan-note" id="heroFanNote"></div></div>

    </div>
    ${Object.keys(TREES).length > 1 ? `<div class="section-head" id="kiesboom"><h2>${navIco("stamboom")} Kies een stamboom</h2><p>Drie stambomen op één site.</p></div>
    <div class="bomen">${["h", "s", "a"].filter(k => TREES[k]).map(k => { const t = TREES[k], n = t.PEOPLE.filter(p => !p.alias && !p.living).length, nu = k === T.key; /* zelfde opbouw als de drie ingangen; het teken is het halve of hele rondje van de kant van Harrie, van Alies, of van beiden */
      const ico = `<svg viewBox="0 0 15 15" aria-hidden="true"><circle cx="7.5" cy="7.5" r="6"/>${k === "s" ? `<circle cx="7.5" cy="7.5" r="6" class="vol"/>` : `<path class="vol" d="${k === "h" ? "M7.5 1.5a6 6 0 0 0 0 12z" : "M7.5 1.5a6 6 0 0 1 0 12z"}"/>`}</svg>`;
      return `<button type="button" class="ingang boom" data-tree="${k}" aria-pressed="${nu}">${ico}<span>${nu ? `<i class="nu">Je bekijkt deze stamboom</i>` : ""}<b>${esc(k === "s" ? t.rootFull : t.root)}</b><small>${esc(TREE_INFO[k])}</small><small>${esc(t.brand)} · ${nl(n)} voorouders</small>${nu ? "" : `<em>Open deze stamboom →</em>`}</span></button>`; }).join("")}</div>` : ""}
    <div class="section-head"><h2>${navIco("families")} De acht families</h2><p>Elke overgrootouder opent een eigen lijn.</p></div>
    <div class="grid-4 ov-swipe">${LINE_KEYS.map(famCard).join("")}</div>
    ${(() => { const fp = ancestors.filter(p => portraitOf(p.kw)); return fp.length ? `<div class="section-head"><h2>${navIco("beeld")} Gezichten uit de familie</h2><p>Voorouders van wie een foto bewaard is gebleven.</p></div><div class="faces ov-swipe">${fp.map(faceCard).join("")}</div>${ovMore(`id="seePortraits"`, "Alle portretten")}` : ""; })()}
    ${IMGS.length ? (() => { const tp = topPlaces(ancestors, 40).filter(x => placeHist(x[0])).slice(0, 8); /* alleen historische beelden */ return tp.length >= 4 ? `<div class="section-head"><h2>${navIco("kaart")} Waar ze woonden</h2><p>De dorpen uit de akten, in oude foto's en prenten.</p></div><div class="ptiles band">${tp.map(x => placeTile(x[0], x[1] + " keer in de akten", "", histLine(x[0]))).join("")}</div>${ovMore("data-archief", `Alle ${nl(ARCH_ALL.length)} archiefbeelden`)}${credits(tp.map(x => tileImg(x[0])))}` : ""; })() : ""}
    ${NOTABLES.some(N => N.verdict === "bewezen") ? `<div class="section-head"><h2>${navIco("verwanten")} Bekende verwanten</h2><p>Wie uit de geschiedenisboeken hoort bij de familie?</p></div>
    <div class="grid-3 nminis ov-swipe">${NOTABLES.filter(N => N.verdict === "bewezen" && N.id !== "overmeer").map(N => notableCard(N, true)).join("")}</div>${ovMore(`data-go="verwanten"`, "Alles over adel, macht en geld")}` : ""}
    ${STORIES.length ? `<div class="section-head"><h2>${navIco("verhalen")} Verhalen</h2><p>De rode draden in de familiegeschiedenis.</p></div>
    <div class="grid-3 ov-swipe">${pickStories(3).map(storyCard).join("")}</div>${ovMore(`data-go="verhalen"`, `Alle ${STORIES.length} verhalen`)}` : ""}
    ${FACTS.length ? `<div class="section-head"><h2>${navIco("opvallend")} Opvallend</h2><p>Feiten uit de akten, elke dag een andere greep.</p></div>
    <div class="grid-3 ov-swipe" id="factGrid">${pickFacts().slice(0, 6).map(factCard).join("")}</div>${FACTS.length > 6 ? ovMore(`data-go="opvallend"`, `Alle ${FACTS.length} opvallende feiten`) : ""}` : ""}
    <div class="section-head"><h2>${navIco("vandaag")} Vandaag</h2><p>Wat er op deze datum gebeurde, en wat er nieuw is.</p></div>
    <div class="cols" style="align-items:start">${onThisDay()}
      ${(() => { const sv = sinceLastVisit(), its = sv ? sv.entries.flatMap(e => e.items) : cl.items; return `<div class="box">${sv ? `<span class="eyebrow">Sinds je vorige bezoek (${esc(sv.last.toLowerCase())})</span><h3>Nieuw voor jou: ${sv.entries.length === 1 ? esc(cl.v.toLowerCase()) : sv.entries.length + " versies"}</h3>` : `<h3>Nieuw in ${esc(cl.v.toLowerCase())}</h3>`}<ul>${its.map(firstSentence).filter(noCount).slice(0, 3).map(i => `<li>${esc(i)}</li>`).join("")}</ul>`; })()}<p class="ov-more" style="display:flex;gap:4px 18px;flex-wrap:wrap">${NEWSET.size ? `<button type="button" class="ov-link" id="seeNew">De ${NEWSET.size} nieuwe voorouders →</button>` : ""}${UPDSET.size ? `<button type="button" class="ov-link" id="seeUpd">De ${UPDSET.size} bijgewerkte profielen →</button>` : ""}<button type="button" class="ov-link" id="seeChanges">Alle wijzigingen →</button></p></div>
    </div>
    <div class="section-head"><h2>${navIco("meer")} Verder op deze site</h2><p>Van het grote plaatje tot de akte.</p></div>
    <div class="layers${RENDER.verwant || RENDER.zoeken ? " c4" : ""}">
      ${[["stamboom", "fan", "Stamboom", "Alle voorouders in een waaier, of stap voor stap terug in de boom."],
         ["families", "fam", "Families", "De acht familielijnen, elk met eigen verhaal, stamvaders en plaatsen."],
         ["personen", "card", "Personen", "Een profiel per persoon: data, familie, levensloop, scans en bronnen."],
         ...(RENDER.verwant ? [["verwant", "rel", "Hoe zijn we familie?", "Kies twee personen en zie langs welke voorouders ze verwant zijn."]] : []),
         ["verhalen", "book", "Verhalen", T.TXT.layerVerhalen || "De rode draden: de naam De Groot, het katholieke leven, verhuizingen."],
         ["tijdlijn", "clock", "Tijdlijn", "Welke levens elkaar overlapten, tegen de achtergrond van hun tijd."],
         ["kaart", "pin", "Kaart", "Wie woonde waar, en hoe de families zich verplaatsten."],
         ["beeld", "photo", "Beeld", "Portretten, bidprentjes, oude foto's van de dorpen en duizenden beelden uit de archieven."],
         ["cijfers", "chart", "Cijfers", "Levensduur, trouwdagen, namen, beroepen en geld, berekend uit de akten."],
         ["verwanten", "star", "Bekende verwanten", T.TXT.layerVerwanten || "Een heilige, een kanunnik, en wat er van adel en macht klopt."],
         ["bronnen", "archive", "Bronnen", "Hoe betrouwbaar alles is, wat nog open staat en waar je verder zoekt."],
         ...(RENDER.zoeken ? [["zoeken", "ask", "Help mee zoeken", "Open vragen in de stamboom: in welk archief het antwoord ligt en hoe je het vindt."]] : [])].map(l => `<button class="layer" data-go="${l[0]}">${navIco(l[0])}<span><h3>${l[2]}</h3><p>${l[3]}</p></span></button>`).join("")}
    </div>
    <div class="section-head"><h2>${navIco("bronnen")} Hoe betrouwbaar is dit?</h2><p>Elk gegeven heeft een label voor de sterkte van het bewijs.</p></div>
    <div class="cols" style="align-items:start">
      <div class="box"><h3>Status van de voorouders</h3>${statusBars()}<p class="small" style="margin:10px 0 0">${esc(T.TXT.statusNote || statusNoteAuto())}</p></div>
      <div class="box"><h3>Hoe vol is de stamboom?</h3>${genCompleteness(S.gens)}</div>
    </div>${ovMore(`data-go="bronnen"`, "Meer over de bronnen")}`;
  heroFan();
  $("#heroSearch").onclick = openSearch;
  const sn = $("#seeNew"); if (sn) sn.onclick = () => showChanged("new");
  const su = $("#seeUpd"); if (su) su.onclick = () => showChanged("upd");
  const sc = $("#seeChanges"); if (sc) sc.onclick = () => go("bronnen-wijzigingen");
  const sp = $("#seePhotos"); if (sp) sp.onclick = () => beeldNaar("foto");
  const spp = $("#seePortraits"); if (spp) spp.onclick = () => beeldNaar("portret");
}
function faceCard(p) {
  const im = portraitOf(p.kw), sn = splitName(p.n);
  return `<button class="face" style="--c:${lineColor(p.kw)}" data-open="${p.kw}"><span class="pava big"><img src="${im.thumb}" alt="" loading="lazy" decoding="async" style="object-position:${cropOf(im)}"></span><b>${esc(firstName(p))} ${esc(shortSur(sn.sur))}</b><small class="mono">${esc(lifeYears(p))}</small><small>${esc(relTerm(p.kw))}</small></button>`;
}
function famCard(l) {
  const ps = ancestors.filter(p => p.kw >= 8 && lineOf(p.kw) === l);
  const oldest = Math.min(...ps.filter(p => (p.st === "A" || p.st === "B") && ketenBewezen(p)).map(oudsteJaar)); /* zelfde maat als de kerncijfers: alleen wie via een A/B-keten vaststaat */
  const deep = Math.max(...ps.map(p => gen(p.kw)));
  /* naam bovenaan (op elke kaart op dezelfde hoogte), dan de aangetrouwde namen en het gebied; onderaan drie vaste stukjes */
  return `<button class="fam" style="--c:var(--l${l})" data-go="lijn-${l}">
    <span class="fam-bar" aria-hidden="true"></span>
    <h3>${esc(LINES[l].name)}</h3><p>${esc(LINES[l].sub)}</p><p class="fam-reg">${esc(LINES[l].region)}</p>
    <span class="fam-stats"><span>${ps.length} personen</span><span>tot generatie ${ROMAN[deep]}</span>${oldest < 9999 ? `<span>sinds ${oldest}</span>` : ""}</span></button>`;
}

/* ---------- stamboom ---------- */
function renderStamboom(sub) {
  fanRoot = fanRootOk(sub) ? sub : 1; if (fanRoot > 1) mode = "fan";
  drawFan($("#fan"), { maxGen: 9, labelGen: 7, root: fanRoot, more: true }); fanCrumbs(); fanJump(); fanLede();
  let comp = "";
  const fr = fanRoot, maxG = fr > 1 ? fanRelGens(fr) : Math.max(...ancestors.map(p => gen(p.kw)));
  for (let g = 2; g <= maxG; g++) {
    const tot = 2 ** (g - 1); let f = 0; for (let k = tot; k < tot * 2; k++) if (fr > 1 ? person(fanKw(fr * tot + k - tot)) : person(k)) f++;
    comp += `<div style="display:grid;grid-template-columns:34px minmax(0,1fr) 54px;gap:8px;align-items:center;margin:5px 0;font-size:12.5px"><span class="mono">${ROMAN[g]}</span><span style="height:8px;background:var(--sunk);border-radius:4px;overflow:hidden"><span style="display:block;height:100%;width:${f / tot * 100}%;background:var(--accent)"></span></span><span class="mono" style="text-align:right">${f}/${tot}</span></div>`;
  }
  $("#fanSide").innerHTML = `
    <div><h5>Gevonden per generatie${fanRoot > 1 ? " boven " + esc(firstName(person(fanKw(fanRoot)))) : ""}</h5>${fanRoot > 1 ? `<p class="small" style="margin:0 0 6px">I is ${esc(firstName(person(fanKw(fanRoot))))} zelf, II de ouders.</p>` : ""}${comp}</div>
    <div><h5>Zo lees je de vakken</h5><p style="margin:0">Hoe voller de kleur, hoe sterker het bewijs. Een gestippelde rand: alleen uit online stambomen (C). Een fijn gestippelde, bijna lege rand: een hypothese (D). Een gestippeld leeg vak: nog niet gevonden. Een gouden rand: dezelfde persoon staat twee keer in de stamboom (<button class="link" data-go="${implexStory()}">kwartierverlies</button>).</p><p style="margin:8px 0 0">${(() => { const mg = Math.max(...ancestors.map(p => gen(p.kw))); return mg > 9 ? `De waaier toont negen generaties; generatie X${mg > 10 ? " tot en met " + ROMAN[mg] + " staan" : " staat"} bij <button class="link" data-go="personen">Personen</button>.` : "De waaier toont alle generaties."; })()} Een boogje buiten de rand: daar gaat de lijn verder; kies het om die tak in het midden te zetten.</p></div>`;
  setMode("fan");
}

/* ---------- families ---------- */
/* kleine kaart: een stip per dorp, kleur van de familie die er het meest voorkomt; andere dorpen grijs */
function dotMap(ev, label, nLabels = 12) {
  const svg = el("svg", { viewBox: `0 0 ${MW} ${MH}`, role: "img", "aria-label": label });
  drawBase(svg, true);
  const list = aggregate(ev), here = new Set(list.map(a => a.key)), dots = el("g", {}, svg), labels = el("g", { "pointer-events": "none" }, svg);
  if (ev !== EVENTS) aggregate(EVENTS).filter(a => !here.has(a.key)).forEach(a => { const Q = PLACES[a.key], [x, y] = proj(Q.la, Q.lo); el("circle", { cx: x, cy: y, r: 3.5, fill: "var(--faint)", "fill-opacity": 0.5 }, dots); });
  list.forEach(a => {
    const P = PLACES[a.key], [x, y] = proj(P.la, P.lo), n = a.people.size, dom = +Object.entries(a.lines).sort((p, q) => q[1] - p[1])[0][0];
    const gg = el("g", { class: "place-dot" }, dots);
    el("circle", { class: "d", cx: x, cy: y, r: 4 + 2.4 * Math.sqrt(n), fill: dom ? `var(--l${dom})` : "var(--accent)", "fill-opacity": 0.85, stroke: "var(--surface)", "stroke-width": 1.5 }, gg);
    clickable(gg, () => go(slug(a.key)), placeName(a.key));
    bindTip(gg, `<b>${esc(placeName(a.key))}</b><br>${n} ${n === 1 ? "persoon" : "personen"}`);
  });
  const placed = [];
  list.slice(0, nLabels).forEach(a => { const P = PLACES[a.key], [x, y] = proj(P.la, P.lo), r = 4 + 2.4 * Math.sqrt(a.people.size); if (!labelFits(placed, x + r + 3, y + 4, a.key, 12)) return; txt(labels, x + r + 3, y + 4, a.key, { "font-size": 12, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 3, "paint-order": "stroke" }); });
  return svg;
}
function renderFamilies(l) {
  const host = $("#v-families");
  if (!l || !LINES[l]) {
    host.innerHTML = `<div class="eyebrow">Families</div><h1 class="page-title">De acht families</h1>
      <p class="lede">Elke lijn begint bij een van de acht overgrootouders van ${esc(T.root)}, met de stamvaders, de plaatsen en alle voorouders.</p>
      <div class="grid-4" style="margin-top:22px">${LINE_KEYS.map(famCard).join("")}</div>
      <div class="section-head"><h2>Waar de families woonden</h2><p>${esc(T.TXT.famMapSub || "Van de Stellingwerven tot Gaasterland en de Kop van Overijssel.")}</p></div>
      <div class="pane"><div class="map-wrap"><div class="map" id="famMap"></div><aside class="map-side">
        <p class="small" style="margin:0">Elke stip is een dorp uit de akten, gekleurd naar de familie die er het vaakst voorkomt. Hoe groter de stip, hoe meer voorouders. Per familie de drie dorpen met de meeste voorouders:</p>
        <ul class="evlist">${LINE_KEYS.map(l => `<li style="grid-template-columns:14px minmax(0,1fr)"><span class="y" style="color:var(--l${l})">●</span><span><button data-go="lijn-${l}">${esc(LINES[l].name)}</button><span class="t">${aggregate(EVENTS.filter(e => lineOf(e.kw) === l)).slice(0, 3).map(a => `<button class="link" data-go="${slug(a.key)}">${esc(placeName(a.key))}</button>`).join(", ")}</span></span></li>`).join("")}</ul>
        <div class="links"><button class="btn" data-go="kaart">Naar de grote kaart</button></div>
      </aside></div></div>`;
    $("#famMap").appendChild(dotMap(EVENTS, "Kaart met de dorpen van de acht families"));
    return;
  }
  const L = LINES[l], ps = ancestors.filter(p => lineOf(p.kw) === l).sort((a, b) => a.kw - b.kw);
  const cnt = { A: 0, B: 0, C: 0, D: 0 }; ps.forEach(p => cnt[p.st]++);
  const places = {}; ps.forEach(p => lifeEvents(p).forEach(e => { const k = mapKey(e.p); if (PLACES[k]) places[k] = (places[k] || 0) + 1; }));
  const sts = STORIES.filter(s => s.line === l || s.people.some(k => lineOf(k) === l && k >= 8));
  const stem = (L.stem || []).map(person).filter(Boolean);
  host.innerHTML = `
    <div class="eyebrow"><button class="link" data-go="families">De acht families</button> › ${esc(L.name)}</div>
    <div class="linehead" style="--c:var(--l${l});margin-top:12px">
      <div>
        <div class="eyebrow">Lijn ${l} · ${esc(L.region)}</div>
        <h1>${esc(L.name)}</h1>
        <p class="small" style="font-size:14px;margin:4px 0 0">met ${esc(L.sub)}</p>
        <p class="lede" style="color:var(--ink)">${esc(L.intro)}</p>
        <p class="small" style="margin-top:12px">${ps.length} voorouders · ${stTag("A")} ${cnt.A} · ${stTag("B")} ${cnt.B} · ${stTag("C")} ${cnt.C || 0}${cnt.D ? ` · ${stTag("D")} ${cnt.D}` : ""}</p>
        <div class="cta"><button class="btn" id="lnMap">Toon op de kaart</button><button class="btn" id="lnTl">Toon in de tijdlijn</button><button class="btn" id="lnTree">Open in de boom</button><button class="btn" data-go="stamboom-${l}">Toon in de waaier</button></div>
      </div>
      <div><h5 class="eyebrow" style="margin:0 0 8px">Stamlijn, van jong naar oud</h5><div class="stem" style="--c:var(--l${l})">${stem.map(p => `<button data-open="${p.kw}"><span class="g">gen. ${ROMAN[gen(p.kw)]}</span><span><b>${esc(p.n)}</b><small>${esc(lifeYears(p))} · ${p.st}</small></span></button>`).join("")}</div></div>
    </div>
    ${(() => { const fp = ps.filter(p => portraitOf(p.kw)); return fp.length ? `<div class="section-head"><h2>Gezichten uit deze familie</h2><p>${fp.length === 1 ? "Eén voorouder" : fp.length + " voorouders"} uit deze lijn van wie een foto bewaard is gebleven.</p></div><div class="faces">${fp.map(faceCard).join("")}</div>` : ""; })()}
    <div class="section-head"><h2>Alle voorouders in deze lijn</h2><p>Per generatie, van jong naar oud.</p></div>
    ${[...new Set(ps.map(p => gen(p.kw)))].map(g => { const gp = ps.filter(p => gen(p.kw) === g), lc = { A: 0, B: 0, C: 0, D: 0 }; gp.forEach(p => lc[p.st]++); return `<details class="gen-det pane"${g <= 6 ? " open" : ""}><summary><span class="eyebrow">Generatie ${ROMAN[g]} · ${esc(GEN_NAME[g])}</span><span class="small">${gp.length} ${gp.length === 1 ? "persoon" : "personen"} · ${["A", "B", "C", "D"].filter(s => lc[s]).map(s => `${stTag(s)} ${lc[s]}`).join(" ")}</span></summary>
    <div class="scroll-x"><table class="mini"><thead><tr><th>kw</th><th>Naam</th><th>Leven</th><th>Plaatsen</th><th>Beroep</th><th>Status</th></tr></thead><tbody>
      ${gp.map(p => `<tr><td class="y">${p.kw}</td><td><button class="link" data-open="${p.kw}">${esc(p.n)}</button><br><span class="small">${esc(relTerm(p.kw))}</span></td><td class="y">${esc(lifeYears(p))}</td><td class="small">${esc([placeName(p.bp), placeName(p.dp)].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(" → "))}</td><td class="small">${esc((p.occ || "").split(";")[0])}</td><td>${stTag(p.st)}</td></tr>`).join("")}
    </tbody></table></div></details>`; }).join("")}
    <div class="section-head"><h2>Plaatsen</h2><p>Dorpen waar deze lijn woonde, trouwde of overleed. De grijze stippen zijn dorpen van de andere families.</p></div>
    <div class="pane" style="margin-bottom:14px"><div class="map-wrap"><div class="map" id="lnMapSvg"></div><aside class="map-side"><h5 class="eyebrow" style="margin:0">Alle dorpen, met het aantal vermeldingen in de akten</h5>
    <div class="chips">${Object.entries(places).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<button class="chip" style="--c:var(--l${l})" data-go="${slug(k)}"><i></i>${esc(placeName(k))} <span class="mono">${n}</span></button>`).join("")}</div></aside></div></div>
    ${(() => { const tp = topPlaces(ps, 6); return tp.length >= 3 ? `<div class="ptiles">${tp.map(x => placeTile(x[0], x[1] + " keer in de akten")).join("")}</div>${credits(tp.map(x => placeImg(x[0])))}` : ""; })()}
    <div id="lnArch" hidden></div>
    ${sts.length ? `<div class="section-head"><h2>Verhalen</h2></div><div class="grid-3">${sts.map(storyCard).join("")}</div>` : ""}
    <div class="section-head"><h2>Andere families</h2></div>
    <div class="chips">${LINE_KEYS.filter(x => x !== l).map(x => `<button class="chip" style="--c:var(--l${x})" data-go="lijn-${x}"><i></i>${esc(LINES[x].name)}</button>`).join("")}</div>`;
  $("#lnMapSvg").appendChild(dotMap(EVENTS.filter(e => lineOf(e.kw) === l), "Kaart met de dorpen van de familie " + L.name, 10));
  const lga = groupArch(ps), tk = T.key;
  archStrip($("#lnArch"), lga, () => route.view === "families" && route.sub === l && T.key === tk, { n: 12,
    cap: (im, a) => `${archCap(im, a)} · ${whoNames(a.who)}`,
    head: `<div class="section-head"><h2>De familie in beeld</h2><p>Oude foto's en prenten uit de dorpen van deze lijn, uit de jaren dat de voorouders er woonden. Onder elke foto staat wie er toen woonde.</p></div>` });
  $("#lnMap").onclick = () => { mapState.lines = new Set([l]); mapFocusPerson = null; mapState.place = null; go("kaart"); syncMapChips(); renderMap(); };
  $("#lnTl").onclick = () => { tlState.lines = new Set([l]); go("tijdlijn"); syncTlChips(); drawTimeline(); };
  $("#lnTree").onclick = () => go("boom-" + l);
  schakelLijn(l, host);
}

/* ---------- personen ---------- */
const cardState = { q: "", gen: "all", lines: new Set(), st: new Set(), sort: "kw", chg: null, open: new Set() }; /* open: welke ingeklapte generaties de lezer heeft geopend */
let NEWSET = new Set(CHANGES.newKws), UPDSET = new Set(CHANGES.updKws);
const chgOf = kw => { const k = ALIAS_OF[kw] || kw; return NEWSET.has(k) ? "new" : UPDSET.has(k) ? "upd" : null; };
const chgTag = kw => { const c = chgOf(kw); return c === "new" ? `<span class="tag chg-new" title="Nieuw in ${esc(CHANGES.v)}">nieuw</span>` : c === "upd" ? `<span class="tag chg-upd" title="Bijgewerkt in ${esc(CHANGES.v)}">bijgewerkt</span>` : ""; };
function syncChgChips() { $("#chgChips").innerHTML = [["new", `Nieuw in ${CHANGES.v} (${NEWSET.size})`, NEWSET.size], ["upd", `Bijgewerkt (${UPDSET.size})`, UPDSET.size]].filter(c => c[2]).map(c => `<button class="chip chg-${c[0]}" aria-pressed="${cardState.chg === c[0]}" data-c="${c[0]}">${esc(c[1])}</button>`).join(""); $$("#chgChips [data-c]").forEach(b => b.onclick = () => { cardState.chg = cardState.chg === b.dataset.c ? null : b.dataset.c; syncChgChips(); renderCards(); }); }
function showChanged(kind) { cardState.chg = kind; cardState.gen = "all"; cardState.q = ""; cardState.st.clear(); cardState.lines.clear(); go("personen"); const q = $("#q"); if (q) q.value = ""; const g = $("#genSel"); if (g) g.value = "all"; syncLineChips(); syncChgChips(); renderCards(); }
const lineChipsHtml = sel => LINE_KEYS.map(l => `<button class="chip" style="--c:var(--l${l})" aria-pressed="${sel.has(l)}" data-l="${l}"><i></i>${esc(LINES[l].name)}</button>`).join("");
function syncLineChips() { $("#lineChips").innerHTML = lineChipsHtml(cardState.lines); $$("#lineChips [data-l]").forEach(b => b.onclick = () => { const l = +b.dataset.l; cardState.lines.has(l) ? cardState.lines.delete(l) : cardState.lines.add(l); syncLineChips(); renderCards(); }); }
function genFoldToggle(e) { const d = e.target; if (!d.matches || !d.matches(".gen-fold")) return; d.open ? cardState.open.add(+d.dataset.g) : cardState.open.delete(+d.dataset.g); }
function renderPersonen() {
  $("#genSel").innerHTML = `<option value="all">Alle generaties</option>` + Array.from({ length: Math.max(...ancestors.map(p => gen(p.kw))) }, (_, i) => `<option value="${i + 1}">Generatie ${ROMAN[i + 1]} · ${GEN_NAME[i + 1]}</option>`).join("");
  $("#stChips").innerHTML = ["A", "B", "C", "D"].map(s => `<button class="chip st-${s}" aria-pressed="false" data-s="${s}">status ${s}</button>`).join("");
  $$("#stChips [data-s]").forEach(b => b.onclick = () => { const s = b.dataset.s; cardState.st.has(s) ? cardState.st.delete(s) : cardState.st.add(s); b.setAttribute("aria-pressed", cardState.st.has(s)); renderCards(); });
  $("#q").oninput = e => { cardState.q = norm(e.target.value); renderCards(); };
  $("#genSel").onchange = e => { cardState.gen = e.target.value; renderCards(); };
  $("#cardsOut").addEventListener("toggle", genFoldToggle, true); /* vaste functie: de browser registreert hem maar één keer */
  $("#sortSel").onchange = e => { cardState.sort = e.target.value; renderCards(); };
  syncLineChips(); syncChgChips(); filterFold(); renderCards();
}
/* status-, wijzigings- en familiefilters samen in één uitklapblok; op een breed scherm open, op de telefoon dicht */
function filterFold() {
  let d = $("#pFilters");
  if (!d) {
    d = document.createElement("details"); d.id = "pFilters"; d.className = "pfilters";
    d.innerHTML = `<summary>Filters <span class="pf-n mono small"></span></summary>`;
    $("#v-personen .toolbar").after(d); ["#stChips", "#chgChips", "#lineChips"].forEach(sel => { const n = $(sel); if (n) d.appendChild(n); });
  }
  d.open = innerWidth > 600;
}
const filterCount = () => { const n = cardState.st.size + cardState.lines.size + (cardState.chg ? 1 : 0), el = $("#pFilters .pf-n"); if (el) el.textContent = n ? `· ${n} aan` : ""; };
function cardHtml(p) {
  const ln = lineOf(p.kw), pl = [placeName(p.bp), placeName(p.dp)].filter(Boolean);
  const plTxt = pl.length === 2 && pl[0] !== pl[1] ? `${pl[0]} → ${pl[1]}` : (pl[0] || "");
  if (p.living) { const nm = p.n.replace(/ & /g, " en "); /* in lopende tekst "en", zoals elders op de site; een roepnaam gelijk aan de naam niet herhalen */
    return `<button class="card living" data-open="${p.kw}"><div class="row1"><span class="ln">levend</span><span class="kw">kw ${p.kw}</span></div><h4>${esc(nm)}</h4>${p.roep && p.roep !== p.n ? `<div class="pl">${esc(p.roep)}</div>` : ""}</button>`; }
  const unc = p.unc ? Object.values(p.unc).some(v => v !== "A") : false;
  return `<button class="card" style="--c:${ln ? `var(--l${ln})` : "var(--accent)"}" data-open="${p.kw}">
    <div class="row1"><span class="ln"${ln ? ` title="${esc(LINES[ln].name)}"` : ""}><i></i><span class="lnt">${ln ? esc(LINES[ln].name) : ""}</span></span><span class="kw">kw ${p.kw}</span></div>
    <h4${portraitOf(p.kw) ? ` class="withava"` : ""}>${avatar(p.kw)}<span>${esc(p.n)}${p.roep ? ` <span style="font-family:var(--body);font-size:14px;color:var(--muted)">(${esc(p.roep)})</span>` : ""}</span></h4>
    <div class="rel">${esc(relTerm(p.kw))}</div>
    <div class="yrs">${esc(lifeYears(p))}</div>
    ${plTxt ? `<div class="pl">${esc(plTxt)}</div>` : ""}
    ${p.occ ? `<div class="occ">${esc(p.occ.split(";")[0])}</div>` : ""}
    <div class="foot">${stTag(p.st, true)}${unc ? `<span class="unc" title="Sommige gegevens zijn onzekerder dan het profiel als geheel">deels onzeker</span>` : ""}${chgOf(p.kw) === "new" ? chgTag(p.kw) : ""}</div></button>`; /* onderaan alleen het bewijs, en "nieuw"; "bijgewerkt" staat op bijna elke kaart en zegt daar niets */
}
function renderCards() {
  const s = cardState; filterCount();
  let list = all.filter(p => {
    if (s.gen !== "all" && gen(p.kw) !== +s.gen) return false;
    if (s.lines.size && !s.lines.has(lineOf(p.kw))) return false;
    if (s.st.size && (p.living || !s.st.has(p.st))) return false;
    if (s.chg && chgOf(p.kw) !== s.chg) return false;
    if (s.q) { const hay = norm([p.n, p.alt, p.roep, p.occ, placeName(p.bp), placeName(p.dp), ...(p.res || []).map(r => placeName(r.p)), ...(p.notes || []).map(n => noteObj(n).t), ...(p.sibs || []), ...(p.kids || [])].join(" ")); if (!s.q.split(/\s+/).every(t => hay.includes(t))) return false; }
    return true;
  });
  const sorter = { kw: (a, b) => a.kw - b.kw, b: (a, b) => (yr(a.b) || yr(a.d) || 9999) - (yr(b.b) || yr(b.d) || 9999), n: (a, b) => a.n.localeCompare(b.n, "nl") }[s.sort];
  list.sort(sorter);
  if (!list.length) { $("#cardsOut").innerHTML = `<div class="empty">Geen profielen gevonden voor deze filters.</div>`; return; }
  if (s.sort !== "kw") { $("#cardsOut").innerHTML = `<div class="cards" style="margin-top:20px">${list.map(cardHtml).join("")}</div>`; return; }
  const byGen = {}; list.forEach(p => (byGen[gen(p.kw)] = byGen[gen(p.kw)] || []).push(p));
  /* Zonder filter klappen generatie VI en ouder in (anders is de pagina op een telefoon tienduizenden pixels lang);
     met een filter, zoekterm of gekozen generatie staat alles open. <details> klapt vanzelf open bij Ctrl+F. */
  const fold = s.gen === "all" && !s.q && !s.lines.size && !s.st.size && !s.chg;
  const head = g => `Generatie ${ROMAN[g]} <small>${GEN_NAME[g]} · ${byGen[g].length} ${byGen[g].length === 1 ? "persoon" : "personen"}</small>`;
  $("#cardsOut").innerHTML = Object.keys(byGen).map(g => fold && +g >= 6
    ? `<details class="gen-block gen-fold" data-g="${g}"${cardState.open.has(+g) ? " open" : ""}><summary><h3>${head(g)}</h3><span class="gf-hint">toon</span></summary><div class="cards">${byGen[g].map(cardHtml).join("")}</div></details>`
    : `<div class="gen-block"><h3>${head(g)}</h3><div class="cards">${byGen[g].map(cardHtml).join("")}</div></div>`).join("");
}

/* ---------- verhalen ---------- */
const vState = { tree: null, tag: null, side: null };
function drawStories() {
  if (vState.tree !== T.key) Object.assign(vState, { tree: T.key, tag: null, side: null });
  const inSide = st => !vState.side || st.side === vState.side, list = STORIES.filter(st => inSide(st) && (!vState.tag || storyTags(st).includes(vState.tag)));
  const tags = Object.keys(STAGS).filter(t => STORIES.some(st => storyTags(st).includes(t)));
  const chip = (attr, val, label, n, on) => `<button class="chip" ${attr}="${val}" aria-pressed="${on}">${label} <span class="mono">${n}</span></button>`;
  const sides = T.key === "s" ? `<div class="chips" role="group" aria-label="Stamboom">${chip("data-vs", "", "Alle verhalen", STORIES.length, !vState.side)}${["h", "a"].map(k => chip("data-vs", k, sideTag(k), STORIES.filter(st => st.side === k).length, vState.side === k)).join("")}</div>` : "";
  $("#vFilter").innerHTML = `${sides}<div class="chips" role="group" aria-label="Onderwerp">${chip("data-vt", "", T.key === "s" ? "Alle onderwerpen" : "Alle verhalen", STORIES.filter(inSide).length, !vState.tag)}${tags.map(t => chip("data-vt", t, esc(STAGS[t]), STORIES.filter(st => inSide(st) && storyTags(st).includes(t)).length, vState.tag === t)).join("")}</div>`;
  $("#vGrid").innerHTML = list.map(storyCard).join("") || `<p class="muted">Geen verhalen bij deze keuze.</p>`;
  $$("#vFilter [data-vs]").forEach(b => b.onclick = () => { vState.side = b.dataset.vs || null; drawStories(); });
  $$("#vFilter [data-vt]").forEach(b => b.onclick = () => { vState.tag = vState.tag === b.dataset.vt ? null : (b.dataset.vt || null); drawStories(); });
}
function renderVerhalen(id) {
  const host = $("#v-verhalen");
  const s = STORIES.find(x => x.id === id);
  if (!s) {
    host.innerHTML = `<div class="eyebrow">Verhalen</div><h1 class="page-title">Verhalen</h1>
      <p class="lede">${T.TXT.verhalenLede ? esc(T.TXT.verhalenLede) : "Wat de akten samen vertellen: over namen, geloof, verhuizingen, jonge weduwen en ooms en tantes die uitzwermden. Bij elk deel staat hoe zeker het is."}</p>
      ${T.key === "h" ? `<button class="vbanner" data-go="verwanten"><span class="eyebrow">Ook lezen</span><b>Bekende verwanten: adel, macht, geld of geschiedenis?</b><span>Titus Brandsma, pastoor Spitzen en de naamgenoten Lycklama à Nijeholt en Ter Wischa, met wat wel en niet bewezen is.</span></button>` : ""}
      <div class="vfilter" id="vFilter"></div>
      <div class="grid-3" id="vGrid"></div>${MEDIA.some(m => m.kind === "achtergrond") ? ovMore(`data-go="tijd"`, "Achtergrond: de tijd waarin ze leefden") : ""}`;
    drawStories();
    return;
  }
  const i = STORIES.indexOf(s), next = STORIES[(i + 1) % STORIES.length], prev = STORIES[(i - 1 + STORIES.length) % STORIES.length];
  host.innerHTML = `<article class="story">
    <div class="eyebrow"><button class="link" data-go="verhalen">Verhalen</button> › ${i + 1} van ${STORIES.length}${storyTags(s).length ? " · " + storyTags(s).map(t => esc(STAGS[t])).join(" · ") : ""}</div>
    ${s.side ? `<div class="vmeta" style="margin-top:6px">${sideTag(s.side)}</div>` : ""}
    <h1>${esc(s.title)}</h1>
    <p class="lede" style="font-size:19px">${esc(s.lede)}</p>
    ${(() => { const cov = storyCov(s).im; if (cov) return `<div class="vfigs vcover" data-imggroup>${fig(cov)}</div>`; const tp = topPlaces(s.people.map(person).filter(p => p && !p.living), 3); return tp.length === 3 ? `<div class="mosaic" data-imggroup>${tp.map((x, j) => fig(placeImg(x[0]), { thumb: j > 0, cap: placeName(x[0]), credit: false })).join("")}</div>${credits(tp.map(x => placeImg(x[0])))}` : `<div class="art">${ART[s.art] || ART.farm}</div>`; })()}
    ${(() => { const cov = storyCov(s).im, si = storyImgs(s.id).filter(im => im !== cov), deel = im => im.vh.find(v => v[0] === s.id)[1], heads = s.parts.map(x => x.h), rest = si.filter(im => !heads.includes(deel(im)));
      return s.parts.map(part => `<h2>${esc(part.h)} ${stTag(part.st, true)}</h2>${part.p.map(q => { const o = noteObj(q); return o.k ? `<p class="kind k-${o.k}"><span class="t">${geldw(esc(o.t))}</span> ${kindTag(o.k)}</p>` : `<p>${geldw(esc(o.t))}</p>`; }).join("")}${storyFigs(si.filter(im => deel(im) === part.h))}`).join("")
        + (rest.length ? `<h2>Beelden bij dit verhaal</h2>${storyFigs(rest)}` : ""); })()}
    <h2>Mensen in dit verhaal</h2>
    <div class="peoplechips">${s.people.map(k => person(k)).filter(Boolean).map(p => `<button class="chip" style="--c:${lineColor(p.kw)}" data-open="${p.kw}"><i></i>${esc(p.n)} <span class="mono">${esc(lifeYears(p))}</span></button>`).join("")}</div>
    <div class="cta" style="margin-top:34px"><button class="btn primary" data-go="verhaal-${next.id}">Volgende: ${esc(next.title)}</button><button class="btn" data-go="verhaal-${prev.id}">Vorige: ${esc(prev.title)}</button></div>
    ${ovMore(`data-go="verhalen"`, "Alle verhalen")}
  </article>`;
}

/* ---------- tijdlijn ---------- */
const tlState = { by: "line", lines: new Set() };
function syncTlChips() { $("#tlChips").innerHTML = lineChipsHtml(tlState.lines); $$("#tlChips [data-l]").forEach(b => b.onclick = () => { const l = +b.dataset.l; tlState.lines.has(l) ? tlState.lines.delete(l) : tlState.lines.add(l); syncTlChips(); drawTimeline(); }); }
function renderTijdlijn() {
  $("#tlByLine").onclick = () => { tlState.by = "line"; $("#tlByLine").setAttribute("aria-pressed", true); $("#tlByYear").setAttribute("aria-pressed", false); drawTimeline(); };
  $("#tlByYear").onclick = () => { tlState.by = "year"; $("#tlByYear").setAttribute("aria-pressed", true); $("#tlByLine").setAttribute("aria-pressed", false); drawTimeline(); };
  syncTlChips();
  $("#contextCards").innerHTML = CONTEXT.map(c => `<article class="fact"><span class="yr"><span>${c.y}${c.y2 ? "–" + c.y2 : ""}</span></span><h3>${esc(c.t)}</h3><p>${esc(c.d)}</p></article>`).join("");
  drawTimeline();
}
/* onder de tijdlijn: per periode de oude beelden waar de meeste (getoonde) voorouders toen woonden, van oud naar nieuw */
function tlArchive(ps) {
  const host = $("#tlArch"); if (!host) return;
  host.hidden = true; host.innerHTML = "";
  const P = [[1600, 1799], [1800, 1849], [1850, 1899], [1900, 1924], [1925, 1960]], ga = groupArch(ps).filter(a => a.ys[1] - a.ys[0] <= 10), pick = [];
  P.forEach(([a, z]) => { const pl = new Set(); ga.filter(x => { const m = (x.ys[0] + x.ys[1]) / 2; return m >= a && m <= z + 0.9; }).forEach(x => { if (pl.size < 4 && !pl.has(x.key)) { pl.add(x.key); pick.push(x); } }); });
  pick.sort((x, y) => x.ys[0] - y.ys[0]);
  const sig = [...tlState.lines].join(), tk = T.key;
  if (pick.length >= 4) archStrip(host, pick, () => route.view === "tijdlijn" && T.key === tk && [...tlState.lines].join() === sig, { n: 20, credit: false, cls: "band4", lazy: true,
    cap: (im, a) => `${yearLabel(a.ys)} · ${placeName(a.key)} · ${a.who.length === 1 ? firstName(a.who[0]) : a.who.length + " voorouders"}`,
    head: `<div class="section-head"><h2>Door de tijd in beeld</h2><p>Oude prenten en foto's uit de dorpen en steden, uit de jaren dat de voorouders${tlState.lines.size ? " van deze families" : ""} er woonden.</p></div>` });
}
function drawTimeline() {
  const W = 1180, left = 214, right = W - 24, y1 = 2030;
  const ps = ancestors.filter(p => (yr(p.b) || yr(p.d)) && (!tlState.lines.size || tlState.lines.has(lineOf(p.kw))));
  tlArchive(ps);
  const start = p => yr(p.b) || (yr(p.d) - 55);
  const rows = [];
  tlRows(ps, start, rows); /* per familie inklapbaar of op geboortejaar: zie "tijdlijn per familie" */
  const { X, ticks, deco } = tlScale(rows.filter(r => r.p).map(r => r.p), left, right, y1); /* beginjaar uit de getoonde rijen; vóór 1700 ingekort */
  /* gebeurtenissen bovenaan: elk label op de eerste rij waar het niet overlapt */
  const ctx = CONTEXT.filter(c => c.tl !== false).slice().sort((a, b) => a.y - b.y), ends = [];
  ctx.forEach(c => { const x0 = X(c.y), w = (String(c.y).length + 1 + c.t.length) * 6.3 + 10; let r = ends.findIndex(e => e < x0); if (r < 0) { r = ends.length; ends.push(0); } ends[r] = x0 + w; c._r = r; });
  const top = 22 + ends.length * 17, rh = tlNarrow() ? 28 : 21, hh = 30; /* telefoon: hogere rijen voor grotere namen */
  let y = top; rows.forEach(r => { r.y = y; y += r.h || (r.head ? hh : rh); });
  const H = y + 30;
  /* twee svg's met dezelfde schaal: namen blijven staan, de balken scrollen (telefoon) */
  const names = el("svg", { viewBox: `0 0 ${left} ${H}`, role: "group", "aria-label": "Namen in de tijdlijn" }); /* de namen zijn knoppen naar het profiel */
  const svg = el("svg", { viewBox: `${left} 0 ${W - left} ${H}`, role: "group", "aria-label": "Tijdlijn van levens" });
  const bands = el("g", {}, svg);
  CONTEXT.filter(c => c.y2 && c.tl !== false).forEach(c => el("rect", { x: X(c.y), y: top - 6, width: X(c.y2) - X(c.y), height: H - top - 22, fill: "var(--gold)", "fill-opacity": 0.08 }, bands));
  deco(bands, top, H); for (const t of ticks) {
    el("line", { x1: X(t), x2: X(t), y1: top - 8, y2: H - 22, stroke: "var(--rule)", "stroke-width": t % 100 === 0 ? 1.2 : 0.6 }, bands);
    if (t % 50 === 0) txt(bands, X(t), H - 8, t, { "text-anchor": "middle", "font-size": 11, fill: "var(--muted)", "font-family": "var(--mono)" });
  }
  ctx.forEach(c => {
    const ly = 14 + c._r * 17;
    el("line", { x1: X(c.y), x2: X(c.y), y1: ly + 4, y2: H - 22, stroke: "var(--gold)", "stroke-dasharray": "2 3", "stroke-width": 1 }, bands);
    const t = txt(bands, X(c.y) + 4, ly, `${c.y} ${c.t}`, { "font-size": 11.5, fill: "var(--gold)" });
    bindTip(t, `<b>${c.y} · ${esc(c.t)}</b><br>${esc(c.d)}`);
  });
  const g = el("g", {}, svg), gn = el("g", {}, names);
  rows.forEach(r => {
    if (r.head || r.side) { tlHead(r, gn, g, left, right, X); return; }
    const p = r.p, c = lineColor(p.kw), cy = r.y + rh / 2;
    const nm = el("g", { class: "node" }, gn);
    el("rect", { x: 0, y: r.y, width: left, height: rh, fill: "transparent" }, nm);
    txt(nm, left - 10, cy + (tlNarrow() ? 6 : 4), trunc(p.n, tlNarrow() ? 19 : 30), { "text-anchor": "end", "font-size": tlNarrow() ? 18 : 12 }); /* op de telefoon schaalt de namenkolom tot 0,64: 18 wordt ±11,5 px */
    clickable(nm, () => openProfile(p.kw), `${p.n}, ${lifeYears(p)}`); /* met het toetsenbord: Tab, Enter of spatie */
    const row = el("g", { class: "node" }, g);
    el("rect", { x: left, y: r.y, width: W - left, height: rh, fill: "transparent" }, row);
    const b = yr(p.b), d = yr(p.d), weak = p.st === "C" || p.st === "D" || fieldSt(p, "b") === "C" || fieldSt(p, "d") === "C";
    if (b && d) el("rect", { x: X(b), y: cy - 4, width: Math.max(3, X(d) - X(b)), height: 8, rx: 4, fill: c, "fill-opacity": weak ? 0.4 : p.st === "B" ? 0.65 : 0.9 }, row);
    else if (b) { const e = Math.min(b + 60, 2026); el("rect", { x: X(b), y: cy - 4, width: 4, height: 8, rx: 2, fill: c }, row); el("line", { x1: X(b) + 4, x2: X(e), y1: cy, y2: cy, stroke: c, "stroke-width": 3, "stroke-dasharray": "2 4", "stroke-linecap": "round" }, row); }
    else { el("line", { x1: X(d - 55), x2: X(d) - 4, y1: cy, y2: cy, stroke: c, "stroke-width": 3, "stroke-dasharray": "2 4", "stroke-linecap": "round" }, row); el("rect", { x: X(d) - 4, y: cy - 4, width: 4, height: 8, rx: 2, fill: c }, row); }
    const my = p.m && yr(p.m.d);
    if (my) el("path", { d: `M${X(my)} ${cy - 6}l5 6l-5 6l-5 -6z`, fill: "var(--surface)", stroke: "var(--ink)", "stroke-width": 1.2 }, row);
    row.addEventListener("click", () => openProfile(p.kw));
    bindTip(row, tipFor(p) + (my ? `<br><span style="opacity:.8">getrouwd ${my}</span>` : ""));
  });
  const host = $("#timeline"); host.innerHTML = "";
  const nc = document.createElement("div"); nc.className = "tl-names"; nc.appendChild(names);
  const bc = document.createElement("div"); bc.className = "tl-bars scroll-x"; bc.appendChild(svg);
  host.append(nc, bc);
}

/* ---------- kaart ---------- */
/* mode: "ooit" = iedereen met een gebeurtenis tot en met het jaar (stippen blijven staan); "levend" = alleen wie in dat jaar leeft,
   op de laatst bekende woonplaats. De keuze staat niet in de hash (vorige/volgende gaan niet door elk jaar), wel in localStorage. */
const mapState = { year: 2026, lines: new Set(), moves: true, place: null, mode: (() => { try { return localStorage.getItem("stamboom-kaart-modus") === "levend" ? "levend" : "ooit"; } catch (e) { return "ooit"; } })() };
const MAP_EST = 70; /* zonder sterfjaar: leeft tot 70 jaar na het begin, of tot de laatste bekende gebeurtenis als die later is */
/* levensspanne voor de kaart: begin = geboorte of eerste gebeurtenis, eind = sterfjaar of schatting; levenden nooit */
function mapSpan(kw, evs) {
  const p = person(kw); if (!p || p.living) return null;
  const ys = evs.map(e => e.y).filter(Boolean); if (!ys.length) return null;
  const b = yr(p.b) || Math.min(...ys), d = yr(p.d);
  return { b, d: d || Math.max(Math.max(...ys), b + MAP_EST), est: !d };
}
let mapFocusPerson = null, playTimer = null;
const B = { lo0: 5.30, lo1: 6.62, la0: 52.36, la1: 53.33 }, KX = Math.cos(52.85 * Math.PI / 180), MW = 800, MS = MW / ((B.lo1 - B.lo0) * KX), MH = Math.round((B.la1 - B.la0) * MS);
const proj = (la, lo) => [(lo - B.lo0) * KX * MS, (B.la1 - la) * MS];
const pathOf = (pts, close) => pts.map((p, i) => (i ? "L" : "M") + proj(p[0], p[1]).map(v => v.toFixed(1)).join(" ")).join("") + (close ? "Z" : "");
const WATER = [[53.40, 5.20], [53.40, 5.80], [53.31, 5.63], [53.25, 5.50], [53.175, 5.41], [53.10, 5.40], [53.05, 5.39], [52.98, 5.425], [52.94, 5.395], [52.885, 5.36], [52.85, 5.43], [52.845, 5.55], [52.84, 5.69], [52.78, 5.63], [52.70, 5.59], [52.64, 5.60], [52.585, 5.67], [52.555, 5.55], [52.53, 5.30], [52.53, 5.20]];
const BORDERS = [
  [[52.84, 5.70], [52.80, 5.80], [52.795, 5.85], [52.80, 5.95], [52.81, 6.03], [52.835, 6.12], [52.86, 6.18], [52.905, 6.235], [52.95, 6.27], [53.00, 6.34], [53.05, 6.37], [53.12, 6.32], [53.19, 6.28], [53.26, 6.24], [53.40, 6.20]],
  [[52.86, 6.18], [52.80, 6.24], [52.74, 6.30], [52.70, 6.40], [52.66, 6.50], [52.62, 6.70]],
  [[53.05, 6.37], [53.10, 6.50], [53.13, 6.70]],
  [[52.795, 5.85], [52.73, 5.95], [52.68, 5.94], [52.62, 5.86], [52.585, 5.78]]
];
const REGION_LABELS = [[53.10, 5.88, "FRIESLAND"], [52.80, 6.46, "DRENTHE"], [52.50, 6.15, "OVERIJSSEL"], [53.24, 6.48, "GRONINGEN"], [52.70, 5.76, "NOORDOOSTPOLDER"], [52.665, 5.76, "drooggelegd 1942"], [52.78, 5.46, "IJSSELMEER"], [53.32, 5.42, "WADDENZEE"]];
let EVENTS = buildEvents();
/* plaatsinfo: P.info hoort bij de boom van Harrie, P.infoA bij die van Alies */
const pInfo = P => T.key === "h" ? P.info : T.key === "a" ? P.infoA : (P.info || P.infoA);
const otherTrees = () => T.key === "s" ? [] : Object.values(TREES).filter(t => t !== T && t.key !== "s");
const EV_CACHE = {};
function eventsOf(t) {
  if (t === T) return EVENTS;
  if (EV_CACHE[t.key]) return EV_CACHE[t.key];
  const ev = []; t.PEOPLE.filter(p => !p.alias && !p.living).forEach(p => lifeEvents(p).forEach(e => { const k = mapKey(e.p); if (e.y && PLACES[k]) ev.push({ kw: p.kw, y: e.y, p: k }); }));
  return (EV_CACHE[t.key] = ev);
}
function buildEvents() { const ev = []; ancestors.forEach(p => lifeEvents(p).forEach(e => { const k = mapKey(e.p); if (e.y && PLACES[k]) ev.push({ kw: p.kw, y: e.y, p: k, t: e.t + (k !== e.p ? ` (gemeente ${e.p})` : "") }); })); return ev; }
function drawBase(svg, small, bare) {
  el("rect", { x: 0, y: 0, width: MW, height: MH, fill: "var(--land)" }, svg);
  el("path", { d: pathOf(WATER, true), fill: "var(--water)" }, svg);
  const bg = el("g", { fill: "none", stroke: "var(--faint)", "stroke-width": small ? 1.5 : 1, "stroke-dasharray": "5 4", "stroke-opacity": 0.6 }, svg);
  BORDERS.forEach(b => el("path", { d: pathOf(b) }, bg));
  if (bare) return;
  REGION_LABELS.forEach(([la, lo, s]) => { const [x, y] = proj(la, lo), low = /^[a-z]/.test(s); if (small && low) return; txt(svg, x, y, s, { "text-anchor": "middle", "font-size": small ? 18 : low ? 11 : 13, "letter-spacing": low ? 0 : 3, fill: "var(--faint)", "font-family": "var(--mono)" }); });
}
function syncMapChips() { $("#mapChips").innerHTML = lineChipsHtml(mapState.lines); $$("#mapChips [data-l]").forEach(b => b.onclick = () => { const l = +b.dataset.l; mapState.lines.has(l) ? mapState.lines.delete(l) : mapState.lines.add(l); syncMapChips(); renderMap(); }); }
function renderKaart() {
  syncMapChips();
  $("#yr").oninput = e => { mapState.year = +e.target.value; $("#yrOut").textContent = mapState.year; stopPlay(); renderMap(); };
  $("#moves").onchange = e => { mapState.moves = e.target.checked; renderMap(); };
  const syncMode = () => { $("#mAll").setAttribute("aria-pressed", mapState.mode === "ooit"); $("#mAlive").setAttribute("aria-pressed", mapState.mode === "levend"); };
  const setMode = m => { mapState.mode = m; try { localStorage.setItem("stamboom-kaart-modus", m); } catch (e) { } syncMode(); renderMap(); };
  $("#mAll").onclick = () => setMode("ooit"); $("#mAlive").onclick = () => setMode("levend"); syncMode();
  $("#play").onclick = () => {
    if (playTimer) { stopPlay(); return; }
    if (mapState.year >= 2026) mapState.year = 1730;
    $("#play").textContent = "Pauze";
    playTimer = setInterval(() => { mapState.year = Math.min(2026, mapState.year + 3); $("#yr").value = mapState.year; $("#yrOut").textContent = mapState.year; renderMap(); if (mapState.year >= 2026) stopPlay(); }, 90);
  };
  renderMap();
}
function stopPlay() { if (playTimer) clearInterval(playTimer); playTimer = null; const b = $("#play"); if (b) b.textContent = "Afspelen"; }
function aggregate(ev) {
  const agg = {};
  ev.forEach(e => { const a = agg[e.p] = agg[e.p] || { key: e.p, people: new Set(), ev: [], lines: {} }; a.people.add(e.kw); a.ev.push(e); const l = lineOf(e.kw); a.lines[l] = (a.lines[l] || 0) + 1; });
  return Object.values(agg).sort((a, b) => b.people.size - a.people.size);
}
function renderMap() {
  if (!rendered.kaart) return;
  let ev = EVENTS.filter(e => e.y <= mapState.year && (!mapState.lines.size || mapState.lines.has(lineOf(e.kw))) && (!mapFocusPerson || e.kw === mapFocusPerson));
  let path = ev; mapState.est = new Set();
  if (mapState.mode === "levend") {
    /* per persoon die in dit jaar leeft: alle gebeurtenissen tot nu (voor de verhuislijnen) en de laatste (de woonplaats) */
    const byP = {}; ev.forEach(e => (byP[e.kw] = byP[e.kw] || []).push(e));
    path = []; ev = [];
    Object.keys(byP).forEach(k => {
      const s = mapSpan(+k, EVENTS.filter(e => e.kw === +k));
      if (!s || mapState.year < s.b || mapState.year > s.d) return;
      const es = byP[k].slice().sort((a, b) => a.y - b.y);
      path.push(...es); ev.push(es[es.length - 1]); if (s.est) mapState.est.add(+k);
    });
  }
  const svg = el("svg", { viewBox: `0 0 ${MW} ${MH}`, role: "img", "aria-label": "Kaart van Noord-Nederland met woonplaatsen van de voorouders" });
  drawBase(svg);
  if (mapState.moves) {
    const mv = el("g", { fill: "none", "stroke-width": 1.6, "stroke-linecap": "round" }, svg);
    const byP = {}; path.forEach(e => (byP[e.kw] = byP[e.kw] || []).push(e));
    Object.keys(byP).forEach(k => {
      let prev = null;
      byP[k].sort((a, b) => a.y - b.y).forEach(e => {
        if (prev && prev !== e.p) {
          const a0 = PLACES[prev], a1 = PLACES[e.p], [x1, y1] = proj(a0.la, a0.lo), [x2, y2] = proj(a1.la, a1.lo);
          el("path", { d: `M${x1} ${y1}Q${(x1 + x2) / 2 - (y2 - y1) * 0.18} ${(y1 + y2) / 2 + (x2 - x1) * 0.18} ${x2} ${y2}`, stroke: lineColor(+k), "stroke-opacity": mapFocusPerson ? 0.9 : 0.35 }, mv);
        }
        prev = e.p;
      });
    });
  }
  const list = aggregate(ev);
  const dots = el("g", {}, svg), labels = el("g", { "pointer-events": "none" }, svg);
  list.forEach(a => {
    const P = PLACES[a.key], [x, y] = proj(P.la, P.lo), n = a.people.size, r = 4 + 2.4 * Math.sqrt(n);
    const dom = +Object.entries(a.lines).sort((p, q) => q[1] - p[1])[0][0];
    const sel = mapState.place === a.key;
    const gg = el("g", { class: "place-dot" }, dots);
    el("circle", { class: "d", cx: x, cy: y, r, fill: dom ? `var(--l${dom})` : "var(--accent)", "fill-opacity": 0.85, stroke: sel ? "var(--ink)" : "var(--surface)", "stroke-width": sel ? 2.5 : 1.5 }, gg);
    clickable(gg, () => mapPick(a.key), placeName(a.key));
    bindTip(gg, `<b>${esc(placeName(a.key))}</b><br>${n} ${n === 1 ? "persoon" : "personen"}`);
  });
  const placed = []; /* plaatsnamen: de gekozen plaats eerst, daarna de grootste; een naam die een eerdere raakt, vervalt */
  list.map((a, i) => [a, i]).sort((p, q) => (q[0].key === mapState.place) - (p[0].key === mapState.place) || p[1] - q[1]).forEach(([a, i]) => {
    if (i > 14 && mapState.place !== a.key && !mapFocusPerson) return;
    const P = PLACES[a.key], [x, y] = proj(P.la, P.lo), r = 4 + 2.4 * Math.sqrt(a.people.size);
    if (!labelFits(placed, x + r + 3, y + 4, a.key, 12) && mapState.place !== a.key) return;
    el("text", { x: x + r + 3, y: y + 4, "font-size": 12, fill: "var(--surface)", stroke: "var(--surface)", "stroke-width": 3, "stroke-linejoin": "round" }, labels).textContent = a.key;
    txt(labels, x + r + 3, y + 4, a.key, { "font-size": 12, fill: "var(--ink)" });
  });
  $("#map").innerHTML = ""; $("#map").appendChild(svg);
  renderMapSide(list);
}
/* past een kaartlabel (tekst links-onder op x,y) zonder een eerder geplaatst label te raken? zo ja: onthoud het vak */
function labelFits(placed, x, y, s, fs) {
  const b = [x - 2, y - fs * 0.85 - 2, x + s.length * fs * 0.56 + 2, y + fs * 0.25 + 2];
  if (placed.some(q => b[0] < q[2] && q[0] < b[2] && b[1] < q[3] && q[1] < b[3])) return false;
  placed.push(b); return true;
}
/* plaatspagina: een huwelijk van twee voorouders (kw n en n^1) op één regel */
function placeEvList(evs) {
  const used = new Set(), rows = [];
  evs.forEach((e, i) => {
    if (used.has(i)) return;
    if (/^getrouwd met/.test(e.t)) {
      const j = evs.findIndex((f, k) => k > i && !used.has(k) && f.y === e.y && f.kw === (e.kw ^ 1) && /^getrouwd met/.test(f.t));
      if (j > 0) { used.add(j); const [a, b] = e.kw % 2 ? [evs[j], e] : [e, evs[j]]; rows.push(`<li><span class="y">${e.y}</span><span><button data-open="${a.kw}">${esc(person(a.kw).n)}</button> en <button data-open="${b.kw}">${esc(person(b.kw).n)}</button><span class="t">trouwden${e.t.includes("(gemeente") ? " " + esc(e.t.slice(e.t.indexOf("("))) : ""}</span></span></li>`); return; }
    }
    rows.push(`<li><span class="y">${e.y}</span><span><button data-open="${e.kw}">${esc(person(e.kw).n)}</button><span class="t">${esc(e.t)}</span></span></li>`);
  });
  return `<ul class="evlist">${rows.join("")}</ul>`;
}
function evList(evs) { return `<ul class="evlist">${evs.map(e => `<li><span class="y">${e.y}</span><span><button data-open="${e.kw}">${esc(person(e.kw).n)}</button><span class="t">${esc(e.t)}</span></span></li>`).join("")}</ul>`; }
/* de zijbalk scrolt mee met de pagina: na een keuze het begin ervan in beeld halen als dat boven de balk bovenin is verdwenen */
function mapPick(key) {
  mapState.place = key; renderMap();
  const t = $("#mapSide").getBoundingClientRect().top - $(".top").getBoundingClientRect().bottom;
  if (t < 0) window.scrollBy(0, t - 8);
}
function renderMapSide(list) {
  let h = "";
  if (mapFocusPerson) h += `<div class="stnote">Alleen de levensloop van <b>${esc(person(mapFocusPerson).n)}</b>. <button class="link" id="clearFocus">Iedereen tonen</button></div>`;
  const sel = mapState.place && list.find(a => a.key === mapState.place);
  if (sel) {
    h += `<div><div class="eyebrow">${sel.people.size} ${sel.people.size === 1 ? "persoon" : "personen"} · ${mapState.mode === "levend" ? `woonde hier in ${mapState.year}` : `tot ${mapState.year}`}</div><h3>${esc(placeName(sel.key))}</h3></div>
      ${fig(placeImg(sel.key), { thumb: true, credit: false, cls: "side-ph" })}${placeImg(sel.key) ? `<p class="credit" style="margin:-6px 0 0">${credit(placeImg(sel.key))}</p>` : ""}
      ${pInfo(PLACES[sel.key]) ? `<p class="small" style="margin:0;font-size:14px">${esc(pInfo(PLACES[sel.key]))}</p>` : ""}
      <div id="mapArch" hidden></div>
      ${placeEvList(sel.ev.slice().sort((a, b) => a.y - b.y).map(e => mapState.est.has(e.kw) ? Object.assign({}, e, { t: e.t + " · sterfjaar onbekend" }) : e))}
      <div class="links"><button class="btn" data-go="${slug(sel.key)}">Over ${esc(sel.key)}</button><button class="btn" id="clearPlace">Alle plaatsen</button></div>`;
  } else {
    const nLive = mapState.mode === "levend" ? list.reduce((n, a) => n + a.people.size, 0) : 0;
    h += mapState.mode === "levend"
      ? `<div><div class="eyebrow">in ${mapState.year} in leven</div><h3>${nLive} ${nLive === 1 ? "persoon" : "personen"} in ${list.length} ${list.length === 1 ? "plaats" : "plaatsen"}</h3></div>
      <p class="small" style="margin:0">Alleen wie in ${mapState.year} leefde, op de laatst bekende woonplaats. Wie overleden is, verdwijnt van de kaart. Zonder bekend sterfjaar is het einde geschat: ${MAP_EST} jaar na de geboorte, of later als er later nog iets bekend is${mapState.est.size ? ` (nu bij ${mapState.est.size} ${mapState.est.size === 1 ? "persoon" : "personen"})` : ""}.</p>`
      : `<div><div class="eyebrow">tot en met ${mapState.year}</div><h3>${list.length} plaatsen</h3></div>
      <p class="small" style="margin:0">De kleur hoort bij de familie die er het vaakst voorkomt. Gemeentenamen uit akten staan op de hoofdplaats.</p>`;
    h += `
      <ul class="evlist">${list.slice(0, mapState.allList ? list.length : 15).map(a => `<li><span class="y">${a.people.size}</span><span><button data-place="${esc(a.key)}">${esc(placeName(a.key))}</button><span class="t">${Object.keys(a.lines).filter(l => LINES[l]).map(l => LINES[l].name).join(", ")}</span></span></li>`).join("")}</ul>${!mapState.allList && list.length > 15 ? `<button class="btn" id="allPlaces">Toon alle ${list.length} plaatsen</button>` : ""}
      ${T.key !== "h" ? (T.TXT.offmap ? `<p class="small" style="margin:0">${esc(T.TXT.offmap)}</p>` : "") : `<p class="small" style="margin:0">Buiten dit kaartbeeld: Amsterdam (Gerrit Westendorp, 1856), Oudenbosch in Brabant (Johannes Terwisscha van Scheltinga, 1856), Woerden (Tekela Terwisscha van Scheltinga, 1850) en Duitsland: Schwagstorf bij Fürstenau (Margaretha Niemann) en 'Oldenstee' (Hendrik Meyners).</p>`}`;
  }
  const side = $("#mapSide"); side.innerHTML = h;
  /* archiefbeelden van de gekozen plaats, het dichtst bij het jaar op de kaart eerst */
  if (sel) {
    const y = mapState.year, now = y >= new Date().getFullYear() - 1, k = sel.key;
    const la = archOfPlace(k).filter(a => a.ys && !isMapImg(a)).sort((a, b) => (now ? 0 : yearGap(a.ys, y, y) - yearGap(b.ys, y, y)) || a.ys[0] - b.ys[0]);
    archStrip($("#mapArch"), la, () => route.view === "kaart" && mapState.place === k && mapState.year === y, { n: 4, credit: false, cls: "side",
      cap: (im, a) => `${yearLabel(a.ys)}: ${archTitle(im.t, k)}`, head: `<h5 class="eyebrow" style="margin:0 0 8px">Oude beelden${now ? ", de oudste eerst" : `, het dichtst bij ${y}`}</h5>`,
      foot: `<p class="small" style="margin:6px 0 0"><button class="link" data-go="${slug(k)}">Alle beelden van ${esc(placeName(k))}</button></p>` });
  }
  $$("#mapSide [data-place]").forEach(b => b.onclick = () => mapPick(b.dataset.place));
  const cp = $("#clearPlace"); if (cp) cp.onclick = () => mapPick(null);
  const ap = $("#allPlaces"); if (ap) ap.onclick = () => { mapState.allList = true; renderMapSide(list); };
  const cf = $("#clearFocus"); if (cf) cf.onclick = () => { mapFocusPerson = null; mapState.place = null; renderMap(); };
}

/* ---------- plaats ---------- */
function toRD(la, lo) {
  const dF = 0.36 * (la - 52.15517440), dL = 0.36 * (lo - 5.38720621);
  const x = 155000 + 190094.945 * dL - 11832.228 * dF * dL - 114.221 * dF * dF * dL - 32.391 * dL ** 3 - 0.705 * dF - 2.340 * dF ** 3 * dL - 0.608 * dF * dL ** 3 - 0.008 * dL * dL + 0.148 * dF * dF * dL ** 3;
  const y = 463000 + 309056.544 * dF + 3638.893 * dL * dL + 73.077 * dF * dF - 157.984 * dF * dL * dL + 59.788 * dF ** 3 + 0.433 * dL - 6.439 * dF * dF * dL * dL - 0.032 * dF * dL + 0.092 * dL ** 4 - 0.054 * dF * dL ** 4;
  return [Math.round(x), Math.round(y)];
}
const topoUrl = (P, y) => { const [x, z] = toRD(P.la, P.lo); return `https://www.topotijdreis.nl/kaart/${y}/@${x},${z},${P.kind === "dorp" ? 11 : 10}`; };
const hisgisUrl = P => { const R = 6378137, x = Math.round(P.lo * Math.PI / 180 * R), y = Math.round(R * Math.log(Math.tan(Math.PI / 4 + P.la * Math.PI / 360))); return `https://hisgis.nl/?x=${x}&y=${y}&z=15&r=0&snapshot=eyJ2IjoxLCJsYXllcnMiOlt7ImlkIjoiY2FkLW1pbnV1dHBsYW5zLTE4MzIifSx7ImlkIjoiY2FkLWthZGFzdGVyLTE4MzItb3NtIn1dfQ`; };
function renderPlaats(key) {
  const P = PLACES[key], host = $("#v-plaats");
  if (!P) { go("kaart"); return; }
  const evs = EVENTS.filter(e => e.p === key).sort((a, b) => a.y - b.y);
  const ppl = [...new Set(evs.map(e => e.kw))].map(person);
  host.setAttribute("data-imggroup", "");
  const near = Object.keys(PLACES).filter(k => k !== key && !PLACES[k].seat).map(k => [k, Math.hypot((PLACES[k].la - P.la), (PLACES[k].lo - P.lo) * KX)]).sort((a, b) => a[1] - b[1]).slice(0, 6).filter(x => EVENTS.some(e => e.p === x[0]));
  host.innerHTML = `
    <div class="eyebrow"><button class="link" data-go="kaart">Kaart</button> › ${esc(placeName(key))}</div>
    <div class="cols" style="margin-top:12px;align-items:start">
      <div>
        <h1 class="page-title">${esc(placeName(key))}</h1>
        <p class="small" style="font-size:14px">${P.kind === "gemeente" ? "Gemeente" : "Historische gemeente " + esc(P.gem)} · ${esc(P.prov)}</p>
        ${fig(placeImg(key), { cls: "hero-ph" })}
        ${pInfo(P) ? `<p class="lede" style="color:var(--ink)">${esc(pInfo(P))}</p>` : `<p class="lede">${ppl.length === 1 ? `Eén voorouder van ${esc(T.root)} werd hier geboren, trouwde, woonde of overleed.` : `${ppl.length} voorouders van ${esc(T.root)} werden hier geboren, trouwden, woonden of overleden.`}</p>`}
        ${otherTrees().map(t => { const n = new Set(eventsOf(t).filter(e => e.p === key).map(e => e.kw)).size; return n ? `<p class="stnote">Ook ${n} ${n === 1 ? "voorouder" : "voorouders"} van ${esc(t.root)} ${n === 1 ? "komt" : "komen"} hier voor in de akten. <button class="link" data-tree="${t.key}">Bekijk ${esc(placeName(key))} in de stamboom van ${esc(t.root)}</button></p>` : ""; }).join("")}
        <div class="links" style="margin-top:14px">
          <a class="chip" target="_blank" rel="noopener" href="https://nl.wikipedia.org/w/index.php?search=${enc(key)}">Wikipedia</a>
          <a class="chip" target="_blank" rel="noopener" href="${COMMONS[key] ? COMMONS_BASE + COMMONS[key] : "https://commons.wikimedia.org/w/index.php?search=" + enc(key)}">Foto's (Wikimedia Commons)</a>
          <a class="chip" target="_blank" rel="noopener" href="https://www.delpher.nl/nl/kranten/results?query=${enc(key)}&coll=ddd">Kranten (Delpher)</a>
          <a class="chip" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${enc(key + ", " + P.prov)}">Kaart</a>
          <a class="chip" target="_blank" rel="noopener" href="${topoUrl(P, 1850)}">Topotijdreis: kaart van 1850</a>
          ${P.prov === "Friesland" || P.prov === "Overijssel" || P.prov === "Groningen" || P.prov === "Drenthe" ? `<a class="chip" target="_blank" rel="noopener" href="${hisgisUrl(P)}">HisGIS: kadaster 1832</a>` : ""}
        </div>
        <p class="small" style="margin:8px 0 0">Op de kadasterkaart van 1832 (HisGIS) zie je per perceel wie de eigenaar was; op Topotijdreis schuif je door twee eeuwen kaarten van dit dorp.</p>
        ${MEDIA.some(m => m.p === key) ? `<div class="section-head" style="margin-top:28px"><h2>Beeld</h2></div><div style="display:flex;flex-direction:column;gap:10px">${MEDIA.filter(m => m.p === key).map(m => `<button class="mini-media${imgOf("media", m.id) ? " withimg" : ""}" data-media="${m.id}">${imgOf("media", m.id) ? `<img src="${imgOf("media", m.id).thumb}" alt="" loading="lazy">` : ""}<span class="mk">${esc(MEDIA_KINDS[m.kind].label)}${m.y ? " · " + esc(m.y) : ""}</span><b>${esc(m.t)}</b></button>`).join("")}</div>` : ""}
        <div id="placeArch"></div>
        <div class="section-head" style="margin-top:28px"><h2>Wat hier gebeurde</h2></div>
        ${evs.length ? (() => { const lc = {}; ppl.forEach(p => { const l = lineOf(p.kw); if (LINES[l]) lc[l] = (lc[l] || 0) + 1; }); return `<p class="small" style="margin:0 0 10px">${ppl.length} ${ppl.length === 1 ? "voorouder" : "voorouders"}, ${evs[0].y === evs[evs.length - 1].y ? "in " + evs[0].y : `van ${evs[0].y} tot ${evs[evs.length - 1].y}`}.</p><div class="chips" style="margin-bottom:12px">${Object.entries(lc).sort((a, b) => b[1] - a[1]).map(([l, n]) => `<button class="chip" style="--c:var(--l${l})" data-go="lijn-${l}"><i></i>${esc(LINES[l].name)} <span class="mono">${n}</span></button>`).join("")}</div>${placeEvList(evs)}`; })() : `<p class="small">Nog geen gebeurtenissen gekoppeld.</p>`}
      </div>
      <div>
        <div class="pane" id="placeMap"></div>
        ${oldMaps(key).length ? `<h5 class="eyebrow" style="margin:18px 0 8px">Oude kaart</h5>${oldMaps(key).map(im => fig(im, { thumb: true, cls: "map-ph" })).join("")}<p class="small" style="margin:6px 0 0">Op de kaart van ${esc(P.gem)} staan dorpen, kerken, vaarten en soms boerderijen bij naam.</p>` : ""}
        ${near.length ? `<h5 class="eyebrow" style="margin:16px 0 8px">In de buurt</h5><div class="chips">${near.map(x => `<button class="chip" data-go="${slug(x[0])}">${esc(placeName(x[0]))}</button>`).join("")}</div>` : ""}
      </div>
    </div>`;
  const svg = el("svg", { viewBox: `0 0 ${MW} ${MH}`, role: "img", "aria-label": "Ligging van " + key, style: "display:block;width:100%;height:auto" });
  drawBase(svg, true);
  const others = el("g", {}, svg);
  aggregate(EVENTS).forEach(a => { const Q = PLACES[a.key], [x, y] = proj(Q.la, Q.lo); el("circle", { cx: x, cy: y, r: 4, fill: "var(--faint)", "fill-opacity": 0.6 }, others); });
  const [x, y] = proj(P.la, P.lo);
  el("circle", { cx: x, cy: y, r: 22, fill: "var(--accent)", "fill-opacity": 0.18 }, svg);
  el("circle", { cx: x, cy: y, r: 9, fill: "var(--accent)", stroke: "var(--surface)", "stroke-width": 3 }, svg);
  txt(svg, x + 28, y + 7, key, { "font-size": 22, "font-weight": 600, stroke: "var(--surface)", "stroke-width": 5, "paint-order": "stroke" });
  $("#placeMap").appendChild(svg);
  /* van oud naar nieuw, per bladzijde: alleen de beelden die getoond worden, worden geladen (ook bij duizenden beelden) */
  const pl = archOfPlace(key).slice().sort((a, b) => (a.ys ? a.ys[0] : 9999) - (b.ys ? b.ys[0] : 9999));
  archStrip($("#placeArch"), pl, () => route.view === "plaats" && route.sub === key, { n: 12, step: 24,
    cap: (im, a) => (a.ys ? yearLabel(a.ys) + ": " : "") + archTitle(niceTitle(im), key),
      head:`<div class="section-head" style="margin-top:28px"><h2>Uit de archieven</h2><p>Akten, kaarten, krantenberichten en oude foto's van ${esc(placeName(key))}.</p></div>`,
      foot: pl.length > 12 ? `<p class="ov-more"><a class="ov-link" href="#${T.prefix}beeld-archief--plaats-${kaal(key)}" data-go="beeld-archief--plaats-${kaal(key)}" title="In de verkenner, met filters op periode, soort en onderwerp">Alle ${pl.length.toLocaleString("nl-NL")} beelden van ${esc(placeName(key))} →</a></p>` : "" });
}

/* ---------- beeld ---------- */
const MICON = {
  bidprentje: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="2.5" width="14" height="19" rx="1.5"/><path d="M12 6v8M9 9h6M8.5 18h7"/></svg>`,
  kerk: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2v4M10.5 3.5h3M8 21V10l4-4 4 4v11M3 21v-6l5-3M21 21v-6l-5-3M2 21h20"/><path d="M11 21v-4h2v4"/></svg>`,
  plek: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
  krant: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="15" height="16" rx="1.5"/><path d="M18 8h3v10a2 2 0 0 1-2 2M6 8h9M6 12h9M6 16h6"/></svg>`,
  achtergrond: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 5l9 2 9-2v14l-9 2-9-2z"/><path d="M12 7v14"/></svg>`
};
const beeldState = { page: "", q: "", raw: "" };
const IMG_KINDS = { archief: { label: "Uit de archieven", d: "Oude foto's, ansichtkaarten, prenten, kaarten, akten en grafstenen uit archieven en musea, bij de plaatsen en voorouders uit de stamboom." }, verhaal: { label: "Bij de verhalen", d: "Historische beelden bij de verhalen: de plekken, gebeurtenissen en het werk waarover ze gaan." }, portret: { label: "Portretten", d: "Foto's van voorouders zelf, uit familiestambomen en archieven." }, foto: { label: "Plaatsen", d: "Foto's van de dorpen en steden uit de stamboom." }, kaart: { label: "Oude kaarten", d: "De grietenijen op de kaarten van Schotanus (1664 en 1718) en oude stadsplattegronden: zo zag het land eruit waar de voorouders woonden." } };
const kindLabel = k => (IMG_KINDS[k] || MEDIA_KINDS[k]).label;
MICON.foto = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.8"/><path d="M3 17l5-4 4 3 3-2 6 4"/></svg>`;
MICON.portret = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="12" rx="8" ry="9.5"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5c1.2-2.6 3.2-3.8 5.5-3.8s4.3 1.2 5.5 3.8"/></svg>`;
MICON.archief = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/></svg>`;
MICON.verhaal = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z"/><path d="M12 6v13.5"/></svg>`;
MICON.kaart = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/></svg>`;
function bidItems() {
  return ancestors.map(p => {
    const own = (p.src || []).filter(x => x[1] && srcType(x[1], x[0]) === "Bidprentje" && !/personendatabase/i.test(x[0]));
    const scans = (p.scan || []).filter(x => /archiefrkfriesland/.test(x[1]));
    return { p, own, scans };
  }).filter(b => b.own.length || b.scans.length);
}
function bidCard(b) {
  const p = b.p;
  return `<article class="bpcard" id="bp-${p.kw}" style="--c:${lineColor(p.kw)}">
    <button class="bpframe" data-open="${p.kw}" aria-label="Profiel van ${esc(p.n)}">${MICON.bidprentje}<small>kw ${p.kw} · ${esc(relTerm(p.kw))}</small><h4>${esc(p.n)}</h4><span class="yrs">${esc(lifeYears(p))}</span></button>
    <ul class="mlinks">${b.scans.map(x => `<li><a href="${esc(x[1])}" target="_blank" rel="noopener"><b>Scan:</b> ${esc(x[0].replace(/^Bidprentje\s*/, "").replace(/^\((.*)\)$/, "$1") || "prentje")}</a></li>`).join("")}${b.own.slice(0, 2).map(x => `<li><a href="${esc(x[1])}" target="_blank" rel="noopener">${esc(x[0])}</a></li>`).join("")}${b.own.length > 2 ? `<li><button class="link" data-open="${p.kw}">nog ${b.own.length - 2} in het profiel</button></li>` : ""}</ul>
  </article>`;
}
function mediaCard(m) {
  const own = imgOf("media", m.id);
  const pl = m.p ? (PLACES[m.p] && !PLACES[m.p].seat ? `<button class="link" data-go="${slug(m.p)}">${esc(placeName(m.p))}</button>` : `<span>${esc(placeName(m.p))}</span>`) : "";
  const ppl = (m.kws || []).map(person).filter(Boolean).slice(0, 7);
  return `<article class="mcard${own ? " withimg" : ""}" id="m-${m.id}">
    ${own ? fig(own, { thumb: true, credit: false, cap: false, cls: "mc-ph" }) : ""}
    <div class="mk">${MICON[m.kind]}<span>${esc(MEDIA_KINDS[m.kind].label)}${m.y ? " · " + esc(m.y) : ""}</span>${m.unread ? `<span class="tag" style="color:var(--gold)" title="Alleen als zoektreffer gezien">nog niet gelezen</span>` : m.st ? stTag(m.st) : ""}</div>
    <h3>${esc(m.t)}</h3>
    ${pl ? `<div class="small">${pl}</div>` : ""}
    ${m.d ? `<p>${esc(m.d)}</p>` : ""}
    ${ppl.length ? `<div class="chips">${ppl.map(p => `<button class="chip" style="--c:${lineColor(p.kw)}" data-open="${p.kw}"><i></i>${esc(firstName(p))} ${esc(shortSur(splitName(p.n).sur))}</button>`).join("")}</div>` : ""}
    <ul class="mlinks">${(m.links || []).map(l => `<li><a href="${esc(l[1])}" target="_blank" rel="noopener">${esc(l[0])}</a>${l[2] ? ` <span class="small">(${esc(l[2])})</span>` : ""}</li>`).join("")}</ul>
  </article>`;
}
/* portretten van de huidige boom, van jong naar oud (één per persoon) */
const portraitList = () => ancestors.map(p => ({ p, im: portraitOf(p.kw) })).filter(x => x.im);
/* gedenkbeelden van de huidige boom: bidprentjes, rouwberichten, overlijdensberichten en grafstenen, als echt beeld.
   own = beelden uit IMAGES (direct), arch = beelden uit de archief-packs (laden pas bij tonen). Portretten tellen niet mee. */
const MEM_RE = /^(Bidprentje|Rouwbericht|Rouwbrief|Overlijdensbericht|Grafsteen|Grafkruis|Familiegraf)/i;
/* bijschrift: de titel van het beeld zelf (het kan over een familielid gaan), anders soort + naam */
const memCap = (t, p) => t ? (t.length > 90 ? t.slice(0, 88) + "…" : t) : `Gedachtenis · ${p.n}`;
function memList() {
  const who = {}; ancestors.forEach(p => { const k = imgKey(p.kw); if (!who[k]) who[k] = p; });
  const own = IMGS.filter(i => i.soort === "persoon" && !i.portret && (/^(bidprentje|rouw|krant)$/.test(i.groep || "") || MEM_RE.test(i.t || "")) && who[String(i.key)])
    .map(im => ({ im, p: who[String(im.key)] }));
  /* één beeld per persoon en jaar: hetzelfde overlijden staat soms in twee kranten of ook al als rouwbericht */
  const seen = new Set(own.map(o => o.p.kw + ":" + (String(o.im.datum || "").slice(0, 4) || o.im.id)));
  const arch = archList().filter(a => a.kw != null && (a.soort === "bidprentje" || MEM_RE.test(a.t))).map(a => ({ a, p: person(a.kw) })).filter(x => {
    if (!x.p) return false; const k = x.p.kw + ":" + (String(x.a.datum || "").slice(0, 4) || x.a.id); if (seen.has(k)) return false; seen.add(k); return true; });
  const byKw = (x, y) => x.p.kw - y.p.kw;
  return { own: own.sort(byKw), arch: arch.sort(byKw) };
}
/* soorten binnen "Uit de archieven", in de volgorde waarin ze getoond worden */
const ARCH_SUB = [["foto", "Foto's en prenten"], ["kerk", "Kerken"], ["krant", "Kranten"], ["akte", "Akten en registers"], ["bidprentje", "Bidprentjes"], ["portret", "Portretten"], ["document", "Documenten"], ["kaart", "Topografische kaarten"], ["kadaster", "Kadaster 1832"]];
const archSubOf = a => ARCH_SUB.some(s => s[0] === a.soort) ? a.soort : "document";
const archOrder = a => ARCH_SUB.findIndex(s => s[0] === archSubOf(a));
/* Beeld heeft drie subtabs (MENU): Familie (#beeld), Plaatsen en kaarten (#beeld-plaatsen) en Uit de archieven (#beeld-archief,
   de verkenner). Elke subtab toont zijn secties volledig, met een zoekveld voor die pagina en chips die naar een sectie springen.
   BEELD_KIND: op welke subtab een soort staat (oude ingangen en de knoppen op het overzicht); kerken staan bij de plekken. */
const BEELD_VIEWS = ["beeld", "beeld-plaatsen", "beeld-archief"];
const BEELD_KIND = { portret: "beeld", bidprentje: "beeld", krant: "beeld", verhaal: "beeld", foto: "beeld-plaatsen", kerk: "beeld-plaatsen", plek: "beeld-plaatsen", kaart: "beeld-plaatsen", archief: "beeld-archief" };
const BEELD_SEC = { kerk: "plek" };
function beeldNaar(k) {
  const v = BEELD_KIND[k] || "beeld";
  if (beeldState.q) { beeldState.q = beeldState.raw = ""; rendered[v] = false; }
  go(v); requestAnimationFrame(() => { const t = document.getElementById("bs-" + (BEELD_SEC[k] || k)); if (t) t.scrollIntoView({ block: "start" }); });
}
function renderBeeld(view = "beeld") {
  const host = $("#v-" + view);
  BEELD_VIEWS.forEach(v => { if (v !== view) { $("#v-" + v).innerHTML = ""; rendered[v] = false; } }); /* één Beeld-pagina tegelijk in het DOM (gedeelde ids), ook na het wisselen van boom */
  if (beeldState.page !== view && view !== "beeld-archief") beeldState.q = beeldState.raw = ""; /* de verkenner haalt zijn zoekwoord uit de hash */
  beeldState.page = view;
  const P = {
    beeld: ["Familie in beeld", "Alles wat over de voorouders zelf bewaard bleef, ook rouwberichten en de beelden bij de verhalen.", "Zoek op naam, plaats of jaar"],
    "beeld-plaatsen": ["Plaatsen en kaarten", "Waar ze gedoopt werden, trouwden en begraven liggen, en hoe het land eruitzag waar ze woonden; ook plekken met een eigen verhaal.", "Zoek een plaats, kerk of kaart"],
    "beeld-archief": ["Uit de archieven", "Duizenden beelden uit archieven en musea, bij de plaatsen en voorouders uit de stamboom. Kies een plaats, een periode of een soort, of zoek op een woord.", "Zoek op plaats, onderwerp, naam of jaar"] }[view];
  const zelf = view === "beeld" ? `<details class="box beeld-zelf"><summary><b>Zelf zoeken in oude kranten</b> <span class="small">kant-en-klare zoekopdrachten in Delpher</span></summary>
      <p class="small">Pas de woorden aan voor andere namen.</p><div class="chips">${PAPER_SEARCHES.map(x => `<a class="chip" target="_blank" rel="noopener" href="${esc(x[1])}">${esc(x[0])}</a>`).join("")}</div></details>`
    : view === "beeld-plaatsen" ? `<details class="box beeld-zelf"><summary><b>Meer foto's per plaats</b> <span class="small">fotocollecties op Wikimedia Commons</span></summary>
      <p class="small">Hele fotocollecties van dorpen, kerken en boerderijen.</p><div class="chips">${Object.keys(COMMONS).map(k => `<a class="chip" target="_blank" rel="noopener" href="${COMMONS_BASE + COMMONS[k]}">${esc(placeName(k))}</a>`).join("")}</div></details>` : "";
  host.innerHTML = `
    <div class="eyebrow">Beeld</div>
    <h1 class="page-title">${P[0]}</h1>
    <p class="lede">${P[1]}</p>
    <div class="toolbar"><input type="search" id="mq" placeholder="${P[2]}" aria-label="Zoek op deze pagina" value="${esc(beeldState.raw || "")}">${view === "beeld-archief" ? "" : `<nav class="chips" id="mToc" aria-label="Op deze pagina"></nav>`}</div>
    <div id="mOut"></div>${zelf}`;
  $("#mq").oninput = e => { beeldState.raw = e.target.value; beeldState.q = norm(e.target.value); drawBeeld(); if (view === "beeld-archief") setHash(T.prefix + currentToken(), "replace"); };
  const toc = $("#mToc"); if (toc) toc.onclick = e => { const b = e.target.closest("[data-naar]"); if (b) { const t = document.getElementById(b.dataset.naar); if (t) t.scrollIntoView({ block: "start" }); } };
  drawBeeld();
}
function drawBeeld() {
  const view = route.view, out = $("#mOut"); if (!out) return;
  if (view === "beeld-archief") { if (!$("#arvHost")) out.innerHTML = `<div id="arvHost"></div>`; arvRender($("#arvHost")); return; }
  const toks = beeldState.q.split(/\s+/).filter(Boolean), hit = txt => toks.every(t => norm(txt).includes(t)), toc = [];
  const head = (k, icon, label, d, n) => { toc.push([k, label, n]); return `<div class="section-head" id="bs-${k}"><h2>${icon || ""} ${esc(label)} <span class="mono small">${n}</span></h2><p>${esc(d)}</p></div>`; };
  /* een sectie toont eerst een rij of twee (cap 6, 12 of 18); "Toon alle N" klapt hem open. Bij zoeken alles. */
  const sec = (cap, n, html) => !toks.length && n > cap ? `<div class="bz c${cap} dicht">${html}<p class="bz-meer"><button class="btn" data-bz>Toon alle ${n.toLocaleString("nl-NL")}</button></p></div>` : `<div class="bz">${html}</div>`;
  const mediaHit = m => !toks.length || hit([m.t, m.d, placeName(m.p), ...(m.kws || []).map(x => (person(x) || {}).n)].join(" "));
  let h = "", archTodo = null, memTodo = null;
  if (view === "beeld") {
    const ps = portraitList().filter(x => !toks.length || hit([x.p.n, x.p.alt, x.p.roep, x.im.t, placeName(x.p.bp), placeName(x.p.dp)].join(" ")));
    if (ps.length) h += sec(12, ps.length, head("portret", MICON.portret, IMG_KINDS.portret.label, IMG_KINDS.portret.d, ps.length) + `<div class="gallery portraits" data-imggroup>${ps.map(x => fig(x.im, { thumb: true, cap: `${firstName(x.p)} ${shortSur(splitName(x.p.n).sur)} · ${lifeYears(x.p)}`, credit: false, cls: "port" })).join("")}</div>`);
    const mem = memList(), mt = x => [x.p.n, x.p.alt, placeName(x.p.bp), placeName(x.p.dp), x.im ? x.im.t : x.a.t, x.im ? x.im.desc : x.a.desc].join(" ");
    const own = mem.own.filter(x => !toks.length || hit(mt(x))), arch = mem.arch.filter(x => !toks.length || hit(mt(x)));
    const withImg = new Set([...mem.own, ...mem.arch].map(x => x.p.kw));
    const rest = bidItems().filter(b => !withImg.has(b.p.kw) && (!toks.length || hit([b.p.n, b.p.alt, placeName(b.p.bp), placeName(b.p.dp), ...b.own.map(x => x[0])].join(" "))));
    const n = own.length + arch.length;
    if (n || rest.length) {
      let b = head("bidprentje", MICON.bidprentje, "Bidprentjes en rouwberichten", "Gedachtenisprentjes, rouwberichten uit de krant en grafstenen van overleden voorouders.", n + rest.length);
      if (n) b += `<div class="gallery mem" data-imggroup>${own.map(x => fig(x.im, { thumb: true, cap: memCap(x.im.t, x.p), credit: false })).join("")}<span id="memArch" style="display:contents"></span></div>`;
      memTodo = arch;
      if (rest.length) b += `<div class="bz-rest"><h3 class="sub-h">Ook in de archieven, nog zonder beeld op deze site <span class="mono small">${rest.length}</span></h3><p class="small" style="margin:0 0 12px">Van deze voorouders of hun naaste familie ligt een bidprentje in een archief. Open de link om het daar te bekijken.</p><div class="bpgrid">${rest.map(bidCard).join("")}</div></div>`;
      h += sec(12, n + rest.length, b);
    }
    const kr = MEDIA.filter(m => m.kind === "krant" && mediaHit(m));
    if (kr.length) h += sec(6, kr.length, head("krant", MICON.krant, MEDIA_KINDS.krant.label, MEDIA_KINDS.krant.d, kr.length) + `<div class="grid-3" data-imggroup>${kr.map(mediaCard).join("")}</div>`);
    const vs = storyImgList().filter(x => !toks.length || hit([x.im.t, x.im.desc, x.s.title].join(" ")));
    if (vs.length) h += sec(12, vs.length, head("verhaal", MICON.verhaal, IMG_KINDS.verhaal.label, IMG_KINDS.verhaal.d, vs.length) + `<div class="gallery" data-imggroup>${vs.map(x => fig(x.im, { thumb: true, cap: x.s.title, credit: false })).join("")}</div>`);
  } else {
    const fs = IMGS.filter(i => i.soort === "plaats" && PLACES[i.key] && (!toks.length || hit([placeName(i.key), PLACES[i.key].gem, i.t].join(" ")))).sort((a, b) => placeName(a.key).localeCompare(placeName(b.key), "nl"));
    if (fs.length) h += sec(18, fs.length, head("foto", MICON.foto, IMG_KINDS.foto.label, IMG_KINDS.foto.d, fs.length) + `<div class="gallery" data-imggroup>${fs.map(i => fig(i, { thumb: true, cap: placeName(i.key), credit: false })).join("")}</div>`);
    const pk = [...MEDIA.filter(m => m.kind === "kerk"), ...MEDIA.filter(m => m.kind === "plek")].filter(mediaHit); /* kerken en kerkhoven, dan de andere plekken */
    if (pk.length) h += sec(6, pk.length, head("plek", MICON.plek, MEDIA_KINDS.plek.label, "Kerken en kerkhoven waar ze gedoopt werden, trouwden en begraven liggen, en kloosters, havens en andere plekken met een eigen verhaal.", pk.length) + `<div class="grid-3" data-imggroup>${pk.map(mediaCard).join("")}</div>`);
    const ks = IMGS.filter(i => (i.soort === "kaart" || i.soort === "stadsplan") && (!toks.length || hit([i.t, i.key].join(" ")))).sort((a, b) => (a.soort === b.soort ? a.key.localeCompare(b.key, "nl") : a.soort === "kaart" ? -1 : 1));
    if (ks.length) h += sec(12, ks.length, head("kaart", MICON.kaart, IMG_KINDS.kaart.label, IMG_KINDS.kaart.d, ks.length) + `<div class="gallery maps" data-imggroup>${ks.map(i => fig(i, { thumb: true, credit: false })).join("")}</div>`);
    /* een greep uit het archief: oude foto's uit zoveel mogelijk verschillende dorpen, gelijk verdeeld over het alfabet */
    const all = archList().filter(a => !toks.length || toks.every(t => a.nt.includes(t)));
    if (all.length) {
      const first = {}; all.filter(a => a.soort === "foto").forEach(a => { if (!first[a.key]) first[a.key] = a; });
      const fa = Object.values(first), step = Math.max(1, fa.length / 12);
      archTodo = Array.from({ length: Math.min(12, fa.length) }, (_, j) => fa[Math.floor(j * step)]);
      const naar = toks.length ? "beeld-archief--zoek-" + kaal(beeldState.raw) : "beeld-archief";
      h += head("archief", MICON.archief, IMG_KINDS.archief.label, "Een greep uit de oude foto's, prenten en kaarten in archieven en musea. In de verkenner kies je zelf plaats, periode en soort.", all.length)
        + (archTodo.length ? `<div id="archOut" class="capped pgal arch" data-imggroup><p class="small">Beelden laden…</p></div>` : "")
        + `<p class="ov-more"><a class="ov-link" href="#${T.prefix}${naar}" data-go="${naar}">Verken ${toks.length ? "deze" : "alle"} ${all.length.toLocaleString("nl-NL")} archiefbeelden →</a></p>`;
    }
  }
  out.innerHTML = h || `<div class="empty">Niets gevonden op deze pagina.</div>`;
  out.onclick = e => { const b = e.target.closest("[data-bz]"); if (!b) return; const z = b.closest(".bz"), c = z.className.match(/\bc(\d+)/); z.classList.remove("dicht"); b.parentNode.remove();
    const nx = c && $$(".gallery > *, .grid-3 > *", z)[+c[1]]; if (nx) { const f = nx.querySelector("button, a"); if (f) f.focus({ preventScroll: true }); } }; /* de focus naar het eerste nieuwe beeld */
  const tc = $("#mToc"); if (tc) tc.innerHTML = toc.length > 1 ? toc.map(([k, l, n]) => `<button class="chip" data-naar="bs-${k}">${esc(l)} <span class="mono">${n.toLocaleString("nl-NL")}</span></button>`).join("") : "";
  if (archTodo && archTodo.length) fillArch($("#archOut"), archTodo);
  if (memTodo && memTodo.length) fillMem($("#memArch"), memTodo);
}
/* Verhalen › Achtergrond: boeken en artikelen over de tijd waarin ze leefden (MEDIA, soort achtergrond) */
function verhalenAchtergrond() {
  const ms = MEDIA.filter(m => m.kind === "achtergrond"); if (!ms.length) return "";
  return `<div class="section-head" id="vh-achtergrond"><h2>${MICON.achtergrond} ${esc(MEDIA_KINDS.achtergrond.label)}</h2><p>${esc(MEDIA_KINDS.achtergrond.d)}</p></div><div class="grid-3">${ms.map(mediaCard).join("")}</div>`;
}
/* gedenkbeelden uit de packs in de galerij zetten (zelfde weg als fillArch) */
function fillMem(host, items) {
  if (!host) return;
  Promise.all([...new Set(items.map(x => x.a.pack))].map(loadPack)).then(() => {
    if (!host.isConnected) return;
    host.outerHTML = items.map(x => IMG_ID[x.a.id] ? fig(IMG_ID[x.a.id], { thumb: true, cap: memCap(x.a.t, x.p), credit: false }) : "").join("");
  });
}

/* archiefbeelden in een galerij: laadt alleen de packs van de getoonde beelden (niet via file://) */
function fillArch(host, items) {
  if (!host) return;
  host.innerHTML = `<p class="small">Archiefbeelden laden…</p>`; /* packs zijn scripts: werkt ook vanaf schijf (file://) */
  Promise.all([...new Set(items.map(a => a.pack))].map(loadPack)).then(() => {
    if (!host.isConnected) return;
    const ims = items.map(a => IMG_ID[a.id]).filter(Boolean);
    host.innerHTML = ims.length ? ims.map(im => fig(im, { thumb: true })).join("") : `<p class="small">Deze beelden konden niet worden geladen.</p>`;
  });
}
/* ---------- archiefverkenner ---------- */
/* Beeld › Uit de archieven als verkenner: facetten met live tellingen (plaats, periode, soort, onderwerp, voorouders, familie,
   bron), vrij zoeken (het zoekveld bovenaan Beeld), sorteren, doorscrollen in blokken van 60 tot 600 tegels (daarna een knop,
   tegels worden nooit weggehaald) en de filterstand als kaal hash-token: beeld-archief--plaats-leeuwarden--tijd-1900.
   Het raster haalt de miniaturen rechtstreeks uit img/archief/ (het pad volgt uit het id); de packs pas voor de lichtbak. */
const archSrc = id => "img/archief/" + String(id).toLowerCase().replace(/[^a-z0-9-]/g, "-") + ".jpg";
const ARCH_ID = Object.fromEntries(ARCH_ALL.map(a => [a.id, a]));
const kaal = s => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ARV = { plaats: "", tijd: "", soort: "", onderwerp: "", voor: "", lijn: "", bron: "", sort: "oud", cap: 600, list: [], shown: 0 };
const ARV_F = ["plaats", "tijd", "soort", "onderwerp", "voor", "lijn", "bron"];
const ARV_TIJD = [["v1800", "vóór 1800"], ["1800", "1800–1849"], ["1850", "1850–1899"], ["1900", "1900–1909"], ["1910", "1910–1919"], ["1920", "1920–1929"], ["1930", "1930–1939"], ["1940", "1940–1949"], ["1950", "1950–1959"], ["n1960", "1960 en later"], ["zj", "zonder jaar"]];
const ARV_SOORT = [["foto", "Foto"], ["ansicht", "Ansichtkaart"], ["prent", "Prent of tekening"], ["lucht", "Luchtfoto"], ["kaart", "Kaart"], ["kadaster", "Kadaster 1832"], ["akte", "Akte of register"], ["krant", "Krant"], ["portret", "Portret"], ["bidprentje", "Bidprentje"], ["document", "Document"]];
const ARV_OND = [["kerk", "Kerk", /kerk|toren|kapel|klokkenstoel|pastorie|kerkhof/], ["molen", "Molen", /molen|windmotor|spinnenkop/], ["boerderij", "Boerderij", /boerderij|stelp|\bstate\b|hoeve|pleats|kop-hals-romp/],
  ["water", "Water en bruggen", /gracht|vaart|haven|brug|sluis|kanaal|\bkade|\bschip|schepen|tjalk|praam|\bmeer\b|zijl/], ["straat", "Straat en plein", /straat|plein|\bmarkt|buren\b|steeg|laan\b|\bdijk\b|weg\b/],
  ["school", "School", /school|leerlingen/], ["verkeer", "Station en tram", /station|\btram|trein|spoor/], ["winkel", "Winkel, café, hotel", /winkel|caf[eé]|hotel|herberg|logement|kantoor|\bbank\b/],
  ["mensen", "Mensen", /v\.l\.n\.r|groepsfoto|leerlingen|familie|bruiloft|feest|portret/]];
const ARV_SORT = [["oud", "Oudste eerst"], ["nieuw", "Nieuwste eerst"], ["plaats", "Per plaats"], ["voor", "Meeste voorouders toen"]];
const ARV_KAART = { kaart: 1, kadaster: 1 };
const bronBase = s => (nlNaam(s).split(/[,(»:]/)[0] || "").trim() || "onbekende bron";
function arvTijd(ys) {
  if (!ys) return "zj"; const m = (ys[0] + ys[1]) / 2;
  return m < 1800 ? "v1800" : m < 1850 ? "1800" : m < 1900 ? "1850" : m < 1960 ? String(Math.floor(m / 10) * 10) : "n1960";
}
function arvSoort(a, tx, ys) {
  if (["kaart", "kadaster", "akte", "krant", "portret", "bidprentje", "document"].includes(a.soort)) return a.soort;
  if (/plattegrond|kaart van|caerte|\bkaart\/van/.test(tx)) return "kaart";
  return /luchtfoto|aerocarto|vanuit de lucht/.test(tx) ? "lucht" : /ansicht|groet uit|prentbriefkaart|briefkaart/.test(tx) ? "ansicht"
    : /\bprent\b|tekening|gravure|aquarel|\bets\b|litho|schets|atlas schoemaker|plaatwerk|schilderij/.test(tx) || (ys && ys[1] < 1840) ? "prent" : "foto"; /* vóór ±1840 bestond fotografie nog niet */
}
const ARV_CACHE = {};
function arvItems() {
  if (ARV_CACHE[T.key]) return ARV_CACHE[T.key];
  return ARV_CACHE[T.key] = archList().map(a => {
    const tx = norm(a.t + " " + a.desc), pk = a.kws ? a.p : a.key, ys = imgYears(a.datum);
    return Object.assign({}, a, { pk: PLACES[pk] ? pk : "", ys, tijd: arvTijd(ys), srt: arvSoort(a, tx, ys), ond: ARV_OND.filter(o => o[2].test(tx)).map(o => o[0]),
      bronN: bronBase(a.bron), bronK: kaal(bronBase(a.bron)) });
  });
}
const arvVal = (a, f) => f === "plaats" ? [a.pk] : f === "tijd" ? [a.tijd] : f === "soort" ? [a.srt] : f === "onderwerp" ? a.ond
  : f === "voor" ? [a.tw && !ARV_KAART[a.soort] ? "tijd" : null, a.kws ? "eigen" : null].filter(Boolean) : f === "lijn" ? (a.twl || []).map(String) : f === "bron" ? [a.bronK] : [];
function arvMatch(a, toks, behalve) {
  for (const f of ARV_F) if (f !== behalve && ARV[f] && !arvVal(a, f).includes(ARV[f])) return false;
  return !toks.length || toks.every(t => a.nt.includes(t));
}
function arvSorteer(l) {
  const y0 = a => a.ys ? a.ys[0] : 9999;
  const by = { oud: (a, b) => y0(a) - y0(b), nieuw: (a, b) => (a.ys ? -a.ys[1] : 1) - (b.ys ? -b.ys[1] : 1),
    plaats: (a, b) => placeName(a.pk).localeCompare(placeName(b.pk), "nl") || y0(a) - y0(b), voor: (a, b) => (b.tw || 0) - (a.tw || 0) || y0(a) - y0(b) }[ARV.sort] || ((a, b) => y0(a) - y0(b));
  return l.slice().sort(by);
}
/* filterstand <-> kaal hash-token; onbekende of oude waarden vallen stil weg (dat facet wordt "alles") */
function arvToken() {
  const d = ["beeld-archief"];
  ARV_F.forEach(f => { if (ARV[f]) d.push(f + "-" + (f === "plaats" ? kaal(ARV[f]) : ARV[f])); });
  if (beeldState.raw) d.push("zoek-" + kaal(beeldState.raw));
  if (ARV.sort !== "oud") d.push("sort-" + ARV.sort);
  return d.join("--");
}
function arvFromToken(token) {
  ARV_F.forEach(f => ARV[f] = ""); ARV.sort = "oud"; beeldState.raw = ""; beeldState.q = "";
  const it = arvItems(), plaatsen = {}; it.forEach(a => { if (a.pk) plaatsen[kaal(a.pk)] = a.pk; });
  const bronnen = new Set(it.map(a => a.bronK));
  token.replace(/^beeld-?-archief/, "").split("--").slice(1).forEach(seg => {
    const m = /^([a-z]+)-(.+)$/.exec(seg); if (!m) return; const [, k, v] = m;
    if (k === "plaats" && plaatsen[v]) ARV.plaats = plaatsen[v];
    else if (k === "tijd" && ARV_TIJD.some(x => x[0] === v)) ARV.tijd = v;
    else if (k === "soort" && ARV_SOORT.some(x => x[0] === v)) ARV.soort = v;
    else if (k === "onderwerp" && ARV_OND.some(x => x[0] === v)) ARV.onderwerp = v;
    else if (k === "voor" && (v === "tijd" || v === "eigen")) ARV.voor = v;
    else if (k === "lijn" && LINES[+v]) ARV.lijn = v;
    else if (k === "bron" && bronnen.has(v)) ARV.bron = v;
    else if (k === "zoek") { beeldState.raw = v.replace(/-/g, " "); beeldState.q = norm(beeldState.raw); }
    else if (k === "sort" && ARV_SORT.some(x => x[0] === v)) ARV.sort = v;
  });
}
const arvLabel = (f, v, a) => f === "plaats" ? placeName(v) : f === "tijd" ? (ARV_TIJD.find(x => x[0] === v) || [, v])[1] : f === "soort" ? (ARV_SOORT.find(x => x[0] === v) || [, v])[1]
  : f === "onderwerp" ? (ARV_OND.find(x => x[0] === v) || [, v])[1] : f === "voor" ? (v === "tijd" ? "Uit hun tijd" : "Bij een voorouder") : f === "lijn" ? (LINES[v] ? LINES[v].name : v) : f === "bron" ? (a || v) : v;
function arvRender(host, opts = {}) {
  if (!host) return;
  const items = arvItems(), toks = beeldState.q.split(/\s+/).filter(Boolean);
  ARV_F.forEach(f => { if (ARV[f] && !items.some(a => arvVal(a, f).includes(ARV[f]))) ARV[f] = ""; }); /* bv. na het wisselen van boom */
  const list = arvSorteer(items.filter(a => arvMatch(a, toks)));
  ARV.list = list; ARV.shown = 0; ARV.cap = 600;
  const tel = f => { const c = {}; items.forEach(a => { if (arvMatch(a, toks, f)) arvVal(a, f).forEach(v => { c[v] = (c[v] || 0) + 1; }); }); return c; };
  const chips = (f, opts2, c) => opts2.filter(([v]) => c[v] || ARV[f] === v).map(([v, lab]) => `<button class="chip" data-f="${f}" data-v="${esc(v)}" aria-pressed="${ARV[f] === v}"${f === "lijn" ? ` style="--c:var(--l${v})"` : ""}>${f === "lijn" ? "<i></i>" : ""}${esc(lab)} <span class="mono">${c[v] || 0}</span></button>`).join("");
  const cP = tel("plaats"), topP = Object.keys(cP).filter(Boolean).sort((a, b) => cP[b] - cP[a]);
  const pq = norm(opts.pq || ""), toonP = (pq ? topP.filter(k => norm(placeName(k)).includes(pq)).slice(0, 30) : topP.slice(0, 12));
  if (ARV.plaats && !toonP.includes(ARV.plaats)) toonP.unshift(ARV.plaats);
  const cB = tel("bron"), bronNaam = {}; items.forEach(a => bronNaam[a.bronK] = a.bronN);
  const actief = ARV_F.filter(f => ARV[f]).length + (toks.length ? 1 : 0), wide = matchMedia("(min-width: 900px)").matches;
  host.innerHTML = `<div class="arv">
    <details class="arv-f"${wide || opts.open ? " open" : ""}><summary>Filters${actief ? ` · ${actief} actief` : ""} · <b>${list.length.toLocaleString("nl-NL")}</b> beelden</summary>
      <div class="arv-fb">
        <fieldset><legend>Plaats</legend><input type="search" id="arvPq" placeholder="Zoek een plaats" aria-label="Zoek een plaats" value="${esc(opts.pq || "")}"><div class="chips">${chips("plaats", toonP.map(k => [k, placeName(k)]), cP)}</div>${!pq && topP.length > 12 ? `<p class="small">${topP.length} plaatsen; typ om te zoeken.</p>` : ""}</fieldset>
        <fieldset><legend>Periode</legend><div class="chips">${chips("tijd", ARV_TIJD, tel("tijd"))}</div></fieldset>
        <fieldset><legend>Soort</legend><div class="chips">${chips("soort", ARV_SOORT, tel("soort"))}</div></fieldset>
        <fieldset><legend>Onderwerp</legend><div class="chips">${chips("onderwerp", ARV_OND.map(o => [o[0], o[1]]), tel("onderwerp"))}</div></fieldset>
        <fieldset><legend>Voorouders</legend><div class="chips">${chips("voor", [["tijd", "Uit hun tijd"], ["eigen", "Bij een voorouder"]], tel("voor"))}</div></fieldset>
        <fieldset><legend>Familie</legend><div class="chips">${chips("lijn", LINE_KEYS.filter(l => LINES[l]).map(l => [String(l), LINES[l].name]), tel("lijn"))}</div></fieldset>
        <fieldset><legend>Bron</legend><select id="arvBron" aria-label="Bron"><option value="">Alle bronnen</option>${Object.keys(cB).sort((a, b) => cB[b] - cB[a]).map(k => `<option value="${esc(k)}"${ARV.bron === k ? " selected" : ""}>${esc(bronNaam[k])} (${cB[k]})</option>`).join("")}</select></fieldset>
      </div></details>
    <div class="arv-r">
      <div class="arv-top"><p aria-live="polite"><b>${list.length.toLocaleString("nl-NL")}</b> van ${items.length.toLocaleString("nl-NL")} beelden${actief ? ` · <button class="link" id="arvWis">Wis de filters</button>` : ""}</p>
        <label class="small">Sorteer <select id="arvSort">${ARV_SORT.map(([k, l]) => `<option value="${k}"${ARV.sort === k ? " selected" : ""}>${l}</option>`).join("")}</select></label></div>
      ${actief ? `<div class="chips arv-act">${ARV_F.filter(f => ARV[f]).map(f => `<button class="chip" aria-pressed="true" data-f="${f}" data-v="${esc(ARV[f])}" title="Filter weghalen">${esc(arvLabel(f, ARV[f], bronNaam[ARV[f]]))} ×</button>`).join("")}</div>` : ""}
      <div class="arv-grid" id="arvGrid"></div>
      ${list.length ? "" : `<div class="empty">Geen beelden met deze filters. <button class="link" id="arvWis2">Wis de filters</button></div>`}
      <div id="arvSent" aria-hidden="true"></div>
      <p class="arv-more" id="arvMoreP" hidden><button class="btn" id="arvMore"></button></p>
    </div></div>`;
  /* een filterkeuze of sorteren is een stap in de geschiedenis (terug draait hem terug); typen in een zoekveld niet */
  const herteken = (o = {}, how = "push") => { arvRender(host, o); if (route.view === "beeld-archief" && T.prefix + arvToken() !== location.hash.slice(1)) setHash(T.prefix + arvToken(), how); };
  host.onclick = e => {
    const f = e.target.closest("[data-f]"); if (f) { const k = f.dataset.f, v = f.dataset.v; ARV[k] = ARV[k] === v ? "" : v; herteken({ open: true, focus: `[data-f="${k}"][data-v="${CSS.escape(v)}"]` }); return; }
    if (e.target.closest("#arvWis, #arvWis2")) { ARV_F.forEach(k => ARV[k] = ""); beeldState.raw = ""; beeldState.q = ""; const mq = $("#mq"); if (mq) mq.value = ""; herteken({ open: true }); return; }
    const t = e.target.closest("[data-arv]"); if (t) { const id = t.dataset.arv, a = ARCH_ID[id]; if (!a) return; loadPack(a.pack).then(() => { if (IMG_ID[id]) openLb(id, ARV.list.map(x => x.id)); }); }
  };
  $("#arvSort").onchange = e => { ARV.sort = e.target.value; herteken({ open: true, focus: "#arvSort" }); };
  $("#arvBron").onchange = e => { ARV.bron = e.target.value; herteken({ open: true, focus: "#arvBron" }); };
  const pqi = $("#arvPq"); pqi.oninput = () => { const pos = pqi.selectionStart; arvRender(host, { open: true, pq: pqi.value, focus: "#arvPq" }); const n = $("#arvPq"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } };
  arvMeer(12 * 5);
  const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting) && ARV.shown < Math.min(ARV.cap, ARV.list.length)) arvMeer(60); }, { rootMargin: "800px 0px" });
  io.observe($("#arvSent"));
  $("#arvMore").onclick = () => { if (ARV.shown >= ARV.cap) ARV.cap += 600; const eerste = ARV.shown; arvMeer(60); const t = $$("#arvGrid [data-arv]")[eerste]; if (t) t.focus(); };
  if (opts.focus) { const el = $(opts.focus, host); if (el) el.focus(); }
}
/* tegels toevoegen (nooit weghalen: positie en focus blijven staan) */
function arvMeer(n) {
  const g = $("#arvGrid"); if (!g) return;
  const tot = Math.min(ARV.shown + n, ARV.cap, ARV.list.length);
  g.insertAdjacentHTML("beforeend", ARV.list.slice(ARV.shown, tot).map(a => { const tt = archTitle(niceTitle(a), a.pk || a.key);
    return `<button class="arv-t" data-arv="${esc(a.id)}" aria-label="${esc((a.pk ? placeName(a.pk) + ", " : "") + (a.ys ? yearLabel(a.ys) + ": " : "") + tt)}"><img src="${archSrc(a.id)}" alt="" loading="lazy" decoding="async"><span><small>${esc([a.pk ? placeName(a.pk) : "", a.ys ? yearLabel(a.ys) : ""].filter(Boolean).join(" · "))}</small>${esc(tt)}</span></button>`; }).join(""));
  ARV.shown = tot;
  const rest = ARV.list.length - ARV.shown, p = $("#arvMoreP"), b = $("#arvMore");
  if (p) { p.hidden = !rest; if (b) b.textContent = ARV.shown >= ARV.cap ? `Toon de volgende ${Math.min(600, rest).toLocaleString("nl-NL")} (nog ${rest.toLocaleString("nl-NL")}; verfijn eventueel met de filters)` : `Laad meer (nog ${rest.toLocaleString("nl-NL")})`; }
}

/* alle verhaalbeelden van de huidige boom, in de volgorde van de verhalen */
/* beelden bij de verhalen: eerst per verhaal het omslagbeeld (één sterk beeld per verhaal), daarna de rest; zo opent het overzicht niet met een rij akten */
const storyImgList = () => { const covers = STORIES.map(st => ({ im: storyCov(st).im, s: st })).filter(x => x.im), seen = new Set(covers.map(x => x.im)); return covers.concat(STORIES.flatMap(st => storyImgs(st.id).filter(im => !seen.has(im)).map(im => ({ im, s: st })))); };

/* ---------- akteteksten ---------- */
/* AKTETEKST (data/23-akteteksten.js): kernregels van belangrijke akten, letterlijk, met uitleg; sleutel = beeld-id.
   lbAkte(im) levert het uitklapblok onder de scan in de lichtbak; aktenBlok(kw) de lijst in het profiel.
   Nooit bij een akte waarin een levende staat (kws), in welke boom ook. */
const AKTE = typeof AKTETEKST !== "undefined" ? AKTETEKST : {};
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const AKTE_UUID = {};
Object.keys(AKTE).forEach(id => { const m = UUID_RE.exec(AKTE[id].bron || ""); if (m) AKTE_UUID[m[0].toLowerCase()] = id; });
/* sleutels van levenden in beide bomen: "38" (Harrie) en "a-6" (Alies) */
const LIVING_KEYS = new Set([...(TREES.h ? TREES.h.PEOPLE : []).filter(p => p.living).map(p => String(p.kw)),
  ...(TREES.a ? TREES.a.PEOPLE : []).filter(p => p.living).map(p => "a-" + p.kw)]);
const aktePrive = a => (a.kws || []).some(k => LIVING_KEYS.has(String(k)));
function akteOf(im) {
  if (!im) return null;
  let a = AKTE[im.id];
  if (!a) { const m = UUID_RE.exec(String(im.orig || "") + " " + String(im.bron || "")); if (m && AKTE_UUID[m[0].toLowerCase()]) a = AKTE[AKTE_UUID[m[0].toLowerCase()]]; }
  return a && !aktePrive(a) ? a : null;
}
const GELEZEN = { scan: "overgeschreven van de scan", index: "uit de index van het archief", "scan+index": "van de scan en uit de index" };
function akteInhoud(a) {
  const regels = String(a.tekst || "").split("\n").map(r => r.trim()).filter(Boolean);
  return `<blockquote class="akte-t">${regels.map(esc).join("<br>")}</blockquote>${a.uitleg ? `<p class="akte-u">${esc(a.uitleg)}</p>` : ""}<p class="akte-src">${a.st ? stTag(a.st) + " " : ""}${esc(GELEZEN[a.gelezen] || "")}${httpUrl(a.bron) ? `${a.gelezen ? " · " : ""}<a href="${esc(a.bron)}" target="_blank" rel="noopener">bron</a>` : ""}</p>`;
}
function lbAkte(im) {
  const a = akteOf(im); if (!a) return "";
  return `<details class="lbakte"><summary>Wat er staat</summary>${akteInhoud(a)}</details>`;
}
function aktenBlok(kw) {
  const p = person(kw); if (!p || p.living) return "";
  const ks = [kw, ...twinKws(kw)].map(imgKey);
  const ids = Object.keys(AKTE).filter(id => !aktePrive(AKTE[id]) && (AKTE[id].kws || []).some(k => ks.includes(String(k))));
  if (!ids.length) return "";
  return `<section><h5>Wat de akten zeggen</h5>${ids.map(id => `<details class="akte"><summary>${esc(AKTE[id].titel || "Akte")}</summary>${akteInhoud(AKTE[id])}</details>`).join("")}</section>`;
}

/* ---------- help mee zoeken ---------- */
/* ZOEKLIJST (data/32-zoeklijst.js): open vragen met archief, bron en wat het antwoord beslist. Route #zoeken (in elke boom);
   in de samengestelde boom de vragen van beide bomen, met de zijde erbij. Vragen over levenden worden overgeslagen. */
const ZOEK = typeof ZOEKLIJST !== "undefined" ? ZOEKLIJST : [];
const ONLINE_SOORT = ["vrij online", "online met inlog", "scan op bestelling", "alleen ter plaatse"];
const zoekState = { online: "", alle: false };
/* kw in de huidige boom bij een sleutel "38" of "a-6" (via imgKey, dus ook in de samengestelde boom) */
const kwOfKey = key => { const p = all.find(q => imgKey(q.kw) === String(key)); return p ? p.kw : null; };
function zoekItems() {
  return ZOEK.filter(z => !(z.kws || []).some(k => LIVING_KEYS.has(String(k))))
    .filter(z => T.key === "s" || (z.boom || "h") === T.key)
    .slice().sort((a, b) => (a.pri || 3) - (b.pri || 3));
}
function zoekCard(z) {
  const ppl = (z.kws || []).map(k => kwOfKey(k)).filter(Boolean).map(person).filter(p => p && !p.living);
  const meer = z.beslist || z.bron || z.hoe || httpUrl(z.link) || ppl.length;
  return `<article class="zkcard">
    <div class="zk-top"><span class="zk-pri" title="belang">${"●".repeat(4 - (z.pri || 3))}</span>${T.key === "s" ? sideTag(z.boom || "h") : ""}<span class="zk-online zk-${ONLINE_SOORT.indexOf(z.online)}">${esc(z.online || "")}</span></div>
    <h3>${esc(z.vraag)}</h3>
    ${z.archief ? `<p class="zk-arch">${esc(z.archief)}</p>` : ""}
    ${meer ? `<details class="zk-more"><summary>Wat het beslist en hoe je het vindt</summary>
      ${z.beslist ? `<p class="zk-b">${esc(z.beslist)}</p>` : ""}
      <dl class="zk-dl">${z.bron ? `<dt>Waar</dt><dd>${esc(z.bron)}</dd>` : ""}${z.hoe ? `<dt>Hoe</dt><dd>${esc(z.hoe)}</dd>` : ""}</dl>
      <div class="links">${httpUrl(z.link) ? `<a class="btn" href="${esc(z.link)}" target="_blank" rel="noopener">Naar het archief</a>` : ""}${ppl.map(p => `<button class="chip" style="--c:${lineColor(p.kw)}" data-open="${p.kw}"><i></i>${esc(p.n)}</button>`).join("")}</div>
    </details>` : ""}
  </article>`;
}
/* automatische lijsten, live uit de data: waar de lijnen ophouden, één ouder bekend, C- en D-koppelingen (via stapSt/schakelReden) */
function zoekAuto() {
  const rij = (q, extra) => `<li><span class="nw">${sexIco(q.kw)}<button class="link" data-open="${q.kw}">${esc(q.n)}</button></span> <span class="mono small">${esc(lifeYears(q))}</span>${T.key === "s" && q.side ? " " + sideTag(q.side) : ""}${extra ? `<span class="zk-x">${extra}</span>` : ""}</li>`;
  const perLijn = list => { const g = {}; list.forEach(x => { const l = lineOf(x.p.kw); (g[l] = g[l] || []).push(x); });
    return Object.keys(g).sort((a, b) => a - b).map(l => `<h4 class="zk-l">${esc(LINES[l] ? LINES[l].name : "Generatie I–III")} <span class="mono small">${g[l].length}</span></h4><ul class="zk-list">${g[l].map(x => rij(x.p, x.extra)).join("")}</ul>`).join(""); };
  const anc = ancestors.filter(q => q.kw >= 2);
  const geen = [], een = [], kc = [], kd = [];
  anc.forEach(q => {
    const f = BY.has(2 * q.kw), m = BY.has(2 * q.kw + 1);
    if (!f && !m) geen.push({ p: q }); else if (f !== m) een.push({ p: q, extra: f ? "moeder onbekend" : "vader onbekend" });
    const st = stapSt(q.kw), kind = person(q.kw >> 1);
    if ((st === "C" || st === "D") && kind) { const r = schakelReden(q, st, kind); /* de algemene uitleg van C/D staat al in de kop van de groep; per regel alleen een eigen reden */
      (st === "C" ? kc : kd).push({ p: q, extra: `${isMale(q.kw) ? "vader" : "moeder"} van ${esc(firstName(kind))}${r && r !== STATUS[st].long ? " · " + esc(r) : ""}` }); }
  });
  const blok = (titel, uitleg, list) => list.length ? `<details class="zk-auto"><summary>${titel} <span class="mono small">${list.length}</span></summary><p class="small">${uitleg}</p>${perLijn(list)}</details>` : "";
  const h = blok("Waar de lijnen ophouden", "Voorouders van wie geen van beide ouders bekend is. Hier gaat de stamboom niet verder terug.", geen)
    + blok("Eén ouder bekend", "Voorouders van wie maar één ouder bekend is.", een)
    + blok("Koppelingen uit online stambomen (C)", "Een ouder die alleen in een online stamboom of genealogie zonder bron staat. Een akte zou deze stap zeker maken.", kc)
    + blok("Hypothesen (D)", "Een ouder die alleen is afgeleid uit vernoeming, doopgetuigen of patroniem. Hier valt het meest te winnen.", kd);
  return h ? `<div class="section-head"><h2>Waar de stamboom ophoudt</h2></div>${h}` : "";
}
/* de volledige lijst onderzoeksvragen (OPEN_QUESTIONS), ingeklapt: kort per vraag, waar zoeken */
function onderzoeksVragen() {
  if (!OPEN_QUESTIONS.length) return "";
  return `<div class="section-head"><h2>Alle onderzoeksvragen</h2><p>Hoe meer bolletjes, hoe meer er van het antwoord afhangt.</p></div>
    <details class="box zk-auto"><summary>Toon alle onderzoeksvragen <span class="mono small">${OPEN_QUESTIONS.length}</span></summary>
    <div class="pane scroll-x"><table class="mini stack"><thead><tr><th>Belang</th><th>Vraag</th><th>Waar zoeken</th></tr></thead><tbody>
      ${OPEN_QUESTIONS.slice().sort((a, b) => a.pri - b.pri).map(o => `<tr><td class="y">${"●".repeat(4 - o.pri)}</td><td>${esc(o.q)} <button class="link small" data-open="${o.kw}">kw ${o.kw}</button></td><td class="small" data-l="Waar zoeken">${esc(o.where)}</td></tr>`).join("")}
    </tbody></table></div></details>`;
}
function renderZoeken() {
  const host = $("#v-zoeken"), items = zoekItems();
  const soorten = ONLINE_SOORT.filter(o => items.some(z => z.online === o));
  if (zoekState.online && !soorten.includes(zoekState.online)) zoekState.online = "";
  const pool = zoekState.online ? items.filter(z => z.online === zoekState.online) : items;
  /* standaard alleen de belangrijkste vragen (belang 1, per boom); met een filter of "alle" de hele lijst */
  const top = pool.filter(z => (z.pri || 3) === 1), kort = !zoekState.alle && !zoekState.online && top.length && top.length < pool.length;
  const list = kort ? top : pool;
  host.innerHTML = `<div class="eyebrow"><button class="link" data-go="bronnen">Bronnen</button> › Help mee zoeken</div>
    <h1 class="page-title">Help mee zoeken</h1>
    <p class="lede">Vaak ligt het antwoord in één bepaald boek of op één scan: een doopboek, een weesakte, een register in een archief. Bij elke vraag staat waar het waarschijnlijk ligt, wat het zou beslissen en of je het vrij online kunt bekijken. Weet je meer, of heb je een akte, foto, bidprentje of familiepapier dat iets aanvult of verbetert? Vertel het Harrie of Alies.</p>
    ${items.length ? `<div class="chips" id="zkChips"><button class="chip" aria-pressed="${!zoekState.online}" data-zk="">Alles <span class="mono">${items.length}</span></button>${soorten.map(o => `<button class="chip" aria-pressed="${zoekState.online === o}" data-zk="${esc(o)}">${esc(o.charAt(0).toUpperCase() + o.slice(1))} <span class="mono">${items.filter(z => z.online === o).length}</span></button>`).join("")}</div>
    <div class="zkgrid">${list.map(zoekCard).join("")}</div>
    ${kort ? ovMore(`id="zkAll"`, `Alle ${pool.length} vragen`) : ""}` : `<div class="empty">Er staan hier nog geen vragen.</div>`}
    ${zoekAuto()}${onderzoeksVragen()}`;
  $$("#zkChips [data-zk]").forEach(b => b.onclick = () => { zoekState.online = b.dataset.zk; renderZoeken(); });
  const za = $("#zkAll"); if (za) za.onclick = () => { zoekState.alle = true; renderZoeken(); };
}

/* ---------- bronnen ---------- */
/* De groep Bronnen heeft vijf pagina's (subtabs uit MENU): Bronnen en betrouwbaarheid (labels, archieven, wegwijzer),
   Help mee zoeken (met alle onderzoeksvragen), Tegenstrijdigheden (per familielijn, inklapbaar), Alle bronnen (met filter)
   en Over deze site (met begrippen, wijzigingen per versie en beeldverantwoording; ankers via bronnen-begrippen enz.). */
const bronKop = (titel, lede) => `<div class="eyebrow">Bronnen</div><h1 class="page-title">${esc(titel)}</h1>${lede ? `<p class="lede">${lede}</p>` : ""}`;
function bronAgg() {
  const agg = {};
  ancestors.forEach(p => (p.src || []).forEach(s => { if (!s[1]) return; const t = srcType(s[1], s[0]); const k = s[1]; (agg[t] = agg[t] || {}); if (!agg[t][k]) agg[t][k] = { label: s[0], url: k, kws: new Set() }; agg[t][k].kws.add(p.kw); }));
  return agg;
}
function renderBronnen() {
  const agg = bronAgg(), total = Object.values(agg).reduce((n, o) => n + Object.keys(o).length, 0), cl = CHANGELOG[0];
  const kaart = (v, titel, tekst) => `<article class="fact kaart-link"><h3><button type="button" class="hoofd" data-go="${v}">${esc(titel)}</button></h3><p>${tekst}</p><span class="kl-pijl" aria-hidden="true">Naar ${esc(titel.toLowerCase())} →</span></article>`;
  const arch = []; ARCHIVES.forEach(a => { const e = arch.find(x => x.n === a.n); if (e) e.meer.push(a); else arch.push(Object.assign({ meer: [] }, a)); }); /* één regel per archief, ook als het twee keer in de lijst staat */
  $("#v-bronnen").innerHTML = `${bronKop("Bronnen en betrouwbaarheid", "Elk gegeven op deze site komt uit een bron, met een label voor de sterkte van het bewijs.")}
    <div class="section-head"><h2>Hoe betrouwbaar?</h2></div>
    <div class="cols">
      <div class="box"><h3>Statuslabels</h3>${["A", "B", "C", "D"].map(s => `<p style="margin:8px 0">${stTag(s, true)} ${esc(STATUS[s].long)}</p>`).join("")}
        <h3 style="margin-top:18px">Bij weetjes en verhalen</h3>${Object.keys(NOTE_KIND).map(k => `<p style="margin:8px 0">${kindTag(k)} ${esc(NOTE_KIND[k])}</p>`).join("")}</div>
      <div class="box"><h3>Verdeling over ${ancestors.length} voorouders</h3>${statusBars()}<p class="small" style="margin:12px 0 0">Velden die onzekerder zijn dan het profiel als geheel, krijgen in het profiel een eigen label.</p></div>
    </div>
    <div class="section-head"><h2>Verder bij de bronnen</h2></div>
    <div class="grid-4 bron-weg">
      ${kaart("zoeken", "Help mee zoeken", "De open vragen, met waar het antwoord waarschijnlijk ligt, en waar de stamboom ophoudt.")}
      ${CONFLICTS.length ? kaart("bronnen-tegenstrijdig", "Tegenstrijdigheden", `In ${nl(CONFLICTS.length)} gevallen spreken bronnen elkaar tegen. Wat we ermee doen.`) : ""}
      ${kaart("bronnen-lijst", "Alle bronnen", `${nl(total)} akten, registers en genealogieën, per soort en doorzoekbaar.`)}
      ${kaart("bronnen-over", "Over deze site", `De nummering, wat er over levenden staat, ${nl(GLOSSARY.length)} begrippen${cl ? `, en wat er nieuw is in ${esc(cl.v)}` : ""}.`)}
    </div>
    <div class="section-head"><h2>Archieven</h2><p>Elk profiel heeft ook eigen zoeklinks.</p></div>
    <ul class="arch-list">${arch.map(a => `<li><a href="${esc(a.u)}" target="_blank" rel="noopener">${esc(a.n)}</a><span>${esc(a.d)}${a.meer.map(x => ` <a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.d.replace(/\.$/, ""))}</a>`).join("")}</span></li>`).join("")}</ul>`;
}
/* filter in een lijst: tekst in een invoerveld verbergt wat niet past en opent de groepen met treffers */
function bronFilter(input, groups, item, telling, wat) {
  const tot = groups.reduce((n, g) => n + $$(item, g).length, 0);
  const run = () => {
    const q = norm(input.value.trim()); let n = 0;
    groups.forEach(g => { let m = 0; $$(item, g).forEach(li => { const ok = !q || norm(li.textContent).includes(q); li.hidden = !ok; if (ok) m++; }); g.hidden = !!q && !m; if (q) g.open = m > 0 && m <= 40; n += m; });
    if (telling) telling.textContent = q ? `${nl(n)} van de ${nl(tot)} ${wat || ""}`.trim() : `${nl(tot)} ${wat || ""}`.trim(); /* altijd een telling, zoals bij de opvallende feiten */
  };
  input.addEventListener("input", run); run();
}
function renderTegenstrijdig() {
  const host = $("#v-bronnen-tegenstrijdig");
  if (!CONFLICTS.length) { host.innerHTML = `${bronKop("Tegenstrijdigheden")}<div class="empty">In deze stamboom spreken de bronnen elkaar nergens tegen.</div>`; return; }
  const g = {}; CONFLICTS.forEach(c => { const l = lineOf(c.kw) || 0; (g[l] = g[l] || []).push(c); });
  host.innerHTML = `${bronKop("Tegenstrijdigheden", `${nl(CONFLICTS.length)} gevallen: een andere datum, een andere naam, of twee kandidaten voor dezelfde ouder. Onder elk geval staat in het kort wat we ermee doen. Geordend per familielijn.`)}
    <div class="toolbar"><input type="search" id="tgQ" placeholder="Zoek op naam, plaats of onderwerp" aria-label="Zoek in de tegenstrijdigheden"><span class="small" id="tgN" aria-live="polite"></span></div>
    <div class="tg-wrap">${Object.keys(g).sort((a, b) => a - b).map(l => `<details class="box tg-l"><summary><b>${esc(LINES[l] ? "Familie " + LINES[l].name : "Generatie I–III")}</b> <span class="mono small">${g[l].length}</span></summary>
      ${g[l].map(c => { const p = person(c.kw), nu = String(c.now || "").split(/(?<=\.)\s/)[0]; return `<details class="tg"><summary>${esc(c.topic)}${p && !norm(c.topic).includes(norm(firstName(p))) ? ` <span class="small">· ${esc(p.n)}</span>` : ""}${T.key === "s" && c.side ? " " + sideTag(c.side) : ""}<span class="tg-nu">${esc(trunc(nu, 110))}</span></summary>
        <dl class="tg-dl"><dt>De ene bron</dt><dd>${esc(c.a)}</dd><dt>De andere bron</dt><dd>${esc(c.b)}</dd><dt>Wat we ermee doen</dt><dd>${esc(c.now)}</dd></dl>
        ${p ? `<p class="small" style="margin:6px 0 0"><button class="link" data-open="${c.kw}">Profiel van ${esc(p.n)}</button></p>` : ""}</details>`; }).join("")}</details>`).join("")}</div>`;
  bronFilter($("#tgQ"), $$(".tg-l", host), ".tg", $("#tgN"), "gevallen");
}
function renderBronLijst() {
  const host = $("#v-bronnen-lijst"), agg = bronAgg(), total = Object.values(agg).reduce((n, o) => n + Object.keys(o).length, 0);
  host.innerHTML = `${bronKop("Alle bronnen", `${nl(total)} bronnen uit de profielen, gegroepeerd per soort: akten, registers, kranten en genealogieën. Bij elke bron staat bij wie hij hoort.`)}
    <div class="toolbar"><input type="search" id="blQ" placeholder="Zoek in de bronnen" aria-label="Zoek in alle bronnen"><span class="small" id="blN" aria-live="polite"></span></div>
    <div style="display:flex;flex-direction:column;gap:10px">${SRC_ORDER.filter(t => agg[t]).map(t => { const items = Object.values(agg[t]); return `<details class="box bl-g"><summary style="cursor:pointer">${typeof srcIco === "function" ? srcIco(t) : ""}<b>${esc(SRC_MV[t] || t)}</b> <span class="small">${items.length}</span></summary><ul class="bl-list">${items.map(it => { const ks = [...it.kws].filter(k => person(k) && !person(k).living);
      return `<li><a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.label)}</a>${ks.length ? `<span class="bl-wie">${ks.slice(0, 2).map(k => `<button type="button" class="link" data-open="${k}" title="kw ${k}">${esc(person(k).n)}</button>`).join(", ")}${ks.length > 2 ? ` en ${ks.length - 2} ${ks.length === 3 ? "ander" : "anderen"}` : ""}</span>` : ""}</li>`; }).join("")}</ul></details>`; }).join("")}</div>
    ${SOURCE_GROUPS.length ? `<details class="box bl-gen"><summary><b>Genealogieën en naslag, naar betrouwbaarheid</b> <span class="small">${SOURCE_GROUPS.reduce((n, g) => n + g[1].length, 0)}</span></summary>
    <p class="small">De genealogieën van anderen, ingedeeld naar hoe goed ze hun bronnen noemen, en de naslagwerken. Gebruikt als aanwijzing; een gegeven uit een genealogie heeft status B of C.</p>
    <div class="cols">${SOURCE_GROUPS.map(g => `<div><h3>${esc(g[0])}</h3><ul>${g[1].map(s => `<li><a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a></li>`).join("")}</ul></div>`).join("")}</div></details>` : ""}`;
  bronFilter($("#blQ"), $$(".bl-g", host), "li", $("#blN"), "bronnen");
}
/* beeldbronnen samengevat: op de basisnaam (Delpher, Tresoar …), met aantallen, de grootste eerst */
function beeldBronnen(behalve, max = 8) {
  const c = {}; IMGS.forEach(i => { const b = bronOf(i).split(/\s*[,»(:]\s*/)[0].trim() || bronOf(i); if (b !== behalve) c[b] = (c[b] || 0) + 1; });
  const xs = Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "nl"));
  const top = xs.slice(0, max).map(([b, n]) => `${esc(b)} (${n})`), rest = xs.length - top.length;
  return (top.join(", ") + (rest ? ` en ${rest} andere` : "")).replace(/, ([^,]*)$/, rest ? ", $1" : " en $1");
}
function renderOverSite() {
  const host = $("#v-bronnen-over");
  const delen = [["over", "Over deze site"], ["begrippen", "Begrippen"], ["wijzigingen", "Wijzigingen"]].concat(IMGS.length ? [["beeld", "Beeldverantwoording"]] : []);
  host.innerHTML = `${bronKop("Over deze site")}
    <nav class="chips toc" aria-label="Op deze pagina">${delen.map(([id, t]) => `<a class="chip" href="#${T.prefix}bronnen-${id}" data-go="bronnen-${id}">${t}</a>`).join("")}</nav>
    <div class="box" id="bo-over" style="font-size:14px;color:var(--muted);margin-top:18px">
      <p style="margin-top:0">Kwartiernummers (kw) volgen het systeem van Kekulé: ${esc(T.rootFull || T.root)} ${T.key === "s" ? "hebben samen nummer" : "heeft nummer"} 1, de vader van persoon <i>n</i> is 2<i>n</i>, de moeder 2<i>n</i>+1. Even nummers zijn mannen, oneven nummers vrouwen.</p>
      <p>Van levende familieleden staan alleen namen op deze site. Broers en zussen van de grootouders die zijn overleden, staan met naam en jaartallen bij hun ouders. Plaatsen op de kaart zijn bij benadering: de dorpskern, niet de boerderij.</p>
      <p>${IMGS.length ? `${IMGS.some(i => bronOf(i) === "Wikimedia Commons") ? "De foto's en oude kaarten van Wikimedia Commons staan onder een vrije licentie; maker en licentie staan bij elk beeld (zie Beeldverantwoording hieronder)." : ""}${IMGS.some(i => bronOf(i) !== "Wikimedia Commons") ? " Andere beelden komen uit " + beeldBronnen("Wikimedia Commons", 6) + "; die staan er met de rechtenaanduiding van het archief of de krant, en de bron staat bij elk beeld." : ""} ${IMGS.some(i => i.soort === "persoon" && /^\d+$/.test(i.key)) ? "Foto's van dorpen en kerken laten ze zien zoals ze nu zijn. Bij een aantal overleden voorouders staan een portret, een grafsteen of een oud rouwbericht uit het archief; van levende familieleden staan er geen beelden op." : "Het zijn foto's van de dorpen en kerken zoals ze nu zijn, of oude kaarten; het zijn geen foto's van de voorouders zelf."} De overige illustraties zijn eigen tekeningen.` : "Afbeeldingen op deze site zijn eigen tekeningen."} De meeste scans van akten en bidprentjes staan bij de archieven zelf; de profielen linken ernaar.</p>
      <p style="margin-bottom:0">Weet je meer, of heb je een akte, foto, bidprentje of verhaal dat iets aanvult of verbetert? Vertel het Harrie of Alies.</p>
    </div>
    <div class="section-head" id="bo-begrippen"><h2 id="begrippen">Begrippen</h2><p>Oude woorden en termen uit de akten, kort uitgelegd.</p></div>
    <div class="toolbar"><input type="search" id="bgQ" placeholder="Zoek een begrip" aria-label="Zoek in de begrippen"><span class="small" id="bgN" aria-live="polite"></span></div>
    <div class="box"><dl class="dl bg-dl" style="grid-template-columns:160px minmax(0,1fr)">${GLOSSARY.slice().sort((a, b) => a[0].localeCompare(b[0], "nl")).map(g => `<div class="bg-it"><dt id="${glossId(g[0])}"><b style="color:var(--ink)">${esc(g[0])}</b></dt><dd>${esc(g[1])}${g[2] ? ` <span class="small">Bron: <a href="${esc(g[2][1])}" target="_blank" rel="noopener">${esc(g[2][0])}</a></span>` : ""}</dd></div>`).join("")}</dl></div>
    <div class="section-head" id="bo-wijzigingen"><h2>Wijzigingen</h2><p>Wat er per versie is veranderd.</p></div>
    <div class="wz">${CHANGELOG.map((c, i) => `<details class="box"${i ? "" : " open"}><summary><b>${esc(c.v)}</b> <span class="small">${esc(c.d)} · ${c.items.length} ${c.items.length === 1 ? "punt" : "punten"}</span></summary><ul>${c.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul></details>`).join("")}</div>
    ${IMGS.length ? `<div class="section-head" id="bo-beeld"><h2 id="beeldverantwoording">Beeldverantwoording</h2></div>
    <p class="small bo-beeld">${IMGS.length} afbeeldingen, met maker, licentie en bron. Ze komen uit ${beeldBronnen("", 8)}.${archList().length ? ` Daarnaast ${archList().length} beelden uit archieven en musea; maker, rechten en bron staan bij elk beeld (<button class="link" data-archief>Beeld › Uit de archieven</button>).` : ""}</p>
    <details class="box"><summary style="cursor:pointer"><b>Alle afbeeldingen</b> <span class="small">${IMGS.length}</span></summary><ul class="srclist" style="margin-top:10px">${IMGS.slice().sort((a, b) => a.t.localeCompare(b.t, "nl")).map(i => `<li><span class="small">${esc(i.t)}</span><span>${credit(i)}${refLine(i) ? ` · ${refLine(i)}` : ""}</span></li>`).join("")}</ul></details>` : ""}`;
  const bg = $(".bg-dl", host); if (bg) bronFilter($("#bgQ"), [bg], ".bg-it", $("#bgN"), "begrippen");
}
/* naar een onderdeel van Over deze site (of naar boven) */
function bronNaar(deel) {
  const t = deel && document.getElementById("bo-" + deel);
  if (t) t.scrollIntoView({ block: "start" });
}

/* ---------- cijfers ---------- */
const DOW = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const fullDate = s => { const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; };
/* "vóór 1828", "tussen 1799 en 1803", "1797 of 1798": geen bruikbaar jaartal om mee te rekenen (wel "ca.") */
const vague = s => /vóór|voor|\bna\b|tussen|\bof\b|\?/i.test(String(s || ""));
function yearsBetween(a, b) {
  const A = fullDate(a), B = fullDate(b);
  if (A && B) return (B - A) / 31556952000;
  const ya = yr(a), yb = yr(b);
  return ya && yb && !vague(a) && !vague(b) ? yb - ya : null;
}
const exactPair = (a, b) => !!(fullDate(a) && fullDate(b));
const meanOf = xs => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
function medianOf(xs) { if (!xs.length) return null; const s = xs.slice().sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
const r1 = x => x === null ? "–" : (Math.round(x * 10) / 10).toLocaleString("nl-NL");
const r0 = x => x === null ? "–" : Math.round(x).toLocaleString("nl-NL");
const nl = x => Number(x).toLocaleString("nl-NL");
const pct = (a, b) => b ? Math.round(a / b * 100) + "%" : "–";
const pctN = (a, b) => `${pct(a, b)}<span class="small pn">${nl(a)}</span>`; /* aandeel, met het aantal erachter */
/* een plaats op gemeenteniveau (Schoterland, Weststellingwerf): op de kaart bij de hoofdplaats, maar niet bruikbaar voor afstanden of dorpentellingen */
const isGemeente = k => !!(PLACES[k] && (PLACES[k].seat || PLACES[k].kind === "gemeente"));
const ca = (...ds) => ds.every(d => fullDate(d)) ? "" : " (ca.)"; /* niet tot op de dag bekend: leeftijd bij benadering */
function kmBetween(a, b) {
  const A = PLACES[mapKey(a)], B = PLACES[mapKey(b)]; if (!A || !B) return null;
  const R = 6371, t = Math.PI / 180, dLa = (B.la - A.la) * t, dLo = (B.lo - A.lo) * t;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(A.la * t) * Math.cos(B.la * t) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const pb = (p, extra) => `<button class="link" data-open="${p.kw}">${esc(p.n)}</button>${p.st === "C" || p.st === "D" ? " " + stTag(p.st) : ""}${extra ? ` <span class="small">${extra}</span>` : ""}`;
const OCC_CATS = [
  ["Boer, landbouwer of veehouder", /(^|[^a-z])boer(in)?([^a-z]|$)|pachtboer|zetboer|landbouw|bouwman|colon|veehoud|huisman/i],
  ["Knecht, meid of arbeider", /knecht|meid|arbeid(st)?er|boerwerker/i],
  ["Handel: koopman, winkelier, grutter", /koopman|winkel|grutter|gortmaker|melktapper/i],
  ["Herbergier of kastelein", /herberg|kastelein|hospes/i],
  ["Ambacht: bakker, timmerman, molenaar, wever", /bakker|bakster|timmer|ketel|smid|molenaar|molenmaker|wever|naaister/i],
  ["Water en veen: schipper, visser, turfmaker, veenbaas", /schipper|sluis|veenbaas|turf|visser|zeekapitein/i],
  ["Rentenier", /rentenier/i],
  ["Kerk, bestuur of zorg: kerkvoogd, diaken, raadslid, chirurgijn", /gemeenteraad|raadsman|vroedsman|kerkvoogd|diaken|ouderling|politie|chirurgijn/i]
];
const hasOcc = p => p.occ && !/^zonder beroep/i.test(p.occ);
const NUMW = { twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6, zeven: 7, acht: 8, negen: 9, tien: 10, elf: 11, twaalf: 12, dertien: 13, veertien: 14, vijftien: 15, zestien: 16, zeventien: 17, achttien: 18 };
const numWord = w => +w || NUMW[String(w).toLowerCase()] || 0;
/* Kinderen tellen uit de lijst in het profiel. Een regel telt als kind als hij met een naam begint (of "levenloos geboren");
   "in totaal dertien kinderen" geeft het totaal, "vier jongere kinderen" komt erbij. Een naam die terugkomt zonder eigen
   jaartal (bijvoorbeeld in een opsomming uit een memorie) is hetzelfde kind en telt niet opnieuw. */
function kidCount(ks) {
  if (!ks || !ks.length) return 0;
  const seen = []; let n = 0, extra = 0, total = 0;
  ks.forEach(k => {
    const s = String(k).trim(), m = /(\d+|[a-z]+)\s+(?:(jongere|oudere|andere|overige|verdere)\s+)?kinderen/i.exec(s);
    if (m && /totaal/i.test(s)) { total = Math.max(total, numWord(m[1])); return; }
    if (m && m[2] && m.index === 0) { extra += numWord(m[1]); return; }
    if (!/^[A-ZÀ-ÞĲ']/.test(s)) { if (/^(levenloos|doodgeboren)/i.test(s)) n++; return; }
    const first = s.split(/[\s,(]/)[0], dated = /^[^(]*\((?!ca\.)[^)]*\d{4}/.test(s);
    if (!dated && seen.includes(first)) return;
    seen.push(first); n++;
  });
  return Math.max(n + extra, total);
}
let STATS = null;
function computeStats() {
  const S = {};
  const A = ancestors;
  /* levensduur */
  const life = A.map(p => { const v = yearsBetween(p.b, p.d); return v !== null && v >= 0 && v < 110 ? { p, v, exact: exactPair(p.b, p.d) } : null; }).filter(Boolean);
  S.life = life;
  S.lifeM = life.filter(x => isMale(x.p.kw)).map(x => x.v);
  S.lifeF = life.filter(x => !isMale(x.p.kw)).map(x => x.v);
  S.buckets = Array.from({ length: 10 }, (_, i) => ({ l: i * 10 + "", v: life.filter(x => x.v >= i * 10 && x.v < i * 10 + 10).length }));
  const byAge = life.slice().sort((a, b) => b.v - a.v);
  S.oldest = byAge.slice(0, 5); S.youngest = byAge.slice(-3).reverse();
  /* hoeveel voorouders tegelijk leefden, per jaar (alleen met bekend geboorte- en sterfjaar) */
  const span = life.map(x => [yr(x.p.b), yr(x.p.d)]), y0 = Math.min(...span.map(x => x[0])), y1 = Math.max(...span.map(x => x[1]));
  S.alive = []; for (let y = y0; y <= y1; y++) S.alive.push({ y, v: span.filter(([b, d]) => b <= y && y <= d).length });
  S.alivePeak = S.alive.reduce((m, x) => x.v > m.v ? x : m, { v: 0 }); S.aliveN = life.length;
  /* paren */
  const couples = [];
  for (const m of A) {
    if (m.kw < 4 || m.kw % 2) continue;
    const f = person(m.kw + 1); if (!f || f.living) continue;
    const md = (m.m && m.m.d) || (f.m && f.m.d) || null, mp = (m.m && m.m.p) || (f.m && f.m.p) || null;
    couples.push({ m, f, md, mp, kids: Math.max(kidCount(m.kids), kidCount(f.kids)) });
  }
  S.couples = couples;
  const dated = couples.filter(c => fullDate(c.md));
  S.months = MONTHS.map((n, i) => ({ l: ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"][i], v: dated.filter(c => +c.md.slice(5, 7) === i + 1).length }));
  const greg = dated.filter(c => yr(c.md) >= 1701);
  const dowOf = cs => [1, 2, 3, 4, 5, 6, 0].map(d => ({ l: DOW[d].slice(0, 2), full: DOW[d], v: cs.filter(c => fullDate(c.md).getUTCDay() === d).length }));
  S.dows = dowOf(greg);
  /* vóór 1811 trouwboeken van kerk of gerecht, vanaf 1811 de burgerlijke stand */
  S.gregPre = greg.filter(c => yr(c.md) < 1811); S.gregPost = greg.filter(c => yr(c.md) >= 1811);
  S.dowsPre = dowOf(S.gregPre); S.dowsPost = dowOf(S.gregPost);
  const sunPost = {}; S.gregPost.filter(c => fullDate(c.md).getUTCDay() === 0 && c.mp).forEach(c => { sunPost[c.mp] = (sunPost[c.mp] || 0) + 1; });
  S.sunPostTop = Object.entries(sunPost).sort((a, b) => b[1] - a[1])[0] || null;
  S.nDated = dated.length; S.nGreg = greg.length;
  const ageM = [], ageF = [];
  couples.forEach(c => { if (!c.md) return; const a = yearsBetween(c.m.b, c.md), b = yearsBetween(c.f.b, c.md); if (a !== null && a > 14 && a < 80) ageM.push({ c, v: a }); if (b !== null && b > 14 && b < 70) ageF.push({ c, v: b }); });
  S.ageM = ageM; S.ageF = ageF;
  S.youngBride = ageF.slice().sort((a, b) => a.v - b.v)[0];
  S.oldGroom = ageM.slice().sort((a, b) => b.v - a.v)[0];
  const gaps = couples.map(c => { const g = yearsBetween(c.m.b, c.f.b); return g === null ? null : { c, v: g }; }).filter(Boolean);
  S.gaps = gaps; S.wifeOlder = gaps.filter(g => g.v < -0.5);
  S.bigGap = gaps.slice().sort((a, b) => Math.abs(b.v) - Math.abs(a.v))[0];
  S.bigWifeOlder = S.wifeOlder.slice().sort((a, b) => a.v - b.v)[0];
  const lens = couples.map(c => { if (!c.md || !c.m.d || !c.f.d) return null; const end = (fullDate(c.m.d) && fullDate(c.f.d)) ? (fullDate(c.m.d) < fullDate(c.f.d) ? c.m.d : c.f.d) : (yr(c.m.d) < yr(c.f.d) ? c.m.d : c.f.d); const v = yearsBetween(c.md, end); return v !== null && v >= 0 ? { c, v } : null; }).filter(Boolean);
  S.longMarriage = lens.sort((a, b) => b.v - a.v).slice(0, 3);
  S.avgMarriage = meanOf(lens.map(x => x.v));
  const wid = couples.map(c => { const v = yearsBetween(c.m.d, c.f.d); return v === null ? null : { c, v }; }).filter(Boolean);
  S.widows = wid.filter(x => x.v > 0.1).length; S.widowers = wid.filter(x => x.v < -0.1).length; S.nWid = wid.length;
  /* wie na de dood van de partner hertrouwde, was niet "alleen"; zo'n tweede huwelijk staat in de notities */
  const remarried = p => /hertrouw/i.test([p.m && p.m.note, p.stNote, ...(p.notes || []).map(n => noteObj(n).t)].join(" "));
  S.longWidow = wid.filter(x => !remarried(x.v > 0 ? x.c.f : x.c.m)).sort((a, b) => Math.abs(b.v) - Math.abs(a.v))[0];
  /* waar vonden ze hun partner: afstand tussen de geboorteplaatsen van man en vrouw */
  S.partnerKm = couples.filter(c => PLACES[c.m.bp] && PLACES[c.f.bp] && !isGemeente(c.m.bp) && !isGemeente(c.f.bp)).map(c => ({ c, v: kmBetween(c.m.bp, c.f.bp), same: c.m.bp === c.f.bp }));
  S.bigFamily = couples.filter(c => c.kids).sort((a, b) => b.kids - a.kids).slice(0, 3);
  /* generaties */
  const gf = [], gm = [];
  for (const c of all) {
    if (c.living || !c.b) continue;
    const f = person(c.kw * 2), m = person(c.kw * 2 + 1);
    if (f && !f.living) { const v = yearsBetween(f.b, c.b); if (v !== null && v > 14 && v < 75) gf.push({ p: f, c, v }); }
    if (m && !m.living) { const v = yearsBetween(m.b, c.b); if (v !== null && v > 12 && v < 52) gm.push({ p: m, c, v }); }
  }
  S.gf = gf; S.gm = gm;
  S.genAvg = meanOf([...gf, ...gm].map(x => x.v));
  S.youngMother = gm.slice().sort((a, b) => a.v - b.v)[0];
  S.oldFather = gf.slice().sort((a, b) => b.v - a.v)[0];
  /* namen */
  const nm = {}, nf = {}, sur = {};
  A.forEach(p => { const sn = splitName(p.n), g = sn.given[0]; if (g && g.length > 1) (isMale(p.kw) ? nm : nf)[g] = ((isMale(p.kw) ? nm : nf)[g] || 0) + 1; if (sn.sur) sur[sn.sur] = (sur[sn.sur] || 0) + 1; });
  const top = o => Object.entries(o).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  S.namesM = top(nm); S.namesF = top(nf); S.nGivenM = Object.keys(nm).length; S.nGivenF = Object.keys(nf).length;
  S.surnames = Object.keys(sur).length; S.topSur = top(sur).slice(0, 6);
  /* beroepen */
  S.occ = OCC_CATS.map(([l, re]) => ({ l, v: A.filter(p => hasOcc(p) && re.test(p.occ)).length })).filter(x => x.v).sort((a, b) => b.v - a.v);
  S.nOcc = A.filter(hasOcc).length;
  S.occ.forEach(x => { x.txt = pctN(x.v, S.nOcc); });
  /* geloof: "vermoedelijk" telt apart, als lichter deel van dezelfde balk */
  const rel = {}; let nRel = 0;
  A.forEach(p => { const r = String(p.rel || ""), m = /^(vermoedelijk\s+)?(.+)$/i.exec(r); if (!r || /onbekend/i.test(r)) return; nRel++; const k = m[2].charAt(0).toUpperCase() + m[2].slice(1); rel[k] = rel[k] || { l: k, sure: 0, prob: 0 }; rel[k][m[1] ? "prob" : "sure"]++; });
  S.rel = Object.values(rel).sort((a, b) => b.sure + b.prob - a.sure - a.prob); S.nRel = nRel;
  /* plaatsen */
  S.nPlaces = new Set(EVENTS.map(e => e.p)).size; /* zelfde telling als de kaart */
  const ppl = {}; A.forEach(p => lifeEvents(p).forEach(e => { if (e.p && PLACES[e.p] && !isGemeente(e.p)) (ppl[e.p] = ppl[e.p] || new Set()).add(p.kw); }));
  S.topPlaces = Object.entries(ppl).map(([k, s]) => [k, s.size]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const mv = A.filter(p => PLACES[p.bp] && PLACES[p.dp] && !isGemeente(p.bp) && !isGemeente(p.dp)).map(p => ({ p, v: kmBetween(p.bp, p.dp) }));
  S.moves = mv;
  S.far = mv.slice().sort((a, b) => b.v - a.v).slice(0, 3);
  S.within20 = mv.filter(x => x.v <= 20).length;
  S.dist = [["zelfde plaats", 0, 0.5], ["tot 10 km", 0.5, 10], ["10–20 km", 10, 20], ["20–50 km", 20, 50], ["50 km of meer", 50, 1e9]]
    .map(([l, a, b]) => ({ l, v: mv.filter(x => (l === "zelfde plaats" ? mapKey(x.p.bp) === mapKey(x.p.dp) : mapKey(x.p.bp) !== mapKey(x.p.dp) && x.v >= a && x.v < b)).length }));
  /* bronnen: dezelfde akte staat vaak bij man en vrouw; uniek telt elke bron één keer */
  const st = {}; let srcN = 0; const types = {}, uniq = new Set();
  A.forEach(p => { st[p.st] = (st[p.st] || 0) + 1; (p.src || []).forEach(s => { srcN++; uniq.add(s[1] || s[0]); const t = srcType(s[1], s[0]); types[t] = (types[t] || 0) + 1; }); });
  S.st = st; S.srcN = srcN; S.srcU = uniq.size; S.srcTypes = SRC_ORDER.filter(t => types[t]).map(t => ({ l: t, v: types[t] }));
  /* hoe compleet is elke generatie: bezette vakken (ook dubbele door kwartierverlies) van de 2^(g-1) mogelijke */
  const gMax = Math.max(...A.map(p => gen(p.kw))), g0 = Math.min(...A.map(p => gen(p.kw)));
  S.gens = [];
  for (let g = g0; g <= gMax; g++) {
    const slots = 2 ** (g - 1), c = { A: 0, B: 0, C: 0, D: 0, L: 0 };
    for (let kw = slots; kw < 2 * slots; kw++) { const p = person(kw); if (p) c[p.living ? "L" : p.st]++; }
    const filled = c.A + c.B + c.C + c.D + c.L;
    S.gens.push({ g, slots, filled, c, uniq: A.filter(p => gen(p.kw) === g).length });
  }
  /* fullTo: tot en met deze generatie zijn alle vakken bezet; aTo: tot en met deze generatie staat iedereen op akten (A) */
  S.fullTo = null; S.aTo = null;
  for (const x of S.gens) { if (x.filled < x.slots) break; S.fullTo = x.g; }
  for (const x of S.gens) { if (x.c.A < x.slots) break; S.aTo = x.g; }
  S.implex = PEOPLE.filter(p => p.alias).length;
  S.implexTop = PEOPLE.filter(p => p.alias && !ALIAS_OF[p.kw >> 1]).length; /* waar een lijn voor het eerst samenkomt */
  S.maxGen = Math.max(...A.map(p => gen(p.kw)));
  S.oldestYearAB = Math.min(...A.filter(p => p.st === "A" || p.st === "B").flatMap(p => [yr(p.b), yr(p.d), ...(p.res || []).map(r => r.y)]).filter(Boolean));
  return S;
}
function vbars(data, o = {}) {
  const n = data.length, bw = o.bw || 34, gap = o.gap || 12, W = n * (bw + gap) + gap, H = 150, top = 22, base = H - 26;
  const max = o.max || Math.max(1, ...data.map(d => d.v));
  const hi = Math.max(...data.map(d => d.v));
  let s = `<svg class="vbars" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || "")}">`;
  s += `<line x1="${gap / 2}" x2="${W - gap / 2}" y1="${base}" y2="${base}" stroke="var(--rule)"/>`;
  data.forEach((d, i) => {
    const x = gap + i * (bw + gap), h = (base - top) * d.v / max, y = base - h;
    s += `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h, d.v ? 1 : 0)}" rx="3" fill="${o.color || "var(--accent)"}" fill-opacity="${d.v === hi ? 1 : 0.42}"><title>${esc(d.tip || (d.full || d.l) + ": " + d.v)}</title></rect>`;
    s += `<text x="${x + bw / 2}" y="${y - 6}" text-anchor="middle" font-size="12" fill="var(--ink)" font-family="var(--mono)">${d.lab ?? d.v}</text>`;
    s += `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="12" fill="var(--muted)" font-family="var(--mono)">${esc(d.l)}</text>`;
  });
  return s + `</svg>`;
}
function hbars(rows, o = {}) {
  const max = Math.max(1, ...rows.map(r => r.v));
  return `<div class="hbars${o.wide ? " wide" : ""}${o.cls ? " " + o.cls : ""}">${rows.map(r => `<div class="hb"><span class="hl">${r.html || esc(r.l)}</span><span class="track"><span style="width:${(r.v / max * 100).toFixed(1)}%;background:${r.c || o.color || "var(--accent)"}"></span></span><span class="mono hv">${r.txt ?? r.v}</span></div>`).join("")}</div>`;
}
/* Leeftijd bij overlijden tegen geboortejaar: één stip per voorouder. Mannen rond, vrouwen ruit; open = jaartal geschat (ca.). */
function lifeScatter(life) {
  const W = 680, H = 250, L = 34, R = 22, T = 10, B = 26;
  const ys = life.map(x => yr(x.p.b)), y0 = Math.floor(Math.min(...ys) / 50) * 50, y1 = Math.ceil((Math.max(...ys) + 1) / 50) * 50;
  const X = y => L + (y - y0) / (y1 - y0) * (W - L - R), Y = a => T + (1 - a / 100) * (H - T - B);
  let s = `<svg class="scatter" viewBox="0 0 ${W} ${H}" role="img" aria-label="Leeftijd bij overlijden tegen geboortejaar, één stip per voorouder">`;
  [20, 40, 60, 80, 100].forEach(a => { s += `<line x1="${L}" x2="${W - R}" y1="${Y(a)}" y2="${Y(a)}" stroke="var(--rule)" stroke-dasharray="${a === 100 ? "" : "2 4"}"/><text x="${L - 6}" y="${Y(a) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">${a}</text>`; });
  s += `<line x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--rule)"/>`;
  for (let y = y0; y <= y1; y += 50) s += `<text x="${X(y)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">${y}</text>`;
  const tr = []; for (let c = Math.floor(y0 / 25) * 25; c < y1; c += 25) { const g = life.filter(x => { const y = yr(x.p.b); return y >= c && y < c + 25; }); if (g.length >= 5) tr.push({ c, m: meanOf(g.map(x => x.v)), n: g.length }); }
  life.slice().sort((a, b) => a.exact - b.exact).forEach(x => {
    const cx = X(yr(x.p.b)).toFixed(1), cy = Y(Math.min(x.v, 100)).toFixed(1), m = isMale(x.p.kw), c = m ? "var(--l8)" : "var(--l13)", est = !x.exact && (isApprox(x.p.b) || isApprox(x.p.d));
    const mark = m ? `<circle cx="${cx}" cy="${cy}" r="4"` : `<rect x="${cx - 4}" y="${cy - 4}" width="8" height="8" transform="rotate(45 ${cx} ${cy})"`;
    s += `<g class="dot" data-open="${x.p.kw}"><title>${esc(`${x.p.n} · ${lifeYears(x.p)} · ${Math.floor(x.v)} jaar${est ? " (geschat)" : ""}`)}</title><circle cx="${cx}" cy="${cy}" r="9" fill="transparent"/>${mark} fill="${est ? "var(--surface)" : c}" stroke="${est ? c : "var(--surface)"}" stroke-width="${est ? 1.6 : 1}"/></g>`;
  });
  if (tr.length > 1) {
    s += `<path d="${tr.map((t, i) => `${i ? "L" : "M"}${X(t.c + 12.5).toFixed(1)} ${Y(t.m).toFixed(1)}`).join("")}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" pointer-events="none"/>`;
    tr.forEach(t => { s += `<g><title>${t.c}–${t.c + 24} geboren: gemiddeld ${r0(t.m)} jaar (${t.n} personen)</title><circle cx="${X(t.c + 12.5).toFixed(1)}" cy="${Y(t.m).toFixed(1)}" r="4" fill="var(--ink)" stroke="var(--surface)" stroke-width="2"/></g>`; });
  }
  return s + `</svg>`;
}
/* Aantal voorouders in leven per jaar, als vlak met de piek gemarkeerd */
function aliveChart(al, pk) {
  const i0 = al.findIndex(a => a.v >= 3); al = al.slice(Math.max(0, i0));
  const W = 680, H = 180, L = 34, R = 22, T = 22, B = 26, y0 = Math.floor(al[0].y / 50) * 50, y1 = Math.ceil((al[al.length - 1].y + 1) / 50) * 50;
  const top = Math.ceil(pk.v / 25) * 25, X = y => L + (y - y0) / (y1 - y0) * (W - L - R), Y = v => T + (1 - v / top) * (H - T - B);
  const line = al.map((a, i) => `${i ? "L" : "M"}${X(a.y).toFixed(1)} ${Y(a.v).toFixed(1)}`).join("");
  let s = `<svg class="scatter" viewBox="0 0 ${W} ${H}" role="img" aria-label="Aantal voorouders in leven per jaar; het meest in ${pk.y}: ${pk.v}">`;
  for (let v = 25; v <= top; v += 25) s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--rule)" stroke-dasharray="2 4"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">${v}</text>`;
  for (let y = y0; y <= Math.min(y1, new Date().getFullYear()); y += 50) s += `<text x="${X(y)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">${y}</text>`;
  s += `<path d="${line}L${X(al[al.length - 1].y).toFixed(1)} ${Y(0)}L${X(al[0].y).toFixed(1)} ${Y(0)}Z" fill="var(--accent)" fill-opacity=".14"/><path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--rule)"/>`;
  s += `<circle cx="${X(pk.y)}" cy="${Y(pk.v)}" r="4.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/><text x="${X(pk.y)}" y="${Y(pk.v) - 9}" text-anchor="middle" font-size="12" fill="var(--ink)" font-family="var(--mono)">${pk.y}: ${pk.v}</text>`;
  /* per decennium een onzichtbaar vlak met de waarde, voor wie de muis erover houdt */
  al.filter(a => a.y % 10 === 0).forEach(a => { s += `<rect x="${X(a.y - 5)}" y="${T}" width="${X(a.y + 5) - X(a.y - 5)}" height="${H - T - B}" fill="transparent"><title>${a.y}: ${a.v} voorouders in leven</title></rect>`; });
  return s + `</svg>`;
}
/* Per generatie: hoeveel van de 2^(g-1) vakken bezet zijn, verdeeld naar bewijsstatus. Lege ruimte = nog niet gevonden. */
function genCompleteness(gens) {
  return `<div class="cgens">${gens.map(x => {
    /* stukjes op hun echte breedte; is de hele balk heel smal, dan één streepje in de kleur van de meeste (details in de tooltip) */
    const pct = x.filled / x.slots * 100, cls = k => k === "L" ? "lv" : "st-" + k;
    const top = ["A", "B", "C", "D", "L"].reduce((m, k) => x.c[k] > x.c[m] ? k : m, "A");
    const seg = k => pct < 4 ? (k === top && x.filled ? `<i class="${cls(k)}" style="width:max(3px,${pct.toFixed(2)}%)"></i>` : "") : x.c[k] ? `<i class="${cls(k)}" style="width:${(x.c[k] / x.slots * 100).toFixed(3)}%"></i>` : "";
    return `<div class="cgen" title="Generatie ${ROMAN[x.g]}: ${x.filled} van ${x.slots} vakken bezet (${["A", "B", "C", "D"].filter(k => x.c[k]).map(k => k + " " + x.c[k]).join(", ")}${x.c.L ? `, levend ${x.c.L}` : ""})${x.uniq < x.filled - x.c.L ? `; ${x.filled - x.c.L - x.uniq} vakken dubbel door kwartierverlies` : ""}"><span class="mono">${ROMAN[x.g]}</span><span class="sbar">${["A", "B", "C", "D", "L"].map(seg).join("")}</span><span class="mono small">${nl(x.filled)} / ${nl(x.slots)}</span><span class="mono small pc">${pct >= 99.95 ? "100" : pct >= 10 ? Math.round(pct) : pct >= 0.05 ? r1(pct) : "<0,1"}%</span></div>`;
  }).join("")}</div><p class="legend" style="margin-top:10px">${["A", "B", "C", "D"].filter(k => gens.some(x => x.c[k])).map(k => `<span><i class="lg st-${k}"></i>${k} · ${esc(STATUS[k].label.toLowerCase())}</span>`).join("")}${gens.some(x => x.c.L) ? `<span><i class="lg lv"></i>levend</span>` : ""}<span><i class="lg lg-none"></i>nog niet gevonden</span></p>`;
}
/* "Op deze dag": standaard vandaag; met de knoppen en keuzelijsten kies je een andere dag (ook 29 februari).
   De keuze is per bezoek en verandert de adresbalk niet. */
let otdSel = null; /* null = vandaag, anders [maand, dag] */
const OTD_DIM = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function onThisDay() {
  const now = new Date(), tm = now.getMonth() + 1, td = now.getDate();
  const [m, d] = otdSel || [tm, td], isToday = m === tm && d === td;
  const md = String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  const ev = [];
  ancestors.forEach(p => {
    if (fullDate(p.b)) ev.push({ p, d: p.b, t: p.bapt ? "geboren of gedoopt" : "geboren" });
    if (fullDate(p.d)) ev.push({ p, d: p.d, t: "overleden" });
    if (p.m && fullDate(p.m.d) && (p.kw % 2 === 0 || !(person(p.kw - 1) && person(p.kw - 1).m && person(p.kw - 1).m.d))) ev.push({ p, d: p.m.d, t: "trouwde met " + p.m.w });
  });
  /* dagnummer in een schrikkeljaar, zodat 29 februari een eigen dag is */
  const dayNo = s => { const [mm, dd] = s.split("-").map(Number); return Math.round((Date.UTC(2000, mm - 1, dd) - Date.UTC(2000, 0, 1)) / 864e5); };
  const sel = dayNo(md);
  ev.forEach(e => { e.ahead = (dayNo(e.d.slice(5)) - sel + 366) % 366; });
  const ons = ev.filter(e => e.ahead === 0).sort((a, b) => yr(a.d) - yr(b.d));
  const soon = ev.filter(e => e.ahead > 0 && e.ahead <= 31).sort((a, b) => a.ahead - b.ahead || yr(a.d) - yr(b.d)).slice(0, 6);
  const li = e => `<li><span class="y">${esc(fmt(e.d).replace(/ \d{4}$/, ""))}</span><span><b class="mono">${yr(e.d)}</b> · ${pb(e.p)} ${esc(e.t)}</span></li>`;
  const label = `${d} ${MONTHS[m - 1]}`, wanneer = isToday ? "Vandaag" : `Op ${label}`;
  const kop = ons.length ? `${wanneer}: ${ons.length === 1 ? "één gebeurtenis" : ons.length + " gebeurtenissen"} in de akten` : `${wanneer} ${isToday ? "gebeurde er niets" : "staat niets"} in de akten`;
  return `<div class="box otd" id="otdBox"><div class="otd-nav"><span class="eyebrow">${isToday ? "Op deze dag" : "Gekozen dag"}</span>
      <span class="otd-pick"><button type="button" class="otd-step" data-otd="-1" aria-label="Vorige dag">‹</button>
      <select data-otd-m aria-label="Maand">${MONTHS.map((n, i) => `<option value="${i + 1}"${i + 1 === m ? " selected" : ""}>${n}</option>`).join("")}</select>
      <select data-otd-d aria-label="Dag">${Array.from({ length: OTD_DIM[m - 1] }, (_, i) => `<option value="${i + 1}"${i + 1 === d ? " selected" : ""}>${i + 1}</option>`).join("")}</select>
      <button type="button" class="otd-step" data-otd="1" aria-label="Volgende dag">›</button>${isToday ? "" : `<button type="button" class="otd-today" data-otd="0">Vandaag</button>`}</span></div>
    <h3>${esc(kop)}</h3>${ons.length ? `<ul class="restl">${ons.map(li).join("")}</ul>` : ""}
    ${soon.length ? `<p class="small" style="margin:${ons.length ? "12px" : "0"} 0 6px">${ons.length ? "De weken erna:" : "Wel in de weken erna:"}</p><ul class="restl">${soon.map(li).join("")}</ul>` : ""}</div>`;
}
/* de datumkeuze werkt op het blok zelf: alleen het blok wordt opnieuw getekend, de focus blijft op dezelfde knop */
function otdRedraw(focusSel) { const box = $("#otdBox"); if (!box) return; box.outerHTML = onThisDay(); const f = focusSel && $("#otdBox " + focusSel); if (f) f.focus(); }
document.addEventListener("click", e => {
  const b = e.target.closest("#otdBox [data-otd]"); if (!b) return;
  const st = +b.dataset.otd;
  if (!st) otdSel = null;
  else { const now = new Date(), [m, d] = otdSel || [now.getMonth() + 1, now.getDate()], t = new Date(Date.UTC(2000, m - 1, d + st)); otdSel = [t.getUTCMonth() + 1, t.getUTCDate()]; }
  otdRedraw(st ? `[data-otd="${st}"]` : "[data-otd-m]");
});
document.addEventListener("change", e => {
  const s = e.target.closest("#otdBox select"); if (!s) return;
  const box = $("#otdBox"), m = +$("[data-otd-m]", box).value, d = Math.min(+$("[data-otd-d]", box).value, OTD_DIM[m - 1]);
  otdSel = [m, d]; otdRedraw(s.matches("[data-otd-m]") ? "[data-otd-m]" : "[data-otd-d]");
});
function renderCijfers() {
  const S = STATS || (STATS = computeStats());
  const host = $("#v-cijfers");
  const mAvg = meanOf(S.lifeM), fAvg = meanOf(S.lifeF);
  const topMonth = S.months.slice().sort((a, b) => b.v - a.v)[0], monthIdx = S.months.indexOf(topMonth);
  const genPerCent = S.genAvg ? 100 / S.genAvg : null;
  const ageMAvg = meanOf(S.ageM.map(x => x.v)), ageFAvg = meanOf(S.ageF.map(x => x.v));
  const sun = cs => cs.filter(c => fullDate(c.md).getUTCDay() === 0).length;
  host.innerHTML = `
    <div class="eyebrow">In getallen</div>
    <h1 class="page-title">De familie in getallen</h1>
    <p class="lede">Alleen over de overleden voorouders: wie nog leeft, telt niet mee.</p>
    <div style="margin-top:22px">
      <div class="box"><span class="eyebrow">Maatstaf</span><h3>Waarom voorouders oud lijken te worden</h3><p style="margin:0;font-size:14px;color:var(--muted)">Een voorouder is per definitie volwassen geworden en heeft een kind gekregen. Wie als kind overleed, komt in een kwartierstaat niet voor. De gemiddelde levensduur hieronder ligt daardoor veel hoger dan de levensverwachting bij de geboorte in die tijd, die in het midden van de negentiende eeuw door de hoge kindersterfte nog maar zo'n 36 tot 38 jaar was. Vergelijk dus met volwassenen, niet met pasgeborenen.</p></div>
    </div>

    <div class="section-head" id="c-leven"><h2>Leven en sterven</h2><p>${S.life.length} voorouders met een geboorte- en sterfjaar; ${S.life.filter(x => x.exact).length} daarvan tot op de dag.</p></div>
    <div class="cols">
      <div class="box"><h3>Gemiddelde leeftijd</h3>
        <div class="duo"><div><b class="big">${r0(mAvg)}</b><span>jaar · ${S.lifeM.length} mannen</span><small>mediaan ${r0(medianOf(S.lifeM))}</small></div><div><b class="big">${r0(fAvg)}</b><span>jaar · ${S.lifeF.length} vrouwen</span><small>mediaan ${r0(medianOf(S.lifeF))}</small></div></div>
        <h5 class="eyebrow" style="margin:18px 0 0">Leeftijd bij overlijden</h5>${vbars(S.buckets.slice(Math.max(0, S.buckets.findIndex(b => b.v))).map(b => ({ l: b.l, full: b.l + "–" + (+b.l + 9) + " jaar", v: b.v })), { bw: 26, gap: 9, label: "Aantal voorouders per leeftijdsgroep bij overlijden" })}
        <p class="small" style="margin:6px 0 0">Aantal voorouders per tiental jaren.</p>
      </div>
      <div class="box">
        <h3>Het oudst geworden</h3><ol class="rank">${S.oldest.map(x => `<li>${pb(x.p)} <span class="mono">${Math.floor(x.v)}${x.exact ? "" : " (ca.)"}</span></li>`).join("")}</ol>
        <h3 style="margin-top:18px">Het jongst overleden</h3><ol class="rank">${S.youngest.map(x => `<li>${pb(x.p)} <span class="mono">${Math.floor(x.v)}${x.exact ? "" : " (ca.)"}</span></li>`).join("")}</ol>
      </div>
    </div>
    ${S.life.length >= 20 ? `<div class="box" style="margin-top:16px"><h3>Hoe oud werden ze, door de tijd?</h3>
      ${lifeScatter(S.life)}
      <p class="legend" style="margin-top:6px"><span>Elke stip: een voorouder, naar geboortejaar en leeftijd bij overlijden</span><span><svg class="lgm" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="var(--l8)"/></svg>man</span><span><svg class="lgm" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" fill="var(--l13)"/></svg>vrouw</span><span><svg class="lgm" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4" fill="none" stroke="var(--muted)" stroke-width="1.6"/></svg>open: geboorte- of sterfjaar geschat (ca.)</span><span><svg class="lgm" viewBox="0 0 16 12" aria-hidden="true"><path d="M1 6H15" stroke="var(--ink)" stroke-width="2"/></svg>gemiddelde per 25 geboortejaren</span></p></div>` : ""}
    ${S.alivePeak && S.alivePeak.v >= 10 ? `<div class="box" style="margin-top:16px"><h3>Tegelijk in leven</h3>
      <p class="small" style="margin:0 0 6px">In ${S.alivePeak.y} leefden er minstens ${S.alivePeak.v} voorouders tegelijk, allemaal nodig voor ${esc(T.rootFull)}. Het echte aantal lag hoger: van veel oudere voorouders zijn de jaartallen (nog) niet bekend.</p>
      ${aliveChart(S.alive, S.alivePeak)}</div>` : ""}

    <div class="section-head" id="c-trouwen"><h2>Trouwen</h2><p>${S.couples.length} paren in de stamboom, ${S.nDated} met een trouwdatum.</p></div>
    <div class="cols">
      <div class="box"><h3>Trouwmaand</h3>${vbars(S.months.map((m, i) => ({ l: m.l, full: MONTHS[i], v: m.v })), { bw: 24, gap: 8, label: "Huwelijken per maand" })}
        ${monthIdx === 4 ? `<p class="small" style="margin:4px 0 0">${topMonth.v} van de ${S.nDated} huwelijken (${pct(topMonth.v, S.nDated)}) vielen in mei. In Friesland begon het boerenjaar in mei: dan werden pachten en dienstbetrekkingen vernieuwd.</p>` : ""}
        <h3 style="margin-top:18px">Dag van de week</h3>
        ${S.gregPre.length >= 10 && S.gregPost.length >= 10 ? (() => { const sh = (ds, n) => ds.map(d => Object.assign({}, d, { v: d.v / n * 100, lab: pct(d.v, n), tip: `${d.full}: ${d.v} van de ${n}` })); return `<div class="dowpair">
          <div><h5 class="eyebrow" style="margin:0">1701–1810 · kerk of gerecht · ${S.gregPre.length}</h5>${vbars(sh(S.dowsPre, S.gregPre.length), { bw: 30, gap: 10, max: 100, label: "Huwelijken per weekdag in procenten, 1701 tot 1811" })}</div>
          <div><h5 class="eyebrow" style="margin:0">vanaf 1811 · burgerlijke stand · ${S.gregPost.length}</h5>${vbars(sh(S.dowsPost, S.gregPost.length), { bw: 30, gap: 10, max: 100, label: "Huwelijken per weekdag in procenten, vanaf 1811" })}</div></div>`; })() : vbars(S.dows, { bw: 34, gap: 12, label: "Huwelijken per weekdag" })}
        <p class="small" style="margin:6px 0 0">Weekdagen vanaf 1701, toen Friesland de gregoriaanse kalender invoerde (${S.nGreg} huwelijken)${S.gregPre.length >= 10 && S.gregPost.length >= 10 ? ", in procenten per periode, zodat de twee te vergelijken zijn" : ""}. Vóór 1811 komt de datum uit de trouwboeken van kerk of gerecht; daarin staat soms de dag van de afkondiging, en die viel op zondag. Vanaf 1811 is het de dag van het huwelijk in de akte van de burgerlijke stand.${S.sunPostTop && S.sunPostTop[1] >= 5 ? ` Ook toen trouwden nog ${sun(S.gregPost)} paren op zondag, ${S.sunPostTop[1]} daarvan in ${esc(placeName(S.sunPostTop[0]))}.` : ""}</p></div>
      <div class="box"><h3>Bruid en bruidegom</h3>
        <div class="duo"><div><b class="big">${r1(ageMAvg)}</b><span>jaar · bruidegom</span><small>${S.ageM.length} huwelijken</small></div><div><b class="big">${r1(ageFAvg)}</b><span>jaar · bruid</span><small>${S.ageF.length} huwelijken</small></div></div>
        <ul class="facts">
          ${S.youngBride ? `<li>Jongste bruid: ${pb(S.youngBride.c.f)}, ${Math.floor(S.youngBride.v)} jaar${ca(S.youngBride.c.f.b, S.youngBride.c.md)}${yr(S.youngBride.c.md) ? " (" + yr(S.youngBride.c.md) + ")" : ""}.</li>` : ""}
          ${S.oldGroom ? `<li>Oudste bruidegom: ${pb(S.oldGroom.c.m)}, ${Math.floor(S.oldGroom.v)} jaar${ca(S.oldGroom.c.m.b, S.oldGroom.c.md)}${yr(S.oldGroom.c.md) ? " (" + yr(S.oldGroom.c.md) + ")" : ""}.</li>` : ""}
          <li>Bij ${S.wifeOlder.length} van de ${S.gaps.length} paren met twee geboortejaren was de vrouw ouder dan de man (${Math.round(S.wifeOlder.length / S.gaps.length * 100)}%).${S.bigWifeOlder ? ` Het grootste verschil: ${pb(S.bigWifeOlder.c.f)} was ${Math.round(-S.bigWifeOlder.v)} jaar${ca(S.bigWifeOlder.c.m.b, S.bigWifeOlder.c.f.b)} ouder dan ${pb(S.bigWifeOlder.c.m)}.` : ""}</li>
          ${S.partnerKm.length >= 15 ? (() => { const pk = S.partnerKm, n = pk.length, w10 = pk.filter(x => x.v <= 10).length, far = pk.slice().sort((a, b) => b.v - a.v)[0]; return `<li>Partners kwamen meestal uit de buurt: bij ${pct(w10, n)} van de ${n} paren met twee bekende geboorteplaatsen lagen die binnen 10 km van elkaar (mediaan ${r0(medianOf(pk.map(x => x.v)))} km)${pk.some(x => x.same) ? `; ${pk.filter(x => x.same).length} keer was het hetzelfde dorp` : ""}. Het verst uit elkaar: ${pb(far.c.m)} uit ${esc(placeName(far.c.m.bp))} en ${pb(far.c.f)} uit ${esc(placeName(far.c.f.bp))}, ${r0(far.v)} km.</li>`; })() : ""}
          ${S.bigGap && S.bigGap.v > 0 ? `<li>Grootste leeftijdsverschil: ${pb(S.bigGap.c.m)} was ${Math.round(S.bigGap.v)} jaar${ca(S.bigGap.c.m.b, S.bigGap.c.f.b)} ouder dan ${pb(S.bigGap.c.f)}.</li>` : ""}
        </ul>
        <h3 style="margin-top:18px">Samen en alleen</h3>
        <ul class="facts">
          ${S.longMarriage.length ? `<li>Gemiddeld duurde een huwelijk ${r0(S.avgMarriage)} jaar, tot de dood van de eerste partner. Het langst: ${S.longMarriage.map(x => `${pb(x.c.m)} en ${pb(x.c.f)}, ${Math.floor(x.v)} jaar`).join("; ")}.</li>` : ""}
          ${S.bigFamily[0] ? `<li>Het grootste bekende gezin: ${pb(S.bigFamily[0].m)} en ${pb(S.bigFamily[0].f)}, met ${S.bigFamily[0].kids} kinderen${S.bigFamily[1] ? `; daarna ${pb(S.bigFamily[1].m)} en ${pb(S.bigFamily[1].f)}, met ${S.bigFamily[1].kids}` : ""}. Van veel paren zijn nog niet alle kinderen bekend.</li>` : ""}
          <li>Van de ${S.nWid} paren met twee sterfdata overleefde de vrouw haar man ${S.widows} keer (${pct(S.widows, S.nWid)}), en de man zijn vrouw ${S.widowers} keer (${pct(S.widowers, S.nWid)}).</li>
          ${S.longWidow ? `<li>Het langst alleen verder, zonder nieuw huwelijk: ${pb(S.longWidow.v > 0 ? S.longWidow.c.f : S.longWidow.c.m)}, ${Math.round(Math.abs(S.longWidow.v))} jaar na ${S.longWidow.v > 0 ? "haar man" : "zijn vrouw"}${ca(S.longWidow.c.m.d, S.longWidow.c.f.d)}.</li>` : ""}
        </ul></div>
    </div>

    <div class="section-head" id="c-generaties"><h2>Generaties</h2><p>Hoe oud waren de ouders bij de geboorte van het kind in de lijn?</p></div>
    <div class="cols">
      <div class="box"><div class="duo"><div><b class="big">${r1(meanOf(S.gf.map(x => x.v)))}</b><span>jaar · vaders</span><small>${S.gf.length} keer gemeten</small></div><div><b class="big">${r1(meanOf(S.gm.map(x => x.v)))}</b><span>jaar · moeders</span><small>${S.gm.length} keer gemeten</small></div></div>
        <p style="margin:14px 0 0;font-size:14px;color:var(--muted)">Een generatie duurde gemiddeld ${r1(S.genAvg)} jaar, ongeveer ${r1(genPerCent)} generaties per eeuw. ${S.genAvg > 30 ? "Dat is langer dan de vuistregel van 25 tot 30 jaar: het kind in de lijn is lang niet altijd het oudste kind." : ""}</p></div>
      <div class="box"><ul class="facts">
        ${S.youngMother ? `<li>Jongste moeder: ${pb(S.youngMother.p)}, ${Math.floor(S.youngMother.v)} jaar${ca(S.youngMother.p.b, S.youngMother.c.b)} bij de geboorte van ${pb(S.youngMother.c)}.</li>` : ""}
        ${S.oldFather ? `<li>Oudste vader: ${pb(S.oldFather.p)}, ${Math.floor(S.oldFather.v)} jaar${ca(S.oldFather.p.b, S.oldFather.c.b)} bij de geboorte van ${pb(S.oldFather.c)}.</li>` : ""}
        <li>${S.implex} vakken in de stamboom zijn dubbel bezet: ${S.implexTop} voorouders komen langs twee lijnen terug, en hun eigen voorouders dus ook. <button class="link" data-go="${implexStory()}">Over kwartierverlies</button></li>
      </ul></div>
    </div>
    <div class="box" style="margin-top:16px"><h3>Hoe vol is de stamboom?</h3>
      <p class="small" style="margin:0 0 10px">${S.fullTo ? `Tot en met generatie ${ROMAN[S.fullTo]} is iedereen gevonden.` : "Elke generatie verdubbelt het aantal voorouders."}</p>
      ${genCompleteness(S.gens)}</div>

    <div class="section-head" id="c-namen"><h2>Namen</h2><p>${S.nGivenM} verschillende mannennamen, ${S.nGivenF} vrouwennamen en ${S.surnames} achternamen of patroniemen. De namen linken naar de Voornamenbank van het Meertens Instituut.</p></div>
    <div class="cols">
      <div class="box"><h3>Mannen</h3>${hbars(S.namesM.map(([n, v]) => ({ l: n, v, html: `<a href="https://nvb.meertens.knaw.nl/naam/is/${enc(n)}" target="_blank" rel="noopener">${esc(n)}</a>`, c: "var(--l8)" })))}</div>
      <div class="box"><h3>Vrouwen</h3>${hbars(S.namesF.map(([n, v]) => ({ l: n, v, html: `<a href="https://nvb.meertens.knaw.nl/naam/is/${enc(n)}" target="_blank" rel="noopener">${esc(n)}</a>`, c: "var(--l13)" })))}</div>
    </div>
    <p class="small" style="margin:10px 0 0">Kinderen werden meestal naar hun grootouders genoemd; daardoor keren dezelfde namen in elke generatie terug.</p>

    <div class="section-head" id="c-werk"><h2>Werk</h2><p>${S.nOcc} voorouders met een bekend beroep; de percentages zijn van hen. Wie meer dan één beroep had, telt bij elk mee, dus samen is het meer dan 100%.</p></div>
    ${S.nRel >= 30 && S.rel.length > 1 ? `<div class="cols"><div class="box"><h3>Beroepen</h3>${hbars(S.occ, { wide: true, cls: "pct" })}</div>
      <div class="box"><h3>Geloof</h3><div class="hbars pct">${S.rel.map(r => { const mx = S.rel[0].sure + S.rel[0].prob; return `<div class="hb"><span class="hl">${esc(r.l)}</span><span class="track stack"><span style="width:${(r.sure / mx * 100).toFixed(1)}%;background:var(--accent)"></span><span style="width:${(r.prob / mx * 100).toFixed(1)}%;background:var(--accent);opacity:.4"></span></span><span class="mono hv">${pctN(r.sure + r.prob, S.nRel)}</span></div>`; }).join("")}</div>
        <p class="legend" style="margin-top:10px"><span><i class="lg" style="background:var(--accent)"></i>uit een bron</span><span><i class="lg" style="background:var(--accent);opacity:.4"></i>vermoedelijk</span></p>
        <p class="small" style="margin:6px 0 0">${S.nRel} voorouders van wie het geloof bekend is of vermoed wordt.</p></div></div>` : `<div class="box">${hbars(S.occ, { wide: true, cls: "pct" })}</div>`}

    <div class="section-head" id="c-plaatsen"><h2>Plaatsen</h2></div>
    <div class="cols">
      <div class="box"><h3>Meeste voorouders</h3>${hbars(S.topPlaces.map(([k, v]) => ({ l: k, v, html: `<button class="link" data-go="${slug(k)}">${esc(placeName(k))}</button>`, c: "var(--l12)" })))}</div>
      <div class="box"><h3>Van wieg tot graf</h3>
        <div class="duo"><div><b class="big">${r0(medianOf(S.moves.map(x => x.v)))}</b><span>km · mediaan</span><small>${S.moves.length} personen</small></div><div><b class="big">${Math.round(S.within20 / S.moves.length * 100)}%</b><span>stierven binnen 20 km van hun geboorteplaats</span><small>${S.within20} personen</small></div></div>
        <h5 class="eyebrow" style="margin:16px 0 0">Afstand van geboorte- tot sterfplaats, in km</h5>${vbars(S.dist.map(d => ({ l: d.l.replace(" km", "").replace("zelfde plaats", "0").replace(" of meer", "+"), v: d.v, lab: pct(d.v, S.moves.length), tip: `${d.l}: ${d.v} van de ${S.moves.length}` })), { bw: 44, gap: 14, color: "var(--l12)", label: "Aantal voorouders naar afstand tussen geboorte- en sterfplaats" })}
        <h5 class="eyebrow" style="margin:16px 0 6px">Het verst van huis</h5>
        <ol class="rank">${S.far.map(x => `<li>${pb(x.p)} <span class="small">${esc(placeName(x.p.bp))} → ${esc(placeName(x.p.dp))}</span> <span class="mono">${r0(x.v)} km</span></li>`).join("")}</ol>
        ${T.key === "h" ? `<p class="small" style="margin:8px 0 0">Wie ver weg overleed, zoals in Calgary of op Sumatra, was geen voorouder maar een broer of zus.</p>` : ""}</div>
    </div>

    ${MONEY.length ? `    <div class="section-head" id="c-geld"><h2>Geld in perspectief</h2><p>Bedragen uit notariële akten, naast het dagloon van een arbeider rond 1819.</p></div>
    <div class="box"><div class="tablewrap"><table class="money"><thead><tr><th>Jaar</th><th>Wat</th><th class="r">Gulden</th><th class="r">Jaren arbeidersloon</th></tr></thead><tbody>
      ${MONEY.slice().sort((a, b) => a.y - b.y).map(m => `<tr><td class="mono">${m.y}</td><td><b>${esc(m.t)}</b><br><span class="small">${esc(m.d)} · ${pb(person(m.kw))}</span></td><td class="mono r">ƒ ${nl(m.amt)}</td><td class="mono r"><span class="mlab">jaarlonen: </span>${m.y <= 1860 ? (m.amt / (WAGE.high * WAGE.days) < 1 ? "minder dan 1" : r0(m.amt / (WAGE.high * WAGE.days)) + " à " + r0(m.amt / (WAGE.low * WAGE.days))) : "–"}</td></tr>`).join("")}
    </tbody></table></div>
    <p class="small" style="margin:10px 0 0">${esc(WAGE.d)} Bron: <a href="${esc(WAGE.src[1])}" target="_blank" rel="noopener">${esc(WAGE.src[0])}</a>. Na 1860 stegen de lonen; daarom staat bij de latere bedragen geen omrekening. ${(() => { const m = MONEY.filter(x => x.y <= 1860).sort((a, b) => b.amt - a.amt)[0]; return m ? `Het grootste bedrag van vóór 1860, ${esc(m.t.charAt(0).toLowerCase() + m.t.slice(1))} (${m.y}), was dus ${r0(m.amt / (WAGE.high * WAGE.days))} tot ${r0(m.amt / (WAGE.low * WAGE.days))} jaarlonen waard.` : ""; })()}</p></div>` : ""}

    <div class="section-head" id="c-bronnen"><h2>Bewijs en bronnen</h2></div>
    <div class="cols">
      <div class="box"><h3>Status van de voorouders</h3>${statusBars()}</div>
      <div class="box"><h3>${nl(S.srcU)} bronnen</h3><p class="small" style="margin:0 0 10px">Samen ${nl(S.srcN)} keer vermeld in de profielen, per soort:</p>${hbars(S.srcTypes.map(t => ({ l: t.l, v: t.v, html: `<span class="srcrow">${srcIco(t.l)}${esc(t.l)}</span>`, txt: pctN(t.v, S.srcN), c: "var(--gold)" })), { cls: "pct" })}</div>
    </div>`;
}

/* ---------- geldwaarde ---------- */
/* Bij een bedrag in guldens in een notitie of verhaal: hoeveel jaar- of maandlonen van een arbeider dat was, met de maatstaf
   van 1819 (WAGE). Alleen als de zin één jaartal tussen 1790 en 1860 noemt: verder van 1819 af klopt de omrekening niet meer.
   Werkt op al ge-escapete tekst; "1105 en 215 gulden" (twee bedragen) slaan we over. */
function wageLabel(amt) {
  const yr1 = WAGE.high * WAGE.days, yr2 = WAGE.low * WAGE.days, a = amt / yr1, b = amt / yr2;
  const span = (x, y, one, many) => { const r1 = Math.round(x), r2 = Math.round(y); return r1 === r2 ? `${r1} ${r1 === 1 ? one : many}` : `${r1} à ${r2} ${many}`; };
  if (b < 1) { const m1 = amt / (yr1 / 12), m2 = amt / (yr2 / 12); return m2 < 1 ? "" : span(Math.max(m1, 1), m2, "maandloon", "maandlonen"); }
  return span(Math.max(a, 1), b, "jaarloon", "jaarlonen");
}
function geldw(html) {
  if (typeof WAGE === "undefined" || !/gulden/.test(html)) return html;
  const tip = esc(`Omgerekend met het dagloon van een arbeider in ${WAGE.y}: ${Math.round(WAGE.low * 100)} tot ${Math.round(WAGE.high * 100)} cent, ongeveer ${WAGE.days} werkdagen per jaar. Een orde van grootte, geen exacte waarde.`);
  return html.split(/(?<=[.;!?])(?=\s)/).map(sen => {
    const ys = (sen.match(/\b1[6-9]\d\d\b/g) || []).map(Number);
    if (!ys.length || ys.some(y => y < 1790 || y > 1860)) return sen;
    return sen.replace(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{2}))?\s+gulden\b(?:\s+per\s+jaar)?/g, (m, a, c, off, str) => {
      if (/\d\s+(?:en|tegen|of|tot)\s+$/.test(str.slice(0, off))) return m;
      const amt = +a.replace(/\./g, "") + (c ? +c / 100 : 0), lab = amt >= 20 ? wageLabel(amt) : "";
      return lab ? `${m} <span class="geldw" title="${tip}">(≈ ${lab} van een arbeider)</span>` : m;
    });
  }).join("");
}

/* ---------- eerlijke kerncijfers ---------- */
/* De kerncijfers op het overzicht, gesplitst naar bewijs. Een voorouder telt als "via een onzekere koppeling" als de keten
   van hem naar kw 1 ergens een C- of D-stap heeft: dezelfde regel als de zwakste schakel (schakelKeten). Bij kwartierverlies
   telt de sterkste van zijn nummers. Voor de oudste datum tellen alleen exacte datums (jaar-maand-dag), geen schattingen. */
/* de sterkste keten van een persoon (over al zijn nummers) en de generatie daarvan */
function ketenBest(p) {
  let best = null, bg = 0;
  [p.kw, ...twinKws(p.kw)].forEach(k => { const st = schakelKeten(k).st; if (!best || ST_RANK[st] < ST_RANK[best]) { best = st; bg = gen(k); } });
  return { st: best || "A", g: bg };
}
const ketenBewezen = p => ST_RANK[ketenBest(p).st] <= 1;
/* oudste jaartal van een persoon (geboorte, overlijden, woonplaatsen), ook als het geen exacte datum is */
const oudsteJaar = p => Math.min(yr(p.b) || 9999, yr(p.d) || 9999, ...(p.res || []).map(r => r.y || 9999));
function honestStats() {
  const A = ancestors, out = { n: A.length, weak: 0, genProven: 0, genAll: 0, oldProven: null, oldAll: null, yearProven: 9999 };
  A.forEach(p => {
    const kb = ketenBest(p), best = kb.st, bg = kb.g;
    const proven = ST_RANK[best] <= 1;
    if (proven && (p.st === "A" || p.st === "B")) out.yearProven = Math.min(out.yearProven, oudsteJaar(p));
    if (!proven) out.weak++;
    out.genAll = Math.max(out.genAll, bg); if (proven) out.genProven = Math.max(out.genProven, bg);
    [["b", p.b], ["d", p.d], ["m", p.m && p.m.d]].forEach(([f, d]) => {
      const dt = fullDate(d); if (!dt) return; const y = dt.getUTCFullYear(), fs = fieldSt(p, f);
      out.oldAll = out.oldAll === null ? y : Math.min(out.oldAll, y);
      if (proven && (!fs || ST_RANK[fs] <= 1) && (p.st === "A" || p.st === "B")) out.oldProven = out.oldProven === null ? y : Math.min(out.oldProven, y);
    });
  });
  return out;
}

/* ---------- beroep uitgelegd ---------- */
/* Staat een woord uit het beroep (of een ander begrip) in GLOSSARY, dan wordt het een knopje met de uitleg als tooltip;
   klikken opent Bronnen › Begrippen bij dat begrip. Een paar begrippen hebben ook een mannelijke of vrouwelijke vorm. */
const GLOSS_FORM = { Renteniersche: "rentenier(?:sche|ster)?", Veehouder: "veehoud(?:er|ster)", Kastelein: "kastelein(?:sche)?", Eigenerfde: "eigenerfden?", Chirurgijn: "chirurgijn" };
const glossId = t => "begrip-" + norm(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function occGloss(html) {
  if (typeof GLOSSARY === "undefined" || !html) return html;
  const hits = [];
  GLOSSARY.forEach(g => {
    const pat = GLOSS_FORM[g[0]] || g[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = new RegExp(`(^|[^\\p{L}])(${pat})(?![\\p{L}])`, "iu").exec(html);
    if (m) { const at = m.index + m[1].length, end = at + m[2].length; if (!hits.some(h => at < h.end && end > h.at)) hits.push({ at, end, g }); }
  });
  if (!hits.length) return html;
  hits.sort((a, b) => a.at - b.at);
  let out = "", i = 0;
  hits.forEach(h => { out += html.slice(i, h.at) + `<button type="button" class="gloss" data-gloss="${esc(h.g[0])}" title="${esc(h.g[1])}">${html.slice(h.at, h.end)}</button>`; i = h.end; });
  return out + html.slice(i);
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-gloss]"); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  if (!$("#drawer").hidden) closeProfile(true);
  toonBegrip(b.dataset.gloss);
}, true);
/* een begrip tonen: naar Bronnen › Over deze site, bij het begrip, kort opgelicht */
function toonBegrip(naam) {
  const id = glossId(naam);
  go("bronnen-begrippen");
  let tries = 0; /* de pagina kan nog aan het opbouwen zijn: een paar frames opnieuw zoeken */
  const show = () => { const dt = document.getElementById(id); if (!dt) { if (++tries < 30) requestAnimationFrame(show); return; } dt.scrollIntoView({ block: "center" }); dt.classList.add("begrip-hl"); if (dt.nextElementSibling) dt.nextElementSibling.classList.add("begrip-hl"); setTimeout(() => $$(".begrip-hl").forEach(x => x.classList.remove("begrip-hl")), 2600); };
  requestAnimationFrame(() => requestAnimationFrame(show));
}

/* ---------- focus vasthouden ---------- */
/* Lade, zoekvenster en lichtbak zijn dialogen: Tab en Shift+Tab blijven erbinnen. Alles wat je met het toetsenbord kunt
   bereiken telt mee (ook een uitklapkop en elementen met tabindex 0), behalve wat verborgen is of in een dichte details staat. */
const FOCUSABLE = 'button, a[href], summary, input, select, textarea, [tabindex="0"]';
function focusables(root) {
  return $$(FOCUSABLE, root).filter(x => !x.hidden && !x.disabled && x.getAttribute("tabindex") !== "-1" && x.offsetParent !== null && !(x.tagName !== "SUMMARY" && x.closest("details:not([open])")));
}
function trapFocus(root, e) {
  if (e.key !== "Tab") return;
  const f = focusables(root); if (!f.length) return;
  const i = f.indexOf(document.activeElement);
  if (i < 0) { e.preventDefault(); (e.shiftKey ? f[f.length - 1] : f[0]).focus(); }
  else if (e.shiftKey && i === 0) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
}
drawer.addEventListener("keydown", e => trapFocus(drawer, e));
sdlg.addEventListener("keydown", e => trapFocus(sdlg, e));
/* "Naar de inhoud": de eerste Tab op de pagina springt over de kop heen naar de pagina die open staat */
{ const sk = $("#skipMain"); if (sk) sk.onclick = () => { const v = $$("main > .view").find(x => !x.hidden) || $("main"); v.setAttribute("tabindex", "-1"); v.focus(); }; }

/* ---------- nieuw sinds je vorige bezoek ---------- */
/* De browser onthoudt de laatst geziene versie. Is er sindsdien iets bijgekomen, dan toont het vak Nieuw op het overzicht
   alle wijzigingen sinds die versie. Bij een eerste bezoek of zonder opslag blijft het vak zoals het was. */
let SINCE;
function sinceLastVisit() {
  if (SINCE !== undefined) return SINCE;
  let last = null;
  try { last = localStorage.getItem("stamboom-gezien"); localStorage.setItem("stamboom-gezien", CHANGELOG[0].v); } catch (e) { }
  const i = last ? CHANGELOG.findIndex(c => c.v === last) : -1;
  return (SINCE = i > 0 ? { last, entries: CHANGELOG.slice(0, i) } : null);
}

/* ---------- namenregister ---------- */
const PREFIX = /^((?:van der|van den|van de|van|de|der|den|ten|ter|te)\s+)(.+)$/;
function surnameIndex() {
  const idx = {};
  ancestors.forEach(p => {
    const sur = splitName(p.n).sur; if (!sur) return;
    const m = PREFIX.exec(sur), key = m ? m[2] + ", " + m[1].trim() : sur;
    const e = idx[key] = idx[key] || { key, sur, ps: [], lines: new Set(), y0: 9999, y1: 0 };
    e.ps.push(p); const l = lineOf(p.kw); if (LINES[l]) e.lines.add(l);
    if (!p.living) [yr(p.b), yr(p.d)].filter(Boolean).forEach(y => { e.y0 = Math.min(e.y0, y); e.y1 = Math.max(e.y1, y); });
  });
  return Object.values(idx).sort((a, b) => norm(a.key).localeCompare(norm(b.key), "nl"));
}
function renderNamen() {
  const list = surnameIndex(), host = $("#v-namen");
  const letter = e => norm(e.key)[0].toUpperCase();
  const letters = [...new Set(list.map(letter))];
  const row = e => `<li data-n="${esc(norm(e.key + " " + e.ps.map(p => p.n).join(" ")))}"><div class="nm"><b>${esc(e.key)}</b><span class="dots">${[...e.lines].map(l => `<i style="background:var(--l${l})" title="${esc(LINES[l].name)}"></i>`).join("")}</span><span class="mono small">${e.ps.length}${e.y0 < 9999 ? ` · ${e.y0}${e.y1 > e.y0 ? "–" + e.y1 : ""}` : ""}</span></div><div class="who">${e.ps.sort((a, b) => a.kw - b.kw).map(p => `<span class="nw">${sexIco(p.kw)}<button class="link" data-open="${p.kw}">${esc(firstName(p))}</button></span>`).join(", ")}</div></li>`;
  host.innerHTML = `
    <div class="eyebrow"><button class="link" data-go="personen">Personen</button> › Namenregister</div>
    <h1 class="page-title">Namenregister</h1>
    <p class="lede">${list.length} achternamen en patroniemen, met de voornamen van wie ze droeg. Voorvoegsels als de, van en ten staan achter de naam: De Groot vind je bij de G. Tot 1811 hadden veel voorouders geen vaste achternaam; dan staat hier het patroniem (Hylkes, zoon van Hylke).</p>
    <div class="toolbar"><input type="search" id="nmQ" placeholder="Zoek een naam" aria-label="Zoek in het namenregister"></div>
    <nav class="chips letters" aria-label="Letters">${letters.map(L => `<button class="chip" data-letter="${L}">${L}</button>`).join("")}</nav>
    <div class="namereg">${letters.map(L => `<section id="nm-${L}"><h2>${L}</h2><ul>${list.filter(e => letter(e) === L).map(row).join("")}</ul></section>`).join("")}</div>
    <p class="small" id="nmNone" hidden>Geen naam gevonden.</p>`;
  $$("[data-letter]", host).forEach(b => b.onclick = () => document.getElementById("nm-" + b.dataset.letter).scrollIntoView({ behavior: "smooth", block: "start" }));
  $("#nmQ").oninput = e => {
    const q = norm(e.target.value).trim();
    $$(".namereg li", host).forEach(li => { li.hidden = !!q && !li.dataset.n.includes(q); });
    $$(".namereg section", host).forEach(sec => { sec.hidden = !$$("li", sec).some(li => !li.hidden); });
    $("#nmNone").hidden = $$(".namereg li", host).some(li => !li.hidden);
  };
}

/* ---------- kwartierstaat als lijst (ook om af te drukken) ---------- */
const lijstState = { line: 0 };
function kwEntry(kw) {
  const p = person(kw);
  if (!p) return "";
  const head = `<span class="kwn" title="Kwartiernummer: het nummer in de stamboom. De vader van nummer n heeft 2n, de moeder 2n + 1.">${kw}</span> <b>${esc(p.n)}</b>`;
  if (p.living) return `<p class="ke">${head} <span class="small">(levend; alleen de naam)</span></p>`;
  if (p.aliasOf) return `<p class="ke">${head} <span class="small">is dezelfde persoon als kw ${p.aliasOf} (kwartierverlies); zie daar.</span></p>`;
  const bits = [];
  if (p.b || p.bp) bits.push((p.bapt && !p.b ? "gedoopt" : "geboren") + " " + [fmt(p.b), placeName(p.bp)].filter(Boolean).join(", "));
  if (p.d || p.dp) bits.push("overleden " + [fmt(p.d), placeName(p.dp)].filter(Boolean).join(", "));
  if (p.occ) bits.push(p.occ.split(";")[0]);
  if (p.m && kw % 2 === 0 && person(kw + 1)) bits.push("trouwde" + (p.m.d ? " " + fmt(p.m.d) : "") + (p.m.p ? " in " + placeName(p.m.p) : "") + ` met ${person(kw + 1).n} (${kw + 1})`);
  return `<p class="ke">${head} ${stTag(p.st)}${bits.length ? ": " + bits.map(b => p.occ && b === p.occ.split(";")[0] ? occGloss(esc(b)) : esc(b)).join("; ") + "." : ""}</p>`;
}
/* "x van y gevonden" per generatie: y = het aantal vakken, bij één familie alleen die van haar lijn */
function lijstFound(n, g, l) {
  const slots = !l ? 2 ** (g - 1) : g >= 4 ? 2 ** (g - 4) : g === 3 ? 1 : 0;
  return slots ? `${n.toLocaleString("nl-NL")} van ${slots.toLocaleString("nl-NL")} gevonden` : "";
}
function renderLijst() {
  const host = $("#v-lijst"), l = lijstState.line;
  const kws = [...BY.keys()].filter(k => !l || (k >= 4 && lineOf(k) === l)).sort((a, b) => a - b);
  const maxG = Math.max(...kws.map(gen));
  let body = "";
  for (let g = 1; g <= maxG; g++) { const ks = kws.filter(k => gen(k) === g); if (ks.length) body += `<section class="kgen"><h2>Generatie ${ROMAN[g]} <span class="small">${esc(GEN_NAME[g])}${g > 1 ? ` · ${lijstFound(ks.length, g, l)}` : ""}</span></h2>${ks.map(kwEntry).join("")}</section>`; }
  host.innerHTML = `
    <div class="eyebrow noprint"><button class="link" data-go="personen">Personen</button> › Kwartierstaat</div>
    <h1 class="page-title">Kwartierstaat ${l ? "· familie " + esc(LINES[l].name) : esc(T.brand)}</h1>
    <p class="lede">De klassieke vorm: elke voorouder met een nummer. De vader van nummer n is 2n, de moeder 2n + 1. Achter de naam de bewijsstatus (A akte, B sterk, C onzeker, D hypothese). Van levenden staat alleen de naam.</p>
    <div class="toolbar noprint">
      <select id="lijstLine" aria-label="Familie"><option value="0">Alle families</option>${LINE_KEYS.map(k => `<option value="${k}"${k === l ? " selected" : ""}>Familie ${esc(LINES[k].name)}</option>`).join("")}</select>
      <button class="btn primary" id="lijstPrint">${navIco("print")}Afdrukken of opslaan als pdf</button>
    </div>
    <div class="klijst">${body}</div>
    <p class="small printonly">${esc(VERSION)} · ${kws.length} nummers · bronnen per persoon op de website.</p>`;
  $("#lijstLine").onchange = e => { lijstState.line = +e.target.value; renderLijst(); };
  $("#lijstPrint").onclick = () => window.print();
}

/* ---------- bekende verwanten ---------- */
const VERDICT = {
  "bewezen": ["good", "Bewezen verwant"],
  "waarschijnlijk": ["warn", "Waarschijnlijk verwant"],
  "niet bewezen": ["weak", "Verwantschap niet bewezen"],
  "geen verband": ["muted", "Alleen dezelfde naam"]
};
const verdictTag = v => `<span class="verdict v-${VERDICT[v][0]}">${VERDICT[v][1]}</span>`;
function notableCard(N, compact) {
  const por = imgOf("persoon", N.id);
  if (compact) return `<button class="notable-mini${por ? " withimg" : ""}" data-go="verwanten">${por ? `<img class="por" src="${por.thumb}" alt="" loading="lazy">` : ""}<span class="eyebrow">${esc(N.y)}</span><h3>${esc(N.n)}</h3><p>${esc(N.rel.split(". ")[0])}.</p>${verdictTag(N.verdict)}</button>`;
  return `<article class="notable" id="n-${N.id}">
    ${por ? `<div class="nhead">${fig(por, { thumb: true, cls: "portrait", cap: false })}<div>` : ""}
    <header><div><h3>${esc(N.n)}</h3><span class="small">${esc([N.alt, N.y].filter(Boolean).join(" · "))}</span></div>${verdictTag(N.verdict)}</header>
    ${por ? `<p class="credit" style="margin:8px 0 0">Portret: ${credit(por)}</p></div></div>` : ""}
    <p>${esc(N.role)}</p>
    <h5 class="eyebrow">Hoe verwant</h5><p>${esc(N.rel)}</p>
    ${N.path && N.path.length ? `<ol class="npath">${N.path.map(s => `<li>${s[1] ? `<button class="link" data-open="${s[1]}">${esc(s[0])}</button> <span class="mono small">kw ${s[1]}</span>` : esc(s[0])}</li>`).join("")}</ol>` : ""}
    ${N.notes && N.notes.length ? N.notes.map(t => `<p class="small" style="font-size:14px">${esc(t)}</p>`).join("") : ""}
    ${N.links && N.links.length ? `<details><summary>Bronnen (${N.links.length}) ${stTag(N.st)}</summary><ul class="srclist">${N.links.map(l => `<li><span class="tag" style="color:var(--muted)">${srcType(l[1], l[0])}</span><a href="${esc(l[1])}" target="_blank" rel="noopener">${esc(l[0])}</a></li>`).join("")}</ul></details>` : ""}
  </article>`;
}
function renderVerwanten() {
  if (T.key !== "h") {
    $("#v-verwanten").innerHTML = `<div class="eyebrow"><button class="link" data-go="personen">Mensen</button> › Bekende verwanten</div>
      <h1 class="page-title">Bekende verwanten</h1>
      <p class="lede">${esc(T.TXT.verwanten || "In de stamboom van " + T.root + " zijn nog geen bekende verwanten onderzocht.")}</p>
      ${NOTABLES.length ? `<div class="notables three">${NOTABLES.map(N => notableCard(N)).join("")}</div>` : ""}
      ${(T.HISTORY_TOUCH || []).length ? ovMore(`data-go="tijd"`, "Geraakt door de grote geschiedenis: zie Hun tijd") : ""}`;
    return;
  }
  $("#v-verwanten").innerHTML = `
    <div class="eyebrow"><button class="link" data-go="personen">Mensen</button> › Bekende verwanten</div>
    <h1 class="page-title">Bekende verwanten</h1>
    <p class="lede">We zochten in de hele stamboom naar mensen die in de geschiedenisboeken staan: edelen, bestuurders, rijke grondbezitters, of mensen die bij grote gebeurtenissen betrokken waren. Het korte antwoord: in de directe lijn geen adel en geen hoge bestuurders. Wel twee bekende geestelijken als naaste verwanten, onder wie een heilige, en een paar welgestelde boeren en kooplieden.</p>
    <div class="section-head"><h2>Bloedverwanten met een plaats in de geschiedenis</h2><p>Afstammelingen van dezelfde voorouders, met akten bewezen.</p></div>
    <div class="notables">${NOTABLES.filter(N => N.verdict === "bewezen" && ["brandsma", "spitzen"].includes(N.id)).map(N => notableCard(N)).join("")}</div>
    <div class="section-head"><h2>Aangetrouwd, en alleen dezelfde naam</h2><p>Wat we ook nagingen, en waarom het geen of een zwakke band is.</p></div>
    <div class="notables three">${NOTABLES.filter(N => !(N.verdict === "bewezen" && ["brandsma", "spitzen"].includes(N.id))).map(N => notableCard(N)).join("")}</div>
    ${ovMore(`data-go="tijd"`, "Geraakt door de grote geschiedenis: zie Hun tijd")}
    <div class="section-head"><h2>Rijk of arm?</h2></div>
    <div class="cols">
      <div class="box"><h3>Welgesteld</h3><p style="margin:0;font-size:14px;color:var(--muted)">De familie Terwisscha van Scheltinga had eigen grond: de boedel van Titus Bokkes (kw 208), verdeeld in 1819, was ƒ ${nl(47313)} waard, zo'n 200 tot 300 jaarlonen van een arbeider. Zijn zoon Assuerus (kw 104) was in 1832 koopman en grondeigenaar; twee dochters trouwden met de houthandelaars Overmeer in Makkum, een derde met Hendrik Brandsma op Ugoklooster. Akke Meinsma (kw 73), de weduwe van Remke Kingma, stond in 1832 in het kadaster als eigenaar van 21 percelen, samen ongeveer 44 hectare.</p></div>
      <div class="box"><h3>Gewoon</h3><p style="margin:0;font-size:14px;color:var(--muted)">De meeste voorouders waren pachtboeren, veehouders, knechten, meiden en kleine middenstanders. In 1811 hadden veel van hen nog geen vaste achternaam. Het hoogste ambt in de directe lijn: Lammert de Jong (kw 120) was gemeenteraadslid, en Kornelis Moezen (kw 34) kerkvoogd. Grietmannen, burgemeesters, predikanten of officieren komen in de directe lijn niet voor.</p></div>
    </div>
    ${ovMore(`data-go="cijfers"`, "Alle bedragen bij Cijfers")}`;
}

const RENDER = { overzicht: renderOverzicht, stamboom: renderStamboom, families: renderFamilies, personen: renderPersonen, verhalen: renderVerhalen, tijdlijn: renderTijdlijn, kaart: renderKaart, plaats: renderPlaats, beeld: () => renderBeeld("beeld"), "beeld-plaatsen": () => renderBeeld("beeld-plaatsen"), "beeld-archief": () => renderBeeld("beeld-archief"), cijfers: renderCijfers, verwanten: renderVerwanten, bronnen: renderBronnen, "bronnen-tegenstrijdig": renderTegenstrijdig, "bronnen-lijst": renderBronLijst, "bronnen-over": renderOverSite, namen: renderNamen, lijst: renderLijst, zoeken: renderZoeken };
/* ---------- twee bomen: wisselen ---------- */
/* hash "#a-..." = de boom van Alies, "#s-..." of geen hash = Harrie + Alies (de kinderen); andere hash zonder prefix = Harrie. Interne links (data-go, data-open) blijven in de huidige boom. */
function treeChrome() {
  const b = $("header.top .brand"); if (b) b.innerHTML = `${esc(T.brand)}<small>stamboom</small>`;
  const tb = $("#treebar"); if (tb) tb.hidden = !TREES.a;
  $$("[data-tree=s]").forEach(x => x.hidden = !TREES.s);
  $$("[data-tree]").forEach(x => x.setAttribute("aria-pressed", x.dataset.tree === T.key));
  $$("#treebar [data-tree]").forEach(x => { const t = TREES[x.dataset.tree]; if (!t) return; /* teksten uit de boomgegevens: wie staat in het midden, welke families */
    const half = { h: "M7.5 1.5a6 6 0 0 0 0 12z", a: "M7.5 1.5a6 6 0 0 1 0 12z", s: "M6.8 1.54a6 6 0 0 0 0 11.92zM8.2 1.54a6 6 0 0 1 0 11.92z" }[t.key] || "";
    x.innerHTML = `<svg class="tb-ic" viewBox="0 0 15 15" aria-hidden="true"><circle cx="7.5" cy="7.5" r="6"/><path d="${half}"/></svg><span class="tb-tx"><b>${esc(t.root)}</b><span>${esc(t.brand)}</span></span>`;
    x.title = `Stamboom van ${t.rootFull}`; });
  const sl = $("#v-stamboom .lede"); if (sl) sl.textContent = `${T.rootFull || T.root} in het midden; elke ring is een generatie verder terug.`;
  document.title = "Stamboom " + T.brand.replace(" · ", "-");
  footChrome();
}
function setTree(k) {
  if (!TREES[k] || T === TREES[k]) return false;
  loadTree(k);
  EVENTS = buildEvents(); NEWSET = new Set(CHANGES.newKws); UPDSET = new Set(CHANGES.updKws); STATS = null;
  INDEX.length = 0; buildIndex();
  Object.keys(rendered).forEach(x => delete rendered[x]);
  Object.assign(cardState, { q: "", gen: "all", sort: "kw", chg: null }); cardState.lines.clear(); cardState.st.clear(); cardState.open.clear();
  const q = $("#q"); if (q) q.value = "";
  tlState.lines.clear(); mapState.lines.clear(); mapState.place = null; mapFocusPerson = null; stopPlay();
  treeRoot = 1; lijstState.line = 0; beeldState.page = ""; beeldState.q = ""; beeldState.raw = "";
  /* verborgen pagina's van de vorige boom leegmaken: ze worden bij het volgende bezoek opnieuw opgebouwd (rendered is gewist) */
  ["#v-overzicht", "#v-families", "#v-verhalen", "#v-plaats", "#v-beeld", "#v-cijfers", "#v-verwanten", "#v-bronnen", "#v-bronnen-tegenstrijdig", "#v-bronnen-lijst", "#v-bronnen-over", "#v-namen", "#v-lijst", "#fan", "#fanSide", "#crumbs", "#tree", "#cardsOut", "#timeline", "#tlArch", "#contextCards"].forEach(id => { const n = $(id), v = n && n.closest(".view"); if (n && v && v.hidden) n.innerHTML = ""; });
  treeChrome();
  return true;
}
const treeOfHash = h => TREES.a && /^a-/.test(h) ? "a" : TREES.s && (/^s-/.test(h) || !h) ? "s" : "h"; /* zonder hash: de boom van de kinderen */
const stripTree = h => h.replace(/^[as]-/, "");
document.addEventListener("click", e => { const t = e.target.closest("[data-tree]"); if (!t) return; e.preventDefault(); if (setTree(t.dataset.tree)) go(currentToken()); });
treeChrome();

/* ---------- zwakste schakel ---------- */
/* Een lijn is zo sterk als haar zwakste stap. Elke stap ouder → kind (kw k → k >> 1) krijgt het label van de koppeling:
   `link` als dat er staat, anders `st` (het slechtste van bestaan en koppeling). Levenden hebben geen label en tellen niet
   mee. Een alias-nummer (kwartierverlies) krijgt de koppeling uit het volledige record van dezelfde persoon. Alles wordt
   live uit de data berekend, ook in de samengestelde boom (daar zijn kw 1 en de ouders levend). */
const ST_RANK = { A: 0, B: 1, C: 2, D: 3 };
const stapSt = kw => { const p = kw > 1 ? person(kw) : null; return p && !p.living ? p.link || p.st || null : null; };
/* { st: label van de hele keten, kw: de ouder in de zwakste stap (bij gelijke stappen de stap het dichtst bij de hoofdpersoon), weak: aantal C/D-stappen } */
function schakelKeten(kw) {
  let st = null, at = null, weak = 0;
  for (let k = kw; k > 1; k >>= 1) {
    const s = stapSt(k); if (!s || !(s in ST_RANK)) continue;
    if (ST_RANK[s] >= 2) weak++;
    if (!st || ST_RANK[s] >= ST_RANK[st]) { st = s; at = k; }
  }
  return { st: st || "A", kw: at, weak };
}
/* de zin uit stNote die over dit label gaat, ingekort */
function schakelReden(p, s, kind) {
  const t = String(p.stNote || "").trim();
  if (!t) return STATUS[s].long;
  const zin = t.split(/(?<=[.!?])\s+(?=[A-Z'‘"(])/), met = zin.filter(x => x.includes("(" + s + ")") || x.includes("(" + s + ","));
  const z = met.find(x => kind && x.includes(firstName(kind))) || met[0] || zin.find(x => s === "D" ? /hypothese/i.test(x) : /stamboom|genealogie|zonder bron/i.test(x)) || zin[0];
  return z.length > 190 ? z.slice(0, 175).replace(/\s+\S*$/, "") + " …" : z;
}
/* profiel, onder "Zo hoort … bij …" */
function schakelRegel(kw) {
  const p = person(kw); if (!p || p.living || kw < 4) return "";
  const k = schakelKeten(kw); if (!k.kw) return "";
  if (k.st === "A") return `<p class="schakel small">${stTag("A")} Elke stap in deze keten staat in een akte.</p>`;
  const q = person(k.kw), c = k.kw >> 1, kind = person(c);
  const wie = k.kw === kw ? `<b>${esc(firstName(q))}</b>` : `<button class="link" data-open="${k.kw}">${esc(firstName(q))}</button>`;
  const van = T.key === "s" && c === 1 ? "hun" : isMale(c) ? "zijn" : "haar";
  const rest = k.weak > 1 ? ` Deze keten heeft ${k.weak} onzekere stappen.` : "";
  return `<p class="schakel schakel-${k.st}"><span class="lbl">Zwakste schakel:</span> ${esc(firstName(kind))} → ${wie}, ${van} ${isMale(k.kw) ? "vader" : "moeder"} ${stTag(k.st, true)}<br><span class="small">${esc(schakelReden(q, k.st, kind))}${rest}</span></p>`;
}
/* boom: een C- of D-koppeling als stippellijn */
const schakelDash = kw => { const s = stapSt(kw); return s === "D" ? { "stroke-dasharray": "1.5 4", "stroke-linecap": "round", stroke: "var(--hyp)" } : s === "C" ? { "stroke-dasharray": "5 4", stroke: "var(--weak)" } : {}; };
/* lijnpagina: per persoon de sterkte van de hele keten, de plek waar het begint te wankelen, de knop Afdrukken */
function schakelLijn(l, host) {
  let zwak = 0;
  $$(".gen-det tbody tr", host).forEach(tr => {
    const kw = +tr.cells[0].textContent, p = person(kw); if (!p || p.living) return;
    const k = schakelKeten(kw), own = stapSt(kw), onder = schakelKeten(kw >> 1).st;
    if (ST_RANK[k.st] < 2) return;
    zwak++; tr.classList.add("schakel-" + k.st);
    if (own && ST_RANK[own] >= 2 && ST_RANK[own] > ST_RANK[onder]) tr.cells[1].insertAdjacentHTML("beforeend", `<span class="schakel-hier st-${own}">vanaf hier steunt de lijn op ${own === "D" ? "een hypothese" : "een onzekere bron"}</span>`);
    if (ST_RANK[k.st] > ST_RANK[p.st]) tr.cells[5].insertAdjacentHTML("beforeend", ` <span class="tag st-${k.st} keten" title="De keten naar ${esc(T.root)} steunt ergens op ${k.st === "D" ? "een hypothese" : "een onzekere bron"}">keten ${k.st}</span>`);
  });
  $$(".stem button[data-open]", host).forEach(b => { const s = schakelKeten(+b.dataset.open).st; if (ST_RANK[s] >= 2) b.classList.add("schakel-" + s); });
  const first = $(".gen-det", host);
  if (first) first.insertAdjacentHTML("beforebegin", zwak
    ? `<p class="schakel-legenda small"><span class="sw C"></span><span class="sw D"></span>Een streep vóór het nummer: de keten van die voorouder naar ${esc(T.root)} steunt ergens op een onzekere bron (C, streepjes) of op een hypothese (D, puntjes). Bij <i>vanaf hier</i> begint dat zwakke deel. Het profiel noemt de zwakste schakel en de reden.</p>`
    : `<p class="schakel-legenda small">Elke koppeling in deze lijn is A of B: de keten tot ${esc(T.root)} steunt op akten en sterk bewijs.</p>`);
  const cta = $(".linehead .cta", host);
  if (cta) { cta.insertAdjacentHTML("beforeend", `<button class="btn" id="lnPrint">${navIco("print")}Afdrukken</button>`); $("#lnPrint").onclick = lijnPrint; }
  host.insertAdjacentHTML("afterbegin", `<p class="printonly lijnkop">Stamboom van ${esc(T.rootFull)} · lijn ${l}, familie ${esc(LINES[l].name)} · ${esc(VERSION)}</p>`);
}
/* afdrukken: alle generaties open; daarna weer zoals de lezer ze had */
let lijnDicht = [];
function lijnOpen() { lijnDicht = $$("#v-families .gen-det:not([open])"); lijnDicht.forEach(d => d.open = true); }
function lijnPrint() { lijnOpen(); window.print(); }
addEventListener("beforeprint", () => { if (route.view === "families" && route.sub && !lijnDicht.length) lijnOpen(); });
addEventListener("afterprint", () => { lijnDicht.forEach(d => d.open = false); lijnDicht = []; });

/* ---------- tijdlijn per familie ---------- */
/* "Per familie": elke lijn heeft een kop (naam, kleur, aantal, periode) die de groep uit- of inklapt. Ingeklapt staan alleen
   de kern: de stamlijn en de eerste generaties (in de samengestelde boom één generatie meer, want daar zijn de kinderen kw 1).
   Is er precies één familie gekozen (bijv. via "Toon in de tijdlijn" op een lijnpagina), dan staat die standaard open.
   tlFlip bevat de lijnen die de lezer anders heeft gezet dan de standaard. In de samengestelde boom per kant een tussenkop. */
const tlFlip = new Set();
const TL_SMAL = matchMedia("(max-width:560px)"), tlNarrow = () => TL_SMAL.matches; /* telefoon: grotere letters in de tijdlijn */
TL_SMAL.addEventListener("change", () => { if (route.view === "tijdlijn") drawTimeline(); });
const tlDefault = () => tlState.lines.size === 1;
const tlIsOpen = l => tlFlip.has(l) !== tlDefault();
const tlSetOpen = (l, v) => { v !== tlDefault() ? tlFlip.add(l) : tlFlip.delete(l); };
const tlCore = (p, l) => gen(p.kw) <= (T.key === "s" ? 5 : 4) || (LINES[l].stem || []).includes(p.kw);
let tlShown = [], tlSig = "";
function tlRows(ps, start, rows) {
  tlShown = [];
  const sig = T.key + [...tlState.lines].join(); if (sig !== tlSig) { tlSig = sig; tlFlip.clear(); } /* andere boom of familiekeuze: terug naar de standaard */
  if (tlState.by !== "line") { ps.slice().sort((a, b) => start(a) - start(b)).forEach(p => rows.push({ p })); tlSyncAll(); return; }
  let side = null;
  LINE_KEYS.forEach(l => {
    const all = ps.filter(p => lineOf(p.kw) === l).sort((a, b) => start(a) - start(b)); if (!all.length) return;
    if (T.key === "s") { const s = l < 12 ? "h" : "a"; if (s !== side) { side = s; rows.push({ side: TREES[s].root, h: tlNarrow() ? 34 : 28 }); } }
    const open = tlIsOpen(l), core = all.filter(p => tlCore(p, l)), shown = open ? all : core;
    const ys = all.flatMap(p => [yr(p.b), yr(p.d)]).filter(Boolean);
    rows.push({ head: l, h: tlNarrow() ? 64 : 46, n: all.length, core: core.length, open, y0: Math.min(...ys), y1: Math.max(...ys) });
    shown.forEach(p => rows.push({ p }));
    tlShown.push([l, open, core.length < all.length]);
  });
  tlSyncAll();
}
function tlHead(r, gn, g, left, right, X) {
  if (r.side) { txt(gn, 12, r.y + 20, "KANT VAN " + r.side.toUpperCase(), { "font-size": tlNarrow() ? 16 : 11, "font-family": "var(--mono)", fill: "var(--muted)", "letter-spacing": "1" }); return; }
  const l = r.head, c = `var(--l${l})`, more = r.core < r.n;
  const f = tlNarrow() ? 1.45 : 1; /* telefoon: zie tlNarrow */
  const flip = e => { const kb = e && e.type === "keydown"; tlSetOpen(l, !r.open); drawTimeline(); if (kb) { const h = $(`#timeline .tlhead[data-l="${l}"]`); if (h) h.focus(); } }; /* na hertekenen: focus terug op dezelfde kop */
  const hn = el("g", { class: more ? "node tlhead" : "tlhead", "data-l": l }, gn);
  el("rect", { x: 0, y: r.y, width: left, height: r.h, fill: "transparent" }, hn);
  txt(hn, 10, r.y + 21 * f, (more ? (r.open ? "▾ " : "▸ ") : "") + trunc(LINES[l].name, f > 1 ? 16 : 21), { "font-size": 15 * f, "font-family": "var(--display)", fill: c });
  txt(hn, more ? 24 : 10, r.y + 37 * f, `${r.n}${f > 1 ? "" : r.n === 1 ? " voorouder" : " voorouders"} · ${r.y0 === r.y1 ? r.y0 : r.y0 + "–" + r.y1}`, { "font-size": 11 * f, "font-family": "var(--mono)", fill: "var(--muted)" });
  if (more) { clickable(hn, flip, `Familie ${LINES[l].name}: ${r.open ? "toon alleen de stamlijn" : "toon alle " + r.n + " voorouders"}`); hn.setAttribute("aria-expanded", r.open); }
  /* rechts: de periode als lichte band, en de knoppen */
  el("rect", { x: X(r.y0), y: r.y + 12, width: Math.max(4, X(r.y1) - X(r.y0)), height: 6, rx: 3, fill: c, "fill-opacity": 0.3 }, g);
  let x = left + 8;
  if (more) { const t = txt(g, x, r.y + 37 * f, r.open ? "toon alleen de stamlijn" : `toon alle ${r.n}`, { "font-size": 12 * f, fill: "var(--accent)", class: "tlact" }); clickable(t, flip, t.textContent); t.setAttribute("tabindex", "-1"); x += t.textContent.length * 6.6 * f + 14; }
  const lk = txt(g, x, r.y + 37 * f, `naar de familie ${trunc(LINES[l].name, 28)} ›`, { "font-size": 12 * f, fill: "var(--accent)", class: "tlact" });
  clickable(lk, () => go("lijn-" + l), "Naar de familie " + LINES[l].name);
  [[gn, 10, left], [g, left, right]].forEach(([G, x1, x2]) => el("line", { x1, x2, y1: r.y + r.h - 2, y2: r.y + r.h - 2, stroke: c, "stroke-opacity": 0.35 }, G));
}
/* schaal: het beginjaar volgt uit de vroegste getoonde voorouder (afgerond op 50 jaar, nooit later dan 1700). Vóór 1700 telt
   een jaar maar TL_K zo breed, zodat de drukke 19e eeuw breed blijft; dat stuk heeft een lichte achtergrond en een knik-teken.
   Rasterlijnen: na 1700 elke 25 jaar (label per 50), daarvoor per 50 of, als dat te krap wordt, per 100 jaar. */
const TL_KNIK = 1700, TL_K = 0.35;
function tlScale(ps, left, right, y1) {
  const first = Math.min(1700, ...ps.map(p => yr(p.b) || (yr(p.d) - 55)).filter(Number.isFinite));
  const y0 = Math.floor(first / 50) * 50;
  const u = y => y < TL_KNIK ? (y - y0) * TL_K : (TL_KNIK - y0) * TL_K + (y - TL_KNIK);
  const k = (right - left) / u(y1), X = y => left + u(Math.max(y0, y)) * k;
  const step = 50 * TL_K * k >= 48 ? 50 : 100, ticks = [];
  for (let t = y0 + step; t < TL_KNIK; t += step) ticks.push(t);
  for (let t = TL_KNIK; t <= 2025; t += 25) if (t > y0) ticks.push(t);
  const deco = (g, top, H) => {
    if (y0 >= TL_KNIK) return;
    const r = el("rect", { x: left, y: top - 6, width: X(TL_KNIK) - left, height: H - top - 22, fill: "var(--sunk)", "fill-opacity": 0.55 }, g);
    bindTip(r, `Vóór ${TL_KNIK} is de schaal ingekort: een eeuw is daar ${Math.round(1 / TL_K * 10) / 10} keer zo smal.`);
    const x = X(TL_KNIK), y = H - 30;
    [-3, 3].forEach(d => el("line", { x1: x + d - 3, x2: x + d + 3, y1: y + 5, y2: y - 5, stroke: "var(--muted)", "stroke-width": 1.2 }, g));
  };
  return { X, ticks, deco, y0 };
}
/* knop "Alles open" / "Alles dicht" naast Per familie / Op geboortejaar */
function tlSyncAll() {
  const bar = $("#v-tijdlijn .toolbar"); if (!bar) return;
  let b = $("#tlAll");
  if (!b) { bar.querySelector(".seg").insertAdjacentHTML("afterend", `<button class="btn" id="tlAll" type="button"></button>`); b = $("#tlAll"); b.onclick = () => { const v = b.dataset.v === "open"; tlShown.forEach(([l]) => tlSetOpen(l, v)); drawTimeline(); }; }
  const can = tlShown.filter(x => x[2]), dicht = can.some(x => !x[1]);
  b.hidden = tlState.by !== "line" || !can.length;
  b.dataset.v = dicht ? "open" : "dicht";
  b.textContent = dicht ? "Alles open" : "Alles dicht";
  b.setAttribute("aria-label", dicht ? "Toon alle voorouders van elke familie" : "Toon per familie alleen de stamlijn");
}

/* ---------- verbanden tussen de bomen ---------- */
/* Alleen in de samengestelde boom: plaatsen waar voorouders van Harrie (side h) en van Alies (side a) binnen VB_GAP jaar van
   elkaar voorkomen (geboren, getrouwd, gewoond, overleden). Live berekend uit EVENTS; gemeenten tellen niet mee (te ruim).
   Eigen pagina #s-verbanden; kleine haken op de kaart en de plaatspagina. Levenden zitten niet in EVENTS (ancestors). */
const VB_GAP = 10;
VIEWS.push("verbanden"); NAV_OF.verbanden = "kaart";
if (!$("#v-verbanden")) { const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-verbanden"; sec.hidden = true; $("main").appendChild(sec); }
const vbKort = t => String(t || "").split(/ · |; /)[0].replace(/\s*\(gemeente .*\)$/, "");
/* de precieze datum bij een gebeurtenis, als die er is: geboren → b, overleden → d, getrouwd → m.d */
function vbDatum(e) {
  const p = person(e.kw); if (!p) return null;
  const t = vbKort(e.t), s = /^geboren/.test(t) ? p.b : /^overleden/.test(t) ? p.d : /^getrouwd/.test(t) && p.m ? p.m.d : null;
  return s && yr(s) === e.y ? fullDate(s) : null;
}
function verbandenData() {
  if (T.key !== "s") return [];
  const per = {};
  EVENTS.forEach(e => {
    const P = PLACES[e.p], p = person(e.kw); if (!P || P.kind === "gemeente" || !p || !p.side) return;
    (per[e.p] = per[e.p] || { h: [], a: [] })[p.side].push(e);
  });
  const out = [];
  Object.entries(per).forEach(([k, s]) => {
    if (!s.h.length || !s.a.length) return;
    let best = null; const pairs = [];
    s.h.forEach(x => s.a.forEach(y => {
      const g = Math.abs(x.y - y.y); if (g > VB_GAP) return;
      const dx = vbDatum(x), dy = vbDatum(y), dagen = dx && dy ? Math.round(Math.abs(dx - dy) / 864e5) : null;
      const r = { h: x, a: y, g, dagen }; pairs.push(r);
      if (!best || g < best.g || (g === best.g && (dagen ?? 1e9) < (best.dagen ?? 1e9))) best = r;
    }));
    if (!best) return;
    const kwH = new Set(pairs.map(r => r.h.kw)), kwA = new Set(pairs.map(r => r.a.kw));
    out.push({ k, best, n: kwH.size + kwA.size, h: s.h, a: s.a, kwH, kwA, van: Math.min(...pairs.map(r => Math.min(r.h.y, r.a.y))), tot: Math.max(...pairs.map(r => Math.max(r.h.y, r.a.y))) });
  });
  return out.sort((x, y) => x.best.g - y.best.g || (x.best.dagen ?? 1e9) - (y.best.dagen ?? 1e9) || y.n - x.n || x.van - y.van);
}
function vbAfstand(b) {
  if (b.dagen !== null && b.g === 0 && b.dagen < 60) return b.dagen === 0 ? "op dezelfde dag" : b.dagen === 1 ? "één dag na elkaar" : `${b.dagen} dagen na elkaar`;
  if (b.g === 0) return "in hetzelfde jaar";
  return b.g === 1 ? "één jaar na elkaar" : `${b.g} jaar na elkaar`;
}
function vbWie(e) {
  const p = person(e.kw);
  return `<button class="link" data-open="${e.kw}">${esc(p.n)}</button> <span class="small">(${esc(vbKort(e.t))}, ${e.y})</span>`;
}
function vbStrook(r, y0, y1) {
  const W = 600, H = 34, x = y => ((y - y0) / (y1 - y0)) * W;
  const tick = (e, side) => `<line x1="${x(e.y).toFixed(1)}" x2="${x(e.y).toFixed(1)}" y1="${side === "h" ? 4 : 19}" y2="${side === "h" ? 15 : 30}" class="vb-t vb-${side}"><title>${esc(person(e.kw).n)}: ${esc(vbKort(e.t))}, ${e.y}</title></line>`;
  const lo = Math.min(r.best.h.y, r.best.a.y), hi = Math.max(r.best.h.y, r.best.a.y);
  return `<svg class="vb-strook" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Tijdstrook ${esc(placeName(r.k))}">
    <rect x="${(x(lo) - 4).toFixed(1)}" y="1" width="${(x(hi) - x(lo) + 8).toFixed(1)}" height="${H - 2}" rx="3" class="vb-win"/>
    <line x1="0" x2="${W}" y1="17" y2="17" class="vb-as"/>${r.h.map(e => tick(e, "h")).join("")}${r.a.map(e => tick(e, "a")).join("")}</svg>`;
}
function renderVerbanden() {
  const host = $("#v-verbanden");
  if (T.key !== "s") { /* de pagina hoort bij de boom van de kinderen: doorschakelen (vervangt het adres in de geschiedenis) */
    rendered.verbanden = false;
    if (TREES.s && setTree("s")) { go("verbanden", { replace: true }); return; }
    host.innerHTML = `<p class="lede">Deze pagina hoort bij de stamboom van de kinderen van Harrie en Alies.</p>`;
    return;
  }
  const L = verbandenData();
  const y0 = Math.floor(Math.min(...L.map(r => Math.min(...r.h.map(e => e.y), ...r.a.map(e => e.y)))) / 50) * 50, y1 = 2000;
  const kaart = () => {
    const svg = el("svg", { viewBox: `0 0 ${MW} ${MH}`, role: "img", "aria-label": "Kaart van de plaatsen waar beide families voorkwamen" });
    drawBase(svg, true);
    L.slice().reverse().forEach(r => {
      const P = PLACES[r.k], [cx, cy] = proj(P.la, P.lo), rad = 5 + Math.min(10, r.n * 0.8);
      const g = el("g", { class: "vb-dot" }, svg);
      el("path", { d: `M${cx} ${cy - rad}A${rad} ${rad} 0 0 0 ${cx} ${cy + rad}Z`, class: "vb-h" }, g);
      el("path", { d: `M${cx} ${cy - rad}A${rad} ${rad} 0 0 1 ${cx} ${cy + rad}Z`, class: "vb-a" }, g);
      el("circle", { cx, cy, r: rad, class: "vb-ring" }, g);
      clickable(g, () => { const row = $("#vb-" + slug(r.k)); if (row) { row.scrollIntoView({ behavior: "smooth", block: "center" }); row.classList.add("vb-hl"); setTimeout(() => row.classList.remove("vb-hl"), 1600); } }, placeName(r.k));
      bindTip(g, `<b>${esc(placeName(r.k))}</b><br>${esc(vbAfstand(r.best))}, ${Math.min(r.best.h.y, r.best.a.y)}`);
    });
    /* namen bij de acht dichtste ontmoetingen: niet over een stip of een andere naam; past het nergens, dan geen naam (de tooltip noemt hem) */
    const dots = L.map(r => { const P = PLACES[r.k], [cx, cy] = proj(P.la, P.lo), rad = 5 + Math.min(10, r.n * 0.8); return [cx - rad, cy - rad, cx + rad, cy + rad]; });
    const boxes = [];
    L.slice(0, 8).forEach(r => {
      const P = PLACES[r.k], [cx, cy] = proj(P.la, P.lo), rad = 5 + Math.min(10, r.n * 0.8), nm = placeName(r.k), w = nm.length * 6.6, d = rad + 3;
      const opts = [[cx + d, cy + 4, "start"], [cx - d, cy + 4, "end"], [cx, cy - d - 2, "middle"], [cx, cy + d + 11, "middle"],
        [cx + d - 2, cy - d, "start"], [cx + d - 2, cy + d + 9, "start"], [cx - d + 2, cy - d, "end"], [cx - d + 2, cy + d + 9, "end"]];
      const bx = ([x, y, a]) => { const l = a === "start" ? x : a === "end" ? x - w : x - w / 2; return [l, y - 10, l + w, y + 2]; };
      const hit = b => [...boxes, ...dots].some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
      const o = opts.find(c => !hit(bx(c))); if (!o) return; boxes.push(bx(o));
      txt(svg, o[0], o[1], nm, { "font-size": 12, "text-anchor": o[2], class: "vb-lbl" });
    });
    /* inzoomen op de plaatsen, met wat ruimte eromheen */
    const pts = L.map(r => proj(PLACES[r.k].la, PLACES[r.k].lo)), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    let x0 = Math.min(...xs) - 70, x1 = Math.max(...xs) + 70, yy0 = Math.min(...ys) - 60, yy1 = Math.max(...ys) + 60;
    const w = Math.max(x1 - x0, 360), h = Math.max(yy1 - yy0, w * 0.75), cx = (x0 + x1) / 2, cy = (yy0 + yy1) / 2;
    svg.setAttribute("viewBox", `${(cx - w / 2).toFixed(0)} ${(cy - h / 2).toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}`);
    return svg;
  };
  host.innerHTML = `
    <div class="eyebrow"><button class="link" data-go="kaart">Kaart</button> › Waar de families elkaar kruisten</div>
    <h1 class="page-title">Waar de families elkaar kruisten</h1>
    <p class="lede">Harrie en Alies hebben, voor zover bekend, geen gemeenschappelijke voorouders. Toch woonden hun families vaak in dezelfde dorpen. Hier staan de ${L.length} plaatsen waar voorouders van beide kanten binnen ${VB_GAP} jaar van elkaar voorkomen: geboren, getrouwd, wonend of overleden. Bovenaan de dichtste ontmoetingen.</p>
    <p class="small">${sideTag("h")} en ${sideTag("a")} · Een gedeelde plaats en tijd betekent niet dat de families elkaar kenden. <button class="link" data-go="verhaal-buren">Lees het verhaal Buren zonder het te weten</button></p>
    <div class="vb-grid">
      <div class="pane vb-map" id="vbMap"></div>
      <ol class="vb-list">${L.map(r => `<li id="vb-${slug(r.k)}">
        <div class="vb-kop"><button class="link vb-pl" data-go="${slug(r.k)}">${esc(placeName(r.k))}</button><span class="vb-af">${esc(vbAfstand(r.best))}</span><span class="small">${r.van === r.tot ? r.van : r.van + "–" + r.tot} · ${r.kwH.size + r.kwA.size} voorouders</span></div>
        ${vbStrook(r, y0, y1)}
        <p class="vb-paar"><span class="vb-pt vb-pt-h" aria-label="kant van Harrie"></span>${vbWie(r.best.h)}<br><span class="vb-pt vb-pt-a" aria-label="kant van Alies"></span>${vbWie(r.best.a)}</p>
      </li>`).join("")}</ol>
    </div>
    <p class="small vb-as-leg">Tijdstrook van ${y0} tot ${y1}: boven de lijn de kant van Harrie, eronder die van Alies; het vak markeert de dichtste ontmoeting.</p>`;
  $("#vbMap").appendChild(kaart());
}
RENDER.verbanden = renderVerbanden;
/* haken: knop op de kaart, regel op de plaatspagina (alleen in de samengestelde boom) */
{
  const kaartOrig = RENDER.kaart, plaatsOrig = RENDER.plaats;
  RENDER.kaart = (...a) => {
    kaartOrig(...a);
    const old = $("#vbKnop"); if (old) old.remove();
    if (T.key === "s") $("#v-kaart .lede").insertAdjacentHTML("afterend", `<p id="vbKnop"><button class="btn" data-go="verbanden">Waar de families elkaar kruisten</button></p>`);
  };
  RENDER.plaats = key => {
    plaatsOrig(key);
    if (T.key !== "s") return;
    const r = verbandenData().find(x => x.k === key); if (!r) return;
    const t = $("#v-plaats .page-title"); if (t) t.insertAdjacentHTML("afterend", `<p class="vb-hier"><span>De families van</span> ${sideTag("h")} <span>en</span> ${sideTag("a")} <span>kwamen hier ${esc(vbAfstand(r.best))} voor (${Math.min(r.best.h.y, r.best.a.y)}).</span></p>${ovMore(`data-go="verbanden"`, "Alle plaatsen waar de families elkaar kruisten")}`);
  };
}

/* ---------- een leven in één zin ---------- */
/* data/24-kort.js: KORT["<kw>"] (Harrie) of KORT["a-<kw>"] (Alies). Levenden nooit, ook niet als er per vergissing een zin staat.
   Bij kwartierverlies geldt de zin van het volledige record (aliasOf); in de samengestelde boom de oorspronkelijke sleutel. */
function kortZin(p) {
  if (!p || p.living || typeof KORT === "undefined") return "";
  const kw = p.aliasOf || p.kw, q = person(kw) || p;
  const key = T.key === "s" ? (q.side === "a" ? "a-" : "") + q.origKw : T.prefix + kw;
  const z = KORT[key];
  return z ? `<p class="kort">${esc(z)}</p>` : "";
}

/* ---------- verwantschap ---------- */
/* Route #verwant (in elke boom): (1) "Hoe ben ik familie?": de bezoeker kiest de voorouder van wie hij afstamt en hoeveel
   generaties hij eronder staat; (2) "Hoe zijn twee personen verbonden?". Alles volgt uit de kwartiernummers: de ouders van k
   zijn 2k en 2k+1, dus de gemeenschappelijke afstammeling van twee personen is hun gemeenschappelijke binaire voorvoegsel
   (vwMeet). Kwartierverlies: één persoon kan op meer nummers staan (ALIAS_OF/ALIASES); vwUp loopt daarom over personen en
   springt tussen hun nummers. Benamingen uit relBase en GEN_NAME (model), het bewijs per stap uit stapSt (zwakste schakel).
   Levenden: alleen de naam; ze zijn geen keuze als voorouder, behalve de hoofdpersoon (kw 1). */
VIEWS.push("verwant"); NAV_OF.verwant = "personen";
if (!$("#v-verwant")) { const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-verwant"; sec.hidden = true; $("main").appendChild(sec); }
const vwState = { tree: null, anc: null, d: 3, dSet: false, x: null, y: null };
const VW_MAXD = 14;
const VW_NUM = ["", "één", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen", "tien", "elf", "twaalf", "dertien", "veertien"];
const VW_ORD = ["", "eerste", "tweede", "derde", "vierde", "vijfde", "zesde", "zevende", "achtste", "negende", "tiende", "elfde", "twaalfde", "dertiende", "veertiende"];
const vwOrd = n => VW_ORD[n] || n + "e";
const vwId = kw => ALIAS_OF[kw] || kw;
const vwG = (sx, m, v) => sx === "m" ? m : sx === "v" ? v : m + " of " + v;
const vwCap = s => s.charAt(0).toUpperCase() + s.slice(1);
const vwSx = kw => kw === 1 ? (T.key === "s" ? null : T.rootMale ? "m" : "v") : kw % 2 ? "v" : "m";
const vwNm = kw => { const p = person(kw); return !p ? "kw " + kw : kw === 1 && T.key === "s" ? T.rootFull : p.living ? firstName(p) : p.n; };
const vwLabel = kw => { const p = person(kw); return !p ? "" : p.living ? vwNm(kw) : `${p.n} (${lifeYears(p)})`; };
const vwWho = kw => { const pl = T.key === "s" && kw === 1, nm = kw === 1 ? (pl ? T.rootFull : T.root) : firstName(person(kw)); return { kw, name: nm, obj: nm, poss: pl ? "hun" : vwSx(kw) === "m" ? "zijn" : "haar", sx: vwSx(kw), pl }; };
const VW_YOU = { name: "jij", obj: "jou", poss: "jouw", sx: null, you: true };
const vwIs = P => P.you ? "bent" : P.pl ? "zijn" : "is";
/* n generaties omlaag: kind, kleinkind, achterkleinkind … (sx "m": zoon, "v": dochter; pl: meervoud) */
function vwDown(n, sx, pl) {
  if (n > 4) return `afstammeling${pl ? "en" : ""} in de ${vwOrd(n)} generatie`;
  return ["", "", "klein", "achterklein", "achter-achterklein"][n] + (pl ? "kinderen" : sx === "m" ? "zoon" : sx === "v" ? "dochter" : "kind");
}
/* n generaties omhoog: relBase (vader, grootmoeder …) of zonder geslacht het enkelvoud uit GEN_NAME (ouder, grootouder …) */
const vwUpT = (n, sx) => sx ? relBase(n, sx === "m" ? 2 : 3) : (GEN_NAME[n + 1] || "voorouders").replace(/s$/, "");
/* de dichtstbijzijnde gemeenschappelijke afstammeling: het gemeenschappelijke binaire voorvoegsel */
function vwMeet(a, b) { while (a !== b) { if (a > b) a >>= 1; else b >>= 1; } return a; }
/* alle voorouders van persoon kw, ook langs kwartierverlies: Map id → wegen; een weg = nummers van de voorouder omlaag tot kw */
const VW_UP = {};
function vwUp(kw) {
  const key = T.key + ":" + vwId(kw); if (VW_UP[key]) return VW_UP[key];
  const res = new Map(); let front = [[vwId(kw)]];
  for (let n = 1; front.length && n <= 24; n++) {
    const next = [];
    front.forEach(path => {
      const k = path[0], seen = new Set();
      [k, ...twinKws(k)].forEach(t => [2 * t, 2 * t + 1].forEach(q => {
        if (!BY.has(q)) return; const id = vwId(q); if (seen.has(id)) return; seen.add(id);
        const o = 2 * k + (q & 1), w = [BY.has(o) && vwId(o) === id ? o : q, ...path]; /* liefst de ouder van het eigen nummer */
        const L = res.get(id) || []; if (L.length < 8) L.push(w); res.set(id, L);
        next.push(w);
      }));
    });
    front = next.slice(0, 6000);
  }
  return VW_UP[key] = res;
}
/* hoe P en Q verwant zijn als P g en Q d generaties onder dezelfde voorouder staan (g of d = 0: rechte lijn) */
function vwKin(g, d, P, Q) {
  const r = { deg: g + d, artP: "een", artQ: "een", shift: "", line: "", why: "" };
  if (!g || !d) { const up = !g, n = g || d; return Object.assign(r, { direct: true, pq: up ? vwUpT(n, P.sx) : vwDown(n, P.sx), qp: up ? vwDown(n, Q.sx) : vwUpT(n, Q.sx), artP: up ? "de" : "een", artQ: up ? "een" : "de" }); }
  const m = Math.min(g, d), n = Math.max(g, d);
  if (n === 1) return Object.assign(r, { pq: vwG(P.sx, "broer", "zus"), qp: vwG(Q.sx, "broer", "zus"), why: `${vwCap(P.name)} en ${Q.name} hebben een ouder gemeen.` });
  if (m === 1) { /* E staat één generatie onder de voorouder: broer of zus van een voorouder van de ander */
    const pE = g === 1, E = pE ? P : Q, Y = pE ? Q : P;
    const eT = n === 2 ? vwG(E.sx, "oom", "tante") : n === 3 ? vwG(E.sx, "oudoom", "oudtante") : n === 4 ? vwG(E.sx, "overoudoom", "overoudtante") : `${vwG(E.sx, "broer", "zus")} van een ${vwUpT(n - 1)}`;
    const yT = n === 2 ? vwG(Y.sx, "neef", "nicht") : n === 3 ? vwG(Y.sx, "achterneef", "achternicht") : n === 4 ? vwG(Y.sx, "achter-achterneef", "achter-achternicht") : `${vwDown(n - 1, Y.sx)} van een broer of zus`;
    return Object.assign(r, { pq: pE ? eT : yT, qp: pE ? yT : eT, why: `${vwCap(E.name)} ${vwIs(E)} ${vwG(E.sx, "broer", "zus")} van een ${vwUpT(n - 1)} van ${Y.obj}.` });
  }
  const c = m - 1, sh = n - m;
  const t = sx => c === 1 ? vwG(sx, "neef", "nicht") : c === 2 ? vwG(sx, "achterneef", "achternicht") : c === 3 ? vwG(sx, "achter-achterneef", "achter-achternicht") : vwG(sx, "verre neef", "verre nicht");
  return Object.assign(r, { pq: t(P.sx), qp: t(Q.sx), shift: sh ? `${VW_NUM[sh] || sh} generatie${sh > 1 ? "s" : ""} verschoven` : "",
    line: `neven en nichten in de ${vwOrd(c)} lijn`, why: `Een ${vwUpT(g - 1)} van ${P.obj} en een ${vwUpT(d - 1)} van ${Q.obj} waren broers of zussen van elkaar.` });
}
const vwDegHtml = (deg, sub) => `<p class="vw-deg"><span class="vw-num">${deg}</span><span><b>Bloedverwant in de ${vwOrd(deg)} graad</b><small>${sub}</small></span></p>`;
/* schema: personen (kw) of open vakken (ghost) met de verbindingslijn en het bewijslabel van de stap */
function vwBox(n) {
  if (n.kw) { const p = person(n.kw); return `<button class="vw-node${n.cls ? " " + n.cls : ""}" data-open="${n.kw}"><b>${esc(vwNm(n.kw))}</b><small>${p && !p.living ? esc(lifeYears(p)) + " · " : ""}kw ${n.kw}</small></button>`; }
  return `<div class="vw-node vw-ghost${n.me ? " vw-me" : ""}"><b>${esc(n.t)}</b>${n.sub ? `<small>${esc(n.sub)}</small>` : ""}</div>`;
}
const vwEdge = (st, ghost) => `<span class="vw-edge${ghost ? " dash" : ""}" aria-hidden="${st ? "false" : "true"}">${st ? stTag(st) : ""}</span>`;
const vwLeg = (nodes, rise) => `<ol class="vw-leg${rise ? " rise" : ""}">${nodes.map(n => `<li>${rise ? vwBox(n) + vwEdge(n.tag) : vwEdge(n.tag, n.ghost) + vwBox(n)}</li>`).join("")}</ol>`;
const vwFork = (top, legs) => `<div class="vw-fork" role="group" aria-label="Schema: de gedeelde voorouder bovenaan, de takken eronder"><div class="vw-top">${vwBox(Object.assign({ cls: "vw-anc" }, top))}</div><div class="vw-legs${legs.length === 1 ? " one" : ""}">${legs.map(l => vwLeg(l)).join("")}</div></div>`;
const vwJoin = (lx, ly, c) => `<div class="vw-join" role="group" aria-label="Schema: twee takken omlaag, het huwelijk, en de gemeenschappelijke afstammeling"><div class="vw-legs">${vwLeg(lx, true)}${vwLeg(ly, true)}</div><div class="vw-wed"><span>⚭ getrouwd</span></div><div class="vw-top">${vwBox({ kw: c, cls: "vw-anc" })}</div></div>`;
/* een weg (nummers van boven naar beneden) als schematak onder de top; het label hoort bij de stap van de bovenste naar de volgende */
const vwWayLeg = (w, endCls) => w.slice(1).map((k, i) => ({ kw: k, tag: stapSt(w[i]), cls: i === w.length - 2 ? endCls : "" }));
/* de zwakste stap uit een lijst stappen [ouder, kind] */
function vwWeak(steps) {
  const L = steps.map(([u, l]) => ({ u, l, s: stapSt(u) })).filter(e => e.s && e.s in ST_RANK);
  if (!L.length) return "";
  const w = L.reduce((a, e) => ST_RANK[e.s] > ST_RANK[a.s] ? e : a, L[0]), n = L.filter(e => e.s === w.s).length;
  if (w.s === "A") return `<p class="vw-weak small">${stTag("A")} Elke stap in dit pad staat in een akte.</p>`;
  const kind = person(w.l), ouder = person(w.u), wl = vwWho(w.l);
  return `<p class="vw-weak small"><span class="lbl">Zwakste stap:</span> <button class="link" data-open="${w.l}">${esc(vwNm(w.l))}</button> → <button class="link" data-open="${w.u}">${esc(firstName(ouder))}</button>, ${wl.poss} ${isMale(w.u) ? "vader" : "moeder"} ${stTag(w.s, true)}${n > 1 ? ` (nog ${n - 1} ${n > 2 ? "stappen" : "stap"} met hetzelfde label)` : ""}<br>${esc(schakelReden(ouder, w.s, kind))}</p>`;
}
const vwSteps = w => w.slice(0, -1).map((k, i) => [k, w[i + 1]]);

/* deel 1: de bezoeker stamt d generaties af van persoon a */
function vwDefD(kw) { const w = vwUp(1).get(vwId(kw)); return w ? Math.min(VW_MAXD, Math.max(1, w[0].length - 1)) : 1; }
function vwYouLeg(af, d) {
  const g = i => ({ ghost: true, t: vwCap(vwDown(i)), sub: `van ${af}` });
  const L = d <= 5 ? Array.from({ length: d - 1 }, (_, i) => g(i + 1)) : [g(1), { ghost: true, t: "…", sub: `nog ${VW_NUM[d - 3] || d - 3} generaties` }, g(d - 1)];
  return L.concat({ ghost: true, me: true, t: "jij", sub: vwDown(d) });
}
function vwMineCards(S, aid, d) {
  const A = person(aid), af = firstName(A), aP = vwSx(aid) === "m" ? "zijn" : "haar";
  const head = `<div class="eyebrow">Jij en ${esc(S.name)}</div>`;
  if (aid === vwId(S.kw)) {
    const who = S.pl ? T.rootFull.replace(/ en ([^ ]+)$/, " of $1") : S.name;
    return [`<article class="vw-card">${head}<h3 class="vw-term">${esc(vwCap(vwDown(d)))}</h3>
      <p>Jij bent een ${esc(vwDown(d))} van ${esc(who)}${S.pl ? "" : `; ${esc(S.name)} is jouw ${esc(vwUpT(d, S.sx))}`}. Jullie staan in een rechte lijn.</p>
      ${vwDegHtml(d, `${d} ${d > 1 ? "geboorten" : "geboorte"} van ${esc(S.pl ? "een van hen" : S.name)} naar jou`)}
      ${vwFork({ kw: S.kw }, [vwYouLeg(af, d)])}</article>`];
  }
  const ways = (vwUp(S.kw).get(aid) || []).slice(0, 4);
  return ways.map((w, i) => {
    const g = w.length - 1, k = vwKin(g, d, S, VW_YOU);
    return `<article class="vw-card">${head.replace("</div>", ways.length > 1 ? ` · weg ${i + 1}</div>` : "</div>")}
      <h3 class="vw-term">${esc(vwCap(k.qp))}${k.shift ? `<span>${esc(k.shift)}</span>` : ""}</h3>
      <p>Jullie delen ${esc(vwUpT(g, vwSx(aid)))} <button class="link" data-open="${w[0]}">${esc(A.n)}</button> (${esc(lifeYears(A))}, kw ${w[0]}). ${esc(vwCap(S.name))} ${vwIs(S)} ${aP} ${esc(vwDown(g, S.sx, S.pl))}, jij bent ${aP} ${esc(vwDown(d))}.</p>
      <p>${esc(vwCap(S.name))} ${vwIs(S)}${S.pl ? " elk" : ""} ${k.artP} ${esc(k.pq)} van jou; jij bent ${k.artQ} ${esc(k.qp)} van ${esc(S.obj)}${k.shift ? ", " + esc(k.shift) : ""}.</p>
      ${k.why || k.line ? `<p class="small vw-why">${esc(k.why)}${k.line ? ` In vaktaal: ${esc(k.line)}${k.shift ? ", " + esc(k.shift) : ""}.` : ""}</p>` : ""}
      ${vwDegHtml(k.deg, `${g} ${g > 1 ? "geboorten" : "geboorte"} van ${esc(af)} naar ${esc(S.name)}, ${d} naar jou`)}
      ${vwFork({ kw: w[0] }, [vwWayLeg(w, "vw-end"), vwYouLeg(af, d)])}
      ${vwWeak(vwSteps(w))}</article>`;
  });
}
function vwMine() {
  const out = $("#vwOut1"); if (!out) return;
  const a = vwState.anc, d = vwState.d, A = a ? person(a) : null;
  if (!A || (A.living && a !== 1)) {
    const ex = all.filter(p => !p.living && p.kw >= (T.key === "s" ? 8 : 4) && p.kw < (T.key === "s" ? 16 : 8));
    out.innerHTML = `<p class="small vw-hint">${ex.length ? `Bijvoorbeeld: ${ex.map(p => `<button class="chip" data-vwanc="${p.kw}">${esc(p.n)}</button>`).join(" ")}` : ""}</p>`;
    return;
  }
  const aid = vwId(a), af = firstName(A);
  const subj = [vwWho(1)].concat(T.key === "s" ? [2, 3].filter(k => vwUp(k).has(aid)).map(vwWho) : []);
  const ways = vwUp(1).get(aid) || [];
  let h = "";
  if (ways.length > 1) h += `<p class="stnote implex"><b>Langs ${VW_NUM[ways.length] || ways.length} wegen verwant.</b> ${esc(A.n)} staat ${VW_NUM[ways.length] || ways.length} keer in de stamboom (kwartierverlies: ${ways.map(w => "kw " + w[0]).join(", ")}). ${new Set(ways.map(w => w.length)).size === 1 ? "Langs elke weg is de afstand even groot, maar jullie zijn dubbel verwant." : "Langs de ene weg zijn jullie nauwer verwant dan langs de andere."} <button class="link" data-go="${implexStory(A.side)}">Over kwartierverlies</button></p>`;
  h += `<div class="vw-cards">${subj.flatMap(S => vwMineCards(S, aid, d)).join("")}</div>`;
  const notes = [];
  if (aid !== 1) {
    const kids = [...new Set(ways.map(w => w[1]).filter(Boolean).map(vwId))];
    if (kids.length) notes.push(`Dit klopt als je afstamt van een ander kind van ${esc(af)} dan ${kids.map(k => esc(vwNm(k))).join(" of ")}. ${kids.map(k => person(k).living ? `Stam je af van ${esc(vwNm(k))}? Dan ben je nauwer verwant dan hier staat.` : `Stam je af van ${esc(firstName(person(k)))}? <button class="link" data-vwanc="${k}">Kies dan ${isMale(k) ? "hem" : "haar"}</button>: de gedeelde voorouder is dan dichterbij.`).join(" ")}`);
    const sp = aid > 1 ? person(aid ^ 1) : null;
    if (sp) notes.push(`${esc(af)} trouwde met <button class="link" data-open="${aid ^ 1}">${esc(vwNm(aid ^ 1))}</button>. De uitkomst gaat ervan uit dat je van hen allebei afstamt. Stam je af van een ander huwelijk van ${esc(af)}, dan is het een halfverwantschap (zoals halfneef of halfnicht), met dezelfde graad.`);
  }
  notes.push(`Jouw eigen stappen naar ${esc(af)} staan niet in deze stamboom; die weet je zelf. Het bewijs geldt alleen voor de stappen naar ${esc(T.key === "s" ? T.rootFull : T.root)}.`);
  h += `<div class="vw-notes">${notes.map(n => `<p class="small">${n}</p>`).join("")}</div>`;
  out.innerHTML = h;
}

/* deel 2: twee personen uit de stamboom */
function vwPairHtml(x, y) {
  const ix = vwId(x), iy = vwId(y), X = vwWho(ix), Y = vwWho(iy);
  X.name = X.obj = vwNm(ix); Y.name = Y.obj = vwNm(iy);
  if (ix === iy) { const tw = twinKws(ix); return `<p class="vw-hint">Dat is twee keer dezelfde persoon${tw.length ? ` (ook kw ${tw.join(", ")}: kwartierverlies)` : ""}.</p>`; }
  const upX = vwUp(ix), upY = vwUp(iy);
  /* rechte lijn: de een is voorouder van de ander */
  const lin = upX.has(iy) ? [Y, X, upX.get(iy)] : upY.has(ix) ? [X, Y, upY.get(ix)] : null;
  if (lin) {
    const [O, J, ways] = lin, k0 = ways[0].length - 1, k = vwKin(0, k0, O, J);
    const more = ways.length > 1 ? `<p class="stnote implex"><b>Langs ${VW_NUM[ways.length] || ways.length} wegen.</b> Door kwartierverlies staat ${esc(O.name)} ${ways.length} keer boven ${esc(J.name)}: ${ways.map(w => `als ${esc(vwUpT(w.length - 1, O.sx))} (kw ${w[0]})`).join(" en ")}.</p>` : "";
    return `<article class="vw-card"><div class="eyebrow">Rechte lijn</div><h3 class="vw-term">${esc(vwCap(k.pq))}</h3>
      <p>${esc(O.name)} is de ${esc(k.pq)} van ${esc(J.obj)}; ${esc(J.name)} ${vwIs(J)}${J.pl ? " elk" : ""} een ${esc(k.qp)} van ${esc(firstName(person(O.kw)))}.</p>
      ${more}${vwDegHtml(k0, `${k0} ${k0 > 1 ? "geboorten" : "geboorte"} van ${esc(firstName(person(O.kw)))} naar ${esc(J.name)}`)}
      ${vwFork({ kw: ways[0][0] }, [vwWayLeg(ways[0], "vw-end")])}${vwWeak(vwSteps(ways[0]))}</article>`;
  }
  let h = "";
  /* bloedverwant via kwartierverlies: een gemeenschappelijke voorouder */
  let best = null;
  upX.forEach((wx, id) => { const wy = upY.get(id); if (!wy) return; const s = wx[0].length + wy[0].length; if (!best || s < best.s) best = { s, ids: [id] }; else if (s === best.s) best.ids.push(id); });
  if (best) {
    const id = best.ids[0], wx = upX.get(id)[0], wy = upY.get(id)[0], gx = wx.length - 1, gy = wy.length - 1, k = vwKin(gx, gy, X, Y);
    const names = best.ids.map(i => `<button class="link" data-open="${i}">${esc(vwNm(i))}</button>`).join(" en ");
    h += `<article class="vw-card"><div class="eyebrow">Bloedverwant · door kwartierverlies</div><h3 class="vw-term">${esc(vwCap(k.pq))}${k.shift ? `<span>${esc(k.shift)}</span>` : ""}</h3>
      <p>${esc(X.name)} en ${esc(Y.name)} hebben ${best.ids.length > 1 ? "gemeenschappelijke voorouders" : "een gemeenschappelijke voorouder"}: ${names}. Die ${best.ids.length > 1 ? "staan" : "staat"} langs twee lijnen in de stamboom.</p>
      <p>${esc(X.name)} ${vwIs(X)}${X.pl ? " elk" : ""} ${k.artP} ${esc(k.pq)} van ${esc(Y.obj)}; ${esc(Y.name)} ${vwIs(Y)} ${k.artQ} ${esc(k.qp)} van ${esc(X.obj)}${k.shift ? ", " + esc(k.shift) : ""}.</p>
      ${k.why || k.line ? `<p class="small vw-why">${esc(k.why)}${k.line ? ` In vaktaal: ${esc(k.line)}${k.shift ? ", " + esc(k.shift) : ""}.` : ""}</p>` : ""}
      ${vwDegHtml(k.deg, `${gx} ${gx > 1 ? "geboorten" : "geboorte"} naar ${esc(X.name)}, ${gy} naar ${esc(Y.name)}`)}
      ${vwFork({ kw: wx[0] }, [vwWayLeg(wx, "vw-end"), vwWayLeg(wy, "vw-end")])}${vwWeak(vwSteps(wx).concat(vwSteps(wy)))}</article>`;
  }
  /* in de stamboom: de dichtstbijzijnde gemeenschappelijke afstammeling en het huwelijk dat de twee takken verbindt */
  let bp = null;
  [ix, ...twinKws(ix)].forEach(px => [iy, ...twinKws(iy)].forEach(py => { if (px >> (gen(px) - gen(py)) === py || py >> (gen(py) - gen(px)) === px) return; const c = vwMeet(px, py), len = gen(px) + gen(py) - 2 * gen(c); if (!bp || len < bp.len) bp = { px, py, c, len }; }));
  if (!bp) return h;
  const { px, py, c } = bp, cx = px >> (gen(px) - gen(c) - 1), cy = py >> (gen(py) - gen(c) - 1), kx = gen(px) - gen(cx), ky = gen(py) - gen(cy);
  const chain = (from, to) => { const r = []; for (let k = from; k >= to; k >>= 1) r.push(k); return r; };
  const lx = chain(px, cx), ly = chain(py, cy), nx = vwNm(cx), ny = vwNm(cy);
  const of = (k, n, who) => `${vwDown(n, vwSx(k))} van ${who}`;
  const wed = !kx && !ky ? `${esc(X.name)} en ${esc(Y.name)} waren met elkaar getrouwd.`
    : !kx ? `${esc(X.name)} trouwde met ${esc(ny)}, een ${esc(of(cy, ky, Y.name))}.`
    : !ky ? `${esc(Y.name)} trouwde met ${esc(nx)}, een ${esc(of(cx, kx, X.name))}.`
    : kx === ky ? `Hun ${esc(vwDown(kx, null, true))} trouwden met elkaar: ${esc(nx)}, ${esc(of(cx, kx, X.name))}, en ${esc(ny)}, ${esc(of(cy, ky, Y.name))}.`
    : `${esc(vwCap(nx))}, een ${esc(of(cx, kx, X.name))}, trouwde met ${esc(ny)}, een ${esc(of(cy, ky, Y.name))}.`;
  const cn = c === 1 && T.key === "s" ? T.rootFull : vwNm(c);
  const cw = c === 1 && T.key === "s" ? "zijn de kinderen" : `is de ${isMale(c) ? "zoon" : "dochter"}`;
  h += `<article class="vw-card"><div class="eyebrow">${best ? "En zo staan ze in de stamboom" : "Aangetrouwd"}</div>
    <h3 class="vw-term">${best ? "Ook aangetrouwd" : "Geen bloedverwanten"}</h3>
    ${best ? "" : `<p>${esc(X.name)} en ${esc(Y.name)} hebben in deze stamboom geen gemeenschappelijke voorouder: ze zijn geen bloedverwanten, voor zover de stamboom laat zien. Ze zijn aangetrouwd.</p>`}
    <p>${wed} ${esc(vwCap(cn))} ${cw} van ${esc(nx)} en ${esc(ny)}: de dichtstbijzijnde gemeenschappelijke afstammeling van ${esc(X.name)} en ${esc(Y.name)} (kw ${c}).</p>
    ${vwJoin(lx.map((k, i) => ({ kw: k, tag: stapSt(k), cls: i ? "" : "vw-end" })), ly.map((k, i) => ({ kw: k, tag: stapSt(k), cls: i ? "" : "vw-end" })), c)}
    ${vwWeak(lx.map(k => [k, k >> 1]).concat(ly.map(k => [k, k >> 1])))}</article>`;
  return h;
}
function vwPair() {
  const out = $("#vwOut2"); if (!out) return;
  const { x, y } = vwState;
  if (x && y && person(x) && person(y)) { out.innerHTML = vwPairHtml(x, y); return; }
  const ex = [[8, 10]];
  if (T.key === "s") ex.push([8, 12]);
  const ak = Object.keys(ALIAS_OF).map(Number).sort((a, b) => a - b).find(k => BY.has(k >> 1) && BY.has(ALIAS_OF[k] >> 1) && vwId(k >> 1) !== vwId(ALIAS_OF[k] >> 1) && !vwUp(k >> 1).has(vwId(ALIAS_OF[k] >> 1)) && !vwUp(ALIAS_OF[k] >> 1).has(vwId(k >> 1)));
  if (ak) ex.push([ak >> 1, ALIAS_OF[ak] >> 1]);
  out.innerHTML = `<p class="small vw-hint">Bijvoorbeeld: ${ex.filter(e => person(e[0]) && person(e[1])).map(e => `<button class="chip" data-vwpair="${e[0]},${e[1]}">${esc(firstName(person(e[0])))} en ${esc(firstName(person(e[1])))}</button>`).join(" ")}</p>`;
}

/* zoekveld met suggesties (combobox): naam, roepnaam, andere schrijfwijze, jaartallen of kw-nummer */
let VW_CAND = null;
function vwFind(q, onlyAnc) {
  if (!VW_CAND || VW_CAND.t !== T.key) VW_CAND = { t: T.key, list: all.map(p => ({ kw: p.kw, p, ks: [p.kw, ...twinKws(p.kw)].map(String), s: norm([vwNm(p.kw), p.n, p.roep, p.alt, p.living ? "" : lifeYears(p)].join(" ")) })) };
  const toks = norm(q).replace(/\bkw\s*/g, "").split(/[\s,()–-]+/).filter(Boolean); if (!toks.length) return [];
  return VW_CAND.list.filter(c => (!onlyAnc || !c.p.living || c.kw === 1) && toks.every(t => /^\d+$/.test(t) ? c.ks.includes(t) || c.s.includes(t) : c.s.includes(t)))
    .map(c => [toks.some(t => c.ks.includes(t)) ? 0 : norm(c.p.n).startsWith(toks[0]) ? 1 : 2, c]).sort((a, b) => a[0] - b[0] || a[1].kw - b[1].kw).slice(0, 8).map(x => x[1]);
}
/* na een keuze met de hand: de uitkomst in beeld als die onder de rand valt; op een aanraakscherm het toetsenbord dicht */
function vwShow(outId) {
  const o = $("#" + outId); if (!o || !o.querySelector(".vw-card")) return;
  const r = o.getBoundingClientRect(), vast = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vast")) || 0;
  if (r.top > innerHeight - 140) scrollTo({ top: scrollY + r.top - vast - 12, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
function vwBind(id, onlyAnc, set, outId) {
  const inp = $("#" + id), ul = $("#" + id + "L"); let items = [], sel = 0;
  /* telefoon: bij het intikken het veld bovenaan, zodat de suggesties boven het toetsenbord blijven */
  inp.onfocus = () => { if (innerWidth > 700) return; setTimeout(() => { const vast = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vast")) || 0, t = inp.getBoundingClientRect().top;
    if (t > innerHeight * 0.35 || t < vast) scrollTo({ top: scrollY + t - vast - 40 }); }, 250); };
  const close = () => { ul.hidden = true; inp.setAttribute("aria-expanded", "false"); inp.removeAttribute("aria-activedescendant"); };
  const draw = () => {
    ul.innerHTML = items.length ? items.map((c, i) => `<li role="option" id="${id}o${i}" aria-selected="${i === sel}" data-i="${i}"><b>${esc(vwNm(c.kw))}</b><span>${c.p.living ? "" : esc(lifeYears(c.p)) + " · "}kw ${c.kw}</span></li>`).join("") : `<li class="none" role="option" aria-disabled="true">Niemand gevonden${onlyAnc ? " (van levenden staat alleen de naam in de stamboom; zij zijn hier geen keuze)" : ""}</li>`;
    ul.hidden = false; inp.setAttribute("aria-expanded", "true");
    if (items.length) inp.setAttribute("aria-activedescendant", id + "o" + sel); else inp.removeAttribute("aria-activedescendant");
  };
  const pickI = i => { const c = items[i]; if (!c) return; inp.value = vwLabel(c.kw); close(); set(c.kw); if (matchMedia("(pointer:coarse)").matches) inp.blur(); if (outId) requestAnimationFrame(() => vwShow(outId)); };
  inp.oninput = () => { if (!inp.value.trim()) { items = []; close(); set(null); return; } items = vwFind(inp.value, onlyAnc); sel = 0; draw(); };
  inp.onkeydown = e => {
    if (ul.hidden) { if (e.key === "ArrowDown" && inp.value.trim()) { e.preventDefault(); inp.oninput(); } return; }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && items.length) { e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; draw(); }
    else if (e.key === "Enter") { e.preventDefault(); pickI(sel); }
    else if (e.key === "Escape") { e.stopPropagation(); close(); }
  };
  inp.onblur = () => setTimeout(close, 150);
  ul.onmousedown = e => { const li = e.target.closest("[data-i]"); if (li) { e.preventDefault(); pickI(+li.dataset.i); } };
}
const vwPick = (id, label, kw, ph) => `<div class="vw-field"><label for="${id}">${label}</label><div class="vw-combo"><input type="search" id="${id}" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}L" placeholder="${esc(ph)}" value="${kw ? esc(vwLabel(kw)) : ""}"><ul class="vw-list" id="${id}L" role="listbox" aria-label="Suggesties" hidden></ul></div></div>`;

function renderVerwant() {
  if (vwState.tree !== T.key) Object.assign(vwState, { tree: T.key, anc: null, d: 3, dSet: false, x: null, y: null });
  const host = $("#v-verwant"), wie = T.key === "s" ? `${T.rootFull} (en van Harrie of Alies)` : T.root;
  host.innerHTML = `
    <div class="eyebrow"><button class="link" data-go="personen">Personen</button> › Verwantschap</div>
    <h1 class="page-title">Hoe zijn we familie?</h1>
    <p class="lede">Hoe je familie bent van ${esc(wie)}, of hoe twee mensen uit de stamboom verbonden zijn: neef, achternicht of oudoom, en in welke graad.</p>
    <div class="section-head"><h2>Hoe ben ik familie?</h2><p>Kies een overleden voorouder van wie je zelf afstamt.</p></div>
    <div class="vw-form box">
      ${vwPick("vwAnc", "Ik stam af van", vwState.anc, "Naam, jaartal of kw-nummer")}
      <div class="vw-field"><label for="vwD">Ik ben een … van deze voorouder</label><select id="vwD">${Array.from({ length: VW_MAXD }, (_, i) => i + 1).map(n => `<option value="${n}"${n === vwState.d ? " selected" : ""}>${esc(vwCap(vwDown(n)))} · ${n} generatie${n > 1 ? "s" : ""}</option>`).join("")}</select></div>
    </div>
    <div id="vwOut1" class="vw-out" aria-live="polite"></div>
    <div class="section-head"><h2>Hoe zijn twee personen verbonden?</h2><p>Is de een voorouder van de ander? Zijn ze bloedverwant, of aangetrouwd? Met het bewijs van elke stap.</p></div>
    <div class="vw-form box two">
      ${vwPick("vwX", "Persoon 1", vwState.x, "Naam, jaartal of kw-nummer")}
      <button class="btn vw-swap" id="vwSwap" type="button" aria-label="Wissel persoon 1 en 2" title="Wissel">⇄</button>
      ${vwPick("vwY", "Persoon 2", vwState.y, "Naam, jaartal of kw-nummer")}
    </div>
    <div id="vwOut2" class="vw-out" aria-live="polite"></div>
    <div class="section-head"><h2>Zo rekenen we</h2></div>
    <div class="box vw-uitleg">
      <p><b>Neef of nicht</b>: jullie delen grootouders. <b>Achterneef of achternicht</b>: jullie delen overgrootouders (neven en nichten in de tweede lijn); <b>achter-achterneef</b>: betovergrootouders (derde lijn). Staat de een een generatie lager onder de gedeelde voorouder dan de ander, dan heet dat <i>één generatie verschoven</i>.</p>
      <p><b>Oom of tante, oudoom of oudtante</b>: de broer of zus van een ouder of grootouder. Het kind van je broer of zus heet in het Nederlands ook neef of nicht, het kleinkind achterneef of achternicht. Die woorden hebben dus twee betekenissen; de uitleg bij elke uitkomst zegt welke bedoeld is.</p>
      <p><b>Graad van bloedverwantschap</b>: tel de geboorten tussen jullie twee, via de gedeelde voorouder. Ouder en kind zijn bloedverwant in de eerste graad, broers en zussen in de tweede, neven en nichten in de vierde. Zo staat het in het <a href="https://wetten.overheid.nl/BWBR0002656/" target="_blank" rel="noopener">Burgerlijk Wetboek, Boek 1, artikel 3</a>. Halfverwanten (via een ander huwelijk) hebben dezelfde graad.</p>
      <p><b>Bewijs</b>: elke stap tussen ouder en kind heeft een label: ${["A", "B", "C", "D"].map(s => stTag(s, true)).join(" ")}. Een pad is zo sterk als de zwakste stap. Kwartierverlies: wie langs twee lijnen in de stamboom staat, maakt dat mensen langs twee wegen verwant zijn.</p>
    </div>`;
  vwBind("vwAnc", true, kw => { vwState.anc = kw; if (kw && !vwState.dSet) { vwState.d = vwDefD(kw); $("#vwD").value = vwState.d; } vwMine(); vwSync(); }, "vwOut1");
  $("#vwD").onchange = e => { vwState.d = +e.target.value; vwState.dSet = true; vwMine(); vwSync(); requestAnimationFrame(() => vwShow("vwOut1")); };
  vwBind("vwX", false, kw => { vwState.x = kw; vwPair(); vwSync(); }, "vwOut2");
  vwBind("vwY", false, kw => { vwState.y = kw; vwPair(); vwSync(); }, "vwOut2");
  $("#vwSwap").onclick = () => { [vwState.x, vwState.y] = [vwState.y, vwState.x]; $("#vwX").value = vwState.x ? vwLabel(vwState.x) : ""; $("#vwY").value = vwState.y ? vwLabel(vwState.y) : ""; vwPair(); vwSync(); };
  host.onclick = e => {
    const a = e.target.closest("[data-vwanc]");
    if (a) { vwState.anc = +a.dataset.vwanc; if (!vwState.dSet) vwState.d = vwDefD(vwState.anc); $("#vwAnc").value = vwLabel(vwState.anc); $("#vwD").value = vwState.d; vwMine(); vwSync(); requestAnimationFrame(() => vwShow("vwOut1")); return; }
    const p = e.target.closest("[data-vwpair]");
    if (p) { [vwState.x, vwState.y] = p.dataset.vwpair.split(",").map(Number); $("#vwX").value = vwLabel(vwState.x); $("#vwY").value = vwLabel(vwState.y); vwPair(); vwSync(); requestAnimationFrame(() => vwShow("vwOut2")); }
  };
  vwMine(); vwPair();
}
RENDER.verwant = renderVerwant;
/* deelbare keuze in de hash, met kale tokens (README §7): verwant, verwant-<kw> (voorouder), verwant-<kw>-<d> (met het aantal
   generaties), en voor deel 2 achteraan -<kw1>-x-<kw2>, bijvoorbeeld verwant-8-2-8-x-10 of verwant-8-x-10. Voorvoegsels a-/s- zoals overal.
   go() roept vwFromToken aan (haak); een wijziging in de keuze vervangt de hash (go …, replace), zodat de geschiedenis niet volloopt. */
const vwTok = s => "verwant" + (s.anc ? "-" + s.anc + (s.dSet ? "-" + s.d : "") : "") + (s.x && s.y ? `-${s.x}-x-${s.y}` : "");
function vwToken() { return vwState.tree === T.key ? vwTok(vwState) : "verwant"; }
function vwFromToken(token) {
  let t = String(token); const s = {};
  const m2 = /-(\d+)-x-(\d+)$/.exec(t); if (m2) { s.x = +m2[1]; s.y = +m2[2]; t = t.slice(0, m2.index); }
  const m1 = /^verwant(?:-(\d+)(?:-(\d+))?)?$/.exec(t); if (m1) { s.anc = m1[1] ? +m1[1] : null; s.d = m1[2] ? +m1[2] : null; }
  const okA = k => { const p = k ? person(k) : null; return !!p && (!p.living || k === 1); }, ok = k => !!(k && person(k));
  const anc = okA(s.anc) ? s.anc : null, dSet = !!(anc && s.d >= 1 && s.d <= VW_MAXD);
  const n = { tree: T.key, anc, d: dSet ? s.d : anc ? vwDefD(anc) : 3, dSet, x: ok(s.x) ? s.x : null, y: ok(s.y) ? s.y : null };
  if (vwState.tree !== T.key || vwTok(n) !== vwTok(vwState)) { Object.assign(vwState, n); delete rendered.verwant; }
}
const vwSync = () => { if (route.view === "verwant") go(vwToken(), { replace: true, keepScroll: true }); };
/* haak in het profiel: "Hoe is … familie van mij?" opent #verwant-<kw> met deze persoon als voorouder */
function vwProfielKnop(kw) {
  const p = person(kw); if (!p || (p.living && kw !== 1)) return "";
  return `<p class="vw-pk"><button class="btn" data-go="verwant-${kw}">Hoe ${T.key === "s" && kw === 1 ? "zijn" : "is"} ${esc(firstName(p))} familie van mij?</button></p>`;
}

/* ---------- opvallende feiten ---------- */
/* Alle FACTS van de boom op één pagina, per eeuw, te filteren op familie, bewijs en onderwerp (de tags van het verhaal waar
   het feit bij hoort). Het overzicht toont er zes en linkt hierheen. De filters zijn geen geschiedenisstap; ze gelden per boom
   zolang de pagina open is. Elk feit heeft een anker f-<n> (n = plaats in FACTS), waar de zoekfunctie naartoe springt. */
VIEWS.push("opvallend");
if (!$("#v-opvallend")) { const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-opvallend"; sec.hidden = true; $("main").appendChild(sec); }
const opState = {};
const opSt = () => opState[T.key] || (opState[T.key] = { lines: new Set(), st: new Set(), tag: new Set(), sort: "jaar" });
const opJaar = f => { const m = String(f.y || "").match(/\d{3,4}/); return m ? +m[0] : 9999; };
const opTags = f => f.story && typeof STORY_CARDS !== "undefined" && STORY_CARDS[f.story] ? (STORY_CARDS[f.story].tags || []).filter(t => STAGS[t]) : [];
const opLine = f => { const l = lineOf(f.kw); return l && LINES[l] ? l : null; };
function opCard(f) {
  const i = FACTS.indexOf(f), p = person(f.kw), l = opLine(f), st = f.story && STORIES.find(x => x.id === f.story);
  return `<article class="fact${p && !p.living ? " kaart-link" : ""}" id="f-${i}"><span class="yr"><span>${esc(f.y)}</span>${stTag(f.st)}</span>${T.key === "s" ? `<span class="op-side">${sideTag(sideOfKw(f.kw))}</span>` : ""}<h3>${esc(f.t)}</h3><p>${esc(f.x)}</p>
    <div class="acts">${p && !p.living ? `<button class="link hoofd" data-open="${f.kw}">${esc(p.n)}</button>` : ""}${st ? `<button class="link" data-go="verhaal-${st.id}">Verhaal: ${esc(st.title)}</button>` : ""}${l ? `<button class="link" data-go="lijn-${l}">Familie ${esc(LINES[l].name)}</button>` : ""}</div></article>`;
}
function opList() {
  const S = opSt();
  let fs = FACTS.filter(f => (!S.lines.size || S.lines.has(opLine(f))) && (!S.st.size || S.st.has(f.st)) && (!S.tag.size || opTags(f).some(t => S.tag.has(t))));
  const host = $("#opList"), cnt = $("#opCount"); if (!host) return;
  cnt.textContent = fs.length === FACTS.length ? `${FACTS.length} feiten` : `${fs.length} van de ${FACTS.length} feiten`;
  const nf = S.lines.size + S.st.size + S.tag.size; $("#opWis").hidden = !nf;
  const sm = $("#v-opvallend .op-fd > summary"); if (sm) sm.textContent = `Filters · ${nf ? `${nf} gekozen · ` : ""}${cnt.textContent}`;
  if (!fs.length) { host.innerHTML = `<p class="small">Geen feiten met deze keuze. <button class="link" data-opwis>Wis de filters</button></p>`; return; }
  if (S.sort === "bewijs") {
    const pk = pickFacts(); fs = pk.filter(f => fs.includes(f));
    host.innerHTML = `<div class="grid-3">${fs.map(opCard).join("")}</div>`; return;
  }
  fs = fs.slice().sort((a, b) => opJaar(a) - opJaar(b));
  const eeuw = {}; fs.forEach(f => { const y = opJaar(f), k = y === 9999 ? "?" : Math.floor(y / 100) * 100; (eeuw[k] = eeuw[k] || []).push(f); });
  host.innerHTML = Object.keys(eeuw).map(k => `<section class="op-eeuw"><h2 class="op-kop">${k === "?" ? "Zonder jaar" : `${k}–${+k + 99}`}<span class="small"> · ${eeuw[k].length}</span></h2><div class="grid-3">${eeuw[k].map(opCard).join("")}</div></section>`).join("");
}
function renderOpvallend() {
  const S = opSt(), v = $("#v-opvallend");
  const ln = LINE_KEYS.filter(l => LINES[l] && FACTS.some(f => opLine(f) === l));
  const sts = ["A", "B", "C", "D"].filter(x => FACTS.some(f => f.st === x));
  const tags = Object.keys(STAGS).filter(t => FACTS.some(f => opTags(f).includes(t)));
  const chip = (grp, val, label, extra) => `<button type="button" class="chip" data-opf="${grp}" data-opv="${esc(String(val))}" aria-pressed="${S[grp].has(val)}"${extra || ""}>${label}</button>`;
  v.innerHTML = `<div class="eyebrow"><button class="link" data-go="verhalen">Verhalen</button> › Opvallende feiten</div>
    <h1 class="page-title">Opvallende feiten</h1>
    <p class="lede">Ook uit andere bronnen dan akten. Het label A tot D zegt hoe sterk het bewijs is; de bronnen zelf staan in het profiel van de persoon.</p>
    <details class="op-fd"${matchMedia("(max-width:620px)").matches ? "" : " open"}><summary>Filters</summary>
    <div class="op-filters" role="group" aria-label="Filters">
      ${ln.length > 1 ? `<div class="op-f"><span class="op-l" id="opLf">Familie</span><div class="chips" role="group" aria-labelledby="opLf">${ln.map(l => chip("lines", l, `<i></i>${esc(LINES[l].name)}`, ` style="--c:var(--l${l})"`)).join("")}</div></div>` : ""}
      <div class="op-f"><span class="op-l" id="opLs">Bewijs</span><div class="chips" role="group" aria-labelledby="opLs">${sts.map(x => chip("st", x, `${x} · ${esc(STATUS[x].label.toLowerCase())} <span class="mono">${FACTS.filter(f => f.st === x).length}</span>`)).join("")}</div></div>
      ${tags.length ? `<div class="op-f"><span class="op-l" id="opLt">Onderwerp</span><div class="chips" role="group" aria-labelledby="opLt">${tags.map(t => chip("tag", t, esc(STAGS[t]))).join("")}</div></div>` : ""}
      <div class="op-f op-bar"><span id="opCount" class="small" aria-live="polite"></span><button type="button" class="link" id="opWis" data-opwis hidden>Wis filters</button>
        <span class="op-sort" role="group" aria-label="Volgorde"><span class="small">Volgorde:</span>${[["jaar", "op jaar"], ["bewijs", "sterkste bewijs eerst"]].map(([k, l]) => `<button type="button" class="chip" data-opsort="${k}" aria-pressed="${S.sort === k}">${l}</button>`).join("")}</span></div>
    </div></details>
    <div id="opList"></div>`;
  opList();
}
RENDER.opvallend = renderOpvallend;
document.addEventListener("click", e => {
  const c = e.target.closest("[data-opf]"), w = e.target.closest("[data-opwis]"), so = e.target.closest("[data-opsort]");
  if (!c && !w && !so) return;
  const S = opSt();
  if (c) { const g = c.dataset.opf, v = g === "lines" ? +c.dataset.opv : c.dataset.opv; S[g].has(v) ? S[g].delete(v) : S[g].add(v); c.setAttribute("aria-pressed", String(S[g].has(v))); }
  if (w) { ["lines", "st", "tag"].forEach(g => S[g].clear()); $$("#v-opvallend [data-opf]").forEach(b => b.setAttribute("aria-pressed", "false")); const f = $("#v-opvallend [data-opf]"); if (f) f.focus(); }
  if (so) { S.sort = so.dataset.opsort; $$("#v-opvallend [data-opsort]").forEach(b => b.setAttribute("aria-pressed", String(b === so))); }
  opList();
});
/* zoekindex: de pagina en elk feit */
function opIndex() {
  if (!FACTS.length) return;
  INDEX.push({ type: "Pagina's", title: "Opvallende feiten", sub: `${FACTS.length} korte feiten uit de akten, met hun bewijs`, text: "opvallend opvallende feiten weetjes feit", act: () => go("opvallend") });
  FACTS.forEach((f, i) => { const p = person(f.kw);
    INDEX.push({ type: "Opvallend", title: f.t, sub: [f.y, p && !p.living ? p.n : ""].filter(Boolean).join(" · "), text: [f.t, f.x, f.y, p && !p.living ? p.n : ""].join(" "), act: () => opGa(i) }); });
}
function opGa(i) {
  const S = opSt(); ["lines", "st", "tag"].forEach(g => S[g].clear());
  rendered.opvallend = false; go("opvallend");
  setTimeout(() => { const el = document.getElementById("f-" + i); if (!el) return; el.scrollIntoView({ block: "center" }); el.classList.add("op-flash"); el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); setTimeout(() => el.classList.remove("op-flash"), 1600); }, 40);
}

/* ---------- hun tijd ---------- */
/* De grote geschiedenis om de families heen, op één pagina onder Verhalen: de gebeurtenissen (CONTEXT, ook op de tijdlijn),
   waar de familie ze kruiste (HISTORY_TOUCH) en de boeken en artikelen erover (MEDIA, soort achtergrond). */
VIEWS.push("tijd");
if (!$("#v-tijd")) { const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-tijd"; sec.hidden = true; $("main").appendChild(sec); }
function renderTijd() {
  const ht = T.HISTORY_TOUCH || [], ctx = CONTEXT.slice().sort((a, b) => a.y - b.y);
  $("#v-tijd").innerHTML = `<div class="eyebrow">Verhalen</div><h1 class="page-title">Hun tijd</h1>
    <p class="lede">De grote geschiedenis om de families heen, van ${Math.min(...ctx.map(c => c.y))} tot ${Math.max(...ctx.map(c => c.y2 || c.y))}.</p>
    ${ht.length ? `<div class="section-head" id="tijd-geraakt"><h2>Geraakt door de grote geschiedenis</h2><p>Waar de familie de grote gebeurtenissen van haar tijd kruiste.</p></div>
    <ul class="restl touch">${ht.map(h => { const p = person(h.kw); return `<li><span class="y">${esc(h.y)}</span><span><b>${esc(h.t)}</b><br><span style="color:var(--muted)">${esc(h.d)}</span>${p ? `<br><button class="link" data-open="${h.kw}">${esc(p.n)}</button>` : ""}</span></li>`; }).join("")}</ul>` : ""}
    <div class="section-head" id="tijd-gebeurtenissen"><h2>Wat er gebeurde</h2><p>De achtergrond die ook op de tijdlijn staat.</p></div>
    <div class="grid-3">${ctx.map(c => `<article class="fact"><span class="yr"><span>${c.y}${c.y2 ? "–" + c.y2 : ""}</span></span><h3>${esc(c.t)}</h3><p>${esc(c.d)}</p></article>`).join("")}</div>
    ${ovMore(`data-go="tijdlijn"`, "Bekijk het op de tijdlijn")}
    ${verhalenAchtergrond()}`;
}
RENDER.tijd = renderTijd;

/* ---------- de boom als eigen pagina ---------- */
/* De boom (stap voor stap terug) heeft een eigen adres: #boom of #boom-<kw>. Het deel #treePane uit index.html
   verhuist naar deze pagina; de waaier en de boom delen het midden via de subtabs (#stamboom-<kw> ↔ #boom-<kw>). */
VIEWS.push("boom");
{ const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-boom"; sec.hidden = true;
  sec.innerHTML = `<div class="eyebrow">Stamboom</div><h1 class="page-title">De boom</h1><p class="lede" id="boomLede"></p><p class="small boom-hint">${[["5 4", "var(--weak)", "", "onzekere koppeling (C)"], ["1.5 4", "var(--hyp)", "round", "hypothese (D)"], ["", "var(--gold)", "", "dezelfde voorouder via twee lijnen"]].map(([da, c, lc, t]) => `<span class="bh-it"><svg viewBox="0 0 28 8" width="28" height="8" aria-hidden="true"><line x1="1" y1="4" x2="27" y2="4" stroke="${c}" stroke-width="2"${da ? ` stroke-dasharray="${da}"` : ""}${lc ? ` stroke-linecap="${lc}"` : ""}/></svg>${t}</span>`).join("")}</p>`;
  $("#v-stamboom").insertAdjacentElement("afterend", sec);
  const tp = $("#treePane"); if (tp) { sec.appendChild(tp); tp.hidden = false; }
  const tb = $("#v-stamboom > .toolbar"); if (tb) tb.hidden = true; /* de schakelaar Waaier/Boom is vervangen door de subtabs */
}
/* wissel tussen waaier en boom onder de inleiding, met hetzelfde midden (de subtabs blijven) */
function wisselLink(sec, naar, k) {
  let w = $(".fan-wissel", sec); const lede = $(".lede", sec); if (!lede) return;
  if (!w) { w = document.createElement("p"); w.className = "ov-more fan-wissel"; lede.insertAdjacentElement("afterend", w); }
  const tok = k > 1 ? naar + "-" + k : naar;
  w.innerHTML = `<a class="ov-link" href="#${T.prefix}${tok}" data-go="${tok}">Bekijk als ${naar === "boom" ? "boom" : "waaier"} →</a>`;
}
let boomEerder = null; /* het vorige startpunt: bij een stap binnen de boom naar de tekening scrollen en de focus houden */
function renderBoom(sub) {
  treeRoot = fanRootOk(sub) ? sub : 1; mode = "tree";
  wisselLink($("#v-boom"), "stamboom", treeRoot);
  const p = treeRoot > 1 && person(fanKw(treeRoot));
  $("#boomLede").textContent = `Vanaf ${p ? p.n + (p.living ? "" : " (" + lifeYears(p) + ")") : T.rootFull || T.root}.`; /* geldt voor elke weergave (liggend, staand, uitklapbaar) */
  drawTree();
  const stap = boomEerder !== null && boomEerder !== treeRoot && !$("#v-boom").hidden; boomEerder = treeRoot;
  if (stap && (document.activeElement === document.body || !document.contains(document.activeElement))) {
    const tp = $("#treePane"); if (tp && tp.getBoundingClientRect().top < 0) tp.scrollIntoView({ block: "start" });
    const h1 = $("#v-boom h1"); if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
  }
}
RENDER.boom = renderBoom;
/* het midden gaat mee tussen waaier en boom */
const middenTok = v => { const k = (route.view === "boom" || route.view === "stamboom") && fanRootOk(route.sub) ? route.sub : 1; return (v === "stamboom" || v === "boom") && k > 1 ? v + "-" + k : v; }; /* uit de route: menuSync loopt vóór het tekenen */

/* ---------- hoofdmenu ---------- */
/* Eén kopregel: links de boomkiezer (tevens het merk), dan de 7 onderdelen, rechts zoeken en weergave. Op smalle schermen
   (zie CSS) blijft links de boomkiezer en komen rechts zoeken en een knop ☰ met een paneel: boomkeuze, alle onderdelen en
   de weergave. Navigatie volgt het disclosure-patroon: groepen zijn knoppen (aria-expanded), items zijn echte links (href
   met voorvoegsel van de boom) die via de algemene [data-go]-klikhandler go() aanroepen. Openen en sluiten is geen
   geschiedenisstap. menuSync() loopt na elke paginawissel (haak in go). De indeling staat alleen in MENU.
   Een groep met meer pagina's is een gesplitste knop: het label is een link naar de eerste pagina, het pijltje ernaast
   (aria-expanded) klapt de lijst uit; met een muis klapt hij ook uit bij aanwijzen (met een korte vertraging). Op de
   pagina's van zo'n groep staat onder de kop een tweede balk met de groep en haar pagina's (op de desktop vast mee met
   de kop, op de telefoon niet). Op de groepspagina zelf vervalt dan de eyebrow bovenaan, want de balk zegt al waar je bent. */
const MENU = [
  ["Overzicht", [["Overzicht", "overzicht"]]],
  ["Stamboom", [["Waaier", "stamboom", "Alle voorouders in één beeld"], ["Boom", "boom", "Stap voor stap terug, tak voor tak"], ["De acht families", "families", "Elke familielijn met haar verhaal"], ["Kwartierstaat", "lijst", "Alles als lijst, ook om af te drukken"]]],
  ["Mensen", [["Personen", "personen", "Een profiel per voorouder"], ["Namenregister", "namen", "Alle achternamen van A tot Z"], ["Hoe zijn we familie?", "verwant", "De verwantschap tussen twee mensen"], ["Bekende verwanten", "verwanten", "Adel, macht en geschiedenis"]]],
  ["Verhalen", [["Verhalen", "verhalen", "De rode draden door de families"], ["Opvallende feiten", "opvallend", "Korte feiten uit de akten, met hun bewijs"], ["Tijdlijn", "tijdlijn", "Wie leefde wanneer"], ["Hun tijd", "tijd", "Wat er gebeurde, wat hen raakte, en wat je erover leest"], ["In getallen", "cijfers", "Leeftijden, namen, beroepen"]]],
  ["Plaatsen", [["Kaart", "kaart", "Elk dorp op de kaart, ook per jaar"], ["Waar de families elkaar kruisten", "verbanden", "Dorpen van beide kanten in dezelfde jaren", "s"]]],
  ["Beeld", [["Familie", "beeld", "Portretten, bidprentjes en kranten"], ["Plaatsen en kaarten", "beeld-plaatsen", "Dorpen, kerken en oude kaarten"], ["Uit de archieven", "beeld-archief", "Oude foto's, prenten en akten, met filters"]]],
  ["Bronnen", [["Bronnen en betrouwbaarheid", "bronnen", "Hoe zeker alles is, en waar je zelf zoekt"], ["Help mee zoeken", "zoeken", "Open vragen waar je kunt helpen"], ["Tegenstrijdigheden", "bronnen-tegenstrijdig", "Waar bronnen elkaar tegenspreken"], ["Alle bronnen", "bronnen-lijst", "Elke gebruikte akte en genealogie"], ["Over deze site", "bronnen-over", "Begrippen, wijzigingen en beeldverantwoording"]]]
];
const TREE_INFO = { h: "De voorouders van Harrie de Groot", s: "Harrie en Alies samen: de voorouders van hun kinderen", a: "De voorouders van Alies Hoekstra" };
const TREE_KORT = { h: "Harrie", s: "de kinderen", a: "Alies" };
const menuGroups = () => MENU.map(([g, its]) => [g, its.filter(([, v, , boom]) => VIEWS.includes(v) && (!boom || T.key === boom))]).filter(([, its]) => its.length);
const hereView = () => { const all = menuGroups().flatMap(([, its]) => its.map(x => x[1])); return all.includes(route.view) ? route.view : NAV_OF[route.view] || route.view; };
const groupOf = v => (menuGroups().find(([, its]) => its.some(x => x[1] === v)) || [null])[0];
const mnHref = v => "#" + T.prefix + v;
const mnCur = v => route.view === v && !route.sub ? ` aria-current="page"` : hereView() === v ? ` aria-current="true"` : ""; /* "page" alleen op de pagina zelf, "true" op een pagina eronder */
const mnLink = (lbl, v, uitleg, cls) => { const tx = uitleg ? `<b>${esc(lbl)}</b><small>${esc(uitleg)}</small>` : esc(lbl), ico = cls.includes("mn-it") ? navIco(v) : "";
  return `<a class="${cls}${ico ? " mn-ico" : ""}" href="${mnHref(v)}" data-go="${v}"${mnCur(v)}>${ico ? `${ico}<span class="mn-tx">${tx}</span>` : tx}</a>`; };
const topWrap = $("header.top .wrap"), tabsNav = $("nav.tabs"), oudMerk = $("header.top .brand");
tabsNav.setAttribute("aria-label", "Hoofdmenu");
/* boomkiezer = merk */
const tp = document.createElement("div"); tp.className = "tp";
tp.innerHTML = `<button type="button" class="tp-btn" id="tpBtn" aria-expanded="false" aria-controls="tpList"><span class="tp-tx"><small>Stamboom van</small><b id="tpNaam"></b></span><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="tp-list mn-drop" id="tpList" hidden></div>`;
oudMerk.insertAdjacentElement("afterend", tp);
const tpBtn = $("#tpBtn"), tpList = $("#tpList");
const treeKeuze = cls => ["h", "s", "a"].filter(k => TREES[k]).map(k => `<button type="button" class="${cls}" data-tree="${k}" aria-pressed="${T.key === k}"><b>${esc(TREES[k].root)}</b><span>${esc(TREES[k].brand)}</span><small>${esc(TREE_INFO[k])}</small></button>`).join("");
/* telefoon: ☰ rechts */
const mnBtn = document.createElement("button");
mnBtn.type = "button"; mnBtn.className = "mn-btn"; mnBtn.id = "menuBtn"; mnBtn.setAttribute("aria-haspopup", "dialog"); mnBtn.setAttribute("aria-expanded", "false"); mnBtn.setAttribute("aria-controls", "menuPanel"); mnBtn.setAttribute("aria-label", "Menu");
mnBtn.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 6h13M3.5 10h13M3.5 14h13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
topWrap.appendChild(mnBtn);
const mnScrim = document.createElement("div"); mnScrim.className = "mn-scrim"; mnScrim.hidden = true;
const mnPanel = document.createElement("div"); mnPanel.className = "mn-panel"; mnPanel.id = "menuPanel"; mnPanel.hidden = true;
mnPanel.setAttribute("role", "dialog"); mnPanel.setAttribute("aria-modal", "true"); mnPanel.setAttribute("aria-label", "Menu");
document.body.append(mnScrim, mnPanel);
/* uitklappers: altijd maar één tegelijk open */
let openDrop = null, dropOpener = null; /* de opener krijgt bij Esc de focus terug (het label of het pijltje) */
function dropOpen(btn, focusFirst, opener) {
  dropClose(); const d = $("#" + btn.getAttribute("aria-controls")); if (!d) return; dropOpener = opener || btn;
  if (btn === tpBtn) d.innerHTML = `<div class="mn-g">Kies een stamboom</div>` + treeKeuze("tp-it");
  d.hidden = false; btn.setAttribute("aria-expanded", "true"); openDrop = btn;
  if (focusFirst) { const f = $("[aria-current],[aria-pressed=true]", d) || $("a,button", d); if (f) f.focus(); }
}
function dropClose(back) {
  if (!openDrop) return; const b = openDrop, d = $("#" + b.getAttribute("aria-controls"));
  if (d) d.hidden = true; b.setAttribute("aria-expanded", "false"); openDrop = null; if (back) (dropOpener && document.contains(dropOpener) ? dropOpener : b).focus(); dropOpener = null;
}
let viaHover = false;
document.addEventListener("click", e => {
  const b = e.target.closest(".mn-chev, #tpBtn");
  if (b) { e.preventDefault(); openDrop === b && !viaHover ? dropClose() : dropOpen(b, false); viaHover = false; return; }
  if (openDrop && !e.target.closest(".mn-drop")) dropClose();
});
document.addEventListener("keydown", e => {
  const b = e.target.closest && e.target.closest(".mn-chev, #tpBtn, .mn-lbl");
  if (b && e.key === "ArrowDown") { e.preventDefault(); dropOpen(b.classList.contains("mn-lbl") ? b.nextElementSibling : b, true, b); return; }
  if (!openDrop) return;
  const d = $("#" + openDrop.getAttribute("aria-controls")), its = $$("a,button", d), i = its.indexOf(document.activeElement);
  if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); dropClose(openDrop.parentNode.contains(document.activeElement)); }
  else if (i >= 0 && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); its[(i + (e.key === "ArrowDown" ? 1 : its.length - 1)) % its.length].focus(); }
  else if (i >= 0 && (e.key === "Home" || e.key === "End")) { e.preventDefault(); its[e.key === "Home" ? 0 : its.length - 1].focus(); }
}, true);
document.addEventListener("focusin", e => { if (openDrop && !openDrop.contains(e.target) && !$("#" + openDrop.getAttribute("aria-controls")).contains(e.target)) dropClose(); });
/* aanwijzen met een muis: na 150 ms open, 250 ms na het verlaten dicht; op aanraakschermen niet */
const muis = matchMedia("(hover:hover) and (pointer:fine)");
let hoverT = 0, hoverRust = false; /* na een muisklik op een label niet meteen weer uitklappen */
function hoverBind(li) {
  const chev = $(".mn-chev", li);
  $(".mn-lbl", li).addEventListener("click", e => { if (e.detail) { hoverRust = true; clearTimeout(hoverT); } });
  /* openen pas als de muis even (bijna) stilstaat: elke beweging van meer dan 4 px start de 150 ms opnieuw. Wie al een groep open
     heeft, springt meteen door naar de volgende. */
  let xy = null; const open = () => { dropOpen(chev, false); viaHover = true; };
  li.addEventListener("mouseenter", () => { if (!muis.matches || hoverRust) return; clearTimeout(hoverT); xy = null;
    if (openDrop && openDrop !== chev && openDrop.classList.contains("mn-chev")) open(); });
  li.addEventListener("mousemove", e => { if (!muis.matches || hoverRust || openDrop === chev) return;
    if (xy && Math.abs(e.clientX - xy[0]) + Math.abs(e.clientY - xy[1]) < 4) return; xy = [e.clientX, e.clientY];
    clearTimeout(hoverT); hoverT = setTimeout(open, 150); });
  li.addEventListener("mouseleave", () => { hoverRust = false; if (!muis.matches) return; clearTimeout(hoverT); hoverT = setTimeout(() => { if (openDrop === chev && !li.contains(document.activeElement)) dropClose(); }, 250); });
}
/* tweede balk van de kop: de pagina's van de groep waar je bent */
const subBar = document.createElement("div"); subBar.className = "subbar"; subBar.hidden = true;
subBar.innerHTML = `<nav class="wrap subtabs"></nav>`;
const kop = $("header.top"); kop.insertAdjacentElement("afterend", subBar);
const subNav = $("nav", subBar);
/* de uitleg van de huidige tab (dezelfde regel als in het uitklapmenu), bovenaan in main: niet in de vaste balk, zodat die laag blijft */
const subUitleg = document.createElement("p"); subUitleg.className = "sb-uitleg"; subUitleg.hidden = true; $("main").prepend(subUitleg);
/* --kop-h: hoogte van de kop; --vast: alles wat bovenaan vast blijft (kop plus, op de desktop, de tweede balk) */
const kopH = () => { const r = document.documentElement.style, k = kop.offsetHeight;
  r.setProperty("--kop-h", k + "px"); r.setProperty("--vast", k + (!subBar.hidden && getComputedStyle(subBar).position === "sticky" ? subBar.offsetHeight : 0) + "px"); };
if (window.ResizeObserver) { const ro = new ResizeObserver(kopH); ro.observe(kop); ro.observe(subBar); } else addEventListener("resize", kopH);
kopH();
tpList.addEventListener("click", e => { const t = e.target.closest("[data-tree]"); if (t && t.dataset.tree === T.key) dropClose(true); });
/* paneel */
function panelOpen() {
  dropClose();
  mnPanel.innerHTML = `<div class="mn-head"><b>Menu</b><button type="button" class="mn-close" aria-label="Menu sluiten">×</button></div>
    <section class="mn-trees" aria-label="Stamboom van"><h6>Stamboom van</h6>${treeKeuze("mn-tree")}</section>` +
    menuGroups().map(([g, its]) => its.length === 1 && its[0][0] === g ? `<section>${mnLink(g, its[0][1], "", "mn-it mn-solo")}</section>` : `<section><h6>${esc(g)}</h6>${its.map(([l, v]) => mnLink(l, v, "", "mn-it")).join("")}</section>`).join("") +
    `<section class="mn-thema"><h6 id="mnThemaKop">Weergave</h6><div class="mn-seg" role="radiogroup" aria-labelledby="mnThemaKop">${[["auto", "Automatisch"], ["licht", "Licht"], ["donker", "Donker"]].map(([t, l]) => `<button type="button" role="radio" data-mnt="${t}" aria-checked="${themeCur === t}">${l}</button>`).join("")}</div></section>`;
  mnPanel.hidden = false; mnScrim.hidden = false; mnBtn.setAttribute("aria-expanded", "true");
  document.documentElement.classList.add("lock");
  const cur = $(".mn-it[aria-current]", mnPanel); if (cur) cur.scrollIntoView({ block: "center" });
  (cur || $(".mn-close", mnPanel)).focus();
}
function panelClose(back) {
  if (mnPanel.hidden) return;
  mnPanel.hidden = true; mnScrim.hidden = true; mnBtn.setAttribute("aria-expanded", "false"); syncLock();
  if (back) mnBtn.focus();
}
mnBtn.addEventListener("click", () => mnPanel.hidden ? panelOpen() : panelClose(true));
mnScrim.addEventListener("click", () => panelClose(true));
mnPanel.addEventListener("click", e => {
  if (e.target.closest(".mn-close")) { panelClose(true); return; }
  const th = e.target.closest("[data-mnt]");
  if (th) { themeCur = th.dataset.mnt; applyTheme(themeCur, true); $$("[data-mnt]", mnPanel).forEach(x => x.setAttribute("aria-checked", String(x === th))); return; }
  const t = e.target.closest("[data-tree]"); if (t) { if (t.dataset.tree === T.key) panelClose(true); return; } /* een andere boom: setTree + go sluiten het paneel */
  if (e.target.closest("[data-go]")) panelClose(false);
});
mnPanel.addEventListener("keydown", e => {
  if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); panelClose(true); return; }
  const r = e.target.closest("[role=radio]");
  if (r && (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); const rs = $$("[role=radio]", mnPanel), i = rs.indexOf(r); const n = rs[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : rs.length - 1)) % rs.length]; n.focus(); n.click(); return; }
  trapFocus(mnPanel, e);
});
addEventListener("resize", () => { if (!mnPanel.hidden && getComputedStyle(mnBtn).display === "none") panelClose(); });
addEventListener("popstate", () => { dropClose(); panelClose(); });
/* paginatitel ("Namenregister · Stamboom van Harrie de Groot"; detailpagina's met hun h1) en, na een keuze in menu, subbalk of
   paneel, de focus op de h1 van de nieuwe pagina: het gekozen element zelf wordt opnieuw opgebouwd. */
let focusNa = false;
document.addEventListener("click", e => { if (e.target.closest("nav.tabs [data-go], .subtabs [data-go], .mn-panel [data-go]")) focusNa = true; }, true);
function menuNa() {
  const v = $$("main > .view").find(x => !x.hidden), h1 = v && $("h1", v), it = menuGroups().flatMap(([, its]) => its).find(x => x[1] === route.view);
  const eigen = groupOf(route.view) === "Beeld"; /* de beeldpagina's hebben korte labels ("Familie"); hun h1 zegt meer */
  const naam = route.view === "overzicht" ? "" : !route.sub && it && !eigen ? it[0] : (h1 && h1.textContent.trim()) || (it && it[0]) || "";
  document.title = (naam ? naam + " · " : "") + "Stamboom van " + (T.rootFull || T.root);
  if (focusNa && h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
  focusNa = false;
}
/* open profiel: de naam in de titel; bij sluiten weer de titel van de pagina eronder */
new MutationObserver(() => { if (drawer.hidden) { const f = focusNa; focusNa = false; menuNa(); focusNa = f; return; }
  const p = curKw && person(curKw); if (p) document.title = p.n + " · Stamboom van " + (T.rootFull || T.root);
}).observe(drawer, { attributes: true, attributeFilter: ["hidden"], childList: true, subtree: true });
/* na elke paginawissel en boomwissel: menu en boomkiezer opnieuw */
function menuSync() {
  dropClose(); panelClose();
  clearTimeout(hoverT); viaHover = false;
  const hv = hereView(), hg = groupOf(hv);
  tabsNav.innerHTML = `<ul class="mn-ul">${menuGroups().map(([g, its], n) => {
    if (its.length === 1) return `<li><a class="mn-top${g === hg ? " is-here" : ""}" href="${mnHref(its[0][1])}" data-go="${its[0][1]}"${mnCur(its[0][1])}>${esc(g)}</a></li>`;
    const id = "mnd-" + n;
    return `<li class="mn-li"><a class="mn-top mn-lbl${g === hg ? " is-here" : ""}" href="${mnHref(its[0][1])}" data-go="${its[0][1]}"${g === hg ? ` aria-current="true"` : ""}>${esc(g)}</a><button type="button" class="mn-chev${g === hg ? " is-here" : ""}" aria-expanded="false" aria-controls="${id}" aria-label="Meer onder ${esc(g)}"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="mn-drop" id="${id}" hidden>${its.map(([l, v, u]) => mnLink(l, v, u, "mn-it")).join("")}</div></li>`;
  }).join("")}</ul>`;
  $$(".mn-li", tabsNav).forEach(hoverBind);
  const sg = menuGroups().find(([g]) => g === hg), sits = sg ? sg[1] : [];
  const sub = sits.length > 1, nu = sits.find(x => x[1] === hv);
  subBar.hidden = !sub;
  document.documentElement.classList.toggle("sub-op", sub && sits.some(x => x[1] === route.view)); /* groepspagina zelf: geen dubbele eyebrow */
  subNav.setAttribute("aria-label", hg ? `Pagina's onder ${hg}` : "Pagina's");
  /* desktop: groep links, tabs met hetzelfde icoon als in het menu; telefoon: een raster van even grote knoppen (zie CSS). De uitleg staat als title. */
  subUitleg.hidden = !(sub && nu && nu[2]); subUitleg.textContent = sub && nu && nu[2] ? nu[2] : "";
  subNav.innerHTML = !sub ? "" : `<span class="sb-g" aria-hidden="true">${esc(hg)}</span><ul class="sb-n${sits.length}">${sits.map(([l, v, u]) => `<li><a href="${mnHref(middenTok(v))}" data-go="${middenTok(v)}"${u ? ` title="${esc(u)}"` : ""}${mnCur(v)}>${typeof navIco === "function" ? navIco(v) : ""}<span>${esc(l)}</span></a></li>`).join("")}</ul>`;
  kopH();
  queueMicrotask(menuNa); /* na het tekenen van de pagina: titel en focus */
  $("#tpNaam").innerHTML = `<span class="tp-lang">${esc(T.root)}</span><span class="tp-kort">${esc(TREE_KORT[T.key] || T.root)}</span>`;
  tpBtn.setAttribute("aria-label", `Stamboom van ${T.rootFull || T.root}. Kies een andere stamboom`);
}

/* ---------- voettekst ---------- */
/* Drie kolommen (op de telefoon onder elkaar): de stamboom met de drie bomen, de pagina's uit MENU (groeit vanzelf mee),
   en de versie met een link naar de wijzigingen en de regel over levenden. Wordt per boom opnieuw gezet. */
function footChrome() {
  const f = $("#foot"); if (!f) return;
  const bomen = ["h", "s", "a"].filter(k => TREES[k]).map(k => `<li><a href="#${TREES[k].prefix}overzicht" data-tree="${k}"${T.key === k ? ` aria-current="true"` : ""}>${esc(TREES[k].rootFull || TREES[k].root)}</a></li>`).join("");
  let groepen = []; try { groepen = menuGroups(); } catch (e) {} /* bij de eerste opbouw bestaat het menu nog niet; boot() zet de voettekst daarna opnieuw */
  const kaart = groepen.map(([g, its]) => `<li><a href="${mnHref(its[0][1])}" data-go="${its[0][1]}">${esc(g)}</a>${its.length > 1 ? `<ul>${its.slice(1).map(([l, v]) => `<li><a href="${mnHref(v)}" data-go="${v}">${esc(l)}</a></li>`).join("")}</ul>` : ""}</li>`).join("");
  f.innerHTML = `<div class="ft">
    <section class="ft-boom"><h2>Stamboom</h2><ul class="ft-bomen">${bomen}</ul><p>Gemaakt voor de families De Groot, Boersma, Hoekstra en Bakker.</p></section>
    <nav class="ft-kaart" aria-label="Alle pagina's"><h2>Op deze site</h2><ul>${kaart}</ul></nav>
    <section class="ft-info"><h2>Over</h2><p>${esc(VERSION)} · <a href="#${T.prefix}bronnen-wijzigingen" data-go="bronnen-wijzigingen">wat is er nieuw</a></p><p>Van levende familieleden staan alleen namen vermeld.</p><p><a href="#" class="ft-top" data-top>Naar boven ↑</a></p></section>
  </div>`;
  const top = $("[data-top]", f); if (top) top.onclick = e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); const h1 = $$("main > .view").find(v => !v.hidden); const t = h1 && $("h1", h1); if (t) { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); } };
}

/* ---------- boot ---------- */
buildIndex();
function boot() {
  const raw = (location.hash || "").slice(1); setTree(treeOfHash(raw)); const h = stripTree(raw);
  if (/^kw\d+$/.test(h)) { go("overzicht", { keepHash: true }); openProfile(+h.slice(2), { fromHistory: true }); }
  else go(h || "overzicht", { replace: true });
  footChrome();
}
function fromHash() {
  const raw = location.hash.slice(1), changed = setTree(treeOfHash(raw)), h = stripTree(raw) || "overzicht";
  if (/^kw\d+$/.test(h)) {
    const onder = (history.state && history.state.onder) || (changed ? "overzicht" : null); /* de pagina onder het profiel */
    if (onder && (changed || onder !== currentToken())) go(onder, { keepHash: true, keepScroll: true });
    openProfile(+h.slice(2), { fromHistory: true }); return;
  }
  if (!drawer.hidden) closeProfile(true);
  if (!lb.hidden) closeLb(true);
  if (changed || h !== currentToken()) go(h, { keepHash: true });
}
window.addEventListener("popstate", fromHash);   /* vorige/volgende */
window.addEventListener("hashchange", fromHash); /* hash met de hand gewijzigd of een gewone #-link */
boot();
})();
