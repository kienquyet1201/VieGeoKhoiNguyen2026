(function () {
    'use strict';

    function vietnamDate(value) {
        try {
            var date = value ? new Date(value) : new Date();
            var parts = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
            }).formatToParts(date);
            var values = {};
            parts.forEach(function (part) { if (part.type !== 'literal') values[part.type] = part.value; });
            return values.year + '-' + values.month + '-' + values.day;
        } catch (error) {
            console.warn('[VieGeo Streak] Không thể chuẩn hóa ngày:', error);
            return new Date().toISOString().slice(0, 10);
        }
    }

    async function refreshForCurrentUser() {
        try {
            var profile = await window.VieGeoUserStore?.reload?.();
            return profile ? Number(profile.streak) || 0 : null;
        } catch (error) {
            console.warn('[VieGeo Streak] Không thể làm mới chuỗi ngày học:', error);
            return null;
        }
    }

    async function applyForLesson() {
        // Lesson rewards are intentionally handled by VieGeoUserStore.completeLesson -> complete_lesson RPC.
        var streak = await refreshForCurrentUser();
        return { streak: Number(streak) || 0, awarded: false, recovered: false, reset: false, synced: true };
    }

    async function restorePremiumStreak() {
        try {
            var client = window.supabaseClient || window.supabase || window.VieGeoSupabase?.client;
            var profile = await window.VieGeoUserStore?.ready?.({ refreshStreak: false });
            if (!client || !profile?.is_premium) throw new Error('Tính năng phục hồi chuỗi chỉ dành cho tài khoản Premium.');
            var result = await client.rpc('restore_own_premium_streak');
            if (result.error) throw new Error(result.error.message || 'Không thể phục hồi chuỗi ngày học.');
            await window.VieGeoUserStore.reload();
            var row = Array.isArray(result.data) ? result.data[0] : result.data;
            return {
                streak: Number(row?.streak) || 0,
                restoresUsed: Number(row?.restores_used) || 0,
                restoresRemaining: Number(row?.restores_remaining) || 0,
                restored: true
            };
        } catch (error) {
            console.warn('[VieGeo Streak] Không thể phục hồi Streak Premium:', error);
            throw error;
        }
    }

    window.VieGeoStreak = { applyForLesson: applyForLesson, refreshForCurrentUser: refreshForCurrentUser, restorePremiumStreak: restorePremiumStreak, vietnamDate: vietnamDate };
}());
