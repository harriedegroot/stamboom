/* Renderer "card": a set of picture postcards of the villages and towns where the ancestors lived (product "cards-places").
   One card per place with at least three ancestors (born, married, lived or died there), the largest first, at most 24.
   - Front: a photograph of the place in a frame, like an old picture postcard (the photograph is only used when it is sharp
     enough in the frame: at least 200 dpi), the name of the place, the municipality and province, how many ancestors and in which
     years, and the colours of the families that lived there. Without a good photograph: a small map of the region with the place.
   - Back: "Wie er woonden": up to nine ancestors with their years and what they did there, one fact about one of them, the credit
     of the photograph and where the cards come from.
   Pure: returns SVG strings in mm (with bleed), measures text through ctx.platform, takes colours from ctx.palette (the light
   print palette), images and their credits from data.images (already filtered for privacy and licence by the core). Text is never
   smaller than the product's minimum (6 pt). Options: start (a person or couple: only their ancestors). */
(function (P) {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const yr = s => { const m = String(s || "").match(/\d{4}/); return m ? +m[0] : null; };
  const PT = 25.4 / 72;
  const SANS = { family: "IBM Plex Sans", weight: 400 }, SANS_B = { family: "IBM Plex Sans", weight: 600 }, MONO = { family: "IBM Plex Mono", weight: 400 };
  const DISPLAY = { family: "Libre Caslon Display", weight: 400 }, TEXT = { family: "Libre Caslon Text", weight: 400 }, TEXT_I = { family: "Libre Caslon Text", weight: 400, style: "italic" };
  const MIN_PEOPLE = 3, MAX_CARDS = 24, MIN_DPI = 200;
  const plain = s => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const PREFIX = /^(de|van|der|den|ten|ter|te|la|le)$/i;
  /* a newspaper clipping (a notice, an advertisement) is filed as "historisch" with a place, but it is not a picture of that place */
  const isClipping = im => /krant|courant|nieuwsblad|advertentie|overlijdensbericht|delpher/i.test([im.id, im.t, im.maker, im.sourceName].join(" "));
  /* "Ype Douwes Jongma" → "Ype Jongma" (first given name and the surname with its prefix) */
  function shortName(n) {
    const w = String(n || "").trim().split(/\s+/); if (w.length <= 2) return w.join(" ");
    let i = w.length - 1; while (i > 1 && PREFIX.test(w[i - 1])) i--;
    return [w[0], ...w.slice(i)].join(" ");
  }
  const years = p => { const b = yr(p.b), d = yr(p.d); return b && d ? `${b}–${d}` : b ? `geb. ${b}` : d ? `† ${d}` : ""; };

  /* places with what each ancestor did there: [{ key, name, gem, prov, la, lo, people: Map(kw → Set(role)), lines: { line: n }, years: [] }] */
  function placesOf(data, members) {
    const out = new Map(), pl = data.places || {};
    const add = (k, p, role, y) => { const q = k && pl[k]; if (!q || q.seat || q.kind === "gemeente" || q.la == null) return; /* a municipality is not a place, as on the site */
      const a = out.get(k) || { key: k, name: q.name || k, gem: q.gem || "", la: q.la, lo: q.lo, people: new Map(), lines: {}, years: [] };
      if (!a.people.has(p.kw)) { a.people.set(p.kw, new Set()); a.lines[p.line] = (a.lines[p.line] || 0) + 1; }
      a.people.get(p.kw).add(role); if (y) a.years.push(y); out.set(k, a); };
    data.people.filter(p => !p.living && (!members || members.has(p.kw))).forEach(p => {
      add(p.bp, p, "geboren", yr(p.b)); add(p.dp, p, "overleden", yr(p.d));
      if (p.m) add(p.m.p, p, "getrouwd", yr(p.m.d || p.m.y));
      (p.res || []).forEach(r => add(r.p, p, "woonde er", yr(r.y || r.d)));
    });
    return [...out.values()];
  }
  /* the cards: the places with the most ancestors */
  function cardsOf(data, o) {
    const st = P.startOf ? P.startOf(o.start) : { rootKw: 1, pair: false }, members = st.rootKw === 1 && !st.pair ? null : P.startMembers(data, o.start);
    return placesOf(data, members).filter(a => a.people.size >= MIN_PEOPLE).sort((a, b) => b.people.size - a.people.size || a.name.localeCompare(b.name)).slice(0, MAX_CARDS);
  }
  /* the best photograph of a place that is sharp in a frame of fw × fh mm: landscape first, then the largest */
  function photoOf(data, key, fw, fh) {
    const need = im => (im.w || 0) >= fw / 25.4 * MIN_DPI && (im.h || 0) >= fh / 25.4 * MIN_DPI * 0.98;
    const ok = (data.images || []).filter(im => im.place === key && im.src && !/^(persoon|person|portret)$/.test(im.kind || "") && /^(plaats|historisch|kerk|plek)$/.test(im.kind || "") && !isClipping(im) && need(im));
    return ok.sort((a, b) => ((b.w > b.h) - (a.w > a.h)) || (b.w * b.h - a.w * a.h))[0] || null;
  }
  /* no photograph: an old map of the municipality (grietenij) the place belongs to, cut to the frame */
  function oldMapOf(data, a, fw, fh) {
    const need = im => (im.w || 0) >= fw / 25.4 * MIN_DPI && (im.h || 0) >= fh / 25.4 * MIN_DPI * 0.98, keys = [a.gem, a.key].filter(Boolean);
    const ok = (data.images || []).filter(im => /^(kaart|stadsplan)$/.test(im.kind || "") && im.src && need(im) && (keys.includes(im.place) || (im.keys || []).some(k => keys.includes(k))));
    return ok.sort((x, y) => (y.kind === "stadsplan") - (x.kind === "stadsplan") || y.w * y.h - x.w * x.h)[0] || null;
  }
  /* one fact about someone who lived here: a fact (FACTS) first, else the short life story (KORT) of the one with most roles here */
  function factOf(data, a) {
    const kws = [...a.people.keys()].sort((x, y) => a.people.get(y).size - a.people.get(x).size);
    const facts = data.facts || [];
    for (const kind of ["fact", "short"]) for (const kw of kws) { const f = facts.find(x => x.kw === kw && x.kind === kind && plain(x.text).length > 30); if (f) return { kw, text: plain(f.text), title: f.title || "" }; }
    return null;
  }

  /* ---- the quartet (product "game-quartet"): eight families, four generations. A quartet is the line of one family from its
     ancestor in generation IV back along the fathers (a missing father: the mother), four people who have died. KwartetCadeau:
     76 × 99 mm per card, no bleed, a white border of at least 3 mm, round corners; the back once, as the last page. ---- */
  function quartetsOf(data, o) {
    const by = new Map(data.people.map(p => [p.kw, p])), al = data.aliases || {}, res = k => al[k] || k;
    const st = P.startOf ? P.startOf(o.start) : { rootKw: 1, pair: false }, members = st.rootKw === 1 && !st.pair ? null : P.startMembers(data, o.start);
    const ok = k => { const p = by.get(res(k)); return p && !p.living && (!members || members.has(p.kw)) ? p : null; };
    return Object.keys(data.lines || {}).map(Number).filter(l => l >= 8 && l <= 15 && data.lines[l]).sort((a, b) => a - b).map(l => {
      const chain = []; let k = l;
      while (chain.length < 4 && k < 2 ** 14) { const p = ok(k); if (!p) break; chain.push(p); k = ok(2 * k) ? 2 * k : 2 * k + 1; }
      return chain.length === 4 ? { line: l, name: data.lines[l].name, people: chain } : null;
    }).filter(Boolean);
  }
  function renderQuartet(data, o, ctx) {
    const { w, h } = ctx.size, pf = ctx.platform, pal = ctx.palette || {}, min = (ctx.product && ctx.product.minPt) || 6;
    const paper = pal.paper || "#fbf8f1", ink = pal.ink || "#1a1c1b", muted = pal.muted || "#5a605d", faint = pal.faint || "#5e6963", col = l => pal["l" + l] || pal.accent || "#1e4f74";
    const SAFE = 0.92, fit = (t, f, pt, mm, mn) => pf.fit(t, f, pt, mm * SAFE, mn), wrap = (t, f, pt, mm, n, mn) => pf.wrap(t, f, pt, mm * SAFE, n, mn);
    const text = (x, y, t, font, pt, fill, anchor) => `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}"${anchor ? ` text-anchor="${anchor}"` : ""} style="font-family:'${font.family}';font-weight:${font.weight || 400};font-style:${font.style || "normal"}" font-size="${(pt * PT).toFixed(3)}" fill="${fill}">${esc(t)}</text>`;
    const B = 3, R = 2, X0 = B, Y0 = B, W = w - 2 * B, H = h - 2 * B, used = new Set(), pages = [];
    const page = (name, g) => pages.push({ name, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#ffffff"/>${g}</svg>` });
    const imgOf = (p, fw, fh) => { /* a portrait of this ancestor, else a picture of the birthplace; sharp enough (200 dpi) */
      const need = im => (im.w || 0) >= fw / 25.4 * MIN_DPI && (im.h || 0) >= fh / 25.4 * MIN_DPI * 0.98;
      const own = (data.images || []).filter(im => isPortrait(im, p.kw) && need(im)); /* a real portrait, not a grave, a deed or a clipping */
      const place = (data.images || []).filter(im => im.place && im.place === p.bp && /^(plaats|historisch|kerk|kaart|stadsplan)$/.test(im.kind || "") && !isClipping(im) && need(im));
      return own[0] || place.sort((a, b) => (b.w > b.h) - (a.w > a.h) || b.w * b.h - a.w * a.h)[0] || null;
    };
    const Q = quartetsOf(data, o);
    Q.forEach(q => q.people.forEach((p, i) => {
      const c = col(q.line); let g = `<rect x="${X0}" y="${Y0}" width="${W}" height="${H}" rx="${R}" fill="${paper}" stroke="${c}" stroke-width="0.4"/>`;
      /* the band: the family and which card of the four */
      g += `<path d="M${X0} ${Y0 + R}a${R} ${R} 0 0 1 ${R} ${-R}h${W - 2 * R}a${R} ${R} 0 0 1 ${R} ${R}v${11 - R}h${-W}z" fill="${c}"/>`;
      const fn = fit(q.name, DISPLAY, 11, W - 22, min); g += text(X0 + 3, Y0 + 7.4, fn.text, DISPLAY, fn.pt, "#ffffff");
      for (let k = 0; k < 4; k++) g += `<circle cx="${(X0 + W - 3 - (3 - k) * 3.6).toFixed(2)}" cy="${Y0 + 5.6}" r="1.25" fill="${k === i ? "#ffffff" : "none"}" stroke="#ffffff" stroke-width="0.3"/>`;
      /* the picture */
      const fx = X0 + 3, fy = Y0 + 14, fw = W - 6, fh = 34, im = imgOf(p, fw, fh);
      if (im) { used.add(im.id); const id = `q${q.line}-${i}`;
        g += `<clipPath id="${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="1"/></clipPath><image href="${esc(im.src)}" x="${fx}" y="${fy}" width="${fw}" height="${fh}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`; }
      else g += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="1" fill="${c}" fill-opacity="0.14"/>` + text(fx + fw / 2, fy + fh / 2 + 6, (p.roep || p.n || "?")[0], DISPLAY, 40, c, "middle");
      /* name, years, place */
      let y = fy + fh + 6.2; const nm = wrap(keepPrefix(p.n), DISPLAY, 11.5, W - 6, 2, 8);
      nm.lines.forEach((l2, j) => { g += text(X0 + 3, y + j * nm.pt * PT * 1.08, l2, DISPLAY, nm.pt, ink); }); y += (nm.lines.length - 1) * nm.pt * PT * 1.08 + 4.6;
      const yrs = years(p); if (yrs) { g += text(X0 + 3, y, yrs, MONO, 7, faint); y += 3.8; }
      const bp = p.bp && data.places && data.places[p.bp] ? data.places[p.bp].name || p.bp : p.bp || "";
      if (bp) { const f = fit("geboren in " + bp, SANS, 7, W - 6, min); g += text(X0 + 3, y, f.text, SANS, f.pt, muted); }
      /* the four of the quartet, this one in bold */
      const ly = Y0 + H - 3 - 3 * 3.1;
      g += `<line x1="${X0 + 3}" x2="${X0 + W - 3}" y1="${(ly - 3.4).toFixed(2)}" y2="${(ly - 3.4).toFixed(2)}" stroke="${c}" stroke-width="0.25"/>`;
      q.people.forEach((r, j) => { const f = fit(shortName(r.n), j === i ? SANS_B : SANS, min, W - 10, min);
        g += `<circle cx="${(X0 + 4.2).toFixed(2)}" cy="${(ly + j * 3.1 - 0.8).toFixed(2)}" r="0.7" fill="${j === i ? c : "none"}" stroke="${c}" stroke-width="0.25"/>` + text(X0 + 6, ly + j * 3.1, f.text, j === i ? SANS_B : SANS, f.pt, j === i ? ink : muted); });
      page(`${q.name} – ${i + 1}`, g);
    }));
    /* the back, once: the colours of the families and the title */
    { let g = `<rect x="${X0}" y="${Y0}" width="${W}" height="${H}" rx="${R}" fill="${pal.ink || "#1d2320"}"/>`;
      const cols = Q.map(q => col(q.line)), bw = (W - 16) / Math.max(cols.length, 1);
      cols.forEach((c2, k) => { g += `<rect x="${(X0 + 8 + k * bw).toFixed(2)}" y="${Y0 + 22}" width="${(bw - 0.8).toFixed(2)}" height="${H - 44}" rx="0.6" fill="${c2}"/>`; });
      g += text(w / 2, Y0 + 14, "Onze voorouders", DISPLAY, 14, "#ffffff", "middle");
      const br = fit(data.brand || "", SANS, 7, W - 8, min); g += text(w / 2, Y0 + H - 9, br.text, SANS, br.pt, "#ffffff", "middle");
      page("Achterkant", g); }
    const root = P.startName ? P.startName(data, o.start) : data.root || "";
    return { pages, fonts: ["Libre Caslon Display 400", "IBM Plex Sans 400", "IBM Plex Sans 600", "IBM Plex Mono 400"], imagesUsed: [...used], title: `Kwartet van de voorouders van ${root}`, stats: { quartets: Q.length, cards: Q.length * 4, photos: used.size } };
  }
  /* ---- memory (product "game-memory"): pairs of a picture card and a name card. The picture is a real portrait of the ancestor,
     else a picture of the birthplace; no picture is used twice, so every pair has one answer. Deceased only. Format "memory":
     one card of 60 × 60 mm per page with bleed, the back once as the last page; format "a4": sheets to print at home, 12 cards
     per sheet with cut marks, and one sheet of backs. Options: start, pairs (12, 18 or 24). ---- */
  /* a real portrait of this ancestor: a photograph or painting of the person, not a grave, deed, clipping, memorial card or a
     picture of a child ("Hun zoon …") that is linked to the parents */
  const isPortrait = (im, kw) => /^(persoon|portret)$/.test(im.kind || "") && (im.kws || []).includes(kw) && (im.portrait || /(^|-)portret|^foto-/.test(im.id || ""))
    && !/^(akte|document|krant|register|kadaster|rouw|graf|bidprentje|gevelsteen|boerderij)$/.test(im.group || "")
    && !/graf|akte|scan|krant|rouw|bidprent|gevel|weesboek|-of-kw/i.test(im.id || "") && !isClipping(im) /* "-of-kw": not certain who it is */ && !/^(hun|zijn|haar)\s+(zoon|dochter|broer|zus|kind|kinderen|kleinzoon|kleindochter)\b/i.test(im.t || "");
  /* a name never breaks after its prefix: "ten Berge", "de Groot" stay together (a no-break space) */
  const keepPrefix = n => String(n || "").replace(/ (de|van|der|den|ten|ter|te|la|le) (?=\S)/gi, " $1\u00a0");
  const GEN_PRE = s => ["", "oud", "stam", "stamoud", "edel", "edeloud", "edelstam", "edelstamoud"][(s - 1) >> 2] + ["", "groot", "overgroot", "betovergroot"][(s - 1) & 3];
  function pairsOf(data, o, fw, fh) {
    const st = P.startOf ? P.startOf(o.start) : { rootKw: 1, pair: false }, members = P.startMembers ? P.startMembers(data, o.start) : null;
    const need = im => (im.w || 0) >= fw / 25.4 * MIN_DPI && (im.h || 0) >= fh / 25.4 * MIN_DPI * 0.98;
    const places = im => /^(plaats|historisch|kerk)$/.test(im.kind || "") && !isClipping(im);
    const gen = k => Math.floor(Math.log2(k)) + 1, rg = gen(st.rootKw);
    const rel = k => { const s = gen(k) - rg; return s >= 1 && s <= 32 && k >> s === st.rootKw ? GEN_PRE(s) + (k % 2 ? "moeder" : "vader") : ""; };
    const ppl = data.people.filter(p => !p.living && p.kw > 1 && (!members || members.has(p.kw)));
    const taken = new Set(), out = [];
    /* a village only once: two pictures of the same village would have two answers */
    const pick = (p, own) => { const ims = (data.images || []).filter(im => im.src && !taken.has(im.id) && need(im) && (own ? isPortrait(im, p.kw) : places(im) && im.place && im.place === p.bp && !taken.has("plaats:" + p.bp)));
      return ims.sort((a, b) => b.w * b.h - a.w * a.h)[0] || null; };
    /* own portraits first, then birthplaces; nearest generations first, the families taken in turn */
    for (const own of [true, false]) {
      const byLine = new Map();
      ppl.slice().sort((a, b) => gen(a.kw) - gen(b.kw) || a.kw - b.kw).forEach(p => { const l = p.kw < 4 ? 0 : p.kw < 8 ? ({ 4: 8, 5: 10, 6: 12, 7: 14 })[p.kw] : p.kw >> (gen(p.kw) - 4); if (!byLine.has(l)) byLine.set(l, []); byLine.get(l).push(p); });
      const queues = [...byLine.values()];
      for (let more = true; more && out.length < o.pairs;) { more = false;
        for (const q of queues) { while (q.length && out.length < o.pairs) { const p = q.shift(); if (out.some(x => x.p === p)) continue; const im = pick(p, own); if (!im) continue; taken.add(im.id); if (!own) taken.add("plaats:" + p.bp); out.push({ p, im, own, rel: rel(p.kw), line: p.kw < 8 ? null : p.kw >> (gen(p.kw) - 4) }); more = true; break; } } }
    }
    return out;
  }
  function renderMemory(data, o, ctx) {
    const pf = ctx.platform, pal = ctx.palette || {}, min = (ctx.product && ctx.product.minPt) || 6, sheet = ctx.size.w > 100;
    const paper = pal.paper || "#fbf8f1", ink = pal.ink || "#1a1c1b", muted = pal.muted || "#5a605d", faint = pal.faint || "#5e6963", col = l => l ? pal["l" + l] || pal.accent || "#1e4f74" : pal.accent || "#1e4f74";
    const SAFE = 0.92, fit = (t, f, pt, mm, mn) => pf.fit(t, f, pt, mm * SAFE, mn), wrap = (t, f, pt, mm, n, mn) => pf.wrap(t, f, pt, mm * SAFE, n, mn);
    const text = (x, y, t, font, pt, fill, anchor) => `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}"${anchor ? ` text-anchor="${anchor}"` : ""} style="font-family:'${font.family}';font-weight:${font.weight || 400};font-style:${font.style || "normal"}" font-size="${(pt * PT).toFixed(3)}" fill="${fill}">${esc(t)}</text>`;
    const C = 60, B = 3.5, R = 3, I = C - 2 * B, used = new Set();
    const n = [12, 18, 24].includes(+o.pairs) ? +o.pairs : 24, fw = I - 6, fh = I - 13.5;
    const pairs = pairsOf(data, { start: o.start, pairs: n }, fw, fh);
    const root = P.startName ? P.startName(data, o.start) : data.root || "";
    /* one card in its own coordinates (0..C), the white edge outside the frame is the cutting tolerance */
    const frame = (c, fill) => `<rect x="${B}" y="${B}" width="${I}" height="${I}" rx="${R}" fill="${fill || paper}" stroke="${c}" stroke-width="0.5"/>`;
    const picture = (q, id) => { const c = col(q.line); used.add(q.im.id);
      const g = frame(c) + `<clipPath id="${id}"><rect x="${B + 3}" y="${B + 3}" width="${fw}" height="${fh}" rx="1.5"/></clipPath><image href="${esc(q.im.src)}" x="${B + 3}" y="${B + 3}" width="${fw}" height="${fh}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
      if (q.own) return g + `<rect x="${B + 3}" y="${B + I - 6.6}" width="${fw}" height="3.2" rx="1.2" fill="${c}"/>`;
      /* a village: its name in the band, so a reader matches it with "geboren in …" */
      const pl = data.places && data.places[q.p.bp] ? data.places[q.p.bp].name || q.p.bp : q.p.bp, f = fit(pl, SANS_B, 7.5, fw - 4, min);
      return g + `<rect x="${B + 3}" y="${B + I - 8.2}" width="${fw}" height="4.8" rx="1.2" fill="${c}"/>` + text(C / 2, B + I - 4.75, f.text, SANS_B, f.pt, "#ffffff", "middle"); };
    const nameCard = q => { const c = col(q.line), p = q.p; let g = frame(c) + `<rect x="${B}" y="${B}" width="${I}" height="${I}" rx="${R}" fill="${c}" fill-opacity="0.1"/>`;
      const nm = wrap(keepPrefix(p.n), DISPLAY, 13, I - 8, 3, 8), lh = nm.pt * PT * 1.1, rows = [];
      if (q.rel) rows.push(["rel", 9]); rows.push(["name", nm.lines.length * lh]);
      const yrs = years(p); if (yrs) rows.push(["yrs", 4.2]);
      const bpl = p.bp && data.places && data.places[p.bp] ? data.places[p.bp].name || p.bp : p.bp || ""; if (bpl) rows.push(["bp", 4.2]);
      let y = B + I / 2 - rows.reduce((s, r) => s + r[1], 0) / 2;
      rows.forEach(([k, hgt]) => {
        if (k === "rel") { const f = fit(q.rel, TEXT_I, 9, I - 8, min); g += text(C / 2, y + 4.2, f.text, TEXT_I, f.pt, c, "middle"); }
        if (k === "name") nm.lines.forEach((l2, j) => { g += text(C / 2, y + (j + 0.8) * lh, l2, DISPLAY, nm.pt, ink, "middle"); });
        if (k === "yrs") g += text(C / 2, y + 3.4, yrs, MONO, 7, faint, "middle");
        if (k === "bp") { const f = fit("geboren in " + bpl, SANS, 7, I - 8, min); g += text(C / 2, y + 3.4, f.text, SANS, f.pt, muted, "middle"); }
        y += hgt; });
      return g + `<rect x="${B + 3}" y="${B + I - 6.6}" width="${fw}" height="3.2" rx="1.2" fill="${c}"/>`; };
    const lines = [...new Set(pairs.map(q => q.line).filter(Boolean))].sort((a, b) => a - b);
    const back = () => { let g = `<rect x="${B}" y="${B}" width="${I}" height="${I}" rx="${R}" fill="${pal.ink || "#1d2320"}"/>`;
      const bw = (I - 12) / Math.max(lines.length, 1);
      lines.forEach((l, k) => { g += `<rect x="${(B + 6 + k * bw).toFixed(2)}" y="${B + 17}" width="${(bw - 0.6).toFixed(2)}" height="${I - 30}" rx="0.5" fill="${col(l)}"/>`; });
      return g + text(C / 2, B + 11, "Onze voorouders", DISPLAY, 12, "#ffffff", "middle") + text(C / 2, B + I - 5.5, "memory", SANS, 7, "#ffffff", "middle"); };
    const cards = []; pairs.forEach((q, i) => { cards.push({ name: `Paar ${i + 1} – beeld`, g: id => picture(q, id) }, { name: `Paar ${i + 1} – naam`, g: () => nameCard(q) }); });
    const pages = [];
    if (!sheet) { /* one card per page, with bleed (white) */
      const b = ctx.bleed || 0, W = C + 2 * b;
      const page = (name, g) => pages.push({ name, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${W}mm" viewBox="0 0 ${W} ${W}"><rect width="${W}" height="${W}" fill="#ffffff"/><g transform="translate(${b} ${b})">${g}</g></svg>` });
      cards.forEach((c, i) => page(c.name, c.g("m" + i))); page("Achterkant", back());
    } else { /* A4 sheets: 3 × 4 cards, cut marks in the margin, then one sheet of backs */
      const { w, h } = ctx.size, cols = 3, rowsN = 4, x0 = (w - cols * C) / 2, y0 = (h - rowsN * C) / 2;
      const marks = () => { let g = ""; for (let k = 0; k <= cols; k++) { const x = x0 + k * C; g += `<line x1="${x}" x2="${x}" y1="${y0 - 8}" y2="${y0 - 2}" stroke="${faint}" stroke-width="0.2"/><line x1="${x}" x2="${x}" y1="${y0 + rowsN * C + 2}" y2="${y0 + rowsN * C + 8}" stroke="${faint}" stroke-width="0.2"/>`; }
        for (let k = 0; k <= rowsN; k++) { const y = y0 + k * C; g += `<line y1="${y}" y2="${y}" x1="${x0 - 8}" x2="${x0 - 2}" stroke="${faint}" stroke-width="0.2"/><line y1="${y}" y2="${y}" x1="${x0 + cols * C + 2}" x2="${x0 + cols * C + 8}" stroke="${faint}" stroke-width="0.2"/>`; } return g; };
      const sheetSvg = gs => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#ffffff"/>${marks()}${gs.map((g, k) => `<g transform="translate(${(x0 + (k % cols) * C).toFixed(2)} ${(y0 + Math.floor(k / cols) * C).toFixed(2)})">${g}</g>`).join("")}</svg>`;
      for (let s = 0; s < cards.length; s += cols * rowsN) pages.push({ name: `Vel ${s / (cols * rowsN) + 1}`, svg: sheetSvg(cards.slice(s, s + cols * rowsN).map((c, k) => c.g("m" + (s + k)))) });
      pages.push({ name: "Achterkanten", svg: sheetSvg(Array.from({ length: cols * rowsN }, back)) });
    }
    return { pages, fonts: ["Libre Caslon Display 400", "Libre Caslon Text 400i", "IBM Plex Sans 400", "IBM Plex Sans 600", "IBM Plex Mono 400"], imagesUsed: [...used], title: `Memory van de voorouders van ${root}`,
      stats: { pairs: pairs.length, asked: n, cards: pairs.length * 2, portraits: pairs.filter(q => q.own).length, places: pairs.filter(q => !q.own).length } };
  }
  function advise() { return {}; }
  function render(data, o, ctx) {
    if (ctx.product && ctx.product.id === "game-quartet") return renderQuartet(data, o, ctx);
    if (ctx.product && ctx.product.id === "game-memory") return renderMemory(data, o, ctx);
    const { w, h } = ctx.size, b = ctx.bleed || 0, pf = ctx.platform, pal = ctx.palette || {}, min = (ctx.product && ctx.product.minPt) || 6;
    const paper = pal.paper || "#fbf8f1", ink = pal.ink || "#1a1c1b", muted = pal.muted || "#5a605d", faint = pal.faint || "#5e6963", rule = pal.rule || "#cfcac0";
    const col = l => pal["l" + l] || pal.accent || "#1e4f74";
    const s = Math.min(w, h) / 105, M = 7 * s;                          /* 1 at A6 */
    /* text is measured at 92 % of the room: if the print fonts were not in yet when it was measured, it still fits on paper */
    const SAFE = 0.92, fit = (t, f, pt, mm, mn) => pf.fit(t, f, pt, mm * SAFE, mn), wrap = (t, f, pt, mm, n, mn) => pf.wrap(t, f, pt, mm * SAFE, n, mn);
    const byKw = new Map(data.people.map(p => [p.kw, p]));
    const livingNames = new Set([...(data.livingNames || []), ...data.people.filter(p => p.living).map(p => p.n)]), short = n => { const k = shortName(n); return livingNames.has(k) ? n : k; };
    const cards = cardsOf(data, o), used = new Set(), pages = [];
    const text = (x, y, t, font, pt, fill, anchor) => `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}"${anchor ? ` text-anchor="${anchor}"` : ""} style="font-family:'${font.family}';font-weight:${font.weight || 400};font-style:${font.style || "normal"}" font-size="${(pt * PT).toFixed(3)}" fill="${fill}">${esc(t)}</text>`;
    const page = (name, g) => { const W = w + 2 * b, H = h + 2 * b;
      pages.push({ name, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${paper}"/><g transform="translate(${b} ${b})">${g}</g></svg>` }); };
    /* a small map of the region with the place (no photograph sharp enough): the coast and borders of the site, as on the poster */
    const base = data.mapBase || {}, B = base.bounds || { lo0: 5.3, lo1: 6.62, la0: 52.36, la1: 53.33 };
    function miniMap(a, x, y, fw, fh) {
      const KX = Math.cos(((B.la0 + B.la1) / 2) * Math.PI / 180), span = 0.42, cla = a.la, clo = a.lo;
      let la0 = cla - span / 2, la1 = cla + span / 2, gw = fw / fh * span, lo0 = clo - gw / 2 / KX;
      const k = fh / span, X = lo => x + (lo - lo0) * KX * k, Y = la => y + (la1 - la) * k;
      const path = (pts, close) => pts.map((p, i) => (i ? "L" : "M") + X(p[1]).toFixed(2) + " " + Y(p[0]).toFixed(2)).join("") + (close ? "Z" : "");
      const id = "cl" + Math.abs([...a.key].reduce((v, c) => v * 31 + c.charCodeAt(0) | 0, 7));
      let g = `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${fw}" height="${fh}"/></clipPath><g clip-path="url(#${id})"><rect x="${x}" y="${y}" width="${fw}" height="${fh}" fill="${pal.land || "#efe9da"}"/>`;
      if (base.water) g += `<path d="${path(base.water, true)}" fill="${pal.water || "#d6e1e3"}"/>`;
      (base.borders || []).forEach(bd => { g += `<path d="${path(bd)}" fill="none" stroke="${faint}" stroke-width="0.2" stroke-dasharray="0.8 0.6"/>`; });
      /* the place in its family colour, and up to five neighbours of the set by name, small (never below the minimum) */
      const inFrame = q => { const qx = X(q.lo), qy = Y(q.la); return qx > x + 2 && qx < x + fw - 2 && qy > y + 2 && qy < y + fh - 2; };
      const near = (P._cardPlaces || []).filter(q => q.key !== a.key && inFrame(q)).sort((p1, p2) => Math.hypot(p1.la - a.la, p1.lo - a.lo) - Math.hypot(p2.la - a.la, p2.lo - a.lo)).slice(0, 5);
      const boxes = [], free = (bx, by, bw, bh) => bx > x + 1 && bx + bw < x + fw - 1 && by > y + 1 && by + bh < y + fh - 1 && !boxes.some(q => bx < q[0] + q[2] && q[0] < bx + bw && by < q[1] + q[3] && q[1] < by + bh);
      const label = (q, font, pt, fill, r) => { const t = fit(q.name, font, pt, fw * 0.45, min), tw = pf.measure(t.text, font, t.pt) / 0.92, th = t.pt * PT, cx = X(q.lo), cy = Y(q.la);
        for (const [lx, anchor] of [[cx + r + 1, "start"], [cx - r - 1, "end"]]) { const bx = anchor === "start" ? lx : lx - tw; if (free(bx, cy - th * 0.75, tw, th)) { boxes.push([bx, cy - th * 0.75, tw, th]); return text(lx, cy + th * 0.3, t.text, font, t.pt, fill, anchor); } }
        return ""; };
      const main = col(+Object.entries(a.lines).sort((p1, q) => q[1] - p1[1])[0][0]), rMain = 2.2 * s;
      boxes.push([X(a.lo) - rMain, Y(a.la) - rMain, 2 * rMain, 2 * rMain]);
      near.forEach(q => { g += `<circle cx="${X(q.lo).toFixed(2)}" cy="${Y(q.la).toFixed(2)}" r="${(0.9 * s).toFixed(2)}" fill="${faint}"/>`; boxes.push([X(q.lo) - 0.9 * s, Y(q.la) - 0.9 * s, 1.8 * s, 1.8 * s]); });
      g += `<circle cx="${X(a.lo).toFixed(2)}" cy="${Y(a.la).toFixed(2)}" r="${rMain.toFixed(2)}" fill="${main}" stroke="${paper}" stroke-width="0.5"/>`;
      g += label(a, SANS_B, Math.max(min, 8 * s), ink, rMain);
      near.forEach(q => { g += label(q, SANS, min, muted, 0.9 * s); });
      g += `</g>`;
      return g + `<rect x="${x}" y="${y}" width="${fw}" height="${fh}" fill="none" stroke="${ink}" stroke-opacity="0.15" stroke-width="0.25"/>`; /* the same frame as a photograph */
    }
    P._cardPlaces = cards; /* the other places of the set, as small dots on a mini map */
    cards.forEach((a, i) => {
      const n = a.people.size, ys = a.years.filter(Boolean), y0 = ys.length ? Math.min(...ys) : null, y1 = ys.length ? Math.max(...ys) : null;
      const lines = Object.keys(a.lines).filter(l => l !== "undefined" && l !== "null").map(Number).sort((p, q) => a.lines[q] - a.lines[p]);
      /* ---- front ---- */
      const fw = w - 2 * M, fh = fw * 0.75, fx = M, fy = M;
      const im = photoOf(data, a.key, fw, fh) || oldMapOf(data, a, fw, fh);
      let g = "";
      if (im) { used.add(im.id); const id = "ph" + i;
        g += `<clipPath id="${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}"/></clipPath><image href="${esc(im.src)}" x="${fx}" y="${fy}" width="${fw}" height="${fh}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`
          + `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="none" stroke="${ink}" stroke-opacity="0.15" stroke-width="0.25"/>`; }
      else g += miniMap(a, fx, fy, fw, fh);
      /* the name, where and how many: in the middle of the paper between the photograph and the band of the families */
      const name = fit(a.name, DISPLAY, 24 * s, fw, 12), where = [a.gem && a.gem !== a.name ? a.gem : "", (data.places[a.key] || {}).prov || ""].filter(Boolean).join(" · ");
      const blockH = name.pt * PT * 0.75 + (where ? 5.2 * s : 0) + 6 * s, room = (h - M - 1.2 * s) - (fy + fh);
      let y = fy + fh + (room - blockH) / 2 + name.pt * PT * 0.75;
      g += text(w / 2, y, name.text, DISPLAY, name.pt, ink, "middle");
      if (where) { y += 5.2 * s; const f = fit(where, TEXT_I, 9 * s, fw, min); g += text(w / 2, y, f.text, TEXT_I, f.pt, muted, "middle"); }
      y += 6 * s; const meta = `${n} voorouders${y0 ? ` · ${y0 === y1 ? y0 : y0 + "–" + y1}` : ""}`, fm = fit(meta, MONO, 7.5 * s, fw, min);
      g += text(w / 2, y, fm.text, MONO, fm.pt, faint, "middle");
      /* the families that lived here, as a band at the bottom */
      const bw = fw * 0.6, bx = (w - bw) / 2, by = h - M - 1.2 * s, tot = lines.reduce((t, l) => t + a.lines[l], 0) || 1; let cx = bx;
      lines.forEach(l => { const ww = bw * a.lines[l] / tot; g += `<rect x="${cx.toFixed(2)}" y="${by.toFixed(2)}" width="${Math.max(0.3, ww - 0.4).toFixed(2)}" height="${(1.2 * s).toFixed(2)}" fill="${col(l)}"/>`; cx += ww; });
      page(`${a.name} – voorkant`, g);
      /* ---- back ---- */
      g = ""; y = M + 6 * s;
      g += text(M, y, "Wie er woonden", TEXT_I, Math.max(min, 9 * s), muted);
      y += 7 * s; const t2 = fit(a.name, DISPLAY, 17 * s, w - 2 * M, 10); g += text(M, y, t2.text, DISPLAY, t2.pt, ink);
      y += 3.5 * s; g += `<line x1="${M}" x2="${w - M}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${rule}" stroke-width="0.25"/>`;
      const kws = [...a.people.keys()].sort((p, q) => (yr(byKw.get(p).b) || yr(byKw.get(p).d) || 9999) - (yr(byKw.get(q).b) || yr(byKw.get(q).d) || 9999));
      const show = kws.slice(0, 9), rowPt = Math.max(min, 7.2 * s), lh = rowPt * PT * 1.55;
      y += 5 * s;
      show.forEach(kw => { const p = byKw.get(kw), roles = [...a.people.get(kw)].join(", ");
        g += `<circle cx="${(M + 1).toFixed(2)}" cy="${(y - rowPt * PT * 0.33).toFixed(2)}" r="${(0.9 * s).toFixed(2)}" fill="${col(p.line)}"/>`;
        const nm = fit(short(p.n), SANS_B, rowPt, (w - 2 * M) * 0.52, min); g += text(M + 3.2 * s, y, nm.text, SANS_B, nm.pt, ink);
        const yrs = fit(years(p), MONO, Math.max(min, rowPt - 0.6), (w - 2 * M) * 0.2, min); g += text(M + 3.2 * s + (w - 2 * M) * 0.53, y, yrs.text, MONO, yrs.pt, faint);
        y += lh * 0.78; const r = fit(roles, SANS, min, w - 2 * M - 3.2 * s, min); g += text(M + 3.2 * s, y, r.text, SANS, r.pt, muted); y += lh * 0.9; });
      if (kws.length > show.length) { const more = `en nog ${kws.length - show.length} ${kws.length - show.length === 1 ? "voorouder" : "voorouders"}`; g += text(M + 3.2 * s, y, more, SANS, min, muted); y += lh; }
      /* one fact, as far as room allows; the credit and the source stay at the bottom */
      const credit = im && im.credit ? "Voorkant: " + String(im.credit).replace(/^\s*beeld:\s*/i, "") : "";
      const cr = credit ? wrap(credit, SANS, min, w - 2 * M, 2, min) : { lines: [], pt: min };
      const footY = h - M, crTop = footY - (cr.lines.length + 1) * min * PT * 1.35;
      const f = factOf(data, a);
      if (f && crTop - y > 16 * s) {
        y += 2.5 * s; g += text(M, y, "Weetje", SANS_B, min, muted); y += 4.2 * s;
        const fp = Math.max(min, 7.6 * s), maxL = Math.max(1, Math.floor((crTop - y - 2 * s) / (fp * PT * 1.35)));
        const who = byKw.get(f.kw), named = who && [who.n, short(who.n)].some(n => f.text.startsWith(n)); /* the fact often starts with the name already */
        const lead = (who && !named ? short(who.n) + ": " : "") + f.text, wr = wrap(lead, TEXT, fp, w - 2 * M, Math.min(maxL, 7), min);
        wr.lines.forEach((l, j) => { g += text(M, y + j * wr.pt * PT * 1.35, l, TEXT, wr.pt, ink); });
      }
      cr.lines.forEach((l, j) => { g += text(M, crTop + j * cr.pt * PT * 1.35, l, SANS, cr.pt, faint); });
      const src = fit(`${data.url || ""}${data.url ? " · " : ""}kaart ${i + 1} van ${cards.length}`, MONO, min, w - 2 * M, min);
      g += text(M, footY, src.text, MONO, src.pt, faint);
      page(`${a.name} – achterkant`, g);
    });
    delete P._cardPlaces;
    const root = P.startName ? P.startName(data, o.start) : data.root || "";
    return { pages, fonts: ["Libre Caslon Display 400", "Libre Caslon Text 400", "Libre Caslon Text 400 italic", "IBM Plex Sans 400", "IBM Plex Sans 600", "IBM Plex Mono 400"],
      imagesUsed: [...used], title: `Dorpen en voorouders van ${root}`, stats: { cards: cards.length, photos: used.size } };
  }
  (P.renderers = P.renderers || {}).card = { advise, render, cardsOf, placesOf, quartetsOf, pairsOf };
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
