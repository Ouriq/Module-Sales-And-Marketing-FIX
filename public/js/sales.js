import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, getDocs, limit } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

function applySelectedCustomer() {
  const raw = sessionStorage.getItem('selectedCustomer');
  if (!raw) return;

  try {
    const customer = JSON.parse(raw);
    const banner = document.querySelector('.customer-banner');
    if (!banner) return;

    const initials = (customer.nama || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function(w) { return w[0]; })
      .join('')
      .toUpperCase() || '\u2014';

    banner.querySelector('.avatar-circle').textContent = initials;
    banner.querySelector('.customer-details h4').textContent = customer.nama || '\u2014';
    banner.querySelector('.customer-details p').innerHTML =
      'ID: ' + (customer.id || '\u2014') + ' <span class="divider-dot">\u2022</span> ' + (customer.pic || '\u2014') + ' (' + (customer.telp || '\u2014') + ')';
    banner.querySelector('.tier-badge').textContent =
      (customer.tier || '?') + ' Tier';

    // Filter products based on customer kategori
    const allowedCategories = (customer.kategori || '').split(',').map(function(s) { return s.trim().toLowerCase(); });
    const productItems = document.querySelectorAll('.product-item');
    
    productItems.forEach(function(item) {
      const prodName = item.querySelector('h4').textContent.trim().toLowerCase();
      
      let normalizedName = prodName;
      if (prodName.includes('kuah soto')) {
        normalizedName = 'indomie soto';
      }
      
      if (allowedCategories.length === 0 || allowedCategories[0] === '' || allowedCategories.includes(normalizedName) || allowedCategories.includes(prodName)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });

  } catch (err) {
    /* abaikan data rusak */
  }
}

document.addEventListener("DOMContentLoaded", function() {
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

  applySelectedCustomer();

  // 2. Fungsi Format Uang (IDR)
  const formatRupiah = function(angka) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka).replace('Rp', 'Rp ');
  };

  // 3. Logika Kalkulator Sales Order
  const updateOrderSummary = function() {
    let subtotal = 0;
    let totalItems = 0;
    const discountRate = 0.05;
    const ppnRate = 0.11;

    document.querySelectorAll('.product-item').forEach(function(item) {
      if (item.style.display === 'none') return;
      
      const price = parseInt(item.getAttribute('data-price')) || 0;
      const qtyInput = item.querySelector('.input-qty');
      const qty = parseInt(qtyInput.value) || 0;
      
      const itemSubtotal = price * qty;
      item.querySelector('.prod-subtotal').textContent = formatRupiah(itemSubtotal);
      
      subtotal += itemSubtotal;
      if (qty > 0) totalItems += 1;
    });

    const discountAmount = subtotal * discountRate;
    const ppnAmount = (subtotal - discountAmount) * ppnRate;
    const grandTotal = subtotal - discountAmount + ppnAmount;

    document.getElementById('labelItemCount').textContent = 'Subtotal (' + totalItems + ' Item)';
    document.getElementById('valSubtotal').textContent = formatRupiah(subtotal);
    document.getElementById('valDiscount').textContent = '-' + formatRupiah(discountAmount);
    document.getElementById('valPpn').textContent = formatRupiah(ppnAmount);
    
    const grandTotalFormatted = formatRupiah(grandTotal).replace('Rp', 'RP');
    document.getElementById('valGrandTotal').textContent = grandTotalFormatted;
  };

  // 4. Event Listener untuk Tombol + dan -
  document.querySelectorAll('.qty-stepper').forEach(function(stepper) {
    const btnMin = stepper.querySelector('.btn-min');
    const btnPlus = stepper.querySelector('.btn-plus');
    const input = stepper.querySelector('.input-qty');

    btnMin.addEventListener('click', function() {
      let currentValue = parseInt(input.value);
      if (currentValue > 1) {
        input.value = currentValue - 1;
        updateOrderSummary();
      }
    });

    btnPlus.addEventListener('click', function() {
      let currentValue = parseInt(input.value);
      input.value = currentValue + 1;
      updateOrderSummary();
    });
  });

  updateOrderSummary();

  // 5. Fitur Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      ['auth_token', 'user_name', 'user_email'].forEach(function(key) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      sessionStorage.removeItem('selectedCustomer');
      window.location.href = LOGIN_PAGE;
    });
  }

  // --- POPUP LOGIC ---
  const btnSettingsToggle = document.getElementById('btnSettingsToggle');
  const settingsPopup = document.getElementById('settingsPopup');
  const settingsLogoutBtn = document.getElementById('settingsLogoutBtn');
  const btnNotifToggle = document.getElementById('btnNotifToggle');
  const notifPopup = document.getElementById('notifPopup');
  const settingsItemNotif = document.getElementById('settingsItemNotif');

  function closeAllPopups() {
    if (settingsPopup) settingsPopup.classList.remove('show');
    if (notifPopup) notifPopup.classList.remove('show');
    const filterPopup = document.getElementById('filterPopup');
    if (filterPopup) filterPopup.classList.remove('show');
  }

  if (btnSettingsToggle && settingsPopup) {
    btnSettingsToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      const isShowing = settingsPopup.classList.contains('show');
      closeAllPopups();
      if (!isShowing) settingsPopup.classList.add('show');
    });
  }

  if (settingsPopup) {
    settingsPopup.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }

  window.addEventListener('click', function() {
    closeAllPopups();
  });

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

  if (settingsLogoutBtn) {
    settingsLogoutBtn.addEventListener('click', function() {
      ['auth_token', 'user_name', 'user_email'].forEach(function(key) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      sessionStorage.removeItem('selectedCustomer');
      window.location.href = LOGIN_PAGE;
    });
  }

  // User photo
  const userPhoto = localStorage.getItem('user_photo');
  if (userPhoto) {
    const avatars = document.querySelectorAll('.user-avatar');
    avatars.forEach(function(av) {
      av.innerHTML = "<img src='" + userPhoto + "' style='width:100%; height:100%; border-radius:50%; object-fit:cover;'>";
    });
  }

  // ==========================================
  // BACKEND INTEGRATION LOGIC
  // ==========================================

  function getOrderData() {
    const raw = sessionStorage.getItem('selectedCustomer');
    let customer = {};
    try { if (raw) customer = JSON.parse(raw); } catch (e) {}
    
    const products = [];
    document.querySelectorAll('.product-item').forEach(function(item) {
      if (item.style.display === 'none') return;
      const qty = parseInt(item.querySelector('.input-qty').value) || 0;
      if (qty > 0) {
        products.push({
          name: item.querySelector('h4').textContent.trim(),
          sku: item.querySelector('.sku').textContent.trim(),
          price: parseInt(item.getAttribute('data-price')) || 0,
          quantity: qty,
          subtotal: (parseInt(item.getAttribute('data-price')) || 0) * qty
        });
      }
    });
    
    return {
      customer: customer,
      products: products,
      subtotal: document.getElementById('valSubtotal').textContent.trim(),
      discount: document.getElementById('valDiscount').textContent.trim(),
      ppn: document.getElementById('valPpn').textContent.trim(),
      grandTotal: document.getElementById('valGrandTotal').textContent.trim()
    };
  }

  // Button Proses & Validasi SO
  const btnProsesSO = document.getElementById('btnProsesSO');
  if (btnProsesSO) {
    btnProsesSO.addEventListener('click', async function() {
      const orderData = getOrderData();
      if (orderData.products.length === 0) {
        showToast("Mohon pilih minimal 1 produk", "#ef4444");
        return;
      }
      
      btnProsesSO.disabled = true;
      btnProsesSO.textContent = "Memproses...";
      
      try {
        // Cek apakah perusahaan ini sudah pernah melakukan pemesanan sebelumnya
        const qCek = query(collection(db, "sales_orders"));
        const recentDocs = await getDocs(qCek);
        let hasOrdered = false;
        recentDocs.forEach(doc => {
            const d = doc.data();
            if (d.customer?.id === orderData.customer?.id) {
                hasOrdered = true;
            }
        });

        if (hasOrdered) {
            showToast("Perusahaan ini sudah pernah membuat pesanan! 1 Perusahaan maksimal 1 Pesanan.", "#ef4444");
            btnProsesSO.disabled = false;
            btnProsesSO.textContent = "Proses & Validasi SO";
            return;
        }

        const now = new Date();
        const soNumber = 'SO-' + now.getFullYear().toString().slice(2) + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + String(Math.floor(Math.random()*900)+100);

        await addDoc(collection(db, "sales_orders"), {
          soNumber: soNumber,
          customer: orderData.customer,
          products: orderData.products,
          subtotal: orderData.subtotal,
          discount: orderData.discount,
          ppn: orderData.ppn,
          grandTotal: orderData.grandTotal,
          status: 'processed',
          createdAt: serverTimestamp()
        });
        
        // Also create a notification for processed SO
        const custName = orderData.customer.nama || "Pelanggan";
        await addDoc(collection(db, "notifications"), {
          title: "Sales Order Divalidasi",
          message: "Pesanan untuk " + custName + " telah diproses & divalidasi.",
          type: "processed",
          isRead: false,
          createdAt: serverTimestamp()
        });
        
        showToast("Sales Order berhasil divalidasi!", "#22c55e");

        // Clear cart
        document.querySelectorAll('.input-qty').forEach(function(input) {
            input.value = 0;
        });
        updateOrderSummary();

      } catch (err) {
        console.error("Error saving SO:", err);
        showToast("Gagal memproses Sales Order", "#ef4444");
      } finally {
        btnProsesSO.disabled = false;
        btnProsesSO.textContent = "Proses & Validasi SO";
      }
    });
  }

  // Button Simpan Draft
  const btnDraftSO = document.getElementById('btnDraftSO');
  if (btnDraftSO) {
    btnDraftSO.addEventListener('click', async function() {
      const orderData = getOrderData();
      
      btnDraftSO.disabled = true;
      btnDraftSO.textContent = "Menyimpan...";
      
      try {
        const now = new Date();
        const soNumber = 'SO-' + now.getFullYear().toString().slice(2) + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + String(Math.floor(Math.random()*900)+100);

        await addDoc(collection(db, "sales_orders"), {
          soNumber: soNumber,
          customer: orderData.customer,
          products: orderData.products,
          subtotal: orderData.subtotal,
          discount: orderData.discount,
          ppn: orderData.ppn,
          grandTotal: orderData.grandTotal,
          status: 'draft',
          createdAt: serverTimestamp()
        });
        
        // Generate notification
        const custName = orderData.customer.nama || "Pelanggan";
        await addDoc(collection(db, "notifications"), {
          title: "Draft Pesanan Disimpan",
          message: "Draft pesanan untuk " + custName + " berhasil disimpan.",
          type: "draft",
          isRead: false,
          createdAt: serverTimestamp()
        });
        
        showToast("Draft berhasil disimpan", "#3b82f6");
      } catch (err) {
        console.error("Error saving draft:", err);
        showToast("Gagal menyimpan draft", "#ef4444");
      } finally {
        btnDraftSO.disabled = false;
        btnDraftSO.textContent = "Simpan Draft";
      }
    });
  }

  // Button PDF — Generate Invoice/Receipt Style
  const btnDownloadPDF = document.getElementById('btnDownloadPDF');
  if (btnDownloadPDF) {
    btnDownloadPDF.addEventListener('click', function() {
      const orderData = getOrderData();
      if (orderData.products.length === 0) {
        showToast("Tidak ada produk untuk dicetak", "#ef4444");
        return;
      }
      
      const cust = orderData.customer;
      const custName = cust.nama || 'Unknown';
      const now = new Date();
      const tanggal = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const soNumber = 'SO-' + now.getFullYear().toString().slice(2) + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + String(Math.floor(Math.random()*900)+100);

      // Build product rows
      let productRows = '';
      let no = 1;
      orderData.products.forEach(function(p) {
        productRows += '<tr>' +
          '<td style="padding:10px 12px; border-bottom:1px solid #e5e7eb; text-align:center; color:#374151;">' + no + '</td>' +
          '<td style="padding:10px 12px; border-bottom:1px solid #e5e7eb;"><strong style="color:#111827;">' + p.name + '</strong><br><span style="font-size:11px; color:#6b7280;">' + p.sku + '</span></td>' +
          '<td style="padding:10px 12px; border-bottom:1px solid #e5e7eb; text-align:right; color:#374151;">' + formatRupiah(p.price) + '</td>' +
          '<td style="padding:10px 12px; border-bottom:1px solid #e5e7eb; text-align:center; color:#374151;">' + p.quantity + '</td>' +
          '<td style="padding:10px 12px; border-bottom:1px solid #e5e7eb; text-align:right; font-weight:600; color:#111827;">' + formatRupiah(p.subtotal) + '</td>' +
          '</tr>';
        no++;
      });
      
      const invoiceHTML = '' +
        '<div style="font-family: \'Segoe UI\', Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 0; color: #1f2937;">' +
        
        // Header
        '<div style="background: linear-gradient(135deg, #0A3A82, #1e5bb5); padding: 28px 32px; border-radius: 0; color: white;">' +
          '<div style="display: flex; justify-content: space-between; align-items: center;">' +
            '<div>' +
              '<h1 style="margin:0; font-size:26px; font-weight:800; letter-spacing:0.5px;">FoodSync</h1>' +
              '<p style="margin:4px 0 0; font-size:12px; opacity:0.85;">PT FoodSync Indonesia</p>' +
            '</div>' +
            '<div style="text-align:right;">' +
              '<h2 style="margin:0; font-size:20px; font-weight:700; letter-spacing:1px;">INVOICE</h2>' +
              '<p style="margin:4px 0 0; font-size:12px; opacity:0.85;">Sales Order</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
        
        // Info Bar
        '<div style="background:#f0f4ff; padding:16px 32px; display:flex; justify-content:space-between; border-bottom:2px solid #0A3A82;">' +
          '<div>' +
            '<span style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">No. Invoice</span><br>' +
            '<strong style="font-size:14px; color:#0A3A82;">' + soNumber + '</strong>' +
          '</div>' +
          '<div style="text-align:center;">' +
            '<span style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">Tanggal</span><br>' +
            '<strong style="font-size:14px; color:#0A3A82;">' + tanggal + '</strong>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<span style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">Jam</span><br>' +
            '<strong style="font-size:14px; color:#0A3A82;">' + jam + '</strong>' +
          '</div>' +
        '</div>' +
        
        // Customer Info
        '<div style="padding:20px 32px; display:flex; justify-content:space-between; border-bottom:1px solid #e5e7eb;">' +
          '<div>' +
            '<span style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">Ditagihkan Kepada</span>' +
            '<h3 style="margin:6px 0 2px; font-size:16px; color:#111827;">' + custName + '</h3>' +
            '<p style="margin:0; font-size:13px; color:#6b7280;">ID: ' + (cust.id || '-') + '</p>' +
            '<p style="margin:0; font-size:13px; color:#6b7280;">PIC: ' + (cust.pic || '-') + ' (' + (cust.telp || '-') + ')</p>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<span style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">Tier Pelanggan</span>' +
            '<div style="margin-top:6px; display:inline-block; background:#0A3A82; color:white; padding:4px 14px; border-radius:20px; font-size:13px; font-weight:600;">' + (cust.tier || '-') + ' Tier</div>' +
          '</div>' +
        '</div>' +
        
        // Product Table
        '<div style="padding:20px 32px;">' +
          '<table style="width:100%; border-collapse:collapse; font-size:13px;">' +
            '<thead>' +
              '<tr style="background:#0A3A82; color:white;">' +
                '<th style="padding:10px 12px; text-align:center; font-weight:600; border-radius:6px 0 0 0; width:40px;">No</th>' +
                '<th style="padding:10px 12px; text-align:left; font-weight:600;">Produk</th>' +
                '<th style="padding:10px 12px; text-align:right; font-weight:600;">Harga/Karton</th>' +
                '<th style="padding:10px 12px; text-align:center; font-weight:600; width:60px;">Qty</th>' +
                '<th style="padding:10px 12px; text-align:right; font-weight:600; border-radius:0 6px 0 0;">Subtotal</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + productRows + '</tbody>' +
          '</table>' +
        '</div>' +
        
        // Summary
        '<div style="padding:0 32px 20px;">' +
          '<div style="margin-left:auto; width:280px; border-top:2px solid #e5e7eb; padding-top:12px;">' +
            '<div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px; color:#374151;"><span>Subtotal</span><span>' + orderData.subtotal + '</span></div>' +
            '<div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px; color:#16a34a;"><span>Diskon Tier (5%)</span><span>' + orderData.discount + '</span></div>' +
            '<div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:13px; color:#374151;"><span>PPN (11%)</span><span>' + orderData.ppn + '</span></div>' +
            '<div style="display:flex; justify-content:space-between; padding:12px 0; border-top:2px solid #0A3A82; font-size:16px; font-weight:800; color:#0A3A82;"><span>TOTAL</span><span>' + orderData.grandTotal + '</span></div>' +
          '</div>' +
        '</div>' +
        
        // Footer
        '<div style="background:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb; text-align:center;">' +
          '<p style="margin:0; font-size:11px; color:#9ca3af;">Terima kasih atas pesanan Anda. Dokumen ini digenerate secara otomatis oleh sistem FoodSync ERP.</p>' +
          '<p style="margin:4px 0 0; font-size:11px; color:#9ca3af;">PT FoodSync Indonesia &bull; Jl. Industri Raya No. 88 &bull; Jakarta Timur 13920 &bull; (021) 1234-5678</p>' +
        '</div>' +
        
      '</div>';
      
      const container = document.createElement('div');
      container.innerHTML = invoiceHTML;
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      
      const opt = {
        margin:       0,
        filename:     'Invoice_' + soNumber + '_' + custName.replace(/\s+/g, '_') + '.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, width: 680 },
        jsPDF:        { unit: 'px', format: [680, 960], orientation: 'portrait' }
      };
      
      showToast("Membuat Invoice PDF...", "#3b82f6");
      html2pdf().set(opt).from(container.firstChild).save().then(function() {
        document.body.removeChild(container);
        showToast("Invoice PDF berhasil diunduh!", "#22c55e");
      });
    });
  }

  // Real-time Notifications from Firestore
  const notifList = document.getElementById('notifList');
  const notifBadge = document.getElementById('notifBadge');
  
  if (notifList) {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    onSnapshot(q, function(snapshot) {
      notifList.innerHTML = '';
      let unreadCount = 0;
      
      if (snapshot.empty) {
        notifList.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">Tidak ada notifikasi</div>';
        if (notifBadge) notifBadge.style.display = 'none';
        return;
      }
      
      snapshot.forEach(function(docSnap) {
        const data = docSnap.data();
        if (!data.isRead) unreadCount++;
        
        // Format time
        let timeString = "Baru saja";
        if (data.createdAt) {
          const date = data.createdAt.toDate();
          timeString = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        }
        
        // Determine icon and color based on type
        let icon = "bx-info-circle";
        let bgColor = "#E0E7FF";
        let fgColor = "#4F46E5";
        
        if (data.type === 'draft') {
          icon = "bx-file-blank";
          bgColor = "#FEF3C7";
          fgColor = "#D97706";
        } else if (data.type === 'processed') {
          icon = "bx-check-circle";
          bgColor = "#DCFCE7";
          fgColor = "#16A34A";
        }
        
        const notifDiv = document.createElement('div');
        notifDiv.className = 'notif-item';
        notifDiv.style.cursor = 'pointer';
        
        const iconDiv = document.createElement('div');
        iconDiv.className = 'notif-icon';
        iconDiv.style.backgroundColor = bgColor;
        iconDiv.style.color = fgColor;
        iconDiv.innerHTML = "<i class='bx " + icon + "'></i>";
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'notif-content';
        
        const h4 = document.createElement('h4');
        h4.textContent = data.title || 'Notifikasi';
        
        const p = document.createElement('p');
        p.textContent = data.message || '';
        
        const span = document.createElement('span');
        span.className = 'notif-time';
        span.textContent = timeString;
        
        contentDiv.appendChild(h4);
        contentDiv.appendChild(p);
        contentDiv.appendChild(span);
        
        notifDiv.appendChild(iconDiv);
        notifDiv.appendChild(contentDiv);
        
        if (!data.isRead) {
          const dot = document.createElement('div');
          dot.className = 'notif-unread-dot';
          notifDiv.appendChild(dot);
        }
        
        notifDiv.addEventListener('click', function() {
          const dot = notifDiv.querySelector('.notif-unread-dot');
          if (dot) dot.style.display = 'none';
        });
        
        notifList.appendChild(notifDiv);
      });
      
      if (notifBadge) {
        notifBadge.style.display = unreadCount > 0 ? 'block' : 'none';
      }
    });
  }

  const markAllBtn = document.querySelector('.notif-mark-read');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.notif-unread-dot').forEach(function(dot) { dot.style.display = 'none'; });
      if (notifBadge) notifBadge.style.display = 'none';
      showToast("Semua notifikasi ditandai dibaca", "#3b82f6");
    });
  }

});
