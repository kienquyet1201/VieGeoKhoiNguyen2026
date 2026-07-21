/* Progressive Rive enhancement for the student map UI. The original buttons
   remain clickable and retain Font Awesome fallbacks if the Rive runtime fails. */
(function () {
    'use strict';

    const instances = [];

    function normaliseName(value) {
        return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    }

    function setStateInput(instance, stateMachine, action, value) {
        const names = {
            hover: ['hover', 'hoverboolean', 'hovered', 'ishovered'],
            press: ['pressed', 'ispressed'],
            activate: ['clicked', 'click', 'pressed', 'ispressed', 'onoff']
        }[action] || [];

        if (!names.length) return;

        try {
            const inputs = instance?.stateMachineInputs?.(stateMachine || 'State Machine 1') || [];
            inputs.forEach((input) => {
                if (!names.includes(normaliseName(input.name))) return;

                // Trigger inputs expose fire(); boolean/number inputs expose value.
                if (action === 'activate' && value && typeof input.fire === 'function') input.fire();
                else if ('value' in input) input.value = Boolean(value);
            });
        } catch (error) {
            console.warn('KhÃ´ng thá»ƒ Ä‘iá»u khiá»ƒn State Machine Rive:', error);
        }
    }

    function resizeInstance(instance) {
        try { instance?.resizeDrawingSurfaceToCanvas?.(); }
        catch (error) { console.warn('Không thể căn chỉnh hiệu ứng Rive:', error); }
    }

    function activateCanvas(canvas) {
        if (!canvas || canvas.dataset.riveInitialised || !canvas.dataset.riveSrc || !window.rive?.Rive) return;
        canvas.dataset.riveInitialised = 'true';

        const control = canvas.closest('.rive-control, .rive-streak-pill, .premium-rive-stage');
        const stateMachine = canvas.dataset.riveStateMachine || 'State Machine 1';
        let instance;
        try {
            instance = new window.rive.Rive({
                src: canvas.dataset.riveSrc,
                canvas,
                autoplay: true,
                stateMachines: stateMachine,
                autoBind: true,
                automaticallyHandleEvents: true,
                onLoad: () => {
                    canvas.classList.add('rive-ready');
                    control?.classList.add('has-rive');
                    resizeInstance(instance);

                    // The streak animation is decorative, so keep its flame alive without a click.
                    if (canvas.classList.contains('rive-streak-canvas')) {
                        setStateInput(instance, stateMachine, 'hover', true);
                        setStateInput(instance, stateMachine, 'activate', true);
                    }
                },
                onLoadError: (error) => console.warn('Không thể tải hiệu ứng Rive:', canvas.dataset.riveSrc, error)
            });
            instances.push(instance);

            const interactiveControl = canvas.closest('button, a');
            if (interactiveControl) {
                const play = () => instance?.play?.();
                interactiveControl.addEventListener('pointerenter', () => {
                    setStateInput(instance, stateMachine, 'hover', true);
                    play();
                });
                interactiveControl.addEventListener('pointerleave', () => setStateInput(instance, stateMachine, 'hover', false));
                interactiveControl.addEventListener('focus', () => {
                    setStateInput(instance, stateMachine, 'hover', true);
                    play();
                });
                interactiveControl.addEventListener('blur', () => setStateInput(instance, stateMachine, 'hover', false));
                interactiveControl.addEventListener('pointerdown', () => setStateInput(instance, stateMachine, 'press', true));
                interactiveControl.addEventListener('pointerup', () => setStateInput(instance, stateMachine, 'press', false));
                interactiveControl.addEventListener('pointercancel', () => setStateInput(instance, stateMachine, 'press', false));
                interactiveControl.addEventListener('click', () => {
                    setStateInput(instance, stateMachine, 'activate', true);
                    play();
                    window.setTimeout(() => setStateInput(instance, stateMachine, 'press', false), 220);
                });
            }
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
