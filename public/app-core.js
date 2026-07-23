// ============================================================================
// VieGeo - app-core.js (SPA Logic & Rendering - Arena Update)
// ============================================================================

// These must be initialized before getHeartAwareGameState() is invoked.
const HEARTS_MAX = 3;
const HEART_REGEN_MS = 15 * 60 * 1000;
let heartTimerInterval = null;
let heartRemoteHydrated = false;
let lessonEntryInProgress = false;
let gameState = window.gameState || null;

// Shared UI notifications, consolidated here from the removed patch script.
window.VieGeoUI = window.VieGeoUI || {
    alert(message, options = {}) {
        try {
            if (window.Swal && typeof window.Swal.fire === 'function') {
                return window.Swal.fire({
                    title: 'Thông báo', text: String(message || ''), icon: 'info',
                    confirmButtonColor: '#1cb0f6', background: '#13253a', color: '#f0f4f8',
                    heightAuto: false, ...options
                });
            }
            console.warn('[VieGeo]', message);
        } catch (error) { console.error('Notification error:', error); }
        return Promise.resolve({ isConfirmed: true });
    },
    success(message, options = {}) { return this.alert(message, { title: 'Thành công', icon: 'success', ...options }); },
    warning(message, options = {}) { return this.alert(message, { title: 'Lưu ý', icon: 'warning', ...options }); },
    error(message, options = {}) { return this.alert(message, { title: 'Đã xảy ra lỗi', icon: 'error', ...options }); }
};

const ROLE_META = Object.freeze({
    user: { label: 'Học sinh', route: '/map' },
    parent: { label: 'Phụ huynh', route: '/parent' },
    cs: { label: 'Chăm sóc KH', route: '/cs-dashboard' },
    admin: { label: 'Quản trị viên', route: '/admin' }
});

function normalizeRole(role) {
    const aliases = { map: 'user', student: 'user', cskh: 'cs', support: 'cs' };
    const value = String(role || '').trim().toLowerCase();
    return aliases[value] || value;
}

function authorizedRoles(source) {
    const roles = Array.isArray(source && source.roles)
        ? source.roles
        : [source && (source.activeRole || source.role)];
    const result = [...new Set(roles.map(normalizeRole).filter((role) => Boolean(ROLE_META[role])))];
    return result.length ? result : ['user'];
}

function persistSessionRoles(roles, activeRole) {
    const session = JSON.parse(localStorage.getItem('lm_session') || '{}');
    const safeRoles = authorizedRoles({ roles });
    const role = safeRoles.includes(normalizeRole(activeRole)) ? normalizeRole(activeRole) : safeRoles[0];
    session.roles = safeRoles;
    session.role = role;
    session.activeRole = role;
    localStorage.setItem('lm_session', JSON.stringify(session));
    return session;
}

function renderRoleSwitcher(source) {
    const wrapper = document.getElementById('roleSwitcherWrap');
    const select = document.getElementById('roleSwitcherSelect');
    if (!wrapper || !select) return;

    const roles = authorizedRoles(source);
    wrapper.hidden = roles.length < 2;
    select.disabled = roles.length < 2;
    select.innerHTML = '';
    roles.forEach((role) => {
        const option = document.createElement('option');
        option.value = role;
        option.textContent = ROLE_META[role].label;
        select.appendChild(option);
    });

    const activeRole = normalizeRole((source && (source.activeRole || source.role)) || sessionUser.activeRole || sessionUser.role);
    select.value = roles.includes(activeRole) ? activeRole : roles[0];
}

// Canonical role switcher for every dashboard route.
window.switchRoleClientOnly = function switchRoleClientOnly(role) {
    try {
        if (!role) return false;
        const normalizedRole = normalizeRole(role);
        const session = JSON.parse(localStorage.getItem('lm_session') || '{}');
        const roles = authorizedRoles(session);
        if (!roles.includes(normalizedRole) || !ROLE_META[normalizedRole]) {
            window.VieGeoUI.warning('Bạn không có quyền chuyển sang vai trò này.');
            return false;
        }
        persistSessionRoles(roles, normalizedRole);
        window.location.href = ROLE_META[normalizedRole].route;
    } catch (error) {
        console.error('Role switch error:', error);
        window.VieGeoUI.error('Không thể chuyển quyền. Vui lòng thử lại.');
    }
    return false;
};

const sessionData = localStorage.getItem('lm_session');
if (!sessionData) {
    if (window.location.search) {
        localStorage.setItem('pending_action', window.location.search);
    }
    window.location.href = '/loginout';
}
let sessionUser = {};
try {
    sessionUser = sessionData ? JSON.parse(sessionData) : {};
} catch (error) {
    console.error('Dữ liệu phiên đăng nhập không hợp lệ:', error);
    localStorage.removeItem('lm_session');
    window.location.replace('/loginout');
}

const legacyGetGameState = getGameState;
getGameState = function getHeartAwareGameState() {
    const storedHearts = readStoredHeartSnapshot();
    const state = legacyGetGameState();
    if (storedHearts) {
        state.hearts = storedHearts.hearts;
        state.lastHeartUpdate = storedHearts.lastHeartUpdate;
    }
    normalizeHeartState(state);
    writeHeartSnapshot(state);
    return state;
};

gameState = getGameState();
window.gameState = gameState;

renderRoleSwitcher(sessionUser);
document.getElementById('roleSwitcherSelect')?.addEventListener('change', (event) => {
    const nextRole = event.target.value;
    if (nextRole && nextRole !== normalizeRole(sessionUser.activeRole || sessionUser.role)) {
        window.switchRoleClientOnly(nextRole);
    }
});

function hydratePersistedGameState(remoteState, legacyData = {}) {
    if (!remoteState || typeof remoteState !== 'object' || !gameState) return false;
    const remoteUpdatedAt = Number(remoteState.updatedAt) || 0;
    const localUpdatedAt = Number(gameState.updatedAt) || 0;
    if (remoteUpdatedAt && localUpdatedAt && remoteUpdatedAt < localUpdatedAt) return false;

    const source = { ...legacyData, ...remoteState };
    const scalarFields = [
        'updatedAt', 'xp', 'hearts', 'maxHearts', 'gems', 'streak', 'currentUnit', 'currentNode',
        'pvpWins', 'perfectLessons', 'chestsOpened', 'achievementPoints', 'lastHeartUpdate',
            'lastHeartRegenTime', 'lastLogin', 'lastLoginDate', 'lastStudyDate', 'lastStreakAwardDate', 'selectedDifficulty', 'gender',
        'avatar', 'avatarIsBase64', 'accountStatus'
    ];
    scalarFields.forEach((field) => {
        if (source[field] !== undefined && source[field] !== null) gameState[field] = source[field];
    });
    if (source.selectedDifficulty !== undefined || source.selectedGrade !== undefined || source.grade !== undefined) {
        gameState.selectedDifficulty = normalizeDifficulty(
            source.selectedDifficulty || difficultyFromLegacyGrade(source.selectedGrade ?? source.grade)
        );
        delete gameState.selectedGrade;
    }

    ['completedNodes', 'claimedMissionRewards', 'unlockedAchievements', 'studyHistory'].forEach((field) => {
        if (!Array.isArray(source[field])) return;
        if (field === 'studyHistory') {
            gameState.studyHistory = source[field].slice(-500);
            return;
        }
        const values = field === 'completedNodes' && typeof migrateLegacyLearningNodeId === 'function'
            ? source[field].map(migrateLegacyLearningNodeId)
            : source[field].map(String);
        gameState[field] = [...new Set(values)];
    });
    ['lessonResults', 'inventory', 'questsProgress', 'learningProfile', 'telemetry'].forEach((field) => {
        if (source[field] && typeof source[field] === 'object' && !Array.isArray(source[field])) {
            gameState[field] = { ...(gameState[field] || {}), ...source[field] };
        }
    });
    if (gameState.lessonResults && typeof migrateLegacyLearningNodeId === 'function') {
        gameState.lessonResults = Object.fromEntries(Object.entries(gameState.lessonResults)
            .map(([lessonId, result]) => [migrateLegacyLearningNodeId(lessonId), result]));
    }
    return true;
}

