// ============================================================================
// VieGeo - profile.js (Supabase/localStorage Integration)
// ============================================================================

const profileForm = document.getElementById('profileForm');
const btnLogout = document.getElementById('btnLogout');
const btnPremium = document.getElementById('btnPremium'); // Nút Mua Premium mới

// Các field hiển thị
const dispName = document.getElementById('dispName');
const dispEmail = document.getElementById('dispEmail');
const profStreak = document.getElementById('profStreak');
const profXp = document.getElementById('profXp');
const profStyle = document.getElementById('profStyle');
const profileLevel = document.getElementById('profileLevel');
const profileProgressValue = document.getElementById('profileProgressValue');
const profileProgressFill = document.getElementById('profileProgressFill');
const profileNotificationList = document.getElementById('profileNotificationList');
const profileToast = document.getElementById('toast');
const premiumStatus = document.getElementById('premiumStatus');
const premiumCard = document.querySelector('.premium-card');
const premiumLearningPanel = document.getElementById('premiumLearningPanel');
const premiumLearningOutput = document.getElementById('premiumLearningOutput');
const premiumStreakRestoreButton = document.getElementById('premiumStreakRestoreButton');
const premiumStreakRestoreStatus = document.getElementById('premiumStreakRestoreStatus');

function showProfileToast(message, type = 'success') {
    if (!profileToast) return;
    profileToast.textContent = message;
    profileToast.className = `toast show ${type}`;
    window.clearTimeout(showProfileToast.timer);
    showProfileToast.timer = window.setTimeout(() => { profileToast.className = 'toast'; }, 3200);
}

// Các field nhập liệu
const profName = document.getElementById('profName');
const profPhone = document.getElementById('profPhone');
const profGender = document.getElementById('profGender');
const oldPass = document.getElementById('oldPass');
const newPass = document.getElementById('newPass');
const security = window.VieGeoSecurity || {
    sanitizeText: (value, max = 2000) => String(value || '').replace(/<[^>]*>/g, '').trim().slice(0, max),
    rateLimit: () => ({ allowed: true, retryAfterMs: 0 })
};
const cleanText = (value, max = 2000) => security.sanitizeText(value, max);
function getAuthClient() {
    const client = window.supabaseClient || window.supabase;
    return client && client.auth && typeof client.auth.updateUser === 'function' ? client : null;
}

function normalizeAchievementIds(source) {
    if (!Array.isArray(source)) return [];
    return source.map(item => String((item?.achievement_id ?? item?.achievementId ?? item?.code ?? item?.id ?? item) || '').trim()).filter(Boolean);
}

