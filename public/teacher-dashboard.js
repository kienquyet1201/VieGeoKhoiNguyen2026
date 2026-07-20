/* Teacher Portal: tạo mã lớp cục bộ, sẵn sàng thay bằng API lớp học sau này. */
(function () {
    'use strict';

    const STORAGE_KEY = 'VieGeo_teacher_classes';

    function createCode() {
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'VG-';
        for (let index = 0; index < 6; index += 1) {
            code += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        return code;
    }

    function saveClassCode(code) {
        try {
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            existing.unshift({ code, createdAt: new Date().toISOString() });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 20)));
        } catch (error) {
            console.warn('Không thể lưu mã lớp trên thiết bị này.', error);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const button = document.getElementById('createClassCode');
        const feedback = document.getElementById('classCodeFeedback');
        if (!button) return;

        button.addEventListener('click', async () => {
            const code = createCode();
            saveClassCode(code);
            if (feedback) feedback.textContent = `Mã lớp mới: ${code}`;
            if (window.Swal) {
                await Swal.fire({
                    title: 'Đã tạo mã lớp',
                    html: `Gửi mã <strong>${code}</strong> cho học sinh để tham gia lớp.`,
                    icon: 'success',
                    confirmButtonText: 'Đã hiểu'
                });
            }
        });
    });
}());
