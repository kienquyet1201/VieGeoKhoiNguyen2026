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
            let values = Array.isArray(source) ? source : (source ? [source] : []);
            if (typeof value === 'string' && value.trim().startsWith('[')) values = JSON.parse(value);
            return [...new Set(values.map(role => aliases[String(role || '').trim().toLowerCase()] || String(role || '').trim().toLowerCase()).filter(role => ['user', 'parent', 'cs', 'admin'].includes(role)))];
        } catch (error) {
            return [];
        }
    }

    async function getCurrentUser() {
        const session = readSession();
        let email = String(session.email || session.user?.email || '').trim().toLowerCase();
        try {
            const client = getClient();
            if (client?.auth?.getUser) {
                const result = await client.auth.getUser();
                email = String(result?.data?.user?.email || email).trim().toLowerCase();
            }
            if (email && client) {
                let result = await client.from('users').select('*').eq('email', email).maybeSingle();
                if (result.error && /email|column|schema/i.test(String(result.error.message || ''))) {
                    const compatible = await client.from('users').select('*');
                    if (!compatible.error) {
                        result = {
                            data: (compatible.data || []).find(row => String(row.email || row.user_email || '').trim().toLowerCase() === email) || null,
                            error: null
                        };
                    }
                }
                if (!result.error && result.data) {
                    cacheRows('users', [result.data]);
                    return result.data;
                }
                if (result.error) console.warn('[VieGeo UI] Không tải được người dùng hiện tại:', result.error.message);
            }
        } catch (error) {
            console.warn('[VieGeo UI] Dùng phiên cục bộ cho người dùng hiện tại:', error);
        }
        const cached = readCache('users').find(row => String(row.email || row.user_email || '').toLowerCase() === email);
        return cached || { ...session, email, roles: session.roles || [session.role || 'user'] };
    }

    function writeLocalUser(user) {
        try {
            const state = { ...readState() };
            const remoteState = user.game_state && typeof user.game_state === 'object'
                ? user.game_state
                : (user.gameState && typeof user.gameState === 'object' ? user.gameState : {});
            if (Array.isArray(remoteState.completedNodes)) state.completedNodes = [...new Set(remoteState.completedNodes.map(String))];
            if (Array.isArray(remoteState.completedLessons)) state.completedLessons = [...new Set(remoteState.completedLessons.map(String))];
            if (remoteState.currentNode) state.currentNode = remoteState.currentNode;
            if (remoteState.totalLessons !== undefined) state.totalLessons = Number(remoteState.totalLessons) || 0;
            if (remoteState.courseProgress && typeof remoteState.courseProgress === 'object') state.courseProgress = remoteState.courseProgress;
            state.hearts = Number(user.hearts ?? state.hearts ?? 3);
            state.streak = Number(user.current_streak ?? user.streak ?? state.streak ?? 0);
            state.gems = Number(user.gems ?? state.gems ?? 500);
            state.xp = Number(user.xp ?? user.exp ?? state.xp ?? 0);
            localStorage.setItem('VieGeo_state', JSON.stringify(state));

            const session = { ...readSession(), email: user.email || user.user_email || readSession().email };
            const sessionRoleValue = session.activeRole || session.role;
            const sessionRole = sessionRoleValue ? roleList(sessionRoleValue, 'user')[0] : '';
            const hasExplicitRoles = Object.prototype.hasOwnProperty.call(user || {}, 'roles');
            const remoteRoles = roleList(hasExplicitRoles ? user.roles : (user.active_role || user.role));
            const activeRole = remoteRoles.includes(sessionRole) ? sessionRole : (remoteRoles[0] || '');
            session.roles = [...new Set(remoteRoles)];
            if (activeRole) {
                session.role = activeRole;
                session.activeRole = activeRole;
            } else {
                delete session.role;
                delete session.activeRole;
            }
            session.name = user.name || user.full_name || session.name || '';
            localStorage.setItem('lm_session', JSON.stringify(session));
            window.dispatchEvent(new CustomEvent('viegeo:user-hydrated', { detail: session }));
        } catch (error) {
            console.warn('[VieGeo UI] Không thể đồng bộ phiên cục bộ:', error);
        }
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
            const state = readState();
            const premium = user.account_status === 'premium' || user.isPremium === true;
            setText('sharedHeart', premium ? '∞' : String(user.hearts ?? state.hearts ?? 3));
            setText('sharedStreak', String(user.current_streak ?? user.streak ?? state.streak ?? 0));
            setText('sharedGem', String(user.gems ?? state.gems ?? 500));
            setText('sharedXp', `${Number(user.xp ?? user.exp ?? state.xp ?? 0)} XP`);

            const select = document.getElementById('sharedRole');
            if (!select) return;
            const labels = { user: 'Học sinh', parent: 'Phụ huynh', cs: 'CSKH', admin: 'Quản trị viên' };
            const session = readSession();
            const hasExplicitRoles = Object.prototype.hasOwnProperty.call(user || {}, 'roles');
            const roles = roleList(hasExplicitRoles ? user.roles : (user.active_role || user.role));
            const requested = roleList(session.activeRole || session.role || user.active_role || user.role)[0] || '';
            const active = roles.includes(requested) ? requested : (roles[0] || '');
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
            const xp = Number(user.xp ?? user.exp ?? state.xp ?? 0);
            const completed = Array.isArray(state.completedNodes) ? state.completedNodes.length : Number(state.completedLessons || 0);
            setText('dispName', user.name || user.full_name || 'Người chơi');
            setText('dispEmail', user.email || '');
            setText('profStreak', String(user.current_streak ?? user.streak ?? state.streak ?? 0));
            setText('profXp', String(xp));
            setText('profStyle', xp >= 500 ? 'Học tập bền vững' : (xp > 0 ? 'Đang khám phá' : 'Chưa có dữ liệu'));
            setText('premiumStatus', user.account_status === 'premium' ? 'Tài khoản Premium' : 'Tài khoản Free');
            const name = document.getElementById('profName');
            const phone = document.getElementById('profPhone');
            const gender = document.getElementById('profGender');
            if (name && !name.value) name.value = user.name || user.full_name || '';
            if (phone && !phone.value) phone.value = user.phone || '';
            if (gender && user.gender) gender.value = user.gender;
            const achievementValue = document.querySelector('.achievement-card strong');
            if (achievementValue) achievementValue.textContent = String(Math.max(0, Math.floor(completed / 3) + (xp >= 100 ? 1 : 0)));
        } catch (error) {
            console.warn('[VieGeo UI] Không thể đồng bộ hồ sơ:', error);
        }
    }

    function leaderboardModel(rows) {
        return (Array.isArray(rows) ? rows : []).map((row, index) => ({
            id: row.id || row.user_id || row.email || `rank-${index}`,
            name: row.name || row.full_name || row.display_name || row.user_name || row.email || 'Thám hiểm gia',
            email: row.email || row.user_email || '',
            xp: Number(row.xp ?? row.exp ?? row.score ?? row.total_xp ?? row.points ?? 0),
            streak: Number(row.current_streak ?? row.streak ?? 0)
        })).sort((first, second) => second.xp - first.xp);
    }

    function hydrateLeaderboard(rows, user) {
        try {
            const list = document.getElementById('rankingList');
            if (!list) return;
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