const PROFILE_ACHIEVEMENTS = [
    { id: 'ach_pvp_1', title: 'Tân binh Luyện thi', description: 'Chiến thắng 1 trận PvP', type: 'pvpWins', target: 1, icon: '⚔️' },
    { id: 'ach_pvp_10', title: 'Chiến binh Luyện thi', description: 'Chiến thắng 10 trận PvP', type: 'pvpWins', target: 10, icon: '🛡️' },
    { id: 'ach_pvp_99', title: 'Huyền thoại Luyện thi', description: 'Chiến thắng 99 trận PvP', type: 'pvpWins', target: 99, icon: '🏆' },
    { id: 'ach_lesson_1', title: 'Bước chân đầu tiên', description: 'Hoàn thành xuất sắc 1 bài học', type: 'perfectLessons', target: 1, icon: '📖' },
    { id: 'ach_lesson_10', title: 'Học bá Địa lý', description: 'Hoàn thành xuất sắc 10 bài học', type: 'perfectLessons', target: 10, icon: '🎓' },
    { id: 'ach_lesson_50', title: 'Học giả uyên bác', description: 'Hoàn thành xuất sắc 50 bài học', type: 'perfectLessons', target: 50, icon: '🏅' },
    { id: 'ach_streak_3', title: 'Khởi động bền bỉ', description: 'Đạt chuỗi học tập 3 ngày', type: 'streak', target: 3, icon: '🔥' },
    { id: 'ach_streak_7', title: 'Kiên trì bền bỉ', description: 'Đạt chuỗi học tập 7 ngày', type: 'streak', target: 7, icon: '🔥' },
    { id: 'ach_streak_30', title: 'Bậc thầy kỷ luật', description: 'Đạt chuỗi học tập 30 ngày', type: 'streak', target: 30, icon: '🌟' },
    { id: 'ach_gems_1k', title: 'Khởi nghiệp', description: 'Tích lũy 1.000 Gem', type: 'gems', target: 1000, icon: '💎' },
    { id: 'ach_gems_10k', title: 'Triệu phú VieGeo', description: 'Tích lũy 10.000 Gem', type: 'gems', target: 10000, icon: '👑' },
    { id: 'ach_chest_1', title: 'Chạm vào may mắn', description: 'Mở 1 rương báu', type: 'chestsOpened', target: 1, icon: '🎁' },
    { id: 'ach_chest_5', title: 'Thợ săn kho báu', description: 'Mở 5 rương báu', type: 'chestsOpened', target: 5, icon: '🗝️' },
    { id: 'season_explorer', title: 'Explorer', description: 'Phần thưởng mùa dành cho người chơi Top 1', type: 'seasonTop1', target: 1, icon: '🧭', seasonal: true, aliases: ['explorer', 'badge_explorer', 'season_top_1', 'top_1'] },
    { id: 'season_second_place', title: 'The King of Second Place', description: 'Phần thưởng mùa dành cho người chơi Top 2', type: 'seasonTop2', target: 1, icon: '👑', seasonal: true, aliases: ['the_king_of_second_place', 'king_of_second_place', 'season_top_2', 'top_2'] },
    { id: 'season_three_figures', title: 'Stories About Three Great Figures', description: 'Phần thưởng mùa dành cho người chơi Top 3', type: 'seasonTop3', target: 1, icon: '🏛️', seasonal: true, aliases: ['stories_about_three_great_figures', 'three_great_figures', 'season_top_3', 'top_3'] }
];
let profileEarnedAchievementIds = new Set();

function profileAchievementProgress(currentUser, type) {
    const storedState = currentUser?.game_state || currentUser?.gameState || gameState || {};
    const fields = {
        pvpWins: currentUser?.pvp_wins ?? currentUser?.pvpWins ?? storedState.pvpWins,
        perfectLessons: currentUser?.perfect_lessons ?? currentUser?.perfectLessons ?? storedState.perfectLessons,
        streak: currentUser?.current_streak ?? currentUser?.streak ?? storedState.streak,
        gems: currentUser?.gems ?? storedState.gems,
        chestsOpened: currentUser?.chests_opened ?? currentUser?.chestsOpened ?? storedState.chestsOpened,
        seasonTop1: currentUser?.season_top_1 ?? storedState.seasonTop1,
        seasonTop2: currentUser?.season_top_2 ?? storedState.seasonTop2,
        seasonTop3: currentUser?.season_top_3 ?? storedState.seasonTop3
    };
    return Math.max(0, Number(fields[type]) || 0);
}

