/* Focus: the family seen from one person or one couple. From the joined tree (s: every person of the family once, with kw in s
   numbering) focusTree makes a tree object of the same shape as the trees of the site, re-rooted on the focus:
   - kw relative to the focus: kw 1 = the person, or for a couple their children together (virtual), kw 2 and 3 = the couple;
   - only the members: a walk up from the focus that follows the aliases (quarter loss), so ancestors whose record has a number outside
     the branch are found too. A record keeps its own place when that place is inside the branch, else its first place in the walk;
     every other place of the same person becomes an alias. The same walk works on any graph of parents (later: an import);
   - every reference to a person moves along: kw, alias, kws, people, path, line, and "kw N" in texts (a member: the new number; not a
     member: the name, without "kw");
   - the families (LINES 8–15) are those of the focus;
   - texts that are about nobody in the branch are left out (stories, facts, questions, notables, media).
   Living people stay as they are (the site keeps only their name), so a free focus never shows more of them.
   Pure: no DOM. focus = { kw, pair, persons? } in s numbering. persons (a couple only): some of their children by name, for a
   personal title and the middle of the fan ("Andre", "Marit, Tijmen en Jorn"); the ancestors are the same, so no data changes.
   o.kidsOf(sKw) → names: the children of a couple whose child in the line has no list of brothers and sisters in the data (the site
   gives them from its tree meta, e.g. Harrie's brother and sister). */
