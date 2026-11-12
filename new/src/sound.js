// Sound, made in the browser and loaded from nowhere: the wind and the wash of
// the sea underneath everything, the ship's bell, the boatswain's pipe, the
// crack of a sail going and the thump of an iron going home. Silent until the
// owner first clicks, as browsers require.
function makeSound() {
  let ac = null, windGain = null, windTone = null, seaGain = null, on = true;
  try { on = localStorage.getItem('whaler-sound') !== 'off'; } catch { /* no storage */ }

  function noise(seconds) {
    const b = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = last * 0.96 + (Math.random() * 2 - 1) * 0.04; d[i] = last * 6; }   // soft, low noise
    return b;
  }
  function bed(freq, q) {
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noise(4); src.loop = true;
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = 0;
    src.connect(f).connect(g).connect(ac.destination); src.start();
    return [g, f];
  }
  function begin() {
    if (ac || !on) return;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    [windGain, windTone] = bed(500, 0.7);
    [seaGain] = bed(180, 0.5);
  }
  addEventListener('pointerdown', begin, { once: false });

  // One struck or blown note. type: the wave; f0 to f1: its pitch over its length.
  function note(type, f0, f1, len, vol, at = 0) {
    if (!ac || !on) return;
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at;
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + len);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + len);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + len + 0.05);
  }
  function burst(freq, len, vol) {
    if (!ac || !on) return;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime;
    src.buffer = noise(len); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.6;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(f).connect(g).connect(ac.destination); src.start(t);
  }
  const strike = (at) => { note('sine', 1180, 1170, 1.4, 0.12, at); note('sine', 2950, 2930, 0.7, 0.04, at); };

  return {
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem('whaler-sound', on ? 'on' : 'off'); } catch { /* no storage */ } if (!on && ac) { ac.close(); ac = null; } else begin(); return on; },
    // Each frame: how hard it blows (the wind's drive) and how fast she goes.
    weather(drive, speed, quiet) {
      if (!ac) return;
      const k = quiet ? 0.35 : 1, t = ac.currentTime;
      windGain.gain.setTargetAtTime(0.012 + 0.07 * drive * drive * k, t, 0.6);
      windTone.frequency.setTargetAtTime(320 + 420 * drive, t, 0.8);
      seaGain.gain.setTargetAtTime((0.03 + 0.006 * speed) * k, t, 0.6);
    },
    bells(pairs = 1) { for (let i = 0; i < pairs; i++) { strike(i * 0.75); strike(i * 0.75 + 0.28); } },   // struck in pairs, as at sea
    alarm() { for (let i = 0; i < 6; i++) strike(i * 0.17); },
    pipe() { note('sine', 2100, 3300, 0.45, 0.05); note('sine', 3300, 2200, 0.5, 0.05, 0.45); },
    crack() { burst(900, 0.5, 0.5); },
    thump() { burst(140, 0.35, 0.6); },
    lance() { burst(260, 0.14, 0.22); },
    cask() { note('sine', 190, 120, 0.09, 0.07); },                 // a barrel run below
    splash() { burst(1600, 0.9, 0.25); },
    cheer() { note('triangle', 520, 660, 0.25, 0.05); note('triangle', 660, 880, 0.4, 0.05, 0.22); },
  };
}

export const sound = makeSound();
