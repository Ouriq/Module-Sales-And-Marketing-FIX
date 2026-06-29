import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDL36048RpIK_-_vyg0s_92pWRjM91mhKA",
  authDomain: "sistem-erp-food-sync.firebaseapp.com",
  projectId: "sistem-erp-food-sync",
  storageBucket: "sistem-erp-food-sync.firebasestorage.app",
  messagingSenderId: "9152919413",
  appId: "1:9152919413:web:4ad7cf28f57ef83d23453c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const LOGIN_PAGE = 'signin.html';

// Toast helper
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

// Helper untuk kompres gambar ke Base64 (maks 300x300)
function compressImageToBase64(file, maxWidth = 300, maxHeight = 300) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height *= maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width *= maxHeight / height));
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Kualitas 70% JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

document.addEventListener("DOMContentLoaded", () => {
    // Hidden input for Photo Upload
    const photoInput = document.createElement('input');
    photoInput.type = 'file';
    photoInput.accept = 'image/*';
    photoInput.style.display = 'none';
    document.body.appendChild(photoInput);

    // --- FIREBASE AUTH LISTENER ---
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in.
        document.getElementById('displayProfileName').textContent = user.displayName || 'Loading...';
        document.getElementById('editProfileName').value = user.displayName || '';
        document.getElementById('displayProfileEmail').textContent = user.email || '';
        document.getElementById('editProfileEmail').value = user.email || '';
        
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay) userNameDisplay.textContent = user.displayName || user.email.split('@')[0];

        // Tampilkan foto profil jika ada
        const userAvatars = document.querySelectorAll('.user-avatar');
        const bigAvatars = document.querySelectorAll('.big-avatar');
        if (user.photoURL) {
          userAvatars.forEach(av => av.innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`);
          bigAvatars.forEach(av => av.style.backgroundImage = `url('${user.photoURL}')`);
        }

        // Fetch additional info from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            document.getElementById('displayProfileName').textContent = data.fullName || user.displayName || '-';
            document.getElementById('editProfileName').value = data.fullName || user.displayName || '';

            document.getElementById('displayProfilePhone').textContent = data.phone || '-';
            document.getElementById('editProfilePhone').value = data.phone || '';

            document.getElementById('displayProfileDept').textContent = data.department || '-';
            document.getElementById('editProfileDept').value = data.department || '';

            document.getElementById('displayProfileRole').textContent = data.role || '-';
            document.getElementById('editProfileRole').value = data.role || '';
            
            if (userNameDisplay) userNameDisplay.textContent = data.fullName || user.displayName;

            if (data.photoURL) {
              localStorage.setItem('user_photo', data.photoURL);
              userAvatars.forEach(av => av.innerHTML = `<img src="${data.photoURL}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`);
              bigAvatars.forEach(av => av.style.backgroundImage = `url('${data.photoURL}')`);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        // No user is signed in. Redirect to login page.
        window.location.href = LOGIN_PAGE;
      }
    });

    // UBAH FOTO LOGIC (MENGGUNAKAN BASE64 FIRESTORE)
    const changePhotoBtns = document.querySelectorAll('.btn-change-photo');
    changePhotoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        photoInput.click();
      });
    });

    photoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const user = auth.currentUser;
      if (!user) return;

      showToast('MEMPROSES FOTO...', '#3b82f6'); // Blue color for loading

      try {
        // Kompres gambar menjadi Base64 yang ukurannya kecil
        const base64Image = await compressImageToBase64(file);

        // Update Firestore dengan gambar Base64
        await setDoc(doc(db, 'users', user.uid), { photoURL: base64Image }, { merge: true });

        // Simpan ke localStorage agar bisa diakses halaman lain
        localStorage.setItem('user_photo', base64Image);

        // Update UI
        const userAvatars = document.querySelectorAll('.user-avatar');
        const bigAvatars = document.querySelectorAll('.big-avatar');
        userAvatars.forEach(av => av.innerHTML = `<img src="${base64Image}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`);
        bigAvatars.forEach(av => av.style.backgroundImage = `url('${base64Image}')`);

        showToast('✅ Foto profil berhasil diubah!');
      } catch (error) {
        console.error("Error updating photo:", error);
        showToast('❌ Gagal memperbarui foto.', '#ef4444');
      }
      photoInput.value = ''; // reset
    });

    // FITUR LOGOUT 
    const handleLogout = async () => {
      try {
        await signOut(auth);
        ['auth_token', 'user_name', 'user_email', 'user_role'].forEach((key) => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        window.location.href = LOGIN_PAGE;
      } catch (error) {
        console.error("Logout Error:", error);
      }
    };

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const settingsLogoutBtn = document.getElementById('settingsLogoutBtn');
    if (settingsLogoutBtn) settingsLogoutBtn.addEventListener('click', handleLogout);

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

    // --- LOGIKA EDIT PROFIL ---
    const btnEditProfile = document.getElementById('btnEditProfile');
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    const btnSaveProfile = document.getElementById('btnSaveProfile');
    
    const profileDisplayView = document.getElementById('profileDisplayView');
    const profileEditView = document.getElementById('profileEditView');
    
    if (btnEditProfile) {
      btnEditProfile.addEventListener('click', () => {
        profileDisplayView.style.display = 'none';
        profileEditView.style.display = 'block';
      });
    }
    
    if (btnCancelEdit) {
      btnCancelEdit.addEventListener('click', () => {
        profileEditView.style.display = 'none';
        profileDisplayView.style.display = 'block';
      });
    }
    
    if (btnSaveProfile) {
      btnSaveProfile.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;

        // Ambil nilai dari input
        const newName = document.getElementById('editProfileName').value;
        const newPhone = document.getElementById('editProfilePhone').value;
        const newDept = document.getElementById('editProfileDept').value;
        const newRole = document.getElementById('editProfileRole').value;
        
        btnSaveProfile.disabled = true;
        btnSaveProfile.textContent = 'Menyimpan...';

        try {
          // Update profile in Auth
          await updateProfile(user, { displayName: newName });

          // Update profile in Firestore (gunakan setDoc dengan merge:true agar tidak error jika dokumen belum ada)
          await setDoc(doc(db, 'users', user.uid), {
            fullName: newName,
            phone: newPhone,
            department: newDept,
            role: newRole
          }, { merge: true });

          // Update teks di tampilan display
          document.getElementById('displayProfileName').textContent = newName;
          document.getElementById('displayProfilePhone').textContent = newPhone;
          document.getElementById('displayProfileDept').textContent = newDept;
          document.getElementById('displayProfileRole').textContent = newRole;
          
          // Update nama user di topbar
          const userNameDisplay = document.getElementById('userNameDisplay');
          if (userNameDisplay) userNameDisplay.textContent = newName;
          
          // Simpan nama ke localStorage agar bertahan antar halaman
          localStorage.setItem('user_name', newName);
          localStorage.setItem('user_role', newRole);
          
          showToast('✅ Profil berhasil diperbarui!');

          // Kembali ke mode display
          profileEditView.style.display = 'none';
          profileDisplayView.style.display = 'block';
        } catch (error) {
          console.error("Error updating profile:", error);
          showToast('❌ Gagal memperbarui profil.', '#ef4444');
        } finally {
          btnSaveProfile.disabled = false;
          btnSaveProfile.textContent = 'Simpan Perubahan';
        }
      });
    }
});
