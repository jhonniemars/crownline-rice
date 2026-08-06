// ---------- Catalog ----------
const ITEM_KILO = {
  'Premium Rice 50kg': 50, 'Well Milled Rice 50kg': 50, 'Regular Milled Rice 50kg': 50,
  'Dinorado 25kg': 25, 'Jasmine Rice 25kg': 25
};

// ---------- Data (fresh start, auto-saved in this browser) ----------
let stock = { 'Premium Rice 50kg':0, 'Well Milled Rice 50kg':0, 'Regular Milled Rice 50kg':0, 'Dinorado 25kg':0, 'Jasmine Rice 25kg':0 };
let installments = [];

function save(){ localStorage.setItem('ghrt-data', JSON.stringify({ stock, installments })); }
function load(){
  try {
    const d = JSON.parse(localStorage.getItem('ghrt-data') || 'null');
    if (d) { stock = Object.assign(stock, d.stock || {}); installments = d.installments || []; }
  } catch (e) {}
}

const peso = n => '₱' + Number(n).toLocaleString('en-PH');
const fmtDate = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
const setText = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };

// ---------- Dashboard ----------
function renderDashboard(){
  let sacks = 0, kilos = 0;
  for (const n in stock) { sacks += stock[n]; kilos += stock[n] * (ITEM_KILO[n] || 0); }
  setText('statSacks', sacks.toLocaleString());
  setText('statKilos', kilos.toLocaleString());
  const list = document.getElementById('stockSummaryList');
  if (list) list.innerHTML = Object.keys(stock)
    .map(n => `<li><span>${n}</span><i class="dots"></i><strong>${stock[n]}</strong></li>`).join('');
}

// ---------- Stock ----------
function renderStock(){
  const body = document.getElementById('stockTableBody');
  if (!body) return;
  const has = Object.values(stock).some(v => v > 0);
  body.innerHTML = has
    ? Object.keys(stock).map(n =>
        `<tr><td>${n}</td><td>${ITEM_KILO[n]} kg</td><td>${stock[n]}</td><td>${(stock[n] * ITEM_KILO[n]).toLocaleString()}</td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">No stock encoded yet.</td></tr>';
}

// ---------- Installments ----------
function statusCell(s){
  if (s === 'on-time') return '<span class="status on-time">On Time</span>';
  if (s === 'pending') return '<span class="seal pending"></span>Pending';
  return '<span class="seal paid"></span>Paid';
}
const rowHTML = i => `<tr><td>${i.customer}</td><td>${i.item}</td><td>${peso(i.total)}</td><td>${peso(i.balance)}</td><td>${fmtDate(i.due)}</td><td>${statusCell(i.status)}</td></tr>`;
function renderInstallments(){
  const html = installments.length ? installments.map(rowHTML).join('')
    : '<tr><td colspan="6" class="empty">No installments recorded yet.</td></tr>';
  const a = document.getElementById('dashInstallments');
  const b = document.getElementById('allInstallments');
  if (a) a.innerHTML = html;
  if (b) b.innerHTML = html;
}

function renderAll(){ renderDashboard(); renderStock(); renderInstallments(); }

// ---------- Views ----------
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
  const name = f.get('item');
  const sacks = Math.max(1, Math.floor(Number(f.get('sacks'))));
  stock[name] = (stock[name] || 0) + sacks;
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
