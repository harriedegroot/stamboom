/* Renderer "map": where the ancestors lived, as a poster. One dot per place, as large as the number of ancestors who were born,
   married, lived or died there, in the colour of the family with the most people there; the place names that fit (at least the
   product's minimum size), a legend of the families, title and source. Pure: returns an SVG string in mm, measures text through
   ctx.platform, takes colours from ctx.palette (always the light print palette) and the coast and borders from data.mapBase.
   Options: start (a person or couple: only their ancestors), line (only one family line, 0 = all), labels (place names on or off). */
(function (P) {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const yr = s => { const m = String(s || "").match(/\d{4}/); return m ? +m[0] : null; };
  const SANS = { family: "IBM Plex Sans", weight: 400 }, SANS_B = { family: "IBM Plex Sans", weight: 600 }, TITLE = { family: "Libre Caslon Display", weight: 400 };
  const PT = 25.4 / 72;

  /* places with the people who were there: { key, la, lo, name, people: Set(kw), lines: { line: n } } */
  function placesOf(data, line, members) {
    const out = new Map(), pl = data.places || {};
    /* a municipality (gemeente) is not a place on the map: its events are not counted at the main town either, as on the site */
    const add = (k, p) => { const q = k && pl[k], key = k; if (!q || q.seat || q.kind === "gemeente" || q.la == null || q.lo == null) return;
      const a = out.get(key) || { key, la: q.la, lo: q.lo, name: q.name || key, people: new Set(), lines: {} };
      if (!a.people.has(p.kw)) { a.people.add(p.kw); a.lines[p.line] = (a.lines[p.line] || 0) + 1; } out.set(key, a); };
    data.people.filter(p => !p.living && (!line || p.line === line) && (!members || members.has(p.kw))).forEach(p => {
      add(p.bp, p); add(p.dp, p); if (p.m) add(p.m.p, p); (p.res || []).forEach(r => add(r.p, p)); });
    return [...out.values()];
  }
  function advise() { return {}; }
  function render(data, o, ctx) {
    const { w, h } = ctx.size, b = ctx.bleed || 0, pf = ctx.platform, pal = ctx.palette || {}, min = ctx.product.minPt || 6;
    const s = Math.min(w, h) / 420;                                   /* 1 at A2 */
    const M = Math.max(12, 22 * s), titlePt = 54 * s, subPt = 15 * s, labelPt = Math.max(min + 1, 9 * s), legPt = Math.max(min + 1, 11 * s);
    const line = +o.line || 0, st = P.startOf(o.start), members = st.rootKw === 1 && !st.pair ? null : P.startMembers(data, o.start);
    const all = placesOf(data, line, members).sort((a, b2) => b2.people.size - a.people.size);
    /* far places (a few, with few people) do not stretch the map: they go into a line "Verder weg" below it */
    const KX0 = Math.cos(53 * Math.PI / 180), wsum = all.reduce((a, p) => a + p.people.size, 0) || 1;
    const cla = all.reduce((a, p) => a + p.la * p.people.size, 0) / wsum, clo = all.reduce((a, p) => a + p.lo * p.people.size, 0) / wsum;
    const dist = p => Math.hypot(p.la - cla, (p.lo - clo) * KX0), ds = all.map(dist).sort((a, b2) => a - b2), q85 = ds[Math.floor(ds.length * 0.85)] || 0;
    let far = all.filter(p => dist(p) > 1.6 * q85 && p.people.size <= 3);
    if (far.length > 10 || far.length >= all.length / 4) far = [];
    const places = all.filter(p => !far.includes(p));
    const base = data.mapBase || {}, B = base.bounds || { lo0: 4.6, lo1: 7.3, la0: 51.9, la1: 53.6 };
    const KX = Math.cos(((B.la0 + B.la1) / 2) * Math.PI / 180);
    /* title (one or two lines) and subtitle; the map frame comes below them */
    /* o.family: the start is a family (Harrie: a couple or the whole tree, not chosen as a person) → "de families De Groot · Boersma" */
    const who = line && data.lines && data.lines[line] ? "de familie " + data.lines[line].name : o.family ? "de families " + o.family : "de voorouders van " + P.startName(data, o.start);
    const title = pf.wrap("Waar " + who + " woonden", TITLE, titlePt, w - 2 * M, 2, Math.max(min, titlePt * 0.6)), tLh = title.pt * PT * 1.12;
    const subY = M + title.pt * PT + (title.lines.length - 1) * tLh + subPt * PT * 1.6;
    const top = subY + subPt * PT * 1.2, foot = legPt * PT * 7;
    const fx = M, fy = top, fw = w - 2 * M, fh = h - top - M - foot;
    /* the area to show: around the places, with room, in the proportion of the frame */
    const las = places.map(p => p.la), los = places.map(p => p.lo);
    let la0 = Math.min(...las), la1 = Math.max(...las), lo0 = Math.min(...los), lo1 = Math.max(...los);
    const padLa = Math.max(0.06, (la1 - la0) * 0.12), padLo = Math.max(0.08, (lo1 - lo0) * 0.12);
    la0 -= padLa; la1 += padLa; lo0 -= padLo; lo1 += padLo;
    let gw = (lo1 - lo0) * KX, gh = la1 - la0;
    if (gw / gh > fw / fh) { const nh = gw * fh / fw, d = (nh - gh) / 2; la0 -= d; la1 += d; gh = nh; } else { const nw = gh * fw / fh, d = (nw - gw) / 2 / KX; lo0 -= d; lo1 += d; gw = nw; }
    const k = fw / gw, X = lo => fx + (lo - lo0) * KX * k, Y = la => fy + (la1 - la) * k;
    /* coast and borders: smoothed with quadratic curves through the midpoints (the data are coarse corner points) */
    const path = (pts, close) => { const P2 = pts.map(p => [X(p[1]), Y(p[0])]), f = v => v.toFixed(2); if (P2.length < 3) return P2.map((p, i) => (i ? "L" : "M") + f(p[0]) + " " + f(p[1])).join("");
      const mid = (a, c) => [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
      if (!close) { let d = "M" + f(P2[0][0]) + " " + f(P2[0][1]); for (let i = 1; i < P2.length - 1; i++) { const m2 = mid(P2[i], P2[i + 1]); d += "Q" + f(P2[i][0]) + " " + f(P2[i][1]) + " " + f(m2[0]) + " " + f(m2[1]); } return d + "L" + f(P2[P2.length - 1][0]) + " " + f(P2[P2.length - 1][1]); }
      const n = P2.length, m0 = mid(P2[n - 1], P2[0]); let d = "M" + f(m0[0]) + " " + f(m0[1]);
      for (let i = 0; i < n; i++) { const m2 = mid(P2[i], P2[(i + 1) % n]); d += "Q" + f(P2[i][0]) + " " + f(P2[i][1]) + " " + f(m2[0]) + " " + f(m2[1]); } return d + "Z"; };
    const col = l => pal["l" + l] || pal.accent || "#555";
    let g = "";
    /* ground, water, borders (clipped to the frame) */
    g += `<defs><clipPath id="mapFrame"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}"/></clipPath></defs>`;
    g += `<g clip-path="url(#mapFrame)"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${pal.land || "#efece4"}"/>`;
    if (base.water) g += `<path d="${path(base.water, true)}" fill="${pal.water || "#d5e3ea"}"/>`;
    (base.borders || []).forEach(bd => { g += `<path d="${path(bd)}" fill="none" stroke="${pal.faint || "#9aa"}" stroke-width="${(0.5 * s).toFixed(2)}" stroke-dasharray="${(2 * s).toFixed(2)} ${(1.6 * s).toFixed(2)}"/>`; });
    g += `</g><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="none" stroke="${pal.rule || "#cfcac0"}" stroke-width="${(0.4 * s).toFixed(2)}"/>`;
    /* dots, largest first so small ones stay visible on top */
    const rOf = n => (1.1 + 0.85 * Math.sqrt(n)) * s, placed = [];
    const dots = places.map(p => { const x = X(p.lo), y = Y(p.la), r = rOf(p.people.size), dom = +Object.entries(p.lines).sort((a, c) => c[1] - a[1])[0][0];
      placed.push([x - r, y - r, x + r, y + r]); return { p, x, y, r, dom }; });
    [...dots].sort((a, c) => c.r - a.r).forEach(d => { g += `<circle cx="${d.x.toFixed(2)}" cy="${d.y.toFixed(2)}" r="${d.r.toFixed(2)}" fill="${col(d.dom)}" fill-opacity="0.88" stroke="${pal.paper || "#fff"}" stroke-width="${(0.35 * s).toFixed(2)}"/>`; });
    /* place names: most people first; right, left, above or below the dot; only where they fit */
    let named = 0;
    if (o.labels !== false) dots.forEach(d => {
      const tw = pf.measure(d.p.name, SANS, labelPt), th = labelPt * PT, gap = 0.8 * s;
      const dg = d.r * 0.72 + gap;
      const tries = [[d.x + d.r + gap, d.y + th * 0.35, "start"], [d.x - d.r - gap - tw, d.y + th * 0.35, "end"], [d.x - tw / 2, d.y - d.r - gap, "middle"], [d.x - tw / 2, d.y + d.r + gap + th * 0.8, "middle"],
        [d.x + dg, d.y - dg, "start"], [d.x + dg, d.y + dg + th * 0.7, "start"], [d.x - dg - tw, d.y - dg, "end"], [d.x - dg - tw, d.y + dg + th * 0.7, "end"]];
      for (const [lx, ly, anchor] of tries) {
        const box = [lx - 0.4, ly - th * 0.85, lx + tw + 0.4, ly + th * 0.25];
        if (box[0] < fx || box[2] > fx + fw || box[1] < fy || box[3] > fy + fh) continue;
        if (placed.some(q => box[0] < q[2] && q[0] < box[2] && box[1] < q[3] && q[1] < box[3])) continue;
        placed.push(box); named++;
        const ax = anchor === "start" ? lx : anchor === "end" ? lx + tw : lx + tw / 2;
        /* no stroke around the letters (stroked text becomes a Type 3 font in a pdf): a soft paper box behind the name */
        g += `<rect x="${(lx - 0.5 * s).toFixed(2)}" y="${(ly - th * 0.82).toFixed(2)}" width="${(tw + s).toFixed(2)}" height="${(th * 1.04).toFixed(2)}" rx="${(0.6 * s).toFixed(2)}" fill="${pal.paper || "#fff"}" fill-opacity="0.72"/>`
          + `<text x="${ax.toFixed(2)}" y="${ly.toFixed(2)}" text-anchor="${anchor}" style="font-family:'IBM Plex Sans';font-weight:400" font-size="${(labelPt * PT).toFixed(2)}" fill="${pal.ink || "#1a1c1b"}">${esc(d.p.name)}</text>`;
        break;
      }
    });
    /* title and subtitle */
    const allP = new Set(all.flatMap(p => [...p.people]));
    const strict = data.people.filter(p => allP.has(p.kw) && (p.st === "A" || p.st === "B")).flatMap(p => [p.b, p.d, p.m && p.m.d]).filter(d => d && !/ca\.|~|\bof\b|vóór|na |tussen/.test(String(d))).map(yr).filter(Boolean);
    const from = !members && data.yearFrom ? data.yearFrom : strict.length ? Math.min(...strict) : null, to = yr(data.asOf) || null;
    const sub = `${all.length} plaatsen · ${allP.size} voorouders${from ? ` · ${from} – ${to || "heden"}` : ""} · elke stip is een plaats; hoe groter, hoe meer voorouders`;
    title.lines.forEach((t, i) => { g += `<text x="${w / 2}" y="${(M + title.pt * PT + i * tLh).toFixed(2)}" text-anchor="middle" style="font-family:'Libre Caslon Display'" font-size="${(title.pt * PT).toFixed(2)}" fill="${pal.ink || "#1a1c1b"}">${esc(t)}</text>`; });
    const subFit = pf.fit(sub, SANS, subPt, w - 2 * M, min);
    g += `<text x="${w / 2}" y="${subY.toFixed(2)}" text-anchor="middle" style="font-family:'IBM Plex Sans'" font-size="${(subFit.pt * PT).toFixed(2)}" fill="${pal.muted || "#5a605d"}">${esc(subFit.text)}</text>`;
    /* legend: the families that have a dot, in their colour */
    const lines = [...new Set(dots.map(d => d.dom))].filter(l => data.lines && data.lines[l]).sort((a, c) => a - c);
    let lx = M, ly = h - M - foot + legPt * PT * 2.2; const sw = legPt * PT * 0.8;
    lines.forEach(l => { const name = data.lines[l].name, tw = pf.measure(name, SANS, legPt) + sw * 2.4;
      if (lx + tw > w - M) { lx = M; ly += legPt * PT * 1.7; }
      g += `<circle cx="${(lx + sw / 2).toFixed(2)}" cy="${(ly - sw * 0.35).toFixed(2)}" r="${(sw / 2).toFixed(2)}" fill="${col(l)}"/><text x="${(lx + sw * 1.3).toFixed(2)}" y="${ly.toFixed(2)}" style="font-family:'IBM Plex Sans'" font-size="${(legPt * PT).toFixed(2)}" fill="${pal.ink || "#1a1c1b"}">${esc(name)}</text>`;
      lx += tw + legPt * PT; });
    if (far.length) { const t = pf.fit("Verder weg: " + far.map(p => p.name).join(", "), SANS, legPt, w - 2 * M, min);
      g += `<text x="${M}" y="${(ly + legPt * PT * 2).toFixed(2)}" style="font-family:'IBM Plex Sans'" font-size="${(t.pt * PT).toFixed(2)}" fill="${pal.muted || "#5a605d"}">${esc(t.text)}</text>`; }
    const src = pf.fit(`Plaatsen uit de akten en registers; bij elke voorouder staan de bronnen op ${data.url || ""}`, SANS, Math.max(min, legPt * 0.8), (w - 2 * M) * 0.75, min);
    g += `<text x="${M}" y="${(h - M).toFixed(2)}" style="font-family:'IBM Plex Sans'" font-size="${(src.pt * PT).toFixed(2)}" fill="${pal.muted || "#5a605d"}">${esc(src.text)}</text>`;
    g += `<text x="${w - M}" y="${(h - M).toFixed(2)}" text-anchor="end" style="font-family:'IBM Plex Sans'" font-size="${(src.pt * PT).toFixed(2)}" fill="${pal.muted || "#5a605d"}">${esc(data.asOf ? "stand " + data.asOf : "")}</text>`;
    /* the sheet with bleed: background over the full size, content shifted by the bleed */
    const W = w + 2 * b, H = h + 2 * b;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${pal.paper || "#fff"}"/><g transform="translate(${b} ${b})">${g}</g></svg>`;
    return { pages: [{ name: "poster", svg }], fonts: ["IBM Plex Sans 400", "IBM Plex Sans 600", "Libre Caslon Display 400"], imagesUsed: [],
      title: title.lines.join(" "), stats: { places: places.length, named, people: allP.size } };
  }
  (P.renderers = P.renderers || {}).map = { advise, render, placesOf };
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
