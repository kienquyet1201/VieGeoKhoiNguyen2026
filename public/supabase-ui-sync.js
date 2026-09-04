/* VieGeo UI data bridge: keeps the restored UI responsive while Supabase loads. */
(function () {
    'use strict';

    const TABLES = new Set(['questions', 'users', 'leaderboard', 'user_feedbacks', 'error_reports']);
    const CACHE_PREFIX = 'VieGeo_supabase_cache_';
    function getClient() {
        try {
            const client = window.supabaseClient || window.supabase || window.VieGeoSupabase?.client;
            return client && typeof client.from === 'function' ? client : null;
        } catch (error) {
            console.warn('[VieGeo UI] Không thể khởi tạo Supabase client:', error);
            return null;
        }
    }

    function readJson(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || '');
            return value === null || value === undefined ? fallback : value;
        } catch (error) {
            return fallback;
        }
    }

    function readCache(table) {
        const value = readJson(`${CACHE_PREFIX}${table}`, []);
        return Array.isArray(value) ? value : [];
    }

    function cacheRows(table, rows) {
        try {
            if (Array.isArray(rows) && rows.length > 0) {
                localStorage.setItem(`${CACHE_PREFIX}${table}`, JSON.stringify(rows));
            }
        } catch (error) {
            console.warn(`[VieGeo UI] Không thể cache ${table}:`, error);
        }
    }

    function normalizeQuestion(row, index) {
        try {
            const source = row || {};
            const options = Array.isArray(source.options)
                ? source.options
                : [source.option_a, source.option_b, source.option_c, source.option_d];
            return {
                ...source,
                id: source.id || `question-${index}`,
                question: source.question || source.question_text || source.questionText || '',
                options: options.map(value => String(value || '').trim()).filter(Boolean),
                correctAnswer: Number(source.correct_option ?? source.answer ?? source.correctAnswer ?? 0) || 0,
                answer: Number(source.correct_option ?? source.answer ?? source.correctAnswer ?? 0) || 0,
                province: source.province || source.province_slug || '',
                island: source.island || source.sub_island || 'Đảo nhỏ 1',
                difficulty: String(source.difficulty || 'easy').toLowerCase(),
                theory: source.theory || source.explanation || '',
                islandTheory: source.island_theory || source.islandTheory || ''
            };
        } catch (error) {
            console.warn('[VieGeo UI] Không thể chuẩn hóa câu hỏi:', error);
            return null;
        }
    }

    async function fetchRows(table, options) {
        const safeTable = String(table || '').toLowerCase();
        const settings = options || {};
        if (!TABLES.has(safeTable)) return [];

        try {
            const client = getClient();
            if (!client) throw new Error('Supabase client chưa sẵn sàng');
            let request = client.from(safeTable).select(settings.columns || '*');
            if (settings.email) request = request.eq('email', settings.email);
            if (settings.limit) request = request.limit(settings.limit);
            if (settings.orderBy) request = request.order(settings.orderBy, { ascending: settings.ascending !== false });
            const { data, error } = await request;
            if (error) throw error;
            const rows = Array.isArray(data) ? data : [];
            console.info(`[VieGeo UI] ${safeTable} loaded`, { count: rows.length });
            if (rows.length > 0) cacheRows(safeTable, rows);
            if (safeTable === 'questions') return rows.map(normalizeQuestion).filter(Boolean);
            return rows;
        } catch (error) {
            if (safeTable === 'leaderboard') {
                console.warn('[VieGeo UI] Không thể tải bảng xếp hạng trực tiếp từ Supabase:', error?.message || error);
                return [];
            }
            console.warn(`[VieGeo UI] ${safeTable} dùng cache Supabase gần nhất:`, error?.message || error);
            const cached = readCache(safeTable);
            const rows = cached.length ? cached : [];
            return safeTable === 'questions' ? rows.map(normalizeQuestion).filter(Boolean) : rows;
        }
    }

    function readSession() {
        const session = readJson('lm_session', {});
        return session && typeof session === 'object' ? session : {};
    }

    function readState() {
        const state = readJson('VieGeo_state', {});
        return state && typeof state === 'object' ? state : {};
    }

    function roleList(value, fallbackRole) {
        try {
            const aliases = { student: 'user', map: 'user', cskh: 'cs', support: 'cs', premium: 'user' };
            const source = value === undefined || value === null || value === '' ? fallbackRole : value;
            const values = [];
            const append = item => {
                if (Array.isArray(item)) {
                    item.forEach(append);
                    return;
                }
                if (typeof item !== 'string') return;
                const trimmed = item.trim();
                if (!trimmed) return;
                if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.includes(',')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (Array.isArray(parsed)) {
                            parsed.forEach(append);
                            return;
                        }
                    } catch (error) {}
                    trimmed.split(',').forEach(append);
                    return;
                }
                values.push(trimmed);
            };
            append(source);
            return [...new Set(values.map(role => aliases[String(role || '').trim().toLowerCase()] || String(role || '').trim().toLowerCase()).filter(role => ['user', 'parent', 'cs', 'admin'].includes(role)))];
        } catch (error) {
            return [];
        }
    }

    function isPremiumAccount(user) {
        try {
            return user?.is_premium === true;
        } catch (error) {
            return false;
        }
    }

    window.VieGeoPremium = Object.assign(window.VieGeoPremium || {}, {
        isActive: isPremiumAccount
    });

    async function reconcilePremiumAccount(client, user, email) {
        // Premium is an administrator-controlled public.users field. The UI must never infer or write it.
        return user || {};
    }

    async function getCurrentUser() {
        try {
            const user = await window.VieGeoUserStore?.ready?.({ refreshStreak: false });
            if (user) return user;
        } catch (error) {
            console.warn('[VieGeo UI] Không thể tải hồ sơ chuẩn:', error);
        }
        return null;
    }

    function writeLocalUser(user) {
        // Deliberately retained as a no-op for legacy callers: critical profile state lives in public.users only.
        return user || null;
    }

    function setText(id, value) {
        try {
            const node = document.getElementById(id);
            if (node) node.textContent = value;
        } catch (error) {
            console.warn(`[VieGeo UI] Không thể cập nhật #${id}:`, error);
        }
    }

    function hydrateTopbar(user) {
        try {
            const premium = isPremiumAccount(user);
            setText('sharedHeart', premium ? '∞' : String(user.hearts ?? 3));
            setText('sharedStreak', String(user.streak ?? 0));
            setText('sharedGem', String(user.gems ?? 0));
            setText('sharedXp', `${Number(user.xp ?? 0)} XP`);

            const select = document.getElementById('sharedRole');
            if (!select) return;
            const labels = { user: 'Học sinh', parent: 'Phụ huynh', cs: 'CSKH', admin: 'Quản trị viên' };
            const roles = roleList(user.roles, user.role);
            const active = window.VieGeoUserStore?.getActiveRole?.() || user.role || roles[0] || '';
            select.replaceChildren();
            roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role;
                option.textContent = labels[role] || role;
                option.selected = role === active;
                select.appendChild(option);
            });
            const wrapper = select.closest('.shared-role-control');
            if (wrapper) wrapper.hidden = roles.length < 2;
            select.disabled = roles.length < 2;
        } catch (error) {
            console.warn('[VieGeo UI] Không thể đồng bộ thanh điều hướng:', error);
        }
    }

    function hydrateProfile(user) {
        try {
            const state = readState();
            const xp = Number(user.xp ?? 0);
            const completed = Array.isArray(state.completedNodes) ? state.completedNodes.length : Number(state.completedLessons || 0);
            setText('dispName', user.display_name || 'Người chơi');
            setText('dispEmail', user.email || '');
            setText('profStreak', String(user.streak ?? 0));
            setText('profXp', String(xp));
            setText('profStyle', xp >= 500 ? 'Học tập bền vững' : (xp > 0 ? 'Đang khám phá' : 'Chưa có dữ liệu'));
            const premium = isPremiumAccount(user);
            setText('premiumStatus', premium ? 'Tài khoản Premium' : 'Tài khoản Free');
            const premiumStatus = document.getElementById('premiumStatus');
            if (premiumStatus) premiumStatus.classList.toggle('is-premium', premium);
            const name = document.getElementById('profName');
            const phone = document.getElementById('profPhone');
            const gender = document.getElementById('profGender');
            if (name && !name.value) name.value = user.display_name || '';
            if (phone && !phone.value) phone.value = user.phone || '';
            if (gender && user.gender) gender.value = user.gender;
            const achievementValue = document.querySelector('.achievement-card strong');
            if (achievementValue) achievementValue.textContent = String(Math.max(0, Math.floor(completed / 3) + (xp >= 100 ? 1 : 0)));
        } catch (error) {
            console.warn('[VieGeo UI] Không thể đồng bộ hồ sơ:', error);
        }
    }

    function leaderboardModel(rows) {
        const displayName = (row) => {
            const names = [row?.user_name, row?.username, row?.display_name, row?.full_name, row?.name];
            const found = names.map(value => String(value || '').trim())
                .find(value => value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
            return found || 'Học viên';
        };
        return (Array.isArray(rows) ? rows : []).map((row, index) => ({
            id: row.id || row.user_id || row.email || `rank-${index}`,
            name: displayName(row),
            email: row.email || row.user_email || '',
            xp: Number(row.xp ?? row.exp ?? row.score ?? row.total_xp ?? row.points ?? 0),
            streak: Number(row.current_streak ?? row.streak ?? 0)
        })).sort((first, second) => second.xp - first.xp);
    }

    function hydrateLeaderboard(rows, user) {
        try {
            const list = document.getElementById('rankingList');
            if (!list) return;
            // leaderboard.js owns the full ranking page and fetches users as a
            // fallback when the optional leaderboard view is empty. Do not let
            // this generic sync overwrite those real rows with an empty view.
            if (document.getElementById('leaderboardPodium')) return;
            if (!rows || rows.length === 0) {
                list.innerHTML = '<table style="width:100%;border-collapse:collapse;"><tbody><tr><td colspan="4" style="text-align: center; padding: 30px; color: #64748b;">Chưa có dữ liệu học viên nào trong thời gian này. Hãy trở thành người đầu tiên!</td></tr></tbody></table>';
                return;
            }
            const ranks = leaderboardModel(rows);
            list.replaceChildren();
            ranks.slice(0, 10).forEach((entry, index) => {
                const row = document.createElement('div');
                row.className = `ranking-row${String(entry.email).toLowerCase() === String(user.email || '').toLowerCase() ? ' current-user' : ''}`;
                row.innerHTML = `<span class="rank-number">${index + 1}</span><div class="rank-avatar blue-avatar">${String(entry.name).slice(0, 2).toUpperCase()}</div><div class="rank-user"><strong></strong><span>Cấp ${Math.max(1, Math.floor(entry.xp / 250) + 1)}</span></div><div class="rank-streak">🔥 ${entry.streak}</div><div class="rank-xp">${entry.xp.toLocaleString('vi-VN')} XP</div><div class="rank-change neutral-change">—</div>`;
                row.querySelector('.rank-user strong').textContent = entry.name;
                list.appendChild(row);
            });
        } catch (error) {
            console.warn('[VieGeo UI] Không thể đồng bộ bảng xếp hạng:', error);
        }
    }

    function completedLessonCount(state) {
        if (Array.isArray(state.completedNodes)) return state.completedNodes.length;
        if (Array.isArray(state.completedLessons)) return state.completedLessons.length;
        return Number(state.completed_lessons ?? state.completedLessons ?? 0) || 0;
    }

    function hydrateStudentDashboard(rows, user) {
        try {
            const state = readState();
            const completed = completedLessonCount(state);
            const total = Number(user.total_lessons ?? user.totalLessons ?? state.totalLessons ?? state.totalNodes ?? 0) || 0;
            const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
            const heroLabel = document.querySelector('.hero-progress .progress-label strong');
            const heroFill = document.querySelector('.hero-progress .progress-fill');
            if (heroLabel) heroLabel.textContent = `${percent}%`;
            if (heroFill) heroFill.style.width = `${percent}%`;

            document.querySelectorAll('.course-card').forEach(card => {
                const button = card.querySelector('[data-course]');
                const course = String(button?.dataset.course || '').trim();
                const progress = Number(state.courseProgress?.[course] ?? state.course_progress?.[course] ?? 0) || 0;
                const label = card.querySelector('.course-topline strong');
                const fill = card.querySelector('.course-progress-fill');
                if (label) label.textContent = `${Math.min(100, Math.max(0, Math.round(progress)))}%`;
                if (fill) fill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
            });

            const list = document.querySelector('.student-main .leaderboard-list');
            if (!list) return;
            list.replaceChildren();
            if (!rows || rows.length === 0) {
                list.innerHTML = '<div class="empty-state">Chưa có học viên trong bảng xếp hạng.</div>';
                return;
            }
            const ranks = leaderboardModel(rows);
            ranks.slice(0, 3).forEach((entry, index) => {
                const item = document.createElement('div');
                item.className = `leaderboard-item${String(entry.email).toLowerCase() === String(user.email || '').toLowerCase() ? ' current-place' : ''}`;
                item.innerHTML = `<span class="rank">${index + 1}</span><div class="leader-avatar"></div><div><strong></strong><small></small></div><span>${['🥇', '🥈', '🥉'][index] || ''}</span>`;
                item.querySelector('.leader-avatar').textContent = String(entry.name).slice(0, 2).toUpperCase();
                item.querySelector('strong').textContent = entry.name;
                item.querySelector('small').textContent = `${entry.xp.toLocaleString('vi-VN')} XP · 🔥 ${entry.streak}`;
                list.appendChild(item);
            });
        } catch (error) {
            console.warn('[VieGeo UI] Không thể tải dữ liệu học viên:', error);
        }
    }

    function hydrateParent(user) {
        try {
            const state = readState();
            const completed = Array.isArray(state.completedNodes) ? state.completedNodes.length : Number(state.completedLessons || 0);
            const streak = Number(user.current_streak ?? user.streak ?? state.streak ?? 0);
            const today = new Date().toISOString().slice(0, 10);
            const hasLearnedToday = String(state.lastLessonDate || state.lastStudyDate || '') === today;
            setText('statStreak', `${streak} Ngày`);
            setText('statCompleted', `${completed} Bài`);
            setText('statActivity', hasLearnedToday ? 'Đã học bài' : 'Chưa học bài');
            const report = document.getElementById('parentReport');
            if (report) report.textContent = hasLearnedToday
                ? `Học sinh đã học bài hôm nay, hoàn thành ${completed} bài và duy trì chuỗi ${streak} ngày.`
                : `Học sinh hiện đã hoàn thành ${completed} bài. Hôm nay chưa có bài học mới được ghi nhận.`;
        } catch (error) {
            console.warn('[VieGeo UI] Không thể đồng bộ trang phụ huynh:', error);
        }
    }

    function hydrateMap(questions) {
        try {
            window.VieGeoRemoteQuestions = Array.isArray(questions) ? questions : [];
            window.dispatchEvent(new CustomEvent('viegeo:questions-ready', { detail: window.VieGeoRemoteQuestions }));
        } catch (error) {
            console.warn('[VieGeo UI] Không thể cập nhật dữ liệu bản đồ:', error);
        }
    }

    async function initializePageData() {
        try {
            const user = await getCurrentUser();
            writeLocalUser(user);
            hydrateTopbar(user);
            hydrateProfile(user);
            hydrateParent(user);
            const [questions, boardRows] = await Promise.all([
                fetchRows('questions', { limit: 500 }),
                fetchRows('leaderboard', { columns: '*', limit: 100, orderBy: 'score', ascending: false })
            ]);
            hydrateMap(questions);
            hydrateLeaderboard(boardRows, user);
            hydrateStudentDashboard(boardRows, user);
            document.documentElement.dataset.viegeoDataReady = 'true';
        } catch (error) {
            console.error('[VieGeo UI] Không thể đồng bộ trang:', error);
            document.documentElement.dataset.viegeoDataReady = 'fallback';
        }
    }

    async function withRequestState(button, task) {
        const trigger = button instanceof HTMLElement ? button : null;
        const originalLabel = trigger ? trigger.innerHTML : '';
        try {
            if (trigger) {
                trigger.disabled = true;
                trigger.classList.add('viegeo-request-loading');
                trigger.setAttribute('aria-busy', 'true');
            }
            return await task();
        } finally {
            if (trigger) {
                trigger.disabled = false;
                trigger.classList.remove('viegeo-request-loading');
                trigger.removeAttribute('aria-busy');
                if (originalLabel) trigger.innerHTML = originalLabel;
            }
        }
    }

    window.VieGeoData = window.VieGeoData || { fetchRows, getCurrentUser, normalizeQuestion, withRequestState, readState, readSession };
    document.addEventListener('DOMContentLoaded', initializePageData, { once: true });
}());
