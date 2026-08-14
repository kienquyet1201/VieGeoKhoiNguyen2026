// ============================================================================
// VieGeo - loginout.js (Auth Logic with Supabase/localStorage)
// ============================================================================

const ROLE_DESTINATIONS = Object.freeze({
    user: '/map',
    parent: '/parent',
    cs: '/cs',
    admin: '/admin'
});
const ROOT_ADMIN_EMAIL = 'kienquyet1201@gmail.com';
const ROOT_ADMIN_PASSWORD_HASH = 'e1d9ebc55fd6baff0590282d9d7d5302047b7ab6ca817c6a47b30b791da3e282';
const ROOT_ADMIN_ROLES = ['admin', 'cs', 'parent', 'user'];
const MASTER_ADMIN_USERNAME = 'admin';
const MASTER_ADMIN_PROFILE_EMAIL = 'admin@viegeo.local';
const MASTER_ADMIN_PASSWORD_HASH = 'c1c224b03cd9bc7b6a86d77f5dace40191766c485cd55dc48caf9ac873335d6f';

function normalizeRole(role) {
    const aliases = { student: 'user', map: 'user', cskh: 'cs', support: 'cs' };
    const value = String(role || '').trim().toLowerCase();
    return aliases[value] || value;
}

function getUserRoles(user) {
    const source = [];
    const appendRoles = (value) => {
        if (!value) return;
        if (Array.isArray(value)) {
            value.forEach(appendRoles);
            return;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) return;
            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.includes(',')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(appendRoles);
                        return;
                    }
                } catch {}
                trimmed.split(',').forEach(appendRoles);
                return;
            }
            source.push(trimmed);
            return;
        }
        source.push(String(value));
    };
    const hasExplicitRoles = Boolean(user && Object.prototype.hasOwnProperty.call(user, 'roles'));
    appendRoles(user && user.roles);
    if (!hasExplicitRoles) {
        appendRoles(user && user.activeRole);
        appendRoles(user && user.active_role);
        appendRoles(user && user.role);
        if (user && (user.isAdmin || user.isSuperAdmin)) appendRoles('admin');
    }
    const roles = [...new Set(source.map(normalizeRole).filter((role) => Boolean(ROLE_DESTINATIONS[role])))];
    return roles.length ? roles : ['user'];
}

function destinationForRole(role) {
    return ROLE_DESTINATIONS[normalizeRole(role)] || ROLE_DESTINATIONS.user;
}

function toDayKey(value) {
    if (value === undefined || value === null || value === '') return '';
    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysBetween(dayA, dayB) {
    if (!dayA || !dayB) return NaN;
    const [yearA, monthA, dateA] = dayA.split('-').map(Number);
    const [yearB, monthB, dateB] = dayB.split('-').map(Number);
    return Math.round((Date.UTC(yearB, monthB - 1, dateB) - Date.UTC(yearA, monthA - 1, dateA)) / 86400000);
}

async function updateStreakOnLogin(email, userData) {
    // Opening the website never changes the streak. It is awarded only after
    // a completed lesson by recordStudyActivity in gamedata.js.
    const loginUpdate = { lastLoginAt: new Date().toISOString() };
    await db.collection('users').doc(email).set(loginUpdate, { merge: true });
    Object.assign(userData, loginUpdate);
    return loginUpdate;
}

const currentSession = localStorage.getItem('lm_session');
if (currentSession) {
    try {
        const savedSession = JSON.parse(currentSession);
        const savedRoles = getUserRoles(savedSession);
        const savedRole = normalizeRole(savedSession.activeRole || savedSession.role);
        const role = savedRoles.includes(savedRole) ? savedRole : savedRoles[0];
        window.location.replace(destinationForRole(role));
    } catch (error) {
        console.error('Invalid saved session:', error);
        localStorage.removeItem('lm_session');
    }
}

const loginForm = document.getElementById('loginForm');
const regForm = document.getElementById('registerForm'); // Đã khớp ID HTML
const loginMsg = document.getElementById('loginMessage'); // Đã khớp ID HTML
const regMsg = document.getElementById('registerMessage'); // Đã khớp ID HTML
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginMsg = document.getElementById('adminLoginMessage');

const authGuardReason = new URLSearchParams(window.location.search).get('reason');
const authGuardMessages = {
    auth_required: 'Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục.',
    profile_required: 'Tài khoản chưa có hồ sơ người dùng trong hệ thống. Vui lòng đăng ký hoặc liên hệ quản trị viên.',
    session_expired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    session_revoked: 'Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.',
    check_failed: 'Chưa thể xác minh tài khoản. Vui lòng đăng nhập lại.'
};
if (loginMsg && authGuardMessages[authGuardReason]) {
    loginMsg.textContent = authGuardMessages[authGuardReason];
    loginMsg.style.display = 'block';
}

const QUIZ_PAGE = '/index';
// Clean URL served by Vercel for the physical public/map.html page.
const MAP_PAGE = '/map';
const security = window.VieGeoSecurity || {
    sanitizeText: (value, max = 2000) => String(value || '').replace(/<[^>]*>/g, '').trim().slice(0, max),
    isValidEmail: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim().toLowerCase()),
    rateLimit: () => ({ allowed: true, retryAfterMs: 0 }),
    clearRateLimit: () => {}
};