// ĐỒNG BỘ DATA TỪ FIREBASE KHI LOAD TRANG (REALTIME)
function setupRealtimeAuth() {
    if (typeof db === 'undefined' || !sessionUser || !sessionUser.email) return;
    db.collection('users').doc(sessionUser.email).onSnapshot(async (doc) => {
        if (doc.exists) {
            const data = doc.data();
            const didHydrateProgress = hydratePersistedGameState(data.gameState, {
                completedNodes: data.completedNodes,
                studyHistory: data.studyHistory,
                currentNode: data.currentNode,
                lessonResults: data.lessonResults,
                inventory: data.inventory,
                questsProgress: data.questsProgress,
                selectedDifficulty: data.selectedDifficulty,
                selectedGrade: data.selectedGrade,
                grade: data.grade,
                gender: data.gender,
                pvpWins: data.pvpWins,
                perfectLessons: data.perfectLessons,
                chestsOpened: data.chestsOpened,
                achievementPoints: data.achievementPoints,
                unlockedAchievements: data.unlockedAchievements
            });
            
            // Nếu bị admin kick
            if (data.forceLogout) {
                // Reset flag in DB so they can login again later
                await db.collection('users').doc(sessionUser.email).update({ forceLogout: false });
                localStorage.clear();
                await VieGeoUI.warning("Tài khoản của bạn đã bị Quản trị viên đăng xuất khỏi hệ thống!");
                window.location.href = '/loginout';
                return;
            }

            // Preserve the current UI state until Firebase explicitly supplies a value.
            // A partial snapshot must never flash XP, hearts, gems or streak back to zero.
            if (data.xp !== undefined && data.xp !== null) gameState.xp = Number(data.xp) || 0;
            const hasRemoteHearts = data.hearts !== undefined && data.hearts !== null;
            const isHeartModelMigration = hasRemoteHearts && data.lastHeartUpdate === undefined;
            const remoteHeartUpdate = readHeartTimestamp(data.lastHeartUpdate ?? data.lastHeartRegenTime);
            if (hasRemoteHearts && (!heartRemoteHydrated || remoteHeartUpdate >= readHeartTimestamp(gameState.lastHeartUpdate))) {
                gameState.hearts = data.hearts;
                gameState.lastHeartUpdate = remoteHeartUpdate;
                heartRemoteHydrated = true;
            }
            if (data.currentStreak !== undefined || data.streak !== undefined) {
                gameState.streak = Number(data.currentStreak ?? data.streak) || 0;
            }
            if (data.gems !== undefined && data.gems !== null) gameState.gems = Number(data.gems) || 0;
            if (Array.isArray(data.claimedMissionRewards)) gameState.claimedMissionRewards = data.claimedMissionRewards;
            if (data.lastLogin) gameState.lastLogin = data.lastLogin;
            if (data.lastLoginDate) gameState.lastLoginDate = data.lastLoginDate;
            if (data.selectedDifficulty !== undefined || data.selectedGrade !== undefined || data.grade !== undefined) {
                const remoteDifficulty = data.selectedDifficulty || difficultyFromLegacyGrade(data.selectedGrade ?? data.grade);
                gameState.selectedDifficulty = normalizeDifficulty(remoteDifficulty);
                delete gameState.selectedGrade;
            }
            if (data.gender !== undefined) {
                gameState.gender = data.gender || null;
                sessionUser.gender = data.gender || '';
            }
            gameState.avatar = data.avatar || "fa-user-astronaut";
            gameState.avatarIsBase64 = data.avatarIsBase64 || false;
            // Cập nhật lại accountStatus từ server phòng khi Admin duyệt Premium
            gameState.accountStatus = data.accountStatus || 'free';
            if (data.learningProfile && typeof data.learningProfile === 'object') {
                gameState.learningProfile = { ...gameState.learningProfile, ...data.learningProfile };
            }
            if (data.hasCompletedSurvey !== undefined) {
                gameState.learningProfile = gameState.learningProfile || {};
                gameState.learningProfile.surveyDone = data.hasCompletedSurvey === true;
            }

            const roles = authorizedRoles(data);
            const activeRole = normalizeRole(sessionUser.activeRole || sessionUser.role);
            sessionUser = { ...sessionUser, roles, role: roles.includes(activeRole) ? activeRole : roles[0], activeRole: roles.includes(activeRole) ? activeRole : roles[0] };
            persistSessionRoles(roles, sessionUser.activeRole);
            renderRoleSwitcher(sessionUser);
            
            normalizeHeartState(gameState);
            if (isHeartModelMigration && gameState.hearts >= HEARTS_MAX) {
                gameState.lastHeartUpdate = Date.now();
            }
            writeHeartStateToLocal();
            syncHearts();
            if (isHeartModelMigration) persistHearts();
            if (didHydrateProgress) {
                localStorage.setItem('VieGeo_state', JSON.stringify(gameState));
                window.dispatchEvent(new CustomEvent('viegeo:state-hydrated'));
            }
            if (typeof checkAndUnlockAchievements === 'function') checkAndUnlockAchievements(gameState);
            
            // Cập nhật lại UI
            if(typeof updateHeaderStats === 'function') updateHeaderStats();
            if(typeof renderProfile === 'function' && document.getElementById('tabProfile') && document.getElementById('tabProfile').classList.contains('active')) {
                renderProfile();
            }
        }
    }, (error) => {
        console.error("Lỗi tải data Firebase:", error);
    });
}
setupRealtimeAuth();


function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = isError ? 'var(--holo-1)' : 'var(--holo-3)';
    toast.style.opacity = '1';
    toast.style.bottom = '40px';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.bottom = '-50px';
    }, 3000);
}

// ── ONLINE HEARTBEAT ──
setInterval(() => {
    if (typeof db !== 'undefined' && sessionUser && sessionUser.email) {
        db.collection('users').doc(sessionUser.email).update({
            lastActive: Date.now()
        }).catch(()=>{});
    }
}, 30000); // Mỗi 30 giây báo cáo đang hoạt động

// ── HEART ECONOMY: one canonical 30-minute regeneration flow ──
function readHeartTimestamp(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (value instanceof Date) return value.getTime();
    if (value && typeof value.toMillis === 'function') return value.toMillis();
    if (value && Number.isFinite(value.seconds)) return value.seconds * 1000;
    return Date.now();
}

function readStoredHeartSnapshot() {
    try {
        const stored = JSON.parse(localStorage.getItem('VieGeo_state') || 'null');
        if (!stored || typeof stored !== 'object' || stored.hearts === undefined) return null;
        return {
            hearts: Math.min(HEARTS_MAX, Math.max(0, Math.floor(Number(stored.hearts) || 0))),
            lastHeartUpdate: readHeartTimestamp(stored.lastHeartUpdate ?? stored.lastHeartRegenTime)
        };
    } catch (error) {
        return null;
    }
}

