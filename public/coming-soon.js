(function () {
    'use strict';

    try {
        const query = new URLSearchParams(window.location.search);
        const subject = query.get('subject');
        const title = document.getElementById('comingSoonTitle');
        if (!title || !subject) return;

        const messages = {
            history: 'Môn Lịch sử đang trong giai đoạn phát triển, sẽ sớm phát hành',
            integrated: 'Chế độ Dung hợp Sử – Địa đang trong giai đoạn phát triển, sẽ sớm phát hành'
        };
        if (messages[subject]) title.textContent = messages[subject];
    } catch (error) {
        console.warn('[VieGeo] Không thể đọc trạng thái trang đang phát triển:', error);
    }
}());
