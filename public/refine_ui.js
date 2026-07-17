const fs = require('fs');

let html = fs.readFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', 'utf8');

console.log("Refining UI...");

// 1. Cứu Layout Thanh Chỉ Số (Stats Bar)
// Replace the old stats-header classes with the requested ones
// Old might be: <div class="stats-header z-50 relative flex flex-wrap items-center justify-between w-full p-4 bg-white/10 backdrop-blur-md border-b border-white/20">
const newStatsHeader = `<div class="stats-header z-50 relative w-full flex items-center justify-start gap-6 py-4 px-8 bg-white/50 dark:bg-transparent border-b border-slate-200 dark:border-slate-800 backdrop-blur-md">`;
html = html.replace(/<div class="stats-header[^>]*>/, newStatsHeader);

// 2. Trau chuốt cụm nút Taskbar (Sidebar UI Polish)
// Update grade select
html = html.replace(/<select id="gradeSelectDropdown"[^>]*>/, `<select id="gradeSelectDropdown" onchange="window.selectGrade(parseInt(this.value))" class="bg-sky-600 text-white border-none outline-none px-4 py-3 rounded-xl cursor-pointer w-full text-left font-bold shadow-sm mb-2">`);
// Update Exam Arena button
html = html.replace(/<a href="/exam-arena"[^>]*>[\s\S]*?<\/a>/, `<a href="/exam-arena" class="bento-btn w-full flex items-center justify-start px-4 py-3 shadow-sm transition transform hover:scale-105 rounded-xl font-bold mb-2" style="background: #ef4444; color: white; text-decoration: none;"><i class="fa-solid fa-graduation-cap mr-3 w-5 text-center"></i> Đấu trường</a>`);
// Update Parent button
html = html.replace(/<button class="bento-btn w-full justify-start[^>]*onclick="openParentModal\(\)"[^>]*>[\s\S]*?<\/button>/, `<button class="bento-btn w-full flex items-center justify-start px-4 py-3 shadow-sm transition transform hover:scale-105 rounded-xl font-bold mb-2" onclick="openParentModal()" title="Dành cho Phụ Huynh" style="background: #ce82ff; color: white;"><i class="fa-solid fa-users mr-3 w-5 text-center"></i> Phụ Huynh</button>`);
// Update Role Switcher select
html = html.replace(/<select id="globalRoleSwitcher"[^>]*>/, `<select id="roleSwitcher" onchange="window.switchRoleClientOnly(this.value)" class="bg-slate-700 dark:bg-slate-800 text-white outline-none px-4 py-3 rounded-xl cursor-pointer w-full text-left font-bold shadow-sm mb-2">`);

// Update Icon Buttons Group
const iconGroupRegex = /<!-- Icon Buttons Group -->[\s\S]*?<\/div>/;
const newIconGroup = `<!-- Icon Buttons Group -->
                <div class="grid grid-cols-3 gap-2 w-full mt-2">
                    <button class="bento-btn flex justify-center items-center p-3 rounded-xl shadow-sm transition transform hover:scale-105 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white" onclick="toggleTheme()" title="Sáng/Tối">
                        <i id="themeIcon" class="fa-solid fa-moon text-lg"></i>
                    </button>
                    <button class="bento-btn flex justify-center items-center p-3 rounded-xl shadow-sm transition transform hover:scale-105 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white" onclick="redoSurvey()" title="Cài đặt">
                        <i class="fa-solid fa-gear text-lg"></i>
                    </button>
                    <button class="bento-btn flex justify-center items-center p-3 rounded-xl shadow-sm transition transform hover:scale-105 bg-red-500 text-white" id="btnLogoutMap" title="Đăng Xuất">
                        <i class="fa-solid fa-right-from-bracket text-lg"></i>
                    </button>
                </div>`;
html = html.replace(iconGroupRegex, newIconGroup);

// Fallback if regex failed to find icon group
if (!html.includes('grid grid-cols-3 gap-2')) {
    html = html.replace(/<div class="flex items-center justify-center gap-2 mt-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/aside>/, newIconGroup + '\n            </div>\n        </aside>');
}

// 3. Kích hoạt Điều hướng Role Switcher (Critical JS Logic)
const scriptRegex = /<script>\s*window\.switchRoleClientOnly = function\(selectedRole\) \{[\s\S]*?<\/script>/;
const newScript = `<script>
window.switchRoleClientOnly = function(selectedRole) {
    if (!selectedRole) return;
    localStorage.setItem('currentViewRole', selectedRole);
    if(typeof state !== 'undefined') {
        state.currentRole = selectedRole;
    }
    
    // Redirect Logic
    if (selectedRole === 'teacher') {
        window.location.href = '/teacher-dashboard';
    } else if (selectedRole === 'student') {
        window.location.href = '/map';
    } else if (selectedRole === 'parent') {
        // Just open the parent modal for now since there's no parent dashboard yet
        if(typeof openParentModal === 'function') openParentModal();
        // Reset dropdown to prevent stuck state
        document.getElementById('roleSwitcher').value = '';
    } else if (selectedRole === 'admin' || selectedRole === 'cs') {
        // Might redirect to admin dashboard, but for now reload map
        window.location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const roleSwitcher = document.getElementById('roleSwitcher') || document.getElementById('globalRoleSwitcher');
    const savedRole = localStorage.getItem('currentViewRole');
    if (savedRole && roleSwitcher) {
        // Prevent setting parent or it will reopen modal unexpectedly on load
        if(savedRole !== 'parent') {
            roleSwitcher.value = savedRole;
        }
    }
    
    const main = document.querySelector('.bento-main');
    if (main) main.style.paddingTop = '0px'; // Header is no longer fixed over content in a disruptive way
});
</script>`;
if (scriptRegex.test(html)) {
    html = html.replace(scriptRegex, newScript);
} else {
    html = html.replace('</body>', newScript + '\n</body>');
}

fs.writeFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', html, 'utf8');
console.log("UI Refinements Applied");
