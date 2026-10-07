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
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
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
    if (typeof o.line === "number") x.line = 8 + 4 * s + ((o.line - 8) >> 1);
    return x;
  };
  const sides = [[h, 0], [a, 1]];
  const cat = f => sides.flatMap(([t, s]) => (t[f] || []).map(o => fix(deep(o, s), o, s)));
  const kids = (h.kids || []).join(", ").replace(/, ([^,]*)$/, " & $1") || "Harrie & Alies";
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
const gen = kw => Math.floor(Math.log2(kw)) + 1;
const lineOf = kw => kw < 4 ? null : kw < 8 ? ({ 4: 8, 5: 10, 6: 12, 7: 14 })[kw] : kw >> (gen(kw) - 4);
const lineColor = kw => { const l = lineOf(kw); return l ? `var(--l${l})` : "var(--faint)"; };
const isMale = kw => kw === 1 ? T.rootMale : kw % 2 === 0;
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
  const pre = ["", "", "groot", "overgroot", "betovergroot", "oud", "oudgroot", "oudovergroot", "oudbetovergroot", "stam", "stamgroot", "stamovergroot", "stambetovergroot", "stamoud"][s];
  if (pre === undefined) return isMale(kw) ? "voorvader" : "voormoeder";
  return pre + (isMale(kw) ? "vader" : "moeder");
}
const GEN_NAME = ["", "Harrie", "ouders", "grootouders", "overgrootouders", "betovergrootouders", "oudouders", "oudgrootouders", "oudovergrootouders", "oudbetovergrootouders", "stamouders", "stamgrootouders", "stamovergrootouders", "stambetovergrootouders", "stamoudouders", "stamoudgrootouders"];
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
  if (/rkf:|haa:|bnl:|archiefrkfriesland/.test(u)) return "Bidprentje";
  if (/swl:/.test(u) || /bevolkingsregister/i.test(label)) return "Bevolkingsregister";
  if (/(frl|hco|dar|gra):/.test(u)) return "Akte";
  if (/graftombe|gravenenverhalen/.test(u)) return "Graf";
  if (/dbnl|raerd|tresoar|allefriezen\.nl\/$/.test(u)) return "Literatuur";
  return "Genealogie";
}
const SRC_ORDER = ["Akte", "Bevolkingsregister", "Bidprentje", "Graf", "Literatuur", "Genealogie"];

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
  roots: `<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="Boom met wortels over een grens"><path d="M8 92H312"/><path d="M200 92V40M200 60L176 36M200 52L226 26M200 70L230 56"/><circle cx="200" cy="36" r="30" fill="currentColor" fill-opacity=".08"/><path d="M200 92C190 108 160 112 120 116C90 119 60 122 30 128M200 92C210 110 230 118 262 126"/><path d="M140 70V110" stroke-dasharray="3 5"/><text x="70" y="70" font-family="IBM Plex Mono, monospace" font-size="12" fill="currentColor" stroke="none">DE</text><text x="232" y="122" font-family="IBM Plex Mono, monospace" font-size="12" fill="currentColor" stroke="none">NL</text></svg>`
};
const ICON = {
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
const VIEWS = ["overzicht", "stamboom", "families", "personen", "verhalen", "tijdlijn", "kaart", "plaats", "beeld", "cijfers", "verwanten", "bronnen", "namen", "lijst"];
const NAV_OF = { plaats: "kaart", verwanten: "verhalen", namen: "personen", lijst: "personen" };
/* vangnet: ontbreekt een paginasectie in index.html, maak hem dan zelf aan */
VIEWS.forEach(x => { if (!$("#v-" + x)) { const sec = document.createElement("section"); sec.className = "view"; sec.id = "v-" + x; sec.hidden = true; $("main").appendChild(sec); } });
const route = { view: "overzicht", sub: null };
const rendered = {};
function go(token, opts = {}) {
  let view = token, sub = null;
  if (/^lijn-\d+$/.test(token)) { view = "families"; sub = +token.slice(5); }
  else if (/^verhaal-/.test(token)) { view = "verhalen"; sub = token.slice(8); }
  else if (/^plaats-/.test(token)) { view = "plaats"; sub = SLUG[token] || null; if (!sub) view = "kaart"; }
  if (!VIEWS.includes(view)) view = "overzicht";
  if (!drawer.hidden && !opts.keepDrawer) closeProfile(true);
  if (!lb.hidden) closeLb(true);
  if (view !== "kaart") stopPlay();
  route.view = view; route.sub = sub;
  VIEWS.forEach(x => { const s = $("#v-" + x); if (s) s.hidden = x !== view; });
  $$("nav.tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.view === (NAV_OF[view] || view) ? "true" : "false"));
  showActiveTab();
  const r = RENDER[view];
  if (["families", "verhalen", "plaats"].includes(view)) r(sub);
  else if (!rendered[view]) { rendered[view] = true; r(); }
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
  const n = $("nav.tabs"), b = $("nav.tabs button[aria-selected=true]");
  if (b && n.scrollWidth > n.clientWidth) { const l = b.offsetLeft - n.offsetLeft, r = l + b.offsetWidth; if (l < n.scrollLeft + 24) n.scrollLeft = l - 24; else if (r > n.scrollLeft + n.clientWidth - 24) n.scrollLeft = r - n.clientWidth + 24; }
  navFade();
}
$("nav.tabs").addEventListener("scroll", navFade, { passive: true });
addEventListener("resize", navFade);
document.addEventListener("click", e => {
  if (e.target.closest("[data-archief]")) { beeldState.kind = "archief"; rendered.beeld = false; go("beeld"); return; }
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
const imgOf = (s, k) => (IMG_KEY[s + ":" + k] || [])[0] || null;
// beelden bij een voorouder (grafsteen, rouwbericht, portret): key = eerste kw, kws = iedereen op het beeld
/* sleutel van een persoon in beelden en archief-packs: "<kw>" bij Harrie, "a-<kw>" bij Alies; in de samengestelde boom de oorspronkelijke sleutel */
const imgKey = kw => { if (T.key !== "s") return T.prefix + kw; const p = person(kw); return p && p.origKw ? (p.side === "a" ? "a-" : "") + p.origKw : "-"; };
/* beelden bij een verhaal: vh = [[verhaal-id, kop van het deel], ...]; ze staan onder dat deel (anders onderaan het verhaal) */
const storyImgs = id => IMGS.filter(i => (i.vh || []).some(v => v[0] === id)).sort((a, b) => (b.soort === "verhaal") - (a.soort === "verhaal"));
const storyFigs = ims => ims.length ? `<div class="vfigs${ims.length > 1 ? " two" : ""}" data-imggroup>${ims.map((im, j) => fig(im, { thumb: ims.length > 1 && !(j === 0 && ims.length % 2) })).join("")}</div>` : "";
const persImgs = kw => { const ik = imgKey(kw); return IMGS.filter(i => i.soort === "persoon" && (String(i.key) === ik || (i.kws || []).map(String).includes(ik))); };
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
const makerOf = im => (im.maker || "").replace(/\s*\((talk|overleg)[^)]*\)/ig, "").replace(/^(unknown|anonymous|onbekend)\b.*$/i, "onbekende maker").trim() || "onbekende maker";
const bronOf = im => im.bronNaam || "Wikimedia Commons";
/* archief-packs (vanaf versie 11). De site kent alleen de kleine index PACKS (data/28-packs.js):
     PACKS = { place: { "<PLACES-sleutel>": [["<pack>", ...], <aantal>] }, kw: { "<kw>": [["<pack>", ...], <aantal>] } }
   De beelden zelf staan in img/packs/<pack>.js, als PACK_DATA("<pack>", [{ id, soort, key, kws, t, desc, maker, bronNaam, bron, datum, lic, licUrl, ref, orig, w, h, data: "data:image/jpeg;base64,..." }]
   ref (leesbare archiefverwijzing) en orig (url van het origineel of de viewer) zijn optioneel; ook in 27-images.js.
   key = PLACES-sleutel (beeld van een plaats) of kw als tekst (beeld van een persoon); kws = alle voorouders op het beeld.
   Een pack wordt pas geladen als een plaatspagina of profiel erom vraagt. Zonder index of bestand (lokaal, file://) blijft alles leeg. */
const PACK_IDX = typeof PACKS !== "undefined" ? PACKS : { place: {}, kw: {} };
const PACK_CACHE = {};
/* zoeklijst van alle archiefbeelden (PACKS.items): Beeld › Uit de archieven en de zoekfunctie. Per boom: plaatsbeelden altijd,
   persoonsbeelden alleen als die persoon in de huidige boom staat (via imgKey, dus ook in de samengestelde boom). */
const ARCH_ALL = (PACK_IDX.items || []).map(a => ({ id: a[0], pack: a[1], soort: a[2], key: String(a[3]), kws: a[4] ? a[4].map(String) : null, t: a[5] || "", datum: a[6] || "", bron: a[7] || "", desc: a[8] || "" }));
const ARCH_TREE = {};
function archList() {
  if (ARCH_TREE[T.key]) return ARCH_TREE[T.key];
  const who = {}; all.forEach(p => { const k = imgKey(p.kw); if (!who[k]) who[k] = p; });
  return ARCH_TREE[T.key] = ARCH_ALL.filter(a => a.kws ? a.kws.some(k => who[k]) : PLACES[a.key]).map(a => {
    const ps = (a.kws || []).map(k => who[k]).filter(Boolean);
    return Object.assign({}, a, { kw: ps.length ? ps[0].kw : null, nt: norm([a.t, a.desc, a.bron, a.datum, a.kws ? "" : placeName(a.key), ...ps.map(p => p.n + " " + (p.alt || ""))].join(" ")) });
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
  }).then(list => (Array.isArray(list) ? list : []).filter(it => it && it.id && it.data).map(it => {
    if (IMG_ID[it.id]) return IMG_ID[it.id];
    let src; try { src = URL.createObjectURL(dataUrlBlob(it.data)); } catch (e) { return null; }
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
    const show = n => `${o.head || ""}<div class="pgal arch" data-imggroup>${items.slice(0, n).map(im => fig(im, { thumb: true })).join("")}</div>${items.length > n ? `<p style="margin:10px 0 0"><button class="btn" data-more-arch>Alle ${items.length} beelden tonen</button></p>` : ""}${o.foot || ""}`;
    host.innerHTML = show(12); host.hidden = false;
    const more = $("[data-more-arch]", host); if (more) more.onclick = () => { host.innerHTML = show(items.length); };
  });
}
/* rechtenaanduiding leesbaar: archieven leveren vaak alleen een URL (rightsstatements.org, creativecommons.org) */
const RS = { "InC": "auteursrecht voorbehouden", "InC-EDU": "auteursrecht, onderwijsgebruik", "InC-NC": "auteursrecht, niet-commercieel", "InC-OW-EU": "auteursrecht, verweesd werk", "InC-RUU": "auteursrecht, rechthebbende onbekend", "NoC-NC": "geen auteursrecht, niet-commercieel", "NoC-OKLR": "geen auteursrecht, andere beperkingen", "NoC-CR": "geen auteursrecht, contractuele beperkingen", "NoC-US": "geen auteursrecht in de VS", "CNE": "auteursrecht niet onderzocht", "UND": "auteursrecht onbepaald", "NKC": "geen bekend auteursrecht" };
function licLabel(lic) {
  const l = String(lic || "").trim(); let m;
  if ((m = /rightsstatements\.org\/vocab\/([A-Za-z-]+)/.exec(l))) return RS[m[1]] || m[1];
  if ((m = /creativecommons\.org\/(licenses|publicdomain)\/([a-z-]+)\/?([\d.]+)?/i.exec(l))) return m[1] === "publicdomain" ? (m[2] === "zero" ? "CC0" : "publiek domein") : "CC " + m[2].toUpperCase() + (m[3] ? " " + m[3] : "");
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
const refLine = im => [im.ref ? esc(im.ref) : "", httpUrl(im.orig) ? `<a href="${esc(im.orig.trim())}" target="_blank" rel="noopener">origineel bekijken</a>` : ""].filter(Boolean).join(" · ");
const credits = ims => { const u = ims.filter((x, i, a) => x && a.indexOf(x) === i); return u.length ? `<p class="small mcredit">${u.length > 1 ? "Foto's" : "Foto"}: ${u.map(credit).join("; ")}</p>` : ""; };
function placeTile(k, sub, title) {
  const im = placeImg(k), key = PLACES[k] && PLACES[k].seat ? PLACES[k].seat : k;
  return `<button class="ptile${im ? "" : " noimg"}" data-go="${slug(key)}">${im ? `<img src="${im.thumb}" alt="" loading="lazy" decoding="async">` : ""}<span class="cap"><b>${esc(title || placeName(key))}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</span></button>`;
}
function topPlaces(ps, n) {
  const c = {}; ps.forEach(p => lifeEvents(p).forEach(e => { const k = e.p && PLACES[e.p] ? mapKey(e.p) : null; if (k && PLACES[k] && !PLACES[k].seat) c[k] = (c[k] || 0) + 1; }));
  return Object.entries(c).sort((a, b) => b[1] - a[1]).filter(x => placeImg(x[0])).slice(0, n);
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
function showLb() {
  const im = IMG_ID[lbList[lbI]], img = $("#lbImg");
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
  $("#lbCap").innerHTML = `<div class="lbt"><b>${esc(im.t)}</b>${lbList.length > 1 ? `<span class="mono small">${lbI + 1} / ${lbList.length}</span>` : ""}</div>${im.desc && norm(im.desc) !== norm(im.t) ? `<p>${esc(im.desc)}</p>` : ""}<p class="credit">${beeldDatum(im.datum) ? esc(beeldDatum(im.datum)) + " · " : ""}${credit(im)}${refLine(im) ? `<br>Bron: ${refLine(im)}` : ""}</p>${go2 || go3 ? `<div class="lbacts">${go2}${go3}</div>` : ""}`;
  $("#lbPrev").hidden = $("#lbNext").hidden = lbList.length < 2;
}
function stepLb(d) { if (lbList.length < 2) return; lbI = (lbI + d + lbList.length) % lbList.length; showLb(); }
function closeLb(silent) { lb.hidden = true; $("#lbImg").removeAttribute("src"); if (!silent && lbFocus && lbFocus.focus) lbFocus.focus(); }
$("#lbClose").onclick = () => closeLb();
$("#lbPrev").onclick = () => stepLb(-1);
$("#lbNext").onclick = () => stepLb(1);
lb.addEventListener("click", e => { if (e.target === lb || e.target.classList.contains("lbstage")) closeLb(); });
lb.addEventListener("keydown", e => {
  if (e.key !== "Tab") return;
  const f = $$("button, a[href]", lb).filter(x => !x.hidden && x.offsetParent !== null); if (!f.length) return;
  const i = f.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
});
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
function goMedia(id) { closeProfile(true); if (!lb.hidden) closeLb(true); go("beeld"); setTimeout(() => { const n = document.getElementById("m-" + id); if (n) { n.scrollIntoView({ block: "center" }); n.classList.add("flash"); setTimeout(() => n.classList.remove("flash"), 1600); } }, 40); }
function openProfile(kw, opts = {}) {
  const p = person(kw); if (!p) return;
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
    <div class="eyebrow">kw ${kw} · generatie ${ROMAN[gen(kw)]} · ${esc(relTerm(kw))}</div>
    <h2 id="dName">${esc(p.n)}</h2>
    ${altBits ? `<div class="alt">${esc(altBits)}</div>` : ""}</div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      ${ln ? `<button class="chip" style="--c:var(--l${ln})" data-go="lijn-${ln}"><i></i>familie ${esc(LINES[ln].name)}</button>` : ""}
      ${p.living ? `<span class="tag" style="color:var(--muted)">levend</span>` : stTag(p.st, true)}
      ${p.living ? "" : chgTag(kw)}
      ${p.link ? `<span class="tag st-${p.link}" title="Status van de koppeling aan het kind in de lijn">koppeling ${p.link}</span>` : ""}
    </div>`;
  let h = "";
  const tw = twinKws(kw);
  if (tw.length) h += `<p class="stnote implex"><b>${["", "", "Twee", "Drie", "Vier", "Vijf"][tw.length + 1] || tw.length + 1} keer in de stamboom.</b> Deze persoon staat ook als kw ${tw.length > 1 ? tw.slice(0, -1).join(", ") + " en " + tw[tw.length - 1] : tw[0]}, via de ${[...new Set(tw.map(t => LINES[lineOf(t)] && LINES[lineOf(t)].name).filter(Boolean))].map(esc).join("- en ")}-lijn. ${esc(T.key === "s" ? TREES[p.side].parents : T.parents)} hebben hier gemeenschappelijke voorouders. ${tw.map(t => `<button class="link" data-open="${t}">Bekijk als kw ${t}</button>`).join(" · ")} · <button class="link" data-go="verhaal-lijnen">Lees het verhaal</button></p>`;
  if (p.living) {
    h += `<p class="stnote">Van levende familieleden staan op deze site alleen de naam en de plaats in de stamboom.</p>`;
    if (kw === 1 && T.sibs && T.sibs.length) h += `<section><h5>Broers en zussen</h5><p style="margin:0">${esc(T.sibs.join(", "))}. Deze stamboom is ook die van hen.</p></section>`;
    if (kw === 1 && T.kids && T.kids.length) h += `<section><h5>Kinderen</h5><p style="margin:0">${esc(T.kids.join(", "))}. <button class="link" data-tree="s">Hun stamboom, met beide families</button></p></section>`;
  } else {
    const rows = [];
    const row = (k, v, f) => { if (v) rows.push([k, v, f ? f.map(x => fieldSt(p, x)).filter(Boolean).sort().pop() : null]); };
    row("Geboren", [fmt(p.b), placeName(p.bp)].filter(Boolean).join(", "), ["b", "bp"]);
    row("Doop", p.bapt);
    if (p.d || p.dp) { const a = age(p); row("Overleden", [fmt(p.d), placeName(p.dp)].filter(Boolean).join(", ") + (a !== null ? ` (${a} jaar)` : ""), ["d", "dp"]); }
    row("Begraven", p.bur, ["bur"]);
    row("Beroep", p.occ);
    row("Geloof", p.rel);
    if (p.m) row("Huwelijk", [p.m.w, p.m.d ? fmt(p.m.d) : "", p.m.p ? placeName(p.m.p) : "", p.m.note || ""].filter(Boolean).join(" · "), ["m"]);
    if (rows.length) h += `<dl class="dl">${rows.map(r => `<dt>${r[0]}</dt><dd>${esc(r[1])} ${r[2] && r[2] !== "A" ? stTag(r[2], true) : ""}</dd>`).join("")}</dl>`;
    if (p.stNote) h += `<p class="stnote"><b>Bewijs:</b> ${esc(p.stNote)}</p>`;
    else h += `<p class="stnote"><b>Bewijs:</b> ${esc(STATUS[p.st].long)}</p>`;
  }
  if (!p.living) {
    const pi = [...new Set([kw, ...twinKws(kw)].flatMap(persImgs))];
    pi.sort((a, b) => (b.portret ? 1 : 0) - (a.portret ? 1 : 0));
    if (pi.length) h += `<section><h5>${pi.some(i => i.portret) ? "Foto's en archief" : "Uit het archief"}</h5><div class="pgal" data-imggroup>${pi.map(im => fig(im, { thumb: true })).join("")}</div></section>`;
    h += `<section id="dArch" hidden></section>`;
  }
  if (!p.living) {
    const pk = []; lifeEvents(p).forEach(e => { if (!e.p || !PLACES[e.p]) return; if (placeImg(e.p) && !pk.some(x => x[2] === e.p)) pk.push([e.p, (e.y ? e.y + " · " : "") + e.t.split(/[;·]/)[0].trim(), e.p]); });
    if (pk.length) h += `<section><h5>Plekken uit dit leven</h5><div class="pstrip">${pk.slice(0, 4).map(x => placeTile(x[0], x[1], placeName(x[2]))).join("")}</div>${credits(pk.slice(0, 4).map(x => placeImg(x[0])))}</section>`;
  }
  h += `<section><h5>Familie</h5><div class="family">${pbtn(kw * 2, "vader")}${pbtn(kw * 2 + 1, "moeder")}${kw > 1 ? pbtn(kw % 2 ? kw - 1 : kw + 1, kw % 2 ? "echtgenoot" : "echtgenote") : ""}${kw > 1 ? pbtn(kw >> 1, T.key === "s" && kw < 4 ? "kinderen" : isMale(kw >> 1) ? "zoon" : "dochter") : ""}</div></section>`;
  if (kw > 3) { const ks = []; for (let k = kw; k >= 1; k >>= 1) ks.unshift(k); h += `<section><h5>Zo hoort ${esc(firstName(p))} bij ${esc(T.root)}</h5><ol class="kpath">${ks.map((k, i) => { const q = person(k); return `<li><span class="kn">${i ? `<span class="ar" aria-hidden="true">→</span>` : ""}${k === kw ? `<b>${esc(firstName(q))}</b>` : `<button class="link" data-open="${k}">${esc(firstName(q))}</button>`}</span><small>${k === 1 ? (T.key === "s" ? "kinderen" : "zelf") : esc(relTerm(k))}</small></li>`; }).join("")}</ol><p class="small" style="margin:6px 0 0">Elke stap is een generatie: van ${esc(T.root)} via ${T.key === "s" ? (ks[1] === 2 ? "Harrie" : "Alies") : `${T.rootMale ? "zijn" : "haar"} ${isMale(ks[1]) ? "vader" : "moeder"}`} terug naar ${esc(firstName(p))}.</p></section>`; }
  if (p.kids && p.kids.length) h += `<section><h5>Kinderen</h5><ul>${p.kids.map(k => `<li>${esc(k)}</li>`).join("")}</ul></section>`;
  if (p.sibs && p.sibs.length) h += `<section><h5>Broers en zussen</h5><ul>${p.sibs.map(k => `<li>${esc(k)}</li>`).join("")}</ul></section>`;
  const ev = p.living ? [] : lifeEvents(p).filter(e => e.p);
  if (ev.length) h += `<section><h5>Levensloop</h5><ul class="restl">${ev.map(e => `<li><span class="y">${e.y ?? "?"}</span><span>${PLACES[e.p] && !PLACES[e.p].seat ? `<button class="link" data-go="${slug(e.p)}">${esc(placeName(e.p))}</button>` : `<b style="font-weight:600">${esc(placeName(e.p))}</b>`} · ${esc(e.t)} ${e.st && e.st !== "A" ? stTag(e.st) : ""}</span></li>`).join("")}</ul>${ev.some(e => PLACES[e.p]) ? `<div class="pane lifemap" id="dLifeMap"></div><p style="margin:10px 0 0"><button class="link" id="dMap">Toon de levensloop op de grote kaart</button></p>` : ""}</section>`;
  if (p.notes && p.notes.length) h += `<section class="notes"><h5>Weetjes</h5>${p.notes.map(n => { const o = noteObj(n); return `<p class="${o.k ? "k" : ""}">${esc(o.t)} ${kindTag(o.k)}</p>`; }).join("")}</section>`;
  const md = mediaOf(kw);
  if (md.length) h += `<section><h5>Beeld</h5><ul class="srclist">${md.map(m => `<li><span class="tag" style="color:var(--muted)">${esc(MEDIA_KINDS[m.kind].label.split(" ")[0].toLowerCase())}</span><button class="link" data-media="${m.id}">${esc(m.t)}</button>${m.unread ? ` <span class="tag" style="color:var(--gold)">nog niet gelezen</span>` : ""}</li>`).join("")}</ul></section>`;
  const nts = NOTABLES.filter(N => N.verdict !== "geen verband" && N.kws.some(k => [kw, ...twinKws(kw)].includes(k)));
  if (nts.length) h += `<section><h5>Bekende verwanten</h5><div class="links">${nts.map(N => `<button class="chip" data-go="verwanten">${esc(N.n)} · ${esc(VERDICT[N.verdict][1].toLowerCase())}</button>`).join("")}</div></section>`;
  const sts = storiesOf(kw);
  if (sts.length) h += `<section><h5>In de verhalen</h5><div class="links">${sts.map(s => `<button class="chip" data-go="verhaal-${s.id}">${esc(s.title)}</button>`).join("")}</div></section>`;
  if (p.open && p.open.length) h += `<section><h5>Nog uit te zoeken</h5><ul>${p.open.map(n => `<li>${esc(n)}</li>`).join("")}</ul></section>`;
  const scans = (p.scan || []).slice();
  (p.src || []).forEach(s => { const m = /frl:([0-9a-f-]{36})/.exec(s[1] || ""); if (m && !scans.some(x => x[1].includes(m[1]))) scans.push([s[0] + " · op AlleFriezen", "https://allefriezen.nl/zoeken/deeds/" + m[1]]); });
  if (scans.length) h += `<section><h5>Scans en originelen</h5><ul>${scans.map(s => `<li><a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a></li>`).join("")}</ul><p class="small" style="margin:8px 0 0">Scans openen in een nieuw tabblad bij het archief.</p></section>`;
  if (p.src && p.src.length) h += `<section><h5>Bronnen</h5><ul class="srclist">${p.src.map(s => { const t = srcType(s[1], s[0]); return `<li><span class="tag" style="color:var(--muted)">${t}</span>${s[1] ? `<a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a>` : `<span>${esc(s[0])}</span>`}</li>`; }).join("")}</ul></section>`;
  if (!p.living) h += `<section><h5>Zoek verder</h5><div class="links">${searchLinks(p).map(l => `<a class="chip" href="${esc(l[1])}" target="_blank" rel="noopener">${esc(l[0])}</a>`).join("")}</div></section>`;
  h += `<p style="margin:0"><button class="btn" id="dTree">Toon in de boom</button></p>`;
  $("#dBody").innerHTML = h;
  drawer.hidden = false; scrim.hidden = false;
  $("#dBody").scrollTop = 0;
  $("#dClose").focus();
  $("#dClose").onclick = () => closeProfile();
  const up = $("#dUp"); if (up) up.onclick = () => openProfile(kw >> 1);
  $("#dTree").onclick = () => { closeProfile(true); treeRoot = kw; setMode("tree"); go("stamboom"); };
  const lm = $("#dLifeMap"); if (lm) lm.appendChild(lifeMap(p));
  const ks = [kw, ...twinKws(kw)], pe = ks.map(k => PACK_IDX.kw[imgKey(k)]).filter(Boolean), iks = ks.map(imgKey);
  if (!p.living && pe.length) archGallery($("#dArch"), [[...new Set(pe.flatMap(e => e[0]))]], im => (im.kws || [im.key]).some(k => iks.includes(String(k))), () => curKw === kw, { head: `<h5>Uit de archieven</h5>` });
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
  uniq.forEach((key, i) => {
    const [x, y] = xy[i], gg = el("g", { class: "place-dot" }, svg);
    el("circle", { cx: x, cy: y, r: 6 * k, fill: lineColor(p.kw), stroke: "var(--surface)", "stroke-width": 2 * k }, gg);
    txt(gg, x + 9 * k, y + 4 * k, (pts.find(q => q.k === key) || {}).lab || key, { "font-size": 12 * k, stroke: "var(--surface)", "stroke-width": 3 * k, "paint-order": "stroke" });
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
  if (route.view === "verhalen" && route.sub) return "verhaal-" + route.sub;
  if (route.view === "plaats" && route.sub) return slug(route.sub);
  return route.view;
}
scrim.addEventListener("click", () => closeProfile());

/* ---------- search ---------- */
const sdlg = $("#sdlg"), sInput = $("#sInput"), sRes = $("#sRes");
let sItems = [], sSel = 0;
const INDEX = [];
function buildIndex() {
  all.forEach(p => INDEX.push({ type: "Personen", title: p.n + (p.roep ? ` (${p.roep})` : ""), sub: `kw ${p.kw} · ${lifeYears(p)}`, ava: avatar(p.kw, "sava"), text: [p.n, p.roep, p.alt, placeName(p.bp), placeName(p.dp), p.occ].join(" "), act: () => openProfile(p.kw) }));
  /* ook de andere boom: wie daar staat, opent in die boom */
  Object.values(TREES).filter(t => t !== T && t.key !== "s" && T.key !== "s").forEach(t => {
    INDEX.push({ type: "Pagina's", title: "Stamboom van " + t.root, sub: t.brand, text: "stamboom kwartierstaat " + t.rootFull + " " + t.brand, act: () => { setTree(t.key); go("overzicht"); } });
    t.PEOPLE.filter(p => !p.alias).forEach(p => INDEX.push({ type: "Personen · stamboom van " + t.root, title: p.n + (p.roep ? ` (${p.roep})` : ""), sub: `kw ${p.kw} · ${p.living ? "levend" : [yr(p.b), yr(p.d)].map(y => y || "?").join(" – ")}`, text: [p.n, p.roep, p.alt, p.living ? "" : placeName(p.bp), p.living ? "" : placeName(p.dp)].join(" "), act: () => { setTree(t.key); go("overzicht", { keepHash: true }); openProfile(p.kw); } }));
  });
  [["Namenregister", "Alle achternamen en patroniemen op alfabet", "namen achternamen register patroniemen alfabet"], ["Kwartierstaat als lijst", "Genummerd, om te lezen of af te drukken", "kwartierstaat lijst afdrukken printen pdf nummers"]].forEach(([t, sub, x], i) => INDEX.push({ type: "Pagina's", title: t, sub, text: t + " " + x, act: () => go(i ? "lijst" : "namen") }));
  LINE_KEYS.forEach(l => INDEX.push({ type: "Families", title: "Familie " + LINES[l].name, sub: LINES[l].sub, text: LINES[l].name + " " + LINES[l].sub + " " + LINES[l].region, act: () => go("lijn-" + l) }));
  Object.keys(PLACES).filter(k => !PLACES[k].seat).forEach(k => INDEX.push({ type: "Plaatsen", title: placeName(k), sub: `${PLACES[k].gem} · ${PLACES[k].prov}`, text: k + " " + placeName(k) + " " + PLACES[k].gem, act: () => go(slug(k)) }));
  STORIES.forEach(s => INDEX.push({ type: "Verhalen", title: s.title, sub: s.lede, text: s.title + " " + s.lede + " " + s.parts.map(x => x.h + " " + x.p.map(q => noteObj(q).t).join(" ")).join(" "), act: () => go("verhaal-" + s.id) }));
  IMGS.filter(i => i.vh).forEach(im => im.vh.map(v => STORIES.find(x => x.id === v[0])).filter(Boolean).forEach(st => INDEX.push({ type: "Beeld", title: im.t, sub: "Bij het verhaal " + st.title, text: [im.t, im.desc, st.title].join(" "), act: () => go("verhaal-" + st.id) })));
  MEDIA.forEach(m => INDEX.push({ type: "Beeld", title: m.t, sub: MEDIA_KINDS[m.kind].label + (m.y ? " · " + m.y : ""), text: m.t + " " + (m.d || "") + " " + placeName(m.p), act: () => goMedia(m.id) }));
  NOTABLES.forEach(N => INDEX.push({ type: "Bekende verwanten", title: N.n, sub: VERDICT[N.verdict][1] + " · " + N.y, text: [N.n, N.alt, N.role, N.rel].join(" "), act: () => { go("verwanten"); setTimeout(() => { const t = document.getElementById("n-" + N.id); if (t) t.scrollIntoView({ block: "start" }); }, 30); } }));
  GLOSSARY.forEach(g => INDEX.push({ type: "Begrippen", title: g[0], sub: g[1], text: g[0] + " " + g[1], act: () => { go("bronnen"); setTimeout(() => { const t = $("#begrippen"); if (t) t.scrollIntoView(); }, 30); } }));
  INDEX.forEach(i => { i.nt = norm(i.text); i.ntitle = norm(i.title); });
}
function openSearch() { sdlg.hidden = false; sInput.value = ""; runSearch(); setTimeout(() => sInput.focus(), 10); }
function closeSearch() { sdlg.hidden = true; }
/* één scrollbalk tegelijk: zolang de lade, de zoekdialoog of de lichtbak open is, staat de pagina eronder stil.
   Een observer op [hidden] vangt elke weg (knop, Escape, terugknop, links naar een andere pagina). */
const syncLock = () => document.documentElement.classList.toggle("lock", !drawer.hidden || !sdlg.hidden || !lb.hidden);
[drawer, sdlg, lb].forEach(n => new MutationObserver(syncLock).observe(n, { attributes: true, attributeFilter: ["hidden"] }));
syncLock();
function hl(s, toks) { let h = esc(s); toks.forEach(t => { if (t.length < 2) return; const re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"); h = h.replace(re, "<mark>$1</mark>"); }); return h; }
function runSearch() {
  const q = norm(sInput.value).trim(), toks = q.split(/\s+/).filter(Boolean);
  let res;
  if (!toks.length) res = [...INDEX.filter(i => i.type === "Families"), ...INDEX.filter(i => i.type === "Verhalen")];
  else res = INDEX.map(i => { if (!toks.every(t => i.nt.includes(t))) return null; let s = 0; toks.forEach(t => { if (i.ntitle.startsWith(t)) s += 4; else if (i.ntitle.includes(t)) s += 2; }); return [s, i]; }).filter(Boolean).sort((a, b) => b[0] - a[0]).map(x => x[1]).slice(0, 40);
  if (toks.length) { const na = archList().filter(a => toks.every(t => a.nt.includes(t))).length;
    if (na) res.splice(Math.min(3, res.length), 0, { type: "Uit de archieven", title: `${na} ${na === 1 ? "archiefbeeld" : "archiefbeelden"} met “${sInput.value.trim()}”`, sub: "Oude foto's, prenten, kaarten en akten", act: () => { beeldState.kind = "archief"; beeldState.q = q; beeldState.raw = sInput.value.trim(); rendered.beeld = false; go("beeld"); } }); }
  sItems = res; sSel = 0;
  if (!res.length) { sRes.innerHTML = `<div class="none">Niets gevonden. Probeer een andere spelling, een voornaam of een plaatsnaam.</div>`; return; }
  const groups = {}; res.forEach((r, i) => (groups[r.type] = groups[r.type] || []).push([r, i]));
  const raw = sInput.value.trim().split(/\s+/).filter(Boolean);
  sRes.innerHTML = Object.keys(groups).map(g => `<h6>${g}</h6>` + groups[g].map(([r, i]) => `<button role="option" data-i="${i}" aria-selected="${i === 0}"${r.ava ? ` class="withava"` : ""}>${r.ava || ""}<b>${hl(r.title, raw)}</b><span>${esc(trunc(r.sub || "", 60))}</span></button>`).join("")).join("");
  $$("#sRes [data-i]").forEach(b => b.onclick = () => pick(+b.dataset.i));
}
function pick(i) { const it = sItems[i]; if (!it) return; closeSearch(); it.act(); }
sInput.addEventListener("input", runSearch);
sInput.addEventListener("keydown", e => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault(); sSel = Math.max(0, Math.min(sItems.length - 1, sSel + (e.key === "ArrowDown" ? 1 : -1)));
    $$("#sRes [data-i]").forEach(b => b.setAttribute("aria-selected", +b.dataset.i === sSel)); const c = $(`#sRes [data-i="${sSel}"]`); if (c) c.scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter") { e.preventDefault(); pick(sSel); }
});
$("#openSearch").onclick = openSearch;
$("#sScrim").onclick = closeSearch;
document.addEventListener("keydown", e => {
  if (!lb.hidden) { if (e.key === "Escape") closeLb(); else if (e.key === "ArrowLeft") stepLb(-1); else if (e.key === "ArrowRight") stepLb(1); return; }
  if (e.key === "Escape") { if (!sdlg.hidden) closeSearch(); else if (!drawer.hidden) closeProfile(); return; }
  const typing = /input|textarea|select/i.test((document.activeElement || {}).tagName || "");
  if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); openSearch(); }
});

/* ---------- fan chart ---------- */
function drawFan(host, { maxGen = 9, labelGen = 7, interactive = true, highlightLine = null } = {}) {
  const R = [0, 58, 126, 192, 268, 344, 412, 460, 498, 530];
  const svg = el("svg", { viewBox: "-540 -540 1080 1080", role: "img", "aria-label": "Waaier met de voorouders van " + T.root + " per generatie" });
  const g = el("g", {}, svg);
  const pt = (r, a) => { const t = a * Math.PI / 180; return [r * Math.cos(t), r * Math.sin(t)]; };
  for (let gn = 2; gn <= maxGen; gn++) {
    const n = 2 ** (gn - 1), r0 = R[gn - 1], r1 = R[gn];
    for (let i = 0; i < n; i++) {
      const kw = n + i, a0 = 90 + i * 360 / n, a1 = a0 + 360 / n;
      const [x1, y1] = pt(r1, a0), [x2, y2] = pt(r1, a1), [x3, y3] = pt(r0, a1), [x4, y4] = pt(r0, a0);
      const d = `M${x1} ${y1}A${r1} ${r1} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r0} ${r0} 0 0 0 ${x4} ${y4}Z`;
      const p = person(kw), dim = highlightLine && lineOf(kw) !== highlightLine && gen(kw) >= 4;
      let attrs;
      if (!p) attrs = { d, fill: "none", stroke: "var(--rule)", "stroke-dasharray": "3 3", "stroke-width": 1 };
      else if (p.living) attrs = { d, fill: "var(--sunk)", stroke: "var(--surface)", "stroke-width": 2 };
      else attrs = { d, fill: lineColor(kw), "fill-opacity": dim ? 0.06 : p.st === "D" ? 0.05 : p.st === "C" ? 0.12 : p.st === "B" ? 0.2 : 0.3, stroke: p.st === "C" || p.st === "D" ? lineColor(kw) : "var(--surface)", "stroke-width": p.st === "C" || p.st === "D" ? 1 : 2, "stroke-dasharray": p.st === "D" ? "1 3" : p.st === "C" ? "3 2" : null };
      if (p && twinKws(kw).length) Object.assign(attrs, { stroke: "var(--gold)", "stroke-width": 2.5, "stroke-dasharray": null });
      const path = el("path", attrs, g);
      if (p && interactive) { path.setAttribute("class", "seg-path"); clickable(path, () => openProfile(kw), p.n); bindTip(path, tipFor(p) + (twinKws(kw).length ? `<br><span style="opacity:.8">staat ook als kw ${twinKws(kw).join(", ")}</span>` : "")); }
      if (p && gn <= Math.min(labelGen, 8)) {
        const am = (a0 + a1) / 2, rm = (r0 + r1) / 2, [cx, cy] = pt(rm, am);
        const l1 = firstName(p), l2 = shortSur(splitName(p.n).sur);
        const lab = el("g", { "pointer-events": "none", opacity: dim ? 0.35 : 1 }, g);
        if (gn <= 3) {
          const fs = gn === 2 ? 16 : 14;
          txt(lab, cx, cy - 2, l1, { "text-anchor": "middle", "font-size": fs, "font-weight": 600 });
          txt(lab, cx, cy + fs, trunc(l2, 14), { "text-anchor": "middle", "font-size": fs - 3, fill: "var(--muted)" });
        } else {
          const fs = [0, 0, 0, 0, 12, 10.5, 9.5, 8, 7][gn], max = Math.floor((r1 - r0) * 0.92 / (fs * 0.56));
          const flip = am > 90 && am < 270, t = el("g", { transform: `translate(${cx} ${cy}) rotate(${flip ? am + 180 : am})` }, lab);
          if (gn <= 6) {
            txt(t, 0, -2, trunc(l1, max), { "text-anchor": "middle", "font-size": fs, "font-weight": 600 });
            txt(t, 0, fs, trunc(l2, max), { "text-anchor": "middle", "font-size": fs - 1, fill: "var(--muted)" });
          } else txt(t, 0, fs / 3, trunc(l1, max), { "text-anchor": "middle", "font-size": fs, "font-weight": 600 });
        }
      }
    }
  }
  const c = el("circle", { r: R[1], fill: "var(--accent)" }, g);
  const ct = el("g", { "pointer-events": "none" }, g);
  if (T.rootLines) T.rootLines.forEach((s, i, a) => txt(ct, 0, 5 + (i - (a.length - 1) / 2) * 15, s, { "text-anchor": "middle", "font-size": 13.5, "font-weight": 600, fill: "var(--accent-ink)" }));
  else txt(ct, 0, -2, T.root, { "text-anchor": "middle", "font-size": Math.min(17, 108 / (T.root.length * 0.56)), "font-weight": 600, fill: "var(--accent-ink)" });
  const sub = T.sibs && T.sibs.length ? "met " + T.sibs.slice(0, -1).join(", ") + (T.sibs.length > 1 ? " en " : "") + T.sibs[T.sibs.length - 1] : "";
  if (sub) txt(ct, 0, 16, sub, { "text-anchor": "middle", "font-size": Math.min(9.5, 104 / (sub.length * 0.55)), fill: "var(--accent-ink)" });
  if (interactive) { c.style.cursor = "pointer"; c.addEventListener("click", () => openProfile(1)); }
  if (labelGen >= 4) {
    txt(g, -520, -510, "vaders kant", { "font-size": 14, fill: "var(--muted)", "font-family": "var(--mono)" });
    txt(g, 520, -510, "moeders kant", { "font-size": 14, fill: "var(--muted)", "text-anchor": "end", "font-family": "var(--mono)" });
  }
  host.innerHTML = ""; host.appendChild(svg);
}

/* ---------- pedigree tree ---------- */
let treeRoot = 1, mode = "fan";
function setMode(m) {
  mode = m;
  $("#modeFan").setAttribute("aria-pressed", m === "fan"); $("#modeTree").setAttribute("aria-pressed", m === "tree");
  $("#fanPane").hidden = m !== "fan"; $("#treePane").hidden = m !== "tree";
  $("#treeHint").textContent = m === "tree" ? "Klik een naam voor het profiel; klik › om verder terug te gaan." : "";
  if (m === "tree") drawTree();
}
function drawTree() {
  const W = 1016, colX = [12, 262, 512, 762], bw = 218, bh = 56, slot = 68, top = 18, H = top * 2 + slot * 8;
  const centers = [];
  centers[3] = Array.from({ length: 8 }, (_, j) => top + slot / 2 + j * slot);
  for (let c = 2; c >= 0; c--) centers[c] = Array.from({ length: 2 ** c }, (_, j) => (centers[c + 1][2 * j] + centers[c + 1][2 * j + 1]) / 2);
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Stamboom in vier generaties" });
  const lines = el("g", { fill: "none", stroke: "var(--rule)", "stroke-width": 1.5 }, svg);
  const kwAt = (c, j) => treeRoot * 2 ** c + j;
  for (let c = 0; c < 3; c++) for (let j = 0; j < 2 ** c; j++) {
    const x1 = colX[c] + bw, y = centers[c][j], x2 = colX[c + 1], mx = (x1 + x2) / 2;
    [2 * j, 2 * j + 1].forEach(k => el("path", { d: `M${x1} ${y}H${mx}V${centers[c + 1][k]}H${x2}` }, lines));
  }
  for (let c = 0; c < 4; c++) for (let j = 0; j < 2 ** c; j++) {
    const kw = kwAt(c, j), p = person(kw), x = colX[c], y = centers[c][j] - bh / 2;
    const g = el("g", { class: p ? "node" : "" }, svg);
    if (!p) {
      el("rect", { x, y, width: bw, height: bh, rx: 8, fill: "none", stroke: "var(--rule)", "stroke-dasharray": "4 3" }, g);
      txt(g, x + 12, y + 22, "nog niet gevonden", { "font-size": 13, fill: "var(--faint)" });
      txt(g, x + 12, y + 40, `kw ${kw}`, { "font-size": 11.5, fill: "var(--faint)", "font-family": "var(--mono)" });
      continue;
    }
    el("rect", { class: "box", x, y, width: bw, height: bh, rx: 8, fill: "var(--surface)", stroke: "var(--rule)", "stroke-width": 1.2, "stroke-dasharray": !p.living && p.st === "D" ? "1 3" : !p.living && p.st === "C" ? "4 3" : null }, g);
    el("rect", { x, y: y + 8, width: 4, height: bh - 16, rx: 2, fill: lineColor(kw) }, g);
    /* portret: rond fotootje links in het vak, de tekst schuift op */
    const port = portraitOf(kw), tx = port ? 56 : 14;
    if (port) {
      const cid = "pc" + kw, cl = el("clipPath", { id: cid }, el("defs", {}, g));
      el("circle", { cx: x + 32, cy: y + bh / 2, r: 19 }, cl);
      el("circle", { cx: x + 32, cy: y + bh / 2, r: 20.5, fill: "var(--sunk)", stroke: lineColor(kw), "stroke-width": 1.5 }, g);
      el("image", { href: port.thumb, x: x + 13, y: y + bh / 2 - 19, width: 38, height: 38, preserveAspectRatio: parseFloat(cropOf(port).split(" ")[1]) < 40 ? "xMidYMin slice" : "xMidYMid slice", "clip-path": `url(#${cid})` }, g);
    }
    txt(g, x + tx, y + 20, trunc(p.n, port ? 19 : 24), { "font-size": 13.5, "font-weight": 600 });
    txt(g, x + tx, y + 36, lifeYears(p), { "font-size": 12, "font-family": "var(--mono)", fill: "var(--muted)" });
    txt(g, x + tx, y + 50, trunc(([placeName(p.bp), p.occ].filter(Boolean)[0] || "").split(";")[0], port ? 24 : 30), { "font-size": 11.5, fill: "var(--muted)" });
    txt(g, x + bw - 10, y + 20, p.living ? "" : p.st, { "font-size": 10.5, fill: `var(--${{ A: "good", B: "warn", C: "weak" }[p.st] || "faint"})`, "text-anchor": "end", "font-family": "var(--mono)" });
    clickable(g, () => openProfile(kw), p.n);
    if (c === 3 && (person(kw * 2) || person(kw * 2 + 1))) {
      const b = el("g", { class: "node", transform: `translate(${x + bw + 18} ${centers[c][j]})` }, svg);
      el("circle", { r: 13, fill: "var(--accent)" }, b);
      txt(b, 0, 5, "›", { "text-anchor": "middle", "font-size": 18, fill: "var(--accent-ink)", "font-weight": 600 });
      clickable(b, e => { e.stopPropagation(); treeRoot = kw; drawTree(); }, "Verder terug vanaf " + p.n);
    }
  }
  $("#tree").innerHTML = ""; $("#tree").appendChild(svg);
  const chain = []; for (let k = treeRoot; k >= 1; k = k >> 1) chain.unshift(k);
  $("#crumbs").innerHTML = `<span>Vanaf:</span>` + chain.map((k, i) => {
    const p = person(k), name = p ? firstName(p) + " " + shortSur(splitName(p.n).sur) : "kw " + k;
    return i === chain.length - 1 ? `<b style="color:var(--ink)">${esc(name)}</b>` : `<button data-root="${k}">${esc(name)}</button><span>›</span>`;
  }).join(" ");
  $$("#crumbs [data-root]").forEach(b => b.onclick = () => { treeRoot = +b.dataset.root; drawTree(); });
}

/* ---------- overzicht ---------- */
function statusBars() {
  const cnt = { A: 0, B: 0, C: 0, D: 0 }; ancestors.forEach(p => cnt[p.st]++);
  const tot = ancestors.length;
  return ["A", "B", "C", "D"].filter(s => cnt[s]).map(s => `
    <div style="display:grid;grid-template-columns:96px minmax(0,1fr) 40px;gap:10px;align-items:center;margin:8px 0">
      ${stTag(s, true)}
      <span style="height:10px;background:var(--sunk);border-radius:5px;overflow:hidden"><span class="st-${s}" style="display:block;height:100%;width:${(cnt[s] / tot * 100).toFixed(1)}%;background:currentColor"></span></span>
      <span class="mono small" style="text-align:right">${cnt[s]}</span></div>`).join("");
}
function statusByGen() {
  const maxG = Math.max(...ancestors.map(p => gen(p.kw)));
  let h = "";
  for (let g = 3; g <= maxG; g++) {
    const ps = ancestors.filter(p => gen(p.kw) === g), c = { A: 0, B: 0, C: 0, D: 0 }; ps.forEach(p => c[p.st]++);
    const tot = 2 ** (g - 1);
    h += `<div class="sgen" title="Generatie ${ROMAN[g]}: ${ps.length} van ${tot} gevonden (A ${c.A}, B ${c.B}, C ${c.C}, D ${c.D})"><span class="mono">${ROMAN[g]}</span><span class="sbar">${["A", "B", "C", "D"].map(s => c[s] ? `<i class="st-${s}" style="width:${(c[s] / ps.length * 100).toFixed(1)}%"></i>` : "").join("")}</span><span class="mono small">${ps.length}</span></div>`;
  }
  return `<h5 class="eyebrow" style="margin:16px 0 8px">Per generatie</h5>${h}<p class="small" style="margin:8px 0 0">Elke balk is de verdeling van A tot D binnen de gevonden voorouders van die generatie; rechts het aantal, zonder dubbele vakken door kwartierverlies.</p>`;
}
function storyCard(s) { return `<button class="storycard" data-go="verhaal-${s.id}"><div class="art">${ART[s.art] || ART.farm}</div><div class="tx"><span class="eyebrow">Verhaal${s.side ? " · kant van " + (s.side === "h" ? "Harrie" : "Alies") : ""}</span><h3>${esc(s.title)}</h3><p>${esc(s.lede)}</p></div></button>`; }
function factCard(f) { return `<article class="fact"><span class="yr"><span>${esc(f.y)}</span>${stTag(f.st)}</span><h3>${esc(f.t)}</h3><p>${esc(f.x)}</p><div class="acts"><button class="link" data-open="${f.kw}">${esc(person(f.kw).n)}</button>${f.story ? `<button class="link" data-go="verhaal-${f.story}">Lees het verhaal</button>` : ""}</div></article>`; }
function renderOverzicht() {
  const S = STATS || (STATS = computeStats());
  const gens = Math.max(...ancestors.map(p => gen(p.kw)));
  const cl = CHANGELOG[0];
  $("#v-overzicht").innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow">Stamboom van ${esc(T.rootFull)} · <span class="nw">${esc(VERSION).split(" · ").join('</span> · <span class="nw">')}</span></div>
        <h1>${T.TXT.heroTitle || "Boeren, veehouders en grutters uit <em>Friesland</em> en de Kop van Overijssel"}</h1>
        <p class="lede">${T.TXT.heroLede ? esc(T.TXT.heroLede.replace("{oldest}", S.oldestYearAB)) : `De voorouders van Harrie de Groot en zijn broers en zussen, met bronnen terug tot ${S.oldestYearAB}. Acht families, bijna allemaal katholiek, die grotendeels binnen een straal van enkele tientallen kilometers bleven wonen. In de familie: een heilige, een kanunnik en een doopsgezinde tak.`}</p>
        <div class="stats">${[[ancestors.length, "voorouders gevonden"], [gens, "generaties"], [S.nPlaces, "dorpen en steden"], [S.oldestYearAB, "oudste jaartal met bron"]].map(s => `<div class="stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join("")}</div>
        <div class="cta"><button class="btn primary" data-go="stamboom">Bekijk de stamboom</button><button class="btn" data-go="verhalen">Lees de verhalen</button><button class="btn" id="heroSearch">Zoek een naam</button></div>
      </div>
      <div class="hero-fan" id="heroFan"></div>
    </div>
    <div class="section-head"><h2>Zo is deze site opgebouwd</h2><p>Begin bij het grote plaatje en zoom in tot de akte.</p></div>
    <div class="layers">
      ${[["stamboom", "fan", "Stamboom", "Alle voorouders in een waaier, of stap voor stap terug in de boom."],
         ["families", "fam", "Families", "De acht familielijnen, elk met eigen verhaal, stamvaders en plaatsen."],
         ["personen", "card", "Personen", "Een profiel per persoon: data, familie, levensloop, scans en bronnen."],
         ["verhalen", "book", "Verhalen", T.TXT.layerVerhalen || "De rode draden: de naam De Groot, het katholieke leven, verhuizingen."],
         ["tijdlijn", "clock", "Tijdlijn", "Welke levens elkaar overlapten, tegen de achtergrond van hun tijd."],
         ["kaart", "pin", "Kaart", "Wie woonde waar, en hoe de families zich verplaatsten."],
         ["beeld", "photo", "Beeld", "Bidprentjes, kerken, kerkhoven, krantenberichten en foto's per dorp."],
         ["cijfers", "chart", "Cijfers", "Levensduur, trouwdagen, namen, beroepen en geld, berekend uit de akten."],
         ["verwanten", "star", "Bekende verwanten", T.TXT.layerVerwanten || "Een heilige, een kanunnik, en wat er van adel en macht klopt."],
         ["bronnen", "archive", "Bronnen", "Hoe betrouwbaar alles is, wat nog open staat en waar je verder zoekt."]].map(l => `<button class="layer" data-go="${l[0]}">${ICON[l[1]]}<span><h3>${l[2]}</h3><p>${l[3]}</p></span></button>`).join("")}
    </div>
    <div class="section-head"><h2>De acht families</h2><p>Elke overgrootouder opent een eigen lijn.</p></div>
    <div class="grid-4">${LINE_KEYS.map(famCard).join("")}</div>
    ${(() => { const fp = ancestors.filter(p => portraitOf(p.kw)); return fp.length ? `<div class="section-head"><h2>Gezichten uit de familie</h2><p>${fp.length === 1 ? "Eén voorouder" : fp.length + " voorouders"} van wie een foto bewaard is gebleven. Klik een gezicht voor het profiel. Foto's uit familiebezit van overleden voorouders kunnen er later bij. <button class="link" id="seePortraits">Alle portretten</button></p></div><div class="faces">${fp.map(faceCard).join("")}</div>` : ""; })()}
    ${IMGS.length ? (() => { const tp = topPlaces(ancestors, 8); return tp.length >= 4 ? `<div class="section-head"><h2>Waar ze woonden</h2><p>De dorpen die het vaakst in de akten staan. <button class="link" id="seePhotos">Alle foto's en oude kaarten</button></p></div><div class="ptiles band">${tp.map(x => placeTile(x[0], x[1] + " keer in de akten")).join("")}</div>${credits(tp.map(x => placeImg(x[0])))}` : ""; })() : ""}
    ${NOTABLES.some(N => N.verdict === "bewezen") ? `<div class="section-head"><h2>Bekende verwanten</h2><p>Zit er iemand uit de geschiedenisboeken in de familie? <button class="link" data-go="verwanten">Alles over adel, macht en geld</button></p></div>
    <div class="grid-3 nminis">${NOTABLES.filter(N => N.verdict === "bewezen" && N.id !== "overmeer").map(N => notableCard(N, true)).join("")}<button class="notable-mini more" data-go="cijfers"><span class="eyebrow">Cijfers</span><h3>De familie in getallen</h3><p>Hoe oud werden ze, op welke dag trouwden ze, en hoeveel was een boerderij waard?</p><span class="verdict v-muted">Naar de cijfers</span></button></div>` : ""}
    ${STORIES.length ? `<div class="section-head"><h2>Verhalen</h2><p><button class="link" data-go="verhalen">Alle ${STORIES.length} verhalen</button></p></div>
    <div class="grid-3">${STORIES.slice(0, 3).map(storyCard).join("")}</div>` : ""}
    ${FACTS.length ? `<div class="section-head"><h2>Opvallend</h2><p>Feiten uit de akten, met hun bewijsstatus.</p></div>
    <div class="grid-3 facts-more" id="factGrid">${FACTS.map(factCard).join("")}</div>${FACTS.length > 6 ? `<p style="margin:14px 0 0"><button class="btn" id="moreFacts">Alle ${FACTS.length} feiten tonen</button></p>` : ""}` : ""}
    <div class="section-head"><h2>Hoe betrouwbaar is dit?</h2><p>Elk gegeven heeft een label voor de sterkte van het bewijs. <button class="link" data-go="bronnen">Meer over de bronnen</button></p></div>
    <div class="cols">
      <div class="box"><h3>Status van de voorouders</h3>${statusBars()}<p class="small" style="margin:10px 0 0">${esc(T.TXT.statusNote || "Generatie I tot en met V staat bijna volledig op akten. Verder terug leunt de boom meer op genealogieën van anderen.")}</p>${statusByGen()}</div>
      <div class="box"><h3>Nieuw in ${esc(cl.v.toLowerCase())}</h3><ul>${cl.items.slice(0, 5).map(i => `<li>${esc(i)}</li>`).join("")}</ul>${NEWSET.size || UPDSET.size ? `<p style="margin:12px 0 0;display:flex;gap:16px;flex-wrap:wrap">${NEWSET.size ? `<button class="link" id="seeNew">De ${NEWSET.size} nieuwe voorouders</button>` : ""}${UPDSET.size ? `<button class="link" id="seeUpd">De ${UPDSET.size} bijgewerkte profielen</button>` : ""}</p>` : ""}</div>
    </div>`;
  drawFan($("#heroFan"), { maxGen: 9, labelGen: 3 });
  $("#heroSearch").onclick = openSearch;
  const mf = $("#moreFacts"); if (mf) mf.onclick = () => { $("#factGrid").classList.remove("facts-more"); mf.remove(); };
  const sn = $("#seeNew"); if (sn) sn.onclick = () => showChanged("new");
  const su = $("#seeUpd"); if (su) su.onclick = () => showChanged("upd");
  const sp = $("#seePhotos"); if (sp) sp.onclick = () => { beeldState.kind = "foto"; rendered.beeld = false; go("beeld"); };
  const spp = $("#seePortraits"); if (spp) spp.onclick = () => { beeldState.kind = "portret"; rendered.beeld = false; go("beeld"); };
}
function faceCard(p) {
  const im = portraitOf(p.kw), sn = splitName(p.n);
  return `<button class="face" style="--c:${lineColor(p.kw)}" data-open="${p.kw}"><span class="pava big"><img src="${im.thumb}" alt="" loading="lazy" decoding="async" style="object-position:${cropOf(im)}"></span><b>${esc(firstName(p))} ${esc(shortSur(sn.sur))}</b><small class="mono">${esc(lifeYears(p))}</small><small>${esc(relTerm(p.kw))}</small></button>`;
}
function famCard(l) {
  const ps = ancestors.filter(p => p.kw >= 8 && lineOf(p.kw) === l);
  const oldest = Math.min(...ps.filter(p => p.st === "A" || p.st === "B").map(p => Math.min(yr(p.b) || 9999, yr(p.d) || 9999, ...(p.res || []).map(r => r.y))));
  const deep = Math.max(...ps.map(p => gen(p.kw)));
  return `<button class="fam" style="--c:var(--l${l})" data-go="lijn-${l}">
    <span class="sw"><i></i>${esc(LINES[l].region.toUpperCase())}</span>
    <h3>${esc(LINES[l].name)}</h3><p>${esc(LINES[l].sub)}</p>
    <span class="meta">${ps.length} personen · tot generatie ${ROMAN[deep]}${oldest < 9999 ? ` · vanaf ${oldest}` : ""}</span></button>`;
}

/* ---------- stamboom ---------- */
function renderStamboom() {
  drawFan($("#fan"), { maxGen: 9, labelGen: 7 });
  let comp = "";
  for (let g = 2; g <= Math.max(...ancestors.map(p => gen(p.kw))); g++) {
    const tot = 2 ** (g - 1); let f = 0; for (let k = tot; k < tot * 2; k++) if (person(k)) f++;
    comp += `<div style="display:grid;grid-template-columns:34px minmax(0,1fr) 54px;gap:8px;align-items:center;margin:5px 0;font-size:12.5px"><span class="mono">${ROMAN[g]}</span><span style="height:8px;background:var(--sunk);border-radius:4px;overflow:hidden"><span style="display:block;height:100%;width:${f / tot * 100}%;background:var(--accent)"></span></span><span class="mono" style="text-align:right">${f}/${tot}</span></div>`;
  }
  $("#fanSide").innerHTML = `
    <div><h5>Familielijnen</h5><div class="legend" style="flex-direction:column;gap:6px">${LINE_KEYS.map(l => `<button class="chip" style="--c:var(--l${l});border:0;padding:0;background:none" data-go="lijn-${l}"><i></i>${esc(LINES[l].name)}</button>`).join("")}</div></div>
    <div><h5>Gevonden per generatie</h5>${comp}</div>
    <div><h5>Zo lees je de vakken</h5><p style="margin:0">Hoe voller de kleur, hoe sterker het bewijs. Een gestippelde rand: alleen uit online stambomen (C). Een fijn gestippelde, bijna lege rand: een hypothese (D). Een gestippeld leeg vak: nog niet gevonden. Een gouden rand: dezelfde persoon staat twee keer in de stamboom (<button class="link" data-go="verhaal-lijnen">kwartierverlies</button>).</p><p style="margin:8px 0 0">De waaier toont negen generaties. Wie verder terug ligt, generatie X${Math.max(...ancestors.map(p => gen(p.kw))) > 10 ? " tot en met " + ROMAN[Math.max(...ancestors.map(p => gen(p.kw)))] : ""}, vind je bij <button class="link" data-go="personen">Personen</button>.</p></div>`;
  $("#modeFan").onclick = () => setMode("fan");
  $("#modeTree").onclick = () => setMode("tree");
  setMode(mode);
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
  list.slice(0, nLabels).forEach(a => { const P = PLACES[a.key], [x, y] = proj(P.la, P.lo), r = 4 + 2.4 * Math.sqrt(a.people.size); txt(labels, x + r + 3, y + 4, a.key, { "font-size": 12, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 3, "paint-order": "stroke" }); });
  return svg;
}
function renderFamilies(l) {
  const host = $("#v-families");
  if (!l || !LINES[l]) {
    host.innerHTML = `<div class="eyebrow">Families</div><h1 class="page-title">Acht families, acht lijnen</h1>
      <p class="lede">Elk van de acht overgrootouders van ${esc(T.root)} opent een eigen lijn naar het verleden. Kies een familie voor haar verhaal, stamvaders, plaatsen en alle voorouders.</p>
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
    <div class="eyebrow"><button class="link" data-go="families">Families</button> › ${esc(L.name)}</div>
    <div class="linehead" style="--c:var(--l${l});margin-top:12px">
      <div>
        <div class="eyebrow">Lijn ${l} · ${esc(L.region)}</div>
        <h1>${esc(L.name)}</h1>
        <p class="small" style="font-size:14px;margin:4px 0 0">met ${esc(L.sub)}</p>
        <p class="lede" style="color:var(--ink)">${esc(L.intro)}</p>
        <p class="small" style="margin-top:12px">${ps.length} voorouders · ${stTag("A")} ${cnt.A} · ${stTag("B")} ${cnt.B} · ${stTag("C")} ${cnt.C || 0}${cnt.D ? ` · ${stTag("D")} ${cnt.D}` : ""}</p>
        <div class="cta"><button class="btn" id="lnMap">Toon op de kaart</button><button class="btn" id="lnTl">Toon in de tijdlijn</button><button class="btn" id="lnTree">Open in de boom</button></div>
      </div>
      <div><h5 class="eyebrow" style="margin:0 0 8px">Stamlijn, van jong naar oud</h5><div class="stem" style="--c:var(--l${l})">${stem.map(p => `<button data-open="${p.kw}"><span class="g">gen. ${ROMAN[gen(p.kw)]}</span><span><b>${esc(p.n)}</b><small>${esc(lifeYears(p))} · ${p.st}</small></span></button>`).join("")}</div></div>
    </div>
    ${(() => { const fp = ps.filter(p => portraitOf(p.kw)); return fp.length ? `<div class="section-head"><h2>Gezichten uit deze familie</h2><p>${fp.length === 1 ? "Eén voorouder" : fp.length + " voorouders"} uit deze lijn van wie een foto bewaard is gebleven.</p></div><div class="faces">${fp.map(faceCard).join("")}</div>` : ""; })()}
    <div class="section-head"><h2>Alle voorouders in deze lijn</h2><p>Per generatie, van jong naar oud. Klik een generatie om haar open of dicht te klappen.</p></div>
    ${[...new Set(ps.map(p => gen(p.kw)))].map(g => { const gp = ps.filter(p => gen(p.kw) === g), lc = { A: 0, B: 0, C: 0, D: 0 }; gp.forEach(p => lc[p.st]++); return `<details class="gen-det pane"${g <= 6 ? " open" : ""}><summary><span class="eyebrow">Generatie ${ROMAN[g]} · ${esc(GEN_NAME[g])}</span><span class="small">${gp.length} ${gp.length === 1 ? "persoon" : "personen"} · ${["A", "B", "C", "D"].filter(s => lc[s]).map(s => `${stTag(s)} ${lc[s]}`).join(" ")}</span></summary>
    <div class="scroll-x"><table class="mini"><thead><tr><th>kw</th><th>Naam</th><th>Leven</th><th>Plaatsen</th><th>Beroep</th><th>Status</th></tr></thead><tbody>
      ${gp.map(p => `<tr><td class="y">${p.kw}</td><td><button class="link" data-open="${p.kw}">${esc(p.n)}</button><br><span class="small">${esc(relTerm(p.kw))}</span></td><td class="y">${esc(lifeYears(p))}</td><td class="small">${esc([placeName(p.bp), placeName(p.dp)].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(" → "))}</td><td class="small">${esc((p.occ || "").split(";")[0])}</td><td>${stTag(p.st)}</td></tr>`).join("")}
    </tbody></table></div></details>`; }).join("")}
    <div class="section-head"><h2>Plaatsen</h2><p>Dorpen waar deze lijn woonde, trouwde of overleed. De grijze stippen zijn dorpen van de andere families.</p></div>
    <div class="pane" style="margin-bottom:14px"><div class="map-wrap"><div class="map" id="lnMapSvg"></div><aside class="map-side"><h5 class="eyebrow" style="margin:0">Alle dorpen, met het aantal vermeldingen in de akten</h5>
    <div class="chips">${Object.entries(places).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<button class="chip" style="--c:var(--l${l})" data-go="${slug(k)}"><i></i>${esc(placeName(k))} <span class="mono">${n}</span></button>`).join("")}</div></aside></div></div>
    ${(() => { const tp = topPlaces(ps, 6); return tp.length >= 3 ? `<div class="ptiles">${tp.map(x => placeTile(x[0], x[1] + " keer in de akten")).join("")}</div>${credits(tp.map(x => placeImg(x[0])))}` : ""; })()}
    ${sts.length ? `<div class="section-head"><h2>Verhalen</h2></div><div class="grid-3">${sts.map(storyCard).join("")}</div>` : ""}
    <div class="section-head"><h2>Andere families</h2></div>
    <div class="chips">${LINE_KEYS.filter(x => x !== l).map(x => `<button class="chip" style="--c:var(--l${x})" data-go="lijn-${x}"><i></i>${esc(LINES[x].name)}</button>`).join("")}</div>`;
  $("#lnMapSvg").appendChild(dotMap(EVENTS.filter(e => lineOf(e.kw) === l), "Kaart met de dorpen van de familie " + L.name, 10));
  $("#lnMap").onclick = () => { mapState.lines = new Set([l]); mapFocusPerson = null; mapState.place = null; go("kaart"); syncMapChips(); renderMap(); };
  $("#lnTl").onclick = () => { tlState.lines = new Set([l]); go("tijdlijn"); syncTlChips(); drawTimeline(); };
  $("#lnTree").onclick = () => { treeRoot = l; setMode("tree"); go("stamboom"); };
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
function renderPersonen() {
  $("#genSel").innerHTML = `<option value="all">Alle generaties</option>` + Array.from({ length: Math.max(...ancestors.map(p => gen(p.kw))) }, (_, i) => `<option value="${i + 1}">Generatie ${ROMAN[i + 1]} · ${GEN_NAME[i + 1]}</option>`).join("");
  $("#stChips").innerHTML = ["A", "B", "C", "D"].map(s => `<button class="chip st-${s}" aria-pressed="false" data-s="${s}">status ${s}</button>`).join("");
  $$("#stChips [data-s]").forEach(b => b.onclick = () => { const s = b.dataset.s; cardState.st.has(s) ? cardState.st.delete(s) : cardState.st.add(s); b.setAttribute("aria-pressed", cardState.st.has(s)); renderCards(); });
  $("#q").oninput = e => { cardState.q = norm(e.target.value); renderCards(); };
  $("#genSel").onchange = e => { cardState.gen = e.target.value; renderCards(); };
  $("#cardsOut").addEventListener("toggle", e => { const d = e.target; if (!d.matches || !d.matches(".gen-fold")) return; d.open ? cardState.open.add(+d.dataset.g) : cardState.open.delete(+d.dataset.g); }, true);
  $("#sortSel").onchange = e => { cardState.sort = e.target.value; renderCards(); };
  syncLineChips(); syncChgChips(); renderCards();
}
function cardHtml(p) {
  const ln = lineOf(p.kw), pl = [placeName(p.bp), placeName(p.dp)].filter(Boolean);
  const plTxt = pl.length === 2 && pl[0] !== pl[1] ? `${pl[0]} → ${pl[1]}` : (pl[0] || "");
  if (p.living) return `<button class="card living" data-open="${p.kw}"><div class="row1"><span class="ln">levend</span><span class="kw">kw ${p.kw}</span></div><h4>${esc(p.n)}</h4>${p.roep ? `<div class="pl">${esc(p.roep)}</div>` : ""}</button>`;
  const unc = p.unc ? Object.values(p.unc).some(v => v !== "A") : false;
  return `<button class="card" style="--c:${ln ? `var(--l${ln})` : "var(--accent)"}" data-open="${p.kw}">
    <div class="row1"><span class="ln"><i></i>${ln ? esc(LINES[ln].name) : ""}</span><span class="kw">kw ${p.kw}</span></div>
    <h4${portraitOf(p.kw) ? ` class="withava"` : ""}>${avatar(p.kw)}<span>${esc(p.n)}${p.roep ? ` <span style="font-family:var(--body);font-size:14px;color:var(--muted)">(${esc(p.roep)})</span>` : ""}</span></h4>
    <div class="yrs">${esc(lifeYears(p))}${unc ? ` <span class="small" title="Sommige gegevens zijn onzeker">· deels onzeker</span>` : ""}</div>
    ${plTxt ? `<div class="pl">${esc(plTxt)}</div>` : ""}
    ${p.occ ? `<div class="occ">${esc(p.occ.split(";")[0])}</div>` : ""}
    <div class="foot"><span>${esc(relTerm(p.kw))}${p.notes && p.notes.length ? ` · ${p.notes.length} weetje${p.notes.length > 1 ? "s" : ""}` : ""}</span><span style="display:inline-flex;gap:6px;align-items:center">${chgTag(p.kw)}${stTag(p.st)}</span></div></button>`;
}
function renderCards() {
  const s = cardState;
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
function renderVerhalen(id) {
  const host = $("#v-verhalen");
  const s = STORIES.find(x => x.id === id);
  if (!s) {
    host.innerHTML = `<div class="eyebrow">Verhalen</div><h1 class="page-title">De rode draden</h1>
      <p class="lede">${T.TXT.verhalenLede ? esc(T.TXT.verhalenLede) : "Wat de akten samen vertellen: over namen, geloof, verhuizingen, jonge weduwen en ooms en tantes die uitzwermden. Bij elk deel staat hoe zeker het is."}</p>
      ${T.key === "h" ? `<button class="vbanner" data-go="verwanten"><span class="eyebrow">Ook lezen</span><b>Bekende verwanten: adel, macht, geld of geschiedenis?</b><span>Titus Brandsma, pastoor Spitzen en de naamgenoten Lycklama à Nijeholt en Ter Wischa, met wat wel en niet bewezen is.</span></button>` : ""}
      <div class="grid-3" style="margin-top:22px">${STORIES.map(storyCard).join("")}</div>`;
    return;
  }
  const i = STORIES.indexOf(s), next = STORIES[(i + 1) % STORIES.length], prev = STORIES[(i - 1 + STORIES.length) % STORIES.length];
  host.innerHTML = `<article class="story">
    <div class="eyebrow"><button class="link" data-go="verhalen">Verhalen</button> › ${i + 1} van ${STORIES.length}</div>
    <h1>${esc(s.title)}</h1>
    <p class="lede" style="font-size:19px">${esc(s.lede)}</p>
    ${(() => { const tp = topPlaces(s.people.map(person).filter(p => p && !p.living), 3); return tp.length === 3 ? `<div class="mosaic" data-imggroup>${tp.map((x, j) => fig(placeImg(x[0]), { thumb: j > 0, cap: placeName(x[0]), credit: false })).join("")}</div>${credits(tp.map(x => placeImg(x[0])))}` : `<div class="art">${ART[s.art] || ART.farm}</div>`; })()}
    ${(() => { const si = storyImgs(s.id), deel = im => im.vh.find(v => v[0] === s.id)[1], heads = s.parts.map(x => x.h), rest = si.filter(im => !heads.includes(deel(im)));
      return s.parts.map(part => `<h2>${esc(part.h)} ${stTag(part.st, true)}</h2>${part.p.map(q => { const o = noteObj(q); return o.k ? `<p class="kind k-${o.k}"><span class="t">${esc(o.t)}</span> ${kindTag(o.k)}</p>` : `<p>${esc(o.t)}</p>`; }).join("")}${storyFigs(si.filter(im => deel(im) === part.h))}`).join("")
        + (rest.length ? `<h2>Beelden bij dit verhaal</h2>${storyFigs(rest)}` : ""); })()}
    <h2>Mensen in dit verhaal</h2>
    <div class="peoplechips">${s.people.map(k => person(k)).filter(Boolean).map(p => `<button class="chip" style="--c:${lineColor(p.kw)}" data-open="${p.kw}"><i></i>${esc(p.n)} <span class="mono">${esc(lifeYears(p))}</span></button>`).join("")}</div>
    <div class="cta" style="margin-top:34px"><button class="btn primary" data-go="verhaal-${next.id}">Volgende: ${esc(next.title)}</button><button class="btn" data-go="verhaal-${prev.id}">Vorige: ${esc(prev.title)}</button><button class="btn" data-go="verhalen">Alle verhalen</button></div>
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
function drawTimeline() {
  const W = 1180, left = 214, right = W - 24, y0 = 1710, y1 = 2030;
  const X = y => left + (Math.max(y0, y) - y0) / (y1 - y0) * (right - left);
  const ps = ancestors.filter(p => (yr(p.b) || yr(p.d)) && (!tlState.lines.size || tlState.lines.has(lineOf(p.kw))));
  const start = p => yr(p.b) || (yr(p.d) - 55);
  const rows = [];
  if (tlState.by === "line") LINE_KEYS.forEach(l => { const grp = ps.filter(p => lineOf(p.kw) === l).sort((a, b) => start(a) - start(b)); if (grp.length) { rows.push({ head: l }); grp.forEach(p => rows.push({ p })); } });
  else ps.slice().sort((a, b) => start(a) - start(b)).forEach(p => rows.push({ p }));
  /* gebeurtenissen bovenaan: elk label op de eerste rij waar het niet overlapt */
  const ctx = CONTEXT.filter(c => c.tl !== false).slice().sort((a, b) => a.y - b.y), ends = [];
  ctx.forEach(c => { const x0 = X(c.y), w = (String(c.y).length + 1 + c.t.length) * 6.3 + 10; let r = ends.findIndex(e => e < x0); if (r < 0) { r = ends.length; ends.push(0); } ends[r] = x0 + w; c._r = r; });
  const top = 22 + ends.length * 17, rh = 21, hh = 30;
  let y = top; rows.forEach(r => { r.y = y; y += r.head ? hh : rh; });
  const H = y + 30;
  /* twee svg's met dezelfde schaal: namen blijven staan, de balken scrollen (telefoon) */
  const names = el("svg", { viewBox: `0 0 ${left} ${H}`, "aria-hidden": "true" });
  const svg = el("svg", { viewBox: `${left} 0 ${W - left} ${H}`, role: "img", "aria-label": "Tijdlijn van levens" });
  const bands = el("g", {}, svg);
  CONTEXT.filter(c => c.y2 && c.tl !== false).forEach(c => el("rect", { x: X(c.y), y: top - 6, width: X(c.y2) - X(c.y), height: H - top - 22, fill: "var(--gold)", "fill-opacity": 0.08 }, bands));
  for (let t = 1725; t <= 2025; t += 25) {
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
    if (r.head) {
      const ht = txt(gn, 12, r.y + 19, LINES[r.head].name, { "font-size": 15, "font-family": "var(--display)", fill: `var(--l${r.head})`, style: "cursor:pointer" });
      ht.addEventListener("click", () => go("lijn-" + r.head));
      [[gn, 12, left], [g, left, right]].forEach(([G, x1, x2]) => el("line", { x1, x2, y1: r.y + 25, y2: r.y + 25, stroke: `var(--l${r.head})`, "stroke-opacity": 0.35 }, G));
      return;
    }
    const p = r.p, c = lineColor(p.kw), cy = r.y + rh / 2;
    const nm = el("g", { class: "node" }, gn);
    el("rect", { x: 0, y: r.y, width: left, height: rh, fill: "transparent" }, nm);
    txt(nm, left - 10, cy + 4, trunc(p.n, 30), { "text-anchor": "end", "font-size": 12 });
    nm.addEventListener("click", () => openProfile(p.kw));
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
  list.forEach((a, i) => {
    if (i > 14 && mapState.place !== a.key && !mapFocusPerson) return;
    const P = PLACES[a.key], [x, y] = proj(P.la, P.lo), r = 4 + 2.4 * Math.sqrt(a.people.size);
    el("text", { x: x + r + 3, y: y + 4, "font-size": 12, fill: "var(--surface)", stroke: "var(--surface)", "stroke-width": 3, "stroke-linejoin": "round" }, labels).textContent = a.key;
    txt(labels, x + r + 3, y + 4, a.key, { "font-size": 12, fill: "var(--ink)" });
  });
  $("#map").innerHTML = ""; $("#map").appendChild(svg);
  renderMapSide(list);
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
      ${evList(sel.ev.slice().sort((a, b) => a.y - b.y).map(e => mapState.est.has(e.kw) ? Object.assign({}, e, { t: e.t + " · sterfjaar onbekend" }) : e))}
      <div class="links"><button class="btn" data-go="${slug(sel.key)}">Over ${esc(sel.key)}</button><button class="btn" id="clearPlace">Alle plaatsen</button></div>`;
  } else {
    const nLive = mapState.mode === "levend" ? list.reduce((n, a) => n + a.people.size, 0) : 0;
    h += mapState.mode === "levend"
      ? `<div><div class="eyebrow">in ${mapState.year} in leven</div><h3>${nLive} ${nLive === 1 ? "persoon" : "personen"} in ${list.length} ${list.length === 1 ? "plaats" : "plaatsen"}</h3></div>
      <p class="small" style="margin:0">Alleen wie in ${mapState.year} leefde, op de laatst bekende woonplaats. Wie overleden is, verdwijnt van de kaart. Zonder bekend sterfjaar is het einde geschat: ${MAP_EST} jaar na de geboorte, of later als er later nog iets bekend is${mapState.est.size ? ` (nu bij ${mapState.est.size} ${mapState.est.size === 1 ? "persoon" : "personen"})` : ""}.</p>`
      : `<div><div class="eyebrow">tot en met ${mapState.year}</div><h3>${list.length} plaatsen</h3></div>
      <p class="small" style="margin:0">Klik een stip voor wat er in dat dorp gebeurde. De kleur hoort bij de familie die er het vaakst voorkomt. Gemeentenamen uit akten staan op de hoofdplaats.</p>`;
    h += `
      <ul class="evlist">${list.slice(0, mapState.allList ? list.length : 15).map(a => `<li><span class="y">${a.people.size}</span><span><button data-place="${esc(a.key)}">${esc(placeName(a.key))}</button><span class="t">${Object.keys(a.lines).filter(l => LINES[l]).map(l => LINES[l].name).join(", ")}</span></span></li>`).join("")}</ul>${!mapState.allList && list.length > 15 ? `<button class="btn" id="allPlaces">Alle ${list.length} plaatsen tonen</button>` : ""}
      ${T.key !== "h" ? (T.TXT.offmap ? `<p class="small" style="margin:0">${esc(T.TXT.offmap)}</p>` : "") : `<p class="small" style="margin:0">Buiten dit kaartbeeld: Amsterdam (Gerrit Westendorp, 1856), Oudenbosch in Brabant (Johannes Terwisscha van Scheltinga, 1856), Woerden (Tekela Terwisscha van Scheltinga, 1850) en Duitsland: Schwagstorf bij Fürstenau (Margaretha Niemann) en 'Oldenstee' (Hendrik Meyners).</p>`}`;
  }
  const side = $("#mapSide"); side.innerHTML = h;
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
    <div class="eyebrow"><button class="link" data-go="kaart">Kaart</button> › Plaats</div>
    <div class="cols" style="margin-top:12px;align-items:start">
      <div>
        <h1 class="page-title">${esc(placeName(key))}</h1>
        <p class="small" style="font-size:14px">${P.kind === "gemeente" ? "Gemeente" : "Historische gemeente " + esc(P.gem)} · ${esc(P.prov)}</p>
        ${fig(placeImg(key), { cls: "hero-ph" })}
        ${pInfo(P) ? `<p class="lede" style="color:var(--ink)">${esc(pInfo(P))}</p>` : `<p class="lede">${ppl.length} ${ppl.length === 1 ? "voorouder" : "voorouders"} van ${esc(T.root)} werden hier geboren, trouwden, woonden of overleden.</p>`}
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
        ${evs.length ? (() => { const lc = {}; ppl.forEach(p => { const l = lineOf(p.kw); if (LINES[l]) lc[l] = (lc[l] || 0) + 1; }); return `<p class="small" style="margin:0 0 10px">${ppl.length} ${ppl.length === 1 ? "voorouder" : "voorouders"}, van ${evs[0].y} tot ${evs[evs.length - 1].y}.</p><div class="chips" style="margin-bottom:12px">${Object.entries(lc).sort((a, b) => b[1] - a[1]).map(([l, n]) => `<button class="chip" style="--c:var(--l${l})" data-go="lijn-${l}"><i></i>${esc(LINES[l].name)} <span class="mono">${n}</span></button>`).join("")}</div>${placeEvList(evs)}`; })() : `<p class="small">Nog geen gebeurtenissen gekoppeld.</p>`}
      </div>
      <div>
        <div class="pane" id="placeMap"></div>
        ${oldMaps(key).length ? `<h5 class="eyebrow" style="margin:18px 0 8px">Oude kaart</h5>${oldMaps(key).map(im => fig(im, { thumb: true, cls: "map-ph" })).join("")}<p class="small" style="margin:6px 0 0">Klik om te vergroten. Op de kaart van ${esc(P.gem)} staan dorpen, kerken, vaarten en soms boerderijen bij naam.</p>` : ""}
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
  archGallery($("#placeArch"), PACK_IDX.place[key], im => im.key === key || (im.p === key), () => route.view === "plaats" && route.sub === key,
    { head: `<div class="section-head" style="margin-top:28px"><h2>Uit de archieven</h2><p>Akten, kaarten, krantenberichten en oude foto's van ${esc(placeName(key))}.</p></div>` });
}

/* ---------- beeld ---------- */
const MICON = {
  bidprentje: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="2.5" width="14" height="19" rx="1.5"/><path d="M12 6v8M9 9h6M8.5 18h7"/></svg>`,
  kerk: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2v4M10.5 3.5h3M8 21V10l4-4 4 4v11M3 21v-6l5-3M21 21v-6l-5-3M2 21h20"/><path d="M11 21v-4h2v4"/></svg>`,
  plek: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
  krant: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="15" height="16" rx="1.5"/><path d="M18 8h3v10a2 2 0 0 1-2 2M6 8h9M6 12h9M6 16h6"/></svg>`,
  achtergrond: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 5l9 2 9-2v14l-9 2-9-2z"/><path d="M12 7v14"/></svg>`
};
const beeldState = { kind: "all", q: "", raw: "", archN: 48, asub: "all" };
const IMG_KINDS = { archief: { label: "Uit de archieven", d: "Oude foto's, ansichtkaarten, prenten, kaarten, akten en grafstenen uit archieven en musea, bij de plaatsen en voorouders uit de stamboom. Zoek op plaats, naam, onderwerp of jaar; klik een beeld voor de bron en de weg naar de plaats of het profiel." }, verhaal: { label: "Bij de verhalen", d: "Historische beelden bij de verhalen: de plekken, gebeurtenissen en het werk waarover ze gaan." }, portret: { label: "Portretten", d: "Foto's van voorouders zelf, uit familiestambomen en archieven. Klik een foto om te vergroten; vanuit de grote foto ga je naar het profiel." }, foto: { label: "Dorpen en steden", d: "Foto's van de dorpen en steden uit de stamboom. Klik een foto om te vergroten; vanuit de grote foto ga je naar de plaats." }, kaart: { label: "Oude kaarten", d: "De grietenijen op de kaarten van Schotanus (1664 en 1718) en oude stadsplattegronden: zo zag het land eruit waar de voorouders woonden." } };
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
  return `<article class="bpcard" id="b-${p.kw}" style="--c:${lineColor(p.kw)}">
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
function renderBeeld() {
  const host = $("#v-beeld"), bids = bidItems(), nScan = bids.filter(b => b.scans.length).length, mem = memList();
  const nFoto = IMGS.filter(i => i.soort === "plaats").length, nKaart = IMGS.filter(i => i.soort === "kaart" || i.soort === "stadsplan").length, nPort = portraitList().length;
  const nArch = archList().length, nVh = storyImgList().length, nMem = mem.own.length + mem.arch.length;
  const kinds = ["all", ...(nPort ? ["portret"] : []), ...(nVh ? ["verhaal"] : []), ...(nFoto ? ["foto"] : []), ...(nKaart ? ["kaart"] : []), "bidprentje", ...(nArch ? ["archief"] : []), "kerk", "plek", "krant", "achtergrond"];
  if (!kinds.includes(beeldState.kind)) beeldState.kind = "all";
  const cnt = k => k === "all" ? nMem + bids.length + MEDIA.length + nFoto + nKaart + nPort + nArch + nVh : k === "archief" ? nArch : k === "verhaal" ? nVh : k === "portret" ? nPort : k === "foto" ? nFoto : k === "kaart" ? nKaart : k === "bidprentje" ? nMem + bids.length : MEDIA.filter(m => m.kind === k).length;
  host.innerHTML = `
    <div class="eyebrow">Beeld</div>
    <h1 class="page-title">${nFoto ? "Dorpen, gezichten en papieren" : "Bidprentjes, kerken en kranten"}</h1>
    <p class="lede">${nFoto ? `Wat er aan beeld bewaard is: ${nPort ? `portretten van voorouders, ` : ""}bidprentjes en rouwberichten, foto's van ${nFoto} dorpen en steden${nKaart ? `, ${nKaart} oude kaarten` : ""}${nArch ? ` en ${nArch} beelden uit archieven en musea` : ""}. Klik een beeld om het te vergroten; maker, licentie en bron staan erbij.` : `Van ${bids.length} voorouders of hun naaste familie liggen bidprentjes in de archieven; van ${nScan} is de scan direct te openen. Daarnaast de kerken en kerkhoven waar ze kerkten en begraven liggen, plekken met een eigen verhaal en krantenberichten om nog te lezen.`}</p>
    <div class="toolbar"><input type="search" id="mq" placeholder="Zoek op naam, plaats, onderwerp of jaar" aria-label="Zoek in beeld" value="${esc(beeldState.raw || "")}"><div class="chips" id="mkinds">${kinds.map(k => `<button class="chip" aria-pressed="${beeldState.kind === k}" data-k="${k}">${k === "all" ? "Overzicht" : esc(k === "bidprentje" ? "Bidprentjes en rouwberichten" : kindLabel(k))} <span class="mono">${cnt(k)}</span></button>`).join("")}</div></div>
    <div id="mOut"></div>
    <details class="box beeld-zelf"><summary><b>Zelf verder zoeken</b> <span class="small">fotocollecties per dorp en oude kranten</span></summary>
      <h3>${nFoto ? "Meer foto's per dorp" : "Foto's per dorp"}</h3><p class="small">Hele fotocollecties van dorpen, kerken en boerderijen op Wikimedia Commons.</p>
      <div class="chips">${Object.keys(COMMONS).map(k => `<a class="chip" target="_blank" rel="noopener" href="${COMMONS_BASE + COMMONS[k]}">${esc(placeName(k))}</a>`).join("")}</div>
      <h3>Zelf zoeken in oude kranten</h3><p class="small">Kant-en-klare zoekopdrachten in Delpher. Pas de woorden aan voor andere namen.</p>
      <div class="chips">${PAPER_SEARCHES.map(x => `<a class="chip" target="_blank" rel="noopener" href="${esc(x[1])}">${esc(x[0])}</a>`).join("")}</div>
    </details>`;
  const setKind = k => { beeldState.kind = k; beeldState.archN = 48; $$("#mkinds [data-k]").forEach(x => x.setAttribute("aria-pressed", x.dataset.k === k)); drawBeeld(); };
  $$("#mkinds [data-k]").forEach(b => b.onclick = () => setKind(b.dataset.k));
  $("#mq").oninput = e => { beeldState.raw = e.target.value; beeldState.q = norm(e.target.value); beeldState.archN = 48; drawBeeld(); };
  $("#mOut").addEventListener("click", e => {
    const m = e.target.closest("[data-more]"); if (m) { setKind(m.dataset.more); $("#mkinds").scrollIntoView({ block: "start" }); return; }
    const s = e.target.closest("[data-asub]"); if (s) { beeldState.asub = s.dataset.asub; beeldState.archN = 48; drawBeeld(); }
  });
  drawBeeld();
}
function drawBeeld() {
  const q = beeldState.q, toks = q.split(/\s+/).filter(Boolean), K = beeldState.kind;
  const hit = txt => toks.every(t => norm(txt).includes(t));
  /* overzicht: per soort een greep, met een knop naar alles; bij zoeken of een gekozen soort: alles */
  const shelf = K === "all" && !toks.length, show = k => K === "all" || K === k;
  const head = (icon, label, d, n) => `<div class="section-head"><h2>${icon || ""} ${esc(label)}${shelf && n ? ` <span class="mono small">${n}</span>` : ""}</h2><p>${esc(d)}</p></div>`;
  const more = (k, n, shown, label) => shelf && n > shown ? `<p class="shelf-more"><button class="btn" data-more="${k}">${esc(label || `Alle ${n} bekijken`)} →</button></p>` : "";
  const take = (list, n) => shelf ? list.slice(0, n) : list;
  let h = "", archTodo = null, memTodo = null;
  if (show("portret")) {
    const ps = portraitList().filter(x => !toks.length || hit([x.p.n, x.p.alt, x.p.roep, x.im.t, placeName(x.p.bp), placeName(x.p.dp)].join(" ")));
    if (ps.length) h += head(MICON.portret, IMG_KINDS.portret.label, IMG_KINDS.portret.d, ps.length) + `<div class="${shelf ? "capped " : ""}gallery portraits" data-imggroup>${take(ps, 8).map(x => fig(x.im, { thumb: true, cap: `${firstName(x.p)} ${shortSur(splitName(x.p.n).sur)} · ${lifeYears(x.p)}`, credit: false, cls: "port" })).join("")}</div>` + more("portret", ps.length, 8);
  }
  if (show("bidprentje")) {
    const mem = memList(), mt = x => [x.p.n, x.p.alt, placeName(x.p.bp), placeName(x.p.dp), x.im ? x.im.t : x.a.t, x.im ? x.im.desc : x.a.desc].join(" ");
    const own = mem.own.filter(x => !toks.length || hit(mt(x))), arch = mem.arch.filter(x => !toks.length || hit(mt(x)));
    const withImg = new Set([...mem.own, ...mem.arch].map(x => x.p.kw));
    const rest = bidItems().filter(b => !withImg.has(b.p.kw) && (!toks.length || hit([b.p.n, b.p.alt, placeName(b.p.bp), placeName(b.p.dp), ...b.own.map(x => x[0])].join(" "))));
    const n = own.length + arch.length, nOwn = Math.min(own.length, shelf ? 8 : own.length), nArch = shelf ? Math.max(0, 8 - nOwn) : arch.length;
    if (n || rest.length) {
      h += head(MICON.bidprentje, "Bidprentjes en rouwberichten", "Gedachtenisprentjes, rouwberichten uit de krant en grafstenen van overleden voorouders. Klik een beeld om het te lezen; vanuit de grote foto ga je naar het profiel.", n + rest.length);
      if (n) h += `<div class="${shelf ? "capped " : ""}gallery mem" data-imggroup>${own.slice(0, nOwn).map(x => fig(x.im, { thumb: true, cap: memCap(x.im.t, x.p), credit: false })).join("")}<span id="memArch" style="display:contents"></span></div>`;
      memTodo = arch.slice(0, nArch);
      if (!shelf && rest.length) h += `<h3 class="sub-h">Ook in de archieven, nog zonder beeld op deze site <span class="mono small">${rest.length}</span></h3><p class="small" style="margin:0 0 12px">Van deze voorouders of hun naaste familie ligt een bidprentje in een archief. Open de link om het daar te bekijken.</p><div class="bpgrid">${rest.map(bidCard).join("")}</div>`;
      h += more("bidprentje", n + rest.length, nOwn + nArch, rest.length ? `Alle ${n} beelden en ${rest.length} bidprentjes in de archieven` : "");
    }
  }
  if (show("verhaal")) {
    const vs = storyImgList().filter(x => !toks.length || hit([x.im.t, x.im.desc, x.s.title].join(" ")));
    if (vs.length) h += head(MICON.verhaal, IMG_KINDS.verhaal.label, IMG_KINDS.verhaal.d, vs.length) + `<div class="${shelf ? "capped " : ""}gallery" data-imggroup>${take(vs, 6).map(x => fig(x.im, { thumb: true, cap: x.s.title, credit: false })).join("")}</div>` + more("verhaal", vs.length, 6);
  }
  if (show("foto")) {
    const fs = IMGS.filter(i => i.soort === "plaats" && PLACES[i.key] && (!toks.length || hit([placeName(i.key), PLACES[i.key].gem, i.t].join(" ")))).sort((a, b) => placeName(a.key).localeCompare(placeName(b.key), "nl"));
    if (fs.length) h += head(MICON.foto, IMG_KINDS.foto.label, IMG_KINDS.foto.d, fs.length) + `<div class="${shelf ? "capped " : ""}gallery" data-imggroup>${take(fs, 12).map(i => fig(i, { thumb: true, cap: placeName(i.key), credit: false })).join("")}</div>` + more("foto", fs.length, 12);
  }
  if (show("kaart")) {
    const ks = IMGS.filter(i => (i.soort === "kaart" || i.soort === "stadsplan") && (!toks.length || hit([i.t, i.key].join(" ")))).sort((a, b) => (a.soort === b.soort ? a.key.localeCompare(b.key, "nl") : a.soort === "kaart" ? -1 : 1));
    if (ks.length) h += head(MICON.kaart, IMG_KINDS.kaart.label, IMG_KINDS.kaart.d, ks.length) + `<div class="${shelf ? "capped " : ""}gallery maps" data-imggroup>${take(ks, 6).map(i => fig(i, { thumb: true, credit: false })).join("")}</div>` + more("kaart", ks.length, 6);
  }
  if (show("archief")) {
    const all = archList().filter(a => !toks.length || toks.every(t => a.nt.includes(t)));
    const counts = {}; all.forEach(a => { const s = archSubOf(a); counts[s] = (counts[s] || 0) + 1; });
    const sub = shelf ? "all" : (beeldState.asub && counts[beeldState.asub] ? beeldState.asub : "all");
    let as = (sub === "all" ? all : all.filter(a => archSubOf(a) === sub)).slice().sort((a, b) => archOrder(a) - archOrder(b));
    if (shelf) { /* overzicht: oude foto's uit zoveel mogelijk verschillende dorpen, gelijk verdeeld over het alfabet */
      const first = {}; as.filter(a => a.soort === "foto").forEach(a => { if (!first[a.key]) first[a.key] = a; });
      const fs = Object.values(first), step = Math.max(1, fs.length / 12);
      as = Array.from({ length: Math.min(12, fs.length) }, (_, j) => fs[Math.floor(j * step)]);
    }
    const n = shelf ? 12 : beeldState.archN;
    if (all.length) {
      h += head(MICON.archief, IMG_KINDS.archief.label, IMG_KINDS.archief.d, all.length);
      if (!shelf) h += `<div class="chips asub">${[["all", "Alle soorten"], ...ARCH_SUB.filter(s => counts[s[0]])].map(s => `<button class="chip" data-asub="${s[0]}" aria-pressed="${sub === s[0]}">${esc(s[1])} <span class="mono">${s[0] === "all" ? all.length : counts[s[0]]}</span></button>`).join("")}</div>${toks.length ? `<p class="small"><b>${all.length}</b> gevonden.</p>` : ""}`;
      h += `<div id="archOut" class="${shelf ? "capped " : ""}pgal arch" data-imggroup><p class="small">Beelden laden…</p></div>`;
      h += shelf ? more("archief", all.length, 12) : as.length > n ? `<p class="shelf-more"><button class="btn" id="archMore">Meer tonen (${as.length - n} over)</button></p>` : "";
      archTodo = as.slice(0, n);
    }
  }
  ["kerk", "plek", "krant", "achtergrond"].filter(show).forEach(k => {
    const ms = MEDIA.filter(m => m.kind === k && (!toks.length || hit([m.t, m.d, placeName(m.p), ...(m.kws || []).map(x => (person(x) || {}).n)].join(" "))));
    if (ms.length) h += head(MICON[k], MEDIA_KINDS[k].label, MEDIA_KINDS[k].d, ms.length) + `<div class="${shelf ? "capped " : ""}grid-3" data-imggroup>${take(ms, 3).map(mediaCard).join("")}</div>` + more(k, ms.length, 3);
  });
  $("#mOut").innerHTML = h || `<div class="empty">Niets gevonden voor dit filter.</div>`;
  if (archTodo) fillArch($("#archOut"), archTodo);
  if (memTodo && memTodo.length) fillMem($("#memArch"), memTodo);
  const am = $("#archMore"); if (am) am.onclick = () => { beeldState.archN += 96; drawBeeld(); };
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
/* alle verhaalbeelden van de huidige boom, in de volgorde van de verhalen */
const storyImgList = () => STORIES.flatMap(st => storyImgs(st.id).map(im => ({ im, s: st })));

/* ---------- bronnen ---------- */
function renderBronnen() {
  const agg = {};
  ancestors.forEach(p => (p.src || []).forEach(s => { if (!s[1]) return; const t = srcType(s[1], s[0]); const k = s[1]; (agg[t] = agg[t] || {}); if (!agg[t][k]) agg[t][k] = { label: s[0], url: k, kws: new Set() }; agg[t][k].kws.add(p.kw); }));
  const total = Object.values(agg).reduce((n, o) => n + Object.keys(o).length, 0);
  $("#v-bronnen").innerHTML = `
    <div class="eyebrow">Bronnen en onderzoek</div>
    <h1 class="page-title">Alles is na te zoeken</h1>
    <p class="lede">Elk gegeven op deze site komt uit een bron, met een label voor de sterkte van het bewijs. Hier staan de bronnen, de open vragen, de tegenstrijdigheden en de archieven waar het antwoord waarschijnlijk ligt.</p>
    <div class="section-head"><h2>Hoe betrouwbaar?</h2></div>
    <div class="cols">
      <div class="box"><h3>Statuslabels</h3>${["A", "B", "C", "D"].map(s => `<p style="margin:8px 0">${stTag(s, true)} ${esc(STATUS[s].long)}</p>`).join("")}
        <h3 style="margin-top:18px">Bij weetjes en verhalen</h3>${Object.keys(NOTE_KIND).map(k => `<p style="margin:8px 0">${kindTag(k)} ${esc(NOTE_KIND[k])}</p>`).join("")}</div>
      <div class="box"><h3>Verdeling over ${ancestors.length} voorouders</h3>${statusBars()}<p class="small" style="margin:12px 0 0">Velden die onzekerder zijn dan het profiel als geheel, krijgen in het profiel een eigen label.</p></div>
    </div>
    <div class="section-head"><h2>Open vragen</h2><p>Gesorteerd op belang: hoe meer bolletjes, hoe meer er van het antwoord afhangt.</p></div>
    <div class="pane scroll-x"><table class="mini stack"><thead><tr><th>Prioriteit</th><th>Vraag</th><th>Waar zoeken</th></tr></thead><tbody>
      ${OPEN_QUESTIONS.slice().sort((a, b) => a.pri - b.pri).map(o => `<tr><td class="y">${"●".repeat(4 - o.pri)}</td><td>${esc(o.q)} <button class="link small" data-open="${o.kw}">kw ${o.kw}</button></td><td class="small" data-l="Waar zoeken">${esc(o.where)}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="section-head"><h2>Tegenstrijdigheden</h2><p>Waar bronnen elkaar tegenspreken, en wat we ermee doen.</p></div>
    <div class="pane scroll-x"><table class="mini stack"><thead><tr><th>Onderwerp</th><th>Bron 1</th><th>Bron 2</th><th>Stand van zaken</th></tr></thead><tbody>
      ${CONFLICTS.map(c => `<tr><td><button class="link" data-open="${c.kw}">${esc(c.topic)}</button></td><td class="small" data-l="Bron 1">${esc(c.a)}</td><td class="small" data-l="Bron 2">${esc(c.b)}</td><td class="small" data-l="Stand van zaken">${esc(c.now)}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="section-head"><h2>Archieven</h2><p>Waar je zelf verder zoekt. Elk profiel heeft ook eigen zoeklinks.</p></div>
    <div class="grid-3">${ARCHIVES.map(a => `<article class="fact"><h3>${esc(a.n)}</h3><p>${esc(a.d)}</p><div class="acts"><a href="${esc(a.u)}" target="_blank" rel="noopener">Open ${esc(a.n)}</a></div></article>`).join("")}</div>
    <div class="section-head"><h2>Alle gebruikte bronnen</h2><p>${total} bronnen, gegroepeerd per soort. Klik een soort open.</p></div>
    <div style="display:flex;flex-direction:column;gap:10px">${SRC_ORDER.filter(t => agg[t]).map(t => { const items = Object.values(agg[t]); return `<details class="box"><summary style="cursor:pointer"><b>${t}</b> <span class="small">${items.length}</span></summary><ul class="srclist" style="margin-top:10px">${items.map(it => `<li><span class="small mono">${[...it.kws].map(k => "kw " + k).join(", ")}</span><a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.label)}</a></li>`).join("")}</ul></details>`; }).join("")}</div>
    <div class="section-head"><h2>Genealogieën en stambomen van anderen</h2><p>Gebruikt als aanwijzing; elk gegeven hieruit heeft status B of C.</p></div>
    <div class="cols">${SOURCE_GROUPS.map(g => `<div class="box"><h3>${esc(g[0])}</h3><ul>${g[1].map(s => `<li><a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a></li>`).join("")}</ul></div>`).join("")}</div>
    <div class="section-head" id="begrippen"><h2>Begrippen</h2></div>
    <div class="box"><dl class="dl" style="grid-template-columns:160px minmax(0,1fr)">${GLOSSARY.map(g => `<dt><b style="color:var(--ink)">${esc(g[0])}</b></dt><dd>${esc(g[1])}</dd>`).join("")}</dl></div>
    <div class="section-head"><h2>Wijzigingen</h2></div>
    <div class="cols">${CHANGELOG.map(c => `<div class="box"><h3>${esc(c.v)} <span class="small">${esc(c.d)}</span></h3><ul>${c.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}</div>
    ${IMGS.length ? `<div class="section-head" id="beeldverantwoording"><h2>Beeldverantwoording</h2><p>${IMGS.length} afbeeldingen, met maker, licentie en bron: ${(() => { const c = {}; IMGS.forEach(i => { c[bronOf(i)] = (c[bronOf(i)] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([b, n]) => `${n} van ${esc(b)}`).join(", "); })()}.${archList().length ? ` Daarnaast ${archList().length} beelden uit archieven en musea; maker, rechten en bron staan bij elk beeld (<button class="link" data-archief>Beeld › Uit de archieven</button>).` : ""}</p></div>
    <details class="box"><summary style="cursor:pointer"><b>Alle afbeeldingen</b> <span class="small">${IMGS.length}</span></summary><ul class="srclist" style="margin-top:10px">${IMGS.slice().sort((a, b) => a.t.localeCompare(b.t, "nl")).map(i => `<li><span class="small">${esc(i.t)}</span><span>${credit(i)}${refLine(i) ? ` · ${refLine(i)}` : ""}</span></li>`).join("")}</ul></details>` : ""}
    <div class="section-head"><h2>Over deze site</h2></div>
    <div class="box" style="font-size:14px;color:var(--muted)">
      <p style="margin-top:0">Kwartiernummers (kw) volgen het systeem van Kekulé: ${esc(T.rootFull || T.root)} ${T.key === "s" ? "hebben samen nummer" : "heeft nummer"} 1, de vader van persoon <i>n</i> is 2<i>n</i>, de moeder 2<i>n</i>+1. Even nummers zijn mannen, oneven nummers vrouwen.</p>
      <p>Van levende familieleden staan alleen namen op deze site. Broers en zussen van de grootouders die zijn overleden, staan met naam en jaartallen bij hun ouders. Plaatsen op de kaart zijn bij benadering: de dorpskern, niet de boerderij.</p>
      <p>${IMGS.length ? `${IMGS.some(i => bronOf(i) === "Wikimedia Commons") ? "De foto's en oude kaarten van Wikimedia Commons staan onder een vrije licentie; maker en licentie staan bij elk beeld (zie Beeldverantwoording hierboven)." : ""}${IMGS.some(i => bronOf(i) !== "Wikimedia Commons") ? " Andere beelden komen uit " + esc([...new Set(IMGS.map(bronOf).filter(b => b !== "Wikimedia Commons"))].join(", ").replace(/, ([^,]*)$/, " en $1")) + "; die staan er met de rechtenaanduiding van het archief of de krant, en de bron staat bij elk beeld." : ""} ${IMGS.some(i => i.soort === "persoon" && /^\d+$/.test(i.key)) ? "Foto's van dorpen en kerken laten ze zien zoals ze nu zijn. Bij een aantal overleden voorouders staan een portret, een grafsteen of een oud rouwbericht uit het archief; van levende familieleden staan er geen beelden op." : "Het zijn foto's van de dorpen en kerken zoals ze nu zijn, of oude kaarten; het zijn geen foto's van de voorouders zelf."} De overige illustraties zijn eigen tekeningen.` : "Afbeeldingen op deze site zijn eigen tekeningen."} De meeste scans van akten en bidprentjes staan bij de archieven zelf; de profielen linken ernaar.</p>
      <p style="margin-bottom:0">Heb je een akte, foto, bidprentje of verhaal dat iets aanvult of verbetert? Geef het door, dan komt het in de volgende versie.</p>
    </div>`;
  /* inhoudsopgave: de pagina is lang */
  const host = $("#v-bronnen"), heads = $$(".section-head", host);
  heads.forEach((h, i) => { if (!h.id) h.id = "b-" + i; });
  const toc = document.createElement("nav"); toc.className = "chips toc"; toc.setAttribute("aria-label", "Op deze pagina");
  toc.innerHTML = heads.map(h => `<button class="chip" data-to="${h.id}">${esc($("h2", h).textContent)}</button>`).join("");
  $(".lede", host).after(toc);
  $$("[data-to]", toc).forEach(b => b.onclick = () => document.getElementById(b.dataset.to).scrollIntoView({ behavior: "smooth", block: "start" }));
}

/* ---------- cijfers ---------- */
const DOW = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const fullDate = s => { const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; };
function yearsBetween(a, b) {
  const A = fullDate(a), B = fullDate(b);
  if (A && B) return (B - A) / 31556952000;
  const ya = yr(a), yb = yr(b);
  return ya && yb && !/\bof\b/.test(String(a) + String(b)) ? yb - ya : null;
}
const exactPair = (a, b) => !!(fullDate(a) && fullDate(b));
const meanOf = xs => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
function medianOf(xs) { if (!xs.length) return null; const s = xs.slice().sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
const r1 = x => x === null ? "–" : (Math.round(x * 10) / 10).toLocaleString("nl-NL");
const r0 = x => x === null ? "–" : Math.round(x).toLocaleString("nl-NL");
const nl = x => Number(x).toLocaleString("nl-NL");
function kmBetween(a, b) {
  const A = PLACES[mapKey(a)], B = PLACES[mapKey(b)]; if (!A || !B) return null;
  const R = 6371, t = Math.PI / 180, dLa = (B.la - A.la) * t, dLo = (B.lo - A.lo) * t;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(A.la * t) * Math.cos(B.la * t) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const pb = (p, extra) => `<button class="link" data-open="${p.kw}">${esc(p.n)}</button>${p.st === "C" || p.st === "D" ? " " + stTag(p.st) : ""}${extra ? ` <span class="small">${extra}</span>` : ""}`;
const OCC_CATS = [
  ["Boer, landbouwer of veehouder", /(^|[^a-z])boer(in)?([^a-z]|$)|pachtboer|zetboer|landbouw|veehoud|huisman/i],
  ["Knecht, meid of arbeider", /knecht|meid|arbeider|boerwerker/i],
  ["Koopman, winkelier of grutter", /koopman|winkel|grutter/i],
  ["Herbergier of kastelein", /herberg|kastelein/i],
  ["Ambacht: bakker, timmerman, ketelboeter", /bakker|timmer|ketel|smid/i],
  ["Water en veen: schipper, sluiswachter, veenbaas", /schipper|sluis|veenbaas/i],
  ["Rentenier", /rentenier/i],
  ["Bestuur of zorg: raadslid, kerkvoogd, chirurgijn", /gemeenteraad|kerkvoogd|chirurgijn/i]
];
const NUMW = { twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6, zeven: 7, acht: 8, negen: 9, tien: 10, elf: 11, twaalf: 12, dertien: 13, veertien: 14, vijftien: 15, zestien: 16, zeventien: 17, achttien: 18 };
function kidCount(ks) {
  if (!ks || !ks.length) return 0;
  let n = ks.filter(k => !/kinderen|in totaal/i.test(k)).length;
  ks.forEach(k => { const m = /(\d+|[a-z]+) kinderen/i.exec(k); if (m) { const v = +m[1] || NUMW[m[1].toLowerCase()] || 0; if (v > n) n = v; } });
  return n;
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
  S.periods = [["vóór 1775", 0, 1775], ["1775–1824", 1775, 1825], ["1825–1874", 1825, 1875], ["1875 en later", 1875, 9999]].map(([l, a, b]) => {
    const g = life.filter(x => { const y = yr(x.p.b); return y >= a && y < b; });
    return { l, m: meanOf(g.filter(x => isMale(x.p.kw)).map(x => x.v)), f: meanOf(g.filter(x => !isMale(x.p.kw)).map(x => x.v)), n: g.length };
  });
  S.buckets = Array.from({ length: 10 }, (_, i) => ({ l: i * 10 + "", v: life.filter(x => x.v >= i * 10 && x.v < i * 10 + 10).length }));
  const byAge = life.slice().sort((a, b) => b.v - a.v);
  S.oldest = byAge.slice(0, 5); S.youngest = byAge.slice(-3).reverse();
  S.lifeSum = life.reduce((s, x) => s + x.v, 0);
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
  S.dows = [1, 2, 3, 4, 5, 6, 0].map(d => ({ l: DOW[d].slice(0, 2), full: DOW[d], v: greg.filter(c => fullDate(c.md).getUTCDay() === d).length }));
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
  S.longWidow = wid.slice().sort((a, b) => Math.abs(b.v) - Math.abs(a.v))[0];
  S.bigFamily = couples.filter(c => c.kids).sort((a, b) => b.kids - a.kids).slice(0, 3);
  S.kidsSum = couples.reduce((s, c) => s + c.kids, 0);
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
  S.longestName = A.slice().sort((a, b) => b.n.replace(/\(.*?\)/g, "").length - a.n.replace(/\(.*?\)/g, "").length)[0];
  S.shortestName = A.filter(p => /\s/.test(p.n.replace(/\s*\(.*?\)/g, "").trim())).sort((a, b) => a.n.replace(/\s*\(.*?\)|\s/g, "").length - b.n.replace(/\s*\(.*?\)|\s/g, "").length)[0];
  /* beroepen */
  S.occ = OCC_CATS.map(([l, re]) => ({ l, v: A.filter(p => re.test(p.occ || "")).length })).filter(x => x.v).sort((a, b) => b.v - a.v);
  S.nOcc = A.filter(p => p.occ).length;
  /* plaatsen */
  const ppl = {}; EVENTS.forEach(e => { (ppl[e.p] = ppl[e.p] || new Set()).add(e.kw); });
  S.nPlaces = new Set(EVENTS.map(e => e.p)).size; /* zelfde telling als de kaart */
  S.topPlaces = Object.entries(ppl).filter(([k]) => PLACES[k].kind !== "gemeente").map(([k, s]) => [k, s.size]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const mv = A.filter(p => p.bp && p.dp && PLACES[mapKey(p.bp)] && PLACES[mapKey(p.dp)]).map(p => ({ p, v: kmBetween(p.bp, p.dp) }));
  S.moves = mv; S.stay = mv.filter(x => mapKey(x.p.bp) === mapKey(x.p.dp)).length;
  S.far = mv.slice().sort((a, b) => b.v - a.v).slice(0, 3);
  S.within20 = mv.filter(x => x.v <= 20).length;
  /* bronnen */
  const st = {}; let srcN = 0; const types = {};
  A.forEach(p => { st[p.st] = (st[p.st] || 0) + 1; (p.src || []).forEach(s => { srcN++; const t = srcType(s[1], s[0]); types[t] = (types[t] || 0) + 1; }); });
  S.st = st; S.srcN = srcN; S.srcTypes = SRC_ORDER.filter(t => types[t]).map(t => ({ l: t, v: types[t] }));
  S.implex = PEOPLE.filter(p => p.alias).length;
  S.maxGen = Math.max(...A.map(p => gen(p.kw)));
  S.oldestYearAB = Math.min(...A.filter(p => p.st === "A" || p.st === "B").flatMap(p => [yr(p.b), yr(p.d), ...(p.res || []).map(r => r.y)]).filter(Boolean));
  S.oldestYear = Math.min(...A.flatMap(p => [yr(p.b), yr(p.d), ...(p.res || []).map(r => r.y)]).filter(Boolean));
  return S;
}
function vbars(data, o = {}) {
  const n = data.length, bw = o.bw || 34, gap = o.gap || 12, W = n * (bw + gap) + gap, H = 150, top = 22, base = H - 26;
  const max = Math.max(1, ...data.map(d => d.v));
  const hi = Math.max(...data.map(d => d.v));
  let s = `<svg class="vbars" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || "")}">`;
  s += `<line x1="${gap / 2}" x2="${W - gap / 2}" y1="${base}" y2="${base}" stroke="var(--rule)"/>`;
  data.forEach((d, i) => {
    const x = gap + i * (bw + gap), h = (base - top) * d.v / max, y = base - h;
    s += `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h, d.v ? 1 : 0)}" rx="3" fill="${o.color || "var(--accent)"}" fill-opacity="${d.v === hi ? 1 : 0.42}"><title>${esc((d.full || d.l) + ": " + d.v)}</title></rect>`;
    s += `<text x="${x + bw / 2}" y="${y - 6}" text-anchor="middle" font-size="12" fill="var(--ink)" font-family="var(--mono)">${d.v}</text>`;
    s += `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="12" fill="var(--muted)" font-family="var(--mono)">${esc(d.l)}</text>`;
  });
  return s + `</svg>`;
}
function hbars(rows, o = {}) {
  const max = Math.max(1, ...rows.map(r => r.v));
  return `<div class="hbars${o.wide ? " wide" : ""}">${rows.map(r => `<div class="hb"><span class="hl">${r.html || esc(r.l)}</span><span class="track"><span style="width:${(r.v / max * 100).toFixed(1)}%;background:${r.c || o.color || "var(--accent)"}"></span></span><span class="mono hv">${r.txt ?? r.v}</span></div>`).join("")}</div>`;
}
function onThisDay() {
  const now = new Date(), md = String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const ev = [];
  ancestors.forEach(p => {
    if (fullDate(p.b)) ev.push({ p, d: p.b, t: p.bapt ? "geboren of gedoopt" : "geboren" });
    if (fullDate(p.d)) ev.push({ p, d: p.d, t: "overleden" });
    if (p.m && fullDate(p.m.d) && (p.kw % 2 === 0 || !(person(p.kw - 1) && person(p.kw - 1).m && person(p.kw - 1).m.d))) ev.push({ p, d: p.m.d, t: "trouwde met " + p.m.w });
  });
  const dayNo = s => { const [m, d] = s.split("-").map(Number); return Math.round((Date.UTC(2001, m - 1, d) - Date.UTC(2001, 0, 1)) / 864e5); };
  const today = dayNo(md);
  ev.forEach(e => { e.ahead = (dayNo(e.d.slice(5)) - today + 365) % 365; });
  const todays = ev.filter(e => e.ahead === 0).sort((a, b) => yr(a.d) - yr(b.d));
  const soon = ev.filter(e => e.ahead > 0 && e.ahead <= 31).sort((a, b) => a.ahead - b.ahead || yr(a.d) - yr(b.d)).slice(0, 6);
  const li = e => `<li><span class="y">${esc(fmt(e.d).replace(/ \d{4}$/, ""))}</span><span><b class="mono">${yr(e.d)}</b> · ${pb(e.p)} ${esc(e.t)}</span></li>`;
  const label = `${now.getDate()} ${MONTHS[now.getMonth()]}`;
  return `<div class="box otd"><span class="eyebrow">Op deze dag · ${label}</span>
    ${todays.length ? `<h3>Vandaag ${todays.length === 1 ? "is het" : "zijn het"} ${todays.length === 1 ? "een verjaardag in de akten" : todays.length + " gebeurtenissen in de akten"}</h3><ul class="restl">${todays.map(li).join("")}</ul>` : `<h3>Vandaag gebeurde er niets in de akten</h3><p class="small" style="margin:0 0 6px">Wel in de komende weken:</p>`}
    ${soon.length ? `${todays.length ? `<p class="small" style="margin:12px 0 6px">De komende weken:</p>` : ""}<ul class="restl">${soon.map(li).join("")}</ul>` : ""}
    <p class="small" style="margin:10px 0 0">Alleen data die precies tot op de dag bekend zijn. Bij oude doopdata is de geboortedag vaak een paar dagen eerder.</p></div>`;
}
function renderCijfers() {
  const S = STATS || (STATS = computeStats());
  const host = $("#v-cijfers");
  const mAvg = meanOf(S.lifeM), fAvg = meanOf(S.lifeF);
  const topMonth = S.months.slice().sort((a, b) => b.v - a.v)[0], topDow = S.dows.slice().sort((a, b) => b.v - a.v)[0];
  const monthIdx = S.months.indexOf(topMonth);
  const genPerCent = S.genAvg ? 100 / S.genAvg : null;
  const ageMAvg = meanOf(S.ageM.map(x => x.v)), ageFAvg = meanOf(S.ageF.map(x => x.v));
  const backTo = 2026 - Math.round(S.lifeSum);
  const fun = [
    ["Samen geleefd", `${nl(Math.round(S.lifeSum))} jaar`, `Zoveel jaar leefden de ${S.life.length} voorouders van wie geboorte- en sterfjaar bekend zijn bij elkaar. Achter elkaar gezet en terug geteld vanaf nu kom je uit rond ${backTo < 0 ? nl(-backTo) + " voor Christus" : backTo}${backTo < -8000 ? ", kort na de laatste ijstijd, toen hier nog jagers en verzamelaars rondtrokken" : backTo < -3000 ? ", de tijd van de eerste boeren in het noorden" : ""}.`],
    ["Favoriete trouwdag", topDow.full, `${topDow.v} van de ${S.nGreg} paren met een bekende trouwdatum trouwden op een ${topDow.full}. ${topDow.full === "zondag" || topDow.full === "zaterdag" ? "" : "Het weekend was nog geen trouwdag."}`],
    ["Drukste trouwmaand", MONTHS[monthIdx], `${topMonth.v} van de ${S.nDated} huwelijken met een datum vielen in ${MONTHS[monthIdx]}. ${monthIdx >= 3 && monthIdx <= 4 ? "In Friesland begon het boerenjaar in mei: dan werden pachten en dienstbetrekkingen vernieuwd." : ""}`],
    ["Meest gegeven naam", S.namesM[0] ? S.namesM[0][0] : "–", S.namesM[0] ? `${S.namesM[0][1]} voorvaders heetten ${S.namesM[0][0]}; bij de vrouwen staat ${S.namesF[0][0]} bovenaan (${S.namesF[0][1]} keer).` : ""],
    ["Langste naam", S.longestName ? S.longestName.n.replace(/\s*\(.*?\)|\s/g, "").length + " letters" : "–", S.longestName ? `${S.longestName.n.replace(/\s*\(.*?\)/g, "")}, in vijf woorden. De kortste: ${S.shortestName.n}, met ${S.shortestName.n.replace(/\s*\(.*?\)|\s/g, "").length}.` : ""],
    ["Groot gezin", S.bigFamily[0] ? S.bigFamily[0].kids + " kinderen" : "–", S.bigFamily[0] ? `Het grootste gezin in de lijsten: ${S.bigFamily[0].m.n} en ${S.bigFamily[0].f.n}. Bij veel paren kennen we nog niet alle kinderen.` : ""],
    ["Thuisblijvers", `${Math.round(S.within20 / S.moves.length * 100)}%`, `${S.within20} van de ${S.moves.length} voorouders van wie geboorte- en sterfplaats bekend zijn, overleden binnen 20 kilometer van hun geboorteplaats. ${S.stay} stierven in hun geboortedorp.`],
    ["Bewaard papier", nl(S.srcN), `Zoveel bronvermeldingen staan er in de profielen: akten, bidprentjes, registers en genealogieën. Gemiddeld ${r1(S.srcN / ancestors.length)} per voorouder.`]
  ];
  host.innerHTML = `
    <div class="eyebrow">Cijfers</div>
    <h1 class="page-title">De familie in getallen</h1>
    <p class="lede">Alles op deze pagina wordt berekend uit de gegevens op deze site, dus het groeit mee met het onderzoek. Alleen overleden voorouders tellen mee. Veel data zijn doopdata of schattingen (ca.); daarom staat bij elk getal op hoeveel personen het rust.</p>
    <div class="stats bigstats">${[[ancestors.length, "voorouders"], [S.maxGen, "generaties"], [S.oldestYearAB, "oudste jaartal met bron"], [S.nPlaces, "plaatsen op de kaart"]].map(s => `<div class="stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join("")}</div>
    <div class="cols" style="margin-top:22px;align-items:start">${onThisDay()}
      <div class="box"><span class="eyebrow">Maatstaf</span><h3>Waarom voorouders oud lijken te worden</h3><p style="margin:0;font-size:14px;color:var(--muted)">Een voorouder is per definitie volwassen geworden en heeft een kind gekregen. Wie als kind overleed, komt in een kwartierstaat niet voor. De gemiddelde levensduur hieronder ligt daardoor veel hoger dan de levensverwachting bij de geboorte in die tijd, die in het midden van de negentiende eeuw door de hoge kindersterfte nog maar zo'n 36 tot 38 jaar was. Vergelijk dus met volwassenen, niet met pasgeborenen.</p></div>
    </div>
    <div class="section-head"><h2>Weetjes</h2><p>Berekend, niet bedacht.</p></div>
    <div class="grid-4 funs">${fun.map(f => `<article class="fun"><span class="eyebrow">${esc(f[0])}</span><b>${esc(f[1])}</b><p>${esc(f[2])}</p></article>`).join("")}</div>

    <div class="section-head" id="c-leven"><h2>Leven en sterven</h2><p>${S.life.length} voorouders met een geboorte- en sterfjaar; ${S.life.filter(x => x.exact).length} daarvan tot op de dag.</p></div>
    <div class="cols">
      <div class="box"><h3>Gemiddelde leeftijd</h3>
        <div class="duo"><div><b class="big">${r0(mAvg)}</b><span>jaar · ${S.lifeM.length} mannen</span><small>mediaan ${r0(medianOf(S.lifeM))}</small></div><div><b class="big">${r0(fAvg)}</b><span>jaar · ${S.lifeF.length} vrouwen</span><small>mediaan ${r0(medianOf(S.lifeF))}</small></div></div>
        <h5 class="eyebrow" style="margin:18px 0 8px">Naar geboorteperiode (mannen · vrouwen)</h5>
        ${S.periods.map(x => `<div class="period"><span>${x.l}</span>${hbars([{ l: "m", v: x.m || 0, txt: r0(x.m), c: "var(--l8)" }, { l: "v", v: x.f || 0, txt: r0(x.f), c: "var(--l13)" }])}<small class="mono">${x.n}</small></div>`).join("")}
        <p class="small" style="margin:8px 0 0">De laatste kolom is het aantal personen. Kleine groepen schommelen sterk.</p>
      </div>
      <div class="box"><h3>Leeftijd bij overlijden</h3>${vbars(S.buckets.map(b => ({ l: b.l, full: b.l + "–" + (+b.l + 9) + " jaar", v: b.v })), { bw: 26, gap: 9, label: "Aantal voorouders per leeftijdsgroep bij overlijden" })}
        <p class="small" style="margin:6px 0 14px">Aantal voorouders per tiental jaren.</p>
        <h5 class="eyebrow" style="margin:0 0 6px">Het oudst geworden</h5><ol class="rank">${S.oldest.map(x => `<li>${pb(x.p)} <span class="mono">${Math.floor(x.v)}${x.exact ? "" : " (ca.)"}</span></li>`).join("")}</ol>
        <h5 class="eyebrow" style="margin:14px 0 6px">Het jongst overleden</h5><ol class="rank">${S.youngest.map(x => `<li>${pb(x.p)} <span class="mono">${Math.floor(x.v)}${x.exact ? "" : " (ca.)"}</span></li>`).join("")}</ol>
      </div>
    </div>

    <div class="section-head" id="c-trouwen"><h2>Trouwen</h2><p>${S.couples.length} paren in de stamboom, ${S.nDated} met een trouwdatum.</p></div>
    <div class="cols">
      <div class="box"><h3>Trouwmaand</h3>${vbars(S.months.map((m, i) => ({ l: m.l, full: MONTHS[i], v: m.v })), { bw: 24, gap: 8, label: "Huwelijken per maand" })}
        <h3 style="margin-top:18px">Dag van de week</h3>${vbars(S.dows, { bw: 34, gap: 12, label: "Huwelijken per weekdag" })}
        <p class="small" style="margin:6px 0 0">Weekdagen vanaf 1701, toen Friesland de gregoriaanse kalender invoerde (${S.nGreg} huwelijken). De datum is die van het huwelijk in de akte of het trouwboek.</p></div>
      <div class="box"><h3>Bruid en bruidegom</h3>
        <div class="duo"><div><b class="big">${r1(ageMAvg)}</b><span>jaar · bruidegom</span><small>${S.ageM.length} huwelijken</small></div><div><b class="big">${r1(ageFAvg)}</b><span>jaar · bruid</span><small>${S.ageF.length} huwelijken</small></div></div>
        <ul class="facts">
          ${S.youngBride ? `<li>Jongste bruid: ${pb(S.youngBride.c.f)}, ${Math.floor(S.youngBride.v)} jaar${yr(S.youngBride.c.md) ? " (" + yr(S.youngBride.c.md) + ")" : ""}.</li>` : ""}
          ${S.oldGroom ? `<li>Oudste bruidegom: ${pb(S.oldGroom.c.m)}, ${Math.floor(S.oldGroom.v)} jaar${yr(S.oldGroom.c.md) ? " (" + yr(S.oldGroom.c.md) + ")" : ""}.</li>` : ""}
          <li>Bij ${S.wifeOlder.length} van de ${S.gaps.length} paren met twee geboortejaren was de vrouw ouder dan de man (${Math.round(S.wifeOlder.length / S.gaps.length * 100)}%).${S.bigWifeOlder ? ` Het grootste verschil: ${pb(S.bigWifeOlder.c.f)} was ${Math.round(-S.bigWifeOlder.v)} jaar ouder dan ${pb(S.bigWifeOlder.c.m)}.` : ""}</li>
          ${S.bigGap && S.bigGap.v > 0 ? `<li>Grootste leeftijdsverschil: ${pb(S.bigGap.c.m)} was ${Math.round(S.bigGap.v)} jaar ouder dan ${pb(S.bigGap.c.f)}.</li>` : ""}
        </ul>
        <h3 style="margin-top:18px">Samen en alleen</h3>
        <ul class="facts">
          ${S.longMarriage.length ? `<li>Gemiddeld duurde een huwelijk ${r0(S.avgMarriage)} jaar (${S.longMarriage.length ? "tot de dood van de eerste partner" : ""}). Het langst: ${S.longMarriage.map(x => `${pb(x.c.m)} en ${pb(x.c.f)}, ${Math.floor(x.v)} jaar`).join("; ")}.</li>` : ""}
          <li>Van de ${S.nWid} paren met twee sterfdata overleefde de vrouw haar man ${S.widows} keer, en de man zijn vrouw ${S.widowers} keer.</li>
          ${S.longWidow ? `<li>Het langst alleen verder: ${pb(S.longWidow.v > 0 ? S.longWidow.c.f : S.longWidow.c.m)}, ${Math.round(Math.abs(S.longWidow.v))} jaar na ${S.longWidow.v > 0 ? "haar man" : "zijn vrouw"}. Of er een tweede huwelijk volgde, staat in het profiel.</li>` : ""}
        </ul></div>
    </div>

    <div class="section-head" id="c-generaties"><h2>Generaties</h2><p>Hoe oud waren de ouders bij de geboorte van het kind in de lijn?</p></div>
    <div class="cols">
      <div class="box"><div class="duo"><div><b class="big">${r1(meanOf(S.gf.map(x => x.v)))}</b><span>jaar · vaders</span><small>${S.gf.length} keer gemeten</small></div><div><b class="big">${r1(meanOf(S.gm.map(x => x.v)))}</b><span>jaar · moeders</span><small>${S.gm.length} keer gemeten</small></div></div>
        <p style="margin:14px 0 0;font-size:14px;color:var(--muted)">Een generatie duurde gemiddeld ${r1(S.genAvg)} jaar, ongeveer ${r1(genPerCent)} generaties per eeuw. Dat is langer dan de vuistregel van 25 tot 30 jaar: het kind in de lijn is lang niet altijd het oudste kind.</p></div>
      <div class="box"><ul class="facts">
        ${S.youngMother ? `<li>Jongste moeder: ${pb(S.youngMother.p)}, ${Math.floor(S.youngMother.v)} jaar bij de geboorte van ${pb(S.youngMother.c)}.</li>` : ""}
        ${S.oldFather ? `<li>Oudste vader: ${pb(S.oldFather.p)}, ${Math.floor(S.oldFather.v)} jaar bij de geboorte van ${pb(S.oldFather.c)}.</li>` : ""}
        <li>Generatie ${ROMAN[S.maxGen]} is de verste die nu bekend is. Op die hoogte heeft iedereen ${nl(2 ** (S.maxGen - 1))} voorouders, als er geen kwartierverlies is.</li>
        <li>${S.implex} vakken in de stamboom zijn dubbel bezet: drie voorouderparen komen langs twee lijnen terug, en hun eigen voorouders dus ook. <button class="link" data-go="verhaal-lijnen">Over kwartierverlies</button></li>
      </ul></div>
    </div>

    <div class="section-head" id="c-namen"><h2>Namen</h2><p>${S.nGivenM} verschillende mannennamen, ${S.nGivenF} vrouwennamen en ${S.surnames} achternamen of patroniemen. Klik op een naam voor de populariteit bij het Meertens Instituut.</p></div>
    <div class="cols">
      <div class="box"><h3>Mannen</h3>${hbars(S.namesM.map(([n, v]) => ({ l: n, v, html: `<a href="https://nvb.meertens.knaw.nl/naam/is/${enc(n)}" target="_blank" rel="noopener">${esc(n)}</a>`, c: "var(--l8)" })))}</div>
      <div class="box"><h3>Vrouwen</h3>${hbars(S.namesF.map(([n, v]) => ({ l: n, v, html: `<a href="https://nvb.meertens.knaw.nl/naam/is/${enc(n)}" target="_blank" rel="noopener">${esc(n)}</a>`, c: "var(--l13)" })))}</div>
    </div>
    <p class="small" style="margin:10px 0 0">Geteld is de eerste voornaam zoals die in de akte staat. Friese namen hadden vaak varianten (Jan, Jannes; Grietje, Grytje); die zijn niet samengevoegd. Kinderen werden meestal naar hun grootouders genoemd, en daardoor keren dezelfde namen in elke generatie terug.</p>

    <div class="section-head" id="c-werk"><h2>Werk</h2><p>${S.nOcc} voorouders met een bekend beroep. Wie meer dan één beroep had, telt bij elk mee.</p></div>
    <div class="box">${hbars(S.occ, { wide: true })}</div>

    <div class="section-head" id="c-plaatsen"><h2>Plaatsen</h2><p>Waar de meeste voorouders woonden, en hoe ver ze van huis stierven.</p></div>
    <div class="cols">
      <div class="box"><h3>Meeste voorouders</h3>${hbars(S.topPlaces.map(([k, v]) => ({ l: k, v, html: `<button class="link" data-go="${slug(k)}">${esc(placeName(k))}</button>`, c: "var(--l12)" })))}<p class="small" style="margin:8px 0 0">Aantal voorouders dat er geboren werd, trouwde, woonde of overleed.</p></div>
      <div class="box"><h3>Van wieg tot graf</h3>
        <div class="duo"><div><b class="big">${r0(medianOf(S.moves.map(x => x.v)))}</b><span>km · mediaan</span><small>${S.moves.length} personen</small></div><div><b class="big">${S.stay}</b><span>stierven in hun geboortedorp</span><small>${Math.round(S.stay / S.moves.length * 100)}%</small></div></div>
        <h5 class="eyebrow" style="margin:16px 0 6px">Het verst van huis</h5>
        <ol class="rank">${S.far.map(x => `<li>${pb(x.p)} <span class="small">${esc(placeName(x.p.bp))} → ${esc(placeName(x.p.dp))}</span> <span class="mono">${r0(x.v)} km</span></li>`).join("")}</ol>
        <p class="small" style="margin:8px 0 0">Hemelsbreed, tussen de dorpskernen.${T.key === "h" ? " Wie ver weg overleed maar buiten de kaart viel (Calgary, Sumatra) was geen voorouder maar een broer of zus." : ""}</p></div>
    </div>

    ${MONEY.length ? `    <div class="section-head" id="c-geld"><h2>Geld in perspectief</h2><p>Bedragen uit notariële akten, naast het dagloon van een arbeider rond 1819.</p></div>
    <div class="box"><div class="tablewrap"><table class="money"><thead><tr><th>Jaar</th><th>Wat</th><th class="r">Gulden</th><th class="r">Jaren arbeidersloon</th></tr></thead><tbody>
      ${MONEY.slice().sort((a, b) => a.y - b.y).map(m => `<tr><td class="mono">${m.y}</td><td><b>${esc(m.t)}</b><br><span class="small">${esc(m.d)} · ${pb(person(m.kw))}</span></td><td class="mono r">ƒ ${nl(m.amt)}</td><td class="mono r"><span class="mlab">jaarlonen: </span>${m.y <= 1860 ? (m.amt / (WAGE.high * WAGE.days) < 1 ? "minder dan 1" : r0(m.amt / (WAGE.high * WAGE.days)) + " à " + r0(m.amt / (WAGE.low * WAGE.days))) : "–"}</td></tr>`).join("")}
    </tbody></table></div>
    <p class="small" style="margin:10px 0 0">${esc(WAGE.d)} Bron: <a href="${esc(WAGE.src[1])}" target="_blank" rel="noopener">${esc(WAGE.src[0])}</a>. Na 1860 stegen de lonen; daarom staat bij de latere bedragen geen omrekening. De boedel van de Terwisscha's uit 1819 was dus ${r0(47313 / (WAGE.high * WAGE.days))} tot ${r0(47313 / (WAGE.low * WAGE.days))} jaarlonen waard: deze familie was echt welgesteld.</p></div>` : ""}

    <div class="section-head" id="c-bronnen"><h2>Bewijs en bronnen</h2><p>Waar de cijfers op rusten.</p></div>
    <div class="cols">
      <div class="box"><h3>Status van de voorouders</h3>${statusBars()}</div>
      <div class="box"><h3>${nl(S.srcN)} bronvermeldingen</h3>${hbars(S.srcTypes.map(t => ({ l: t.l, v: t.v, c: "var(--gold)" })))}</div>
    </div>`;
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
  const row = e => `<li data-n="${esc(norm(e.key + " " + e.ps.map(p => p.n).join(" ")))}"><div class="nm"><b>${esc(e.key)}</b><span class="dots">${[...e.lines].map(l => `<i style="background:var(--l${l})" title="${esc(LINES[l].name)}"></i>`).join("")}</span><span class="mono small">${e.ps.length}${e.y0 < 9999 ? ` · ${e.y0}${e.y1 > e.y0 ? "–" + e.y1 : ""}` : ""}</span></div><div class="who">${e.ps.sort((a, b) => a.kw - b.kw).map(p => `<button class="link" data-open="${p.kw}">${esc(firstName(p))}</button>`).join(", ")}</div></li>`;
  host.innerHTML = `
    <div class="eyebrow"><button class="link" data-go="personen">Personen</button> › Namenregister</div>
    <h1 class="page-title">Namenregister</h1>
    <p class="lede">Alle ${list.length} achternamen en patroniemen in de stamboom, op alfabet. Voorvoegsels als de, van en ten staan achter de naam: De Groot vind je bij de G. Tot 1811 hadden veel voorouders geen vaste achternaam; dan staat hier het patroniem (Hylkes, zoon van Hylke). Klik een voornaam voor het profiel.</p>
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
  const head = `<span class="kwn">${kw}</span> <b>${esc(p.n)}</b>`;
  if (p.living) return `<p class="ke">${head} <span class="small">(levend; alleen de naam)</span></p>`;
  if (p.aliasOf) return `<p class="ke">${head} <span class="small">is dezelfde persoon als kw ${p.aliasOf} (kwartierverlies); zie daar.</span></p>`;
  const bits = [];
  if (p.b || p.bp) bits.push((p.bapt && !p.b ? "gedoopt" : "geboren") + " " + [fmt(p.b), placeName(p.bp)].filter(Boolean).join(", "));
  if (p.d || p.dp) bits.push("overleden " + [fmt(p.d), placeName(p.dp)].filter(Boolean).join(", "));
  if (p.occ) bits.push(p.occ.split(";")[0]);
  if (p.m && kw % 2 === 0 && person(kw + 1)) bits.push("trouwde" + (p.m.d ? " " + fmt(p.m.d) : "") + (p.m.p ? " in " + placeName(p.m.p) : "") + ` met ${person(kw + 1).n} (${kw + 1})`);
  return `<p class="ke">${head} ${stTag(p.st)}${bits.length ? ": " + esc(bits.join("; ")) + "." : ""}</p>`;
}
function renderLijst() {
  const host = $("#v-lijst"), l = lijstState.line;
  const kws = [...BY.keys()].filter(k => !l || (k >= 4 && lineOf(k) === l)).sort((a, b) => a - b);
  const maxG = Math.max(...kws.map(gen));
  let body = "";
  for (let g = 1; g <= maxG; g++) { const ks = kws.filter(k => gen(k) === g); if (ks.length) body += `<section class="kgen"><h2>Generatie ${ROMAN[g]} <span class="small">${esc(GEN_NAME[g])}</span></h2>${ks.map(kwEntry).join("")}</section>`; }
  host.innerHTML = `
    <div class="eyebrow noprint"><button class="link" data-go="personen">Personen</button> › Kwartierstaat</div>
    <h1 class="page-title">Kwartierstaat ${l ? "· familie " + esc(LINES[l].name) : esc(T.brand)}</h1>
    <p class="lede">De klassieke vorm: elke voorouder met een nummer. De vader van nummer n is 2n, de moeder 2n + 1. Achter de naam de bewijsstatus (A akte, B sterk, C onzeker, D hypothese). Van levenden staat alleen de naam.</p>
    <div class="toolbar noprint">
      <select id="lijstLine" aria-label="Familie"><option value="0">Alle families</option>${LINE_KEYS.map(k => `<option value="${k}"${k === l ? " selected" : ""}>Familie ${esc(LINES[k].name)}</option>`).join("")}</select>
      <button class="btn primary" id="lijstPrint">Afdrukken of opslaan als pdf</button>
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
    $("#v-verwanten").innerHTML = `<div class="eyebrow"><button class="link" data-go="verhalen">Verhalen</button> › Bekende verwanten</div>
      <h1 class="page-title">Adel, macht, geld of geschiedenis?</h1>
      <p class="lede">${esc(T.TXT.verwanten || "In de stamboom van " + T.root + " zijn nog geen bekende verwanten onderzocht.")}</p>
      ${NOTABLES.length ? `<div class="notables three">${NOTABLES.map(N => notableCard(N)).join("")}</div>` : ""}
      ${(T.HISTORY_TOUCH || []).length ? `<div class="section-head"><h2>Geraakt door de grote geschiedenis</h2></div><ul class="restl touch">${T.HISTORY_TOUCH.map(h => { const p = person(h.kw); return `<li><span class="y">${esc(h.y)}</span><span><b>${esc(h.t)}</b><br><span style="color:var(--muted)">${esc(h.d)}</span>${p ? `<br><button class="link" data-open="${h.kw}">${esc(p.n)}</button>` : ""}</span></li>`; }).join("")}</ul>` : ""}`;
    return;
  }
  $("#v-verwanten").innerHTML = `
    <div class="eyebrow"><button class="link" data-go="verhalen">Verhalen</button> › Bekende verwanten</div>
    <h1 class="page-title">Adel, macht, geld of geschiedenis?</h1>
    <p class="lede">We zochten in de hele stamboom naar mensen die in de geschiedenisboeken staan: edelen, bestuurders, rijke grondbezitters, of mensen die bij grote gebeurtenissen betrokken waren. Het korte antwoord: in de directe lijn geen adel en geen hoge bestuurders. Wel twee bekende geestelijken als naaste verwanten, onder wie een heilige, en een paar welgestelde boeren en kooplieden.</p>
    <div class="section-head"><h2>Bloedverwanten met een plaats in de geschiedenis</h2><p>Afstammelingen van dezelfde voorouders, met akten bewezen.</p></div>
    <div class="notables">${NOTABLES.filter(N => N.verdict === "bewezen" && ["brandsma", "spitzen"].includes(N.id)).map(N => notableCard(N)).join("")}</div>
    <div class="section-head"><h2>Aangetrouwd, en alleen dezelfde naam</h2><p>Wat we ook nagingen, en waarom het geen of een zwakke band is.</p></div>
    <div class="notables three">${NOTABLES.filter(N => !(N.verdict === "bewezen" && ["brandsma", "spitzen"].includes(N.id))).map(N => notableCard(N)).join("")}</div>
    <div class="section-head"><h2>Geraakt door de grote geschiedenis</h2><p>Waar de familie de grote gebeurtenissen van haar tijd kruiste.</p></div>
    <ul class="restl touch">${HISTORY_TOUCH.map(h => { const p = person(h.kw); return `<li><span class="y">${esc(h.y)}</span><span><b>${esc(h.t)}</b><br><span style="color:var(--muted)">${esc(h.d)}</span>${p ? `<br><button class="link" data-open="${h.kw}">${esc(p.n)}</button>` : ""}</span></li>`; }).join("")}</ul>
    <div class="section-head"><h2>Rijk of arm?</h2><p><button class="link" data-go="cijfers">Alle bedragen bij Cijfers</button></p></div>
    <div class="cols">
      <div class="box"><h3>Welgesteld</h3><p style="margin:0;font-size:14px;color:var(--muted)">De familie Terwisscha van Scheltinga had eigen grond: de boedel van Titus Bokkes (kw 208), verdeeld in 1819, was ƒ ${nl(47313)} waard, zo'n 200 tot 300 jaarlonen van een arbeider. Zijn zoon Assuerus (kw 104) was in 1832 koopman en grondeigenaar; twee dochters trouwden met de houthandelaars Overmeer in Makkum, een derde met Hendrik Brandsma op Ugoklooster. Akke Meinsma (kw 73), de weduwe van Remke Kingma, stond in 1832 in het kadaster als eigenaar van 21 percelen, samen ongeveer 44 hectare.</p></div>
      <div class="box"><h3>Gewoon</h3><p style="margin:0;font-size:14px;color:var(--muted)">De meeste voorouders waren pachtboeren, veehouders, knechten, meiden en kleine middenstanders. In 1811 hadden veel van hen nog geen vaste achternaam. Het hoogste ambt in de directe lijn: Lammert de Jong (kw 120) was gemeenteraadslid, en Kornelis Moezen (kw 34) kerkvoogd. Grietmannen, burgemeesters, predikanten of officieren komen in de directe lijn niet voor.</p></div>
    </div>`;
}

const RENDER = { overzicht: renderOverzicht, stamboom: renderStamboom, families: renderFamilies, personen: renderPersonen, verhalen: renderVerhalen, tijdlijn: renderTijdlijn, kaart: renderKaart, plaats: renderPlaats, beeld: renderBeeld, cijfers: renderCijfers, verwanten: renderVerwanten, bronnen: renderBronnen, namen: renderNamen, lijst: renderLijst };
/* ---------- twee bomen: wisselen ---------- */
/* hash "#a-..." = de boom van Alies; zonder prefix = Harrie. Interne links (data-go, data-open) blijven in de huidige boom. */
function treeChrome() {
  const b = $("header.top .brand"); if (b) b.innerHTML = `${esc(T.brand)}<small>stamboom</small>`;
  const tb = $("#treebar"); if (tb) tb.hidden = !TREES.a;
  $$("[data-tree=s]").forEach(x => x.hidden = !TREES.s);
  $$("[data-tree]").forEach(x => x.setAttribute("aria-pressed", x.dataset.tree === T.key));
  $$("#treebar [data-tree]").forEach(x => { const t = TREES[x.dataset.tree]; if (!t) return; /* teksten uit de boomgegevens: wie staat in het midden, welke families */
    const half = { h: "M7.5 1.5a6 6 0 0 0 0 12z", a: "M7.5 1.5a6 6 0 0 1 0 12z", s: "M6.8 1.54a6 6 0 0 0 0 11.92zM8.2 1.54a6 6 0 0 1 0 11.92z" }[t.key] || "";
    x.innerHTML = `<svg class="tb-ic" viewBox="0 0 15 15" aria-hidden="true"><circle cx="7.5" cy="7.5" r="6"/><path d="${half}"/></svg><span class="tb-tx"><b>${esc(t.root)}</b><span>${esc(t.brand)}</span></span>`;
    x.title = `Stamboom van ${t.rootFull}`; });
  const sl = $("#v-stamboom .lede"); if (sl) sl.textContent = `Het midden is ${T.root}. Elke ring telt een generatie verder terug: vaders kant links, moeders kant rechts. Klik op een vak voor het profiel, of kies Boom om stap voor stap terug te lopen.`;
  document.title = "Stamboom " + T.brand.replace(" · ", "-");
  $("#foot").innerHTML = `${esc(VERSION)} · Gemaakt voor de families De Groot, Boersma, Hoekstra en Bakker. Van levende familieleden staan alleen namen vermeld. <button class="link" data-go="bronnen">Bronnen en verantwoording</button>`;
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
  treeRoot = 1; lijstState.line = 0; beeldState.kind = "all"; beeldState.q = "";
  treeChrome();
  return true;
}
const treeOfHash = h => TREES.a && /^a-/.test(h) ? "a" : TREES.s && /^s-/.test(h) ? "s" : "h";
const stripTree = h => h.replace(/^[as]-/, "");
document.addEventListener("click", e => { const t = e.target.closest("[data-tree]"); if (!t) return; e.preventDefault(); if (setTree(t.dataset.tree)) go(currentToken()); });
treeChrome();

/* ---------- boot ---------- */
buildIndex();
function boot() {
  const raw = (location.hash || "").slice(1); setTree(treeOfHash(raw)); const h = stripTree(raw);
  if (/^kw\d+$/.test(h)) { go("overzicht", { keepHash: true }); openProfile(+h.slice(2), { fromHistory: true }); }
  else go(h || "overzicht", { replace: true });
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
