(function () {
    'use strict';

    var statHearts = document.getElementById('statHearts');
    var statStreak = document.getElementById('statStreak');
    var statGems = document.getElementById('statGems');
    var statXp = document.getElementById('statXp');
    var statTrophies = document.getElementById('statTrophies');
    var themeButton = document.getElementById('themeButton');
    var homeButton = document.getElementById('homeButton');
    var filterButtons = document.querySelectorAll('.filter-button');
    var leagueSelect = document.getElementById('leagueSelect');
    var toast = document.getElementById('toast');
    var podium = document.getElementById('leaderboardPodium');
    var rankingList = document.getElementById('rankingList');
    var activeBoard = 'weekly';
    var leaderboardRows = [];
    var currentUser = {};
    var emptyLeaderboardHtml = '<table style="width:100%;border-collapse:collapse;"><tbody><tr><td colspan="4" style="text-align: center; padding: 30px; color: #64748b;">Chưa có dữ liệu học viên nào trong thời gian này. Hãy trở thành người đầu tiên!</td></tr></tbody></table>';

    function getClient() {
        var client = window.supabaseClient || window.supabase || (window.VieGeoSupabase && window.VieGeoSupabase.client);
        return client && typeof client.from === 'function' ? client : null;
    }

    function getLeaderboardState() {
        return window.VieGeoUserStore?.get?.() || window.VieGeoCurrentUser || {};
    }

    function getSession() {
        return window.VieGeoUserStore?.get?.() || window.VieGeoCurrentUser || {};
    }

    function updateStats() {
        var state = getLeaderboardState();
        if (statHearts) statHearts.textContent = Number(state.hearts || 0);
        if (statStreak) statStreak.textContent = Number(state.streak || 0);
        if (statGems) statGems.textContent = Number(state.gems || 0);
        if (statXp) statXp.textContent = Number(state.xp || 0) + ' XP';
        if (statTrophies) statTrophies.textContent = Number(state.trophies || state.pvpWins || 0);
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('VieGeo_theme', theme);
        if (themeButton) themeButton.innerHTML = theme === 'light'
            ? '<i class="fa-solid fa-moon"></i>'
            : '<i class="fa-solid fa-sun"></i>';
    }

    function switchTheme() {
        applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    }

    function normalizeRow(row, index) {
        var source = row || {};
        var scoreField = activeBoard === 'weekly'
            ? (source.weekly_score ?? source.score)
            : activeBoard === 'monthly'
                ? (source.monthly_score ?? source.score)
                : (source.all_time_score ?? source.total_score ?? source.score);
        var score = Number(scoreField ?? source.xp ?? 0) || 0;
        return {
            id: source.id || source.user_id || source.email || source.user_email || 'rank-' + index,
            email: String(source.email || source.user_email || '').trim().toLowerCase(),
            name: String(source.user_name || source.name || source.full_name || source.display_name || source.email || source.user_email || 'Học viên'),
            score: score,
            streak: Number(source.current_streak ?? source.streak ?? 0) || 0
        };
    }

    async function fetchLeaderboardRows() {
        const supabase = getClient();
        if (!supabase) throw new Error('Supabase client chưa sẵn sàng.');
        const leaderboardResult = await supabase.rpc('get_leaderboard', { p_limit: 500 });
        if (leaderboardResult.error) throw leaderboardResult.error;
        return Array.isArray(leaderboardResult.data) ? leaderboardResult.data : [];
    }

    async function fetchCurrentUser() {
        return await window.VieGeoUserStore?.ready?.({ refreshStreak: false }) || {};
    }

    function isCurrentEntry(entry) {
        var currentId = String(currentUser.id || currentUser.user_id || '').trim();
        var entryId = String(entry.id || '').trim();
        var currentEmail = String(currentUser.email || currentUser.user_email || '').trim().toLowerCase();
        var currentName = String(currentUser.user_name || currentUser.name || '').trim().toLowerCase();
        if (currentId && entryId && currentId === entryId) return true;
        if (currentEmail && entry.email && currentEmail === entry.email) return true;
        return Boolean(!currentEmail && currentName && String(entry.name || '').trim().toLowerCase() === currentName);
    }

    function avatarText(name) {
        return String(name || 'HV').trim().split(/\s+/).slice(-2).map(function (part) {
            return part.charAt(0);
        }).join('').toUpperCase() || 'HV';
    }

    function createPodiumCard(entry, rank) {
        var classes = { 1: 'first-place', 2: 'second-place', 3: 'third-place' };
        var avatarClasses = { 1: 'gold-avatar', 2: 'blue-avatar', 3: 'purple-avatar' };
        var medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
        var card = document.createElement('article');
        card.className = 'podium-card ' + classes[rank];
        card.innerHTML = (rank === 1 ? '<div class="crown">👑</div>' : '')
            + '<div class="podium-rank"></div><div class="podium-avatar"></div><span class="podium-medal"></span>'
            + '<h2></h2><p></p><div class="podium-stats"><span></span><span></span></div>';
        card.querySelector('.podium-rank').textContent = String(rank);
        card.querySelector('.podium-avatar').classList.add(avatarClasses[rank]);
        card.querySelector('.podium-avatar').textContent = avatarText(entry.name);
        card.querySelector('.podium-medal').textContent = medals[rank];
        card.querySelector('h2').textContent = entry.name;
        card.querySelector('p').textContent = entry.score.toLocaleString('vi-VN') + ' điểm';
        var stats = card.querySelectorAll('.podium-stats span');
        stats[0].textContent = '🔥 ' + entry.streak + ' ngày';
        stats[1].textContent = '🏆 ' + rank;
        return card;
    }

    function renderPodium(rows) {
        if (!podium) return;
        podium.replaceChildren();
        var order = [1, 0, 2];
        order.forEach(function (sourceIndex) {
            if (rows[sourceIndex]) podium.appendChild(createPodiumCard(rows[sourceIndex], sourceIndex + 1));
        });
    }

    function renderRanking(rows) {
        if (!rankingList) return;
        rankingList.replaceChildren();
        if (!rows.length) {
            rankingList.innerHTML = emptyLeaderboardHtml;
            return;
        }
        rows.slice(0, 100).forEach(function (entry, index) {
            var row = document.createElement('div');
            var current = isCurrentEntry(entry);
            row.className = 'ranking-row' + (current ? ' current-user' : '');
            row.innerHTML = '<span class="rank-number"></span><div class="rank-avatar blue-avatar"></div>'
                + '<div class="rank-user"><strong></strong><span></span></div><div class="rank-streak"></div>'
                + '<div class="rank-xp"></div><div class="rank-change neutral-change">—</div>';
            row.querySelector('.rank-number').textContent = String(index + 1);
            row.querySelector('.rank-avatar').textContent = avatarText(entry.name);
            row.querySelector('.rank-user strong').textContent = entry.name;
            row.querySelector('.rank-user span').textContent = current ? 'Bạn' : 'Học viên';
            row.querySelector('.rank-streak').textContent = '🔥 ' + entry.streak;
            row.querySelector('.rank-xp').textContent = entry.score.toLocaleString('vi-VN') + ' điểm';
            rankingList.appendChild(row);
        });
    }

    function renderPersonalRank(rows) {
        var value = document.getElementById('personalRankValue');
        var hint = document.getElementById('personalRankHint');
        var progress = document.getElementById('personalRankProgress');
        var index = rows.findIndex(isCurrentEntry);
        if (index < 0) {
            if (value) value.textContent = '—';
            if (hint) hint.textContent = 'Tài khoản chưa có điểm xếp hạng.';
            if (progress) progress.style.width = '0';
            return;
        }
        var target = index > 0 ? rows[index - 1].score : rows[index].score;
        var gap = Math.max(0, target - rows[index].score + (index > 0 ? 1 : 0));
        var percent = target > 0 ? Math.min(100, Math.round((rows[index].score / target) * 100)) : 100;
        if (value) value.textContent = '#' + (index + 1);
        if (hint) hint.textContent = index === 0 ? 'Bạn đang dẫn đầu bảng xếp hạng.' : 'Cần thêm ' + gap.toLocaleString('vi-VN') + ' điểm để lên hạng #' + index + '.';
        if (progress) progress.style.width = percent + '%';
    }

    function renderData() {
        var normalized = leaderboardRows.map(normalizeRow).sort(function (a, b) {
            return b.score - a.score || b.streak - a.streak || a.name.localeCompare(b.name, 'vi');
        });
        renderPodium(normalized.slice(0, 3));
        renderRanking(normalized);
        renderPersonalRank(normalized);
    }

    async function loadLeaderboard() {
        if (rankingList) rankingList.innerHTML = '<div class="empty-state">Đang cập nhật bảng xếp hạng...</div>';
        if (podium) podium.replaceChildren();
        try {
            var results = await Promise.all([fetchLeaderboardRows(), fetchCurrentUser()]);
            leaderboardRows = results[0];
            currentUser = results[1] || {};
            renderData();
        } catch (error) {
            console.warn('[VieGeo Leaderboard] Không thể đồng bộ Supabase:', error?.message || error);
            leaderboardRows = [];
            renderData();
        }
    }

    function selectBoard(event) {
        filterButtons.forEach(function (button) { button.classList.remove('active'); });
        event.currentTarget.classList.add('active');
        activeBoard = event.currentTarget.dataset.board || 'weekly';
        renderData();
        showToast('Đã cập nhật bảng xếp hạng.');
    }

    function changeLeague() { showToast('Đã chuyển hạng đấu.'); }
    function goHome() { window.location.href = 'student-dashboard.html'; }

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        window.setTimeout(function () { toast.classList.remove('show'); }, 2200);
    }

    function initializeLeaderboard() {
        updateStats();
        applyTheme(localStorage.getItem('VieGeo_theme') === 'light' ? 'light' : 'dark');
        if (themeButton) themeButton.addEventListener('click', switchTheme);
        if (homeButton) homeButton.addEventListener('click', goHome);
        if (leagueSelect) leagueSelect.addEventListener('change', changeLeague);
        filterButtons.forEach(function (button) { button.addEventListener('click', selectBoard); });
        loadLeaderboard();
    }

    document.addEventListener('DOMContentLoaded', initializeLeaderboard);
}());
