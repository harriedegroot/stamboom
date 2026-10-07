/* =====================================================================
   VERHAALKAARTEN: omslag en categorieën
   Per verhaal-id:
   - tags: één of twee categorieën uit STORY_TAGS (filter en labels op de pagina Verhalen);
   - img: een historisch beeld uit IMAGES voor de kaart en bovenaan het verhaal: bij voorkeur een beeld dat al
     bij het verhaal hoort (vh), anders een document, grafsteen of de kaart van Schotanus (1664) van de streek
     waar het verhaal speelt. Elke kaart heeft een beeld: één beeldtaal, geen tekeningen naast foto's.
     pos/zoom = uitsnede (object-position, schaal); tone = extra CSS-filter na de gezamenlijke toon. Zonder img valt de site terug op de tekening (ART in app.js);
   - art: een andere tekening dan het veld art van het verhaal (alleen als terugval).
   ===================================================================== */
const STORY_TAGS = { namen: "Namen", familie: "Familiebanden", geloof: "Geloof", werk: "Werk", herkomst: "Herkomst en verhuizen", tegenslag: "Rampen en tegenslag" };
const STORY_CARDS = {
  brandsma: { tags: ["geloof", "familie"], img: "verhaal-brandsma-ugoklooster-1900", pos: "50% 55%" },
  terwisscha: { tags: ["herkomst", "namen"], img: "bank-rm-makkum-kogzg11058", pos: "50% 42%", zoom: 1.85 },
  katholiek: { tags: ["geloof"], img: "hist-blauwhuis-e140c4feec", pos: "50% 30%" },
  beroepen: { tags: ["werk"], img: "verhaal-trouwdagen-raadhuis-balk-1911", pos: "50% 62%" },
  trouwdagen: { tags: ["familie"], img: "verhaal-trouwdagen-gemeentehuis-wolvega", pos: "50% 50%" },
  duitsers: { tags: ["herkomst", "werk"], img: "verhaal-duitsers-schloss-fuerstenau-1862", pos: "50% 45%" },
  rampen: { tags: ["tegenslag"], img: "commons-workum-ppob87472jpg", pos: "50% 50%" },
  veen: { tags: ["werk"], img: "verhaal-veen-turf-stapelen-rotsterhaule-1935", pos: "50% 45%" },
  vakmensen: { tags: ["werk"], img: "verhaal-vakmensen-grenadier-124e", pos: "50% 28%" },
  oranjewoud: { tags: ["herkomst", "familie"], img: "verhaal-oranjewoud-woudsterbrug", pos: "50% 50%" },
  buren: { tags: ["familie", "herkomst"], img: "boerderij-a8-prinsenhoeve-oranjewoud", pos: "50% 55%" },
  koortsjaar: { tags: ["tegenslag"], img: "hist-lemmer-bibfm11646", pos: "50% 50%" },
  dubbel: { tags: ["familie"], img: "kaart-schoterland", pos: "36% 90%", zoom: 2.2 },
  "namen-alies": { tags: ["namen"], img: "verhaal-namen-register-doniawerstal-1811-bakker", pos: "50% 45%" },
  naam: { tags: ["namen"], img: "verhaal-naam-register-wolvega-1812-thijs", pos: "50% 50%" },
  lijnen: { tags: ["familie"], img: "kaart-weststellingwerf", pos: "74% 90%", zoom: 2.1 },
  netwerk: { tags: ["familie"], img: "hist-steenwijkerwold-t1894a2911", pos: "50% 50%" },
  zwervers: { tags: ["herkomst"], img: "kaart-aengwirden", pos: "22% 24%", zoom: 2 },
  weduwen: { tags: ["tegenslag"], img: "graf-kw21-anna-maria-ten-berge", pos: "50% 54%", tone: "brightness(1.15) contrast(.85)" },
  uitwaaieren: { tags: ["herkomst"], img: "persoon-kw14-graf", pos: "50% 34%", tone: "brightness(1.9) contrast(.6)" },
  "geloof-alies": { tags: ["geloof"], img: "kaart-utingeradeel", pos: "84% 88%", zoom: 2 }
};
