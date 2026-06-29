import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

function isLoggedIn() {
  return !!(
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('user_name') ||
    sessionStorage.getItem('user_name')
  );
}

function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka);
}

document.addEventListener("DOMContentLoaded", () => {
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

    // FITUR LOGOUT 
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        ['auth_token', 'user_name', 'user_email'].forEach((key) => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        sessionStorage.removeItem('selectedCustomer');
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
      settingsPopup.addEventListener('click', (e) => e.stopPropagation());
    }

    window.addEventListener('click', () => {
      if (typeof closeAllPopups === 'function') closeAllPopups();
    });

    const btnNotifToggle = document.getElementById('btnNotifToggle');
    const notifPopup = document.getElementById('notifPopup');
    const settingsItemNotif = document.getElementById('settingsItemNotif');

    function closeAllPopups() {
      const sp = document.getElementById('settingsPopup');
      const np = document.getElementById('notifPopup');
      const fp = document.getElementById('filterPopup');
      if (sp) sp.classList.remove('show');
      if (np) np.classList.remove('show');
      if (fp) fp.classList.remove('show');
    }
    window.closeAllPopups = closeAllPopups;

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

    const btnFilterToggle = document.getElementById('btnFilterToggle');
    const filterPopup = document.getElementById('filterPopup');

    if (btnFilterToggle && filterPopup) {
      btnFilterToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShowing = filterPopup.classList.contains('show');
        closeAllPopups();
        if (!isShowing) filterPopup.classList.add('show');
      });
      filterPopup.addEventListener('click', (e) => e.stopPropagation());
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

    // --- MARKET INTELLIGENCE LOGIC ---
    const btnShowAddForm = document.getElementById('btnShowAddForm');
    const btnCancelAdd = document.getElementById('btnCancelAdd');
    const btnSaveData = document.getElementById('btnSaveData');
    const btnSuccessAddMore = document.getElementById('btnSuccessAddMore');
    const btnSuccessViewAll = document.getElementById('btnSuccessViewAll');
    const btnSuccessNextPage = document.getElementById('btnSuccessNextPage');
    
    const marketDashboardView = document.getElementById('marketDashboardView');
    const marketAddFormView = document.getElementById('marketAddFormView');
    const marketSuccessView = document.getElementById('marketSuccessView');
    const marketTableBody = document.getElementById('marketTableBody');

    const statTotalPesaing = document.getElementById('statTotalPesaing');
    const statAvgHarga = document.getElementById('statAvgHarga');
    const statMinHarga = document.getElementById('statMinHarga');
    const statMaxHarga = document.getElementById('statMaxHarga');

    const showView = (viewToShow) => {
        marketDashboardView.style.display = 'none';
        marketAddFormView.style.display = 'none';
        marketSuccessView.style.display = 'none';
        
        viewToShow.style.display = 'block';
        window.scrollTo(0, 0);
    };

    if (btnShowAddForm) {
        btnShowAddForm.addEventListener('click', () => {
            document.getElementById('marketInputNama').value = '';
            document.getElementById('marketInputVarian').value = '';
            document.getElementById('marketInputHarga').value = '';
            document.getElementById('marketInputPromo').value = '';
            document.getElementById('marketInputRekomendasi').value = '';
            showView(marketAddFormView);
        });
    }

    if (btnCancelAdd) {
        btnCancelAdd.addEventListener('click', () => {
            showView(marketDashboardView);
        });
    }

    if (btnSuccessAddMore) {
        btnSuccessAddMore.addEventListener('click', () => {
            document.getElementById('marketInputNama').value = '';
            document.getElementById('marketInputVarian').value = '';
            document.getElementById('marketInputHarga').value = '';
            document.getElementById('marketInputPromo').value = '';
            document.getElementById('marketInputRekomendasi').value = '';
            showView(marketAddFormView);
        });
    }

    if (btnSuccessViewAll || btnSuccessNextPage) {
        const backToDash = () => showView(marketDashboardView);
        if(btnSuccessViewAll) btnSuccessViewAll.addEventListener('click', backToDash);
        if(btnSuccessNextPage) btnSuccessNextPage.addEventListener('click', backToDash);
    }

    if (btnSaveData) {
        btnSaveData.addEventListener('click', async () => {
            const nama = document.getElementById('marketInputNama').value.trim();
            const varian = document.getElementById('marketInputVarian').value.trim();
            const harga = parseInt(document.getElementById('marketInputHarga').value) || 0;
            const promo = document.getElementById('marketInputPromo').value.trim();
            const rekomendasi = document.getElementById('marketInputRekomendasi').value.trim();

            if (!nama || !harga) {
                alert("Mohon isi setidaknya Nama Pesaing dan Harga.");
                return;
            }

            btnSaveData.disabled = true;
            btnSaveData.textContent = "Menyimpan...";

            try {
                await addDoc(collection(db, "competitors"), {
                    nama: nama,
                    varian: varian,
                    harga: harga,
                    promo: promo,
                    rekomendasi: rekomendasi,
                    createdAt: serverTimestamp()
                });

                // Update success view
                document.getElementById('successMarketNama').textContent = nama;
                document.getElementById('successMarketVarian').textContent = varian || '-';
                document.getElementById('successMarketHarga').textContent = formatRupiah(harga);
                document.getElementById('successMarketPromo').textContent = promo || '-';
                document.getElementById('successMarketRekomendasi').textContent = rekomendasi || '-';

                showView(marketSuccessView);
            } catch (err) {
                console.error("Gagal menyimpan data:", err);
                alert("Terjadi kesalahan sistem, gagal menyimpan data.");
            } finally {
                btnSaveData.disabled = false;
                btnSaveData.textContent = "Simpan Data";
            }
        });
    }

    // --- REALTIME DATA (TABLE & STATS) ---
    let allCompetitors = [];
    
    function renderMarketTable() {
        if (!marketTableBody) return;
        
        const filterVarian = (document.getElementById('filterVarianRasa')?.value || '').toLowerCase().trim();
        const filterPesaing = (document.getElementById('filterPesaing')?.value || '').toLowerCase().trim();
        const globalSearch = (document.querySelector('.search-box-large input')?.value || '').toLowerCase().trim();

        marketTableBody.innerHTML = '';
        
        let count = 0;
        let sumHarga = 0;
        let minHarga = Infinity;
        let maxHarga = 0;

        let filteredCompetitors = allCompetitors.filter(c => {
            const varian = (c.data.varian || '').toLowerCase();
            const nama = (c.data.nama || '').toLowerCase();
            
            // Check specific filters
            if (filterVarian && !varian.includes(filterVarian)) return false;
            if (filterPesaing && !nama.includes(filterPesaing)) return false;
            
            // Check global search
            if (globalSearch && !(nama.includes(globalSearch) || varian.includes(globalSearch))) return false;
            
            return true;
        });

        if (filteredCompetitors.length === 0) {
            marketTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#6b7280; padding:20px;">Belum ada data pesaing.</td></tr>';
        }

        filteredCompetitors.forEach((c) => {
            const data = c.data;
            const id = c.id;
            count++;
            
            const harga = data.harga || 0;
            sumHarga += harga;
            if(harga < minHarga) minHarga = harga;
            if(harga > maxHarga) maxHarga = harga;

            // Format Tanggal
            let dateStr = '-';
            if (data.createdAt) {
                const dateObj = data.createdAt.toDate();
                dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            }

            // Render badge color based on promo string (dummy logic for visual)
            let badgeClass = 'badge-green';
            const lowerPromo = (data.promo || '').toLowerCase();
            if(lowerPromo.includes('diskon')) badgeClass = 'badge-red';
            else if(lowerPromo.includes('ongkir')) badgeClass = 'badge-blue';

            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.innerHTML = `
                <td>${count}</td>
                <td>${data.nama || '-'}</td>
                <td>${data.varian || '-'}</td>
                <td>${formatRupiah(harga)}</td>
                <td><span class="badge ${badgeClass}">${data.promo || '-'}</span></td>
                <td>${dateStr}</td>
                <td style="white-space:nowrap;">
                    <button class="btn-expand-market" data-id="${id}" style="background:none; border:none; color:var(--primary-blue, #004FA3); cursor:pointer; font-size:20px; padding:4px; transition: transform 0.3s;" title="Lihat Detail"><i class='bx bx-chevron-down'></i></button>
                    <button class="btn-delete-market" data-id="${id}" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:20px; padding:4px;" title="Hapus"><i class='bx bx-trash'></i></button>
                </td>
            `;
            marketTableBody.appendChild(tr);

            // Detail row (hidden by default)
            const detailTr = document.createElement('tr');
            detailTr.id = 'detail-' + id;
            detailTr.style.display = 'none';
            detailTr.innerHTML = `
                <td colspan="7" style="padding: 0; border-top: none;">
                    <div style="background: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 12px; padding: 24px 32px; margin: 8px 12px 16px 12px;">
                        <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 20px; color: #111827;">Ringkasan Data Tersimpan</h3>
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6B7280; font-weight: 500;">Nama Pesaing</span>
                                <span style="font-weight: 700; color: #111827;">${data.nama || '-'}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6B7280; font-weight: 500;">Varian Rasa</span>
                                <span style="font-weight: 700; color: #111827;">${data.varian || '-'}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6B7280; font-weight: 500;">Harga per Karton (Rp)</span>
                                <span style="font-weight: 700; color: #111827;">${formatRupiah(harga)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6B7280; font-weight: 500;">Keunggulan Promo</span>
                                <span style="font-weight: 700; color: #111827;">${data.promo || '-'}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6B7280; font-weight: 500;">Rekomendasi Strategi</span>
                                <span style="font-weight: 500; color: #6B7280; font-style: italic; max-width: 60%; text-align: right;">${data.rekomendasi || '-'}</span>
                            </div>
                        </div>
                        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
                        <h4 style="font-size: 15px; font-weight: 800; margin-bottom: 14px; color: #111827;">Info Penyimpanan</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <p style="color: #6B7280; font-size: 13px; margin-bottom: 2px;">Disimpan oleh</p>
                                <p style="font-weight: 700; font-size: 14px;">${userName}</p>
                            </div>
                            <div>
                                <p style="color: #6B7280; font-size: 13px; margin-bottom: 2px;">Tipe data</p>
                                <p style="font-weight: 700; font-size: 14px;">Data teks biasa</p>
                            </div>
                            <div>
                                <p style="color: #6B7280; font-size: 13px; margin-bottom: 2px;">Lokasi penyimpanan</p>
                                <p style="font-weight: 700; font-size: 14px;">Database Analitik</p>
                            </div>
                            <div>
                                <p style="color: #6B7280; font-size: 13px; margin-bottom: 2px;">Status</p>
                                <p style="font-weight: 700; font-size: 14px; color: #10B981;">Tersimpan</p>
                            </div>
                        </div>
                    </div>
                </td>
            `;
            marketTableBody.appendChild(detailTr);
        });

        // Update stats
        if (statTotalPesaing) statTotalPesaing.textContent = count;
        
        if (count > 0) {
            const avg = sumHarga / count;
            if (statAvgHarga) statAvgHarga.textContent = formatRupiah(avg);
            if (statMinHarga) statMinHarga.textContent = formatRupiah(minHarga);
            if (statMaxHarga) statMaxHarga.textContent = formatRupiah(maxHarga);
        } else {
            if (statAvgHarga) statAvgHarga.textContent = "Rp 0";
            if (statMinHarga) statMinHarga.textContent = "Rp 0";
            if (statMaxHarga) statMaxHarga.textContent = "Rp 0";
        }

        // Attach expand listeners
        const expandBtns = document.querySelectorAll('.btn-expand-market');
        expandBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const docId = btn.getAttribute('data-id');
                const detailRow = document.getElementById('detail-' + docId);
                const icon = btn.querySelector('i');
                if (detailRow) {
                    if (detailRow.style.display === 'none') {
                        detailRow.style.display = 'table-row';
                        btn.style.transform = 'rotate(180deg)';
                    } else {
                        detailRow.style.display = 'none';
                        btn.style.transform = 'rotate(0deg)';
                    }
                }
            });
        });

        // Attach delete listeners
        const deleteBtns = document.querySelectorAll('.btn-delete-market');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Yakin ingin menghapus data pesaing ini?')) {
                    const docId = btn.getAttribute('data-id');
                    try {
                        await deleteDoc(doc(db, "competitors", docId));
                    } catch(e) {
                        console.error('Error delete:', e);
                        alert('Gagal menghapus data.');
                    }
                }
            });
        });
    }

    if (marketTableBody) {
        const q = query(collection(db, "competitors"), orderBy("createdAt", "desc"));
        onSnapshot(q, (snapshot) => {
            allCompetitors = [];
            snapshot.forEach((docSnap) => {
                allCompetitors.push({
                    id: docSnap.id,
                    data: docSnap.data()
                });
            });
            renderMarketTable();
        });

        // Setup filter listeners
        const btnApplyFilterMarket = document.getElementById('btnApplyFilterMarket');
        const btnClearFilterMarket = document.getElementById('btnClearFilterMarket');
        const globalSearchInput = document.querySelector('.search-box-large input');

        if (btnApplyFilterMarket) {
            btnApplyFilterMarket.addEventListener('click', () => {
                renderMarketTable();
                if (typeof window.closeAllPopups === 'function') window.closeAllPopups();
            });
        }

        if (btnClearFilterMarket) {
            btnClearFilterMarket.addEventListener('click', () => {
                const elVarian = document.getElementById('filterVarianRasa');
                const elPesaing = document.getElementById('filterPesaing');
                if(elVarian) elVarian.value = '';
                if(elPesaing) elPesaing.value = '';
                renderMarketTable();
                if (typeof window.closeAllPopups === 'function') window.closeAllPopups();
            });
        }

        if (globalSearchInput) {
            globalSearchInput.addEventListener('input', () => {
                renderMarketTable();
            });
        }
    }

});
