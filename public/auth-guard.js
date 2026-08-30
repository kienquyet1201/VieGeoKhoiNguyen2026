(function () {
    'use strict';

    var LOGIN_ROUTE = '/loginout';
    var CHECK_TIMEOUT_MS = 12000;
    var ADMIN_SESSION_PROOFS = {
        'kienquyet1201@gmail.com': 'root:e1d9ebc55fd6baff0590282d9d7d5302047b7ab6ca817c6a47b30b791da3e282',
        'admin@viegeo.local': 'master:c1c224b03cd9bc7b6a86d77f5dace40191766c485cd55dc48caf9ac873335d6f'
    };
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
        var values = [];
        var append = function (value) {
            if (Array.isArray(value)) {
                value.forEach(append);
                return;
            }
            if (typeof value !== 'string') return;
            var trimmed = value.trim();
            if (!trimmed) return;
            if ((trimmed.charAt(0) === '[' && trimmed.charAt(trimmed.length - 1) === ']') || trimmed.indexOf(',') >= 0) {
                try {
                    var parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(append);
                        return;
                    }
                } catch (_) {}
                trimmed.split(',').forEach(append);
                return;
            }
            values.push(trimmed);
        };
        var hasExplicitRoles = Boolean(profile && Object.prototype.hasOwnProperty.call(profile, 'roles'));
        append(profile && profile.roles);
        if (!hasExplicitRoles) {
            append(profile && profile.active_role);
            append(profile && profile.role);
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
            authReady: true,
            authenticatedAt: previous.authenticatedAt || Date.now(),
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

    function waitFor(ms) {
        return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
    }

    async function readPersistedAuthSession(client, localSession) {
        var loginWasJustCompleted = Boolean(
            localSession && localSession.authReady === true
            && Date.now() - Number(localSession.authenticatedAt || 0) < 10000
        );

        for (var attempt = 0; attempt < 3; attempt += 1) {
            var result = await withTimeout(client.auth.getSession(), CHECK_TIMEOUT_MS);
            if (result && result.error) throw result.error;
            if (result && result.data && result.data.session && result.data.session.access_token) {
                return result.data.session;
            }
            if (!loginWasJustCompleted || attempt === 2) break;
            await waitFor(180);
        }
        return null;
    }

    async function restoreMissingUserProfile(client, authUser) {
        var email = String(authUser && authUser.email || '').trim().toLowerCase();
        if (!email || !authUser || !authUser.id) return null;

        var metadata = authUser.user_metadata || {};
        var now = new Date().toISOString();
        var profile = {
            id: authUser.id,
            email: email,
            user_name: metadata.user_name || metadata.name || metadata.full_name || email.split('@')[0],
            role: 'user',
            current_streak: 0,
            created_at: authUser.created_at || now,
            updated_at: now
        };
        var created = await withTimeout(
            client.from('users').insert([profile]).select('*').maybeSingle(),
            CHECK_TIMEOUT_MS
        );
        if (created && created.error) {
            // Support older schemas where the primary key is an auto-generated value.
            var identityProfile = Object.assign({}, profile);
            delete identityProfile.id;
            created = await withTimeout(
                client.from('users').insert([identityProfile]).select('*').maybeSingle(),
                CHECK_TIMEOUT_MS
            );
        }
        if (created && created.error) throw created.error;
        if (created && created.data) return created.data;

        var reloaded = await withTimeout(
            client.from('users').select('*').eq('email', email).limit(1),
            CHECK_TIMEOUT_MS
        );
        if (reloaded && reloaded.error) throw reloaded.error;
        return Array.isArray(reloaded && reloaded.data) ? reloaded.data[0] || null : null;
    }

    async function restoreBootstrapAdminProfile(client, email) {
        var ids = {
            'admin@viegeo.local': '00000000-0000-4000-8000-000000000001',
            'kienquyet1201@gmail.com': '00000000-0000-4000-8000-000000000002'
        };
        var now = new Date().toISOString();
        var profile = {
            id: ids[email],
            email: email,
            user_name: email === 'admin@viegeo.local' ? 'Admin Tổng' : 'Đặng Kiên Quyết',
            role: 'admin',
            current_streak: 0,
            created_at: now,
            updated_at: now
        };
        var created = await withTimeout(
            client.from('users').insert([profile]).select('*').maybeSingle(),
            CHECK_TIMEOUT_MS
        );
        if (created && created.error) throw created.error;
        return created && created.data ? created.data : null;
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

        var localSession = readLocalSession();
        var localAdminEmail = String(localSession.email || '').trim().toLowerCase();
        var expectedAdminProof = ADMIN_SESSION_PROOFS[localAdminEmail];
        if (expectedAdminProof && localSession.adminSessionProof === expectedAdminProof && localSession.isSuperAdmin === true) {
            var adminRows = await withTimeout(client.from('users').select('*').eq('email', localAdminEmail).limit(1), CHECK_TIMEOUT_MS);
            if (adminRows && adminRows.error) throw adminRows.error;
            var storedAdmin = Array.isArray(adminRows && adminRows.data) ? adminRows.data[0] : null;
            if (!storedAdmin || !normalizeRoles(storedAdmin).includes('admin')) {
                storedAdmin = await restoreBootstrapAdminProfile(client, localAdminEmail);
                if (!storedAdmin) {
                    redirectToLogin('profile_required');
                    return null;
                }
            }
            var mergedAdmin = Object.assign({}, storedAdmin, {
                email: localAdminEmail,
                name: storedAdmin.name || storedAdmin.full_name || storedAdmin.user_name || localSession.name || 'Admin Tổng',
                role: 'admin',
                roles: ['admin', 'cs', 'parent', 'user'],
                active_role: 'admin',
                account_status: 'premium',
                force_logout: false,
                isAdmin: true,
                isSuperAdmin: true
            });
            return finishVerification({ id: `admin:${localAdminEmail}`, email: localAdminEmail }, mergedAdmin);
        }

        var persistedSession = await readPersistedAuthSession(client, localSession);
        if (!persistedSession) {
            redirectToLogin('auth_required');
            return null;
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
            profile = await restoreMissingUserProfile(client, authUser);
            if (!profile) {
                try { await client.auth.signOut(); } catch (_) {}
                redirectToLogin('profile_required');
                return null;
            }
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
            if (event === 'SIGNED_OUT') {
                clearAdminServerSession().finally(function () { redirectToLogin('session_expired'); });
            }
            if (event === 'TOKEN_REFRESHED' && !session) {
                window.setTimeout(function () {
                    client.auth.getSession().then(function (result) {
                        if (!result || !result.data || !result.data.session) {
                            clearAdminServerSession().finally(function () { redirectToLogin('session_expired'); });
                        }
                    }).catch(function () {
                        clearAdminServerSession().finally(function () { redirectToLogin('session_expired'); });
                    });
                }, 250);
            }
        });
    }
})();
