(function () {
    'use strict';

    var LOGIN_ROUTE = '/loginout';
    var root = document.documentElement;
    root.classList.add('viegeo-auth-checking');

    var guardStyle = document.createElement('style');
    guardStyle.id = 'viegeo-auth-guard-style';
    guardStyle.textContent = [
        'html.viegeo-auth-checking body { visibility: hidden !important; }',
        'html.viegeo-auth-checking::before { content: "Đang kiểm tra tài khoản..."; position:fixed; inset:0; z-index:2147483647; display:grid; place-items:center; background:#081426; color:#e8f5ff; font:700 15px/1.5 system-ui,sans-serif; visibility:visible; }'
    ].join('');
    document.head.appendChild(guardStyle);

    function getClient() {
        return window.supabaseClient || window.supabase || window.VieGeoSupabase?.client || null;
    }

    function redirectToLogin(reason) {
        if (location.pathname === LOGIN_ROUTE || location.pathname === LOGIN_ROUTE + '.html') return;
        try {
            sessionStorage.setItem('viegeo_return_after_login', location.pathname + location.search + location.hash);
            sessionStorage.setItem('viegeo_auth_reason', reason || 'auth_required');
            sessionStorage.removeItem('viegeo_active_role');
        } catch (_) {}
        location.replace(LOGIN_ROUTE + '?reason=' + encodeURIComponent(reason || 'auth_required'));
    }

    function removeCheckingMask() {
        root.classList.remove('viegeo-auth-checking');
        guardStyle.remove();
    }

    async function verifyCurrentUser() {
        try {
            var client = getClient();
            if (!client?.auth?.getSession || !window.VieGeoUserStore) throw new Error('AUTH_CLIENT_UNAVAILABLE');
            var sessionResult = await client.auth.getSession();
            var session = sessionResult?.data?.session;
            if (!session?.access_token || !session?.user?.id) {
                redirectToLogin('auth_required');
                return null;
            }

            var profile = await window.VieGeoUserStore.ready({ refreshStreak: true });
            if (!profile || profile.id !== session.user.id) {
                await window.VieGeoUserStore.signOut();
                redirectToLogin('profile_required');
                return null;
            }

            window.VieGeoCurrentUser = profile;
            removeCheckingMask();
            window.dispatchEvent(new CustomEvent('viegeo:auth-verified', {
                detail: { user: profile, session: session }
            }));
            return profile;
        } catch (error) {
            console.error('[VieGeo Auth] Không thể xác minh phiên Supabase:', error?.message || error);
            redirectToLogin('auth_required');
            return null;
        }
    }

    window.VieGeoLogout = async function (destination) {
        try { await window.VieGeoUserStore?.signOut(); } catch (_) {}
        window.location.assign(destination || LOGIN_ROUTE);
    };

    window.VieGeoAuthReady = verifyCurrentUser();

    var client = getClient();
    if (client?.auth?.onAuthStateChange) {
        client.auth.onAuthStateChange(function (event, session) {
            if (event === 'SIGNED_OUT' || ((event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && !session)) {
                redirectToLogin('session_expired');
            }
        });
    }
}());
