const fs = require('fs');
const path = require('path');

const rootDir = 'C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen';

function fixEncodingAndLayout() {
    console.log("Starting UTF-8 and Layout fixes...");

    // 1. Fix map.html UTF-8
    const mapHtmlPath = path.join(rootDir, 'public', 'map.html');
    if (fs.existsSync(mapHtmlPath)) {
        let html = fs.readFileSync(mapHtmlPath, 'utf8');
        
        // Ensure meta charset is present
        if (!html.includes('<meta charset="UTF-8">')) {
            html = html.replace('<head>', '<head>\n    <meta charset="UTF-8">');
        }

        // Fix mangled text
        html = html.replace(/L\?p/g, 'Lớp');
        html = html.replace(/Ph\? Huynh/g, 'Phụ Huynh');
        html = html.replace(/Ph\? huynh/g, 'Phụ huynh');
        html = html.replace(/Dang Xu\?t/g, 'Đăng Xuất');
        html = html.replace(/D\?i quy\?n\.\.\./g, 'Đổi quyền...');
        html = html.replace(/KhAm PhA Vit Nam/g, 'Khám Phá Việt Nam'); // If any other weird encoding exists
        html = html.replace(/T%nh\/ThAnh ph`/g, 'Tỉnh/Thành phố');

        fs.writeFileSync(mapHtmlPath, html, 'utf8');
        console.log("Fixed map.html");
    }

    // 2. Fix gamedata.js UTF-8
    const gamedataPath = path.join(rootDir, 'public', 'gamedata.js');
    if (fs.existsSync(gamedataPath)) {
        let gamedata = fs.readFileSync(gamedataPath, 'utf8');
        
        gamedata = gamedata.replace(/Mi\?n B\?c/g, 'Miền Bắc');
        gamedata = gamedata.replace(/Mi\?n Trung/g, 'Miền Trung');
        gamedata = gamedata.replace(/Mi\?n Nam/g, 'Miền Nam');
        gamedata = gamedata.replace(/Mi\?n/g, 'Miền');
        gamedata = gamedata.replace(/L\?i khi t\?o/g, 'Lỗi khi tạo');
        gamedata = gamedata.replace(/danh sch cc Mi\?n/g, 'danh sách các Miền');

        fs.writeFileSync(gamedataPath, gamedata, 'utf8');
        console.log("Fixed gamedata.js");
    }

    // 3. Fix map.js (UTF-8 + Layout + Dark/Light Mode Colors)
    const mapJsPath = path.join(rootDir, 'public', 'map.js');
    if (fs.existsSync(mapJsPath)) {
        let js = fs.readFileSync(mapJsPath, 'utf8');
        
        // Fix UTF-8
        js = js.replace(/KhAm PhA Vit Nam/g, 'Khám Phá Việt Nam');
        js = js.replace(/T%nh\/ThAnh ph`/g, 'Tỉnh/Thành phố');
        js = js.replace(/T\?nh\/Thnh ph\?/g, 'Tỉnh/Thành phố');
        
        // Fix renderRegions layout & dark mode
        // Note: The previous mapContainer.innerHTML used a string that we can replace
        // The container id is "interactive-map-container"
        js = js.replace(/<div id="interactive-map-container"[^>]*>/, '<div id="interactive-map-container" class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">');
        
        // Update the card HTML to support dark mode & better spacing
        // Replace old hardcoded colors with tailwind classes
        js = js.replace(/class="bento-card region-card"[\s\S]*?style="[^"]*"/g, 
            `class="bento-card region-card bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition transform hover:-translate-y-1 rounded-2xl p-8 cursor-pointer flex flex-col items-center justify-center h-full w-full" data-index="\${i}" style="border-top-width: 4px; border-top-color: \${region.color};"`);

        // If replacing above fails because of previous hardcoded styling, let's just do a robust regex replace on the entire innerHTML generation for renderRegions
        js = js.replace(/let htmlContent = '';\s*LEARNING_REGIONS\.forEach\(\(region, i\) => \{[\s\S]*?\}\);\s*mapContainer\.innerHTML = `<div id="interactive-map-container"[^>]*>[\s\S]*?<\/div>`;/, 
`let htmlContent = '';
    LEARNING_REGIONS.forEach((region, i) => {
        htmlContent += \`
            <div class="bento-card region-card bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition transform hover:-translate-y-1 rounded-2xl p-8 cursor-pointer flex flex-col items-center justify-center w-full" data-index="\${i}" style="border-top-width: 4px; border-top-color: \${region.color};">
                <div style="font-size: 4rem; color: \${region.color};"><i class="fa-solid fa-map-location-dot"></i></div>
                <h3 style="font-size: 1.8rem; margin-top: 15px; font-weight: bold;">\${region.name}</h3>
                <p style="margin-top: 10px; font-size: 1.1rem; opacity: 0.8;">\${region.provinces.length} Tỉnh/Thành phố</p>
            </div>
        \`;
    });
    mapContainer.innerHTML = \`<div id="interactive-map-container" class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
        <!-- BẮT ĐẦU: Khu vực chuẩn bị để nhúng SVG Bản đồ Việt Nam tương tác sau này -->
        \${htmlContent}
        <!-- KẾT THÚC: Khu vực chuẩn bị để nhúng SVG Bản đồ Việt Nam tương tác sau này -->
    </div>\`;`);

        // Fix renderProvinces layout & dark mode
        js = js.replace(/function renderProvinces\(\) \{[\s\S]*?mapContainer\.innerHTML = htmlContent;/g, 
`function renderProvinces() {
    mapContainer.style.display = 'grid';
    mapContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
    mapContainer.style.gap = '20px';
    
    let htmlContent = '';
    selectedRegion.provinces.forEach((prov, i) => {
        let isBossClass = prov.isBoss ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800';
        htmlContent += \`
            <div class="bento-card province-card \${isBossClass} text-slate-900 dark:text-white border shadow-sm hover:shadow-md transition transform hover:-translate-y-1 rounded-xl p-5 cursor-pointer flex flex-col items-center text-center w-full" data-index="\${i}" style="border-top-width: 4px; border-top-color: \${prov.isBoss ? '#ef4444' : prov.color};">
                <h3 style="font-size: 1.4rem; font-weight: bold;">\${prov.name}</h3>
                <p style="margin-top: 8px; opacity: 0.8;">\${prov.lessons ? prov.lessons.length : 0} Bài học</p>
            </div>
        \`;
    });
    mapContainer.innerHTML = htmlContent;`);

        fs.writeFileSync(mapJsPath, js, 'utf8');
        console.log("Fixed map.js");
    }

    console.log("Fixes complete.");
}

fixEncodingAndLayout();
