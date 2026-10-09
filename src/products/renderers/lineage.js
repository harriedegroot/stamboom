/* Renderer "lineage": the stamreeks on a sheet — from father to father, the oldest at the top, one band per generation with name,
   years, places and occupation, and between the bands the link parent–child with its evidence (solid A/B, dashed C, dotted D).
   Fills the height of the sheet: a poster, a long print (30 × 150 cm) or a bookmark. Pure: an SVG string in mm.
   Options: start ({ kw, pair }; a couple starts with the father). */
(function (P) {
  const ROMAN = n => { const t = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]; let s = ""; t.forEach(([v, r]) => { while (n >= v) { s += r; n -= v; } }); return s; };
  const genOf = kw => Math.floor(Math.log2(kw)) + 1;
  function chainOf(data, start) {
    const st = P.startOf(start), by = new Map(data.people.map(p => [p.kw, p])), al = data.aliases || {}, res = k => al[k] || k;
    const out = []; let k = st.pair ? st.people[0] : st.rootKw;
    while (k < 2 ** 40) { const p = by.get(res(k)); if (!p) break; out.push({ pos: k, p }); k *= 2; }
    return out;                                                         /* youngest first */
  }
  (P.renderers = P.renderers || {}).lineage = { render: (d, o, c) => draw(d, o, c), chainOf }; /* draw is defined below */
  function draw(data, o, ctx) {
    const S = P.sheet, PT = S.PT, pf = ctx.platform, pal = ctx.palette || {}, { w, h } = ctx.size, min = ctx.product.minPt || 6;
    const narrow = w < 120, u = Math.min(w, h) / 100;
    const M = narrow ? Math.max(4, 7 * u) : 6 * u;
    const chain = chainOf(data, o.start), first = chain[0], oldest = chain[chain.length - 1];
    const name = first ? (first.pos === 1 && !P.startOf(o.start).pair ? data.root : first.p.n) : "";
    /* header: on a narrow sheet only the title, smaller */
    const L = { u: narrow ? w / 30 : u, M, head: 0, foot: 0 };
    const head = narrow ? (() => { const t = pf.wrap("De stamreeks van " + name, S.FONT.title, Math.max(min + 2, w * 0.09 / PT), w - 2 * M, 3, min); let y = M, svg = "";
        t.lines.forEach((s, i) => { y += (i ? 1.05 : 1.1) * t.pt * PT; svg += S.text(w / 2, y, s, t.pt * PT, { font: S.FONT.title, anchor: "middle", fill: pal.ink }); }); return { svg, height: y - M + 2 }; })()
      : S.header(ctx, S.layout(w, h), w, data.brand, "De stamreeks van " + name, chain.length > 1 ? `Van vader op vader: ${chain.length} generaties, tot ${oldest.p.n}` : "");
    const foot = narrow ? { svg: S.text(w / 2, h - M * 0.6, data.url || "", Math.max(min, 6) * PT, { font: S.FONT.mono, anchor: "middle", fill: pal.muted }), height: 4 }
      : S.footer(ctx, S.layout(w, h), w, h, { lines: [], lineNames: {}, evidence: true, gold: false, source: `Bij elke persoon staan de bronnen en akten op ${data.url || ""}`, asOf: data.asOf });
    const top = M + head.height + 2 * u, bottom = h - M - foot.height - 2 * u, A = bottom - top, n = chain.length;
    /* one band per generation, the link between two bands; the letter size follows the height that is available */
    const band = A / Math.max(1, n), gap = band * 0.22, boxH = band - gap;
    /* four lines (name, years, places, occupation) must fit in a band */
    const nameMm = Math.max(min * PT, Math.min(boxH * (narrow ? 0.3 : 0.24), narrow ? w * 0.075 : w * 0.05)), smallMm = Math.max(min * PT, nameMm * 0.62);
    const place = k => (data.places && data.places[k] && data.places[k].name) || k;
    const x0 = M + (narrow ? 0 : 8 * u), boxW = w - M - x0;
    let svg = "";
    [...chain].reverse().forEach((c, i) => {
      const y = top + i * band, p = c.p, g = genOf(c.pos), col = pal["l" + (p.line || 8)] || pal.accent;
      const op = p.living ? 0.06 : ({ A: 0.16, B: 0.11, C: 0.07, D: 0.04 })[p.st] || 0.1;
      svg += `<rect x="${x0.toFixed(2)}" y="${y.toFixed(2)}" width="${boxW.toFixed(2)}" height="${boxH.toFixed(2)}" fill="${col}" fill-opacity="${op}" stroke="${col}" stroke-width="0.3"${p.st === "C" ? ` stroke-dasharray="1.2 0.8"` : p.st === "D" ? ` stroke-dasharray="0.4 0.8"` : ""}/>`;
      if (!narrow) svg += S.text(M + 4 * u, y + boxH / 2 + smallMm * 0.35, ROMAN(g), smallMm, { font: S.FONT.mono, anchor: "middle", fill: pal.muted });
      const pad = Math.min(3 * u, boxW * 0.05), maxW = boxW - 2 * pad;
      const nm = pf.fit(p.n, S.FONT.sansBold, nameMm / PT, maxW, min);
      const yrs = S.lifeYears(p), places = p.living ? "" : [p.bp ? "° " + place(p.bp) : "", p.m && p.m.p ? "× " + place(p.m.p) : "" /* × for married: ⚭ is not in the print fonts (a system font stood in) */, p.dp ? "† " + place(p.dp) : ""].filter(Boolean).join("  ");
      const occ = p.living ? "" : String(p.occ || "").split(";")[0].trim();
      const lines = [[nm.text, nm.pt * PT, S.FONT.sansBold, pal.ink], ...[[[yrs, p.st && p.st !== "A" && !p.living ? "bewijs " + p.st : ""].filter(Boolean).join("  · "), smallMm], [places, smallMm], [occ, smallMm]]
        .filter(([t]) => t).map(([t, mm]) => { const f = pf.fit(t, S.FONT.sans, mm / PT, maxW, min); return [f.text, f.pt * PT, S.FONT.sans, pal.muted]; })];
      let used = 0; const fitL = []; for (const l of lines) { const lh = l[1] * 1.3; if (used + lh > boxH * 0.94 && fitL.length) break; fitL.push(l); used += lh; }
      let ty = y + (boxH - used) / 2;
      fitL.forEach(([t, mm, font, fill]) => { ty += mm * 1.3; svg += S.text(x0 + pad, ty - mm * 0.3, t, mm, { font, fill }); });
      /* the link to the next (younger) generation */
      if (i < n - 1) { const child = [...chain].reverse()[i + 1], lk = child.p.link || child.p.st || "A", lx = x0 + Math.min(boxW * 0.08, 10 * u), y1 = y + boxH, y2 = y + band;
        svg += `<line x1="${lx.toFixed(2)}" x2="${lx.toFixed(2)}" y1="${y1.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${pal.faint}" stroke-width="0.5"${lk === "C" ? ` stroke-dasharray="1.2 0.8"` : lk === "D" ? ` stroke-dasharray="0.4 0.8"` : ""}/>`;
        const lab = pf.fit(`vader van ${S.firstName(child.p)} · ${lk}`, S.FONT.sans, Math.max(min, Math.min(gap * 0.6, smallMm) / PT), boxW - (lx - x0) - pad, min);
        if (gap > lab.pt * PT * 1.2) svg += S.text(lx + 1.5 * u, (y1 + y2) / 2 + lab.pt * PT * 0.35, lab.text, lab.pt * PT, { fill: pal.muted }); }
    });
    const page = S.wrapSheet(w, h, ctx.bleed || 0, pal, head.svg + svg + foot.svg);
    return { pages: [{ name: "poster", svg: page }], fonts: S.FONTS, imagesUsed: [], title: "De stamreeks van " + name, stats: { generations: n } };
  }
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
