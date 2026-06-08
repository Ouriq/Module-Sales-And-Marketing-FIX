const LOGIN_PAGE = 'index.html';

function isLoggedIn() {
  return !!(
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('user_name') ||
    sessionStorage.getItem('user_name')
  );
}

// applySelectedCustomer logic removed

document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
      window.location.href = LOGIN_PAGE;
      return;
    }

    // 1. Tampilkan Nama User
    const userName =
      localStorage.getItem('user_name') ||
      sessionStorage.getItem('user_name') ||
      'Nilam';
    document.getElementById('userNameDisplay').textContent = userName;

    // Sales logic removed
  
    // 5. Fitur Logout 
    document.getElementById('logoutBtn').addEventListener('click', () => {
      ['auth_token', 'user_name', 'user_email'].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      sessionStorage.removeItem('selectedCustomer');
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
        ['auth_token', 'user_name', 'user_email'].forEach((key) => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        sessionStorage.removeItem('selectedCustomer');
        window.location.href = LOGIN_PAGE;
      });
    }
  });