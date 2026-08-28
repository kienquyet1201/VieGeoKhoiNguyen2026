(function () {
    'use strict';

    function client() {
        return window.supabaseClient || window.supabase || window.VieGeoSupabase?.client || null;
    }

    async function accessToken() {
        try {
            const supabase = client();
            if (!supabase?.auth?.getSession) return '';
            const result = await supabase.auth.getSession();
            return String(result?.data?.session?.access_token || '').trim();
        } catch (error) {
            console.warn('[VieGeo Premium AI] Không thể lấy phiên đăng nhập:', error);
            return '';
        }
    }

    async function request(action, payload) {
        try {
            const token = await accessToken();
            if (!token) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            const response = await fetch('/api/premium-learning-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(Object.assign({ action }, payload || {}))
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(String(data?.error || 'Chưa thể kết nối trợ lý Premium.'));
            return data;
        } catch (error) {
            console.warn('[VieGeo Premium AI] Không thể gửi yêu cầu:', error);
            throw error;
        }
    }

    window.VieGeoPremiumLearning = Object.freeze({ request });
}());
