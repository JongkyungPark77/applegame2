// ── Background aurora canvas ──────────────────────────────────
let bgOrbs = [];
function initBgCanvas() {
  const canvas = document.getElementById("bgCanvas");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0;
  const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; };
  resize(); addEventListener("resize", resize);

  const ORB_DEFS = [
    [74,222,128], [96,165,250], [167,139,250],
    [253,224,71],  [34,211,238], [248,113,113],
    [251,146,60],  [74,222,128], [96,165,250],
  ];
  bgOrbs = ORB_DEFS.map(([r,g,b]) => ({
    x: Math.random()*innerWidth, y: Math.random()*innerHeight,
    r: 140 + Math.random()*220,
    rgb: `${r},${g},${b}`,
    vx: (Math.random()-.5)*.2, vy: (Math.random()-.5)*.2,
    phase: Math.random()*Math.PI*2, speed: .0003+Math.random()*.0003,
  }));

  (function draw(ts) {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#060a0f"; ctx.fillRect(0,0,W,H);
    for (const o of bgOrbs) {
      o.x += o.vx; o.y += o.vy;
      if (o.x < -o.r*2) o.x = W+o.r; if (o.x > W+o.r*2) o.x = -o.r;
      if (o.y < -o.r*2) o.y = H+o.r; if (o.y > H+o.r*2) o.y = -o.r;
      const pulse = .52 + .48*Math.sin(ts*o.speed+o.phase);
      const rg = ctx.createRadialGradient(o.x,o.y,0, o.x,o.y, o.r*(0.8+pulse*.35));
      rg.addColorStop(0,   `rgba(${o.rgb},${.10*pulse})`);
      rg.addColorStop(.5,  `rgba(${o.rgb},${.038*pulse})`);
      rg.addColorStop(1,   `rgba(${o.rgb},0)`);
      ctx.fillStyle = rg; ctx.fillRect(0,0,W,H);
    }
    requestAnimationFrame(draw);
  })(0);
}

// ── Drag sparkle trail ─────────────────────────────────────────
let trailCtx = null, trailParticles = [];
function initTrailCanvas() {
  const canvas = document.getElementById("trailCanvas");
  const wrap   = document.getElementById("gridWrap");
  const resize = () => {
    const r = wrap.getBoundingClientRect();
    canvas.width = r.width; canvas.height = r.height;
  };
  window.resizeTrailCanvas = resize;
  resize(); addEventListener("resize", resize);
  trailCtx = canvas.getContext("2d");
  (function loop() {
    trailCtx.clearRect(0,0, canvas.width, canvas.height);
    trailParticles = trailParticles.filter(p => p.life > 0);
    for (const p of trailParticles) {
      p.x += p.vx; p.y += p.vy; p.vy += .12; p.life -= .04;
      const a = Math.max(0, p.life);
      trailCtx.beginPath();
      trailCtx.arc(p.x, p.y, p.r*a, 0, Math.PI*2);
      trailCtx.fillStyle = `rgba(${p.rgb},${a*.85})`;
      trailCtx.fill();
    }
    requestAnimationFrame(loop);
  })();
}

function addTrailParticle(x, y) {
  if (trailParticles.length > 90) return;
  const canvas = document.getElementById("trailCanvas");
  const r = canvas.getBoundingClientRect();
  x -= r.left;
  y -= r.top;
  const rgbs = ["253,224,71","74,222,128","96,165,250","255,255,255","248,113,113","167,139,250"];
  trailParticles.push({
    x, y,
    vx: (Math.random()-.5)*2.8,
    vy: (Math.random()-.5)*2.8 - .8,
    r: 2 + Math.random()*3.2,
    life: .6 + Math.random()*.5,
    rgb: rgbs[Math.floor(Math.random()*rgbs.length)],
  });
}

// ── DOM FX factory ─────────────────────────────────────────────
const fxLayer = document.getElementById("fxLayer");
function addFx(el, ttl) { fxLayer.appendChild(el); setTimeout(() => el.remove(), ttl); }

function addText(text, x, y, color = "#fde047") {
  const el = document.createElement("div"); el.className = "pop-text";
  el.textContent = text;
  el.style.cssText = `--x:${x}px;--y:${y}px;--c:${color}`;
  addFx(el, 950);
}

function addRing(x, y, color, size) {
  const el = document.createElement("div"); el.className = "ring";
  el.style.cssText = `--x:${x}px;--y:${y}px;--c:${color};--size:${size}px`;
  addFx(el, 700);
}

function addSlash(x, y, width, angle) {
  const el = document.createElement("div"); el.className = "slash";
  el.style.cssText = `--x:${x}px;--y:${y}px;--w:${width}px;--a:${angle}deg`;
  addFx(el, 560);
}

function addParticles(x, y, count, colors, shape = "circle") {
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div"); el.className = "particle";
    const ang = Math.random()*Math.PI*2, dist = 48 + Math.random()*170, sz = 4 + Math.random()*8;
    el.style.cssText = [
      `--x:${x}px`, `--y:${y}px`,
      `--dx:${Math.cos(ang)*dist}px`,
      `--dy:${Math.sin(ang)*dist + 42}px`,
      `--s:${sz}px`,
      `--r:${shape==="square"?"3px":"999px"}`,
      `--c:${colors[Math.floor(Math.random()*colors.length)]}`,
      `--rot:${Math.floor(Math.random()*360)}deg`,
      `--life:${600+Math.random()*500}ms`,
    ].join(";");
    addFx(el, 1200);
  }
}

