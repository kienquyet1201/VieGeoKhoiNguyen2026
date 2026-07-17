const fs = require('fs');

function applyFixes() {
    console.log("Applying fixes...");

    // 1 & 2: Sửa map.html
    let htmlPath = 'C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html';
    if (fs.existsSync(htmlPath)) {
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // Fix Taskbar container: "Chỉnh thẻ cha thành flex flex-wrap gap-4 để responsive tốt."
        html = html.replace(/id="taskbarContainer" class="[^"]*"/, 'id="taskbarContainer" class="flex flex-wrap items-center gap-4 ml-auto justify-end w-full"');
        html = html.replace(/class="[^"]*"\s*id="taskbarContainer"/, 'class="flex flex-wrap items-center gap-4 ml-auto justify-end w-full" id="taskbarContainer"');
        
        // Đảm bảo nút Lớp và Phụ huynh có class: min-w-max whitespace-nowrap flex-shrink-0
        html = html.replace(/<select id="gradeSelectDropdown" onchange="window.selectGrade\(parseInt\(this.value\)\)" class="[^"]*"/, 
            '<select id="gradeSelectDropdown" onchange="window.selectGrade(parseInt(this.value))" class="bg-sky-600 text-white border-none outline-none px-4 py-2 rounded-full cursor-pointer min-w-max whitespace-nowrap flex-shrink-0"');
            
        html = html.replace(/<button class="[^"]*"\s*onclick="openParentModal\(\)"/g, 
            '<button class="bento-btn min-w-max whitespace-nowrap flex-shrink-0 px-4 py-2" onclick="openParentModal()"');

        // Role Switcher: Gỡ onclick/onchange cũ nếu có gọi DB, thay bằng client update
        html = html.replace(/<select id="globalRoleSwitcher".*?>[\s\S]*?<\/select>/g, 
            `<select id="globalRoleSwitcher" onchange="switchRoleClientOnly(this.value)" class="hidden bg-sky-600 text-white outline-none px-4 py-2 rounded-full cursor-pointer min-w-max whitespace-nowrap flex-shrink-0">
                <option value="" disabled selected>Đổi quyền...</option>
                <option value="admin">Quản trị viên (Admin)</option>
                <option value="cs">Chăm sóc KH (CS)</option>
                <option value="parent">Phụ huynh</option>
                <option value="student">Học sinh</option>
            </select>`);

        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log("Updated map.html");
    }

    // 1: Sửa style.css (Light Mode bg & text color)
    let cssPath = 'C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/style.css';
    if (fs.existsSync(cssPath)) {
        let css = fs.readFileSync(cssPath, 'utf8');
        
        // Remove old body.light-mode rules completely to avoid conflicts
        css = css.replace(/body\.light-mode\s*\{[^}]*\}/g, '');
        
        let newLightModeCSS = `
body.light-mode {
    --bg-dark: #f0f9ff !important;
    --card-bg: rgba(255, 255, 255, 0.9) !important;
    --border-color: #bae6fd !important;
    --text-primary: #0c4a6e !important;
    --text-secondary: #082f49 !important;
    --text-dim: #38bdf8 !important;
    background-color: #f0f9ff !important;
    color: #0c4a6e !important;
}
body.light-mode * {
    color: #0c4a6e;
}
body.light-mode .bento-card {
    background-color: #ffffff !important;
    color: #0c4a6e !important;
    border-color: #7dd3fc !important;
}
body.light-mode button, body.light-mode a, body.light-mode span, body.light-mode h1, body.light-mode h2, body.light-mode h3, body.light-mode p {
    color: #0c4a6e !important;
}
`;
        css += newLightModeCSS;
        fs.writeFileSync(cssPath, css, 'utf8');
        console.log("Updated style.css");
    }

    // 3 & 4: Sửa map.js (DOM Injection 63 Tỉnh Thành & Logic đổi Role Switcher client-side)
    let mapjsPath = 'C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.js';
    if (fs.existsSync(mapjsPath)) {
        let js = fs.readFileSync(mapjsPath, 'utf8');
        
        // Thay logic DOM Injection vào renderRegions và renderProvinces
        js = js.replace(/function renderRegions\(\) \{[\s\S]*?mapContainer\.appendChild\(card\);\s*\}\);*\s*\n?\}/, 