function achievementKey(value) {
    return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function isAchievementAwarded(earnedIds, achievement) {
    const earnedKeys = new Set(normalizeAchievementIds(earnedIds).map(achievementKey));
    return [achievement.id, ...(achievement.aliases || [])]
        .some(id => earnedKeys.has(achievementKey(id)));
}

function renderAchievementModal(currentUser, earnedIds) {
    const list = document.getElementById('achievementModalList');
    const summary = document.getElementById('achievementModalSummary');
    if (!list || !summary) return;
    const earnedSet = new Set(normalizeAchievementIds(earnedIds));
    if (earnedSet.has('streak_7')) earnedSet.add('ach_streak_7');
    if (earnedSet.has('arena_top')) earnedSet.add('ach_pvp_1');
    profileEarnedAchievementIds = new Set();
    list.replaceChildren();

    PROFILE_ACHIEVEMENTS.forEach(achievement => {
        const earned = isAchievementAwarded([...earnedSet], achievement) || profileAchievementProgress(currentUser, achievement.type) >= achievement.target;
        if (earned) profileEarnedAchievementIds.add(achievement.id);
        const card = document.createElement('article');
        card.className = `achievement-modal-item${earned ? ' is-earned' : ''}`;
        if (achievement.seasonal) card.classList.add('is-seasonal');
        card.innerHTML = '<div class="achievement-modal-icon"></div><strong></strong><small></small><span class="achievement-modal-state"></span>';
        card.querySelector('.achievement-modal-icon').textContent = achievement.icon;
        card.querySelector('strong').textContent = achievement.title;
        card.querySelector('small').textContent = achievement.description;
        card.querySelector('.achievement-modal-state').textContent = earned ? 'Đã mở khóa' : 'Chưa mở khóa';
        list.appendChild(card);
    });
    summary.textContent = `Đã mở khóa ${profileEarnedAchievementIds.size}/${PROFILE_ACHIEVEMENTS.length} thành tựu`;
}

function openAchievementModal() {
    const modal = document.getElementById('achievementModal');
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('achievement-modal-open');
    document.getElementById('achievementModalClose')?.focus();
}

function closeAchievementModal() {
    const modal = document.getElementById('achievementModal');
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('achievement-modal-open');
}

async function syncAchievementBadges(currentUser) {
    const storedState = currentUser?.game_state || currentUser?.gameState || {};
    let earnedIds = normalizeAchievementIds(currentUser?.unlocked_achievements || currentUser?.unlockedAchievements || storedState.unlockedAchievements);

    const badgeIds = ['ach_lesson_1', 'ach_streak_7', 'ach_pvp_1', 'season_explorer', 'season_second_place', 'season_three_figures'];
    const badges = document.querySelectorAll('.achievement-panel .achievement-badge');
    badges.forEach((badge, index) => {
        const key = badge.dataset.achievementId || badgeIds[index];
        const achievement = PROFILE_ACHIEVEMENTS.find(item => item.id === key);
        const earned = Boolean(achievement && (
            isAchievementAwarded(earnedIds, achievement)
            || profileAchievementProgress(currentUser, achievement.type) >= achievement.target
            || (key === 'ach_streak_7' && earnedIds.some(id => /streak|chuoi/i.test(id)))
            || (key === 'ach_pvp_1' && earnedIds.some(id => /arena_top/i.test(id)))
        ));
        badge.classList.toggle('is-earned', earned);
        badge.setAttribute('aria-label', `${badge.textContent.trim()}${earned ? ' - đã đạt' : ' - chưa đạt'}`);
    });
    const total = earnedIds.length || Array.from(badges).filter(badge => badge.classList.contains('is-earned')).length;
    const summary = document.querySelector('.achievement-card strong');
    if (summary) summary.textContent = String(total);
    renderAchievementModal(currentUser, earnedIds);
    if (summary) summary.textContent = String(profileEarnedAchievementIds.size);
}

document.querySelectorAll('[data-open-achievements]').forEach(trigger => {
    trigger.addEventListener('click', openAchievementModal);
    trigger.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openAchievementModal();
        }
    });
});
document.getElementById('achievementModalClose')?.addEventListener('click', closeAchievementModal);
document.getElementById('achievementModal')?.addEventListener('click', event => {
    if (event.target.closest('[data-close-achievements]')) closeAchievementModal();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeAchievementModal();
});

// 1. Kiểm tra session
const sessionData = localStorage.getItem('lm_session');
const sessionUser = sessionData ? JSON.parse(sessionData) : {};

// Load Game State
function getGameState() {
    let state = localStorage.getItem('VieGeo_state');
    if (!state) return null;
    return JSON.parse(state);
}
const gameState = getGameState();
renderAchievementModal({}, []);

function profileClient() {
    const client = window.supabaseClient || window.supabase || window.VieGeoSupabase?.client;
    return client && typeof client.from === 'function' ? client : null;
}

async function getCurrentSupabaseAccessToken() {
    const client = profileClient();
    if (!client?.auth?.getSession) return '';
    try {
        const { data, error } = await client.auth.getSession();
        if (error) return '';
        return String(data?.session?.access_token || '').trim();
    } catch (_) {
        return '';
    }
}

function isPremiumProfile(user) {
    if (window.VieGeoPremium?.isActive) return window.VieGeoPremium.isActive(user);
    const source = user || {};
    const status = String(source.account_status ?? source.accountStatus ?? '').trim().toLowerCase();
    const roles = Array.isArray(source.roles) ? source.roles : [source.role, source.active_role];
    return ['premium', 'active', 'approved'].includes(status)
        || source.is_premium === true
        || source.isPremium === true
        || roles.some(role => String(role || '').trim().toLowerCase() === 'premium');
}