function normalizeEmail(value) {
    return security.sanitizeText(value, 180).toLowerCase();
}

function getAuthClient() {
    const client = window.supabaseClient || window.supabase;
    return client && client.auth && typeof client.auth.signInWithPassword === 'function' ? client : null;
}

async function sha256Hex(value) {
    if (!window.crypto?.subtle || typeof TextEncoder === 'undefined') {
        throw new Error('Trình duyệt chưa hỗ trợ Web Crypto để xác thực Admin.');
    }
    const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value || '')));
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function isRootAdminEmail(email) {
    return normalizeEmail(email) === ROOT_ADMIN_EMAIL;
}

async function isRootAdminCredential(email, password) {
    if (!isRootAdminEmail(email)) return false;
    return (await sha256Hex(password)) === ROOT_ADMIN_PASSWORD_HASH;
}

async function isMasterAdminCredential(username, password) {
    const normalizedUsername = security.sanitizeText(username, 80).trim().toLowerCase();
    if (normalizedUsername !== MASTER_ADMIN_USERNAME) return false;
    return (await sha256Hex(password)) === MASTER_ADMIN_PASSWORD_HASH;
}

async function ensureMasterAdminProfile() {
    const adminProfile = {
        email: MASTER_ADMIN_PROFILE_EMAIL,
        username: 'Admin',
        name: 'Admin Tổng',
        role: 'admin',
        activeRole: 'admin',
        roles: ROOT_ADMIN_ROLES,
        accountStatus: 'premium',
        xp: 0,
        gems: 500,
        hearts: 3,
        avatar: 'fa-shield-halved',
        avatarIsBase64: false,
        isAdmin: true,
        isSuperAdmin: true,
        updatedAt: new Date().toISOString()
    };
    try {
        await db.collection('users').doc(MASTER_ADMIN_PROFILE_EMAIL).set(adminProfile, { merge: true });
    } catch (error) {
        console.warn('[VieGeo Admin] Không thể đồng bộ tài khoản Admin Tổng lên Supabase, tiếp tục bằng phiên cục bộ.', error);
    }
    return adminProfile;
}

async function startMasterAdminSession(username, password) {
    if (!await isMasterAdminCredential(username, password)) return false;
    const adminProfile = await ensureMasterAdminProfile();
    localStorage.removeItem('VieGeo_state');
    localStorage.setItem('lm_session', JSON.stringify({
        email: adminProfile.email,
        username: adminProfile.username,
        name: adminProfile.name,
        activeRole: 'admin',
        role: 'admin',
        roles: ROOT_ADMIN_ROLES,
        accountStatus: 'premium',
        isAdmin: true,
        isSuperAdmin: true
    }));
    security.clearRateLimit(`auth_login_${MASTER_ADMIN_USERNAME}`);
    security.clearRateLimit(`auth_admin_${MASTER_ADMIN_USERNAME}`);
    return true;
}

