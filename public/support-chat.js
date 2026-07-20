/* Customer support chat with image upload and an AI fallback when staff are offline. */
(function () {
    'use strict';

    const STAFF_ONLINE_WINDOW = 90 * 1000;
    const byId = (id) => document.getElementById(id);
    let pendingImage = null;
    let messagesRef = null;

    function session() {
        try { return JSON.parse(localStorage.getItem('lm_session') || '{}'); }
        catch { return {}; }
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
    }

    function setOpen(open) {
        const panel = byId('supportChatPanel');
        const toggle = byId('supportChatToggle');
        if (!panel || !toggle) return;
        panel.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        if (open) byId('supportMessageInput')?.focus();
    }

    async function hasOnlineStaff() {
        try {
            const threshold = Date.now() - STAFF_ONLINE_WINDOW;
            const snapshot = await db.collection('users').where('lastActive', '>=', threshold).get();
            return snapshot.docs.some(document => {
                const user = document.data() || {};
                const roles = Array.isArray(user.roles) ? user.roles : [user.role];
                return user.isAdmin || user.isCustomerSupport || roles.includes('admin') || roles.includes('cs');
            });
        } catch (error) {
            console.warn('Không kiểm tra được trạng thái CSKH:', error);
            return false;
        }
    }

    function renderMessages(snapshot) {
        const container = byId('supportMessages');
        if (!container) return;
        const messages = snapshot.docs.map(document => ({ id: document.id, ...document.data() }))
            .sort((left, right) => (left.createdAtClient || 0) - (right.createdAtClient || 0));
        container.innerHTML = messages.map(message => {
            const isMine = message.sender === 'user';
            const image = message.imageUrl ? `<img src="${escapeHtml(message.imageUrl)}" alt="Ảnh đính kèm hỗ trợ">` : '';
            const label = isMine ? 'Bạn' : message.sender === 'staff' ? 'CSKH VieGeo' : 'Trợ lý VieGeo';
            return `<article class="support-message ${isMine ? 'is-mine' : 'is-agent'}"><span>${label}</span>${message.text ? `<p>${escapeHtml(message.text)}</p>` : ''}${image}</article>`;
        }).join('') || '<p class="support-empty">Hãy để lại câu hỏi. VieGeo sẽ hỗ trợ bạn ngay.</p>';
        container.scrollTop = container.scrollHeight;
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

    async function sendMessage(event) {
        event.preventDefault();
        const input = byId('supportMessageInput');
        const form = byId('supportChatForm');
        const user = session();
        const text = input ? input.value.trim() : '';
        if (!text && !pendingImage || !user.email || !messagesRef) return;

        const submit = form?.querySelector('button[type="submit"]');
        if (submit) submit.disabled = true;
        try {
            const imageUrl = await uploadImage(pendingImage, user.email);
            await messagesRef.add({
                sender: 'user', text, imageUrl: imageUrl || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdAtClient: Date.now()
            });
            input.value = '';
            pendingImage = null;
            byId('supportAttachmentLabel').textContent = '';

            const staffOnline = await hasOnlineStaff();
            byId('supportAvailability').textContent = staffOnline ? 'CSKH đang trực tuyến' : 'Trợ lý ảo đang hỗ trợ';
            if (!staffOnline && text) {
                const reply = await requestAiReply(text);
                await messagesRef.add({
                    sender: 'assistant', text: reply, createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdAtClient: Date.now()
                });
            }
        } catch (error) {
            console.error('Không thể gửi tin nhắn hỗ trợ:', error);
            if (window.VieGeoUI) window.VieGeoUI.error('Chưa thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.');
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

    document.addEventListener('DOMContentLoaded', () => {
        byId('supportChatToggle')?.addEventListener('click', () => setOpen(true));
        byId('supportChatClose')?.addEventListener('click', () => setOpen(false));
        byId('supportChatForm')?.addEventListener('submit', sendMessage);
        byId('supportImageButton')?.addEventListener('click', () => byId('supportImageInput')?.click());
        byId('supportImageInput')?.addEventListener('change', event => {
            pendingImage = event.target.files && event.target.files[0] ? event.target.files[0] : null;
            byId('supportAttachmentLabel').textContent = pendingImage ? `Đã chọn: ${pendingImage.name}` : '';
        });
        initialiseChat();
    });
}());
