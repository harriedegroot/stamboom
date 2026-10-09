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
const TREES = { h: Object.assign({ key: "h", prefix: "", root: "Harrie", rootFull: "Harrie de Groot", rootMale: true, brand: "De Groot · Boersma", parents: "Kees en Vronie", sibs: [], sibsSrc: [["Overlijdensadvertentie van grootmoeder Mien de Groot-de Vries · Archief RK Friesland, nr. 42414", "https://www.openarchieven.nl/rkf:fc95e537-f987-fb87-0dfe-44ff7b2c7fec"]], kids: [], TXT: {} }, TREE_H) }; /* kids and sibs: from DESCENDANTS (applyDescendants) */
if (typeof ALIES !== "undefined") TREES.a = Object.assign({ key: "a", prefix: "a-", rootMale: false, STORIES: [], FACTS: [], OPEN_QUESTIONS: [], CONFLICTS: [], NOTABLES: [], SOURCE_GROUPS: [], MEDIA: [], MONEY: [], CHANGES: { v: "", newKws: [], updKws: [], removed: [] }, TXT: {} }, ALIES);
/* the children and the brothers and sisters of the roots: people without a kw, in DESCENDANTS (data/05-descendants.js, living, name only).
   kids and sibs of each tree become their names, with the ids alongside (kidsIds, sibsIds); a "Name · dN" string in the data is read the same way. */
function applyDescendants(TR) {
  const D = typeof DESCENDANTS !== "undefined" ? DESCENDANTS : [], of = (f, m) => D.filter(d => d.father === f && d.mother === m);
  const read = l => (l || []).map(s => { const m = String(s).match(/^(.*?)\s·\s*(d\d+)$/); const d = m && D.find(x => x.id === m[2]); return d ? [d.roep || d.n, d.id] : [m ? m[1] : String(s), null]; });
  const put = (t, field, list) => { if (!t) return; const r = list.length ? list.map(d => [d.roep || d.n, d.id]) : read(t[field]); t[field] = r.map(x => x[0]); t[field + "Ids"] = r.map(x => x[1]); };
  put(TR.h, "kids", of("1", "a-1")); put(TR.h, "sibs", of("2", "3")); put(TR.a, "kids", of("1", "a-1")); put(TR.a, "sibs", of("a-2", "a-3"));
}
applyDescendants(TREES);
/* the brothers and sisters of the person at s place k, from DESCENDANTS: the people with the same father and mother (data keys) */
function sibsOfS(k) {
  const D = typeof DESCENDANTS !== "undefined" ? DESCENDANTS : [], S = TREES.s; if (!S || !D.length) return [];
  const rec = kw => S.PEOPLE.find(p => p.kw === kw && !p.alias), key = p => p ? (p.side === "a" ? "a-" : "") + p.origKw : null;
  const f = key(rec(2 * k)), m = key(rec(2 * k + 1));
  return f && m ? D.filter(d => d.father === f && d.mother === m).map(d => d.roep || d.n) : [];
}
/* DESCENDANTS in the current tree: a data key ("N" or "a-N", see dataKey) as a kw of T (or null), and the children of a couple
   from the list (living, the name only; the order of the data) */
function keyToKw(key) {
  const side = /^a-/.test(key) ? "a" : "h", k = +String(key).replace(/^a-/, ""); if (!(k >= 1)) return null;
  if (FK && T.focus && T.fromS) return T.fromS(naarS(side, k));
  return T.key === "s" ? naarS(side, k) : T.key === side ? k : null;
}
const descList = () => typeof DESCENDANTS !== "undefined" ? DESCENDANTS : [];
const kidsOfPair = (a, b) => { const x = a ? dataKey(a.aliasOf || a.kw) : "-", y = b ? dataKey(b.aliasOf || b.kw) : "-"; return x === "-" || y === "-" ? [] : descList().filter(d => (d.father === x && d.mother === y) || (d.father === y && d.mother === x)); };
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
    if (o.linkAt) x.linkAt = Object.fromEntries(Object.entries(o.linkAt).map(([k, v]) => [up(+k, s), v])); /* evidence per step: keys are alias numbers */
    if (Array.isArray(o.kws)) x.kws = o.kws.map(k => up(+k, s));
    if (Array.isArray(o.people)) x.people = o.people.map(k => up(k, s));
    if (Array.isArray(o.needs)) x.needs = o.needs.map(k => /^s\d+$/.test(k) ? +String(k).slice(1) : up(+k, s)); /* a text that is about all of these people (focusTree drops it when one is missing); "s2" is already a number in s */
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
      intro: `De voorouders van ${gp.n}, ${g % 2 ? "grootmoeder" : "grootvader"} van ${t.root}: twee families, ${l1.name} en ${l2.name}. ${l1.intro || ""} ${l2.intro || ""}`.trim(),
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
/* a text whose needs name someone of the other side ("s2" = Harrie in the tree of Alies) only fits the joined tree: out of the side trees, after joinTrees has taken it */
{ const sideOf = n => n < 2 ? "" : (n >> (Math.floor(Math.log2(n)) - 1)) & 1 ? "a" : "h";
  const fits = (o, side) => !Array.isArray(o.needs) || o.needs.every(k => !/^s\d+$/.test(k) || sideOf(+String(k).slice(1)) === side);
  [["h", TREES.h], ["a", TREES.a]].forEach(([side, t]) => t && ["STORIES", "FACTS", "OPEN_QUESTIONS", "CONFLICTS", "NOTABLES", "MEDIA", "MONEY", "HISTORY_TOUCH"].forEach(f => { if (Array.isArray(t[f])) t[f] = t[f].filter(o => fits(o, side)); })); }
/* ---------- family focus (FK2), on by default; ?fk=0 turns it off for this visitor (remembered), ?fk=1 back on ----------
   With the switch the address carries the focus as a prefix in the numbering of s: f1- the whole family (= s), f2- Harrie (= h),
   f3- Alies (= a), f<k>- one person, fp<k>- a couple. A focus other than these three is a tree made by Products.focusTree from s
   (src/products/focus.js), cached in TREES. Old links keep their meaning: no prefix = h, a- = a, s- = s (and are rewritten). */
const FK = (() => { try { const q = new URLSearchParams(location.search).get("fk"); if (q === "1" || q === "0") localStorage.setItem("stamboom-fk", q); return localStorage.getItem("stamboom-fk") !== "0"; } catch (e) { return true; } })()
  && typeof Products !== "undefined" && !!Products.focusTree; /* without focus.js (a script that did not arrive): the three trees, as before */
const FK_KOP = true; /* the family choice in the header (FK1); false brings back the old tree picker (emergency switch). At the top: the footer reads it at startup */
const TREE_PRE = { h: "", a: "a-" }; /* the prefix of the keys in the data files (KORT, images): "<kw>" Harrie, "a-<kw>" Alies */
if (FK && TREES.s && typeof Products !== "undefined" && Products.focusTree) { TREES.s.prefix = "f1-"; TREES.h.prefix = "f2-"; if (TREES.a) TREES.a.prefix = "f3-"; }
const FK_RE = /^f(p?)(\d+)((?:\.[a-z0-9_]+)*)-/; /* fp4.andre.anneke-: a focus with the persons it is for (dot-separated names) */
const fkSlug = n => String(n).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const fkNaam = sl => sl.split("_").map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(" ");
/* the tree of a focus { kw, pair } in s numbering: the three own trees, else a focus tree (made once) */
function focusSleutel(kw, pair, persons = []) {
  if (!persons.length) { if (!pair && kw === 1) return "s"; if (!pair && kw === 2) return "h"; if (!pair && kw === 3 && TREES.a) return "a"; }
  const key = (pair ? "fp" : "f") + kw + persons.map(n => "." + fkSlug(n)).join(""); if (TREES[key]) return key; /* the key is the route prefix */
  try { const t = Products.focusTree(TREES.s, Object.assign({ kw, pair }, persons.length ? { persons } : {}), { surname: n => splitName(n).sur, kidsOf: sibsOfS });
    if (t && t.PEOPLE && t.PEOPLE.length) { t.key = key; t.prefix = key + "-"; TREES[key] = t; return key; } } catch (e) { }
  return "s";
}
/* the focus of a tree, in s numbering: s, h and a are kw 1, 2 and 3; a focus tree carries its own */
const focusVan = (t = T) => t.focus || ({ s: { kw: 1, pair: false }, h: { kw: 2, pair: false }, a: { kw: 3, pair: false } })[t.key] || { kw: 1, pair: false };
/* a number in h or a → s: Harrie's side gets the bit 0 under kw 1, Alies' side bit 1 (joinTrees: up) */
const naarS = (tree, kw) => tree === "s" ? kw : kw + 2 ** (Math.floor(Math.log2(kw)) + (tree === "a" ? 1 : 0));
let T = TREES.h, RAW, BY, ALIAS_OF, ALIASES, all, ancestors;
const LIVING_KEEP = new Set(["kw", "n", "roep", "living", "alias", "side", "origKw", "kids"]);
/* evidence per step (linkAt { alias kw: label } on the record): at alias place x the step x → x >> 1 has its own label;
   st there is the worse of st and that label (never better than the record) */
const stepAt = (t, x) => { const l = t.linkAt && t.linkAt[x]; return l ? { link: l, st: "ABCD".indexOf(l) > "ABCD".indexOf(t.st) ? l : t.st } : {}; };
function loadTree(k) {
  T = TREES[k] || TREES.h;
  ({ PEOPLE, LINES, STORIES, FACTS, OPEN_QUESTIONS, CONFLICTS, NOTABLES, SOURCE_GROUPS, CHANGES, MEDIA, MONEY } = T);
  /* levenden: alleen de naam. Wat er verder in de data staat, komt nergens in de site terecht. */
  const sober = p => p.living ? Object.fromEntries(Object.entries(p).filter(([k]) => LIVING_KEEP.has(k))) : p;
  RAW = new Map(PEOPLE.filter(p => !p.alias).map(p => [p.kw, sober(p)]));
  ALIAS_OF = {}; ALIASES = {};
  PEOPLE.filter(p => p.alias).forEach(a => { ALIAS_OF[a.kw] = a.alias; (ALIASES[a.alias] = ALIASES[a.alias] || []).push(a.kw); });
  BY = new Map(RAW);
  Object.keys(ALIAS_OF).forEach(k => { const t = RAW.get(ALIAS_OF[k]); if (t) BY.set(+k, Object.assign({}, t, { kw: +k, aliasOf: t.kw }, stepAt(t, +k))); });
  all = [...RAW.values()].sort((a, b) => a.kw - b.kw);
  ancestors = all.filter(p => !p.living);
  GEN_NAME.splice(1, Infinity, T.focus && T.focus.pair && (T.PEOPLE.find(p => p.kw === 1) || {}).n || T.root, ...GEN_BASE.slice(2)); /* a couple as focus: generation I are their children */
  LINE_KEYS.splice(0, Infinity, ...[8, 9, 10, 11, 12, 13, 14, 15].filter(l => LINES[l])); /* a tree from a deeper focus can miss a family */
}
const person = kw => BY.get(kw) || null;
const twinKws = kw => { const t = ALIAS_OF[kw] || kw; return [t, ...(ALIASES[t] || [])].filter(k => k !== kw); }; /* alle andere nummers van dezelfde persoon */
const implexStory = side => "verhaal-" + ((side || T.key) === "a" ? "dubbel" : "lijnen"); /* het verhaal over kwartierverlies in deze boom */
const halfOf = kw => kw >> (gen(kw) - (T.key === "s" ? 3 : 2)); /* vader- of moederkant van de hoofdpersoon (bij de kinderen: een van de vier grootouders) */
const gen = kw => Math.floor(Math.log2(kw)) + 1;
/* the family (8–15) of a number; none when the tree has no such family (a tree from a deeper focus, with an unknown ancestor) */
const lineOf = kw => { const l = kw < 4 ? null : kw < 8 ? ({ 4: 8, 5: 10, 6: 12, 7: 14 })[kw] : kw >> (gen(kw) - 4); return l && LINES[l] ? l : null; };
const lineColor = kw => { const l = lineOf(kw); return l ? `var(--l${l})` : "var(--faint)"; };
/* fan colours by branch from the centre (shared by the site fan, the book and the cover): the eight ancestors three generations above
   `root` each get a fixed family colour (--l8 … --l15), and everyone above them keeps that colour. With root 1 this is lineColor. */
function fanBranchColors(root) {
  const rel = kw => gen(kw) - gen(root);
  const branch = kw => { const d = rel(kw); if (d < 2) return -1; if (d === 2) return 2 * (kw - root * 4); return (kw >> (d - 3)) - root * 8; };
  const color = kw => { if (root === 1) return lineColor(kw); const b = branch(kw); return b >= 0 && b < 8 ? `var(--l${LINE_KEYS[b]})` : "var(--faint)"; };
  const legend = Array.from({ length: 8 }, (_, b) => { const kw = root * 8 + b, p = person(fanKw(kw)); return { kw, person: p, color: `var(--l${LINE_KEYS[b]})` }; }).filter(x => x.person);
  return { color, branch, legend };
}
const isMale = kw => kw === 1 ? T.rootMale : kw % 2 === 0;
/* ♂ or ♀ next to a name (muted, aria-label and title "man" or "vrouw"). A person with a kw: from the kw (kw 1 is a group: none);
   a person without a kw: pass "m" or "v" only when the data says so (zoon, dochter, broer, zus, a role word); otherwise "" */
const sexMark = p => { const s = typeof p === "string" ? p : p && p.kw > 1 ? (isMale(p.kw) ? "m" : "v") : null; if (s !== "m" && s !== "v") return "";
  const w = s === "m" ? "man" : "vrouw"; return `<span class="sexmark" role="img" aria-label="${w}" title="${w}">${s === "m" ? "♂" : "♀"}</span>`; };
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
    return relBase(gen(kw) - 1, kw) + (gen(kw) > 2 ? ` (${famOf(kw >> (gen(kw) - 2)) || side.brand})` : "");
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
  /* a year with its qualifier, so "vóór 1795" never reads as a known year of death */
  const yq = (s, y) => /\bof\b|^\d{4}\/\d{4}$/.test(s) ? s : /v[óo]{1,2}r\b/i.test(s) ? "vóór " + y : /^na\b/i.test(s) ? "na " + y : isApprox(s) ? "ca. " + y : y;
  const bs = b ? yq(String(p.b), b) : "?", ds = d ? yq(String(p.d), d) : "?";
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
    /* the wedding is already there from p.m: a res line "trouwt met …" in the same year (and place) is the same event */
    const wed = /^(trouwt|trouwde|getrouwd|huwt|huwelijk)\b/i.test(r.t) && ev.find(e => /^getrouwd met/.test(e.t) && e.y === r.y && (!r.p || !e.p || e.p === r.p));
    if (wed) { /* keep what the res line adds ("als boerenknecht", "in de katholieke kerk"), without the verb, the day or the partner again */
      const w = p.m.w || "", rest = r.t.replace(/^(trouwt|trouwde|getrouwd|huwt|huwelijk)\b[\s,;]*/i, "").replace(/^op \d{1,2} \w+\s*/i, "")
        .replace(new RegExp("^(met\\s+)?" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b[\\s,;]*"), "").replace(/^met\s+[^,;(]*$/, "").replace(/^[\s,;]+/, "").trim();
      if (rest) wed.t += "; " + rest;
      return;
    }
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
  if (/^overlijdensadvertentie/i.test(label || "")) return "Krant"; /* a death notice kept by an archive is still a newspaper item */
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
  bewaard: '<path d="M12 3.5l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.8l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z"/>',
  boek: '<path d="M6 4h11.5A1.5 1.5 0 0 1 19 5.5V18H7.5A1.5 1.5 0 0 0 6 19.5z"/><path d="M6 19.5A1.5 1.5 0 0 0 7.5 21H19M9.5 8h6M9.5 11h4"/>',
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
  maken: '<rect x="4" y="10.5" width="16" height="9.5" rx="1.5"/><rect x="3" y="7" width="18" height="3.5" rx="1"/><path d="M12 7v13"/><path d="M12 7C10.6 4.2 7.2 3.7 7.2 5.6 7.2 7 10.2 7 12 7zM12 7c1.4-2.8 4.8-3.3 4.8-1.4C16.8 7 13.8 7 12 7z"/>',
  poster: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 15.5a4 4 0 0 1 8 0M10.2 15.5a1.8 1.8 0 0 1 3.6 0M8 18.5h8"/>',
  print: '<path d="M7 9V3.5h10V9"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M7 14h10v6.5H7z"/><path d="M17.5 12h.01"/>',
  kaarten: '<rect x="3.5" y="6.5" width="11" height="14" rx="1.5"/><path d="M8 6.5v-2A1.5 1.5 0 0 1 9.5 3h9A1.5 1.5 0 0 1 20 4.5v12a1.5 1.5 0 0 1-1.5 1.5h-4"/>',
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
function hideTip() { if (tip) tip.hidden = true; if (typeof iTipHide === "function" && iTipEl) iTipHide(); }
const tipFor = p => `${avatar(p.kw, "tipava")}<b>${esc(p.n)}</b><br><span style="opacity:.8">${esc(lifeYears(p))} · kw ${p.kw}${p.st && !p.living ? " · status " + p.st : ""}</span>`;
/* tooltips only for a mouse: a tap on a phone also sends mouseenter, but never mouseleave, so the label stayed (also on later pages) */
function bindTip(node, html) {
  node.dataset.tipOwn = "1"; /* its own label: no icon tooltip on top */
  node.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") showTip(e, html); });
  node.addEventListener("pointermove", e => { if (e.pointerType === "mouse") moveTip(e); });
  node.addEventListener("pointerleave", hideTip);
}
addEventListener("scroll", () => { if (tip && !tip.hidden) hideTip(); }, { passive: true });
document.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") hideTip(); }, { passive: true });
/* ---------- icon tooltip ---------- */
/* One shared label for every button or link that shows only an icon (‹ › ✕ ⋯ ⤢ + −): the short name of the action (data-tip, or
   the aria-label; a title that adds a shortcut, "Sluiten (Esc)", gives the key), with the key muted on the right. Under the button
   and centred, above it when there is no room, kept 8 px inside the screen with the arrow on the button. After 150 ms on hover
   (at once for the next button within 500 ms), at once on keyboard focus; gone on leave, blur, Esc, a click, scroll and resize.
   Never on touch, and never while a menu, dropdown or panel is open (a modal layer: only for its own buttons). data-tip="" switches
   it off, and so does data-no-tip; close buttons (✕, "Sluiten") never get one; elements with their own label (bindTip) are skipped. The title is taken away on first use, so no second label appears. */
const ITIP_SEL = "button, a[href], [role=button], summary, [data-tip]";
const ITIP_MENU = 'header [aria-expanded="true"], [aria-haspopup][aria-expanded="true"], #menuPanel:not([hidden]), [role="menu"]:not([hidden]), [role="listbox"]:not([hidden])';
const ITIP_DICHT = /^(sluit(en)?|wissen|leegmaken)(\s|$)|\bsluiten$/i;
const ITIP_KEY = /^(Esc|Enter|Tab|Spatie|[←→↑↓]|[A-Z0-9/?+−-]|(Ctrl|Alt|Shift|⌘|⌥)\s*\+?\s*\S+)( (of|\/) \S+)?$/i;
const iTip = document.createElement("div"); iTip.className = "itip"; iTip.id = "itip"; iTip.setAttribute("role", "tooltip"); iTip.hidden = true;
(document.body || document.documentElement).appendChild(iTip);
let iTipEl = null, iTipT = 0, iTipDesc = false, iTipWarm = 0;
function iTipWoorden(el) { /* visible words in the element (screen-reader text and hidden parts do not count) */
  let s = ""; const walk = n => { for (const c of n.childNodes) { if (c.nodeType === 3) s += c.nodeValue; else if (c.nodeType === 1 && !c.hidden && !c.classList.contains("sr-only") && getComputedStyle(c).display !== "none") walk(c); } };
  walk(el); return /\p{L}{2,}/u.test(s);
}
function iTipTekst(el) { /* [name, key] or null */
  if (el.closest("[data-tip-own]") || el.closest("svg") && el.tagName.toLowerCase() !== "svg" || el.querySelector("img, picture, canvas")) return null; /* an image tile is not an icon */
  let lab, key = el.getAttribute("aria-keyshortcuts") || "";
  if (el.hasAttribute("data-tip")) { lab = el.dataset.tip; if (!lab) return null; }
  else { lab = el.getAttribute("aria-label") || el.getAttribute("title") || el.dataset.tipT || ""; if (!lab || iTipWoorden(el)) return null;
    if (el.hasAttribute("data-no-tip") || ITIP_DICHT.test(lab) || /^[×✕✖]$/.test(el.textContent.trim())) return null; } /* a close button: everyone knows ✕ (Harrie) */
  const t = el.getAttribute("title") || el.dataset.tipT || "", m = /^(.*?)\s*\(([^()]{1,14})\)$/.exec(t);
  if (!key && m && ITIP_KEY.test(m[2]) && lab.startsWith(m[1])) key = m[2];
  const m2 = /^(.*?)\s*\(([^()]{1,14})\)$/.exec(lab); if (m2 && ITIP_KEY.test(m2[2])) { lab = m2[1]; key = key || m2[2]; }
  return [lab, key];
}
function iTipGeblokt(el) { /* a menu or panel is open (and visible), or a modal layer the element is not in */
  if ([...document.querySelectorAll(ITIP_MENU)].some(x => x.getClientRects().length && getComputedStyle(x).visibility !== "hidden")) return true;
  if (lb && !lb.hidden) return !lb.contains(el);
  return !!(drawer && !drawer.hidden && !drawer.contains(el));
}
function iTipHide(warm) { clearTimeout(iTipT); iTipT = 0; if (!iTip.hidden && warm) iTipWarm = Date.now(); if (iTipEl && iTipDesc) iTipEl.removeAttribute("aria-describedby"); iTipEl = null; iTipDesc = false; iTip.hidden = true; }
function iTipShow(el) {
  const tx = iTipTekst(el), r = el.getBoundingClientRect(); if (!tx || !r.width || !el.isConnected || iTipGeblokt(el)) return;
  if (el.hasAttribute("title")) { el.dataset.tipT = el.getAttribute("title"); if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", el.dataset.tipT); el.removeAttribute("title"); }
  iTip.innerHTML = `<span class="itip-t">${esc(tx[0])}</span>${tx[1] ? `<kbd class="itip-k">${esc(tx[1])}</kbd>` : ""}`;
  iTip.style.left = "0px"; iTip.style.top = "0px"; iTip.hidden = false; iTipEl = el;
  if (tx[0] !== el.getAttribute("aria-label") && !el.hasAttribute("aria-describedby")) { el.setAttribute("aria-describedby", "itip"); iTipDesc = true; } /* only when it adds something */
  const w = iTip.offsetWidth, h = iTip.offsetHeight, vw = document.documentElement.clientWidth, vh = innerHeight, m = 8, gap = 8;
  const boven = r.bottom + gap + h > vh - m && r.top - gap - h >= m, mid = r.left + r.width / 2;
  const left = Math.round(Math.min(Math.max(m, mid - w / 2), vw - w - m));
  iTip.style.left = left + "px"; iTip.style.top = Math.round(boven ? r.top - gap - h : r.bottom + gap) + "px";
  iTip.style.setProperty("--ax", Math.round(Math.min(w - 9, Math.max(9, mid - left))) + "px"); iTip.classList.toggle("itip-boven", boven);
}
const iTipVan = t => t && t.closest ? t.closest(ITIP_SEL) : null;
document.addEventListener("pointerover", e => { if (e.pointerType === "touch") return; const el = iTipVan(e.target); if (!el || el === iTipEl) return;
  const warm = Date.now() - iTipWarm < 500 || !iTip.hidden; iTipHide(); iTipT = setTimeout(() => { iTipT = 0; if (el.matches(":hover")) iTipShow(el); }, warm ? 0 : 150); });
document.addEventListener("pointerout", e => { const el = iTipVan(e.target); if (el && !el.contains(e.relatedTarget) && (el === iTipEl || !iTipEl)) iTipHide(true); });
document.addEventListener("focusin", e => { const el = iTipVan(e.target); iTipHide(); if (el && el.matches(":focus-visible")) iTipShow(el); });
document.addEventListener("focusout", () => iTipHide());
document.addEventListener("pointerdown", () => { iTipHide(); iTipWarm = 0; }, { capture: true, passive: true });
addEventListener("keydown", e => { if (!iTip.hidden && (e.key === "Escape" || e.key === "Enter" || e.key === " ")) iTipHide(); }, true);
addEventListener("scroll", () => { if (!iTip.hidden || iTipT) iTipHide(); }, { capture: true, passive: true });
addEventListener("resize", () => iTipHide(), { passive: true });
new MutationObserver(() => { if (!iTip.hidden && iTipEl && iTipGeblokt(iTipEl)) iTipHide(); }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["aria-expanded", "hidden"] }); /* a menu that opens: the label goes at once */

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
/* a shorter label in the sub tabs on a phone, where the long name broke over three lines (the menu and the page title keep the long one) */
const SUB_SHORT = {}; /* none: the menu name is the same on a phone (Kruispunten) */
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
/* ---------- memory: heavy pages are emptied two page switches after you left them ---------- */
/* Every page stays in the document once built; after a tour of the site that was ±47.000 nodes. The heaviest pages are emptied
   when they are no longer among the last three you saw, and built again on the next visit (their state, such as filters, stays). */
const HEAVY_VIEWS = { personen: "#cardsOut", namen: "#v-namen", lijst: "#v-lijst", "bronnen-lijst": "#v-bronnen-lijst", "bronnen-tegenstrijdig": "#v-bronnen-tegenstrijdig", zoeken: "#v-zoeken", kranten: "#v-kranten" };
const viewTrail = [];
/* family focus: on a page that shows only the branch, one line under the title says so, with the way back to the whole family */
const FK_FILTERED = new Set(["overzicht", "families", "personen", "namen", "beroepen", "achternamen", "verwanten", "verhalen", "opvallend", "tijdlijn", "kaart", "cijfers", "grond",
  "beeld", "beeld-plaatsen", "beeld-archief", "bronnen", "bronnen-tegenstrijdig", "bronnen-lijst", "zoeken", "kranten"]);
function fkBranchLine(view, sub) {
  const sec = $("#v-" + view); if (!sec) return;
  const f = focusVan(T), whole = !f.pair && f.kw === 1 && !(f.persons || []).length, old = sec.querySelector(".fk-tak");
  if (whole || sub || !FK_FILTERED.has(view)) { if (old) old.remove(); return; }
  const html = `<p class="fk-tak small">Alleen de tak <b>${esc(typeof fkLabel === "function" ? fkLabel() : T.brand)}</b> · <a href="#f1-${esc(view)}">Toon de hele familie</a></p>`;
  if (old) { old.outerHTML = html; return; }
  const h = sec.querySelector(".page-title, h1"); if (h) h.insertAdjacentHTML("afterend", html);
}
function trimViews(view) {
  if (viewTrail[viewTrail.length - 1] !== view) viewTrail.push(view);
  while (viewTrail.length > 3) viewTrail.shift();
  Object.entries(HEAVY_VIEWS).forEach(([v, sel]) => {
    if (viewTrail.includes(v) || !rendered[v]) return;
    const el = $(sel); if (el) { el.innerHTML = ""; rendered[v] = false; }
  });
}
/* ---------- widen the focus ---------- */
/* An old or shared link to a text that does not fit the current focus (its needs name someone outside it, e.g. #fp8-verhaal-lijnen)
   does not end on "not found": the focus widens to the smallest one that holds the text (the side of the family the focus is on,
   then the whole family), the address follows (replaceState), and a short line above the page says why. test(tree) → the text is there. */
let widenNote = null;
function widenTo(test, kind, token) {
  if (!FK || !T || T.key === "s" || !TREES.s) return false;
  const sideOf = n => n < 2 ? "" : (n >> (Math.floor(Math.log2(n)) - 1)) & 1 ? "a" : "h", f = focusVan(T);
  const chain = [...(T.key === "h" || T.key === "a" ? [] : [sideOf(f.kw)]), "s"].filter(k => k && TREES[k]);
  const k = chain.find(x => test(TREES[x])); if (!k) return false;
  setTree(k); widenNote = { kind, whole: k === "s", brand: T.brand };
  try { history.replaceState(history.state, "", "#" + T.prefix + token); } catch (e) { }
  return true;
}
function widenShow(view) {
  const v = $("#v-" + view); if (!v) return; $$(":scope > .widen-note", v).forEach(x => x.remove());
  if (!widenNote) return; const w = widenNote; widenNote = null;
  const wat = { verhaal: "Dit verhaal gaat" }[w.kind] || "Dit gaat";
  v.insertAdjacentHTML("afterbegin", `<p class="widen-note" role="status">${wat} over een andere tak; je ziet het in ${w.whole ? "de hele familie" : "de familie " + esc(w.brand)}.</p>`);
}

function go(token, opts = {}) {
  hideTip(); /* a tooltip never survives a change of page */
  if (document.body && document.body.hasAttribute("data-zuiver")) return; /* het boek in drukmodus heeft de site vervangen */
  if (!archTekstOk && /^beeld(-|$)/.test(token)) { archTekst().then(() => go(token, opts)); return; } /* Beeld heeft de tekst van de archiefbeelden nodig */
  if (/^boek(--|$)/.test(token) && !opts.voorgeladen && typeof window.boekVoorladen === "function") { window.boekVoorladen().then(() => go(token, Object.assign({}, opts, { voorgeladen: true }))); return; } /* het boek: openingsbeelden en tekst eerst */
  let view = token, sub = null; const tok0 = token;
  if (/^lijn-\d+$/.test(token)) { view = "families"; sub = +token.slice(5); if (!LINES[sub]) view = "nietgevonden"; }
  else if (/^verhaal-/.test(token)) { view = "verhalen"; sub = token.slice(8); if (!STORIES.some(s => s.id === sub) && !widenTo(t => (t.STORIES || []).some(s => s.id === sub), "verhaal", token)) view = "nietgevonden"; } /* outside this focus: widen it */
  else if (/^plaats-/.test(token)) { view = "plaats"; sub = SLUG[token] || null; if (!sub) view = "nietgevonden"; }
  else if (/^stamboom-\d+$/.test(token)) { view = "stamboom"; sub = +token.slice(9); if (sub !== 1 && !person(sub)) view = "nietgevonden"; } /* midden van de waaier */
  else if (/^boom-\d+$/.test(token)) { view = "boom"; sub = +token.slice(5); if (sub !== 1 && !person(sub)) view = "nietgevonden"; } /* startpunt van de boom */
  else if (/^profiel-\d+$/.test(token)) { view = "profiel"; sub = +token.slice(8); rendered.profiel = false; } /* the profile as a full page (pfRender) */
  else if (/^profielen-\d+(-\d+){0,3}$/.test(token)) { view = "profielen"; sub = token.slice(10); rendered.profielen = false; } /* several profiles side by side (pcRender) */
  else if (/^vergelijk-\d+(-\d+){0,3}(-kies)?$/.test(token)) { view = "vergelijk"; sub = token.slice(10); rendered.vergelijk = false; } /* two profiles side by side (cmpRender) */
  else if (/^boek(--|$)/.test(token)) { view = "boek"; if (!PB) { rendered.boek = false; } else { bkFromToken(token); const t2 = bkToken(); if (opts.keepHash && t2 !== token) opts = Object.assign({}, opts, { keepHash: false, replace: true }); token = t2; rendered.boek = false; } } /* het boek, met de keuzes in de hash (zonder boekkern: de melding van renderBoek) */
  else if (/^verwant(-|$)/.test(token)) { view = vwFromToken(token) === false ? "nietgevonden" : "verwant"; } /* verwantschap: keuze uit de hash */
  else if (typeof mpRoute === "function" && mpRoute(token)) { const r = mpRoute(token); view = r[0]; if (opts.keepHash && r[1] !== token) opts = Object.assign({}, opts, { keepHash: false, replace: true }); token = r[1]; } /* a product from the engine (kalender …); an old address is set right */
  else if (/^maak(--|$)/.test(token) && VIEWS.includes("maak")) { view = "maak"; mkFromToken(token); const t2 = mkToken(); if (opts.keepHash && t2 !== token) opts = Object.assign({}, opts, { keepHash: false, replace: true }); token = t2; rendered.maak = false; } /* laten maken: de hub, met het beginpunt */
  else if (/^(stam|naam)reeks(-\d+)?$/.test(token) || /^poster(--|$)/.test(token)) { const ps = token[0] === "p"; view = ps ? "poster" : "stamreeks"; if (ps) psFromToken(token); else srFromToken(token); token = ps ? psToken() : srToken(); rendered[view] = false; } /* stamreeks en poster, met de keuzes in de hash */
  else if (/^beeld-?-archief(--|$)/.test(token)) { /* archiefverkenner met filters; het oude beeld--archief… en onbekende waarden worden in de hash rechtgezet */
    view = "beeld-archief"; arvFromToken(token); const t2 = arvToken(); if (opts.keepHash && t2 !== token) opts = Object.assign({}, opts, { keepHash: false, replace: true }); token = t2; rendered[view] = false; }
  if (opts.keepHash && token !== tok0 && view !== "nietgevonden") opts = Object.assign({}, opts, { keepHash: false, replace: true }); /* a page normalised its token (stap, soort …): the address follows */
  if (/^kaart(--persoon-\d+)?$/.test(token)) { /* the map, or the places of one life (kaart--persoon-N); nothing of the living */
    const k = token.length > 5 ? +token.slice(15) : 0, q = k ? person(k) : null;
    if (mapFocusPerson && !(q && !q.living)) Object.assign(mapState, { year: 2026, zoom: 1, cx: null, cy: null }); /* back from one life to everyone */
    view = "kaart"; mapFocusPerson = q && !q.living ? k : null; mapFocusLiving = !!(q && q.living); mapState.place = null; rendered.kaart = false;
    if (mapFocusPerson) { /* one life: zoom in on its places (at most 4×) */
      const xy = [...new Set(personMapEvents(mapFocusPerson).map(e => e.p))].map(k => proj(PLACES[k].la, PLACES[k].lo));
      if (xy.length) { const xs = xy.map(v => v[0]), ys = xy.map(v => v[1]), w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
        Object.assign(mapState, { zoom: Math.max(1, Math.min(4, MW / (w * 2.5 || 1), MH / (h * 2.5 || 1))), cx: (Math.max(...xs) + Math.min(...xs)) / 2, cy: (Math.max(...ys) + Math.min(...ys)) / 2 }); } }
    if (k && !mapFocusPerson) token = "kaart"; }
  if (BRON_OUD[view]) { view = token = BRON_OUD[view]; opts = Object.assign({}, opts, { replace: true, keepHash: false }); }
  if (/^bronnen-(begrippen|wijzigingen|beeld)$/.test(token)) { view = "bronnen-over"; sub = token.slice(8); } /* een onderdeel van Over deze site */
  if (!VIEWS.includes(view)) view = token && token !== "overzicht" ? "nietgevonden" : "overzicht"; /* een onbekend adres: zeg het, en laat het adres staan */
  if (view === "nietgevonden") { if (token !== "nietgevonden") route.fout = T.prefix + token; rendered.nietgevonden = false; }
  const nodig = (LATER_VOOR[view] || []).filter(n => !laterKlaar(n));
  if (nodig.length && !opts.later) { Promise.all(nodig.map(laadLater)).then(() => go(token, Object.assign({}, opts, { later: true }))); return; } /* the page's data/later files first */
  if (!drawer.hidden && !opts.keepDrawer) closeProfile(true);
  if (!lb.hidden) closeLb(true);
  if (view !== "kaart") stopPlay();
  route.view = view; route.sub = sub;
  VIEWS.forEach(x => { const s = $("#v-" + x); if (s) s.hidden = x !== view; });
  trimViews(view); /* heavy pages you left two switches ago are emptied (memory on a phone) */
  $$("nav.tabs button").forEach(b => { if (b.dataset.view === (NAV_OF[view] || view)) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  showActiveTab();
  if (typeof menuSync === "function") menuSync(); /* hoofdmenu */
  const r = RENDER[view];
  if (["families", "verhalen", "plaats", "boom"].includes(view) || (view === "stamboom" && (sub || fanRoot > 1))) r(sub);
  else if (!rendered[view]) { rendered[view] = true; r(); }
  if (view === "bronnen-over") requestAnimationFrame(() => bronNaar(sub));
  if (FK) fkBranchLine(view, sub);
  if (FK) widenShow(view); /* "Dit verhaal gaat over een andere tak …" after a widened focus; gone on the next page */
  if (!opts.keepHash) setHash(T.prefix + token, opts.replace ? "replace" : "push");
  const terugY = opts.fromHistory && history.state && typeof history.state.y === "number" ? history.state.y : null;
  if (terugY !== null) { requestAnimationFrame(() => window.scrollTo({ top: terugY })); setTimeout(() => { if (Math.abs(scrollY - terugY) > 40) window.scrollTo({ top: terugY }); }, 250); } /* terug of vooruit: waar je was */
  else if (!opts.keepScroll) window.scrollTo({ top: 0 });
  closeSearch();
  if (typeof fkRegel === "function") requestAnimationFrame(() => { tpSync(); fkRegel(); if (FK_KOP) footLater(); }); /* the family choice in the header (FK1), and the footer with it */
}
/* browsergeschiedenis: elke paginawissel en elk geopend profiel is een stap, zodat vorige/volgende werken (ook via file://) */
let lbNavReplace = false; /* set by a link in the lightbox (see there); here, because setHash runs at startup */
function setHash(h, how, state) {
  if (how === "push" && lbNavReplace) { how = "replace"; lbNavReplace = false; } /* from a link in the lightbox: in the place of its step */
  const url = "#" + h;
  if (location.hash === url) return;
  if (how === "push") try { history.replaceState(Object.assign({}, history.state, { y: Math.round(scrollY) }), ""); } catch (e) {} /* de scrollpositie van de pagina die je verlaat */
  try { history[how === "push" ? "pushState" : "replaceState"](state || null, "", url); } catch (e) {}
}
/* telefoon: het menu scrolt opzij; houd het actieve tabblad in beeld en laat met een vervaging zien dat er meer is */
function navFade() { const n = $("nav.tabs"); if (!n) return; n.classList.toggle("fr", n.scrollLeft + n.clientWidth < n.scrollWidth - 4); n.classList.toggle("fl", n.scrollLeft > 4); }
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
/* the key of a person in the data files (KORT, images): "<kw>" on Harrie's side, "a-<kw>" on Alies'. In s through side/origKw, in a
   focus tree through sKw (the person's number in s) */
let S_BY = null;
function dataKey(kw) {
  if (T.key in TREE_PRE) return TREE_PRE[T.key] + kw;
  const p = person(kw); if (!p) return "-";
  let q = p; if (T.key !== "s") { if (!S_BY) S_BY = new Map(TREES.s.PEOPLE.filter(x => !x.alias).map(x => [x.kw, x])); q = p.sKw ? S_BY.get(p.sKw) : null; }
  if (!q && p.origKw) q = p; /* the living keep side and origKw but not sKw (LIVING_KEEP) */
  return q && q.origKw ? (q.side === "a" ? "a-" : "") + q.origKw : "-";
}
const imgKey = kw => dataKey(kw);
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
const nlNaam = s => String(s || "").replace(/Cultural Heritage Agency of the Netherlands/g, "Rijksdienst voor het Cultureel Erfgoed")
  .replace(/Association De Hollandsche Molen/g, "Vereniging De Hollandsche Molen").replace(/Historic Cent(?:er|re) Leeuwarden/g, "Historisch Centrum Leeuwarden");
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
const ARCH_ALL = (PACK_IDX.items || []).map(a => ({ id: a[0], pack: a[1], soort: a[2], key: String(a[3]), kws: a[4] ? a[4].map(String) : null, t: a[5] || "", datum: a[6] || "", bron: a[7] || "", desc: a[8] || "", p: a[9] || null, tm: a[10] ? 1 : 0 }));
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
  /* family focus on a branch: only the places of that branch (the line under the title leads to the whole family and all places) */
  const f = FK ? focusVan(T) : null, here = f && (f.pair || f.kw !== 1 || (f.persons || []).length)
    ? new Set(all.filter(p => !p.living).flatMap(p => [p.bp, p.dp, p.m && p.m.p, ...(p.res || []).map(r => r.p)]).filter(Boolean)) : null;
  const inPlace = k => !!PLACES[k] && (!here || here.has(k));
  return ARCH_TREE[T.key] = ARCH_ALL.filter(a => a.kws ? a.kws.some(k => who[k]) || inPlace(a.p) : inPlace(a.key)).map(a => {
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
    if (IMG_ID[it.id]) { /* al bekend als paginabeeld: onthoud de grotere archiefversie (voor het boek) */
      const x = IMG_ID[it.id]; if (!x.arch && it.src && (it.w || 0) > (x.w || 0)) x.groot = { src: it.src, w: it.w, h: it.h };
      return x;
    }
    /* src = los bestand in img/archief/ (sinds 8-10-2026: alleen geladen als het beeld getoond wordt); data = oude vorm (base64) */
    let src = it.src; if (!src) try { src = URL.createObjectURL(dataUrlBlob(it.data)); } catch (e) { return null; }
    const im = Object.assign({}, it, { src, thumb: it.thumb || src, arch: true }); delete im.data;
    IMG_ID[im.id] = im; return im;
  }).filter(Boolean));
  return PACK_CACHE[name];
}
/* ---------- rarely used data, loaded on demand ---------- */
/* A file in data/later/ is not in index.html; laadLater("<name>") adds it as a script tag the first time it is needed (that also
   works from disk, file://). Each such file ends with the line
     (globalThis.LATER_KLAAR = globalThis.LATER_KLAAR || {})["<name>"] = true;
   so the loader can see it has run. The single-file build (build.py) inlines data/later/*.js with the rest: the line has then
   already run and nothing is loaded. A name with a slash is a path (for example "src/products/renderers/calendar.js").
   A page that needs such data before it renders is listed in LATER_VOOR: go() waits for it (view: [names]). */
const LATER_P = {}, LATER_VOOR = {};
const laterKlaar = name => !!(globalThis.LATER_KLAAR || {})[name];
function laadLater(name) {
  if (laterKlaar(name)) return Promise.resolve(true);
  return LATER_P[name] || (LATER_P[name] = new Promise(res => {
    const sc = document.createElement("script"); sc.src = /\//.test(name) ? name : "data/later/" + encodeURIComponent(name) + ".js";
    sc.onload = () => { sc.remove(); res(laterKlaar(name)); };
    sc.onerror = () => { sc.remove(); delete LATER_P[name]; res(false); }; /* missing: the page renders without it; a later visit tries again */
    document.head.appendChild(sc);
  }));
}
window.laadLater = laadLater; window.laterKlaar = laterKlaar; window.LATER_VOOR = LATER_VOOR;
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
function percelenHtml(kw, o = {}) { /* o.credit false: one credit line for the whole page instead of one per map */
  const p = person(kw); if (!p || p.living) return "";
  const ks = [kw, ...twinKws(kw)].map(imgKey), maps = [...new Set(ks.flatMap(k => PERC[k] || []))];
  if (!maps.length) return "";
  const uses = rs => { const c = {}; rs.forEach(r => { const u = (r.use || "").toLowerCase(); if (u) c[u] = (c[u] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([u, n]) => n > 1 ? `${u} (${n})` : u).join(", "); };
  return `<section class="perc"><h5>Hun grond in 1832</h5><p class="small" style="margin:0 0 10px">Bij de invoering van het kadaster in 1832 werd elk perceel opgemeten en met de eigenaar ingeschreven. Op de oude kaart zijn de percelen van ${esc(firstName(p))} rood omlijnd.</p>
    <div class="pgal perc" data-imggroup>${maps.map(k => fig(k, { thumb: true, credit: false, cap: `${k.g}, sectie ${k.s}: ${k.rows.length === 1 ? "1 perceel" : k.rows.length + " percelen"}${k.rows.some(r => r.m2) ? `, ${ha(k.rows.reduce((a, r) => a + (r.m2 || 0), 0))} ha` : ""}` })).join("")}</div>${o.credit !== false ? credits(maps) : ""}
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
/* vangnet: soms staat de "structured data" van Wikimedia in de beschrijving ("location of creation: … → … depicts …"); die staart weg */
const zonderSD = d => String(d || "").replace(/This is an image of rijksmonument number (\d+)/i, "Rijksmonument $1.").replace(/\s*(?:Information from structured data:|location of creation\s*:|depicts\s*:|instance of\s*:)[\s\S]*$/i, "").trim();
/* a deed's caption that starts by repeating kind, place and ISO date ("Geboorteakte, Weststellingwerf, 1852-08-28."): the title and the
   date under the caption say that already */
const zonderAkteKop = d => String(d || "").replace(/^[A-Z][a-z]*akte(?:\s+\([^)]*\))?,\s*[^,.]+,\s*\d{4}-\d{2}-\d{2}\.\s*/, "");
const descOf = im => { const o = rmMeta(im.desc); return o ? rmDesc(o) : zonderAkteKop(zonderSD(im.desc)); };
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
  if (/^public domain\b/i.test(l) || /\{\{PD-/i.test(l)) return "publiek domein"; /* also "Public domain ({{PD-old-70}}…)" from Commons */
  l = l.replace(/\s*\(Public Domain\)/i, ""); /* "Publiek domein (Public Domain), volgens het Rijksmuseum" */
  if ((m = /^(?:CC\s+)?(BY(?:-(?:SA|NC|ND|NC-SA|NC-ND))?)\s+([\d.]+)(?:\s+(nl|NL|int))?$/i.exec(l))) return `CC ${m[1].toUpperCase()} ${m[2]}${m[3] && m[3].toLowerCase() === "nl" ? " NL" : ""}`;
  return l;
}
function credit(im) {
  const bn = bronOf(im), raw = im.lic || (bn === "Wikimedia Commons" ? "licentie: zie Commons" : ""), lic = licLabel(raw);
  const url = httpUrl(im.licUrl) ? im.licUrl : httpUrl(raw) ? raw.trim() : "";
  const mk = makerOf(im);
  const mkHtml = httpUrl(mk) ? `<a href="${esc(mk)}" target="_blank" rel="noopener">maker: zie ${/rkd\.nl/i.test(mk) ? "RKD" : "bron"}</a>` : esc(mk); /* a URL as maker */
  return [norm(mk) === norm(bn) ? "" : mkHtml, lic ? (url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(lic)}</a>` : esc(lic)) : "", httpUrl(im.bron) ? `<a href="${esc(im.bron)}" target="_blank" rel="noopener">${esc(bn)}</a>` : esc(bn)].filter(Boolean).join(" · ");
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
const refLine = im => [im.ref ? esc(nlNaam(im.ref)) : "", httpUrl(im.orig) && !verkleind(im) /* bij een verkleind beeld staat de link in de regel eronder */ ? `<a href="${esc(im.orig.trim())}" target="_blank" rel="noopener">origineel bekijken</a>` : ""].filter(Boolean).join(" · ");
/* naamsvermelding bij een rij tegels: inklapbaar (scheelt op de telefoon een halve pagina); de lichtbak toont hem ook per beeld */
/* one line per different credit: the same credit for four images is "4 beelden: …", not four times the same line */
const credits = ims => { const u = ims.filter((x, i, a) => x && a.indexOf(x) === i); if (!u.length) return "";
  const c = new Map(); u.forEach(im => { const t = credit(im).replace(/^(\s*\u00b7\s*)+/, ""); c.set(t, (c.get(t) || 0) + 1); });
  return `<details class="small mcredit"><summary>Bronnen en makers van ${u.length > 1 ? `deze ${u.length} beelden` : "dit beeld"}</summary>${[...c].map(([t, n]) => n > 1 ? `${n} beelden: ${t}` : t).join("; ")}</details>`; };
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
  if (lb.hidden) { lbFocus = document.activeElement;
    if (!lbHist) { try { history.pushState(Object.assign({}, history.state, { lb: 1 }), ""); lbHist = true; } catch (e) { } } } /* "back" closes the lightbox */
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
  /* één regel: "Verkleind (640 × 427 van 3.000 × 2.000 px) · Toon origineel · Bij Rijksmuseum ↗" */
  const toon = im.oi && EXTERN_BEELD ? `<button class="link" id="lbToon" type="button">Toon origineel</button>` : "";
  const ou = im.ou || (httpUrl(im.orig) ? im.orig.trim() : "");
  const link = ou ? `<a href="${esc(ou)}" target="_blank" rel="noopener">Bij ${esc(bronNaamKort(im))} ↗</a>` : "";
  return `<p class="lbverkl" id="lbVerkl"><span>Verkleind (${px(im.w, im.h).replace(" px", "")} van ${px(im.ow, im.oh)})</span>${[toon, link].filter(Boolean).map(x => " · " + x).join("")}</p>`;
}
const bronNaamKort = im => (nlNaam(im.bronNaam || "").split(/[,(»:]/)[0] || "de bron").trim();
function lbToonOrigineel(im) {
  const img = $("#lbImg"), b = $("#lbToon"), r = $("#lbVerkl"); if (!img || !b) return;
  if (img.dataset.orig === im.id) { /* terug naar de eigen versie */
    img.src = im.src; img.width = im.w; img.height = im.h; delete img.dataset.orig; lb.classList.remove("lbvol");
    b.textContent = "Toon origineel"; const v = $("#lbVol"); if (v) v.remove(); return;
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
/* the lightbox is a step in the history: "back" closes it and stays on the page; closing it yourself removes that step again.
   Closed silently (a link in the caption, another page) the step stays: it is the same page. */
let lbHist = false, lbSkipPop = false;
function closeLb(silent) {
  lb.hidden = true; $("#lbImg").removeAttribute("src"); if (!silent && lbFocus && lbFocus.focus) lbFocus.focus();
  if (lbHist) { lbHist = false; if (!silent) { lbSkipPop = true; history.back(); } }
}
addEventListener("popstate", e => {
  if (lbSkipPop) { lbSkipPop = false; e.stopImmediatePropagation(); return; } /* our own step back after closing */
  if (lbHist && !lb.hidden) { lbHist = false; closeLb(true); if (lbFocus && lbFocus.focus) lbFocus.focus(); e.stopImmediatePropagation(); }
});
/* a link in the lightbox (a person, a place, a page): close the lightbox first, and let the navigation take the place of the lightbox's
   step in the history, so "back" from the profile returns to the page under the lightbox (not to a closed lightbox) */
lb.addEventListener("click", e => {
  const a = e.target.closest("[data-open], [data-go], [data-view], [data-media], [data-archief], a[href^='#']"); if (!a || !lb.contains(a)) return;
  if (lbHist) { lbNavReplace = true; setTimeout(() => { lbNavReplace = false; }, 0); } /* only for the navigation of this click */
  lbHist = false; closeLb(true);
  if (a.matches("a[href^='#']") && !a.matches("[data-open], [data-go], [data-view], [data-media], [data-archief]") && lbNavReplace) { e.preventDefault(); lbNavReplace = false; location.replace(a.getAttribute("href")); }
}, true);
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
  const via = rootGroup() && ks[1] ? `, via ${sideName(ks[1])}` : "";
  const lang = ks.length >= 10, hid = i => lang && i >= 2 && i < ks.length - 3;
  /* de lijn onder een rij is de stap naar de volgende generatie: gestreept bij C, gestippeld bij D */
  const rij = (k, i) => {
    const q = person(k), s = i < ks.length - 1 ? stapSt(ks[i + 1]) : null, w = s === "C" || s === "D" ? " kp-" + s : "";
    const rel = k === 1 ? (rootGroup() ? "kinderen" : "zelf") : relBase(gen(k) - 1, k);
    const nm = k === 1 && rootGroup() ? groupName() : q ? q.n : "";
    const yrs = q && !q.living && /\d/.test(lifeYears(q)) ? pfYears(q) : ""; /* one form for an unknown year in the profile */
    const naam = k === kw ? `<b>${esc(nm)}</b>` : `<button class="link" data-open="${k}">${esc(nm)}</button>`;
    return `<li class="kp${w}${k === kw ? " kp-nu" : ""}"${hid(i) ? " hidden" : ""}${w ? ` title="De stap naar de volgende generatie: ${s}, ${BEWIJS_KORT[s]}"` : ""}><span class="kp-rel">${esc(rel)}</span><span class="kp-n">${naam}${yrs ? ` <small>${esc(yrs)}</small>` : ""}</span></li>`;
  };
  let li = ks.map(rij);
  if (lang) { const n = ks.length - 5, w = ks.slice(3, -2).map(stapSt).reduce((a, s) => s === "D" || (s === "C" && a !== "D") ? s : a, null);
    li.splice(ks.length - 3, 0, `<li class="kp kp-more${w ? " kp-" + w : ""}"><span class="kp-rel"></span><span class="kp-n"><button type="button" class="link kp-tog" aria-expanded="false">… ${n} generaties …</button></span></li>`); }
  return `<section><h5>Zo hoort ${esc(firstName(p))} bij ${esc(rootGroup() ? groupName() : T.root)}${via}</h5><ol class="kpath">${li.join("")}</ol>${schakelRegel(kw)}</section>`;
}
/* ---------- profile: navigation in the header ---------- */
/* The header of the profile (drawer and full page): back and forward through the profiles seen (the ordinary browser history;
   the trail of kw numbers is kept in history.state.pn), a clickable path from kw 1 to this person, and one row of buttons:
   previous in the generation · father · mother · partner · child · next in the generation. On a phone (≤ 560 px) that row is a
   bar at the bottom of the drawer. Keys: ← → generation, ↑ father, ↓ child (↑ ↓ only with the focus in the header or the bar).
   Full page: #profiel-<kw> (also a-/s-), the same content as a view; sharing keeps the link #kw<n>. */
const PN_PATH = {
  back: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  fwd: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  full: '<path d="M14 4h6v6"/><path d="M10 20H4v-6"/><path d="m20 4-7 7"/><path d="m4 20 7-7"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M14 4v16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  vader: '<path d="M17 17 7 7"/><path d="M7 15V7h8"/>',
  moeder: '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
  partner: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
  kind: '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
  prev: '<path d="m15 18-6-6 6-6"/>',
  next: '<path d="m9 18 6-6-6-6"/>',
  more: '<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>',
  read: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.8l-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z"/>',
  make: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  map: '<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2"/>',
  cols: '<rect x="3" y="4" width="7.5" height="16" rx="1.5"/><rect x="13.5" y="4" width="7.5" height="16" rx="1.5"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>'
};
const pnIco = k => `<svg class="pn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PN_PATH[k]}</svg>`;
const PN_PHONE = matchMedia("(max-width:560px)");
const PN = { t: [], i: -1, d: 0, onder: null }; /* trail of kw numbers, position of the open profile, profile entries pushed on top of the page under it */
let pnCont = false, pnFocus = null; /* the next profile continues the trail; the button that gets the focus after a step */
/* the number to open: the place itself, or above a duplicate place (pedigree collapse) the number where the data is */
const pnTarget = k => k >= 1 && BY.has(k) ? k : k >= 1 && BY.has(fanKw(k)) ? fanKw(k) : null;
let PN_GEN = null, PN_GEN_BY = null;
function pnGenList(g) { /* known numbers per generation, sorted (rebuilt when the tree changes) */
  if (PN_GEN_BY !== BY) { PN_GEN = new Map(); PN_GEN_BY = BY; for (const k of BY.keys()) { const x = gen(k); if (!PN_GEN.has(x)) PN_GEN.set(x, []); PN_GEN.get(x).push(k); } PN_GEN.forEach(a => a.sort((x, y) => x - y)); }
  return PN_GEN.get(g) || [];
}
function pnGenNb(kw, dir) { const L = pnGenList(gen(kw)); if (dir < 0) { for (let j = L.length - 1; j >= 0; j--) if (L[j] < kw) return L[j]; } else for (const k of L) if (k > kw) return k; return null; }
/* FK: a person of the whole family (s) by s number, also outside the branch of the focus; the living: the name only */
function fkRecord(sK) {
  const S = TREES.s; if (!S || !(sK >= 1)) return null;
  let p = null; for (let i = 0, k = sK; i < 8 && !p; i++) { const x = S.PEOPLE.find(q => q.kw === k); if (!x) break; if (x.alias) k = x.alias; else p = x; }
  return p ? (p.living ? { n: p.n, roep: p.roep, living: true, kw: sK } : p) : null;
}
/* FK: the profile of someone outside the branch: no kw here, the words "andere tak", and a way to make them the focus */
function openOther(sK) {
  const p = fkRecord(sK); if (!p) return;
  if (drawer.hidden) lastFocus = document.activeElement;
  pnDock(false); curKw = null; const nav = $("#dNav"); if (nav) nav.remove();
  $("#dHead").className = "pn-head";
  $("#dTop").innerHTML = `<span class="pn-tname" aria-hidden="true">${esc(p.n)}</span><div class="pn-win"><button type="button" class="pn-ib" aria-label="Sluiten" title="Sluiten (Esc)" id="dClose">${pnIco("close")}</button></div>`;
  $("#dHead").innerHTML = `<div class="eyebrow pn-eb">andere tak</div><h2 id="dName">${esc(p.n)}</h2>`;
  const yrs = p.living ? "" : pfYears(p), born = p.living ? "" : [fmt(p.b), placeName(p.bp)].filter(Boolean).join(", "), died = p.living ? "" : [fmt(p.d), placeName(p.dp)].filter(Boolean).join(", ");
  $("#dBody").innerHTML = `${yrs && !born && !died ? `<p>${esc(yrs)}</p>` : ""}${born || died ? `<dl class="dl">${born ? `<dt>Geboren</dt><dd>${esc(born)}</dd>` : ""}${died ? `<dt>Overleden</dt><dd>${esc(died)}</dd>` : ""}</dl>` : ""}
    <p class="stnote">${esc(firstName(p))} hoort niet bij deze stamboom: ${p.living ? "van levende familieleden staat hier alleen de naam" : "deze persoon staat in een andere tak van de familie"}.</p>
    <div class="dacts"><button type="button" class="btn primary" data-fk-from="${sK}">Bekijk de familie vanaf hier</button></div>`;
  drawer.hidden = false; scrim.hidden = false;
  $("#dClose").onclick = () => closeProfile(true); $("#dClose").focus();
}
/* "Stamboom vanaf …": make this person (or the couple) the focus of the whole site, as the choice in the header does.
   c = { kw (in T; a couple: the father's kw), pair, voor (names of their children it is for) } */
const sOf = kw => T.toS ? T.toS(kw) : T.key === "s" ? kw : naarS(T.key, kw);
function centerIsNow(c) {
  if (FK) { const f = focusVan(T), k = sOf(c.kw), noVoor = !(c.voor || []).length, fVoor = !((T.focus || {}).persons || []).length;
    if (k === 2 && c.pair && noVoor) return f.kw === 1 && !f.pair; /* Harrie and Alies together = the whole family (s) */
    return f.kw === k && !!f.pair === !!c.pair && fVoor === noVoor; }
  const f = fkActief(), now = f ? { start: f.start, paar: !!f.paar, voor: f.voor || [] } : T.key === "s" ? { start: 2, paar: true, voor: [] } : { start: 1, paar: false, voor: [] };
  return now.start === c.kw && now.paar === !!c.pair && now.voor.join() === (c.voor || []).join();
}
function centerChoices(kw) {
  const p = person(kw); if (!p || p.virtual || (kw === 1 && rootGroup()) || typeof fkKies !== "function") return [];
  const nm = q => q.roep || firstName(q), out = [{ kw, pair: false, label: "Stamboom vanaf " + nm(p) }];
  const q = kw > 1 ? person(fanKw(kw ^ 1)) : null;
  if (q) { const a = kw % 2 ? q : p, b = kw % 2 ? p : q; out.push({ kw: kw & ~1, pair: true, label: famOf(kw >> 1) ? "Familie " + famOf(kw >> 1) : "Stamboom vanaf " + nm(a) + " en " + nm(b), small: true }); } /* the couple by its family names, as in the family choice */
  return out.filter(c => !centerIsNow(c));
}
const centerBtns = (kw, cs) => cs.map(c => `<button type="button" class="btn${c.small ? " btn-klein" : ""}" data-center="${c.kw}" data-pair="${c.pair ? 1 : 0}"${(c.voor || []).length ? ` data-voor="${esc(c.voor.join("|"))}"` : ""}>${c.small ? "" : navIco("stamboom")}${esc(c.label)}</button>`).join("");
function centerOn(c, reopen) {
  const voor = c.voor || [];
  if (FK) { const key = focusSleutel(sOf(c.kw), !!c.pair, voor.map(n => String(n).toLowerCase()));
    fkFocus = null; setTree(key); go(currentToken()); tpSync();
    fkLive(BK_VOORWIE_TEKST.kopGekozen.replace("{soort}", fkSoort()).replace("{fam}", fkLabel()));
    if (reopen) openProfile(c.pair ? 2 + (reopen % 2) : 1); return; }
  fkKies({ tree: T.key, start: c.kw, paar: !!c.pair, persoon: !c.pair, voor });
  if (reopen) openProfile(reopen);
}
document.addEventListener("click", e => { const b = e.target.closest("[data-center]"); if (!b) return; e.preventDefault(); e.stopPropagation();
  const kw = +b.dataset.center, me = curKw || kw, voor = b.dataset.voor ? b.dataset.voor.split("|") : [];
  centerOn({ kw, pair: b.dataset.pair === "1", voor }, voor.length ? null : me); }, true);
/* a living family member without a kw (DESCENDANTS): a small profile with the name, the parents and the brothers and sisters only */
function openDesc(id) {
  const D = descList(), d = D.find(x => x.id === id); if (!d) return;
  const nameOf = key => { const side = /^a-/.test(key) ? "a" : "h", k = +String(key).replace(/^a-/, ""), t = TREES[side]; const q = t && t.PEOPLE.find(x => x.kw === k && !x.alias); return q ? q.roep || firstName(q) : ""; };
  const who = key => { const k = keyToKw(key), q = k ? person(k) : null, n = nameOf(key) || (q ? firstName(q) : "");
    return q ? `<button type="button" class="link" data-open="${k}">${esc(n)}</button>` : esc(n); };
  const fk = keyToKw(d.father), inLine = fk && fk >= 2 && !((fk >> 1) === 1 && rootGroup()) ? person(fk >> 1) : null;
  const sibs = [...(inLine ? [`<button type="button" class="link" data-open="${fk >> 1}">${esc(inLine.roep || firstName(inLine))}</button>`] : []),
    ...D.filter(x => x.id !== id && x.father === d.father && x.mother === d.mother).map(x => `<button type="button" class="link" data-desc="${esc(x.id)}">${esc(x.roep || x.n)}</button>`)];
  if (drawer.hidden) lastFocus = document.activeElement;
  pnDock(false); curKw = null; const nav = $("#dNav"); if (nav) nav.remove();
  $("#dHead").className = "pn-head";
  $("#dTop").innerHTML = `<span class="pn-tname" aria-hidden="true">${esc(d.roep || d.n)}</span><div class="pn-win"><button type="button" class="pn-ib" aria-label="Sluiten" title="Sluiten (Esc)" id="dClose">${pnIco("close")}</button></div>`;
  $("#dHead").innerHTML = `<div class="eyebrow pn-eb">kind van ${esc(nameOf(d.father))} en ${esc(nameOf(d.mother))}</div><h2 id="dName">${esc(d.roep || d.n)}</h2>`;
  $("#dBody").innerHTML = `<p class="stnote">Van levende familieleden staan op deze site alleen de naam en de plaats in de familie.</p>
    <section><h5>Ouders</h5><p style="margin:0">${who(d.father)} en ${who(d.mother)}</p></section>
    ${sibs.length ? `<section><h5>Broers en zussen</h5><p style="margin:0">${sibs.join(", ")}</p></section>` : ""}
    ${(c => c && !centerIsNow(c) ? `<div class="dacts">${centerBtns(0, [Object.assign(c, { label: "Stamboom vanaf " + (d.roep || d.n) })])}</div>` : "")(fk >= 2 && fk % 2 === 0 && keyToKw(d.mother) === fk + 1 ? { kw: fk, pair: true, voor: [d.roep || d.n] } : null)}`;
  drawer.hidden = false; scrim.hidden = false;
  $("#dClose").onclick = () => closeProfile(true); $("#dClose").focus();
}
document.addEventListener("click", e => { const o = e.target.closest("[data-desc]"); if (o) { e.preventDefault(); e.stopPropagation(); openDesc(o.dataset.desc); } }, true);
document.addEventListener("click", e => {
  if (!FK) return;
  const o = e.target.closest("[data-other]"); if (o) { e.preventDefault(); e.stopPropagation(); openOther(+o.dataset.other); return; }
  const f = e.target.closest("[data-fk-from]"); if (f) { e.preventDefault(); const k = focusSleutel(+f.dataset.fkFrom, false); closeProfile(true); setTree(k); go("profiel-1"); }
}, true);
/* the root of T is a group when kw 1 are children together: the joined tree, or (FK) a couple chosen as the focus */
const rootGroup = () => T.key === "s" || !!(T.focus && T.focus.pair);
/* the name of a group root, and of a side under it (s: Harrie and Alies; a couple: the two of them) */
const groupName = () => T.key === "s" ? T.rootFull : (person(1) || {}).n || T.rootFull;
const sideName = k => T.key === "s" ? TREES[k === 2 ? "h" : "a"].root : firstName(person(k) || { n: "" });
/* the short name of kw k in a sentence: a group of more than two children is "de kinderen" */
const shortOf = k => { const q = person(k); if (!q) return ""; if (k === 1 && rootGroup()) { const n = String(q.n || ""); return T.key === "s" || n.split(/,| en /).length > 2 ? "de kinderen" : n; } return firstName(q); };
/* FK: a person outside the branch of a single-person focus, as an s number (the partner, the child): null when none */
const fkOutside = (kw, what) => { if (!FK || !T.focus || T.focus.pair || kw !== 1 || !T.toS) return null; const sK = T.toS(1); if (!sK) return null;
  if (what === "kind") return sK > 1 ? sK >> 1 : null;
  const m = ((person(1) || {}).marriages || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)).find(x => x.kw >= 1); const p = person(1) || {};
  return m ? naarS(p.side === "a" ? "a" : "h", m.kw) : sK > 1 ? sK ^ 1 : null; };
function pnLinks(kw) {
  const me = person(kw) || {};
  const kidWord = kw < 2 ? "Kind" : rootGroup() && kw < 4 ? "Kinderen" : isMale(kw >> 1) ? "Zoon" : "Dochter";
  return [
    { k: "prev", word: "Vorige", kw: pnGenNb(kw, -1), key: "←", aria: "Vorige in generatie " + ROMAN[gen(kw)] },
    { k: "vader", word: "Vader", kw: pnTarget(kw * 2), key: "↑" },
    { k: "moeder", word: "Moeder", kw: pnTarget(kw * 2 + 1) },
    { k: "partner", word: kw < 2 ? "Partner" : kw % 2 ? "Echtgenoot" : "Echtgenote", kw: kw > 1 ? pnTarget(mfPartnerKws(me, kw)[0] || kw ^ 1) : null, other: fkOutside(kw, "partner") }, /* several marriages: the first partner in the tree */
    { k: "kind", word: kidWord, kw: kw > 1 ? pnTarget(kw >> 1) : null, key: "↓", other: fkOutside(kw, "kind") },
    { k: "next", word: "Volgende", kw: pnGenNb(kw, 1), key: "→", aria: "Volgende in generatie " + ROMAN[gen(kw)] }
  ].map(l => { const q = l.kw ? person(l.kw) : l.other ? fkRecord(l.other) : null;
    /* a step to a parent or child is only as sure as the link: C (onzeker) or D (hypothese) next to the word */
    const lk = l.k === "vader" || l.k === "moeder" ? q && !q.living && q.link : l.k === "kind" ? !me.living && me.link : null;
    return Object.assign(l, { p: q, st: lk === "C" || lk === "D" ? lk : null }); });
}
/* the short top line: "overgrootvader", in the joined tree "overgrootvader · kant van Harrie" (the path says of whom) */
function pnRelWords(kw) {
  if (kw === 1) return T.key === "s" ? "de kinderen van Harrie en Alies" : rootGroup() ? ((T.focus.persons || []).length === 1 ? "kind van " : "de kinderen van ") + sideName(2) + " en " + sideName(3) : relBase(0, 1);
  const r = relBase(gen(kw) - 1, kw), of = FK && T.focus ? " van " + (rootGroup() ? shortOf(1) : T.root) : ""; /* a chosen focus: say of whom */
  return rootGroup() && gen(kw) > 2 ? r + of + ` (${famOf(kw >> (gen(kw) - 2)) || sideName(kw >> (gen(kw) - 2))})` : r + of;
}
/* the path from kw 1 to this person, always on one line: pnFitCrumbs hides names from the middle ("…") until it fits;
   the … names them in its title and shows the whole path on a click */
function pnCrumbs(kw) {
  if (kw === 1) return `<span class="pn-crumbs"></span>`;
  const ks = []; for (let k = kw; k >= 1; k >>= 1) ks.unshift(k);
  const name = k => { if (k === 1 && T.key === "s") return `<span class="pn-lang">${esc(T.root)}</span><span class="pn-kort">${esc(TREE_KORT.s[0].toUpperCase() + TREE_KORT.s.slice(1))}</span>`;
    if (k === 1 && rootGroup()) { const sh = shortOf(1); return `<span class="pn-lang">${esc(sh === "de kinderen" ? "Kinderen" : sh)}</span><span class="pn-kort">Kinderen</span>`; }
    const q = person(pnTarget(k) || k); return esc(q ? firstName(q) : "?"); };
  const li = ks.map((k, i) => { const t = pnTarget(k);
    return (i === 1 ? `<li class="pn-more" hidden><button type="button" class="link" data-pn-more>…</button></li>` : "")
      + (k === kw ? `<li aria-current="page"><b>${name(k)}</b></li>` : t ? `<li><button type="button" class="link" data-open="${t}">${name(k)}</button></li>` : `<li>${name(k)}</li>`); });
  return `<nav class="pn-crumbs" aria-label="Pad vanaf ${esc(T.root)}"><ol>${li.join("")}</ol></nav>`;
}
let pnCrRO = null, pnCrW = 0;
function pnFitCrumbs(head = $("#dHead")) {
  const ol = head && $(".pn-crumbs ol", head); if (!ol || ol.classList.contains("pn-open") || !ol.clientWidth) return;
  const items = $$(":scope > li:not(.pn-more)", ol), more = $(":scope > .pn-more", ol);
  ol.classList.remove("pn-tight"); items.forEach(li => { li.hidden = false; }); if (more) more.hidden = true;
  if (!more || ol.scrollWidth <= ol.clientWidth + 1) return;
  more.hidden = false; const gone = [];
  for (let i = 1; i < items.length - 1 && ol.scrollWidth > ol.clientWidth + 1; i++) { items[i].hidden = true; gone.push(items[i].textContent.trim()); }
  if (ol.scrollWidth > ol.clientWidth + 1) ol.classList.add("pn-tight"); /* still too long: the first name gets an ellipsis */
  const b = $("button", more); b.title = "Weggelaten: " + gone.join(" › ");
  b.setAttribute("aria-label", `Toon het hele pad; weggelaten: ${gone.join(", ")}`);
}
/* a column of #profielen: its own path fitting, observed on its own header */
function pcWatch(C) {
  /* the small name in the bar of a column: once the big name has scrolled under the bar (the page scrolls) */
  if (C.nameIO) C.nameIO.disconnect(); C.nameIO = null;
  const nm = $(".p-name", C.head);
  if (nm && "IntersectionObserver" in window) { const off = C.top.offsetHeight + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vast")) || 0);
    C.nameIO = new IntersectionObserver(es => es.forEach(e => C.top.classList.toggle("pn-named", !e.isIntersecting && e.boundingClientRect.top < off + 4)), { rootMargin: `-${Math.round(off)}px 0px 0px 0px` });
    C.nameIO.observe(nm); }
  const nav = $(":scope > .p-nav", C.root); if (nav) { if (PN_PHONE.matches) C.root.appendChild(nav); else C.root.insertBefore(nav, C.body); } /* phone: the row at the bottom */
  if (C.crRO) C.crRO.disconnect(); C.crRO = null; pnFitCrumbs(C.head);
  if ("ResizeObserver" in window) { let w = 0; C.crRO = new ResizeObserver(() => { if (Math.abs(C.head.clientWidth - w) > 1) { w = C.head.clientWidth; pnFitCrumbs(C.head); } }); C.crRO.observe(C.head); }
}
function pnWatchCrumbs() {
  if (pnCrRO) pnCrRO.disconnect(); pnCrW = 0;
  const nav = $("#dHead .pn-crumbs"); if (!nav) return; pnFitCrumbs();
  if ("ResizeObserver" in window) { pnCrRO = new ResizeObserver(() => { if (Math.abs(nav.clientWidth - pnCrW) > 1) { pnCrW = nav.clientWidth; pnFitCrumbs(); } }); pnCrRO.observe(nav); }
}
/* the bar: a target that puts this person in the centre of the tree (as the button "Stamboom vanaf …"); disabled when the
   tree is already seen from this person; not for a group */
function pnTargetBtn(kw, p) {
  if (!p || p.virtual || (kw === 1 && rootGroup()) || typeof fkKies !== "function") return "";
  const nm = esc(p.roep || firstName(p)), now = centerIsNow({ kw, pair: false });
  return now ? `<button type="button" class="pn-ib pn-tgt" disabled aria-label="Je bekijkt de stamboom vanaf ${nm}" title="Je bekijkt de stamboom vanaf ${nm}">${pnIco("target")}</button>`
    : `<button type="button" class="pn-ib pn-tgt" data-center="${kw}" data-pair="0" aria-label="Stamboom vanaf ${nm}" title="Stamboom vanaf ${nm}">${pnIco("target")}</button>`;
}
/* the overflow menu "⋯" of the bar: Open ernaast, Delen, Voorlezen, Volledig scherm (on the page: Terug naar het paneel). Each item
   presses the same button of the bar (which then stays out of sight). The loose icons are shown only while the small name fits
   without being cut off (pnFitTop); the same rule in a column and a tab */
/* the link under the small map: the places of this life on the big map (89's route), only when that route knows this person */
function pnMapText(kw, p) {
  const w = kw === 1 && rootGroup() ? "" : isMale(kw) === true ? "zijn" : isMale(kw) === false ? "haar" : "";
  return w ? `Toon ${w} plaatsen op de grote kaart →` : `Toon de plaatsen van ${esc(p.roep || firstName(p))} op de grote kaart →`;
}
/* Bewaren: a star next to the name (and next to the small name in the bar), d0's Saved; aria-pressed */
let pnKeepOn = false; /* one subscription, made at the first star (Saved is defined further down) */
const pnKeepId = (kw, p) => { if (typeof Saved === "undefined" || !Saved.available || !p || p.virtual) return null; if (!pnKeepOn && Saved.onChange) { pnKeepOn = true; Saved.onChange(() => pnKeepSync()); } return Saved.idOf(kw); };
const pnStarLabel = (on, nm) => on ? "Bewaard · klik om weg te halen" : "Bewaar " + nm;
function pnStar(kw, p, cls) { const id = pnKeepId(kw, p); if (id == null) return ""; const on = Saved.has(id), nm = esc(p.roep || firstName(p));
  return `<button type="button" class="pn-ib pn-star ${cls}" data-keep="${esc(id)}" data-keep-name="${nm}" aria-pressed="${on}" aria-label="${pnStarLabel(on, nm)}" title="${pnStarLabel(on, nm)}">${pnIco("star")}</button>`; }
function pnKeepSync() { /* every star and menu item on the page follows the list (also after a change in another tab) */
  $$("[data-keep]").forEach(b => { const on = Saved.has(b.dataset.keep), t = pnStarLabel(on, b.dataset.keepName); b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-label", t); b.title = t; });
}
document.addEventListener("click", e => { const b = e.target.closest("[data-keep]"); if (!b) return; e.preventDefault(); Saved.toggle(b.dataset.keep); pnKeepSync(); if (typeof keepToast === "function") keepToast(Saved.has(b.dataset.keep)); });
function pnMoreHtml(kw, p, opts, COL, sfx) {
  const it = (act, ico, txt) => `<button type="button" role="menuitem" tabindex="-1" data-pn-proxy="${act}">${pnIco(ico)}<span>${txt}</span></button>`;
  const tg = pnTargetBtn(kw, p), nm = esc(p.roep || firstName(p)); /* the target first; while it is the centre already: not to choose */
  const tgt = !tg ? "" : / disabled /.test(tg) ? `<button type="button" role="menuitem" tabindex="-1" aria-disabled="true" class="pn-mi-off" data-pn-proxy="tgt">${pnIco("target")}<span>Je bekijkt de stamboom vanaf ${nm}</span></button>` : it("tgt", "target", "Stamboom vanaf " + nm);
  const items = [tgt, pcBarBtn(kw, p, COL) ? it("cols", "cols", "Open ernaast") : "", it("share", "share", "Delen"),
    !COL && typeof vlIcon === "function" && vlIcon(p) ? it("read", "read", "Voorlezen") : "",
    opts.page || COL ? "" : it("full", "full", "Volledig scherm")].join("");
  return `<span class="pn-more-w"><button type="button" class="pn-ib pn-more-b" aria-label="Meer" title="Meer" aria-haspopup="menu" aria-expanded="false" aria-controls="dMore${sfx}">${pnIco("more")}</button><span class="pn-menu" id="dMore${sfx}" role="menu" aria-label="Meer" hidden>${items}</span></span>`;
}
const PN_PROXY = { tgt: ".pn-inl [data-center]", cols: "[data-pc-add], .pc-cb", share: "[id^=dShare]:not([id^=dShareOk])", read: ".vl-ico .vl-play", panel: "[data-pn=panel]", full: "[data-pn=full]" };
function pnMoreBind(top, COL) {
  const btn = $(".pn-more-b", top), menu = $(".pn-menu", top); if (!btn || !menu) return;
  const items = () => $$("[role^=menuitem]", menu).filter(x => !x.hidden);
  { const r = $("[data-pn-proxy=read]", menu), v = $(".vl-ico", top); if (r && (!v || v.hidden)) r.hidden = true; } /* no voice: no item */
  const close = back => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); if (back) btn.focus(); };
  const open = () => { menu.hidden = false; btn.setAttribute("aria-expanded", "true"); const f = items()[0]; if (f) f.focus(); };
  btn.onclick = e => { e.stopPropagation(); menu.hidden ? open() : close(false); };
  menu.onclick = e => { if (e.target.closest("[aria-disabled=true]")) return; const m = e.target.closest("[data-pn-proxy]"); if (!m) return; close(true);
    const t = $(PN_PROXY[m.dataset.pnProxy], top); if (t) t.click(); };
  menu.onkeydown = e => { const L = items(), i = L.indexOf(document.activeElement);
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: L.length - 1 }[e.key];
    if (to !== undefined) { e.preventDefault(); e.stopPropagation(); L[(to + L.length) % L.length].focus(); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === "Tab") close(false); };
  /* "⋯" opens with Enter or Space; the arrow keys keep their meaning in the bar (↑ father, ↓ child) */
  /* at the top of the profile all icons are loose, as long as they fit; once the small name is in the bar (scrolled), or when
     there is no room, they go into "⋯" (the target first). A focused icon that goes hands its focus to "⋯" */
  const inl = $(".pn-inl", top), pairs = () => $$("[data-pn-proxy]", menu).map(m => { const act = m.dataset.pnProxy, el = act === "tgt" ? $(".pn-tgt", inl) : $(PN_PROXY[act], inl); return [m, el ? el.closest(".pn-inl > *") : null]; });
  const fit = () => { const a = document.activeElement, had = top.contains(a) && a.closest(".pn-inl"), P = pairs();
    P.forEach(([m, el]) => { m.hidden = false; if (el) el.classList.remove("pn-off"); });
    const named = top.classList.contains("pn-named"), extra = !!$("[data-pn-extra]", menu); /* items only in the menu: "⋯" always */
    top.classList.toggle("pn-packed", extra);
    if (!named && top.scrollWidth <= top.clientWidth + 1) P.forEach(([m]) => { m.hidden = true; }); /* everything fits: only the extra items in the menu */
    else { top.classList.add("pn-packed");
      if (named) P.forEach(([m, el]) => { if (el) el.classList.add("pn-off"); }); /* scrolled: all in the menu */
      else { P.forEach(([m]) => { m.hidden = true; }); /* loose what fits, in the order of the bar; the rest from the end into the menu */
        for (let i = P.length - 1; i >= 0 && top.scrollWidth > top.clientWidth + 1; i--) { const [m, el] = P[i]; if (el) el.classList.add("pn-off"); m.hidden = false; } } }
    { const r = $("[data-pn-proxy=read]", menu), v = $(".vl-ico", top); if (r && (!v || v.hidden)) r.hidden = true; } /* no voice: no item */
    if (had && a.closest(".pn-off")) btn.focus(); };
  fit();
  if (top._clsMO) top._clsMO.disconnect();
  let named = top.classList.contains("pn-named");
  top._clsMO = new MutationObserver(() => { const n = top.classList.contains("pn-named"); if (n !== named) { named = n; fit(); } });
  top._clsMO.observe(top, { attributes: true, attributeFilter: ["class"] });
  /* tooltips: the shared one of the site (the title stays as a fallback without it) */
  /* tooltips: the icon tooltip of the site takes the titles itself (iTip) */ if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (top.isConnected) fit(); }); /* the name is measured in its own font */
  if (top._fitRO) top._fitRO.disconnect();
  if ("ResizeObserver" in window) { let w = top.clientWidth; top._fitRO = new ResizeObserver(() => { if (Math.abs(top.clientWidth - w) > 1) { w = top.clientWidth; fit(); } }); top._fitRO.observe(top); }
}
document.addEventListener("pointerdown", e => { $$(".pn-menu:not([hidden])").forEach(m => { if (!m.parentNode.contains(e.target)) { m.hidden = true; const b = $(".pn-more-b", m.parentNode); if (b) b.setAttribute("aria-expanded", "false"); } }); });
function pnHistBtn(dir) {
  const k = dir === "back" ? PN.t[PN.i - 1] : PN.t[PN.i + 1], q = k ? person(k) : null;
  const lab = q ? (dir === "back" ? "Terug naar " : "Vooruit naar ") + firstName(q) : dir === "back" ? "Terug (geen eerder profiel)" : "Vooruit (geen volgend profiel)";
  return `<button type="button" class="pn-ib" data-pn="${dir}" aria-label="${esc(lab)}" title="${esc(lab)}"${q ? "" : " disabled"}>${pnIco(dir)}</button>`;
}
/* the row of buttons: the same markup on a wide screen (in the header) and on a phone (a bar at the bottom); pnPlace moves it */
function pnNavHtml(kw, sfx = "") {
  const cell = l => {
    const lab = (l.aria || l.word) + (l.p ? ": " + l.p.n : ": niet bekend") + (l.st ? `, ${l.st === "C" ? "onzeker" : "hypothese"}` : "") + (l.key && !sfx ? ` (toets ${l.key})` : ""); /* the keys work in the drawer and the page, not in a column */
    const inner = `${pnIco(l.k)}<span class="pn-t"><span class="pn-w">${esc(l.word)}${l.st ? ` <i class="pn-st st-${l.st}" aria-hidden="true">${l.st}</i>` : ""}</span><span class="pn-n">${l.p ? esc(firstName(l.p)) : l.k === "prev" || l.k === "next" ? "–" : "onbekend"}</span></span>`;
    return `<button type="button" class="pn-b pn-${l.k}" data-pn="${l.k}"${l.kw ? ` data-open="${l.kw}" title="${esc(lab)}"` : l.other && l.p ? ` data-other="${l.other}" title="${esc(lab)} (andere tak)"` : " disabled"} aria-label="${esc(lab)}">${inner}</button>`;
  };
  /* a living person or a group (kw 1): only the buttons that lead somewhere, no "niet bekend" */
  const me = person(kw) || {}, few = kw === 1 || me.living, L = pnLinks(kw).filter(l => !few || l.kw || (l.other && l.p));
  return `<nav class="pn-nav p-nav" id="dNav${sfx}" aria-label="Familie en generatie"><div class="pn-row${few ? " pn-few" : ""}">${L.map(cell).join("")}</div></nav>`;
}
/* the generation at a glance: every place of this generation in kw order. Up to 16 places one dot each (filled = known, open =
   not known, gold ring = this person, gold contour = a person who is in the tree more than once); a dot opens that person.
   From 32 places a thin bar: how dense the known part is, with a mark at this person. A duplicate place counts as known and
   opens the real person. This line stays in the header (also on a phone); the row of buttons follows it on a wide screen. */
let PN_GI = null, PN_GI_BY = null;
function pnGenInfo(g) {
  if (PN_GI_BY !== BY) { PN_GI = new Map(); PN_GI_BY = BY; }
  if (PN_GI.has(g)) return PN_GI.get(g);
  const lo = 2 ** (g - 1), n = lo, places = [];
  if (n <= 8192) for (let k = lo; k < lo + n; k++) { const q = BY.get(k), t = q ? (q.aliasOf || k) : BY.has(fanKw(k)) ? fanKw(k) : null;
    places.push({ k, t, twin: !!t && (t !== k || twinKws(k).length > 0) }); }
  const known = n <= 8192 ? places.filter(x => x.t).length : pnGenList(g).length;
  const info = { lo, n, places, known }; PN_GI.set(g, info); return info;
}
function pnGenHtml(kw) {
  if (kw < 2) return "";
  const g = gen(kw), I = pnGenInfo(g), pre = genPre(g - 1), word = g === 2 ? "Ouders" : pre ? pre[0].toUpperCase() + pre.slice(1) + "ouders" : "Voorouders";
  const stand = I.known === I.n ? `alle ${I.n} bekend` : `${I.known} van ${I.n} bekend`;
  let viz = "";
  /* small and quiet, on the top line: dots (wide screens only, they are a way to jump), or a 96 × 4 px bar that is left out
     when the whole generation is known */
  if (I.n <= 16) viz = `<span class="pn-dots" role="group" aria-label="${esc(word)}, generatie ${ROMAN[g]}">${I.places.map(x => {
      const q = x.t ? person(x.t) : null, me = x.k === kw, lab = `kw ${x.k}: ${q ? q.n : "niet bekend"}${x.twin ? ", staat meer dan eens in de stamboom" : ""}${me ? " (dit profiel)" : ""}`;
      return `<button type="button" class="pn-dot${q ? "" : " leeg"}${x.twin ? " twin" : ""}${me ? " nu" : ""}" tabindex="-1"${q && !me ? ` data-open="${x.t}"` : " disabled"}${me ? ' aria-current="true"' : ""} aria-label="${esc(lab)}" title="${esc(lab)}"><i></i></button>`; }).join("")}</span>`;
  else if (I.places.length && I.known < I.n) { const B = Math.min(I.n, 48), per = I.n / B, f = new Array(B).fill(0);
    I.places.forEach((x, j) => { if (x.t) f[Math.floor(j / per)]++; });
    viz = `<span class="pn-bar2" aria-hidden="true"><svg viewBox="0 0 ${B} 1" preserveAspectRatio="none">${f.map((c, j) => c ? `<rect class="k" x="${j}" y="0" width="1.02" height="1" opacity="${(c / per).toFixed(2)}"/>` : "").join("")}</svg><span class="pn-mark" style="left:${((kw - I.lo + 0.5) / I.n * 100).toFixed(2)}%"></span></span>`; }
  return ` · <span class="pn-gen"><span class="pn-stand" title="${esc(word)} in generatie ${ROMAN[g]}">${stand}</span>${viz}</span>`; /* the key tip lives in the "?" explanation, on wide screens */
}
/* the trail: a step inside the profile adds to it, a new profile from a page starts it again, the browser history restores it */
function pnTrack(kw, fromHist, fresh) {
  const st = history.state && history.state.pn;
  if (fromHist && st && Array.isArray(st.t) && st.t[st.t.length - 1] === kw) {
    const j = st.t.length - 1;
    if (!(PN.t.length > j && st.t.every((k, x) => PN.t[x] === k))) PN.t = st.t.slice();
    PN.i = j; PN.d = st.d || 0;
  } else if (fromHist || fresh) { PN.t = [kw]; PN.i = 0; PN.d = fromHist ? 0 : 1; }
  else if (PN.t[PN.i] !== kw) { PN.t = PN.t.slice(0, PN.i + 1).concat(kw); PN.i = PN.t.length - 1; PN.d = PN.d ? PN.d + 1 : 0; }
}
const pnState = () => ({ t: PN.t.slice(0, PN.i + 1), d: PN.d });
/* the header and the body live in the drawer, or (full page) in the view #v-profiel; the bar goes where the screen wants it */
function pfSec() { let s = $("#v-profiel"); if (!s) { s = document.createElement("section"); s.className = "view pf"; s.id = "v-profiel"; s.hidden = true; $("main").appendChild(s); } return s; }
function pfWrap() { const s = pfSec(); let w = $(":scope > .pf-wrap", s); if (!w) { s.innerHTML = ""; w = document.createElement("div"); w.className = "pf-wrap"; s.appendChild(w); } return w; }
/* one scroll area (the drawer, or the page) with, in this order: the sticky bar #dTop, the header #dHead (scrolls away),
   the row of buttons #dNav (sticky under the bar; on a phone sticky at the bottom, after the body) and the body #dBody */
function pnDock(page) {
  const head = $("#dHead"), body = $("#dBody"), nav = $("#dNav"); if (nav) nav.remove();
  let top = $("#dTop"); if (!top) { top = document.createElement("div"); top.id = "dTop"; top.className = "pn-top p-top"; }
  body.classList.add("p-body");
  const box = page ? pfWrap() : drawer;
  if (head.parentNode !== box || top.parentNode !== box || box.firstElementChild !== top) box.prepend(top, head, body);
}
function pnPlace() {
  const nav = $("#dNav"), head = $("#dHead"), body = $("#dBody"); if (!nav || !head || !body) return;
  const box = head.parentNode;
  if (PN_PHONE.matches) { if (nav.parentNode !== box || nav.nextElementSibling) box.appendChild(nav); }
  else if (nav.nextElementSibling !== body) box.insertBefore(nav, body);
}
/* the small name in the bar appears once the big name has scrolled under it */
let pnNameIO = null;
function pnWatchName(page) {
  if (pnNameIO) { pnNameIO.disconnect(); pnNameIO = null; }
  const nm = $("#dName"), top = $("#dTop"); if (!nm || !top || !("IntersectionObserver" in window)) return;
  const off = top.offsetHeight + (page ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vast")) || 0 : 0);
  pnNameIO = new IntersectionObserver(es => es.forEach(e => top.classList.toggle("pn-named", !e.isIntersecting && e.boundingClientRect.top < off + 4)),
    { root: page ? null : drawer, rootMargin: `-${Math.round(off)}px 0px 0px 0px` });
  pnNameIO.observe(nm);
}
if (PN_PHONE.addEventListener) PN_PHONE.addEventListener("change", pnPlace);
/* the drawer opened on load (a link, a refresh) holds no focus; the first Tab goes into it, to the first button of its bar */
document.addEventListener("keydown", e => { if (e.key !== "Tab" || drawer.hidden || drawer.contains(document.activeElement)) return;
  const f = focusables(drawer); if (!f.length) return; e.preventDefault(); (e.shiftKey ? f[f.length - 1] : f[0]).focus(); });
function pnTipOff() { try { localStorage.setItem("pn-tip", "1"); } catch (x) {} document.documentElement.classList.add("pn-tip-off"); }
try { if (localStorage.getItem("pn-tip")) document.documentElement.classList.add("pn-tip-off"); } catch (x) {}
/* the full page: the profile as a view (#profiel-<kw>); two columns from 900 px (CSS grid, rows measured here) */
/* ---------- several profiles side by side: #profielen-<kw>-<kw>… (max 4) ----------
   Every column is a whole profile (renderProfile with its own container), with its own × and its own navigation: a click on a
   family member replaces that column. Columns: 2 from 1100 px, 3 from 1440, 4 from 1800; one too many and the oldest goes,
   with a message. Narrower than 1100 px the open profiles are tabs. "Vergelijken" shows the same people in cmpRender. A new
   set is a step in the history; the view mode and the active tab are not. The set is remembered per tree ("Open ernaast"). */
const PC = { cols: [], mode: "naast", msg: "", tab: 0, uid: 0, cap: 0, tree: null }; /* the columns belong to one tree (T.key): see pcRender */
function pcSec() { let s = $("#v-profielen"); if (!s) { s = document.createElement("section"); s.className = "view pps"; s.id = "v-profielen"; s.hidden = true; $("main").appendChild(s); } return s; }
const pcCap = () => innerWidth >= 1800 ? 4 : innerWidth >= 1440 ? 3 : innerWidth >= 1100 ? 2 : 1; /* 1: tabs */
const pcList = sub => String(sub || "").split("-").map(Number).filter((k, i, a) => k >= 1 && a.indexOf(k) === i && person(k)).slice(0, 4);
const pcName = k => { const q = person(k); return q ? q.roep || firstName(q) : ""; };
const pcKey = () => "stamboom-pc-" + T.key;
function pcLast() { if (route.view === "profielen") return pcList(route.sub); try { return pcList(sessionStorage.getItem(pcKey())); } catch (e) { return []; } }
/* the tabs on a narrow screen: the first name, with the surname when two have the same first name */
function pcTabNames(ks) {
  const f = ks.map(pcName), out = f.slice();
  f.forEach((n, i) => { if (f.filter(x => x === n).length > 1) { const q = person(ks[i]); out[i] = (n + " " + (q && !(ks[i] === 1 && rootGroup()) ? splitName(q.n).sur : "")).trim(); } });
  return out;
}
/* a new set: one step in the history; empty: back to the page under it */
function pcSet(ks) { if (!ks.length) { go(PN.onder && !/^profiel/.test(PN.onder) ? PN.onder : "overzicht"); return; } go("profielen-" + ks.join("-")); }
/* "Open ernaast" in the actions: not when this profile is already open in a column */
/* "Open ernaast". In the drawer and on the page: always; it puts this profile in a column (with the set of this tree), so the
   next one comes beside it. In a column: "one more beside": the next family member clicked in this column opens in a new
   column instead of replacing it; at the most columns for this width it is off ("Er passen er niet meer naast elkaar") */
const pcRoom = () => pcCap() === 1 ? 4 : pcCap();
function pcColBtn(kw, bar) {
  const full = pcList(route.sub).length >= pcRoom(), ico = bar ? pnIco("cols") : pnIco("cols").replace('class="pn-ico"', 'class="pn-ico dact-ico"');
  return full ? `<button type="button" class="${bar ? "pn-ib" : "btn"} pc-cb" data-pc-col="${kw}" aria-disabled="true" aria-label="Open ernaast: er is geen plaats meer" title="Er is geen plaats meer">${ico}${bar ? "" : "Open ernaast"}</button>`
    : `<button type="button" class="${bar ? "pn-ib" : "btn"} pc-cb" data-pc-col="${kw}" data-pc-more="${kw}" aria-pressed="${PC.more === kw}" aria-label="Open ernaast" title="Open ernaast">${ico}${bar ? "" : "Open ernaast"}</button>`;
}
function pcOpenBtn(kw, p, COL) {
  if (COL) return pcColBtn(kw, false);
  return `<button type="button" class="btn" data-pc-add="${kw}" aria-label="Open ${esc(p.n)} in een kolom ernaast">${pnIco("cols").replace('class="pn-ico"', 'class="pn-ico dact-ico"')}Open ernaast</button>`;
}
/* the same in the bar of the profile, as an icon between the target and share */
function pcBarBtn(kw, p, COL) {
  if (COL) return pcColBtn(kw, true);
  const nm = esc(p.roep || firstName(p));
  return `<button type="button" class="pn-ib" data-pc-add="${kw}" aria-label="Open ${nm} ernaast" title="Open ${nm} ernaast">${pnIco("cols")}</button>`;
}
/* after a change of the set: the buttons of the columns that stay follow (off at the most, the pressed state) */
function pcSyncMore() {
  const full = pcList(route.sub).length >= pcRoom();
  $$("#v-profielen .pc-cb").forEach(b => { const k = +b.dataset.pcCol;
    if (full) { b.setAttribute("aria-disabled", "true"); b.removeAttribute("data-pc-more"); b.removeAttribute("aria-pressed"); b.setAttribute("aria-label", "Open ernaast: er is geen plaats meer"); b.title = "Er is geen plaats meer"; }
    else { b.removeAttribute("aria-disabled"); b.dataset.pcMore = k; b.setAttribute("aria-pressed", String(PC.more === k)); b.setAttribute("aria-label", "Open ernaast"); b.title = "Open ernaast"; } });
}
function pcGone(names, cap) {
  const who = names.length > 1 ? names.slice(0, -1).join(", ") + " en " + names[names.length - 1] : names[0], is = names.length > 1 ? "zijn" : "is";
  return cap >= 4 ? `Er passen vier profielen naast elkaar; ${who} ${is} gesloten.` : `Er passen er ${Math.max(cap, 1)} naast elkaar; ${who} ${is} gesloten.`;
}
function pcRender(sub) {
  const sec = pcSec(), cap = pcCap(), narrow = cap === 1;
  /* another tree (or focus): kw numbers mean other people, so no column, tab or set of the previous tree is kept */
  if (PC.tree !== T.key) { PC.cols.forEach(c => { [c.mfRO, c.crRO, c.nameIO, c.top._fitRO, c.top._clsMO].forEach(o => o && o.disconnect()); c.el.remove(); }); PC.cols = []; PC.tab = 0; PC.pick = null; sec.innerHTML = ""; PC.tree = T.key; PC.seen = ""; }
  const ks = pcList(sub);
  PC.cap = cap;
  try { sessionStorage.setItem(pcKey(), ks.join("-")); } catch (e) {}
  if (!ks.length) { PC.cols = []; sec.innerHTML = `<h1 class="page-title">Profielen</h1><div class="empty">Nog niemand gekozen. In elk profiel staat de knop Open ernaast.</div>`; return; }
  /* the address keeps the whole set; who does not fit as a column stays in it, as a tab above the columns (the oldest first) */
  const vis = narrow ? ks : ks.slice(-cap), over = narrow ? [] : ks.slice(0, ks.length - vis.length);
  if (over.length && PC.seen !== T.key + ":" + ks.join("-") && !PC.msg) { const nm = over.map(pcName), who = nm.length > 1 ? nm.slice(0, -1).join(", ") + " en " + nm[nm.length - 1] : nm[0];
    PC.msg = `Er passen er ${cap} naast elkaar; ${who} ${nm.length > 1 ? "staan" : "staat"} als tab erboven.`; }
  PC.seen = T.key + ":" + ks.join("-");
  const n = ks.length, cmp = PC.mode === "vergelijk" && n > 1;
  if (!$(":scope > .pp-bar", sec)) { sec.innerHTML = `<div class="pp-bar"></div><p class="sr-only pp-live" aria-live="polite"></p><div class="pp-more"></div><div class="pp-tabs" role="tablist" aria-label="Open profielen"></div><div class="pp-cols"></div><div class="pp-cmp"></div>`; PC.cols = []; }
  /* the words: one name for the view everywhere ("Naast elkaar" / "Vergelijken"); the heading says "open" when the profiles are tabs */
  const kop = cmp ? `${n} profielen vergeleken` : narrow || over.length ? `${n} profielen open` : `${n} profielen naast elkaar`;
  if (route.view === "profielen" && n > 1 && typeof treeTitle === "function") document.title = kop + " · " + treeTitle(); /* the title follows the mode (= the h1) */
  $(":scope > .pp-bar", sec).innerHTML = `<h1 class="pp-kop${n > 1 ? "" : " sr-only"}" tabindex="-1">${n > 1 ? esc(kop) : esc(person(ks[0]).n)}</h1>${n > 1 ? `<div class="pp-seg" role="group" aria-label="Weergave"><button type="button" data-pc-mode="naast" aria-pressed="${!cmp}">Naast elkaar</button><button type="button" data-pc-mode="vergelijk" aria-pressed="${cmp}">Vergelijken</button></div>` : ""}`;
  const colsEl = $(":scope > .pp-cols", sec), cmpEl = $(":scope > .pp-cmp", sec), tabsEl = $(":scope > .pp-tabs", sec), moreEl = $(":scope > .pp-more", sec);
  colsEl.hidden = cmp; cmpEl.hidden = !cmp; tabsEl.hidden = !narrow || cmp || n < 2; moreEl.hidden = cmp || !over.length;
  moreEl.innerHTML = over.length ? `<span class="pp-more-n">+${over.length}:</span>${over.map(k => `<button type="button" class="btn" data-pc-show="${k}" aria-label="Zet ${esc(person(k).n)} in een kolom" title="Zet ${esc(person(k).n)} in een kolom">${esc(pcName(k))}</button>`).join("")}` : "";
  sec.classList.toggle("pp-narrow", narrow);
  if (cmp) { cmpRender(ks.join("-"), cmpEl); pcCmpFix(cmpEl, narrow); }
  else {
    /* keep a column whose person stays (its scroll and state), make the others */
    const keep = new Map(PC.cols.map(c => [c.kw0, c])), cols = vis.map(k => keep.get(k) || pcNewCol(k));
    PC.cols.forEach(c => { if (!cols.includes(c)) { [c.mfRO, c.crRO, c.nameIO, c.top._fitRO, c.top._clsMO].forEach(o => o && o.disconnect()); c.el.remove(); } });
    cols.forEach(c => colsEl.appendChild(c.el));
    PC.cols = cols; colsEl.style.setProperty("--n", narrow ? 1 : vis.length);
    PC.tab = Math.min(Math.max(0, PC.tab), vis.length - 1);
    const pickK = PC.pick; if (PC.pick != null) { const j = vis.indexOf(PC.pick); if (j >= 0) PC.tab = j; PC.pick = null; }
    if (narrow) pcTabs(vis); else cols.forEach(c => { c.el.hidden = false; c.el.removeAttribute("role"); c.el.removeAttribute("aria-labelledby"); });
    cols.forEach(c => { if (!c.done && !c.el.hidden) { c.done = true; openProfile(c.kw0, { col: c }); } });
    if (PC.more != null && !vis.includes(PC.more)) PC.more = null; pcSyncMore();
    /* a column just added or replaced: the focus on its name (no ring after a click) */
    if (pickK != null && !PC.refocus) { const c = cols.find(x => x.kw0 === pickK); const nm = c && $(".p-name", c.el); if (nm) setTimeout(() => nm.focus({ preventScroll: true }), 0); }
  }
  /* after a column was closed with the keyboard: the × of the column now in that place, else the heading (one left: its ×) */
  if (PC.refocus) { const r = PC.refocus; PC.refocus = null; setTimeout(() => {
    const c = narrow ? null : PC.cols[r.i] || (PC.cols.length === 1 ? PC.cols[0] : null);
    const t = narrow ? $(`[data-pc-tab="${Math.min(r.i, PC.cols.length - 1)}"]`, sec) : c ? $(".pp-x", c.el) : $(".pp-kop", sec);
    if (t) t.focus(); }, 0); }
  const live = $(":scope > .pp-live", sec); live.textContent = ""; if (PC.msg) { const m = PC.msg; PC.msg = ""; setTimeout(() => { live.textContent = m; }, 60); }
}
function pcNewCol(kw) {
  const el = document.createElement("article"); el.className = "pp-col pf"; el.setAttribute("aria-label", person(kw).n);
  el.innerHTML = `<div class="pn-top p-top"></div><header class="p-head"></header><div class="body p-body"></div>`;
  return { el, root: el, top: el.children[0], head: el.children[1], body: el.children[2], sfx: "-c" + (++PC.uid), kw: kw, kw0: kw, done: false };
}
/* narrow: one column at a time, the others are tabs (arrow keys and swiping change the tab) */
function pcTabs(ks) {
  const sec = pcSec(), tabsEl = $(":scope > .pp-tabs", sec), names = pcTabNames(ks);
  tabsEl.innerHTML = ks.map((k, i) => `<span class="pp-tab${i === PC.tab ? " on" : ""}"><button type="button" role="tab" id="pcTab${i}" aria-selected="${i === PC.tab}" aria-controls="pcCol${i}" tabindex="${i === PC.tab ? 0 : -1}" data-pc-tab="${i}">${esc(names[i])}</button><button type="button" class="pp-tx" data-pc-close="${k}" aria-label="Sluit ${esc(person(k).n)}" title="Sluit ${esc(person(k).n)}">${pnIco("close")}</button></span>`).join("");
  PC.cols.forEach((c, i) => { c.el.id = "pcCol" + i; c.el.setAttribute("role", ks.length > 1 ? "tabpanel" : "region"); c.el.setAttribute("aria-labelledby", ks.length > 1 ? "pcTab" + i : ""); c.el.hidden = i !== PC.tab; });
}
function pcShowTab(i, focus) {
  const n = PC.cols.length; if (!n) return; PC.tab = (i + n) % n;
  pcTabs(PC.cols.map(c => c.kw0));
  const c = PC.cols[PC.tab]; if (!c.done) { c.done = true; openProfile(c.kw0, { col: c }); }
  if (focus) { const t = $("#pcTab" + PC.tab); if (t) t.focus(); }
}
/* compare on a narrow screen: the rows stacked, every cell with the name of its person; links of the compare page stay here */
function pcCmpFix(host, narrow) {
  $$('[data-go^="vergelijk-"]', host).forEach(b => { if (!/-kies$/.test(b.dataset.go)) b.dataset.go = "profielen-" + b.dataset.go.slice(10); });
  if (!narrow) return;
  $$("table", host).forEach(t => { const cs = $$("thead th, thead td", t), full = cs.map(x => (($("h2", x) || x).textContent || "").trim()), kort = cs.map((x, i) => x.dataset.kort || full[i]);
    const hs = kort.map((k, i) => k && kort.filter(x => x === k).length > 1 ? full[i] : k); /* the call name above each cell; the full name when two share it */
    $$("tbody tr", t).forEach(tr => [...tr.children].forEach((c, i) => { if (c.tagName === "TD" && hs[i]) c.dataset.l = hs[i]; })); });
}
/* clicks: add a column, close one, a step inside a column, the mode, the tabs */
document.addEventListener("click", e => {
  const add = e.target.closest("[data-pc-add]");
  if (add) { e.preventDefault(); e.stopImmediatePropagation(); const k = +add.dataset.pcAdd, room = 4; /* up to four in the set; who does not fit as a column is a tab above them */
    let ks = pcLast().filter(x => x !== k).concat(k);
    if (ks.length > room) { const gone = ks.slice(0, ks.length - room); ks = ks.slice(-room); PC.msg = pcGone(gone.map(pcName), room); }
    PC.pick = k; /* from the drawer: the set takes the place of that step in the history, so back goes to the set before */
    if (!drawer.hidden) { closeProfile(true); go("profielen-" + ks.join("-"), { replace: true }); } else pcSet(ks); return; }
  const sec = $("#v-profielen"); if (!sec || sec.hidden) return;
  const md = e.target.closest("[data-pc-mode]");
  if (md && sec.contains(md)) { e.preventDefault(); PC.mode = md.dataset.pcMode; pcRender(route.sub); const b = $(`[data-pc-mode="${PC.mode}"]`, sec); if (b) b.focus(); return; }
  const sh = e.target.closest("[data-pc-show]"); if (sh && sec.contains(sh)) { e.preventDefault(); e.stopImmediatePropagation(); const k = +sh.dataset.pcShow; /* a tab above the columns into a column: it becomes the newest */
    const ks = pcList(route.sub).filter(v => v !== k).concat(k); go("profielen-" + ks.join("-"), { replace: true, keepScroll: true }); const c = PC.cols.find(c => c.kw0 === k); if (c) { const x = $(".pp-x", c.el); if (x) x.focus(); } return; }
  const tb = e.target.closest("[data-pc-tab]"); if (tb && sec.contains(tb)) { e.preventDefault(); pcShowTab(+tb.dataset.pcTab); return; }
  const x = e.target.closest("[data-pc-close]");
  if (x && sec.contains(x)) { e.preventDefault(); e.stopImmediatePropagation(); const col = x.closest(".pp-col"), k = col ? (PC.cols.find(c => c.el === col) || {}).kw0 : +x.dataset.pcClose;
    if (!e.detail) PC.refocus = { i: col ? PC.cols.findIndex(c => c.el === col) : Math.max(0, PC.tab) }; /* keyboard: the focus goes to the column now in that place */
    pcSet(pcList(route.sub).filter(v => v !== k)); return; }
  const mo = e.target.closest("[data-pc-more], [data-pc-col]"); if (mo && sec.contains(mo)) { e.preventDefault(); e.stopImmediatePropagation(); if (mo.getAttribute("aria-disabled") === "true") { pcNote(mo.getAttribute("title") || "Er is geen plaats meer"); return; } /* a touch screen shows no title: say it */
    const k = +mo.dataset.pcCol; PC.more = PC.more === k ? null : k; pcSyncMore(); return; } /* the next family member of this column comes beside it */
  const o = e.target.closest("[data-open]"), col = o && o.closest(".pp-col");
  if (o && col && sec.contains(col)) { e.preventDefault(); e.stopImmediatePropagation(); const c = PC.cols.find(c => c.el === col), k = +o.dataset.open; if (!c || !person(k)) return;
    const ks = pcList(route.sub), i = ks.indexOf(c.kw0); if (i < 0) return;
    if (PC.more === c.kw0) { PC.more = null; PC.pick = k; pcSet(ks.includes(k) ? ks : ks.concat(k)); return; } /* "Open ernaast" was pressed: a new column */
    const nk = ks.map((v, j) => j === i ? k : v).filter((v, j, a) => a.indexOf(v) === j); PC.pick = k; pcSet(nk); }
}, true);
document.addEventListener("keydown", e => { /* the tabs: ← → and Home/End */
  const t = e.target.closest && e.target.closest("[data-pc-tab]"); if (!t) return;
  const i = +t.dataset.pcTab, n = PC.cols.length, to = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: n - 1 }[e.key];
  if (to === undefined) return; e.preventDefault(); e.stopPropagation(); pcShowTab(to, true);
}, true);
{ let sx = null, sy = null; /* swiping on a narrow screen changes the tab */
  document.addEventListener("touchstart", e => { const c = e.target.closest && e.target.closest("#v-profielen.pp-narrow .pp-col"); sx = c && e.touches.length === 1 ? e.touches[0].clientX : null; sy = sx === null ? null : e.touches[0].clientY; }, { passive: true });
  document.addEventListener("touchend", e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(dy) && PC.cols.length > 1) pcShowTab(PC.tab + (dx < 0 ? 1 : -1)); }, { passive: true }); }
addEventListener("resize", () => { if (route.view === "profielen" && !pcSec().hidden && pcCap() !== PC.cap) pcRender(route.sub); });
function pfRender(kw) {
  if (!(kw >= 1) || !person(kw)) { pnDock(false); pfSec().innerHTML = `<div class="pf-leeg"><h1>Niet gevonden</h1><p>Dit nummer staat niet in deze stamboom. <a href="#${T.prefix}overzicht" data-go="overzicht">Naar het overzicht</a></p></div>`; return; }
  openProfile(kw, { page: true, fromHistory: location.hash === "#" + T.prefix + "profiel-" + kw });
}
function pfOpen(kw) { /* from the drawer: the same entry in the history becomes the page */
  if (!kw) return; const st = history.state || {};
  pnCont = true; pnFocus = "panel"; go("profiel-" + kw, { replace: true });
  try { history.replaceState(Object.assign({}, st, { profiel: 0 }), ""); } catch (x) {}
}
function pfToPanel(kw) { /* back to the drawer, above the page it was opened on */
  const st = history.state || {}, onder = st.onder && !/^profiel-/.test(st.onder) ? st.onder : "overzicht";
  pnCont = true; pnFocus = "full"; go(onder, { keepHash: true });
  openProfile(kw, { fromHistory: true });
  try { history.replaceState(Object.assign({}, st, { profiel: 1, onder }), "", "#" + T.prefix + "kw" + kw); } catch (x) {}
}
const PF_LEFT = /^(Familie|Zo hoort|Bronnen|Nog uit te zoeken|Zoek verder|Weet je meer)/;
/* the order of the profile, from "who was this, and how sure are we": the core sentence, facts and life, the family (with the
   actions tree, fan and "Hoe ben ik familie?" right below it), how the person belongs to the root, story and notes, images,
   evidence and sources together (the "Bewijs" note opens the sources), their world, and what is still open. A block the
   order does not know (a hook of another part of the site) moves as a whole together with the block before it. */
const PF_RANK = [[".stnote:not(.implex):not(.pf-bewijs)", 5], ["p.implex", 15], [".vl-bar", 18], [".kort", 20], ["dl.dl", 30],
  [/^Levensloop/, 32], [".dfam", 40], [".dacts", 44], [/^(Zo hoort|Broers en zussen|Kinderen)/, 46], [".pn-vsec", 47],
  [/^Weetjes/, 50], [/^In de verhalen/, 51], [/^Bekende verwanten/, 52], [/^Portret/, 60], [".dmd", 61], [/^Uit het archief/, 62],
  [/^Wat de akten zeggen/, 70], [".dsrc", 72], [/^Nog uit te zoeken/, 74],
  [/^Plaatsen uit dit leven/, 80], [/^Hun grond/, 81], ["#dArch", 82], ["#dTijd", 83], ["#dWerk", 84], [/^Zoek verder/, 90], [".wjm", 95]];
function pfOrder(p, body = $("#dBody")) {
  if (!body) return;
  /* the general "Bewijs:" note belongs to the sources */
  const bw = [...body.children].find(n => n.matches("p.stnote") && /^Bewijs:/.test(n.textContent.trim())), src = $(":scope > .dsrc:not(.dmd)", body);
  if (bw && src) { bw.classList.add("pf-bewijs"); $("h5", src).insertAdjacentElement("afterend", bw); }
  else if (bw) bw.classList.add("pf-bewijs");
  let last = 0;
  const ranked = [...body.children].map((n, i) => { const h = (($(":scope > h5", n) || {}).textContent || "").trim();
    const hit = PF_RANK.find(([m]) => typeof m === "string" ? n.matches(m) : m.test(h));
    const r = hit ? hit[1] : n.matches("p.pf-bewijs") ? 71 : last + 0.01; last = r; return { n, r, i }; });
  ranked.sort((a, b) => a.r - b.r || a.i - b.i).forEach(x => body.appendChild(x.n));
}
let pfRO = null;
function pfLayout(p, body = $("#dBody")) {
  if (pfRO) { pfRO.disconnect(); pfRO = null; }
  if (!body || !body.closest("#v-profiel")) return;
  body.classList.toggle("pf-cols", !p.living);
  if (p.living) return;
  [...body.children].forEach(n => {
    const h = (($(":scope > h5", n) || {}).textContent || "").trim(), full = n.matches(".vl-bar, .kort, p.implex");
    n.classList.toggle("pf-full", full); n.classList.toggle("pf-l", !full && (n.matches("dl.dl, p.stnote, .dfam, .dacts") || PF_LEFT.test(h)));
  });
  /* each block spans as many 4 px rows as it is high: two independent columns, in the order of the panel */
  const fit = () => { const on = getComputedStyle(body).display === "grid";
    [...body.children].forEach(n => { n.style.gridRowEnd = on ? "span " + Math.max(1, Math.ceil((n.getBoundingClientRect().height + 28) / 4)) : ""; }); };
  fit();
  if ("ResizeObserver" in window) { let q = 0; pfRO = new ResizeObserver(() => { cancelAnimationFrame(q); q = requestAnimationFrame(fit); }); [...body.children].forEach(n => pfRO.observe(n)); pfRO.observe(body); }
}
/* clicks: history, full page, the whole path; on the full page a family step stays on the page */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-pn]");
  if (b) {
    const a = b.dataset.pn;
    if (a === "back" || a === "fwd") { e.preventDefault(); e.stopPropagation(); pnFocus = a; history[a === "back" ? "back" : "forward"](); return; }
    if (a === "full") { e.preventDefault(); e.stopPropagation(); pfOpen(curKw); return; }
    if (a === "panel") { e.preventDefault(); e.stopPropagation(); pfToPanel(route.sub); return; }
    if (b.dataset.open) pnFocus = a; /* the same button keeps the focus after the step */
  }
  const m = e.target.closest("[data-pn-more]");
  if (m) { e.preventDefault(); e.stopPropagation(); const ol = m.closest("ol"); ol.classList.add("pn-open"); ol.classList.remove("pn-tight"); $$(".pn-more", ol).forEach(x => x.remove()); $$("li", ol).forEach(x => { x.hidden = false; }); const f = $("li button", ol); if (f) f.focus(); return; }
  const o = e.target.closest("[data-open]"), sec = $("#v-profiel");
  if (o && sec && !sec.hidden && sec.contains(o)) { e.preventDefault(); e.stopPropagation(); pnCont = true; go("profiel-" + o.dataset.open); }
}, true);
/* keys: ← → always (not in a text field), ↑ ↓ only with the focus in the header or the bar, so the text below keeps scrolling */
document.addEventListener("keydown", e => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const k = { ArrowLeft: "prev", ArrowRight: "next", ArrowUp: "vader", ArrowDown: "kind" }[e.key]; if (!k) return;
  if (!lb.hidden || !sdlg.hidden || ($("#dHelp") && !$("#dHelp").hidden)) return;
  const page = route.view === "profiel" && !pfSec().hidden, scope = !drawer.hidden ? drawer : page ? pfSec() : null; if (!scope) return;
  const t = e.target, inHead = !!(t.closest && t.closest("#dTop, #dHead, #dNav"));
  if (t.closest && t.closest("input, textarea, select, [contenteditable]")) return;
  if ((k === "vader" || k === "kind") && !inHead) return;
  if (!inHead && t !== document.body && !scope.contains(t)) return;
  const b = $(`#dNav [data-pn="${k}"]`); if (!b || b.disabled) return;
  e.preventDefault(); pnTipOff(); pnFocus = k; b.click();
});

/* ---------- profile: the family as a small tree ---------- */
/* Three layers in the shape of the tree page: the parents with their marriage, the person (accent frame) with the partner(s)
   and the siblings (folded), and the children. Only people with a kw get a box and are clickable (data-open); children and
   siblings that are only text in the data become name lines, as written: nothing is derived. Marriages come from p.marriages
   when present, otherwise from p.m and the text in p.m.note. The lines are one SVG behind the boxes, measured from the boxes
   (aria-hidden); C dashed, D dotted. Living people: the name only; in the text lists the ±1925 rule. kw 1 keeps the old block. */
const MF_RANK = { A: 0, B: 1, C: 2, D: 3 };
const mfWorst = (...s) => s.filter(x => x in MF_RANK).sort((a, b) => MF_RANK[b] - MF_RANK[a])[0] || null;
const mfSt = k => k > 1 ? stapSt(fanKw(k)) : null;
const mfName = p => p.kw === 1 && T.key === "s" ? p.n : (firstName(p) + " " + shortSur(splitName(p.n).sur)).trim() || p.n;
/* years in the profile: one form for an unknown year, "1722 – onbekend" (lifeYears itself is shared and stays as it is) */
const pfYears = p => !p || p.living ? "" : lifeYears(p).replace(/^\? – /, "onbekend – ").replace(/ – \?$/, " – onbekend");
const mfYears = pfYears;
/* a kids item that is a summary, not a child ("in totaal dertien kinderen", "allen RK gedoopt in Joure"): it starts with a small
   letter and is not "levenloos …", "een kind", "een zoon" or "een dochter". A safety net until the data moves these to kidsNote. */
const isKidsSummary = t => /^[a-zà-ÿ]/.test(String(t || "").trim()) && !/^(levenloos|een kind|een zoon|een dochter)\b/i.test(String(t).trim());
/* no years of people who may still live: years from 1925 go, unless the text also has a death (a range or "overleden") */
const pfNoLivingYears = t => /\b(19[2-9]\d|20\d\d)\b/.test(t) && !/\d{4}\s*[–-]\s*\d{4}|overle|†/i.test(t)
  ? t.replace(/\s*\(\s*(19[2-9]\d|20\d\d)\s*\)/g, "").replace(/,?\s*\b(19[2-9]\d|20\d\d)\b/g, "").replace(/\s{2,}/g, " ").trim() : t;
/* the name with its ♂/♀: the last word and the sign never part */
const mfNameMark = (name, mark) => { const s = String(name || ""), i = s.lastIndexOf(" ");
  return mark ? `${esc(s.slice(0, i + 1))}<span class="mf-nw">${esc(s.slice(i + 1))}${mark}</span>` : esc(s); };
const MF_FRAME = `<svg class="mf-frame" aria-hidden="true" focusable="false"><rect class="box" x="0" y="0" width="100%" height="100%"/></svg>`;
/* one line of a text list (kids, sibs): { kw, name, sep, meta, group, living } or { remark, text }. May still be alive: no death
   mentioned and born in 1925 or later, or no year at all while the parent was born after 1890 (or is living): the name only. */
function mfEntry(raw, parent) {
  let t = String(raw).trim(), kw = null, group = "";
  const g = t.match(/^uit (?:het|haar|zijn) (eerste|tweede|derde|1e|2e|3e) huwelijk(?:,? met [^:]+)?:\s*/i);
  if (g) { group = "uit het " + ({ eerste: "1e", tweede: "2e", derde: "3e" }[g[1].toLowerCase()] || g[1]) + " huwelijk"; t = t.slice(g[0].length); }
  const dead = /overle|†|levenloos|–\s*[^)–]*\d{4}|\d{4}\s*–\s*\d{4}/i.test(t);
  const years = (t.match(/\b(1[5-9]\d\d|20\d\d)\b/g) || []).map(Number), pb = parent && !parent.living ? yr(parent.b) : null;
  const living = !dead && (/nog in leven|levend/i.test(t) || years.some(y => y >= 1925) || (!years.length && (!parent || parent.living || (pb && pb > 1890))));
  /* one line with several names ("Riemke (1762), Uilkje (1763) en Lieutske"): the text as it is, a "kw N" in it clickable */
  if (/\),\s+[A-ZÀ-Ý]|\)\s+en\s+[A-ZÀ-Ý]/.test(t) || /^[A-ZÀ-Ý][\wà-ÿ-]+(?:,\s+[A-ZÀ-Ý][\wà-ÿ-]+)*\s+en\s+[A-ZÀ-Ý]/.test(t) && /,|\sen\s/.test(t.split("(")[0])) return { multi: true, text: living ? t.replace(/\s*\([^)]*\)/g, "") : t, group, living };
  t = t.replace(/\s*·\s*kw (\d+)\b/, (x, n) => { kw = +n; return ""; }).trim();
  if (!kw && !/^[A-ZÀ-Ý']/.test(t) && isKidsSummary(t)) return { remark: true, text: living ? pfNoLivingYears(t) : t, group };
  const cut = t.search(/\s\(|,|;/), name = cut < 0 ? t : t.slice(0, cut).trim();
  const sep = cut >= 0 && /[,;]/.test(t[cut]) ? t[cut] : "", meta = cut < 0 ? "" : t.slice(cut).replace(/^\s*[,;]\s*/, "").trim();
  /* man or woman only when the text says so (a role word); never from the name */
  const sex = /\b(zoon|zoontje|broer|broertje|weduwnaar|man van|echtgenoot van)\b/i.test(t) ? "m" : /\b(dochter|dochtertje|zus|zusje|zuster|vrouw van|weduwe|echtgenote van)\b/i.test(t) ? "v" : "";
  return { kw, name, sep, meta: living ? "" : meta, group, living, sex };
}
function mfBox(kw, rel, o = {}) {
  const k = fanKw(kw), p = person(k);
  if (!p) return `<div class="mf-box leeg">${MF_FRAME}<span class="mf-rel">${esc(rel)} · kw ${kw}</span><span class="mf-n">nog niet gevonden</span></div>`;
  const tw = twinKws(k), unsure = !p.living && (p.st === "C" || p.st === "D") ? " st-" + p.st : "", tag = !p.living && p.st && p.st !== "A" ? p.st : "";
  const yrs = mfYears(p), cls = `mf-box${o.self ? " zelf" : ""}${o.small ? " klein" : ""}${tw.length ? " twin" : ""}${unsure}`;
  const label = `${rel}, kw ${kw}: ${p.n}${yrs ? ", " + yrs : ""}${tag ? ", bewijs " + tag : ""}${tw.length ? ", staat ook als kw " + tw.join(", ") : ""}`;
  const inner = `${MF_FRAME}<span class="mf-stripe" style="--c:${lineColor(k)}"></span><span class="mf-rel">${esc(rel)} · kw ${kw}${o.inTree ? " · in de stamboom" : ""}</span>${tag ? `<span class="mf-st st-${tag}" aria-hidden="true">${tag}</span>` : ""}<b class="mf-n">${mfNameMark(mfName(p), sexMark(p))}</b>${yrs ? `<span class="mf-y">${esc(yrs)}</span>` : ""}`;
  return o.self ? `<div class="${cls}" title="${esc(p.n)}"><span class="mf-sr">${esc(label)} (dit profiel)</span>${inner}</div>`
    : `<button type="button" class="${cls}" data-open="${k}" title="${esc(p.n)}" aria-label="${esc(label)}">${inner}</button>`;
}
/* someone named in a source without a place in the tree: a light box, not clickable */
const mfLos = (rel, name, meta, sex) => `<div class="mf-box los">${MF_FRAME}<span class="mf-rel">${esc(rel)}</span><b class="mf-n">${mfNameMark(name, sexMark(sex || ""))}</b>${meta ? `<span class="mf-meta">${esc(meta)}</span>` : ""}</div>`;
/* one child or sibling: the child in the line as a full box ("in de stamboom"), others with a kw as small boxes, the rest as
   compact cards with the name, ♂/♀ when the text says so, and what the text says (dates; for the living the name only) */
function mfItem(e, word, inLine, hide) {
  const h = hide ? " hidden" : "";
  if (e.remark) return `<li class="mf-opm"${h}>${esc(e.text)}</li>`;
  if (e.multi) return `<li class="mf-naam mf-multi"${h}>${kwLinks(e.text)}</li>`;
  const gk = e.grand && e.grand.length ? `<span class="mf-gk">${e.grand.length === 1 ? "kind" : "kinderen"}: ${e.grand.map(g => esc(g.name) + (g.partner ? ` <span class="mf-gp">met ${esc(g.partner)}</span>` : "")).join(", ")}</span>` : "";
  if (e.kw && person(fanKw(e.kw))) return `<li data-kid="${e.kw}"${e.kw === inLine ? ' data-lijn="1"' : ""}${h}>${mfBox(e.kw, word(e.kw), { small: e.kw !== inLine, inTree: e.kw === inLine })}${gk}</li>`;
  if (e.desc) return `<li class="mf-kid mf-desc"${h}><button type="button" class="mf-dbtn" data-desc="${esc(e.desc)}" aria-label="${esc(e.name)}, profiel"><b class="mf-n">${esc(e.name)}</b></button></li>`;
  return `<li class="mf-kid"${h}><b class="mf-n">${mfNameMark(e.name, sexMark(e.sex || ""))}</b>${e.partner ? `<span class="mf-meta">met ${esc(e.partner)}</span>` : ""}${e.meta ? `<span class="mf-meta">${esc(e.meta)}</span>` : ""}${gk}</li>`;
}
const mfDate = s => { const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(s || "")); return m ? `${+m[1]} ${MONTHS[+m[2] - 1]} ${m[3]}` : fmt(s); };
const mfWhen = (d, pl) => [d ? mfDate(d) : "", pl ? placeName(pl) : ""].filter(Boolean).join(" · ");
/* may this partner still be alive? Then the marriage shows the name only. The birth year decides (from 1925, without a death);
   without a birth year a marriage from 1950 */
function mfPrivate(q, date) {
  if (q) { if (q.living) return true; if (q.d) return false; const b = yr(q.b); if (b) return b >= 1925; }
  return (yr(date) || 0) >= 1950;
}
/* the partner's kw in the current tree: marriages[].kw is numbered in the person's own tree (in the joined tree: renumber) */
const mfKwHere = (p, k) => k == null || !(k >= 1) ? null : FK && T.focus && T.fromS ? T.fromS(naarS(p.side === "a" ? "a" : "h", k)) /* a focus tree: via s, null outside the branch */
  : T.key === "s" ? k + 2 ** (Math.floor(Math.log2(k)) + (p.side === "a" ? 1 : 0)) : k;
/* the partners in the tree, in the order of the marriages (several when a person married twice inside the tree) */
const mfPartnerKws = (p, kw) => Array.isArray(p.marriages) ? p.marriages.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map(m => mfKwHere(p, m.kw)).filter(Boolean) : [];
/* all marriages of p, in order: { nr, pkw (partner in the tree) | null, name, when, extra, st, kids } */
function mfMarriages(p, kw) {
  const pk = kw ^ 1, pq = kw > 1 ? person(fanKw(pk)) : null;
  if (Array.isArray(p.marriages) && p.marriages.length) {
    const L = p.marriages.slice().sort((a, b) => (a.order || 0) - (b.order || 0)), more = L.length > 1;
    const out = L.map((m, i) => { const pkw = mfKwHere(p, m.kw), q = pkw ? person(fanKw(pkw)) : FK && T.focus && m.kw >= 1 ? fkRecord(naarS(p.side === "a" ? "a" : "h", m.kw)) : null, priv = p.living || mfPrivate(q, m.date);
      const name = !m.partner || /^onbekend$/i.test(m.partner) ? "onbekende partner" : m.partner;
      return { nr: more ? (m.order || i + 1) + "e huwelijk" : "", pkw, inTree: !!pkw, other: !pkw && q ? naarS(p.side === "a" ? "a" : "h", m.kw) : null, name, when: priv ? "" : mfWhen(m.date, m.place), extra: priv ? "" : m.note || "", st: priv ? null : m.st || null, kids: Array.isArray(m.kids) ? m.kids : null, kidsNote: m.kidsNote ? pfNoLivingYears(String(m.kidsNote)) : "" }; });
    if (!out.some(m => m.inTree) && pq) out.push({ nr: "", pkw: pk, inTree: true, name: pq.n, when: "", extra: "", st: null, kids: null });
    return out;
  }
  const tm = { nr: "", pkw: pk, inTree: true, name: p.m ? p.m.w : pq ? pq.n : "", when: p.m && !p.living && !mfPrivate(pq, p.m.d) ? mfWhen(p.m.d, p.m.p) : "", extra: "", st: null, kids: null };
  if (p.living) return [tm];
  /* other marriages only where the data says so in words: "Eerste huwelijk 24-06-1843 [in X] met Y", "hertrouwd 05-05-1894 met Y" */
  const note = (p.m && p.m.note) || "";
  const e = note.match(/eerste huwelijk\s+(\d{2}-\d{2}-\d{4}|\d{4})?\s*(?:in ([A-Z][\w-]+(?: [A-Z][\w-]+)?)\s*)?met ([^;.]+)/i);
  const hh = note.match(/hertrouwd\s+(\d{2}-\d{2}-\d{4}|\d{4})?\s*met ([^;.]+)/i);
  const los = (nr, d, pl, w) => { const priv = mfPrivate(null, d), from = (w.match(/\buit\s+(.*)$/) || [])[0] || "";
    return { nr, inTree: false, name: w.replace(/\s+uit\s+.*$/, "").trim(), when: priv ? "" : [d ? mfDate(d) : "", pl || ""].filter(Boolean).join(" · "), extra: priv ? "" : from, st: null, kids: null }; };
  if (e) tm.nr = "2e huwelijk"; else if (hh) tm.nr = "1e huwelijk";
  return [e ? los("1e huwelijk", e[1], e[2], e[3]) : null, tm, hh ? los(e ? "3e huwelijk" : "2e huwelijk", hh[1], "", hh[2]) : null].filter(Boolean);
}
let MF_N = 0; /* a unique id per small tree (more than one can be open, in the columns of #profielen) */
function mfHtml(kw) {
  MF_N++;
  const p = person(kw); if (!p || kw < 1 || (kw === 1 && rootGroup())) return "";
  /* kw 1 of a person's own tree (h, a): siblings, partner and children come from the tree settings (names only, all living);
     a chosen single person (FK) is an ordinary record, with partner and children from the data */
  const root = kw === 1 && (T.key === "h" || T.key === "a"), other = root && (T.key === "h" ? TREES.a : TREES.h), alive = { living: true };
  const fk = kw * 2, mk = kw * 2 + 1, fa = person(fanKw(fk)), mo = person(fanKw(mk)), pk = kw ^ 1, ck = kw >> 1, ch = person(fanKw(ck));
  const male = isMale(kw), fn = firstName(p);
  const childWord = k => rootGroup() && k === 1 ? "kinderen" : isMale(k) ? "zoon" : "dochter", sibWord = k => isMale(k) ? "broer" : "zus";
  /* layer 1: the parents, with their marriage */
  const top = fa || mo ? `<ul class="mf-row" aria-label="Ouders"><li data-r="vader">${mfBox(fk, "vader")}</li><li data-r="moeder">${mfBox(mk, "moeder")}</li></ul>`
    : `<ul class="mf-row" aria-label="Ouders"><li data-r="ouders" class="mf-span"><div class="mf-box leeg">${MF_FRAME}<span class="mf-rel">ouders · kw ${fk} en ${mk}</span><span class="mf-n">nog niet gevonden</span></div></li></ul>`;
  const pm = fa && !fa.living && fa.m ? fa.m : mo && !mo.living && mo.m ? mo.m : null;
  const pmTxt = pm && !(fa && fa.living) && !(mo && mo.living) ? mfWhen(pm.d, pm.p) : "";
  const zone = `<div class="mf-zone${pmTxt ? "" : " leeg"}">${pmTxt ? mfWed("getrouwd", pmTxt) : ""}</div>`; /* the marriage sits on the line between the couple */
  /* layer 2: the person with the siblings, and the partner(s) */
  const sibD = root ? (T.sibsIds || []).map((id, i) => ({ id, n: (T.sibs || [])[i] })) : p.living ? kidsOfPair(fa, mo).map(d => ({ id: d.id, n: d.roep || d.n })) : [];
  const sibs = (sibD.length ? sibD.map(d => Object.assign(mfEntry(d.n, alive), { desc: d.id })) : (root ? T.sibs || [] : p.living ? [] : p.sibs || []).map(s => mfEntry(s, root ? alive : fa || mo))), sibN = sibs.filter(e => !e.remark);
  const sibTog = sibs.length ? `<button type="button" class="mf-tog" aria-expanded="false" aria-controls="mfSibs${MF_N}">${sibN.length ? `+ ${sibN.length} ${sibN.length === 1 ? (sibN[0].kw ? sibWord(sibN[0].kw) : "broer of zus") : "broers en zussen"}` : "broers en zussen"}</button>
    <ul class="mf-sibs" id="mfSibs${MF_N}" hidden aria-label="Broers en zussen van ${esc(fn)}">${sibs.map(e => mfItem(e, sibWord, -1)).join("")}</ul>` : "";
  const M = root ? (other ? [{ nr: "", pkw: null, inTree: false, name: other.rootFull || other.root, when: "", extra: "", st: null, kids: null, root: true }] : []) : mfMarriages(p, kw), pw = male ? "echtgenote" : "echtgenoot";
  const partners = M.map(m => m.inTree ? `<li data-r="partner">${mfBox(m.pkw, pw + (m.nr ? " · " + m.nr : ""))}</li>`
    : `<li data-r="partner" data-los="1"${m.other ? ` data-other="${m.other}"` : ""}>${mfLos(pw + (m.nr ? " · " + m.nr : "") + (m.other ? " · andere tak" : ""), m.name, "", male ? "v" : "m")}</li>`).join("");
  /* as in the pedigree: the man on the left, the woman on the right, also in the row of the couple */
  const selfCol = `<div class="mf-col">${mfBox(kw, "dit profiel", { self: true })}${sibTog}</div>`, partCol = `<ul class="mf-col" aria-label="${M.length > 1 ? "Huwelijken" : "Huwelijk"} van ${esc(fn)}">${partners}</ul>`;
  const mid = `<div class="mf-row mid">${male ? selfCol + partCol : partCol + selfCol}</div>`;
  /* layer 3: per marriage the wedding (on the line, under the couple) and its children: from marriages[].kids, otherwise from
     "uit het eerste huwelijk" in the text; the child in the line belongs to the marriage with the partner at kw ^ 1. Children
     whose marriage the data does not name stay under "overige kinderen". The child in the line is a box, the others name lines. */
  /* the youngest generations: a child's partner (kidsPartners) and the grandchildren (grandkids), names only, as the most recent public source has them */
  /* the children are often kept once, at the partner in the tree (usually the father): without a list of her own, a person
     shows the children of the shared marriage from the partner (marriages[].kids there, else all of the partner's children) */
  const pq = !root && !p.living && !(p.kids || []).length ? person(fanKw(pk)) : null, pqm = pq && (pq.marriages || []).find(m => mfKwHere(pq, m.kw) === kw);
  const ks = pq && (pq.kids || []).length ? pq : p, idx = ks === pq && pqm && Array.isArray(pqm.kids) && (pq.marriages || []).length > 1 ? pqm.kids : null;
  const kp = new Map((ks.kidsPartners || []).map(([i, n]) => [i, n])), gks = ks.grandkids || [];
  const kids = (root ? T.kids || [] : p.living ? [] : ks.kids || []).map((s, i) => Object.assign(mfEntry(s, root ? alive : ks), { i, partner: kp.get(i) || "", grand: gks.filter(g => g.parent === i) }))
    .filter(e => !idx || idx.includes(e.i));
  if (ks !== p) kids.forEach(e => { e.mi = Math.max(0, M.findIndex(m => m.pkw === pk)); e.borrowed = true; });
  /* living children (people without a kw, DESCENDANTS): each a card of its own, in the order of the data */
  if (root) kids.forEach(e => { const id = (T.kidsIds || [])[e.i]; if (id) e.desc = id; });
  else if (!kids.some(e => !e.remark)) { const pp = person(fanKw(pk)); kidsOfPair(p, pp).forEach(d => kids.push(Object.assign(mfEntry(d.roep || d.n, alive), { desc: d.id, borrowed: true, mi: Math.max(0, M.findIndex(m => m.pkw === pk)) }))); }
  const descKids = kids.some(e => e.desc) && !root;
  const home = Math.max(0, M.findIndex(m => m.pkw === pk) >= 0 ? M.findIndex(m => m.pkw === pk) : M.findIndex(m => m.inTree));
  kids.forEach(e => { if (e.borrowed) return; let j = M.findIndex(m => m.kids && m.kids.includes(e.i));
    if (j < 0 && e.group) { const o = e.group.replace(/^uit het /, "").replace(/ huwelijk$/, ""); j = M.findIndex(m => m.nr && m.nr.startsWith(o + " ")); }
    if (j < 0 && M.length === 1) j = 0;
    if (j < 0 && e.kw === ck) j = home;
    e.mi = j; });
  if (ch && !(ck === 1 && FK && T.focus && T.focus.pair) && !(descKids && ck === 1 && rootGroup()) && !kids.some(e => e.kw === ck)) kids.unshift({ kw: ck, name: ch.n, meta: "", mi: home }); /* not the group of a couple as the focus: its children are in the list already */
  const nK = kids.filter(e => !e.remark).length;
  const block = (m, list, j) => {
    /* all children as cards; above six the rest folds ("+ N meer"); the child in the line always shows */
    const wed = !m ? `<p class="mf-wed mf-ov">overige kinderen</p>`
      : M.length > 1 ? mfWed(`${m.nr}, met ${m.name === "onbekende partner" ? "een onbekende partner" : m.name}${m.when ? " ·" : ""}`, m.when, m.st)
      : m.when || m.root ? mfWed("getrouwd", m.when, m.st) : "";
    const note = m && m.extra ? `<p class="mf-wnote">${esc(m.extra)}</p>` : "";
    /* summaries ("in totaal dertien kinderen", a line with several names) are one quiet line under the cards, not a card */
    const sums = [...cards(list, "sum").map(e => e.multi ? kwLinks(e.text) : esc(e.text)), m && m.kidsNote ? esc(m.kidsNote) : ""].filter(Boolean);
    const cl = cards(list, "card"), hd = cl.map((e, x) => cl.length > 6 && x >= 6 && e.kw !== ck), nh2 = hd.filter(Boolean).length;
    const tog2 = nh2 ? `<li class="mf-meer"><button type="button" class="mf-tog" aria-expanded="false">+ ${nh2} meer</button></li>` : "";
    if (!wed && !note && !list.length && !sums.length) return "";
    return `<div class="mf-fam">${wed}${note}${cl.length ? `<ul class="mf-kids" aria-label="Kinderen${m && M.length > 1 ? " uit het " + esc(m.nr) : !m ? " (huwelijk niet vermeld)" : ""}">${cl.map((e, x) => mfItem(e, childWord, ck, hd[x])).join("")}${tog2}</ul>` : ""}${sums.map(s => `<p class="mf-knote">${s}</p>`).join("")}</div>`;
  };
  const cards = (list, w) => list.filter(e => !!(e.remark || e.multi) === (w === "sum"));
  const fams = M.map((m, j) => block(m, kids.filter(e => e.mi === j), j)).join("") + (kids.some(e => e.mi < 0) ? block(null, kids.filter(e => e.mi < 0), -1) : "")
    + (p.kidsNote && !p.living ? `<p class="mf-knote">${esc(pfNoLivingYears(String(p.kidsNote)))}</p>` : "") /* a note about all children */
    + (root && T.kids && T.kids.length && TREES.s ? `<p class="mf-knote"><button type="button" class="link" data-tree="s">Hun stamboom, met beide families</button></p>` : "")
    + (root && (T.sibsSrc || []).length ? `<p class="mf-knote">Broers en zussen: ${T.sibsSrc.map(x => `<a href="${esc(x[1])}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join(" · ")}</p>` : "");
  /* the same family in one or two sentences, for a screen reader */
  const tmi = M.find(m => m.inTree), pa = tmi ? person(fanKw(tmi.pkw)) : null, ouders = [fa, mo].filter(Boolean).map(firstName);
  const zin = [`${fn} is ${male ? "de zoon" : "de dochter"} van ${ouders.length ? ouders.join(" en ") : "nog onbekende ouders"}.`,
    pa ? (!p.living && tmi && tmi.when ? `${male ? "Hij" : "Zij"} trouwde met ${pa.n} (${tmi.when}).` : `${male ? "Echtgenote" : "Echtgenoot"}: ${pa.n}.`) : "",
    M.length > 1 ? `${M.length} huwelijken: met ${M.map(m => m.name).join(", ")}.` : "",
    descKids && ck === 1 && rootGroup() ? `Kinderen: ${kids.filter(e => !e.remark).map(e => e.name).join(", ").replace(/, ([^,]*)$/, " en $1")}.`
    : nK > 1 && ch ? `${nK} kinderen bekend, onder wie ${ch.n} (kw ${ck}).` : ch ? `${T.key === "s" && ck === 1 ? "Kinderen" : "Kind"}: ${ch.n} (kw ${ck}).` : "",
    sibN.length ? `${sibN.length} ${sibN.length === 1 ? "broer of zus" : "broers en zussen"} bekend.` : ""].filter(Boolean).join(" ");
  const leg = [fk, mk, kw, pk].some(k => ["C", "D"].includes(mfSt(k))) ? `<p class="mf-leg" aria-hidden="true"><span><i></i>akte of sterk</span><span><i class="c"></i>onzeker (C)</span><span><i class="d"></i>hypothese (D)</span></p>` : "";
  return `<section class="dfam mf-sec"><h5>Familie</h5><figure class="mf" data-mf="${kw}" aria-label="Familie van ${esc(p.n)}"><figcaption class="mf-sr">${esc(zin)}</figcaption>
    <div class="mf-tree"><svg class="mf-lines" aria-hidden="true" focusable="false"></svg>${top}${zone}${mid}<div class="mf-fams">${fams}</div></div>${leg}</figure></section>`;
}
/* a wedding on the line: a small pill with two rings, the words muted and the date and place in ink */
const MF_RINGS = `<svg class="mf-rings" viewBox="0 0 20 14" aria-hidden="true" focusable="false"><circle cx="7.5" cy="7" r="4.5"/><circle cx="12.5" cy="7" r="4.5"/></svg>`;
const mfWed = (words, when, st) => `<p class="mf-wed">${MF_RINGS}<span>${esc(words)}${when ? ` <b>${esc(when)}</b>` : ""}${st && st !== "A" ? " " + stTag(st) : ""}</span></p>`;
let mfRO = null;
/* col: a column of #profielen keeps its own observer, so the drawer and the columns do not stop each other */
function mfBind(fig, col) {
  if (col) { if (col.mfRO) col.mfRO.disconnect(); col.mfRO = null; } else if (mfRO) { mfRO.disconnect(); mfRO = null; }
  if (!fig) return; const kw = +fig.dataset.mf;
  $$(".mf-tog", fig).forEach(b => b.onclick = () => {
    const open = b.getAttribute("aria-expanded") !== "true", id = b.getAttribute("aria-controls");
    if (id) { b.setAttribute("aria-expanded", String(open)); $("#" + id, fig).hidden = !open; }
    else { const ul = b.closest("ul"), nu = $$(":scope > li[hidden]", ul); nu.forEach(li => { li.hidden = false; }); b.closest("li").remove();
      const f = nu.map(li => $("button", li)).find(Boolean); if (f) f.focus(); else { ul.tabIndex = -1; ul.focus(); } }
    mfDraw(fig, kw);
  });
  mfDraw(fig, kw);
  if ("ResizeObserver" in window) { const ro = new ResizeObserver(() => mfDraw(fig, kw)); ro.observe($(".mf-tree", fig)); if (col) col.mfRO = ro; else mfRO = ro; }
}
/* the lines, as in the tree: var(--rule) 1.5; C "4 3" in var(--weak), D "1 3" in var(--hyp) */
const mfDash = s => s === "D" ? { "stroke-dasharray": "1 3", "stroke-linecap": "round", stroke: "var(--hyp)", "stroke-width": 2 } : s === "C" ? { "stroke-dasharray": "4 3", stroke: "var(--weak)" } : {};
function mfDraw(fig, kw) {
  const tree = $(".mf-tree", fig), svg = $(".mf-lines", tree); if (!tree || !tree.clientWidth) return;
  const R0 = tree.getBoundingClientRect(), r = n => { const b = n.getBoundingClientRect(); return { l: b.left - R0.left, r: b.right - R0.left, t: b.top - R0.top, b: b.bottom - R0.top, cx: (b.left + b.right) / 2 - R0.left, cy: (b.top + b.bottom) / 2 - R0.top }; };
  svg.innerHTML = "";
  const path = (d, a = {}) => el("path", Object.assign({ d, fill: "none", stroke: "var(--rule)", "stroke-width": 1.5 }, a), svg);
  const selfB = $(".mf-box.zelf", tree); if (!selfB) return; const self = r(selfB);
  /* the parents: a marriage line between them, from its middle one line down to the person (the weaker of the two links) */
  const fv = $('[data-r="vader"] .mf-box', tree), mv = $('[data-r="moeder"] .mf-box', tree);
  if (fv && mv) {
    const f = r(fv), m = r(mv), y = Math.min(f.cy, m.cy), x = (f.r + m.l) / 2;
    path(`M${f.r} ${y}H${m.l}`, fv.classList.contains("leeg") || mv.classList.contains("leeg") ? { "stroke-dasharray": "4 3" } : {});
    path(`M${x} ${y}V${self.t - 12}H${self.cx}V${self.t}`, mfDash(mfWorst(mfSt(kw * 2), mfSt(kw * 2 + 1))));
  }
  /* partners: from the person's inner edge into the gap, then to each partner (a woman's partners stand on the left) */
  const pbs = $$('[data-r="partner"] > .mf-box', tree).map(r), left = pbs.length && pbs[0].cx < self.cx;
  const sx0 = left ? self.l : self.r, gx = pbs.length ? (left ? (pbs[0].r + self.l) / 2 : (self.r + pbs[0].l) / 2) : self.cx;
  pbs.forEach(q => { const qx = left ? q.r : q.l; path(Math.abs(q.cy - self.cy) < 2 ? `M${sx0} ${self.cy}H${qx}` : `M${sx0} ${self.cy}H${gx}V${q.cy}H${qx}`); });
  /* children: one straight line down from the couple (the weddings sit on it), with a short tick to each child */
  let yEnd = pbs.length ? Math.max(...pbs.map(q => q.cy)) : self.b;
  $$(".mf-fam .mf-wed, .mf-fam .mf-wnote", tree).forEach(n => { yEnd = Math.max(yEnd, r(n).cy); });
  $$(".mf-kids > li:not([hidden])", tree).forEach(li => {
    const b = $(".mf-box", li), y = b ? r(b).cy : r(li).t + 10, x = (b ? r(b) : r(li)).l;
    yEnd = Math.max(yEnd, y);
    path(`M${gx} ${y}H${x - 2}`, li.dataset.lijn === "1" ? mfDash(mfWorst(mfSt(kw), mfSt(kw ^ 1))) : li.classList.contains("mf-meer") ? { "stroke-dasharray": "2 3" } : {});
  });
  if (yEnd > (pbs.length ? self.cy : self.b)) path(`M${gx} ${pbs.length ? self.cy : self.b}V${yEnd}`);
}

/* ---------- profile: the sources, per kind ---------- */
/* Four or more sources, or more than one kind: a small heading per kind (icon and word), the lines below it without a chip.
   One to three of one kind: a plain list. The same source twice (the same address or the same label) is shown once. A deed
   with a scan gets a small icon at the end of the line: the scan in the lightbox when the site has it, otherwise AlleFriezen. */
const SRC_GROEP = [["Akte", "Akten"], ["Bevolkingsregister", "Registers"], ["Kerkboek (index)", "Kerkboeken"], ["Krant", "Kranten"], ["Graf", "Graven"], ["Bidprentje", "Bidprentjes"], ["Literatuur", "Literatuur"], ["Beeld", "Beelden"], ["Genealogie", "Genealogieën"]];
const srcNorm = u => String(u || "").trim().replace(/^http:/i, "https:").replace(/#.*$/, "").replace(/\/+$/, "");
/* the numbers that name one piece: the address, and an Archief RK Friesland number in the address or the label */
function srcIds(label, url) {
  const ids = new Set(), u = String(url || ""), l = String(label || ""); let m;
  if (u) ids.add("u:" + srcNorm(u));
  if ((m = /archiefrkfriesland\.nl\/archiefdata\/advertenties\/(\d+)/i.exec(u))) ids.add("rkf:" + m[1]);
  if ((m = /archiefrkfriesland\.nl\/.*[?&]nummer=(\d+)/i.exec(u))) ids.add("rkfp:" + m[1]);
  if ((m = /RK Friesland,?\s+(?:nr\.?\s*)?(\d{3,7})\b/i.exec(l))) ids.add("rkf:" + m[1]);
  if ((m = /RK Friesland.*personendatabase\s+nr\.?\s*(\d{3,7})\b/i.exec(l))) ids.add("rkfp:" + m[1]);
  return ids;
}
/* a label in two parts: the title (the link) and the archive details, muted ("Tresoar · toegang 30-31 · inv. 2036 · akte 72") */
function srcSplit(label, type) {
  let t = String(label || ""), d = ""; const i = t.indexOf(" · ");
  if (i > 0) { d = t.slice(i + 3); t = t.slice(0, i); }
  const m = /,\s*((?:akte|fol\.?|folio|blad|nr\.?)\s*[\w./-]+)$/i.exec(t);
  if (m) { t = t.slice(0, m.index); d = d ? d + ", " + m[1] : m[1]; }
  if (!d && type === "Krant") { const k = /^([^,(]+),\s+(.*\d{2}-\d{2}-\d{4}.*)$/.exec(t); if (k) { t = k[1]; d = k[2]; } } /* newspaper: the paper and the date */
  if (/toegang|inv\.|akte|fol\./i.test(d)) d = d.replace(/,\s+(?![^(]*\))/g, " · ");
  return { t, d };
}
/* about a relative: only when the label says so in its first words ("Bidprentje broertje …", "Overlijden zoon …") */
const SRC_VERWANT = /^[^,(]*\b(broer|broertje|zus|zusje|zuster|zoon|zoontje|dochter|dochtertje|vader|moeder|kind|grootvader|grootmoeder|schoonvader|schoonmoeder|oom|tante|neef|nicht)\b/i;
function srcBlock(kw, p) {
  const frlOf = u => (/frl:([0-9a-f-]{36})/.exec(u || "") || [])[1] || null;
  const srcG = new Set((p.src || []).map(x => frlOf(x[1])).filter(Boolean)), srcU = new Set((p.src || []).map(x => x[1]).filter(Boolean));
  const losse = (p.scan || []).filter(x => x[1] && !srcU.has(x[1]) && ![...srcG].some(g => x[1].includes(g))); /* scans without a source line of their own */
  const items = [], base = l => norm(String(l || "").replace(/\s*\([^)]*\)/g, "")).replace(/\s+/g, " ").trim();
  /* the same piece twice (same address, same archive number, same label; a scan with the label of its source): shown once,
     with the richest label; a scan file of a merged line becomes the scan icon */
  const add = (label, url, scan) => { const ids = srcIds(label, url), nl = norm(label).replace(/\s+/g, " ").trim(), b = base(label), frl = frlOf(url);
    const dup = items.find(x => [...ids].some(i => x.ids.has(i)) || (nl && x.nl === nl) || (scan && b.length >= 20 && x.b === b));
    if (!dup) { items.push({ label: String(label || ""), url, ids, nl, b, frl, img: null, type: srcType(url, label) }); return; }
    ids.forEach(i => dup.ids.add(i)); if (frl && !dup.frl) dup.frl = frl;
    if (scan && url && url !== dup.url) dup.img = dup.img || url;
    if (String(label || "").length > dup.label.length) dup.label = String(label); };
  (p.src || []).forEach(s => add(s[0], s[1], false)); losse.forEach(x => add(x[0], x[1], true));
  if (!items.length) return "";
  /* scans the site has itself (the lightbox), by the first eight characters of the AlleFriezen number */
  const akf = typeof akfIdx === "function" && !p.living ? [...new Set([kw, ...twinKws(kw)].map(imgKey))].flatMap(k => akfIdx().get(k) || []).filter(x => x.soort === "akte") : [];
  const scans = u => { const m = UUID_RE.exec(u || ""); if (!m) return []; const h8 = m[0].slice(0, 8).toLowerCase(); return [...new Set(akf.filter(x => (/^akte-[a-z]+-([0-9a-f]{8})/.exec(x.id) || [])[1] === h8).map(x => x.id))]; };
  /* one line: the title as the link, the archive details muted below it, the scan as an icon in a fixed right column */
  const line = it => { const ids = scans(it.url), s = srcSplit(it.label, it.type);
    const scan = ids.length ? `<span class="src-scan" data-akfl="${esc(ids.join(" "))}"><button type="button" class="src-scanb" data-akf="${esc(ids[0])}" aria-label="Bekijk de scan" title="Bekijk de scan">${srcIco("Scan")}</button></span>`
      : it.img ? `<a class="src-scanb" href="${esc(it.img)}" target="_blank" rel="noopener" aria-label="Bekijk de scan (nieuw tabblad)" title="De scan, in een nieuw tabblad">${srcIco("Scan")}</a>`
      : it.frl ? `<a class="src-scanb" href="https://allefriezen.nl/zoeken/deeds/${it.frl}" target="_blank" rel="noopener" aria-label="Bekijk de scan (AlleFriezen, nieuw tabblad)" title="De scan bij AlleFriezen, in een nieuw tabblad">${srcIco("Scan")}</a>` : "";
    return `<li><span class="src-x">${it.url ? `<a class="src-t" href="${esc(it.url)}" target="_blank" rel="noopener">${esc(s.t)}</a>` : `<span class="src-t">${esc(s.t)}</span>`}${s.d ? `<span class="src-d">${esc(s.d)}</span>` : ""}</span>${scan}</li>`; };
  const list = its => { const own = its.filter(x => !SRC_VERWANT.test(x.label)), rel = its.filter(x => SRC_VERWANT.test(x.label));
    return (own.length ? `<ul class="src-l">${own.map(line).join("")}</ul>` : "") + (rel.length ? `<p class="src-vk">over verwanten</p><ul class="src-l">${rel.map(line).join("")}</ul>` : ""); };
  const known = SRC_GROEP.map(g => g[0]), types = [...new Set(items.map(x => known.includes(x.type) ? x.type : "Overig"))];
  if (items.length < 4 && types.length === 1) return `<section class="dsrc"><h5>Bronnen</h5>${list(items)}</section>`;
  const groups = [...SRC_GROEP, ["Overig", "Overig"]].filter(g => types.includes(g[0])).map(([t, w]) => { const its = items.filter(x => (known.includes(x.type) ? x.type : "Overig") === t);
    return `<div class="src-g"><h6 class="src-gk">${srcIco(t)}<span>${esc(w)}</span> <span class="src-n">${its.length}</span></h6>${list(its)}</div>`; });
  return `<section class="dsrc"><h5>Bronnen</h5>${groups.join("")}</section>`;
}
/* the block "Beeld": grouped like the sources (icon, kind, number), the title as the link, year and status muted */
function mdBlock(md) {
  if (!md.length) return "";
  const ico = k => ({ bidprentje: srcIco("Bidprentje"), krant: srcIco("Krant"), kerk: navIco("beeld-plaatsen"), plek: navIco("kaart"), achtergrond: srcIco("Literatuur") })[k] || srcIco("Beeld");
  const kinds = [...Object.keys(MEDIA_KINDS), ...new Set(md.map(m => m.kind))].filter((k, i, a) => a.indexOf(k) === i && md.some(m => m.kind === k));
  return `<section class="dsrc dmd"><h5>Beeld</h5>${kinds.map(k => { const its = md.filter(m => m.kind === k);
    return `<div class="src-g"><h6 class="src-gk">${ico(k)}<span>${esc((MEDIA_KINDS[k] || {}).label || "Overig")}</span> <span class="src-n">${its.length}</span></h6><ul class="src-l">${its.map(m => { const d = [m.y ? String(m.y) : "", m.unread ? "nog niet gelezen" : ""].filter(Boolean).join(" · ");
      return `<li><span class="src-x"><button type="button" class="link src-t" data-media="${esc(m.id)}">${esc(m.t)}</button>${d ? `<span class="src-d">${esc(d)}</span>` : ""}</span></li>`; }).join("")}</ul></div>`; }).join("")}</section>`;
}
/* opts.col: render into a column of #profielen (a container from pcCtx) instead of the drawer or the full page; the drawer and
   the page keep their ids (#dTop, #dHead, #dNav, #dBody, #dName …), a column gets the same elements with its own id suffix */
function openProfile(kw, opts = {}) {
  const p = person(kw), COL = opts.col || null;
  if (COL) { if (!p) return; renderProfile(kw, p, opts, COL); return; }
  if (!p) { if (!drawer.hidden) closeProfile(true); if (opts.fromHistory) setHash(T.prefix + currentToken(), "replace"); return; } /* onbekend nummer: lade dicht, adres van de pagina eronder */
  if (opts.fromHistory && curKw === kw && !drawer.hidden) return; /* popstate en hashchange kunnen allebei vuren */
  if (!opts.page && route.view === "profiel") { if (!opts.fromHistory) { pnCont = true; go("profiel-" + kw); return; } go("overzicht", { keepHash: true, keepScroll: true }); } /* on the full page a profile opens as a page */
  if (drawer.hidden && !opts.page) lastFocus = document.activeElement;
  pnTrack(kw, !!opts.fromHistory, opts.page ? !pnCont : drawer.hidden && !pnCont); pnCont = false;
  if (!opts.page && drawer.hidden && !opts.fromHistory) PN.onder = currentToken();
  else if (opts.fromHistory && history.state && history.state.onder) PN.onder = history.state.onder;
  pnDock(!!opts.page);
  curKw = kw;
  renderProfile(kw, p, opts, null);
}
/* the profile itself, into the drawer or the full page (C = null: the elements with the fixed ids) or into a column (C) */
function renderProfile(kw, p, opts, COL) {
  const C = COL || { top: $("#dTop"), head: $("#dHead"), body: $("#dBody"), sfx: "" };
  const I = id => id + C.sfx, D = id => document.getElementById(id + C.sfx), alive = () => COL ? COL.kw === kw && C.body.isConnected : curKw === kw;
  if (COL) COL.kw = kw;
  const ln = lineOf(kw);
  const altBits = [p.roep && p.roep !== p.n ? `roepnaam ${p.roep}` : "", p.alt || ""].filter(Boolean).join(" · ");
  const port = portraitOf(kw);
  const vli = typeof vlIcon === "function" ? vlIcon(p) : "", hn = opts.page ? "h1" : "h2"; /* read aloud: a small icon in the header */
  C.head.className = "p-head pn-head" + (opts.page ? " pf-head" : "");
  if (COL) { const o = $(":scope > .pn-nav", C.root); if (o) o.remove(); } /* the row of the previous profile in this column */
  /* the sticky bar: back, forward, the name small (once the big name has scrolled away), share, read aloud, page, close */
  C.top.innerHTML = `${COL ? "" : `<div class="pn-hist">${pnHistBtn("back")}${pnHistBtn("fwd")}</div>`}<span class="pn-tname" aria-hidden="true">${esc(p.n)}</span>${pnStar(kw, p, "pn-tstar")}
      <div class="pn-win"><span class="pn-inl">${pnTargetBtn(kw, p)}${pcBarBtn(kw, p, COL)}<button type="button" class="pn-ib" id="${I("dShare")}" aria-label="Deel een link naar dit profiel" title="Delen">${pnIco("share")}</button>${COL ? "" : vli}${opts.page || COL ? "" : `<button type="button" class="pn-ib" data-pn="full" aria-label="Volledig scherm" title="Volledig scherm">${pnIco("full")}</button>`}</span>${pnMoreHtml(kw, p, opts, COL, C.sfx)}<span class="small dshare-ok pn-toast" id="${I("dShareOk")}" role="status" aria-live="polite"></span>${COL ? `<button type="button" class="pn-ib pp-x pn-leave" data-pc-close aria-label="Sluit ${esc(p.n)}" title="Sluit ${esc(p.n)}">${pnIco("close")}</button>`
        : opts.page ? `<button type="button" class="btn pf-panel pn-leave" data-pn="panel" aria-label="Terug naar het paneel">${pnIco("panel")}<span>Terug naar het paneel</span></button>` : `<button type="button" class="pn-ib pn-leave" aria-label="Sluiten" title="Sluiten (Esc)" id="${I("dClose")}">${pnIco("close")}</button>`}</div>`;
  /* what scrolls with the content: the path, the top line with the generation, the big name, the labels */
  C.head.innerHTML = `${pnCrumbs(kw)}
    <div class="dtitle${port ? " withport" : ""}">${port ? `<button class="dport" data-img="${port.id}" aria-label="Vergroot het portret van ${esc(p.n)}" title="${esc(port.t)}"><img src="${port.thumb}" alt="Portret van ${esc(p.n)}" style="object-position:${cropOf(port)}"></button>` : ""}<div>
    <div class="eyebrow pn-eb"><abbr title="Kwartiernummer ${kw}: het nummer in de stamboom. De vader van nummer n heeft 2n, de moeder 2n + 1." aria-label="Kwartiernummer ${kw}">kw ${kw}</abbr> · ${esc(pnRelWords(kw))}${kw > 1 ? ` · generatie ${ROMAN[gen(kw)]}` : ""}${pnGenHtml(kw)}</div>
    <div class="pn-nmrow"><${hn} id="${I("dName")}" class="p-name" tabindex="-1">${esc(p.n)}</${hn}>${pnStar(kw, p, "pn-bstar")}</div>
    ${altBits ? `<div class="alt">${esc(altBits)}</div>` : ""}</div></div>
    <div class="dchips" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      ${ln ? `<button class="chip" style="--c:var(--l${ln})" data-go="lijn-${ln}"><i></i>${p.aliasOf ? "via de lijn" : "familie"} ${esc(LINES[ln].name)}</button>` : ""}
      ${p.living ? `<span class="tag" style="color:var(--muted)">levend</span>` : p.st ? `<span class="tag st-${p.st}" title="Bewijs ${p.st}: ${BEWIJS_KORT[p.st]}. ${esc(STATUS[p.st].long)}" aria-label="Bewijs ${p.st}: ${BEWIJS_KORT[p.st]}">${p.st} · ${STATUS[p.st].label.toLowerCase()}</span>` : ""}
      ${p.living ? "" : chgTag(kw)}
      ${p.link && kw > 1 && person(kw >> 1) ? (() => { const kn = shortOf(kw >> 1), rol = isMale(kw) ? "vader" : "moeder"; return `<span class="tag st-${p.link}" title="Dat ${esc(firstName(p))} de ${rol} is van ${esc(kn)}: ${BEWIJS_KORT[p.link]} (${p.link})" aria-label="${rol} van ${esc(kn)}: ${BEWIJS_KORT[p.link]}">${rol} van ${esc(kn)} · ${p.link}</span>`; })() : ""}
      ${p.living ? "" : `<button type="button" class="qhelp" id="${I("dHelpBtn")}" aria-label="Zo lees je dit profiel" title="Zo lees je dit profiel" aria-expanded="false" aria-controls="${I("dHelp")}">?</button>`}
    </div>
    ${p.living ? "" : `<div class="dhelp" id="${I("dHelp")}" role="note" hidden><b>Zo lees je dit profiel.</b> <b>kw</b> is het nummer in de stamboom: de vader van nummer n heeft 2n, de moeder 2n + 1. De letter A tot D zegt hoe sterk het bewijs is, van A (akte) tot D (hypothese). Het tweede label zegt hoe zeker het is dat deze persoon de vader of moeder is van het kind in de lijn. <button type="button" class="link" data-go="bronnen">Meer uitleg</button><span class="pn-tip"><br>Toetsen: <kbd>←</kbd><kbd>→</kbd> generatie · <kbd>↑</kbd> vader · <kbd>↓</kbd> kind · <kbd>Esc</kbd> sluiten</span></div>`}
    `;
  C.head.insertAdjacentHTML("afterend", pnNavHtml(kw, C.sfx)); /* the row of buttons: sticky under the bar (phone: at the bottom), see pnPlace */
  /* the actions: tree, fan and (when the hook offers it) "Hoe ben ik familie?"; sharing and reading aloud are icons in the header */
  /* the actions, in three groups, each with an icon: look (fan, tree) · explore (how related, a column beside) · put in the centre */
  const dIco = svg => svg.replace(/class="(nico|pn-ico)"/, 'class="$1 dact-ico"');
  const dCenter = centerChoices(kw).map(c => `<button type="button" class="btn" data-center="${c.kw}" data-pair="${c.pair ? 1 : 0}">${dIco(c.pair ? navIco("families") : pnIco("target"))}${esc(c.label)}</button>`).join("");
  const dExplore = (kw > 1 && vwProfielKnop(kw) ? `<button class="btn" data-go="verwant-${kw}" title="${esc(`Hoe is ${firstName(p)} familie van mij?`)}">${dIco(navIco("verwant"))}Hoe ben ik familie?</button>` : "") /* verwantschap: de haak beslist of de knop er komt */
    + (typeof pcOpenBtn === "function" ? pcOpenBtn(kw, p, COL) : "");
  let h = `<div class="dacts" role="toolbar" aria-label="Acties voor ${esc(p.roep || firstName(p))}"><div class="dacts-in"><span class="dacts-g"><button class="btn" data-go="${kw > 1 ? "stamboom-" + kw : "stamboom"}">${dIco(navIco("stamboom"))}Toon in de waaier</button><button class="btn" id="${I("dTree")}">${dIco(navIco("boom"))}Toon in de boom</button></span>${dExplore ? `<span class="dacts-g">${dExplore}</span>` : ""}${dCenter ? `<span class="dacts-g">${dCenter}</span>` : ""}</div></div>`;
  const tw = twinKws(kw);
  if (tw.length) h += `<p class="stnote implex"><b>${["", "", "Twee", "Drie", "Vier", "Vijf"][tw.length + 1] || tw.length + 1} keer in de stamboom.</b> Deze persoon staat ook als kw ${tw.length > 1 ? tw.slice(0, -1).join(", ") + " en " + tw[tw.length - 1] : tw[0]}, via de ${[...new Set(tw.map(t => LINES[lineOf(t)] && LINES[lineOf(t)].name).filter(Boolean))].map(esc).join("- en ")}-lijn. ${tw.some(t => halfOf(t) !== halfOf(kw)) ? esc(T.key === "s" ? TREES[p.side].parents : T.parents) + " hebben hier gemeenschappelijke voorouders." : "Beide lijnen lopen via " + esc((person(halfOf(kw)) || {}).roep || (person(halfOf(kw)) || {}).n || "") + "."} ${tw.map(t => `<button class="link" data-open="${t}">Bekijk als kw ${t}</button>`).join(" · ")} · <button class="link" data-go="${implexStory(p.side)}">Lees het verhaal</button></p>`;
  if (p.living) {
    h += `<p class="stnote">Van levende familieleden staan op deze site alleen de naam en de plaats in de stamboom.</p>`;
    /* kw 1: siblings, partner and children are in the small family tree below (mfHtml) */
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
  const mfh = mfHtml(kw); /* the family as a small tree; a group at kw 1 (s, or a couple as the focus) keeps the cards */
  if (mfh) h += mfh;
  else h += `<section class="dfam"><h5>Familie</h5><div class="family">${pbtn(kw * 2, "vader")}${pbtn(kw * 2 + 1, "moeder")}${kw > 1 ? pbtn(kw % 2 ? kw - 1 : kw + 1, kw % 2 ? "echtgenoot" : "echtgenote") : ""}${kw > 1 ? pbtn(kw >> 1, T.key === "s" && kw < 4 ? "kinderen" : isMale(kw >> 1) ? "zoon" : "dochter") : ""}</div>${kw === 1 ? (dk => dk.length ? `<h6>De kinderen</h6><ul>${dk.map(d => `<li><button type="button" class="link" data-desc="${esc(d.id)}">${esc(d.roep || d.n)}</button></li>`).join("")}</ul>` : "")(kidsOfPair(person(2), person(3))) : ""}${p.kids && p.kids.length ? `<h6>Kinderen</h6><ul>${p.kids.map(k => `<li>${kwLinks(k)}</li>`).join("")}</ul>` : ""}${p.sibs && p.sibs.length ? `<h6>Broers en zussen</h6><ul>${p.sibs.map(k => `<li>${kwLinks(k)}</li>`).join("")}</ul>` : ""}</section>`;
  /* "Vanaf hier:" the stamreeks and the book from this person, when those hooks offer a link */
  const vanaf = [typeof srLink === "function" ? srLink(kw) : "", typeof bookFromHereLink === "function" ? bookFromHereLink(kw) : ""].filter(x => typeof x === "string" && x.trim());
  const vanafHtml = vanaf.length ? `<div class="pn-vanaf"><span class="pn-vk">Vanaf hier:</span> ${vanaf.join(`<span class="pn-sep" aria-hidden="true"> · </span>`)}</div>` : "";
  if (kw > 3) h += kpathHtml(kw).replace(/<\/section>$/, vanafHtml + "</section>");
  else if (vanafHtml) h += `<section class="pn-vsec">${vanafHtml}</section>`;
  const ev = p.living ? [] : lifeEvents(p).filter(e => e.p);
  if (ev.length) h += `<section><h5>Levensloop</h5><ul class="restl">${ev.map(e => `<li><span class="y">${e.y ?? "?"}</span><span>${PLACES[e.p] && !PLACES[e.p].seat ? `<button class="link" data-go="${slug(e.p)}">${esc(placeName(e.p))}</button>` : `<b style="font-weight:600">${esc(placeName(e.p))}</b>`} · ${esc(e.t)} ${e.st && e.st !== "A" ? stTag(e.st) : ""}${typeof akteBij === "function" ? akteBij(kw, e, ev) : "" /* scan en tekst van de akte bij het feit */}</span></li>`).join("")}</ul>${ev.some(e => PLACES[e.p]) ? `<div class="pane lifemap" id="${I("dLifeMap")}"></div>${!p.living && (typeof personMapEvents !== "function" || personMapEvents(kw).length) ? `<p style="margin:10px 0 0"><button class="link" id="${I("dMap")}">${pnMapText(kw, p)}</button></p>` : ""}` : ""}</section>`;
  if (p.notes && p.notes.length) h += `<section class="notes"><h5>Weetjes</h5>${p.notes.map(n => { const o = noteObj(n); return `<p class="${o.k ? "k" : ""}">${geldw(esc(o.t))} ${kindTag(o.k)}</p>`; }).join("")}</section>`;
  const sts = storiesOf(kw);
  if (sts.length) h += `<section><h5>In de verhalen</h5><div class="links">${sts.map(s => `<button class="chip" data-go="verhaal-${s.id}">${esc(s.title)}</button>`).join("")}</div></section>`;
  const nts = NOTABLES.filter(N => N.verdict !== "geen verband" && N.kws.some(k => [kw, ...twinKws(kw)].includes(k)));
  if (nts.length) h += `<section><h5>Bekende verwanten</h5><div class="links">${nts.map(N => `<button class="chip" data-go="verwanten">${esc(N.n)} · ${esc(VERDICT[N.verdict][1].toLowerCase())}</button>`).join("")}</div></section>`;
  const md = mediaOf(kw);
  h += mdBlock(md); /* grouped like the sources */
  h += archGal(archBeeld);
  h += aktenBlok(kw);
  h += srcBlock(kw, p); /* the sources per kind, with the scans (see srcBlock) */
  if (!p.living) { /* hun wereld: plekken, grond, archiefbeelden en tijdbeelden (de lege vakken vullen zich na het openen) */
    const pk = []; lifeEvents(p).forEach(e => { if (!e.p || !PLACES[e.p]) return; if (tileImg(e.p) && !pk.some(x => x[2] === e.p)) pk.push([e.p, (e.y ? e.y + " · " : "") + e.t.split(/[;·]/)[0].trim(), e.p]); });
    if (pk.length) h += `<section><h5>Plaatsen uit dit leven</h5><div class="pstrip">${pk.slice(0, 4).map(x => placeTile(x[0], x[1], placeName(x[2]))).join("")}</div>${credits(pk.slice(0, 4).map(x => tileImg(x[0])))}</section>`;
    h += percelenHtml(kw) + `<section id="${I("dArch")}" hidden></section><section id="${I("dTijd")}" hidden></section><section id="${I("dWerk")}" hidden></section>`;
  }
  if (p.open && p.open.length) h += `<section><h5>Nog uit te zoeken</h5><ul>${p.open.map(n => `<li>${esc(n)}</li>`).join("")}</ul></section>`;
  if (!p.living) h += `<section><h5>Zoek verder</h5><div class="links">${searchLinks(p).map(l => `<a class="chip" href="${esc(l[1])}" target="_blank" rel="noopener">${esc(l[0])}</a>`).join("")}</div></section>`;
  const wjb = typeof wjmBlock === "function" ? wjmBlock(kw, p) : ""; /* "Weet je meer?" at the bottom */
  h += wjb;
  C.body.innerHTML = h;
  if (!opts.page && !COL) { drawer.hidden = false; scrim.hidden = false; }
  if (!COL) { C.body.scrollTop = 0; drawer.scrollTop = 0; } /* the drawer is the scroll area */
  pfOrder(p, C.body);
  if (COL) pcWatch(C); else { pnPlace(); pnWatchCrumbs(); pnWatchName(!!opts.page); }
  pnMoreBind(C.top, COL);
  mfBind($(".mf", C.body), COL);
  if (!COL) { const own = !!pnFocus, fb = pnFocus && $(`#dTop [data-pn="${pnFocus}"], #dHead [data-pn="${pnFocus}"], #dNav [data-pn="${pnFocus}"]`); pnFocus = null; /* after a step the same button keeps the focus */
    if (fb && !fb.disabled) fb.focus(); else if (!opts.fromHistory || own) D("dName").focus({ preventScroll: true }); } /* opened by the visitor: the focus on the name (a screen reader reads it); on load or with back/forward the focus stays where it is */
  if (!COL && D("dClose")) D("dClose").onclick = () => closeProfile();
  const hb = D("dHelpBtn"); if (hb) hb.onclick = COL ? () => { const d = D("dHelp"), o = d.hidden; d.hidden = !o; hb.setAttribute("aria-expanded", String(o)); } : () => profHelp($("#dHelp").hidden);
  const kt = $(".kp-tog", C.body); if (kt) kt.onclick = () => { $$(".kpath li[hidden]", C.body).forEach(li => { li.hidden = false; }); kt.closest("li").remove(); };
  D("dTree").onclick = () => { if (!COL) closeProfile(true); go(kw > 1 ? "boom-" + kw : "boom"); };
  /* delen: het systeemmenu van de telefoon als dat er is, anders de link kopiëren (de link is alleen het kw-nummer) */
  D("dShare").onclick = async () => {
    const url = location.href.split("#")[0] + "#" + T.prefix + "kw" + kw, ok = D("dShareOk");
    const meld = t => { ok.textContent = t; clearTimeout(ok._t); ok._t = setTimeout(() => { ok.textContent = ""; }, 2500); };
    if (navigator.share) { try { await navigator.share({ title: p.n, url }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    try { await navigator.clipboard.writeText(url); meld("Link gekopieerd"); }
    catch (e) { const t = document.createElement("textarea"); t.value = url; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select();
      let gelukt = false; try { gelukt = document.execCommand("copy"); } catch (x) {} t.remove(); meld(gelukt ? "Link gekopieerd" : "Kopiëren lukte niet: " + url); }
  };
  const lm = D("dLifeMap"); if (lm) lm.appendChild(lifeMap(p));
  const ks = [kw, ...twinKws(kw)], pe = ks.map(k => PACK_IDX.kw[imgKey(k)]).filter(Boolean), iks = ks.map(imgKey);
  if (!p.living && pe.length) { const shown = new Set(ks.flatMap(persImgs).map(i => i.id)); /* niet dubbel: wat al onder "Uit het archief" staat */
  archGallery(D("dArch"), [[...new Set(pe.flatMap(e => e[0]))]], im => !shown.has(im.id) && (im.kws || [im.key]).some(k => iks.includes(String(k))), alive,
    { head: `<h5>Uit de archieven</h5>`, cap: im => { const w = iks.map(k => (im.why || {})[k]).find(Boolean); return w || im.t; },
      sort: (a, b) => !!(b.why) - !!(a.why) }); }
  if (!p.living) {
    const la = lifeArch(p), np = new Set(la.map(a => a.key)).size, fn = esc(firstName(p));
    const wa = workArch(p, new Set(la.map(a => a.id)));
    if (wa && wa.list.length) archStrip(D("dWerk"), wa.list, alive, { n: 4,
      cap: (im, a) => `${a.d ? placeName(a.key) + ` (${Math.round(a.d)} km)` : placeName(a.key)}${a.ys ? ", " + yearLabel(a.ys) : ""}: ${archTitle(niceTitle(im), a.key)}`,
      head: `<h5>Het werk in ${zijnHaar(kw)} tijd</h5><p class="small" style="margin:0 0 10px">${esc((p.occ || "").split(";")[0])}: oude beelden van ${wa.w[2]} uit de jaren dat ${fn} werkte, uit de eigen woonplaatsen of de omgeving (tot 30 km).</p>` });
    archStrip(D("dTijd"), la, alive, { n: innerWidth < 560 ? 4 : 8, head: `<h5>${zijnHaar(kw, true)} plaatsen in ${zijnHaar(kw)} tijd</h5><p class="small" style="margin:0 0 10px">Oude foto's, prenten en kaarten van ${np === 1 ? esc(placeName(la[0].key)) : np + " plaatsen uit dit leven"}, uit de jaren dat ${fn} er was.</p>` });
  }
  const dm = D("dMap"); if (dm) dm.onclick = () => { if (!COL) closeProfile(true); go("kaart--persoon-" + kw); };
  if (COL) return;
  if (opts.page) { pfLayout(p, C.body); /* the page entry gets the trail once go() has written the address */
    queueMicrotask(() => { if (location.hash !== "#" + T.prefix + "profiel-" + kw) return; const s = history.state || {};
      try { history.replaceState(Object.assign({}, s, { pn: pnState(), onder: s.onder || PN.onder || "overzicht" }), ""); } catch (x) {} }); }
  else if (!opts.fromHistory) setHash(T.prefix + "kw" + kw, "push", { profiel: 1, onder: currentToken(), pn: pnState() });
  else if (!(history.state && history.state.pn)) try { history.replaceState(Object.assign({}, history.state, { pn: pnState() }), ""); } catch (x) {}
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
    const terug = history.state && history.state.pn ? history.state.pn.d || 0 : 1; /* the profiles seen in this drawer, on top of the page under it */
    if (history.state && history.state.profiel && terug > 0 && /^#(?:[as]-)?kw\d+$/.test(location.hash)) history.go(-terug); /* terug naar de pagina eronder */
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
  if (route.view === "kaart" && mapFocusPerson) return "kaart--persoon-" + mapFocusPerson;
  if (route.view === "verwant") return vwToken(); /* verwantschap */
  if (route.view === "stamreeks" || route.view === "poster") return route.view === "poster" ? psToken() : srToken(); /* stamreeks, poster */
  if (typeof MP_PAGES !== "undefined" && MP_PAGES[route.view] && mpState[route.view]) return mpToken(route.view); /* kalender, kaarten: with their choices and step */
  if (route.view === "maak") return mkToken(); /* laten maken */
  if (route.view === "beeld-archief") return arvToken(); /* archiefverkenner */
  if (route.view === "boek") return PB ? bkToken() : "boek"; /* het boek */
  if (route.view === "profiel" && route.sub) return "profiel-" + route.sub; /* the profile as a full page */
  if (route.view === "profielen" && route.sub) return "profielen-" + route.sub; /* several profiles side by side */
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
  all.forEach(p => INDEX.push({ type: "Personen", roep: p.roep, title: p.n + (p.roep && p.roep !== p.n ? ` (${p.roep})` : ""), sub: [`kw ${p.kw}`, zoekRel(p.kw), lifeYears(p)].filter(Boolean).join(" · "), ava: avatar(p.kw, "sava"), text: [p.n, p.roep, p.alt, placeName(p.bp), placeName(p.dp), p.occ].join(" "), act: () => openProfile(p.kw) }));
  /* family focus: search covers the whole family; who is outside the branch is labelled "andere tak" and opens in the whole family */
  if (FK && T.key !== "s" && TREES.s) { const inBranch = p => T.fromS ? T.fromS(p.kw) !== null : p.side === T.key;
    TREES.s.PEOPLE.filter(p => !p.alias && !p.virtual && !inBranch(p)).forEach(p => INDEX.push({ type: "Personen · andere tak", roep: p.roep, title: p.n + (p.roep && p.roep !== p.n ? ` (${p.roep})` : ""),
      sub: p.living ? "levend" : [yr(p.b), yr(p.d)].map(y => y || "?").join(" – "), text: [p.n, p.roep, p.alt, p.living ? "" : placeName(p.bp), p.living ? "" : placeName(p.dp)].join(" "),
      act: () => { setTree("s"); go(FK_FILTERED.has(route.view) ? route.view : "overzicht"); openProfile(p.kw); } }));
  }
  /* ook de andere boom: wie daar staat, opent in die boom */
  else Object.values(TREES).filter(t => t !== T && t.key !== "s" && T.key !== "s").forEach(t => {
    INDEX.push({ type: "Pagina's", title: (() => { const y = FK_KOP && typeof voorWieOpties === "function" ? voorWieOpties().heel.find(z => z.tree === t.key) : null; return "Familie " + (y ? y.label : t.brand); })(), sub: t.brand, text: "stamboom kwartierstaat " + t.rootFull + " " + t.brand, act: () => { setTree(t.key); go("overzicht"); } });
    t.PEOPLE.filter(p => !p.alias).forEach(p => INDEX.push({ type: "Personen · " + t.brand, roep: p.roep, title: p.n + (p.roep && p.roep !== p.n ? ` (${p.roep})` : ""), sub: [`kw ${p.kw}`, zoekRel(p.kw), p.living ? "levend" : [yr(p.b), yr(p.d)].map(y => y || "?").join(" – ")].filter(Boolean).join(" · "), text: [p.n, p.roep, p.alt, p.living ? "" : placeName(p.bp), p.living ? "" : placeName(p.dp)].join(" "), act: () => { setTree(t.key); go("overzicht", { keepHash: true }); openProfile(p.kw); } }));
  });
  [["Namenregister", "Alle achternamen en patroniemen op alfabet", "namen achternamen register patroniemen alfabet"], ["Kwartierstaat als lijst", "Genummerd, om te lezen of af te drukken", "kwartierstaat lijst afdrukken printen pdf nummers"]].forEach(([t, sub, x], i) => INDEX.push({ type: "Pagina's", title: t, sub, text: t + " " + x, act: () => go(i ? "lijst" : "namen") }));
  INDEX.push({ type: "Pagina's", title: "Het familieboek", sub: "De stamboom als boek om te laten drukken, of als pdf", text: "boek stamboomboek pdf afdrukken printen drukken drukker drukkerij fotoboek boekje bundel uitgave blurb saal peecho", act: () => go("boek") }); /* het boek */
  /* alle pagina's uit het menu (Waaier, Boom, Kaart, Tijdlijn …), met een paar gewone woorden erbij; dubbele titels niet */
  const ZOEK_OOK = { stamboom: "waaier cirkel ringen generaties", boom: "boom takken stamboom", families: "families lijnen", lijst: "kwartierstaat lijst nummers", kaart: "kaart plaatsen dorpen landkaart",
    tijdlijn: "tijdlijn jaren levens", tijd: "geschiedenis gebeurtenissen", cijfers: "getallen statistiek leeftijd", maak: "maken laten maken bestellen cadeau", poster: "poster afdrukken ophangen", personen: "personen mensen voorouders" };
  if (typeof menuGroups === "function") menuGroups().forEach(([g, its]) => its.forEach(([l, v, u]) => {
    if (INDEX.some(i => i.type === "Pagina's" && i.title === (l === "Overzicht" ? g : l))) return;
    INDEX.push({ type: "Pagina's", title: l === "Overzicht" ? g : l, sub: u || g, text: [l, u, g, ZOEK_OOK[v] || ""].join(" "), act: () => go(v) }); }));
  INDEX.push({ type: "Pagina's", title: "Hoe ben ik familie?", sub: "Verwantschap uitrekenen: neef, nicht, oudoom, graad van bloedverwantschap", text: "verwantschap verwant familie hoe ben ik familie neef nicht achterneef achternicht oom tante oudoom graad bloedverwantschap aangetrouwd", act: () => go("verwant") }); /* verwantschap */
  LINE_KEYS.forEach(l => INDEX.push({ type: "Families", title: "Familie " + LINES[l].name, sub: LINES[l].sub, text: LINES[l].name + " " + LINES[l].sub + " " + LINES[l].region, act: () => go("lijn-" + l) }));
  Object.keys(PLACES).filter(k => !PLACES[k].seat).forEach(k => INDEX.push({ type: "Plaatsen", title: placeName(k), sub: `${PLACES[k].gem} · ${PLACES[k].prov}`, text: k + " " + placeName(k) + " " + PLACES[k].gem, act: () => go(slug(k)) }));
  STORIES.forEach(s => INDEX.push({ type: "Verhalen", title: s.title, sub: s.lede, text: s.title + " " + s.lede + " " + s.parts.map(x => x.h + " " + x.p.map(q => noteObj(q).t).join(" ")).join(" "), act: () => go("verhaal-" + s.id) }));
  IMGS.filter(i => i.vh).forEach(im => im.vh.map(v => STORIES.find(x => x.id === v[0])).filter(Boolean).forEach(st => INDEX.push({ type: "Beeld", title: im.t, sub: "Bij het verhaal " + st.title, text: [im.t, im.desc, st.title].join(" "), act: () => go("verhaal-" + st.id) })));
  MEDIA.forEach(m => INDEX.push({ type: m.kind === "achtergrond" ? "Verhalen" : "Beeld", title: m.t, sub: MEDIA_KINDS[m.kind].label + (m.y ? " · " + m.y : ""), text: m.t + " " + (m.d || "") + " " + placeName(m.p), act: () => goMedia(m.id) }));
  NOTABLES.forEach(N => INDEX.push({ type: "Bekende verwanten", title: N.n, sub: VERDICT[N.verdict][1] + " · " + N.y, text: [N.n, N.alt, N.role, N.rel].join(" "), act: () => { go("verwanten"); setTimeout(() => { const t = document.getElementById("n-" + N.id); if (t) t.scrollIntoView({ block: "start" }); }, 30); } }));
  if (typeof opIndex === "function") opIndex(); /* opvallende feiten */
  INDEX.push({ type: "Pagina's", title: "Hun tijd", sub: "De grote geschiedenis om de families heen", text: "hun tijd achtergrond geschiedenis gebeurtenissen oorlog cholera watersnood crisis naamsaanneming emigratie", act: () => go("tijd") });
  INDEX.push({ type: "Pagina's", title: "Beroepen", sub: "Wat ze deden voor de kost", text: "beroepen beroep werk boer arbeider knecht meid koopman schipper", act: () => go("beroepen") }, { type: "Pagina's", title: "Hun grond in 1832 (kadaster)", sub: "Hun land op de kadasterkaart van 1832", text: "grond kadaster 1832 percelen land eigenaar minuutplan", act: () => go("grond") }, { type: "Pagina's", title: "Onze achternamen", sub: "Waar de familienamen vandaan komen", text: "achternamen achternaam familienaam herkomst betekenis naam " + (typeof ACHTERNAMEN !== "undefined" ? ACHTERNAMEN.map(x => x.naam).join(" ") : ""), act: () => go("achternamen") }, ...(STAMREEKS_KNOP ? [{ type: "Pagina's", title: "Stamreeks", sub: "Van vader op vader terug, of langs de achternaam", text: "stamreeks naamreeks vaderlijn vader op vader achternaam", act: () => go("stamreeks") }, { type: "Pagina's", title: "Poster", sub: "De stamboom op A3 of A2, om op te hangen", text: "poster afdrukken ophangen waaier a3 a2 cadeau", act: () => go("poster") }] : []), { type: "Pagina's", title: "In de krant", sub: "Berichten over de familie in oude kranten", text: "krant kranten delpher courant dagblad advertentie familiebericht", act: () => go("kranten") });
  GLOSSARY.forEach(g => INDEX.push({ type: "Begrippen", title: g[0], sub: g[1], text: g[0] + " " + g[1], act: () => toonBegrip(g[0]) }));
  INDEX.forEach(i => { i.nt = norm(i.text); i.ntitle = norm(i.title); i.nroep = i.roep ? norm(i.roep) : ""; });
}
let sFrom = null; /* wie de focus had vóór het zoekvenster; daar gaat hij na sluiten naartoe terug */
function openSearch() { sFrom = document.activeElement; sdlg.hidden = false; sInput.value = ""; runSearch(); setTimeout(() => sInput.focus(), 10); }
document.addEventListener("click", e => { if (e.target.closest("#sClose")) closeSearch(); });
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
const ZOEK_SOORT = { Families: 3, Personen: 2, Plaatsen: 1.5, "Pagina's": 1.5, "Bekende verwanten": 1, Verhalen: 1, Begrippen: 0.5, Opvallend: 0.5, Beeld: 0 };
const ZOEK_KLEIN = /^(de|van|der|den|het|ten|ter|te|in|op|en|t)$/;
function runSearch() {
  const q = norm(sInput.value).trim(), toks = q.split(/\s+/).filter(Boolean);
  if (toks.length && !archTekstOk) archTekst().then(() => { if (sInput.value.trim()) runSearch(); }); /* archiefbeelden komen erbij zodra hun tekst er is */
  let res;
  if (!toks.length) res = [...INDEX.filter(i => i.type === "Families"), ...INDEX.filter(i => i.type === "Verhalen")];
  else { /* points: a particle ("de", "van") almost none, a whole word more than part of one, the whole query in the title extra, and the kind (families and people first, images last); duplicates go */
    const phrase = toks.length > 1 ? toks.join(" ") : "", seen = new Set(), woord = t => new RegExp("(^|[^a-z0-9])" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^a-z0-9])");
    res = INDEX.map(i => { if (!toks.every(t => i.nt.includes(t))) return null; let s = ZOEK_SOORT[i.type] ?? (i.type.startsWith("Personen") ? 1 : 0);
      /* a whole word beats the start of a longer word ("Herman" finds Herman before Hermanus); the exact call name counts extra */
      toks.forEach(t => { const w = woord(t).test(i.ntitle); if (ZOEK_KLEIN.test(t)) s += w ? 1 : 0; else if (w && i.ntitle.startsWith(t)) s += 5; else if (w) s += 4; else if (i.ntitle.startsWith(t)) s += 3; else if (i.ntitle.includes(t)) s += 2;
        if (i.nroep && i.nroep === t) s += 3; });
      if (phrase && i.ntitle.includes(phrase)) s += 3; return [s, i]; })
      .filter(Boolean).sort((a, b) => b[0] - a[0]).map(x => x[1]).filter(i => { const k = i.type + "|" + i.ntitle; return !seen.has(k) && seen.add(k); }).slice(0, 40); }
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
function drawFan(host, { maxGen = 9, labelGen = 7, interactive = true, highlightLine = null, root = 1, more = false, labelScale = 1, minPx = 0, keep = null } = {}) {
  if (host && interactive && host.contains(document.activeElement)) host._fanHerstel = true; /* stond de focus in de waaier, dan komt hij na het hertekenen terug */
  const R = [0, 58, 126, 192, 268, 344, 412, 460, 498, 530];
  if (root > 1) { let depth = 1; for (let gn = 2; gn <= maxGen; gn++) { const n = 2 ** (gn - 1); for (let i = 0; i < n; i++) if (person(fanKw(root * n + i))) { depth = gn; break; } } maxGen = Math.min(maxGen, Math.max(3, depth + 1)); } /* één lege ring: daar is nog niets gevonden */
  const V = R[maxGen] + (more ? 40 : 10), rp = person(fanKw(root)), rootAlias = fanKw(root) !== root || !!ALIAS_OF[root]; /* de volledige waaier (more) krijgt marge rondom de boogjes */
  const zacht = labelScale > 1 || more; /* overzicht en volledige waaier: zichtbare vakgrenzen bij levenden, ook in donker */
  const scale = host && host.clientWidth ? host.clientWidth / (2 * V) : 1; /* hoe groot een eenheid op het scherm wordt */
  const leesbaar = f => !minPx || f * scale >= 9; /* bijtekst (achternaam, "met …", "vaders kant") alleen als die op het scherm minstens 9 px wordt */
  const svg = el("svg", { viewBox: `${-V} ${-V} ${2 * V} ${2 * V}`, role: "group", "aria-label": "Waaier met de voorouders van " + (root > 1 && rp ? rp.n : T.root) + " per generatie" });
  const col = fanBranchColors(root).color; /* kleur per tak vanaf het midden (bij root 1: de familiekleur) */
  const g = el("g", {}, svg), lg = el("g", { "pointer-events": "none" }, svg); /* namen in een eigen laag boven alle vakken */
  /* names that follow the ring (curved text along the middle of the segment): in the lower half mirrored, so everything reads
     left to right. lines = [[text, size, attrs]], the first line on the outside at the top and on the inside at the bottom */
  const uid = (drawFan.uid = (drawFan.uid || 0) + 1), defs = el("defs", {}, svg);
  const arcLabel = (lab, kw, a0, a1, r0, r1, lines) => {
    const an = ((((a0 + a1) / 2) % 360) + 360) % 360, low = an > 0 && an < 180, rm = (r0 + r1) / 2, pad = Math.min(4, (a1 - a0) * 0.06);
    const [h1, h2] = lines.map(l => l[1] * 0.72), gap = lines.length > 1 ? lines[1][1] * 0.5 : 0; /* on a curve two lines need air */
    const off = lines.length > 1 ? (h1 - h2) / 2 : -h1 / 2; /* centre the block of one or two lines on the middle of the ring */
    lines.forEach(([str, fs0, at], i) => {
      /* baseline radius: on top the glyphs stand outward from it, at the bottom (reversed path) inward */
      const rb = !low ? (i === 0 ? rm + gap / 2 + off : rm - gap / 2 - h2 + off) : (i === 0 ? rm - gap / 2 + off : rm + gap / 2 + h2 + off);
      /* a long name first gets smaller (to 0.72), then shorter; never below the minimum size on paper or screen (minPx) */
      const span = (a1 - a0 - 2 * pad) * Math.PI / 180 * rb, fmin = Math.max(fs0 * 0.72, minPx && scale ? minPx / scale : 0);
      const f = Math.max(fmin, Math.min(fs0, span / (Math.max(str.length, 1) * 0.56))), t = str.length * f * 0.56 > span ? trunc(str, Math.floor(span / (f * 0.56))) : str;
      const [x1, y1] = pt(rb, low ? a1 - pad : a0 + pad), [x2, y2] = pt(rb, low ? a0 + pad : a1 - pad), id = `fa${uid}-${kw}-${i}`;
      el("path", { id, d: `M${x1.toFixed(1)} ${y1.toFixed(1)}A${rb.toFixed(1)} ${rb.toFixed(1)} 0 0 ${low ? 0 : 1} ${x2.toFixed(1)} ${y2.toFixed(1)}`, fill: "none" }, defs);
      const te = el("text", Object.assign({ "font-size": f.toFixed(2), fill: "var(--ink)" }, at), lab); /* the ink colour, as txt() gives it */
      el("textPath", { href: "#" + id, startOffset: "50%", "text-anchor": "middle" }, te).textContent = t;
    });
  };
  const pt = (r, a) => { const t = a * Math.PI / 180; return [r * Math.cos(t), r * Math.sin(t)]; };
  for (let gn = 2; gn <= maxGen; gn++) {
    const n = 2 ** (gn - 1), r0 = R[gn - 1], r1 = R[gn];
    for (let i = 0; i < n; i++) {
      const kw = root * n + i, ck = fanKw(kw), a0 = 90 + i * 360 / n, a1 = a0 + 360 / n;
      const [x1, y1] = pt(r1, a0), [x2, y2] = pt(r1, a1), [x3, y3] = pt(r0, a1), [x4, y4] = pt(r0, a0);
      const d = `M${x1} ${y1}A${r1} ${r1} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r0} ${r0} 0 0 0 ${x4} ${y4}Z`;
      const p0 = person(ck), p = keep && !keep.has(ck) && !(p0 && p0.living) ? null : p0, dim = highlightLine && lineOf(kw) !== highlightLine && gen(kw) >= 4;
      const twins = twinKws(ck), twin = !rootAlias && (twins.length || ck !== kw); /* staat het midden zelf in een dubbele tak, dan is alles dubbel: geen goud */
      let attrs;
      if (!p) attrs = { d, fill: "none", stroke: "var(--rule)", "stroke-dasharray": "3 3", "stroke-width": 1, "stroke-opacity": more && gn >= 7 ? 0.5 : null }; /* lege buitenste vakken lichter */
      else if (p.living) attrs = zacht /* zichtbare vakgrenzen (ook in donker) en vanaf generatie 3 de familiekleur zacht */
        ? { d, fill: gn >= 3 ? col(kw) : "var(--sunk)", "fill-opacity": gn >= 3 ? 0.14 : 1, stroke: "var(--fan-gap)", "stroke-width": 2.5 }
        : { d, fill: "var(--sunk)", stroke: "var(--surface)", "stroke-width": 2 };
      else attrs = { d, fill: col(kw), "fill-opacity": dim ? 0.06 : p.st === "D" ? 0.05 : p.st === "C" ? 0.12 : p.st === "B" ? 0.2 : 0.3, stroke: p.st === "C" || p.st === "D" ? col(kw) : "var(--surface)", "stroke-width": p.st === "C" || p.st === "D" ? 1 : 2, "stroke-dasharray": p.st === "D" ? "1 3" : p.st === "C" ? "3 2" : null };
      if (p && twin) Object.assign(attrs, { stroke: "var(--gold)", "stroke-width": labelScale > 1 || gn >= 7 ? 1.5 : 2.5, "stroke-dasharray": null }); /* dunner waar de vakken klein zijn (overzicht, buitenste ringen) */
      const path = el("path", attrs, g);
      if (p && interactive) { path.setAttribute("class", "seg-path"); path.dataset.kw = kw; clickable(path, () => openProfile(ck), p.n); bindTip(path, tipFor(p) + (twins.length ? `<br><span style="opacity:.8">staat ook als kw ${twins.join(", ")}</span>` : "") + (ck !== kw ? `<br><span style="opacity:.8">op deze plek kw ${kw}</span>` : "")); }
      if (p && more && interactive && gn === 9 && (person(fanKw(2 * kw)) || person(fanKw(2 * kw + 1)))) {
        const rr = R[9] + 5, e = Math.min(1.2, 90 / n), [m1, n1] = pt(rr, a0 + e), [m2, n2] = pt(rr, a1 - e);
        const mk = el("path", { d: `M${m1} ${n1}A${rr} ${rr} 0 0 1 ${m2} ${n2}`, class: "fan-more", stroke: col(kw) }, g);
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
          } else if (gn === 3) { /* the grandparents follow the ring, like the rings further out */
            arcLabel(lab, kw, a0, a1, r0, r1, labelScale === 1 ? [[l1, fs, { "font-weight": 600 }], [trunc(l2, 18), fs - 3, { fill: "var(--muted)" }]] : [[l1, fs, { "font-weight": 600 }]]);
          } else {
          txt(lab, cx, cy - 2, l1, { "text-anchor": "middle", "font-size": gn === 2 ? Math.min(fs, (R[2] - R[1] - 18) / (l1.length * 0.56)) : fs, "font-weight": 600 }); /* ring 2 is smal: een lange naam wordt kleiner */
          const f2 = gn === 2 ? Math.min(fs - 3, (R[2] - R[1] - 18) / (trunc(l2, 14).length * 0.56)) : fs - 3;
          if (labelScale === 1 && (!minPx || (gn !== 2 && f2 * scale >= minPx))) txt(lab, cx, cy + fs, trunc(l2, 14), { "text-anchor": "middle", "font-size": f2, fill: "var(--muted)" }); /* on paper (minPx) the parents by first name only: their surnames do not fit the narrow ring at 6 pt */
          } /* op het overzicht alleen voornamen (grotere letters, anders botst de achternaam met het midden) */
        } else if (labelScale > 1 && gn === 4) { /* overzicht: generatie 4 langs de boog, daar is ruimte voor de hele voornaam */
          arcLabel(lab, kw, a0, a1, r0, r1, [[l1, fanFs(gn) * labelScale, { "font-weight": 600 }]]);
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
  const ml = typeof fkMiddenLabel === "function" ? fkMiddenLabel(root) : null; /* the family choice: the children it is for, or "Kees +5" */
  /* the centre: the lines that are really drawn, as one block around the middle (a line too small to read is left out, and the
     block is centred without it); each line on its own centre (dominant-baseline central) */
  /* never an empty centre: the full names on more lines → one smaller line "Marit, Tijmen, Jorn" → the initials "M · T · J" →
     "3 kinderen"; the first that is readable (on a screen fan ≥ 9 px, else the fan's minimum); one name may get smaller to the limit */
  const rows = [], thr = minPx >= 8 ? 9 : minPx, ok = f => !thr || f * scale >= thr;
  const big = (ls, base, wie = "kinderen") => {
    const fit = (xs, b0) => Math.min(...xs.map(x => Math.min(b0 * labelScale, 104 / (x.length * 0.56))));
    const names = ls.flatMap(x => String(x).split(/,\s*|\s+en\s+/)).map(x => x.replace(/^en\s+/, "").trim()).filter(Boolean); /* per line: "Marit" / "Tijmen" / "Jorn", or "Marit, Tijmen" / "en Jorn" */
    const tries = [[ls, fit(ls, base)]];
    if (names.length > 1) tries.push([[names.join(", ")], fit([names.join(", ")], base)], [[names.map(x => x[0]).join(" \u00b7 ")], fit([names.map(x => x[0]).join(" \u00b7 ")], base)],
      [[`${names.length} ${wie}`], fit([`${names.length} ${wie}`], base)]);
    else if (names[0]) tries.push([[names[0][0] + "."], fit([names[0][0] + "."], base)]); /* one name that does not fit: its initial */
    const t = tries.find(([, f]) => ok(f)) || tries[tries.length - 1];
    if (t) t[0].forEach(x => rows.push({ s: x, fs: ok(t[1]) ? t[1] : thr / scale, w: 600 })); /* the last step at the limit itself */
  };
  if (ml && ml.rings) rows.push({ rings: true, fs: 15 }); /* drawn rings, not the ⚭ sign: that is in no print font */
  if (ml) big(ml, ml.length === 1 ? 17 : 13.5);
  else if (root > 1 && rp) { /* een voorouder in het midden: voornaam, achternaam en (bij overledenen) de jaren */
    [firstName(rp), trunc(shortSur(splitName(rp.n).sur), 16)].filter(Boolean).forEach(x => rows.push({ s: x, fs: Math.min(13.5, 104 / (x.length * 0.56)), w: 600 }));
    if (!rp.living) rows.push({ s: lifeYears(rp), fs: 10.5, w: 400 });
  } else if (T.rootLines) big(T.rootLines, 13.5); /* te klein op het scherm: dan alleen de gekleurde stip */
  else big([T.root], 17, "personen");
  const sub = ml ? ml.sub || "" : root === 1 && T.sibs && T.sibs.length ? "met " + T.sibs.slice(0, -1).join(", ") + (T.sibs.length > 1 ? " en " : "") + T.sibs[T.sibs.length - 1] : "";
  const subFs = Math.min(9.5, 104 / (sub.length * 0.55));
  if (sub && rows.length && leesbaar(subFs)) rows.push({ s: sub, fs: subFs, w: 400, gap: 2 });
  const lh = r => r.fs * 1.18 + (r.gap || 0), H = rows.reduce((t, r) => t + lh(r), 0); let y = -H / 2;
  rows.forEach(r => { if (r.rings) { const q = R[1] * 0.13, cy = y + r.fs * 0.59; [-0.62, 0.62].forEach(dx => el("circle", { cx: dx * q * 1.3, cy, r: q, fill: "none", stroke: "var(--accent-ink)", "stroke-width": q * 0.16 }, ct)); y += lh(r); return; }
    txt(ct, 0, y + (r.gap || 0) + r.fs * 0.59, r.s, { "text-anchor": "middle", "dominant-baseline": "central", "font-size": r.fs, "font-weight": r.w, fill: "var(--accent-ink)" }); y += lh(r); });
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
  if (interactive) fanToetsen(host, svg, root);
}
/* de waaier met het toetsenbord: één Tab-stop; pijl links en rechts langs een ring, omhoog naar de ouders, omlaag naar het kind,
   Home naar de ouders van het midden; Enter of spatie opent het profiel. De laatst gekozen persoon houdt de focus na een herteken. */
function fanToetsen(host, svg, root) {
  const cells = [...svg.querySelectorAll(".seg-path[data-kw]")]; if (!cells.length) return;
  const by = new Map(cells.map(c => [+c.dataset.kw, c]));
  cells.forEach(c => c.setAttribute("tabindex", "-1")); svg.querySelectorAll(".fan-more").forEach(c => c.setAttribute("tabindex", "-1"));
  const start = by.get(host._fanFocus) || by.get(root * 2) || by.get(root * 2 + 1) || cells[0];
  start.setAttribute("tabindex", "0");
  svg.setAttribute("aria-label", (svg.getAttribute("aria-label") || "Waaier") + ". Pijltoetsen: links en rechts langs een ring, omhoog naar de ouders, omlaag naar het kind; Enter opent het profiel.");
  const zet = c => { cells.forEach(x => x.setAttribute("tabindex", "-1")); c.setAttribute("tabindex", "0"); c.focus(); host._fanFocus = +c.dataset.kw; };
  svg.addEventListener("keydown", e => {
    const c = e.target.closest(".seg-path[data-kw]"); if (!c) return;
    const kw = +c.dataset.kw, d = gen(kw) - gen(root), lo = root * 2 ** d, hi = lo + 2 ** d - 1;
    const ring = s => { for (let k = kw + s, i = 0; i <= hi - lo; i++, k += s) { if (k > hi) k = lo; if (k < lo) k = hi; if (by.has(k)) return by.get(k); } return null; };
    let t;
    if (e.key === "ArrowRight") t = ring(1); else if (e.key === "ArrowLeft") t = ring(-1);
    else if (e.key === "ArrowUp") t = by.get(kw * 2) || by.get(kw * 2 + 1);
    else if (e.key === "ArrowDown") t = by.get(kw >> 1);
    else if (e.key === "Home") t = by.get(root * 2) || by.get(root * 2 + 1);
    else return;
    e.preventDefault(); if (t) zet(t);
  });
  svg.addEventListener("focusin", e => { const c = e.target.closest(".seg-path[data-kw]"); if (c) host._fanFocus = +c.dataset.kw; });
  if (host._fanHerstel) { host._fanHerstel = false; start.focus({ preventScroll: true }); }
}
/* ---------- waaier op het overzicht ---------- */
/* Op het overzicht is de waaier veel kleiner dan op de stamboompagina (op 1366 px ±490 px tegen ±850 px). Daarom grotere
   letters en alleen de naamlagen die op het scherm minstens 8 px worden; daaronder een leeswijzer, twee knoppen en de
   familiekleuren. De vakken zijn met de muis klikbaar maar niet met Tab (geen honderden tabstops op de voorpagina). */
let heroFanW = 0, heroFanRO = null;
/* the middle of the hero fan: the root, or with a family choice (FK1) the person or the couple's child */
const heroRoot = () => { const f = typeof fkActief === "function" && FK_KOP && !FK ? fkActief() : null; if (!f) return 1; const k = f.paar ? f.start >> 1 : f.start; return k >= 1 && person(k) ? k : 1; };
function heroFan() {
  const host = $("#heroFan"), note = $("#heroFanNote"); if (!host) return;
  const draw = () => {
    heroFanW = host.clientWidth;
    drawFan(host, { maxGen: 9, labelGen: 4, labelScale: 1.6, minPx: 8, root: heroRoot() });
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
      <div class="fan-acts"><button type="button" class="btn" id="heroFanOpen">${navIco("stamboom")}Hele waaier</button><a class="btn" href="#${T.prefix}boom" data-go="boom">${navIco("boom")}Boom</a></div>`;
    $("#heroFanOpen").onclick = () => { fanRoot = heroRoot(); go(typeof fkTok === "function" ? fkTok("stamboom") : "stamboom"); };
    /* aanwijzen of focus op een familie: die lijn licht op in de waaier, de rest dimt (met een muis, of met het toetsenbord) */
    const licht = l => { drawFan(host, { maxGen: 9, labelGen: 4, labelScale: 1.6, minPx: 8, highlightLine: l, root: heroRoot() }); $$("[tabindex]", host).forEach(n => n.setAttribute("tabindex", "-1")); };
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
/* who is in the middle of the fan at kw 1, in words: { naam (short, for "de vader van …"), label (the chooser: "Kees +5"), zin (the
   lede) }. Phase 2 with a couple as focus: their child in the line and the brothers and sisters, or the chosen children; else the
   root of the tree. Call names, never baptismal names. */
function fanMidden() {
  const wortel = T.key === "s" ? T.rootFull || T.root : T.root;
  if (!(FK && T.focus && T.focus.pair)) return { naam: wortel, label: wortel, zin: `${T.rootFull || T.root} in het midden` };
  const roep = kw => { const p = person(kw); return p ? firstName(p) : ""; }, ouders = [roep(2), roep(3)].filter(Boolean).join(" en ");
  const and = xs => xs.length > 1 ? xs.slice(0, -1).join(", ") + " en " + xs[xs.length - 1] : xs[0] || "";
  const ps = T.focus.persons || [], kids = [...new Set((T.kids || []).flatMap(k => String(k).split(/,\s*|\s+en\s+/)).map(k => k.trim().split(/\s+/)[0]).filter(Boolean))];
  if (ps.length) return { naam: and(ps), label: and(ps), zin: `${and(ps)} in het midden (${ps.length === 1 ? "een kind" : "kinderen"} van ${ouders})` };
  if (!kids.length) return { naam: ouders, label: ouders, zin: `${ouders} in het midden` };
  const n = kids.length - 1, zijn = ((T.focus.kw >> 1) % 2 === 0) ? "zijn" : "haar";
  /* up to three children by name ("Kees en Jan"); more: the first and "zijn 4 broers en zussen" */
  const wie = kids.length <= 3 ? and(kids) : `${kids[0]} en ${zijn} ${n} broers en zussen`;
  return { naam: kids[0], label: kids[0] + (n ? " +" + n : ""), zin: `${wie} in het midden (${kids.length > 1 ? "de kinderen" : "het kind"} van ${ouders})` };
}
function fanCrumbs() {
  let box = $("#fanCrumbs");
  if (!box) { box = document.createElement("div"); box.id = "fanCrumbs"; box.className = "fan-crumbs"; $("#fanPane").prepend(box); }
  box.hidden = fanRoot === 1;
  if (fanRoot === 1) { box.innerHTML = ""; return; }
  const chain = []; for (let k = fanRoot; k >= 1; k = Math.floor(k / 2)) chain.unshift(k);
  const name = k => k === 1 ? fanMidden().naam : firstName(person(fanKw(k)));
  const items = chain.length > 6 ? [chain[0], null, ...chain.slice(-4)] : chain;
  box.innerHTML = `<span class="lbl">Midden van de waaier:</span> ${items.map(k => k === null ? `<span class="sep" aria-hidden="true">…</span>`
    : k === fanRoot ? `<b>${esc(name(k))}</b>` : `<button class="link" data-fanroot="${k}">${esc(name(k))}</button><span class="sep" aria-hidden="true">›</span>`).join(" ")}
    ${fanKw(fanRoot) !== fanRoot || ALIAS_OF[fanRoot] ? `<span class="small">· ${esc(firstName(person(fanKw(fanRoot))))} staat ook als kw ${fanKw(fanRoot) !== fanRoot ? fanKw(fanRoot) : ALIAS_OF[fanRoot]} in de stamboom (<button class="link" data-go="${implexStory()}">kwartierverlies</button>)</span>` : ""}
    <button class="chip" data-fanroot="1">Terug naar ${esc(fanMidden().naam)}</button>`;
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
    + kol("Midden", [1], () => lnk(1, esc(fanMidden().label)))
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
  const h1 = $("#v-stamboom h1"); if (h1) h1.textContent = pageLabel("stamboom", "Waaier");
  wisselLink($("#v-stamboom"), "boom", fanRoot);
  const M = fanMidden();
  if (fanRoot === 1) { sl.textContent = `${M.zin}; elke ring is een generatie verder terug.`; return; }
  const p = person(fanKw(fanRoot));
  const wie = gen(fanRoot) === 2 ? (isMale(fanRoot) ? "de vader" : "de moeder") : "een voorouder";
  sl.textContent = `De voorouders van ${p.n}, ${wie} van ${FK && T.focus && T.focus.pair ? M.naam : T.rootFull || T.root} (kw ${fanRoot}).`;
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
const treeNaam = p => p.kw === 1 && FK && T.focus && T.focus.pair ? fanMidden().label : p.kw === 1 && T.key === "s" ? T.root : (firstName(p) + " " + shortSur(splitName(p.n).sur)).trim() || p.n; /* roepnaam + achternaam; de volledige naam als tooltip */
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
  host.insertAdjacentHTML("afterbegin", `<p class="tree-druk">${esc(treeTitle())} · vanaf ${esc(treeRoot === 1 ? T.root : p ? p.n : "kw " + treeRoot)} · ${G} generaties</p>`);
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
    return `<div class="tl-r">${tg}<button class="tl-k${twin ? " twin" : ""}${st}" data-open="${fanKw(kw)}" style="--c:${lineColor(kw)}"${twin ? ` title="Staat ook als kw ${twin.join(", ")}"` : ""}>${rel ? `<small>${esc(rel)}${treeStTag(p) ? " · " + treeStTag(p) : ""}</small>` : ""}<b>${esc(kw === 1 && FK && T.focus && T.focus.pair ? fanMidden().label : p.n)}</b>${p.living ? "" : `<span>${esc([lifeYears(p), placeName(p.bp)].filter(Boolean).join(" · "))}</span>`}</button>${verder}</div>`;
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
/* a side of the family as a label: the family names of that side ("De Groot · Boersma"), with its family colours, as in the family
   choice; never a person's name. famOf(k): the surnames of the parents of kw k in the tree on screen; branchName(side): the same for
   Harrie's (h) or Alies' (a) side, in every tree. sideTag only where the page shows both sides (the joint tree). */
const famOf = k => { const sur = q => { const x = q ? splitName(q.n).sur : ""; return x ? x[0].toUpperCase() + x.slice(1) : ""; };
  return [...new Set([sur(person(2 * k)), sur(person(2 * k + 1))].filter(Boolean))].join(" · "); };
/* the tree on screen as a title: "Stamboom De Groot · Boersma" (its families); a chosen person or couple keeps their names */
const treeTitle = () => T.focus ? "Stamboom van " + (typeof focusWho === "function" ? focusWho() : T.rootFull || T.root) : "Stamboom " + (T.brand || T.rootFull || T.root);
/* the name of a page = the label of its menu item (MENU): the menu, the tabs, the h1 and the document title never drift apart */
const pageLabel = (view, fb) => { try { for (const [, its] of MENU) for (const it of its) if (it[1] === view) return it[0]; } catch (e) { } return fb || view; };
const BRANCH_NAME = {};
const branchName = side => BRANCH_NAME[side] || (BRANCH_NAME[side] = (() => { try { const x = voorWieOpties().heel.find(o => o.tree === side); if (x && x.label) return x.label; } catch (e) { } return (TREES[side] || {}).brand || ""; })());
const bothSides = () => T.key === "s";
const sideTag = side => (side === "h" || side === "a") && bothSides() ? `<span class="vtak"><span class="vtak-kl" aria-hidden="true">${(side === "a" ? [12, 13, 14, 15] : [8, 9, 10, 11]).map(l => `<i style="--c:var(--l${l})"></i>`).join("")}</span>${esc(branchName(side))}</span>` : "";
const storyTags = st => (storyCov(st).c.tags || []).filter(t => STAGS[t]);
/* feiten bij een verhaal, uit de data: periode (geboorte- en sterfjaren van de overleden mensen erin), aantal mensen, aantal beelden */
function storyFacts(st) {
  const ps = st.people.map(person).filter(p => p && !p.living), ys = ps.flatMap(p => [yr(p.b), yr(p.d)]).filter(Boolean), n = storyImgs(st.id).length;
  return [ys.length ? `${Math.min(...ys)}–${Math.max(...ys)}` : "", `${ps.length} ${ps.length === 1 ? "persoon" : "mensen"}`, n ? `${n} ${n === 1 ? "beeld" : "beelden"}` : ""].filter(Boolean).join(" · ");
}
function storyCard(s) { /* an article with the title as the link (the link covers the card): the titles are headings, a screen reader reads only the title */ const { c, im, art } = storyCov(s), tg = storyTags(s); return `<article class="storycard${im ? " hasimg" : ""}"><div class="art">${im ? `<img src="${c.zoom ? im.src : im.thumb}" alt="" width="${im.w}" height="${im.h}" loading="lazy" decoding="async"${covStyle(c) ? ` style="${covStyle(c)}"` : ""}>` : art}</div><div class="tx"><span class="vmeta">${sideTag(s.side)}${tg.length ? `<span class="vtags">${tg.map(t => esc(STAGS[t])).join(" · ")}</span>` : `<span class="vtags">Verhaal</span>`}</span><h3><a class="hoofd" href="${mnHref("verhaal-" + s.id)}" data-go="verhaal-${s.id}">${esc(s.title)}</a></h3><p>${esc(s.lede)}</p><span class="vfacts">${esc(storyFacts(s))}</span></div></article>`; }
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
/* the title of the book of this tree, as on its cover (the core): "De familie De Groot · Boersma", "De voorouders van Kees de Groot" */
const ovBoekTitel = () => { try { return bkCore().options(bkCore().parse("boek")).titel; } catch (e) { return "De voorouders van " + (T.rootFull || T.root); } };
const ovBoekTitelHtml = () => esc(ovBoekTitel()).replace(/ (de|van|ter|ten|der|den) (\S+)$/, " $1\u00a0$2");
/* the title on the cover of the book card needs the book data (± 70 ms on a slow phone): when the core is not built yet, it is filled
   in a quiet moment after the page (the card is below the fold, and the title is decoration: aria-hidden) */
function ovBoekLater() {
  const vul = () => { const e = $("[data-ov-titel]"); if (e && e.isConnected && !e.textContent && e.dataset.ovTitel === T.key) e.innerHTML = ovBoekTitelHtml(); };
  if (window.requestIdleCallback) requestIdleCallback(vul, { timeout: 2000 }); else setTimeout(vul, 300);
}
function renderOverzicht() {
  const S = STATS || (STATS = computeStats());
  const H = honestStats(), oldest = H.yearProven < 9999 ? H.yearProven : S.oldestYearAB; /* "met bronnen terug tot": hetzelfde jaar als het kerncijfer */
  const cl = CHANGELOG[0];
  $("#v-overzicht").innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow">${esc(ownIntro() ? ovStamboomVan() : treeTitle())} · <span class="nw">bijgewerkt ${esc(String(VERSION).split(" · ").pop())}</span></div>
        <h1>${T.TXT.heroTitle || (ownIntro() ? focusTitle() : "Boeren, veehouders en grutters uit <em>Friesland</em> en de Kop van Overijssel")}</h1>
        <p class="lede">${esc(heroLedeTekst(oldest))}</p>
        <a class="stats" href="#${T.prefix}cijfers" data-go="cijfers" aria-label="Kerncijfers; meer in In getallen">${[[H.n, "voorouders", H.weak ? `Van ${H.weak} is de koppeling onzeker (C of D)` : ""], [H.genProven, "generaties", `Bewezen met akten${H.genAll > H.genProven ? `; met aanwijzingen ${H.genAll}` : ""}`], [S.nPlaces, "plaatsen", ""], [H.yearProven < 9999 ? H.yearProven : "–", "oudste jaar", `Bewezen met akten${H.yearAll <= H.yearProven - 10 ? `; met aanwijzingen ${H.yearAll}` : ""}`]].map(s => `<div class="stat"${s[2] ? ` title="${esc(s[2])}"` : ""}><b>${s[0]}</b><span>${s[1]}</span></div>`).join("")}</a>
        <div class="cta"><button class="btn primary" data-go="stamboom">Bekijk de stamboom</button>${T.key === "s" && typeof renderVerbanden === "function" ? `<button class="btn" data-go="verbanden">${esc(pageLabel("verbanden", "Kruispunten"))}</button>` : ""}${RENDER.zoeken && typeof zoekItems === "function" && zoekItems().length ? `<button type="button" class="ov-link cta-zoek" data-go="zoeken">${zoekItems().length} open vragen: help mee zoeken →</button>` : ""}</div>
      </div>
    ${(() => { const st = STORIES.length ? pickStories(1)[0] : null; return `<div class="ingangen">
      <button class="ingang" id="heroSearch">${navIco("zoek")}<span><b>Zoek je opa, oma of overgrootouder</b><small>Typ een naam, een dorp of een jaartal</small></span></button>
      ${RENDER.verwant ? `<button class="ingang" data-go="verwant">${navIco("verwant")}<span><b>Hoe zijn we familie?</b><small>Kies twee mensen en zie langs welke voorouders</small></span></button>` : ""}
      ${st ? `<button class="ingang" data-go="verhaal-${st.id}">${navIco("verhalen")}<span><b>Lees een verhaal</b><small>Vandaag: ${esc(st.title)}</small></span></button>` : ""}
    </div>`; })()}
      <div class="hero-fan"><div id="heroFan"></div><div class="fan-note" id="heroFanNote"></div></div>

    </div>
    ${Object.keys(TREES).length > 1 && FK_KOP ? `<div class="section-head" id="kiesboom"><h2 id="kiesboomH">${navIco("stamboom")} ${esc(BK_VOORWIE_TEKST.kop)}</h2><p>${esc(BK_VOORWIE_TEKST.ovIntro)}</p></div>
    <div class="ov-fk" role="group" aria-labelledby="kiesboomH">${fkPiramide("fko")}</div>` : ""}
    ${Object.keys(TREES).length > 1 && !FK_KOP ? `<div class="section-head" id="kiesboom"><h2>${navIco("stamboom")} Kies een stamboom</h2><p>Drie stambomen op één site.</p></div>
    <div class="bomen">${["h", "s", "a"].filter(k => TREES[k]).map(k => { const t = TREES[k], n = t.PEOPLE.filter(p => !p.alias && !p.living).length, nu = k === T.key; /* zelfde opbouw als de drie ingangen; het teken is het halve of hele rondje van de kant van Harrie, van Alies, of van beiden */
      const ico = `<svg viewBox="0 0 15 15" aria-hidden="true"><circle cx="7.5" cy="7.5" r="6"/>${k === "s" ? `<circle cx="7.5" cy="7.5" r="6" class="vol"/>` : `<path class="vol" d="${k === "h" ? "M7.5 1.5a6 6 0 0 0 0 12z" : "M7.5 1.5a6 6 0 0 1 0 12z"}"/>`}</svg>`;
      return `<button type="button" class="ingang boom" data-tree="${k}" aria-pressed="${nu}">${ico}<span>${nu ? `<i class="nu">Je bekijkt deze stamboom</i>` : ""}<b>${esc(k === "s" ? t.rootFull : t.root)}</b><small>${esc(TREE_INFO[k])}</small><small>${esc(t.brand)} · ${nl(n)} voorouders</small>${nu ? "" : `<em>Open deze stamboom →</em>`}</span></button>`; }).join("")}</div>` : ""}
    <div class="section-head"><h2>${navIco("families")} De acht families</h2><p>Elke overgrootouder opent een eigen lijn.</p></div>
    <div class="grid-4 ov-swipe">${LINE_KEYS.map(famCard).join("")}</div>
    ${(() => { const fp = ancestors.filter(p => portraitOf(p.kw)); return fp.length ? `<div class="section-head"><h2>${navIco("beeld")} Gezichten uit de familie</h2><p>Voorouders van wie een foto bewaard is gebleven.</p></div><div class="faces ov-swipe">${fp.map(faceCard).join("")}</div>${ovMore(`id="seePortraits"`, "Alle portretten")}` : ""; })()}
    ${IMGS.length ? (() => { const tp = topPlaces(ancestors, 40).filter(x => placeHist(x[0])).slice(0, 8); /* alleen historische beelden */ return tp.length >= 4 ? `<div class="section-head"><h2>${navIco("kaart")} Waar ze woonden</h2><p>De dorpen uit de akten, in oude foto's en prenten.</p></div><div class="ptiles band">${tp.map(x => placeTile(x[0], x[1] + " keer in de akten", "", histLine(x[0]))).join("")}</div>${ovMore("data-archief", `Alle ${nl(archList().length)} archiefbeelden`)}${credits(tp.map(x => tileImg(x[0])))}` : ""; })() : ""}
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
    ${RENDER.boek ? `<a class="ov-boek" href="#${T.prefix}boek" data-go="boek"><span class="ov-boek-omslag" aria-hidden="true"><span class="ov-boek-t" data-ov-titel="${esc(T.key)}">${bkCoreCache[T.key] ? ovBoekTitelHtml() : (ovBoekLater(), "")}</span><span class="ov-boek-rug">${LINE_KEYS.filter(l => LINES[l]).map(l => `<i style="background:var(--l${l})"></i>`).join("")}</span></span>
      <span class="ov-boek-tx"><b>Het boek</b><span>De stamboom als boek om te laten drukken: per familie de verhalen en alle voorouders, met inhoud, register en bronnen.</span><span class="ov-link">Maak er een boek van →</span></span></a>` : ""}
    <div class="layers${RENDER.verwant || RENDER.zoeken ? " c4" : ""}">
      ${[["stamboom", "fan", "Stamboom", "Alle voorouders in een waaier, of stap voor stap terug in de boom."],
         ["families", "fam", "De acht families", "De acht familielijnen, elk met eigen verhaal, stamvaders en plaatsen."],
         ["personen", "card", "Personen", "Een profiel per persoon: data, familie, levensloop, scans en bronnen."],
         ...(RENDER.verwant ? [["verwant", "rel", "Hoe zijn we familie?", "Langs welke voorouders twee mensen verwant zijn, en in welke graad."]] : []),
         ["verhalen", "book", "Verhalen", T.TXT.layerVerhalen || "De rode draden: de naam De Groot, het katholieke leven, verhuizingen."],
         ["tijdlijn", "clock", "Tijdlijn", "Welke levens elkaar overlapten, tegen de achtergrond van hun tijd."],
         ["kaart", "pin", "Kaart", "Wie woonde waar, en hoe de families zich verplaatsten."],
         ["beeld", "photo", "Beeld", "Portretten, bidprentjes, oude foto's van de dorpen en duizenden beelden uit de archieven."],
         ["cijfers", "chart", "In getallen", "Levensduur, trouwdagen, namen, beroepen en geld, berekend uit de akten."],
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
  if (FK_KOP && $("#v-overzicht .ov-fk")) fkZoekBind($("#v-overzicht"), "fko"); /* "Iemand anders…" in the family block */
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
  const oldest = Math.min(...ps.filter(p => (p.st === "A" || p.st === "B") && ketenBewezen(p)).map(p => oudsteJaar(p, true))); /* zelfde maat als de kerncijfers: alleen wie via een A/B-keten vaststaat */
  const deep = Math.max(...ps.map(p => gen(p.kw)));
  /* naam bovenaan (op elke kaart op dezelfde hoogte), dan de aangetrouwde namen en het gebied; onderaan drie vaste stukjes */
  return `<button class="fam" style="--c:var(--l${l})" data-go="lijn-${l}">
    <span class="fam-bar" aria-hidden="true"></span>
    <h3>${esc(LINES[l].name)}</h3><p>${esc(LINES[l].sub)}</p><p class="fam-reg">${esc(LINES[l].region)}</p>
    <span class="fam-stats"><span>${ps.length} personen</span><span>tot generatie ${ROMAN[deep]}</span>${oldest < 9999 ? `<span>sinds ${oldest}</span>` : ""}</span></button>`;
}

/* ---------- stamboom ---------- */
let fanAlleGen = false;
document.addEventListener("click", e => { if (e.target.closest("[data-fan-gen]")) { fanAlleGen = !fanAlleGen; renderStamboom(route.sub); } });
function renderStamboom(sub) {
  fanRoot = fanRootOk(sub) ? sub : 1; if (fanRoot > 1) mode = "fan";
  /* telefoon: de namen worden met 9 ringen te klein (2–5 px); daarom standaard 6 ringen met grotere namen, en een knop voor alle generaties */
  const smal = innerWidth < 620, licht = smal && !fanAlleGen;
  drawFan($("#fan"), licht ? { maxGen: 5, labelGen: 5, root: fanRoot, more: true, labelScale: 2.4, minPx: 8 } : { maxGen: 9, labelGen: 7, root: fanRoot, more: true }); fanCrumbs(); fanJump(); fanLede();
  let knop = $("#fanGenKnop"); if (!knop) { knop = document.createElement("p"); knop.id = "fanGenKnop"; knop.className = "fan-gen-knop"; $("#fan").insertAdjacentElement("afterend", knop); }
  knop.hidden = !smal; knop.innerHTML = smal ? `<button type="button" class="btn" data-fan-gen>${licht ? "Toon alle generaties" : "Toon 5 generaties, met grotere namen"}</button>` : "";
  let comp = "";
  const fr = fanRoot, maxG = fr > 1 ? fanRelGens(fr) : Math.max(...ancestors.map(p => gen(p.kw)));
  for (let g = 2; g <= maxG; g++) {
    const tot = 2 ** (g - 1); let f = 0; for (let k = tot; k < tot * 2; k++) if (fr > 1 ? person(fanKw(fr * tot + k - tot)) : person(k)) f++;
    comp += `<div style="display:grid;grid-template-columns:34px minmax(0,1fr) 54px;gap:8px;align-items:center;margin:5px 0;font-size:12.5px"><span class="mono">${ROMAN[g]}</span><span style="height:8px;background:var(--sunk);border-radius:4px;overflow:hidden"><span style="display:block;height:100%;width:${f / tot * 100}%;background:var(--accent)"></span></span><span class="mono" style="text-align:right">${f}/${tot}</span></div>`;
  }
  $("#fanSide").innerHTML = `
    <div><h5>Gevonden per generatie${fanRoot > 1 ? " boven " + esc(firstName(person(fanKw(fanRoot)))) : ""}</h5>${fanRoot > 1 ? `<p class="small" style="margin:0 0 6px">I is ${esc(firstName(person(fanKw(fanRoot))))} zelf, II de ouders.</p>` : FK && T.focus && T.focus.pair ? `<p class="small" style="margin:0 0 6px">I ${(fanMidden().zin.replace(/ in het midden.*$/, "").includes(" en ") ? "zijn " : "is ")}${esc(fanMidden().zin.replace(/ in het midden.*$/, ""))}, II de ouders.</p>` : ""}${comp}</div>
    ${fanRoot > 1 ? `<div><h5>De takken</h5><div class="fan-takken" aria-label="De takken vanaf ${esc(firstName(person(fanKw(fanRoot))))}">${fanBranchColors(fanRoot).legend.map(x => `<button type="button" class="fl-it" style="--c:${x.color}" data-go="stamboom-${x.kw}" title="${esc(x.person.n)} in het midden van de waaier"><i></i>${esc(x.person.n)}</button>`).join("")}</div></div>` : ""}
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
/* Generation VI and older fold: the heading holds a button (a real h3 for screen readers); the cards of a folded generation are
   built when it opens, or one generation at a time when the browser is idle, so Ctrl+F finds them too (hidden="until-found"). */
let genFoldLists = {};
function genFoldFill(box) { const c = $(".cards", box); if (c && !c.childElementCount) c.innerHTML = (genFoldLists[box.dataset.g] || []).map(cardHtml).join(""); }
function genFoldSet(box, open) {
  const g = +box.dataset.g, b = $(".gf-btn", box), c = $(".cards", box); if (!b || !c) return;
  if (open) { genFoldFill(box); c.removeAttribute("hidden"); } else c.setAttribute("hidden", "until-found");
  box.classList.toggle("open", open); b.setAttribute("aria-expanded", String(open));
  open ? cardState.open.add(g) : cardState.open.delete(g);
}
function genFoldToggle(e) { const b = e.target.closest && e.target.closest(".gf-btn"); if (b) genFoldSet(b.closest(".gen-fold"), b.getAttribute("aria-expanded") !== "true"); }
function genFoldFound(e) { const box = e.target.closest && e.target.closest(".gen-fold"); if (box) genFoldSet(box, true); } /* Ctrl+F opened it */
function genFoldIdle(out) { /* fill the folded generations in the background, one per idle moment */
  const idle = window.requestIdleCallback || (f => setTimeout(f, 120));
  const next = () => { if (!out.isConnected) return; const box = $$(".gen-fold", out).find(x => !$(".cards", x).childElementCount); if (!box) return; genFoldFill(box); idle(next); };
  idle(next);
}
function renderPersonen() {
  $("#genSel").innerHTML = `<option value="all">Alle generaties</option>` + Array.from({ length: Math.max(...ancestors.map(p => gen(p.kw))) }, (_, i) => `<option value="${i + 1}">Generatie ${ROMAN[i + 1]} · ${GEN_NAME[i + 1]}</option>`).join("");
  $("#genSel").value = String(cardState.gen); $("#sortSel").value = cardState.sort; /* a rebuilt page keeps the choices (see trimViews) */
  $("#stChips").innerHTML = ["A", "B", "C", "D"].map(s => `<button class="chip st-${s}" aria-pressed="${cardState.st.has(s)}" data-s="${s}">status ${s}</button>`).join("");
  $$("#stChips [data-s]").forEach(b => b.onclick = () => { const s = b.dataset.s; cardState.st.has(s) ? cardState.st.delete(s) : cardState.st.add(s); b.setAttribute("aria-pressed", cardState.st.has(s)); renderCards(); });
  $("#q").oninput = e => { cardState.q = norm(e.target.value); renderCards(); };
  $("#genSel").onchange = e => { cardState.gen = e.target.value; renderCards(); };
  $("#cardsOut").addEventListener("click", genFoldToggle); /* fixed functions: the browser registers them only once */
  $("#cardsOut").addEventListener("beforematch", genFoldFound, true);
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
/* sort "op achternaam" like the Namenregister: the surname without its prefix (De Groot under G), then the given names; before 1811 the patronymic */
const cardSurKey = p => { const sn = splitName(p.n), sur = sn.sur || "", m = PREFIX.exec(sur), given = [].concat(sn.given || []).join(" ");
  return sur ? norm((m ? m[2] : sur) + " " + given) : "\uffff" + norm(given); }; /* only a given name: at the end */
/* back to everyone: search term and filters off (the sorting stays) */
function cardsReset() {
  Object.assign(cardState, { q: "", gen: "all", chg: null }); cardState.lines.clear(); cardState.st.clear();
  const q = $("#q"); if (q) { q.value = ""; q.focus(); } const g = $("#genSel"); if (g) g.value = "all";
  $$("#stChips [data-s]").forEach(b => b.setAttribute("aria-pressed", "false")); syncLineChips(); syncChgChips(); renderCards();
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
  const sorter = { kw: (a, b) => a.kw - b.kw, b: (a, b) => (yr(a.b) || yr(a.d) || 9999) - (yr(b.b) || yr(b.d) || 9999), n: (a, b) => cardSurKey(a).localeCompare(cardSurKey(b), "nl") || a.kw - b.kw }[s.sort];
  list.sort(sorter);
  const raw = ($("#q") || {}).value || "", active = s.gen !== "all" || s.q || s.lines.size || s.st.size || s.chg;
  const cnt = $("#cardsCount"); if (cnt) cnt.textContent = active && list.length ? `${nl(list.length)} ${list.length === 1 ? "persoon" : "personen"}` : "";
  if (!list.length) { $("#cardsOut").innerHTML = `<div class="empty"><p>Niemand gevonden${raw.trim() ? ` met ‘${esc(raw.trim())}’` : ""}.</p><button type="button" class="btn" id="cardsReset">Wis zoekterm en filters</button></div>`; $("#cardsReset").onclick = cardsReset; return; }
  if (s.sort !== "kw") { $("#cardsOut").innerHTML = `<div class="cards" style="margin-top:20px">${list.map(cardHtml).join("")}</div>`; return; }
  const byGen = {}; list.forEach(p => (byGen[gen(p.kw)] = byGen[gen(p.kw)] || []).push(p));
  /* Zonder filter klappen generatie VI en ouder in (anders is de pagina op een telefoon tienduizenden pixels lang);
     met een filter, zoekterm of gekozen generatie staat alles open. <details> klapt vanzelf open bij Ctrl+F. */
  const fold = s.gen === "all" && !s.q && !s.lines.size && !s.st.size && !s.chg;
  const head = g => `Generatie ${ROMAN[g]} <small>${GEN_NAME[g]} · ${byGen[g].length} ${byGen[g].length === 1 ? "persoon" : "personen"}</small>`;
  genFoldLists = byGen;
  const out = $("#cardsOut");
  out.innerHTML = Object.keys(byGen).map(g => { const open = cardState.open.has(+g); return fold && +g >= 6
    ? `<div class="gen-block gen-fold${open ? " open" : ""}" data-g="${g}"><h3><button type="button" class="gf-btn" aria-expanded="${open}" aria-controls="gf${g}"><span class="gf-t">${head(g)}</span><span class="gf-hint">toon</span></button></h3><div class="cards" id="gf${g}"${open ? "" : ` hidden="until-found"`}>${open ? byGen[g].map(cardHtml).join("") : ""}</div></div>`
    : `<div class="gen-block"><h3>${head(g)}</h3><div class="cards">${byGen[g].map(cardHtml).join("")}</div></div>`; }).join("");
  if (fold) genFoldIdle(out);
}

/* ---------- verhalen ---------- */
const vState = { tree: null, tag: null, side: null };
function drawStories() {
  if (vState.tree !== T.key) Object.assign(vState, { tree: T.key, tag: null, side: null });
  const inSide = () => true, list = STORIES.filter(st => inSide(st) && (!vState.tag || storyTags(st).includes(vState.tag)));
  const tags = Object.keys(STAGS).filter(t => STORIES.some(st => storyTags(st).includes(t)));
  const chip = (attr, val, label, n, on) => `<button class="chip" ${attr}="${val}" aria-pressed="${on}">${label} <span class="mono">${n}</span></button>`;
  /* the count; where the page shows both sides, the family on screen and the family choice of the header (no filter of its own per side) */
  const sides = `<p class="v-tel small">${STORIES.length} ${STORIES.length === 1 ? "verhaal" : "verhalen"}${bothSides() ? ` · Familie <b>${esc(typeof fkLabel === "function" ? fkLabel() : T.brand)}</b> · <button type="button" class="link" data-fk-open>Kies een tak ▾</button>` : ""}</p>`;
  $("#vFilter").innerHTML = `${sides}<div class="chips" role="group" aria-label="Onderwerp">${chip("data-vt", "", "Alle onderwerpen", STORIES.length, !vState.tag)}${tags.map(t => chip("data-vt", t, esc(STAGS[t]), STORIES.filter(st => inSide(st) && storyTags(st).includes(t)).length, vState.tag === t)).join("")}</div>`;
  $("#vGrid").innerHTML = list.map(storyCard).join("") || `<p class="muted">${STORIES.length ? "Geen verhalen bij deze keuze." : `Geen verhalen in ${scopeWord()}.`}</p>`;
  $$("#vFilter [data-fk-open]").forEach(b => b.onclick = () => { const k = $("#tpBtn"); if (k) setTimeout(() => { window.scrollTo({ top: 0 }); k.click(); k.focus(); }, 0); }); /* after this click, or the header closes it again */
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
      <div class="grid-3" id="vGrid"></div>`;
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
  const cc = $("#contextCards"); if (cc) cc.innerHTML = CONTEXT.map(c => `<article class="fact"><span class="yr"><span>${c.y}${c.y2 ? "–" + c.y2 : ""}</span></span><h3>${esc(c.t)}</h3><p>${esc(c.d)}</p></article>`).join("");
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
  const efs = tlNarrow() ? 17 : 11.5, eh = tlNarrow() ? 24 : 17; /* phone: the bars scale to ±0.64, so 17 reads as ±11 px */
  ctx.forEach(c => { const x0 = X(c.y), w = (String(c.y).length + 1 + c.t.length) * efs * 0.55 + 10; let r = ends.findIndex(e => e < x0); if (r < 0) { r = ends.length; ends.push(0); } ends[r] = x0 + w; c._r = r; });
  const top = 22 + ends.length * eh, rh = tlNarrow() ? 28 : 21, hh = 30; /* telefoon: hogere rijen voor grotere namen */
  let y = top; rows.forEach(r => { r.y = y; y += r.h || (r.head ? hh : rh); });
  const H = y + 30;
  /* twee svg's met dezelfde schaal: namen blijven staan, de balken scrollen (telefoon) */
  const names = el("svg", { viewBox: `0 0 ${left} ${H}`, role: "group", "aria-label": "Namen in de tijdlijn" }); /* de namen zijn knoppen naar het profiel */
  const svg = el("svg", { viewBox: `${left} 0 ${W - left} ${H}`, role: "group", "aria-label": "Tijdlijn van levens" });
  const bands = el("g", {}, svg);
  CONTEXT.filter(c => c.y2 && c.tl !== false).forEach(c => el("rect", { x: X(c.y), y: top - 6, width: X(c.y2) - X(c.y), height: H - top - 22, fill: "var(--gold)", "fill-opacity": 0.08 }, bands));
  deco(bands, top, H); for (const t of ticks) {
    el("line", { x1: X(t), x2: X(t), y1: top - 8, y2: H - 22, stroke: "var(--rule)", "stroke-width": t % 100 === 0 ? 1.2 : 0.6 }, bands);
    if (t % 50 === 0) txt(bands, X(t), H - 8, t, { "text-anchor": "middle", "font-size": tlNarrow() ? 17 : 11, fill: "var(--muted)", "font-family": "var(--mono)" });
  }
  ctx.forEach(c => {
    const ly = (tlNarrow() ? 19 : 14) + c._r * eh;
    el("line", { x1: X(c.y), x2: X(c.y), y1: ly + 4, y2: H - 22, stroke: "var(--gold)", "stroke-dasharray": "2 3", "stroke-width": 1 }, bands);
    const t = txt(bands, X(c.y) + 4, ly, `${c.y} ${c.t}`, { "font-size": efs, fill: "var(--gold)" });
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
  const host = $("#timeline"), was = $(".tl-bars", host), keep = was ? was.scrollLeft : null; host.innerHTML = "";
  const nc = document.createElement("div"); nc.className = "tl-names"; nc.appendChild(names);
  const bc = document.createElement("div"); bc.className = "tl-bars scroll-x"; bc.appendChild(svg);
  host.append(nc, bc);
  /* a redraw keeps the scroll position; the first time on a phone the window opens on the middle of the birth years, not on the earliest */
  if (keep !== null) bc.scrollLeft = keep;
  else if (bc.scrollWidth > bc.clientWidth + 4) requestAnimationFrame(() => {
    const ys = rows.filter(r => r.p).map(r => start(r.p)).filter(Boolean).sort((a, b) => a - b); if (!ys.length) return;
    const k = svg.getBoundingClientRect().width / (W - left);
    bc.scrollLeft = Math.max(0, (X(ys[ys.length >> 1]) - left) * k - bc.clientWidth / 2);
  });
}

/* ---------- kaart ---------- */
/* mode: "ooit" = iedereen met een gebeurtenis tot en met het jaar (stippen blijven staan); "levend" = alleen wie in dat jaar leeft,
   op de laatst bekende woonplaats. De keuze staat niet in de hash (vorige/volgende gaan niet door elk jaar), wel in localStorage. */
const mapState = { year: 2026, lines: new Set(), moves: true, place: null, zoom: 1, cx: null, cy: null, mode: (() => { try { return localStorage.getItem("stamboom-kaart-modus") === "levend" ? "levend" : "ooit"; } catch (e) { return "ooit"; } })() };
const MAP_EST = 70; /* zonder sterfjaar: leeft tot 70 jaar na het begin, of tot de laatste bekende gebeurtenis als die later is */
/* levensspanne voor de kaart: begin = geboorte of eerste gebeurtenis, eind = sterfjaar of schatting; levenden nooit */
function mapSpan(kw, evs) {
  const p = person(kw); if (!p || p.living) return null;
  const ys = evs.map(e => e.y).filter(Boolean); if (!ys.length) return null;
  const b = yr(p.b) || Math.min(...ys), d = yr(p.d);
  return { b, d: d || Math.max(Math.max(...ys), b + MAP_EST), est: !d };
}
let mapFocusPerson = null, mapFocusLiving = false, playTimer = null;
/* the places of one life: the events on the map plus the burial place when the burial names a place ("RK begraafplaats Wolvega") */
function personMapEvents(kw) {
  const p = person(kw), ev = EVENTS.filter(e => e.kw === kw); if (!p || p.living) return [];
  const bk = p.bur && Object.keys(PLACES).filter(k => !isGemeente(k) && new RegExp("\\b" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(p.bur)).sort((a, b) => b.length - a.length)[0];
  if (bk && yr(p.d) && !ev.some(e => e.p === bk && e.y === yr(p.d) && /begraven/.test(e.t))) ev.push({ kw, y: yr(p.d), p: bk, t: "begraven · " + p.bur });
  return ev.sort((a, b) => a.y - b.y);
}
/* the time slider: the whole period, or within one life */
function mapYearBounds() {
  const ev = mapFocusPerson ? personMapEvents(mapFocusPerson) : [], p = mapFocusPerson ? person(mapFocusPerson) : null;
  if (!ev.length) return [1730, 2026];
  return [Math.min(ev[0].y, yr(p.b) || 9999), Math.max(ev[ev.length - 1].y, yr(p.d) || 0)];
}
const callFullName = p => p ? [firstName(p), splitName(p.n).sur].filter(Boolean).join(" ") : "";
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
/* the families on the map: only those of this tree or focus with ancestors on the map, with how many; none with 0 (a focus is a
   branch: Boersma · Huitema shows only their families) */
function mapLineChipsHtml() {
  const n = {}; const seen = new Set(); EVENTS.forEach(e => { const l = lineOf(e.kw); if (l && !seen.has(e.kw)) { seen.add(e.kw); n[l] = (n[l] || 0) + 1; } });
  [...mapState.lines].forEach(l => { if (!n[l]) mapState.lines.delete(l); }); /* a choice from another focus does not hide everything */
  return LINE_KEYS.filter(l => LINES[l] && n[l]).map(l => `<button class="chip" style="--c:var(--l${l})" aria-pressed="${mapState.lines.has(l)}" data-l="${l}"><i></i>${esc(LINES[l].name)} <span class="mono">${n[l]}</span></button>`).join("");
}
function syncMapChips() { $("#mapChips").hidden = !!mapFocusPerson; /* one life: the families do not apply */ $("#mapChips").innerHTML = mapLineChipsHtml(); $$("#mapChips [data-l]").forEach(b => b.onclick = () => { const l = +b.dataset.l; mapState.lines.has(l) ? mapState.lines.delete(l) : mapState.lines.add(l); syncMapChips(); renderMap(); }); }
function renderKaart() {
  { const kh = $("#v-kaart h1"); if (kh) kh.textContent = pageLabel("kaart", "Kaart"); } /* the name from the menu */
  syncMapChips();
  { const [y0, y1] = mapYearBounds(), r = $("#yr"); if (r) { r.min = y0; r.max = y1; }
    mapSetYear(mapState.year < y0 || mapState.year > y1 || mapFocusPerson ? y1 : mapState.year); } /* one life: the slider runs within it, at its end */
  $("#yr").oninput = e => { mapState.year = +e.target.value; $("#yrOut").textContent = mapState.year; stopPlay(); renderMap(); mapAnnounce(700); };
  $("#moves").onchange = e => { mapState.moves = e.target.checked; renderMap(); };
  const syncMode = () => { $("#mAll").setAttribute("aria-pressed", mapState.mode === "ooit"); $("#mAlive").setAttribute("aria-pressed", mapState.mode === "levend"); };
  const setMode = m => { mapState.mode = m; try { localStorage.setItem("stamboom-kaart-modus", m); } catch (e) { } syncMode();
    if (m === "levend" && mapState.year >= new Date().getFullYear() - 1) mapSetYear(mapPeakYear()); /* today nobody of them lives: start at the year with the most */
    renderMap(); };
  $("#mAll").onclick = () => setMode("ooit"); $("#mAlive").onclick = () => setMode("levend"); syncMode();
  $("#play").onclick = () => {
    if (playTimer) { stopPlay(); return; }
    const [y0, y1] = mapYearBounds(); if (mapState.year >= y1) mapState.year = y0;
    $("#play").textContent = "Pauze"; $("#play").setAttribute("aria-pressed", "true");
    playTimer = setInterval(() => { mapState.year = Math.min(y1, mapState.year + (y1 - y0 > 120 ? 3 : 1)); $("#yr").value = mapState.year; $("#yrOut").textContent = mapState.year; renderMap(); if (mapState.year >= y1) stopPlay(); }, 90);
  };
  renderMap();
}
/* the year with the most ancestors alive at the same time (for "Alleen wie in dit jaar leeft") */
const mapPeakYear = () => { const S = STATS || (STATS = computeStats()); return S.alivePeak && S.alivePeak.y ? S.alivePeak.y : 1800; };
function mapSetYear(y) { mapState.year = y; const r = $("#yr"), o = $("#yrOut"); if (r) r.value = y; if (o) o.textContent = y; }
function stopPlay() { const was = !!playTimer; if (playTimer) clearInterval(playTimer); playTimer = null; const b = $("#play"); if (b) { b.textContent = "Afspelen"; b.setAttribute("aria-pressed", "false"); } if (was) mapAnnounce(0); }
/* what the map shows, for a screen reader: only after a stop or a chosen year (never during playing) */
let mapAnnT = 0;
function mapAnnounce(wait) {
  clearTimeout(mapAnnT); mapAnnT = setTimeout(() => {
    let lv = $("#mapLive"); if (!lv) { const m = $("#map"); if (!m || !m.parentNode) return; m.parentNode.insertAdjacentHTML("beforeend", `<p id="mapLive" class="sr-only" aria-live="polite"></p>`); lv = $("#mapLive"); }
    const side = $("#mapSide"); lv.textContent = side ? [$(".eyebrow", side), $("h3", side)].filter(Boolean).map(x => x.textContent.trim()).join(": ") : "";
  }, wait);
}
function aggregate(ev) {
  const agg = {};
  ev.forEach(e => { const a = agg[e.p] = agg[e.p] || { key: e.p, people: new Set(), ev: [], lines: {} }; a.people.add(e.kw); a.ev.push(e); const l = lineOf(e.kw); a.lines[l] = (a.lines[l] || 0) + 1; });
  return Object.values(agg).sort((a, b) => b.people.size - a.people.size);
}
function renderMap() {
  if (!rendered.kaart) return;
  hideTip(); /* the dots are drawn anew: the one under the pointer never sends pointerleave */
  let ev = (mapFocusPerson ? personMapEvents(mapFocusPerson) : EVENTS).filter(e => e.y <= mapState.year && (mapFocusPerson || !mapState.lines.size || mapState.lines.has(lineOf(e.kw))));
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
  /* zoom (buttons, pinch, drag when zoomed in): the visible part of the map; k = map units per screen pixel, so names and dots keep a
     readable size on a phone */
  const host = $("#map"), z = mapState.zoom = Math.min(8, Math.max(1, mapState.zoom || 1)), vw = MW / z, vh = MH / z;
  const k = 1 / (Math.min((host.clientWidth || MW) / MW, innerHeight * 0.86 / MH) * z);
  mapState.cx = Math.min(MW - vw / 2, Math.max(vw / 2, mapState.cx ?? MW / 2)); mapState.cy = Math.min(MH - vh / 2, Math.max(vh / 2, mapState.cy ?? MH / 2));
  const svg = el("svg", { viewBox: `${(mapState.cx - vw / 2).toFixed(1)} ${(mapState.cy - vh / 2).toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`, role: "img", "aria-label": "Kaart van Noord-Nederland met woonplaatsen van de voorouders" });
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
    const P = PLACES[a.key], [x, y] = proj(P.la, P.lo), n = a.people.size, r = Math.max((4 + 2.4 * Math.sqrt(n)) / Math.sqrt(z), 3.5 * k);
    const dom = +Object.entries(a.lines).sort((p, q) => q[1] - p[1])[0][0];
    const sel = mapState.place === a.key;
    const gg = el("g", { class: "place-dot" }, dots);
    el("circle", { cx: x, cy: y, r: Math.max(r, 11 * k), fill: "transparent" }, gg); /* a target of at least 22 screen pixels */
    el("circle", { class: "d", cx: x, cy: y, r, fill: dom ? `var(--l${dom})` : "var(--accent)", "fill-opacity": 0.85, stroke: sel ? "var(--ink)" : "var(--surface)", "stroke-width": sel ? 2.5 : 1.5 }, gg);
    clickable(gg, () => mapPick(a.key), placeName(a.key)); gg.setAttribute("tabindex", "-1"); /* the list beside the map is the route for the keyboard (not ±200 dots) */
    bindTip(gg, `<b>${esc(placeName(a.key))}</b><br>${mapFocusPerson ? a.ev.slice().sort((p, q) => p.y - q.y).map(e => `${e.y} ${esc(e.t)}`).join("<br>") : `${n} ${n === 1 ? "persoon" : "personen"}`}`); /* one life: kind and year */
  });
  const placed = []; /* plaatsnamen: de gekozen plaats eerst, daarna de grootste; een naam die een eerdere raakt, vervalt */
  list.map((a, i) => [a, i]).sort((p, q) => (q[0].key === mapState.place) - (p[0].key === mapState.place) || p[1] - q[1]).forEach(([a, i]) => {
    if (i > 14 * z && mapState.place !== a.key && !mapFocusPerson) return;
    const P = PLACES[a.key], [x, y] = proj(P.la, P.lo), r = Math.max((4 + 2.4 * Math.sqrt(a.people.size)) / Math.sqrt(z), 3.5 * k), fs = Math.max(12 / z, 11.5 * k); /* ±11.5 px on screen */
    if (!labelFits(placed, x + r + 3 * k, y + fs / 3, a.key, fs) && mapState.place !== a.key) return;
    el("text", { x: x + r + 3 * k, y: y + fs / 3, "font-size": fs, fill: "var(--surface)", stroke: "var(--surface)", "stroke-width": 3 * k, "stroke-linejoin": "round" }, labels).textContent = a.key;
    txt(labels, x + r + 3 * k, y + fs / 3, a.key, { "font-size": fs, fill: "var(--ink)" });
  });
  host.innerHTML = ""; host.appendChild(svg);
  host.insertAdjacentHTML("beforeend", `<div class="map-zoom"><button type="button" class="btn" data-mz="2" aria-label="Inzoomen"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 3.5v11M3.5 9h11"/></svg></button><button type="button" class="btn" data-mz="0.5" aria-label="Uitzoomen"${z <= 1 ? " disabled" : ""}><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3.5 9h11"/></svg></button></div>`);
  $(".map-zoom", host).onclick = e => { const b = e.target.closest("[data-mz]"); if (b) { mapState.zoom = z * +b.dataset.mz; renderMap(); } };
  mapGestures(svg);
  renderMapSide(list);
}
/* drag (when zoomed in) and pinch on the map; the page still scrolls when the map is not zoomed in. After a drag no place is chosen. */
function mapGestures(svg) {
  svg.style.touchAction = mapState.zoom > 1 ? "none" : "pan-y";
  const pts = new Map(); let st = null, moved = false;
  const setVB = () => { const z = mapState.zoom = Math.min(8, Math.max(1, mapState.zoom)), vw = MW / z, vh = MH / z;
    mapState.cx = Math.min(MW - vw / 2, Math.max(vw / 2, mapState.cx)); mapState.cy = Math.min(MH - vh / 2, Math.max(vh / 2, mapState.cy));
    svg.setAttribute("viewBox", `${(mapState.cx - vw / 2).toFixed(1)} ${(mapState.cy - vh / 2).toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`); };
  const start = () => { const v = [...pts.values()], r = svg.getBoundingClientRect();
    st = { x: v[0][0], y: v[0][1], cx: mapState.cx, cy: mapState.cy, z: mapState.zoom, u: (MW / mapState.zoom) / (r.width || 1), d: v.length > 1 ? Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) : 0 }; };
  svg.addEventListener("pointerdown", e => { pts.set(e.pointerId, [e.clientX, e.clientY]); moved = false; start(); });
  svg.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId) || !st) return; pts.set(e.pointerId, [e.clientX, e.clientY]); const v = [...pts.values()];
    if (v.length > 1 && st.d) { mapState.zoom = st.z * Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) / st.d; moved = true; setVB(); }
    else if (mapState.zoom > 1) { const dx = v[0][0] - st.x, dy = v[0][1] - st.y; if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (moved) { mapState.cx = st.cx - dx * st.u; mapState.cy = st.cy - dy * st.u; setVB(); } }
  });
  const end = e => { pts.delete(e.pointerId); if (pts.size) { start(); return; } st = null; if (moved) setTimeout(renderMap, 0); }; /* new names and dot sizes for the new zoom */
  svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
  svg.addEventListener("click", e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
}
/* past een kaartlabel (tekst links-onder op x,y) zonder een eerder geplaatst label te raken? zo ja: onthoud het vak */
function labelFits(placed, x, y, s, fs) {
  const b = [x - 2, y - fs * 0.85 - 2, x + s.length * fs * 0.56 + 2, y + fs * 0.25 + 2];
  if (placed.some(q => b[0] < q[2] && q[0] < b[2] && b[1] < q[3] && q[1] < b[3])) return false;
  placed.push(b); return true;
}
/* plaatspagina: een huwelijk van twee voorouders (kw n en n^1) op één regel */
/* max: show that many rows, the rest behind "Toon alle N" (the map's side panel) */
function placeEvList(evs, max) {
  const used = new Set(), rows = [];
  evs.forEach((e, i) => {
    if (used.has(i)) return;
    if (/^getrouwd met/.test(e.t)) {
      const j = evs.findIndex((f, k) => k > i && !used.has(k) && f.y === e.y && f.kw === (e.kw ^ 1) && /^getrouwd met/.test(f.t));
      if (j > 0) { used.add(j); const [a, b] = e.kw % 2 ? [evs[j], e] : [e, evs[j]]; rows.push(`<li><span class="y">${e.y}</span><span><button data-open="${a.kw}">${esc(person(a.kw).n)}</button> en <button data-open="${b.kw}">${esc(person(b.kw).n)}</button><span class="t">trouwden${e.t.includes("(gemeente") ? " " + esc(e.t.slice(e.t.indexOf("("))) : ""}</span></span></li>`); return; }
    }
    if (/^(gouden|zilveren|diamanten) bruiloft/.test(e.t)) { /* a couple's anniversary on one line, like a marriage */
      const j = evs.findIndex((f, k) => k > i && !used.has(k) && f.y === e.y && f.kw === (e.kw ^ 1) && f.t === e.t);
      if (j > 0) { used.add(j); const [a, b] = e.kw % 2 ? [evs[j], e] : [e, evs[j]]; rows.push(`<li><span class="y">${e.y}</span><span><button data-open="${a.kw}">${esc(person(a.kw).n)}</button> en <button data-open="${b.kw}">${esc(person(b.kw).n)}</button><span class="t">vierden hun ${esc(e.t)}</span></span></li>`); return; }
    }
    rows.push(`<li><span class="y">${e.y}</span><span><button data-open="${e.kw}">${esc(person(e.kw).n)}</button><span class="t">${esc(e.t)}</span></span></li>`);
  });
  if (max && rows.length > max + 2) return `<ul class="evlist">${rows.slice(0, max).join("")}${rows.slice(max).map(r => r.replace("<li>", '<li class="ev-meer" hidden>')).join("")}</ul><p class="small" style="margin:0"><button type="button" class="link" data-evmeer>Toon alle ${rows.length}</button></p>`;
  return `<ul class="evlist">${rows.join("")}</ul>`;
}
document.addEventListener("click", e => { const b = e.target.closest("[data-evmeer]"); if (!b) return; /* the rest of a long list */
  const ul = b.parentElement.previousElementSibling; $$(".ev-meer", ul).forEach(li => { li.hidden = false; }); b.parentElement.remove(); });
function evList(evs) { return `<ul class="evlist">${evs.map(e => `<li><span class="y">${e.y}</span><span><button data-open="${e.kw}">${esc(person(e.kw).n)}</button><span class="t">${esc(e.t)}</span></span></li>`).join("")}</ul>`; }
/* de zijbalk scrolt mee met de pagina: na een keuze het begin ervan in beeld halen als dat boven de balk bovenin is verdwenen */
function mapPick(key) {
  mapState.place = key; renderMap();
  { const h = key ? $("#mapSide h3") : $("#mapSide [data-place]"); if (h) { if (key) h.tabIndex = -1; h.focus({ preventScroll: true }); } } /* the focus follows the choice */
  const t = $("#mapSide").getBoundingClientRect().top - $(".top").getBoundingClientRect().bottom;
  if (t < 0) window.scrollBy(0, t - 8);
}
function renderMapSide(list) {
  let h = "";
  { /* one life, or a living person asked for: one line above the map (on a phone the list is below it) */
    const lede = $("#v-kaart .lede"); let fn = $("#mapFocusNote");
    if (!fn && lede) { lede.insertAdjacentHTML("afterend", `<p class="stnote" id="mapFocusNote"></p>`); fn = $("#mapFocusNote"); }
    if (fn) { fn.hidden = !mapFocusPerson && !mapFocusLiving;
      fn.innerHTML = mapFocusPerson ? `Plaatsen van <b>${esc(callFullName(person(mapFocusPerson)))}</b> · <button class="link" id="clearFocus">Toon alle</button>` : mapFocusLiving ? "Van levenden staan geen plaatsen op de kaart." : ""; } }
  const sel = mapState.place && list.find(a => a.key === mapState.place);
  if (sel) {
    h += `<div><div class="eyebrow">${sel.people.size} ${sel.people.size === 1 ? "persoon" : "personen"} · ${mapState.mode === "levend" ? `woonde hier in ${mapState.year}` : `tot ${mapState.year}`}</div><h3>${esc(placeName(sel.key))}</h3>
      <div class="links map-side-top"><button class="btn" data-go="${slug(sel.key)}">Over ${esc(placeName(sel.key))} →</button><button class="btn" id="clearPlace">× Alle plaatsen</button></div></div>
      ${fig(placeImg(sel.key), { thumb: true, credit: false, cls: "side-ph" })}${placeImg(sel.key) ? `<p class="credit" style="margin:-6px 0 0">${credit(placeImg(sel.key))}</p>` : ""}
      ${pInfo(PLACES[sel.key]) ? `<p class="small" style="margin:0;font-size:14px">${esc(pInfo(PLACES[sel.key]))}</p>` : ""}
      <div id="mapArch" hidden></div>
      ${placeEvList(sel.ev.slice().sort((a, b) => a.y - b.y).map(e => mapState.est.has(e.kw) ? Object.assign({}, e, { t: e.t + " · sterfjaar onbekend" }) : e), 12)}`;
  } else {
    const nLive = mapState.mode === "levend" ? list.reduce((n, a) => n + a.people.size, 0) : 0;
    h += mapState.mode === "levend"
      ? !nLive ? `<div><div class="eyebrow">in ${mapState.year} in leven</div><h3>In ${mapState.year} leeft geen van deze voorouders meer</h3></div>
      <p style="margin:0"><button type="button" class="btn" id="mapPeak">Kies ${mapPeakYear()}: toen leefden de meesten tegelijk</button></p>`
      : `<div><div class="eyebrow">in ${mapState.year} in leven</div><h3>${nLive} ${nLive === 1 ? "persoon" : "personen"} in ${list.length} ${list.length === 1 ? "plaats" : "plaatsen"}</h3></div>
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
  const pk = $("#mapPeak"); if (pk) pk.onclick = () => { stopPlay(); mapSetYear(mapPeakYear()); renderMap(); };
  const ap = $("#allPlaces"); if (ap) ap.onclick = () => { mapState.allList = true; renderMapSide(list); };
  const cf = $("#clearFocus"); if (cf) cf.onclick = () => go("kaart");
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
        ${pInfo(P) ? `<p class="lede" style="color:var(--ink)">${esc(pInfo(P))}</p>` : `<p class="lede">${ppl.length === 1 ? "Eén voorouder werd hier geboren, trouwde, woonde of overleed." : `${ppl.length} voorouders werden hier geboren, trouwden, woonden of overleden.`}</p>`}
        ${otherTrees().map(t => { const n = new Set(eventsOf(t).filter(e => e.p === key).map(e => e.kw)).size; return n ? `<p class="stnote">Ook ${n} ${n === 1 ? "voorouder" : "voorouders"} uit de familie ${esc(t.brand)} ${n === 1 ? "komt" : "komen"} hier voor in de akten. <button class="link" data-tree="${t.key}">Bekijk ${esc(placeName(key))} in de familie ${esc(t.brand)}</button></p>` : ""; }).join("")}
        <div class="links" style="margin-top:14px">
          <a class="chip" target="_blank" rel="noopener" href="https://nl.wikipedia.org/w/index.php?search=${enc(key)}">Wikipedia</a>
          <a class="chip" target="_blank" rel="noopener" href="${COMMONS[key] ? COMMONS_BASE + COMMONS[key] : "https://commons.wikimedia.org/w/index.php?search=" + enc(key)}">Foto's (Wikimedia Commons)</a>
          <a class="chip" target="_blank" rel="noopener" href="https://www.delpher.nl/nl/kranten/results?query=${enc(key)}&coll=ddd">Kranten (Delpher)</a>
          <a class="chip" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${enc(key + ", " + P.prov)}">Kaart van nu (Google Maps)</a>
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
  const eigen = IMGS.filter(i => i.soort === "historisch" && i.key === key).map(i => ({ id: i.id, ys: imgYears(i.datum) })); /* losse beelden van deze plaats (kerken, krantenberichten) uit de pagina zelf */
  const eigenIds = new Set(eigen.map(e => e.id)); /* an image that is both on the page and in the archive: once */
  const pl = [...eigen, ...archOfPlace(key).filter(a => !eigenIds.has(a.id))].sort((a, b) => (a.ys ? a.ys[0] : 9999) - (b.ys ? b.ys[0] : 9999));
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
const portraitList = () => ancestors.map(p => ({ p, im: portraitOf(p.kw) })).filter(x => x.im).sort((a, b) => isTiny(a.im) - isTiny(b.im)); /* tiny miniatures (48 px) last */
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
    beeld: [pageLabel("beeld", "Familie in beeld"), "Alles wat over de voorouders zelf bewaard bleef, ook rouwberichten en de beelden bij de verhalen.", "Zoek op naam, plaats of jaar"],
    "beeld-plaatsen": [pageLabel("beeld-plaatsen", "Plaatsen en kaarten"), "Waar ze gedoopt werden, trouwden en begraven liggen, en hoe het land eruitzag waar ze woonden; ook plekken met een eigen verhaal.", "Zoek een plaats, kerk of kaart"],
    "beeld-archief": [pageLabel("beeld-archief", "Uit de archieven"), "Duizenden oude foto's, prenten en kaarten uit archieven en musea, bij de plaatsen en voorouders uit de stamboom.", "Zoek op plaats, onderwerp, naam of jaar"] }[view];
  const zelf = view === "beeld" ? `<details class="box beeld-zelf"><summary><b>Zelf zoeken in oude kranten</b> <span class="small">kant-en-klare zoekopdrachten in Delpher</span></summary>
      <div class="chips">${PAPER_SEARCHES.map(x => `<a class="chip" target="_blank" rel="noopener" href="${esc(x[1])}">${esc(x[0])}</a>`).join("")}</div></details>`
    : view === "beeld-plaatsen" ? `<details class="box beeld-zelf"><summary><b>Meer foto's per plaats</b> <span class="small">fotocollecties op Wikimedia Commons</span></summary>
      <p class="small">Hele fotocollecties van dorpen, kerken en boerderijen.</p><div class="chips">${Object.keys(COMMONS).map(k => `<a class="chip" target="_blank" rel="noopener" href="${COMMONS_BASE + COMMONS[k]}">${esc(placeName(k))}</a>`).join("")}</div></details>` : "";
  host.innerHTML = `
    <div class="eyebrow">Beeld</div>
    <h1 class="page-title">${P[0]}</h1>
    <p class="lede">${P[1]}</p>
    <div class="toolbar"><input type="search" id="mq" placeholder="${P[2]}" aria-label="Zoek op deze pagina" value="${esc(beeldState.raw || "")}">${view === "beeld-archief" ? "" : `<nav class="chips" id="mToc" aria-label="Op deze pagina"></nav>`}</div>
    <div id="mOut"></div>${zelf}`;
  $("#mq").oninput = e => { const v = e.target.value; clearTimeout(beeldQT); beeldQT = setTimeout(() => { /* after the last key (150 ms): one redraw instead of one per letter */
    beeldState.raw = v; beeldState.q = norm(v); drawBeeld(); if (view === "beeld-archief") setHash(T.prefix + currentToken(), "replace"); }, 150); };
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
      h += head("archief", MICON.archief, IMG_KINDS.archief.label, "Een greep uit de oude foto's, prenten en kaarten in archieven en musea.", all.length)
        + (archTodo.length ? `<div id="archOut" class="capped pgal arch" data-imggroup><p class="small">Beelden laden…</p></div>` : "")
        + `<p class="ov-more"><a class="ov-link" href="#${T.prefix}${naar}" data-go="${naar}">Verken ${toks.length ? "deze" : "alle"} ${all.length.toLocaleString("nl-NL")} archiefbeelden →</a></p>`;
    }
  }
  out.innerHTML = h || `<div class="empty">Niets gevonden op deze pagina.${beeldState.raw ? ` <a class="ov-link" href="#${T.prefix}beeld-archief--zoek-${esc(kaal(beeldState.raw))}" data-go="beeld-archief--zoek-${esc(kaal(beeldState.raw))}">Zoek “${esc(beeldState.raw)}” in Uit de archieven →</a>` : ""}</div>`;
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
/* a tile: the 480 px miniature of a heavy image (img/archief/t/), otherwise the web image itself */
const archTile = a => a && a.tm ? archSrc(a.id).replace("img/archief/", "img/archief/t/") : archSrc(a.id);
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
let arvPqT = 0, beeldQT = 0;
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
        <fieldset><legend>Plaats</legend><input type="search" id="arvPq" placeholder="Zoek een plaats" aria-label="Zoek een plaats" value="${esc(opts.pq || "")}"><div class="chips">${chips("plaats", toonP.map(k => [k, placeName(k)]), cP)}</div>${pq && !toonP.length ? `<p class="small">Geen plaats met “${esc(opts.pq)}”.</p>` : ""}${!pq && topP.length > 12 ? `<p class="small">${toonP.length} van de ${topP.length} plaatsen.</p>` : ""}</fieldset>
        <fieldset><legend>Periode</legend><div class="chips">${chips("tijd", ARV_TIJD, tel("tijd"))}</div></fieldset>
        <fieldset><legend>Soort</legend><div class="chips">${chips("soort", ARV_SOORT, tel("soort"))}</div></fieldset>
        <fieldset><legend>Onderwerp</legend><div class="chips">${chips("onderwerp", ARV_OND.map(o => [o[0], o[1]]), tel("onderwerp"))}</div></fieldset>
        <fieldset><legend>Voorouders</legend><div class="chips">${chips("voor", [["tijd", "Uit hun tijd"], ["eigen", "Bij een voorouder"]], tel("voor"))}</div></fieldset>
        <fieldset><legend>Familie</legend><div class="chips">${chips("lijn", LINE_KEYS.filter(l => LINES[l]).map(l => [String(l), LINES[l].name]), tel("lijn"))}</div></fieldset>
        <fieldset><legend>Bron</legend><select id="arvBron" aria-label="Bron"><option value="">Alle bronnen</option>${Object.keys(cB).sort((a, b) => cB[b] - cB[a]).map(k => `<option value="${esc(k)}"${ARV.bron === k ? " selected" : ""}>${esc(bronNaam[k])} (${cB[k]})</option>`).join("")}</select></fieldset>
      ${wide ? "" : `<div class="arv-toon"><button type="button" class="btn primary" id="arvToon">Toon ${list.length.toLocaleString("nl-NL")} ${list.length === 1 ? "beeld" : "beelden"}</button></div>`}
      </div></details>
    <div class="arv-r">
      <div class="arv-top"><p aria-live="polite">${list.length ? `<b>${list.length.toLocaleString("nl-NL")}</b> van ${items.length.toLocaleString("nl-NL")} beelden${actief ? ` · <button class="link" id="arvWis">Wis de filters</button>` : ""}` : ""}</p>
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
  const pqi = $("#arvPq"); pqi.oninput = () => { clearTimeout(arvPqT); arvPqT = setTimeout(() => { /* wait for the last key: drawing the explorer costs time on a phone */
    const pos = pqi.selectionStart; arvRender(host, { open: true, pq: pqi.value, focus: "#arvPq" }); const n = $("#arvPq"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 150); };
  const toon = $("#arvToon"); if (toon) toon.onclick = () => { $(".arv-f", host).open = false; const g = $("#arvGrid"); if (g) { g.scrollIntoView({ block: "start" }); const t = $("[data-arv]", g); if (t) t.focus({ preventScroll: true }); } };
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
    return `<button class="arv-t" data-arv="${esc(a.id)}" aria-label="${esc((a.pk ? placeName(a.pk) + ", " : "") + (a.ys ? yearLabel(a.ys) + ": " : "") + tt)}"><img src="${archTile(a)}" alt="" loading="lazy" decoding="async"><span><small>${esc([a.pk ? placeName(a.pk) : "", a.ys ? yearLabel(a.ys) : ""].filter(Boolean).join(" · "))}</small>${esc(tt)}</span></button>`; }).join(""));
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
  const bijFeit = typeof akteBijFeitIds === "function" ? akteBijFeitIds(kw) : new Set(); /* al bij het feit in de levensloop */
  const ids = Object.keys(AKTE).filter(id => !aktePrive(AKTE[id]) && !bijFeit.has(id) && (AKTE[id].kws || []).some(k => ks.includes(String(k))));
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
  const blok = (titel, uitleg, list) => list.length ? `<details class="bk zk-auto"><summary>${titel} <span class="mono small">${list.length}</span></summary><p class="small">${uitleg}</p>${perLijn(list)}</details>` : "";
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
    <details class="box bk zk-auto"><summary>Toon alle onderzoeksvragen <span class="mono small">${OPEN_QUESTIONS.length}</span></summary>
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
    <p class="lede">Vaak ligt het antwoord in één boek of op één scan. Bij elke vraag staat waar het waarschijnlijk ligt, wat het zou beslissen en of het vrij online staat. Heb je zelf een akte, foto of bidprentje dat helpt? Daarvoor is de knop ‘Weet je meer?’.</p>
    ${items.length ? `<div class="chips" id="zkChips"><button class="chip" aria-pressed="${!zoekState.online}" data-zk="">Alles <span class="mono">${items.length}</span></button>${soorten.map(o => `<button class="chip" aria-pressed="${zoekState.online === o}" data-zk="${esc(o)}">${esc(o.charAt(0).toUpperCase() + o.slice(1))} <span class="mono">${items.filter(z => z.online === o).length}</span></button>`).join("")}</div>
    <div class="zkgrid">${list.map(zoekCard).join("")}</div>
    ${kort ? ovMore(`id="zkAll"`, `Alle ${pool.length} vragen`) : ""}` : `<div class="empty">Er staan hier nog geen vragen.</div>`}
    ${zoekAuto()}${onderzoeksVragen()}`;
  $$("#zkChips [data-zk]").forEach(b => b.onclick = () => { zoekState.online = b.dataset.zk; renderZoeken(); });
  const za = $("#zkAll"); if (za) za.onclick = () => { zoekState.alle = true; renderZoeken(); };
  wjmZoeken(host, list); /* "Weet je meer?" bij elke vraag */
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
  const arch = []; ARCHIVES.forEach(a => { const e = arch.find(x => x.n === a.n); if (e) e.meer.push(a); else arch.push(Object.assign({ meer: [] }, a)); }); /* één regel per archief, ook als het twee keer in de lijst staat */
  $("#v-bronnen").innerHTML = `${bronKop("Bronnen en betrouwbaarheid", "Elk gegeven op deze site komt uit een bron, met een label voor de sterkte van het bewijs.")}
    <div class="bron-weg" data-eigen-wegwijzer>${sectionGuide("Bronnen", "bronnen", { uitleg: { /* own texts with live counts; other tabs use their MENU description */
      zoeken: "De open vragen, met waar het antwoord waarschijnlijk ligt, en waar de stamboom ophoudt.",
      "bronnen-tegenstrijdig": `In ${nl(CONFLICTS.length)} gevallen spreken bronnen elkaar tegen. Wat we ermee doen.`,
      "bronnen-lijst": `${nl(total)} akten, registers en genealogieën, per soort en doorzoekbaar.`,
      "bronnen-over": `De nummering, wat er over levenden staat, ${nl(GLOSSARY.length)} begrippen${cl ? `, en wat er nieuw is in ${esc(cl.v)}` : ""}.` } })}</div>
    <div class="section-head"><h2>Hoe betrouwbaar?</h2></div>
    <div class="cols">
      <div class="box"><h3>Statuslabels</h3>${["A", "B", "C", "D"].map(s => `<p style="margin:8px 0">${stTag(s, true)} ${esc(STATUS[s].long)}</p>`).join("")}
        <h3 style="margin-top:18px">Bij weetjes en verhalen</h3>${Object.keys(NOTE_KIND).map(k => `<p style="margin:8px 0">${kindTag(k)} ${esc(NOTE_KIND[k])}</p>`).join("")}</div>
      <div class="box"><h3>Verdeling over ${ancestors.length} voorouders</h3>${statusBars()}<p class="small" style="margin:12px 0 0">Velden die onzekerder zijn dan het profiel als geheel, krijgen in het profiel een eigen label.</p></div>
    </div>
    <div class="section-head"><h2>Archieven</h2><p>Elk profiel heeft ook eigen zoeklinks.</p></div>
    <ul class="arch-list">${arch.map(a => `<li><a href="${esc(a.u)}" target="_blank" rel="noopener">${esc(a.n)}</a><span>${esc(a.d)}${a.meer.map(x => ` <a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.d.replace(/\.$/, ""))}</a>`).join("")}</span></li>`).join("")}</ul>`;
  $("#v-bronnen").insertAdjacentHTML("beforeend", gedBlok(true)); /* download als GEDCOM */
}
/* filter in een lijst: tekst in een invoerveld verbergt wat niet past en opent de groepen met treffers */
const scopeWord = () => T.focus ? "deze tak" : "deze stamboom"; /* empty states: a branch (family focus) or the whole tree */
function bronFilter(input, groups, item, telling, wat, total) {
  const tot = total || groups.reduce((n, g) => n + $$(item, g).length, 0);
  const run = () => {
    const q = norm(input.value.trim()); let n = 0;
    groups.forEach(g => { let m = 0; $$(item, g).forEach(li => { const ok = !q || norm(li.textContent).includes(q); li.hidden = !ok; if (ok) m++; }); g.hidden = !!q && !m; if (q) g.open = m > 0 && m <= 40; n += m; });
    const w = typeof wat === "function" ? wat(tot) : wat || ""; /* a word, or a function of the count ("geval" / "gevallen") */
    if (telling) telling.textContent = q ? `${nl(n)} van de ${nl(tot)} ${w}`.trim() : `${nl(tot)} ${w}`.trim(); /* altijd een telling, zoals bij de opvallende feiten */
  };
  input.addEventListener("input", run); run();
}
function renderTegenstrijdig() {
  const host = $("#v-bronnen-tegenstrijdig");
  if (!CONFLICTS.length) { host.innerHTML = `${bronKop("Tegenstrijdigheden")}<div class="empty">In deze stamboom spreken de bronnen elkaar nergens tegen.</div>`; return; }
  const g = {}; CONFLICTS.forEach(c => { const l = lineOf(c.kw) || 0; (g[l] = g[l] || []).push(c); });
  host.innerHTML = `${bronKop("Tegenstrijdigheden", `${nl(CONFLICTS.length)} ${CONFLICTS.length === 1 ? "geval" : "gevallen"}: een andere datum, een andere naam, of twee kandidaten voor dezelfde ouder. Per familielijn, met wat we aanhouden.`)}
    <div class="toolbar"><input type="search" id="tgQ" placeholder="Zoek op naam, plaats of onderwerp" aria-label="Zoek in de tegenstrijdigheden"><span class="small" id="tgN" aria-live="polite"></span></div>
    <div class="tg-wrap">${Object.keys(g).sort((a, b) => a - b).map(l => `<details class="box bk tg-l"><summary><b>${esc(LINES[l] ? "Familie " + LINES[l].name : "Generatie I–III")}</b> <span class="mono small">${g[l].length}</span></summary>
      ${g[l].map(c => { const p = person(c.kw), nu = String(c.now || "").split(/(?<=\.)\s/)[0]; return `<details class="tg"><summary>${esc(c.topic)}${p && !norm(c.topic).includes(norm(firstName(p))) ? ` <span class="small">· ${esc(p.n)}</span>` : ""}${T.key === "s" && c.side ? " " + sideTag(c.side) : ""}<span class="tg-nu">${esc(trunc(nu, 110))}</span></summary>
        <dl class="tg-dl"><dt>De ene bron</dt><dd>${esc(c.a)}</dd><dt>De andere bron</dt><dd>${esc(c.b)}</dd><dt>Wat we ermee doen</dt><dd>${esc(c.now)}</dd></dl>
        ${p ? `<p class="small" style="margin:6px 0 0"><button class="link" data-open="${c.kw}">Profiel van ${esc(p.n)}</button></p>` : ""}</details>`; }).join("")}</details>`).join("")}</div>`;
  bronFilter($("#tgQ"), $$(".tg-l", host), ".tg", $("#tgN"), c => c === 1 ? "geval" : "gevallen");
}
/* Alle bronnen: a group is filled when it is first opened (or searched, or printed), so the page starts small */
function bronItem(it) {
  const ks = [...it.kws].filter(k => person(k) && !person(k).living);
  return `<li><a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.label)}</a>${ks.length ? `<span class="bl-wie">${ks.slice(0, 2).map(k => `<button type="button" class="link" data-open="${k}" title="kw ${k}">${esc(person(k).n)}</button>`).join(", ")}${ks.length > 2 ? ` en ${ks.length - 2} ${ks.length === 3 ? "ander" : "anderen"}` : ""}</span>` : ""}</li>`;
}
function bronVul(g, agg) {
  if (g.dataset.vol) return; g.dataset.vol = "1";
  $(".bl-list", g).innerHTML = Object.values(agg[g.dataset.t] || {}).map(bronItem).join("");
}
function renderBronLijst() {
  const host = $("#v-bronnen-lijst"), agg = bronAgg(), total = Object.values(agg).reduce((n, o) => n + Object.keys(o).length, 0);
  host.innerHTML = `${bronKop("Alle bronnen", `${nl(total)} bronnen uit de profielen, gegroepeerd per soort: akten, registers, kranten en genealogieën. Bij elke bron staat bij wie hij hoort.`)}
    <div class="toolbar"><input type="search" id="blQ" placeholder="Zoek in de bronnen" aria-label="Zoek in alle bronnen"><span class="small" id="blN" aria-live="polite"></span></div>
    <div style="display:flex;flex-direction:column;gap:10px">${SRC_ORDER.filter(t => agg[t]).map(t => `<details class="box bk bl-g" data-t="${esc(t)}"><summary>${typeof srcIco === "function" ? srcIco(t) : ""}<b>${esc(SRC_MV[t] || t)}</b> <span class="small">${Object.keys(agg[t]).length}</span></summary><ul class="bl-list"></ul></details>`).join("")}</div>
    ${SOURCE_GROUPS.length ? `<details class="box bk bl-gen"><summary><b>Genealogieën en naslag, naar betrouwbaarheid</b> <span class="small">${SOURCE_GROUPS.reduce((n, g) => n + g[1].length, 0)}</span></summary>
    <p class="small">De genealogieën van anderen, ingedeeld naar hoe goed ze hun bronnen noemen, en de naslagwerken. Gebruikt als aanwijzing; een gegeven uit een genealogie heeft status B of C.</p>
    <div class="cols">${SOURCE_GROUPS.map(g => `<div><h3>${esc(g[0])}</h3><ul>${g[1].map(s => `<li><a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a></li>`).join("")}</ul></div>`).join("")}</div></details>` : ""}`;
  const groups = $$(".bl-g", host), q = $("#blQ");
  groups.forEach(g => { g.addEventListener("toggle", () => { if (g.open) bronVul(g, agg); }); g.addEventListener("vul", () => bronVul(g, agg)); });
  q.addEventListener("input", () => { if (q.value.trim()) groups.forEach(g => bronVul(g, agg)); });
  bronFilter(q, groups, "li", $("#blN"), "bronnen", total);
}
/* printing a Bronnen page: every card open (and every research question), closed again afterwards */
let bronDicht = [], zoekPrint = false;
addEventListener("beforeprint", () => {
  const v = route && route.view; if (!["bronnen", "bronnen-tegenstrijdig", "bronnen-lijst", "bronnen-over", "zoeken"].includes(v)) return;
  if (v === "zoeken" && !zoekState.alle && !zoekState.online) { zoekState.alle = zoekPrint = true; renderZoeken(); }
  const host = $("#v-" + v); if (!host) return;
  $$(".bl-g", host).forEach(g => { if (!g.dataset.vol) g.dispatchEvent(new Event("vul")); });
  const dicht = $$("details:not([open])", host).filter(d => !d.hidden); dicht.forEach(d => d.open = true); bronDicht = bronDicht.concat(dicht);
});
addEventListener("afterprint", () => {
  bronDicht.forEach(d => d.open = false); bronDicht = [];
  if (zoekPrint) { zoekState.alle = zoekPrint = false; if (route.view === "zoeken") renderZoeken(); }
});
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
      <p><b>Een familie kiezen.</b> Bovenaan kies je welke familie je bekijkt: de hele familie, één tak (bijvoorbeeld De Groot · Boersma), een grootouderpaar of iemand anders. Elke pagina gaat dan over die familie; zoeken vindt altijd iedereen. Met ‘Stamboom vanaf …’ in een profiel bekijk je de site vanaf die persoon of dat paar. De keuze staat in het adres, dus een gedeelde link toont dezelfde familie. Oude links blijven werken.</p>
      <p><b>Maken.</b> Onder Maken maak je van de stamboom een boek, een poster, een kalender, ansichtkaarten of een cadeau. Je maakt hier het bestand en print het zelf, of je laat het drukken bij een drukker naar keuze; deze site verkoopt niets en noemt geen prijzen. Ook daarop staan van levende familieleden alleen de namen. Levenloos geboren kinderen staan op een kalender alleen als je ‘Ook gedenkdagen’ kiest.</p>
      <p style="margin-bottom:0">Weet je meer over iemand, of heb je een akte, foto of bidprentje? In elk profiel staat de knop ‘Weet je meer?’.</p>
    </div>
    <div class="section-head" id="bo-begrippen"><h2 id="begrippen">Begrippen</h2><p>Oude woorden en termen uit de akten, kort uitgelegd.</p></div>
    <div class="toolbar"><input type="search" id="bgQ" placeholder="Zoek een begrip" aria-label="Zoek in de begrippen"><span class="small" id="bgN" aria-live="polite"></span></div>
    <div class="box"><dl class="dl bg-dl" style="grid-template-columns:160px minmax(0,1fr)">${GLOSSARY.slice().sort((a, b) => a[0].localeCompare(b[0], "nl")).map(g => `<div class="bg-it"><dt id="${glossId(g[0])}"><b style="color:var(--ink)">${esc(g[0])}</b></dt><dd>${esc(g[1])}${g[2] ? ` <span class="small">Bron: <a href="${esc(g[2][1])}" target="_blank" rel="noopener">${esc(g[2][0])}</a></span>` : ""}</dd></div>`).join("")}</dl></div>
    <div class="section-head" id="bo-wijzigingen"><h2>Wijzigingen</h2><p>Wat er per versie is veranderd.</p></div>
    <div class="wz">${CHANGELOG.map((c, i) => `<details class="box bk"${i ? "" : " open"}><summary><b>${esc(c.v)}</b> <span class="small">${esc(c.d)} · ${c.items.length} ${c.items.length === 1 ? "wijziging" : "wijzigingen"}</span></summary><ul>${c.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul></details>`).join("")}</div>
    ${IMGS.length ? `<div class="section-head" id="bo-beeld"><h2 id="beeldverantwoording">Beeldverantwoording</h2></div>
    <p class="small bo-beeld">${IMGS.length} afbeeldingen, met maker, licentie en bron. Ze komen uit ${beeldBronnen("", 8)}.${archList().length ? ` Daarnaast ${nl(archList().length)} beelden uit archieven en musea; maker, rechten en bron staan bij elk beeld (<button class="link" data-archief>Beeld › Uit de archieven</button>).` : ""}</p>
    <details class="box bk"><summary><b>Alle afbeeldingen</b> <span class="small">${IMGS.length}</span></summary><ul class="srclist" style="margin-top:10px">${IMGS.slice().sort((a, b) => a.t.localeCompare(b.t, "nl")).map(i => `<li><span class="small">${esc(i.t)}</span><span>${credit(i)}${refLine(i) ? ` · ${refLine(i)}` : ""}</span></li>`).join("")}</ul></details>` : ""}`;
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
function kidCount(p, partnerKw) {
  /* Summaries such as "in totaal dertien kinderen" or "nog drie kinderen" live in kidsNote, on the person or per marriage:
     "nog N", "N jongere/andere … kinderen" add to the list, any other "N kinderen" is a total. With more than one marriage,
     count only the children of the marriage with partnerKw (the kw in the person's own tree) when that marriage lists them. */
  if (!p) return 0;
  const ms = p.marriages || [], mm = ms.length > 1 && ms.find(x => x.kw === partnerKw && x.kids);
  const ks = mm ? mm.kids.map(i => (p.kids || [])[i]).filter(Boolean) : p.kids || [];
  const notes = [p.kidsNote].concat(mm ? [mm.kidsNote] : ms.map(x => x.kidsNote)).filter(Boolean);
  const seen = []; let n = 0, extra = 0, total = 0;
  notes.forEach(t => {
    const m = /(?:\b(nog)\s+)?(\d+|[a-z]+)\s+(?:(jongere|oudere|andere|overige|verdere)\s+)?kinderen/i.exec(t), v = m && numWord(m[2]);
    if (v) { if (m[1] || m[3]) extra += v; else total = Math.max(total, v); }
  });
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
    couples.push({ m, f, md, mp, kids: Math.max(kidCount(m, f.origKw || f.kw), kidCount(f, m.origKw || m.kw)) });
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
/* charts keep their letters at reading size: at most 1.2× their own width on a wide screen, and a narrow drawing on a phone */
const chartNarrow = () => (window.innerWidth || 1024) < 560;
const chartMax = W => ` style="max-width:${Math.round(W * 1.2)}px"`;
function vbars(data, o = {}) {
  const n = data.length, bw = o.bw || 34, gap = o.gap || 12, W = n * (bw + gap) + gap, H = 150, top = 22, base = H - 26;
  const fs = chartNarrow() && W > 320 ? 15 : 12;
  const max = o.max || Math.max(1, ...data.map(d => d.v));
  const hi = Math.max(...data.map(d => d.v));
  let s = `<svg class="vbars" viewBox="0 0 ${W} ${H}"${chartMax(W)} role="img" aria-label="${esc(o.label || "")}">`;
  s += `<line x1="${gap / 2}" x2="${W - gap / 2}" y1="${base}" y2="${base}" stroke="var(--rule)"/>`;
  data.forEach((d, i) => {
    const x = gap + i * (bw + gap), h = (base - top) * d.v / max, y = base - h;
    s += `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h, d.v ? 1 : 0)}" rx="3" fill="${o.color || "var(--accent)"}" fill-opacity="${d.v === hi ? 1 : 0.42}"><title>${esc(d.tip || (d.full || d.l) + ": " + d.v)}</title></rect>`;
    s += `<text x="${x + bw / 2}" y="${y - 6}" text-anchor="middle" font-size="${fs}" fill="var(--ink)" font-family="var(--mono)">${d.lab ?? d.v}</text>`;
    s += `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="${fs}" fill="var(--muted)" font-family="var(--mono)">${esc(d.l)}</text>`;
  });
  return s + `</svg>`;
}
function hbars(rows, o = {}) {
  const max = Math.max(1, ...rows.map(r => r.v));
  return `<div class="hbars${o.wide ? " wide" : ""}${o.cls ? " " + o.cls : ""}">${rows.map(r => `<div class="hb"><span class="hl">${r.html || esc(r.l)}</span><span class="track"><span style="width:${(r.v / max * 100).toFixed(1)}%;background:${r.c || o.color || "var(--accent)"}"></span></span><span class="mono hv">${r.txt ?? r.v}</span></div>`).join("")}</div>`;
}
/* Leeftijd bij overlijden tegen geboortejaar: één stip per voorouder. Mannen rond, vrouwen ruit; open = jaartal geschat (ca.). */
function lifeScatter(life) {
  const W = chartNarrow() ? 360 : 680, H = chartNarrow() ? 220 : 250, step = chartNarrow() ? 100 : 50, fs = chartNarrow() ? 14 : 11, L = 34, R = 22, T = 10, B = 26;
  const ys = life.map(x => yr(x.p.b)), y0 = Math.floor(Math.min(...ys) / 50) * 50, y1 = Math.ceil((Math.max(...ys) + 1) / 50) * 50;
  const X = y => L + (y - y0) / (y1 - y0) * (W - L - R), Y = a => T + (1 - a / 100) * (H - T - B);
  let s = `<svg class="scatter" viewBox="0 0 ${W} ${H}"${chartMax(W)} role="img" aria-label="Leeftijd bij overlijden tegen geboortejaar, één stip per voorouder">`;
  [20, 40, 60, 80, 100].forEach(a => { s += `<line x1="${L}" x2="${W - R}" y1="${Y(a)}" y2="${Y(a)}" stroke="var(--rule)" stroke-dasharray="${a === 100 ? "" : "2 4"}"/><text x="${L - 6}" y="${Y(a) + 4}" text-anchor="end" font-size="${fs}" fill="var(--muted)" font-family="var(--mono)">${a}</text>`; });
  s += `<line x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--rule)"/>`;
  for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) s += `<text x="${X(y)}" y="${H - 8}" text-anchor="middle" font-size="${fs}" fill="var(--muted)" font-family="var(--mono)">${y}</text>`;
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
  const W = chartNarrow() ? 360 : 680, H = 180, L = 34, R = 22, T = 22, B = 26, step = chartNarrow() ? 100 : 50, fs = chartNarrow() ? 14 : 11, y0 = Math.floor(al[0].y / 50) * 50, y1 = Math.ceil((al[al.length - 1].y + 1) / 50) * 50;
  const top = Math.ceil(pk.v / 25) * 25, X = y => L + (y - y0) / (y1 - y0) * (W - L - R), Y = v => T + (1 - v / top) * (H - T - B);
  const line = al.map((a, i) => `${i ? "L" : "M"}${X(a.y).toFixed(1)} ${Y(a.v).toFixed(1)}`).join("");
  let s = `<svg class="scatter" viewBox="0 0 ${W} ${H}"${chartMax(W)} role="img" aria-label="Aantal voorouders in leven per jaar; het meest in ${pk.y}: ${pk.v}">`;
  for (let v = 25; v <= top; v += 25) s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--rule)" stroke-dasharray="2 4"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="${fs}" fill="var(--muted)" font-family="var(--mono)">${v}</text>`;
  for (let y = Math.ceil(y0 / step) * step; y <= Math.min(y1, new Date().getFullYear()); y += step) s += `<text x="${X(y)}" y="${H - 8}" text-anchor="middle" font-size="${fs}" fill="var(--muted)" font-family="var(--mono)">${y}</text>`;
  s += `<path d="${line}L${X(al[al.length - 1].y).toFixed(1)} ${Y(0)}L${X(al[0].y).toFixed(1)} ${Y(0)}Z" fill="var(--accent)" fill-opacity=".14"/><path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--rule)"/>`;
  s += `<circle cx="${X(pk.y)}" cy="${Y(pk.v)}" r="4.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/><text x="${X(pk.y)}" y="${Y(pk.v) - 9}" text-anchor="middle" font-size="${fs + 1}" fill="var(--ink)" font-family="var(--mono)">${pk.y}: ${pk.v}</text>`;
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
    <h1 class="page-title">${esc(pageLabel("cijfers", "In getallen"))}</h1>
    <p class="lede">Alleen over de overleden voorouders.</p>

    <div class="section-head" id="c-leven"><h2>Leven en sterven</h2><p>${S.life.length ? `${S.life.length} voorouders met een geboorte- en sterfjaar; ${S.life.filter(x => x.exact).length} daarvan tot op de dag. Wie als kind stierf, is geen voorouder: daarom liggen deze leeftijden hoger dan de levensverwachting van toen (rond 1850 zo'n 37 jaar).` : `Van niemand in ${scopeWord()} zijn het geboorte- en sterfjaar bekend.`}</p></div>
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
        ${S.implex ? `<li>${S.implex} vakken in de stamboom zijn dubbel bezet: ${S.implexTop} voorouders komen langs twee lijnen terug, en hun eigen voorouders dus ook. <button class="link" data-go="${implexStory()}">Over kwartierverlies</button></li>` : ""}
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

    <div class="section-head" id="c-werk"><h2>Werk</h2><p>${S.nOcc} voorouders met een bekend beroep; de percentages zijn van hen. Wie meer beroepen had, telt bij elk mee, dus samen is het meer dan 100%.</p></div>
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
/* de inleidende zin van de voorpagina, ook in het boek (Over dit boek) */
/* the opening of the overview for a tree without its own texts (a couple or someone else as the focus): only from the fields of T,
   no new claims; the people in the middle can be living, so names only. The tree of Harrie (h) keeps its own text below. */
const ownIntro = () => !T.TXT.heroLede && T.key !== "h";
/* the eyebrow of the overview: a couple by its family names, as in the header ("Stamboom Van der Molen · Gaastra"), so it stays on one line */
const ovStamboomVan = () => { const p = T.focus && T.focus.pair && !focusPersons().length && typeof fkKopPaar === "function" ? fkKopPaar(2) : "";
  return p && p.includes(" · ") ? "Stamboom " + p : "Stamboom van " + (nlList(focusPersons()) || p || focusWho()); };
const nlList = a => a.length > 1 ? a.slice(0, -1).join(", ") + " en " + a[a.length - 1] : a[0] || "";
/* the people in the middle by call name and surname ("Herman de Groot en Mien de Vries"), not all given names */
function focusWho() {
  const at = k => (T.PEOPLE || []).find(p => p.kw === k && !p.alias), call = p => p && p.roep && splitName(p.n).sur ? p.roep + " " + splitName(p.n).sur : p ? p.n : "";
  return nlList((T.focus && T.focus.pair ? [at(2), at(3)] : [at(1)]).map(call).filter(Boolean)) || T.rootFull || T.root;
}
const focusPersons = () => (T.focus && T.focus.pair && T.focus.persons || []).filter(Boolean); /* "Voor …": some children of the couple, by name */
function focusTitle() {
  const fam = String(T.brand || "").split(" · ").filter(Boolean), pers = focusPersons();
  if (pers.length) return `De voorouders van <em>${esc(nlList(pers))}</em>`;
  return T.focus && T.focus.pair && fam.length === 2 ? `De families <em>${esc(fam[0])}</em> en <em>${esc(fam[1])}</em>` : `De voorouders van <em>${esc(focusWho())}</em>`;
}
function focusLede(oldest) {
  const fam = [...new Set(Object.keys(T.LINES || {}).sort((a, b) => a - b).map(k => T.LINES[k].name).filter(Boolean))];
  const n = VW_NUM[fam.length] || String(fam.length), N = n.charAt(0).toUpperCase() + n.slice(1);
  /* a couple: the title names the families, so the lede names the people; one person: the title names him or her already */
  const pers = focusPersons();
  if (pers.length) return `${nlList(pers)} ${pers.length > 1 ? "zijn kinderen" : "is een kind"} van ${focusWho()}. ` + (fam.length > 1 ? `${N} families, met bronnen terug tot ${oldest}: ${nlList(fam)}.` : `Met bronnen terug tot ${oldest}.`);
  if (T.focus && T.focus.pair) return `De voorouders van ${focusWho()}, met bronnen terug tot ${oldest}.` + (fam.length > 1 ? ` ${N} families: ${nlList(fam)}.` : "");
  return fam.length > 1 ? `${N} families, met bronnen terug tot ${oldest}: ${nlList(fam)}.` : `Met bronnen terug tot ${oldest}.`;
}
const heroLedeTekst = oldest => ownIntro() ? focusLede(oldest) : T.TXT.heroLede ? T.TXT.heroLede.replace("{oldest}", oldest).replace("{gedeeld}", gedeeldePlaatsen()) : `De voorouders van Harrie de Groot en zijn broers en zussen, met bronnen terug tot ${oldest}. Acht families, bijna allemaal katholiek, die grotendeels binnen een straal van enkele tientallen kilometers bleven wonen. In de familie: een heilige, een kanunnik en een doopsgezinde tak.`;
/* dorpen en steden (geen gemeenten) die in de stambomen van Harrie én Alies voorkomen, voor de inleiding van de samengestelde boom */
function gedeeldePlaatsen() {
  if (!TREES.h || !TREES.a) return "";
  const pl = P => new Set(P.filter(p => !p.alias && !p.living).flatMap(p => [p.bp, p.dp, p.m && p.m.p, ...(p.res || []).map(r => r.p)]).filter(k => k && PLACES[k] && !isGemeente(k)));
  const a = pl(TREES.a.PEOPLE); return String([...pl(TREES.h.PEOPLE)].filter(k => a.has(k)).length);
}
/* het oudste jaar dat in een bron staat: geboorte, overlijden, huwelijk of een vermelding (res). Een geschat jaar ("ca. 1553", teruggerekend
   uit een leeftijd) telt niet; met streng ook geen gegeven dat zelf C of D is. Eén maat voor de inleiding, het kerncijfer en de familiekaartjes. */
const oudsteJaar = (p, streng) => Math.min(...[["b", p.b], ["d", p.d], ["m", p.m && p.m.d]].filter(([f, d]) => d && !isApprox(d) && (!streng || !fieldSt(p, f) || ST_RANK[fieldSt(p, f)] <= 1)).map(([, d]) => yr(d) || 9999), ...(p.res || []).map(r => r.y || 9999), 9999);
function honestStats() {
  const A = ancestors, out = { n: A.length, weak: 0, genProven: 0, genAll: 0, yearAll: 9999, yearProven: 9999 };
  A.forEach(p => {
    const kb = ketenBest(p), best = kb.st, bg = kb.g;
    const proven = ST_RANK[best] <= 1;
    if (proven && (p.st === "A" || p.st === "B")) out.yearProven = Math.min(out.yearProven, oudsteJaar(p, true));
    out.yearAll = Math.min(out.yearAll, oudsteJaar(p));
    if (!proven) out.weak++;
    out.genAll = Math.max(out.genAll, bg); if (proven) out.genProven = Math.max(out.genProven, bg);
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
  const row = e => `<li data-n="${esc(norm(e.key + " " + e.ps.map(p => p.n).join(" ")))}"><div class="nm"><b>${esc(e.key)}</b><span class="dots" role="img" aria-label="${esc("Familie " + [...e.lines].map(l => LINES[l].name).join(", "))}">${[...e.lines].map(l => `<i style="background:var(--l${l})" title="${esc(LINES[l].name)}"></i>`).join("")}</span><span class="mono small">${e.ps.length}${e.y0 < 9999 ? ` · ${e.y0}${e.y1 > e.y0 ? "–" + e.y1 : ""}` : ""}</span></div><div class="who">${e.ps.sort((a, b) => a.kw - b.kw).map(p => `<span class="nw">${sexIco(p.kw)}<button class="link" data-open="${p.kw}">${esc(firstName(p))}</button></span>`).join(", ")}</div></li>`;
  host.innerHTML = `
    <div class="eyebrow"><button class="link" data-go="personen">Personen</button> › Namenregister</div>
    <h1 class="page-title">Namenregister</h1>
    <p class="lede">${list.length} achternamen en patroniemen, met de voornamen van wie ze droeg. De Groot vind je bij de G; vóór 1811 staat er vaak het patroniem (Hylkes: zoon van Hylke). De stippen zijn de families.</p>
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
    <h1 class="page-title">${esc(pageLabel("lijst", "Kwartierstaat"))}</h1><p class="kw-wie small">${esc(l ? "Familie " + LINES[l].name : treeTitle())}</p>
    <p class="lede">Alle voorouders met hun nummer, generatie na generatie, en achter de naam hoe sterk het bewijs is. Van levenden staat alleen de naam.</p>
    <div class="toolbar noprint">
      <select id="lijstLine" aria-label="Familie"><option value="0">Alle families</option>${LINE_KEYS.map(k => `<option value="${k}"${k === l ? " selected" : ""}>Familie ${esc(LINES[k].name)}</option>`).join("")}</select>
      <button class="btn primary" id="lijstPrint">${navIco("print")}Afdrukken of opslaan als pdf</button>
    </div>
    <div class="klijst">${body}</div>
    <p class="small printonly">${esc(VERSION)} · ${kws.length} nummers · bronnen per persoon op de website.</p>`;
  $("#lijstLine").onchange = e => { lijstState.line = +e.target.value; renderLijst(); };
  $("#lijstPrint").onclick = () => window.print();
  gedcomToolbar($("#v-lijst")); /* afdrukken en GEDCOM in één werkbalk */
  if (STAMREEKS_KNOP) $("#v-lijst .toolbar").insertAdjacentHTML("afterend", ovMore(`data-go="stamreeks"`, "Van vader op vader terug: de stamreeks")); /* de stamreeks */
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
  if (compact) return `<button class="notable-mini${por ? " withimg" : ""}" data-go="verwanten">${por ? `<img class="por" src="${por.thumb}" alt="" loading="lazy">` : ""}<span class="eyebrow">${esc(N.y)}</span><h3>${esc(N.n)}</h3><p>${esc(N.rel.split(". ")[0]).replace(/\s*\(kw \d+(?: en kw \d+)?\)/g, "")}.</p>${verdictTag(N.verdict)}</button>`; /* on the front page without kw numbers: the page itself has them */
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
      <p class="lede">${esc(T.TXT.verwanten || (T.focus ? "Geen bekende verwanten in deze tak." : "In de stamboom van " + T.root + " zijn nog geen bekende verwanten onderzocht."))}</p>
      ${NOTABLES.length ? `<div class="notables three">${NOTABLES.map(N => notableCard(N)).join("")}</div>` : ""}
      ${(T.HISTORY_TOUCH || []).length ? ovMore(`data-go="tijd"`, "Geraakt door de grote geschiedenis: zie Hun tijd") : ""}`;
    return;
  }
  $("#v-verwanten").innerHTML = `
    <div class="eyebrow"><button class="link" data-go="personen">Mensen</button> › Bekende verwanten</div>
    <h1 class="page-title">Bekende verwanten</h1>
    <p class="lede">Gezocht naar edelen, bestuurders en rijke grondbezitters: in de directe lijn geen adel en geen hoge bestuurders. Wel twee bekende geestelijken als naaste verwanten, onder wie een heilige, en een paar welgestelde boeren en kooplieden.</p>
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
/* the profile as a full page: #profiel-<kw> (see pfRender) */
VIEWS.push("profiel"); pfSec(); RENDER.profiel = () => pfRender(route.sub);
VIEWS.push("profielen"); pcSec(); RENDER.profielen = () => pcRender(route.sub);
/* ---------- compare: two profiles side by side (#vergelijk-<kw>-<kw>; without a second kw a chooser) ----------
   The facts row by row, both lives on one time axis, and where their lines meet. The living: the name only. */
function cmpSec() { let s = $("#v-vergelijk"); if (!s) { s = document.createElement("section"); s.className = "view cmp"; s.id = "v-vergelijk"; s.hidden = true; $("main").appendChild(s); } return s; }
VIEWS.push("vergelijk"); cmpSec(); RENDER.vergelijk = () => cmpRender(route.sub);
/* where the lines of the people meet: the place where all their paths from kw 1 part (one of them, or a descendant of all) */
function cmpMeet(ks) {
  const g = k => Math.floor(Math.log2(k));
  let x = ks[0]; ks.slice(1).forEach(k => { let y = k; while (g(x) > g(y)) x >>= 1; while (g(y) > g(x)) y >>= 1; while (x !== y) { x >>= 1; y >>= 1; } });
  const name = k => { const q = person(k); return q ? (k === 1 && rootGroup() ? groupName() : q.roep || firstName(q)) : "kw " + k; };
  const word = (k, s) => s === 1 ? (isMale(k) ? "vader" : "moeder") : relBase(s, k).replace(/ zelf$/, "");
  const and = xs => xs.length > 1 ? xs.slice(0, -1).join(", ") + " en " + xs[xs.length - 1] : xs[0] || "";
  const list = (ws, end) => and(ws.map((w, i) => i ? w.replace(/^(\S+(?: \S+)*?) is /, "$1 ") : w)) + end;
  if (ks.includes(x)) return list(ks.filter(k => k !== x).map(k => `${esc(name(k))} is de ${esc(word(k, g(k) - g(x)))}`), ` van ${esc(name(x))}.`);
  const pron = x === 1 && rootGroup() ? "hun" : (x === 1 ? T.rootMale : isMale(x)) ? "zijn" : "haar";
  return `Hun lijnen komen samen bij ${esc(name(x))}: ` + list(ks.map(k => `${esc(name(k))} is ${pron} ${esc(word(k, g(k) - g(x)))}`), ".");
}
/* host: the page #vergelijk, or the mode "Vergelijken" of #profielen (pcRender) */
function cmpRender(sub, host) {
  const sec = host || cmpSec(), parts = String(sub || "").split("-"), kies = parts[parts.length - 1] === "kies", ks = parts.filter(x => /^\d+$/.test(x)).map(Number).filter((k, i, a) => a.indexOf(k) === i).slice(0, 4);
  const P = ks.map(k => person(k));
  if (!ks.length) { sec.innerHTML = `<h1 class="page-title">Vergelijk</h1><div class="empty">Nog niemand gekozen. In elk profiel staat de knop Open ernaast.</div>`; return; } /* no one chosen yet */
  if (P.some(p => !p)) { sec.innerHTML = `<h1 class="page-title">Vergelijk</h1><div class="empty">Deze persoon staat niet in deze stamboom.</div>`; return; }
  const nm = p => p.roep || firstName(p), and = xs => xs.length > 1 ? xs.slice(0, -1).join(", ") + " en " + xs[xs.length - 1] : xs[0] || "";
  const tok = list => "vergelijk-" + list.join("-");
  const head = (k, p) => `<div class="cmp-h">${ks.length > 2 ? `<button type="button" class="cmp-x" data-go="${tok(ks.filter(x => x !== k))}" aria-label="Sluit ${esc(p.n)}">×</button>` : ""}<div class="eyebrow">kw ${k} · ${esc(k === 1 ? pnRelWords(1) : relBase(gen(k) - 1, k))}${k > 1 ? " · generatie " + ROMAN[gen(k)] : ""}</div>
    <h2><button type="button" class="link" data-open="${k}">${esc(p.n)}</button></h2>${p.living ? `<p class="small">levend</p>` : `<p class="small">${esc(pfYears(p))}${lineOf(k) && LINES[lineOf(k)] ? " · familie " + esc(LINES[lineOf(k)].name) : ""}</p>`}</div>`;
  if (ks.length === 1 || kies) { /* the chooser: the family of the last one first, then a search */
    const a = ks[ks.length - 1], A = person(a), near = [[a * 2, "vader"], [a * 2 + 1, "moeder"], [a > 1 ? a ^ 1 : 0, "partner"], [a > 1 ? a >> 1 : 0, "kind"]].filter(([k]) => k && person(k) && !ks.includes(k));
    sec.innerHTML = `<div class="eyebrow"><button type="button" class="link" data-open="${ks[0]}">${esc(person(ks[0]).n)}</button> › Vergelijken</div><h1 class="page-title">Vergelijk ${esc(and(P.map(nm)))} met…</h1>
      <div class="cmp-kies">${near.map(([k, w]) => `<button type="button" class="btn" data-go="${tok([...ks, k])}">${esc(w)} van ${esc(nm(A))}: ${esc(person(k).n)}</button>`).join("")}</div>
      <div class="toolbar"><input type="search" id="cmpQ" placeholder="Zoek een andere persoon" aria-label="Zoek een persoon om mee te vergelijken"></div><ul class="cmp-hits" id="cmpHits"></ul>
      ${ks.length > 1 ? `<p class="cmp-acts"><button type="button" class="btn" data-go="${tok(ks)}">Terug naar de vergelijking</button></p>` : ""}`;
    const q = $("#cmpQ"), hits = $("#cmpHits");
    q.addEventListener("input", () => { const t = norm(q.value.trim()); hits.innerHTML = !t ? "" : all.filter(p => !ks.includes(p.kw) && norm(p.n).includes(t)).slice(0, 20)
      .map(p => `<li><button type="button" class="link" data-go="${tok([...ks, p.kw])}">${esc(p.n)}</button> <span class="small">kw ${p.kw}${p.living ? "" : " · " + esc(pfYears(p))}</span></li>`).join(""); });
    return; }
  const cell = (p, f) => p.living ? "" : f(p) || "";
  const wed = p => p.m && (p.m.d || p.m.p) ? [p.m.w ? "met " + p.m.w : "", [fmt(p.m.d), placeName(p.m.p)].filter(Boolean).join(", ")].filter(Boolean).join(" · ") : "";
  const kidsN = (p, k) => { let n = kidCount(p); if (!n) { const q = k > 1 ? person(fanKw(k ^ 1)) : null; n = q && !q.living ? kidCount(q) : 0; } return n ? String(n) : ""; }; /* the children are often kept at the partner */
  const rows = [["Geboren", p => [fmt(p.b), placeName(p.bp)].filter(Boolean).join(", ")], ["Overleden", p => [fmt(p.d), placeName(p.dp)].filter(Boolean).join(", ")],
    ["Leeftijd", p => { const v = age(p); return v === null ? "" : v + " jaar"; }], ["Beroep", p => p.occ || ""], ["Geloof", p => p.rel || ""], ["Getrouwd", wed],
    ["Kinderen", null], ["Bewijs", p => p.st ? `${p.st} · ${STATUS[p.st].label.toLowerCase()}` : ""]]
    .map(([l, f]) => [l, ...P.map((p, i) => p.living ? "" : f ? cell(p, f) : kidsN(p, ks[i]))]).filter(r => r.slice(1).some(Boolean));
  /* the lives on one axis: per year what happened to each of them */
  const E = P.flatMap((p, i) => p.living ? [] : lifeEvents(p).filter(e => e.y).map(e => Object.assign({ side: i }, e))).sort((x, y) => x.y - y.y || x.side - y.side);
  const years = [...new Set(E.map(e => e.y))], evTxt = e => `${e.p ? esc(placeName(e.p)) + " · " : ""}${esc(e.t)}`, at = (y, i) => E.filter(e => e.y === y && e.side === i).map(evTxt).join("<br>");
  const two = ks.length === 2, cols = `<colgroup><col class="cmp-c0">${P.map(() => "<col>").join("")}</colgroup>`; /* every table on the same grid: a label column, then one per person */
  const tl = !years.length ? "" : `<div class="section-head"><h2>Hun levens naast elkaar</h2></div><div class="pane scroll-x"><table class="cmp-t cmp-tl">${cols}<thead><tr><th>Jaar</th>${P.map(p => `<th>${esc(nm(p))}</th>`).join("")}</tr></thead><tbody>${years.map(y => `<tr><th scope="row">${y}</th>${P.map((p, i) => `<td>${at(y, i)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  sec.innerHTML = `${host ? "" : `<div class="eyebrow"><button type="button" class="link" data-open="${ks[0]}">${esc(P[0].n)}</button> › Vergelijken</div>`}
    <h1 class="page-title">${esc(and(P.map(nm)))}</h1><p class="lede">${cmpMeet(ks)}</p>
    <div class="pane scroll-x"><table class="cmp-t cmp-facts">${cols}<thead><tr><td></td>${ks.map((k, i) => `<th scope="col" class="cmp-hc" data-kort="${esc(nm(P[i]))}">${head(k, P[i])}</th>`).join("")}</tr></thead>${rows.length ? `<tbody>${rows.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>` : ""}</table></div>
    ${tl}
    <p class="cmp-acts">${ks.length < 4 ? `<button type="button" class="btn" data-go="${tok(ks)}-kies">Voeg iemand toe</button>` : ""}${two ? `<button type="button" class="btn" data-go="${tok([ks[1], ks[0]])}">Wissel om</button>` : ""}</p>`;
}

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
    x.title = `Familie ${t.brand}`; });
  const sl = $("#v-stamboom .lede"); if (sl) sl.textContent = `${T.rootFull || T.root} in het midden; elke ring is een generatie verder terug.`;
  document.title = "Stamboom " + T.brand.replace(" · ", "-");
  footLater();
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
const treeOfHash = h => { const m = FK_RE.exec(h); if (m && FK) return focusSleutel(+m[2], !!m[1], m[3] ? fkKindNamen("s", +m[2], m[3].slice(1).split(".").map(fkNaam)) : []);
  if (m) return !m[1] && +m[2] === 2 ? "h" : !m[1] && +m[2] === 3 && TREES.a ? "a" : "s"; /* a new link without FK2: the nearest of the three trees */
  return TREES.a && /^a-/.test(h) ? "a" : TREES.s && (/^s-/.test(h) || !h) ? "s" : "h"; }; /* zonder hash: de boom van de kinderen */
const stripTree = h => FK_RE.test(h) ? h.replace(FK_RE, "") : h.replace(/^[as]-/, "");
document.addEventListener("click", e => { const t = e.target.closest("[data-tree]"); if (!t) return; e.preventDefault(); if (setTree(t.dataset.tree)) { focusNa = true; go(currentToken()); } }); /* the focus to the new h1 (menuNa) */
treeChrome();

/* ---------- zwakste schakel ---------- */
/* Een lijn is zo sterk als haar zwakste stap. Elke stap ouder → kind (kw k → k >> 1) krijgt het label van de koppeling:
   `link` als dat er staat, anders `st` (het slechtste van bestaan en koppeling). Levenden hebben geen label en tellen niet
   mee. Een alias-nummer (kwartierverlies) krijgt de koppeling uit het volledige record van dezelfde persoon, tenzij dat
   record voor die plek een eigen label heeft (linkAt; loadTree zet het via stepAt op de alias-kopie). Alles wordt
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
  host.insertAdjacentHTML("afterbegin", `<p class="printonly lijnkop">${esc(treeTitle())} · lijn ${l}, familie ${esc(LINES[l].name)} · ${esc(VERSION)}</p>`);
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
    if (T.key === "s") { const s = l < 12 ? "h" : "a"; if (s !== side) { side = s; rows.push({ side: branchName(s), h: tlNarrow() ? 34 : 28 }); } }
    const open = tlIsOpen(l), core = all.filter(p => tlCore(p, l)), shown = open ? all : core;
    const ys = all.flatMap(p => [yr(p.b), yr(p.d)]).filter(Boolean);
    rows.push({ head: l, h: tlNarrow() ? 64 : 46, n: all.length, core: core.length, open, y0: Math.min(...ys), y1: Math.max(...ys) });
    shown.forEach(p => rows.push({ p }));
    tlShown.push([l, open, core.length < all.length]);
  });
  tlSyncAll();
}
function tlHead(r, gn, g, left, right, X) {
  if (r.side) { txt(gn, 12, r.y + 20, r.side.toUpperCase(), { "font-size": tlNarrow() ? 16 : 11, "font-family": "var(--mono)", fill: "var(--muted)", "letter-spacing": "1" }); return; }
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
  if (more) { const t = txt(g, x, r.y + 37 * f, r.open ? "Toon alleen de stamlijn" : `Toon alle ${r.n}`, { "font-size": 12 * f, fill: "var(--accent)", class: "tlact" }); clickable(t, flip, t.textContent); t.setAttribute("tabindex", "-1"); x += t.textContent.length * 6.6 * f + 14; }
  const lk = txt(g, x, r.y + 37 * f, `Naar de familie ${trunc(LINES[l].name, 28)} →`, { "font-size": 12 * f, fill: "var(--accent)", class: "tlact" });
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
let vbGewisseld = false; /* came here from the tree of Harrie or Alies: say so once */
function renderVerbanden() {
  const host = $("#v-verbanden");
  if (T.key !== "s") { /* de pagina hoort bij de boom van de kinderen: doorschakelen (vervangt het adres in de geschiedenis) */
    rendered.verbanden = false;
    if (TREES.s && setTree("s")) { vbGewisseld = true; go("verbanden", { replace: true }); return; }
    host.innerHTML = `<p class="lede">Deze pagina hoort bij de hele familie ${esc((TREES.s || {}).brand || "")}.</p>`;
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
    <div class="eyebrow"><button class="link" data-go="kaart">Kaart</button> › ${esc(pageLabel("verbanden", "Kruispunten"))}</div>
    <h1 class="page-title">${esc(pageLabel("verbanden", "Kruispunten"))}</h1>
    ${vbGewisseld ? `<p class="stnote" role="status">Deze pagina hoort bij de hele familie ${esc((TREES.s || {}).brand || "")}; je kijkt nu naar die familie.</p>` : ""}
    <p class="lede">Waar de families elkaar kruisten: Harrie en Alies hebben, voor zover bekend, geen gemeenschappelijke voorouders, maar hun families woonden vaak in dezelfde dorpen. Hier de ${L.length} plaatsen waar voorouders van beide kanten binnen ${VB_GAP} jaar van elkaar voorkomen; de dichtste ontmoetingen staan bovenaan.</p>
    <p class="small">${sideTag("h")} en ${sideTag("a")} · Een gedeelde plaats en tijd betekent niet dat de families elkaar kenden. <button class="link" data-go="verhaal-buren">Lees het verhaal Buren zonder het te weten</button></p>
    <div class="vb-grid">
      <div class="pane vb-map" id="vbMap"></div>
      <ol class="vb-list">${L.map(r => `<li id="vb-${slug(r.k)}">
        <div class="vb-kop"><button class="link vb-pl" data-go="${slug(r.k)}">${esc(placeName(r.k))}</button><span class="vb-af">${esc(vbAfstand(r.best))}</span><span class="small">${r.van === r.tot ? r.van : r.van + "–" + r.tot} · ${r.kwH.size + r.kwA.size} voorouders</span></div>
        ${vbStrook(r, y0, y1)}
        <p class="vb-paar"><span class="vb-pt vb-pt-h" aria-label="${esc(branchName("h"))}"></span>${vbWie(r.best.h)}<br><span class="vb-pt vb-pt-a" aria-label="${esc(branchName("a"))}"></span>${vbWie(r.best.a)}</p>
      </li>`).join("")}</ol>
    </div>
    <p class="small vb-as-leg">Tijdstrook van ${y0} tot ${y1}: boven de lijn ${esc(branchName("h"))}, eronder ${esc(branchName("a"))}; het vak markeert de dichtste ontmoeting.</p>`;
  $("#vbMap").appendChild(kaart()); vbGewisseld = false;
}
RENDER.verbanden = renderVerbanden;
/* haken: knop op de kaart, regel op de plaatspagina (alleen in de samengestelde boom) */
{
  const kaartOrig = RENDER.kaart, plaatsOrig = RENDER.plaats;
  RENDER.kaart = (...a) => {
    kaartOrig(...a);
    const old = $("#vbKnop"); if (old) old.remove();
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
  const z = KORT[dataKey(q.kw || kw)];
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
/* the full name, with the call name first when it differs from the given names: "Kees (Cornelis Johannes Petrus) de Groot" (search fields: two Keeses stay apart) */
const vwVol = kw => { const p = person(kw); if (!p) return "kw " + kw; if (kw === 1 && T.key === "s") return T.rootFull; const sn = splitName(p.n);
  return p.roep && sn.given.length && !sn.given.includes(p.roep) ? [p.roep, "(" + sn.given.join(" ") + ")", sn.sur].filter(Boolean).join(" ") : p.n; };
const vwLabel = kw => { const p = person(kw); return !p ? "" : p.living ? vwVol(kw) : `${vwVol(kw)} (${lifeYears(p)})`; };
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
/* "Voor wie" → "Iemand anders…": search everyone in all three trees, independent of the tree on screen. Someone in Harrie's or
   Alies' tree is in the joint tree too (side, origKw): shown once, preferably in the current tree, else in their own tree.
   Of the living only the name is searched and shown. */
let VW_ALLE = null;
const vwBoomNaam = new Proxy({}, { get: (o, k) => k === "h" || k === "a" ? branchName(k) : undefined }); /* "De Groot · Boersma" / "Hoekstra · Bakker" */
function vwVolNaam(p) { const sn = splitName(p.n); return p.roep && sn.given.length && !sn.given.includes(p.roep) ? [p.roep, "(" + sn.given.join(" ") + ")", sn.sur].filter(Boolean).join(" ") : p.n; }
function vwFindAlle(q) {
  if (!VW_ALLE) {
    VW_ALLE = [];
    ["h", "a", "s"].map(k => TREES[k]).filter(Boolean).forEach(t => (t.PEOPLE || []).filter(p => !p.alias).forEach(p => {
      const id = t.key === "s" ? (p.side ? p.side + ":" + p.origKw : "s:" + p.kw) : t.key + ":" + p.kw; /* one person, one id */
      const naam = t.key === "s" && p.kw === 1 ? t.rootFull || p.n : vwVolNaam(p);
      VW_ALLE.push({ id, tree: t.key, kw: p.kw, p, naam, ks: [String(p.kw)], s: norm([naam, p.n, p.roep, p.living ? "" : p.alt, p.living ? "" : lifeYears(p)].join(" ")) });
    }));
  }
  const toks = norm(q).replace(/\bkw\s*/g, "").split(/[\s,()–-]+/).filter(Boolean); if (!toks.length) return [];
  const rang = c => c.tree === T.key ? 0 : c.tree !== "s" ? 1 : 2, best = new Map();
  VW_ALLE.filter(c => toks.every(t => /^\d+$/.test(t) ? c.ks.includes(t) || c.s.includes(t) : c.s.includes(t)))
    .forEach(c => { const o = best.get(c.id); if (!o || rang(c) < rang(o)) best.set(c.id, c); });
  return [...best.values()].map(c => [toks.some(t => c.ks.includes(t)) ? 0 : norm(c.p.n).startsWith(toks[0]) ? 1 : 2, c])
    .sort((a, b) => a[0] - b[0] || rang(a[1]) - rang(b[1]) || a[1].kw - b[1].kw).slice(0, 8)
    .map(([, c]) => Object.assign({}, c, { sub: [c.tree === "s" ? (c.kw === 1 ? "Harrie en Alies" : vwBoomNaam[c.p.side] || "") : vwBoomNaam[c.tree] || "", c.p.living ? "" : lifeYears(c.p), "kw " + c.kw].filter(Boolean).join(" · ") }));
}
/* na een keuze met de hand: de uitkomst in beeld als die onder de rand valt; op een aanraakscherm het toetsenbord dicht */
function vwShow(outId) {
  const o = $("#" + outId); if (!o || !o.querySelector(".vw-card")) return;
  const r = o.getBoundingClientRect(), vast = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vast")) || 0;
  if (r.top > innerHeight - 140) scrollTo({ top: scrollY + r.top - vast - 12, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
/* find (optional): an own search q → [{ kw, p, tree, naam, sub }] (the start of a book: all trees); set(kw, item) */
function vwBind(id, onlyAnc, set, outId, find) {
  const inp = $("#" + id), ul = $("#" + id + "L"); let items = [], sel = 0;
  /* telefoon: bij het intikken het veld bovenaan, zodat de suggesties boven het toetsenbord blijven */
  inp.onfocus = () => { if (innerWidth > 700) return; setTimeout(() => { const vast = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vast")) || 0, t = inp.getBoundingClientRect().top;
    if (t > innerHeight * 0.35 || t < vast) scrollTo({ top: scrollY + t - vast - 40 }); }, 250); };
  const close = () => { ul.hidden = true; inp.setAttribute("aria-expanded", "false"); inp.removeAttribute("aria-activedescendant"); };
  const draw = () => {
    ul.innerHTML = items.length ? items.map((c, i) => `<li role="option" id="${id}o${i}" aria-selected="${i === sel}" data-i="${i}"><b>${esc(c.naam || vwVol(c.kw))}</b><span>${c.sub != null ? esc(c.sub) : (c.p.living ? "" : esc(lifeYears(c.p)) + " · ") + "kw " + c.kw}</span></li>`).join("") : `<li class="none" role="option" aria-disabled="true">Niemand gevonden${onlyAnc ? " (van levenden staat alleen de naam in de stamboom; zij zijn hier geen keuze)" : ". Zoek op voornaam, achternaam of kw-nummer."}</li>`;
    ul.hidden = false; inp.setAttribute("aria-expanded", "true");
    if (items.length) inp.setAttribute("aria-activedescendant", id + "o" + sel); else inp.removeAttribute("aria-activedescendant");
  };
  const pickI = i => { const c = items[i]; if (!c) return; inp.value = c.naam || vwLabel(c.kw); close(); set(c.kw, c); if (matchMedia("(pointer:coarse)").matches) inp.blur(); if (outId) requestAnimationFrame(() => vwShow(outId)); };
  inp.oninput = () => { if (!inp.value.trim()) { items = []; close(); set(null); return; } items = find ? find(inp.value) : vwFind(inp.value, onlyAnc); sel = 0; draw(); };
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
    <details class="box vw-uitleg"><summary>Wat de woorden betekenen</summary>
      <p><b>Neef of nicht</b>: jullie delen grootouders. <b>Achterneef of achternicht</b>: jullie delen overgrootouders (neven en nichten in de tweede lijn); <b>achter-achterneef</b>: betovergrootouders (derde lijn). Staat de een een generatie lager onder de gedeelde voorouder dan de ander, dan heet dat <i>één generatie verschoven</i>.</p>
      <p><b>Oom of tante, oudoom of oudtante</b>: de broer of zus van een ouder of grootouder. Het kind van je broer of zus heet in het Nederlands ook neef of nicht, het kleinkind achterneef of achternicht. Die woorden hebben dus twee betekenissen; de uitleg bij elke uitkomst zegt welke bedoeld is.</p>
      <p><b>Graad van bloedverwantschap</b>: tel de geboorten tussen jullie twee, via de gedeelde voorouder. Ouder en kind zijn bloedverwant in de eerste graad, broers en zussen in de tweede, neven en nichten in de vierde. Zo staat het in het <a href="https://wetten.overheid.nl/BWBR0002656/" target="_blank" rel="noopener">Burgerlijk Wetboek, Boek 1, artikel 3</a>. Halfverwanten (via een ander huwelijk) hebben dezelfde graad.</p>
      <p><b>Bewijs</b>: elke stap tussen ouder en kind heeft een label: ${["A", "B", "C", "D"].map(s => stTag(s, true)).join(" ")}. Een pad is zo sterk als de zwakste stap. Kwartierverlies: wie langs twee lijnen in de stamboom staat, maakt dat mensen langs twee wegen verwant zijn.</p>
    </details>`;
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
  return ![s.anc, s.x, s.y].some(k => k && !person(k)); /* false: a number that is not in this tree (go shows "not found") */
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
  if (!fs.length) { host.innerHTML = FACTS.length ? `<p class="small">Geen feiten met deze keuze. <button class="link" data-opwis>Wis de filters</button></p>` : `<p class="small">Geen opvallende feiten in ${scopeWord()}.</p>`; return; }
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
    <p class="lede">Uit akten, registers en kranten, elk met een label voor hoe sterk het bewijs is. De bronnen staan in het profiel van de persoon.</p>
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

/* ---------- boek ---------- */
/* Het stamboomboek: #boek (ook a-/s-) met de keuzes in de hash, bv. #boek--diepte-7--formaat-a4--delen-fam.verh--beeld-weinig--druk.
   Het voorbeeld staat in een iframe met een eigen document: de boekstijlen (src/book-css.js) en Paged.js (src/vendor, MIT) laden alleen daar, zodat
   de printstijlen de site niet raken. "Maak pdf" drukt dat iframe af. Met --zuiver vervangt het boek de hele pagina (voor een
   pdf op exact formaat); daarna staan documentElement.dataset.boek = "klaar" en window.BOEK_INFO klaar.
   Typografie, voorwerk en nawerk (boekVoorwerk, boekInhoud, boekNawerk) en omslag, waaier, boom en beelden (boekOmslag,
   boekWaaier, boekBoom, boekOpening, boekBeelden) komen uit eigen secties; zonder die haken staat er een eenvoudige vorm.
   Van levenden staat alleen de naam in het boek. */
VIEWS.push("nietgevonden");
if (!$("#v-nietgevonden")) { const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-nietgevonden"; sec.hidden = true; $("main").appendChild(sec); }
RENDER.nietgevonden = () => { $("#v-nietgevonden").innerHTML = `<h1 class="page-title">Deze pagina bestaat niet</h1>
  <p class="lede">Het adres <code>#${esc(route.fout || "")}</code> hoort bij geen pagina van deze stamboom. Misschien is de link oud of verkeerd overgenomen.</p>
  <p><a class="btn primary" href="#${T.prefix}overzicht" data-go="overzicht">Naar het overzicht</a> <button type="button" class="btn" data-zoek-open>Zoeken</button></p>`; };
document.addEventListener("click", e => { if (e.target.closest("[data-zoek-open]")) { e.preventDefault(); openSearch(); } });
/* lukt het laden van de boekkern niet (src/products/book/build.js), dan start de rest van de site gewoon; alleen het boek ontbreekt */
const PB = (typeof Products !== "undefined" && Products.book) || null;
VIEWS.push("boek"); /* also without the book core: the page then says it could not be loaded */
/* a product page whose scripts did not arrive (a dropped request on the host): say so, with a button to load the page again */
function laadFout(host, titel) {
  host.innerHTML = `<h1 class="page-title">${esc(titel)}</h1><p class="lede">Deze pagina kon niet helemaal worden geladen: een deel van de site kwam niet binnen. Meestal helpt het om de pagina opnieuw te laden.</p>
    <p><button type="button" class="btn primary" data-herlaad>Opnieuw laden</button> <a class="btn" href="#${T.prefix}overzicht" data-go="overzicht">Naar het overzicht</a></p>`;
}
window.laadFout = laadFout;
document.addEventListener("click", e => { if (e.target.closest("[data-herlaad]")) location.reload(); });
if (!$("#v-boek")) { const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-boek"; sec.hidden = true; $("main").appendChild(sec); }
/* De opbouw van het boek zelf (keuzes, wie erin staat, titels, hoofdstukken, schatting) staat puur in de productmotor:
   src/products/book/build.js (Products.book), zodat hij later ook op een server kan draaien. Hier blijven de gegevens van de boom
   (bkBookData), het paneel, het voorbeeld (Paged.js) en het afdrukken. De namen hieronder blijven, omdat de secties voor typografie
   en omslag ze gebruiken. */
const BK_DELEN = PB ? PB.PARTS : [], BK_FORMAAT = PB ? PB.FORMATS : [["a4", "A4 staand", "a4", "210mm 297mm"]], BK_AFLOOP = PB ? PB.BLEEDS : [["", ""]], BK_BEELD = PB ? PB.IMAGES : [];
const BK_BRON = PB ? PB.SOURCES : [], BK_HYP = PB ? PB.HYPOTHESES : [], BK_PRESET = PB ? PB.PRESETS : {}, BK_SPLIT = PB ? PB.SPLITS : [];
const BK_MAX = PB ? PB.MAX_PAGES : {}, BK_OMSLAG = PB ? PB.COVERS : [];
const bkLeeg = PB ? PB.empty : () => ({ start: 1, paar: false, omslag: "b", split: "een", deelNr: 1, detail: 7, formaat: "a4", delen: new Set(), beeld: "weinig", bron: "noten", hyp: "mark", afloop: "", lijn: 0, zuiver: false, hires: false });
const bkState = bkLeeg();
const bkHaak = (n, ...a) => typeof window[n] === "function" ? window[n](...a) : null;
const BK_SITE = "stamboom.harriedegroot.com";
const bkSiteUrl = tok => BK_SITE + "/#" + T.prefix + tok;
/* de gegevens van deze boom voor het boek: de sobere boomdata van de brug (van levenden alleen kw, n, roep en living), wat alleen
   het boek gebruikt, en per persoon een paar afgeleide gegevens (portret, oudste bewezen jaar) */
const BK_HAKEN = { fotos: "boekFotos", omslag: "boekOmslag", voorwerk: "boekVoorwerk", inhoud: "boekInhoud", waaier: "boekWaaier", opening: "boekOpening", naam: "bookSurnameBlock", beelden: "boekBeelden", src: "boekSrc", verste: "boekVerste", nawerk: "boekNawerk", zetwerk: "boekZetwerk", achterkant: "boekAchterkant", kaart: "bookMap", kruis: "bookCrossings", tijdlijn: "bookTimeline" };
const bkHooks = () => Object.fromEntries(Object.entries(BK_HAKEN).map(([k, n]) => [k, (...a) => bkHaak(n, ...a)]));
function bkBookData() {
  const td = Products.site.treeData(T.key), ps = td.people;
  return Object.assign({}, td, {
    rootFull: T.rootFull || T.root, rootShort: T.root, version: VERSION, site: BK_SITE, prefix: T.prefix, thisYear: new Date().getFullYear(),
    sides: T.key === "s" ? { 2: TREES.h.root, 3: TREES.a.root } : {}, sideFam: T.key === "s" ? { 2: branchName("h"), 3: branchName("a") } : {}, genNames: GEN_NAME.slice(),
    stories: STORIES, historyTouch: T.HISTORY_TOUCH || [], context: CONTEXT, conflicts: CONFLICTS, openQuestions: OPEN_QUESTIONS, archives: ARCHIVES, sourceGroups: SOURCE_GROUPS,
    status: STATUS, offmap: OFFMAP,
    short: Object.fromEntries(td.facts.filter(f => f.kind === "short").map(f => [f.kw, f.text])),
    portraits: Object.fromEntries(ps.filter(p => !p.living).map(p => [p.kw, portraitOf(p.kw)]).filter(x => x[1])),
    provenYear: Object.fromEntries(ps.filter(p => !p.living).map(p => [p.kw, bkbJaren([person(p.kw) || p])]).filter(x => x[1])),
    provenKws: ancestors.filter(p => ST_RANK[ketenBest(p).st] <= 1).map(p => p.kw), /* proven chain (A/B): the generations counted as on the overview */
    focus: FK && T.focus ? { kw: T.focus.kw, pair: !!T.focus.pair, persons: (T.focus.persons || []).slice() } : null, /* the kind of focus: the title of the whole focus tree */
    front: bkFrontData() });
}
const bkCoreCache = {};
const bkCore = () => bkCoreCache[T.key] || (bkCoreCache[T.key] = Products.book.forTree(bkBookData(), bkHooks()));
/* het boek in het register van de productmotor: de hash-vorm van het boek (bv. "preset-compact--omslag-a"), via de kern van de huidige boom */
if (Products.setCodec && Products.products && Products.products.book && !Products.products.book.codec)
  Products.setCodec("book", { parse: t => bkCore().parse("boek--" + t), format: S => bkCore().format(S).replace(/^boek-?-?/, "") });
/* dunne laag over de kern, met de huidige keuzes (bkState) */
/* the wizard step is page state, not book state: it rides along in the address as --stap-N, outside the book core. bkStap counts
   BK_STAPPEN (1–5, with the hidden "which"); the address counts the steps the visitor sees (1–4), so --stap-2 is "STAP 2 VAN 4" */
const BK_STAPPEN = ["which", "kind", "size", "look", "ready"];
let bkStap = 1;
const bkWizard = () => !!(typeof Products !== "undefined" && Products.ui && Products.ui.wizard);
function bkFromToken(t) { const m = /--stap-(\d+)/.exec(t); bkStap = m ? Math.min(BK_STAPPEN.length, Math.max(2, +m[1] + 1)) : 1; Object.assign(bkState, bkCore().parse(t.replace(/--stap-\d+/g, "")));
  if ((bkState.voor || []).length && typeof fkKindNamen === "function") bkState.voor = fkKindNamen(T.key, bkState.start, bkState.voor); } /* the names as in the data */
/* without an argument: the current book with its step; with a state S0: only that book (keys, links to another tree) */
const bkToken = S0 => bkCore().format(S0 || bkState) + (!S0 && bkStap > 2 && bkWizard() ? "--stap-" + (bkStap - 1) : "");
const bkStartAan = S => PB ? bkCore().startOn(S) : false; /* without the book core: no own start (menu links stay plain) */
const bkStartLijnen = S => bkCore().startLines(S);
const bkBasis = () => bkCore().base(bkState);
const bkGen = kw => bkCore().genOf(bkState, kw);
const bkStartNaam = () => bkCore().startName(bkState);
const bkGenNaam = g => bkCore().genName(bkState, g);
const bkRel = kw => bkCore().rel(bkState, kw);
const bkKeten = kw => bkCore().chain(kw);
const bkMensen = S => bkCore().members(S);
const bkDelenVan = S => bkCore().partsOf(S);
let bkCurB = null; /* de keuzes van het boek dat nu wordt opgebouwd */
const bkB = () => bkCore().options(bkState);
const bkInhoud = B => bkCore().build(B);
const bkBeeld = (im, maat, cls) => bkCore().figure(im, maat, cls, bkCurB || bkB());
const bkSchat = (S, deel) => bkCore().estimate(S, deel, bkKal[T.key]);
const bkKal = (() => { try { return JSON.parse(localStorage.getItem("stamboom-boek-kal") || "{}"); } catch (e) { return {}; } })();
/* het iframe-document: eigen stijlen, de familiekleuren van de site en Paged.js */
function bkKleuren() { const cs = getComputedStyle(document.documentElement); return LINE_KEYS.map(l => `--l${l}:${cs.getPropertyValue("--l" + l).trim()}`).join(";") + `;--bk-scherm:${cs.getPropertyValue("--bg").trim() || "#f1efe9"}`; } /* --bk-scherm: de achtergrond rond de pagina's in het voorbeeld, in licht en donker */
function bkPagina(B) { const f = BK_FORMAAT.find(x => x[0] === B.formaat) || BK_FORMAAT[0], [w, h] = f[3].split(" "); return { f, css: (typeof window.boekPaginaCss === "function" ? window.boekPaginaCss(B.formaat) || "" : "") + `.bk-hfst.bk-los{break-before:always}${B.druk ? "" : ".bk-scherm{break-before:always}"}` /* als laatste: in Paged.js wint de laatste breekregel */
    + `:root{${bkKleuren()};--bk-w:${w};--bk-h:${h};--bk-pw:${w};--bk-ph:${h}}@page{size:${f[3]}${B.afloop && B.afloop !== "0" ? `;bleed:${B.afloop === "blurb" ? "3.175mm" : "3mm"}` : ""}}` }; }
const BK_FONTS = ["Libre+Caslon+Display", "Libre+Caslon+Text:ital,wght@0,400;0,700;1,400", "IBM+Plex+Sans:wght@400", "IBM+Plex+Sans:wght@500", "IBM+Plex+Sans:wght@600",
  "IBM+Plex+Sans:ital,wght@1,400", "IBM+Plex+Mono:wght@400", "IBM+Plex+Mono:wght@500"].map(f => `https://fonts.googleapis.com/css2?family=${f}&display=swap`); /* één aanvraag per gewicht: dan levert Google vaste fonts; een variabele font wordt in de pdf Type 3 */
/* in het voorbeeld-iframe: de voortgang per pagina naar de site, en daarna één spread tegelijk, geschaald op het vak (geen tweede scrollbalk) */
const BK_BLAD = String.raw`var bkGeef=window.scheduler&&scheduler.yield?function(){return scheduler.yield()}:function(){return new Promise(function(r){var c=new MessageChannel();c.port1.onmessage=function(){r()};c.port2.postMessage(0)})};
function bkVoortgang(){var n=0,af=[],st=document.createElement("style");st.media="screen";
st.textContent=".pagedjs_pages{display:block!important}.pagedjs_page{margin:0 auto 8mm!important}.pagedjs_page.bk-klaar>.pagedjs_sheet{content-visibility:hidden}";document.head.appendChild(st);
if(window.Paged&&Paged.registerHandlers)Paged.registerHandlers(class extends Paged.Handler{afterPageLayout(el){n++;af.push(el);if(af.length>3)af[af.length-4].classList.add("bk-klaar");try{parent.postMessage({boek:"bezig",paginas:n},"*")}catch(e){}return bkGeef()}})}
function bkBlad(){var P=[].slice.call(document.querySelectorAll(".pagedjs_page")),c=document.querySelector(".pagedjs_pages"),cur=[0];if(!P.length||!c)return;
var su=document.createElement("style");su.media="screen";su.textContent=".pagedjs_page.bk-uit{position:absolute!important;left:-300vw!important;top:0!important;visibility:hidden}.pagedjs_page.bk-uit>.pagedjs_sheet{content-visibility:hidden}";document.head.appendChild(su);
var i0=2;(function stuk(){var tot=Math.min(P.length,i0+30);for(;i0<tot;i0++)P[i0].classList.add("bk-uit");if(i0<P.length)bkGeef().then(stuk);else bkGeef().then(bkBladStart)})();
function bkBladStart(){var st=document.createElement("style");st.media="screen";st.textContent="html,body{overflow:hidden!important;height:100%;background:var(--bk-scherm,#d8d4cb)!important}.pagedjs_pages{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;justify-content:center!important;align-items:flex-start!important;gap:0!important;padding:0!important;transform-origin:top center}.pagedjs_page{background:var(--bk-papier,#fff);box-shadow:0 6px 24px rgba(0,0,0,.18),0 1px 3px rgba(0,0,0,.12)}.pagedjs_blank_page{filter:brightness(.965)}";document.head.appendChild(st);
var modus="auto";function smal(){if(modus==="1")return true;if(modus==="2")return false;var p=P[0],k=Math.min((innerWidth-24)/(2*p.offsetWidth),(innerHeight-24)/p.offsetHeight);return p.offsetWidth*k<300} /* automatisch: één pagina als een spread te klein wordt (pagina < 300 px) */
function sp(i){if(i<=0||smal())return[Math.max(0,i)];var a=i%2?i:i-1;return P[a+1]?[a,a+1]:[a]}
function schaal(){var p=P[cur[0]],w=p.offsetWidth*(smal()?1:2),h=p.offsetHeight,k=Math.min((innerWidth-24)/w,(innerHeight-24)/h,1.6);c.style.transform="scale("+k+")";c.style.marginTop="12px"}
function toon(i){i=Math.max(0,Math.min(P.length-1,i));cur=sp(i);P.forEach(function(p,j){var weg=cur.indexOf(j)<0;p.classList.toggle("bk-uit",weg);if(!weg)p.classList.remove("bk-klaar")});schaal();try{parent.postMessage({boek:"blad",van:cur[0]+1,tot:cur[cur.length-1]+1,totaal:P.length,spread:!smal()},"*")}catch(e){}}
function stap(r){toon(r==="+"?cur[cur.length-1]+1:r==="-"?cur[0]-1:+r-1)}
addEventListener("resize",function(){toon(cur[0])});addEventListener("message",function(e){if(!e.data)return;if(e.data.bkModus){modus=e.data.bkModus;toon(cur[0]);return}if(e.data.bkBlad!=null)stap(e.data.bkBlad)});
addEventListener("keydown",function(e){if(e.key==="ArrowRight"||e.key==="PageDown"){stap("+");e.preventDefault()}else if(e.key==="ArrowLeft"||e.key==="PageUp"){stap("-");e.preventDefault()}});
addEventListener("click",function(e){if(e.target.closest("a"))return;stap(e.clientX>innerWidth/2?"+":"-")});
document.addEventListener("click",function(e){var a=e.target.closest("a[href^='#']");if(!a)return;var t=document.querySelector(a.getAttribute("href"))||document.querySelector("[data-id='"+a.getAttribute("href").slice(1)+"']");var pg=t&&t.closest(".pagedjs_page");if(pg){e.preventDefault();e.stopPropagation();toon(P.indexOf(pg))}},true);
toon(0)}}`;
/* leeg: het voorbeeld; het document laadt zonder inhoud en meldt "geladen"; de site voegt de hoofdstukken één voor één toe (bkVulVoorbeeld)
   en roept dan bkStart aan. Zo is er nooit één lange taak om het hele boek in één keer te lezen. */
function bkDocument(B, leeg) {
  bkCurB = B;
  const { f, css } = bkPagina(B), base = new URL(".", location.href).href;
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><base href="${esc(base)}"><title>${esc(B.titel)}</title>
${BK_FONTS.map(u => `<link rel="stylesheet" data-pagedjs-ignore href="${u}">`).join("")}
<scr${""}ipt src="src/book-css.js"><\/script>
<script>document.write("<style>"+(window.BOEK_CSS||"")+${JSON.stringify(css).replace(/</g, "\\u003c")}+"<\/style>")<\/script>
<script>window.PagedConfig={auto:false,hyphenGlyph:"-"};function bkKlaar(flow){var np=(flow&&flow.total)||document.querySelectorAll(".pagedjs_page").length;document.documentElement.dataset.boek="klaar";window.BOEK_INFO={paginas:np,beelden:[].map.call(document.querySelectorAll(".bk-beeld img, .bk-foto img"),function(i){return {id:i.closest("figure").dataset.img,src:i.getAttribute("src"),w:i.naturalWidth||+i.getAttribute("width")||0,h:i.naturalHeight||+i.getAttribute("height")||0}})};try{parent.postMessage({boek:"klaar",paginas:np},"*")}catch(e){}}<\/script>
<scr${""}ipt src="src/vendor/paged.polyfill.min.js"><\/script>
<script>${BK_BLAD}<\/script>
<script>window.bkStart=function(){bkVoortgang();(document.fonts?document.fonts.ready:Promise.resolve()).then(function(){return window.PagedPolyfill.preview()}).then(function(f){bkKlaar(f);bkBlad()})};
addEventListener("load",function(){if(!window.PagedPolyfill||!window.BOEK_CSS){try{parent.postMessage({boek:"fout"},"*")}catch(e){}return}${leeg ? `try{parent.postMessage({boek:"geladen"},"*")}catch(e){}return;` : ""}bkVoortgang();(document.fonts?document.fonts.ready:Promise.resolve()).then(function(){return window.PagedPolyfill.preview()}).then(function(f){bkKlaar(f);bkBlad()})})<\/script></head>
<body data-formaat="${f[2]}" data-boom="${T.key}"${B.compact ? " data-compact" : ""}${B.afloop ? ` data-druk="" data-afloop="${B.afloop}"` : ""}>
${leeg ? "" : bkInhoud(B)}
</body></html>`;
}
/* drukmodus: het boek vervangt de hele pagina. Eerst alle stijlen en inhoud van de site weg, dan de boekstijlen, het boek en
   Paged.js; zo leest Paged.js alleen de boekstijlen (geen fetch van style.css, dus ook onder file://). */
function bkZuiver(B) {
  bkCurB = B;
  const { f, css } = bkPagina(B), body = bkInhoud(B);
  $$('link[rel="stylesheet"], style').forEach(n => n.remove());
  document.documentElement.removeAttribute("data-theme"); document.documentElement.className = "";
  document.title = B.titel;
  const add = (tag, attrs, txt) => { const n = document.createElement(tag); Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v)); if (txt) n.textContent = txt; document.head.appendChild(n); return n; };
  BK_FONTS.forEach(u => add("link", { rel: "stylesheet", "data-pagedjs-ignore": "", href: u }));
  [...document.body.attributes].forEach(a => document.body.removeAttribute(a.name));
  document.body.innerHTML = body;
  Object.entries({ "data-formaat": f[2], "data-boom": T.key, "data-zuiver": "" }).forEach(([k, v]) => document.body.setAttribute(k, v));
  if (B.compact) document.body.setAttribute("data-compact", "");
  if (B.afloop) { document.body.setAttribute("data-druk", ""); document.body.setAttribute("data-afloop", B.afloop); }
  window.PagedConfig = { auto: false, hyphenGlyph: "-" }; /* gewoon koppelteken bij afbreken over een pagina: dat staat in alle boekletters */
  const laad = src => new Promise((ok, nee) => { const sc = document.createElement("script"); sc.src = src; sc.onload = ok; sc.onerror = () => nee(new Error(src + " niet gevonden")); document.head.appendChild(sc); });
  laad("src/book-css.js").then(() => { add("style", {}, (window.BOEK_CSS || "") + css); return laad("src/vendor/paged.polyfill.min.js"); })
    .then(() => (document.fonts ? document.fonts.ready : Promise.resolve())).then(() => window.PagedPolyfill.preview()).then(flow => {
      const np = (flow && flow.total) || $$(".pagedjs_page").length;
      bkPaginaNrs(document);
      return Promise.resolve(typeof window.boekNaKlaar === "function" ? window.boekNaKlaar(document, B) : null).then(() => np);
    }).then(np => {
      window.BOEK_INFO = { paginas: np, beelden: $$(".bk-beeld img, .bk-foto img").map(i => { const r = i.getBoundingClientRect(); return { id: i.closest("figure").dataset.img, src: i.getAttribute("src"), w: i.naturalWidth || +i.getAttribute("width") || 0, h: i.naturalHeight || +i.getAttribute("height") || 0, breedteMm: Math.round(r.width / 96 * 25.4), hoogteMm: Math.round(r.height / 96 * 25.4) }; }) };
      document.documentElement.dataset.boek = "klaar";
    }).catch(e => { document.documentElement.dataset.boek = "fout"; window.BOEK_FOUT = String(e && e.message || e); });
}
/* de productkeuze bovenaan (Boek · Poster), met het beginpunt in de route; later uit de hub "Laten maken" */
const bkVanafTok = S => bkStartAan(S) ? "--" + (S.paar ? "vanaf-paar-" : "vanaf-") + S.start : "";
const bkProducten = S => [{ id: "book", label: "Boek", go: "boek" + bkVanafTok(S), href: T.prefix + "boek" + bkVanafTok(S), current: true },
  ...(RENDER.poster ? [{ id: "poster", label: "Poster", go: "poster" + bkVanafTok(S), href: T.prefix + "poster" + bkVanafTok(S) }] : [])];
const bkPosterTok = S => "poster" + (bkStartAan(S) ? "--" + (S.paar ? "vanaf-paar-" : "vanaf-") + S.start : "");
let bkSprong = ""; /* na een keuze: waar het voorbeeld naartoe springt (omslag, titel, of een familie "lijn-N") */
/* "Voor wie is het boek?" (BK5): eerst de voor de hand liggende beginpunten met namen, dan een zoekveld voor iedereen in de boom */
/* the words of "Voor wie" (19); {fam}, {kinderen}, {ouders}, {wie}, {zijn} and {n} are filled in from the data */
const BK_VOORWIE_TEKST = {
  vraag: "Van welke familie?", voor: "Voor:",
  /* the second line always names the couple of the label (Harrie: no "Vanaf", not once the children and once the couple) */
  kinderenSub: "{ouders} · {n} voorouders", kinderenTitel: "Voor {kinderen}",
  kantSub: "{ouders} · {n} voorouders", kantTitel: "Ook voor {wie} en {zijn} broers en zussen",
  takSub: "{ouders} · {n} voorouders", takTitel: "Ook voor neven en nichten",
  kop: "Kies een familie", kopKinderenSub: "{ouders} · {n} voorouders", kopKantSub: "{ouders} · {n} voorouders", kopKantTitel: "Ook de stamboom van {wie} en {zijn} broers en zussen",
  kopFamilie: "Familie", kopPersoon: "Persoon", kopPaar: "Paar", kopVoor: "Voor", kopNu: "Je bekijkt deze familie",
  ovIntro: "Bekijk de hele familie, of alleen de voorouders vanaf één paar.", kopKies: "Kies een familie of persoon",
  kopGekozen: "{soort} {fam} gekozen.", kopRegel: "Op deze pagina: de hele stamboom van {ouders} ({fam}).", kopZoek: "Zoek een naam",
  kopRegelWaaier: "De waaier vanaf {wie}; verder op deze pagina de hele stamboom van {ouders} ({fam}).",
  zoek: "Iemand anders…", zoekSub: "Een andere voorouder of een paar", zoekVeld: "Zoek een naam", centraal: "Wie staat er centraal?", opnieuw: "Iemand anders zoeken",
  resultaat: "Titel: {titel} · {n} voorouders", zoekUitleg: "Iemand uit de stamboom, of een paar: dan is het voor hun kinderen." };
/* the fixed choice, the same in all trees (Harrie: independent of the tree on screen): the family tree itself as a pyramid.
   Row 1 the children of Harrie and Alies, row 2 the side of Harrie and of Alies (from their parents), row 3 the four grandparent
   couples. Every option is named after the surnames of the couple it starts from, with the people on the second line. Each option
   says in which tree it belongs (choosing switches the tree) and which family colours it covers: the colours of the joint fan,
   where the eight lines are the eight grandparents (8–11 Harrie's side, 12–15 Alies'). Only from the data; living: names only. */
const VW_TEL = {}, VW_BY = {};
let VW_OPT = null; /* the same in every tree and focus: built once */
function voorWieOpties() {
  if (VW_OPT) return VW_OPT;
  return VW_OPT = voorWieOpties0();
}
function voorWieOpties0() {
  const fill = (t, o) => t.replace(/\{(\w+)\}/g, (m, k) => o[k] ?? "");
  const P = k => { const m = new Map((TREES[k] ? TREES[k].PEOPLE : []).filter(p => !p.alias).map(p => [p.kw, p])); return kw => m.get(kw) || null; };
  const sur = p => { const s = p ? splitName(p.n).sur : ""; return s ? s[0].toUpperCase() + s.slice(1) : ""; };
  const roep = p => p ? p.roep || firstName(p) : "";
  const fam = (ps, m) => [sur(ps(m)), sur(ps(m + 1))].filter(Boolean).join(" · ");
  const paar = (ps, m) => [roep(ps(m)), roep(ps(m + 1))].filter(Boolean).join(" en ");
  /* the number of ancestors of a start in a tree, as the book and the products count them (Products.startMembers follows
     kwartierverlies through the aliases), without the living; cached per tree and start */
  /* straight from the records (the same numbers as Products.startMembers on Products.site.treeData, checked for all starts on
     9-10-2026, without building the tree data of three trees at startup): up from the start, an alias continues at its person */
  const tel = (k, start, pr) => { const key = k + ":" + start + (pr ? "p" : ""); if (VW_TEL[key] != null) return VW_TEL[key];
    const by = VW_BY[k] || (VW_BY[k] = new Map((TREES[k] ? TREES[k].PEOPLE : []).map(p => [p.kw, p]))), seen = new Set(), st = pr ? [start, start + 1] : [start];
    while (st.length) { let kw = st.pop(), p = by.get(kw); if (!p) continue; if (p.alias != null) { kw = p.alias; p = by.get(kw); if (!p) continue; } if (seen.has(kw)) continue; seen.add(kw); st.push(2 * kw, 2 * kw + 1); }
    return VW_TEL[key] = [...seen].filter(x => !by.get(x).living).length; };
  const kl = (a, b) => LINE_KEYS.slice(a, b).map(l => `var(--l${l})`);
  const X = BK_VOORWIE_TEKST, heel = [], tak = [];
  if (TREES.s) { const ps = P("s"), kinderen = TREES.s.rootFull || TREES.s.root, ouders = paar(ps, 2);
    heel.push({ v: "s:p2", tree: "s", start: 2, paar: true, rij: 1, label: fam(ps, 2) || kinderen, kort: ouders, voor: ouders, n: tel("s", 2, true), kleuren: kl(0, 8),
      sub: fill(X.kinderenSub, { ouders, n: tel("s", 2, true) }), titel: fill(X.kinderenTitel, { kinderen, ouders }),
      kopSub: fill(X.kopKinderenSub, { ouders, n: tel("s", 2, true) }), kopTitel: fill(X.kinderenTitel, { kinderen }), ouders }); }
  ["h", "a"].filter(k => TREES[k]).forEach((k, i) => { const ps = P(k), t = TREES[k], n = tel(k, 2, true);
    heel.push({ v: k + ":p2", tree: k, start: 2, paar: true, rij: 2, label: fam(ps, 2) || t.rootFull, kort: paar(ps, 2), voor: paar(ps, 2), n, kleuren: kl(4 * i, 4 * i + 4),
      sub: fill(X.kantSub, { ouders: paar(ps, 2), wie: t.root, n }), titel: fill(X.kantTitel, { wie: t.root, zijn: t.rootMale === false ? "haar" : "zijn" }),
      kopSub: fill(X.kopKantSub, { ouders: paar(ps, 2), n }), kopTitel: fill(X.kopKantTitel, { wie: t.root, zijn: t.rootMale === false ? "haar" : "zijn" }), ouders: paar(ps, 2) }); });
  ["h", "a"].filter(k => TREES[k]).forEach((k, i) => { const ps = P(k); [4, 6].forEach((m, j) => { if (!ps(m) && !ps(m + 1)) return; const n = tel(k, m, true);
    tak.push({ v: k + ":p" + m, tree: k, start: m, paar: true, rij: 3, label: fam(ps, m), kort: paar(ps, m), voor: paar(ps, m), n, kleuren: kl(4 * i + 2 * j, 4 * i + 2 * j + 2),
      sub: fill(X.takSub, { ouders: paar(ps, m), n }), titel: X.takTitel, ouders: paar(ps, m) }); }); });
  return { heel, tak };
}
const bkStartWaarde = S => S.paar ? "p" + S.start : String(S.start);
/* "Voor wie" als gedeeld onderdeel (het boek en de hub #maak): voorWieHtml geeft de opmaak, voorWieBind koppelt hem in een host.
   st = { start, paar, lijn }; o = { id (voorvoegsel voor ids en name), open (de lijst uitgeklapt), zoekOpen, aantal (voorouders) } */
/* the label of the chosen "Voor wie" ("De kant van Harrie"), else the name of the start, for one-line summaries */
/* the value of a start in the fixed choice; kw 1 alone has the same ancestors as the couple 2–3, so it is that card */
const voorWieWaarde = (tree, start, paar) => tree + ":" + (paar ? "p" + start : (start || 1) === 1 ? "p2" : String(start));
function voorWieLabel(st) {
  const tree = st.tree || T.key, v = voorWieWaarde(tree, st.start, st.paar), L = voorWieOpties(), cur = st.persoon ? null : [...L.heel, ...L.tak].find(x => x.v === v); /* chosen as a person: no card */
  if ((st.voor || []).length) { const v = st.voor.map(n => String(n).split(/[\s_]+/).map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(" ")), p = person(st.start), sur = p ? splitName(p.n).sur : ""; return v.length === 1 ? [v[0], sur].filter(Boolean).join(" ") : v.slice(0, -1).join(", ") + " en " + v[v.length - 1]; }
  if (cur) return cur.kort && cur.kort !== cur.label ? `${cur.label} (${cur.kort})` : cur.label;
  if (!PB) return (st.start || 1) > 1 && typeof fkKort === "function" ? fkKort(st.start, !!st.paar) : T.rootFull || T.root; /* without the book core: names only */
  const S = Object.assign(Products.book.empty(), { start: st.start || 1, paar: !!st.paar }), C = bkCore();
  return C.startOn(S) ? (typeof fkKort === "function" ? fkKort(S.start, S.paar) : C.startName(S)) : T.rootFull || T.root; /* short: "Kees de Groot" */
}
/* "Iemand anders…": a search field; after a choice the person as a card (✕ to search again), the chips "Wie staat er centraal?"
   (the person, the partner, the children) and one line with the effect (the title and the number of ancestors). The chips decide
   everything: the person alone, the couple, or one or more children of the couple (then the book is for them: S.voor). */
/* the people of a tree for the person block: the current tree through person(), another (the header with FK: always s) from its data */
const VW_MAP = {};
function vwCtx(tree) {
  if (tree === T.key) return { tree, p: kw => person(kw), t: T };
  const t = TREES[tree], m = VW_MAP[tree] || (VW_MAP[tree] = new Map((t ? t.PEOPLE : []).filter(x => !x.alias).map(x => [x.kw, x])));
  return { tree, p: kw => m.get(kw) || null, t };
}
/* the children of a couple: in s numbering 2 = Harrie and Alies (their children), 4 = Kees and Vronie (Harrie and his brothers and
   sisters), 6 = Franke and Aaltje (Alies and hers); elsewhere the child in the tree */
function vwKinderen(couple, c) {
  const sC = c.tree === "s" ? couple : c.tree in TREE_PRE ? naarS(c.tree, couple) : 0;
  if (sC === 2) return (TREES.h.kids || []).slice();
  if (sC === 4 || sC === 6) { const t = TREES[sC === 4 ? "h" : "a"]; return t ? [t.root, ...(t.sibs || [])].filter(Boolean) : []; }
  const k = c.p(couple >> 1); return k ? [firstName(k)] : [];
}
/* names from the address back to the data (accents and capitals as written there): the children of the couple whose slug matches */
const fkKindNamen = (tree, couple, namen) => { const kids = couple >= 2 ? vwKinderen(couple, vwCtx(tree)) : [];
  return namen.map(n => kids.find(k => fkSlug(k) === fkSlug(n)) || n); };
const VW_KERN = {}; /* a book core per other tree, for the title in the result line */
const vwKern = tree => tree === T.key ? bkCore() : VW_KERN[tree] || (VW_KERN[tree] = Products.book.forTree(Object.assign({ provenYear: {}, short: {}, portraits: {} }, Products.site.treeData(tree)), {}));
function vwPersoonBlok(st, id, o) {
  const X = BK_VOORWIE_TEKST, c = vwCtx(st.tree || T.key), voor = st.voor || [];
  const gekozen = st.persoon && st.start >= 1 && c.p(st.start);
  const veld = `<div class="vw-zoekveld"${gekozen ? " hidden" : ""}>${vwPick(id + "StartZoek", X.zoekVeld, null, o.kop ? X.kopZoek : X.zoekVeld)}</div>`;
  if (!gekozen) return `<div class="bk-zoek vw-zoek" data-vw-zoek="${id}" data-vw-tree="${c.tree}">${veld}</div>`;
  const p = c.p(st.start), kort = q => q ? [firstName(q), splitName(q.n).sur].filter(Boolean).join(" ") : "";
  const couple = st.start >= 2 ? st.start & ~1 : 0, partner = couple ? c.p(st.start ^ 1) : null, kids = couple ? vwKinderen(couple, c) : [];
  const zijde = c.tree === "s" ? (p.side === "a" ? "a" : "h") : c.tree, L = voorWieOpties(), kant = (L.heel.find(x => x.tree === zijde) || {}).label || "";
  const aanP = !voor.length, aan = on => ` aria-pressed="${!!on}"`;
  const chips = [`<button type="button" class="chip vw-chip" data-vw-chip="p:${st.start}"${aan(aanP)}>${esc(firstName(p))}</button>`,
    partner ? `<button type="button" class="chip vw-chip" data-vw-chip="p:${st.start ^ 1}"${aan(aanP && st.paar)}><span aria-hidden="true">⚭ </span>${esc(firstName(partner))}</button>` : "",
    ...kids.map(n => `<button type="button" class="chip vw-chip" data-vw-chip="k:${esc(n)}"${aan(voor.includes(n))}>${esc(n)}</button>`)].join("");
  const S0 = PB ? Object.assign(Products.book.empty(), { start: voor.length ? couple : st.start, paar: voor.length ? true : !!st.paar, persoon: true, voor }) : null; /* without the book core: no title line */
  let titel = "", n = 0; try { const B0 = vwKern(c.tree).options(S0); titel = B0.titel; n = B0.mensen.length; } catch (e) { }
  return `<div class="bk-zoek vw-zoek" data-vw-zoek="${id}" data-vw-tree="${c.tree}" data-couple="${couple}">${veld}
    <div class="vw-pers"><div class="vw-pers-k"><b>${esc(kort(p))}</b><span>${esc([kant, p.living ? "" : lifeYears(p)].filter(Boolean).join(" · "))}</span>
      <button type="button" class="vw-pers-x" data-vw-opnieuw aria-label="${esc(X.opnieuw)}">✕</button></div>
      <p class="op-l" id="${id}-centraal">${esc(X.centraal)}</p><div class="chips vw-chips" role="group" aria-labelledby="${id}-centraal">${chips}</div>
      ${titel ? `<p class="vw-res">${esc(X.resultaat).replace("{titel}", `<i>${esc(titel)}</i>`).replace("{n}", n)}</p>` : ""}</div></div>`;
}
/* the chips and ✕ of every person block (book, products, header): one handler; the place registers its choice in VW_KIES[id] */
const VW_KIES = {};
document.addEventListener("click", e => {
  const x = e.target.closest("[data-vw-opnieuw]"); if (x) { const b = x.closest("[data-vw-zoek]"), f = $(".vw-zoekveld", b), pk = $(".vw-pers", b); if (f) f.hidden = false; if (pk) pk.hidden = true; const i = $("input", f); if (i) i.focus(); return; }
  const c = e.target.closest("[data-vw-chip]"); if (!c) return; const b = c.closest("[data-vw-zoek]"), kies = b && VW_KIES[b.dataset.vwZoek]; if (!kies) return;
  e.preventDefault(); e.stopPropagation();
  const st = new Map($$("[data-vw-chip]", b).map(k => [k.dataset.vwChip, k.getAttribute("aria-pressed") === "true"])), key = c.dataset.vwChip, nu = !st.get(key); st.set(key, nu);
  if (nu && key[0] === "k") [...st.keys()].filter(k => k[0] === "p").forEach(k => st.set(k, false)); /* a child on: the children are central */
  if (nu && key[0] === "p") [...st.keys()].filter(k => k[0] === "k").forEach(k => st.set(k, false)); /* a parent on: the parents */
  const kids = [...st].filter(([k, on]) => on && k[0] === "k").map(([k]) => k.slice(2)), ouders = [...st].filter(([k, on]) => on && k[0] === "p").map(([k]) => +k.slice(2));
  const couple = +b.dataset.couple, tree = b.dataset.vwTree || T.key; /* not data-tree: that one switches trees in the old picker */
  if (kids.length) kies({ tree, start: couple, paar: true, persoon: true, voor: kids });
  else if (ouders.length === 2) kies({ tree, start: couple, paar: true, persoon: true, voor: [] });
  else if (ouders.length === 1) kies({ tree, start: ouders[0], paar: false, persoon: true, voor: [] });
}, true);
function voorWieHtml(st, o = {}) {
  const id = o.id || "vw", tree = st.tree || T.key, v = voorWieWaarde(tree, st.start, st.paar), L = voorWieOpties(), alle = [...L.heel, ...L.tak];
  const cur = st.persoon ? null : alle.find(x => x.v === v), zoekAan = !st.lijn && (!cur || o.zoekOpen);
  /* the book core only when a line needs it (the open pyramid on the overview does not: no book data at startup); without it the pyramid works too */
  const S0 = { start: st.start || 1, paar: !!st.paar }, aan = S0.paar || S0.start > 1; /* = startOn of the core */
  let C0, naam0; const C = () => C0 === undefined ? (C0 = PB ? bkCore() : null) : C0, S = () => C() ? Object.assign(Products.book.empty(), S0) : S0;
  const naam = () => naam0 !== undefined ? naam0 : (naam0 = tree === T.key ? (aan ? (C() ? C().startName(S()) : fkKort(S0.start, S0.paar)) : T.rootFull || T.root) : cur ? cur.label : "");
  const regel = st.lijn || st.persoon || (cur && !o.zoekOpen && (o.open || o.compact)) || !naam() ? "" : `<p class="bk-uitleg">Begint bij ${esc(naam())}${tree === T.key && C() ? ` · ${o.aantal ?? C().members(S()).length} voorouders` : ""}</p>`;
  const zoek = zoekAan || o.compact || o.zoekAltijd ? vwPersoonBlok(Object.assign({}, st, { tree }), id, o) : "";
  if (!o.compact && !o.open && !zoekAan && !st.lijn) /* ingeklapt: de keuze op één regel, met "wijzig" */
    return `<div class="op-f bk-voorwie-dicht" role="group" aria-labelledby="${id}L-voorwie"><span class="op-l" id="${id}L-voorwie">Voor wie</span><div><p class="bk-voorwie-regel"><b>${esc(cur ? cur.label : naam())}</b> <button type="button" class="link" data-voorwie="open" aria-expanded="false">wijzig</button></p>${regel}</div></div>`;
  /* open: the pyramid of family cards (radios inside the cards: arrow keys and screen readers as a radio group) */
  const kaart = (x0, on) => { const x = o.kop ? Object.assign({}, x0, { sub: x0.kopSub || x0.sub, titel: x0.kopTitel || x0.titel }) : x0; return `<button type="button" class="vw-kaart${on ? " vw-aan" : ""}" data-vw-keuze="${x.v}" aria-pressed="${on}"${x.titel ? ` title="${esc(x.titel)}"` : ""}>
      <span class="vw-strook" aria-hidden="true" style="--n:${(x.kleuren || []).length}">${(x.kleuren || []).map(c => `<i style="background:${c}"></i>`).join("")}</span>
      <span class="vw-kt">${on && o.nuLabel && x.v !== "zoek" ? `<i class="vw-nu">${esc(o.nuLabel)}</i>` : ""}<b>${String(x.label).split(" · ").map(n => `<span class="vw-nm">${esc(n)}</span>`).join("&nbsp;· ")}</b><span>${esc(x.sub || "")}</span></span><span class="vw-ok" aria-hidden="true">✓</span></button>`; };
  const rij = (n, xs) => xs.length ? `<div class="vw-rij vw-r${n}">${xs.map(x => kaart(x, !st.lijn && !zoekAan && x === cur)).join("")}</div>` : "";
  const piramide = `<fieldset class="bk-groep-f bk-voorwie vw-piramide" data-vw-id="${id}"><legend class="op-l">${esc(o.kop ? BK_VOORWIE_TEKST.kop : "Voor wie")}</legend><p class="sr-only" aria-live="polite" id="${id}-live"></p>
      ${rij(1, alle.filter(x => x.rij === 1))}${rij(2, alle.filter(x => x.rij === 2))}${rij(3, alle.filter(x => x.rij === 3))}
      <div class="vw-rij vw-ra">${kaart({ v: "zoek", label: BK_VOORWIE_TEKST.zoek, sub: BK_VOORWIE_TEKST.zoekSub }, zoekAan)}</div>${zoek}${regel}</fieldset>`;
  /* compact (the hub): one line "Voor: De Groot · Boersma (vanaf Kees en Vronie) ▾" that opens the same pyramid as a panel
     (on a phone a sheet from below); a choice re-renders the page, so the panel closes by itself */
  if (o.compact) { const wie = cur ? cur.label : naam(), extra = cur ? cur.voor : "";
    return `<div class="vw-compact"><button type="button" class="vw-voor" data-vw-paneel aria-expanded="${!!(o.open || o.zoekOpen)}" aria-controls="${id}-paneel"><span class="vw-voor-t"><span class="vw-voor-l">${esc(BK_VOORWIE_TEKST.voor)}</span> <b>${esc(wie)}</b>${extra ? ` <span class="vw-voor-x">(${esc(extra)})</span>` : ""}</span><span class="vw-pijl" aria-hidden="true">▾</span></button>
      <div class="vw-paneel" id="${id}-paneel" role="dialog" aria-label="${esc(BK_VOORWIE_TEKST.vraag)}"${o.open || o.zoekOpen ? "" : " hidden"}><div class="vw-paneel-kop"><b>${esc(BK_VOORWIE_TEKST.vraag)}</b><button type="button" class="vw-dicht" data-vw-dicht aria-label="Sluiten">×</button></div>${piramide}</div></div>`; }
  return piramide;
}
/* onChange({ tree, start, paar }) bij een keuze (tree kan een andere boom zijn); o.onOpen() bij "wijzig", o.onZoek() bij "Iemand anders…" */
document.addEventListener("click", e => {
  const k = e.target.closest("[data-vw-paneel]"), d = e.target.closest("[data-vw-dicht]"), open = $$(".vw-paneel:not([hidden])");
  if (k) { const p = document.getElementById(k.getAttribute("aria-controls")); if (!p) return; const aan = p.hidden; p.hidden = !aan; k.setAttribute("aria-expanded", String(aan));
    if (aan) { const r = $('[data-vw-keuze][aria-pressed="true"]', p) || $("[data-vw-keuze]", p); if (r) r.focus({ preventScroll: true }); } return; }
  open.forEach(p => { if (d && p.contains(d) || !p.contains(e.target)) { p.hidden = true; const b = $(`[aria-controls="${p.id}"]`); if (b) { b.setAttribute("aria-expanded", "false"); if (d) b.focus(); } } });
});
document.addEventListener("keydown", e => { if (e.key !== "Escape") return; const p = $(".vw-paneel:not([hidden])"); if (!p) return; p.hidden = true; const b = $(`[aria-controls="${p.id}"]`); if (b) { b.setAttribute("aria-expanded", "false"); b.focus(); } });
/* the hub (#maak): one line "Voor: …" with the pyramid in a panel. voorWieRegelBind: onChange({ tree, start, paar }) as voorWieBind;
   a choice in the current tree closes the panel and updates the line in place (the hub refreshes its cards itself); a choice in
   another tree goes through the route as always (the page is drawn again) */
const voorWieRegelHtml = (st, o = {}) => voorWieHtml(st, Object.assign({}, o, { compact: true }));
function voorWieRegelBind(host, o, onChange) {
  const id = o.id || "vw";
  voorWieBind(host, Object.assign({}, o, { onOpen: null, onZoek: () => { const i = $("#" + id + "StartZoek", host); if (i) requestAnimationFrame(() => i.focus()); } }), ch => {
    if (ch.tree && ch.tree !== T.key) { onChange(ch); return; }
    const L = voorWieOpties(), v = voorWieWaarde(T.key, ch.start, ch.paar), x = [...L.heel, ...L.tak].find(y => y.v === v);
    const knop = $(`[aria-controls="${id}-paneel"]`, host), paneel = $("#" + id + "-paneel", host);
    if (knop) { const b = $("b", knop), xs = $(".vw-voor-x", knop), naam = x ? x.label : voorWieLabel({ start: ch.start, paar: ch.paar });
      if (b) b.textContent = naam; if (xs) xs.remove(); if (x && x.voor) b.insertAdjacentHTML("afterend", ` <span class="vw-voor-x">(${esc(x.voor)})</span>`); }
    $$("[data-vw-keuze]", paneel || host).forEach(k => { const on = k.dataset.vwKeuze === v || (!x && k.dataset.vwKeuze === "zoek"); k.classList.toggle("vw-aan", on); k.setAttribute("aria-pressed", String(on)); });
    const live = $("#" + id + "-live", host); if (live) live.textContent = "Gekozen: " + (x ? x.label + (x.voor ? ", " + x.voor : "") : voorWieLabel({ start: ch.start, paar: ch.paar }));
    if (paneel) paneel.hidden = true; if (knop) { knop.setAttribute("aria-expanded", "false"); knop.focus({ preventScroll: true }); }
    onChange(ch);
  });
}
window.voorWieRegelHtml = voorWieRegelHtml; window.voorWieRegelBind = voorWieRegelBind;
/* "Andere familie" in a product wizard (spec.voor): opens the one family choice in the header (after this click, else it closes at once) */
document.addEventListener("click", e => { if (!e.target.closest("[data-fk-wijzig]")) return; e.preventDefault(); setTimeout(() => { const b = $("#tpBtn"); if (b) b.click(); }, 0); }); /* the header is sticky: the panel opens in view */
/* ✕ in the family panel: the dropdown in the header closes with the focus back on its button; in the phone menu the fold-out closes */
document.addEventListener("click", e => { const x = e.target.closest("[data-fk-dicht]"); if (!x) return; e.preventDefault(); e.stopPropagation();
  const det = x.closest("details"); if (det) { det.open = false; const sm = $("summary", det); if (sm) sm.focus(); return; }
  dropClose(true); }, true);
let vwFocusNa = null; /* { id, v }: after a choice the page may be drawn again; the focus goes back to the chosen card */
function voorWieBind(host, o, onChange) {
  const id = o.id || "vw", eigen = el => { const f = el && el.closest("[data-vw-id]"); return f && f.dataset.vwId === id; };
  if (vwFocusNa && vwFocusNa.id === id) { const v = vwFocusNa.v; vwFocusNa = null;
    const b = $(`[data-vw-id="${id}"] [data-vw-keuze="${v}"]`, host), live = $("#" + id + "-live", host), L = voorWieOpties(), x = [...L.heel, ...L.tak].find(y => y.v === v);
    if (b) requestAnimationFrame(() => b.focus({ preventScroll: true })); if (live && x) live.textContent = "Gekozen: " + x.label + (x.voor ? ", " + x.voor : ""); }
  host.addEventListener("click", e => {
    if (e.target.closest("[data-voorwie=open]")) { o.onOpen && o.onOpen(); return; }
    const b = e.target.closest("[data-vw-keuze]"); if (!b || !eigen(b)) return;
    const v = b.dataset.vwKeuze; vwFocusNa = { id, v };
    if (v === "zoek") { $$(`[data-vw-id="${id}"] [data-vw-keuze]`, host).forEach(k => { const on = k === b; k.setAttribute("aria-pressed", String(on)); k.classList.toggle("vw-aan", on); }); o.onZoek && o.onZoek(); return; }
    const [tree, w] = v.split(":"); onChange({ tree, start: +w.replace("p", ""), paar: w[0] === "p" });
  });
  /* arrow keys move the focus through the cards (in reading order), they do not choose */
  host.addEventListener("keydown", e => {
    if (!/^Arrow(Left|Right|Up|Down)$/.test(e.key) && e.key !== "Home" && e.key !== "End") return;
    const b = e.target.closest && e.target.closest("[data-vw-keuze]"); if (!b || !eigen(b)) return;
    const all = $$(`[data-vw-id="${id}"] [data-vw-keuze]`, host), i = all.indexOf(b);
    const n = e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : /Right|Down/.test(e.key) ? Math.min(all.length - 1, i + 1) : Math.max(0, i - 1);
    e.preventDefault(); all[n].focus();
  });
  const inp = $("#" + id + "StartZoek", host); if (!inp) return;
  /* a pick in the current tree (fanKw follows quarter loss) or in another tree (then the route switches tree, as the fixed list does) */
  const zet = (kw, paar, tree = T.key) => {
    if (tree !== T.key) { const P = TREES[tree] ? TREES[tree].PEOPLE : [], has = k => P.some(p => p.kw === k);
      if (!has(kw)) return; if (paar && kw >= 2) { const v = kw & ~1; if (!has(v) && !has(v + 1)) return; onChange({ tree, start: v, paar: true, persoon: true }); } else onChange({ tree, start: kw, paar: false, persoon: true, voor: [] }); return; }
    const k = fanKw(kw); if (!person(k)) return; if (paar && k >= 2) { /* kw 1 heeft geen partner in de boom */ const v = k & ~1; if (!person(v) && !person(v + 1)) return; onChange({ tree: T.key, start: v, paar: true, persoon: true }); } else onChange({ tree: T.key, start: k, paar: false, persoon: true, voor: [] }); };
  vwBind(id + "StartZoek", false, (kw, c) => /* ook levenden als beginpunt: in het boek staat van hen alleen de naam */ { if (kw) zet(kw, false, (c && c.tree) || T.key); }, null, vwFindAlle);
  VW_KIES[id] = ch => onChange(ch); /* the chips "Wie staat er centraal?" */
}
const bkVoorWie = (S, B) => voorWieHtml({ start: S.start, paar: S.paar, persoon: S.persoon, voor: S.voor, lijn: S.lijn }, { id: "bk", open: bkVoorWieOpen || bkWizard(), zoekOpen: bkZoekOpen, aantal: B.mensen.length }); /* the wizard: the pyramid always open */
let bkZoekOpen = false, bkVoorWieOpen = false;
/* link "Maak een boek vanaf hier" voor het profiel (de regel "Vanaf hier:", fb); "" als er boven deze persoon niemand in de boom staat */
function bookFromHereLink(kw) {
  const k = fanKw(kw); if (!person(fanKw(2 * k)) && !person(fanKw(2 * k + 1))) return "";
  return `<a class="link" href="#${T.prefix}boek--vanaf-${k}" data-go="boek--vanaf-${k}">Maak een boek vanaf hier →</a>`;
}
/* de pagina #boek: drie voorinstellingen, wat erin komt, en de overige keuzes ingeklapt; daaronder het voorbeeld, één spread tegelijk */
const bkEcht = {}; /* het echte aantal pagina's per keuze, na het opbouwen van het voorbeeld */
const bkBouw = {}; /* while the preview is being built: the pages so far, when that is more than the estimate (one count on the cards and in the button) */
const bkGroepOpen = new Set(); /* welke ingeklapte groepen open staan */
const bkZelfde = (S, k) => { const P = BK_PRESET[k]; return P.detail === S.detail && P.beeld === S.beeld && P.bron === S.bron && P.hyp === S.hyp && [...P.delen].sort().join() === [...S.delen].sort().join(); };
const bkMet = (S, P) => Object.assign({}, S, { detail: P.detail, beeld: P.beeld, bron: P.bron, hyp: P.hyp, delen: new Set(P.delen) });
/* de sleutel van een keuze voor bkEcht: de hash zonder zuiver en hires */
const bkSleutel = S => T.key + ":" + bkToken(S);
/* the explanation of a preset, with the generation word of its detail level: detail 7 (generation VII) → "oudgrootouders" */
const bkUitleg = P => String(P.uitleg || "").replace("{tot}", P.detail >= 99 ? "alle generaties" : P.detail + " generaties");
const bkTal = (S, deel) => { const e = !deel && bkEcht[bkSleutel(S)]; return e ? `${e} pagina's` : `± ${Math.max(bkSchat(S, deel).totaal, !deel && bkBouw[bkSleutel(S)] || 0)} pagina's`; };
function bkTellingen() {
  const S = bkState, host = $("#v-boek"); if (!host) return;
  $$(".bk-preset", host).forEach(b => { const s = $(".bk-pp", b); if (s) s.textContent = bkTal(bkMet(S, BK_PRESET[b.dataset.bv])); });
  const est = bkSchat(S);
  $$(".bk-pp-deel", host).forEach(x => { const k = x.dataset.deel; x.textContent = est.delen[k] ? `± ${est.delen[k]} p.` : ""; });
  $$("[data-bktal]", host).forEach(x => { x.textContent = bkTal(Object.assign(bkLeeg(), bkCore().parse(x.dataset.bktal))); }); /* the kinds of book in step 2 */
  const t = $("#bkTel"), e = bkEcht[bkSleutel(S)]; if (t && (e || bkBouw[bkSleutel(S)])) t.textContent = `${bkTal(S)} · ${t.dataset.n} voorouders`;
  const pb = $("#bkPast"); if (pb) pb.textContent = S.afloop ? bkHaak("boekPastBij", e || est.totaal) || "" : "";
  const z = $(".bk-eigen .bk-pp", host); if (z) z.textContent = bkTal(S);
}
function renderBoek() {
  if (!PB || typeof Products === "undefined" || !Products.ui || !Products.ui.configurator) { laadFout($("#v-boek"), "Het boek"); return; }
  const S = bkState, B = bkB(), host = $("#v-boek");
  if (typeof mkZetFocus === "function") mkZetFocus({ start: S.start, paar: S.paar, persoon: S.persoon, voor: S.voor }); /* the header follows the book */
  if (S.zuiver) { bkZuiver(B); return; }
  const est = bkSchat(S), maxG = Math.max(...B.mensen.map(bkGen)), dl = bkDelenVan(S), max = BK_MAX[S.afloop] || null;
  const n = B.mensen.length, echt = bkEcht[bkSleutel(S)];
  const eigen = !Object.keys(BK_PRESET).some(k => bkZelfde(S, k));
  const keuze = (grp, lst, cur, tip) => lst.map(([k, l]) => `<button type="button" class="chip" data-bk="${grp}" data-bv="${k}" aria-pressed="${cur(k)}"${tip ? ` title="${esc(tip(k))}" aria-label="${esc(tip(k))}"` : ""}>${esc(l)}</button>`).join("");
  const rij = (label, uitleg, chips) => { const id = "bkL-" + label.toLowerCase().replace(/[^a-z]+/g, "-"); return `<div class="op-f" role="group" aria-labelledby="${id}"><span class="op-l"><span id="${id}">${label}</span>${uitleg ? `<button type="button" class="bk-help" aria-expanded="false" aria-controls="${id}-u" aria-label="Uitleg bij ${esc(label.replace(/^Eén/, "één").replace(/^./, c => c.toLowerCase()))}">?</button>` : ""}</span><div><div class="chips">${chips}</div>${uitleg ? `<p class="bk-help-t" id="${id}-u" hidden>${uitleg}</p>` : ""}</div></div>`; };
  const te = dl.filter(d => max && bkSchat(S, d).totaal > max[1]);
  const delenAan = !S.lijn && (!bkStartAan(S) || bkStartLijnen(S).length > 1);
  const DRUKKER = { "": "Zelf afdrukken", "3": "Saal Digital", blurb: "Blurb", "0": "Peecho" };
  const P0 = Object.entries(BK_PRESET).find(([k]) => bkZelfde(S, k));
  /* 1 Welk boek: voor wie, één familie, in delen */
  const welk = bkVoorWie(S, B)
    + rij("Families", "", keuze("lijn", [["0", "Alle families"], ...LINE_KEYS.filter(l => LINES[l] && (!bkStartAan(S) || bkStartLijnen(S).includes(l))).map(l => [String(l), LINES[l].name])], k => String(S.lijn) === k))
    + (delenAan ? rij("In delen", "Elk deel krijgt een eigen omslag, titelpagina en register.", keuze("split", BK_SPLIT, k => S.split === k)) : "")
    + (dl.length > 1 ? rij("Deel", "", dl.map(d => { const e = bkSchat(S, d).totaal, t = max && e > max[1]; return `<button type="button" class="chip${t ? " bk-te" : ""}" data-bk="deel" data-bv="${d.nr}" aria-pressed="${d.nr === B.deel.nr}">${d.nr}. ${esc(d.naam)} <span class="mono">± ${e} p.</span>${t ? " ⚠" : ""}</button>`; }).join("")) : "")
    + (te.length ? `<p class="bk-waarschuwing">${te.length === dl.length && dl.length === 1 ? "Het boek" : te.length === 1 ? "Eén deel" : te.length + " delen"} ${te.length === 1 ? "komt" : "komen"} boven de ${max[1]} pagina's die ${esc(max[0])} kan drukken. Kies minder onderdelen, Compact, of het boek in delen.</p>` : "");
  /* 2 Hoe uitgebreid: voorinstellingen, met daaronder ingeklapt wat erin komt */
  const omvang = `<div class="bk-presets" role="group" aria-label="Voorinstelling">${Object.entries(BK_PRESET).map(([k, P]) => `<button type="button" class="bk-preset" data-bk="preset" data-bv="${k}" aria-pressed="${bkZelfde(S, k)}"><b>${esc(P.naam)}</b><span class="bk-pp">${bkTal(bkMet(S, P))}</span></button>`).join("")}</div>
    ${eigen ? `<p class="bk-eigen"><b>Eigen keuze</b> <span class="bk-pp">${bkTal(S)}</span> <button type="button" class="link" data-bk="preset" data-bv="standaard">Terug naar Standaard</button></p>` : `<p class="bk-uitleg">${esc(P0 ? bkUitleg(P0[1]) : "")}</p>`}
    <details class="bk-hoe bk-wat" data-groep="wat"${bkGroepOpen.has("wat") ? " open" : ""}><summary>Wat komt erin</summary>
    <fieldset class="bk-delen"><legend class="sr-only">Wat komt erin</legend>${BK_DELEN.filter(([k]) => (k !== "kruis" || (T.key === "s" && !S.lijn && !bkStartAan(S))) && (k !== "leven" || S.soort === "gedenk")).map(([k, l, u]) => `<label class="bk-deel-keuze"><input type="checkbox" data-bkdeel="${k}"${S.delen.has(k) ? " checked" : ""}><span><b>${esc(l)}</b><small>${esc(u)}</small></span><span class="bk-pp bk-pp-deel" data-deel="${k}">${est.delen[k] ? `± ${est.delen[k]} p.` : ""}</span></label>`).join("")}</fieldset></details>`;
  /* 3 Omslag */
  const omslag = `<div class="chips" role="group" aria-label="Omslag">${BK_OMSLAG.map(([k, l, u]) => `<button type="button" class="chip bk-omslag-k" data-bk="omslag" data-bv="${k}" aria-pressed="${S.omslag === k}" title="${esc(u)}">${typeof window.boekOmslagMini === "function" ? `<span class="bk-mini" aria-hidden="true">${window.boekOmslagMini(k)}</span>` : ""}<span>${esc(l)}</span></button>`).join("")}</div><p class="small bk-omslag-uitleg">${esc((BK_OMSLAG.find(o => o[0] === S.omslag) || BK_OMSLAG[0])[2])}</p>`;
  /* 4 Details en drukker (ingeklapt) */
  /* full profiles up to a generation, in words ("de oudgrootouders"); the Roman number and the count in the title */
  const genWoord = g => (genPre(g - 1) || "voor") + "ouders", volG = g => B.mensen.filter(k => bkGen(k) <= g).length;
  const detG = [...[5, 7, 9].filter(g => g < maxG).map(g => [String(g), g + " generaties"]), ["99", "Iedereen"]];
  const detTip = k => k === "99" ? `Iedere voorouder een volledig profiel: ${B.mensen.length} voorouders` : `Tot en met generatie ${ROMAN[+k]}: ${volG(+k)} voorouders met een volledig profiel; daarboven kort`;
  const details = rij("Volledige profielen", "Tot en met deze generatie een volledig profiel; wie verder terug ligt, staat er kort in.", keuze("detail", detG, k => String(S.detail >= 99 ? 99 : S.detail) === k, detTip))
    + rij("Hypotheses", "", keuze("hyp", BK_HYP, k => S.hyp === k))
    + rij("Bronnen", "", keuze("bron", BK_BRON, k => S.bron === k))
    + rij("Beelden", "", keuze("beeld", BK_BEELD, k => S.beeld === k))
    + rij("Formaat", "", keuze("formaat", BK_FORMAAT, k => S.formaat === k))
    + rij("Drukker", "Een drukker snijdt na het drukken een smalle rand van het papier. Kies je drukker: dan krijgt de pdf precies de rand die hij nodig heeft.", keuze("afloop", BK_AFLOOP.map(([k]) => [k, DRUKKER[k] || k]), k => S.afloop === k))
    + (bkHaak("bookPrintFields", B) || "") + `<div class="bk-controle-lang" id="bkControleLang"></div>`;
  const samen = [(BK_FORMAAT.find(f => f[0] === S.formaat) || BK_FORMAAT[0])[1], DRUKKER[S.afloop] || "", S.detail >= 99 ? "iedereen volledig" : S.detail + " generaties volledig"].filter(Boolean).join(" · ");
  const tel = echt ? `${echt} pagina's` : `± ${est.totaal} pagina's`;
  const wiz = bkWizard(), stapId0 = BK_STAPPEN[bkStap - 1] || "which", stapId = wiz && stapId0 === "which" ? "kind" : stapId0; /* "Voor wie" is the global choice in the header now */
  /* the wizard: one question per step, the finer choices under "Zelf kiezen"; the same parts as the configurator below */
  const wizStappen = () => {
    const fmt = (BK_FORMAAT.find(f => f[0] === S.formaat) || BK_FORMAAT[0])[1], cov = (BK_OMSLAG.find(o => o[0] === S.omslag) || [, ""])[1];
    const woord = (id, eigen) => eigen || ((Products.STEP_WORDS || {})[id] || [])[0] || id; /* the step names of the register, as for the poster */
    /* step 2, the kind of book: the book products of the register (as on the hub), each a link to the same book in that kind */
    const SOORT_PRODUCT = { verhalen: "book-stories", kwartierstaat: "book-pedigree", onderzoek: "book-research", foto: "book-photo", gedenk: "book-memorial" };
    const soortNu = S.soort ? SOORT_PRODUCT[S.soort] : S.split === "familie" ? "book-branches" : "book";
    const naarSoort = p => { const S2 = Object.assign({}, S, { delen: new Set(S.delen) }), tok = p.pageToken || "";
      if (/^preset-/.test(tok)) PB.applyPreset(S2, tok.slice(7));
      else { if (S.soort) PB.applyPreset(S2, "standaard"); if (tok === "in-familie") Object.assign(S2, { split: "familie", lijn: 0, deelNr: 1 }); else if (S2.split === "familie") Object.assign(S2, { split: "een", deelNr: 1 }); }
      return S2; };
    const soorten = (Products.list ? Products.list({ category: "books" }) : []).filter(p => p.page === "boek" && p.status !== "planned" && (p.id !== "book-branches" || (!S.lijn && bkStartLijnen(S).length > 1)));
    const soortLabel = (soorten.find(p => p.id === soortNu) || {}).label || "";
    const kind = () => `<ul class="pw-soorten">${soorten.map(p => { const S2 = naarSoort(p), on = p.id === soortNu;
      let mini = ""; try { if (typeof window.bookCoverDoc === "function") mini = bkOmslagIframe(window.bookCoverDoc(bkCore().options(S2), { part: "front" }), 56, "Voorkant: " + p.label); } catch (e) { }
      return `<li><a class="pw-soort" href="#${T.prefix}${bkCore().format(S2)}"${on ? ' aria-current="true"' : ""}><span class="pw-soort-mini" aria-hidden="true">${mini}</span><span class="pw-soort-t"><b>${esc(p.label)}</b><span>${esc(p.promise || "")}</span><small class="bk-pp" data-bktal="${esc(bkCore().format(S2))}">${bkTal(S2)}</small></span></a></li>`; }).join("")}</ul>`;
    /* step 3, the size: how extensive (only for the family book and the booklets; a kind sets its own), the format and the full profiles */
    const omvangAan = !S.soort, kort = ["compact", "standaard", "volledig"];
    const size = () => (omvangAan ? rij("Hoe uitgebreid", "", `<div class="bk-presets pw-omvang">${kort.map(k => `<button type="button" class="bk-preset" data-bk="preset" data-bv="${k}" aria-pressed="${bkZelfde(S, k)}"><b>${esc(BK_PRESET[k].naam)}</b><span class="bk-pp">${bkTal(bkMet(S, BK_PRESET[k]))}</span></button>`).join("")}</div>`)
        + (eigen ? `<p class="bk-eigen"><b>Eigen keuze</b> <span class="bk-pp">${bkTal(S)}</span> <button type="button" class="link" data-bk="preset" data-bv="standaard">Terug naar Standaard</button></p>` : `<p class="bk-uitleg">${esc(P0 ? bkUitleg(P0[1]) : "")}</p>`) : "")
      + rij("Formaat", "", keuze("formaat", BK_FORMAAT, k => S.formaat === k))
      + rij("Volledige profielen", "Tot en met deze generatie een volledig profiel; wie verder terug ligt, staat er kort in.", keuze("detail", detG, k => String(S.detail >= 99 ? 99 : S.detail) === k, detTip));
    const inhoud = () => rij("Families", "", keuze("lijn", [["0", "Alle families"], ...LINE_KEYS.filter(l => LINES[l] && (!bkStartAan(S) || bkStartLijnen(S).includes(l))).map(l => [String(l), LINES[l].name])], k => String(S.lijn) === k))
      + (delenAan ? rij("Eén of twee delen", "Elk deel krijgt een eigen omslag, titelpagina en register. Een boekje per familie is de soort Familieboekjes.", keuze("split", BK_SPLIT.filter(([k]) => k !== "familie" || S.split === "familie").map(([k, l]) => [k, k === "kanten" ? "Twee delen: vaders en moeders kant" : l]), k => S.split === k)) : "")
      + (dl.length > 1 ? rij("Deel", "", dl.map(d => { const e = bkSchat(S, d).totaal, t = max && e > max[1]; return `<button type="button" class="chip${t ? " bk-te" : ""}" data-bk="deel" data-bv="${d.nr}" aria-pressed="${d.nr === B.deel.nr}">${d.nr}. ${esc(d.naam)} <span class="mono">± ${e} p.</span>${t ? " ⚠" : ""}</button>`; }).join("")) : "");
    const fijn = () => inhoud() + `<fieldset class="bk-delen"><legend class="op-l">Wat komt erin</legend>${BK_DELEN.filter(([k]) => (k !== "kruis" || (T.key === "s" && !S.lijn && !bkStartAan(S))) && (k !== "leven" || S.soort === "gedenk")).map(([k, l, u]) => `<label class="bk-deel-keuze"><input type="checkbox" data-bkdeel="${k}"${S.delen.has(k) ? " checked" : ""}><span><b>${esc(l)}</b><small>${esc(u)}</small></span><span class="bk-pp bk-pp-deel" data-deel="${k}">${est.delen[k] ? `± ${est.delen[k]} p.` : ""}</span></label>`).join("")}</fieldset>`
      + rij("Hypotheses", "", keuze("hyp", BK_HYP, k => S.hyp === k)) + rij("Bronnen", "", keuze("bron", BK_BRON, k => S.bron === k)) + rij("Beelden", "", keuze("beeld", BK_BEELD, k => S.beeld === k));
    /* step 5: the printer; the spine only with a printer that trims (a printed cover) */
    const klaar = () => rij("Drukker", "Een drukker snijdt na het drukken een smalle rand van het papier. Kies je drukker: dan krijgt de pdf precies de rand die hij nodig heeft.", keuze("afloop", BK_AFLOOP.map(([k]) => [k, DRUKKER[k] || k]), k => S.afloop === k))
      + (S.afloop ? bkDrukkerRegel(S, echt || est.totaal) : "") + bkBestel(S, soortNu)
      + (S.afloop ? bkHaak("bookPrintFields", B) || "" : "") + `<div class="bk-controle-lang" id="bkControleLang"></div>`;
    const i = BK_STAPPEN.indexOf(stapId), alleen = (id, f) => id === stapId ? f() : ""; /* the shell shows only the current step: build only that one */
    return { steps: [
      { id: "which", skip: true, title: woord("which"), question: BK_VOORWIE_TEKST.vraag, summary: "", html: "" }, /* hidden: not in the shown numbering, nor in --stap-N */
      { id: "kind", title: woord("kind"), question: "Wat voor boek wordt het?", summary: soortLabel, html: alleen("kind", kind) },
      { id: "size", title: woord("size"), question: "Hoe groot wordt het?", summary: [fmt, omvangAan ? (P0 ? P0[1].naam : "eigen keuze") : ""].filter(Boolean).join(" · "), html: alleen("size", size) },
      { id: "look", title: woord("look", "Omslag"), question: "Welke omslag?", summary: cov, html: alleen("look", () => omslag) },
      { id: "ready", title: woord("ready"), question: "Waar laat je het drukken?", summary: DRUKKER[S.afloop] || "", html: alleen("ready", klaar) }].map((x, k) => Object.assign(x, { done: k < i })),
      current: stapId, href: id => T.prefix + bkCore().format(S) + (BK_STAPPEN.indexOf(id) > 1 ? "--stap-" + BK_STAPPEN.indexOf(id) : ""), /* the step as shown; the first needs none */
      voor: bkVoorRegel(S), previewKey: T.key + "|" + bkCore().format(Object.assign({}, S, { omslag: "b" })), more: stapId === "size" ? { label: "Zelf kiezen: wat erin komt, hypotheses, bronnen en beelden", html: fijn(), open: bkGroepOpen.has("fijn") } : null };
  };
  /* the fixed line at the top: for whom (the one global choice), as card, person or "Voor Andre" */
  const bkVoorRegel = S => Object.assign(bkVoorRegel0(S), { kleuren: (() => { const r = naarSvan(S.start); return r ? fkKleurenS(S.paar || (S.voor || []).length ? [r, r + 1] : [r]) : []; })() });
  const bkVoorRegel0 = S => { const L = voorWieOpties(), alle = [...L.heel, ...L.tak], kaart = v => alle.find(x => x.v === v);
    const fs = fkStart({ kw: 1 }); /* the book of the family chosen in the header: the same words as the header, the poster and the calendar ("De Groot · De Vries") */
    if (fs && !S.lijn && !S.persoon && ((S.start || 1) === 1 && !S.paar || S.start === fs.kw && !!S.paar === !!fs.pair)) return { label: fkLabel() }; /* the whole focus tree, or its couple */
    if ((S.voor || []).length) { const x = kaart(voorWieWaarde(T.key, S.start, true)); return { label: voorWieLabel({ start: S.start, paar: true, voor: S.voor }), sub: x ? x.label : "" }; }
    if (S.persoon) return { label: fkKort(S.start, S.paar) };
    const x = kaart(voorWieWaarde(T.key, S.start, S.paar)); if (S.lijn && LINES[S.lijn]) return { label: "De familie " + LINES[S.lijn].name, sub: x ? x.label : "" };
    return x ? { label: x.label, sub: x.ouders } : { label: voorWieLabel({ start: S.start, paar: S.paar }) }; };
  const spec = {
    title: (Products.products[{ verhalen: "book-stories", kwartierstaat: "book-pedigree", onderzoek: "book-research", foto: "book-photo", gedenk: "book-memorial" }[S.soort] || (S.split === "familie" ? "book-branches" : "book")] || {}).label || "Het familieboek", lede: "", /* the kind of book, as on the hub */
    steps: [{ id: "welk", title: "Welk boek", html: welk }, { id: "omvang", title: "Hoe uitgebreid", html: omvang }, { id: "omslag", title: "Omslag", html: omslag },
      { id: "details", title: "Details en drukker", collapsed: true, open: bkGroepOpen.has("details") || !!S.afloop || S.formaat !== "a4", summary: samen, html: details }],
    preview: `<div class="bk-voorbeeld" style="${(() => { const [w, h] = (BK_FORMAAT.find(f => f[0] === S.formaat) || BK_FORMAAT[0])[3].split(" ").map(parseFloat); return `--bk-spread:${2 * w + 20}/${h + 20};--bk-page:${w + 20}/${h + 20}`; })()}">
      <div class="bk-bezig" id="bkBezig"><span class="sr-only" role="status">Het voorbeeld wordt opgebouwd.</span><p aria-hidden="true">Opbouwen … <span id="bkBezigN">0</span> / <span id="bkBezigT">± ${echt || est.totaal}</span></p><div class="bk-balk"><i id="bkBalk"></i></div><button type="button" class="btn" data-bkstop="stop">Stoppen</button></div>
      <iframe id="bkFrame" title="Voorbeeld van het boek, per spread"></iframe>
      <div class="bk-omslag-vak" id="bkOmslagVak" hidden></div>
      <div class="bk-blad" id="bkBlad" hidden><button type="button" class="btn bk-pijl" data-bkblad="-" aria-label="Vorige pagina">‹</button><span class="mono small" id="bkBladNr"></span><button type="button" class="btn bk-pijl" data-bkblad="+" aria-label="Volgende pagina">›</button>
        <label class="bk-hfst-kies"><span class="sr-only">Hoofdstuk</span><select id="bkHfst" aria-label="Hoofdstuk"></select></label><span class="bk-modus" role="group" aria-label="Pagina's naast elkaar"><button type="button" class="btn bk-pijl" data-bkmodus="1" aria-pressed="false" title="Eén pagina">1</button><button type="button" class="btn bk-pijl" data-bkmodus="2" aria-pressed="false" title="Twee pagina's naast elkaar">2</button></span>${typeof window.bookCoverDoc === "function" ? `<button type="button" class="btn bk-omslag-knop" data-bkblad="omslag" aria-pressed="false">Omslag</button>` : ""}${document.fullscreenEnabled ? `<button type="button" class="btn bk-pijl" data-bkblad="groot" aria-label="Hele scherm" title="Hele scherm">⤢</button>` : ""}</div>
    </div>`,
    actions: {
      status: `<span id="bkTel" data-n="${n}" aria-live="polite">${tel} · ${n} voorouders</span><span id="bkControle" class="bk-controle"></span><span class="small" id="bkPast">${S.afloop ? esc(bkHaak("boekPastBij", echt || est.totaal) || "") : ""}</span>`,
      buttons: `<button type="button" class="btn primary" id="bkPdf" aria-label="Maak pdf om zelf te laten drukken" disabled>Even geduld…</button>${S.afloop ? bkHaak("bookPrintActions", B) || "" : ""}`,
      help: `<details class="bk-hoe bk-hoe-pdf"><summary aria-label="Hoe sla ik het op als pdf?">?</summary><div class="bk-hoe-t"><b>Opslaan als pdf</b><ol><li>${esc(Products.PRINT_HELP || "Kies in het afdrukvenster ‘Opslaan als pdf’, marges ‘geen’, achtergrond aan.")}</li><li>Schaal: 100 %. De paginamaat${S.afloop ? ", met afloop," : ""} staat al goed.</li></ol>${S.afloop ? `<p>Voor de drukker: dit is het binnenwerk; de omslag maak je los met "Maak omslag-pdf".</p>` : `<p>Het hele boek, met voor- en achterkant. In een pdf uit Chrome of Edge zijn de inhoud en het register klikbaar; in Safari niet altijd.</p>`}</div></details>`
    }
  };
  const root = wiz ? Products.ui.wizard(host, Object.assign(spec, wizStappen())) : Products.ui.configurator(host, spec);
  if (wiz) { const pdf = $("#bkPdf"); if (pdf) pdf.classList.toggle("primary", stapId === "ready"); } /* one primary button: Volgende, and on the last step Maak pdf */
  $$("details[data-groep], details.pc-step, details.pw-meer", root).forEach(d => d.addEventListener("toggle", () => { const g = d.dataset.groep || d.dataset.step || "fijn"; d.open ? bkGroepOpen.add(g) : bkGroepOpen.delete(g); }));
  bkVoorWieKoppel(root, S);
  if ($(".bk-omslag-k", root)) bkOmslagMinis(); /* the real covers on the chips, also when only the step changed */
  if (bkFocusNa) { const f = $(bkFocusNa); bkFocusNa = ""; if (f) requestAnimationFrame(() => f.focus({ preventScroll: true })); } /* the focus back on the choice */
  if (root.dataset.kept) return; /* only the step changed: the preview, its pages and the pdf button stay */
  const fr = $("#bkFrame"); fr.dataset.totaal = echt || est.totaal;
  /* eerst het paneel tekenen, dan (na een frame en een pauze) in een eigen taak de tekst van het boek: zo zitten er nooit twee lange taken achter elkaar */
  requestAnimationFrame(() => setTimeout(() => bkLaadVoorbeeld(fr, B), 60));
  $("#bkPdf").onclick = () => { try { /* de browser stelt de titel van het document voor als bestandsnaam (en zet hem in de pdf): tijdens het afdrukken de nette titel zonder verboden tekens */
    const d = fr.contentDocument, t = d.title; d.title = B.bestand.replace(/\.pdf$/, "") + (B.druk ? " – binnenwerk" : ""); fr.contentWindow.addEventListener("afterprint", () => { d.title = t; }, { once: true });
    fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { } };
  $("#bkHfst").onchange = e => { const v = e.target.value; if (v) bkBlader(v); };
}
/* "Voor wie" in the book panel: open the list, search someone, or pick; a pick in another tree switches tree */
function bkVoorWieKoppel(root, S) {
  voorWieBind(root, { id: "bk", current: () => ({ start: S.start, paar: S.paar }),
    onOpen: () => { bkVoorWieOpen = true; rendered.boek = false; renderBoek(); setTimeout(() => { const r = $('#v-boek [data-vw-keuze][aria-pressed="true"]') || $('#v-boek [data-vw-keuze]'); if (r) r.focus(); }, 30); },
    onZoek: () => { bkZoekOpen = true; rendered.boek = false; renderBoek(); setTimeout(() => { const i = $("#bkStartZoek"); if (i) i.focus(); }, 30); } },
    ({ tree, start, paar, persoon, voor }) => { bkGekozen = true; bkSprong = ""; bkVoorWieOpen = false; bkZoekOpen = !!persoon;
      if (tree && tree !== T.key && TREES[tree]) { const S2 = Object.assign({}, S, { delen: new Set(S.delen), start, paar, persoon: !!persoon, voor: voor || [], lijn: 0, deelNr: 1, split: "een" }); location.hash = "#" + TREES[tree].prefix + bkToken(S2); return; }
      S.start = start; S.paar = paar; S.persoon = !!persoon; S.voor = voor || []; S.lijn = 0; S.deelNr = 1; if (bkStartLijnen(S).length < 2) S.split = "een"; go(bkToken(), { keepScroll: true }); });
}
RENDER.boek = renderBoek;
/* weg van #boek: het voorbeeld opruimen, zodat Paged.js niet doorrekent in een verborgen iframe; terug op #boek bouwt het opnieuw */
new MutationObserver(() => { const v = $("#v-boek"); if (v && v.hidden && $("#bkFrame", v)) { v.innerHTML = ""; rendered.boek = false; } }).observe($("#v-boek"), { attributes: true, attributeFilter: ["hidden"] });
addEventListener("message", e => {
  const t = $("#bkTel"), b = $("#bkPdf"), fr = $("#bkFrame"); if (!e.data || !t || !fr || e.source !== fr.contentWindow) return;
  const d = e.data;
  if (d.boek === "fout") { t.textContent = "Het boek kan alleen in de volledige site worden gemaakt, niet in deze losse versie."; $("#bkBezig").hidden = true; if (b) b.textContent = "Maak pdf om zelf te laten drukken"; return; }
  if (d.boek === "geladen") { bkVulVoorbeeld(fr); return; }
  if (d.boek === "bezig") { const n = $("#bkBezigN"), i = $("#bkBalk"), tt = $("#bkBezigT"), tot = Math.max(d.paginas, +fr.dataset.totaal || 0); /* the estimate grows with the count, never below it */
    if (n) n.textContent = d.paginas; if (tt) tt.textContent = "± " + tot; if (i) i.style.width = Math.min(100, d.paginas / (tot || 1) * 100) + "%";
    const pc = fr.closest(".pc"), verborgen = innerWidth < 1024 && pc && pc.dataset.tab !== "voorbeeld"; /* the count in the button only while the preview is out of view (phone, tab Keuzes) */
    const k = bkSleutel(bkState); if (d.paginas > (bkBouw[k] || bkSchat(bkState).totaal)) { bkBouw[k] = d.paginas; bkTellingen(); } /* the cards follow the count */
    if (b && b.disabled) b.textContent = verborgen ? `Opbouwen: ${d.paginas} p.` : "Even geduld…"; return; }
  if (d.boek === "blad") { $$("[data-bkmodus]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.bkmodus === (d.spread ? "2" : "1")))); if (!fr.dataset.geopend) { fr.dataset.geopend = "1"; const tp = +fr.dataset.sprong || 0; bkSprong = ""; if (tp > 1) { bkBlader(String(tp)); return; } } /* openen op de omslag, of waar de laatste keuze over ging */
    const nr = $("#bkBladNr"); if (nr) nr.textContent = d.van === d.tot ? `pagina ${d.van} van ${d.totaal}` : `pagina ${d.van}–${d.tot} van ${d.totaal}`;
    $$("#bkBlad [data-bkblad]").forEach(x => { if (x.dataset.bkblad === "-") x.disabled = d.van <= 1; if (x.dataset.bkblad === "+") x.disabled = d.tot >= d.totaal; }); return; }
  if (d.boek === "klaar") {
    const ruw = bkSchat(bkState).ruw; if (ruw > 20) { bkKal[T.key] = d.paginas / ruw; try { localStorage.setItem("stamboom-boek-kal", JSON.stringify(bkKal)); } catch (x) { } }
    bkEcht[bkSleutel(bkState)] = d.paginas; bkTellingen(); try { bkPaginaNrs(fr.contentDocument); } catch (x) { }
    if (bkGekozen) { bkGekozen = false; const tt = t.textContent; t.textContent = "Voorbeeld bijgewerkt"; setTimeout(() => { if (t.isConnected && t.textContent === "Voorbeeld bijgewerkt") t.textContent = tt; }, 1500); }
    if (b) { b.disabled = true; b.textContent = "Even geduld…"; }
    /* na de opmaak: de waaier als vector en de platen op lege pagina's (boekNaKlaar, sectie omslag en beeld); pas daarna afdrukken */
    Promise.resolve(typeof window.boekNaKlaar === "function" ? window.boekNaKlaar(fr.contentDocument, bkCurB || bkB()) : null).catch(() => { })
      .then(() => { bkLeegVullen(fr); if (b && b.isConnected) { b.disabled = false; b.innerHTML = `Maak pdf<span class="bk-lang">&nbsp;om zelf te laten drukken</span>`; } });
    /* de controle vooraf voor de drukker (beelden, fonts, pagina's): van de sectie omslag en beeld */
    const ctl = $("#bkControle"), lang = $("#bkControleLang"), chk = window.bookPrintCheck || window.boekControle;
    if (ctl && typeof chk === "function") Promise.resolve(chk(fr.contentDocument, bkCurB || bkB(), { short: true })).then(h => { h = !bkState.afloop ? String(h || "").replace("Klaar voor de drukker", "Klaar om af te drukken") : h;
      const te = bkTeDik(bkState, (d && d.paginas) || +fr.dataset.totaal || 0); if (te) h = "Te dik voor " + te[0]; /* the page limit of the chosen printer first */
      if (ctl.isConnected) ctl.textContent = h || ""; ctl.classList.toggle("bk-let-op", /^Let op|^Te dik/.test(h || "")); }).catch(() => { });
    if (lang && typeof chk === "function") Promise.resolve(chk(fr.contentDocument, bkCurB || bkB())).then(h => { if (lang.isConnected) lang.innerHTML = h || ""; }).catch(() => { });
    $("#bkBezig").hidden = true; $("#bkBlad").hidden = false;
    try { bkHoofdstukken(fr); bkOmslagMinis(); } catch (x) { }
  }
});
/* de omslag in het voorbeeld (89: bookCoverDoc), als geschaalde iframes; book-css heeft @page-regels, dus een eigen document */
function bkOmslagIframe(doc, breedte, titel) {
  const pxW = doc.wMm * 96 / 25.4, pxH = doc.hMm * 96 / 25.4, k = breedte / pxW;
  return `<div class="bk-omslag-blad" style="width:${Math.round(pxW * k)}px;height:${Math.round(pxH * k)}px"><iframe title="${esc(titel)}" tabindex="-1" style="width:${pxW}px;height:${pxH}px;transform:scale(${k})" srcdoc="${esc(doc.html)}"></iframe></div>`;
}
function bkOmslagTonen(aan) {
  const fr = $("#bkFrame"), vak = $("#bkOmslagVak"); if (!fr || !vak) return;
  fr.hidden = aan; $$("#bkBlad [data-bkblad='-'], #bkBlad [data-bkblad='+'], #bkBladNr, .bk-hfst-kies").forEach(x => x.hidden = aan); vak.hidden = !aan;
  if (!aan) { vak.innerHTML = ""; return; }
  const B = bkCurB || bkB(), S = bkState, pages = bkEcht[bkSleutel(S)] || bkSchat(S).totaal, w = vak.parentElement.clientWidth || 600;
  const o = { spineMm: typeof window.bookSpineMm === "function" ? window.bookSpineMm(pages) : 0, bleedMm: S.afloop ? (S.afloop === "blurb" ? 3.175 : S.afloop === "0" ? 0 : 3) : 0, pages };
  try {
    vak.innerHTML = innerWidth < 1024
      ? bkOmslagIframe(window.bookCoverDoc(B, Object.assign({ part: "front" }, o)), Math.min(w, 420), "Voorkant van de omslag") + `<p class="bk-uitleg">Achterkant</p>` + bkOmslagIframe(window.bookCoverDoc(B, Object.assign({ part: "back" }, o)), Math.min(w * .45, 200), "Achterkant van de omslag")
      : bkOmslagIframe(window.bookCoverDoc(B, Object.assign({ part: "spread" }, o)), w, "De hele omslag: achterkant, rug en voorkant") + `<p class="bk-uitleg">Achterkant · rug (${String(Math.round(o.spineMm * 10) / 10).replace(".", ",")} mm, bij ${pages} pagina's) · voorkant</p>`;
  } catch (e) { vak.innerHTML = `<p class="bk-uitleg">De omslag kan hier niet worden getoond.</p>`; }
}
/* echte kleine omslagen bij de keuze, pas als het voorbeeld klaar is (in rust, één tegelijk) */
/* the real small covers on the cover chips: after the preview is ready and after every change of step; cached per choice */
const bkMiniCache = new Map();
function bkOmslagMinis() {
  if (typeof window.bookCoverDoc !== "function") return;
  const chips = $$(".bk-omslag-k"); let i = 0;
  const volgende = () => { const c = chips[i++]; if (!c || !c.isConnected) return; const k = c.dataset.bv, m = $(".bk-mini", c);
    try { const S2 = Object.assign({}, bkState, { delen: new Set(bkState.delen), omslag: k }), key = T.key + "|" + bkCore().format(S2);
      let html = bkMiniCache.get(key); if (!html) { html = bkOmslagIframe(window.bookCoverDoc(bkCore().options(S2), { part: "front" }), 72, ""); bkMiniCache.set(key, html); }
      if (m && m.dataset.key !== key) { m.innerHTML = html; m.dataset.key = key; } } catch (e) { }
    later(volgende); };
  const later = f => window.requestIdleCallback ? requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 200);
  later(volgende);
}
/* het voorbeeld laden: eerst een leeg document, dan per hoofdstuk een eigen taak, dan Paged.js */
function bkLaadVoorbeeld(fr, B) { if (!fr.isConnected) return; fr._delen = bkCore().build(B, { lazy: true }); fr.srcdoc = bkDocument(B, true); }
function bkVulVoorbeeld(fr) {
  let doc; try { doc = fr.contentDocument; } catch (e) { return; }
  const delen = fr._delen || (fr._delen = bkCore().build(bkCurB || bkB(), { lazy: true })); let i = 0;
  const stap = () => { if (!fr.isConnected || fr.contentDocument !== doc) return; if (i < delen.length) { const h = delen[i++](); if (h) doc.body.insertAdjacentHTML("beforeend", h + "\n"); setTimeout(stap, 0); } else fr.contentWindow.bkStart(); };
  stap();
}
/* de keuzelijst "Hoofdstuk" onder het voorbeeld: titelpagina, inhoud, elke familie en de losse hoofdstukken, met hun pagina */
function bkHoofdstukken(fr) {
  let doc; try { doc = fr.contentDocument; } catch (e) { return; } const sel = $("#bkHfst"); if (!doc || !sel) return;
  const P = [...doc.querySelectorAll(".pagedjs_page")], pag = el => { const pg = el && el.closest(".pagedjs_page"); return pg ? P.indexOf(pg) + 1 : 0; };
  const titel = doc.querySelector(".bk-titelblad, .bk-titel"), omslag = doc.querySelector(".bk-omslag"), fam = /^lijn-(\d+)$/.exec(bkSprong);
  /* standaard op de voorkant (pagina 1), anders de titelpagina; na een familiekeuze haar opening */
  fr.dataset.sprong = fam && doc.getElementById("bk-lijn-" + fam[1]) ? pag(doc.getElementById("bk-lijn-" + fam[1])) : omslag ? 1 : pag(titel);
  const lijst = [[titel, "Titelpagina"], [doc.querySelector(".bk-inhoud, #bk-inhoud"), "Inhoud"],
    ...[...doc.querySelectorAll(".bk-hfst[id]")].filter(h => !h.matches(".bk-titelblad, .bk-titel, .bk-inhoud")).map(h => [h, h.classList.contains("bk-fam") ? "Familie " + (h.dataset.kopL || "") : h.dataset.kopL || (h.querySelector("h1") || {}).textContent || ""])]
    .filter(([el, t]) => el && t).map(([el, t]) => [pag(el), t.trim()]).filter(([p], i, a) => p && a.findIndex(x => x[0] === p && x[1] === a[i][1]) === i);
  sel.innerHTML = `<option value="">Hoofdstuk …</option>` + lijst.map(([p, t]) => `<option value="${p}">${esc(t)} · p. ${p}</option>`).join("");
}
/* paginanummers in inhoud en register (.bk-pn[href]) na de opmaak: het nummer van de pagina waar het doel begint */
function bkPaginaNrs(doc) {
  $$(".bk-pn[href]", doc).forEach(e => {
    const id = e.getAttribute("href").slice(1), t = doc.getElementById(id) || doc.querySelector(`[data-id="${CSS.escape(id)}"]`), pg = t && t.closest(".pagedjs_page");
    e.dataset.pn = pg ? pg.dataset.pageNumber || String([...doc.querySelectorAll(".pagedjs_page")].indexOf(pg) + 1) : "";
  });
}
/* een lege linkerpagina vóór een familieopening krijgt een plaat uit de streek (boekLeegPlaat); het aantal pagina's verandert niet */
function bkLeegVullen(fr) {
  let doc; try { doc = fr.contentDocument; } catch (e) { return; }
  if (!doc || typeof window.boekLeegPlaat !== "function") return;
  $$(".pagedjs_blank_page", doc).forEach(pg => {
    const op = pg.nextElementSibling && $(".bk-open[data-lijn]", pg.nextElementSibling), area = $(".pagedjs_area", pg);
    if (!op || !area || area.dataset.plaat) return;
    const h = window.boekLeegPlaat(bkCurB || bkB(), +op.dataset.lijn); if (!h) return;
    area.style.position = "relative"; area.dataset.plaat = "1"; area.insertAdjacentHTML("beforeend", h);
  });
}
/* stoppen tijdens het opbouwen: het iframe leeg maken breekt Paged.js af; "Opnieuw" bouwt het voorbeeld weer op. Een nieuwe keuze vervangt het iframe toch al. */
document.addEventListener("click", e => {
  const c = e.target.closest("#v-boek [data-bkstop]"), fr = $("#bkFrame"), bz = $("#bkBezig"); if (!c || !fr || !bz) return;
  if (c.dataset.bkstop === "stop") {
    fr.removeAttribute("srcdoc"); fr.src = "about:blank";
    bz.innerHTML = `<p>Het opbouwen is gestopt.</p><button type="button" class="btn" data-bkstop="opnieuw">Opnieuw opbouwen</button>`;
    const b = $("#bkPdf"); if (b) b.textContent = "Maak pdf om zelf te laten drukken";
    const t = $("#bkTel"); if (t) t.textContent = t.textContent.replace(/ · voorbeeld.*$/, "");
  } else {
    bz.innerHTML = `<span class="sr-only" role="status">Het voorbeeld wordt opgebouwd.</span><p aria-hidden="true">Opbouwen … <span id="bkBezigN">0</span> / <span id="bkBezigT">± ${esc(fr.dataset.totaal || "")}</span></p><div class="bk-balk"><i id="bkBalk"></i></div><button type="button" class="btn" data-bkstop="stop">Stoppen</button>`;
    const b = $("#bkPdf"); if (b) b.textContent = "Even geduld…";
    fr.removeAttribute("src"); bkLaadVoorbeeld(fr, bkB());
  }
  ($("button", bz) || bz).focus();
});
/* bladeren in het voorbeeld: knoppen en pijltjestoetsen; het iframe toont één spread en zegt welke */
const bkBlader = r => { const fr = $("#bkFrame"); if (fr && fr.contentWindow) fr.contentWindow.postMessage({ bkBlad: r }, "*"); };
document.addEventListener("click", e => {
  const c = e.target.closest("#v-boek [data-bkblad]"); if (!c) return;
  if (c.dataset.bkblad === "omslag") { const aan = c.getAttribute("aria-pressed") !== "true"; c.setAttribute("aria-pressed", String(aan)); bkOmslagTonen(aan); return; }
  if (c.dataset.bkblad === "groot") { const v = $(".bk-voorbeeld"); document.fullscreenElement ? document.exitFullscreen() : v.requestFullscreen && v.requestFullscreen(); return; }
  bkBlader(c.dataset.bkblad);
});
document.addEventListener("click", e => { const c = e.target.closest("#v-boek [data-bkmodus]"); if (!c) return; const fr = $("#bkFrame"); if (fr && fr.contentWindow) fr.contentWindow.postMessage({ bkModus: c.dataset.bkmodus }, "*"); });
document.addEventListener("keydown", e => {
  if (route.view !== "boek" || !$("#bkBlad") || $("#bkBlad").hidden || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "")) return;
  const a = document.activeElement; if (a && a !== document.body && !a.closest(".pc-voorbeeld")) return; /* arrows turn the pages only from the preview (or nowhere): not while choosing */
  if (e.key === "ArrowRight" || e.key === "PageDown") { bkBlader("+"); e.preventDefault(); } else if (e.key === "ArrowLeft" || e.key === "PageUp") { bkBlader("-"); e.preventDefault(); }
});
let bkGekozen = false; /* een keuze gemaakt: na het opbouwen kort "Voorbeeld bijgewerkt" */
/* the chosen printer: does the book fit (its page limit), with advice, and "Zo bestel je" from the producers (Products.orderFor) */
const BK_DRUKKER_ID = { "3": "saal", blurb: "blurb", "0": "peecho" };
const bkTeDik = (S, n) => { const m = BK_MAX[S.afloop]; return m && n > m[1] ? m : null; };
function bkDrukkerRegel(S, n) {
  const m = BK_MAX[S.afloop], te = bkTeDik(S, n);
  const regel = te ? `<p class="bk-waarschuwing" role="status">Te dik voor ${esc(m[0])}: dit boek heeft ± ${n} blz., ${esc(m[0].split(" ")[0])} drukt er tot ${m[1]}. ${["Kies " + (S.afloop === "3" ? "Blurb" : "Peecho"), bkZelfde(S, "compact") ? "" : "kies Compact", S.split === "een" ? "maak het boek in twee delen" : "kies een kleiner deel"].filter(Boolean).join(", ").replace(/, ([^,]*)$/, " of $1")}.</p>`
    : m ? `<p class="bk-uitleg">Past bij ${esc(m[0])}: ± ${n} blz. (tot ${m[1]}).</p>` : "";
  return regel;
}
/* "Zo bestel je": the same block as the other products (mpBestel), with printing at home first; a printer that does not match the
   choice in this step says which choice it needs */
function bkBestel(S, id) {
  const p = Products.products && (Products.products[id] || Products.products.book); if (!p || typeof mpBestel !== "function") return "";
  const nu = BK_DRUKKER_ID[S.afloop] || "", kies = l => `. Kies daarvoor hierboven bij "Drukker": ${l}`;
  const zelf = `<div class="ps-bestel-p"><h3>Zelf afdrukken</h3><p class="small">Geen upload: de pdf zonder afloop (de knop "Maak pdf")${S.afloop ? kies("Zelf afdrukken") : ""}.</p><ol><li>Druk de pdf dubbelzijdig af, omslaan langs de lange kant.</li><li>Laat het binden bij een copyshop (lijmbinding of een ringband), of doe de bladen in een map.</li></ol></div>`;
  return mpBestel(p, undefined, { voor: zelf, afloopZin: d => d.id === nu ? "" : kies(d.label) });
}
let bkFocusNa = ""; /* after a choice the panel is drawn again: the focus goes back to the same choice (selector) */
/* a cover change without building the book again: the front and back cover in the preview are swapped in place (same page size);
   boekNaKlaar fills what the new cover leaves empty. Not for the printer's inner pages (no cover in them). */
function bkOmslagWissel(B) {
  const fr = $("#bkFrame"); let d; try { d = fr && fr.contentDocument; } catch (e) { return false; }
  if (!d || B.druk || typeof window.boekOmslag !== "function") return false;
  const oud = $$(".bk-omslag", d); if (!oud.length) return false;
  const nieuw = { voor: window.boekOmslag(B) || "", achter: typeof window.boekAchterkant === "function" ? window.boekAchterkant(B) || "" : "" }, tmp = d.createElement("div");
  oud.forEach(el => { tmp.innerHTML = nieuw[el.classList.contains("bkb-achterkant") ? "achter" : "voor"]; const n = tmp.firstElementChild; if (!n) return;
    const paged = [...el.classList].filter(c => /^pagedjs_/.test(c)); /* the classes Paged.js added stay */
    [...n.attributes].forEach(at => { if (at.name !== "class") el.setAttribute(at.name, at.value); }); el.className = [n.className, ...paged].join(" "); el.innerHTML = n.innerHTML; });
  try { if (typeof window.boekNaKlaar === "function") window.boekNaKlaar(d, B); } catch (e) { }
  const vak = $("#bkOmslagVak"); if (vak && !vak.hidden && typeof bkOmslagTonen === "function") bkOmslagTonen(true); /* the cover view, if open */
  return true;
}
document.addEventListener("click", e => {
  const c = e.target.closest("#v-boek [data-bk]"); if (!c) return;
  const S = bkState, g = c.dataset.bk, v = c.dataset.bv; bkGekozen = true; bkSprong = g === "lijn" && +v ? "lijn-" + v : "";
  if (g === "preset") { const P = BK_PRESET[v]; Object.assign(S, { detail: P.detail, beeld: P.beeld, bron: P.bron, hyp: P.hyp, delen: new Set(P.delen) }); }
  else if (g === "detail") S.detail = +v;
  else if (g === "formaat") S.formaat = v;
  else if (g === "omslag") S.omslag = v;
  else if (g === "beeld") S.beeld = v;
  else if (g === "bron") S.bron = v;
  else if (g === "hyp") S.hyp = v;
  else if (g === "afloop") S.afloop = v;
  else if (g === "lijn") { S.lijn = +v; if (S.lijn) { S.start = 1; S.paar = false; } }
  else if (g === "split") { S.split = v; S.deelNr = 1; if (v !== "een") S.lijn = 0; }
  else if (g === "deel") S.deelNr = +v;
  bkFocusNa = `#v-boek [data-bk="${g}"][data-bv="${CSS.escape(v)}"]`;
  if (g === "omslag") { const B2 = bkB(); if (bkOmslagWissel(B2)) { bkCurB = B2; bkGekozen = false; } } /* the cover only: the inner pages stay */
  go(bkToken(), { keepScroll: true, replace: true }); /* a choice is not a step in the history; the steps are */
});
document.addEventListener("change", e => {
  const c = e.target.closest("#v-boek [data-bkdeel]"); if (!c) return;
  const S = bkState, v = c.dataset.bkdeel; c.checked ? S.delen.add(v) : S.delen.delete(v);
  bkFocusNa = `#v-boek [data-bkdeel="${CSS.escape(v)}"]`;
  go(bkToken(), { keepScroll: true, replace: true });
});

/* ---------- book: front and back matter (site layer) ---------- */
/* The title page, colophon, "Over dit boek", table of contents, appendices, index of names, back cover text, surname block and the
   typesetting pass are pure, in src/products/book/front.js (Products.bookFront). Here only what the site derives for them, as plain
   values (bkFrontData → data.front), and the hooks the book calls. */
function bkFrontData() {
  const H = honestStats(), jaar = H.yearProven < 9999 ? H.yearProven : "", surnames = {};
  anNamen().filter(x => x.lijnen).forEach(x => anLijnen(x).forEach(l => {
    const bron = (x.bronnen || []).map(b => b[0]); if (x.cbg && !bron.some(b => /CBG/.test(b))) bron.push("CBG Familienamen");
    (surnames[l] = surnames[l] || []).push({ naam: x.naam, soort: x.soort, verklaring: x.verklaring, st: x.st, familie: x.familie, familie_st: x.familie_st, n1947: x.n1947, n2007: x.n2007, bron });
  }));
  const S = STATS || (STATS = computeStats()), A = ancestors.filter(p => !p.living && !p.aliasOf);
  const top = S.months.slice().sort((a, b) => b.v - a.v)[0], fam = S.bigFamily && S.bigFamily[0], who = x => x ? { n: x.p.n, v: Math.floor(x.v) } : null;
  const numbers = {
    lifeM: { avg: meanOf(S.lifeM), n: S.lifeM.length }, lifeF: { avg: meanOf(S.lifeF), n: S.lifeF.length },
    oldest: S.oldest.slice(0, 3).map(x => ({ n: x.p.n, age: (x.exact ? "" : "ca. ") + Math.floor(x.v) })),
    ageM: { avg: meanOf(S.ageM.map(x => x.v)) }, ageF: { avg: meanOf(S.ageF.map(x => x.v)) },
    topMonth: top && S.nDated ? { name: MONTHS[S.months.indexOf(top)], v: top.v, n: S.nDated } : null,
    bigFamily: fam ? { m: fam.m.n, f: fam.f.n, kids: fam.kids } : null, genAvg: S.genAvg, youngMother: who(S.youngMother), oldFather: who(S.oldFather),
    status: Object.fromEntries(["A", "B", "C", "D"].map(k => [k, A.filter(p => p.st === k).length])), nDead: A.length,
    namesM: S.namesM.slice(0, 6), namesF: S.namesF.slice(0, 6), occ: S.occ.slice(0, 6).map(o => [o.l, o.v]), nOcc: S.nOcc,
    places: S.topPlaces.slice(0, 6).map(([k, v]) => [placeName(k), v]), moves: S.moves.length, moveMedian: medianOf(S.moves.map(x => x.v)), within20: S.within20 };
  return { lede: heroLedeTekst(jaar), honest: { n: H.n, genProven: H.genProven, yearProven: H.yearProven }, surnames,
    glossary: GLOSSARY.map(g => [g[0], g[1], g[2] && g[2][0]]), wage: typeof WAGE !== "undefined" ? WAGE : null, numbers };
}
const bkFrontCache = {};
const bkFront = () => bkFrontCache[T.key] || (bkFrontCache[T.key] = Products.bookFront(bkBookData()));
const bkTitel = B => bkFront().title(B), bkTitelHtml = s => Products.bookFront ? Products.bookFront.titleHtml(s) : esc(s); /* read late: a missing front.js must not stop the site */
window.boekVoorwerk = B => bkFront().voorwerk(B);
window.boekInhoud = B => bkFront().inhoud(B);
window.boekNawerk = B => bkFront().nawerk(B);
window.boekZetwerk = html => bkFront().zetwerk(html);
window.boekAchterflap = B => bkFront().achterflap(B);
window.bookSurnameBlock = (B, l) => bkFront().surname(B, l);
window.boekPaginaCss = f => Products.bookFront ? Products.bookFront.pageCss(f) : "";
window.boekPastBij = n => Products.bookFront ? Products.bookFront.fitsPrinter(n) : "";

/* ---------- boek: omslag en beeld ---------- */
/* Haken voor het boek (zie de sectie "boek"): omslag (voorkant in het boek; de hele omslag met rug en achterkant voor de drukker),
   de waaier als dubbele pagina in vector, de openingsspread per familie met een historisch beeld over de hele pagina, de beeldkeuze
   per hoofdstuk en de bron van elk beeld. Met B.hires (alleen lokaal, voor de drukker) komen de beelden uit de originelen in
   beelden/originelen/; lukt dat niet, dan valt het beeld terug op de webversie. Van levenden nooit een beeld. */
const BKB_ORIG = id => "beelden/originelen/" + String(id).replace(/^omslag-/, "") + ".jpg";
window.boekSrc = (im, B) => {
  if (!im) return "";
  if (Math.max(im.ow || 0, im.w || 0, im.h || 0) && Math.max(im.ow || 0, im.oh || 0, im.w || 0, im.h || 0) < 300) return ""; /* te klein voor druk (bv. een miniatuur van 48 px): geen beeld */
  if (B && B.hires && im.id) return BKB_ORIG(im.orig_id || im.id); /* het origineel; bkbFig en bkBeeld vallen terug op de webversie als het er niet is */
  if (im.arch && !im.src && im.id) return archSrc(im.id);
  return im.src || "";
};
/* een beeld als figure; bij hires met terugval op de webversie */
function bkbFig(im, B, maat, cls, cap) {
  const web = im.orig_id ? archSrc(im.orig_id) : im.groot ? im.groot.src : im.src || (im.id ? archSrc(im.id) : ""), src = B && B.hires ? window.boekSrc(im, B) : web; /* omslagbeelden: de grotere archiefversie */
  const fb = src !== web ? ` onerror="this.onerror=null;this.src='${esc(web)}'"` : "";
  return `<figure class="bk-beeld${cls ? " " + cls : ""}" data-img="${esc(im.id || "")}" data-maat="${maat}"><img src="${esc(src)}" alt=""${fb}>${cap ? `<figcaption class="bk-bijschrift">${cap}</figcaption>` : ""}</figure>`;
}
/* een nette titel voor een bijschrift: zonder catalogusnummer vooraan ("80: Oldeholtpade: …") en zonder de plaatsnaam ervoor */
const bkbTitel = im => { let t = String(niceTitle(im) || "").replace(/^\s*\d+\s*:\s*/, ""); t = archTitle(t, im.key); return t.replace(/^\s*\d+\s*:\s*/, ""); };
const bkbCredit = im => [im.datum ? beeldDatum(im.datum) : "", makerOf(im), nlNaam(im.bronNaam || "")].filter((x, i, a) => x && !/^https?:/.test(x) && a.indexOf(x) === i).join(" · ");
/* de jaren van een groep: het oudste bewezen jaar (A of B) tot het jongste sterfjaar van een overleden voorouder */
/* zoals de site (honestStats): alleen voorouders met een bewezen keten (A/B) en alleen exacte, bewezen jaren (oudsteJaar, streng) */
function bkbJaren(ps) {
  const ys = ps.filter(p => !p.living && (p.st === "A" || p.st === "B") && ST_RANK[ketenBest(p).st] <= 1).map(p => oudsteJaar(p, true)).filter(y => y < 9999);
  return ys.length ? Math.min(...ys) : null;
}
/* de waaier als losse SVG-tekst (vector), zonder interactie; labels = generaties met namen */
function bkbWaaierSvg(o = {}) {
  /* met o.breedtePt rekent drawFan de leesbaarheid in punten: 1 px van de tijdelijke houder = 1 pt in druk, dus minPx = 6 betekent ≥ 6 pt */
  const host = document.createElement("div");
  if (o.breedtePt) { host.style.cssText = `position:absolute;left:-99999px;top:0;width:${o.breedtePt}px;height:${o.breedtePt}px`; document.body.appendChild(host); }
  drawFan(host, Object.assign({ maxGen: 9, labelGen: 7, interactive: false, labelScale: 1, minPx: 0 }, o));
  if (o.breedtePt) host.remove();
  const svg = $("svg", host); if (!svg) return "";
  svg.removeAttribute("width"); svg.removeAttribute("height"); svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  $$("[tabindex]", svg).forEach(n => n.removeAttribute("tabindex"));
  if (o.kaal) $$("text", svg).forEach(n => n.remove()); /* alleen de vlakken, geen namen */
  if (o.centerText) { /* a fixed centre (a couple: their children are not in the book): replace the centre name */
    $$("text", svg).filter(t => !t.closest("g[transform]") && !t.querySelector("textPath") && Math.hypot(+t.getAttribute("x") || 0, +t.getAttribute("y") || 0) < 55).forEach(t => t.remove());
    o.centerText.forEach((x, i, a) => { const t = document.createElementNS("http://www.w3.org/2000/svg", "text"); t.setAttribute("x", 0); t.setAttribute("y", 5 + (i - (a.length - 1) / 2) * 15);
      t.setAttribute("text-anchor", "middle"); t.setAttribute("font-size", 13); t.setAttribute("font-weight", 600); t.setAttribute("fill", "var(--accent-ink)"); t.textContent = x; svg.appendChild(t); });
  }
  if (o.vol) { /* omslag: familiekleuren voller (zoals in de legenda), kwartierverlies als dunne goudlijn, het midden als rustige ring */
    $$("path[fill-opacity]", svg).forEach(n => { const v = +n.getAttribute("fill-opacity"); if (v) n.setAttribute("fill-opacity", Math.min(0.92, v * o.vol).toFixed(2)); });
    $$('path[stroke="var(--gold)"]', svg).forEach(n => { n.setAttribute("stroke-width", "1"); n.setAttribute("stroke-opacity", "0.85"); });
    const c = svg.querySelector("circle"); if (c) { c.setAttribute("stroke", "var(--gold)"); c.setAttribute("stroke-width", "1.5"); }
    $$("text", svg).filter(t => /^(vaders|moeders) kant$|^(vader|moeder) van /.test(t.textContent)).forEach(t => t.remove()); /* geen kantlabels aan de rand van de omslag */
    if (c && !o.centerText && !$$("text", svg).some(t => !t.querySelector("textPath") && Math.abs(+t.getAttribute("x") || 0) < 1 && Math.abs(+t.getAttribute("y") || 0) < 40)) { /* het midden altijd bij naam */
      const ls = T.rootLines || [T.root], f = Math.min(16, 100 / (Math.max(...ls.map(x => x.length)) * 0.56));
      ls.forEach((x, i) => { const t = document.createElementNS("http://www.w3.org/2000/svg", "text"); t.setAttribute("x", 0); t.setAttribute("y", 5 + (i - (ls.length - 1) / 2) * f * 1.1);
        t.setAttribute("text-anchor", "middle"); t.setAttribute("font-size", f); t.setAttribute("font-weight", 600); t.setAttribute("fill", "var(--accent-ink)"); t.textContent = x; svg.appendChild(t); });
    }
  }
  return svg.outerHTML;
}
/* drie omslagen om uit te kiezen (Harrie): A "linnen en goud" (donker, goud), B "papier en waaier" (licht, de hele waaier
   onder de titel), C "archief" (een oude kaart van de streek als grond, waaier en titel in een kader). Keuze: B.omslag, anders
   window.BKB_OMSLAG, anders B (de standaard). Overal de volledige waaier met namen, tekst ≥ 6 pt in druk; van levenden in het midden alleen de naam. */
const BKB_OMSLAGEN = { a: { vol: 2.6, breedte: 0.9 }, b: { vol: 1.7, breedte: 0.84 }, c: { vol: 2.2, breedte: 0.78 } }; /* breedte = the real width of the fan on the page (C: 98 % of the frame) */
/* Harrie (8-10-2026): B is de standaard, A en C zijn een keuze op #boek (token omslag-a, omslag-c) */
const bkbOmslagKeuze = B => { const k = String((B && B.omslag) || window.BKB_OMSLAG || "b").toLowerCase(); return BKB_OMSLAGEN[k] ? k : "b"; };
/* een klein voorbeeld van een omslag voor het keuzepaneel op #boek: de grond, de waaier zonder namen en een titelstreep (inline stijlen,
   want book-css laadt alleen in het boekdocument) */
window.boekOmslagMini = k => {
  const kl = { a: ["#17221e", "#c8a45c", "#efe9db"], b: ["#f3ebd9", "#8a6a2e", "#1d2320"], c: ["#d9cfb9", "#7a5c26", "#1d2320"] }[k] || ["#f3ebd9", "#8a6a2e", "#1d2320"];
  if (!window.boekOmslagMini.svg) window.boekOmslagMini.svg = bkbWaaierSvg({ labelGen: 0, kaal: true, maxGen: 7 });
  const fan = window.boekOmslagMini.svg.replace(/^<svg/, `<svg style="display:block;width:100%;height:auto"`);
  const titel = `<span style="display:block;height:3px;width:60%;margin:5px auto 2px;background:${kl[2]};opacity:.8"></span><span style="display:block;height:2px;width:36%;margin:0 auto;background:${kl[1]}"></span>`;
  const binnen = k === "b" ? `<div style="padding:9px 8px 0">${titel}</div><div style="position:absolute;left:-12%;right:-12%;bottom:-38%">${fan}</div>`
    : k === "c" ? `<div style="position:absolute;inset:8% 9%;background:rgba(246,240,226,.94);border:1px solid ${kl[1]};padding:6px">${titel}<div style="width:78%;margin:6px auto 0">${fan}</div></div>`
    : `<div style="position:absolute;inset:5px;border:1px solid ${kl[1]}"></div><div style="width:86%;margin:12% auto 0">${fan}</div><div style="position:absolute;left:0;right:0;bottom:12%">${titel}</div>`;
  return `<span class="bkb-mini" style="position:relative;display:block;width:72px;height:100px;overflow:hidden;background:${kl[0]};${k === "c" ? "background-image:repeating-linear-gradient(45deg,rgba(122,92,38,.12) 0 2px,transparent 2px 6px);" : ""}box-shadow:0 1px 4px rgba(0,0,0,.25)">${binnen}</span>`;
};
const bkbFormaatMm = B => { const f = (typeof BK_FORMAAT !== "undefined" ? BK_FORMAAT : []).find(x => x[0] === (B && B.formaat)); const m = f && /([\d.]+)mm\s+([\d.]+)mm/.exec(f[3]); return m ? [+m[1], +m[2]] : [210, 297]; };
/* de achtergrondkaart voor C: de grote kaart van de streek met de meeste voorouders (Schotanus), gedempt */
function bkbOmslagKaart() {
  const k = topPlaces(ancestors.filter(p => !p.living), 6).map(x => x[0]).map(pl => gemMap((PLACES[pl] || {}).gem) || (isGemeente(pl) ? gemMap(pl) : null)).find(Boolean);
  return k || null;
}
/* titelblok (typografie 19): "De voorouders van" klein in Caslon Text cursief, de naam groot in Caslon Display, de jaren tussen
   haarlijnen, daaronder één rustige regel met de families (in de samengestelde boom per kant) */
const bkbJaarNu = () => new Date().getFullYear();
/* the families of this book: one family (B.lijn), the families of a part, or all */
const bkbLijnen = B => B && B.lijn && LINES[B.lijn] ? [B.lijn] : B && B.deel && B.deel.lijnen ? B.deel.lijnen : LINE_KEYS.filter(l => LINES[l]);
/* the own families of the start of the book (a person or couple chosen in the pyramid): the parents or grandparents → the 8 or 4
   families of that branch in fan order; deeper → the two surnames of the couple (or of the person's parents). Families that come in
   through pedigree collapse stay inside the book. null = no start: the families of the whole tree, a family or a part, as before. */
function bkbEigenFams(B) {
  const st = B && B.start, kern = (B && B.kern) || 1;
  if (!st || !st.aan || kern === 1) return null;
  /* in the tree of the children the families (8–15) are a generation further: kw 4–7 are already great-grandparents' couples */
  if (kern < (T.key === "s" ? 4 : 8)) return LINE_KEYS.filter(l => LINES[l] && (l >> (gen(l) - gen(kern))) === kern).map(l => LINES[l].name);
  const sur = kw => { const p = person(fanKw(kw)), n = p ? shortSur(splitName(p.n).sur) : ""; return n.charAt(0).toUpperCase() + n.slice(1); }; /* "de Groot" → "De Groot", as in a title */
  return [...new Set([sur(2 * kern), sur(2 * kern + 1)].filter(Boolean))];
}
function bkbFamRegel(B) {
  const eigen = bkbEigenFams(B);
  if (eigen) return eigen.length < 2 ? "" : `<p class="bkb-om-fams"><span>${eigen.map(n => esc(n).replace(/ /g, "\u00a0")).join("\u00a0· ")}</span></p>`;
  const lijnen = bkbLijnen(B); if (lijnen.length < 2) return ""; /* one family: its name is already the title */
  const nm = ls => ls.map(l => esc(LINES[l].name).replace(/ /g, "\u00a0")).join("\u00a0· "); /* namen breken nooit; de punt blijft bij de vorige naam */
  if (T.key === "s" && !(B && B.deel && B.deel.aantal > 1)) { const v = lijnen.filter(l => l < 12), m = lijnen.filter(l => l >= 12);
    return `<p class="bkb-om-fams"><span>Vaderskant: ${nm(v)}</span><span>Moederskant: ${nm(m)}</span></p>`; }
  return `<p class="bkb-om-fams"><span>${nm(lijnen)}</span></p>`;
}
/* the title of this book (bkTitel: the whole tree, one family or a part), split into a small line above and the large name:
   "De voorouders van" + "Harrie de Groot", "De familie" + "De Groot · Kingma", "Vaderskant" + "De families van Kees" */
function bkbTitelDelen(B) {
  const t = bkTitel(B || {}), m = /^(De voorouders van|De familie|Ter herinnering aan)\s+(.+)$/.exec(t.titel) || /^([^:]+):\s*(.+)$/.exec(t.titel);
  const naam = m ? m[2].charAt(0).toUpperCase() + m[2].slice(1) : t.titel;
  return { titel: t.titel, boven: m ? m[1] : "", naam, sub: t.sub, jaren: t.jaren };
}
function bkbTitelblok(B, k) {
  const t = bkbTitelDelen(B), fams = bkbLijnen(B);
  /* the subtitle may already name the years and the families: then not a second time below it */
  const sub = t.jaren ? t.sub.replace(` \u00b7 ${t.jaren}`, "").replace(t.jaren, "").replace(/\s*\u00b7\s*$/, "") : t.sub;
  const eigen = bkbEigenFams(B), low = x => x.toLowerCase(), inTitle = eigen && eigen.every(n => low(t.naam).includes(low(n))); /* the title already names them */
  const famsInSub = eigen ? inTitle || (eigen.length > 1 && eigen.every(n => sub.includes(n))) : fams.length > 1 && fams.every(l => sub.includes(LINES[l].name));
  return `<div class="bkb-om-titel">${t.boven ? `<p class="bkb-om-boven">${esc(t.boven)}</p>` : ""}<h1 class="bkb-om-naam${t.naam.length > 16 ? " bkb-lang" : ""}">${bkTitelHtml(t.naam)}</h1>
    ${sub ? `<p class="bkb-om-sub">${esc(sub)}</p>` : ""}${t.jaren ? `<p class="bkb-om-jaren"><i></i><span>${esc(t.jaren)}</span><i></i></p>` : ""}${famsInSub ? "" : bkbFamRegel(B)}</div>`;
}
/* the fan on the cover: from B.kern (the whole tree, a family or one side) and only the people in this book (B.mensen) */
const bkbOmslagWaaier = (B, o) => bkbWaaierSvg(Object.assign({ root: (B && B.kern) || 1, keep: B && B.mensen ? new Set(B.mensen) : null,
  centerText: B && B.start && B.start.paar ? [] : undefined }, o)); /* a couple: an empty centre, not the name of one of their children */
/* the picture in the middle of the front, per kind of book (B.soort), so the books do not all look alike; the family book keeps
   the fan. Every picture is at least 200 dpi in its box, and never shows a living person. o.set: the family booklets as a set. */
function bkbSoortBeeld(B, pw, o = {}) {
  const soort = B && B.soort, keep = B && B.mensen ? new Set(B.mensen) : null, dead = kw => { const p = person(fanKw(kw)); return p && !p.living && (!keep || keep.has(fanKw(kw))); };
  const box = pw * 0.8, sharp = (im, mm) => im && Math.max(im.w || 0, (im.groot || {}).w || 0) >= mm / 25.4 * 200;
  const src = im => (B && B.hires ? window.boekSrc(im, B) : (im.groot ? im.groot.src : im.src || window.boekSrc(im, B))) || "";
  const pic = (im, cls) => `<div class="bkb-om-beeld ${cls || ""}"><img src="${esc(src(im))}" alt=""></div>`;
  if (o.set) { /* the family booklets: one thin spine per family, side by side */
    const ls = LINE_KEYS.filter(l => LINES[l]), w = 100 / ls.length;
    return `<div class="bkb-om-beeld bkb-om-ruggen"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${ls.map((l, i) => `<rect x="${(i * w + 0.6).toFixed(2)}" y="${(8 + (i % 3) * 3).toFixed(1)}" width="${(w - 1.2).toFixed(2)}" height="${(84 - (i % 3) * 3).toFixed(1)}" rx="0.6" fill="var(--l${l})"/>`).join("")}</svg>
      <div class="bkb-om-ruglabels">${ls.map(l => `<span style="width:${w}%">${esc(LINES[l].name)}</span>`).join("")}</div></div>`;
  }
  if (soort === "verhalen") { /* an old print or photograph from the stories */
    const ims = (typeof STORY_CARDS !== "undefined" ? Object.values(STORY_CARDS) : []).map(c => c.img && IMG_ID[c.img]).filter(im => im && !/persoon|portret/.test(im.soort) && sharp(im, box));
    const im = ims.sort((a, b) => Math.max(b.w, (b.groot || {}).w || 0) - Math.max(a.w, (a.groot || {}).w || 0))[0];
    return im ? pic(im, "bkb-om-prent") : null;
  }
  if (soort === "onderzoek") { /* the oldest deed in the book, as a scan */
    const scans = IMGS.filter(im => /^akte-/.test(im.id) && /^\d{4}/.test(im.datum || "") && +im.datum.slice(0, 4) < 1900 && sharp(im, 115) /* the deed in a smaller frame (CSS: 78 %), so a scan of 1000 px stays sharp */
      && (im.kws && im.kws.length ? im.kws : [im.key]).every(k => { const q = ancestors.find(x => imgKey(x.kw) === String(k)); return q && dead(q.kw); })); /* only deeds of the dead in this book */
    const im = scans.sort((a, b) => String(a.datum).localeCompare(String(b.datum)))[0];
    return im ? pic(im, "bkb-om-akte") : null;
  }
  if (soort === "gedenk") { /* the person or couple of the memorial book: their own portraits side by side, each with name and years;
       a frame only as wide as the portrait stays sharp (200 dpi); no portrait at all: the fan */
    const subj = B.S && bkCore().subjects ? bkCore().subjects(B.S) : [], cfg = BKB_OMSLAGEN[bkbOmslagKeuze(B)] || BKB_OMSLAGEN.a;
    const own = im => im && !isTiny(im) && !bkbKnipsel(im) && !/-of-kw/i.test(im.id || "") && !/^(hun|zijn|haar)\s+(zoon|dochter|broer|zus|kind)/i.test(im.t || im.titel || "");
    const faces = subj.map(p => ({ p, im: portraitOf(p.kw) })).filter(x => own(x.im));
    if (!faces.length) return null;
    const room = pw * Math.min(cfg.breedte, 0.7) * (faces.length > 1 ? 0.44 : 0.56); /* the width of one frame in mm */
    const mm = Math.min(room, ...faces.map(x => Math.max(x.im.w || 0, (x.im.groot || {}).w || 0) / 200 * 25.4));
    if (mm < 38) return null;
    const naam = p => [p.roep || firstName(p), splitName(p.n).sur].filter(Boolean).join(" "), jaren = p => [yr(p.b), yr(p.d)].filter(Boolean).join(" – ");
    return `<div class="bkb-om-portret">${faces.map(x => `<figure style="width:${mm.toFixed(1)}mm"><img src="${esc(src(x.im))}" alt=""><figcaption><b>${esc(naam(x.p))}</b>${jaren(x.p) ? `<span>${esc(jaren(x.p))}</span>` : ""}</figcaption></figure>`).join("")}</div>`;
  }
  if (soort === "foto") { /* faces and places: portraits of the dead, then the old pictures of their villages */
    const tile = box / 3, faces = [...(keep || new Set(ancestors.map(p => p.kw)))].filter(dead).map(kw => portraitOf(kw)).filter(im => im && !isTiny(im) && !bkbKnipsel(im) && sharp(im, tile));
    /* the village: its cover picture from the archive when that pack is loaded, else a picture on the page itself (always there, e.g. on the overview of products) */
    const places = bkbPlaatsenVan(B).map(k => [OMS[k] && IMG_ID[OMS[k].orig_id], ...IMGS.filter(im => im.key === k && /^(plaats|historisch)$/.test(im.soort))].find(im => im && !bkbKnipsel(im) && sharp(im, tile))).filter(Boolean);
    const all = [...new Map([...faces, ...places].map(im => [im.id, im])).values()].slice(0, 9);
    return all.length >= 4 ? `<div class="bkb-om-beeld bkb-om-raster">${all.map(im => `<img src="${esc(src(im))}" alt="">`).join("")}</div>` : null;
  }
  if (soort === "kwartierstaat") { /* the numbered columns of the pedigree: generations I–V, the number and the first name */
    const cols = 5, cw = 100 / cols; let g = "";
    for (let gn = 1; gn <= cols; gn++) { const n = 2 ** (gn - 1), h = 100 / n;
      for (let i = 0; i < n; i++) { const kw = n + i, p = person(fanKw(kw)), x = (gn - 1) * cw, y = i * h;
        g += `<rect x="${(x + 0.8).toFixed(2)}" y="${(y + 0.4).toFixed(2)}" width="${(cw - 1.6).toFixed(2)}" height="${(h - 0.8).toFixed(2)}" fill="${gn >= 4 ? `var(--l${lineOf(kw)})` : "var(--surface)"}" fill-opacity="${gn >= 4 ? 0.28 : 1}" stroke="var(--rule)" stroke-width="0.25"/>`;
        const fs = Math.min(3.2, h * 0.32);
        g += `<text x="${(x + 2).toFixed(2)}" y="${(y + h / 2 + fs * 0.35).toFixed(2)}" font-size="${fs.toFixed(2)}" font-family="IBM Plex Mono, monospace" fill="var(--muted)">${kw}</text>`;
        if (p && gn <= 4) g += `<text x="${(x + 2 + fs * 1.8).toFixed(2)}" y="${(y + h / 2 + fs * 0.35).toFixed(2)}" font-size="${fs.toFixed(2)}" font-family="IBM Plex Sans, sans-serif" fill="var(--ink)">${esc(firstName(p))}</text>`; } }
    return `<div class="bkb-om-beeld bkb-om-kwst"><svg viewBox="0 0 100 100">${g}</svg></div>`;
  }
  return null;
}
/* the title on the spine: a memorial book by call names ("Ter herinnering aan Herman en Mien"), else the title */
function bkbRugTitel(B, t) {
  if (!B || B.soort !== "gedenk" || !B.S) return t.titel;
  const subj = bkCore().subjects ? bkCore().subjects(B.S) : [];
  return subj.length ? "Ter herinnering aan " + subj.map(p => p.roep || firstName(p)).join(" en ") : t.titel;
}
/* a newspaper clipping or a deed is no picture for a cover: it is filed as "historisch" (with a place) or "persoon" */
const bkbKnipsel = im => /krant|courant|nieuwsblad|advertentie|overlijdensbericht|delpher/i.test([im.id, im.t, im.maker, im.bronNaam].join(" ")) || /akte|rouw|bidprent|graf/i.test(im.id || "");
/* the places of the people in this book, the most frequent first */
const bkbPlaatsenVan = B => topPlaces(ancestors.filter(p => !p.living && (!B || !B.mensen || B.mensen.includes(p.kw))), 16).map(x => x[0]);
function bkbVoorkant(B) {
  const k = bkbOmslagKeuze(B), cfg = BKB_OMSLAGEN[k], [pw] = bkbFormaatMm(B), lijnen = bkbLijnen(B);
  const waaier = bkbSoortBeeld(B, pw, { set: B && B.set }) || bkbOmslagWaaier(B, { labelGen: 7, minPx: 6, breedtePt: Math.round(pw * cfg.breedte * 72 / 25.4), vol: cfg.vol });
  const tk = bkbTakken(B && B.kern), banden = `<div class="bkb-om-banden">${(tk.length ? tk.map(t => t.kleur) : lijnen.map(l => `var(--l${l})`)).map(x => `<i style="--lc:${x}"></i>`).join("")}</div>`;
  const kaart = k === "c" ? bkbOmslagKaart() : null;
  return `<section class="bk-omslag bkb-om bkb-om-${k}" data-bk="omslag" data-omslag="${k}"${kaart ? ` style="--bkb-kaart:url('${esc(window.boekSrc(kaart, B || {}) || kaart.src)}')"` : ""}>
    ${k === "c" ? `<div class="bkb-om-kader">${bkbTitelblok(B, k)}<div class="bkb-om-waaier">${waaier}</div></div>`
      : k === "b" ? `${bkbTitelblok(B, k)}<div class="bkb-om-waaier">${waaier}</div>`
      : `<div class="bkb-om-waaier">${waaier}</div>${bkbTitelblok(B, k)}${banden}`}
  </section>`;
}
window.boekOmslag = B => bkbVoorkant(B);
/* the photo book "Gezichten en plaatsen": per family its faces and places (the choice, order and captions: Products.bookPhoto), laid out
   so that no picture drops below 200 dpi: as wide as the text column when it is large enough, else two side by side, and no picture
   taller than 44 % of the text height, so two fit on a page. */
const bkFotoCache = new Map();
window.boekFotos = (B, l) => {
  if (!B || !B.S || typeof Products.bookPhoto !== "function") return "";
  const S = B.S, key = [T.key, S.start, S.paar, S.lijn, S.hyp, (S.voor || []).join("."), S.deelNr].join("|");
  if (!bkFotoCache.has(key)) bkFotoCache.set(key, Products.bookPhoto(bkBookData(), S));
  const fam = (bkFotoCache.get(key).families || []).find(f => f.line === l); if (!fam || !fam.items.length) return "";
  const [pw, ph] = bkbFormaatMm(B), mg = (Products.bookFront && Products.bookFront.MARGINS || {})[B.formaat] || [28, 46, 24, 30];
  const col = pw - mg[0] - mg[1], maxH = (ph - mg[2] - mg[3]) * 0.44, gap = 5; /* two pictures (with caption) fit on one page */
  const fig = (it, room) => { const im = IMG_ID[it.id] || it, px = Math.max(it.w || 0, im.w || 0, (im.groot || {}).w || 0, im.ow || 0), pxH = Math.max(it.h || 0, im.h || 0, (im.groot || {}).h || 0, im.oh || 0);
    const ar = pxH && px ? pxH / px : 0.75, mm = Math.min(room, px / 205 * 25.4, maxH / ar); /* 205: a margin for the frame and rounding, so it stays >= 200 dpi */
    const src = B.hires ? window.boekSrc(im, B) : im.groot ? im.groot.src : it.src;
    return { mm, html: `<figure class="bk-foto" data-img="${esc(it.id)}" style="width:${mm.toFixed(1)}mm"><img src="${esc(src)}" alt=""${px && pxH ? ` width="${px}" height="${pxH}"` : ""}${src !== it.src ? ` onerror="this.onerror=null;this.src='${esc(it.src)}'"` : ""}><figcaption><span>${esc(it.caption)}</span>${it.credit ? `<small>${esc(it.credit)}</small>` : ""}</figcaption></figure>` }; };
  const block = (items, kop) => { if (!items.length) return ""; let h = `<h2 class="bk-h2">${kop}</h2>`, wait = null;
    const flush = () => { if (wait) { h += `<div class="bk-foto-rij">${wait.html}</div>`; wait = null; } };
    items.forEach(it => { const full = fig(it, col);
      if (full.mm >= col * 0.62) { flush(); h += `<div class="bk-foto-rij bk-foto-vol">${full.html}</div>`; return; } /* large enough for the whole column */
      const half = fig(it, (col - gap) / 2); if (wait) { h += `<div class="bk-foto-rij">${wait.html}${half.html}</div>`; wait = null; } else wait = half; });
    flush(); return h; };
  const faces = fam.items.filter(i => i.kind !== "place"), places = fam.items.filter(i => i.kind === "place");
  return `<div class="bk-fotos" data-kop-l="${esc(fam.name)}" data-kop-r="Gezichten en plaatsen">${block(faces, "Mensen")}${block(places, "Plaatsen")}</div>`;
};
/* the choices of the book being built (a local print run renders the full cover from them) */
window.boekHuidig = () => bkCurB || bkB();
/* de hele omslag voor de drukker: achterkant · rug · voorkant op één vel, met afloop. rugMm uit het aantal pagina's */
/* the branches of a fan with another centre (fanBranchColors, shared with the site): colour and name, for the legends on the back
   cover and the family opening; empty for the whole tree (there the eight families are the legend) */
const bkbTakken = kern => kern > 1 ? fanBranchColors(kern).legend.map(x => { const j = x.person.living ? "" : lifeYears(x.person); return { kleur: x.color, naam: x.person.n, jaren: /\d/.test(j) ? j : "" }; }) : []; /* no "jaartallen onbekend" in a legend */
const bkbTakLijst = (tk, cls) => `<ul class="${cls}">${tk.map(t => `<li style="--lc:${t.kleur}"><i></i>${esc(t.naam)}${t.jaren ? ` <span>${esc(t.jaren)}</span>` : ""}</li>`).join("")}</ul>`;
/* the back of the cover: the blurb (boekAchterflap), the families or the branches of the fan, and how to read the fan */
function bkbAchterInhoud(B) {
  const fams = bkbLijnen(B), tk = bkbTakken(B && B.kern);
  return `<div class="bk-sp-achter">${typeof window.boekAchterflap === "function" ? window.boekAchterflap(B) : ""}
      ${tk.length ? `<div><p class="bk-sp-kop">De takken van de waaier</p>${bkbTakLijst(tk, "bk-sp-fam")}</div>`
        : `<ul class="bk-sp-fam">${fams.map(l => `<li style="--lc:var(--l${l})"><i></i>${esc(LINES[l].name)}${LINES[l].region ? ` <span>${esc(LINES[l].region)}</span>` : ""}</li>`).join("")}</ul>`}
      <p class="bk-sp-uitleg">De waaier: elke ring is een generatie verder terug; de kleur is ${tk.length ? "de tak" : "de familie"}, hoe voller het vak, hoe sterker het bewijs. Een dunne goudlijn: dezelfde voorouder via twee lijnen.</p>
    </div>`;
}
/* the back as one page in the book (the last page of the pdf for reading on a screen): book size, no spine, no bleed */
window.boekAchterkant = B => { const k = bkbOmslagKeuze(B); return `<section class="bk-omslag bkb-achterkant bkb-sp-${k}" data-bk="achterkant" data-omslag="${k}" style="--af:0mm">${bkbAchterInhoud(B)}</section>`; };
/* the estimated spine width: 0.1 mm per leaf of standard paper (0.13 thick, 0.08 thin) plus 2 mm for the cover board */
window.bookSpineMm = (pages, paper) => Math.round(((pages || 0) / 2 * ({ dik: 0.13, dun: 0.08 }[paper] || 0.1) + 2) * 10) / 10;
/* one cover renderer for the preview, the miniatures and the pdf: part "front" | "back" (one page, book size) or "spread"
   (back · spine · front, with spineMm and bleedMm) */
window.bookCover = (B, o = {}) => {
  if (o.set) B = Object.assign({}, B, { set: true }); /* the family booklets as a set (for the overview of products) */
  const [w0, h0] = bkbFormaatMm(B), w = o.wMm || w0, h = o.hMm || h0;
  if (o.part === "back") return window.boekAchterkant(B);
  if (o.part === "spread") return window.boekOmslagSpread(B, o.spineMm ?? window.bookSpineMm(o.pages || 200), w, h, o.bleedMm ?? 0);
  return bkbVoorkant(B);
};
/* the same as a whole document (fonts, book styles, colours) for an iframe: the book styles hold @page rules that must not reach the
   site. o.print: print as soon as the fonts are there. Returns { html, wMm, hMm } (the size of the sheet). */
window.bookCoverDoc = (B, o = {}) => {
  const [w0, h0] = bkbFormaatMm(B), w = o.wMm || w0, h = o.hMm || h0, af = o.part === "spread" ? (o.bleedMm ?? 0) : 0;
  const rug = o.part === "spread" ? (o.spineMm ?? window.bookSpineMm(o.pages || 200)) : 0;
  const W = o.part === "spread" ? 2 * w + rug + 2 * af : w, H = h + 2 * af, cs = getComputedStyle(document.documentElement);
  const kl = Object.keys(LINES).map(l => `--l${l}:${cs.getPropertyValue("--l" + l).trim()}`).join(";");
  const titel = esc(B.bestand ? B.bestand.replace(/\.pdf$/, "") + " – omslag" : "Omslag");
  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><base href="${new URL(".", location.href).href}"><title>${titel}</title>${(typeof BK_FONTS !== "undefined" ? BK_FONTS : []).map(u => `<link rel="stylesheet" href="${u}">`).join("")}
<scr${""}ipt src="src/book-css.js"><\/script><script>document.write("<style>"+(window.BOEK_CSS||"")+"<\/style>")<\/script>
<style>@page{size:${W}mm ${H}mm;margin:0}html,body{margin:0;background:none}:root{${kl};--bk-pw:${w}mm;--bk-ph:${h}mm}.bk-omslag{break-before:auto;break-after:auto}</style></head>
<body>${window.bookCover(B, Object.assign({}, o, { wMm: w, hMm: h, spineMm: rug, bleedMm: af }))}${o.print ? `<script>addEventListener("load",function(){(document.fonts?document.fonts.ready:Promise.resolve()).then(function(){setTimeout(function(){window.focus();window.print()},300)})})<\/script>` : ""}</body></html>`;
  return { html, wMm: W, hMm: H };
};
window.boekOmslagSpread = (B, rugMm, wMm, hMm, afloopMm = 3) => {
  const k = bkbOmslagKeuze(B), W = 2 * wMm + rugMm + 2 * afloopMm, H = hMm + 2 * afloopMm, t = bkbTitelDelen(B);
  const B2 = Object.assign({}, B, { formaat: (BK_FORMAAT.find(f => { const m = /([\d.]+)mm\s+([\d.]+)mm/.exec(f[3]); return m && +m[1] === wMm && +m[2] === hMm; }) || [B && B.formaat])[0] });
  return `<div class="bk-spread bkb-sp-${k}" style="--w:${wMm}mm;--h:${hMm}mm;--rug:${rugMm}mm;--af:${afloopMm}mm;width:${W}mm;height:${H}mm">
    ${bkbAchterInhoud(B)}
    <div class="bk-sp-rug">${rugMm >= 6 ? `<span><b>${esc(bkbRugTitel(B, t))}</b>${t.jaren && rugMm >= 9 ? `<small>${esc(t.jaren.replace(/\s+/g, ""))}</small>` : ""}</span>` : ""}</div>
    <div class="bk-sp-voor">${bkbVoorkant(B2).replace('class="bk-omslag ', 'class="bk-omslag bk-omslag-los ')}</div>
  </div>`;
};
/* de waaier als dubbele pagina: links de linkerhelft, rechts de rechterhelft van dezelfde vector */
/* een SVG als <img> (vector, data-URI): Paged.js breekt een losse SVG op als delen ervan buiten de pagina vallen; een beeld niet.
   De kleuren (CSS-variabelen) gaan mee in een eigen <style> in de SVG. */
/* de fonts voor SVG-beelden (waaier): IBM Plex Sans 400/600 en Plex Mono, latijns, als data-URI; geladen in boekVoorladen */
let bkbFontCss = "";
function bkbFonts() {
  if (bkbFontCss || bkbFonts.p) return bkbFonts.p || Promise.resolve();
  const b64 = buf => { let s = "", a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
  /* per gewicht een eigen aanvraag: dan levert Google statische fonts (één gewicht ineen variabele font wordt in de pdf Type 3) */
  const urls = ["IBM+Plex+Sans:wght@400", "IBM+Plex+Sans:wght@600", "IBM+Plex+Mono:wght@400"].map(f => `https://fonts.googleapis.com/css2?family=${f}&display=swap`);
  return bkbFonts.p = Promise.all(urls.map(u => fetch(u).then(r => r.text()))).then(l => l.join("\n")).then(css => {
    const blokken = css.split("@font-face").slice(1).filter(b => /unicode-range:\s*U\+0000-00FF/.test(b));
    return Promise.all(blokken.map(b => { const fam = (/font-family:\s*'([^']+)'/.exec(b) || [])[1], w = (/font-weight:\s*(\d+)/.exec(b) || [, "400"])[1], url = (/url\(([^)]+)\)/.exec(b) || [])[1];
      return url ? fetch(url).then(r => r.arrayBuffer()).then(buf => `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${b64(buf)}) format('woff2')}`) : ""; }));
  }).then(f => { bkbFontCss = f.join(""); }).catch(() => {});
}
const BKB_PAPIER = { ink: "#1d2320", muted: "#5d6661", faint: "#8a918d", rule: "#d9d4c7", surface: "#fffdf8", sunk: "#f1ede3", gold: "#b08a3e", accent: "#2f5d50", "accent-ink": "#ffffff", "fan-gap": "#fffdf8" };
function bkbSvgImg(svg, kleuren, cls) {
  const cs = getComputedStyle(document.documentElement), v = Object.assign({}, ...LINE_KEYS.map(l => ({ ["l" + l]: cs.getPropertyValue("--l" + l).trim() })),
    ...Object.keys(LINES).map(l => ({ ["l" + l]: cs.getPropertyValue("--l" + l).trim() })), kleuren);
  const st = `<style>${bkbFontCss}svg{${Object.entries(v).filter(([, x]) => x).map(([k, x]) => `--${k}:${x}`).join(";")};--mono:'IBM Plex Mono',monospace;font-family:'IBM Plex Sans',sans-serif}text{font-family:inherit}</style>`;
  const s2 = svg.replace(/^<svg([^>]*)>/, (m, a) => `<svg xmlns="http://www.w3.org/2000/svg"${a.replace(/\sxmlns="[^"]*"/, "")}>${st}`);
  return `<img class="${cls || ""}" alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(s2)}">`;
}
window.boekWaaier = B => {
  /* twee helften met elk een eigen viewBox, als beeld: de rug loopt precies door het midden */
  const heel = bkbWaaierSvg({ labelGen: 7 }), vb = (/viewBox="([^"]+)"/.exec(heel) || [, "-540 -540 1080 1080"])[1].split(/\s+/).map(Number), V = -vb[0];
  /* elke helft is hetzelfde SVG met een eigen viewBox, als <img>: Paged.js breekt een losse inline SVG op, een beeld niet.
     De fonts gaan als data-URI mee in de SVG (bkbFontCss), zodat de pdf echte, ingebedde fonts heeft en geen Type 3. */
  /* in het boek een <img> per helft (Paged.js breekt een inline SVG op); een lokale drukrun vervangt die twee pagina's daarna door
     dezelfde helften als echte vector met ingebedde fonts (window.boekWaaierHelften), omdat tekst in een SVG-beeld Type 3 wordt */
  /* de tekening zelf komt er pas ná de opmaak in (boekNaKlaar): Paged.js breekt een hoge inline SVG anders op, en als beeld wordt
     de tekst in de pdf Type 3. Hier alleen een lege houder van de juiste maat. */
  const helft = links => "";
  const kop = `<div class="bk-wa-kop"><p class="bk-eyebrow">De waaier</p><h2 class="bk-h2">Alle voorouders in één beeld</h2><p class="bk-wa-uitleg">Het midden is ${esc(T.root)}; elke ring is een generatie verder terug. De kleur is de familie, hoe voller het vak, hoe sterker het bewijs. Goud: dezelfde voorouder via twee lijnen.</p></div>`;
  return `<section class="bk-hfst bk-waaier" data-bk="waaier" data-kop-l="De waaier" data-kop-r="">
    <div class="bk-wa-blad bk-wa-l" data-bkb-vervang="waaier-l">${kop}<div class="bk-wa-svg" data-bkb-helft="l"></div></div>
    <div class="bk-wa-blad bk-wa-r" data-bkb-vervang="waaier-r"><div class="bk-wa-svg" data-bkb-helft="r"></div></div>
  </section>`;
};
/* voor een lokale drukrun en boekNaKlaar: de twee helften van de waaier als inline SVG (met de kleuren in een eigen <style>), plus de kop van de linkerpagina */
window.boekWaaierHelften = () => {
  const heel = bkbWaaierSvg({ labelGen: 7 }), V = -(/viewBox="(-?[\d.]+)/.exec(heel) || [, -540])[1];
  const cs = getComputedStyle(document.documentElement), kl = Object.keys(LINES).map(l => `--l${l}:${cs.getPropertyValue("--l" + l).trim()}`).join(";");
  const pal = Object.entries(BKB_PAPIER).map(([k, x]) => `--${k}:${x}`).join(";");
  const st = `${kl};${pal};--mono:'IBM Plex Mono',monospace`;
  const h = links => heel.replace(/viewBox="[^"]+"/, `viewBox="${links ? -V : 0} ${-V} ${V} ${2 * V}"`).replace(/^<svg/, `<svg overflow="hidden" style="${st}"`);
  return { links: h(true), rechts: h(false), kop: `<p class="bk-eyebrow">De waaier</p><h2 class="bk-h2">Alle voorouders in één beeld</h2><p class="bk-wa-uitleg">Het midden is ${esc(T.root)}; elke ring is een generatie verder terug. De kleur is de familie, hoe voller het vak, hoe sterker het bewijs. Goud: dezelfde voorouder via twee lijnen.</p>` };
};
/* ---- voor de drukker, in de browser (GitHub Pages, zonder lokale hulpmiddelen) ----
   boekDrukKnoppen(B): uitleg bij de pdf-knop en een knop voor de omslag als één vel (achterkant · rug · voorkant) met een veld voor de
   rugbreedte; boekControle(doc, B): dpi per geplaatst beeld, fonts geladen, aantal pagina's, en één regel "Klaar voor de drukker". */
const bkbAfloopMm = B => ({ "3": 3, blurb: 3.175, "0": 0 })[String((B && (B.afloop ?? B.druk)) || "")] ?? 0;
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest(".bk-help");
  document.querySelectorAll(".bk-help[aria-expanded=true]").forEach(o => { if (o !== b) { o.setAttribute("aria-expanded", "false"); const t = document.getElementById(o.getAttribute("aria-controls")); if (t) t.hidden = true; } });
  if (!b) return;
  const t = document.getElementById(b.getAttribute("aria-controls")), open = b.getAttribute("aria-expanded") !== "true";
  b.setAttribute("aria-expanded", String(open)); if (t) t.hidden = !open;
});
/* the print fields for the step "Afwerking" (the spine width, id bkbRug) and the print action for the action bar (the cover pdf,
   id bkbOmslagPdf); boekDrukKnoppen keeps both together for the current panel */
window.bookPrintFields = B => {
  const af = bkbAfloopMm(B);
  return `<div class="op-f bkb-rug-rij"><label class="op-l" for="bkbRug">Rugbreedte</label><div><span class="bkb-rug"><input type="text" inputmode="decimal" id="bkbRug" value="" placeholder="bv. 16,5" title="De rugbreedte die je drukker opgeeft. Leeg: een schatting uit het aantal pagina's${af ? `; met ${String(af).replace(".", ",")} mm afloop` : ""}."> mm</span></div></div>`;
};
window.bookPrintActions = B => `<button type="button" class="btn" id="bkbOmslagPdf">Maak omslag-pdf</button>`;
window.boekDrukKnoppen = B => `<div class="bkb-omslag-rij">${window.bookPrintFields(B)}${window.bookPrintActions(B)}</div>`;
/* de omslag als één vel afdrukken: een verborgen iframe met de spread, de boekfonts en de boekstijlen; afdrukken zodra de fonts er zijn */
document.addEventListener("click", e => {
  const k = e.target.closest("#bkbOmslagPdf"); if (!k) return;
  const B = typeof bkB === "function" ? bkB() : {}, af = bkbAfloopMm(B);
  const n = +((($("#bkTel") || {}).textContent || "").match(/(\d+) pagina/) || [0, 200])[1];
  const rug = parseFloat((($("#bkbRug") || {}).value || "").replace(",", ".")) || window.bookSpineMm(n);
  const { html } = window.bookCoverDoc(B, { part: "spread", spineMm: rug, bleedMm: af, print: true });
  let fr = $("#bkbOmslagFrame"); if (fr) fr.remove();
  fr = document.createElement("iframe"); fr.id = "bkbOmslagFrame"; fr.title = "Omslag"; fr.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0";
  document.body.appendChild(fr); fr.srcdoc = html;
});
/* controle vooraf: per beeld de effectieve dpi (pixels tegen de breedte op papier), fonts geladen, pagina's; in stukjes, want verborgen
   pagina's (content-visibility) hebben geen maat: die worden even zichtbaar gemaakt om te meten */
window.boekControle = window.bookPrintCheck = async (doc, B, o = {}) => {
  if (!doc) return "";
  const pags = [...doc.querySelectorAll(".pagedjs_page")], mmPx = 25.4 / 96, laag = [], midden = [];
  let n = 0;
  for (let i = 0; i < pags.length; i++) {
    const pg = pags[i], imgs = pg.querySelectorAll(".bk-beeld img, .bk-op-foto img, .bkb-leeg img, figure img");
    if (!imgs.length) continue;
    const oud = pg.style.contentVisibility; pg.style.contentVisibility = "visible";
    imgs.forEach(im => {
      const r = im.getBoundingClientRect(), wMm = r.width * mmPx, hMm = r.height * mmPx; if (!wMm || !im.naturalWidth) return;
      const dpi = Math.min(im.naturalWidth / (wMm / 25.4), hMm ? im.naturalHeight / (hMm / 25.4) : 9e9); n++;
      const id = (im.closest("[data-img]") || {}).dataset ? im.closest("[data-img]").dataset.img : im.getAttribute("src");
      if (dpi < 200) laag.push([Math.round(dpi), id, i + 1]); else if (dpi < 300) midden.push([Math.round(dpi), id, i + 1]);
    });
    pg.style.contentVisibility = oud;
    if (i % 20 === 19) await new Promise(r => setTimeout(r, 0));
  }
  const fams = ["Libre Caslon Display", "Libre Caslon Text", "IBM Plex Sans", "IBM Plex Mono"], fd = doc.fonts;
  const mis = fd ? fams.filter(f => !fd.check(`12px "${f}"`)) : [];
  const punten = [];
  if (laag.length) punten.push(`${laag.length === 1 ? "één beeld wordt" : laag.length + " beelden worden"} onscherp op papier (${laag.slice(0, 6).map(x => `p. ${x[2]}`).join(", ")}${laag.length > 6 ? " …" : ""})`);
  if (mis.length) punten.push("de letters zijn nog niet helemaal geladen; wacht even");
  /* the pages against the limits of the chosen printer (producers.js: minPages, maxPages), with the printers that do fit */
  const PR = typeof Products !== "undefined" && Products.producers || {}, prId = o.producer || ({ "3": "saal", blurb: "blurb", "0": "peecho" })[String((B && B.afloop) || "")], pr = prId && PR[prId];
  const n2 = pags.length, lo = pr ? pr.minPages || 0 : 0, hi = pr ? pr.maxPages || Infinity : 400, buiten = n2 < lo || n2 > hi;
  const passen = ["saal", "blurb", "peecho"].map(k => PR[k]).filter(q => q && q !== pr && n2 >= (q.minPages || 0) && n2 <= (q.maxPages || Infinity)).map(q => q.label);
  const advies = n2 > hi ? `kies ${passen.length ? passen.join(" of ") + ", of " : ""}"In delen"` : n2 < lo ? "kies meer onderdelen of een andere drukker" : "";
  if (buiten) punten.push(pr ? `${n2} pagina's: ${pr.label} drukt ${lo ? lo + " tot " : "tot "}${hi} pagina's; ${advies}` : `${n2} pagina's: meer dan de meeste drukkers in één band binden; kies "In delen"`);
  if (o.short) return laag.length ? `Let op: ${laag.length === 1 ? "één beeld" : laag.length + " beelden"} onscherp` : mis.length ? "Even wachten: de letters laden"
    : buiten ? (pr ? `Let op: ${n2} pagina's, ${pr.label} drukt ${n2 > hi ? "tot " + hi : "vanaf " + lo}` : `Let op: ${n2} pagina's, te dik voor één band`) : "\u2713 Klaar voor de drukker"; /* one line for the action bar */
  const rest = `${pags.length} pagina's · ${n} beelden`;
  return punten.length ? `<b>Let op:</b> ${punten.map(esc).join("; ")}. <span class="small">${esc(rest)}</span>` : `<b>Klaar voor de drukker.</b> <span class="small">${esc(rest)}</span>`;
};
/* na de opmaak (Paged.js klaar), in het voorbeeld, bij "Maak pdf" en in de drukmodus: de twee helften van de waaier als inline vector
   in hun houders, en een plaat op elke lege linkerpagina vóór een familieopening. Werkt in de browser, zonder lokale hulpmiddelen. */
/* ---- book: map "Waar ze woonden" (a spread: the map on the left page, the villages per family or branch on the right) ----
   The map is the site's vector map (drawBase, proj) with the places of the people in this book (B.mensen), coloured by family, or by
   branch when the book has another centre (fanBranchColors). Like the fan, the drawing goes in after the layout (boekNaKlaar). */
const BKB_MAP_PAPER = "--land:#f1ecdf;--water:#dfe6e6;--faint:#8a918d;--ink:#1d2320;--surface:#fffdf8;--mono:'IBM Plex Mono',monospace";
function bkbMapData(B, onlyLine) {
  const keep = B && B.mensen ? new Set(B.mensen) : null, kern = (B && B.kern) || 1, br = fanBranchColors(kern);
  const lines = onlyLine ? [onlyLine] : bkbLijnen(B);
  const ev = EVENTS.filter(e => (!keep || keep.has(e.kw)) && lines.includes(lineOf(e.kw)) && (kern === 1 || br.branch(e.kw) >= 0));
  /* a group per family (whole tree) or per branch (another centre): its colour, its name and its places */
  const groupOf = kw => kern > 1 ? br.branch(kw) : lineOf(kw);
  const places = {};
  ev.forEach(e => { const a = places[e.p] = places[e.p] || { key: e.p, people: new Set(), years: [], groups: {} }; a.people.add(e.kw); a.years.push(e.y); const g = groupOf(e.kw); a.groups[g] = (a.groups[g] || 0) + 1; });
  const list = Object.values(places).sort((a, b) => b.people.size - a.people.size);
  list.forEach(a => { a.group = +Object.entries(a.groups).sort((x, y) => y[1] - x[1])[0][0]; a.color = kern > 1 ? `var(--l${LINE_KEYS[a.group]})` : `var(--l${a.group})`; });
  const groups = kern > 1 ? br.legend.map((x, b) => ({ id: b, color: x.color, name: x.person.n })) : lines.map(l => ({ id: l, color: `var(--l${l})`, name: LINES[l].name }));
  return { list, groups };
}
/* the map as an SVG string; o.small = a cut-out around the places (for a family opening) */
function bkbMapSvg(B, o = {}) {
  const { list } = bkbMapData(B, o.line);
  const svg = el("svg", { viewBox: `0 0 ${MW} ${MH}`, role: "img", "aria-label": "Kaart met de woonplaatsen", "font-family": "IBM Plex Sans, sans-serif" });
  drawBase(svg, false, !!o.small);
  const dots = el("g", {}, svg), labels = el("g", {}, svg), placed = [];
  const fs = o.small ? 22 : 12.5, rr = o.small ? 2 : 1; /* units: the full map is ±180 mm high, 1 unit ≈ 0.5 pt; labels ≥ 6 pt */
  list.forEach(a => { const P = PLACES[a.key], [x, y] = proj(P.la, P.lo), r = (3 + 2.2 * Math.sqrt(a.people.size)) * rr;
    el("circle", { cx: x, cy: y, r, fill: a.color, "fill-opacity": 0.85, stroke: "var(--surface)", "stroke-width": 1.2 * rr }, dots); });
  list.forEach((a, i) => {
    if (i > (o.small ? 6 : 40)) return;
    const P = PLACES[a.key], [x, y] = proj(P.la, P.lo), r = (3 + 2.2 * Math.sqrt(a.people.size)) * rr, nm = placeName(a.key);
    if (!labelFits(placed, x + r + 3, y + fs / 3, nm, fs)) return;
    /* a light patch behind the name instead of a stroked halo: stroked text becomes Type 3 in a pdf */
    el("rect", { x: x + r + 1.5, y: y + fs / 3 - fs * 0.85, width: nm.length * fs * 0.56 + 3, height: fs * 1.1, rx: 2, fill: "var(--surface)", "fill-opacity": 0.72 }, labels);
    txt(labels, x + r + 3, y + fs / 3, nm, { "font-size": fs, fill: "var(--ink)" });
  });
  if (o.small && list.length) { /* cut out the area of the places, with room for the labels */
    const pts = list.map(a => proj(PLACES[a.key].la, PLACES[a.key].lo)), xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    let x0 = Math.min(...xs) - 60, x1 = Math.max(...xs) + 170, y0 = Math.min(...ys) - 60, y1 = Math.max(...ys) + 60;
    const w = Math.max(x1 - x0, 300), h = Math.max(y1 - y0, 220); x0 = Math.max(0, (x0 + x1) / 2 - w / 2); y0 = Math.max(0, (y0 + y1) / 2 - h / 2);
    svg.setAttribute("viewBox", `${x0.toFixed(0)} ${y0.toFixed(0)} ${Math.min(w, MW - x0).toFixed(0)} ${Math.min(h, MH - y0).toFixed(0)}`);
  }
  $$("text", svg).forEach(t => { if (/var\(--mono\)/.test(t.getAttribute("font-family") || "")) t.setAttribute("font-family", "IBM Plex Mono, monospace"); }); /* a var() in an SVG attribute is not resolved in print */
  svg.setAttribute("style", BKB_MAP_PAPER + ";" + LINE_KEYS.map(l => `--l${l}:${getComputedStyle(document.documentElement).getPropertyValue("--l" + l).trim()}`).join(";"));
  return svg.outerHTML;
}
/* the right page: per family (or branch) its villages, the years and the number of ancestors there */
function bkbMapList(B) {
  const { list, groups } = bkbMapData(B);
  return groups.map(g => {
    const pl = list.filter(a => a.group === g.id).slice(0, 7); if (!pl.length) return "";
    return `<div class="bkb-kl-fam" style="--lc:${g.color}"><p class="bkb-kl-naam"><i></i>${esc(g.name)}</p><ul>${pl.map(a => { const y0 = Math.min(...a.years), y1 = Math.max(...a.years);
      return `<li><span>${esc(placeName(a.key))}</span> <small>${y0 === y1 ? y0 : `${y0}–${y1}`} · ${a.people.size}</small></li>`; }).join("")}</ul></div>`;
  }).join("");
}
window.bookMap = B => {
  const kern = (B && B.kern) || 1;
  return `<section class="bk-hfst bkb-kaart" id="bk-kaart" data-bk="kaart" data-kop-l="Waar ze woonden" data-kop-r="">
    <div class="bkb-ka-blad"><div class="bkb-ka-svg" data-bkb-kaart="1" style="aspect-ratio:${MW}/${MH};width:min(calc(var(--bk-pw,210mm) - 20mm),calc((var(--bk-ph,297mm) - 24mm) * ${(MW / MH).toFixed(4)}))"></div></div>
    <div class="bkb-ka-tekst"><p class="bk-eyebrow">Kaart</p><h2 class="bk-h2">Waar ze woonden</h2>
      <p class="bkb-ka-uitleg">Elke stip is een dorp of stad waar een voorouder in dit boek geboren werd, trouwde, woonde of stierf; hoe groter de stip, hoe meer voorouders. De kleur is ${kern > 1 ? "de tak" : "de familie"}. Achter elk dorp: de jaren en het aantal voorouders.</p>
      <div class="bkb-ka-lijst">${bkbMapList(B)}</div></div>
  </section>`;
};
/* a small map of a family's villages, for its opening */
window.bookMapSmall = (B, l) => `<div class="bkb-op-kaart">${bkbMapSvg(B, { line: l, small: true })}</div>`;
/* ---- book: "Waar de families elkaar kruisten" (only the tree of the children, #s-): the places where ancestors of both sides
   occur within VB_GAP years, as on the site (verbandenData). A zoomed map (filled after the layout) and per place the closest
   meeting, a time strip and the two ancestors, with a link to their profile in the book. ---- */
function bkbCrossMap(L, sized) {
  const svg = el("svg", { viewBox: `0 0 ${MW} ${MH}`, role: "img", "aria-label": "Kaart van de plaatsen waar beide families voorkwamen", "font-family": "IBM Plex Sans, sans-serif" });
  drawBase(svg, true);
  const rad = r => 5 + Math.min(10, r.n * 0.8);
  L.slice().reverse().forEach(r => { const P = PLACES[r.k], [cx, cy] = proj(P.la, P.lo), q = rad(r);
    el("path", { d: `M${cx} ${cy - q}A${q} ${q} 0 0 0 ${cx} ${cy + q}Z`, fill: "var(--l8)" }, svg);
    el("path", { d: `M${cx} ${cy - q}A${q} ${q} 0 0 1 ${cx} ${cy + q}Z`, fill: "var(--l12)" }, svg);
    el("circle", { cx, cy, r: q, fill: "none", stroke: "var(--ink)", "stroke-width": 1.5 }, svg); });
  const boxes = [], dots = L.map(r => { const P = PLACES[r.k], [cx, cy] = proj(P.la, P.lo), q = rad(r); return [cx - q, cy - q, cx + q, cy + q]; });
  L.slice(0, 12).forEach(r => {
    const P = PLACES[r.k], [cx, cy] = proj(P.la, P.lo), d = rad(r) + 3, nm = placeName(r.k), w = nm.length * 6.6;
    const opts = [[cx + d, cy + 4, "start"], [cx - d, cy + 4, "end"], [cx, cy - d - 2, "middle"], [cx, cy + d + 11, "middle"]];
    const bx = ([x, y, a]) => { const l = a === "start" ? x : a === "end" ? x - w : x - w / 2; return [l, y - 10, l + w, y + 2]; };
    const o = opts.find(c => ![...boxes, ...dots].some(q => { const b = bx(c); return b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1]; })); if (!o) return;
    boxes.push(bx(o)); txt(svg, o[0], o[1], nm, { "font-size": 12, "text-anchor": o[2], fill: "var(--ink)" });
  });
  $$("text", svg).forEach(t => { if (/var\(--mono\)/.test(t.getAttribute("font-family") || "")) t.setAttribute("font-family", "IBM Plex Mono, monospace"); });
  const pts = L.map(r => proj(PLACES[r.k].la, PLACES[r.k].lo)), xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
  const x0 = Math.min(...xs) - 70, x1 = Math.max(...xs) + 70, y0 = Math.min(...ys) - 60, y1 = Math.max(...ys) + 60;
  const w = Math.max(x1 - x0, 360), h = Math.max(y1 - y0, w * 0.75), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  svg.setAttribute("viewBox", `${(cx - w / 2).toFixed(0)} ${(cy - h / 2).toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}`);
  svg.setAttribute("style", BKB_MAP_PAPER + ";" + LINE_KEYS.map(l => `--l${l}:${getComputedStyle(document.documentElement).getPropertyValue("--l" + l).trim()}`).join(";"));
  return sized ? { w, h } : svg.outerHTML;
}
window.bookCrossings = B => {
  if (T.key !== "s" || (B && B.lijn) || (B && B.start && B.start.aan)) return ""; /* both sides are needed: the whole book of the children */
  const L = verbandenData(); if (!L.length) return "";
  const y0 = Math.floor(Math.min(...L.map(r => Math.min(...r.h.map(e => e.y), ...r.a.map(e => e.y)))) / 50) * 50, y1 = 2000, { w, h } = bkbCrossMap(L, true);
  const wie = e => `<a class="bk-ref" href="#bk-kw-${e.kw}">${esc(person(e.kw).n)}</a> <span class="bkb-vb-ev">${esc(vbKort(e.t))}, ${e.y}</span>`;
  return `<section class="bk-hfst bkb-kruis" id="bk-kruis" data-bk="kruis" data-kop-l="Waar de families elkaar kruisten" data-kop-r="">
    <p class="bk-eyebrow">De twee kanten</p><h2 class="bk-h2">Waar de families elkaar kruisten</h2>
    <p class="bkb-vb-lede">Harrie en Alies hebben, voor zover bekend, geen gemeenschappelijke voorouders. Toch woonden hun families vaak in dezelfde dorpen. Dit zijn de ${L.length} plaatsen waar voorouders van beide kanten binnen ${VB_GAP} jaar van elkaar voorkomen. Een gedeelde plaats en tijd betekent niet dat ze elkaar kenden.</p>
    <p class="bkb-vb-leg"><i class="bkb-vb-h"></i>${esc(branchName("h"))} <i class="bkb-vb-a"></i>${esc(branchName("a"))}</p>
    <div class="bkb-vb-kaart" data-bkb-kruis="1" style="aspect-ratio:${w.toFixed(0)}/${h.toFixed(0)}"></div>
    <ol class="bkb-vb-lijst">${L.map(r => `<li><p class="bkb-vb-kop"><b>${esc(placeName(r.k))}</b> <span>${esc(vbAfstand(r.best))}</span> <small>${r.van === r.tot ? r.van : r.van + "–" + r.tot} · ${r.kwH.size + r.kwA.size} voorouders</small></p>
      ${vbStrook(r, y0, y1).replace(/<title>[^<]*<\/title>/g, "")}
      <p class="bkb-vb-paar"><i class="bkb-vb-h"></i>${wie(r.best.h)}<br><i class="bkb-vb-a"></i>${wie(r.best.a)}</p></li>`).join("")}</ol>
    <p class="bkb-vb-as">De tijdstrook loopt van ${y0} tot ${y1}: boven de lijn ${esc(branchName("h"))}, eronder ${esc(branchName("a"))}; het vak markeert de dichtste ontmoeting.</p>
  </section>`;
};
/* ---- book: timeline "Hun levens in de tijd" (a spread): every life as a thin bar from birth to death in the colour of its family
   (or branch), grouped and sorted by birth; only proven years (one known year = a dot, nothing estimated). Behind it the periods and
   events of "Hun tijd" (CONTEXT). Left page the first half of the families, right page the second (whole tree: father's and
   mother's side). Drawn after the layout at the exact size of its box, in mm, so every letter is at least 6 pt. ---- */
function bkbTimeGroups(B) {
  const kern = (B && B.kern) || 1, br = fanBranchColors(kern), keep = B && B.mensen ? B.mensen : ancestors.map(p => p.kw);
  const groups = kern > 1 ? br.legend.map((x, b) => ({ id: b, color: x.color, name: x.person.n })) : bkbLijnen(B).map(l => ({ id: l, color: `var(--l${l})`, name: LINES[l].name }));
  const of = kw => kern > 1 ? br.branch(kw) : lineOf(kw);
  const lives = [...new Set(keep)].map(person).filter(p => p && !p.living).map(p => ({ p, g: of(p.kw), b: yr(p.b) || yr(p.bapt) || null, d: yr(p.d) || null })).filter(x => x.b || x.d);
  groups.forEach(g => { g.lives = lives.filter(x => x.g === g.id).sort((a, b) => (a.b || a.d) - (b.b || b.d)); });
  const all = lives.flatMap(x => [x.b, x.d].filter(Boolean));
  return { groups: groups.filter(g => g.lives.length), y0: Math.floor(Math.min(...all) / 25) * 25, y1: new Date().getFullYear() };
}
function bkbTimelineSvg(B, half, wMm, hMm) {
  const { groups, y0, y1 } = bkbTimeGroups(B), n = Math.ceil(groups.length / 2), gs = half ? groups.slice(n) : groups.slice(0, n);
  const PT = 0.3528, fs = 6.4 * PT, top = 9, head = 4.2, X = y => (y - y0) / (y1 - y0) * wMm;
  const rows = gs.reduce((s, g) => s + g.lives.length, 0), rowH = Math.min(2.2, (hMm - top - 7.5 - gs.length * (head + 1.5)) / Math.max(rows, 1)), bar = Math.max(0.3, rowH * 0.7);
  let o = `<svg viewBox="0 0 ${wMm} ${hMm}" width="${wMm}mm" height="${hMm}mm" font-family="IBM Plex Sans, sans-serif" role="img" aria-label="Tijdlijn met de levens van de voorouders">`;
  /* Hun tijd: periods as bands, events as thin lines, short labels under the axis (two rows, no overlap) */
  const ctx = (typeof CONTEXT !== "undefined" ? CONTEXT : []).filter(c => c.tl !== false && c.y < y1 && (c.y2 || c.y) > y0), used = [[], []]; /* tl: false = not on a timeline */
  ctx.filter(c => c.y2).forEach(c => { o += `<rect x="${X(Math.max(c.y, y0)).toFixed(2)}" y="${top}" width="${Math.max(0.4, X(Math.min(c.y2, y1)) - X(Math.max(c.y, y0))).toFixed(2)}" height="${hMm - top}" fill="#e8dfc9" fill-opacity="0.55"/>`; });
  ctx.filter(c => !c.y2 && c.tl !== false).forEach(c => { o += `<line x1="${X(c.y).toFixed(2)}" x2="${X(c.y).toFixed(2)}" y1="${top}" y2="${hMm}" stroke="#b08a3e" stroke-width="0.15" stroke-dasharray="0.6 0.6"/>`; });
  ctx.filter(c => c.tl !== false).forEach(c => {
    const t = c.y2 ? c.short : c.t.split(/[,:(]/)[0].trim(), w = t.length * fs * 0.52, x = Math.min(Math.max(X(c.y) + 0.6, 0), wMm - w);
    const r = [0, 1].find(k => !used[k].some(u => x < u[1] + 1 && x + w > u[0] - 1)); if (r === undefined) return; used[r].push([x, x + w]);
    o += `<text x="${x.toFixed(2)}" y="${(top + 2.6 + r * 2.7).toFixed(2)}" font-size="${(fs * 0.95).toFixed(2)}" fill="#7a5c26">${esc(t)}</text>`;
  });
  /* axis: every 50 years */
  for (let y = Math.ceil(y0 / 50) * 50; y <= y1; y += 50) { const x = X(y), a = x < 5 ? "start" : x > wMm - 5 ? "end" : "middle"; /* the outer years stay on the page */
    o += `<line x1="${x.toFixed(2)}" x2="${x.toFixed(2)}" y1="${top - 1}" y2="${hMm}" stroke="#d9d4c7" stroke-width="0.12"/><text x="${x.toFixed(2)}" y="${(top - 2).toFixed(2)}" font-size="${fs.toFixed(2)}" text-anchor="${a}" font-family="IBM Plex Mono, monospace" fill="#5d6661">${y}</text>`; }
  let y = top + 6.5;
  gs.forEach(g => {
    o += `<circle cx="1.2" cy="${(y + head / 2 - 0.6).toFixed(2)}" r="1.1" fill="${g.color}"/><text x="3.4" y="${(y + head / 2 + 0.6).toFixed(2)}" font-size="${(fs * 1.15).toFixed(2)}" font-weight="600" fill="#1d2320">${esc(g.name)} <tspan font-weight="400" fill="#5d6661">${g.lives.length}</tspan></text>`;
    y += head;
    g.lives.forEach(l => {
      const cy = y + rowH / 2;
      if (l.b && l.d && l.d >= l.b) o += `<rect x="${X(l.b).toFixed(2)}" y="${(cy - bar / 2).toFixed(2)}" width="${Math.max(0.4, X(l.d) - X(l.b)).toFixed(2)}" height="${bar.toFixed(2)}" rx="${(bar / 2).toFixed(2)}" fill="${g.color}" fill-opacity="${({ A: 0.95, B: 0.8, C: 0.5, D: 0.3 })[l.p.st] || 0.8}"/>`;
      else o += `<circle cx="${X(l.b || l.d).toFixed(2)}" cy="${cy.toFixed(2)}" r="${Math.max(0.35, bar / 2).toFixed(2)}" fill="${g.color}" fill-opacity="0.8"/>`;
      y += rowH;
    });
    y += 1.5;
  });
  const cs = getComputedStyle(document.documentElement);
  return o.replace("<svg ", `<svg style="${LINE_KEYS.map(l => `--l${l}:${cs.getPropertyValue("--l" + l).trim()}`).join(";")}" `) + "</svg>";
}
window.bookTimeline = B => {
  const { groups } = bkbTimeGroups(B); if (!groups.length) return "";
  const kern = (B && B.kern) || 1, n = Math.ceil(groups.length / 2), kant = h => (kern === 1 && !(B && B.lijn) && groups.length > 4 ? (T.key === "s" ? branchName(h ? "a" : "h") : h ? "Moederskant" : "Vaderskant") : "");
  return `<section class="bk-hfst bkb-tijd" id="bk-tijdlijn" data-bk="tijdlijn" data-kop-l="Tijdlijn" data-kop-r="">
    <div class="bkb-ti-blad"><div class="bkb-ti-kop"><p class="bk-eyebrow">Tijdlijn${kant(0) ? " · " + kant(0) : ""}</p><h2 class="bk-h2">Hun levens in de tijd</h2>
      <p class="bkb-ti-uitleg">Elke balk is één leven, van geboorte tot overlijden, in de kleur van ${kern > 1 ? "de tak" : "de familie"}; hoe voller de kleur, hoe sterker het bewijs. Een stip: maar één jaar bekend. Op de achtergrond hun tijd: de banden zijn tijdvakken, de stippellijnen gebeurtenissen.</p></div>
      <div class="bkb-ti-svg" data-bkb-tijd="0"></div></div>
    ${groups.length > n ? `<div class="bkb-ti-blad"><div class="bkb-ti-kop"><p class="bk-eyebrow">Tijdlijn${kant(1) ? " · " + kant(1) : ""}</p></div><div class="bkb-ti-svg" data-bkb-tijd="1"></div></div>` : ""}
  </section>`;
};
window.boekNaKlaar = (doc, B) => {
  doc = doc || document;
  const h = $$("[data-bkb-helft]", doc).filter(x => !x.firstElementChild);
  if (h.length) { const hv = window.boekWaaierHelften(); h.forEach(x => { x.innerHTML = x.dataset.bkbHelft === "l" ? hv.links : hv.rechts; }); }
  $$("[data-bkb-kaart]", doc).filter(x => !x.firstElementChild).forEach(x => { x.innerHTML = bkbMapSvg(B || {}); });
  $$("[data-bkb-tijd]", doc).filter(x => !x.firstElementChild).forEach(x => { /* measured: a page out of view (content-visibility) has no size */
    const pg = x.closest(".pagedjs_page"), cv = pg ? pg.style.contentVisibility : ""; if (pg) pg.style.contentVisibility = "visible";
    const r = x.getBoundingClientRect(), mm = 25.4 / 96; if (pg) pg.style.contentVisibility = cv;
    if (r.width && r.height) x.innerHTML = bkbTimelineSvg(B || {}, +x.dataset.bkbTijd, +(r.width * mm).toFixed(1), +(r.height * mm).toFixed(1)); });
  const kr = $$("[data-bkb-kruis]", doc).filter(x => !x.firstElementChild); if (kr.length) { const L = verbandenData(); kr.forEach(x => { x.innerHTML = bkbCrossMap(L); }); }
  $$(".pagedjs_blank_page", doc).forEach(pg => {
    const op = pg.nextElementSibling && $(".bk-open[data-lijn]", pg.nextElementSibling), area = $(".pagedjs_area", pg);
    if (!op || !area || area.dataset.plaat) return;
    const html = window.boekLeegPlaat(B || {}, +op.dataset.lijn); if (!html) return;
    area.style.position = "relative"; area.dataset.plaat = "1"; area.insertAdjacentHTML("beforeend", html);
  });
};
/* de plaatsen van een familie, op gewicht: hoe vaak ze in de levens van haar voorouders voorkomen */
const bkbPlaatsen = l => topPlaces(ancestors.filter(p => lineOf(p.kw) === l && !p.living), 12).map(x => x[0]);
/* het openingsbeeld per familie, uitgekozen op de plaatsen van die familie en op de maat van het origineel (minstens ±2400 px, zodat
   het op een hele pagina scherp is): "afloop" = foto over de hele pagina, "plaat" = prent of tekening heel, met rand en bijschrift.
   De samengestelde boom (s) gebruikt de keuze van de lijn in de boom van Harrie (16–23) of Alies (24–31). Zonder keuze: het
   omslagbeeld van de belangrijkste plaats. */
const BKB_OPEN = {
  h: { 9: ["hist-jorwerd-pp19052819", "plaat"], 10: ["bank-rm-peperga-rpf002654", "afloop"], 11: ["hist-steenwijkerwold-t1894a2911", "plaat"], 12: ["bank-na-leeuwarden-034-1184", "afloop"],
    13: ["hist2-makkum-museum001206", "plaat"], 14: ["hist-heeg-seum022356", "plaat"], 15: ["hist-workum-2rppao2671", "plaat"] },
  a: { 8: ["hist-oudeschoot-t1894a2909", "plaat"], 9: ["bank-na-joure-027-1050", "afloop"] }
};
/* in de samengestelde boom is lijn l (8–15) een grootouder: 8–11 aan Harries kant (zijn lijnen 2(l−4) en 2(l−4)+1), 12–15 aan die van Alies */
const bkbOpenKeuze = l => { if (T.key !== "s") return (BKB_OPEN[T.key] || {})[l] || null; const [bm, b] = l < 12 ? [BKB_OPEN.h, 2 * (l - 4)] : [BKB_OPEN.a, 2 * (l - 8)]; return bm[b] || bm[b + 1] || null; };
/* de packs van de gekozen openingsbeelden en de tekst van de zoeklijst, vóór het boek wordt opgebouwd (go() wacht hierop) */
window.boekVoorladen = () => {
  const ids = [...Object.values(T.key === "s" ? Object.assign({}, BKB_OPEN.h, BKB_OPEN.a) : BKB_OPEN[T.key] || {}).map(k => k[0]),
    ...LINE_KEYS.filter(l => LINES[l]).flatMap(l => bkbPlaatsen(l).map(x => OMS[x] && OMS[x].orig_id).filter(Boolean))]; /* ook de terugvalbeelden: hun maat staat in de pack */
  return Promise.all([archTekst(), bkbFonts(), window.boekVersteVoorladen(), ...[...new Set(ids.map(i => ARCH_ID[i] && ARCH_ID[i].pack).filter(Boolean))].map(loadPack)]);
};
/* zonder keuze: het historische beeld van de belangrijkste plaats, als plaat zo groot als het origineel bij 200 dpi toelaat */
const bkbPx = im => Math.max(im.ow || 0, im.w || 0);
/* de pixels van de versie die het boek echt gebruikt: lokaal (hires) het origineel, op de site de webversie (img/archief) */
const bkbPxGebruikt = (im, B) => B && B.hires ? Math.max(im.ow || 0, im.w || 0, (im.groot || {}).w || 0) : Math.max(im.w || 0, (im.groot || {}).w || 0);
function bkbOpenBeeld(l, B) {
  const [pw, ph] = bkbFormaatMm(B || {}), k = bkbOpenKeuze(l), im = k && IMG_ID[k[0]];
  const plaat = o => Object.assign({}, o, { maat: "plaat", maxMm: Math.floor(bkbPxGebruikt(o, B) / 220 * 25.4) }); /* ruim boven 200 dpi */
  if (im) { /* een paginavullend beeld alleen als het op de hele pagina minstens 200 dpi haalt; anders als plaat */
    const ok = k[1] !== "afloop" || (bkbPxGebruikt(im, B) >= pw / 25.4 * 200 && (im.h || 0) * (bkbPxGebruikt(im, B) / (im.w || 1)) >= ph / 25.4 * 200);
    return ok && k[1] !== "plaat" ? Object.assign({ maat: k[1] }, im) : plaat(im); /* een plaat nooit groter dan 220 dpi toelaat */
  }
  const kand = bkbPlaatsen(l).map(x => OMS[x] && IMG_ID[OMS[x].orig_id]).filter(Boolean).sort((a, b) => bkbPxGebruikt(b, B) - bkbPxGebruikt(a, B));
  return kand[0] ? plaat(kand[0]) : null;
}
window.boekOpening = (B, l) => {
  const L = LINES[l]; if (!L) return "";
  /* the people of this family in this book (B.mensen: without left-out hypotheses and aliases), as in "Over dit boek" and on the cover */
  const keep = B.mensen ? new Set(B.mensen) : null, ps = keep ? B.mensen.map(person).filter(p => p && lineOf(p.kw) === l) : ancestors.filter(p => lineOf(p.kw) === l), stem = (L.stem || []).map(person).filter(p => p && !p.living);
  const im = B.beeld !== "geen" ? bkbOpenBeeld(l, B) : null, jaar = bkbJaren(ps), pls = bkbPlaatsen(l).slice(0, 5).map(placeName);
  const cap = im ? `${esc(placeName(im.key) ? placeName(im.key) + ": " : "")}${esc(bkbTitel(im))}${bkbCredit(im) ? ` <span class="bk-credit">${esc(bkbCredit(im))}</span>` : ""}` : "";
  return `<div class="bk-open${im ? " bk-open-beeld" : ""}" data-lijn="${l}">
    ${im ? `<div class="bk-op-links bk-op-${im.maat}"${im.maxMm ? ` style="--bk-plaat-max:${Math.min(im.maxMm, 172)}mm"` : ""}>${bkbFig(im, B, im.maat, "bk-op-foto", im.maat === "plaat" ? cap : "")}</div>` : ""}
    <div class="bk-op-rechts">
      <p class="bk-eyebrow">Familie</p>
      <h1 class="bk-h1 bk-op-naam">${esc(L.name)}</h1>
      ${L.sub ? `<p class="bk-op-sub">met ${esc(L.sub)}</p>` : ""}
      <p class="bk-op-feiten">${[L.region, jaar ? `vanaf ${jaar}` : "", `${ps.filter(p => !p.living).length} voorouders`].filter(Boolean).map(esc).join(" · ")}</p>
      ${pls.length ? `<p class="bk-op-plaatsen">${pls.map(esc).join(" · ")}</p>` : ""}
      <div class="bk-op-waaier">${bkbWaaierSvg({ root: l, maxGen: 7, labelGen: 5, keep })}</div>
      ${bkbTakLijst(bkbTakken(l), "bkb-takken")}
      ${im && im.maat !== "plaat" ? `<p class="bk-op-bijschrift">${cap}</p>` : ""}
    </div>
  </div>`;
};
/* De verste voorouder van een familie: de oudste bewezen voorouder (A/B in de hele keten, alleen bewezen jaren, zoals de site),
   met daaronder, kleiner, hoe ver de aanwijzingen reiken. Met een beeld uit die plaats en tijd (lifeArch: foto, prent of kaart). */
function bkbVerste(l) {
  const ps = ancestors.filter(p => lineOf(p.kw) === l && !p.living && !p.aliasOf);
  const bew = ps.filter(p => (p.st === "A" || p.st === "B") && ST_RANK[ketenBest(p).st] <= 1).map(p => [oudsteJaar(p, true), p]).filter(x => x[0] < 9999).sort((a, b) => a[0] - b[0] || gen(b[1].kw) - gen(a[1].kw));
  const alle = ps.map(p => [oudsteJaar(p), p]).filter(x => x[0] < 9999).sort((a, b) => a[0] - b[0]);
  return { bew: bew[0] || null, aanw: alle[0] && (!bew[0] || alle[0][0] < bew[0][0]) ? alle[0] : null };
}
/* een beeld uit die plaats en tijd; anders de stadsplattegrond of de grietenijkaart van Schotanus van zijn plaats */
const bkbVersteBeeld = (p, B) => {
  const groot = im => im && bkbPxGebruikt(im, B) >= 1200;
  const uitTijd = (lifeArch(p) || []).map(a => IMG_ID[a.id]).find(groot);
  if (uitTijd) return uitTijd;
  const pls = [p.bp, p.dp, ...(p.res || []).map(r => r.p)].filter(Boolean);
  for (const k of pls) { const im = imgOf("stadsplan", k) || gemMap((PLACES[k] || {}).gem) || (isGemeente(k) ? gemMap(k) : null); if (groot(im)) return im; }
  return null;
};
window.boekVersteVoorladen = () => Promise.all(LINE_KEYS.filter(l => LINES[l]).map(l => { const v = bkbVerste(l).bew; return v ? Promise.all([...new Set((lifeArch(v[1]) || []).slice(0, 8).map(a => a.pack).filter(Boolean))].map(loadPack)) : null; }));
window.boekVerste = (B, l) => {
  const L = LINES[l], v = bkbVerste(l); if (!L || !v.bew) return "";
  /* generations and the end of the line count from the start of the book (B.start: one person or a couple) */
  const st = B.start || {}, [jaar, p] = v.bew, g = st.aan ? bkGen(p.kw) - (st.paar ? 2 : 1) : gen(p.kw) - 1, pl = placeName(p.bp) || placeName(p.dp) || placeName(((p.res || [])[0] || {}).p) || "";
  const kort = kortZin(p).replace(/<\/?p[^>]*>/g, "");
  const im = B.beeld !== "geen" ? bkbVersteBeeld(p, B) : null, px = im ? bkbPxGebruikt(im, B) : 0;
  const cap = im ? `${esc(bkbTitel(im))}${bkbCredit(im) ? ` <span class="bk-credit">${esc(bkbCredit(im))}</span>` : ""}` : "";
  const wie = st.aan ? [person(st.kw), st.paar ? person(st.kw + 1) : null].filter(Boolean).map(firstName).join(" en ") : T.key === "s" ? "de kinderen" : T.root;
  return `<section class="bk-verste" data-lijn="${l}" style="--lc:var(--l${l})" data-kop-l="${esc(L.name)}" data-kop-r="De verste voorouder">
    <p class="bk-eyebrow">De verste voorouder · ${esc(L.name)}</p>
    <p class="bk-vv-jaar">${jaar}</p>
    <h2 class="bk-vv-naam"><a class="bk-ref" href="#bk-kw-${p.kw}">${esc(p.n)}</a></h2>
    <p class="bk-vv-feiten">${[pl, lifeYears(p) !== "jaartallen onbekend" ? lifeYears(p) : "", "bewijs " + p.st].filter(Boolean).map(esc).join(" · ")}</p>
    ${kort ? `<p class="bk-vv-kort">${kort}</p>` : ""}
    <div class="bk-vv-lijn" aria-label="${g} generaties tot ${esc(wie)}"><span>${g} generaties</span><i style="--n:${Math.min(g, 16)}"></i><span>${esc(wie)}</span></div>
    ${v.aanw ? `<p class="bk-vv-aanw">Met aanwijzingen reikt de familie terug tot ${v.aanw[0]}: ${esc(v.aanw[1].n)} (bewijs ${esc(v.aanw[1].st)}).</p>` : ""}
    ${im ? `<div class="bk-vv-beeld" style="--bk-plaat-max:${Math.min(Math.floor(px / 220 * 25.4), 160)}mm">${bkbFig(im, B, "half", "bk-vv-foto", cap)}</div>` : ""}
  </section>`;
};
/* een lege linkerpagina vóór een familieopening (Paged.js voegt die in om de spread links te laten beginnen) krijgt een rustige plaat
   uit de streek van die familie: de kaart van Schotanus van haar belangrijkste grietenij, anders een ander beeld van haar plaatsen.
   Alleen beelden die op 150 mm breed minstens 200 dpi halen. Voor de drukmodus (vult de pagina na het opmaken) en het voorbeeld. */
window.boekLeegPlaat = (B, l) => {
  const L = LINES[l]; if (!L || (B && B.beeld === "geen")) return "";
  const open = bkbOpenBeeld(l, B), genoeg = im => im && im.id !== (open && open.id) && bkbPxGebruikt(im, B) >= 1200;
  const pls = bkbPlaatsen(l), kaarten = pls.map(k => gemMap((PLACES[k] || {}).gem) || (isGemeente(k) ? gemMap(k) : null));
  const im = kaarten.find(genoeg) || pls.map(k => OMS[k] && IMG_ID[OMS[k].orig_id]).find(genoeg);
  if (!im) return "";
  const cap = `${esc(bkbTitel(im))}${bkbCredit(im) ? ` <span class="bk-credit">${esc(bkbCredit(im))}</span>` : ""}`;
  return `<div class="bkb-leeg" style="--lc:var(--l${l})">${bkbFig(im, B || {}, "half", "bkb-leeg-foto", cap)}</div>`;
};
/* beeldkeuze per hoofdstuk: persoonsbeelden (akten, graven, boerderijen) van de familie, van jong naar oud; geen portretten (die staan
   al bij de profielen) en nooit iets van levenden. soort "familie" (lijn), "persoon" (kw) of "verhaal". */
window.boekBeelden = (B, o = {}) => {
  if (B.beeld === "geen") return [];
  const max = B.beeld === "veel" ? 24 : 6, mensen = new Set(B.mensen.map(imgKey));
  let lijst = [];
  if (o.soort === "verhaal" && o.verhaal) lijst = storyImgs(o.verhaal);
  else {
    const kws = o.soort === "persoon" || o.soort === "profiel" ? [o.kw] : ancestors.filter(p => lineOf(p.kw) === o.lijn && !p.living).sort((a, b) => gen(a.kw) - gen(b.kw)).map(p => p.kw);
    kws.forEach(kw => { const k = imgKey(kw); if (!mensen.has(k)) return; IMGS.filter(i => i.soort === "persoon" && !i.portret && String(i.key) === k).forEach(i => lijst.push(i)); });
  }
  const gezien = new Set();
  /* dpi-bewust: een half beeld staat op ±136 mm en vraagt bij 200 dpi minstens ±1100 px; een kwart (o.maat "kwart") ±550 px */
  const minPx = o.maat === "kwart" ? 550 : 1100;
  return lijst.filter(im => im && bkbPxGebruikt(im, B) >= minPx && !gezien.has(im.id) && gezien.add(im.id)).slice(0, max).map(im => ({ id: im.id, src: window.boekSrc(im, B), t: im.bijschrift || im.t || "", credit: bkbCredit(im) })).filter(x => x.src);
};

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
    ${verhalenAchtergrond()}`;
}
RENDER.tijd = renderTijd;

/* ---------- de boom als eigen pagina ---------- */
/* De boom (stap voor stap terug) heeft een eigen adres: #boom of #boom-<kw>. Het deel #treePane uit index.html
   verhuist naar deze pagina; de waaier en de boom delen het midden via de subtabs (#stamboom-<kw> ↔ #boom-<kw>). */
VIEWS.push("boom");
{ const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-boom"; sec.hidden = true;
  sec.innerHTML = `<div class="eyebrow">Stamboom</div><h1 class="page-title">${esc(pageLabel("boom", "Boom"))}</h1><p class="lede" id="boomLede"></p><p class="small boom-hint">${[["5 4", "var(--weak)", "", "onzekere koppeling (C)"], ["1.5 4", "var(--hyp)", "round", "hypothese (D)"], ["", "var(--gold)", "", "dezelfde voorouder via twee lijnen"]].map(([da, c, lc, t]) => `<span class="bh-it"><svg viewBox="0 0 28 8" width="28" height="8" aria-hidden="true"><line x1="1" y1="4" x2="27" y2="4" stroke="${c}" stroke-width="2"${da ? ` stroke-dasharray="${da}"` : ""}${lc ? ` stroke-linecap="${lc}"` : ""}/></svg>${t}</span>`).join("")}</p>`;
  $("#v-stamboom").insertAdjacentElement("afterend", sec);
  const tp = $("#treePane"); if (tp) { sec.appendChild(tp); tp.hidden = false; }
  const tb = $("#v-stamboom > .toolbar"); if (tb) tb.hidden = true; /* de schakelaar Waaier/Boom is vervangen door de subtabs */
}
/* wissel tussen waaier en boom onder de inleiding, met hetzelfde midden (de subtabs blijven) */
/* vroeger "Bekijk als boom/waaier →" onder de lede; de subtabs en de wegwijzer doen dat nu (en houden het midden vast via middenTok) */
function wisselLink(sec) { const w = $(".fan-wissel", sec); if (w) w.remove(); }
let boomEerder = null; /* het vorige startpunt: bij een stap binnen de boom naar de tekening scrollen en de focus houden */
function renderBoom(sub) {
  treeRoot = fanRootOk(sub) ? sub : 1; mode = "tree";
  wisselLink($("#v-boom"), "stamboom", treeRoot);
  const p = treeRoot > 1 && person(fanKw(treeRoot));
  $("#boomLede").textContent = treeRoot === 1 && FK && T.focus && T.focus.pair ? `Vanaf ${fanMidden().zin.replace(" in het midden", "")}.` /* a couple as focus: their children, by call name, as on the fan */
    : `Vanaf ${p ? p.n + (p.living ? "" : " (" + lifeYears(p) + ")") : T.rootFull || T.root}.`; /* geldt voor elke weergave (liggend, staand, uitklapbaar) */
  drawTree();
  const stap = boomEerder !== null && boomEerder !== treeRoot && !$("#v-boom").hidden; boomEerder = treeRoot;
  if (stap && (document.activeElement === document.body || !document.contains(document.activeElement))) {
    const tp = $("#treePane"); if (tp && tp.getBoundingClientRect().top < 0) tp.scrollIntoView({ block: "start" });
    const h1 = $("#v-boom h1"); if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
  }
}
RENDER.boom = renderBoom;
/* het midden gaat mee tussen waaier en boom */
const middenTok = v => { const k = (route.view === "boom" || route.view === "stamboom") && fanRootOk(route.sub) ? route.sub : 1;
  if (typeof makeStartTok === "function" && makeViews().includes(v) && makeViews().includes(route.view)) return v + makeStartTok(); /* Maken: het beginpunt gaat mee tussen de tabs */
  return (v === "stamboom" || v === "boom") && k > 1 ? v + "-" + k : fkTok(v); }; /* uit de route: menuSync loopt vóór het tekenen */

/* ---------- beroepen ---------- */
/* Wat de voorouders deden voor de kost: iedereen met een beroep (occ), per soort werk (OCC_CATS, dezelfde indeling als
   In getallen), op jaar. Het jaar komt uit het beroep zelf ("boer (1847)"); zonder jaar sorteert het huwelijk of de
   geboorte (+ 25), maar dan staat er geen jaartal bij. De filter is geen geschiedenisstap. */
VIEWS.push("beroepen"); NAV_OF.beroepen = "personen";
NAV_PATH.maak = NAV_PATH.maak || NAV_PATH.maken; /* the tab "Overzicht" of Maken */
Object.assign(NAV_PATH, { /* Maken: the calendar and the card set */
  kalender: '<rect x="4" y="5.5" width="16" height="14.5" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8 13.5h2M12 13.5h2M16 13.5h.01M8 16.5h2M12 16.5h2"/>',
  kaarten: '<rect x="8" y="4" width="11" height="15" rx="1.5"/><path d="M8 7.5 5.6 8.1a1.5 1.5 0 0 0-1 1.8l2.6 9.6a1.5 1.5 0 0 0 1.8 1.1l6-1.6"/>' });
Object.assign(NAV_PATH, {
  achternamen: '<path d="M3 9.5L7.5 5H21v14H7.5L3 14.5z"/><circle cx="7.5" cy="12" r="1.2"/><path d="M11 10h7M11 14h5"/>',
  beroepen: '<path d="M13.5 4.5l6 6-2.5 2.5-6-6z"/><path d="M12.2 8.8L4 17l3 3 8.2-8.2"/>',
  grond: '<path d="M4 4h16v16H4z"/><path d="M4 11h6l3 4v5M10 11V4M13 15l7-3"/>',
  kranten: '<path d="M4 5h13v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v9a2 2 0 0 1-4 0"/><path d="M7 8.5h7M7 12h7M7 15.5h4"/>'
});
if (!$("#v-beroepen")) { const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-beroepen"; sec.hidden = true; $("main").appendChild(sec); }
const brState = {};
const brOccJaar = p => { const m = String(p.occ || "").match(/\b(1[5-9]\d\d)\b/); return m ? +m[1] : null; };
const brSort = p => brOccJaar(p) || (p.m && yr(p.m.d)) || (yr(p.b) ? yr(p.b) + 25 : 9999);
const brCat = p => { const i = OCC_CATS.findIndex(([, re]) => re.test(p.occ)); return i < 0 ? OCC_CATS.length : i; };
const BR_OVERIG = "Ander werk";
function brPlaats(p) {
  const y = brSort(p), rs = (p.res || []).filter(r => r.p && r.y);
  if (rs.length && y < 9999) return placeName(rs.reduce((a, r) => Math.abs(r.y - y) < Math.abs(a.y - y) ? r : a).p);
  return placeName(p.dp || p.bp || (p.m && p.m.p) || "");
}
function brRij(p) {
  const l = lineOf(p.kw), j = brOccJaar(p), pl = brPlaats(p);
  return `<li style="--c:${l ? `var(--l${l})` : "var(--accent)"}"><span class="y">${j || ""}</span><span><button class="link" data-open="${p.kw}">${esc(p.n)}</button> <span class="small">${esc(lifeYears(p))}</span><br><span class="br-occ">${occGloss(esc(p.occ))}</span>${pl ? `<span class="small"> · ${esc(pl)}</span>` : ""}</span></li>`;
}
function brLijst() {
  const host = $("#brList"); if (!host) return;
  const S = brState[T.key] || (brState[T.key] = new Set());
  const ps = ancestors.filter(hasOcc), groepen = {};
  ps.forEach(p => (groepen[brCat(p)] = groepen[brCat(p)] || []).push(p));
  const ks = Object.keys(groepen).map(Number).sort((a, b) => groepen[b].length - groepen[a].length).filter(k => !S.size || S.has(k));
  host.innerHTML = ks.map(k => { const g = groepen[k].sort((a, b) => brSort(a) - brSort(b)), js = g.map(brOccJaar).filter(Boolean);
    return `<section class="br-cat"><h2 class="op-kop">${esc(k < OCC_CATS.length ? OCC_CATS[k][0] : BR_OVERIG)}<span class="small"> · ${g.length}${js.length > 1 ? ` · ${Math.min(...js)}–${Math.max(...js)}` : ""}</span></h2><ul class="restl br-list">${g.map(brRij).join("")}</ul></section>`; }).join("");
}
function renderBeroepen() {
  const S = brState[T.key] || (brState[T.key] = new Set()), ps = ancestors.filter(hasOcc);
  const tel = {}; ps.forEach(p => { const k = brCat(p); tel[k] = (tel[k] || 0) + 1; });
  const ks = Object.keys(tel).map(Number).sort((a, b) => tel[b] - tel[a]);
  $("#v-beroepen").innerHTML = `<div class="eyebrow"><button class="link" data-go="personen">Mensen</button> › Beroepen</div>
    <h1 class="page-title">Beroepen</h1>
    <p class="lede">${ps.length ? `Wat ${ps.length} voorouders deden voor de kost, zoals het in akten, registers en het kadaster staat. Het jaartal is het jaar waarin het beroep genoemd wordt.` : `Van niemand in ${scopeWord()} staat een beroep in de bronnen.`}</p>
    <div class="chips br-chips" role="group" aria-label="Soort werk">${ks.map(k => `<button type="button" class="chip" data-brcat="${k}" aria-pressed="${S.has(k)}">${esc(k < OCC_CATS.length ? OCC_CATS[k][0].split(":")[0] : BR_OVERIG)} <span class="mono">${tel[k]}</span></button>`).join("")}</div>
    <div id="brList"></div>
    ${ovMore(`data-go="cijfers"`, "Beroepen en meer in getallen")}`;
  brLijst();
}
RENDER.beroepen = renderBeroepen;
document.addEventListener("click", e => {
  const c = e.target.closest("[data-brcat]"); if (!c) return;
  const S = brState[T.key] || (brState[T.key] = new Set()), k = +c.dataset.brcat;
  S.has(k) ? S.delete(k) : S.add(k); c.setAttribute("aria-pressed", String(S.has(k)));
  brLijst();
});

/* ---------- grond in 1832 ---------- */
/* Alle voorouders met percelen in het kadaster van 1832 (PERC, zie percelen 1832) op één pagina: een kaartje met de
   kadastrale gemeenten, en per eigenaar de uitsneden van het minuutplan en de percelen (percelenHtml, zoals in het profiel). */
VIEWS.push("grond"); NAV_OF.grond = "kaart";
if (!$("#v-grond")) { const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-grond"; sec.hidden = true; $("main").appendChild(sec); }
const grondM2 = maps => maps.reduce((a, k) => a + k.rows.reduce((b, r) => b + (r.m2 || 0), 0), 0);
function grondEigenaars() {
  return ancestors.map(p => { const maps = [...new Set([p.kw, ...twinKws(p.kw)].map(imgKey).flatMap(k => PERC[k] || []))];
    return maps.length ? { p, maps, m2: grondM2(maps), n: maps.reduce((a, k) => a + k.rows.length, 0) } : null; })
    .filter(Boolean).sort((a, b) => b.m2 - a.m2 || a.p.kw - b.p.kw);
}
function renderGrond() {
  const E = grondEigenaars(), v = $("#v-grond");
  const n = E.reduce((a, e) => a + e.n, 0), m2 = E.reduce((a, e) => a + e.m2, 0);
  v.innerHTML = `<div class="eyebrow"><button class="link" data-go="kaart">Plaatsen</button> › Grond in 1832</div>
    <h1 class="page-title">${esc(pageLabel("grond", "Grond in 1832"))}</h1>
    <p class="lede">In 1832 werd voor het eerste kadaster elk stuk land opgemeten en met de eigenaar ingeschreven. ${E.length ? `Daarin staan ${E.length} voorouders, met samen ${n} percelen${m2 ? ` en ${ha(m2)} ha` : ""}.` : `In ${scopeWord()} staan nog geen percelen uit 1832.`}</p>
    ${E.length ? `<figure class="grond-fig"><div class="pane grond-map" id="grondMap"></div><figcaption class="small">Elke stip is een plaats waar voorouders in 1832 grond hadden: hoe groter de stip, hoe meer hectare. De kleur is die van de familie.</figcaption></figure>
    <ol class="grond-list">${E.map(e => `<li class="grond-it" style="--c:${lineColor(e.p.kw)}"><div class="grond-kop"><button class="link hoofd" data-open="${e.p.kw}">${esc(e.p.n)}</button> <span class="small">${esc(lifeYears(e.p))} · ${esc(relTerm(e.p.kw))}</span><br><span class="small">${esc([...new Set(e.maps.map(k => k.g))].join(", "))}: ${e.n === 1 ? "1 perceel" : e.n + " percelen"}${e.m2 ? `, ${ha(e.m2)} ha` : ""}</span></div>${percelenHtml(e.p.kw, { credit: false }).replace(/<h5>[^<]*<\/h5><p class="small"[^>]*>[\s\S]*?<\/p>/, "")}</li>`).join("")}</ol>
    ${E[0] && E[0].maps[0] ? `<p class="small credit">Alle perceelkaartjes: ${credit(E[0].maps[0])}</p>` : ""}
    <p class="small">Bron: de oorspronkelijk aanwijzende tafels en minuutplannen van het kadaster van 1832, via <a href="https://hisgis.nl/" target="_blank" rel="noopener">HisGIS</a> en de indexen op Open Archieven; per perceel staat de bron eronder.</p>` : ""}`;
  const mp = $("#grondMap"); if (mp) mp.appendChild(grondKaart(E));
}
/* ingezoomd kaartje: per kadastrale gemeente één stip, zo groot als de oppervlakte, in de kleur van de familie met de meeste grond;
   namen rechts van de stip, of links als ze rechts buiten de kaart vallen of een andere naam raken (zoals lifeMap) */
function grondKaart(E) {
  const per = {};
  E.forEach(e => e.maps.forEach(k => { const key = PLACES[k.g] ? mapKey(k.g) : null; if (!key || !PLACES[key]) return;
    const a = per[key] = per[key] || { key, m2: 0, l: {} }, m = k.rows.reduce((b, r) => b + (r.m2 || 0), 0), l = lineOf(e.p.kw); a.m2 += m; a.l[l] = (a.l[l] || 0) + m + 1; }));
  const pts = Object.values(per).sort((a, b) => b.m2 - a.m2), xy = pts.map(a => proj(PLACES[a.key].la, PLACES[a.key].lo));
  const xs = xy.map(c => c[0]), ys = xy.map(c => c[1]);
  let w = Math.min(MW, Math.max(260, Math.max(...xs) - Math.min(...xs) + 150)), hgt = Math.min(MH, Math.max(w * 0.6, Math.max(...ys) - Math.min(...ys) + 60)); /* liever hoger dan te breed */
  const cx = Math.min(Math.max((Math.max(...xs) + Math.min(...xs)) / 2, w / 2), MW - w / 2), cy = Math.min(Math.max((Math.max(...ys) + Math.min(...ys)) / 2, hgt / 2), MH - hgt / 2), k = w / 400;
  const svg = el("svg", { viewBox: `${cx - w / 2} ${cy - hgt / 2} ${w} ${hgt}`, role: "img", "aria-label": "Kaart met de plaatsen waar de voorouders in 1832 grond hadden", style: "display:block;width:100%;height:auto" });
  drawBase(svg, true, true);
  const rOf = a => (4 + 0.9 * Math.sqrt(a.m2 / 10000)) * k;
  const placed = pts.map((a, i) => { const [x, y] = xy[i], r = rOf(a); return [x - r, y - r, x + r, y + r]; }); /* namen niet over stippen */
  pts.forEach((a, i) => {
    const [x, y] = xy[i], dom = +Object.entries(a.l).sort((p, q) => q[1] - p[1])[0][0], r = rOf(a), gg = el("g", { class: "place-dot" }, svg);
    el("circle", { cx: x, cy: y, r, fill: dom ? `var(--l${dom})` : "var(--accent)", "fill-opacity": 0.85, stroke: "var(--surface)", "stroke-width": 1.5 * k }, gg);
    const lab = placeName(a.key), lw = lab.length * 9.5 * k * 0.56;
    const sides = [[x + r + 3 * k, false], [x - r - 3 * k - lw, true]].filter(([l]) => l >= cx - w / 2 + 2 * k && l + lw <= cx + w / 2 - 2 * k);
    const pick = sides.find(([l]) => labelFits(placed, l, y + 3.5 * k, lab, 9.5 * k));
    if (pick) txt(gg, pick[1] ? x - r - 3 * k : x + r + 3 * k, y + 3.5 * k, lab, { "font-size": 9.5 * k, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 3 * k, "paint-order": "stroke", "text-anchor": pick[1] ? "end" : "start" });
    clickable(gg, () => go(slug(a.key)), lab);
    bindTip(gg, `<b>${esc(lab)}</b><br>${a.m2 ? ha(a.m2) + " ha in 1832" : "grond in 1832"}`);
  });
  return svg;
}
RENDER.grond = renderGrond;

/* ---------- in de krant ---------- */
/* Alle krantenberichten over de voorouders op één pagina: de uitgeknipte berichten uit de archief-packs (soort krant) en
   elke bronregel die naar een krant verwijst (srcType "Krant"), op datum. De datum komt uit het label ("20-07-1982" of een jaar). */
VIEWS.push("kranten"); NAV_OF.kranten = "bronnen";
if (!$("#v-kranten")) { const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-kranten"; sec.hidden = true; $("main").appendChild(sec); }
function krDatum(s) {
  const m = String(s).match(/\b(\d{1,2})-(\d{1,2})-(1[6-9]\d\d|20\d\d)\b/); if (m) return { k: `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`, y: +m[3] };
  const y = String(s).match(/\b(1[6-9]\d\d|20\d\d)\b/); return y ? { k: y[1], y: +y[1] } : { k: "9999", y: null };
}
function krBerichten() {
  const per = new Map();
  ancestors.forEach(p => (p.src || []).forEach(([lab, u]) => { if (srcType(u, lab) !== "Krant") return;
    const key = u || lab, x = per.get(key) || { lab, u, kws: [], d: krDatum(lab) }; if (!x.kws.includes(p.kw)) x.kws.push(p.kw); per.set(key, x); }));
  return [...per.values()].sort((a, b) => a.d.k.localeCompare(b.d.k));
}
function renderKranten() {
  const B = krBerichten(), v = $("#v-kranten");
  const iks = new Set(ancestors.flatMap(p => [p.kw, ...twinKws(p.kw)].map(imgKey)));
  const knip = ARCH_ALL.filter(a => a.soort === "krant" && (a.kws || [a.key]).some(k => iks.has(String(k))));
  const eeuw = {}; B.forEach(b => { const k = b.d.y ? Math.floor(b.d.y / 100) * 100 : "?"; (eeuw[k] = eeuw[k] || []).push(b); });
  v.innerHTML = `<div class="eyebrow"><button class="link" data-go="bronnen">Bronnen</button> › In de krant</div>
    <h1 class="page-title">In de krant</h1>
    <p class="lede">${B.length ? `${B.length} berichten in oude kranten over ${new Set(B.flatMap(b => b.kws)).size} voorouders: familieberichten, de burgerlijke stand, advertenties en nieuws. De meeste zijn gratis te lezen in Delpher, de krantenbank van de Koninklijke Bibliotheek.` : `Nog geen krantenberichten over ${scopeWord()}.`}</p>
    ${knip.length ? `<div class="section-head"><h2>Uitgeknipt</h2><p>${knip.length} berichten om meteen te lezen.</p></div><div id="krKnip"></div>` : ""}
    ${Object.keys(eeuw).map(k => `<section class="br-cat"><h2 class="op-kop">${k === "?" ? "Zonder datum" : `${k}–${+k + 99}`}<span class="small"> · ${eeuw[k].length}</span></h2><ul class="restl kr-list">${eeuw[k].map(b => `<li><span class="y">${b.d.y || ""}</span><span>${httpUrl(b.u) ? `<a href="${esc(b.u)}" target="_blank" rel="noopener">${esc(b.lab)}</a>` : esc(b.lab)}<br><span class="small">${b.kws.map(kw => `<button class="link" data-open="${kw}">${esc(person(kw).n)}</button>`).join(", ")}</span></span></li>`).join("")}</ul></section>`).join("")}`;
  const knipIds = new Set(knip.map(a => a.id)); /* by id: a clipping that is also a portrait image on the page has another soort */
  if (knip.length) archGallery($("#krKnip"), [[...new Set(knip.map(a => a.pack))]], im => knipIds.has(im.id), () => route.view === "kranten",
    { sort: (a, b) => String(a.datum || "").localeCompare(String(b.datum || "")) });
}
RENDER.kranten = renderKranten;

/* ---------- onze achternamen ---------- */
/* Herkomst van de familienamen (data/33-achternamen.js): per naam wat de naamkunde zegt (met bron en label) en wat onze
   eigen gegevens zeggen over hoe de familie aan de naam kwam. Hoofdnamen van de lijnen eerst, dan aangetrouwde namen.
   In de samengestelde boom staan beide kanten; de lijn-kw wordt daar omgerekend zoals joinTrees dat doet. */
VIEWS.push("achternamen"); NAV_OF.achternamen = "personen";
if (!$("#v-achternamen")) { const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-achternamen"; sec.hidden = true; $("main").appendChild(sec); }
const ANAMEN = typeof ACHTERNAMEN !== "undefined" ? ACHTERNAMEN : [];
const anLijn = (l, b) => T.key === "s" ? 8 + 4 * (b === "a" ? 1 : 0) + ((l - 8) >> 1) : l; /* lijn van boom b in de huidige boom */
/* a focus tree (a couple, someone else) has no tree key in the data: there a name belongs to the families of the people who carry it */
const anFocusLijnen = x => { const want = new Set([x.naam, ...(x.varianten || [])].map(v => v.toLowerCase()));
  return [...new Set(PEOPLE.filter(p => !p.alias && want.has(String(splitName(p.n).sur).toLowerCase())).map(p => lineOf(p.kw)).filter(Boolean))].sort((a, b) => a - b); };
const anLijnen = x => { if (T.focus) return anFocusLijnen(x); const o = x.lijnen || x.bij || {}; return (T.key === "s" ? x.bomen : [T.key]).flatMap(b => (o[b] || []).map(l => anLijn(l, b))).filter(l => LINES[l]); };
const anNamen = () => ANAMEN.filter(x => T.focus ? anFocusLijnen(x).length : T.key === "s" || x.bomen.includes(T.key))
  .sort((p, q) => (p.lijnen ? 0 : 1) - (q.lijnen ? 0 : 1) || ((anLijnen(p)[0] || 99) - (anLijnen(q)[0] || 99)));
const anGetal = n => n.toLocaleString("nl-NL");
/* wat op meer kaarten letterlijk hetzelfde zou staan (een algemene verklaring, een gedeelde bron) staat één keer boven of onder de
   lijst; op de kaart zelf alleen wat bij die naam hoort */
function anGedeeld(L) {
  const tel = (lijst, sleutel) => { const c = new Map(); lijst.forEach(x => sleutel(x).forEach(k => c.set(k, (c.get(k) || 0) + 1))); return c; };
  const verkl = tel(L, x => x.verklaring ? [x.verklaring] : []), bron = tel(L, x => (x.bronnen || []).map(b => b[0] + "\u0001" + b[1]));
  return { verklaring: new Set([...verkl].filter(([, n]) => n > 1).map(([k]) => k)), bronnen: new Set([...bron].filter(([, n]) => n > 2).map(([k]) => k)) };
}
const anAchter = naam => (String(naam).match(/(inga|stra|sma|ma|a)$/i) || [])[1];
function anKaart(x, G) {
  const ls = anLijnen(x), l0 = ls[0];
  const fams = ls.map(l => `<button class="link" data-go="lijn-${l}">familie ${esc(LINES[l].name)}</button>`).join(", ");
  const tel = x.n1947 && x.n2007 ? `In 1947 droegen ${anGetal(x.n1947)} mensen in Nederland deze naam, in 2007 ${anGetal(x.n2007)}.` : x.n2007 ? `In 2007 droegen ${anGetal(x.n2007)} mensen in Nederland deze naam.` : "";
  const gedeeld = x.verklaring && G.verklaring.has(x.verklaring), eigenBron = (x.bronnen || []).filter(b => !G.bronnen.has(b[0] + "\u0001" + b[1]));
  /* een algemene verklaring (zie boven de lijst): op de kaart alleen het eigen achtervoegsel */
  const betekenis = !x.verklaring ? "" : gedeeld ? `<p>${x.soort ? `<span class="tag an-soort">${esc(x.soort)}</span> ` : ""}Een Friese naam${anAchter(x.naam) ? ` op -${esc(anAchter(x.naam).toLowerCase())}` : ""}. ${stTag(x.st)}</p>`
    : `<p>${x.soort ? `<span class="tag an-soort">${esc(x.soort)}</span> ` : ""}${esc(x.verklaring)} ${stTag(x.st)}</p>`;
  return `<article class="an-kaart" id="${anId(x.naam)}" style="--c:${l0 ? `var(--l${l0})` : "var(--accent)"}">
    <h2 class="an-naam">${esc(x.naam)}</h2>
    <p class="small an-sub">${x.lijnen ? "Hoofdnaam van de " : "Een naam in de "}${fams || "familie"}${x.varianten && x.varianten.length ? ` · ook gespeld als ${esc(x.varianten.slice(0, 4).join(", "))}` : ""}</p>
    ${betekenis ? `<h3 class="an-h">Wat de naam betekent</h3>${betekenis}` : ""}
    ${tel ? `<p class="small">${tel}</p>` : ""}
    ${x.familie ? `<h3 class="an-h">In onze familie</h3><p>${esc(x.familie)} ${stTag(x.familie_st)}</p>` : ""}
    <p class="small an-bron">${[...eigenBron.map(([lab, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(lab)}</a>`), x.cbg ? `<a href="${esc(x.cbg)}" target="_blank" rel="noopener">CBG Familienamen</a>` : ""].filter(Boolean).join(" · ")}</p>
  </article>`;
}
function renderAchternamen() {
  const L = anNamen(), v = $("#v-achternamen"), G = anGedeeld(L);
  const algemeen = [...G.verklaring], zonder = L.filter(x => !x.verklaring).map(x => x.naam);
  const bron = (L.flatMap(x => x.bronnen || []).find(b => G.bronnen.has(b[0] + "\u0001" + b[1])) && [...G.bronnen].map(k => k.split("\u0001"))) || [];
  v.innerHTML = `<div class="eyebrow"><button class="link" data-go="personen">Mensen</button> › Achternamen</div>
    <h1 class="page-title">${esc(pageLabel("achternamen", "Achternamen"))}</h1>
    <p class="lede">Per familienaam wat hij betekent en hoe de familie eraan kwam. Tot 1811 hadden de meeste Friezen geen vaste achternaam; toen moest iedereen er een kiezen.</p>
    ${algemeen.length ? `<p class="an-algemeen">${algemeen.map(esc).join(" ")}</p>` : ""}
    ${L.length ? `<div class="an-lijst">${L.map(x => anKaart(x, G)).join("")}</div>
    ${zonder.length ? `<p class="small">Voor ${esc(zonder.join(" en ").replace(/ en (?=.* en )/g, ", "))} vonden we nog geen betrouwbare verklaring van de naam.</p>` : ""}
    <p class="small">De aantallen komen uit de Nederlandse Familienamenbank van het CBG en het Meertens Instituut.${bron.length ? ` Algemene bron: ${bron.map(([lab, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(lab)}</a>`).join(" · ")}.` : ""}</p>` : `<p class="small">Voor ${scopeWord()} is de herkomst van de namen nog niet uitgezocht.</p>`}`;
}
RENDER.achternamen = renderAchternamen;
/* naar één naam op de pagina: go() en dan de kaart in beeld, kort opgelicht */
const anId = naam => "naam-" + norm(naam).replace(/[^a-z0-9]+/g, "-");
document.addEventListener("click", e => {
  const b = e.target.closest("[data-an]"); if (!b) return;
  e.preventDefault(); const id = anId(b.dataset.an); go("achternamen");
  let n = 0; const toon = () => { const k = document.getElementById(id); if (!k) { if (++n < 30) requestAnimationFrame(toon); return; }
    k.scrollIntoView({ block: "start" }); k.classList.add("op-flash"); k.setAttribute("tabindex", "-1"); k.focus({ preventScroll: true }); setTimeout(() => k.classList.remove("op-flash"), 1600); };
  requestAnimationFrame(toon);
});
const anBekend = () => new Map(anNamen().map(x => [norm(x.naam), x.naam]));
/* namenregister: "herkomst" achter een naam die op de pagina Onze achternamen staat ("Groot, de" → De Groot) */
{ const nmOud = RENDER.namen; RENDER.namen = (...a) => { nmOud(...a); const bek = anBekend();
  $$("#v-namen .namereg .nm > b").forEach(b => { const m = /^(.*), (.*)$/.exec(b.textContent), naam = bek.get(norm(m ? m[2] + " " + m[1] : b.textContent));
    if (naam) b.insertAdjacentHTML("afterend", ` <button type="button" class="link an-naar" data-an="${esc(naam)}">herkomst</button>`); }); }; }
/* familiepagina: onder de inleiding een regel naar de betekenis van de familienaam */
{ const famOud = RENDER.families; RENDER.families = sub => { famOud(sub);
  const lede = sub && LINES[sub] ? $("#v-families .lede") : null; if (!lede || $("#v-families [data-an]")) return; const bek = anBekend();
  const namen = String(LINES[sub].name).split(" · ").map(n => bek.get(norm(n))).filter(Boolean);
  if (namen.length) lede.insertAdjacentHTML("afterend", namen.map(n => ovMore(`data-an="${esc(n)}"`, `Wat betekent de naam ${esc(n)}?`)).join("")); }; }

/* ---------- de akte bij het feit ---------- */
/* In de levensloop van het profiel krijgen geboren, getrouwd en overleden een knopje naar de scan van de eigen akte (bij
   overleden ook het bidprentje, het rouwbericht en de krant), en "Wat er staat" als er een letterlijke tekst is (AKTETEKST).
   De knopjes komen uit de index (ARCH_ALL, IMGS); het beeld laadt pas bij een klik, in de lichtbak.
   Koppelen gaat streng: liever geen scan dan een verkeerde.
   - Akte: het beeld-id begint met een AlleFriezen-nummer dat ook in de bronnen van deze persoon staat; dat bronlabel begint met
     het soort feit (Geboorte, Doop, Huwelijk, Overlijden, eventueel "Tweede huwelijk") en noemt daarna geen verwant ("Huwelijk zus
     Maria" telt niet); en de datum klopt: een huwelijk op de dag, geboorte en overlijden op de dag of tot 3 dagen later (de aangifte).
     Een pagina-beeld zonder zo'n bron: deze persoon is de hoofdpersoon, de titel noemt het soort akte en de datum klopt.
   - Bidprentje, rouwbericht, krant: deze persoon is de hoofdpersoon en de datum valt kort na het overlijden; een krantenbericht bij
     het huwelijk noemt beide partners en staat kort na de trouwdag in de krant.
   Nooit bij levenden, en nooit een beeld of tekst waarin een levende staat (LIVING_KEYS, aktePrive). */
const AKTE_BIJ_FEIT = true; /* aan (true): de knopjes en "Wat er staat" verschijnen in de levensloop */
const akfDag = s => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(String(s || "").trim()); return m ? Date.UTC(+m[1], m[2] - 1, +m[3]) / 864e5 : null; };
/* ligt datum d tussen 0 en max dagen na ref? ruim: ook een datum met alleen maand (die maand of de volgende) of jaar (hetzelfde jaar) */
function akfNa(d, ref, max, ruim) {
  const a = akfDag(d), r = akfDag(ref); if (r === null) return false;
  if (a !== null) return a - r >= 0 && a - r <= max;
  if (!ruim) return false;
  const s = String(d || "").trim(), R = String(ref).slice(0, 7).split("-").map(Number); let m;
  if ((m = /^(\d{4})-(\d\d)$/.exec(s))) { const v = (+m[1] - R[0]) * 12 + (+m[2] - R[1]); return v === 0 || v === 1; }
  return /^\d{4}$/.test(s) && +s === R[0];
}
const AKF_FEIT = { geboorte: "b", doop: "b", huwelijk: "m", overlijden: "d" };
/* soort feit uit een bronlabel ("Overlijdensakte Menaldumadeel 1914, akte 48" → d); null bij een akte van een verwant */
function akfLabel(lab) {
  const s = String(lab || "").trim(), m = /^(?:(?:eerste|tweede|derde|vierde) )?(geboorte|doop|huwelijk|overlijden)(?:s?akte|-index)?(?=$|[\s,.·:(])/i.exec(s);
  if (!m || /verwant/i.test(s)) return null;
  return /^[a-zà-ÿ]/.test(s.slice(m[0].length).trimStart()) ? null : AKF_FEIT[m[1].toLowerCase()];
}
/* soort feit uit de titel van een pagina-beeld ("De overlijdensakte van Akkrum, maart 1812: …") */
function akfTitel(t) {
  const s = String(t || ""); if (/verwant/i.test(s)) return null;
  return /overlijdensakte|\boverlijden\b/i.test(s) ? "d" : /huwelijksakte|trouwregister|\bhuwelijk\b/i.test(s) ? "m" : /geboorteakte|doopboek|doopregister|\bgeboorte\b/i.test(s) ? "b" : null;
}
/* soort beeld: akte, bidprentje, rouw (rouwbericht of -brief) of krant */
function akfSoort(im, arch) {
  if (arch) return ["akte", "bidprentje", "krant"].includes(im.soort) ? im.soort : null;
  if (im.soort !== "persoon" || im.portret) return null;
  const t = String(im.t || "");
  if (/^(voorkant van het )?bidprentje\b/i.test(t)) return "bidprentje";
  if (/^(rouwbericht|rouwbrief|overlijdensadvertentie|overlijdensbericht)\b/i.test(t)) return "rouw";
  if (/^akte-/.test(im.id) || akfTitel(t)) return "akte";
  return null;
}
/* index op persoonssleutel ("26", "a-12"): pagina-beelden (met titel) gaan voor archiefbeelden met hetzelfde id */
let AKF_IDX = null;
function akfIdx() {
  if (AKF_IDX) return AKF_IDX;
  AKF_IDX = new Map(); const seen = new Set();
  const add = (im, arch) => {
    const soort = akfSoort(im, arch); if (!soort || seen.has(im.id)) return;
    const kws = (im.kws && im.kws.length ? im.kws : [im.key]).map(String);
    if (kws.some(k => LIVING_KEYS.has(k))) return;
    seen.add(im.id);
    const x = { id: im.id, soort, key: String(im.key), kws, datum: String(im.datum || ""), t: arch ? "" : String(im.t || "") };
    kws.forEach(k => { if (!AKF_IDX.has(k)) AKF_IDX.set(k, []); AKF_IDX.get(k).push(x); });
  };
  IMGS.forEach(im => add(im, false)); ARCH_ALL.forEach(a => add(a, true));
  return AKF_IDX;
}
const AKF_CACHE = new WeakMap();
/* per feit (b, m, d): de beelden in leesvolgorde en de aktetekst, als die er is */
function akteFeiten(kw) {
  const p = person(kw); if (!p || p.living) return null;
  if (AKF_CACHE.has(p)) return AKF_CACHE.get(p);
  const ks = [kw, ...twinKws(kw)], eigen = new Set(ks.map(imgKey)), partner = new Set(ks.filter(k => k > 1).map(k => imgKey(k ^ 1)));
  /* bronlabels per AlleFriezen-nummer (eerste 8 tekens, zoals in het beeld-id); één akte kan twee bronregels hebben (akte en bijlagen) */
  const bron = {}; (p.src || []).forEach(([lab, u]) => { const m = UUID_RE.exec(u || ""); if (!m) return; const h = m[0].slice(0, 8).toLowerCase(); (bron[h] = bron[h] || { labs: [], uuid: m[0].toLowerCase() }).labs.push(String(lab || "")); });
  const bronFeit = s => { const fs = new Set(s.labs.map(akfLabel).filter(Boolean)); return fs.size === 1 ? [...fs][0] : null; }; /* tegenstrijdige labels: geen feit */
  const F = { b: { items: [], tekst: null }, m: { items: [], tekst: null }, d: { items: [], tekst: null } }, gehad = new Set(), idx = akfIdx();
  const akten = { b: [], m: [], d: [] }; /* [beeld, groep (één akte, ook als die twee scans heeft), bronlabel, tekst] */
  [...eigen].flatMap(k => idx.get(k) || []).forEach(x => {
    if (gehad.has(x.id)) return; gehad.add(x.id);
    const hoofd = eigen.has(x.key); let f = null;
    if (x.soort === "akte") {
      const h8 = (/^akte-[a-z]+-([0-9a-f]{8})/.exec(x.id) || [])[1], s = h8 ? bron[h8] : null;
      f = s ? bronFeit(s) : hoofd && x.t ? akfTitel(x.t) : null;
      const ok = f === "b" ? akfNa(x.datum, p.b, 3) : f === "m" ? !!p.m && akfNa(x.datum, p.m.d, 0) : f === "d" ? akfNa(x.datum, p.d, 3) : false;
      if (ok) akten[f].push([x, h8 || x.id, s ? s.labs.join(" | ") : x.t, AKTE[x.id] || (s && AKTE_UUID[s.uuid] ? AKTE[AKTE_UUID[s.uuid]] : null)]);
      return;
    } else if (hoofd && (x.soort === "bidprentje" || x.soort === "rouw") && akfNa(x.datum, p.d, x.soort === "rouw" ? 21 : 30, true)) f = "d";
    else if (hoofd && x.soort === "krant" && akfNa(x.datum, p.d, 21)) f = "d";
    else if (x.soort === "krant" && p.m && x.kws.some(k => partner.has(k)) && akfNa(x.datum, p.m.d, 14)) f = "m";
    if (f) F[f].items.push(x);
  });
  /* twee verschillende akten voor één feit (een dubbele bruiloft op dezelfde dag): alleen de akte met het nummer uit de gegevens
     ("akte 38"); lukt dat niet, dan geen akte bij dit feit */
  Object.keys(akten).forEach(f => {
    let a = akten[f];
    if (new Set(a.map(r => r[1])).size > 1) {
      const nr = f === "m" && p.m ? (/\bakte (\d+)/i.exec(p.m.note || "") || [])[1] : null;
      a = nr ? a.filter(r => new RegExp("\\bakte " + nr + "\\b", "i").test(r[2])) : [];
      if (new Set(a.map(r => r[1])).size !== 1) a = [];
    }
    a.forEach(r => { F[f].items.push(r[0]); if (r[3] && !F[f].tekst && !aktePrive(r[3])) F[f].tekst = r[3]; });
  });
  const orde = { akte: 0, bidprentje: 1, rouw: 2, krant: 3 };
  Object.values(F).forEach(v => v.items.sort((a, b) => orde[a.soort] - orde[b.soort] || a.datum.localeCompare(b.datum) || a.id.localeCompare(b.id, "nl", { numeric: true })));
  AKF_CACHE.set(p, F); return F;
}
const AKF_NAAM = { b: "geboorteakte", m: "huwelijksakte", d: "overlijdensakte" };
const AKF_KNOP = { akte: ["Scan", "akte"], bidprentje: ["Bidprentje", "bidprentje"], rouw: ["Akte", "rouwbericht"], krant: ["Krant", "krant"] };
/* de knopjes en "Wat er staat" bij één regel van de levensloop; ev = alle getoonde regels (het feit staat maar bij één regel) */
/* bij welk feit (b, m, d) hoort deze regel uit de levensloop? */
function akfFeitVan(p, e, ev) {
  const dj = p.d ? yr(p.d) : null;
  return /^geboren/.test(e.t) && e === ev.find(x => /^geboren/.test(x.t)) ? "b"
    : /^getrouwd met/.test(e.t) && e === ev.find(x => /^getrouwd met/.test(x.t)) ? "m"
    : dj && /overleden/.test(e.t) && e === ev.find(x => /overleden/.test(x.t) && x.y === dj) ? "d" : null;
}
/* de akteteksten die al bij een feit in de levensloop staan (dezelfde regels als openProfile); "Wat de akten zeggen" slaat ze over */
function akteBijFeitIds(kw) {
  const ids = new Set(), p = person(kw); if (!AKTE_BIJ_FEIT || !p || p.living) return ids;
  const F = akteFeiten(kw), ev = lifeEvents(p).filter(e => e.p); if (!F) return ids;
  ev.forEach(e => { const f = akfFeitVan(p, e, ev), t = f && F[f].items.length && F[f].tekst; if (t) { const id = Object.keys(AKTE).find(k => AKTE[k] === t); if (id) ids.add(id); } });
  return ids;
}
function akteBij(kw, e, ev) {
  if (!AKTE_BIJ_FEIT) return "";
  const p = person(kw), F = akteFeiten(kw); if (!F || !e) return "";
  const f = akfFeitVan(p, e, ev);
  const v = f && F[f]; if (!v || !v.items.length) return "";
  const lijst = v.items.map(x => x.id).join(" ");
  const knoppen = Object.keys(AKF_KNOP).map(s => {
    const xs = v.items.filter(x => x.soort === s); if (!xs.length) return "";
    const n = s === "krant" ? xs.length : 0, [ico, woord] = AKF_KNOP[s]; /* een akte of bidprentje met twee scans blijft één stuk */
    const uitleg = s === "akte" ? `Bekijk de ${AKF_NAAM[f]} zelf: de scan uit het archief${xs.length > 1 ? ` (${xs.length} bladzijden)` : ""}`
      : s === "bidprentje" ? "Bekijk het bidprentje" : s === "rouw" ? "Bekijk het rouwbericht" : `Bekijk ${n > 1 ? `de ${n} krantenberichten` : "het krantenbericht"}`;
    return `<button type="button" class="akf-b" data-akf="${esc(xs[0].id)}" title="${esc(uitleg)}" aria-label="${esc(uitleg)}">${srcIco(ico)}${woord}${n > 1 ? ` <span class="akf-n">${n}</span>` : ""}</button>`;
  }).join("");
  return `<span class="akf" data-akfl="${esc(lijst)}">${knoppen}</span>${v.tekst ? `<details class="akfeit"><summary>Wat er staat</summary>${akteInhoud(v.tekst)}</details>` : ""}`;
}
/* een klik opent de lichtbak met alle beelden van dit feit; een archiefbeeld laadt daar pas zijn pack */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-akf]"); if (!b) return;
  const g = b.closest("[data-akfl]"); openLb(b.dataset.akf, g ? g.dataset.akfl.split(" ") : [b.dataset.akf]);
});

/* ---------- gedcom ---------- */
/* "Download als GEDCOM": de geladen boom als GEDCOM 5.5.1 (UTF-8), voor stamboomprogramma's. Gemaakt in de browser uit
   wat loadTree() heeft klaargezet, dus van levenden alleen de naam en het geslacht. Eén INDI per persoon: bij kwartierverlies
   krijgen alle nummers van dezelfde persoon één record (met een REFN per kwartiernummer), en een ouderpaar dat via twee lijnen
   in de stamboom staat één gezin (FAM). In de samengestelde boom zijn kw 1 de kinderen, elk met alleen de voornaam.
   Bewijs: per persoon een NOTE, bij elke bron QUAY (A = 3, B = 2, C = 1, D = 0), de koppeling aan het kind als NOTE bij FAMC. */
const GEDCOM_KNOP = true; /* true: de knop op Bronnen en bij de kwartierstaat */
const siteUrl = () => /^https?:$/.test(location.protocol) ? location.href.split("#")[0] : (($('meta[property="og:url"]') || {}).content || "");
const GED_MND = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/* een datum uit de data ("1807-10-31", "ca. 1808", "vóór 1781-08-08", "tussen 1799 en 1803", "1772 of 1773") in GEDCOM-vorm;
   wat niet te lezen is, wordt een datumzin tussen haakjes */
function gedDatum(s) {
  s = String(s || "").trim();
  if (!s) return "";
  const een = t => {
    t = String(t).trim(); let m;
    if ((m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return `${+m[3]} ${GED_MND[+m[2] - 1]} ${m[1]}`;
    if ((m = t.match(/^(\d{4})-(\d{2})$/))) return `${GED_MND[+m[2] - 1]} ${m[1]}`;
    if ((m = t.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/))) return `${+m[1]} ${GED_MND[+m[2] - 1]} ${m[3]}`;
    if ((m = t.match(/^(?:(\d{1,2})\s+)?(\p{L}+)\s+(\d{4})$/u)) && MONTHS.includes(m[2].toLowerCase())) return (m[1] ? +m[1] + " " : "") + GED_MND[MONTHS.indexOf(m[2].toLowerCase())] + " " + m[3];
    if (/^\d{4}$/.test(t)) return t;
    return null;
  };
  let m, a, b;
  if ((a = een(s))) return a;
  if ((m = s.match(/^(?:ca\.|circa|~)\s*(.+)$/i)) && (a = een(m[1]))) return "ABT " + a;
  if ((m = s.match(/^(?:vóór|voor)\s+(?:ca\.\s*)?(.+)$/i)) && (a = een(m[1]))) return "BEF " + a;
  if ((m = s.match(/^na\s+(.+)$/i)) && (a = een(m[1]))) return "AFT " + a;
  if ((m = s.match(/^tussen\s+(.+?)\s+en\s+(.+)$/i) || s.match(/^(\d{4})\s*(?:of|\/)\s*(\d{4})$/))) {
    let x = m[1]; const y = m[2], jy = (y.match(/(\d{4})$/) || [])[1];
    if (jy && !/\d{4}/.test(x)) x += " " + jy; /* "tussen 3 januari en 25 februari 1679" */
    if ((a = een(x)) && (b = een(y))) return `BET ${a} AND ${b}`;
  }
  return "(" + s.replace(/[()]/g, "") + ")";
}
/* plaats, historische gemeente, provincie, land (PLACES); plaatsen buiten de kaart zoals ze op de site heten (OFFMAP) */
function gedPlaats(k) {
  if (!k) return "";
  const P = PLACES[k];
  if (!P) return placeName(k);
  const naam = P.kind === "gemeente" ? P.gem || k : P.name || k;
  return [...new Set([naam, P.gem, P.prov].filter(Boolean))].join(", ") + ", Nederland";
}
function gedcomTekst() {
  const out = [], enc8 = new TextEncoder();
  /* één regel; lange waarden lopen door met CONC (nooit op een spatie geknipt) en regeleinden met CONT; @ wordt @@ */
  const L = (lvl, tag, val, xref) => {
    const kop = (xref ? `${lvl} @${xref}@ ${tag}` : `${lvl} ${tag}`);
    if (val === undefined || val === null || val === "") { out.push(kop); return; }
    const v = String(val).replace(/\r\n?/g, "\n").replace(/@/g, "@@").replace(/[\u0000-\u0009\u000B-\u001F]/g, " ");
    v.split("\n").forEach((deel, i) => {
      let rest = deel, pre = i === 0 ? kop : `${lvl + 1} CONT`;
      do {
        let n = rest.length;
        while (enc8.encode(pre + " " + rest.slice(0, n)).length > 240) n = Math.floor(n * .9);
        if (n < rest.length) { let k = n; while (k > n / 2 && (rest[k - 1] === " " || rest[k] === " ")) k--; if (k > n / 2) n = k; }
        out.push(rest.slice(0, n) ? pre + " " + rest.slice(0, n) : pre);
        rest = rest.slice(n); pre = `${lvl + 1} CONC`;
      } while (rest.length);
    });
  };
  const P = (lvl, tag, ptr) => out.push(`${lvl} ${tag} @${ptr}@`); /* verwijzing naar een ander record */
  const id = kw => ALIAS_OF[kw] || kw;
  const ix = kw => "I" + id(kw);
  const kinderen = T.key === "s" && person(1) && person(1).living ? (T.rootLines || T.kids || []) : null;
  /* gezinnen: één per ouderpaar (vader|moeder, na aliassen) */
  const fams = new Map(), famc = new Map(), fams_ = new Map();
  [...BY.keys()].sort((a, b) => a - b).forEach(kw => {
    const f = BY.has(2 * kw) ? id(2 * kw) : null, m = BY.has(2 * kw + 1) ? id(2 * kw + 1) : null;
    if (!f && !m) return;
    const key = f + "|" + m;
    let F = fams.get(key);
    if (!F) { F = { x: "F" + (fams.size + 1), f, m, kids: [] }; fams.set(key, F); [f, m].filter(Boolean).forEach(o => { (fams_.get(o) || fams_.set(o, []).get(o)).push(F); }); }
    const kids = kw === 1 && kinderen ? kinderen.map((_, i) => "K" + (i + 1)) : [ix(kw)];
    kids.forEach(c => { if (F.kids.includes(c)) return; F.kids.push(c); (famc.get(c) || famc.set(c, []).get(c)).push({ F, kw }); });
  });
  /* huwelijken (p.marriages): elk huwelijk een gezin. Met de partner in de boom is dat hetzelfde gezin als het ouderpaar (of een
     nieuw gezin bij een tweede huwelijk binnen de boom); een partner buiten de boom wordt een eigen persoon met alleen de naam */
  const famVan = new Map(); fams.forEach(F => famVan.set(F.f + "|" + F.m, F));
  const buiten = [];
  const famsVan = k => fams_.get(k) || fams_.set(k, []).get(k);
  all.filter(p => !p.living && Array.isArray(p.marriages)).forEach(p => {
    const ik = id(p.kw), man = p.kw === 1 ? !!T.rootMale : p.kw % 2 === 0;
    p.marriages.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(mr => {
      const pk = mfKwHere(p, mr.kw), pq = pk && person(pk);
      let F;
      if (pq && !pq.living) {
        const f = man ? ik : id(pk), m = man ? id(pk) : ik, key = f + "|" + m;
        F = famVan.get(key);
        if (!F) { F = { x: "F" + (fams.size + 1), f, m, kids: [] }; fams.set(key, F); famVan.set(key, F); famsVan(f).push(F); famsVan(m).push(F); }
      } else if (!pq) {
        const Q = { x: "P" + (buiten.length + 1), naam: mr.partner || "onbekend", man: !man };
        F = { x: "F" + (fams.size + 1), f: man ? ik : null, m: man ? null : ik, kids: [], buiten: Q }; Q.F = F; buiten.push(Q);
        fams.set(F.x, F); famsVan(ik).push(F);
      } else return; /* een levende partner in de boom: alleen het ouderpaar, zonder huwelijksgegevens */
      if (!F.marr || (!F.marr.date && mr.date)) F.marr = mr;
      (F.ord = F.ord || {})[ik] = mr.order || 99;
      if (mr.kids && mr.kids.length && p.kids) F.kidsNote = mr.kids.map(i => p.kids[i]).filter(Boolean);
    });
  });
  /* bronnen: één SOUR-record per bronregel (label + adres), ook bij scans */
  const bronnen = new Map();
  const bron = (label, url) => { const k = label + "\u0001" + (url || ""); if (!bronnen.has(k)) bronnen.set(k, { x: "S" + (bronnen.size + 1), label, url }); return bronnen.get(k).x; };
  const QUAY = { A: 3, B: 2, C: 1, D: 0 };
  const bewijs = s => s && STATUS[s] ? `${s} (${STATUS[s].label.toLowerCase()})` : "";
  const unc = (p, fs) => fs.map(f => fieldSt(p, f)).filter(Boolean).sort().pop();
  const url = siteUrl(), nu = new Date(), twee = n => String(n).padStart(2, "0");
  const siteNaam = ($('meta[property="og:site_name"]') || {}).content || document.title || "Stamboom";
  const naamBestand = "stamboom-" + norm(T.rootFull || T.root).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".ged";
  /* kop */
  L(0, "HEAD");
  L(1, "SOUR", "STAMBOOM-DEGROOT"); L(2, "VERS", (String(VERSION).match(/\d+/) || ["1"])[0]); L(2, "NAME", siteNaam);
  L(1, "DEST", "ANY");
  L(1, "DATE", `${nu.getDate()} ${GED_MND[nu.getMonth()]} ${nu.getFullYear()}`); L(2, "TIME", `${twee(nu.getHours())}:${twee(nu.getMinutes())}:${twee(nu.getSeconds())}`);
  P(1, "SUBM", "U1");
  L(1, "FILE", naamBestand);
  L(1, "GEDC"); L(2, "VERS", "5.5.1"); L(2, "FORM", "LINEAGE-LINKED");
  L(1, "CHAR", "UTF-8");
  L(1, "LANG", "Dutch");
  L(1, "NOTE", `${treeTitle()}, van ${url || "de website"}. ${VERSION}. Het kwartiernummer staat bij elke persoon als REFN. Bewijs per persoon in een notitie en bij elke bron als QUAY: 3 = akte (A), 2 = sterk (B), 1 = onzeker (C), 0 = hypothese (D). Van levende familieleden staat alleen de naam in dit bestand.`);
  L(0, "SUBM", "", "U1"); L(1, "NAME", siteNaam); if (url) L(1, "WWW", url);
  /* personen */
  const naam = (n, p) => {
    const sn = splitName(n);
    L(1, "NAME", sn.sur ? `${sn.given.join(" ")} /${sn.sur}/` : sn.given.join(" "));
    if (sn.given.length) L(2, "GIVN", sn.given.join(" "));
    if (sn.sur) L(2, "SURN", sn.sur);
    if (p && p.roep && p.roep !== n && !sn.given.includes(p.roep)) L(2, "NICK", p.roep);
  };
  const ouderNoot = (F, kw) => {
    const r = [[2 * kw, "vader"], [2 * kw + 1, "moeder"]].map(([k, rol]) => { const q = person(k), s = stapSt(k); return q && s ? `${rol} ${q.n}: ${bewijs(s)}` : ""; }).filter(Boolean);
    return r.length ? "Bewijs voor deze ouders: " + r.join("; ") + "." : "";
  };
  const gezinnen = c => (famc.get(c) || []).forEach(({ F, kw }) => { P(1, "FAMC", F.x); L(2, "PEDI", "birth"); const t = ouderNoot(F, kw); if (t) L(2, "NOTE", t); });
  const partner = k => (fams_.get(k) || []).slice().sort((a, b) => ((a.ord || {})[k] || 0) - ((b.ord || {})[k] || 0)).forEach(F => P(1, "FAMS", F.x)); /* in de volgorde van de huwelijken */
  all.forEach(p => {
    if (p.kw === 1 && kinderen) return;
    const x = "I" + p.kw;
    L(0, "INDI", "", x);
    naam(p.n, p);
    out.push("1 SEX " + (p.kw === 1 ? (T.rootMale == null ? "U" : T.rootMale ? "M" : "F") : p.kw % 2 ? "F" : "M"));
    [p.kw, ...(ALIASES[p.kw] || [])].sort((a, b) => a - b).forEach(k => { L(1, "REFN", String(k)); L(2, "TYPE", "kwartiernummer"); });
    if (!p.living) {
      const ev = (tag, d, plaats, st, noot) => {
        if (!d && !plaats && !noot) return;
        L(1, tag); if (d) L(2, "DATE", gedDatum(d)); if (plaats) L(2, "PLAC", plaats);
        if (st && st !== "A") L(2, "NOTE", "Bewijs voor dit gegeven: " + bewijs(st)); if (noot) L(2, "NOTE", noot);
      };
      ev("BIRT", p.b, gedPlaats(p.bp), unc(p, ["b", "bp"]));
      if (p.bapt) { const dm = String(p.bapt).match(/\b(\d{1,2}-\d{1,2}-\d{4})\b/); ev("CHR", dm ? dm[1] : "", "", null, p.bapt); }
      if (p.d || p.dp) ev("DEAT", p.d, gedPlaats(p.dp), unc(p, ["d", "dp"]));
      if (p.bur) { const kort = p.bur.length <= 60 && !/[;,]/.test(p.bur); L(1, "BURI"); L(2, kort ? "PLAC" : "NOTE", p.bur); const s = fieldSt(p, "bur"); if (s && s !== "A") L(2, "NOTE", "Bewijs voor dit gegeven: " + bewijs(s)); }
      String(p.occ || "").split(";").map(s => s.trim()).filter(Boolean).forEach(o => L(1, "OCCU", o));
      if (p.rel && !/^onbekend$/i.test(p.rel)) L(1, "RELI", p.rel);
      (p.res || []).forEach(r => {
        if (/^(geboren|overleden|gedoopt)\b/i.test(r.t || "") && (yr(p.b) === r.y || yr(p.d) === r.y || !r.y)) return; /* staat al bij BIRT/DEAT */
        L(1, "RESI"); if (r.y) L(2, "DATE", gedDatum(String(r.y))); if (r.p) L(2, "PLAC", gedPlaats(r.p)); if (r.t) L(2, "NOTE", r.t);
      });
      L(1, "NOTE", `Bewijs: ${bewijs(p.st) || "onbekend"}.${p.stNote ? " " + p.stNote : ""}`);
      if (p.alt) L(1, "NOTE", "Ook geschreven als: " + p.alt);
      (p.notes || []).forEach(n => { const o = noteObj(n); L(1, "NOTE", o.t + (o.k ? ` [${o.k}]` : "")); });
      if (p.kids && p.kids.length) L(1, "NOTE", "Kinderen: " + p.kids.join("; "));
      if (p.kidsNote) L(1, "NOTE", "Over de kinderen: " + p.kidsNote);
      if (p.sibs && p.sibs.length) L(1, "NOTE", "Broers en zussen: " + p.sibs.join("; "));
      if (p.open && p.open.length) L(1, "NOTE", "Nog uit te zoeken: " + p.open.join(" "));
      const q = QUAY[p.st];
      [...(p.src || []), ...(p.scan || [])].forEach(s => { if (!s || !s[0]) return; P(1, "SOUR", bron(s[0], s[1])); if (q !== undefined) L(2, "QUAY", String(q)); });
    }
    gezinnen(x);
    partner(p.kw);
  });
  (kinderen || []).forEach((n, i) => { L(0, "INDI", "", "K" + (i + 1)); L(1, "NAME", n); L(2, "GIVN", n); out.push("1 SEX U"); gezinnen("K" + (i + 1)); });
  buiten.forEach(Q => { L(0, "INDI", "", Q.x); if (/^onbekend$/i.test(Q.naam)) L(1, "NAME", "onbekend"); else naam(Q.naam); out.push("1 SEX " + (Q.man ? "M" : "F")); P(1, "FAMS", Q.F.x); L(1, "NOTE", "Partner buiten de stamboom; alleen de naam staat in de bronnen van het huwelijk."); });
  /* gezinnen met huwelijk: uit het record van de vader, of van de moeder als daar meer staat; alleen als de partner klopt */
  fams.forEach(F => {
    L(0, "FAM", "", F.x);
    if (F.f) P(1, "HUSB", "I" + F.f); else if (F.buiten && F.buiten.man) P(1, "HUSB", F.buiten.x);
    if (F.m) P(1, "WIFE", "I" + F.m); else if (F.buiten && !F.buiten.man) P(1, "WIFE", F.buiten.x);
    F.kids.forEach(c => P(1, "CHIL", c));
    if (F.marr) { /* het vaste veld marriages: datum, plaats, bewijs per huwelijk, bronnen met QUAY, kinderen uit dit huwelijk */
      const mr = F.marr;
      L(1, "MARR"); if (mr.date) L(2, "DATE", gedDatum(mr.date)); if (mr.place) L(2, "PLAC", gedPlaats(mr.place));
      if (mr.st && mr.st !== "A") L(2, "NOTE", "Bewijs voor dit huwelijk: " + bewijs(mr.st));
      Object.entries(mr.unc || {}).forEach(([veld, st]) => { if (st && st !== mr.st) L(2, "NOTE", `Bewijs voor ${({ date: "de datum", place: "de plaats", partner: "de partner" })[veld] || veld}: ${bewijs(st)}`); });
      if (mr.note) L(2, "NOTE", mr.note);
      (mr.src || []).forEach(sr => { if (!sr || !sr[0]) return; P(2, "SOUR", bron(sr[0], sr[1])); if (QUAY[mr.st] !== undefined) L(3, "QUAY", String(QUAY[mr.st])); });
      if (F.kidsNote && F.kidsNote.length) L(1, "NOTE", "Kinderen uit dit huwelijk: " + F.kidsNote.join("; "));
      if (mr.kidsNote) L(1, "NOTE", "Over de kinderen: " + mr.kidsNote);
      return;
    }
    const pf = F.f && person(F.f), pm = F.m && person(F.m);
    const past = (q, sp) => q && !q.living && q.m && (q.m.d || q.m.p) && (!sp || (fams_.get(q.kw) || []).length === 1 || norm(q.m.w).split(" ")[0] === norm(sp.n).split(" ")[0]);
    const m = past(pf, pm) ? pf.m : past(pm, pf) ? pm.m : null;
    if (m) {
      L(1, "MARR"); if (m.d) L(2, "DATE", gedDatum(m.d)); if (m.p) L(2, "PLAC", gedPlaats(m.p));
      const s = [pf, pm].map(q => q && !q.living ? fieldSt(q, "m") : null).filter(Boolean).sort().pop(); if (s && s !== "A") L(2, "NOTE", "Bewijs voor dit gegeven: " + bewijs(s));
      if (m.note) L(2, "NOTE", m.note);
    }
  });
  bronnen.forEach(b => { L(0, "SOUR", "", b.x); L(1, "TITL", b.label); if (b.url) L(1, "NOTE", b.url); });
  L(0, "TRLR");
  return { tekst: out.join("\r\n") + "\r\n", naam: naamBestand, n: { indi: all.length - (kinderen ? 1 : 0) + (kinderen ? kinderen.length : 0) + buiten.length, fam: fams.size, sour: bronnen.size } };
}
const GED_ICO = '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>';
/* the GEDCOM action: one button with the download icon, and a status line next to it */
const gedcomButton = label => `<button type="button" class="btn" data-gedcom title="Een bestand met de hele stamboom: namen, datums, plaatsen, beroepen, notities en bronnen, met het bewijslabel"><svg class="nico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GED_ICO}</svg>${label}</button><span class="small ged-ok" role="status" aria-live="polite"></span>`;
const gedcomNote = () => "GEDCOM is een bestand voor stamboomprogramma's (Gramps, Aldfaer, MyHeritage). Van levenden staat alleen de naam erin.";
function gedBlok(kop) {
  if (!GEDCOM_KNOP) return "";
  return `${kop ? `<div class="section-head noprint"><h2>Downloaden</h2></div>` : ""}<div class="ged-blok noprint"><div class="ged-rij">${gedcomButton("Download als GEDCOM")}</div>
    <p class="small">${esc(gedcomNote())}</p></div>`;
}
/* the toolbar of the pedigree list: the family choice on the left, two equal actions on the right (print or pdf, GEDCOM), one short note below */
function gedcomToolbar(view) {
  const bar = view && $(".toolbar", view), print = view && $("#lijstPrint", view); if (!bar) return;
  const acts = document.createElement("div"); acts.className = "tb-actions";
  if (print) { print.classList.remove("primary"); print.innerHTML = navIco("print") + "Afdrukken of pdf"; acts.appendChild(print); }
  if (GEDCOM_KNOP) acts.insertAdjacentHTML("beforeend", gedcomButton("GEDCOM"));
  bar.classList.add("tb-split"); bar.appendChild(acts);
  if (GEDCOM_KNOP) bar.insertAdjacentHTML("afterend", `<p class="small ged-note noprint">${esc(gedcomNote())}</p>`);
}
function gedDownload(btn) {
  const ok = btn.parentElement.querySelector(".ged-ok"), meld = t => { if (ok) ok.textContent = t; };
  let r;
  try { r = gedcomTekst(); } catch (e) { meld("Het bestand maken lukte niet."); return; }
  let ingesloten = false; try { ingesloten = window.self !== window.top; } catch (e) { ingesloten = true; }
  if (ingesloten) { meld(`Downloaden kan niet in dit ingesloten venster. Open de site zelf${siteUrl() ? " (" + siteUrl() + ")" : ""} om het bestand op te slaan.`); return; }
  try {
    const u = URL.createObjectURL(new Blob(["﻿" + r.tekst], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = u; a.download = r.naam; a.hidden = true; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 10000);
    meld(`${r.naam}: ${r.n.indi.toLocaleString("nl-NL")} personen, ${r.n.fam.toLocaleString("nl-NL")} gezinnen, ${r.n.sour.toLocaleString("nl-NL")} bronnen.`);
  } catch (e) { meld("Downloaden lukte niet in deze browser."); }
}
document.addEventListener("click", e => { const b = e.target.closest("[data-gedcom]"); if (b) { e.preventDefault(); gedDownload(b); } });

/* ---------- voorlezen ---------- */
/* "Lees voor" bij een verhaal en in het profiel van een overledene, met de spraak van de browser (Web Speech API) en een
   Nederlandse stem. Leest per alinea en markeert de alinea die aan de beurt is; kw-nummers, bewijslabels en links worden
   overgeslagen. Alle zinnen gaan in één keer in de wachtrij, vanuit de klik (iOS start spraak alleen na een klik).
   Zonder spraak of zonder Nederlandse stem is er geen knop. Het voorlezen stopt zodra de tekst uit beeld gaat: een andere
   pagina, een ander profiel of het profiel dicht. */
const VOORLEZEN_AAN = true; /* true: de knop Lees voor bij verhalen en in het profiel */
const VL = { stem: null, bar: null, rij: null, pauze: false, obs: null, nu: null };
const vlKan = () => typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
function vlKiesStem() {
  if (!vlKan()) return null;
  let vs = []; try { vs = speechSynthesis.getVoices().filter(v => /^nl([-_]|$)/i.test(v.lang || "")); } catch (e) { return null; }
  if (!vs.length) return null;
  for (const n of ["Xander", "Claire", "Ellen", "Google Nederlands"]) { const v = vs.find(x => (x.name || "").includes(n)); if (v) return v; }
  return vs.find(v => /^nl[-_]NL$/i.test(v.lang)) || vs[0];
}
function vlSync() {
  VL.stem = vlKiesStem();
  $$(".vl-bar").forEach(b => { b.hidden = !VL.stem; });
  if (!VL.stem && VL.rij) vlStop();
}
if (vlKan()) { vlSync(); try { speechSynthesis.addEventListener("voiceschanged", vlSync); } catch (e) { speechSynthesis.onvoiceschanged = vlSync; } }
const VL_ICO = { lees: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  pauze: '<path d="M9 5.5v13M15 5.5v13"/>', verder: '<path d="M8 5.5v13l10.5-6.5z"/>', stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="1"/>' };
const vlIco = k => `<svg class="nico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${VL_ICO[k]}</svg>`;
/* de tekst zoals hij hardop klinkt: zonder kw-nummers, bewijslabels en adressen */
const vlSchoon = t => String(t || "")
  .replace(/https?:\/\/\S+/g, "")
  .replace(/\s*\((?:\s*(?:kw\.?\s?\d+|en|of|,|;|\/|–|-)\s*)+\)/gi, "")
  .replace(/\s*\([ABCD](?:\s*[,;:·][^)]*)?\)/g, "")
  .replace(/,?\s*\bkw\.?\s?\d+(?:\s*[\/–-]\s*\d+)*/gi, "")
  .replace(/\s+·\s+/g, ", ").replace(/×/g, "en")
  .replace(/\(\s*\)/g, "").replace(/\s+([,.;:!?)])/g, "$1").replace(/\s{2,}/g, " ").trim();
const vlTekst = el => { const c = el.cloneNode(true); $$(".tag, .geldw, .vl-bar, .scanlink, svg", c).forEach(x => x.remove());
  if (c.tagName === "DL") $$("dt", c).forEach(dt => { dt.textContent = dt.textContent.trim() + ": "; });
  if (c.tagName === "DL") $$("dd", c).forEach(dd => { dd.textContent = dd.textContent.trim().replace(/[.;]?$/, ". "); });
  return vlSchoon(c.textContent); };
/* lange alinea's in zinnen (sommige stemmen breken een heel lange uitspraak af) */
function vlZinnen(t) {
  const z = t.split(/(?<=[.!?])\s+/), uit = [];
  z.forEach(s => { if (uit.length && (uit[uit.length - 1] + " " + s).length < 220) uit[uit.length - 1] += " " + s; else uit.push(s); });
  return uit.filter(s => /[\p{L}\d]/u.test(s));
}
function vlBar(wat) {
  return `<div class="vl-bar noprint"${VL.stem ? "" : " hidden"} data-wat="${esc(wat)}"><button type="button" class="btn vl-play" aria-pressed="false" aria-label="Lees ${esc(wat)} voor">${vlIco("lees")}<span>Lees voor</span></button><button type="button" class="btn vl-stop" aria-label="Stop met voorlezen" hidden>${vlIco("stop")}<span>Stop</span></button></div>`;
}
function vlKnoppen() {
  $$(".vl-bar").forEach(b => {
    const p = $(".vl-play", b), s = $(".vl-stop", b), actief = b === VL.bar && VL.rij, wat = b.dataset.wat || "de tekst";
    const [ico, label, aria, druk] = !actief ? ["lees", "Lees voor", `Lees ${wat} voor`, false] : VL.pauze ? ["verder", "Verder", "Ga verder met voorlezen", false] : ["pauze", "Pauze", "Pauzeer het voorlezen", true];
    p.innerHTML = vlIco(ico) + (b.classList.contains("vl-ico") ? "" : `<span>${label}</span>`); p.setAttribute("aria-label", aria); p.setAttribute("aria-pressed", String(druk)); if (b.classList.contains("vl-ico")) p.title = label;
    s.hidden = !actief;
  });
}
function vlMarkeer(el) {
  if (VL.nu) VL.nu.classList.remove("vl-nu");
  VL.nu = el || null;
  if (!el) return;
  el.classList.add("vl-nu");
  const r = el.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight - 20) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function vlStop() {
  VL.rij = null; VL.pauze = false;
  if (VL.obs) { VL.obs.disconnect(); VL.obs = null; }
  if (vlKan()) try { speechSynthesis.cancel(); } catch (e) {}
  vlMarkeer(null); vlKnoppen(); VL.bar = null;
}
function vlStart(bar, delen) {
  vlStop();
  if (!VL.stem) return;
  const rij = []; delen.forEach(d => vlZinnen(d.tekst).forEach(t => rij.push([d.el, t])));
  if (!rij.length) return;
  VL.bar = bar; VL.rij = rij;
  rij.forEach(([el, t], j) => {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = VL.stem.lang || "nl-NL"; try { u.voice = VL.stem; } catch (e) {} u.rate = .95;
    u.onstart = () => { if (VL.rij === rij) vlMarkeer(el); };
    u.onend = () => { if (VL.rij === rij && j === rij.length - 1) vlStop(); };
    u.onerror = e => { if (VL.rij === rij && !/interrupted|canceled/.test(e && e.error || "")) vlStop(); };
    speechSynthesis.speak(u);
  });
  /* stoppen zodra de tekst uit beeld gaat */
  VL.obs = new MutationObserver(() => { if (VL.bar && (!VL.bar.isConnected || VL.bar.closest("[hidden]"))) vlStop(); });
  VL.obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["hidden"] });
  vlKnoppen();
}
/* afspelen, pauzeren of verder gaan; delen() geeft bij de klik de alinea's */
function vlKlik(bar, delen) {
  if (VL.bar === bar && VL.rij) { if (VL.pauze) { speechSynthesis.resume(); VL.pauze = false; } else { speechSynthesis.pause(); VL.pauze = true; } vlKnoppen(); return; }
  vlStart(bar, delen().map(el => ({ el, tekst: vlTekst(el) })).filter(d => d.tekst));
}
/* een balk koppelen */
function vlBind(bar, delen) {
  if (!bar) return;
  $(".vl-play", bar).onclick = () => vlKlik(bar, delen);
  $(".vl-stop", bar).onclick = () => { vlStop(); $(".vl-play", bar).focus(); };
}
/* wat in het profiel wordt voorgelezen: de naam, de zin over het leven, de gegevens en de weetjes */
const vlProfielDelen = () => { const body = $("#dBody"); return [$("#dName"), $(".kort", body), $(":scope > dl.dl", body), ...$$(".notes > p", body)].filter(Boolean); };
/* voor de kop van het profiel: een kleine knop (pictogram), met een stopknop die verschijnt tijdens het voorlezen */
function vlIcon(p) {
  if (!VOORLEZEN_AAN || !p || p.living || !vlKan()) return "";
  return `<span class="vl-bar vl-ico noprint" data-wat="dit profiel"${VL.stem ? "" : " hidden"}><button type="button" class="btn icon vl-play" aria-pressed="false" aria-label="Lees dit profiel voor" title="Lees voor">${vlIco("lees")}</button><button type="button" class="btn icon vl-stop" aria-label="Stop met voorlezen" title="Stop" hidden>${vlIco("stop")}</button></span>`;
}
document.addEventListener("click", e => {
  const bar = e.target.closest(".vl-ico"); if (!bar) return;
  if (e.target.closest(".vl-stop")) { vlStop(); $(".vl-play", bar).focus(); }
  else if (e.target.closest(".vl-play")) vlKlik(bar, vlProfielDelen);
});
addEventListener("pagehide", () => { if (VL.rij) vlStop(); });
/* bij een verhaal: titel, inleiding, en per deel de kop en de alinea's (zonder bijschriften en de lijst met mensen) */
if (RENDER.verhalen) { const eerder = RENDER.verhalen; RENDER.verhalen = sub => { eerder(sub); vlVerhaal(); }; }
function vlVerhaal() {
  const art = $("#v-verhalen article.story"); if (!VOORLEZEN_AAN || !art || !vlKan()) return;
  const lede = $(":scope > p.lede", art); if (!lede) return;
  lede.insertAdjacentHTML("afterend", vlBar("dit verhaal"));
  vlBind(lede.nextElementSibling, () => {
    const els = [];
    for (const el of $$(":scope > h1, :scope > p.lede, :scope > h2, :scope > p", art)) {
      if (el.tagName === "H2" && /^(Beelden bij|Mensen in) dit verhaal/.test(el.textContent.trim())) break;
      if (!el.classList.contains("ov-more")) els.push(el);
    }
    return els;
  });
}

/* ---------- weet je meer ---------- */
/* "Weet je meer?": een kant-en-klaar bericht over een overleden persoon (of een open vraag) met de link erbij. De bezoeker
   deelt het via het eigen toestel (navigator.share: WhatsApp, mail …) of kopieert het, net als de knop Delen in het profiel.
   Er staat geen adres, telefoonnummer of formulier op de site. */
const WEETJEMEER_AAN = true; /* true: de knop in het profiel en bij Help mee zoeken */
const wjmAan = () => T.key === "a" ? "Alies of Harrie" : "Harrie of Alies";
const wjmUitleg = () => `Stuur het naar ${wjmAan()}; foto's, bidprentjes, herinneringen en verbeteringen zijn welkom.`;
const wjmLink = tok => (siteUrl() || location.href.split("#")[0]) + "#" + T.prefix + tok;
const wjmBericht = (over, tok) => `${over} op de stamboom: ${wjmLink(tok)}\n\nIk weet nog dit: …\n\nIk heb een foto of document: …`;
async function wjmDeel(tekst, titel, ok) {
  const meld = t => { if (!ok) return; ok.textContent = t; clearTimeout(ok._t); ok._t = setTimeout(() => { ok.textContent = ""; }, 5000); };
  if (navigator.share) { try { await navigator.share({ title: titel, text: tekst }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
  const klaar = `Bericht gekopieerd. Plak het in een mail of app aan ${wjmAan()}.`;
  try { await navigator.clipboard.writeText(tekst); meld(klaar); }
  catch (e) { const t = document.createElement("textarea"); t.value = tekst; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select();
    let gelukt = false; try { gelukt = document.execCommand("copy"); } catch (x) {} t.remove(); meld(gelukt ? klaar : "Kopiëren lukte niet in deze browser."); }
}
const wjmKnop = () => `<button type="button" class="btn wjm-knop">Weet je meer?</button><span class="small wjm-ok" role="status" aria-live="polite"></span>`;
/* voor de opbouw van het profiel: het blok als html (leeg bij levenden); de klik loopt via [data-wjm] */
function wjmBlock(kw, p) {
  if (!WEETJEMEER_AAN || !p || p.living) return "";
  return `<section class="wjm"><h5>Weet je meer?</h5><p class="small">${esc(wjmUitleg())}</p><div class="wjm-rij">${wjmKnop().replace('class="btn wjm-knop"', `class="btn wjm-knop" data-wjm="${kw}"`)}</div></section>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-wjm]"); if (!b) return;
  const kw = +b.dataset.wjm, p = person(kw); if (!p || p.living) return;
  wjmDeel(wjmBericht(`Over ${p.n} (${lifeYears(p)})`, "kw" + kw), p.n, b.parentElement.querySelector(".wjm-ok"));
});
/* bij elke vraag onder "Help mee zoeken" */
function wjmZoeken(host, list) {
  if (!WEETJEMEER_AAN) return;
  $$(".zkcard", host).forEach((card, i) => {
    const z = list[i]; if (!z) return;
    card.insertAdjacentHTML("beforeend", `<div class="wjm-rij wjm-zk">${wjmKnop()}</div>`);
    $(".wjm-knop", card).onclick = () => wjmDeel(wjmBericht(`Over de vraag "${z.vraag}"`, "zoeken"), "Help mee zoeken", $(".wjm-ok", card));
  });
}

/* ---------- stamreeks ---------- */
/* De stamreeks: van vader op vader terug (kw, 2·kw, 4·kw, …) zolang de persoon bekend is; bij kwartierverlies via fanKw, zoals
   de waaier. De naamreeks volgt de achternaam: de vader, tenzij het kind de familienaam van de moeder draagt en niet die van de
   vader (een patroniem telt niet als familienaam). In de boom van de kinderen loopt de reeks via Harrie (kw 2).
   Adres: #stamreeks, #stamreeks-<kw>, #naamreeks, #naamreeks-<kw> (ook met a-/s-). Afdrukken met de print-CSS, altijd licht.
   Van levenden alleen de naam. */
VIEWS.push("stamreeks");
{ const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-stamreeks"; sec.hidden = true; $("main").appendChild(sec); }
NAV_PATH.stamreeks = '<circle cx="12" cy="4.5" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="12" cy="19.5" r="2.2"/><path d="M12 6.7v3.1M12 14.2v3.1"/>';
const STAMREEKS_KNOP = true; /* knop "Stamreeks vanaf hier" in het profiel */
const srState = { kw: 1, naam: false, jong: false };
const srP = k => k === 1 ? person(1) : person(fanKw(k));
const srOk = k => k === 1 || (Number.isInteger(k) && k > 1 && k < 2 ** 50 && !!srP(k));
function srFromToken(t) {
  const m = String(t).match(/^(stam|naam)reeks(?:-(\d+))?$/) || [];
  srState.naam = m[1] === "naam";
  const k = m[2] ? +m[2] : 1; srState.kw = srOk(k) ? k : 1;
}
const srTok = (naam, k) => (naam ? "naamreeks" : "stamreeks") + (k > 1 ? "-" + k : "");
const srToken = () => srTok(srState.naam, srState.kw);
const srSur = p => p ? splitName(p.n).sur : "";
const srGelijk = (a, b) => !!a && !!b && norm(a).replace(/\s+/g, " ").trim() === norm(b).replace(/\s+/g, " ").trim();
/* een patroniem (Hylkes, Jans, Thijssen): één woord op -s, -sz, -se, -sen, -x of -z; is de vader bekend, dan ook met het begin van zijn voornaam */
const srStam = s => norm(s).replace(/ij/g, "y").replace(/th/g, "t").replace(/ae/g, "a").replace(/[iey]/g, "y").slice(0, 3);
function srPatr(s, vader) {
  if (!s || /\s/.test(s) || s.length < 4 || !/(s|sz|se|sen|x|z)$/i.test(s)) return false;
  return !vader || srStam(s) === srStam(splitName(vader.n).given[0] || "");
}
/* de reeks, van jong naar oud: [{ k: plek in de stamboom, p, via: "vader" of "moeder" van de jongere }] */
function srReeks(start, naam) {
  const rij = [];
  for (let k = start, via = null; k && k < 2 ** 50 && rij.length < 63;) {
    const p = srP(k); if (!p) break;
    rij.push({ k, p, via });
    const f = 2 * k, m = f + 1, fp = srP(f), mp = srP(m), s = srSur(p);
    if (naam && !(k === 1 && T.key === "s") && mp && s && !srPatr(s, fp) && srGelijk(srSur(mp), s) && !(fp && srGelijk(srSur(fp), s))) { k = m; via = "moeder"; }
    else if (fp) { k = f; via = "vader"; }
    else break;
  }
  return rij;
}
/* een zin uit de eigen gegevens over de achternaam (de naamsaanneming van 1811/1812, of een naam die al ouder is) */
const SR_ZIN = s => /(^|[^a-zà-ÿ])(familie|achter)?naam/i.test(s) && /181[12]|naamsaanneming|naamaanneming/i.test(s);
const srZinnen = t => String(t || "").split(/(?<=[.!?])\s+(?=[A-Z'‘"(])/);
function srNaamZin(p) {
  if (!p || p.living) return "";
  for (const n of p.notes || []) { const o = noteObj(n); if (o.k === "hypothese") continue; const z = srZinnen(o.t).find(SR_ZIN); if (z) return z; }
  const r = (p.res || []).find(x => SR_ZIN(x.y + " " + x.t)); if (r) return `${r.y}: ${r.t}`;
  return srZinnen(p.stNote).find(SR_ZIN) || "";
}
/* de oudste generatie in de reeks met zo'n zin (index in de reeks van jong naar oud, of -1) */
const srMark = rij => { for (let i = rij.length - 1; i >= 0; i--) if (srNaamZin(rij[i].p)) return i; return -1; };
/* één generatie; de koppeling naar het kind staat tussen de twee kaarten (oudste bovenaan: onder de ouder). poster: zonder knoppen */
function srRijHtml(r, i, rij, mark, jong, poster) {
  const { k, p } = r, kind = i > 0 ? rij[i - 1] : null;
  const g = `<span class="sr-g">gen. ${ROMAN[gen(k)]}<small>kw ${k}</small></span>`;
  const naam = poster ? `<b class="sr-n">${esc(p.n)}</b>` : `<button type="button" class="sr-n" data-open="${k === 1 ? 1 : fanKw(k)}">${esc(p.n)}</button>`;
  let stap = "";
  if (kind) {
    const s = p.living ? null : p.link || p.st;
    const via = r.via === "moeder" ? `; ${esc(firstName(kind.p))} draagt haar achternaam ${esc(srSur(p))}` : "";
    stap = `<div class="sr-stap${s === "C" || s === "D" ? " sr-stap-" + s : ""}"><span>${r.via === "moeder" ? "moeder" : "vader"} van ${esc(firstName(kind.p))}${via}</span>${s ? stTag(s, true) : ""}</div>`;
  }
  const rijDiv = kaart => `<div class="sr-rij${p.living ? " sr-levend" : ""}" role="listitem" style="--c:${lineColor(k)}">${jong ? stap : ""}${kaart}${jong ? "" : stap}</div>`;
  if (p.living) return rijDiv(`<div class="sr-kaart">${g}<div class="sr-b"><h3>${naam}</h3></div></div>`);
  const sur = srSur(p), vader = srP(2 * k), patr = srPatr(sur, vader) && (!!vader || i > mark);
  const tags = [stTag(p.st), patr ? `<span class="tag sr-patr" title="Een vadersnaam (patroniem), geen vaste achternaam">patroniem ${esc(sur)}</span>` : ""].filter(Boolean).join(" ");
  const beroep = String(p.occ || "").split(";")[0].trim();
  const pk = k > 1 ? k ^ 1 : 0, pp = pk ? srP(pk) : null, pl = [];
  if (p.bp) pl.push("geboren in " + esc(placeName(p.bp)));
  if (p.m && p.m.w && !(pp && pp.living)) {
    const y = yr(p.m.d), zelfde = pp && norm(p.m.w).includes(norm(splitName(pp.n).given[0] || "-"));
    const w = zelfde && !poster ? `<button type="button" class="link" data-open="${fanKw(pk)}">${esc(p.m.w)}</button>` : esc(p.m.w);
    pl.push(`getrouwd${y ? " " + (isApprox(p.m.d) ? "ca. " : "") + y : ""}${p.m.p ? " in " + esc(placeName(p.m.p)) : ""} met ${w}`);
  }
  if (p.dp) pl.push("overleden in " + esc(placeName(p.dp)));
  const zin = i === mark ? srNaamZin(p) : "";
  return rijDiv(`<div class="sr-kaart">${g}<div class="sr-b"><h3>${naam} ${tags}</h3><p class="sr-j">${esc(lifeYears(p))}${beroep ? ` · ${esc(beroep)}` : ""}</p>${pl.length ? `<p class="sr-pl">${pl.join(" · ")}</p>` : ""}${zin ? `<p class="sr-naamzin"><b>De achternaam.</b> ${esc(zin)}</p>` : ""}</div></div>`);
}
/* snelkeuze: de hoofdpersoon en de acht families (de overgrootouders, in hun lijnkleur); een andere keuze staat er ook bij */
function srSnel(cur, tok) {
  const fam = LINE_KEYS.filter(l => LINES[l] && srP(l));
  const it = (k, label, kl) => `<a class="chip" href="#${T.prefix}${tok(k)}" data-go="${tok(k)}"${cur === k ? ` aria-current="true"` : ""}${kl ? ` style="--c:${kl}"` : ""}>${kl ? "<i></i>" : ""}${label}</a>`;
  return it(1, esc(T.key === "s" ? T.rootFull || T.root : T.root)) + fam.map(l => it(l, esc(LINES[l].name), `var(--l${l})`)).join("")
    + (cur !== 1 && !fam.includes(cur) && srP(cur) ? it(cur, esc(srP(cur).n)) : "");
}
function renderStamreeks() {
  const S = srState, host = $("#v-stamreeks"), rij = srReeks(S.kw, S.naam), mark = srMark(rij);
  const eerst = rij[0].p, oudst = rij[rij.length - 1].p, wie = S.kw === 1 ? (T.rootFull || T.root) : eerst.n;
  const woord = S.naam ? "Naamreeks" : "Stamreeks", viaM = rij.filter(r => r.via === "moeder").length;
  const tot = `${rij.length} generaties, tot ${oudst.n}${oudst.living || !(oudst.b || oudst.d) ? "" : " (" + lifeYears(oudst) + ")"}`;
  const lede = rij.length < 2 ? `Van ${wie} is de vader nog niet gevonden.` : S.naam
    ? `Van ${wie} terug langs de achternaam: ${tot}. ${viaM ? `De achternaam komt meestal van de vader, maar ${viaM === 1 ? "één keer" : viaM + " keer"} van de moeder: dan droeg het kind haar familienaam.` : "De achternaam komt hier steeds van de vader, dus de naamreeks is gelijk aan de stamreeks."}`
    : `Van ${wie} terug, steeds naar de vader: ${tot}.`;
  const knop = (attr, v, cur, label) => `<button type="button" class="chip" ${attr}="${v}" aria-pressed="${cur}">${label}</button>`;
  const rijen = (S.jong ? rij : [...rij].reverse()).map(r => srRijHtml(r, rij.indexOf(r), rij, mark, S.jong, false)).join("");
  const naarPoster = "poster--soort-stamreeks" + (S.kw > 1 ? "--vanaf-" + S.kw : "");
  host.innerHTML = `<h1 class="page-title">${woord}</h1>
    <p class="lede">${esc(lede)}</p>
    <div class="sr-kies">
      <div class="op-f" role="group" aria-labelledby="srL1"><span class="op-l" id="srL1">${woord} van</span><div class="chips">${srSnel(S.kw, k => srTok(S.naam, k))}</div></div>
      <div class="op-f" role="group" aria-labelledby="srL2"><span class="op-l" id="srL2">Volg</span><div class="chips">${knop("data-srmode", "stam", !S.naam, "Vader op vader")}${knop("data-srmode", "naam", S.naam, "Langs de achternaam")}</div></div>
      <div class="op-f" role="group" aria-labelledby="srL3"><span class="op-l" id="srL3">Volgorde</span><div class="chips">${knop("data-srvolg", "oud", !S.jong, "Oudste bovenaan")}${knop("data-srvolg", "jong", S.jong, "Jongste bovenaan")}</div></div>
      <div class="op-bar"><button type="button" class="btn" id="srPrint">${navIco("print")}Afdrukken</button><a class="ov-link" href="#${T.prefix}${naarPoster}" data-go="${naarPoster}">Als poster →</a></div>
    </div>
    <p class="printonly sr-kop">${esc(treeTitle())} · ${woord} van ${esc(wie)} · ${esc(VERSION)}</p>
    <div class="sr-lijst" role="list" aria-label="${woord} van ${esc(wie)}, ${S.jong ? "jongste" : "oudste"} bovenaan">${rijen}</div>
    <p class="small sr-uitleg">De lijn tussen twee generaties is de koppeling ouder–kind, met haar bewijs: doorgetrokken bij A of B, streepjes bij C (onzeker), puntjes bij D (hypothese).</p>`;
  $$("[data-srmode]", host).forEach(b => b.onclick = () => go(srTok(b.dataset.srmode === "naam", S.kw), { keepScroll: true }));
  $$("[data-srvolg]", host).forEach(b => b.onclick = () => { S.jong = b.dataset.srvolg === "jong"; renderStamreeks(); const n = $(`[data-srvolg="${b.dataset.srvolg}"]`, host); if (n) n.focus(); });
  $("#srPrint", host).onclick = () => window.print();
}
RENDER.stamreeks = renderStamreeks;
NAV_OF.stamreeks = "lijst"; NAV_OF.poster = "boek"; /* geen eigen tab: de subtabs van Stamboom tonen Kwartierstaat of Boek */
/* op elke familiepagina (lijn-N) een regel naar de stamreeks van die familie, onder de inleiding */
if (STAMREEKS_KNOP) { const srFamOud = RENDER.families; RENDER.families = sub => { srFamOud(sub);
  const lede = sub && LINES[sub] && srOk(sub) ? $("#v-families .lede") : null; if (!lede || $("#v-families [data-sr-fam]")) return;
  lede.insertAdjacentHTML("afterend", ovMore(`data-go="stamreeks-${sub}" data-sr-fam`, `Van vader op vader terug: de stamreeks van de familie ${esc(LINES[sub].name)}`)); }; }
/* in het profiel, in de regel "Vanaf hier:": een link naar de stamreeks (leeg als de vader niet bekend is) */
function srLink(kw) {
  if (!STAMREEKS_KNOP || !srP(2 * kw)) return "";
  return ovMore(`data-go="${kw > 1 ? "stamreeks-" + kw : "stamreeks"}"`, "Van vader op vader terug: de stamreeks");
}

/* ---------- poster ---------- */
/* De stamboom als poster om op te hangen: de waaier, de stamreeks of de kwartierstaat in blokken, op A3, A2, A1, 40 × 50 of
   50 × 70 cm. Het vel heeft de echte maat in mm; op het scherm staat het geschaald in een kader (altijd licht, zoals op papier).
   Afdrukken: @page krijgt de maat van het vel, alleen zolang deze pagina wordt afgedrukt. Keuzes in de hash, als kale tokens:
   poster--formaat-a3--soort-waaier--gen-7--vanaf-12. window.posterDruk(afloop) zet het vel klaar voor een pdf met afloop (mm).
   Alle letters zijn minstens 6 pt op papier; de waaier toont namen tot de generatie waar dat nog lukt. Van levenden alleen de naam. */
VIEWS.push("poster");
{ const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-poster"; sec.hidden = true; $("main").appendChild(sec); }
NAV_PATH.poster = '<rect x="4" y="2.5" width="16" height="19" rx="1"/><path d="M7.5 15.5a4.5 4.5 0 0 1 9 0M10 15.5a2 2 0 0 1 4 0M8 6.5h8"/>';
/* [id, label, w, h, only for this kind]: the long strip and the bookmark only for the stamreeks (drawn by the product engine) */
const PS_FORMAAT = [["a3", "A3", 297, 420], ["a2", "A2", 420, 594], ["a1", "A1", 594, 841], ["40x50", "40 × 50 cm", 400, 500], ["50x70", "50 × 70 cm", 500, 700],
  ["30x150", "Lange strook", 300, 1500, "stamreeks"], ["50x148", "Boekenlegger", 50, 148, "stamreeks"]];
const PS_KIND_PRODUCT = { waaier: "poster-fan", stamreeks: "poster-lineage", kwartierstaat: "poster-pedigree", kaart: "poster-map" };
const psFormaten = S => PS_FORMAAT.filter(f => !f[4] || f[4] === S.soort);
const PS_SOORT = [["waaier", "Waaier"], ["stamreeks", "Stamreeks"], ["kwartierstaat", "Kwartierstaat"], ...(typeof Products !== "undefined" && Products.renderers && Products.renderers.map ? [["kaart", "Kaart"]] : [])];
const PS_R = [0, 58, 126, 192, 268, 344, 412, 460, 498, 530]; /* de ringen van drawFan; zonder boogjes is de rand R + 10 */
const PS_PT = 25.4 / 72, PS_MIN = 6; /* mm per punt; de kleinste letter op papier */
const psLeeg = () => ({ formaat: "a2", soort: "waaier", gen: 0, kw: 1, paar: false, persoon: false, voor: [], afloop: 0, namen: true, stap: "" }); /* stap: the wizard step (id), "" = the last one */ /* paar: kw is de vader van een paar (kw en kw + 1) */
const psState = psLeeg();
function psFromToken(t) {
  Object.assign(psState, psLeeg());
  const parts = String(t).split("--").slice(1); let stap = 0;
  parts.forEach(x => {
    let m;
    if ((m = x.match(/^formaat-(\w+)$/)) && PS_FORMAAT.some(f => f[0] === m[1])) psState.formaat = m[1];
    else if (PS_FORMAAT.some(f => f[0] === x)) psState.formaat = x; /* the bare size, as the calendar and the cards write it */
    else if ((m = x.match(/^soort-(\w+)$/)) && PS_SOORT.some(f => f[0] === m[1])) psState.soort = m[1];
    else if ((m = x.match(/^gen-(\d{1,2})$/))) psState.gen = +m[1];
    else if (x === "zonder-namen") psState.namen = false;
    else if (x === "persoon") psState.persoon = true;
    else if (/^voor-./.test(x)) psState.voor.push(x.slice(5));
    else if ((m = x.match(/^afloop-(\d)$/)) && [0, 3, 4].includes(+m[1])) psState.afloop = +m[1];
    else if ((m = x.match(/^stap-(\d)$/))) stap = +m[1];
    else if ((m = x.match(/^vanaf-(\d+)$/)) && srOk(+m[1])) psState.kw = +m[1];
    else if ((m = x.match(/^vanaf-paar-(\d+)$/)) && +m[1] >= 2 && (person(fanKw(+m[1] & ~1)) || person(fanKw((+m[1] & ~1) + 1)))) { psState.kw = +m[1] & ~1; psState.paar = true; }
  });
  if (!psFormaten(psState).some(f => f[0] === psState.formaat)) psState.formaat = psLeeg().formaat; /* a strip or bookmark only for the stamreeks */
  if (psState.soort !== "kaart") psState.namen = true;
  const r = psGenBereik(psState); if (psState.gen && (psState.gen < r[0] || psState.gen > r[1] || psState.gen === r[2])) psState.gen = 0; /* 0 = het advies voor dit formaat */
  /* the wizard: a bare #poster starts at the first step, a link with only the start (the tab Poster, the book) at "Soort",
     a link with choices but without a step opens on "Klaar" */
  const st = psStappen(psState); psState.stap = stap ? (st[stap - 1] || "") : !parts.length || parts.every(x => /^(vanaf-|persoon$|voor-)/.test(x)) ? st[0]
    : parts.every(x => /^(vanaf-|persoon$|voor-|soort-)/.test(x)) && st[0] === "kind" ? st[1] : ""; /* the family from the header: the first step; the kind known too: the step after it */
  if (psState.stap === st[st.length - 1]) psState.stap = "";
}
/* the steps of the poster wizard, from the registry (with their words); "Details" only for the fan and the map */
const psAfloop = S => (Products.products[PS_KIND_PRODUCT[S.soort]] || { bleed: [0, 3] }).bleed; /* the bleeds this poster offers */
const psStapDefs = S => Products.stepsOf(Products.products[PS_KIND_PRODUCT[S.soort]]);
const psStappen = S => psStapDefs(S).map(s => s.id);
const psStapNu = S => S.stap && psStappen(S).includes(S.stap) ? S.stap : "ready";
function psToken(stap = psState.stap) {
  const S = psState, D = psLeeg(), p = ["poster"], st = psStappen(S);
  if (S.formaat !== D.formaat) p.push("formaat-" + S.formaat);
  if (S.soort !== D.soort || p.length > 1 || (stap || "ready") !== st[0] || S.kw > 1 || S.afloop) p.push("soort-" + S.soort); /* the kind stays readable in a shared link; only a bare #poster (step 1) goes without */
  if (S.gen && S.soort !== "stamreeks") p.push("gen-" + S.gen);
  if (S.soort === "kaart" && !S.namen) p.push("zonder-namen");
  if (S.afloop) p.push("afloop-" + S.afloop);
  if (S.kw > 1) p.push((S.paar ? "vanaf-paar-" : "vanaf-") + S.kw);
  if ((S.voor || []).length) S.voor.forEach(x => p.push("voor-" + x)); else if (S.persoon) p.push("persoon");
  const n = st.indexOf(stap && st.includes(stap) ? stap : "ready") + 1;
  /* the last step goes without a step only when the other choices already make the address open there; with only the family and the
     kind, a bare address opens the first steps (psFromToken), so "Klaar" needs its own step */
  if (n < st.length || p.slice(1).every(x => /^(vanaf-|persoon$|voor-|soort-)/.test(x))) p.push("stap-" + n);
  return p.join("--");
}
/* maat van het vel in mm; de kwartierstaat ligt, de rest staat. u = 1 % van de korte zijde (voor de lettergroottes) */
const psMaat = S => { const f = PS_FORMAAT.find(x => x[0] === S.formaat) || PS_FORMAAT[1], lig = S.soort === "kwartierstaat"; return { naam: f[1], w: lig ? f[3] : f[2], h: lig ? f[2] : f[3], lig, u: Math.min(f[2], f[3]) / 100 }; };
/* waaier: kop en voet hebben een vaste hoogte, de waaier krijgt de rest. namenTot(m) = de laatste generatie met namen van ≥ 6 pt
   (drawFan maakt een te lange naam hooguit 0,82 keer zo klein; die marge telt mee) */
function psWaaierMaat(S) {
  const { w, h, u } = psMaat(S), M = 6 * u, kop = 15 * u, voet = 11 * u, D = Math.min(w - 2 * M, h - 2 * M - kop - voet);
  const namenTot = m => { const s = D / (2 * (PS_R[m] + 10)); let L = 1; for (let g = 2; g <= Math.min(m, 8); g++) if (fanFs(g) * 0.82 * s >= PS_MIN * PS_PT) L = g; return L; };
  let best = 4; for (let m = 4; m <= 8; m++) if (namenTot(m) >= m) best = m;
  return { M, kop, voet, D, namenTot, best };
}
/* kwartierstaat: een kolom per generatie; het kleinste vak moet twee regels van ≥ 6 pt dragen en een kolom ≥ 38 mm breed zijn */
function psKwMaat(S) {
  const { w, h, u } = psMaat(S), M = 5 * u, kop = 13 * u, voet = 11 * u, CW = w - 2 * M, CH = h - 2 * M - kop - voet - 6; /* 6 mm voor de kopjes boven de kolommen */
  let best = 3; for (let G = 3; G <= 8; G++) if (CH / 2 ** (G - 1) >= 2 * 1.2 * PS_MIN * PS_PT + 0.8 && CW / G >= 38) best = G;
  return { M, kop, voet, CW, CH, best };
}
/* [kleinste, grootste, advies] aantal generaties */
const psGenBereik = S => S.soort === "waaier" ? [3, 9, psWaaierMaat(S).best] : S.soort === "kwartierstaat" ? (b => [3, b, b])(psKwMaat(S).best) : [0, 0, 0];
const psGen = S => { const r = psGenBereik(S); return S.gen ? Math.max(r[0], Math.min(r[1], S.gen)) : r[2]; };
const psUrl = () => (($('meta[property="og:url"]') || {}).content || location.href.split("#")[0]).replace(/^https?:\/\//, "").replace(/\/$/, "");
const psWie = S => { if (S.paar) return Products.startName(Products.site.treeData(T.key), { kw: S.kw, pair: true }); const p = S.kw > 1 ? srP(S.kw) : null; return p ? p.n : T.rootFull || T.root; };
/* voet: families in hun lijnkleur, het bewijs A–D zoals in de waaier, de bron en de versie */
function psVoet(lijnen, goud, metVakken) {
  const vak = (o, da, c) => `<svg viewBox="0 0 16 10" aria-hidden="true"><rect x="1" y="1" width="14" height="8" fill="var(--l8)" fill-opacity="${o}" stroke="${c ? "var(--l8)" : "var(--surface)"}" stroke-width="${c ? 0.8 : 0}"${da ? ` stroke-dasharray="${da}"` : ""}/></svg>`;
  const leg = [...lijnen].sort((a, b) => a - b).filter(l => LINES[l]).map(l => `<span style="--c:var(--l${l})"><i></i>${esc(LINES[l].name)}</span>`).join("");
  const bewijs = metVakken
    ? `<p class="ps-bewijs"><b>Bewijs</b> <span>${vak(0.3)}A akte</span><span>${vak(0.2)}B sterk</span><span>${vak(0.12, "2 1.3", 1)}C onzeker</span><span>${vak(0.05, "0.6 1.4", 1)}D hypothese</span>${goud ? `<span><svg viewBox="0 0 16 10" aria-hidden="true"><rect x="1" y="1" width="14" height="8" fill="none" stroke="var(--gold)" stroke-width="1.4"/></svg>dezelfde voorouder via twee lijnen</span>` : ""}<span>Hoe voller de kleur, hoe sterker het bewijs. Een leeg vak: nog niet gevonden.</span></p>`
    : `<p class="ps-bewijs"><b>Bewijs</b> <span>A akte</span><span>B sterk</span><span>C onzeker (streepjes)</span><span>D hypothese (puntjes)</span><span>Het label staat bij elke persoon en bij elke koppeling ouder–kind.</span></p>`;
  return `<div class="ps-voet">${leg ? `<p class="ps-leg">${leg}</p>` : ""}${bewijs}
    <p class="ps-bron"><span>Bij elke persoon staan de bronnen en akten op ${esc(psUrl())}/#${T.prefix}stamboom</span><span>${esc(VERSION)}</span></p></div>`;
}
const psKop = (titel, sub) => `<div class="ps-kop"><p class="ps-eyebrow">${esc(T.brand)}</p><h2 class="ps-titel" style="font-size:calc(var(--u) * ${Math.min(5.2, 150 / titel.length).toFixed(2)})">${esc(titel)}</h2>${sub ? `<p class="ps-sub">${esc(sub)}</p>` : ""}</div>`;
function psVelWaaier(S, vel) {
  const WM = psWaaierMaat(S), m = psGen(S), L = WM.namenTot(m), lijnen = new Set(), zien = new Set();
  for (let g = 2; g <= m; g++) { const n = 2 ** (g - 1); for (let i = 0; i < n; i++) { const pos = S.kw * n + i, ck = fanKw(pos), p = person(ck); if (p && !p.living) { zien.add(ck); if (gen(pos) >= 4) lijnen.add(lineOf(pos)); } } }
  if (S.kw >= 8) lijnen.add(lineOf(S.kw));
  const p = S.kw > 1 ? srP(S.kw) : null;
  const rel = p ? relTerm(S.kw) + (T.key === "s" ? "" : " van " + T.root) : "", sub = [p && !p.living ? lifeYears(p) + ", " + rel : rel, `${zien.size} voorouders in ${m} generaties`, "elke ring is een generatie verder terug"].filter(Boolean).join(" · ");
  vel.innerHTML = psKop(mkTitles({ kw: S.kw, pair: S.paar }, S.persoon, S.voor).title || "De voorouders van " + psWie(S), sub) + `<div class="ps-midden"><div class="ps-fan" style="width:${WM.D}mm;height:${WM.D}mm"></div></div>`;
  const host = $(".ps-fan", vel);
  drawFan(host, { maxGen: m, labelGen: L, interactive: false, root: S.kw });
  vel.insertAdjacentHTML("beforeend", psVoet(lijnen, !!host.querySelector('path[stroke="var(--gold)"]'), true));
  vel.style.setProperty("--ps-kop", WM.kop + "mm"); vel.style.setProperty("--ps-voet", WM.voet + "mm");
  return { m, L };
}
function psVelStamreeks(S, vel) {
  const { w, h, u } = psMaat(S), M = 6 * u, kop = 15 * u, voet = 12 * u, rij = srReeks(S.kw, false), mark = srMark(rij);
  const A = h - 2 * M - kop - voet, fs = Math.max(PS_MIN * PS_PT / 0.62, Math.min(w * 0.034, A / (rij.length * 6.4 + (mark >= 0 ? 2.5 : 0))));
  const oudst = rij[rij.length - 1].p;
  vel.innerHTML = psKop("De stamreeks van " + psWie(S), rij.length > 1 ? `Van vader op vader: ${rij.length} generaties, tot ${oudst.n}` : "")
    + `<div class="ps-midden"><div class="sr-lijst" style="--fs:${fs.toFixed(2)}mm">${[...rij].reverse().map(r => srRijHtml(r, rij.indexOf(r), rij, mark, false, true)).join("")}</div></div>`
    + psVoet(new Set(), false, false);
  vel.style.setProperty("--ps-kop", kop + "mm"); vel.style.setProperty("--ps-voet", voet + "mm");
  /* de reeks vult de hoogte: lettermaat bijstellen op de gemeten hoogte (offsetHeight negeert de schaal van het voorbeeld) */
  const lst = $(".sr-lijst", vel), mid = $(".ps-midden", vel);
  let f = fs;
  for (let n = 0; n < 6 && lst.offsetHeight && mid.clientHeight; n++) {
    const r = mid.clientHeight * 0.97 / lst.offsetHeight; if (Math.abs(r - 1) < 0.02) break;
    f = Math.max(PS_MIN * PS_PT / 0.6, Math.min(w * 0.045, f * (r > 1 ? Math.min(r, 1.5) : r))); lst.style.setProperty("--fs", f.toFixed(2) + "mm");
  }
  return { m: rij.length };
}
/* kwartierstaat in blokken: één svg in mm, de lijnen eerst, dan de vakken */
function psVelKwartier(S, vel) {
  const KM = psKwMaat(S), G = psGen(S), colW = KM.CW / G, bw = colW * 0.86, lijnen = new Set(), zien = new Set(), min = PS_MIN * PS_PT;
  let lijn = "", vak = "", goud = false;
  const box = (g, i) => { const n = 2 ** (g - 1), bh = KM.CH / n, gap = Math.min(1.6, bh * 0.14), hh = Math.min(bh - gap, 30); return { x: (g - 1) * colW, y: i * bh + (bh - hh) / 2, h: hh, bh }; }; /* grote vakken niet hoger dan 30 mm */
  for (let g = 1; g <= G; g++) {
    const n = 2 ** (g - 1);
    for (let i = 0; i < n; i++) {
      const pos = S.kw * n + i, ck = pos === 1 ? 1 : fanKw(pos), p = pos === 1 ? person(1) : person(ck), b = box(g, i);
      if (!p) { vak += `<rect x="${b.x}" y="${b.y}" width="${bw}" height="${b.h}" fill="none" stroke="var(--rule)" stroke-width="0.25" stroke-dasharray="1 1"/>`; continue; }
      if (!p.living) zien.add(ck); if (gen(pos) >= 4) lijnen.add(lineOf(pos));
      const twin = g > 1 && (twinKws(ck).length > 0 || ck !== pos), st = p.living ? null : p.st, c = lineColor(pos);
      const fill = p.living ? 0.08 : ({ A: 0.24, B: 0.16, C: 0.09, D: 0.04 })[st] || 0.1;
      if (twin) goud = true;
      vak += `<rect x="${b.x}" y="${b.y}" width="${bw}" height="${b.h}" rx="0.8" fill="${c}" fill-opacity="${fill}" stroke="${twin ? "var(--gold)" : c}" stroke-width="${twin ? 0.5 : 0.3}"${!twin && st === "C" ? ` stroke-dasharray="1.6 1"` : !twin && st === "D" ? ` stroke-dasharray="0.4 0.9"` : ""}/>`;
      const fs = Math.max(min, Math.min(4.4, b.h * 0.3)), fs2 = Math.max(min, fs * 0.8), lh = 1.22;
      const regels = [[pos === 1 ? T.rootFull || p.n : p.n, fs, 600]];
      if (!p.living) {
        regels.push([lifeYears(p) + (st && st !== "A" ? "  · " + st : ""), fs2, 400]);
        const pl = [p.bp ? "° " + placeName(p.bp) : "", p.dp ? "† " + placeName(p.dp) : ""].filter(Boolean).join("  ");
        if (pl) regels.push([pl, fs2, 400]);
        const occ = String(p.occ || "").split(";")[0].trim(); if (occ && g <= 4) regels.push([occ, fs2, 400]);
      }
      let hoog = 0; const pas = []; for (const r of regels) { if (hoog + r[1] * lh > b.h - 0.6 && pas.length) break; pas.push(r); hoog += r[1] * lh; }
      let y = b.y + (b.h - hoog) / 2;
      pas.forEach(([t, f, wgt]) => { y += f * lh; vak += `<text data-max="${(bw - 3).toFixed(2)}" x="${b.x + 2}" y="${(y - f * 0.3).toFixed(2)}" font-size="${f.toFixed(2)}" font-weight="${wgt}" fill="${wgt === 600 ? "var(--ink)" : "var(--muted)"}">${esc(t)}</text>`; });
      if (g < G) {
        const vb = box(g + 1, 2 * i), mb = box(g + 1, 2 * i + 1), yc = b.y + b.h / 2, xm = b.x + bw + (colW - bw) / 2, yv = vb.y + vb.h / 2, ym = mb.y + mb.h / 2;
        const f = person(fanKw(2 * pos)), mo = person(fanKw(2 * pos + 1)), dash = k => { const s = stapSt(fanKw(k)); return s === "C" ? ` stroke-dasharray="1.6 1"` : s === "D" ? ` stroke-dasharray="0.4 0.9"` : ""; };
        if (f || mo) lijn += `<path d="M${b.x + bw} ${yc}H${xm}" fill="none" stroke="var(--faint)" stroke-width="0.3"/>`;
        if (f) lijn += `<path d="M${xm} ${yc}V${yv}H${colW * g}" fill="none" stroke="var(--faint)" stroke-width="0.3"${dash(2 * pos)}/>`;
        if (mo) lijn += `<path d="M${xm} ${yc}V${ym}H${colW * g}" fill="none" stroke="var(--faint)" stroke-width="0.3"${dash(2 * pos + 1)}/>`;
      }
    }
  }
  const hk = Array.from({ length: G }, (_, g) => `<text x="${g * colW + 2}" y="-2.5" font-size="${Math.max(min, 3).toFixed(2)}" fill="var(--muted)" font-family="var(--mono)">GENERATIE ${ROMAN[g + 1]}</text>`).join("");
  vel.innerHTML = psKop("De kwartierstaat van " + psWie(S), `${zien.size} voorouders in ${G} generaties`)
    + `<div class="ps-midden"><svg class="ps-kw" viewBox="0 -6 ${KM.CW} ${KM.CH + 6}" style="width:${KM.CW}mm;height:${KM.CH + 6}mm" role="img" aria-label="Kwartierstaat van ${esc(psWie(S))} in ${G} generaties">${hk}${lijn}${vak}</svg></div>`
    + psVoet(lijnen, goud, true);
  vel.style.setProperty("--ps-kop", KM.kop + "mm"); vel.style.setProperty("--ps-voet", KM.voet + "mm");
  psPasTekst(vel);
  return { m: G };
}
/* tekst in een vak: te lang (gemeten in de echte letter), dan korter met … */
function psPasTekst(vel) {
  $$("text[data-max]", vel).forEach(t => {
    const max = +t.dataset.max; let s = t.textContent; if (!t.getComputedTextLength || t.getComputedTextLength() <= max) return;
    const f0 = +t.getAttribute("font-size"), fMin = Math.max(PS_MIN * PS_PT, f0 * 0.72); /* eerst iets kleiner (niet onder 6 pt), dan korter */
    let f = f0; while (f > fMin && t.getComputedTextLength() > max) { f = Math.max(fMin, f * 0.95); t.setAttribute("font-size", f.toFixed(2)); }
    while (s.length > 2 && t.getComputedTextLength() > max) { s = s.slice(0, -1).trimEnd(); t.textContent = s + "…"; }
  });
}
/* de kaart: getekend door de productmotor (renderer "map"), met dezelfde maat en marges als de andere posters */
/* een vel uit de productmotor: de kaart, en de waaier vanaf een paar (de waaier van de site begint bij één persoon) */
function psVelKaart(S, vel, product = "poster-map") {
  const opt = { format: S.formaat, bleed: 0, start: { kw: S.kw, pair: !!S.paar } }; if (product === "poster-fan" && S.gen) opt.gen = S.gen; if (product === "poster-map" && S.namen === false) opt.labels = false;
  /* the titles of the book (a family, or a person when chosen as one); the map says "de families …" */
  if (product === "poster-fan" || product === "poster-map") Object.assign(opt, mkTitles({ kw: S.kw, pair: !!S.paar }, S.persoon, S.voor));
  if (product === "poster-fan" && (S.voor || []).length) opt.persons = S.voor.map(v => v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " ")); /* the chosen children in the middle */
  const doc = Products.makeDocument(product, Products.site.treeData(T.key), opt, Products.makePlatform(), { palette: Products.PRINT_PALETTE });
  vel.style.padding = "0"; vel.innerHTML = doc.pages[0].svg;
  const svg = vel.firstElementChild; if (svg) { svg.setAttribute("role", "img"); svg.setAttribute("aria-label", doc.meta.title); }
  return doc.stats && doc.stats.rings ? { m: doc.stats.rings, L: doc.stats.namesUpTo } : { m: 0 };
}
function psVel(S, vel) {
  const { w, h, u } = psMaat(S);
  vel.className = "ps-vel ps-" + S.soort;
  Object.assign(vel.style, { width: w + "mm", height: h + "mm", padding: (S.soort === "kwartierstaat" ? 5 : 6) * u + "mm" });
  vel.style.setProperty("--u", u + "mm"); vel.style.setProperty("--body", Products.PRINT_BODY); /* vaste gewichten, zodat de pdf geen Type 3-fonts krijgt */
  const r = S.soort === "kaart" ? psVelKaart(S, vel) : S.soort === "stamreeks" && PS_FORMAAT.find(f => f[0] === S.formaat)[4] ? psVelKaart(S, vel, "poster-lineage") : S.soort === "waaier" && S.paar ? psVelKaart(S, vel, "poster-fan") : S.soort === "stamreeks" ? psVelStamreeks(Object.assign({}, S, { paar: false }), vel) : S.soort === "kwartierstaat" ? psVelKwartier(Object.assign({}, S, { paar: false }), vel) : psVelWaaier(S, vel); /* stamreeks en kwartierstaat van een paar: vanaf de vader */
  return r;
}
/* het vel past in het kader: schalen met transform (de opmaak blijft op ware grootte) */
let psRO = null;
function psSchaal() {
  const k = $("#psKader"), v = $("#psVel"); if (!k || !v) return;
  v.style.transform = `scale(${k.clientWidth / (parseFloat(v.style.width) * 96 / 25.4)})`;
}
/* The poster as a short wizard: Voor wie → Soort → Maat → Details → Klaar. One question per step, with a sensible default
   already chosen, so "Maak pdf" works at every step. The step is in the address (--stap-N), so sharing and back/forward work.
   The shell is Products.ui.wizard. */
const psCm = mm => String(Math.round(mm) / 10).replace(".", ",");
const psMaatRegel = S => { const f = PS_FORMAAT.find(x => x[0] === S.formaat) || PS_FORMAAT[1], { w, h } = psMaat(S); return /cm$/.test(f[1]) ? (psMaat(S).lig ? `${psCm(w)} × ${psCm(h)} cm` : f[1]) : `${f[1]} · ${psCm(w)} × ${psCm(h)} cm`; };
function psVoorWieLabel(S) {
  const v = voorWieWaarde(T.key, S.kw, S.paar), L = voorWieOpties(), x = [...L.heel, ...L.tak].find(o => o.v === v);
  return x ? x.label : psWie(S);
}
/* the paper sizes on the same scale, each with its size in cm */
function psMaatKaart(S, f, max) {
  const lig = S.soort === "kwartierstaat", w = lig ? f[3] : f[2], h = lig ? f[2] : f[3], k = 64 / max, bw = Math.max(3, w * k), bh = Math.max(3, h * k);
  return `<button type="button" class="ps-keuze ps-maat" data-ps="formaat" data-pv="${f[0]}" aria-pressed="${S.formaat === f[0]}">
    <svg viewBox="0 0 70 70" aria-hidden="true"><rect x="${(35 - bw / 2).toFixed(1)}" y="${(67 - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="0.6"/></svg>
    <b>${esc(f[1])}</b>${/cm$/.test(f[1]) && !lig ? "" : `<small>${psCm(w)} × ${psCm(h)} cm</small>`}</button>`;
}
function psStapHtml(S, id) {
  const r = psGenBereik(S);
  if (id === "which") return mkVoorStap({ start: S.kw, paar: S.paar, persoon: S.persoon, voor: S.voor });
  if (id === "kind") return `<div class="ps-keuzes">${PS_SOORT.map(([k, l]) => { const p = Products.products[PS_KIND_PRODUCT[k]];
    return `<button type="button" class="ps-keuze ps-soort" data-ps="soort" data-pv="${k}" aria-pressed="${S.soort === k}"><span class="mk-mini" data-psmini="${k}" aria-hidden="true"></span><b>${esc(l)}</b><small>${esc(p ? p.promise : "")}</small></button>`; }).join("")}${(c => c && c.status === "ready" && VIEWS.includes("canvas") ? (h => `<a class="ps-keuze ps-soort" href="#${T.prefix}${h}" data-go="${h}"><span class="mk-mini" data-mpmini="canvas-fan" aria-hidden="true"></span><b>Op canvas, aluminium of hout</b><small>De waaier, of de acht families als serie.</small></a>`)("canvas" + mkStartTok({ start: S.kw, paar: S.paar, persoon: S.persoon, voor: S.voor })) : "")(Products.products["canvas-fan"])}</div>`;
  if (id === "size") { const fs = psFormaten(S), max = Math.max(...fs.map(f => Math.max(f[2], f[3])));
    return `<div class="ps-keuzes ps-maten">${fs.map(f => psMaatKaart(S, f, max)).join("")}</div>`; }
  if (id === "look" && S.soort === "waaier") return `<div class="chips" role="group" aria-label="Generaties">${Array.from({ length: r[1] - r[0] + 1 }, (_, i) => r[0] + i)
    .map(g => `<button type="button" class="chip" data-ps="gen" data-pv="${g}" aria-pressed="${g === psGen(S)}">${g}${g === r[2] ? " (advies)" : ""}</button>`).join("")}</div>${psWaaierUitleg(S)}`;
  if (id === "look" && S.soort === "kaart") return `<div class="chips" role="group" aria-label="Plaatsnamen">${[["ja", "Met plaatsnamen"], ["nee", "Zonder plaatsnamen"]]
    .map(([k, l]) => `<button type="button" class="chip" data-ps="namen" data-pv="${k}" aria-pressed="${(k === "ja") === S.namen}">${l}</button>`).join("")}</div>`;
  if (id === "ready") return psBestel(S) || " ";
  return "";
}
function psWaaierUitleg(S) { const res = psWaaierMaat(S), m = psGen(S); return `<p class="bk-uitleg">${res.namenTot(m) < m ? `Op dit formaat passen de namen tot en met generatie ${ROMAN[res.namenTot(m)]}; daarbuiten alleen de kleur.` : "Op dit formaat passen alle namen."}</p>`; }
/* "Zo bestel je": per producer of this poster the name, a price line for this product (if known) and the steps */
const psBestel = S => mpBestel(Products.products[PS_KIND_PRODUCT[S.soort]], S.afloop || 0);
function psSamenvatting(S, id) {
  if (id === "which") return psVoorWieLabel(S);
  if (id === "kind") return (PS_SOORT.find(x => x[0] === S.soort) || [, ""])[1];
  if (id === "size") return psMaatRegel(S);
  if (id === "look") return S.soort === "kaart" ? (S.namen ? "Met plaatsnamen" : "Zonder plaatsnamen") : `${psGen(S)} generaties${S.gen ? "" : " (advies)"}`;
  return "";
}
/* the finer choices, under "Meer keuzes": the bleed for a printer, and for the kwartierstaat fewer generations */
function psMeer(S) {
  const r = psGenBereik(S), chip = (grp, k, l, on) => `<button type="button" class="chip" data-ps="${grp}" data-pv="${k}" aria-pressed="${on}">${esc(l)}</button>`;
  const rij = (id, label, inhoud) => `<div class="op-f" role="group" aria-labelledby="psL-${id}"><span class="op-l" id="psL-${id}">${label}</span><div>${inhoud}</div></div>`;
  return (S.soort === "kwartierstaat" && r[1] > r[0] ? rij("gen", "Generaties", `<div class="chips">${Array.from({ length: r[1] - r[0] + 1 }, (_, i) => r[0] + i).map(g => chip("gen", g, g + (g === r[2] ? " (advies)" : ""), g === psGen(S))).join("")}</div>`) : "")
    + rij("afloop", "Voor de drukker", `<div class="chips">${psAfloop(S).map(b => chip("afloop", b, b ? mmNl(b) + " mm afloop" : "Geen afloop", (S.afloop || 0) === b)).join("")}</div><p class="bk-uitleg">Een drukker snijdt na het drukken een smalle rand van het papier (${psAfloop(S).filter(Boolean).map(mmNl).join(" of ")} mm, dat staat bij de drukker). Thuis afdrukken: geen afloop.</p>`);
}
function renderPoster() {
  if (!Products.ui || !Products.ui.wizard) { if (typeof window.laadFout === "function") window.laadFout($("#v-poster"), "Poster"); return; } /* a script did not load */
  const S = psState, host = $("#v-poster"), { w, h } = psMaat(S), stappen = psStappen(S), nu = psStapNu(S), i = stappen.indexOf(nu);
  const href = id => T.prefix + psToken(id);
  const steps = psStapDefs(S).map(d => ({ id: d.id, title: d.label, question: d.question, summary: psSamenvatting(S, d.id), done: stappen.indexOf(d.id) < i, html: d.id === nu ? psStapHtml(S, d.id) : "" }));
  const pdf = `<button type="button" class="btn${nu === "ready" ? " primary" : ""}" id="psPrint" aria-label="Maak pdf om zelf te laten drukken">Maak pdf<span class="bk-lang">&nbsp;om zelf te laten drukken</span></button>`;
  const spec = {
    title: (Products.PAGE_WORDS && Products.PAGE_WORDS.poster || ["Poster"])[0],
    lede: "",
    steps, current: nu, href, more: nu === "ready" ? { label: "Meer keuzes", html: psMeer(S), open: psMeerOpen } : null,
    intro: mkVoorRegel({ start: S.kw, paar: S.paar, persoon: S.persoon, voor: S.voor }), voor: { start: S.kw, paar: S.paar, persoon: S.persoon, voor: S.voor },
    preview: `<div class="ps-kader" id="psKader" style="aspect-ratio:${w} / ${h};--ps-asp:${(w / h).toFixed(4)}"><div id="psVel"></div></div>`,
    actions: { status: `<span id="psDruk"></span>`, buttons: pdf, /* the line inside has role=status: one live region */
      /* de hulpzin, alleen op Klaar: op een groot scherm als regel onder de knop, op de telefoon achter een "?" zoals in het boek (de vaste balk is daar vol) */
      help: nu !== "ready" ? "" : `<details class="bk-hoe bk-hoe-pdf print-help-vraag"><summary aria-label="Hoe sla ik het op als pdf?">?</summary><div class="bk-hoe-t">${esc(Products.PRINT_HELP)}</div></details>` },
  };
  Products.ui.wizard(host, spec);
  psDrukKlaar(S.afloop); /* ook Ctrl+P (en een pdf zonder de knop) krijgt de maat van het vel */
  psVel(S, $("#psVel"));
  /* maten en afkortingen hangen af van de echte letter: zijn de fonts nog niet geladen, dan daarna opnieuw opmaken */
  const meld = () => { const d = $("#psDruk"), v = $("#psVel"); if (!d || !v) return; if (nu !== "ready") { d.innerHTML = ""; return; } /* the check belongs to Klaar */ d.innerHTML = Products.printLine(Products.checkElement(v), [], { bleed: psState.afloop > 0 }); };
  Products.loadPrintFonts().then(() => { if (route.view === "poster" && $("#psVel")) { psVel(psState, $("#psVel")); psSchaal(); meld(); } });
  psSchaal();
  if (psRO) psRO.disconnect();
  if ("ResizeObserver" in window) { psRO = new ResizeObserver(psSchaal); psRO.observe($("#psKader")); }
  /* the kinds as small real posters, one by one after the page stands */
  const minis = $$("[data-psmini], [data-mpmini]", host); let j = 0;
  const volgende = () => { if (route.view !== "poster" || j >= minis.length) return; const el = minis[j++], k = el.dataset.psmini, M = { start: S.kw, paar: S.paar };
    if (el.isConnected) { if (k === "kwartierstaat") mkVelMini(el, k, M); else el.innerHTML = mkMini(Products.products[k ? PS_KIND_PRODUCT[k] : el.dataset.mpmini], M) || ""; }
    (window.requestIdleCallback || setTimeout)(volgende); };
  (window.requestIdleCallback || setTimeout)(volgende);
  const meer = $(".pc-meer, [data-step=meer]", host); if (meer) meer.addEventListener("toggle", () => { psMeerOpen = meer.open; });
  $$("[data-ps]", host).forEach(b => b.onclick = () => {
    const k = b.dataset.ps, v = b.dataset.pv;
    if (k === "afloop") { S.afloop = +v; psDrukKlaar(S.afloop); $$('[data-ps="afloop"]', host).forEach(x => x.setAttribute("aria-pressed", String(+x.dataset.pv === S.afloop))); meld();
      history.replaceState(history.state, "", "#" + T.prefix + psToken());
      const bs = $(".ps-bestel", host); if (bs) { const open = bs.open; bs.outerHTML = psBestel(S); const nb = $(".ps-bestel", host); if (nb) nb.open = open; } /* the upload lines follow the bleed */
      return; } /* in the address, without drawing again */
    if (k === "gen") S.gen = +v === psGenBereik(S)[2] ? 0 : +v;
    else if (k === "namen") S.namen = v === "ja";
    else { S[k] = v; S.gen = 0; if (k === "soort") { if (v !== "kaart") S.namen = true; if (!psFormaten(S).some(f => f[0] === S.formaat)) S.formaat = psLeeg().formaat; } }
    go(psToken(), { replace: true, keepScroll: true });
    const n = $(`[data-ps="${k}"][data-pv="${v}"]`, host); if (n) n.focus();
  });
  $("#psPrint", host).onclick = () => { psDrukKlaar(psState.afloop); window.print(); };
  mkVoorBindStap(host); mkZetFocus({ start: S.kw, paar: S.paar, persoon: S.persoon, voor: S.voor });
}
let psMeerOpen = false;
/* afdrukken vanaf een andere pagina: dan geen postermaat; op de poster altijd de maat van het gekozen vel */
addEventListener("beforeprint", () => {
  if (route.view === "poster") psDrukKlaar(psState.afloop);
  else { document.documentElement.classList.remove("ps-print"); if (psPagina) psPagina.textContent = ""; }
});
RENDER.poster = renderPoster;
/* afdrukken: de maat van het vel (plus afloop) als @page, alleen voor deze pagina */
let psPagina = null;
function psDrukKlaar(af = 0) {
  const { w, h } = psMaat(psState);
  if (!psPagina) { psPagina = document.createElement("style"); document.head.appendChild(psPagina); }
  psPagina.textContent = `@page{size:${w + 2 * af}mm ${h + 2 * af}mm;margin:0}@media print{html.ps-print .ps-kader{padding:${af}mm}html.ps-print,html.ps-print body{height:${h + 2 * af}mm;overflow:hidden}}`; /* precies één vel: geen lege tweede pagina door afronding */
  document.documentElement.classList.add("ps-print");
}
addEventListener("beforeprint", () => { if (route.view === "poster") psDrukKlaar(psState.afloop); });
addEventListener("afterprint", () => { if (psState.afloop || !psPagina) return; psPagina.textContent = ""; document.documentElement.classList.remove("ps-print"); });
window.posterDruk = af => { psState.afloop = Math.max(0, +af || 0); psDrukKlaar(psState.afloop); const m = psMaat(psState); return { w: m.w, h: m.h, afloop: psState.afloop }; };

/* ---------- laten maken: a product from the engine (calendar, cards …) ---------- */
/* One page per kind of product (#kalender, later #kaarten), with the same wizard as the poster: Voor wie → Soort → Maat →
   Details → Klaar. Everything comes from the registry (products, formats, options, steps and their words) and the renderers;
   this section only draws the wizard and the preview: the pages as sheets on paper scale, one large, the others in a strip below.
   The pdf has one sheet per page, at the size of the product (plus bleed). Address: "kalender--soort-verjaardag--a3--vanaf-4--stap-3"
   (kind, then the product's own words from the engine, then the step). A page is only there when its renderers are loaded. */
/* the title of a page is its word in the registry (the tab, the menu and the hub say the same) */
const mpTitle = v => MP_PAGES[v] && MP_PAGES[v].title ? MP_PAGES[v].title : Products.PAGE_WORDS && Products.PAGE_WORDS[v] ? Products.PAGE_WORDS[v][0] : (Products.products[(MP_PAGES[v] || { kinds: [[0, ""]] }).kinds[0][1]] || { label: v }).label;
/* the pages of before the regrouping (Harrie): old links keep working */
const MP_OUD = { cadeaus: { "": "canvas", canvas: "canvas", puzzel: "kaarten--soort-puzzel", mok: "mok", tegel: "mok--soort-tegel" }, spellen: { "": "kaarten--soort-kwartet", kwartet: "kaarten--soort-kwartet", memory: "kaarten--soort-memory" } };
function mpOudNaarNieuw(token) {
  const parts = String(token).split("--"), oud = MP_OUD[parts[0]]; if (!oud) return token;
  const soort = (parts.find(x => /^soort-/.test(x)) || "").slice(6), rest = parts.slice(1).filter(x => !/^soort-/.test(x));
  return [oud[soort] || oud[""], ...rest].join("--");
}
const MP_PAGES = {
  kalender: { kinds: [["wand", "calendar-wall"], ["verjaardag", "calendar-birthday"]] },
  kaarten: { kinds: [["dorpen", "cards-places"], ["kwartet", "game-quartet"], ["memory", "game-memory"], ["puzzel", "puzzle-fan"]] },
  mok: { kinds: [["mok", "mug-fact"], ["tegel", "tile-fact"]] },
  canvas: { title: "Op canvas, aluminium of hout", kinds: [["canvas", "canvas-fan"], ["families", "canvas-families"]] }, /* under the tab "Aan de muur": the poster page links to it */
  invulboek: { title: "Mijn voorouders", kinds: [["invul", "book-kids"]] }, /* under the tab "Boeken" (a renderer, not the book core) */
};
const mpState = {};
/* the kinds of a page whose product exists (a product can come later than its page) */
const mpKinds = v => MP_PAGES[v].kinds.filter(([, id]) => Products.products[id]);
const mpPages = () => Object.keys(MP_PAGES).filter(v => mpKinds(v).some(([, id]) => Products.products[id] && Products.renderers[Products.products[id].renderer]));
const mpProduct = (v, S) => Products.products[(mpKinds(v).find(k => k[0] === S.kind) || mpKinds(v)[0])[1]];
const mpSteps = (v, S) => Products.stepsOf(mpProduct(v, S));
function mpEmpty(v) { const kind = mpKinds(v)[0][0]; return { kind, opts: Products.defaults(Products.products[mpKinds(v)[0][1]]), stap: "", blad: 0 }; }
function mpFromToken(v, t) {
  const parts = String(t).split("--").slice(1), S = mpEmpty(v); let stap = 0;
  const rest = parts.filter(x => { let m;
    if (x === "persoon") { S.persoon = true; return false; }
    if (/^voor-./.test(x)) { (S.voor = S.voor || []).push(x.slice(5)); return false; }
    if ((m = x.match(/^soort-([\w-]+)$/)) && mpKinds(v).some(k => k[0] === m[1])) { S.kind = m[1]; return false; }
    if ((m = x.match(/^stap-(\d)$/))) { stap = +m[1]; return false; }
    return true; });
  S.opts = Products.parseToken(mpProduct(v, S).id, rest.join("--"));
  { const bl = mpBleeds(mpProduct(v, S), S); if (!bl.includes(S.opts.bleed || 0)) S.opts.bleed = bl[0] || 0; } /* a size without bleed (the booklet): none, so the address is right too */
  const st = mpSteps(v, S).map(s => s.id), onlyStart = parts.length && parts.every(x => /^(vanaf-|persoon$|voor-)/.test(x));
  const kindToo = parts.length && parts.every(x => /^(vanaf-|persoon$|voor-|soort-)/.test(x)) && st[0] === "kind";
  S.stap = stap ? (st[stap - 1] || "") : !parts.length || onlyStart ? st[0] : kindToo ? st[1] : ""; /* the family from the header: the first step; the kind known too: the step after it */
  if (S.stap === st[st.length - 1]) S.stap = "";
  S.blad = 0; mpState[v] = S;
}
function mpToken(v, stap) {
  const S = mpState[v] || mpEmpty(v), p = [v], st = mpSteps(v, S).map(s => s.id), at = stap === undefined ? S.stap : stap;
  if (S.kind !== mpKinds(v)[0][0]) p.push("soort-" + S.kind);
  const own = Products.toToken(mpProduct(v, S).id, S.opts); if (own) p.push(own);
  if ((S.voor || []).length) S.voor.forEach(x => p.push("voor-" + x)); else if (S.persoon) p.push("persoon");
  const n = st.indexOf(at && st.includes(at) ? at : st[st.length - 1]) + 1;
  if (n < st.length || p.slice(1).every(x => /^(vanaf-|persoon$|voor-|soort-)/.test(x))) p.push("stap-" + n); /* as psToken: "Klaar" keeps its step when the address would otherwise open an earlier one */
  return p.join("--");
}
/* an svg shown more than once (the large sheet, its thumbnail, the hub) needs its own ids, or a clipPath points at the first copy */
const svgUniq = (svg, pre) => svg.replace(/\bid="([^"]+)"/g, `id="${pre}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${pre}$1)`).replace(/href="#([^"]+)"/g, `href="#${pre}$1"`);
const mpBladNaam = (pg, n) => pg.name ? pg.name.charAt(0).toUpperCase() + pg.name.slice(1) : "Blad " + (n + 1);
const mpStart = S => S.opts.start || { kw: 1, pair: false };
function mpDoc(v, S, product = mpProduct(v, S), opts = S.opts) {
  const o = Object.assign({}, opts, mkTitles(opts.start || { kw: 1, pair: false }, S.persoon, S.voor)); /* with the real bleed: the renderers draw it into the sheet */
  /* the chosen children ("Voor Andre", "Voor Marit en Jorn"), for a renderer that names them (the middle of a fan, the cover of the fill-in book) */
  const pers = (S.voor || []).length ? S.voor.map(v => v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " ")) : typeof FK !== "undefined" && FK && T.focus && T.focus.persons ? T.focus.persons : null;
  if (pers && pers.length) o.persons = pers;
  return Products.makeDocument(product.id, Products.site.treeData(T.key), o, Products.makePlatform(), { palette: Products.PRINT_PALETTE });
}
/* the titles of a start, the same as the book (Harrie): a couple or the whole tree is a family ("De familie De Groot · Boersma",
   with years or generations below), unless it was chosen as a person ("--persoon": "De voorouders van …"). A family also gives
   its surnames as the brand and for the map; a renderer that does not read an option ignores it */
/* with the family focus (FK) a product starts at the root of the focus tree: a couple is kw 2–3 there (with the chosen children),
   one person other than the three trees is titled as a person */
function fkStart(st) {
  const f = typeof FK !== "undefined" && FK && T.focus, kw = st ? st.kw ?? st.start : 0; if (!f || !st || kw !== 1 || st.pair || st.paar) return null;
  return f.pair ? { kw: 2, pair: true, persoon: false, voor: (f.persons || []).map(n => String(n).toLowerCase().replace(/[^a-z0-9]+/g, "_")) } : { kw: 1, pair: false, persoon: true, voor: [] };
}
function mkTitles(st, persoon, voor) {
  if (!st || typeof bkCore !== "function") return {};
  const fs = fkStart(st); if (fs) { st = { kw: fs.kw, pair: fs.pair }; persoon = fs.persoon; voor = fs.voor; }
  try { const C = bkCore(), B = C.options(C.parse("boek" + mkStartTok({ start: st.kw, paar: st.pair, persoon, voor }))); if (!B || !B.titel) return {};
    const fam = /^De familie\s+/.test(B.titel) ? B.titel.replace(/^De familie\s+/, "") : "";
    /* the book's subtitle counts the book's generations; a poster or a calendar counts its own, so only the years go along */
    const sub = String(B.ondertitel || "").replace(/(^|\s·\s)\d+ generaties(?=\s·\s|$)/, "").replace(/^\s·\s/, "").trim();
    return Object.assign({ title: B.titel, subtitle: sub }, fam ? { brand: fam, family: fam } : {}); } catch (e) { return {}; }
}
/* the words for a choice in the summary line */
function mpSummary(v, S, id, doc) {
  const p = mpProduct(v, S), st = mpStart(S);
  if (id === "which") { const k = voorWieWaarde(T.key, st.kw, st.pair), L = voorWieOpties(), x = [...L.heel, ...L.tak].find(o => o.v === k); return x ? x.label : Products.startName(Products.site.treeData(T.key), st); }
  if (id === "kind") return p.label;
  if (id === "size") { const f = Products.formatOf(p, S.opts.format || p.formats[0]); return f ? (/cm$/.test(f.label) ? f.label : `${f.label} · ${psCm(f.w)} × ${psCm(f.h)} cm`) : ""; }
  if (id !== "ready") return (mpLookOptions(v, S, id)).map(o => { const val = doc.options[o.id];
    if (o.type === "person") { const q = Products.site.treeData(T.key).people.find(x => x.kw === val); return q ? q.n : ""; }
    if (o.type === "list") { const c = (o.choices || []).find(([k]) => String(k) === String(val)); return c ? `${c[1]} ${o.label.toLowerCase()}` : ""; }
    return o.type === "boolean" ? (val ? o.label : "Zonder " + o.label.toLowerCase()) : String(val) + (o.type !== "year" && (S.opts[o.id] === "advice" || S.opts[o.id] == null) ? " (advies)" : ""); }).join(" · ");
  return "";
}
const mpLookOptions = (v, S, step = "look") => { const p = mpProduct(v, S), d = mpSteps(v, S).find(s => s.id === step); return d ? p.options.filter(o => (d.options || []).includes(o.id)) : []; };
/* "Wie" (a mug, a tile): the person the renderer advises first, then a few others with years and an occupation or a fact, and a search */
function mpWieKandidaten(v, S, doc) {
  const d = Products.site.treeData(T.key), st = mpStart(S), mem = Products.startMembers(d, st), feit = new Set((d.facts || []).map(f => f.kw));
  const ok = q => q && !q.living && mem.has(q.kw) && /\d{4}/.test(q.b || "") && /\d{4}/.test(q.d || "") && (q.occ || feit.has(q.kw));
  const adv = doc.options.person, by = new Map(d.people.map(q => [q.kw, q]));
  const lijst = [...(by.get(adv) ? [by.get(adv)] : []), ...d.people.filter(q => ok(q) && q.kw !== adv).sort((a, b) => a.kw - b.kw)].slice(0, 8);
  return { lijst, adv };
}
function mpStepHtml(v, S, id, doc) {
  const p = mpProduct(v, S), st = mpStart(S), chip = (opt, val, label, on) => `<button type="button" class="chip" data-mp="${esc(opt)}" data-mv="${esc(val)}" aria-pressed="${on}">${esc(label)}</button>`;
  if (id === "which") return mkVoorStap({ start: st.kw, paar: st.pair, persoon: S.persoon, voor: S.voor });
  if (id === "kind") return `<div class="ps-keuzes">${mpKinds(v).map(([k, pid]) => { const q = Products.products[pid];
    return `<button type="button" class="ps-keuze" data-mp="kind" data-mv="${k}" aria-pressed="${S.kind === k}"><span class="mk-mini" data-mpmini="${pid}" aria-hidden="true"></span><b>${esc(q.label)}</b><small>${esc(q.promise || q.intro)}</small></button>`; }).join("")}</div>`;
  if (id === "size") { const fs = p.formats.map(f => Products.formatOf(p, f)).filter(Boolean), max = Math.max(...fs.map(f => Math.max(f.w, f.h))), cur = S.opts.format || p.formats[0];
    return `<div class="ps-keuzes ps-maten">${fs.map(f => { const k = 64 / max, bw = Math.max(3, f.w * k), bh = Math.max(3, f.h * k);
      return `<button type="button" class="ps-keuze ps-maat" data-mp="format" data-mv="${f.id}" aria-pressed="${cur === f.id}"><svg viewBox="0 0 70 70" aria-hidden="true"><rect x="${(35 - bw / 2).toFixed(1)}" y="${(67 - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="0.6"/></svg><b>${esc(f.label)}</b>${/cm$/.test(f.label) ? "" : `<small>${psCm(f.w)} × ${psCm(f.h)} cm</small>`}</button>`; }).join("")}</div>`; }
  if (id !== "ready") return mpLookOptions(v, S, id).map(o => {
    const val = doc.options[o.id], adv = doc.options.advice && doc.options.advice[o.id];
    if (o.type === "person") { const { lijst } = mpWieKandidaten(v, S, doc), yrs = q => [String(q.b || "").match(/\d{4}/), String(q.d || "").match(/\d{4}/)].map(m => m ? m[0] : "").join("–");
      return `<div class="ps-keuzes mp-wie">${lijst.map(q => `<button type="button" class="ps-keuze" data-mp="person" data-mv="${q.kw}" aria-pressed="${q.kw === val}"><b>${esc(q.n)}</b><small>${esc([yrs(q), String(q.occ || "").split(";")[0]].filter(Boolean).join(" · "))}${q.kw === adv ? " · advies" : ""}</small></button>`).join("")}</div>
        <div class="mp-wie-zoek">${vwPick("mpWie", "Iemand anders", null, "Naam of kwartiernummer")}</div>`; }
    if (o.type === "year") { const y = new Date().getFullYear(); return `<div class="chips" role="group" aria-label="${esc(o.label)}">${[y, y + 1, y + 2].map(n => chip(o.id, n, n + (n === adv ? (n === y + 1 ? " (volgend jaar)" : " (advies)") : ""), n === val)).join("")}</div>`; }
    if (o.type === "number") return `<div class="chips" role="group" aria-label="${esc(o.label)}">${Array.from({ length: o.max - o.min + 1 }, (_, i) => o.min + i).map(n => chip(o.id, n, n + (n === adv ? " (advies)" : ""), n === val)).join("")}</div>`;
    if (o.type === "boolean") return `<div class="chips" role="group" aria-label="${esc(o.label)}">${chip(o.id, "ja", "Met " + o.label.toLowerCase(), !!val)}${chip(o.id, "nee", "Zonder " + o.label.toLowerCase(), !val)}</div>`;
    if (o.type === "list") return `<div class="chips" role="group" aria-label="${esc(o.label)}">${(o.choices || []).map(([k, l]) => chip(o.id, k, l, String(val) === String(k))).join("")}</div>`;
    return ""; }).join("");
  if (id === "ready") return mpPngKnoppen(p, S, doc) + (p.note ? `<p class="bk-uitleg">${esc(p.note)}</p>` : "") + (mpBestel(p, S.opts.bleed || 0) || (p.note ? " " : "")
    || (p.layout === "cards" ? `<p class="bk-uitleg">Zelf afdrukken: maak de pdf, druk hem af op stevig papier en knip langs de snijlijnen.</p>` : `<p class="bk-uitleg">Zelf afdrukken: maak de pdf en druk hem af.</p>`)); /* no printer known (yet) */
  return "";
}
/* a producer that wants images instead of a pdf (Kaartje2go): a button that makes them, packed in one zip */
/* the image size: the printer's (px), else the product's own (png { w, h }, or png { dpi } over the size in mm) */
const mpPx = (p, d, S) => d.px || (p.png && p.png.w ? [p.png.w, p.png.h] : p.png && p.png.dpi ? (f => f ? [Math.round(f.w / 25.4 * p.png.dpi), Math.round(f.h / 25.4 * p.png.dpi)] : null)(Products.formatOf(p, (S && S.opts.format) || p.formats[0])) : null);
const mpPngDrukkers = (p, S) => { if (typeof Products.exportPng !== "function") return [];
  const ds = p.producers.map(id => Products.producers[id]).filter(d => d && (d.file === "png" || d.file === "jpg") && mpPx(p, d, S));
  /* a product with a png of its own (canvas) but no printer that asks for one: the image anyway, at the product's size */
  return ds.length || !(p.output || []).includes("png") || !mpPx(p, {}, S) ? ds : [{ id: "png", label: "een drukker", file: "png", bleed: 0 }]; };
const mpPngKnoppen = (p, S, doc) => mpPngDrukkers(p, S).slice(0, 1).map(d => { const een = doc ? (doc.pages || []).length === 1 : p.layout !== "cards", px = mpPx(p, d, S), per = p.layout === "cards" ? "kaart" : "blad";
  return `<p class="mp-png"><button type="button" class="btn primary" data-mppng="${esc(d.id)}">${een ? "Maak de " + esc(d.file) : "Maak plaatjes"}</button> <span class="bk-uitleg" data-mppng-status="${esc(d.id)}" aria-live="polite">${een ? `Eén ${esc(d.file)} van ${px[0]} × ${px[1]} pixels, op de maat die ${esc(d.label)} vraagt.` : `Eén ${esc(d.file)} per ${per}${d.pages ? " (" + esc(d.pages) + ")" : ""}, samen in één zip-bestand${d.format ? `, op ${esc(Products.formats[d.format] ? Products.formats[d.format].label : d.format)}` : ""}, voor een drukker die per ${per} een plaatje vraagt.`}</span></p>`; }).join(""); /* a local file may not read the images */
async function mpMaakPng(v, S, d, status) {
  const p = mpProduct(v, S), doc = mpDoc(v, S, p, Object.assign({}, S.opts, { bleed: d.bleed || 0 }, d.format ? { format: d.format } : {})); /* the printer's own size */
  const pages = (doc.pages || []).filter(pg => !d.pages || new RegExp(d.pages + "$").test(pg.name || ""));
  const jpg = d.file === "jpg", files = await Products.exportPng(Object.assign({}, doc, { pages }), { px: mpPx(p, d, S), prefix: "kaart", type: jpg ? "image/jpeg" : "image/png", quality: d.quality || 0.92, name: (pg, i) => `${p.layout === "cards" ? "kaart" : "blad"}-${String(i + 1).padStart(2, "0")}-${(pg.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.${jpg ? "jpg" : "png"}`,
    onProgress: (i, n) => { status.textContent = `Plaatje ${i} van ${n}…`; } });
  const naam = String(p.short || p.id).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + (T.key === "h" ? "" : "-" + T.key.replace(/[^a-z0-9]+/gi, "-"));
  if (files.length === 1) { Products.saveBlob(files[0].blob, `${naam}.${jpg ? "jpg" : "png"}`); status.textContent = "Opgeslagen."; return; } /* one sheet: the file itself */
  status.textContent = "Inpakken…";
  Products.saveBlob(await Products.zip(files), `${naam}.zip`);
  const mis = files.missingImages || 0;
  status.textContent = `${files.length} plaatjes opgeslagen in één zip-bestand.` + (mis ? ` ${mis === 1 ? "Eén foto kon" : mis + " foto’s konden"} niet mee; die kaders zijn leeg.` : "");
}
/* a length in mm as a visitor reads it: 3.175 → "3,175" */
function mmNl(v) { return Number(v).toLocaleString("nl-NL", { maximumFractionDigits: 3 }); }
/* "Zo bestel je": per producer of the product the name, a price line for this product (if known) and the steps */
/* "Zo bestel je": the printers of the product, equal and without prices (Harrie: ordering may later go through the site itself);
   per printer what you upload and how, and a link. One block, so a later "Bestellen" can replace it. */
function mpBestel(p, cur, o = {}) { /* cur: the bleed chosen now (mm), so the line can say whether it matches; o: { voor (html before the printers), afloopZin(order, producer) (the sentence when the choice does not fit this printer, or ""; the book compares its printer step) } */
  if (!p || !p.producers.length) return "";
  const upload = d => { const r0 = Products.producers[d.id] || {}, r = Object.assign({}, r0, { bleed: p.bleed.includes(r0.bleed) ? r0.bleed : p.bleed[p.bleed.length - 1] || 0 }), f = r.format && Products.formats[r.format]; /* the bleed the product really has */
    return (r.file === "jpg" || r.file === "png") && p.layout === "cards" ? `Upload: één ${r.file} per kaart${f ? ", " + f.label : ""}, met ${mmNl(r.bleed || 0)} mm afloop (de knop "Maak plaatjes").`
      : r.file === "jpg" || r.file === "png" ? `Upload: de ${r.file} (de knop "Maak de ${r.file}").`
      : !(p.output || ["pdf"]).includes("pdf") ? `Upload: de png (de knop "Maak de png").`
      : `Upload: de pdf${r.bleed ? `, met ${mmNl(r.bleed)} mm afloop` : ""} (de knop "Maak pdf")${o.afloopZin ? o.afloopZin(d, r) : r.bleed && cur !== undefined && cur !== r.bleed && p.bleed.length > 1 ? `. Zet daarvoor onder "Meer keuzes" de afloop op ${mmNl(r.bleed)} mm` : ""}.`; };
  return `<details class="ps-bestel"><summary>Zo bestel je</summary><p class="bk-uitleg">Bij elke drukker die zelf een bestand aanneemt. Een paar voorbeelden:</p>${o.voor || ""}${p.producers.map(id => Products.orderFor(id, p.id)).filter(Boolean).map(d =>
    `<div class="ps-bestel-p"><h3><a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.label)}</a></h3><p class="small">${esc(upload(d))}</p><ol>${d.steps.map(t => `<li>${esc(t)}</li>`).join("")}</ol>${(d.notes || []).filter(Boolean).map(t => `<p class="small ps-bestel-noot">${esc(t)}</p>`).join("")}</div>`).join("")}</details>`;
}
/* the bleeds a size allows: a format may have its own (the A4 booklet: none, or it no longer fits on A4) */
const mpBleeds = (p, S) => (Products.formatOf(p, S.opts.format || p.formats[0]) || {}).bleed || p.bleed;
function mpMeer(S, p) {
  const rij = (id, label, inner) => `<div class="op-f" role="group" aria-labelledby="mpL-${id}"><span class="op-l" id="mpL-${id}">${esc(label)}</span><div>${inner}</div></div>`;
  const chip = (k, v, l, on) => `<button type="button" class="chip" data-mp="${esc(k)}" data-mv="${esc(v)}" aria-pressed="${on}">${esc(l)}</button>`;
  /* yes/no choices of the product that belong to the last step (the calendar: "Ook gedenkdagen") */
  const keuzes = p.options.filter(o => o.step === "ready" && o.type === "boolean").map(o => rij(o.id, o.label,
    `<div class="chips">${chip(o.id, "nee", "Nee", !S.opts[o.id])}${chip(o.id, "ja", "Ja", !!S.opts[o.id])}</div>${o.id === "memorials" ? `<p class="bk-uitleg">Ook de kinderen die levenloos geboren werden, op hun dag, met een klein rondje (°) in plaats van * of †.</p>` : ""}`)).join("");
  const bl = mpBleeds(p, S), afloop = bl.length < 2 ? "" : rij("afloop", "Voor de drukker", `<div class="chips">${bl.map(b => chip("bleed", b, b ? mmNl(b) + " mm afloop" : "Geen afloop", (S.opts.bleed || 0) === b)).join("")}</div><p class="bk-uitleg">Een drukker snijdt na het drukken een smalle rand van het papier (${bl.filter(Boolean).map(mmNl).join(" of ")} mm, dat staat bij de drukker). Thuis afdrukken: geen afloop.</p>`);
  return keuzes + afloop;
}
function mpRender(v) {
  if (!Products.ui || !Products.ui.wizard) { if (typeof window.laadFout === "function") window.laadFout($("#v-" + v), mpTitle(v)); return; } /* a script did not load */
  const S = mpState[v] || (mpState[v] = mpEmpty(v)), host = $("#v-" + v), p = mpProduct(v, S), defs = mpSteps(v, S), ids = defs.map(d => d.id);
  { const bl = mpBleeds(p, S); if (!bl.includes(S.opts.bleed || 0)) S.opts.bleed = bl[0] || 0; } /* a size without bleed: none (a size chosen on the page) */
  const nu = S.stap && ids.includes(S.stap) ? S.stap : ids[ids.length - 1], i = ids.indexOf(nu);
  let doc; try { doc = mpDoc(v, S); } catch (e) { host.innerHTML = `<h1 class="page-title">${esc(mpTitle(v))}</h1><p class="bk-uitleg">Dit kan nu niet worden gemaakt.</p>`; return; }
  const pages = doc.pages || [], b = doc.page.bleed || 0, w = doc.page.w + 2 * b, h = doc.page.h + 2 * b; S.blad = Math.min(S.blad, Math.max(0, pages.length - 1));
  const steps = defs.map(d => ({ id: d.id, title: d.label, question: d.question, summary: mpSummary(v, S, d.id, doc), done: ids.indexOf(d.id) < i, html: d.id === nu ? mpStepHtml(v, S, d.id, doc) : "" }));
  /* "Zo ziet het eruit": the real pages in a scene (on the wall, a mug, a tile, a puzzle, a hand of cards), next to the flat preview */
  let mock = null; try { mock = typeof Products.mockup === "function" ? Products.mockup(doc, p) : null; } catch (e) { mock = null; }
  const echt = !!(mock && mpZicht[v] === "echt");
  const zicht = mock ? `<div class="chips mp-zicht" role="group" aria-label="Voorbeeld">${[["plat", "Plat"], ["echt", "Zo ziet het eruit"]].map(([k, l]) => `<button type="button" class="chip" data-mpzicht="${k}" aria-pressed="${(k === "echt") === echt}">${l}</button>`).join("")}</div>` : "";
  const mockHtml = mock ? `<div class="mp-mock"${echt ? "" : " hidden"} role="img" aria-label="${esc("Zo ziet het eruit: " + p.label)}">${mock.svg.replace(/^<svg\b/, '<svg aria-hidden="true"')}</div>` : "";
  const strook = pages.length > 1 ? `<div class="mp-strook" role="group" aria-label="Alle bladen">${pages.map((pg, n) => `<button type="button" class="mp-duim" data-mpblad="${n}" aria-pressed="${n === S.blad}" aria-label="${esc(mpBladNaam(pg, n))}"><span class="mp-duim-vel" style="aspect-ratio:${w} / ${h}">${svgUniq(pg.svg, `${v}-t${n}-`).replace(/^<svg([^>]*)\swidth="[^"]*"\sheight="[^"]*"/, '<svg$1 aria-hidden="true"')}</span><small>${esc(mpBladNaam(pg, n))}</small></button>`).join("")}</div>` : "";
  const spec = { title: mpTitle(v), lede: "", steps, current: nu, href: id => T.prefix + mpToken(v, id),
    intro: mkVoorRegel({ start: mpStart(S).kw, paar: mpStart(S).pair, persoon: S.persoon, voor: S.voor }), voor: { start: mpStart(S).kw, paar: mpStart(S).pair, persoon: S.persoon, voor: S.voor },
    more: nu === ids[ids.length - 1] && mpMeer(S, p) ? { label: "Meer keuzes", html: mpMeer(S, p), open: mpMeerOpen } : null,
    /* a source that does not fit on the product itself (a tile) stands under the preview */
    preview: zicht + mockHtml + `<div class="ps-kader mp-kader"${echt ? " hidden" : ""} style="aspect-ratio:${w} / ${h};--ps-asp:${(w / h).toFixed(4)}"><div class="mp-vel" style="width:${w}mm;height:${h}mm">${pages.map((pg, n) => `<div class="mp-blad${n === S.blad ? " nu" : ""}" style="width:${w}mm;height:${h}mm" role="img" aria-label="${esc(mpBladNaam(pg, n))}, blad ${n + 1} van ${pages.length}"${n === S.blad ? "" : ' aria-hidden="true"'}>${svgUniq(pg.svg, `${v}-`)}</div>`).join("")}</div></div>${echt ? "" : strook}${doc.stats && doc.stats.source ? `<p class="small mp-bron">Bron: ${esc(String(doc.stats.source).replace(/^Bron:\s*/i, ""))}</p>` : ""}`,
    actions: { status: `<span class="mp-druk"></span>`,
      /* "Maak pdf" only for a product that has a pdf (a puzzle, a mug and a tile are an image) */
      buttons: (p.output || ["pdf"]).includes("pdf") ? `<button type="button" class="btn${i === ids.length - 1 && !mpPngDrukkers(p, S).length ? " primary" : ""}" data-mp-print aria-label="Maak pdf om zelf te laten drukken">Maak pdf<span class="bk-lang">&nbsp;om zelf te laten drukken</span></button>` : "",
      help: i !== ids.length - 1 || !(p.output || ["pdf"]).includes("pdf") ? "" : `<details class="bk-hoe bk-hoe-pdf print-help-vraag"><summary aria-label="Hoe sla ik het op als pdf?">?</summary><div class="bk-hoe-t">${esc(Products.PRINT_HELP)}</div></details>` } }; /* the help line only on Klaar */
  Products.ui.wizard(host, spec);
  mpDrukKlaar(v);
  const meld = () => { const d = $(".mp-druk", host), el = $(".mp-vel", host); if (!d || !el) return; if (i !== ids.length - 1) { d.innerHTML = ""; return; } /* the check belongs to Klaar */
    const data = Products.filterPrivacy(Products.site.treeData(T.key), p.privacy);
    d.innerHTML = Products.printLine(Products.checkElement(el), Products.checkDocument(doc, Object.assign({}, data, { profile: p.privacy })).issues, { bleed: (S.opts.bleed || 0) > 0 }); };
  const schaal = () => { const k = $(".mp-kader", host), el = $(".mp-vel", host); if (k && el) el.style.transform = `scale(${k.clientWidth / (w * 96 / 25.4)})`; };
  /* text is measured in the real letter: the first time, draw again once the print fonts are there */
  schaal(); Products.loadPrintFonts().then(() => { if (route.view !== v) return; if (!mpFontsKlaar) { mpFontsKlaar = true; mpRender(v); } else { schaal(); meld(); } });
  if (mpRO) mpRO.disconnect(); if ("ResizeObserver" in window) { mpRO = new ResizeObserver(schaal); mpRO.observe($(".mp-kader", host)); }
  const minis = $$("[data-mpmini]", host); let j = 0;
  const volgende = () => { if (route.view !== v || j >= minis.length) return; const el = minis[j++]; if (el.isConnected) el.innerHTML = mkMini(Products.products[el.dataset.mpmini], { start: mpStart(S).kw, paar: mpStart(S).pair }) || "";
    (window.requestIdleCallback || setTimeout)(volgende); };
  (window.requestIdleCallback || setTimeout)(volgende);
  const meer = $(".pw-meer", host); if (meer) meer.addEventListener("toggle", () => { mpMeerOpen = meer.open; });
  $$("[data-mpblad]", host).forEach(b => b.onclick = () => { S.blad = +b.dataset.mpblad;
    $$(".mp-blad", host).forEach((x, n) => { x.classList.toggle("nu", n === S.blad); if (n === S.blad) x.removeAttribute("aria-hidden"); else x.setAttribute("aria-hidden", "true"); }); $$("[data-mpblad]", host).forEach(x => x.setAttribute("aria-pressed", String(+x.dataset.mpblad === S.blad))); meld(); });
  $$("[data-mp]", host).forEach(b => b.onclick = () => {
    const k = b.dataset.mp, val = b.dataset.mv;
    if (k === "kind") { const start = S.opts.start; S.kind = val; S.opts = Object.assign(Products.defaults(mpProduct(v, S)), { start }); S.blad = 0; }
    else if (k === "bleed") S.opts.bleed = +val; /* drawn into the sheet: draw again */
    else if (k === "format") S.opts.format = val;
    else { const o = p.options.find(x => x.id === k); S.opts[k] = o && o.type === "list" ? val : o && o.type === "boolean" ? val === "ja" : (doc.options.advice && String(doc.options.advice[k]) === val ? "advice" : +val); }
    go(mpToken(v), { replace: true, keepScroll: true });
    const n = $(`[data-mp="${k}"][data-mv="${val}"]`, host); if (n) n.focus();
  });
  $$("[data-mpzicht]", host).forEach(b => b.onclick = () => { mpZicht[v] = b.dataset.mpzicht; mpRender(v); const n = $(`[data-mpzicht="${b.dataset.mpzicht}"]`, host); if (n) n.focus(); });
  const pdfKnop = $("[data-mp-print]", host); if (pdfKnop) pdfKnop.onclick = () => { mpDrukKlaar(v); window.print(); };
  if ($("#mpWie", host)) vwBind("mpWie", true, kw => { if (!kw) return; S.opts.person = kw; go(mpToken(v), { replace: true, keepScroll: true }); }); /* "Iemand anders" for a mug or a tile */
  $$("[data-mppng]", host).forEach(b => b.onclick = () => { const d = mpPngDrukkers(p, S).find(x => x.id === b.dataset.mppng), st = $(`[data-mppng-status="${d.id}"]`, host);
    b.disabled = true; mpMaakPng(v, S, d, st).catch(() => { st.textContent = "Dat lukte niet. Probeer het opnieuw, of gebruik de pdf."; }).finally(() => { b.disabled = false; }); });
  mkVoorBindStap(host); mkZetFocus({ start: mpStart(S).kw, paar: mpStart(S).pair, persoon: S.persoon, voor: S.voor });
}
const mpZicht = {}; /* per page: "plat" or "echt" (the mockup), kept while you go through the steps */
let mpMeerOpen = false, mpRO = null, mpPagina = null, mpFontsKlaar = false;
/* print: every page one sheet at the size of the product (plus bleed), only on this page */
function mpDrukKlaar(v) {
  const S = mpState[v]; if (!S) return; const p = mpProduct(v, S), pg = Products.pageOf(p, S.opts), af = pg.bleed || 0; /* the sheet already holds the bleed */
  if (!mpPagina) { mpPagina = document.createElement("style"); document.head.appendChild(mpPagina); }
  const n = Math.max(1, $$(".mp-blad", $("#v-" + v)).length); /* the height of exactly n sheets: no empty sheet at the end through rounding */
  mpPagina.textContent = `@page{size:${pg.w + 2 * af}mm ${pg.h + 2 * af}mm;margin:0}@media print{html.mp-print .mp-blad{width:${pg.w + 2 * af}mm!important;height:${pg.h + 2 * af}mm!important;overflow:hidden}html.mp-print .mp-vel{width:auto!important;height:auto!important}html.mp-print,html.mp-print body{height:${n * (pg.h + 2 * af)}mm;overflow:hidden}}`;
  document.documentElement.classList.add("mp-print");
}
addEventListener("beforeprint", () => { if (MP_PAGES[route.view]) mpDrukKlaar(route.view); else { document.documentElement.classList.remove("mp-print"); if (mpPagina) mpPagina.textContent = ""; } });
mpPages().forEach(v => {
  VIEWS.push(v); /* the menu and the tab row take the page from the registry (Products.pages) */
  const tab = (Products.products[MP_PAGES[v].kinds[0][1]] || {}).tab; if (tab && tab !== v) NAV_OF[v] = tab; /* canvas: the tab "Aan de muur" */
  const sec = document.createElement("section"); sec.className = "view mp-view"; sec.id = "v-" + v; sec.hidden = true; $("main").appendChild(sec);
  RENDER[v] = () => mpRender(v);
});
const mpRoute = token => { token = mpOudNaarNieuw(token); const v = String(token).split("--")[0]; if (!MP_PAGES[v] || !VIEWS.includes(v)) return null; mpFromToken(v, token); rendered[v] = false; return [v, mpToken(v)]; };

/* ---------- section guide ---------- */
/* On the first page of every menu group: a quiet block with the other pages of that group (icon, name, the MENU description).
   On the other pages of the group: one line "Ook in <groep>: …" at the bottom. Everything comes from menuGroups(), so new tabs
   appear automatically, while hidden routes and tabs of another tree do not. Placed by an observer on main, so no page has to do
   anything; a page with its own guide ([data-own-guide], or the older [data-eigen-wegwijzer]) does not get the block twice. */
function sectionGuide(group, current, o = {}) {
  const g = menuGroups().find(([n]) => n === group); if (!g) return "";
  const items = g[1].filter(([, v]) => v !== current); if (!items.length) return "";
  const desc = o.desc || o.uitleg || {}; /* "uitleg": the earlier option name, still used by the Bronnen page */
  if (o.small || o.klein) return `<p class="section-guide-line"><span>Ook in ${esc(group)}:</span> ${items.map(([l, v]) => `<a class="ov-link" href="${mnHref(v)}" data-go="${v}">${esc(l)}</a>`).join('<span aria-hidden="true"> \u00b7 </span>')}</p>`;
  return `<nav class="section-guide" aria-label="Ook in ${esc(group)}"><p class="section-guide-head">Ook in ${esc(group)}</p><div class="section-guide-grid">${items.map(([l, v, u]) =>
    `<a class="section-guide-item" href="${mnHref(v)}" data-go="${v}">${navIco(v)}<span><b>${esc(l)}</b>${desc[v] || u ? `<small>${esc(desc[v] || u)}</small>` : ""}</span></a>`).join("")}</div></nav>`;
}
function placeSectionGuide() {
  const v = $$("main > .view").find(x => !x.hidden); if (!v || route.sub) return;
  const group = groupOf(route.view); if (!group || group === "Overzicht") return;
  const items = (menuGroups().find(([n]) => n === group) || [, []])[1]; if (items.length < 2) return;
  const first = items[0][1] === route.view, kind = first ? "section-guide" : "section-guide-line";
  const present = $(":scope > ." + kind, v); if (present && present.dataset.for === T.key + route.view) return; /* already there for this tree and page */
  $$(":scope > .section-guide, :scope > .section-guide-line", v).forEach(x => x.remove());
  if (first && $("[data-own-guide], [data-eigen-wegwijzer], .bron-weg", v)) return;
  const html = sectionGuide(group, route.view, { small: !first }); if (!html) return;
  if (first) { const after = $(":scope > .lede", v) || $(":scope > h1", v); after ? after.insertAdjacentHTML("afterend", html) : v.insertAdjacentHTML("afterbegin", html); }
  else v.insertAdjacentHTML("beforeend", html);
  const added = $(":scope > ." + kind, v); if (added) added.dataset.for = T.key + route.view;
}
let sectionGuideFrame = 0;
new MutationObserver(() => { cancelAnimationFrame(sectionGuideFrame); sectionGuideFrame = requestAnimationFrame(() => { try { placeSectionGuide(); } catch (e) { } }); })
  .observe($("main"), { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });

/* ---------- laten maken: brug naar de productmotor ---------- */
/* De productmotor (src/products/, window.Products) weet niets van deze app. Products.site geeft hem de gegevens van één boom als
   gewone objecten, al gefilterd zoals de site ze toont: van levenden alleen kw, n, roep en living. Alleen-lezen; de motor filtert
   per product verder (privacyprofielen in src/products/data.js). */
if (typeof Products !== "undefined") {
  const siteTreeCache = {};
  const siteTreeData = k => {
    const key = TREES[k] ? k : "h";
    if (siteTreeCache[key]) return siteTreeCache[key];
    const t = TREES[key], pre = key === "a" ? "a-" : "", keep = ["kw", "n", "roep", "living"];
    const lineOfKw = kw => kw < 4 ? null : kw < 8 ? ({ 4: 8, 5: 10, 6: 12, 7: 14 })[kw] : kw >> (gen(kw) - 4);
    const people = t.PEOPLE.filter(p => !p.alias).map(p => p.living ? Object.fromEntries(keep.filter(f => p[f] !== undefined).map(f => [f, p[f]])) : Object.assign({}, p, { line: lineOfKw(p.kw) }));
    const aliases = Object.fromEntries(t.PEOPLE.filter(p => p.alias).map(p => [p.kw, p.alias]));
    /* site key ("38", "a-38") of a person in this tree, and back */
    const siteKey = p => p.side && p.origKw !== undefined ? (p.side === "a" ? "a-" : "") + p.origKw : pre + p.kw; /* s and every family tree keep side and origKw */
    const kwOfKey = new Map(people.map(p => [siteKey(p), p.kw]));
    const facts = [];
    people.filter(p => !p.living).forEach(p => { const z = typeof KORT !== "undefined" && KORT[siteKey(p)]; if (z) facts.push({ kw: p.kw, text: z, st: p.st, kind: "short" }); });
    (t.FACTS || []).forEach(f => facts.push({ kw: f.kw, text: f.x, title: f.t, year: f.y, st: f.st, kind: "fact" }));
    const images = IMGS.map(im => {
      const keys = (im.kws && im.kws.length ? im.kws : [im.key]).map(String), kws = keys.map(x => kwOfKey.get(x)).filter(x => x !== undefined);
      return { id: im.id, kind: im.soort, group: im.groep || null, portrait: !!im.portret, keys, kws, place: PLACES[im.key] ? im.key : null, t: im.t, desc: im.desc, src: im.src, thumb: im.thumb, w: im.w, h: im.h, maker: im.maker, lic: im.lic, sourceName: im.bronNaam };
    }).filter(im => im.kws.length || im.place || !/^\d|^a-\d/.test(im.keys[0]));
    const places = Object.fromEntries(Object.entries(PLACES).map(([pk, v]) => [pk, { la: v.la, lo: v.lo, name: v.name || pk, seat: v.seat, kind: v.kind, gem: v.gem }]));
    return (siteTreeCache[key] = { tree: key, root: t.rootFull || t.root, rootLines: t.rootLines || null, siblings: t.sibs || [], brand: t.brand,
      asOf: (VERSION.split(" · ")[1] || "").replace(/^\d+\s+/, ""), url: (($('meta[property="og:url"]') || {}).content || siteUrl()).replace(/^https?:\/\//, "").replace(/\/$/, ""),
      people, aliases, lines: t.LINES, places, facts, images, livingKeys: [...LIVING_KEYS], livingNames: people.filter(p => p.living).map(p => p.n),
      yearFrom: key === T.key ? (h => h.yearProven < 9999 ? h.yearProven : null)(honestStats()) : null, /* het oudste jaar met bewijs, zoals op de voorpagina en in het boek */
      mapBase: { bounds: B, water: WATER, borders: BORDERS } });
  };
  Products.site = Object.freeze({
    treeData: siteTreeData,
    currentTree: () => T.key,
    go: token => go(token),
    version: VERSION,
    url: () => siteUrl(),
  });
}

/* ---------- laten maken: hub ---------- */
/* #maak: de enige plek om een product te kiezen. Eerst voor wie (dezelfde snelkeuzes en hetzelfde zoekveld als het boek), dan de
   producten uit het register van de productmotor, per groep, elk met een klein voorbeeld voor de gekozen persoon. Het beginpunt
   gaat mee naar het product: maak--vanaf-12 → poster--vanaf-12, maak--vanaf-paar-24 → boek--vanaf-paar-24.
   Producten zonder eigen pagina staan er als "Binnenkort". */
if (typeof Products !== "undefined" && Products.list) {
  VIEWS.push("maak"); NAV_OF.poster = "maak"; NAV_OF.boek = "maak";
  { const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-maak"; sec.hidden = true; $("main").appendChild(sec); }
}
const mkState = { start: 1, paar: false };
function mkFromToken(t) {
  const m = String(t).match(/--vanaf-(paar-)?(\d+)/); mkState.paar = !!(m && m[1]); mkState.start = m ? +m[2] : 1; mkState.persoon = /--persoon(--|$)/.test(t); mkState.voor = mkVoorUit(String(t).split("--"));
  const k = mkState.paar ? mkState.start & ~1 : fanKw(mkState.start);
  mkState.fout = null;
  if (mkState.paar ? !(k >= 2 && (person(fanKw(k)) || person(fanKw(k + 1)))) : !person(k)) { if (m) mkState.fout = +m[2]; mkState.start = 1; mkState.paar = false; } else mkState.start = k;
}
/* persoon: chosen as a person, so titled as one; voor: some children of the couple by name ("--voor-andre", repeatable), titled after them */
const mkStartTok = S => (S.paar ? "--vanaf-paar-" + S.start : S.start > 1 ? "--vanaf-" + S.start : "") + ((S.voor || []).length ? S.voor.map(v => "--voor-" + v).join("") : S.persoon ? "--persoon" : "");
const mkVoorUit = parts => parts.filter(x => /^voor-./.test(x)).map(x => x.slice(5)); /* the "voor-…" words of a token */
const mkToken = () => "maak" + mkStartTok(mkState);
/* het beginpunt voor de motor, en de naam erbij */
const mkStart = S => ({ kw: S.start, pair: !!S.paar });
const mkNaam = S => Products.startName(Products.site.treeData(T.key), mkStart(S));
/* de link naar een product, met het beginpunt */
/* who and what are chosen here, so a product with a wizard opens on its step "Maat" (the book keeps its own start) */
/* a memorial book is about the dead: from a living start, the nearest couple above it of whom nobody is living (Harrie → Herman and Mien) */
function mkGedenkStart(S) {
  const dood = k => [k, k + 1].map(x => person(fanKw(x))).filter(Boolean), ok = k => { const ps = dood(k); return ps.length && ps.every(q => !q.living); };
  const begin = S.paar ? S.start : S.start * 2; if (S.paar && ok(S.start) || !S.paar && person(fanKw(S.start)) && !person(fanKw(S.start)).living) return S;
  const q = [begin]; while (q.length) { const k = q.shift(); if (k > 2 ** 20) break; if (ok(k)) return { start: k, paar: true }; if (dood(k).length) q.push(2 * k, 2 * k + 2); }
  return S;
}
const mkLink = (p, S) => { if (!p.page) return null; if (p.id === "book-memorial") S = Object.assign({}, S, mkGedenkStart(S)); const ids = Products.stepsOf(p).map(s => s.id);
  const at = p.layout === "book" ? -1 : ids[0] === "kind" && ids.length > 2 ? 1 : ids.indexOf("size"); /* the kind is chosen here: the step after "Soort" */
  return p.page + (p.pageToken ? "--" + p.pageToken : "") + mkStartTok(S) + (at > 0 ? "--stap-" + (at + 1) : ""); };
/* een klein voorbeeld: uit de motor waar een renderer is, anders een tekening van het product */
function mkMini(p, S) {
  try {
    if (p.layout === "book") return mkBoekMini(p, S);
    if (p.id === "poster-pedigree") return { vel: "kwartierstaat" }; /* de echte kwartierstaat, na het plaatsen (heeft de dom nodig om te meten) */
    if (p.renderer === "card" && !Products.renderers.card || p.id === "game-quartet") return mkKaartjesMini(p, S); /* the quartet has no renderer yet */
    if (!Products.renderers[p.renderer] || p.layout === "book") return "";
    const opts = Object.assign({ start: mkStart(S), bleed: 0 }, mkTitles(mkStart(S), S.persoon, S.voor)); if (p.formats.includes("a3")) opts.format = "a3"; /* the titles of the book; the sheet without bleed */
    const d = Products.makeDocument(p.id, Products.site.treeData(T.key), opts, Products.makePlatform(), { palette: Products.PRINT_PALETTE, preview: true }); /* thumbs */
    if (!d.pages || !d.pages[0] || !d.pages[0].svg) return "";
    return d.pages[0].svg.replace(/^<svg([^>]*)\swidth="[^"]*"\sheight="[^"]*"/, '<svg$1 aria-hidden="true"');
  } catch (e) { return ""; }
}
/* het boek: de echte voorkant (bookCoverDoc), in een geschaald iframe, met de titel van dit boek */
function mkBoekMini(p, S) {
  /* een boek dat er nog niet is: een schetsomslag zonder titel (niet de omslag van een ander boek) */
  if (!p.page || p.status === "planned") return typeof window.boekOmslagMini === "function" ? window.boekOmslagMini(p.id === "book-kids" ? "c" : "a") : "";
  if (typeof window.bookCoverDoc !== "function" || typeof bkCore !== "function") return typeof window.boekOmslagMini === "function" ? window.boekOmslagMini("b") : "";
  const C = bkCore(), tok = mkLink(p, S) || "boek" + (p.pageToken ? "--" + p.pageToken : "") + mkStartTok(S);
  const doc = window.bookCoverDoc(C.options(C.parse(tok)), { part: "front", set: p.id === "book-branches" }); /* each kind its own cover; the booklets as a row of spines */
  return bkOmslagIframe(doc, 150, "Voorkant: " + p.label);
}
/* kaartenset en kwartet (nog zonder eigen renderer): drie kaartjes in een waaier, met een dorp en een familiekleur uit de data */
function mkKaartjesMini(p, S) {
  const d = Products.site.treeData(T.key), tel = {};
  d.people.filter(q => !q.living).forEach(q => [q.bp, q.dp].forEach(k => { if (k && PLACES[k] && !isGemeente(k)) tel[k] = (tel[k] || 0) + 1; }));
  const dorpen = Object.entries(tel).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => placeName(k));
  const lijnen = LINE_KEYS.filter(l => LINES[l]).slice(0, 3), kwartet = p.id === "game-quartet";
  return `<svg viewBox="0 0 160 110" aria-hidden="true">${[-14, 0, 14].map((r, i) => `<g transform="rotate(${r} 80 105)"><rect x="56" y="14" width="48" height="70" rx="4" fill="#fff" stroke="var(--rule)"/>
    <rect x="60" y="18" width="40" height="${kwartet ? 8 : 34}" fill="var(--l${lijnen[i] || 8})" fill-opacity="${kwartet ? 0.9 : 0.28}"/>
    <text x="80" y="${kwartet ? 50 : 64}" text-anchor="middle" style="font-family:'IBM Plex Sans'" font-size="6.5" fill="var(--ink)">${esc(kwartet ? (LINES[lijnen[i]] || {}).name || "" : dorpen[i] || "")}</text>
    ${kwartet ? `<text x="80" y="60" text-anchor="middle" style="font-family:'IBM Plex Sans'" font-size="5" fill="var(--muted)">${i + 1} van 4</text>` : ""}</g>`).join("")}</svg>`;
}
/* de kwartierstaat als echt vel (zoals op #poster), klein geschaald in het vak */
function mkVelMini(el, soort, S) {
  const vel = document.createElement("div"); el.innerHTML = ""; el.appendChild(vel); el.classList.add("mk-mini-vel");
  const P2 = Object.assign(psLeeg(), { soort, formaat: "a3", kw: S.paar ? S.start : S.start, paar: false });
  psVel(P2, vel);
  const wpx = parseFloat(vel.style.width) * 96 / 25.4, hpx = parseFloat(vel.style.height) * 96 / 25.4;
  const k = Math.min((el.clientWidth - 20) / wpx, (el.clientHeight - 20) / hpx);
  Object.assign(vel.style, { transform: `scale(${k})`, left: ((el.clientWidth - wpx * k) / 2) + "px", top: ((el.clientHeight - hpx * k) / 2) + "px", background: "#fff", boxShadow: "0 1px 4px color-mix(in srgb,var(--ink) 18%,transparent)" });
}
function mkKaart(p, S, groot) {
  const go = mkLink(p, S), later = !go || p.status === "planned";
  /* a book: its first size and how many others (the number of pages depends on the choices) */
  const fmt = p.sizeText ? p.sizeText : p.layout === "book" ? (f => f.length ? P_FMT(f[0]) + (f.length > 1 ? `, of ${f.length - 1 === 1 ? "één andere maat" : ["", "", "twee", "drie", "vier"][f.length - 1] + " andere maten"}` : "") : "")(p.formats) : mkFormaten(p);
  const binnen = `<div class="mk-mini" data-mini="${esc(p.id)}" aria-hidden="true"></div><div class="mk-tekst"><h3>${esc(p.label)}</h3><p>${esc(p.promise || p.intro)}</p>${later ? `<p class="mk-meta"><span class="tag">Binnenkort</span></p>` : fmt ? `<p class="mk-meta">${esc(fmt)}</p>` : ""}${groot && !later ? `<span class="btn primary mk-start" aria-hidden="true">Stel je boek samen</span>` : ""}</div>`;
  return later ? `<div class="mk-kaart mk-later">${binnen}</div>` : `<a class="mk-kaart${groot ? " mk-groot" : ""}" href="#${T.prefix}${go}" data-go="${go}" data-product="${esc(p.id)}">${binnen}</a>`;
}
const P_FMT = id => (Products.formats[id] || { label: id }).label;
/* de maten in één regel: van klein naar groot, en een bijzonder smal formaat apart ("ook als boekenlegger") */
function mkFormaten(p) {
  const fs = p.formats.map(id => Products.formats[id]).filter(Boolean), gewoon = fs.filter(f => Math.min(f.w, f.h) >= 200).sort((a, b) => a.w * a.h - b.w * b.h), apart = fs.filter(f => Math.min(f.w, f.h) < 200 && !gewoon.length ? false : Math.min(f.w, f.h) < 200);
  const basis = gewoon.length ? gewoon[0].label + (gewoon.length > 1 ? " tot " + gewoon[gewoon.length - 1].label : "") : fs.map(f => f.label).join(", ");
  return basis + (apart.length ? ", ook als " + apart.map(f => f.label.replace(/^([A-Z])(?![0-9])/, c => c.toLowerCase())).join(" en ") : "");
}
function renderMaak() {
  const S = mkState, host = $("#v-maak");
  /* kaarten alleen voor wat je nu echt kunt maken; de rest in één rustige regel onderaan */
  const kan = p => !!mkLink(p, S) && p.status !== "planned";
  const groepen = Object.values(Products.categories).sort((a, b) => a.order - b.order).map(c => [c, Products.list({ category: c.id }).filter(kan)]).filter(([, ps]) => ps.length);
  const later = Products.list().filter(p => !kan(p));
  /* "Begin hier": the family book, large; the other books stay in their group */
  const eerst = Products.products.book && kan(Products.products.book) ? Products.products.book : null;
  host.innerHTML = `<h1 class="page-title">Maken</h1>
    <p class="lede">Een boek, een poster, een kalender, ansichtkaarten of een cadeau van de stamboom. Hier maak je de pdf; bestellen doe je zelf bij een drukker.</p>
    ${S.fout ? `<p class="bk-uitleg mk-fout" role="note">Kwartiernummer ${S.fout} staat niet in deze stamboom; je ziet de hele familie.</p>` : ""}
    <p class="mk-zo"><span>Zo werkt het:</span> <b>1</b> Kies wat je wilt maken · <b>2</b> Stel het in · <b>3</b> Maak de pdf · <b>4</b> Upload hem bij een drukker</p>
    <div class="mk-producten" data-own-guide>${eerst ? `<section class="mk-groep mk-eerst" aria-labelledby="mk-eerst"><h2 class="mk-kop" id="mk-eerst">Begin hier</h2>${mkKaart(eerst, S, true)}</section>` : ""}${groepen.map(([c, ps]) => [c, ps.filter(p => p !== eerst)]).filter(([, ps]) => ps.length).map(([c, ps]) => `<section class="mk-groep" aria-labelledby="mk-${esc(c.id)}"><h2 class="mk-kop" id="mk-${esc(c.id)}">${esc(c.label)}</h2><div class="mk-grid">${ps.map(p => mkKaart(p, S)).join("")}</div></section>`).join("")}</div>
    ${later.length ? `<section class="mk-groep mk-binnenkort" aria-labelledby="mk-later"><h2 class="mk-kop" id="mk-later">Binnenkort</h2><p class="bk-uitleg">Hier werken we nog aan. Zo gaan ze eruitzien.</p><div class="mk-grid">${later.map(p => mkKaart(p, S)).join("")}</div></section>` : ""}`;
  mkMinis(host, S);
  mkZetFocus(S);
}
/* the previews after the page stands, one by one; a newer run (another start) stops an older one */
let mkGen = 0;
function mkMinis(host, S) {
  const gen = ++mkGen, minis = $$("[data-mini]", host); let i = 0;
  const volgende = () => { if (gen !== mkGen || route.view !== "maak" || i >= minis.length) return; const el = minis[i++], p = Products.products[el.dataset.mini];
    if (p && el.isConnected) { el.classList.remove("mk-mini-vel"); const m = mkMini(p, S); if (m && m.vel) mkVelMini(el, m.vel, S); else el.innerHTML = m || "";
      el.querySelectorAll("iframe, a, button").forEach(x => x.setAttribute("tabindex", "-1")); } /* a preview is a picture: no stop for the keyboard */
    (window.requestIdleCallback || setTimeout)(volgende); };
  (window.requestIdleCallback || setTimeout)(volgende);
}
/* "Voor wie": the same part as in the products. A choice in this tree does not draw the page again (it would jump): the block
   itself, the links of the product cards, the previews, the tabs and the address follow the new start in place. Another tree
   switches the tree (then the page is drawn again). */
/* het beginpunt van de huidige pagina onder "Maken" ("" / "--vanaf-12" / "--vanaf-paar-4"): de tabs Overzicht, Boek en Poster
   nemen het mee */
/* "Voor wie" in Maken is the family chosen in the header (Harrie: one choice for the whole site). A product page shows it in its
   first step with a button that opens the header's pyramid; a page opened from a link with a start sets the header to that start. */
function mkVoorStap(st) {
  /* personal ("voor"): the names as the title writes them ("Andre de Groot"), with the family; else the family label */
  const t = (st.voor || []).length ? mkTitles({ kw: st.start, pair: st.paar }, st.persoon, st.voor) : null;
  const naam = t && t.title ? t.title.replace(/^De voorouders van\s+/, "") + (t.subtitle ? " (" + t.subtitle.replace(/\s·\s\d{3,4}\s*–.*$/, "").replace(/^De familie\s+/, "familie ") + ")" : "") : voorWieLabel({ start: st.start, paar: st.paar, persoon: st.persoon, voor: st.voor });
  return `<p class="mk-voorstap">Voor <b>${esc(naam)}</b></p><p><button type="button" class="btn" data-fk-wijzig>Andere familie kiezen</button></p><p class="bk-uitleg">De familie kies je bovenaan de site; de keuze geldt overal, ook hier.</p>`;
}
/* the fixed line at the top of a product wizard: for whom, with a button to the header's choice */
const mkVoorRegel = st => { const t = fkStart(st) && typeof fkLabel === "function" ? [0, esc(fkLabel())] : mkVoorStap(st).match(/<b>(.*?)<\/b>/); return `<p class="mk-voorregel">Voor: <b>${t ? t[1] : ""}</b> · <button type="button" class="link" data-fk-wijzig>Andere familie</button></p>`; };
function mkVoorBindStap(host) { const b = $("[data-fk-wijzig]", host); if (b) b.onclick = () => { const k = $("#tpBtn"); if (k) setTimeout(() => { window.scrollTo({ top: 0 }); k.click(); k.focus(); }, 0); }; } /* after this click: the header closes on a click outside */
function mkZetFocus(st) { /* the header follows the start of the product page */
  if (typeof fkFocus === "undefined" || typeof FK_KOP === "undefined" || !FK_KOP) return;
  const boom = st.start === 1 && !st.paar || st.start === 2 && st.paar;
  const oud = JSON.stringify(fkFocus);
  fkFocus = boom && !(st.voor || []).length ? null : { tree: T.key, start: st.start, paar: !!st.paar, persoon: !!st.persoon, voor: st.voor || [] };
  if (oud !== JSON.stringify(fkFocus) && typeof FK_OPNIEUW !== "undefined") FK_OPNIEUW.forEach(v => { rendered[v] = false; }); /* the fans follow the new choice */
  if (typeof tpSync === "function") tpSync();
}
/* the pages under Maken: the hub and every page with a product that is ready */
const makeViews = () => ["maak", ...(typeof Products !== "undefined" && Products.pages ? Products.pages().map(x => x.page) : ["boek", "poster"]), ...(typeof MP_PAGES !== "undefined" ? Object.keys(MP_PAGES) : [])];
function makeStartTok() {
  if (route.view === "maak") return mkStartTok(mkState);
  if (route.view === "poster") return mkStartTok({ start: psState.kw, paar: psState.paar, persoon: psState.persoon, voor: psState.voor });
  if (typeof MP_PAGES !== "undefined" && MP_PAGES[route.view] && mpState[route.view]) { const S = mpState[route.view], st = mpStart(S); return mkStartTok({ start: st.kw, paar: st.pair, persoon: S.persoon, voor: S.voor }); }
  if (route.view === "boek" && typeof bkState !== "undefined" && bkStartAan(bkState)) return mkStartTok({ start: bkState.start, paar: bkState.paar });
  return "";
}
if (VIEWS.includes("maak")) RENDER.maak = renderMaak;

/* ---------- bewaren (favourites) ---------- */
/* People you keep: window.Saved, in localStorage of this browser (nothing leaves the device). The key is the stable id of a person:
   "N" (Harrie's tree), "a-N" (Alies'), "d1"… (family without a kw, DESCENDANTS). The same id in every tree and every focus, so a kept
   person stays kept when you switch. Without storage (a private window) the API is there but does nothing (Saved.available false), and
   the star should not be shown. The page #bewaard lists them; fb's star in the profile calls Saved.toggle. */
const SAVED_KEY = "stamboom-bewaard";
const Saved = (() => {
  let ok = true, list = [];
  try { list = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); if (!Array.isArray(list)) list = []; localStorage.setItem(SAVED_KEY + "-t", "1"); localStorage.removeItem(SAVED_KEY + "-t"); } catch (e) { ok = false; list = []; }
  const subs = new Set();
  const save = () => { if (!ok) return; try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch (e) { } subs.forEach(f => { try { f(list.slice()); } catch (e) { } }); };
  const api = {
    available: ok,
    list: () => list.slice(),
    has: id => list.includes(String(id)),
    toggle: id => { if (!ok || id == null) return false; id = String(id); const i = list.indexOf(id); if (i >= 0) list.splice(i, 1); else list.push(id); save(); return i < 0; },
    remove: id => { const i = list.indexOf(String(id)); if (i >= 0) { list.splice(i, 1); save(); } },
    clear: () => { list = []; save(); },
    onChange: f => { subs.add(f); return () => subs.delete(f); },
    /* the id of the person at kw in the current tree (null for the virtual kw 1 of a couple or of the children) */
    idOf: kw => { const p = person(kw); if (!p || p.virtual || (p.living && /,| en /.test(p.n || ""))) return null;
      if (p.side && p.origKw !== undefined) return (p.side === "a" ? "a-" : "") + p.origKw;
      const k = p.aliasOf || p.kw; return T.key === "a" ? "a-" + k : String(k); },
  };
  /* other tabs of the same site: keep in step */
  addEventListener("storage", e => { if (e.key !== SAVED_KEY) return; try { list = JSON.parse(e.newValue || "[]") || []; } catch (x) { list = []; } subs.forEach(f => { try { f(list.slice()); } catch (x) { } }); });
  return api;
})();
window.Saved = Saved;
/* the small adapter 6c's header and menu use ("Bewaard (N)"): the count, opening the page, and an event "bewaard" on every change */
window.bewaard = { tel: () => Saved.list().length, open: () => go("bewaard") };
Saved.onChange(() => document.dispatchEvent(new Event("bewaard")));
/* the kw of an id in a tree (the current one, or s for "andere tak"), and the person behind an id */
function savedKwIn(t, id) {
  const P = t.PEOPLE || [], m = /^(a-)?(\d+)$/.exec(id); if (!m) return null; const side = m[1] ? "a" : "h", k = +m[2];
  if (t.key === side) return k;
  const r = P.find(p => !p.alias && (p.side ? p.side === side && p.origKw === k : false)); return r ? r.kw : null;
}
function savedEntry(id) {
  const d = /^d\d+$/.test(id) && typeof DESCENDANTS !== "undefined" ? DESCENDANTS.find(x => x.id === id) : null;
  if (d) return { id, n: d.roep || d.n, living: true, here: null, other: null, line: "", desc: true };
  const here = savedKwIn(T, id), s = TREES.s ? savedKwIn(TREES.s, id) : null;
  const rec = here != null ? person(here) : s != null ? TREES.s.PEOPLE.find(p => !p.alias && p.kw === s) : null;
  if (!rec) return null;
  const line = here != null && lineOf(here) && LINES[lineOf(here)] ? LINES[lineOf(here)].name : "";
  return { id, n: rec.n, living: !!rec.living, years: rec.living ? "" : lifeYears(rec), here, other: here == null ? s : null, line };
}
let savedSure = false; /* "Alles wissen" asks once, in the page itself */
function renderBewaard() {
  const host = $("#v-bewaard"), ids = Saved.list(), rows = ids.map(savedEntry).filter(Boolean);
  const opened = rows.filter(r => r.here != null).slice(0, 4).map(r => r.here);
  const item = r => `<li class="bw-item"><div class="bw-naam">${r.here != null ? `<button type="button" class="link" data-open="${r.here}">${esc(r.n)}</button>`
      : r.other != null ? `<a href="#${TREES.s.prefix}kw${r.other}">${esc(r.n)}</a>` : `<span>${esc(r.n)}</span>`}
      <small>${esc([r.years, r.line, r.other != null ? "andere tak" : r.desc ? "familielid" : ""].filter(Boolean).join(" · "))}</small></div>
      <button type="button" class="bw-weg" data-bw-weg="${esc(r.id)}" aria-label="${esc(r.n)} niet meer bewaren">×</button></li>`;
  host.innerHTML = `<h1 class="page-title">Bewaard${rows.length ? ` (${rows.length})` : ""}</h1>
    <p class="lede">De mensen die je bewaart, in deze browser. Ze blijven bewaard als je een andere familie kiest.</p>
    ${!Saved.available ? `<p class="bk-uitleg">Bewaren kan in deze browser niet (bijvoorbeeld in een privévenster).</p>`
      : !rows.length ? `<p class="bw-leeg">Nog niemand bewaard. Gebruik ☆ in een profiel.</p>`
      : `<ul class="bw-lijst">${rows.map(item).join("")}</ul>
        <p class="bw-knoppen">${opened.length > 1 ? `<a class="btn" href="#${T.prefix}profielen-${opened.join("-")}" data-go="profielen-${opened.join("-")}">Open ${opened.length < rows.filter(r => r.here != null).length ? "de eerste " + opened.length : "allemaal"} naast elkaar</a>` : ""}
        ${savedSure ? `<span class="bw-zeker" role="group" aria-label="Alles wissen?">Alles wissen? <button type="button" class="btn" data-bw="ja">Ja, alles wissen</button> <button type="button" class="btn" data-bw="nee">Nee</button></span>`
          : `<button type="button" class="btn" data-bw="wis">Alles wissen</button>`}</p>`}`;
  $$("[data-bw-weg]", host).forEach(b => b.onclick = () => { Saved.remove(b.dataset.bwWeg); });
  $$("[data-bw]", host).forEach(b => b.onclick = () => { const k = b.dataset.bw; if (k === "wis") savedSure = true; else { if (k === "ja") Saved.clear(); savedSure = false; } renderBewaard(); const n = $(k === "wis" ? '[data-bw="nee"]' : '[data-bw="wis"]', host); if (n) n.focus(); });
}
Saved.onChange(() => { if (route.view === "bewaard") renderBewaard(); else rendered.bewaard = false; });
VIEWS.push("bewaard"); NAV_OF.bewaard = "personen";
{ const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-bewaard"; sec.hidden = true; $("main").appendChild(sec); }
RENDER.bewaard = () => { savedSure = false; renderBewaard(); };

/* ---------- keep toast ---------- */
/* After the star: a short message at the bottom of the screen that says where the saved people are ("Bewaard · Bekijk je lijst"),
   or that someone was taken off the list. One element, polite for screen readers; it goes away by itself after a few seconds. */
/* a short visible note (same look as the star's message), e.g. why "Open ernaast" is off: a touch screen shows no title */
let pcNoteTimer = 0;
function pcNote(text) {
  let el = $("#pcNote");
  if (!el) { document.body.insertAdjacentHTML("beforeend", `<div id="pcNote" class="keep-toast" role="status" aria-live="polite" hidden></div>`); el = $("#pcNote"); }
  el.innerHTML = `<span>${esc(text)}</span>`; el.hidden = false; el.classList.remove("keep-toast-weg");
  clearTimeout(pcNoteTimer); pcNoteTimer = setTimeout(() => { el.classList.add("keep-toast-weg"); setTimeout(() => { el.hidden = true; }, 250); }, 3000);
}
let keepToastTimer = 0;
function keepToast(on) {
  let el = $("#keepToast");
  if (!el) { document.body.insertAdjacentHTML("beforeend", `<div id="keepToast" class="keep-toast" role="status" aria-live="polite" hidden></div>`); el = $("#keepToast"); }
  const n = Saved.list().length;
  el.innerHTML = on ? `<span>Bewaard${n > 1 ? ` · ${n} mensen` : ""}</span><a href="#${T.prefix}bewaard" data-go="bewaard">Bekijk je lijst</a>` : `<span>Niet meer bewaard</span>`;
  el.hidden = false; el.classList.remove("keep-toast-weg");
  clearTimeout(keepToastTimer); keepToastTimer = setTimeout(() => { el.classList.add("keep-toast-weg"); setTimeout(() => { el.hidden = true; }, 250); }, 4000);
  const a = $("a", el); if (a) a.onclick = () => { el.hidden = true; if (typeof closeProfile === "function" && !drawer.hidden) closeProfile(true); };
}

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
  ["Mensen", [["Personen", "personen", "Een profiel per voorouder"], ["Namenregister", "namen", "Alle achternamen van A tot Z"], ["Achternamen", "achternamen", "Waar de familienamen vandaan komen"], ["Beroepen", "beroepen", "Wat ze deden voor de kost"], ["Hoe zijn we familie?", "verwant", "De verwantschap tussen twee mensen"], ["Bekende verwanten", "verwanten", "Adel, macht en geschiedenis"], ["Bewaard", "bewaard", "De mensen die je bewaart"]]],
  ["Verhalen", [["Verhalen", "verhalen", "De rode draden door de families"], ["Opvallende feiten", "opvallend", "Korte feiten, elk met het bewijs"], ["Tijdlijn", "tijdlijn", "Wie leefde wanneer"], ["Hun tijd", "tijd", "Wat er gebeurde, wat hen raakte, en wat je erover leest"], ["In getallen", "cijfers", "Leeftijden, namen, beroepen"]]],
  ["Plaatsen", [["Kaart", "kaart", "Elk dorp op de kaart, ook per jaar"], ["Grond in 1832", "grond", "Hun land op de kadasterkaart van 1832"], ["Kruispunten", "verbanden", "Dorpen van beide kanten in dezelfde jaren", "s"]]],
  ["Beeld", [["Familie in beeld", "beeld", "Portretten, bidprentjes en kranten"], ["Plaatsen en kaarten", "beeld-plaatsen", "Dorpen, kerken en oude kaarten"], ["Uit de archieven", "beeld-archief", "Oude foto's, prenten en akten, met filters"]]],
  /* Maken: the hub (#maak) and a tab per product page from the register (Products.pages: the pages with a product that is ready,
     in the order of the hub, words in PAGE_WORDS), so a new product appears in the menu, the tabs and the guide by itself */
  ["Maken", [["Overzicht", "maak", "Alles wat je van de stamboom kunt maken"], ...(typeof Products !== "undefined" && Products.pages ? Products.pages().map(x => [x.label, x.page, x.desc])
    : [["Boek", "boek", "De stamboom als boek, om zelf te printen of te laten drukken"], ["Poster", "poster", "De waaier, de stamreeks, de kwartierstaat of de kaart, om op te hangen"]])]],
  ["Bronnen", [["Bronnen en betrouwbaarheid", "bronnen", "Hoe zeker alles is, en waar je zelf zoekt"], ["Help mee zoeken", "zoeken", "Open vragen waar je kunt helpen"], ["Tegenstrijdigheden", "bronnen-tegenstrijdig", "Waar bronnen elkaar tegenspreken"], ["Alle bronnen", "bronnen-lijst", "Elke gebruikte akte en genealogie"], ["In de krant", "kranten", "Berichten over de familie in oude kranten"], ["Over deze site", "bronnen-over", "Begrippen, wijzigingen en beeldverantwoording"]]]
];
const TREE_INFO = { h: "", s: "", a: "" }; /* the old tree picker (emergency switch) names a tree by its families only (t.brand) */
const TREE_KORT = { h: "De Groot · Boersma", s: "de kinderen", a: "Hoekstra · Bakker" };
/* "Bewaard (N)": only when someone is saved (or on the page itself); the count is kept until the event "bewaard" (window.bewaard) */
let BW_N = null;
const bewaardN = () => { if (BW_N == null) try { BW_N = window.bewaard ? +window.bewaard.tel() || 0 : 0; } catch (e) { BW_N = 0; } return BW_N; };
const menuGroups = () => MENU.map(([g, its]) => [g, its.filter(([, v, , boom]) => VIEWS.includes(v) && (!boom || T.key === boom) && (v !== "bewaard" || bewaardN() > 0 || route.view === "bewaard"))
  .map(x => x[1] === "bewaard" && bewaardN() ? [`${x[0]} (${bewaardN()})`, ...x.slice(1)] : x)]).filter(([, its]) => its.length);
/* the count as a badge on the group that holds Bewaard (Mensen), with ", 3 bewaard" for screen readers */
const mnBadge = its => { const n = its.some(x => x[1] === "bewaard") ? bewaardN() : 0; return n ? `<span class="mn-badge" aria-hidden="true" title="${n} bewaard"><span class="mn-badge-ster">★ </span>${n}</span><span class="sr-only">, ${n} bewaard</span>` : ""; };
document.addEventListener("bewaard", () => { BW_N = null; /* the menu again, quietly: not while a menu is open or the focus is in it */
  if (!openDrop && mnPanel.hidden && !tabsNav.contains(document.activeElement) && !subNav.contains(document.activeElement)) menuSync(true); footLater(); });
const hereView = () => { const all = menuGroups().flatMap(([, its]) => its.map(x => x[1])); return all.includes(route.view) ? route.view : NAV_OF[route.view] || route.view; };
const groupOf = v => (menuGroups().find(([, its]) => its.some(x => x[1] === v)) || [null])[0];
const mnHref = v => "#" + T.prefix + v;
const mnCur = v => route.view === v && !route.sub ? ` aria-current="page"` : hereView() === v ? ` aria-current="true"` : ""; /* "page" alleen op de pagina zelf, "true" op een pagina eronder */
const mnLink = (lbl, v, uitleg, cls) => { const tx = uitleg ? `<b>${esc(lbl)}</b><small>${esc(uitleg)}</small>` : esc(lbl), ico = cls.includes("mn-it") ? navIco(v) : "";
  const t = fkTok(v); return `<a class="${cls}${ico ? " mn-ico" : ""}" href="${mnHref(t)}" data-go="${t}"${mnCur(v)}>${ico ? `${ico}<span class="mn-tx">${tx}</span>` : tx}</a>`; };
const topWrap = $("header.top .wrap"), tabsNav = $("nav.tabs"), oudMerk = $("header.top .brand");
tabsNav.setAttribute("aria-label", "Hoofdmenu");
/* boomkiezer = merk */
const tp = document.createElement("div"); tp.className = "tp";
tp.innerHTML = `<button type="button" class="tp-btn" id="tpBtn" aria-expanded="false" aria-controls="tpList"><span class="tp-tx"><small>Stamboom van</small><b id="tpNaam"></b></span><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="tp-list mn-drop" id="tpList" hidden></div>`;
oudMerk.insertAdjacentElement("afterend", tp);
const tpBtn = $("#tpBtn"), tpList = $("#tpList");
const treeKeuze = cls => ["h", "s", "a"].filter(k => TREES[k]).map(k => `<button type="button" class="${cls}" data-tree="${k}" aria-pressed="${T.key === k}"><b>${esc(TREES[k].root)}</b><span>${esc(TREES[k].brand)}</span><small>${esc(TREE_INFO[k])}</small></button>`).join("");
/* ---------- family choice in the header (FK1): the pyramid as the chooser, on top of the three trees ----------
   Rows 1–2 switch the tree (s, h, a) as the tree picker did. Row 3 (a grandparent couple) goes to the tree of that side and
   re-roots where a page can already: the fan and the tree with their child in the middle, Maken from the couple; the families
   page and the other pages show the whole side, with an honest line under the title. Phase 2 (one family with a focus in the
   route) replaces this. FK_KOP = false brings back the old tree picker (nothing else changes). */
/* FK_KOP: declared at the top (with FK), because the footer and the search index read it at startup */
let fkFocus = null; /* the chosen focus below the tree level { tree, start, paar } (a grandparent couple, or someone via "Iemand anders…"), or null */
const fkActief = () => fkFocus && fkFocus.tree === T.key ? fkFocus : null;
const FK_VOLGT = ["stamboom", "boom"];
const FK_OPNIEUW = ["overzicht", "stamboom"]; /* drawn again after a choice (the hero fan follows it); others can join */
/* the current choice for other code (89: the fans; FK2e): { tree, kw, pair, persons, persoon } in the numbering of that tree, or null (the whole tree) */
const fkKeuze = () => { const f = fkActief(); return f ? { tree: f.tree, kw: f.start, pair: !!f.paar, persons: (f.voor || []).slice(), persoon: !!f.persoon } : null; };
window.fkKeuze = fkKeuze; /* pages that re-root: the person, or the couple's child, in the middle */
const fkMidden = f => f.paar ? f.start >> 1 : f.start;
function fkTok(v) {
  const f = fkActief(); if (!f || !FK_KOP) return v;
  if (FK_VOLGT.includes(v)) return fkMidden(f) > 1 ? v + "-" + fkMidden(f) : v;
  if (typeof makeViews === "function" && makeViews().includes(v)) return v + (f.paar ? "--vanaf-paar-" : "--vanaf-") + f.start
    + ((f.voor || []).length ? f.voor.map(n => "--voor-" + (n => String(n).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""))(n)).join("") : f.persoon ? "--persoon" : "");
  return v;
}
/* the centre of a fan that follows the choice (FK1): for a grandparent couple their child with the number of brothers and sisters
   ("Kees +5", from the couple's list of children; a stillborn child does not count); for "Voor …" the children it is for */
function fkMiddenLabel(root) {
  if (FK && T.focus && T.focus.pair && root === 1) { /* phase 2, a couple as focus: kw 1 is their children (virtual); the couple is ring 2 already */
    const ps = T.focus.persons || [], kids = [...new Set((T.kids || []).flatMap(k => String(k).split(/,\s*|\s+en\s+/)).map(k => k.trim()).filter(Boolean))];
    if (ps.length) return ps.length === 1 ? [ps[0]] : ps.length === 2 ? [ps[0], "en " + ps[1]] : [ps.slice(0, -1).join(", "), "en " + ps[ps.length - 1]];
    if (kids.length) { const r = [kids[0].split(/\s+/)[0]], n = kids.length - 1; /* the first name: the list can hold "Alies Hoekstra" */ r.sub = n ? `+${n} ${n === 1 ? "broer of zus" : "broers en zussen"}` : ""; return r; }
    const k1 = person(1); if (k1 && k1.n) { const r = [k1.n]; r.rings = true; return r; } /* a couple without children: two rings above the family name */
    return null;
  }
  const f = typeof fkActief === "function" && FK_KOP && !FK ? fkActief() : null; if (!f) return null;
  const kind = f.paar ? f.start >> 1 : 0;
  if ((f.voor || []).length && root === Math.max(1, kind)) { /* the children it is for: their own first names (the address holds "andre", "marit") */
    const slug = x => String(x).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const namen = [...(T.sibs || []), ...(T.rootLines || []), ...String(T.root || "").split(/,\s*|\s+en\s+/)].map(x => String(x).trim()).filter(Boolean);
    const v = f.voor.map(x => namen.find(n => slug(n) === slug(x)) || String(x).charAt(0).toUpperCase() + String(x).slice(1));
    return v.length === 1 ? [v[0]] : v.length === 2 ? [v[0], "en " + v[1]] : [v.slice(0, -1).join(", "), "en " + v[v.length - 1]]; }
  if (f.paar && kind > 1 && root === kind) { const c = person(kind), ouder = person(f.start) || person(f.start + 1); if (!c) return null;
    const n = Math.max(0, ((ouder && ouder.kids) || []).filter(k => !/levenloos/i.test(String(k))).length - 1);
    const r = [firstName(c)]; r.sub = n ? `+${n} ${n === 1 ? "broer of zus" : "broers en zussen"}` : ""; return r; } /* "Kees", and small below it "+5 broers en zussen" */
  return null;
}
/* the colours of a branch for a strip (as on the pyramid cards): the eight lines of the joint fan, 8–11 Harrie's side, 12–15 Alies'.
   roots in s numbering; a root above generation 4 covers the lines under it, a deeper one lies in one line */
const FK_LIJNEN = [8, 9, 10, 11, 12, 13, 14, 15];
const fkKleurenS = roots => FK_LIJNEN.filter(l => roots.some(r => r >= 1 && (gen(r) <= 4 ? l >> (4 - gen(r)) === r : r >> (gen(r) - 4) === l))).map(l => `var(--l${l})`);
const naarSvan = kw => T.key === "s" ? kw : T.key in TREE_PRE ? naarS(T.key, kw) : T.toS ? T.toS(kw) : null; /* a number of the current tree in s */
function fkKleuren() { /* the colours of the current choice */
  const x = fkKaart(); if (x) return x.kleuren || [];
  if (FK && T.focus) return fkKleurenS(T.focus.pair ? [T.focus.kw, T.focus.kw + 1] : [T.focus.kw]);
  const f = fkActief(); if (f) { const r = naarSvan(f.start); return r ? fkKleurenS(f.paar ? [r, r + 1] : [r]) : []; }
  return fkKleurenS([naarSvan(1) || 1]);
}
const fkStrook = k => k && k.length ? `<span class="vw-strook fk-strook" aria-hidden="true" style="--n:${k.length}">${k.map(c => `<i style="background:${c}"></i>`).join("")}</span>` : "";
const fkKaart = () => { const L = voorWieOpties(), alle = [...L.heel, ...L.tak];
  if (FK && T.focus) return alle.find(x => x.paar && x.start > 2 && naarS(x.tree, x.start) === T.focus.kw && !!T.focus.pair) || null; /* a focus tree: its card, if it is one */
  const f = fkActief(), v = f ? voorWieWaarde(f.tree, f.start, f.paar) : voorWieWaarde(T.key, 1, false);
  return f && (f.persoon || (f.voor || []).length) ? null : alle.find(x => x.v === v) || null; }; /* chosen as a person or for someone: no card */
/* the short form of a person or couple for the header: call name and surname; a couple with one surname "Kees en Vronie de Groot" */
/* the header label of a couple: the two surnames like the pyramid cards ("Van der Molen · Gaastra"); one shared surname keeps "Kees en Vronie de Groot" */
const fkKopPaar = start => { const a = person(start), b = person(start + 1), cap = x => x ? x.charAt(0).toUpperCase() + x.slice(1) : "", sa = a ? cap(splitName(a.n).sur) : "", sb = b ? cap(splitName(b.n).sur) : "";
  return sa && sb && sa.toLowerCase() !== sb.toLowerCase() ? `${sa} · ${sb}` : fkKort(start, true); };
const fkKort = (start, paar) => { const a = person(start), b = paar ? person(start + 1) : null, kort = q => q ? [firstName(q), splitName(q.n).sur].filter(Boolean).join(" ") : "";
  if (!b) return kort(a); if (!a) return kort(b); const sa = splitName(a.n).sur, sb = splitName(b.n).sur;
  return sa && sa === sb ? `${firstName(a)} en ${firstName(b)} ${sa}` : `${kort(a)} en ${kort(b)}`; };
/* the word above the name: a family (a card), a person or a couple (via "Iemand anders…") */
const fkSoort = () => { const x = fkKaart(), f = fkActief(); if (x) return BK_VOORWIE_TEKST.kopFamilie; if (f && (f.voor || []).length || FK && T.focus && (T.focus.persons || []).length) return BK_VOORWIE_TEKST.kopVoor;
  if (FK && T.focus) return T.focus.pair ? BK_VOORWIE_TEKST.kopFamilie : BK_VOORWIE_TEKST.kopPersoon;
  return f ? (f.paar ? BK_VOORWIE_TEKST.kopFamilie : BK_VOORWIE_TEKST.kopPersoon) : BK_VOORWIE_TEKST.kopFamilie; };
const fkVol = () => { const f = fkActief(); return FK && T.focus ? T.rootFull : f ? voorWieLabel({ start: f.start, paar: f.paar, persoon: true }) : ""; };
const fkLabel = () => { const x = fkKaart(), f = fkActief(); if (x) return x.label; if (FK && T.focus) { const ps = T.focus.persons || [];
    if (ps.length) { const v = TREES.s.PEOPLE.find(x => x.kw === T.focus.kw && !x.alias), sur = v ? splitName(v.n).sur : ""; return ps.length === 1 ? [ps[0], sur].filter(Boolean).join(" ") : ps.slice(0, -1).join(", ") + " en " + ps[ps.length - 1]; } /* "Andre de Groot", or "Marit, Tijmen en Jorn" */
    return T.focus.pair ? fkKopPaar(2) || T.brand : fkKort(1, false) || T.rootFull; }
  if (!f && T.key in { h: 1, a: 1, s: 1 }) { const L = voorWieOpties(), y = L.heel.find(z => z.tree === T.key); if (y) return y.label; }
  return f ? ((f.voor || []).length ? voorWieLabel({ start: f.start, paar: true, voor: f.voor }) : f.paar ? fkKopPaar(f.start) : fkKort(f.start, false)) : T.rootFull; };
const fkPiramide = id => { const x = FK && T.focus ? fkKaart() : null;
  const st = FK && T.focus ? (x ? { tree: x.tree, start: x.start, paar: true } : { tree: "s", start: T.focus.kw, paar: !!T.focus.pair, persoon: true, voor: (T.focus.persons || []).slice() })
    : { tree: T.key, start: fkActief() ? fkActief().start : 1, paar: fkActief() ? fkActief().paar : false, persoon: !!(fkActief() && fkActief().persoon), voor: fkActief() ? fkActief().voor || [] : [] };
  return `<div class="vw-compact vw-kop">${voorWieHtml(st, { id, open: true, zoekAltijd: true, kop: true, nuLabel: id === "fko" ? BK_VOORWIE_TEKST.kopNu : "" })}</div>`; };
/* a choice: { tree, start, paar, persoon } — the tree level (kw 1 or the couple 2–3) clears the focus */
function fkKies(ch) {
  const boom = (ch.start === 1 && !ch.paar || ch.start === 2 && ch.paar) && !(ch.voor || []).length;
  if (FK) { /* the focus in the route: rows 1–2 the own trees (their own texts), otherwise a focus tree in s numbering */
    fkFocus = null; dropClose(); if (typeof panelClose === "function") panelClose();
    const key = boom ? ch.tree : focusSleutel(naarS(ch.tree, ch.start), !!ch.paar, ch.voor || []);
    setTree(key); go(currentToken()); tpSync(); fkLive(BK_VOORWIE_TEKST.kopGekozen.replace("{soort}", fkSoort()).replace("{fam}", fkLabel())); return; }
  const voor = ch.voor || [];
  fkFocus = boom && !voor.length ? null : { tree: ch.tree, start: ch.start, paar: !!ch.paar, persoon: !!ch.persoon, voor };
  dropClose(); if (typeof panelClose === "function") panelClose();
  const volgt = FK_VOLGT.includes(route.view) || typeof makeViews === "function" && makeViews().includes(route.view);
  FK_OPNIEUW.forEach(v => { rendered[v] = false; }); /* pages whose fan or text follows the choice are drawn again, also in the same tree */
  setTree(ch.tree); go(volgt ? fkTok(route.view.replace(/-\d+$/, "")) : currentToken());
  tpSync(); requestAnimationFrame(fkRegel);
  fkLive(BK_VOORWIE_TEKST.kopGekozen.replace("{soort}", fkSoort()).replace("{fam}", fkLabel()));
}
const fkLiveEl = Object.assign(document.createElement("p"), { className: "sr-only" }); fkLiveEl.setAttribute("aria-live", "polite"); document.body.appendChild(fkLiveEl);
const fkLive = t => { fkLiveEl.textContent = ""; setTimeout(() => { fkLiveEl.textContent = t; }, 60); };
const fkUitWaarde = v => { const [tree, w] = v.split(":"); return { tree, start: +w.replace("p", ""), paar: w[0] === "p" }; };
/* the line under the title when the page shows more than the focus (honest: no hidden filtering) */
function fkRegel() {
  $$(".fk-regel").forEach(x => x.remove());
  const f = fkActief(), v = $$("main > .view").find(x => !x.hidden); if (!f || !v || !FK_KOP) return;
  if (FK_VOLGT.includes(route.view) && (route.sub || 1) === fkMidden(f) || typeof makeViews === "function" && makeViews().includes(route.view)) return;
  const L = voorWieOpties(), boom = [...L.heel].find(x => x.v === voorWieWaarde(T.key, 1, false)); if (!boom) return;
  /* the overview: its fan follows the choice (heroRoot), the rest of the page not yet: say both, short */
  const kind = f.paar ? person(f.start >> 1) : person(f.start), x = fkKaart();
  const waaier = route.view === "overzicht" && $("#heroFan", v), wie = (f.voor || []).length ? voorWieLabel({ start: f.start, paar: true, voor: f.voor })
    : kind ? firstName(kind) + (x ? " (" + x.label + ")" : "") : fkLabel(); /* the fan begins at the couple's child */
  const tekst = (waaier ? BK_VOORWIE_TEKST.kopRegelWaaier : BK_VOORWIE_TEKST.kopRegel).replace("{wie}", wie).replace("{ouders}", boom.ouders || T.root).replace("{fam}", boom.label);
  const html = `<p class="fk-regel small" role="note">${esc(tekst)}</p>`;
  const anker = $(".lede", v) || $("h1", v); if (anker) anker.insertAdjacentHTML("afterend", html);
}
function tpSync() {
  if (!FK_KOP) return; const x = fkKaart(), n = $("#tpNaam"), sm = $("#tpBtn small"), f = fkActief();
  const soort = fkSoort(); if (sm) sm.innerHTML = `${esc(soort)}${fkStrook(fkKleuren())}`; if (n) n.innerHTML = `<span class="tp-lang">${String(fkLabel()).split(" · ").map(esc).join("&nbsp;· ")}</span>`;
  const b = $("#tpBtn"), uit = x ? x.label + (x.voor ? ", " + x.voor : "") : fkVol() || fkLabel();
  if (b) { b.setAttribute("title", uit); b.setAttribute("aria-label", `${soort}: ${fkLabel()}. ${BK_VOORWIE_TEKST.kopKies}`); }
  requestAnimationFrame(kopPast);
}
/* the search in the header panel: "Iemand anders…" (all trees) */
function fkZoekBind(host, id) {
  VW_KIES[id] = ch => fkKies(ch);
  const i = $("#" + id + "StartZoek", host); if (!i) return;
  vwBind(id + "StartZoek", false, (kw, c) => { if (kw) fkKies({ tree: (c && c.tree) || T.key, start: kw, paar: false, persoon: true, voor: [] }); }, null, vwFindAlle);
}
/* ---------- Maken as a mega menu: it mirrors the hub. A column per category of the register (hub order), per product its name and
   hint in one link; what is not ready yet stays in its column with "binnenkort" (no link); at the bottom "Alles om te maken →".
   On a phone the same categories as fold-out groups in the menu panel. The words are 19's (registry hints). ---------- */
const MM_TEKST = { top: "Laat een boek, poster, kalender of cadeau van de stamboom drukken.", alles: "Alles om te maken →", hoe: "Zo werkt het: kies, stel in, maak de pdf, bestel bij een drukker.", later: "binnenkort" };
function mmProducten() {
  try {
    if (typeof Products === "undefined" || !Products.categories || !Products.list) return null;
    return Object.values(Products.categories).sort((a, b) => a.order - b.order).map(c => [c, Products.list({ category: c.id }).map(p => {
      const go = p.status !== "planned" ? mkLink(p, mkState) : null; return { p, go, naam: String(p.label).replace(/\s*\([^)]*\)\s*$/, "") }; })]).filter(([, ps]) => ps.length);
  } catch (e) { return null; } /* at the very first build the hub helpers do not exist yet: the plain list, the menu is drawn again */
}
const mmItem = ({ p, go, naam }, cls) => go ? `<li><a class="${cls}" href="#${T.prefix}${go}" data-go="${go}"><b>${esc(naam)}</b>${p.hint ? `<small>${esc(p.hint)}</small>` : ""}</a></li>`
  : `<li class="mm-later"><span class="${cls}"><b>${esc(naam)}</b> <span class="tag">${esc(MM_TEKST.later)}</span>${p.hint ? `<small>${esc(p.hint)}</small>` : ""}</span></li>`;
function mkMega() {
  const L = mmProducten(); if (!L) return "";
  return `<p class="mm-top">${esc(MM_TEKST.top)}</p><nav class="mm-kols" aria-label="Maken">${L.map(([c, ps]) => `<section class="mm-kol"><h3 class="mm-kop" id="mmk-${esc(c.id)}">${esc(c.label)}${c.hint ? `<small>${esc(c.hint)}</small>` : ""}</h3><ul aria-labelledby="mmk-${esc(c.id)}">${ps.map(x => mmItem(x, "mm-it")).join("")}</ul></section>`).join("")}</nav>
    <div class="mm-voet"><a class="mm-alles" href="#${T.prefix}maak" data-go="maak">${esc(MM_TEKST.alles)}</a><small>${esc(MM_TEKST.hoe)}</small></div>`;
}
/* the phone menu: each group of Maken with an icon like the other menu items, and a chevron that shows it opens */
const MM_ICO = { books: "boek", wall: "poster", calendars: "vandaag", cards: "kaarten", gifts: "maken" };
function mkMegaPaneel() {
  const L = mmProducten(); if (!L) return "";
  return L.map(([c, ps]) => `<details class="mm-groep"><summary>${navIco(MM_ICO[c.id] || "maken")}<span class="mn-tx">${esc(c.label)}</span><svg class="mm-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></summary><ul>${ps.map(x => mmItem(x, "mn-it")).join("")}</ul></details>`).join("")
    + `<a class="mn-it mm-alles" href="#${T.prefix}maak" data-go="maak">${esc(MM_TEKST.alles)}</a>`;
}
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
  if (btn === tpBtn) { d.innerHTML = FK_KOP ? `<div class="vw-paneel-kop fk-kop"><b class="mn-g">${esc(BK_VOORWIE_TEKST.kop)}</b><button type="button" class="vw-dicht" data-fk-dicht aria-label="Sluiten">×</button></div>${fkPiramide("fk")}` : `<div class="mn-g">Kies een stamboom</div>` + treeKeuze("tp-it"); if (FK_KOP) fkZoekBind(d, "fk"); }
  d.hidden = false; btn.setAttribute("aria-expanded", "true"); openDrop = btn;
  if (d.classList.contains("mn-mega")) { d.style.left = "0px"; const r = d.getBoundingClientRect(); d.style.left = Math.round((innerWidth - r.width) / 2 - r.left) + "px"; } /* the mega menu: centred on the screen */
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
/* the menu must fit next to the family and the actions; measured, so a long name switches to ☰ sooner (not only at 1020 px) */
function kopPast() {
  const h = document.documentElement; if (innerWidth <= 1020) { h.classList.remove("kop-smal"); return; }
  h.classList.remove("kop-smal");
  const past = () => { const n = tabsNav.getBoundingClientRect(), z = ($(".searchbtn") || tabsNav).getBoundingClientRect(), t = tp.getBoundingClientRect();
    return !(n.right > z.left - 4 || n.left < t.right + 4 || tabsNav.scrollWidth > tabsNav.clientWidth + 2 || n.top > t.bottom - 6); };
  /* the menu comes first: shorten the name (ellipsis) step by step; only if the menu itself does not fit, use the hamburger */
  h.style.setProperty("--tp-max", "280px"); if (past()) return;
  const nm = $(".tp-tx b");
  for (let i = 0; i < 6 && nm; i++) { /* shrink the name by exactly the overlap, so as much of the name as possible stays visible */
    const nb = tabsNav.getBoundingClientRect(), t = tp.getBoundingClientRect(), bw = nm.getBoundingClientRect().width;
    const over = Math.max(t.right + 4 - nb.left, tabsNav.scrollWidth - tabsNav.clientWidth + 2, 0) || 20;
    const nw = Math.floor(bw - over - 2); if (nw < 110) break;
    h.style.setProperty("--tp-max", nw + "px"); if (past()) return; }
  h.style.removeProperty("--tp-max"); h.classList.add("kop-smal");
}
if (window.ResizeObserver) { const ro = new ResizeObserver(() => { kopH(); kopPast(); }); ro.observe(kop); ro.observe(subBar); } else addEventListener("resize", () => { kopH(); kopPast(); });
kopH();
tpList.addEventListener("click", e => { const t = e.target.closest("[data-tree]"); if (t && t.dataset.tree === T.key) dropClose(true); });
document.addEventListener("click", e => { const k = e.target.closest('[data-vw-id="fk"] [data-vw-keuze], [data-vw-id="fkm"] [data-vw-keuze], [data-vw-id="fko"] [data-vw-keuze]'); if (!k) return; e.preventDefault(); e.stopPropagation();
  const id = k.closest("[data-vw-id]").dataset.vwId;
  if (k.dataset.vwKeuze === "zoek") { $$(`[data-vw-id="${id}"] [data-vw-keuze]`).forEach(x => { x.setAttribute("aria-pressed", String(x === k)); x.classList.toggle("vw-aan", x === k); }); const i = $("#" + id + "StartZoek"); if (i) i.focus(); return; }
  fkKies(fkUitWaarde(k.dataset.vwKeuze)); }, true);
/* paneel */
function panelOpen() {
  dropClose();
  mnPanel.innerHTML = `<div class="mn-head"><b>Menu</b><button type="button" class="mn-close" aria-label="Menu sluiten">×</button></div>
    ${FK_KOP ? `<section class="mn-trees mn-fk" aria-label="Familie"><details class="mn-fk-d"><summary><small>${esc(fkSoort())}${fkStrook(fkKleuren())}</small><b>${esc(fkLabel())}</b></summary><div class="vw-paneel-kop fk-kop"><b class="mn-g">${esc(BK_VOORWIE_TEKST.kop)}</b><button type="button" class="vw-dicht" data-fk-dicht aria-label="Sluiten">×</button></div>${fkPiramide("fkm")}</details></section>` : `<section class="mn-trees" aria-label="Stamboom van"><h6>Stamboom van</h6>${treeKeuze("mn-tree")}</section>`}` +
    menuGroups().map(([g, its]) => its.length === 1 && its[0][0] === g ? `<section>${mnLink(g, its[0][1], "", "mn-it mn-solo")}</section>` : its[0][1] === "maak" && mkMegaPaneel() ? `<section class="mm-paneel"><h6>${esc(g)}</h6>${mkMegaPaneel()}</section>` : `<section><h6>${esc(g)}${mnBadge(its)}</h6>${its.map(([l, v]) => mnLink(l, v, "", "mn-it")).join("")}</section>`).join("") +
    `<section class="mn-thema"><h6 id="mnThemaKop">Weergave</h6><div class="mn-seg" role="radiogroup" aria-labelledby="mnThemaKop">${[["auto", "Automatisch"], ["licht", "Licht"], ["donker", "Donker"]].map(([t, l]) => `<button type="button" role="radio" data-mnt="${t}" aria-checked="${themeCur === t}">${l}</button>`).join("")}</div></section>`;
  mnPanel.hidden = false; mnScrim.hidden = false; mnBtn.setAttribute("aria-expanded", "true");
  if (FK_KOP) fkZoekBind(mnPanel, "fkm");
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
let focusNa = false, focusFrom = null; /* focusFrom: the page before a link inside the page; when it leads to another page or story, the focus goes to the new h1 too */
document.addEventListener("click", e => { if (e.target.closest("nav.tabs [data-go], .subtabs [data-go], .mn-panel [data-go]")) focusNa = true; else if (e.target.closest("main [data-go]")) focusFrom = route.view + "|" + route.sub; }, true);
function menuNa(noFocus) {
  if (document.body.hasAttribute("data-zuiver")) return; /* drukmodus van het boek: de titel is die van het boek */
  const v = $$("main > .view").find(x => !x.hidden), h1 = v && $("h1", v), it = menuGroups().flatMap(([, its]) => its).find(x => x[1] === route.view);
  const eigen = groupOf(route.view) === "Beeld"; /* de beeldpagina's hebben korte labels ("Familie"); hun h1 zegt meer */
  const naam = route.view === "overzicht" ? "" : route.view === "maak" ? "Maken" /* the tab is "Overzicht", like the home page */ : !route.sub && it && !eigen ? it[0] : (h1 && h1.textContent.trim()) || (it && it[0]) || "";
  document.title = (naam ? naam + " · " : "") + treeTitle();
  if (noFocus) return;
  const moved = focusFrom !== null && focusFrom !== route.view + "|" + route.sub;
  if ((focusNa || moved) && h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
  focusNa = false; focusFrom = null;
}
/* open profiel: de naam in de titel; bij sluiten weer de titel van de pagina eronder */
new MutationObserver(() => { if (drawer.hidden) { menuNa(true); return; }
  const p = curKw && person(curKw); if (p) document.title = p.n + " · Stamboom van " + (T.rootFull || T.root);
}).observe(drawer, { attributes: true, attributeFilter: ["hidden"], childList: true, subtree: true });
/* na elke paginawissel en boomwissel: menu en boomkiezer opnieuw */
function menuSync(stil) { /* stil: only the labels changed (Bewaard): nothing closes, the focus stays */
  if (!stil) { dropClose(); panelClose(); }
  clearTimeout(hoverT); viaHover = false;
  const hv = hereView(), hg = groupOf(hv);
  tabsNav.innerHTML = `<ul class="mn-ul">${menuGroups().map(([g, its], n) => {
    if (its.length === 1) return `<li><a class="mn-top${g === hg ? " is-here" : ""}" href="${mnHref(its[0][1])}" data-go="${its[0][1]}"${mnCur(its[0][1])}>${esc(g)}</a></li>`;
    const id = "mnd-" + n;
    return `<li class="mn-li"><a class="mn-top mn-lbl${g === hg ? " is-here" : ""}" href="${mnHref(fkTok(its[0][1]))}" data-go="${fkTok(its[0][1])}"${g === hg ? ` aria-current="true"` : ""}>${esc(g)}${mnBadge(its)}</a><button type="button" class="mn-chev${g === hg ? " is-here" : ""}" aria-expanded="false" aria-controls="${id}" aria-label="Meer onder ${esc(g)}"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="mn-drop${its[0][1] === "maak" && mkMega() ? " mn-mega" : ""}" id="${id}" hidden>${(its[0][1] === "maak" && mkMega()) || its.map(([l, v, u]) => mnLink(l, v, u, "mn-it")).join("")}</div></li>`;
  }).join("")}</ul>`;
  $$(".mn-li", tabsNav).forEach(hoverBind);
  const sg = menuGroups().find(([g]) => g === hg), sits = sg ? sg[1] : [];
  const sub = sits.length > 1, nu = sits.find(x => x[1] === hv);
  subBar.hidden = !sub;
  document.documentElement.classList.toggle("sub-op", sub && sits.some(x => x[1] === route.view)); /* groepspagina zelf: geen dubbele eyebrow */
  subNav.setAttribute("aria-label", hg ? `Pagina's onder ${hg}` : "Pagina's");
  /* desktop: groep links, tabs met hetzelfde icoon als in het menu; telefoon: een raster van even grote knoppen (zie CSS). De uitleg staat als title. */
  subUitleg.hidden = !(sub && nu && nu[2]); subUitleg.textContent = sub && nu && nu[2] ? nu[2] : "";
  subNav.innerHTML = !sub ? "" : `<span class="sb-g" aria-hidden="true">${esc(hg)}</span><ul class="sb-n${sits.length}${sits.length >= 5 && sits.every(([l]) => l.length <= 10) ? " sb-kort" : ""}">${sits.map(([l, v, u]) => `<li><a href="${mnHref(middenTok(v))}" data-go="${middenTok(v)}"${u ? ` title="${esc(u)}"` : ""}${mnCur(v)}>${typeof navIco === "function" ? navIco(v) : ""}${SUB_SHORT[v] ? `<span class="sb-lang">${esc(l)}</span><span class="sb-kort-l" aria-hidden="true">${esc(SUB_SHORT[v])}</span>` : `<span>${esc(l)}</span>`}</a></li>`).join("")}</ul>`;
  kopH();
  if (!stil) queueMicrotask(menuNa); /* na het tekenen van de pagina: titel en focus */
  if (FK_KOP) tpSync(); else { $("#tpNaam").innerHTML = `<span class="tp-lang">${esc(T.root)}</span><span class="tp-kort">${esc(TREE_KORT[T.key] || T.root)}</span>`;
  tpBtn.setAttribute("aria-label", `${treeTitle()}. Kies een andere stamboom`); }
}

/* ---------- voettekst ---------- */
/* Drie kolommen (op de telefoon onder elkaar): de stamboom met de drie bomen, de pagina's uit MENU (groeit vanzelf mee),
   en de versie met een link naar de wijzigingen en de regel over levenden. Wordt per boom opnieuw gezet. */
/* the family line in the footer; the helpers are declared further down (const): at the very first build (startup) they do not exist yet,
   then the old list, and the footer is drawn again after the first page (go → tpSync) */
function ftFamRegel(bomen) {
  try { return `<p class="ft-fam">${esc(fkSoort())}: <button type="button" class="link" data-fk-wijzig>${esc(fkLabel())} ▾</button>${fkStrook(fkKleuren())}</p>`; }
  catch (e) { return `<ul class="ft-bomen">${bomen}</ul>`; }
}
/* the footer is below the fold: built in a quiet moment after the page (several calls in a row: once) */
function footLater() {
  if (footLater.t) return; const run = () => { footLater.t = 0; footChrome(); };
  footLater.t = window.requestIdleCallback ? requestIdleCallback(run, { timeout: 1500 }) : setTimeout(run, 300);
}
function footChrome() {
  const f = $("#foot"); if (!f) return;
  const bomen = ["h", "s", "a"].filter(k => TREES[k]).map(k => `<li><a href="#${TREES[k].prefix}overzicht" data-tree="${k}"${T.key === k ? ` aria-current="true"` : ""}>${esc(TREES[k].rootFull || TREES[k].root)}</a></li>`).join("");
  let groepen = []; try { groepen = menuGroups(); } catch (e) {} /* bij de eerste opbouw bestaat het menu nog niet; boot() zet de voettekst daarna opnieuw */
  const kaart = groepen.map(([g, its]) => `<li><a href="${mnHref(its[0][1])}" data-go="${its[0][1]}">${esc(g)}</a>${its.length > 1 ? `<ul>${its.slice(1).map(([l, v]) => `<li><a href="${mnHref(v)}" data-go="${v}">${esc(l)}</a></li>`).join("")}</ul>` : ""}</li>`).join("");
  f.innerHTML = `<div class="ft">
    <section class="ft-boom"><h2>Stamboom</h2>${FK_KOP ? ftFamRegel(bomen) : `<ul class="ft-bomen">${bomen}</ul>`}<p>Gemaakt voor de families De Groot, Boersma, Hoekstra en Bakker.</p></section>
    <nav class="ft-kaart" aria-label="Alle pagina's"><h2>Op deze site</h2><ul>${kaart}</ul></nav>
    <section class="ft-info"><h2>Over</h2><p>${esc(VERSION)} · <a href="#${T.prefix}bronnen-wijzigingen" data-go="bronnen-wijzigingen">wat is er nieuw</a></p><p>Van levende familieleden staan alleen namen vermeld.</p><p><a href="#" class="ft-top" data-top>Naar boven ↑</a></p></section>
  </div>`;
  const top = $("[data-top]", f); if (top) top.onclick = e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); const h1 = $$("main > .view").find(v => !v.hidden); const t = h1 && $("h1", h1); if (t) { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); } };
}

/* ---------- boot ---------- */
buildIndex();
function boot() {
  const raw = (location.hash || "").slice(1); setTree(treeOfHash(raw)); const h = stripTree(raw);
  if (FK && raw && !FK_RE.test(raw)) try { history.replaceState(history.state, "", "#" + T.prefix + h); } catch (e) { } /* an old link (also #kwN): the new form */
  if (FK && FK_RE.test(raw) && !raw.startsWith(T.prefix)) { route.fout = raw; go("nietgevonden", { keepHash: true }); footLater(); return; } /* a focus that does not exist */
  if (/^kw\d+$/.test(h) && !person(fanKw(+h.slice(2)))) { route.fout = h; go("nietgevonden", { keepHash: true }); footLater(); return; } /* a number that is not in this tree, as after a click */
  if (/^kw\d+$/.test(h)) { go("overzicht", { keepHash: true }); openProfile(+h.slice(2), { fromHistory: true }); }
  else go(h || "overzicht", { replace: true });
  footLater();
}
function fromHash() {
  const raw = location.hash.slice(1), changed = setTree(treeOfHash(raw)), h = stripTree(raw) || "overzicht";
  if (FK && FK_RE.test(raw) && !raw.startsWith(T.prefix)) { route.fout = raw; go("nietgevonden", { keepHash: true }); return; } /* a focus that does not exist (f9999-) */
  if (FK && !raw) try { history.replaceState(history.state, "", "#" + T.prefix + "overzicht"); } catch (e) { } /* an empty hash: the default */
  if (FK && raw && !FK_RE.test(raw)) try { history.replaceState(history.state, "", "#" + T.prefix + h); } catch (e) { } /* an old link: the same page, in the new form */
  if (/^kw\d+$/.test(h) && !person(fanKw(+h.slice(2)))) { route.fout = h; go("nietgevonden", { keepHash: true }); return; } /* een kwartiernummer dat niet in deze boom staat */
  if (/^kw\d+$/.test(h)) {
    const onder = (history.state && history.state.onder) || (changed ? "overzicht" : null); /* de pagina onder het profiel */
    if (onder && (changed || onder !== currentToken())) go(onder, { keepHash: true, keepScroll: true });
    openProfile(+h.slice(2), { fromHistory: true }); return;
  }
  if (!drawer.hidden) closeProfile(true);
  if (!lb.hidden) closeLb(true);
  if (changed || h !== currentToken()) go(h, { keepHash: true, fromHistory: true });
}
try { history.scrollRestoration = "manual"; } catch (e) {} /* de site zet de scrollpositie zelf terug (go, fromHistory) */
/* de scrollpositie van de huidige stap steeds bijwerken, ook als je met een gewone #-link of de adresbalk kwam */
let scrollBewaar = 0;
addEventListener("scroll", () => { if (scrollBewaar) return; scrollBewaar = setTimeout(() => { scrollBewaar = 0; try { history.replaceState(Object.assign({}, history.state, { y: Math.round(scrollY) }), ""); } catch (e) {} }, 250); }, { passive: true });
window.addEventListener("popstate", fromHash);   /* vorige/volgende */
window.addEventListener("hashchange", fromHash); /* hash met de hand gewijzigd of een gewone #-link */
boot();
})();
