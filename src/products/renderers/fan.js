/* Renderer "fan": the fan chart (waaier) on a sheet — every ancestor in one circle, per family a colour, the evidence label in the
   fill (A full … D faint, C dashed, D dotted), gold where the same ancestor appears through two lines. Names are placed only up to
   the generation where they are still at least the product's minimum size on paper. Pure: an SVG string in mm.
   Ring radii and letter sizes follow the fan on the site (drawFan), so poster and site look the same.
   Options: start ({ kw, pair }), gen (number of rings; "advice" = the largest number at which every ring still has names), and from
   the page title and subtitle (not in the address). */
(function (P) {
  const R = [0, 58, 126, 192, 268, 344, 412, 460, 498, 530];          /* ring radii in fan units, as on the site */
  const FS = [0, 0, 16, 14, 12, 10.5, 9.5, 8, 7];                       /* letter size per generation, in fan units */
  const fs = g => FS[g] || 7;
  const lineOf = kw => { const g = Math.floor(Math.log2(kw)) + 1; return kw < 4 ? null : kw < 8 ? ({ 4: 8, 5: 10, 6: 12, 7: 14 })[kw] : kw >> (g - 4); };
  const genOf = kw => Math.floor(Math.log2(kw)) + 1;
  let drawing = 0; /* a number per drawing, so that the ids of the curved text paths are unique when two fans share a page */

  function measures(ctx) {
    const S = P.sheet, { w, h } = ctx.size, L = S.layout(w, h), D = Math.min(w - 2 * L.M, h - 2 * L.M - L.head - L.foot);
    const min = (ctx.product.minPt || 6) * S.PT;
    /* the last generation with names of at least the minimum size (names may shrink to 0.82 before they are shortened) */
    const namesUpTo = m => { const k = D / (2 * (R[m] + 10)); let n = 1; for (let g = 2; g <= Math.min(m, 8); g++) if (fs(g) * 0.82 * k >= min) n = g; return n; };
    return { L, D, namesUpTo };
  }
  /* how deep the tree goes from the start, plus one empty ring (nothing found there yet) */
  function depthOf(data, start) {
    const st = P.startOf(start), have = new Set(data.people.map(p => p.kw)), al = data.aliases || {};
    let depth = 1;
    for (let g = 2; g <= 9; g++) { const n = 2 ** (g - 1); for (let i = 0; i < n; i++) if (have.has(al[st.rootKw * n + i] || st.rootKw * n + i)) { depth = g; break; } }
    return Math.max(3, Math.min(9, depth + 1));
  }
  function advise(data, o, ctx) {
    const { namesUpTo } = measures(ctx); let best = 4;
    for (let m = 4; m <= 8; m++) if (namesUpTo(m) >= m) best = m;
    return { gen: Math.min(best, depthOf(data, o.start)) };
  }
  function render(data, o, ctx) {
    const S = P.sheet, PT = S.PT, pf = ctx.platform, pal = ctx.palette || {}, { w, h } = ctx.size, min = ctx.product.minPt || 6;
    const { L, D, namesUpTo } = measures(ctx), st = P.startOf(o.start);
    const m = Math.max(3, Math.min(9, +o.gen || 7, depthOf(data, o.start))), lastNamed = namesUpTo(m), V = R[m] + 10, k = D / (2 * V);
    const by = new Map(data.people.map(p => [p.kw, p])), al = data.aliases || {}, res = pos => al[pos] || pos;
    /* positions per person: more than one = the same ancestor through two lines (gold) */
    const count = new Map(), seen = new Set(), lines = new Set();
    for (let g = 2; g <= m; g++) { const n = 2 ** (g - 1); for (let i = 0; i < n; i++) { const pos = st.rootKw * n + i, r = res(pos), p = by.get(r);
      if (!p) continue; count.set(r, (count.get(r) || 0) + 1); if (!p.living) seen.add(r); if (genOf(pos) >= 4) lines.add(lineOf(pos)); } }
    if (st.rootKw >= 8) lines.add(lineOf(st.rootKw));
    /* the title: from the page when it has one (o.title, o.subtitle: the same title as the book, e.g. for a couple "De familie De Groot
       · De Vries"), else "De voorouders van …" */
    const title = o.title || "De voorouders van " + P.startName(data, o.start);
    const head = S.header(ctx, L, w, data.brand, title, [o.subtitle, `${seen.size} voorouders in ${m} generaties`, o.subtitle ? "" : "elke ring is een generatie verder terug"].filter(Boolean).join(" · "));
    const cx = w / 2, cy = L.M + L.head + (h - 2 * L.M - L.head - L.foot) / 2;
    const pt = (r, a) => { const t = a * Math.PI / 180; return [cx + r * k * Math.cos(t), cy + r * k * Math.sin(t)]; };
    const col = kw => pal["l" + lineOf(kw)] || pal.faint || "#888";
    let segs = "", labels = "", gold = false, defs = "";
    const uid = "fan" + (++drawing);
    /* generation III: the names follow the ring (curved text along an arc through the middle of the box); in the lower half the path
       is reversed, so everything reads from left to right. Two lines: the first name (600) and the surname (grey), with half a small
       letter between them; at the top the first name is outside, at the bottom inside. A long name gets smaller first (to 0.72). */
    const arcLabel = (pos, a0, a1, r0, r1, rows) => {
      const an = ((((a0 + a1) / 2) % 360) + 360) % 360, low = an > 0 && an < 180, rm = (r0 + r1) / 2 * k, pad = Math.min(4, (a1 - a0) * 0.06);
      const [h1, h2] = rows.map(r => r[1] * 0.72), gap = rows.length > 1 ? rows[1][1] * 0.5 : 0, off = rows.length > 1 ? (h1 - h2) / 2 : -h1 / 2;
      rows.forEach(([str, mm, font, fill], i) => {
        const rb = !low ? (i === 0 ? rm + gap / 2 + off : rm - gap / 2 - h2 + off) : (i === 0 ? rm - gap / 2 + off : rm + gap / 2 + h2 + off);
        const span = (a1 - a0 - 2 * pad) * Math.PI / 180 * rb, ft = pf.fit(str, font, mm / PT, span, Math.max(min, mm * 0.72 / PT));
        const p1 = [cx + rb * Math.cos((low ? a1 - pad : a0 + pad) * Math.PI / 180), cy + rb * Math.sin((low ? a1 - pad : a0 + pad) * Math.PI / 180)];
        const p2 = [cx + rb * Math.cos((low ? a0 + pad : a1 - pad) * Math.PI / 180), cy + rb * Math.sin((low ? a0 + pad : a1 - pad) * Math.PI / 180)], id = `${uid}-${pos}-${i}`;
        defs += `<path id="${id}" d="M${p1[0].toFixed(2)} ${p1[1].toFixed(2)}A${rb.toFixed(2)} ${rb.toFixed(2)} 0 0 ${low ? 0 : 1} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}" fill="none"/>`;
        labels += `<text style="font-family:'${font.family}';font-weight:${font.weight}" font-size="${(ft.pt * PT).toFixed(2)}" fill="${fill}"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${S.esc(ft.text)}</textPath></text>`;
      });
    };
    for (let g = 2; g <= m; g++) {
      const n = 2 ** (g - 1), r0 = R[g - 1], r1 = R[g];
      for (let i = 0; i < n; i++) {
        const pos = st.rootKw * n + i, rk = res(pos), p = by.get(rk), a0 = 90 + i * 360 / n, a1 = a0 + 360 / n;
        const [x1, y1] = pt(r1, a0), [x2, y2] = pt(r1, a1), [x3, y3] = pt(r0, a1), [x4, y4] = pt(r0, a0);
        const d = `M${x1.toFixed(2)} ${y1.toFixed(2)}A${(r1 * k).toFixed(2)} ${(r1 * k).toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}L${x3.toFixed(2)} ${y3.toFixed(2)}A${(r0 * k).toFixed(2)} ${(r0 * k).toFixed(2)} 0 0 0 ${x4.toFixed(2)} ${y4.toFixed(2)}Z`;
        const twin = p && count.get(rk) > 1, sw = (g >= 7 ? 0.25 : 0.4);
        if (!p) segs += `<path d="${d}" fill="none" stroke="${pal.rule}" stroke-width="0.2" stroke-dasharray="0.8 0.8"/>`;
        else if (p.living) segs += `<path d="${d}" fill="${g >= 3 ? col(pos) : pal.sunk || "#e3e8e2"}" fill-opacity="${g >= 3 ? 0.14 : 1}" stroke="${pal.paper || "#fff"}" stroke-width="${sw}"/>`;
        else {
          const op = ({ A: 0.3, B: 0.2, C: 0.12, D: 0.05 })[p.st] || 0.2, weak = p.st === "C" || p.st === "D";
          const stroke = twin ? pal.gold : weak ? col(pos) : pal.paper || "#fff", dash = !twin && p.st === "D" ? ` stroke-dasharray="0.3 0.8"` : !twin && p.st === "C" ? ` stroke-dasharray="1 0.6"` : "";
          segs += `<path d="${d}" fill="${col(pos)}" fill-opacity="${op}" stroke="${stroke}" stroke-width="${twin ? sw * 1.2 : weak ? 0.25 : sw}"${dash}/>`;
          if (twin) gold = true;
        }
        if (!p || g > lastNamed) continue;
        /* names: horizontal near the centre, along the radius further out (turned so they read from the outside on the left) */
        const am = (a0 + a1) / 2, rm = (r0 + r1) / 2, [lx, ly] = pt(rm, am), f = fs(g) * k, ringMm = (r1 - r0) * 0.92 * k, minMm = min * PT;
        const l1 = S.firstName(p), l2 = S.shortSur(S.splitName(p.n).sur);
        const fit = (s, mm, font) => pf.fit(s, font, mm / PT, g <= 3 ? 2 * Math.PI * rm * k / n * 0.9 : ringMm, Math.max(min, mm * 0.82 / PT));
        const T = (x, y, s, mm, font, fill, extra = "") => S.text(x, y, s, mm, { font, anchor: "middle", fill, extra });
        if (g === 2) {
          const a = fit(l1, f, S.FONT.sansBold), b = fit(l2, Math.max(minMm, (fs(g) - 3) * k), S.FONT.sans);
          labels += T(lx, ly - 0.15 * f, a.text, a.pt * PT, S.FONT.sansBold, pal.ink) + T(lx, ly + 0.95 * f, b.text, b.pt * PT, S.FONT.sans, pal.muted);
        } else if (g === 3) {
          arcLabel(pos, a0, a1, r0, r1, [[l1, f, S.FONT.sansBold, pal.ink], [l2, Math.max(minMm, (fs(g) - 3) * k), S.FONT.sans, pal.muted]].filter(r => r[0]));
        } else {
          const flip = am > 90 && am < 270, rot = flip ? am + 180 : am, tr = ` transform="rotate(${rot.toFixed(2)} ${lx.toFixed(2)} ${ly.toFixed(2)})"`;
          if (g <= 6) { const a = fit(l1, f, S.FONT.sansBold), b = fit(l2, Math.max(minMm, f - k), S.FONT.sans);
            labels += `<g${tr}>` + T(lx, ly - 0.15 * f, a.text, a.pt * PT, S.FONT.sansBold, pal.ink) + T(lx, ly + 0.85 * f, b.text, b.pt * PT, S.FONT.sans, pal.muted) + `</g>`; }
          else { const a = fit(l1, f, S.FONT.sansBold); labels += `<g${tr}>` + T(lx, ly + 0.33 * a.pt * PT, a.text, a.pt * PT, S.FONT.sansBold, pal.ink) + `</g>`; }
        }
      }
    }
    /* the centre: the start (or the main person with brothers and sisters) */
    const rc = R[1] * k, centre = [];
    if (st.rootKw === 1 && !st.pair) { (data.rootLines && data.rootLines.length ? data.rootLines : [data.root]).forEach(s => centre.push([s, 13.5, S.FONT.sansBold]));
      if (data.siblings && data.siblings.length) centre.push(["met " + data.siblings.join(", ").replace(/, ([^,]*)$/, " en $1"), 9.5, S.FONT.sans]); }
    else if (st.pair) { /* the couple is the first ring; the centre stays empty (their child is not in the tree) */ }
    else { const p = by.get(res(st.rootKw)); if (p) { centre.push([S.firstName(p), 13.5, S.FONT.sansBold], [S.shortSur(S.splitName(p.n).sur), 12, S.FONT.sansBold]); if (!p.living && S.lifeYears(p)) centre.push([S.lifeYears(p), 10.5, S.FONT.sans]); } }
    let cen = `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${rc.toFixed(2)}" fill="${pal.accent}"/>`;
    const fitC = centre.map(([s, f, font]) => pf.fit(s, font, f * k / PT, rc * 1.75, min)), lh = fitC.map(x => x.pt * PT * 1.15), tot = lh.reduce((a, b) => a + b, 0);
    let yy = cy - tot / 2;
    fitC.forEach((x, i) => { yy += lh[i]; cen += S.text(cx, yy - lh[i] * 0.25, x.text, x.pt * PT, { font: centre[i][2], anchor: "middle", fill: pal.accentInk || "#F4F8FB" }); });
    /* father's side and mother's side, at the shoulders of the fan */
    const kPt = Math.max(min, 14 * k / PT), kx = 0.72 * (R[m] + 14) * k, ky = -0.72 * (R[m] + 14) * k;
    const who = st.rootKw === 1 && !st.pair ? null : P.startName(data, o.start);
    const side = (s, x, anchor) => S.text(x, cy + ky, s, kPt * PT, { font: S.FONT.mono, anchor, fill: pal.muted });
    const sides = st.pair ? "" : side(who ? "vader van " + S.firstName(by.get(res(st.rootKw)) || { n: who }) : "vaders kant", cx - kx, "end")
      + side(who ? "moeder van " + S.firstName(by.get(res(st.rootKw)) || { n: who }) : "moeders kant", cx + kx, "start");
    const foot = S.footer(ctx, L, w, h, { lines: [...lines].filter(l => data.lines && data.lines[l]).sort((a, b) => a - b), lineNames: Object.fromEntries(Object.entries(data.lines || {}).map(([l, x]) => [l, x.name])),
      evidence: true, gold, source: `Bij elke persoon staan de bronnen en akten op ${data.url || ""}`, asOf: data.asOf });
    const svg = S.wrapSheet(w, h, ctx.bleed || 0, pal, (defs ? `<defs>${defs}</defs>` : "") + head.svg + segs + cen + labels + sides + foot.svg);
    return { pages: [{ name: "poster", svg }], fonts: S.FONTS, imagesUsed: [], title, stats: { rings: m, namesUpTo: lastNamed, people: seen.size } };
  }
  (P.renderers = P.renderers || {}).fan = { advise, render };
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