async function fetchLatestPremiumRequest(client, email) {
    const fetchByColumn = async column => {
        const result = await client
            .from('premium_requests')
            .select('*')
            .eq(column, email)
            .order('created_at', { ascending: false })
            .limit(5);
        return result.error ? [] : (Array.isArray(result.data) ? result.data : []);
    };
    const [byUserEmail, byEmail] = await Promise.all([
        fetchByColumn('user_email'),
        fetchByColumn('email')
    ]);
    const requests = [...byUserEmail, ...byEmail]
        .filter((request, index, rows) => index === rows.findIndex(item => String(item.id) === String(request.id)))
        .sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0));
    return requests[0] || null;
}

async function reconcileApprovedPremium(client, currentUser, latestRequest, email) {
    const accountStatus = String(currentUser?.account_status ?? currentUser?.accountStatus ?? '').trim().toLowerCase();
    const roles = Array.isArray(currentUser?.roles) ? currentUser.roles : [currentUser?.role, currentUser?.active_role];
    const hasLegacyPremiumSignal = currentUser?.is_premium === true
        || currentUser?.isPremium === true
        || roles.some(role => String(role || '').trim().toLowerCase() === 'premium');
    const shouldActivate = latestRequest?.status === 'approved' || hasLegacyPremiumSignal;
    if (!shouldActivate || ['premium', 'active', 'approved'].includes(accountStatus)) return currentUser;
    const now = new Date().toISOString();
    let result = await client
        .from('users')
        .update({ account_status: 'premium', updated_at: now })
        .eq('email', email)
        .select('*')
        .maybeSingle();
    if (result.error && /updated_at|column|schema/i.test(String(result.error.message || ''))) {
        result = await client
            .from('users')
            .update({ account_status: 'premium' })
            .eq('email', email)
            .select('*')
            .maybeSingle();
    }
    if (result.error) {
        console.warn('[VieGeo Premium] Chưa thể ghi lại trạng thái Premium vào users:', result.error.message || result.error);
        currentUser.account_status = 'premium';
        currentUser.accountStatus = 'premium';
        return currentUser;
    }
    return { ...currentUser, ...(result.data || {}), account_status: 'premium', accountStatus: 'premium' };
}

function persistPremiumState(premium) {
    try {
        if (window.VieGeoCurrentUser && typeof window.VieGeoCurrentUser === 'object') {
            window.VieGeoCurrentUser.account_status = premium ? 'premium' : 'free';
            window.VieGeoCurrentUser.accountStatus = premium ? 'premium' : 'free';
            window.VieGeoCurrentUser.isPremium = premium;
        }
        const session = JSON.parse(localStorage.getItem('lm_session') || '{}');
        session.accountStatus = premium ? 'premium' : 'free';
        session.isPremium = premium;
        localStorage.setItem('lm_session', JSON.stringify(session));

        const state = JSON.parse(localStorage.getItem('VieGeo_state') || '{}');
        state.accountStatus = premium ? 'premium' : 'free';
        localStorage.setItem('VieGeo_state', JSON.stringify(state));
        window.dispatchEvent(new CustomEvent('viegeo:premium-changed', { detail: { premium } }));
    } catch (error) {
        console.warn('[VieGeo Premium] Không thể cập nhật trạng thái cục bộ:', error);
    }
}

function renderPremiumState(currentUser, latestRequest) {
    const active = isPremiumProfile(currentUser) || latestRequest?.status === 'approved';
    const pending = !active && latestRequest?.status === 'pending';
    if (premiumStatus) {
        premiumStatus.textContent = active ? 'Tài khoản Premium' : 'Tài khoản Free';
        premiumStatus.classList.toggle('is-premium', active);
    }
    if (document.getElementById('sharedHeart') && active) document.getElementById('sharedHeart').textContent = '∞';

    if (premiumCard) {
        premiumCard.classList.toggle('is-active', active);
        premiumCard.classList.toggle('is-pending', pending);
        const heading = premiumCard.querySelector('h3');
        const description = premiumCard.querySelector('p');
        if (heading) heading.textContent = active ? 'Premium đã được kích hoạt' : (pending ? 'Yêu cầu đang chờ duyệt' : 'Mở khóa hành trình nâng cao');
        if (description) {
            description.textContent = active
                ? 'Bạn đang sử dụng đầy đủ quyền lợi Premium của VieGeo.'
                : (pending ? 'Quản trị viên đang xem xét yêu cầu nâng cấp của bạn.' : 'Truy cập thêm nội dung, thống kê chuyên sâu và trải nghiệm học tập cá nhân hóa.');
        }
    }

    if (btnPremium) {
        btnPremium.disabled = active || pending;
        btnPremium.innerHTML = active
            ? '<i class="fa-solid fa-circle-check"></i> Premium đang hoạt động'
            : (pending ? '<i class="fa-solid fa-clock"></i> Đang chờ duyệt' : '<i class="fa-solid fa-crown"></i> Yêu cầu mua Premium');
    }
    persistPremiumState(active);
    renderPremiumLearningTools(active, currentUser);
    return active;
}

