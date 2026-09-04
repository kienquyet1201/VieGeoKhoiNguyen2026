(function () {
    'use strict';

    var ROUTES = { user: 'student-dashboard.html', parent: 'parent.html', cs: 'cs-dashboard.html', admin: 'admin-dashboard.html' };

    function getUser() {
        return window.VieGeoUserStore?.get?.() || window.VieGeoCurrentUser || null;
    }

    function allowedRoles() {
        var user = getUser();
        return Array.isArray(user?.roles) ? user.roles.filter(function (role) { return Boolean(ROUTES[role]); }) : [];
    }

    function changeRolePage() {
        try {
            var role = this.value;
            if (!allowedRoles().includes(role)) throw new Error('ROLE_NOT_GRANTED');
            window.VieGeoUserStore.setActiveRole(role);
            window.location.href = ROUTES[role];
        } catch (error) {
            var active = window.VieGeoUserStore?.getActiveRole?.() || allowedRoles()[0] || '';
            this.value = active;
            window.showToast?.('Vai trò này chưa được cấp cho tài khoản của bạn.', 'warning');
        }
    }

    function initializeRolePageSwitcher() {
        try {
            var roles = allowedRoles();
            var active = window.VieGeoUserStore?.getActiveRole?.() || roles[0] || '';
            [document.getElementById('roleButton'), document.getElementById('settingsRoleButton')].forEach(function (button) {
                if (button) { button.hidden = roles.length < 2; button.style.display = roles.length < 2 ? 'none' : ''; }
            });
            document.querySelectorAll('[data-role-page-select]').forEach(function (select) {
                Array.from(select.options).forEach(function (option) {
                    option.hidden = !roles.includes(option.value);
                    option.disabled = !roles.includes(option.value);
                });
                select.value = roles.includes(active) ? active : (roles[0] || '');
                select.disabled = roles.length < 2;
                if (select.closest('.role-page-switcher')) select.closest('.role-page-switcher').hidden = roles.length < 2;
                if (select.dataset.roleSwitchBound !== 'true') {
                    select.dataset.roleSwitchBound = 'true';
                    select.addEventListener('change', changeRolePage);
                }
            });
        } catch (error) {
            console.warn('[VieGeo Role] Không thể khởi tạo đổi vai trò:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', initializeRolePageSwitcher);
    window.addEventListener('viegeo:user-hydrated', initializeRolePageSwitcher);
}());
