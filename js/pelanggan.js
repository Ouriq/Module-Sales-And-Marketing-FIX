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

  const modal = document.getElementById('modalAddData');
  const btnAdd = document.getElementById('btnAddData');
  const btnDraft = document.getElementById('btnDraft');
  const form = document.getElementById('formAddData');
  const tableBody = document.getElementById('tableBody');

  btnAdd.addEventListener('click', () => {
    modal.classList.add('active');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  btnDraft.addEventListener('click', () => {
    form.reset();
    modal.classList.remove('active');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const idDist = document.getElementById('inputID').value;
    const nama = document.getElementById('inputNama').value;
    const kategori = document.getElementById('inputKategori').value;
    const tier = document.getElementById('inputTier').value;
    const pic = document.getElementById('inputPIC').value;
    const telp = document.getElementById('inputTelp').value;

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td>${idDist}</td>
      <td>${nama}</td>
      <td>${kategori}</td>
      <td>${tier}</td>
      <td>${pic}</td>
      <td>${telp}</td>
    `;

    newRow.style.opacity = '0';
    newRow.style.transition = 'opacity 0.5s ease-in';
    tableBody.insertBefore(newRow, tableBody.firstChild);

    setTimeout(() => {
      newRow.style.opacity = '1';
    }, 10);

    form.reset();
    modal.classList.remove('active');
    alert(`Berhasil: Data distributor ${nama} (ID: ${idDist}) telah disimpan!`);

    sessionStorage.setItem(
      'selectedCustomer',
      JSON.stringify({ id: idDist, nama, tier, pic, telp })
    );
  });

  tableBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;

    const cells = row.querySelectorAll('td');
    if (cells.length < 6) return;

    sessionStorage.setItem(
      'selectedCustomer',
      JSON.stringify({
        id: cells[0].textContent.trim(),
        nama: cells[1].textContent.trim(),
        kategori: cells[2].textContent.trim(),
        tier: cells[3].textContent.trim(),
        pic: cells[4].textContent.trim(),
        telp: cells[5].textContent.trim(),
      })
    );
    window.location.href = 'sales.html';
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearAuth();
    window.location.href = LOGIN_PAGE;
  });

  // --- LOGIKA TOGGLE PENGATURAN POPUP ---
  const btnSettingsToggle = document.getElementById('btnSettingsToggle');
  const settingsPopup = document.getElementById('settingsPopup');
  const settingsLogoutBtn = document.getElementById('settingsLogoutBtn');

  if (btnSettingsToggle && settingsPopup) {
    btnSettingsToggle.addEventListener('click', (e) => {
      e.stopPropagation(); 
      const isShowing = settingsPopup.classList.contains('show');
      if (typeof closeAllPopups === 'function') closeAllPopups();
      if (!isShowing) settingsPopup.classList.add('show');
    });
  }

  if (settingsPopup) {
    settingsPopup.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  window.addEventListener('click', () => {
    if (typeof closeAllPopups === 'function') closeAllPopups();
  });


  const btnNotifToggle = document.getElementById('btnNotifToggle');
  const notifPopup = document.getElementById('notifPopup');
  const settingsItemNotif = document.getElementById('settingsItemNotif');

  function closeAllPopups() {
    const settingsPopup = document.getElementById('settingsPopup');
    const filterPopup = document.getElementById('filterPopup');
    if (settingsPopup) settingsPopup.classList.remove('show');
    if (filterPopup) filterPopup.classList.remove('show');
    if (notifPopup) notifPopup.classList.remove('show');
  }

  if (btnNotifToggle && notifPopup) {
    btnNotifToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isShowing = notifPopup.classList.contains('show');
      closeAllPopups();
      if (!isShowing) notifPopup.classList.add('show');
    });
    notifPopup.addEventListener('click', (e) => e.stopPropagation());
  }

  if (settingsItemNotif && notifPopup) {
    settingsItemNotif.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllPopups();
      notifPopup.classList.add('show');
    });
  }

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
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      const dot = item.querySelector('.notif-unread-dot');
      if (dot) dot.style.display = 'none';
    });
  });


  if (settingsLogoutBtn) {
    settingsLogoutBtn.addEventListener('click', () => {
      clearAuth();
      window.location.href = LOGIN_PAGE;
    });
  }
});