async function ensureRootAdminProfile() {
    const adminProfile = {
        email: ROOT_ADMIN_EMAIL,
        name: 'Đặng Kiên Quyết',
        role: 'admin',
        activeRole: 'admin',
        roles: ROOT_ADMIN_ROLES,
        accountStatus: 'premium',
        xp: 0,
        gems: 500,
        hearts: 3,
        avatar: 'fa-shield-halved',
        avatarIsBase64: false,
        isAdmin: true,
        isSuperAdmin: true,
        updatedAt: new Date().toISOString()
    };
    try {
        await db.collection('users').doc(ROOT_ADMIN_EMAIL).set(adminProfile, { merge: true });
        console.log('[VieGeo Admin] Hồ sơ Admin Tổng đã lưu vào users.', { email: ROOT_ADMIN_EMAIL, roles: ROOT_ADMIN_ROLES });
    } catch (error) {
        console.warn('[VieGeo Admin] Không thể upsert Admin Tổng lên Supabase, dùng session cục bộ.', error);
    }
    return adminProfile;
}

async function ensureAuthenticatedUserProfile(authUser, email, existingData = {}) {
    const now = new Date().toISOString();
    const metadata = authUser?.user_metadata || {};
    const safeEmail = normalizeEmail(email || authUser?.email || '');
    const existingRoles = getUserRoles(existingData);
    const role = normalizeRole(existingData.role || existingData.activeRole || existingData.active_role || existingRoles[0] || 'user');
    const profile = {
        ...existingData,
        email: safeEmail,
        name: existingData.name || existingData.full_name || metadata.name || metadata.full_name || safeEmail.split('@')[0],
        full_name: existingData.full_name || existingData.name || metadata.full_name || metadata.name || null,
        gender: existingData.gender || metadata.gender || '',
        role,
        activeRole: normalizeRole(existingData.activeRole || existingData.active_role || role),
        roles: existingRoles,
        accountStatus: existingData.accountStatus || existingData.account_status || 'free',
        createdAt: existingData.createdAt || existingData.created_at || authUser?.created_at || now,
        updatedAt: now
    };
    try {
        await db.collection('users').doc(safeEmail).set(profile, { merge: true });
        console.log('[VieGeo Auth] Supabase Auth user đã lưu vào public.users.', {
            email: safeEmail,
            roles: profile.roles,
            role: profile.role
        });
    } catch (error) {
        console.warn('[VieGeo Auth] Không thể đồng bộ user vào public.users, tiếp tục bằng session cục bộ.', error);
    }
    return profile;
}

function persistRootAdminSession(adminProfile) {
    const session = {
        email: ROOT_ADMIN_EMAIL,
        name: adminProfile.name,
        activeRole: 'admin',
        role: 'admin',
        roles: ROOT_ADMIN_ROLES,
        accountStatus: 'premium',
        isAdmin: true,
        isSuperAdmin: true
    };
    localStorage.removeItem('VieGeo_state');
    localStorage.setItem('lm_session', JSON.stringify(session));
    return session;
}

async function startRootAdminSession(email, password) {
    if (!await isRootAdminCredential(email, password)) return false;
    try {
        await signInViaSupabase(ROOT_ADMIN_EMAIL, password);
    } catch (authError) {
        console.warn('[VieGeo Admin] Supabase Auth chưa có tài khoản Admin Tổng hoặc mật khẩu chưa đồng bộ; tiếp tục bằng Admin bootstrap.', authError?.message || authError);
    }
    const adminProfile = await ensureRootAdminProfile();
    persistRootAdminSession(adminProfile);
    security.clearRateLimit(`auth_login_${ROOT_ADMIN_EMAIL}`);
    security.clearRateLimit(`auth_admin_${ROOT_ADMIN_EMAIL}`);
    return true;
}

function assertAuthRate(action, email, limit = 5, windowMs = 60000) {
    const result = security.rateLimit(`auth_${action}_${email || 'anonymous'}`, { limit, windowMs });
    if (!result.allowed) {
        const seconds = Math.ceil(result.retryAfterMs / 1000);
        throw new Error(`Bạn thao tác quá nhanh. Vui lòng thử lại sau ${seconds}s.`);
    }
}

async function signInViaSupabase(email, password) {
    const client = getAuthClient();
    if (!client) return null;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data?.user || null;
}

async function signUpViaSupabase({ email, password, name, gender }) {
    const client = getAuthClient();
    if (!client || typeof client.auth.signUp !== 'function') throw new Error('Supabase Auth chưa sẵn sàng.');
    const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { name, gender } }
    });
    if (error) throw error;
    return data?.user || null;
}

