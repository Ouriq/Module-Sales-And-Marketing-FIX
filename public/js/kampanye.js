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

function formatRupiah(number) {
    if (isNaN(number)) return "0";
    return new Intl.NumberFormat('id-ID').format(number);
}

function formatShortRupiah(number) {
    if (number >= 1000000000) {
        return `Rp ${(number / 1000000000).toFixed(1)} M`;
    } else if (number >= 1000000) {
        return `Rp ${(number / 1000000).toFixed(1)} Jt`;
    }
    return `Rp ${formatRupiah(number)}`;
}

let campaignsData = [];
let maxBudget = 2500000000; // default 2.5 M

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

  const userPhoto = localStorage.getItem('user_photo');
  if (userPhoto) {
    const avatars = document.querySelectorAll('.user-avatar');
    avatars.forEach(av => {
      av.innerHTML = "<img src='" + userPhoto + "' style='width:100%; height:100%; border-radius:50%; object-fit:cover;'>";
    });
  }

  // --- FETCH MAX BUDGET ---
  onSnapshot(doc(db, "settings", "campaign_budget"), (docSnap) => {
      if (docSnap.exists()) {
          maxBudget = docSnap.data().value || 2500000000;
      }
      updateStats();
  });

  const btnEditBudget = document.getElementById('btnEditBudget');
  if (btnEditBudget) {
      btnEditBudget.addEventListener('click', async () => {
          const raw = prompt("Masukkan total anggaran kampanye perusahaan (hanya angka, misal 2500000000 untuk 2.5 Miliar):", maxBudget);
          if (raw !== null) {
              const num = parseInt(raw.replace(/[^0-9]/g, ''));
              if (!isNaN(num) && num > 0) {
                  try {
                      await updateDoc(doc(db, "settings", "campaign_budget"), { value: num }).catch(async (e) => {
                          // if not exist, create it
                          if(e.code === 'not-found') {
                              // We must use setDoc for new documents with specific ID. But since we didn't import setDoc, 
                              // we can import it or just use addDoc to a different collection.
                              // Wait, I didn't import setDoc. I will just alert them to use a generic config.
                              throw e;
                          }
                      });
                      alert("Anggaran berhasil diperbarui!");
                  } catch (err) {
                      // Fallback if settings/campaign_budget doesn't exist
                      // Wait, I can't use setDoc without importing it. I will dynamically import it.
                      import("https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js").then(async (m) => {
                          await m.setDoc(doc(db, "settings", "campaign_budget"), { value: num });
                          alert("Anggaran berhasil diperbarui!");
                      }).catch(e => {
                          console.error(e);
                          alert("Gagal memperbarui anggaran.");
                      });
                  }
              } else {
                  alert("Input tidak valid. Harap masukkan angka yang valid.");
              }
          }
      });
  }

  // --- REALTIME DATA FETCH ---
  const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
      campaignsData = [];
      snapshot.forEach((doc) => {
          campaignsData.push({ id: doc.id, ...doc.data() });
      });
      renderTable();
      updateStats();
  });

  function renderTable() {
    const tableBody = document.getElementById('kampanyeTableBody');
    tableBody.innerHTML = '';
    
    // Apply filters
    const searchVal = document.getElementById('filterSearch')?.value.toLowerCase() || '';
    const checkedMedia = Array.from(document.querySelectorAll('.filter-media:checked')).map(cb => cb.value);
    const checkedStatus = document.querySelector('input[name="statusFilter"]:checked')?.value || 'Semua';

    let filtered = campaignsData.filter(c => {
        let match = true;
        if (searchVal && !c.nama.toLowerCase().includes(searchVal)) match = false;
        if (checkedMedia.length > 0 && !checkedMedia.includes(c.media)) match = false;
        if (checkedStatus !== 'Semua' && c.status !== checkedStatus) match = false;
        return match;
    });

    filtered.forEach(c => {
      let iconClass = 'bx-tv';
      let bgClass = 'bg-gray';
      if (c.media === 'Tiktok') {
        iconClass = 'bxl-tiktok';
        bgClass = 'bg-dark';
      } else if (c.media === 'Instagram Reels') {
        iconClass = 'bxl-instagram';
        bgClass = 'bg-dark';
      } else if (c.media === 'YouTube Ads') {
        iconClass = 'bxl-youtube';
        bgClass = 'bg-dark';
      } else if (c.media === 'Billboard') {
        iconClass = 'bx-buildings';
        bgClass = 'bg-gray';
      }

      const formattedAnggaran = `Rp. ${formatRupiah(c.anggaran)}`;
      
      let statusClass = 'aktif';
      if (c.status === 'Draft') statusClass = 'draft';
      if (c.status === 'Selesai') statusClass = 'selesai';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="kampanye-name-cell">
            <div class="media-icon ${bgClass}"><i class='bx ${iconClass}'></i></div>
            <div>
              <p class="k-title">${c.nama}</p>
              <p class="k-subtitle">${c.subNama}</p>
            </div>
          </div>
        </td>
        <td class="font-bold">${c.media}</td>
        <td class="font-bold">${formattedAnggaran}</td>
        <td>
          <span class="status-pill ${statusClass}">${c.status}</span>
          ${c.status === 'Draft' ? `<button class="btn-activate-draft" data-id="${c.id}" style="margin-top: 4px; display: block; font-size: 11px; padding: 3px 6px; background-color: #22c55e; color: white; border: none; border-radius: 4px; cursor: pointer;"><i class='bx bx-play'></i> Jalankan</button>` : ''}
        </td>
        <td>
          <div class="mini-progress">
            <span class="font-bold">1 hari</span>
            <div class="mini-bar-bg"><div class="mini-bar-fill bg-green" style="width: 5%;"></div></div>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Attach event listeners for activate draft buttons
    document.querySelectorAll('.btn-activate-draft').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const docId = e.currentTarget.getAttribute('data-id');
            const oldHtml = e.currentTarget.innerHTML;
            e.currentTarget.innerHTML = "Memproses...";
            e.currentTarget.disabled = true;
            try {
                await updateDoc(doc(db, "campaigns", docId), { status: 'Aktif' });
                // No need to alert, UI will auto update via onSnapshot
            } catch (err) {
                console.error("Gagal mengaktifkan kampanye:", err);
                alert("Gagal menjalankan kampanye draft.");
                e.currentTarget.innerHTML = oldHtml;
                e.currentTarget.disabled = false;
            }
        });
    });
  }

  function updateStats() {
      let aktif = 0, draft = 0, selesai = 0;
      let totalAnggaran = 0;
      
      campaignsData.forEach(c => {
          if (c.status === 'Aktif') aktif++;
          if (c.status === 'Draft') draft++;
          if (c.status === 'Selesai') selesai++;
          
          if (c.status !== 'Draft') totalAnggaran += Number(c.anggaran);
      });

      const cards = document.querySelectorAll('.stat-card h3');
      if (cards.length >= 3) {
          cards[0].textContent = aktif;
          cards[1].textContent = draft;
          cards[2].textContent = selesai;
      }
      
      // Update Budget UI
      const usedBudgetDisplay = document.getElementById('usedBudgetDisplay');
      const maxBudgetDisplay = document.getElementById('maxBudgetDisplay');
      const budgetProgressBar = document.getElementById('budgetProgressBar');
      const budgetProgressPercent = document.getElementById('budgetProgressPercent');
      const budgetRemainingDisplay = document.getElementById('budgetRemainingDisplay');

      if (usedBudgetDisplay) {
          usedBudgetDisplay.textContent = formatShortRupiah(totalAnggaran);
          maxBudgetDisplay.textContent = `/ ${formatShortRupiah(maxBudget)}`;
          
          let percent = 0;
          if (maxBudget > 0) percent = (totalAnggaran / maxBudget) * 100;
          if (percent > 100) percent = 100;
          
          budgetProgressBar.style.width = `${percent}%`;
          budgetProgressPercent.textContent = `${Math.round(percent)}%`;
          
          let sisa = maxBudget - totalAnggaran;
          if (sisa < 0) sisa = 0;
          budgetRemainingDisplay.textContent = `Sisa ${formatShortRupiah(sisa)}`;
          
          if (percent >= 90) {
              budgetProgressBar.style.backgroundColor = '#ef4444'; // Red if almost full
          } else {
              budgetProgressBar.style.backgroundColor = '#4F46E5'; // Default blue
          }
      }
  }

  // --- FILTERS ---
  const filterSearch = document.getElementById('filterSearch');
  filterSearch?.addEventListener('input', renderTable);
  
  document.getElementById('btnTerapkanFilter')?.addEventListener('click', () => {
      renderTable();
      document.getElementById('filterPopup').classList.remove('show');
  });

  document.getElementById('btnHapusFilter')?.addEventListener('click', () => {
      document.querySelectorAll('.filter-media').forEach(cb => cb.checked = false);
      const semuaRadio = document.querySelector('input[name="statusFilter"][value="Semua"]');
      if (semuaRadio) semuaRadio.checked = true;
      filterSearch.value = '';
      
      renderTable();
      document.getElementById('filterPopup').classList.remove('show');
  });

  // --- LOGIKA FORM TAMBAH KAMPANYE ---
  const modal = document.getElementById('modalKampanye');
  const btnTambah = document.getElementById('btnTambahKampanye');
  const btnDraft = document.getElementById('btnDraft');
  const form = document.getElementById('formKampanye');

  btnTambah.addEventListener('click', () => {
    modal.classList.add('active');
  });

  btnDraft.addEventListener('click', async () => {
      await saveCampaign('Draft');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      form.reset();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveCampaign('Aktif');
  });
  
  async function saveCampaign(status) {
    const nama = document.getElementById('inputNama').value;
    const subNama = document.getElementById('inputSubNama').value;
    const media = document.getElementById('inputMedia').value;
    let anggaran = document.getElementById('inputAnggaran').value;
    const desc = document.getElementById('inputDeskripsi').value;
    const mulai = document.getElementById('inputMulai').value;
    const akhir = document.getElementById('inputAkhir').value;

    if (!nama || !media || !anggaran) {
        if (status === 'Aktif') alert("Mohon lengkapi data wajib.");
        return;
    }

    anggaran = parseInt(anggaran.replace(/[^0-9]/g, '')) || 0;

    const submitBtn = document.querySelector('.btn-simpan-modal');
    const oldText = submitBtn.innerHTML;
    submitBtn.innerHTML = "Menyimpan...";
    submitBtn.disabled = true;

    try {
        await addDoc(collection(db, "campaigns"), {
            nama: nama,
            subNama: subNama,
            media: media,
            anggaran: anggaran,
            deskripsi: desc,
            tanggalMulai: mulai,
            tanggalAkhir: akhir,
            status: status,
            createdAt: serverTimestamp()
        });

        await addDoc(collection(db, "notifications"), {
            title: status === 'Aktif' ? "Kampanye Baru Diaktifkan" : "Draft Kampanye Disimpan",
            message: `Kampanye "${nama}" ${status === 'Aktif' ? 'berhasil diaktifkan' : 'disimpan sebagai draft'}.`,
            type: "kampanye",
            isRead: false,
            createdAt: serverTimestamp()
        });
        
        form.reset();
        modal.classList.remove('active');
        if (status === 'Aktif') alert(`Kampanye "${nama}" berhasil diaktifkan!`);
        else alert(`Kampanye "${nama}" disimpan sebagai Draft.`);
    } catch (err) {
        console.error("Gagal menyimpan kampanye", err);
        alert("Gagal menyimpan kampanye.");
    } finally {
        submitBtn.innerHTML = oldText;
        submitBtn.disabled = false;
    }
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearAuth();
    window.location.href = LOGIN_PAGE;
  });

  // --- LOGIKA PENGATURAN & POPUP LAINNYA ---
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

  if (btnSettingsToggle && settingsPopup) {
    btnSettingsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isShowing = settingsPopup.classList.contains('show');
      closeAllPopups();
      if (!isShowing) settingsPopup.classList.add('show');
    });
    settingsPopup.addEventListener('click', (e) => e.stopPropagation());
  }

  if (btnFilterToggle && filterPopup) {
    btnFilterToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isShowing = filterPopup.classList.contains('show');
      closeAllPopups();
      if (!isShowing) filterPopup.classList.add('show');
    });
    filterPopup.addEventListener('click', (e) => e.stopPropagation());
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

  window.addEventListener('click', () => {
    closeAllPopups();
  });

  if (settingsLogoutBtn) {
    settingsLogoutBtn.addEventListener('click', () => {
      clearAuth();
      window.location.href = LOGIN_PAGE;
    });
  }

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
