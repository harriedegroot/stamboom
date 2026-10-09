/* Renderer "families": the series "De acht families" (product "canvas-families"), one sheet per family, all the same size, to hang
   side by side or to give one to each branch. Per sheet, from top to bottom:
   - "De acht families · 3 van 8", the family name large in its colour, the other names of the line and the region;
   - the opening of the family's story (whole sentences that fit, never cut off);
   - a map of the villages where this family lived (vector, sharp at every size), and on it, framed like a plate, an old print or
     photograph of one of those villages, only as large as it stays sharp (product minDpi), with its caption and credit;
   - the stem line as a narrow bar: from the oldest known ancestor of the line to the youngest, each generation a segment.
   Pure: SVG strings in mm (with bleed), text measured through ctx.platform, colours from ctx.palette, coast and borders from
   data.mapBase, images and credits from data.images (already filtered for privacy and licence by the core). Deceased only.
   Options: start (a person or couple: only the families of their ancestors). */
(function (P) {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const yr = s => { const m = String(s || "").match(/\d{4}/); return m ? +m[0] : null; };
  const PT = 25.4 / 72;
  const SANS = { family: "IBM Plex Sans", weight: 400 }, SANS_B = { family: "IBM Plex Sans", weight: 600 }, MONO = { family: "IBM Plex Mono", weight: 400 };
  const DISPLAY = { family: "Libre Caslon Display", weight: 400 }, TEXT = { family: "Libre Caslon Text", weight: 400 }, TEXT_I = { family: "Libre Caslon Text", weight: 400, style: "italic" };
  const LINE_KEYS = [8, 9, 10, 11, 12, 13, 14, 15], MIN_PEOPLE = 3;
  const plain = s => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  /* "Ype Douwes Jongma" → "Ype Jongma"; a prefix stays with the surname */
  const shortName = n => { const w = String(n || "").replace(/\(.*?\)/g, "").trim().split(/\s+/); if (w.length <= 2) return w.join(" ");
    let i = w.findIndex((x, k) => k > 0 && /^(de|van|der|den|ten|ter|te)$/i.test(x)); if (i < 0) i = w.length - 1; return [w[0], ...w.slice(i)].join(" "); };

  /* the families of this start: per line its deceased members, places (with how many of them), stem line and a picture */
  function familiesOf(data, o) {
    const st = P.startOf ? P.startOf(o.start) : { rootKw: 1, pair: false }, members = st.rootKw === 1 && !st.pair ? null : P.startMembers(data, o.start);
    const by = new Map(data.people.map(p => [p.kw, p])), al = data.aliases || {}, res = k => al[k] || k, pl = data.places || {};
    return LINE_KEYS.filter(l => data.lines && data.lines[l]).map(l => {
      const ppl = data.people.filter(p => p.line === l && !p.living && (!members || members.has(p.kw)));
      if (ppl.length < MIN_PEOPLE) return null;
      const places = new Map();
      const add = (k, p) => { const q = k && pl[k]; if (!q || q.seat || q.kind === "gemeente" || q.la == null || q.lo == null) return;
        const a = places.get(k) || { key: k, la: q.la, lo: q.lo, name: q.name || k, people: new Set() }; a.people.add(p.kw); places.set(k, a); };
      ppl.forEach(p => { add(p.bp, p); add(p.dp, p); if (p.m) add(p.m.p, p); (p.res || []).forEach(r => add(r.p, p)); });
      /* the stem line: the line's own list, else along the fathers; deceased members only */
      const stemKws = (data.lines[l].stem && data.lines[l].stem.length ? data.lines[l].stem : (() => { const s = []; for (let k = l; k < 2 ** 20 && by.get(res(k)); k *= 2) s.push(k); return s; })());
      let stem = stemKws.map(k => by.get(res(k))).filter(p => p && !p.living && (!members || members.has(p.kw)));
      /* continue along the fathers past the end of the list, as far as the tree goes */
      for (let k = stemKws[stemKws.length - 1] * 2; stemKws.length && k < 2 ** 30; k *= 2) { const p = by.get(res(k)); if (!p || p.living) break; if (!stem.includes(p)) stem.push(p); }
      stem = stem.filter(p => yr(p.b) || yr(p.d) || (p.m && yr(p.m.d)));
      return { line: l, info: data.lines[l], people: ppl, places: [...places.values()].sort((a, b) => b.people.size - a.people.size), stem };
    }).filter(Boolean);
  }
  /* the picture of a family: an old print or photograph of one of its villages, the biggest it can be printed sharp first */
  const KIND_RANK = { historisch: 0, kerk: 1, plaats: 2, stadsplan: 3, kaart: 4 };
  function pictureOf(data, fam, taken, dpi) {
    const rank = new Map(fam.places.map((p, i) => [p.key, i]));
    const clipping = im => /krant|courant|nieuwsblad|advertentie|overlijdensbericht|delpher/i.test([im.id, im.t, im.sourceName, im.maker].join(" ")); /* a newspaper is not a picture of the village */
    return (data.images || []).filter(im => im.src && im.place && rank.has(im.place) && im.kind in KIND_RANK && !taken.has(im.id) && im.w && im.h && !clipping(im))
      .map(im => ({ im, mm: im.w / dpi * 25.4, score: im.w / dpi * 25.4 * (1 - 0.06 * KIND_RANK[im.kind]) * (1 - 0.02 * Math.min(rank.get(im.place), 10)) }))
      .sort((a, b) => b.score - a.score)[0] || null;
  }
  function advise() { return {}; }
  function render(data, o, ctx) {
    const { w, h } = ctx.size, b = ctx.bleed || 0, pf = ctx.platform, pal = ctx.palette || {}, min = (ctx.product && ctx.product.minPt) || 6;
    const dpi = (ctx.product && ctx.product.minDpi) || 150;
    const paper = pal.paper || "#fbf8f1", ink = pal.ink || "#1a1c1b", muted = pal.muted || "#5a605d", faint = pal.faint || "#5e6963", rule = pal.rule || "#cfcac0";
    const col = l => pal["l" + l] || pal.accent || "#1e4f74";
    const SAFE = 0.92, fit = (t, f, pt, mm, mn) => pf.fit(t, f, pt, mm * SAFE, mn), wrap = (t, f, pt, mm, n, mn) => pf.wrap(t, f, pt, mm * SAFE, n, mn);
    const text = (x, y, t, font, pt, fill, anchor, extra) => `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}"${anchor ? ` text-anchor="${anchor}"` : ""} style="font-family:'${font.family}';font-weight:${font.weight || 400};font-style:${font.style || "normal"}" font-size="${(pt * PT).toFixed(3)}" fill="${fill}"${extra || ""}>${esc(t)}</text>`;
    const u = Math.min(w, h) / 100, M = 8 * u, CW = w - 2 * M, ptU = u / PT; /* ptU: 1u in points */
    const fams = familiesOf(data, o), taken = new Set(), used = new Set(), pages = [], base = data.mapBase || {};
    const root = P.startName ? P.startName(data, o.start) : data.root || "";
    fams.forEach((f, fi) => {
      const c = col(f.line); let g = "", y = M;
      /* eyebrow */
      g += text(M, y + 2.6 * u * 0.8, `DE ACHT FAMILIES · ${fi + 1} VAN ${fams.length}`, SANS_B, Math.max(min, 2.4 * ptU), faint, null, ` letter-spacing="${(0.5 * u * 0.2).toFixed(2)}"`);
      y += 4.4 * u;
      /* the family name, as large as fits */
      const nm = fit(f.info.name, DISPLAY, 17 * ptU, CW, 8 * ptU); y += nm.pt * PT * 0.82; g += text(M, y, nm.text, DISPLAY, nm.pt, c); y += nm.pt * PT * 0.26 + 3.4 * u; /* below the descenders */
      const sub = [f.info.sub, f.info.region].filter(Boolean).join(" · ");
      if (sub) { const s2 = fit(sub, TEXT_I, 3.6 * ptU, CW, min); g += text(M, y, s2.text, TEXT_I, s2.pt, muted); y += 2.6 * u; }
      g += `<rect x="${M}" y="${y.toFixed(2)}" width="${(18 * u).toFixed(2)}" height="${(0.5 * u).toFixed(2)}" fill="${c}"/>`; y += 4.2 * u;
      /* the opening of the story: whole sentences, at most five lines */
      const sents = (plain(f.info.intro).match(/[^.!?]+[.!?]+(\s|$)/g) || []).map(s => s.trim()), introPt = 2.9 * ptU, lh = introPt * PT * 1.42;
      let intro = { lines: [] };
      for (let k = sents.length; k >= 1; k--) { const t = sents.slice(0, k).join(" "), r = wrap(t, TEXT, introPt, CW, 99, introPt); if (r.lines.length <= 5) { intro = r; break; } }
      intro.lines.forEach((l2, j) => { g += text(M, y + j * lh + introPt * PT * 0.8, l2, TEXT, intro.pt, ink); });
      y += intro.lines.length * lh + (intro.lines.length ? 3.2 * u : 0);
      /* bottom part first (stem line and footer), so the map gets the room in between */
      const footY = h - M, stemH = f.stem.length >= 2 ? 15 * u : 0, mapY = y, mapH = footY - 6 * u - stemH - mapY;
      /* ---- the map ---- */
      if (f.places.length && mapH > 30 * u) {
        const fx = M, fy = mapY, fw = CW, fh = mapH, KX = Math.cos(53 * Math.PI / 180);
        const pts = f.places.slice(0, 40), las = pts.map(p => p.la), los = pts.map(p => p.lo);
        let la0 = Math.min(...las), la1 = Math.max(...las), lo0 = Math.min(...los), lo1 = Math.max(...los);
        const padLa = Math.max(0.05, (la1 - la0) * 0.18), padLo = Math.max(0.07, (lo1 - lo0) * 0.18); la0 -= padLa; la1 += padLa; lo0 -= padLo; lo1 += padLo;
        let gw = (lo1 - lo0) * KX, gh = la1 - la0;
        if (gw / gh > fw / fh) { const nh = gw * fh / fw, d = (nh - gh) / 2; la0 -= d; la1 += d; gh = nh; } else { const nw = gh * fw / fh, d = (nw - gw) / 2 / KX; lo0 -= d; lo1 += d; gw = nw; }
        const k = fw / gw, X = lo => fx + (lo - lo0) * KX * k, Y = la => fy + (la1 - la) * k;
        const path = (ps, close) => { const Q = ps.map(p => [X(p[1]), Y(p[0])]), r2 = v => v.toFixed(2); if (Q.length < 3) return Q.map((p, i) => (i ? "L" : "M") + r2(p[0]) + " " + r2(p[1])).join("");
          const mid = (a, z) => [(a[0] + z[0]) / 2, (a[1] + z[1]) / 2];
          if (!close) { let d = "M" + r2(Q[0][0]) + " " + r2(Q[0][1]); for (let i = 1; i < Q.length - 1; i++) { const m2 = mid(Q[i], Q[i + 1]); d += "Q" + r2(Q[i][0]) + " " + r2(Q[i][1]) + " " + r2(m2[0]) + " " + r2(m2[1]); } return d + "L" + r2(Q[Q.length - 1][0]) + " " + r2(Q[Q.length - 1][1]); }
          const n = Q.length, m0 = mid(Q[n - 1], Q[0]); let d = "M" + r2(m0[0]) + " " + r2(m0[1]); for (let i = 0; i < n; i++) { const m2 = mid(Q[i], Q[(i + 1) % n]); d += "Q" + r2(Q[i][0]) + " " + r2(Q[i][1]) + " " + r2(m2[0]) + " " + r2(m2[1]); } return d + "Z"; };
        const cid = "fm" + f.line;
        g += `<defs><clipPath id="${cid}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="${u}"/></clipPath></defs><g clip-path="url(#${cid})"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${pal.land || "#efece4"}"/>`;
        if (base.water) g += `<path d="${path(base.water, true)}" fill="${pal.water || "#d5e3ea"}"/>`;
        (base.borders || []).forEach(bd => { g += `<path d="${path(bd)}" fill="none" stroke="${faint}" stroke-opacity="0.55" stroke-width="${(0.18 * u).toFixed(2)}" stroke-dasharray="${(0.8 * u).toFixed(2)} ${(0.6 * u).toFixed(2)}"/>`; });
        g += `</g><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="${u}" fill="none" stroke="${rule}" stroke-width="${(0.15 * u).toFixed(2)}"/>`;
        /* the plate: where on the map the fewest dots are, as large as it stays sharp (at most 46 % of the width) */
        const pic = pictureOf(data, f, taken, dpi), boxes = [];
        const dots = pts.map(p => ({ p, x: X(p.lo), y: Y(p.la), r: (0.55 + 0.42 * Math.sqrt(p.people.size)) * u }));
        if (pic) {
          const pad = 1.4 * u, capPt = Math.max(min, 1.9 * ptU), maxW = Math.min(pic.mm, fw * 0.46), ar = pic.im.h / pic.im.w;
          let iw = maxW, ih = iw * ar; const maxH = fh * 0.62; if (ih > maxH) { ih = maxH; iw = ih / ar; }
          if (iw >= fw * 0.22) {
            const t0 = plain(pic.im.t || ""), pName = (data.places && data.places[pic.im.place] || {}).name || pic.im.place, ym = /\b(rond|omstreeks|ca\.)?\s*(1[5-9]\d\d)\b/.exec(t0);
            const capT = t0 && t0.length <= 60 ? t0 : pName + (ym ? (ym[1] ? " rond " : " in ") + ym[2] : "");
            const cap = wrap(capT, TEXT_I, capPt, iw, 2, min), credit = fit([pic.im.maker && !/^https?:/.test(pic.im.maker) ? pic.im.maker : "", pic.im.sourceName, pic.im.lic].filter(Boolean).join(" · "), SANS, Math.max(min, capPt * 0.85), iw, min);
            const pw = iw + 2 * pad, ph = ih + 2 * pad + cap.lines.length * cap.pt * PT * 1.3 + credit.pt * PT * 1.5 + pad * 0.6;
            const corners = [[fx + fw - pw - 2 * u, fy + fh - ph - 2 * u], [fx + 2 * u, fy + fh - ph - 2 * u], [fx + fw - pw - 2 * u, fy + 2 * u], [fx + 2 * u, fy + 2 * u]];
            const cost = ([cx, cy]) => dots.reduce((s, d) => s + (d.x > cx - 2 * u && d.x < cx + pw + 2 * u && d.y > cy - 2 * u && d.y < cy + ph + 2 * u ? d.p.people.size : 0), 0);
            const [px, py] = corners.reduce((best, cn) => cost(cn) < cost(best) ? cn : best, corners[0]);
            taken.add(pic.im.id); used.add(pic.im.id); boxes.push([px - u, py - u, px + pw + u, py + ph + u]);
            g += `<rect x="${(px + 0.5 * u).toFixed(2)}" y="${(py + 0.6 * u).toFixed(2)}" width="${pw.toFixed(2)}" height="${ph.toFixed(2)}" fill="${ink}" fill-opacity="0.12"/>`
              + `<rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${pw.toFixed(2)}" height="${ph.toFixed(2)}" fill="#ffffff" stroke="${rule}" stroke-width="${(0.1 * u).toFixed(2)}"/>`
              + `<image href="${esc(pic.im.src)}" x="${(px + pad).toFixed(2)}" y="${(py + pad).toFixed(2)}" width="${iw.toFixed(2)}" height="${ih.toFixed(2)}" preserveAspectRatio="xMidYMid slice"/>`;
            let cy = py + pad + ih + cap.pt * PT * 1.25;
            cap.lines.forEach(l2 => { g += text(px + pad, cy, l2, TEXT_I, cap.pt, ink); cy += cap.pt * PT * 1.3; });
            g += text(px + pad, cy + credit.pt * PT * 0.2, credit.text, SANS, credit.pt, faint);
          }
        }
        /* dots (largest below) and names where they fit, never under the plate */
        [...dots].sort((a, z) => z.r - a.r).forEach(d => { if (!boxes.some(q => d.x > q[0] && d.x < q[2] && d.y > q[1] && d.y < q[3])) g += `<circle cx="${d.x.toFixed(2)}" cy="${d.y.toFixed(2)}" r="${d.r.toFixed(2)}" fill="${c}" fill-opacity="0.9" stroke="${paper}" stroke-width="${(0.12 * u).toFixed(2)}"/>`; });
        const labPt = Math.max(min + 1, 2.1 * ptU), th = labPt * PT; boxes.push(...dots.map(d => [d.x - d.r, d.y - d.r, d.x + d.r, d.y + d.r]));
        dots.forEach((d, i) => { if (boxes.slice(0, boxes.length - dots.length).some(q => d.x > q[0] && d.x < q[2] && d.y > q[1] && d.y < q[3])) return;
          const tw = pf.measure(d.p.name, i < 3 ? SANS_B : SANS, labPt), gap = 0.5 * u;
          for (const [lx, ly] of [[d.x + d.r + gap, d.y + th * 0.35], [d.x - d.r - gap - tw, d.y + th * 0.35], [d.x - tw / 2, d.y - d.r - gap], [d.x - tw / 2, d.y + d.r + gap + th * 0.8]]) {
            const box = [lx - 0.3 * u, ly - th * 0.85, lx + tw + 0.3 * u, ly + th * 0.25];
            if (box[0] < fx + u || box[2] > fx + fw - u || box[1] < fy + u || box[3] > fy + fh - u || boxes.some(q => box[0] < q[2] && q[0] < box[2] && box[1] < q[3] && q[1] < box[3])) continue;
            boxes.push(box); g += text(lx, ly, d.p.name, i < 3 ? SANS_B : SANS, labPt, ink); break; } });
      }
      /* ---- the stem line as a narrow bar: each generation from its birth to the birth of the next (the last to its death) ---- */
      if (stemH) {
        const ppl = f.stem.slice().reverse(), by0 = p => yr(p.b) || (p.m && yr(p.m.d) ? yr(p.m.d) - 25 : yr(p.d) ? yr(p.d) - 45 : null); /* no birth year: about 25 years before the marriage */
        const labPt = Math.max(min, 1.9 * ptU), lh2 = labPt * PT * 1.05, top = footY - 6 * u - stemH, hdr = top + 2.4 * u, sy = hdr + 3.4 * u + lh2 + 1.2 * u, bh = 1.6 * u;
        const t0 = by0(ppl[0]), last = ppl[ppl.length - 1], t1 = Math.max(yr(last.d) || by0(last) + 60, by0(last) + 10);
        const T = t => M + (t - t0) / Math.max(1, t1 - t0) * CW;
        g += text(M, hdr, `De stamlijn ${f.info.name}`, SANS_B, Math.max(min, 2.2 * ptU), ink) + text(w - M, hdr, `${ppl.length} generaties · ${t0}–${t1}`, MONO, Math.max(min, 2 * ptU), faint, "end");
        /* each name at the start of its segment: below the bar, or above it when the room below is taken (no line ever crosses a name) */
        const rows = [[], []];
        ppl.forEach((p, i) => { const a = by0(p), z = i < ppl.length - 1 ? by0(ppl[i + 1]) : t1, x0 = T(a), x1 = Math.max(T(z), x0 + 0.6 * u);
          g += `<rect x="${x0.toFixed(2)}" y="${sy.toFixed(2)}" width="${(x1 - x0 - 0.25 * u).toFixed(2)}" height="${bh.toFixed(2)}" fill="${c}" fill-opacity="${i % 2 ? 0.55 : 1}"/>`;
          const nm2 = shortName(p.n), yrs = yr(p.b) || yr(p.d) ? `${yr(p.b) || "?"}–${yr(p.d) || "?"}` : `tr. ${yr(p.m.d)}`, tw = Math.max(pf.measure(nm2, SANS, labPt), pf.measure(yrs, MONO, labPt * 0.9)) + u;
          const lx = Math.min(x0, w - M - tw), r = rows.findIndex(row => row.every(([a2, z2]) => lx > z2 || lx + tw < a2)); if (r < 0) return;
          rows[r].push([lx, lx + tw]);
          const ny = r === 0 ? sy + bh + labPt * PT * 1.3 : sy - 0.9 * u - lh2, tick = r === 0 ? [sy + bh, sy + bh + 0.8 * u] : [sy - 0.5 * u, sy];
          g += `<line x1="${x0.toFixed(2)}" x2="${x0.toFixed(2)}" y1="${tick[0].toFixed(2)}" y2="${tick[1].toFixed(2)}" stroke="${c}" stroke-width="${(0.12 * u).toFixed(2)}"/>`
            + text(lx, ny, nm2, SANS, labPt, ink) + text(lx, ny + lh2, yrs, MONO, labPt * 0.9, faint); });
      }
      /* footer */
      const yrsAll = f.people.flatMap(p => [yr(p.b), yr(p.d)]).filter(Boolean), from = yrsAll.length ? Math.min(...yrsAll) : null;
      const left = fit(`${f.people.length} voorouders · ${f.places.length} plaatsen${from ? ` · sinds ${from}` : ""} · de voorouders van ${root}`, SANS, Math.max(min, 2 * ptU), CW * 0.62, min);
      const right = fit(data.url ? `bronnen: ${String(data.url).replace(/^https?:\/\//, "").replace(/\/$/, "")}` : "", SANS, Math.max(min, 2 * ptU), CW * 0.36, min);
      g += `<line x1="${M}" x2="${w - M}" y1="${(footY - 3.6 * u).toFixed(2)}" y2="${(footY - 3.6 * u).toFixed(2)}" stroke="${rule}" stroke-width="${(0.1 * u).toFixed(2)}"/>`
        + text(M, footY, left.text, SANS, left.pt, muted) + text(w - M, footY, right.text, SANS, right.pt, muted, "end");
      const W = w + 2 * b, H = h + 2 * b;
      pages.push({ name: f.info.name, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${paper}"/><g transform="translate(${b} ${b})">${g}</g></svg>` });
    });
    return { pages, fonts: ["Libre Caslon Display 400", "Libre Caslon Text 400", "Libre Caslon Text 400i", "IBM Plex Sans 400", "IBM Plex Sans 600", "IBM Plex Mono 400"], imagesUsed: [...used],
      title: `De acht families van ${root}`, stats: { families: fams.length, pictures: used.size } };
  }
  (P.renderers = P.renderers || {}).families = { advise, render, familiesOf };
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
