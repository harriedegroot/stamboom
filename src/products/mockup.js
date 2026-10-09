/* Mockups: the real pages of a product in a small scene, so a visitor sees what it becomes before ordering. Pure: SVG strings, no DOM.
   Products.mockup(doc, product, o) → { svg, scene } | null. doc = a made document ({ page, pages: [{ name, svg }] }), product = its
   registry entry. The scene follows the product: on a wall (canvas, posters; a series as a wall of up to eight), a mug (the middle of the
   wrap, curved, with a handle), a tile, a puzzle (piece lines over the picture) or a hand of cards (quartet, memory, postcards).
   The pages go in as inline SVG (with their ids made unique), so the page fonts apply. o.max: at most this many pages (cards: 5). */
(function (P) {
  let seq = 0;
  /* one page as a nested <svg> at x, y, w × h; its ids get a prefix so several pages can share one scene */
  function embed(svg, x, y, w, h, o = {}) {
    const pre = "mk" + (++seq) + "-", vb = /viewBox="([^"]+)"/.exec(svg), inner = svg.replace(/^[\s\S]*?<svg\b[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    const body = inner.replace(/\bid="([^"]+)"/g, (m, id) => `id="${pre}${id}"`).replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${pre}${id})`).replace(/href="#([^"]+)"/g, (m, id) => `href="#${pre}${id}"`);
    return `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"${vb ? ` viewBox="${o.viewBox || vb[1]}"` : ""} preserveAspectRatio="${o.par || "xMidYMid slice"}">${body}</svg>`;
  }
  const vbOf = svg => { const m = /viewBox="([\d.\s-]+)"/.exec(svg); return m ? m[1].trim().split(/\s+/).map(Number) : [0, 0, 100, 100]; };
  /* the trimmed page (without bleed) as a viewBox, so the mockup shows what is cut */
  const trimBox = (doc, svg) => { const b = (doc.page && doc.page.bleed) || 0, [, , w, h] = vbOf(svg); return `${b} ${b} ${w - 2 * b} ${h - 2 * b}`; };
  const shadow = id => `<filter id="${id}" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation="9"/><feOffset dy="10"/><feComponentTransfer><feFuncA type="linear" slope="0.28"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const scene = (W, H, defs, body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img"><defs>${defs}</defs>${bg || ""}${body}</svg>`;
  const wallBg = (W, H) => `<linearGradient id="mkWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe9df"/><stop offset="1" stop-color="#e2dacd"/></linearGradient>`;

  /* on a wall: one canvas with its depth, or a series side by side */
  function wall(doc, product, o) {
    const pages = doc.pages.slice(0, o.max || 8), n = pages.length, cols = n <= 1 ? 1 : n <= 3 ? n : Math.ceil(n / 2), rows = Math.ceil(n / cols);
    const W = 1000, H = 700, [, , pw, ph] = trimBox(doc, pages[0].svg).split(" ").map(Number), canvas = product.category === "wall" && /canvas/.test(product.id);
    const gap = 26, cw = Math.min((W - 160 - gap * (cols - 1)) / cols, ((H - 150 - gap * (rows - 1)) / rows) * pw / ph), ch = cw * ph / pw;
    const x0 = (W - cols * cw - (cols - 1) * gap) / 2, y0 = (H - rows * ch - (rows - 1) * gap) / 2 - 12, depth = canvas ? Math.max(4, cw * 0.035) : 0;
    let body = "";
    pages.forEach((pg, i) => { const x = x0 + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + gap);
      body += `<g filter="url(#mkShadow)">`;
      if (canvas) body += `<path d="M${x + cw} ${y}l${depth} ${depth * 0.6}v${ch}l${-depth} ${-depth * 0.6}z" fill="#000" fill-opacity="0.22"/><path d="M${x} ${y + ch}l${depth} ${depth * 0.6}h${cw}l${-depth} ${-depth * 0.6}z" fill="#000" fill-opacity="0.12"/>`;
      else body += `<rect x="${x - 8}" y="${y - 8}" width="${cw + 16}" height="${ch + 16}" fill="#2a2522"/>`; /* a poster: a thin frame */
      body += embed(pg.svg, x, y, cw, ch, { viewBox: trimBox(doc, pg.svg) }) + `</g>`; });
    return scene(W, H, wallBg() + shadow("mkShadow"), body + `<rect x="0" y="${H - 34}" width="${W}" height="34" fill="#d6ccbd"/>`, `<rect width="${W}" height="${H}" fill="url(#mkWall)"/>`);
  }
  /* a mug, twice: the two halves of the wrap, each with the handle on the other side (front and back), curved with light and shade */
  function mug(doc) {
    const pg = doc.pages[0], [, , vw, vh] = vbOf(pg.svg), W = 1000, H = 700, bw = 270, bh = bw * 89 / 82, y = (H - bh) / 2 + 20; /* a mug of 11 oz: about 8.2 cm wide and 8.9 cm high; half the wrap goes round the front */
    const defs = `<linearGradient id="mkRound" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0.38"/><stop offset="0.16" stop-color="#000" stop-opacity="0.08"/><stop offset="0.38" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="0.86" stop-color="#000" stop-opacity="0.1"/><stop offset="1" stop-color="#000" stop-opacity="0.42"/></linearGradient>` + shadow("mkShadow") + wallBg();
    const one = (x, half, side) => { const cid = "mkMug" + half, hx = side > 0 ? x + bw - 4 : x + 4;
      const hp = `M${hx} ${y + bh * 0.2}c${side * bw * 0.34} ${-bh * 0.04} ${side * bw * 0.36} ${bh * 0.62} ${side * 4} ${bh * 0.6}`;
      return `<clipPath id="${cid}"><path d="M${x} ${y}h${bw}v${bh - 20}q0 20 -20 20h${-(bw - 40)}q-20 0 -20 -20z"/></clipPath>
        <g filter="url(#mkShadow)"><path d="${hp}" fill="none" stroke="#e9e6e0" stroke-width="${bw * 0.075}" stroke-linecap="round"/><path d="${hp}" fill="none" stroke="#000" stroke-opacity="0.12" stroke-width="${bw * 0.02}"/>
        <g clip-path="url(#${cid})"><rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="#fff"/>${embed(pg.svg, x, y, bw, bh, { viewBox: `${half * vw * 0.5} 0 ${vw * 0.5} ${vh}`, par: "none" })}<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="url(#mkRound)"/></g>
        <ellipse cx="${x + bw / 2}" cy="${y}" rx="${bw / 2}" ry="${bw * 0.07}" fill="#f4f2ee" stroke="#d9d4cc" stroke-width="2"/><ellipse cx="${x + bw / 2}" cy="${y + 3}" rx="${bw / 2 - 10}" ry="${bw * 0.055}" fill="#cfc9bf"/></g>`; };
    const body = one(W / 2 - bw - 60, 0, -1) + one(W / 2 + 60, 1, 1);
    return scene(W, H, defs, body, `<rect width="${W}" height="${H}" fill="url(#mkWall)"/><rect x="0" y="${y + bh + 4}" width="${W}" height="${H}" fill="#d6ccbd"/>`);
  }
  /* a tile: square, with a little bevel */
  function tile(doc) {
    const pg = doc.pages[0], W = 800, H = 700, s = 480, x = (W - s) / 2, y = (H - s) / 2 - 10;
    const defs = shadow("mkShadow") + wallBg() + `<linearGradient id="mkBevel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.12"/></linearGradient>`;
    return scene(W, H, defs, `<g filter="url(#mkShadow)"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="6" fill="#fff"/>${embed(pg.svg, x, y, s, s, { viewBox: trimBox(doc, pg.svg) })}<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="6" fill="url(#mkBevel)"/></g>`, `<rect width="${W}" height="${H}" fill="url(#mkWall)"/>`);
  }
  /* a puzzle: the picture with the lines of the pieces, and one piece lifted out */
  function puzzle(doc) {
    const pg = doc.pages[0], [, , pw, ph] = trimBox(doc, pg.svg).split(" ").map(Number), W = 1000, H = 760, h = 640, w = h * pw / ph, x = (W - w) / 2 - 60, y = (H - h) / 2;
    const cols = 12, rows = Math.round(cols * ph / pw), cw = w / cols, rh = h / rows;
    /* one edge with a knob, out or in by the parity of its place */
    const edge = (x1, y1, x2, y2, k) => { const dx = x2 - x1, dy = y2 - y1, nx = -dy * k, ny = dx * k, P2 = (t, n) => `${(x1 + dx * t + nx * n).toFixed(1)} ${(y1 + dy * t + ny * n).toFixed(1)}`;
      return `L${P2(0.36, 0)}C${P2(0.42, 0.02)} ${P2(0.3, 0.24)} ${P2(0.5, 0.25)}C${P2(0.7, 0.24)} ${P2(0.58, 0.02)} ${P2(0.64, 0)}L${P2(1, 0)}`; };
    let lines = "";
    for (let r = 1; r < rows; r++) { let d = `M${x} ${y + r * rh}`; for (let c = 0; c < cols; c++) d += edge(x + c * cw, y + r * rh, x + (c + 1) * cw, y + r * rh, (r + c) % 2 ? 1 : -1); lines += `<path d="${d}"/>`; }
    for (let c = 1; c < cols; c++) { let d = `M${x + c * cw} ${y}`; for (let r = 0; r < rows; r++) d += edge(x + c * cw, y + r * rh, x + c * cw, y + (r + 1) * rh, (r + c) % 2 ? -1 : 1); lines += `<path d="${d}"/>`; }
    /* one piece out: from the picture (not a blank margin), lying next to the puzzle */
    const pc = Math.floor(cols * 0.64), pr = Math.floor(rows * 0.42), px = x + pc * cw, py = y + pr * rh, lx = x + w + 40, ly = py - rh * 0.4;
    const lift = `<g transform="rotate(10 ${lx + cw / 2} ${ly + rh / 2})" filter="url(#mkShadow)"><svg x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" width="${(cw * 1.3).toFixed(1)}" height="${(rh * 1.3).toFixed(1)}" viewBox="${(pc * cw).toFixed(1)} ${(pr * rh).toFixed(1)} ${cw.toFixed(1)} ${rh.toFixed(1)}">${embed(pg.svg, 0, 0, w, h, { viewBox: trimBox(doc, pg.svg) })}</svg></g>`;
    const body = `<g filter="url(#mkShadow)">${embed(pg.svg, x, y, w, h, { viewBox: trimBox(doc, pg.svg) })}<rect x="${px}" y="${py}" width="${cw}" height="${rh}" fill="#b7ab98"/><g fill="none" stroke="#3a332c" stroke-opacity="0.22" stroke-width="1.1">${lines}</g></g>${lift}`;
    return scene(W, H, shadow("mkShadow"), body, `<rect width="${W}" height="${H}" fill="#cbbfac"/>`);
  }
  /* a hand of cards: the first pages fanned out, the back of the set (the last page) under them */
  function cards(doc, product, o) {
    const ps = doc.pages, back = ps.length > 2 && /achter/i.test(ps[ps.length - 1].name || "") ? ps[ps.length - 1] : null;
    const front = ps.filter(p => p !== back && !/^vel|achterkanten/i.test(p.name || "")).filter((p, i, a) => i % Math.max(1, Math.floor(a.length / (o.max || 5))) === 0).slice(0, o.max || 5);
    if (!front.length) return null;
    const [, , pw, ph] = trimBox(doc, front[0].svg).split(" ").map(Number), W = 1000, H = 700, ch = 470, cw = ch * pw / ph, cx = W / 2, cy = H / 2 + 40, n = front.length;
    const card = (pg, rot, dx) => `<g transform="translate(${cx + dx - cw / 2} ${cy - ch / 2}) rotate(${rot} ${cw / 2} ${ch * 1.6})" filter="url(#mkShadow)"><rect width="${cw}" height="${ch}" rx="${cw * 0.05}" fill="#fff"/>${embed(pg.svg, 0, 0, cw, ch, { viewBox: trimBox(doc, pg.svg) })}</g>`;
    let body = back ? card(back, -26, -cw * 0.55) : "";
    front.forEach((pg, i) => { const t = n === 1 ? 0 : i / (n - 1) - 0.5; body += card(pg, t * 34, t * cw * 1.1); });
    return scene(W, H, shadow("mkShadow"), body, `<rect width="${W}" height="${H}" fill="#2f3b36"/>`);
  }
  function mockup(doc, product, o = {}) {
    if (!doc || !doc.pages || !doc.pages.length || !product) return null;
    const f = (doc.page && doc.page.label) || "", id = product.id || "";
    const kind = /^mug/.test(id) || /mok/i.test(f) ? "mug" : /^tile/.test(id) ? "tile" : /^puzzle/.test(id) ? "puzzle" : product.layout === "cards" ? "cards" : product.layout === "sheet" ? "wall" : null;
    if (!kind) return null;
    const svg = { mug, tile, puzzle, cards, wall }[kind](doc, product, o);
    return svg ? { svg, scene: kind } : null;
  }
  P.mockup = mockup;
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
