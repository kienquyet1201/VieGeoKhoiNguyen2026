(function initVieGeoUI(global) {
    'use strict';

    try {
        const defaultOptions = {
            confirmButtonColor: '#1cb0f6',
            background: '#13253a',
            color: '#f0f4f8',
            heightAuto: false,
            allowOutsideClick: false
        };

        async function notify(message, options) {
            try {
                if (global.Swal && typeof global.Swal.fire === 'function') {
                    return await global.Swal.fire({
                        ...defaultOptions,
                        icon: 'info',
                        title: 'Thông báo',
                        text: String(message || ''),
                        ...(options || {})
                    });
                }
                console.warn('[VieGeo UI]', message);
                return { isConfirmed: true, isDismissed: false };
            } catch (error) {
                console.error('Không thể hiển thị thông báo:', error);
                return { isConfirmed: true, isDismissed: false };
            }
        }

        global.VieGeoUI = Object.freeze({
            alert: notify,
            success(message, options) {
                return notify(message, { icon: 'success', title: 'Thành công', ...(options || {}) });
            },
            error(message, options) {
                return notify(message, { icon: 'error', title: 'Đã xảy ra lỗi', ...(options || {}) });
            },
            warning(message, options) {
                return notify(message, { icon: 'warning', title: 'Lưu ý', ...(options || {}) });
            }
        });
    } catch (error) {
        console.error('Không thể khởi tạo lớp giao diện dùng chung:', error);
    }
})(window);
