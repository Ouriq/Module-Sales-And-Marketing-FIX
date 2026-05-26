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

  const modal = document.getElementById('modalKampanye');
  const btnTambah = document.getElementById('btnTambahKampanye');
  const btnDraft = document.getElementById('btnDraft');
  const form = document.getElementById('formKampanye');
  const tableBody = document.getElementById('kampanyeTableBody');

  btnTambah.addEventListener('click', () => {
    modal.classList.add('active');
  });

  btnDraft.addEventListener('click', () => {
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

    const nama = document.getElementById('inputNama').value;
    const subNama = document.getElementById('inputSubNama').value;
    const media = document.getElementById('inputMedia').value;
    const anggaran = document.getElementById('inputAnggaran').value;

    let iconClass = 'bx-tv';
    let bgClass = 'bg-gray';
    if (media === 'Tiktok') {
      iconClass = 'bxl-tiktok';
      bgClass = 'bg-dark';
    } else if (media === 'Instagram Reels') {
      iconClass = 'bxl-instagram';
      bgClass = 'bg-dark';
    } else if (media === 'YouTube Ads') {
      iconClass = 'bxl-youtube';
      bgClass = 'bg-dark';
    }

    const formattedAnggaran = isNaN(anggaran)
      ? anggaran
      : `Rp. ${parseInt(anggaran, 10).toLocaleString('id-ID')}`;

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td>
        <div class="kampanye-name-cell">
          <div class="media-icon ${bgClass}"><i class='bx ${iconClass}'></i></div>
          <div>
            <p class="k-title">${nama}</p>
            <p class="k-subtitle">${subNama}</p>
          </div>
        </div>
      </td>
      <td class="font-bold">${media}</td>
      <td class="font-bold">${formattedAnggaran}</td>
      <td><span class="status-pill aktif">Aktif</span></td>
      <td>
        <div class="mini-progress">
          <span class="font-bold">1 hari</span>
          <div class="mini-bar-bg"><div class="mini-bar-fill bg-green" style="width: 5%;"></div></div>
        </div>
      </td>
    `;

    tableBody.insertBefore(newRow, tableBody.firstChild);

    form.reset();
    modal.classList.remove('active');
    alert(`Kampanye "${nama}" berhasil disimpan dan diaktifkan!`);
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearAuth();
    window.location.href = LOGIN_PAGE;
  });
});
