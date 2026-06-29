import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

function parseRupiahStr(str) {
    if (!str) return 0;
    const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
}

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
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
  document.getElementById('userNameDisplay').textContent = userName;
  document.getElementById('greetingText').textContent = `Selamat Datang, ${userName}`;

  const userPhoto = localStorage.getItem('user_photo');
  if (userPhoto) {
    const avatars = document.querySelectorAll('.user-avatar');
    avatars.forEach(av => {
      av.innerHTML = "<img src='" + userPhoto + "' style='width:100%; height:100%; border-radius:50%; object-fit:cover;'>";
    });
  }

  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date().toLocaleDateString('id-ID', dateOptions);
  document.getElementById('currentDate').textContent = today;

  let myChart = null;

  function renderChartAndStats(orders) {
      let totalIncome = 0;
      let totalKarton = 0;
      
      let variantCount = {
          "Indomie Goreng": 0,
          "Indomie Soto": 0,
          "Indomie Kari Ayam": 0
      };

      let monthlyData = {
          "Indomie Goreng": [0,0,0,0,0,0,0,0,0,0,0,0],
          "Indomie Soto": [0,0,0,0,0,0,0,0,0,0,0,0],
          "Indomie Kari Ayam": [0,0,0,0,0,0,0,0,0,0,0,0]
      };

      orders.forEach(order => {
          totalIncome += parseRupiahStr(order.grandTotal);
          
          let dateObj = new Date();
          if (order.createdAt && typeof order.createdAt.toDate === 'function') {
              dateObj = order.createdAt.toDate();
          }
          const monthIdx = dateObj.getMonth();

          if (order.products && Array.isArray(order.products)) {
              order.products.forEach(p => {
                  const qty = parseInt(p.quantity) || 0;
                  totalKarton += qty;
                  
                  if (p.name.includes("Goreng")) {
                      variantCount["Indomie Goreng"] += qty;
                      monthlyData["Indomie Goreng"][monthIdx] += qty;
                  } else if (p.name.includes("Soto")) {
                      variantCount["Indomie Soto"] += qty;
                      monthlyData["Indomie Soto"][monthIdx] += qty;
                  } else if (p.name.includes("Kari")) {
                      variantCount["Indomie Kari Ayam"] += qty;
                      monthlyData["Indomie Kari Ayam"][monthIdx] += qty;
                  }
              });
          }
      });

      document.getElementById('totalIncomeDisplay').textContent = formatRupiah(totalIncome);
      document.getElementById('totalKartonDisplay').textContent = new Intl.NumberFormat('id-ID').format(totalKarton);
      document.getElementById('kartonGrowthDisplay').style.display = 'none';
      
      let totalVariants = variantCount["Indomie Goreng"] + variantCount["Indomie Soto"] + variantCount["Indomie Kari Ayam"];
      if (totalVariants === 0) totalVariants = 1;

      const pctGoreng = Math.round((variantCount["Indomie Goreng"] / totalVariants) * 100);
      const pctSoto = Math.round((variantCount["Indomie Soto"] / totalVariants) * 100);
      const pctKari = Math.round((variantCount["Indomie Kari Ayam"] / totalVariants) * 100);

      document.getElementById('qtyGoreng').textContent = variantCount["Indomie Goreng"];
      document.getElementById('qtySoto').textContent = variantCount["Indomie Soto"];
      document.getElementById('qtyKari').textContent = variantCount["Indomie Kari Ayam"];

      document.getElementById('pctGoreng').textContent = pctGoreng + "%";
      document.getElementById('pctSoto').textContent = pctSoto + "%";
      document.getElementById('pctKari').textContent = pctKari + "%";

      const curMonth = new Date().getMonth();
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].slice(0, curMonth + 1);
      
      const dsGoreng = monthlyData["Indomie Goreng"].slice(0, curMonth + 1);
      const dsSoto = monthlyData["Indomie Soto"].slice(0, curMonth + 1);
      const dsKari = monthlyData["Indomie Kari Ayam"].slice(0, curMonth + 1);

      if (myChart) {
          myChart.destroy();
      }

      const ctx = document.getElementById('revenueChart').getContext('2d');
      myChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Mie Soto',
              data: dsSoto,
              backgroundColor: '#10B981',
              borderRadius: 6,
              barPercentage: 0.6,
              categoryPercentage: 0.8
            },
            {
              label: 'Mie Goreng',
              data: dsGoreng,
              backgroundColor: '#003F8A',
              borderRadius: 6,
              barPercentage: 0.6,
              categoryPercentage: 0.8
            },
            {
              label: 'Mie Kari Ayam',
              data: dsKari,
              backgroundColor: '#FF4500',
              borderRadius: 6,
              barPercentage: 0.6,
              categoryPercentage: 0.8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              align: 'start',
              labels: { usePointStyle: true, boxWidth: 8, font: { family: "'DM Sans', sans-serif", weight: '600' } }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                font: { family: "'DM Sans', sans-serif", weight: '600' }
              },
              grid: { borderDash: [4, 4], color: '#E5E7EB' },
              border: { display: false }
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: "'DM Sans', sans-serif", weight: '600' } },
              border: { display: false }
            }
          }
        }
      });
  }

  const qOrders = collection(db, "sales_orders");
  onSnapshot(qOrders, (snapshot) => {
      const orders = [];
      snapshot.forEach(doc => {
          orders.push({ id: doc.id, ...doc.data() });
      });
      renderChartAndStats(orders);
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