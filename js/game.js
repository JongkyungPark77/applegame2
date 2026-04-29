// ── Game state ─────────────────────────────────────────────────
window.GS = {
  score: 0, timeLeft: TOTAL_TIME,
  timerId: null, cleanupId: null, hintCleanupId: null,
  reshuffling: false, hintsLeft: MAX_HINTS, shufflesLeft: MAX_SHUFFLES,
  cleared: 0, scoreRecorded: false,
  dragging: false, activePointerId: null,
  dragStart: null, dragEnd: null,
  selected: [], selectedSum: 0,
  combo: 0, lastClearTime: 0,
};

// ── HUD ────────────────────────────────────────────────────────
function updateHud() {
  const gs = window.GS;
  const diff = DIFFICULTY_LEVELS.find(d => initialMoves >= d.min);
  document.getElementById("score").textContent     = gs.score;
  document.getElementById("target").textContent    = TARGET_SUM;
  const targetFooter = document.getElementById("targetFooter");
  if (targetFooter) targetFooter.textContent = TARGET_SUM;
  document.getElementById("numberRange").textContent = `1-${MAX_APPLE_NUMBER}`;
  document.getElementById("difficulty").textContent  = diff.label;
  document.getElementById("difficulty").className    = `value difficulty ${diff.level}`;
  document.getElementById("difficulty").title = `가능한 조합 ${initialMoves}개`;

  const sumEl = document.getElementById("sum");
  sumEl.textContent = gs.selectedSum;
  sumEl.className = "value" +
    (gs.selectedSum === TARGET_SUM ? " good" : gs.selectedSum > TARGET_SUM ? " bad" : "");

  const timerEl = document.getElementById("timer");
  timerEl.textContent = `${Math.floor(gs.timeLeft/60)}:${String(gs.timeLeft%60).padStart(2,"0")}`;
  timerEl.className = "value" + (gs.timeLeft<=10 ? " bad" : "");

  const totalCells = ROWS * COLS;
  const timePct = clamp((gs.timeLeft / TOTAL_TIME) * 100, 0, 100);
  const goalPct = clamp((gs.cleared / totalCells) * 100, 0, 100);
  document.documentElement.style.setProperty("--time-progress", `${timePct}%`);
  document.documentElement.style.setProperty("--goal-progress", `${goalPct}%`);
  const goalLabel = document.getElementById("goalProgressLabel");
  if (goalLabel) goalLabel.textContent = `${gs.cleared}/${totalCells}`;
}

// ── Combo badge ────────────────────────────────────────────────
function updateComboBadge() {
  const badge = document.getElementById("comboBadge");
  const gs    = window.GS;
  if (gs.combo >= 2) {
    badge.hidden = false; badge.textContent = `${gs.combo}x COMBO`;
    badge.style.animation = "none"; void badge.offsetWidth;
    badge.style.animation = "";
  } else { badge.hidden = true; }
}

// ── Hint ───────────────────────────────────────────────────────
function updateHintButton() {
  const gs  = window.GS;
  const btn = document.getElementById("hintBtn");
  btn.textContent = `HINT ${gs.hintsLeft}`;
  btn.disabled = !gs.timerId || gs.reshuffling || gs.hintsLeft<=0;
}

function updateShuffleButton() {
  const gs  = window.GS;
  const btn = document.getElementById("shuffleBtn");
  if (!btn) return;
  btn.textContent = `SHUFFLE ${gs.shufflesLeft}`;
  btn.disabled = !gs.timerId || gs.reshuffling || gs.dragging || gs.shufflesLeft<=0;
}

function manualShuffle() {
  const gs = window.GS;
  if (!gs.timerId || gs.dragging || gs.reshuffling) return;
  if (gs.shufflesLeft <= 0) {
    document.getElementById("message").textContent = "셔플을 모두 사용했습니다.";
    playSound("wrong");
    return;
  }
  gs.shufflesLeft--;
  updateShuffleButton();
  reshuffleRemaining("셔플로 과일을 섞습니다.");
}

function clearHints() {
  clearTimeout(window.GS.hintCleanupId); window.GS.hintCleanupId = null;
  for (const a of activeApples()) a.el.classList.remove("hint");
  const sr = document.getElementById("selectRect");
  if (!window.GS.dragging) { sr.style.display="none"; sr.className="select-rect"; }
}

