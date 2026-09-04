(function () {
    'use strict';

    function client() {
        return window.supabaseClient || window.supabase || window.VieGeoSupabase?.client || null;
    }

    async function premiumSession() {
        try {
            const supabase = client();
            if (supabase?.auth?.getSession) {
                const result = await supabase.auth.getSession();
                const token = String(result?.data?.session?.access_token || '').trim();
                const profile = await window.VieGeoUserStore?.ready?.({ refreshStreak: false });
                if (token && profile?.is_premium === true) return { type: 'supabase', token };
            }
            return { type: 'none', token: '' };
        } catch (error) {
            console.warn('[VieGeo Premium AI] Không thể lấy phiên đăng nhập:', error);
            return { type: 'none', token: '' };
        }
    }

    async function request(action, payload) {
        try {
            const session = await premiumSession();
            if (session.type === 'none') {
                const sessionError = new Error('Phiên Premium chưa sẵn sàng.');
                sessionError.code = 'AUTH_SESSION_REQUIRED';
                throw sessionError;
            }
            const headers = { 'Content-Type': 'application/json' };
            if (session.token) headers.Authorization = `Bearer ${session.token}`;
            const response = await fetch('/api/premium-learning-ai', {
                method: 'POST',
                credentials: 'same-origin',
                headers,
                body: JSON.stringify(Object.assign({ action }, payload || {}))
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(String(data?.error || 'Chưa thể kết nối trợ lý Premium.'));
            return data;
        } catch (error) {
            if (error?.code !== 'AUTH_SESSION_REQUIRED') {
                console.warn('[VieGeo Premium AI] Không thể gửi yêu cầu:', error);
            }
            throw error;
        }
    }

    window.VieGeoPremiumLearning = Object.freeze({ request, premiumSession });
}());
