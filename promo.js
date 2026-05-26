const LOGIN_PAGE = 'index.html';

function clearAuth() {
  ['auth_token', 'user_name', 'user_email'].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

function isLoggedIn() {
  return !!(
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('user_name') ||
    sessionStorage.getItem('user_name')
  );
}

document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    window.location.href = LOGIN_PAGE;
    return;
  }

  const userName =
    localStorage.getItem('user_name') ||
    sessionStorage.getItem('user_name') ||
    'Pengguna';
  document.getElementById('userNameDisplay').textContent = userName;

  const modal = document.getElementById('modalPromo');
  const openBtn = document.getElementById('openModalBtn');
  const closeBtn = document.getElementById('closeModal');
  const form = document.getElementById('formPromo');
  const tableBody = document.getElementById('promoTableBody');

  openBtn.addEventListener('click', () => {
    modal.classList.add('active');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    form.reset();
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      form.reset();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const kode = document.getElementById('promoKode').value;
    const nama = document.getElementById('promoNama').value;
    const diskonVal = document.getElementById('promoDiskon').value;
    const kuota = document.getElementById('promoKuota').value;

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td>${kode.toUpperCase()}</td>
      <td>${nama}</td>
      <td><span class="badge-discount-green">${diskonVal}%</span></td>
      <td>0/${kuota}</td>
      <td><span class="status-pill aktif">Aktif</span></td>
      <td class="text-green-bold">Sesuai Periode</td>
    `;

    tableBody.insertBefore(newRow, tableBody.firstChild);

    form.reset();
    modal.classList.remove('active');
    alert(`Promo ${kode} berhasil diaktifkan!`);
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearAuth();
    window.location.href = LOGIN_PAGE;
  });
});
