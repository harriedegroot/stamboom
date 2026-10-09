/* De stijlen van het boek (#boek). Ze laden alleen in het boekdocument: het voorbeeld-iframe en de drukmodus (--zuiver), nooit in de site.
   Het zijn teksten en geen .css-bestand, omdat Paged.js stylesheets ophaalt en dat onder file:// niet lukt; een <style> leest het wel.
   Drie blokken, in deze volgorde: opbouw (wat waar breekt, het voorbeeld op het scherm), typografie, en omslag en beeld.
   window.BOEK_CSS is het geheel. */
window.BOEK_CSS_OPBOUW = String.raw`/* ---- boek: opbouw ---- */
/* Basis voor de opbouw: wat waar breekt, het voorbeeld op het scherm, en een eenvoudige vorm zolang de typografie er nog niet is. */
:root{--bk-papier:#fffdf8;--bk-inkt:#1d2320;--bk-grijs:#5d6661;--bk-lijn:#d9d4c7;--lc:#6b7a73}
@page{margin:22mm 18mm 24mm 24mm}
@page :left{margin:22mm 24mm 24mm 18mm}
html{background:var(--bk-papier)}
body{margin:0;color:var(--bk-inkt);font-family:var(--bk-sans,"IBM Plex Sans",sans-serif);font-size:9.6pt;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
img{max-width:100%}
.bk-hfst{break-before:right} /* elk hoofdstuk begint rechts; een familie met een openingsbeeld begint links (de spread, zie omslag en beeld) */
.bk-fam{break-before:right}
/* compact: de kleinere hoofdstukken beginnen op de volgende pagina, links of rechts; de families blijven rechts (of als spread) */
.bk-hfst.bk-los{break-before:page}
.bk-open{min-height:200mm;display:flex;flex-direction:column;justify-content:flex-end;border-left:6mm solid var(--lc);padding:0 0 18mm 10mm}
.bk-eyebrow,.bk-rel{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:7.5pt;letter-spacing:.08em;text-transform:uppercase;color:var(--bk-grijs);margin:0 0 2mm}
.bk-h1{font-family:"Libre Caslon Display",Georgia,serif;font-weight:400;font-size:44pt;line-height:1;margin:0 0 4mm}
.bk-h2{font-family:"Libre Caslon Display",Georgia,serif;font-weight:400;font-size:18pt;line-height:1.15;margin:8mm 0 3mm}
.bk-h3{font-family:"Libre Caslon Display",Georgia,serif;font-weight:400;font-size:13pt;margin:5mm 0 2mm}
.bk-sub,.bk-regio{font-size:11pt;color:var(--bk-grijs);margin:0}
.bk-lede{font-size:11pt;line-height:1.5}
.bk-stamlijn ol{list-style:none;margin:0;padding:0;border-left:2px solid var(--lc)}
.bk-stamlijn li{padding:1.2mm 0 1.2mm 4mm}
.bk-stamlijn .bk-g{display:inline-block;width:9mm;font-family:"IBM Plex Mono",monospace;font-size:7.5pt;color:var(--bk-grijs)}
.bk-ref{color:inherit;text-decoration:none}
.bk-verhaal{break-before:page}
.bk-deel{break-inside:auto}
.bk-soort{font-family:"IBM Plex Mono",monospace;font-size:6.5pt;text-transform:uppercase;letter-spacing:.06em;color:var(--bk-grijs)}
.bk-afgeleid,.bk-hypothese,.bk-context{color:#3f4743}
.bk-st{font-family:"IBM Plex Mono",monospace;font-size:7pt;border:.5pt solid currentColor;padding:0 1.2mm;margin-left:1.5mm;vertical-align:1pt;color:var(--bk-grijs)}
.bk-gen{break-before:page}
.bk-genkop span{display:block;font-family:"IBM Plex Mono",monospace;font-size:7.5pt;letter-spacing:.08em;text-transform:uppercase;color:var(--lc);margin-top:1mm}
.bk-prof{border-top:.5pt solid var(--bk-lijn);padding-top:3mm;margin-top:4mm}
.bk-prof header{break-after:avoid}
.bk-prof-kop{break-inside:avoid} /* naam, kernzin en gegevens blijven bij elkaar */
.bk-naam{font-family:"Libre Caslon Display",Georgia,serif;font-weight:400;font-size:14pt;line-height:1.15;margin:0}
.bk-jaren{font-family:"IBM Plex Mono",monospace;font-size:8pt;color:var(--bk-grijs);margin:.8mm 0 2mm}
.bk-kort{font-style:italic;margin:0 0 2mm}
.bk-feiten{display:grid;grid-template-columns:20mm minmax(0,1fr);gap:.6mm 3mm;margin:0 0 2mm;font-size:8.8pt}
.bk-feiten div{display:contents}
.bk-feiten dt{color:var(--bk-grijs)}
.bk-feiten dd{margin:0}
.bk-noten p,.bk-gezin,.bk-bewijs{margin:0 0 1.6mm}
.bk-lbl{font-family:"IBM Plex Mono",monospace;font-size:6.8pt;letter-spacing:.06em;text-transform:uppercase;color:var(--bk-grijs);margin-right:1mm}
.bk-bewijs{font-size:8.2pt;color:#3f4743}
.bk-bronnen{margin:1.5mm 0 0;padding-left:4mm;font-size:7.4pt;line-height:1.35;color:var(--bk-grijs)}
.bk-url{font-family:"IBM Plex Mono",monospace;font-size:6.6pt;word-break:break-all}
.bk-portret{float:right;width:34mm;margin:0 0 3mm 5mm}
.bk-portret img{width:34mm;height:44mm;object-fit:cover;display:block}
.bk-bijschrift{font-size:7pt;color:var(--bk-grijs);margin-top:1mm}
.bk-levend{padding-top:2mm}
.bk-levend .bk-naam{font-size:12pt}
.bk-titel{display:flex;flex-direction:column;justify-content:center;min-height:200mm;text-align:center}
.bk-versie{font-family:"IBM Plex Mono",monospace;font-size:8pt;color:var(--bk-grijs)}
/* de generatie begint op een nieuwe pagina, met een rustige kop over de bovenste helft */
.bk-genkop{min-height:95mm;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:10mm;margin-bottom:6mm;border-bottom:.5pt solid var(--bk-lijn)}
.bk-genkop .bk-h2{font-size:30pt;margin:0 0 2mm}
.bk-gen-naam{font-family:"IBM Plex Mono",monospace;font-size:8pt;letter-spacing:.08em;text-transform:uppercase;color:var(--lc);margin:0}
.bk-prof{margin-top:7mm;padding-top:5mm}
/* korte profielen: geen nieuwe pagina per generatie; de kop is een tussenkop die bij de eerste profielen blijft */
.bk-hfst .bk-gen.bk-gen-kort{break-before:auto;margin-top:9mm}
.bk-hfst .bk-gen-kort .bk-genkop{min-height:0;padding-bottom:2mm;margin-bottom:3mm;break-after:avoid;break-inside:avoid}
.bk-hfst .bk-gen-kort .bk-genkop .bk-h2{font-size:16pt}
.bk-kortprof{display:inline-block;vertical-align:top;width:calc(50% - 4mm);margin:0 3mm 6mm 0;break-inside:avoid;border-top:.5pt solid var(--bk-lijn);padding-top:2.5mm}
.bk-kortprof .bk-naam{font-size:11.5pt}
.bk-kortprof .bk-kort{font-size:8.6pt}
.bk-plaats{font-size:8pt;color:var(--bk-grijs);margin:0 0 1mm}
.bk-bronref{font-size:8pt;color:var(--bk-grijs);margin:2mm 0 0}
.bk-verste{break-before:page;min-height:220mm;display:flex;flex-direction:column;justify-content:center;border-left:2mm solid var(--lc);padding-left:12mm}
.bk-verste-jaar{font-family:"Libre Caslon Display",Georgia,serif;font-size:96pt;line-height:1;color:var(--lc);margin:0 0 6mm}
.bk-uitleg{font-size:8.6pt;color:var(--bk-grijs)}
.bk-eindnoten{break-before:page;font-size:8pt}
/* paginanummers in inhoud en register: na de opmaak ingevuld (data-pn, zie bkPaginaNrs in app.js); target-counter is in Paged.js
   per verwijzing een rondgang langs alle pagina's, en maakt een boek van 300 pagina's minutenlang traag. Ruimte voor drie cijfers. */
.bk-pn{display:inline-block;min-width:5.2mm;text-align:right}
.bk-noten-kol{columns:2;column-gap:7mm} /* de eindnoten in twee kolommen */
.bk-noot{break-inside:avoid;margin:0 0 3mm}
.bk-noot h4{font-size:8.6pt;font-weight:600;margin:0 0 .8mm}
.bk-noot ol{margin:0;padding-left:5mm;color:#3f4743}
.bk-kw{font-family:"IBM Plex Mono",monospace;font-size:7pt;color:var(--bk-grijs);font-weight:400}
.bk-siteref{font-size:8.6pt;color:var(--bk-grijs);margin-top:8mm}
.bk-tijdlijst{display:grid;grid-template-columns:22mm minmax(0,1fr);gap:2mm 4mm;margin:0}
.bk-tijdlijst div{display:contents}
.bk-tijdlijst dt{font-family:"IBM Plex Mono",monospace;font-size:8pt;color:var(--bk-grijs)}
.bk-tijdlijst dd{margin:0}
.bk-kwlijst{columns:2;column-gap:8mm;font-size:8.4pt;padding-left:9mm;margin:0}
.bk-kwlijst li{break-inside:avoid;margin:0 0 .8mm}
.bk-tegen{margin:0}
.bk-tegen dt{font-weight:600;margin-top:2.5mm}
.bk-tegen dd{margin:0}
.bk-vragen li{margin:0 0 1.5mm}
.bk-waar,.bk-bronlijst{font-size:8pt;color:var(--bk-grijs)}
.bk-keuzes-tekst{list-style:none;padding:0;margin:10mm auto 0;max-width:120mm;font-size:8.4pt;color:var(--bk-grijs)}
/* het voorbeeld op het scherm: de pagina's onder elkaar, als vellen op tafel */
@media screen{
  html,body{background:#d8d4cb}
  .pagedjs_pages{display:flex;flex-direction:column;align-items:center;gap:8mm;padding:8mm 0}
  .pagedjs_page{background:var(--bk-papier);box-shadow:0 2px 14px rgba(0,0,0,.18)}
  body[data-druk] .pagedjs_page{outline:.3mm dashed #c33;outline-offset:-3mm}
}
`;

