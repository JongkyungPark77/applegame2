const COLS = 10;
const ROWS = 8;
const TOTAL_TIME = 120;
const TARGET_SUM = 10;
const MAX_APPLE_NUMBER = 9;
const MAX_HINTS = 3;
const MAX_SHUFFLES = 2;
const RANKING_KEY = "applegame2.rankings.v2";
const HIT_PAD = 4;
const COMBO_WINDOW_MS = 1600;

const NUM_COLORS = [
  null,
  "#fca5a5", // 1 – rose
  "#fdba74", // 2 – orange
  "#fde047", // 3 – yellow
  "#86efac", // 4 – lime
  "#f0fdf4", // 5 – white
  "#67e8f9", // 6 – cyan
  "#93c5fd", // 7 – blue
  "#c4b5fd", // 8 – purple
  "#f87171", // 9 – red
];

const PALETTE = {
  success: ["#fde047","#4ade80","#ffffff","#fb7185","#60a5fa","#a78bfa"],
  wrong:   ["#6b7280","#9ca3af","#fb7185","#ef4444"],
  hint:    ["#60a5fa","#a78bfa","#c4b5fd","#ffffff"],
  shuffle: ["#60a5fa","#fde047","#4ade80","#ffffff","#a78bfa"],
  rainbow: ["#f87171","#fb923c","#fde047","#4ade80","#60a5fa","#a78bfa"],
  gold:    ["#fde047","#fbbf24","#f59e0b","#ffffff"],
  nova:    ["#fde047","#fb923c","#f87171","#a78bfa","#60a5fa","#ffffff"],
};

const DIFFICULTY_LEVELS = [
  { min: 34, label: "쉬움",       level: "easy"   },
  { min: 22, label: "보통",       level: "normal" },
  { min: 12, label: "어려움",     level: "hard"   },
  { min:  0, label: "매우 어려움", level: "expert" },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
