/* Renderer "calendar": a wall calendar for one year, or a perpetual birthday calendar, from the birth and death dates of the
   ancestors. One renderer, two products (product.variant "wall" | "birthday").
   - wall: cover, twelve months (picture on top, a grid of the month below, Monday first) and a year overview: 14 pages, the way
     Saal asks for a wall calendar; other producers take the same pages.
   - birthday: cover and twelve months without weekdays and without a year (a list of days 1–31): 13 pages.
   Every day shows who was born (*) or died (†) on that date, with the year: only the dead with a full date (privacy profile
   "calendar"; the core already removed the living, stillborn children and hypotheses). Pure: returns SVG strings in mm,
   measures text through ctx.platform, takes colours from ctx.palette (the light print palette). Text is never smaller than the
   product's minimum (6 pt). Options: year (number, or "next" = next calendar year), start (a person or couple: only their ancestors),
   and from the site title, subtitle and brand (the same title as the book and poster for that start). */
(function (P) {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const PT = 25.4 / 72;
  const SANS = { family: "IBM Plex Sans", weight: 400 }, SANS_B = { family: "IBM Plex Sans", weight: 600 }, MONO = { family: "IBM Plex Mono", weight: 400 };
  const DISPLAY = { family: "Libre Caslon Display", weight: 400 }, TEXT_I = { family: "Libre Caslon Text", weight: 400, style: "italic" };
  const MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
  const DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
  const FULL = /^(\d{4})-(\d{2})-(\d{2})$/;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const daysIn = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();          /* m: 0–11 */
  const weekday = (y, m, d) => (new Date(Date.UTC(y, m, d)).getUTCDay() + 6) % 7;   /* 0 = Monday */

  /* all events by month and day: [m][d] = [{ sign, y, kw, name, line }], births first, then by year */
  function eventsOf(data) {
    const ev = Array.from({ length: 12 }, () => ({}));
    const add = (date, sign, p) => { const m = FULL.exec(date || ""); if (!m) return; const mo = +m[2] - 1, da = +m[3];
      (ev[mo][da] = ev[mo][da] || []).push({ sign, y: +m[1], kw: p.kw, name: p.n, line: p.line }); };
    data.people.filter(p => !p.living).forEach(p => { add(p.b, "*", p); add(p.d, "†", p); });
    ev.forEach(mo => Object.values(mo).forEach(list => list.sort((a, b) => (a.sign === "*" ? 0 : 1) - (b.sign === "*" ? 0 : 1) || a.y - b.y)));
    return ev;
  }
  /* pictures for the months: places, maps and churches first (no portraits, no scans of deeds), landscape before portrait,
     then the largest; one per month, as long as there are enough */
  const SCAN = /(^|[-_])(akte|scan|reg|bidprent)/i, GOOD_KIND = /^(place|plaats|map|kaart|stadsplan|church|kerk|plek|hist)/i;
  function picturesOf(data, n) {
    const ok = (data.images || []).filter(im => im.src && !/^(persoon|person|portret)$/.test(im.kind || "") && !SCAN.test(im.id || "") && !SCAN.test(im.kind || "") && !/^(akte|document|krant|register|rouw|graf|bidprentje)$/.test(im.group || "") && (im.w || 0) >= 800);
    const score = im => (GOOD_KIND.test(im.kind || "") ? 2 : 0) + ((im.w || 0) > (im.h || 0) * 1.15 ? 1 : 0);
    return ok.sort((a, b) => score(b) - score(a) || (b.w * b.h) - (a.w * a.h)).slice(0, n);
  }
  /* a short name for a small cell: first given name and the surname (with its prefix), "Ype Douwes Jongma" → "Ype Jongma" */
  const PREFIX = /^(de|van|der|den|ten|ter|te|la|le)$/i;
  function shortName(n) {
    const w = String(n || "").replace(/\(.*?\)/g, "").trim().split(/\s+/); if (w.length <= 2) return w.join(" ");
    let i = w.length - 1; while (i > 1 && PREFIX.test(w[i - 1])) i--;
    return [w[0], ...w.slice(i)].join(" ");
  }
  /* "Ook gedenkdagen": a stillborn child on its day, with a quiet ring (°, in Latin-1, so in every font) instead of * or †,
     named after its parents by first name as in the deed ("levenloos geboren kind van Herman en Mien"); only when asked for, and
     only when the parent belongs to the start */
  const first = p => p ? p.roep || String(p.n || "").split(/\s+/)[0] : "";
  function addMemorials(ev, data, o, members) {
    if (!o.memorials || !(data.memorials || []).length) return;
    const byKw = new Map((data.people || []).map(p => [p.kw, p]));
    data.memorials.forEach(mm => { const par = byKw.get(mm.kw); if (!par || par.living || (members && !members.has(mm.kw))) return;
      const other = byKw.get(mm.kw % 2 ? mm.kw - 1 : mm.kw + 1), both = other && !other.living ? [first(mm.kw % 2 ? other : par), first(mm.kw % 2 ? par : other)] : [first(par)];
      const list = ev[mm.m - 1][mm.d] = ev[mm.m - 1][mm.d] || [];
      list.push({ sign: "°", y: mm.y, kw: mm.kw, name: `${mm.text || "levenloos geboren kind"} van ${both.join(" en ")}`, line: par.line, memo: true }); });
    ev.forEach(mo => Object.values(mo).forEach(list => list.sort((a, b) => (a.sign === "*" ? 0 : 1) - (b.sign === "*" ? 0 : 1) || a.y - b.y)));
  }
  function resolveYear(o) { const y = +(o && o.year); return Number.isInteger(y) && y > 1800 ? y : new Date().getFullYear() + 1; }

  function render(data, o, ctx) {
    const { w, h } = ctx.size, b = ctx.bleed || 0, pf = ctx.platform, pal = ctx.palette || {}, min = (ctx.product && ctx.product.minPt) || 6;
    const variant = (ctx.product && ctx.product.variant) || "wall", year = resolveYear(o), wall = variant !== "birthday";
    const s = Math.min(w, h) / 210;                                    /* 1 at A4 width */
    const M = Math.max(10, 12 * s), ink = pal.ink || "#1a1c1b", muted = pal.muted || "#5a605d", faint = pal.faint || "#5e6963", rule = pal.rule || "#cfcac0";
    const col = l => pal["l" + l] || pal.accent || "#1e4f74";
    /* a start other than the main person (one person or a couple) keeps only their ancestors, and names them in the title */
    const st = P.startOf ? P.startOf(o.start) : { rootKw: 1, pair: false }, members = st.rootKw === 1 && !st.pair ? null : P.startMembers(data, o.start);
    const people = members ? data.people.filter(p => members.has(p.kw)) : data.people, root = P.startName ? P.startName(data, o.start) : data.root || "";
    const ev = eventsOf({ ...data, people }); addMemorials(ev, data, o, members);
    const pics = (all => { /* the cover a photograph of a place (not one of the old maps the months show: they look alike), then the months */
      const c = all.find(im => !/^(kaart|map|stadsplan)$/i.test(im.kind || "")) || all[0]; return c ? [c, ...all.filter(x => x !== c)].slice(0, 13) : all; })(picturesOf(data, 14)), used = new Set();
    /* a short name that is also the name of someone living ("Aaltje Jans Bakker" → "Aaltje Bakker") would confuse: then the full name */
    const livingNames = new Set([...(data.livingNames || []), ...data.people.filter(p => p.living).map(p => p.n)]), short = n => { const k = shortName(n); return livingNames.has(k) ? n : k; };
    const label = e => e.memo ? e.name : short(e.name);              /* a memorial day keeps its own words */
    const inTree = new Set(people.map(p => p.line).filter(Boolean));
    const lines = Object.keys(data.lines || {}).map(Number).filter(l => data.lines[l] && (!members || inTree.has(l))).sort((a, c) => a - c);
    const pages = [];
    const page = (name, g) => { const W = w + 2 * b, H = h + 2 * b;
      pages.push({ name, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${pal.paper || "#fff"}"/><g transform="translate(${b} ${b})">${g}</g></svg>` }); };
    const text = (x, y, t, font, pt, fill, anchor) => `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}"${anchor ? ` text-anchor="${anchor}"` : ""} style="font-family:'${font.family}';font-weight:${font.weight || 400};font-style:${font.style || "normal"}" font-size="${(pt * PT).toFixed(2)}" fill="${fill}">${esc(t)}</text>`;
    /* a picture over the full width, into the bleed at the top; no text on it (binding side of a wall calendar) */
    const picture = (im, ph) => { if (!im) return ""; used.add(im.id);
      return `<image href="${esc(im.src)}" x="${-b}" y="${-b}" width="${w + 2 * b}" height="${ph + b}" preserveAspectRatio="xMidYMid slice"/>`; };
    const credit = (im, y) => im && im.credit ? (() => { const f = pf.fit("Beeld: " + String(im.credit).replace(/^\s*beeld:\s*/i, ""), SANS, min, w - 2 * M, min); return text(M, y, f.text, SANS, f.pt, muted); })() : "";
    const foot = y => { const f = pf.fit(data.url || "", SANS, min, (w - 2 * M) * 0.45, min); return text(w - M, y, f.text, SANS, f.pt, faint, "end"); };
    const familyBar = (y, hh) => lines.length ? lines.map((l, i) => `<rect x="${(M + i * (w - 2 * M) / lines.length).toFixed(2)}" y="${y.toFixed(2)}" width="${((w - 2 * M) / lines.length - 0.6).toFixed(2)}" height="${hh.toFixed(2)}" fill="${col(l)}"/>`).join("") : "";

    /* the title: "De voorouders van" + the name, or the title the site gives (o.title, e.g. "De familie De Groot · De Vries" for a
       couple as start, with o.subtitle "Vanaf Herman en Mien"): a small line above and the large name, as on the book cover */
    const coverTitle = (() => {
      const t = String(o.title || ""), m = /^(De voorouders van|De familie|De families)\s+(.+)$/.exec(t);
      if (!t) return { lead: wall ? "De voorouders van" : "Verjaardagen van de voorouders van", big: root, sub: o.subtitle || "", plain: "de voorouders van " + root };
      const lead = m ? m[1] : "", big = m ? m[2] : t;
      return { lead: wall ? lead : "Verjaardagen van " + (lead ? lead.charAt(0).toLowerCase() + lead.slice(1) : ""), big, sub: o.subtitle || "", plain: t.charAt(0).toLowerCase() + t.slice(1) };
    })();
    /* ---- cover ---- */
    {
      const ph = h * (h / w > 1.8 ? 0.66 : 0.56); let g = picture(pics[0], ph);   /* a tall, narrow calendar gets a taller picture */
      if (!pics[0]) g += `<rect x="${-b}" y="${-b}" width="${w + 2 * b}" height="${ph + b}" fill="${pal.accent || "#1e4f74"}"/>`;
      const { lead, big, sub } = coverTitle, brand = o.brand || data.brand || "";
      const l1 = pf.fit(lead, TEXT_I, 15 * s, w - 2 * M, min), l2 = pf.fit(big, DISPLAY, 38 * s, w - 2 * M, 14), l3 = sub ? pf.fit(sub, TEXT_I, 12 * s, w - 2 * M, min) : null;
      /* the title block sits in the middle of the white below the picture */
      const block = l1.pt * PT + l2.pt * PT * 1.05 + (l3 ? l3.pt * PT * 1.5 : 0) + 13 * s + (wall ? 10 * s : 0) + (brand ? 6 * s : 0), avail = h - M - 9 * s - ph;
      let y = ph + Math.max(16 * s, (avail - block) / 2 + l1.pt * PT);
      g += text(w / 2, y, l1.text, TEXT_I, l1.pt, ink, "middle"); y += l2.pt * PT * 1.05;
      g += text(w / 2, y, l2.text, DISPLAY, l2.pt, ink, "middle");
      if (l3) { y += l3.pt * PT * 1.5; g += text(w / 2, y, l3.text, TEXT_I, l3.pt, muted, "middle"); }
      y += 13 * s;
      if (wall) { g += text(w / 2, y, String(year), DISPLAY, 30 * s, pal.gold || "#8a5c0e", "middle"); y += 10 * s; }
      if (brand) { const f = pf.fit(brand.toUpperCase(), SANS, Math.max(min, 7.5 * s), w - 2 * M, min); g += text(w / 2, y, f.text, SANS, f.pt, muted, "middle"); y += 6 * s; }
      g += familyBar(h - M - 9 * s, 1.6 * s);
      g += credit(pics[0], h - M);
      page("omslag", g);
    }

    /* ---- the months ---- */
    for (let m = 0; m < 12; m++) {
      const im = pics[1 + m] || null, ph = h * (wall ? 0.40 : 0.30);
      let g = picture(im, ph);
      if (!im) g += `<rect x="${-b}" y="${-b}" width="${w + 2 * b}" height="${ph + b}" fill="${col(lines[m % (lines.length || 1)] || 8)}" fill-opacity="0.18"/>`;
      let y = ph + 13 * s;
      const title = wall ? cap(MONTHS[m]) + " " + year : cap(MONTHS[m]);
      g += text(M, y, title, DISPLAY, 26 * s, ink);
      const n = Object.values(ev[m]).reduce((a, l) => a + l.length, 0);
      if (n) { const f = pf.fit(`${n} ${n === 1 ? "gebeurtenis" : "gebeurtenissen"} in de akten`, SANS, Math.max(min, 7.5 * s), (w - 2 * M) * 0.4, min); g += text(w - M, y, f.text, SANS, f.pt, muted, "end"); }
      y += 6 * s;
      const bottom = h - M - 6 * s, evPt = Math.max(min, 6.4 * s), lineH = evPt * PT * 1.28;
      if (wall) {
        /* a grid of the month, Monday first */
        const first = weekday(year, m, 1), nd = daysIn(year, m), rows = Math.ceil((first + nd) / 7);
        const cw = (w - 2 * M) / 7, headH = 6 * s, ch = (bottom - y - headH) / rows;
        DAYS.forEach((d, i) => { g += text(M + i * cw + 1.2 * s, y + headH - 2 * s, d, MONO, Math.max(min, 7 * s), i >= 5 ? faint : muted); });
        y += headH;
        for (let r = 0; r <= rows; r++) g += `<line x1="${M}" y1="${(y + r * ch).toFixed(2)}" x2="${w - M}" y2="${(y + r * ch).toFixed(2)}" stroke="${rule}" stroke-width="0.25"/>`;
        for (let d = 1; d <= nd; d++) {
          const i = first + d - 1, cx = M + (i % 7) * cw, cy = y + Math.floor(i / 7) * ch, list = ev[m][d] || [];
          g += text(cx + 1.2 * s, cy + 4.6 * s, String(d), MONO, Math.max(min, 9 * s), i % 7 >= 5 ? faint : ink);
          const top0 = cy + 4.6 * s + lineH * 1.05;                       /* the first event below the day number */
          const room = Math.max(0, Math.floor((cy + ch - top0 + lineH * 0.6) / lineH));
          const show = list.length > room ? Math.max(0, room - 1) : list.length, maxW = cw - 3.4 * s;
          /* a name that does not fit runs on to a second line, as long as the cell has room for all of them */
          const lines = list.slice(0, show).map(e => {
            const one = `${e.sign} ${e.y} ${label(e)}`;
            if (pf.measure(one, SANS, evPt) <= maxW) return [one];
            if (e.memo) return one.split(" ").reduce((ls, wd) => { const t = ls.length ? ls[ls.length - 1] + " " + wd : wd; /* a memorial day: its words over as many lines as needed */
              if (ls.length && pf.measure(t, SANS, evPt) <= maxW - 1.6 * s) ls[ls.length - 1] = t; else ls.push(wd); return ls; }, []);
            const words = label(e).split(" "), head = `${e.sign} ${e.y} ${words[0]}`, rest = words.slice(1).join(" ");
            return rest ? [head, rest] : [one];
          });
          const wrap = lines.reduce((a, l) => a + l.length, 0) <= room;
          let k = 0;
          list.slice(0, show).forEach((e, i) => {
            const ls = wrap ? lines[i] : [`${e.sign} ${e.y} ${e.memo ? "levenloos" : label(e)}`], ly = top0 + k * lineH; /* a full cell: a memorial day in one word */
            g += `<rect x="${(cx + 1.2 * s).toFixed(2)}" y="${(ly - evPt * PT * 0.78).toFixed(2)}" width="${(0.7 * s).toFixed(2)}" height="${(evPt * PT * 0.9 + (ls.length - 1) * lineH).toFixed(2)}" fill="${e.memo ? rule : col(e.line)}"/>`;
            const ind = 1.6 * s;                                          /* a small hanging indent for the second line */
            ls.forEach((l, j) => { const f = pf.fit(l, SANS, evPt, maxW - (j ? ind : 0), min); g += text(cx + 2.4 * s + (j ? ind : 0), ly + j * lineH, f.text, SANS, f.pt, e.memo ? muted : ink); });
            k += ls.length;
          });
          if (list.length > show) g += text(cx + 2.4 * s, top0 + k * lineH, `+ ${list.length - show} meer`, SANS, evPt, muted);
        }
      } else {
        /* a list of the days 1–31 (29 February too), without weekdays */
        const nd = m === 1 ? 29 : daysIn(2001, m), rh = (bottom - y) / nd, pt = Math.max(min, Math.min(8.5 * s, rh / PT / 1.35));
        for (let d = 1; d <= nd; d++) {
          const ry = y + d * rh - rh * 0.28, list = ev[m][d] || [];
          g += `<line x1="${M}" y1="${(y + d * rh).toFixed(2)}" x2="${w - M}" y2="${(y + d * rh).toFixed(2)}" stroke="${rule}" stroke-width="0.25"/>`;
          g += text(M + 7 * s, ry, String(d), MONO, pt, ink, "end");
          if (list.length) {
            const maxW = w - 2 * M - 11 * s, items = list.map(e => `${e.sign} ${e.y} ${e.name}`), all = items.join("  ·  "), lh = pt * PT * 1.22;
            if (pf.measure(all, SANS, pt) > maxW && rh >= lh * 2.15 && items.length > 1) {
              /* a busy day takes two lines when the row is tall enough */
              let cut = 1; while (cut < items.length - 1 && pf.measure(items.slice(0, cut + 1).join("  ·  "), SANS, pt) <= maxW) cut++;
              const y1 = y + (d - 1) * rh + (rh - lh) / 2 + pt * PT * 0.36;
              [items.slice(0, cut), items.slice(cut)].forEach((part, j) => { const f = pf.fit(part.join("  ·  "), SANS, pt, maxW, min); g += text(M + 11 * s, y1 + j * lh, f.text, SANS, f.pt, ink); });
            } else { const f = pf.fit(all, SANS, pt, maxW, min); g += text(M + 11 * s, ry, f.text, SANS, f.pt, ink); }
          }
        }
      }
      g += credit(im, h - M); g += foot(h - M);
      page(MONTHS[m], g);
    }

    /* ---- year overview (wall only) ---- */
    if (wall) {
      let g = text(M, M + 16 * s, `${year} in één oogopslag`, DISPLAY, 26 * s, ink);
      const f0 = pf.fit("Vet: een dag met een geboorte (*) of sterfdag (†) van een voorouder.", SANS, Math.max(min, 7.5 * s), w - 2 * M, min);
      g += text(M, M + 24 * s, f0.text, SANS, f0.pt, muted);
      const top = M + 32 * s, cols = w > h ? 4 : 3, rows = 12 / cols, gw = (w - 2 * M) / cols, gh = (h - M - 8 * s - top) / rows;
      for (let m = 0; m < 12; m++) {
        const ox = M + (m % cols) * gw, oy = top + Math.floor(m / cols) * gh, cw = (gw - 6 * s) / 7, rh = (gh - 14 * s) / 7, pt = Math.max(min, Math.min(8 * s, rh / PT / 1.3));
        g += text(ox, oy + 6 * s, cap(MONTHS[m]), DISPLAY, 13 * s, ink);
        DAYS.forEach((d, i) => { g += text(ox + i * cw + cw * 0.5, oy + 11 * s, d.charAt(0), MONO, pt, faint, "middle"); });
        const first = weekday(year, m, 1), nd = daysIn(year, m);
        for (let d = 1; d <= nd; d++) {
          const i = first + d - 1, has = (ev[m][d] || []).length, x = ox + (i % 7) * cw + cw * 0.5, y2 = oy + 11 * s + (Math.floor(i / 7) + 1) * rh;
          g += text(x, y2, String(d), has ? SANS_B : MONO, pt, has ? col((ev[m][d][0] || {}).line) : muted, "middle");
        }
      }
      g += foot(h - M);
      page("jaaroverzicht", g);
    }

    const title = wall ? `Wandkalender ${year}: ${coverTitle.plain}` : `Verjaardagskalender: ${coverTitle.plain}`;
    return { pages, fonts: ["Libre Caslon Display 400", "Libre Caslon Text 400 italic", "IBM Plex Sans 400", "IBM Plex Sans 600", "IBM Plex Mono 400"],
      imagesUsed: [...used], title, stats: { year: wall ? year : null, events: ev.reduce((a, mo) => a + Object.values(mo).reduce((x, l) => x + l.length, 0), 0) } };
  }
  /* the advised year of a wall calendar: next year (so doc.options.year holds a real year; a year asked for stays in the token) */
  function advise(data, o, ctx) { return (ctx && ctx.product && ctx.product.variant) === "birthday" ? {} : { year: new Date().getFullYear() + 1 }; }
  (P.renderers = P.renderers || {}).calendar = { advise, render, eventsOf };
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