function showHint() {
  const gs = window.GS;
  if (!gs.timerId || gs.dragging || gs.reshuffling) return;
  if (gs.hintsLeft <= 0) {
    document.getElementById("message").textContent = "힌트를 모두 사용했습니다.";
    playSound("wrong"); return;
  }
  ensureAudio(); clearHints();
  const move = findMove();
  if (!move) { reshuffleRemaining("힌트를 줄 조합이 없어 재배열합니다."); return; }
  for (const a of move.cells) a.el.classList.add("hint");
  gs.hintsLeft--; updateHintButton();
  drawCellGroupRect(move.cells, "select-rect hint");
  const box = screenCenterOfCells(move.cells);
  addText("힌트", box.x, box.y-8, "#60a5fa");
  playSound("hint");
  document.getElementById("message").textContent = `표시된 사과들의 합이 ${TARGET_SUM}입니다.`;
  gs.hintCleanupId = setTimeout(() => {
    clearHints();
    document.getElementById("message").textContent = `직사각형으로 드래그해서 합계 ${TARGET_SUM}을 만드세요.`;
  }, 2800);
}

function drawCellGroupRect(cells, cls) {
  if (!cells.length) return;
  let x=Infinity,y=Infinity,x2=-Infinity,y2=-Infinity;
  for (const a of cells) {
    const r=cellRect(a.row,a.col); x=Math.min(x,r.x); y=Math.min(y,r.y);
    x2=Math.max(x2,r.x2); y2=Math.max(y2,r.y2);
  }
  const sr=document.getElementById("selectRect");
  sr.style.left=`${x}px`; sr.style.top=`${y}px`;
  sr.style.width=`${x2-x}px`; sr.style.height=`${y2-y}px`;
  sr.style.display="block"; sr.className=cls;
}

// ── Selection ──────────────────────────────────────────────────
function makeDragRect() {
  const gs=window.GS; if (!gs.dragStart||!gs.dragEnd) return null;
  const x=Math.min(gs.dragStart.x,gs.dragEnd.x), y=Math.min(gs.dragStart.y,gs.dragEnd.y);
  const x2=Math.max(gs.dragStart.x,gs.dragEnd.x), y2=Math.max(gs.dragStart.y,gs.dragEnd.y);
  return {x,y,x2,y2,w:x2-x,h:y2-y};
}

function rectsOverlap(a,b) { return a.x<=b.x2&&a.x2>=b.x&&a.y<=b.y2&&a.y2>=b.y; }

function updateSelection() {
  const gs=window.GS; const rect=makeDragRect();
  gs.selected=[]; gs.selectedSum=0; clearHints();
  for (const row of grid) for (const a of row) a.el.classList.remove("selected","valid");
  if (!rect) { updateHud(); return; }

  const hit={x:rect.x-HIT_PAD,y:rect.y-HIT_PAD,x2:rect.x2+HIT_PAD,y2:rect.y2+HIT_PAD};
  const seen=new Set();
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    const a=grid[r][c]; if (a.removed) continue;
    const key=`${r}:${c}`; if (seen.has(key)) continue;
    if (!rectsOverlap(hit,cellRect(r,c))) continue;
    seen.add(key); gs.selected.push(a); gs.selectedSum+=a.value;
  }

  const valid = gs.selectedSum===TARGET_SUM && gs.selected.length>0;
  for (const a of gs.selected) a.el.classList.add(valid?"valid":"selected");

  const sr=document.getElementById("selectRect");
  sr.style.left=`${rect.x}px`; sr.style.top=`${rect.y}px`;
  sr.style.width=`${Math.max(2,rect.w)}px`; sr.style.height=`${Math.max(2,rect.h)}px`;
  sr.style.display="block";
  sr.className="select-rect"+(valid?" valid":gs.selectedSum>TARGET_SUM?" over":"");

  document.getElementById("message").textContent = gs.selected.length
    ? `선택 합 ${gs.selectedSum} / 목표 ${TARGET_SUM}`
    : "과일 위에서 드래그하세요.";
  updateHud();
}

function clearSelectionVisuals() {
  const gs=window.GS; clearHints();
  gs.dragging=false; gs.dragStart=null; gs.dragEnd=null;
  gs.selected=[]; gs.selectedSum=0;
  const sr=document.getElementById("selectRect");
  sr.style.display="none"; sr.className="select-rect";
  for (const row of grid) for (const a of row)
    a.el.classList.remove("selected","valid","wrong","hint");
  updateHud(); updateShuffleButton();
}

