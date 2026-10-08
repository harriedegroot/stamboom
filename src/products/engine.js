/* The engine: from a product, the tree data and the chosen options to a document that can be printed or saved.
   Pure: no DOM, no global state besides the registry. The browser UI (ui.js) and, later, a server use the same functions.
   Document: { product, options, page: { w, h, bleed, safe } (mm), pages: [{ name, svg | html }] or flow: html (layout "book"),
     fonts: [..], credits: [..], meta: { title, asOf } }
   Renderers: Products.renderers[name] = { render(data, options, ctx) → { pages | flow, fonts, imagesUsed, title },
     advise?(data, options, ctx) → { option id: advised value } }, with ctx = { size: { w, h }, bleed, safe, platform, product,
     palette } — palette: the light print colours { paper, ink, muted, faint, rule, accent, land, water, gold, l8 … l15 }.
   Address tokens are bare words joined by "--" (no key=value): "a2--gen-7--vanaf-12"; defaults are left out. */
(function (P) {
  P.renderers = P.renderers || {};
  const prod = id => { const p = P.products[id]; if (!p) throw new Error("unknown product " + id); return p; };

  /* default options of a product (advice is filled in by makeDocument) */
  function defaults(product) {
    const o = { format: product.defaultFormat || product.formats[0] || null, bleed: product.bleed[0] || 0 };
    product.options.forEach(x => { o[x.id] = x.default === undefined ? null : x.default; });
    return o;
  }
  /* "a2--gen-7--vanaf-12--afloop-3" → options; unknown or invalid words are ignored */
  function parseToken(productId, token) {
    const product = prod(productId);
    if (product.codec) return product.codec.parse(token);
    const o = defaults(product);
    String(token || "").split("--").filter(Boolean).forEach(w => {
      if (product.formats.includes(w)) { o.format = w; return; }
      let m = w.match(/^afloop-(\d+(?:[.,]\d+)?)$/); if (m) { const b = +m[1].replace(",", "."); if (product.bleed.includes(b)) o.bleed = b; return; }
      for (const x of product.options) {
        m = w.match(new RegExp("^" + x.token + "(?:-(.+))?$")); if (!m) continue;
        const v = m[1];
        if (x.type === "boolean") o[x.id] = v !== "nee";
        else if (x.type === "start") { const s = parseStart(v); if (s) o[x.id] = s; }
        else if (["number", "person", "line", "year"].includes(x.type)) { const n = +v; if (Number.isInteger(n) && (x.min === undefined || n >= x.min) && (x.max === undefined || n <= x.max)) o[x.id] = n; }
        else if (x.type === "list" || x.type === "preset") { if ((x.choices || []).some(c => String(c[0]) === v)) o[x.id] = v; }
        else if (v) o[x.id] = decodeURIComponent(v);
        return;
      }
    });
    return o;
  }
  function toToken(productId, options) {
    const product = prod(productId);
    if (product.codec) return product.codec.format(options);
    const d = defaults(product), w = [];
    if (options.format && options.format !== d.format) w.push(options.format);
    product.options.forEach(x => { const v = options[x.id]; if (v === undefined || v === null || v === d[x.id] || v === "advice" || (options.advice && options.advice[x.id] === v)) return; /* the advice itself stays out of the address */
      if (x.type === "start") { const t = formatStart(v); if (t && JSON.stringify(v) !== JSON.stringify(d[x.id])) w.push(x.token + "-" + t); return; }
      w.push(x.type === "boolean" ? (v ? x.token : x.token + "-nee") : x.token + "-" + (x.type === "text" ? encodeURIComponent(v) : v)); });
    if (options.bleed && options.bleed !== d.bleed) w.push("afloop-" + options.bleed);
    return w.join("--");
  }
  /* the start of a product: one person (kw) or a couple (kw and kw + 1, kw even), so that a brother, an aunt or a great-uncle can
     have their own book or poster: their ancestors are those of the couple. Address: "12" or "paar-24". */
  function parseStart(v) {
    let m = String(v || "").match(/^paar-(\d+)$/); if (m && +m[1] >= 2 && +m[1] % 2 === 0) return { kw: +m[1], pair: true };
    m = String(v || "").match(/^(\d+)$/); return m && +m[1] >= 1 ? { kw: +m[1], pair: false } : null;
  }
  const formatStart = s => !s ? "" : s.pair ? "paar-" + s.kw : String(s.kw);
  /* where the tree starts: rootKw (the person, or for a couple the place of their child) and the people it is about */
  function startOf(start) {
    const s = start && typeof start === "object" ? start : { kw: +start || 1, pair: false };
    return s.pair ? { rootKw: s.kw >> 1, people: [s.kw, s.kw + 1], pair: true } : { rootKw: s.kw, people: [s.kw], pair: false };
  }
  /* everyone in the tree of the start (the person or couple and all their ancestors), as kw of the person record; with
     kwartierverlies a position points to the record through data.aliases { position: kw } */
  function startMembers(data, start) {
    const st = startOf(start), have = new Set(data.people.map(p => p.kw)), alias = data.aliases || {}, out = new Set();
    const res = k => alias[k] || k, todo = [...st.people];
    while (todo.length) { const k = todo.pop(), r = res(k); if (!have.has(r) || k > 2 ** 40) continue; out.add(r); todo.push(2 * k, 2 * k + 1); }
    return out;
  }
  /* the name of the start for titles: only names, also for the living ("de voorouders van …") */
  function startName(data, start) {
    const aliasOf = k => (data.aliases || {})[k] || k;
    const st = startOf(start), by = new Map(data.people.map(p => [p.kw, p]));
    const names = st.people.map(k => (by.get(aliasOf(k)) || {}).n).filter(Boolean);
    if (st.rootKw === 1 && !st.pair) return data.root || names[0] || "";
    return st.pair ? names.join(" en ") : names[0] || "";
  }
  /* page size in mm, with the orientation the product asks for */
  function pageOf(product, options) {
    const f = P.formatOf(product, options.format) || { w: 0, h: 0 };
    const land = product.landscape && f.w < f.h, w = land ? f.h : f.w, h = land ? f.w : f.h;
    const bleed = options.bleed || 0, safe = product.safe || 0;
    return { w, h, bleed, safe, label: f.label || "" };
  }
  /* makeDocument(productId, treeData, options, platform, { strictLicences, palette }) */
  function makeDocument(productId, treeData, options, platform, o = {}) {
    const product = prod(productId), r = P.renderers[product.renderer];
    if (!r) throw new Error(`product ${productId}: renderer ${product.renderer} is not loaded`);
    const data = P.filterLicences(P.filterPrivacy(treeData, product.privacy), { strict: !!o.strictLicences });
    const opts = Object.assign(defaults(product), options || {}), page = pageOf(product, opts);
    const ctx = { size: { w: page.w, h: page.h }, bleed: page.bleed, safe: page.safe, platform, product, palette: o.palette || {} };
    if (r.advise) { const adv = r.advise(data, opts, ctx) || {}; Object.keys(adv).forEach(k => { if (opts[k] === "advice" || opts[k] === null) opts[k] = adv[k]; }); opts.advice = adv; }
    const out = r.render(data, opts, ctx) || {};
    const used = new Set(out.imagesUsed || []);
    const credits = [...new Set(data.images.filter(im => used.has(im.id)).map(im => im.credit).filter(Boolean))];
    const missing = data.images.filter(im => used.has(im.id) && !im.credit).map(im => im.id);
    return { product: product.id, options: opts, page, pages: out.pages || null, flow: out.flow || null, fonts: out.fonts || [],
      credits, missingCredits: missing, stats: out.stats || null, meta: { title: out.title || product.label, asOf: treeData.asOf || "", tree: treeData.tree } };
  }
  Object.assign(P, { defaults, parseToken, toToken, pageOf, makeDocument, parseStart, formatStart, startOf, startName, startMembers });
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
