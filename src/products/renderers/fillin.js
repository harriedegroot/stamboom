/* Renderer "fillin": the fill-in book "Mijn voorouders" for children (product "book-kids"), to do together with a parent or
   grandparent. 16 pages, so it can be stapled: cover, inside cover (for the adult), twelve pages to fill in, inside back
   ("Mijn eigen ontdekking") and back cover. A5 or A4 portrait; everything is drawn in mm, so A4 is the same book, larger.
   Privacy: the child, the parents and the grandparents (generations I–III from the start) are never printed: their boxes and
   lines stay empty, for the family to fill in. Only deceased ancestors from generation IV on are printed (call name, surname,
   years), and the fact per family is from a deceased ancestor and A or B. The cover only carries the name from "Voor …"
   (o.persons), otherwise an empty line.
   Pure: SVG strings in mm (with bleed), text measured through ctx.platform, colours from ctx.palette (l8 … l15 per family).
   Print rules: text at least 9 pt for the child (sources and page numbers smaller, never below the product minimum), write-on
   lines 9–10 mm apart, text kept inside the safe area, font names written out in the SVG, no stroke on text, no glyphs the
   print fonts lack. Options: start (a person or couple: the child is the root of the start), persons (the names for the cover).
   Format "a4-boekje": the same pages imposed two per A4 side, to print at home (see booklet). */