function normalizeHeartState(state, now = Date.now()) {
    if (!state || typeof state !== 'object') return state;
    state.hearts = Math.min(HEARTS_MAX, Math.max(0, Math.floor(Number(state.hearts) || 0)));
    state.lastHeartUpdate = readHeartTimestamp(state.lastHeartUpdate ?? state.lastHeartRegenTime ?? now);
    if (state.lastHeartUpdate > now) state.lastHeartUpdate = now;
    return state;
}

function isPremiumAccount() {
    return String(gameState?.accountStatus || '').trim().toLowerCase() === 'premium';
}

function hasUnlimitedHearts() {
    return isPremiumAccount()
        || Boolean(gameState?.inventory?.infiniteHeartsExpiry && Number(gameState.inventory.infiniteHeartsExpiry) > Date.now());
}

function writeHeartStateToLocal() {
    try {
        localStorage.setItem('VieGeo_state', JSON.stringify(gameState));
    } catch (error) {
        console.warn('Không thể lưu Trái tim trên thiết bị.', error);
    }
}

function writeHeartSnapshot(state) {
    try {
        const stored = JSON.parse(localStorage.getItem('VieGeo_state') || 'null') || {};
        stored.hearts = state.hearts;
        stored.lastHeartUpdate = state.lastHeartUpdate;
        localStorage.setItem('VieGeo_state', JSON.stringify(stored));
    } catch (error) {
        console.warn('Không thể cập nhật mốc hồi Trái tim trên thiết bị.', error);
    }
}

async function persistHearts() {
    writeHeartStateToLocal();
    if (typeof db === 'undefined' || !sessionUser?.email) return true;
    try {
        await db.collection('users').doc(sessionUser.email).set({
            hearts: gameState.hearts,
            lastHeartUpdate: gameState.lastHeartUpdate
        }, { merge: true });
        return true;
    } catch (error) {
        console.warn('Không thể đồng bộ Trái tim.', error);
        return false;
    }
}

function formatHeartCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateHeartUi() {
    const heartsElement = document.getElementById('hdrHearts');
    const timerElement = document.getElementById('hdrHeartTimer');
    if (heartsElement) heartsElement.textContent = hasUnlimitedHearts() ? '∞' : String(gameState.hearts);
    if (!timerElement) return;

    if (hasUnlimitedHearts() || gameState.hearts >= HEARTS_MAX) {
        timerElement.hidden = true;
        timerElement.textContent = '';
        return;
    }

    const remaining = Math.max(0, HEART_REGEN_MS - (Date.now() - gameState.lastHeartUpdate));
    timerElement.hidden = false;
    timerElement.textContent = formatHeartCountdown(remaining);
}

function updateHeaderStats() {
    const streakElement = document.getElementById('hdrStreak');
    const gemsElement = document.getElementById('hdrGems');
    const xpElement = document.getElementById('hdrXp');
    const trophyElement = document.getElementById('hdrTrophies');
    const levelElement = document.getElementById('hdrLevel');
    if (streakElement) streakElement.textContent = gameState.streak ?? 0;
    if (gemsElement) gemsElement.textContent = gameState.gems ?? 0;
    if (xpElement) xpElement.textContent = gameState.xp ?? 0;
    if (trophyElement) trophyElement.textContent = gameState.trophies ?? gameState.pvpWins ?? 0;
    if (levelElement) levelElement.textContent = Math.max(1, Math.floor((Number(gameState.xp) || 0) / 250) + 1);
    updateHeartUi();
}

function syncHearts() {
    const now = Date.now();
    normalizeHeartState(gameState, now);
    let changed = false;

    if (gameState.hearts < HEARTS_MAX) {
        const elapsed = Math.max(0, now - gameState.lastHeartUpdate);
        const heartsToAdd = Math.floor(elapsed / HEART_REGEN_MS);
        if (heartsToAdd > 0) {
            gameState.hearts = Math.min(HEARTS_MAX, gameState.hearts + heartsToAdd);
            gameState.lastHeartUpdate = gameState.hearts >= HEARTS_MAX
                ? now
                : gameState.lastHeartUpdate + (heartsToAdd * HEART_REGEN_MS);
            changed = true;
        }
    }

    if (changed) persistHearts();
    else writeHeartStateToLocal();
    updateHeaderStats();
    startHeartTimer();
    return gameState.hearts;
}

function startHeartTimer() {
    if (heartTimerInterval) {
        clearInterval(heartTimerInterval);
        heartTimerInterval = null;
    }

    updateHeartUi();
    if (hasUnlimitedHearts() || gameState.hearts >= HEARTS_MAX) return;

    heartTimerInterval = window.setInterval(() => {
        const remaining = HEART_REGEN_MS - (Date.now() - gameState.lastHeartUpdate);
        if (remaining <= 0) {
            syncHearts();
            return;
        }
        updateHeartUi();
    }, 1000);
}

function checkHasEnoughHearts() {
    syncHearts();
    return gameState.hearts > 0;
}

function showOutOfHeartsPopup() {
    const message = 'Bạn đã hết trái tim! Hãy đợi 15 phút hoặc Mua Premium.';
    const openShop = () => {
        const shopControl = document.querySelector('.nav-button[data-target="tabShop"]');
        if (shopControl) {
            shopControl.click();
            return;
        }
        window.location.href = '/map?tab=shop';
    };

    if (window.Swal && typeof window.Swal.fire === 'function') {
        window.Swal.fire({
            title: 'Bạn đã hết trái tim!',
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Mở Cửa hàng',
            cancelButtonText: 'Để sau',
            confirmButtonColor: '#0284c7',
            cancelButtonColor: '#475569',
            background: '#13253a',
            color: '#f8fafc',
            heightAuto: false
        }).then((result) => {
            if (result.isConfirmed) openShop();
        });
        return;
    }

    window.VieGeoUI.warning(message).then(openShop);
}

async function consumeHeart() {
    if (lessonEntryInProgress) return false;
    if (hasUnlimitedHearts()) {
        updateHeaderStats();
        return true;
    }
    if (!checkHasEnoughHearts()) {
        showOutOfHeartsPopup();
        return false;
    }

    lessonEntryInProgress = true;
    const previousHearts = gameState.hearts;
    const previousHeartUpdate = gameState.lastHeartUpdate;
    const wasFull = gameState.hearts === HEARTS_MAX;
    gameState.hearts -= 1;
    if (wasFull) gameState.lastHeartUpdate = Date.now();
    updateHeaderStats();
    startHeartTimer();
    const persisted = await persistHearts();
    lessonEntryInProgress = false;
    if (!persisted) {
        gameState.hearts = previousHearts;
        gameState.lastHeartUpdate = previousHeartUpdate;
        writeHeartStateToLocal();
        updateHeaderStats();
        startHeartTimer();
        window.VieGeoUI.error('Không thể cập nhật thể lực. Vui lòng kiểm tra kết nối và thử lại.');
        return false;
    }
    return true;
}

