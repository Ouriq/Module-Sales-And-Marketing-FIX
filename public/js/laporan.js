import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

function formatRupiah(number) {
    if (isNaN(number)) return "0";
    return new Intl.NumberFormat('id-ID').format(number);
}

function parseRupiahStr(str) {
    if (!str) return 0;
    return parseInt(str.replace(/[^0-9,-]/g, '')) || 0;
}

let reportData = [];
let currentReportInfo = {
    filename: '',
    period: '',
    region: '',
    variant: '',
    status: '',
    generatedTime: ''
};

document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
      window.location.href = LOGIN_PAGE;
      return;
    }

    const userName =
      localStorage.getItem('user_name') ||
      sessionStorage.getItem('user_name') ||
      'Nilam';
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay) userNameDisplay.textContent = userName;

    const userPhoto = localStorage.getItem('user_photo');
    if (userPhoto) {
      const avatars = document.querySelectorAll('.user-avatar');
      avatars.forEach(av => {
        av.innerHTML = "<img src='" + userPhoto + "' style='width:100%; height:100%; border-radius:50%; object-fit:cover;'>";
      });
    }

    document.getElementById('logoutBtn')?.addEventListener('click', doLogout);
    document.getElementById('settingsLogoutBtn')?.addEventListener('click', doLogout);

    function doLogout() {
      ['auth_token', 'user_name', 'user_email'].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      sessionStorage.removeItem('selectedCustomer');
      window.location.href = LOGIN_PAGE;
    }

    // --- LOGIKA TOGGLE PENGATURAN POPUP ---
    const btnSettingsToggle = document.getElementById('btnSettingsToggle');
    const settingsPopup = document.getElementById('settingsPopup');
    if (btnSettingsToggle && settingsPopup) {
      btnSettingsToggle.addEventListener('click', (e) => {
        e.stopPropagation(); 
        const isShowing = settingsPopup.classList.contains('show');
        if (typeof closeAllPopups === 'function') closeAllPopups();
        if (!isShowing) settingsPopup.classList.add('show');
      });
      settingsPopup.addEventListener('click', (e) => e.stopPropagation());
    }

    const btnNotifToggle = document.getElementById('btnNotifToggle');
    const notifPopup = document.getElementById('notifPopup');
    const settingsItemNotif = document.getElementById('settingsItemNotif');

    window.closeAllPopups = function() {
      if (settingsPopup) settingsPopup.classList.remove('show');
      if (notifPopup) notifPopup.classList.remove('show');
    };

    window.addEventListener('click', () => {
      if (typeof closeAllPopups === 'function') closeAllPopups();
    });

    if (btnNotifToggle && notifPopup) {
      btnNotifToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShowing = notifPopup.classList.contains('show');
        closeAllPopups();
        if (!isShowing) notifPopup.classList.add('show');
      });
      notifPopup.addEventListener('click', (e) => e.stopPropagation());
    }

    // Initialize Default Dates
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    if (filterDateFrom) filterDateFrom.value = firstDay.toISOString().split('T')[0];
    if (filterDateTo) filterDateTo.value = today.toISOString().split('T')[0];

    // Filter Logic
    const btnGenerateReport = document.getElementById('btnGenerateReport');
    const btnResetFilter = document.getElementById('btnResetFilter');
    const btnResetDataSO = document.getElementById('btnResetDataSO');

    if (btnResetDataSO) {
        btnResetDataSO.addEventListener('click', async () => {
            if (confirm("PERINGATAN: Anda yakin ingin menghapus SELURUH data Sales Order yang tersimpan di sistem? Tindakan ini tidak dapat dibatalkan!")) {
                const oldText = btnResetDataSO.innerHTML;
                btnResetDataSO.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Menghapus...";
                btnResetDataSO.disabled = true;
                
                try {
                    const qs = await getDocs(collection(db, "sales_orders"));
                    const deletePromises = [];
                    qs.forEach(docSnap => {
                        deletePromises.push(deleteDoc(doc(db, "sales_orders", docSnap.id)));
                    });
                    
                    await Promise.all(deletePromises);
                    alert("Seluruh data Sales Order berhasil di-reset / dihapus.");
                    
                    // clear preview report
                    document.getElementById('reportA4Container').style.display = 'none';
                    document.getElementById('previewBanner').style.display = 'none';
                    reportData = [];
                } catch (err) {
                    console.error(err);
                    alert("Terjadi kesalahan saat menghapus data.");
                } finally {
                    btnResetDataSO.disabled = false;
                    btnResetDataSO.innerHTML = oldText;
                }
            }
        });
    }

    if (btnResetFilter) {
        btnResetFilter.addEventListener('click', () => {
            if (filterDateFrom) filterDateFrom.value = firstDay.toISOString().split('T')[0];
            if (filterDateTo) filterDateTo.value = today.toISOString().split('T')[0];
            document.getElementById('filterRegion').value = '';
            document.getElementById('filterVariant').value = '';
            document.getElementById('filterStatus').value = '';
            
            document.getElementById('reportA4Container').style.display = 'none';
            document.getElementById('previewBanner').style.display = 'none';
        });
    }

    if (btnGenerateReport) {
        btnGenerateReport.addEventListener('click', async () => {
            btnGenerateReport.disabled = true;
            btnGenerateReport.textContent = "Loading...";

            try {
                const dateFromStr = filterDateFrom.value;
                const dateToStr = filterDateTo.value;
                const regionFilter = document.getElementById('filterRegion').value;
                const variantFilter = document.getElementById('filterVariant').value;
                const statusFilter = document.getElementById('filterStatus').value;

                const q = query(collection(db, "sales_orders"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                
                let results = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    let dateObj = data.createdAt ? data.createdAt.toDate() : new Date();
                    const dateStrYYYYMMDD = dateObj.toISOString().split('T')[0];

                    // Filtering
                    if (dateFromStr && dateStrYYYYMMDD < dateFromStr) return;
                    if (dateToStr && dateStrYYYYMMDD > dateToStr) return;
                    
                    const region = data.customer?.wilayah || '-';
                    if (regionFilter && region !== regionFilter) return;

                    const status = data.status || 'Valid'; // Assume default Valid if empty
                    if (statusFilter && status !== statusFilter) return;

                    // If variant filter, check if products contain it
                    let productsToInclude = data.products || [];
                    if (variantFilter) {
                        productsToInclude = productsToInclude.filter(p => p.name === variantFilter);
                        if (productsToInclude.length === 0) return;
                    }

                    let soNo = data.soNumber;
                    if (!soNo) {
                        // Generate a pseudo-SO number from doc.id if it wasn't saved
                        soNo = 'SO-' + doc.id.substring(0, 6).toUpperCase();
                    }

                    // Calculate total from filtered products (not full grandTotal)
                    let calculatedTotal = 0;
                    if (variantFilter && productsToInclude.length > 0) {
                        // When filtering by variant, sum only the filtered products
                        productsToInclude.forEach(p => {
                            calculatedTotal += (p.quantity || 0) * (p.price || 0);
                        });
                    } else {
                        // No variant filter: use the full grand total
                        calculatedTotal = parseRupiahStr(data.grandTotal);
                    }

                    results.push({
                        docId: doc.id,
                        soNumber: soNo,
                        dateObj: dateObj,
                        customerName: data.customer?.nama || '-',
                        region: region,
                        status: status,
                        products: productsToInclude,
                        totalAmount: calculatedTotal
                    });
                });

                // Prepare table rows by flat-mapping products
                let tableRows = [];
                results.forEach(so => {
                    if (so.products.length === 0) {
                        tableRows.push({
                            soNumber: so.soNumber,
                            dateStr: so.dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
                            customerName: so.customerName,
                            region: so.region,
                            variant: '-',
                            hargaStr: '0'
                        });
                    } else {
                        so.products.forEach(p => {
                            const subtotal = p.quantity * p.price;
                            tableRows.push({
                                soNumber: so.soNumber,
                                dateStr: so.dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
                                customerName: so.customerName,
                                region: so.region,
                                variant: p.name,
                                harga: subtotal,
                                hargaStr: formatRupiah(subtotal)
                            });
                        });
                    }
                });

                reportData = tableRows;
                
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
                const fDate = new Date(dateFromStr);
                const tDate = new Date(dateToStr);
                const periodStr = `${fDate.getDate()} ${monthNames[fDate.getMonth()]} - ${tDate.getDate()} ${monthNames[tDate.getMonth()]} ${tDate.getFullYear()}`;
                const genDate = new Date();
                
                currentReportInfo.period = periodStr;
                currentReportInfo.region = regionFilter || "Semua Wilayah";
                currentReportInfo.variant = variantFilter || "Semua Varian";
                currentReportInfo.status = statusFilter || "Valid";
                currentReportInfo.generatedTime = `${genDate.getDate()} ${monthNames[genDate.getMonth()]} ${genDate.getFullYear()}, ${String(genDate.getHours()).padStart(2, '0')}:${String(genDate.getMinutes()).padStart(2, '0')}`;
                
                const sanitizedRegion = currentReportInfo.region.replace(/\s+/g, '');
                const monthYear = `${monthNames[tDate.getMonth()]}${tDate.getFullYear()}`;
                currentReportInfo.filename = `Laporan_Penjualan_${monthYear}_${sanitizedRegion}`;

                populateReport(results, tableRows);

                document.getElementById('reportA4Container').style.display = 'block';
                document.getElementById('previewBanner').style.display = 'flex';

            } catch (err) {
                console.error(err);
                alert("Gagal memuat data laporan.");
            } finally {
                btnGenerateReport.disabled = false;
                btnGenerateReport.textContent = "Generate Laporan";
            }
        });
    }

    function populateReport(soResults, flatRows) {
        document.getElementById('docNoVal').textContent = 'IDN-' + new Date().getTime().toString().slice(-6);
        document.getElementById('docPeriodeVal').textContent = currentReportInfo.period;
        document.getElementById('docRegionVal').textContent = currentReportInfo.region;
        document.getElementById('docVariantVal').textContent = currentReportInfo.variant;
        document.getElementById('docStatusVal').textContent = currentReportInfo.status;

        const totalSO = soResults.length;
        const totalValue = soResults.reduce((acc, so) => acc + so.totalAmount, 0);
        const avgValue = totalSO > 0 ? Math.round(totalValue / totalSO) : 0;
        
        const validCount = soResults.filter(s => s.status !== 'Batal').length;
        const validRate = totalSO > 0 ? ((validCount/totalSO)*100).toFixed(1) + '%' : '0%';

        document.getElementById('summaryTotalSO').textContent = formatRupiah(totalSO);
        document.getElementById('summaryTotalValue').textContent = 'Rp ' + formatRupiah(totalValue);
        document.getElementById('summaryAvgValue').textContent = 'Rp ' + formatRupiah(avgValue);
        document.getElementById('summaryValidRate').textContent = validRate;

        const tbody = document.getElementById('reportTableBody');
        tbody.innerHTML = '';
        flatRows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${row.soNumber}</td>
              <td>${row.dateStr}</td>
              <td>${row.customerName}</td>
              <td>${row.region}</td>
              <td>${row.variant}</td>
              <td style="text-align: right;">${row.hargaStr}</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('footerRecordCount').textContent = `${flatRows.length} dari ${flatRows.length} baris`;
        document.getElementById('footerTotalValue').textContent = 'Rp ' + formatRupiah(totalValue);

        document.getElementById('reportFilenameDisplay').textContent = currentReportInfo.filename + '.pdf';
        document.getElementById('reportMetaDisplay').textContent = `Digenerate ${currentReportInfo.generatedTime} - ${totalSO} SO`;
        
        document.getElementById('dlMetaPDF').textContent = `${currentReportInfo.filename}.pdf`;
        document.getElementById('dlMetaExcel').textContent = `${currentReportInfo.filename}.xlsx`;
    }

    // Download handlers
    document.getElementById('btnDownloadPDF')?.addEventListener('click', () => {
        if (!reportData.length) return alert('Silakan generate laporan terlebih dahulu.');
        
        const element = document.getElementById('reportA4Container');
        // Hide original shadows for PDF clean look
        const originalBoxShadow = element.style.boxShadow;
        element.style.boxShadow = 'none';

        const opt = {
          margin:       [0.5, 0.5, 0.5, 0.5],
          filename:     currentReportInfo.filename + '.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        const btn = document.getElementById('btnDownloadPDF');
        const oldHtml = btn.innerHTML;
        btn.innerHTML = '<h4>Membuat PDF...</h4>';
        
        html2pdf().set(opt).from(element).save().then(() => {
            element.style.boxShadow = originalBoxShadow;
            btn.innerHTML = oldHtml;
        });
    });

    document.getElementById('btnDownloadExcel')?.addEventListener('click', () => {
        if (!reportData.length) return alert('Silakan generate laporan terlebih dahulu.');
        
        const btn = document.getElementById('btnDownloadExcel');
        const oldHtml = btn.innerHTML;
        btn.innerHTML = '<h4>Mengekspor...</h4>';

        // Convert reportData to worksheet
        const wsData = [
            ["Laporan Penjualan - PT. FOODSYNC TBK"],
            [`Periode: ${currentReportInfo.period}`, `Wilayah: ${currentReportInfo.region}`],
            [`Varian: ${currentReportInfo.variant}`, `Status: ${currentReportInfo.status}`],
            [],
            ["No. SO", "Tanggal", "Pelanggan", "Wilayah", "Varian", "Harga (Rp)"]
        ];

        reportData.forEach(row => {
            wsData.push([
                row.soNumber,
                row.dateStr,
                row.customerName,
                row.region,
                row.variant,
                row.harga || 0
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
        
        XLSX.writeFile(wb, currentReportInfo.filename + '.xlsx');
        btn.innerHTML = oldHtml;
    });

});
