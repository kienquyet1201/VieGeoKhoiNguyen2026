const fs = require('fs');

let html = fs.readFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', 'utf8');

// The issue might be that taskbarContainer got duplicated or messy.
// Let's completely recreate the stats-header to ensure it is clean, singular, and has z-50.
const cleanStatsHeader = `
            <!-- Global Stats Header -->
            <div class="stats-header z-50 relative flex flex-wrap items-center justify-between w-full p-4 bg-white/10 backdrop-blur-md border-b border-white/20">
                <div class="flex gap-4">
                    <div class="stat-pill" style="color: #ff4b4b;"><i class="fa-solid fa-heart"></i> <span id="hdrHearts">5</span></div>
                    <div class="stat-pill" style="color: #ffc800;"><i class="fa-solid fa-fire"></i> <span id="hdrStreak">1</span></div>
                    <div class="stat-pill" style="color: #1cb0f6;"><i class="fa-solid fa-gem"></i> <span id="hdrGems">100</span></div>
                    <div class="stat-pill" style="color: #58cc02;"><i class="fa-solid fa-star"></i> <span id="hdrXp">0</span></div>
                    <div class="stat-pill" style="color: #ce82ff;"><i class="fa-solid fa-shield-halved"></i> Lv.<span id="hdrLevel">1</span></div>
                    <div class="stat-pill" style="color: #ff9600;"><i class="fa-solid fa-medal"></i> <span id="hdrBadge">0</span></div>
                </div>
                
                <div class="flex flex-wrap items-center gap-4 ml-auto justify-end" id="taskbarContainer">
                    <select id="gradeSelectDropdown" onchange="window.selectGrade(parseInt(this.value))" class="bg-sky-600 text-white border-none outline-none px-4 py-2 rounded-full cursor-pointer min-w-max whitespace-nowrap flex-shrink-0">
                        <option value="5">Lớp 5</option>
                        <option value="9">Lớp 9</option>
                        <option value="12">Lớp 12</option>
                    </select>

                    <button class="bento-btn min-w-max whitespace-nowrap flex-shrink-0 px-3 py-2 leading-normal" onclick="toggleTheme()" title="Sáng/Tối" style="background: var(--card-bg, rgba(255,255,255,0.1)); border-radius: 20px; color: var(--text-primary, white); font-size: 0.9rem; border: 1px solid var(--border-color, transparent);">
                        <i id="themeIcon" class="fa-solid fa-moon"></i>
                    </button>

                    <button class="bento-btn min-w-max whitespace-nowrap flex-shrink-0 px-3 py-2 leading-normal" onclick="redoSurvey()" title="Cài đặt" style="background: var(--card-bg, rgba(255,255,255,0.1)); border-radius: 20px; color: var(--text-primary, white); font-size: 0.9rem; border: 1px solid var(--border-color, transparent);">
                        <i class="fa-solid fa-gear"></i>
                    </button>

                    <a href="exam-arena.html" class="bento-btn min-w-max whitespace-nowrap flex-shrink-0 px-4 py-2" style="background: #ef4444; color: white; border-radius: 20px; font-size: 0.9rem; text-decoration: none;"><i class="fa-solid fa-graduation-cap"></i> Đấu trường</a>
                    
                    <button class="bento-btn min-w-max whitespace-nowrap flex-shrink-0 px-4 py-2" onclick="openParentModal()" title="Dành cho Phụ Huynh" style="background: #ce82ff; border-radius: 20px; color: white; font-size: 0.9rem;">
                        <i class="fa-solid fa-users"></i> Phụ Huynh
                    </button>

                    <select id="globalRoleSwitcher" onchange="window.switchRoleClientOnly(this.value)" class="bg-sky-600 text-white outline-none px-4 py-2 rounded-full cursor-pointer min-w-max whitespace-nowrap flex-shrink-0">
                        <option value="" disabled selected>Đổi quyền...</option>
                        <option value="admin">Quản trị viên (Admin)</option>
                        <option value="cs">Chăm sóc KH (CS)</option>
                        <option value="teacher">Giáo viên (Teacher)</option>
                        <option value="parent">Phụ huynh</option>
                        <option value="student">Học sinh</option>
                    </select>

                    <button class="bento-btn min-w-max whitespace-nowrap flex-shrink-0 px-3 py-2 leading-normal" id="btnLogoutMap" title="Đăng Xuất" style="background: #ff4b4b; border-radius: 20px; color: white; font-size: 0.9rem;">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>
            </div>`;

// Replace all stats-headers with the single clean one
const parts = html.split(/<div class="stats-header"[\s\S]*?<!-- PARENT PIN MODAL -->/);
if (parts.length > 1) {
    html = parts[0] + cleanStatsHeader + '\n            <!-- PARENT PIN MODAL -->' + parts[parts.length - 1];
} else {
    // If that didn't match, maybe it has z-50 relative already
    const parts2 = html.split(/<div class="stats-header z-50 relative"[\s\S]*?<!-- PARENT PIN MODAL -->/);
    if (parts2.length > 1) {
        html = parts2[0] + cleanStatsHeader + '\n            <!-- PARENT PIN MODAL -->' + parts2[parts2.length - 1];
    } else {
        // Broad regex replacement
        html = html.replace(/<div class="stats-header[\s\S]*?<!-- PARENT PIN MODAL -->/g, cleanStatsHeader + '\n            <!-- PARENT PIN MODAL -->');
    }
}

// Add the JS logic for switchRoleClientOnly if not already present
if (!html.includes('function switchRoleClientOnly')) {
    html = html.replace('</body>', `
<script>
window.switchRoleClientOnly = function(selectedRole) {
    if (!selectedRole) return;
    localStorage.setItem('currentViewRole', selectedRole);
    // Reload page to apply changes safely without modifying Firebase DB
    window.location.reload();
};

document.addEventListener('DOMContentLoaded', () => {
    const roleSwitcher = document.getElementById('globalRoleSwitcher');
    const savedRole = localStorage.getItem('currentViewRole');
    if (savedRole && roleSwitcher) {
        roleSwitcher.value = savedRole;
    }
    
    // UI adjustment to prevent overlap: ensure bento-main has padding top if header is fixed/sticky
    const main = document.querySelector('.bento-main');
    if (main) main.style.paddingTop = '10px';
});
</script>
</body>`);
}

fs.writeFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', html, 'utf8');
console.log("Cleanup and Logic applied.");