function currentVietnamMonth() {
    try {
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
        const values = {};
        parts.forEach(part => { if (part.type !== 'literal') values[part.type] = part.value; });
        return `${values.year}-${values.month}-01`;
    } catch (error) {
        return new Date().toISOString().slice(0, 7) + '-01';
    }
}

function renderPremiumLearningTools(active, currentUser) {
    try {
        if (premiumLearningPanel) premiumLearningPanel.hidden = !active;
        if (!active) return;
        const sameMonth = String(currentUser?.streak_restore_month || '') === currentVietnamMonth();
        const used = sameMonth ? Math.max(0, Number(currentUser?.streak_restores_used) || 0) : 0;
        const remaining = Math.max(0, 3 - used);
        if (premiumStreakRestoreStatus) premiumStreakRestoreStatus.textContent = `Còn ${remaining}/3 lượt phục hồi trong tháng này.`;
        if (premiumStreakRestoreButton) premiumStreakRestoreButton.disabled = remaining <= 0;
        void getCurrentSupabaseAccessToken().then(token => {
            const available = Boolean(token);
            document.querySelectorAll('[data-premium-ai-action]').forEach(button => { button.disabled = !available; });
            if (premiumStreakRestoreButton) premiumStreakRestoreButton.disabled = !available || remaining <= 0;
            if (!available && premiumLearningOutput) {
                premiumLearningOutput.textContent = 'Vui lòng đăng nhập bằng tài khoản Supabase để dùng các công cụ Premium.';
            }
        });
    } catch (error) {
        console.warn('[VieGeo Premium] Không thể hiển thị công cụ học tập:', error);
    }
}

async function runPremiumLearningAction(action, button) {
    try {
        if (!isPremiumProfile(window.currentUserData || {})) throw new Error('Tính năng này dành cho tài khoản Premium.');
        if (!window.VieGeoPremiumLearning?.request) throw new Error('Trợ lý học tập chưa sẵn sàng.');
        if (!await getCurrentSupabaseAccessToken()) throw new Error('Phiên đăng nhập chưa sẵn sàng. Vui lòng đăng nhập lại.');
        if (button) { button.disabled = true; button.textContent = 'Đang chuẩn bị...'; }
        if (premiumLearningOutput) premiumLearningOutput.textContent = 'Trợ lý Premium đang phân tích dữ liệu học tập...';
        const response = await window.VieGeoPremiumLearning.request(action, {});
        if (premiumLearningOutput) premiumLearningOutput.textContent = String(response?.reply || 'Chưa có gợi ý phù hợp.');
    } catch (error) {
        if (premiumLearningOutput) premiumLearningOutput.textContent = error?.message || 'Chưa thể dùng trợ lý Premium lúc này.';
    } finally {
        if (button) { button.disabled = false; button.textContent = action === 'analysis' ? 'Phân tích điểm yếu' : 'Tạo bài tập về nhà'; }
    }
}

