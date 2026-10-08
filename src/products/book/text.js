/* Text helpers for the book: pure functions over plain data (no DOM), so the book can be built in the browser and on a server.
   They mirror the helpers of the site (app.js) that the book used; bookText(data) binds them to one tree's book data
   (places, offmap, status labels, short texts). */
(function (P) {
  const MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
  const ROMAN = Array.from({ length: 64 }, (_, n) => [[50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]].reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, ""));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const year = s => { if (!s) return null; const m = String(s).match(/(\d{4})/); return m ? +m[1] : null; };
  const isApprox = s => /ca\.|~|\bof\b/.test(String(s || ""));
  const gen = kw => Math.floor(Math.log2(kw)) + 1;
  /* the family line of a quarter number: kw 4–7 belong to the line of their father's father (8, 10, 12, 14) */
  const lineOf = kw => kw < 4 ? null : kw < 8 ? ({ 4: 8, 5: 10, 6: 12, 7: 14 })[kw] : kw >> (gen(kw) - 4);
  const noteObj = n => typeof n === "string" ? { t: n } : n;
  function fmtDate(s) {
    if (!s) return "";
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/), ym = String(s).match(/^(\d{4})-(\d{2})$/);
    return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : ym ? `${MONTHS[+ym[2] - 1]} ${ym[1]}` : String(s);
  }
  function lifeYears(p) {
    if (p.living) return "levend";
    const b = year(p.b), d = year(p.d);
    if (!b && !d) return "jaartallen onbekend";
    const bs = b ? (isApprox(p.b) ? "ca. " + b : b) : "?";
    const ds = d ? (/\bof\b/.test(p.d) ? p.d : isApprox(p.d) ? "ca. " + d : d) : "?";
    return `${bs} – ${ds}`;
  }
  function splitName(n) {
    const w = String(n).replace(/\(.*?\)/g, "").trim().split(/\s+/);
    if (w.length === 1) return { given: w, sur: "" };
    let i = w.indexOf("Terwisscha");
    if (i < 0) i = w.findIndex((x, k) => k > 0 && /^(de|ten|van|der|den)$/.test(x));
    if (i < 0) i = w.length - 1;
    return { given: w.slice(0, i), sur: w.slice(i).join(" ") };
  }
  const firstName = p => p ? p.roep || splitName(p.n).given[0] || p.n : "";
  /* the Dutch series of generation words: per four generations a prefix (–, oud, stam, …), within it –, groot, overgroot, betovergroot */
  function genPre(s) {
    if (s < 1 || s > 32) return undefined;
    return ["", "oud", "stam", "stamoud", "edel", "edeloud", "edelstam", "edelstamoud"][(s - 1) >> 2] + ["", "groot", "overgroot", "betovergroot"][(s - 1) & 3];
  }
  const isMale = kw => kw % 2 === 0;
  function relBase(s, kw, rootName) {
    if (s === 0) return rootName + " zelf";
    const pre = genPre(s);
    if (pre === undefined) return isMale(kw) ? "voorvader" : "voormoeder";
    return pre + (isMale(kw) ? "vader" : "moeder");
  }
  const siteHost = u => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, "") + x.pathname).replace(/\/$/, ""); } catch (e) { return ""; } };
  function bookText(data) {
    const places = data.places || {}, offmap = data.offmap || {}, short = data.short || {}, status = data.status || {};
    const placeName = k => !k ? "" : (places[k] ? (places[k].name || k) : (offmap[k] || k));
    /* the short sentence (KORT) of a person, as a paragraph; never for the living */
    const shortLine = p => { if (!p || p.living) return ""; const z = short[p.kw]; return z ? `<p class="bk-kort">${esc(z)}</p>` : ""; };
    const statusLong = s => status[s] ? status[s].long : "";
    return { esc, year, isApprox, gen, lineOf, noteObj, fmtDate, lifeYears, splitName, firstName, genPre, relBase, placeName, shortLine, statusLong, siteHost, ROMAN, MONTHS };
  }
  P.bookText = bookText;
  Object.assign(P.bookText, { esc, year, gen, lineOf, genPre, ROMAN });
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
