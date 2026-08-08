/* Presentation-only effects from the imported UI. No Firebase or data access. */
(() => {
    'use strict';

    const THEME_KEY = 'VieGeo_theme';
    const normaliseTheme = value => value === 'light' ? 'light' : 'dark';

    function currentTheme() {
        try { return normaliseTheme(localStorage.getItem(THEME_KEY)); }
        catch (error) { console.warn('[VieGeo UI] Không thể đọc giao diện đã lưu.', error); return 'dark'; }
    }

    function applyTheme(theme) {
        try {
            const value = normaliseTheme(theme);
            document.documentElement.setAttribute('data-theme', value);
            document.documentElement.style.colorScheme = value;
            document.body?.classList.toggle('light-mode', value === 'light');
            document.querySelectorAll('[data-global-theme-toggle]').forEach(button => {
                button.setAttribute('aria-pressed', String(value === 'dark'));
                button.setAttribute('title', value === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối');
            });
        } catch (error) {
            console.warn('[VieGeo UI] Không thể áp dụng hiệu ứng đổi giao diện.', error);
        }
    }

    function syncSharedNavigation() {
        try {
            document.querySelectorAll('.shared-link').forEach(link => {
                link.classList.toggle('active', link.getAttribute('aria-current') === 'page');
            });
        } catch (error) {
            console.warn('[VieGeo UI] Không thể đồng bộ hiệu ứng điều hướng.', error);
        }
    }

    function initialise() {
        applyTheme(currentTheme());
        syncSharedNavigation();

        document.addEventListener('click', event => {
            const themeTrigger = event.target.closest('#btnThemeToggle, #btnSettingsTheme, [data-global-theme-toggle], [data-role-theme-toggle], #learningThemeToggle');
            if (themeTrigger) window.setTimeout(() => applyTheme(currentTheme()), 0);

            const navigationTrigger = event.target.closest('.shared-link, .nav-button');
            if (navigationTrigger) window.setTimeout(syncSharedNavigation, 320);
        });

        const navigation = document.getElementById('navMenu');
        if (navigation && typeof MutationObserver !== 'undefined') {
            new MutationObserver(syncSharedNavigation).observe(navigation, {
                subtree: true,
                attributes: true,
                attributeFilter: ['aria-current']
            });
        }
    }

    document.addEventListener('DOMContentLoaded', initialise, { once: true });
    window.addEventListener('storage', event => {
        if (event.key === THEME_KEY) applyTheme(currentTheme());
    });

    window.VieGeoUiEffects = Object.freeze({ applyTheme, syncSharedNavigation });
})();
