// Sidebar navigation: active state
document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('.nav-item.active')?.classList.remove('active');
    item.classList.add('active');
    document.getElementById('sidebar').classList.remove('open');
  });
});

// Mobile sidebar toggle
document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Admin dropdown
const adminMenu = document.getElementById('adminMenu');
const dropdown = document.getElementById('adminDropdown');

adminMenu.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdown.classList.toggle('open');
});

document.addEventListener('click', () => dropdown.classList.remove('open'));
