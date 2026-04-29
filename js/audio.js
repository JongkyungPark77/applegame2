let audioCtx = null;
let soundEnabled = true;

function ensureAudio() {
  if (!soundEnabled) return null;
  const Cls = window.AudioContext || window.webkitAudioContext;
  if (!Cls) return null;
  if (!audioCtx) audioCtx = new Cls();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq, delay = 0, dur = 0.12, type = "sine", vol = 0.055) {
  const ctx = ensureAudio(); if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(t); osc.stop(t + dur + 0.05);
}

function playSweep(from, to, dur = 0.18, type = "sawtooth", vol = 0.045) {
  const ctx = ensureAudio(); if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(t); osc.stop(t + dur + 0.05);
}

function playNoise(dur = 0.12, vol = 0.04) {
  const ctx = ensureAudio(); if (!ctx) return;
  const sr  = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.max(1, Math.floor(sr * dur)), sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  const g   = ctx.createGain();
  const t   = ctx.currentTime;
  src.buffer = buf;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(g); g.connect(ctx.destination); src.start(t);
}

function playSound(name, value = 0) {
  if (!soundEnabled) return;
  switch (name) {
    case "success":
      playTone(523.25, 0,    .10, "triangle", .060);
      playTone(659.25, .07,  .10, "triangle", .055);
      playTone(783.99, .14,  .16, "triangle", .060);
      playTone(1046.5, .22,  .18, "sine",     .045);
      break;
    case "combo":
      playTone(783.99, 0,    .08, "triangle", .070);
      playTone(1046.5, .06,  .12, "triangle", .080);
      playTone(1318.5, .13,  .16, "sine",     .065);
      playTone(1567.9, .22,  .24, "sine",     .055);
      playSweep(600, 1400, .18, "triangle", .035);
      break;
    case "wrong":
      playSweep(220, 82, .22, "sawtooth", .045);
      playNoise(.12, .025);
      break;
    case "countdown": {
      const urgent = value <= 3;
      playTone(urgent ? 880 : 660, 0, urgent ? .16 : .11, "square", urgent ? .055 : .04);
      if (urgent) playTone(440, .08, .12, "square", .035);
      break;
    }
    case "hint":
      playTone(587.33, 0,   .08, "sine", .04);
      playTone(880,    .08, .14, "sine", .045);
      break;
    case "shuffle":
      playSweep(180, 720, .24, "triangle", .04);
      playNoise(.2, .025);
      playTone(523.25, .24, .09, "sine", .035);
      break;
    case "start":
      playTone(392,    0,   .08, "triangle", .04);
      playTone(523.25, .08, .10, "triangle", .045);
      playTone(659.25, .17, .12, "triangle", .050);
      break;
    case "end":
      playTone(659.25, 0,   .16, "triangle", .050);
      playTone(523.25, .15, .18, "triangle", .045);
      playTone(392,    .32, .24, "sine",     .045);
      break;
    case "perfect":
      playTone(1046.5, 0,   .12, "triangle", .055);
      playTone(1318.5, .10, .14, "triangle", .06);
      playTone(1567.9, .20, .18, "sine",     .065);
      playTone(2093.0, .32, .28, "sine",     .055);
      playSweep(800, 2400, .28, "triangle", .04);
      break;
  }
}

function updateSoundButton() {
  const btn = document.getElementById("soundBtn");
  if (!btn) return;
  btn.textContent = soundEnabled ? "🔊" : "🔇";
  btn.setAttribute("aria-pressed", String(soundEnabled));
  btn.setAttribute("aria-label", soundEnabled ? "소리 켜짐" : "소리 꺼짐");
  btn.title = soundEnabled ? "소리 켜짐" : "소리 꺼짐";
  btn.classList.toggle("off", !soundEnabled);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  updateSoundButton();
  if (soundEnabled) { ensureAudio(); playSound("hint"); }
}