// Island summaries are deliberately separate from lesson-entry gating. This
// charge is called once, only after a non-Premium learner finishes an island
// without a perfect score.
async function deductHeartForIslandSummary() {
    if (lessonEntryInProgress) return { applied: false, gameOver: false };
    syncHearts();

    if (hasUnlimitedHearts()) {
        return { applied: false, protected: true, gameOver: false, hearts: gameState.hearts };
    }
    if (gameState.hearts <= 0) {
        updateHeaderStats();
        return { applied: false, gameOver: true, hearts: 0 };
    }

    lessonEntryInProgress = true;
    const previousHearts = gameState.hearts;
    const previousHeartUpdate = gameState.lastHeartUpdate;
    const wasFull = gameState.hearts === HEARTS_MAX;
    gameState.hearts = Math.max(0, gameState.hearts - 1);
    if (wasFull) gameState.lastHeartUpdate = Date.now();
    updateHeaderStats();
    startHeartTimer();

    const persisted = await persistHearts();
    lessonEntryInProgress = false;
    if (!persisted) {
        gameState.hearts = previousHearts;
        gameState.lastHeartUpdate = previousHeartUpdate;
        writeHeartStateToLocal();
        updateHeaderStats();
        startHeartTimer();
        window.VieGeoUI.error('Không thể cập nhật trái tim. Vui lòng kiểm tra kết nối và thử lại.');
        return { applied: false, gameOver: false, hearts: gameState.hearts };
    }

    return { applied: true, gameOver: gameState.hearts <= 0, hearts: gameState.hearts };
}

function gateLessonButtons(root = document) {
    root.querySelectorAll('.node-btn:not([data-heart-gated])').forEach((button) => {
        // Small islands show a theory step first. Their quiz handles heart
        // penalties only after an incorrect answer is submitted.
        if (button.dataset.skipHeartGate === 'true') return;
        const originalClick = button.onclick;
        if (typeof originalClick !== 'function') return;
        button.dataset.heartGated = 'true';
        button.onclick = async function guardedLessonClick(event) {
            if (!button.classList.contains('current') && !button.classList.contains('completed')) {
                return originalClick.call(button, event);
            }
            event?.preventDefault();
            if (!await consumeHeart()) return false;
            return originalClick.call(button, event);
        };
    });
}

window.syncHearts = syncHearts;
window.startHeartTimer = startHeartTimer;
window.checkHasEnoughHearts = checkHasEnoughHearts;
window.consumeHeart = consumeHeart;
window.deductHeartForIslandSummary = deductHeartForIslandSummary;
window.isPremiumUser = isPremiumAccount;

syncHearts();
const heartGateObserver = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) gateLessonButtons(node);
    }));
});
heartGateObserver.observe(document.body, { childList: true, subtree: true });
gateLessonButtons();
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncHearts();
});

// ── TAB SWITCHING & TOP NAVIGATION ──
const tabNavControls = document.querySelectorAll('.nav-btn[data-target], .nav-button[data-target]');
const tabPanes = document.querySelectorAll('.tab-pane');
const animatedNavButtons = document.querySelectorAll('.nav-button');

function activateTab(targetId) {
    const targetPane = targetId ? document.getElementById(targetId) : null;
    if (!targetPane) return false;

    tabPanes.forEach((pane) => pane.classList.remove('active'));
    tabNavControls.forEach((control) => {
        const selected = control.getAttribute('data-target') === targetId;
        control.classList.toggle('active', selected);
        if (control.classList.contains('nav-button')) {
            if (selected) control.setAttribute('aria-current', 'page');
            else control.removeAttribute('aria-current');
        }
    });
    targetPane.classList.add('active');
    return true;
}

function activateInitialTabFromUrl() {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    if (!requestedTab) return;
    const target = document.querySelector(`.nav-button[data-tab-key="${requestedTab}"]`);
    if (target) activateTab(target.getAttribute('data-target'));
}

tabNavControls.forEach((control) => {
    if (control.classList.contains('nav-button')) return;
    control.addEventListener('click', () => activateTab(control.getAttribute('data-target')));
});

animatedNavButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
        const href = button.getAttribute('href');
        if (!href) return;
        event.preventDefault();

        animatedNavButtons.forEach((item) => item.removeAttribute('aria-current'));
        button.setAttribute('aria-current', 'page');

        // Keep map sections in the current document. This avoids reloading a blank
        // canvas while still allowing the active-state transition to be perceived.
        window.setTimeout(() => {
            const targetId = button.getAttribute('data-target');
            if (targetId && activateTab(targetId)) {
                const nextUrl = new URL(href, window.location.href);
                window.history.pushState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
                return;
            }
            window.location.href = href;
        }, 300);
    });
});

activateInitialTabFromUrl();

// ── RENDER PATH (ISLANDS & FILTER) ──
const difficultyChips = document.querySelectorAll('.difficulty-chip');
if (difficultyChips.length > 0) {
    // Set initial active chip
    difficultyChips.forEach(chip => {
        if (chip.getAttribute('data-val') === normalizeDifficulty(gameState.selectedDifficulty)) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
        
        chip.addEventListener('click', (e) => {
            difficultyChips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            gameState.selectedDifficulty = normalizeDifficulty(e.target.getAttribute('data-val'));
            delete gameState.selectedGrade;
            saveGameState(gameState);
                    });
    });
}



