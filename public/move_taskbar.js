const fs = require('fs');

let html = fs.readFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', 'utf8');

// 1. Ensure Sidebar has flex flex-col h-screen
html = html.replace(/<aside class="bento-sidebar">/, '<aside class="bento-sidebar flex flex-col h-screen">');
// Fallback if it already has other classes
html = html.replace(/<aside class="bento-sidebar flex flex-col h-screen flex flex-col h-screen">/, '<aside class="bento-sidebar flex flex-col h-screen">');

// 2. Extract taskbarContainer
// The layout of stats-header is:
// <div class="stats-header ...">
//   <div class="flex gap-4"> ... pills ... </div>
//   <div class="flex flex-wrap items-center gap-4 ml-auto justify-end" id="taskbarContainer"> ... utilities ... </div>
// </div>

const taskbarRegex = /<div class="flex flex-wrap items-center gap-4 ml-auto justify-end" id="taskbarContainer">([\s\S]*?)<\/div>\s*<\/div>/;
const match = html.match(taskbarRegex);

if (match) {
    // Remove taskbarContainer from stats-header
    html = html.replace(taskbarRegex, '</div>');

    // 3. Reformat taskbarContainer for Sidebar
    const newSidebarTools = `
            <div class="mt-auto flex flex-col gap-3 p-4 border-t border-slate-200 dark:border-slate-700 w-full" id="taskbarContainer">
                <select id="gradeSelectDropdown" onchange="window.selectGrade(parseInt(this.value))" class="bg-sky-600 text-white border-none outline-none px-4 py-2 rounded-lg cursor-pointer w-full text-left font-bold shadow-sm">
                    <option value="5">Lớp 5</option>
                    <option value="9">Lớp 9</option>
                    <option value="12">Lớp 12</option>
                </select>

                <a href="exam-arena.html" class="bento-btn w-full justify-start px-4 py-2 shadow-sm transition transform hover:scale-105" style="background: #ef4444; color: white; border-radius: 12px; font-size: 0.95rem; text-decoration: none;"><i class="fa-solid fa-graduation-cap mr-2"></i> Đấu trường</a>
                
                <button class="bento-btn w-full justify-start px-4 py-2 shadow-sm transition transform hover:scale-105" onclick="openParentModal()" title="Dành cho Phụ Huynh" style="background: #ce82ff; border-radius: 12px; color: white; font-size: 0.95rem;">
                    <i class="fa-solid fa-users mr-2"></i> Phụ Huynh
                </button>

                <select id="globalRoleSwitcher" onchange="window.switchRoleClientOnly(this.value)" class="bg-slate-700 dark:bg-slate-800 text-white outline-none px-4 py-2 rounded-lg cursor-pointer w-full text-left font-bold shadow-sm">
                    <option value="" disabled selected>Đổi quyền...</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                    <option value="cs">Chăm sóc KH (CS)</option>
                    <option value="teacher">Giáo viên (Teacher)</option>
                    <option value="parent">Phụ huynh</option>
                    <option value="student">Học sinh</option>
                </select>

                <!-- Icon Buttons Group -->
                <div class="flex items-center justify-center gap-2 mt-2">
                    <button class="bento-btn flex-1 px-3 py-2 flex items-center justify-center shadow-sm transition transform hover:scale-105" onclick="toggleTheme()" title="Sáng/Tối" style="background: var(--card-bg, rgba(255,255,255,0.1)); border-radius: 12px; color: var(--text-primary, white); font-size: 1.1rem; border: 1px solid var(--border-color, transparent);">
                        <i id="themeIcon" class="fa-solid fa-moon"></i>
                    </button>

                    <button class="bento-btn flex-1 px-3 py-2 flex items-center justify-center shadow-sm transition transform hover:scale-105" onclick="redoSurvey()" title="Cài đặt" style="background: var(--card-bg, rgba(255,255,255,0.1)); border-radius: 12px; color: var(--text-primary, white); font-size: 1.1rem; border: 1px solid var(--border-color, transparent);">
                        <i class="fa-solid fa-gear"></i>
                    </button>

                    <button class="bento-btn flex-1 px-3 py-2 flex items-center justify-center shadow-sm transition transform hover:scale-105" id="btnLogoutMap" title="Đăng Xuất" style="background: #ff4b4b; border-radius: 12px; color: white; font-size: 1.1rem;">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>
            </div>
        </aside>`;

    // 4. Inject into Sidebar
    html = html.replace(/<\/nav>\s*<\/aside>/, '</nav>' + newSidebarTools);
    fs.writeFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', html, 'utf8');
    console.log("Sidebar transformed successfully.");
} else {
    console.log("Could not find taskbarContainer to extract.");
    
    // Fallback: If it's already extracted or different format, forcefully remove the old taskbar by ID and append the new one.
    const fallbackRegex = /<div[^>]*id="taskbarContainer"[^>]*>[\s\S]*?<\/div>\s*(?=<\/div>|\s*<!-- PARENT PIN MODAL)/;
    if (fallbackRegex.test(html)) {
        html = html.replace(fallbackRegex, '');
        // Then insert into sidebar as above
        const newSidebarTools = `
            <div class="mt-auto flex flex-col gap-3 p-4 border-t border-slate-200 dark:border-slate-700 w-full" id="taskbarContainer">
                <select id="gradeSelectDropdown" onchange="window.selectGrade(parseInt(this.value))" class="bg-sky-600 text-white border-none outline-none px-4 py-2 rounded-lg cursor-pointer w-full text-left font-bold shadow-sm">
                    <option value="5">Lớp 5</option>
                    <option value="9">Lớp 9</option>
                    <option value="12">Lớp 12</option>
                </select>

                <a href="exam-arena.html" class="bento-btn w-full justify-start px-4 py-2 shadow-sm transition transform hover:scale-105" style="background: #ef4444; color: white; border-radius: 12px; font-size: 0.95rem; text-decoration: none;"><i class="fa-solid fa-graduation-cap mr-2"></i> Đấu trường</a>
                
                <button class="bento-btn w-full justify-start px-4 py-2 shadow-sm transition transform hover:scale-105" onclick="openParentModal()" title="Dành cho Phụ Huynh" style="background: #ce82ff; border-radius: 12px; color: white; font-size: 0.95rem;">
                    <i class="fa-solid fa-users mr-2"></i> Phụ Huynh
                </button>

                <select id="globalRoleSwitcher" onchange="window.switchRoleClientOnly(this.value)" class="bg-slate-700 dark:bg-slate-800 text-white outline-none px-4 py-2 rounded-lg cursor-pointer w-full text-left font-bold shadow-sm">
                    <option value="" disabled selected>Đổi quyền...</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                    <option value="cs">Chăm sóc KH (CS)</option>
                    <option value="teacher">Giáo viên (Teacher)</option>
                    <option value="parent">Phụ huynh</option>
                    <option value="student">Học sinh</option>
                </select>

                <!-- Icon Buttons Group -->
                <div class="flex items-center justify-center gap-2 mt-2">
                    <button class="bento-btn flex-1 px-3 py-2 flex items-center justify-center shadow-sm transition transform hover:scale-105" onclick="toggleTheme()" title="Sáng/Tối" style="background: var(--card-bg, rgba(255,255,255,0.1)); border-radius: 12px; color: var(--text-primary, white); font-size: 1.1rem; border: 1px solid var(--border-color, transparent);">
                        <i id="themeIcon" class="fa-solid fa-moon"></i>
                    </button>

                    <button class="bento-btn flex-1 px-3 py-2 flex items-center justify-center shadow-sm transition transform hover:scale-105" onclick="redoSurvey()" title="Cài đặt" style="background: var(--card-bg, rgba(255,255,255,0.1)); border-radius: 12px; color: var(--text-primary, white); font-size: 1.1rem; border: 1px solid var(--border-color, transparent);">
                        <i class="fa-solid fa-gear"></i>
                    </button>

                    <button class="bento-btn flex-1 px-3 py-2 flex items-center justify-center shadow-sm transition transform hover:scale-105" id="btnLogoutMap" title="Đăng Xuất" style="background: #ff4b4b; border-radius: 12px; color: white; font-size: 1.1rem;">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>
            </div>
        </aside>`;
        html = html.replace(/<\/nav>\s*<\/aside>/, '</nav>' + newSidebarTools);
        fs.writeFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', html, 'utf8');
        console.log("Sidebar transformed successfully via fallback.");
    }
}
