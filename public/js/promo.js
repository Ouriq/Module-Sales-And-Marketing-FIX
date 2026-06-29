import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDL36048RpIK_-_vyg0s_92pWRjM91mhKA",
  authDomain: "sistem-erp-food-sync.firebaseapp.com",
  projectId: "sistem-erp-food-sync",
  storageBucket: "sistem-erp-food-sync.firebasestorage.app",
  messagingSenderId: "9152919413",
  appId: "1:9152919413:web:4ad7cf28f57ef83d23453c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const LOGIN_PAGE = 'index.html';

function clearAuth() {
  ['auth_token', 'user_name', 'user_email'].forEach(function(key) {
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

function showToast(message, bgColor) {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.background = bgColor || '#333';
  toast.style.color = '#fff';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  toast.style.zIndex = '9999';
  toast.style.fontFamily = 'var(--font-family, sans-serif)';
  toast.style.fontSize = '14px';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = 'all 0.3s ease';
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(function() {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
  if (!isLoggedIn()) {
    window.location.href = LOGIN_PAGE;
    return;
  }

  const userName =
    localStorage.getItem('user_name') ||
    sessionStorage.getItem('user_name') ||
    'Pengguna';
  document.getElementById('userNameDisplay').textContent = userName;

  // --- LOGIKA MODAL TAMBAH PROMO ---
  const modal = document.getElementById('modalPromo');
  const openBtn = document.getElementById('openModalBtn');
  const closeModalIcon = document.getElementById('closeModalIcon');
  const btnDraftPromo = document.getElementById('btnDraftPromo');
  const form = document.getElementById('formPromo');
  const tableBody = document.getElementById('promoTableBody');

  if (openBtn) {
    openBtn.addEventListener('click', function() {
      modal.classList.add('active');
    });
  }

  function closeModalAndReset() {
    modal.classList.remove('active');
    if(form) form.reset();
  }

  if (closeModalIcon) {
    closeModalIcon.addEventListener('click', closeModalAndReset);
  }

  window.addEventListener('click', function(e) {
    if (e.target === modal) closeModalAndReset();
  });

  async function savePromo(isDraft) {
    const kode = document.getElementById('promoKode').value.trim().toUpperCase();
    const nama = document.getElementById('promoNama').value.trim();
    const produk = document.getElementById('promoProduk').value;
    const diskonVal = document.getElementById('promoDiskon').value;
    const kuota = document.getElementById('promoKuota').value;
    const minBeli = document.getElementById('promoMinBeli').value;
    const desc = document.getElementById('promoDesc').value;
    const mulai = document.getElementById('promoMulai').value;
    const akhir = document.getElementById('promoAkhir').value;

    if(!kode || !nama || !diskonVal || !mulai || !akhir) {
        showToast("Mohon lengkapi field yang wajib!", "#ef4444");
        return;
    }

    try {
      await addDoc(collection(db, "promos"), {
        kode: kode,
        nama: nama,
        produk: produk,
        diskon: parseInt(diskonVal) || 0,
        kuota: parseInt(kuota) || 0,
        digunakan: 0,
        minBeli: minBeli,
        deskripsi: desc,
        tglMulai: mulai,
        tglAkhir: akhir,
        isDraft: isDraft,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "notifications"), {
        title: isDraft ? "Draft Promo Disimpan" : "Promo Baru Diaktifkan",
        message: `Promo "${kode}" ${isDraft ? 'disimpan sebagai draft' : 'berhasil diaktifkan'}.`,
        type: "promo",
        isRead: false,
        createdAt: serverTimestamp()
      });

      closeModalAndReset();
      if(isDraft) {
        showToast("Promo " + kode + " disimpan ke Draft!", "#f59e0b");
      } else {
        showToast("Promo " + kode + " berhasil diaktifkan!", "#22c55e");
      }
    } catch (err) {
      console.error("Error adding promo: ", err);
      showToast("Gagal menyimpan promo", "#ef4444");
    }
  }

  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const btnSubmit = form.querySelector('button[type="submit"]');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Menyimpan...';
      }
      await savePromo(false);
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Aktifkan Promo';
      }
    });
  }

  if (btnDraftPromo) {
    btnDraftPromo.addEventListener('click', async function(e) {
      e.preventDefault();
      const oldText = btnDraftPromo.textContent;
      btnDraftPromo.disabled = true;
      btnDraftPromo.textContent = 'Menyimpan...';
      
      await savePromo(true);

      btnDraftPromo.disabled = false;
      btnDraftPromo.textContent = oldText;
    });
  }

  // --- FILTER STATE ---
  let filterState = {
    aktif: true,
    draft: true,
    nonAktif: true,
    minDiskon: 0
  };

  const fStatusAktif = document.getElementById('fStatusAktif');
  const fStatusDraft = document.getElementById('fStatusDraft');
  const fStatusNon = document.getElementById('fStatusNon');
  const fDiskonMin = document.getElementById('fDiskonMin');
  const fDiskonVal = document.getElementById('fDiskonVal');

  if(fDiskonMin && fDiskonVal) {
    fDiskonMin.addEventListener('input', function() {
        fDiskonVal.textContent = "Min: " + this.value + "%";
    });
  }

  function updateFilterState() {
    if(fStatusAktif) filterState.aktif = fStatusAktif.checked;
    if(fStatusDraft) filterState.draft = fStatusDraft.checked;
    if(fStatusNon) filterState.nonAktif = fStatusNon.checked;
    if(fDiskonMin) filterState.minDiskon = parseInt(fDiskonMin.value) || 0;
  }

  // Raw data from Firestore
  let allPromos = [];

  function renderTable() {
    if(!tableBody) return;
    tableBody.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let countShown = 0;
    let countTotal = allPromos.length;
    let countAktif = 0;
    let countDraft = 0;
    let countBerakhirBulanIni = 0;

    allPromos.forEach(function(docData) {
        const data = docData.data;
        const id = docData.id;
        
        let sisaHari = 0;
        let status = 'Non Aktif';
        let statusClass = 'non-aktif';
        let sisaHariText = '0 hari';
        let sisaHariClass = 'text-red-bold';
        
        if (data.tglAkhir) {
          const akhirDate = new Date(data.tglAkhir);
          const mulaiDate = data.tglMulai ? new Date(data.tglMulai) : new Date(today);
          mulaiDate.setHours(0,0,0,0);
          akhirDate.setHours(23,59,59,999); // Set to end of day
          
          if (akhirDate.getMonth() === today.getMonth() && akhirDate.getFullYear() === today.getFullYear()) {
            countBerakhirBulanIni++;
          }
          
          const diffTime = akhirDate.getTime() - new Date().getTime();
          sisaHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (sisaHari >= 0) {
            if (today >= mulaiDate) {
              status = 'Aktif';
              statusClass = 'aktif';
              sisaHariText = sisaHari + ' hari';
              sisaHariClass = 'text-green-bold';
            } else {
              status = 'Menunggu Jadwal';
              statusClass = 'draft'; 
              
              // Hitung hari menuju mulai
              const diffToMulai = mulaiDate.getTime() - today.getTime();
              const hariToMulai = Math.ceil(diffToMulai / (1000 * 60 * 60 * 24));
              sisaHariText = 'H-' + hariToMulai;
              sisaHariClass = 'text-gray-bold';
            }
          } else {
            status = 'Non Aktif';
            statusClass = 'non-aktif';
            sisaHariText = 'Berakhir';
            sisaHariClass = 'text-red-bold';
          }
        }
        
        // Cek jika kuota habis
        if (data.kuota > 0 && (data.digunakan || 0) >= data.kuota) {
           status = 'Non Aktif';
           statusClass = 'non-aktif';
        }

        // Cek jika ini draft
        if (data.isDraft === true) {
           status = 'Draft';
           statusClass = 'draft';
        }
        
        if (status === 'Aktif') countAktif++;
        if (status === 'Draft') countDraft++;
        
        // --- APPLY FILTERS ---
        if(status === 'Aktif' && !filterState.aktif) return;
        if(status === 'Draft' && !filterState.draft) return;
        if((status === 'Non Aktif' || status === 'Menunggu Jadwal') && !filterState.nonAktif) return;
        if((data.diskon || 0) < filterState.minDiskon) return;
        // ---------------------

        countShown++;

        let badgeClass = 'badge-discount-green';
        if (data.diskon >= 50) badgeClass = 'badge-discount-yellow';

        let actionHtml = '<button class="btn-delete-promo" data-id="' + id + '" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:20px; padding:4px;" title="Hapus"><i class="bx bx-trash"></i></button>';

        if (data.isDraft === true) {
            actionHtml = '<button class="btn-activate-promo" data-id="' + id + '" style="background:none; border:none; color:#3b82f6; cursor:pointer; font-size:20px; padding:4px; margin-right:8px;" title="Aktifkan"><i class="bx bx-play-circle"></i></button>' + actionHtml;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = 
          '<td>' + (data.kode || '-') + '</td>' +
          '<td>' + (data.nama || '-') + '</td>' +
          '<td><span class="' + badgeClass + '">' + (data.diskon || 0) + '%</span></td>' +
          '<td>' + (data.digunakan || 0) + '/' + (data.kuota || 0) + '</td>' +
          '<td><span class="status-pill ' + statusClass + '">' + status + '</span></td>' +
          '<td class="' + sisaHariClass + '">' + sisaHariText + '</td>' +
          '<td style="white-space:nowrap;">' + actionHtml + '</td>';
        
        tableBody.appendChild(tr);
    });

    if (countShown === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#6b7280; padding:20px;">Tidak ada promo yang sesuai dengan filter.</td></tr>';
    }

    // --- UPDATE DOM STATS ---
    const elStatTotal = document.getElementById('statTotal');
    const elStatAktif = document.getElementById('statAktif');
    const elStatDraft = document.getElementById('statDraft');
    const elStatBerakhir = document.getElementById('statBerakhir');

    if (elStatTotal) elStatTotal.innerHTML = countTotal + ' <span class="stat-unit">Promo</span>';
    if (elStatAktif) elStatAktif.innerHTML = countAktif + ' <span class="stat-unit">Berjalan</span>';
    if (elStatDraft) elStatDraft.innerHTML = countDraft + ' <span class="stat-unit">Menunggu</span>';
    if (elStatBerakhir) elStatBerakhir.innerHTML = countBerakhirBulanIni + ' <span class="stat-unit">Promo</span>';

    // Pasang Event Listener Tombol Aksi
    const deleteBtns = document.querySelectorAll('.btn-delete-promo');
    deleteBtns.forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (confirm('Yakin ingin menghapus promo ini?')) {
          const docId = btn.getAttribute('data-id');
          try {
            await deleteDoc(doc(db, "promos", docId));
            showToast('Promo berhasil dihapus', '#22c55e');
          } catch(e) {
            console.error('Error deleting promo:', e);
            showToast('Gagal menghapus promo', '#ef4444');
          }
        }
      });
    });

    const activateBtns = document.querySelectorAll('.btn-activate-promo');
    activateBtns.forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (confirm('Aktifkan promo draft ini agar bisa digunakan?')) {
          const docId = btn.getAttribute('data-id');
          try {
            await updateDoc(doc(db, "promos", docId), { isDraft: false });
            showToast('Promo berhasil diaktifkan!', '#22c55e');
          } catch(e) {
            console.error('Error activating promo:', e);
            showToast('Gagal mengaktifkan promo', '#ef4444');
          }
        }
      });
    });
  }

  // --- REALTIME DATA RENDER ---
  if (tableBody) {
    const q = query(collection(db, "promos"), orderBy("createdAt", "desc"));
    onSnapshot(q, function(snapshot) {
      allPromos = [];
      snapshot.forEach(function(docSnap) {
          allPromos.push({ id: docSnap.id, data: docSnap.data() });
      });
      renderTable();
    });
  }


  // --- LOGIKA TOGGLE PENGATURAN & FILTER POPUP ---
  const btnSettingsToggle = document.getElementById('btnSettingsToggle');
  const settingsPopup = document.getElementById('settingsPopup');
  const settingsLogoutBtn = document.getElementById('settingsLogoutBtn');
  const btnFilterToggle = document.getElementById('btnFilterToggle');
  const filterPopup = document.getElementById('filterPopup');
  const btnNotifToggle = document.getElementById('btnNotifToggle');
  const notifPopup = document.getElementById('notifPopup');
  const settingsItemNotif = document.getElementById('settingsItemNotif');

  function closeAllPopups() {
    if (settingsPopup) settingsPopup.classList.remove('show');
    if (filterPopup) filterPopup.classList.remove('show');
    if (notifPopup) notifPopup.classList.remove('show');
  }

  if (btnFilterToggle && filterPopup) {
    btnFilterToggle.addEventListener('click', function(e) {
      e.stopPropagation(); 
      const isShowingF = filterPopup.classList.contains('show');
      closeAllPopups();
      if (!isShowingF) filterPopup.classList.add('show');
    });

    filterPopup.addEventListener('click', function(e) { e.stopPropagation(); });

    const btnTerapkan = filterPopup.querySelector('.btn-terapkan-filter');
    if (btnTerapkan) {
      btnTerapkan.addEventListener('click', function() {
        updateFilterState();
        renderTable();
        filterPopup.classList.remove('show');
      });
    }
  }

  if (btnSettingsToggle && settingsPopup) {
    btnSettingsToggle.addEventListener('click', function(e) {
      e.stopPropagation(); 
      const isShowing = settingsPopup.classList.contains('show');
      closeAllPopups();
      if (!isShowing) settingsPopup.classList.add('show');
    });

    settingsPopup.addEventListener('click', function(e) { e.stopPropagation(); });
  }

  if (btnNotifToggle && notifPopup) {
    btnNotifToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      const isShowing = notifPopup.classList.contains('show');
      closeAllPopups();
      if (!isShowing) notifPopup.classList.add('show');
    });
    notifPopup.addEventListener('click', function(e) { e.stopPropagation(); });
  }

  if (settingsItemNotif && notifPopup) {
    settingsItemNotif.addEventListener('click', function(e) {
      e.stopPropagation();
      closeAllPopups();
      notifPopup.classList.add('show');
    });
  }

  window.addEventListener('click', function() {
    closeAllPopups();
  });

  const markAllBtn = document.querySelector('.notif-mark-read');
  const notifItems = document.querySelectorAll('.notif-item');

  if (markAllBtn) {
    markAllBtn.addEventListener('click', function(e) {
      e.preventDefault();
      notifItems.forEach(function(item) {
        const dot = item.querySelector('.notif-unread-dot');
        if (dot) dot.style.display = 'none';
      });
    });
  }

  notifItems.forEach(function(item) {
    item.style.cursor = 'pointer';
    item.addEventListener('click', function() {
      const dot = item.querySelector('.notif-unread-dot');
      if (dot) dot.style.display = 'none';
    });
  });

  // --- LOGIKA LOGOUT ---
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      clearAuth();
      window.location.href = LOGIN_PAGE;
    });
  }

  if (settingsLogoutBtn) {
    settingsLogoutBtn.addEventListener('click', function() {
      clearAuth();
      window.location.href = LOGIN_PAGE;
    });
  }

  // Foto User
  const userPhoto = localStorage.getItem('user_photo');
  if (userPhoto) {
    const avatars = document.querySelectorAll('.user-avatar');
    avatars.forEach(function(av) {
      av.innerHTML = "<img src='" + userPhoto + "' style='width:100%; height:100%; border-radius:50%; object-fit:cover;'>";
    });
  }

});