// ── RENDER LEADERBOARD (FIREBASE) ──
async function renderLeaderboard() {
    const lbList = document.getElementById('lbList');
    if (!lbList) return;
    
    lbList.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-dim);">Đang tải dữ liệu...</div>';
    
    try {
        const snapshot = await db.collection('users').orderBy('xp', 'desc').limit(10).get();
        
        lbList.innerHTML = ''; // Xóa loading
        
        let index = 0;
        snapshot.forEach(doc => {
            const user = doc.data();
            const isMe = (user.email === sessionUser.email);
            
            const item = document.createElement('div');
            const isTop3 = index < 3;
            const isTop1 = index === 0;
            
            item.className = `lb-item ${isMe ? 'is-me' : ''}`;
            
            if (isTop1) {
                item.style.background = 'linear-gradient(90deg, rgba(255,200,0,0.2), rgba(255,200,0,0.05))';
                item.style.border = '1px solid #ffc800';
                item.style.transform = 'scale(1.02)';
            } else if (isTop3) {
                item.style.background = 'rgba(255,255,255,0.08)';
            }
            
            let rankHtml = '';
            if (index === 0) rankHtml = `<i class="fa-solid fa-crown" style="color: #ffc800; font-size: 1.5rem;"></i>`;
            else if (index === 1) rankHtml = `<i class="fa-solid fa-medal" style="color: #c0c0c0; font-size: 1.3rem;"></i>`;
            else if (index === 2) rankHtml = `<i class="fa-solid fa-medal" style="color: #cd7f32; font-size: 1.2rem;"></i>`;
            else rankHtml = `<span style="color: var(--text-dim);">${index + 1}</span>`;

            const userLevel = getLevel(user.xp);

            let avatarHtml = '';
            if (user.avatarIsBase64) {
                avatarHtml = `<img src="${user.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                avatarHtml = `<i class="fa-solid ${user.avatar || 'fa-user'}"></i>`;
            }

            const color = (index === 0) ? '#ffc800' : (index === 1) ? '#c0c0c0' : (index === 2) ? '#cd7f32' : '#1cb0f6';

            item.innerHTML = `
                <div class="lb-rank" style="width: 40px; text-align: center;">${rankHtml}</div>
                <div class="lb-avatar" style="background: ${color}33; color: ${color}; position: relative; ${isTop1 ? 'box-shadow: 0 0 15px ' + color : ''}">
                    ${avatarHtml}
                    <div style="position: absolute; bottom: -8px; background: var(--bg-dark); border: 1px solid ${color}; font-size: 0.7rem; border-radius: 10px; padding: 2px 6px;">Lv.${userLevel}</div>
                </div>
                <div class="lb-info">
                    <div class="lb-name" style="${isTop1 ? 'color: #ffc800; font-weight: bold;' : ''}">${user.name || 'Thám hiểm gia'}</div>
                </div>
                <div class="lb-xp">${user.xp || 0} XP</div>
            `;
            lbList.appendChild(item);
            index++;
        });
    } catch (error) {
        console.error("Lỗi lấy Bảng xếp hạng:", error);
        lbList.innerHTML = '<div style="text-align:center; padding: 20px; color: #ff4b4b;">Lỗi kết nối máy chủ</div>';
    }
}

// ── RENDER QUESTS ──
function missionRewardFor(quest) {
    const diamondReward = Math.max(0, Number(quest?.reward) || 0);
    return {
        exp: Math.max(10, Number(quest?.expReward) || Math.round(diamondReward / 2)),
        diamonds: diamondReward
    };
}

function claimedMissionIds() {
    if (!Array.isArray(gameState.claimedMissionRewards)) gameState.claimedMissionRewards = [];
    return gameState.claimedMissionRewards;
}

async function persistMissionClaim() {
    saveGameState(gameState);
    const email = sessionUser?.email;
    if (!email || typeof db === 'undefined') return true;

    await db.collection('users').doc(email).set({
        xp: Number(gameState.xp) || 0,
        gems: Number(gameState.gems) || 0,
        diamonds: Number(gameState.gems) || 0,
        claimedMissionRewards: claimedMissionIds()
    }, { merge: true });
    return true;
}

window.claimReward = async function claimReward(missionId) {
    const quest = DAILY_QUESTS.find((item) => item.id === missionId);
    if (!quest || !gameState || !gameState.questsProgress) return false;

    const progress = Number(gameState.questsProgress[missionId]) || 0;
    const claims = claimedMissionIds();
    if (progress < quest.target || claims.includes(missionId)) return false;

    const reward = missionRewardFor(quest);
    const previousXp = Number(gameState.xp) || 0;
    const previousGems = Number(gameState.gems) || 0;
    claims.push(missionId);
    gameState.xp = previousXp + reward.exp;
    gameState.gems = previousGems + reward.diamonds;
    gameState.diamonds = gameState.gems;
    updateHeaderStats();
    renderQuests();

    try {
        await persistMissionClaim();
        window.VieGeoUI.success(`Đã nhận ${reward.exp} XP và ${reward.diamonds} Kim cương!`);
        return true;
    } catch (error) {
        console.error('Không thể nhận thưởng nhiệm vụ:', error);
        gameState.xp = previousXp;
        gameState.gems = previousGems;
        gameState.diamonds = previousGems;
        gameState.claimedMissionRewards = claims.filter((id) => id !== missionId);
        saveGameState(gameState);
        updateHeaderStats();
        renderQuests();
        window.VieGeoUI.error('Chưa thể nhận thưởng. Vui lòng kiểm tra kết nối và thử lại.');
        return false;
    }
};

function renderQuests() {
    const grid = document.getElementById('questGrid');
    if (!grid || !gameState) return;
    if (!gameState.questsProgress) gameState.questsProgress = {};
    grid.innerHTML = '';

    gameState.questsProgress.q3 = Number(gameState.xp) || 0;
    
    // Phân chia theo Mốc (Milestones)
    const types = [
        { key: 'daily', name: 'Nhẹ Nhàng Hàng Ngày', icon: 'fa-sun', color: '#1cb0f6' },
        { key: 'epic', name: 'Thử Thách Trọng Điểm', icon: 'fa-fire', color: '#ff4b4b' },
        { key: 'achievement', name: 'Thành Tựu Đời Người', icon: 'fa-crown', color: '#ffc800' }
    ];

    types.forEach(typeGrp => {
        const typeQuests = DAILY_QUESTS.filter(q => q.type === typeGrp.key);
        if (typeQuests.length === 0) return;

        // Header của Mốc
        const header = document.createElement('div');
        header.style.gridColumn = '1 / -1';
        header.style.marginTop = '20px';
        header.style.marginBottom = '10px';
        header.style.borderBottom = `2px solid ${typeGrp.color}44`;
        header.style.paddingBottom = '5px';
        header.innerHTML = `<h3 style="color: ${typeGrp.color}; font-size: 1.2rem;"><i class="fa-solid ${typeGrp.icon}"></i> ${typeGrp.name}</h3>`;
        grid.appendChild(header);

        typeQuests.forEach(quest => {
            const progress = gameState.questsProgress[quest.id] || 0;
            const percent = Math.min((progress / quest.target) * 100, 100);
            const isDone = progress >= quest.target;
            const isClaimed = claimedMissionIds().includes(quest.id);
            const reward = missionRewardFor(quest);

            const card = document.createElement('div');
            card.className = 'bento-card';
            card.innerHTML = `
                <div class="bento-card-title" style="color: ${typeGrp.color};"><i class="fa-solid fa-star"></i> ${quest.title}</div>
                <div class="bento-card-desc">${quest.desc}</div>
                
                <div style="margin-top: auto;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: bold; margin-bottom: 8px;">
                        <span>${progress} / ${quest.target}</span>
                        <span style="color: #ffc800;">+${reward.diamonds} <i class="fa-solid fa-gem"></i> · +${reward.exp} XP</span>
                    </div>
                    <div style="height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden;">
                        <div style="width: ${percent}%; height: 100%; background: ${isDone ? '#58cc02' : typeGrp.color}; border-radius: 6px;"></div>
                    </div>
                    ${isDone ? (isClaimed
                        ? `<button class="bento-btn mission-claim-button" type="button" disabled>Đã nhận</button>`
                        : `<button class="bento-btn mission-claim-button is-ready" type="button" onclick="claimReward('${quest.id}')">Nhận thưởng</button>`)
                        : '<p class="mission-progress-note">Hoàn thành nhiệm vụ để mở khóa phần thưởng.</p>'}
                </div>
            `;
            grid.appendChild(card);
        });
    });
}

// ── RENDER ARENA ──
function renderArena() {
    // Update Powerups status
    document.getElementById('arenaBuffDouble').textContent = gameState.inventory.powerupDoubleXp || 0;
    document.getElementById('arenaBuff5050').textContent = gameState.inventory.powerup5050 || 0;

    const grid = document.getElementById('arenaGrid');
    grid.innerHTML = '';

    ARENA_MATCHES.forEach(match => {
        const card = document.createElement('div');
        card.className = 'bento-card';
        card.style.borderColor = '#ff4b4b';
        card.innerHTML = `
            <div style="font-size: 3rem; color: #ff4b4b; margin-bottom: -10px;"><i class="fa-solid fa-khanda"></i></div>
            <div class="bento-card-title" style="color: #ff4b4b;">${match.title}</div>
            <div class="bento-card-desc">${match.desc}</div>
            <div style="margin: 10px 0; font-size: 0.9rem;">
                <div><i class="fa-solid fa-users" style="color:#1cb0f6;"></i> Thể loại: 1vs1</div>
                <div><i class="fa-solid fa-trophy" style="color:#ffc800;"></i> Thắng: +${match.reward} Xu & XP</div>
            </div>
            <button class="bento-btn" style="margin-top: auto; font-size: 1.1rem; background: #ff4b4b; color: white;" onclick="startArena('${match.id}', ${match.entryFee})">
                Vào Thi Đấu (${match.entryFee} <i class="fa-solid fa-gem"></i>)
            </button>
        `;
        grid.appendChild(card);
    });
}

window.startArena = async function(arenaId, fee) {
    if (gameState.gems >= fee) {
        gameState.gems -= fee;
        saveGameState(gameState);
        updateHeaderStats();
        
        // Show finding match modal UI
        const arenaTab = document.getElementById('tabArena');
        const oldHTML = arenaTab.innerHTML;
        arenaTab.innerHTML = `
            <div style="text-align: center; margin-top: 100px;">
                <i class="fa-solid fa-satellite-dish fa-spin" style="font-size: 4rem; color: var(--blue); margin-bottom: 20px;"></i>
                <h2 style="font-size: 2rem;">Đang tìm đối thủ...</h2>
                <p style="color: var(--text-dim); margin-top: 10px;">Vui lòng chờ một chút để ghép trận.</p>
                <p id="matchmakingStatus" style="color: var(--gold); margin-top: 20px; font-weight: bold;"></p>
                <button id="btnCancelMatchmaking" style="display:none; margin: 30px auto; background: rgba(255,75,75,0.1); color: var(--red); border: 1px solid var(--red); padding: 10px 30px; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.2s;"><i class="fa-solid fa-xmark"></i> Hủy tìm kiếm</button>
            </div>
        `;
        
        try {
            const roomsRef = db.collection('pvp_rooms');
            const waitingRooms = await roomsRef.where('status', '==', 'waiting').where('arenaId', '==', arenaId).limit(1).get();
            
            if (!waitingRooms.empty) {
                // Join existing room
                const roomDoc = waitingRooms.docs[0];
                await roomsRef.doc(roomDoc.id).update({
                    status: 'playing',
                    player2: sessionUser.email,
                    p2Name: sessionUser.name,
                    p2Score: 0
                });
                
                document.getElementById('matchmakingStatus').textContent = "Đã ghép được trận! Bắt đầu...";
                localStorage.setItem('VieGeo_mode', 'arena');
                localStorage.setItem('VieGeo_arena_id', arenaId);
                localStorage.setItem('VieGeo_pvp_room', roomDoc.id);
                localStorage.setItem('VieGeo_pvp_role', 'player2');
                setTimeout(() => window.location.href = '/lesson', 1500);
            } else {
                // Create new room and wait
                const newRoom = await roomsRef.add({
                    arenaId: arenaId,
                    status: 'waiting',
                    player1: sessionUser.email,
                    p1Name: sessionUser.name,
                    p1Score: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                document.getElementById('matchmakingStatus').textContent = "Đang chờ người chơi khác tham gia...";
                
                // Listen for changes
                const unsubscribe = roomsRef.doc(newRoom.id).onSnapshot(doc => {
                    const data = doc.data();
                    if (data && data.status === 'playing') {
                        unsubscribe();
                        const btnCancel = document.getElementById('btnCancelMatchmaking');
                        if (btnCancel) btnCancel.style.display = 'none';
                        document.getElementById('matchmakingStatus').textContent = "Đối thủ đã tham gia! Bắt đầu...";
                        localStorage.setItem('VieGeo_mode', 'arena');
                        localStorage.setItem('VieGeo_arena_id', arenaId);
                        localStorage.setItem('VieGeo_pvp_room', newRoom.id);
                        localStorage.setItem('VieGeo_pvp_role', 'player1');
                        setTimeout(() => window.location.href = '/lesson', 1500);
                    }
                });

                // Setup cancel logic
                const btnCancel = document.getElementById('btnCancelMatchmaking');
                if (btnCancel) {
                    btnCancel.style.display = 'block';
                    btnCancel.onclick = async () => {
                        btnCancel.disabled = true;
                        btnCancel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang hủy...';
                        unsubscribe(); // Stop listening
                        try {
                            await roomsRef.doc(newRoom.id).delete(); // Remove room
                        } catch(e) {}
                        
                        // Refund fee
                        gameState.gems += fee;
                        saveGameState(gameState);
                        updateHeaderStats();
                        
                        // Restore UI
                        arenaTab.innerHTML = oldHTML;
                        renderArena();
                    };
                }
            }
        } catch(e) {
            console.error(e);
            showToast("Lỗi ghép trận!", false);
            arenaTab.innerHTML = oldHTML;
        }
    } else {
        showToast("Không đủ Xu để mua vé vào!", false);
    }
}

// ── RENDER SHOP ──
function renderShop() {
    const grid = document.getElementById('shopGrid');
    grid.innerHTML = '';

    SHOP_ITEMS.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bento-card';
        card.innerHTML = `
            <div style="font-size: 3rem; color: ${item.color}; margin-bottom: -10px;"><i class="fa-solid ${item.icon}"></i></div>
            <div class="bento-card-title" style="color: ${item.color};">${item.title}</div>
            <div class="bento-card-desc">${item.desc}</div>
            <button class="bento-btn holo-bg" style="margin-top: auto; font-size: 1.1rem;" onclick="buyItem('${item.id}', ${item.price})">
                Mua với ${item.price} <i class="fa-solid fa-gem"></i>
            </button>
        `;
        grid.appendChild(card);
    });
}

window.buyItem = function(itemId, price) {
    if (gameState.gems >= price) {
        gameState.gems -= price;
        
        if (itemId === "infinite_hearts") {
            gameState.inventory.infiniteHeartsExpiry = Date.now() + 15 * 60 * 1000;
        } else if (itemId === "p_double_xp") {
            gameState.inventory.powerupDoubleXp = (gameState.inventory.powerupDoubleXp || 0) + 1;
        } else if (itemId === "p_5050") {
            gameState.inventory.powerup5050 = (gameState.inventory.powerup5050 || 0) + 1;
        }

        saveGameState(gameState);
        updateHeaderStats();
        renderArena(); // Cập nhật lại số lượng bùa trong tab đấu trường
        createConfetti();
        showToast("Đã mua thành công!");
    } else {
        showToast("Bạn không đủ Đá quý!", true);
    }
}

// Hàm phụ trợ tạo pháo giấy (CSS)
function createConfetti() {
    for (let i = 0; i < 30; i++) {
        const conf = document.createElement('div');
        conf.style.position = 'fixed';
        conf.style.width = '10px';
        conf.style.height = '10px';
        conf.style.backgroundColor = ['#58cc02', '#1cb0f6', '#ffc800', '#ce82ff', '#ff4b4b'][Math.floor(Math.random() * 5)];
        conf.style.left = '50%';
        conf.style.top = '50%';
        conf.style.zIndex = '9999';
        conf.style.borderRadius = '50%';
        conf.style.pointerEvents = 'none';
        
        const tx = (Math.random() - 0.5) * 400;
        const ty = (Math.random() - 0.5) * 400 - 200;
        
        conf.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
            duration: 1000 + Math.random() * 500,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
        });
        
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 1500);
    }
}

// ── RENDER PROFILE ──
function renderProfile() {
    document.getElementById('profName').textContent = sessionUser.name;
    document.getElementById('profEmail').textContent = sessionUser.email;
    document.getElementById('profStreak').textContent = gameState.streak;
    document.getElementById('profXp').textContent = gameState.xp;
    document.getElementById('profAchPoints').textContent = gameState.achievementPoints || 0;
    
    // NEW: Learning Profile Rendering
    if (gameState.learningProfile && gameState.learningProfile.surveyDone) {
        const goalMap = { 'exam': 'Ôn thi trên lớp', 'knowledge': 'Khám phá kiến thức', 'travel': 'Yêu thích du lịch' };
        const regionMap = { 'north': 'Miền Bắc', 'central': 'Miền Trung', 'south': 'Miền Nam' };
        
        let goalText = goalMap[gameState.learningProfile.goal] || 'Chưa rõ';
        const interests = Array.isArray(gameState.learningProfile.interests)
            ? gameState.learningProfile.interests
            : [];
        let interestsText = interests.map(i => regionMap[i]).filter(Boolean).join(', ') || 'Chưa rõ';
        
        document.getElementById('lpGoal').textContent = goalText;
        document.getElementById('lpInterests').textContent = interestsText;
        
        // Simple AI Synthesis
        let report = `Dựa trên kết quả khảo sát, hệ thống ghi nhận bạn có mục tiêu "${goalText}" và đặc biệt quan tâm tới ${interestsText}. `;
        if (gameState.learningProfile.totalQuestionsAnswered > 0) {
            report += `Bạn đã trả lời tổng cộng ${gameState.learningProfile.totalQuestionsAnswered} câu hỏi luyện tập. Hệ thống AI đang tiếp tục theo dõi tốc độ học và điểm mạnh của bạn để cá nhân hóa lộ trình tốt hơn.`;
        } else {
            report += `Hãy hoàn thành bài học đầu tiên trên bản đồ để AI có thể đánh giá năng lực của bạn!`;
        }
        document.getElementById('lpReport').textContent = report;
    }

    // Đổ dữ liệu vào Form
    document.getElementById('editProfName').value = sessionUser.name;
    document.getElementById('editProfEmail').value = sessionUser.email;
    document.getElementById('editProfPhone').value = sessionUser.phone || "";
    const genderInput = document.getElementById('editProfGender');
    if (genderInput) genderInput.value = sessionUser.gender || gameState.gender || '';
    
    const lvl = getLevel(gameState.xp);
    document.getElementById('profLevel').textContent = "Cấp " + lvl;
    
    // Account Status
    const profStatus = document.getElementById('profStatus');
    if (gameState.accountStatus === 'premium') {
        profStatus.innerHTML = '<i class="fa-solid fa-crown" style="color: #ffc800;"></i> Premium VIP';
        profStatus.style.borderColor = '#ffc800';
        profStatus.style.color = '#ffc800';
        profStatus.style.background = 'rgba(255, 200, 0, 0.1)';
        // Hide upgrade button if already premium
        const btnUpgrade = profStatus.nextElementSibling;
        if (btnUpgrade && btnUpgrade.tagName === 'BUTTON') {
            btnUpgrade.style.display = 'none';
        }
    } else {
        profStatus.textContent = 'Tài khoản: Free';
    }
    
    // Avatar Logic
    const avatarIcon = document.getElementById('profAvatarIcon');
    const avatarIconContainer = document.getElementById('profAvatarIconContainer');
    if (gameState.avatarIsBase64) {
        if(avatarIconContainer) {
            avatarIconContainer.innerHTML = `<img src="${gameState.avatar}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            avatarIcon.className = '';
            avatarIcon.innerHTML = `<img src="${gameState.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:40px;">`;
        }
    } else {
        if(avatarIconContainer) {
            avatarIconContainer.innerHTML = `<i id="profAvatarIcon" class="fa-solid ${gameState.avatar || 'fa-user-astronaut'}"></i>`;
        } else {
            avatarIcon.innerHTML = ''; 
            avatarIcon.className = `fa-solid ${gameState.avatar || 'fa-user-astronaut'}`;
        }
    }
    
    renderAchievements();
}

function initializeProfileSettings() {
    const settingsToggle = document.getElementById('profileSettingsToggle');
    const settingsContent = document.getElementById('profileSettingsContent');
    if (settingsToggle && settingsContent) {
        const setSettingsExpanded = (expanded) => {
            settingsContent.hidden = !expanded;
            settingsToggle.setAttribute('aria-expanded', String(expanded));
        };
        setSettingsExpanded(false);
        settingsToggle.addEventListener('click', () => {
            setSettingsExpanded(settingsContent.hidden);
        });
    }

    const tabs = [...document.querySelectorAll('[data-settings-tab]')];
    const panels = [...document.querySelectorAll('[data-settings-panel]')];
    if (tabs.length) {
        tabs.forEach((tab) => tab.addEventListener('click', () => {
            const tabName = tab.dataset.settingsTab;
            tabs.forEach((item) => {
                const active = item === tab;
                item.classList.toggle('is-active', active);
                item.setAttribute('aria-selected', String(active));
            });
            panels.forEach((panel) => {
                const active = panel.dataset.settingsPanel === tabName;
                panel.hidden = !active;
                panel.classList.toggle('is-active', active);
            });
        }));
    }

    document.getElementById('btnSettingsTheme')?.addEventListener('click', () => {
        document.getElementById('btnThemeToggle')?.click();
    });
    document.getElementById('btnReopenSurvey')?.addEventListener('click', () => {
        if (window.VieGeoSurvey && typeof window.VieGeoSurvey.open === 'function') {
            window.VieGeoSurvey.open();
        } else {
            window.VieGeoUI.warning('Biểu mẫu khảo sát đang được tải. Vui lòng thử lại sau ít giây.');
        }
    });
}

initializeProfileSettings();

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (typeof synchronizeAchievementsWithState === 'function') synchronizeAchievementsWithState(gameState);
    else if (!gameState.unlockedAchievements) gameState.unlockedAchievements = [];
    
    const profAchPoints = document.getElementById('profAchPoints');
    if (profAchPoints) profAchPoints.textContent = gameState.achievementPoints;

    ACHIEVEMENTS_LIST.forEach(ach => {
        const isUnlocked = gameState.unlockedAchievements && gameState.unlockedAchievements.includes(ach.id);
        
        let currentProgress = typeof getAchievementProgress === 'function'
            ? getAchievementProgress(gameState, ach.type)
            : 0;

        // Cap progress at target
        if (currentProgress > ach.target) currentProgress = ach.target;

        const progressPercent = (currentProgress / ach.target) * 100;
        
        const opacity = isUnlocked ? '1' : '0.4';
        const filter = isUnlocked ? 'none' : 'grayscale(100%)';
        const color = ach.color;

        const card = document.createElement('div');
        card.className = 'bento-card';
        card.style.opacity = opacity;
        card.style.filter = filter;
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.gap = '15px';
        card.style.padding = '15px';
        card.style.transition = 'all 0.3s ease';

        if (isUnlocked) {
            card.classList.add('completed-achievement');
            card.style.border = `2px solid ${color}`;
            card.style.background = 'rgba(255,255,255,0.08)';
            card.style.boxShadow = `0 5px 15px ${color}33`; // Append 33 for 20% opacity on hex
        }

        card.innerHTML = `
            <div style="font-size: 2.5rem; color: ${color}; width: 50px; text-align: center;">
                <i class="fa-solid ${ach.icon}"></i>
            </div>
            <div style="flex: 1;">
                <h4 style="margin: 0 0 5px 0; font-size: 1rem; color: white;">${ach.title}</h4>
                <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: var(--text-dim);">${ach.desc}</p>
                ${isUnlocked ? `
                    <div style="font-size: 0.8rem; color: var(--green); font-weight: bold;"><i class="fa-solid fa-check"></i> Đã Đạt</div>
                ` : `
                    <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: ${color}; height: 100%; width: ${progressPercent}%;"></div>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 5px; text-align: right;">${currentProgress} / ${ach.target}</div>
                `}
            </div>
        `;
        grid.appendChild(card);
    });
}

