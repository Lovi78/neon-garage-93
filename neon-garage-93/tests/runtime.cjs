const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scripts = [...html.matchAll(/src="(js\/[^" ]+)"/g)].map(
  (m) => m[1].split("?")[0],
);
function runtime(rng, storage = new Map()) {
  const context = vm.createContext({
    console,
    Math: Object.create(Math),
    localStorage: {
      getItem: (k) => storage.get(k) || null,
      setItem: (k, v) => storage.set(k, v),
    },
  });
  context.window = context;
  if (rng) context.Math.random = rng;
  for (const file of scripts.filter(
    (f) => !["js/ui.js", "js/radio.js", "js/ambience.js"].includes(f),
  ))
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  return context.NG;
}
function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
module.exports = { runtime, random, root, html, scripts };
