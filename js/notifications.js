import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, limit, updateDoc, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", () => {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(5));
    let unreadDocs = [];

    onSnapshot(q, (snapshot) => {
        const notifList = document.querySelector('.notif-list');
        const btnNotifToggle = document.getElementById('btnNotifToggle');
        
        if (!notifList) return;
        
        notifList.innerHTML = '';
        unreadDocs = [];
        let unreadCount = 0;

        snapshot.forEach(d => {
            const data = d.data();
            const isRead = data.isRead || false;
            if (!isRead) {
                unreadCount++;
                unreadDocs.push(d.id);
            }

            // Default icon and color
            let iconClass = "bx-info-circle";
            let bgColor = "#E0E7FF";
            let iconColor = "#4F46E5";

            if (data.type === 'sales' || data.type === 'draft') {
                iconClass = "bx-shopping-bag";
            } else if (data.type === 'promo') {
                iconClass = "bx-purchase-tag";
                bgColor = "#F3E8FF";
                iconColor = "#9333EA";
            } else if (data.type === 'kampanye') {
                iconClass = "bx-speaker";
                bgColor = "#DCFCE7";
                iconColor = "#16A34A";
            } else if (data.type === 'pelanggan') {
                iconClass = "bx-user-plus";
                bgColor = "#FFEDD5";
                iconColor = "#EA580C";
            }

            // Calculate time ago
            let timeStr = "Baru saja";
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                const diffMs = new Date() - data.createdAt.toDate();
                const diffMins = Math.floor(diffMs / 60000);
                if (diffMins > 0 && diffMins < 60) timeStr = `${diffMins} menit yang lalu`;
                else if (diffMins >= 60 && diffMins < 1440) timeStr = `${Math.floor(diffMins/60)} jam yang lalu`;
                else if (diffMins >= 1440) timeStr = `${Math.floor(diffMins/1440)} hari yang lalu`;
            }

            const notifItem = document.createElement('div');
            notifItem.className = 'notif-item';
            notifItem.style.cursor = 'pointer';
            if (isRead) notifItem.style.opacity = '0.7';

            notifItem.innerHTML = `
              <div class="notif-icon" style="background-color: ${bgColor}; color: ${iconColor};">
                <i class='bx ${iconClass}'></i>
              </div>
              <div class="notif-content">
                <h4>${data.title}</h4>
                <p>${data.message}</p>
                <span class="notif-time">${timeStr}</span>
              </div>
              ${!isRead ? '<div class="notif-unread-dot"></div>' : ''}
            `;

            // Mark single as read on click
            notifItem.addEventListener('click', async () => {
                if (!isRead) {
                    await updateDoc(doc(db, "notifications", d.id), { isRead: true });
                }
            });

            notifList.appendChild(notifItem);
        });

        // Update bell icon
        if (btnNotifToggle) {
            let badge = btnNotifToggle.querySelector('.notif-badge');
            if (unreadCount > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'notif-badge';
                    badge.style.position = 'absolute';
                    badge.style.top = '4px';
                    badge.style.right = '4px';
                    badge.style.width = '8px';
                    badge.style.height = '8px';
                    badge.style.backgroundColor = '#ef4444';
                    badge.style.borderRadius = '50%';
                    btnNotifToggle.style.position = 'relative';
                    btnNotifToggle.appendChild(badge);
                }
            } else if (badge) {
                badge.remove();
            }
        }
    }, (err) => {
        console.error("Notif error:", err);
    });

    const markAllBtn = document.querySelector('.notif-mark-read');
    if (markAllBtn) {
        // Clone and replace to remove existing event listeners from other scripts
        const newMarkAllBtn = markAllBtn.cloneNode(true);
        markAllBtn.parentNode.replaceChild(newMarkAllBtn, markAllBtn);

        newMarkAllBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (unreadDocs.length === 0) return;
            const batch = writeBatch(db);
            unreadDocs.forEach(id => {
                batch.update(doc(db, "notifications", id), { isRead: true });
            });
            await batch.commit();
        });
    }
});
