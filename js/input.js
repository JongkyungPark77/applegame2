function pointerPos(event) {
  const r = document.getElementById("gridWrap").getBoundingClientRect();
  return {
    x: clamp(event.clientX - r.left, 0, r.width),
    y: clamp(event.clientY - r.top,  0, r.height),
  };
}

function beginDrag(event) {
  const gs = window.GS;
  if (!gs.timerId || gs.dragging || gs.reshuffling) return;
  event.preventDefault();
  gs.activePointerId = event.pointerId;
  const wrap = document.getElementById("gridWrap");
  if (wrap.setPointerCapture) wrap.setPointerCapture(event.pointerId);
  const pos = pointerPos(event);
  gs.dragStart = pos; gs.dragEnd = pos; gs.dragging = true;
  updateSelection();
}

function moveDrag(event) {
  const gs = window.GS;
  if (!gs.dragging || event.pointerId !== gs.activePointerId) return;
  event.preventDefault();
  gs.dragEnd = pointerPos(event);
  updateSelection();
  if (gs.selectedSum > 0) addTrailParticle(event.clientX, event.clientY);
}

function finishDrag(event) {
  const gs = window.GS;
  if (!gs.dragging || event.pointerId !== gs.activePointerId) return;
  event.preventDefault();
  const wrap = document.getElementById("gridWrap");
  if (wrap.hasPointerCapture && wrap.hasPointerCapture(event.pointerId))
    wrap.releasePointerCapture(event.pointerId);

  if (gs.selected.length && gs.selectedSum === TARGET_SUM) removeSelected();
  else wrongSelection();

  setTimeout(clearSelectionVisuals, 95);
  gs.activePointerId = null;
}

function cancelDrag(event) {
  const gs = window.GS;
  if (event.pointerId !== gs.activePointerId) return;
  gs.activePointerId = null; clearSelectionVisuals();
}

function setupInput() {
  const wrap = document.getElementById("gridWrap");
  wrap.addEventListener("pointerdown",   beginDrag);
  wrap.addEventListener("pointermove",   moveDrag);
  wrap.addEventListener("pointerup",     finishDrag);
  wrap.addEventListener("pointercancel", cancelDrag);
  wrap.addEventListener("contextmenu",   e => e.preventDefault());
}