async function restorePremiumStreak() {
    try {
        const currentUser = window.currentUserData || {};
        const email = String(currentUser.email || sessionUser.email || '').trim().toLowerCase();
        if (!isPremiumProfile(currentUser)) throw new Error('Tính năng này dành cho tài khoản Premium.');
        if (!email || !window.VieGeoStreak?.restorePremiumStreak) throw new Error('Phiên học chưa sẵn sàng. Vui lòng đăng nhập lại.');
        if (!await getCurrentSupabaseAccessToken()) throw new Error('Phiên đăng nhập chưa sẵn sàng. Vui lòng đăng nhập lại.');
        if (premiumStreakRestoreButton) { premiumStreakRestoreButton.disabled = true; premiumStreakRestoreButton.textContent = 'Đang phục hồi...'; }
        const result = await window.VieGeoStreak.restorePremiumStreak({ email, profile: currentUser });
        currentUser.current_streak = Math.max(0, Number(result?.streak) || 0);
        currentUser.streak_restores_used = Number(result?.restoresUsed) || 0;
        currentUser.streak_restore_month = currentVietnamMonth();
        window.currentUserData = currentUser;
        if (profStreak) profStreak.textContent = String(currentUser.current_streak);
        renderPremiumLearningTools(true, currentUser);
        showProfileToast(`Đã phục hồi chuỗi ${currentUser.current_streak} ngày.`, 'success');
    } catch (error) {
        showProfileToast(error?.message || 'Chưa thể phục hồi chuỗi ngày học.', 'warning');
    } finally {
        if (premiumStreakRestoreButton) premiumStreakRestoreButton.textContent = 'Phục hồi chuỗi đã mất';
    }
}

function normalizeLearningKey(value) {
    try {
        return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    } catch (error) {
        return String(value || '').trim().toLowerCase();
    }
}

function lessonKey(row) {
    const details = row?.details || {};
    const province = normalizeLearningKey(row?.province || row?.province_slug || details.province || '');
    const rawIsland = row?.island || row?.sub_island || details.island || details.island_index || '';
    const match = String(rawIsland).match(/\d+/);
    const island = match ? Number(match[0]) : Number(rawIsland);
    return province && Number.isFinite(island) && island > 0 ? `${province}|${island}` : '';
}

async function fetchProfilePages(table, columns, email) {
    const client = profileClient();
    if (!client) throw new Error('Supabase client chưa sẵn sàng.');
    const rows = [];
    const pageSize = 1000;
    for (let page = 0; page < 50; page += 1) {
        let query = client.from(table).select(columns || '*');
        if (email) query = query.eq('user_email', email);
        const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;
        const pageRows = Array.isArray(data) ? data : [];
        rows.push(...pageRows);
        if (pageRows.length < pageSize) break;
    }
    return rows;
}

function normalizeNotifications(currentUser) {
    const remoteState = currentUser?.game_state && typeof currentUser.game_state === 'object' ? currentUser.game_state : {};
    const source = currentUser?.notifications ?? remoteState.notifications ?? [];
    if (!Array.isArray(source)) return [];
    return source.filter(Boolean).map((item, index) => typeof item === 'string'
        ? { id: `notice-${index}`, title: 'Thông báo', message: item, created_at: '' }
        : {
            id: item.id || `notice-${index}`,
            title: item.title || item.subject || 'Thông báo',
            message: item.message || item.content || item.text || '',
            created_at: item.created_at || item.createdAt || ''
        });
}

function renderNotifications(notifications) {
    if (!profileNotificationList) return;
    profileNotificationList.replaceChildren();
    if (!notifications || notifications.length === 0) {
        profileNotificationList.innerHTML = "<p class='empty-notice'>Chưa có thông báo mới</p>";
        return;
    }
    notifications.forEach(notification => {
        const item = document.createElement('article');
        item.className = 'notification-item';
        item.innerHTML = '<strong></strong><span></span>';
        item.querySelector('strong').textContent = String(notification.title || 'Thông báo');
        const date = notification.created_at ? new Date(notification.created_at) : null;
        const suffix = date && !Number.isNaN(date.getTime()) ? ` · ${date.toLocaleString('vi-VN')}` : '';
        item.querySelector('span').textContent = `${String(notification.message || '')}${suffix}`;
        profileNotificationList.appendChild(item);
    });
}

function renderProfileMetrics(currentUser, leaderboardRows, questionRows, submissionRows) {
    const email = String(currentUser?.email || '').trim().toLowerCase();
    const linkedRank = (Array.isArray(leaderboardRows) ? leaderboardRows : []).find(row =>
        (currentUser?.id !== undefined && currentUser?.id !== null && String(row?.user_id ?? '') === String(currentUser.id))
        || String(row?.user_email || row?.email || '').trim().toLowerCase() === email
    );
    const score = Math.max(0, Number(currentUser?.score ?? linkedRank?.score ?? 0) || 0);
    const level = Math.floor(score / 100) + 1;
    const totalLessons = new Set((Array.isArray(questionRows) ? questionRows : []).map(lessonKey).filter(Boolean));
    const completedLessons = new Set((Array.isArray(submissionRows) ? submissionRows : []).map(lessonKey).filter(key => key && totalLessons.has(key)));
    const progress = totalLessons.size > 0 ? Math.min(100, Math.round(completedLessons.size / totalLessons.size * 100)) : 0;

    if (profileLevel) profileLevel.textContent = `Cấp ${level}`;
    if (profileProgressValue) profileProgressValue.textContent = `${progress}%`;
    if (profileProgressFill) profileProgressFill.style.width = `${progress}%`;
}

