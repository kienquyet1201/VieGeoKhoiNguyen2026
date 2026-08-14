(function () {
    'use strict';

    const byId = id => document.getElementById(id);
    const state = {
        tickets: [],
        usersByEmail: new Map(),
        selectedKey: '',
        selectedTicket: null,
        agent: { id: '', email: '', name: 'Nhân viên CSKH', role: 'cs' },
        messageTableAvailable: true,
        refreshTimer: null,
        realtimeChannel: null,
        messageRequest: 0
    };

    const statusLabels = {
        pending: 'Đang chờ',
        open: 'Đang chờ',
        new: 'Đang chờ',
        processing: 'Đang xử lý',
        in_progress: 'Đang xử lý',
        resolved: 'Đã hoàn tất',
        approved: 'Đã hoàn tất',
        closed: 'Đã đóng',
        rejected: 'Đã đóng'
    };

    function client() {
        const candidate = window.supabaseClient || window.supabase || window.VieGeoSupabase?.client;
        return candidate && typeof candidate.from === 'function' ? candidate : null;
    }

    function normalizeStatus(value) {
        const status = String(value || 'pending').trim().toLowerCase();
        if (['processing', 'in_progress'].includes(status)) return 'processing';
        if (['resolved', 'approved', 'done', 'completed'].includes(status)) return 'resolved';
        if (['closed', 'rejected', 'cancelled'].includes(status)) return 'closed';
        return 'pending';
    }

    function statusLabel(value) {
        return statusLabels[String(value || '').toLowerCase()] || statusLabels[normalizeStatus(value)];
    }

    function roleLabel(value) {
        return ({ admin: 'Quản trị viên', cs: 'Chăm sóc khách hàng', support: 'Chăm sóc khách hàng', premium: 'Premium', parent: 'Phụ huynh', user: 'Học viên', student: 'Học viên' })[String(value || '').toLowerCase()] || 'Học viên';
    }

    function sourceLabel(value) {
        return ({ support_tickets: 'Hỗ trợ trực tiếp', user_feedbacks: 'Góp ý người dùng', error_reports: 'Báo cáo lỗi' })[value] || 'Yêu cầu hỗ trợ';
    }

    function initials(value) {
        const words = String(value || 'Người dùng').trim().split(/\s+/).filter(Boolean);
        return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0]?.slice(0, 2) || 'ND').toUpperCase();
    }

    function asTime(value, fallback) {
        if (value instanceof Date) return value.getTime();
        if (typeof value === 'number') return value;
        const parsed = Date.parse(value || '');
        return Number.isFinite(parsed) ? parsed : Number(fallback || 0);
    }

    function formatRelative(value) {
        const time = asTime(value);
        if (!time) return 'Không rõ thời gian';
        const diff = Math.max(0, Date.now() - time);
        const minute = 60000;
        if (diff < minute) return 'Vừa xong';
        if (diff < 60 * minute) return `${Math.floor(diff / minute)} phút`;
        if (diff < 24 * 60 * minute) return `${Math.floor(diff / (60 * minute))} giờ`;
        if (diff < 7 * 24 * 60 * minute) return `${Math.floor(diff / (24 * 60 * minute))} ngày`;
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(time));
    }

    function formatMessageTime(value) {
        const time = asTime(value);
        if (!time) return '';
        return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(new Date(time));
    }

    function showToast(message, type = 'info') {
        if (window.VieGeoUI && typeof window.VieGeoUI[type] === 'function') {
            window.VieGeoUI[type](message);
            return;
        }
        const toast = byId('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.dataset.type = type;
        toast.classList.add('show');
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2800);
    }

    function setSyncStatus(text, tone = 'ready') {
        const node = byId('syncStatus');
        if (!node) return;
        node.className = `sync-status is-${tone}`;
        const label = node.querySelector('span:last-child');
        if (label) label.textContent = text;
    }

    function setBusy(button, busy, busyText) {
        if (!button) return;
        if (!button.dataset.idleText) button.dataset.idleText = button.textContent;
        button.disabled = Boolean(busy);
        button.textContent = busy ? busyText : button.dataset.idleText;
    }

    function isMissingTable(error) {
        const value = `${error?.code || ''} ${error?.message || ''} ${error?.details || ''}`;
        return /42P01|PGRST205|could not find the table|does not exist|schema cache/i.test(value);
    }

    async function fetchRows(table, options = {}) {
        const database = client();
        if (!database) return { data: [], error: new Error('Chưa kết nối được Supabase.') };
        let query = database.from(table).select('*').limit(options.limit || 200);
        if (options.orderBy) query = query.order(options.orderBy, { ascending: Boolean(options.ascending) });
        if (options.eq) Object.entries(options.eq).forEach(([column, value]) => { query = query.eq(column, value); });
        let result = await query;
        if (result.error && options.orderBy && /column|does not exist|schema/i.test(String(result.error.message || ''))) {
            result = await database.from(table).select('*').limit(options.limit || 200);
        }
        return { data: Array.isArray(result.data) ? result.data : [], error: result.error || null };
    }

    function currentSession() {
        try {
            return JSON.parse(localStorage.getItem('lm_session') || '{}') || {};
        } catch (_) {
            return {};
        }
    }

    async function loadAgent() {
        const session = currentSession();
        state.agent = {
            id: String(session.id || session.user_id || ''),
            email: String(session.email || ''),
            name: String(session.user_name || session.name || session.displayName || session.email || 'Nhân viên CSKH'),
            role: String(session.activeRole || session.role || 'cs')
        };
        try {
            const authResult = await client()?.auth?.getUser?.();
            const authUser = authResult?.data?.user;
            if (authUser) {
                state.agent.id = state.agent.id || String(authUser.id || '');
                state.agent.email = state.agent.email || String(authUser.email || '');
                state.agent.name = state.agent.name === 'Nhân viên CSKH'
                    ? String(authUser.user_metadata?.user_name || authUser.user_metadata?.full_name || authUser.email || state.agent.name)
                    : state.agent.name;
            }
        } catch (_) {}
        byId('agentName').textContent = state.agent.name;
        byId('agentAvatar').textContent = initials(state.agent.name);
    }

    function buildUserIndex(rows) {
        state.usersByEmail = new Map();
        rows.forEach(row => {
            const email = String(row.email || row.user_email || '').trim().toLowerCase();
            if (email) state.usersByEmail.set(email, row);
        });
    }

    function personFor(row) {
        const email = String(row.user_email || row.email || row.sender_email || '').trim();
        const profile = state.usersByEmail.get(email.toLowerCase()) || {};
        return {
            email,
            name: String(row.user_name || row.sender_name || row.name || profile.user_name || profile.display_name || profile.name || email || 'Người dùng'),
            role: String(row.user_role || row.role || profile.role || profile.active_role || 'user')
        };
    }

    function normalizeSupportTicket(row) {
        const person = personFor(row);
        const id = String(row.id ?? row.ticket_id ?? '');
        return {
            key: `support_tickets:${id}`,
            threadId: id,
            sourceTable: 'support_tickets',
            sourceId: row.id ?? row.ticket_id,
            code: row.ticket_code || `HT-${id.slice(-6).toUpperCase()}`,
            name: person.name,
            email: person.email,
            role: person.role,
            subject: String(row.subject || row.category || 'Yêu cầu hỗ trợ'),
            content: String(row.last_message || row.message || row.content || ''),
            category: String(row.category || 'Hỗ trợ trực tiếp'),
            priority: String(row.priority || 'normal').toLowerCase() === 'urgent' ? 'urgent' : 'normal',
            status: normalizeStatus(row.status),
            createdAt: asTime(row.created_at, row.created_at_client),
            updatedAt: asTime(row.updated_at, row.updated_at_client || row.created_at_client),
            raw: row
        };
    }

    function normalizeFeedback(row) {
        const person = personFor(row);
        const id = String(row.id ?? '');
        return {
            key: `user_feedbacks:${id}`,
            threadId: `feedback:${id}`,
            sourceTable: 'user_feedbacks',
            sourceId: row.id,
            code: `GY-${id}`,
            name: person.name,
            email: person.email,
            role: person.role,
            subject: String(row.subject || 'Góp ý người dùng'),
            content: String(row.message || row.content || 'Không có nội dung.'),
            category: 'Góp ý',
            priority: 'normal',
            status: normalizeStatus(row.status),
            createdAt: asTime(row.created_at, row.created_at_client),
            updatedAt: asTime(row.updated_at, row.created_at_client),
            raw: row
        };
    }

    function normalizeErrorReport(row) {
        const person = personFor(row);
        const id = String(row.id ?? '');
        return {
            key: `error_reports:${id}`,
            threadId: `error:${id}`,
            sourceTable: 'error_reports',
            sourceId: row.id,
            code: `LOI-${id}`,
            name: person.name,
            email: person.email,
            role: person.role,
            subject: String(row.subject || row.page || 'Báo cáo lỗi'),
            content: String(row.error_message || row.message || row.content || 'Không có nội dung.'),
            category: row.page ? `Báo lỗi · ${row.page}` : 'Báo cáo lỗi',
            priority: 'urgent',
            status: normalizeStatus(row.status),
            createdAt: asTime(row.created_at, row.created_at_client),
            updatedAt: asTime(row.resolved_at || row.created_at, row.resolved_at_client || row.created_at_client),
            raw: row
        };
    }

    function ticketSort(a, b) {
        const order = { pending: 0, processing: 1, resolved: 2, closed: 3 };
        return (order[a.status] - order[b.status]) || (b.updatedAt - a.updatedAt);
    }

    function ticketSearchText(ticket) {
        return [ticket.name, ticket.email, ticket.subject, ticket.content, ticket.code, ticket.category].join(' ').toLowerCase();
    }

    function filteredTickets() {
        const search = String(byId('ticketSearch')?.value || '').trim().toLowerCase();
        const filter = byId('ticketFilter')?.value || 'all';
        return state.tickets.filter(ticket => (filter === 'all' || ticket.status === filter) && (!search || ticketSearchText(ticket).includes(search)));
    }

    function createTicketButton(ticket) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `ticket-item${ticket.key === state.selectedKey ? ' active' : ''}`;
        button.dataset.ticketKey = ticket.key;

        const avatar = document.createElement('div');
        avatar.className = `customer-avatar ${ticket.priority === 'urgent' ? 'orange-avatar' : 'blue-avatar'}`;
        avatar.textContent = initials(ticket.name);

        const content = document.createElement('div');
        content.className = 'ticket-content';
        const top = document.createElement('div');
        top.className = 'ticket-topline';
        const name = document.createElement('strong');
        name.textContent = ticket.name;
        const time = document.createElement('span');
        time.textContent = formatRelative(ticket.updatedAt || ticket.createdAt);
        top.append(name, time);
        const preview = document.createElement('p');
        preview.textContent = ticket.content || ticket.subject;
        const meta = document.createElement('div');
        meta.className = 'ticket-meta';
        const badge = document.createElement('span');
        badge.className = `priority-badge status-${ticket.status}`;
        badge.textContent = statusLabel(ticket.status);
        const code = document.createElement('span');
        code.textContent = ticket.code;
        meta.append(badge, code);
        content.append(top, preview, meta);
        button.append(avatar, content);
        button.addEventListener('click', () => selectTicket(ticket.key));
        return button;
    }

    function renderTicketList() {
        const list = byId('ticketList');
        const rows = filteredTickets();
        list.replaceChildren();
        if (!rows.length) {
            const empty = document.createElement('div');
            empty.className = 'ticket-state';
            empty.innerHTML = '<span class="empty-state-icon">◎</span><strong>Chưa có yêu cầu phù hợp</strong><small>Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</small>';
            list.append(empty);
            return;
        }
        rows.forEach(ticket => list.append(createTicketButton(ticket)));
    }

    function updateSummary() {
        byId('pendingCount').textContent = String(state.tickets.filter(ticket => ticket.status === 'pending').length);
        byId('processingCount').textContent = String(state.tickets.filter(ticket => ticket.status === 'processing').length);
    }

    function setConversationEnabled(enabled) {
        ['noteButton', 'resolveButton', 'closeButton', 'messageInput', 'sendButton'].forEach(id => {
            const element = byId(id);
            if (element) element.disabled = !enabled;
        });
    }

    function setMessagingEnabled(enabled) {
        ['noteButton', 'messageInput', 'sendButton'].forEach(id => {
            const element = byId(id);
            if (element) element.disabled = !enabled;
        });
    }

    function renderTicketHeader(ticket) {
        const avatar = byId('chatCustomerAvatar');
        avatar.textContent = initials(ticket.name);
        avatar.className = `customer-avatar ${ticket.priority === 'urgent' ? 'orange-avatar' : 'blue-avatar'} large-avatar`;
        byId('chatCustomerName').textContent = ticket.name;
        const status = byId('chatStatusBadge');
        status.textContent = statusLabel(ticket.status);
        status.className = `ticket-status-badge status-${ticket.status}`;
        byId('chatTicketInfo').textContent = `${ticket.code} · ${ticket.subject}`;
        byId('customerEmail').textContent = ticket.email || 'Chưa có email';
        byId('customerRole').textContent = roleLabel(ticket.role);
        byId('customerSource').textContent = sourceLabel(ticket.sourceTable);
        byId('customerStatus').textContent = statusLabel(ticket.status);
        setConversationEnabled(true);
    }

    function messageRow(message, ticket) {
        const sender = String(message.sender || message.sender_role || 'user').toLowerCase();
        const internal = message.is_internal === true;
        const isAgent = ['cs', 'admin', 'staff', 'support', 'ai'].includes(sender) || internal;
        const row = document.createElement('div');
        row.className = `message-row ${isAgent ? 'agent-row' : 'customer-row'}${internal ? ' internal-note-row' : ''}`;
        const avatar = document.createElement('div');
        avatar.className = `message-avatar${isAgent ? ' agent-message-avatar' : ''}`;
        avatar.textContent = internal ? '📝' : initials(isAgent ? (message.sender_name || state.agent.name || 'CS') : ticket.name);
        const group = document.createElement('div');
        group.className = 'message-group';
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${isAgent ? 'agent-bubble' : 'customer-bubble'}${internal ? ' internal-note-bubble' : ''}`;
        bubble.textContent = String(message.message || message.text || message.content || '');
        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = `${internal ? 'Ghi chú nội bộ · ' : ''}${formatMessageTime(message.created_at || message.created_at_client || message.createdAt)}`;
        group.append(bubble, time);
        if (isAgent) row.append(group, avatar); else row.append(avatar, group);
        return row;
    }

    function originalMessage(ticket) {
        return {
            id: `origin:${ticket.key}`,
            sender: 'user',
            message: ticket.content || ticket.subject,
            created_at_client: ticket.createdAt
        };
    }

    function renderMessages(ticket, messages, error) {
        const list = byId('messageList');
        list.replaceChildren();
        const rows = Array.isArray(messages) ? [...messages] : [];
        if (ticket.sourceTable !== 'support_tickets' || !rows.length) rows.unshift(originalMessage(ticket));

        if (!rows.length) {
            const empty = document.createElement('div');
            empty.className = 'conversation-empty';
            empty.innerHTML = '<div class="empty-icon">💬</div><strong>Chưa có tin nhắn</strong><p>Hội thoại chưa có nội dung.</p>';
            list.append(empty);
        } else {
            const day = document.createElement('div');
            day.className = 'message-day';
            day.textContent = 'Nội dung yêu cầu';
            list.append(day);
            rows.forEach(message => list.append(messageRow(message, ticket)));
        }
        list.scrollTop = list.scrollHeight;
        const hint = byId('conversationHint');
        if (error && isMissingTable(error)) {
            state.messageTableAvailable = false;
            setMessagingEnabled(false);
            hint.textContent = 'Tính năng phản hồi đang được bảo trì. Vui lòng thử lại sau.';
            hint.className = 'typing-status visible is-warning';
        } else if (error) {
            setMessagingEnabled(false);
            hint.textContent = 'Chưa thể tải toàn bộ hội thoại. Hãy thử làm mới.';
            hint.className = 'typing-status visible is-warning';
        } else {
            state.messageTableAvailable = true;
            setMessagingEnabled(true);
            hint.textContent = 'Hội thoại đã được cập nhật.';
            hint.className = 'typing-status visible';
        }
    }

    async function loadMessages(ticket) {
        const request = ++state.messageRequest;
        const list = byId('messageList');
        list.innerHTML = '<div class="ticket-state conversation-loading"><span class="state-spinner"></span><strong>Đang tải hội thoại</strong></div>';
        const result = await fetchRows('support_messages', { limit: 500, orderBy: 'created_at_client', ascending: true, eq: { ticket_id: ticket.threadId } });
        if (request !== state.messageRequest || state.selectedKey !== ticket.key) return;
        renderMessages(ticket, result.data, result.error);
    }

    async function selectTicket(key, options = {}) {
        const ticket = state.tickets.find(item => item.key === key);
        if (!ticket) return;
        state.selectedKey = key;
        state.selectedTicket = ticket;
        renderTicketList();
        renderTicketHeader(ticket);
        if (!options.skipMessages) await loadMessages(ticket);
    }

    async function loadDashboard(options = {}) {
        const quiet = Boolean(options.quiet);
        if (!quiet) setSyncStatus('Đang cập nhật yêu cầu...', 'loading');
        const database = client();
        if (!database) {
            state.tickets = [];
            renderTicketList();
            updateSummary();
            setSyncStatus('Tạm thời chưa thể tải yêu cầu', 'error');
            setConversationEnabled(false);
            return;
        }

        const [users, supportTickets, feedbacks, errors] = await Promise.all([
            fetchRows('users', { limit: 500 }),
            fetchRows('support_tickets', { limit: 300, orderBy: 'updated_at_client', ascending: false }),
            fetchRows('user_feedbacks', { limit: 200, orderBy: 'created_at', ascending: false }),
            fetchRows('error_reports', { limit: 200, orderBy: 'created_at', ascending: false })
        ]);

        buildUserIndex(users.data);
        state.tickets = [
            ...supportTickets.data.map(normalizeSupportTicket),
            ...feedbacks.data.map(normalizeFeedback),
            ...errors.data.map(normalizeErrorReport)
        ].filter(ticket => ticket.sourceId !== undefined && ticket.sourceId !== null).sort(ticketSort);

        updateSummary();
        renderTicketList();
        const criticalErrors = [feedbacks.error, errors.error].filter(Boolean);
        const supportMissing = supportTickets.error && isMissingTable(supportTickets.error);
        if (criticalErrors.length === 2) {
            setSyncStatus('Không thể tải dữ liệu CSKH', 'error');
        } else if (supportMissing) {
            setSyncStatus(`Cập nhật góp ý và báo lỗi lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`, 'warning');
        } else {
            setSyncStatus(`Cập nhật lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`, 'ready');
        }

        const preferred = state.tickets.find(ticket => ticket.key === state.selectedKey) || state.tickets[0];
        if (preferred) await selectTicket(preferred.key);
        else {
            state.selectedKey = '';
            state.selectedTicket = null;
            setConversationEnabled(false);
            byId('messageList').innerHTML = '<div class="conversation-empty"><div class="empty-icon">✓</div><strong>Hộp thư đang trống</strong><p>Chưa có góp ý, báo lỗi hoặc yêu cầu hỗ trợ nào.</p></div>';
        }
    }

    async function updateSelectedStatus(nextStatus) {
        const ticket = state.selectedTicket;
        const database = client();
        if (!ticket || !database) return;
        const button = nextStatus === 'resolved' ? byId('resolveButton') : byId('closeButton');
        setBusy(button, true, 'Đang lưu...');
        const payload = { status: nextStatus };
        if (ticket.sourceTable === 'support_tickets') {
            payload.updated_at = new Date().toISOString();
            payload.updated_at_client = Date.now();
        }
        if (ticket.sourceTable === 'error_reports' && nextStatus === 'resolved') {
            payload.resolved_at = new Date().toISOString();
            payload.resolved_at_client = Date.now();
            payload.resolved_by = state.agent.email || state.agent.name;
        }
        const { error } = await database.from(ticket.sourceTable).update(payload).eq('id', ticket.sourceId);
        setBusy(button, false);
        if (error) {
            console.error('[VieGeo CS] Không thể cập nhật trạng thái:', error);
            return showToast('Không thể cập nhật trạng thái lúc này.', 'error');
        }
        showToast(nextStatus === 'resolved' ? 'Đã hoàn tất yêu cầu.' : 'Đã đóng yêu cầu.', 'success');
        await loadDashboard({ quiet: true });
    }

    function messagePayload(ticket, text, internal) {
        return {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ticket_id: ticket.threadId,
            sender: 'cs',
            sender_id: state.agent.id || null,
            sender_email: state.agent.email || null,
            sender_name: state.agent.name,
            sender_role: state.agent.role || 'cs',
            message: text,
            is_internal: Boolean(internal),
            created_at_client: Date.now()
        };
    }

    async function saveMessage(text, internal) {
        const ticket = state.selectedTicket;
        const database = client();
        if (!ticket || !database || !text) return false;
        const { error } = await database.from('support_messages').insert([messagePayload(ticket, text, internal)]);
        if (error) {
            console.error('[VieGeo CS] Không thể lưu phản hồi:', error);
            showToast('Chưa thể lưu phản hồi lúc này. Vui lòng thử lại sau.', 'error');
            return false;
        }
        if (!internal) {
            const statusPayload = { status: 'processing' };
            if (ticket.sourceTable === 'support_tickets') {
                statusPayload.last_message = text;
                statusPayload.updated_at = new Date().toISOString();
                statusPayload.updated_at_client = Date.now();
            }
            await database.from(ticket.sourceTable).update(statusPayload).eq('id', ticket.sourceId);
        }
        await loadMessages(ticket);
        return true;
    }

    async function sendReply() {
        const input = byId('messageInput');
        const text = String(input.value || '').trim();
        if (!text) return showToast('Hãy nhập nội dung phản hồi.', 'warning');
        const button = byId('sendButton');
        setBusy(button, true, 'Đang gửi...');
        const saved = await saveMessage(text, false);
        setBusy(button, false);
        if (saved) {
            input.value = '';
            showToast('Đã gửi phản hồi.', 'success');
            await loadDashboard({ quiet: true });
        }
    }

    function setNoteModal(open) {
        const modal = byId('noteModal');
        modal.classList.toggle('show', open);
        modal.setAttribute('aria-hidden', String(!open));
        if (open) byId('noteInput').focus(); else byId('noteInput').value = '';
    }

    async function saveNote() {
        const input = byId('noteInput');
        const text = String(input.value || '').trim();
        if (!text) return showToast('Hãy nhập nội dung ghi chú.', 'warning');
        const button = byId('saveNoteButton');
        setBusy(button, true, 'Đang lưu...');
        const saved = await saveMessage(text, true);
        setBusy(button, false);
        if (saved) {
            setNoteModal(false);
            showToast('Đã lưu ghi chú nội bộ.', 'success');
        }
    }

    function setupTheme() {
        const update = () => { byId('themeIcon').textContent = document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙'; };
        byId('themeButton').addEventListener('click', () => {
            const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = next;
            localStorage.setItem('viegeo-theme', next);
            update();
        });
        update();
    }

    function scheduleRefresh() {
        window.clearTimeout(scheduleRefresh.timer);
        scheduleRefresh.timer = window.setTimeout(() => loadDashboard({ quiet: true }), 600);
    }

    function setupRealtime() {
        const database = client();
        if (!database || typeof database.channel !== 'function') return;
        try {
            state.realtimeChannel = database.channel('viegeo-cs-dashboard')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, scheduleRefresh)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, scheduleRefresh)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'user_feedbacks' }, scheduleRefresh)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'error_reports' }, scheduleRefresh)
                .subscribe();
        } catch (_) {}
    }

    function bindEvents() {
        byId('ticketSearch').addEventListener('input', renderTicketList);
        byId('ticketFilter').addEventListener('change', renderTicketList);
        byId('refreshButton').addEventListener('click', () => loadDashboard());
        byId('resolveButton').addEventListener('click', () => updateSelectedStatus('resolved'));
        byId('closeButton').addEventListener('click', () => updateSelectedStatus('closed'));
        byId('sendButton').addEventListener('click', sendReply);
        byId('messageInput').addEventListener('keydown', event => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendReply();
            }
        });
        byId('noteButton').addEventListener('click', () => setNoteModal(true));
        byId('closeNoteButton').addEventListener('click', () => setNoteModal(false));
        byId('saveNoteButton').addEventListener('click', saveNote);
        byId('noteModal').addEventListener('click', event => { if (event.target === event.currentTarget) setNoteModal(false); });
        document.addEventListener('keydown', event => { if (event.key === 'Escape') setNoteModal(false); });
        document.addEventListener('visibilitychange', () => { if (!document.hidden) loadDashboard({ quiet: true }); });
        window.addEventListener('beforeunload', () => {
            window.clearInterval(state.refreshTimer);
            if (state.realtimeChannel && client()?.removeChannel) client().removeChannel(state.realtimeChannel);
        });
    }

    async function initialize() {
        setupTheme();
        bindEvents();
        await loadAgent();
        await loadDashboard();
        setupRealtime();
        state.refreshTimer = window.setInterval(() => { if (!document.hidden) loadDashboard({ quiet: true }); }, 30000);
    }

    document.addEventListener('DOMContentLoaded', initialize);
}());