const btnSaveProfileElem = document.getElementById('btnSaveProfile');
if (btnSaveProfileElem) {
    btnSaveProfileElem.addEventListener('click', async () => {
        const newName = document.getElementById('editProfName').value.trim();
        const newPhone = document.getElementById('editProfPhone').value.trim();
        const newGender = document.getElementById('editProfGender')?.value || '';
        const oldPass = document.getElementById('editOldPass').value;
        const newPass = document.getElementById('editNewPass').value;
    
        const btn = btnSaveProfileElem;
    btn.disabled = true;
    btn.textContent = "Đang lưu...";

    try {
        const userDoc = await db.collection('users').doc(sessionUser.email).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const updateData = { name: newName, phone: newPhone, gender: newGender };

            if (oldPass || newPass) {
                if (!oldPass || !newPass) {
                    showToast("Vui lòng nhập cả mật khẩu cũ và mới!", false);
                    btn.disabled = false;
                    btn.textContent = "Lưu Thay Đổi";
                    return;
                }
                if (oldPass !== userData.password) {
                    showToast("Mật khẩu cũ không chính xác!", false);
                    btn.disabled = false;
                    btn.textContent = "Lưu Thay Đổi";
                    return;
                }
                if (newPass.length < 6) {
                    showToast("Mật khẩu mới phải từ 6 ký tự!", false);
                    btn.disabled = false;
                    btn.textContent = "Lưu Thay Đổi";
                    return;
                }
                updateData.password = newPass;
            }

            await db.collection('users').doc(sessionUser.email).update(updateData);
            
            sessionUser.name = newName;
            sessionUser.phone = newPhone;
            sessionUser.gender = newGender;
            gameState.gender = newGender;
            localStorage.setItem('lm_session', JSON.stringify(sessionUser));
            
            if (gameState.avatar) {
                await db.collection('users').doc(sessionUser.email).update({
                    avatar: gameState.avatar,
                    avatarIsBase64: gameState.avatarIsBase64
                });
            }

            showToast("Đã lưu thông tin!", true);
            document.getElementById('editOldPass').value = '';
            document.getElementById('editNewPass').value = '';
        }
    } catch(e) {
        showToast("Lỗi cập nhật: " + e.message, false);
    }
    
    btn.disabled = false;
    btn.textContent = "Lưu Thay Đổi";
    renderProfile();
});
}

