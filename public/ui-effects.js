/* VieGeo UI interaction layer.
 * Presentation only: it never reads/writes Supabase and never intercepts routing.
 */
(() => {
    'use strict';

    const STORAGE_KEY = 'viegeo.ui.active-navigation';
    const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const CARD_SELECTOR = '.bento-card, .ops-card, .ops-stat, .region-card, .province-card, .exam-question-card, .exam-navigator-card, .card';
    const CONTROL_SELECTOR = 'button:not([disabled]), a[href], .nav-button, .nav-btn, .ops-button, .bento-btn, .btn-game, .taskbar-icon-btn';
    const STAT_SELECTOR = '#hdrHearts, #hdrStreak, #hdrGems, #hdrXp, #hdrTrophies, #hdrLevel, [data-ui-stat]';

    const safely = (callback) => {
        try { callback(); } catch (error) { console.warn('[VieGeo UI] Không thể khởi tạo một hiệu ứng.', error); }
    };

    function markInteractive(root = document) {
        safely(() => {
            root.querySelectorAll?.(`${CARD_SELECTOR}, ${CONTROL_SELECTOR}`).forEach((element) => {
                element.classList.add('ui-interactive');
            });
        });
    }

    function prepareReveal(root = document) {
        safely(() => {
            if (REDUCED_MOTION) return;
            root.querySelectorAll?.(CARD_SELECTOR).forEach((element, index) => {
                if (element.dataset.uiRevealBound === 'true') return;
                element.dataset.uiRevealBound = 'true';
                element.classList.add('ui-reveal');
                element.style.setProperty('--ui-reveal-delay', `${Math.min(index * 45, 270)}ms`);
            });
        });
    }

    function synchronizeNavigation() {
        safely(() => {
            const buttons = [...document.querySelectorAll('.nav-button[href], .navigation-link[href]')];
            if (!buttons.length) return;
            const stored = window.localStorage?.getItem(STORAGE_KEY) || '';
            const currentPath = window.location.pathname.replace(/\/$/, '');
            const currentQuery = window.location.search;
            const current = buttons.find((button) => button.getAttribute('aria-current') === 'page')
                || buttons.find((button) => {
                    const href = button.getAttribute('href') || '';
                    if (!href || href.startsWith('#')) return false;
                    const target = new URL(href, window.location.origin);
                    return target.pathname.replace(/\/$/, '') === currentPath && (!target.search || target.search === currentQuery);
                })
                || buttons.find((button) => button.getAttribute('href') === stored);
            if (!current) return;
            buttons.forEach((button) => {
                const selected = button === current;
                button.classList.toggle('is-active', selected);
                if (selected) button.setAttribute('aria-current', 'page');
                else button.removeAttribute('aria-current');
            });
        });
    }

    function bindNavigation() {
        safely(() => {
            document.addEventListener('click', (event) => {
                const button = event.target.closest?.('.nav-button[href], .navigation-link[href]');
                if (!button || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                const href = button.getAttribute('href');
                if (!href || href.startsWith('#')) return;
                try { window.localStorage?.setItem(STORAGE_KEY, href); } catch (_) { /* storage is optional */ }
                button.classList.add('ui-nav-activating');
                window.setTimeout(() => button.classList.remove('ui-nav-activating'), 460);
            }, { passive: true });
        });
    }

    function bindRipple() {
        safely(() => {
            document.addEventListener('pointerdown', (event) => {
                if (REDUCED_MOTION || event.pointerType === 'mouse' && event.button !== 0) return;
                const target = event.target.closest?.(CONTROL_SELECTOR);
                if (!target || target.matches(':disabled')) return;
                const rect = target.getBoundingClientRect();
                const ripple = document.createElement('span');
                ripple.className = 'ui-ripple';
                ripple.style.left = `${event.clientX - rect.left}px`;
                ripple.style.top = `${event.clientY - rect.top}px`;
                target.appendChild(ripple);
                window.setTimeout(() => ripple.remove(), 650);
            }, { passive: true });
        });
    }

    function observeStatisticUpdates() {
        safely(() => {
            document.querySelectorAll(STAT_SELECTOR).forEach((stat) => {
                let previous = stat.textContent;
                const observer = new MutationObserver(() => {
                    const next = stat.textContent;
                    if (next === previous) return;
                    previous = next;
                    stat.classList.remove('ui-value-updated');
                    window.requestAnimationFrame(() => stat.classList.add('ui-value-updated'));
                    window.setTimeout(() => stat.classList.remove('ui-value-updated'), 560);
                });
                observer.observe(stat, { childList: true, characterData: true, subtree: true });
            });
        });
    }

    function observeDynamicUI() {
        safely(() => {
            const observer = new MutationObserver((records) => {
                records.forEach((record) => record.addedNodes.forEach((node) => {
                    if (!(node instanceof Element)) return;
                    markInteractive(node);
                    prepareReveal(node);
                }));
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    function initialize() {
        safely(() => {
            document.body.classList.add('ui-motion-ready');
            markInteractive();
            prepareReveal();
            synchronizeNavigation();
            bindNavigation();
            bindRipple();
            observeStatisticUpdates();
            observeDynamicUI();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();
})();