// 1. ĐĂNG NHẬP
function showToast(msg, isSuccess = true) {
    const toast = document.getElementById('toastNotification'); // Đã khớp ID HTML
    if (!toast) return;
    toast.textContent = msg;
    toast.style.background = isSuccess ? '#22C55E' : '#EF4444'; // Xanh lá hoặc Đỏ theo theme mới
    toast.style.bottom = '40px';
    setTimeout(() => {
        toast.style.bottom = '-100px';
    }, 3000);
}
// Panel Switching Logic
const loginPanel = document.getElementById('loginPanel');
const registerPanel = document.getElementById('registerPanel');
const adminLoginPanel = document.getElementById('adminLoginPanel');
const forgotPasswordPanel = document.getElementById('forgotPasswordPanel');
const resetPasswordPanel = document.getElementById('resetPasswordPanel');

const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const showAdminLoginBtn = document.getElementById('showAdminLogin');
const showLoginFromAdminBtn = document.getElementById('showLoginFromAdmin');
const showForgotPasswordBtn = document.getElementById('showForgotPassword');
const showLoginFromForgotBtn = document.getElementById('showLoginFromForgot');

function switchPanel(activePanel) {
    if(loginPanel) loginPanel.classList.remove('active');
    if(registerPanel) registerPanel.classList.remove('active');
    if(adminLoginPanel) adminLoginPanel.classList.remove('active');
    if(forgotPasswordPanel) forgotPasswordPanel.classList.remove('active');
    if(resetPasswordPanel) resetPasswordPanel.classList.remove('active');
    if(activePanel) activePanel.classList.add('active');
}

if (showRegisterBtn) showRegisterBtn.addEventListener('click', () => switchPanel(registerPanel));
if (showLoginBtn) showLoginBtn.addEventListener('click', () => switchPanel(loginPanel));
if (showAdminLoginBtn) showAdminLoginBtn.addEventListener('click', () => switchPanel(adminLoginPanel));
if (showLoginFromAdminBtn) showLoginFromAdminBtn.addEventListener('click', () => switchPanel(loginPanel));
if (showForgotPasswordBtn) showForgotPasswordBtn.addEventListener('click', () => switchPanel(forgotPasswordPanel));
if (showLoginFromForgotBtn) showLoginFromForgotBtn.addEventListener('click', () => switchPanel(loginPanel));

