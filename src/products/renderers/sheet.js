/* Shared parts of a one-page sheet (poster, canvas, puzzle): the header (brand, title, subtitle), the footer (families in their
   colour, the evidence key A–D, the source line) and small helpers. Pure: SVG strings in mm, text measured through ctx.platform,
   colours from ctx.palette. Used by the renderers fan, lineage, pedigree and map. */
(function (P) {
  const PT = 25.4 / 72;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const FONT = { sans: { family: "IBM Plex Sans", weight: 400 }, sansBold: { family: "IBM Plex Sans", weight: 600 },
    mono: { family: "IBM Plex Mono", weight: 400 }, title: { family: "Libre Caslon Display", weight: 400 } };
  const FONTS = ["IBM Plex Sans 400", "IBM Plex Sans 600", "IBM Plex Mono 400", "Libre Caslon Display 400"];
  /* font in an inline style: the site's css (svg text { font-family }) would otherwise win over the attribute */
  const fontStyle = f => `font-family:'${f.family}';font-weight:${f.weight}`;
  const text = (x, y, s, mm, o = {}) => `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" style="${fontStyle(o.font || FONT.sans)}" font-size="${mm.toFixed(2)}"${o.anchor ? ` text-anchor="${o.anchor}"` : ""}${o.fill ? ` fill="${o.fill}"` : ""}${o.spacing ? ` letter-spacing="${o.spacing}"` : ""}${o.extra || ""}>${esc(s)}</text>`;
  /* first name and surname, as the site shows them (prefixes and "Terwisscha van Scheltinga" stay with the surname) */
  function splitName(n) {
    const w = String(n || "").replace(/\(.*?\)/g, "").trim().split(/\s+/);
    if (w.length === 1) return { given: w, sur: "" };
    let i = w.indexOf("Terwisscha"); if (i < 0) i = w.findIndex((x, k) => k > 0 && /^(de|ten|van|der|den)$/.test(x)); if (i < 0) i = w.length - 1;
    return { given: w.slice(0, i), sur: w.slice(i).join(" ") };
  }
  const firstName = p => p.roep || splitName(p.n).given[0] || p.n;
  const shortSur = s => s.replace("Terwisscha van Scheltinga", "Terwisscha v. S.");
  const year = s => { const m = String(s || "").match(/\d{4}/); return m ? +m[0] : null; };
  function lifeYears(p) {
    if (!p || p.living) return "";
    const b = year(p.b), d = year(p.d), ca = s => /ca\.|~|\bof\b/.test(String(s || "")) ? "ca. " : "";
    return !b && !d ? "" : `${b ? ca(p.b) + b : "?"} – ${d ? ca(p.d) + d : "?"}`;
  }
  /* sizes of a sheet: u = 1 % of the short side; margin, header and footer heights */
  const layout = (w, h, o = {}) => { const u = Math.min(w, h) / 100; return { u, M: (o.margin || 6) * u, head: (o.head || 15) * u, foot: (o.foot || 11) * u }; };
  /* header: brand (small capitals), title (one or two lines), subtitle; returns { svg, height } */
  function header(ctx, L, w, brand, title, sub) {
    const pf = ctx.platform, pal = ctx.palette || {}, min = ctx.product.minPt || 6, { u, M } = L, cx = w / 2, maxW = w - 2 * M;
    let y = M, svg = "";
    if (brand) { const f = pf.fit(String(brand).toUpperCase(), FONT.mono, Math.max(min, 1.3 * u / PT), maxW, min); y += f.pt * PT; svg += text(cx, y, f.text, f.pt * PT, { font: FONT.mono, anchor: "middle", fill: pal.muted, spacing: (0.14 * f.pt * PT).toFixed(2) }); }
    const t = pf.wrap(title, FONT.title, 5.2 * u / PT, maxW, 2, Math.max(min, 3 * u / PT));
    t.lines.forEach((s, i) => { y += (i ? 1.05 : 1.15) * t.pt * PT; svg += text(cx, y, s, t.pt * PT, { font: FONT.title, anchor: "middle", fill: pal.ink }); });
    if (sub) { const f = pf.fit(sub, FONT.sans, Math.max(min, 1.9 * u / PT), maxW, min); y += 1.6 * f.pt * PT; svg += text(cx, y, f.text, f.pt * PT, { anchor: "middle", fill: pal.muted }); }
    return { svg, height: y - M + u };
  }
  /* footer at the bottom of the sheet: legend of families, evidence key, source line; returns { svg, height } */
  function footer(ctx, L, w, h, o) {
    const pf = ctx.platform, pal = ctx.palette || {}, min = ctx.product.minPt || 6, { u, M } = L, maxW = w - 2 * M;
    const legPt = Math.max(min, 1.4 * u / PT), keyPt = Math.max(min, 1.15 * u / PT), srcPt = Math.max(min, 1.05 * u / PT);
    const rows = [];
    /* families: centred rows of dot + name */
    const fam = (o.lines || []).map(l => ({ l, name: o.lineNames[l], wMm: pf.measure(o.lineNames[l], FONT.sans, legPt) + legPt * PT * 1.6 }));
    let cur = [], curW = 0; const gap = 2.2 * u;
    fam.forEach(f => { if (cur.length && curW + gap + f.wMm > maxW) { rows.push({ kind: "fam", items: cur, w: curW }); cur = []; curW = 0; } curW += (cur.length ? gap : 0) + f.wMm; cur.push(f); });
    if (cur.length) rows.push({ kind: "fam", items: cur, w: curW });
    if (o.evidence) rows.push({ kind: "key" });
    rows.push({ kind: "src" });
    const rowH = r => r.kind === "fam" ? legPt * PT * 1.7 : r.kind === "key" ? keyPt * PT * 1.9 : srcPt * PT * 2.2;
    const height = rows.reduce((a, r) => a + rowH(r), 0);
    let y = h - M - height, svg = "";
    rows.forEach(r => {
      const rh = rowH(r);
      if (r.kind === "fam") { let x = w / 2 - r.w / 2; const base = y + rh * 0.7, d = legPt * PT * 0.75;
        r.items.forEach(f => { svg += `<circle cx="${(x + d / 2).toFixed(2)}" cy="${(base - d * 0.4).toFixed(2)}" r="${(d / 2).toFixed(2)}" fill="${pal["l" + f.l] || pal.accent}"/>` + text(x + d * 1.5, base, f.name, legPt * PT, { fill: pal.ink }); x += f.wMm + gap; }); }
      if (r.kind === "key") {
        const base = y + rh * 0.65, sw = 2.2 * u, sh = keyPt * PT * 0.9, c = pal.l8 || pal.accent, items = [["A akte", 0.3, ""], ["B sterk", 0.2, ""], ["C onzeker", 0.12, "1.2 0.8"], ["D hypothese", 0.05, "0.4 0.9"]];
        if (o.gold) items.push(["dezelfde voorouder via twee lijnen", 0, "gold"]);
        const parts = items.map(([t]) => pf.measure(t, FONT.sans, keyPt) + sw + 1.6 * u);
        const label = "Bewijs", lw = pf.measure(label, FONT.sansBold, keyPt) + 1.2 * u;
        let x = w / 2 - (lw + parts.reduce((a, b) => a + b, 0)) / 2;
        svg += text(x, base, label, keyPt * PT, { font: FONT.sansBold, fill: pal.ink }); x += lw;
        items.forEach(([t, op, da], i) => {
          const box = da === "gold" ? `<rect x="${x.toFixed(2)}" y="${(base - sh).toFixed(2)}" width="${sw.toFixed(2)}" height="${sh.toFixed(2)}" fill="none" stroke="${pal.gold}" stroke-width="0.5"/>`
            : `<rect x="${x.toFixed(2)}" y="${(base - sh).toFixed(2)}" width="${sw.toFixed(2)}" height="${sh.toFixed(2)}" fill="${c}" fill-opacity="${op}"${da ? ` stroke="${c}" stroke-width="0.3" stroke-dasharray="${da}"` : ""}/>`;
          svg += box + text(x + sw + 0.6 * u, base, t, keyPt * PT, { fill: pal.muted }); x += parts[i];
        });
      }
      if (r.kind === "src") {
        const base = y + rh * 0.75;
        svg += `<line x1="${M}" x2="${w - M}" y1="${(y + rh * 0.12).toFixed(2)}" y2="${(y + rh * 0.12).toFixed(2)}" stroke="${pal.rule}" stroke-width="0.3"/>`;
        const right = o.asOf ? "stand " + o.asOf : "", rw = right ? pf.measure(right, FONT.mono, srcPt) : 0;
        const left = pf.fit(o.source || "", FONT.mono, srcPt, maxW - rw - 4 * u, min);
        svg += text(M, base, left.text, left.pt * PT, { font: FONT.mono, fill: pal.muted }) + (right ? text(w - M, base, right, srcPt * PT, { font: FONT.mono, fill: pal.muted, anchor: "end" }) : "");
      }
      y += rh;
    });
    return { svg, height };
  }
  /* the sheet with bleed: background over the full size, content shifted by the bleed */
  const wrapSheet = (w, h, b, pal, inner) => { const W = w + 2 * b, H = h + 2 * b;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${pal.paper || "#fff"}"/><g transform="translate(${b} ${b})">${inner}</g></svg>`; };
  P.sheet = { PT, esc, FONT, FONTS, fontStyle, text, splitName, firstName, shortSur, lifeYears, layout, header, footer, wrapSheet };
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
