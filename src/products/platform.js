/* Platform: the few things the core needs from its surroundings — measuring text and the fonts that are used. In the browser
   text is measured with a canvas; elsewhere (a test in Node, later a server) an estimate is used until a font library is plugged in.
   measure(text, font, pt) → width in mm; fit(text, font, pt, maxMm, minPt) → { text, pt } (smaller first, never below minPt, then
   shortened with "…"); wrap(text, font, pt, maxMm, maxLines, minPt) → { lines, pt }. font: { family, weight, style }. */
(function (P) {
  const MM_PER_PT = 25.4 / 72;
  function makePlatform(o = {}) {
    let ctx = null;
    if (!o.estimate && typeof document !== "undefined" && document.createElement) {
      try { ctx = document.createElement("canvas").getContext("2d"); } catch (e) { ctx = null; }
    }
    const cache = new Map();
    function measure(text, font, pt) {
      const f = font || {}, key = `${f.style || "normal"}|${f.weight || 400}|${f.family || "IBM Plex Sans"}|${text}`;
      let em = cache.get(key);
      if (em === undefined) {
        if (ctx) { ctx.font = `${f.style || "normal"} ${f.weight || 400} 100px "${f.family || "IBM Plex Sans"}"`; em = ctx.measureText(String(text)).width / 100; }
        else em = String(text).length * (/Caslon/.test(f.family || "") ? 0.44 : /Mono/.test(f.family || "") ? 0.6 : (f.weight || 400) >= 600 ? 0.58 : 0.54); /* average letter width per family */
        cache.set(key, em);
      }
      return em * pt * MM_PER_PT;
    }
    function fit(text, font, pt, maxMm, minPt) {
      let t = String(text), p = pt; const lo = Math.min(pt, minPt || pt);
      while (p > lo && measure(t, font, p) > maxMm) p = Math.max(lo, p * 0.95);
      if (measure(t, font, p) <= maxMm) return { text: t, pt: p };
      while (t.length > 2 && measure(t + "…", font, p) > maxMm) t = t.slice(0, -1).trimEnd();
      return { text: t + "…", pt: p };
    }
    /* wrap(text, font, pt, maxMm, maxLines, minPt) → { lines, pt }: break at spaces; smaller (never below minPt) until it fits
       in maxLines, else the last line is shortened with "…" */
    function wrap(text, font, pt, maxMm, maxLines = 2, minPt = pt) {
      const words = String(text).split(/\s+/).filter(Boolean);
      const lay = q => { const lines = []; let cur = ""; words.forEach(w => { const t = cur ? cur + " " + w : w; if (cur && measure(t, font, q) > maxMm) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; };
      let q = pt, lines = lay(q);
      while ((lines.length > maxLines || lines.some(l => measure(l, font, q) > maxMm)) && q > minPt) { q = Math.max(minPt, q * 0.95); lines = lay(q); }
      if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = fit(lines[maxLines - 1] + " …", font, q, maxMm, q).text.replace(/ …$/, "…"); }
      return { lines: lines.map(l => measure(l, font, q) > maxMm ? fit(l, font, q, maxMm, q).text : l), pt: q };
    }
    return { measure, fit, wrap, estimate: !ctx, MM_PER_PT };
  }
  Object.assign(P, { makePlatform, MM_PER_PT });
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
