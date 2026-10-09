/* The content of the photo book "Gezichten en plaatsen", pure: Products.bookPhoto(data, token) → { intro, families, counts }.
   data = the book data of one tree (as for Products.book.forTree); token = the choices of the book: the object S (B.S), or a token ("vanaf-paar-4", "lijn-8", "").
   Per family, in the order of the book: the faces (real portraits, then other images of one person: memorial cards, notices, graves),
   young to old, and then the places where that family lived, in the order they came there. Each item: { id, kind: "portrait" |
   "person" | "place", caption, kw?, place?, src, w, h, credit, size: "full" | "half" }. The layout (bleed, grid, dpi, cover) is done by
   the page; this file only chooses, orders and writes the captions. Only the dead and places: an image that shows or names someone
   living stays out. Captions only use data with a source (name, years, occupation, place, the short sentence of the profile). */
(function (P) {
  const PERSONAL = /^(persoon|portret)$/;
  const PLACE_KIND = { historisch: 0, stadsplan: 1, plaats: 2, kaart: 3 }; /* an old picture of the village first, a modern photo after */
  const NOT_A_PICTURE = /akte|scan|weesboek|register|reg-|krant|-of-kw/i; /* sources, clippings and doubtful identifications */
  const NOT_A_FACE = /^(akte|document|krant|register|kadaster)$/; /* the group of an image: a source, never a face */
  const MEMORIAL = /^(rouw|graf|bidprentje)$/; /* a notice, grave or memorial card: a face, but after the photographs */
  const memorial = im => MEMORIAL.test(im.group || "") || /(^|-)(rouw|graf|bidprentje)(-|$)/.test(im.id || ""); /* older images have no group yet */
  const A_HOUSE = /boerderij|hoeve|huis|woning|pand|gevel|bouwtekening|herberg|molen|winkel/i; /* a home of a person: among the places, not the faces */

  const same = (a, b) => String(a || "").toLowerCase().replace(/[^a-z]/g, "") === String(b || "").toLowerCase().replace(/[^a-z]/g, ""); /* "Langezwaag." under Langezwaag */
  function bookPhoto(data, token = "") {
    const X = P.bookText(data), { lineOf, gen, lifeYears, placeName, firstName, splitName, year } = X;
    const core = P.book.forTree(data), S = token && typeof token === "object" ? token : core.parse("boek--preset-foto" + (token ? "--" + token : "")); /* the choices (B.S), or a token */
    const members = core.members(S), byKw = new Map((data.people || []).map(p => [p.kw, p]));
    const living = new Set((data.people || []).filter(p => p.living).map(p => p.kw));
    const lines = core.partsOf(S).flatMap(d => d.lijnen);
    const portraits = data.portraits || {}, short = data.short || {}, used = new Set();
    const credit = im => [im.maker, im.lic, im.sourceName].filter(Boolean).join(" · ") || (typeof im.credit === "string" ? im.credit : "");
    const size = im => (im.w || 0) >= 1600 || (im.h || 0) >= 1600 ? "full" : "half"; /* the page still checks the dpi */
    const years = p => { const t = lifeYears(p); return t === "jaartallen onbekend" ? "" : t; };
    const role = p => { const occ = String(p.occ || "").split(/[;(]/)[0].replace(/[,.\s]+$/, "").trim(); const pl = placeName(p.bp || p.dp || "");
      return occ ? occ.charAt(0).toLowerCase() + occ.slice(1) + (pl && !occ.toLowerCase().includes(pl.toLowerCase()) && !/\b(in|te|op|bij)\s+[A-Z]/.test(occ) ? " in " + pl : "") : pl ? "uit " + pl : ""; };
    /* "Hermanus Anne de Groot (1922 – 2012), veehouder in Wolvega." and the short sentence of the profile */
    const personCaption = (p, title) => {
      const head = [title ? title.replace(/[.\s]+$/, "") + "." : "", `${p.n}${years(p) ? ` (${years(p)})` : ""}${role(p) ? ", " + role(p) : ""}.`].filter(Boolean).join(" ");
      const s = short[p.kw]; return s && !title ? `${head} ${String(s).trim()}` : head; };

    const families = lines.map(l => {
      const L = (data.lines || {})[l] || {}, ps = members.filter(p => lineOf(p.kw) === l && !p.living).sort((a, b) => gen(a.kw) - gen(b.kw) || a.kw - b.kw);
      const kws = new Set(ps.map(p => p.kw)), items = [], homes = [];
      /* faces: the portrait of each ancestor, young to old; then other images of exactly these people (never with someone living) */
      ps.forEach(p => { const im = portraits[p.kw]; if (!im || !im.src || used.has(im.id)) return; used.add(im.id);
        items.push({ id: im.id, kind: "portrait", kw: p.kw, caption: personCaption(p), src: im.src, w: im.w, h: im.h, credit: credit(im), size: "full" }); });
      (data.images || []).filter(im => PERSONAL.test(im.kind || "") && im.src && !used.has(im.id) && !NOT_A_PICTURE.test(im.id || "") && !NOT_A_FACE.test(im.group || "")
        && (im.kws || []).length && im.kws.every(k => !living.has(k)) && im.kws.some(k => kws.has(k)))
        .sort((a, b) => memorial(a) - memorial(b) || gen(Math.min(...a.kws)) - gen(Math.min(...b.kws)))
        .forEach(im => { const p = byKw.get(im.kws.find(k => kws.has(k))); used.add(im.id);
          (A_HOUSE.test((im.id || "") + " " + (im.t || "")) ? homes : items).push({ id: im.id, kind: A_HOUSE.test((im.id || "") + " " + (im.t || "")) ? "place" : "person", kw: p.kw, caption: personCaption(p, im.t), src: im.src, w: im.w, h: im.h, credit: credit(im), size: size(im) }); });
      items.push(...homes); /* their homes first among the places, then the villages */
      /* places: where the family was born, married, lived or died (events with a year), most events first, at most six; one image each */
      const at = {};
      ps.forEach(p => [[p.bp, year(p.b)], [p.dp, year(p.d)], [p.m && p.m.p, year(p.m && p.m.d)], ...(p.res || []).map(r => [r.p, r.y])].forEach(([k, y]) => {
        if (!k) return; const a = at[k] = at[k] || { n: 0, y0: 9999, y1: 0, who: new Set() }; a.n++; a.who.add(p.kw); if (y) { a.y0 = Math.min(a.y0, y); a.y1 = Math.max(a.y1, y); } }));
      const gemeente = k => { const q = (data.places || {})[k]; return !!(q && (q.seat || q.kind === "gemeente")); }; /* a municipality is no village (as on the site) */
      const imgOfPlace = k => gemeente(k) ? null : (data.images || []).filter(im => im.place === k && im.src && PLACE_KIND[im.kind] !== undefined && !used.has(im.id))
        .sort((a, b) => PLACE_KIND[a.kind] - PLACE_KIND[b.kind] || (b.w || 0) * (b.h || 0) - (a.w || 0) * (a.h || 0))[0] || null;
      Object.entries(at).filter(([k]) => imgOfPlace(k)).sort((a, b) => b[1].n - a[1].n).slice(0, 6).sort((a, b) => a[1].y0 - b[1].y0)
        .forEach(([k, a]) => { const im = imgOfPlace(k); used.add(im.id); const n = a.who.size;
          const when = a.y0 < 9999 ? (a.y0 === a.y1 ? ` in ${a.y0}` : `, van ${a.y0} tot ${a.y1}`) : "";
          items.push({ id: im.id, kind: "place", place: k, src: im.src, w: im.w, h: im.h, credit: credit(im), size: size(im),
            caption: `${placeName(k)}. ${n === 1 ? "Eén voorouder" : n + " voorouders"} uit de familie ${L.name || ""} ${n === 1 ? "werd hier geboren, trouwde, woonde of overleed" : "werden hier geboren, trouwden, woonden of overleden"}${when}.${im.t && !same(im.t, placeName(k)) ? " " + String(im.t).replace(/[.\s]+$/, "") + "." : ""}` }); });
      return { line: l, name: L.name || "", items };
    }).filter(f => f.items.length);

    const nP = families.reduce((n, f) => n + f.items.filter(i => i.kind !== "place").length, 0), nPl = families.reduce((n, f) => n + f.items.filter(i => i.kind === "place").length, 0);
    const fam = families.length === 1 ? "één familie" : families.length + " families", pl = nPl === 1 ? "één plaats" : nPl + " plaatsen";
    const intro = [
      nP ? `De gezichten van de voorouders en de plaatsen waar ze woonden: ${nP === 1 ? "één beeld" : nP + " beelden"} van voorouders en ${pl}, in ${fam}.` : `De plaatsen waar de voorouders woonden: ${pl}, in ${fam}. Van deze voorouders is nog geen portret of ander beeld bewaard.`,
      nP ? "Per familie eerst de mensen, van jong naar oud: portretten, en waar die er niet zijn een bidprentje, een rouwbericht of een grafsteen. Daarna de dorpen en steden waar de familie woonde, in de volgorde waarin ze er kwamen." : "Per familie de dorpen en steden waar ze woonden, in de volgorde waarin ze er kwamen.",
      "Bij elk beeld staat wie het is en wat we zeker weten: de jaren, het beroep en de plaats, uit de akten. Wie het beeld maakte en waar het bewaard wordt, staat achterin." ].join(" ");
    return { intro, families, counts: { faces: nP, places: nPl, families: families.length } };
  }
  P.bookPhoto = bookPhoto;
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
