/* Progressive Rive enhancement for the student map UI. The original buttons
   remain clickable and retain Font Awesome fallbacks if the Rive runtime fails. */
(function () {
    'use strict';

    const instances = [];

    function resizeInstance(instance) {
        try { instance?.resizeDrawingSurfaceToCanvas?.(); }
        catch (error) { console.warn('Không thể căn chỉnh hiệu ứng Rive:', error); }
    }

    function activateCanvas(canvas) {
        if (!canvas || canvas.dataset.riveInitialised || !canvas.dataset.riveSrc || !window.rive?.Rive) return;
        canvas.dataset.riveInitialised = 'true';

        const control = canvas.closest('.rive-control, .rive-streak-pill, .premium-rive-stage');
        let instance;
        try {
            instance = new window.rive.Rive({
                src: canvas.dataset.riveSrc,
                canvas,
                autoplay: true,
                autoBind: true,
                automaticallyHandleEvents: true,
                onLoad: () => {
                    canvas.classList.add('rive-ready');
                    control?.classList.add('has-rive');
                    resizeInstance(instance);
                },
                onLoadError: (error) => console.warn('Không thể tải hiệu ứng Rive:', canvas.dataset.riveSrc, error)
            });
            instances.push(instance);

            const interactiveControl = canvas.closest('button, a');
            interactiveControl?.addEventListener('pointerenter', () => instance?.play?.());
            interactiveControl?.addEventListener('focus', () => instance?.play?.());
        } catch (error) {
            console.warn('Không thể khởi tạo hiệu ứng Rive:', canvas.dataset.riveSrc, error);
        }
    }

    function resizeAll() {
        window.requestAnimationFrame(() => instances.forEach(resizeInstance));
    }

    function activateDeferred(selector) {
        document.querySelectorAll(`${selector} canvas[data-rive-src]`).forEach(activateCanvas);
        resizeAll();
    }

    function initialise() {
        document.querySelectorAll('canvas[data-rive-src]').forEach((canvas) => {
            if (!canvas.closest('#premiumModal, #supportChatPanel')) activateCanvas(canvas);
        });
        window.addEventListener('resize', resizeAll, { passive: true });
        window.addEventListener('viegeo:premium-open', () => window.setTimeout(() => activateDeferred('#premiumModal'), 80));
        window.addEventListener('viegeo:chat-open', () => window.setTimeout(() => activateDeferred('#supportChatPanel'), 80));
        document.addEventListener('visibilitychange', () => {
            instances.forEach((instance) => {
                if (document.hidden) instance?.pause?.();
                else instance?.play?.();
            });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
    else initialise();
}());
