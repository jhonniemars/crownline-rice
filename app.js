// ---------- Data: starts completely empty ----------
let installments = [];

const peso = n => '₱' + Number(n).toLocaleString('en-PH');
const fmtDate = iso => new Date(iso + 'T00:00:00')
  .toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });

function statusCell(s){
  if (s === 'on-time') return '<span class="status on-time">On Time</span>';
  if (s === 'pending') return '<span class="seal pending"></span>Pending';
  return '<span class="seal paid"></span>Paid';
}
const rowHTML = i => `<tr><td>${i.customer}</td><td>${i.item}</td><td>${peso(i.total)}</td><td>${peso(i.balance)}</td><td>${fmtDate(i.due)}</td><td>${statusCell(i.status)}</td></tr>`;

const EMPTY_ROW = '<tr><td colspan="6" class="empty">No installments recorded yet.</td></tr>';

function renderInstallments(){
  const html = installments.length ? installments.map(rowHTML).join('') : EMPTY_ROW;
  const dash = document.getElementById('dashInstallments');
  const all  = document.getElementById('allInstallments');
  if (dash) dash.innerHTML = html;
  if (all)  all.innerHTML = html;
}

// ---------- View switching ----------
function showView(name, label){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const map = { dashboard:'view-dashboard', installments:'view-installments' };
  if (map[name]) document.getElementById(map[name]).classList.add('active');
  else {
    document.getElementById('placeholderTitle').textContent = label || 'Module';
    document.getElementById('view-placeholder').classList.add('active');
  }
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

// ---------- Installment form ----------
const form = document.getElementById('installmentForm');
document.getElementById('toggleForm').addEventListener('click', () => form.hidden = !form.hidden);
document.getElementById('cancelForm').addEventListener('click', () => form.hidden = true);

form.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(form);
  const balance = Number(f.get('balance'));
  installments.unshift({
    customer: f.get('customer'), item: f.get('item'),
    total: Number(f.get('total')), balance, due: f.get('due'),
    status: balance <= 0 ? 'paid' : 'pending'
  });
  renderInstallments();
  form.reset();
  form.hidden = true;
});

renderInstallments();
