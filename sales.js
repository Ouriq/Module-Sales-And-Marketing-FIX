const LOGIN_PAGE = 'index.html';

function isLoggedIn() {
  return !!(
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('user_name') ||
    sessionStorage.getItem('user_name')
  );
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
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '—';

    banner.querySelector('.avatar-circle').textContent = initials;
    banner.querySelector('.customer-details h4').textContent = customer.nama || '—';
    banner.querySelector('.customer-details p').innerHTML =
      `ID: ${customer.id || '—'} <span class="divider-dot">•</span> ${customer.pic || '—'} (${customer.telp || '—'})`;
    banner.querySelector('.tier-badge').textContent =
      `${customer.tier || '—'} Tier`;
  } catch {
    /* abaikan data rusak */
  }
}

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

    applySelectedCustomer();
  
    // 2. Fungsi Format Uang (IDR)
    const formatRupiah = (angka) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(angka).replace('Rp', 'Rp ');
    };
  
    // 3. Logika Kalkulator Sales Order
    const updateOrderSummary = () => {
      let subtotal = 0;
      let totalItems = 0;
      const discountRate = 0.05; // 5% Platinum Tier
      const ppnRate = 0.11;      // 11% PPN
  
      // Loop semua produk untuk menghitung subtotal
      document.querySelectorAll('.product-item').forEach(item => {
        const price = parseInt(item.getAttribute('data-price'));
        const qtyInput = item.querySelector('.input-qty');
        const qty = parseInt(qtyInput.value);
        
        // Update Subtotal per baris
        const itemSubtotal = price * qty;
        item.querySelector('.prod-subtotal').textContent = formatRupiah(itemSubtotal);
        
        subtotal += itemSubtotal;
        totalItems += 1;
      });
  
      // Hitung Ringkasan
      const discountAmount = subtotal * discountRate;
      const ppnAmount = (subtotal - discountAmount) * ppnRate;
      const grandTotal = subtotal - discountAmount + ppnAmount;
  
      // Update DOM Text
      document.getElementById('labelItemCount').textContent = `Subtotal (${totalItems} Item)`;
      document.getElementById('valSubtotal').textContent = formatRupiah(subtotal);
      document.getElementById('valDiscount').textContent = "-" + formatRupiah(discountAmount);
      document.getElementById('valPpn').textContent = formatRupiah(ppnAmount);
      
      // Total Pembayaran menggunakan Format teks kustom sesuai Mockup (RP x.xxx.xxx)
      const grandTotalFormatted = formatRupiah(grandTotal).replace('Rp', 'RP');
      document.getElementById('valGrandTotal').textContent = grandTotalFormatted;
    };
  
    // 4. Event Listener untuk Tombol + dan - di Kuantitas
    document.querySelectorAll('.qty-stepper').forEach(stepper => {
      const btnMin = stepper.querySelector('.btn-min');
      const btnPlus = stepper.querySelector('.btn-plus');
      const input = stepper.querySelector('.input-qty');
  
      btnMin.addEventListener('click', () => {
        let currentValue = parseInt(input.value);
        if (currentValue > 1) {
          input.value = currentValue - 1;
          updateOrderSummary(); // Hitung ulang harga
        }
      });
  
      btnPlus.addEventListener('click', () => {
        let currentValue = parseInt(input.value);
        input.value = currentValue + 1;
        updateOrderSummary(); // Hitung ulang harga
      });
    });
  
    // Panggil sekali saat load untuk memastikan angka sudah benar
    updateOrderSummary();
  
    // 5. Fitur Logout 
    document.getElementById('logoutBtn').addEventListener('click', () => {
      ['auth_token', 'user_name', 'user_email'].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      sessionStorage.removeItem('selectedCustomer');
      window.location.href = LOGIN_PAGE;
    });
  });