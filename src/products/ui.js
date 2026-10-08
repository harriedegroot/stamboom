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
  P.ui = Object.assign(P.ui || {}, { configurator: render, setTab });
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
