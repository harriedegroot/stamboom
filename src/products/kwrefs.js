/* Resolver for "kw N" references in texts. Texts in the joined tree use its numbering (joinTrees renumbers "kw N"); a derived tree
   (another focus) needs other numbers, or a name when the person is not a member of that tree.
   resolveKwRefs(text, map, opts) rewrites every reference that starts with "kw":
     - "kw N", "kw. N", "kwN" (also inside parentheses and in lists "kw N en kw M"): map gives a number M → "kw M" (the original
       spelling of "kw" is kept), or a name → the name without "kw" ("(kw 12)" → "(Jan Jansen)"). An empty string drops the reference,
       together with a "· " before it or the parentheses around it.
     - "#kwN" and "#<prefix>-kwN" (hash links): a number → "#" + (opts.prefix ?? the original prefix) + "kw" + M; a name leaves the
       link as it is (it still points to the person in the whole tree).
     - left untouched: ranges and pairs ("kw N–M", "kw N-M", "kw N/M"), numbers that are not directly preceded by "kw" (so the second
       number in an old-style "kw N en M"), "kw" inside a word or id ("Molkwerum", "verhaal-kw21"), anything inside a URL, and
       references that the map does not know.
   map: a Map, a plain object or a function, from the number in the text (joined-tree number) to a number or a name.
   Pure function, no DOM: runs in the browser (Products.resolveKwRefs) and in Node (require). */
(function (P) {
  /* one pass over the text: URLs (kept), hash links, kw references; the character before "kw" is captured so ids and words are skipped */
  const RE = /(https?:\/\/[^\s)"'<>]+|www\.[^\s)"'<>]+)|#([a-z0-9]+-)?kw(\d+)\b|(^|[^\w#\/.-])kw(\.?\s?)(\d+)\b((?:\s*[\/–—-]\s*\d+)+)?/g;
  const lookup = (map, n) => {
    if (!map) return undefined;
    if (typeof map === "function") return map(n);
    if (map instanceof Map) return map.has(n) ? map.get(n) : map.get(String(n));
    return Object.prototype.hasOwnProperty.call(map, n) ? map[n] : undefined;
  };
  const isNum = v => typeof v === "number" && isFinite(v);
  function resolveKwRefs(text, map, opts = {}) {
    if (typeof text !== "string" || text.indexOf("kw") < 0) return text;
    const out = text.replace(RE, (m, url, hpre, hnum, before, sep, num, range) => {
      if (url) return m;
      if (hnum !== undefined) {
        const v = lookup(map, +hnum);
        return isNum(v) ? "#" + (opts.prefix != null ? opts.prefix : hpre || "") + "kw" + v : m;
      }
      if (range) return m; /* a range or pair: not one person */
      const v = lookup(map, +num);
      if (isNum(v)) return before + "kw" + sep + v;
      if (typeof v === "string") return before + (v ? v : "\u0000"); /* marker: an empty name drops the reference below */
      return m;
    });
    if (out.indexOf("\u0000") < 0) return out;
    return out.replace(/\s*·\s*\u0000/g, "").replace(/\s*\(\u0000\)/g, "").replace(/\(\u0000,\s*/g, "(").replace(/\s*\u0000/g, "");
  }
  Object.assign(P, { resolveKwRefs });
  if (typeof module !== "undefined" && module.exports) module.exports = { resolveKwRefs };
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
