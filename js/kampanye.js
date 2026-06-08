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

  // --- LOGIKA FORM TAMBAH KAMPANYE ---
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

  // --- LOGIKA PENGATURAN & FILTER POPUP ---
  const btnSettingsToggle = document.getElementById('btnSettingsToggle');
  const settingsPopup = document.getElementById('settingsPopup');
  const settingsLogoutBtn = document.getElementById('settingsLogoutBtn');

  const btnFilterToggle = document.getElementById('btnFilterToggle');
  const filterPopup = document.getElementById('filterPopup');

  const btnNotifToggle = document.getElementById('btnNotifToggle');
  const notifPopup = document.getElementById('notifPopup');
  const settingsItemNotif = document.getElementById('settingsItemNotif');

  // Fungsi helper untuk menutup semua popup
  function closeAllPopups() {
    if (settingsPopup) settingsPopup.classList.remove('show');
    if (filterPopup) filterPopup.classList.remove('show');
    if (notifPopup) notifPopup.classList.remove('show');
  }

  // Buka/Tutup Menu Pengaturan
  if (btnSettingsToggle && settingsPopup) {
    btnSettingsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isShowing = settingsPopup.classList.contains('show');
      closeAllPopups();
      if (!isShowing) settingsPopup.classList.add('show');
    });
    settingsPopup.addEventListener('click', (e) => e.stopPropagation());
  }

  // Buka/Tutup Menu Filter Kampanye
  if (btnFilterToggle && filterPopup) {
    btnFilterToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isShowing = filterPopup.classList.contains('show');
      closeAllPopups();
      if (!isShowing) filterPopup.classList.add('show');
    });
    filterPopup.addEventListener('click', (e) => e.stopPropagation());
  }

  // Buka/Tutup Notifikasi
  if (btnNotifToggle && notifPopup) {
    btnNotifToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isShowing = notifPopup.classList.contains('show');
      closeAllPopups();
      if (!isShowing) notifPopup.classList.add('show');
    });
    notifPopup.addEventListener('click', (e) => e.stopPropagation());
  }

  // Buka Notifikasi dari dalam Menu Pengaturan
  if (settingsItemNotif && notifPopup) {
    settingsItemNotif.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllPopups();
      notifPopup.classList.add('show');
    });
  }

  // Logika Notifikasi - Tandai Dibaca
  const markAllBtn = document.querySelector('.notif-mark-read');
  const notifItems = document.querySelectorAll('.notif-item');

  if (markAllBtn) {
    markAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      notifItems.forEach(item => {
        const dot = item.querySelector('.notif-unread-dot');
        if (dot) dot.style.display = 'none';
      });
    });
  }

  notifItems.forEach(item => {
    // Tambahkan kursor pointer ke item notifikasi
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      const dot = item.querySelector('.notif-unread-dot');
      if (dot) dot.style.display = 'none';
    });
  });

  // Menutup popup saat tombol Terapkan/Hapus Filter diklik
  const btnTerapkan = document.querySelector('.btn-terapkan-filter');
  const btnHapus = document.querySelector('.btn-hapus-filter');
  if (btnTerapkan) btnTerapkan.addEventListener('click', () => filterPopup.classList.remove('show'));
  if (btnHapus) btnHapus.addEventListener('click', () => filterPopup.classList.remove('show'));

  // Menutup semua popup jika klik area di luar popup
  window.addEventListener('click', () => {
    closeAllPopups();
  });

  // Fungsi Logout dari dalam Pengaturan
  if (settingsLogoutBtn) {
    settingsLogoutBtn.addEventListener('click', () => {
      clearAuth();
      window.location.href = LOGIN_PAGE;
    });
  }

  // --- LOGIKA COLLAPSE FILTER ---
  const filterHeaders = document.querySelectorAll('.f-header');
  filterHeaders.forEach(header => {
    header.addEventListener('click', () => {
      header.classList.toggle('collapsed');
      const body = header.nextElementSibling;
      if (body && body.classList.contains('f-body')) {
        body.classList.toggle('collapsed');
      }
    });
  });
});