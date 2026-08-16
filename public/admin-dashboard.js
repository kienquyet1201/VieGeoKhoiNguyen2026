/* Supabase-backed controller for the restored Admin Dashboard UI. */
(function () {
    'use strict';

    const labels = {
        overview: ['Bảng điều khiển VieGeo', 'Theo dõi người dùng, nội dung học tập và hoạt động hệ thống trong một nơi.'],
        users: ['Quản lý người dùng', 'Theo dõi tài khoản, quyền truy cập và trạng thái sử dụng.'],
        lessons: ['Kho học liệu', 'Nhập và quản lý bộ câu hỏi học tập.'],
        monitoring: ['Giám sát học tập', 'Danh sách người dùng có hoạt động gần đây.'],
        support: ['Chăm sóc khách hàng', 'Phản hồi các góp ý của người dùng.'],
        settings: ['Cài đặt', 'Tùy chỉnh giao diện và phiên quản trị.']
    };
    let allUsers = [];
    let selectedTicket = null;
    let questionBankRequestId = 0;

    function byId(id) { return document.getElementById(id); }

    function showToast(message, variant) {
        try {
            const toast = byId('toast');
            if (!toast) return;
            toast.textContent = message;
            toast.className = `toast show${variant ? ` ${variant}` : ''}`;
            window.setTimeout(() => { toast.className = 'toast'; }, 2600);
        } catch (error) {
            console.warn('[VieGeo Admin] Không thể hiện thông báo:', error);
        }
    }

    function escapeText(value) {
        return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
    }

    function formatTime(value) {
        try {
            if (!value) return 'Chưa có hoạt động';
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? 'Vừa cập nhật' : date.toLocaleString('vi-VN');
        } catch (error) {
            return 'Vừa cập nhật';
        }
    }

    function activeWithinNinetySeconds(user) {
        try {
            const timestamp = Number(user.last_active_client || user.lastActive || 0);
            return timestamp > 0 && Date.now() - timestamp <= 90000;
        } catch (error) {
            return false;
        }
    }

    function displayName(user) {
        return String(user?.user_name || user?.name || user?.full_name || user?.display_name || user?.email || user?.user_email || 'Người dùng');
    }

    function roleName(role) {
        return ({ user: 'Học sinh', student: 'Học sinh', premium: 'Premium', parent: 'Phụ huynh', cs: 'CSKH', admin: 'Quản trị viên' })[String(role || 'user').toLowerCase()] || 'Học sinh';
    }

    function roleClass(role) {
        return ({ premium: 'premium-role', parent: 'parent-role', cs: 'support-role', admin: 'admin-role' })[String(role || '').toLowerCase()] || 'student-role';
    }

    function normalizeRoles(value) {
        const source = [];
        const append = item => {
            if (Array.isArray(item)) {
                item.forEach(append);
                return;
            }
            if (typeof item !== 'string') {
                if (item !== undefined && item !== null) source.push(String(item));
                return;
            }
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
            source.push(trimmed);
        };
        append(value);
        return [...new Set(source.map(item => String(item || '').trim().toLowerCase()).filter(Boolean))];
    }

    const managedRoles = ['user', 'parent', 'admin', 'cs'];

    function canonicalRole(value) {
        const role = String(value || '').trim().toLowerCase();
        return ({ student: 'user', map: 'user', cskh: 'cs', support: 'cs', premium: 'user' })[role] || role;
    }

    function userEmail(user) {
        return String(user?.email || user?.user_email || user?.legacy_data?.email || '').trim().toLowerCase();
    }

    function rolesOfUser(user) {
        const hasRolesColumn = Object.prototype.hasOwnProperty.call(user || {}, 'roles');
        const roles = normalizeRoles(hasRolesColumn ? user?.roles : user?.role).map(canonicalRole).filter(role => managedRoles.includes(role));
        const primary = canonicalRole(user?.active_role || roles[0] || user?.role || 'user');
        if (managedRoles.includes(primary) && !roles.includes(primary)) roles.push(primary);
        return roles.length ? [...new Set(roles)] : ['user'];
    }

    function identifyUserQuery(query, user) {
        const email = userEmail(user);
        if (email && Object.prototype.hasOwnProperty.call(user || {}, 'email')) return query.eq('email', email);
        if (email && Object.prototype.hasOwnProperty.call(user || {}, 'user_email')) return query.eq('user_email', email);
        return query.eq('id', user?.id);
    }

    function sameUser(first, second) {
        if (first?.id !== undefined && second?.id !== undefined && String(first.id) === String(second.id)) return true;
        const firstEmail = userEmail(first);
        return Boolean(firstEmail && firstEmail === userEmail(second));
    }

    async function fetchUsers() {
        const supabase = window.supabaseClient || window.supabase || window.VieGeoSupabase?.client;
        if (!supabase || typeof supabase.from !== 'function') throw new Error('Supabase client chưa sẵn sàng.');
        const orderedResult = await supabase.from('users').select('*').order('score', { ascending: false });
        if (!orderedResult.error) return Array.isArray(orderedResult.data) ? orderedResult.data : [];
        console.warn('[VieGeo Admin] Cột score chưa sẵn sàng, tải danh sách users không sắp xếp:', orderedResult.error.message || orderedResult.error);
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return (Array.isArray(data) ? data : []).sort((first, second) => Number(second.score ?? second.xp ?? 0) - Number(first.score ?? first.xp ?? 0));
    }

    async function fetchSubmissionCount() {
        const client = window.supabaseClient || window.supabase || window.VieGeoSupabase?.client;
        if (!client || typeof client.from !== 'function') return 0;
        const { count, error } = await client.from('submissions').select('id', { count: 'exact', head: true });
        if (error) throw error;
        return Number(count || 0);
    }

    async function updateUserRoles(user, selectedRoles, button) {
        const client = window.supabaseClient || window.supabase || window.VieGeoSupabase?.client;
        const roles = [...new Set((Array.isArray(selectedRoles) ? selectedRoles : []).map(canonicalRole).filter(role => managedRoles.includes(role)))];
        if (!client || !roles.length) {
            showToast('Mỗi tài khoản cần có ít nhất một vai trò.', 'error');
            return;
        }
        if (button) button.disabled = true;
        try {
            const existingRoles = rolesOfUser(user);
            const previousActive = canonicalRole(user.active_role || existingRoles[0] || user.role);
            const primaryRole = roles.includes(previousActive) ? previousActive : roles[0];
            const supportsRoles = Object.prototype.hasOwnProperty.call(user || {}, 'roles');
            const payload = { role: supportsRoles ? primaryRole : roles.join(',') };
            if (supportsRoles) payload.roles = roles;
            if (Object.prototype.hasOwnProperty.call(user || {}, 'active_role')) payload.active_role = primaryRole;
            if (Object.prototype.hasOwnProperty.call(user || {}, 'updated_at')) payload.updated_at = new Date().toISOString();
            let query = identifyUserQuery(client.from('users').update(payload), user);
            const { data, error } = await query.select('*').maybeSingle();
            if (error) throw error;
            const index = allUsers.findIndex(item => sameUser(item, user));
            if (index >= 0) allUsers[index] = data || { ...user, ...payload };
            renderUsers(allUsers);
            showToast(`Đã cập nhật ${roles.length} vai trò cho ${displayName(user)}.`, 'success');
        } catch (error) {
            console.error('[VieGeo Admin] Không thể cập nhật vai trò:', error);
            showToast('Không thể cập nhật vai trò lúc này.', 'error');
            if (button) button.disabled = false;
        }
    }

    function selectPanel(section) {
        try {
            document.querySelectorAll('.menu-item[data-section]').forEach(button => button.classList.toggle('active', button.dataset.section === section));
            document.querySelectorAll('.admin-section[data-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === section));
            const title = labels[section] || labels.overview;
            if (byId('pageTitle')) byId('pageTitle').textContent = title[0];
            if (byId('pageSubtitle')) byId('pageSubtitle').textContent = title[1];
        } catch (error) {
            console.warn('[VieGeo Admin] Không thể đổi tab:', error);
        }
    }

    function renderUsers(rows) {
        try {
            const body = byId('userTableBody');
            if (!body) return;
            const keyword = String(byId('searchInput')?.value || '').trim().toLowerCase();
            const role = String(byId('roleFilter')?.value || 'all');
            const filtered = (Array.isArray(rows) ? rows : []).filter(user => {
                const matchesKeyword = !keyword || `${displayName(user)} ${userEmail(user)}`.toLowerCase().includes(keyword);
                const userRoles = rolesOfUser(user);
                const filterRole = canonicalRole(role);
                const matchesRole = role === 'all' || userRoles.includes(filterRole);
                return matchesKeyword && matchesRole;
            });
            body.replaceChildren();
            if (!filtered.length) {
                body.innerHTML = '<tr><td colspan="6"><div class="empty-state">Chưa có người dùng phù hợp để hiển thị.</div></td></tr>';
                return;
            }
            filtered.forEach(user => {
                const name = displayName(user);
                const userRoles = rolesOfUser(user);
                const score = Math.max(0, Number(user.score ?? user.xp ?? 0) || 0);
                const streak = Math.max(0, Number(user.current_streak ?? user.streak ?? 0) || 0);
                const row = document.createElement('tr');
                row.dataset.userIndex = String(allUsers.indexOf(user));
                row.innerHTML = `<td>${escapeText(userEmail(user) || 'Chưa có email')}</td><td>${escapeText(name)}</td><td><div class="role-badge-list"></div></td><td>${score.toLocaleString('vi-VN')}</td><td>🔥 ${streak}</td><td><div class="user-role-editor" role="group" aria-label="Vai trò của ${escapeText(name)}"><label><input type="checkbox" value="user"> Học sinh</label><label><input type="checkbox" value="parent"> Phụ huynh</label><label><input type="checkbox" value="admin"> Quản trị viên</label><label><input type="checkbox" value="cs"> CSKH</label><button class="mini-button" type="button" data-save-user-role>Lưu vai trò</button></div></td>`;
                const badgeList = row.querySelector('.role-badge-list');
                userRoles.forEach(currentRole => {
                    const badge = document.createElement('span');
                    badge.className = `role-badge ${roleClass(currentRole)}`;
                    badge.textContent = roleName(currentRole);
                    badgeList.appendChild(badge);
                });
                row.querySelectorAll('.user-role-editor input').forEach(input => {
                    input.checked = userRoles.includes(input.value);
                });
                body.appendChild(row);
            });
        } catch (error) {
            console.error('[VieGeo Admin] Không thể render người dùng:', error);
        }
    }

    function renderErrors(rows) {
        try {
            const container = byId('systemErrorList');
            if (!container) return;
            container.replaceChildren();
            const items = (Array.isArray(rows) ? rows : []).slice(0, 8);
            if (!items.length) {
                container.innerHTML = '<div class="empty-state">Chưa có báo cáo lỗi mới.</div>';
                return;
            }
            items.forEach(item => {
                const node = document.createElement('article');
                node.className = 'notice-item system-error-item';
                node.innerHTML = '<div class="system-error-copy"><strong></strong><span></span></div><span class="system-error-mark">⚠️</span>';
                node.querySelector('strong').textContent = item.error_message || item.message || item.content || 'Báo cáo lỗi không có nội dung';
                node.querySelector('.system-error-copy span').textContent = `${item.page || 'Không rõ trang'} · ${formatTime(item.created_at || item.created_at_client)}`;
                container.appendChild(node);
            });
        } catch (error) {
            console.error('[VieGeo Admin] Không thể render báo cáo lỗi:', error);
        }
    }

    function renderPremiumRequests(requests) {
        try {
            const container = byId('premiumRequestList');
            if (!container) return;
            const premium = Array.isArray(requests) ? requests : [];
            container.replaceChildren();
            if (!premium.length) {
                container.innerHTML = '<div class="empty-state">Chưa có yêu cầu Premium cần xử lý.</div>';
                return;
            }
            premium.slice(0, 20).forEach(request => {
                const node = document.createElement('article');
                node.className = 'notice-item';
                node.innerHTML = '<div><strong></strong><span></span></div><div class="action-group"><button class="mini-button" type="button" data-premium-action="approved">Duyệt</button><button class="mini-button secondary" type="button" data-premium-action="rejected">Từ chối</button></div>';
                node.querySelector('strong').textContent = request.name || displayName(request);
                node.querySelector('span').textContent = `${request.user_email || request.email || 'Không có email'} · ${formatTime(request.created_at)}`;
                node.querySelectorAll('[data-premium-action]').forEach(button => {
                    button.addEventListener('click', () => reviewPremiumRequest(request, button.dataset.premiumAction, button));
                });
                container.appendChild(node);
            });
        } catch (error) {
            console.warn('[VieGeo Admin] Không thể render Premium:', error);
        }
    }

    async function fetchPendingPremiumRequests() {
        const client = window.supabaseClient || window.supabase || window.VieGeoSupabase?.client;
        if (!client || typeof client.from !== 'function') return [];
        const { data, error } = await client
            .from('premium_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return Array.isArray(data) ? data : [];
    }

    async function reviewPremiumRequest(request, status, sourceButton) {
        const client = window.supabaseClient || window.supabase || window.VieGeoSupabase?.client;
        const email = String(request?.user_email || request?.email || '').trim().toLowerCase();
        const requestId = request?.id;
        if (!client || !email || requestId === undefined || requestId === null || !['approved', 'rejected'].includes(status)) {
            showToast('Không đủ dữ liệu để xử lý yêu cầu Premium.', 'error');
            return;
        }
        const buttons = sourceButton?.closest('.notice-item')?.querySelectorAll('[data-premium-action]') || [];
        buttons.forEach(button => { button.disabled = true; });
        try {
            const now = new Date().toISOString();
            let requestResult = await client
                .from('premium_requests')
                .update({ status, reviewed_at: now, updated_at: now })
                .eq('id', requestId)
                .select('*');
            if (requestResult.error && /reviewed_at|updated_at|column|schema/i.test(String(requestResult.error.message || ''))) {
                requestResult = await client
                    .from('premium_requests')
                    .update({ status })
                    .eq('id', requestId)
                    .select('*');
            }
            if (requestResult.error) throw requestResult.error;
            if (!Array.isArray(requestResult.data) || requestResult.data.length === 0) {
                throw new Error('Không tìm thấy yêu cầu Premium cần xử lý.');
            }

            if (status === 'approved') {
                let linkedUser = allUsers.find(user => userEmail(user) === email) || null;
                if (!linkedUser) {
                    const { data: users, error: usersError } = await client.from('users').select('*');
                    if (usersError) throw usersError;
                    if (Array.isArray(users)) allUsers = users;
                    linkedUser = allUsers.find(user => userEmail(user) === email) || null;
                }
                if (!linkedUser) {
                    console.warn('[VieGeo Admin] Yêu cầu đã duyệt nhưng chưa tìm thấy hồ sơ users:', { email, requestId });
                } else {
                    const currentState = linkedUser.game_state && typeof linkedUser.game_state === 'object' ? linkedUser.game_state : {};
                    const notifications = Array.isArray(currentState.notifications) ? [...currentState.notifications] : [];
                    if (!notifications.some(item => item?.id === `premium-approved-${requestId}`)) {
                        notifications.unshift({ id: `premium-approved-${requestId}`, title: 'Premium đã được kích hoạt', message: 'Yêu cầu nâng cấp của bạn đã được duyệt thành công.', created_at: now });
                    }
                    const userPayload = {};
                    if (Object.prototype.hasOwnProperty.call(linkedUser, 'account_status')) userPayload.account_status = 'premium';
                    if (Object.prototype.hasOwnProperty.call(linkedUser, 'is_premium')) userPayload.is_premium = true;
                    if (Object.prototype.hasOwnProperty.call(linkedUser, 'game_state')) userPayload.game_state = { ...currentState, notifications };
                    if (Object.prototype.hasOwnProperty.call(linkedUser, 'updated_at')) userPayload.updated_at = now;
                    if (Object.keys(userPayload).length > 0) {
                        const updateResult = await identifyUserQuery(client.from('users').update(userPayload), linkedUser).select('*');
                        if (updateResult.error) {
                            console.warn('[VieGeo Admin] Yêu cầu đã duyệt; hồ sơ users sẽ đồng bộ từ premium_requests:', updateResult.error);
                        }
                    }
                }
            }
            showToast(status === 'approved' ? 'Đã duyệt Premium.' : 'Đã từ chối yêu cầu Premium.', 'success');
            await loadDashboard();
        } catch (error) {
            console.error('[VieGeo Admin] Không thể xử lý Premium:', error);
            showToast('Không thể cập nhật yêu cầu Premium.', 'error');
            buttons.forEach(button => { button.disabled = false; });
        }
    }

    function renderMonitoring(users) {
        try {
            const body = byId('monitoringTableBody');
            if (!body) return;
            body.replaceChildren();
            const active = (Array.isArray(users) ? users : []).filter(activeWithinNinetySeconds);
            if (!active.length) {
                body.innerHTML = '<tr><td colspan="4"><div class="empty-state">Chưa có phiên học trực tuyến trong 90 giây gần nhất.</div></td></tr>';
                return;
            }
            active.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${escapeText(displayName(user))}</td><td>${escapeText(formatTime(user.last_active_client || user.updated_at))}</td><td><span class="status-badge active-status"><i class="status-dot"></i>Online</span></td><td><button class="mini-button secondary" type="button" disabled title="Session replay chưa được kết nối">Replay</button></td>`;
                body.appendChild(row);
            });
        } catch (error) {
            console.warn('[VieGeo Admin] Không thể render giám sát:', error);
        }
    }

    function renderSupport(rows) {
        try {
            const list = byId('supportAdminTicketList');
            if (!list) return;
            const tickets = Array.isArray(rows) ? rows : [];
            list.replaceChildren();
            if (!tickets.length) {
                list.innerHTML = '<div class="empty-state">Chưa có góp ý hoặc yêu cầu hỗ trợ.</div>';
                return;
            }
            tickets.slice(0, 20).forEach(ticket => {
                const node = document.createElement('button');
                node.type = 'button';
                node.className = 'support-admin-ticket';
                node.dataset.ticketId = String(ticket.id || ticket.user_email || '');
                node.innerHTML = '<strong></strong><span></span>';
                node.querySelector('strong').textContent = ticket.user_email || ticket.sender_name || 'Người dùng';
                node.querySelector('span').textContent = ticket.content || ticket.message || 'Góp ý không có nội dung';
                node.addEventListener('click', () => {
                    selectedTicket = ticket;
                    list.querySelectorAll('.support-admin-ticket').forEach(button => button.classList.toggle('active', button === node));
                    if (byId('supportAdminCustomer')) byId('supportAdminCustomer').textContent = ticket.user_email || 'Người dùng';
                    if (byId('supportAdminMeta')) byId('supportAdminMeta').textContent = formatTime(ticket.created_at || ticket.created_at_client);
                    if (byId('supportAdminMessages')) byId('supportAdminMessages').textContent = ticket.content || ticket.message || '';
                });
                list.appendChild(node);
            });
        } catch (error) {
            console.warn('[VieGeo Admin] Không thể render hỗ trợ:', error);
        }
    }

    function questionOptionText(question, index) {
        const option = (Array.isArray(question.options) ? question.options : [question.option_a, question.option_b, question.option_c, question.option_d])[index];
        return String(option || '').trim();
    }

    function provinceLabel(slug) {
        const option = Array.from(byId('bulkImportProvince')?.options || []).find(item => item.value === slug);
        return option?.textContent?.trim() || slug || 'Chưa phân tỉnh';
    }

    function renderQuestionBank(rows) {
        const body = byId('questionBankTableBody');
        const summary = byId('questionBankSummary');
        if (!body) return;
        const questions = Array.isArray(rows) ? rows : [];
        body.replaceChildren();
        if (summary) summary.textContent = `Đang hiển thị ${questions.length} câu hỏi phù hợp.`;
        if (!questions.length) {
            body.innerHTML = '<tr><td colspan="8"><div class="empty-state">Không có câu hỏi phù hợp với bộ lọc đã chọn.</div></td></tr>';
            return;
        }

        const fragment = document.createDocumentFragment();
        questions.forEach((question, index) => {
            const correctIndex = Math.max(0, Math.min(3, Number(question.correct_option) || 0));
            const row = document.createElement('tr');
            const cells = [
                String(index + 1),
                provinceLabel(String(question.province || '')),
                String(question.island || 'Chưa chọn đảo'),
                String(question.topic || 'Chưa có chủ đề'),
                String(question.difficulty || 'easy'),
                String(question.question || 'Câu hỏi không có nội dung'),
                `${String.fromCharCode(65 + correctIndex)}. ${questionOptionText(question, correctIndex) || 'Chưa có đáp án'}`,
                String(question.theory || question.explanation || 'Chưa có giải thích')
            ];
            cells.forEach((value, cellIndex) => {
                const cell = document.createElement('td');
                cell.textContent = value;
                if (cellIndex === 1 || cellIndex === 2) cell.className = 'question-bank-location';
                if (cellIndex === 4) cell.innerHTML = `<span class="question-bank-difficulty">${escapeText(value)}</span>`;
                if (cellIndex === 5) cell.className = 'question-bank-question';
                if (cellIndex === 7) cell.className = 'question-bank-explanation';
                row.appendChild(cell);
            });
            fragment.appendChild(row);
        });
        body.appendChild(fragment);
    }

    function populateQuestionBankFilters() {
        const provinceFilter = byId('questionProvinceFilter');
        const sourceProvince = byId('bulkImportProvince');
        if (provinceFilter && sourceProvince && provinceFilter.options.length === 1) {
            sourceProvince.querySelectorAll('optgroup').forEach(group => provinceFilter.appendChild(group.cloneNode(true)));
        }
        const islandFilter = byId('questionIslandFilter');
        if (islandFilter && islandFilter.options.length === 1) {
            for (let index = 1; index <= 34; index += 1) {
                const option = document.createElement('option');
                option.value = `Đảo nhỏ ${index}`;
                option.textContent = `Đảo nhỏ ${index}`;
                islandFilter.appendChild(option);
            }
        }
    }

    async function loadQuestionBank() {
        const requestId = ++questionBankRequestId;
        const body = byId('questionBankTableBody');
        const summary = byId('questionBankSummary');
        const refreshButton = byId('refreshQuestionBankButton');
        const client = window.supabaseClient || window.supabase || window.VieGeoSupabase?.client;
        if (!client || typeof client.from !== 'function') {
            renderQuestionBank([]);
            if (summary) summary.textContent = 'Kho câu hỏi chưa sẵn sàng.';
            return;
        }
        if (body) body.innerHTML = '<tr><td colspan="8"><div class="empty-state">Đang tải ngân hàng câu hỏi...</div></td></tr>';
        if (summary) summary.textContent = 'Đang cập nhật danh sách câu hỏi...';
        if (refreshButton) refreshButton.disabled = true;
        try {
            let query = client.from('questions').select('*');
            const province = String(byId('questionProvinceFilter')?.value || '').trim();
            const island = String(byId('questionIslandFilter')?.value || '').trim();
            if (province) query = query.eq('province', province);
            if (island) query = query.eq('island', island);
            const { data, error } = await query.limit(1000);
            if (error) throw error;
            if (requestId !== questionBankRequestId) return;
            renderQuestionBank(Array.isArray(data) ? data : []);
        } catch (error) {
            if (requestId !== questionBankRequestId) return;
            console.error('[VieGeo Admin] Không thể tải ngân hàng câu hỏi:', error);
            renderQuestionBank([]);
            if (summary) summary.textContent = `Không thể tải câu hỏi: ${error.message || error}`;
        } finally {
            if (requestId === questionBankRequestId && refreshButton) refreshButton.disabled = false;
        }
    }

    async function loadDashboard() {
        try {
            const dataApi = window.VieGeoData;
            if (!dataApi) throw new Error('Lớp dữ liệu Supabase chưa sẵn sàng');
            const connection = byId('connectionBadge');
            if (connection) connection.textContent = 'Đang kết nối…';
            const [user, users, submissionCount, errors, feedbacks, premiumRequests] = await Promise.all([
                dataApi.getCurrentUser(),
                fetchUsers(),
                fetchSubmissionCount(),
                dataApi.fetchRows('error_reports', { limit: 100, orderBy: 'created_at', ascending: false }),
                dataApi.fetchRows('user_feedbacks', { limit: 100, orderBy: 'created_at', ascending: false }),
                fetchPendingPremiumRequests()
            ]);
            allUsers = Array.isArray(users) ? users : [];
            if (byId('adminEmail')) byId('adminEmail').textContent = user.email || 'Admin VieGeo';
            if (byId('metricOnline')) byId('metricOnline').textContent = String(allUsers.filter(activeWithinNinetySeconds).length);
            if (byId('metricSubmissions')) byId('metricSubmissions').textContent = String(submissionCount);
            if (byId('metricUsers')) byId('metricUsers').textContent = String(allUsers.length);
            if (byId('metricErrors')) byId('metricErrors').textContent = String(errors.length);
            if (connection) {
                connection.textContent = 'Hệ thống đã kết nối';
                connection.classList.remove('error');
                connection.classList.add('connected');
            }
            renderUsers(allUsers);
            renderErrors(errors);
            renderPremiumRequests(premiumRequests);
            renderMonitoring(allUsers);
            renderSupport(feedbacks);
            console.info('[VieGeo Admin] Đồng bộ giao diện hoàn tất', { users: allUsers.length, errors: errors.length, feedbacks: feedbacks.length });
        } catch (error) {
            console.error('[VieGeo Admin] Không thể tải trang quản trị:', error);
            if (byId('connectionBadge')) {
                byId('connectionBadge').textContent = 'Tạm thời mất kết nối';
                byId('connectionBadge').classList.add('error');
            }
            renderUsers(allUsers);
            renderErrors([]);
            renderPremiumRequests([]);
            renderMonitoring(allUsers);
            renderSupport([]);
        }
    }

    async function handleUpload() {
        const button = byId('processUploadButton');
        const file = byId('fileUpload')?.files?.[0];
        const preview = byId('uploadPreview');
        try {
            if (!file) throw new Error('Hãy chọn tệp .txt trước khi upload.');
            const text = await file.text();
            const province = String(byId('importProvince')?.value || '').trim();
            const island = String(byId('importIsland')?.value || '').trim() || 'Đảo nhỏ 1';
            const difficulty = String(byId('importDifficulty')?.value || 'easy').toLowerCase();
            const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
            const questions = lines.map((line, index) => {
                const fields = line.split('|').map(field => field.trim());
                if (fields.length < 6) throw new Error(`Dòng ${index + 1} chưa đủ 6 cột phân cách bằng |.`);
                return {
                    question: fields[0], option_a: fields[1], option_b: fields[2], option_c: fields[3], option_d: fields[4],
                    correct_option: Math.max(0, Math.min(3, Number(fields[5]) || 0)), province, island,
                    topic: fields[6] || island, theory: fields[7] || '', difficulty
                };
            });
            if (!questions.length) throw new Error('Tệp không có dòng câu hỏi hợp lệ.');
            const client = window.supabaseClient || window.supabase;
            if (!client?.from) throw new Error('Supabase chưa sẵn sàng.');
            const insert = async () => {
                const { error } = await client.from('questions').insert(questions);
                if (error) throw error;
                return questions.length;
            };
            const count = await window.VieGeoData.withRequestState(button, insert);
            if (preview) preview.textContent = `Đã thêm ${count} câu hỏi vào kho câu hỏi.`;
            if (byId('fileUpload')) byId('fileUpload').value = '';
            if (byId('fileNameDisplay')) byId('fileNameDisplay').textContent = 'Chưa có tệp được chọn.';
            showToast(`Đã thêm ${count} câu hỏi.`, 'success');
            await loadQuestionBank();
        } catch (error) {
            console.error('[VieGeo Admin] Upload câu hỏi thất bại:', error);
            console.error('[VieGeo Admin] Không thể tải câu hỏi lên:', error);
            if (preview) preview.textContent = 'Không thể tải câu hỏi lên. Vui lòng kiểm tra nội dung và thử lại.';
            showToast('Không thể tải câu hỏi lên lúc này.', 'error');
        }
    }

    function sanitizeImportText(value, maxLength) {
        try {
            const fallback = String(value || '').replace(/<[^>]*>/g, '').trim().slice(0, maxLength || 4000);
            return window.VieGeoSecurity?.sanitizeText
                ? window.VieGeoSecurity.sanitizeText(value, maxLength || 4000)
                : fallback;
        } catch (error) {
            return String(value || '').trim().slice(0, maxLength || 4000);
        }
    }

    function populateBulkIslandOptions() {
        try {
            const select = byId('bulkImportSubIsland');
            if (!select || select.options.length > 1) return;
            for (let index = 1; index <= 34; index += 1) {
                const option = document.createElement('option');
                option.value = `Đảo nhỏ ${index}`;
                option.textContent = index === 11 ? 'Đảo nhỏ 11 · Trạm kiểm tra Dễ'
                    : index === 22 ? 'Đảo nhỏ 22 · Trạm kiểm tra Trung bình'
                        : index === 33 ? 'Đảo nhỏ 33 · Trạm kiểm tra Khó'
                            : index === 34 ? 'Đảo nhỏ 34 · BOSS cuối'
                                : `Đảo nhỏ ${index}`;
                select.appendChild(option);
            }
        } catch (error) {
            console.error('[VieGeo Admin] Không thể dựng danh sách đảo:', error);
        }
    }

    async function loadBossSummaryTheory() {
        const province = String(byId('bulkImportProvince')?.value || '').trim();
        const textarea = byId('bulkImportProvinceSummaryTheory');
        const status = byId('bossSummaryTheoryStatus');
        const client = window.supabaseClient || window.supabase || window.VieGeoSupabase?.client;
        if (!textarea) return;
        if (!province) {
            textarea.value = '';
            if (status) status.textContent = 'Chọn Tỉnh/Thành để tải hoặc cập nhật nội dung đã lưu.';
            return;
        }
        if (!client?.from) {
            if (status) status.textContent = 'Kho nội dung chưa sẵn sàng.';
            return;
        }
        textarea.disabled = true;
        if (status) status.textContent = 'Đang tải lý thuyết tổng kết đã lưu...';
        try {
            const { data, error } = await client
                .from('questions')
                .select('island_theory')
                .eq('province', province)
                .eq('island', 'Đảo nhỏ 34')
                .limit(100);
            if (error) throw error;
            const row = (Array.isArray(data) ? data : []).find(item => String(item?.island_theory || '').trim());
            textarea.value = String(row?.island_theory || '').trim();
            if (status) status.textContent = row
                ? 'Đã tải nội dung tổng kết BOSS hiện có.'
                : 'Tỉnh này chưa có lý thuyết tổng kết BOSS.';
        } catch (error) {
            console.error('[VieGeo Admin] Không thể tải lý thuyết tổng kết BOSS:', error);
            console.error('[VieGeo Admin] Không thể tải nội dung tổng kết:', error);
            if (status) status.textContent = 'Không thể tải nội dung tổng kết. Vui lòng thử lại.';
        } finally {
            textarea.disabled = false;
        }
    }

    async function saveBossSummaryTheory() {
        const province = String(byId('bulkImportProvince')?.value || '').trim();
        const theory = sanitizeImportText(byId('bulkImportProvinceSummaryTheory')?.value || '', 12000);
        const button = byId('saveBossSummaryTheoryButton');
        const status = byId('bossSummaryTheoryStatus');
        const client = window.supabaseClient || window.supabase || window.VieGeoSupabase?.client;
        try {
            if (!province) throw new Error('Hãy chọn Tỉnh/Thành trước khi lưu lý thuyết tổng kết.');
            if (!theory) throw new Error('Hãy nhập nội dung lý thuyết tổng kết BOSS.');
            if (!client?.from) throw new Error('Supabase chưa sẵn sàng.');
            if (button) button.disabled = true;
            if (status) status.textContent = 'Đang lưu lý thuyết tổng kết...';
            const { data, error } = await client
                .from('questions')
                .update({ island_theory: theory })
                .eq('province', province)
                .eq('island', 'Đảo nhỏ 34')
                .select('id');
            if (error) throw error;
            const count = Array.isArray(data) ? data.length : 0;
            if (!count) throw new Error('Tỉnh này chưa có câu hỏi BOSS. Hãy upload câu hỏi cho Đảo nhỏ 34 trước.');
            if (status) status.textContent = `Đã lưu lý thuyết tổng kết vào ${count} câu hỏi BOSS.`;
            showToast('Đã lưu lý thuyết tổng kết BOSS.', 'success');
        } catch (error) {
            console.error('[VieGeo Admin] Không thể lưu lý thuyết tổng kết BOSS:', error);
            console.error('[VieGeo Admin] Không thể lưu lý thuyết tổng kết:', error);
            if (status) status.textContent = 'Không thể lưu nội dung tổng kết. Vui lòng thử lại.';
            showToast('Không thể lưu lý thuyết tổng kết lúc này.', 'error');
        } finally {
            if (button) button.disabled = false;
        }
    }

    function parseBulkQuestionText(rawText, shared) {
        const lines = String(rawText || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (!lines.length) throw new Error('Hãy dán ít nhất một dòng câu hỏi.');
        return lines.map((line, lineIndex) => {
            const fields = line.split('|').map(field => field.trim());
            if (fields.length < 7) throw new Error(`Lỗi định dạng ở dòng ${lineIndex + 1}: cần tối thiểu 7 cột, ngăn cách bằng dấu |.`);
            const [question, optionA, optionB, optionC, optionD, correctRaw, difficultyRaw, theory = ''] = fields;
            const correctOption = Number(correctRaw);
            const difficulty = String(difficultyRaw || '').toLowerCase();
            if (![question, optionA, optionB, optionC, optionD].every(Boolean)) throw new Error(`Lỗi định dạng ở dòng ${lineIndex + 1}: nội dung câu hỏi và 4 đáp án không được để trống.`);
            if (!Number.isInteger(correctOption) || correctOption < 0 || correctOption > 3) throw new Error(`Lỗi định dạng ở dòng ${lineIndex + 1}: Index đúng phải là số từ 0 đến 3.`);
            if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new Error(`Lỗi định dạng ở dòng ${lineIndex + 1}: độ khó phải là easy, medium hoặc hard.`);
            return {
                question: sanitizeImportText(question, 1000), option_a: sanitizeImportText(optionA, 500), option_b: sanitizeImportText(optionB, 500),
                option_c: sanitizeImportText(optionC, 500), option_d: sanitizeImportText(optionD, 500), correct_option: correctOption,
                province: shared.province, island: shared.island, topic: shared.topic, theory: sanitizeImportText(theory, 6000),
                island_theory: shared.island === 'Đảo nhỏ 34'
                    ? (shared.provinceSummaryTheory || shared.islandTheory)
                    : shared.islandTheory,
                difficulty
            };
        });
    }

    function bulkSharedFields() {
        return {
            province: String(byId('bulkImportProvince')?.value || '').trim(),
            island: String(byId('bulkImportSubIsland')?.value || '').trim(),
            topic: sanitizeImportText(byId('bulkImportTopic')?.value || '', 160),
            islandTheory: sanitizeImportText(byId('bulkImportIslandTheory')?.value || '', 12000),
            provinceSummaryTheory: sanitizeImportText(byId('bulkImportProvinceSummaryTheory')?.value || '', 12000)
        };
    }

    function previewBulkQuestionText() {
        const preview = byId('bulkUploadPreview');
        if (!preview) return;
        try {
            const text = byId('bulkQuestionText')?.value || '';
            if (!text.trim()) { preview.textContent = 'Dán nội dung văn bản để xem trước dữ liệu hợp lệ.'; return; }
            const shared = bulkSharedFields();
            const items = parseBulkQuestionText(text, { ...shared, province: shared.province || 'chưa-chọn', island: shared.island || 'Đảo nhỏ', topic: shared.topic || 'Chủ đề' });
            const sample = items.slice(0, 3).map((item, index) => `${index + 1}. ${item.question}\n   Đáp án đúng: ${item.correct_option} · ${item.difficulty}`).join('\n\n');
            preview.textContent = `Sẵn sàng lưu ${items.length} câu hỏi.\n\n${sample}${items.length > 3 ? '\n\n…' : ''}`;
        } catch (error) {
            preview.textContent = error.message || 'Nội dung chưa đúng định dạng.';
        }
    }

    async function insertBulkQuestions(rows) {
        const client = window.supabaseClient || window.supabase;
        if (!client?.from) throw new Error('Supabase chưa sẵn sàng. Vui lòng thử lại sau.');
        const uniqueRows = Array.from(new Map(rows.map(row => [String(row.question || '').trim(), row])).values());
        const saveRows = async payload => client
            .from('questions')
            .upsert(payload, { onConflict: 'question' })
            .select('id,question');
        const { data, error } = await saveRows(uniqueRows);
        if (!error) return Array.isArray(data) ? data.length : uniqueRows.length;
        if (/island_theory|column|schema/i.test(String(error.message || error.details || ''))) {
            const compatibleRows = uniqueRows.map(({ island_theory, ...row }) => row);
            const fallback = await saveRows(compatibleRows);
            if (!fallback.error) return Array.isArray(fallback.data) ? fallback.data.length : compatibleRows.length;
            throw fallback.error;
        }
        throw error;
    }

    async function processBulkTextImport() {
        const button = byId('btnProcessUpload');
        const preview = byId('bulkUploadPreview');
        try {
            const shared = bulkSharedFields();
            if (!shared.province || !shared.island || !shared.topic) throw new Error('Hãy chọn Tỉnh/Thành, Đảo nhỏ và nhập Chủ đề bài học.');
            const rows = parseBulkQuestionText(byId('bulkQuestionText')?.value || '', shared);
            if (preview) preview.textContent = `Đang lưu ${rows.length} câu hỏi…`;
            const execute = () => insertBulkQuestions(rows);
            const count = window.VieGeoData?.withRequestState ? await window.VieGeoData.withRequestState(button, execute) : await execute();
            if (byId('bulkQuestionText')) byId('bulkQuestionText').value = '';
            if (preview) preview.textContent = `Đã lưu thành công ${count} câu hỏi. Các câu trùng đã được cập nhật.`;
            showToast(`Đã lưu ${count} câu hỏi.`, 'success');
            await loadQuestionBank();
            console.info('[VieGeo Admin] Bulk text import success', { count, province: shared.province, island: shared.island });
        } catch (error) {
            console.error('[VieGeo Admin] Bulk text import failed:', error);
            console.error('[VieGeo Admin] Không thể lưu câu hỏi:', error);
            if (preview) preview.textContent = 'Không thể lưu câu hỏi. Vui lòng kiểm tra nội dung và thử lại.';
            showToast('Không thể lưu câu hỏi lúc này.', 'error');
        }
    }

    window.processBulkTextImport = processBulkTextImport;

    function initializeInteractions() {
        try {
            document.querySelectorAll('.menu-item[data-section], [data-open-section]').forEach(button => button.addEventListener('click', () => selectPanel(button.dataset.section || button.dataset.openSection)));
            byId('searchInput')?.addEventListener('input', () => renderUsers(allUsers));
            byId('roleFilter')?.addEventListener('change', () => renderUsers(allUsers));
            byId('userTableBody')?.addEventListener('click', event => {
                const button = event.target.closest('[data-save-user-role]');
                const row = button?.closest('tr');
                if (!button || !row) return;
                const user = allUsers[Number(row.dataset.userIndex)];
                const selectedRoles = Array.from(row.querySelectorAll('.user-role-editor input:checked')).map(input => input.value);
                if (user) updateUserRoles(user, selectedRoles, button);
            });
            byId('refreshMonitoringButton')?.addEventListener('click', loadDashboard);
            byId('refreshSupportAdminButton')?.addEventListener('click', loadDashboard);
            populateBulkIslandOptions();
            populateQuestionBankFilters();
            byId('btnProcessUpload')?.addEventListener('click', processBulkTextImport);
            byId('bulkQuestionText')?.addEventListener('input', previewBulkQuestionText);
            ['bulkImportProvince', 'bulkImportSubIsland', 'bulkImportTopic', 'bulkImportIslandTheory', 'bulkImportProvinceSummaryTheory']
                .forEach((id) => byId(id)?.addEventListener('change', previewBulkQuestionText));
            byId('bulkImportProvince')?.addEventListener('change', loadBossSummaryTheory);
            byId('saveBossSummaryTheoryButton')?.addEventListener('click', saveBossSummaryTheory);
            ['questionProvinceFilter', 'questionIslandFilter']
                .forEach((id) => byId(id)?.addEventListener('change', loadQuestionBank));
            byId('refreshQuestionBankButton')?.addEventListener('click', loadQuestionBank);
            byId('fileUpload')?.addEventListener('change', event => {
                const name = event.target.files?.[0]?.name || 'Chưa có tệp được chọn.';
                if (byId('fileNameDisplay')) byId('fileNameDisplay').textContent = name;
            });
            byId('backToHomeButton')?.addEventListener('click', () => { window.location.href = 'student-dashboard.html'; });
            byId('logoutButton')?.addEventListener('click', () => {
                if (typeof window.VieGeoLogout === 'function') window.VieGeoLogout('loginout.html');
                else { localStorage.removeItem('lm_session'); window.location.href = 'loginout.html'; }
            });
            loadBossSummaryTheory();
            byId('settingsLogoutButton')?.addEventListener('click', () => byId('logoutButton')?.click());
            byId('themeButton')?.addEventListener('click', () => window.toggleGlobalTheme?.());
            byId('settingsThemeButton')?.addEventListener('click', () => byId('themeButton')?.click());
            byId('roleButton')?.addEventListener('click', () => { window.location.href = 'map.html'; });
            byId('settingsRoleButton')?.addEventListener('click', () => byId('roleButton')?.click());
            byId('supportAdminSendButton')?.addEventListener('click', () => {
                const input = byId('supportAdminInput');
                const text = String(input?.value || '').trim();
                if (!text || !selectedTicket) return showToast('Hãy chọn hội thoại và nhập phản hồi.', 'warning');
                if (byId('supportAdminMessages')) byId('supportAdminMessages').textContent = `${byId('supportAdminMessages').textContent}\n\nCSKH: ${text}`;
                input.value = '';
                showToast('Đã lưu phản hồi trên giao diện.');
            });
        } catch (error) {
            console.error('[VieGeo Admin] Không thể khởi tạo tương tác:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        try {
            initializeInteractions();
            loadDashboard();
            loadQuestionBank();
        } catch (error) {
            console.error('[VieGeo Admin] Không thể khởi tạo:', error);
        }
    });
}());