// 2. Tải thông tin hồ sơ
async function loadProfile() {
    try {
        const client = profileClient();
        if (!client) throw new Error('Supabase client chưa sẵn sàng.');
        let authUser = null;
        if (client.auth && typeof client.auth.getUser === 'function') {
            const authResult = await client.auth.getUser();
            authUser = authResult?.data?.user || null;
        }
        const email = String(authUser?.email || sessionUser.email || '').trim().toLowerCase();
        if (!email) throw new Error('Không xác định được tài khoản hiện tại.');

        let userResult = await client.from('users').select('*').eq('email', email).maybeSingle();
        if (userResult.error && /email|column|schema/i.test(String(userResult.error.message || ''))) {
            const compatibleResult = await client.from('users').select('*');
            if (compatibleResult.error) throw compatibleResult.error;
            userResult = {
                data: (compatibleResult.data || []).find(row => String(row.email || row.user_email || '').trim().toLowerCase() === email) || null,
                error: null
            };
        }
        if (userResult.error) throw userResult.error;
        let currentUser = userResult.data || {
            email,
            name: authUser?.user_metadata?.name || sessionUser.name || sessionUser.displayName || 'Người chơi',
            phone: '', gender: '', role: 'user', score: 0, current_streak: 0
        };
        const [leaderboardResult, questionRows, submissionRows, latestPremiumRequest] = await Promise.all([
            client.from('leaderboard').select('*').limit(500),
            fetchProfilePages('questions', 'province,island'),
            fetchProfilePages('submissions', '*', email),
            fetchLatestPremiumRequest(client, email)
        ]);
        currentUser = await reconcileApprovedPremium(client, currentUser, latestPremiumRequest, email);
        const leaderboardRows = leaderboardResult.error ? [] : (Array.isArray(leaderboardResult.data) ? leaderboardResult.data : []);
        
        dispName.textContent = currentUser.name || currentUser.full_name || currentUser.display_name || 'Người chơi';
        dispEmail.textContent = currentUser.email;

        profStreak.textContent = Number(currentUser.current_streak || 0);
        profXp.textContent = Number(currentUser.xp ?? currentUser.score ?? 0) || 0;
        renderProfileMetrics(currentUser, leaderboardRows, questionRows, submissionRows);
        const notifications = normalizeNotifications(currentUser);
        const premiumApproved = latestPremiumRequest?.status === 'approved';
        if (premiumApproved && !notifications.some(item => item.id === `premium-approved-${latestPremiumRequest.id}`)) {
            notifications.unshift({ id: `premium-approved-${latestPremiumRequest.id}`, title: 'Premium đã được kích hoạt', message: 'Yêu cầu nâng cấp của bạn đã được duyệt thành công.', created_at: latestPremiumRequest.reviewed_at || latestPremiumRequest.updated_at || latestPremiumRequest.created_at });
        }
        renderNotifications(notifications);
        renderPremiumState(currentUser, latestPremiumRequest);
        
        let evalText = "Chưa test";
        if (gameState && gameState.assessmentScore !== undefined) {
            if (gameState.assessmentScore <= 4) evalText = "Chưa có kiến thức";
            else if (gameState.assessmentScore <= 8) evalText = "Kiến thức cơ bản";
            else evalText = "Hiểu biết thâm sâu";
        }
        profStyle.textContent = evalText;

        profName.value = currentUser.name || '';
        profPhone.value = currentUser.phone || '';
        profGender.value = currentUser.gender || '';
        
        // Lưu data hiện tại
        window.currentUserData = currentUser;
        await syncAchievementBadges(currentUser);
        
    } catch (err) {
        console.warn("Không thể tải profile từ Supabase:", err);
        if (profileLevel) profileLevel.textContent = 'Cấp 1';
        if (profileProgressValue) profileProgressValue.textContent = '0%';
        if (profileProgressFill) profileProgressFill.style.width = '0%';
        renderNotifications([]);
        renderAchievementModal({}, []);
    }
}

