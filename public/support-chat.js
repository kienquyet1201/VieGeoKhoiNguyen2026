/* Customer support chat with image upload and an AI fallback when staff are offline. */
(function () {
    'use strict';

    const STAFF_ONLINE_WINDOW = 90 * 1000;
    const byId = (id) => document.getElementById(id);
    let pendingImage = null;
    let messagesRef = null;
    let messageCache = new Map();
    let recalledMessageId = null;
    const aiFallbackTimers = new Map();

    function session() {
        try { return JSON.parse(localStorage.getItem('lm_session') || '{}'); }
        catch { return {}; }
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
    }

    function setChatOpen(open) {
        const panel = byId('supportChatPanel');
        if (!panel) return;
        panel.hidden = !open;
        panel.style.display = open ? 'grid' : 'none';
        if (open) {
            byId('supportMessageInput')?.focus();
            void markIncomingMessagesRead([...messageCache.values()]);
        }
    }

    function setSupportMenuOpen(open) {
        const menu = byId('supportActionMenu');
        const toggle = byId('supportChatToggle');
        if (!menu || !toggle) return;
        menu.hidden = !open;
        menu.style.display = open ? 'grid' : 'none';
        toggle.setAttribute('aria-expanded', String(open));
    }

    function setSupportRequestOpen(open, type = 'feedback') {
        const modal = byId('supportRequestModal');
        if (!modal) return;
        const isReport = type === 'report';
        modal.hidden = !open;
        modal.style.display = open ? 'grid' : 'none';
        document.body.style.overflow = open ? 'hidden' : '';
        if (!open) return;
        byId('supportRequestType').value = type;
        byId('supportRequestEyebrow').textContent = isReport ? 'BÁO CÁO LỖI' : 'GÓP Ý VIEGEO';
        byId('supportRequestTitle').textContent = isReport ? 'Bạn đang gặp lỗi gì?' : 'Đóng góp ý tưởng của bạn';
        byId('supportRequestHint').textContent = isReport
            ? 'Hãy mô tả lỗi, thao tác vừa thực hiện và thiết bị bạn đang dùng.'
            : 'Mọi góp ý đều giúp VieGeo cải thiện trải nghiệm học tập.';
        byId('supportRequestSubject').value = '';
        byId('supportRequestMessage').value = '';
        byId('supportRequestSubject')?.focus();
    }

    function notify(message, type = 'info') {
        if (window.VieGeoUI?.[type]) {
            window.VieGeoUI[type](message);
            return;
        }
        if (typeof window.showToast === 'function') {
            window.showToast(message, type === 'error');
            return;
        }
        window.alert(message);
    }

    async function activeAgentCount() {
        try {
            const threshold = Date.now() - STAFF_ONLINE_WINDOW;
            const snapshot = await db.collection('users').where('lastActive', '>=', threshold).get();
            return snapshot.docs.filter(document => {
                const user = document.data() || {};
                const roles = Array.isArray(user.roles) ? user.roles : [user.role];
                return user.isAdmin || user.isCustomerSupport || roles.includes('admin') || roles.includes('cs');
            }).length;
        } catch (error) {
            console.warn('Không kiểm tra được trạng thái CSKH:', error);
            return 0;
        }
    }

    async function hasOnlineStaff() {
        return (await activeAgentCount()) > 0;
    }

    function statusLabel(status) {
        if (status === 'read') return '✓✓ Đã xem';
        if (status === 'received') return '✓ Đã nhận';
        if (status === 'recalled') return 'Đã thu hồi';
        return '✓ Đã gửi';
    }

    function updateUnreadBadge(messages) {
        const badge = byId('supportUnreadBadge');
        if (!badge) return;
        const hasUnread = messages.some((message) => message.sender !== 'user' && !message.recalled && message.status !== 'read');
        badge.hidden = !hasUnread;
    }

    async function markIncomingMessagesRead(messages) {
        const panel = byId('supportChatPanel');
        if (!messagesRef || !panel || panel.hidden) return;
        const unread = messages.filter((message) => message.sender !== 'user' && !message.recalled && message.status !== 'read');
        if (!unread.length || typeof db === 'undefined') return;
        const batch = db.batch();
        unread.forEach((message) => batch.update(messagesRef.doc(message.id), { status: 'read', readAtClient: Date.now() }));
        try { await batch.commit(); } catch (error) { console.warn('Không thể đánh dấu tin nhắn đã đọc:', error); }
    }

    function renderMessages(snapshot) {
        const container = byId('supportMessages');
        if (!container) return;
        const messages = snapshot.docs.map(document => ({ id: document.id, ...document.data() }))
            .sort((left, right) => (left.createdAtClient || 0) - (right.createdAtClient || 0));
        messageCache = new Map(messages.map((message) => [message.id, message]));
        updateUnreadBadge(messages);
        container.innerHTML = messages.map(message => {
            const isMine = message.sender === 'user';
            const image = message.imageUrl ? `<img src="${escapeHtml(message.imageUrl)}" alt="Ảnh đính kèm hỗ trợ">` : '';
            const staffName = message.staffName || message.senderName || message.staffEmail || 'VieGeo';
            const label = isMine ? 'Bạn' : message.sender === 'AI' ? 'CSKH tự động (AI)' : `CSKH + ${staffName}`;
            const recalled = message.recalled === true || message.status === 'recalled';
            const status = message.status || (isMine ? 'sent' : 'received');
            return `<article class="support-message ${isMine ? 'is-mine' : 'is-agent'}${recalled ? ' is-recalled' : ''}" data-message-id="${escapeHtml(message.id)}" data-message-mine="${String(isMine)}"><span>${label}</span><p>${escapeHtml(recalled ? 'Đã thu hồi tin nhắn.' : (message.text || (message.imageUrl ? '' : '')))}</p>${recalled ? '' : image}${isMine ? `<em class="support-message-status${status === 'read' ? ' is-read' : ''}">${statusLabel(status)}</em>` : ''}</article>`;
        }).join('') || '<p class="support-empty">Hãy để lại câu hỏi. VieGeo sẽ hỗ trợ bạn ngay.</p>';
        container.scrollTop = container.scrollHeight;
        void markIncomingMessagesRead(messages);
    }

    function scrollMessagesToBottom() {
        const container = byId('supportMessages');
        if (!container) return;
        window.requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
    }

    async function uploadImage(file, email) {
        if (!file) return '';
        if (!window.firebase || typeof window.firebase.storage !== 'function') throw new Error('Firebase Storage chưa sẵn sàng.');
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `support_uploads/${encodeURIComponent(email)}/${Date.now()}-${safeName}`;
        const reference = window.firebase.storage().ref().child(path);
        await reference.put(file, { contentType: file.type });
        return reference.getDownloadURL();
    }

    async function requestAiReply(text) {
        const response = await fetch('/api/support-ai', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text })
        });
        if (!response.ok) throw new Error('Không thể gọi trợ lý tự động.');
        const data = await response.json();
        return data.reply;
    }

    async function hasHumanStaffReplySince(timestampClient) {
        if (!messagesRef) return false;
        const snapshot = await messagesRef.get();
        return snapshot.docs.some((document) => {
            const message = document.data() || {};
            return message.sender === 'staff' && Number(message.createdAtClient || message.timestampClient || 0) >= timestampClient;
        });
    }

    function scheduleAiFallback(messageId, text, timestampClient, delay) {
        const existingTimer = aiFallbackTimers.get(messageId);
        if (existingTimer) window.clearTimeout(existingTimer);
        const timer = window.setTimeout(async () => {
            aiFallbackTimers.delete(messageId);
            try {
                if (!messagesRef || await hasHumanStaffReplySince(timestampClient)) return;
                const sourceMessage = await messagesRef.doc(messageId).get();
                if (!sourceMessage.exists || sourceMessage.data()?.recalled) return;
                const reply = await requestAiReply(text || 'Tôi cần hỗ trợ.');
                const now = Date.now();
                await messagesRef.add({
                    sender: 'AI', senderId: 'ai-viegeo', senderName: 'CSKH tự động (AI)',
                    text: reply, status: 'received',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(), timestampClient: now,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdAtClient: now
                });
            } catch (error) {
                console.warn('Không thể gửi phản hồi AI tự động.', error);
            }
        }, delay);
        aiFallbackTimers.set(messageId, timer);
    }

    async function recallMessage(messageId) {
        const message = messageCache.get(messageId);
        if (!messagesRef || !message || message.sender !== 'user' || message.recalled) return;
        try {
            await messagesRef.doc(messageId).update({
                recalled: true,
                status: 'recalled',
                text: '',
                imageUrl: null,
                recalledAtClient: Date.now()
            });
            const timer = aiFallbackTimers.get(messageId);
            if (timer) window.clearTimeout(timer);
            aiFallbackTimers.delete(messageId);
            notify('Đã thu hồi tin nhắn.', 'success');
        } catch (error) {
            console.error('Không thể thu hồi tin nhắn:', error);
            notify('Chưa thể thu hồi tin nhắn. Vui lòng thử lại.', 'error');
        }
    }

    async function sendMessage(event) {
        event.preventDefault();
        const input = byId('supportMessageInput');
        const form = byId('supportChatForm');
        const user = session();
        const text = input ? input.value.trim() : '';
        if ((!text && !pendingImage) || !user.email || !messagesRef || typeof db === 'undefined') {
            if (!text && !pendingImage) input?.focus();
            else if (window.VieGeoUI) window.VieGeoUI.warning('Đang kết nối kênh hỗ trợ, vui lòng thử lại sau ít giây.');
            return;
        }

        const submit = form?.querySelector('button[type="submit"]');
        if (submit) submit.disabled = true;
        try {
            const timestampClient = Date.now();
            const imageUrl = await uploadImage(pendingImage, user.email);
            await db.collection('support_conversations').doc(user.email).set({
                email: user.email,
                name: user.name || user.displayName || user.email,
                lastMessage: text || 'Đã gửi một hình ảnh',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAtClient: timestampClient,
                unreadForStaff: true
            }, { merge: true });
            const submittedMessage = await messagesRef.add({
                sender: 'user', senderId: user.email, senderName: user.name || user.displayName || user.email,
                text, imageUrl: imageUrl || null, status: 'sent',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(), timestampClient,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdAtClient: timestampClient
            });
            input.value = '';
            pendingImage = null;
            byId('supportAttachmentLabel').textContent = '';
            scrollMessagesToBottom();

            const activeAgents = await activeAgentCount();
            const staffOnline = activeAgents > 0;
            byId('supportAvailability').textContent = staffOnline ? 'CSKH đang trực tuyến' : 'Trợ lý ảo đang hỗ trợ';
            scheduleAiFallback(submittedMessage.id, text, timestampClient, staffOnline ? 120000 : 1500);
        } catch (error) {
            console.error('Không thể gửi tin nhắn hỗ trợ:', error);
            const message = error?.code === 'permission-denied'
                ? 'Bạn chưa có quyền gửi tin nhắn. Vui lòng đăng nhập lại và thử lại.'
                : 'Chưa thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.';
            if (window.VieGeoUI) window.VieGeoUI.error(message);
        } finally {
            if (submit) submit.disabled = false;
        }
    }

    async function initialiseChat() {
        const user = session();
        if (!user.email || typeof db === 'undefined') return;
        messagesRef = db.collection('support_conversations').doc(user.email).collection('messages');
        messagesRef.onSnapshot(renderMessages, error => console.warn('Không thể nhận tin nhắn hỗ trợ:', error));
        const online = await hasOnlineStaff();
        byId('supportAvailability').textContent = online ? 'CSKH đang trực tuyến' : 'Trợ lý ảo sẵn sàng hỗ trợ';
    }

    async function submitSupportRequest(event) {
        event.preventDefault();
        const user = session();
        const type = byId('supportRequestType')?.value || 'feedback';
        const subject = byId('supportRequestSubject')?.value.trim();
        const message = byId('supportRequestMessage')?.value.trim();
        const form = byId('supportRequestForm');
        const submit = form?.querySelector('button[type="submit"]');
        if (!subject || !message) {
            byId(!subject ? 'supportRequestSubject' : 'supportRequestMessage')?.focus();
            return;
        }
        if (typeof db === 'undefined') {
            notify('Chưa thể gửi yêu cầu khi Firebase chưa sẵn sàng.', 'warning');
            return;
        }
        if (submit) submit.disabled = true;
        try {
            const collectionName = type === 'report' ? 'ErrorReports' : 'UserFeedbacks';
            await db.collection(collectionName).add({
                type: type === 'report' ? 'error-report' : 'user-feedback',
                subject,
                message,
                senderId: user.email || 'anonymous',
                senderName: user.name || user.displayName || user.email || 'Khách',
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdAtClient: Date.now()
            });
            setSupportRequestOpen(false);
            notify(type === 'report' ? 'Đã gửi báo cáo lỗi. Cảm ơn bạn!' : 'Đã gửi góp ý. Cảm ơn bạn!', 'success');
        } catch (error) {
            console.error('Không thể gửi yêu cầu hỗ trợ:', error);
            notify('Chưa thể gửi yêu cầu. Vui lòng thử lại sau.', 'error');
        } finally {
            if (submit) submit.disabled = false;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        byId('supportChatToggle')?.addEventListener('click', event => {
            event.preventDefault();
            const shouldOpen = byId('supportActionMenu')?.hidden !== false;
            setChatOpen(false);
            setSupportRequestOpen(false);
            setSupportMenuOpen(shouldOpen);
        });
        byId('supportChatClose')?.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            setChatOpen(false);
        });
        document.querySelectorAll('[data-support-action]').forEach((button) => button.addEventListener('click', () => {
            const action = button.dataset.supportAction;
            setSupportMenuOpen(false);
            if (action === 'chat') setChatOpen(true);
            else setSupportRequestOpen(true, action);
        }));
        byId('supportRequestClose')?.addEventListener('click', () => setSupportRequestOpen(false));
        document.querySelectorAll('[data-close-support-request]').forEach((button) => button.addEventListener('click', () => setSupportRequestOpen(false)));
        byId('supportRequestModal')?.addEventListener('click', (event) => {
            if (event.target === event.currentTarget) setSupportRequestOpen(false);
        });
        byId('supportRequestForm')?.addEventListener('submit', submitSupportRequest);
        byId('supportChatForm')?.addEventListener('submit', sendMessage);
        byId('supportMessages')?.addEventListener('contextmenu', (event) => {
            const message = event.target.closest('.support-message[data-message-mine="true"]');
            if (!message || !message.dataset.messageId) return;
            event.preventDefault();
            recalledMessageId = message.dataset.messageId;
            const menu = byId('supportRecallMenu');
            if (!menu) return;
            menu.hidden = false;
            menu.style.left = `${Math.min(event.clientX, window.innerWidth - 196)}px`;
            menu.style.top = `${Math.min(event.clientY, window.innerHeight - 56)}px`;
        });
        byId('supportRecallButton')?.addEventListener('click', async () => {
            const menu = byId('supportRecallMenu');
            if (menu) menu.hidden = true;
            if (recalledMessageId) await recallMessage(recalledMessageId);
            recalledMessageId = null;
        });
        byId('supportImageButton')?.addEventListener('click', () => byId('supportImageInput')?.click());
        byId('supportImageInput')?.addEventListener('change', event => {
            pendingImage = event.target.files && event.target.files[0] ? event.target.files[0] : null;
            byId('supportAttachmentLabel').textContent = pendingImage ? `Đã chọn: ${pendingImage.name}` : '';
        });
        document.addEventListener('click', (event) => {
            const support = byId('supportChat');
            if (support && !support.contains(event.target)) setSupportMenuOpen(false);
            const recallMenu = byId('supportRecallMenu');
            if (recallMenu && !recallMenu.contains(event.target)) recallMenu.hidden = true;
        });
        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            setSupportMenuOpen(false);
            setChatOpen(false);
            setSupportRequestOpen(false);
        });
        initialiseChat();
    });
}());