if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = security.sanitizeText(document.getElementById('adminUsername')?.value || '', 180).trim();
        const pass = document.getElementById('adminPassword')?.value || '';
        const btn = adminLoginForm.querySelector('button[type="submit"]');
        if (btn?.disabled) return;

        if (adminLoginMsg) {
            adminLoginMsg.textContent = '';
            adminLoginMsg.style.display = 'none';
        }
        if (!identifier || !pass) {
            if (adminLoginMsg) {
                adminLoginMsg.textContent = 'Vui lòng nhập tài khoản và mật khẩu Admin.';
                adminLoginMsg.style.display = 'block';
            }
            return;
        }

        btn.disabled = true;
        const previousLabel = btn.innerHTML;
        btn.textContent = 'Đang xác thực Admin...';

        try {
            const normalizedIdentifier = identifier.toLowerCase();
            assertAuthRate('admin', normalizedIdentifier, 5, 60000);
            const authenticated = normalizedIdentifier === MASTER_ADMIN_USERNAME
                ? await startMasterAdminSession(identifier, pass)
                : await startRootAdminSession(normalizeEmail(identifier), pass);
            if (!authenticated) {
                if (adminLoginMsg) {
                    adminLoginMsg.textContent = 'Tài khoản hoặc mật khẩu Admin Tổng không đúng.';
                    adminLoginMsg.style.display = 'block';
                }
                return;
            }
            showToast('Đăng nhập Admin Tổng thành công.');
            window.location.href = ROLE_DESTINATIONS.admin;
        } catch (error) {
            console.error('[VieGeo Admin] Lỗi đăng nhập Admin Tổng:', error);
            if (adminLoginMsg) {
                const message = String(error?.message || '');
                adminLoginMsg.textContent = message.startsWith('Bạn thao tác quá nhanh')
                    ? message
                    : 'Chưa thể đăng nhập quản trị. Vui lòng thử lại.';
                adminLoginMsg.style.display = 'block';
            }
        } finally {
            btn.disabled = false;
            btn.innerHTML = previousLabel;
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = security.sanitizeText(document.getElementById('loginEmail').value, 180).trim();
        const email = normalizeEmail(identifier);
        const pass = document.getElementById('loginPassword').value; // Đã khớp ID HTML
        const btn = loginForm.querySelector('button[type="submit"]');
        if (btn?.disabled) return;

        if (!identifier || !pass) {
            loginMsg.textContent = "Vui lòng nhập đầy đủ tài khoản và mật khẩu.";
            loginMsg.style.display = "block";
            return;
        }
        if (pass.length > 128) {
            loginMsg.textContent = "Tài khoản hoặc mật khẩu không hợp lệ.";
            loginMsg.style.display = "block";
            return;
        }

        btn.disabled = true;
        btn.textContent = "Đang kiểm tra...";

        try {
            const normalizedIdentifier = identifier.toLowerCase();
            assertAuthRate('login', normalizedIdentifier, 5, 60000);
            if (normalizedIdentifier === MASTER_ADMIN_USERNAME) {
                if (await startMasterAdminSession(identifier, pass)) {
                    showToast('Đăng nhập Admin Tổng thành công.');
                    window.location.href = ROLE_DESTINATIONS.admin;
                    return;
                }
                loginMsg.textContent = "Sai mật khẩu Admin Tổng.";
                loginMsg.style.display = "block";
                return;
            }
            if (!security.isValidEmail(email)) {
                loginMsg.textContent = "Email hoặc mật khẩu không hợp lệ.";
                loginMsg.style.display = "block";
                return;
            }
            if (isRootAdminEmail(email)) {
                if (await startRootAdminSession(email, pass)) {
                    showToast('Đăng nhập Admin Tổng thành công.');
                    window.location.href = ROLE_DESTINATIONS.admin;
                    return;
                }
                loginMsg.textContent = "Sai mật khẩu Admin Tổng.";
                loginMsg.style.display = "block";
                return;
            }
            let authenticated = false;
            let authUser = null;
            try {
                authUser = await signInViaSupabase(email, pass);
                authenticated = Boolean(authUser);
            } catch (authError) {
                console.warn('Supabase Auth login failed; legacy profile fallback will be checked:', authError?.message || authError);
            }
            const userDoc = await db.collection('users').doc(email).get();
            
            if (userDoc.exists || authenticated) {
                let userData = userDoc.exists ? userDoc.data() : {};
                if (authenticated) {
                    userData = await ensureAuthenticatedUserProfile(authUser, email, userData);
                }
                if (authenticated || (userData.password && userData.password === pass)) {
                    security.clearRateLimit(`auth_login_${email}`);
                    await updateStreakOnLogin(email, userData);
                    
                    // Cập nhật lại vào object để dùng cho localStorage
                    // updateStreakOnLogin has already synchronized the in-memory user data.
                    
                                        // RBAC check
                    const userRoles = getUserRoles(userData);
                    const activeRole = userRoles.includes(normalizeRole(userData.role))
                        ? normalizeRole(userData.role)
                        : userRoles[0];
                    
                    if (userRoles.length > 1) {
                        // Multi-role Gateway
                        const container = document.getElementById('roleSelectionContainer');
                        if (container) {
                            container.innerHTML = '';
                            const roleMap = {
                                'user': { name: 'Người dùng (Học viên)', icon: 'fa-graduation-cap', color: '#1cb0f6', url: MAP_PAGE },
                                'parent': { name: 'Phụ huynh', icon: 'fa-children', color: '#a78bfa', url: '/parent' },
                                'admin': { name: 'Quản trị viên (Admin)', icon: 'fa-shield-halved', color: '#ff4b4b', url: '/admin' },
                                'cs': { name: 'CSKH (Support)', icon: 'fa-headset', color: '#ffc800', url: '/cs' }
                            };
                            
                            userRoles.forEach(r => {
                                const rd = roleMap[r];
                                if (!rd) return;
                                const btnRole = document.createElement('button');
                                btnRole.style.cssText = `background: rgba(255,255,255,0.1); border: 1px solid ${rd.color}; padding: 15px; border-radius: 12px; color: white; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: 0.3s; width: 100%; text-align: left;`;
                                btnRole.innerHTML = `<i class="fa-solid ${rd.icon}" style="font-size: 1.5rem; color: ${rd.color}; width: 30px;"></i> <span>Truy cập quyền <b>${rd.name}</b></span>`;
                                btnRole.onmouseover = () => btnRole.style.background = 'rgba(255,255,255,0.2)';
                                btnRole.onmouseout = () => btnRole.style.background = 'rgba(255,255,255,0.1)';
                                
                                btnRole.onclick = () => {
                                    localStorage.setItem('lm_session', JSON.stringify({ email: email, name: userData.name, gender: userData.gender || '', activeRole: r, roles: userRoles, role: r, streak: userData.currentStreak }));
                                    window.location.href = destinationForRole(r);
                                };
                                container.appendChild(btnRole);
                            });
                            
                            document.getElementById('gatewayModalOverlay').style.display = 'flex';
                        }
                    } else {
                        // Single role redirect
                        const role = activeRole;
                        localStorage.setItem('lm_session', JSON.stringify({ email: email, name: userData.name, gender: userData.gender || '', activeRole: role, roles: userRoles, role, streak: userData.currentStreak }));

                        if (role === 'user') {
                            const pendingAction = localStorage.getItem('pending_action');
                            if (pendingAction) {
                                localStorage.removeItem('pending_action');
                                window.location.href = `${MAP_PAGE}${pendingAction.startsWith('?') ? pendingAction : ''}`;
                            } else {
                                window.location.href = destinationForRole(role);
                            }
                        } else {
                            window.location.href = destinationForRole(role);
                        }
                    }
                } else {
                    loginMsg.textContent = "Sai mật khẩu.";
                    loginMsg.style.display = "block";
                }
            } else {
                loginMsg.textContent = "Tài khoản không tồn tại.";
                loginMsg.style.display = "block";
            }
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            loginMsg.textContent = "Chưa thể đăng nhập. Vui lòng kiểm tra kết nối và thử lại.";
            loginMsg.style.display = "block";
        } finally {
            btn.disabled = false;
            btn.textContent = "Đăng Nhập";
        }
    });
}

