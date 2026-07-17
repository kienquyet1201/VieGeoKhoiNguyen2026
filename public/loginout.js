// ============================================================================
// VieGeo - loginout.js (Auth Logic with Firebase)
// ============================================================================

const currentSession = localStorage.getItem('lm_session');
if (currentSession) {
    window.location.href = '/';
}

const loginForm = document.getElementById('loginForm');
const regForm = document.getElementById('registerForm'); // Đã khớp ID HTML
const loginMsg = document.getElementById('loginMessage'); // Đã khớp ID HTML
const regMsg = document.getElementById('registerMessage'); // Đã khớp ID HTML

const QUIZ_PAGE = 'index.html';
const MAP_PAGE = '/';

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
                    // STREAK LOGIC
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    let newStreak = userData.streak || 1;
                    let lastLogin = userData.lastLoginDate ? new Date(userData.lastLoginDate) : new Date(0);
                    lastLogin.setHours(0, 0, 0, 0);
                    
                    const diffTime = Math.abs(today - lastLogin);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    
                    if (diffDays === 1) {
                        newStreak += 1;
                    } else if (diffDays > 1) {
                        newStreak = 1;
                    }
                    
                    await db.collection('users').doc(email).update({
                        streak: newStreak,
                        lastLoginDate: new Date().toISOString()
                    });
                    
                    // Cập nhật lại vào object để dùng cho localStorage
                    userData.streak = newStreak;
                    
                    // RBAC check
                    let userRoles = userData.roles || ['user'];
                    if (userData.email === 'kienquyet1201@gmail.com') {
                        userRoles = ['admin', 'user', 'cs'];
                        db.collection('users').doc(email).update({ roles: userRoles }); // assure backend has it
                    }
                    
                    if (userRoles.length > 1) {
                        // Multi-role Gateway
                        const container = document.getElementById('roleSelectionContainer');
                        if (container) {
                            container.innerHTML = '';
                            const roleMap = {
                                'user': { name: 'Người dùng (Học viên)', icon: 'fa-graduation-cap', color: '#1cb0f6', url: MAP_PAGE },
                                'admin': { name: 'Quản trị viên (Admin)', icon: 'fa-shield-halved', color: '#ff4b4b', url: 'admin.html' },
                                'cs': { name: 'CSKH (Support)', icon: 'fa-headset', color: '#ffc800', url: 'cs.html' }
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
                                    localStorage.setItem('lm_session', JSON.stringify({ email: userData.email, name: userData.name, activeRole: r }));
                                    window.location.href = rd.url;
                                };
                                container.appendChild(btnRole);
                            });
                            
                            document.getElementById('gatewayModalOverlay').style.display = 'flex';
                        }
                    } else {
                        // Single role redirect
                        const role = userRoles[0] || 'user';
                        localStorage.setItem('lm_session', JSON.stringify({ email: userData.email, name: userData.name, activeRole: role }));
                        
                        if (role === 'admin') window.location.href = 'admin.html';
                        else if (role === 'cs') window.location.href = 'cs.html';
                        else {
                            const pendingAction = localStorage.getItem('pending_action');
                            if (pendingAction) {
                                localStorage.removeItem('pending_action');
                                window.location.href = MAP_PAGE + pendingAction;
                            } else {
                                window.location.href = MAP_PAGE;
                            }
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
        const btn = regForm.querySelector('button[type="submit"]');

        if (!name || !email || !pass) {
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
            tempRegData = { name, email, pass };

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
                alert("Hệ thống EmailJS đang quá tải hoặc lỗi cấu hình. \n\n[CHẾ ĐỘ THỬ NGHIỆM] Mã OTP của bạn là: " + currentOtpCode);
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
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLoginDate: new Date().toISOString(),
                    xp: 0,
                    hearts: 2,
                    accountStatus: 'free',
                    lastHeartRegenTime: Date.now(),
                    streak: 1,
                    gems: 500,
                    avatar: "fa-user-astronaut",
                    avatarIsBase64: false,
                    roles: ['user'] // Mặc định role là user
                };

                await db.collection('users').doc(tempRegData.email).set(newUser);
                localStorage.removeItem('VieGeo_state');
                localStorage.setItem('lm_session', JSON.stringify({ email: tempRegData.email, name: tempRegData.name, activeRole: 'user' }));
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
                alert("Hệ thống EmailJS đang quá tải hoặc lỗi cấu hình. \n\n[CHẾ ĐỘ THỬ NGHIỆM] Mã OTP của bạn là: " + currentOtpCode);
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