`function renderRegions() {
    mapContainer.style.display = 'flex';
    mapContainer.style.flexWrap = 'wrap';
    mapContainer.style.gap = '20px';
    mapContainer.style.justifyContent = 'center';
    
    let htmlContent = '';
    LEARNING_REGIONS.forEach((region, i) => {
        htmlContent += \`
            <div class="bento-card region-card" data-index="\${i}" style="cursor: pointer; border: 2px solid \${region.color}; background: #ffffff; color: #0c4a6e; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 280px; text-align: center;">
                <div style="font-size: 4rem; color: \${region.color};"><i class="fa-solid fa-map-location-dot"></i></div>
                <h3 style="font-size: 1.8rem; margin-top: 15px; font-weight: bold;">\${region.name}</h3>
                <p style="margin-top: 10px; font-size: 1.1rem;">\${region.provinces.length} Tỉnh/Thành phố</p>
            </div>
        \`;
    });
    mapContainer.innerHTML = htmlContent;

    // Add event listeners after innerHTML
    document.querySelectorAll('.region-card').forEach(card => {
        card.addEventListener('click', function() {
            let idx = this.getAttribute('data-index');
            selectedRegion = LEARNING_REGIONS[idx];
            currentView = 'provinces';
            renderMap();
        });
    });
}`);

        js = js.replace(/function renderProvinces\(\) \{[\s\S]*?mapContainer\.appendChild\(card\);\s*\}\);*\s*\n?\}/, 
`function renderProvinces() {
    mapContainer.style.display = 'flex';
    mapContainer.style.flexWrap = 'wrap';
    mapContainer.style.gap = '15px';
    mapContainer.style.justifyContent = 'center';
    
    let htmlContent = '';
    selectedRegion.provinces.forEach((prov, i) => {
        let bg = prov.isBoss ? 'rgba(255, 75, 75, 0.1)' : '#ffffff';
        let borderColor = prov.isBoss ? '#ff4b4b' : prov.color;
        htmlContent += \`
            <div class="bento-card province-card" data-index="\${i}" style="cursor: pointer; border: 2px solid \${borderColor}; background: \${bg}; color: #0c4a6e; padding: 20px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); width: 220px; text-align: center;">
                <h3 style="font-size: 1.4rem; font-weight: bold;">\${prov.name}</h3>
                <p style="margin-top: 5px;">\${prov.lessons ? prov.lessons.length : 0} Bài học</p>
            </div>
        \`;
    });
    mapContainer.innerHTML = htmlContent;

    document.querySelectorAll('.province-card').forEach(card => {
        card.addEventListener('click', function() {
            let idx = this.getAttribute('data-index');
            selectedProvince = selectedRegion.provinces[idx];
            currentView = 'lessons';
            renderMap();
        });
    });
}`);

        // Add role switcher logic
        if (!js.includes('switchRoleClientOnly')) {
            js += `\n
// ROLE SWITCHER - CLIENT ONLY
window.switchRoleClientOnly = function(newRole) {
    if(!newRole) return;
    state.currentRole = newRole; // Update local state only
    saveGameState(state);
    alert('Đã đổi quyền thành công sang: ' + newRole + ' (Chỉ có tác dụng trên giao diện hiện tại, không lưu vào database gốc).');
    // Refresh UI if necessary
    if(typeof updateStatsUI === 'function') updateStatsUI();
};
`;
        }

        fs.writeFileSync(mapjsPath, js, 'utf8');
        console.log("Updated map.js");
    }
}

applyFixes();
