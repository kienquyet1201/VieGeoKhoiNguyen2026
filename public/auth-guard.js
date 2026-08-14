(function () {
    'use strict';

    var LOGIN_ROUTE = '/loginout';
    var CHECK_TIMEOUT_MS = 12000;
    var root = document.documentElement;

    root.classList.add('viegeo-auth-checking');

    var guardStyle = document.createElement('style');
    guardStyle.id = 'viegeo-auth-guard-style';
    guardStyle.textContent = [
        'html.viegeo-auth-checking body { visibility: hidden !important; }',
        'html.viegeo-auth-checking::before {',
        'content: "Đang kiểm tra tài khoản...";',
        'position: fixed; inset: 0; z-index: 2147483647;',
        'display: grid; place-items: center;',
        'background: #081426; color: #e8f5ff;',
        'font: 700 15px/1.5 "Be Vietnam Pro", system-ui, sans-serif;',
        'visibility: visible;',
        '}'
    ].join('');
    document.head.appendChild(guardStyle);

    function withTimeout(promise, timeoutMs) {
        var timer;
        return Promise.race([
            promise,
            new Promise(function (_, reject) {
                timer = window.setTimeout(function () {
                    reject(new Error('AUTH_CHECK_TIMEOUT'));
                }, timeoutMs);
            })
        ]).finally(function () {
            window.clearTimeout(timer);
        });
    }

    function readLocalSession() {
        try {
            var session = JSON.parse(localStorage.getItem('lm_session') || '{}');
            return session && typeof session === 'object' ? session : {};
        } catch (_) {
            return {};
        }
    }

    function normalizeRoles(profile) {
        var values = profile && profile.roles;
        if (typeof values === 'string') {
            try {
                var parsed = JSON.parse(values);
                values = Array.isArray(parsed) ? parsed : values.split(',');
            } catch (_) {
                values = values.split(',');
            }
        }
        if (!Array.isArray(values)) values = [];
        if (!values.length && profile && (profile.role || profile.active_role)) {
            values = [profile.active_role || profile.role];
        }
        var aliases = { student: 'user', map: 'user', cskh: 'cs', support: 'cs', premium: 'user' };
        return Array.from(new Set(values.map(function (role) {
            var value = String(role || '').trim().toLowerCase();
            return aliases[value] || value;
        }).filter(function (role) {
            return ['user', 'parent', 'cs', 'admin'].includes(role);
        })));
    }

    function persistVerifiedSession(authUser, profile) {
        var previous = readLocalSession();
        var roles = normalizeRoles(profile);
        var accountStatus = String(profile.account_status ?? profile.accountStatus ?? '').trim().toLowerCase();
        var rawRoles = Array.isArray(profile.roles) ? profile.roles : [profile.role, profile.active_role];
        var premium = ['premium', 'active', 'approved'].includes(accountStatus)
            || profile.is_premium === true
            || profile.isPremium === true
            || rawRoles.some(function (role) { return String(role || '').trim().toLowerCase() === 'premium'; });
        var requestedRole = String(previous.activeRole || previous.role || '').trim().toLowerCase();
        var aliases = { student: 'user', map: 'user', cskh: 'cs', support: 'cs', premium: 'user' };
        requestedRole = aliases[requestedRole] || requestedRole;
        var activeRole = roles.includes(requestedRole) ? requestedRole : (roles[0] || '');
        var session = Object.assign({}, previous, {
            id: authUser.id,
            user_id: authUser.id,
            email: String(authUser.email || profile.email || '').trim().toLowerCase(),
            name: profile.name || profile.full_name || profile.user_name || previous.name || '',
            roles: roles,
            accountStatus: premium ? 'premium' : 'free',
            isPremium: premium,
            verifiedBySupabase: true,
            verifiedAt: Date.now()
        });
        if (activeRole) {
            session.role = activeRole;
            session.activeRole = activeRole;
        } else {
            delete session.role;
            delete session.activeRole;
        }
        localStorage.setItem('lm_session', JSON.stringify(session));
        return session;
    }

    function clearUnverifiedSession() {
        localStorage.removeItem('lm_session');
        localStorage.removeItem('VieGeo_state');
    }

    function redirectToLogin(reason) {
        if (location.pathname === LOGIN_ROUTE || location.pathname === LOGIN_ROUTE + '.html') return;
        try {
            sessionStorage.setItem('viegeo_return_after_login', location.pathname + location.search + location.hash);
            sessionStorage.setItem('viegeo_auth_reason', reason || 'auth_required');
        } catch (_) {}
        clearUnverifiedSession();
        location.replace(LOGIN_ROUTE + '?reason=' + encodeURIComponent(reason || 'auth_required'));
    }

    function getClient() {
        var client = window.supabaseClient || window.supabase || (window.VieGeoSupabase && window.VieGeoSupabase.client);
        return client && client.auth && typeof client.from === 'function' ? client : null;
    }

    async function readAdminServerSession() {
        try {
            var response = await withTimeout(fetch('/api/admin-session', {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store'
            }), CHECK_TIMEOUT_MS);
            if (!response.ok) return null;
            var result = await response.json();
            return result && result.ok ? result.profile : null;
        } catch (_) {
            return null;
        }
    }

    async function clearAdminServerSession() {
        try {
            await fetch('/api/admin-session', { method: 'DELETE', credentials: 'same-origin' });
        } catch (_) {}
    }

    window.VieGeoClearAdminSession = clearAdminServerSession;
    window.VieGeoLogout = async function (destination) {
        await clearAdminServerSession();
        try {
            var authClient = getClient();
            if (authClient && authClient.auth && typeof authClient.auth.signOut === 'function') {
                await authClient.auth.signOut();
            }
        } catch (_) {}
        localStorage.removeItem('lm_session');
        localStorage.removeItem('VieGeo_state');
        window.location.href = destination || '/loginout';
    };

    function finishVerification(authUser, profile) {
        var session = persistVerifiedSession(authUser, profile);
        session.isAdmin = profile.isAdmin === true || profile.is_admin === true || session.roles.includes('admin');
        session.isSuperAdmin = profile.isSuperAdmin === true || profile.legacy_data?.isSuperAdmin === true;
        localStorage.setItem('lm_session', JSON.stringify(session));
        window.VieGeoCurrentUser = Object.assign({}, profile, {
            id: authUser.id,
            auth_id: authUser.id,
            email: String(authUser.email || profile.email || '').trim().toLowerCase(),
            roles: session.roles,
            activeRole: session.activeRole || ''
        });
        root.classList.remove('viegeo-auth-checking');
        guardStyle.remove();
        window.dispatchEvent(new CustomEvent('viegeo:auth-verified', {
            detail: { user: window.VieGeoCurrentUser, session: session }
        }));
        return window.VieGeoCurrentUser;
    }

    async function verifyCurrentUser() {
        var client = getClient();
        if (!client || typeof client.auth.getUser !== 'function') {
            throw new Error('AUTH_CLIENT_UNAVAILABLE');
        }

        var adminProfile = await readAdminServerSession();
        if (adminProfile && adminProfile.email) {
            var adminEmail = String(adminProfile.email).trim().toLowerCase();
            var adminRows = await withTimeout(client.from('users').select('*').eq('email', adminEmail).limit(1), CHECK_TIMEOUT_MS);
            var storedAdmin = Array.isArray(adminRows && adminRows.data) ? adminRows.data[0] : null;
            var mergedAdmin = Object.assign({}, adminProfile, storedAdmin || {}, {
                email: adminEmail,
                role: 'admin',
                roles: ['admin', 'cs', 'parent', 'user'],
                active_role: 'admin',
                account_status: 'premium',
                force_logout: false,
                isAdmin: true,
                isSuperAdmin: true
            });
            return finishVerification({ id: `admin:${adminEmail}`, email: adminEmail }, mergedAdmin);
        }

        var authResult = await withTimeout(client.auth.getUser(), CHECK_TIMEOUT_MS);
        var authUser = authResult && authResult.data && authResult.data.user;
        if (authResult && authResult.error) throw authResult.error;
        if (!authUser || !authUser.email) {
            redirectToLogin('auth_required');
            return null;
        }

        var email = String(authUser.email).trim().toLowerCase();
        var profileResult = await withTimeout(
            client.from('users').select('*').eq('email', email).limit(1),
            CHECK_TIMEOUT_MS
        );
        if (profileResult && profileResult.error) throw profileResult.error;
        var profile = Array.isArray(profileResult && profileResult.data) ? profileResult.data[0] : null;
        if (!profile) {
            try { await client.auth.signOut(); } catch (_) {}
            redirectToLogin('profile_required');
            return null;
        }

        if (profile.force_logout === true || profile.forceLogout === true) {
            try {
                await client.from('users').update({ force_logout: false }).eq('email', email);
            } catch (_) {}
            try { await client.auth.signOut(); } catch (_) {}
            redirectToLogin('session_revoked');
            return null;
        }

        return finishVerification(authUser, profile);
    }

    window.VieGeoAuthReady = verifyCurrentUser().catch(function (error) {
        console.error('[VieGeo Auth] Không thể xác minh tài khoản:', error);
        redirectToLogin(error && error.message === 'AUTH_CHECK_TIMEOUT' ? 'check_failed' : 'auth_required');
        return null;
    });

    var client = getClient();
    if (client && client.auth && typeof client.auth.onAuthStateChange === 'function') {
        client.auth.onAuthStateChange(function (event, session) {
            if (event === 'SIGNED_OUT' || (!session && event === 'TOKEN_REFRESHED')) {
                clearAdminServerSession().finally(function () { redirectToLogin('session_expired'); });
            }
        });
    }
})();