(function (P) {
  const gen = k => Math.floor(Math.log2(k));                              /* 1 → 0, 2–3 → 1, 4–7 → 2 … */
  const pow = n => Math.pow(2, n);                                         /* exact up to 2^53, so up to generation 53 */
  /* the place of K in the branch of R (both in s), or null when K is not below R */
  function rel(K, R) { const d = gen(K) - gen(R); if (d < 0) return null; const p = pow(d); return Math.floor(K / p) === R ? p + (K % p) : null; }
  const worst = (...xs) => xs.filter(x => /^[A-D]$/.test(x || "")).sort().pop() || xs.find(Boolean); /* A strongest … D weakest */
  const KW_RE = /\bkw\.?\s?(\d+)((?:\s*[\/–-]\s*\d+)*)/g;              /* "kw 12", and runs as "kw 186–187" or "kw 256/257" (as joinTrees) */

  function focusTree(S, focus, o = {}) {
    const f = { kw: +focus.kw || 1, pair: !!focus.pair, persons: focus.pair && Array.isArray(focus.persons) && focus.persons.length ? focus.persons.slice() : null };
    /* the surname: the site's own split when it gives one (o.surname, e.g. "Terwisscha van Scheltinga"), else a simple one */
    const surname = n => o.surname ? (s => s ? s.charAt(0).toUpperCase() + s.slice(1) : "")(o.surname(n)) : surname0(n);
    const surname0 = n => { const w = String(n || "").trim().split(/\s+/); let i = w.length - 1; while (i > 0 && /^(de|van|der|den|ten|ter|te|la|le|op|in)$/i.test(w[i - 1])) i--; const s = w.slice(i).join(" "); return s.charAt(0).toUpperCase() + s.slice(1); };
    const rec = new Map(), aliasOf = new Map();
    S.PEOPLE.forEach(p => { if (p.alias) aliasOf.set(p.kw, p.alias); else rec.set(p.kw, p); });
    /* the record for a place in s: follow an alias anywhere on the way up (like fanKw on the site) */
    const resolve = K => {
      for (let i = 0; i < 64; i++) {
        if (rec.has(K)) return K;
        let j = 0, q = K, hit = null;
        while (q >= 1) { if (aliasOf.has(q)) { hit = q; break; } q = Math.floor(q / 2); j++; }
        if (hit === null) return null;
        const p = pow(j); K = aliasOf.get(hit) * p + (K % p);
      }
      return null;
    };
    /* the walk: places of the focus (relative) and of s */
    const roots = f.pair ? [[2, f.kw], [3, f.kw + 1]] : [[1, f.kw]];
    const R = f.pair ? Math.floor(f.kw / 2) : f.kw;                       /* the place whose branch "inside" means (a couple: their child's place) */
    const place = new Map(), aliases = [], toS = new Map(), occ = new Map(); /* occ: the s place where the record was met */              /* s record → relative place; relative alias places; relative → s */
    const queue = roots.slice(), seenPos = new Set();
    while (queue.length) {
      const [r, sPos] = queue.shift(); if (seenPos.has(r)) continue; seenPos.add(r);
      const id = resolve(sPos); if (id === null) continue;
      const inside = rel(id, R), own = inside !== null && !(f.pair && inside === 1) ? inside : null;
      if (place.has(id) || (own !== null && own !== r)) { aliases.push([r, id, sPos]); continue; } /* another place of the same person */
      place.set(id, r); toS.set(r, id); occ.set(id, sPos);
      queue.push([2 * r, 2 * id], [2 * r + 1, 2 * id + 1]);
    }
    const kwOfS = id => place.get(id) ?? null;                           /* the focus number of an s record */
    /* a place in s → its focus number: a place inside the branch keeps its own place ("als kw 140 en als kw 164" are two places of one
       person), anything else goes through the person (a record outside the branch has its own place in the focus) */
    const at0 = new Set();
    const mapPos = K => { const r = rel(K, R); if (r !== null && !(f.pair && r === 1) && at0.has(r)) return r; const id = resolve(K); return id === null ? null : kwOfS(id); };
    const nameOf = K => { const id = resolve(K); const p = id === null ? null : rec.get(id); return p ? p.n : null; };
    const resolveText = s => typeof P.resolveKwRefs === "function"
      ? P.resolveKwRefs(s, K => { const k = mapPos(K); return k !== null ? k : nameOf(K); })
      : s.replace(KW_RE, (m, n, run) => { const k = mapPos(+n);
          if (k !== null) return "kw " + k + run.replace(/\d+/g, d => { const x = mapPos(+d); return x !== null ? x : d; });
          const nm = nameOf(+n); return nm ? [nm, ...(run.match(/\d+/g) || []).map(d => nameOf(+d)).filter(Boolean)].join(" en ") : m; });
    /* in a list of children or brothers and sisters a reference to someone outside the branch goes away ("Kees · kw 2" → "Kees"):
       the name is already there */
    const resolveList = s => typeof P.resolveKwRefs === "function" ? P.resolveKwRefs(s, K => { const k = mapPos(K); return k !== null ? k : ""; })
      : s.replace(/\s*·\s*kw\.?\s?(\d+)/g, (m, n) => { const k = mapPos(+n); return k !== null ? " · kw " + k : ""; });
    const deep = (v, key) => typeof v === "string" ? (key === "kids" || key === "sibs" ? resolveList(v) : resolveText(v)) : Array.isArray(v) ? v.map(x => deep(x, key)) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x, k)])) : v;
    const lineOfRel = k => k >= 8 ? Math.floor(k / pow(gen(k) - 3)) : null;
    /* one object (a person or a text) with its references moved; null when it is about nobody in the branch */
    const move = (x, needMember) => {
      const refs = typeof x.kw === "number" || Array.isArray(x.kws) || Array.isArray(x.people) || Array.isArray(x.path);
      const y = deep(x); let any = !needMember || !refs;                 /* a text about nobody in particular stays */
      const m1 = k => { const v = mapPos(+k); if (v !== null) any = true; return v; };
      if (typeof x.kw === "number") { const v = m1(x.kw); if (v === null && needMember) return null; y.kw = v; }
      if (Array.isArray(x.kws)) y.kws = x.kws.map(m1).filter(v => v !== null);
      if (Array.isArray(x.people)) y.people = x.people.map(m1).filter(v => v !== null);
      /* needs: the people a text is about (a story on Kees and Vronie): without one of them in the focus the text does not fit */
      if (Array.isArray(x.needs)) { const n = x.needs.map(k => mapPos(+k)); if (needMember && n.some(v => v === null)) return null; y.needs = n; }
      if (Array.isArray(x.path)) y.path = x.path.map(st => typeof st[1] === "number" ? [st[0], m1(st[1])] : st);
      if (typeof x.line === "number") { const k = (x.kws || x.people || [x.kw]).map(k => mapPos(+k)).find(v => v !== null && v >= 8); y.line = k ? lineOfRel(k) : null; }
      return any ? y : null;
    };

    /* another place of a person: an alias, and so are all their ancestors at that place (as the site's own trees list them) */
    const aliasAt = new Map();
    const aliasS = new Map();                                             /* focus alias place → its s place (for linkAt) */
    const mirror = (r, id, depth, sPos) => { if (depth > 60 || aliasAt.has(r) || place.get(id) === r) return; if (place.has(id)) { aliasAt.set(r, place.get(id)); aliasS.set(r, sPos); }
      [0, 1].forEach(j => { const pid = resolve(2 * id + j); if (pid !== null) mirror(2 * r + j, pid, depth + 1, 2 * sPos + j); }); };
    aliases.forEach(([r, id, sPos]) => mirror(r, id, 0, sPos));
    place.forEach(r => at0.add(r)); aliasAt.forEach((t, r) => at0.add(r));  /* every place in the focus, for the texts */
    /* people: the records at their focus place, then the aliases */
    const PEOPLE = [];
    if (f.pair) { const a = rec.get(resolve(f.kw)), b = rec.get(resolve(f.kw + 1)), child = rec.get(resolve(R));
      /* their children: from the father's (else the mother's) list of children, without the stillborn ones and without "· kw N";
         the child in the line first. Without such a list: the child's brothers and sisters (data, or o.kidsOf from the site). */
      const nameOfKid = x => String(typeof x === "string" ? x : x && x.n || "").replace(/\s*·\s*(kw\.?\s?\d+|d\d+).*$/, "").replace(/\s*[(,].*$/, "").trim();
      const lineKid = x => new RegExp("·\\s*kw\\.?\\s?" + (child ? child.origKw ?? R : R) + "\\b").test(String(x)) || /·\s*kw/.test(String(x)) && child && nameOfKid(x) === (child.roep || String(child.n).split(" ")[0]);
      const list = (a && (a.kids || []).length ? a.kids : b && (b.kids || []).length ? b.kids : null);
      let kids;
      if (list) { const all = list.filter(x => !/levenloos/i.test(String(typeof x === "string" ? x : x && x.n || ""))); const first = all.find(lineKid);
        kids = [...(first ? [child ? child.roep || nameOfKid(first) : nameOfKid(first)] : child ? [child.roep || child.n] : []), ...all.filter(x => x !== first).map(nameOfKid)].filter(Boolean); }
      else { const more = (child && (child.sibs || []).length ? child.sibs : o.kidsOf ? o.kidsOf(R) || [] : []).map(nameOfKid).filter(Boolean);
        kids = child ? [child.roep || child.n, ...more] : more; }
      /* persons: only children of this couple (case does not matter); none left → no personal choice */
      if (f.persons) { const low = new Map(kids.map(k => [k.toLowerCase(), k])); const ok = f.persons.map(x => low.get(String(x).toLowerCase())).filter(Boolean); f.persons = ok.length ? ok : null; }
      const who = f.persons ? f.persons : kids, and = xs => xs.length > 1 ? xs.slice(0, -1).join(", ") + " en " + xs[xs.length - 1] : xs[0] || "";
      /* a couple without children in the data: kw 1 is the couple itself, named after their families (no names twice: they are kw 2 and 3) */
      const fam0 = [a, b].filter(Boolean).map(p => surname(p.n)).filter(Boolean).join(" · ");
      PEOPLE.push(Object.assign({ kw: 1, n: and(who) || fam0, living: true, virtual: true, kids, persons: f.persons || null }, who.length ? {} : { childless: true })); }
    /* evidence per step (linkAt { s place: label } next to link): a record met at another place than its own takes that place's
       label; an alias place keeps the label of its own step */
    const alsOf = new Map(); aliasAt.forEach((t, r) => { const id = toS.get(t); (alsOf.get(id) || alsOf.set(id, []).get(id)).push(r); });
    place.forEach((r, id) => { const p = rec.get(id), y = move(p, false); y.kw = r; if (p.living) y.living = true; y.line = lineOfRel(r); y.sKw = id;
      if (p.linkAt) { const sp = occ.get(id); if (sp !== id && p.linkAt[sp] !== undefined) { y.link = p.linkAt[sp]; y.st = worst(p.st, y.link); } /* st = the weakest of being and this step */
        const la = {}; (alsOf.get(id) || []).forEach(ar => { const v = p.linkAt[aliasS.get(ar)] ?? (aliasS.get(ar) === id ? p.link : undefined); if (v !== undefined) la[ar] = v; });
        if (Object.keys(la).length) y.linkAt = la; else delete y.linkAt; }
      PEOPLE.push(y); });
    aliasAt.forEach((t, r) => PEOPLE.push({ kw: r, alias: t }));
    PEOPLE.sort((a, b) => a.kw - b.kw);

    /* the families of the focus: kw 8–15, named after their surname; the intro of the same family in s when there is one */
    const byRel = new Map(PEOPLE.filter(p => !p.alias).map(p => [p.kw, p])), aliasRel = new Map(PEOPLE.filter(p => p.alias).map(p => [p.kw, p.alias]));
    const at = k => byRel.get(k) || byRel.get(aliasRel.get(k)) || null;
    const LINES = {};
    for (let k = 8; k <= 15; k++) { const p = at(k); if (!p) continue;
      const src = Object.values(S.LINES || {}).find(l => (l.stem || []).includes(p.sKw)) || null;
      LINES[k] = { name: surname(p.n), sub: src && src.sub || "", region: src && src.region || "", intro: "", stem: [k], head: p }; }
    /* the same surname twice (two branches, or quarter loss): add the first name of the one who heads the family, "Bakker (Wouter)" */
    const tel = {}; Object.values(LINES).forEach(l => { tel[l.name] = (tel[l.name] || 0) + 1; });
    Object.values(LINES).forEach(l => { if (tel[l.name] > 1) l.name += ` (${l.head.roep || String(l.head.n || "").split(/\s+/)[0]})`; delete l.head; });

    /* the root: names only (the people in the middle can be living) */
    const pA = f.pair ? at(2) : at(1), pB = f.pair ? at(3) : null, fam = [surname((at(f.pair ? 2 : 2) || {}).n), surname((at(f.pair ? 3 : 3) || {}).n)].filter(Boolean);
    const roep = p => p ? p.roep || String(p.n || "").split(/\s+/)[0] : "";
    const root = f.pair ? [roep(pA), roep(pB)].filter(Boolean).join(" en ") : roep(pA);
    const rootFull = f.pair ? [pA, pB].filter(Boolean).map(p => p.n).join(" en ") : pA ? pA.n : "";
    const parents = f.pair ? "" : [roep(at(2)), roep(at(3))].filter(Boolean).join(" en ");
    const list = name => (S[name] || []).map(x => move(x, true)).filter(Boolean);
    /* the key is also the route prefix (without its "-"): "fp4", "fp4.andre", "fp2.marit.tijmen.jorn" */
    const slug = x => String(x).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const key = (f.pair ? "fp" : "f") + f.kw + (f.persons ? f.persons.map(x => "." + slug(x)).join("") : "");
    const persRoot = f.persons ? PEOPLE[0].n : null;               /* personal: the chosen children are the root of the titles */
    return { key, prefix: key + "-", focus: f, root: persRoot || root, rootFull: persRoot || rootFull, couple: f.pair ? rootFull : "", rootMale: f.pair ? null : f.kw % 2 === 0, brand: fam.join(" · "), parents,
      sibs: [], kids: f.pair ? PEOPLE[0].kids || [] : [], TXT: {}, PEOPLE, LINES,
      STORIES: list("STORIES"), FACTS: list("FACTS"), OPEN_QUESTIONS: list("OPEN_QUESTIONS"), CONFLICTS: list("CONFLICTS"), NOTABLES: list("NOTABLES"),
      MEDIA: list("MEDIA"), MONEY: list("MONEY"), HISTORY_TOUCH: list("HISTORY_TOUCH"), SOURCE_GROUPS: S.SOURCE_GROUPS || [],
      CHANGES: { v: (S.CHANGES || {}).v || "", newKws: ((S.CHANGES || {}).newKws || []).map(mapPos).filter(v => v !== null), updKws: ((S.CHANGES || {}).updKws || []).map(mapPos).filter(v => v !== null), removed: [] },
      toS: k => toS.get(k) ?? null, fromS: mapPos };
  }
  /* the focus number of a person seen from a start (the book, the products): the relative place, or null outside the branch */
  const kwOf = (sKw, focus) => rel(sKw, focus.pair ? Math.floor(focus.kw / 2) : focus.kw);
  Object.assign(P, { focusTree, focusRel: rel, kwOf });
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
