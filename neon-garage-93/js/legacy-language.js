// Translate display text in existing v0.1 saves without changing gameplay data.
window.NG = window.NG || {};
NG.legacyEnglish = {
  Motor: "Engine",
  "V\u00e1lt\u00f3": "Transmission",
  "Fut\u00f3m\u0171": "Suspension",
  "Karossz\u00e9ria": "Bodywork",
  Kozmetika: "Detailing",
  "Hengerfejt\u00f6m\u00edt\u00e9s sziv\u00e1rog": "Leaking head gasket",
  "Kopott v\u00e1lt\u00f3szinkron": "Worn transmission synchro",
  "Repedt leng\u0151kar": "Cracked control arm",
  "Rozsda a k\u00fcsz\u00f6b alatt": "Rust under the rocker panels",
  "\u00e1tvizsg\u00e1l\u00e1s": "inspection",
  "v\u00e1s\u00e1rl\u00e1s": "purchase",
  "elad\u00e1s": "sale",
  "A kulcs a ti\u00e9d. A t\u00f6bbi rajtad m\u00falik.":
    "The keys are yours. The rest is up to you.",
  "K\u00e9t f\u00e9r\u0151hely, \u00f6tezer doll\u00e1r \u00e9s egy \u00faj kezdet. Keress egy j\u00f3 v\u00e9telt a mai hirdet\u00e9sek k\u00f6z\u00f6tt.":
    "Two garage spaces, five thousand dollars, and a fresh start. Find your first deal in today\u2019s listings.",
  "Csendes nap a v\u00e1rosban": "A quiet day in town",
  "A piac kiegyens\u00falyozott. Friss hirdet\u00e9sek \u00e9s \u00faj lehet\u0151s\u00e9gek v\u00e1rnak.":
    "The market is steady. Fresh listings and new opportunities await.",
  "A jap\u00e1n aut\u00f3k kereslete ma 20%-kal magasabb. Az \u00e9rt\u00e9k\u00fck \u00e9s a vev\u0151i aj\u00e1nlatok is emelkednek.":
    "Demand for Japanese cars is up 20% today. Their values and buyer offers are rising.",
  "Dr\u00e1gul a benzin": "Gas prices are climbing",
  "Ma 18%-kal esik az amerikai aut\u00f3k \u00e9rt\u00e9ke. A piac holnap \u00fajra v\u00e1ltozik.":
    "American car values are down 18% today. The market will change again tomorrow.",
  "Fizet\u00e9snap a v\u00e1rosban": "Payday in town",
  "Egy s\u00fcrg\u0151s vev\u0151 ma piaci \u00e1r felett is aj\u00e1nlhat. Meghirdetett aut\u00f3id nagyobb es\u00e9llyel kapnak aj\u00e1nlatot.":
    "A buyer in a hurry may offer above market value today. Your listed cars are more likely to attract offers.",
  "Ritka fog\u00e1s a hirdet\u00e9sek k\u00f6z\u00f6tt":
    "A rare find in the classifieds",
  "Egy Nissan 300ZX ker\u00fclt a piacra 20% hirdet\u00e9si kedvezm\u00e9nnyel. A m\u0171szaki \u00e1llapota m\u00e9g k\u00e9rd\u00e9ses.":
    "A Nissan 300ZX has hit the market with a 20% asking-price discount. Its mechanical condition is still a mystery.",
};
NG.translateSavedText = (text) => {
  if (typeof text !== "string") return text;
  for (const [original, english] of Object.entries(NG.legacyEnglish).sort(
    (a, b) => b[0].length - a[0].length,
  ))
    text = text.split(original).join(english);
  return text;
};
