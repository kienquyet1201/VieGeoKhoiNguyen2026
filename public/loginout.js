/*
 * VieGeo authentication entry point — Phase 1.
 * Supabase Auth owns the session and public.users is the only profile source.
 * Browser storage is deliberately never used for roles, premium, streak, XP or gems.
 */
(function () {
    'use strict';

    const DESTINATION_BY_ROLE = Object.freeze({
        user: '/student-dashboard',
        parent: '/parent',
        cs: '/cs-dashboard',
        admin: '/admin'
    });

    const $ = (id) => document.getElementById(id);
    const loginForm = $('loginForm');
    const registerForm = $('registerForm');
    const adminLoginForm = $('adminLoginForm');
    const forgotForm = $('forgotPasswordForm');
    const resetForm = $('resetPasswordForm');
    const loginMessage = $('loginMessage');
    const registerMessage = $('registerMessage');
    const adminLoginMessage = $('adminLoginMessage');
    const forgotMessage = $('forgotMessage');
    const resetMessage = $('resetMessage');

    function client() {
        return window.supabaseClient || window.supabase || window.VieGeoSupabase?.client || null;
    }

    function isEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase());
    }

    function normaliseEmail(value) {
        return String(value || '').trim().toLowerCase();
    }

    function setMessage(target, text, success) {
        if (!target) return;
        target.textContent = text || '';
        target.style.color = success ? '#168760' : '#ff4b4b';
        target.style.display = text ? 'block' : 'none';
    }

    function toast(text, success) {
        const element = $('toastNotification');
        if (!element) return;
        element.textContent = text;
        element.style.background = success === false ? '#ef4444' : '#22c55e';
        element.style.bottom = '40px';
        window.setTimeout(() => { element.style.bottom = '-100px'; }, 3200);
    }

    function setBusy(form, busy, label) {
        const button = form?.querySelector('button[type="submit"]');
        if (!button) return;
        if (busy) {
            button.dataset.defaultLabel = button.innerHTML;
            button.disabled = true;
            button.textContent = label;
            return;
        }
        button.disabled = false;
        button.innerHTML = button.dataset.defaultLabel || button.innerHTML;
    }

    function showPanel(panelId) {
        ['loginPanel', 'registerPanel', 'adminLoginPanel', 'forgotPasswordPanel', 'resetPasswordPanel']
            .forEach((id) => $(id)?.classList.toggle('active', id === panelId));
    }

    function roleDestination(profile) {
        const activeRole = window.VieGeoUserStore?.getActiveRole?.() || profile?.role || 'user';
        return DESTINATION_BY_ROLE[activeRole] || DESTINATION_BY_ROLE.user;
    }

    async function requireProfile() {
        const profile = await window.VieGeoUserStore?.reload?.();
        if (!profile?.id) throw new Error('PROFILE_INITIALIZATION_FAILED');
        return profile;
    }

    async function redirectAuthenticatedUser() {
        const auth = client();
        if (!auth?.auth || !window.VieGeoUserStore) return;
        try {
            const { data: { session } } = await auth.auth.getSession();
            if (!session?.access_token) return;
            const profile = await requireProfile();
            const role = profile.roles.includes(profile.role) ? profile.role : profile.roles[0] || 'user';
            window.VieGeoUserStore.setActiveRole(role);
            window.location.replace(roleDestination(profile));
        } catch (error) {
            // A failed profile check must keep the person on the login page.
            console.warn('[VieGeo Auth] Phiên cũ không thể được xác minh:', error?.message || error);
        }
    }

    async function signIn(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const isAdminForm = form === adminLoginForm;
        const identifier = normaliseEmail($(isAdminForm ? 'adminUsername' : 'loginEmail')?.value);
        const password = String($(isAdminForm ? 'adminPassword' : 'loginPassword')?.value || '');
        const message = isAdminForm ? adminLoginMessage : loginMessage;

        if (!isEmail(identifier) || !password) {
            setMessage(message, 'Sai tài khoản hoặc mật khẩu.');
            return;
        }
        if (!client()?.auth || !window.VieGeoUserStore) {
            setMessage(message, 'Dịch vụ đăng nhập chưa sẵn sàng. Vui lòng tải lại trang.');
            return;
        }

        setMessage(message, '');
        setBusy(form, true, 'Đang đăng nhập...');
        try {
            const response = await client().auth.signInWithPassword({ email: identifier, password });
            console.log('1. API Response:', response.data);
            if (response.error) throw response.error;

            const { data: { session } } = await client().auth.getSession();
            const token = session?.access_token || '';
            console.log('2. Token saved:', token);
            if (!token) throw new Error('SESSION_NOT_PERSISTED');

            // This awaits the Auth-triggered profile (or the profile RPC) before navigation.
            const profile = await requireProfile();
            const role = profile.roles.includes(profile.role) ? profile.role : profile.roles[0] || 'user';
            window.VieGeoUserStore.setActiveRole(role);
            console.log('3. Redirecting...');
            window.location.assign(roleDestination(profile));
        } catch (error) {
            console.error('[VieGeo Auth] Đăng nhập thất bại:', error);
            const profileRpcMissing = error?.code === 'PGRST202';
            setMessage(
                message,
                profileRpcMissing
                    ? 'Tài khoản đã xác thực nhưng hồ sơ hệ thống chưa được khởi tạo. Vui lòng chạy bản vá database.'
                    : 'Sai tài khoản hoặc mật khẩu.'
            );
        } finally {
            setBusy(form, false);
        }
    }

    async function register(event) {
        event.preventDefault();
        const name = String($('regName')?.value || '').trim();
        const email = normaliseEmail($('regEmail')?.value);
        const password = String($('regPassword')?.value || '');
        const confirmation = String($('regPasswordConfirm')?.value || '');
        const gender = String($('regGender')?.value || '').trim();
        const age = Number($('regAge')?.value || 0);
        const schoolGrade = Number($('regSchoolGrade')?.value || 0);

        if (!name || !isEmail(email) || password.length < 8 || password !== confirmation ||
            !Number.isInteger(age) || age < 6 || age > 100 ||
            !Number.isInteger(schoolGrade) || schoolGrade < 1 || schoolGrade > 12) {
            setMessage(registerMessage, 'Vui lòng kiểm tra lại họ tên, email, mật khẩu, tuổi và lớp học.');
            return;
        }
        if (!client()?.auth || !window.VieGeoUserStore) {
            setMessage(registerMessage, 'Dịch vụ đăng ký chưa sẵn sàng. Vui lòng tải lại trang.');
            return;
        }

        setMessage(registerMessage, '');
        setBusy(registerForm, true, 'Đang tạo tài khoản...');
        try {
            const response = await client().auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: name,
                        age,
                        school_grade: schoolGrade,
                        gender
                    }
                }
            });
            console.log('1. API Response:', response.data);
            if (response.error) throw response.error;

            const { data: { session } } = await client().auth.getSession();
            const token = session?.access_token || '';
            console.log('2. Token saved:', token);
            if (!token) {
                setMessage(registerMessage, 'Tài khoản đã được tạo. Hãy xác nhận email rồi đăng nhập để bắt đầu.', true);
                return;
            }

            const profile = await requireProfile();
            await window.VieGeoUserStore.updateProfile({
                displayName: name,
                age,
                schoolGrade,
                gender,
                phone: ''
            });
            console.log('3. Redirecting...');
            window.location.assign(roleDestination(profile));
        } catch (error) {
            console.error('[VieGeo Auth] Đăng ký thất bại:', error);
            const duplicate = /already registered|already exists|registered/i.test(String(error?.message || ''));
            setMessage(registerMessage, duplicate ? 'Email này đã được đăng ký.' : 'Chưa thể tạo tài khoản. Vui lòng thử lại sau.');
        } finally {
            setBusy(registerForm, false);
        }
    }

    async function requestPasswordReset(event) {
        event.preventDefault();
        const email = normaliseEmail($('forgotEmail')?.value);
        if (!isEmail(email)) {
            setMessage(forgotMessage, 'Vui lòng nhập email hợp lệ.');
            return;
        }
        if (!client()?.auth) {
            setMessage(forgotMessage, 'Dịch vụ chưa sẵn sàng. Vui lòng tải lại trang.');
            return;
        }
        setBusy(forgotForm, true, 'Đang gửi email...');
        try {
            const { error } = await client().auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/loginout`
            });
            if (error) throw error;
            setMessage(forgotMessage, 'Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.', true);
        } catch (error) {
            console.error('[VieGeo Auth] Không thể gửi email đổi mật khẩu:', error);
            setMessage(forgotMessage, 'Chưa thể gửi email. Vui lòng thử lại sau.');
        } finally {
            setBusy(forgotForm, false);
        }
    }

    async function resetPassword(event) {
        event.preventDefault();
        const password = String($('resetPasswordInput')?.value || '');
        const confirmation = String($('resetPasswordConfirm')?.value || '');
        if (password.length < 8 || password !== confirmation) {
            setMessage(resetMessage, 'Mật khẩu phải từ 8 ký tự và cần khớp với xác nhận.');
            return;
        }
        if (!client()?.auth) {
            setMessage(resetMessage, 'Phiên đặt lại mật khẩu chưa sẵn sàng.');
            return;
        }
        setBusy(resetForm, true, 'Đang lưu...');
        try {
            const { error } = await client().auth.updateUser({ password });
            if (error) throw error;
            toast('Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.');
            showPanel('loginPanel');
        } catch (error) {
            console.error('[VieGeo Auth] Không thể đổi mật khẩu:', error);
            setMessage(resetMessage, 'Chưa thể đổi mật khẩu. Vui lòng thử lại sau.');
        } finally {
            setBusy(resetForm, false);
        }
    }

    $('showRegister')?.addEventListener('click', () => showPanel('registerPanel'));
    $('showLogin')?.addEventListener('click', () => showPanel('loginPanel'));
    $('showAdminLogin')?.addEventListener('click', () => showPanel('adminLoginPanel'));
    $('showLoginFromAdmin')?.addEventListener('click', () => showPanel('loginPanel'));
    $('showForgotPassword')?.addEventListener('click', () => showPanel('forgotPasswordPanel'));
    $('showLoginFromForgot')?.addEventListener('click', () => showPanel('loginPanel'));

    loginForm?.addEventListener('submit', signIn);
    adminLoginForm?.addEventListener('submit', signIn);
    registerForm?.addEventListener('submit', register);
    forgotForm?.addEventListener('submit', requestPasswordReset);
    resetForm?.addEventListener('submit', resetPassword);

    const reason = new URLSearchParams(window.location.search).get('reason');
    const reasonMessage = {
        auth_required: 'Vui lòng đăng nhập để tiếp tục.',
        profile_required: 'Tài khoản chưa có hồ sơ trong hệ thống. Vui lòng liên hệ quản trị viên.',
        session_expired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        session_revoked: 'Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.',
        check_failed: 'Chưa thể xác minh tài khoản. Vui lòng đăng nhập lại.'
    };
    if (reason && reasonMessage[reason]) setMessage(loginMessage, reasonMessage[reason]);

    // If this page was opened by an authenticated visitor, use the canonical profile
    // to choose a destination rather than a browser cache.
    window.addEventListener('load', redirectAuthenticatedUser);
}());