(function (P) {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const yr = s => { const m = String(s || "").match(/\d{4}/); return m ? +m[0] : null; };
  const plain = s => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const PT = 25.4 / 72;
  const DISPLAY = { family: "Libre Caslon Display", weight: 400 }, SERIF = { family: "Libre Caslon Text", weight: 400 }, SERIF_I = { family: "Libre Caslon Text", weight: 400, style: "italic" };
  const SANS = { family: "IBM Plex Sans", weight: 400 }, SANS_M = { family: "IBM Plex Sans", weight: 500 }, SANS_B = { family: "IBM Plex Sans", weight: 600 }, MONO = { family: "IBM Plex Mono", weight: 400 };
  const FONTS = ["Libre Caslon Display 400", "Libre Caslon Text 400", "Libre Caslon Text 400 italic", "IBM Plex Sans 400", "IBM Plex Sans 500", "IBM Plex Sans 600", "IBM Plex Mono 400"];
  const SAFE = 0.92, LINE_GAP = 10;
  const PREFIX = /^(de|van|der|den|ten|ter|te|la|le|op)$/i;
  const gen = k => Math.floor(Math.log2(k)) + 1;

  /* the surname with its prefix: "Wouter Klazes Bakker" → "Bakker", "Anna Maria de Jong" → "de Jong" */
  function surname(n) {
    const w = String(n || "").trim().split(/\s+/); if (w.length < 2) return "";
    let i = w.length - 1; while (i > 1 && PREFIX.test(w[i - 1])) i--;
    return w.slice(i).join(" ");
  }
  /* call name and surname: the call name when the data has it, else the first given name */
  function shortName(p) {
    const first = p.roep || String(p.n || "").trim().split(/\s+/)[0] || "", sur = surname(p.n);
    return { first, sur };
  }
  const yearsOf = p => { const b = yr(p.b), d = yr(p.d); return b && d ? `${b}–${d}` : b ? `geboren ${b}` : d ? `overleden ${d}` : ""; };

  /* the deceased person at position k (kwartierverlies: through data.aliases), or null */
  function deceasedAt(data, by, k) {
    const al = data.aliases || {}, p = by.get(al[k] || k);
    return p && !p.living && p.n ? p : null;
  }
  /* everyone above position k (k included), as positions; for the facts and places of one family */
  function branch(by, data, k, depth = 12) {
    const al = data.aliases || {}, out = [];
    const walk = (x, d) => { const r = al[x] || x; if (!by.has(r) || d > depth) return; out.push(r); walk(2 * x, d + 1); walk(2 * x + 1, d + 1); };
    walk(k, 0); return [...new Set(out)];
  }
  /* the four families of the book: one per grandparent (the family of that grandparent's father), with a fact and the places */
  function familiesOf(data, by, root) {
    const tx = P.renderers && P.renderers.text, out = [];
    for (let i = 0; i < 4; i++) {
      const gp = 4 * root + i, ggf = 2 * gp;
      const lineNo = root === 1 ? 8 + 2 * i : null, line = lineNo && data.lines && data.lines[lineNo];
      const head = deceasedAt(data, by, ggf);
      /* the surname of the great-grandfather (capitalised without a first name: "De Groot", "Van der Molen"); else the name of the line,
         which in a joined tree is a couple ("De Groot · Kingma"): then its first family */
      const sur = head ? surname(head.n) : "", name = sur ? sur[0].toUpperCase() + sur.slice(1) : line && line.name ? String(line.name).split(" · ")[0] : "";
      /* the people of this side: the grandparent's ancestors (the grandparent himself is never used: possibly living) */
      const kws = [...branch(by, data, 2 * gp), ...branch(by, data, 2 * gp + 1)].filter(k => { const p = by.get(k); return p && !p.living; });
      kws.sort((a, b) => gen(a) - gen(b) || a - b);
      let fact = null;
      if (tx && tx.factsFor) for (const k of kws) { const f = tx.factsFor(data, k)[0]; if (f && plain(f.text).length > 30) { const p = by.get(k); fact = { p, f, source: tx.sourceOf ? tx.sourceOf(p, f) : "" }; break; } }
      const places = placesOf(data, new Set(kws));
      out.push({ i, name, line: lineNo || 8 + 2 * i, fact, places });
    }
    return out;
  }
  /* places with how many of these ancestors were there (born, married, lived, died); municipalities are not places */
  function placesOf(data, kws) {
    const pl = data.places || {}, m = new Map();
    const add = (k, kw) => { const q = k && pl[k]; if (!q || q.seat || q.kind === "gemeente" || q.la == null || q.lo == null) return;
      const a = m.get(k) || { key: k, name: q.name || k, la: q.la, lo: q.lo, people: new Set() }; a.people.add(kw); m.set(k, a); };
    (data.people || []).filter(p => kws.has(p.kw) && !p.living).forEach(p => { add(p.bp, p.kw); add(p.dp, p.kw); if (p.m) add(p.m.p, p.kw); (p.res || []).forEach(r => add(r.p, p.kw)); });
    return [...m.values()].sort((a, b) => b.people.size - a.people.size || a.name.localeCompare(b.name));
  }

  /* the booklet to print at home (format "a4-boekje"): the 16 A5 pages, two per side of an A4 sheet (landscape), in imposition
     order, so that printing double-sided (flip on the short edge), folding the stack once and stapling in the middle gives the book */
  const IMPOSE = [[16, 1], [2, 15], [14, 3], [4, 13], [12, 5], [6, 11], [10, 7], [8, 9]];
  const a4Landscape = ctx => ctx.size && ctx.size.w > ctx.size.h && ctx.size.w >= 296;
  function booklet(data, o, ctx) {
    const a5 = render(data, Object.assign({}, o, { format: "a5" }), Object.assign({}, ctx, { size: { w: 148, h: 210 }, bleed: 0 }));
    /* bleed makes no sense for a sheet printed at home; when the engine still asks for it, the sheet keeps its place inside a white edge */
    const W = ctx.size.w, H = ctx.size.h, bl = ctx.bleed || 0, half = W / 2, dy = (H - 210) / 2, rule = (ctx.palette || {}).faint || "#7a837e";
    const inner = svg => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    const mark = (y0, y1) => `<line x1="${half}" x2="${half}" y1="${y0}" y2="${y1}" stroke="${rule}" stroke-width="0.2" stroke-dasharray="1 1"/>`;
    const pages = IMPOSE.map(([l, r], i) => ({ name: `Vel ${(i >> 1) + 1} ${i % 2 ? "achterkant" : "voorkant"}`,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W + 2 * bl}mm" height="${H + 2 * bl}mm" viewBox="0 0 ${W + 2 * bl} ${H + 2 * bl}"><rect width="${W + 2 * bl}" height="${H + 2 * bl}" fill="#ffffff"/><g transform="translate(${bl} ${bl})">`
        + `<g transform="translate(${(half - 148).toFixed(2)} ${dy.toFixed(2)})">${inner(a5.pages[l - 1].svg)}</g><g transform="translate(${half.toFixed(2)} ${dy.toFixed(2)})">${inner(a5.pages[r - 1].svg)}</g>`
        + mark(0, 4) + mark(H - 4, H) + `</g></svg>` }));
    return Object.assign({}, a5, { pages, stats: Object.assign({}, a5.stats, { sheets: 4, sides: pages.length }) });
  }

  function render(data, o, ctx) {
    if (o.format === "a4-boekje" && a4Landscape(ctx)) return booklet(data, o, ctx);
    const { w, h } = ctx.size, b = ctx.bleed || 0, pf = ctx.platform, pal = ctx.palette || {}, minPt = (ctx.product && ctx.product.minPt) || 6;
    const s = w / 148;                                        /* 1 at A5, 1.42 at A4 */
    const ink = pal.ink || "#1a1c1b", muted = pal.muted || "#5a605d", faint = pal.faint || "#7a837e", rule = pal.rule || "#cfcac0", accent = pal.accent || "#1e4f74", paper = pal.paper || "#ffffff";
    const col = l => pal["l" + l] || accent;
    const M = 14 * s, X0 = M, W = w - 2 * M;                 /* margins: inside the safe area of a stapled A5 */
    const by = new Map((data.people || []).map(p => [p.kw, p]));
    const st = P.startOf ? P.startOf(o.start) : { rootKw: 1, pair: false }, root = st.rootKw;
    const pages = [];
    const fit = (t, f, pt, mm, mn = Math.max(minPt, 9)) => pf.fit(t, f, pt, mm * SAFE, mn);
    const wrap = (t, f, pt, mm, n, mn = Math.max(minPt, 9)) => pf.wrap(t, f, pt, mm * SAFE, n, mn);
    const text = (x, y, t, font, pt, fill = ink, anchor, extra = "") => `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}"${anchor ? ` text-anchor="${anchor}"` : ""} style="font-family:'${font.family}';font-weight:${font.weight || 400};font-style:${font.style || "normal"}" font-size="${(pt * PT * s).toFixed(3)}" fill="${fill}"${extra}>${esc(t)}</text>`;
    /* a block of wrapped text from y (top of the first line); returns the svg and the y under it */
    const para = (x, y, t, font, pt, mm, n, fill = ink, lh = 1.38, mn) => {
      const r = wrap(t, font, pt * s, mm, n, (mn || Math.max(minPt, 9)) * s); let g = "";
      const step = r.pt * PT * lh;
      r.lines.forEach((l, i) => { g += text(x, y + r.pt * PT * 0.8 + i * step, l, font, r.pt / s, fill); });
      return { g, y: y + r.lines.length * step };
    };
    const lines = (x, y, mm, n, gap = LINE_GAP * s) => { let g = ""; for (let i = 0; i < n; i++) { const yy = y + (i + 1) * gap; g += `<line x1="${x.toFixed(2)}" x2="${(x + mm).toFixed(2)}" y1="${yy.toFixed(2)}" y2="${yy.toFixed(2)}" stroke="${rule}" stroke-width="${(0.3 * s).toFixed(2)}"/>`; } return { g, y: y + n * gap }; };
    /* a label with a write-on line after it: "Mijn naam ________" */
    const field = (x, y, label, mm) => { const lw = pf.measure(label, SANS, 10.5 * s) + 2.5 * s;
      return text(x, y, label, SANS, 10.5) + `<line x1="${(x + lw).toFixed(2)}" x2="${(x + mm).toFixed(2)}" y1="${(y + 0.8 * s).toFixed(2)}" y2="${(y + 0.8 * s).toFixed(2)}" stroke="${rule}" stroke-width="${(0.3 * s).toFixed(2)}"/>`; };
    const title = (t, y = M + 10 * s, color = ink) => { const r = fit(t, DISPLAY, 24 * s, W); return { g: text(X0, y, r.text, DISPLAY, r.pt / s, color), y: y + 5 * s }; };
    const box = (x, y, bw, bh, fill = "none", stroke = rule, sw = 0.35, rx = 2) => `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${bw.toFixed(2)}" height="${bh.toFixed(2)}" rx="${(rx * s).toFixed(2)}" fill="${fill}" stroke="${stroke}" stroke-width="${(sw * s).toFixed(2)}"/>`;
    let pageNo = 0;
    const page = (name, g, numbered = true) => {
      pageNo++;
      const num = numbered ? text(w / 2, h - M * 0.55, String(pageNo - 2), MONO, Math.max(minPt, 7.5), faint, "middle") : ""; /* "Dit ben ik" is page 1 */
      const Wb = w + 2 * b, Hb = h + 2 * b;
      pages.push({ name, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${Wb}mm" height="${Hb}mm" viewBox="0 0 ${Wb} ${Hb}"><rect width="${Wb}" height="${Hb}" fill="${paper}"/><g transform="translate(${b} ${b})">${g}${num}</g></svg>` });
    };
    const url = data.url || "";
    const voor = (o.persons || []).filter(Boolean).map(String);

    /* the generation-IV ancestors who may be printed: deceased, at positions 8·root … 8·root + 7 */
    const gg = Array.from({ length: 8 }, (_, j) => deceasedAt(data, by, 8 * root + j));
    const families = familiesOf(data, by, root);
    const oldest = gg.filter(Boolean).map(p => yr(p.b)).filter(Boolean).sort((a, c) => a - c)[0] || null;

    /* ---- cover ---- */
    { let g = "";
      /* a fan without names: four rings, the outer ring in the family colours; the child fills it in inside */
      const cx = w / 2, cy = h * 0.62, R = Math.min(W / 2, 58 * s), rr = [0.22, 0.45, 0.7, 1].map(f => f * R);
      for (let k = 1; k < 4; k++) { const n = 2 ** k; for (let j = 0; j < n; j++) {
        const a0 = Math.PI - j * Math.PI / n, a1 = Math.PI - (j + 1) * Math.PI / n, fill = k === 3 ? col(8 + j) : paper, op = k === 3 ? 0.85 : 1;
        g += `<path d="${sector(cx, cy, rr[k - 1], rr[k], a0, a1)}" fill="${fill}" fill-opacity="${op}" stroke="${k === 3 ? paper : rule}" stroke-width="${(0.6 * s).toFixed(2)}"/>`; } }
      g += `<path d="${sector(cx, cy, 0, rr[0], Math.PI, 0)}" fill="${accent}"/>`;
      g += `<line x1="${(cx - R).toFixed(2)}" x2="${(cx + R).toFixed(2)}" y1="${cy.toFixed(2)}" y2="${cy.toFixed(2)}" stroke="${rule}" stroke-width="${(0.4 * s).toFixed(2)}"/>`;
      const t1 = fit("Mijn voorouders", DISPLAY, 40 * s, W, 24 * s);
      g += text(w / 2, M + 30 * s, t1.text, DISPLAY, t1.pt / s, ink, "middle");
      g += text(w / 2, M + 41 * s, "Een boek om in te vullen", SERIF_I, 14, muted, "middle");
      /* the owner: the name from "Voor …", else a line to write on */
      const yO = h - M - 14 * s;
      if (voor.length) { const n = fit("Dit boek is van " + voor.join(" en "), SANS_M, 13 * s, W, 10 * s); g += text(w / 2, yO, n.text, SANS_M, n.pt / s, ink, "middle"); }
      else { const lw = pf.measure("Dit boek is van", SANS_M, 13 * s); const x = X0 + (W - lw - 62 * s) / 2;
        g += text(x, yO, "Dit boek is van", SANS_M, 13) + `<line x1="${(x + lw + 3 * s).toFixed(2)}" x2="${(x + lw + 62 * s).toFixed(2)}" y1="${(yO + 0.8 * s).toFixed(2)}" y2="${(yO + 0.8 * s).toFixed(2)}" stroke="${ink}" stroke-width="${(0.35 * s).toFixed(2)}"/>`; }
      page("Omslag", g, false); }

    /* ---- inside cover: for the adult ---- */
    { let g = title("Samen lezen", M + 14 * s).g, y = M + 22 * s;
      const r = para(X0, y, `Dit boek is om samen te doen. Het kind vult in wat het weet en vraagt de rest aan opa, oma of een ander familielid. De namen van de overgrootouders en verder staan er al in: die komen uit de stamboom, met bronnen${url ? " op " + url : " op de site"}.`, SERIF, 11, W, 9);
      g += r.g; y = r.y + 6 * s;
      const r2 = para(X0, y, "Van levende familieleden staat er niets in: het kind, de ouders en de grootouders vul je samen in. Alleen overleden voorouders staan er al, met hun jaren.", SANS, 9.5, W, 5, muted);
      g += r2.g;
      page("Binnenkant omslag", g, false); }

    /* ---- 1. Dit ben ik ---- */
    { let g = title("Dit ben ik").g, y = M + 26 * s;
      ["Mijn naam", "Ik ben geboren op", "in", "Mijn vader heet", "Mijn moeder heet", "Ik heb broers en zussen:"].forEach(l => { g += field(X0, y, l, W); y += 12 * s; });
      g += lines(X0, y - 10 * s, W, 1).g; y += 4 * s;
      const bh = h - M - 10 * s - y;
      g += box(X0, y, W, bh, "none", rule, 0.4, 3) + text(X0 + 4 * s, y + 7 * s, "Hier teken ik mezelf", SANS, 10, faint);
      page("Dit ben ik", g); }

    /* ---- 2. Mijn waaier ---- */
    { let g = title("Mijn waaier").g;
      let y = M + 18 * s; const intro = para(X0, y, "In het midden sta jij. Elke ring is een generatie verder terug: eerst je ouders, dan je opa's en oma's, dan hun ouders.", SANS, 10.5, W, 4);
      g += intro.g; y = intro.y + 6 * s;
      const R = W / 2, cx = w / 2, noteY = h - M - 20 * s, free = noteY - y - (R + 9 * s), cy = y + Math.max(0, free / 2) + R, rr = [0.2, 0.41, 0.63, 1].map(f => f * R);
      const role = { 1: ["vader", "moeder"], 2: ["opa", "oma", "opa", "oma"] };
      for (let k = 1; k < 4; k++) { const n = 2 ** k; for (let j = 0; j < n; j++) {
        const a0 = Math.PI - j * Math.PI / n, a1 = Math.PI - (j + 1) * Math.PI / n, am = (a0 + a1) / 2;
        const p = k === 3 ? gg[j] : null, c = k === 3 ? col(8 + j) : rule;
        g += `<path d="${sector(cx, cy, rr[k - 1], rr[k], a0, a1)}" fill="${k === 3 ? c : paper}" fill-opacity="${k === 3 ? 0.16 : 1}" stroke="${k === 3 ? c : muted}" stroke-width="${(0.4 * s).toFixed(2)}"/>`;
        if (k < 3) { /* a small role word on the inner edge; the box itself stays empty */
          const rx = rr[k - 1] + 2.6 * s, x = cx + rx * Math.cos(am), yy = cy - rx * Math.sin(am);
          g += radial(x, yy, am, [role[k][j]], SANS, 7.5, faint, "start"); }
        else if (p) { /* a deceased great-grandparent: call name, surname, years, written along the radius */
          const nm = shortName(p), rm = (rr[2] + rr[3]) / 2, x = cx + rm * Math.cos(am), yy = cy - rm * Math.sin(am), len = (rr[3] - rr[2]) * 0.86;
          const parts = [nm.first, nm.sur, yearsOf(p).replace(/^geboren |^overleden /, "")].filter(Boolean).map((t, i) => pf.fit(t, i === 2 ? MONO : i === 0 ? SANS_M : SANS, (i === 2 ? 7 : 8.5) * s, len, Math.max(minPt, 6.5) * s));
          g += radialParts(x, yy, am, parts, [i => i === 0 ? SANS_M : SANS, MONO]); }
      } }
      g += `<path d="${sector(cx, cy, 0, rr[0], Math.PI, 0)}" fill="${paper}" stroke="${ink}" stroke-width="${(0.5 * s).toFixed(2)}"/>` + text(cx, cy - rr[0] * 0.38, "ik", SERIF_I, 11, muted, "middle");
      g += `<line x1="${(cx - R).toFixed(2)}" x2="${(cx + R).toFixed(2)}" y1="${cy.toFixed(2)}" y2="${cy.toFixed(2)}" stroke="${muted}" stroke-width="${(0.4 * s).toFixed(2)}"/>`;
      /* the rings named under the base line */
      const lab = (t, r, side) => text(cx + side * (rr[r - 1] + rr[r]) / 2, cy + 5 * s, t, SANS, 7.5, muted, "middle");
      g += lab("ouders", 1, -1) + lab("opa's en oma's", 2, 1) + lab("overgrootouders", 3, -1);
      y = Math.max(cy + 14 * s, noteY);
      g += para(X0, y, "Een generatie is ongeveer 30 jaar. Vier ringen terug is zo'n 120 jaar geleden.", SERIF_I, 10.5, W, 3, muted).g;
      page("Mijn waaier", g);

      /* helpers for the fan (hoisted below) */ }

    /* ---- 3. Mijn familie in een lijst ---- */
    { let g = title("Mijn familie in een lijst").g, y = M + 18 * s;
      const r = para(X0, y, "Schrijf de namen op die je weet. Je overgrootouders staan er al, als ze niet meer leven.", SANS, 10.5, W, 3); g += r.g; y = r.y + 4 * s;
      const group = (head, n, fill) => { g += text(X0, y + 4 * s, head, SANS_B, 10.5); y += 4 * s;
        for (let i = 0; i < n; i++) { const yy = y + (i + 1) * 9.4 * s, p = fill ? fill(i) : null;
          g += `<line x1="${X0.toFixed(2)}" x2="${(X0 + W).toFixed(2)}" y1="${yy.toFixed(2)}" y2="${yy.toFixed(2)}" stroke="${rule}" stroke-width="${(0.3 * s).toFixed(2)}"/>`;
          if (p) { const nm = shortName(p), t = fit(`${nm.first} ${nm.sur}`.trim(), SERIF, 11 * s, W * 0.66); g += text(X0 + 1 * s, yy - 1.6 * s, t.text, SERIF, t.pt / s) + text(X0 + W, yy - 1.6 * s, yearsOf(p), MONO, 8.5, muted, "end"); } }
        y += n * 9.4 * s + 5 * s; };
      group("Mijn ouders", 2); group("Mijn opa's en oma's", 4); group("Mijn overgrootouders", 8, i => gg[i]);
      page("Mijn familie in een lijst", g); }

    /* ---- 4–5. Vraag het aan opa of oma: five questions per page, each with at least three write-on lines ---- */
    { const Q = ["Waar ben je geboren, en hoe zag het huis eruit?", "Welke spelletjes deed je als kind?", "Hoe ging je naar school, en hoe ver was dat?",
        "Wat at je het liefst?", "Wat voor werk deden jouw vader en moeder?", "Hoe heetten jouw opa's en oma's? Heb je ze gekend?",
        "Wat was het mooiste feest dat je meemaakte?", "Welk verhaal vertelden ze vroeger thuis vaak?", "Wat is er nu heel anders dan toen jij klein was?", "Wat wil je dat ik later nog weet?"];
      const gap = 9 * s; /* the write-on lines: 9 mm apart */
      [["Vraag het aan opa of oma", 0], ["Nog meer vragen", 5]].forEach(([head, from]) => {
        let g = title(head).g, y = M + 14 * s;
        const qs = Q.slice(from, from + 5), room = (h - M - 5 * s - y) / qs.length, n = Math.max(3, Math.floor((room - 6 * s) / gap));
        qs.forEach((q, i) => { const t = fit(`${from + i + 1}. ${q}`, SANS_M, 10 * s, W, 9 * s); g += text(X0, y + 4.5 * s, t.text, SANS_M, t.pt / s);
          g += lines(X0, y + 5 * s, W, n, gap).g; y += room; });
        page(head, g); }); }

    /* ---- 6. Mijn opa's en oma's ---- */
    { let g = title("Mijn opa's en oma's").g;
      const heads = ["Vaders vader", "Vaders moeder", "Moeders vader", "Moeders moeder"], gx = 5 * s, gy = 5 * s, top = M + 18 * s;
      const bw = (W - gx) / 2, bh = (h - M - 8 * s - top - gy) / 2;
      heads.forEach((hd, i) => { const x = X0 + (i % 2) * (bw + gx), y = top + Math.floor(i / 2) * (bh + gy), c = col(8 + 2 * i);
        g += box(x, y, bw, bh, "none", c, 0.5, 3) + `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(3 * s).toFixed(2)}" height="${bh.toFixed(2)}" rx="${(1.5 * s).toFixed(2)}" fill="${c}"/>`;
        g += text(x + 6 * s, y + 7 * s, hd, SANS_B, 10, ink);
        const fw = bw - 9 * s; let yy = y + 15 * s;
        ["Naam", "Geboren in", "Werk"].forEach(l => { g += field(x + 6 * s, yy, l, fw); yy += 10 * s; });
        const ph = y + bh - yy - 3 * s;
        if (ph > 14 * s) g += box(x + 6 * s, yy - 4 * s, fw, ph, "none", rule, 0.3, 2) + text(x + 6 * s + fw / 2, yy - 4 * s + ph / 2, "Plak hier een foto", SANS, 8, faint, "middle") + text(x + 6 * s + fw / 2, yy - 4 * s + ph / 2 + 4 * s, "of maak een tekening", SANS, 8, faint, "middle");
      });
      page("Mijn opa's en oma's", g); }

    /* ---- 7–10. Vier families ---- */
    families.forEach(fam => {
      const c = col(fam.line); let g = "";
      g += `<rect x="${X0.toFixed(2)}" y="${(M + 2 * s).toFixed(2)}" width="${(6 * s).toFixed(2)}" height="${(10 * s).toFixed(2)}" rx="${(1 * s).toFixed(2)}" fill="${c}"/>`;
      if (fam.name) { const t = fit("De familie " + fam.name, DISPLAY, 22 * s, W - 9 * s, 14 * s); g += text(X0 + 9 * s, M + 10 * s, t.text, DISPLAY, t.pt / s); }
      else { g += text(X0 + 9 * s, M + 10 * s, "De familie", DISPLAY, 22) + `<line x1="${(X0 + 9 * s + pf.measure("De familie", DISPLAY, 22 * s) + 3 * s).toFixed(2)}" x2="${(X0 + W).toFixed(2)}" y1="${(M + 10.8 * s).toFixed(2)}" y2="${(M + 10.8 * s).toFixed(2)}" stroke="${rule}" stroke-width="${(0.3 * s).toFixed(2)}"/>`; }
      let y = M + 18 * s;
      if (fam.fact) { const p = fam.fact.p, nm = shortName(p);
        g += text(X0, y + 3.5 * s, "Uit de stamboom", SANS_B, 9, c); y += 6 * s;
        g += text(X0, y + 3.5 * s, `${nm.first} ${nm.sur}${yearsOf(p) ? " (" + yearsOf(p) + ")" : ""}`.trim(), SANS_M, 10); y += 5.5 * s;
        const r = para(X0, y, plain(fam.fact.f.text), SERIF, 10.5, W, 9); g += r.g; y = r.y + 1.5 * s;
        if (fam.fact.source) { const sr = para(X0, y, fam.fact.source, SANS, 7.5, W, 2, faint, 1.3, Math.max(minPt, 7)); g += sr.g; y = sr.y; }
        y += 5 * s; }
      else { g += para(X0, y, "Wat weet jij over deze familie? Vraag het na en schrijf het op.", SANS, 10.5, W, 2).g; const l = lines(X0, y + 6 * s, W, 3); g += l.g; y = l.y + 5 * s; }
      /* where they lived: a small map with a dot per village */
      g += text(X0, y + 4 * s, "Waar woonde deze familie?", SANS_B, 10.5); y += 7 * s;
      const qh = 4 * LINE_GAP * s + 9 * s, mh = Math.max(30 * s, Math.min(95 * s, h - M - 8 * s - qh - y));
      g += miniMap(fam.places, X0, y, W, mh, c); y += mh + 7 * s;
      g += text(X0, y + 2 * s, "Wat zou jij hen willen vragen?", SANS_B, 10.5);
      g += lines(X0, y + 1 * s, W, 4).g;
      page(fam.name ? "De familie " + fam.name : "Een familie", g);
    });

    /* ---- 11. Toen en nu ---- */
    { let g = title("Toen en nu").g, y = M + 17 * s;
      const r = para(X0, y, "Bedenk samen hoe het toen ging. Kijk ook bij Hun tijd op de site.", SANS, 10.5, W, 3); g += r.g; y = r.y + 4 * s;
      const rows = ["Licht in huis", "Naar school", "Water", "Reizen", "Spelen"], lw = 26 * s, cw = (W - lw) / 2, hh = 9 * s, rh = (h - M - 8 * s - y - hh) / rows.length;
      g += text(X0 + lw + cw / 2, y + 6 * s, oldest ? `Toen (${oldest})` : "Toen", SANS_B, 10.5, ink, "middle") + text(X0 + lw + cw * 1.5, y + 6 * s, "Nu", SANS_B, 10.5, ink, "middle");
      rows.forEach((rw, i) => { const yy = y + hh + i * rh;
        g += `<line x1="${X0.toFixed(2)}" x2="${(X0 + W).toFixed(2)}" y1="${yy.toFixed(2)}" y2="${yy.toFixed(2)}" stroke="${rule}" stroke-width="${(0.35 * s).toFixed(2)}"/>`;
        g += para(X0, yy + 2.5 * s, rw, SANS_M, 10, lw - 2 * s, 2).g; });
      const yb = y + hh + rows.length * rh;
      g += `<line x1="${X0.toFixed(2)}" x2="${(X0 + W).toFixed(2)}" y1="${yb.toFixed(2)}" y2="${yb.toFixed(2)}" stroke="${rule}" stroke-width="${(0.35 * s).toFixed(2)}"/>`;
      [X0 + lw, X0 + lw + cw].forEach(x => { g += `<line x1="${x.toFixed(2)}" x2="${x.toFixed(2)}" y1="${y.toFixed(2)}" y2="${yb.toFixed(2)}" stroke="${rule}" stroke-width="${(0.35 * s).toFixed(2)}"/>`; });
      page("Toen en nu", g); }

    /* ---- 12. Woorden ---- */
    { let g = title("Woorden").g, y = M + 19 * s;
      const words = [["Voorouder", "iemand van wie je afstamt: je ouders, je opa's en oma's, en hun ouders, steeds verder terug."],
        ["Generatie", "alle mensen die even ver terug staan, zoals al je opa's en oma's."], ["Stamboom", "een overzicht van je familie, met wie bij wie hoort."],
        ["Akte", "een papier van de gemeente of de kerk waarin staat dat iemand geboren is, trouwde of overleed."],
        ["Achternaam", "in Friesland kregen veel mensen pas in 1811 een vaste achternaam. Daarvoor heette je naar je vader: Jan Pieters was Jan, de zoon van Pieter."]];
      words.forEach(([wd, d]) => { g += text(X0, y + 5 * s, wd, SANS_B, 12.5, accent); y += 7.5 * s; const r = para(X0, y, d, SERIF, 12, W, 5); g += r.g; y = r.y + 9 * s; });
      page("Woorden", g); }

    /* ---- inside back: Mijn eigen ontdekking ---- */
    { let g = title("Mijn eigen ontdekking").g, y = M + 17 * s;
      g += text(X0, y + 4 * s, "Wat heb jij ontdekt over je familie?", SANS_M, 10.5); y += 6 * s;
      const n = Math.floor((h - M - 26 * s - y) / (LINE_GAP * s)); g += lines(X0, y, W, n).g;
      g += para(X0, h - M - 17 * s, "Vraag het na, en schrijf erbij wie het je vertelde. Dat is jouw bron.", SERIF_I, 10.5, W, 2, muted).g;
      page("Mijn eigen ontdekking", g, false); }

    /* ---- back cover ---- */
    { let g = "";
      const r = para(X0 + 6 * s, h * 0.36, "Elke voorouder had ook een opa en oma. Hoe ver kom jij terug?", DISPLAY, 18, W - 12 * s, 4, ink, 1.25, 14);
      g += r.g;
      const bw = (W - 12 * s) / 8; for (let j = 0; j < 8; j++) g += `<rect x="${(X0 + 6 * s + j * bw).toFixed(2)}" y="${(r.y + 8 * s).toFixed(2)}" width="${(bw - 1 * s).toFixed(2)}" height="${(2.2 * s).toFixed(2)}" rx="${(0.6 * s).toFixed(2)}" fill="${col(8 + j)}"/>`;
      if (url) g += text(w / 2, h - M - 6 * s, url, MONO, 9, muted, "middle");
      page("Achterkant", g, false); }

    return { pages, fonts: FONTS, imagesUsed: [], title: voor.length ? `Mijn voorouders, voor ${voor.join(" en ")}` : "Mijn voorouders",
      stats: { pages: pages.length, prefilled: gg.filter(Boolean).length, facts: families.filter(f => f.fact).length, families: families.filter(f => f.name).length } };

    /* ---- drawing helpers (function declarations: available above) ---- */
    /* a ring sector between radii r0 and r1 and angles a0 > a1 (radians, counter-clockwise from the right), the fan opening upwards */
    function sector(cx, cy, r0, r1, a0, a1) {
      const P2 = (r, a) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy - r * Math.sin(a)).toFixed(2)}`, large = a0 - a1 > Math.PI ? 1 : 0;
      if (r0 <= 0) return `M${cx.toFixed(2)} ${cy.toFixed(2)}L${P2(r1, a0)}A${r1.toFixed(2)} ${r1.toFixed(2)} 0 ${large} 1 ${P2(r1, a1)}Z`;
      return `M${P2(r0, a0)}L${P2(r1, a0)}A${r1.toFixed(2)} ${r1.toFixed(2)} 0 ${large} 1 ${P2(r1, a1)}L${P2(r0, a1)}A${r0.toFixed(2)} ${r0.toFixed(2)} 0 ${large} 0 ${P2(r0, a0)}Z`;
    }
    /* the rotation that writes along the radius and stays readable: outwards on the right half, inwards on the left half */
    function radAngle(a) { const d = a * 180 / Math.PI; return d > 90 ? 180 - d : -d; }
    function radial(x, y, a, ts, font, pt, fill, anchor = "middle") {
      const rot = radAngle(a), out = a * 180 / Math.PI > 90 ? "end" : "start", an = anchor === "start" ? out : anchor;
      return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)})">` + ts.map((t, i) => text(0, (i + 0.35) * pt * PT * s, t, font, pt, fill, an)).join("") + `</g>`;
    }
    /* name lines along the radius, centred on the point: [{ text, pt }] from pf.fit */
    function radialParts(x, y, a, parts) {
      const rot = radAngle(a), lh = 1.18, total = parts.reduce((t, p) => t + p.pt * PT * lh, 0);
      let yy = -total / 2, g = `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)})">`;
      parts.forEach((p, i) => { yy += p.pt * PT * lh; const f = i === 2 ? MONO : i === 0 ? SANS_M : SANS;
        g += `<text x="0" y="${(yy - p.pt * PT * 0.28).toFixed(2)}" text-anchor="middle" style="font-family:'${f.family}';font-weight:${f.weight};font-style:normal" font-size="${(p.pt * PT).toFixed(3)}" fill="${i === 2 ? muted : ink}">${esc(p.text)}</text>`; });
      return g + `</g>`;
    }
    /* a small map: the coast and the dots of the villages, with the names that fit (largest first, at most six) */
    function miniMap(places, x, y, mw, mh, c) {
      let g = box(x, y, mw, mh, pal.land || "#efece4", rule, 0.35, 2);
      if (!places.length) return g + text(x + mw / 2, y + mh / 2 + 1.5 * s, "Teken hier zelf een kaartje", SANS, 9, faint, "middle");
      const base = data.mapBase || {}, KX = Math.cos(53 * Math.PI / 180), pts = places.slice(0, 24);
      let la0 = Math.min(...pts.map(p => p.la)), la1 = Math.max(...pts.map(p => p.la)), lo0 = Math.min(...pts.map(p => p.lo)), lo1 = Math.max(...pts.map(p => p.lo));
      const padLa = Math.max(0.08, (la1 - la0) * 0.2), padLo = Math.max(0.12, (lo1 - lo0) * 0.2); la0 -= padLa; la1 += padLa; lo0 -= padLo; lo1 += padLo;
      let gw = (lo1 - lo0) * KX, gh = la1 - la0;
      if (gw / gh > mw / mh) { const nh = gw * mh / mw, d = (nh - gh) / 2; la0 -= d; la1 += d; gh = nh; } else { const nw = gh * mw / mh, d = (nw - gw) / 2 / KX; lo0 -= d; lo1 += d; gw = nw; }
      const k = mw / gw, X = lo => x + (lo - lo0) * KX * k, Y = la => y + (la1 - la) * k, id = "mm" + pages.length;
      g += `<defs><clipPath id="${id}"><rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${mw.toFixed(2)}" height="${mh.toFixed(2)}" rx="${(2 * s).toFixed(2)}"/></clipPath></defs><g clip-path="url(#${id})">`;
      if (base.water && base.water.length > 2) { /* smoothed with quadratic curves through the midpoints, as on the map poster */
        const Q = base.water.map(p => [X(p[1]), Y(p[0])]), f = v => v.toFixed(2), mid = (a, c) => [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2], n = Q.length, m0 = mid(Q[n - 1], Q[0]);
        let d = "M" + f(m0[0]) + " " + f(m0[1]); for (let i = 0; i < n; i++) { const m2 = mid(Q[i], Q[(i + 1) % n]); d += "Q" + f(Q[i][0]) + " " + f(Q[i][1]) + " " + f(m2[0]) + " " + f(m2[1]); }
        g += `<path d="${d}Z" fill="${pal.water || "#d5e3ea"}"/>`; }
      const placed = [];
      pts.forEach(p => { const r = (1.1 + 0.55 * Math.sqrt(p.people.size)) * s, px = X(p.lo), py = Y(p.la); placed.push([px - r, py - r, px + r, py + r]);
        g += `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${r.toFixed(2)}" fill="${c}" fill-opacity="0.9" stroke="${paper}" stroke-width="${(0.3 * s).toFixed(2)}"/>`; });
      let named = 0; const lpt = 8;
      pts.forEach(p => { if (named >= 6) return; const px = X(p.lo), py = Y(p.la), r = (1.1 + 0.55 * Math.sqrt(p.people.size)) * s, tw = pf.measure(p.name, SANS, lpt * s), th = lpt * PT * s;
        for (const [lx, ly] of [[px + r + 1 * s, py + th * 0.35], [px - r - 1 * s - tw, py + th * 0.35], [px - tw / 2, py - r - 1 * s], [px - tw / 2, py + r + 1 * s + th * 0.8]]) {
          const bx = [lx - 0.4 * s, ly - th * 0.85, lx + tw + 0.4 * s, ly + th * 0.25];
          if (bx[0] < x + 1 * s || bx[2] > x + mw - 1 * s || bx[1] < y + 1 * s || bx[3] > y + mh - 1 * s) continue;
          if (placed.some(q => bx[0] < q[2] && q[0] < bx[2] && bx[1] < q[3] && q[1] < bx[3])) continue;
          placed.push(bx); named++;
          g += `<rect x="${(lx - 0.5 * s).toFixed(2)}" y="${(ly - th * 0.82).toFixed(2)}" width="${(tw + 1 * s).toFixed(2)}" height="${(th * 1.04).toFixed(2)}" rx="${(0.5 * s).toFixed(2)}" fill="${paper}" fill-opacity="0.75"/>` + text(lx, ly, p.name, SANS, lpt, ink);
          break; } });
      return g + `</g>`;
    }
  }
  (P.renderers = P.renderers || {}).fillin = { render, advise: () => ({}) };
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
