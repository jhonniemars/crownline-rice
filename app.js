// ---------- Rice catalog ----------
const RICE = ['Alas', 'Princess Bea', 'Young Chow', 'Salo-Salo', 'Planters', 'Japonica'];

// ---------- Data (auto-saved in this browser) ----------
let stockEntries = [];   // { item, kilo, sacks, price }
let installments = [];   // { customer, item, total, balance, due, status }

function save(){ localStorage.setItem('ghrt-data-v3', JSON.stringify({ stockEntries, installments })); }
function load(){
  try {
    const d = JSON.parse(localStorage.getItem('ghrt-data-v3') || 'null');
    if (d) { stockEntries = d.stockEntries || []; installments = d.installments || []; }
  } catch (e) {}
}

const peso = n => '₱' + Number(n).toLocaleString('en-PH');
const fmtDate = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
const setText = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };

// ---------- Dashboard ----------
function renderDashboard(){
  let sacks = 0, kilos = 0;
  const perItem = {};
  RICE.forEach(n => perItem[n] = 0);
  stockEntries.forEach(e => {
    sacks += e.sacks;
    kilos += e.sacks * e.kilo;
    perItem[e.item] = (perItem[e.item] || 0) + e.sacks;
  });
  setText('statSacks', sacks.toLocaleString());
  setText('statKilos', kilos.toLocaleString());
  const list = document.getElementById('stockSummaryList');
  if (list) list.innerHTML = RICE
    .map(n => `<li><span>${n}</span><i class="dots"></i><strong>${perItem[n]}</strong></li>`).join('');
}

// ---------- Stock / Inventory ----------
function renderStock(){
  const body = document.getElementById('stockTableBody');
  if (!body) return;
  body.innerHTML = stockEntries.length
    ? stockEntries.map(e =>
        `<tr><td>${e.item}</td><td>${e.kilo} kg</td><td>${e.sacks}</td><td>${(e.sacks * e.kilo).toLocaleString()}</td><td>${peso(e.price)}</td><td><strong>${peso(e.sacks * e.price)}</strong></td></tr>`
      ).join('')
    : '<tr><td colspan="6" class="empty">No stock encoded yet. Click "+ Add Stock Entry".</td></tr>';
}

// ---------- Installments ----------
function statusCell(s){
  if (s === 'on-time') return '<span class="status on-time">On Time</span>';
  if (s === 'pending') return '<span class="seal pending"></span>Pending';
  return '<span class="seal paid"></span>Paid';
}
const instRow = i => `<tr><td>${i.customer}</td><td>${i.item}</td><td>${peso(i.total)}</td><td>${peso(i.balance)}</td><td>${fmtDate(i.due)}</td><td>${statusCell(i.status)}</td></tr>`;
function renderInstallments(){
  const html = installments.length ? installments.map(instRow).join('')
    : '<tr><td colspan="6" class="empty">No installments recorded yet.</td></tr>';
  const a = document.getElementById('dashInstallments');
  const b = document.getElementById('allInstallments');
  if (a) a.innerHTML = html;
  if (b) b.innerHTML = html;
}

function renderAll(){ renderDashboard(); renderStock(); renderInstallments(); }

// ---------- View switching ----------
function showView(name, label){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const map = { dashboard:'view-dashboard', stock:'view-stock', installments:'view-installments' };
  if (map[name]) document.getElementById(map[name]).classList.add('active');
  else { setText('placeholderTitle', label || 'Module'); document.getElementById('view-placeholder').classList.add('active'); }
}
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector('.nav-link.active')?.classList.remove('active');
    link.classList.add('active');
    showView(link.dataset.view, link.dataset.label);
  });
});
document.querySelectorAll('[data-goto]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(`.nav-link[data-view="${a.dataset.goto}"]`)?.click();
  });
});

// ---------- Stock form ----------
const stockForm = document.getElementById('stockForm');
document.getElementById('toggleStockForm').addEventListener('click', () => stockForm.hidden = !stockForm.hidden);
document.getElementById('cancelStockForm').addEventListener('click', () => stockForm.hidden = true);
stockForm.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(stockForm);
  stockEntries.unshift({
    item: f.get('item'),
    kilo: Math.max(1, Number(f.get('kilo'))),
    sacks: Math.max(1, Math.floor(Number(f.get('sacks')))),
    price: Math.max(0, Number(f.get('price')))
  });
  save(); renderAll();
  stockForm.reset(); stockForm.hidden = true;
});

// ---------- Installment form ----------
const instForm = document.getElementById('installmentForm');
document.getElementById('toggleForm').addEventListener('click', () => instForm.hidden = !instForm.hidden);
document.getElementById('cancelForm').addEventListener('click', () => instForm.hidden = true);
instForm.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(instForm);
  const balance = Number(f.get('balance'));
  installments.unshift({
    customer: f.get('customer'), item: f.get('item'),
    total: Number(f.get('total')), balance, due: f.get('due'),
    status: balance <= 0 ? 'paid' : 'pending'
  });
  save(); renderAll();
  instForm.reset(); instForm.hidden = true;
});

// ---------- Init ----------
load();
renderAll();
