/* Original instrumental station loops. No network requests or autoplay on reload. */
window.NG = window.NG || {};
NG.radioStations = [
  {
    id: "neon",
    name: "Neon FM",
    frequency: "94.3",
    genre: "Synth-pop / late-night neon",
    bpm: 108,
    track: "After Hours",
  },
  {
    id: "palms",
    name: "Palms Groove",
    frequency: "93.0",
    genre: "Hiphop & funk / boulevard beats",
    bpm: 92,
    track: "Sunset Boulevard",
  },
  {
    id: "rust",
    name: "Rust FM",
    frequency: "101.7",
    genre: "Alternative rock / garage riffs",
    bpm: 124,
    track: "Last Exit",
  },
];
(() => {
  const key = "neon-garage-93-radio";
  let settings = { station: "neon", volume: 0.28 };
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (saved && NG.radioStations.some((s) => s.id === saved.station))
      settings.station = saved.station;
    if (saved && Number.isFinite(saved.volume))
      settings.volume = Math.max(0, Math.min(1, saved.volume));
  } catch {}
  let context = null,
    master = null,
    noise = null,
    timer = null,
    step = 0,
    nextAt = 0,
    pending = 0;
  const voices = new Set();
  const save = () => {
    try {
      localStorage.setItem(key, JSON.stringify(settings));
    } catch {}
  };
  const changed = () => NG.radio.onChange?.();
  const station = () => NG.radioStations.find((s) => s.id === settings.station);
  const frequency = (note) => 440 * Math.pow(2, (note - 69) / 12);
  function createContext() {
    if (context) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw Error("Audio is unavailable in this browser.");
    context = new Audio();
    master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.ratio.value = 4;
    master.connect(compressor);
    compressor.connect(context.destination);
    noise = context.createBuffer(
      1,
      context.sampleRate * 0.35,
      context.sampleRate,
    );
    const data = noise.getChannelData(0);
    let seed = 93;
    for (let i = 0; i < data.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data[i] = (seed / 4294967296) * 2 - 1;
    }
  }
  function voice(source, nodes, end) {
    const item = { source, nodes };
    voices.add(item);
    source.onended = () => {
      voices.delete(item);
      for (const node of [source, ...nodes])
        try {
          node.disconnect();
        } catch {}
    };
    source.stop(end);
  }
  function tone(
    note,
    time,
    duration,
    level,
    type = "triangle",
    cutoff = 1700,
    crunch = false,
  ) {
    const source = context.createOscillator(),
      filter = context.createBiquadFilter(),
      gain = context.createGain();
    source.type = type;
    source.frequency.setValueAtTime(frequency(note), time);
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    const nodes = [filter, gain];
    if (crunch) {
      const distortion = context.createWaveShaper();
      const curve = new Float32Array(512);
      for (let i = 0; i < 512; i++) {
        const x = (i * 2) / 511 - 1;
        curve[i] = Math.tanh(x * 6);
      }
      distortion.curve = curve;
      source.connect(distortion);
      distortion.connect(filter);
      nodes.push(distortion);
    } else source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(level, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.start(time);
    voice(source, nodes, time + duration + 0.03);
  }
  function drum(kind, time, level) {
    const gain = context.createGain();
    gain.connect(master);
    if (kind === "kick") {
      const source = context.createOscillator();
      source.type = "sine";
      source.connect(gain);
      source.frequency.setValueAtTime(130, time);
      source.frequency.exponentialRampToValueAtTime(42, time + 0.15);
      gain.gain.setValueAtTime(level, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
      source.start(time);
      voice(source, [gain], time + 0.24);
    } else {
      const source = context.createBufferSource(),
        filter = context.createBiquadFilter();
      source.buffer = noise;
      filter.type = kind === "hat" ? "highpass" : "bandpass";
      filter.frequency.value = kind === "hat" ? 6500 : 1400;
      source.connect(filter);
      filter.connect(gain);
      const length = kind === "hat" ? 0.055 : 0.14;
      gain.gain.setValueAtTime(level, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
      source.start(time);
      voice(source, [filter, gain], time + length + 0.02);
    }
  }
  function schedule(index, time) {
    const s = station(),
      beat = 60 / s.bpm,
      tick = beat / 4,
      n = index % 16,
      bar = Math.floor(index / 16) % 4;
    if (s.id === "neon") {
      const roots = [48, 44, 51, 46],
        root = roots[bar];
      if (n % 4 === 0) drum("kick", time, 0.25);
      if (n === 4 || n === 12) drum("snare", time, 0.11);
      if (n % 2 === 0) drum("hat", time, 0.055);
      if (n % 4 === 0) tone(root - 12, time, tick * 2, 0.15, "triangle", 600);
      if (n === 0 || n === 8)
        for (const note of [root, root + 7, root + 15])
          tone(note, time, beat * 1.8, 0.035, "sawtooth", 1100);
      const melody = [12, 19, 15, 22, 19, 15, 17, 19];
      if (n % 2 === 0)
        tone(root + melody[n / 2], time, tick * 1.6, 0.045, "triangle", 2400);
    } else if (s.id === "palms") {
      const root = [36, 36, 41, 43][bar];
      if ([0, 6, 10].includes(n)) drum("kick", time, 0.3);
      if (n === 4 || n === 12) drum("snare", time, 0.14);
      if (n % 2 === 0) drum("hat", time, 0.04);
      if ([0, 3, 6, 8, 11, 14].includes(n))
        tone(
          root + [0, 7, 0, 12, 7, 10][[0, 3, 6, 8, 11, 14].indexOf(n)],
          time + (n % 2 ? tick * 0.12 : 0),
          tick * 1.7,
          0.17,
          "sine",
          500,
        );
      if (n === 2 || n === 9 || n === 14)
        tone(
          root + 24 + [0, 3, 7, 10][bar],
          time,
          tick * 2,
          0.045,
          "sawtooth",
          1600,
        );
      if (n === 0)
        for (const note of [root + 12, root + 15, root + 22])
          tone(note, time, beat * 3, 0.02, "triangle", 900);
    } else {
      const root = [40, 43, 45, 48][bar];
      if ([0, 6, 8, 14].includes(n)) drum("kick", time, 0.27);
      if (n === 4 || n === 12) drum("snare", time, 0.15);
      if (n % 2 === 0) drum("hat", time, 0.06);
      if ([0, 3, 6, 8, 11, 14].includes(n)) {
        tone(root, time, tick * 1.9, 0.075, "sawtooth", 1900, true);
        tone(root + 7, time, tick * 1.9, 0.05, "sawtooth", 1800, true);
        tone(root - 12, time, tick * 2, 0.15, "triangle", 600);
      }
    }
  }
  function pump() {
    if (!NG.radio.playing || !context) return;
    const tick = 60 / station().bpm / 4;
    if (nextAt < context.currentTime - 0.3) nextAt = context.currentTime + 0.05;
    while (nextAt < context.currentTime + 0.15) {
      schedule(step++, nextAt);
      nextAt += tick;
    }
  }
  function silence() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    for (const v of voices)
      try {
        v.source.stop(context.currentTime + 0.015);
      } catch {}
    voices.clear();
  }
  NG.radio = {
    playing: false,
    onChange: null,
    get station() {
      return station();
    },
    get volume() {
      return settings.volume;
    },
    async play() {
      createContext();
      const request = ++pending;
      await context.resume();
      if (request !== pending) return;
      silence();
      master.gain.setValueAtTime(settings.volume, context.currentTime);
      step = 0;
      nextAt = context.currentTime + 0.05;
      NG.radio.playing = true;
      pump();
      timer = setInterval(pump, 25);
      changed();
    },
    stop() {
      pending++;
      silence();
      NG.radio.playing = false;
      changed();
    },
    async tune(id) {
      if (!NG.radioStations.some((s) => s.id === id))
        throw Error("Unknown station.");
      settings.station = id;
      save();
      await NG.radio.play();
    },
    setVolume(value) {
      if (!Number.isFinite(value)) return;
      settings.volume = Math.max(0, Math.min(1, value));
      if (master)
        master.gain.setTargetAtTime(
          settings.volume,
          context.currentTime,
          0.025,
        );
      save();
      changed();
    },
    dispose() {
      NG.radio.stop();
      if (context) context.close();
      context = null;
      master = null;
      noise = null;
    },
    // Exposed read-only counters make scheduling/leak tests possible without real speakers.
    get activeVoices() {
      return voices.size;
    },
  };
})();
