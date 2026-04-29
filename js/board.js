let grid = [];
let initialMoves = 0;

// ── Prefix-sum helpers ─────────────────────────────────────────
function buildPrefix(valueFn) {
  const p = Array.from({length:ROWS+1}, () => Array(COLS+1).fill(0));
  for (let r=1; r<=ROWS; r++)
    for (let c=1; c<=COLS; c++) {
      const a = grid[r-1][c-1];
      p[r][c] = valueFn(a) + p[r-1][c] + p[r][c-1] - p[r-1][c-1];
    }
  return p;
}

function rectTotal(p, t, l, b, r) {
  return p[b+1][r+1] - p[t][r+1] - p[b+1][l] + p[t][l];
}

// ── Move enumeration ───────────────────────────────────────────
function countMoves() {
  const S = buildPrefix(a => a.removed ? 0 : a.value);
  const C = buildPrefix(a => a.removed ? 0 : 1);
  let moves = 0;
  for (let t=0;t<ROWS;t++) for (let l=0;l<COLS;l++)
    for (let b=t;b<ROWS;b++) for (let r=l;r<COLS;r++)
      if (rectTotal(C,t,l,b,r)>0 && rectTotal(S,t,l,b,r)===TARGET_SUM) moves++;
  return moves;
}

function findMove() {
  const S = buildPrefix(a => a.removed ? 0 : a.value);
  const C = buildPrefix(a => a.removed ? 0 : 1);
  for (let h=1;h<=ROWS;h++) for (let w=1;w<=COLS;w++)
    for (let t=0;t<=ROWS-h;t++) for (let l=0;l<=COLS-w;l++) {
      const b=t+h-1, r=l+w-1;
      if (rectTotal(C,t,l,b,r)>0 && rectTotal(S,t,l,b,r)===TARGET_SUM)
        return {top:t,left:l,bottom:b,right:r, cells:cellsInRange(t,l,b,r)};
    }
  return null;
}

function cellsInRange(top, left, bottom, right) {
  const cells = [];
  for (let r=top; r<=bottom; r++)
    for (let c=left; c<=right; c++)
      if (!grid[r][c].removed) cells.push(grid[r][c]);
  return cells;
}

function activeApples() { return grid.flat().filter(a => !a.removed); }
function remainingCount() { return grid.flat().filter(a => !a.removed).length; }

// ── Apple mutation ─────────────────────────────────────────────
function applyAppleSkin(el, value) {
  for (let n = 1; n <= MAX_APPLE_NUMBER; n++) el.classList.remove(`value-${n}`);
  el.classList.add(`value-${value}`);
  el.dataset.value = value;
}

function setAppleValue(apple, value) {
  apple.value = value;
  apple.el.querySelector("span").textContent = value;
  applyAppleSkin(apple.el, value);
  apple.el.style.setProperty("--num-color", NUM_COLORS[value] || "#fff");
  if (window.updateAppleNum3D) updateAppleNum3D(apple);
}

function findForceableRange() {
  const C = buildPrefix(a => a.removed ? 0 : 1);
  for (let h=1;h<=ROWS;h++) for (let w=1;w<=COLS;w++)
    for (let t=0;t<=ROWS-h;t++) for (let l=0;l<=COLS-w;l++) {
      const b=t+h-1, r=l+w-1, cnt=rectTotal(C,t,l,b,r);
      if (cnt>=2 && cnt<=TARGET_SUM) return cellsInRange(t,l,b,r);
    }
  return null;
}

function forceGuaranteedMove() {
  const forced = findForceableRange();
  if (!forced) return false;
  for (let i=0; i<forced.length; i++)
    setAppleValue(forced[i], i===forced.length-1 ? TARGET_SUM-(forced.length-1) : 1);
  return true;
}

// ── Board creation ─────────────────────────────────────────────
function createBoard() {
  const gridEl = document.getElementById("grid");
  let attempts = 0;
  do {
    attempts++;
    grid = []; gridEl.innerHTML = "";
    for (let r=0; r<ROWS; r++) {
      grid[r] = [];
      for (let c=0; c<COLS; c++) {
        const v  = 1 + Math.floor(Math.random()*MAX_APPLE_NUMBER);
        const el = document.createElement("div");
        el.className = "apple";
        applyAppleSkin(el, v);
        el.style.setProperty("--num-color", NUM_COLORS[v] || "#fff");
        // Offset the number shimmer so identical apples do not animate in sync
        el.style.setProperty("--idle-delay", `${-(Math.random()*6).toFixed(2)}s`);
        const span = document.createElement("span");
        span.textContent = v;
        el.appendChild(span);
        gridEl.appendChild(el);
        grid[r][c] = { row:r, col:c, value:v, removed:false, el };
      }
    }
    initialMoves = countMoves();
  } while (initialMoves < 8 && attempts < 30);

  if (window.rebuildApples3D) rebuildApples3D();
}

// ── Geometry (relative to gridWrap) ───────────────────────────
function cellRect(row, col) {
  const wrap = document.getElementById("gridWrap");
  const wr   = wrap.getBoundingClientRect();
  const r    = grid[row][col].el.getBoundingClientRect();
  return { x:r.left-wr.left, y:r.top-wr.top, x2:r.right-wr.left, y2:r.bottom-wr.top,
           w:r.width, h:r.height };
}

// ── Reshuffle ──────────────────────────────────────────────────
function reshuffleRemaining(reason) {
  const gs = window.GS;
  if (!gs.timerId || gs.reshuffling) return;
  const active = activeApples();
  if (active.length < 2) { endGame("더 이상 만들 수 있는 조합이 없습니다."); return; }

  gs.reshuffling = true; updateHintButton(); updateShuffleButton();
  playSound("shuffle"); clearSelectionVisuals();

  const shell = document.getElementById("boardShell");
  shell.classList.remove("reshuffle"); void shell.offsetWidth; shell.classList.add("reshuffle");
  for (const a of active) {
    a.el.classList.remove("hint","selected","valid","wrong"); a.el.classList.add("shuffle");
  }

  const box = screenCenterOfCells(active);
  addRing(box.x, box.y, "#60a5fa", Math.max(box.w,box.h)+120);
  addParticles(box.x, box.y, Math.min(72, 24+active.length), PALETTE.shuffle, "square");
  addText("재배열", box.x, box.y-8, "#60a5fa");
  document.getElementById("message").textContent = reason;

  setTimeout(() => {
    for (const a of active) setAppleValue(a, 1+Math.floor(Math.random()*MAX_APPLE_NUMBER));
    if (!findMove() && !forceGuaranteedMove()) { gs.reshuffling=false; updateShuffleButton(); endGame("조합이 없어 게임을 종료합니다."); return; }
    initialMoves = countMoves(); updateHud();
    document.getElementById("message").textContent = `재배열 완료. 합계 ${TARGET_SUM}을 찾아보세요!`;
    setTimeout(() => {
      for (const a of active) a.el.classList.remove("shuffle");
      shell.classList.remove("reshuffle");
      gs.reshuffling = false; updateHintButton(); updateShuffleButton();
    }, 530);
  }, 360);
}
