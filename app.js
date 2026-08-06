// ---------- Rice catalog ----------
const RICE = ['Alas', 'Princess Bea', 'Young Chow', 'Salo-Salo', 'Planters', 'Japonica'];

// ---------- Data (auto-saved in this browser) ----------
let stockEntries = [];  // { item, kilo, sacks, price }
let sales = [];         // { date, invoice, customer, item, sacks, kilo, price, amount, profit }
let installments = [];  // { customer, item, total, balance, due, status }

function save(){ localStorage.setItem('ghrt-data-v4', JSON.stringify({ stockEntries, sales, installments })); }
function load(){
  try {
    const d = JSON.parse(localStorage.getItem('ghrt-data-v4') || 'null');
    if (d) {
      stockEntries = d.stockEntries || [];
      sales = d.sales || [];
      installments = d.installments || [];
    }
  } catch (e) {}
}

const peso = n => '₱' + Number(n).toLocaleString('en-PH');
const fmtDate = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
const setText = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
const todayISO = () => new Date().toISOString().slice(0, 10);

// ---------- Stock math ----------
const latestEntry = item => stockEntries.find(e => e.item === item);
function availableSacks(item){
  const rec = stockEntries.filter(e => e.item === item).reduce((s, e) => s + e.sacks, 0);
  const sold = sales.filter(s => s.item === item).reduce((s, x) => s + x.sacks, 0);
  return rec - sold;
}
function availableKilos(item){
  const rec = stockEntries.filter(e => e.item === item).reduce((s, e) => s + e.sacks * e.kilo, 0);
  const soldK = sales.filter(s => s.item === item).reduce((s, x) => s + x.kilo, 0);
  return rec - soldK;
}
function nextInvoice(){
  let max = 0;
  sales.forEach(s => { const n = parseInt((s.invoice || '').replace(/\D/g, ''), 10); if (n > max) max = n; });
  return 'INV-' + String(max + 1).padStart(4, '0');
}

// ---------- Dashboard ----------
function renderDashboard(){
  let totSacks = 0, totKilos = 0;
  RICE.forEach(n => { totSacks += Math.max(0, availableSacks(n)); totKilos += Math.max(0, availableKilos(n)); });
  setText('statSacks', totSacks.toLocaleString());
  setText('statKilos', totKilos.toLocaleString());

  const today = todayISO();
  let ts = 0, tp = 0;
  sales.forEach(s => { if (s.date === today) { ts += s.amount; tp += s.profit; } });
  setText('statSales', peso(ts));
  setText('statProfit', peso(tp));

  const sum = document.getElementById('stockSummaryList');
  if (sum) sum.innerHTML = RICE.map(n =>
    `<li><span>${n}</span><i class="dots"></i><strong>${Math.max(0, availableSacks(n))}</strong></li>`).join('');

  const month = today.slice(0, 7);
  const sold = {};
  RICE.forEach(n => sold[n] = 0);
  sales.forEach(s => { if (s.date.startsWith(month)) sold[s.item] = (sold[s.item] || 0) + s.sacks; });
  const best = document.getElementById('bestSellingList');
  if (best) best.innerHTML = [...RICE].sort((a, b) => sold[b] - sold[a]).map(n =>
    `<li><span>${n}</span><i class="dots"></i><strong>${sold[n]}</strong></li>`).join('');

  const recent = document.getElementById('recentSalesBody');
  if (recent) recent.innerHTML = sales.length
    ? sales.slice(0, 5).map(s =>
        `<tr><td>${fmtDate(s.date)}</td><td>${s.invoice}</td><td>${s.customer}</td><td>${s.item}</td><td>${s.kilo.toLocaleString()}</td><td>${peso(s.amount)}</td></tr>`).join('')
    : '<tr><td colspan="6" class="empty">No sales recorded yet.</td></tr>';
}

