/* Period-correct catalog. Prices are game-balanced dollars, not historical valuations. */
window.NG = window.NG || {};
NG.catalog = [
  {
    id: "crx",
    name: "Honda CRX",
    trim: "1.6 Si",
    years: [1988, 1991],
    value: 4200,
    segment: "japan",
    shape: "hatch",
    color: "#ec765c",
  },
  {
    id: "mr2",
    name: "Toyota MR2",
    trim: "2.0 GT",
    years: [1991, 1993],
    value: 7900,
    segment: "japan",
    shape: "sport",
    color: "#e9d7b6",
  },
  {
    id: "mx5",
    name: "Mazda MX-5",
    trim: "1.6 Roadster",
    years: [1990, 1993],
    value: 6300,
    segment: "japan",
    shape: "roadster",
    color: "#61b2aa",
  },
  {
    id: "e30",
    name: "BMW E30",
    trim: "325i",
    years: [1986, 1991],
    value: 5600,
    segment: "europe",
    shape: "sedan",
    color: "#94aac5",
  },
  {
    id: "golf",
    name: "Volkswagen Golf GTI",
    trim: "Mk2 8V",
    years: [1985, 1992],
    value: 3300,
    segment: "europe",
    shape: "hatch",
    color: "#a9b6a0",
  },
  {
    id: "300zx",
    name: "Nissan 300ZX",
    trim: "Z32 V6",
    years: [1990, 1993],
    value: 9800,
    segment: "japan",
    shape: "sport",
    color: "#b083ab",
  },
  {
    id: "legacy",
    name: "Subaru Legacy",
    trim: "2.2 AWD",
    years: [1990, 1993],
    value: 3900,
    segment: "japan",
    shape: "sedan",
    color: "#c2bba6",
  },
  {
    id: "mustang",
    name: "Ford Mustang",
    trim: "Fox Body 5.0",
    years: [1987, 1993],
    value: 5100,
    segment: "america",
    shape: "sport",
    color: "#6ba0bd",
  },
  {
    id: "camaro",
    name: "Chevrolet Camaro",
    trim: "IROC-Z V8",
    years: [1985, 1990],
    value: 4800,
    segment: "america",
    shape: "sport",
    color: "#e1ba65",
  },
  {
    id: "volvo",
    name: "Volvo 240",
    trim: "2.3 GL",
    years: [1986, 1993],
    value: 2900,
    segment: "europe",
    shape: "sedan",
    color: "#ab8c69",
  },
];
NG.parts = {
  engine: { label: "Engine", rate: 18 },
  transmission: { label: "Transmission", rate: 14 },
  suspension: { label: "Suspension", rate: 8 },
  body: { label: "Bodywork", rate: 10 },
  cosmetic: { label: "Detailing", rate: 4 },
};
NG.flaws = [
  { part: "engine", label: "Leaking head gasket", cost: 420 },
  { part: "transmission", label: "Worn transmission synchro", cost: 330 },
  { part: "suspension", label: "Cracked control arm", cost: 180 },
  { part: "body", label: "Rust under the rocker panels", cost: 260 },
];
NG.model = (car) => NG.catalog.find((m) => m.id === car.model);
NG.carArt = (car, large = false) => {
  const m = NG.model(car),
    color = car.color || m.color,
    hatch = m.shape === "hatch",
    sedan = m.shape === "sedan",
    road = m.shape === "roadster";
  const roof = hatch
    ? "112,93 141,55 218,55 259,97"
    : sedan
      ? "102,96 140,58 229,58 275,96"
      : road
        ? "113,96 154,65 204,65 227,96"
        : "106,96 159,61 222,64 265,96";
  return `<svg class="car-art ${large ? "large" : ""}" viewBox="0 0 400 180" role="img" aria-label="${m.name} illustration"><defs><linearGradient id="paint-${car.id}" x2="0" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".6"/></linearGradient></defs><ellipse cx="203" cy="145" rx="161" ry="10" fill="#000" opacity=".4"/><path d="M31 113 L63 100 L${roof.split(" ")[0]} ${roof
    .split(" ")
    .slice(1)
    .map((p) => "L" + p)
    .join(
      " ",
    )} L337 101 L368 114 L368 133 L31 133 Z" fill="url(#paint-${car.id})" stroke="#ffffff" stroke-opacity=".2" stroke-width="1.5"/><path d="M119 94 L149 65 L${hatch ? "216" : "220"} 65 L251 94 Z" fill="#172b36" stroke="#adcac6" stroke-opacity=".3"/><path d="M187 65 V94" stroke="${color}" stroke-width="6"/>${road ? '<path d="M151 64 H220" stroke="#111b23" stroke-width="8"/>' : ""}<path d="M40 115 H357 M77 102 H322" stroke="#f4f0e6" stroke-opacity=".25"/><path d="M41 114 H61" stroke="#f4d9a1" stroke-width="7"/><path d="M343 114 H362" stroke="#e55f69" stroke-width="6"/><rect x="211" y="100" width="15" height="3" rx="1" fill="#18232b"/>${[98, 305].map((x) => `<circle cx="${x}" cy="132" r="24" fill="#0a1017"/><circle cx="${x}" cy="132" r="15" fill="#9ca6ac"/><circle cx="${x}" cy="132" r="10" fill="#243039"/><path d="M${x - 12} 132 H${x + 12} M${x} 120 V144" stroke="#aeb8ba" stroke-width="3"/><circle cx="${x}" cy="132" r="4" fill="#aeb8ba"/>`).join("")}<path d="M148 103 V128 M256 101 V127" stroke="#15212b" stroke-opacity=".4"/></svg>`;
};
