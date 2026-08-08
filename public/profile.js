// ============================================================================
// VieGeo - profile.js (Supabase/localStorage Integration)
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
const security = window.VieGeoSecurity || {
    sanitizeText: (value, max = 2000) => String(value || '').replace(/<[^>]*>/g, '').trim().slice(0, max),
    rateLimit: () => ({ allowed: true, retryAfterMs: 0 })
};
const cleanText = (value, max = 2000) => security.sanitizeText(value, max);
function getAuthClient() {
    const client = window.supabaseClient || window.supabase;
    return client && client.auth && typeof client.auth.updateUser === 'function' ? client : null;
}

// 1. Kiểm tra session
const sessionData = localStorage.getItem('lm_session');
if (!sessionData) {
    window.location.href = '/loginout';
}

const sessionUser = JSON.parse(sessionData);

// Load Game State
function getGameState() {
    let state = localStorage.getItem('VieGeo_state');
    if (!state) return null;
    return JSON.parse(state);
}
const gameState = getGameState();

// 2. Tải thông tin hồ sơ
async function loadProfile() {
    try {
        const userDoc = await db.collection('users').doc(sessionUser.email).get();
        // A newly created Supabase account may not have a profile row yet.
        // Keep the complete profile UI usable from the authenticated local
        // session while the synchronizer creates or reloads that row.
        const currentUser = userDoc.exists ? userDoc.data() : {
            email: sessionUser.email || '',
            name: sessionUser.name || sessionUser.displayName || 'Người chơi',
            phone: sessionUser.phone || '',
            gender: sessionUser.gender || '',
            role: sessionUser.role || 'user'
        };
        
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
        profGender.value = currentUser.gender || '';
        
        // Lưu data hiện tại
        window.currentUserData = currentUser;
        
    } catch (err) {
        console.error("Lỗi tải profile:", err);
    }
}

loadProfile();

// 3. Cập nhật thông tin (Tên, SĐT, Mật khẩu)
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newName = cleanText(profName.value, 120);
        const newPhone = cleanText(profPhone.value, 32);
        const newGender = ['male', 'female', 'other', 'prefer_not_to_say'].includes(String(profGender.value || '').toLowerCase()) ? String(profGender.value).toLowerCase() : '';
        const inputOldPass = oldPass.value;
        const inputNewPass = newPass.value;
        
        const updateData = {
            name: newName,
            phone: newPhone,
            gender: newGender
        };
        
        // Logic đổi mật khẩu
        if (inputOldPass || inputNewPass) {
            if (!inputOldPass || !inputNewPass) {
                Swal.fire({ icon: 'warning', title: 'Lưu ý', text: 'Vui lòng nhập cả mật khẩu cũ và mật khẩu mới để đổi mật khẩu!' });
                return;
            }
            if (window.currentUserData.password && inputOldPass !== window.currentUserData.password) {
                Swal.fire({ icon: 'error', title: 'Đã xảy ra lỗi', text: 'Mật khẩu cũ không chính xác!' });
                return;
            }
            if (inputNewPass.length < 8 || inputNewPass.length > 128) {
                Swal.fire({ icon: 'warning', title: 'Lưu ý', text: 'Mật khẩu mới phải từ 6 ký tự trở lên.' });
                return;
            }
            const authClient = getAuthClient();
            if (!authClient) {
                Swal.fire({ icon: 'warning', title: 'Chưa thể đổi mật khẩu', text: 'Supabase Auth chưa sẵn sàng. Vui lòng đăng nhập lại rồi thử tiếp.' });
                return;
            }
            const { error } = await authClient.auth.updateUser({ password: inputNewPass });
            if (error) throw error;
            updateData.password = null;
            updateData.passwordUpdatedAt = new Date().toISOString();
        }

        try {
            const btn = profileForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = "Đang lưu...";
            
            await db.collection('users').doc(sessionUser.email).update(updateData);
            
            // Cập nhật session nếu đổi tên
            localStorage.setItem('lm_session', JSON.stringify({ ...sessionUser, name: newName, gender: newGender }));
            
            Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã lưu thông tin thành công!' });
            
            oldPass.value = '';
            newPass.value = '';
            
            btn.disabled = false;
            btn.textContent = "Lưu Thay Đổi";
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            Swal.fire({ icon: 'error', title: 'Đã xảy ra lỗi', text: 'Lỗi khi lưu thông tin. Thử lại sau.' });
        }
    });
}

// Yêu cầu Premium
if (btnPremium) {
    btnPremium.addEventListener('click', async () => {
        btnPremium.disabled = true;
        btnPremium.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
        
        try {
            const limit = security.rateLimit(`premium_${sessionUser.email}`, { limit: 3, windowMs: 10 * 60 * 1000 });
            if (!limit.allowed) throw new Error(`Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ${Math.ceil(limit.retryAfterMs / 1000)}s.`);
            await db.collection('premium_requests').add({
                email: sessionUser.email,
                name: cleanText(sessionUser.name, 120),
                status: 'pending',
                created_at: new Date().toISOString()
            });
            Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã gửi yêu cầu Mua Premium đến quản trị viên. Vui lòng chờ hệ thống xác nhận!' });
            btnPremium.innerHTML = '<i class="fa-solid fa-check"></i> Đã gửi yêu cầu';
        } catch (error) {
            console.error("Lỗi premium:", error);
            Swal.fire({ icon: 'error', title: 'Đã xảy ra lỗi', text: 'Lỗi khi gửi yêu cầu.' });
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
        window.location.href = '/loginout';
    });
}
