/* Tree data and privacy. The site hands over the data of one tree as plain objects (Products.site.treeData), already filtered the
   way the site shows it: living people only have kw, n, roep and living. filterPrivacy() narrows that further per product.
   Pure functions, no DOM: the same code can run on a server.
   Tree data: { tree, root, brand, asOf, url, people: [{ kw, n, roep, living, b, bp, d, dp, m, occ, st, line }],
     lines: { kw: { name, stem } }, places: { key: { la, lo, name, gem } },
     facts: [{ kw, text, st, kind: "short" (KORT) | "fact" (FACTS, with title and year) | "story", title, year, source }],
     images: [{ id, kind (the site's soort: plaats, kaart, stadsplan, historisch, persoon, …), kws: [kw in this tree], keys: [site keys, e.g. "38", "a-6"], t, desc, src, w, h, maker, lic, sourceName }],
     livingKeys: [site keys of living people in both trees], livingNames: [names of the living in this tree] (only names: for checks
     and to avoid a short name that equals a living person's) }
   Profiles: site (as on the site), public (no photos of people who may be alive), calendar (only the dead with a full date),
   game (no stillborn children, no hypotheses, nothing that names or shows a living person). */
(function (P) {
  const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;
  const STILLBORN = /levenloos/i;
  const PERSON_KIND = /^(persoon|person|portret)$/; /* image kinds are the site's own values (soort): plaats, kaart, stadsplan, historisch, persoon, … */
  const year = s => { const m = String(s || "").match(/\d{4}/); return m ? +m[0] : null; };
  /* someone who may still be alive: marked living, or born after 1925 without a death date */
  const mayBeAlive = p => !!p && (p.living || (!p.d && (year(p.b) || 0) > 1925));
  const PROFILES = {
    site: { photosOfYoung: true, hypotheses: true, stillborn: true, onlyFullDates: false },
    public: { photosOfYoung: false, hypotheses: true, stillborn: true, onlyFullDates: false },
    calendar: { photosOfYoung: false, hypotheses: false, stillborn: false, onlyFullDates: true },
    game: { photosOfYoung: false, hypotheses: false, stillborn: false, onlyFullDates: false },
  };
  function filterPrivacy(data, profile) {
    const R = PROFILES[profile]; if (!R) throw new Error("unknown privacy profile " + profile);
    const byKw = new Map(data.people.map(p => [p.kw, p]));
    const livingKeys = new Set((data.livingKeys || []).map(String)), livingKws = new Set(data.people.filter(p => p.living).map(p => p.kw));
    const showsLiving = im => (im.keys || []).some(k => livingKeys.has(String(k))) || (im.kws || []).some(k => livingKws.has(k));
    /* people: the living keep only their name, as on the site (repeated here, so the core never relies on the caller alone) */
    let people = data.people.map(p => p.living ? { kw: p.kw, n: p.n, roep: p.roep, living: true } : p);
    if (R.onlyFullDates) people = people.filter(p => !p.living && (FULL_DATE.test(p.b || "") || FULL_DATE.test(p.d || "")));
    if (!R.hypotheses) people = people.filter(p => p.living || p.st !== "D");
    const kept = new Set(people.map(p => p.kw));
    let facts = (data.facts || []).filter(f => kept.has(f.kw) && !(byKw.get(f.kw) || {}).living);
    if (!R.stillborn) facts = facts.filter(f => !STILLBORN.test(f.text || ""));
    if (!R.hypotheses) facts = facts.filter(f => f.st !== "D");
    let images = (data.images || []).filter(im => !showsLiving(im));
    if (!R.stillborn) images = images.filter(im => !STILLBORN.test([im.t, im.desc].join(" ")));
    if (!R.photosOfYoung) images = images.filter(im => !PERSON_KIND.test(im.kind || "") || !(im.kws || []).some(k => mayBeAlive(byKw.get(k))));
    return Object.assign({}, data, { people, facts, images, profile });
  }
  /* keep only images that may go on a product; collect their credits */
  function filterLicences(data, o = {}) {
    const images = [];
    (data.images || []).forEach(im => { const l = P.licenceFor(im, o); if (l.allowed) { images.push(Object.assign({}, im, { credit: l.credit })); } });
    return Object.assign({}, data, { images });
  }
  Object.assign(P, { filterPrivacy, filterLicences, mayBeAlive, PRIVACY_PROFILES: PROFILES });
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
