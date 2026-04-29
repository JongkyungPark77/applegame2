function loadRankings() {
  try {
    const raw = localStorage.getItem(RANKING_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(x => Number.isFinite(x.score)) : [];
  } catch (_) { return []; }
}

function saveRanking(scoreValue) {
  const list = loadRankings();
  list.push({ score: scoreValue, date: new Date().toLocaleDateString("ko-KR") });
  list.sort((a, b) => b.score - a.score);
  const top = list.slice(0, 5);
  try { localStorage.setItem(RANKING_KEY, JSON.stringify(top)); } catch (_) {}
  return top;
}

function renderRankings(list) {
  const el = document.getElementById("rankingList");
  el.innerHTML = ""; el.hidden = false;
  if (!list.length) {
    const li = document.createElement("li");
    li.textContent = "아직 기록이 없습니다.";
    el.appendChild(li); return;
  }
  const medals = ["🥇","🥈","🥉","4위","5위"];
  list.forEach((item, i) => {
    const li = document.createElement("li");
    const rank = document.createElement("span");
    const sc   = document.createElement("span");
    rank.textContent = medals[i] || `${i+1}위`;
    sc.textContent   = `${item.score}개`;
    sc.className     = "rank-score";
    li.append(rank, sc);
    el.appendChild(li);
  });
}