// ── Remove / wrong ─────────────────────────────────────────────
function removeSelected() {
  const gs    = window.GS;
  const cells = [...gs.selected];
  const now   = Date.now();
  const isCombo = (now - gs.lastClearTime) < COMBO_WINDOW_MS;

  gs.combo = isCombo ? gs.combo + 1 : 1;
  gs.lastClearTime = now;
  gs.cleared += cells.length;
  gs.score += cells.length + (gs.combo >= 2 ? gs.combo : 0);

  for (const a of cells) { a.removed=true; a.el.classList.add("removed"); }
  successEffect(cells, gs.combo>=2);
  updateComboBadge();

  document.getElementById("message").textContent = gs.combo>=2
    ? `${gs.combo}x COMBO! +${cells.length+gs.combo}개`
    : `${cells.length}개 제거!`;

  if (remainingCount()===0) { setTimeout(() => endGame("🎉 완벽 클리어!"), 300); return; }
  setTimeout(() => {
    if (gs.timerId && !gs.reshuffling && !findMove())
      reshuffleRemaining(`합계 ${TARGET_SUM} 조합이 없어 재배열합니다.`);
  }, 740);
}

function wrongSelection() {
  const gs=window.GS; if (!gs.selected.length) return;
  gs.combo=0; updateComboBadge();
  for (const a of gs.selected) {
    a.el.classList.remove("selected","valid"); a.el.classList.add("wrong");
  }
  wrongEffect([...gs.selected], gs.selectedSum);
  document.getElementById("message").textContent =
    `합이 ${gs.selectedSum}입니다. 목표 합 ${TARGET_SUM}을 맞춰보세요.`;
}

// ── Timer ──────────────────────────────────────────────────────
function tick() {
  const gs=window.GS; gs.timeLeft--;
  updateHud();
  if (gs.timeLeft<=10 && gs.timeLeft>0) triggerCountdown(gs.timeLeft);
  if (gs.timeLeft<=0) endGame("시간이 종료되었습니다.");
}

// ── Game flow ──────────────────────────────────────────────────
function startGame() {
  const gs=window.GS;
  clearInterval(gs.timerId); clearTimeout(gs.cleanupId);
  clearTimeout(gs.hintCleanupId); ensureAudio();

  Object.assign(gs, { score:0, timeLeft:TOTAL_TIME, hintsLeft:MAX_HINTS,
    shufflesLeft:MAX_SHUFFLES, cleared:0,
    scoreRecorded:false, dragging:false, activePointerId:null,
    reshuffling:false, selected:[], selectedSum:0, combo:0, lastClearTime:0 });

  document.getElementById("fxLayer").innerHTML = "";
  document.getElementById("countdown").className = "countdown";
  document.body.classList.remove("danger");
  document.getElementById("overlay").hidden = true;
  document.getElementById("finalScore").hidden = true;
  document.getElementById("rankingList").hidden = true;
  document.getElementById("rankingList").innerHTML = "";
  document.getElementById("comboBadge").hidden = true;

  resizeBoard(); createBoard(); clearSelectionVisuals();
  requestAnimationFrame(resizeBoard);
  document.getElementById("message").textContent = `합계 ${TARGET_SUM}이 되도록 직사각형으로 드래그하세요!`;
  playSound("start");
  gs.timerId = setInterval(tick, 1000);
  updateHintButton(); updateShuffleButton(); updateComboBadge();
}

function endGame(reason) {
  const gs=window.GS;
  clearInterval(gs.timerId); gs.timerId=null;
  gs.dragging=false; gs.activePointerId=null; gs.reshuffling=false;
  clearSelectionVisuals(); clearTimeout(gs.cleanupId);
  clearTimeout(gs.hintCleanupId);
  document.getElementById("countdown").className="countdown";
  document.body.classList.remove("danger"); updateHintButton(); updateShuffleButton();

  if (!gs.scoreRecorded) {
    renderRankings(saveRanking(gs.score)); gs.scoreRecorded=true;
  }

  const isPerfect = reason.includes("완벽");
  if (isPerfect) { playSound("perfect"); screenFlash("rgba(253,224,71,.28)"); }
  else playSound("end");

  document.getElementById("overlayEmoji").textContent  = isPerfect ? "🏆" : "🍎";
  document.getElementById("overlayTitle").textContent  = isPerfect ? "완벽 클리어!" : "게임 종료";
  document.getElementById("overlayText").textContent   = reason;
  document.getElementById("finalScore").textContent    = `${gs.score}개`;
  document.getElementById("finalScore").hidden         = false;
  document.getElementById("startBtn").textContent      = "다시 시작";
  document.getElementById("overlay").hidden            = false;
}