// ── CẤU HÌNH EMAILJS ──
emailjs.init("Is8N-wrtdAZpySOJW");

// Biến lưu trữ tạm thời trong lúc xác thực OTP
let tempRegData = null;
let currentOtpCode = null;

const otpModalOverlay = document.getElementById('otpModalOverlay');
const otpEmailTarget = document.getElementById('otpEmailTarget');
const otpInput = document.getElementById('otpInput');
const otpMsg = document.getElementById('otpMessage'); // Đã khớp ID HTML
const btnConfirmOtp = document.getElementById('buttonConfirmOtp'); // Đã khớp ID HTML
const btnCancelOtp = document.getElementById('buttonCancelOtp'); // Đã khớp ID HTML

// 2. ĐĂNG KÝ (BƯỚC 1: KIỂM TRA VÀ GỬI OTP)
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = security.sanitizeText(document.getElementById('regName').value, 120);
        const email = normalizeEmail(document.getElementById('regEmail').value);
        const pass = document.getElementById('regPassword').value;
        const gender = ['male', 'female', 'other', 'prefer_not_to_say'].includes(String(document.getElementById('regGender').value || '').toLowerCase()) ? String(document.getElementById('regGender').value).toLowerCase() : '';
        const btn = regForm.querySelector('button[type="submit"]');
        if (btn?.disabled) return;

        if (!name || !email || !pass || !gender) {
            regMsg.textContent = "Vui lòng điền đủ thông tin.";
            regMsg.style.display = "block";
            return;
        }
        if (pass.length < 8 || pass.length > 128 || !security.isValidEmail(email)) {
            regMsg.textContent = "Email không hợp lệ hoặc mật khẩu chưa đủ mạnh (8-128 ký tự).";
            regMsg.style.display = "block";
            return;
        }

        btn.disabled = true;
        btn.textContent = "Đang kiểm tra Email...";

        try {
            assertAuthRate('register', email, 3, 10 * 60 * 1000);
            // Kiểm tra trùng email
            const userDoc = await db.collection('users').doc(email).get();
            if (userDoc.exists) {
                regMsg.textContent = "Email này đã được đăng ký trước đó.";
                regMsg.style.display = "block";
                btn.disabled = false;
                btn.textContent = "Đăng Ký Khám Phá";
                return;
            }

            // Tạo mã OTP ngẫu nhiên (6 số)
            currentOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Lưu dữ liệu tạm để dùng sau khi xác thực thành công
            tempRegData = { name, email, pass, gender };

            btn.textContent = "Đang gửi OTP...";

            try {
                // Gọi API Gửi EmailJS
                await emailjs.send("service_tfug92l", "template_qs28vrz", {
                    to_name: name,
                    to_email: email,
                    otp: currentOtpCode
                });
            } catch (error) {
                console.error("Không thể gửi mã xác thực đăng ký:", error);
                throw new Error('OTP_DELIVERY_FAILED');
            }

            // Dù gửi thật hay fallback, vẫn mở bảng OTP cho phép nhập
            otpEmailTarget.textContent = email;
            otpInput.value = '';
            otpMsg.style.display = 'none';
            otpModalOverlay.style.display = 'flex';
            
            btn.disabled = false;
            btn.textContent = "Đăng Ký Khám Phá";

        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            regMsg.textContent = "Lỗi hệ thống. Vui lòng thử lại sau.";
            regMsg.style.display = "block";
            btn.disabled = false;
            btn.textContent = "Đăng Ký Khám Phá";
        }
    });
}