window.selectAvatar = function(data, isBase64 = false) {
    gameState.avatar = data;
    gameState.avatarIsBase64 = isBase64;
    saveGameState(gameState);
    renderProfile();
    renderLeaderboard();
    showToast("Đã cập nhật Avatar!");
}

// Avatar File Upload Logic
const avatarUpload = document.getElementById('avatarUpload');
if (avatarUpload) {
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (giới hạn 1MB để tránh phình LocalStorage)
        if (file.size > 1024 * 1024) {
            showToast("Ảnh quá lớn! Vui lòng chọn ảnh dưới 1MB.", true);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const base64String = event.target.result;
            selectAvatar(base64String, true);
        };
        reader.readAsDataURL(file);
    });
}

const btnLogoutElem = document.getElementById('btnLogout');
if (btnLogoutElem) {
    btnLogoutElem.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/loginout';
    });
}

// ── PREMIUM LOGIC ──
window.openPremiumModal = function() {
    try {
        const rawEmail = (sessionUser.email || '').replace('@gmail.com', '');
        const safeName = (sessionUser.name || 'USER').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
        const rawTransferMsg = `${safeName} ${rawEmail}`.toUpperCase();
        const qrTransferMsg = rawTransferMsg.replace(/\s+/g, '');
        
        const contentEl = document.getElementById('premiumTransferContent');
        if (contentEl) contentEl.textContent = rawTransferMsg;
        
        const qrImg = document.getElementById('qrCodeImage');
        if (qrImg) {
            qrImg.src = `https://img.vietqr.io/image/970422-0967086871-compact2.png?amount=149000&addInfo=${encodeURIComponent(qrTransferMsg)}&accountName=Dang%20Kien%20Quyet`;
        }
        
        document.getElementById('premiumModal').style.display = 'flex';
    } catch(e) {
        showToast("Lỗi mở bảng Premium: " + e.message, true);
    }
};

