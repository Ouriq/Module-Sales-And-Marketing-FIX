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

document.addEventListener("DOMContentLoaded", () => {
  if (!isLoggedIn()) {
    window.location.href = LOGIN_PAGE;
    return;
  }

  // 1. Set Nama Pengguna dari Login
  const userName =
    localStorage.getItem('user_name') ||
    sessionStorage.getItem('user_name') ||
    'Pengguna';
  document.getElementById('userNameDisplay').textContent = userName;
  document.getElementById('greetingText').textContent = `Selamat Datang, ${userName}`;

  // 2. Format Tanggal Hari Ini
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date().toLocaleDateString('id-ID', dateOptions);
  document.getElementById('currentDate').textContent = today;

  // 3. Konfigurasi Bar Chart (Chart.js)
  const ctx = document.getElementById('revenueChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [
        {
          label: 'Mie Soto',
          data: [70, 50, 50, 75, 80],
          backgroundColor: '#10B981', // Hijau
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.8
        },
        {
          label: 'Mie Goreng',
          data: [85, 95, 55, 85, 88],
          backgroundColor: '#003F8A', // Biru
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.8
        },
        {
          label: 'Mie Kari Ayam',
          data: [70, 70, 70, 55, 75],
          backgroundColor: '#FF4500', // Orange/Merah
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
          max: 90,
          ticks: {
            callback: function(value) {
              if (value === 0) return '0';
              return value + 'jt'; // Format 40jt, 70jt, 90jt
            },
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

  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearAuth();
    window.location.href = LOGIN_PAGE;
  });
});