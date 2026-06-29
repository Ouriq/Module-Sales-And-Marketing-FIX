import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDL36048RpIK_-_vyg0s_92pWRjM91mhKA",
  authDomain: "sistem-erp-food-sync.firebaseapp.com",
  projectId: "sistem-erp-food-sync",
  storageBucket: "sistem-erp-food-sync.firebasestorage.app",
  messagingSenderId: "9152919413",
  appId: "1:9152919413:web:4ad7cf28f57ef83d23453c"
};

console.log('Firebase init'); 
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

function showToast(message, color = '#22c55e') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.background = color;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  toast.style.pointerEvents = 'auto';
  setTimeout(() => { 
    toast.style.opacity = '0'; 
    toast.style.transform = 'translateY(-20px)';
    toast.style.pointerEvents = 'none';
  }, 3500);
}

function initApp() {
  if (!isLoggedIn()) {
    window.location.href = LOGIN_PAGE;
    return;
  }

  const userName =
    localStorage.getItem('user_name') ||
    sessionStorage.getItem('user_name') ||
    'Pengguna';
  
  const userNameDisplay = document.getElementById('userNameDisplay');
  if (userNameDisplay) userNameDisplay.textContent = userName;

  const modal = document.getElementById('modalAddData');
  const btnAdd = document.getElementById('btnAddData');
  const btnDraft = document.getElementById('btnDraft');
  const form = document.getElementById('formAddData');
  const tableBody = document.getElementById('tableBody');

  // --- AUTO GENERATE ID DISTRIBUTOR ---
  let customerCount = 0; // Will be updated from onSnapshot

  function generateDistributorId() {
    customerCount++;
    const now = new Date();
    const year = now.getFullYear().toString().slice(2); // "26"
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(customerCount).padStart(4, '0');
    const rand = String(Math.floor(Math.random() * 90) + 10); // 2-digit random
    return 'ID-' + year + month + '-' + seq + '-' + rand;
  }

  if (btnAdd && modal) {
    btnAdd.addEventListener('click', () => { 
      console.log('btnAddData clicked');
      // Auto-fill ID Distributor
      const inputID = document.getElementById('inputID');
      if (inputID) {
        inputID.value = generateDistributorId();
      }
      modal.classList.add('active');
    });
  }

  window.addEventListener('click', (e) => {
    if (modal && e.target === modal) {
      modal.classList.remove('active');
    }
  });

  if (btnDraft && form && modal) {
    btnDraft.addEventListener('click', () => {
      form.reset();
      modal.classList.remove('active');
    });
  }

  if (tableBody) {
    // Fetch data in real-time
    onSnapshot(collection(db, "customers"), (snapshot) => {
      console.log('onSnapshot fired', snapshot.docs.length);
      customerCount = snapshot.docs.length; // Update count for auto-ID
      tableBody.innerHTML = '';
      if (snapshot.empty) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Belum ada data pelanggan.</td></tr>';
        return;
      }

      let docs = [];
      snapshot.forEach((docSnap) => {
        docs.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      // Sort manually by createdAt (newest first)
      docs.sort((a, b) => {
        const timeA = a.createdAt ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });

      docs.forEach((data) => {
        let isExpired = false;
        if (data.tglBerakhir) {
          const endDate = new Date(data.tglBerakhir);
          endDate.setHours(23, 59, 59, 999);
          const today = new Date();
          if (endDate < today) {
            isExpired = true;
          }
        }
        
        let namaHtml = (data.nama || '-');
        if (isExpired) {
          namaHtml += ' <span style="font-size: 11px; background: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">Expired</span>';
        }

        const tr = document.createElement('tr');
        tr.setAttribute('data-nama-asli', data.nama || '-');
        tr.innerHTML = '<td>' + (data.idDist || '-') + '</td>' +
                       '<td>' + namaHtml + '</td>' +
                       '<td>' + (data.kategori || '-') + '</td>' +
                       '<td>' + (data.tier || '-') + '</td>' +
                       '<td>' + (data.pic || '-') + '</td>' +
                       '<td>' + (data.telp || '-') + '</td>' +
                       '<td style="text-align:center;"><button class="btn-delete" data-id="' + data.id + '" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;"><i class=\'bx bx-trash\'></i> Hapus</button></td>';
        tr.style.cursor = 'pointer';
        tableBody.appendChild(tr);
      });
    }, (error) => {
      console.error("Firestore error:", error);
      showToast("Error loading data: " + error.message, "#ef4444");
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const idDist = document.getElementById('inputID') ? document.getElementById('inputID').value : '';
      const nama = document.getElementById('inputNama') ? document.getElementById('inputNama').value : '';
      const kat1 = document.getElementById('inputKategori1') ? document.getElementById('inputKategori1').value : '';
      const kat2 = document.getElementById('inputKategori2') ? document.getElementById('inputKategori2').value : '';
      const kat3 = document.getElementById('inputKategori3') ? document.getElementById('inputKategori3').value : '';
      const kategoriArr = [kat1, kat2, kat3].filter(k => k && k !== '');
      const kategori = kategoriArr.length > 0 ? kategoriArr.join(', ') : '';
      const tier = document.getElementById('inputTier') ? document.getElementById('inputTier').value : '';
      const pic = document.getElementById('inputPIC') ? document.getElementById('inputPIC').value : '';
      const telp = document.getElementById('inputTelp') ? document.getElementById('inputTelp').value : '';
      const inputDeskripsi = document.getElementById('inputDeskripsi');
      const inputMulai = document.getElementById('inputMulai');
      const inputBerakhir = document.getElementById('inputBerakhir');
      const deskripsi = inputDeskripsi ? inputDeskripsi.value : '';
      const tglMulai = inputMulai ? inputMulai.value : '';
      const tglBerakhir = inputBerakhir ? inputBerakhir.value : '';

      const btnSubmit = form.querySelector('button[type="submit"]');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Menyimpan...';
      }

      try {
        await addDoc(collection(db, "customers"), {
          idDist,
          nama,
          kategori,
          tier,
          pic,
          telp,
          deskripsi,
          tglMulai,
          tglBerakhir,
          createdAt: serverTimestamp()
        });

        await addDoc(collection(db, "notifications"), {
          title: "Pelanggan Baru Disimpan",
          message: `Data pelanggan "${nama}" berhasil disimpan ke sistem.`,
          type: "pelanggan",
          isRead: false,
          createdAt: serverTimestamp()
        });

        form.reset();
        if (modal) modal.classList.remove('active');
        showToast('Berhasil: Data distributor ' + nama + ' telah disimpan!');

        sessionStorage.setItem(
          'selectedCustomer',
          JSON.stringify({ id: idDist, nama, tier, pic, telp })
        );
      } catch (error) {
        console.error("Error adding document: ", error);
        showToast('Terjadi kesalahan saat menyimpan data.', '#ef4444');
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'Simpan';
        }
      }
    });
  }

  if (tableBody) {
    tableBody.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete');
      if (deleteBtn) {
        e.stopPropagation(); // Mencegah pindah halaman
        window.deleteTargetId = deleteBtn.getAttribute('data-id');
        const modalConfirmDelete = document.getElementById('modalConfirmDelete');
        if (modalConfirmDelete) modalConfirmDelete.classList.add('active');
        return;
      }

      const row = e.target.closest('tr');
      if (!row) return;

      const cells = row.querySelectorAll('td');
      if (cells.length < 6) return;

      sessionStorage.setItem(
        'selectedCustomer',
        JSON.stringify({
          id: cells[0].textContent.trim(),
          nama: row.getAttribute('data-nama-asli') || cells[1].textContent.trim(),
          kategori: cells[2].textContent.trim(),
          tier: cells[3].textContent.trim(),
          pic: cells[4].textContent.trim(),
          telp: cells[5].textContent.trim(),
        })
      );
      window.location.href = 'sales.html';
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  const modalConfirmDelete = document.getElementById('modalConfirmDelete');
  const btnCancelDelete = document.getElementById('btnCancelDelete');
  const btnConfirmDelete = document.getElementById('btnConfirmDelete');

  if (btnCancelDelete && modalConfirmDelete) {
    btnCancelDelete.addEventListener('click', () => {
      modalConfirmDelete.classList.remove('active');
      window.deleteTargetId = null;
    });
  }

  if (btnConfirmDelete && modalConfirmDelete) {
    btnConfirmDelete.addEventListener('click', () => {
      if (!window.deleteTargetId) return;
      
      btnConfirmDelete.disabled = true;
      btnConfirmDelete.textContent = 'Menghapus...';
      
      deleteDoc(doc(db, "customers", window.deleteTargetId)).then(() => {
        showToast("Distributor berhasil dihapus", "#22c55e");
        modalConfirmDelete.classList.remove('active');
        window.deleteTargetId = null;
      }).catch((err) => {
        console.error("Error deleting document:", err);
        showToast("Gagal menghapus distributor", "#ef4444");
      }).finally(() => {
        btnConfirmDelete.disabled = false;
        btnConfirmDelete.textContent = 'Ya, Hapus';
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAuth();
      window.location.href = LOGIN_PAGE;
    });
  }

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
    if (settingsPopup) settingsPopup.classList.remove('show');
    const filterPopup = document.getElementById('filterPopup');
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
}

// Call initApp directly without DOMContentLoaded since it's a module
initApp();

const userPhoto = localStorage.getItem('user_photo');
if (userPhoto) {
  const avatars = document.querySelectorAll('.user-avatar');
  avatars.forEach(av => {
    av.innerHTML = "<img src='" + userPhoto + "' style='width:100%; height:100%; border-radius:50%; object-fit:cover;'>";
  });
}



