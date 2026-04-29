// ── Board resize ────────────────────────────────────────────────
function resizeBoard() {
  const vw = window.innerWidth;
  const shell = document.getElementById("boardShell");
  const sr    = shell.getBoundingClientRect();
  const isTiny    = vw <= 430;
  const isCompact = vw <= 780;
  const shellPad  = isTiny ? 6  : isCompact ? 8  : 14;
  const gridPad   = isTiny ? 5  : isCompact ? 7  : 12;
  const gap       = isTiny ? 3  : isCompact ? 4  : 5;
  const maxCell   = isCompact ? 60 : 75;
  const minCell   = vw <= 360 ? 24 : 28;
  const w = Math.max(240, sr.width  || vw);
  const h = Math.max(220, sr.height || innerHeight * 0.52);
  const availW = w - shellPad*2 - gridPad*2 - gap*(COLS-1) - 2;
  const availH = h - shellPad*2 - gridPad*2 - gap*(ROWS-1) - 2;
  const rawCell = Math.max(1, Math.floor(Math.min(availW/COLS, availH/ROWS)));
  const cell = clamp(rawCell, Math.min(minCell, rawCell), maxCell);
  const root = document.documentElement;
  root.style.setProperty("--cell",     `${cell}px`);
  root.style.setProperty("--gap",      `${gap}px`);
  root.style.setProperty("--grid-pad", `${gridPad}px`);
  root.style.setProperty("--shell-pad",`${shellPad}px`);
  if (window.syncApples3D) requestAnimationFrame(syncApples3D);
  if (window.resizeTrailCanvas) requestAnimationFrame(resizeTrailCanvas);
}

// ── Init ────────────────────────────────────────────────────────
function init() {
  initBgCanvas();
  initTrailCanvas();
  if (window.initApple3D) initApple3D();
  setupInput();
  updateSoundButton();
  updateHud();
  updateHintButton();
  updateShuffleButton();
  resizeBoard();

  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("newBtn").addEventListener("click",   startGame);
  document.getElementById("hintBtn").addEventListener("click",  showHint);
  document.getElementById("shuffleBtn").addEventListener("click", manualShuffle);
  document.getElementById("soundBtn").addEventListener("click", toggleSound);

  window.addEventListener("resize", () => { resizeBoard(); clearSelectionVisuals(); if (window.syncApples3D) syncApples3D(); });
  window.addEventListener("orientationchange", () => {
    setTimeout(() => { resizeBoard(); clearSelectionVisuals(); }, 200);
  });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resizeBoard);
}

init();
