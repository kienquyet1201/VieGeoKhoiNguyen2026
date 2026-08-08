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
    const security = window.VieGeoSecurity || {
        sanitizeText: (value, max = 2000) => String(value || '').replace(/<[^>]*>/g, '').trim().slice(0, max),
        rateLimit: () => ({ allowed: true, retryAfterMs: 0 })
    };

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
        byId('supportRequestEyebrow').textContent = isReport ? 'BÃO CÃO Lá»–I' : 'GÃ“P Ã VIEGEO';
        byId('supportRequestTitle').textContent = isReport ? 'Báº¡n Ä‘ang gáº·p lá»—i gÃ¬?' : 'ÄÃ³ng gÃ³p Ã½ tÆ°á»Ÿng cá»§a báº¡n';
        byId('supportRequestHint').textContent = isReport
            ? 'HÃ£y mÃ´ táº£ lá»—i, thao tÃ¡c vá»«a thá»±c hiá»‡n vÃ  thiáº¿t bá»‹ báº¡n Ä‘ang dÃ¹ng.'
            : 'Má»i gÃ³p Ã½ Ä‘á»u giÃºp VieGeo cáº£i thiá»‡n tráº£i nghiá»‡m há»c táº­p.';
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
        console.warn(message);
    }

    function getSupabaseClient() {
        const client = window.supabaseClient || window.supabase;
        return client && typeof client.from === 'function' ? client : null;
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
            console.warn('KhÃ´ng kiá»ƒm tra Ä‘Æ°á»£c tráº¡ng thÃ¡i CSKH:', error);
            return 0;
        }
    }

    async function hasOnlineStaff() {
        return (await activeAgentCount()) > 0;
    }

    function statusLabel(status) {
        if (status === 'read') return 'âœ“âœ“ ÄÃ£ xem';
        if (status === 'received') return 'âœ“ ÄÃ£ nháº­n';
        if (status === 'recalled') return 'ÄÃ£ thu há»“i';
        return 'âœ“ ÄÃ£ gá»­i';
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
        try { await batch.commit(); } catch (error) { console.warn('KhÃ´ng thá»ƒ Ä‘Ã¡nh dáº¥u tin nháº¯n Ä‘Ã£ Ä‘á»c:', error); }
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
            const image = message.imageUrl ? `<img src="${escapeHtml(message.imageUrl)}" alt="áº¢nh Ä‘Ã­nh kÃ¨m há»— trá»£">` : '';
            const staffName = message.staffName || message.senderName || message.staffEmail || 'VieGeo';
            const label = isMine ? 'Báº¡n' : message.sender === 'AI' ? 'CSKH tá»± Ä‘á»™ng (AI)' : `CSKH + ${staffName}`;
            const recalled = message.recalled === true || message.status === 'recalled';
            const status = message.status || (isMine ? 'sent' : 'received');
            return `<article class="support-message ${isMine ? 'is-mine' : 'is-agent'}${recalled ? ' is-recalled' : ''}" data-message-id="${escapeHtml(message.id)}" data-message-mine="${String(isMine)}"><span>${label}</span><p>${escapeHtml(recalled ? 'ÄÃ£ thu há»“i tin nháº¯n.' : (message.text || (message.imageUrl ? '' : '')))}</p>${recalled ? '' : image}${isMine ? `<em class="support-message-status${status === 'read' ? ' is-read' : ''}">${statusLabel(status)}</em>` : ''}</article>`;
        }).join('') || '<p class="support-empty">HÃ£y Ä‘á»ƒ láº¡i cÃ¢u há»i. VieGeo sáº½ há»— trá»£ báº¡n ngay.</p>';
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
        if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type || '')) {
            throw new Error('Chá»‰ há»— trá»£ áº£nh PNG, JPG, WEBP hoáº·c GIF.');
        }
        if (file.size > 2 * 1024 * 1024) {
            throw new Error('áº¢nh Ä‘Ã­nh kÃ¨m khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 2MB.');
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('KhÃ´ng thá»ƒ Ä‘á»c áº£nh Ä‘Ã­nh kÃ¨m.'));
            reader.readAsDataURL(file);
        });
    }

    async function requestAiReply(text) {
        const response = await fetch('/api/support-ai', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text })
        });
        if (!response.ok) throw new Error('KhÃ´ng thá»ƒ gá»i trá»£ lÃ½ tá»± Ä‘á»™ng.');
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
                const reply = await requestAiReply(text || 'TÃ´i cáº§n há»— trá»£.');
                const now = Date.now();
                await messagesRef.add({
                    sender: 'AI', senderId: 'ai-viegeo', senderName: 'CSKH tá»± Ä‘á»™ng (AI)',
                    text: reply, status: 'received',
                    timestamp: new Date().toISOString(), timestampClient: now,
                    createdAt: new Date().toISOString(), createdAtClient: now
                });
            } catch (error) {
                console.warn('KhÃ´ng thá»ƒ gá»­i pháº£n há»“i AI tá»± Ä‘á»™ng.', error);
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
            notify('ÄÃ£ thu há»“i tin nháº¯n.', 'success');
        } catch (error) {
            console.error('KhÃ´ng thá»ƒ thu há»“i tin nháº¯n:', error);
            notify('ChÆ°a thá»ƒ thu há»“i tin nháº¯n. Vui lÃ²ng thá»­ láº¡i.', 'error');
        }
    }

    async function sendMessage(event) {
        event.preventDefault();
        const input = byId('supportMessageInput');
        const form = byId('supportChatForm');
        const user = session();
        const text = input ? security.sanitizeText(input.value, 1200) : '';
        if ((!text && !pendingImage) || !user.email || !messagesRef || typeof db === 'undefined') {
            if (!text && !pendingImage) input?.focus();
            else if (window.VieGeoUI) window.VieGeoUI.warning('Äang káº¿t ná»‘i kÃªnh há»— trá»£, vui lÃ²ng thá»­ láº¡i sau Ã­t giÃ¢y.');
            return;
        }

        const submit = form?.querySelector('button[type="submit"]');
        if (submit) submit.disabled = true;
        try {
            const limit = security.rateLimit(`support_chat_${user.email}`, { limit: 8, windowMs: 60000 });
            if (!limit.allowed) throw new Error(`Báº¡n gá»­i tin nháº¯n quÃ¡ nhanh. Vui lÃ²ng thá»­ láº¡i sau ${Math.ceil(limit.retryAfterMs / 1000)}s.`);
            const timestampClient = Date.now();
            const imageUrl = await uploadImage(pendingImage, user.email);
            await db.collection('support_conversations').doc(user.email).set({
                email: user.email,
                name: user.name || user.displayName || user.email,
                lastMessage: text || 'ÄÃ£ gá»­i má»™t hÃ¬nh áº£nh',
                updatedAt: new Date().toISOString(),
                updatedAtClient: timestampClient,
                unreadForStaff: true
            }, { merge: true });
            const submittedMessage = await messagesRef.add({
                sender: 'user', senderId: user.email, senderName: user.name || user.displayName || user.email,
                text, imageUrl: imageUrl || null, status: 'sent',
                timestamp: new Date().toISOString(), timestampClient,
                createdAt: new Date().toISOString(), createdAtClient: timestampClient
            });
            input.value = '';
            pendingImage = null;
            byId('supportAttachmentLabel').textContent = '';
            scrollMessagesToBottom();

            const activeAgents = await activeAgentCount();
            const staffOnline = activeAgents > 0;
            byId('supportAvailability').textContent = staffOnline ? 'CSKH Ä‘ang trá»±c tuyáº¿n' : 'Trá»£ lÃ½ áº£o Ä‘ang há»— trá»£';
            scheduleAiFallback(submittedMessage.id, text, timestampClient, staffOnline ? 120000 : 1500);
        } catch (error) {
            console.error('KhÃ´ng thá»ƒ gá»­i tin nháº¯n há»— trá»£:', error);
            const message = error?.code === 'permission-denied'
                ? 'Báº¡n chÆ°a cÃ³ quyá»n gá»­i tin nháº¯n. Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i vÃ  thá»­ láº¡i.'
                : 'ChÆ°a thá»ƒ gá»­i yÃªu cáº§u há»— trá»£. Vui lÃ²ng thá»­ láº¡i.';
            if (window.VieGeoUI) window.VieGeoUI.error(message);
        } finally {
            if (submit) submit.disabled = false;
        }
    }

    async function initialiseChat() {
        const user = session();
        if (!user.email || typeof db === 'undefined') return;
        messagesRef = db.collection('support_conversations').doc(user.email).collection('messages');
        messagesRef.onSnapshot(renderMessages, error => console.warn('KhÃ´ng thá»ƒ nháº­n tin nháº¯n há»— trá»£:', error));
        const online = await hasOnlineStaff();
        byId('supportAvailability').textContent = online ? 'CSKH Ä‘ang trá»±c tuyáº¿n' : 'Trá»£ lÃ½ áº£o sáºµn sÃ ng há»— trá»£';
    }

    async function submitSupportRequest(event) {
        event.preventDefault();
        const user = session();
        const type = byId('supportRequestType')?.value || 'feedback';
        const subject = security.sanitizeText(byId('supportRequestSubject')?.value, 160);
        const message = security.sanitizeText(byId('supportRequestMessage')?.value, 3000);
        const form = byId('supportRequestForm');
        const submit = form?.querySelector('button[type="submit"]');
        if (!subject || !message) {
            byId(!subject ? 'supportRequestSubject' : 'supportRequestMessage')?.focus();
            return;
        }
        if (submit) submit.disabled = true;
        try {
            const limit = security.rateLimit(`support_request_${type}_${user.email || 'anonymous'}`, { limit: 3, windowMs: 10 * 60 * 1000 });
            if (!limit.allowed) throw new Error(`Báº¡n gá»­i yÃªu cáº§u quÃ¡ nhanh. Vui lÃ²ng thá»­ láº¡i sau ${Math.ceil(limit.retryAfterMs / 1000)}s.`);
            const supabase = getSupabaseClient();
            const senderEmail = user.email || 'anonymous';
            const senderName = user.name || user.displayName || user.email || 'KhÃ¡ch';
            if (supabase) {
                const tableName = type === 'report' ? 'error_reports' : 'user_feedbacks';
                const payload = type === 'report'
                    ? {
                        user_email: senderEmail,
                        error_message: message,
                        page: subject,
                        subject,
                        message,
                        sender_id: senderEmail,
                        sender_name: senderName,
                        status: 'pending',
                        created_at_client: Date.now()
                    }
                    : {
                        user_email: senderEmail,
                        content: message,
                        subject,
                        message,
                        sender_id: senderEmail,
                        sender_name: senderName,
                        status: 'pending',
                        created_at_client: Date.now()
                    };
                const { error } = await supabase.from(tableName).insert([payload]);
                if (error) throw error;
            } else {
                if (typeof db === 'undefined') {
                    notify('ChÆ°a thá»ƒ gá»­i yÃªu cáº§u khi Supabase/localStorage chÆ°a sáºµn sÃ ng.', 'warning');
                    return;
                }
                const collectionName = type === 'report' ? 'ErrorReports' : 'UserFeedbacks';
                await db.collection(collectionName).add({
                    type: type === 'report' ? 'error-report' : 'user-feedback',
                    subject,
                    message,
                    senderId: senderEmail,
                    senderName,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    createdAtClient: Date.now()
                });
            }
            setSupportRequestOpen(false);
            notify(type === 'report' ? 'ÄÃ£ gá»­i bÃ¡o cÃ¡o lá»—i. Cáº£m Æ¡n báº¡n!' : 'ÄÃ£ gá»­i gÃ³p Ã½. Cáº£m Æ¡n báº¡n!', 'success');
        } catch (error) {
            console.error('KhÃ´ng thá»ƒ gá»­i yÃªu cáº§u há»— trá»£:', error);
            notify('ChÆ°a thá»ƒ gá»­i yÃªu cáº§u. Vui lÃ²ng thá»­ láº¡i sau.', 'error');
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
            byId('supportAttachmentLabel').textContent = pendingImage ? `ÄÃ£ chá»n: ${pendingImage.name}` : '';
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

