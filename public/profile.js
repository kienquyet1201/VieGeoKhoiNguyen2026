// ============================================================================
// VieGeo - profile.js (Firebase Integration)
// ============================================================================

const profileForm = document.getElementById('profileForm');
const btnLogout = document.getElementById('btnLogout');
const btnPremium = document.getElementById('btnPremium'); // Nút Mua Premium mới

// Các field hiển thị
const dispName = document.getElementById('dispName');
const dispEmail = document.getElementById('dispEmail');
const profStreak = document.getElementById('profStreak');
const profXp = document.getElementById('profXp');
const profStyle = document.getElementById('profStyle');

// Các field nhập liệu
const profName = document.getElementById('profName');
const profPhone = document.getElementById('profPhone');
const oldPass = document.getElementById('oldPass');
const newPass = document.getElementById('newPass');

// 1. Kiểm tra session
const sessionData = localStorage.getItem('lm_session');
if (!sessionData) {
    window.location.href = 'loginout.html';
}

const sessionUser = JSON.parse(sessionData);

// Load Game State
function getGameState() {
    let state = localStorage.getItem('VieGeo_state');
    if (!state) return null;
    return JSON.parse(state);
}
const gameState = getGameState();

// 2. Tải thông tin từ Firebase
async function loadFirebaseProfile() {
    try {
        const userDoc = await db.collection('users').doc(sessionUser.email).get();
        if (!userDoc.exists) {
            localStorage.removeItem('lm_session');
            window.location.href = 'loginout.html';
            return;
        }
        const currentUser = userDoc.data();
        
        dispName.textContent = currentUser.name;
        dispEmail.textContent = currentUser.email;

        profStreak.textContent = gameState ? (gameState.streak || 0) : 0;
        profXp.textContent = gameState ? (gameState.xp || 0) : 0;
        
        let evalText = "Chưa test";
        if (gameState && gameState.assessmentScore !== undefined) {
            if (gameState.assessmentScore <= 4) evalText = "Chưa có kiến thức";
            else if (gameState.assessmentScore <= 8) evalText = "Kiến thức cơ bản";
            else evalText = "Hiểu biết thâm sâu";
        }
        profStyle.textContent = evalText;

        profName.value = currentUser.name || '';
        profPhone.value = currentUser.phone || '';
        
        // Lưu data hiện tại
        window.currentUserData = currentUser;
        
    } catch (err) {
        console.error("Lỗi tải profile:", err);
    }
}

loadFirebaseProfile();

// 3. Cập nhật thông tin (Tên, SĐT, Mật khẩu)
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newName = profName.value.trim();
        const newPhone = profPhone.value.trim();
        const inputOldPass = oldPass.value;
        const inputNewPass = newPass.value;
        
        const updateData = {
            name: newName,
            phone: newPhone
        };
        
        // Logic đổi mật khẩu
        if (inputOldPass || inputNewPass) {
            if (!inputOldPass || !inputNewPass) {
                VieGeoUI.warning("Vui lòng nhập cả mật khẩu cũ và mật khẩu mới để đổi mật khẩu!");
                return;
            }
            if (inputOldPass !== window.currentUserData.password) {
                VieGeoUI.error("Mật khẩu cũ không chính xác!");
                return;
            }
            if (inputNewPass.length < 6) {
                VieGeoUI.warning("Mật khẩu mới phải từ 6 ký tự trở lên.");
                return;
            }
            updateData.password = inputNewPass;
        }

        try {
            const btn = profileForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = "Đang lưu...";
            
            await db.collection('users').doc(sessionUser.email).update(updateData);
            
            // Cập nhật session nếu đổi tên
            localStorage.setItem('lm_session', JSON.stringify({ email: sessionUser.email, name: newName }));
            
            VieGeoUI.success("Đã lưu thông tin thành công!");
            
            oldPass.value = '';
            newPass.value = '';
            
            btn.disabled = false;
            btn.textContent = "Lưu Thay Đổi";
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            VieGeoUI.error("Lỗi khi lưu thông tin. Thử lại sau.");
        }
    });
}

// Yêu cầu Premium
if (btnPremium) {
    btnPremium.addEventListener('click', async () => {
        btnPremium.disabled = true;
        btnPremium.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
        
        try {
            await db.collection('premium_requests').add({
                email: sessionUser.email,
                name: sessionUser.name,
                status: 'pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            VieGeoUI.success("Đã gửi yêu cầu Mua Premium đến quản trị viên. Vui lòng chờ hệ thống xác nhận!");
            btnPremium.innerHTML = '<i class="fa-solid fa-check"></i> Đã gửi yêu cầu';
        } catch (error) {
            console.error("Lỗi premium:", error);
            VieGeoUI.error("Lỗi khi gửi yêu cầu.");
            btnPremium.disabled = false;
            btnPremium.innerHTML = '<i class="fa-solid fa-crown"></i> Yêu cầu Mua Premium';
        }
    });
}

// 4. Đăng xuất (Fix lỗi rò rỉ dữ liệu)
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        // Xóa TOÀN BỘ dữ liệu local để tránh rò rỉ PvP sang acc khác
        localStorage.clear(); 
        window.location.href = 'loginout.html';
    });
}
