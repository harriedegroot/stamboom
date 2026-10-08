/* Renderer "text": one ancestor in a few words, for a mug or a Delft blue tile. One renderer, two looks (chosen by the size):
   - mug (a wrap, much wider than high: format mug-11oz, 228.6 × 88.9 mm = 2700 × 1050 px at 300 dpi): two panels, left the fact (title and
     text, with its evidence label) and right the person (name, years, occupation and place, family colour). The handle sits
     where the two ends of the wrap meet, so both ends stay empty.
   - tile (square, 15 or 20 cm): Delft blue on white glaze; corner ornaments that join into a pattern when tiles lie side by side,
     and a medallion with the name, the years and the occupation or place.
   Option: person (kw); without it advise() picks one: for the mug the first curated fact (A or B) that fits, for the tile an
   ancestor with an occupation, a place and both years. Pure: SVG strings in mm, text measured through ctx.platform, colours from
   ctx.palette (the tile keeps its own blue). Facts: { kw, text, st, kind, title?, year? }; the core already removed the living,
   stillborn children and hypotheses where the privacy profile asks for it. */
(function (P) {
  /* typographic quotes: 'te mijnen huize' → ‘te mijnen huize’, Boersma's → Boersma’s */
  const quotes = s => String(s ?? "").replace(/(^|[\s(\[\u2014\u2013])'/g, "$1\u2018").replace(/'/g, "\u2019").replace(/(^|[\s(\[\u2014\u2013])"/g, "$1\u201C").replace(/"/g, "\u201D");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const PT = 25.4 / 72;
  const SANS = { family: "IBM Plex Sans", weight: 400 }, SANS_B = { family: "IBM Plex Sans", weight: 600 };
  const DISPLAY = { family: "Libre Caslon Display", weight: 400 }, TEXT = { family: "Libre Caslon Text", weight: 400 }, TEXT_I = { family: "Libre Caslon Text", weight: 400, style: "italic" };
  const LABEL = { A: "Bewezen", B: "Sterk onderbouwd", C: "Onzeker", D: "Hypothese" };
  const DELFT = { glaze: "#F7F5EF", blue: "#1F3B8C", wash: "#8FA3D3" };

  const yearOf = s => { const m = /(\d{4})/.exec(s || ""); return m ? (/^(ca|±|rond|omstreeks)/i.test(String(s).trim()) ? "ca. " + m[1] : m[1]) : ""; };
  function yearsOf(p) {
    const b = yearOf(p.b), d = yearOf(p.d);
    return b && d ? `${b} – ${d}` : b ? `geboren ${b}` : d ? `overleden ${d}` : "";
  }
  /* the place someone lived longest (most mentions in res), else the place of birth or death */
  function placeOf(p) {
    const n = {}; (p.res || []).forEach(r => { if (r.p) n[r.p] = (n[r.p] || 0) + 1; });
    const best = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
    return best || p.bp || p.dp || "";
  }
  /* "Boer in Haskerhorne; 'redelijk begoedt' (1749)" → "Boer in Haskerhorne"; adds the place when the occupation has none */
  function roleOf(p) {
    const place = placeOf(p);
    let occ = String(p.occ || "").split(/[;(]/)[0].replace(/[,.\s]+$/, "").trim();
    if (!occ) return place;
    if (place && !occ.toLowerCase().includes(place.toLowerCase()) && !/\b(in|te|op|bij)\s+[A-Z]/.test(occ)) occ += " in " + place;
    return occ.charAt(0).toUpperCase() + occ.slice(1);
  }
  /* greedy word wrap; returns lines or null when the words do not fit in maxLines */
  function wrap(pf, t, font, pt, maxW, maxLines) {
    const words = String(t || "").split(/\s+/).filter(Boolean), lines = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? cur + " " + w : w;
      if (!cur || pf.measure(next, font, pt) <= maxW) cur = next;
      else { lines.push(cur); cur = w; if (lines.length >= maxLines) return null; }
    }
    if (cur) lines.push(cur);
    return lines.length <= maxLines && lines.every(l => pf.measure(l, font, pt) <= maxW * 1.02) ? lines : null;
  }
  /* two lines of about equal length (for titles and names): the split with the shortest longest line */
  function balance(pf, lines, font, pt) {
    if (lines.length !== 2) return lines;
    const words = lines.join(" ").split(" "); let best = lines, bw = Infinity;
    for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(" "), c = words.slice(i).join(" "), m = Math.max(pf.measure(a, font, pt), pf.measure(c, font, pt));
      if (m < bw) { bw = m; best = [a, c]; } }
    return best;
  }
  /* the largest size between pt and minPt at which the text wraps into maxLines; else whole sentences are dropped from the end */
  function wrapFit(pf, t, font, pt, minPt, maxW, maxLines) {
    let text = String(t || "").trim();
    for (;;) {
      for (let p = pt; p >= minPt - 0.01; p -= 0.25) { const l = wrap(pf, text, font, p, maxW, maxLines); if (l) return { lines: l, pt: p, text }; }
      const cut = text.replace(/\s*[^.!?]+[.!?]\s*$/, "");
      if (!cut || cut === text) break;
      text = cut;
    }
    const f = pf.fit(text, font, minPt, maxW * maxLines, minPt);   /* last resort: shortened with "…" */
    return { lines: wrap(pf, f.text, font, minPt, maxW, maxLines + 1) || [f.text], pt: minPt, text: f.text };
  }

  function factsFor(data, kw) {
    const fs = (data.facts || []).filter(f => f.kw === kw && f.text);
    return fs.filter(f => f.kind === "fact").concat(fs.filter(f => f.kind !== "fact"));
  }
  function advise(data, o, ctx) {
    const { w, h } = ctx.size, alive = new Set((data.people || []).filter(p => p.living).map(p => p.kw));
    const known = new Map((data.people || []).filter(p => !p.living).map(p => [p.kw, p]));
    if (w / h > 1.6) {
      /* mug: the first curated fact (the order of FACTS) with a title, A or B, short enough for a mug */
      const ok = f => known.has(f.kw) && !alive.has(f.kw) && (f.st === "A" || f.st === "B") && String(f.text).length <= 260;
      const f = (data.facts || []).find(f => f.kind === "fact" && f.title && ok(f)) || (data.facts || []).find(ok);
      return { person: f ? f.kw : null };
    }
    /* tile: occupation, both years and a place; A before B; the father's line (kw a power of two) first */
    const score = p => (p.occ ? 3 : 0) + (yearOf(p.b) && yearOf(p.d) ? 2 : 0) + (placeOf(p) ? 1 : 0) + (p.st === "A" ? 1 : 0) + ((p.kw & (p.kw - 1)) === 0 ? 1 : 0);
    const best = [...known.values()].filter(p => p.kw >= 8 && p.st !== "C" && p.st !== "D").sort((a, b) => score(b) - score(a) || a.kw - b.kw)[0];
    return { person: best ? best.kw : null };
  }

  function render(data, o, ctx) {
    const { w, h } = ctx.size, b = ctx.bleed || 0, pf = ctx.platform, pal = ctx.palette || {}, min = (ctx.product && ctx.product.minPt) || 6;
    const mug = w / h > 1.6;
    const p = (data.people || []).find(x => x.kw === +o.person && !x.living) || null;
    const svg = (g, bg) => { const W = w + 2 * b, H = h + 2 * b;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(2)}mm" height="${H.toFixed(2)}mm" viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}"><rect width="${W.toFixed(2)}" height="${H.toFixed(2)}" fill="${bg}"/><g transform="translate(${b} ${b})">${g}</g></svg>`; };
    const text = (x, y, t, font, pt, fill, anchor, extra = "") => (t = quotes(t), `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}"${anchor ? ` text-anchor="${anchor}"` : ""} style="font-family:'${font.family}';font-weight:${font.weight || 400};font-style:${font.style || "normal"}" font-size="${(pt * PT).toFixed(2)}" fill="${fill}"${extra}>${esc(t)}</text>`);
    if (!p) return { pages: [{ name: mug ? "wikkel" : "tegel", svg: svg(text(w / 2, h / 2, "Kies een voorouder", SANS, 12, "#5a605d", "middle"), "#fff") }], fonts: ["IBM Plex Sans 400"], imagesUsed: [], title: "" };
    return mug ? renderMug(p) : renderTile(p);

    /* ---- mug ---- */
    function renderMug(p) {
      const ink = pal.ink || "#1a1c1b", muted = pal.muted || "#5a605d", gold = pal.gold || "#8a5c0e";
      const line = p.line || null, accent = (line && pal["l" + line]) || pal.accent || "#1e4f74";
      const edge = 14, gap = 8, top = 8, bottom = h - 8;              /* the handle zone at both ends, the rim at the top */
      const pw = (w - 2 * edge - gap) / 2, x1 = edge, x2 = edge + pw + gap;
      let g = "";
      /* left: the fact */
      const f = factsFor(data, p.kw)[0];
      if (f) {
        const yr = f.year || f.y || "", kicker = ["Weetje", yr].filter(Boolean).join(" · ").toUpperCase();
        const t = f.title ? wrapFit(pf, f.title, DISPLAY, 20, 14, pw, 2) : null, titleH = t ? t.lines.length * t.pt * PT * 1.08 + 2 : 0;
        const room = bottom - 7 - top - 9.2 - titleH, body = wrapFit(pf, f.text, TEXT, 11, 8.5, pw, Math.max(2, Math.floor(room / (8.5 * PT * 1.38))));
        const blockH = 9.2 + titleH + body.lines.length * body.pt * PT * 1.38;
        let y = top + Math.max(6, (bottom - 7 - top - blockH) / 2 + 6);
        g += text(x1, y, kicker, SANS_B, 7.5, accent, null, ` letter-spacing="0.6"`); y += 3.2;
        if (t) { balance(pf, t.lines, DISPLAY, t.pt).forEach(l => { y += t.pt * PT * 1.08; g += text(x1, y, l, DISPLAY, t.pt, ink); }); y += 2; }
        body.lines.forEach(l => { y += body.pt * PT * 1.38; g += text(x1, y, l, TEXT, body.pt, ink); });
        const lab = LABEL[f.st] ? `${f.st} · ${LABEL[f.st]}` : "";
        if (lab) g += text(x1, bottom, lab, SANS, Math.max(min, 7), muted);
      }
      /* right: the person */
      {
        const name = wrapFit(pf, p.n, DISPLAY, 30, 18, pw, 2), yrs = yearsOf(p), role = roleOf(p);
        const blockH = name.lines.length * name.pt * PT * 1.05 + (yrs ? 8 : 0) + (role ? 6 : 0);
        let y = top + Math.max(4, (bottom - 12 - top - blockH) / 2);
        balance(pf, name.lines, DISPLAY, name.pt).forEach(l => { y += name.pt * PT * 1.05; g += text(x2 + pw / 2, y, l, DISPLAY, name.pt, ink, "middle"); });
        if (yrs) { y += 7.5; g += text(x2 + pw / 2, y, yrs, TEXT_I, 14, gold, "middle"); }
        if (role) { y += 6.5; const r = pf.fit(role, SANS, 9, pw, min); g += text(x2 + pw / 2, y, r.text, SANS, r.pt, muted, "middle"); }
        g += `<rect x="${(x2 + pw / 2 - 14).toFixed(2)}" y="${(bottom - 8.6).toFixed(2)}" width="28" height="1.1" fill="${accent}"/>`;
        const foot = pf.fit(`Uit de stamboom van ${data.root || ""}`, SANS, Math.max(min, 7), pw, min);
        g += text(x2 + pw / 2, bottom - 2.6, foot.text, SANS, foot.pt, muted, "middle");
        if (data.url) { const u = pf.fit(String(data.url).replace(/^https?:\/\//, "").replace(/\/?#?$/, ""), SANS, min, pw, min); g += text(x2 + pw / 2, bottom + 0.6, u.text, SANS, u.pt, muted, "middle"); }
      }
      return { pages: [{ name: "wikkel", svg: svg(g, pal.paper || "#fff") }], fonts: ["Libre Caslon Display 400", "Libre Caslon Text 400", "Libre Caslon Text 400 italic", "IBM Plex Sans 400", "IBM Plex Sans 600"],
        imagesUsed: [], title: `Mok: ${p.n}` };
    }

    /* ---- tile ---- */
    function renderTile(p) {
      const s = w / 150, blue = DELFT.blue, wash = DELFT.wash, cx = w / 2, cy = h / 2;
      let g = "";
      /* a corner ornament for the corner at (0,0); the other three are mirror images. Four tiles together make a rosette. */
      const R = 26 * s;
      let c = `<path d="M0 ${R.toFixed(2)} A${R.toFixed(2)} ${R.toFixed(2)} 0 0 0 ${R.toFixed(2)} 0" fill="none" stroke="${blue}" stroke-width="${(0.9 * s).toFixed(2)}"/>`;
      c += `<path d="M0 0 L0 ${(R * 0.62).toFixed(2)} A${(R * 0.62).toFixed(2)} ${(R * 0.62).toFixed(2)} 0 0 0 ${(R * 0.62).toFixed(2)} 0 Z" fill="${wash}" fill-opacity="0.55"/>`;
      c += `<path d="M0 ${(R * 0.62).toFixed(2)} A${(R * 0.62).toFixed(2)} ${(R * 0.62).toFixed(2)} 0 0 0 ${(R * 0.62).toFixed(2)} 0" fill="none" stroke="${blue}" stroke-width="${(0.6 * s).toFixed(2)}"/>`;
      [22, 45, 68].forEach((a, i) => { const r = R * (i === 1 ? 0.98 : 0.86), rad = a * Math.PI / 180, x = Math.cos(rad) * r, y = Math.sin(rad) * r;
        c += `<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="${(R * (i === 1 ? 0.26 : 0.19)).toFixed(2)}" ry="${(R * 0.075).toFixed(2)}" transform="rotate(${a} ${x.toFixed(2)} ${y.toFixed(2)})" fill="${blue}"/>`; });
      [33.5, 56.5].forEach(a => { const rad = a * Math.PI / 180, r = R * 1.16; c += `<circle cx="${(Math.cos(rad) * r).toFixed(2)}" cy="${(Math.sin(rad) * r).toFixed(2)}" r="${(0.9 * s).toFixed(2)}" fill="${blue}"/>`; });
      c += `<circle cx="${(Math.cos(Math.PI / 4) * R * 1.42).toFixed(2)}" cy="${(Math.sin(Math.PI / 4) * R * 1.42).toFixed(2)}" r="${(1.3 * s).toFixed(2)}" fill="${blue}"/>`;
      g += `<g>${c}</g><g transform="translate(${w.toFixed(2)} 0) scale(-1 1)">${c}</g><g transform="translate(0 ${h.toFixed(2)}) scale(1 -1)">${c}</g><g transform="translate(${w.toFixed(2)} ${h.toFixed(2)}) scale(-1 -1)">${c}</g>`;
      /* the medallion */
      const r0 = 46 * s;
      g += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r0.toFixed(2)}" fill="${wash}" fill-opacity="0.07" stroke="${blue}" stroke-width="${(1.3 * s).toFixed(2)}"/>`;
      g += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(r0 - 2.6 * s).toFixed(2)}" fill="none" stroke="${blue}" stroke-width="${(0.45 * s).toFixed(2)}"/>`;
      /* small marks on the ring, as on a painted tile */
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, x = cx + Math.cos(a) * (r0 + 3.4 * s), y = cy + Math.sin(a) * (r0 + 3.4 * s);
        g += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(0.9 * s).toFixed(2)}" fill="${blue}"/>`; }
      /* the text inside: the name (one or two lines), an ornament, the years, the occupation or place, and the family */
      const inner = 2 * (r0 - 9 * s), name = wrapFit(pf, p.n, DISPLAY, 30 * s, 16 * s, inner * 0.9, 2), yrs = yearsOf(p), role = roleOf(p);
      const role2 = role ? wrapFit(pf, role, TEXT_I, 13 * s, Math.max(min, 9 * s), inner * 0.8, 2) : null;
      const nameH = name.lines.length * name.pt * PT * 1.05, blockH = nameH + 9 * s + (yrs ? 9 * s : 0) + (role2 ? role2.lines.length * role2.pt * PT * 1.3 + 2 * s : 0);
      let y = cy - blockH / 2 - name.pt * PT * 0.2;
      balance(pf, name.lines, DISPLAY, name.pt).forEach(l => { y += name.pt * PT * 1.05; g += text(cx, y, l, DISPLAY, name.pt, blue, "middle"); });
      y += 5 * s;
      g += `<line x1="${(cx - 14 * s).toFixed(2)}" y1="${y.toFixed(2)}" x2="${(cx - 3 * s).toFixed(2)}" y2="${y.toFixed(2)}" stroke="${blue}" stroke-width="${(0.35 * s).toFixed(2)}"/><line x1="${(cx + 3 * s).toFixed(2)}" y1="${y.toFixed(2)}" x2="${(cx + 14 * s).toFixed(2)}" y2="${y.toFixed(2)}" stroke="${blue}" stroke-width="${(0.35 * s).toFixed(2)}"/>`;
      g += `<path d="M${cx.toFixed(2)} ${(y - 1.4 * s).toFixed(2)} L${(cx + 1.4 * s).toFixed(2)} ${y.toFixed(2)} L${cx.toFixed(2)} ${(y + 1.4 * s).toFixed(2)} L${(cx - 1.4 * s).toFixed(2)} ${y.toFixed(2)} Z" fill="${blue}"/>`;
      y += 3 * s;
      if (yrs) { y += 7.5 * s; g += text(cx, y, yrs, TEXT, 17 * s, blue, "middle"); y += 1.8 * s; }
      if (role2) role2.lines.forEach(l => { y += role2.pt * PT * 1.3; g += text(cx, y, l, TEXT_I, role2.pt, blue, "middle"); });
      if (data.brand) { const f = pf.fit(String(data.brand).toUpperCase(), SANS, Math.max(min, 6.5 * s), inner * 0.6, min);
        g += text(cx, cy + r0 - 8 * s, f.text, SANS, f.pt, blue, "middle", ` letter-spacing="${(0.5 * s).toFixed(2)}" fill-opacity="0.85"`); }
      return { pages: [{ name: "tegel", svg: svg(g, DELFT.glaze) }], fonts: ["Libre Caslon Display 400", "Libre Caslon Text 400", "Libre Caslon Text 400 italic", "IBM Plex Sans 400"],
        imagesUsed: [], title: `Tegeltje: ${p.n}` };
    }
  }
  (P.renderers = P.renderers || {}).text = { advise, render, roleOf, yearsOf };
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