// Thay thế listener cho btnConfirmOtp để hỗ trợ cả 2 luồng: Đăng ký & Quên mật khẩu
if (btnConfirmOtp) {
    const newBtnConfirmOtp = btnConfirmOtp.cloneNode(true);
    btnConfirmOtp.parentNode.replaceChild(newBtnConfirmOtp, btnConfirmOtp);
    
    newBtnConfirmOtp.addEventListener('click', async () => {
        const inputCode = otpInput.value.trim();
        
        if (inputCode !== currentOtpCode) {
            otpMsg.textContent = "Mã OTP không chính xác!";
            otpMsg.style.display = 'block';
            return;
        }

        newBtnConfirmOtp.disabled = true;
        newBtnConfirmOtp.textContent = "Đang xác thực...";
        otpMsg.style.display = 'none';

        if (forgotOtpMode) {
            // Xác thực thành công cho luồng Quên mật khẩu
            otpModalOverlay.style.display = 'none';
            switchPanel(resetPasswordPanel);
            newBtnConfirmOtp.disabled = false;
            newBtnConfirmOtp.textContent = "Xác Nhận";
            forgotOtpMode = false;
        } else {
            // Xác thực thành công cho luồng Đăng ký
            try {
                await signUpViaSupabase({
                    email: tempRegData.email,
                    password: tempRegData.pass,
                    name: tempRegData.name,
                    gender: tempRegData.gender
                });
                const newUser = {
                    name: tempRegData.name,
                    email: tempRegData.email,
                    gender: tempRegData.gender,
                    createdAt: new Date().toISOString(),
                    lastLoginDate: null,
                    xp: 0,
                    hearts: 3,
                    accountStatus: 'free',
                    lastHeartRegenTime: Date.now(),
                    lastHeartUpdate: Date.now(),
                    streak: 0,
                    currentStreak: 0,
                    lastStudyDate: null,
                    lastStreakAwardDate: null,
                    gems: 500,
                    avatar: "fa-user-astronaut",
                    avatarIsBase64: false,
                    roles: ['user'] // Mặc định role là user
                };

                await db.collection('users').doc(tempRegData.email).set(newUser);
                security.clearRateLimit(`auth_register_${tempRegData.email}`);
                localStorage.removeItem('VieGeo_state');
                localStorage.setItem('lm_session', JSON.stringify({ email: tempRegData.email, name: tempRegData.name, gender: tempRegData.gender, activeRole: 'user' }));
                tempRegData = null;
                showToast("🎉 Chúc mừng! Đăng ký thành công.");
                
                setTimeout(() => window.location.href = MAP_PAGE, 1500);

            } catch (error) {
                console.error("Lỗi lưu tài khoản:", error);
                otpMsg.textContent = "Lỗi kết nối máy chủ!";
                otpMsg.style.display = 'block';
                newBtnConfirmOtp.disabled = false;
                newBtnConfirmOtp.textContent = "Xác nhận tạo tài khoản";
            }
        }
    });
}

