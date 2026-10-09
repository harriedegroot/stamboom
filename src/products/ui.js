/* Product configurator: the one page layout for everything under "Laten maken" (the book first, then poster, calendar, cards …).
   Wide screens: the preview on the left, sticky, and the numbered steps on the right, with a sticky action bar at the bottom of the
   steps. Only the page scrolls (one scroll bar per layer). Narrow screens: two tabs, "Keuzes" and "Voorbeeld", and the action bar
   fixed at the bottom of the screen. This file only renders and wires the shell; each product fills it with its own steps,
   preview and actions. Interface texts are Dutch.
   spec = { eyebrow, title, lede, intro?, crumbs?: html (Products.ui.crumbs: breadcrumb plus "Ander product"), or crumb?: [{ label, go, href }] and other?: { label, go, href } as a plain fallback, steps: [{ id, title, summary?, collapsed?, open?, html }], preview: html, actions: { status, buttons, help } }
   The product choice itself lives on the hub (#maak); a product page has a breadcrumb back to it ("Laten maken › Boek") and a button
   "Ander product". The links keep the start person in their route. */
(function (P) {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let tabNow = "keuzes"; /* remembered while the page is re-rendered after a choice */
  function step(s, n) {
    const head = `<span class="pc-n" aria-hidden="true">${n}</span><span class="pc-t">${esc(s.title)}</span>`;
    if (s.collapsed) return `<details class="pc-step" data-step="${esc(s.id)}"${s.open ? " open" : ""}><summary class="pc-step-h">${head}${s.summary ? `<span class="pc-sum">${esc(s.summary)}</span>` : ""}</summary><div class="pc-body">${s.html}</div></details>`;
    return `<section class="pc-step" data-step="${esc(s.id)}" aria-labelledby="pc-h-${esc(s.id)}"><h2 class="pc-step-h" id="pc-h-${esc(s.id)}">${head}</h2><div class="pc-body">${s.html}</div></section>`;
  }
  function render(host, spec) {
    const tab = tabNow;
    host.innerHTML = `<div class="pc" data-tab="${tab}">
      <div class="pc-kop">${spec.crumbs ? spec.crumbs : (spec.crumb || []).length ? `<nav class="pc-kruimel" aria-label="Kruimelpad"><ol>${spec.crumb.map(c => `<li><a href="#${esc(c.href || c.go)}" data-go="${esc(c.go)}">${esc(c.label)}</a></li>`).join("")}<li aria-current="page">${esc(spec.title)}</li></ol></nav>` : spec.eyebrow ? `<div class="eyebrow">${esc(spec.eyebrow)}</div>` : ""}
        <div class="pc-titelrij"><h1 class="page-title">${esc(spec.title)}</h1>${spec.other && !spec.crumbs ? `<a class="btn pc-ander" href="#${esc(spec.other.href || spec.other.go)}" data-go="${esc(spec.other.go)}">${esc(spec.other.label)}</a>` : ""}</div>${spec.lede ? `<p class="lede">${esc(spec.lede)}</p>` : ""}${spec.intro || ""}</div>
      <div class="pc-tabs" role="tablist" aria-label="Keuzes of voorbeeld">
        <button type="button" role="tab" id="pc-tab-keuzes" aria-controls="pc-keuzes" aria-selected="${tab === "keuzes"}" data-pctab="keuzes">Keuzes</button>
        <button type="button" role="tab" id="pc-tab-voorbeeld" aria-controls="pc-voorbeeld" aria-selected="${tab === "voorbeeld"}" data-pctab="voorbeeld">Voorbeeld</button>
      </div>
      <div class="pc-grid">
        <section class="pc-voorbeeld" id="pc-voorbeeld" role="tabpanel" aria-labelledby="pc-tab-voorbeeld">${spec.preview || ""}</section>
        <div class="pc-keuzes" id="pc-keuzes" role="tabpanel" aria-labelledby="pc-tab-keuzes">${(spec.steps || []).filter(s => s && s.html).map((s, i) => step(s, i + 1)).join("")}
          <div class="pc-acties" role="region" aria-label="Maken">${spec.actions ? `<div class="pc-status">${spec.actions.status || ""}</div><div class="pc-knoppen">${spec.actions.buttons || ""}${spec.actions.help || ""}</div>` : ""}</div>
        </div>
      </div></div>`;
    const root = host.firstElementChild;
    root.querySelectorAll("[data-pctab]").forEach(b => b.addEventListener("click", () => setTab(root, b.dataset.pctab)));
    root.querySelector(".pc-tabs").addEventListener("keydown", e => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const nxt = tabNow === "keuzes" ? "voorbeeld" : "keuzes"; setTab(root, nxt); root.querySelector(`[data-pctab="${nxt}"]`).focus(); e.preventDefault();
    });
    return root;
  }
  function setTab(root, tab) {
    tabNow = tab; root.dataset.tab = tab;
    root.querySelectorAll("[data-pctab]").forEach(b => { const on = b.dataset.pctab === tab; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
  }
  /* ---- wizard: one step at a time, the other steps as summary lines, the preview next to it ----
     spec = the fields of configurator (title, lede, intro, crumbs, preview, actions) plus
       steps: [{ id, title (short step name), question (heading above the choices), summary (line in the summary), html, done?, skip? }],
       current: id of the step on screen,
       href(id): the hash of that step (with or without "#", with the tree prefix); summary lines, Terug and Volgende are plain
                 links to it, so sharing, back and forward work and the product binds nothing for the navigation,
       more?: { label, html, open } — a fold-out "Zelf kiezen" under the current step, for the finer choices,
       voor?: { label, sub?, kleuren? } — one fixed line (kleuren: the colours of the branch as a small strip) at the top of the sidebar: "Voor: <b>label</b> (sub) · Andere familie"; the button
                 (data-fk-wijzig) opens the family choice in the header (the one global choice; bound by the site),
       previewKey?: a string for the state the preview shows. When the host already holds a wizard with the same key (only the step
                 changed), the preview, the status and the product's buttons stay as they are (a book preview takes seconds to
                 build; an iframe reloads when it is moved) and only the steps and Terug / Volgende are replaced; root.dataset.kept = "1".
     The steps before and after the current one stay summary lines in their own order. Skipped steps are not shown and Terug /
     Volgende jump over them. After a click on Terug, Volgende or a summary line the heading of the new step gets the focus.
     The preview box carries --pc-h: the height available for the preview (px), kept up to date on resize. */
  let focusStep = false;
  const hrefOf = (spec, id) => { const h = String(spec.href ? spec.href(id) : ""); return h[0] === "#" ? h : "#" + h; };
  function wizard(host, spec) {
    const steps = (spec.steps || []).filter(s => s && !s.skip);
    const i = Math.max(0, steps.findIndex(s => s.id === spec.current)), cur = steps[i], prev = steps[i - 1], next = steps[i + 1];
    const line = s => `<li><a class="pw-sum" href="${esc(hrefOf(spec, s.id))}" data-pw-nav><span class="pw-sum-t">${s.done ? `<span class="pw-ok" aria-hidden="true">✓</span>` : ""}${esc(s.title)}</span><span class="pw-sum-v">${esc(s.summary || "")}</span><span class="pw-wijzig">wijzig<span class="sr-only"> ${esc(s.title)}</span></span></a></li>`;
    const list = a => a.length ? `<ol class="pw-lijst">${a.map(line).join("")}</ol>` : "";
    const nav = `<div class="pw-nav">${prev ? `<a class="btn" href="${esc(hrefOf(spec, prev.id))}" data-pw-nav>‹&nbsp;Terug</a>` : ""}${next ? `<a class="btn primary pw-volgende" href="${esc(hrefOf(spec, next.id))}" data-pw-nav aria-label="Volgende stap: ${esc(next.title)}">Volgende&nbsp;›</a>` : ""}</div>`;
    const a = spec.actions || {}, boven = list(steps.slice(0, i)), onder = list(steps.slice(i + 1));
    const strook = spec.voor && (spec.voor.kleuren || []).length ? `<span class="vw-strook fk-strook" aria-hidden="true" style="--n:${spec.voor.kleuren.length}">${spec.voor.kleuren.map(c => `<i style="background:${esc(c)}"></i>`).join("")}</span> ` : "";
    const voor = spec.voor && spec.voor.label ? `<p class="pw-voor">${strook}<span class="pw-voor-l">Voor:</span> <b>${esc(spec.voor.label)}</b>${spec.voor.sub ? ` <span class="pw-voor-s">(${esc(spec.voor.sub)})</span>` : ""} · <button type="button" class="link" data-fk-wijzig>Andere familie</button></p>` : "";
    const stap = cur ? `<section class="pw-stap" data-step="${esc(cur.id)}" aria-labelledby="pw-h"><p class="pw-nr">Stap ${i + 1} van ${steps.length} · ${esc(cur.title)}</p><h2 class="pw-vraag" id="pw-h" tabindex="-1">${esc(cur.question || cur.title)}</h2><div class="pc-body">${cur.html || ""}</div>
            ${spec.more && spec.more.html ? `<details class="pw-meer"${spec.more.open ? " open" : ""}><summary>${esc(spec.more.label || "Zelf kiezen")}</summary><div class="pc-body">${spec.more.html}</div></details>` : ""}</section>` : "";
    const old = host.firstElementChild;
    if (spec.previewKey && old && old.classList.contains("pw") && old.dataset.pk === spec.previewKey) { /* same preview: replace only the steps */
      const k = old.querySelector(".pc-keuzes"), sb = k.querySelector(".pw-stap");
      k.querySelector(".pw-boven").innerHTML = boven; k.querySelector(".pw-onder").innerHTML = onder; const vr = k.querySelector(".pw-voor-vak"); if (vr) vr.innerHTML = voor;
      if (sb) sb.outerHTML = stap; else k.querySelector(".pw-boven").insertAdjacentHTML("afterend", stap);
      k.querySelector(".pw-nav").outerHTML = nav;
      old.dataset.kept = "1"; setTab(old, tabNow); return finish(old);
    }
    host.innerHTML = `<div class="pc pw" data-tab="${tabNow}" data-pk="${esc(spec.previewKey || "")}">
      <div class="pc-kop">${spec.crumbs || ""}<div class="pc-titelrij"><h1 class="page-title">${esc(spec.title)}</h1></div>${spec.lede ? `<p class="lede">${esc(spec.lede)}</p>` : ""}${spec.intro || ""}</div>
      <div class="pc-tabs" role="tablist" aria-label="Keuzes of voorbeeld">
        <button type="button" role="tab" id="pc-tab-keuzes" aria-controls="pc-keuzes" aria-selected="${tabNow === "keuzes"}" data-pctab="keuzes">Keuzes</button>
        <button type="button" role="tab" id="pc-tab-voorbeeld" aria-controls="pc-voorbeeld" aria-selected="${tabNow === "voorbeeld"}" data-pctab="voorbeeld">Voorbeeld</button>
      </div>
      <div class="pc-grid">
        <div class="pc-keuzes" id="pc-keuzes" role="tabpanel" aria-labelledby="pc-tab-keuzes">
          <div class="pw-voor-vak">${voor}</div>
          <div class="pw-boven">${boven}</div>
          ${stap}
          <div class="pw-onder">${onder}</div>
          <div class="pc-acties" role="region" aria-label="Maken"><div class="pc-status">${a.status || ""}</div>${nav}<div class="pc-knoppen">${a.buttons || ""}${a.help || ""}</div></div>
        </div>
        <section class="pc-voorbeeld" id="pc-voorbeeld" role="tabpanel" aria-labelledby="pc-tab-voorbeeld">${spec.preview || ""}</section>
      </div></div>`; /* the choices first in the document: the tab order begins with them; on a wide screen the preview stays on the right (grid) */
    const root = host.firstElementChild;
    root.querySelectorAll("[data-pctab]").forEach(b => b.addEventListener("click", () => setTab(root, b.dataset.pctab)));
    root.querySelector(".pc-tabs").addEventListener("keydown", e => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const nxt = tabNow === "keuzes" ? "voorbeeld" : "keuzes"; setTab(root, nxt); root.querySelector(`[data-pctab="${nxt}"]`).focus(); e.preventDefault();
    });
    return finish(root);
  }
  /* after drawing (whole or only the steps): the navigation links, the focus after a step change, the sidebar back to its top */
  function finish(root) {
    root.querySelectorAll(".pc-keuzes [data-pw-nav]").forEach(l => l.addEventListener("click", () => { focusStep = true; if (tabNow !== "keuzes") tabNow = "keuzes"; }));
    if (focusStep) { focusStep = false; const h = root.querySelector("#pw-h"); if (h) requestAnimationFrame(() => h.focus({ preventScroll: true })); }
    const k = root.querySelector(".pc-keuzes"); if (k) k.scrollTop = 0;
    previewHeight(); requestAnimationFrame(previewHeight); /* again after fonts and late content have settled */
    return root;
  }
  /* --pc-h on every preview box: the height the preview may use. In the wizard on a wide screen the sidebar and the preview fill
     the window from the top of the grid down (measured with the page at its top), so Terug / Volgende and a whole page or sheet are
     in view without scrolling: --pw-h on the wizard. On a phone the fixed action bar's height goes in --pw-bar (room below the steps). */
  function previewHeight() {
    if (typeof document === "undefined") return;
    const vast = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vast")) || 57, wide = innerWidth >= 1024;
    document.querySelectorAll(".pc").forEach(pc => {
      const v = pc.querySelector(".pc-voorbeeld"), g = pc.querySelector(".pc-grid"); if (!v || !g) return;
      let h = Math.round(innerHeight - vast - 24);
      if (pc.classList.contains("pw") && wide) h = Math.round(innerHeight - (g.getBoundingClientRect().top + scrollY) - 16);
      h = Math.max(wide ? 420 : 240, h);
      v.style.setProperty("--pc-h", h + "px"); pc.style.setProperty("--pw-h", h + "px");
      const bar = pc.querySelector(".pc-acties"); if (bar && !wide) pc.style.setProperty("--pw-bar", Math.round(bar.getBoundingClientRect().height) + "px");
    });
  }
  if (typeof addEventListener === "function") addEventListener("resize", previewHeight, { passive: true });
  P.ui = Object.assign(P.ui || {}, { configurator: render, wizard, setTab });
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
