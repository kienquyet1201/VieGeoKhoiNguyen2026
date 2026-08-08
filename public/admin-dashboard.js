/* Supabase-backed controller for the restored Admin Dashboard UI. */
(function () {
    'use strict';

    const labels = {
        overview: ['Bảng điều khiển VieGeo', 'Theo dõi người dùng, nội dung học tập và hoạt động hệ thống trong một nơi.'],
        users: ['Quản lý người dùng', 'Theo dõi tài khoản, quyền truy cập và trạng thái sử dụng.'],
        lessons: ['Kho học liệu', 'Nhập bộ câu hỏi vào kho dữ liệu Supabase.'],
        monitoring: ['Giám sát học tập', 'Danh sách người dùng có hoạt động gần đây.'],
        support: ['Chăm sóc khách hàng', 'Phản hồi các góp ý của người dùng.'],
        settings: ['Cài đặt', 'Tùy chỉnh giao diện và phiên quản trị.']
    };
    let allUsers = [];
    let selectedTicket = null;

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
        return String(user?.name || user?.full_name || user?.display_name || user?.email || 'Người dùng');
    }

    function roleName(role) {
        return ({ user: 'Học sinh', parent: 'Phụ huynh', cs: 'CSKH', admin: 'Admin' })[String(role || 'user').toLowerCase()] || 'Học sinh';
    }

    function roleClass(role) {
        return ({ parent: 'parent-role', cs: 'support-role', admin: 'admin-role' })[String(role || '').toLowerCase()] || 'student-role';
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
                const matchesKeyword = !keyword || `${displayName(user)} ${user.email || ''}`.toLowerCase().includes(keyword);
                return matchesKeyword && (role === 'all' || String(user.role || user.active_role || 'user') === role);
            });
            body.replaceChildren();
            if (!filtered.length) {
                body.innerHTML = '<tr><td colspan="5"><div class="empty-state">Chưa có người dùng phù hợp để hiển thị.</div></td></tr>';
                return;
            }
            filtered.forEach(user => {
                const name = displayName(user);
                const primaryRole = user.active_role || user.role || 'user';
                const online = activeWithinNinetySeconds(user);
                const row = document.createElement('tr');
                row.dataset.userId = String(user.id || user.email || '');
                row.innerHTML = `<td><div class="user-cell"><div class="user-avatar"></div><div><strong></strong><span></span></div></div></td><td><span class="role-badge ${roleClass(primaryRole)}"></span></td><td><span class="status-badge ${online ? 'active-status' : 'idle-status'}"><i class="status-dot"></i>${online ? 'Online' : 'Offline'}</span></td><td>${escapeText(formatTime(user.last_active_client || user.updated_at || user.created_at))}</td><td><div class="action-group"><button class="mini-button" type="button" data-edit-role="${escapeText(user.id || user.email || '')}">Sửa</button></div></td>`;
                row.querySelector('.user-avatar').textContent = name.slice(0, 2).toUpperCase();
                row.querySelector('.user-cell strong').textContent = name;
                row.querySelector('.user-cell span').textContent = user.email || 'Chưa có email';
                row.querySelector('.role-badge').textContent = roleName(primaryRole);
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

    function renderPremiumRequests(users) {
        try {
            const container = byId('premiumRequestList');
            if (!container) return;
            const premium = (Array.isArray(users) ? users : []).filter(user => user.account_status === 'premium');
            container.replaceChildren();
            if (!premium.length) {
                container.innerHTML = '<div class="empty-state">Chưa có yêu cầu Premium cần xử lý.</div>';
                return;
            }
            premium.slice(0, 8).forEach(user => {
                const node = document.createElement('article');
                node.className = 'notice-item';
                node.innerHTML = '<div><strong></strong><span></span></div><span>Premium</span>';
                node.querySelector('strong').textContent = displayName(user);
                node.querySelector('span').textContent = user.email || 'Không có email';
                container.appendChild(node);
            });
        } catch (error) {
            console.warn('[VieGeo Admin] Không thể render Premium:', error);
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

    async function loadDashboard() {
        try {
            const dataApi = window.VieGeoData;
            if (!dataApi) throw new Error('Lớp dữ liệu Supabase chưa sẵn sàng');
            const connection = byId('connectionBadge');
            if (connection) connection.textContent = 'Đang tải Supabase…';
            const [user, users, errors, feedbacks] = await Promise.all([
                dataApi.getCurrentUser(),
                dataApi.fetchRows('users', { limit: 500 }),
                dataApi.fetchRows('error_reports', { limit: 100, orderBy: 'created_at', ascending: false }),
                dataApi.fetchRows('user_feedbacks', { limit: 100, orderBy: 'created_at', ascending: false })
            ]);
            allUsers = Array.isArray(users) && users.length ? users : [user].filter(Boolean);
            if (byId('adminEmail')) byId('adminEmail').textContent = user.email || 'Admin VieGeo';
            if (byId('metricOnline')) byId('metricOnline').textContent = String(allUsers.filter(activeWithinNinetySeconds).length);
            if (byId('metricSubmissions')) byId('metricSubmissions').textContent = String(Math.max(0, Number(user.completed_lessons || 0)));
            if (byId('metricUsers')) byId('metricUsers').textContent = String(allUsers.length);
            if (byId('metricErrors')) byId('metricErrors').textContent = String(errors.length);
            if (connection) {
                connection.textContent = 'Supabase đã kết nối';
                connection.classList.remove('error');
                connection.classList.add('connected');
            }
            renderUsers(allUsers);
            renderErrors(errors);
            renderPremiumRequests(allUsers);
            renderMonitoring(allUsers);
            renderSupport(feedbacks);
            console.info('[VieGeo Admin] Đồng bộ giao diện hoàn tất', { users: allUsers.length, errors: errors.length, feedbacks: feedbacks.length });
        } catch (error) {
            console.error('[VieGeo Admin] Không thể tải dashboard:', error);
            if (byId('connectionBadge')) {
                byId('connectionBadge').textContent = 'Đang dùng dữ liệu cục bộ';
                byId('connectionBadge').classList.add('error');
            }
            renderUsers(allUsers);
            renderErrors([]);
            renderPremiumRequests(allUsers);
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
            if (preview) preview.textContent = `Đã thêm ${count} câu hỏi vào Supabase.`;
            if (byId('fileUpload')) byId('fileUpload').value = '';
            if (byId('fileNameDisplay')) byId('fileNameDisplay').textContent = 'Chưa có tệp được chọn.';
            showToast(`Đã thêm ${count} câu hỏi.`, 'success');
        } catch (error) {
            console.error('[VieGeo Admin] Upload câu hỏi thất bại:', error);
            if (preview) preview.textContent = `Không thể upload: ${error.message || error}`;
            showToast(error.message || 'Không thể upload câu hỏi.', 'error');
        }
    }

    function initializeInteractions() {
        try {
            document.querySelectorAll('.menu-item[data-section], [data-open-section]').forEach(button => button.addEventListener('click', () => selectPanel(button.dataset.section || button.dataset.openSection)));
            byId('searchInput')?.addEventListener('input', () => renderUsers(allUsers));
            byId('roleFilter')?.addEventListener('change', () => renderUsers(allUsers));
            byId('refreshMonitoringButton')?.addEventListener('click', loadDashboard);
            byId('refreshSupportAdminButton')?.addEventListener('click', loadDashboard);
            byId('processUploadButton')?.addEventListener('click', handleUpload);
            byId('fileUpload')?.addEventListener('change', event => {
                const name = event.target.files?.[0]?.name || 'Chưa có tệp được chọn.';
                if (byId('fileNameDisplay')) byId('fileNameDisplay').textContent = name;
            });
            byId('backToHomeButton')?.addEventListener('click', () => { window.location.href = 'student-dashboard.html'; });
            byId('logoutButton')?.addEventListener('click', () => { localStorage.removeItem('lm_session'); window.location.href = 'loginout.html'; });
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
        } catch (error) {
            console.error('[VieGeo Admin] Không thể khởi tạo:', error);
        }
    });
}());
