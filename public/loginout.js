// ============================================================================
// VieGeo - loginout.js (Auth Logic with Firebase)
// ============================================================================

const ROLE_DESTINATIONS = Object.freeze({
    user: '/map',
    parent: '/parent-dashboard',
    teacher: '/teacher-dashboard',
    cs: '/cs-dashboard',
    admin: '/admin'
});

function normalizeRole(role) {
    const aliases = { student: 'user', map: 'user', cskh: 'cs', support: 'cs' };
    const value = String(role || '').trim().toLowerCase();
    return aliases[value] || value;
}

function getUserRoles(user) {
    const source = Array.isArray(user && user.roles)
        ? user.roles
        : [user && (user.activeRole || user.role)];
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

const QUIZ_PAGE = '/index';
const MAP_PAGE = '/user-dashboard';

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

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPassword').value; // Đã khớp ID HTML
        const btn = loginForm.querySelector('button[type="submit"]');

        if (!email || !pass) {
            loginMsg.textContent = "Vui lòng nhập đầy đủ email và mật khẩu.";
            loginMsg.style.display = "block";
            return;
        }

        btn.disabled = true;
        btn.textContent = "Đang kiểm tra...";

        try {
            const userDoc = await db.collection('users').doc(email).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.password === pass) {
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
                                'parent': { name: 'Phụ huynh', icon: 'fa-children', color: '#a78bfa', url: '/parent-dashboard' },
                                'teacher': { name: 'Giáo viên', icon: 'fa-chalkboard-user', color: '#22c55e', url: '/teacher-dashboard' },
                                'admin': { name: 'Quản trị viên (Admin)', icon: 'fa-shield-halved', color: '#ff4b4b', url: '/admin' },
                                'cs': { name: 'CSKH (Support)', icon: 'fa-headset', color: '#ffc800', url: '/cs-dashboard' }
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
                                    localStorage.setItem('lm_session', JSON.stringify({ email: email, name: userData.name, gender: userData.gender || '', activeRole: r, roles: userRoles, role: activeRole, streak: userData.currentStreak }));
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
            loginMsg.textContent = "Lỗi kết nối máy chủ!";
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
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const pass = document.getElementById('regPassword').value;
        const gender = document.getElementById('regGender').value;
        const btn = regForm.querySelector('button[type="submit"]');

        if (!name || !email || !pass || !gender) {
            regMsg.textContent = "Vui lòng điền đủ thông tin.";
            regMsg.style.display = "block";
            return;
        }
        if (pass.length < 6) {
            regMsg.textContent = "Mật khẩu phải từ 6 ký tự.";
            regMsg.style.display = "block";
            return;
        }

        btn.disabled = true;
        btn.textContent = "Đang kiểm tra Email...";

        try {
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
                console.warn("EmailJS failed, using fallback mode for testing.", error);
                Swal.fire({ icon: 'warning', title: 'Lưu ý', text: "Hệ thống EmailJS đang quá tải hoặc lỗi cấu hình. \n\n[CHẾ ĐỘ THỬ NGHIỆM] Mã OTP của bạn là: " + currentOtpCode });
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
                const newUser = {
                    name: tempRegData.name,
                    email: tempRegData.email,
                    password: tempRegData.pass,
                    gender: tempRegData.gender,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
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
                localStorage.removeItem('VieGeo_state');
                localStorage.setItem('lm_session', JSON.stringify({ email: tempRegData.email, name: tempRegData.name, gender: tempRegData.gender, activeRole: 'user' }));
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
        const email = document.getElementById('forgotEmail').value.trim();
        const msg = document.getElementById('forgotMessage');
        const btn = forgotForm.querySelector('button[type="submit"]');
        
        if (!email) {
            msg.textContent = "Vui lòng nhập email.";
            msg.style.display = "block";
            return;
        }

        btn.disabled = true;
        btn.textContent = "Đang kiểm tra...";
        
        try {
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
                console.warn("EmailJS failed, using fallback mode for testing.");
                Swal.fire({ icon: 'warning', title: 'Lưu ý', text: "Hệ thống EmailJS đang quá tải hoặc lỗi cấu hình. \n\n[CHẾ ĐỘ THỬ NGHIỆM] Mã OTP của bạn là: " + currentOtpCode });
            }
            
            otpEmailTarget.textContent = email;
            otpInput.value = '';
            otpMsg.style.display = 'none';
            otpModalOverlay.style.display = 'flex';
            msg.style.display = 'none';

        } catch (error) {
            msg.textContent = "Lỗi kết nối máy chủ!";
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

        if (p1.length < 6) {
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
            await db.collection('users').doc(forgotTempEmail).update({ password: p1 });
            showToast("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
            switchPanel(loginPanel);
            document.getElementById('loginEmail').value = forgotTempEmail;
        } catch (error) {
            msg.textContent = "Lỗi máy chủ.";
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
