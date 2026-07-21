/* Shared taskbar controls. Works with the legacy Firebase Compat application. */
(function () {
    'use strict';

    const byId = (id) => document.getElementById(id);
    const session = (() => {
        try { return JSON.parse(localStorage.getItem('lm_session') || '{}'); }
        catch { return {}; }
    })();

    function updateThemeIcon() {
        const button = byId('btnThemeToggle');
        if (!button) return;
        const isLight = document.body.classList.contains('light-mode');
        button.innerHTML = `<i class="fa-solid fa-${isLight ? 'sun' : 'moon'}"></i>`;
        button.setAttribute('aria-label', isLight ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng');
    }

    function applySavedTheme() {
        const theme = localStorage.getItem('VieGeo_theme');
        document.body.classList.toggle('light-mode', theme === 'light');
        updateThemeIcon();
    }

    function persistGrade(grade) {
        const activeGameState = window.gameState;
        if (!activeGameState) return;

        activeGameState.selectedGrade = grade;
        if (typeof saveGameState === 'function') saveGameState(activeGameState);
        if (session.email && typeof db !== 'undefined') {
            db.collection('users').doc(session.email).set({
                grade: grade === 'all' ? null : Number(grade),
                selectedGrade: grade,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(error => console.warn('Không thể đồng bộ khối lớp:', error));
        }
        if (typeof renderMap === 'function') renderMap();
    }

    async function hashPin(pin) {
        if (window.crypto && window.crypto.subtle) {
            const data = new TextEncoder().encode(pin);
            const digest = await window.crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
        }
        return btoa(unescape(encodeURIComponent(pin)));
    }

    function openParentModal() {
        const modal = byId('parentPinModal');
        const input = byId('parentPinInput');
        if (!modal || !input) return;
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        input.value = '';
        window.setTimeout(() => input.focus(), 0);
    }

    function closeParentModal() {
        const modal = byId('parentPinModal');
        if (!modal) return;
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }

    async function verifyParentPin(event) {
        event.preventDefault();
        const input = byId('parentPinInput');
        const hint = byId('parentPinHint');
        const submit = byId('btnParentPinConfirm');
        const pin = input ? input.value.trim() : '';
        if (!/^\d{4,8}$/.test(pin)) {
            if (hint) hint.textContent = 'Mã PIN gồm 4–8 chữ số.';
            return;
        }
        if (!session.email || typeof db === 'undefined') return;

        submit.disabled = true;
        try {
            const snapshot = await db.collection('users').doc(session.email).get();
            const profile = snapshot.exists ? snapshot.data() : {};
            const pinHash = await hashPin(pin);
            if (!profile.parentPinHash) {
                await db.collection('users').doc(session.email).set({ parentPinHash: pinHash }, { merge: true });
                if (hint) hint.textContent = 'Đã thiết lập mã PIN phụ huynh.';
            } else if (profile.parentPinHash !== pinHash) {
                if (hint) hint.textContent = 'Mã PIN chưa đúng. Vui lòng thử lại.';
                return;
            }
            window.location.href = '/parent';
        } catch (error) {
            console.error('Không thể xác nhận mã PIN phụ huynh:', error);
            if (hint) hint.textContent = 'Không thể xác nhận PIN lúc này. Vui lòng thử lại.';
        } finally {
            submit.disabled = false;
        }
    }

    async function signOutCurrentUser() {
        try {
            if (window.firebase && typeof window.firebase.auth === 'function') await window.firebase.auth().signOut();
        } catch (error) {
            console.warn('Firebase Auth signOut không khả dụng cho phiên đăng nhập cũ:', error);
        } finally {
            localStorage.removeItem('lm_session');
            localStorage.removeItem('VieGeo_state');
            localStorage.removeItem('pending_action');
            window.location.href = '/loginout';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        applySavedTheme();
        const grade = byId('quickGradeSelect');
        if (grade && window.gameState) {
            grade.value = window.gameState.selectedGrade || 'all';
            grade.addEventListener('change', () => persistGrade(grade.value));
        }
        byId('btnThemeToggle')?.addEventListener('click', () => {
            const nextLight = !document.body.classList.contains('light-mode');
            document.body.classList.toggle('light-mode', nextLight);
            localStorage.setItem('VieGeo_theme', nextLight ? 'light' : 'dark');
            updateThemeIcon();
        });
        byId('btnParentAccess')?.addEventListener('click', openParentModal);
        byId('btnParentPinCancel')?.addEventListener('click', closeParentModal);
        byId('parentPinForm')?.addEventListener('submit', verifyParentPin);
        byId('btnTaskbarLogout')?.addEventListener('click', signOutCurrentUser);
    });
}());
