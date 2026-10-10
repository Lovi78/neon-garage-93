const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.join(__dirname, "..");
const storage = new Map(),
  timers = new Map(),
  sources = [];
let serial = 0,
  created = 0,
  context;
const parameter = () => ({
  value: 0,
  setValueAtTime() {},
  linearRampToValueAtTime() {},
  exponentialRampToValueAtTime() {},
  setTargetAtTime() {},
});
const node = () => ({
  connect(target) {
    this.target = target;
  },
  disconnect() {
    this.disconnected = true;
  },
  gain: parameter(),
  frequency: parameter(),
  threshold: parameter(),
  ratio: parameter(),
});
class AudioContext {
  constructor() {
    created++;
    context = this;
    this.currentTime = 0;
    this.sampleRate = 8000;
    this.destination = node();
  }
  createGain() {
    return node();
  }
  createDynamicsCompressor() {
    return node();
  }
  createBiquadFilter() {
    return node();
  }
  createWaveShaper() {
    return node();
  }
  createBuffer(channels, length) {
    return { getChannelData: () => new Float32Array(length) };
  }
  source() {
    const s = node();
    s.start = () => {
      assert(s.target, "every instrument must be connected to audio output");
    };
    s.stop = () => {};
    sources.push(s);
    return s;
  }
  createOscillator() {
    return this.source();
  }
  createBufferSource() {
    return this.source();
  }
  resume() {
    return this.pendingResume || Promise.resolve();
  }
  close() {}
}
const box = {
  NG: {},
  AudioContext,
  localStorage: {
    getItem: (k) => storage.get(k),
    setItem: (k, v) => storage.set(k, v),
  },
  setInterval: (fn) => {
    timers.set(++serial, fn);
    return serial;
  },
  clearInterval: (id) => timers.delete(id),
};
box.window = box;
vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(root, "js/radio.js"), "utf8"), box);
(async () => {
  const radio = box.NG.radio;
  assert.equal(created, 0);
  assert.equal(radio.playing, false);
  assert.equal(box.NG.radioStations.length, 3);
  await radio.play();
  assert.equal(created, 1);
  assert(radio.playing);
  assert(radio.activeVoices > 0);
  assert.equal(timers.size, 1);
  for (const station of box.NG.radioStations) {
    await radio.tune(station.id);
    assert.equal(radio.station.id, station.id);
    assert.equal(created, 1);
    assert.equal(timers.size, 1);
  }
  // A delayed background scheduler skips old work instead of flooding with missed beats.
  context.currentTime = 1000;
  for (const pump of timers.values()) pump();
  assert(sources.length < 100);
  radio.setVolume(0.61);
  assert.equal(radio.volume, 0.61);
  assert.equal(JSON.parse(storage.get("neon-garage-93-radio")).volume, 0.61);
  radio.setVolume(5);
  assert.equal(radio.volume, 1);
  radio.setVolume(NaN);
  assert.equal(radio.volume, 1);
  await assert.rejects(radio.tune("missing"), /Unknown station/);
  radio.stop();
  assert(!radio.playing);
  assert.equal(timers.size, 0);
  assert.equal(radio.activeVoices, 0);
  let resolve;
  context.pendingResume = new Promise((r) => (resolve = r));
  const pending = radio.play();
  radio.stop();
  resolve();
  await pending;
  assert(!radio.playing);
  assert.equal(timers.size, 0);
  const reload = { ...box, NG: {} };
  reload.window = reload;
  vm.createContext(reload);
  vm.runInContext(
    fs.readFileSync(path.join(root, "js/radio.js"), "utf8"),
    reload,
  );
  assert.equal(reload.NG.radio.station.id, "rust");
  assert.equal(reload.NG.radio.volume, 1);
  assert(!reload.NG.radio.playing);
  assert.equal(created, 1);
  for (const source of sources) source.onended();
  assert(sources.every((s) => s.disconnected));
  radio.dispose();
  console.log(
    "PASS radio: lazy audio, three station patterns, connected instruments, one scheduler, delayed ticks, volume persistence, stop cleanup and pending-play cancellation.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
