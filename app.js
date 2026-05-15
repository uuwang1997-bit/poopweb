// iOS PWA touch fix
document.addEventListener('touchstart', function(){}, {passive: true});

// ── Storage helpers ──────────────────────────────────────────────
const STORE_KEY = 'bodytracker_v1';

function loadAll() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch { return {}; }
}

function saveAll(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function getDay(dateStr) {
  const all = loadAll();
  return all[dateStr] || { poop: false, period: false, probiotic: false, poopBefore: false, weight: '', note: '' };
}

function setDay(dateStr, record) {
  const all = loadAll();
  all[dateStr] = record;
  saveAll(all);
}

// ── Date helpers ──────────────────────────────────────────────────
function toKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtDate(d) {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} 周${days[d.getDay()]}`;
}

function fmtShortDate(d) {
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MONTH_NAMES = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

// ── State ─────────────────────────────────────────────────────────
const today = new Date();
today.setHours(0,0,0,0);

let currentDay = new Date(today);
let currentWeekStart = getWeekMonday(today);
let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

function getWeekMonday(d) {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0,0,0,0);
  return copy;
}

// ── Status bar time ───────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById('statusTime').textContent =
    String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
}
updateClock();
setInterval(updateClock, 10000);

// ── Header date ───────────────────────────────────────────────────
document.getElementById('headerDate').textContent = fmtDate(today);

// ── Nav tab switching ─────────────────────────────────────────────
document.querySelectorAll('.nav-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
    if (btn.dataset.view === 'week') renderWeek();
    if (btn.dataset.view === 'month') renderMonth();
  });
});

// ══════════════════════════════════════════════════════════════════
// DAY VIEW
// ══════════════════════════════════════════════════════════════════
const checkItems = document.querySelectorAll('.check-item');
const weightInput = document.getElementById('weightInput');
const noteInput = document.getElementById('noteInput');
const saveBtn = document.getElementById('saveBtn');
const saveMsg = document.getElementById('saveMsg');

function loadDayView() {
  const key = toKey(currentDay);
  const rec = getDay(key);

  checkItems.forEach(item => {
    const k = item.dataset.key;
    item.classList.toggle('checked', !!rec[k]);
  });

  weightInput.value = rec.weight || '';
  noteInput.value = rec.note || '';

  const isToday = sameDay(currentDay, today);
  document.getElementById('dayLabel').textContent = isToday
    ? `今天  ${fmtShortDate(currentDay)}`
    : fmtShortDate(currentDay);
}

function getDayRecord() {
  const rec = { poop: false, period: false, probiotic: false, poopBefore: false, weight: '', note: '' };
  checkItems.forEach(item => {
    rec[item.dataset.key] = item.classList.contains('checked');
  });
  rec.weight = weightInput.value ? parseFloat(weightInput.value).toFixed(1) : '';
  rec.note = noteInput.value.trim();
  return rec;
}

// Toggle checks
checkItems.forEach(item => {
  item.addEventListener('click', () => item.classList.toggle('checked'));
});

// Date nav
document.getElementById('dayPrev').addEventListener('click', () => {
  currentDay = addDays(currentDay, -1);
  loadDayView();
});
document.getElementById('dayNext').addEventListener('click', () => {
  currentDay = addDays(currentDay, 1);
  loadDayView();
});

// Save
saveBtn.addEventListener('click', () => {
  setDay(toKey(currentDay), getDayRecord());
  saveMsg.textContent = '✓ 已保存';
  saveMsg.classList.add('visible');
  setTimeout(() => saveMsg.classList.remove('visible'), 2000);
});

loadDayView();

// ══════════════════════════════════════════════════════════════════
// WEEK VIEW
// ══════════════════════════════════════════════════════════════════
function renderWeek() {
  const container = document.getElementById('weekCards');
  container.innerHTML = '';

  const monday = currentWeekStart;
  const sunday = addDays(monday, 6);

  document.getElementById('weekLabel').textContent =
    fmtShortDate(monday) + ' — ' + fmtShortDate(sunday);

  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    const key = toKey(d);
    const rec = getDay(key);
    const isToday = sameDay(d, today);

    const stars = buildStars(rec);
    const hasAny = rec.poop || rec.period || rec.probiotic || rec.poopBefore;
    const hasRecord = hasAny || rec.weight || rec.note;

    const card = document.createElement('div');
    card.className = 'week-card' + (isToday ? ' today-card' : '');

    const wt = rec.weight ? rec.weight + ' kg' : '—';
    const wtClass = rec.weight ? '' : 'empty';

    card.innerHTML = `
      <div class="week-card-header">
        <span class="week-card-dayname">${WEEKDAY_CN[d.getDay()]}${isToday ? ' · 今天' : ''}</span>
        <span class="week-card-date">${fmtShortDate(d)}</span>
        <span class="week-card-weight ${wtClass}">${wt}</span>
      </div>
      <div class="week-card-body">
        <div class="week-stars">
          ${hasAny ? stars : '<span class="week-no-data">无打卡</span>'}
        </div>
        ${rec.note ? `<div class="week-note">${escHtml(rec.note)}</div>` : ''}
        <span class="week-edit-hint">编辑 →</span>
      </div>
    `;
    card.style.cursor = 'pointer';
    const dateCopy = new Date(d);
    card.addEventListener('click', () => switchToDay(dateCopy));
    container.appendChild(card);
  }
}

function buildStars(rec) {
  let s = '';
  if (rec.poop)       s += '<span class="week-star">🟠</span>';
  if (rec.period)     s += '<span class="week-star">🔴</span>';
  if (rec.probiotic)  s += '<span class="week-star">🟢</span>';
  if (rec.poopBefore) s += '<span class="week-star">🟡</span>';
  return s;
}

function buildCellStars(rec) {
  let s = '';
  if (rec.poop)       s += '<span class="cell-star">🟠</span>';
  if (rec.period)     s += '<span class="cell-star">🔴</span>';
  if (rec.probiotic)  s += '<span class="cell-star">🟢</span>';
  if (rec.poopBefore) s += '<span class="cell-star">🟡</span>';
  return s;
}

document.getElementById('weekPrev').addEventListener('click', () => {
  currentWeekStart = addDays(currentWeekStart, -7);
  renderWeek();
});
document.getElementById('weekNext').addEventListener('click', () => {
  currentWeekStart = addDays(currentWeekStart, 7);
  renderWeek();
});

// ══════════════════════════════════════════════════════════════════
// MONTH VIEW
// ══════════════════════════════════════════════════════════════════
function renderMonth() {
  renderMonthCalendar();
  renderWeightChart();
}

function renderMonthCalendar() {
  const grid = document.getElementById('monthGrid');
  grid.innerHTML = '';

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  document.getElementById('monthLabel').textContent =
    `${year}年 ${MONTH_NAMES[month]}`;

  // Header
  ['一','二','三','四','五','六','日'].forEach(d => {
    const cell = document.createElement('div');
    cell.className = 'month-head-cell';
    cell.textContent = d;
    grid.appendChild(cell);
  });

  const firstDay = new Date(year, month, 1);
  // Monday-based: Mon=0 ... Sun=6
  let startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  for (let i = 0; i < startOffset; i++) {
    const cell = document.createElement('div');
    cell.className = 'month-day-cell empty';
    grid.appendChild(cell);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const key = toKey(date);
    const rec = getDay(key);
    const isToday = sameDay(date, today);
    const isFuture = date > today;

    const cell = document.createElement('div');
    cell.className = 'month-day-cell' + (isToday ? ' today-cell' : '');

    const stars = buildCellStars(rec);
    const wt = rec.weight ? rec.weight : '—';
    const wtClass = rec.weight ? '' : 'empty';

    cell.innerHTML = `
      <div class="cell-date ${isToday ? 'today' : ''}">${d}</div>
      ${!isFuture ? `<div class="cell-stars">${stars}</div>` : ''}
      ${!isFuture ? `<div class="cell-weight ${wtClass}">${wt}</div>` : ''}
    `;
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', () => switchToDay(date));
    grid.appendChild(cell);
  }

  // Fill remaining cells to complete last row
  const totalCells = startOffset + daysInMonth;
  const remainder = totalCells % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      const cell = document.createElement('div');
      cell.className = 'month-day-cell empty';
      grid.appendChild(cell);
    }
  }
}

function renderWeightChart() {
  const canvas = document.getElementById('weightChart');
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Collect weight data points
  const points = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date > today) break;
    const key = toKey(date);
    const rec = getDay(key);
    if (rec.weight) {
      points.push({ day: d, weight: parseFloat(rec.weight) });
    }
  }

  const W = canvas.offsetWidth || 280;
  const H = 100;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  if (points.length < 1) {
    ctx.fillStyle = '#444';
    ctx.font = '11px Space Grotesk, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无体重数据', W / 2, H / 2);
    return;
  }

  const weights = points.map(p => p.weight);
  const minW = Math.min(...weights) - 0.5;
  const maxW = Math.max(...weights) + 0.5;
  const range = maxW - minW || 1;

  const padL = 34, padR = 10, padT = 8, padB = 20;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Grid lines + Y labels
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#555';
  ctx.font = '8px Space Grotesk, sans-serif';
  ctx.textAlign = 'right';

  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const val = minW + (range * i / yTicks);
    const y = padT + chartH - (chartH * i / yTicks);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.setLineDash([2, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(val.toFixed(1), padL - 3, y + 3);
  }

  // X axis
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL, padT + chartH);
  ctx.lineTo(padL + chartW, padT + chartH);
  ctx.stroke();

  // X labels (first, middle, last data points)
  ctx.fillStyle = '#555';
  ctx.font = '8px Space Grotesk, sans-serif';
  ctx.textAlign = 'center';
  const labelIdxs = new Set([0, Math.floor(points.length / 2), points.length - 1]);
  points.forEach((p, i) => {
    if (labelIdxs.has(i)) {
      const x = padL + ((p.day - 1) / (daysInMonth - 1)) * chartW;
      ctx.fillText(p.day, x, H - 4);
    }
  });

  // Line
  ctx.strokeStyle = '#39ff7a';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();

  points.forEach((p, i) => {
    const x = padL + ((p.day - 1) / (daysInMonth - 1)) * chartW;
    const y = padT + chartH - ((p.weight - minW) / range) * chartH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  points.forEach(p => {
    const x = padL + ((p.day - 1) / (daysInMonth - 1)) * chartW;
    const y = padT + chartH - ((p.weight - minW) / range) * chartH;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#39ff7a';
    ctx.fill();
  });
}

document.getElementById('monthPrev').addEventListener('click', () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  renderMonth();
});
document.getElementById('monthNext').addEventListener('click', () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  renderMonth();
});

// ── Switch to day view for a specific date ────────────────────────
function switchToDay(date) {
  currentDay = new Date(date);
  currentDay.setHours(0,0,0,0);
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
  document.querySelector('.nav-tab[data-view="day"]').classList.add('active');
  document.getElementById('view-day').classList.add('active');
  loadDayView();
  document.getElementById('view-day').scrollTop = 0;
}

// ── Utility ───────────────────────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