// ── 4. QUÊN MẬT KHẨU LOGIC ──
const forgotForm = document.getElementById('forgotPasswordForm');
const resetForm = document.getElementById('resetPasswordForm');
let forgotTempEmail = '';
let forgotOtpMode = false;

if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = normalizeEmail(document.getElementById('forgotEmail').value);
        const msg = document.getElementById('forgotMessage');
        const btn = forgotForm.querySelector('button[type="submit"]');
        if (btn?.disabled) return;
        
        if (!email) {
            msg.textContent = "Vui lòng nhập email.";
            msg.style.display = "block";
            return;
        }
        if (!security.isValidEmail(email)) {
            msg.textContent = "Email không hợp lệ.";
            msg.style.display = "block";
            return;
        }

        btn.disabled = true;
        btn.textContent = "Đang kiểm tra...";
        
        try {
            assertAuthRate('forgot', email, 3, 10 * 60 * 1000);
            const authClient = getAuthClient();
            if (authClient && typeof authClient.auth.resetPasswordForEmail === 'function') {
                const { error } = await authClient.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/loginout` });
                if (error) throw error;
                security.clearRateLimit(`auth_forgot_${email}`);
                msg.textContent = "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.";
                msg.style.display = "block";
                return;
            }
            const doc = await db.collection('users').doc(email).get();
            if (!doc.exists) {
                msg.textContent = "Tài khoản không tồn tại.";
                msg.style.display = "block";
                btn.disabled = false;
                btn.textContent = "Gửi mã OTP";
                return;
            }
            
            forgotTempEmail = email;
            forgotOtpMode = true;
            currentOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            try {
                await emailjs.send("service_tfug92l", "template_qs28vrz", {
                    to_name: doc.data().name,
                    to_email: email,
                    otp: currentOtpCode
                });
            } catch (error) {
                console.error("Không thể gửi mã xác thực đặt lại mật khẩu:", error);
                throw new Error('OTP_DELIVERY_FAILED');
            }
            
            otpEmailTarget.textContent = email;
            otpInput.value = '';
            otpMsg.style.display = 'none';
            otpModalOverlay.style.display = 'flex';
            msg.style.display = 'none';

        } catch (error) {
            msg.textContent = "Chưa thể gửi mã xác thực. Vui lòng thử lại sau.";
            msg.style.display = "block";
        } finally {
            btn.disabled = false;
            btn.textContent = "Gửi mã OTP";
        }
    });
}

if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const p1 = document.getElementById('resetPasswordInput').value;
        const p2 = document.getElementById('resetPasswordConfirm').value;
        const msg = document.getElementById('resetMessage');
        const btn = resetForm.querySelector('button[type="submit"]');
        if (btn?.disabled) return;

        if (p1.length < 8 || p1.length > 128) {
            msg.textContent = "Mật khẩu phải từ 6 ký tự.";
            msg.style.display = "block"; return;
        }
        if (p1 !== p2) {
            msg.textContent = "Mật khẩu xác nhận không khớp.";
            msg.style.display = "block"; return;
        }

        btn.disabled = true;
        btn.textContent = "Đang lưu...";
        
        try {
            const authClient = getAuthClient();
            if (!authClient || typeof authClient.auth.updateUser !== 'function') throw new Error('Phiên đăng nhập chưa sẵn sàng để đổi mật khẩu.');
            const { error } = await authClient.auth.updateUser({ password: p1 });
            if (error) throw error;
            if (forgotTempEmail) await db.collection('users').doc(forgotTempEmail).update({ password: null, passwordUpdatedAt: new Date().toISOString() });
            showToast("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
            switchPanel(loginPanel);
            document.getElementById('loginEmail').value = forgotTempEmail;
        } catch (error) {
            msg.textContent = "Chưa thể đổi mật khẩu. Vui lòng thử lại sau.";
            msg.style.display = "block";
        } finally {
            btn.disabled = false;
            btn.textContent = "Lưu mật khẩu mới";
        }
    });
}

// Hủy bỏ OTP
if (btnCancelOtp) {
    btnCancelOtp.addEventListener('click', () => {
        otpModalOverlay.style.display = 'none';
        tempRegData = null;
        currentOtpCode = null;
    });
}