loadProfile();

// 3. Cập nhật thông tin (Tên, SĐT, Mật khẩu)
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newName = cleanText(profName.value, 120);
        const newPhone = cleanText(profPhone.value, 32);
        const newGender = ['male', 'female', 'other', 'prefer_not_to_say'].includes(String(profGender.value || '').toLowerCase()) ? String(profGender.value).toLowerCase() : '';
        const inputOldPass = oldPass.value;
        const inputNewPass = newPass.value;
        
        const updateData = {
            name: newName,
            phone: newPhone,
            gender: newGender
        };
        
        // Logic đổi mật khẩu
        if (inputOldPass || inputNewPass) {
            if (!inputOldPass || !inputNewPass) {
                showProfileToast('Vui lòng nhập cả mật khẩu cũ và mật khẩu mới để đổi mật khẩu!', 'warning');
                return;
            }
            if (window.currentUserData.password && inputOldPass !== window.currentUserData.password) {
                showProfileToast('Mật khẩu cũ không chính xác!', 'error');
                return;
            }
            if (inputNewPass.length < 8 || inputNewPass.length > 128) {
                showProfileToast('Mật khẩu mới phải từ 8 đến 128 ký tự.', 'warning');
                return;
            }
            const authClient = getAuthClient();
            if (!authClient) {
                showProfileToast('Phiên đăng nhập chưa sẵn sàng. Vui lòng đăng nhập lại rồi thử tiếp.', 'warning');
                return;
            }
            const { error } = await authClient.auth.updateUser({ password: inputNewPass });
            if (error) throw error;
            updateData.password = null;
            updateData.passwordUpdatedAt = new Date().toISOString();
        }

        try {
            const btn = profileForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = "Đang lưu...";
            
            await db.collection('users').doc(sessionUser.email).update(updateData);
            
            // Cập nhật session nếu đổi tên
            localStorage.setItem('lm_session', JSON.stringify({ ...sessionUser, name: newName, gender: newGender }));
            
            showProfileToast('Đã lưu thông tin thành công!', 'success');
            
            oldPass.value = '';
            newPass.value = '';
            
            btn.disabled = false;
            btn.textContent = "Lưu Thay Đổi";
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            showProfileToast('Lỗi khi lưu thông tin. Vui lòng thử lại sau.', 'error');
        }
    });
}

// Yêu cầu Premium
if (btnPremium) {
    btnPremium.addEventListener('click', async () => {
        btnPremium.disabled = true;
        btnPremium.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
        
        try {
            const limit = security.rateLimit(`premium_${sessionUser.email}`, { limit: 3, windowMs: 10 * 60 * 1000 });
            if (!limit.allowed) throw new Error(`Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ${Math.ceil(limit.retryAfterMs / 1000)}s.`);
            await db.collection('premium_requests').add({
                email: sessionUser.email,
                name: cleanText(sessionUser.name, 120),
                status: 'pending',
                created_at: new Date().toISOString()
            });
            showProfileToast('Đã gửi yêu cầu Premium. Bạn sẽ nhận thông báo ngay khi được duyệt.', 'success');
            renderPremiumState(window.currentUserData || {}, { status: 'pending' });
        } catch (error) {
            console.error("Lỗi premium:", error);
            showProfileToast('Chưa thể gửi yêu cầu Premium. Vui lòng thử lại.', 'error');
            btnPremium.disabled = false;
            btnPremium.innerHTML = '<i class="fa-solid fa-crown"></i> Yêu cầu Mua Premium';
        }
    });
}

document.querySelectorAll('[data-premium-ai-action]').forEach(button => {
    button.addEventListener('click', () => runPremiumLearningAction(button.dataset.premiumAiAction, button));
});
if (premiumStreakRestoreButton) premiumStreakRestoreButton.addEventListener('click', restorePremiumStreak);

// 4. Đăng xuất (Fix lỗi rò rỉ dữ liệu)
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        // Xóa TOÀN BỘ dữ liệu local để tránh rò rỉ PvP sang acc khác
        localStorage.clear(); 
        window.location.href = '/loginout';
    });
}