window.BOEK_CSS_TYPO = String.raw`/* ---- boek: typografie ---- */
/* Boektypografie: papierwit, Libre Caslon Text voor de lopende tekst, Caslon Display voor koppen, IBM Plex Sans voor gegevens,
   Plex Mono voor nummers. Eén leeskolom van ±13–15 cm met ruim wit (marges per formaat in boekPaginaCss), levende koppen
   (familie links, generatie rechts), paginanummers buiten, initialen en ornamenten in de familiekleur. */
:root{--bk-papier:#ffffff;--bk-inkt:#1a1c1b;--bk-grijs:#5a605d;--bk-fijn:#8a8f8c;--bk-lijn:#cfcac0;--bk-tekst:"Libre Caslon Text",Georgia,serif;--bk-kop:"Libre Caslon Display",Georgia,serif;--bk-sans:"IBM Plex Sans","Public Sans",system-ui,sans-serif;--bk-mono:"IBM Plex Mono",ui-monospace,monospace}
@page{margin:24mm 46mm 30mm 28mm;
  @top-left{content:none}@top-right{content:none}
  @bottom-left{content:none}@bottom-right{content:none}}
@page :right{margin:24mm 46mm 30mm 28mm;
  @top-right{content:string(kopR);font-family:var(--bk-sans);font-size:6.8pt;letter-spacing:.14em;text-transform:uppercase;color:var(--bk-grijs);vertical-align:bottom;padding-bottom:5mm}
  @bottom-right{content:counter(page);font-family:var(--bk-mono);font-size:8pt;color:var(--bk-grijs);vertical-align:top;padding-top:6mm}}
@page :left{margin:24mm 28mm 30mm 46mm;
  @top-left{content:string(kopL);font-family:var(--bk-sans);font-size:6.8pt;letter-spacing:.14em;text-transform:uppercase;color:var(--bk-grijs);vertical-align:bottom;padding-bottom:5mm}
  @bottom-left{content:counter(page);font-family:var(--bk-mono);font-size:8pt;color:var(--bk-grijs);vertical-align:top;padding-top:6mm}}
/* pagina's zonder kop en nummer: titel, colofon, lege pagina's vóór een hoofdstuk */
@page stil{@top-left{content:none}@top-right{content:none}@bottom-left{content:none}@bottom-right{content:none}}
@page :blank{@top-left{content:none}@top-right{content:none}@bottom-left{content:none}@bottom-right{content:none}}
[data-kop-l]:not([data-split-from]){string-set:kopL attr(data-kop-l)}
[data-kop-r]:not([data-split-from]){string-set:kopR attr(data-kop-r)}
html{background:var(--bk-papier)}
body{font-family:var(--bk-tekst);font-size:9.8pt;line-height:14pt;color:var(--bk-inkt);font-variant-numeric:oldstyle-nums proportional-nums;hyphens:auto;-webkit-hyphens:auto;hyphenate-limit-chars:7 3 3;orphans:3;widows:3;text-rendering:optimizeLegibility;font-kerning:normal}
body[data-formaat="foto"],body[data-formaat="trade"]{font-size:9.6pt;line-height:13.6pt}
body[data-formaat="vierkant"]{font-size:10.4pt;line-height:15pt}
p{margin:0}
/* koppen */
.bk-h1{font-family:var(--bk-kop);font-weight:400;font-size:40pt;line-height:1.02;letter-spacing:-.005em;text-wrap:balance;margin:0 0 5mm}
.bk-h2{font-family:var(--bk-kop);font-weight:400;font-size:21pt;line-height:1.1;text-wrap:balance;margin:0 0 5mm;break-after:avoid}
.bk-h3{font-family:var(--bk-kop);font-weight:400;font-size:13.5pt;line-height:1.2;margin:7mm 0 2.5mm;break-after:avoid}
.bk-eyebrow,.bk-rel,.bk-lbl,.bk-soort{font-family:var(--bk-sans);font-weight:500;font-size:6.6pt;line-height:1.3;letter-spacing:.14em;text-transform:uppercase;color:var(--bk-grijs)}
.bk-lede{font-size:12pt;line-height:17pt;color:#2b2f2d;margin:0 0 6mm;text-wrap:pretty}
/* initiaal: drie regels hoog, in de familiekleur */
.bk-intro .bk-lede::first-letter{font-family:var(--bk-kop);float:left;font-size:41pt;line-height:34pt;padding:2.2pt 2.2mm 0 0;color:var(--lc,#6b7a73)}
.bk-ini::first-letter{font-family:var(--bk-kop);float:left;font-size:41pt;line-height:34pt;padding:2.2pt 2.2mm 0 0;color:var(--lc,#6b7a73)}
/* ornament: een liggende ruit tussen twee haarlijnen */
/* ornament: een klein gedraaid vierkant tussen twee haarlijnen, getekend (geen teken, dus geen terugvalletter) */
.bk-orn{display:flex;align-items:center;justify-content:center;gap:2.2mm;margin:6mm auto 5mm;color:var(--lc,#6b7a73)}
.bk-orn::before{content:"";width:7mm;border-top:.4pt solid currentColor}
.bk-orn::after{content:"";width:7mm;border-top:.4pt solid currentColor}
.bk-ruit{display:block;width:1.7mm;height:1.7mm;background:currentColor;transform:rotate(45deg)}
.bk-deel-volg::before{content:"";display:block;width:2.1mm;height:2.1mm;margin:7mm auto 6mm;background:var(--lc,#6b7a73);transform:rotate(45deg)}
/* verhaal */
.bk-verhaal{break-before:page}
.bk-verhaal>.bk-h2{font-size:26pt;margin-top:18mm}
.bk-verhaal .bk-lede{font-style:italic}
.bk-deel p{margin:0 0 2.4mm}
.bk-noten p{margin:0 0 2.4mm}
.bk-deel .bk-h3 .bk-st{font-size:6.5pt}
.bk-soort{font-size:5.8pt;margin-left:1mm;color:var(--bk-fijn);white-space:nowrap}
/* inleiding van een familie en de stamlijn */
.bk-intro{break-before:page}
.bk-intro .bk-lede{font-size:12.5pt;line-height:18pt;margin-top:16mm}
.bk-stamlijn{margin-top:10mm}
.bk-stamlijn .bk-h2{font-size:14pt}
.bk-stamlijn ol{border-left:.6pt solid var(--lc,#6b7a73);padding-left:0;margin:0}
.bk-stamlijn li{padding:1.4mm 0 1.4mm 5mm;font-family:var(--bk-tekst);font-size:10pt}
.bk-stamlijn .bk-g{font-family:var(--bk-mono);font-size:7pt;color:var(--lc,#6b7a73);width:10mm}
.bk-stamlijn .bk-jaren{display:inline;font-size:7.5pt;margin-left:2mm}
/* generatie */
/* generaties lopen door (geen nieuwe pagina per generatie: dat liet restjes van een paar regels achter); de kop krijgt ruimte en een lijn */
.bk-gen{break-before:auto}
.bk-genkop{min-height:0;display:block;margin:16mm 0 7mm;padding:0 0 4mm;border-bottom:.6pt solid var(--lc,#6b7a73);break-inside:avoid;break-after:avoid}
.bk-genkop .bk-eyebrow{color:var(--lc,#6b7a73)}
.bk-genkop .bk-h2{font-size:30pt;margin:1.5mm 0 2mm}
.bk-gen-naam{font-family:var(--bk-sans);font-weight:500;font-size:6.8pt;letter-spacing:.16em;text-transform:uppercase;color:var(--bk-grijs);margin:0}
/* generaties met korte profielen lopen door: een kleine tussenkop met een dunne lijn in de familiekleur */
.bk-gen.bk-gen-kort{break-before:auto}
.bk-gen-kort .bk-genkop{min-height:0;display:block;margin:9mm 0 5mm;padding:0 0 2mm;border-bottom:.6pt solid var(--lc,#6b7a73);break-after:avoid}
.bk-gen-kort .bk-genkop .bk-eyebrow{display:none}
.bk-gen-kort .bk-genkop .bk-h2{display:inline;font-size:14pt;margin:0 3mm 0 0}
.bk-gen-kort .bk-gen-naam{display:inline}
/* profiel: gegevensstrook in Plex Sans, lopende tekst in Caslon, veel wit */
.bk-prof{border-top:0;padding-top:0;margin-top:11mm}
.bk-prof header{break-after:avoid;margin-bottom:3mm}
.bk-prof .bk-rel{color:var(--lc,#6b7a73);margin:0 0 1.2mm}
.bk-naam{font-family:var(--bk-kop);font-weight:400;font-size:17pt;line-height:1.1;margin:0;text-wrap:balance}
.bk-jaren{font-family:var(--bk-mono);font-size:7.8pt;letter-spacing:.02em;color:var(--bk-grijs);margin:1.2mm 0 0;font-variant-numeric:lining-nums}
.bk-st{font-family:var(--bk-mono);font-size:6.6pt;border:.5pt solid currentColor;padding:0 1.1mm;margin-left:1.6mm;vertical-align:.8pt;color:var(--bk-grijs)}
.bk-prof[data-st="A"] .bk-jaren .bk-st{color:#2a7349}.bk-prof[data-st="B"] .bk-jaren .bk-st{color:#915915}
.bk-prof[data-st="C"] .bk-jaren .bk-st{color:#5e6963}.bk-prof[data-st="D"] .bk-jaren .bk-st{color:#8a4fa0}
.bk-kort{font-style:normal;font-size:11pt;line-height:15.5pt;color:#2b2f2d;margin:0 0 3.5mm;text-wrap:pretty}
.bk-feiten{display:grid;grid-template-columns:19mm minmax(0,1fr);gap:.4mm 3mm;margin:0 0 4mm;padding:2.6mm 0;border-top:.4pt solid var(--bk-lijn);border-bottom:.4pt solid var(--bk-lijn);font-family:var(--bk-sans);font-size:7.8pt;line-height:11.5pt;font-variant-numeric:lining-nums;break-inside:avoid}
.bk-feiten dt{font-weight:500;font-size:6.4pt;letter-spacing:.12em;text-transform:uppercase;color:var(--bk-grijs);padding-top:.4pt}
.bk-noten{margin:0 0 3mm}
.bk-afgeleid,.bk-hypothese,.bk-context{color:inherit}
.bk-hypothese{color:#43394a}
.bk-gezin,.bk-bewijs{font-family:var(--bk-sans);font-size:7.8pt;line-height:11.5pt;color:#3a3f3c;margin:2.5mm 0 0}
.bk-gezin .bk-lbl,.bk-bewijs .bk-lbl{margin-right:1.5mm}
/* bronnen kort: één doorlopende, genummerde regel in kleine letters, zonder lange adressen */
.bk-bronnen{list-style:none;counter-reset:bkbron;margin:2.5mm 0 0;padding:0;font-family:var(--bk-sans);font-size:6.6pt;line-height:9.6pt;color:var(--bk-grijs);font-variant-numeric:lining-nums}
.bk-bronnen li{display:inline;counter-increment:bkbron}
.bk-bronnen li::before{content:counter(bkbron);font-family:var(--bk-mono);font-size:5.8pt;color:var(--lc,#6b7a73);margin-right:.8mm;vertical-align:.6pt}
.bk-bronnen li{margin-right:2mm}
.bk-bronnen .bk-url{display:none}
/* portret als plaat naast het profiel */
.bk-portret{float:right;width:32mm;margin:1mm 0 3mm 6mm}
.bk-portret img{width:32mm;height:41mm;object-fit:cover;filter:grayscale(.15)}
.bk-bijschrift{font-family:var(--bk-sans);font-size:6.6pt;line-height:9pt;letter-spacing:.02em;color:var(--bk-grijs);margin-top:1.6mm;font-variant-caps:all-small-caps}
/* levenden: alleen de naam */
.bk-levend{margin-top:7mm}
.bk-levend .bk-naam{font-size:13pt}
/* kort profiel voor de verste generaties: drie tot vier per pagina, twee naast elkaar */
.bk-kortprof{display:inline-block;vertical-align:top;width:calc(50% - 4mm);margin:0 0 4.5mm;break-inside:avoid}
.bk-kortprof{margin-right:3.5mm}
.bk-kortprof .bk-naam{font-size:12.5pt}
.bk-kortprof .bk-kort{font-style:normal;font-size:9.2pt;line-height:12.6pt;margin:1.5mm 0 0}
.bk-kortprof .bk-plaats{font-family:var(--bk-sans);font-size:7.4pt;color:var(--bk-grijs);margin-top:.8mm}
/* beeld als plaat: op zijn scherpe maat, gecentreerd, dunne lijn, bijschrift in kleine kapitalen */
.bk-beeld[data-maat="plaat"]{break-before:page;break-after:page;page:stil;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:200mm;margin:0}
.bk-beeld[data-maat="plaat"] img{max-width:100%;max-height:170mm;outline:.4pt solid var(--bk-lijn);outline-offset:3mm}
.bk-beeld[data-maat="plaat"] .bk-bijschrift{max-width:110mm;text-align:center;margin-top:8mm}
.bk-beeld[data-maat="half"]{margin:5mm 0}
.bk-beeld[data-maat="half"] img{width:100%}
/* kruisverwijzingen: paginanummer achter de naam (inhoud, register, stamlijn) */
.bk-pn::after{content:attr(data-pn);font-family:var(--bk-mono);font-size:7.5pt;color:var(--bk-grijs)}
.bk-ref{color:inherit;text-decoration:none}
/* titelblad, colofon, inleiding, inhoud, register, slot */
.bk-titelblad{page:stil;break-before:right;padding-top:62mm;text-align:center}
.bk-titel-h{font-family:var(--bk-kop);font-weight:400;font-size:38pt;line-height:1.08;text-wrap:balance;max-width:125mm;margin:4mm auto 6mm}
.bk-titel-fam{font-family:var(--bk-sans);font-size:8pt;letter-spacing:.2em;text-transform:uppercase;color:var(--bk-grijs);margin:0}
.bk-titel-deel{font-family:var(--bk-tekst);font-style:italic;font-size:14pt;color:var(--lc,#5a605d);margin:0 0 2mm}
.bk-titel-deel span{display:block;text-wrap:balance}
.bk-titel-deel .bk-titel-na{font-size:11.5pt;margin-top:1.5mm;color:var(--bk-grijs)}
.bk-titel-jaren{font-family:var(--bk-kop);font-size:15pt;color:var(--bk-grijs);font-variant-numeric:lining-nums}
.bk-titelblad .bk-orn{color:var(--bk-grijs);margin:9mm 0 7mm}
.bk-colofon{page:stil;break-before:page;padding-top:150mm;font-family:var(--bk-sans);font-size:7.4pt;line-height:11pt;color:var(--bk-grijs);max-width:95mm}
.bk-colofon p{margin:0 0 3mm}
.bk-colofon .bk-lbl{margin:2mm 0 1mm}
.bk-colofon-keuzes{margin:0 0 4mm;padding:0;list-style:none}
.bk-colofon-keuzes li{padding-left:3mm;text-indent:-3mm}
.bk-colofon-keuzes li::before{content:"\2013\2002"}
.bk-inleiding{break-before:right}
.bk-inleiding>.bk-h2{font-size:26pt;margin:16mm 0 8mm}
.bk-inleiding p{margin:0 0 2.4mm}
.bk-kern{display:flex;gap:10mm;margin:7mm 0 4mm;padding:4mm 0;border-top:.4pt solid var(--bk-lijn);border-bottom:.4pt solid var(--bk-lijn);break-inside:avoid}
.bk-kern b{display:block;font-family:var(--bk-kop);font-weight:400;font-size:24pt;line-height:1;font-variant-numeric:lining-nums}
.bk-kern span{font-family:var(--bk-sans);font-size:6.6pt;letter-spacing:.12em;text-transform:uppercase;color:var(--bk-grijs)}
.bk-labels{margin:4mm 0 0;font-size:9pt;line-height:13pt;break-inside:avoid}
.bk-labels div{display:grid;grid-template-columns:28mm minmax(0,1fr);gap:3mm;margin:0 0 2mm}
.bk-labels dt{font-family:var(--bk-sans);font-size:7.6pt;font-weight:500}
.bk-labels dd{margin:0}
.bk-labels .bk-st{margin:0 1.5mm 0 0}
.bk-inhoud{page:stil;break-before:right}
.bk-inhoud>.bk-h2{font-size:26pt;margin:16mm 0 10mm}
.bk-toc{list-style:none;margin:0;padding:0}
.bk-toc li{margin:0 0 3.4mm;break-inside:avoid}
.bk-toc a{display:flex;align-items:baseline;gap:4mm}
.bk-toc-t{font-family:var(--bk-kop);font-size:13.5pt;line-height:1.2}
.bk-toc-t small{display:block;font-family:var(--bk-sans);font-size:7.2pt;letter-spacing:.04em;color:var(--bk-grijs);margin-top:.6mm}
.bk-toc-pn{margin-left:auto;flex:none}
.bk-toc-pn::after{font-size:9pt;color:var(--bk-inkt)}
.bk-register{break-before:right}
.bk-register>.bk-h2{font-size:26pt;margin:16mm 0 4mm}
.bk-reg-uitleg{font-family:var(--bk-sans);font-size:7.4pt;color:var(--bk-grijs);margin:0 0 6mm}
.bk-reg-l{margin:0 0 3mm}
.bk-reg-letter{font-family:var(--bk-kop);font-weight:400;font-size:15pt;color:var(--bk-grijs);margin:4mm 0 1.5mm;break-after:avoid}
.bk-reg{display:inline-flex;align-items:baseline;gap:1.6mm;width:calc(50% - 3mm);margin-right:3mm;font-size:8.2pt;line-height:11.6pt;vertical-align:top}
.bk-reg-n{flex:0 1 auto;min-width:0}
.bk-reg-j{font-family:var(--bk-mono);font-size:6.4pt;color:var(--bk-fijn);white-space:nowrap}
.bk-reg-pn{margin-left:auto;flex:none}
.bk-reg-pn::after{font-size:7pt}
.bk-slot{page:stil;break-before:right}
.bk-slot>.bk-h2{font-size:22pt;margin:16mm 0 3mm}
.bk-slot-uitleg{font-style:italic;color:var(--bk-grijs);margin:0 0 6mm}
.bk-lijnen i{display:block;height:10.5mm;border-bottom:.4pt solid var(--bk-lijn)}

/* vierkant 30 × 30: twee kolommen voor de lopende tekst, drie korte profielen naast elkaar, grotere koppen */
body[data-formaat="vierkant"] .bk-gen{column-count:2;column-gap:11mm}
body[data-formaat="vierkant"] .bk-genkop{column-span:all}
body[data-formaat="vierkant"] .bk-prof{break-inside:auto}
body[data-formaat="vierkant"] .bk-prof header{break-inside:avoid}
body[data-formaat="vierkant"] .bk-gen-kort{column-count:1}
body[data-formaat="vierkant"] .bk-kortprof{width:calc(33.3% - 5mm)}
body[data-formaat="vierkant"] .bk-intro,body[data-formaat="vierkant"] .bk-verhaal,body[data-formaat="vierkant"] .bk-inleiding{column-count:2;column-gap:11mm}
body[data-formaat="vierkant"] .bk-verhaal>.bk-h2,body[data-formaat="vierkant"] .bk-verhaal>.bk-lede,body[data-formaat="vierkant"] .bk-inleiding>.bk-h2,body[data-formaat="vierkant"] .bk-intro>.bk-lede{column-span:all}

/* register: een letter blijft bij zijn eerste namen */
.bk-reg-begin{display:block;break-inside:avoid}
/* profielkop, kernzin en gegevens blijven bij elkaar (als de opbouw ze in .bk-prof-kop zet) */
.bk-prof-kop{break-inside:avoid}

/* deeltitel "Verhalen": groot en gecentreerd op een eigen rechterpagina, de verhalen volgen elk op een nieuwe pagina */
.bk-hfst[data-bk="verhalen"]{break-before:right}
.bk-hfst[data-bk="verhalen"]>.bk-h1{font-size:48pt;text-align:center;margin:62mm 0 5mm}
.bk-hfst[data-bk="verhalen"]>.bk-lede{text-align:center;font-style:italic;color:var(--bk-grijs)}
/* begin van een generatie of verhaaldeel: kop en eerste regels samen (als de opbouw .bk-gen-begin / .bk-deel-begin gebruikt) */
.bk-gen-begin,.bk-deel-begin{break-inside:avoid}

/* een webadres in lopende tekst of een inleiding: mee met de tekstgrootte, niet zo klein als in de noten */
.bk-lede .bk-url{font-family:var(--bk-mono);font-size:.78em;letter-spacing:0;hyphens:none;-webkit-hyphens:none;white-space:nowrap;color:var(--bk-grijs)}

/* titels, koppen en namen breken nooit af ("Ma-rit"), en verdelen hun regels evenwichtig */
.bk-h1,.bk-h2,.bk-h3,.bk-titel-h,.bk-titel-deel,.bk-titel-fam,.bk-naam,.bk-rel,.bk-toc-t,.bk-reg-n,.bk-stamlijn li,.bk-genkop,.bk-om-titel,.bk-op-naam,.bk-sp-tekst{hyphens:none;-webkit-hyphens:none}
.bk-h1,.bk-h2,.bk-h3,.bk-titel-h,.bk-naam,.bk-toc-t,.bk-om-titel,.bk-op-naam{text-wrap:balance}

/* achterflap (tekst uit boekAchterflap) */
.bk-flap{max-width:96mm}
.bk-flap-lede{font-family:var(--bk-tekst);font-size:11pt;line-height:16pt;margin:0 0 4mm;hyphens:manual}
.bk-flap-zin{font-family:var(--bk-tekst);font-style:italic;font-size:10pt;line-height:14.5pt;margin:0 0 5mm;opacity:.85}
.bk-flap-kern{font-family:var(--bk-mono);font-size:7.6pt;letter-spacing:.06em;margin:0;opacity:.8;font-variant-numeric:lining-nums}
/* ---- boek: kaart "Waar ze woonden" (tekstpagina; the map and its measures are in the image block) ---- */
.bkb-kaart .bkb-ka-uitleg{font-family:var(--bk-tekst);font-size:10pt;line-height:14.5pt;color:var(--bk-grijs);max-width:118mm;margin:0 0 8mm;text-wrap:pretty}
.bkb-kaart .bkb-ka-lijst{column-gap:10mm;font-size:8.8pt;line-height:12.6pt}
.bkb-kaart .bkb-kl-fam{margin:0 0 6mm}
.bkb-kaart .bkb-kl-naam{font-family:var(--bk-kop);font-weight:400;font-size:12pt;line-height:1.2;margin:0 0 1.6mm;hyphens:none}
.bkb-kaart .bkb-kl-fam li{display:flex;align-items:baseline;gap:2mm}
.bkb-kaart .bkb-kl-fam li span{flex:1;min-width:0}
.bkb-kaart .bkb-kl-fam small{flex:none;white-space:nowrap;font-family:var(--bk-mono);font-size:6.8pt;color:var(--bk-grijs);font-variant-numeric:tabular-nums}
/* ---- boek: "Waar de families elkaar kruisten" en de tijdlijn (tekst; tekeningen en maten in het beeldblok) ---- */
.bkb-kruis .bkb-vb-lede{font-family:var(--bk-tekst);font-size:10pt;line-height:14.5pt;max-width:120mm;text-wrap:pretty}
.bkb-kruis .bkb-vb-kop{font-family:var(--bk-kop);font-weight:400;font-size:11pt;line-height:1.25;hyphens:none}
.bkb-kruis .bkb-vb-kop b{font-weight:400} /* Caslon Display has no bold (a faked one becomes a Type 3 font) */
.bkb-kruis .bkb-vb-kop span{font-family:var(--bk-tekst);font-size:9pt;color:var(--bk-grijs)}
.bkb-kruis .bkb-vb-paar{font-size:8.6pt;line-height:12pt}
.bkb-tijd .bkb-ti-uitleg{font-family:var(--bk-tekst);font-size:9.5pt;line-height:13.5pt;max-width:140mm;text-wrap:pretty}
/* ---- boek: naam, begrippen, getallen en geldwaarde ---- */
.bk-naam-blok{margin:7mm 0 8mm;padding:3.5mm 0 2.5mm;border-top:.8pt solid var(--lc,var(--bk-lijn));border-bottom:.4pt solid var(--bk-lijn);font-size:9.6pt;line-height:13.8pt;break-inside:avoid}
.bk-naam-blok p{margin:0 0 2mm}
.bk-naam-kop{font-family:var(--bk-sans);font-weight:600;font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:var(--bk-inkt);hyphens:none}
.bk-naam-soort{font-family:var(--bk-sans);font-size:6.6pt;letter-spacing:.08em;text-transform:uppercase;color:var(--bk-grijs);border:.4pt solid var(--bk-lijn);padding:0 1.2mm;margin-right:1mm;vertical-align:.8pt}
.bk-naam-tel,.bk-naam-bron{font-family:var(--bk-sans);font-size:7.2pt;line-height:10.6pt;color:var(--bk-grijs)}
.bk-geld{color:var(--bk-grijs)}
.bk-begr-uitleg,.bk-getal-uitleg{font-family:var(--bk-sans);font-size:7.4pt;color:var(--bk-grijs);margin:0 0 7mm}
.bk-begr{margin:0}
.bk-begr-it{margin:0 0 3.4mm;break-inside:avoid}
.bk-begr dt{font-family:var(--bk-kop);font-weight:400;font-size:11.5pt;line-height:1.2;margin:0;hyphens:none}
.bk-begr dd{margin:.6mm 0 0;font-size:9.4pt;line-height:13.4pt;text-wrap:pretty}
.bk-begr-bron{font-family:var(--bk-sans);font-size:6.8pt;color:var(--bk-grijs);white-space:nowrap}
.bk-getallen{break-before:left}
.bk-getal-p2{break-before:page;padding-top:12mm}
.bk-getal-blok{margin:0 0 7mm;break-inside:avoid}
.bk-getal-blok .bk-h3{margin-top:0}
.bk-getal-duo{display:flex;gap:14mm;margin:1mm 0 2.5mm}
.bk-getal-duo b{display:block;font-family:var(--bk-kop);font-weight:400;font-size:30pt;line-height:1;font-variant-numeric:lining-nums}
.bk-getal-duo span{font-family:var(--bk-sans);font-size:6.6pt;letter-spacing:.12em;text-transform:uppercase;color:var(--bk-grijs)}
.bk-getal-zin{font-size:10pt;line-height:14.6pt;margin:2mm 0 0;text-wrap:pretty}
.bk-getal-twee{display:grid;grid-template-columns:1fr 1fr;gap:9mm}
.bk-getal-sub{font-family:var(--bk-sans);font-size:6.8pt;letter-spacing:.12em;text-transform:uppercase;color:var(--bk-grijs);margin:0 0 1.6mm}
.bk-getal-balk{list-style:none;margin:0;padding:0;font-family:var(--bk-sans);font-size:8pt;line-height:11pt}
.bk-getal-balk li{display:grid;grid-template-columns:62mm minmax(0,1fr) 11mm;gap:2.5mm;align-items:center;margin:0 0 1.3mm}
.bk-getal-twee .bk-getal-balk li{grid-template-columns:19mm minmax(0,1fr) 7mm}
.bk-gb-l{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bk-gb-t{display:block;height:2.2mm;background:#ece8df}
.bk-gb-t i{display:block;height:100%;background:var(--bk-grijs)}
.bk-gb-v{font-family:var(--bk-mono);font-size:7.2pt;text-align:right;color:var(--bk-grijs);font-variant-numeric:tabular-nums}
`;

