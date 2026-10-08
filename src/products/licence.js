/* Licences: may an image go on a product, and with which credit? Pure functions, no DOM.
   For now every image may be used, always with a credit (Harrie, 8 Oct 2026). With strict = true (planned for a paid version)
   only CC0, public domain, CC BY and CC BY-SA are allowed. */
(function (P) {
  /* the licence family of a free-text licence field */
  function licenceKind(lic) {
    const s = String(lic || "").toLowerCase();
    if (!s.trim()) return "unknown";
    if (/\bnc\b|by-nc|non-?commercial/.test(s)) return "nc";
    if (/\bcc0\b/.test(s)) return "cc0";
    if (/public ?domain|publiek domein|publicdomain|\bpdm\b|geen auteursrecht/.test(s)) return "pd";
    if (/by-sa|by sa/.test(s)) return "by-sa";
    if (/\bcc[- ]by\b|\bby \d/.test(s)) return "by";
    if (/©|copyright|rechten bij/.test(s)) return "copyright";
    return "unknown";
  }
  /* a short licence name for the credit line */
  function licenceName(lic) {
    const k = licenceKind(lic), v = (String(lic || "").match(/\b(\d\.\d)\b/) || [])[1];
    return { cc0: "CC0", pd: "publiek domein", "by-sa": `CC BY-SA${v ? " " + v : ""}`, by: `CC BY${v ? " " + v : ""}`,
      nc: String(lic).replace(/^foto\s+/i, "").trim(), copyright: String(lic).trim(), unknown: "" }[k];
  }
  const STRICT_OK = new Set(["cc0", "pd", "by", "by-sa"]);
  /* licenceFor(image, { strict }) → { allowed, credit, kind, reason } */
  function licenceFor(im, o = {}) {
    const kind = licenceKind(im && im.lic), allowed = !o.strict || STRICT_OK.has(kind);
    const maker = String((im && im.maker) || "").trim(), source = String((im && (im.sourceName || im.bronNaam)) || "").trim();
    const name = licenceName(im && im.lic);
    const credit = [maker && !/^onbekend/i.test(maker) ? maker : "", name, source && source !== maker ? source : ""].filter(Boolean).join(", ");
    return { allowed, kind, credit: credit ? "Beeld: " + credit : "", reason: allowed ? "" : `licentie ${name || "onbekend"}` };
  }
  Object.assign(P, { licenceKind, licenceName, licenceFor });
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