// ---------- Stock ----------
function renderStock(){
  const body = document.getElementById('stockTableBody');
  if (!body) return;
  body.innerHTML = stockEntries.length
    ? stockEntries.map((e, idx) =>
        `<tr><td>${e.item}</td><td>${e.kilo} kg</td><td>${e.sacks}</td><td>${(e.sacks * e.kilo).toLocaleString()}</td><td>${peso(e.price)}</td><td><strong>${peso(e.sacks * e.price)}</strong></td><td><button class="btn small danger" data-del-stock="${idx}">Delete</button></td></tr>`).join('')
    : '<tr><td colspan="7" class="empty">No stock encoded yet. Click "+ Add Stock Entry".</td></tr>';
}

// ---------- Sales ----------
function renderSales(){
  const body = document.getElementById('salesTableBody');
  if (!body) return;
  body.innerHTML = sales.length
    ? sales.map((s, idx) =>
        `<tr><td>${fmtDate(s.date)}</td><td>${s.invoice}</td><td>${s.customer}</td><td>${s.item}</td><td>${s.sacks}</td><td>${s.kilo.toLocaleString()}</td><td>${peso(s.amount)}</td><td>${peso(s.profit)}</td><td><button class="btn small danger" data-del-sale="${idx}">Delete</button></td></tr>`).join('')
    : '<tr><td colspan="9" class="empty">No sales recorded yet. Click "+ Add Sale".</td></tr>';
}

// ---------- Installments ----------
function statusCell(s){
  if (s === 'on-time') return '<span class="status on-time">On Time</span>';
  if (s === 'pending') return '<span class="seal pending"></span>Pending';
  return '<span class="seal paid"></span>Paid';
}
const instRow = (i, idx) => `<tr><td>${i.customer}</td><td>${i.item}</td><td>${peso(i.total)}</td><td>${peso(i.balance)}</td><td>${fmtDate(i.due)}</td><td>${statusCell(i.status)}</td><td><button class="btn small danger" data-del-inst="${idx}">Delete</button></td></tr>`;
function renderInstallments(){
  const html = installments.length ? installments.map(instRow).join('')
    : '<tr><td colspan="7" class="empty">No installments recorded yet.</td></tr>';
  const a = document.getElementById('dashInstallments');
  const b = document.getElementById('allInstallments');
  if (a) a.innerHTML = html;
  if (b) b.innerHTML = html;
}

function renderAll(){ renderDashboard(); renderStock(); renderSales(); renderInstallments(); }

// ---------- Delete buttons ----------
document.addEventListener('click', e => {
  const ds = e.target.closest('[data-del-stock]');
  if (ds) { if (confirm('Delete this stock entry?')) { stockEntries.splice(Number(ds.dataset.delStock), 1); save(); renderAll(); } return; }
  const dl = e.target.closest('[data-del-sale]');
  if (dl) { if (confirm('Delete this sale? Stock will be returned.')) { sales.splice(Number(dl.dataset.delSale), 1); save(); renderAll(); } return; }
  const di = e.target.closest('[data-del-inst]');
  if (di) { if (confirm('Delete this installment?')) { installments.splice(Number(di.dataset.delInst), 1); save(); renderAll(); } }
});

// ---------- View switching ----------
function showView(name, label){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const map = { dashboard:'view-dashboard', stock:'view-stock', sales:'view-sales', installments:'view-installments' };
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

// ---------- Sale form ----------
const saleForm = document.getElementById('saleForm');
document.getElementById('toggleSaleForm').addEventListener('click', () => saleForm.hidden = !saleForm.hidden);
document.getElementById('cancelSaleForm').addEventListener('click', () => saleForm.hidden = true);
saleForm.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(saleForm);
  const item = f.get('item');
  const sacks = Math.max(0.5, Number(f.get('sacks')));
  const price = Math.max(0, Number(f.get('price')));
  const ent = latestEntry(item);
  if (!ent) { alert('No stock entry for "' + item + '" yet. Add stock first.'); return; }
  if (sacks > availableSacks(item)) { alert('Not enough stock for "' + item + '". Available: ' + availableSacks(item) + ' sack(s).'); return; }
  sales.unshift({
    date: todayISO(),
    invoice: nextInvoice(),
    customer: f.get('customer'),
    item, sacks,
    kilo: sacks * ent.kilo,
    price,
    amount: sacks * price,
    profit: (price - ent.price) * sacks