window.confirmPremiumTransfer = async function() {
    const btnConfirmPremium = document.getElementById('btnConfirmPremium');
    if (!btnConfirmPremium) return;
    
    btnConfirmPremium.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
    btnConfirmPremium.disabled = true;

    try {
        const rawEmail = (sessionUser.email || '').replace('@gmail.com', '');
        const safeName = (sessionUser.name || 'USER').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
        const rawTransferMsg = `${safeName} ${rawEmail}`.toUpperCase();
        const approveLink = window.location.href.split('?')[0] + '?action=approve_premium&target=' + encodeURIComponent(sessionUser.email);

        // Upload to Firebase first
        await db.collection('premium_requests').add({
            email: sessionUser.email,
            name: sessionUser.name,
            transferContent: rawTransferMsg,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Try to send email silently
        if (typeof emailjs !== 'undefined') {
            try {
                emailjs.init('Is8N-wrtdAZpySOJW');
                await emailjs.send('service_iksinb9', 'template_z7kjarh', {
                    to_email: 'kienquyet1201@gmail.com',
                    user_name: sessionUser.name || 'USER',
                    user_email: sessionUser.email,
                    transfer_msg: rawTransferMsg,
                    approve_link: approveLink
                });
            } catch(emailErr) {
                console.error("EmailJS sending failed:", emailErr);
            }
        }

        showToast("Đã gửi xác nhận đến Quản trị viên! Vui lòng chờ phản hồi.");
        document.getElementById('premiumModal').style.display = 'none';
    } catch(e) {
        showToast("Lỗi gửi yêu cầu: " + e.message, true);
    }

    btnConfirmPremium.innerHTML = '<i class="fa-solid fa-check"></i> XÁC NHẬN ĐÃ CHUYỂN KHOẢN';
    btnConfirmPremium.disabled = false;
};

// Init
updateHeaderStats();
renderLeaderboard();
renderArena();
renderQuests();
renderShop();
renderProfile();
checkAndUnlockAchievements(gameState);


function checkAndUnlockAchievements(state) {
    const unlockedNow = typeof synchronizeAchievementsWithState === 'function'
        ? synchronizeAchievementsWithState(state)
        : [];
    const newlyUnlocked = unlockedNow.length > 0;
    unlockedNow.forEach((achievement) => {
        showToast('Đã mở khóa danh hiệu: ' + achievement.title + ' (+1 Thành tựu)');
    });

    if (newlyUnlocked) {
        saveGameState(state);
        // Nếu đang ở màn hình map, update lại UI Profile
        if (typeof renderAchievements === 'function' && document.getElementById('achievementsGrid')) {
            renderAchievements();
            document.getElementById('profAchPoints').textContent = state.achievementPoints || 0;
        }
    }
}




    // ==========================================
    // AUTO APPROVAL WEBHOOK LOGIC
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const targetEmail = urlParams.get('target');
    
    if (action === 'approve_premium' && targetEmail) {
        // DEV MODE: client-side approver blocking is intentionally disabled.
        db.collection('users').doc(targetEmail).update({ accountStatus: 'premium' })
            .then(() => {
                showToast('Đã phê duyệt Premium thành công cho: ' + targetEmail);
                window.history.replaceState({}, document.title, window.location.pathname);
            })
            .catch((err) => {
                showToast('Lỗi phê duyệt: ' + err.message, true);
            });
    }
