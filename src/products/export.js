/* Export of product pages to files, in the browser (GitHub Pages: no server).
   - svgToPng(svg, { width, height, fit, background }) → Promise<Blob>: one page (an SVG string in mm, as the renderers make them)
     as a PNG of width × height pixels. An SVG drawn as an image loads nothing from outside, so the print fonts go in as data URIs
     and every <image> is inlined first. fit "cover" (default) fills the pixels and cuts what sticks out evenly; "contain" keeps all.
   - exportPngs(doc, { px: [w, h] | dpi, type: "image/png" | "image/jpeg", quality (jpeg, default 0.92), onProgress }) → Promise<[{ name, blob }]>: every page of a document; px for a producer
     that asks for exact pixels (Kaartje2go 2220 × 3080), else dpi (default 300) on the page size with bleed. The result has
     missingImages: how many different images could not be read and are left empty (from file:// the browser may not read img/).
   - zipFiles([{ name, blob }]) → Promise<Blob>: a plain zip (stored, no compression: PNG is already compressed), so a set of
     48 cards is one download.
   - saveBlob(blob, filename): save a file (a link with download).
   Uses window, document, fetch and canvas: browser only. The renderers stay pure. */
(function (P) {
  if (typeof window === "undefined") return;
  const MM = 25.4;
  const blobToDataUrl = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
  const fetchDataUrl = async url => blobToDataUrl(await (await fetch(url)).blob());

  /* the print fonts as one block of @font-face rules with data URIs (latin and latin-ext only: enough for Dutch, Frisian and
     German names), fetched once */
  let fontCss = null;
  function fontFaces() {
    if (fontCss) return fontCss;
    const urls = (P.PRINT_FONT_URLS || []).map(u => /^https?:/.test(u) ? u : "https://fonts.googleapis.com/css2?family=" + u + "&display=block");
    fontCss = Promise.all(urls.map(async u => {
      const css = await (await fetch(u)).text(), out = [];
      for (const block of css.split(/(?=\/\*)/)) {
        if (!/\/\*\s*latin(-ext)?\s*\*\//.test(block)) continue;
        const face = /@font-face\s*{[^}]*}/.exec(block); if (!face) continue;
        const src = /url\(([^)]+)\)/.exec(face[0]); if (!src) continue;
        out.push(face[0].replace(src[0], `url(${await fetchDataUrl(src[1].replace(/["']/g, ""))})`));
      }
      return out.join("\n");
    })).then(parts => parts.join("\n")).catch(e => { fontCss = null; throw e; });
    return fontCss;
  }
  /* every <image href="…"> as a data URI (same site, or a host that allows it) */
  async function inlineImages(svg, missing) { /* missing: a Set that collects the images that could not be read (file://, a host without CORS) */
    const hrefs = [...new Set([...svg.matchAll(/<image\b[^>]*?\bhref="([^"]+)"/g)].map(m => m[1]).filter(h => !/^data:/.test(h)))];
    const map = new Map(await Promise.all(hrefs.map(async h => { try { const r = await fetch(new URL(h.replace(/&amp;/g, "&"), document.baseURI).href); if (!r.ok) throw new Error(r.status); return [h, await blobToDataUrl(await r.blob())]; } catch (e) { if (missing) missing.add(h); return [h, h]; } })));
    return svg.replace(/(<image\b[^>]*?\bhref=")([^"]+)(")/g, (m, a, h, z) => a + (map.get(h) || h) + z);
  }
  async function svgToPng(svg, o = {}) {
    const W = Math.round(o.width), H = Math.round(o.height);
    const vb = /viewBox="([\d.\s-]+)"/.exec(svg), [, , vw, vh] = vb ? vb[1].trim().split(/\s+/).map(Number) : [0, 0, W, H];
    let s = await inlineImages(svg, o.missing);
    const css = await fontFaces().catch(() => "");
    s = s.replace(/<svg\b([^>]*)>/, (m, at) => `<svg${at.replace(/\s(width|height)="[^"]*"/g, "")} width="${vw}" height="${vh}"><style>${css}</style>`);
    if (!/xmlns=/.test(s)) s = s.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    const url = URL.createObjectURL(new Blob([s], { type: "image/svg+xml" }));
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("svg image failed")); i.src = url; });
      if (img.decode) await img.decode().catch(() => { });
      const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
      g.fillStyle = o.background || "#ffffff"; g.fillRect(0, 0, W, H);
      const k = (o.fit === "contain" ? Math.min : Math.max)(W / vw, H / vh), dw = vw * k, dh = vh * k;
      g.imageSmoothingQuality = "high"; g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      return await new Promise(res => c.toBlob(res, o.type || "image/png", o.quality ?? 0.92)); /* type "image/jpeg": much smaller (a JPEG has no transparency: the background is filled) */
    } finally { URL.revokeObjectURL(url); }
  }
  async function exportPngs(doc, o = {}) {
    const pg = doc.page || { w: 100, h: 150, bleed: 0 }, Wmm = pg.w + 2 * (pg.bleed || 0), Hmm = pg.h + 2 * (pg.bleed || 0), dpi = o.dpi || 300;
    const [W, H] = o.px || [Wmm / MM * dpi, Hmm / MM * dpi], out = [], pages = doc.pages || [], missing = new Set();
    /* file names: o.name(page, i) or "<prefix>-01-steggerda-voorkant.png" (prefix: o.prefix, default "blad") */
    const slug = n => String(n).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const ext = o.type === "image/jpeg" ? "jpg" : "png";
    const nameOf = o.name || ((pg2, i) => `${o.prefix || "blad"}-${String(i + 1).padStart(2, "0")}-${slug(pg2.name || "")}.${ext}`);
    for (let i = 0; i < pages.length; i++) {
      out.push({ name: nameOf(pages[i], i), blob: await svgToPng(pages[i].svg, { width: W, height: H, fit: o.fit, missing, type: o.type, quality: o.quality }) });
      if (o.onProgress) o.onProgress(i + 1, pages.length);
    }
    out.missingImages = missing.size; /* images that could not go in (e.g. from file://): the UI can say so */
    return out;
  }
  /* a minimal zip writer (method "stored"), enough for a set of images */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u => { let c = 0xffffffff; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  async function zipFiles(files) {
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;
    for (const f of files) {
      const name = enc.encode(f.name), data = new Uint8Array(await f.blob.arrayBuffer()), crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
      parts.push(h.buffer, name, data);
      const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(12, dt, true); c.setUint16(14, dd, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(c.buffer, name); off += 30 + name.length + data.length;
    }
    const size = central.reduce((s, x) => s + (x.byteLength || x.length), 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, e.buffer], { type: "application/zip" });
  }
  function saveBlob(blob, filename) {
    const a = document.createElement("a"), url = URL.createObjectURL(blob); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  Object.assign(P, { svgToPng, exportPngs, exportPng: exportPngs, zipFiles, zip: zipFiles, saveBlob });
})(typeof window !== "undefined" ? (window.Products = window.Products || {}) : (globalThis.Products = globalThis.Products || {}));