window.BOEK_CSS_BEELD = String.raw`
/* ---- boek: omslag en beeld ---- */
/* Omslag, waaier als dubbele pagina, openingsspread per familie. Pagina's zonder marge; de afloop komt uit @page (bleed) bij druk. */
@page omslag{margin:0;@top-left{content:none}@top-right{content:none}@top-center{content:none}@bottom-left{content:none}@bottom-right{content:none}@bottom-center{content:none}}
@page waaier-l{margin:0;@top-left{content:none}@top-right{content:none}@top-center{content:none}@bottom-left{content:none}@bottom-right{content:none}@bottom-center{content:none}}
@page waaier-r{margin:0;@top-left{content:none}@top-right{content:none}@top-center{content:none}@bottom-left{content:none}@bottom-right{content:none}@bottom-center{content:none}}
@page open-beeld{margin:0;@top-left{content:none}@top-right{content:none}@top-center{content:none}@bottom-left{content:none}@bottom-right{content:none}@bottom-center{content:none}}
@page open-tekst{margin:0;@top-left{content:none}@top-right{content:none}@top-center{content:none}@bottom-left{content:none}@bottom-right{content:none}@bottom-center{content:none}}
/* zonder marge, ook als de typografie aparte marges voor linker- en rechterpagina's geeft */
@page omslag:left{margin:0}@page omslag:right{margin:0}@page omslag:first{margin:0}@page waaier-l:left{margin:0}@page waaier-l:right{margin:0}@page waaier-l:first{margin:0}@page waaier-r:left{margin:0}@page waaier-r:right{margin:0}@page waaier-r:first{margin:0}@page open-beeld:left{margin:0}@page open-beeld:right{margin:0}@page open-beeld:first{margin:0}@page open-tekst:left{margin:0}@page open-tekst:right{margin:0}@page open-tekst:first{margin:0}
@page kaart-l{margin:0;@top-left{content:none}@top-right{content:none}@top-center{content:none}@bottom-left{content:none}@bottom-right{content:none}@bottom-center{content:none}}
@page kaart-l:left{margin:0}@page kaart-l:right{margin:0}@page kaart-l:first{margin:0}
@page tijd{margin:0;@top-left{content:none}@top-right{content:none}@top-center{content:none}@bottom-left{content:none}@bottom-right{content:none}@bottom-center{content:none}}
@page tijd:left{margin:0}@page tijd:right{margin:0}@page tijd:first{margin:0}
/* ---- tijdlijn "Hun levens in de tijd": twee pagina's zonder marge, elk met een kop en de tekening (na de opmaak, op maat) ---- */
.bkb-tijd{break-before:left}
.bkb-ti-blad{page:tijd;height:calc(var(--bk-ph,297mm) - 2mm);width:var(--bk-pw,210mm);box-sizing:border-box;padding:14mm 12mm 12mm;overflow:hidden;break-after:page;break-inside:avoid;display:flex;flex-direction:column}
.bkb-ti-kop{flex:0 0 auto;margin:0 0 3mm}
.bkb-ti-uitleg{font-size:8.5pt;line-height:1.45;color:var(--bk-grijs);max-width:130mm;margin:0}
.bkb-ti-svg{flex:1 1 auto;min-height:0}
.bkb-ti-svg svg{display:block;width:100%;height:100%}
/* ---- kaart "Waar ze woonden": links de kaart over de hele pagina, rechts de dorpen per familie of tak ---- */
.bkb-kaart{break-before:left}
/* ---- Waar de families elkaar kruisten (alleen het boek van de kinderen) ---- */
.bkb-vb-lede{font-size:9.5pt;line-height:1.5;max-width:125mm;margin:0 0 3mm}
.bkb-vb-leg{font-family:"IBM Plex Mono",monospace;font-size:7pt;letter-spacing:.06em;color:var(--bk-grijs);margin:0 0 4mm}
/* de kanten als halve stip, zoals op de kaart: links de kant van Harrie, rechts die van Alies (ook leesbaar zonder kleurverschil) */
.bkb-vb-h,.bkb-vb-a{display:inline-block;width:2.6mm;height:2.6mm;border-radius:50%;margin:0 1.6mm 0 0;vertical-align:-.15mm;box-sizing:border-box;border:.2mm solid var(--bk-inkt)}
.bkb-vb-leg .bkb-vb-a{margin-left:4mm}
.bkb-vb-h{background:linear-gradient(90deg,var(--l8) 50%,transparent 50%)}.bkb-vb-a{background:linear-gradient(90deg,transparent 50%,var(--l12) 50%)}
.bkb-vb-kaart{width:100%;max-height:150mm;margin:0 0 6mm;break-inside:avoid;border:.25mm solid var(--bk-lijn)}
.bkb-vb-kaart svg{display:block;width:100%;height:100%;overflow:hidden}
.bkb-vb-lijst{list-style:none;margin:0;padding:0;columns:2;column-gap:8mm;font-size:8.5pt;line-height:1.45}
.bkb-vb-lijst li{break-inside:avoid;margin:0 0 4.5mm}
.bkb-vb-kop{margin:0}.bkb-vb-kop span{font-style:italic}.bkb-vb-kop small{display:block;font-family:"IBM Plex Mono",monospace;font-size:6.8pt;color:var(--bk-grijs)}
.bkb-vb-paar{margin:0}.bkb-vb-ev{color:var(--bk-grijs)}
.bkb-kruis .vb-strook{display:block;width:100%;height:6mm;margin:1mm 0}
.bkb-kruis .vb-win{fill:#efe6cf}.bkb-kruis .vb-as{stroke:#c9c2b2;stroke-width:1}
.bkb-kruis .vb-t{stroke-width:2}.bkb-kruis .vb-t.vb-h{stroke:var(--l8)}.bkb-kruis .vb-t.vb-a{stroke:var(--l12)}
.bkb-vb-as{font-size:7.5pt;color:var(--bk-grijs);margin:2mm 0 0}
/* de achterkant als laatste pagina van de pdf om te lezen: geen pagina erna */
.bkb-achterkant{break-after:auto}
.bkb-achterkant .bk-sp-achter{height:100%;box-sizing:border-box}
.bkb-ka-blad{page:kaart-l;height:calc(var(--bk-ph,297mm) - 2mm);width:var(--bk-pw,210mm);overflow:hidden;break-after:page;break-inside:avoid;display:flex;align-items:center;justify-content:center}
.bkb-ka-svg svg{display:block;width:100%;height:100%;overflow:hidden}
.bkb-ka-uitleg{font-size:9pt;line-height:1.45;color:var(--bk-grijs);max-width:110mm;margin:0 0 7mm}
.bkb-ka-lijst{columns:2;column-gap:9mm;font-size:8.5pt;line-height:1.5}
.bkb-kl-fam{break-inside:avoid;margin:0 0 5mm}
.bkb-kl-naam{font-weight:600;margin:0 0 1mm}
.bkb-kl-naam i{display:inline-block;width:2.4mm;height:2.4mm;border-radius:50%;background:var(--lc);margin-right:1.8mm;vertical-align:-.1mm}
.bkb-kl-fam ul{list-style:none;margin:0;padding:0 0 0 4.2mm}
.bkb-kl-fam small{font-family:"IBM Plex Mono",monospace;font-size:7pt;color:var(--bk-grijs)}
.bkb-op-kaart{width:58mm;margin:0 0 4mm}
.bkb-op-kaart svg{display:block;width:100%;height:auto;border:.25mm solid var(--bk-lijn)}
:root{--bk-nacht:#14201c;--bk-nacht-inkt:#efe9db;--bk-goud:#c8a45c}

/* de voorkant: de waaier in de familiekleuren op een donkere grond, de titel eronder */
.bk-omslag{page:omslag;break-before:page;break-after:page;position:relative;width:var(--bk-pw,210mm);height:var(--bk-ph,297mm);margin:0;background:var(--bk-nacht);color:var(--bk-nacht-inkt);overflow:hidden;box-sizing:border-box;
  display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
  --ink:var(--bk-nacht-inkt);--muted:#b9b2a2;--faint:#8f8a7e;--rule:#3a4743;--surface:#1b2925;--sunk:#22312c;--gold:var(--bk-goud);--accent:#8f7438;--accent-ink:#14201c;--fan-gap:var(--bk-nacht)}
.bk-om-waaier{width:86%;margin-top:14%}
.bk-om-waaier svg{display:block;width:100%;height:auto;filter:brightness(1.55) saturate(1.2)}
.bk-om-tekst{text-align:center;margin-top:auto;margin-bottom:15%;padding:0 12%}
.bk-om-eyebrow{font-family:"IBM Plex Mono",monospace;font-size:8.5pt;letter-spacing:.32em;text-transform:uppercase;color:var(--bk-goud);margin:0 0 6mm}
.bk-om-titel{font-family:"Libre Caslon Display",Georgia,serif;font-weight:400;font-size:34pt;line-height:1.08;margin:0 0 7mm;color:var(--bk-nacht-inkt)}
.bk-om-fam{font-family:var(--bk-sans,"IBM Plex Sans"),sans-serif;font-size:8.5pt;letter-spacing:.06em;line-height:1.9;margin:0 0 4mm;color:#d8d1c1}
.bk-om-fam span{white-space:nowrap;margin:0 1.6mm}
.bk-om-fam span::before{content:"";display:inline-block;width:2.2mm;height:2.2mm;background:var(--lc);margin-right:1.4mm;vertical-align:.2mm}
.bk-om-jaren{font-family:"IBM Plex Mono",monospace;font-size:8.5pt;letter-spacing:.14em;color:var(--bk-goud);margin:0}

/* de hele omslag voor de drukker (los vel): achterkant, rug, voorkant */
.bk-spread{display:grid;grid-template-columns:calc(var(--w) + var(--af)) var(--rug) calc(var(--w) + var(--af));background:var(--bk-nacht);color:var(--bk-nacht-inkt);
  --ink:var(--bk-nacht-inkt);--muted:#b9b2a2;--faint:#8f8a7e;--rule:#3a4743;--surface:#1b2925;--sunk:#22312c;--gold:var(--bk-goud);--accent:var(--bk-goud);--accent-ink:#14201c;--fan-gap:var(--bk-nacht)}
.bk-sp-achter{padding:calc(var(--af) + 22mm) 22mm calc(var(--af) + 22mm) calc(var(--af) + 22mm);display:flex;flex-direction:column;gap:8mm}
.bk-sp-tekst{font-family:"Libre Caslon Display",Georgia,serif;font-size:13pt;line-height:1.45;margin:0;max-width:120mm}
.bk-sp-fam{list-style:none;margin:0;padding:0;columns:2;column-gap:10mm;font-size:8.5pt;line-height:2}
.bk-sp-fam i{display:inline-block;width:2.2mm;height:2.2mm;background:var(--lc);margin-right:2mm;vertical-align:.2mm}
.bk-sp-fam span{color:#a9a294}
.bk-sp-kop{font-family:"IBM Plex Mono",monospace;font-size:7pt;letter-spacing:.12em;text-transform:uppercase;margin:0 0 2mm;opacity:.75}
.bkb-takken{list-style:none;display:flex;flex-wrap:wrap;justify-content:center;gap:.6mm 4mm;margin:0 0 3mm;padding:0;font-family:"IBM Plex Sans",sans-serif;font-size:7pt;line-height:1.5;color:var(--bk-grijs)}
.bkb-takken i{display:inline-block;width:2mm;height:2mm;background:var(--lc);margin-right:1.4mm;vertical-align:-.1mm}
.bkb-takken span{opacity:.75}
.bk-sp-versie{margin-top:auto;font-family:"IBM Plex Mono",monospace;font-size:7pt;color:#a9a294}
.bk-sp-rug{display:flex;align-items:center;justify-content:center;border-left:.3mm solid #2c3935;border-right:.3mm solid #2c3935}
.bk-sp-rug span{writing-mode:vertical-rl;font-family:"Libre Caslon Display",Georgia,serif;font-size:11pt;letter-spacing:.06em;color:var(--bk-nacht-inkt);white-space:nowrap}
.bk-sp-voor{overflow:hidden}
.bk-omslag-los{width:calc(var(--w) + var(--af));height:calc(var(--h) + 2 * var(--af));padding:var(--af) var(--af) var(--af) 0}

/* de waaier over twee pagina's: dezelfde vector, links de linkerhelft en rechts de rechterhelft */
.bk-waaier{break-before:left;--ink:var(--bk-inkt);--muted:var(--bk-grijs);--faint:#8a918d;--rule:var(--bk-lijn);--surface:var(--bk-papier);--sunk:#f1ede3;--gold:#b08a3e;--accent:#2f5d50;--accent-ink:#fff;--mono:"IBM Plex Mono",monospace;--fan-gap:var(--bk-papier)}
.bk-wa-blad{position:relative;height:calc(var(--bk-ph,297mm) - 2mm);width:var(--bk-pw,210mm);overflow:hidden;break-after:page;break-inside:avoid;--bk-wd:min(calc(var(--bk-ph,297mm) - 24mm),calc(2 * var(--bk-pw,210mm) - 24mm))}
.bk-wa-l{page:waaier-l}
.bk-wa-r{page:waaier-r}
/* de cirkel past in de hoogte van de spread; het midden ligt precies op de rug */
.bk-wa-svg{position:static;margin-top:calc((var(--bk-ph,297mm) - var(--bk-wd)) / 2);width:calc(var(--bk-wd) / 2);height:var(--bk-wd)}
.bk-wa-l .bk-wa-svg{margin-left:calc(var(--bk-pw,210mm) - var(--bk-wd) / 2 - .8mm)} /* niet tegen de paginarand: Paged.js ziet dat als overloop en breekt de tekening op */
.bk-wa-r .bk-wa-svg{margin-left:.8mm}
.bk-wa-svg svg,.bk-wa-svg img{display:block;width:100%;height:100%;max-width:none}
.bk-wa-svg,.bk-wa-svg svg,.bk-wa-svg g{break-inside:avoid}
.bk-wa-kop{position:absolute;top:18mm;left:20mm;right:20mm;z-index:1}
.bk-wa-uitleg{max-width:95mm;font-size:8.5pt;color:var(--bk-grijs)}

/* de opening van een familie: links een beeld over de hele pagina, rechts de familie */
.bk-fam:has(.bk-open-beeld){break-before:left}
.bk-open.bk-open-beeld{display:block;min-height:0;border:0;padding:0;break-after:auto}
.bk-op-links{page:open-beeld;break-after:page;width:var(--bk-pw,210mm);height:var(--bk-ph,297mm);overflow:hidden;position:relative;background:#1d2320}
.bk-op-foto{margin:0;width:100%;height:100%}
.bk-op-foto img{width:100%;height:100%;object-fit:cover;display:block;max-width:none}
/* een prent of tekening heel laten: als plaat op papier, met een dunne lijn en het bijschrift in kleine kapitalen */
.bk-op-links .bk-beeld[data-maat="plaat"]{break-before:auto;break-after:auto;page:open-beeld;min-height:0}
.bk-op-links.bk-op-plaat{background:#f4efe3;display:flex;align-items:center;justify-content:center}
.bk-op-plaat .bk-op-foto{width:auto;height:auto;max-width:82%;display:flex;flex-direction:column;align-items:center}
.bk-op-plaat .bk-op-foto img{width:auto;height:auto;max-width:min(100%,var(--bk-plaat-max,172mm));max-height:200mm;object-fit:contain;outline:.25mm solid #b9ae95;outline-offset:3mm;box-shadow:none}
.bk-op-plaat .bk-bijschrift{margin-top:9mm;max-width:130mm;text-align:center;font-variant:small-caps;letter-spacing:.04em;font-size:8.5pt;line-height:1.45;color:#5d6661}
.bk-op-plaat .bk-bijschrift .bk-credit{display:block;font-variant:normal;letter-spacing:0;font-family:"IBM Plex Mono",monospace;font-size:6.5pt;margin-top:1.5mm}
.bk-open-beeld .bk-op-rechts{page:open-tekst;break-after:page;height:var(--bk-ph,297mm);box-sizing:border-box;padding:42mm 24mm 26mm 30mm;display:flex;flex-direction:column;position:relative}
.bk-open-beeld .bk-op-rechts::before{content:"";position:absolute;left:0;top:0;bottom:0;width:7mm;background:var(--lc)}
.bk-op-naam{font-size:52pt;color:var(--lc);margin:0 0 3mm}
.bk-op-sub{font-family:"Libre Caslon Display",Georgia,serif;font-size:15pt;color:var(--bk-grijs);margin:0 0 9mm}
.bk-op-feiten{font-family:"IBM Plex Mono",monospace;font-size:8pt;letter-spacing:.1em;text-transform:uppercase;color:var(--bk-grijs);margin:0 0 2mm}
.bk-op-plaatsen{font-size:10pt;margin:0 0 12mm}
.bk-op-waaier{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;margin:2mm -6mm 4mm -10mm;--ink:var(--bk-inkt);--muted:var(--bk-grijs);--faint:#8a918d;--rule:var(--bk-lijn);--surface:var(--bk-papier);--sunk:#f1ede3;--gold:#b08a3e;--accent:var(--lc);--accent-ink:#fff;--mono:"IBM Plex Mono",monospace;--fan-gap:var(--bk-papier)}
.bk-op-waaier svg{display:block;width:100%;height:100%;max-height:150mm}
.bk-op-bijschrift{margin-top:auto;font-size:7.5pt;line-height:1.4;color:var(--bk-grijs);max-width:120mm}
.bk-op-bijschrift .bk-credit{display:block;font-family:"IBM Plex Mono",monospace;font-size:6.5pt;margin-top:1mm}

/* de verste voorouder: het jaar groot, de naam, wat we weten, de afstand in generaties, en een beeld uit die plaats en tijd */
.bk-verste{break-before:page;break-after:page;display:flex;flex-direction:column;justify-content:flex-start;min-height:0}
.bk-vv-jaar{font-family:"Libre Caslon Display",Georgia,serif;font-size:96pt;line-height:.9;color:var(--lc);margin:6mm 0 4mm}
.bk-vv-naam{font-family:"Libre Caslon Display",Georgia,serif;font-weight:400;font-size:24pt;line-height:1.1;margin:0 0 2mm}
.bk-vv-feiten{font-family:"IBM Plex Mono",monospace;font-size:8pt;letter-spacing:.08em;text-transform:uppercase;color:var(--bk-grijs);margin:0 0 5mm}
.bk-vv-kort{font-size:11pt;line-height:1.5;max-width:125mm;margin:0 0 7mm}
.bk-vv-lijn{display:flex;align-items:center;gap:3mm;font-family:"IBM Plex Mono",monospace;font-size:7.5pt;color:var(--bk-grijs);margin:0 0 3mm;max-width:140mm}
.bk-vv-lijn i{flex:1;height:2.4mm;background:repeating-linear-gradient(90deg,var(--lc) 0 calc(100% / var(--n) - .8mm),transparent 0 calc(100% / var(--n)))}
.bk-vv-aanw{font-size:8.5pt;color:var(--bk-grijs);margin:0 0 6mm;max-width:125mm}
.bk-vv-beeld{margin-top:6mm;display:flex;justify-content:flex-start;break-inside:avoid}
.bk-vv-foto{margin:0;max-width:var(--bk-plaat-max,160mm)}
.bk-vv-foto img{display:block;width:auto;max-width:100%;height:auto;max-height:105mm;outline:.25mm solid #b9ae95;outline-offset:2.5mm}
.bk-vv-foto .bk-bijschrift{margin-top:5mm;font-variant:small-caps;letter-spacing:.03em;font-size:8pt}
.bk-vv-foto .bk-credit{display:block;font-variant:normal;letter-spacing:0;font-family:"IBM Plex Mono",monospace;font-size:6.5pt;margin-top:1mm}

/* de plaat op een lege linkerpagina vóór een familieopening */
.bkb-leeg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.bkb-leeg-foto{margin:0;width:150mm;display:flex;flex-direction:column;align-items:center}
.bkb-leeg-foto img{display:block;max-width:calc(100% - 7mm);max-height:180mm;width:auto;height:auto;padding:3mm;border:.25mm solid #b9ae95;box-sizing:content-box}
.bkb-leeg-foto .bk-bijschrift{margin-top:8mm;max-width:120mm;text-align:center;font-variant:small-caps;letter-spacing:.04em;font-size:8.5pt;color:#5d6661}
.bkb-leeg-foto .bk-credit{display:block;font-variant:normal;letter-spacing:0;font-family:"IBM Plex Mono",monospace;font-size:6.5pt;margin-top:1.5mm}

/* ---- de drie omslagen (A linnen en goud, B papier en waaier, C archief); deze regels gaan voor de oudere omslagregels ---- */
.bkb-om{background:var(--bkb-grond);color:var(--ink);justify-content:flex-start}
.bkb-om .bkb-om-waaier svg{filter:none;display:block;width:100%;height:auto}
.bkb-om-titel{text-align:center;padding:0 12%}
.bkb-om-boven{font-family:var(--bk-kop,"Libre Caslon Display"),serif;font-size:11pt;letter-spacing:.32em;text-transform:uppercase;margin:0 0 3mm;color:var(--bkb-accent)}
.bkb-om-naam{font-family:"Libre Caslon Display",serif;font-weight:400;font-size:38pt;line-height:1.05;margin:0 0 4mm;color:var(--ink);text-wrap:balance}
.bkb-om-onder{font-family:var(--bk-sans,"IBM Plex Sans"),sans-serif;font-size:9pt;letter-spacing:.18em;text-transform:uppercase;margin:0;color:var(--bkb-accent)}
.bkb-om-deel{font-family:"IBM Plex Mono",monospace;font-size:8pt;letter-spacing:.12em;margin:3mm 0 0;color:var(--muted)}
/* A: donker linnen en goud */
.bkb-om-a{--bkb-grond:#17221e;--bkb-accent:#c8a45c;--ink:#efe9db;--muted:#cfc6b2;--faint:#9a9384;--rule:#55625c;--surface:#17221e;--sunk:#2a3631;--gold:#c8a45c;--accent:#22312c;--accent-ink:#efe9db;--fan-gap:#17221e;
  background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 .3mm,transparent .3mm .9mm),repeating-linear-gradient(90deg,rgba(0,0,0,.08) 0 .3mm,transparent .3mm 1.1mm)}
.bkb-om-a::before{content:"";position:absolute;inset:9mm;border:.35mm solid rgba(200,164,92,.7);outline:.2mm solid rgba(200,164,92,.45);outline-offset:-1.6mm;pointer-events:none}
.bkb-om-a .bkb-om-waaier{width:90%;margin-top:9%}
.bkb-om-a .bkb-om-titel{margin-top:auto;margin-bottom:11mm}
.bkb-om-banden{display:flex;width:60%;height:1.6mm;margin:0 auto 20mm}
.bkb-om-banden i{flex:1;background:var(--lc)}
/* B: warm papier, de waaier groot over de onderrand */
.bkb-om-b{--bkb-grond:#f3ebd9;--bkb-accent:#8a6a2e;--ink:#1d2320;--muted:#56605b;--faint:#8a918d;--rule:#c9bfa8;--surface:#f3ebd9;--sunk:#e6dcc6;--gold:#a8823a;--accent:#1d2320;--accent-ink:#f3ebd9;--fan-gap:#f3ebd9;overflow:hidden}
.bkb-om-b .bkb-om-titel{margin-top:24mm}
.bkb-om-fams{text-align:center;padding:0 14%;margin:6mm 0 0;font-family:var(--bk-sans,"IBM Plex Sans"),sans-serif;font-size:8.5pt;line-height:1.9;letter-spacing:.04em}
.bkb-om-fams span{color:var(--lc);white-space:nowrap;margin:0 1.4mm;font-weight:600}
.bkb-om-b .bkb-om-waaier{position:absolute;left:50%;bottom:6%;width:min(86%,calc(var(--bk-ph,297mm) - 108mm));transform:translateX(-50%)} /* de hele waaier, onder de titel (Harrie: de volledige waaier met details) */
/* C: een oude kaart van de streek als grond, waaier en titel in een kader */
.bkb-om-c{--bkb-grond:#d9cfb9;--bkb-accent:#7a5c26;--ink:#1d2320;--muted:#56605b;--faint:#8a918d;--rule:#c9bfa8;--surface:#f6f0e2;--sunk:#e6dcc6;--gold:#a8823a;--accent:#1d2320;--accent-ink:#f6f0e2;--fan-gap:#f6f0e2;
  background-image:linear-gradient(rgba(217,207,185,.55),rgba(217,207,185,.55)),var(--bkb-kaart,none);background-size:cover;background-position:center;justify-content:center;align-items:center}
.bkb-om-kader{width:80%;background:rgba(246,240,226,.94);border:.35mm solid #8a6a2e;outline:.2mm solid #8a6a2e;outline-offset:1.6mm;padding:12mm 9mm 9mm;display:flex;flex-direction:column;align-items:center;gap:6mm}
.bkb-om-c .bkb-om-waaier{width:98%}
/* het beeld in het midden per boeksoort (in plaats van de waaier): vierkant, zoals de waaier */
.bkb-om-beeld{position:relative;width:100%;aspect-ratio:1/1;overflow:hidden}
.bkb-om-beeld>img{display:block;width:100%;height:100%;object-fit:cover}
.bkb-om-prent>img,.bkb-om-akte>img{box-sizing:border-box;border:.4mm solid var(--rule)}
.bkb-om-akte{width:78%;margin:0 auto}.bkb-om-akte>img{object-fit:contain;background:none;border:0}
.bkb-om-raster{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:1.2mm}
.bk-fotos{margin:6mm 0 4mm}
.bk-fotos>.bk-h2{margin:6mm 0 3mm}
.bk-foto-rij{display:flex;justify-content:center;align-items:flex-start;gap:5mm;margin:0 0 6mm;break-inside:avoid}
.bk-foto{margin:0;flex:none;break-inside:avoid}
.bk-foto img{display:block;width:100%;height:auto;box-sizing:border-box;border:.25mm solid var(--rule)}
.bk-foto figcaption{margin-top:1.8mm;font-family:"Libre Caslon Text",serif;font-size:8.5pt;line-height:1.35;color:var(--ink)}
.bk-foto figcaption small{display:block;margin-top:.8mm;font-family:"IBM Plex Sans",sans-serif;font-size:6.5pt;line-height:1.3;color:var(--muted)}
.bkb-om-portret{display:flex;justify-content:center;align-items:flex-start;gap:7mm;margin:0 auto}
.bkb-om-portret figure{margin:0;flex:none}
.bkb-om-portret img{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;object-position:50% 28%;box-sizing:border-box;border:.4mm solid var(--rule)}
.bkb-om-portret figcaption{margin-top:2.6mm;text-align:center;font-family:"Libre Caslon Text",serif;font-size:11pt;line-height:1.25;color:var(--ink)}
.bkb-om-portret figcaption b{display:block;font-weight:400}
.bkb-om-portret figcaption span{display:block;margin-top:.8mm;font-family:"IBM Plex Mono",monospace;font-size:8pt;color:var(--muted)}
.bkb-om-raster>img{width:100%;height:100%;object-fit:cover;object-position:50% 30%}
.bkb-om-kwst svg,.bkb-om-ruggen svg{display:block;width:100%;height:100%}
.bkb-om-ruglabels{position:absolute;left:0;right:0;top:12%;bottom:12%;display:flex}
.bkb-om-ruglabels span{writing-mode:vertical-rl;transform:rotate(180deg);display:flex;align-items:center;justify-content:center;font-family:"IBM Plex Sans",sans-serif;font-size:7pt;letter-spacing:.06em;color:#fff;text-transform:uppercase}
.bkb-om-b .bkb-om-waaier:has(.bkb-om-beeld){width:min(70%,calc(var(--bk-ph,297mm) - 120mm))}
.bkb-om-a .bkb-om-waaier:has(.bkb-om-portret){width:auto;margin-top:auto} /* between the top and the title */
.bkb-om-b .bkb-om-waaier:has(.bkb-om-portret){width:auto;bottom:20%} /* the portraits of a memorial book: in the middle of the room below the title */
 /* groot genoeg voor de namen van de grootouders (6 pt) */
/* rug en achterkant per omslag */
.bkb-sp-a{background:#17221e;color:#efe9db}
.bkb-sp-b{background:#f3ebd9;color:#1d2320}.bkb-sp-b .bk-sp-fam span,.bkb-sp-b .bk-sp-versie{color:#56605b}.bkb-sp-b .bk-sp-rug{border-color:#c9bfa8}.bkb-sp-b .bk-sp-rug span{color:#1d2320}
.bkb-sp-c{background:#e9e0cc;color:#1d2320}.bkb-sp-c .bk-sp-fam span,.bkb-sp-c .bk-sp-versie{color:#56605b}.bkb-sp-c .bk-sp-rug{border-color:#b9ae95}.bkb-sp-c .bk-sp-rug span{color:#1d2320}
.bk-sp-rug span b{font-weight:400;font-size:12pt}
.bk-sp-uitleg{font-size:7.5pt;line-height:1.5;max-width:110mm;margin:0;opacity:.8}

/* ---- omslag: typografie (afspraak met 19) ---- */
.bkb-om-boven{font-family:"Libre Caslon Text",serif;font-style:italic;font-size:15.5pt;letter-spacing:0;text-transform:none;margin:0 0 2mm;color:var(--ink);opacity:.9}
.bkb-om-naam{font-size:44pt;hyphens:none;text-wrap:balance;margin:0 0 5mm}
.bkb-om-naam.bkb-lang{font-size:34pt}
.bkb-om-naam+.bkb-om-sub{margin-top:-2mm}
.bkb-om-sub{font-family:"Libre Caslon Text",serif;font-style:italic;font-size:13pt;line-height:1.3;margin:0 0 4mm;color:var(--ink);opacity:.85;text-wrap:balance}
.bkb-om-jaren{display:flex;align-items:center;justify-content:center;gap:4mm;margin:0 0 6mm;font-family:"Libre Caslon Display",serif;font-size:13.5pt;font-variant-numeric:lining-nums;color:var(--bkb-accent)}
.bkb-om-jaren i{display:block;width:8mm;height:0;border-top:.25mm solid var(--bkb-accent)}
.bkb-om-fams{display:flex;flex-direction:column;gap:1.6mm;align-items:center;margin:0;padding:0;font-family:var(--bk-sans,"IBM Plex Sans"),sans-serif;font-size:7.5pt;letter-spacing:.12em;text-transform:uppercase;line-height:1.5;color:var(--muted)}
.bkb-om-fams span{white-space:normal;margin:0;color:inherit;font-weight:400;text-wrap:balance;max-width:100%}
.bkb-om-onder{display:none}
.bkb-om-a .bkb-om-titel{margin-bottom:9mm}
.bkb-om-b .bkb-om-titel{margin-top:20mm}
.bk-sp-rug span{display:flex;align-items:center;gap:5mm}
.bk-sp-rug b{font-family:"Libre Caslon Display",serif;font-weight:400;font-size:11.5pt}
.bk-sp-rug small{font-family:"IBM Plex Mono",monospace;font-size:7pt;letter-spacing:.06em}
.bkb-sp-a .bk-flap,.bkb-sp-a .bk-flap *{color:#efe9db}
`;

window.BOEK_CSS = window.BOEK_CSS_OPBOUW + window.BOEK_CSS_TYPO + window.BOEK_CSS_BEELD;
