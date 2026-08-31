(function () {
    'use strict';

    function getClient() {
        return window.supabaseClient || window.supabase || window.VieGeoSupabase?.client || null;
    }

    function vietnamDate(value) {
        try {
            const date = value ? new Date(value) : new Date();
            const parts = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
            }).formatToParts(date);
            const values = {};
            parts.forEach(part => { if (part.type !== 'literal') values[part.type] = part.value; });
            return `${values.year}-${values.month}-${values.day}`;
        } catch (error) {
            console.warn('[VieGeo Streak] Không thể chuẩn hóa ngày:', error);
            return new Date().toISOString().slice(0, 10);
        }
    }

    function dayDistance(from, to) {
        try {
            if (!from || !to) return Number.POSITIVE_INFINITY;
            const start = Date.parse(`${from}T00:00:00Z`);
            const end = Date.parse(`${to}T00:00:00Z`);
            return Number.isFinite(start) && Number.isFinite(end) ? Math.round((end - start) / 86400000) : Number.POSITIVE_INFINITY;
        } catch (error) {
            console.warn('[VieGeo Streak] Không thể tính khoảng cách ngày:', error);
            return Number.POSITIVE_INFINITY;
        }
    }

    function isPremium(profile) {
        try {
            const values = [profile?.role, profile?.active_role, profile?.account_status, profile?.accountStatus]
                .concat(Array.isArray(profile?.roles) ? profile.roles : []);
            return profile?.is_premium === true || profile?.isPremium === true || values.some(value => String(value || '').trim().toLowerCase() === 'premium');
        } catch (error) {
            console.warn('[VieGeo Streak] Không thể xác định trạng thái Premium:', error);
            return false;
        }
    }

    function submissionStars(row) {
        try {
            const details = row?.details || {};
            const explicit = Number(details.stars ?? row?.stars);
            if (Number.isFinite(explicit)) return Math.max(0, Math.min(3, Math.round(explicit)));
            const correct = Number(row?.correct_count ?? details.correct_count ?? details.correctAnswers);
            if (correct >= 5) return 3;
            if (correct >= 3) return 2;
            return correct >= 1 ? 1 : 0;
        } catch (error) {
            console.warn('[VieGeo Streak] Không thể đọc số sao bài học:', error);
            return 0;
        }
    }

    function fallbackStreak(options) {
        try {
            const today = options.today || vietnamDate();
            const stars = Math.max(0, Math.min(3, Number(options.stars) || 0));
            const current = Math.max(0, Number(options.currentStreak) || 0);
            const premium = isPremium(options.profile);
            const previous = (Array.isArray(options.previousSubmissions) ? options.previousSubmissions : [])
                .filter(row => submissionStars(row) >= 2)
                .map(row => vietnamDate(row?.created_at || row?.submitted_at || row?.details?.completed_at))
                .filter(Boolean)
                .sort()
                .pop() || '';
            const distance = dayDistance(previous, today);
            let streak = current;
            let reset = false;
            let recovered = false;
            let awarded = false;

            if (distance > (premium ? 2 : 1)) {
                streak = 0;
                reset = current > 0;
            }
            if (stars < 2 || distance === 0) return { streak, awarded, recovered, reset, synced: false };

            if (distance === 1) {
                streak = Math.max(0, streak) + 1;
            } else if (premium && distance === 2) {
                streak = Math.max(0, streak) + 1;
                recovered = true;
            } else {
                streak = 1;
            }
            awarded = true;
            return { streak, awarded, recovered, reset, synced: false };
        } catch (error) {
            console.warn('[VieGeo Streak] Không thể dùng cơ chế dự phòng:', error);
            return { streak: Math.max(0, Number(options?.currentStreak) || 0), awarded: false, recovered: false, reset: false, synced: false };
        }
    }

    async function hasMatchingAuthSession(client, email) {
        try {
            const result = await client?.auth?.getSession?.();
            const session = result?.data?.session;
            const sessionEmail = String(session?.user?.email || '').trim().toLowerCase();
            return Boolean(session?.access_token && sessionEmail && sessionEmail === String(email || '').trim().toLowerCase());
        } catch (_) {
            return false;
        }
    }

    async function saveFallbackStreak(client, email, fallback, profile) {
        try {
            if (!client?.from || !email || !profile?.id || Number(profile.current_streak) === Number(fallback.streak)) return fallback;
            if (!await hasMatchingAuthSession(client, email)) return fallback;
            const { error } = await client.from('users').update({ current_streak: fallback.streak }).eq('id', profile.id);
            if (error) throw error;
            return Object.assign({}, fallback, { synced: true });
        } catch (error) {
            console.warn('[VieGeo Streak] Không thể lưu Streak dự phòng:', error);
            return fallback;
        }
    }

    async function applyForLesson(options) {
        try {
            const client = options?.client || getClient();
            const email = String(options?.email || '').trim().toLowerCase();
            const stars = Math.max(0, Math.min(3, Number(options?.stars) || 0));
            if (!client || !email) return fallbackStreak(options || {});

            const fallback = fallbackStreak(Object.assign({}, options, { stars }));
            // Bootstrap/local sessions have no Supabase JWT and must never call
            // protected RPC functions for another account.
            if (!await hasMatchingAuthSession(client, email)) return fallback;

            const { data, error } = await client.rpc('apply_lesson_streak', {
                p_user_email: email,
                p_stars: stars
            });
            if (!error) {
                const row = Array.isArray(data) ? data[0] : data;
                if (row && row.current_streak !== undefined) {
                    return {
                        streak: Math.max(0, Number(row.current_streak) || 0),
                        awarded: row.awarded === true,
                        recovered: row.recovered === true,
                        reset: row.reset === true,
                        synced: true
                    };
                }
            } else if (String(error.code || '') !== 'P0001') {
                console.warn('[VieGeo Streak] RPC không khả dụng, dùng cơ chế dự phòng:', error);
            }

            return await saveFallbackStreak(client, email, fallback, options?.profile);
        } catch (error) {
            console.warn('[VieGeo Streak] Không thể áp dụng Streak:', error);
            return fallbackStreak(options || {});
        }
    }

    async function refreshForCurrentUser(options) {
        try {
            const client = options?.client || getClient();
            const email = String(options?.email || '').trim().toLowerCase();
            if (!client || !email) return null;
            if (!await hasMatchingAuthSession(client, email)) return null;
            const { data, error } = await client.rpc('refresh_user_streak', { p_user_email: email });
            if (error) {
                if (String(error.code || '') !== 'P0001') {
                    console.warn('[VieGeo Streak] Không thể làm mới Streak:', error);
                }
                return null;
            }
            const row = Array.isArray(data) ? data[0] : data;
            return row && row.current_streak !== undefined ? Math.max(0, Number(row.current_streak) || 0) : null;
        } catch (error) {
            console.warn('[VieGeo Streak] Không thể làm mới Streak:', error);
            return null;
        }
    }

    async function restorePremiumStreak(options) {
        try {
            const client = options?.client || getClient();
            const email = String(options?.email || '').trim().toLowerCase();
            if (!client || !email) throw new Error('Phiên đăng nhập chưa sẵn sàng.');
            if (!isPremium(options?.profile || {})) throw new Error('Tính năng phục hồi chuỗi chỉ dành cho tài khoản Premium.');
            const sessionResult = await client.auth?.getSession?.();
            if (!sessionResult?.data?.session?.access_token) {
                const sessionError = new Error('Phiên đăng nhập chưa sẵn sàng. Vui lòng đăng nhập lại.');
                sessionError.code = 'AUTH_SESSION_REQUIRED';
                throw sessionError;
            }
            const { data, error } = await client.rpc('restore_premium_streak', { p_user_email: email });
            if (error) throw new Error(error.message || 'Không thể phục hồi chuỗi ngày học.');
            const row = Array.isArray(data) ? data[0] : data;
            if (!row || row.current_streak === undefined) throw new Error('Không có chuỗi ngày học đủ điều kiện để phục hồi.');
            return {
                streak: Math.max(0, Number(row.current_streak) || 0),
                restoresUsed: Math.max(0, Number(row.restores_used) || 0),
                restoresRemaining: Math.max(0, Number(row.restores_remaining) || 0),
                restored: row.restored === true
            };
        } catch (error) {
            if (error?.code !== 'AUTH_SESSION_REQUIRED') {
                console.warn('[VieGeo Streak] Không thể phục hồi Streak Premium:', error);
            }
            throw error;
        }
    }

    window.VieGeoStreak = {
        applyForLesson,
        refreshForCurrentUser,
        restorePremiumStreak,
        vietnamDate
    };
}());