function addShockwave(x, y, color = "#fde047") {
  for (let i = 0; i < 3; i++) {
    const el = document.createElement("div"); el.className = "shockwave";
    el.style.cssText = `--x:${x}px;--y:${y}px;--c:${color};--delay:${i*130}ms`;
    document.body.appendChild(el); setTimeout(() => el.remove(), 900 + i*130);
  }
}

function screenFlash(color = "rgba(253,224,71,.15)") {
  const el = document.createElement("div"); el.className = "screen-flash";
  el.style.setProperty("--fc", color);
  document.body.appendChild(el); setTimeout(() => el.remove(), 550);
}

function boardShake(intensity = 1) {
  const shell = document.getElementById("boardShell");
  shell.classList.remove("shake"); void shell.offsetWidth; shell.classList.add("shake");
  setTimeout(() => shell.classList.remove("shake"), 460);
}

// ── Success / fail composite effects ──────────────────────────
function successEffect(cells, isCombo = false) {
  const box  = screenCenterOfCells(cells);
  const style = pick(["burst","supernova","aurora","prism"]);
  playSound(isCombo ? "combo" : "success"); boardShake(.85);

  if (style === "burst") {
    addParticles(box.x, box.y, 56, PALETTE.success);
    addRing(box.x, box.y, "#fde047", Math.max(box.w,box.h)+100);
    addShockwave(box.x, box.y, "#fde047");
    screenFlash("rgba(253,224,71,.14)");
    addText(`+${cells.length}`, box.x, box.y-10, "#4ade80");
  } else if (style === "supernova") {
    addParticles(box.x, box.y, 76, PALETTE.nova, "square");
    addRing(box.x, box.y, "#fbbf24", Math.max(box.w,box.h)+150);
    addRing(box.x, box.y, "#a78bfa", Math.max(box.w,box.h)+60);
    addShockwave(box.x, box.y, "#fde047");
    screenFlash("rgba(251,191,36,.22)");
    addText("NOVA!", box.x, box.y-10, "#fde047");
  } else if (style === "aurora") {
    for (const a of cells) {
      const r = a.el.getBoundingClientRect();
      addRing(r.left+r.width/2, r.top+r.height/2, "#22d3ee", r.width*2.4);
    }
    addParticles(box.x, box.y, 46, PALETTE.hint);
    addShockwave(box.x, box.y, "#22d3ee");
    screenFlash("rgba(34,211,238,.13)");
    addText("CLEAR", box.x, box.y-10, "#67e8f9");
  } else {
    addParticles(box.x, box.y, 64, PALETTE.rainbow);
    addRing(box.x, box.y, "#c4b5fd", Math.max(box.w,box.h)+120);
    addShockwave(box.x, box.y, "#a78bfa");
    screenFlash("rgba(167,139,250,.18)");
    addText(`${TARGET_SUM}!`, box.x, box.y-10, "#c4b5fd");
  }
  if (isCombo) {
    setTimeout(() => addText("🔥 COMBO!", box.x, box.y-54, "#fb923c"), 120);
  }
}

function wrongEffect(cells, sum) {
  const box   = screenCenterOfCells(cells);
  const style = pick(["cross","smoke","danger"]);
  playSound("wrong"); boardShake(1.2);
  if (style === "cross") {
    addSlash(box.x, box.y, Math.max(90, box.w+64), 36);
    addSlash(box.x, box.y, Math.max(90, box.w+64), -36);
    addText("MISS", box.x, box.y-10, "#fb7185");
  } else if (style === "smoke") {
    addParticles(box.x, box.y, 28, PALETTE.wrong);
    addText(`합 ${sum}`, box.x, box.y-10, "#fb7185");
  } else {
    document.body.classList.remove("danger"); void document.body.offsetWidth;
    document.body.classList.add("danger");
    setTimeout(() => document.body.classList.remove("danger"), 540);
    addRing(box.x, box.y, "#fb7185", Math.max(box.w,box.h)+80);
    addText("다시", box.x, box.y-10, "#fb7185");
  }
}

function triggerCountdown(n) {
  const cd = document.getElementById("countdown");
  const cn = document.getElementById("countNumber");
  const styles = ["blast","slam","spin"];
  const color  = n<=3 ? "#fb7185" : n<=5 ? "#fb923c" : "#fde047";
  playSound("countdown", n);
  cn.textContent = n;
  cd.style.setProperty("--count-color", color);
  cd.className = "countdown"; void cd.offsetWidth;
  cd.classList.add("show", styles[n % 3]);
  document.body.classList.remove("danger"); void document.body.offsetWidth;
  document.body.classList.add("danger");
  boardShake(n<=3 ? 1.5 : 0.9);
  clearTimeout(window._cdCleanup);
  window._cdCleanup = setTimeout(() => {
    cd.className = "countdown"; document.body.classList.remove("danger");
  }, 960);
}

// ── Geometry helpers ───────────────────────────────────────────
function screenCenterOfCells(cells) {
  if (!cells.length) {
    const r = document.getElementById("gridWrap").getBoundingClientRect();
    return { x: r.left+r.width/2, y: r.top+r.height/2, w: r.width, h: r.height };
  }
  let x=Infinity, y=Infinity, x2=-Infinity, y2=-Infinity;
  for (const c of cells) {
    const r = c.el.getBoundingClientRect();
    x=Math.min(x,r.left); y=Math.min(y,r.top);
    x2=Math.max(x2,r.right); y2=Math.max(y2,r.bottom);
  }
  return { x:(x+x2)/2, y:(y+y2)/2, w:x2-x, h:y2-y };
}
