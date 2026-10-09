/* Front and back matter of the family book, pure: Products.bookFront(data) → { voorwerk, inhoud, nawerk, zetwerk, achterflap, surname,
   title, … }. These are the book's hooks (see build.js): the title page, colophon, "Over dit boek", table of contents, the appendices
   "In getallen" and "Begrippen", the index of names, the back cover text, the surname block of a family, and the typesetting pass over
   the finished HTML. No DOM, no globals: the same code can run on a server.
   data = the book data of one tree (as for Products.book.forTree), plus data.front: what the site derives for these pages, as plain
   values: { lede, honest: { n, genProven, yearProven }, surnames: { line: [{ naam, soort, verklaring, st, familie, familie_st, n1947,
   n2007, bron: [label] }] }, glossary: [[term, text, sourceLabel]], wage: { y, low, high, days, d, src: [label, url] }, numbers }.
   B = the options of one book (core.options(S)). The texts are Dutch (interface). */
(function (P) {
  const esc = P.bookText.esc;
  const nl = x => Number(x).toLocaleString("nl-NL");
  const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const PREFIX = /^((?:van der|van den|van de|van|de|der|den|ten|ter|te)\s+)(.+)$/;
  const LINE_KEYS = [8, 9, 10, 11, 12, 13, 14, 15];
  /* characters that are not in Caslon or Plex get a form of their own, or the pdf falls back on a system font */
  const GLYPHS = [[/→/g, "›"], [/⅓/g, "1⁄3"], [/⅔/g, "2⁄3"], [/[✩★☆]/g, "*"], [/♀/g, "(vrouw)"], [/♂/g, "(man)"]];
  /* page margins per format (inner, outer, top, bottom in mm): one reading column of ±13–15 cm; the inner margin for the binding */
  const MARGINS = { a4: [28, 46, 24, 30], foto: [26, 40, 22, 28], vierkant: [30, 26, 26, 30], trade: [24, 32, 20, 26] };
  const pageCss = format => { const [bi, bu, bo, on] = MARGINS[format] || MARGINS.a4;
    return `@page{margin:${bo}mm ${bu}mm ${on}mm ${bi}mm}@page :right{margin:${bo}mm ${bu}mm ${on}mm ${bi}mm}@page :left{margin:${bo}mm ${bi}mm ${on}mm ${bu}mm}`; };
  /* which printer takes a book of n pages in one volume (the maximum page counts of the printers) */
  const fitsPrinter = n => n <= 160 ? "Past als fotoboek bij Saal Digital (tot 160 pagina's), en als boek bij Blurb of Peecho."
    : n <= 480 ? "Te dik voor een fotoboek (Saal: tot 160 pagina's); past als gebonden boek bij Blurb (tot 480) of Peecho (tot 504)."
    : n <= 504 ? "Past alleen nog bij Peecho (hardcover tot 504 pagina's)."
    : "Te dik voor één band (meer dan 504 pagina's). Kies Standaard, minder generaties volledig, of één familie per boek.";
  /* names stay together: "Harrie de Groot" does not break between "de" and "Groot" */
  const nbsp = s => esc(s).replace(/ (de|van|der|den|ten|ter|te) (\S+)$/i, " $1 $2");
  /* a title that breaks well: "De Groot" stays together, and "·" between family names never ends a line */
  const titleHtml = s => nbsp(s).replace(/ (De|Van|Ter|Ten|Der|Den) (?=[A-Z])/g, " $1 ").replace(/ · /g, " · ");

  function bookFront(data) {
    const X = P.bookText(data), F = data.front || {}, H = F.honest || {}, LINES = data.lines || {}, STATUS = data.status || {};
    const byKw = new Map((data.people || []).map(p => [p.kw, p])), person = kw => byKw.get(kw) || null;
    const lineOf = X.lineOf, root = data.rootFull || data.root || "", thisYear = data.thisYear || new Date().getFullYear();
    const provenYear = H.yearProven && H.yearProven < 9999 ? H.yearProven : "";
    const fams = B => B.deel && B.deel.lijnen ? B.deel.lijnen : B.lijn ? [B.lijn] : LINE_KEYS.filter(l => LINES[l]);
    const firstPart = B => !B.deel || B.deel.nr === 1, lastPart = B => !B.deel || B.deel.nr === B.deel.aantal;
    const startOn = B => !!(B.start && B.start.aan);

    /* what this book covers: its families, the number of ancestors in it, and one neutral sentence when it is not the whole tree */
    function reach(B) {
      const fs = fams(B), all = LINE_KEYS.filter(l => LINES[l]).length, n = new Set((B.mensen || []).filter(kw => fs.includes(lineOf(kw)))).size;
      const names = fs.map(l => LINES[l].name), list = names.length > 1 ? names.slice(0, -1).join(", ") + " en " + names[names.length - 1] : names[0] || "";
      const start = startOn(B);
      return { fams: fs, whole: fs.length >= all && !B.lijn && !start, n, list,
        sentence: start ? `Dit boek begint bij ${B.start.naam} en volgt ${nl(n)} voorouders${B.oudste ? ` terug tot ${B.oudste}` : ""}.`
          : `Dit boek volgt ${fs.length > 1 ? "de families " : "de familie "}${list}: ${nl(n)} voorouders${B.oudste ? `, terug tot ${B.oudste}` : ""}.` };
    }
    /* title, subtitle and years of this book; the whole tree keeps its proven years (the same as the key figure) */
    function title(B) {
      const whole = reach(B).whole;
      return { titel: B.titel || `De voorouders van ${root}`, sub: B.ondertitel || "",
        jaren: whole ? (provenYear ? `${provenYear} – ${thisYear}` : "") : (B.jaren || "").replace(" - ", " – "), heel: whole };
    }
    /* the chapters of this book in the order of build(); [id, title, sub] */
    function chapters(B) {
      const h = [], last = lastPart(B), who = String(B.titel || "").replace(/^Ter herinnering aan /, "");
      if (B.delen.has("leven") && B.soort === "gedenk" && firstPart(B)) h.push(["bk-leven", "Hun leven", who]);
      if (B.delen.has("kaart") && firstPart(B)) h.push(["bk-kaart", "Waar ze woonden", "De dorpen van de families op een kaart"]);
      if (B.delen.has("kruis") && firstPart(B) && data.tree === "s" && !B.lijn && !startOn(B)) h.push(["bk-kruis", "Waar de families elkaar kruisten", "De dorpen waar beide kanten woonden"]);
      if (B.delen.has("fam")) fams(B).forEach(l => h.push(["bk-lijn-" + l, "Familie " + LINES[l].name, LINES[l].sub ? "met " + LINES[l].sub : ""]));
      if (B.delen.has("verh") && !B.lijn && last) h.push(["bk-verhalen", "Verhalen", "De rode draden door de families"]);
      if (B.delen.has("tijd") && last) h.push(["bk-tijd", "Hun tijd", "De grote geschiedenis om de families heen"]);
      if (B.delen.has("kw")) h.push(["bk-kwartierstaat", "Kwartierstaat", "Alle voorouders genummerd"]);
      if (B.delen.has("open") && last) h.push(["bk-open", "Tegenstrijdigheden en open vragen", ""]);
      if (B.delen.has("bron") && last) h.push(["bk-bronnen", "Bronnen", "Archieven en genealogieën"]);
      if (numbersOn(B)) h.push(["bk-getallen", "In getallen", "Leeftijden, namen, beroepen en plaatsen"]);
      if (B.delen.has("begr") && last) h.push(["bk-begrippen", "Begrippen", ""]);
      if (B.soort !== "foto") h.push(["bk-register", "Register van namen", ""]); /* a photo book has no profiles to point to */
      return h;
    }

    /* "Zo lees je dit boek" (not in a photo book: it has no generations, numbers or labels) */
    function howToRead(B, st) {
      const R = reach(B);
      return `  <h3 class="bk-h3">Zo lees je dit boek</h3>
  ${B.soort === "gedenk" && B.delen.has("leven") ? `<p>Het boek begint bij het leven van ${esc(String(B.titel || "").replace(/^Ter herinnering aan /, ""))}: wie ze waren, waar ze woonden en wat er over hen bewaard is. Daarna volgen hun voorouders, familie voor familie, en hun tijd.</p>` : ""}
  <p>${R.whole ? "Het boek volgt de families van het kwartier: elke overgrootouder opent een eigen familie, en daarin" : R.fams.length > 1 ? "Het boek volgt de families een voor een; in elke familie" : "In de familie"} staan de voorouders van jong naar oud, generatie na generatie. Wie verder terug ligt dan het volledige deel, staat er kort in; niemand valt weg.</p>
  <p>Elke voorouder heeft een <b>kwartiernummer</b> (kw). De vader van nummer <i>n</i> heeft 2<i>n</i>, de moeder 2<i>n</i>&nbsp;+&nbsp;1. Zo is elk nummer één plek in de stamboom, en kom je met halveren altijd terug bij het begin.</p>
  <p>Bij elke voorouder staat een <b>bewijslabel</b>: hoe sterk het bewijs is dat deze persoon bestond en de ouder is van wie eronder staat. Een zin die niet letterlijk in een bron staat, maar uit de gegevens is afgeleid, heeft het woord <span class="bk-soort">afgeleid</span>; een vermoeden heet <span class="bk-soort">hypothese</span>.</p>
  <dl class="bk-labels">${st}</dl>`;
    }
    function voorwerk(B) {
      const { titel, sub, jaren, heel } = title(B);
      return `
<section class="bk-hfst bk-titelblad" data-bk="titel">
  <p class="bk-eyebrow">Stamboom</p>
  <h1 class="bk-titel-h">${titleHtml(titel)}</h1>
  ${sub ? (() => { /* "Deel 2 van 8" on its own line, then the rest on one line; the years only once, under the ornament */
    const seg = sub.split(" · "), deel = seg.filter(x => /^Deel \d/.test(x)), rest = seg.filter(x => !/^Deel \d/.test(x) && !/^\d{4}\s*[–-]/.test(x));
    return `<p class="bk-titel-deel">${deel.map(x => `<span>${esc(x)}</span>`).join("")}${rest.length ? `<span${deel.length ? ' class="bk-titel-na"' : ""}>${nbsp(rest.join(" · ")).replace(/ · /g, " · ")}</span>` : ""}</p>`; })() : ""}
  ${heel && data.brand ? `<p class="bk-titel-fam">${esc(data.brand)}</p>` : ""}
  <p class="bk-orn" aria-hidden="true"><span class="bk-ruit"></span></p>
  ${jaren ? `<p class="bk-titel-jaren">${jaren}</p>` : ""}
</section>
<section class="bk-hfst bk-colofon" data-bk="colofon">
  <p><i>${esc(titel)}</i>${sub ? `<br>${esc(sub)}` : ""}</p>
  <p>Samengesteld uit akten, registers, bidprentjes en kranten in openbare archieven. Bij elk gegeven staat hoe sterk het bewijs is, en waar het vandaan komt.</p>
  <p>Van levende familieleden staan in dit boek alleen de namen.</p>
  ${B.keuzes && B.keuzes.length ? `<p class="bk-lbl">In deze uitgave</p><ul class="bk-colofon-keuzes">${B.keuzes.map(k => `<li>${esc(k)}</li>`).join("")}</ul>` : ""}
  <p>Gezet in Libre Caslon en IBM Plex.<br>${esc(data.version || "")}.</p>
</section>`;
    }
    function inleiding(B) {
      const { titel } = title(B), R = reach(B), lede = R.whole ? F.lede || "" : R.sentence;
      const st = ["A", "B", "C", "D"].filter(k => STATUS[k]).map(k => `<div><dt><span class="bk-st">${k}</span> ${esc(STATUS[k].label)}</dt><dd>${esc(STATUS[k].long)}</dd></div>`).join("");
      return `
<section class="bk-hfst bk-inleiding" data-bk="inleiding" id="bk-inleiding" data-kop-l="${esc(titel)}" data-kop-r="Over dit boek">
  <h2 class="bk-h2">Over dit boek</h2>
  ${(B.soort === "foto" && P.bookPhoto ? P.bookPhoto(data, B.S).intro : lede) ? `<p class="bk-lede bk-ini">${esc(B.soort === "foto" && P.bookPhoto ? P.bookPhoto(data, B.S).intro : lede)}</p>` : ""}
  <div class="bk-kern">${R.whole ? `
    <div><b>${nl(H.n || 0)}</b><span>voorouders</span></div>
    <div><b>${H.genProven || 0}</b><span>generaties bewezen</span></div>
    ${provenYear ? `<div><b>${provenYear}</b><span>oudste bewezen jaar</span></div>` : ""}` : `
    <div><b>${nl(R.n)}</b><span>voorouders in dit boek</span></div>
    <div><b>${R.fams.length}</b><span>${R.fams.length === 1 ? "familie" : "families"}</span></div>
    ${B.oudste ? `<div><b>${B.oudste}</b><span>oudste bewezen jaar</span></div>` : ""}`}
  </div>
  ${B.soort === "foto" ? "" : howToRead(B, st)}
</section>`;
    }
    const inhoud = B => `
<section class="bk-hfst bk-inhoud" data-bk="inhoud" id="bk-inhoud">
  <h2 class="bk-h2">Inhoud</h2>
  <ol class="bk-toc">
    ${firstPart(B) ? `<li><a class="bk-ref" href="#bk-inleiding"><span class="bk-toc-t">Over dit boek</span><span class="bk-toc-pn bk-pn" href="#bk-inleiding"></span></a></li>` : ""}
    ${chapters(B).map(([id, t, sub]) => `<li><a class="bk-ref" href="#${id}"><span class="bk-toc-t">${esc(t)}${sub ? `<small>${esc(sub)}</small>` : ""}</span><span class="bk-toc-pn bk-pn" href="#${id}"></span></a></li>`).join("")}
  </ol>
</section>
${firstPart(B) ? inleiding(B) : ""}`;
    /* the back cover: the lede of the front page (or of the family), one sentence about the book and the key figures */
    function achterflap(B) {
      B = B || { delen: new Set() };
      const R = reach(B), { jaren } = title(B);
      const lede = R.whole ? F.lede || "" : R.fams.length === 1 && LINES[R.fams[0]].intro ? LINES[R.fams[0]].intro : R.sentence;
      return `<div class="bk-flap"><p class="bk-flap-lede">${esc(lede)}</p>
  <p class="bk-flap-zin">${R.fams.length === 1 ? "De verhalen en alle voorouders van de familie" : "Per familie de verhalen en alle voorouders"}, van jong naar oud. Bij elk gegeven staat waar het vandaan komt, en hoe zeker het is.</p>
  <p class="bk-flap-kern">${nl(R.whole ? H.n || 0 : R.n)} voorouders · ${R.fams.length} ${R.fams.length === 1 ? "familie" : "families"}${jaren ? ` · ${jaren}` : ""}</p></div>`;
    }

    /* where the surname of family l comes from, for the family intro */
    function surname(B, l) {
      return ((F.surnames || {})[l] || []).map(x => {
        const lab = st => st ? ` <span class="bk-st">${esc(st)}</span>` : "", fam = x.familie && !(x.familie_st === "D" && B && B.hyp === "weg");
        return `<aside class="bk-naam-blok"><p class="bk-naam-kop">De naam ${esc(x.naam)}</p>
      ${x.verklaring ? `<p>${x.soort ? `<span class="bk-naam-soort">${esc(x.soort)}</span> ` : ""}${esc(x.verklaring)}${lab(x.st)}</p>` : ""}
      ${fam ? `<p>${esc(x.familie)}${lab(x.familie_st)}</p>` : ""}
      ${x.n2007 ? `<p class="bk-naam-tel">In 2007 droegen ${nl(x.n2007)} mensen in Nederland deze naam${x.n1947 ? `; in 1947 ${nl(x.n1947)}` : ""}.</p>` : ""}
      ${x.bron && x.bron.length ? `<p class="bk-naam-bron">Bron: ${esc(x.bron.join("; "))}</p>` : ""}</aside>`;
      }).join("");
    }
    /* appendix: the glossary, with how money is converted */
    function glossary() {
      const list = (F.glossary || []).slice();
      if (F.wage) list.push(["Geldwaarde", `Bij een bedrag in guldens uit de jaren 1790–1860 staat hoeveel maand- of jaarlonen van een arbeider dat was. ${F.wage.d}`, F.wage.src && F.wage.src[0]]);
      list.sort((a, b) => a[0].localeCompare(b[0], "nl"));
      return `<section class="bk-hfst bk-begrippen" data-bk="begrippen" id="bk-begrippen" data-kop-l="Begrippen" data-kop-r="Begrippen">
  <h2 class="bk-h2">Begrippen</h2>
  <p class="bk-begr-uitleg">Woorden uit de akten en uit de stamboom.</p>
  <dl class="bk-begr">${list.map(([t, u, b]) => `<div class="bk-begr-it"><dt>${esc(t)}</dt><dd>${esc(u)}${b ? ` <span class="bk-begr-bron">Bron: ${esc(b)}</span>` : ""}</dd></div>`).join("")}</dl>
</section>`;
    }
    /* appendix: the family in numbers, two pages; only the dead count, and only in a book of the whole tree (not one family,
       not from another start, in parts only in the last) */
    const numbersOn = B => B.delen.has("getal") && !!F.numbers && !B.lijn && !startOn(B) && lastPart(B);
    function numbers() {
      const N = F.numbers, r0 = x => x == null ? "–" : Math.round(x).toLocaleString("nl-NL"), r1 = x => x == null ? "–" : (Math.round(x * 10) / 10).toLocaleString("nl-NL");
      const pct = (a, b) => b ? Math.round(a / b * 100) + "%" : "–";
      const duo = (a, la, b, lb) => `<div class="bk-getal-duo"><div><b>${a}</b><span>${la}</span></div><div><b>${b}</b><span>${lb}</span></div></div>`;
      const bars = (rows, fmt = v => v) => { const mx = Math.max(1, ...rows.map(r => r[1]));
        return `<ol class="bk-getal-balk">${rows.map(([l, v]) => `<li><span class="bk-gb-l">${esc(l)}</span><span class="bk-gb-t"><i style="width:${(v / mx * 100).toFixed(1)}%"></i></span><span class="bk-gb-v">${fmt(v)}</span></li>`).join("")}</ol>`; };
      const block = (t, inner) => `<div class="bk-getal-blok"><h3 class="bk-h3">${t}</h3>${inner}</div>`;
      const st = ["A", "B", "C", "D"].filter(k => STATUS[k]).map(k => [`${k} · ${STATUS[k].label}`, (N.status || {})[k] || 0]);
      const p1 = [
        block("Leven en sterven", duo(r0(N.lifeM.avg), `jaar · ${N.lifeM.n} mannen`, r0(N.lifeF.avg), `jaar · ${N.lifeF.n} vrouwen`)
          + `<p class="bk-getal-zin">Gemiddelde leeftijd bij overlijden.${N.oldest.length ? ` Het oudst werden ${N.oldest.map(x => `${esc(x.n)} (${x.age})`).join(", ")}.` : ""}</p>`),
        block("Trouwen", duo(r1(N.ageM.avg), "jaar · bruidegom", r1(N.ageF.avg), "jaar · bruid")
          + `<p class="bk-getal-zin">${N.topMonth ? `De meeste huwelijken vielen in ${N.topMonth.name}: ${N.topMonth.v} van de ${N.topMonth.n} (${pct(N.topMonth.v, N.topMonth.n)}). ` : ""}${N.bigFamily ? `Het grootste bekende gezin: ${esc(N.bigFamily.m)} en ${esc(N.bigFamily.f)}, met ${N.bigFamily.kids} kinderen.` : ""}</p>`),
        block("Generaties", `<p class="bk-getal-zin">Een generatie duurde gemiddeld ${r1(N.genAvg)} jaar: ongeveer ${r1(100 / N.genAvg)} generaties per eeuw.${N.youngMother ? ` De jongste moeder was ${esc(N.youngMother.n)}, ${N.youngMother.v} jaar.` : ""}${N.oldFather ? ` De oudste vader was ${esc(N.oldFather.n)}, ${N.oldFather.v} jaar.` : ""}</p>`),
        block("Bewijs", `<p class="bk-getal-zin">Hoe sterk het bewijs is voor de ${nl(N.nDead)} overleden voorouders.</p>${bars(st)}`)];
      const p2 = [
        block("Namen", `<div class="bk-getal-twee"><div><p class="bk-getal-sub">Mannen</p>${bars(N.namesM)}</div><div><p class="bk-getal-sub">Vrouwen</p>${bars(N.namesF)}</div></div>`),
        block("Werk", `<p class="bk-getal-zin">${N.nOcc} voorouders met een bekend beroep.</p>${bars(N.occ, v => pct(v, N.nOcc))}`),
        block("Plaatsen", `${bars(N.places)}${N.moves ? `<p class="bk-getal-zin">Van geboorte- tot sterfplaats was het meestal ${r0(N.moveMedian)} km; ${pct(N.within20, N.moves)} stierf binnen 20 km van de plaats waar ze geboren waren.</p>` : ""}`)];
      return `<section class="bk-hfst bk-getallen" data-bk="getallen" id="bk-getallen" data-kop-l="In getallen" data-kop-r="In getallen">
  <div class="bk-getal-p"><h2 class="bk-h2">In getallen</h2><p class="bk-getal-uitleg">Alleen over de overleden voorouders.</p>${p1.join("")}</div>
  <div class="bk-getal-p bk-getal-p2">${p2.join("")}</div>
</section>`;
    }
    /* the appendices, the index of names (with page numbers from the layout) and a last page for what comes after */
    function nawerk(B) {
      const fs = fams(B), inBook = new Set((B.mensen || []).filter(kw => fs.includes(lineOf(kw))));
      const key = p => { const sn = X.splitName(p.n), sur = sn.sur, m = sur ? PREFIX.exec(sur) : null, given = [].concat(sn.given || []).join(" ");
        return sur ? (m ? m[2] + ", " + given + " " + m[1].trim() : sur + ", " + given) : p.n; };
      const rows = [...inBook].map(person).filter(Boolean).map(p => [key(p), p]).sort((a, b) => norm(a[0]).localeCompare(norm(b[0]), "nl") || a[1].kw - b[1].kw);
      const group = {}; rows.forEach(([k, p]) => { const L = (norm(k)[0] || "?").toUpperCase(); (group[L] = group[L] || []).push([k, p]); });
      const item = ([k, p]) => `<a class="bk-ref bk-reg" href="#bk-kw-${p.kw}"><span class="bk-reg-n">${esc(k)}</span>${p.living ? "" : `<span class="bk-reg-j">${esc(X.lifeYears(p))}</span>`}<span class="bk-reg-pn bk-pn" href="#bk-kw-${p.kw}"></span></a>`;
      return `${numbersOn(B) ? numbers() : ""}${B.delen.has("begr") && lastPart(B) ? glossary() : ""}
${B.soort === "foto" ? "" : `<section class="bk-hfst bk-register" data-bk="register" id="bk-register" data-kop-l="Register" data-kop-r="Register van namen">
  <h2 class="bk-h2">Register van namen</h2>
  <p class="bk-reg-uitleg">Achternaam, voornaam; vóór 1811 vaak het patroniem. Het getal is de pagina van het profiel.</p>
  ${Object.keys(group).map(L => `<div class="bk-reg-l"><span class="bk-reg-begin"><h3 class="bk-reg-letter">${L}</h3>${group[L].slice(0, 2).map(item).join("")}</span>${group[L].slice(2).map(item).join("")}</div>`).join("")}
</section>`}
<section class="bk-hfst bk-slot" data-bk="slot">
  <h2 class="bk-h2">Voor wie na ons komt</h2>
  <p class="bk-slot-uitleg">Ruimte voor de namen, data en verhalen die na dit boek komen.</p>
  <div class="bk-lijnen">${"<i></i>".repeat(18)}</div>
</section>`;
    }

    /* an amount in guilders gets its value in wages, as on the site: the same rule (one year between 1790 and 1860 in the sentence,
       not two amounts), without "≈" (not in Caslon) */
    function wageLabel(amt) {
      const W = F.wage, yr1 = W.high * W.days, yr2 = W.low * W.days, a = amt / yr1, b = amt / yr2;
      const span = (x, y, one, many) => { const q1 = Math.round(x), q2 = Math.round(y); return q1 === q2 ? `${q1} ${q1 === 1 ? one : many}` : `${q1} à ${q2} ${many}`; };
      if (b < 1) { const m1 = amt / (yr1 / 12), m2 = amt / (yr2 / 12); return m2 < 1 ? "" : span(Math.max(m1, 1), m2, "maandloon", "maandlonen"); }
      return span(Math.max(a, 1), b, "jaarloon", "jaarlonen");
    }
    function money(text) {
      if (!F.wage || !/gulden/.test(text)) return text;
      return text.split(/(?<=[.;!?])(?=\s)/).map(sen => {
        const ys = (sen.match(/\b1[6-9]\d\d\b/g) || []).map(Number);
        if (!ys.length || ys.some(y => y < 1790 || y > 1860)) return sen;
        return sen.replace(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{2}))?\s+gulden\b(?:\s+per\s+jaar)?/g, (m, a, c, off, str) => {
          if (/\d\s+(?:en|tegen|of|tot)\s+$/.test(str.slice(0, off))) return m;
          const amt = +a.replace(/\./g, "") + (c ? +c / 100 : 0), lab = amt >= 20 ? wageLabel(amt) : "";
          return lab ? `${m} <span class="bk-geld">(ongeveer ${lab} van een arbeider)</span>` : m;
        });
      }).join("");
    }
    /* the typesetting pass over the text (never the markup): typographic quotes ('x' → ‘x’, Boersma's → Boersma’s), glyphs that the
       fonts lack, and the money value */
    const zetwerk = html => String(html).replace(/>([^<]*)</g, (m, t) => ">" + money(GLYPHS.reduce((x, [re, v]) => x.replace(re, v), t)
      .replace(/&#39;(?=(t|s|k|n)\b)/g, "’").replace(/(^|[\s(\[—–])&#39;/g, "$1‘").replace(/&#39;/g, "’")
      .replace(/(^|[\s(\[—–])&quot;/g, "$1“").replace(/&quot;/g, "”")) + "<");

    return { voorwerk, inhoud, nawerk, zetwerk, achterflap, surname, naam: surname, title, reach, chapters, numbersOn, money };
  }
  Object.assign(bookFront, { pageCss, fitsPrinter, nbsp, titleHtml, MARGINS });
  P.bookFront = bookFront;
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
