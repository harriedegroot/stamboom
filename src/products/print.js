/* Print: the checks before printing, shared by every product and the book.
   - checkDocument(doc, data): pure rules on a made document (strings), so a server can run them too: credits present, no year
     next to the name of a living person, nothing about stillborn children on a calendar or a game.
   - checkElement(el, { mmPerPx }): in the browser, on what is shown: the smallest letter on paper in points, the fonts (loaded, and
     static: a variable font becomes a Type 3 font in a pdf from the browser, which printers often refuse) and the resolution of
     the images. mmPerPx = mm on paper per css px of el at full size (default 25.4 / 96).
   - printReport(result): the block "Klaar voor de drukker", or the points that still need attention (Dutch: interface).
   - loadPrintFonts(): the print fonts (Libre Caslon and IBM Plex, one request per weight, so Google serves static fonts). */
(function (P) {
  const MIN_PT = 6, MIN_DPI = 200, GOOD_DPI = 300;
  const VARIABLE = new Set(["public sans"]);                            /* families Google Fonts only serves as a variable font */
  P.PRINT_FONT_URLS = ["Libre+Caslon+Display", "Libre+Caslon+Text:ital,wght@0,400;0,700;1,400", "IBM+Plex+Sans:wght@400", "IBM+Plex+Sans:wght@500",
    "IBM+Plex+Sans:wght@600", "IBM+Plex+Sans:ital,wght@1,400", "IBM+Plex+Mono:wght@400", "IBM+Plex+Mono:wght@500"].map(f => `https://fonts.googleapis.com/css2?family=${f}&display=swap`);
  P.PRINT_BODY = `"IBM Plex Sans", "Public Sans", "Segoe UI", system-ui, sans-serif`;
  /* the light colours of the site, always used on paper (same values as the light tokens in style.css) */
  P.PRINT_PALETTE = Object.freeze({ paper: "#FFFFFF", ink: "#17211E", muted: "#56635E", faint: "#5E6963", rule: "#CCD5CF", sunk: "#E3E8E2",
    accent: "#1E4F74", accentInk: "#F4F8FB", gold: "#8A5C0E", land: "#F4F5EF", water: "#D6E3E8",
    l8: "#2D6D8C", l9: "#4F7631", l10: "#87569B", l11: "#9F5B26", l12: "#2A7968", l13: "#A23C55", l14: "#5F64AE", l15: "#7F6A1A" });
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nl = n => n.toFixed(1).replace(".", ",");

  /* pure: the rules that do not need a screen */
  function checkDocument(doc, data) {
    const issues = [], text = (doc.pages || []).map(p => p.svg || p.html || "").join(" ") + " " + (doc.flow || "");
    const plain = text.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
    if (/<text\b[^>]*\sstroke="(?!none)/.test(text)) issues.push("Er staat tekst met een omlijning op; in een pdf uit de browser wordt dat een Type 3-lettertype. Gebruik een vlakje achter de tekst.");
    if (/<text\b[^>]*\sfont-family="/.test(text)) issues.push("Een lettertype staat als attribuut in de svg; de stijl van de site gaat daar overheen. Zet het in style.");
    if ((doc.missingCredits || []).length) issues.push(`${doc.missingCredits.length === 1 ? "Eén beeld heeft" : doc.missingCredits.length + " beelden hebben"} geen naamsvermelding.`);
    /* living people: from people (profiles that keep them) and livingNames (profiles that leave them out, e.g. the calendar);
       a year equal to the product's own year (a calendar's 2027) is not about a person */
    const own = doc.options && Number.isInteger(+doc.options.year) ? String(doc.options.year) : null;
    const living = new Set([...(data && data.people || []).filter(p => p.living && p.n).map(p => p.n), ...(data && data.livingNames || [])]);
    living.forEach(n => {
      let at = plain.indexOf(n);
      while (at >= 0) {
        const ys = (plain.slice(at + n.length, at + n.length + 40).match(/\b(1[5-9]\d\d|20\d\d)\b/g) || []).filter(y => y !== own);
        if (ys.length) { issues.push(`Bij ${n} (levend) staat een jaartal.`); break; }
        at = plain.indexOf(n, at + n.length);
      }
    });
    if (data && (data.profile === "calendar" || data.profile === "game") && /levenloos/i.test(plain)) issues.push("Er staat iets over een levenloos geboren kind op; dat hoort niet op een kalender of spel.");
    return { issues, ok: !issues.length };
  }

  let fontsP = null;
  function loadPrintFonts() {
    if (fontsP) return fontsP;
    if (typeof document === "undefined") return (fontsP = Promise.resolve());
    const have = new Set([...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href));
    P.PRINT_FONT_URLS.forEach(u => { if (have.has(u)) return; const l = document.createElement("link"); l.rel = "stylesheet"; l.href = u; document.head.appendChild(l); });
    fontsP = !document.fonts ? Promise.resolve() : new Promise(res => setTimeout(res, 50))
      .then(() => Promise.all([[400, "IBM Plex Sans"], [600, "IBM Plex Sans"], [400, "IBM Plex Mono"], [400, "Libre Caslon Display"]].map(([w, f]) => document.fonts.load(`${w} 16px "${f}"`, "Aéë"))))
      .catch(() => {}).then(() => document.fonts.ready);
    return fontsP;
  }

  /* browser: measure what is on the screen */
  function checkElement(el, o = {}) {
    const mmPerPx = o.mmPerPx || 25.4 / 96, r = el.getBoundingClientRect(), scale = el.offsetWidth ? r.width / el.offsetWidth : 1; /* scale of the preview */
    let smallestPt = Infinity; const fams = new Map(), images = [];
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const e = n.parentElement; if (!e || e.closest("[hidden], .noprint")) continue;
      const cs = getComputedStyle(e); if (cs.display === "none") continue; /* visibility does not count: a preview behind a tab is still what gets printed */
      let px = parseFloat(cs.fontSize);
      if (e instanceof SVGElement && e.getScreenCTM) { const m = e.getScreenCTM(); if (m) px = px * Math.hypot(m.a, m.b) / scale; }
      const pt = px * mmPerPx / 25.4 * 72; if (pt < smallestPt) smallestPt = pt;
      const fam = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(), key = fam.toLowerCase();
      if (!fams.has(key)) fams.set(key, { family: fam, weights: new Set() }); fams.get(key).weights.add(cs.fontWeight);
    }
    const fonts = [...fams.values()].map(f => ({ family: f.family, static: !VARIABLE.has(f.family.toLowerCase()),
      loaded: !document.fonts || [...f.weights].every(w => document.fonts.check(`${w} 12px "${f.family}"`)) }));
    el.querySelectorAll("img").forEach(im => { const b = im.getBoundingClientRect(); if (!b.width || !im.naturalWidth) return;
      const mm = b.width / scale * mmPerPx; images.push({ src: im.currentSrc || im.src, dpi: Math.round(im.naturalWidth / (mm / 25.4)) }); });
    const issues = [], minPt = o.minPt || MIN_PT, minDpi = o.minDpi || MIN_DPI;
    if (smallestPt < minPt - 0.05) issues.push("Sommige letters zijn te klein om op papier te lezen. Kies een groter formaat of minder generaties.");
    fonts.filter(f => !f.loaded).forEach(f => issues.push("De letters zijn nog niet helemaal geladen. Wacht even, of controleer de internetverbinding."));
    fonts.filter(f => !f.static).forEach(f => issues.push("Een lettertype is niet geschikt voor drukwerk; de drukker kan de pdf weigeren."));
    const low = images.filter(b => b.dpi < minDpi);
    if (low.length) issues.push(`${low.length === 1 ? "Eén beeld wordt" : low.length + " beelden worden"} op dit formaat onscherp. Kies een kleiner formaat.`);
    return { smallestPt: isFinite(smallestPt) ? smallestPt : null, fonts, images, issues, ok: !issues.length };
  }
  /* the report shown under the actions; extra issues (from checkDocument) may be added */
  function printReport(r, extra = []) {
    const issues = [...(r.issues || []), ...extra], ok = !issues.length;
    const pt = r.smallestPt ? nl(r.smallestPt) + " pt" : "–", lowest = (r.images || []).length ? Math.min(...r.images.map(b => b.dpi)) : null;
    const facts = [`kleinste letter ${pt}`, `${r.fonts.length} ${r.fonts.length === 1 ? "lettertype" : "lettertypes"}, ${r.fonts.every(f => f.static && f.loaded) ? "vast en geladen" : "niet alles in orde"}`,
      r.images.length ? `${r.images.length} ${r.images.length === 1 ? "beeld" : "beelden"}, het laagste ${lowest} dpi${lowest >= GOOD_DPI ? "" : lowest >= MIN_DPI ? " (goed genoeg)" : ""}` : "geen foto's, alles is vector"];
    return `<div class="print-report${ok ? " ok" : ""}" role="status" title="${esc(facts.join(" · "))}"><b>${ok ? "Klaar voor de drukker" : "Let op vóór het drukken"}</b>${issues.length ? `<ul>${issues.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}</div>`;
  }
  /* one short status line, the same as the book: "✓ Klaar om af te drukken" (with bleed: "Klaar voor de drukker"); the facts in the
     title; with issues the first one, and a "toon" that opens the rest */
  function printLine(r, extra = [], o = {}) {
    const issues = [...(r.issues || []), ...extra], lowest = (r.images || []).length ? Math.min(...r.images.map(b => b.dpi)) : null;
    const facts = [`kleinste letter ${r.smallestPt ? nl(r.smallestPt) + " pt" : "–"}`, `${r.fonts.length} ${r.fonts.length === 1 ? "lettertype" : "lettertypes"}`,
      r.images.length ? `laagste ${lowest} dpi` : "alles vector"].join(" · ");
    if (!issues.length) return `<span class="bk-controle print-line" role="status" title="${esc(facts)}">✓ ${o.bleed ? "Klaar voor de drukker" : "Klaar om af te drukken"}</span>`;
    return `<details class="bk-controle bk-let-op print-line" role="status"><summary title="${esc(facts)}">! ${esc(issues[0])}${issues.length > 1 ? ` · nog ${issues.length - 1}` : ""}</summary>${issues.length > 1 ? `<ul>${issues.slice(1).map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}</details>`;
  }
  /* the one help line under "Maak pdf", the same for every product (the book too) */
  P.PRINT_HELP = "Kies in het afdrukvenster ‘Opslaan als pdf’, marges ‘geen’, achtergrond aan.";
  Object.assign(P, { checkDocument, checkElement, printReport, printLine, loadPrintFonts, PRINT_MIN_PT: MIN_PT });
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
