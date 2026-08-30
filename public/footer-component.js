(function () {
    'use strict';

    function createFooter() {
        try {
            if (document.getElementById('viegeoSiteFooter')) return;

            const footer = document.createElement('footer');
            footer.id = 'viegeoSiteFooter';
            footer.className = 'viegeo-site-footer';
            footer.setAttribute('aria-label', 'Thông tin VieGeo');
            footer.innerHTML = `
                <div class="viegeo-footer__inner">
                    <section class="viegeo-footer__brand" aria-label="VieGeo">
                        <a class="viegeo-footer__logo" href="student-dashboard.html" aria-label="Về trang học viên VieGeo">
                            <span class="viegeo-footer__logo-mark" aria-hidden="true">VG</span>
                            <span>VieGeo</span>
                        </a>
                        <p>Nền tảng học tập tương tác, đồng hành cùng học sinh trên hành trình khám phá Việt Nam.</p>
                        <div class="viegeo-footer__socials" aria-label="Mạng xã hội VieGeo">
                            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook VieGeo">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.7-1.6h1.8V3.8c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6V10H7v3h2.8v8h3.7Z"/></svg>
                            </a>
                            <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="YouTube VieGeo">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.5 12 4.5 12 4.5s-5.7 0-7.5.6A3 3 0 0 0 2.4 7.2C1.8 9 1.8 12 1.8 12s0 3 .6 4.8a3 3 0 0 0 2.1 2.1c1.8.6 7.5.6 7.5.6s5.7 0 7.5-.6a3 3 0 0 0 2.1-2.1c.6-1.8.6-4.8.6-4.8s0-3-.6-4.8ZM9.8 15.1V8.9l5.4 3.1-5.4 3.1Z"/></svg>
                            </a>
                        </div>
                    </section>

                    <section class="viegeo-footer__column">
                        <h2>Khám phá</h2>
                        <a href="https://moet.gov.vn/" target="_blank" rel="noopener noreferrer">Nguồn tài liệu chính thống</a>
                        <a href="coming-soon.html?section=about">Giới thiệu VieGeo</a>
                    </section>

                    <section class="viegeo-footer__column">
                        <h2>Thông tin &amp; chính sách</h2>
                        <a href="coming-soon.html?section=terms">Điều khoản sử dụng</a>
                        <a href="coming-soon.html?section=privacy">Chính sách bảo mật</a>
                        <a href="coming-soon.html?section=complaints">Chính sách khiếu nại</a>
                        <a href="coming-soon.html?section=content">Quy chế nội dung</a>
                    </section>

                    <section class="viegeo-footer__column viegeo-footer__contact">
                        <h2>Liên hệ</h2>
                        <p><strong>Trụ sở chính:</strong> Hà Nội, Việt Nam</p>
                        <p><strong>Cơ quan chủ quản:</strong> The World</p>
                        <a href="mailto:hotro@viegeo.online">hotro@viegeo.online</a>
                        <a href="tel:+842473002026">(+84) 24 7300 2026</a>
                    </section>
                </div>
                <div class="viegeo-footer__legal">
                    <p>Chịu trách nhiệm nội dung: Trịnh Bảo Châu, Cao Thị Thảo Hiền, Bùi Thu Hòa.</p>
                    <p>Copyright © 2026 VIEGEO. All rights reserved.</p>
                </div>`;

            const main = document.querySelector('main');
            const pageShell = main && main.closest('.student-shell, .profile-shell, .parent-shell');
            if (pageShell && pageShell.parentNode) {
                pageShell.insertAdjacentElement('afterend', footer);
            } else if (main && main.parentNode) {
                main.insertAdjacentElement('afterend', footer);
            } else {
                document.body.appendChild(footer);
            }
        } catch (error) {
            console.warn('[VieGeo] Không thể khởi tạo Footer:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createFooter, { once: true });
    } else {
        createFooter();
    }
}());
