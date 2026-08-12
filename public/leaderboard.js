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

    function getClient() {
        var client = window.supabaseClient || window.supabase || (window.VieGeoSupabase && window.VieGeoSupabase.client);
        return client && typeof client.from === 'function' ? client : null;
    }

    function getLeaderboardState() {
        try {
            return JSON.parse(localStorage.getItem('VieGeo_state') || '{}');
        } catch (error) {
            return {};
        }
    }

    function getSession() {
        try {
            return JSON.parse(localStorage.getItem('lm_session') || '{}');
        } catch (error) {
            return {};
        }
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
            name: String(source.name || source.full_name || source.display_name || source.user_name || source.email || source.user_email || 'Học viên'),
            score: score,
            streak: Number(source.current_streak ?? source.streak ?? 0) || 0
        };
    }

    async function fetchLeaderboardRows() {
        var client = getClient();
        if (!client) throw new Error('Supabase client chưa sẵn sàng.');

        var results = await Promise.all([
            client.from('leaderboard').select('*').limit(500),
            client.from('users').select('*').limit(500)
        ]);
        var boardResult = results[0];
        var usersResult = results[1];
        if (!boardResult.error && Array.isArray(boardResult.data) && boardResult.data.length) {
            var users = Array.isArray(usersResult.data) ? usersResult.data : [];
            var usersById = new Map();
            users.forEach(function (user) {
                if (user.id !== undefined && user.id !== null) usersById.set(String(user.id), user);
                if (user.email) usersById.set(String(user.email).trim().toLowerCase(), user);
            });
            return boardResult.data.map(function (row) {
                var user = usersById.get(String(row.user_id ?? row.id ?? ''))
                    || usersById.get(String(row.user_email || row.email || '').trim().toLowerCase())
                    || {};
                return Object.assign({}, user, row, {
                    current_streak: row.current_streak ?? user.current_streak ?? 0,
                    score: row.score ?? user.score ?? user.xp ?? 0
                });
            });
        }
        if (boardResult.error) {
            console.warn('[VieGeo Leaderboard] Không đọc được public.leaderboard:', boardResult.error.message || boardResult.error);
        }

        if (usersResult.error) throw usersResult.error;
        return Array.isArray(usersResult.data) ? usersResult.data : [];
    }

    async function fetchCurrentUser() {
        var session = getSession();
        var authUser = null;
        var client = getClient();
        if (client && client.auth && typeof client.auth.getUser === 'function') {
            var authResult = await client.auth.getUser();
            authUser = authResult && authResult.data && authResult.data.user;
        }
        var email = String((authUser && authUser.email) || session.email || '').trim().toLowerCase();
        if (!email || !client) return Object.assign({}, session, authUser || {});
        var result = await client.from('users').select('*').eq('email', email).maybeSingle();
        if (result.error) throw result.error;
        return result.data || Object.assign({}, session, authUser || {}, { email: email });
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
            rankingList.innerHTML = '<div class="empty-state">Chưa có dữ liệu xếp hạng trên Supabase.</div>';
            return;
        }
        var currentEmail = String(currentUser.email || '').trim().toLowerCase();
        rows.slice(0, 100).forEach(function (entry, index) {
            var row = document.createElement('div');
            row.className = 'ranking-row' + (entry.email && entry.email === currentEmail ? ' current-user' : '');
            row.innerHTML = '<span class="rank-number"></span><div class="rank-avatar blue-avatar"></div>'
                + '<div class="rank-user"><strong></strong><span></span></div><div class="rank-streak"></div>'
                + '<div class="rank-xp"></div><div class="rank-change neutral-change">—</div>';
            row.querySelector('.rank-number').textContent = String(index + 1);
            row.querySelector('.rank-avatar').textContent = avatarText(entry.name);
            row.querySelector('.rank-user strong').textContent = entry.name;
            row.querySelector('.rank-user span').textContent = entry.email === currentEmail ? 'Bạn' : 'Học viên';
            row.querySelector('.rank-streak').textContent = '🔥 ' + entry.streak;
            row.querySelector('.rank-xp').textContent = entry.score.toLocaleString('vi-VN') + ' điểm';
            rankingList.appendChild(row);
        });
    }

    function renderPersonalRank(rows) {
        var value = document.getElementById('personalRankValue');
        var hint = document.getElementById('personalRankHint');
        var progress = document.getElementById('personalRankProgress');
        var email = String(currentUser.email || '').trim().toLowerCase();
        var index = rows.findIndex(function (row) { return row.email && row.email === email; });
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
        if (hint) hint.textContent = index === 0 ? 'Bạn đang dẫn đầu bảng xếp hạng.' : 'Cần thêm ' + gap.toLocaleString('vi-VN') + ' điểm để lên hạng ' + index + '.';
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
        if (rankingList) rankingList.innerHTML = '<div class="empty-state">Đang tải dữ liệu từ Supabase...</div>';
        if (podium) podium.replaceChildren();
        try {
            var results = await Promise.all([fetchLeaderboardRows(), fetchCurrentUser()]);
            leaderboardRows = results[0];
            currentUser = results[1] || {};
            renderData();
        } catch (error) {
            console.error('[VieGeo Leaderboard] Không thể đồng bộ Supabase:', error);
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
